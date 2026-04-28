// Prose Craft Aid — Service Worker v3
//
// Strategies:
//   • Navigation (HTML)  → network-only (NEVER cache the app shell)
//   • Supabase API       → network-first with cache fallback
//   • JS/CSS chunks      → stale-while-revalidate (fast load + background update)
//   • Images/fonts       → cache-first (rarely change)
//
// v3: removed '/' from precache — the HTML entry point must always come
//     from the network so Vercel deploys are reflected immediately.

const CACHE = 'pca-v3';

const IMMUTABLE = [
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

// ── Install: only cache truly immutable assets ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(IMMUTABLE))
  );
  // Take control immediately — don't wait for old SW to be released
  self.skipWaiting();
});

// ── Activate: delete every old cache version ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // 1. Navigation — always go to network, never serve cached HTML
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Supabase — network-first, cache fallback
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 3. Vite JS/CSS chunks (hashed filenames) — stale-while-revalidate
  if (url.pathname.match(/\.(js|css)(\?.*)?$/) && url.hostname === self.location.hostname) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 4. Images, fonts, icons — cache-first
  event.respondWith(cacheFirst(request));
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached ?? new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached ?? fetchPromise;
}
