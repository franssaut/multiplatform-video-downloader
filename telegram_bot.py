import os
import sys
import re
import uuid
import time
import shutil
import tempfile
import subprocess
import urllib.parse
from datetime import datetime

import telebot
from telebot import types
import requests
from dotenv import load_dotenv

# Ensure ffmpeg/ffprobe are available in PATH
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    print(f"Warning static_ffmpeg: {e}")

import yt_dlp
import server

# Load environment variables
load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000").rstrip("/")

# Increase telebot network timeouts for uploading media files
telebot.apihelper.READ_TIMEOUT = 300
telebot.apihelper.CONNECT_TIMEOUT = 60

# In-memory storage for media info caches (mapped by short id)
MEDIA_CACHE = {}
CACHE_EXPIRY = 3600  # 1 hour

def clean_expired_cache():
    now = time.time()
    expired = [k for k, v in MEDIA_CACHE.items() if now - v.get("time", 0) > CACHE_EXPIRY]
    for k in expired:
        MEDIA_CACHE.pop(k, None)

def extract_urls(text: str):
    """Find HTTP/HTTPS URLs in user message."""
    if not text:
        return []
    url_pattern = r'https?://[^\s<>"]+'
    return re.findall(url_pattern, text)

def get_media_info(url: str):
    """Fetch media info either from backend server or direct yt_dlp fallback."""
    if BACKEND_URL:
        try:
            resp = requests.get(f"{BACKEND_URL}/api/info", params={"url": url}, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if "title" in data:
                    return True, data
            elif resp.status_code == 401:
                err_data = resp.json()
                return False, err_data.get('error', 'Instagram Stories memerlukan login.')
        except Exception:
            pass

    # Direct fallback using local yt-dlp
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extract_flat': False,
    }
    cookie_path = server.get_cookie_file()
    if cookie_path:
        ydl_opts['cookiefile'] = cookie_path

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            raw_info = ydl.extract_info(url, download=False)
            if not raw_info:
                return False, "Tidak dapat mengekstrak informasi media dari link ini."

            # Unpack playlist / story container
            info = server.extract_single_entry(raw_info, url)
            if not info:
                return False, "Tidak ada konten media yang ditemukan pada tautan ini."

            duration_sec = info.get('duration') or 0
            minutes = int(duration_sec // 60)
            seconds = int(duration_sec % 60)
            duration = f"{minutes}:{seconds:02d}" if duration_sec else "HD"

            extractor = info.get('extractor_key', info.get('extractor', 'unknown')).lower()
            platform = 'Video'
            if 'youtube' in extractor:
                platform = 'YouTube'
            elif 'tiktok' in extractor:
                platform = 'TikTok'
            elif 'instagram' in extractor:
                platform = 'Instagram Story' if '/stories/' in url else 'Instagram'
            elif 'twitter' in extractor or 'x' in extractor:
                platform = 'Twitter/X'
            elif 'facebook' in extractor:
                platform = 'Facebook'
            elif 'reddit' in extractor:
                platform = 'Reddit'
            elif 'pinterest' in extractor:
                platform = 'Pinterest'
            elif 'threads' in extractor:
                platform = 'Threads'
            elif 'soundcloud' in extractor:
                platform = 'SoundCloud'

            # Detect if story is an image
            is_image = False
            raw_ext = (info.get('ext') or '').lower()
            if raw_ext in ('jpg', 'jpeg', 'png', 'webp') or not info.get('formats'):
                if not duration_sec and ('story' in platform.lower() or '/stories/' in url):
                    is_image = True

            data = {
                'id': str(info.get('id', 'media')),
                'originalUrl': url,
                'title': info.get('title') or ('Instagram Story' if 'instagram' in platform.lower() else 'Media File'),
                'author': info.get('uploader') or info.get('creator') or info.get('channel') or '@creator',
                'thumbnailUrl': info.get('thumbnail') or info.get('url') or '',
                'duration': "Foto" if is_image else duration,
                'platform': platform,
                'isImage': is_image
            }
            return True, data
    except Exception as e:
        raw_err = str(e)
        if 'log in to access this content' in raw_err.lower() or 'cookies' in raw_err.lower():
            return False, (
                "⚠️ <b>Instagram Story Memerlukan Login Instagram</b>\n\n"
                "Instagram membatasi akses Story hanya untuk akun yang login.\n\n"
                "💡 <b>Cara Mengaktifkannya:</b>\n"
                "1. Pasang ekstensi browser Chrome/Edge: <b>Get cookies.txt LOCALLY</b>\n"
                "2. Buka Instagram di browser & pastikan Anda sudah login\n"
                "3. Ekspor cookies dengan ekstensi tersebut (format Netscape)\n"
                "4. Simpan file dengan nama <code>cookies.txt</code> di folder aplikasi OmniDownloader"
            )
        clean_err = re.sub(r'([A-Za-z]:\\[^:\n\r]+|\/[a-zA-Z0-9_\-\.\/]+)', '[path]', raw_err)
        return False, f"Gagal membaca link: {clean_err[:120]}"

def process_video_file(downloaded_file: str, final_output_file: str) -> str:
    """
    Optimizes video for Telegram without inflating file size.
    Uses stream copy + faststart whenever possible for speed and zero quality loss.
    """
    v_codec, a_codec = server.get_stream_codecs(downloaded_file)
    print(f"Detected codecs: video={v_codec}, audio={a_codec}")

    # If already mp4 container and common codec, perform fast stream copy
    if downloaded_file.lower().endswith('.mp4'):
        try:
            cmd = ['ffmpeg', '-y', '-i', downloaded_file, '-c', 'copy', '-movflags', '+faststart', final_output_file]
            res = subprocess.run(cmd, capture_output=True, timeout=60)
            if res.returncode == 0 and os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0:
                return final_output_file
        except Exception as e:
            print(f"Fast copy failed: {e}, falling back to encoding")

    # If stream copy not applicable (e.g. webm/mkv container), re-encode with balanced CRF
    try:
        cmd = [
            'ffmpeg', '-y', '-i', downloaded_file,
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '24',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            final_output_file
        ]
        res = subprocess.run(cmd, capture_output=True, timeout=180)
        if res.returncode == 0 and os.path.exists(final_output_file) and os.path.getsize(final_output_file) > 0:
            return final_output_file
    except Exception as e:
        print(f"Re-encode failed: {e}")

    # Fallback to original downloaded file if ffmpeg fails
    return downloaded_file

def download_media_file(url: str, format_type: str = "video"):
    """
    Downloads media and ensures universal MP4, MP3, or image file.
    Returns (success: bool, filepath_or_error: str, filename: str, temp_dir: str)
    """
    temp_dir = tempfile.mkdtemp(prefix="tgbot_omnidl_")
    job_uuid = uuid.uuid4().hex
    raw_template = os.path.join(temp_dir, f"{job_uuid}_raw.%(ext)s")
    final_output = os.path.join(temp_dir, f"{job_uuid}_final.{ 'mp3' if format_type == 'audio' else 'mp4' }")

    ydl_opts = {
        'outtmpl': raw_template,
        'quiet': True,
        'no_warnings': True,
        'max_filesize': 750 * 1024 * 1024,
    }

    cookie_path = server.get_cookie_file()
    if cookie_path:
        ydl_opts['cookiefile'] = cookie_path

    if format_type == 'audio':
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }]
    else:
        ydl_opts['format'] = (
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/"
            "bestvideo+bestaudio/"
            "best[ext=mp4]/best"
        )
        ydl_opts['merge_output_format'] = 'mp4'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            raw_info = ydl.extract_info(url, download=True)
            if not raw_info:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return False, "Gagal mengunduh media dari link tersebut.", "", ""

            info = server.extract_single_entry(raw_info, url)

            job_files = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir) if not f.endswith('.part')]
            if not job_files:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return False, "File hasil unduhan tidak ditemukan.", "", ""

            downloaded = job_files[0]
            raw_title = info.get('title') or ('Instagram_Story' if 'instagram' in url.lower() else 'media')
            clean_title = server.sanitize_filename(raw_title)

            # Check if downloaded media is a static image (e.g. photo story)
            is_image = downloaded.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
            if is_image:
                ext = os.path.splitext(downloaded)[1].lstrip('.').lower()
                return True, downloaded, f"{clean_title}.{ext}", temp_dir

            if format_type == 'audio':
                base, _ = os.path.splitext(downloaded)
                target_file = base + '.mp3' if os.path.exists(base + '.mp3') else downloaded
                return True, target_file, f"{clean_title}.mp3", temp_dir
            else:
                target_file = process_video_file(downloaded, final_output)
                return True, target_file, f"{clean_title}.mp4", temp_dir
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raw_err = str(e)
        if 'log in to access this content' in raw_err.lower() or 'cookies' in raw_err.lower():
            return False, "Instagram Stories memerlukan autentikasi login (file cookies.txt).", "", ""
        clean_err = re.sub(r'([A-Za-z]:\\[^:\n\r]+|\/[a-zA-Z0-9_\-\.\/]+)', '[path]', raw_err)
        return False, f"Terjadi kesalahan saat mengunduh: {clean_err[:120]}", "", ""

