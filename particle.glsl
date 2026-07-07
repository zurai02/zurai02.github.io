/**
 * particle.glsl — zurai02.github.io  (enhanced WebGL2)
 *
 * Three shader programs in one file — split by #ifdef:
 *   VERTEX     → particle point sprite
 *   FRAGMENT   → particle point sprite
 *   LINE_VERT  → connection line between two particles
 *   LINE_FRAG  → connection line (animated pulse + glow)
 *
 * Compile with WebGL2 (gl.createShader / gl.VERTEX_SHADER|FRAGMENT_SHADER).
 * Strip the correct block before uploading — or use the loader in wasm.js.
 */


/* ════════════════════════════════════════════════════════════
   SHARED UTILITIES  (copy into both fragment shaders)
   ════════════════════════════════════════════════════════════ */
/*
  float easeOut(float t)        — smooth deceleration
  float easeInOut(float t)      — symmetric ease
  vec3  hsl2rgb(vec3 hsl)       — HSL → linear RGB
  float fbm(vec2 p, int oct)    — fractal Brownian motion noise
*/


/* ════════════════════════════════════════════════════════════
   PARTICLE  ──  VERTEX SHADER
   ════════════════════════════════════════════════════════════ */
#ifdef VERTEX
#version 300 es
precision highp float;

/* ── Attributes (per particle, updated by WASM engine) ── */
in vec2  a_pos;      /* clip-space position [-1, 1]          */
in float a_size;     /* base point radius in px              */
in float a_opacity;  /* base alpha [0, 1]                    */
in float a_phase;    /* per-particle phase offset            */
in float a_speed;    /* normalised speed [0, 1] for coloring */
in vec3  a_color;    /* base RGB                             */

/* ── Uniforms ── */
uniform float u_time;       /* elapsed seconds            */
uniform vec2  u_resolution; /* viewport in px             */
uniform float u_dpr;        /* device pixel ratio         */
uniform vec2  u_mouse;      /* mouse in clip space [-1,1] */
uniform float u_mouse_near; /* 0–1, 1 = very close        */

/* ── Varyings → fragment ── */
out float v_opacity;
out vec3  v_color;
out float v_glow;    /* extra glow intensity near mouse */
out float v_speed;

void main() {
  float t = u_time;

  /* ── Multi-harmonic opacity pulse ── */
  float p1    = sin(t * 1.15 + a_phase)         * 0.10;
  float p2    = sin(t * 0.48 + a_phase * 1.7)   * 0.05;
  float pulse = p1 + p2;
  v_opacity   = clamp(a_opacity + pulse, 0.04, 0.62);

  /* ── Animated size: breathe + speed-based boost ── */
  float breathe = 1.0 + sin(t * 0.9 + a_phase * 2.1) * 0.12;
  float sizeBoost = 1.0 + a_speed * 0.35 + u_mouse_near * 0.55;
  float pointSize = a_size * breathe * sizeBoost * u_dpr;

  /* ── Color shift: hue drifts slowly over time ── */
  /* Warm → cooler as speed increases */
  float hueShift = sin(t * 0.22 + a_phase) * 0.06;
  v_color = clamp(a_color + vec3(hueShift, -hueShift * 0.3, hueShift * 0.6), 0.0, 1.0);

  /* ── Mouse proximity glow ── */
  v_glow  = u_mouse_near;
  v_speed = a_speed;

  gl_Position  = vec4(a_pos, 0.0, 1.0);
  gl_PointSize = clamp(pointSize, 1.0, 32.0);
}
#endif /* VERTEX */


/* ════════════════════════════════════════════════════════════
   PARTICLE  ──  FRAGMENT SHADER
   ════════════════════════════════════════════════════════════ */
#ifdef FRAGMENT
#version 300 es
precision mediump float;

in float v_opacity;
in vec3  v_color;
in float v_glow;
in float v_speed;

out vec4 fragColor;

/* ── Smooth disc edge ── */
float disc(vec2 uv, float radius, float feather) {
  return 1.0 - smoothstep(radius - feather, radius + feather, length(uv));
}

