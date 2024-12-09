// shader.frag
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_metaballs[12];
varying vec2 vTexCoord;

float metaball(vec2 p, vec2 center, float radius) {
  return radius / length(p - center);
}

void main() {
  vec2 uv = vTexCoord;
  float intensity = 0.0;

  for (int i = 0; i < 12; i++) {
    vec2 center = u_metaballs[i].xy;
    float radius = u_metaballs[i].z;
    intensity += metaball(uv, center, radius);
  }

  float t = clamp(intensity * 0.8, 0.0, 1.0);
  vec3 baseColor = vec3(0.05, 0.05, 0.05);
  vec3 variation = 0.02 * vec3(
    sin(u_time + intensity * 5.0),
    cos(u_time + intensity * 4.0),
    sin(u_time + intensity * 3.0)
  );

  vec3 color = baseColor + variation * t;
  float alpha = smoothstep(0.3, 1.0, intensity);

  gl_FragColor = vec4(color, alpha);
}
