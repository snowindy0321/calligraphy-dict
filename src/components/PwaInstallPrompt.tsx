import React, { useState, useEffect } from 'react';
import { Download, X, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

const DISMISS_STORAGE_KEY = 'calligraphy_pwa_prompt_dismissed_v3';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__deferredPwaPrompt || null
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'other'>('other');
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // 1. 若已經在獨立 App 模式 (standalone) 運作，不再顯示安裝提示
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    // 2. 僅在手機 / 行動裝置 (Android 或 iOS) 顯示安裝提示
    if (!isIos && !isAndroid) return;

    setDeviceType(isIos ? 'ios' : 'android');

    const isDismissed = sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    if (!isDismissed) {
      setShowPrompt(true);
    }

    const syncPrompt = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
        setShowManualGuide(false);
        if (!isDismissed) setShowPrompt(true);
      }
    };

    syncPrompt();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setShowManualGuide(false);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', syncPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', syncPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
    } else {
      // 若手機已經安裝過該 PWA 或處於 App 內建瀏覽器，展開提醒說明
      setShowManualGuide(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-5 left-4 right-22 z-40 bg-ink-900 text-paper-50 rounded-2xl p-3 shadow-2xl border border-ink-800 flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-cinnabar-600 text-white font-serif font-bold text-base flex items-center justify-center shrink-0">
          帖
        </div>
        <div className="min-w-0">
          <p className="font-serif font-bold text-xs truncate">
            安裝「書法字帖字典」App
          </p>
          {deviceType === 'ios' ? (
            <p className="text-[11px] text-paper-200 flex items-center gap-1 mt-0.5 leading-tight">
              點擊下方 <Share className="w-3 h-3 inline shrink-0 text-cinnabar-600" /> 分享 ➔「加入主畫面」
            </p>
          ) : showManualGuide ? (
            <p className="text-[11px] text-amber-200 flex items-center gap-0.5 mt-0.5 leading-tight">
              請點右上角 <MoreVertical className="w-3 h-3 inline shrink-0" /> 選單 ➔「安裝應用程式」
            </p>
          ) : (
            <p className="text-[11px] text-paper-200 truncate mt-0.5">
              建立桌面捷徑，以獨立全螢幕模式開啟
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {deviceType === 'android' && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[36px] px-3.5 rounded-xl bg-cinnabar-600 hover:bg-cinnabar-700 active:scale-95 text-white font-serif font-bold text-xs flex items-center gap-1 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            安裝
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg text-paper-300 hover:text-white hover:bg-ink-800 flex items-center justify-center transition-colors"
          aria-label="關閉提示"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
