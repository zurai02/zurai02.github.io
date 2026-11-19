'use strict';

const VERSION = 'v13';
const CACHE = `zurai02-shell-${VERSION}`;
const SHELL = ['/','/index.html','/style.css','/style.min.css','/desktop-hover.css','/site.js','/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(async (url) => {
      try {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (response.ok) await cache.put(url, response);
      } catch { /* allow offline install when a shell asset is unavailable */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('zurai02-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          event.waitUntil(cache.put('/index.html', response.clone()));
        }
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  if (!/\.(?:css|js|json|webmanifest)$/i.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    const refresh = fetch(request).then((response) => {
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    }).catch(() => null);
    return cached || await refresh || Response.error();
  })());
});
