import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

export interface PwaInstallPromptProps {
  // Empty or future configurable props
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Check if dismissed before in this session
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show prompt on iOS after a brief delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Floating PWA Install Banner */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-bounce-subtle">
        <div className="p-4 rounded-2xl bg-[#121626]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 flex-shrink-0 shadow-lg shadow-cyan-500/30">
                <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Pasang Aplikasi Mobile</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Akses lebih cepat, ringan, dan bebas lag langsung dari layar utama HP Anda.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              PWA Siap Dipasang
            </span>

            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang Aplikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="w-full max-w-sm bg-[#121626] border border-slate-700 rounded-3xl p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Pasang di iPhone / iPad</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Untuk menginstal OmniDownloader sebagai aplikasi di perangkat Apple:
            </p>

            <div className="space-y-3 text-left text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <span>Tekan tombol <strong>Share</strong> (ikon <Share2 className="w-3.5 h-3.5 inline text-blue-400" />) di Safari.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <span>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-blue-400" />).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <span>Tekan <strong>Tambah (Add)</strong> di pojok kanan atas.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