def main():
    if not TOKEN or TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        print("=" * 60)
        print("❌ TELEGRAM_BOT_TOKEN belum diatur!")
        print("=" * 60)
        print("Langkah mudah mengaktifkan bot:")
        print("1. Buka Telegram dan cari @BotFather")
        print("2. Kirim perintah /newbot dan ikuti petunjuk untuk mendapatkan TOKEN")
        print("3. Buka file .env dan masukkan token:")
        print("   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz")
        print("4. Jalankan ulang script ini: python telegram_bot.py")
        print("=" * 60)
        sys.exit(1)

    bot = telebot.TeleBot(TOKEN, parse_mode="HTML")

    @bot.message_handler(commands=['start', 'help'])
    def send_welcome(message):
        welcome_text = (
            "👋 <b>Halo! Selamat datang di OmniDownloader Bot!</b>\n\n"
            "Saya dapat mengunduh video, foto & audio dari berbagai platform dengan kualitas terbaik:\n"
            "• 📸 <b>Instagram</b> (Stories, Reels, Post & Carousel)\n"
            "• 🎬 <b>TikTok</b> (Tanpa Watermark HD)\n"
            "• 📹 <b>YouTube</b> (Shorts & Video)\n"
            "• 🐦 <b>Twitter / X</b>\n"
            "• 📘 <b>Facebook HD</b>\n"
            "• 🧵 <b>Threads</b>\n"
            "• 🔴 <b>Reddit & Pinterest</b>\n"
            "• 🎵 <b>SoundCloud</b>\n\n"
            "💡 <b>Cara Penggunaan:</b>\n"
            "Cukup <i>copy & paste</i> link video atau Instagram Story ke chat ini!"
        )
        bot.reply_to(message, welcome_text)

    @bot.message_handler(commands=['status'])
    def send_status(message):
        backend_status = "🔴 Offline (Fallback internal aktif)"
        try:
            r = requests.get(f"{BACKEND_URL}/api/health", timeout=3)
            if r.status_code == 200:
                backend_status = "🟢 Online (OmniDownloader Backend)"
        except Exception:
            pass

        has_cookies = "✅ Terdeteksi (cookies.txt)" if server.get_cookie_file() else "⚠️ Tidak ada (fitur Instagram Story publik)"

        text = (
            "⚙️ <b>Status OmniDownloader Bot:</b>\n"
            f"• <b>Engine</b>: yt-dlp + ffmpeg fast-remux\n"
            f"• <b>Cookies Instagram</b>: {has_cookies}\n"
            f"• <b>Backend Server</b>: {backend_status}\n"
            f"• <b>Batas Upload Telegram</b>: 50 MB langsung di chat\n"
            f"• <b>Waktu Server</b>: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        bot.reply_to(message, text)

    @bot.message_handler(func=lambda msg: True, content_types=['text'])
    def handle_incoming_message(message):
        urls = extract_urls(message.text)
        if not urls:
            bot.reply_to(
                message,
                "⚠️ Silakan kirimkan link media yang valid (misal: Instagram Story, Reels, TikTok, YouTube, dll)."
            )
            return

        target_url = urls[0]
        status_msg = bot.reply_to(message, "🔍 <i>Sedang menganalisis link media...</i>")

        clean_expired_cache()
        success, info = get_media_info(target_url)

        if not success:
            bot.edit_message_text(
                f"❌ <b>Gagal membaca media:</b>\n{info}",
                chat_id=message.chat.id,
                message_id=status_msg.message_id
            )
            return

        # Store in cache
        cache_id = uuid.uuid4().hex[:8]
        MEDIA_CACHE[cache_id] = {
            'url': target_url,
            'info': info,
            'time': time.time()
        }

        # Build inline keyboard
        markup = types.InlineKeyboardMarkup(row_width=2)
        is_image = info.get('isImage', False)
        video_label = "🖼️ Download Foto Story" if is_image else "🎬 Download MP4 Video"
        btn_video = types.InlineKeyboardButton(video_label, callback_data=f"dl_v:{cache_id}")
        
        if not is_image:
            btn_audio = types.InlineKeyboardButton("🎵 Download MP3 Audio", callback_data=f"dl_a:{cache_id}")
            markup.add(btn_video, btn_audio)
        else:
            markup.add(btn_video)

        caption = (
            f"📹 <b>{info.get('title', 'Media')}</b>\n\n"
            f"👤 <b>Kreator</b>: {info.get('author', '-')}\n"
            f"⏱️ <b>Durasi / Tipe</b>: {info.get('duration', '-')}\n"
            f"🌐 <b>Platform</b>: {info.get('platform', 'Media')}\n\n"
            "Pilih tombol di bawah ini untuk mengunduh:"
        )

        thumb = info.get('thumbnailUrl')
        try:
            bot.delete_message(message.chat.id, status_msg.message_id)
            if thumb and thumb.startswith("http"):
                bot.send_photo(message.chat.id, thumb, caption=caption, reply_markup=markup)
            else:
                bot.send_message(message.chat.id, caption, reply_markup=markup)
        except Exception:
            bot.send_message(message.chat.id, caption, reply_markup=markup)

    @bot.callback_query_handler(func=lambda call: True)
    def handle_callback(call):
        bot.answer_callback_query(call.id)
        data = call.data

        if not (data.startswith("dl_v:") or data.startswith("dl_a:")):
            return

        action, cache_id = data.split(":", 1)
        format_type = "video" if action == "dl_v" else "audio"

        cached = MEDIA_CACHE.get(cache_id)
        if not cached:
            bot.send_message(
                call.message.chat.id,
                "⚠️ Sesi unduhan telah kadaluarsa. Silakan kirimkan kembali link media Anda."
            )
            return

        url = cached['url']
        info = cached['info']
        title = info.get('title', 'media')

        label_type = "Media" if info.get('isImage') else ("Video MP4" if format_type == "video" else "Audio MP3")
        progress_msg = bot.send_message(
            call.message.chat.id,
            f"⏳ <b>Sedang mengunduh & memproses {label_type}...</b>\n<i>Mohon tunggu sebentar...</i>"
        )

        temp_folder = None
        try:
            bot.send_chat_action(
                call.message.chat.id,
                'upload_photo' if info.get('isImage') else ('upload_video' if format_type == 'video' else 'upload_audio')
            )

            success, file_path, file_name, temp_folder = download_media_file(url, format_type=format_type)

            if not success:
                bot.edit_message_text(
                    f"❌ <b>Gagal memproses unduhan:</b>\n{file_path}",
                    chat_id=call.message.chat.id,
                    message_id=progress_msg.message_id
                )
                return

            # Check file size (Telegram cloud bot limit is 50MB)
            file_size_bytes = os.path.getsize(file_path)
            file_size_mb = file_size_bytes / (1024 * 1024)

            if file_size_mb > 49.5:
                bot.edit_message_text(
                    f"⚠️ <b>Ukuran file ({file_size_mb:.1f} MB) melebihi batas Telegram (50 MB).</b>\n\n"
                    "Telegram membatasi upload bot maksimal 50 MB.\n"
                    "💡 <b>Solusi:</b>\n"
                    "1. Coba unduh versi <b>Audio MP3</b> (jika video).\n"
                    "2. Atau unduh langsung tanpa batas ukuran lewat web OmniDownloader di browser.",
                    chat_id=call.message.chat.id,
                    message_id=progress_msg.message_id
                )
                return

            bot.edit_message_text(
                f"📤 <i>Mengirim file ke Telegram ({file_size_mb:.1f} MB)...</i>",
                chat_id=call.message.chat.id,
                message_id=progress_msg.message_id
            )

            clean_display_title = title[:80]
            caption = f"✅ <b>{clean_display_title}</b>\nDownloaded via OmniDownloader"

            is_image = file_path.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))

            with open(file_path, 'rb') as f:
                if is_image:
                    try:
                        bot.send_photo(
                            call.message.chat.id,
                            f,
                            caption=caption,
                            timeout=300
                        )
                    except Exception as img_err:
                        print(f"send_photo error: {img_err}, falling back to send_document")
                        f.seek(0)
                        bot.send_document(
                            call.message.chat.id,
                            f,
                            caption=caption,
                            timeout=300
                        )
                elif format_type == 'video':
                    try:
                        bot.send_video(
                            call.message.chat.id,
                            f,
                            caption=caption,
                            supports_streaming=True,
                            timeout=300
                        )
                    except Exception as vid_err:
                        print(f"send_video error: {vid_err}, falling back to send_document")
                        f.seek(0)
                        bot.send_document(
                            call.message.chat.id,
                            f,
                            caption=caption,
                            timeout=300
                        )
                else:
                    try:
                        bot.send_audio(
                            call.message.chat.id,
                            f,
                            caption=caption,
                            title=clean_display_title,
                            performer=info.get('author', 'OmniDownloader'),
                            timeout=300
                        )
                    except Exception as aud_err:
                        print(f"send_audio error: {aud_err}, falling back to send_document")
                        f.seek(0)
                        bot.send_document(
                            call.message.chat.id,
                            f,
                            caption=caption,
                            timeout=300
                        )

            try:
                bot.delete_message(call.message.chat.id, progress_msg.message_id)
            except Exception:
                pass

        except Exception as e:
            bot.edit_message_text(
                f"❌ Terjadi kesalahan saat mengirim media: {str(e)[:120]}",
                chat_id=call.message.chat.id,
                message_id=progress_msg.message_id
            )
        finally:
            if temp_folder and os.path.exists(temp_folder):
                shutil.rmtree(temp_folder, ignore_errors=True)

    print("🤖 OmniDownloader Telegram Bot is running smoothly with Instagram Story support...")
    print("Press Ctrl+C to stop.")
    bot.infinity_polling(skip_pending=True)

if __name__ == '__main__':
    main()
