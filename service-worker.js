// 小航小刀小岛 - Service Worker
// 版本: 1.0.0
const CACHE_NAME = 'life-manager-v1.2';
const STATIC_CACHE_NAME = 'life-manager-static-v1.0';
const DYNAMIC_CACHE_NAME = 'life-manager-dynamic-v1.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './favicon.ico',
  // 外部资源
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 缓存静态资源...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] 安装完成');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] 安装失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中...');
  
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] 激活完成');
      return self.clients.claim();
    })
  );
});

// 网络优先，失败时使用缓存的策略
const networkFirstStrategy = async (request) => {
  try {
    const networkResponse = await fetch(request);
    
    // 如果请求成功，更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，使用缓存:', request.url);
    
    // 从缓存中获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果缓存中也没有，返回离线页面
    if (request.mode === 'navigate') {
      return caches.match('./');
    }
    
    // 对于其他资源，返回一个占位符
    return new Response('离线内容不可用', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};

// 缓存优先，失败时使用网络的策略
const cacheFirstStrategy = async (request) => {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 在后台更新缓存
    fetch(request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, networkResponse));
        }
      })
      .catch(() => {
        // 网络更新失败，忽略错误
      });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] 缓存和网络都失败:', request.url);
    
    // 返回一个离线响应
    if (request.destination === 'image') {
      // 对于图片，返回一个占位符
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" font-family="Arial" font-size="14" text-anchor="middle" fill="#666">图片离线</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' }
        }
      );
    }
    
    return new Response('离线内容不可用', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};

// 只使用缓存的策略
const cacheOnlyStrategy = async (request) => {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return new Response('离线内容不可用', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};

// 只使用网络的策略
const networkOnlyStrategy = async (request) => {
  return fetch(request);
};

// 请求处理
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过扩展程序和开发者工具的请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // 对于同源请求，使用不同的策略
  if (url.origin === self.location.origin) {
    // 主页面使用网络优先
    if (url.pathname === '/' || url.pathname === '/index.html') {
      event.respondWith(networkFirstStrategy(request));
      return;
    }
    
    // 静态资源使用缓存优先
    if (url.pathname.match(/\.(css|js|json|ico)$/)) {
      event.respondWith(cacheFirstStrategy(request));
      return;
    }
    
    // 其他同源请求使用网络优先
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 对于外部资源，使用缓存优先
  if (url.href.includes('cdnjs.cloudflare.com') || 
      url.href.includes('cdn.jsdelivr.net')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // 对于GitHub API请求，使用网络优先
  if (url.href.includes('api.github.com')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 默认使用网络优先策略
  event.respondWith(networkFirstStrategy(request));
});

// 后台同步功能
self.addEventListener('sync', event => {
  console.log('[Service Worker] 后台同步:', event.tag);
  
  if (event.tag === 'sync-archive') {
    event.waitUntil(syncArchiveData());
  }
  
  if (event.tag === 'sync-github') {
    event.waitUntil(syncToGitHub());
  }
});

// 推送通知
self.addEventListener('push', event => {
  console.log('[Service Worker] 收到推送消息:', event);
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || '小航小刀小岛提醒',
    icon: './favicon.ico',
    badge: './favicon.ico',
    tag: data.tag || 'life-manager-notification',
    data: data.url || './',
    actions: [
      {
        action: 'open',
        title: '打开应用'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '提醒', options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知被点击:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // 如果已经有打开的窗口，聚焦它
      for (const client of clientList) {
        if (client.url === './' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

// 后台同步函数
async function syncArchiveData() {
  try {
    console.log('[Service Worker] 执行后台归档同步');
    
    // 这里可以实现后台同步逻辑
    // 例如：将未归档的数据发送到服务器
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] 后台同步失败:', error);
    return Promise.reject(error);
  }
}

async function syncToGitHub() {
  try {
    console.log('[Service Worker] 执行GitHub同步');
    
    // 这里可以实现GitHub后台同步逻辑
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] GitHub同步失败:', error);
    return Promise.reject(error);
  }
}

// 消息处理
self.addEventListener('message', event => {
  console.log('[Service Worker] 收到消息:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});

// 定期清理旧数据
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const requests = await cache.keys();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const date = new Date(dateHeader).getTime();
        if (date < oneWeekAgo) {
          await cache.delete(request);
        }
      }
    }
  }
}

// 错误处理
self.addEventListener('error', event => {
  console.error('[Service Worker] 错误:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[Service Worker] 未处理的Promise拒绝:', event.reason);
});

// 注册后台定期同步（需要浏览器支持）
if ('periodicSync' in self.registration) {
  try {
    self.registration.periodicSync.register('cleanup-cache', {
      minInterval: 24 * 60 * 60 * 1000 // 每天一次
    }).then(() => {
      console.log('[Service Worker] 定期同步已注册');
    }).catch(error => {
      console.error('[Service Worker] 定期同步注册失败:', error);
    });
  } catch (error) {
    console.error('[Service Worker] 定期同步错误:', error);
  }
}

// 功能检测和降级
function detectFeatures() {
  const features = {
    backgroundSync: 'sync' in self.registration,
    periodicSync: 'periodicSync' in self.registration,
    pushManager: 'pushManager' in self.registration,
    notifications: 'showNotification' in self.registration
  };
  
  console.log('[Service Worker] 功能检测:', features);
  return features;
}

// 初始化
self.addEventListener('install', event => {
  console.log('[Service Worker] 功能支持情况:', detectFeatures());
});

// 缓存版本管理
const CACHE_VERSION = 1;
const CURRENT_CACHES = {
  static: `life-manager-static-v${CACHE_VERSION}`,
  dynamic: `life-manager-dynamic-v${CACHE_VERSION}`
};

// 存储管理
function getCacheStorageInfo() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    return navigator.storage.estimate()
      .then(estimate => {
        console.log(`[Service Worker] 存储使用情况: ${estimate.usage} / ${estimate.quota}`);
        return estimate;
      });
  }
  return Promise.resolve(null);
}

// 存储空间不足处理
function handleStoragePressure() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return navigator.storage.persist()
      .then(persisted => {
        console.log(`[Service Worker] 存储持久化: ${persisted ? '成功' : '失败'}`);
        return persisted;
      });
  }
  return Promise.resolve(false);
}

// 监听存储压力事件
if ('storage' in navigator) {
  navigator.storage.addEventListener('quotachange', event => {
    console.log('[Service Worker] 存储配额变化:', event);
    handleStoragePressure();
  });
}

// 服务工作者生命周期管理
function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
}

// 定期检查更新
setInterval(updateServiceWorker, 60 * 60 * 1000); // 每小时检查一次更新