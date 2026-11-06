import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 在 React 掛載前即刻攔截 Android Chrome 的 beforeinstallprompt 事件，避免錯失時機
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as unknown as { __deferredPwaPrompt?: Event }).__deferredPwaPrompt = e;
});

// 註冊 PWA Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker 註冊失敗:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
