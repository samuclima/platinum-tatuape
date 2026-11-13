// Premium car – one shared model (a long-wheelbase executive saloon, ≈ 4.90 × 1.90 × 1.44 m) used for every parked car.
// The body is a single smooth lofted shell (rounded cross-sections along the length, real wheel arches, rounded nose and
// tail); a tinted glass greenhouse with a chrome window surround sits on the shoulders. Lights, trims and 20" twin-spoke
// wheels are placed ON the body surface using the same section maths. Every part is merged per material once; each car
// is ~10 meshes sharing those geometries, with its own clear-coated paint. Front = local +z, origin at the ground centre.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { phys, std } from '../engine/core.js';

const L2 = 2.45, AXLE = 1.475, R = 0.355, AR = 0.4, WX = 0.8, N = 6;   // half length, axle z, tyre radius, arch radius, wheel x, superellipse
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------- body section along the length ----------------
function yTopRaw(z) {
  if (z > 1.0) return 0.9 - 0.2 * Math.pow((z - 1.0) / 1.45, 1.6);                       // bonnet sloping to the nose
  if (z > -1.6) return 0.9 + 0.04 * (1.0 - z) / 2.6;                                       // rising waistline
  const t = (-1.6 - z) / 0.85; return 0.94 + 0.03 * t - 0.1 * t * t * t;                   // boot lid + ducktail
}
function yBotRaw(z) {
  let y = 0.2 + 0.13 * Math.pow(smoothstep(1.85, L2, z), 1.5) + 0.12 * Math.pow(smoothstep(-1.95, -L2, z), 1.5);
  for (const a of [AXLE, -AXLE]) { const d = Math.abs(z - a); if (d < AR) y = Math.max(y, R + Math.sqrt(AR * AR - d * d)); }
  return y;
}
function section(z) {
  const e = 0.3, dz = Math.abs(z) - (L2 - e), f = dz > 0 ? Math.sqrt(Math.max(0, 1 - (dz / e) ** 2)) : 1;
  const hw = 0.95 * (1 - 0.05 * (z / L2) ** 2) * (0.55 + 0.45 * f);
  const top = yTopRaw(z), bot = yBotRaw(z), yc0 = (top + bot) / 2, hh0 = (top - bot) / 2;
  const hh = hh0 * (0.62 + 0.38 * f), yc = yc0 + (hh0 - hh) * 0.15;
  return { hw, yc, hh };
}
const ringPt = (s, c, sec) => { const k = 2 / N, tuck = 1 - 0.1 * Math.max(0, s) - 0.06 * Math.max(0, -s);
  return [sec.hw * Math.sign(c) * Math.abs(c) ** k * tuck, sec.yc + sec.hh * Math.sign(s) * Math.abs(s) ** k]; };
// outer x of the body at (z, y) – used to stick trims, handles, mirrors to the paint
export function surfX(z, y) {
  const sec = section(z), u = (y - sec.yc) / sec.hh; if (Math.abs(u) >= 1) return 0;
  const s = Math.sign(u) * Math.abs(u) ** (N / 2), c = Math.sqrt(Math.max(0, 1 - s * s));
  return ringPt(s, c, sec)[0];
}
// front (sgn 1) or rear (sgn -1) surface z at (x, y)
function surfZ(x, y, sgn) {
  // scan inward from the tip (the wheel arches are holes, so the body is not solid all the way to the centre), then refine
  let m = L2 + 0.01; while (m > 0 && !(surfX(sgn * m, y) > Math.abs(x))) m -= 0.01;
  let lo = m, hi = m + 0.01;
  for (let i = 0; i < 20; i++) { const c = (lo + hi) / 2; if (surfX(sgn * c, y) > Math.abs(x)) lo = c; else hi = c; }
  return sgn * lo;
}

