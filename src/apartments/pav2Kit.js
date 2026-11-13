// Furniture + landscape kit for the 2º pavimento (leisure floor), modelled on the brochure renders:
// fitness (p. "Fitness c/ sala multifuncional"), espaço gourmet, salão de festas, espaço jogos,
// churrasqueira, brinquedoteca, spa e sauna seca, piscina adulto.
// Every builder works in local metres, footprint centred on the origin, FRONT facing +z.
import * as THREE from 'three';
import {
  P, canvasTex, cylinder, fabric, marble, mesh, phys, rb, std, velvet,
} from '../engine/core.js';

// ---------------------------------------------------------------------------
// MATERIALS
// ---------------------------------------------------------------------------
export const K2 = {
  gymBlack: std({ color: '#1d1e20', roughness: 0.42, metalness: 0.65 }),
  rubber: std({ color: '#121314', roughness: 0.95 }),
  caramel: phys({ color: '#a77b4f', roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5 }),   // gym upholstery (render: tan leather)
  plate: std({ color: '#26272a', roughness: 0.6, metalness: 0.4 }),
  chrome: std({ color: '#d4d7da', roughness: 0.2, metalness: 1 }),
  console: std({ color: '#0e1a22', emissive: '#3a8fb8', emissiveIntensity: 0.55, roughness: 0.3 }),
  travertine: phys({ map: marble('#e2d6c2', '170,150,120', 0.25), roughness: 0.35, clearcoat: 0.3 }),
  oakLight: phys({ map: (() => { const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#c99a63'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(${130 + Math.random() * 30 | 0},${90 + Math.random() * 25 | 0},50,0.1)`; g.lineWidth = 0.6 + Math.random(); const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 2); g.stroke(); } }); return t; })(), roughness: 0.45, clearcoat: 0.2 }),
  darkWood: phys({ color: '#5a3e2c', roughness: 0.45, clearcoat: 0.25 }),
  grayUph: fabric('#a7a39b', 1.4),
  slateUph: fabric('#7c8790', 1.4),
  blueUph: velvet('#3c5d93', '#8fb0e6'),
  navy: fabric('#1f2b4d', 1.3),
  terracottaUph: fabric('#b45b38', 1.6),
  orangePouf: velvet('#c26a35', '#f0a070'),
  pinkSoft: velvet('#e8b3a6', '#ffe0d8'),
  beigeCush: fabric('#d9cdb8', 1.5),
  concreteSmooth: std({ color: '#b7b2aa', roughness: 0.75 }),
  steelHood: std({ color: '#c3c6c9', roughness: 0.22, metalness: 1 }),
  ovenWhite: std({ color: '#e9e4dc', roughness: 0.9 }),
  charcoal: std({ color: '#2c2d2f', roughness: 0.8 }),
  ppTop: std({ color: '#3a3a38', roughness: 0.55 }),
  felt: std({ color: '#2f7a3a', roughness: 0.95 }),
  awningRed: std({ color: '#b56a55', roughness: 0.8, side: THREE.DoubleSide }),
  awningWhite: std({ color: '#f4efe6', roughness: 0.8, side: THREE.DoubleSide }),
  mushroomRed: std({ color: '#b7442f', roughness: 0.6 }),
  mushroomStem: std({ color: '#f1e9d8', roughness: 0.8 }),
  ball: std({ color: '#f5f3ee', roughness: 0.35 }),
  palmTrunk: std({ color: '#8c7a62', roughness: 1 }),
  frond: std({ color: '#4f7b34', roughness: 0.7, side: THREE.DoubleSide }),
  frond2: std({ color: '#67913f', roughness: 0.7, side: THREE.DoubleSide }),
  shrub: std({ color: '#3f6a2e', roughness: 0.9 }),
  shrub2: std({ color: '#5a8a3c', roughness: 0.9 }),
  lavender: std({ color: '#7a68b8', roughness: 0.8 }),
  monstera: std({ color: '#2f5a28', roughness: 0.6, side: THREE.DoubleSide }),
  canvasBeige: std({ color: '#efe6d4', roughness: 0.9, side: THREE.DoubleSide }),
  tatamiBlue: std({ color: '#2d4a7a', roughness: 0.9 }),
  tatamiBlack: std({ color: '#1f2226', roughness: 0.9 }),
  rope: fabric('#c8b08a', 2),
  matGreen: std({ color: '#5d6b4f', roughness: 0.95 }),
};

// frame helpers: a square (or round) tube between two points, and a pad centred on a point, tilted about x
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function tube(g, a, b, s, mat, round = false) {
  const A = V3(...a), B = V3(...b), d = B.clone().sub(A), len = d.length();
  const m = new THREE.Mesh(round ? new THREE.CylinderGeometry(s / 2, s / 2, len, 12) : new THREE.BoxGeometry(s, len, s), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function pad(g, w, h, d, mat, x, y, z, rx = 0, r = 0.03) {
  const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.x = rx; rb(p, w, h, d, mat, 0, -h / 2, 0, r); g.add(p); return p;
}
const shroudM = std({ color: '#585c62', roughness: 0.35, metalness: 0.55 });
function weightTower(g, x, z, h = 2.0, w = 0.3) {      // open tube frame, plate stack on chrome guide rods, shroud behind (−z)
  const k = K2;
  for (const s of [-1, 1]) tube(g, [x + s * w, 0, z], [x + s * w, h, z], 0.08, k.gymBlack);
  for (const y of [0.04, h - 0.04]) tube(g, [x - w - 0.04, y, z], [x + w + 0.04, y, z], 0.08, k.gymBlack);
  rb(g, w * 1.2, 0.8, 0.15, k.plate, x, 0.08, z, 0.008);
  for (let i = 1; i < 10; i++) rb(g, w * 1.2 + 0.004, 0.006, 0.154, k.gymBlack, x, 0.08 + i * 0.08, z, 0.001);   // plate seams
  rb(g, w * 1.25, 0.04, 0.17, k.chrome, x, 0.88, z, 0.005);                               // head plate
  for (const s of [-1, 1]) tube(g, [x + s * w * 0.42, 0.08, z], [x + s * w * 0.42, h - 0.08, z], 0.02, k.chrome, true);
  tube(g, [x, 0.92, z], [x, 1.55, z], 0.02, k.chrome, true);                             // selector rod
  rb(g, w * 2 + 0.04, h - 0.3, 0.015, shroudM, x, 0.15, z - 0.09, 0.004);
  mesh(g, new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24), k.chrome, x, h - 0.14, z + 0.07, 0, 0, Math.PI / 2);
}

// ---------------------------------------------------------------------------
// FITNESS
// ---------------------------------------------------------------------------
export function treadmillB() {                         // user faces +z (console end)
  const g = new THREE.Group(), k = K2;
  for (const sx of [-1, 1]) for (const z of [-0.95, 0.72]) rb(g, 0.08, 0.05, 0.1, k.rubber, sx * 0.36, 0, z, 0.01);
  rb(g, 0.8, 0.14, 1.75, k.gymBlack, 0, 0.05, -0.15, 0.04);                                // deck
  rb(g, 0.54, 0.02, 1.6, k.rubber, 0, 0.19, -0.17, 0.005);                                  // belt
  for (const s of [-1, 1]) rb(g, 0.12, 0.02, 1.62, k.plate, s * 0.335, 0.19, -0.16, 0.005);  // foot rails
  rb(g, 0.84, 0.24, 0.4, k.gymBlack, 0, 0.05, 0.8, 0.08);                                   // motor hood
  for (const s of [-1, 1]) {
    tube(g, [s * 0.37, 0.25, 0.88], [s * 0.37, 1.22, 0.66], 0.07, k.gymBlack);               // uprights
    tube(g, [s * 0.37, 1.08, 0.7], [s * 0.34, 1.05, 0.22], 0.04, k.gymBlack, true);          // side handrails
  }
  tube(g, [-0.3, 1.16, 0.52], [0.3, 1.16, 0.52], 0.035, k.gymBlack, true);                  // grab bar
  const c = pad(g, 0.82, 0.07, 0.36, k.gymBlack, 0, 1.28, 0.64, -0.55);                    // console
  rb(c, 0.52, 0.012, 0.22, k.console, 0, 0.035, 0, 0.004);
  return g;
}
export function bikeB() {                              // upright bike, rider faces +z
  const g = new THREE.Group(), k = K2;
  for (const z of [-0.45, 0.42]) rb(g, 0.5, 0.06, 0.08, k.gymBlack, 0, 0, z, 0.02);
  tube(g, [0, 0.09, -0.45], [0, 0.09, 0.42], 0.07, k.gymBlack);
  mesh(g, new THREE.CylinderGeometry(0.27, 0.27, 0.13, 32), k.gymBlack, 0, 0.42, 0.2, 0, 0, Math.PI / 2);   // flywheel cover
  mesh(g, new THREE.CylinderGeometry(0.09, 0.09, 0.14, 24), k.chrome, 0, 0.42, 0.2, 0, 0, Math.PI / 2);
  tube(g, [0, 0.09, 0.38], [0, 1.02, 0.3], 0.07, k.gymBlack);                               // handlebar column
  tube(g, [0, 0.09, -0.1], [0, 0.88, -0.32], 0.06, k.gymBlack);                             // seat post
  rb(g, 0.26, 0.08, 0.3, k.caramel, 0, 0.88, -0.34, 0.035);
  mesh(g, new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16), k.chrome, 0, 0.35, 0.02, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    const ey = 0.35 + s * 0.15, ez = 0.02 - s * 0.05;
    tube(g, [s * 0.1, 0.35, 0.02], [s * 0.1, ey, ez], 0.03, k.gymBlack);
    rb(g, 0.1, 0.025, 0.12, k.rubber, s * 0.16, ey - 0.012, ez, 0.008);
    tube(g, [s * 0.22, 1.04, 0.3], [s * 0.2, 1.08, 0.08], 0.03, k.rubber, true);            // handlebar horns
  }
  tube(g, [-0.22, 1.04, 0.3], [0.22, 1.04, 0.3], 0.035, k.gymBlack, true);
  const c = pad(g, 0.24, 0.04, 0.18, k.gymBlack, 0, 1.13, 0.33, -0.6, 0.015);
  rb(c, 0.18, 0.008, 0.12, k.console, 0, 0.02, 0, 0.003);
  return g;
}
export function ellipticalB() {                        // user faces +z
  const g = new THREE.Group(), k = K2;
  rb(g, 0.5, 0.08, 1.75, k.gymBlack, 0, 0, -0.1, 0.03);
  mesh(g, new THREE.CylinderGeometry(0.07, 0.07, 0.4, 16), k.gymBlack, 0, 0.12, -0.8, 0, 0, Math.PI / 2);   // rear rollers
  rb(g, 0.34, 0.62, 0.42, k.gymBlack, 0, 0.06, 0.62, 0.12);                                 // flywheel housing
  tube(g, [0, 0.6, 0.7], [0, 1.38, 0.6], 0.07, k.gymBlack);                                 // console mast
  const c = pad(g, 0.34, 0.05, 0.22, k.gymBlack, 0, 1.42, 0.58, -0.6, 0.02);
  rb(c, 0.26, 0.008, 0.15, k.console, 0, 0.025, 0, 0.003);
  for (const s of [-1, 1]) {
    tube(g, [s * 0.13, 0.16, -0.78], [s * 0.13, 0.4, 0.48], 0.05, k.gymBlack);              // pedal arms
    rb(g, 0.15, 0.04, 0.4, k.rubber, s * 0.13, 0.27, -0.3, 0.015);                          // foot plates
    tube(g, [s * 0.2, 0.42, 0.45], [s * 0.24, 1.65, 0.28], 0.045, k.gymBlack, true);        // moving handles
    tube(g, [s * 0.21, 1.05, 0.38], [0, 1.05, 0.63], 0.04, k.gymBlack);                     // handle pivot to mast
  }
  return g;
}
export function stackMachineB(kind = 'upright') {      // selectorised machine: weight tower at the back (−z), user faces +z
  const g = new THREE.Group(), k = K2, zt = kind === 'long' ? -0.8 : -0.5, zf = kind === 'long' ? 0.85 : 0.6;
  weightTower(g, 0, zt);
  tube(g, [0, 0.05, zt], [0, 0.05, zf], 0.09, k.gymBlack);                                  // floor beam
  rb(g, 0.6, 0.05, 0.08, k.gymBlack, 0, 0, zf, 0.02);                                       // front foot
  if (kind === 'upright') {                           // chest / shoulder press
    tube(g, [0, 0.05, 0.14], [0, 0.46, 0.14], 0.07, k.gymBlack);
    rb(g, 0.42, 0.09, 0.42, k.caramel, 0, 0.46, 0.15, 0.04);
    tube(g, [0, 0.05, -0.2], [0, 1.25, -0.3], 0.08, k.gymBlack);
    pad(g, 0.4, 0.66, 0.09, k.caramel, 0, 0.95, -0.22, -0.12, 0.04);
    for (const s of [-1, 1]) {
      tube(g, [s * 0.3, 1.85, zt + 0.06], [s * 0.36, 1.12, 0.38], 0.06, k.gymBlack);        // press arms from the top pivot
      tube(g, [s * 0.36, 1.0, 0.38], [s * 0.36, 1.24, 0.38], 0.035, k.rubber, true);         // grips
    }
  } else if (kind === 'long') {                       // seated leg press
    tube(g, [0, 0.05, 0], [0, 0.42, 0], 0.07, k.gymBlack);
    rb(g, 0.46, 0.09, 0.5, k.caramel, 0, 0.42, -0.05, 0.04);
    tube(g, [0, 0.05, -0.45], [0, 0.95, -0.52], 0.08, k.gymBlack);
    pad(g, 0.46, 0.75, 0.09, k.caramel, 0, 0.84, -0.42, -0.5, 0.04);
    tube(g, [0, 0.05, 0.78], [0, 0.55, 0.64], 0.08, k.gymBlack);
    pad(g, 0.6, 0.5, 0.05, k.gymBlack, 0, 0.66, 0.68, 0.35, 0.015);                          // foot plate
    for (const s of [-1, 1]) {
      tube(g, [s * 0.3, 0.05, -0.05], [s * 0.3, 0.5, -0.05], 0.04, k.gymBlack);
      tube(g, [s * 0.3, 0.5, -0.22], [s * 0.3, 0.5, 0.14], 0.035, k.rubber, true);
    }
  } else {                                            // lat pulldown
    tube(g, [0, 0.05, 0.2], [0, 0.48, 0.2], 0.07, k.gymBlack);
    rb(g, 0.42, 0.09, 0.4, k.caramel, 0, 0.48, 0.2, 0.04);
    tube(g, [0, 0.05, 0.5], [0, 0.82, 0.42], 0.07, k.gymBlack);
    for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.07, 0.07, 0.2, 20), k.caramel, s * 0.14, 0.82, 0.42, 0, 0, Math.PI / 2);   // knee rollers
    tube(g, [0, 1.96, zt], [0, 2.22, 0.25], 0.08, k.gymBlack);                              // top boom
    tube(g, [0, 2.2, 0.25], [0, 1.78, 0.25], 0.008, k.chrome, true);                        // cable
    tube(g, [-0.5, 1.76, 0.25], [0.5, 1.76, 0.25], 0.028, k.chrome, true);                  // lat bar
    for (const s of [-1, 1]) tube(g, [s * 0.5, 1.76, 0.25], [s * 0.62, 1.64, 0.25], 0.032, k.rubber, true);
  }
  return g;
}
export function benchB(incline = 0.35) {               // adjustable bench, head end +z
  const g = new THREE.Group(), k = K2;
  for (const z of [-0.6, 0.6]) rb(g, 0.5, 0.06, 0.08, k.gymBlack, 0, 0, z, 0.02);           // stabilisers
  for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), k.rubber, s * 0.2, 0.04, 0.66, 0, 0, Math.PI / 2);
  tube(g, [0, 0.06, -0.6], [0, 0.3, -0.42], 0.07, k.gymBlack);
  tube(g, [0, 0.06, 0.6], [0, 0.3, 0.42], 0.07, k.gymBlack);
  tube(g, [0, 0.3, -0.46], [0, 0.3, 0.46], 0.07, k.gymBlack);                               // spine
  tube(g, [0, 0.3, -0.3], [0, 0.44, -0.3], 0.06, k.gymBlack);                               // seat post
  rb(g, 0.3, 0.07, 0.4, k.caramel, 0, 0.44, -0.32, 0.03);
  const hz = -0.1, hy = 0.44;
  tube(g, [0, 0.3, hz], [0, hy, hz], 0.06, k.gymBlack);                                     // hinge post
  const back = new THREE.Group(); back.position.set(0, hy, hz); back.rotation.x = -incline; g.add(back);
  rb(back, 0.3, 0.07, 0.85, k.caramel, 0, 0, 0.44, 0.03);
  rb(back, 0.08, 0.03, 0.6, k.gymBlack, 0, -0.03, 0.4, 0.01);                               // pad rail
  const d = 0.5, pz = hz + d * Math.cos(incline), py = hy + d * Math.sin(incline) - 0.03;
  tube(g, [0, 0.3, pz], [0, py, pz], 0.06, k.gymBlack);                                     // ladder strut under the back pad
  return g;
}
export function benchPressB() {                         // flat bench with bar uprights at the head end (+z)
  const g = benchB(0), k = K2;
  for (const s of [-1, 1]) {
    rb(g, 0.08, 0.05, 0.6, k.gymBlack, s * 0.55, 0, 0.75, 0.01);
    tube(g, [s * 0.55, 0.05, 0.78], [s * 0.55, 1.25, 0.78], 0.07, k.gymBlack);
    rb(g, 0.07, 0.06, 0.12, k.gymBlack, s * 0.55, 1.0, 0.71, 0.01);                          // J-hooks
  }
  tube(g, [-0.55, 0.05, 0.78], [0.55, 0.05, 0.78], 0.06, k.gymBlack);
  barbell(g, 1.08, 0.7, 2.1, 2);
  return g;
}
function barbell(g, y, z, len = 2.1, plates = 2) {
  const k = K2;
  mesh(g, new THREE.CylinderGeometry(0.014, 0.014, len, 10), k.chrome, 0, y, z, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) for (let i = 0; i < plates; i++)
    mesh(g, new THREE.CylinderGeometry(0.22 - i * 0.04, 0.22 - i * 0.04, 0.045, 28), k.plate, s * (len / 2 - 0.2 - i * 0.05), y, z, 0, 0, Math.PI / 2);
}
export function powerRackB() {                         // power rack / cage, open side +z
  const g = new THREE.Group(), k = K2, W = 0.6;
  rb(g, 1.4, 0.03, 1.4, k.rubber, 0, 0, 0, 0.01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube(g, [sx * W, 0.03, sz * W], [sx * W, 2.3, sz * W], 0.075, k.gymBlack);
  for (const sz of [-1, 1]) tube(g, [-W, 2.27, sz * W], [W, 2.27, sz * W], 0.075, k.gymBlack);
  for (const sx of [-1, 1]) {
    tube(g, [sx * W, 2.27, -W], [sx * W, 2.27, W], 0.075, k.gymBlack);
    tube(g, [sx * W, 0.07, -W], [sx * W, 0.07, W], 0.075, k.gymBlack);                       // base runners
    rb(g, 0.08, 0.06, 0.14, k.gymBlack, sx * W, 1.38, W + 0.05, 0.01);                       // J-hooks
    tube(g, [sx * W, 0.75, W], [sx * W, 0.75, W + 0.4], 0.06, k.gymBlack);                   // safety arms
    tube(g, [sx * W, 0.45, -W], [sx * (W + 0.3), 0.45, -W], 0.05, k.gymBlack, true);         // plate horns
    for (let i = 0; i < 3; i++) mesh(g, new THREE.CylinderGeometry(0.22 - i * 0.04, 0.22 - i * 0.04, 0.045, 28), k.plate, sx * (W + 0.08 + i * 0.06), 0.45, -W, 0, 0, Math.PI / 2);
  }
  barbell(g, 1.47, W + 0.08, 2.1, 2);
  return g;
}
export function cableCrossB() {                        // functional trainer: two weight towers, adjustable pulleys, pull-up bar
  const g = new THREE.Group(), k = K2, X = 0.85, h = 2.25;
  for (const s of [-1, 1]) {
    const x = s * X;
    weightTower(g, x, -0.1, h, 0.17);
    tube(g, [x, 0.05, 0.1], [x, h - 0.1, 0.1], 0.07, k.gymBlack);                            // pulley column
    rb(g, 0.12, 0.18, 0.1, k.gymBlack, x, 1.22, 0.17, 0.02);                                // carriage
    mesh(g, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), k.chrome, x, 1.3, 0.25, 0, 0, Math.PI / 2);
    tube(g, [x, 1.26, 0.28], [x, 1.02, 0.3], 0.008, k.chrome, true);                         // cable
    tube(g, [x - 0.07, 1.0, 0.3], [x + 0.07, 1.0, 0.3], 0.03, k.rubber, true);               // D-handle grip
    tube(g, [x, h - 0.04, -0.1], [x, h - 0.1, 0.28], 0.06, k.gymBlack);                      // pull-up arms
    tube(g, [x, 0.03, -0.25], [x, 0.03, 0.3], 0.06, k.gymBlack);
  }
  tube(g, [-X - 0.2, h - 0.04, -0.1], [X + 0.2, h - 0.04, -0.1], 0.09, k.gymBlack);          // top beam
  tube(g, [-X, h - 0.1, 0.28], [X, h - 0.1, 0.28], 0.04, k.chrome, true);                    // pull-up bar
  tube(g, [-X, 0.03, 0.3], [X, 0.03, 0.3], 0.06, k.gymBlack);
  return g;
}
export function dumbbellRackB(w) {
  const g = new THREE.Group(), k = K2, n = Math.floor(w / 0.24);
  for (const s of [-1, 1]) rb(g, 0.05, 0.75, 0.5, k.gymBlack, s * (w / 2 - 0.03), 0, 0, 0.01);
  for (const [y, z] of [[0.35, 0.1], [0.68, -0.08]]) {
    rb(g, w, 0.03, 0.22, k.gymBlack, 0, y, z, 0.01, 0.2);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.15 + i * (w - 0.3) / Math.max(1, n - 1), r = 0.045 + (i / n) * 0.035;
      mesh(g, new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), k.chrome, x, y + 0.08, z, Math.PI / 2, 0, 0);
      for (const e of [-1, 1]) mesh(g, new THREE.CylinderGeometry(r, r, 0.05, 6), k.plate, x, y + 0.08, z + e * 0.09, Math.PI / 2, 0, 0);
    }
  }
  return g;
}
export function punchBagB() {
  const g = new THREE.Group();
  cylinder(g, 0.17, 0.17, 1.05, std({ color: '#7a2b22', roughness: 0.6 }), 0, 0.85, 0, 24);
  mesh(g, new THREE.CylinderGeometry(0.004, 0.004, 0.75, 6), K2.chrome, 0, 2.28, 0);
  return g;
}
export function medBallsB() {
  const g = new THREE.Group();
  for (const [x, c] of [[-0.18, '#c9c7c2'], [0.18, '#d6d4cf']]) mesh(g, new THREE.SphereGeometry(0.16, 24, 16), std({ color: c, roughness: 0.7 }), x, 0.16, 0);
  return g;
}

