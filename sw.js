// Proyector Bíblico RV — Service Worker
// IMPORTANTE: cada vez que subas cambios a index.html, biblia-1960.js,
// manifest.json o los íconos, sube también este sw.js subiendo el número
// de versión de abajo (v1.1 -> v1.2 -> v1.3 ...). Eso hace que todos los
// que ya tienen la app instalada reciban la actualización automáticamente,
// sin tener que borrar el caché del teléfono.
const CACHE_VERSION = 'v1.3';
const CACHE_NAME = 'proyector-biblico-' + CACHE_VERSION;

// Archivos que se guardan apenas se instala la app.
// El texto del RV1960 (biblia-1960.js) NO va aquí a propósito: pesa varios
// MB y solo se necesita si el usuario toca el botón 1960. Se guarda solo
// la primera vez que se usa (ver el fetch de más abajo), y desde entonces
// queda disponible también sin internet.
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES))
  );
  self.skipWaiting(); // activa la nueva versión de inmediato
});

// Borra los cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Sirve desde el caché primero; si no está, va a la red y guarda una copia
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Sin internet y sin copia guardada: si es una navegación,
          // muestra al menos el index.html guardado.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