// ---------------- geometry helpers ----------------
function loft(rings, closed = true) {                                   // rings of [x,y,z], same length, CCW seen from +z, z increasing
  const M = rings[0].length, pos = [], idx = [];
  for (const r of rings) for (const p of r) pos.push(...p);
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < (closed ? M : M - 1); j++) {
    const a = i * M + j, b = i * M + (j + 1) % M, c = (i + 1) * M + j, d = (i + 1) * M + (j + 1) % M;
    idx.push(a, b, c, b, d, c);
  }
  for (const [ri, back] of closed ? [[0, true], [rings.length - 1, false]] : []) {   // end caps
    const r = rings[ri], cx = r.reduce((s, p) => s + p[0], 0) / M, cy = r.reduce((s, p) => s + p[1], 0) / M, ci = pos.length / 3;
    pos.push(cx, cy, r[0][2]);
    for (let j = 0; j < M; j++) { const p = ri * M + j, q = ri * M + (j + 1) % M; back ? idx.push(ci, q, p) : idx.push(ci, p, q); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
const tube = (pts, r, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), closed), Math.max(8, pts.length * 3), r, 8, closed);
const V = (x, y, z) => [x, y, z];

// ---------------- the model (built once) ----------------
let parts = null;
function build() {
  const P = { body: [], glass: [], trim: [], chrome: [], tyre: [], rim: [], rimDark: [], disc: [], head: [], drl: [], tail: [], lens: [] };
  // BODY shell: 120 stations, 64 points round
  const zs = []; for (let i = 0; i <= 120; i++) { const t = i / 120; zs.push(-L2 + 2 * L2 * (0.5 - 0.5 * Math.cos(Math.PI * t))); }   // denser at the ends
  P.body.push(loft(zs.map(z => { const sec = section(z), ring = [];
    for (let j = 0; j < 64; j++) { const th = -Math.PI / 2 + j / 64 * Math.PI * 2; const [x, y] = ringPt(Math.sin(th), Math.cos(th), sec); ring.push([x, y, z]); }
    return ring; })));

  // GREENHOUSE: tinted glass on the shoulders, roofline from a spline
  const roofCurve = new THREE.SplineCurve([[0.97, 0.88], [0.6, 1.08], [0.2, 1.3], [-0.25, 1.39], [-0.85, 1.38], [-1.3, 1.22], [-1.7, 0.92]].map(([z, y]) => new THREE.Vector2(z, y)));
  const roofPts = roofCurve.getPoints(300), roofY = z => { for (let i = 0; i < roofPts.length - 1; i++) { const a = roofPts[i], b = roofPts[i + 1]; if (z <= a.x && z >= b.x) return a.y + (b.y - a.y) * (z - a.x) / (b.x - a.x); } return 0; };
  const gz = []; for (let i = 0; i <= 80; i++) gz.push(0.95 - i / 80 * 2.6);
  const gBase = z => yTopRaw(z) - 0.035;
  // glass section point: upright side glass (tumblehome) turning into a flat roof
  const gPt = (g, th) => { const c = Math.cos(th), s = Math.sin(th); return [Math.sign(c) * Math.abs(c) ** 0.22 * (g.hb + (g.ht - g.hb) * s ** 1.5), g.yb + g.h * s ** 0.3]; };
  const gSec = z => { const yb = gBase(z), h = Math.max(0.004, roofY(z) - yb), hb = surfX(z, yb) * 0.94, ht = hb * 0.8; return { yb, h, hb, ht }; };
  P.glass.push(loft(gz.slice().reverse().map(z => { const g = gSec(z), ring = [];
    for (let j = 0; j <= 24; j++) { const th = j / 24 * Math.PI; ring.push([...gPt(g, th), z]); }
    for (let j = 1; j < 6; j++) ring.push([-g.hb + 2 * g.hb * j / 6, g.yb, z]);
    return ring; })));
  // body-colour roof panel over the glass (the side windows read as a black band below it)
  { const TH0 = 0.42, rz = gz.filter(z => z < 0.22 && z > -1.05);   // roof panel only over the cabin: full-size windscreen + rear window
    P.body.push(loft(rz.slice().reverse().map(z => { const g = gSec(z), ring = [];
      for (let j = 0; j <= 20; j++) { const th = TH0 + j / 20 * (Math.PI - 2 * TH0), [x, y] = gPt(g, th); ring.push([x * 1.012, y + 0.008, z]); } return ring; }), false));
    const cz = gz.filter(z => z < -1.05 && z > -1.66);                                 // C-pillar sails, both sides
    for (const [a0, a1] of [[0.03, TH0 + 0.02], [Math.PI - TH0 - 0.02, Math.PI - 0.03]]) P.body.push(loft(cz.slice().reverse().map(z => { const g = gSec(z), ring = [];
      for (let j = 0; j <= 10; j++) { const [x, y] = gPt(g, a0 + j / 10 * (a1 - a0)); ring.push([x * 1.012, y + 0.006, z]); } return ring; }), false));
    for (const sx of [-1, 1]) { const fr = []; for (const z of rz) { const g = gSec(z), [x, y] = gPt(g, sx > 0 ? TH0 : Math.PI - TH0); fr.push(V(x * 1.012, y + 0.004, z)); } P.chrome.push(tube(fr, 0.008)); } }
  // chrome belt line along the side windows, both sides; gloss-black B-pillar
  for (const sx of [-1, 1]) {
    const belt = [];
    for (let z = 0.93; z >= -1.63; z -= 0.08) { const g = gSec(z), yb = g.yb + 0.03; belt.push(V(sx * (surfX(z, yb) + 0.004), yb, z)); }
    P.chrome.push(tube(belt, 0.009));
    { const z0 = -0.15, g = gSec(z0), pts = []; for (let j = 0; j <= 8; j++) { const th = sx > 0 ? 0.02 + j / 8 * 0.36 : Math.PI - 0.02 - j / 8 * 0.36, [x, y] = gPt(g, th); pts.push(V(x * 1.01, y, z0)); }
      P.trim.push(tube(pts, 0.02)); }
  }

  // DOOR shut lines, flush chrome handles, black sill blades
  for (const sx of [-1, 1]) {
    for (const z of [0.98, -0.08, -1.04]) { const pts = []; for (let y = 0.3; y <= 0.9; y += 0.05) pts.push(V(sx * (surfX(z - (y - 0.3) * 0.08, y) + 0.002), y, z - (y - 0.3) * 0.08)); P.trim.push(tube(pts, 0.0035)); }
    for (const z of [0.35, -0.7]) { const y = 0.8, x = surfX(z, y); const h = new THREE.BoxGeometry(0.012, 0.022, 0.2); h.translate(sx * (x + 0.002), y, z); P.chrome.push(h); }
    const sill = []; for (let z = 1.0; z >= -1.0; z -= 0.1) sill.push(V(sx * (surfX(z, 0.27) + 0.008), 0.27, z)); P.trim.push(tube(sill, 0.02));
    const line = []; for (let z = 1.9; z >= -2.0; z -= 0.1) { const y = 0.5 + 0.03 * Math.cos(z); line.push(V(sx * (surfX(z, y) + 0.001), y, z)); }   // subtle chrome body line
    P.chrome.push(tube(line, 0.0035));
  }

  // MIRRORS (body colour shells, black arms)
  for (const sx of [-1, 1]) { const z = 0.78, y = 0.98, x = surfX(z, 0.9);
    const shell = new THREE.SphereGeometry(1, 20, 14); shell.scale(0.1, 0.05, 0.065); shell.translate(sx * (x + 0.13), y, z - 0.03); P.body.push(shell);
    const mg = new THREE.CircleGeometry(1, 20); mg.scale(0.085, 0.04, 1); mg.rotateY(Math.PI); mg.translate(sx * (x + 0.13), y, z - 0.094); P.glass.push(mg);
    P.trim.push(tube([V(sx * (x - 0.02), 0.92, z + 0.02), V(sx * (x + 0.06), 0.95, z), V(sx * (x + 0.09), 0.97, z - 0.02)], 0.014)); }

  // FRONT: slim LED headlights following the nose, DRL signature, black grille + chrome surround, lower intakes
  for (const sx of [-1, 1]) {
    const head = [], drl = [];
    for (let x = 0.42; x <= 0.86; x += 0.04) { head.push(V(sx * x, 0.66 - (x - 0.42) * 0.05, surfZ(x, 0.66, 1) + 0.004)); drl.push(V(sx * x, 0.61 - (x - 0.42) * 0.06, surfZ(x, 0.61, 1) + 0.006)); }
    P.lens.push(tube(head, 0.024)); P.head.push(tube(head.map(p => [p[0], p[1] + 0.005, p[2] + 0.02]), 0.014)); P.drl.push(tube(drl, 0.007));
    const intake = []; for (let x = 0.5; x <= 0.8; x += 0.05) intake.push(V(sx * x, 0.32, surfZ(x, 0.32, 1) + 0.005)); P.trim.push(tube(intake, 0.045));
  }
  { const grille = [], gw = 0.36; for (let k = 0; k <= 32; k++) { const a = k / 32 * Math.PI * 2, x = gw * Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.4, y = 0.48 + 0.11 * Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.4; grille.push(V(x, y, surfZ(x, y, 1) + 0.006)); }
    P.chrome.push(tube(grille, 0.012, true));
    const zg = surfZ(0, 0.48, 1); const gr = new THREE.BoxGeometry(0.7, 0.2, 0.05); gr.translate(0, 0.48, zg - 0.015); P.trim.push(gr);
    for (let i = -3; i <= 3; i++) { const b = new THREE.BoxGeometry(0.012, 0.19, 0.02); b.translate(i * 0.1, 0.48, zg + 0.008); P.chrome.push(b); } }

  // REAR: full-width light bar wrapping the corners, red lenses, chrome strip, diffuser, twin exhaust
  { const bar = []; for (let x = -0.9; x <= 0.901; x += 0.05) bar.push(V(x, 0.83, surfZ(x, 0.83, -1) - 0.004));
    P.lens.push(tube(bar, 0.016)); P.tail.push(tube(bar.map(p => [p[0], p[1], p[2] - 0.014]), 0.007));
    for (const sx of [-1, 1]) { const lamp = []; for (let x = 0.62; x <= 0.9; x += 0.04) lamp.push(V(sx * x, 0.78, surfZ(x, 0.78, -1) - 0.006)); P.tail.push(tube(lamp, 0.02)); }
    const strip = []; for (let x = -0.6; x <= 0.601; x += 0.1) strip.push(V(x, 0.7, surfZ(x, 0.7, -1) - 0.003)); P.chrome.push(tube(strip, 0.006));
    const zr = surfZ(0, 0.3, -1); const dif = new THREE.BoxGeometry(1.4, 0.14, 0.12); dif.translate(0, 0.27, zr + 0.03); P.trim.push(dif);
    for (const sx of [-1, 1]) { const ex = new THREE.TorusGeometry(0.045, 0.012, 8, 20); ex.translate(sx * 0.5, 0.26, zr - 0.035); P.chrome.push(ex);
      const ei = new THREE.CircleGeometry(0.04, 16).rotateY(Math.PI); ei.translate(sx * 0.5, 0.26, zr - 0.03); P.trim.push(ei); } }

  // UNDERBODY + arch liners (dark, so nothing reads through the wheel openings)
  { const u = new THREE.BoxGeometry(1.5, 0.2, 4.2); u.translate(0, 0.25, 0); P.trim.push(u);
    for (const a of [AXLE, -AXLE]) for (const sx of [-1, 1]) { const lin = new THREE.CylinderGeometry(AR - 0.01, AR - 0.01, 0.3, 24, 1, true, Math.PI / 2, Math.PI).rotateZ(Math.PI / 2); lin.translate(sx * 0.78, R, a); P.trim.push(lin); } }

  // WHEELS: low-profile tyre, 20" twin-spoke alloy (polished face, dark pockets), drilled disc, calliper
  for (const a of [AXLE, -AXLE]) for (const sx of [-1, 1]) {
    const T = g => { g.translate(sx * WX, R, a); return g; };
    const prof = [[0.252, 0.11], [0.3, 0.118], [0.338, 0.112], [0.352, 0.09], [R, 0.05], [R, -0.05], [0.352, -0.09], [0.338, -0.112], [0.3, -0.118], [0.252, -0.11]].map(([r, y]) => new THREE.Vector2(r, y));
    P.tyre.push(T(new THREE.LatheGeometry(prof, 48).rotateZ(Math.PI / 2)));
    const face = sx * 0.09;
    P.rimDark.push(T(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 40, 1, true).rotateZ(Math.PI / 2)));                     // barrel
    P.rimDark.push(T(new THREE.CircleGeometry(0.245, 40).rotateY(sx * Math.PI / 2).translate(face - sx * 0.06, 0, 0)));  // dark back
    P.rim.push(T(new THREE.TorusGeometry(0.248, 0.012, 8, 48).rotateY(Math.PI / 2).translate(face, 0, 0)));             // polished lip
    for (let k = 0; k < 5; k++) for (const off of [-0.11, 0.11]) {                                                       // 5 × twin spokes
      const sp = new THREE.BoxGeometry(0.026, 0.19, 0.03); sp.translate(0, 0.145, 0); sp.rotateX(k * Math.PI * 2 / 5 + off); sp.translate(face - sx * 0.01, 0, 0); P.rim.push(T(sp)); }
    P.rim.push(T(new THREE.CylinderGeometry(0.062, 0.07, 0.04, 24).rotateZ(Math.PI / 2).translate(face, 0, 0)));        // hub
    P.chrome.push(T(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 20).rotateZ(Math.PI / 2).translate(face + sx * 0.02, 0, 0)));   // centre cap
    P.disc.push(T(new THREE.CylinderGeometry(0.19, 0.19, 0.028, 36).rotateZ(Math.PI / 2).translate(face - sx * 0.07, 0, 0)));     // disc
    const cal = new THREE.BoxGeometry(0.05, 0.14, 0.09); cal.translate(0, 0.17, 0); cal.rotateX(a > 0 ? -0.7 : 0.7); cal.translate(face - sx * 0.045, 0, 0); P.body.push(T(cal));   // calliper in body colour
  }

  parts = {};
  const norm = g => { const n = g.index ? g.toNonIndexed() : g;            // same attribute set everywhere so they merge
    for (const at of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(at)) n.deleteAttribute(at);
    if (!n.attributes.normal) n.computeVertexNormals();
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    return n; };
  for (const k in P) parts[k] = mergeGeometries(P[k].map(norm));
}

