# 🍪 Panduan Ekspor Cookies Instagram untuk OmniDownloader & Bot

Fitur **Instagram Stories & Highlights** memerlukan autentikasi login Instagram karena Instagram tidak mengizinkan akses anonim ke Stories.

Untuk mengaktifkannya, Anda hanya perlu mengekspor cookies akun Instagram Anda ke file `cookies.txt` di folder ini.

---

### 🚀 Cara Mudah (Hanya 1 Menit):

1. **Pasang Ekstensi Browser di Chrome atau Edge:**
   - Rekomendasi: **Get cookies.txt LOCALLY** (tersedia di Chrome Web Store / Edge Addons)
   - Atau: **Cookie-Editor**

2. **Buka Instagram Web:**
   - Kunjungi [https://www.instagram.com](https://www.instagram.com)
   - Pastikan Anda sudah login ke akun Instagram Anda (bisa menggunakan akun kedua/burner jika mau).

3. **Ekspor Cookies:**
   - Klik ikon ekstensi **Get cookies.txt LOCALLY** pada tab Instagram.
   - Klik tombol **Export As...** atau **Download as cookies.txt**.

4. **Simpan di Folder Proyek:**
   - Pindahkan file hasil unduhan tersebut ke folder `c:\Users\user\Music\downloader\` dan beri nama:
     ```text
     cookies.txt
     ```

5. **Selesai!**
   - Backend `server.py` dan Bot Telegram `telegram_bot.py` akan secara otomatis mendeteksi file `cookies.txt` tersebut tanpa perlu pengaturan tambahan.
   - Anda kini dapat mengunduh Story (video maupun foto) dan Highlights dari Instagram secara lancar!
