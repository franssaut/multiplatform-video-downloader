import os
import sys
import json
import re
import time
import uuid
import socket
import ipaddress
import tempfile
import threading
import urllib.parse
import subprocess
from collections import defaultdict
from http.server import HTTPServer, BaseHTTPRequestHandler

# Ensure ffmpeg and ffprobe are in PATH
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    print(f"Warning static_ffmpeg: {e}")

import yt_dlp

PORT = 5000
MAX_URL_LENGTH = 2048
MAX_DURATION_SECONDS = 14400  # 4 hours max
MAX_FILESIZE_BYTES = 750 * 1024 * 1024  # 750 MB max

# Thread-safe in-memory rate limiter
class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        with self.lock:
            cutoff = now - self.window_seconds
            timestamps = [t for t in self.requests[client_ip] if t > cutoff]
            if len(timestamps) >= self.max_requests:
                self.requests[client_ip] = timestamps
                return False
            timestamps.append(now)
            self.requests[client_ip] = timestamps
            return True

info_limiter = RateLimiter(max_requests=40, window_seconds=60)      # 40 info queries / min
download_limiter = RateLimiter(max_requests=10, window_seconds=60)  # 10 downloads / min

def validate_and_sanitize_url(url_str: str):
    """
    Strict URL validation to defend against SSRF (Server-Side Request Forgery).
    Blocks private IP addresses, loopback, link-local, and unauthorized protocols.
    """
    if not url_str or len(url_str) > MAX_URL_LENGTH:
        return False, 'Panjang URL melebihi batas yang diizinkan (maksimal 2048 karakter).'

    clean = url_str.strip()
    try:
        parsed = urllib.parse.urlparse(clean)
    except Exception:
        return False, 'Format URL tidak valid.'

    if parsed.scheme.lower() not in ('http', 'https'):
        return False, 'Hanya protokol HTTP dan HTTPS yang diizinkan.'

    hostname = parsed.hostname
    if not hostname:
        return False, 'Alamat domain/hostname tidak valid.'

    hostname_lower = hostname.lower()
    if hostname_lower in ('localhost', '127.0.0.1', '::1', '0.0.0.0'):
        return False, 'Akses ke loopback / localhost dilarang.'

    # DNS Resolution check against private & reserved IP ranges
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip = ipaddress.ip_address(ip_str)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False, f'Akses ke alamat IP privat ({ip_str}) dilarang demi keamanan sistem.'
    except socket.gaierror:
        return False, 'Domain tidak dapat ditemukan atau tidak terdaftar di DNS.'
    except Exception as e:
        return False, f'Validasi keamanan domain gagal: {str(e)[:60]}'

    return True, clean

def sanitize_filename(name: str, fallback: str = "media", max_len: int = 50) -> str:
    """Sanitize filename to prevent header injection (CRLF) and directory traversal."""
    # Strip any control chars, newlines, quotes, colons, slashes
    clean = re.sub(r'[\r\n\t\x00-\x1f"\\/<>:|?*]', '', name).strip()
    clean = re.sub(r'\s+', '_', clean)
    return clean[:max_len] if clean else fallback

def get_stream_codecs(file_path: str):
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

def convert_to_universal_mp4(input_file: str, output_file: str):
    """
    Ensure the MP4 file uses H.264 (AVC) video and AAC audio with +faststart.
    Guarantees 100% compatibility with Windows Media Player, iOS, Mac, and Android.
    """
    v_codec, a_codec = get_stream_codecs(input_file)

    # If already H.264 and AAC, fast stream copy!
    if v_codec in ('h264', 'avc1') and a_codec in ('aac', 'mp4a'):
        v_args = ['-c:v', 'copy']
        a_args = ['-c:a', 'copy']
    else:
        v_args = ['-c:v', 'copy'] if v_codec in ('h264', 'avc1') else ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22', '-pix_fmt', 'yuv420p']
        a_args = ['-c:a', 'copy'] if a_codec in ('aac', 'mp4a') else ['-c:a', 'aac', '-b:a', '192k']

    cmd = [
        'ffmpeg', '-y',
        '-i', input_file,
        *v_args,
        *a_args,
        '-movflags', '+faststart',
        output_file
    ]
    subprocess.run(cmd, check=True, timeout=180)

