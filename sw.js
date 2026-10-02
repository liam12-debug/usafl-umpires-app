// USAFL Umpires — service worker. Offline support + installability.
// Bump CACHE when you change app files so clients pick up the new version.
const CACHE = "usafl-umps-v9";
const SHELL = [
  "./fonts/barlow-condensed-600.woff2",
  "./fonts/barlow-condensed-700.woff2",
  "./fonts/barlow-condensed-800.woff2",
  "./fonts/barlow-condensed-800-italic.woff2",
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./content.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Schedule + live updates: network first (fresh after a publish), cache as offline fallback.
// Everything else: stale-while-revalidate for instant loads.
const FRESH = ["/data.js", "/live.json"];
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.search && req.mode !== "navigate") return; // cache-busted checks go straight to the network
  if (FRESH.includes(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        fetch(req).then((res) => { if (res && res.status === 200) cache.put(req, res.clone()); return res; })
          .catch(() => cache.match(req))
      )
    );
    return;
  }
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => { if (res && res.status === 200) cache.put(req, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
