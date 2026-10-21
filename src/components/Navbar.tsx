import React from 'react';
import { Download, Sparkles, Layers, History, Settings, ExternalLink } from 'lucide-react';

export interface NavbarProps {
  readonly activeTab: 'single' | 'batch' | 'history';
  readonly setActiveTab: (tab: 'single' | 'batch' | 'history') => void;
  readonly historyCount: number;
  readonly onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b0f19]/80 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('single')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
            <Download className="w-5 h-5 text-white animate-bounce-subtle" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0b0f19]"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                OmniDownloader
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Multiplatform Video & Audio Extractor</p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'single'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Single URL</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'batch'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Mode</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 text-[10px] rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API Online (32ms)</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* GitHub / Stitch Badge */}
          <a
            href="https://stitch.withgoogle.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-400 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
          >
            <span>Stitch AI</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
};
