/* settings.js — theme + accessibility settings (light/dark, underlined links, high contrast).
   Load it in <head> WITHOUT defer so the saved settings are applied before first paint. */
(function () {
  'use strict';

  var KEY = 'zs-settings-v1';
  var root = document.documentElement;

  function systemDefaults() {
    var mq = function (q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
    return {
      theme: mq('(prefers-color-scheme: light)') ? 'light' : 'dark',
      links: false,
      contrast: mq('(prefers-contrast: more)')
    };
  }

  function load() {
    var d = systemDefaults();
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && typeof saved === 'object') {
        if (saved.theme === 'light' || saved.theme === 'dark') d.theme = saved.theme;
        if (typeof saved.links === 'boolean') d.links = saved.links;
        if (typeof saved.contrast === 'boolean') d.contrast = saved.contrast;
      }
    } catch (e) { /* storage blocked or corrupt: use defaults */ }
    return d;
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function apply(state) {
    root.setAttribute('data-theme', state.theme);
    if (state.links) root.setAttribute('data-links', 'underline'); else root.removeAttribute('data-links');
    if (state.contrast) root.setAttribute('data-contrast', 'high'); else root.removeAttribute('data-contrast');
  }

  var state = load();
  apply(state);

  // ── UI wiring (only on pages that have the settings markup) ──
  function init() {
    var btn = document.getElementById('settings-btn');
    var panel = document.getElementById('settings-panel');
    if (!btn || !panel) return;

    var light = document.getElementById('set-light');
    var links = document.getElementById('set-links');
    var contrast = document.getElementById('set-contrast');
    var reset = document.getElementById('settings-reset');

    function sync() {
      light.checked = state.theme === 'light';
      links.checked = state.links;
      contrast.checked = state.contrast;
    }

    function open() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      light.focus();
    }

    function close(returnFocus) {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }

    btn.addEventListener('click', function () { if (panel.hidden) open(); else close(false); });

    light.addEventListener('change', function () { state.theme = light.checked ? 'light' : 'dark'; apply(state); save(state); });
    links.addEventListener('change', function () { state.links = links.checked; apply(state); save(state); });
    contrast.addEventListener('change', function () { state.contrast = contrast.checked; apply(state); save(state); });

    reset.addEventListener('click', function () { clear(); state = systemDefaults(); apply(state); sync(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) close(true);
    });

    document.addEventListener('click', function (e) {
      if (panel.hidden) return;
      if (!panel.contains(e.target) && !btn.contains(e.target)) close(false);
    });

    sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
