import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { PLATFORMS_DATA } from '../data/mockData';
import type { Platform } from '../types';
import {
  YouTubeIcon,
  TikTokIcon,
  InstagramIcon,
  TwitterIcon,
  FacebookIcon,
  RedditIcon,
  PinterestIcon,
  ThreadsIcon,
} from './PlatformIcons';

export interface SupportedPlatformsProps {
  readonly onSelectPlatform: (platform: Platform) => void;
}

export const SupportedPlatforms: React.FC<SupportedPlatformsProps> = ({
  onSelectPlatform,
}) => {
  const getPlatformIcon = (id: Platform) => {
    switch (id) {
      case 'youtube':
        return <YouTubeIcon className="w-5 h-5 text-red-500" />;
      case 'tiktok':
        return <TikTokIcon className="w-5 h-5 text-cyan-400" />;
      case 'instagram':
        return <InstagramIcon className="w-5 h-5 text-pink-500" />;
      case 'twitter':
        return <TwitterIcon className="w-5 h-5 text-sky-400" />;
      case 'facebook':
        return <FacebookIcon className="w-5 h-5 text-blue-500" />;
      case 'reddit':
        return <RedditIcon className="w-5 h-5 text-orange-500" />;
      case 'pinterest':
        return <PinterestIcon className="w-5 h-5 text-rose-500" />;
      case 'threads':
        return <ThreadsIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Mendukung Seluruh Platform Terpopuler
        </h2>
        <p className="text-sm text-slate-400">
          Ekstrak konten video, audio, dan reels dengan rasio aspek asli serta kualitas bit-rate optimal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS_DATA.map((platform) => (
          <div
            key={platform.id}
            onClick={() => onSelectPlatform(platform.id)}
            className="group relative p-5 rounded-2xl bg-[#121626]/70 hover:bg-[#161c32] border border-slate-800/80 hover:border-slate-700 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                {getPlatformIcon(platform.id)}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 group-hover:text-cyan-400 transition">
                Coba Tautan &rarr;
              </span>
            </div>

            <h3 className="font-bold text-white text-base mb-1">{platform.name}</h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
              {platform.description}
            </p>

            <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
              {platform.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
