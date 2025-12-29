const CACHE_NAME = 'island-v1';
const urlsToCache = [
  '/island/',
  '/island/index.html',
  '/island/manifest.json',
  '/island/service-worker.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // 处理添加到主屏幕的路径错误
  if (event.request.mode === 'navigate') {
    const requestUrl = new URL(event.request.url);
    
    // 如果是错误的根路径
    if (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html') {
      // 重定向到正确的路径
      const correctUrl = new URL('/island/index.html', requestUrl.origin);
      event.respondWith(Response.redirect(correctUrl, 301));
      return;
    }
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
