'use strict';

const CFG = {
  glow: { lerp: 0.08 },
  hero: {
    phrases: [
      'Building fast, resilient Roblox systems with less overlap and more control.',
      'Designing Luau modules that cut latency and keep client-side performance sharp.',
      'Shipping custom tooling, systems architecture, and engine-aware optimization.',
      'Turning difficult game logic into clean, scalable, high-performance code.',
      'Optimizing Roblox experiences by squeezing every frame and every byte.'
    ],
    typeSpeed: 34,
    deleteSpeed: 14,
    pauseAfterType: 2600,
    pauseAfterDelete: 280,
    startDelay: 900
  }
};

const $ = (id) => document.getElementById(id);

const DOM = {
  nav: $('nav'),
  glow: $('cursor-glow'),
  heroSub: $('hero-sub'),
  twBody: $('tw-body'),
  toast: $('copy-toast'),
  year: $('yr')
};

const isMob = () => window.innerWidth < 640;
const noMot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initHeroTypewriter() {
  const el = DOM.heroSub;
  if (!el) return;

  const speeches = [
    'Building fast, resilient Roblox systems with less overlap and more control.',
    'Designing Luau modules that cut latency and keep client-side performance sharp.',
    'Shipping custom tooling, systems architecture, and engine-aware optimization.',
    'Turning difficult game logic into clean, scalable, high-performance code.',
    'Optimizing Roblox experiences by squeezing every frame and every byte.'
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    el.textContent = speeches[0];
    return;
  }

  let phraseIndex = 0;
  let visibleText = '';
  let deleting = false;

  const tick = () => {
    const phrase = speeches[phraseIndex];
    const delay = deleting ? 18 + Math.random() * 16 : 32 + Math.random() * 18;

    if (!deleting) {
      visibleText = phrase.slice(0, visibleText.length + 1);
    } else {
      visibleText = phrase.slice(0, Math.max(0, visibleText.length - 1));
    }

    el.innerHTML = visibleText + '<span class="tw-cur"></span>';

    if (!deleting && visibleText.length === phrase.length) {
      deleting = true;
      setTimeout(tick, 1400);
      return;
    }

    if (deleting && visibleText.length === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % speeches.length;
      setTimeout(tick, 220);
      return;
    }

    setTimeout(tick, delay);
  };

  setTimeout(tick, 850);
}

function initCursorGlow() {
  if (isMob() || !DOM.glow) return;

  const starLayer = document.getElementById('cursor-star-layer');
  if (!starLayer) return;

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let gx = mx;
  let gy = my;
  let vis = false;
  const stars = [];

  function spawnStar(x, y) {
    const s = document.createElement('span');
    s.className = 'cursor-star';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    starLayer.appendChild(s);

    const size = 4 + Math.random() * 7;
    s.style.width = size + 'px';
    s.style.height = size + 'px';

    const life = 0.7 + Math.random() * 0.9;
    stars.push({
      el: s,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.9,
      vy: (Math.random() - 0.5) * 0.9,
      alpha: 1,
      life,
      maxLife: life,
      scale: 0.7 + Math.random() * 1.3
    });
  }

  function spawnBurst(x, y) {
    for (let i = 0; i < 16; i++) {
      spawnStar(
        x + (Math.random() - 0.5) * 18,
        y + (Math.random() - 0.5) * 18
      );
    }
  }

  document.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    if (!vis) {
      DOM.glow.style.opacity = '1';
      vis = true;
    }

    if (Math.random() < 0.32) {
      spawnStar(mx, my);
    }
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    DOM.glow.style.opacity = '0';
    vis = false;
  });

  document.addEventListener('pointerdown', (e) => {
    spawnBurst(e.clientX, e.clientY);
  });

  const tick = () => {
    gx += (mx - gx) * 0.08;
    gy += (my - gy) * 0.08;

    DOM.glow.style.transform = `translate(${gx - 210}px, ${gy - 210}px)`;

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha = Math.max(0, s.life / s.maxLife);
      s.el.style.opacity = String(s.alpha);
      s.el.style.transform = `translate(${s.x - 4}px, ${s.y - 4}px) scale(${(0.3 + s.alpha) * s.scale})`;
      s.life -= 0.025;

      if (s.life <= 0) {
        s.el.remove();
        stars.splice(i, 1);
      }
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function init() {
  if (DOM.year) DOM.year.textContent = new Date().getFullYear();

  initHeroTypewriter();
  initCursorGlow();
}

document.addEventListener('DOMContentLoaded', init);
