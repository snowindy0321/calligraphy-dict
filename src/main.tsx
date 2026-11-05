import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 註冊 PWA Service Worker，支援手機「加入主畫面」獨立全螢幕運作與字帖圖檔快取
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