// ---------------------------------------------------------------------------
// GOURMET / SALÃO / JOGOS – seating and tables
// ---------------------------------------------------------------------------
export function oakChairB(cush = K2.grayUph) {          // light-oak dining chair, curved back rail, upholstered seat + back pad (gourmet render)
  const g = new THREE.Group(), k = K2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.018, 0.015, 0.45, 10), k.oakLight, sx * 0.2, 0.225, sz * 0.19, -sz * 0.05, 0, sx * 0.03);   // feet splay slightly outwards
  rb(g, 0.48, 0.035, 0.46, k.oakLight, 0, 0.43, 0, 0.012);
  rb(g, 0.44, 0.07, 0.42, cush, 0, 0.46, 0.01, 0.03);
  for (const s of [-1, 1]) rb(g, 0.035, 0.38, 0.035, k.oakLight, s * 0.21, 0.45, -0.21, 0.01, -0.08);
  const rail = []; for (let i = 0; i <= 16; i++) { const t = i / 16 * Math.PI; rail.push(new THREE.Vector3(0.21 * Math.cos(t), 0.83, -0.21 - 0.07 * Math.sin(t))); }
  mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail), 24, 0.02, 8), k.oakLight);   // curved top rail wrapping the back, resting on the back posts
  rb(g, 0.4, 0.22, 0.05, cush, 0, 0.58, -0.22, 0.02, -0.1);
  return g;
}
export function uphChairB(cush = K2.slateUph, leg = P.walnut) {   // salão chair (render): walnut frame, upholstered seat, curved upholstered back
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.017, 0.013, 0.45, 10), leg, sx * 0.2, 0.225, sz * 0.19, -sz * 0.05, 0, sx * 0.03);   // feet splay slightly outwards
  rb(g, 0.46, 0.04, 0.44, leg, 0, 0.42, 0, 0.01);                                             // seat frame
  rb(g, 0.46, 0.07, 0.44, cush, 0, 0.455, 0.01, 0.03);                                        // seat cushion
  for (const s of [-1, 1]) rb(g, 0.03, 0.44, 0.03, leg, s * 0.205, 0.45, -0.205, 0.008, -0.1);   // back posts
  rb(g, 0.42, 0.3, 0.05, cush, 0, 0.6, -0.215, 0.022, -0.1);                                  // upholstered back panel between the posts
  return g;
}
export function barStoolB(seat = K2.grayUph) {
  const g = new THREE.Group(), k = K2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(g, 0.016, 0.016, 0.72, k.oakLight, sx * 0.16, 0, sz * 0.16, 10);   // straight vertical legs
  rb(g, 0.34, 0.02, 0.02, k.oakLight, 0, 0.25, 0.16, 0.005);                                                     // footrest rail
  rb(g, 0.4, 0.07, 0.38, seat, 0, 0.72, 0, 0.03);
  rb(g, 0.38, 0.2, 0.04, seat, 0, 0.82, -0.19, 0.02, -0.1);
  return g;
}
export function pedestalRoundB(r = 0.55, top = P.walnut, base = P.walnut, h = 0.75) {   // round table on a conical pedestal (salão / jogos)
  const g = new THREE.Group();
  cylinder(g, r, r, 0.04, top, 0, h - 0.04, 0, 48);
  cylinder(g, Math.min(0.1, r * 0.4), Math.min(0.32, r * 0.75), h - 0.04, base, 0, 0, 0, 32);   // base scales down with small tops
  return g;
}
export function poufB(mat = K2.orangePouf, r = 0.24, h = 0.42) {   // soft square pouf with rounded edges (salão render)
  const g = new THREE.Group();
  rb(g, r * 1.8, h, r * 1.8, mat, 0, 0, 0, 0.07);
  rb(g, r * 1.8 - 0.08, 0.02, r * 1.8 - 0.08, mat, 0, h - 0.012, 0, 0.008);                      // slightly domed top
  return g;
}
export function islandB(w, d, trav = 0.62) {             // travertine island with the wood dining bar on its long side (+z)
  const g = new THREE.Group(), k = K2, tx = -w * (1 - trav) / 2;
  rb(g, w * trav, 0.9, d * 0.6, k.travertine, tx, 0, -d * 0.2, 0.01);
  rb(g, w * trav + 0.04, 0.04, d * 0.6 + 0.04, k.travertine, tx, 0.9, -d * 0.2, 0.008);
  rb(g, 0.6, 0.012, 0.42, P.blackGlass, -w * 0.3, 0.94, -d * 0.22, 0.004);      // induction hob
  rb(g, w, 0.05, d * 0.42, k.oakLight, 0, 0.74, d * 0.29, 0.01);              // dining bar top (lower, wood)
  rb(g, 0.08, 0.74, d * 0.38, k.oakLight, w / 2 - 0.06, 0, d * 0.29, 0.01);
  return g;
}
export function hoodCyl(g, x, y, z) {                    // stainless cylindrical island hood from the ceiling
  cylinder(g, 0.2, 0.2, 0.9, K2.steelHood, x, y, z, 32);
}
export function openShelvesB(w, toCeiling = 0) {          // black-frame open shelving with LED and decor (gourmet render); toCeiling = rod length above the base
  const g = new THREE.Group(), k = K2;
  for (const s of [-1, 0, 1]) rb(g, 0.025, Math.max(0.85, toCeiling), 0.025, P.black, s * (w / 2 - 0.02), 0, 0.12, 0.004);
  for (const y of [0, 0.42]) {
    rb(g, w, 0.035, 0.28, k.oakLight, 0, y, 0.0, 0.006);
    rb(g, w - 0.1, 0.008, 0.02, P.led, 0, y - 0.01, 0.12, 0.002);
  }
  const deco = [std({ color: '#a1583a', roughness: 0.7 }), std({ color: '#d9cdb8', roughness: 0.6 }), std({ color: '#6f7a5a', roughness: 0.7 })];
  for (let i = 0; i < Math.floor(w / 0.35); i++) {
    const x = -w / 2 + 0.2 + i * 0.35, m = deco[i % 3], y = i % 2 ? 0.42 : 0;
    if (i % 3 === 0) cylinder(g, 0.05, 0.07, 0.2, m, x, y + 0.035, 0, 16);
    else if (i % 3 === 1) cylinder(g, 0.07, 0.06, 0.12, m, x, y + 0.035, 0, 16);
    else mesh(g, new THREE.SphereGeometry(0.07, 16, 12), m, x, y + 0.1, 0);
  }
  return g;
}
export function ovalDiningB(w, d, wood = K2.oakLight) {   // oval wood top on a slab pedestal (gourmet / salão render)
  const g = new THREE.Group();
  const top = mesh(g, new THREE.CylinderGeometry(0.5, 0.5, 0.045, 48), wood, 0, 0.75, 0);
  top.scale.set(w, 1, d);
  rb(g, w * 0.45, 0.7, 0.14, wood, 0, 0.03, 0, 0.03);
  rb(g, w * 0.5, 0.04, 0.4, wood, 0, 0, 0, 0.02);
  return g;
}
export function linearPendant(len, y = 1.95, mat = P.black) {   // black bar with disc lights on wires
  const g = new THREE.Group();
  rb(g, len, 0.03, 0.03, mat, 0, y, 0, 0.008);
  for (let i = 0; i < 4; i++) {
    const x = -len / 2 + 0.15 + i * (len - 0.3) / 3;
    mesh(g, new THREE.SphereGeometry(0.06, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y - 0.02, 0, Math.PI, 0, 0);
    mesh(g, new THREE.CircleGeometry(0.05, 16), P.led, x, y - 0.025, 0, Math.PI / 2, 0, 0, false);
  }
  for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.002, 0.002, 2.6 - y, 4), mat, s * len * 0.4, y + (2.6 - y) / 2, 0);
  return g;
}
export function sideboardTrav(w, d) {                    // long walnut sideboard with a travertine top (salão render)
  const g = new THREE.Group();
  rb(g, w, 0.72, d, P.walnut, 0, 0.1, 0, 0.01);
  for (let i = 1; i < 4; i++) rb(g, 0.006, 0.66, 0.005, P.taupeDark, -w / 2 + i * w / 4, 0.13, d / 2, 0.002);
  rb(g, w + 0.04, 0.04, d + 0.03, K2.travertine, 0, 0.82, 0, 0.008);
  rb(g, w - 0.1, 0.1, d - 0.05, P.black, 0, 0, -0.01, 0.01);
  cylinder(g, 0.11, 0.08, 0.22, std({ color: '#a8673f', roughness: 0.6 }), -w * 0.35, 0.86, 0, 20);
  cylinder(g, 0.09, 0.07, 0.17, std({ color: '#b97a4e', roughness: 0.6 }), -w * 0.28, 0.86, 0.02, 20);
  return g;
}
export function tileArtB() {                             // 4×4 colour tile artwork (salão render), faces +z
  const g = new THREE.Group(), cols = ['#c86a3a', '#2f6f86', '#e0b04a', '#e8e1d6', '#4f7b5a', '#b9452f', '#e7d2b5', '#335b8a'];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const c = cols[(i * 3 + j * 5) % cols.length];
    rb(g, 0.19, 0.19, 0.02, std({ color: c, roughness: 0.5 }), -0.3 + i * 0.2, j * 0.2, 0, 0.004);
  }
  return g;
}
export function brassSconce() {                          // round brass wall light (salão / spa render), faces +z
  const g = new THREE.Group();
  mesh(g, new THREE.CylinderGeometry(0.11, 0.11, 0.03, 32), P.brass, 0, 0, 0.015, Math.PI / 2, 0, 0);
  mesh(g, new THREE.CircleGeometry(0.08, 32), P.led, 0, 0, 0.032, 0, 0, 0, false);
  return g;
}
export function pingPongB() {                            // dark-brown top on two bronze trapezoid A-frames, net – long side along x (render)
  const g = new THREE.Group(), frame = std({ color: '#3a3029', roughness: 0.45, metalness: 0.6 });
  rb(g, 2.74, 0.035, 1.525, std({ color: '#3b332d', roughness: 0.55 }), 0, 0.725, 0, 0.006);
  rb(g, 2.74, 0.002, 0.02, std({ color: '#efe9de' }), 0, 0.762, 0.75, 0.001); rb(g, 2.74, 0.002, 0.02, std({ color: '#efe9de' }), 0, 0.762, -0.75, 0.001);
  rb(g, 0.02, 0.002, 1.525, std({ color: '#efe9de' }), 1.36, 0.762, 0, 0.001); rb(g, 0.02, 0.002, 1.525, std({ color: '#efe9de' }), -1.36, 0.762, 0, 0.001);
  rb(g, 0.012, 0.155, 1.7, std({ color: '#1c1c1c', roughness: 0.9, transparent: true, opacity: 0.75 }), 0, 0.76, 0, 0.002);
  for (const sz of [-0.86, 0.86]) rb(g, 0.03, 0.18, 0.03, P.black, 0, 0.74, sz, 0.005);
  for (const sx of [-0.85, 0.85]) {                         // trapezoid frame: top rail across the width, legs splayed out to a wider foot
    rb(g, 0.05, 0.05, 1.3, frame, sx, 0.66, 0, 0.01);
    for (const sz of [-1, 1]) { const leg = mesh(g, new THREE.BoxGeometry(0.05, 0.72, 0.05), frame, sx + Math.sign(sx) * 0.12, 0.34, sz * 0.62, 0, 0, Math.sign(sx) * 0.33); leg.castShadow = true; }
    rb(g, 0.05, 0.04, 1.3, frame, sx + Math.sign(sx) * 0.24, 0, 0, 0.01);
  }
  rb(g, 0.16, 0.012, 0.09, std({ color: '#7a3a2a' }), 0.4, 0.745, 0.2, 0.004); rb(g, 0.16, 0.012, 0.09, std({ color: '#7a3a2a' }), 0.55, 0.745, 0.3, 0.004);
  return g;
}
export function foosballB() {                             // wood box on black X legs (jogos render), long side along x
  const g = new THREE.Group(), k = K2;
  rb(g, 1.4, 0.22, 0.75, k.oakLight, 0, 0.72, 0, 0.02);
  rb(g, 1.3, 0.01, 0.65, k.felt, 0, 0.8, 0, 0.003);
  for (let i = 0; i < 8; i++) {
    const x = -0.56 + i * 0.16;
    mesh(g, new THREE.CylinderGeometry(0.008, 0.008, 1.05, 8), k.chrome, x, 0.88, 0, Math.PI / 2, 0, 0);
    for (let j = 0; j < 3; j++) rb(g, 0.03, 0.09, 0.025, i % 2 ? P.black : std({ color: '#d84b32' }), x, 0.82, -0.2 + j * 0.2, 0.006);
  }
  for (const sx of [-1, 1]) for (const r of [-1, 1]) mesh(g, new THREE.BoxGeometry(0.04, 0.85, 0.05), P.black, sx * 0.45, 0.38, 0, r * 0.45, 0, 0);
  return g;
}
export function curvedBenchB(len, arc = 0) {            // straight blue banquette on a wood base, back at -z
  const g = new THREE.Group(), k = K2, D = 0.62;
  rb(g, len, 0.38, D, k.oakLight, 0, 0, 0, 0.03);
  rb(g, len, 0.13, D - 0.06, k.blueUph, 0, 0.36, 0.02, 0.05);
  rb(g, len, 0.45, 0.16, k.blueUph, 0, 0.45, -D / 2 + 0.08, 0.07);
  return g;
}

