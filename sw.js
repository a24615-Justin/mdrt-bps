/**
 * Service Worker — MDRT-BPS v4.0
 * 離線快取策略：Cache-First + Network Fallback
 */
const CACHE_NAME = 'mdrt-bps-v4.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=4.0',
  './pain-module.css?v=4.0',
  './income-chart.css?v=4.0',
  './persona-pain-data.js?v=4.0',
  './companies.js?v=4.0',
  './param-schema.js?v=4.0',
  './calculator.js?v=4.0',
  './pain-module.js?v=4.0',
  './income-chart.js?v=4.0',
  './company-selector.js',
  './company-selector-v2.css',
  './manifest.json'
];

// Install: 預快取所有靜態資源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: 清除舊版快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First，失敗走 network
self.addEventListener('fetch', e => {
  // 跳過非 GET 請求和 chrome-extension
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension://')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // 快取同源資源
        if (resp.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      });
    }).catch(() => {
      // 離線 fallback
      if (e.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
