import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQ_DATA } from '../data/mockData';

export interface FaqSectionProps {
  // Empty or future configurable props
}

export const FaqSection: React.FC<FaqSectionProps> = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-16 border-t border-slate-800/80">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-5 h-5" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Pertanyaan yang Sering Diajukan
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Semua hal yang perlu Anda ketahui mengenai penggunaan OmniDownloader
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_DATA.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#121626]/70 border border-slate-800/80 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/30 transition"
              >
                <span className="font-bold text-sm sm:text-base text-white">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
