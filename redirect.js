// redirect.js

(function() {
  'use strict';
  const PRIMARY_HOST = 'zurai02.is-a.dev';
  if (typeof window === 'undefined' || !window.location) return;

  try {
    const host = window.location.hostname;
    // If host is falsy or already the primary host, do nothing
    if (!host || host === PRIMARY_HOST) return;

    // Build destination preserving path, query and hash
    const dest = 'https://' + PRIMARY_HOST + window.location.pathname + window.location.search + window.location.hash;

    // Replace so it doesn't create a history entry
    window.location.replace(dest);
  } catch (err) {
    // Silent failure — log for debugging
    try { console.warn('redirect.js failed:', err); } catch (e) {}
  }
})();
