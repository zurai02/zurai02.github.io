/**
 * site.ts — zurai02.github.io
 * TypeScript source — compile to site.js via:
 *   npx tsc --project tsconfig.json
 *
 * This file is the typed source of truth.
 * site.js is the compiled output served to browsers.
 */

'use strict';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface ParticleConfig {
  count:    number;
  colors:   string[];
  maxR:     number;
  minR:     number;
  maxSpeed: number;
  minSpeed: number;
  maxOpac:  number;
  minOpac:  number;
  drift:    number;
}

interface HeroConfig {
  phrases:          string[];
  typeSpeed:        number;
  deleteSpeed:      number;
  pauseAfterType:   number;
  pauseAfterDelete: number;
  startDelay:       number;
}

interface TerminalConfig {
  typeSpeed:        number;
  deleteSpeed:      number;
  pauseAfterType:   number;
  pauseAfterDelete: number;
  maxHistory:       number;
}

interface TerminalLine {
  raw: string;
  hl:  string;
}

interface SiteConfig {
  particles: ParticleConfig;
  glow:      { lerp: number };
  hero:      HeroConfig;
  terminal:  TerminalConfig;
  counter:   { steps: number; interval: number };
  toast:     { duration: number };
  nav:       { scrollThreshold: number };
}

/* ═══════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════ */
const CFG: SiteConfig = {
  particles: {
    count:    70,
    colors:   ['#ff6b35', '#4493f8', '#a78bfa'],
    maxR:     1.6,
    minR:     0.3,
    maxSpeed: 0.38,
    minSpeed: 0.08,
    maxOpac:  0.42,
    minOpac:  0.07,
    drift:    0.22,
  },
  glow:     { lerp: 0.07 },
  hero: {
    phrases: [
      'Roblox Scripting & Engine Optimization Specialist.',
      'Building custom Luau modules that bypass engine limits.',
      'Pushing client-side performance to the absolute limit.',
      'Zero wasted frames. Lightweight networks. Fast code.',
    ],
    typeSpeed:        36,
    deleteSpeed:      16,
    pauseAfterType:   2500,
    pauseAfterDelete: 300,
    startDelay:       950,
  },
  terminal: {
    typeSpeed:        40,
    deleteSpeed:      18,
    pauseAfterType:   2700,
    pauseAfterDelete: 380,
    maxHistory:       8,
  },
  counter:  { steps: 48, interval: 26 },
  toast:    { duration: 2300 },
  nav:      { scrollThreshold: 24 },
};

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */
const $       = (id: string): HTMLElement | null => document.getElementById(id);
const rand    = (min: number, max: number): number => Math.random() * (max - min) + min;
const clamp   = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);
const isMobile              = (): boolean => window.innerWidth < 640;
const prefersReducedMotion  = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════
   PARTICLE CLASS
   ═══════════════════════════════════════════ */
class Particle {
  x!:     number;
  y!:     number;
  r!:     number;
  s!:     number;
  o!:     number;
  _o!:    number;
  c!:     string;
  dx!:    number;
  phase!: number;
  freq!:  number;

  constructor(private W: number, private H: number, init = false) {
    this.reset(init);
  }

  reset(init = false): void {
    const { minR, maxR, minSpeed, maxSpeed, minOpac, maxOpac, colors, drift } = CFG.particles;
    this.x     = rand(0, this.W);
    this.y     = init ? rand(0, this.H) : this.H + rand(2, 8);
    this.r     = rand(minR, maxR);
    this.s     = rand(minSpeed, maxSpeed);
    this.o     = rand(minOpac, maxOpac);
    this._o    = this.o;
    this.c     = colors[Math.floor(Math.random() * colors.length)];
    this.dx    = rand(-drift, drift);
    this.phase = rand(0, Math.PI * 2);
    this.freq  = rand(0.005, 0.015);
  }

