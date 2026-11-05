import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  Settings,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { CalligraphyEntry } from './types';
import { fetchCalligraphyEntries } from './lib/calligraphyService';
import { getSupabaseConfig } from './lib/supabase';
import { BopomofoNavBar } from './components/BopomofoNavBar';
import { CalligraphyCard } from './components/CalligraphyCard';
import { UploadCropModal } from './components/UploadCropModal';
import { EntryDetailModal } from './components/EntryDetailModal';
import { AuthSettingsModal } from './components/AuthSettingsModal';

export const App: React.FC = () => {
  const [selectedInitial, setSelectedInitial] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entries, setEntries] = useState<CalligraphyEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 彈窗狀態
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [activeEntry, setActiveEntry] = useState<CalligraphyEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { isConfigured } = getSupabaseConfig();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

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

  const handleCreated = (newEntry: CalligraphyEntry) => {
    showToast(`已成功收錄「${newEntry.char}（${newEntry.zhuyin}）」字帖！`);
    loadEntries();
  };

  const handleUpdated = (updated: CalligraphyEntry) => {
    setActiveEntry(updated);
    showToast(`已更新「${updated.char}」字帖資訊`);
    loadEntries();
  };

  const handleDeleted = (_deletedId: string) => {
    showToast('已刪除該筆字帖紀錄');
    loadEntries();
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 text-ink-900">
      {/* 頂部東方書法文風品牌標題列 */}
      <header className="bg-paper-100/90 border-b border-paper-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* 硃砂印章標誌 */}
            <div className="w-10 h-10 rounded-xl bg-cinnabar-600 text-paper-50 font-serif font-bold text-xl flex items-center justify-center shadow-xs select-none">
              帖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-ink-900">
                  個人書法帖寫字字典
                </h1>
                {!isConfigured && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-100/80 text-amber-900 border border-amber-300">
                    本機展示模式
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-600 font-serif">
                臨帖拍照裁切・三十七注音首字索引・碑帖對照
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-800 hover:bg-paper-200 transition-colors flex items-center justify-center gap-1.5 text-xs font-serif"
              title="Supabase 設定與管理員驗證"
            >
              <Settings className="w-4 h-4 text-ink-600" />
              <span className="hidden sm:inline">資料庫 / 驗證</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="min-h-[44px] px-4 rounded-xl bg-ink-900 text-paper-50 font-serif font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-ink-800 active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>新增字帖</span>
            </button>
          </div>
        </div>
      </header>

      {/* 固定頂端橫向 37 個注音符號快速索引導覽列 */}
      <BopomofoNavBar
        selectedInitial={selectedInitial}
        onSelectInitial={(initial) => setSelectedInitial(initial)}
      />

      {/* 主內容區：搜尋列與字帖卡片網格 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* 多功能即時搜尋列 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋中文字（如：永）、注音片段（如：ㄩㄥ）或碑帖出處（如：蘭亭序）..."
              className="w-full min-h-[46px] pl-11 pr-10 rounded-2xl bg-white border border-paper-200 text-sm text-ink-900 placeholder:text-ink-400 shadow-scroll focus:outline-none focus:border-ink-800 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="min-w-[40px] min-h-[40px] absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-ink-400 hover:text-ink-800"
                aria-label="清除搜尋關鍵字"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 當前篩選狀態指示 */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-serif text-ink-600 px-1">
            <span>
              索引分類：
              <strong className="text-cinnabar-600 font-bold ml-1">
                {selectedInitial === 'ALL' ? '全部注音' : `首音「${selectedInitial}」`}
              </strong>
            </span>
            <span className="text-paper-300">|</span>
            <span>共 {entries.length} 帖</span>
          </div>
        </div>

        {/* 錯誤提示 */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-cinnabar-50 border border-cinnabar-600/30 text-cinnabar-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* 字帖卡片網格展示（手機 2 欄，平板 3-4 欄，電腦 5-6 欄） */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-ink-600">
            <Loader2 className="w-7 h-7 animate-spin text-cinnabar-600" />
            <p className="font-serif text-sm">正在翻閱書法字帖索引...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white/70 rounded-3xl border border-paper-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-paper-100 text-ink-600 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-base font-bold text-ink-900">
                尚無符合條件的書法字帖
              </h2>
              <p className="text-xs text-ink-600 max-w-sm mx-auto">
                {selectedInitial !== 'ALL' || searchQuery
                  ? '請嘗試切換其他注音首字，或清除關鍵字重新檢索。'
                  : '點擊右上角或下方「新增字帖」按鈕，立即拍照並框選您的第一個書法單字。'}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-1">
              {(selectedInitial !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInitial('ALL');
                    setSearchQuery('');
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-paper-300 text-xs font-serif font-bold text-ink-800 hover:bg-paper-100"
                >
                  顯示全部字帖
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="min-h-[44px] px-5 rounded-xl bg-cinnabar-600 text-white text-xs font-serif font-bold flex items-center gap-1.5 hover:bg-cinnabar-700"
              >
                <Plus className="w-4 h-4" />
                立即拍照新增字帖
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {entries.map((entry) => (
              <CalligraphyCard
                key={entry.id}
                entry={entry}
                onSelect={(item) => setActiveEntry(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 手機端右下角懸浮拍照新增按鈕 (FAB) */}
      <button
        type="button"
        onClick={() => setIsUploadOpen(true)}
        className="sm:hidden fixed right-5 bottom-6 z-30 w-14 h-14 rounded-2xl bg-cinnabar-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="拍照新增字帖"
      >
        <Plus className="w-6 h-6" />
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

      {/* 彈窗：字帖燈箱大圖檢視（含九宮格輔助線、編輯與刪除） */}
      <EntryDetailModal
        entry={activeEntry}
        onClose={() => setActiveEntry(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      {/* 彈窗：Supabase 連線與 RLS 管理員登入設定 */}
      <AuthSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
