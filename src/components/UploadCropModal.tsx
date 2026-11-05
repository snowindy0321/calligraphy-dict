import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Camera,
  Upload,
  X,
  Check,
  RotateCcw,
  ZoomIn,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { getCroppedWebpBlob, PixelCrop } from '../utils/cropImage';
import {
  BOPOMOFO_SYMBOLS,
  SCRIPT_TYPES,
  extractBopomofoInitial,
} from '../constants/bopomofo';
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

  // 步驟與影像狀態
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  // 裁切並壓縮後的 WebP 成果
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [croppedSizeKB, setCroppedSizeKB] = useState<number | null>(null);

  // 表單欄位
  const [charInput, setCharInput] = useState('');
  const [zhuyinInput, setZhuyinInput] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [scriptType, setScriptType] = useState('行書');
  const [showBopomofoPad, setShowBopomofoPad] = useState(false);

  // 處理狀態與錯誤訊息
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detectedInitial = extractBopomofoInitial(zhuyinInput);

  const resetAll = useCallback(() => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setRawImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
    setCroppedSizeKB(null);
    setCharInput('');
    setZhuyinInput('');
    setSourceName('');
    setScriptType('行書');
    setErrorMessage(null);
    setIsProcessingCrop(false);
    setIsSubmitting(false);
  }, [rawImageSrc, croppedPreviewUrl]);

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirmCrop = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    setIsProcessingCrop(true);
    setErrorMessage(null);
    try {
      const result = await getCroppedWebpBlob(rawImageSrc, croppedAreaPixels, 50 * 1024);
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
      setCroppedBlob(result.blob);
      setCroppedPreviewUrl(result.previewUrl);
      setCroppedSizeKB(result.sizeKB);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '裁切影像失敗');
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!croppedBlob) {
      setErrorMessage('請先選取照片並完成單字框選裁切');
      return;
    }

    const singleChar = Array.from(charInput.trim())[0] || '';
    if (!singleChar) {
      setErrorMessage('請輸入中文字（必填，單字）');
      return;
    }

    if (!zhuyinInput.trim() || !detectedInitial) {
      setErrorMessage('請輸入完整注音符號（例如：ㄩㄥˇ 或 ㄓㄨㄤ）');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCalligraphyEntry({
        char: singleChar,
        zhuyin: zhuyinInput.trim(),
        source_name: sourceName.trim() || undefined,
        script_type: scriptType || undefined,
        imageBlob: croppedBlob,
      });
      onSuccess(created);
      resetAll();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '儲存字帖時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-paper-50 w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-paper-200 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* 頂部標題列 */}
        <div className="px-5 py-4 bg-paper-100 border-b border-paper-200 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-ink-900">
              新增書法字帖
            </h2>
            <p className="text-xs text-ink-600">
              拍照或選取碑帖 ➔ 1:1 框選單字 ➔ 輸入中文字與注音
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-ink-600 hover:bg-paper-200 transition-colors"
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容捲動區 */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-cinnabar-50 border border-cinnabar-600/30 text-cinnabar-700 text-sm">
              {errorMessage}
            </div>
          )}

          {/* 隱藏檔案選取器（支援手機拍照與相簿） */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 步驟 1 & 2：圖片選取與 1:1 觸控裁切畫布 */}
          {!rawImageSrc ? (
            <div className="border-2 border-dashed border-paper-300 rounded-2xl bg-paper-100/50 p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-paper-200/80 text-ink-800 mx-auto flex items-center justify-center">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-serif font-bold text-ink-900 text-base">
                  拍攝字帖或從相簿選取圖片
                </p>
                <p className="text-xs text-ink-600">
                  載入後可用手指拖曳、雙指縮放，從整頁碑帖中精準框出單字
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] px-6 rounded-xl bg-ink-900 text-paper-50 font-serif font-bold text-sm flex items-center justify-center gap-2 hover:bg-ink-800 active:scale-98 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  選取碑帖照片 / 拍照
                </button>
              </div>
            </div>
          ) : !croppedPreviewUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-600">
                <span>請拖曳或雙指縮放，將單字置於 1:1 正方形框內</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-cinnabar-600 font-medium hover:underline"
                >
                  更換照片
                </button>
              </div>

              {/* react-easy-crop 1:1 觸控裁切畫布 */}
              <div className="relative w-full h-72 sm:h-80 bg-ink-900 rounded-2xl overflow-hidden border border-paper-300">
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

              {/* 縮放滑桿與確認裁切按鈕 */}
              <div className="flex items-center gap-3 bg-paper-100 px-4 py-2.5 rounded-xl">
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

              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={isProcessingCrop}
                className="w-full min-h-[48px] rounded-xl bg-cinnabar-600 text-white font-serif font-bold text-sm flex items-center justify-center gap-2 hover:bg-cinnabar-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessingCrop ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在轉換為最佳化 WebP...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    完成框選並壓縮（WebP 0.85）
                  </>
                )}
              </button>
            </div>
          ) : (
            /* 裁切完成預覽區 */
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-paper-200">
              <img
                src={croppedPreviewUrl}
                alt="裁切預覽"
                className="w-24 h-24 rounded-xl object-contain border border-paper-200 bg-white shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3" />
                    WebP 已最佳化
                  </span>
                  {croppedSizeKB !== null && (
                    <span className="text-xs text-ink-600 font-mono">
                      {croppedSizeKB} KB (≤ 50KB)
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-600">
                  1:1 正方形單字影像已準備就緒，請於下方填寫字元與注音索引。
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCroppedBlob(null);
                      setCroppedPreviewUrl(null);
                    }}
                    className="min-h-[38px] px-3 rounded-lg bg-paper-100 text-ink-800 text-xs font-medium flex items-center gap-1.5 hover:bg-paper-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重新框選
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] px-3 rounded-lg bg-paper-100 text-ink-800 text-xs font-medium hover:bg-paper-200 transition-colors"
                  >
                    更換照片
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 步驟 4：表單資訊填寫與自動提取注音首字 */}
          <form id="calligraphy-upload-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 中文字（必填，單字） */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1.5">
                  中文字 <span className="text-cinnabar-600">*</span>（單字）
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={charInput}
                  onChange={(e) => setCharInput(e.target.value)}
                  placeholder="例如：永"
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-white border border-paper-300 font-serif text-lg text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              {/* 注音符號（必填）+ 自動提取 bopomofo_initial 預覽 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-serif font-bold text-ink-800">
                    完整注音 <span className="text-cinnabar-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBopomofoPad((v) => !v)}
                    className="text-xs text-cinnabar-600 font-medium hover:underline"
                  >
                    {showBopomofoPad ? '隱藏注音小鍵盤' : '開啟注音小鍵盤'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={zhuyinInput}
                    onChange={(e) => setZhuyinInput(e.target.value)}
                    placeholder="例如：ㄩㄥˇ 或 ㄓㄨㄤ"
                    className="w-full min-h-[46px] pl-3.5 pr-20 rounded-xl bg-white border border-paper-300 font-sans text-base text-ink-900 focus:outline-none focus:border-ink-900"
                  />
                  {detectedInitial && (
                    <span
                      title="上傳前自動提取的 bopomofo_initial"
                      className="absolute right-2.5 px-2 py-1 rounded-md bg-paper-100 border border-paper-200 text-xs font-serif font-bold text-cinnabar-600"
                    >
                      首字：{detectedInitial}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 內建注音符號輔助小鍵盤（方便電腦或無注音輸入法環境直接點選） */}
            {showBopomofoPad && (
              <div className="p-3 rounded-2xl bg-paper-100 border border-paper-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-600">
                  <span>點擊注音符號直接輸入：</span>
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

            {/* 出處與書體（選填） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1.5">
                  碑帖或作品名稱（選填）
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="例如：蘭亭序、九成宮醴泉銘"
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-white border border-paper-300 font-serif text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1.5">
                  書體分類（選填）
                </label>
                <select
                  value={scriptType}
                  onChange={(e) => setScriptType(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-white border border-paper-300 font-serif text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                >
                  {SCRIPT_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* 底部儲存操作列 */}
        <div className="px-5 py-4 bg-paper-100 border-t border-paper-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[46px] px-5 rounded-xl border border-paper-300 text-ink-800 font-serif text-sm font-medium hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="calligraphy-upload-form"
            disabled={isSubmitting || !croppedBlob}
            className="min-h-[46px] px-6 rounded-xl bg-ink-900 text-paper-50 font-serif text-sm font-bold flex items-center gap-2 hover:bg-ink-800 transition-colors disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                儲存上傳中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                儲存至書法字典
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