// ---------------------------------------------------------------------------
// CHURRASQUEIRA
// ---------------------------------------------------------------------------
export function grillWallB(w) {                          // dark counter with grill + hood, sink, pizza oven at +x end (render)
  const g = new THREE.Group(), k = K2;
  rb(g, w, 0.9, 0.65, k.charcoal, 0, 0, 0, 0.01);
  rb(g, w + 0.02, 0.04, 0.68, K2.concreteSmooth, 0, 0.9, 0, 0.006);
  rb(g, 0.9, 0.5, 0.6, k.charcoal, -w / 2 + 0.6, 0.94, -0.02, 0.01);
  rb(g, 0.8, 0.02, 0.5, P.black, -w / 2 + 0.6, 1.0, 0.03, 0.005);
  const hood = mesh(g, new THREE.CylinderGeometry(0.12, 0.62, 0.55, 4, 1), k.charcoal, -w / 2 + 0.6, 2.05, -0.05, 0, Math.PI / 4, 0);
  hood.scale.set(1.0, 1, 0.7);
  rb(g, 0.24, 0.6, 0.24, k.charcoal, -w / 2 + 0.6, 2.3, -0.12, 0.01);
  rb(g, 0.52, 0.008, 0.38, P.brushed, -0.1, 0.94, 0.04, 0.003);                 // sink rim sits ON the worktop (its top used to be level with it → flicker)
  rb(g, 0.42, 0.004, 0.28, P.black, -0.1, 0.946, 0.04, 0.002);                   // basin
  cylinder(g, 0.014, 0.014, 0.3, P.brushed, -0.1, 0.94, -0.16, 12); rb(g, 0.03, 0.03, 0.18, P.brushed, -0.1, 1.22, -0.08, 0.01);   // tap
  // pizza oven: white dome on a block
  rb(g, 1.1, 0.95, 0.9, k.ovenWhite, w / 2 - 0.55, 0, -0.1, 0.02);
  mesh(g, new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), k.ovenWhite, w / 2 - 0.55, 0.95, -0.1);
  { const sh = new THREE.Shape(); sh.moveTo(-0.2, 0); sh.lineTo(0.2, 0); sh.lineTo(0.2, 0.12); sh.absarc(0, 0.12, 0.2, 0, Math.PI, false); sh.lineTo(-0.2, 0);   // arched oven mouth
    const ring = new THREE.Shape(); ring.moveTo(-0.27, 0); ring.lineTo(0.27, 0); ring.lineTo(0.27, 0.12); ring.absarc(0, 0.12, 0.27, 0, Math.PI, false); ring.lineTo(-0.27, 0); ring.holes.push(sh);
    const ox = w / 2 - 0.55, fz = 0.41;
    mesh(g, new THREE.ExtrudeGeometry(ring, { depth: 0.08, bevelEnabled: false, curveSegments: 16 }), k.ovenWhite, ox, 0.95, fz - 0.08);   // mouth surround standing proud of the dome
    mesh(g, new THREE.ShapeGeometry(sh, 16), std({ color: '#141210', roughness: 1 }), ox, 0.95, fz - 0.006, 0, 0, 0, false); }   // dark opening just in front of the dome, 6 mm behind the surround face
  cylinder(g, 0.07, 0.07, 1.4, k.ovenWhite, w / 2 - 0.55, 1.3, -0.25, 16);
  return g;
}
export function longTableB(w, d, top = K2.oakLight) {
  const g = new THREE.Group();
  rb(g, w, 0.05, d, top, 0, 0.72, 0, 0.01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.06, 0.72, 0.06, P.black, sx * (w / 2 - 0.12), 0, sz * (d / 2 - 0.1), 0.01);
  return g;
}
export function ropeChairB() {                           // outdoor dining chair: dark frame, woven rope back (render)
  const g = new THREE.Group(), k = K2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.03, 0.44, 0.03, P.black, sx * 0.21, 0, sz * 0.2, 0.008);
  rb(g, 0.48, 0.06, 0.46, k.rope, 0, 0.42, 0, 0.02);
  for (const s of [-1, 1]) rb(g, 0.03, 0.42, 0.03, P.black, s * 0.21, 0.44, -0.21, 0.008, -0.1);
  rb(g, 0.44, 0.3, 0.025, k.rope, 0, 0.55, -0.22, 0.01, -0.1);
  return g;
}
export function moduleSofaB(w, d, mat = K2.slateUph, arms = [true, true]) {   // low modular outdoor sofa (churrasqueira render)
  const g = new THREE.Group();
  rb(g, w, 0.36, d, mat, 0, 0.04, 0, 0.06);
  rb(g, w - (arms[0] ? 0.12 : 0) - (arms[1] ? 0.12 : 0), 0.14, d - 0.2, mat, ((arms[0] ? 0.12 : 0) - (arms[1] ? 0.12 : 0)) / 2, 0.38, 0.08, 0.06);
  rb(g, w, 0.38, 0.22, mat, 0, 0.38, -d / 2 + 0.11, 0.08);
  if (arms[0]) rb(g, 0.16, 0.24, d, mat, -w / 2 + 0.08, 0.38, 0, 0.06);
  if (arms[1]) rb(g, 0.16, 0.24, d, mat, w / 2 - 0.08, 0.38, 0, 0.06);
  rb(g, w - 0.1, 0.04, d - 0.1, P.black, 0, 0, 0, 0.01);
  for (let i = 0; i < Math.round(w / 0.8); i++) rb(g, 0.45, 0.42, 0.14, K2.beigeCush, -w / 2 + 0.4 + i * 0.8, 0.5, -d / 2 + 0.28, 0.06, -0.25);
  return g;
}

