import React from 'react';
import { CalligraphyEntry } from '../types';

interface CalligraphyCardProps {
  entry: CalligraphyEntry;
  onSelect: (entry: CalligraphyEntry) => void;
}

export const CalligraphyCard: React.FC<CalligraphyCardProps> = ({
  entry,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="group text-left bg-white rounded-2xl border border-paper-200 overflow-hidden shadow-scroll hover:shadow-md hover:border-paper-300 transition-all duration-200 flex flex-col focus:outline-none focus:ring-2 focus:ring-cinnabar-600"
    >
      {/* 1:1 白底黑字字帖縮圖容器 */}
      <div className="relative aspect-square w-full bg-white overflow-hidden border-b border-paper-100 flex items-center justify-center p-2">
        <img
          src={entry.image_url}
          alt={`${entry.char} (${entry.zhuyin})`}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {entry.script_type && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-serif bg-paper-100/90 text-ink-800 rounded-md border border-paper-200 backdrop-blur-xs">
            {entry.script_type}
          </span>
        )}
      </div>

      {/* 下方字元、注音與碑帖出處標註 */}
      <div className="p-3 bg-paper-50/60 flex-1 flex flex-col justify-between">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-serif text-xl font-bold text-ink-900 tracking-wide">
            {entry.char}
          </span>
          <span className="font-sans text-sm font-medium text-cinnabar-600 bg-cinnabar-50 px-2 py-0.5 rounded-md">
            {entry.zhuyin}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs text-ink-600 truncate">
          <span className="truncate font-serif">
            {entry.source_name || '未標註碑帖出處'}
          </span>
        </div>
      </div>
    </button>
  );
};
