import type { Platform, MediaResult, QualityOption } from '../types';

const isLocalDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port === '5173';

const CLOUD_TUNNEL_URL = 'https://knives-dog-sacred-frame.trycloudflare.com';

export const BACKEND_URL = isLocalDev ? 'http://127.0.0.1:5000' : CLOUD_TUNNEL_URL;

export function detectPlatform(url: string): Platform {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return 'unknown';

  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return 'youtube';
  }
  if (trimmed.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
    return 'instagram';
  }
  if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
    return 'twitter';
  }
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch') || trimmed.includes('fb.com')) {
    return 'facebook';
  }
  if (trimmed.includes('reddit.com') || trimmed.includes('redd.it')) {
    return 'reddit';
  }
  if (trimmed.includes('pinterest.com') || trimmed.includes('pin.it')) {
    return 'pinterest';
  }
  if (trimmed.includes('threads.net')) {
    return 'threads';
  }
  if (trimmed.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (trimmed.includes('soundcloud.com')) {
    return 'soundcloud';
  }

  return 'unknown';
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Fetch REAL media info from backend, fallback to mock if backend is unavailable
export async function fetchMediaInfo(url: string): Promise<MediaResult> {
  const cleanUrl = url.trim();
  const platform = detectPlatform(cleanUrl);

  // Try 1: Primary BACKEND_URL
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    const resp = await fetch(`${BACKEND_URL}/api/info?url=${encodeURIComponent(cleanUrl)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      return data as MediaResult;
    }
  } catch (err) {
    console.warn('Primary backend failed, attempting relative API route:', err);
  }

  // Try 2: Relative /api/info (routed via Vercel proxy rewrite)
  if (!isLocalDev) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const resp = await fetch(`/api/info?url=${encodeURIComponent(cleanUrl)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        return data as MediaResult;
      }
    } catch (err2) {
      console.warn('Relative API fallback failed:', err2);
    }
  }

  // Graceful fallback to mock data
  return generateMockMediaResult(cleanUrl, platform);
}

// Download real video/audio file via backend stream
export async function downloadRealMediaFile(
  originalUrl: string,
  format: QualityOption,
  title: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const formatType = format.ext === 'mp3' ? 'audio' : 'video';
  const quality = format.qualityValue || (format.id.replace('v_', '').replace('a_', ''));
  const downloadUrl = `${BACKEND_URL}/api/download?url=${encodeURIComponent(originalUrl)}&type=${formatType}&quality=${quality}`;

  if (onProgress) onProgress(25);

  const cleanTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 35) || 'media';
  const fileName = `${cleanTitle}.${format.ext}`;

  // Detect mobile devices (Android / iOS)
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    if (onProgress) onProgress(80);
    // On mobile devices, triggering standard anchor click lets the OS native download manager take over cleanly
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      if (onProgress) onProgress(100);
    }, 1000);
    return;
  }

  // Desktop: fetch as blob for progress, fallback to direct browser navigation
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    if (onProgress) onProgress(70);

    const blob = await response.blob();
    if (onProgress) onProgress(90);

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);

    if (onProgress) onProgress(100);
  } catch (err) {
    console.warn('Blob download failed, falling back to direct browser navigation:', err);
    window.location.href = downloadUrl;
    if (onProgress) onProgress(100);
  }
}

