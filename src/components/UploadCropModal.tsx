import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Camera,
  Upload,
  X,
  Check,
  ZoomIn,
  Loader2,
} from 'lucide-react';
import { getCroppedWebpBlob, PixelCrop } from '../utils/cropImage';
import {
  BOPOMOFO_SYMBOLS,
  SCRIPT_TYPES,
  extractBopomofoInitial,
} from '../constants/bopomofo';
import { getZhuyinCandidates } from '../utils/charToZhuyin';
import { createCalligraphyEntry } from '../lib/calligraphyService';
import { CalligraphyEntry } from '../types';

interface UploadCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEntry: CalligraphyEntry) => void;
}

const TONE_MARKS = ['ˊ', 'ˇ', 'ˋ', '˙'] as const;

export const UploadCropModal: React.FC<UploadCropModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 影像與裁切狀態
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  // 表單欄位（書體預設為無 ''）
  const [charInput, setCharInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [zhuyinInput, setZhuyinInput] = useState('');
  const [zhuyinCandidates, setZhuyinCandidates] = useState<string[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [scriptType, setScriptType] = useState('');
  const [notes, setNotes] = useState('');
  const [showBopomofoPad, setShowBopomofoPad] = useState(false);

  // 處理狀態與錯誤訊息
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detectedInitial = extractBopomofoInitial(zhuyinInput);

  const resetAll = useCallback(() => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCharInput('');
    setIsComposing(false);
    setZhuyinInput('');
    setZhuyinCandidates([]);
    setSourceName('');
    setScriptType('');
    setNotes('');
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [rawImageSrc]);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // 嚴格限制中文字欄位只能保留 1 個字，並自動帶出標準注音與破音字候選
  const applySingleCharAndZhuyin = (rawVal: string) => {
    const trimmed = rawVal.trim();
    const chars = Array.from(trimmed);
    const singleChar = chars.length > 0 ? chars[0] : '';
    setCharInput(singleChar);

    const candidates = getZhuyinCandidates(singleChar);
    setZhuyinCandidates(candidates);
    if (candidates.length > 0) {
      setZhuyinInput(candidates[0]);
    } else if (!singleChar) {
      setZhuyinInput('');
    }
  };

  const handleCharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isComposing) {
      setCharInput(val);
      return;
    }
    applySingleCharAndZhuyin(val);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    applySingleCharAndZhuyin(e.currentTarget.value);
  };

  // 點擊下方儲存按鈕時，直接一併完成 1:1 裁切、WebP 壓縮與上傳
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!rawImageSrc || !croppedAreaPixels) {
      setErrorMessage('請先選取或拍攝字帖照片');
      return;
    }

    const singleChar = Array.from(charInput.trim())[0] || '';
    if (!singleChar) {
      setErrorMessage('請輸入中文字（必填，單字）');
      return;
    }

    if (!zhuyinInput.trim() || !detectedInitial) {
      setErrorMessage('請確認注音符號（例如：ㄩㄥˇ）');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 直接執行 Canvas 1:1 裁切並壓縮為 <= 50KB 的 WebP
      const { blob, previewUrl } = await getCroppedWebpBlob(
        rawImageSrc,
        croppedAreaPixels,
        50 * 1024
      );
      URL.revokeObjectURL(previewUrl);

      // 2. 上傳至 Supabase Storage 並寫入資料庫
      const created = await createCalligraphyEntry({
        char: singleChar,
        zhuyin: zhuyinInput.trim(),
        source_name: sourceName.trim() || undefined,
        script_type: scriptType || undefined,
        notes: notes.trim() || undefined,
        imageBlob: blob,
      });
      onSuccess(created);
      resetAll();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '上傳字帖時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-paper-50 w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-paper-200 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* 頂部標題列 */}
        <div className="px-5 py-3.5 bg-paper-100 border-b border-paper-200 flex items-center justify-between">
          <h2 className="font-serif text-base sm:text-lg font-bold text-ink-900">
            新增書法字帖
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-ink-600 hover:bg-paper-200 transition-colors"
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容捲動區 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-cinnabar-50 border border-cinnabar-600/30 text-cinnabar-700 text-xs sm:text-sm">
              {errorMessage}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 圖片選取與 1:1 即時框選區 */}
          {!rawImageSrc ? (
            <div className="border-2 border-dashed border-paper-300 rounded-2xl bg-paper-100/50 p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-paper-200/80 text-ink-800 mx-auto flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <p className="font-serif font-bold text-ink-900 text-sm">
                拍攝字帖或從相簿選取圖片
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-5 rounded-xl bg-ink-900 text-paper-50 font-serif font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-ink-800 active:scale-98 transition-all shadow-xs"
              >
                <Upload className="w-4 h-4" />
                選取照片 / 拍照
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-ink-600">
                <span>拖曳或雙指縮放框選單字（上傳時自動裁切壓縮）</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-cinnabar-600 font-medium hover:underline"
                >
                  更換照片
                </button>
              </div>

              <div className="relative w-full h-64 sm:h-72 bg-ink-900 rounded-2xl overflow-hidden border border-paper-300">
                <Cropper
                  image={rawImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                />
              </div>

              <div className="flex items-center gap-3 bg-paper-100 px-3.5 py-2 rounded-xl">
                <ZoomIn className="w-4 h-4 text-ink-600 shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-cinnabar-600"
                  aria-label="縮放比例"
                />
                <span className="text-xs font-mono text-ink-600 w-10 text-right">
                  {zoom.toFixed(1)}x
                </span>
              </div>
            </div>
          )}

          {/* 表單資訊填寫 */}
          <form id="calligraphy-upload-form" onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 中文字（必填，嚴格限制 1 個字，輸入後自動帶出注音） */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1">
                  中文字 <span className="text-cinnabar-600">*</span>（限單一字元）
                </label>
                <input
                  type="text"
                  required
                  maxLength={1}
                  value={charInput}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={handleCompositionEnd}
                  onChange={handleCharChange}
                  placeholder="例如：永"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 font-serif text-lg text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              {/* 注音符號（自動填入，若有破音字可一鍵切換或手動微調） */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-serif font-bold text-ink-800">
                    注音 <span className="text-cinnabar-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBopomofoPad((v) => !v)}
                    className="text-xs text-cinnabar-600 font-medium hover:underline"
                  >
                    {showBopomofoPad ? '隱藏小鍵盤' : '注音小鍵盤'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={zhuyinInput}
                    onChange={(e) => setZhuyinInput(e.target.value)}
                    placeholder="自動帶出或手動輸入"
                    className="w-full min-h-[44px] pl-3.5 pr-18 rounded-xl bg-white border border-paper-300 font-sans text-base text-ink-900 focus:outline-none focus:border-ink-900"
                  />
                  {detectedInitial && (
                    <span className="absolute right-2.5 px-2 py-0.5 rounded-md bg-paper-100 border border-paper-200 text-xs font-serif font-bold text-cinnabar-600">
                      首音：{detectedInitial}
                    </span>
                  )}
                </div>

                {/* 若該國字為破音字，列出所有候選注音供一鍵點選 */}
                {zhuyinCandidates.length > 1 && (
                  <div className="mt-1.5 flex items-center flex-wrap gap-1">
                    <span className="text-[11px] text-ink-600 font-serif">破音字選擇：</span>
                    {zhuyinCandidates.map((cand) => (
                      <button
                        key={cand}
                        type="button"
                        onClick={() => setZhuyinInput(cand)}
                        className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
                          zhuyinInput === cand
                            ? 'bg-cinnabar-600 text-white border-cinnabar-600'
                            : 'bg-white text-ink-800 border-paper-300 hover:bg-paper-100'
                        }`}
                      >
                        {cand}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showBopomofoPad && (
              <div className="p-3 rounded-2xl bg-paper-100 border border-paper-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-600">
                  <span>點擊注音符號輸入：</span>
                  <button
                    type="button"
                    onClick={() => setZhuyinInput((prev) => prev.slice(0, -1))}
                    className="px-2 py-0.5 rounded bg-white border border-paper-300 text-ink-800 hover:bg-paper-200"
                  >
                    ⌫ 倒退
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {BOPOMOFO_SYMBOLS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setZhuyinInput((prev) => prev + sym)}
                      className="w-8 h-8 rounded-lg bg-white border border-paper-200 font-serif text-sm font-bold text-ink-900 hover:bg-cinnabar-600 hover:text-white transition-colors"
                    >
                      {sym}
                    </button>
                  ))}
                  {TONE_MARKS.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setZhuyinInput((prev) => prev + tone)}
                      className="w-8 h-8 rounded-lg bg-cinnabar-50 border border-cinnabar-600/30 font-serif text-sm font-bold text-cinnabar-700 hover:bg-cinnabar-600 hover:text-white transition-colors"
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 出處與書體（選填，書體預設為「無」） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1">
                  碑帖或作品名稱（選填）
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="例如：蘭亭序"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 font-serif text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1">
                  書體分類（選填）
                </label>
                <select
                  value={scriptType}
                  onChange={(e) => setScriptType(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 font-serif text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                >
                  {SCRIPT_TYPES.map((st) => (
                    <option key={st || 'none'} value={st}>
                      {st === '' ? '無（不標註）' : st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 說明 / 備註（選填） */}
            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 mb-1">
                說明 / 備註（選填）
              </label>
              <textarea
                rows={2}
                maxLength={200}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：注意起筆藏鋒、結構左窄右寬..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-paper-300 font-serif text-sm text-ink-900 focus:outline-none focus:border-ink-900 resize-none"
              />
            </div>
          </form>
        </div>

        {/* 底部儲存操作列：點擊直接一併裁切、壓縮並上傳照片 */}
        <div className="px-5 py-3.5 bg-paper-100 border-t border-paper-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] px-4 rounded-xl border border-paper-300 text-ink-800 font-serif text-sm font-medium hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="calligraphy-upload-form"
            disabled={isSubmitting || !rawImageSrc}
            className="min-h-[44px] px-6 rounded-xl bg-ink-900 text-paper-50 font-serif text-sm font-bold flex items-center gap-2 hover:bg-ink-800 transition-colors disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                裁切壓縮與上傳中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                上傳並儲存字帖
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
