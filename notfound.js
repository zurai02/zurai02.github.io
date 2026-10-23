/* notfound.js — logic for 404.html (plain JS, no build step).
 *
 * A single-segment path like /my-repo is checked against the GitHub API and
 * redirected to github.com/<user>/my-repo if that repo exists. Anything else
 * reveals the error card.
 *
 * This is deliberately separate from site.js, which is the home page's script
 * and has no 404 handling. GitHub Pages is deployed straight from the repo
 * root (no build), so this file is served exactly as written here.
 */
(function () {
  'use strict';

  var CFG = { user: 'zurai02', redirectTimeout: 3500, glowLerp: 0.12 };

  function $(id) { return document.getElementById(id); }

  /* ── Soft cursor glow (desktop only; style.css hides it on touch devices) ── */
  function initCursorGlow() {
    var glow = $('cursor-glow');
    if (!glow) return;
    if (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var gx = mx, gy = my;
    var visible = false;

    function show(x, y) {
      mx = x; my = y;
      if (!visible) { glow.style.opacity = '1'; visible = true; }
    }
    function hide() { glow.style.opacity = '0'; visible = false; }

    document.addEventListener('pointermove', function (e) { show(e.clientX, e.clientY); }, { passive: true });
    document.addEventListener('pointerenter', function (e) { show(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('pointerleave', hide);
    window.addEventListener('mouseleave', hide);

    (function tick() {
      gx += (mx - gx) * CFG.glowLerp;
      gy += (my - gy) * CFG.glowLerp;
      // #cursor-glow is 420px wide/tall; centre it on the pointer
      glow.style.transform = 'translate(' + (gx - 210) + 'px,' + (gy - 210) + 'px)';
      requestAnimationFrame(tick);
    })();
  }

  /* ── Repo resolver ── */
  function initNotFound() {
    var card  = $('nf-card');
    var title = $('nf-title');
    var msg   = $('nf-msg');
    var badge = $('nf-badge-text');
    if (!card || !title || !msg || !badge) return;

    var user = CFG.user;

    function showError(errTitle, tag, buildMsg) {
      title.textContent = errTitle;
      badge.textContent = tag;
      msg.textContent = '';
      buildMsg(msg);
      document.title = errTitle + ' — ' + user;
      card.hidden = false;
    }

    var segments = location.pathname.split('/').filter(Boolean);
    var repoName = segments[0] || '';

    // Only single-segment, safe-looking paths can be repos
    if (
      segments.length !== 1 ||
      !/^[A-Za-z0-9_.-]+$/.test(repoName) ||
      repoName === '.' || repoName === '..'
    ) {
      showError('Page Not Found', '404 // INVALID_PATH', function (el) {
        el.textContent = 'There is no repository or page at this path.';
      });
      return;
    }

    var targetUrl = 'https://github.com/' + user + '/' + encodeURIComponent(repoName);
    var resolved = false;

    function redirect() {
      if (resolved) return;
      resolved = true;
      location.replace(targetUrl);
    }

    // If the GitHub API is slow, forward anyway rather than leaving a blank page
    var timer = setTimeout(redirect, CFG.redirectTimeout);

    fetch('https://api.github.com/repos/' + user + '/' + encodeURIComponent(repoName))
      .then(function (res) {
        if (res.status === 404) {
          clearTimeout(timer);
          resolved = true;
          showError('Repository Not Found', '404 // REPO_NOT_FOUND', function (el) {
            var code = document.createElement('span');
            code.className = 'nf-repo';
            code.textContent = repoName;
            el.append('No public repository matching ', code, ' was found on @' + user + '.');
          });
          return null;
        }
        if (!res.ok) { redirect(); return null; } // rate limit / API hiccup: forward anyway
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        clearTimeout(timer);
        redirect();
      })
      .catch(redirect);
  }

  function init() {
    initCursorGlow();
    initNotFound();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
