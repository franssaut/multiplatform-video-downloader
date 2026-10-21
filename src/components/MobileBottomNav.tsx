import React from 'react';
import { Sparkles, Layers, History, Settings } from 'lucide-react';

export interface MobileBottomNavProps {
  readonly activeTab: 'single' | 'batch' | 'history';
  readonly setActiveTab: (tab: 'single' | 'batch' | 'history') => void;
  readonly historyCount: number;
  readonly onOpenSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  onOpenSettings,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/90 backdrop-blur-xl border-t border-slate-800/90 px-4 py-2 pb-safe">
      <nav className="flex items-center justify-around">
        {/* Single Downloader Tab */}
        <button
          onClick={() => setActiveTab('single')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'single'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'single'
                ? 'bg-cyan-500/20 text-cyan-400 shadow-md shadow-cyan-500/20'
                : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">Single</span>
        </button>

        {/* Batch Tab */}
        <button
          onClick={() => setActiveTab('batch')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'batch'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'batch'
                ? 'bg-cyan-500/20 text-cyan-400 shadow-md shadow-cyan-500/20'
                : 'text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">Batch</span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => setActiveTab('history')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div
            className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-400 shadow-md shadow-cyan-500/20'
                : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center ring-2 ring-[#0b0f19]">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Riwayat</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-white transition"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400">
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">Pengaturan</span>
        </button>
      </nav>
    </div>
  );
};
