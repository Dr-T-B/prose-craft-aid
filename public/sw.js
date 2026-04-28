// Prose Craft Aid — Service Worker
// Strategy:
//   • Static assets (JS, CSS, fonts, images) → cache-first (fast repeat loads)
//   • Supabase API calls → network-first (always fresh data; fall back to cache)
//   • HTML shell ("/") → network-first (always gets latest build)
//
// Cache names are versioned so old caches are cleaned up on activation.

const STATIC_CACHE  = 'pca-static-v2';
const DYNAMIC_CACHE = 'pca-dynamic-v2';

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: precache the app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: remove stale caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const keepCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: route-aware strategy ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests that aren't our CDN
  if (request.method !== 'GET') return;

  // Network-first: Supabase API and auth calls
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first: HTML navigation (ensures latest build is served)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first: static assets (JS chunks, CSS, images, fonts)
  event.respondWith(cacheFirst(request));
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a minimal offline response
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // For navigation, serve the app shell so routing still works offline
    if (request.mode === 'navigate') {
      const shell = await caches.match('/');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503 });
  }
}
