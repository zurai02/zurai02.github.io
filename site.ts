/**
 * site.ts — zurai02.github.io  (enhanced)
 * Compile: npx tsc --project tsconfig.json
 * NOTE: Particle canvas is owned by wasm.js — initParticles() kept as fallback only.
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

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

interface CounterConfig {
  steps:    number;
  interval: number;
}

interface SiteConfig {
  particles: ParticleConfig;
  glow:      { lerp: number };
  hero:      HeroConfig;
  terminal:  TerminalConfig;
  counter:   CounterConfig;
  toast:     { duration: number };
  nav:       { scrollThreshold: number };
}

/* ════════════════════════════════════════════════════════════
   CONFIG
   ════════════════════════════════════════════════════════════ */

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
  glow:    { lerp: 0.07 },
  hero: {
    phrases: [
      'Roblox Scripting & Engine Optimization Specialist.',
      'Building custom Luau modules that bypass engine limits.',
      'Pushing client-side performance to the absolute limit.',
      'Zero wasted frames. Lightweight networks. Fast code.',
      'WebAssembly-powered tools. Native-speed results.',
    ],
    typeSpeed:        34,
    deleteSpeed:      14,
    pauseAfterType:   2600,
    pauseAfterDelete: 280,
    startDelay:       900,
  },
  terminal: {
    typeSpeed:        38,
    deleteSpeed:      16,
    pauseAfterType:   2800,
    pauseAfterDelete: 360,
    maxHistory:       9,
  },
  counter: { steps: 52, interval: 24 },
  toast:   { duration: 2400 },
  nav:     { scrollThreshold: 24 },
};

/* ════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════ */

const $       = (id: string): HTMLElement | null => document.getElementById(id);
const rand    = (a: number, b: number): number   => Math.random() * (b - a) + a;
const clamp   = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);
const lerp    = (a: number, b: number, t: number): number   => a + (b - a) * t;
const isMob   = (): boolean => window.innerWidth < 640;
const noMot   = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raf     = (fn: FrameRequestCallback): number => requestAnimationFrame(fn);

/* ════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ════════════════════════════════════════════════════════════ */

function initScrollProgress(): void {
  const bar = document.createElement('div');
  bar.id = 'scroll-bar';
  document.body.appendChild(bar);

  window.addEventListener('scroll', (): void => {
    const pct = (scrollY / (document.body.scrollHeight - innerHeight)) * 100;
    bar.style.width = clamp(pct, 0, 100) + '%';
  }, { passive: true });
}

/* ════════════════════════════════════════════════════════════
   WELCOME SYSTEM
   ════════════════════════════════════════════════════════════ */

function initWelcome(): void {
  const hour  = new Date().getHours();
  const greet =
    hour < 5  ? 'Up late?'      :
    hour < 12 ? 'Good morning'  :
    hour < 17 ? 'Good afternoon':
    hour < 21 ? 'Good evening'  : 'Good night';

  const el = document.getElementById('greeting');
  if (el) el.textContent = greet;

  const visits = parseInt(localStorage.getItem('zurai02_visits') ?? '0', 10) + 1;
  localStorage.setItem('zurai02_visits', String(visits));

  const first = !localStorage.getItem('zurai02_welcomed');
  if (first) {
    localStorage.setItem('zurai02_welcomed', '1');
    _showOverlay(greet);
  } else if (visits > 1) {
    setTimeout(() => showToast(`Welcome back! Visit #${visits} 🔥`), 1200);
  }
}

