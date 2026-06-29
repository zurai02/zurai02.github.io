/**
 * maintenance.js — zurai02.github.io
 * ─────────────────────────────────────────────────────────────────
 * Maintenance mode system.
 *
 * HOW TO ACTIVATE:
 *   Option A — hardcode (commit to GitHub):
 *     Set MAINTENANCE.enabled = true below, push to GitHub.
 *
 *   Option B — browser console (instant, no commit needed):
 *     localStorage.setItem('zurai02_maintenance', 'true')
 *     location.reload()
 *
 * HOW TO DEACTIVATE:
 *   Option A — set MAINTENANCE.enabled = false, push.
 *   Option B — localStorage.removeItem('zurai02_maintenance')
 *              location.reload()
 *
 * BYPASS (admin access while site is down):
 *   Add ?admin=zurai02 to the URL.
 *   e.g. https://zurai02.github.io/?admin=zurai02
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const MAINTENANCE = {
  enabled:       false,            // ← flip to true to activate
  message:       'Performing scheduled maintenance. Back soon.',
  estimatedTime: '',               // e.g. '30 minutes' — leave blank to hide
  adminKey:      'zurai02',        // URL param bypass: ?admin=zurai02
  storageKey:    'zurai02_maintenance',
  bypassKey:     'zurai02_admin_bypass',
};

(function checkMaintenance() {
  /* ── Admin bypass via URL param ── */
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === MAINTENANCE.adminKey) {
    sessionStorage.setItem(MAINTENANCE.bypassKey, '1');
    /* Clean the URL without reload */
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
  }

  /* If bypassed this session, let site load normally */
  if (sessionStorage.getItem(MAINTENANCE.bypassKey)) return;

  /* ── Check if maintenance is active ── */
  const forced   = localStorage.getItem(MAINTENANCE.storageKey) === 'true';
  const hardcode = MAINTENANCE.enabled;

  if (!forced && !hardcode) return;

  /* ── Block the page immediately ── */
  _renderMaintenance();
})();

function _renderMaintenance() {
  /* Prevent rest of page scripts from running */
  document.addEventListener('DOMContentLoaded', _mountOverlay, { once: true });

  /* If DOM already ready, mount immediately */
  if (document.readyState !== 'loading') _mountOverlay();
}

