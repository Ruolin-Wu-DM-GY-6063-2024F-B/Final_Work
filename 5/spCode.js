export const spCode = `
setMaxReflections(2)

function gyroid(scale) {
  let s = getSpace();
  s = s * scale;
  return dot(sin(s), cos(vec3(s.z, s.x, s.y) + PI)) / scale ;
}

setStepSize(0.9);
shine(.4);
metal(.6);

// I dont know why this change the shadepark do not respond
let gyScale = input("gyScale", 6.8, 3, 10);
let gy = gyroid(gyScale);
let n = vectorContourNoise(getSpace() + vec3(0, 0, time * 0.1), 0.04 + gy * 0.1, 1.2);
n = pow(sin(n * 2.0)*0.5 + 0.5, vec3(4.0));
color(n);

shape(() => {
  rotateX(time * 0.1);
  mirrorN(6.1, 0.02);
  sphere(0.02);
})();
difference();
setSDF(gy);
`;
