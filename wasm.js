/**
 * wasm.js — Loads engine.wasm and drives the bg-canvas particle system.
 *
 * Drop this in your repo root. It is loaded by site.js (or directly in index.html).
 * The WASM engine handles ALL particle math — position integration, wrapping,
 * connection distance — at near-native speed so the JS thread stays free.
 *
 * Usage (in site.js):
 *   import { initParticles } from "./wasm.js";
 *   initParticles(document.getElementById("bg-canvas"));
 *
 * Or as a plain script (no module bundler needed):
 *   <script src="wasm.js" defer></script>
 *   // then: WasmEngine.initParticles(canvas)
 */

const WasmEngine = (() => {

  // ── Config ──────────────────────────────────────────────────────────────────
  const PARTICLE_COUNT = 80;
  const CONNECT_DIST   = 140;      // px — connection line threshold
  const SPEED_MIN      = 0.15;
  const SPEED_MAX      = 0.55;
  const SIZE_MIN       = 1.5;
  const SIZE_MAX       = 3.5;
  const COLOR          = "255,107,53";  // #ff6b35 — matches theme-color

  let wasm    = null;   // compiled WASM instance
  let running = false;
  let rafId   = null;

  // ── Load WASM ───────────────────────────────────────────────────────────────

  async function loadWasm() {
    try {
      const result = await WebAssembly.instantiateStreaming(fetch("engine.wasm"));
      wasm = result.instance.exports;
      console.log("[wasm] engine.wasm loaded — particle engine running natively.");
    } catch (err) {
      // Fallback: streaming failed (e.g. wrong MIME), try ArrayBuffer
      try {
        const buf = await fetch("engine.wasm").then(r => r.arrayBuffer());
        const result = await WebAssembly.instantiate(buf);
        wasm = result.instance.exports;
        console.log("[wasm] engine.wasm loaded (fallback path).");
      } catch (err2) {
        console.warn("[wasm] engine.wasm unavailable — run 'npm run build:wasm' first.", err2);
        wasm = null;
      }
    }
  }

  // ── Random helpers ──────────────────────────────────────────────────────────

  function rand(min, max) { return min + Math.random() * (max - min); }

  function randSign() { return Math.random() < 0.5 ? 1 : -1; }

  // ── JS fallback particle system ─────────────────────────────────────────────
  // Used automatically when WASM isn't available (e.g. first load before build).

  class JSParticle {
    constructor(w, h) { this.reset(w, h, true); }
    reset(w, h, init = false) {
      this.x     = init ? rand(0, w) : Math.random() < 0.5 ? 0 : w;
      this.y     = rand(0, h);
      this.vx    = randSign() * rand(SPEED_MIN, SPEED_MAX);
      this.vy    = randSign() * rand(SPEED_MIN, SPEED_MAX);
      this.alpha = rand(0.3, 0.9);
      this.size  = rand(SIZE_MIN, SIZE_MAX);
    }
  }

  // ── Canvas setup ────────────────────────────────────────────────────────────

  function resize(canvas) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // ── WASM particle init ───────────────────────────────────────────────────────

  function initWasmParticles(w, h) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      wasm.set_particle(
        i,
        rand(0, w),                                  // x
        rand(0, h),                                  // y
        randSign() * rand(SPEED_MIN, SPEED_MAX),     // vx
        randSign() * rand(SPEED_MIN, SPEED_MAX),     // vy
        rand(0.3, 0.9),                              // alpha
        rand(SIZE_MIN, SIZE_MAX),                    // size
      );
    }
  }

  // ── Draw frame ──────────────────────────────────────────────────────────────

  function drawWasm(ctx, w, h, dt) {
    wasm.update_particles(PARTICLE_COUNT, w, h, dt * 60); // normalise to ~60fps

    ctx.clearRect(0, 0, w, h);

    // Draw connection lines
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const alpha = wasm.connection_alpha(i, j, CONNECT_DIST);
        if (alpha <= 0) continue;
        ctx.beginPath();
        ctx.moveTo(wasm.get_x(i), wasm.get_y(i));
        ctx.lineTo(wasm.get_x(j), wasm.get_y(j));
        ctx.strokeStyle = `rgba(${COLOR},${(alpha * 0.35).toFixed(3)})`;
        ctx.lineWidth   = 0.75;
        ctx.stroke();
      }
    }

    // Draw particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x  = wasm.get_x(i);
      const y  = wasm.get_y(i);
      const al = wasm.get_alpha(i);
      const sz = wasm.get_size(i);
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLOR},${al.toFixed(3)})`;
      ctx.fill();
    }
  }

  function drawJS(ctx, particles, w, h, dt) {
    const move = dt * 60;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * move;
      p.y += p.vy * move;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx    = particles[i].x - particles[j].x;
        const dy    = particles[i].y - particles[j].y;
        const dsq   = dx * dx + dy * dy;
        const tsq   = CONNECT_DIST * CONNECT_DIST;
        if (dsq >= tsq) continue;
        const alpha = (1 - dsq / tsq) * 0.35;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(${COLOR},${alpha.toFixed(3)})`;
        ctx.lineWidth   = 0.75;
        ctx.stroke();
      }
    }

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLOR},${p.alpha})`;
      ctx.fill();
    }
  }

  // ── Public: initParticles ────────────────────────────────────────────────────

  async function initParticles(canvas) {
    if (!canvas) return;
    if (running) return;
    running = true;

    const ctx = canvas.getContext("2d");
    resize(canvas);
    window.addEventListener("resize", () => resize(canvas));

    await loadWasm();

    let particles = null;
    let w = canvas.width, h = canvas.height;
    let last = performance.now();

    if (wasm) {
      initWasmParticles(w, h);
    } else {
      particles = Array.from({ length: PARTICLE_COUNT }, () => new JSParticle(w, h));
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);  // cap at 50ms
      last = now;

      w = canvas.width;
      h = canvas.height;

      if (wasm) {
        drawWasm(ctx, w, h, dt);
      } else {
        drawJS(ctx, particles, w, h, dt);
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    running = false;
    rafId   = null;
  }

  return { initParticles, stop };

})();

// Auto-init if bg-canvas exists
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("bg-canvas");
  if (canvas) WasmEngine.initParticles(canvas);
});
