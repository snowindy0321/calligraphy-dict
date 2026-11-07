import { supabase, STORAGE_BUCKET, getSupabaseConfig } from './supabase';
import { CalligraphyEntry, CreateCalligraphyInput, UpdateCalligraphyInput } from '../types';
import { extractBopomofoInitial } from '../constants/bopomofo';
import { INITIAL_DEMO_ENTRIES } from '../utils/demoData';

const DEMO_STORAGE_KEY = 'calligraphy_demo_entries_v1';

function getLocalDemoEntries(): CalligraphyEntry[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ENTRIES));
      return INITIAL_DEMO_ENTRIES;
    }
    return JSON.parse(raw) as CalligraphyEntry[];
  } catch {
    return INITIAL_DEMO_ENTRIES;
  }
}

function saveLocalDemoEntries(entries: CalligraphyEntry[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('LocalStorage 儲存空間已滿或無法寫入', e);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 查詢字帖列表（支援依注音首字 bopomofo_initial 過濾，與關鍵字搜尋 char / zhuyin / source_name）
 */
export async function fetchCalligraphyEntries(params: {
  initial?: string; // 'ALL' 或 37 個注音符號之一
  searchQuery?: string;
}): Promise<CalligraphyEntry[]> {
  const { initial, searchQuery } = params;
  const { isConfigured } = getSupabaseConfig();

  // 若尚未設定 Supabase，使用本機展示資料庫以利即時預覽與測試
  if (!isConfigured) {
    let list = getLocalDemoEntries();
    if (initial && initial !== 'ALL') {
      list = list.filter((item) => item.bopomofo_initial === initial);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      list = list.filter(
        (item) =>
          item.char.includes(q) ||
          item.zhuyin.includes(q) ||
          (item.source_name && item.source_name.includes(q)) ||
          (item.script_type && item.script_type.includes(q))
      );
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  let query = supabase
    .from('calligraphy_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (initial && initial !== 'ALL') {
    query = query.eq('bopomofo_initial', initial);
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    // 同時檢索中文字或注音片段或碑帖出處
    query = query.or(`char.ilike.%${q}%,zhuyin.ilike.%${q}%,source_name.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`讀取字帖資料失敗：${error.message}`);
  }

  return (data || []) as CalligraphyEntry[];
}

/**
 * 查詢目前整個字帖庫中所有已收錄的注音首符號 (bopomofo_initial) 集合
 * 確保切換單一注音篩選時，其他已有字帖的注音紅點不會消失
 */
export async function fetchAvailableInitials(): Promise<Set<string>> {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    const list = getLocalDemoEntries();
    return new Set(list.map((item) => item.bopomofo_initial).filter(Boolean));
  }

  const { data, error } = await supabase
    .from('calligraphy_entries')
    .select('bopomofo_initial');

  if (error || !data) {
    return new Set();
  }

  return new Set(
    data
      .map((row: { bopomofo_initial: string }) => row.bopomofo_initial)
      .filter(Boolean)
  );
}

/**
 * 上傳 WebP 字帖影像至 Supabase Storage 並將紀錄寫入 calligraphy_entries
 */
export async function createCalligraphyEntry(
  input: CreateCalligraphyInput
): Promise<CalligraphyEntry> {
  const charTrimmed = Array.from(input.char.trim())[0] || '';
  const zhuyinTrimmed = input.zhuyin.trim();
  const bopomofoInitial = extractBopomofoInitial(zhuyinTrimmed);

  if (!charTrimmed) {
    throw new Error('請輸入單一中文字');
  }
  if (!zhuyinTrimmed || !bopomofoInitial) {
    throw new Error('請輸入有效的注音符號');
  }

  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    const dataUrl = await blobToDataUrl(input.imageBlob);
    const newEntry: CalligraphyEntry = {
      id: `local-${Date.now()}`,
      char: charTrimmed,
      zhuyin: zhuyinTrimmed,
      bopomofo_initial: bopomofoInitial,
      source_name: input.source_name?.trim() || null,
      script_type: input.script_type?.trim() || null,
      image_url: dataUrl,
      created_at: new Date().toISOString(),
    };
    const current = getLocalDemoEntries();
    saveLocalDemoEntries([newEntry, ...current]);
    return newEntry;
  }

  // 1. 產生唯一檔案路徑並上傳至 Supabase Storage (`calligraphy-images` bucket)
  const fileExt = 'webp';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `entries/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, input.imageBlob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `圖片上傳失敗（請確認已登入管理員帳號或已建立公開 Bucket）：${uploadError.message}`
    );
  }

  // 2. 取得 Public URL
  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  // 3. 寫入資料庫表格 `calligraphy_entries`
  const { data, error: insertError } = await supabase
    .from('calligraphy_entries')
    .insert([
      {
        char: charTrimmed,
        zhuyin: zhuyinTrimmed,
        bopomofo_initial: bopomofoInitial,
        source_name: input.source_name?.trim() || null,
        script_type: input.script_type?.trim() || null,
        image_url: imageUrl,
      },
    ])
    .select()
    .single();

  if (insertError) {
    throw new Error(`寫入字帖資料表失敗：${insertError.message}`);
  }

  return data as CalligraphyEntry;
}

/**
 * 更新既有字帖的文字與出處資訊
 */
export async function updateCalligraphyEntry(
  input: UpdateCalligraphyInput
): Promise<CalligraphyEntry> {
  const charTrimmed = Array.from(input.char.trim())[0] || '';
  const zhuyinTrimmed = input.zhuyin.trim();
  const bopomofoInitial = extractBopomofoInitial(zhuyinTrimmed);

  if (!charTrimmed || !zhuyinTrimmed || !bopomofoInitial) {
    throw new Error('中文字與注音為必填欄位');
  }

  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    const current = getLocalDemoEntries();
    const updatedList = current.map((item) =>
      item.id === input.id
        ? {
            ...item,
            char: charTrimmed,
            zhuyin: zhuyinTrimmed,
            bopomofo_initial: bopomofoInitial,
            source_name: input.source_name?.trim() || null,
            script_type: input.script_type?.trim() || null,
          }
        : item
    );
    saveLocalDemoEntries(updatedList);
    const found = updatedList.find((i) => i.id === input.id);
    if (!found) throw new Error('找不到該筆字帖紀錄');
    return found;
  }

  const { data, error } = await supabase
    .from('calligraphy_entries')
    .update({
      char: charTrimmed,
      zhuyin: zhuyinTrimmed,
      bopomofo_initial: bopomofoInitial,
      source_name: input.source_name?.trim() || null,
      script_type: input.script_type?.trim() || null,
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    throw new Error(`更新失敗：${error.message}`);
  }

  return data as CalligraphyEntry;
}

/**
 * 刪除字帖紀錄並嘗試移除 Storage 中的圖檔
 */
export async function deleteCalligraphyEntry(entry: CalligraphyEntry): Promise<void> {
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    const current = getLocalDemoEntries();
    saveLocalDemoEntries(current.filter((item) => item.id !== entry.id));
    return;
  }

  // 先刪除資料表紀錄
  const { error } = await supabase
    .from('calligraphy_entries')
    .delete()
    .eq('id', entry.id);

  if (error) {
    throw new Error(`刪除失敗：${error.message}`);
  }

  // 若圖片位於 calligraphy-images bucket，同步從伺服器 Storage 徹底刪除實體圖檔，避免浪費空間
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = entry.image_url.indexOf(marker);
  if (idx !== -1) {
    const rawPath = entry.image_url.substring(idx + marker.length).split('?')[0];
    const storagePath = decodeURIComponent(rawPath);
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);
    if (storageError) {
      console.warn('清理 Storage 圖檔時發生警告：', storageError.message);
    }
  }
}
