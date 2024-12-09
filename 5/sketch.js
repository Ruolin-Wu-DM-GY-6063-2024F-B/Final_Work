let myShader;    
let spRenderer; // Shader Park Renderer from index.html scope?
let mSerial;
let connectButton;

let sum = 0; // 累计force值
let lastSend = 0;

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
  mat2 rot = mat2(cos(0.5), sin(0.5),
                  -sin(0.5), cos(0.5));
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

function setup() {
  setAttributes('alpha', true);
  let c = createCanvas(windowWidth, windowHeight, WEBGL);
  c.style('position', 'absolute');
  c.style('top', '0');
  c.style('left', '0');
  c.style('z-index', '1');
  c.style('background', 'transparent');
  noStroke();

  myShader = createShader(vert, frag);

  mSerial = createSerial();
  connectButton = createButton("Connect To Serial");
  connectButton.position(100, 100);
  connectButton.style('z-index','3');
  connectButton.mousePressed(() => {
    if (!mSerial.opened()) {
      mSerial.open(9600);
      connectButton.hide();
    }
  });

  mSerial.onData(gotSerialData);
}

function gotSerialData() {
  let line = mSerial.readLine();
  if (!line) return;
  try {
    let json = JSON.parse(line);
    if (json.forceVal !== undefined && json.potVal !== undefined) {
      let forceVal = json.forceVal;
      let potVal = json.potVal;

      let gyScaleVal = map(forceVal, 0, 1023, 3, 10);

    
      if (window.spRenderer) {
        window.spRenderer.setInput('gyScale', gyScaleVal);
      }


      let hueVal = map(potVal, 0, 1023, 0, 360);
      let col = color(`hsl(${hueVal},100%,50%)`);

      // 累加force
      sum += forceVal;
      if (sum > 1000) {
       
        sum = 0;
      }
      let ledVal = map(sum, 0, 1000, 0, 255);
      sendToArduino({led: Math.floor(ledVal)});
      
      let r = red(col)/255.0;
      let g = green(col)/255.0;
      let b = blue(col)/255.0;
      myShader.setUniform("uColor", [r,g,b]);
    }
  } catch (e) {
 
  }
}

function draw() {

  clear(); 
  if (sum <= 0) {
   
    background(0);
  }

  myShader.setUniform("uTime", millis()/1000.0); 
  myShader.setUniform("uResolution", [width, height]);

  shader(myShader);

  orbitControl();
  sphere(300);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function sendToArduino(data) {
  if (mSerial.opened()) {
    mSerial.write(JSON.stringify(data));
    mSerial.write("\n");
  }
}