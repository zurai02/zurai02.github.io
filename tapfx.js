/**
 * tapfx.js — Tap/click burst particles for zurai02.github.io
 * Add to index.html: <script src="tapfx.js" defer></script>
 */

(() => {
  const CANVAS_ID    = "bg-canvas";
  const COLOR        = [255, 107, 53];   // #ff6b35
  const BURST_COUNT  = 18;               // particles per tap
  const SPEED        = 4.5;
  const SIZE_MAX     = 4.5;
  const LIFE         = 0.7;              // seconds until fully faded
  const TRAIL        = 0.92;             // motion blur trail (lower = longer)

  let canvas, ctx;
  const bursts = [];   // active tap particles

  // ── Particle ───────────────────────────────────────────────────────────────
  class TapParticle {
    constructor(x, y) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * SPEED + 1;
      this.x     = x;
      this.y     = y;
      this.vx    = Math.cos(angle) * speed;
      this.vy    = Math.sin(angle) * speed;
      this.size  = Math.random() * SIZE_MAX + 1.5;
      this.life  = 1.0;   // 1 = full, 0 = dead
      this.decay = (Math.random() * 0.5 + 0.7) / (LIFE * 60);
    }

    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.vx   *= 0.92;   // drag
      this.vy   *= 0.92;
      this.vy   += 0.08;   // gravity
      this.life -= this.decay;
      this.size *= 0.97;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  // ── Spawn burst ────────────────────────────────────────────────────────────
  function spawnBurst(x, y) {
    for (let i = 0; i < BURST_COUNT; i++) {
      bursts.push(new TapParticle(x, y));
    }
    // Ring flash
    bursts.push({ ring: true, x, y, r: 2, life: 1.0 });
  }

  // ── Draw ring flash ────────────────────────────────────────────────────────
  function drawRing(ctx, p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},${(p.life * 0.8).toFixed(3)})`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    p.r    += 3.5;
    p.life -= 0.07;
  }

  // ── Animation loop ─────────────────────────────────────────────────────────
  let lastTime = performance.now();

  function loop(now) {
    requestAnimationFrame(loop);
    if (!bursts.length) return;

    // Only clear/redraw the tap layer if there are active particles.
    // We draw on top of the existing bg-canvas (bg particles are drawn first by wasm.js).
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      if (p.ring) {
        drawRing(ctx, p);
        if (p.life <= 0) bursts.splice(i, 1);
      } else {
        p.update();
        p.draw(ctx);
        if (p.life <= 0) bursts.splice(i, 1);
      }
    }
  }

  // ── Setup ──────────────────────────────────────────────────────────────────
  function setup() {
    // Create a dedicated overlay canvas so we don't fight with wasm.js
    const overlay       = document.createElement("canvas");
    overlay.id          = "tap-canvas";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    overlay.width  = window.innerWidth;
    overlay.height = window.innerHeight;
    document.body.appendChild(overlay);

    canvas = overlay;
    ctx    = canvas.getContext("2d");

    window.addEventListener("resize", () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    // Tap + click
    window.addEventListener("pointerdown", e => {
      spawnBurst(e.clientX, e.clientY);
    });

    requestAnimationFrame(loop);
    console.log("[tapfx] tap particles ready.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }

})();
