/**
 * particle.glsl — zurai02.github.io
 * GLSL shader pair for WebGL particle background.
 * Compile with WebGL2 for full float texture support.
 *
 * Usage: feed into a WebGLProgram via gl.createShader()
 *        Vertex   → VERTEX_SHADER source below
 *        Fragment → FRAGMENT_SHADER source below
 */

/* ═══════════════════════════════════
   VERTEX SHADER
   ═══════════════════════════════════ */
#ifdef VERTEX

#version 300 es
precision highp float;

/* Per-particle attributes */
in vec2  a_position;   /* x, y in clip space [-1, 1] */
in float a_size;       /* point size in px            */
in float a_opacity;    /* base opacity [0, 1]         */
in float a_phase;      /* sine phase offset           */
in vec3  a_color;      /* RGB color                   */

/* Uniforms */
uniform float u_time;      /* elapsed seconds    */
uniform vec2  u_resolution;/* viewport px        */
uniform float u_dpr;       /* device pixel ratio */

/* Varyings → fragment */
out float v_opacity;
out vec3  v_color;

void main() {
  /* Pulse opacity with individual phase */
  float pulse = sin(u_time * 1.2 + a_phase) * 0.12;
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
