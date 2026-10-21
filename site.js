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
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const phrase = speeches[phraseIndex];
    const delay = deleting ? 24 + Math.random() * 18 : 42 + Math.random() * 24;

    if (!deleting) {
      charIndex++;
      el.innerHTML = phrase.slice(0, charIndex) + '<span class="tw-cur"></span>';
      if (charIndex >= phrase.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      el.innerHTML = phrase.slice(0, charIndex) + '<span class="tw-cur"></span>';
      if (charIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % speeches.length;
        setTimeout(tick, 220);
        return;
      }
    }

    setTimeout(tick, delay);
  };

  setTimeout(tick, 900);
}
