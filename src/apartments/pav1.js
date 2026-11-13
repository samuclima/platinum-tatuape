// 1º PAVIMENTO – first floor of Platinum Tatuapé, traced from the brochure's "Implantação | 1º Pavimento"
// (DOC-20260928-WA0007.pdf p. 9; same lot and framing as the térreo plan, ≈ 19.4 image px = 1 m).
// 01 elevadores · 02 espaço beauty · 03 salas de massagem · 04 bicicletário · 05 estacionamento,
// plus the void over the double-height lobby. The térreo below is shown in simple form (walls, the lobby
// under the void, gardens, spa pool, quadra) so the floor sits in its real context.
// Coordinates are IMAGE pixels – see siteKit.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeKit, ROT_IMG } from './siteKit.js';
import { CAR_HALF, premiumCarB } from './carKit.js';
import { makeCorridor } from './corridorKit.js';
import {
  H, M, P, baseCabB, ceilingGroup, colliders, concreteTex, cylinder, floorWoodTex, mesh, plantB, porcelainTex, rb,
  roundChairB, rug, sofaB, std, toiletB, vanity2B, vanityB, world, canvasTex, fabric, lathe, marble, veneer,
} from '../engine/core.js';
import { boucleTubChairB, ledShelfB, loungeChairB, monsteraPotB, pedicureB, salonChairB, shampooB, tropicalB } from './pav2Kit.js';

export const K = 5;
const { bx, fl, wl, it, atI, W, ceil } = makeKit(K);
const T0 = -3.0;                                                  // térreo floor level, relative to this floor