  update(t: number): void {
    this.y -= this.s;
    this.x += this.dx;
    const pulse = Math.sin(this.phase + t * this.freq) * 0.12;
    this._o = clamp(this.o + pulse, 0.02, 0.55);
    if (this.y < -8)                      this.reset(false);
    if (this.x < -8 || this.x > this.W + 8) this.dx *= -1;
  }

  draw(cx: CanvasRenderingContext2D): void {
    cx.beginPath();
    cx.arc(this.x, this.y, this.r, 0, 6.2832);
    cx.fillStyle    = this.c;
    cx.globalAlpha  = this._o;
    cx.fill();
  }
}

/* ═══════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════ */
function initNav(): void {
  const nav   = $('nav');
  if (!nav) return;

  const links    = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]');
  const sections = [...links].map(a => ({
    a,
    el: document.querySelector<HTMLElement>(a.getAttribute('href') ?? ''),
  })).filter((o): o is { a: HTMLAnchorElement; el: HTMLElement } => o.el !== null);

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > CFG.nav.scrollThreshold);
    let current = '';
    sections.forEach(({ el, a }) => {
      if (el.getBoundingClientRect().top <= 100) current = a.getAttribute('href') ?? '';
    });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === current));
  }, { passive: true });
}

/* ═══════════════════════════════════════════
   CURSOR GLOW
   ═══════════════════════════════════════════ */
function initCursorGlow(): void {
  const glow = $('cursor-glow');
  if (!glow || isMobile()) return;

  let mx = innerWidth / 2, my = innerHeight / 2;
  let gx = mx, gy = my;

  document.addEventListener('mousemove', (e: MouseEvent) => {
    mx = e.clientX; my = e.clientY;
    glow.style.opacity = '1';
  }, { passive: true });

  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });

  const tick = (): void => {
    gx += (mx - gx) * CFG.glow.lerp;
    gy += (my - gy) * CFG.glow.lerp;
    glow.style.transform = `translate(calc(${gx}px - 50%), calc(${gy}px - 50%))`;
    requestAnimationFrame(tick);
  };
  tick();
}

/* ═══════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════ */
function initParticles(): void {
  const cv = $('bg-canvas') as HTMLCanvasElement | null;
  if (!cv) return;
  const cx = cv.getContext('2d')!;
  let W = 0, H = 0, paused = false;

  const resize = (): void => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const count = isMobile() ? Math.floor(CFG.particles.count * 0.45) : CFG.particles.count;
  const pts   = Array.from({ length: count }, () => new Particle(W, H, true));

  const raf = (t: number): void => {
    if (!paused) {
      cx.clearRect(0, 0, W, H);
      pts.forEach(p => { p.update(t * 0.001); p.draw(cx); });
      cx.globalAlpha = 1;
    }
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.addEventListener('visibilitychange', () => { paused = document.hidden; });
}

/* ═══════════════════════════════════════════
   HERO TYPEWRITER
   ═══════════════════════════════════════════ */
function initHeroTypewriter(): void {
  const el = $('hero-sub');
  if (!el) return;
  if (prefersReducedMotion()) { el.textContent = CFG.hero.phrases[0]; return; }

  const { phrases, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, startDelay } = CFG.hero;
  let pi = 0, ci = 0, del = false;

  const tick = (): void => {
    const ph = phrases[pi];
    if (!del) {
      el.innerHTML = ph.slice(0, ++ci) + '<span class="tw-cur"></span>';
      if (ci === ph.length) { del = true; setTimeout(tick, pauseAfterType); }
      else setTimeout(tick, typeSpeed);
    } else {
      el.innerHTML = ph.slice(0, --ci) + '<span class="tw-cur"></span>';
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(tick, pauseAfterDelete); }
      else setTimeout(tick, deleteSpeed);
    }
  };
  setTimeout(tick, startDelay);
}