function _mountOverlay() {
  /* Hide all page content */
  document.body.style.overflow = 'hidden';

  /* Build overlay */
  const overlay = document.createElement('div');
  overlay.id = 'maintenance-overlay';

  const eta = MAINTENANCE.estimatedTime
    ? `<p id="maint-eta">Estimated time: <strong>${MAINTENANCE.estimatedTime}</strong></p>`
    : '';

  overlay.innerHTML = `
    <div id="maint-card">
      <div id="maint-logo">zurai02<span>_</span></div>

      <div id="maint-icon-wrap">
        <svg id="maint-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0
                   l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12
                   0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>

      <h1 id="maint-title">Under Maintenance</h1>
      <p id="maint-msg">${MAINTENANCE.message}</p>
      ${eta}

      <div id="maint-status">
        <span class="maint-dot"></span>
        Working on it
      </div>

      <div id="maint-links">
        <a href="https://devforum.roblox.com/u/zurai02"
           target="_blank" rel="noopener noreferrer">DevForum</a>
        <span>·</span>
        <a href="https://www.roblox.com/users/5674181802/profile"
           target="_blank" rel="noopener noreferrer">Roblox</a>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  /* Inject styles */
  const s = document.createElement('style');
  s.textContent = `
    #maintenance-overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      background: #080c11;
      background-image: radial-gradient(circle at 1px 1px, #ffffff06 1px, transparent 0);
      background-size: 32px 32px;
      font-family: 'Inter', system-ui, sans-serif;
      color: #eaf0f8;
      animation: maint-in .5s ease both;
    }
    @keyframes maint-in { from{opacity:0} to{opacity:1} }

    #maint-card {
      text-align: center; padding: 2.5rem 2rem;
      max-width: 420px; width: 90%;
      animation: maint-up .6s cubic-bezier(.22,1,.36,1) .1s both;
    }
    @keyframes maint-up {
      from { opacity:0; transform: translateY(24px); }
      to   { opacity:1; transform: translateY(0); }
    }

    #maint-logo {
      font-family: 'JetBrains Mono', monospace;
      font-size: .9rem; font-weight: 700;
      color: #ff6b35; margin-bottom: 2rem;
      letter-spacing: -.01em;
    }
    #maint-logo span {
      color: #8b949e;
      animation: maint-blink 1.1s step-end infinite;
    }
    @keyframes maint-blink { 0%,100%{opacity:1} 50%{opacity:0} }

    #maint-icon-wrap {
      width: 64px; height: 64px;
      background: rgba(255,107,53,.08);
      border: 1px solid rgba(255,107,53,.2);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.75rem;
      animation: maint-spin-slow 6s linear infinite;
    }
    @keyframes maint-spin-slow {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    #maint-icon {
      width: 28px; height: 28px;
      color: #ff6b35;
      animation: maint-spin-slow 6s linear infinite reverse;
    }

    #maint-title {
      font-size: clamp(1.6rem, 5vw, 2.4rem);
      font-weight: 900; letter-spacing: -.04em;
      margin-bottom: .6rem; line-height: 1.1;
    }

    #maint-msg {
      font-size: .9rem; color: #8b949e;
      line-height: 1.75; margin-bottom: .75rem;
    }

    #maint-eta {
      font-size: .8rem; color: #8b949e;
      margin-bottom: 1.5rem;
    }
    #maint-eta strong { color: #ff9560; }

    #maint-status {
      display: inline-flex; align-items: center; gap: .45rem;
      font-size: .72rem; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
      color: #e3b341;
      background: rgba(227,179,65,.07);
      border: 1px solid rgba(227,179,65,.18);
      padding: .28rem .8rem; border-radius: 20px;
      margin-bottom: 2rem;
    }
    .maint-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #e3b341;
      box-shadow: 0 0 6px #e3b341;
      animation: maint-pulse 1.6s ease-in-out infinite;
    }
    @keyframes maint-pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.5); opacity: .5; }
    }

    #maint-links {
      display: flex; align-items: center; justify-content: center;
      gap: .75rem; font-size: .78rem;
    }
    #maint-links span { color: #30363d; }
    #maint-links a {
      color: #8b949e; text-decoration: none;
      transition: color .15s;
    }
    #maint-links a:hover { color: #ff6b35; }
  `;
  document.head.appendChild(s);

  /* Auto-refresh every 60s to check if maintenance lifted */
  setTimeout(() => location.reload(), 60000);
}

/* ─────────────────────────────────────────────────────────────────
   CONSOLE CONTROL API  (use in browser DevTools)
   ─────────────────────────────────────────────────────────────────
   Enable:   MAINT.enable()
   Disable:  MAINT.disable()
   Status:   MAINT.status()
   ───────────────────────────────────────────────────────────────── */
window.MAINT = {
  enable() {
    localStorage.setItem(MAINTENANCE.storageKey, 'true');
    console.log('%c[maintenance] ON — reload to activate', 'color:#ff6b35;font-weight:bold');
    location.reload();
  },
  disable() {
    localStorage.removeItem(MAINTENANCE.storageKey);
    sessionStorage.removeItem(MAINTENANCE.bypassKey);
    console.log('%c[maintenance] OFF — reload to deactivate', 'color:#3fb950;font-weight:bold');
    location.reload();
  },
  status() {
    const on = localStorage.getItem(MAINTENANCE.storageKey) === 'true' || MAINTENANCE.enabled;
    console.log(`%c[maintenance] ${on ? 'ACTIVE' : 'INACTIVE'}`, `color:${on ? '#ff6b35' : '#3fb950'};font-weight:bold`);
    return on;
  },
};
