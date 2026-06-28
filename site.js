/**
 * site.js — zurai02.github.io
 * Frontend engine: particles, animations, terminal, copy, perf optimisations.
 * ─────────────────────────────────────────────────────────────────────────────
 * Sections
 *  1. Config
 *  2. DOM cache
 *  3. Utilities
 *  4. Nav (scroll + active link)
 *  5. Cursor glow (lerp RAF)
 *  6. Particle canvas
 *  7. Hero typewriter
 *  8. Scroll reveal (IntersectionObserver)
 *  9. Animated counters
 * 10. Discord copy
 * 11. Terminal typewriter (syntax-highlighted)
 * 12. Reduced-motion guard
 * 13. Visibility API pause (saves battery when tab hidden)
 * 14. Init
 */

'use strict';

/* ═══════════════════════════════════════════
   1. CONFIG
   ═══════════════════════════════════════════ */
const CFG = {
  particles: {
    count:    70,
    colors:   ['#ff6b35', '#4493f8', '#a78bfa'],
    maxR:     1.6,
    minR:     0.3,
    maxSpeed: 0.38,
    minSpeed: 0.08,
    maxOpac:  0.42,
    minOpac:  0.07,
    drift:    0.22,   // horizontal drift amplitude
  },
  glow: {
    lerp: 0.07,       // cursor follow smoothness (lower = smoother)
  },
  hero: {
    phrases: [
      'Roblox Scripting & Engine Optimization Specialist.',
      'Building custom Luau modules that bypass engine limits.',
      'Pushing client-side performance to the absolute limit.',
      'Zero wasted frames. Lightweight networks. Fast code.',
    ],
    typeSpeed:   36,  // ms per character
    deleteSpeed: 16,
    pauseAfterType:   2500,
    pauseAfterDelete: 300,
    startDelay:       950,
  },
  terminal: {
    typeSpeed:   40,
    deleteSpeed: 18,
    pauseAfterType:   2700,
    pauseAfterDelete: 380,
    maxHistory:  8,
  },
  counter: {
    steps:    48,
    interval: 26,  // ms
  },
  toast: {
    duration: 2300,
  },
  nav: {
    scrollThreshold: 24,
  },
};

/* ═══════════════════════════════════════════
   2. DOM CACHE
   ═══════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const DOM = {
  nav:       $('nav'),
  glow:      $('cursor-glow'),
  canvas:    $('bg-canvas'),
  heroSub:   $('hero-sub'),
  twBody:    $('tw-body'),
  toast:     $('copy-toast'),
  discordBtn:$('discord-btn'),
  discordTxt:$('dbt'),
  year:      $('yr'),
};

/* ═══════════════════════════════════════════
   3. UTILITIES
   ═══════════════════════════════════════════ */
const rand  = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const isMobile = () => window.innerWidth < 640;
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════
   4. NAV  — scroll class + active section link
   ═══════════════════════════════════════════ */
function initNav() {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...links].map(a => ({
    a,
    el: document.querySelector(a.getAttribute('href')),
  })).filter(o => o.el);

  const onScroll = () => {
    /* scrolled class */
    DOM.nav.classList.toggle('scrolled', scrollY > CFG.nav.scrollThreshold);

    /* active nav link */
    let current = '';
    sections.forEach(({ el, a }) => {
      if (el.getBoundingClientRect().top <= 100) current = a.getAttribute('href');
    });
    links.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === current);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ═══════════════════════════════════════════
   5. CURSOR GLOW  (desktop-only smooth lerp)
   ═══════════════════════════════════════════ */
function initCursorGlow() {
  if (isMobile() || !DOM.glow) return;

  let mx = innerWidth / 2, my = innerHeight / 2;
  let gx = mx, gy = my;
  let visible = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!visible) { DOM.glow.style.opacity = '1'; visible = true; }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    DOM.glow.style.opacity = '0'; visible = false;
  });

  const tick = () => {
    gx += (mx - gx) * CFG.glow.lerp;
    gy += (my - gy) * CFG.glow.lerp;
    DOM.glow.style.transform = `translate(calc(${gx}px - 50%), calc(${gy}px - 50%))`;
    requestAnimationFrame(tick);
  };
  tick();
}

/* ═══════════════════════════════════════════
   6. PARTICLE CANVAS
   ═══════════════════════════════════════════ */