// ---------------------------------------------------------------------------
// BRINQUEDOTECA
// ---------------------------------------------------------------------------
export function beanbagB(mat = K2.pinkSoft) {             // kids' soft armchair (brinquedoteca render): plump seat, rounded back and arms, front faces +z
  const g = new THREE.Group();
  rb(g, 0.66, 0.3, 0.62, mat, 0, 0, 0, 0.12);                                  // base
  rb(g, 0.46, 0.12, 0.46, mat, 0, 0.27, 0.06, 0.06);                           // seat cushion
  rb(g, 0.66, 0.32, 0.18, mat, 0, 0.26, -0.22, 0.09);                          // back
  for (const s of [-1, 1]) rb(g, 0.13, 0.2, 0.58, mat, s * 0.265, 0.26, -0.02, 0.065);   // arms
  return g;
}
export function kidTableB() {                            // little round table with 4 straight legs + 3 stools around it (render)
  const g = new THREE.Group(), k = K2;
  cylinder(g, 0.34, 0.34, 0.035, k.oakLight, 0, 0.5, 0, 40);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cylinder(g, 0.02, 0.02, 0.5, k.oakLight, Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22, 10); }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.094 + 0.5, x = Math.cos(a) * 0.55, z = Math.sin(a) * 0.55;
    cylinder(g, 0.14, 0.14, 0.03, k.oakLight, x, 0.29, z, 28);
    for (let j = 0; j < 3; j++) { const b = j * 2.094; cylinder(g, 0.015, 0.015, 0.29, k.oakLight, x + Math.cos(b) * 0.09, 0, z + Math.sin(b) * 0.09, 8); }
    cylinder(g, 0.095, 0.095, 0.012, k.oakLight, x, 0.1, z, 20).material = k.oakLight;   // stretcher ring
  }
  return g;
}
export function mushroomB(h = 1.2, r = 0.35) {
  const g = new THREE.Group(), k = K2;
  cylinder(g, 0.05 * h, 0.08 * h, h, k.mushroomStem, 0, 0, 0, 12);
  mesh(g, new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), k.mushroomRed, 0, h - 0.05, 0).scale.set(1, 0.7, 1);
  for (let i = 0; i < 7; i++) { const a = i * 0.9, rr = r * (0.3 + (i % 3) * 0.2); mesh(g, new THREE.SphereGeometry(0.03, 8, 6), k.mushroomStem, Math.cos(a) * rr, h - 0.05 + 0.7 * Math.sqrt(Math.max(0, r * r - rr * rr)), Math.sin(a) * rr); }
  return g;
}
export function shopBoothB(w, label) {                   // wood booth with a striped awning (brinquedoteca: "Cinema", "Oficina", "Pet shop")
  const g = new THREE.Group(), k = K2;
  for (const s of [-1, 1]) rb(g, 0.08, 2.0, 0.6, k.oakLight, s * (w / 2 - 0.04), 0, 0, 0.01);
  rb(g, w, 0.9, 0.5, k.oakLight, 0, 0, -0.04, 0.01);
  rb(g, w, 0.18, 0.6, k.oakLight, 0, 2.0, 0, 0.01);
  const n = Math.max(4, Math.round(w / 0.22));
  for (let i = 0; i < n; i++) {
    const sw = w / n, x = -w / 2 + sw * (i + 0.5);
    const p = mesh(g, new THREE.PlaneGeometry(sw, 0.5), i % 2 ? k.awningWhite : k.awningRed, x, 1.95, 0.48, -0.9, 0, 0);
    mesh(g, new THREE.CircleGeometry(sw / 2, 12, Math.PI, Math.PI), i % 2 ? k.awningWhite : k.awningRed, x, 1.79, 0.69, 0, 0, 0);
    p.castShadow = false;
  }
  if (label) {
    const t = canvasTex(256, 64, (gc, W, Hh) => { gc.clearRect(0, 0, W, Hh); gc.fillStyle = '#f6efe2'; gc.font = 'bold 40px sans-serif'; gc.textAlign = 'center'; gc.fillText(label, W / 2, 46); });
    mesh(g, new THREE.PlaneGeometry(w * 0.8, w * 0.2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), 0, 2.32, 0.2, -0.4, 0, 0, false);
  }
  return g;
}
export function ballPitB(w, d) {                          // padded ball pit (pink-beige rim), white balls (render)
  const g = new THREE.Group(), k = K2, rim = std({ color: '#c9a99a', roughness: 0.8 });
  rb(g, w, 0.55, 0.2, rim, 0, 0, d / 2 - 0.1, 0.06);
  rb(g, w, 0.55, 0.2, rim, 0, 0, -d / 2 + 0.1, 0.06);
  rb(g, 0.2, 0.55, d, rim, -w / 2 + 0.1, 0, 0, 0.06);
  rb(g, 0.2, 0.55, d, rim, w / 2 - 0.1, 0, 0, 0.06);
  const ballGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const n = Math.floor(w * d * 35);
  const inst = new THREE.InstancedMesh(ballGeo, k.ball, n); const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation((Math.random() - 0.5) * (w - 0.45), 0.38 + Math.random() * 0.1, (Math.random() - 0.5) * (d - 0.45)); inst.setMatrixAt(i, m4); }
  inst.receiveShadow = true; g.add(inst);
  rb(g, w - 0.4, 0.36, d - 0.4, k.ball, 0, 0, 0, 0.02);
  return g;
}
export function playTowerB() {                            // wooden play house on stilts (playground render): plank cabin with a round
  // window (front, +z), arched door (+x side) reached by stairs with a grey rail, slatted upper band, coloured
  // panels on the −x side, gable roof with overhang, climbing frame of bars sloping down from the front
  const g = new THREE.Group();
  const wood = std({ color: '#9c8468', roughness: 0.85 }), dark = std({ color: '#6e5a45', roughness: 0.85 }), rail = std({ color: '#7d8a92', roughness: 0.5, metalness: 0.4 });
  const S = 1.7, P0 = 1.0, WH = 1.35;                      // cabin size, platform height, wall height
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.12, P0, 0.12, dark, sx * (S / 2 - 0.1), 0, sz * (S / 2 - 0.1), 0.01);   // stilts
  rb(g, S + 0.2, 0.1, S + 0.2, dark, 0, P0 - 0.1, 0, 0.01);                                              // platform
  // walls: extruded plank panels with real openings; each built in the xy plane and turned to its side
  const wall = (holes, rotY, off, skip = [9, 9]) => {
    const sh = new THREE.Shape(); sh.moveTo(-S / 2, 0); sh.lineTo(S / 2, 0); sh.lineTo(S / 2, WH); sh.lineTo(-S / 2, WH); sh.lineTo(-S / 2, 0);
    for (const h of holes) sh.holes.push(h);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false, curveSegments: 20 }); geo.translate(0, 0, -0.03);
    const m = mesh(g, geo, wood, Math.sin(rotY) * off, P0, Math.cos(rotY) * off, 0, rotY, 0);
    for (let y = 0.15; y < WH; y += 0.15) {                // plank seams on the outside (none across an opening)
      if (y > skip[0] && y < skip[1]) continue;
      const seam = mesh(g, new THREE.BoxGeometry(S, 0.008, 0.004), dark, 0, 0, 0, 0, rotY, 0, false);
      seam.position.set(Math.sin(rotY) * (off + 0.032), P0 + y, Math.cos(rotY) * (off + 0.032));
    }
    return m;
  };
  const circle = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); return p; };
  const arch = (x, w, h) => { const p = new THREE.Path(); p.moveTo(x - w / 2, 0.02); p.lineTo(x - w / 2, h - w / 2); p.absarc(x, h - w / 2, w / 2, Math.PI, 0, true); p.lineTo(x + w / 2, 0.02); p.lineTo(x - w / 2, 0.02); return p; };
  const band = (y0, y1) => { const p = new THREE.Path(); p.moveTo(-S / 2 + 0.12, y0); p.lineTo(-S / 2 + 0.12, y1); p.lineTo(S / 2 - 0.12, y1); p.lineTo(S / 2 - 0.12, y0); p.lineTo(-S / 2 + 0.12, y0); return p; };
  wall([circle(0.05, 0.72, 0.36)], 0, S / 2, [0.3, 1.14]);                     // front: round window
  wall([band(0.9, 1.25)], Math.PI, S / 2);                                      // back: slatted band
  wall([arch(0.1, 0.5, 1.05), band(1.0, 1.25)], -Math.PI / 2, S / 2, [0, 1.3]);   // −x side: arched door + slats (stairs side)
  wall([band(0.95, 1.25)], Math.PI / 2, S / 2);                                // +x side: slats + coloured panels
  for (const [rotY, n] of [[0, 0], [Math.PI, 9], [Math.PI / 2, 9], [-Math.PI / 2, 9]]) for (let i = 0; i < n; i++) {   // vertical slats in the bands
    const t = -S / 2 + 0.2 + i * (S - 0.4) / (n - 1), sl = mesh(g, new THREE.BoxGeometry(0.04, 0.36, 0.04), wood, 0, 0, 0, 0, rotY, 0);
    sl.position.set(Math.cos(rotY) * t + Math.sin(rotY) * (S / 2), P0 + 1.1, -Math.sin(rotY) * t + Math.cos(rotY) * (S / 2));
  }
  rb(g, 0.75, 0.06, 0.08, rail, 0.05, P0 + 0.33, S / 2 + 0.06, 0.01);                                   // rail across the round window
  for (const [i, c] of ['#e2b13c', '#3f7fb8', '#e2b13c', '#3f7fb8'].entries())                           // coloured panels (−x side)
    rb(g, 0.02, 0.32, 0.3, std({ color: c, roughness: 0.6 }), S / 2 + 0.035, P0 + 0.2 + (i % 2) * 0.36, -0.2 + (i >> 1) * 0.4, 0.005);
  // gable roof, ridge along z, overhanging
  const RW = S / 2 + 0.3, RL = S + 0.6, RH = 0.55, ry = P0 + WH;
  const slope = Math.atan2(RH, RW), len = Math.hypot(RW, RH);
  for (const s of [-1, 1]) {
    const r = mesh(g, new THREE.BoxGeometry(len, 0.06, RL), dark, s * RW / 2, ry + RH / 2, 0, 0, 0, -s * slope); r.castShadow = true;
  }
  for (const s of [-1, 1]) {                                                    // gable ends (triangles)
    const tri = new THREE.Shape(); tri.moveTo(-S / 2, 0); tri.lineTo(S / 2, 0); tri.lineTo(0, RH * (S / 2) / RW); tri.lineTo(-S / 2, 0);
    mesh(g, new THREE.ShapeGeometry(tri), wood, 0, ry, s * (S / 2), 0, s > 0 ? 0 : Math.PI, 0).material = wood.clone();
    g.children[g.children.length - 1].material.side = THREE.DoubleSide;
  }
  // stairs with a grey rail up to the door (−x side; with the house facing image-up this is image-right, as on the plan)
  const steps = 5;
  for (let i = 0; i < steps; i++) rb(g, 0.4, 0.05, 0.6, dark, -(S / 2 + 1.0 - i * 0.2), (i + 1) * P0 / (steps + 1) - 0.05, 0.1, 0.01);
  for (const sz of [-1, 1]) {
    tubeTo(g, [-(S / 2 + 1.2), 0, 0.1 + sz * 0.32], [-(S / 2 + 0.1), P0, 0.1 + sz * 0.32], 0.06, dark);
    tubeTo(g, [-(S / 2 + 1.2), 0.8, 0.1 + sz * 0.34], [-(S / 2 + 0.1), P0 + 0.8, 0.1 + sz * 0.34], 0.04, rail, true);
    for (const t of [0, 0.5, 1]) { const x = -(S / 2 + 1.2 - t * 1.1), y = t * P0; tubeTo(g, [x, y, 0.1 + sz * 0.34], [x, y + 0.8, 0.1 + sz * 0.34], 0.03, rail, true); }
  }
  // climbing frame: two side rails sloping from the platform edge (+z) to the ground, round rungs between
  const z0 = S / 2 + 0.1, z1 = S / 2 + 1.5;
  for (const sx of [-0.45, 0.45]) tubeTo(g, [sx, P0, z0], [sx, 0, z1], 0.06, dark);
  for (let i = 1; i < 7; i++) { const t = i / 7; tubeTo(g, [-0.45, P0 * (1 - t), z0 + t * (z1 - z0)], [0.45, P0 * (1 - t), z0 + t * (z1 - z0)], 0.03, rail, true); }
  return g;
}
export function stumpStoolB(h = 0.45) {                    // red post with a round wood top (playground render)
  const g = new THREE.Group();
  cylinder(g, 0.05, 0.05, h - 0.06, std({ color: '#b5342a', roughness: 0.5 }), 0, 0, 0, 16);
  cylinder(g, 0.2, 0.2, 0.06, std({ color: '#9c7a55', roughness: 0.8 }), 0, h - 0.06, 0, 28);
  return g;
}
function tubeTo(g, a, b, s, mat, round = false) {          // square / round bar between two points
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const m = new THREE.Mesh(round ? new THREE.CylinderGeometry(s / 2, s / 2, len, 10) : new THREE.BoxGeometry(s, len, s), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  m.castShadow = m.receiveShadow = true; g.add(m); return m;
}

// ---------------------------------------------------------------------------
// SPA / POOL DECK
// ---------------------------------------------------------------------------
export function spaLoungerB() {                           // terracotta cushion on a dark metal sled frame, head at -z, raised back (spa render)
  const g = new THREE.Group(), k = K2;
  for (const sx of [-1, 1]) { rb(g, 0.035, 0.035, 1.9, P.black, sx * 0.34, 0, 0, 0.008); rb(g, 0.035, 0.3, 0.035, P.black, sx * 0.34, 0, 0.8, 0.008); rb(g, 0.035, 0.3, 0.035, P.black, sx * 0.34, 0, -0.6, 0.008); }
  rb(g, 0.75, 0.04, 1.95, P.black, 0, 0.3, 0, 0.01);
  rb(g, 0.72, 0.12, 1.3, k.terracottaUph, 0, 0.34, 0.3, 0.05);
  const back = new THREE.Group(); back.position.set(0, 0.36, -0.35); back.rotation.x = 0.45; g.add(back);
  rb(back, 0.72, 0.12, 0.7, k.terracottaUph, 0, 0, -0.35, 0.05);
  rb(g, 0.5, 0.18, 0.18, k.terracottaUph, 0, 0.62, -0.6, 0.06, 0.4);
  return g;
}
export function sunLoungerB(cush = K2.beigeCush) {        // teak sun lounger with a cushion, head at -z (pool render)
  const g = new THREE.Group(), k = K2, teak = std({ color: '#a8743f', roughness: 0.7 });
  for (const sx of [-1, 1]) for (const sz of [-0.85, 0.85]) rb(g, 0.06, 0.3, 0.06, teak, sx * 0.3, 0, sz, 0.01);
  rb(g, 0.7, 0.06, 1.95, teak, 0, 0.3, 0, 0.01);
  rb(g, 0.64, 0.07, 1.2, cush, 0, 0.36, 0.35, 0.03);
  const back = new THREE.Group(); back.position.set(0, 0.37, -0.25); back.rotation.x = 0.55; g.add(back);
  rb(back, 0.66, 0.06, 0.75, teak, 0, 0, -0.37, 0.01);
  rb(back, 0.62, 0.06, 0.7, cush, 0, 0.05, -0.37, 0.03);
  return g;
}
export function daybedB() {                               // navy outdoor daybed with a cushion pile
  const g = new THREE.Group(), k = K2;
  rb(g, 1.4, 0.3, 2.0, P.black, 0, 0, 0, 0.02);
  rb(g, 1.36, 0.16, 1.96, k.navy, 0, 0.3, 0, 0.06);
  rb(g, 1.36, 0.4, 0.2, k.navy, 0, 0.42, -0.9, 0.08);
  for (const x of [-0.4, 0.4]) rb(g, 0.45, 0.35, 0.14, K2.beigeCush, x, 0.48, -0.75, 0.06, -0.25);
  return g;
}
export function umbrellaB(r = 1.3, open = true) {         // beige market umbrella
  const g = new THREE.Group(), k = K2;
  cylinder(g, 0.25, 0.28, 0.08, P.black, 0, 0, 0, 20);
  cylinder(g, 0.022, 0.022, 2.45, std({ color: '#a8743f', roughness: 0.7 }), 0, 0, 0, 10);
  if (open) { const c = mesh(g, new THREE.ConeGeometry(r, 0.45, 8, 1, true), k.canvasBeige, 0, 2.3, 0); c.castShadow = true; }
  else cylinder(g, 0.1, 0.03, 1.2, k.canvasBeige, 0, 1.25, 0, 8);
  return g;
}
export function bistroSetB(top = std({ color: '#c97b45', roughness: 0.7 })) {   // round table + 2 chairs (deck)
  const g = new THREE.Group();
  cylinder(g, 0.35, 0.35, 0.03, top, 0, 0.72, 0, 28);
  cylinder(g, 0.03, 0.03, 0.72, P.black, 0, 0, 0, 10);
  cylinder(g, 0.22, 0.22, 0.02, P.black, 0, 0, 0, 20);
  for (const s of [-1, 1]) { const c = ropeChairB(); c.position.set(0, 0, s * 0.65); c.rotation.y = s > 0 ? Math.PI : 0; g.add(c); }
  return g;
}
export function lanterns() {                              // two glass lanterns with candles (spa render)
  const g = new THREE.Group();
  for (const [x, h] of [[0, 0.45], [0.22, 0.32]]) {
    rb(g, 0.18, h, 0.18, P.clearGlass, x, 0, 0, 0.005);
    cylinder(g, 0.04, 0.04, h * 0.45, std({ color: '#f6efe2', emissive: '#ffcc88', emissiveIntensity: 0.4 }), x, 0.01, 0, 12);
  }
  return g;
}

// ---------------------------------------------------------------------------
// LANDSCAPE
// ---------------------------------------------------------------------------
function frondGeo(len, wid) {                             // drooping palm frond, base at origin, pointing +z
  const g = new THREE.PlaneGeometry(wid, len, 1, 8); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = (p.getY(i) + len / 2) / len, x = p.getX(i) * (1 - v * 0.75);
    p.setXYZ(i, x, -v * v * len * 0.55 + v * len * 0.25 - Math.abs(x) * 0.25, v * len);
  }
  g.computeVertexNormals(); return g;
}
const FROND = frondGeo(2.4, 0.7), FROND_S = frondGeo(1.7, 0.5);
export function palmB(h = 5, s = 1) {                     // queen palm: slim trunk, crown of drooping fronds (pool render)
  const g = new THREE.Group(), k = K2;
  const trunk = mesh(g, new THREE.CylinderGeometry(0.11 * s, 0.17 * s, h, 10), k.palmTrunk, 0, h / 2, 0); trunk.rotation.z = 0.03;
  for (let i = 0; i < 11; i++) {
    const f = new THREE.Group(); f.position.set(0, h, 0); f.rotation.y = i * 0.57 + Math.random() * 0.2; g.add(f);
    const m = mesh(f, i % 3 ? FROND : FROND_S, i % 2 ? k.frond : k.frond2, 0, 0, 0, -0.35 + (i % 3) * 0.25, 0, 0);
    m.scale.setScalar(s);
  }
  return g;
}
export function shrubB(r = 0.6, mat = K2.shrub) {
  const g = new THREE.Group();
  mesh(g, new THREE.IcosahedronGeometry(r, 1), mat, 0, r * 0.8, 0);
  mesh(g, new THREE.IcosahedronGeometry(r * 0.7, 1), K2.shrub2, r * 0.5, r * 0.7, r * 0.3);
  mesh(g, new THREE.IcosahedronGeometry(r * 0.65, 1), mat, -r * 0.45, r * 0.6, -r * 0.2);
  return g;
}
const monsteraTex = canvasTex(256, 256, (g, w, h) => {      // split-leaf monstera: heart-shaped leaf with slits + holes, transparent around
  g.clearRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3f6f2c'); gr.addColorStop(1, '#2b5220');
  g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, h * 0.98);
  g.bezierCurveTo(w * 0.02, h * 0.8, w * 0.0, h * 0.25, w * 0.42, h * 0.06); g.quadraticCurveTo(w / 2, h * 0.14, w * 0.58, h * 0.06);
  g.bezierCurveTo(w, h * 0.25, w * 0.98, h * 0.8, w / 2, h * 0.98); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 7;
  for (let i = 0; i < 6; i++) { const y = h * (0.22 + i * 0.12); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + sd * w * 0.5, y - 10); g.lineTo(w / 2 + sd * w * 0.2, y + 8); g.stroke(); g.beginPath(); g.ellipse(w / 2 + sd * w * 0.16, y + 4, 4, 9, 0, 0, 7); g.fill(); } }
  g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#7fa65a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h * 0.97); g.lineTo(w / 2, h * 0.1); g.stroke();
});
K2.monsteraLeaf = std({ map: monsteraTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55 });
export function tropicalB(s = 1) {                        // monstera clump: split leaves on long petioles, arching out (renders)
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4 + Math.random() * 0.4, l = (0.35 + (i % 3) * 0.18) * s, y = (0.4 + (i % 3) * 0.22) * s, sz = (0.42 + Math.random() * 0.2) * s;
    const leaf = new THREE.Group(); leaf.position.set(Math.cos(a) * l, y, Math.sin(a) * l); leaf.rotation.y = -a + Math.PI / 2; g.add(leaf);
    const m = mesh(leaf, new THREE.PlaneGeometry(sz, sz), K2.monsteraLeaf, 0, 0, sz * 0.35, -1.0 - Math.random() * 0.4, 0, (Math.random() - 0.5) * 0.4); m.castShadow = true;
    const pet = mesh(g, new THREE.CylinderGeometry(0.007 * s, 0.009 * s, Math.hypot(l, y), 5), P.stemGreen, Math.cos(a) * l / 2, y / 2, Math.sin(a) * l / 2);
    pet.lookAt(Math.cos(a) * l + g.position.x, y, Math.sin(a) * l); pet.rotateX(Math.PI / 2);
  }
  return g;
}
export function lavenderRow(len, depth = 0.5) {           // purple flower spikes over a green mass (churrasqueira / pool render)
  const g = new THREE.Group(), k = K2;
  rb(g, len, 0.35, depth, P.leaf, 0, 0, 0, 0.12);
  const spike = new THREE.ConeGeometry(0.025, 0.22, 5);
  const n = Math.floor(len * depth * 40), inst = new THREE.InstancedMesh(spike, k.lavender, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation((Math.random() - 0.5) * len, 0.4 + Math.random() * 0.25, (Math.random() - 0.5) * depth); inst.setMatrixAt(i, m4); }
  g.add(inst);
  return g;
}