function _showOverlay(greet: string): void {
  const ov = document.createElement('div');
  ov.id = 'welcome-overlay';
  ov.innerHTML = `
    <div id="welcome-card">
      <div id="welcome-logo">zurai02<span>_</span></div>
      <p id="welcome-greeting">${greet}!</p>
      <p id="welcome-sub">Roblox Scripting &amp; Engine Optimization</p>
      <div id="welcome-tags">
        <span>Luau</span><span>WebAssembly</span><span>Client-Side</span>
      </div>
      <button id="welcome-enter">Enter site <span>→</span></button>
    </div>`;
  document.body.appendChild(ov);

  const s = document.createElement('style');
  s.textContent = `
    #welcome-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;
      justify-content:center;background:rgba(7,9,14,.97);backdrop-filter:blur(24px);
      animation:wo-in .4s ease both}
    @keyframes wo-in{from{opacity:0}to{opacity:1}}
    @keyframes wo-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.97)}}
    #welcome-card{text-align:center;max-width:380px;padding:0 2rem;
      animation:wc-in .6s cubic-bezier(.22,1,.36,1) .1s both}
    @keyframes wc-in{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
    #welcome-logo{font-family:'JetBrains Mono',monospace;font-size:1.4rem;font-weight:700;
      color:#ff6b35;margin-bottom:1.2rem;letter-spacing:-.02em}
    #welcome-logo span{color:#4a5568;animation:blink-c 1.1s step-end infinite}
    #welcome-greeting{font-size:clamp(2.2rem,7vw,3.8rem);font-weight:900;letter-spacing:-.04em;
      color:#eaf1fa;margin-bottom:.4rem}
    #welcome-sub{font-size:.82rem;color:#6e7e94;margin-bottom:1.5rem}
    #welcome-tags{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:2rem}
    #welcome-tags span{background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.2);
      color:#ff9560;padding:.2rem .7rem;border-radius:20px;font-size:.7rem;
      font-family:'JetBrains Mono',monospace}
    #welcome-enter{background:#ff6b35;color:#fff;border:none;border-radius:10px;
      padding:.75rem 2.2rem;font-size:.9rem;font-weight:700;font-family:inherit;cursor:pointer;
      letter-spacing:.02em;transition:all .18s;display:inline-flex;align-items:center;gap:.5rem}
    #welcome-enter span{transition:transform .18s}
    #welcome-enter:hover{background:#ff9560;transform:translateY(-2px);
      box-shadow:0 12px 36px rgba(255,107,53,.45)}
    #welcome-enter:hover span{transform:translateX(3px)}`;
  document.head.appendChild(s);

  const dismiss = (): void => {
    ov.style.animation = 'wo-out .35s ease forwards';
    setTimeout(() => ov.remove(), 380);
  };

  ($('welcome-enter') as HTMLButtonElement | null)
    ?.addEventListener('click', dismiss);
  document.addEventListener('keydown', dismiss, { once: true });
}

/* ════════════════════════════════════════════════════════════
   HAMBURGER MOBILE MENU
   ════════════════════════════════════════════════════════════ */

function initMobileMenu(): void {
  const nav = $('nav');
  const ul  = nav?.querySelector<HTMLUListElement>('.nav-links');
  if (!nav || !ul) return;

  const btn = document.createElement('button');
  btn.id = 'nav-hamburger';
  btn.setAttribute('aria-label', 'Toggle menu');
  btn.innerHTML = '<span></span><span></span><span></span>';

  const right = nav.querySelector<HTMLElement>('.nav-right');
  right ? right.prepend(btn) : nav.appendChild(btn);

  let open = false;
  btn.addEventListener('click', (): void => {
    open = !open;
    btn.classList.toggle('open', open);
    ul.classList.toggle('mobile-open', open);
  });

  ul.querySelectorAll<HTMLAnchorElement>('a').forEach(a =>
    a.addEventListener('click', (): void => {
      open = false;
      btn.classList.remove('open');
      ul.classList.remove('mobile-open');
    })
  );
}

/* ════════════════════════════════════════════════════════════
   NAV
   ════════════════════════════════════════════════════════════ */

