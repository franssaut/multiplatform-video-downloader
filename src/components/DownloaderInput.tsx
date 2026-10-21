import React, { useState } from 'react';
import { Search, Clipboard, X, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';
import type { Platform } from '../types';
import { SAMPLE_LINKS, PLATFORMS_DATA } from '../data/mockData';

export interface DownloaderInputProps {
  readonly url: string;
  readonly setUrl: (url: string) => void;
  readonly detectedPlatform: Platform;
  readonly isLoading: boolean;
  readonly onSubmit: (urlToSubmit?: string) => void;
  readonly errorMsg?: string;
}

export const DownloaderInput: React.FC<DownloaderInputProps> = ({
  url,
  setUrl,
  detectedPlatform,
  isLoading,
  onSubmit,
  errorMsg,
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
        }
      }
    } catch {
      // Clipboard permissions denied or unsupported
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onSubmit();
    }
  };

  const activePlatformConfig = PLATFORMS_DATA.find((p) => p.id === detectedPlatform);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-4">
      {/* Search Input Box */}
      <div className="relative group">
        {/* Glow ambient background behind the box */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>

        <div className="relative flex flex-col sm:flex-row items-center bg-[#101422] rounded-2xl border border-slate-700/80 shadow-2xl p-2 gap-2 focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
          {/* Platform Icon Indicator */}
          <div className="hidden sm:flex items-center pl-3 text-slate-400">
            {activePlatformConfig ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: `${activePlatformConfig.color}20`,
                  color: activePlatformConfig.color,
                  border: `1px solid ${activePlatformConfig.color}40`,
                }}
              >
                <span>{activePlatformConfig.name}</span>
              </div>
            ) : (
              <Search className="w-5 h-5 text-slate-500" />
            )}
          </div>

          {/* URL Input Field */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tempel tautan video di sini (YouTube, TikTok, Instagram, X, dll)..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base px-3 py-2.5 focus:outline-none"
            disabled={isLoading}
          />

          {/* Quick Clear or Paste actions */}
          <div className="flex items-center gap-1 self-end sm:self-center">
            {url ? (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                title="Hapus tautan"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition border border-slate-700"
                title="Tempel dari Clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{pasteSuccess ? 'Tersalin!' : 'Tempel'}</span>
              </button>
            )}

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={() => onSubmit()}
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Download</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-ping"></div>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Examples Helper */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-500 flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          <span>Coba contoh tautan:</span>
        </span>
        {SAMPLE_LINKS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(sample.url);
              onSubmit(sample.url);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-slate-700 transition"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
