import React from 'react';
import { Sparkles, ShieldCheck, Zap, Video, CheckCircle2 } from 'lucide-react';
import { PLATFORMS_DATA } from '../data/mockData';
import type { Platform } from '../types';

export interface HeroSectionProps {
  readonly selectedPlatform?: Platform;
  readonly onSelectPlatformBadge: (platform: Platform) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedPlatform,
  onSelectPlatformBadge,
}) => {
  return (
    <section className="relative pt-10 pb-6 text-center max-w-4xl mx-auto px-4">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-purple-600/10 blur-[90px] pointer-events-none rounded-full" />

      {/* Top Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg text-xs text-slate-300 mb-6 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-medium">Mendukung 10+ Platform Populer Tanpa Batas</span>
        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
        <span className="text-cyan-400 font-semibold">100% Bebas Iklan</span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-5 leading-tight">
        Download Video Apapun <br />
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
          Cepat, Jernih, Tanpa Watermark
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
        Simpan video & audio favorit Anda dari YouTube, TikTok, Instagram, Twitter/X, Facebook, dan platform lainnya dengan resolusi tertinggi hingga 4K UHD.
      </p>

      {/* Platform Pills Quick Filter */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {PLATFORMS_DATA.map((p) => {
          const isSelected = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlatformBadge(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold shadow-md shadow-cyan-500/25 scale-105'
                  : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              ></span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Feature Bullet Points */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Kecepatan Unduh Maksimal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Bebas Watermark TikTok & Reels</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Aman & Tanpa Registrasi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Video className="w-4 h-4 text-indigo-400" />
          <span>Ekstrak MP3 320kbps</span>
        </div>
      </div>
    </section>
  );
};
