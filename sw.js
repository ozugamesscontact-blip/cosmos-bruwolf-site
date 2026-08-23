// Service worker — Cosmos Bruwolf
// Strategie "reseau d'abord" pour la page principale : a chaque
// ouverture avec du reseau, la derniere version en ligne est
// utilisee. Le cache ne sert que si le telephone est hors-ligne.
// (Change ce numero de version a chaque grosse mise a jour du site
// pour forcer le nettoyage de l'ancien cache.)

const CACHE_NAME = 'cosmos-bruwolf-v2';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isPage = event.request.mode === 'navigate';

  if (isPage) {
    // Page principale : on va chercher la derniere version en ligne.
    // Si ca echoue (hors-ligne), on retombe sur le cache.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Autres ressources (rares, presque tout est integre dans la page) :
  // cache d'abord, reseau en secours.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
