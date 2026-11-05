import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'calligraphy_pwa_prompt_dismissed_v1';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // 1. 若已經在獨立 App 模式 (standalone) 運作，不再提示安裝
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // 檢查使用者是否已在本次工作階段關閉過提示
    const isDismissed = sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';

    // 2. 偵測 Android / Chrome 原生 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. 偵測 iOS (iPhone / iPad) 手機瀏覽器
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    if (isIosDevice && !isDismissed) {
      setIsIosSafari(true);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-20 sm:left-auto sm:right-20 sm:w-88 z-40 bg-ink-900 text-paper-50 rounded-2xl p-3.5 shadow-2xl border border-ink-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-cinnabar-600 text-white font-serif font-bold text-lg flex items-center justify-center shrink-0">
          帖
        </div>
        <div className="min-w-0">
          <p className="font-serif font-bold text-xs sm:text-sm truncate">
            安裝「書法字帖字典」至主畫面
          </p>
          {isIosSafari && !deferredPrompt ? (
            <p className="text-[11px] text-paper-200 flex items-center gap-1 mt-0.5 leading-tight">
              點擊下方瀏覽器 <Share className="w-3.5 h-3.5 inline shrink-0 text-cinnabar-600" /> 分享 ➔「加入主畫面」
            </p>
          ) : (
            <p className="text-[11px] text-paper-200 truncate mt-0.5">
              全螢幕無網址列，離線快取更省流量
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[36px] px-3 rounded-xl bg-cinnabar-600 hover:bg-cinnabar-700 text-white font-serif font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            安裝
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-8 h-8 rounded-lg text-paper-300 hover:text-white hover:bg-ink-800 flex items-center justify-center transition-colors"
          aria-label="暫不安裝"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