// ---------------- materials ----------------
export const CAR_PAINTS = {
  obsidian: ['#0a0b0d', 0.55, 0.32], pearl: ['#ecebe6', 0.15, 0.28], silver: ['#aeb2b7', 0.9, 0.3], graphite: ['#3a3d42', 0.85, 0.32],
  midnight: ['#13264a', 0.75, 0.3], racing: ['#11331f', 0.7, 0.3], burgundy: ['#4c0f1b', 0.7, 0.3], champagne: ['#bba582', 0.85, 0.3],
};
let M = null;
function mats() {
  if (M) return M;
  M = {
    glass: phys({ color: '#141b22', roughness: 0.02, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.01, reflectivity: 0.9 }),
    trim: phys({ color: '#0d0e10', roughness: 0.25, metalness: 0.2, clearcoat: 0.8 }),                    // gloss black
    chrome: std({ color: '#e4e7ea', metalness: 1, roughness: 0.08 }),
    tyre: std({ color: '#141516', roughness: 0.9, side: THREE.DoubleSide }),
    rim: std({ color: '#cfd3d8', metalness: 1, roughness: 0.18 }),
    rimDark: std({ color: '#26282b', metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }),
    disc: std({ color: '#7d8186', metalness: 0.9, roughness: 0.45 }),
    head: std({ color: '#ffffff', emissive: '#eaf2ff', emissiveIntensity: 1.6 }),
    drl: std({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 2.4 }),
    tail: std({ color: '#3a0000', emissive: '#ff1a1a', emissiveIntensity: 1.4 }),
    lens: phys({ color: '#14070a', roughness: 0.05, metalness: 0.2, clearcoat: 1 }),
  };
  M.paint = {};
  for (const [k, [c, m, r]] of Object.entries(CAR_PAINTS)) M.paint[k] = phys({ color: c, metalness: m, roughness: r, clearcoat: 1, clearcoatRoughness: 0.03 });
  return M;
}

// one premium car; paint = a CAR_PAINTS key. Front faces local +z.
export function premiumCarB(paint = 'obsidian') {
  if (!parts) build();
  const m = mats(), g = new THREE.Group();
  for (const k in parts) {
    const mesh = new THREE.Mesh(parts[k], k === 'body' ? (m.paint[paint] ?? m.paint.obsidian) : m[k]);
    mesh.castShadow = k === 'body' || k === 'glass' || k === 'tyre'; mesh.receiveShadow = true; g.add(mesh);
  }
  return g;
}
export const CAR_HALF = { len: 2.47, wid: 0.98 };
