# 🚀 OmniDownloader - Multiplatform Video & Audio Downloader Web & Mobile PWA

A modern, high-performance, responsive web application and Progressive Web App (PWA) to download videos and audio from 10+ major social platforms in maximum quality (up to 4K UHD 60fps) with zero watermark and universal H.264/AAC compatibility.

![OmniDownloader Banner](public/icons/icon-512.png)

---

## ✨ Features

- ⚡ **Universal Multiplatform Support**:
  - **YouTube**: Videos up to 4K 60fps, Shorts, audio MP3 320kbps, SRT subtitles.
  - **TikTok**: 100% No Watermark HD and original trending sound extracts.
  - **Instagram**: Reels, Post Videos, Stories, and Carousels.
  - **X (Twitter)**, **Facebook HD**, **Reddit** (merged video + audio), **Pinterest**, and **Threads**.
- 📱 **Progressive Web App (PWA)**:
  - Installable on Android, iOS (iPhone/iPad), and Desktop.
  - Offline support powered by Service Worker caching.
  - Native Mobile Bottom Navigation Bar.
  - Web Share Target API integration (direct "Share to OmniDownloader" from other apps).
- 🎬 **100% Windows & Cross-Device Compatible**:
  - Automatically muxes/encodes streams into standard **H.264 (AVC)** video + **AAC** audio inside `.mp4` with `+faststart`.
  - Guarantees zero "This item was encoded in a format that's not supported" errors.
- ⚡ **Batch Downloader**:
  - Queue multiple links at once for bulk downloading.
- 💾 **Local Download History**:
  - Keeps track of downloaded media with one-click re-download options.
- 🎨 **Modern Cyber-Dark UI**:
  - Built with React 19, TypeScript, Tailwind CSS v4, Lucide Icons, and Vite.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite 8
- **Backend / Engine**: Python, `yt-dlp`, `static-ffmpeg` (H.264 / AAC / MP3)
- **PWA**: Web App Manifest, Service Worker, Web Share Target

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://python.org/) (v3.10+)

### 1. Clone the repository
```bash
git clone https://github.com/franssaut/multiplatform-video-downloader.git
cd multiplatform-video-downloader
```

### 2. Install dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
python -m pip install yt-dlp static-ffmpeg pillow
```

### 3. Run the development environment

**Start the Backend Engine (Terminal 1):**
```bash
python server.py
# Running on http://127.0.0.1:5000
```

**Start the React Vite Frontend (Terminal 2):**
```bash
npm run dev
# Running on http://localhost:5173
```

---

## 📄 License

This project is licensed under the MIT License - feel free to use and modify for personal projects.
