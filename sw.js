// 一人乐队 Service Worker：页面走网络优先（便于更新），其他资源缓存优先，支持离线
const CACHE = 'soloband-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // 网络优先；断网或访问凭证过期（403 等非 200）时回退到缓存的页面，保证离线可用
    const cached = () => caches.match('./index.html').then(r => r || caches.match(req, { ignoreSearch: true }));
    e.respondWith(fetch(req).then(r => {
      if (!r.ok) return cached().then(c => c || r);
      const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r;
    }).catch(() => cached()));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
