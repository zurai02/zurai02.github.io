/**
 * site.js — zurai02.github.io  (enhanced)
 * NOTE: Particle canvas is handled by wasm.js — initParticles removed.
 */
'use strict';

/* ═══ 1. CONFIG ═══════════════════════════════════════════════════════════ */
const CFG = {
  glow:   { lerp: 0.07 },
  hero: {
    phrases: [
      'Roblox Scripting & Engine Optimization Specialist.',
      'Building custom Luau modules that bypass engine limits.',
      'Pushing client-side performance to the absolute limit.',
      'Zero wasted frames. Lightweight networks. Fast code.',
      'WebAssembly-powered tools. Native-speed results.',
    ],
    typeSpeed: 34, deleteSpeed: 14,
    pauseAfterType: 2600, pauseAfterDelete: 280, startDelay: 900,
  },
  terminal: {
    typeSpeed: 38, deleteSpeed: 16,
    pauseAfterType: 2800, pauseAfterDelete: 360, maxHistory: 9,
  },
  counter:  { steps: 52, interval: 24 },
  toast:    { duration: 2400 },
  nav:      { scrollThreshold: 24 },
};

/* ═══ 2. DOM CACHE ════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const DOM = {
  nav:        $('nav'),
  glow:       $('cursor-glow'),
  canvas:     $('bg-canvas'),
  heroSub:    $('hero-sub'),
  twBody:     $('tw-body'),
  toast:      $('copy-toast'),
  discordBtn: $('discord-btn'),
  discordTxt: $('dbt'),
  year:       $('yr'),
};

/* ═══ 3. UTILITIES ════════════════════════════════════════════════════════ */
const rand    = (a, b)    => Math.random() * (b - a) + a;
const clamp   = (v, l, h) => Math.min(Math.max(v, l), h);
const lerp    = (a, b, t) => a + (b - a) * t;
const isMob   = ()        => window.innerWidth < 640;
const noMot   = ()        => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raf     = fn        => requestAnimationFrame(fn);

/* ═══ 4. SCROLL PROGRESS BAR ═════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-bar';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = scrollY / (document.body.scrollHeight - innerHeight) * 100;
    bar.style.width = clamp(pct, 0, 100) + '%';
  }, { passive: true });
}

/* ═══ 5. WELCOME SYSTEM ══════════════════════════════════════════════════ */
function initWelcome() {
  const hour = new Date().getHours();
  const greet =
    hour < 5  ? 'Up late?' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    hour < 21 ? 'Good evening' : 'Good night';

  const el = document.getElementById('greeting');
  if (el) el.textContent = greet;

  const visits = parseInt(localStorage.getItem('zurai02_visits') || '0', 10) + 1;
  localStorage.setItem('zurai02_visits', String(visits));

  const first = !localStorage.getItem('zurai02_welcomed');
  if (first) { localStorage.setItem('zurai02_welcomed', '1'); _showOverlay(greet); }
  else if (visits > 1) setTimeout(() => showToast(`Welcome back! Visit #${visits} 🔥`), 1200);
}