void main() {
  vec2  uv   = gl_PointCoord - vec2(0.5);
  float dist = length(uv);

  /* ── Hard discard beyond circle ── */
  if (dist > 0.5) discard;

  /* ── Layered glow rings ── */
  float core      = disc(uv, 0.18, 0.12);   /* bright center   */
  float innerGlow = disc(uv, 0.32, 0.14);   /* mid halo        */
  float outerHaze = disc(uv, 0.48, 0.06);   /* soft outer edge */

  /* ── Color layers: center is brighter / slightly warm ── */
  vec3 coreColor  = v_color * 1.85 + vec3(0.15, 0.08, 0.02);
  vec3 glowColor  = v_color * 1.20;
  vec3 hazeColor  = v_color * 0.70;

  vec3 col = hazeColor;
  col      = mix(col, glowColor,  innerGlow);
  col      = mix(col, coreColor,  core);

  /* ── Extra bloom when near mouse ── */
  if (v_glow > 0.01) {
    float bloom = v_glow * core * 0.6;
    col = col + vec3(bloom * 1.2, bloom * 0.5, bloom * 0.2);
  }

  /* ── Speed-based color accent (fast particles glow blue) ── */
  col = mix(col, col + vec3(-0.05, 0.05, 0.25), v_speed * innerGlow * 0.4);

  /* ── Final alpha: outerHaze fades edges ── */
  float alpha = outerHaze * v_opacity;

  fragColor = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
#endif /* FRAGMENT */


/* ════════════════════════════════════════════════════════════
   CONNECTION LINE  ──  VERTEX SHADER
   ════════════════════════════════════════════════════════════ */
#ifdef LINE_VERT
#version 300 es
precision highp float;

in  vec2  a_pos;      /* clip-space endpoint                  */
in  float a_t;        /* 0.0 = start, 1.0 = end of line       */
in  float a_alpha;    /* base connection opacity              */
in  vec3  a_color;    /* particle color at this endpoint      */

uniform float u_time;

out float v_t;
out float v_alpha;
out vec3  v_color;
out float v_pulse;

void main() {
  v_t     = a_t;
  v_color = a_color;

  /* Animated pulse travels along line every 2.5s */
  float period = 2.5;
  float wave   = mod(u_time, period) / period;   /* 0 → 1 */
  float dist   = abs(a_t - wave);
  v_pulse      = smoothstep(0.18, 0.0, dist) * 0.9;

  v_alpha = a_alpha;

  gl_Position = vec4(a_pos, 0.0, 1.0);
}
#endif /* LINE_VERT */


/* ════════════════════════════════════════════════════════════
   CONNECTION LINE  ──  FRAGMENT SHADER
   ════════════════════════════════════════════════════════════ */
#ifdef LINE_FRAG
#version 300 es
precision mediump float;

in float v_t;
in float v_alpha;
in vec3  v_color;
in float v_pulse;

out vec4 fragColor;

void main() {
  /* ── Gradient: fade at both endpoints ── */
  float endFade = v_t * (1.0 - v_t) * 4.0;   /* peaks at midpoint */
  endFade       = clamp(endFade, 0.0, 1.0);

  /* ── Base line color with gradient mix ── */
  /* Blend from accent orange toward blue at midpoint */
  vec3 col = mix(
    v_color,
    v_color * vec3(0.7, 0.85, 1.3),   /* cool shift at center */
    smoothstep(0.3, 0.7, v_t)
  );

  /* ── Traveling pulse brightens line locally ── */
  col = col + v_color * v_pulse * 1.4;

  float alpha = v_alpha * endFade * 0.55;
  alpha       = alpha + v_pulse * 0.35;   /* pulse always visible */

  if (alpha < 0.005) discard;

  fragColor = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
#endif /* LINE_FRAG */  float pulse = sin(u_time * 1.2 + a_phase) * 0.12;
  v_opacity = clamp(a_opacity + pulse, 0.03, 0.55);
  v_color   = a_color;

  gl_Position  = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size * u_dpr;
}

#endif /* VERTEX */


/* ═══════════════════════════════════
   FRAGMENT SHADER
   ═══════════════════════════════════ */
#ifdef FRAGMENT

#version 300 es
precision mediump float;

in float v_opacity;
in vec3  v_color;

out vec4 fragColor;

void main() {
  /* Soft circular point */
  vec2  uv   = gl_PointCoord - vec2(0.5);
  float dist = length(uv);

  /* Smooth disc with soft edge */
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  if (alpha < 0.01) discard;

  /* Subtle radial glow: brighter center */
  float glow = 1.0 - smoothstep(0.0, 0.45, dist);
  vec3  col  = mix(v_color, v_color * 1.6, glow * 0.4);

  fragColor = vec4(col, alpha * v_opacity);
}

#endif /* FRAGMENT */
