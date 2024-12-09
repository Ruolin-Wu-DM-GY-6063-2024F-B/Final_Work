let myShader;    // For the 3D sphere
let myShader2;   // For the background pattern
let colorPicker;
let pg;           // Offscreen graphics for background

// Vertex shader used by both the sphere and background
let vert = `
// geometry vertex position provided by p5js.
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;
varying vec3 vVertexPos;

void main() {
  vTexCoord = aTexCoord;
  vVertexPos = aPosition;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition,1.0);
}
`;

// Fragment shader for the 3D sphere
let frag = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;

varying vec2 vTexCoord;
varying vec3 vVertexPos;

float random(in vec2 _st) {
  return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

float noise(in vec2 _st) {
  vec2 i = floor(_st);
  vec2 f = fract(_st);

  float a = random(i);
  float b = random(i+vec2(1.0,0.0));
  float c = random(i+vec2(0.0,1.0));
  float d = random(i+vec2(1.0,1.0));

  vec2 u = f*f*(3.0-2.0*f);

  return mix(a,b,u.x) +
         (c - a)*u.y*(1.0 - u.x) +
         (d - b)*u.x*u.y;
}

float fbm(in vec2 _st) {
  float value = 0.0;
  float scale = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

  for (int i = 0; i < 5; i++) {
    value += scale*noise(_st);
    _st = rot*_st*2.0+shift;
    scale *= 0.5;
  }
  return value;
}

void main() {
  vec2 st = vVertexPos.xy*2.0 + vec2(vVertexPos.z+1.0)*2.0;
  st += vec2(uTime*0.1);

  vec2 q = vec2(0.0);
  q.x = fbm(st);
  q.y = fbm(st + vec2(1.0));

  vec2 r = vec2(0.0);
  r.x = fbm(st + 1.0*q + vec2(1.7,9.2) + 0.15*uTime);
  r.y = fbm(st + 1.0*q + vec2(8.3,2.8) + 0.226*uTime);

  float f = fbm(st + r);

  vec3 baseColor = mix(
    vec3(0.1, 0.6, 0.6),
    vec3(0.6, 0.6, 0.4),
    clamp((f*f)*4.0,0.0,1.0)
  );

  vec3 color = mix(baseColor, uColor, 0.5);

  gl_FragColor = vec4((f*f*f+0.6*f*f+0.5*f)*color,1.0);
}
`;

// Fragment shader for the high-contrast, flowing background
let frag2 = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;

varying vec2 vTexCoord;
varying vec3 vVertexPos;

float random(in vec2 _st) {
  return fract(sin(dot(_st.xy,vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(in vec2 _st) {
  vec2 i = floor(_st);
  vec2 f = fract(_st);
  
  float a = random(i);
  float b = random(i + vec2(1.0,0.0));
  float c = random(i + vec2(0.0,1.0));
  float d = random(i + vec2(1.0,1.0));
  
  vec2 u = f*f*(3.0-2.0*f);
  
  return mix(a,b,u.x) +
         (c - a)*u.y*(1.0 - u.x) +
         (d - b)*u.x*u.y;
}

float fbm(vec2 st) {
  float value = 0.0;
  float scale = 0.5;
  vec2 shift = vec2(10.0);
  mat2 rot = mat2(cos(0.7), sin(0.7), -sin(0.7), cos(0.7));
  for (int i = 0; i < 5; i++) {
    value += noise(st)*scale;
    st = rot*st*2.0+shift;
    scale *= 0.5;
  }
  return value;
}

void main(){
  vec2 st = (gl_FragCoord.xy / uResolution.xy)*2.0 - 1.0;
  st.x *= uResolution.x / uResolution.y;

  float t = uTime*0.2;
  st.y += t;
  float angle = t*0.5;
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  st = rotation * st;

  float val = fbm(st*3.0);
  val = smoothstep(0.3, 0.7, val);

  vec3 colorA = vec3(0.05, 0.05, 0.05);
  vec3 colorB = vec3(1.0, 1.0, 1.0);
  colorB = mix(colorB, vec3(0.9,0.2,0.2), val*0.1);
  
  vec3 finalColor = mix(colorA, colorB, val);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function preload() {
  myShader = createShader(vert, frag);
  myShader2 = createShader(vert, frag2);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();

  colorPicker = createColorPicker('#ff0000'); 
  colorPicker.position(10, 10);

  // Create offscreen buffer for background
  pg = createGraphics(windowWidth, windowHeight, WEBGL);
  pg.noStroke();
}

function draw() {
  background(0);

  // Render background pattern to pg
  pg.shader(myShader2);
  myShader2.setUniform("uTime", millis()/1000.0);
  myShader2.setUniform("uResolution", [width, height]);
  
  pg.rectMode(CENTER);
  pg.rect(0, 0, width, height);

  // Render pg to main canvas (2D mode)
  resetMatrix();
  ortho();
  push();
  texture(pg);
  translate(-width/2, -height/2, -500);
  rect(0, 0, width, height);
  pop();

  // Render the 3D sphere on top
  let pickedColor = colorPicker.color();
  let colorArray = [
    red(pickedColor)/255.0,
    green(pickedColor)/255.0,
    blue(pickedColor)/255.0
  ];

  shader(myShader);
  myShader.setUniform("uTime", millis()/1000.0);
  myShader.setUniform("uResolution", [width, height]);
  myShader.setUniform("uColor", colorArray);

  orbitControl();
  sphere(300);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg.resizeCanvas(windowWidth, windowHeight);
}
