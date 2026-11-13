// Premium furniture / finishes for the leisure rooms (casa de campo, lobby, coworking, beauty, spa, fitness).
// Same conventions as the apartment kit: local metres, footprint centred on the origin, FRONT faces +z.
import * as THREE from 'three';
import { P, cylinder, fabric, marble, mesh, phys, rb, std, velvet, canvasTex } from '../engine/core.js';
import { K2 } from './pav2Kit.js';

export const PK = {
  olive: fabric('#5f604c', 1.5),
  mustard: velvet('#c08a3e', '#f0c27a'),
  rust: velvet('#b2683a', '#e8a070'),
  oat: fabric('#d8ccb8', 1.6),
  drape: phys({ color: '#d8cdbd', roughness: 0.95, sheen: 0.8, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide }),
  sheer: std({ color: '#f1ebe1', roughness: 1, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
  travertine: phys({ map: marble('#ddd2bf', '176,158,128', 0.22), roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  walnutDark: phys({ color: '#4a3326', roughness: 0.45, clearcoat: 0.3 }),
  chairUph: fabric('#3b332e', 1.3),
  cognac: phys({ color: '#9b5e34', roughness: 0.5, clearcoat: 0.3, bumpMap: null }),
  steel: std({ color: '#c9ccd0', roughness: 0.22, metalness: 1 }),
  matBlack: std({ color: '#161718', roughness: 0.5, metalness: 0.3 }),
  jute: phys({ color: '#b8a687', roughness: 1, sheen: 0.5, sheenColor: new THREE.Color('#e6d9bf') }),
};

// pleated floor-to-ceiling curtain, width along x, hangs from y = h, pleats in z
export function drapeB(w, h, mat = PK.drape, folds = 0) {
  const g = new THREE.Group(), n = folds || Math.max(4, Math.round(w / 0.12));
  const geo = new THREE.PlaneGeometry(w, h, n * 4, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w + 0.5) * n * Math.PI * 2) * 0.045);
  geo.computeVertexNormals();
  mesh(g, geo, mat, 0, h / 2, 0);
  rb(g, w, 0.02, 0.04, PK.matBlack, 0, h - 0.01, -0.06, 0.005);                 // track
  return g;
}
// L sofa: main run along x (back at −z), chaise return at the +x end reaching +z
export function lSofaB(w, ret = 1.7, mat = PK.olive) {
  const g = new THREE.Group(), D = 0.98;
  rb(g, w, 0.22, D, mat, 0, 0.05, 0, 0.05);
  rb(g, w, 0.04, D - 0.04, PK.matBlack, 0, 0.0, 0, 0.01);
  const seats = Math.round((w - D) / 0.85);
  for (let i = 0; i < seats; i++) rb(g, (w - D) / seats - 0.02, 0.17, D - 0.24, mat, -w / 2 + (i + 0.5) * (w - D) / seats, 0.27, 0.1, 0.07);
  rb(g, w, 0.42, 0.26, mat, 0, 0.27, -D / 2 + 0.13, 0.1);
  rb(g, 0.24, 0.3, D, mat, -w / 2 + 0.12, 0.27, 0, 0.08);                         // arm
  rb(g, D, 0.22, ret, mat, w / 2 - D / 2, 0.05, (ret - D) / 2 + D / 2 - D / 2, 0.05);   // chaise base
  rb(g, D - 0.06, 0.17, ret - 0.06, mat, w / 2 - D / 2, 0.27, (ret - D) / 2, 0.07);
  rb(g, 0.26, 0.42, ret, mat, w / 2 - 0.13, 0.27, (ret - D) / 2, 0.1);
  const cols = [PK.mustard, PK.oat, PK.rust, PK.mustard, PK.oat, PK.rust];
  for (let i = 0; i < Math.round(w / 0.62); i++) rb(g, 0.48, 0.44, 0.15, cols[i % cols.length], -w / 2 + 0.45 + i * 0.6, 0.48, -D / 2 + 0.33, 0.07, -0.22, (i % 2 - 0.5) * 0.15);
  return g;
}
export function ovalStoneTableB(w = 2.6, d = 1.3) {                 // oval travertine top on a slab pedestal (render)
  const g = new THREE.Group();
  const top = mesh(g, new THREE.CylinderGeometry(0.5, 0.5, 0.06, 64), PK.travertine, 0, 0.72, 0); top.scale.set(w, 1, d);
  const ped = mesh(g, new THREE.CylinderGeometry(0.5, 0.5, 0.69, 48), PK.travertine, 0, 0.345, 0); ped.scale.set(w * 0.45, 1, d * 0.32);
  return g;
}
export function diningChairB(seat = PK.chairUph, wood = PK.walnutDark) {   // walnut chair, curved back rail, dark cushion (render)
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(g, 0.016, 0.016, 0.42, wood, sx * 0.2, 0, sz * 0.19, 10);   // straight legs
  rb(g, 0.47, 0.03, 0.45, wood, 0, 0.42, 0, 0.01);
  rb(g, 0.45, 0.07, 0.43, seat, 0, 0.45, 0.01, 0.03);
  for (const s of [-1, 1]) cylinder(g, 0.016, 0.016, 0.42, wood, s * 0.2, 0.45, -0.19, 10);   // rear legs continue up as the back posts
  // curved back rail: a solid arc whose ends land exactly on the two posts (x = ±0.2, z = −0.19), bowing 5 cm backwards
  const sag = 0.05, R = (0.2 * 0.2 + sag * sag) / (2 * sag), half = Math.asin(0.2 / R), cz = -0.19 - sag + R, T = 0.022, s2 = new THREE.Shape(), n = 24;
  for (let i = 0; i <= n; i++) { const a = -half + 2 * half * i / n; s2[i ? 'lineTo' : 'moveTo'](R * Math.sin(a), cz - R * Math.cos(a)); }
  for (let i = n; i >= 0; i--) { const a = -half + 2 * half * i / n; s2.lineTo((R + T) * Math.sin(a), cz - (R + T) * Math.cos(a)); }
  const back = mesh(g, new THREE.ExtrudeGeometry(s2, { depth: 0.17, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 1 }), wood, 0, 0.85, 0, Math.PI / 2, 0, 0);   // rotated so the shape lies in xz; the extrusion runs down from y 0.85 to 0.68
  return g;
}
export function discPendantLine(len = 1.6, n = 4, yLow = 1.85) {     // slim black bar with small disc lights on wires (render)
  const g = new THREE.Group(), H = 2.6;
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * len / n, y = yLow + (i % 2) * 0.12;
    mesh(g, new THREE.CylinderGeometry(0.0025, 0.0025, H - y, 4), PK.matBlack, x, y + (H - y) / 2, 0);
    mesh(g, new THREE.CylinderGeometry(0.075, 0.075, 0.035, 24), PK.matBlack, x, y, 0);
    mesh(g, new THREE.CircleGeometry(0.06, 20), P.led, x, y - 0.019, 0, Math.PI / 2, 0, 0, false);
  }
  return g;
}
export function builtGrillB() {                                      // stainless built-in gas grill with a domed lid, front +z
  const g = new THREE.Group();
  rb(g, 0.8, 0.06, 0.55, PK.steel, 0, 0, 0, 0.01);
  const lid = mesh(g, new THREE.CylinderGeometry(0.27, 0.27, 0.78, 32, 1, false, 0, Math.PI), PK.steel, 0, 0.06, -0.02, 0, 0, Math.PI / 2);
  lid.scale.set(1, 1, 0.9);
  rb(g, 0.62, 0.02, 0.02, PK.steel, 0, 0.2, 0.27, 0.005);
  for (let i = 0; i < 4; i++) cylinder(g, 0.02, 0.02, 0.03, PK.matBlack, -0.27 + i * 0.18, 0.0, 0.29, 12);
  return g;
}
export function flutedRun(g, w, h, y, z, mat = PK.walnutDark, step = 0.045) {   // vertical flutes on a cabinet face
  rb(g, w, h, 0.02, mat, 0, y, z, 0.004);
  for (let x = -w / 2 + step / 2; x < w / 2; x += step) mesh(g, new THREE.CylinderGeometry(0.012, 0.012, h - 0.02, 8), mat, x, y + h / 2, z + 0.012);
}
// kitchen back wall: fluted walnut base cabinets, travertine top + slab backsplash, LED open shelves with decor, wall cabinet
export function kitchenWallB(w, d = 0.62) {
  const g = new THREE.Group();
  rb(g, w, 0.82, d - 0.03, PK.walnutDark, 0, 0.08, -0.015, 0.006);
  flutedRun(g, w - 0.02, 0.74, 0.1, d / 2 - 0.02);
  rb(g, w - 0.04, 0.08, d - 0.08, PK.matBlack, 0, 0, -0.03, 0.005);
  rb(g, w + 0.02, 0.04, d + 0.02, PK.travertine, 0, 0.9, 0, 0.006);
  rb(g, w, 0.62, 0.025, PK.travertine, 0, 0.94, -d / 2 + 0.012, 0.004);           // backsplash slab
  rb(g, 0.45, 0.012, 0.36, P.blackGlass, -w * 0.25, 0.945, 0.02, 0.003);
  const sink = mesh(g, new THREE.BoxGeometry(0.5, 0.012, 0.36), PK.matBlack, w * 0.2, 0.935, 0.02);
  sink.castShadow = false;
  cylinder(g, 0.014, 0.014, 0.32, PK.matBlack, w * 0.2, 0.94, -0.2, 10);
  for (const y of [1.62, 2.0]) {                                       // open shelves with LED under
    rb(g, w * 0.55, 0.04, 0.26, PK.walnutDark, -w * 0.2, y, -d / 2 + 0.13, 0.006);
    rb(g, w * 0.55 - 0.08, 0.006, 0.02, P.led, -w * 0.2, y - 0.008, -d / 2 + 0.22, 0.002);
    const deco = [std({ color: '#a8673f', roughness: 0.6 }), std({ color: '#d9cdb8', roughness: 0.5 }), std({ color: '#6c7356', roughness: 0.6 })];
    for (let i = 0; i < 4; i++) { const x = -w * 0.2 - w * 0.22 + i * w * 0.14; if (i % 2) cylinder(g, 0.06, 0.08, 0.2, deco[i % 3], x, y + 0.04, -d / 2 + 0.13, 18); else mesh(g, new THREE.SphereGeometry(0.08, 16, 10), deco[i % 3], x, y + 0.12, -d / 2 + 0.13); }
  }
  rb(g, w * 0.4, 0.7, 0.36, PK.walnutDark, w * 0.28, 1.6, -d / 2 + 0.18, 0.006);   // wall cabinet
  flutedRun(g, w * 0.4 - 0.02, 0.66, 1.62, -d / 2 + 0.36);
  rb(g, w * 0.4 - 0.06, 0.006, 0.02, P.led, w * 0.28, 1.595, -d / 2 + 0.3, 0.002);
  return g;
}
export function uplitPlant(s = 1) {                                  // garden clump with a ground uplight (render: lit garden behind the glass)
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9, l = 0.35 * s;
    const leaf = mesh(g, new THREE.CircleGeometry(0.3 * s, 10), i % 2 ? K2.monstera : P.leaf2, Math.cos(a) * l, (0.6 + (i % 3) * 0.3) * s, Math.sin(a) * l, -1.0 + (i % 2) * 0.4, a, 0);
    leaf.scale.set(0.6, 1.3, 1);
  }
  mesh(g, new THREE.CircleGeometry(0.06, 16), P.led, 0, 0.02, 0.3 * s, -Math.PI / 2, 0, 0, false);
  return g;
}
export function bigPotTree(s = 1, pot = std({ color: '#5a3b2a', roughness: 0.45 })) {   // ficus / olive tree in a big dark pot (lobby render)
  const g = new THREE.Group();
  const potM = mesh(g, new THREE.CylinderGeometry(0.32 * s, 0.24 * s, 0.6 * s, 32), pot, 0, 0.3 * s, 0);
  potM.castShadow = true;
  cylinder(g, 0.03 * s, 0.05 * s, 1.6 * s, std({ color: '#6b5443', roughness: 1 }), 0, 0.55 * s, 0, 8);
  const leafM = std({ color: '#4f7a3a', roughness: 0.8 }), leaf2 = std({ color: '#6a9150', roughness: 0.8 });
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, r = (0.25 + (i % 4) * 0.12) * s, y = (1.6 + (i % 5) * 0.2) * s;
    const b = mesh(g, new THREE.IcosahedronGeometry(0.28 * s, 1), i % 2 ? leafM : leaf2, Math.cos(a) * r, y, Math.sin(a) * r); b.scale.set(1, 0.7, 1);
  }
  return g;
}
export function chromeChairB() {                                     // coworking chair (render): grey upholstered seat + back on a chrome tube frame with arms and castors
  const g = new THREE.Group(), uph = fabric('#a9aaa3', 1.4), ch = std({ color: '#d7dadc', roughness: 0.18, metalness: 1 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) { mesh(g, new THREE.CylinderGeometry(0.012, 0.012, 0.42, 10), ch, sx * 0.24, 0.23, sz * 0.22, sz * 0.12, 0, -sx * 0.1); mesh(g, new THREE.SphereGeometry(0.025, 10, 8), PK.matBlack, sx * 0.26, 0.025, sz * 0.25); }
    mesh(g, new THREE.CylinderGeometry(0.011, 0.011, 0.5, 10), ch, sx * 0.27, 0.66, -0.0, Math.PI / 2 - 0.08, 0, 0);       // arm tube
    rb(g, 0.05, 0.025, 0.24, PK.walnutDark, sx * 0.27, 0.665, 0.05, 0.01);                                             // wood arm pad
    mesh(g, new THREE.CylinderGeometry(0.011, 0.011, 0.5, 10), ch, sx * 0.25, 0.68, -0.25, -0.2);                      // back post
  }
  rb(g, 0.5, 0.1, 0.48, uph, 0, 0.42, 0.01, 0.05);
  rb(g, 0.48, 0.42, 0.09, uph, 0, 0.52, -0.25, 0.05, -0.15);
  return g;
}
export function laptopB() {
  const g = new THREE.Group(), al = std({ color: '#b9bcbf', roughness: 0.3, metalness: 0.8 });
  rb(g, 0.32, 0.012, 0.22, al, 0, 0, 0, 0.004);
  const lid = new THREE.Group(); lid.position.set(0, 0.012, -0.11); lid.rotation.x = -0.35; g.add(lid);
  rb(lid, 0.32, 0.21, 0.008, al, 0, 0, 0, 0.004); mesh(lid, new THREE.PlaneGeometry(0.29, 0.18), P.screen, 0, 0.105, 0.0045, 0, 0, 0, false);
  return g;
}
export function fiddleFigB(s = 1, pot = std({ color: '#a8552f', roughness: 0.7 })) {   // fiddle-leaf fig in a terracotta pot (coworking render)
  const g = new THREE.Group(), leaf = std({ color: '#4d7a32', roughness: 0.55, side: THREE.DoubleSide });
  mesh(g, new THREE.CylinderGeometry(0.3 * s, 0.24 * s, 0.5 * s, 28), pot, 0, 0.25 * s, 0);
  cylinder(g, 0.02 * s, 0.03 * s, 1.5 * s, std({ color: '#6b5443' }), 0, 0.45 * s, 0, 6);
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4, y = (0.7 + (i / 26) * 1.2) * s, r = (0.12 + Math.sin(i) * 0.06 + 0.12) * s;
    const l = mesh(g, new THREE.CircleGeometry(0.14 * s, 10), leaf, Math.cos(a) * r, y, Math.sin(a) * r, -0.5 - (i % 3) * 0.3, a, 0); l.scale.set(0.75, 1.15, 1);
  }
  return g;
}