/* ═══════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════ */
function initScrollReveal(): void {
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
   COUNTERS
   ═══════════════════════════════════════════ */
function initCounters(): void {
  const { steps, interval } = CFG.counter;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target as HTMLElement;
      const target = +(el.dataset['count'] ?? 0);
      const suffix = el.dataset['suffix'] ?? '';
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
  document.querySelectorAll<HTMLElement>('[data-count]').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════
   DISCORD COPY
   ═══════════════════════════════════════════ */
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
  const t = $('copy-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), CFG.toast.duration);
}

function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch (_) { /* silent */ }
  document.body.removeChild(ta);
}

(window as any).copyDiscord = (): void => {
  const text = 'lol066351';
  const btn  = $('discord-btn');
  const btxt = $('dbt');

  const done = (): void => {
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
   TERMINAL
   ═══════════════════════════════════════════ */
const TW_LINES: TerminalLine[] = [
  { raw: "local tween = CustomTween.new(part, {CFrame = goal}, 0.4, 'Quad')",
    hl:  '<span class="kw">local</span> tween = <span class="fn">CustomTween.new</span>(part, {CFrame = goal}, <span class="num">0.4</span>, <span class="str">\'Quad\'</span>)' },
  { raw: "RemoteBatcher:Fire('combat', {action = 'hit', target = id})",
    hl:  '<span class="op">RemoteBatcher</span>:<span class="fn">Fire</span>(<span class="str">\'combat\'</span>, {action = <span class="str">\'hit\'</span>, target = id})' },
  { raw: "Profiler:Mark('RenderStep')  -- 0.8ms avg",
    hl:  '<span class="op">Profiler</span>:<span class="fn">Mark</span>(<span class="str">\'RenderStep\'</span>)  <span class="cm">-- 0.8ms avg</span>' },
  { raw: "local pool = ObjectPool.new('Projectile', 64)",
    hl:  '<span class="kw">local</span> pool = <span class="fn">ObjectPool.new</span>(<span class="str">\'Projectile\'</span>, <span class="num">64</span>)' },
  { raw: "StreamingEnabled = true  -- smart LOD active",
    hl:  '<span class="op">StreamingEnabled</span> = <span class="kw">true</span>  <span class="cm">-- smart LOD active</span>' },
  { raw: "RunService.Heartbeat:Connect(onStep)  -- 0.3ms budget",
    hl:  '<span class="op">RunService</span>.Heartbeat:<span class="fn">Connect</span>(onStep)  <span class="cm">-- 0.3ms budget</span>' },
];

function initTerminal(): void {
  const body = $('tw-body');
  if (!body) return;

  const aRow = document.createElement('div'); aRow.className = 'tw-line tw-active';
  const aPr  = document.createElement('span'); aPr.className  = 'tw-prompt'; aPr.textContent = '>';
  const aCd  = document.createElement('span'); aCd.className  = 'tw-code';
  const aCur = document.createElement('span'); aCur.className = 'tw-block-cur';
  aRow.append(aPr, aCd, aCur);
  body.appendChild(aRow);

  const { typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, maxHistory } = CFG.terminal;
  let li = 0, ci = 0, del = false;

  const step = (): void => {
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
        const done = document.createElement('div');
        done.className = 'tw-line';
        done.innerHTML = `<span class="tw-prompt" style="color:var(--success)">✓</span><span class="tw-code">${entry.hl}</span>`;
        body.insertBefore(done, aRow);
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
   INIT
   ═══════════════════════════════════════════ */
function init(): void {
  const yr = $('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  initNav();
  initCursorGlow();

  if (prefersReducedMotion()) {
    const cv = $('bg-canvas') as HTMLCanvasElement | null;
    if (cv) cv.style.display = 'none';
  } else {
    initParticles();
  }

  initHeroTypewriter();
  initScrollReveal();
  initCounters();
  initTerminal();

  /* GPU hints */
  document.querySelectorAll<HTMLElement>('.skill-card, .link-card, .tw-terminal')
    .forEach(el => { el.style.willChange = 'transform'; });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* Service Worker */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(err => console.warn('[SW] failed:', err));
  });
}
