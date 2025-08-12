/**
 * Service Worker缓存策略
 * 提供离线缓存和资源管理功能
 */

// 缓存版本
const CACHE_VERSION = 'focusflow-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 缓存策略
enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  NETWORK_ONLY = 'network-only',
  CACHE_ONLY = 'cache-only'
}

// 资源配置
interface ResourceConfig {
  pattern: RegExp;
  strategy: CacheStrategy;
  cacheName: string;
  maxAge?: number; // 毫秒
  maxEntries?: number;
}

// 预缓存资源列表
const PRECACHE_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 资源缓存配置
const RESOURCE_CONFIGS: ResourceConfig[] = [
  // 静态资源 - 缓存优先
  {
    pattern: /\.(js|css|woff2?|ttf|eot)$/,
    strategy: CacheStrategy.CACHE_FIRST,
    cacheName: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    maxEntries: 100
  },
  
  // 图片资源 - 缓存优先
  {
    pattern: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
    strategy: CacheStrategy.CACHE_FIRST,
    cacheName: STATIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 50
  },
  
  // 音频资源 - 缓存优先
  {
    pattern: /\.(mp3|wav|ogg|m4a)$/,
    strategy: CacheStrategy.CACHE_FIRST,
    cacheName: STATIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 20
  },
  
  // API请求 - 网络优先
  {
    pattern: /\/api\//,
    strategy: CacheStrategy.NETWORK_FIRST,
    cacheName: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5分钟
    maxEntries: 50
  },
  
  // HTML页面 - 过期重新验证
  {
    pattern: /\.html$/,
    strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1天
    maxEntries: 10
  }
];

// Service Worker事件处理
declare const self: ServiceWorkerGlobalScope;

// 安装事件
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    (async () => {
      // 预缓存静态资源
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_RESOURCES);
      
      // 跳过等待，立即激活
      await self.skipWaiting();
    })()
  );
});

// 激活事件
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    (async () => {
      // 清理旧缓存
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('focusflow-') && !name.includes(CACHE_VERSION)
      );
      
      await Promise.all(
        oldCaches.map(cacheName => caches.delete(cacheName))
      );
      
      // 立即控制所有客户端
      await self.clients.claim();
    })()
  );
});

// 获取事件
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // 找到匹配的资源配置
  const config = RESOURCE_CONFIGS.find(config => 
    config.pattern.test(url.pathname)
  );
  
  if (!config) {
    // 默认策略：网络优先
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }
  
  // 根据策略处理请求
  switch (config.strategy) {
    case CacheStrategy.CACHE_FIRST:
      event.respondWith(cacheFirst(request, config));
      break;
    case CacheStrategy.NETWORK_FIRST:
      event.respondWith(networkFirst(request, config.cacheName, config.maxAge));
      break;
    case CacheStrategy.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request, config));
      break;
    case CacheStrategy.NETWORK_ONLY:
      event.respondWith(fetch(request));
      break;
    case CacheStrategy.CACHE_ONLY:
      event.respondWith(cacheOnly(request, config.cacheName));
      break;
  }
});

// 缓存优先策略
async function cacheFirst(request: Request, config: ResourceConfig): Promise<Response> {
  const cache = await caches.open(config.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 检查是否过期
    if (config.maxAge) {
      const cachedDate = new Date(cachedResponse.headers.get('date') || '');
      const now = new Date();
      if (now.getTime() - cachedDate.getTime() > config.maxAge) {
        // 过期，尝试更新
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.warn('[SW] Network failed, serving stale cache:', error);
        }
      }
    }
    
    return cachedResponse;
  }
  
  // 缓存中没有，从网络获取
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await cleanupCache(config.cacheName, config.maxEntries);
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

// 网络优先策略
async function networkFirst(request: Request, cacheName: string, maxAge?: number): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查是否过期
      if (maxAge) {
        const cachedDate = new Date(cachedResponse.headers.get('date') || '');
        const now = new Date();
        if (now.getTime() - cachedDate.getTime() > maxAge) {
          console.warn('[SW] Serving expired cache due to network failure');
        }
      }
      return cachedResponse;
    }
    
    throw error;
  }
}

// 过期重新验证策略
async function staleWhileRevalidate(request: Request, config: ResourceConfig): Promise<Response> {
  const cache = await caches.open(config.cacheName);
  const cachedResponse = await cache.match(request);
  
  // 后台更新
  const networkResponsePromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await cleanupCache(config.cacheName, config.maxEntries);
    }
    return networkResponse;
  }).catch(error => {
    console.warn('[SW] Background update failed:', error);
  });
  
  // 立即返回缓存响应（如果有）
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 没有缓存，等待网络响应
  return networkResponsePromise as Promise<Response>;
}

// 仅缓存策略
async function cacheOnly(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  throw new Error('Resource not found in cache');
}

// 清理缓存
async function cleanupCache(cacheName: string, maxEntries?: number): Promise<void> {
  if (!maxEntries) return;
  
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // 删除最旧的条目
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(
      entriesToDelete.map(key => cache.delete(key))
    );
  }
}

// 消息处理
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0]?.postMessage({ type: 'CACHE_STATS', payload: stats });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName).then(() => {
        event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'PRECACHE_RESOURCES':
      precacheResources(payload?.resources || []).then(() => {
        event.ports[0]?.postMessage({ type: 'RESOURCES_PRECACHED' });
      });
      break;
  }
});

// 获取缓存统计
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = await Promise.all(
    cacheNames.map(async (cacheName) => {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      return {
        name: cacheName,
        size: keys.length
      };
    })
  );
  
  return {
    caches: stats,
    totalEntries: stats.reduce((total, cache) => total + cache.size, 0)
  };
}

// 清理缓存
async function clearCache(cacheName?: string) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  }
}

// 预缓存资源
async function precacheResources(resources: string[]) {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(resources);
}

// 后台同步
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 执行后台同步
async function doBackgroundSync() {
  try {
    // 同步离线数据
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'BACKGROUND_SYNC' });
    });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// 推送通知
self.addEventListener('push', (event: PushEvent) => {
  const options = {
    body: event.data?.text() || 'FocusFlow通知',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FocusFlow', options)
  );
});

// 通知点击
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

export {};