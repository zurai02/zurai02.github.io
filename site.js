(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const nav = $('#site-nav');
  const menuToggle = $('#menu-toggle');
  if (nav && menuToggle) {
    const closeMenu = () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    };
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    $$('a', nav).forEach((link) => link.addEventListener('click', closeMenu));

    if ('IntersectionObserver' in window) {
      const links = $$('a[href^="#"]', nav);
      const sections = links.map((link) => $(link.getAttribute('href'))).filter(Boolean);
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      sections.forEach((section) => observer.observe(section));
    }
  }

  const toast = $('#copy-toast');
  let toastTimer;
  $('#copy-discord')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const value = button.dataset.copy || '';
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch { /* clipboard may be unavailable outside a secure context */ }

    if (toast) {
      toast.textContent = copied ? 'Discord copied' : `Discord: ${value}`;
      toast.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
    }
  });

  const canMagnet = matchMedia('(hover: hover) and (pointer: fine)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canMagnet) {
    $$('.magnetic').forEach((element) => {
      let frame = 0;
      element.addEventListener('pointermove', (event) => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
          const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
          element.style.setProperty('--magnet-x', `${x * 6}px`);
          element.style.setProperty('--magnet-y', `${y * 5}px`);
        });
      });
      element.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame);
        element.style.setProperty('--magnet-x', '0px');
        element.style.setProperty('--magnet-y', '0px');
      });
    });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), { once: true });
  }
})();
