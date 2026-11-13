// THE BUILDING FOR THE M (aerial) VIEW – Platinum Tatuapé, modelled from the sales-stand scale model
// (video of the maquete) and the 2º pavimento site plan. Stand-alone: it does not depend on any
// apartment or level; the runtime only places it and shows it in the M view.
//
// Local frame (metres): x = 0 at the tower's east face, +x = west; z = 0 at the tower's Rua Platina
// face, −z = towards the back (south); y = 0 at street level.
//
// What the maquete shows:
//  · narrow ends (Rua Platina front + back): white end pillars with a column of small square windows,
//    between them a stack of balconies – thick taupe slab bands, grey bar railings, a white parapet
//    box on every floor, glazing set back behind;
//  · long faces: white end pillars (small windows + black AC grilles), a balcony column next to each,
//    and in the middle a white grid of slab bands and piers with recessed windows / french balconies;
//  · base: white portal over the glass lobby on Rua Platina with a wood-slat block beside it, a white
//    two-storey podium with a brown slat band and glass balustrades, and the leisure deck on top
//    (25 m pool, deck molhado, pool spa, solarium with white umbrellas, palms).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTex, std } from './core.js';

// textures + materials: made once per page and shared by every build (M view + the clipped tower of the other views)
let MATS = null;
function makeMats() {
  const BAYS = 8, ROWS = 16;
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const winTex = canvasTex(1024, 1024, (g, w, h) => {
    const cw = w / BAYS, ch = h / ROWS;
    g.fillStyle = '#d9d5cd'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < BAYS; c++) {
      const x = c * cw, y = r * ch, lit = rnd() < 0.3, half = rnd() < 0.35;
      const gr = g.createLinearGradient(0, y, 0, y + ch);
      if (lit) { gr.addColorStop(0, '#f1d9a0'); gr.addColorStop(1, '#c9a160'); } else { gr.addColorStop(0, '#5d6a74'); gr.addColorStop(1, '#353d44'); }
      g.fillStyle = gr; g.fillRect(x + cw * 0.04, y + ch * 0.06, cw * 0.92, ch * 0.9);
      if (half) { g.fillStyle = lit ? '#3d454c' : '#c9b48c'; g.fillRect(x + cw * (rnd() < 0.5 ? 0.04 : 0.5), y + ch * 0.06, cw * 0.46, ch * 0.9); }
      g.fillStyle = '#2b3136'; for (const k of [0.04, 0.35, 0.65, 0.96]) g.fillRect(x + cw * k - 2, y + ch * 0.06, 4, ch * 0.9);
      g.fillRect(x + cw * 0.04, y + ch * 0.06, cw * 0.92, 3);
      if (rnd() < 0.25) { g.fillStyle = 'rgba(240,236,226,0.85)'; g.fillRect(x + cw * 0.06, y + ch * 0.08, cw * 0.25, ch * 0.85); }   // curtain
    }
  });
  const railTex = canvasTex(128, 64, (g, w, h) => {             // grey bar railing (1 m × 1.05 m), transparent between bars
    g.clearRect(0, 0, w, h); g.fillStyle = '#7d8389';
    g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 4);
    for (let x = 4; x < w; x += 11) g.fillRect(x, 0, 3, h);
  });
  const leisureTex = canvasTex(512, 128, (g, w, h) => {         // 2º pavimento glazing: tall dark glass, black mullions, warm interior
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8d9aa2'); gr.addColorStop(1, '#4a565e');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 40) { g.fillStyle = rnd() < 0.4 ? 'rgba(235,205,150,0.55)' : 'rgba(0,0,0,0)'; g.fillRect(x + 3, h * 0.2, 34, h * 0.75); }
    g.fillStyle = '#1f2326'; for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 4, h); g.fillRect(0, 0, w, 6);
  });
  const lobbyTex = canvasTex(512, 256, (g, w, h) => {           // double-height glass lobby
    g.fillStyle = '#56626a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(230,200,150,0.5)'; g.fillRect(w * 0.15, h * 0.45, w * 0.5, h * 0.55);
    g.fillStyle = '#1e2225'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 5, h); g.fillRect(0, h * 0.5, w, 4);
  });
  const slatTex = canvasTex(256, 256, (g, w, h) => {            // vertical wood slats
    g.fillStyle = '#4a3526'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? '#9c7350' : '#8d6646'; g.fillRect(x + 3, 0, 10, h); }
  });
  const bandTex = canvasTex(512, 128, (g, w, h) => {            // brown brick/slat band on the podium wall (maquete)
    g.fillStyle = '#5b4436'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) for (let x = (y / 10) % 2 * 12; x < w; x += 24) { g.fillStyle = (x + y) % 3 ? '#7a5c48' : '#6c503e'; g.fillRect(x + 1, y + 1, 22, 8); }
  });
  const pavTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#d8d1c4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,110,95,0.4)'; g.lineWidth = 2;
    for (const i of [0, 128]) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  const deckTex = canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 16; i++) { const t = 0.85 + rnd() * 0.3; g.fillStyle = `rgb(${150 * t | 0},${104 * t | 0},${68 * t | 0})`; g.fillRect(0, i * 16, w, 15); }
  });
  const waterTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5fb4c6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${0.05 + rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 20, 2); }
  });
  const T = (t, rx = 1, ry = 1) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; };
  const M = {
    white: std({ color: '#f2f0ec', roughness: 0.85 }),
    cream: std({ color: '#e2ded6', roughness: 0.9 }),
    taupe: std({ color: '#8d7968', roughness: 0.75 }),
    win: std({ map: winTex, roughness: 0.35, metalness: 0.1, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.12 }),
    rail: std({ map: railTex, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }),
    leisure: std({ map: leisureTex, roughness: 0.25, metalness: 0.2 }),
    lobby: std({ map: lobbyTex, roughness: 0.25, metalness: 0.2 }),
    slat: std({ map: slatTex, roughness: 0.7 }),
    band: std({ map: bandTex, roughness: 0.8 }),
    dark: std({ color: '#4a5866', roughness: 0.2, metalness: 0.3 }),
    ac: std({ color: '#1b1c1e', roughness: 0.6 }),
    frame: std({ color: '#3a3d40', roughness: 0.5, metalness: 0.4 }),
    glass: std({ color: '#cfe3e8', roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
    paving: std({ map: pavTex, roughness: 0.85 }),
    deck: std({ map: deckTex, roughness: 0.75 }),
    water: std({ map: waterTex, roughness: 0.05, metalness: 0.1 }),
    lawn: std({ color: '#5f8a42', roughness: 1 }),
    court: std({ color: '#d4ad7c', roughness: 0.85 }),
    trunk: std({ color: '#8c7a62', roughness: 1 }),
    frond: std({ color: '#7fae7a', roughness: 0.7, side: THREE.DoubleSide }),        // the maquete's pale palm green
    shrub: std({ color: '#4c7a3a', roughness: 0.9 }),
    shrub2: std({ color: '#6a9150', roughness: 0.9 }),
    pink: std({ color: '#d9a3b6', roughness: 0.9 }),
    lilac: std({ color: '#9d8fc2', roughness: 0.9 }),
    canvas: std({ color: '#f6f3ec', roughness: 0.8, side: THREE.DoubleSide }),
    lounger: std({ color: '#c9a882', roughness: 0.8 }),
    navy: std({ color: '#24407a', roughness: 0.8 }),
    wood: std({ color: '#a8784f', roughness: 0.6 }),
  };
  return M;

}

// towerOnly: just the tower (other views draw their own podium); clip: list of disjoint boxes {x0,x1,y0,y1,z0,z1} in
// tower-local metres (x from the east face, z = 0 at the tower front, y as in the model) – only what lies inside them is kept
export function buildBuildingModel({ TW = 21, TL = 56, TFS = 0, TXS = 0, REC_D = 0, FH = 3, FLOORS = 27, STREET = 0.15, towerOnly = false, clip = null } = {}) {   // TFS: tower front set back from the podium front (z = 0)
  const root = new THREE.Group(); root.name = 'buildingModel';
  const lv = n => STREET + n * FH, ROOF = lv(FLOORS + 1), L2 = lv(2), L3 = lv(3);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  // ---------------------------------------------------------------------------
  // TEXTURES + MATERIALS
  // ---------------------------------------------------------------------------
  const BAYS = 8, ROWS = 16;
  const M = MATS ?? (MATS = makeMats());

  // ---------------------------------------------------------------------------
  // GEOMETRY COLLECTOR – everything is merged per material at the end (a few dozen draw calls)
  // ---------------------------------------------------------------------------
  const buckets = new Map();
  let zShift = 0, xShift = 0, inTower = false;                                               // tower geometry is built at z ∈ [−TL, 0] and shifted back by TFS
  let mirX = null;                                                                           // set → geometry is mirrored x → mirX − x
  const put = (mat, g) => {
    if (zShift || xShift) g.translate(xShift, 0, zShift);
    if (mirX !== null) {                                    // mirror + flip the triangle winding so faces still point outwards
      g.applyMatrix4(new THREE.Matrix4().set(-1, 0, 0, mirX, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
      const a = g.index?.array; if (a) for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
    }
    if (!buckets.has(mat)) buckets.set(mat, []); buckets.get(mat).push(g);
  };
  // set-back of the east long face (2º pavimento plan: the middle of the tower stands on the espaço jogos pillars,
  // 2.78 m in from the end blocks). Tower-local z, front = 0. Active only while the tower is built.
  let RCUT = null;
  const zCuts = (a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b), pts = [lo, ...[RCUT.z0, RCUT.z1].filter(t => t > lo + 1e-6 && t < hi - 1e-6), hi], out = [];
    for (let i = 0; i < pts.length - 1; i++) { const m = (pts[i] + pts[i + 1]) / 2; out.push([pts[i], pts[i + 1], m > RCUT.z0 && m < RCUT.z1]); } return out; };
  const box0 = (mat, x0, x1, y0, y1, z0, z1) => {
    let xl = Math.min(x0, x1), xh = Math.max(x0, x1), yl = Math.min(y0, y1), yh = Math.max(y0, y1), zl = Math.min(z0, z1), zh = Math.max(z0, z1);
    if (clip && inTower) {                                // tower pieces: keep only the parts inside the clip boxes
      for (const r of clip) { const a = Math.max(xl, r.x0), b = Math.min(xh, r.x1), c = Math.max(yl, r.y0), d = Math.min(yh, r.y1), e = Math.max(zl, r.z0), f = Math.min(zh, r.z1);
        if (b - a > 1e-4 && d - c > 1e-4 && f - e > 1e-4) { const g = new THREE.BoxGeometry(b - a, d - c, f - e); g.translate((a + b) / 2, (c + d) / 2, (e + f) / 2); put(mat, g); } }
      return;
    }
    if (globalThis.__BOXLOG && !clip) globalThis.__BOXLOG.push([xl + xShift, xh + xShift, yl, yh, zl + zShift, zh + zShift, mat.uuid.slice(0, 4), inTower]);   // debug: z-fight finder
    const g = new THREE.BoxGeometry(xh - xl, yh - yl, zh - zl);
    g.translate((xl + xh) / 2, (yl + yh) / 2, (zl + zh) / 2); put(mat, g);
  };
  const box = (mat, x0, x1, y0, y1, z0, z1) => {
    const xl = Math.min(x0, x1), xh = Math.max(x0, x1);
    if (!RCUT || xl > RCUT.d + 0.5) return box0(mat, x0, x1, y0, y1, z0, z1);
    for (const [a, b, inR] of zCuts(z0, z1)) {
      if (!inR) { box0(mat, xl, xh, y0, y1, a, b); continue; }
      if (xh > RCUT.d + 2) box0(mat, Math.max(xl, 0) + RCUT.d, xh, y0, y1, a, b);         // wide piece (slab, core): its east edge moves in
      else box0(mat, xl + RCUT.d, xh + RCUT.d, y0, y1, a, b);                              // face piece: moves in whole
    }
  };
  // vertical quad; face = outward direction 'n' (+z), 's' (−z), 'e' (−x), 'w' (+x); a = along-face start/end
  const ROT = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };
  function quad(mat, face, a0, a1, plane, y0, y1, us = 1, vs = 1, uo = 0, vo = 0) {
    if (RCUT && face === 'e' && plane < RCUT.d + 0.5) {
      const lo = Math.min(a0, a1); for (const [a, b, inR] of zCuts(a0, a1)) quad0(mat, face, a, b, plane + (inR ? RCUT.d : 0), y0, y1, us, vs, uo + (a - lo) / us, vo);
      return;
    }
    quad0(mat, face, a0, a1, plane, y0, y1, us, vs, uo, vo);
  }
  function quad0(mat, face, a0, a1, plane, y0, y1, us = 1, vs = 1, uo = 0, vo = 0) {
    if (clip && inTower && !quad0.inner) {
      const ns = face === 'n' || face === 's', lo = Math.min(a0, a1), hi = Math.max(a0, a1), fwd = face === 'n' || face === 'e';   // u runs along +x (n), −x (s), +z (e), −z (w)
      quad0.inner = true;
      for (const r of clip) {
        const pl0 = ns ? r.z0 : r.x0, pl1 = ns ? r.z1 : r.x1; if (plane < pl0 || plane > pl1) continue;
        const c0 = Math.max(lo, ns ? r.x0 : r.z0), c1 = Math.min(hi, ns ? r.x1 : r.z1), d0 = Math.max(y0, r.y0), d1 = Math.min(y1, r.y1);
        if (c1 - c0 < 1e-4 || d1 - d0 < 1e-4) continue;
        quad0(mat, face, c0, c1, plane, d0, d1, us, vs, uo + (fwd ? c0 - lo : hi - c1) / us, vo + (d0 - y0) / vs);
      }
      quad0.inner = false; return;
    }
    const w = Math.abs(a1 - a0), h = y1 - y0, g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uo + uv.getX(i) * w / us, vo + uv.getY(i) * h / vs);
    g.rotateY(ROT[face]);
    const c = (a0 + a1) / 2;
    if (face === 'n' || face === 's') g.translate(c, (y0 + y1) / 2, plane); else g.translate(plane, (y0 + y1) / 2, c);
    put(mat, g);
  }
  const flat = (mat, x0, x1, z0, z1, y, rep = 1) => {           // horizontal quad facing up, texture repeat every rep metres
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0), g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / rep, uv.getY(i) * d / rep);
    g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); put(mat, g);
  };
  const cyl = (mat, r0, r1, h, x, y, z, seg = 8, rx = 0, rz = 0) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.rotateX(rx); g.rotateZ(rz); g.translate(x, y, z); put(mat, g); };
  const ball = (mat, r, x, y, z, sy = 1) => { const g = new THREE.SphereGeometry(r, 10, 7); g.scale(1, sy, 1); g.translate(x, y, z); put(mat, g); };

  // ---------------------------------------------------------------------------
  // TOWER BODY (floors 3 … 27) – after the reference sheet (front-left / rear-right perspectives, left-side
  // elevation) and the street photos:
  //  · Rua Platina face: a thick white L/rectangular FRAME around the balcony stack (wraps round the east corner),
  //    one cantilevered balcony per floor with a warm brown soffit band, a white parapet box in the middle and
  //    bar railings either side, glazing set back; beside it a white pier with small square windows;
  //  · long faces: front corner zone with a column of larger "corner" windows, a deep full-height notch, a grid
  //    of recessed balcony bays (white slab bands + piers, railings), a second notch, the back end pier with
  //    small windows;
  //  · back face: white "utility" walls with a grid of small windows, a central band of recessed balconies;
  //  · roof: flat, low parapet, one central machine-room penthouse.
  // ---------------------------------------------------------------------------
  inTower = true; zShift = -TFS; xShift = TXS; RCUT = REC_D > 0 ? { z0: -TL + 6, z1: TFS - (1468 - 1118) / 20.9, d: REC_D } : null;   // tower sits TFS behind the podium front and TXS across
  const zB = -TL, LO = Math.min, HI = Math.max;
  const SW = Math.round(TW * 0.8 * 10) / 10, SREC = 1.8;                  // stack + frame width (from the east corner), stack recess
  const FRL = Math.round(TW * 0.12 * 10) / 10, FRR = 0.3, FZ = 0.5;   // left pier (with the large-window column), inner leg                                    // frame legs (east thick / inner), frame projection in front of the tower face
  const IX0 = FRL, IX1 = SW - FRR, PSET = 1.2;                                         // inside the frame
  const BOT = L3 - 0.3, TOP = ROOF;                                        // tower body from the 3rd floor slab to the roof
  const smallWin = (face, a, plane, y, w = 0.85, h = 0.85) => {           // small square window: dark glass in a light frame + sill
    const o = face === 'n' || face === 'w' ? 1 : -1, ns = face === 'n' || face === 's';
    const B = (m, a0, a1, y0, y1, d) => ns ? box(m, a0, a1, y0, y1, LO(plane, plane + o * d), HI(plane, plane + o * d)) : box(m, LO(plane, plane + o * d), HI(plane, plane + o * d), y0, y1, a0, a1);
    B(M.frame, a - w / 2 - 0.05, a + w / 2 + 0.05, y + 0.95, y + 1.05 + h, 0.02); B(M.dark, a - w / 2, a + w / 2, y + 1.0, y + 1.0 + h, 0.03);
    B(M.white, a - w / 2 - 0.08, a + w / 2 + 0.08, y + 0.92, y + 0.97, 0.08);
  };
  // core: closes every recess
  const g0 = REC_D > 0 ? TFS - (1468 - 1118) / 20.9 : -7.1, g1 = zB + 6, MIDW = REC_D > 0 ? REC_D : 2.8;   // H plan: middle (g1…g0) set back MIDW on both long sides
  box(M.cream, 1.6, TW - 1.6, BOT, TOP - 0.01, g0, -1.9); box(M.cream, 1.6, TW - 1.6, BOT, TOP - 0.01, zB + 1.9, g1);
  box(M.cream, 1.6, TW - MIDW - 1.6, BOT, TOP - 0.01, g1, g0);

  // ---- the two narrow ends: the SAME façade on both (rotated 180°). The acesso social / praça entrance is under the
  // z = −TL end, Rua Platina under z = 0. Seen from outside, left → right (maquette photo): large-window column on a
  // narrow pier | projecting balcony stack between two slim white legs (brown slab bands, white parapet box, bar
  // railings) | small square windows + large-window column on the wider pier. The piers stand PSET behind the balconies.
  for (const rot of [false, true]) {
    const fx = x => rot ? TW - x : x, fz = z => rot ? zB - z : z, F = rot ? 's' : 'n';
    const B = (m, x0, x1, y0, y1, z0, z1) => box(m, LO(fx(x0), fx(x1)), HI(fx(x0), fx(x1)), y0, y1, LO(fz(z0), fz(z1)), HI(fz(z0), fz(z1)));
    const Q = (m, a0, a1, plane, y0, y1, us, vs, uo = 0, vo = 0) => quad(m, F, LO(fx(a0), fx(a1)), HI(fx(a0), fx(a1)), fz(plane), y0, y1, us, vs, uo, vo);
    const Wn = (a, plane, y, w, h) => smallWin(F, fx(a), fz(plane), y, w, h);
    B(M.white, 0, FRL, BOT - 0.6, TOP, -PSET - 0.6, -PSET);                                        // narrow pier
    B(M.white, SW, TW, BOT - 0.6, TOP, -PSET - 0.6, -PSET);                                        // wide pier
    B(M.white, FRL - 0.3, FRL, BOT - 0.6, TOP + 1.0, -SREC, FZ); B(M.white, IX1, SW, BOT - 0.6, TOP + 1.0, -SREC, FZ);   // slim legs
    B(M.white, FRL - 0.3, SW, TOP - 0.7, TOP + 1.0, -SREC, FZ); B(M.white, FRL - 0.3, SW, BOT - 0.6, BOT, -SREC, FZ);   // crown + sill beams
    Q(M.win, IX0, IX1, -SREC, BOT, TOP - 0.7, 3.5 * BAYS, FH * ROWS, 0, rot ? 0.3 : 0);           // glazing behind the balconies
    const midX = (IX0 + IX1) / 2;
    B(M.white, midX - 0.14, midX + 0.14, BOT, TOP - 0.7, -SREC, -0.3);                             // unit divider
    const lw = Math.min(1.4, FRL - 0.7), rw = Math.min(1.4, (TW - SW) * 0.4);
    for (let n = 3; n <= FLOORS; n++) {
      const y = lv(n);
      B(M.wood, IX0, IX1, y - 0.32, y + 0.04, -SREC, FZ - 0.15);                                   // balcony slab: brown band
      B(M.white, midX - 1.9, midX + 1.9, y + 0.04, y + 1.1, FZ - 0.4, FZ - 0.15);                  // white parapet box (middle)
      Q(M.rail, IX0 + 0.05, midX - 1.9, FZ - 0.2, y + 0.04, y + 1.1, 1, 1.06);
      Q(M.rail, midX + 1.9, IX1 - 0.05, FZ - 0.2, y + 0.04, y + 1.1, 1, 1.06);
      Wn((FRL - 0.3) / 2, -PSET, y - 0.3, lw, 1.6);
      Wn(SW + 0.75, -PSET, y + 0.2, 0.55, 0.55); Wn(SW + (TW - SW) * 0.66, -PSET, y - 0.3, rw, 1.6);
    }
    B(M.white, SW, TW, TOP, TOP + 1.0, -PSET - 0.3, -PSET); B(M.white, 0, FRL - 0.3, TOP, TOP + 1.0, -PSET - 0.3, -PSET);   // parapets
  }

  // ---- long faces (east x = 0, west x = TW): H plan. End wings on the façade line with ONE column of small windows
  // each; between them the middle is set back MIDW on BOTH sides and holds the balcony grid: 4 bays, a white pier,
  // 1 bay (reference isometric). East: RCUT moves the pieces in; west: explicit offset.
  const GREC = 1.2, PIERW = 1.2, NB = 5, bw = (g0 - g1 - PIERW) / NB;
  const bays = []; for (let i = 0; i < NB; i++) { const zt = g0 - i * bw - (i >= 4 ? PIERW : 0); bays.push([zt - bw, zt]); }
  for (const [xf, sg, face] of [[0, 1, 'e'], [TW, -1, 'w']]) {
    const off = face === 'w' || !RCUT ? MIDW : 0;
    const xin = d => xf + sg * d, wallBox = (z0, z1, d0, d1, y0 = BOT - 0.6, y1 = TOP) => box(M.white, LO(xin(d0), xin(d1)), HI(xin(d0), xin(d1)), y0, y1, LO(z0, z1), HI(z0, z1));
    wallBox(-PSET, g0, 0, 0.6); wallBox(g1, zB + PSET, 0, 0.6);                        // the two wings
    for (let n = 3; n <= FLOORS; n++) { smallWin(face, (g0 - PSET) / 2, xf, lv(n)); smallWin(face, (g1 + zB + PSET) / 2, xf, lv(n)); }
    if (off) for (const z of [g0, g1]) box(M.white, LO(xf, xin(off + 0.3)), HI(xf, xin(off + 0.3)), BOT - 0.6, TOP, z - 0.15, z + 0.15);   // return walls of the wings
    // balcony grid in the set-back middle
    quad(M.win, face, g1, g0, xin(off + GREC), BOT, TOP, 3.5 * BAYS, FH * ROWS, 0.3, 0.2);
    wallBox(g0, g0 - 0.18, off - 0.05, off + GREC); wallBox(g1 + 0.18, g1, off - 0.05, off + GREC);
    wallBox(bays[3][0], bays[4][1], off - 0.05, off + GREC);                                          // white pier between bay 4 and 5
    for (let i = 1; i < 4; i++) wallBox(bays[i][1] - 0.18, bays[i][1] + 0.18, off - 0.05, off + GREC);
    for (let n = 3; n <= FLOORS + 1; n++) {
      const y = lv(n);
      for (const [z0, z1] of bays) wallBox(z0, z1, off - 0.12, off + GREC, y - 0.26, y + 0.04);     // slab bands
      if (n > FLOORS) break;
      for (const [z0, z1] of bays) {                                                                  // each balcony: white parapet half + bar railing half
        const zm = (z0 + z1) / 2;
        wallBox(z0 + 0.18, zm, off - 0.06, off + 0.12, y + 0.04, y + 1.05);
        quad(M.rail, face, zm, z1 - 0.18, xin(off - 0.06), y + 0.04, y + 1.05, 1, 1.02);
      }
    }
  }

  // ---- 2º pavimento (leisure) under the tower: recessed glazing, slab over it, pilotis ----
  for (const [face, a0, a1, plane] of [['n', 0.9, TW - 0.9, -0.9], ['s', 0.9, TW - 0.9, zB + 0.9], ['e', zB + 0.9, -0.9, 0.9], ['w', zB + 0.9, -0.9, TW - 0.9]])
    quad(M.leisure, face, a0, a1, plane, L2, L3 - 0.35, 4, L3 - 0.35 - L2);
  box(M.white, -0.15, TW + 0.15, L3 - 0.45, L3 - 0.05, zB - 0.15, 0.15);
  for (const [x, z] of [[0.4, -0.4], [TW - 0.4, -0.4], [0.4, zB + 0.4], [TW - 0.4, zB + 0.4], [0.4, -28], [TW - 0.4, -28]]) box(M.white, x - 0.35, x + 0.35, L2, L3 - 0.4, z - 0.35, z + 0.35);

  // ---- roof: flat slab, low parapet, one central machine-room penthouse with a door ----
  box(M.white, 0, TW, TOP - 0.3, TOP, g0, -PSET); box(M.white, 0, TW, TOP - 0.3, TOP, zB + PSET, g1); box(M.white, 0, TW - MIDW, TOP - 0.3, TOP, g1, g0);
  for (const [x0, x1, z0, z1] of [[0, 0.3, zB + PSET, -PSET], [TW - 0.3, TW, g0, -PSET], [TW - 0.3, TW, zB + PSET, g1], [TW - MIDW - 0.3, TW - MIDW, g1, g0]]) box(M.white, x0, x1, TOP, TOP + 1.0, z0, z1);
  const PH = [TW * 0.3, TW * 0.7, -TL * 0.62, -TL * 0.4];
  box(M.white, PH[0], PH[1], TOP, TOP + 3.2, PH[2], PH[3]);
  box(M.white, PH[0] - 0.15, PH[1] + 0.15, TOP + 3.2, TOP + 3.4, PH[2] - 0.15, PH[3] + 0.15);
  box(M.dark, (PH[0] + PH[1]) / 2 - 0.5, (PH[0] + PH[1]) / 2 + 0.5, TOP, TOP + 2.1, PH[3], PH[3] + 0.04);

  for (const z of RCUT ? [RCUT.z0, RCUT.z1] : []) box0(M.white, 0, RCUT.d + 0.3, L2 + 0.3, ROOF, z - 0.15, z + 0.15);   // return walls of the set-back
  zShift = 0; xShift = 0; RCUT = null; inTower = false;
  if (!towerOnly) {                                                         // podium, lot and gardens (M view only)
  // ---------------------------------------------------------------------------
  // PODIUM + LOT (traced from the 2º pavimento plan: x = (780 − iy)/20.9, z = (ix − 1468)/20.9)
  // ---------------------------------------------------------------------------
  const px = iy => (780 - iy) / 20.9, pz = ix => (ix - 1468) / 20.9;                  // ix 1468 = podium front (z = 0)
  const NB = [px(316), 0, pz(316), pz(1478)];                    // north block (under the tower) x1, x0, z0, z1
  const SPA = [px(985), 0, pz(392), pz(900)];                     // spa wing
  const POOL = [px(1195), 0, pz(900), pz(1478)];                  // pool wing
  // Brochure implantações (térreo + 2º pavimento): the tower's long axis runs from Praça Heitor Levi (z = NB[2], the
  // ENTRANCE end: acesso social, portaria, double-height lobby) to Rua Platina (z ≈ 0: the garage's blind end with the
  // churrasqueira / playground terrace on its roof). The vehicle access is beside the entrance on the praça, under the
  // slatted 2º-pavimento block (brinquedoteca / playground); the pool wing lies beyond it, towards Rua Platina.
  const T0 = TXS, T1 = TXS + TW, PZ = NB[2], PD = 2.0, LOTZ = PZ - 7.4;   // tower x span, praça face of the base, portal depth, praça lot line
  const ent = (700 - 490) / 18.33;                                        // the acesso social door (térreo plan iy 490)
  // ground: lawn over the lot
  flat(M.lawn, px(985) - 1, px(140), LOTZ, pz(1478) + 0.3, 0.03, 4);
  // block under the tower (térreo + 1º pavimento) – runs through to Rua Platina
  box(M.white, NB[1], NB[0], 0, L2, NB[2], NB[3]);
  quad(M.band, 'n', NB[1] + 1.2, NB[0] - 1.2, NB[3] + 0.06, 2.2, 4.0, 4, 1.8);                    // Rua Platina wall: brown band
  // ---- the entrance on Praça Heitor Levi: slim white portal under the tower's end (renders / maquete), glass lobby
  // with a wood panel above, glass railing on the portal roof
  quad(M.lobby, 's', T0 + 1.2, T1 - 1.2, PZ - 0.06, 0.03, L2 - 2.6, 4, L2 - 2.6);                 // glass lobby + hall
  quad(M.slat, 's', T0 + 0.6, T1 - 0.6, PZ - 0.07, L2 - 2.6, L2 - 1.1, 3, 1.5);                   // wood panel over it
  box(M.white, T0 - 0.3, T1 + 0.3, L2 - 1.1, L2, PZ - PD, PZ);                                     // portal beam
  for (const x of [T0 - 0.3, T1 - 0.6]) box(M.white, x, x + 0.9, 0, L2, PZ - PD, PZ);              // portal legs
  quad(M.glass, 's', T0 - 0.3, T1 + 0.3, PZ - PD, L2, L2 + 1.1);                                   // railing on the portal roof
  // spa + pool wings (garage below, leisure deck on top)
  box(M.white, SPA[0], SPA[1], 0, L2, SPA[2], SPA[3]);
  box(M.white, POOL[0], POOL[1], 0, L2, POOL[2], POOL[3]);
  quad(M.band, 'n', POOL[0] + 1.2, POOL[1] - 1.2, POOL[3] + 0.06, 2.2, 4.0, 4, 1.8);              // brown band on the Rua Platina wall
  quad(M.slat, 'e', POOL[3] - 9, POOL[3] - 1, POOL[0] - 0.06, 0, L2, 1.5, L2);                    // slatted corner on the east side
  quad(M.band, 'e', POOL[2] + 1, POOL[3] - 10, POOL[0] - 0.06, 2.2, 4.0, 4, 1.8);
  // the wood-slat box beside the entrance: praça face of the spa wing, with the garage gate (acesso veículos)
  quad(M.slat, 's', SPA[0], SPA[1], SPA[2] - 0.06, 0, L2, 1.5, L2);
  quad(M.slat, 'e', SPA[2], SPA[2] + 9, SPA[0] - 0.06, 0, L2, 1.5, L2);
  quad(M.band, 'e', SPA[2] + 10, SPA[3] - 1, SPA[0] - 0.06, 2.2, 4.0, 4, 1.8);
  box(M.dark, SPA[0] + 1.6, SPA[1] - 1.6, 0, 3.2, SPA[2] - 0.1, SPA[2]);                           // gate
  box(M.white, SPA[0] + 1.4, SPA[1] - 1.4, 3.2, 3.5, SPA[2] - 0.14, SPA[2]);
  // leisure deck on the wings
  const D = L2 + 0.05;                                         // deck surfaces stand clear of the podium roof (no far-distance z-fight)
  flat(M.paving, SPA[0], SPA[1], SPA[2], SPA[3], D, 1.8);
  flat(M.paving, POOL[0], POOL[1], POOL[2], POOL[3], D, 1.8);
  flat(M.paving, NB[1], NB[0], NB[2], NB[3], D - 0.02, 1.8);
  flat(M.deck, px(975), px(838), pz(1028), pz(1330), D + 0.04, 2);                             // solarium
  for (const [a, b, c, d] of [[928, 1058, 1448, 1165], [1035, 975, 1175, 1052], [1175, 975, 1325, 1052], [745, 890, 855, 952]]) {   // pools
    flat(M.water, px(d), px(b), pz(a), pz(c), D + 0.06, 3);
    for (const [x0, x1, z0, z1] of [[px(d), px(b), pz(a) - 0.2, pz(a)], [px(d), px(b), pz(c), pz(c) + 0.2], [px(d) - 0.2, px(d), pz(a), pz(c)], [px(b), px(b) + 0.2, pz(a), pz(c)]]) box(M.white, x0, x1, D, D + 0.12, z0, z1);
  }
  // glass balustrade + planters round the deck edge
  const edges = [['n', NB[1], NB[0], NB[3]], ['n', POOL[0], POOL[1], POOL[3]], ['e', POOL[2], POOL[3], POOL[0]], ['s', POOL[0], SPA[0], POOL[2]], ['e', SPA[2], SPA[3], SPA[0]], ['s', SPA[0], 0, SPA[2]]];
  for (const [f, a0, a1, p] of edges) {
    quad(M.glass, f, Math.min(a0, a1), Math.max(a0, a1), p, D, D + 1.1);
    const lo2 = Math.min(a0, a1), hi2 = Math.max(a0, a1), inw = f === 'n' ? -1 : f === 's' ? 1 : 1;
    if (f === 'n' || f === 's') { box(M.frame, lo2, hi2, D + 1.08, D + 1.14, p - 0.04, p + 0.04); box(M.shrub, lo2 + 0.3, hi2 - 0.3, D, D + 0.7, Math.min(p + inw * 0.15, p + inw * 1.15), Math.max(p + inw * 0.15, p + inw * 1.15)); }   // hedge kept off the glass plane
    else { box(M.frame, p - 0.04, p + 0.04, D + 1.08, D + 1.14, lo2, hi2); box(M.shrub, p + 0.15, p + 1.15, D, D + 0.7, lo2 + 0.3, hi2 - 0.3); }
  }
  box(M.shrub, px(838), px(812), D, D + 0.6, pz(740), pz(1450));                                 // planter at the top of the solarium
  // palms (pale green, like the maquete), umbrellas, loungers, daybeds
  function frondGeo(len, lift) {                               // tapered frond arching up and drooping, folded along the rib
    const g = new THREE.PlaneGeometry(0.85, len, 2, 8), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = (p.getY(i) + len / 2) / len, x = p.getX(i) * Math.sin(Math.PI * Math.min(1, v * 1.15)) * (1 - v * 0.35), a = v * len;
      p.setXYZ(i, x, a * (0.55 + lift) - a * a * 0.2 - Math.abs(x) * 0.35, a * 0.85);
    }
    g.computeVertexNormals(); return g;
  }
  function palm(x, z, y, h = 5.5) {
    cyl(M.trunk, 0.12, 0.18, h, x, y + h / 2, z, 6);
    for (let k = 0; k < 10; k++) {
      const g = frondGeo(2.3 + rnd() * 0.6, k % 3 === 0 ? 0.25 : 0.0); g.rotateY(k * Math.PI / 5 + rnd() * 0.3); g.translate(x, y + h, z); put(M.frond, g);
    }
  }
  for (const [ix, iy] of [[795, 826], [885, 826], [985, 826], [1085, 826], [1175, 826], [1270, 826], [1365, 826], [912, 1010], [912, 1095], [912, 1160],
    [1000, 1180], [1095, 1180], [1190, 1180], [1285, 1180], [1385, 1180], [1462, 880], [1462, 960], [1462, 1060], [1462, 1140], [450, 960], [560, 960], [650, 965], [412, 800], [412, 880], [770, 772], [880, 772], [960, 772]])
    palm(px(iy), pz(ix), D, 4.5 + rnd() * 2);
  for (const ix of [1065, 1125, 1185, 1245, 1305]) {
    const x = px(865), z = pz(ix); cyl(M.trunk, 0.03, 0.03, 2.4, x, D + 1.2, z, 6);
    const g = new THREE.ConeGeometry(1.35, 0.4, 10, 1, true); g.translate(x, D + 2.4, z); put(M.canvas, g);
  }
  for (let i = 0; i < 10; i++) { const z = pz(1062 + i * 27); box(M.lounger, px(958), px(915), D, D + 0.35, z - 0.33, z + 0.33); }
  for (const ix of [965, 990, 1015, 1342, 1364, 1386, 1408, 1430]) { const z = pz(ix); box(M.lounger, px(1042), px(998), D, D + 0.35, z - 0.33, z + 0.33); }
  for (const ix of [954, 988, 1374, 1408]) { const z = pz(ix); box(M.navy, px(890), px(846), D, D + 0.45, z - 0.7, z + 0.7); }
  // churrasqueira pergola on the Rua Platina terrace (2º pavimento, 07)
  for (const [x, z] of [[11.5, -7.6], [19.5, -7.6], [11.5, -2.4], [19.5, -2.4]]) box(M.white, x - 0.1, x + 0.1, D, D + 2.6, z - 0.1, z + 0.1);
  box(M.wood, 11.1, 19.9, D + 2.6, D + 2.75, -8, -2);
  // praça forecourt: entrance walk, driveway to the garage gate, palms + flowering shrubs in front of the portal (maquete)
  flat(M.paving, ent - 1.8, ent + 1.8, LOTZ - 1.5, PZ, 0.05, 1.8);
  flat(M.paving, SPA[0] + 0.8, SPA[1] - 0.8, LOTZ - 1.5, SPA[2], 0.05, 1.8);
  for (const x of [T0 + 1.6, T0 + 5.4, ent + 3.6, T1 - 1.6]) palm(x, PZ - PD - 1.5, 0.03, 4.5 + rnd());
  for (let i = 0; i < 22; i++) { const x = T0 + 0.8 + rnd() * (px(140) - T0 - 1.6), z = LOTZ + 0.9 + rnd() * 2.6; if (Math.abs(x - ent) > 2.6) ball(rnd() < 0.55 ? M.pink : rnd() < 0.5 ? M.lilac : M.shrub2, 0.6 + rnd() * 0.4, x, 0.5, z, 0.8); }
  box(M.shrub, T0 + 0.3, ent - 1.9, 0.03, 0.5, LOTZ, LOTZ + 0.5); box(M.shrub, ent + 1.9, px(140), 0.03, 0.5, LOTZ, LOTZ + 0.5);   // hedge on the lot line, open at the walk
  // Rua Platina side: hedge + flowering shrubs and street trees along the garage wall
  for (let x = -18; x < px(140); x += 1.6) { const m = rnd() < 0.55 ? M.pink : rnd() < 0.5 ? M.lilac : M.shrub2; ball(m, 0.7 + rnd() * 0.4, x, 0.6, 1.4 + rnd() * 1.2, 0.8); }
  box(M.shrub, -19.5, px(140), 0.03, 0.5, 0.6, 1.1);
  for (const x of [-15, -7, 1, 9, 17]) { cyl(M.trunk, 0.15, 0.22, 3.2, x, 1.6, 2.6, 6); ball(M.shrub, 2.0, x, 4.2, 2.6, 0.85); }
  // térreo garden west of the building: quadra, churrasqueira, spa deck, trees
  flat(M.court, px(310), px(160), pz(1185), pz(1460), 0.05, 4);
  for (const [x0, x1, z0, z1] of [[px(310), px(160), pz(1185) - 0.1, pz(1185)], [px(310), px(160), pz(1460), pz(1460) + 0.1], [px(160), px(160) + 0.1, pz(1185), pz(1460)]]) box(M.frame, x0, x1, 0, 3.5, z0, z1);
  box(M.white, px(316), px(150), 0, 3.2, pz(1080), pz(1180));
  flat(M.deck, px(330), px(240), pz(675), pz(860), 0.06, 2); flat(M.water, px(318), px(262), pz(705), pz(790), 0.08, 3);
  for (const [ix, iy, s] of [[330, 190, 1.0], [470, 185, 1.2], [600, 190, 1.0], [890, 180, 1.2], [960, 210, 1.0], [250, 250, 1.1], [250, 420, 1.0], [520, 260, 0.9]]) {
    const x = px(iy), z = pz(ix); cyl(M.trunk, 0.15 * s, 0.22 * s, 3.2 * s, x, 1.6 * s, z, 6);
    ball(M.shrub, 2.0 * s, x, 4.2 * s, z, 0.85); ball(M.shrub2, 1.3 * s, x + 0.9 * s, 3.6 * s, z + 0.6 * s);
  }
  }
  // ---------------------------------------------------------------------------
  // MERGE
  // ---------------------------------------------------------------------------
  for (const [mat, geos] of buckets) {
    const g = mergeGeometries(geos, false); if (!g) continue;
    const m = new THREE.Mesh(g, mat); m.castShadow = !mat.transparent && mat !== M.lawn; m.receiveShadow = true; root.add(m);
  }
  return root;
}
