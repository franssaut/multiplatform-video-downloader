import React, { useState } from 'react';
import { X, Play, AlertCircle } from 'lucide-react';

export interface VideoPreviewModalProps {
  readonly isOpen: boolean;
  readonly videoUrl: string;
  readonly title: string;
  readonly onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  videoUrl,
  title,
  onClose,
}) => {
  const [videoError, setVideoError] = useState(false);

  if (!isOpen) return null;

  // Check if it's a YouTube embed or watch link
  const isYouTube =
    videoUrl.includes('youtube.com/embed') ||
    videoUrl.includes('youtube.com/watch') ||
    videoUrl.includes('youtu.be');

  let embedUrl = videoUrl;
  if (isYouTube) {
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-[#121626] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0d101d]">
          <div className="flex items-center gap-2 truncate pr-4">
            <Play className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
          </div>
          <button
            onClick={() => {
              setVideoError(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player or Embed */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full border-0"
            />
          ) : videoError || !videoUrl ? (
            <div className="p-8 text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Pratinjau Langsung Tidak Didukung Browser
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Platform ini melindungi streaming langsungnya dari pemutar browser pihak ketiga. File video lengkap dengan format H.264 MP4 universal dapat Anda unduh langsung melalui tombol Download.
              </p>
              <button
                onClick={() => {
                  setVideoError(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
              >
                Tutup & Download File MP4
              </button>
            </div>
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              onError={() => setVideoError(true)}
              className="w-full h-full object-contain"
            >
              Browser Anda tidak mendukung tag video.
            </video>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-[#0d101d] text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>Pratinjau Pemutar Media • Resolusi Universal</span>
        </div>
      </div>
    </div>
  );
};
