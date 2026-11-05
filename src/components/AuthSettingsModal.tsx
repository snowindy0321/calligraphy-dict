import React, { useState, useEffect } from 'react';
import { X, KeyRound, Database, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { supabase, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface AuthSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSettingsModal: React.FC<AuthSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const config = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.anonKey);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config.isConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [config.isConfigured]);

  if (!isOpen) return null;

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(urlInput, keyInput);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setAuthMessage('登入成功！您現在擁有 INSERT / UPDATE / DELETE 寫入權限。');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-50 w-full max-w-md rounded-3xl border border-paper-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-paper-100 border-b border-paper-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cinnabar-600" />
            <h2 className="font-serif text-base font-bold text-ink-900">
              Supabase 連線與寫入權限驗證 (RLS)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-ink-600 hover:bg-paper-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* 區塊 1：管理員登入狀態（對應 RLS authenticated 寫入政策） */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-cinnabar-600" />
              管理員登入（啟用新增 / 修改 / 刪除權限）
            </h3>

            {!config.isConfigured ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                目前處於<strong>本機展示模式（Local Demo Mode）</strong>，您可以直接體驗拍照裁切、WebP 壓縮與注音檢索。若要同步至雲端，請於下方填入 Supabase URL 與 Anon Key。
              </div>
            ) : userEmail ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>已驗證：{userEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-[36px] px-3 rounded-lg bg-white border border-emerald-300 text-xs font-medium text-emerald-800 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  登出
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-3">
                {authError && (
                  <p className="text-xs text-cinnabar-600 bg-cinnabar-50 p-2.5 rounded-lg">
                    {authError}
                  </p>
                )}
                {authMessage && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg">
                    {authMessage}
                  </p>
                )}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Supabase Auth 管理員信箱"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 text-sm"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密碼"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] rounded-xl bg-cinnabar-600 text-white font-serif text-sm font-bold flex items-center justify-center gap-2 hover:bg-cinnabar-700"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? '驗證中...' : '登入取得寫入權限'}
                </button>
              </form>
            )}
          </div>

          <hr className="border-paper-200" />

          {/* 區塊 2：Supabase 專案金鑰配置 */}
          <form onSubmit={handleSaveConnection} className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-ink-900">
              Supabase 專案連線參數
            </h3>
            <p className="text-xs text-ink-600">
              可在專案根目錄建立 <code className="bg-paper-200 px-1 rounded">.env</code> 設定 <code className="bg-paper-200 px-1 rounded">VITE_SUPABASE_URL</code>，或直接於此處儲存：
            </p>
            <div>
              <label className="block text-xs text-ink-600 mb-1">Project URL</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xxxx.supabase.co"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">Anon Public Key</label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-ink-900 text-paper-50 font-serif text-sm font-bold hover:bg-ink-800 transition-colors"
            >
              儲存連線設定並重新載入
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
