import os
import sys
import json
import tempfile
import urllib.parse
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

# Ensure ffmpeg and ffprobe are in PATH
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    print(f"Warning static_ffmpeg: {e}")

import yt_dlp

PORT = 5000
DOWNLOAD_DIR = os.path.join(tempfile.gettempdir(), 'downloader_cache')
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def get_stream_codecs(file_path):
    """Inspect file to find video and audio codec names using ffprobe."""
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'stream=codec_name,codec_type',
            '-of', 'json', file_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            v_codec = next((s['codec_name'] for s in data.get('streams', []) if s.get('codec_type') == 'video'), None)
            a_codec = next((s['codec_name'] for s in data.get('streams', []) if s.get('codec_type') == 'audio'), None)
            return v_codec, a_codec
    except Exception as e:
        print(f"ffprobe error: {e}")
    return None, None

def convert_to_universal_mp4(input_file, output_file):
    """
    Ensure the MP4 file uses H.264 (AVC) video and AAC audio with +faststart.
    This guarantees 100% compatibility with Windows Media Player, iOS, Mac, and Android.
    """
    v_codec, a_codec = get_stream_codecs(input_file)
    print(f"Detected input codecs: video={v_codec}, audio={a_codec}")

    # If already H.264 and AAC, fast stream copy!
    if v_codec in ('h264', 'avc1') and a_codec in ('aac', 'mp4a'):
        v_args = ['-c:v', 'copy']
        a_args = ['-c:a', 'copy']
    else:
        # Re-encode video if it's VP9, AV1, etc.
        v_args = ['-c:v', 'copy'] if v_codec in ('h264', 'avc1') else ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22', '-pix_fmt', 'yuv420p']
        # Re-encode audio if it's Opus, Vorbis, etc.
        a_args = ['-c:a', 'copy'] if a_codec in ('aac', 'mp4a') else ['-c:a', 'aac', '-b:a', '192k']

    cmd = [
        'ffmpeg', '-y',
        '-i', input_file,
        *v_args,
        *a_args,
        '-movflags', '+faststart',
        output_file
    ]
    print(f"Running ffmpeg remux: {' '.join(cmd)}")
    subprocess.run(cmd, check=True, timeout=120)