class DownloaderHandler(BaseHTTPRequestHandler):
    def get_client_ip(self) -> str:
        # Check X-Forwarded-For if behind reverse proxy, else client_address
        forwarded = self.headers.get('X-Forwarded-For')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return self.client_address[0]

    def send_security_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_security_headers()
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        client_ip = self.get_client_ip()

        if path == '/api/health':
            self.send_response(200)
            self.send_security_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'backend': 'yt-dlp', 'ffmpeg': True, 'security': 'hardened'}).encode('utf-8'))
            return

        if path == '/api/info':
            # Rate limiting
            if not info_limiter.is_allowed(client_ip):
                self.send_error_json(429, 'Terlalu banyak permintaan (Rate limit). Silakan tunggu sebentar.')
                return

            raw_url = query.get('url', [None])[0]
            is_valid, validated_url = validate_and_sanitize_url(raw_url)
            if not is_valid:
                self.send_error_json(400, validated_url)
                return

            self.handle_info(validated_url)
            return

        if path == '/api/download':
            # Rate limiting
            if not download_limiter.is_allowed(client_ip):
                self.send_error_json(429, 'Batas pengunduhan per menit tercapai. Silakan tunggu 1 menit.')
                return

            raw_url = query.get('url', [None])[0]
            is_valid, validated_url = validate_and_sanitize_url(raw_url)
            if not is_valid:
                self.send_error_json(400, validated_url)
                return

            format_type = query.get('type', ['video'])[0]
            if format_type not in ('video', 'audio'):
                format_type = 'video'

            raw_quality = query.get('quality', ['best'])[0]
            # Sanitize quality parameter (only alphanumeric, e.g. '1080', '720', 'best')
            quality = re.sub(r'[^a-zA-Z0-9]', '', raw_quality)[:10] or 'best'

            self.handle_download(validated_url, format_type, quality)
            return

        self.send_error_json(404, 'Endpoint tidak ditemukan.')

    def send_error_json(self, code: int, message: str):
        self.send_response(code)
        self.send_security_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))

    def handle_info(self, url: str):
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

                # Duration check for DoS defense
                duration_sec = info.get('duration') or 0
                if duration_sec > MAX_DURATION_SECONDS:
                    self.send_error_json(400, f'Durasi video melebihi batas maksimal 4 jam ({duration_sec // 3600} jam).')
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
                
                minutes = int(duration_sec // 60)
                seconds = int(duration_sec % 60)
                duration = f"{minutes}:{seconds:02d}" if duration_sec else "HD"

                video_preview_url = ''
                if platform == 'youtube' and info.get('id'):
                    video_preview_url = f"https://www.youtube.com/embed/{info.get('id')}?autoplay=1"
                else:
                    video_preview_url = info.get('url') or ''

                raw_formats = info.get('formats', [])
                video_options = []
                audio_options = []

                heights_seen = set()
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
                self.send_security_headers()
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode('utf-8'))
        except Exception as e:
            # Sanitized error message without leaking internal paths
            clean_err = re.sub(r'([A-Za-z]:\\[^:\n\r]+|\/[a-zA-Z0-9_\-\.\/]+)', '[path]', str(e))
            self.send_error_json(500, f"Gagal mengekstrak informasi media: {clean_err[:100]}")

    def handle_download(self, url: str, format_type: str, quality: str):
        # Create an isolated temporary directory per job to prevent file collisions or race conditions
        with tempfile.TemporaryDirectory(prefix="omnidl_") as job_dir:
            job_uuid = uuid.uuid4().hex
            raw_output_template = os.path.join(job_dir, f"{job_uuid}_raw.%(ext)s")
            final_output_file = os.path.join(job_dir, f"{job_uuid}_final.{ 'mp3' if format_type == 'audio' else 'mp4' }")

            ydl_opts = {
                'outtmpl': raw_output_template,
                'quiet': True,
                'no_warnings': True,
                'max_filesize': MAX_FILESIZE_BYTES,
            }

            if format_type == 'audio':
                ydl_opts['format'] = 'bestaudio/best'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320',
                }]
            else:
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
                    if not info:
                        self.send_error_json(400, "Tidak dapat memproses konten media dari tautan ini.")
                        return

                    # Find downloaded file inside isolated job_dir
                    job_files = [os.path.join(job_dir, f) for f in os.listdir(job_dir) if not f.endswith('.part')]
                    if not job_files:
                        self.send_error_json(500, "File hasil unduhan tidak ditemukan.")
                        return

                    downloaded_file = job_files[0]

                    if format_type == 'audio':
                        base, _ = os.path.splitext(downloaded_file)
                        if os.path.exists(base + '.mp3'):
                            file_to_send = base + '.mp3'
                        else:
                            file_to_send = downloaded_file
                    else:
                        try:
                            convert_to_universal_mp4(downloaded_file, final_output_file)
                            file_to_send = final_output_file
                        except Exception as conv_err:
                            print(f"Conversion warning: {conv_err}, sending raw downloaded file")
                            file_to_send = downloaded_file

                    filesize = os.path.getsize(file_to_send)
                    raw_title = info.get('title') or 'media'
                    clean_name = sanitize_filename(raw_title)
                    ext = 'mp3' if format_type == 'audio' else 'mp4'
                    download_filename = f"{clean_name}.{ext}"
                    encoded_filename = urllib.parse.quote(download_filename)

                    self.send_response(200)
                    self.send_security_headers()
                    self.send_header('Content-Type', 'audio/mpeg' if ext == 'mp3' else 'video/mp4')
                    self.send_header('Content-Length', str(filesize))
                    # Prevent CRLF and header injection via sanitized & encoded filename
                    self.send_header('Content-Disposition', f'attachment; filename="{download_filename}"; filename*=UTF-8\'\'{encoded_filename}')
                    self.end_headers()

                    # Stream file safely in chunks
                    with open(file_to_send, 'rb') as f:
                        while chunk := f.read(128 * 1024):
                            self.wfile.write(chunk)

            except Exception as e:
                clean_err = re.sub(r'([A-Za-z]:\\[^:\n\r]+|\/[a-zA-Z0-9_\-\.\/]+)', '[path]', str(e))
                self.send_error_json(500, f"Gagal mengunduh media: {clean_err[:100]}")

def run():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, DownloaderHandler)
    print(f"🔒 Hardened Downloader Backend Server running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
