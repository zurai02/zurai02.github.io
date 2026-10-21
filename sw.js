/**
 * sw.js — zurai02.github.io Service Worker (enhanced)
 * ─────────────────────────────────────────────────────
 * Strategy:
 *  - Navigations (HTML pages)   → Network First (nav preload), fallback to cached page / index.html
 *  - Shell assets (CSS/JS/etc.) → Stale While Revalidate
 *  - Images                     → Cache First, capped
 *  - Google Fonts               → Stale While Revalidate
 *  - Other same-origin GET      → Network First, capped runtime cache
 *  - Cross-origin APIs / POST   → Never touched (e.g. chatbot API calls)
 */

'use strict';

const VERSION       = 'v4';
const SHELL_CACHE   = `zurai02-shell-${VERSION}`;
const FONT_CACHE    = `zurai02-fonts-${VERSION}`;
const IMAGE_CACHE   = `zurai02-images-${VERSION}`;
const RUNTIME_CACHE = `zurai02-runtime-${VERSION}`;
const KEEP_CACHES   = [SHELL_CACHE, FONT_CACHE, IMAGE_CACHE, RUNTIME_CACHE];

const MAX_ENTRIES = { [IMAGE_CACHE]: 60, [RUNTIME_CACHE]: 40, [FONT_CACHE]: 30 };

/* Files to precache on install */
const SHELL_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/site.js',
  '/chatbot.js',
  '/manifest.json',
];

const SHELL_EXT = /\.(?:css|js|json|webmanifest)$/i;
const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i;

/* ── Install: precache shell (tolerates a missing file) ── */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL_FILES.map(async url => {
      try {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (res.ok) await cache.put(url, res);
      } catch { /* skip unavailable file instead of failing the install */ }
    }));
    await self.skipWaiting();
  })());
});

/* ── Activate: delete old caches, enable navigation preload ── */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable().catch(() => {});
    }
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('zurai02-') && !KEEP_CACHES.includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ── Fetch: routing ── */
self.addEventListener('fetch', event => {
  const { request } = event;

  /* Only handle GET; skip range requests (can't be cached as 206) */
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (!/^https?:$/.test(url.protocol)) return;

  const sameOrigin = url.origin === self.location.origin;

  /* Google Fonts */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event, FONT_CACHE));
    return;
  }

  /* Leave all other cross-origin requests (APIs, analytics, CDNs) to the network */
  if (!sameOrigin) return;

  /* Page navigations */
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  /* Images */
  if (request.destination === 'image' || IMAGE_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(event, IMAGE_CACHE));
    return;
  }

  /* Shell assets (ignore ?v=123 style cache-busting when matching) */
  if (SHELL_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, SHELL_CACHE, { ignoreSearch: true }));
    return;
  }

  /* Everything else */
  event.respondWith(networkFirst(event, RUNTIME_CACHE));
});

/* ─────────────────────────────────────
   STRATEGIES
   ───────────────────────────────────── */

/* Navigations: network first (with preload), then cache, then offline page */
async function handleNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    const response = preload || await fetch(event.request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      event.waitUntil(cache.put(event.request, response.clone()));
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match(event.request, { ignoreSearch: true }))
        || (await cache.match('/index.html'))
        || (await cache.match('/'))
        || offlineResponse();
  }
}

/* Cache First — used for rarely-changing assets like images */
async function cacheFirst(event, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (isCacheable(response)) {
      event.waitUntil(cache.put(event.request, response.clone()).then(() => trimCache(cacheName)));
    }
    return response;
  } catch {
    return Response.error();
  }
}

/* Stale While Revalidate — serve cache instantly, refresh in background */
async function staleWhileRevalidate(event, cacheName, matchOpts = {}) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(event.request, matchOpts);

  const refresh = fetch(event.request)
    .then(async res => {
      if (isCacheable(res)) {
        await cache.put(event.request, res.clone());
        await trimCache(cacheName);
      }
      return res;
    })
    .catch(() => null);

  /* Keep the worker alive until the background refresh finishes */
  event.waitUntil(refresh);

  if (cached) return cached;
  return (await refresh) || Response.error();
}

/* Network First — try network, fall back to cache */
async function networkFirst(event, cacheName) {
  try {
    const response = await fetch(event.request);
    if (isCacheable(response)) {
      const cache = await caches.open(cacheName);
      event.waitUntil(cache.put(event.request, response.clone()).then(() => trimCache(cacheName)));
    }
    return response;
  } catch {
    return (await caches.match(event.request)) || Response.error();
  }
}

/* ─────────────────────────────────────
   HELPERS
   ───────────────────────────────────── */

/* Cache good responses; allow opaque (cross-origin no-cors) font/image responses */
function isCacheable(res) {
  return !!res && (res.ok || res.type === 'opaque') && res.status !== 206;
}

/* Keep runtime caches bounded (FIFO) */
async function trimCache(cacheName) {
  const max = MAX_ENTRIES[cacheName];
  if (!max) return;
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
  }
}

function offlineResponse() {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Offline</title>
     <body style="font-family:monospace;padding:2rem;background:#0d0d0d;color:#ff6b35">
       <h1>zurai02.github.io — offline</h1>
       <p>You're offline and this page isn't cached yet. Reconnect and try again.</p>
     </body>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/* ── Messages from the page ──
 *  navigator.serviceWorker.controller.postMessage('SKIP_WAITING')
 *  navigator.serviceWorker.controller.postMessage('CLEAR_CACHE')
 *  navigator.serviceWorker.controller.postMessage('GET_VERSION')  → replies via event.source
 */
self.addEventListener('message', event => {
  const msg = event.data;
  if (msg === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (msg === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k.startsWith('zurai02-')).map(k => caches.delete(k)))
      )
    );
  } else if (msg === 'GET_VERSION' && event.source) {
    event.source.postMessage({ type: 'VERSION', version: VERSION });
  }
});
