/**
 * wasm.js — background particle canvas for zurai02.is-a.dev
 *
 * Engine load order:
 *   1. engine.wat                  compiled in the browser by the tiny assembler below
 *   2. plain JavaScript            always available
 *
 * Performance notes:
 *   - lines are drawn in a few batched paths instead of one stroke per line
 *   - on phones / touch screens: 30 fps cap and fewer particles
 *   - the canvas is NOT reset when only the height changes a little
 */
const WasmEngine = (() => {
  const BASE = (document.currentScript && document.currentScript.src) || location.href;

  const LITE = !!(window.matchMedia && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches);
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const PARTICLE_COUNT = LITE ? 45 : 80;
  const CONNECT_DIST = 140;
  const SPEED_MIN = 0.15;
  const SPEED_MAX = 0.55;
  const SIZE_MIN = 1.5;
  const SIZE_MAX = 3.5;
  const COLOR = '255,107,53';
  const MIN_FRAME_MS = LITE ? 30 : 0;
  const RESIZE_TOL = LITE ? 160 : 0;

  let engine = null;
  let running = false;
  let rafId = null;

  const rand = (mn, mx) => mn + Math.random() * (mx - mn);
  const randSign = () => Math.random() < 0.5 ? 1 : -1;

  function watToWasm(src) {
    const VT = { i32: 0x7F, i64: 0x7E, f32: 0x7D, f64: 0x7C };
    const SIMPLE = {
      'i32.add': 0x6A, 'i32.mul': 0x6C, 'i32.ge_u': 0x4F,
      'f32.eq': 0x5B, 'f32.ne': 0x5C, 'f32.lt': 0x5D, 'f32.gt': 0x5E, 'f32.le': 0x5F, 'f32.ge': 0x60,
      'f32.add': 0x92, 'f32.sub': 0x93, 'f32.mul': 0x94, 'f32.div': 0x95,
    };

    const uleb = n => { const o = []; do { let b = n & 0x7F; n >>>= 7; if (n) b |= 0x80; o.push(b); } while (n); return o; };
    const sleb = n => { const o = []; for (;;) { const b = n & 0x7F; n >>= 7; if ((n === 0 && !(b & 0x40)) || (n === -1 && (b & 0x40))) { o.push(b); return o; } o.push(b | 0x80); } };
    const vec = items => [...uleb(items.length), ...items.flat()];
    const section = (id, payload) => [id, ...uleb(payload.length), ...payload];
    const nameB = s => { const b = Array.from(new TextEncoder().encode(s)); return [...uleb(b.length), ...b]; };
    const f32b = v => { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, v, true); return Array.from(new Uint8Array(dv.buffer)); };
