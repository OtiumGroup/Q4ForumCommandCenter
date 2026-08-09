// EO Q4 Forum Command Center — minimal service worker.
//
// Intentionally does NOT cache pages, API responses, or anything
// authenticated. This app holds private member data, so caching
// dynamic content client-side is a real risk on shared devices.
// This SW exists only to (a) satisfy "Add to Home Screen"
// installability and (b) cache a handful of static, public assets
// (icons, manifest) for a faster repeat load.

const STATIC_CACHE = "q4cc-static-v1";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only ever serve from cache for the specific static assets above.
  // Everything else (pages, /api/*, auth) always goes to the network.
  if (event.request.method === "GET" && STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
