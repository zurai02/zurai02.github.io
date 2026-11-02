/**
 * wasm.js — background particle canvas for zurai02.github.io
 *
 * Engine load order (first one that works wins, all share one interface):
 *   1. Rust / wasm-bindgen build   ./pkg/particle_engine.js   (only if you built it)
 *   2. engine.wat                  compiled in the browser by the tiny assembler below
 *   3. plain JavaScript            always available
 *
 * Interface every engine provides:
 *   set_particle(i,x,y,vx,vy,alpha,size)  update(w,h,dt)
 *   get_x/get_y/get_alpha/get_size(i)     connection_alpha(i,j,maxDist)
 *
 * Performance notes:
 *   - lines are drawn in a few batched paths instead of one stroke per line
 *   - on phones / touch screens: 30 fps cap and fewer particles
 *   - the canvas is NOT reset when only the height changes a little (that is the
 *     mobile address bar sliding in and out while scrolling, and resetting the
 *     canvas there is what made the background flicker)
 */
const WasmEngine = (() => {
  // Files (engine.wat, pkg/) are resolved relative to THIS script, not the page.
  // That way the engine still loads when the page is served from another path,
  // e.g. the 404 page appearing at /some/missing/url. currentScript is only set
  // while the script first runs, so it is captured here at the top.
  const BASE = (document.currentScript && document.currentScript.src) || location.href;

  const LITE = !!(window.matchMedia && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches);
  const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const PARTICLE_COUNT = LITE ? 45 : 80;
  const CONNECT_DIST   = 140;
  const SPEED_MIN      = 0.15;
  const SPEED_MAX      = 0.55;
  const SIZE_MIN       = 1.5;
  const SIZE_MAX       = 3.5;
  const COLOR          = "255,107,53";
  const MIN_FRAME_MS   = LITE ? 30 : 0;    // ~30 fps cap on phones
  const RESIZE_TOL     = LITE ? 160 : 0;   // ignore small height changes (address bar)

  let engine  = null;
  let running = false;
  let rafId   = null;

  const rand     = (mn, mx) => mn + Math.random() * (mx - mn);
  const randSign = ()        => Math.random() < 0.5 ? 1 : -1;

  async function fileExists(url) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Minimal WAT -> WASM assembler ────────────────────────────────────────
  // Supports the folded-instruction subset used by engine.wat (i32/f32 maths,
  // locals, memory load/store, if/else, block/loop/br/br_if, call).
  // Anything outside that subset throws, and the loader falls back to JS.
  function watToWasm(src) {
    const VT = { i32: 0x7F, i64: 0x7E, f32: 0x7D, f64: 0x7C };
    const SIMPLE = {
      "i32.add": 0x6A, "i32.mul": 0x6C, "i32.ge_u": 0x4F,
      "f32.eq": 0x5B, "f32.ne": 0x5C, "f32.lt": 0x5D, "f32.gt": 0x5E, "f32.le": 0x5F, "f32.ge": 0x60,
      "f32.add": 0x92, "f32.sub": 0x93, "f32.mul": 0x94, "f32.div": 0x95,
    };

    const uleb = n => { const o = []; do { let b = n & 0x7F; n >>>= 7; if (n) b |= 0x80; o.push(b); } while (n); return o; };
    const sleb = n => {
      const o = [];
      for (;;) {
        const b = n & 0x7F; n >>= 7;
        if ((n === 0 && !(b & 0x40)) || (n === -1 && (b & 0x40))) { o.push(b); return o; }
        o.push(b | 0x80);
      }
    };
    const vec     = items => [...uleb(items.length), ...items.flat()];
    const section = (id, payload) => [id, ...uleb(payload.length), ...payload];
    const nameB   = s => { const b = Array.from(new TextEncoder().encode(s)); return [...uleb(b.length), ...b]; };
    const f32b    = v => { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, v, true); return Array.from(new Uint8Array(dv.buffer)); };

    // tokenise + parse into nested arrays
    const clean = src.replace(/;;[^\n]*/g, "");
    if (clean.includes("(;")) throw new SyntaxError("block comments not supported");
    const toks = clean.match(/\(|\)|"(?:[^"\\]|\\.)*"|[^\s()";]+/g) || [];
    let pos = 0;
    const node = () => {
      const t = toks[pos++];
      if (t === "(") { const l = []; while (toks[pos] !== ")") { if (pos >= toks.length) throw new SyntaxError("unbalanced ("); l.push(node()); } pos++; return l; }
      if (t === ")" || t === undefined) throw new SyntaxError("unexpected )");
      return t;
    };
    const tree = node();
    if (pos !== toks.length || tree[0] !== "module") throw new SyntaxError("expected a single (module ...)");

    const items = tree.slice(1);
    const funcs = items.filter(it => Array.isArray(it) && it[0] === "func");
    const mems  = items.filter(it => Array.isArray(it) && it[0] === "memory");
    if (mems.length !== 1) throw new SyntaxError("expected exactly one memory");

    const infos = funcs.map((f, idx) => {
      const info = { name: null, exp: null, params: [], result: null, locals: [], body: [], idx };
      for (const part of f.slice(1)) {
        if (typeof part === "string") { if (part[0] === "$") info.name = part; continue; }
        switch (part[0]) {
          case "export": info.exp = part[1].replace(/"/g, ""); break;
          case "param":  info.params.push(part.length === 3 ? [part[1], part[2]] : [null, part[1]]); break;
          case "result": info.result = part[1]; break;
          case "local":  info.locals.push([part[1], part[2]]); break;
          default:       info.body.push(part);
        }
      }
      return info;
    });
    const fidx = {};
    infos.forEach(i => { if (i.name) fidx[i.name] = i.idx; });

    const types = [], tindex = new Map();
    infos.forEach(i => {
      const key = i.params.map(p => p[1]).join(",") + ">" + (i.result || "");
      if (!tindex.has(key)) { tindex.set(key, types.length); types.push([i.params.map(p => p[1]), i.result ? [i.result] : []]); }
      i.type = tindex.get(key);
    });

    const emitFunc = info => {
      const lmap = new Map();
      info.params.forEach(([nm], n) => { if (nm) lmap.set(nm, n); });
      info.locals.forEach(([nm], n) => lmap.set(nm, info.params.length + n));
      const labels = [];
      const depth = lbl => {
        if (/^\d+$/.test(lbl)) return +lbl;
        for (let d = 0, k = labels.length - 1; k >= 0; k--, d++) if (labels[k] === lbl) return d;
        throw new SyntaxError("unknown label " + lbl);
      };
      const ins = nd => {
        if (typeof nd === "string") throw new SyntaxError("flat instructions not supported: " + nd);
        const op = nd[0], args = nd.slice(1), out = [];
        if (op === "local.get" || op === "local.set") {
          const operands = args.slice(1);
          if (operands.length !== (op === "local.get" ? 0 : 1)) throw new SyntaxError(op + " operand count");
          operands.forEach(a => out.push(...ins(a)));
          if (!lmap.has(args[0])) throw new SyntaxError("unknown local " + args[0]);
          out.push(op === "local.get" ? 0x20 : 0x21, ...uleb(lmap.get(args[0])));
        } else if (op === "i32.const") {
          out.push(0x41, ...sleb(parseInt(args[0], 10)));
        } else if (op === "f32.const") {
          out.push(0x43, ...f32b(parseFloat(args[0])));
        } else if (op === "f32.load" || op === "f32.store") {
          let offset = 0; const rest = [];
          args.forEach(a => { if (typeof a === "string" && a.startsWith("offset=")) offset = parseInt(a.slice(7), 10); else rest.push(a); });
          rest.forEach(a => out.push(...ins(a)));
          out.push(op === "f32.load" ? 0x2A : 0x38, ...uleb(2), ...uleb(offset));
        } else if (op in SIMPLE) {
          args.forEach(a => out.push(...ins(a)));
          out.push(SIMPLE[op]);
        } else if (op === "call") {
          args.slice(1).forEach(a => out.push(...ins(a)));
          if (!(args[0] in fidx)) throw new SyntaxError("unknown function " + args[0]);
          out.push(0x10, ...uleb(fidx[args[0]]));
        } else if (op === "br" || op === "br_if") {
          args.slice(1).forEach(a => out.push(...ins(a)));
          out.push(op === "br" ? 0x0C : 0x0D, ...uleb(depth(args[0])));
        } else if (op === "block" || op === "loop") {
          const lbl = args.length && typeof args[0] === "string" ? args[0] : null;
          labels.push(lbl);
          out.push(op === "block" ? 0x02 : 0x03, 0x40);
          (lbl ? args.slice(1) : args).forEach(b => out.push(...ins(b)));
          labels.pop();
          out.push(0x0B);
        } else if (op === "if") {
          let bt = 0x40, rest = args.slice();
          if (rest.length && Array.isArray(rest[0]) && rest[0][0] === "result") { bt = VT[rest[0][1]]; rest = rest.slice(1); }
          const then = rest.find(r => Array.isArray(r) && r[0] === "then");
          const els  = rest.find(r => Array.isArray(r) && r[0] === "else");
          if (!then) throw new SyntaxError("if without then");
          out.push(...ins(rest[0]));
          labels.push(null);
          out.push(0x04, bt);
          then.slice(1).forEach(b => out.push(...ins(b)));
          if (els) { out.push(0x05); els.slice(1).forEach(b => out.push(...ins(b))); }
          labels.pop();
          out.push(0x0B);
        } else {
          throw new SyntaxError("unsupported instruction: " + op);
        }
        return out;
      };
      const body = info.body.flatMap(b => ins(b)).concat([0x0B]);
      const locs = vec(info.locals.map(([, t]) => [1, VT[t]]));
      const code = [...locs, ...body];
      return [...uleb(code.length), ...code];
    };

    const exportsB = [];
    let memMin = null;
    mems[0].slice(1).forEach(part => {
      if (Array.isArray(part) && part[0] === "export") exportsB.push([...nameB(part[1].replace(/"/g, "")), 0x02, ...uleb(0)]);
      else if (typeof part === "string" && /^\d+$/.test(part)) memMin = +part;
    });
    if (memMin === null) throw new SyntaxError("memory size missing");
    infos.forEach(i => { if (i.exp) exportsB.push([...nameB(i.exp), 0x00, ...uleb(i.idx)]); });

    const typeSec = vec(types.map(([p, r]) => [0x60, ...vec(p.map(t => [VT[t]])), ...vec(r.map(t => [VT[t]]))]));
    const funcSec = vec(infos.map(i => uleb(i.type)));
    const memSec  = vec([[0x00, ...uleb(memMin)]]);
    const expSec  = vec(exportsB);
    const codeSec = vec(infos.map(emitFunc));

    return new Uint8Array([
      0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00,
      ...section(1, typeSec), ...section(3, funcSec), ...section(5, memSec),
      ...section(7, expSec),  ...section(10, codeSec),
    ]);
  }

  // ── Engines ──────────────────────────────────────────────────────────
  // Plain-JS engine with the same interface as the WASM ones.
  function makeJSEngine() {
    const N = PARTICLE_COUNT;
    const x = new Float32Array(N), y = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
    const al = new Float32Array(N), sz = new Float32Array(N);
    return {
      set_particle(i, px, py, pvx, pvy, a, s) { x[i] = px; y[i] = py; vx[i] = pvx; vy[i] = pvy; al[i] = a; sz[i] = s; },
      update(w, h, mv) {
        for (let i = 0; i < N; i++) {
          x[i] += vx[i] * mv; y[i] += vy[i] * mv;
          if (x[i] < 0) x[i] = w; if (x[i] > w) x[i] = 0;
          if (y[i] < 0) y[i] = h; if (y[i] > h) y[i] = 0;
        }
      },
      get_x: i => x[i], get_y: i => y[i], get_alpha: i => al[i], get_size: i => sz[i],
      connection_alpha(i, j, th) {
        const dx = x[i] - x[j], dy = y[i] - y[j], d = dx * dx + dy * dy, t = th * th;
        return d >= t ? 0 : 1 - d / t;
      },
    };
  }

  async function loadEngine() {
    const rustModuleUrl = new URL("particle_engine.js", BASE);
    const rustBuildExists = await fileExists(rustModuleUrl);

    // 1) Rust / wasm-bindgen build, used automatically if pkg/ has been built
    if (rustBuildExists) {
      try {
        const mod = await import(rustModuleUrl.href);
        await mod.default();
        engine = new mod.ParticleEngine(PARTICLE_COUNT);
        console.log("[wasm] Rust engine loaded.");
        return;
      } catch (err) {
        console.warn("[wasm] Rust engine import failed, falling back to WAT/JS.", err);
      }
    } else {
      console.info("[wasm] Rust build not present, trying engine.wat.");
    }

    // 2) engine.wat, compiled right here in the browser
    try {
      const res = await fetch(new URL("engine.wat", BASE));
      if (!res.ok) throw new Error("engine.wat HTTP " + res.status);
      const { instance } = await WebAssembly.instantiate(watToWasm(await res.text()));
      const x = instance.exports;
      engine = {
        set_particle:     x.set_particle,
        update:           (w, h, dt) => x.update_particles(PARTICLE_COUNT, w, h, dt),
        get_x:            x.get_x,
        get_y:            x.get_y,
        get_alpha:        x.get_alpha,
        get_size:         x.get_size,
        connection_alpha: x.connection_alpha,
      };
      console.log("[wasm] engine.wat compiled in-browser: particle engine running natively.");
      return;
    } catch (err) {
      console.warn("[wasm] fallback to JS.", err);
    }

    // 3) plain JavaScript
    engine = makeJSEngine();
  }

  function seedParticles(w, h) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      engine.set_particle(i,
        rand(0, w), rand(0, h),
        randSign() * rand(SPEED_MIN, SPEED_MAX),
        randSign() * rand(SPEED_MIN, SPEED_MAX),
        rand(0.3, 0.9), rand(SIZE_MIN, SIZE_MAX)
      );
    }
  }

  // ── Drawing (batched) ────────────────────────────────────────────────────
  const LINE_LEVELS = 5, DOT_LEVELS = 3, TAU = Math.PI * 2;
  const lineBuckets = Array.from({ length: LINE_LEVELS }, () => []);
  const dotBuckets  = Array.from({ length: DOT_LEVELS  }, () => []);

  function draw(ctx, w, h, dt) {
    engine.update(w, h, dt * 60);
    ctx.clearRect(0, 0, w, h);

    // connection lines: grouped into a few opacity levels, one path + one stroke each
    for (const b of lineBuckets) b.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const xi = engine.get_x(i), yi = engine.get_y(i);
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const a = engine.connection_alpha(i, j, CONNECT_DIST);
        if (a <= 0) continue;
        lineBuckets[Math.min(LINE_LEVELS - 1, (a * LINE_LEVELS) | 0)].push(xi, yi, engine.get_x(j), engine.get_y(j));
      }
    }
    ctx.lineWidth = 0.75;
    for (let l = 0; l < LINE_LEVELS; l++) {
      const b = lineBuckets[l];
      if (!b.length) continue;
      ctx.beginPath();
      for (let k = 0; k < b.length; k += 4) { ctx.moveTo(b[k], b[k + 1]); ctx.lineTo(b[k + 2], b[k + 3]); }
      ctx.strokeStyle = `rgba(${COLOR},${(((l + 0.5) / LINE_LEVELS) * 0.35).toFixed(3)})`;
      ctx.stroke();
    }

    // dots: grouped by opacity, one path + one fill each
    for (const b of dotBuckets) b.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const lvl = Math.max(0, Math.min(DOT_LEVELS - 1, (((engine.get_alpha(i) - 0.3) / 0.6) * DOT_LEVELS) | 0));
      dotBuckets[lvl].push(engine.get_x(i), engine.get_y(i), engine.get_size(i));
    }
    for (let l = 0; l < DOT_LEVELS; l++) {
      const b = dotBuckets[l];
      if (!b.length) continue;
      ctx.beginPath();
      for (let k = 0; k < b.length; k += 3) { ctx.moveTo(b[k] + b[k + 2], b[k + 1]); ctx.arc(b[k], b[k + 1], b[k + 2], 0, TAU); }
      ctx.fillStyle = `rgba(${COLOR},${(0.3 + ((l + 0.5) / DOT_LEVELS) * 0.6).toFixed(3)})`;
      ctx.fill();
    }
  }

  // ── Canvas sizing ────────────────────────────────────────────────────────
  // Assigning canvas.width clears and reallocates the canvas, so only do it
  // when it is really needed (see the performance notes at the top).
  function sizeCanvas(c) {
    const w = window.innerWidth, h = window.innerHeight;
    if (w === c.width && Math.abs(h - c.height) <= RESIZE_TOL) return;
    c.width = w; c.height = h;
  }

  async function init(canvas) {
    if (!canvas || running) return;
    running = true;
    window.__wasmParticlesActive = true;   // tells site.ts's fallback not to draw on this canvas

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => sizeCanvas(canvas), 150);
    });

    await loadEngine();
    if (!running) return;                  // stop() was called while loading
    seedParticles(canvas.width, canvas.height);

    if (REDUCED) { draw(ctx, canvas.width, canvas.height, 0); return; }   // one still frame

    let last = performance.now();
    function frame(now) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      const elapsed = now - last;
      if (elapsed < MIN_FRAME_MS) return;
      last = now;
      draw(ctx, canvas.width, canvas.height, Math.min(elapsed / 1000, 0.05));
    }
    rafId = requestAnimationFrame(frame);
  }

  return {
    init,
    watToWasm,
    stop: () => { if (rafId) cancelAnimationFrame(rafId); running = false; rafId = null; },
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const c = document.getElementById("bg-canvas");
  if (c) WasmEngine.init(c);
});
