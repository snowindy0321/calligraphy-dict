const CACHE_NAME = 'calligraphy-pwa-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // 針對字帖圖片採用 Cache-First 策略節省流量
  if (request.url.includes('/storage/v1/object/public/calligraphy-images/')) {
    event.respondWith(
      caches.open('calligraphy-images-cache').then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // 其他請求採用 Network-First 降級 Cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
