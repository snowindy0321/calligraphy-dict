import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: '個人書法帖寫字對照字典',
        short_name: '書法字帖字典',
        description: '個人書法臨帖拍照裁切、注音索引與對照字典',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FAF8F5',
        theme_color: '#1C1B19',
        orientation: 'portrait',
        lang: 'zh-TW',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,svg,png,webp,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/calligraphy-images\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'calligraphy-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
