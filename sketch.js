// let myShader;
// let colorPicker;

// function setup() {
//   createCanvas(windowWidth, windowHeight, WEBGL);
//   noStroke();

//   // 创建颜色选择器，用于动态改变颜色
//   colorPicker = createColorPicker('#ff0000'); // 初始颜色为红色
//   colorPicker.position(10, 10);

//   // 初始化 Shader
//   myShader = createShader(vert, frag);
// }

// function draw() {
//   background(0);

//   // 获取颜色选择器的值
//   let pickedColor = colorPicker.color();
//   let colorArray = [
//     red(pickedColor) / 255.0,
//     green(pickedColor) / 255.0,
//     blue(pickedColor) / 255.0,
//   ];

//   // 应用 Shader
//   shader(myShader);

//   // 更新 Shader Uniforms
//   myShader.setUniform("uTime", millis() / 1000.0); // 动态时间
//   myShader.setUniform("uResolution", [width, height]); // 分辨率
//   myShader.setUniform("uColor", colorArray); // 用户选择的颜色

//   // 控制交互
//   orbitControl();

//   // 绘制几何体
//   sphere(300); // 使用球体
// }

// let vert = `
// // geometry vertex position provided by p5js.
// attribute vec3 aPosition;
// attribute vec2 aTexCoord;

// uniform mat4 uModelViewMatrix;
// uniform mat4 uProjectionMatrix;

// varying vec2 vTexCoord;
// varying vec3 vVertexPos;

// void main() {
//   vTexCoord = aTexCoord;
//   vVertexPos = aPosition;

//   vec4 pos = vec4(aPosition, 1.0);
//   gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
// }
// `;

// let frag = `
// precision mediump float;

// uniform float uTime;
// uniform vec2 uResolution;
// uniform vec3 uColor; // 新增的颜色 Uniform

// varying vec2 vTexCoord;
// varying vec3 vVertexPos;

// // 随机生成函数
// float random(in vec2 _st) {
//   return fract(sin(dot(_st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
// }

// // 噪声生成函数
// float noise(in vec2 _st) {
//   vec2 i = floor(_st);
//   vec2 f = fract(_st);

//   float a = random(i);
//   float b = random(i + vec2(1.0, 0.0));
//   float c = random(i + vec2(0.0, 1.0));
//   float d = random(i + vec2(1.0, 1.0));

//   vec2 u = f * f * (3.0 - 2.0 * f);

//   return mix(a, b, u.x) +
//          (c - a) * u.y * (1.0 - u.x) +
//          (d - b) * u.x * u.y;
// }

// // 分形噪声生成
// float fbm(in vec2 _st) {
//   float value = 0.0;
//   float scale = 0.5;
//   vec2 shift = vec2(100.0);
//   mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

//   for (int i = 0; i < 5; i++) {
//     value += scale * noise(_st);
//     _st = rot * _st * 2.0 + shift;
//     scale *= 0.5;
//   }
//   return value;
// }

// void main() {
//   vec2 st = vVertexPos.xy * 2.0 + vec2(vVertexPos.z + 1.0) * 2.0;

//   st += vec2(uTime * 0.1); // 添加时间动态

//   vec2 q = vec2(0.0);
//   q.x = fbm(st);
//   q.y = fbm(st + vec2(1.0));

//   vec2 r = vec2(0.0);
//   r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
//   r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.226 * uTime);

//   float f = fbm(st + r);

//   vec3 baseColor = mix(
//     vec3(0.1, 0.6, 0.6),
//     vec3(0.6, 0.6, 0.4),
//     clamp((f * f) * 4.0, 0.0, 1.0)
//   );

//   // 与用户选择的颜色混合
//   vec3 color = mix(baseColor, uColor, 0.5);

//   gl_FragColor = vec4((f * f * f + 0.6 * f * f + 0.5 * f) * color, 1.0);
// }
// `;

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }

let myShader;

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	noStroke();
	// Use createShader in setup rather than loadShader in preload because we're
	// using shader programs that are declared in javascript as strings.
	// NOTE: it is important that this come after createCanvas is called.
	myShader = createShader(vert, frag);
}

function draw() {
	background(255);
	
	shader(myShader);

	// These correspond to the custom uniforms declared in our fragment shader.
	myShader.setUniform("uTime", millis() / 1000.0);
	myShader.setUniform("uResolution", [width, height]);
	
	orbitControl(2, 2, 0.01);
	
	// Draw some geometry to the screen
	box(200);
}

let vert = `
// geometry vertex position provided by p5js.
attribute vec3 aPosition;
// vertex texture coordinate provided by p5js.
attribute vec2 aTexCoord;

// Built in p5.js uniforms
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// Varying values passed to our fragment shader
varying vec2 vTexCoord;
varying vec3 vVertexPos;

void main() {
  vTexCoord = aTexCoord;
	vVertexPos = aPosition;
	
  vec4 pos = vec4(aPosition, 1.0);
	
	// Apply the ModelView and Projection matricies
  gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
}
`;

let frag = `
// set the default precision for float variables
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;

varying vec2 vTexCoord;
varying vec3 vVertexPos;

float random(in vec2 _st) {
  return fract(sin(dot(_st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(in vec2 _st) {
  vec2 i = floor(_st);
  vec2 f = fract(_st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm(in vec2 _st) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  // Rotate to reduce axial bias
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	
	// OpenProcessing.org NOTE: Becuase this shader contains a for loop,
	// the Loop Protection feature must be disabled in the sketch editor.
  for (int i = 0; i < NUM_OCTAVES; ++i) {
    v += a * noise(_st);
    _st = rot * _st * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 st = vVertexPos.xy * 4. + vec2(vVertexPos.z + 1., vVertexPos.z + 1.) * 2.;

  vec2 q = vec2(0.0);
  q.x = fbm( st );
  q.y = fbm( st + vec2(1.0) );

  vec2 r = vec2(0.);
  r.x = fbm( st + 1.0*q + vec2(1.7,9.2) + 0.15*uTime );
  r.y = fbm( st + 1.0*q + vec2(8.3,2.8) + 0.226*uTime );

  float f = fbm(st+r);

  vec3 color = mix(
		vec3(0.101961,0.619608,0.666667),
    vec3(0.666667,0.666667,0.498039),
    clamp((f*f)*4.0,0.0,1.0)
	);

  color = mix(
	  color,
    vec3(0,0,0.164706),
    clamp(length(q),0.0,1.0)
	);

  color = mix(
		color,
    vec3(0.666667,1,1),
    clamp(length(r.x),0.0,1.0)
	);
  
	// Specify the color for the current pixel.
  gl_FragColor = vec4((f*f*f + .6*f*f + .5*f) * color, 1.0);
}
`;