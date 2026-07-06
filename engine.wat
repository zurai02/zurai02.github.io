;; engine.wat — High-performance particle engine for zurai02.github.io
;;
;; Runs the background canvas particle simulation at near-native speed.
;; Compiled to engine.wasm via: npm run build:wasm
;;
;; Particle memory layout (24 bytes / 6 x f32 per particle):
;;   byte  0: x       — position x
;;   byte  4: y       — position y
;;   byte  8: vx      — velocity x
;;   byte 12: vy      — velocity y
;;   byte 16: alpha   — opacity (0.0–1.0)
;;   byte 20: size    — radius in px
;;
;; Max particles: 65536 bytes / 24 = 2730 (1 WASM memory page)

(module

  ;; 1 page = 64 KB of linear memory, shared with JS via Float32Array view
  (memory (export "mem") 1)

  ;; ── set_particle ────────────────────────────────────────────────────────────
  ;; Initialise or overwrite particle i with all fields.
  (func (export "set_particle")
    (param $i i32)
    (param $x  f32) (param $y  f32)
    (param $vx f32) (param $vy f32)
    (param $al f32) (param $sz f32)
    (local $b i32)
    (local.set $b (i32.mul (local.get $i) (i32.const 24)))
    (f32.store offset=0  (local.get $b) (local.get $x))
    (f32.store offset=4  (local.get $b) (local.get $y))
    (f32.store offset=8  (local.get $b) (local.get $vx))
    (f32.store offset=12 (local.get $b) (local.get $vy))
    (f32.store offset=16 (local.get $b) (local.get $al))
    (f32.store offset=20 (local.get $b) (local.get $sz))
  )

  ;; ── get_x / get_y ───────────────────────────────────────────────────────────
  ;; Read particle position (used by JS canvas draw loop).
  (func (export "get_x") (param $i i32) (result f32)
    (f32.load offset=0 (i32.mul (local.get $i) (i32.const 24)))
  )
  (func (export "get_y") (param $i i32) (result f32)
    (f32.load offset=4 (i32.mul (local.get $i) (i32.const 24)))
  )
  (func (export "get_alpha") (param $i i32) (result f32)
    (f32.load offset=16 (i32.mul (local.get $i) (i32.const 24)))
  )
  (func (export "get_size") (param $i i32) (result f32)
    (f32.load offset=20 (i32.mul (local.get $i) (i32.const 24)))
  )

  ;; ── update_particles ────────────────────────────────────────────────────────
  ;; Integrate velocity, wrap at canvas edges. Called every animation frame.
  ;;
  ;; update_particles(count: i32, width: f32, height: f32, dt: f32)
  (func (export "update_particles")
    (param $n  i32)
    (param $w  f32)
    (param $h  f32)
    (param $dt f32)
    (local $i  i32)
    (local $b  i32)
    (local $x  f32)
    (local $y  f32)
    (local $vx f32)
    (local $vy f32)

    (local.set $i (i32.const 0))
    (block $brk
      (loop $lp
        (br_if $brk (i32.ge_u (local.get $i) (local.get $n)))

        (local.set $b (i32.mul (local.get $i) (i32.const 24)))

        ;; load position + velocity
        (local.set $x  (f32.load offset=0  (local.get $b)))
        (local.set $y  (f32.load offset=4  (local.get $b)))
        (local.set $vx (f32.load offset=8  (local.get $b)))
        (local.set $vy (f32.load offset=12 (local.get $b)))

        ;; integrate: pos += vel * dt
        (local.set $x (f32.add (local.get $x) (f32.mul (local.get $vx) (local.get $dt))))
        (local.set $y (f32.add (local.get $y) (f32.mul (local.get $vy) (local.get $dt))))

        ;; wrap x
        (if (f32.lt (local.get $x) (f32.const 0.0))
          (then (local.set $x (local.get $w))))
        (if (f32.gt (local.get $x) (local.get $w))
          (then (local.set $x (f32.const 0.0))))

        ;; wrap y
        (if (f32.lt (local.get $y) (f32.const 0.0))
          (then (local.set $y (local.get $h))))
        (if (f32.gt (local.get $y) (local.get $h))
          (then (local.set $y (f32.const 0.0))))

        ;; write back
        (f32.store offset=0 (local.get $b) (local.get $x))
        (f32.store offset=4 (local.get $b) (local.get $y))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $lp)
      )
    )
  )

  ;; ── dist_sq ─────────────────────────────────────────────────────────────────
  ;; Squared Euclidean distance between particles i and j.
  ;; Used by JS to decide whether to draw a connection line.
  ;; Returning squared distance avoids a sqrt — compare against threshold^2.
  ;;
  ;; dist_sq(i: i32, j: i32) -> f32
  (func (export "dist_sq")
    (param $i i32)
    (param $j i32)
    (result f32)
    (local $bi i32)
    (local $bj i32)
    (local $dx f32)
    (local $dy f32)

    (local.set $bi (i32.mul (local.get $i) (i32.const 24)))
    (local.set $bj (i32.mul (local.get $j) (i32.const 24)))

    (local.set $dx (f32.sub
      (f32.load offset=0 (local.get $bi))
      (f32.load offset=0 (local.get $bj))
    ))
    (local.set $dy (f32.sub
      (f32.load offset=4 (local.get $bi))
      (f32.load offset=4 (local.get $bj))
    ))

    (f32.add
      (f32.mul (local.get $dx) (local.get $dx))
      (f32.mul (local.get $dy) (local.get $dy))
    )
  )

  ;; ── connection_alpha ────────────────────────────────────────────────────────
  ;; Returns line opacity for a pair of particles based on distance.
  ;; 1.0 when close, fades to 0.0 at threshold. Returns 0 if beyond threshold.
  ;;
  ;; connection_alpha(i: i32, j: i32, threshold: f32) -> f32
  (func (export "connection_alpha")
    (param $i  i32)
    (param $j  i32)
    (param $th f32)
    (result f32)
    (local $dsq f32)
    (local $tsq f32)

    (local.set $tsq (f32.mul (local.get $th) (local.get $th)))
    (local.set $dsq (call $dist_sq_internal (local.get $i) (local.get $j)))

    (if (result f32) (f32.ge (local.get $dsq) (local.get $tsq))
      (then (f32.const 0.0))
      (else
        ;; alpha = 1 - (dsq / tsq)
        (f32.sub
          (f32.const 1.0)
          (f32.div (local.get $dsq) (local.get $tsq))
        )
      )
    )
  )

  ;; internal (unexported) dist_sq used by connection_alpha
  (func $dist_sq_internal
    (param $i i32) (param $j i32)
    (result f32)
    (local $bi i32) (local $bj i32)
    (local $dx f32) (local $dy f32)
    (local.set $bi (i32.mul (local.get $i) (i32.const 24)))
    (local.set $bj (i32.mul (local.get $j) (i32.const 24)))
    (local.set $dx (f32.sub
      (f32.load offset=0 (local.get $bi))
      (f32.load offset=0 (local.get $bj))
    ))
    (local.set $dy (f32.sub
      (f32.load offset=4 (local.get $bi))
      (f32.load offset=4 (local.get $bj))
    ))
    (f32.add
      (f32.mul (local.get $dx) (local.get $dx))
      (f32.mul (local.get $dy) (local.get $dy))
    )
  )

)
