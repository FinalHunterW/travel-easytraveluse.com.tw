// sw.js
const CACHE_NAME = 'travel-planner-v1';

// 這些檔案會被「強制」存到手機裡，斷網也能開
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/db.js',
    './js/modules/ui.js',
    './js/modules/events.js',
    './js/modules/expenses.js',
    './js/modules/settings.js',
    './js/modules/rates.js',
    './js/modules/weather.js',
    './js/modules/places.js',
    './manifest.webmanifest',
    // 外部資源 (CDN) 建議也快取，確保離線能用
    'https://unpkg.com/dexie/dist/dexie.js',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'
];

// 1. 安裝 (Install) - 下載並快取所有檔案
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. 啟用 (Activate) - 清除舊的快取
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // 讓新的 SW 立即接管頁面
    return self.clients.claim();
});

// 3. 攔截請求 (Fetch) - 離線策略
self.addEventListener('fetch', (event) => {
    // 這裡使用 "Cache First, falling back to Network" 策略
    // 先看快取有沒有，有就直接給 (速度快、離線可用)
    // 沒有才去網路上抓
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});