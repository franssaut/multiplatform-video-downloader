export type Platform =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'reddit'
  | 'pinterest'
  | 'threads'
  | 'vimeo'
  | 'soundcloud'
  | 'unknown';

export interface QualityOption {
  id: string;
  label: string;
  resolution?: string;
  bitrate?: string;
  ext: string;
  size: string;
  qualityNote?: string;
  hasAudio: boolean;
  isRecommended?: boolean;
  qualityValue?: string;
}

export interface SubtitleOption {
  lang: string;
  code: string;
  ext: string;
  url?: string;
}

export interface MediaResult {
  id: string;
  originalUrl: string;
  title: string;
  author: string;
  authorAvatar?: string;
  thumbnailUrl: string;
  videoPreviewUrl?: string;
  duration: string;
  views?: string;
  platform: Platform;
  formats: {
    videos: QualityOption[];
    audios: QualityOption[];
    subtitles: SubtitleOption[];
  };
}

export interface DownloadHistoryItem {
  id: string;
  media: MediaResult;
  format: QualityOption;
  downloadedAt: string;
}

export interface BatchItem {
  id: string;
  url: string;
  platform: Platform;
  status: 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'error';
  result?: MediaResult;
  selectedFormat?: QualityOption;
  progress: number;
  error?: string;
}

export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
  description: string;
  features: string[];
  placeholderUrl: string;
  exampleUrl: string;
}
