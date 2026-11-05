import React, { useState, useEffect } from 'react';
import { X, UserCheck, LogIn, LogOut, Lock } from 'lucide-react';
import { supabase, getSupabaseConfig } from '../lib/supabase';

interface AuthSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptMessage?: string | null;
  onLoginSuccess?: (email: string) => void;
}

const DEFAULT_USERNAME_DOMAIN = '@app.local';

/**
 * 若使用者只輸入簡單帳號名（不含 @），自動補上預設網域後綴以通過 Supabase Auth 格式要求
 */
function normalizeLoginIdentifier(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed.includes('@') ? trimmed : `${trimmed}${DEFAULT_USERNAME_DOMAIN}`;
}

export const AuthSettingsModal: React.FC<AuthSettingsModalProps> = ({
  isOpen,
  onClose,
  promptMessage,
  onLoginSuccess,
}) => {
  const { isConfigured } = getSupabaseConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [isConfigured]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const resolvedEmail = normalizeLoginIdentifier(username);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error) throw error;

      // 輔助觸發瀏覽器 Credential Management API 記憶帳號密碼
      if (
        'credentials' in navigator &&
        (window as unknown as { PasswordCredential?: new (form: HTMLFormElement) => Credential })
          .PasswordCredential
      ) {
        try {
          const PasswordCredentialCtor = (
            window as unknown as { PasswordCredential: new (form: HTMLFormElement) => Credential }
          ).PasswordCredential;
          const cred = new PasswordCredentialCtor(e.currentTarget);
          await navigator.credentials.store(cred);
        } catch {
          // 標準 form name/autocomplete 已支援自動記憶
        }
      }

      if (data.user?.email && onLoginSuccess) {
        onLoginSuccess(data.user.email);
      }
      onClose();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '帳號或密碼錯誤，請重新輸入');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    onClose();
  };

  const displayAccount = userEmail ? userEmail.split('@')[0] : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-50 w-full max-w-sm rounded-3xl border border-paper-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 bg-paper-100 border-b border-paper-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cinnabar-600" />
            <h2 className="font-serif text-base font-bold text-ink-900">
              {userEmail ? '帳號狀態' : '會員登入'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-ink-600 hover:bg-paper-200 transition-colors"
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {userEmail ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-ink-600 font-serif">目前登入帳號</p>
                <p className="text-base font-bold text-ink-900 break-all">
                  {displayAccount}
                </p>
              </div>
              <p className="text-xs text-emerald-700 bg-emerald-50/80 py-2 px-3 rounded-xl border border-emerald-200">
                已啟用字帖新增、修改與刪除權限
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full min-h-[44px] rounded-xl border border-paper-300 bg-white text-ink-800 hover:bg-paper-100 text-sm font-serif font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                登出帳號
              </button>
            </div>
          ) : (
            <form
              id="login-form"
              name="login"
              method="post"
              action="/login"
              autoComplete="on"
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              {promptMessage ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-serif">
                  {promptMessage}
                </div>
              ) : (
                <p className="text-xs text-ink-600 font-serif leading-relaxed">
                  請輸入帳號與密碼以新增或管理書法字帖。
                </p>
              )}

              {authError && (
                <p className="text-xs text-cinnabar-600 bg-cinnabar-50 p-3 rounded-xl border border-cinnabar-600/20">
                  {authError}
                </p>
              )}

              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-serif font-bold text-ink-800 mb-1"
                >
                  帳號
                </label>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="請輸入帳號名稱"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-serif font-bold text-ink-800 mb-1"
                >
                  密碼
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-paper-300 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] rounded-xl bg-ink-900 text-paper-50 font-serif text-sm font-bold flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {loading ? '登入驗證中...' : '登入'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
