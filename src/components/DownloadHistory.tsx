import React from 'react';
import { History, Download, Trash2, ExternalLink, Play, Film, Music } from 'lucide-react';
import type { DownloadHistoryItem } from '../types';
import { downloadRealMediaFile } from '../utils/detector';

export interface DownloadHistoryProps {
  readonly history: DownloadHistoryItem[];
  readonly onClearHistory: () => void;
  readonly onOpenPreview: (url: string, title: string) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  history,
  onClearHistory,
  onOpenPreview,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-6 animate-fade-in">
      <div className="bg-[#121626] rounded-3xl border border-slate-700/80 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Riwayat Unduhan</h2>
              <p className="text-xs text-slate-400">Daftar media yang telah berhasil Anda unduh</p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Riwayat</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600 mb-3">
              <History className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Belum ada riwayat unduhan</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Setiap video atau audio yang Anda download akan otomatis tercatat di sini untuk memudahkan pengunduhan ulang.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 group">
                    <img
                      src={item.media.thumbnailUrl}
                      alt={item.media.title}
                      className="w-full h-full object-cover"
                    />
                    {item.media.videoPreviewUrl && (
                      <button
                        onClick={() =>
                          onOpenPreview(item.media.videoPreviewUrl!, item.media.title)
                        }
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                      {item.media.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="capitalize font-semibold text-cyan-400">
                        {item.media.platform}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        {item.format.ext === 'mp3' ? (
                          <Music className="w-3 h-3 text-purple-400" />
                        ) : (
                          <Film className="w-3 h-3 text-cyan-400" />
                        )}
                        {item.format.label}
                      </span>
                      <span>•</span>
                      <span>{item.downloadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      downloadRealMediaFile(
                        item.media.originalUrl,
                        item.format,
                        item.media.title
                      );
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    title="Unduh Ulang File Asli"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Lagi</span>
                  </button>

                  <a
                    href={item.media.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Buka URL Asli"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
