import React, { useState, useEffect } from 'react';
import { X, UserCheck, LogIn, LogOut, Lock } from 'lucide-react';
import { supabase, getSupabaseConfig } from '../lib/supabase';

interface AuthSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSettingsModal: React.FC<AuthSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isConfigured } = getSupabaseConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
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
      setPassword('');
      setAuthMessage('登入成功！您現在可以新增、編輯或刪除書法字帖。');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '帳號或密碼錯誤，請重新輸入');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setAuthMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper-50 w-full max-w-sm rounded-3xl border border-paper-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題 */}
        <div className="px-5 py-4 bg-paper-100 border-b border-paper-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cinnabar-600" />
            <h2 className="font-serif text-base font-bold text-ink-900">
              {userEmail ? '帳號狀態' : '會員登入'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-ink-600 hover:bg-paper-200 transition-colors"
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 登入表單或已登入資訊 */}
        <div className="p-6">
          {userEmail ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-ink-600 font-serif">目前登入帳號</p>
                <p className="text-sm font-bold text-ink-900 break-all">
                  {userEmail}
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
            <form onSubmit={handleSignIn} className="space-y-4">
              <p className="text-xs text-ink-600 font-serif leading-relaxed">
                請輸入您的管理員信箱與密碼，登入後即可拍照上傳、編輯或刪除個人書法字帖。
              </p>

              {authError && (
                <p className="text-xs text-cinnabar-600 bg-cinnabar-50 p-3 rounded-xl border border-cinnabar-600/20">
                  {authError}
                </p>
              )}
              {authMessage && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  {authMessage}
                </p>
              )}

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1.5">
                  電子信箱
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-white border border-paper-300 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 mb-1.5">
                  密碼
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-white border border-paper-300 text-sm text-ink-900 focus:outline-none focus:border-ink-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] rounded-xl bg-ink-900 text-paper-50 font-serif text-sm font-bold flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors disabled:opacity-50"
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
