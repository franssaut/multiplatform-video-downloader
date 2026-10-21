import React, { useState } from 'react';
import { X, Settings, Server, Sliders, Check } from 'lucide-react';

export interface SettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [preferredQuality, setPreferredQuality] = useState('1080');
  const [preferredAudio, setPreferredAudio] = useState('320');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#121626] border border-slate-700/80 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Preferensi & Pengaturan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Default Video Quality */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kualitas Video Default</span>
            </label>
            <select
              value={preferredQuality}
              onChange={(e) => setPreferredQuality(e.target.value)}
              className="w-full bg-[#0b0f19] text-slate-200 text-xs sm:text-sm p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="max">Maksimal / 4K UHD (Jika Tersedia)</option>
              <option value="1080">1080p Full HD (Direkomendasikan)</option>
              <option value="720">720p HD (Hemat Kuota)</option>
              <option value="480">480p SD (Ukuran Kecil)</option>
            </select>
          </div>

          {/* Audio Bitrate */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <span>Bitrate Audio MP3 Default</span>
            </label>
            <select
              value={preferredAudio}
              onChange={(e) => setPreferredAudio(e.target.value)}
              className="w-full bg-[#0b0f19] text-slate-200 text-xs sm:text-sm p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="320">320 kbps (Kualitas Studio Audio)</option>
              <option value="256">256 kbps (High Quality)</option>
              <option value="192">192 kbps (Standard Quality)</option>
              <option value="128">128 kbps (Lightweight)</option>
            </select>
          </div>

          {/* Backend / Custom Instance */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Custom Backend Instance (Opsional)</span>
            </label>
            <input
              type="text"
              value={customApiUrl}
              onChange={(e) => setCustomApiUrl(e.target.value)}
              placeholder="https://cobalt.instance.domain atau server lokal"
              className="w-full bg-[#0b0f19] text-slate-200 placeholder-slate-600 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Biarkan kosong untuk menggunakan engine bawaan OmniDownloader otomatis.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition shadow-lg shadow-cyan-500/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Pengaturan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
