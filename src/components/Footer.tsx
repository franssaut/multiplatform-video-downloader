import React from 'react';
import { Download, Heart, Shield } from 'lucide-react';

export interface FooterProps {
  // Empty or future configurable props
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070a12] text-slate-400 text-xs py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white">OmniDownloader</span>
              <p className="text-[11px] text-slate-500">Universal Multiplatform Video & Audio Downloader</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <a href="#how" className="hover:text-cyan-400 transition">Panduan</a>
            <a href="#platforms" className="hover:text-cyan-400 transition">Platform</a>
            <a href="#features" className="hover:text-cyan-400 transition">Fitur</a>
            <a href="#faq" className="hover:text-cyan-400 transition">FAQ</a>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>SSL Secured & Verified</span>
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-[11px] text-slate-500 max-w-3xl mx-auto leading-relaxed">
          <p className="mb-2">
            <strong>Pemberitahuan Hukum / Disclaimer:</strong> OmniDownloader tidak menyimpan materi berhak cipta apa pun di server kami. Semua berkas media dialirkan dan diunduh langsung dari CDN pihak ketiga masing-masing platform. Pengguna bertanggung jawab penuh atas hak cipta konten yang diunduh.
          </p>
          <p className="flex items-center justify-center gap-1 text-slate-600">
            <span>Dibuat dengan</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>untuk pengalaman unduh media tercepat & terbersih. &copy; {new Date().getFullYear()} OmniDownloader.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
