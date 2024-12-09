export const spCode = `
setMaxIterations(400);
setStepSize(0.01);
rotateY(time);
let n = noise(getSpace() * 40 + time + 10000000);
color(vec3(0, 0, .5) + normal * .2);
shine(n);
metal(1);
rotateX(PI/2);
torus(.3, .03);
`;