function initNav(): void {
  const nav = $('nav');
  if (!nav) return;

  const links = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]');
  const sections = [...links].map(a => ({
    a,
    el: document.querySelector<HTMLElement>(a.getAttribute('href') ?? ''),
  })).filter((o): o is { a: HTMLAnchorElement; el: HTMLElement } => o.el !== null);

  const onScroll = (): void => {
    nav.classList.toggle('scrolled', scrollY > CFG.nav.scrollThreshold);
    let current = '';
    sections.forEach(({ el, a }) => {
      if (el.getBoundingClientRect().top <= 110)
        current = a.getAttribute('href') ?? '';
    });
    links.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === current)
    );
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ════════════════════════════════════════════════════════════
   CURSOR GLOW + MAGNETIC BUTTONS
   ════════════════════════════════════════════════════════════ */

function initCursorGlow(): void {
  const glow = $('cursor-glow');
  if (!glow || isMob()) return;

  let mx = innerWidth / 2, my = innerHeight / 2;
  let gx = mx, gy = my;
  let visible = false;

  document.addEventListener('mousemove', (e: MouseEvent): void => {
    mx = e.clientX; my = e.clientY;
    if (!visible) { glow.style.opacity = '1'; visible = true; }
  }, { passive: true });

  document.addEventListener('mouseleave', (): void => {
    glow.style.opacity = '0'; visible = false;
  });

  const tick = (): void => {
    gx = lerp(gx, mx, CFG.glow.lerp);
    gy = lerp(gy, my, CFG.glow.lerp);
    glow.style.transform = `translate(calc(${gx}px - 50%), calc(${gy}px - 50%))`;
    raf(tick);
  };
  raf(tick);

  // Magnetic pull on interactive elements
  document.querySelectorAll<HTMLElement>('.btn, .link-card').forEach(el => {
    el.addEventListener('mousemove', (e: MouseEvent): void => {
      const r  = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width  / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      el.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
    });
    el.addEventListener('mouseleave', (): void => {
      el.style.transform = '';
    });
  });
}

/* ════════════════════════════════════════════════════════════
   CARD TILT  (3D perspective on hover)
   ════════════════════════════════════════════════════════════ */

