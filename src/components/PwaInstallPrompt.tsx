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

const DISMISS_STORAGE_KEY = 'calligraphy_pwa_prompt_dismissed_v2';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__deferredPwaPrompt || null
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // 1. 若已經在獨立 App 模式 (standalone) 運作，不再顯示安裝提示
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    // 2. 僅在手機 / 行動裝置 (Android 或 iOS) 顯示安裝提示，電腦版瀏覽器不彈出打擾
    if (!isIos && !isAndroid) return;

    setDeviceType(isIos ? 'ios' : 'android');

    const isDismissed = sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    if (!isDismissed) {
      setShowPrompt(true);
    }

    // 3. 若在 main.tsx 已預先捕獲 beforeinstallprompt 事件，同步至狀態
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    window.__deferredPwaPrompt = null;
    setDeferredPrompt(null);
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
            將「書法字帖字典」加到手機主畫面
          </p>
          {deviceType === 'ios' ? (
            <p className="text-[11px] text-paper-200 flex items-center gap-1 mt-0.5 leading-tight">
              點擊下方 <Share className="w-3 h-3 inline shrink-0 text-cinnabar-600" /> 分享 ➔「加入主畫面」
            </p>
          ) : deferredPrompt ? (
            <p className="text-[11px] text-paper-200 truncate mt-0.5">
              建立桌面捷徑，以獨立全螢幕模式開啟
            </p>
          ) : (
            <p className="text-[11px] text-paper-200 flex items-center gap-0.5 mt-0.5 leading-tight">
              點右上角 <MoreVertical className="w-3 h-3 inline shrink-0 text-cinnabar-600" /> 選單 ➔「安裝應用程式 / 加到主畫面」
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="min-h-[34px] px-3 rounded-xl bg-cinnabar-600 hover:bg-cinnabar-700 text-white font-serif font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
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