// Fallback generator for offline/demo preview
export function generateMockMediaResult(url: string, platform: Platform): MediaResult {
  const cleanUrl = url.trim();
  
  switch (platform) {
    case 'youtube':
      return {
        id: 'yt_' + Math.random().toString(36).substring(2, 9),
        originalUrl: cleanUrl,
        title: 'Cinematic 4K Nature & Wildlife Documentary - Wonders of the Rainforest',
        author: 'National Earth & Wildlife 4K',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&auto=format&fit=crop&q=80',
        videoPreviewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '14:28',
        views: '2.8M views',
        platform: 'youtube',
        formats: {
          videos: [
            { id: 'v_2160', label: '2160p (4K UHD)', resolution: '3840x2160', ext: 'mp4', size: '640 MB', qualityNote: 'Ultra HD 60fps', hasAudio: true, isRecommended: true, qualityValue: '2160' },
            { id: 'v_1080', label: '1080p (Full HD)', resolution: '1920x1080', ext: 'mp4', size: '185 MB', qualityNote: 'Crisp 60fps', hasAudio: true, qualityValue: '1080' },
            { id: 'v_720', label: '720p (HD)', resolution: '1280x720', ext: 'mp4', size: '82 MB', qualityNote: 'Fast download', hasAudio: true, qualityValue: '720' },
            { id: 'v_480', label: '480p (SD)', resolution: '854x480', ext: 'mp4', size: '38 MB', qualityNote: 'Data saver', hasAudio: true, qualityValue: '480' },
          ],
          audios: [
            { id: 'a_320', label: 'MP3 - Studio Quality', bitrate: '320 kbps', ext: 'mp3', size: '33.2 MB', qualityNote: 'Lossless clarity', hasAudio: true, isRecommended: true, qualityValue: 'best' },
          ],
          subtitles: [],
        },
      };

    case 'tiktok':
      return {
        id: 'tt_' + Math.random().toString(36).substring(2, 9),
        originalUrl: cleanUrl,
        title: 'Insane Street Food Cooking Skill & Recipe in Tokyo Night Market! 🍜🔥',
        author: '@chef.tokyo.street',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1280&auto=format&fit=crop&q=80',
        videoPreviewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '0:48',
        views: '8.4M views',
        platform: 'tiktok',
        formats: {
          videos: [
            { id: 'tt_nowm_hd', label: '1080p HD (Tanpa Watermark)', resolution: '1080x1920', ext: 'mp4', size: '28.4 MB', qualityNote: 'No Watermark • Crystal Clear', hasAudio: true, isRecommended: true, qualityValue: '1080' },
            { id: 'tt_nowm_sd', label: '720p (Tanpa Watermark)', resolution: '720x1280', ext: 'mp4', size: '14.2 MB', qualityNote: 'No Watermark', hasAudio: true, qualityValue: '720' },
          ],
          audios: [
            { id: 'tt_audio_mp3', label: 'Audio Original (MP3)', bitrate: '320 kbps', ext: 'mp3', size: '1.9 MB', qualityNote: 'Trending Sound', hasAudio: true, isRecommended: true, qualityValue: 'best' },
          ],
          subtitles: [],
        },
      };

    case 'instagram':
      return {
        id: 'ig_' + Math.random().toString(36).substring(2, 9),
        originalUrl: cleanUrl,
        title: 'Sunset over Lake Como, Italy - Dream travel destination 🇮🇹✨',
        author: '@wanderlust_italy',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1280&auto=format&fit=crop&q=80',
        videoPreviewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '0:32',
        views: '1.2M plays',
        platform: 'instagram',
        formats: {
          videos: [
            { id: 'ig_hd', label: '1080p Full HD Reel', resolution: '1080x1920', ext: 'mp4', size: '22.8 MB', qualityNote: 'Original Quality', hasAudio: true, isRecommended: true, qualityValue: '1080' },
            { id: 'ig_sd', label: '720p HD Video', resolution: '720x1280', ext: 'mp4', size: '11.5 MB', qualityNote: 'Fast download', hasAudio: true, qualityValue: '720' },
          ],
          audios: [
            { id: 'ig_audio', label: 'Audio Reel (MP3)', bitrate: '320 kbps', ext: 'mp3', size: '1.3 MB', qualityNote: 'High Fidelity', hasAudio: true, isRecommended: true, qualityValue: 'best' },
          ],
          subtitles: [],
        },
      };

    default:
      return {
        id: 'gen_' + Math.random().toString(36).substring(2, 9),
        originalUrl: cleanUrl,
        title: 'Multiplatform Media Stream - Full Quality Audio & Video',
        author: 'Content Creator',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1280&auto=format&fit=crop&q=80',
        videoPreviewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: '3:45',
        views: 'High Resolution',
        platform: platform === 'unknown' ? 'other' as Platform : platform,
        formats: {
          videos: [
            { id: 'gen_1080', label: '1080p Full HD', resolution: '1920x1080', ext: 'mp4', size: '54.2 MB', qualityNote: 'Original Resolution', hasAudio: true, isRecommended: true, qualityValue: '1080' },
            { id: 'gen_720', label: '720p HD', resolution: '1280x720', ext: 'mp4', size: '26.8 MB', qualityNote: 'Compressed', hasAudio: true, qualityValue: '720' },
          ],
          audios: [
            { id: 'gen_audio', label: 'Audio Extract (MP3)', bitrate: '320 kbps', ext: 'mp3', size: '8.6 MB', qualityNote: 'Direct extraction', hasAudio: true, isRecommended: true, qualityValue: 'best' },
          ],
          subtitles: [],
        },
      };
  }
}