function initCardTilt(): void {
  if (isMob() || noMot()) return;

  document.querySelectorAll<HTMLElement>('.skill-card').forEach(card => {
    card.addEventListener('mousemove', (e: MouseEvent): void => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left)  / r.width  - 0.5;
      const y = (e.clientY - r.top)   / r.height - 0.5;
      card.style.transform  = `translateY(-4px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
      card.style.transition = 'none';
    });
    card.addEventListener('mouseleave', (): void => {
      card.style.transform  = '';
      card.style.transition = '';
    });
  });
}

/* ════════════════════════════════════════════════════════════
   PARTICLES  (fallback — wasm.js owns the canvas)
   ════════════════════════════════════════════════════════════ */

class Particle {
  x!: number; y!: number; r!: number; s!: number;
  o!: number; _o!: number; c!: string; dx!: number;
  phase!: number; freq!: number;

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
    if (this.y < -8)                         this.reset(false);
    if (this.x < -8 || this.x > this.W + 8) this.dx *= -1;
  }

  draw(cx: CanvasRenderingContext2D): void {
    cx.beginPath();
    cx.arc(this.x, this.y, this.r, 0, 6.2832);
    cx.fillStyle   = this.c;
    cx.globalAlpha = this._o;
    cx.fill();
  }
}

function initParticles(): void {
  const cv = $('bg-canvas') as HTMLCanvasElement | null;
  if (!cv) return;

  // wasm.js takes over if available — this is a pure JS fallback
  if ((window as any).__wasmParticlesActive) return;

  const cx  = cv.getContext('2d')!;
  let W = 0, H = 0, paused = false;

  const resize = (): void => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const count = isMob() ? Math.floor(CFG.particles.count * 0.45) : CFG.particles.count;
  const pts   = Array.from({ length: count }, () => new Particle(W, H, true));

  const loop = (t: number): void => {
    if (!paused) {
      cx.clearRect(0, 0, W, H);
      pts.forEach(p => { p.update(t * 0.001); p.draw(cx); });
      cx.globalAlpha = 1;
    }
    raf(loop);
  };
  raf(loop);

  document.addEventListener('visibilitychange', (): void => { paused = document.hidden; });
}

/* ════════════════════════════════════════════════════════════
   HERO TYPEWRITER
   ════════════════════════════════════════════════════════════ */

function initHeroTypewriter(): void {
  const el = $('hero-sub');
  if (!el) return;
  if (noMot()) { el.textContent = CFG.hero.phrases[0]; return; }

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
      if (ci === 0) {
        del = false;
        pi  = (pi + 1) % phrases.length;
        setTimeout(tick, pauseAfterDelete);
      } else setTimeout(tick, deleteSpeed);
    }
  };
  setTimeout(tick, startDelay);
}

/* ════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════════════════════════ */

function initScrollReveal(): void {
  const revealAll = (): void =>
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

  if (noMot()) { revealAll(); return; }

  const fallback = setTimeout(revealAll, 2000);

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px' });

  document.querySelectorAll<Element>('.reveal').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight + 50 && r.bottom > 0) {
      el.classList.add('visible');
    } else {
      io.observe(el);
    }
  });

  setTimeout((): void => {
    if (document.querySelector('.reveal.visible')) clearTimeout(fallback);
  }, 500);
}

/* ════════════════════════════════════════════════════════════
   COUNTERS
   ════════════════════════════════════════════════════════════ */

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
      const t = setInterval((): void => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.floor(cur) + suffix;
        if (cur >= target) clearInterval(t);
      }, interval);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll<HTMLElement>('[data-count]').forEach(el => io.observe(el));
}

/* ════════════════════════════════════════════════════════════
   DISCORD COPY + TOAST
   ════════════════════════════════════════════════════════════ */

let _toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
  const t = $('copy-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout((): void => t.classList.remove('show'), CFG.toast.duration);
}

function fallbackCopy(text: string): void {
  const ta = Object.assign(document.createElement('textarea'), {
    value: text,
    style: 'position:fixed;top:-999px;opacity:0',
  });
  document.body.append(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch (_) { /* silent */ }
  ta.remove();
}

(window as any).copyDiscord = (): void => {
  const text = 'lol066351';
  const btn  = $('discord-btn');
  const btxt = $('dbt');

  const done = (): void => {
    if (btxt) btxt.textContent = '✓ Copied!';
    btn?.classList.add('copied');
    showToast('lol066351 copied! 📋');
    setTimeout((): void => {
      if (btxt) btxt.textContent = 'Discord: lol066351';
      btn?.classList.remove('copied');
    }, CFG.toast.duration);
  };

  navigator.clipboard
    ? navigator.clipboard.writeText(text).then(done).catch((): void => { fallbackCopy(text); done(); })
    : (fallbackCopy(text), done());
};

/* ════════════════════════════════════════════════════════════
   TERMINAL
   ════════════════════════════════════════════════════════════ */

const TW_LINES: TerminalLine[] = [
  {
    raw: "local tween = CustomTween.new(part, {CFrame=goal}, 0.4, 'Quad')",
    hl:  '<span class="kw">local</span> tween = <span class="fn">CustomTween.new</span>(part, {CFrame=goal}, <span class="num">0.4</span>, <span class="str">\'Quad\'</span>)',
  },
  {
    raw: "RemoteBatcher:Fire('combat', {action='hit', target=id})",
    hl:  '<span class="op">RemoteBatcher</span>:<span class="fn">Fire</span>(<span class="str">\'combat\'</span>, {action=<span class="str">\'hit\'</span>, target=id})',
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
    raw: "local sig = Signal.new()  -- no BindableEvent overhead",
    hl:  '<span class="kw">local</span> sig = <span class="fn">Signal.new</span>()  <span class="cm">-- no BindableEvent overhead</span>',
  },
  {
    raw: "RunService.Heartbeat:Connect(onStep)  -- 0.3ms budget",
    hl:  '<span class="op">RunService</span>.Heartbeat:<span class="fn">Connect</span>(onStep)  <span class="cm">-- 0.3ms budget</span>',
  },
  {
    raw: "await import('./pkg/particle_engine.js')  -- Rust WASM",
    hl:  '<span class="kw">await</span> <span class="fn">import</span>(<span class="str">\'./pkg/particle_engine.js\'</span>)  <span class="cm">-- Rust WASM</span>',
  },
];

function initTerminal(): void {
  const body = $('tw-body');
  if (!body) return;

  const row = document.createElement('div');
  row.className = 'tw-line tw-active';
  const pr  = document.createElement('span'); pr.className  = 'tw-prompt'; pr.textContent = '>';
  const cd  = document.createElement('span'); cd.className  = 'tw-code';
  const cur = document.createElement('span'); cur.className = 'tw-block-cur';
  row.append(pr, cd, cur);
  body.appendChild(row);

  const { typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, maxHistory } = CFG.terminal;
  let li = 0, ci = 0, del = false;

  const step = (): void => {
    const entry = TW_LINES[li];
    const raw   = entry.raw;

    if (!del) {
      cd.textContent = raw.slice(0, ++ci);
      if (ci >= raw.length) { del = true; setTimeout(step, pauseAfterType); }
      else setTimeout(step, typeSpeed);
    } else {
      cd.textContent = raw.slice(0, --ci);
      if (ci <= 0) {
        del = false;
        const done = document.createElement('div');
        done.className = 'tw-line';
        done.innerHTML =
          `<span class="tw-prompt" style="color:var(--success)">✓</span>` +
          `<span class="tw-code">${entry.hl}</span>`;
        body.insertBefore(done, row);
        const hist = body.querySelectorAll('.tw-line:not(.tw-active)');
        if (hist.length > maxHistory) hist[0].remove();
        li = (li + 1) % TW_LINES.length;
        setTimeout(step, pauseAfterDelete);
      } else setTimeout(step, deleteSpeed);
    }
  };
  step();
}

/* ════════════════════════════════════════════════════════════
   BACK TO TOP
   ════════════════════════════════════════════════════════════ */

function initBackToTop(): void {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.innerHTML = '↑';
  btn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(btn);

  window.addEventListener('scroll', (): void =>
    btn.classList.toggle('show', scrollY > 500),
  { passive: true });

  btn.addEventListener('click', (): void =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
}

/* ════════════════════════════════════════════════════════════
   GPU HINTS
   ════════════════════════════════════════════════════════════ */

function hintGPU(): void {
  document.querySelectorAll<HTMLElement>('.skill-card, .link-card, .tw-terminal')
    .forEach(el => { el.style.willChange = 'transform'; });
}

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */

function init(): void {
  const yr = $('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  // Inject active nav style
  const s = document.createElement('style');
  s.textContent = `.nav-links a.active{color:var(--text)}.nav-links a.active::after{width:100%}`;
  document.head.appendChild(s);

  initScrollProgress();
  initWelcome();
  initMobileMenu();
  initNav();
  initCursorGlow();
  initCardTilt();

  if (noMot()) {
    const cv = $('bg-canvas') as HTMLCanvasElement | null;
    if (cv) cv.style.display = 'none';
  } else {
    initParticles();   // no-op if wasm.js already claimed the canvas
  }

  initHeroTypewriter();
  initScrollReveal();
  initCounters();
  initTerminal();
  initBackToTop();
  hintGPU();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();

/* ════════════════════════════════════════════════════════════
   SERVICE WORKER
   ════════════════════════════════════════════════════════════ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', (): void => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg: ServiceWorkerRegistration): void => {
        reg.addEventListener('updatefound', (): void => {
          const sw = reg.installing;
          sw?.addEventListener('statechange', (): void => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((err: Error): void => console.warn('[SW] failed:', err));
  });
}
