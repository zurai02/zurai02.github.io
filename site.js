'use strict';

const CFG = {
  glow: { lerp: 0.08 },
  hero: {
    phrases: [
      'Roblox Scripting & Engine Optimization Specialist.',
      'Building custom Luau modules that bypass engine limits.',
      'Pushing client-side performance to the absolute limit.',
      'Zero wasted frames. Lightweight networks. Fast code.',
      'WebAssembly-powered tools. Native-speed results.'
    ],
    typeSpeed: 34,
    deleteSpeed: 14,
    pauseAfterType: 2600,
    pauseAfterDelete: 280,
    startDelay: 900
  },
  terminal: {
    typeSpeed: 38,
    deleteSpeed: 16,
    pauseAfterType: 2800,
    pauseAfterDelete: 360,
    maxHistory: 9
  },
  counter: { steps: 52, interval: 24 },
  toast: { duration: 2400 },
  nav: { scrollThreshold: 24 }
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

const clamp = (v, l, h) => Math.min(Math.max(v, l), h);
const lerp = (a, b, t) => a + (b - a) * t;
const isMob = () => window.innerWidth < 640;
const noMot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const raf = (fn) => requestAnimationFrame(fn);

function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .nav-links a.active { color: var(--text, #fff); }
    .nav-links a.active::after { width: 100%; }
  `;
  document.head.appendChild(s);
}

function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-bar';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const pct = (scrollY / (document.body.scrollHeight - innerHeight)) * 100;
    bar.style.width = clamp(pct, 0, 100) + '%';
  }, { passive: true });
}

function initWelcome() {
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Up late?' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

  const el = $('greeting');
  if (el) el.textContent = greet;

  const visits = parseInt(localStorage.getItem('zurai02_visits') || '0', 10) + 1;
  localStorage.setItem('zurai02_visits', String(visits));

  const first = !localStorage.getItem('zurai02_welcomed');
  if (first) {
    localStorage.setItem('zurai02_welcomed', '1');
  } else if (visits > 1) {
    setTimeout(() => showToast(`Welcome back! Visit #${visits} 🔥`), 1200);
  }
}

function initMobileMenu() {
  const nav = DOM.nav;
  if (!nav) return;

  const ul = nav.querySelector('.nav-links');
  if (!ul) return;

  let btn = nav.querySelector('.nav-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    (nav.querySelector('.nav-right') || nav).appendChild(btn);
  }

  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    ul.classList.toggle('mobile-open', open);
  });

  ul.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      open = false;
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      ul.classList.remove('mobile-open');
    });
  });
}

function initNav() {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...links].map((a) => ({
    a,
    el: document.querySelector(a.getAttribute('href'))
  })).filter((o) => o.el);

  const onScroll = () => {
    DOM.nav?.classList.toggle('scrolled', scrollY > CFG.nav.scrollThreshold);
    let cur = '';
    sections.forEach(({ el, a }) => {
      if (el.getBoundingClientRect().top <= 110) cur = a.getAttribute('href');
    });
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === cur));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initCursorGlow() {
  if (isMob() || !DOM.glow) return;

  const starLayer = document.getElementById('cursor-star-layer');
  if (!starLayer) return;

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
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

    const life = 0.6 + Math.random() * 0.8;
    stars.push({
      el: s,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      alpha: 1,
      life,
      maxLife: life,
      scale: 0.5 + Math.random() * 1.3
    });
  }

  function spawnBurst(x, y) {
    for (let i = 0; i < 12; i++) {
      spawnStar(
        x + (Math.random() - 0.5) * 18,
        y + (Math.random() - 0.5) * 18
      );
    }
  }

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    if (!vis) {
      DOM.glow.style.opacity = '1';
      vis = true;
    }

    if (Math.random() < 0.28) {
      spawnStar(mx, my);
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    DOM.glow.style.opacity = '0';
    vis = false;
  });

  document.addEventListener('pointerdown', (e) => {
    spawnBurst(e.clientX, e.clientY);
  });

  const tick = () => {
    gx = gx + (mx - gx) * 0.08;
    gy = gy + (my - gy) * 0.08;

    DOM.glow.style.transform = `translate(${gx - 230}px, ${gy - 230}px)`;

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

  document.querySelectorAll('.btn, .link-card').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

function initCardTilt() {
  if (isMob() || noMot()) return;
  document.querySelectorAll('.skill-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-4px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
      card.style.transition = 'none';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
}

function initHeroTypewriter() {
  const el = DOM.heroSub;
  if (!el) return;
  if (noMot()) {
    el.textContent = 'Roblox Scripting & Engine Optimization Specialist.';
    return;
  }

  const { phrases, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete, startDelay } = CFG.hero;
  let pi = 0;
  let ci = 0;
  let del = false;

  const tick = () => {
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

function initScrollReveal() {
  const all = () => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  if (noMot()) {
    all();
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px' });

  document.querySelectorAll('.reveal').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight + 50 && r.bottom > 0) el.classList.add('visible');
    else io.observe(el);
  });
}

function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count || 0);
    let value = 0;
    const step = target / 52;

    const timer = setInterval(() => {
      value*
