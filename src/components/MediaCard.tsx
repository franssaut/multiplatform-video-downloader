import React, { useState } from 'react';
import {
  Play,
  Download,
  Film,
  Music,
  FileText,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Volume2,
  Loader2,
} from 'lucide-react';
import type { MediaResult, QualityOption, SubtitleOption } from '../types';
import { PLATFORMS_DATA } from '../data/mockData';
import { downloadRealMediaFile } from '../utils/detector';

export interface MediaCardProps {
  readonly media: MediaResult;
  readonly onOpenPreview: (videoUrl: string, title: string) => void;
  readonly onDownloadSuccess: (media: MediaResult, format: QualityOption) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onOpenPreview,
  onDownloadSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'subtitle'>('video');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const platformInfo = PLATFORMS_DATA.find((p) => p.id === media.platform);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(media.originalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const startDownload = async (format: QualityOption) => {
    setDownloadingId(format.id);
    setDownloadProgress(15);

    try {
      await downloadRealMediaFile(media.originalUrl, format, media.title, (p) => {
        setDownloadProgress(p);
      });
      onDownloadSuccess(media, format);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
        setDownloadProgress(0);
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8 animate-fade-in">
      <div className="bg-[#121626] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top Header Card */}
        <div className="p-5 sm:p-7 border-b border-slate-800/80 flex flex-col md:flex-row gap-6">
          {/* Thumbnail with Play Overlay */}
          <div className="relative w-full md:w-72 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 group flex-shrink-0 shadow-lg">
            <img
              src={media.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&auto=format&fit=crop&q=80'}
              alt={media.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

            {/* Play Button Overlay */}
            {media.videoPreviewUrl && (
              <button
                onClick={() => onOpenPreview(media.videoPreviewUrl!, media.title)}
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/40 group-hover:scale-110 active:scale-95 transition-all"
                title="Putar Video Preview"
              >
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              </button>
            )}

            {/* Duration Tag */}
            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-xs font-semibold backdrop-blur-sm">
              {media.duration}
            </span>

            {/* Platform Tag */}
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-md"
              style={{
                backgroundColor: platformInfo ? `${platformInfo.color}CC` : '#2563ebCC',
                color: '#ffffff',
              }}
            >
              {platformInfo ? platformInfo.name : media.platform}
            </span>
          </div>

          {/* Details & Author */}
          <div className="flex flex-col justify-between flex-grow">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Media Berhasil Dianalisis Sesuai Link</span>
                </span>
                {media.views && (
                  <span className="text-xs text-slate-400 font-medium">{media.views}</span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-snug mb-3">
                {media.title}
              </h2>

              <div className="flex items-center gap-3">
                {media.authorAvatar && (
                  <img
                    src={media.authorAvatar}
                    alt={media.author}
                    className="w-9 h-9 rounded-full ring-2 ring-cyan-500/30 object-cover"
                  />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{media.author}</h4>
                  <p className="text-xs text-slate-400">Pengunggah Resmi</p>
                </div>
              </div>
            </div>

            {/* Share / Copy Original Link */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1 max-w-[280px] sm:max-w-xs truncate font-mono text-slate-400">
                <span className="truncate">{media.originalUrl}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
                <a
                  href={media.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Buka Link Asli"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-5 sm:px-7 pt-4 bg-[#0d101d]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'video'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Video ({media.formats.videos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'audio'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Audio MP3 ({media.formats.audios.length})</span>
            </button>

            {media.formats.subtitles.length > 0 && (
              <button
                onClick={() => setActiveTab('subtitle')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'subtitle'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Subtitles ({media.formats.subtitles.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Options List */}
        <div className="p-5 sm:p-7 bg-[#0d101d] divide-y divide-slate-800/60">
          {activeTab === 'video' &&
            media.formats.videos.map((fmt) => {
              const isDownloading = downloadingId === fmt.id;
              return (
                <div
                  key={fmt.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/20 px-3 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{fmt.label}</span>
                        {fmt.isRecommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Rekomendasi</span>
                          </span>
                        )}
                        <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {fmt.ext}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {fmt.qualityNote && <span>{fmt.qualityNote}</span>}
                        <span>•</span>
                        <span>{fmt.size}</span>
                        {fmt.hasAudio && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-emerald-400">
                              <Volume2 className="w-3 h-3" /> Audio Termasuk
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download Button / Progress */}
                  <div className="flex items-center sm:self-center">
                    {isDownloading ? (
                      <div className="w-full sm:w-48">
                        <div className="flex justify-between text-xs text-cyan-400 font-mono mb-1">
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Mengunduh file asli...
                          </span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startDownload(fmt)}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                          fmt.isRecommended
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 shadow-cyan-500/20 active:scale-95'
                            : 'bg-slate-800 hover:bg-slate-700 text-white hover:text-cyan-400 border border-slate-700'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4 Asli</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {activeTab === 'audio' &&
            media.formats.audios.map((fmt) => {
              const isDownloading = downloadingId === fmt.id;
              return (
                <div
                  key={fmt.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/20 px-3 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{fmt.label}</span>
                        {fmt.isRecommended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                            HQ 320k
                          </span>
                        )}
                        <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {fmt.ext}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {fmt.bitrate && <span>Bitrate: {fmt.bitrate}</span>}
                        <span>•</span>
                        <span>{fmt.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center sm:self-center">
                    {isDownloading ? (
                      <div className="w-full sm:w-48">
                        <div className="flex justify-between text-xs text-purple-400 font-mono mb-1">
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Mengekstrak MP3 asli...
                          </span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startDownload(fmt)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-purple-600/30 text-white hover:text-purple-300 border border-slate-700 transition active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP3 Asli</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {activeTab === 'subtitle' &&
            media.formats.subtitles.map((sub: SubtitleOption, index: number) => (
              <div
                key={index}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-800/20 px-3 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white">{sub.lang}</span>
                    <span className="ml-2 text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      .{sub.ext}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => startDownload({
                    id: `sub_${sub.code}`,
                    label: sub.lang,
                    ext: sub.ext,
                    size: 'Text File',
                    hasAudio: false
                  })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .{sub.ext}</span>
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
