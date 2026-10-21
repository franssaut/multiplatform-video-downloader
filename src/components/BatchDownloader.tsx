import React, { useState } from 'react';
import { Layers, Play, CheckCircle2, AlertCircle, Loader2, Download, Trash2 } from 'lucide-react';
import type { BatchItem, QualityOption } from '../types';
import { detectPlatform, fetchMediaInfo, downloadRealMediaFile } from '../utils/detector';
import { PLATFORMS_DATA } from '../data/mockData';

export interface BatchDownloaderProps {
  readonly onDownloadSuccess: (media: any, format: QualityOption) => void;
}

export const BatchDownloader: React.FC<BatchDownloaderProps> = ({
  onDownloadSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleParseUrls = () => {
    const lines = inputText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 5 && line.startsWith('http'));

    if (lines.length === 0) return;

    const newItems: BatchItem[] = lines.map((url) => {
      const platform = detectPlatform(url);
      return {
        id: 'batch_' + Math.random().toString(36).substring(2, 9),
        url,
        platform,
        status: 'idle',
        progress: 0,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setInputText('');
  };

  const handleFetchAll = async () => {
    setIsProcessing(true);
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'idle') {
        setItems((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: 'fetching' } : item))
        );

        try {
          const result = await fetchMediaInfo(items[i].url);
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: 'ready',
                    result,
                    selectedFormat: result.formats.videos[0] || result.formats.audios[0],
                  }
                : item
            )
          );
        } catch {
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'error', error: 'Gagal menganalisis link' } : item
            )
          );
        }
      }
    }
    setIsProcessing(false);
  };

  const handleDownloadItem = async (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target || !target.result || !target.selectedFormat) return;

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'downloading', progress: 20 } : it))
    );

    try {
      await downloadRealMediaFile(
        target.url,
        target.selectedFormat,
        target.result.title,
        (progress) => {
          setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, progress } : it))
          );
        }
      );
      onDownloadSuccess(target.result, target.selectedFormat);
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'completed', progress: 100 } : it))
      );
    } catch {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'error' } : it))
      );
    }
  };

  const handleDownloadAllReady = () => {
    items.forEach((item) => {
      if (item.status === 'ready') {
        handleDownloadItem(item.id);
      }
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-6 animate-fade-in">
      <div className="bg-[#121626] rounded-3xl border border-slate-700/80 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Batch Downloader Antrean</h2>
              <p className="text-xs text-slate-400">Unduh banyak video sekaligus dengan satu klik</p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Antrean</span>
            </button>
          )}
        </div>

        {/* Textarea Input */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tempel beberapa tautan video di sini (satu tautan per baris)...&#10;https://www.youtube.com/watch?v=...&#10;https://www.tiktok.com/@creator/video/...&#10;https://www.instagram.com/reel/..."
            rows={4}
            className="w-full bg-[#0b0f19] text-slate-200 placeholder-slate-500 text-sm p-4 rounded-2xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <p className="text-xs text-slate-500">Maksimal 15 tautan sekaligus per batch</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleParseUrls}
              disabled={!inputText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 transition"
            >
              Tambahkan ke Antrean
            </button>
            {items.length > 0 && (
              <button
                onClick={handleFetchAll}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Analisis Semua Tautan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Batch Items List */}
        {items.length > 0 && (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Daftar Antrean ({items.length} item)
              </span>
              <button
                onClick={handleDownloadAllReady}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Semua yang Siap</span>
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {items.map((item) => {
                const platformInfo = PLATFORMS_DATA.find((p) => p.id === item.platform);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: platformInfo?.color || '#475569' }}
                      >
                        {item.platform.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {item.result ? item.result.title : item.url}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{platformInfo?.name || item.platform}</span>
                          <span>•</span>
                          <span className="capitalize">{item.status}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.status === 'ready' && (
                        <button
                          onClick={() => handleDownloadItem(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 border border-cyan-500/30 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh</span>
                        </button>
                      )}

                      {item.status === 'downloading' && (
                        <div className="w-28 text-right">
                          <span className="text-[11px] text-cyan-400 font-mono">
                            {item.progress}%
                          </span>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'completed' && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selesai</span>
                        </span>
                      )}

                      {item.status === 'error' && (
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>Gagal</span>
                        </span>
                      )}

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
                        title="Hapus dari antrean"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
