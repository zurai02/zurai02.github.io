/**
 * sw.js — zurai02.github.io Service Worker
 * ─────────────────────────────────────────
 * Strategy:
 *  - Shell files (HTML/CSS/JS)  → Cache First, update in background
 *  - Google Fonts               → Stale While Revalidate
 *  - Everything else            → Network First, fallback to cache
 *  - Offline fallback           → cached index.html
 */

'use strict';

const CACHE_NAME    = 'zurai02-v1';
const SHELL_CACHE   = 'zurai02-shell-v1';
const FONT_CACHE    = 'zurai02-fonts-v1';

/* Files to precache on install */
const SHELL_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/site.js',
  '/manifest.json',
];

/* ── Install: precache shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', event => {
  const KEEP = [SHELL_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !KEEP.includes(k))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: routing strategies ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and browser-extension requests */
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  /* Google Fonts — Stale While Revalidate */
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  /* Shell files (same origin HTML/CSS/JS) — Cache First */
  if (
    url.origin === self.location.origin &&
    (
      url.pathname === '/' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.ico')
    )
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  /* Everything else — Network First with offline fallback */
  event.respondWith(networkFirst(request));
});

/* ─────────────────────────────────────
   STRATEGIES
   ───────────────────────────────────── */

/* Cache First — serve from cache, update in background */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) {
    /* update cache in background */
    fetch(request)
      .then(res => { if (res && res.ok) cache.put(request, res.clone()); })
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return offlineFallback();
  }
}

/* Stale While Revalidate — serve cache instantly, refresh in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(res => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

/* Network First — try network, fall back to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback();
  }
}

/* Offline fallback — return cached index.html */
async function offlineFallback() {
  const cache  = await caches.open(SHELL_CACHE);
  const cached = await cache.match('/index.html');
  return cached || new Response(
    '<h1 style="font-family:monospace;padding:2rem;color:#ff6b35">zurai02.github.io — offline</h1>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

/* ── Listen for cache-bust message from page ── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
});