function _showOverlay(greet) {
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
    #welcome-overlay {
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(7,9,14,.97);backdrop-filter:blur(24px);
      animation:wo-in .4s ease both;
    }
    @keyframes wo-in{from{opacity:0}to{opacity:1}}
    @keyframes wo-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.97)}}
    #welcome-card{
      text-align:center;max-width:380px;padding:0 2rem;
      animation:wc-in .6s cubic-bezier(.22,1,.36,1) .1s both;
    }
    @keyframes wc-in{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
    #welcome-logo{
      font-family:'JetBrains Mono',monospace;font-size:1.4rem;
      font-weight:700;color:#ff6b35;margin-bottom:1.2rem;letter-spacing:-.02em;
    }
    #welcome-logo span{color:#4a5568;animation:blink-c 1.1s step-end infinite;}
    #welcome-greeting{
      font-size:clamp(2.2rem,7vw,3.8rem);font-weight:900;
      letter-spacing:-.04em;color:#eaf1fa;margin-bottom:.4rem;
    }
    #welcome-sub{font-size:.82rem;color:#6e7e94;margin-bottom:1.5rem;}
    #welcome-tags{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:2rem;}
    #welcome-tags span{
      background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.2);
      color:#ff9560;padding:.2rem .7rem;border-radius:20px;
      font-size:.7rem;font-family:'JetBrains Mono',monospace;
    }
    #welcome-enter{
      background:#ff6b35;color:#fff;border:none;border-radius:10px;
      padding:.75rem 2.2rem;font-size:.9rem;font-weight:700;
      font-family:inherit;cursor:pointer;letter-spacing:.02em;
      transition:all .18s;display:inline-flex;align-items:center;gap:.5rem;
    }
    #welcome-enter span{transition:transform .18s;}
    #welcome-enter:hover{background:#ff9560;transform:translateY(-2px);box-shadow:0 12px 36px rgba(255,107,53,.45);}
    #welcome-enter:hover span{transform:translateX(3px);}`;
  document.head.appendChild(s);

  const dismiss = () => {
    ov.style.animation = 'wo-out .35s ease forwards';
    setTimeout(() => ov.remove(), 380);
  };
  $('welcome-enter').addEventListener('click', dismiss);
  document.addEventListener('keydown', dismiss, { once: true });
}

/* ═══ 6. HAMBURGER MOBILE MENU ══════════════════════════════════════════ */
function initMobileMenu() {
  const nav  = DOM.nav;
  const ul   = nav.querySelector('.nav-links');
  if (!ul) return;

  const btn  = document.createElement('button');
  btn.id     = 'nav-hamburger';
  btn.setAttribute('aria-label', 'Toggle menu');
  btn.innerHTML = `<span></span><span></span><span></span>`;
  nav.querySelector('.nav-right')?.prepend(btn) || nav.appendChild(btn);

  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    btn.classList.toggle('open', open);
    ul.classList.toggle('mobile-open', open);
  });
  // close on link click
  ul.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      open = false; btn.classList.remove('open'); ul.classList.remove('mobile-open');
    }));
}

/* ═══ 7. NAV ═════════════════════════════════════════════════════════════ */
function initNav() {
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...links].map(a => ({
    a, el: document.querySelector(a.getAttribute('href'))
  })).filter(o => o.el);

  const onScroll = () => {
    DOM.nav.classList.toggle('scrolled', scrollY > CFG.nav.scrollThreshold);
    let cur = '';
    sections.forEach(({ el, a }) => {
      if (el.getBoundingClientRect().top <= 110) cur = a.getAttribute('href');
    });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === cur));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ═══ 8. CURSOR GLOW + MAGNETIC BUTTONS ═════════════════════════════════ */
function initCursorGlow() {
  if (isMob() || !DOM.glow) return;
  let mx = innerWidth/2, my = innerHeight/2, gx = mx, gy = my, vis = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!vis) { DOM.glow.style.opacity = '1'; vis = true; }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { DOM.glow.style.opacity = '0'; vis = false; });

  const tick = () => {
    gx = lerp(gx, mx, CFG.glow.lerp);
    gy = lerp(gy, my, CFG.glow.lerp);
    DOM.glow.style.transform = `translate(calc(${gx}px - 50%),calc(${gy}px - 50%))`;
    raf(tick);
  };
  raf(tick);

  // Magnetic pull on buttons
  document.querySelectorAll('.btn, .link-card').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2);
      const dy = e.clientY - (r.top  + r.height/2);
      el.style.transform = `translate(${dx*0.12}px,${dy*0.12}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ═══ 9. CARD TILT ═══════════════════════════════════════════════════════ */
function initCardTilt() {
  if (isMob() || noMot()) return;
  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-4px) rotateX(${-y*8}deg) rotateY(${x*8}deg)`;
      card.style.transition = 'none';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
}

