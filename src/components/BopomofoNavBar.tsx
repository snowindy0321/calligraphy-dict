import React, { useRef } from 'react';
import { BOPOMOFO_SYMBOLS } from '../constants/bopomofo';

interface BopomofoNavBarProps {
  selectedInitial: string; // 'ALL' 或 37 個注音符號
  onSelectInitial: (initial: string) => void;
}

export const BopomofoNavBar: React.FC<BopomofoNavBarProps> = ({
  selectedInitial,
  onSelectInitial,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-0 z-20 bg-paper-50/95 backdrop-blur-md border-b border-paper-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
          role="tablist"
          aria-label="注音符號快速索引"
        >
          {/* 全部按鈕 */}
          <button
            type="button"
            onClick={() => onSelectInitial('ALL')}
            className={`shrink-0 min-h-[44px] px-4 rounded-xl font-serif font-bold text-sm transition-all flex items-center justify-center ${
              selectedInitial === 'ALL'
                ? 'bg-ink-900 text-paper-50 shadow-sm'
                : 'bg-paper-100 text-ink-800 hover:bg-paper-200 active:scale-95'
            }`}
          >
            全部
          </button>

          {/* 37 個台灣標準注音符號 */}
          {BOPOMOFO_SYMBOLS.map((symbol) => {
            const isActive = selectedInitial === symbol;
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => onSelectInitial(symbol)}
                className={`shrink-0 min-w-[44px] min-h-[44px] rounded-xl font-serif text-base font-bold transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-cinnabar-600 text-white shadow-sm scale-105'
                    : 'bg-paper-100/80 text-ink-800 hover:bg-paper-200 active:scale-95'
                }`}
                aria-selected={isActive}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