export const plankTex = canvasTex(512, 512, (g, w, h) => {          // weathered brown wood planks, horizontal (jogos render)
  for (let r = 0; r < 16; r++) { const t = 0.75 + Math.random() * 0.4; g.fillStyle = `rgb(${112 * t | 0},${88 * t | 0},${68 * t | 0})`; g.fillRect(0, r * 32, w, 31);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,28,20' : '170,150,125'},0.18)`; g.fillRect(Math.random() * w, r * 32 + Math.random() * 30, 40 + Math.random() * 160, 1.5); }
    g.fillStyle = 'rgba(25,18,12,0.6)'; g.fillRect(0, r * 32 + 30, w, 2); g.fillRect((r * 137) % w, r * 32, 2, 31); }
});
export function lBanquetteB(a = 6, b = 2.4, R = 0.5) {     // L banquette with a smooth curved inner corner: top run along x (back at −z), leg along +z at the −x end; outer corner square (against the planter)
  const g = new THREE.Group(), D = 0.62, blue = velvet('#3d5b96', '#94b3ea'), wood = std({ map: plankTex, roughness: 0.75 });
  const X0 = -a / 2, Z0 = -D / 2;                                                // outer corner
  const cx = X0 + D + R, cz = Z0 + D + R;                                        // centre of the inner rounding
  const band = (o, d) => {                                                       // L footprint between offsets o (from the outer edges) and d
    const s = new THREE.Shape(), r = R + D - d;
    s.moveTo(X0 + o, b); s.lineTo(X0 + o, Z0 + o); s.lineTo(a / 2, Z0 + o); s.lineTo(a / 2, Z0 + d); s.lineTo(cx, Z0 + d);
    s.absarc(cx, cz, r, -Math.PI / 2, -Math.PI, true); s.lineTo(X0 + d, b); s.lineTo(X0 + o, b); return s; };
  const layer = (shape, y0, y1, mat, bev = 0) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0 - 2 * bev, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 24 });
    geo.rotateX(Math.PI / 2); geo.translate(0, y1 - bev, 0);
    const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); };
  layer(band(0, D), 0, 0.38, wood);                                              // wood plinth
  layer(band(0.2, D - 0.03), 0.38, 0.5, blue, 0.035);                            // seat cushion
  layer(band(0.02, 0.2), 0.38, 0.86, blue, 0.045);                               // back cushion
  return g;
}
export function velvetBanquetteB(a = 6, b = 2.2, R = 0.9) {         // blue velvet banquette, run along x (back at −z) curving round a corner into a run along +z at the −x end
  const g = new THREE.Group(), D = 0.62, blue = velvet('#3d5b96', '#94b3ea'), wood = std({ map: plankTex, roughness: 0.75 });
  const seg = (w, x, z, ry) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
    rb(s, w, 0.38, D, wood, 0, 0, 0, 0.02); rb(s, w, 0.13, D - 0.08, blue, 0, 0.36, 0.03, 0.05); rb(s, w, 0.46, 0.18, blue, 0, 0.46, -D / 2 + 0.1, 0.08); };
  const x0 = -a / 2 + R;
  seg(a - R, x0 + (a - R) / 2, 0, 0);
  const n = 6; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n * Math.PI / 2, cx = x0 - R * Math.sin(t), cz = R - R * Math.cos(t); seg(R * Math.PI / 2 / n * 1.08, cx, cz, t); }
  seg(b - R, x0 - R, R + (b - R) / 2, Math.PI / 2);
  return g;
}