// ---------------------------------------------------------------------------
// LOBBY / COWORKING / CASA DE CAMPO (térreo) and ESPAÇO BEAUTY (1º pavimento)
// ---------------------------------------------------------------------------
export function boucleArmchairB(mat = P.boucleW ?? P.linen) {   // chunky bouclé armchair between dark-wood side slabs (lobby render)
  const g = new THREE.Group(), wood = K2.darkWood;
  for (const s of [-1, 1]) rb(g, 0.1, 0.6, 0.66, wood, s * 0.37, 0, 0, 0.04);
  rb(g, 0.64, 0.24, 0.66, mat, 0, 0.18, 0.02, 0.1);
  rb(g, 0.74, 0.46, 0.26, mat, 0, 0.36, -0.24, 0.12);
  for (const s of [-1, 1]) rb(g, 0.18, 0.3, 0.6, mat, s * 0.3, 0.36, 0.01, 0.09);
  return g;
}
export function curvedSofaB(R = 2.2, arc = 1.3, mat = fabric('#b8693f', 1.6)) {   // curved sofa, concave side (+z) faces its centre at (0, 0, R)
  const g = new THREE.Group(), n = 7, seg = R * arc / n * 1.04;
  for (let i = 0; i < n; i++) {
    const t = -arc / 2 + (i + 0.5) * arc / n, s = new THREE.Group();
    s.position.set(R * Math.sin(t), 0, R - R * Math.cos(t)); s.rotation.y = -t; g.add(s);
    rb(s, seg, 0.42, 0.9, mat, 0, 0, 0, 0.12);
    rb(s, seg, 0.4, 0.28, mat, 0, 0.36, -0.32, 0.13);
  }
  return g;
}
// ---------------------------------------------------------------------------
// LOBBY C/ PÉ-DIREITO DUPLO (térreo render): true curved sofa, bouclé tub armchairs, ficus trees + monstera in tall pots
// ---------------------------------------------------------------------------
function arcSlab(r0, r1, a0, a1, h, bevel = 0.05) {     // annular sector extruded upward (y 0 … h), rounded edges
  const sh = new THREE.Shape();
  sh.absarc(0, 0, r1, a0, a1, false); sh.absarc(0, 0, r0, a1, a0, true); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 64 });
  g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0); g.computeVertexNormals();
  return g;
}
export function curvedLoungeSofaB(R = 1.9, arc = 1.7, mat = phys({ color: '#b5703f', roughness: 0.62, sheen: 0.4, sheenColor: '#e0a070' })) {
  // one continuous curved sofa (render: caramel, low, soft rounded edges), concave side (+z) faces its centre at (0, 0, R)
  const g = new THREE.Group(), a0 = Math.PI / 2 - arc / 2, a1 = Math.PI / 2 + arc / 2;
  const add = (geo, m, y = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(0, y, R); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(arcSlab(R - 0.36, R + 0.36, a0 + 0.03, a1 - 0.03, 0.08, 0.02), std({ color: '#3b2a1e', roughness: 0.6 }));       // recessed plinth
  add(arcSlab(R - 0.46, R + 0.42, a0, a1, 0.34, 0.08), mat, 0.06);                                                       // seat base
  add(arcSlab(R - 0.44, R + 0.16, a0 + 0.04, a1 - 0.04, 0.16, 0.07), mat, 0.38);                                          // seat cushion
  add(arcSlab(R + 0.14, R + 0.44, a0, a1, 0.42, 0.13), mat, 0.36);                                                        // curved back
  for (const a of [a0 + 0.06, a1 - 0.06]) {                                                                              // rounded arm ends, lying radially
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.58, 8, 20), mat), dir = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); arm.position.set(R * Math.cos(a), 0.5, R - R * Math.sin(a)); arm.castShadow = true; g.add(arm);
  }
  return g;
}
export function boucleTubChairB(mat = fabric('#e8e1d4', 2.6), wood = K2.darkWood) {
  // premium bouclé lounge chair (≈ 0.86 × 0.80 m): one continuous pillowy horseshoe shell (back + arms, soft
  // rounded edges), deep seat with a crowned cushion, loose back pillow + velvet lumbar accent, floating on a
  // recessed walnut plinth with a thin brass reveal. Front +z.
  const g = new THREE.Group(), b = 0.06;
  // horseshoe outline (local x, z) – drawn as shape (x, −z) so that after rotating −90° about x it lies flat
  const W = 0.43 - b, F = 0.40 - b, B = 0.40 - b, Wi = 0.275 + b, Bi = 0.22 + b, rc = 0.22, ri = 0.12;
  const s = new THREE.Shape(), P2 = (x, z) => [x, -z];
  s.moveTo(...P2(-W, F));
  s.lineTo(...P2(-W, -B + rc)); s.quadraticCurveTo(...P2(-W, -B), ...P2(-W + rc, -B));
  s.lineTo(...P2(W - rc, -B)); s.quadraticCurveTo(...P2(W, -B), ...P2(W, -B + rc));
  s.lineTo(...P2(W, F)); s.quadraticCurveTo(...P2((W + Wi) / 2, F + 0.03), ...P2(Wi, F));        // rounded arm front
  s.lineTo(...P2(Wi, -Bi + ri)); s.quadraticCurveTo(...P2(Wi, -Bi), ...P2(Wi - ri, -Bi));
  s.lineTo(...P2(-Wi + ri, -Bi)); s.quadraticCurveTo(...P2(-Wi, -Bi), ...P2(-Wi, -Bi + ri));
  s.lineTo(...P2(-Wi, F)); s.quadraticCurveTo(...P2(-(W + Wi) / 2, F + 0.03), ...P2(-W, F));
  const shellH = 0.54;
  const shell = mesh(g, new THREE.ExtrudeGeometry(s, { depth: shellH - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 8, curveSegments: 24 }),
    mat, 0, 0.1 + b, 0, -Math.PI / 2);                                                      // y 0.10 → 0.64
  shell.castShadow = shell.receiveShadow = true;
  // raised, rolled back rail so the back sits a little higher than the arms
  const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.5, 8, 24), mat);
  roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.66, -0.31); roll.castShadow = roll.receiveShadow = true; g.add(roll);
  // seat: upholstered deck + crowned cushion with a slightly lower front edge
  rb(g, 0.56, 0.24, 0.64, mat, 0, 0.1, 0.07, 0.05);
  const cush = rb(g, 0.55, 0.14, 0.6, mat, 0, 0.33, 0.08, 0.065); cush.rotation.x = 0.04;
  // loose back pillow + velvet lumbar accent
  rb(g, 0.52, 0.36, 0.15, mat, 0, 0.44, -0.15, 0.075, -0.2);
  rb(g, 0.36, 0.2, 0.11, P.terracottaV, 0, 0.47, -0.05, 0.05, -0.22);
  // recessed walnut plinth with a brass reveal – the chair seems to float
  rb(g, 0.74, 0.085, 0.68, wood, 0, 0.01, 0, 0.02);
  rb(g, 0.75, 0.008, 0.69, P.goldM ?? wood, 0, 0.092, 0, 0.003);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(g, 0.02, 0.02, 0.012, P.black, sx * 0.32, 0, sz * 0.28, 12);   // floor glides
  return g;
}
const ficusLeafTex = canvasTex(128, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#6f9a48'); gr.addColorStop(1, '#3d6528');
  g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.24, h * 0.46, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(200,220,150,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, h * 0.08); g.lineTo(w / 2, h * 0.92); g.stroke();
});
K2.ficusLeaf = std({ map: ficusLeafTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.55 });
export function tallPotB(r = 0.3, h = 0.62, mat = phys({ color: '#5b3a28', roughness: 0.3, clearcoat: 0.6 })) {   // glossy dark-brown planter (render), slight belly
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(r * (0.72 + 0.34 * Math.sin(Math.PI * (0.15 + 0.7 * t))), t * h)); }
  pts.push(new THREE.Vector2(r * 0.92, h), new THREE.Vector2(0, h - 0.04));
  mesh(g, new THREE.LatheGeometry(pts, 40), mat, 0, 0, 0);
  mesh(g, new THREE.CircleGeometry(r * 0.9, 32), P.soil, 0, h - 0.035, 0, -Math.PI / 2, 0, 0, false);
  return g;
}
export function ficusTreeB(h = 2.6, potR = 0.32) {   // indoor ficus in a tall pot (render): slim branching stems, airy canopy of small glossy leaves
  const g = new THREE.Group(), potH = potR * 2.0;
  g.add(tallPotB(potR, potH));
  const bark = std({ color: '#6b5646', roughness: 0.9 }), clumps = [];
  for (let k = 0; k < 3; k++) {                                                    // three stems leaning apart
    const a = k * 2.1 + Math.random() * 0.4, lean = 0.12 + Math.random() * 0.08, top = new THREE.Vector3(Math.cos(a) * lean * h * 0.35, potH + h * (0.62 + k * 0.06), Math.sin(a) * lean * h * 0.35);
    const base = new THREE.Vector3(0, potH - 0.05, 0), len = top.distanceTo(base);
    const st = mesh(g, new THREE.CylinderGeometry(0.018, 0.03, len, 7), bark, (top.x + base.x) / 2, (top.y + base.y) / 2, (top.z + base.z) / 2);
    st.lookAt(top.x, top.y, top.z); st.rotateX(Math.PI / 2); st.position.set((top.x + base.x) / 2, (top.y + base.y) / 2, (top.z + base.z) / 2);
    for (let c = 0; c < 4; c++) clumps.push(top.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.3) * 0.6, (Math.random() - 0.5) * 0.7)));
  }
  const n = 900, leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.12), K2.ficusLeaf, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const c = clumps[i % clumps.length], r = 0.38 * Math.cbrt(Math.random());
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    v.set(c.x + r * Math.sin(ph) * Math.cos(th), c.y + r * Math.cos(ph) * 0.7, c.z + r * Math.sin(ph) * Math.sin(th));
    e.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI); q.setFromEuler(e);
    m4.compose(v, q, sc.setScalar(0.8 + Math.random() * 0.5)); leaves.setMatrixAt(i, m4);
  }
  leaves.castShadow = true; g.add(leaves);
  return g;
}
export function monsteraPotB(s = 1, potR = 0.28) {   // monstera clump in a tall glossy pot (render)
  const g = new THREE.Group(), potH = potR * 1.7;
  g.add(tallPotB(potR, potH));
  for (let i = 0; i < 15; i++) {
    const a = i * 2.39996 + Math.random() * 0.3, l = (0.12 + (i % 4) * 0.1) * s, y = potH + (0.25 + (i % 5) * 0.14) * s, sz = (0.32 + Math.random() * 0.2) * s;
    const leaf = new THREE.Group(); leaf.position.set(Math.cos(a) * l, y, Math.sin(a) * l); leaf.rotation.y = -a + Math.PI / 2; g.add(leaf);
    const m = mesh(leaf, new THREE.PlaneGeometry(sz, sz), K2.monsteraLeaf, 0, 0, sz * 0.4, -0.7 - Math.random() * 0.6, 0, (Math.random() - 0.5) * 0.5); m.castShadow = true;
    const pet = mesh(g, new THREE.CylinderGeometry(0.006 * s, 0.008 * s, Math.hypot(l, y - potH) + 0.05, 5), P.stemGreen, Math.cos(a) * l / 2, (y + potH) / 2, Math.sin(a) * l / 2);
    pet.lookAt(Math.cos(a) * l, y, Math.sin(a) * l); pet.rotateX(Math.PI / 2); pet.position.set(Math.cos(a) * l / 2, (y + potH) / 2, Math.sin(a) * l / 2);
  }
  return g;
}
export function organicTableB() {                         // two overlapping low oval wood slabs (lobby / casa de campo render)
  const g = new THREE.Group();
  const a = mesh(g, new THREE.CylinderGeometry(0.5, 0.5, 0.06, 40), K2.oakLight, 0, 0.36, 0); a.scale.set(1.3, 1, 0.75);
  const b = mesh(g, new THREE.CylinderGeometry(0.4, 0.4, 0.06, 40), K2.oakLight, 0.45, 0.24, 0.3); b.scale.set(1.1, 1, 0.8);
  cylinder(g, 0.18, 0.22, 0.33, K2.oakLight, -0.1, 0, 0, 24); cylinder(g, 0.14, 0.18, 0.21, K2.oakLight, 0.45, 0, 0.3, 24);
  return g;
}
export function conePendant(y = 1.8, mat = std({ color: '#b5784a', roughness: 0.4, metalness: 0.5 })) {   // cone pendant on a long wire
  const g = new THREE.Group(); const sh = mat.clone(); sh.side = THREE.DoubleSide;
  mesh(g, new THREE.CylinderGeometry(0.03, 0.16, 0.26, 28, 1, true), sh, 0, y, 0);
  mesh(g, new THREE.CircleGeometry(0.13, 20), P.led, 0, y - 0.11, 0, Math.PI / 2, 0, 0, false);
  mesh(g, new THREE.CylinderGeometry(0.003, 0.003, 2.6 - y, 4), P.black, 0, y + 0.13 + (2.6 - y - 0.13) / 2, 0);
  return g;
}
export function arcLampB() {                              // marble-base arc floor lamp: one continuous brushed arc from the base up and over to the shade (reaching +z)
  const g = new THREE.Group();
  rb(g, 0.34, 0.12, 0.34, P.marble, 0, 0, -0.9, 0.02);
  const pts = [[0, 0.12, -0.9], [0, 1.0, -0.9], [0, 1.6, -0.82], [0, 1.98, -0.55], [0, 2.12, -0.15], [0, 2.06, 0.25], [0, 1.88, 0.55], [0, 1.76, 0.65]].map(p => new THREE.Vector3(...p));
  mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.016, 10, false), P.brushed, 0, 0, 0);
  cylinder(g, 0.022, 0.022, 0.05, P.brushed, 0, 0.1, -0.9, 12);                // collar on the base
  mesh(g, new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), P.shade, 0, 1.54, 0.65);   // dome shade, top meets the arc end
  cylinder(g, 0.025, 0.025, 0.04, P.brushed, 0, 1.73, 0.65, 12);               // socket joining arc and shade
  return g;
}
export function salonChairB(mat = fabric('#c08463', 1.3)) {    // styling chair: terracotta seat on a chrome hydraulic base (beauty render)
  const g = new THREE.Group();
  cylinder(g, 0.28, 0.3, 0.03, P.brushed, 0, 0, 0, 32);
  cylinder(g, 0.045, 0.045, 0.4, P.brushed, 0, 0.03, 0, 16);
  rb(g, 0.56, 0.16, 0.52, mat, 0, 0.42, 0.02, 0.06);
  rb(g, 0.56, 0.5, 0.12, mat, 0, 0.5, -0.22, 0.05, -0.08);
  for (const s of [-1, 1]) rb(g, 0.08, 0.2, 0.46, mat, s * 0.3, 0.52, 0.0, 0.04);
  rb(g, 0.3, 0.04, 0.1, P.brushed, 0, 0.12, 0.32, 0.01, -0.5);
  return g;
}
export function shampooB() {                              // shampoo station: beige chair + white basin behind (−z), legrest (+z)
  const g = new THREE.Group(), beige = fabric('#e2cba9', 1.2);
  rb(g, 0.6, 0.45, 0.6, std({ color: '#e9e6e0', roughness: 0.4 }), 0, 0, -0.05, 0.03);
  rb(g, 0.62, 0.16, 0.6, beige, 0, 0.42, 0, 0.06);
  rb(g, 0.62, 0.55, 0.14, beige, 0, 0.5, -0.3, 0.05, 0.25);
  for (const s of [-1, 1]) rb(g, 0.1, 0.25, 0.6, beige, s * 0.33, 0.45, 0, 0.04);
  rb(g, 0.5, 0.3, 0.42, beige, 0, 0.18, 0.55, 0.05, 0.3);
  const basin = mesh(g, new THREE.SphereGeometry(0.3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), P.ceramic, 0, 0.98, -0.62, Math.PI, 0, 0); basin.scale.set(1, 0.55, 0.8);
  rb(g, 0.08, 0.95, 0.3, P.brushed, 0, 0, -0.62, 0.02);
  return g;
}
export function pedicureB() {                             // pedicure chair: beige seat on a white drawer box with castors + footrest
  const g = new THREE.Group(), beige = fabric('#e2cba9', 1.2), wh = std({ color: '#efece6', roughness: 0.4 });
  rb(g, 0.48, 0.42, 0.48, wh, 0, 0.06, 0, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.SphereGeometry(0.03, 10, 8), P.black, sx * 0.2, 0.03, sz * 0.2);
  rb(g, 0.5, 0.1, 0.48, beige, 0, 0.48, 0, 0.04);
  rb(g, 0.36, 0.42, 0.1, beige, 0, 0.62, -0.22, 0.04);
  rb(g, 0.03, 0.4, 0.03, P.brushed, 0, 0.5, -0.22, 0.01);
  cylinder(g, 0.025, 0.025, 0.55, P.brushed, 0.35, 0, 0.35, 8);
  rb(g, 0.36, 0.03, 0.3, wh, 0.35, 0.55, 0.35, 0.01);
  return g;
}
export function loungeChairB(cush = fabric('#5f6b45', 1.4)) {  // low lounge chair, bent wood frame with green cushions (beauty render)
  const g = new THREE.Group(), wood = K2.darkWood;
  for (const s of [-1, 1]) {
    rb(g, 0.05, 0.05, 0.8, wood, s * 0.36, 0.0, 0, 0.02);
    rb(g, 0.05, 0.5, 0.05, wood, s * 0.36, 0.0, 0.32, 0.02, -0.15);
    rb(g, 0.05, 0.05, 0.6, wood, s * 0.36, 0.55, 0.05, 0.02);
    rb(g, 0.05, 0.75, 0.05, wood, s * 0.36, 0.0, -0.38, 0.02, 0.35);
  }
  rb(g, 0.66, 0.06, 0.7, std({ color: '#7a4e32', roughness: 0.6 }), 0, 0.26, 0.02, 0.01, -0.12);
  rb(g, 0.64, 0.12, 0.62, cush, 0, 0.3, 0.05, 0.05, -0.12);
  rb(g, 0.64, 0.5, 0.12, cush, 0, 0.4, -0.3, 0.05, 0.35);
  return g;
}
export function ledShelfB(w, deco = true) {               // floating wood shelf with LED below and a few bottles/towels (beauty render)
  const g = new THREE.Group();
  rb(g, w, 0.05, 0.25, K2.oakLight, 0, 0, 0, 0.008);
  rb(g, w - 0.08, 0.006, 0.02, P.led, 0, -0.008, 0.1, 0.002);
  if (deco) for (let i = 0; i < 4; i++) {
    const x = -w / 2 + 0.2 + i * 0.12;
    cylinder(g, 0.03, 0.03, 0.17, P.glassBottle, x, 0.05, 0, 12);
  }
  if (deco) for (let k = 0; k < 2; k++) rb(g, 0.24, 0.07, 0.16, P.towel, w / 2 - 0.25, 0.05 + k * 0.07, 0, 0.03);
  return g;
}
export function curvedWall(R, arc, h, mat, thetaStart = 0) {   // open cylinder segment (curved panelling), visible from both sides
  const g = new THREE.Group(); const m = mat.clone(); m.side = THREE.DoubleSide;
  mesh(g, new THREE.CylinderGeometry(R, R, h, 48, 1, true, thetaStart, arc), m, 0, h / 2, 0);
  for (let i = 1; i < 12; i++) {                                  // vertical reveals
    const t = thetaStart + arc * i / 12;
    mesh(g, new THREE.BoxGeometry(0.008, h, 0.01), P.taupeDark, (R - 0.004) * Math.sin(t), h / 2, (R - 0.004) * Math.cos(t), 0, t, 0, false);
  }
  return g;
}

