/**
 * site.ts — zurai02.is-a.dev  (enhanced)
 * Compile: npx tsc --project tsconfig.json
 * NOTE: Particle canvas is owned by wasm.js — initParticles() kept as fallback only.
 * Also drives 404.html (body.page-404) via initNotFound().
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

interface NotFoundConfig {
  user:            string;
  redirectTimeout: number;
}

interface SiteConfig {
  particles: ParticleConfig;
  glow:      { lerp: number };
  hero:      HeroConfig;
  terminal:  TerminalConfig;
  counter:   CounterConfig;
  toast:     { duration: number };
  nav:       { scrollThreshold: number };
  notFound:  NotFoundConfig;
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
