import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  User,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { CalligraphyEntry } from './types';
import {
  fetchCalligraphyEntries,
  fetchAvailableInitials,
} from './lib/calligraphyService';
import { supabase, getSupabaseConfig } from './lib/supabase';
import { BOPOMOFO_SYMBOLS } from './constants/bopomofo';
import { BopomofoNavBar } from './components/BopomofoNavBar';
import { CalligraphyCard } from './components/CalligraphyCard';
import { UploadCropModal } from './components/UploadCropModal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { AuthSettingsModal } from './components/AuthSettingsModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

export const App: React.FC = () => {
  const [selectedInitial, setSelectedInitial] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entries, setEntries] = useState<CalligraphyEntry[]>([]);
  const [availableInitialsSet, setAvailableInitialsSet] = useState<Set<string>>(
    () => new Set()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 登入狀態與提示
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginPromptMessage, setLoginPromptMessage] = useState<string | null>(null);

  // 彈窗狀態
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [activeEntry, setActiveEntry] = useState<CalligraphyEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // 側邊通訊錄快速索引列 (Alphabet Index Bar) 當前高亮注音
  const [activeScrollInitial, setActiveScrollInitial] = useState<string>('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const { isConfigured } = getSupabaseConfig();

  // 監聽登入狀態
  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [isConfigured]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // 獨立載入全域已收錄的注音首字集合，確保切換單一注音篩選時其他注音紅點不會消失
  const refreshAvailableInitials = useCallback(async () => {
    try {
      const set = await fetchAvailableInitials();
      setAvailableInitialsSet(set);
    } catch {
      // 忽略錯誤
    }
  }, []);

  useEffect(() => {
    refreshAvailableInitials();
  }, [refreshAvailableInitials]);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchCalligraphyEntries({
        initial: selectedInitial,
        searchQuery,
      });
      setEntries(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '載入字帖失敗');
    } finally {
      setIsLoading(false);
    }
  }, [selectedInitial, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEntries();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadEntries]);

  // 5A. 將字帖資料依 bopomofo_initial 分組，並嚴格依照台灣標準 37 個注音符號順序排列（只保留有資料的分組）
  const groupedSections = useMemo(() => {
    const map = new Map<string, CalligraphyEntry[]>();
    for (const item of entries) {
      const key = item.bopomofo_initial || '其他';
      const list = map.get(key);
      if (list) {
        list.push(item);
      } else {
        map.set(key, [item]);
      }
    }

    const ordered: { initial: string; items: CalligraphyEntry[] }[] = [];
    for (const sym of BOPOMOFO_SYMBOLS) {
      const list = map.get(sym);
      if (list && list.length > 0) {
        ordered.push({ initial: sym, items: list });
        map.delete(sym);
      }
    }
    for (const [key, list] of map.entries()) {
      if (list.length > 0) {
        ordered.push({ initial: key, items: list });
      }
    }
    return ordered;
  }, [entries]);

  // 5B. 使用 IntersectionObserver 監聽視窗捲動，即時更新側邊注音索引列的 Active 狀態
  useEffect(() => {
    if (groupedSections.length === 0) {
      setActiveScrollInitial('');
      return;
    }

    setActiveScrollInitial((prev) =>
      prev && groupedSections.some((g) => g.initial === prev)
        ? prev
        : groupedSections[0].initial
    );

    const observer = new IntersectionObserver(
      (observedEntries) => {
        const visible = observedEntries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const sym = visible[0].target.getAttribute('data-initial');
          if (sym) setActiveScrollInitial(sym);
        }
      },
      {
        rootMargin: '-110px 0px -65% 0px',
        threshold: 0,
      }
    );

    for (const group of groupedSections) {
      const el = sectionRefs.current[group.initial];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [groupedSections]);

  // 點擊側邊快速索引列平滑捲動至對應注音區塊錨點
  const handleScrollToSection = (symbol: string) => {
    const targetEl = sectionRefs.current[symbol];
    if (targetEl) {
      setActiveScrollInitial(symbol);
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 6. 點擊新增字帖時：若尚未登入帳號，先彈出登入視窗要求登入
  const handleTriggerAdd = () => {
    if (isConfigured && !userEmail) {
      setLoginPromptMessage('請先登入帳號，即可拍照新增書法字帖');
      setIsSettingsOpen(true);
      return;
    }
    setIsUploadOpen(true);
  };

  const handleCreated = (newEntry: CalligraphyEntry) => {
    showToast(`已成功收錄「${newEntry.char}（${newEntry.zhuyin}）」字帖！`);
    loadEntries();
    refreshAvailableInitials();
  };

  const handleUpdated = (updated: CalligraphyEntry) => {
    setActiveEntry(updated);
    showToast(`已更新「${updated.char}」字帖資訊`);
    loadEntries();
    refreshAvailableInitials();
  };

  const handleDeleted = (_deletedId: string) => {
    showToast('已刪除該筆字帖紀錄與雲端圖檔');
    loadEntries();
    refreshAvailableInitials();
  };

  const displayUsername = userEmail ? userEmail.split('@')[0] : null;
  const hasSideIndex = groupedSections.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 text-ink-900">
      {/* 1A. 頂部 Header 簡化（h-14 px-4 單行不換行，左側 Logo + 標題，右側使用者帳號按鈕） */}
      <header className="bg-paper-100/95 border-b border-paper-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center h-14 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cinnabar-600 text-paper-50 font-serif font-bold text-base flex items-center justify-center shadow-xs shrink-0 select-none">
              帖
            </div>
            <h1 className="font-serif text-lg font-bold truncate text-ink-900">
              書法字帖字典
            </h1>
          </div>

          {/* 9. 右上方登入按鈕，登入後顯示目前帳號名稱 */}
          <button
            type="button"
            onClick={() => {
              setLoginPromptMessage(null);
              setIsSettingsOpen(true);
            }}
            className="shrink-0 min-h-[38px] max-w-[160px] px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-800 hover:bg-paper-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-serif"
            title={userEmail ? `目前登入：${userEmail}` : '會員登入'}
          >
            <User className={`w-4 h-4 shrink-0 ${userEmail ? 'text-cinnabar-600' : 'text-ink-600'}`} />
            <span className="truncate font-medium">
              {displayUsername || '登入'}
            </span>
          </button>
        </div>
      </header>

      {/* 頂端橫向注音導覽列 + 一鍵展開總覽面板 */}
      <BopomofoNavBar
        selectedInitial={selectedInitial}
        onSelectInitial={(initial) => setSelectedInitial(initial)}
        availableInitials={availableInitialsSet}
      />

      {/* 主內容區：與頂部 Header 對齊置中並水平填滿（px-4 sm:px-6） */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4">
        {/* 1B. 搜尋列：與下方卡片水平對齊置中並 100% 填滿 */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋文字或注音..."
            className="w-full h-11 pl-10 pr-9 rounded-2xl bg-white border border-paper-200 text-sm text-ink-900 placeholder:text-ink-400 shadow-scroll focus:outline-none focus:border-ink-800 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-9 h-9 absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-ink-400 hover:text-ink-800"
              aria-label="清除搜尋關鍵字"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 錯誤提示 */}
        {errorMessage && (
          <div className="w-full p-3.5 rounded-2xl bg-cinnabar-50 border border-cinnabar-600/30 text-cinnabar-700 text-xs sm:text-sm">
            {errorMessage}
          </div>
        )}

        {/* 1C & 5A. 空白狀態緊湊化（與搜尋框對齊置中並水平填滿） / 通訊錄樣式注音分組垂直渲染 */}
        {isLoading ? (
          <div className="w-full py-14 flex flex-col items-center justify-center gap-2.5 text-ink-600">
            <Loader2 className="w-6 h-6 animate-spin text-cinnabar-600" />
            <p className="font-serif text-xs">載入字帖中...</p>
          </div>
        ) : !hasSideIndex ? (
          <div className="w-full py-10 px-4 text-center bg-white/70 rounded-2xl border border-paper-200 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-paper-100 text-ink-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="font-serif text-sm font-medium text-ink-700">
              尚無字帖，點擊下方 ＋ 新增
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-24 pr-8 sm:pr-10">
            {groupedSections.map((group) => (
              <section
                key={group.initial}
                id={`section-${group.initial}`}
                data-initial={group.initial}
                ref={(el) => {
                  sectionRefs.current[group.initial] = el;
                }}
                className="scroll-mt-28 space-y-2.5"
              >
                {/* 每個注音區塊頂部的 Sticky 標題 */}
                <div className="sticky top-[57px] z-10 py-1.5 px-3 bg-paper-100/95 backdrop-blur-xs rounded-xl border border-paper-200 flex items-center justify-between">
                  <h2 className="font-serif text-base font-bold text-cinnabar-600 flex items-center gap-2">
                    <span>{group.initial}</span>
                  </h2>
                  <span className="text-[11px] font-serif text-ink-600">
                    {group.items.length} 帖
                  </span>
                </div>

                {/* 該注音的字帖網格 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {group.items.map((entry) => (
                    <CalligraphyCard
                      key={entry.id}
                      entry={entry}
                      onSelect={(item) => setActiveEntry(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* 5B. 側邊快速索引列（Alphabet Index Bar） */}
      {hasSideIndex && (
        <nav
          aria-label="側邊注音分組快速索引"
          className="fixed right-1.5 sm:right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center py-1.5 px-1 rounded-full bg-paper-100/90 backdrop-blur-xs border border-paper-200 shadow-scroll max-h-[70vh] overflow-y-auto no-scrollbar"
        >
          {groupedSections.map((group) => {
            const isCurrent = activeScrollInitial === group.initial;
            return (
              <button
                key={group.initial}
                type="button"
                onClick={() => handleScrollToSection(group.initial)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-serif text-xs font-bold flex items-center justify-center transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-cinnabar-600 text-white scale-110 shadow-xs'
                    : 'text-ink-700 hover:bg-paper-200'
                }`}
                title={`跳至「${group.initial}」分組`}
              >
                {group.initial}
              </button>
            );
          })}
        </nav>
      )}

      {/* 右下角紅色懸浮新增按鈕 (FAB)：手機與電腦端統一採用 56x56px (w-14 h-14) 飽滿圓角方塊比例 */}
      <button
        type="button"
        onClick={handleTriggerAdd}
        className="fixed right-5 bottom-6 z-30 w-14 h-14 rounded-2xl bg-cinnabar-600 hover:bg-cinnabar-700 text-white shadow-xl flex items-center justify-center active:scale-95 transition-all"
        aria-label="新增書法字帖"
        title="新增書法字帖"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* 成功提示 Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-ink-900 text-paper-50 text-xs font-serif shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cinnabar-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 彈窗：拍照上傳與 1:1 裁切壓縮 */}
      <UploadCropModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleCreated}
      />

      {/* 彈窗：字帖燈箱大圖檢視 */}
      <EntryDetailModal
        entry={activeEntry}
        onClose={() => setActiveEntry(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      {/* 彈窗：會員登入 */}
      <AuthSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setLoginPromptMessage(null);
        }}
        promptMessage={loginPromptMessage}
        onLoginSuccess={() => {
          if (loginPromptMessage) {
            setLoginPromptMessage(null);
            setIsUploadOpen(true);
          }
        }}
      />

      {/* 手機瀏覽時彈出安裝 PWA App 提示橫幅 */}
      <PwaInstallPrompt />
    </div>
  );
};

export default App;