class DownloaderHandler(BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/health':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'backend': 'yt-dlp', 'ffmpeg': True}).encode('utf-8'))
            return

        if path == '/api/info':
            url = query.get('url', [None])[0]
            if not url:
                self.send_error_json(400, 'Parameter "url" diperlukan.')
                return
            self.handle_info(url)
            return

        if path == '/api/download':
            url = query.get('url', [None])[0]
            format_type = query.get('type', ['video'])[0]  # video or audio
            quality = query.get('quality', ['best'])[0]     # 2160, 1080, 720, 480, best
            if not url:
                self.send_error_json(400, 'Parameter "url" diperlukan.')
                return
            self.handle_download(url, format_type, quality)
            return

        self.send_error_json(404, 'Endpoint tidak ditemukan.')

    def send_error_json(self, code, message):
        self.send_response(code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))

    def handle_info(self, url):
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'extract_flat': False,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    self.send_error_json(400, 'Tidak dapat mengekstrak informasi media.')
                    return

                extractor = info.get('extractor_key', info.get('extractor', 'unknown')).lower()
                platform = 'unknown'
                if 'youtube' in extractor:
                    platform = 'youtube'
                elif 'tiktok' in extractor:
                    platform = 'tiktok'
                elif 'instagram' in extractor:
                    platform = 'instagram'
                elif 'twitter' in extractor or 'x' in extractor:
                    platform = 'twitter'
                elif 'facebook' in extractor:
                    platform = 'facebook'
                elif 'reddit' in extractor:
                    platform = 'reddit'
                elif 'pinterest' in extractor:
                    platform = 'pinterest'
                elif 'threads' in extractor:
                    platform = 'threads'
                elif 'soundcloud' in extractor:
                    platform = 'soundcloud'

                title = info.get('title') or 'Video Media'
                author = info.get('uploader') or info.get('creator') or info.get('channel') or '@creator'
                thumbnail = info.get('thumbnail') or ''
                duration_sec = info.get('duration') or 0
                minutes = int(duration_sec // 60)
                seconds = int(duration_sec % 60)
                duration = f"{minutes}:{seconds:02d}" if duration_sec else "HD"

                # Video preview URL: For YouTube, use clean embed
                video_preview_url = ''
                if platform == 'youtube' and info.get('id'):
                    video_preview_url = f"https://www.youtube.com/embed/{info.get('id')}?autoplay=1"
                else:
                    video_preview_url = info.get('url') or ''

                raw_formats = info.get('formats', [])
                video_options = []
                audio_options = []

                # Group available heights and prioritize H.264
                heights_seen = set()
                # Sort formats so AVC1 (h264) comes first
                sorted_formats = sorted(
                    raw_formats,
                    key=lambda f: (
                        1 if (f.get('vcodec', '') or '').startswith(('avc1', 'h264')) else 0,
                        f.get('height') or 0
                    ),
                    reverse=True
                )

                for f in sorted_formats:
                    h = f.get('height')
                    vcodec = f.get('vcodec') or ''

                    if h and h >= 240 and vcodec != 'none':
                        if h not in heights_seen:
                            heights_seen.add(h)
                            filesize = f.get('filesize') or f.get('filesize_approx') or 0
                            size_str = f"{filesize / (1024*1024):.1f} MB" if filesize else "Kualitas Asli"
                            label = f"{h}p ({'4K UHD' if h >= 2160 else '2K QHD' if h >= 1440 else 'Full HD' if h >= 1080 else 'HD' if h >= 720 else 'SD'})"
                            video_options.append({
                                'id': f"v_{h}",
                                'label': label,
                                'resolution': f"{f.get('width', h)}x{h}",
                                'ext': 'mp4',
                                'size': size_str,
                                'qualityNote': 'Tanpa Watermark' if platform == 'tiktok' else 'Format MP4 Universal (H.264 + AAC)',
                                'hasAudio': True,
                                'isRecommended': h == 1080 or (h == 720 and 1080 not in heights_seen),
                                'qualityValue': str(h)
                            })

                if not video_options:
                    video_options.append({
                        'id': 'v_best',
                        'label': 'Resolusi Penuh (Format Universal MP4)',
                        'resolution': 'Original',
                        'ext': 'mp4',
                        'size': 'Direct File',
                        'qualityNote': 'H.264 + AAC Kompatibel Semua Perangkat',
                        'hasAudio': True,
                        'isRecommended': True,
                        'qualityValue': 'best'
                    })

                video_options.sort(key=lambda x: int(x['id'].replace('v_', '')) if x['id'].replace('v_', '').isdigit() else 9999, reverse=True)

                audio_options.append({
                    'id': 'a_320',
                    'label': 'Audio MP3 (Universal)',
                    'bitrate': '320 kbps',
                    'ext': 'mp3',
                    'size': 'Audio File',
                    'qualityNote': 'MP3 Standard Kompatibel 100%',
                    'hasAudio': True,
                    'isRecommended': True,
                    'qualityValue': 'best'
                })

                data = {
                    'id': str(info.get('id', 'media')),
                    'originalUrl': url,
                    'title': title,
                    'author': author,
                    'authorAvatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    'thumbnailUrl': thumbnail,
                    'videoPreviewUrl': video_preview_url,
                    'duration': duration,
                    'views': f"{info.get('view_count', 0):,} tayangan" if info.get('view_count') else "HD Original",
                    'platform': platform,
                    'formats': {
                        'videos': video_options[:6],
                        'audios': audio_options,
                        'subtitles': []
                    }
                }

                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode('utf-8'))
        except Exception as e:
            self.send_error_json(500, f"Gagal mengekstrak: {str(e)[:120]}")

    def handle_download(self, url, format_type, quality):
        pid = os.getpid()
        target_id = f"dl_{pid}_{abs(hash(url)) % 100000}"
        raw_output_template = os.path.join(DOWNLOAD_DIR, f"{target_id}_raw.%(ext)s")
        final_output_file = os.path.join(DOWNLOAD_DIR, f"{target_id}_final.{ 'mp3' if format_type == 'audio' else 'mp4' }")
        
        ydl_opts = {
            'outtmpl': raw_output_template,
            'quiet': True,
            'no_warnings': True,
            'overwrites': True,
        }

        if format_type == 'audio':
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }]
        else:
            # Video: Prioritize AVC1 (H.264) + M4A (AAC) for instant compatibility!
            if quality and quality.isdigit():
                ydl_opts['format'] = (
                    f"bestvideo[height<={quality}][vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
                    f"bestvideo[height<={quality}][vcodec^=avc]+bestaudio[ext=m4a]/"
                    f"bestvideo[height<={quality}]+bestaudio[ext=m4a]/"
                    f"bestvideo[height<={quality}]+bestaudio/"
                    f"best[height<={quality}]/best"
                )
            else:
                ydl_opts['format'] = (
                    "bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/"
                    "bestvideo[vcodec^=avc]+bestaudio[ext=m4a]/"
                    "bestvideo+bestaudio[ext=m4a]/"
                    "bestvideo+bestaudio/best"
                )
            ydl_opts['merge_output_format'] = 'mp4'

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
                # Identify raw downloaded file
                matching = [os.path.join(DOWNLOAD_DIR, f) for f in os.listdir(DOWNLOAD_DIR) if f.startswith(f"{target_id}_raw")]
                if not matching:
                    # Check any file with target_id
                    matching = [os.path.join(DOWNLOAD_DIR, f) for f in os.listdir(DOWNLOAD_DIR) if target_id in f and not f.endswith('.part')]
                
                if not matching:
                    self.send_error_json(500, "File hasil unduhan tidak ditemukan.")
                    return

                downloaded_file = matching[0]

                # If audio, yt-dlp might have already created .mp3
                if format_type == 'audio':
                    base, _ = os.path.splitext(downloaded_file)
                    if os.path.exists(base + '.mp3'):
                        file_to_send = base + '.mp3'
                    else:
                        file_to_send = downloaded_file
                else:
                    # Video: Run convert_to_universal_mp4 to guarantee H.264 + AAC + faststart!
                    try:
                        convert_to_universal_mp4(downloaded_file, final_output_file)
                        file_to_send = final_output_file
                    except Exception as conv_err:
                        print(f"Conversion warning: {conv_err}, sending raw downloaded file")
                        file_to_send = downloaded_file

                filesize = os.path.getsize(file_to_send)
                clean_title = "".join(c for c in info.get('title', 'video') if c.isalnum() or c in (' ', '_', '-')).strip()[:40] or 'media'
                ext = 'mp3' if format_type == 'audio' else 'mp4'
                download_name = f"{clean_title}.{ext}"

                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'audio/mpeg' if ext == 'mp3' else 'video/mp4')
                self.send_header('Content-Length', str(filesize))
                self.send_header('Content-Disposition', f'attachment; filename="{download_name}"')
                self.end_headers()

                with open(file_to_send, 'rb') as f:
                    while chunk := f.read(128 * 1024):
                        self.wfile.write(chunk)

                # Cleanup temporary files
                for f in os.listdir(DOWNLOAD_DIR):
                    if target_id in f:
                        try:
                            os.remove(os.path.join(DOWNLOAD_DIR, f))
                        except Exception:
                            pass

        except Exception as e:
            self.send_error_json(500, f"Gagal mendownload media: {str(e)[:120]}")

def run():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, DownloaderHandler)
    print(f"🚀 Downloader Backend Server running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