// ---------------------------------------------------------------------------
// POOL RENDER UPGRADE: feathery queen palms, agapanthus, slatted teak loungers, dark slat fence
// ---------------------------------------------------------------------------
const frondTex = canvasTex(256, 1024, (g, w, h) => {          // queen-palm frond, base at the bottom: a rachis with dense, tapered, drooping leaflets
  g.clearRect(0, 0, w, h);
  const cx = w / 2, rnd = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();   // fixed seed: same palm every load
  const greens = [[86, 128, 52], [98, 142, 58], [74, 112, 44], [110, 150, 66], [92, 134, 48]];
  for (let y = h - 10; y > 40; y -= 6) {                       // leaflets every 6 px (≈ 180 a side): reads as a full feather, not a comb
    const t = 1 - y / h, reach = (cx - 6) * (0.42 + 0.58 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.78))) * (0.82 + rnd() * 0.18);   // still long at the tip: a soft, full end, no spike
    for (const sd of [-1, 1]) {
      const c = greens[(rnd() * greens.length) | 0], L = reach * (0.9 + rnd() * 0.1), droop = 26 + t * 30 + rnd() * 10, wid = 3.2 + (1 - t) * 2.6;
      // tapered leaf: from the rachis out and down, widest a third of the way, pointed tip
      const x1 = cx + sd * L, y1 = y + droop, mx = cx + sd * L * 0.45, my = y + droop * 0.18;
      g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      g.beginPath(); g.moveTo(cx, y - wid * 0.4);
      g.quadraticCurveTo(mx, my - wid, x1, y1);
      g.quadraticCurveTo(mx, my + wid, cx, y + wid * 0.6);
      g.closePath(); g.fill();
      g.strokeStyle = `rgba(${c[0] + 60},${c[1] + 60},${c[2] + 40},0.55)`; g.lineWidth = 0.9;   // pale midrib
      g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    }
  }
  const rg = g.createLinearGradient(0, h, 0, 0); rg.addColorStop(0, '#9a9a5a'); rg.addColorStop(1, '#6f8a3c');   // rachis: straw at the base, green to the tip
  g.strokeStyle = rg; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, h); g.lineTo(cx, 48); g.stroke();   // ends with the leaflets (no bare point)
});
frondTex.anisotropy = 8;
// a little light through the leaves (emissive) so crowns seen from below stay green, not black
K2.frondF = std({ map: frondTex, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.62, emissive: '#1d2a10', emissiveIntensity: 0.6 });
const trunkTex = canvasTex(64, 256, (g, w, h) => {
  g.fillStyle = '#8f8270'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 9) { g.fillStyle = 'rgba(70,60,48,0.55)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(200,190,170,0.25)'; g.fillRect(0, y + 3, w, 2); }
});
K2.trunkR = std({ map: trunkTex, roughness: 1 });
function featherGeo(len, wid) {                               // frond: arches up and out, then droops; folded into a shallow V along the rachis
  const g = new THREE.PlaneGeometry(wid, len, 6, 16), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = (p.getY(i) + len / 2) / len, x = p.getX(i), a = v * len;
    const fold = Math.abs(x) * (0.32 + v * 0.25);              // the V: leaflets hang below the rachis, more towards the tip
    p.setXYZ(i, x * (1 - v * 0.15), a * 0.55 - a * a * 0.22 - fold, a * 0.86);
  }
  g.computeVertexNormals(); return g;
}
const FEATHER = [featherGeo(3.4, 1.6), featherGeo(2.9, 1.45), featherGeo(2.2, 1.15)];
export function queenPalmB(h = 6, s = 1) {                    // slim ringed trunk, smooth green crownshaft, a full crown of 24 feathery fronds
  const g = new THREE.Group();
  const trunk = mesh(g, new THREE.CylinderGeometry(0.12 * s, 0.17 * s, h, 12), K2.trunkR, 0, h / 2, 0);
  trunk.material = K2.trunkR.clone(); trunk.material.map = K2.trunkR.map.clone(); trunk.material.map.repeat.set(1, h / 1.2); trunk.material.map.needsUpdate = true;
  mesh(g, new THREE.CylinderGeometry(0.15 * s, 0.13 * s, 0.9 * s, 12), std({ color: '#6c7f45', roughness: 0.6 }), 0, h + 0.35 * s, 0);   // crownshaft
  for (let i = 0; i < 24; i++) {
    const f = new THREE.Group(); f.position.set(0, h + 0.75 * s, 0); f.rotation.y = i * 2.39996 + (i % 5) * 0.05; g.add(f);   // golden-angle spread
    const tier = i % 3, up = [-0.42, -0.12, 0.28][tier] + ((i * 7) % 5) * 0.035;   // all arch outwards; only the youngest lean up a little
    const m = mesh(f, FEATHER[tier], K2.frondF, 0, 0, 0, up, 0, ((i * 13) % 7 - 3) * 0.04);
    m.scale.setScalar(s * (0.92 + ((i * 11) % 9) * 0.02));
  }
  return g;
}
export function agapanthusRow(len, depth = 0.6) {             // strap-leaf clumps with tall stalks and purple flower heads (pool render)
  const g = new THREE.Group();
  const leafG = new THREE.PlaneGeometry(0.035, 0.7, 1, 4); { const p = leafG.attributes.position; for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 0.35) / 0.7; p.setZ(i, v * v * 0.25); p.setY(i, v * 0.65); } leafG.computeVertexNormals(); }
  const nL = Math.floor(len * depth * 90), leaves = new THREE.InstancedMesh(leafG, std({ color: '#4f7a34', roughness: 0.7, side: THREE.DoubleSide }), nL);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  for (let i = 0; i < nL; i++) { e.set(0, Math.random() * 6.28, 0); q.setFromEuler(e); m4.compose(ps.set((Math.random() - 0.5) * len, 0, (Math.random() - 0.5) * depth), q, sc.setScalar(0.7 + Math.random() * 0.6)); leaves.setMatrixAt(i, m4); }
  g.add(leaves);
  const nS = Math.floor(len * depth * 7), stalk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.008, 1, 4), std({ color: '#5f8a3a' }), nS);
  const floretG = new THREE.SphereGeometry(0.02, 5, 4), nF = nS * 26, flor = new THREE.InstancedMesh(floretG, std({ color: '#6f62c6', roughness: 0.7 }), nF);
  let f = 0;
  for (let i = 0; i < nS; i++) {
    const x = (Math.random() - 0.5) * len, z = (Math.random() - 0.5) * depth, h = 0.8 + Math.random() * 0.4;
    m4.compose(ps.set(x, h / 2, z), q.identity(), sc.set(1, h, 1)); stalk.setMatrixAt(i, m4);
    for (let k = 0; k < 26; k++) { const a = Math.random() * 6.28, b = Math.random() * 1.6, r = 0.1; m4.makeTranslation(x + Math.cos(a) * Math.sin(b) * r, h + Math.cos(b) * r * 0.8, z + Math.sin(a) * Math.sin(b) * r); flor.setMatrixAt(f++, m4); }
  }
  g.add(stalk, flor);
  return g;
}
export function bushRow(len, depth = 0.8, h = 0.9) {     // row of rounded leafy shrubs (pool renders): clustered leaf clumps, several greens, instanced
  const g = new THREE.Group(), greens = ['#3f6a2e', '#4d7a35', '#5a8a3c', '#355f28', '#6b9a45'].map(c => std({ color: c, roughness: 0.85, flatShading: true }));
  const geo = new THREE.IcosahedronGeometry(1, 1), per = greens.map(() => []), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const step = Math.min(0.9, depth * 1.1), n = Math.max(1, Math.round(len / step));
  for (let b = 0; b < n; b++) {
    const cx = -len / 2 + (b + 0.5) * len / n + (Math.random() - 0.5) * 0.15, r = Math.min(depth * 0.55, 0.5) * (0.85 + Math.random() * 0.3), hb = h * (0.8 + Math.random() * 0.35);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.7, s = r * (0.35 + Math.random() * 0.25);
      e.set(Math.random() * 3, Math.random() * 3, 0); q.setFromEuler(e);
      m4.compose(ps.set(cx + Math.cos(a) * d * 1.2, Math.min(hb - s * 0.6, s * 0.7 + Math.random() * hb * 0.75), Math.sin(a) * d * 0.8), q, sc.set(s, s * 0.85, s));
      per[(b * 7 + i) % 5].push(m4.clone());
    }
  }
  greens.forEach((mat, k) => { const im = new THREE.InstancedMesh(geo, mat, per[k].length); per[k].forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = im.receiveShadow = true; g.add(im); });
  return g;
}
export function slatLoungerB() {                              // teak slatted sun lounger with raised back, head at −z (pool render)
  const g = new THREE.Group(), teak = std({ color: '#a8743f', roughness: 0.65 });
  for (const sx of [-1, 1]) { rb(g, 0.05, 0.05, 1.95, teak, sx * 0.31, 0.27, 0, 0.01); for (const sz of [-0.85, 0.85]) rb(g, 0.06, 0.3, 0.06, teak, sx * 0.31, 0, sz, 0.01); }
  for (let i = 0; i < 14; i++) rb(g, 0.62, 0.025, 0.075, teak, 0, 0.31, -0.05 + i * 0.075, 0.006);
  const back = new THREE.Group(); back.position.set(0, 0.33, -0.12); back.rotation.x = 0.6; g.add(back);
  for (let i = 0; i < 10; i++) rb(back, 0.62, 0.025, 0.075, teak, 0, 0, -0.04 - i * 0.08, 0.006);
  for (const sx of [-1, 1]) rb(back, 0.04, 0.04, 0.82, teak, sx * 0.31, -0.03, -0.41, 0.008);
  return g;
}