function initParticles() {
  const cv = DOM.canvas;
  if (!cv) return;
  const cx = cv.getContext('2d');
  let W = 0, H = 0, paused = false;

  const resize = () => {
    W = cv.width  = innerWidth;
    H = cv.height = innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* reduce particle count on mobile for perf */
  const count = isMobile()
    ? Math.floor(CFG.particles.count * 0.45)
    : CFG.particles.count;

  class Particle {
    constructor(init = false) { this.reset(init); }
    reset(init = false) {
      this.x  = rand(0, W || 800);
      this.y  = init ? rand(0, H || 600) : H + rand(2, 8);
      this.r  = rand(CFG.particles.minR, CFG.particles.maxR);
      this.s  = rand(CFG.particles.minSpeed, CFG.particles.maxSpeed);
      this.o  = rand(CFG.particles.minOpac, CFG.particles.maxOpac);
      this.c  = CFG.particles.colors[Math.floor(Math.random() * CFG.particles.colors.length)];
      this.dx = rand(-CFG.particles.drift, CFG.particles.drift);
      /* subtle pulse */
      this.phase = rand(0, Math.PI * 2);
      this.freq  = rand(0.005, 0.015);
    }
    update(t) {
      this.y -= this.s;
      this.x += this.dx;
      /* slow pulse on opacity */
      const pulse = Math.sin(this.phase + t * this.freq) * 0.12;
      this._o = clamp(this.o + pulse, 0.02, 0.55);
      if (this.y < -8) this.reset(false);
      if (this.x < -8 || this.x > W + 8) this.dx *= -1;
    }
    draw() {
      cx.beginPath();
      cx.arc(this.x, this.y, this.r, 0, 6.2832);
      cx.fillStyle = this.c;
      cx.globalAlpha = this._o || this.o;
      cx.fill();
    }
  }

  const pts = Array.from({ length: count }, () => new Particle(true));

  let lastT = 0;
  const raf = t => {
    if (!paused) {
      cx.clearRect(0, 0, W, H);
      pts.forEach(p => { p.update(t); p.draw(); });
      cx.globalAlpha = 1;
    }
    lastT = t;
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  /* pause when tab hidden — saves battery + CPU */
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });
}

/* ═══════════════════════════════════════════
   7. HERO TYPEWRITER
   ═══════════════════════════════════════════ */
function initHeroTypewriter() {
  const el = DOM.heroSub;
  if (!el) return;

  if (prefersReducedMotion()) {
    el.textContent = CFG.hero.phrases[0];
    return;
  }

  const { phrases, typeSpeed, deleteSpeed,
          pauseAfterType, pauseAfterDelete, startDelay } = CFG.hero;
  let pi = 0, ci = 0, deleting = false;

  const tick = () => {
    const ph = phrases[pi];
    if (!deleting) {
      el.innerHTML = ph.slice(0, ++ci) + '<span class="tw-cur"></span>';
      if (ci === ph.length) { deleting = true; setTimeout(tick, pauseAfterType); }
      else setTimeout(tick, typeSpeed);
    } else {
      el.innerHTML = ph.slice(0, --ci) + '<span class="tw-cur"></span>';
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, pauseAfterDelete);
      } else setTimeout(tick, deleteSpeed);
    }
  };
  setTimeout(tick, startDelay);
}

/* ═══════════════════════════════════════════
   8. SCROLL REVEAL
   ═══════════════════════════════════════════ */
function initScrollReveal() {
  if (prefersReducedMotion()) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════
   9. ANIMATED COUNTERS
   ═══════════════════════════════════════════ */
function initCounters() {
  const { steps, interval } = CFG.counter;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el    = e.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      let cur = 0;
      const step = target / steps;
      const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.floor(cur) + suffix;
        if (cur >= target) clearInterval(t);
      }, interval);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════
   10. DISCORD COPY
   ═══════════════════════════════════════════ */
let _toastTimer = null;

function showToast(msg) {
  const t = DOM.toast;
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), CFG.toast.duration);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
}

window.copyDiscord = function () {
  const text = 'lol066351';
  const btn  = DOM.discordBtn;
  const btxt = DOM.discordTxt;

  const done = () => {
    if (btxt) btxt.textContent = '✓ Copied!';
    if (btn)  btn.classList.add('copied');
    showToast('lol066351 copied to clipboard!');
    setTimeout(() => {
      if (btxt) btxt.textContent = 'Discord: lol066351';
      if (btn)  btn.classList.remove('copied');
    }, CFG.toast.duration);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
  } else {
    fallbackCopy(text); done();
  }
};

/* ═══════════════════════════════════════════
   11. TERMINAL TYPEWRITER
   ═══════════════════════════════════════════ */
