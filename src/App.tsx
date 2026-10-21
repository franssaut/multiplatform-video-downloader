import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DownloaderInput } from './components/DownloaderInput';
import { MediaCard } from './components/MediaCard';
import { BatchDownloader } from './components/BatchDownloader';
import { DownloadHistory } from './components/DownloadHistory';
import { SupportedPlatforms } from './components/SupportedPlatforms';
import { FeaturesSection } from './components/FeaturesSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { VideoPreviewModal } from './components/VideoPreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import type { Platform, MediaResult, QualityOption, DownloadHistoryItem } from './types';
import { detectPlatform, isValidUrl, fetchMediaInfo } from './utils/detector';
import { PLATFORMS_DATA } from './data/mockData';

export function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'history'>('single');
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState<MediaResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // History state with localStorage
  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omni_download_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal states
  const [previewData, setPreviewData] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto detect platform whenever input changes
  useEffect(() => {
    if (url.trim()) {
      const p = detectPlatform(url);
      setDetectedPlatform(p);
      if (errorMsg) setErrorMsg('');
    } else {
      setDetectedPlatform('unknown');
    }
  }, [url]);

  // Handle PWA Web Share Target and URL shortcut parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'batch' || tabParam === 'history' || tabParam === 'single') {
        setActiveTab(tabParam);
      }

      // Check for shared URL from Android/iOS Web Share Target
      const sharedUrl = params.get('url') || params.get('text');
      if (sharedUrl) {
        // Extract URL from shared text if needed
        const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/);
        const extracted = urlMatch ? urlMatch[0] : sharedUrl.trim();
        if (extracted.startsWith('http')) {
          setUrl(extracted);
          handleFetchMedia(extracted);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('omni_download_history', JSON.stringify(history));
    } catch {
      // storage unavailable
    }
  }, [history]);

  const handleFetchMedia = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || url).trim();

    if (!targetUrl) {
      setErrorMsg('Silakan masukkan tautan video yang valid terlebih dahulu.');
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setErrorMsg('Tautan tidak valid. Pastikan dimulai dengan http:// atau https://');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setMediaResult(null);

    try {
      const result = await fetchMediaInfo(targetUrl);
      setMediaResult(result);
    } catch {
      setErrorMsg('Gagal menganalisis video. Pastikan tautan masih aktif dan tidak terkunci privat.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSuccess = (media: MediaResult, format: QualityOption) => {
    const historyEntry: DownloadHistoryItem = {
      id: 'hist_' + Date.now(),
      media,
      format,
      downloadedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [historyEntry, ...prev.slice(0, 19)]);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('omni_download_history');
    } catch {
      // ignored
    }
  };

  const handleSelectPlatformFromGrid = (platform: Platform) => {
    const config = PLATFORMS_DATA.find((p) => p.id === platform);
    if (config) {
      setActiveTab('single');
      setUrl(config.exampleUrl);
      handleFetchMedia(config.exampleUrl);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-grow pb-24 md:pb-0">
        {activeTab === 'single' && (
          <>
            {/* Hero Section */}
            <HeroSection
              selectedPlatform={detectedPlatform}
              onSelectPlatformBadge={(p) => handleSelectPlatformFromGrid(p)}
            />

            {/* Smart Input Form */}
            <DownloaderInput
              url={url}
              setUrl={setUrl}
              detectedPlatform={detectedPlatform}
              isLoading={isLoading}
              onSubmit={handleFetchMedia}
              errorMsg={errorMsg}
            />

            {/* Media Result Presentation */}
            {mediaResult && (
              <MediaCard
                media={mediaResult}
                onOpenPreview={(videoUrl, title) =>
                  setPreviewData({ isOpen: true, url: videoUrl, title })
                }
                onDownloadSuccess={handleDownloadSuccess}
              />
            )}

            {/* Supported Platforms Grid */}
            <div id="platforms">
              <SupportedPlatforms onSelectPlatform={handleSelectPlatformFromGrid} />
            </div>

            {/* Features Highlight */}
            <div id="features">
              <FeaturesSection />
            </div>

            {/* FAQ Accordion */}
            <div id="faq">
              <FaqSection />
            </div>
          </>
        )}

        {activeTab === 'batch' && (
          <div className="py-8">
            <div className="text-center max-w-xl mx-auto px-4 mb-4">
              <h1 className="text-3xl font-extrabold text-white">Batch Video Downloader</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Kumpulkan beberapa video sekaligus dan download antrean secara teratur.
              </p>
            </div>
            <BatchDownloader onDownloadSuccess={handleDownloadSuccess} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="py-8">
            <div className="text-center max-w-xl mx-auto px-4 mb-4">
              <h1 className="text-3xl font-extrabold text-white">Riwayat Unduhan</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Akses kembali file yang sudah pernah Anda unduh di sesi browser ini.
              </p>
            </div>
            <DownloadHistory
              history={history}
              onClearHistory={handleClearHistory}
              onOpenPreview={(vUrl, title) =>
                setPreviewData({ isOpen: true, url: vUrl, title })
              }
            />
          </div>
        )}
      </main>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={previewData.isOpen}
        videoUrl={previewData.url}
        title={previewData.title}
        onClose={() => setPreviewData({ isOpen: false, url: '', title: '' })}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
