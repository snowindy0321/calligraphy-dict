import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const STORAGE_URL_KEY = 'calligraphy_supabase_url';
const STORAGE_ANON_KEY = 'calligraphy_supabase_anon_key';

export function getSupabaseConfig() {
  const url = envUrl || localStorage.getItem(STORAGE_URL_KEY) || '';
  const anonKey = envKey || localStorage.getItem(STORAGE_ANON_KEY) || '';
  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConfigured: Boolean(url.trim() && anonKey.trim() && !url.includes('your-project-id')),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  window.location.reload();
}

const config = getSupabaseConfig();

// 當尚未設定環境變數時，提供安全的 placeholder 避免啟動崩潰，並切換至內建展示模式
export const supabase: SupabaseClient = createClient(
  config.isConfigured ? config.url : 'https://placeholder.supabase.co',
  config.isConfigured ? config.anonKey : 'placeholder-anon-key'
);

export const STORAGE_BUCKET = 'calligraphy-images';