export function build() {
  // ---------------------------------------------------------------------------
  // MATERIALS
  // ---------------------------------------------------------------------------
  const grassTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5f8a3f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${100 + Math.random() * 60 | 0},${30 + Math.random() * 30 | 0},0.6)`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 3); }
  });
  const hedge = std({ color: '#3f6b31', roughness: 0.95 }), leaf = std({ color: '#4c7a3a', roughness: 0.9 }), bark = std({ color: '#6b5443', roughness: 1 });
  const line = std({ color: '#f2f2ee', roughness: 0.8 });
  const mirror = std({ color: '#d3dce0', roughness: 0.12, metalness: 0.5 }), towelW = std({ color: '#f3f0ea', roughness: 1 });
  const frame = std({ color: '#2b2b2b', roughness: 0.5, metalness: 0.4 }), terracotta = std({ color: '#b5653f', roughness: 0.9 });
  const paint = c => std({ color: c, roughness: 0.4, metalness: 0.1 }), tint = std({ color: '#1d2328', roughness: 0.1, metalness: 0.5 });

  function tree(ix, iy, s = 1, y0 = T0) {                         // tree standing on the térreo garden
    const [x, z] = W(ix, iy), g = new THREE.Group();
    cylinder(g, 0.12 * s, 0.18 * s, 2.6 * s, bark, 0, 0, 0, 10);
    mesh(g, new THREE.IcosahedronGeometry(1.6 * s, 1), leaf, 0, 3.4 * s, 0);
    mesh(g, new THREE.IcosahedronGeometry(1.1 * s, 1), leaf, 0.7 * s, 3.0 * s, 0.5 * s);
    g.position.set(x, y0, z); world.add(g);
  }
  function pot(ix, iy, s = 1.2) { const pl = plantB(0, 0, s, terracotta); const [x, z] = W(ix, iy); pl.position.set(x, 0, z); world.add(pl); }
  function car(ix, iy, dir, paint) {                               // the shared premium car (carKit.js), front towards dir
    atI(() => premiumCarB(paint), ix, iy, dir);
    const [x, z] = W(ix, iy), v = dir === 'up' || dir === 'down', { len, wid } = CAR_HALF;
    colliders.push(v ? { x0: x - len, x1: x + len, z0: z - wid, z1: z + wid } : { x0: x - wid, x1: x + wid, z0: z - len, z1: z + len });
  }

  // Real-size bike (26" wheels Ø 0.68 m, wheelbase 1.04 m, overall 1.72 m, bars 0.58 m) hung VERTICALLY by the front
  // wheel – the plan's rack symbols are 0.62 m deep at 0.47 m spacing, i.e. the wheel seen from above on a vertical
  // hanger. Hung frame: wheels against the wall (+z), front wheel up; origin = hook point (top of the front tyre) on the
  // wall face. One InstancedMesh per material for all bikes.
  const bikeParts = { frame: [], black: [], metal: [] };
  {
    const V = (x, y, z) => new THREE.Vector3(x, y, z), up = V(0, 1, 0);
    const tube = (list, a, b, r) => { const d = b.clone().sub(a), g = new THREE.CylinderGeometry(r, r, d.length(), 8);
      g.translate(0, d.length() / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d.normalize())); g.translate(a.x, a.y, a.z); list.push(g); };
    const part = (list, g, x, y, z, rx = 0, ry = 0, rz = 0) => { g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); list.push(g); };
    // upright bike first: length along z, front at +z, y up
    const R = V(0, 0.34, -0.52), F = V(0, 0.34, 0.52), BB = V(0, 0.29, -0.06), ST = V(0, 0.8, -0.22), HT = V(0, 0.86, 0.36), HB = V(0, 0.7, 0.41);
    tube(bikeParts.frame, ST, HT, 0.019); tube(bikeParts.frame, BB, HB, 0.022); tube(bikeParts.frame, BB, ST, 0.018); tube(bikeParts.frame, HB, HT, 0.022);
    for (const s of [-1, 1]) {
      tube(bikeParts.frame, BB, V(s * 0.06, 0.34, -0.52), 0.011); tube(bikeParts.frame, V(0, 0.78, -0.21), V(s * 0.06, 0.34, -0.52), 0.01);
      tube(bikeParts.frame, V(s * 0.05, 0.7, 0.41), V(s * 0.05, 0.34, 0.52), 0.012);
    }
    tube(bikeParts.metal, HT, V(0, 1.0, 0.33), 0.014); tube(bikeParts.metal, V(-0.29, 1.0, 0.33), V(0.29, 1.0, 0.33), 0.011);
    for (const s of [-1, 1]) tube(bikeParts.black, V(s * 0.2, 1.0, 0.33), V(s * 0.3, 1.0, 0.33), 0.017);
    tube(bikeParts.metal, ST, V(0, 0.93, -0.26), 0.013);
    part(bikeParts.black, new THREE.BoxGeometry(0.13, 0.05, 0.27), 0, 0.95, -0.27);
    for (const C of [R, F]) {
      part(bikeParts.black, new THREE.TorusGeometry(0.315, 0.025, 8, 32), C.x, C.y, C.z, 0, Math.PI / 2, 0);       // tyre
      part(bikeParts.metal, new THREE.TorusGeometry(0.29, 0.01, 6, 32), C.x, C.y, C.z, 0, Math.PI / 2, 0);         // rim
      part(bikeParts.metal, new THREE.CylinderGeometry(0.025, 0.025, 0.12, 10), C.x, C.y, C.z, 0, 0, Math.PI / 2); // hub
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 8; part(bikeParts.metal, new THREE.BoxGeometry(0.004, 0.58, 0.004), C.x, C.y, C.z, a); }
    }
    part(bikeParts.metal, new THREE.CylinderGeometry(0.1, 0.1, 0.008, 24), 0.06, BB.y, BB.z, 0, 0, Math.PI / 2);   // chainring
    for (const s of [-1, 1]) { tube(bikeParts.black, V(s * 0.07, BB.y, BB.z), V(s * 0.08, BB.y - s * 0.15, BB.z + s * 0.06), 0.012);
      part(bikeParts.black, new THREE.BoxGeometry(0.1, 0.02, 0.07), s * 0.13, BB.y - s * 0.15, BB.z + s * 0.06); }
    // hang it: front up, wheels to +z (wall), top of the front tyre at the origin
    const hang = new THREE.Matrix4().makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(0, -0.86, -0.05));
    for (const k in bikeParts) bikeParts[k] = mergeGeometries(bikeParts[k].map(g => g.toNonIndexed().applyMatrix4(hang)));
  }
  const bikeSpots = [], rackParts = [];
  const BIKE_COLS = ['#3b5f8a', '#b33a2e', '#2b2b2b', '#e9e7e2', '#4f7d5a', '#d9a441', '#7a8a99', '#1f4f7a', '#8c2f39'];
  // a vertical rack: wall plane at iyWall, bikes facing `dir` ('up' = wall to image-up), hooks staggered low/high so the
  // bars clear at 0.47 m spacing; a steel rail carries the hooks, a lower bar keeps the rear wheels off the wall
  function rack(ixs, iyWall, dir) {
    const s = dir === 'up' ? 1 : -1, rot = ROT_IMG[dir];
    ixs.forEach((ix, i) => bikeSpots.push({ ix, iy: iyWall, rot, h: i % 2 ? 2.25 : 1.95 }));
    const a = ixs[0] - 6, b = ixs[ixs.length - 1] + 6;
    const B = (ia, ib, d0, d1, y0, y1) => { const [xa, za] = W(ia, iyWall + s * d0), [xb, zb] = W(ib, iyWall + s * d1);
      const g = new THREE.BoxGeometry(Math.abs(xb - xa), y1 - y0, Math.abs(zb - za)); g.translate((xa + xb) / 2, (y0 + y1) / 2, (za + zb) / 2); rackParts.push(g.toNonIndexed()); };
    B(a, b, 0, 1.2, 1.88, 1.95); B(a, b, 0, 1.2, 2.18, 2.25);                                      // hook rails (low / high)
    B(a, b, 0, 1.6, 0.18, 0.24); B(a, b, 0, 1.6, 0.48, 0.54);                                      // rear-wheel bumpers
    for (const e of [a, b]) B(e - 0.6, e + 0.6, 0, 1.2, 0.0, 2.3);                                 // uprights
    ixs.forEach((ix, i) => { const y = i % 2 ? 2.18 : 1.88; B(ix - 0.4, ix + 0.4, 1.2, 8.2, y - 0.06, y); B(ix - 0.4, ix + 0.4, 7.4, 8.2, y - 0.06, y + 0.06); });   // J-hooks reaching the wheel's mid-plane
  }

  // ---------------------------------------------------------------------------
  // TÉRREO BELOW (context): garden, spa pool, quadra, podium walls, lobby under the void
  // ---------------------------------------------------------------------------
  fl(290, 150, 1410, 1165, grassTex, 3, 1, T0 + 0.004);
  { const [xa, za] = W(1125, 155), [xb, zb] = W(1400, 310);       // quadra
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(xb - xa), Math.abs(zb - za)), std({ color: '#d8b48a', roughness: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.set((xa + xb) / 2, T0 + 0.01, (za + zb) / 2); world.add(m); }
  bx(1028, 155, 1125, 312, T0, T0 + 3, M.wall, { collide: false });                           // ramp structure beside the quadra
  bx(640, 245, 815, 345, T0, T0 + 0.05, P.walnut, { collide: false });                         // spa deck
  bx(668, 262, 748, 318, T0 + 0.05, T0 + 0.12, std({ color: '#3fa7c9', roughness: 0.05, metalness: 0.1 }), { collide: false });
  for (const [a, b, s] of [[200, 250, 1.2], [210, 420, 1.1], [300, 200, 1.0], [430, 195, 1.2], [560, 200, 1.0], [700, 180, 1.2], [880, 200, 1.1], [960, 230, 1.0],
    [1500, 250, 1.1], [1500, 450, 1.1], [1500, 700, 1.1], [1500, 870, 1.1], [1500, 1040, 1.1], [290, 880, 1.0]]) tree(a, b, s);
  for (const [a, b, c, d] of [[332, 312, 1411, 318], [1405, 318, 1411, 1164], [850, 1158, 1405, 1164], [850, 960, 856, 1158], [356, 955, 850, 961], [356, 745, 362, 955], [332, 312, 338, 745]])
    bx(a, b, c, d, T0, -0.3, M.extWall, { collide: false });                                   // térreo outer walls
  for (const [a, b, c, d] of [[465, 312, 1411, 960], [338, 550, 465, 960], [850, 960, 1411, 1164]])
    bx(a, b, c, d, -0.3, 0, M.extWall, { collide: false });                                    // this floor's slab (the void stays open)
  fl(338, 318, 465, 550, porcelainTex, 0.9, 0.22, T0 + 0.003);                                // lobby floor seen through the void
  rug(-520 * K, 360 * K, -400 * K, 440 * K, P.jute); world.children[world.children.length - 1].position.y += T0;
  it((w, d) => sofaB(w, d, std({ color: '#c0794f', roughness: 0.9 })), 360, 470, 445, 500, 'up', false).position.y = T0;

  // ---------------------------------------------------------------------------
  // FLOORS + CEILINGS
  // ---------------------------------------------------------------------------
  fl(340, 555, 1405, 955, concreteTex, 2.0, 0.85, 0.002);                                      // estacionamento (05)
  fl(1060, 318, 1405, 555, concreteTex, 2.0, 0.85, 0.002);
  fl(985, 955, 1405, 1030, concreteTex, 2.0, 0.85, 0.002);
  fl(1180, 1030, 1405, 1158, concreteTex, 2.0, 0.85, 0.002);
  fl(468, 485, 1060, 568, porcelainTex, 0.9, 0.22, 0.003);                                     // corridor + core
  fl(965, 318, 1060, 485, porcelainTex, 0.9, 0.22, 0.003);                                     // east hall
  fl(589, 377, 700, 482, floorWoodTex, 1.6, 0.5, 0.004);                                       // massage rooms
  fl(709, 488, 863, 566, concreteTex, 1.5, 0.7, 0.004);                                        // stair hall
  fl(1016, 375, 1062, 445, concreteTex, 2.0, 0.85, 0.005); fl(1013, 520, 1062, 568, concreteTex, 2.0, 0.85, 0.005);   // parking beside the east hall (plan)
  fl(708, 373, 962, 482, marble('#bfae97', '150,128,104', 0.04, '#b2a089'), 2.0, 0.45, 0.004);          // bicicletário: warm stone-look porcelain
  ceil(338, 318, 465, 550);                                                                      // top of the double-height lobby
  // stairwell left open: ix 739–829 × iy 540–566 over the flight + the landing ix 715–739 × iy 518–566
  // (slab edges stop 0.5 px short of the hole so they sit INSIDE the stairwell walls – no coplanar faces to flicker)
  ceil(465, 318, 1408, 516); ceil(465, 516, 714.5, 566); ceil(715, 516, 739, 517.5); ceil(739.5, 516, 1408, 539.5); ceil(829.5, 540, 1408, 566);
  ceil(338, 555, 465, 566); ceil(338, 566, 1408, 958); ceil(856, 958, 1408, 1161);

  // ---------------------------------------------------------------------------
  // VOID over the double-height lobby – glass façade
  // ---------------------------------------------------------------------------
  wl(332, 318, 338, 550, [{ from: 330, to: 540, sill: 0.15, top: H - 0.1, glass: 'fixed' }]);
  wl(335, 312, 471, 318, [{ from: 345, to: 458, sill: 0.15, top: H - 0.1, glass: 'fixed' }]);
  wl(338, 550, 468, 556);

  const place = (g, ix, iy, dir, y = 0) => { const [x, z] = W(ix, iy); g.position.set(x, y, z); g.rotation.y = typeof dir === 'number' ? dir : { right: 0, left: Math.PI, up: Math.PI / 2, down: -Math.PI / 2 }[dir]; world.add(g); return g; };
  const look = (ix, iy, tx, ty) => Math.atan2(-(ty - iy), tx - ix);
  const solid = (a, b, c, d) => { const [x0, z0] = W(a, b), [x1, z1] = W(c, d); colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); };
  const light = (a, b, i = 1.4, c = '#ffd2a0') => { const l = new THREE.PointLight(c, i, 6, 2); l.position.set(W(a, b)[0], 2.3, W(a, b)[1]); world.add(l); };
  const roundT = (a, b, r, h, mat) => { const [x, z] = W(a, b); cylinder(world, r, r, h, mat, x, 0, z, 32); };
  const nc = { collide: false, cast: false };
  const walnut = P.walnut, plaster = std({ color: '#d8c4a8', roughness: 0.95 });
  const terrazzo = std({ roughness: 0.4, map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#ddd6cb'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1100; i++) { const t = Math.random(); g.fillStyle = t < 0.5 ? 'rgba(150,140,128,0.7)' : t < 0.8 ? 'rgba(105,96,88,0.6)' : 'rgba(245,241,233,0.9)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 1.8, 0, 7); g.fill(); } }) });
  const glassRail = (a, b, c, d) => { bx(a, b, c, d, 0, 1.1, M.glass, { cast: false }); bx(a, b - 0.3, c, d + 0.3, 1.1, 1.14, frame, { collide: false }); };

  // green lounge chair (beauty render): dark bent-wood side frames (front leg, arm, back post raked BACK), wood sling,
  // seat cushion and a reclined back cushion resting on a top rail – front faces +z
  const greenCush = fabric('#5f6b45', 1.4), frameW = std({ color: '#4a2f1f', roughness: 0.5 }), sling = std({ color: '#7a4e32', roughness: 0.6 });
  const loungeChair = () => { const g = new THREE.Group();
    for (const s of [-1, 1]) {
      rb(g, 0.05, 0.04, 0.74, frameW, s * 0.36, 0, -0.02, 0.015);                       // floor runner
      rb(g, 0.05, 0.56, 0.05, frameW, s * 0.36, 0, 0.32, 0.015);                        // front leg
      rb(g, 0.065, 0.04, 0.7, frameW, s * 0.36, 0.56, 0.0, 0.015);                      // arm
      rb(g, 0.05, 0.84, 0.05, frameW, s * 0.36, 0, -0.3, 0.015, -0.32);                 // back post, raked back
    }
    rb(g, 0.68, 0.04, 0.6, sling, 0, 0.24, 0.02, 0.01, -0.08);
    rb(g, 0.64, 0.12, 0.58, greenCush, 0, 0.27, 0.04, 0.05, -0.08);
    rb(g, 0.64, 0.54, 0.12, greenCush, 0, 0.36, -0.29, 0.05, -0.3);                     // back cushion, reclined
    rb(g, 0.77, 0.05, 0.05, frameW, 0, 0.8, -0.43, 0.015);                              // top rail
    return g; };
  // ---------------------------------------------------------------------------
  // ESPAÇO BEAUTY (02) – plan: room ix 471–584 × iy 375–482, covered terrace to the north (glass rail) behind sliding
  // glass doors, door from the corridor at the SW corner. Render: three styling stations in walnut box frames with LED
  // glow and terrazzo counters (south wall), shampoo station with a long terrazzo counter on walnut drawers under two
  // floating LED shelves (east wall, warm plaster), green lounge chairs + pedicure stools (west wall, walnut slats).
  // ---------------------------------------------------------------------------
  wl(464, 312, 471, 488);                                                                         // beauty | lobby void (solid on the plan)
  wl(464, 488, 471, 568);                                                                         // corridor + WC | lobby void (plan: wall down to the WC)
  wl(566, 312, 571, 375); bx(471, 345, 479, 373, 0, H, M.wall);                                   // terrace east wall, pier at the west
  wl(479, 370, 566, 375, [{ from: 482, to: 562, top: 2.4, glass: 'open' }]);                    // sliding glass doors to the terrace
  wl(584, 370, 589, 488);                                                                         // beauty | massage
  wl(471, 482, 589, 488, [{ from: 472, to: 491, top: 2.4, glass: 'open' }]);                    // open doorway from the corridor (no door)
  bx(571, 347, 621, 370, 0, H, M.wall); bx(627, 345, 634, 373, 0, H, M.wall);                     // shaft + pier (plan)
  fl(471, 314, 566, 370, porcelainTex, 1.2, 0.3, 0.004); 
  glassRail(471, 312, 566, 314);
  // terrace: two green lounge chairs round a little table, plants in the corner (plan)
  place(loungeChair(), 536, 342, look(536, 342, 530, 363)); place(loungeChair(), 548, 358, look(548, 358, 530, 363));
  roundT(530, 363, 0.22, 0.5, walnut); solid(526, 359, 534, 367);
  place(monsteraPotB(0.9), 558, 324); place(monsteraPotB(0.7), 561, 338); solid(553, 319, 566, 343);

  // ---- interior after the render ----
  // warm beige large-format floor, limewash plaster on the shampoo wall, smooth walnut panelling on the lounge wall
  fl(471, 375, 584, 482, marble('#dccdb9', '170,150,125', 0.05, '#c9b9a3'), 1.8, 0.35, 0.005);
  const limewash = std({ roughness: 0.95, map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#cfb99b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const r = 10 + Math.random() * 40, t = Math.random(); g.fillStyle = t < 0.5 ? 'rgba(222,203,176,0.18)' : 'rgba(180,158,128,0.14)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, r, r * 0.6, Math.random() * 3, 0, 7); g.fill(); } }) });
  const walnutF = std({ map: veneer('#8a5c3c', '60,35,18'), roughness: 0.5 }), walnutD = std({ color: '#5a3b26', roughness: 0.5 }), greyPanel = std({ color: '#5f5953', roughness: 0.7 });
  const mirrorB = std({ color: '#d8cfc3', roughness: 0.12, metalness: 0.35, emissive: '#3a3026', emissiveIntensity: 0.25 });   // reads as a mirror reflecting the warm room
  const glow = std({ color: '#fff3df', emissive: '#ffc98a', emissiveIntensity: 2.2 });
  bx(583.4, 375, 584, 482, 0, H, limewash, nc);
  bx(471, 376, 471.6, 482, 0, H, walnut, nc);
  for (let iy = 376; iy < 482; iy += 21) bx(471.6, iy - 0.15, 471.7, iy + 0.15, 0, H, walnutD, nc);      // panel joints

  // salon chair (render): slim salmon-terracotta seat + tall rounded back, slim arms, chrome hydraulic base + footrest
  const salmon = fabric('#c98d74', 1.2);
  const salonChair = () => { const g = new THREE.Group();
    cylinder(g, 0.27, 0.29, 0.025, P.brushed, 0, 0, 0, 36); cylinder(g, 0.04, 0.05, 0.4, P.brushed, 0, 0.025, 0, 16);
    rb(g, 0.5, 0.04, 0.46, P.brushed, 0, 0.4, 0, 0.01);
    rb(g, 0.54, 0.11, 0.5, salmon, 0, 0.43, 0.02, 0.05);
    const back = rb(g, 0.5, 0.62, 0.09, salmon, 0, 0.5, -0.23, 0.045); back.rotation.x = -0.1;
    for (const s of [-1, 1]) { rb(g, 0.06, 0.05, 0.42, salmon, s * 0.29, 0.66, 0.0, 0.025); rb(g, 0.03, 0.14, 0.03, P.brushed, s * 0.29, 0.53, 0.14, 0.01); }
    rb(g, 0.3, 0.025, 0.12, P.brushed, 0, 0.14, 0.33, 0.01); cylinder(g, 0.012, 0.012, 0.3, P.brushed, 0, 0.0, 0.28, 8).rotation.x = -0.6;
    return g; };
  // styling stations (south wall, render): deep walnut portal frames forming three bays; each bay: dark grey strip,
  // tall mirror, warm LED glow along the inner top and sides, floating terrazzo counter with plants, salon chair
  for (const f of [494, 523.5, 552.5, 581.5]) bx(f - 1.6, 468, f + 1.6, 482, 0, 2.6, walnutF);
  bx(492.4, 468, 583, 482, 2.42, 2.6, walnutF);
  for (const [a, c] of [[495.6, 521.9], [525.1, 550.9], [554.1, 579.9]]) {
    bx(a, 481.2, c, 482, 0, 2.42, std({ color: '#cbb89c', roughness: 0.9 }), nc);                  // wall inside the bay
    bx(a, 480.8, a + 4.5, 481.2, 0.86, 2.42, greyPanel, nc);                                        // dark strip (render)
    bx(a + 4.5, 480.8, c - 0.6, 481.2, 0.86, 2.3, mirrorB, nc);                                     // tall mirror
    bx(a, 468.5, c, 481.2, 2.39, 2.42, glow, nc);                                                   // LED along the top
    for (const t of [a, c - 0.25]) bx(t, 476, t + 0.25, 481.2, 0.86, 2.42, glow, nc);              // LED down the sides
    bx(a, 470, c, 482, 0.8, 0.88, terrazzo);                                                        // floating terrazzo counter
    bx(a, 474, c, 482, 0.12, 0.13, glow, nc);                                                       // toe-kick glow
    place(salonChair(), (a + c) / 2, 459, 'down');
  }
  place(tropicalB(0.38), 500, 475, 0.4, 0.88); place(tropicalB(0.32), 505, 476, 2, 0.88); place(tropicalB(0.3), 532, 476, 1, 0.88);
  for (const [a, b, h] of [[565, 476, 0.2], [567, 478, 0.16], [570, 476.5, 0.22]]) { const [x, z] = W(a, b); cylinder(world, 0.03, 0.03, h, P.glassBottle, x, 0.88, z, 12); }

  // shampoo station (east wall, render): floating walnut drawer unit, thick terrazzo top + backsplash, round vessel
  // sink with a tall arched faucet, two walnut shelves with LED glow, decor; shampoo chair in front, plant at the end
  bx(576, 376, 584, 421, 0.28, 0.82, walnut);
  for (const iy of [391, 406]) bx(575.85, iy - 0.12, 576, iy + 0.12, 0.3, 0.8, walnutD, nc);         // drawer joints
  bx(575.85, 376, 576, 421, 0.6, 0.62, walnutD, nc);
  bx(575.2, 375.6, 584, 421.4, 0.82, 0.9, terrazzo); bx(582.6, 375.6, 583.4, 421.4, 0.9, 1.2, terrazzo, nc);
  { const [x, z] = W(579, 407);
    lathe(world, [[0, 0], [0.09, 0], [0.19, 0.04], [0.21, 0.13], [0.19, 0.13], [0.17, 0.05], [0, 0.03]], P.ceramic, x, 0.9, z, 32);
    const fx = W(582, 407); cylinder(world, 0.015, 0.018, 0.42, P.black, fx[0], 0.9, fx[1], 12);
    bx(579.6, 406.6, 582.2, 407.4, 1.29, 1.32, P.black, { collide: false }); bx(579.6, 406.7, 580.2, 407.3, 1.2, 1.32, P.black, { collide: false }); }
  { const p = new THREE.Group(); lathe(p, [[0, 0], [0.09, 0], [0.11, 0.16], [0.1, 0.17], [0, 0.17]], std({ color: '#8a5a3c', roughness: 0.5 }), 0, 0, 0, 24); p.add(tropicalB(0.42)).position.y = 0.15; place(p, 579.5, 380, 0, 0.9); }
  const shelf = (iy0, iy1, y) => { bx(578.6, iy0, 584, iy1, y, y + 0.05, walnut); bx(579, iy0 + 0.5, 579.4, iy1 - 0.5, y - 0.006, y, glow, nc); };
  shelf(380, 412, 1.5); shelf(380, 412, 1.9);
  for (const [b, h, y] of [[383, 0.18, 1.55], [385, 0.15, 1.55], [387, 0.2, 1.55], [404, 0.16, 1.95]]) { const [x, z] = W(581, b); cylinder(world, 0.03, 0.03, h, P.glassBottle, x, y, z, 12); }
  bx(579.5, 395, 583.5, 401, 1.55, 1.62, P.towel, { collide: false }); bx(579.5, 395.2, 583.5, 400.8, 1.62, 1.69, P.towel, { collide: false });
  { const [x, z] = W(581, 397); lathe(world, [[0, 0], [0.06, 0], [0.08, 0.12], [0.05, 0.22], [0.035, 0.24], [0, 0.24]], std({ color: '#9b6a4a', roughness: 0.6 }), x, 1.95, z, 24); }
  { const [x, z] = W(581, 389); cylinder(world, 0.07, 0.07, 0.1, std({ color: '#b07a55', roughness: 0.6 }), x, 1.95, z, 24); }
  place(shampooB(), 557, 403, 'left'); solid(549, 396, 570, 410);
  // two big monsteras in glossy brown pots in front of the plaster wall (render)
  place(monsteraPotB(1.2), 575, 437); place(monsteraPotB(0.9), 577, 451); solid(569, 430, 584, 457);

  // lounge + pedicure corner (west wall, render): green lounge chairs, pedicure stools on castors, white tray tables
  // pedicure sets moved north (toward the terrace): lounge chair, stool facing it with a clear gap, one tray table each
  for (const iy of [397, 427]) { place(loungeChair(), 484, iy, 'right'); place(pedicureB(), 504, iy, 'left'); }
  roundT(479, 412, 0.2, 0.48, walnut);
  for (const [a, b, i] of [[510, 420, 1.2], [545, 450, 1.1], [560, 395, 1.0], [520, 345, 0.9]]) light(a, b, i);
  light(538, 470, 0.7, '#ffbf80');

  // ---------------------------------------------------------------------------
  // SALAS DE MASSAGEM (03) – plan: upper room ix 589–700 × 377–424 (reading chair, massage bed, tall cabinet), lower room
  // ix 628–700 × 428–482 (massage bed, bench + vanity), small hall ix 589–621 open to the corridor
  // ---------------------------------------------------------------------------
  wl(589, 370, 637, 377); wl(637, 373, 700, 380, [{ from: 639, to: 698, sill: 1.0, top: 2.3, glass: 'window' }]);
  wl(700, 370, 707, 488);
  // thin partition between the two massage rooms (plan): from ix 613 to the east wall; the hall stays open,
  // the upper room is entered beside it (ix 593–613), the lower room through the gap at iy 428–448
  // … built as a statement walnut wall: a solid walnut core, vertical fins of two depths on both faces (a rhythm of
  // 2 shallow + 1 deep), a dark recessed plinth and a warm LED wash along the top of each face
  {
    bx(613, 424.8, 700, 427.2, 0, H, walnut);                                                        // core (collides)
    for (const [face, s] of [[424.8, -1], [427.2, 1]]) {
      bx(613, face, 700, face + s * 0.35, 0, 0.1, walnutD, nc);                                       // recessed plinth
      let k = 0;
      for (let ix = 614.2; ix < 699; ix += 2.2, k++) {
        const d = k % 3 === 2 ? 1.1 : 0.55;                                                           // deep fin every third
        bx(ix, Math.min(face, face + s * d), ix + 1.1, Math.max(face, face + s * d), 0.1, H - 0.14, walnut, nc);
      }
      bx(613, Math.min(face, face + s * 1.2), 700, Math.max(face, face + s * 1.2), H - 0.14, H - 0.1, glow, nc);   // LED wash
    }
  }
  wl(621, 448, 628, 488); wl(628, 482, 700, 488);                                                // lower room, door at iy 428–448
  // ---- spa interior (no render; premium spa design on the plan layout) ----
  // warm greige plaster, walnut slat feature walls with an LED cove, padded massage tables (head to the east, as on the
  // plan), therapist stools, oil/candle trolleys, walnut storage, dim warm light
  const spaPlaster = std({ color: '#cdbba3', roughness: 0.95 }), cream = fabric('#e9dfcf', 1.2), sand = fabric('#cdb89a', 1.4);
  const candle = std({ color: '#fff4e0', emissive: '#ffb35a', emissiveIntensity: 1.6 });
  const massageTable = () => { const g = new THREE.Group();                         // length along local z, head at +z
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.05, 0.6, 0.05, walnut, sx * 0.3, 0, sz * 0.8, 0.01);
    for (const sx of [-1, 1]) rb(g, 0.03, 0.04, 1.62, walnut, sx * 0.3, 0.15, 0, 0.01);
    rb(g, 0.66, 0.04, 1.62, walnut, 0, 0.15, 0, 0.01);                                   // lower shelf
    rb(g, 0.74, 0.1, 1.86, cream, 0, 0.6, 0, 0.04);                                       // padded top
    rb(g, 0.5, 0.09, 0.32, std({ color: '#f4efe6', roughness: 0.9 }), 0, 0.7, 0.68, 0.045);                  // head pillow on the table
    rb(g, 0.62, 0.03, 0.5, sand, 0, 0.7, -0.35, 0.015);                                  // folded towel
    const bol = cylinder(g, 0.075, 0.075, 0.56, sand, 0, 0, 0, 20); bol.rotation.z = Math.PI / 2; bol.position.set(0, 0.77, -0.72);   // knee/feet bolster, centred across the table
    for (let i = 0; i < 3; i++) rb(g, 0.36, 0.06, 0.24, P.towel, 0, 0.19 + i * 0.065, -0.4, 0.025);   // towels on the shelf
    return g; };
  const stool = () => { const g = new THREE.Group(); for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; rb(g, 0.04, 0.03, 0.26, P.black, Math.sin(a) * 0.13, 0.03, Math.cos(a) * 0.13, 0.01, 0, a, 0); }
    cylinder(g, 0.025, 0.025, 0.42, P.brushed, 0, 0.05, 0, 10); cylinder(g, 0.2, 0.2, 0.08, sand, 0, 0.47, 0, 28); return g; };
  const trolley = () => { const g = new THREE.Group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.03, 0.78, 0.03, walnut, sx * 0.24, 0.03, sz * 0.17, 0.008);
    for (const y of [0.15, 0.45, 0.78]) rb(g, 0.52, 0.025, 0.38, walnut, 0, y, 0, 0.008);
    for (const [x, z, h] of [[-0.15, -0.08, 0.16], [-0.08, -0.1, 0.12], [0.0, -0.07, 0.18]]) cylinder(g, 0.028, 0.028, h, P.glassBottle, x, 0.805, z, 12);
    for (const [x, z] of [[0.12, 0.06], [0.18, -0.06]]) { cylinder(g, 0.035, 0.035, 0.07, std({ color: '#f3ead8', roughness: 0.6 }), x, 0.805, z, 16); cylinder(g, 0.006, 0.006, 0.02, candle, x, 0.875, z, 8); }
    cylinder(g, 0.1, 0.08, 0.05, std({ color: '#3c3a37', roughness: 0.4 }), 0.05, 0.805, 0.08, 20);              // stone bowl
    for (let i = 0; i < 3; i++) rb(g, 0.34, 0.05, 0.22, P.towel, 0, 0.475 + i * 0.055, 0, 0.02);
    for (let i = 0; i < 4; i++) { const t = cylinder(g, 0.045, 0.045, 0.3, sand, -0.12 + i * 0.08, 0, 0, 14); t.rotation.x = Math.PI / 2; t.position.set(-0.12 + i * 0.08, 0.215, 0); }
    return g; };
  const slatWall = (alongIx, k, sgn, p0, p1) => {                                     // walnut slats on a wall face + LED cove at the top
    const B = (a, c, t0, t1, y0, y1, m) => alongIx ? bx(a, Math.min(t0, t1), c, Math.max(t0, t1), y0, y1, m, nc) : bx(Math.min(t0, t1), a, Math.max(t0, t1), c, y0, y1, m, nc);
    B(p0, p1, k, k + sgn * 0.4, 0, H, walnutD);
    for (let p = p0 + 0.6; p < p1 - 0.6; p += 2.4) B(p, p + 1.3, k + sgn * 0.4, k + sgn * 1.0, 0, H - 0.12, walnut);
    B(p0, p1, k + sgn * 0.4, k + sgn * 1.1, H - 0.12, H - 0.08, glow);
  };
  // wall finish
  bx(589, 379.6, 637, 380.2, 0, H, spaPlaster, nc);
  // upper room: reading chair corner (plan), massage table, stool, trolley, walnut storage wall with open towel niches
  place(massageTable(), 649, 401, 'right'); solid(630, 393, 670, 409);
  place(stool(), 655, 415); place(trolley(), 681, 399, 'left'); solid(677, 395, 686, 404);
  place(boucleTubChairB(std({ color: '#b5602e', roughness: 0.85 })), 604, 393, look(604, 393, 630, 410)); solid(596, 385, 612, 401);
  pot(613, 380, 0.6);
  bx(692, 383, 700, 424, 0, 0.9, P.lacquer); bx(692, 383, 700, 424, 0.9, 0.94, walnut);
  bx(699.4, 383, 700, 424, 0.94, 2.25, walnutD, nc); bx(692, 383, 700, 424, 2.25, 2.35, walnut);
  for (const iy of [383, 423.4]) bx(692, iy, 700, iy + 0.6, 0.94, 2.25, walnut);
  for (const y of [1.35, 1.8]) bx(692, 383.6, 700, 423.4, y, y + 0.03, walnut);
  bx(692.2, 383.6, 692.6, 423.4, 2.2, 2.25, glow, nc);
  for (const [y, n] of [[0.94, 6], [1.38, 5], [1.83, 4]]) for (let i = 0; i < n; i++) { const t = cylinder(world, 0.06, 0.06, 0.32, i % 2 ? P.towel : sand, ...W(696, 387 + i * 6.5).reduce((o, v, j) => (j ? o.push(y + 0.06, v) : o.push(v), o), []), 14); t.rotation.z = Math.PI / 2; }
  for (const iy of [395, 412]) bx(691.8, iy - 0.1, 692, iy + 0.1, 0.1, 0.85, walnutD, nc);
  // lower room: massage table, stool, walnut bench with cushion + towels (plan), walnut vanity with vessel sink + round mirror
  place(massageTable(), 663.5, 449.5, 'right'); solid(644, 441, 684, 458);
  place(stool(), 668, 465); place(trolley(), 694, 445, 'left'); solid(690, 441, 699, 450);
  bx(628, 474, 650, 482, 0, 0.42, walnut); bx(628.3, 474.3, 649.7, 481.7, 0.42, 0.5, sand, { collide: false });
  for (let i = 0; i < 3; i++) bx(643, 476, 648.5, 480.5, 0.5 + i * 0.05, 0.545 + i * 0.05, P.towel, { collide: false });
  bx(650, 475, 700, 482, 0.12, 0.86, walnut); for (const ix of [662.5, 675, 687.5]) bx(ix - 0.1, 474.85, ix + 0.1, 475, 0.14, 0.84, walnutD, nc);
  bx(650, 474.4, 700, 482, 0.86, 0.92, terrazzo);
  { const [x, z] = W(689, 478.5); lathe(world, [[0, 0], [0.08, 0], [0.17, 0.03], [0.18, 0.11], [0.16, 0.11], [0.15, 0.04], [0, 0.025]], P.ceramic, x, 0.92, z, 32);
    const m = mesh(world, new THREE.CylinderGeometry(0.34, 0.34, 0.02, 48), mirrorB, ...W(689, 481.6).reduce((o, v, j) => (j ? o.push(1.6, v) : o.push(v), o), []), 0, 0, Math.PI / 2);
    const r = mesh(world, new THREE.TorusGeometry(0.345, 0.012, 8, 48), glow, ...W(689, 481.5).reduce((o, v, j) => (j ? o.push(1.6, v) : o.push(v), o), []), 0, Math.PI / 2, 0); }
  bx(689, 480.6, 690, 481.6, 0.92, 1.2, P.black, { collide: false }); bx(689, 478.5, 690, 481.6, 1.17, 1.2, P.black, { collide: false });
  for (const [a, h] of [[660, 0.18], [663, 0.14]]) { const [x, z] = W(a, 478); cylinder(world, 0.03, 0.03, h, P.glassBottle, x, 0.92, z, 12); }
  { const [x, z] = W(670, 478); cylinder(world, 0.045, 0.045, 0.09, std({ color: '#f3ead8', roughness: 0.6 }), x, 0.92, z, 16); cylinder(world, 0.006, 0.006, 0.02, candle, x, 1.01, z, 8); }
  place(monsteraPotB(0.8), 694, 433); solid(689, 429, 699, 438);
  // hall: tall plant
  place(monsteraPotB(0.8), 595, 437); solid(591, 433, 599, 441);                                  // in the hall corner, clear of the entrance
  light(650, 401, 0.7, '#ffc68a'); light(663, 450, 0.7, '#ffc68a'); light(604, 450, 0.6); light(690, 415, 0.5, '#ffb070'); light(640, 478, 0.5, '#ffb070');

  // ---------------------------------------------------------------------------
  // BICICLETÁRIO (04) – plan: windows to the planter between two piers, door from the east hall only, racks along the
  // north wall, two short rows in the south half between stub walls, a workbench and a bike-wash counter
  // ---------------------------------------------------------------------------
  wl(707, 373, 962, 380, [{ from: 709, to: 796, sill: 0.9, top: 2.3, glass: 'window' }, { from: 818, to: 906, sill: 0.9, top: 2.3, glass: 'window' }, { from: 913, to: 960, sill: 0.9, top: 2.3, glass: 'window' }]);
  bx(796, 345, 818, 373, 0, H, M.wall); bx(906, 345, 913, 373, 0, H, M.wall);
  wl(962, 309, 967, 488, [{ from: 420, to: 440 }]);
  wl(707, 482, 967, 488);
  bx(802, 439, 810, 482, 0, H, M.wall); bx(906, 448, 913, 482, 0, H, M.wall);
  bx(588, 345, 965, 366, 0, 0.6, hedge, { collide: false });                                     // planter outside
  // racks measured on the plan (2000-px frame): north wall 6 × 4 bikes, south-west wall 2 × 4, free-standing rack in
  // front of the counter 2 × 4 – bike centres every ≈ 9.2 px (0.47 m)
  const grp = (...starts) => starts.flatMap(x0 => [0, 1, 2, 3].map(i => x0 + i * 9.2));
  rack(grp(720, 761, 802, 842, 882, 922), 380, 'up');
  rack(grp(722, 762), 480.9, 'down');                                          // on the slat wall
  rack(grp(822, 863), 467, 'down');
  bx(816, 466, 900, 468, 0, 0.06, M.steel, { collide: false });                                  // base of the free-standing rack
  {
    const rk = new THREE.Mesh(mergeGeometries(rackParts), M.steel); rk.castShadow = rk.receiveShadow = true; world.add(rk);
    const frameMat = std({ color: '#ffffff', roughness: 0.4, metalness: 0.3 }), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
    for (const [k, mat] of [['frame', frameMat], ['black', P.black], ['metal', P.brushed]]) {
      const im = new THREE.InstancedMesh(bikeParts[k], mat, bikeSpots.length);
      bikeSpots.forEach((b, i) => { const [x, z] = W(b.ix, b.iy); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rot);
        im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, b.h, z), q, one));
        if (k === 'frame') im.setColorAt(i, col.set(BIKE_COLS[(i * 5 + 3) % BIKE_COLS.length])); });
      im.castShadow = im.receiveShadow = true; world.add(im);
    }
  }
  // service counter behind the free-standing rack, cabinet beside it, bike-wash sink in the east bay (plan)
  // plan: both boxes behind the free-standing rack are structural pillars; the counter in the east bay is the sink
  bx(808, 473, 880, 482, 0, H, M.wall); bx(883, 473, 905, 482, 0, H, M.wall);                     // pillars
  // sink counter (east bay, plan): floating walnut cabinet, terrazzo top + upstand, round basin with a black arched tap,
  // backlit mirror over it, towel ring
  bx(914, 472.5, 961, 482, 0.15, 0.82, walnut); for (const ix of [929.5, 945]) bx(ix - 0.1, 472.35, ix + 0.1, 472.5, 0.17, 0.8, walnutD, nc);
  bx(913.5, 472, 961, 482, 0.82, 0.88, terrazzo); bx(913.5, 481, 961, 482, 0.88, 1.05, terrazzo, nc);
  { const [x, z] = W(937, 476.5); lathe(world, [[0, 0], [0.09, 0], [0.19, 0.03], [0.2, 0.13], [0.18, 0.13], [0.17, 0.04], [0, 0.025]], P.ceramic, x, 0.88, z, 32); }
  bx(936.5, 480.2, 937.5, 481, 0.88, 1.2, P.black, nc); bx(936.5, 477.5, 937.5, 481, 1.17, 1.2, P.black, nc);
  bx(925, 481.3, 949, 482, 1.25, 2.05, mirrorB, nc); bx(924.6, 481.5, 949.4, 482, 1.21, 2.09, glow, nc);
  { const [x, z] = W(955, 481.6); const r = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 24), P.black); r.rotation.y = Math.PI / 2; r.position.set(x, 1.15, z); world.add(r);
    bx(953.5, 481, 956.5, 481.5, 0.72, 1.06, P.towel, nc); }
  solid(712, 380, 960, 400); solid(714, 461, 800, 482); solid(814, 447, 902, 482);
  // ---- warm interior: walnut slat walls with an LED cove (west wall + south wall behind the racks), a wood-slat ceiling
  // over the main space, warm light, a walnut bench with a cushion, plants ----
  slatWall(false, 707.05, 1, 380, 482);                                                               // west wall
  slatWall(true, 481.95, -1, 708, 802);                                                               // south wall behind the SW racks
  for (let iy = 384; iy < 446; iy += 2.6) bx(712, iy, 958, iy + 1.3, H - 0.07, H - 0.02, walnut, { collide: false, cast: false, parent: ceilingGroup });   // ceiling slats
  for (const iy of [395, 420, 445]) bx(712, iy - 0.25, 958, iy + 0.25, H - 0.075, H - 0.07, glow, { collide: false, cast: false, parent: ceilingGroup });  // linear LEDs
  bx(712, 410, 721, 438, 0, 0.42, walnut); bx(712.3, 410.3, 720.7, 437.7, 0.42, 0.5, fabric('#b8714a', 1.3), nc);   // bench + terracotta cushion
  for (const iy of [416, 428]) bx(708.2, iy - 3, 709.2, iy + 3, 0.9, 1.3, std({ color: '#b8714a', roughness: 0.9 }), nc);   // back cushions on the slats
  place(monsteraPotB(0.8), 716, 447); solid(711, 442, 721, 452);
  place(monsteraPotB(0.85), 954, 447); solid(949, 442, 959, 452);
  for (const [a, b] of [[760, 420], [840, 420], [920, 420], [760, 455], [860, 440]]) light(a, b, 1.3, '#ffc98a');

  // ---------------------------------------------------------------------------
  // EAST HALL + its covered terrace (plan): glass rail to the north, glass door, parking beside it
  // ---------------------------------------------------------------------------
  glassRail(967, 312, 1062, 314);
  wl(1062, 309, 1070, 375); bx(968, 345, 974, 370, 0, H, M.wall);
  wl(967, 370, 1016, 375, [{ from: 977, to: 1006, top: 2.4, glass: 'open' }]);
  wl(1010, 375, 1016, 447); wl(1010, 445, 1068, 450); wl(1062, 450, 1068, 520);
  wl(1016, 370, 1068, 375);                                                                       // terrace | parking (plan)
  bx(1068, 446, 1083, 500, 0, H, M.wall);                                                         // shaft on the parking side (plan)
  wl(1011, 516, 1062, 520, [{ from: 1039, to: 1059.5 }]);   // starts inside the lift core: no slit at ix 1012–1013   // casing kept clear of the east wall (no coplanar faces)                                           // door to the parking
  pot(1045, 330, 1.2);

  // ---------------------------------------------------------------------------
  // ELEVADORES (01), stairs, WCs
  // ---------------------------------------------------------------------------
  bx(505, 518, 666, 568, 0, H, M.wall); bx(912, 518, 1012, 568, 0, H, M.wall);
  // HALL DOS ELEVADORES – premium lift hall (corridorKit), same language as the térreo: travertine lift wall with
  // bronze portals, walnut / limewash panels with art + sconces on the room side, LED coves, stone floor
  {
    const PPM = 19.37, C = makeCorridor({ bx, fl, W, ppm: PPM }), S = 518, N = 488, clad = S - 0.025 * PPM;
    C.floor(471, N, 709, S); C.floor(863, N, 1062, S);
    C.stone(505, 666, S, 'S'); C.stone(912, 1012, S, 'S');
    C.lifts([527, 577, 627, 937, 985], clad, '1');
    // room side (face iy 488): beauty wall 491–589 (doorway 472–491), massage 628–700, bicicletário 869–962
    C.slats(494, 586, N, 'N');
    C.plaster(630, 699, N, 'N'); C.cove(630, 699, N + 0.018 * PPM, 'N'); C.sconce(645, N, 'N'); C.sconce(684, N, 'N');
    C.plaster(869, 962, N, 'N'); C.cove(869, 962, N + 0.018 * PPM, 'N');
    for (const ix of [540, 660, 930, 1000]) C.light(ix, 503, 0.8);
  }
  // stair hall (plan): doors from the corridor on both sides, shaft + hydrant cabinet, flight along the south wall
  // measured on the plan: doors at iy 488–508 on both sides, west wall + duct + inner wall ix 701–715, shaft ix 739–796 and
  // hydrant cabinet ix 798–824 across the middle (iy 518–540), short wall at ix 825–829, flight of 15 risers along the
  // south wall (iy 541–566) climbing WEST from ix 828 to the landing at ix 715–739, which turns north into the stairwell
  wl(701, 508, 709, 568); wl(863, 508, 869, 568);
  bx(709, 516, 715, 566, 0, H, M.wall);                                                           // inner wall / duct (plan)
  bx(739, 518, 796, 540, 0, H, M.wall);                                                           // shaft
  // fire-hose cabinet (plan: hydrant symbol beside the shaft) – full-height wall with a recessed red steel cabinet on
  // the hall side: frame, white back, coiled hose on a reel, glass door, extinguisher beside it
  bx(796, 520, 825, 540, 0, H, M.wall);
  { const red = std({ color: '#c0261d', roughness: 0.35, metalness: 0.3 }), white = std({ color: '#f2f0ea', roughness: 0.6 });
    bx(803, 519.2, 823, 520, 0.6, 1.62, red);                                                     // cabinet shell
    bx(804, 519.0, 822, 519.6, 0.66, 1.56, white, nc);                                             // back (inside)
    for (const [a, c, y0, y1] of [[803, 804, 0.6, 1.62], [822, 823, 0.6, 1.62], [803, 823, 0.6, 0.66], [803, 823, 1.56, 1.62]]) bx(a, 518.4, c, 519.2, y0, y1, red, nc);   // frame
    { const [x, z] = W(813, 518.9), coil = new THREE.Group();
      for (let k = 0; k < 4; k++) coil.add(new THREE.Mesh(new THREE.TorusGeometry(0.17 + k * 0.035, 0.016, 8, 32), red));
      coil.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20).rotateX(Math.PI / 2), P.brushed));
      coil.rotation.y = Math.PI / 2; coil.position.set(x, 1.1, z); world.add(coil); }
    bx(804, 518.3, 822, 518.4, 0.66, 1.56, std({ color: '#dfe8ea', roughness: 0.05, transparent: true, opacity: 0.25 }), nc);   // glass door
    bx(819, 518.25, 820.5, 518.35, 1.05, 1.17, P.black, nc);                                     // handle
    // extinguisher on a floor stand beside the cabinet
    { const [x, z] = W(799.5, 518); cylinder(world, 0.08, 0.08, 0.5, red, x, 0.12, z, 20); cylinder(world, 0.02, 0.02, 0.08, P.black, x, 0.62, z, 10);
      bx(797.5, 516, 801.5, 520, 0, 0.12, std({ color: '#2b2b2b', roughness: 0.6 }), nc); }
  }
  bx(825, 515, 829, 540, 0, H, M.wall);
  for (let i = 0; i < 15; i++) { const xb = 828 - i * 5.9; bx(xb - 5.9, 541, xb, 566, 0, 0.17 * (i + 1), M.ceiling); }   // steps
  bx(715, 518, 739.5, 566, 0, 15 * 0.17 + 0.17, M.ceiling);                                       // landing
  { const rail = std({ color: '#2b2b2b', roughness: 0.4, metalness: 0.6 });                      // handrail on the south wall
    // one continuous sloped rail (0.9 m above the nosings) on two wall brackets
    const [xa, za] = W(830, 563.6), [xb, zb] = W(737, 563.6), a = new THREE.Vector3(xa, 0.17 + 0.9, za), b = new THREE.Vector3(xb, 15 * 0.17 + 0.9, zb), d = b.clone().sub(a);
    const g = new THREE.CylinderGeometry(0.022, 0.022, d.length(), 12); g.translate(0, d.length() / 2, 0);
    const m = new THREE.Mesh(g, rail); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.position.copy(a); m.castShadow = true; world.add(m);
    for (const t of [0.15, 0.85]) { const q = a.clone().addScaledVector(d, t); bx(830 - t * 93 - 0.3, 563.6, 830 - t * 93 + 0.3, 565, q.y - 0.02, q.y + 0.01, rail, nc); } }
  // stairwell above the flight (the ceiling is left open there): walls up to the next floor + its slab
  for (const [a, b, c, d] of [[709, 514, 739, 518], [739, 514, 743, 540], [739, 536, 829, 540], [829, 536, 833, 570], [709, 565, 833, 570], [709, 514, 715, 570]])
    bx(a, b, c, d, H - 0.02, H + 3, M.wall, { collide: false, parent: ceilingGroup });       // starts just below the ceiling: no seam, no coplanar faces
  bx(709, 514, 833, 570, H + 2.9, H + 3.1, M.ceiling, { collide: false, parent: ceilingGroup });
  // WC in front of the beauty (plan): room ix 469–505 × iy 520–552, doorway at the east end of its north wall (ix 486–504),
  // toilet on the west wall facing east, long vanity along the south wall, shaft behind it
  wl(468, 515, 505, 520, [{ from: 486, to: 504, glass: 'open' }]);
  wl(468, 552, 505, 557); bx(468, 557, 505, 565, 0, H, M.wall);
  fl(469, 520, 505, 552, porcelainTex, 0.6, 0.22, 0.006);
  it(toiletB, 469, 521, 483, 534, 'right');
  it(vanity2B, 470, 541, 504, 552, 'up');
  // WC by the east lifts (plan): room ix 868–908 × iy 520–567, door at the WEST end of its north wall (ix 869–884),
  // basin on the east wall, toilet on the south wall facing north in front of a cistern ledge
  // door kept 1.5 px off the stair-hall wall: starting AT ix 869 put the jamb casing inside that wall, coplanar → flicker
  wl(869, 515, 912, 520, [{ from: 870.5, to: 885 }]);
  fl(868, 520, 908, 567, porcelainTex, 0.6, 0.22, 0.006);
  bx(868, 562.5, 908, 566, 0, 1.1, P.lacquer); bx(868, 562.2, 908, 566, 1.1, 1.13, P.marble);      // cistern ledge
  it(toiletB, 871, 545, 885, 562.5, 'up');
  it(vanityB, 896, 521, 908, 536, 'left');
  // south wall, with the plan's door from the corridor down to the parking (ix 675–696)
  wl(465, 565, 1012, 571, [{ from: 675, to: 696 }]);
  bx(698, 568, 710, 627, 0, H, M.wall);                                                           // shafts beside the door (plan)
  bx(673, 571, 699, 600, 0.002, 0.009, std({ color: '#c9c9c4', roughness: 0.9 }), { collide: false, cast: false });   // walkway (plan)

  // ---------------------------------------------------------------------------
  // ESTACIONAMENTO (05) – ventilated façades, columns, stalls, ramps, cars
  // ---------------------------------------------------------------------------
  wl(335, 556, 341, 745, [{ from: 580, to: 735, sill: 1.0, top: 2.3 }]);
  wl(341, 742, 362, 748);
  wl(356, 748, 362, 955, [{ from: 780, to: 945, sill: 1.0, top: 2.3 }]);
  wl(356, 955, 856, 961, [{ from: 380, to: 840, sill: 1.0, top: 2.3 }]);
  wl(850, 961, 856, 1158, [{ from: 975, to: 1150, sill: 1.0, top: 2.3 }]);
  wl(850, 1158, 1411, 1164, [{ from: 1190, to: 1295, sill: 1.0, top: 2.3 }]);
  wl(1405, 318, 1411, 1158, [{ from: 330, to: 600, sill: 1.0, top: 2.3 }, { from: 620, to: 1020, sill: 1.0, top: 2.3 }]);   // Rua Platina façade
  wl(1063, 312, 1411, 318, [{ from: 1075, to: 1395, sill: 1.0, top: 2.3 }]);
  // columns measured on the plan (2000-px frame): wall-columns along the core rows, horizontal bars in the middle block
  // and along Rua Platina, short columns in the south rows
  for (const [a, b, c, d] of [[462, 570, 470, 607], [461, 690, 470, 750], [562.5, 679, 571, 707], [620, 672, 627.5, 710], [700, 672, 706.5, 710],
    [802.5, 672, 810, 707], [900, 672, 912, 707], [960, 680, 968.5, 707], [1062, 567, 1070, 610], [1062, 690, 1070, 750],
    [420, 872, 427, 890], [563, 872, 570, 890], [707, 872, 714, 890],
    [1172, 367, 1197, 373], [1172, 467, 1196, 477], [1172, 552, 1196, 561], [1172, 654, 1213, 661], [1187, 745, 1215, 750],
    [1325, 455, 1337, 459], [1325, 598, 1337, 602], [1325, 742, 1337, 746], [1325, 885, 1337, 889], [1325, 1029, 1337, 1032],
    [1080, 882, 1085, 895], [1175, 882, 1180, 895], [987, 975, 992, 1030]])
    bx(a, b, c, d, 0, H, M.wall);
  // painted bay lines (plan)
  const LN = (a, b, c, d) => bx(a, b, c, d, 0.003, 0.008, line, { collide: false, cast: false });
  const vL = (x, y0, y1) => LN(x - 0.6, y0, x + 0.6, y1), hL = (y, x0, x1) => LN(x0, y - 0.6, x1, y + 0.6);
  for (const x of [370, 417.5, 470, 517.5, 565, 620, 672.5, 710, 757.5, 810, 860, 912, 964, 1015, 1066]) vL(x, 570, 752);   // double row by the core
  hL(662.5, 370, 1066); hL(752.5, 370, 1066);
  for (let k = 0; k <= 10; k++) vL(375 + k * 47.5, 862, 955); hL(862, 375, 850);                                          // south row
  for (let k = 0; k <= 14; k++) hL(362 + k * 47.5, 1315, 1405); vL(1315, 362, 1030);                                     // along Rua Platina
  vL(1120, 320, 707); vL(1212, 320, 707); for (const y of [320, 367, 373, 420, 467, 475, 522, 562, 653, 660, 707]) hL(y, 1120, 1212);   // middle block
  vL(1128, 712, 750); vL(1148, 712, 750); vL(1168, 712, 750); vL(1188, 712, 750); hL(712, 1128, 1188); hL(750, 1128, 1188);   // motorbike bays
  for (const x of [987, 1032, 1085, 1130, 1177]) vL(x, 872, 962); hL(872, 987, 1177); hL(962, 987, 1177);                 // south block
  for (const x of [995, 1085, 1177]) vL(x, 972, 1017); hL(972, 995, 1177); hL(1017, 995, 1177);
  for (let x = 1310; x < 1400; x += 6) LN(x, 1086, x + 2.4, 1104);                                                          // hatched transfer zone
  for (const [b, d] of [[1035, 1083], [1107, 1158]]) bx(1308, b, 1405, d, 0.003, 0.007, std({ color: '#3b6fb6', roughness: 0.8 }), { collide: false, cast: false });   // accessible bays
  // ramps (down to the térreo / up to the 2º pavimento) – walled off, not walkable
  wl(850, 852, 989, 858); wl(983, 858, 989, 1030); wl(989, 1025, 1180, 1031);
  // sloped quad from (a,b)…(c,d): y0 → y1 along iy (alongIy) or along ix
  for (const [a, b, c, d, y0, y1, alongIy] of [[856, 900, 983, 1158, 0, T0, true], [989, 1031, 1180, 1158, 0, 1.5, false]]) {
    const v = (ix, iy, y) => { const [x, z] = W(ix, iy); return [x, y, z]; };
    const q = alongIy ? [v(a, b, y0), v(c, b, y0), v(c, d, y1), v(a, d, y1)] : [v(a, b, y0), v(a, d, y0), v(c, d, y1), v(c, b, y1)];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]], 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, std({ color: '#6c6f72', roughness: 0.9, side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m);
    const [xa, za] = W(a, b), [xb, zb] = W(c, d);
    colliders.push({ x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) });
  }
  for (const [a, b, dir, c] of [[395, 705, 'up', 'graphite'], [598, 618, 'up', 'obsidian'], [990, 618, 'up', 'midnight'], [780, 910, 'up', 'pearl'],
    [1010, 918, 'up', 'silver'], [1153, 918, 'up', 'racing'], [1165, 585, 'right', 'champagne'], [1360, 432, 'right', 'pearl'],
    [1360, 627, 'right', 'burgundy'], [1360, 958, 'right', 'obsidian']]) car(a, b, dir, c);
}
