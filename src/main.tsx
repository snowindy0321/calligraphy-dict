import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 由 vite-plugin-pwa (registerSW.js) 自動註冊 Workbox Service Worker
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
