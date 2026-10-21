import React from 'react';
import { Zap, ShieldCheck, Video, Ban, Headphones, Smartphone } from 'lucide-react';

export interface FeaturesSectionProps {
  // Empty or future configurable props
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Kecepatan Super Cepat',
      desc: 'Proses konversi dan parsing langsung dari server cloud dengan throughput tinggi tanpa buffering.',
    },
    {
      icon: <Video className="w-6 h-6 text-cyan-400" />,
      title: 'Resolusi Hingga 4K & 60fps',
      desc: 'Mendukung format video original tanpa kompresi berlebih, dari 720p, 1080p Full HD hingga 4K Ultra HD.',
    },
    {
      icon: <Ban className="w-6 h-6 text-rose-400" />,
      title: 'Bebas Watermark & Iklan Pop-up',
      desc: 'Bersih dari watermark TikTok maupun logo yang mengganggu. Pengalaman bersih tanpa iklan jebakan.',
    },
    {
      icon: <Headphones className="w-6 h-6 text-purple-400" />,
      title: 'Ekstraksi Audio MP3 320kbps',
      desc: 'Ubah video musik, pidato, atau podcast menjadi file audio jernih berbitrate studio dengan mudah.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: '100% Aman & Privasi Terjaga',
      desc: 'Kami tidak menyimpan rekaman video atau riwayat unduhan Anda di server manapun. Bebas tanpa login.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-blue-400" />,
      title: 'Kompatibel Semua Perangkat',
      desc: 'Berjalan mulus di Google Chrome, Safari, Firefox, Android, iOS iPhone/iPad, Windows, dan macOS.',
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-800/80">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          Kenapa Memilih OmniDownloader?
        </h2>
        <p className="text-sm text-slate-400">
          Standar baru platform download media modern dengan antarmuka bersih dan performa instan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-[#121626]/40 border border-slate-800/80 hover:border-slate-700 transition duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-md">
              {item.icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