/* ═══ 10. HERO TYPEWRITER ════════════════════════════════════════════════ */
function initHeroTypewriter() {
  const el = DOM.heroSub;
  if (!el) return;
  if (noMot()) { el.textContent = CFG.hero.phrases[0]; return; }
  const { phrases, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, startDelay } = CFG.hero;
  let pi = 0, ci = 0, del = false;
  const tick = () => {
    const ph = phrases[pi];
    if (!del) {
      el.innerHTML = ph.slice(0,++ci) + '<span class="tw-cur"></span>';
      if (ci === ph.length) { del = true; setTimeout(tick, pauseAfterType); }
      else setTimeout(tick, typeSpeed);
    } else {
      el.innerHTML = ph.slice(0,--ci) + '<span class="tw-cur"></span>';
      if (ci === 0) { del = false; pi = (pi+1) % phrases.length; setTimeout(tick, pauseAfterDelete); }
      else setTimeout(tick, deleteSpeed);
    }
  };
  setTimeout(tick, startDelay);
}

/* ═══ 11. SCROLL REVEAL ══════════════════════════════════════════════════ */
function initScrollReveal() {
  const all = () => document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  if (noMot()) { all(); return; }
  const fb = setTimeout(all, 2000);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }});
  }, { threshold: 0, rootMargin: '0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight + 50 && r.bottom > 0) el.classList.add('visible');
    else io.observe(el);
  });
  setTimeout(() => { if (document.querySelector('.reveal.visible')) clearTimeout(fb); }, 500);
}

