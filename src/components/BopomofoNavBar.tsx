import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { BOPOMOFO_SYMBOLS } from '../constants/bopomofo';

interface BopomofoNavBarProps {
  selectedInitial: string; // 'ALL' 或 37 個注音符號
  onSelectInitial: (initial: string) => void;
  availableInitials?: Set<string>;
}

export const BopomofoNavBar: React.FC<BopomofoNavBarProps> = ({
  selectedInitial,
  onSelectInitial,
  availableInitials,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = (symbol: string) => {
    onSelectInitial(symbol);
    setIsExpanded(false);
  };

  // 支援電腦端滑鼠滾輪垂直滾動時，自動轉為水平滑動注音列
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY * 1.5, behavior: 'smooth' });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-20 bg-paper-50/95 backdrop-blur-md border-b border-paper-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2">
        <div className="flex items-center gap-1.5">
          {/* 電腦端專用：向左捲動按鈕 */}
          <button
            type="button"
            onClick={() => scrollByAmount(-280)}
            className="hidden sm:flex shrink-0 w-9 h-10 rounded-xl bg-white border border-paper-300 text-ink-700 hover:bg-paper-100 items-center justify-center transition-colors"
            title="向左捲動注音列"
            aria-label="向左捲動注音列"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 橫向滑動列（手機支援觸控滑動，電腦支援滑鼠滾輪與左右按鈕） */}
          <div
            ref={scrollRef}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
            role="tablist"
            aria-label="注音符號快速索引"
          >
            <button
              type="button"
              onClick={() => handleSelect('ALL')}
              className={`shrink-0 min-h-[40px] px-3.5 rounded-xl font-serif font-bold text-sm transition-all flex items-center justify-center ${
                selectedInitial === 'ALL'
                  ? 'bg-ink-900 text-paper-50 shadow-xs'
                  : 'bg-paper-100 text-ink-800 hover:bg-paper-200 active:scale-95'
              }`}
            >
              全部
            </button>

            {BOPOMOFO_SYMBOLS.map((symbol) => {
              const isActive = selectedInitial === symbol;
              const hasData = !availableInitials || availableInitials.has(symbol);
              return (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => handleSelect(symbol)}
                  className={`shrink-0 min-w-[40px] min-h-[40px] rounded-xl font-serif text-base font-bold transition-all flex items-center justify-center relative ${
                    isActive
                      ? 'bg-cinnabar-600 text-white shadow-xs scale-105'
                      : hasData
                      ? 'bg-paper-100 text-ink-900 hover:bg-paper-200 active:scale-95'
                      : 'bg-paper-100/50 text-ink-400 hover:bg-paper-200 active:scale-95'
                  }`}
                  aria-selected={isActive}
                >
                  {symbol}
                  {hasData && !isActive && availableInitials && (
                    <span className="w-1 h-1 rounded-full bg-cinnabar-600 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 電腦端專用：向右捲動按鈕 */}
          <button
            type="button"
            onClick={() => scrollByAmount(280)}
            className="hidden sm:flex shrink-0 w-9 h-10 rounded-xl bg-white border border-paper-300 text-ink-700 hover:bg-paper-100 items-center justify-center transition-colors"
            title="向右捲動注音列"
            aria-label="向右捲動注音列"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 一鍵展開所有注音按鈕 */}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? '收起注音總覽' : '展開全部注音'}
            className={`shrink-0 min-h-[40px] px-2.5 rounded-xl border text-xs font-serif font-bold flex items-center gap-1 transition-colors ${
              isExpanded
                ? 'bg-ink-900 text-paper-50 border-ink-900'
                : 'bg-white text-ink-800 border-paper-300 hover:bg-paper-100'
            }`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">收起</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4 text-cinnabar-600" />
                <span>總覽</span>
              </>
            )}
          </button>
        </div>

        {/* 展開的 37 注音全覽面板 */}
        {isExpanded && (
          <div className="mt-2 pt-2.5 pb-1 border-t border-paper-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-serif text-ink-600">
                點擊任一注音直接篩選（紅點代表已有收錄字帖）
              </span>
              <button
                type="button"
                onClick={() => handleSelect('ALL')}
                className="text-xs font-serif font-bold text-cinnabar-600 hover:underline"
              >
                顯示全部
              </button>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-13 gap-1.5">
              {BOPOMOFO_SYMBOLS.map((symbol) => {
                const isActive = selectedInitial === symbol;
                const hasData = !availableInitials || availableInitials.has(symbol);
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => handleSelect(symbol)}
                    className={`min-h-[42px] rounded-xl font-serif text-base font-bold flex items-center justify-center relative transition-all ${
                      isActive
                        ? 'bg-cinnabar-600 text-white shadow-xs'
                        : hasData
                        ? 'bg-white border border-paper-300 text-ink-900 hover:border-cinnabar-600'
                        : 'bg-paper-100/60 text-ink-400 hover:bg-paper-200'
                    }`}
                  >
                    {symbol}
                    {hasData && !isActive && availableInitials && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cinnabar-600 absolute top-1.5 right-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
