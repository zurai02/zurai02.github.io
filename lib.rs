// src/lib.rs — Particle engine for zurai02.github.io
//
// Compiled to WebAssembly via:  wasm-pack build --target web --out-dir pkg
//
// Each particle stores: x, y, vx, vy, alpha, size
// JS calls update() every animation frame — all math runs natively in WASM.

use wasm_bindgen::prelude::*;

// ── Particle ──────────────────────────────────────────────────────────────────

struct Particle {
    x:     f32,
    y:     f32,
    vx:    f32,
    vy:    f32,
    alpha: f32,
    size:  f32,
}

impl Particle {
    fn new(x: f32, y: f32, vx: f32, vy: f32, alpha: f32, size: f32) -> Self {
        Self { x, y, vx, vy, alpha, size }
    }

    /// Integrate velocity and wrap at canvas edges.
    #[inline(always)]
    fn update(&mut self, width: f32, height: f32, dt: f32) {
        self.x += self.vx * dt;
        self.y += self.vy * dt;

        // Wrap horizontally
        if self.x < 0.0      { self.x = width;  }
        if self.x > width    { self.x = 0.0;    }

        // Wrap vertically
        if self.y < 0.0      { self.y = height; }
        if self.y > height   { self.y = 0.0;    }
    }

    #[inline(always)]
    fn dist_sq(&self, other: &Particle) -> f32 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        dx * dx + dy * dy
    }
}

// ── ParticleEngine ────────────────────────────────────────────────────────────

#[wasm_bindgen]
pub struct ParticleEngine {
    particles: Vec<Particle>,
}

#[wasm_bindgen]
impl ParticleEngine {

    /// Create a new engine. Call set_particle() for each slot before update().
    #[wasm_bindgen(constructor)]
    pub fn new(count: usize) -> Self {
        // Pre-allocate all particles as zeroed
        let mut particles = Vec::with_capacity(count);
        for _ in 0..count {
            particles.push(Particle::new(0.0, 0.0, 0.0, 0.0, 1.0, 1.5));
        }
        Self { particles }
    }

    /// Initialise or overwrite particle at index i.
    pub fn set_particle(
        &mut self,
        i:     usize,
        x:     f32,
        y:     f32,
        vx:    f32,
        vy:    f32,
        alpha: f32,
        size:  f32,
    ) {
        if let Some(p) = self.particles.get_mut(i) {
            p.x     = x;
            p.y     = y;
            p.vx    = vx;
            p.vy    = vy;
            p.alpha = alpha;
            p.size  = size;
        }
    }

    /// Update all particles. Call once per animation frame.
    /// dt should be frame delta in seconds, normalised to 60 fps (dt * 60).
    pub fn update(&mut self, width: f32, height: f32, dt: f32) {
        for p in self.particles.iter_mut() {
            p.update(width, height, dt);
        }
    }

    // ── Getters (called per-particle by JS draw loop) ──────────────────────

    pub fn get_x(&self, i: usize) -> f32 {
        self.particles.get(i).map_or(0.0, |p| p.x)
    }

    pub fn get_y(&self, i: usize) -> f32 {
        self.particles.get(i).map_or(0.0, |p| p.y)
    }

    pub fn get_alpha(&self, i: usize) -> f32 {
        self.particles.get(i).map_or(1.0, |p| p.alpha)
    }

    pub fn get_size(&self, i: usize) -> f32 {
        self.particles.get(i).map_or(1.5, |p| p.size)
    }

    pub fn count(&self) -> usize {
        self.particles.len()
    }

    // ── Connection helpers ─────────────────────────────────────────────────

    /// Squared distance between particles i and j.
    /// Compare against threshold² to avoid sqrt.
    pub fn dist_sq(&self, i: usize, j: usize) -> f32 {
        match (self.particles.get(i), self.particles.get(j)) {
            (Some(a), Some(b)) => a.dist_sq(b),
            _ => f32::MAX,
        }
    }

    /// Line opacity for a connection between particles i and j.
    /// Returns 0.0 if beyond threshold, 1.0 at same position.
    pub fn connection_alpha(&self, i: usize, j: usize, threshold: f32) -> f32 {
        let tsq = threshold * threshold;
        let dsq = self.dist_sq(i, j);
        if dsq >= tsq {
            0.0
        } else {
            1.0 - (dsq / tsq)
        }
    }

    // ── Bulk position export ───────────────────────────────────────────────
    // Returns a flat Float32Array of [x0,y0, x1,y1, ...] for fast JS iteration.

    pub fn positions(&self) -> Vec<f32> {
        let mut out = Vec::with_capacity(self.particles.len() * 2);
        for p in &self.particles {
            out.push(p.x);
            out.push(p.y);
        }
        out
    }
}