const TW_LINES = [
  {
    raw: "local tween = CustomTween.new(part, {CFrame = goal}, 0.4, 'Quad')",
    hl:  '<span class="kw">local</span> tween = <span class="fn">CustomTween.new</span>(part, {CFrame = goal}, <span class="num">0.4</span>, <span class="str">\'Quad\'</span>)',
  },
  {
    raw: "RemoteBatcher:Fire('combat', {action = 'hit', target = id})",
    hl:  '<span class="op">RemoteBatcher</span>:<span class="fn">Fire</span>(<span class="str">\'combat\'</span>, {action = <span class="str">\'hit\'</span>, target = id})',
  },
  {
    raw: "Profiler:Mark('RenderStep')  -- 0.8ms avg",
    hl:  '<span class="op">Profiler</span>:<span class="fn">Mark</span>(<span class="str">\'RenderStep\'</span>)  <span class="cm">-- 0.8ms avg</span>',
  },
  {
    raw: "local pool = ObjectPool.new('Projectile', 64)",
    hl:  '<span class="kw">local</span> pool = <span class="fn">ObjectPool.new</span>(<span class="str">\'Projectile\'</span>, <span class="num">64</span>)',
  },
  {
    raw: "StreamingEnabled = true  -- smart LOD active",
    hl:  '<span class="op">StreamingEnabled</span> = <span class="kw">true</span>  <span class="cm">-- smart LOD active</span>',
  },
  {
    raw: "print('MemoryUsage:', Stats:GetTotalMemoryUsageMb(), 'MB')",
    hl:  '<span class="fn">print</span>(<span class="str">\'MemoryUsage:\'</span>, Stats:<span class="fn">GetTotalMemoryUsageMb</span>(), <span class="str">\'MB\'</span>)',
  },
  {
    raw: "local sig = Signal.new()  -- no BindableEvent overhead",
    hl:  '<span class="kw">local</span> sig = <span class="fn">Signal.new</span>()  <span class="cm">-- no BindableEvent overhead</span>',
  },
  {
    raw: "RunService.Heartbeat:Connect(onStep)  -- 0.3ms budget",
    hl:  '<span class="op">RunService</span>.Heartbeat:<span class="fn">Connect</span>(onStep)  <span class="cm">-- 0.3ms budget</span>',
  },
];

function initTerminal() {
  const body = DOM.twBody;
  if (!body) return;

  /* build active row */
  const aRow = document.createElement('div');
  aRow.className = 'tw-line tw-active';
  const aPr  = document.createElement('span'); aPr.className  = 'tw-prompt'; aPr.textContent = '>';
  const aCd  = document.createElement('span'); aCd.className  = 'tw-code';
  const aCur = document.createElement('span'); aCur.className = 'tw-block-cur';
  aRow.append(aPr, aCd, aCur);
  body.appendChild(aRow);

  const { typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, maxHistory } = CFG.terminal;
  let li = 0, ci = 0, del = false;

  const step = () => {
    const entry = TW_LINES[li];
    const raw   = entry.raw;

    if (!del) {
      aCd.textContent = raw.slice(0, ++ci);
      if (ci >= raw.length) { del = true; setTimeout(step, pauseAfterType); }
      else setTimeout(step, typeSpeed);
    } else {
      aCd.textContent = raw.slice(0, --ci);
      if (ci <= 0) {
        del = false;

        /* commit line with syntax highlight */
        const done = document.createElement('div');
        done.className = 'tw-line';
        done.innerHTML =
          `<span class="tw-prompt" style="color:var(--success)">✓</span>` +
          `<span class="tw-code">${entry.hl}</span>`;
        body.insertBefore(done, aRow);

        /* trim history */
        const hist = body.querySelectorAll('.tw-line:not(.tw-active)');
        if (hist.length > maxHistory) hist[0].remove();

        li = (li + 1) % TW_LINES.length;
        setTimeout(step, pauseAfterDelete);
      } else setTimeout(step, deleteSpeed);
    }
  };

  step();
}

/* ═══════════════════════════════════════════
   12. ACTIVE NAV LINK CSS  (add style once)
   ═══════════════════════════════════════════ */
function injectActiveNavStyle() {
  const s = document.createElement('style');
  s.textContent = `.nav-links a.active { color: var(--text); }
  .nav-links a.active::after { width: 100%; }`;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════
   13. PERFORMANCE: GPU HINT ON CARDS
   ═══════════════════════════════════════════ */
function hintGPU() {
  document.querySelectorAll('.skill-card, .link-card, .tw-terminal')
    .forEach(el => { el.style.willChange = 'transform'; });
}

/* ═══════════════════════════════════════════
   14. INIT
   ═══════════════════════════════════════════ */
function init() {
  /* year */
  if (DOM.year) DOM.year.textContent = new Date().getFullYear();

  injectActiveNavStyle();
  initNav();
  initCursorGlow();

  if (!prefersReducedMotion()) {
    initParticles();
  } else {
    /* hide canvas entirely if reduced motion */
    if (DOM.canvas) DOM.canvas.style.display = 'none';
  }

  initHeroTypewriter();
  initScrollReveal();
  initCounters();
  initTerminal();
  hintGPU();
}

/* run after DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ── Service Worker registration ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[SW] registered — scope:', reg.scope);
        /* auto-update: if new SW waiting, activate it */
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              newSW.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(err => console.warn('[SW] registration failed:', err));
  });
}
