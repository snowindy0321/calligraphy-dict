import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit3, Check, Grid3X3, Loader2 } from 'lucide-react';
import { CalligraphyEntry } from '../types';
import { SCRIPT_TYPES, extractBopomofoInitial } from '../constants/bopomofo';
import { getZhuyinCandidates } from '../utils/charToZhuyin';
import {
  updateCalligraphyEntry,
  deleteCalligraphyEntry,
} from '../lib/calligraphyService';

interface EntryDetailModalProps {
  entry: CalligraphyEntry | null;
  onClose: () => void;
  onUpdated: (updated: CalligraphyEntry) => void;
  onDeleted: (deletedId: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showNineGrid, setShowNineGrid] = useState(true);
  const [charInput, setCharInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [zhuyinInput, setZhuyinInput] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [scriptType, setScriptType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setCharInput(entry.char);
      setIsComposing(false);
      setZhuyinInput(entry.zhuyin);
      setSourceName(entry.source_name || '');
      setScriptType(entry.script_type || '');
      setNotes(entry.notes || '');
      setIsEditing(false);
      setConfirmDelete(false);
      setErrorMsg(null);
    }
  }, [entry]);

  if (!entry) return null;

  const applySingleCharAndZhuyin = (rawVal: string) => {
    const chars = Array.from(rawVal.trim());
    const singleChar = chars.length > 0 ? chars[0] : '';
    setCharInput(singleChar);
    const candidates = getZhuyinCandidates(singleChar);
    if (candidates.length > 0) {
      setZhuyinInput(candidates[0]);
    }
  };

  const handleCharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposing) {
      setCharInput(e.target.value);
      return;
    }
    applySingleCharAndZhuyin(e.target.value);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    applySingleCharAndZhuyin(e.currentTarget.value);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const updated = await updateCalligraphyEntry({
        id: entry.id,
        char: charInput,
        zhuyin: zhuyinInput,
        source_name: sourceName,
        script_type: scriptType,
        notes: notes,
      });
      onUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '更新失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setErrorMsg(null);
    setIsDeleting(true);
    try {
      await deleteCalligraphyEntry(entry);
      onDeleted(entry.id);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSource = Boolean(entry.source_name?.trim());
  const hasScript = Boolean(entry.script_type?.trim());
  const hasNotes = Boolean(entry.notes?.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/75 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-50 w-full max-w-lg rounded-3xl border border-paper-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 bg-paper-100 border-b border-paper-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-ink-900">
              「{entry.char}」字帖檢視
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-cinnabar-50 text-cinnabar-600 font-medium">
              首音：{entry.bopomofo_initial}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowNineGrid((v) => !v)}
              title="切換九宮格臨帖輔助線"
              className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-colors ${
                showNineGrid
                  ? 'bg-cinnabar-600 text-white'
                  : 'text-ink-600 hover:bg-paper-200'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-ink-600 hover:bg-paper-200 transition-colors"
              aria-label="關閉燈箱"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative aspect-square w-full bg-white border-b border-paper-200 flex items-center justify-center p-4">
          <img
            src={entry.image_url}
            alt={entry.char}
            className="w-full h-full object-contain select-none"
          />

          {showNineGrid && (
            <div className="pointer-events-none absolute inset-4 border-2 border-cinnabar-600/35">
              <div className="absolute inset-y-0 left-1/3 border-l border-dashed border-cinnabar-600/35" />
              <div className="absolute inset-y-0 left-2/3 border-l border-dashed border-cinnabar-600/35" />
              <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-cinnabar-600/35" />
              <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-cinnabar-600/35" />
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-cinnabar-50 text-cinnabar-700 text-xs border border-cinnabar-600/30">
              {errorMsg}
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline flex-wrap gap-2.5">
                    <h3 className="font-serif text-3xl font-bold text-ink-900">
                      {entry.char}
                    </h3>
                    <span className="text-lg font-medium text-cinnabar-600">
                      {entry.zhuyin}
                    </span>
                    {hasScript && (
                      <span className="text-xs font-serif px-2.5 py-0.5 rounded-md bg-paper-200 text-ink-800">
                        {entry.script_type}
                      </span>
                    )}
                  </div>

                  {hasSource && (
                    <p className="text-sm font-serif text-ink-600">
                      碑帖出處：{entry.source_name}
                    </p>
                  )}

                  {hasNotes && (
                    <p className="text-sm font-serif text-ink-800 bg-paper-100/80 p-3 rounded-xl border border-paper-200 whitespace-pre-wrap break-words leading-relaxed">
                      {entry.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="min-h-[40px] px-3.5 rounded-xl bg-paper-100 text-ink-800 hover:bg-paper-200 text-xs font-serif font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    編輯
                  </button>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="min-h-[40px] px-3.5 rounded-xl bg-cinnabar-50 text-cinnabar-600 hover:bg-cinnabar-600 hover:text-white text-xs font-serif font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      刪除
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="min-h-[40px] px-3.5 rounded-xl bg-cinnabar-600 text-white text-xs font-serif font-bold flex items-center gap-1.5"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '確認刪除？'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">
                    中文字（限單字）
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={1}
                    value={charInput}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={handleCompositionEnd}
                    onChange={handleCharChange}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-paper-300 font-serif text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">
                    完整注音（首音：{extractBopomofoInitial(zhuyinInput) || '-'}）
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={zhuyinInput}
                    onChange={(e) => setZhuyinInput(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-paper-300 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">
                    碑帖出處
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-paper-300 font-serif text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-ink-600 mb-1">
                    書體
                  </label>
                  <select
                    value={scriptType}
                    onChange={(e) => setScriptType(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-paper-300 font-serif text-sm"
                  >
                    {SCRIPT_TYPES.map((st) => (
                      <option key={st || 'none'} value={st}>
                        {st === '' ? '無（不標註）' : st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif text-ink-600 mb-1">
                  說明 / 備註
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="輸入臨帖重點或備註..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-paper-300 font-serif text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="min-h-[40px] px-4 rounded-xl border border-paper-300 text-xs font-serif"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[40px] px-5 rounded-xl bg-ink-900 text-paper-50 text-xs font-serif font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  儲存修改
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
