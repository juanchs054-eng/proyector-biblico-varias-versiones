// Service worker con actualización automática.
// Estrategia "primero la red": si hay internet siempre trae la versión nueva
// y la guarda; si no hay internet usa la copia guardada (funciona sin conexión).
const CACHE = 'proyector-biblico-cache';
const BASE = ['./', 'index.html', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', e => {
  self.skipWaiting(); // la versión nueva toma el control de inmediato
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      BASE.map(u => fetch(u, {cache:'reload'}).then(r => r.ok && c.put(u, r)).catch(()=>{}))
    ))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith(
    fetch(req, {cache:'no-store'}).then(res => {
      if(res && res.ok && new URL(req.url).origin === location.origin){
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