/* ═══ 12. COUNTERS ═══════════════════════════════════════════════════════ */
function initCounters() {
  const { steps, interval } = CFG.counter;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
      let cur = 0; const step = target / steps;
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

/* ═══ 13. DISCORD COPY ═══════════════════════════════════════════════════ */
let _tTimer = null;
function showToast(msg) {
  const t = DOM.toast; if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tTimer);
  _tTimer = setTimeout(() => t.classList.remove('show'), CFG.toast.duration);
}
function fallbackCopy(txt) {
  const ta = Object.assign(document.createElement('textarea'),
    { value: txt, style: 'position:fixed;top:-999px;opacity:0' });
  document.body.append(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(_) {}
  ta.remove();
}
window.copyDiscord = function() {
  const text = 'lol066351';
  const done = () => {
    if (DOM.discordTxt) DOM.discordTxt.textContent = '✓ Copied!';
    DOM.discordBtn?.classList.add('copied');
    showToast('lol066351 copied! 📋');
    setTimeout(() => {
      if (DOM.discordTxt) DOM.discordTxt.textContent = 'Discord: lol066351';
      DOM.discordBtn?.classList.remove('copied');
    }, CFG.toast.duration);
  };
  navigator.clipboard ? navigator.clipboard.writeText(text).then(done).catch(()=>{fallbackCopy(text);done();})
                      : (fallbackCopy(text), done());
};

/* ═══ 14. TERMINAL ═══════════════════════════════════════════════════════ */
const TW_LINES = [
  { raw:"local tween = CustomTween.new(part, {CFrame=goal}, 0.4, 'Quad')",
    hl: '<span class="kw">local</span> tween = <span class="fn">CustomTween.new</span>(part, {CFrame=goal}, <span class="num">0.4</span>, <span class="str">\'Quad\'</span>)' },
  { raw:"RemoteBatcher:Fire('combat', {action='hit', target=id})",
    hl: '<span class="op">RemoteBatcher</span>:<span class="fn">Fire</span>(<span class="str">\'combat\'</span>, {action=<span class="str">\'hit\'</span>, target=id})' },
  { raw:"Profiler:Mark('RenderStep')  -- 0.8ms avg",
    hl: '<span class="op">Profiler</span>:<span class="fn">Mark</span>(<span class="str">\'RenderStep\'</span>)  <span class="cm">-- 0.8ms avg</span>' },
  { raw:"local pool = ObjectPool.new('Projectile', 64)",
    hl: '<span class="kw">local</span> pool = <span class="fn">ObjectPool.new</span>(<span class="str">\'Projectile\'</span>, <span class="num">64</span>)' },
  { raw:"StreamingEnabled = true  -- smart LOD active",
    hl: '<span class="op">StreamingEnabled</span> = <span class="kw">true</span>  <span class="cm">-- smart LOD active</span>' },
  { raw:"print('MemoryUsage:', Stats:GetTotalMemoryUsageMb(), 'MB')",
    hl: '<span class="fn">print</span>(<span class="str">\'MemoryUsage:\'</span>, Stats:<span class="fn">GetTotalMemoryUsageMb</span>(), <span class="str">\'MB\'</span>)' },
  { raw:"local sig = Signal.new()  -- no BindableEvent overhead",
    hl: '<span class="kw">local</span> sig = <span class="fn">Signal.new</span>()  <span class="cm">-- no BindableEvent overhead</span>' },
  { raw:"RunService.Heartbeat:Connect(onStep)  -- 0.3ms budget",
    hl: '<span class="op">RunService</span>.Heartbeat:<span class="fn">Connect</span>(onStep)  <span class="cm">-- 0.3ms budget</span>' },
  { raw:"local wasm = await import('./pkg/particle_engine.js')",
    hl: '<span class="kw">local</span> wasm = <span class="kw">await</span> <span class="fn">import</span>(<span class="str">\'./pkg/particle_engine.js\'</span>)  <span class="cm">-- Rust WASM</span>' },
];

function initTerminal() {
  const body = DOM.twBody; if (!body) return;
  const row = document.createElement('div');
  row.className = 'tw-line tw-active';
  const pr = document.createElement('span'); pr.className = 'tw-prompt'; pr.textContent = '>';
  const cd = document.createElement('span'); cd.className = 'tw-code';
  const cr = document.createElement('span'); cr.className = 'tw-block-cur';
  row.append(pr, cd, cr); body.appendChild(row);

  const { typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, maxHistory } = CFG.terminal;
  let li = 0, ci = 0, del = false;
  const step = () => {
    const entry = TW_LINES[li], raw = entry.raw;
    if (!del) {
      cd.textContent = raw.slice(0,++ci);
      if (ci >= raw.length) { del = true; setTimeout(step, pauseAfterType); }
      else setTimeout(step, typeSpeed);
    } else {
      cd.textContent = raw.slice(0,--ci);
      if (ci <= 0) {
        del = false;
        const done = document.createElement('div');
        done.className = 'tw-line';
        done.innerHTML = `<span class="tw-prompt" style="color:var(--success)">✓</span><span class="tw-code">${entry.hl}</span>`;
        body.insertBefore(done, row);
        const hist = body.querySelectorAll('.tw-line:not(.tw-active)');
        if (hist.length > maxHistory) hist[0].remove();
        li = (li+1) % TW_LINES.length;
        setTimeout(step, pauseAfterDelete);
      } else setTimeout(step, deleteSpeed);
    }
  };
  step();
}

/* ═══ 15. BACK TO TOP ════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top'; btn.innerHTML = '↑'; btn.setAttribute('aria-label','Back to top');
  document.body.appendChild(btn);
  window.addEventListener('scroll', () =>
    btn.classList.toggle('show', scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ═══ 16. GPU HINTS ══════════════════════════════════════════════════════ */
function hintGPU() {
  document.querySelectorAll('.skill-card,.link-card,.tw-terminal')
    .forEach(el => el.style.willChange = 'transform');
}

/* ═══ 17. INIT ═══════════════════════════════════════════════════════════ */
function init() {
  if (DOM.year) DOM.year.textContent = new Date().getFullYear();

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

/* ── Service Worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller)
              sw.postMessage('SKIP_WAITING');
          });
        });
      }).catch(e => console.warn('[SW] failed:', e));
  });
}
