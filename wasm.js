const WasmEngine = (() => {
  const PARTICLE_COUNT = 80;
  const CONNECT_DIST   = 140;
  const SPEED_MIN      = 0.15;
  const SPEED_MAX      = 0.55;
  const SIZE_MIN       = 1.5;
  const SIZE_MAX       = 3.5;
  const COLOR          = "255,107,53";

  let engine  = null;
  let running = false;
  let rafId   = null;

  const rand     = (mn, mx) => mn + Math.random() * (mx - mn);
  const randSign = ()        => Math.random() < 0.5 ? 1 : -1;

  async function loadWasm() {
    try {
      const mod = await import("./pkg/particle_engine.js");
      await mod.default();
      engine = new mod.ParticleEngine(PARTICLE_COUNT);
      console.log("[wasm] Rust engine loaded.");
    } catch (err) {
      console.warn("[wasm] fallback to JS.", err);
      engine = null;
    }
  }

  function initParticles(w, h) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      engine.set_particle(i,
        rand(0,w), rand(0,h),
        randSign()*rand(SPEED_MIN,SPEED_MAX),
        randSign()*rand(SPEED_MIN,SPEED_MAX),
        rand(0.3,0.9), rand(SIZE_MIN,SIZE_MAX)
      );
    }
  }

  function drawWasm(ctx, w, h, dt) {
    engine.update(w, h, dt * 60);
    ctx.clearRect(0, 0, w, h);
    for (let i=0; i<PARTICLE_COUNT; i++) {
      for (let j=i+1; j<PARTICLE_COUNT; j++) {
        const a = engine.connection_alpha(i, j, CONNECT_DIST);
        if (a<=0) continue;
        ctx.beginPath();
        ctx.moveTo(engine.get_x(i), engine.get_y(i));
        ctx.lineTo(engine.get_x(j), engine.get_y(j));
        ctx.strokeStyle=`rgba(${COLOR},${(a*0.35).toFixed(3)})`;
        ctx.lineWidth=0.75; ctx.stroke();
      }
    }
    for (let i=0; i<PARTICLE_COUNT; i++) {
      ctx.beginPath();
      ctx.arc(engine.get_x(i), engine.get_y(i), engine.get_size(i), 0, Math.PI*2);
      ctx.fillStyle=`rgba(${COLOR},${engine.get_alpha(i).toFixed(3)})`;
      ctx.fill();
    }
  }

  class JSParticle {
    constructor(w,h) {
      this.x=rand(0,w); this.y=rand(0,h);
      this.vx=randSign()*rand(SPEED_MIN,SPEED_MAX);
      this.vy=randSign()*rand(SPEED_MIN,SPEED_MAX);
      this.alpha=rand(0.3,0.9); this.size=rand(SIZE_MIN,SIZE_MAX);
    }
  }

  function drawJS(ctx, pts, w, h, dt) {
    const mv=dt*60, tsq=CONNECT_DIST*CONNECT_DIST;
    ctx.clearRect(0,0,w,h);
    for (const p of pts) {
      p.x+=p.vx*mv; p.y+=p.vy*mv;
      if(p.x<0)p.x=w; if(p.x>w)p.x=0;
      if(p.y<0)p.y=h; if(p.y>h)p.y=0;
    }
    for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, dsq=dx*dx+dy*dy;
      if(dsq>=tsq) continue;
      ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
      ctx.strokeStyle=`rgba(${COLOR},${((1-dsq/tsq)*0.35).toFixed(3)})`; ctx.lineWidth=0.75; ctx.stroke();
    }
    for (const p of pts) {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle=`rgba(${COLOR},${p.alpha})`; ctx.fill();
    }
  }

  function resize(c) { c.width=window.innerWidth; c.height=window.innerHeight; }

  async function init(canvas) {
    if (!canvas||running) return;
    running=true;
    const ctx=canvas.getContext("2d");
    resize(canvas);
    window.addEventListener("resize",()=>resize(canvas));
    await loadWasm();
    let jsP=null;
    if (engine) initParticles(canvas.width, canvas.height);
    else jsP=Array.from({length:PARTICLE_COUNT},()=>new JSParticle(canvas.width,canvas.height));
    let last=performance.now();
    function frame(now) {
      const dt=Math.min((now-last)/1000,0.05); last=now;
      engine ? drawWasm(ctx,canvas.width,canvas.height,dt)
             : drawJS(ctx,jsP,canvas.width,canvas.height,dt);
      rafId=requestAnimationFrame(frame);
    }
    rafId=requestAnimationFrame(frame);
  }

  return { init, stop: ()=>{ if(rafId) cancelAnimationFrame(rafId); running=false; rafId=null; } };
})();

document.addEventListener("DOMContentLoaded",()=>{
  const c=document.getElementById("bg-canvas");
  if(c) WasmEngine.init(c);
});
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
