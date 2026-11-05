import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export function getSupabaseConfig() {
  return {
    isConfigured: Boolean(envUrl && envKey && !envUrl.includes('your-project-id')),
  };
}

const config = getSupabaseConfig();

// 由系統環境變數讀取連線設定，不在前端介面暴露或儲存任何連線參數
export const supabase: SupabaseClient = createClient(
  config.isConfigured ? envUrl : 'https://placeholder.supabase.co',
  config.isConfigured ? envKey : 'placeholder-anon-key'
);

export const STORAGE_BUCKET = 'calligraphy-images';
