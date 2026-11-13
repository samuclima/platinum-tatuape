// TÉRREO – ground floor of Platinum Tatuapé by Diálogo, traced from the brochure's "Implantação | Térreo"
// (DOC-20260928-WA0007.pdf p. 8, 2000 × 1455 px image; lot 2.701 m² ⇒ 18.33 image px = 1 m) and dressed
// after the brochure renders (lobby p. 13, quadra p. 15, casa de campo p. 17, coworking p. 27).
//
// The plan is drawn with north to the RIGHT (towards Rua Platina). The engine's world has north at +z,
// so every coordinate below is written in IMAGE pixels (ix → right, iy → down) and converted:
//   plan px = −iy·K,  plan pz = ix·K   (K = 5 so the engine's px-based details – door casings, skirting – stay to scale)
// Image directions: right = north (+z), left = south, up = west (+x), down = east (−x).
import * as THREE from 'three';
import { X, Z } from '../engine/plan.js';
import {
  H, M, P, RBG, at, baseCabB, box, caneChairB, ceilingGroup, colliders, concreteTex, cylinder, deskB,
  floor, floorWoodTex, fridgeB, item, lathe, mesh, plantB, porcelainTex, rb, roundChairB, roundCoffeeB, rug,
  sofaB, std, tableB, toiletB, upperCabB, vanity2B, wall, woodClad, world, worldRb, canvasTex, sanca, addLight, pothos, marble, fabric, books, phys, pile,
} from '../engine/core.js';
import { PK, laptopB, bigPotTree, builtGrillB, diningChairB, discPendantLine, drapeB, kitchenWallB, lSofaB, ovalStoneTableB, uplitPlant } from './premiumKit.js';
import { tropicalB, queenPalmB } from './pav2Kit.js';
import { CAR_HALF, premiumCarB } from './carKit.js';
import { makeCorridor } from './corridorKit.js';
import { barStoolB, boucleArmchairB, boucleTubChairB, conePendant, curvedLoungeSofaB, curvedSofaB, ficusTreeB, monsteraPotB, arcLampB, hoodCyl, islandB, organicTableB } from './pav2Kit.js';

const K = 5;
const FACE_IMG = { right: 's', left: 'n', up: 'e', down: 'w' };              // image direction → engine face
const ROT_IMG = { right: 0, left: Math.PI, up: Math.PI / 2, down: -Math.PI / 2 }; // image direction → rotation.y
const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);
// image-coordinate versions of the engine helpers
const bx = (ix0, iy0, ix1, iy1, y0, y1, mat, o) => box(-iy0 * K, ix0 * K, -iy1 * K, ix1 * K, y0, y1, mat, o);
const fl = (ix0, iy0, ix1, iy1, tex, tile, rough, y) => floor(-hi(iy0, iy1) * K, lo(ix0, ix1) * K, -lo(iy0, iy1) * K, hi(ix0, ix1) * K, tex, tile, rough, y);
function wl(ix0, iy0, ix1, iy1, ops = [], mat = M.wall, h = H) {               // openings given in image px along the wall
  const alongIx = Math.abs(ix1 - ix0) >= Math.abs(iy1 - iy0);
  const o = ops.map(q => alongIx ? { ...q, from: q.from * K, to: q.to * K } : { ...q, from: -q.to * K, to: -q.from * K });
  wall(-iy0 * K, ix0 * K, -iy1 * K, ix1 * K, o, mat, h);
}
const it = (builder, ix0, iy0, ix1, iy1, face, collide = true, ...args) => item(builder, -iy0 * K, ix0 * K, -iy1 * K, ix1 * K, FACE_IMG[face], collide, ...args);
const atI = (builder, ix, iy, dir, ...args) => at(builder, -iy * K, ix * K, typeof dir === 'number' ? dir : ROT_IMG[dir], ...args);
const W = (ix, iy) => [X(-iy * K), Z(ix * K)];                  // image px → world metres
function ceil(ix0, iy0, ix1, iy1, h = H, mat = M.ceiling) {    // roof slab + ceiling over a covered area
  bx(ix0, iy0, ix1, iy1, h, h + 0.3, M.extWall, { collide: false, parent: ceilingGroup });
  const [xa, za] = W(ix0, iy0), [xb, zb] = W(ix1, iy1), w = Math.abs(xb - xa), d = Math.abs(zb - za);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  ce.rotation.x = Math.PI / 2; ce.position.set((xa + xb) / 2, h - 0.001, (za + zb) / 2); ce.receiveShadow = true; ceilingGroup.add(ce);
}

export function build() {
  // ---------------------------------------------------------------------------
  // MATERIALS made for the térreo
  // ---------------------------------------------------------------------------
  const grassTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5f8a3f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${100 + Math.random() * 60 | 0},${30 + Math.random() * 30 | 0},0.6)`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 3); }
  });
  const pavingTex = canvasTex(256, 256, (g, w, h) => {          // light stone paving 0.6 × 0.6
    g.fillStyle = '#cfc9bf'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,112,100,0.45)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  const grass = std({ map: grassTex, roughness: 1 }), hedge = std({ color: '#3f6b31', roughness: 0.95 });
  const leaf = std({ color: '#4c7a3a', roughness: 0.9 }), leaf2 = std({ color: '#5e8d45', roughness: 0.9 }), bark = std({ color: '#6b5443', roughness: 1 });
  const frame = std({ color: '#2b2b2b', roughness: 0.5, metalness: 0.4 });
  const boucle = P.boucleW ?? P.linen, terracotta = std({ color: '#b5653f', roughness: 0.9 });
  const water = std({ color: '#3fa7c9', roughness: 0.05, metalness: 0.1 });
  const paint = c => std({ color: c, roughness: 0.4, metalness: 0.1 }), tint = std({ color: '#1d2328', roughness: 0.1, metalness: 0.5 });

  // trees + big potted plants
  function tree(ix, iy, s = 1) {
    const [x, z] = W(ix, iy), g = new THREE.Group();
    cylinder(g, 0.12 * s, 0.18 * s, 2.6 * s, bark, 0, 0, 0, 10);
    mesh(g, new THREE.IcosahedronGeometry(1.6 * s, 1), leaf, 0, 3.4 * s, 0);
    mesh(g, new THREE.IcosahedronGeometry(1.1 * s, 1), leaf2, 0.7 * s, 3.0 * s, 0.5 * s);
    mesh(g, new THREE.IcosahedronGeometry(1.0 * s, 1), leaf2, -0.6 * s, 3.7 * s, -0.4 * s);
    g.position.set(x, 0, z); world.add(g);
    colliders.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25 });
  }
  function pot(ix, iy, s = 1.3) { const pl = plantB(0, 0, s, terracotta); const [x, z] = W(ix, iy); pl.position.set(x, 0, z); world.add(pl); }
  function bed(ix0, iy0, ix1, iy1, h = 0.45) { bx(ix0, iy0, ix1, iy1, 0, h, hedge); }                 // planted bed / hedge
  // parked cars: the shared premium car (carKit.js) in a paint per bay
  function car(ix, iy, dir, paint) {                               // front towards dir
    atI(() => premiumCarB(paint), ix, iy, dir);
    const [x, z] = W(ix, iy), v = dir === 'up' || dir === 'down', { len, wid } = CAR_HALF;
    colliders.push(v ? { x0: x - len, x1: x + len, z0: z - wid, z1: z + wid } : { x0: x - wid, x1: x + wid, z0: z - len, z1: z + len });
  }


  // ---------------------------------------------------------------------------
  // GROUND SURFACES
  // ---------------------------------------------------------------------------
  fl(270, 140, 1330, 900, pavingTex, 1.2, 0.8, 0.001);                    // lot paving
  fl(805, 900, 1330, 1095, pavingTex, 1.2, 0.8, 0.001);
  fl(440, 535, 1330, 900, concreteTex, 2.0, 0.85, 0.002);                // parking (16)
  fl(1055, 295, 1330, 535, concreteTex, 2.0, 0.85, 0.002);
  fl(805, 900, 1330, 1095, concreteTex, 2.0, 0.85, 0.002);
  fl(305, 705, 460, 815, concreteTex, 2.0, 0.85, 0.002);                 // vehicle access (04)
  fl(315, 295, 442, 705, porcelainTex, 0.9, 0.22, 0.003);                // lobby, entrance hall, portaria, service corridor, delivery
  fl(441, 491, 474, 618, porcelainTex, 0.9, 0.22, 0.003);                // espaço p/ minimercado (09)
  fl(440, 345, 1055, 495, porcelainTex, 0.9, 0.22, 0.003);               // rooms + hall + lobby 2
  fl(272, 142, 600, 292, grassTex, 3, 1, 0.004);                         // lounge externo (08) lawn
  fl(770, 142, 860, 345, grassTex, 3, 1, 0.004);                         // garden strip
  fl(600, 142, 770, 228, grassTex, 3, 1, 0.004);
  fl(530, 292, 600, 326, grassTex, 3, 1, 0.004);                         // lawn between the lounge and the pillar / deck wall (plan)                         // lawn beyond the spa deck (lounge externo continues to the north wall)
  fl(860, 150, 970, 292, grassTex, 3, 1, 0.004); fl(860, 292, 912, 318, grassTex, 3, 1, 0.004);   // pet place (12)
  fl(970, 150, 1060, 350, porcelainTex, 0.9, 0.3, 0.004);                // churrasqueira (13)

  // ---------------------------------------------------------------------------
  // LOT BOUNDARY – neighbour walls, Rua Platina hedge, praça planters
  // ---------------------------------------------------------------------------
  wl(270, 143, 1330, 149);                                                // north-west neighbour wall (plan: iy 145–149)
  wl(802, 903, 808, 1098);
  wl(805, 1095, 1330, 1101);
  wl(1330, 298, 1336, 1101);                                              // back wall of the garage (Rua Platina side)
  bx(1336.5, 300, 1362, 1040, 0, 1.1, hedge);                               // hedge along Rua Platina
  // praça planters: see LOUNGE EXTERNO block (premium planters per the plan)

  // ---------------------------------------------------------------------------
  // BUILDING – lobby (05) + portaria wing, room row, elevator core, lobby 2
  // ---------------------------------------------------------------------------
  // west façade on the praça: acesso social (01), portaria window, acesso serviço (03)
  const LH = 3.0 + H;                                                     // lobby: pé-direito duplo – rises through the 1º pavimento void (brochure p. 9)
                                                                          // to that floor's ceiling: one storey (3.0 m) + H = 5.6 m, same as pav1.js
  // measured on the plan (DOC-20260928-WA0007-8.jpg = 2.823 × these px): the lobby's west side steps in – tall glass at
  // ix 315–321 up to the garden wall (iy 347–354), then at ix 336–341 behind a stone planter; a low glass rail at ix 314
  // keeps the acesso social path (01) between it and the praça planter; the path turns in at iy 481–499 into an entrance
  // hall (eclusa) with a glazed partition to the lobby side and the portaria's armoured window on its south wall
  const glassLH = (a, b) => [{ from: a, to: b, sill: 0.15, top: LH - 0.15, glass: 'fixed' }];
  wl(315, 295, 321, 347, glassLH(300, 345), M.wall, LH);                  // upper west glazing (to the garden corner)
  wl(321, 295, 449, 300, glassLH(323, 411), M.wall, LH);                  // north glazing to the lounge (curved walnut wall beyond)
  wl(321, 347, 341, 354, [], M.wall, LH);                                 // lobby corner where the façade steps in
  wl(274, 347, 321, 354, [{ from: 278, to: 315, sill: 0.05, top: 2.2, glass: 'fixed' }], M.wall, 2.4);   // garden wall with a glass panel (outside)
  wl(336, 354, 341, 445, glassLH(356, 443), M.wall, LH);                  // lower west glazing, behind the stone planter
  bx(313.5, 354, 315.5, 481, 0, 1.05, M.glass, { cast: false }); bx(313.3, 354, 315.7, 481, 1.05, 1.1, P.brass, { collide: false });   // low glass rail along the path, bronze cap
  wl(320, 445, 370, 449, [], M.wall, LH);                                 // lobby | entrance hall (bench on the hall side)
  for (const b of [331, 377, 400, 422]) { const up = b < 347; bx(up ? 315 : 336, b - 0.7, up ? 321 : 341, b + 0.7, 0.15, LH - 0.15, frame, { collide: false, cast: false }); }   // black mullions
  for (let ix = 341; ix < 411; ix += 17.5) bx(ix - 0.7, 295, ix + 0.7, 300, 0.15, LH - 0.15, frame, { collide: false, cast: false });
  // west façade south of the lobby: entrance (01), portaria window, acesso serviço (03)
  wl(315, 449, 321, 519, [
    { from: 451, to: 480, sill: 0.15, top: LH - 0.15, glass: 'fixed' },  // glazed entrance hall – double height like the lobby
    { from: 481, to: 499, top: LH - 0.15, glass: 'open' },               // acesso social door (tall pivot door, see ENTRANCE) + glass transom over it
  ], M.wall, LH);
  bx(317.6, 481, 318.4, 499, 2.78, LH - 0.15, M.glass, { collide: false, cast: false });   // transom glass over the door
  for (const iy of [465, 480.5]) bx(314.9, iy - 0.7, 321.1, iy + 0.75, 0.15, LH - 0.15, frame, { collide: false, cast: false });   // black mullions (lobby style)
  bx(314.9, 498.75, 321.1, 500.25, 2.79, LH - 0.15, frame, { collide: false, cast: false });
  for (const y of [2.4, 3.3]) bx(315, 451, 321, 480, y - 0.04, y + 0.04, frame, { collide: false, cast: false });
  bx(314.95, 481, 321.05, 499, 2.74, 2.82, frame, { collide: false, cast: false }); bx(314.95, 481, 321.05, 499, 3.26, 3.34, frame, { collide: false, cast: false });
  wl(315, 519, 321, 701, [
    { from: 541, to: 604, sill: 0.9, top: 2.1, glass: 'window' },        // portaria window to the praça
    { from: 623, to: 658 },                                               // acesso serviço
  ]);
  wl(367, 449, 370, 519, [{ from: 450, to: 488, sill: 0.03, top: 2.5, glass: 'fixed' }, { from: 488, to: 512, top: 2.4, glass: 'open' }, { from: 512, to: 518.5, sill: 0.03, top: 2.5, glass: 'fixed' }], frame);   // glazed partition + door
  bx(324, 450, 363, 459, 0, 0.45, P.walnut);                              // wood bench in the entrance hall (plan)
  // ENTRANCE HALL (lobby → lifts) + corridor to the portaria: warm finishes only (no furniture, no plants) after the
  // interiors – walnut slat feature walls with an LED cove, plain white walls elsewhere, warm stone floor, warm downlights
  {
    const nc = { collide: false, cast: false }, walD = std({ color: '#4a3122', roughness: 0.6 });
    const warmLed = std({ color: '#fff3df', emissive: '#ffc98a', emissiveIntensity: 2.2 });
    const slats = (alongIx, k, sgn, p0, p1, y1 = H - 0.01) => {            // walnut slats on a wall face at k; sgn = room side
      const B = (a, c, t0, t1, ya, yb, m) => alongIx ? bx(a, Math.min(t0, t1), c, Math.max(t0, t1), ya, yb, m, nc) : bx(Math.min(t0, t1), a, Math.max(t0, t1), c, ya, yb, m, nc);
      B(p0, p1, k, k + sgn * 0.3, 0, y1, walD);
      for (let q = p0 + 0.5; q < p1 - 0.6; q += 2.0) B(q, q + 1.1, k + sgn * 0.3, k + sgn * 0.85, 0, y1 - 0.1, P.walnut);
      B(p0, p1, k + sgn * 0.3, k + sgn * 0.9, y1 - 0.1, y1 - 0.07, warmLed);
    };
    slats(true, 486.95, -1, 437.5, 481);                                   // minimercado wall facing the hall
    slats(false, 436.95, -1, 519, 587);                                    // minimercado west wall along the corridor to the portaria
    // DOUBLE-HEIGHT HALL: walls clad in the same walnut as the lobby column (flat panels, no LED strips)
    // – east wall (ix 437: over the lift-hall opening + minimercado corner) and south wall (iy 519)
    { const wal = P.walnut;
      bx(436.2, 449, 436.6, 519, H - 0.02, LH, wal, nc); bx(436.2, 486.2, 436.6, 519, 0, H, wal, nc);              // east wall
      bx(321, 518.6, 437, 519, H - 0.02, LH, wal, nc); bx(370, 518.6, 409, 519, 0, H, wal, nc);                  // south wall (above the portaria wall + in front of the portaria hall)
      bx(409, 518.6, 436.2, 519, H - 0.02, LH, wal, nc);
    }
    const warmStone = marble('#d8c8b2', '170,150,125', 0.05);                // seamless (no tile joints)
    fl(370, 449, 481, 487, warmStone, 1.6, 0.4, 0.0045); fl(409, 487, 437, 618, warmStone, 1.6, 0.4, 0.0045);
    for (const [a, b] of [[388, 468], [412, 468], [430, 468], [460, 468], [423, 510], [423, 550], [423, 590]]) {
      const [x, z] = W(a, b), y = a < 437 && b < 519 ? LH : H; mesh(ceilingGroup, new THREE.CircleGeometry(0.06, 20), warmLed, x, y - 0.006, z, Math.PI / 2, 0, 0, false); }
    { const l = new THREE.PointLight('#ffc98a', 1.6, 7, 2); const [x, z] = W(425, 470); l.position.set(x, LH - 0.4, z); world.add(l); }

    // entrance hall / eclusa (ix 321–367 × iy 449–519) and the hall in front of the portaria (ix 370–409 × iy 487–519):
    // walnut slat wall behind the bench; the other walls stay plain white
    slats(true, 449.05, 1, 321.5, 366.8, LH - 0.01);
    fl(321, 449, 367, 519, warmStone, 1.6, 0.4, 0.0045); fl(367, 487, 409, 519, warmStone, 1.6, 0.4, 0.0045);
    for (const [a, b] of [[334, 472], [354, 472], [334, 500], [354, 500], [389, 503]]) { const [x, z] = W(a, b); mesh(ceilingGroup, new THREE.CircleGeometry(0.06, 20), warmLed, x, LH - 0.006, z, Math.PI / 2, 0, 0, false); }
    { const l = new THREE.PointLight('#ffc98a', 1.6, 8, 2); const [x, z] = W(344, 486); l.position.set(x, LH - 0.4, z); world.add(l); }
  }
  // room row: coworking (07) | casa de campo (10) | pet care (11)
  wl(440, 343, 918, 349, [
    { from: 455, to: 562, sill: 0.15, top: H - 0.1, glass: 'fixed' },   // coworking glass wall to the garden
    { from: 601, to: 658, sill: 0.05, top: H - 0.12, glass: 'fixed' }, { from: 667, to: 752, top: H - 0.12, glass: 'open' }, { from: 772, to: 852, sill: 0.05, top: H - 0.12, glass: 'fixed' },   // casa de campo: glass | sliding door to the deck | glass (plan)
    { from: 878, to: 902, top: 2.4, glass: 'open' },                     // pet care → pet place (glass door, plan)
  ]);
  wl(568, 349, 572, 457); wl(858, 349, 862, 457); wl(913, 349, 917, 457, [{ from: 433, to: 453 }], M.wall, LH);   // pet care → lobby 2 (plan)
  wl(440, 455, 917, 459, [{ from: 495, to: 535 }, { from: 630, to: 659, glass: 'open', top: 2.4 }]);
  wl(438, 343, 443, 455, [{ from: 395, to: 440 }], M.wall, LH);         // lobby ↔ coworking door
  wl(438, 300, 443, 343, [], M.wall, LH);                                 // lobby east wall continues north to the façade (plan) – closes the patio side
  // lobby 2 (05, by the parking): churrasqueira door, parking door
  wl(917, 351, 1001, 357, [{ from: 921, to: 962, sill: 0.15, top: LH - 0.15, glass: 'fixed' }, { from: 964, to: 1000, top: 2.4, glass: 'open' }], M.wall, LH);   // tall glazing to the terrace
  wl(1001, 294, 1008, 351);                                               // terrace divider (churrasqueira path | lobby terrace)
  wl(1050, 295, 1056, 351);                                               // churrasqueira path | parking
  // WC block east of lobby 2 (plan: two WCs with a store between) + passage to the parking
  wl(1001, 351, 1007, 459, [{ from: 395, to: 418, top: 2.4 }], M.wall, LH);   // lobby 2 → WC vestibule (plan)
  wl(1007, 349, 1056, 353, [{ from: 1024, to: 1040 }]); wl(1007, 389, 1056, 393);   // upper WC: entered from the churrasqueira corridor (plan)
  wl(1007, 419, 1056, 423, [{ from: 1025, to: 1041 }]); wl(1007, 455, 1056, 459);   // lower WC: door from the corridor between the WCs, wall to the vestibule
  wl(1050, 353, 1056, 455);
  // south of the WCs (plan): a small vestibule open to lobby 2, then the garage entrance with a glass door from the lobby
  wl(1050, 459, 1056, 493);                                               // east wall of the WC block continues to the vestibule's south wall
  wl(1007, 489, 1056, 493);                                               // vestibule | garage entrance
  wl(1001, 459, 1007, 523, [{ from: 470, to: 487 }, { from: 497, to: 517, top: 2.4, glass: 'open' }]);   // lobby 2 → vestibule (open) + glass door to the garage
  wl(959, 519, 1007, 525);
  // elevator / stair core (15) along the hall
  for (const [a, c] of [[481, 627], [661, 819], [856, 959]]) bx(a, 487, c, 537, 0, H, M.wall);   // 3 lifts | stair | 2 lifts – open passages to the parking between (plan)
  // HALL DOS ELEVADORES – premium lift hall (corridorKit): travertine lift wall with bronze portals, fluted walnut and
  // limewash panels with art + sconces on the room side, LED coves, plain stone floor
  {
    const C = makeCorridor({ bx, fl, W, ppm: 18.33 }), S = 487, N = 459, clad = S - 0.025 * 18.33;
    C.floor(441, N, 1001, S);
    for (const [a, c] of [[481, 627], [661, 819], [856, 959]]) C.stone(a, c, S, 'S');
    C.lifts([501, 551, 601, 881, 929], clad, 'T');
    C.door(734, clad, 'S', 1.0, 'ESCADA');
    // room side (north wall, face iy 459): openings at 495–535 (coworking) and 630–659 (casa de campo)
    C.plaster(444, 493, N, 'N'); C.cove(444, 493, N + 0.018 * 18.33, 'N');
    C.slats(538, 627, N, 'N');
    C.plaster(662, 912, N, 'N'); C.cove(662, 912, N + 0.018 * 18.33, 'N');
    C.slats(672, 760, N, 'N');
    for (const ix of [772, 808, 862, 898]) C.sconce(ix, N, 'N');
   
    for (const ix of [530, 700, 900]) C.light(ix, 473, 0.8);
  }
  // portaria wing: portaria (02), espaço p/ minimercado (09), espaço delivery (06)
  wl(321, 519, 409, 526, [{ from: 342, to: 362, sill: 0.9, top: 2.1, glass: 'window' }]);   // portaria | entrance hall: armoured window
  wl(405, 526, 409, 622, [{ from: 600, to: 616 }]);                       // portaria door from the inner corridor
  wl(321, 618, 409, 622, [{ from: 326, to: 364, sill: 0.9, top: 2.1, glass: 'window' }]);   // portaria window over the service corridor
  wl(366, 526, 370, 562); wl(370, 558, 405, 562, [{ from: 380, to: 398 }]);   // portaria WC
  wl(437, 487, 482, 491);                                                 // minimercado (09): north wall runs into the lift core (plan: one wall, no gap)
  wl(437, 489, 441, 591);                                                // minimercado west wall (plan: solid; entrance is on the south) – overlaps the corner
  wl(437, 587, 474, 591, [{ from: 457, to: 473, top: 2.3, glass: 'open' }]);   // minimercado south wall + glass door from the service corridor
  wl(474, 491, 481.5, 622);                                               // minimercado east wall, flush against the lift core
  wl(437, 618, 480, 622);
  wl(370, 655, 437, 660, [{ from: 417, to: 436 }]);                       // espaço delivery (06)
  wl(367, 660, 371, 701);
  wl(437, 622, 442, 701, [{ from: 625, to: 655 }]);                       // service corridor → parking
  wl(315, 701, 442, 707);                                                 // façade to the vehicle access (04)
  // PRAÇA FAÇADE (façade renders): a white double-height portal frames the lobby + entrance, a wood-slat band runs
  // under its beam, dark glass over the portaria wing (1º pavimento); stone planter with tropical plants in front of the lower
  // lobby glazing; beside the wide white pier, the slatted grey vehicle gate under a tall wood-clad podium block
  const slatTexF = (base, a, b) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? a : b; g.fillRect(x + 3, 0, 10, h); } });
  const slatMat = (t, rx, ry) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); return std({ map: c, roughness: 0.75 }); };
  const woodSlat = slatTexF('#5d4532', '#b0865c', '#9c7550'), greySlat = slatTexF('#4a4d50', '#8d9195', '#7f8387');
  // south edge of the building (plan): finished façade up to the podium slab (no gap), slat band + base;
  // the pedestrian patio corner (ix 270–343) is closed by a low wall with a black bar gate
  bx(343, 897, 808, 903, 0, H + 0.3, M.wall);
  bx(343, 903, 808, 903.6, 0, 0.35, std({ color: '#6f6a63', roughness: 0.8 }), { collide: false });          // dark stone base
  bx(343, 903, 808, 903.8, H - 0.6, H + 0.3, slatMat(woodSlat, 40, 1), { collide: false });                    // wood-slat band under the podium
  bx(270, 897, 343, 903, 0, 2.4, M.wall);                                                                    // boundary wall at the patio corner
  // west side of the patio below the tree (plan): solid white wall from the tree planter to the boundary
  bx(268, 883, 276, 897, 0, 2.4, M.wall);                                                                      // wall below the tree
  // pedestrian entrance beside the tree (green): open doorway with a black frame and lintel
  { const fm = std({ color: '#1e1f21', roughness: 0.45, metalness: 0.5 });
    bx(268, 866, 276, 883, 2.2, 2.4, M.wall, { collide: false });
    bx(267.6, 866, 276.4, 867, 0, 2.2, fm, { collide: false }); bx(267.6, 882, 276.4, 883, 0, 2.2, fm, { collide: false });
    bx(267.6, 866, 276.4, 883, 2.15, 2.2, fm, { collide: false }); }
  bx(270, 816, 343, 820, 0, H, M.wall);                                                                        // patio | forecourt: wall from the utility block to the tree (plan)
  bx(268, 820, 272, 866, 0, H, M.wall);                                                                        // behind the tree planter, joins the wall below the tree
  bx(296, 889, 340, 893, 0, 0.45, M.wall); bx(295.6, 888.6, 340.4, 893.4, 0.45, 0.5, P.walnut);               // seat wall (plan white line)
  // STREET FRONT after the façade elevation (Image 5): a thick white portal (wide north leg, slimmer pier by the garage,
  // deep beam topped by the 2º pavimento balcony railing); inside it a continuous band of fine vertical wood slats under
  // the beam; below it, left → right: double-height black-grid glass (lobby + entrance), a full-height wood-slat panel
  // with a recessed horizontal window (portaria) behind a low gabion wall, a dark grey panel over a glazed storefront
  // (acesso serviço). Every slat is real geometry (one InstancedMesh per panel).
  const PB = 5.2, PT = 6.15, BAND = 4.1;                                  // beam underside / top, bottom of the wood band
  const portalW = std({ color: '#f4f2ee', roughness: 0.6 }), woodF = std({ color: '#c08a55', roughness: 0.6 });
  const woodBack = std({ color: '#6e4b2e', roughness: 0.9 }), darkG = std({ color: '#6a6d71', roughness: 0.7 }), railM = std({ color: '#3a3d40', roughness: 0.45, metalness: 0.5 });
  const m4s = new THREE.Matrix4();
  // vertical slats on a plane parallel to the façade (image ix = ixF), from iy0 to iy1, between y0 and y1
  const slats = (ixF, iy0, iy1, y0, y1, pitch, w, d, mat, skip) => {
    const [xa, z] = W(ixF, iy0), [xb] = W(ixF, iy1), n = Math.floor(Math.abs(xb - xa) / pitch), sg = Math.sign(xb - xa), list = [];
    for (let i = 0; i < n; i++) { const x = xa + sg * (i + 0.5) * pitch; for (const [ya, yb] of skip ? skip(iy0 + (iy1 - iy0) * (i + 0.5) / n) : [[y0, y1]]) list.push([x, ya, yb]); }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(w, 1, d), mat, list.length);
    list.forEach(([x, ya, yb], i) => { m4s.makeScale(1, yb - ya, 1).setPosition(x, (ya + yb) / 2, z); im.setMatrixAt(i, m4s); });
    im.castShadow = im.receiveShadow = true; world.add(im); return im;
  };
  const barRail = (ixF, iy0, iy1, y0, h = 1.1) => {                       // grey vertical-bar balcony railing
    slats(ixF, iy0, iy1, y0, y0 + h, 0.12, 0.025, 0.025, railM);
    bx(ixF - 0.4, iy0, ixF + 0.4, iy1, y0 + h, y0 + h + 0.05, railM, { collide: false }); bx(ixF - 0.3, iy0, ixF + 0.3, iy1, y0 + 0.08, y0 + 0.12, railM, { collide: false });
  };
  // portal
  bx(296, 270, 315, 300, 0, PT, portalW);                                 // wide north leg
  bx(296, 688, 315, 707, 0, PT, portalW);                                 // pier by the garage
  bx(296, 270, 315, 707, PB, PT, portalW, { collide: false });            // beam
  barRail(297, 270, 707, PT);                                             // 2º pavimento balcony railing on top of the beam
  { const ledM = std({ color: '#fff6e6', emissive: '#ffd9a0', emissiveIntensity: 2.2 });
    for (let iy = 318; iy < 680; iy += 36) { const [x, z] = W(300, iy); mesh(world, new THREE.CircleGeometry(0.05, 16), ledM, x, PB - 0.002, z, Math.PI / 2, 0, 0, false); } }
  // wood band under the beam (fine slats on a dark backing)
  bx(304.4, 300, 305, 688, BAND, PB, woodBack, { collide: false });
  slats(304, 300, 688, BAND, PB, 0.065, 0.048, 0.04, woodF);
  // left: double-height glass - black grid on the lobby glazing, dark spandrel glass with the same grid over the entrance
  for (const y of [2.4, 3.3]) { bx(315, 300, 321, 345, y - 0.04, y + 0.04, frame, { collide: false, cast: false }); bx(336, 356, 341, 443, y - 0.04, y + 0.04, frame, { collide: false, cast: false }); }
  // centre: full-height wood panel with the recessed portaria window, gabion wall in front
  bx(304.6, 500, 315, 541, 0, BAND, woodBack); bx(304.6, 604, 315, 623, 0, BAND, woodBack);
  bx(304.6, 541, 315, 604, 0, 0.9, woodBack); bx(304.6, 541, 315, 604, 2.1, BAND, woodBack);
  slats(304, 500, 623, 0, BAND, 0.065, 0.048, 0.04, woodF, iy => iy > 541 && iy < 604 ? [[0, 0.9], [2.1, BAND]] : [[0, BAND]]);
  for (const [a, b2, c, d, y0, y1] of [[304.2, 540.4, 315, 541.2, 0.9, 2.1], [304.2, 603.8, 315, 604.6, 0.9, 2.1], [304.2, 541, 315, 604, 2.06, 2.1], [304.2, 541, 315, 604, 0.9, 0.94]]) bx(a, b2, c, d, y0, y1, frame, { collide: false });
  { const gabT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#5e5448'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { const t = 0.8 + Math.random() * 0.3; g.fillStyle = 'rgb(' + (222 * t | 0) + ',' + (200 * t | 0) + ',' + (165 * t | 0) + ')'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 8, 4 + Math.random() * 5, Math.random() * 3, 0, 7); g.fill(); } });
    gabT.wrapS = gabT.wrapT = THREE.RepeatWrapping; gabT.repeat.set(5, 1);
    bx(297.5, 503, 304, 598, 0, 1.2, std({ map: gabT, roughness: 0.95 })); }
  // right: dark grey panel over a black-framed glass storefront with the service door
  bx(304.4, 623, 305, 688, 2.75, BAND, darkG, { collide: false });
  bx(304.6, 623, 305, 628, 0.05, 2.75, M.glass, { cast: false }); bx(304.6, 654, 305, 688, 0.05, 2.75, M.glass, { cast: false });
  for (const iy of [623.5, 628, 654, 671, 687.5]) bx(304.4, iy - 0.5, 305.2, iy + 0.5, 0, 2.75, frame, { collide: false, cast: false });
  bx(304.4, 623, 305.2, 688, 2.7, 2.78, frame, { collide: false, cast: false }); bx(304.4, 654, 305.2, 688, 0, 0.06, frame, { collide: false, cast: false });
  { const stoneT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#7d7466'; g.fillRect(0, 0, w, h); for (let i = 0; i < 170; i++) { const t = 0.75 + Math.random() * 0.4; g.fillStyle = 'rgb(' + (214 * t | 0) + ',' + (204 * t | 0) + ',' + (186 * t | 0) + ')'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 7 + Math.random() * 10, 4 + Math.random() * 6, Math.random(), 0, 7); g.fill(); } });
    stoneT.wrapS = stoneT.wrapT = THREE.RepeatWrapping; stoneT.repeat.set(4, 1);
    bx(316, 357, 335, 438, 0, 0.8, std({ map: stoneT, roughness: 0.95 }));                 // stone (gabion) planter
    bx(317, 358, 334, 437, 0.8, 0.82, P.soil, { collide: false, cast: false });
    for (let iy = 364; iy < 434; iy += 12) { const t = tropicalB(0.85); const [x, z] = W(325.5, iy); t.position.set(x, 0.8, z); t.rotation.y = iy; world.add(t); }
    // (no palm trees in the planter – removed on request)
  }
  // ---------------------------------------------------------------------------
  // ACESSO SOCIAL (01) – premium condo entrance on the plan's axis: from the praça sidewalk through the gap between the
  // two raised planters (iy 482–525), across the path to the door (iy 481–499). Travertine walk, a tall bronze-framed
  // glass pivot door, a travertine feature wall with uplights, bronze bollards at the planter gap, a dark entry mat.
  // ---------------------------------------------------------------------------
  {
    const trav = marble('#e3d6c2', '190,172,148', 0.05, '#d6c7b0'), travM = std({ map: trav, roughness: 0.55 });
    const bronze = std({ color: '#8a6a45', metalness: 0.9, roughness: 0.32 }), warmLed = std({ color: '#fff3df', emissive: '#ffc98a', emissiveIntensity: 2.4 });
    fl(232, 482, 315, 525, trav, 1.2, 0.45, 0.008);                                   // travertine approach (sidewalk → door)
    fl(294, 354, 315, 700, trav, 1.2, 0.45, 0.0075);                                  // and the path along the façade
    bx(305.5, 482.5, 314.6, 497.5, 0.008, 0.016, std({ color: '#2a2622', roughness: 0.95 }), { collide: false, cast: false });   // entry mat
    // door: bronze surround, glass pivot leaf standing open into the hall, long bronze pull
    bx(314.4, 480, 315, 481.2, 0, 2.78, bronze, { collide: false }); bx(314.4, 498.8, 315, 500, 0, 2.78, bronze, { collide: false });
    bx(314.4, 480, 315, 500, 2.7, 2.78, bronze, { collide: false });
    { const leaf = new THREE.Group(), Lw = 17.4 * 5 / 91.65;                            // leaf width in m (image px → m)
      const glassL = std({ color: '#b8c8cc', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.32 });
      mesh(leaf, new THREE.BoxGeometry(Lw, 2.62, 0.02), glassL, -Lw / 2, 1.33, 0);
      for (const [w, h, x, y] of [[Lw, 0.05, -Lw / 2, 0.025], [Lw, 0.05, -Lw / 2, 2.615], [0.05, 2.64, -0.025, 1.32], [0.05, 2.64, -Lw + 0.025, 1.32]]) mesh(leaf, new THREE.BoxGeometry(w, h, 0.045), bronze, x, y, 0);
      mesh(leaf, new THREE.CylinderGeometry(0.018, 0.018, 1.4, 12), bronze, -Lw + 0.12, 1.1, 0.09);
      for (const y of [0.45, 1.75]) mesh(leaf, new THREE.BoxGeometry(0.02, 0.02, 0.09), bronze, -Lw + 0.12, y, 0.045);
      const [x, z] = W(318, 481.6); leaf.position.set(x, 0.005, z); leaf.rotation.y = 1.25; world.add(leaf); }
    // travertine feature wall (outer face of the façade beside the door) + halo-lit bronze lettering + uplights
    bx(314.3, 449, 315, 451, 0, 2.9, travM, { collide: false });
    for (const iy of [] /* façade uplights: replaced by the wood panel */) { const [x, z] = W(313.2, iy); cylinder(world, 0.04, 0.04, 0.02, warmLed, x, 0.008, z, 16);
      if (iy < 600) { const sp = new THREE.SpotLight('#ffc98a', 1.6, 3.2, 0.5, 0.6, 2); sp.position.set(x, 0.05, z); sp.target.position.set(x, 2.6, z + 0.001); world.add(sp, sp.target); } }
    // bronze bollard lights at the planter gap
    for (const iy of [485, 522]) { const [x, z] = W(292.5, iy); cylinder(world, 0.07, 0.07, 0.62, bronze, x, 0, z, 20); cylinder(world, 0.06, 0.06, 0.06, warmLed, x, 0.5, z, 20); }
  }
  // GARAGE VOLUME (Image 5): tall block clad in warm vertical slats over the vehicle opening (dark grey frame), a grey
  // cantilevered slab with a bar railing on top (2º pavimento terrace), and a grey slatted screen on the low patio volume
  bx(304.6, 707, 305.2, 900, H, 7.2, woodBack, { collide: false });
  slats(304, 707, 900, H, 7.2, 0.09, 0.065, 0.06, woodF);
  bx(299, 707, 312, 900, 7.2, 7.5, darkG, { collide: false }); barRail(299.5, 707, 900, 7.5);
  bx(302.5, 707, 305.5, 816, H - 0.35, H, darkG, { collide: false }); bx(302.5, 811, 305.5, 816, 0, H, darkG);
  // vehicle gate in that frame, right under the wood block: grey vertical bars on a dark top/bottom rail (Image 5)
  { const gateM = std({ color: '#7e8286', roughness: 0.55, metalness: 0.4 });
    slats(303.6, 707, 811, 0.08, H - 0.4, 0.075, 0.035, 0.05, gateM);
    bx(303.2, 707, 304, 811, 0.02, 0.1, darkG, { collide: false }); bx(303.2, 707, 304, 811, H - 0.45, H - 0.35, darkG, { collide: false });
    const [x0, z0] = W(303, 707), [x1, z1] = W(304.2, 811);
    colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); }
  { const greyS = std({ color: '#7e8286', roughness: 0.6, metalness: 0.3 });
    slats(266.6, 818, 866, 0, 2.6, 0.09, 0.04, 0.06, greyS); slats(266.6, 883, 899, 0, 2.6, 0.09, 0.04, 0.06, greyS);
    bx(265.8, 818, 268, 899, 2.6, 2.7, darkG, { collide: false }); }
  // VEHICLE ACCESS (04) + south corner (plan): dark paver driveway from the street to the slatted gate, a rounded sidewalk
  // corner, a tree planter, a tiled pedestrian patio and two utility rooms (white tile) entered from the south passage.
  {
    const paverT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3e3f42'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const t = 0.85 + Math.random() * 0.25; g.fillStyle = `rgb(${66 * t | 0},${67 * t | 0},${70 * t | 0})`; g.fillRect(c * 64 + (r % 2) * 32 + 1, r * 32 + 1, 62, 30); } });
    fl(176, 707, 306, 816, paverT, 1.0, 0.85, 0.006);                        // driveway (04)
    bx(176, 707, 306, 708.5, 0, 0.03, std({ color: '#d8d4cc', roughness: 0.8 }), { collide: false });   // curb line at the planter side
    fl(176, 816, 270, 900, pavingTex, 1.2, 0.8, 0.006);                      // sidewalk corner
    { const [x, z] = W(222, 860), r = 42 / 18.33 * K / 5;                    // rounded curb at the corner (plan)
      const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.96, r, 40, 1, Math.PI / 2, Math.PI / 2), std({ color: '#e2ddd3', roughness: 0.8 }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.012, z); world.add(ring); }
    fl(270, 818, 343, 897, marble('#dacbc0', '170,150,135', 0.08, '#cdbcaf'), 1.0, 0.5, 0.006);   // tiled pedestrian patio
    // utility rooms (lixo / medidores): hollow, white tile, doors from the south passage
    fl(347, 820, 399, 863, porcelainTex, 0.6, 0.3, 0.006); fl(378, 863, 399, 873, porcelainTex, 0.6, 0.3, 0.006); fl(403, 820, 454, 873, porcelainTex, 0.6, 0.3, 0.006);
    wl(343, 816, 347, 867); wl(347, 816, 462, 820); wl(399, 820, 403, 873); wl(458, 820, 462, 877);
    wl(347, 863, 378, 867); wl(374, 867, 378, 877);                                // notch at the SW corner (plan)
    wl(378, 873, 458, 877, [{ from: 379, to: 397 }, { from: 404, to: 424 }]);
    for (const a of [379.3, 404.3]) bx(a, 858, a + 0.6, 876.5, 0, 2.1, P.lacquer, { collide: false });   // doors swung open into the rooms
    ceil(305, 705, 482, 897);                                                      // podium slab over the forecourt, rooms and the walk
    // façade to 04 continues to the garage door; the GARAGE DOOR is on the east side of the forecourt (plan, yellow)
    wl(442, 701, 462, 707);
    bx(458, 707, 462, 709, 0, H, M.wall); bx(458, 814, 462, 816, 0, H, M.wall);   // jambs of the inner garage opening (gate moved to the façade)
  }
  // ramp enclosure in the parking wing
  wl(925, 815, 932, 972); wl(932, 965, 1115, 972);
  // churrasqueira pavilion (13) side wall to the quadra
  wl(1059, 148, 1064, 295, [{ from: 201, to: 246, sill: 0.5, top: 2.75, glass: 'fixed' }, { from: 248, to: 286, top: 2.4, glass: 'open' }, { from: 288, to: 293.5, sill: 0.5, top: 2.75, glass: 'fixed' }], M.wall, 3.0);   // churrasqueira | quadra: solid, then glass (plan)
  // parking | quadra
  wl(1055, 292, 1333, 298);

  // ceilings (covered areas – the podium floors are above)
  ceil(315, 295, 443, 449, LH);                                           // double-height lobby: the 1º pavimento ceiling (over the void)
  ceil(315, 449, 437, 519, LH); ceil(437, 449, 482, 519); ceil(315, 519, 482, 705); ceil(440, 295, 482, 343);   // wing (entrance hall: double height)
  bx(321, 519, 437, 526, H, LH, M.wall, { collide: false });             // walls closing the double-height hall above the ceiling line
  bx(436.6, 449, 437.6, 519, H, LH, M.wall, { collide: false });         // bulkhead over the lift-hall opening / minimercado wall
  ceil(440, 343, 915, 537); ceil(915, 457, 1055, 537); ceil(1003, 343, 1055, 457);   // slab edges end inside the lobby 2 walls (no z-fighting)
  ceil(917, 343, 1001, 459, LH);                                          // lobby 2: double height like the main lobby
  ceil(482, 537, 1330, 900); ceil(1055, 295, 1330, 537); ceil(805, 900, 1330, 1095);   // parking
  ceil(972, 143, 1064, 295, 3.0);                                         // churrasqueira (covered)
  // parking columns / blade walls (plan positions)
  for (const [a, b, c, d] of [[532, 634, 538, 666], [584, 634, 590, 666], [757, 634, 763, 666], [855, 634, 861, 666], [908, 638, 913, 666],
    [1003, 535, 1008, 570], [1003, 627, 1008, 705], [657, 535, 669, 592], [533, 822, 538, 838], [667, 822, 672, 838], [1018, 829, 1023, 847], [1110, 829, 1115, 845],
    [1106, 346, 1128, 351], [1106, 443, 1128, 448], [1106, 523, 1128, 528], [1106, 619, 1142, 624], [1121, 703, 1146, 707],
    [1252, 428, 1262, 431], [1252, 565, 1262, 568], [1252, 701, 1262, 704], [1252, 835, 1262, 838], [1252, 971, 1262, 974]])
    bx(a, b, c, d, 0, H, M.wall);

  // ---------------------------------------------------------------------------
  // LOBBY (05) – double-height feel: curved walnut wall, round jute rug, bouclé armchairs,
  // terracotta sofa, low round tables, big plants in terracotta pots (render p. 13)
  // ---------------------------------------------------------------------------
  const look = (ix, iy, tx, ty) => Math.atan2(-(ty - iy), tx - ix);           // rotation turning a front (+z) towards an image point
  const K2wood = () => std({ color: '#b58a5a', roughness: 0.55 });
  const putI = (g, ix, iy, rot = 0, y = 0, parent = world) => { const [x, z] = W(ix, iy); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g); return g; };
  const solidI = (a, b, c, d) => { const [x0, z0] = W(a, b), [x1, z1] = W(c, d); colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); };
  { // curved walnut corner (R ≈ 1.2 m) wrapping from the lounge glazing into the coworking wall, reveals + LED.
    // SOLID fillet (not a thin double-sided sheet): it starts exactly where the north glass ends (ix 412), so it
    // covers the white pillar, and ends tangent to the straight walnut wall face (ix 434) – no gap behind it, so no
    // ambient-occlusion / shadow streaks from the hidden corner.
    const RI = 23.5, cx = 434 - RI, cy = 300 + RI, hW = LH - 0.15, [ox, oz] = W(cx, cy), Rw = RI / 18.33;
    const toS = ([x, z]) => new THREE.Vector2(x, -z), s = new THREE.Shape();
    s.moveTo(...toS(W(cx, 300)).toArray()); s.lineTo(...toS(W(434, 300)).toArray()); s.lineTo(...toS(W(434, cy)).toArray());
    for (let i = 1; i <= 32; i++) { const f = (i / 32) * Math.PI / 2; s.lineTo(...toS([ox + Rw * Math.sin(f), oz + Rw * Math.cos(f)]).toArray()); }
    const wm = P.walnut.clone(); wm.map = P.walnut.map.clone(); wm.map.needsUpdate = true; wm.map.wrapS = wm.map.wrapT = THREE.RepeatWrapping; wm.map.repeat.set(0.6, 1 / hW);
    if (P.walnut.bumpMap) { wm.bumpMap = P.walnut.bumpMap.clone(); wm.bumpMap.needsUpdate = true; wm.bumpMap.wrapS = wm.bumpMap.wrapT = THREE.RepeatWrapping; wm.bumpMap.repeat.copy(wm.map.repeat); }
    mesh(world, new THREE.ExtrudeGeometry(s, { depth: hW, bevelEnabled: false, curveSegments: 1 }), wm, 0, 0, 0, -Math.PI / 2);
    solidI(cx, 300, 434, cy);
    for (let i = 1; i < 8; i++) {                                         // vertical reveals on the curve
      const f = (i / 8) * Math.PI / 2;
      mesh(world, new THREE.BoxGeometry(0.008, hW, 0.01), P.taupeDark, ox + (Rw - 0.004) * Math.sin(f), hW / 2, oz + (Rw - 0.004) * Math.cos(f), 0, f, 0, false);
    }
    for (const [a, b] of [[cy, 395], [440, 455]]) bx(434, a, 438, b, 0, hW, P.walnut, { collide: false });
    for (let iy = 338; iy < 395; iy += 7) bx(433.7, iy, 434, iy + 0.4, 0, LH - 0.15, P.taupeDark, { collide: false, cast: false });
    bx(433.4, 446, 434, 447.5, 0, LH - 0.15, P.cove, { collide: false, cast: false });                  // vertical LED reveal (render)
    const sc = new THREE.Group(); mesh(sc, new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI), P.shade, 0, 0, 0); putI(sc, 433.6, 372, -Math.PI / 2, 2.3);   // alabaster half-dome sconce
  }
  { const g = new THREE.Group(); mesh(g, new THREE.CircleGeometry(2.3, 64), P.jute, 0, 0.018, 0, -Math.PI / 2, 0, 0, false); putI(g, 385, 350); }   // round jute rug (plan)
  putI(curvedLoungeSofaB(1.9, 1.7), 411, 326, look(411, 326, 385, 350)); solidI(396, 304, 432, 350);   // one continuous curved sofa hugging the rug (plan / render)
  for (const [a, b] of [[357, 330], [357, 372], [417, 376]]) { putI(boucleTubChairB(), a, b, look(a, b, 385, 350)); solidI(a - 8, b - 8, a + 8, b + 8); }
  putI(organicTableB(), 388, 350, 0.4);
  // render p. 13: warm stone floor, transoms on the double-height glazing, ficus trees + monstera in dark pots by the glass,
  // lit garden with bougainvillea outside, little wood side tables, warm light
  fl(318, 298, 438, 455, marble('#e6dccb', '170,150,120', 0.12, '#d6cab6'), 1.2, 0.3, 0.005);
  for (const y of [1.9, 3.75]) {                                          // two transoms: three tiers of glazing (render)
    bx(315, 300, 321, 347, y - 0.04, y + 0.04, M.frame, { collide: false }); bx(336, 356, 341, 443, y - 0.04, y + 0.04, M.frame, { collide: false }); bx(321, 295, 411, 300, y - 0.04, y + 0.04, M.frame, { collide: false }); }
  // plants stand clear of the glazing (≥ 1 m – canopies used to poke through the glass) and off the walkways
  for (const [a, b, h] of [[336, 313, 2.9], [352, 436, 2.5]]) { putI(ficusTreeB(h), a, b, Math.random() * 6); solidI(a - 6, b - 6, a + 6, b + 6); }   // ficus in tall pots by the glass + against the hall wall (plan); the lobby's opening to the hall stays clear
  for (const [a, b, s2] of [[333, 341, 0.9], [327, 330, 0.7]]) { putI(monsteraPotB(s2), a, b, Math.random() * 6); solidI(a - 5, b - 5, a + 5, b + 5); }   // monstera by the glazing (render)
  // outside: the praça walkway along the west glazing stays clear (entrance path, plan) – only the lounge side gets planting
  { const g = new THREE.Group(); cylinder(g, 0.2, 0.2, 0.5, K2wood(), 0, 0, 0, 24); putI(g, 350, 352); }
  { const g = new THREE.Group(); cylinder(g, 0.13, 0.13, 0.6, K2wood(), 0, 0, 0, 20); mesh(g, new THREE.SphereGeometry(0.08, 16, 10), P.shade, 0, 0.7, 0); putI(g, 372, 316); }
  { const g = new THREE.Group(); cylinder(g, 0.18, 0.22, 0.55, K2wood(), 0, 0, 0, 24); putI(g, 432, 376); }
  for (const [a, b] of [[360, 340], [385, 400], [410, 440]]) { const l = addLight(new THREE.PointLight('#ffd7a0', 4, 10, 2)); const [x, z] = W(a, b); l.position.set(x, LH - 0.9, z); world.add(l); }
  // ---------------------------------------------------------------------------
  // PORTARIA (02) "com caixilhos, vidro e porta blindados" – no render in the brochure, so it is designed in the
  // house style of the lobby / coworking: walnut + fluted walnut, stone tops, black frames, brass, warm light.
  // Plan: room ix 321–405 × iy 526–618; armoured window to the entrance hall (north), glazing to the praça
  // (west), service window to the corridor (south), door on the east wall, WC in the north-east corner.
  // L-shaped security desk in the south-west corner: the operator faces the praça and the corridor windows,
  // with a 2×2 CCTV array in the corner; fluted walnut credenza with coffee point + key cabinet on the east wall.
  // ---------------------------------------------------------------------------
  {
    const blackM = std({ color: '#1c1d1f', roughness: 0.5, metalness: 0.3 }), seatM = fabric('#2b2c2e', 1.2), brass = P.goldM ?? std({ color: '#c9a14a', metalness: 1, roughness: 0.25 });
    const camTex = canvasTex(512, 288, (g, w, h) => {                       // four CCTV feeds
      for (let q = 0; q < 4; q++) {
        const x0 = (q % 2) * w / 2, y0 = Math.floor(q / 2) * h / 2, gr = g.createLinearGradient(x0, y0, x0, y0 + h / 2);
        gr.addColorStop(0, ['#6b7680', '#5d6a63', '#77746c', '#596270'][q]); gr.addColorStop(1, ['#2f3438', '#2c332e', '#3a3832', '#2a2f36'][q]);
        g.fillStyle = gr; g.fillRect(x0, y0, w / 2, h / 2);
        g.strokeStyle = 'rgba(220,225,230,0.35)'; g.lineWidth = 2; g.beginPath();
        g.moveTo(x0 + 20, y0 + h / 2 - 10); g.lineTo(x0 + w / 4 - 20, y0 + h / 4); g.lineTo(x0 + w / 4 + 20, y0 + h / 4); g.lineTo(x0 + w / 2 - 20, y0 + h / 2 - 10); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '11px monospace'; g.fillText('CAM 0' + (q + 1) + '  11/11/2026', x0 + 8, y0 + 16);
      }
      g.fillStyle = '#000'; g.fillRect(w / 2 - 1, 0, 2, h); g.fillRect(0, h / 2 - 1, w, 2);
    });
    const camMat = std({ map: camTex, emissive: '#ffffff', emissiveMap: camTex, emissiveIntensity: 0.6, roughness: 0.35 });
    function screenB(w, h) {                                                  // thin-bezel screen, bottom-centred, front +z
      const g = new THREE.Group(); rb(g, w, h, 0.03, blackM, 0, 0, 0, 0.006);
      mesh(g, new THREE.PlaneGeometry(w - 0.02, h - 0.02), camMat, 0, h / 2, 0.0155, 0, 0, 0, false); return g;
    }
    function cctvB() {                                                        // 2×2 video wall on a black pole (on the desk corner)
      const g = new THREE.Group();
      cylinder(g, 0.025, 0.025, 1.0, blackM, 0, 0.76, -0.08, 16);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const s = screenB(0.56, 0.33); s.position.set((c - 0.5) * 0.575, 0.9 + r * 0.345, 0); s.rotation.y = (0.5 - c) * 0.18; g.add(s); }
      return g;
    }
    function monitorB() {                                                     // desktop monitor on a stand
      const g = new THREE.Group(), s = screenB(0.6, 0.35); s.position.y = 0.12; g.add(s);
      rb(g, 0.05, 0.16, 0.03, blackM, 0, 0, -0.03, 0.006); rb(g, 0.22, 0.012, 0.16, blackM, 0, 0, -0.02, 0.004);
      return g;
    }
    function taskChairB() {                                                   // black ergonomic chair, 5-star base on castors, front +z
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const sp = rb(g, 0.04, 0.03, 0.3, blackM, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15, 0.01); sp.rotation.y = a; mesh(g, new THREE.SphereGeometry(0.03, 10, 8), blackM, Math.sin(a) * 0.3, 0.03, Math.cos(a) * 0.3); }
      cylinder(g, 0.025, 0.025, 0.32, M.steel, 0, 0.08, 0, 12);
      rb(g, 0.5, 0.09, 0.48, seatM, 0, 0.4, 0.02, 0.04);
      mesh(g, RBG(0.46, 0.55, 0.06, 0.05), seatM, 0, 0.83, -0.25, -0.12);
      rb(g, 0.06, 0.2, 0.05, blackM, 0, 0.42, -0.25, 0.01);
      for (const sx of [-1, 1]) { rb(g, 0.03, 0.2, 0.03, blackM, sx * 0.25, 0.45, -0.02, 0.008); rb(g, 0.07, 0.025, 0.24, blackM, sx * 0.25, 0.65, 0.0, 0.01); }
      return g;
    }
    const flutes = (p0, p1, face, alongIx, y0, y1) => {                      // vertical walnut flutes on a cabinet face (image px)
      const [xa, za] = alongIx ? W(p0, face) : W(face, p0), [xb, zb] = alongIx ? W(p1, face) : W(face, p1);
      const L = Math.hypot(xb - xa, zb - za), n = Math.floor(L / 0.03), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.013, 0.013, y1 - y0, 10), P.walnut, n), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; m4.makeTranslation(xa + (xb - xa) * t, (y0 + y1) / 2, za + (zb - za) * t); im.setMatrixAt(i, m4); }
      im.castShadow = im.receiveShadow = true; world.add(im);
    };

    // L-desk: stone top on a walnut apron, LED under the room-side edge, fluted walnut drawer pedestals
    const top = 0.76;
    for (const [a, b, c, d] of [[322, 605, 368, 617.5], [321.5, 556, 334, 605]]) {
      bx(a, b, c, d, top - 0.04, top, P.quartz);
      bx(a, b, c, d, top - 0.14, top - 0.04, P.walnut, { collide: false });
    }
    bx(334, 604.6, 367, 605, top - 0.15, top - 0.14, P.led, { collide: false, cast: false });
    bx(334, 557, 334.4, 604.6, top - 0.15, top - 0.14, P.led, { collide: false, cast: false });
    for (const [a, b, c, d] of [[322, 605, 334, 617.5], [356, 605.5, 368, 617.5], [321.5, 556, 333.5, 568]]) {
      bx(a, b, c, d, 0.06, top - 0.14, P.walnut); bx(a + 0.6, b + 0.6, c - 0.6, d - 0.6, 0, 0.06, blackM, { collide: false });
    }
    flutes(356, 368, 605.3, true, 0.08, top - 0.16); flutes(322, 334, 604.8, true, 0.08, top - 0.16);
    flutes(605, 617.5, 334.2, false, 0.08, top - 0.16); flutes(556, 568, 333.7, false, 0.08, top - 0.16);
    // equipment: CCTV wall in the corner, monitor + keyboard on each run, phone, radio, brass lamp, notepad
    putI(cctvB(), 328.5, 611, look(328.5, 611, 348, 590));
    putI(monitorB(), 350, 613, look(350, 613, 350, 595), top); putI(monitorB(), 327, 588, look(327, 588, 345, 588), top);
    for (const [a, b, r] of [[350, 608.5, 0], [330.5, 588, Math.PI / 2]]) {
      const kb = new THREE.Group(); rb(kb, 0.44, 0.018, 0.14, blackM, 0, 0, 0, 0.005); rb(kb, 0.06, 0.02, 0.1, blackM, 0.32, 0, 0.01, 0.02); putI(kb, a, b, r, top);
    }
    { const ph = new THREE.Group(); rb(ph, 0.2, 0.05, 0.18, blackM, 0, 0, 0, 0.02); rb(ph, 0.2, 0.04, 0.05, blackM, 0, 0.05, -0.04, 0.02); putI(ph, 362, 609, 0.3, top); }
    { const rd = new THREE.Group(); rb(rd, 0.06, 0.13, 0.04, blackM, 0, 0, 0, 0.01); cylinder(rd, 0.006, 0.006, 0.09, blackM, 0.018, 0.13, 0, 8); putI(rd, 326, 575, 0.4, top); }
    { const lp = new THREE.Group(); cylinder(lp, 0.07, 0.08, 0.02, brass, 0, 0, 0, 24); cylinder(lp, 0.007, 0.007, 0.38, brass, 0, 0.02, 0, 8);
      mesh(lp, new THREE.CylinderGeometry(0.05, 0.11, 0.12, 24, 1, true), std({ color: '#c9a14a', metalness: 1, roughness: 0.3, side: THREE.DoubleSide }), 0, 0.42, 0.0);
      const bulb = addLight(new THREE.PointLight('#ffcf90', 0.8, 2.2, 2)); bulb.position.set(0, 0.38, 0); lp.add(bulb); putI(lp, 326, 562, 0, top); }
    { const pad = new THREE.Group(); rb(pad, 0.21, 0.01, 0.3, std({ color: '#f3efe6', roughness: 0.9 }), 0, 0, 0, 0.002); cylinder(pad, 0.004, 0.004, 0.14, brass, 0.06, 0.01, 0, 6).rotation.z = Math.PI / 2; putI(pad, 341, 610, -0.2, top); }
    putI(taskChairB(), 347, 592, look(347, 592, 333, 606));
    // east wall: fluted walnut credenza with stone top – coffee point – and a walnut key cabinet + brass clock above
    bx(396, 566, 405, 598, 0.06, 0.86, P.walnut); bx(396.6, 566.6, 405, 597.4, 0, 0.06, blackM, { collide: false });
    bx(395.6, 565.6, 405, 598.4, 0.86, 0.9, P.quartz);
    flutes(566.5, 597.5, 395.8, false, 0.08, 0.84);
    { const cm = new THREE.Group(); rb(cm, 0.24, 0.36, 0.32, blackM, 0, 0, 0, 0.02); rb(cm, 0.18, 0.02, 0.1, M.steel, 0, 0.08, 0.12, 0.004); cylinder(cm, 0.035, 0.03, 0.08, std({ color: '#f2efe8', roughness: 0.4 }), 0.0, 0.0, 0.11, 16); putI(cm, 400, 572, -Math.PI / 2, 0.9); }
    { const wf = new THREE.Group(); cylinder(wf, 0.1, 0.1, 0.36, std({ color: '#e9ecee', roughness: 0.3 }), 0, 0, 0, 24); cylinder(wf, 0.07, 0.07, 0.06, std({ color: '#9cc7dc', roughness: 0.1, transparent: true, opacity: 0.6 }), 0, 0.36, 0, 20); putI(wf, 400.5, 581, 0, 0.9); }
    for (const b of [586, 589]) { const mg = new THREE.Group(); lathe(mg, [[0, 0], [0.035, 0], [0.04, 0.09], [0.036, 0.09], [0.031, 0.006], [0, 0.006]], std({ color: '#d8cdbd', roughness: 0.6 }), 0, 0, 0, 20); putI(mg, 399, b, 0, 0.9); }
    putI(plantB(0, 0, 0.55, P.ceramic), 401, 594, 0, 0.9);
    bx(403, 571, 405, 587, 1.25, 1.85, P.walnut, { collide: false });                                          // key cabinet
    bx(402.8, 578.7, 403, 579.3, 1.45, 1.65, brass, { collide: false });
    { const ck = new THREE.Group(); mesh(ck, new THREE.TorusGeometry(0.17, 0.012, 10, 48), brass, 0, 0, 0); mesh(ck, new THREE.CircleGeometry(0.165, 40), std({ color: '#f4f1ea', roughness: 0.8 }), 0, 0, -0.004);
      rb(ck, 0.006, 0.12, 0.004, blackM, 0, -0.01, 0.002, 0.001); const hm = rb(ck, 0.006, 0.09, 0.004, blackM, 0, -0.01, 0.003, 0.001); hm.rotation.z = -1.2; putI(ck, 404.6, 592, Math.PI, 1.9); }
    // walnut slatted feature wall on the WC partition, monstera in the north-west corner
    for (let iy = 527.5; iy < 556; iy += 2.4) bx(364.8, iy, 366, iy + 1.5, 0.08, H - 0.05, P.walnut, { collide: false });
    bx(364.6, 526, 366, 557, 0, 0.08, blackM, { collide: false });
    putI(monsteraPotB(0.75), 329, 534, 0.7); solidI(324, 529, 334, 539);
    // armoured pass-through at the hall window: stone ledge + steel document tray; black mullions (caixilhos)
    bx(342, 526, 362, 530, 0.9, 0.93, P.quartz); bx(347, 523, 357, 529, 0.93, 0.98, M.steel, { collide: false });
    for (const iy of [562.5, 583]) bx(315, iy - 0.5, 321, iy + 0.5, 0.9, 2.1, M.frame, { collide: false });
    bx(345, 618, 346, 622, 0.9, 2.1, M.frame, { collide: false });
    // WC: toilet on the west partition, floating vanity + mirror on the north wall
    it(toiletB, 371, 543, 382, 555, 'right');
    it(vanity2B, 388, 526, 404, 533.5, 'down');
    bx(390, 526, 402, 526.5, 1.15, 1.85, std({ color: '#d5dbde', metalness: 1, roughness: 0.04 }), { collide: false });
    // ceiling: plaster sanca with indirect LED, warm fill light
    sanca(-618 * K, 321 * K, -526 * K, 405 * K, 28, 0.12);
    { const l = addLight(new THREE.PointLight('#ffd7a0', 2.6, 7, 2)); const [x, z] = W(360, 580); l.position.set(x, 2.25, z); world.add(l); }
  }
  // ---------------------------------------------------------------------------
  // ESPAÇO DELIVERY (06) – plan: room ix 371–437 × iy 660–701, door from the service corridor at the NE (ix 419–437).
  // Walnut smart-locker wall in an L (west wall + the west end of the south wall), a refrigerated locker (grey on the
  // plan) next to it, and a walnut parcel counter with a travertine top along the rest of the south wall.
  // ---------------------------------------------------------------------------
  {
    const walnut = P.walnut, blk = PK.matBlack, trav = PK.travertine, steel = M.steel;
    const glow = std({ color: '#7fe0a0', emissive: '#4fd080', emissiveIntensity: 1.2 });
    const lockerFace = (alongIx, k, p0, p1, y0, y1, cols, rows, sgn) => {     // door grid on a cabinet face (reveals, pulls, LEDs)
      const step = (p1 - p0) / cols, rh = (y1 - y0) / rows, t0 = k, t1 = k + sgn * 0.25;
      const B = (a, c, ya, yb, m) => alongIx ? bx(a, Math.min(t0, t1), c, Math.max(t0, t1), ya, yb, m, { collide: false, cast: false }) : bx(Math.min(t0, t1), a, Math.max(t0, t1), c, ya, yb, m, { collide: false, cast: false });
      for (let i = 0; i <= cols; i++) B(p0 + i * step - 0.12, p0 + i * step + 0.12, y0, y1, blk);
      for (let j = 0; j <= rows; j++) B(p0, p1, y0 + j * rh - 0.006, y0 + j * rh + 0.006, blk);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const c = p0 + (i + 0.5) * step, y = y0 + (j + 0.5) * rh;
        B(c + step * 0.32, c + step * 0.36, y - rh * 0.25, y + rh * 0.25, std({ color: '#b08d57', metalness: 1, roughness: 0.3 }));   // brass pull
        B(c - step * 0.38, c - step * 0.3, y + rh * 0.36, y + rh * 0.4, glow);   // status LED
      }
    };
    // west locker wall (faces east), plinth + LED cove on top
    bx(371, 661, 381, 701, 0, 0.1, blk); bx(371, 661, 381, 701, 0.1, 2.3, walnut);
    lockerFace(false, 381, 661.5, 700.5, 0.12, 2.28, 4, 5, 1);
    bx(371, 661, 381.2, 701, 2.3, 2.34, P.led, { collide: false, cast: false });
    // touch screen on the locker wall (call / pickup code)
    bx(381.25, 677, 381.7, 685, 1.1, 1.65, blk, { collide: false }); bx(381.7, 677.5, 381.75, 684.5, 1.15, 1.6, std({ color: '#203040', emissive: '#4a8fd0', emissiveIntensity: 0.8, roughness: 0.2 }), { collide: false, cast: false });
    // south return of the lockers (faces north)
    bx(381, 692, 392, 701, 0, 0.1, blk); bx(381, 692, 392, 701, 0.1, 2.3, walnut);
    lockerFace(true, 692, 381.5, 391.5, 0.12, 2.28, 1, 5, -1);
    // refrigerated locker for groceries: stainless body, glass doors, cool light
    bx(392.3, 692, 402, 701, 0, 2.3, steel);
    for (const [y0, y1] of [[0.15, 1.1], [1.2, 2.2]]) { bx(393, 691.6, 401.3, 692, y0, y1, std({ color: '#cfe6ee', transparent: true, opacity: 0.35, roughness: 0.05 }), { collide: false, cast: false });
      bx(400.3, 691.2, 400.7, 691.6, y0 + 0.2, y1 - 0.2, blk, { collide: false }); }
    bx(393.5, 692.2, 400.8, 692.4, 0.4, 2.0, std({ color: '#e8f6ff', emissive: '#bfe8ff', emissiveIntensity: 0.6 }), { collide: false, cast: false });
    // parcel counter (walnut, travertine top) with overhead walnut lockers for large parcels
    bx(404, 694, 436.5, 701, 0, 0.1, blk); bx(404, 694, 436.5, 701, 0.1, 0.88, walnut); bx(403.8, 693.6, 436.5, 701, 0.88, 0.92, trav);
    lockerFace(true, 694, 404.5, 436, 0.12, 0.86, 4, 1, -1);
    bx(404, 696, 436.5, 701, 1.5, 2.3, walnut); lockerFace(true, 696, 404.5, 436, 1.52, 2.28, 4, 1, -1);
    bx(404, 696, 436.5, 701, 1.49, 1.5, P.led, { collide: false, cast: false });   // LED under the upper lockers
    // a few parcels on the counter
    const card = std({ color: '#b8925f', roughness: 0.9 }), tape = std({ color: '#d8c39a', roughness: 0.7 });
    for (const [a, b, w, d, h] of [[410, 697, 6, 4, 0.22], [418, 696.5, 4, 3.5, 0.16], [425, 697.5, 7, 3, 0.3]]) { bx(a, b, a + w, b + d, 0.92, 0.92 + h, card); bx(a + w / 2 - 0.4, b - 0.02, a + w / 2 + 0.4, b + d + 0.02, 0.92 + h - 0.002, 0.92 + h + 0.002, tape, { collide: false, cast: false }); }
    // folding parcel trolley by the door
    { const g = new THREE.Group(); rb(g, 0.5, 0.03, 0.4, blk, 0, 0.02, 0, 0.005); for (const sx of [-1, 1]) cylinder(g, 0.012, 0.012, 1.0, blk, sx * 0.22, 0.04, -0.18, 8);
      rb(g, 0.48, 0.025, 0.025, blk, 0, 1.03, -0.18, 0.005); for (const sx of [-1, 1]) cylinder(g, 0.04, 0.04, 0.03, blk, sx * 0.22, 0, 0.18, 12).rotation.z = Math.PI / 2;
      putI(g, 428, 672, look(428, 672, 428, 690)); solidI(424, 668, 432, 676); }
    { const l = addLight(new THREE.PointLight('#fff1dc', 1.6, 6, 2)); const [x, z] = W(404, 680); l.position.set(x, 2.3, z); world.add(l); }
  }
  // ---------------------------------------------------------------------------
  // ESPAÇO P/ MINIMERCADO (09) – a 24 h self-service "market" as luxury buildings have them (no render; house
  // style). Plan: room ix 441–474 × iy 491–588 (≈ 1.8 × 5.3 m), glass door on the south side from the service
  // corridor; walnut gondola with LED-lit shelves along the west wall (plan: brown strip), two glass-door
  // drink fridges across the north end (plan: grey units); on the east wall a 3-tier fruit
  // crate and a self-checkout kiosk with a basket stack by the door.
  // ---------------------------------------------------------------------------
  {
    const blackM = std({ color: '#1c1d1f', roughness: 0.5, metalness: 0.3 }), brass = P.goldM ?? std({ color: '#c9a14a', metalness: 1, roughness: 0.25 });
    const prodM = std({ roughness: 0.55 }), glassB = std({ roughness: 0.15, metalness: 0.1 });
    const PAL = ['#c8553d', '#f2c14e', '#5aa469', '#2f4858', '#e9e3d6', '#7a4e3a', '#d98e73', '#3b6e8f', '#a3b18a', '#1f1f1f', '#efd9b4', '#8c2f39'];
    const BOT = ['#2f5d3a', '#6b2737', '#c9a86a', '#d9e4e8', '#3e3e3e', '#a6452c', '#e8c547'];
    const col = new THREE.Color();
    const products = [], bottles = [];                                        // [x, y, z, sx, sy, sz, colour] in world metres
    // west gondola: walnut back + uprights, 5 stone-edged shelves with LED under the front edge
    const g0 = 493, g1 = 586, sx0 = 441, sx1 = 451.5;
    bx(sx0, g0, sx0 + 1, g1, 0, 2.15, P.walnut);
    for (let iy = g0; iy <= g1 + 0.1; iy += (g1 - g0) / 5) bx(sx0, iy - 0.4, sx1, iy + 0.4, 0, 2.15, P.walnut);
    bx(sx0, g0, sx1, g1, 2.15, 2.19, P.walnut, { collide: false });
    bx(sx0 + 1, g0, sx1, g1, 0, 0.12, blackM);                               // plinth
    const SH = [0.12, 0.52, 0.9, 1.28, 1.66];
    for (const y of SH) {
      bx(sx0 + 1, g0, sx1, g1, y, y + 0.025, P.walnut, { collide: false });
      bx(sx1 - 0.6, g0 + 0.4, sx1 - 0.3, g1 - 0.4, y - 0.006, y, P.led, { collide: false, cast: false });
      // goods along the shelf
      let iy = g0 + 1.2;
      while (iy < g1 - 1.5) {
        const r = Math.random(), [x, z] = W(sx1 - 3.5, iy);
        const c = PAL[(Math.random() * PAL.length) | 0];
        if (r < 0.4) {                                                        // packets / boxes: a facing of 2 side by side, 3 deep
          const w = 0.1 + Math.random() * 0.07, h = 0.1 + Math.random() * 0.12, d = 0.06 + Math.random() * 0.04;
          for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) products.push([x - j * (w + 0.008), y + 0.025 + h / 2, z - k * 0.12, w, h, d, c]);
          iy += (2 * w + 0.03) * 18.33;
        } else {                                                              // cans, jars, bottles: a facing of 3, 3 deep
          const t = Math.random(), rr = t < 0.4 ? 0.034 : t < 0.7 ? 0.045 : 0.032, h = t < 0.4 ? 0.12 : t < 0.7 ? 0.13 + Math.random() * 0.04 : 0.24 + Math.random() * 0.08;
          const cc = t < 0.7 ? c : BOT[(Math.random() * BOT.length) | 0];
          for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) bottles.push([x - j * (2 * rr + 0.006), y + 0.025, z - k * 0.12, rr, h, cc]);
          iy += (6 * rr + 0.03) * 18.33;
        }
      }
    }
    // north: two glass-door drink fridges (black frame, lit interior, bottles + cans)
    for (const [a, c] of [[451.5, 462.6], [463, 474]]) {
      bx(a, 491, c, 492, 0, 2.05, blackM); bx(a, 491, a + 0.4, 504.8, 0, 2.05, blackM); bx(c - 0.4, 491, c, 504.8, 0, 2.05, blackM);
      bx(a, 491, c, 504.8, 0, 0.1, blackM); bx(a, 491, c, 504.8, 1.98, 2.05, blackM, { collide: false });
      bx(a + 0.4, 492, c - 0.4, 492.4, 0.1, 1.98, std({ color: '#f4f7f8', emissive: '#e8f2ff', emissiveIntensity: 0.35, roughness: 0.3 }), { collide: false });   // lit interior back
      bx(a + 0.4, 504.4, c - 0.4, 504.8, 0.1, 1.98, M.glass, { collide: true, cast: false });
      bx(c - 1.2, 504.8, c - 0.9, 505.6, 0.9, 1.4, M.steel, { collide: false });          // handle
      for (const y of [0.25, 0.62, 0.99, 1.36, 1.73]) {
        bx(a + 0.4, 492.4, c - 0.4, 504.3, y - 0.01, y, std({ color: '#cfd6da', metalness: 0.6, roughness: 0.3 }), { collide: false });
        for (let ix = a + 1.5; ix < c - 1; ix += 1.55) for (const iyb of [497, 502]) { const [x, z] = W(ix, iyb); bottles.push([x, y, z, 0.03, y > 1.3 ? 0.13 : 0.24, BOT[((ix * 7 + y * 13) | 0) % BOT.length]]); }
      }
      const fl2 = addLight(new THREE.PointLight('#e8f2ff', 0.6, 1.6, 2)); const [x, z] = W((a + c) / 2, 500); fl2.position.set(x, 1.6, z); world.add(fl2);
    }
    // east wall: fruit crate, self-checkout + baskets
    // fruit crate: 3 walnut tiers stepping back, oranges / green apples / lemons
    const FR = ['#e8892b', '#8fbf4a', '#f1d34a'];
    for (let t = 0; t < 3; t++) {
      const x0 = 466 + t * 2.4, y = 0.35 + t * 0.32;
      bx(x0, 551, 474, 563, 0, y, P.walnut);
      for (let iy = 552.3; iy < 562; iy += 1.55) for (let ix = x0 + 0.9; ix < x0 + 2.4; ix += 1.4) { const [x, z] = W(ix, iy); const f = mesh(world, new THREE.SphereGeometry(0.037, 14, 10), std({ color: FR[t], roughness: 0.55 }), x, y + 0.035, z); f.castShadow = true; }
    }
    // self-checkout kiosk: walnut pedestal, stone top, angled tablet + card reader
    bx(469, 566, 474, 579, 0, 0.98, P.walnut); bx(468.6, 565.6, 474, 579.4, 0.98, 1.01, P.quartz);
    { const k = new THREE.Group(); const t = rb(k, 0.32, 0.22, 0.015, blackM, 0, 0, 0, 0.008); t.rotation.x = -0.6; mesh(k, new THREE.PlaneGeometry(0.29, 0.19), std({ color: '#ffffff', emissive: '#bfe3ff', emissiveIntensity: 0.6 }), 0, 0.105, 0.009, 0, 0, 0, false).rotation.x = -0.6;
      rb(k, 0.08, 0.03, 0.12, blackM, 0.24, 0, 0.02, 0.01); putI(k, 471, 572, Math.PI, 1.02); }
    // walnut slatted feature wall along the east wall (behind the fruit crate + checkout), like the portaria's
    bx(473.6, 505, 474, 587, 0, H - 0.01, blackM, { collide: false });
    for (let iy = 505.4; iy < 586.5; iy += 2.4) bx(472.8, iy, 473.6, iy + 1.5, 0, H - 0.01, P.walnut, { collide: false });
    for (let i = 0; i < 4; i++) { const bk = new THREE.Group(); const wM = std({ color: '#b98d5f', roughness: 0.6 });
      rb(bk, 0.4, 0.02, 0.28, wM, 0, 0, 0, 0.004); for (const s of [-1, 1]) { rb(bk, 0.4, 0.18, 0.012, wM, 0, 0.02, s * 0.135, 0.004); rb(bk, 0.012, 0.18, 0.28, wM, s * 0.195, 0.02, 0, 0.004); }
      mesh(bk, new THREE.TorusGeometry(0.12, 0.008, 8, 24, Math.PI), blackM, 0, 0.2, 0, 0, Math.PI / 2, 0);
      putI(bk, 470.5, 583.5, -Math.PI / 2, i * 0.06); }
    solidI(467, 580.5, 474, 586.5);
    // instanced goods (one draw call each)
    { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), prodM, products.length), m4 = new THREE.Matrix4();
      products.forEach(([x, y, z, a, b, c, cc], i) => { m4.makeScale(a, b, c).setPosition(x, y, z); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(cc)); });
      im.castShadow = im.receiveShadow = true; world.add(im); }
    { const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 14), glassB, bottles.length), m4 = new THREE.Matrix4();
      bottles.forEach(([x, y, z, r, h, cc], i) => { m4.makeScale(r, h, r).setPosition(x, y + h / 2, z); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(cc)); });
      im.castShadow = im.receiveShadow = true; world.add(im); }
    // ceiling: two linear LED profiles + warm-neutral light
    for (const ix of [452, 464]) bx(ix, 495, ix + 0.6, 586, H - 0.02, H - 0.004, P.led, { collide: false, cast: false, parent: ceilingGroup });
    for (const iy of [515, 550, 578]) { const l = addLight(new THREE.PointLight('#fff1dc', 2.2, 5, 2)); const [x, z] = W(458, iy); l.position.set(x, 2.3, z); world.add(l); }
  }

  // ---------------------------------------------------------------------------
  // COWORKING (07) – rebuilt after the render (p. 27, "capacidade p/ 16 pessoas sentadas") and the plan:
  // main room (ix 443–531) with a 3 m walnut table on slab legs, 8 grey upholstered chairs on chrome castor
  // frames with light-wood arm pads, low planters along the garden glass and a fiddle-leaf fig; two glazed
  // booths on the east side (black frames), each with a cream high-back banquette against its south wall,
  // walnut pedestal table and copper cone pendant, walnut wainscot under textured white plaster, plants in
  // walnut planter boxes at the far ends; fabric ceiling panels in a walnut grid over the whole room.
  // ---------------------------------------------------------------------------
  {
    const chrome = std({ color: '#dcdfe2', roughness: 0.15, metalness: 1 }), uph = fabric('#aeb0a8', 1.4), armWood = std({ color: '#b98d5f', roughness: 0.5 });
    const cream = fabric('#e4dccd', 2.0), blackM = std({ color: '#1e1f21', roughness: 0.45, metalness: 0.4 });
    const tube = (g, a, b, r, m) => {                                         // chrome tube between two local points
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), o = mesh(g, new THREE.CylinderGeometry(r, r, d.length(), 10), m, 0, 0, 0);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.position.copy(A).add(B).multiplyScalar(0.5); return o;
    };
    function coChairB() {                                                     // front +z
      const g = new THREE.Group();
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                   // splayed chrome legs on castors
        tube(g, [sx * 0.17, 0.39, sz * 0.16], [sx * 0.26, 0.05, sz * 0.25], 0.011, chrome);
        mesh(g, new THREE.SphereGeometry(0.024, 12, 8), blackM, sx * 0.26, 0.025, sz * 0.25);
      }
      rb(g, 0.4, 0.02, 0.38, chrome, 0, 0.38, 0, 0.008);                      // seat frame
      rb(g, 0.5, 0.085, 0.48, uph, 0, 0.395, 0.01, 0.04);                     // seat cushion
      const back = mesh(g, RBG(0.47, 0.42, 0.075, 0.04), uph, 0, 0.73, -0.25, -0.14);
      back.castShadow = true;
      for (const sx of [-1, 1]) {
        tube(g, [sx * 0.2, 0.4, -0.2], [sx * 0.2, 0.62, -0.27], 0.01, chrome);                    // back posts
        tube(g, [sx * 0.27, 0.4, 0.14], [sx * 0.27, 0.64, 0.14], 0.01, chrome);                   // arm: front post
        tube(g, [sx * 0.27, 0.4, -0.18], [sx * 0.27, 0.64, -0.18], 0.01, chrome);                 // arm: rear post
        tube(g, [sx * 0.21, 0.4, -0.18], [sx * 0.27, 0.4, -0.18], 0.01, chrome); tube(g, [sx * 0.21, 0.4, 0.14], [sx * 0.27, 0.4, 0.14], 0.01, chrome);
        rb(g, 0.055, 0.028, 0.38, armWood, sx * 0.27, 0.64, -0.02, 0.012);                       // light-wood arm pad
      }
      return g;
    }
    function slabTableB(w, len) {                                             // long walnut table, two slab legs (long axis = local z)
      const g = new THREE.Group(), top = 0.76, tm = P.walnut.clone(); tm.map = P.walnut.map.clone(); tm.map.needsUpdate = true; tm.map.rotation = Math.PI / 2; tm.map.center.set(0.5, 0.5);
      rb(g, w, 0.05, len, tm, 0, top - 0.05, 0, 0.008);
      rb(g, w - 0.08, 0.02, len - 0.1, blackM, 0, top - 0.07, 0, 0.004);     // shadow gap
      for (const z of [-len / 2 + 0.35, len / 2 - 0.35]) rb(g, w - 0.25, top - 0.07, 0.09, P.walnut, 0, 0, z, 0.008);
      rb(g, 0.06, 0.06, len - 0.8, P.walnut, 0, 0.5, 0, 0.006);                // stretcher
      return g;
    }
    function banquetteB(w) {                                                  // cream high-back booth banquette, front +z
      const g = new THREE.Group();
      rb(g, w, 0.09, 0.56, P.walnut, 0, 0, 0.0, 0.01);                       // walnut plinth
      rb(g, w, 0.22, 0.58, cream, 0, 0.09, 0.0, 0.04);
      rb(g, w - 0.04, 0.13, 0.5, cream, 0, 0.3, 0.04, 0.06);                 // seat cushion
      mesh(g, RBG(w - 0.04, 0.66, 0.16, 0.07), cream, 0, 0.76, -0.2, -0.08);  // tall back
      for (let i = 1; i < 3; i++) rb(g, 0.012, 0.6, 0.01, std({ color: '#cfc6b6', roughness: 1 }), -w / 2 + (w * i) / 3, 0.46, -0.115, 0.004);   // tufting seams
      return g;
    }
    function pedestalB() {                                                    // booth table: 1.3 × 0.7 m walnut top (long side = local z), black column + foot
      const g = new THREE.Group();
      rb(g, 0.7, 0.035, 1.3, P.walnut, 0, 0.71, 0, 0.006);
      cylinder(g, 0.04, 0.04, 0.68, blackM, 0, 0.03, 0, 16);
      rb(g, 0.5, 0.03, 0.07, blackM, 0, 0, 0, 0.008); rb(g, 0.07, 0.03, 0.95, blackM, 0, 0, 0, 0.008);
      return g;
    }
    function snakePlantB() {                                                  // sansevieria clump: tall upright blades, ~0.25 m wide
      const g = new THREE.Group(), dark = std({ color: '#2f4f2a', roughness: 0.5, side: THREE.DoubleSide }), light = std({ color: '#5d7a3a', roughness: 0.5, side: THREE.DoubleSide });
      const sh = new THREE.Shape(); sh.moveTo(-0.03, 0); sh.quadraticCurveTo(-0.045, 0.5, 0, 1); sh.quadraticCurveTo(0.045, 0.5, 0.03, 0); sh.lineTo(-0.03, 0);
      const bg = new THREE.ShapeGeometry(sh, 6);
      for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 0.03 + (i % 3) * 0.03, h = 0.5 + ((i * 7) % 5) * 0.08;
        const m = mesh(g, bg, i % 3 ? dark : light, Math.cos(a) * r, 0, Math.sin(a) * r, 0, 0, 0); m.scale.set(1, h, 1);
        m.rotation.set(Math.sin(a) * 0.12, a, Math.cos(a) * 0.12); m.castShadow = true; }
      return g;
    }
    function figB() {                                                         // fiddle-leaf fig (render): glossy violin-shaped leaves on 3 stems, round terracotta pot
      const g = new THREE.Group(), potM = std({ color: '#b05a33', roughness: 0.75 }), bark = std({ color: '#6b5646', roughness: 0.9 });
      const leafA = std({ color: '#3f6e2a', roughness: 0.4, side: THREE.DoubleSide }), leafB = std({ color: '#557f35', roughness: 0.45, side: THREE.DoubleSide });
      lathe(g, [[0, 0], [0.2, 0], [0.29, 0.06], [0.33, 0.24], [0.32, 0.4], [0.34, 0.42], [0.3, 0.43], [0, 0.41]], potM, 0, 0, 0, 48);
      mesh(g, new THREE.CircleGeometry(0.3, 32), P.soil, 0, 0.405, 0, -Math.PI / 2, 0, 0, false);
      const sh = new THREE.Shape();                                           // fiddle outline, base at (0,0), tip at y = 1
      sh.moveTo(0, 0); sh.bezierCurveTo(-0.18, 0.05, -0.25, 0.25, -0.17, 0.42); sh.bezierCurveTo(-0.12, 0.55, -0.42, 0.62, -0.32, 0.86);
      sh.bezierCurveTo(-0.22, 1.03, 0.22, 1.03, 0.32, 0.86); sh.bezierCurveTo(0.42, 0.62, 0.12, 0.55, 0.17, 0.42); sh.bezierCurveTo(0.25, 0.25, 0.18, 0.05, 0, 0);
      const lg = new THREE.ShapeGeometry(sh, 10), pa = lg.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, 0.18 * y * y + 0.22 * Math.abs(x)); }   // curl + fold on the midrib
      lg.computeVertexNormals();
      const stems = [[0.05, 0, 1.55], [-0.06, 0.05, 1.8], [0.02, -0.07, 1.35]];
      stems.forEach(([dx, dz, top], k) => {
        const tx = dx * 3, tz = dz * 3, len = Math.hypot(tx, top - 0.4, tz), st = mesh(g, new THREE.CylinderGeometry(0.012, 0.022, len, 7), bark, tx / 2, 0.4 + (top - 0.4) / 2, tz / 2);
        st.lookAt(tx, top, tz); st.rotateX(Math.PI / 2); st.position.set(tx / 2, 0.4 + (top - 0.4) / 2, tz / 2);
        for (let i = 0; i < 16; i++) {                                         // leaves spiral up the upper part of each stem
          const t = 0.35 + 0.65 * (i / 15), y = 0.4 + (top - 0.4) * t, a = i * 2.4 + k, L = 0.22 + 0.12 * Math.sin(i * 1.7 + k) ** 2;
          const lf = new THREE.Group(); lf.rotation.order = 'YXZ'; lf.rotation.y = a; lf.rotation.x = 0.55 + 0.6 * (1 - t) + (i % 3) * 0.12;
          lf.position.set(tx * t + Math.sin(a) * 0.03, y, tz * t + Math.cos(a) * 0.03); g.add(lf);
          const m = mesh(lf, lg, i % 2 ? leafA : leafB, 0, 0, 0, 0, 0, 0); m.scale.setScalar(L); m.castShadow = true;
        }
      });
      return g;
    }
    // fabric ceiling panels in a walnut grid (render: pale woven panels, ≈ 1.3 m squares, wood strips)
    const fabT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e2ded5'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(160,152,140,0.18)' : 'rgba(255,255,250,0.18)'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1); } });
    fabT.wrapS = fabT.wrapT = THREE.RepeatWrapping; fabT.repeat.set(4, 4);
    bx(443, 349, 568, 455, H - 0.014, H - 0.004, std({ map: fabT, roughness: 1 }), { collide: false, cast: false, parent: ceilingGroup });
    for (let ix = 455; ix < 568; ix += 24) bx(ix - 0.6, 349, ix + 0.6, 455, H - 0.07, H - 0.004, P.walnut, { collide: false, cast: false, parent: ceilingGroup });
    for (let iy = 361; iy < 455; iy += 24) bx(443, iy - 0.6, 568, iy + 0.6, H - 0.07, H - 0.004, P.walnut, { collide: false, cast: false, parent: ceilingGroup });
    fl(443, 349, 568, 455, marble('#ddd5c8', '160,150,135', 0.1, '#cfc6b8'), 1.2, 0.3, 0.005);           // large warm porcelain (render)

    // main table + 8 chairs (4 per side), laptops and a tablet
    putI(slabTableB(1.1, 3.0), 487, 405, Math.PI / 2); solidI(477, 378, 497, 432);
    for (const b of [386, 399, 412, 425]) for (const a of [469, 505]) putI(coChairB(), a, b, look(a, b, 487, b));
    putI(laptopB(), 482, 393, look(482, 393, 469, 393), 0.76); putI(laptopB(), 492, 416, look(492, 416, 505, 416), 0.76);
    { const g = new THREE.Group(); rb(g, 0.25, 0.008, 0.18, P.black, 0, 0, 0, 0.004); putI(g, 490, 400, 0.4, 0.76); }
    // patio outside the garden glass (plan, yellow): built-in sitting area – travertine plinth, teak seat, cream cushions, planters at the ends
    { const teakB = std({ color: '#9a6b45', roughness: 0.65 }), trav = std({ color: '#d8cfc0', roughness: 0.8 }), cu = fabric('#e9e2d4', 1.6);
      bx(462, 331, 500, 342, 0, 0.36, trav); bx(461.5, 330.5, 500.5, 342, 0.36, 0.42, teakB);
      for (let a = 462.5; a < 499; a += 12.3) { bx(a, 331.5, a + 11.8, 341.5, 0.42, 0.5, cu, { collide: false }); const bk = new THREE.Group(); rb(bk, 0.6, 0.4, 0.12, cu, 0, 0, 0, 0.05); bk.children[0].rotation.x = -0.15; putI(bk, a + 5.9, 340.3, look(a + 5.9, 340.3, a + 5.9, 320), 0.5); }
      for (const a of [448, 503]) { bx(a, 331, a + 13, 342, 0, 0.5, trav); bx(a + 0.5, 331.5, a + 12.5, 341.5, 0.5, 0.51, P.soil, { collide: false, cast: false }); putI(tropicalB(0.35), a + 6.5, 334.5, a, 0.51); } }   // small enough to stay clear of the garden glass
    putI(figB(), 457.5, 366, 0.5); solidI(451, 359, 464, 372);                  // corner plant (plan: by the glass, NW corner)

    // booths: glazed front (black frames) with two door openings, divider = walnut base + glass, transoms
    const D1 = [372, 391], D2 = [421, 437];                                       // doors open onto each booth's table
    for (const [f, t] of [[349, D1[0]], [D1[1], 406], [409, D2[0]], [D2[1], 455]]) bx(531, f, 533, t, 0, H, M.glass, { collide: true, cast: false });
    for (const [f, t] of [D1, D2]) bx(531, f, 533, t, 2.25, H, M.glass, { collide: false, cast: false });
    for (const iy of [349, 360, D1[0], D1[1], 406, 409, D2[0], D2[1], 446, 455]) bx(530.6, iy - 0.55, 533.4, iy + 0.55, 0, H, M.frame, { collide: false });
    bx(530.6, 349, 533.4, 455, 2.22, 2.28, M.frame, { collide: false }); bx(530.6, 349, 533.4, 455, H - 0.06, H, M.frame, { collide: false });
    bx(533, 406, 568, 409, 0, 1.1, P.walnut); bx(533, 406.9, 568, 408.1, 1.1, H, M.glass, { collide: false, cast: false });   // divider
    bx(533, 406, 568, 409, 1.1, 1.13, P.walnut, { collide: false }); for (const a of [533.5, 567.5]) bx(a - 0.5, 406, a + 0.5, 409, 1.1, H, M.frame, { collide: false });
    // walnut wainscot + ledge, textured plaster above (east wall)
    const plT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#ece8e1'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(150,140,125,' + (0.08 + Math.random() * 0.1) + ')'; g.fillRect(0, y, w, 1.3); } for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(Math.random() * w, Math.random() * h, 3, 1); } });
    plT.wrapS = plT.wrapT = THREE.RepeatWrapping; plT.repeat.set(3, 1.5);
    bx(566.5, 349, 568, 455, 0, 1.1, P.walnut, { collide: false }); bx(565.5, 349, 568, 455, 1.1, 1.13, P.walnut, { collide: false });
    bx(567.7, 349, 568, 455, 1.13, H - 0.01, std({ map: plT, roughness: 0.95 }), { collide: false });
    // booths (plan): each has TWO high-back benches facing each other across a walnut table, and a slim
    // planter at the far end – booth 1 (north, iy 349–406): planter | bench ↓ | table | bench ↑ (back on the divider);
    // booth 2 (south, iy 409–455): bench ↓ (back on the divider) | table | bench ↑ | planter
    for (const [p0, p1] of [[350, 357], [448, 454]]) {
      bx(535, p0, 566, p1, 0, 1.05, P.walnut); bx(536, p0 + 1, 565, p1 - 1, 1.05, 1.06, P.soil, { collide: false, cast: false });
      for (const a of [539, 545.5, 552, 558.5, 563]) putI(snakePlantB(), a, (p0 + p1) / 2, a + p0, 1.06);   // upright snake plants: stay inside the slim planter
    }
    for (const [tb, aF, aB, bF, bB] of [[381.5, 358, 369.5, 394, 406], [429, 409.5, 421, 437, 448]]) {
      it(() => banquetteB(1.65), 535, aF, 566, aB, 'down');                  // bench facing south (towards the table)
      it(() => banquetteB(1.65), 535, bF, 566, bB, 'up');                    // bench facing north
      putI(pedestalB(), 551, tb, 0); solidI(538, tb - 6.4, 564, tb + 6.4);
      putI(conePendant(1.8), 551, tb, 0, 0, ceilingGroup);
      const l = addLight(new THREE.PointLight('#ffc98a', 2.2, 4.5, 2)); const [x, z] = W(551, tb); l.position.set(x, 1.6, z); world.add(l);
      putI(laptopB(), 546, tb + 3, look(546, tb + 3, 546, tb + 13), 0.745); putI(laptopB(), 557, tb - 3, look(557, tb - 3, 557, tb - 13), 0.745);
    }
  }

  // ---------------------------------------------------------------------------
  // CASA DE CAMPO C/ SPA E CHURRASQUEIRA (10) – 212 m² brochure space, "capacidade p/ 22 pessoas sentadas".
  // Layout traced from the plan (ix 572–858 × iy 349–455): lounge in the NW corner (olive L sofa against the
  // glazing and the west wall, jute rug, two organic oak tables), WC + shaft in the SW corner, oval dining table
  // for 10 in the middle, travertine buffet + walnut cabinet on the south wall between two wall stubs, kitchen in
  // the east: travertine island with a walnut bar (4 stools), grill + cylindrical hood, fluted walnut back wall.
  // Dressed strictly after the render (p. 17): warm evening light, LED coves, floor-to-ceiling black glazing with
  // linen drapes, light oak floor, dark walnut, travertine, olive / mustard / rust textiles, cognac leather.
  // ---------------------------------------------------------------------------
  {
    const rI = (a, b, c, d, y0, y1, m, r = 0.01) => worldRb(-Math.max(b, d) * K, Math.min(a, c) * K, -Math.min(b, d) * K, Math.max(a, c) * K, y0, y1, m, r);
    const leather = phys({ color: '#7a4a2b', roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.5 }), darkLeather = phys({ color: '#3b2a20', roughness: 0.5, clearcoat: 0.2 });
    const walnut = PK.walnutDark, oak = std({ color: '#c9a77c', roughness: 0.55 }), trav = PK.travertine, blk = PK.matBlack;
    const flutesI = (p0, p1, face, alongIx, y0, y1, m = walnut) => {         // vertical flutes on a face (image px)
      const [xa, za] = alongIx ? W(p0, face) : W(face, p0), [xb, zb] = alongIx ? W(p1, face) : W(face, p1);
      const L = Math.hypot(xb - xa, zb - za), n = Math.floor(L / 0.035), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, y1 - y0, 10), m, n), m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; m4.makeTranslation(xa + (xb - xa) * t, (y0 + y1) / 2, za + (zb - za) * t); im.setMatrixAt(i, m4); }
      im.castShadow = im.receiveShadow = true; world.add(im);
    };
    function backArc(g, halfW, zEdge, sag, y0, h, t = 0.02) {             // solid curved backrest whose ends land exactly on the rear posts (x = ±halfW, z = zEdge)
      const r = (halfW * halfW + sag * sag) / (2 * sag), zc = zEdge - sag + r, al = Math.asin(halfW / r), sh = new THREE.Shape();
      sh.absarc(0, -zc, r + t / 2, Math.PI / 2 - al, Math.PI / 2 + al, false); sh.absarc(0, -zc, r - t / 2, Math.PI / 2 + al, Math.PI / 2 - al, true);
      mesh(g, new THREE.ExtrudeGeometry(sh, { depth: h - 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 }), walnut, 0, y0 + 0.004, 0, -Math.PI / 2);
    }
    function chairR() {                                                       // dining chair (render): straight walnut legs, rear legs rising into the curved walnut backrest, dark leather seat, front +z
      const g = new THREE.Group();
      for (const sx of [-1, 1]) {
        cylinder(g, 0.016, 0.016, 0.42, walnut, sx * 0.2, 0, 0.19, 12);       // front legs (straight)
        cylinder(g, 0.016, 0.016, 0.86, walnut, sx * 0.2, 0, -0.19, 12);     // rear legs = backrest posts (straight)
      }
      rb(g, 0.46, 0.04, 0.44, walnut, 0, 0.42, 0, 0.012);
      rb(g, 0.44, 0.07, 0.42, darkLeather, 0, 0.455, 0.01, 0.03);
      for (const z of [0.19, -0.19]) rb(g, 0.38, 0.03, 0.022, walnut, 0, 0.16, z, 0.006);   // stretchers
      backArc(g, 0.2, -0.19, 0.045, 0.64, 0.22);
      return g;
    }
    function stoolR() {                                                       // bar stool (render): straight walnut legs + rails, cognac leather seat, low curved back on the rear posts, front +z
      const g = new THREE.Group();
      for (const sx of [-1, 1]) {
        cylinder(g, 0.017, 0.017, 0.68, walnut, sx * 0.17, 0, 0.16, 12);
        cylinder(g, 0.017, 0.017, 0.94, walnut, sx * 0.17, 0, -0.16, 12);
      }
      rb(g, 0.36, 0.022, 0.022, walnut, 0, 0.26, 0.16, 0.006); rb(g, 0.022, 0.022, 0.32, walnut, 0.17, 0.26, 0, 0.006); rb(g, 0.022, 0.022, 0.32, walnut, -0.17, 0.26, 0, 0.006);
      rb(g, 0.42, 0.035, 0.4, walnut, 0, 0.68, 0, 0.01);
      rb(g, 0.41, 0.075, 0.39, leather, 0, 0.71, 0.005, 0.035);
      backArc(g, 0.17, -0.16, 0.035, 0.8, 0.14);
      return g;
    }

    // floor, ceiling coves, downstand beams over the two wall stubs (zones: lounge | dining | kitchen)
    fl(572, 349, 858, 455, floorWoodTex, 1.6, 0.45, 0.006);
    sanca(-455 * K, 572 * K, -349 * K, 858 * K, 38, 0.16);
    for (const a of [659, 757]) { bx(a, 349, a + 7, 414, H - 0.3, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup }); for (const e of [a - 0.2, a + 7]) bx(e, 352, e + 0.2, 414, H - 0.31, H - 0.3, P.cove, { collide: false, cast: false, parent: ceilingGroup }); }
    // glazing: black mullions, head rail, sliding leaves stacked at the door, linen drapes at the piers
    for (const ix of [620, 639, 792, 812, 832]) bx(ix - 0.5, 343, ix + 0.5, 349, 0, H, M.frame, { collide: false });
    for (const ix of [601, 658, 667, 752, 772, 852]) bx(ix - 0.7, 343, ix + 0.7, 349, 0, H, M.frame, { collide: false });
    bx(601, 343, 852, 349, H - 0.14, H - 0.1, M.frame, { collide: false });
    for (const [a, b] of [[667, 688], [731, 752]]) { bx(a, 344.5, b, 345.5, 0.02, H - 0.14, M.glass, { collide: false, cast: false }); bx(a, 344, b, 346, 0.0, 0.05, M.frame, { collide: false }); }
    for (const [a, b] of [[601, 613], [649, 666], [753, 771], [841, 852]]) putI(drapeB((b - a) / 18.33, H - 0.08), (a + b) / 2, 352.5, -Math.PI / 2);

    // ---- LOUNGE: low olive L sofa (north run against the glass, return along the west wall) ----
    const OL = PK.olive;
    rI(574, 360, 633, 379, 0, 0.06, blk, 0.005); rI(574, 379, 594, 415, 0, 0.06, blk, 0.005);              // recessed plinth
    rI(573.5, 359.5, 633.5, 379.5, 0.06, 0.3, OL, 0.04); rI(573.5, 379, 594, 415.5, 0.06, 0.3, OL, 0.04);    // base
    rI(573.5, 359.5, 633.5, 364.5, 0.3, 0.74, OL, 0.07); rI(573.5, 359.5, 578.5, 415.5, 0.3, 0.74, OL, 0.07);  // back frames
    rI(629.5, 364, 633.5, 379.5, 0.3, 0.6, OL, 0.06); rI(578, 411.5, 594, 415.5, 0.3, 0.6, OL, 0.06);       // arms
    for (const [a, c] of [[579, 595], [595.5, 612], [612.5, 629]]) rI(a, 364.5, c, 379, 0.3, 0.46, OL, 0.07);   // seat cushions (north run)
    for (const [b, d] of [[379.5, 395], [395.5, 411]]) rI(578.5, b, 594, d, 0.3, 0.46, OL, 0.07);           // seat cushions (return)
    for (const [a, c] of [[579, 595], [595.5, 612], [612.5, 629]]) rI(a, 364.5, c, 368.5, 0.46, 0.86, OL, 0.08);   // loose back cushions
    for (const [b, d] of [[364.5, 380], [380.5, 395.5], [396, 411]]) rI(578.5, b, 582.5, d, 0.46, 0.86, OL, 0.08);
    const PIL = [PK.mustard, PK.oat, PK.rust, PK.mustard, PK.oat, PK.rust];
    [[586, 369.5], [600, 369.5], [614, 369.5], [624, 369.5], [583.5, 388], [583.5, 402]].forEach(([a, b], i) => {
      const p = new THREE.Group(); rb(p, 0.46, 0.44, 0.14, PIL[i], 0, 0, 0, 0.07); p.children[0].rotation.x = -0.2;
      putI(p, a, b, (i < 4 ? look(a, b, a, b + 10) : look(a, b, a + 10, b)) + 0.12 * (i % 2 ? 1 : -1), 0.46);
    });
    solidI(573.5, 359.5, 633.5, 379.5); solidI(573.5, 379, 594, 415.5);
    { const g = new THREE.Group(); mesh(g, new THREE.PlaneGeometry(2.6, 2.4), PK.jute, 0, 0.018, 0, -Math.PI / 2, 0, 0, false); putI(g, 614, 402); }   // jute rug (plan)
    putI(organicTableB(), 612, 401, 0.35); solidI(602, 393, 624, 410);
    { const d = new THREE.Group(); books(d, 0, 0, 0, 3, 0.2); lathe(d, [[0, 0], [0.05, 0], [0.13, 0.05], [0.14, 0.07], [0.12, 0.068], [0.04, 0.01], [0, 0.01]], std({ color: '#6c7356', roughness: 0.6 }), 0.3, 0, 0.05, 32); putI(d, 609, 400, 0.4, 0.39); }
    putI(arcLampB(), 628, 381, look(628, 381, 600, 381));                    // arc lamp leaning over the sofa corner (render)
    { const g = new THREE.Group(); cylinder(g, 0.22, 0.22, 0.03, walnut, 0, 0.52, 0, 32); cylinder(g, 0.012, 0.012, 0.52, blk, 0, 0, 0, 8); cylinder(g, 0.16, 0.16, 0.015, blk, 0, 0, 0, 24); books(g, 0, 0.55, 0, 2, 0.3); putI(g, 638, 370); }   // side table
    putI(monsteraPotB(0.85), 650, 370, 0.4); solidI(645, 365, 655, 375);

    // ---- WC + shaft (SW corner, plan) ----
    bx(572, 427, 586, 455, 0, H, M.wall);
    wl(572, 423, 627, 427); wl(623, 427, 627, 455, [{ from: 431, to: 446 }]);
    floor(-455 * K, 586 * K, -427 * K, 623 * K, porcelainTex, 0.9, 0.25, 0.008);
    it(toiletB, 587, 443, 598, 454, 'right');
    it(vanity2B, 592, 427, 618, 433, 'down');
    bx(594, 427, 616, 427.5, 1.15, 1.85, std({ color: '#d5dbde', metalness: 1, roughness: 0.04 }), { collide: false });
    { const l = addLight(new THREE.PointLight('#ffd7a0', 1.2, 3, 2)); const [x, z] = W(605, 440); l.position.set(x, 2.3, z); world.add(l); }

    // ---- DINING: oval travertine table for 10, walnut chairs, two pendant lines ----
    wl(661, 414, 666, 455); wl(757, 414, 763, 455);                          // wall stubs (plan)
    putI(ovalStoneTableB(2.75, 1.2), 708, 401, Math.PI / 2); solidI(684, 390, 732, 412);
    for (const b of [387.5, 414.5]) for (const a of [688, 701, 714, 727]) putI(chairR(), a, b, look(a, b, a, 401));
    for (const a of [677, 739]) putI(chairR(), a, 401, look(a, 401, 708, 401));
    for (const ix of [697, 719]) putI(discPendantLine(0.55, 3, 1.85), ix, 401, Math.PI / 2, 0, ceilingGroup);
    { const c = new THREE.Group(); rb(c, 0.6, 0.03, 0.22, oak, 0, 0, 0, 0.01); for (let i = 0; i < 5; i++) mesh(c, new THREE.SphereGeometry(0.035 + (i % 2) * 0.01, 14, 10), std({ color: ['#efe6d6', '#6b4b33', '#c9a77c'][i % 3], roughness: 0.5 }), -0.22 + i * 0.11, 0.06, 0); putI(c, 708, 401, Math.PI / 2, 0.75); }
    // buffet on the south wall: travertine sideboard + fluted walnut tall cabinet (plan)
    rI(666, 443, 734, 455, 0.1, 0.88, trav, 0.008); rI(666.5, 443.5, 733.5, 455, 0, 0.1, blk, 0.004); rI(665.5, 442.5, 734, 455, 0.88, 0.92, trav, 0.006);
    rI(734, 443, 757, 455, 0.1, 2.1, walnut, 0.006); rI(734.5, 443.5, 756.5, 455, 0, 0.1, blk, 0.004); flutesI(734.5, 756.5, 442.8, true, 0.12, 2.08);
    solidI(666, 443, 757, 455);
    { const g = new THREE.Group(); lathe(g, [[0, 0], [0.09, 0], [0.12, 0.2], [0.07, 0.36], [0.075, 0.4], [0, 0.4]], std({ color: '#d9cdb8', roughness: 0.5 }), -0.6, 0, 0, 32);
      lathe(g, [[0, 0], [0.06, 0], [0.18, 0.08], [0.2, 0.1], [0.17, 0.095], [0.05, 0.01], [0, 0.01]], std({ color: '#a8673f', roughness: 0.6 }), 0.3, 0, 0, 32);
      const lp = new THREE.Group(); cylinder(lp, 0.06, 0.07, 0.3, std({ color: '#3a3836', roughness: 0.6 }), 0, 0, 0, 24); mesh(lp, new THREE.CylinderGeometry(0.12, 0.16, 0.2, 28, 1, true), P.shade, 0, 0.4, 0); lp.position.x = 1.0; g.add(lp);
      const bl = addLight(new THREE.PointLight('#ffcf90', 0.7, 2.5, 2)); bl.position.set(1.0, 0.45, 0); g.add(bl);
      putI(g, 700, 449, Math.PI / 2 * 0 + -Math.PI / 2, 0.92); }

    // ---- KITCHEN: travertine island with walnut bar + waterfall leg, grill, hood; fluted walnut back wall ----
    wl(763, 442, 858, 446);                                                    // kitchen south wall (pantry strip behind, plan)
    rI(806.5, 377, 820, 427, 0.08, 0.94, trav, 0.01); rI(807, 377.5, 819.5, 426.5, 0, 0.08, blk, 0.004);
    rI(806, 376.5, 820.5, 427.5, 0.94, 0.98, trav, 0.008);                   // island top
    rI(794, 375, 806.5, 429, 0.88, 0.94, walnut, 0.008);                     // walnut bar slab, cantilevered to the west
    rI(794, 425, 806.5, 429, 0, 0.88, trav, 0.008);                          // travertine waterfall leg at the south end
    solidI(794, 375, 820.5, 429);
    { const h = new THREE.Group(); rb(h, 0.62, 0.012, 0.42, P.blackGlass, 0, 0, 0, 0.004); putI(h, 813, 406, Math.PI / 2, 0.98); }
    putI(builtGrillB(), 813, 386, look(813, 386, 800, 386), 0.98);
    { const g = new THREE.Group(); hoodCyl(g, 0, 1.75, 0); putI(g, 813, 404, 0, 0, ceilingGroup); }
    for (const b of [383, 394, 405, 416]) putI(stoolR(), 789.5, b, look(789.5, b, 806, b));
    { const wb = new THREE.Group(); cylinder(wb, 0.038, 0.038, 0.22, std({ color: '#3b1e22', roughness: 0.15 }), 0, 0, 0, 16); cylinder(wb, 0.014, 0.014, 0.09, std({ color: '#3b1e22', roughness: 0.15 }), 0, 0.22, 0, 10); putI(wb, 817, 422, 0, 0.98); }
    { const cb = new THREE.Group(); rb(cb, 0.42, 0.025, 0.28, oak, 0, 0, 0, 0.01); putI(cb, 811, 418, 0.3, 0.98); }
    putI(kitchenWallB(3.4, 0.68), 850.5, 392, Math.PI); solidI(843, 357, 858, 427);
    rI(843, 424, 858, 442, 0.1, 2.4, walnut, 0.006); rI(843.5, 424.5, 858, 441.5, 0, 0.1, blk, 0.004); flutesI(424.5, 441.5, 842.8, false, 0.12, 2.38);   // tall fluted column (fridge / oven)
    { const ov = new THREE.Group(); rb(ov, 0.6, 0.6, 0.02, P.blackGlass, 0, 0, 0, 0.004); rb(ov, 0.5, 0.02, 0.03, M.steel, 0, 0.52, 0.02, 0.005); putI(ov, 842.6, 433, -Math.PI / 2, 1.0); }
    solidI(843, 424, 858, 442);
    putI(plantB(0, 0, 1.1, P.ceramic), 769, 434, 0.3);                       // plant by the kitchen stub (plan)
    pothos(-372 * K, 2.04, 853 * K, { x0: -0.13, x1: 0.13, z0: -0.13, z1: 0.13 }, Math.PI * 0.5, Math.PI * 1.5, 8, 0.7);

    // warm evening light (garden planters + uplights: see SPA DECK below)
    for (const [a, b, i] of [[612, 395, 2.0], [708, 401, 2.4], [812, 400, 2.0], [745, 449, 0.8]]) { const l = addLight(new THREE.PointLight('#ffc98a', i, 7, 2)); const [x, z] = W(a, b); l.position.set(x, 2.2, z); world.add(l); }
  }
  // ---------------------------------------------------------------------------
  // SPA DECK of the casa de campo (10) – no render; designed in the house style. Plan: cumaru deck ix 600–770 ×
  // iy 228–325 with the raised spa (stone coping 625–706 × 247–301, water 634–703 × 255–299), outdoor shower in
  // the NW corner, two teak loungers + side table east of the spa (under a cantilever umbrella); a pale stone
  // terrace strip (iy 325–343) in front of the glazing with planted beds between two white piers; a small garden
  // lounge (two teak armchairs + concrete side tables) in front of the kitchen glazing; the structural pillar
  // (plan: white box with an X, ix 538–587 × iy 326–343) up to the 1º pavimento slab.
  // ---------------------------------------------------------------------------
  {
    const deckTex = canvasTex(512, 512, (g, w, h) => {                         // cumaru boards, ≈ 14 cm wide, staggered joints
      for (let r = 0; r < 16; r++) {
        let x = -Math.random() * 200;
        while (x < w) { const L = 180 + Math.random() * 260, t = 0.8 + Math.random() * 0.35; g.fillStyle = `rgb(${120 * t | 0},${78 * t | 0},${52 * t | 0})`; g.fillRect(x, r * 32, L, 30);
          for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,35,20,0.18)'; g.fillRect(x, r * 32 + Math.random() * 30, L, 1); }
          g.fillStyle = 'rgba(30,18,10,0.7)'; g.fillRect(x + L - 2, r * 32, 2, 30); x += L; }
        g.fillStyle = 'rgba(25,15,8,0.85)'; g.fillRect(0, r * 32 + 30, w, 2);
      }
    });
    const boxwood = std({ color: '#3f5f2c', roughness: 0.85, bumpMap: pile, bumpScale: 1.2 }), grassM = std({ color: '#a9a77a', roughness: 0.9 });
    const teak = std({ color: '#9a6b45', roughness: 0.65 }), cushion = fabric('#e9e2d4', 1.6), stoneW = std({ color: '#e6e0d4', roughness: 0.7 });
    const concrete = std({ color: '#8f8b85', roughness: 0.9 }), steelD = std({ color: '#c8ccd0', metalness: 1, roughness: 0.25 }), dark = std({ color: '#2a2a2a', roughness: 0.6 });
    // deck boards around the spa + stone strip in front of the glazing
    for (const [a, b, c, d] of [[600, 228, 770, 247], [600, 301, 770, 325], [600, 247, 625, 301], [706, 247, 770, 301]]) fl(a, b, c, d, deckTex, 2.4, 0.7, 0.006);
    fl(600, 325, 770, 343, pavingTex, 1.2, 0.75, 0.006);
    // structural pillar (plan: white box with an X) and the two white piers on the terrace strip, vent grilles on the east one
    bx(538, 326, 587, 343, 0, H + 0.3, M.wall);
    bx(661, 325, 667, 343, 0, H + 0.3, M.wall); bx(751, 325, 770, 343, 0, H + 0.3, M.wall);
    for (const a of [756, 763]) for (let y = 0.3; y < 2.4; y += 0.07) bx(a, 324.6, a + 2.5, 325, y, y + 0.03, dark, { collide: false, cast: false });
    // raised spa: wide stone coping (seat ledge on the west), mosaic-blue water lit from below, stainless waterfall blade
    for (const [a, b, c, d] of [[625, 247, 634, 301], [703, 247, 706, 301], [634, 247, 703, 255], [634, 299, 703, 301]]) { bx(a, b, c, d, 0, 0.42, stoneW); bx(a - 0.3, b - 0.3, c + 0.3, d + 0.3, 0.42, 0.46, P.quartz, { collide: false }); }
    bx(634, 255, 703, 299, 0, 0.36, phys({ color: '#2f9fb3', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.05, emissive: '#0b5566', emissiveIntensity: 0.55 }));
    bx(634.5, 255.5, 702.5, 298.5, 0.36, 0.361, std({ color: '#bfeef3', transparent: true, opacity: 0.25, roughness: 0.02 }), { collide: false, cast: false });
    bx(626, 268, 633.5, 286, 0.46, 0.5, steelD, { collide: false }); bx(633.5, 270, 635, 284, 0.4, 0.46, steelD, { collide: false });   // waterfall blade
    { const l = addLight(new THREE.PointLight('#7fe6ff', 1.6, 4.5, 2)); const [x, z] = W(668, 277); l.position.set(x, 0.55, z); world.add(l); }
    for (let i = 0; i < 40; i++) { const [x, z] = W(660 + Math.random() * 22, 268 + Math.random() * 18); mesh(world, new THREE.CircleGeometry(0.03 + Math.random() * 0.05, 10), std({ color: '#ffffff', transparent: true, opacity: 0.5 }), x, 0.362, z, -Math.PI / 2, 0, 0, false); }   // jet foam
    // two teak loungers (head to the north) with cream cushions + rolled towels, side table, cantilever umbrella
    function loungerB() {                                                      // long axis local z, head at −z
      const g = new THREE.Group();
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.06, 0.26, 0.06, teak, sx * 0.33, 0, sz * 0.85, 0.01);
      rb(g, 0.76, 0.05, 1.95, teak, 0, 0.26, 0, 0.01);
      for (let z = -0.9; z <= 0.9; z += 0.1) rb(g, 0.7, 0.012, 0.07, teak, 0, 0.31, z, 0.004);
      rb(g, 0.7, 0.08, 1.25, cushion, 0, 0.32, 0.32, 0.035);
      const bk = rb(g, 0.7, 0.08, 0.68, cushion, 0, 0, 0, 0.035); bk.position.set(0, 0.52, -0.6); bk.rotation.x = 0.75;
      const tw = mesh(g, new THREE.CylinderGeometry(0.07, 0.07, 0.5, 18), std({ color: '#f6f3ec', roughness: 0.95 }), 0, 0.47, 0.75); tw.rotation.z = Math.PI / 2;
      return g;
    }
    for (const a of [725.5, 751.5]) { putI(loungerB(), a, 273, -Math.PI / 2); solidI(a - 7, 255, a + 7, 291); }
    { const t = new THREE.Group(); cylinder(t, 0.24, 0.24, 0.03, teak, 0, 0.42, 0, 32); for (let i = 0; i < 3; i++) { const a = i * 2.094; const lg = mesh(t, new THREE.CylinderGeometry(0.015, 0.015, 0.43, 8), teak, Math.cos(a) * 0.17, 0.21, Math.sin(a) * 0.17); lg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); }
      rb(t, 0.3, 0.015, 0.2, std({ color: '#d9cdb8', roughness: 0.6 }), 0, 0.45, 0, 0.005); for (const x of [-0.07, 0.07]) lathe(t, [[0, 0], [0.03, 0], [0.032, 0.12], [0.028, 0.12], [0.026, 0.01], [0, 0.01]], std({ color: '#e8f4f6', transparent: true, opacity: 0.45, roughness: 0.05 }), x, 0.465, 0, 16);
      putI(t, 738.5, 259); }
    { const u = new THREE.Group(); rb(u, 0.7, 0.12, 0.7, concrete, 0, 0, 0, 0.02); cylinder(u, 0.03, 0.03, 2.5, dark, 0, 0.12, 0, 12);
      rb(u, 0.05, 0.05, 1.5, dark, 0, 2.55, 0.72, 0.01);
      mesh(u, new THREE.ConeGeometry(1.5, 0.35, 4, 1, true), std({ color: '#e9e2d4', roughness: 0.95, side: THREE.DoubleSide }), 0, 2.45, 1.45, 0, Math.PI / 4, 0);
      putI(u, 765, 300, look(765, 300, 739, 273)); solidI(762, 297, 768, 303); }
    // outdoor shower in the NW corner: stainless column + rain head on a stone plate with a linear drain
    bx(603, 231, 617, 247, 0.006, 0.03, std({ color: '#d8d2c6', roughness: 0.8 }), { collide: false });
    bx(604, 243.5, 616, 244.5, 0.03, 0.032, dark, { collide: false, cast: false });
    { const s = new THREE.Group(); cylinder(s, 0.035, 0.035, 2.25, steelD, 0, 0, 0, 16); rb(s, 0.04, 0.04, 0.45, steelD, 0, 2.2, 0.22, 0.01); cylinder(s, 0.15, 0.15, 0.02, steelD, 0, 2.17, 0.42, 32); rb(s, 0.12, 0.06, 0.06, steelD, 0, 1.0, 0.04, 0.01);
      putI(s, 610, 235, look(610, 235, 610, 245)); solidI(608, 233, 612, 237); }
    // terrace strip: low stone planters with shrubs, grasses and garden uplights (plan: green clumps)
    for (const [a, c] of [[601, 645], [719, 750]]) {
      bx(a, 330, c, 342, 0, 0.42, concrete); bx(a + 0.5, 330.5, c - 0.5, 341.5, 0.42, 0.43, P.soil, { collide: false, cast: false });
      // premium planting: clipped boxwood spheres alternating with feathery ornamental grass, small and low
      let k = 0;
      for (let ix = a + 3.5; ix < c - 2; ix += 5.5, k++) {
        const [x, z] = W(ix, 336);
        if (k % 2 === 0) { const r = 0.2 + (k % 4 ? 0.03 : 0); const b = mesh(world, new THREE.SphereGeometry(r, 24, 16), boxwood, x, 0.43 + r * 0.9, z); b.castShadow = true; }
        else { const t = new THREE.Group(); for (let i = 0; i < 22; i++) { const bl = mesh(t, new THREE.ConeGeometry(0.012, 0.45 + Math.random() * 0.2, 4), grassM, 0, 0.22, 0); bl.rotation.set((Math.random() - 0.5) * 0.7, Math.random() * 6, (Math.random() - 0.5) * 0.7); bl.position.set((Math.random() - 0.5) * 0.12, 0.2, (Math.random() - 0.5) * 0.12); } putI(t, ix, 336, 0, 0.43); }
      }
      { const l = addLight(new THREE.SpotLight('#ffd7a0', 1.2, 3, 0.9, 0.6, 2)); const [x, z] = W((a + c) / 2, 340.5); l.position.set(x, 0.45, z); l.target.position.set(x, 1.6, z + 0.01); world.add(l, l.target); }
    }
    // garden lounge in front of the kitchen glazing: two teak armchairs facing the garden, concrete cube tables, hedge
    function teakChairB() {                                                     // low teak lounge armchair with cream cushions, front +z
      const g = new THREE.Group();
      for (const sx of [-1, 1]) rb(g, 0.07, 0.55, 0.78, teak, sx * 0.36, 0, 0, 0.012);
      rb(g, 0.66, 0.06, 0.7, teak, 0, 0.18, 0.02, 0.01);
      rb(g, 0.64, 0.12, 0.64, cushion, 0, 0.24, 0.05, 0.04);
      const bk = rb(g, 0.64, 0.5, 0.12, cushion, 0, 0, 0, 0.04); bk.position.set(0, 0.38, -0.3); bk.rotation.x = -0.25;
      rb(g, 0.66, 0.5, 0.04, teak, 0, 0.18, -0.37, 0.01);
      return g;
    }
    for (const a of [800, 827]) { putI(teakChairB(), a, 331, look(a, 331, a, 300)); solidI(a - 8, 324, a + 8, 338); }
    for (const a of [787, 840]) { bx(a - 4, 322, a + 4, 330, 0, 0.42, concrete); }
    bx(772, 341, 852, 345, 0, 0.6, hedge, { collide: false }); bx(772, 312, 776, 345, 0, 0.6, hedge); bx(848, 312, 852, 345, 0, 0.6, hedge);
    // warm wash on the deck (no bollards)
    for (const [a, b] of [[640, 315], [745, 240], [615, 285]]) { const l = addLight(new THREE.PointLight('#ffc98a', 1.2, 5, 2)); const [x, z] = W(a, b); l.position.set(x, 0.7, z); world.add(l); }
  }
  tree(790, 200, 1.1); tree(835, 285, 0.9);

  // ---------------------------------------------------------------------------
  // LOUNGE EXTERNO (08) – traced from the plan: lawn with a stepping-stone path, a paved forecourt in the
  // NW corner (ix 270–364 × iy 158–215) bounded by a garden wall (ix 376–380) and a low wall
  // (iy 216–224), a garden wall on the west (ix 312–316) and a low wall between the lawn and the spa deck
  // (ix 588–591); red flower beds + a terracotta planter, dense planting on the west, and a canopy of premium
  // shade trees along the north wall.
  // ---------------------------------------------------------------------------
  {
    const travW = std({ color: '#d8cfc0', roughness: 0.8 }), teakL = std({ color: '#9a6b45', roughness: 0.65 }), cush = fabric('#e9e2d4', 1.6), conc = std({ color: '#8f8b85', roughness: 0.9 });
    // ---- premium trees: branching trunk + many organic leaf clumps (jittered spheres) in three greens ----
    const clumpGeo = (() => { const g = new THREE.SphereGeometry(1, 22, 16), p = g.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + 0.13 * Math.sin(v.x * 6.1 + v.y * 3.7) * Math.cos(v.z * 5.3 - v.y * 2.2) + 0.05 * Math.sin(v.x * 17 + v.z * 13); p.setXYZ(i, v.x * n, v.y * n * 0.82, v.z * n); }
      g.computeVertexNormals(); return g; })();
    const LEAF = ['#3e6a2c', '#557f36', '#2f5424', '#6d9443'].map(c => std({ color: c, roughness: 0.9, bumpMap: pile, bumpScale: 3 }));
    const barkM = std({ color: '#5e4a3b', roughness: 1 }), bloomM = std({ color: '#e7c23d', roughness: 0.7 });
    function premiumTree(ix, iy, s = 1, kind = 'shade') {
      const g = new THREE.Group(), H0 = (kind === 'round' ? 2.0 : 3.0) * s, spread = (kind === 'round' ? 1.6 : 2.5) * s;
      cylinder(g, 0.13 * s, 0.22 * s, H0, barkM, 0, 0, 0, 12);
      const tips = [];
      for (let i = 0; i < 4; i++) {                                           // main limbs splaying out from the trunk top
        const a = i * 1.62 + s, r = spread * (0.45 + 0.15 * (i % 2)), top = new THREE.Vector3(Math.cos(a) * r, H0 + (kind === 'round' ? 1.0 : 1.6) * s, Math.sin(a) * r), base = new THREE.Vector3(0, H0 - 0.2, 0);
        const L = top.distanceTo(base), lb = mesh(g, new THREE.CylinderGeometry(0.05 * s, 0.11 * s, L, 8), barkM, 0, 0, 0);
        lb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(base).normalize()); lb.position.copy(base).add(top).multiplyScalar(0.5); tips.push(top);
      }
      const n = kind === 'round' ? 26 : 40;
      for (let i = 0; i < n; i++) {                                           // leaf clumps: dome over the limbs, darker underneath
        const t = tips[i % tips.length], a = i * 2.39996, rr = spread * (0.2 + 0.55 * ((i * 37) % 10) / 10), y = t.y + (Math.random() - 0.3) * 0.9 * s;
        const sc = (0.6 + Math.random() * 0.45) * s * (kind === 'round' ? 0.9 : 1.0);
        const c = mesh(g, clumpGeo, LEAF[y > t.y ? (i % 2 ? 1 : 3) : (i % 2 ? 0 : 2)], Math.cos(a) * rr, y, Math.sin(a) * rr, 0, a, 0); c.scale.setScalar(sc); c.castShadow = true;
        if (kind === 'ipe' && i % 3 === 0) { const f = mesh(g, clumpGeo, bloomM, Math.cos(a) * rr * 1.05, y + sc * 0.55, Math.sin(a) * rr * 1.05); f.scale.setScalar(sc * 0.45); }
      }
      putI(g, ix, iy, Math.random() * 6); const [x, z] = W(ix, iy); colliders.push({ x0: x - 0.3 * s, x1: x + 0.3 * s, z0: z - 0.3 * s, z1: z + 0.3 * s });
    }
    for (const [a, b, s, k] of [[420, 188, 1.25, 'shade'], [494, 186, 1.15, 'shade'], [572, 183, 1.15, 'ipe'], [484, 243, 0.95, 'round'],
      [212, 248, 1.25, 'shade'], [262, 292, 1.15, 'shade'], [425, 272, 0.85, 'round'], [700, 170, 1.15, 'shade'], [612, 196, 0.8, 'round']]) premiumTree(a, b, s, k);

    // ---- walls ----
    bx(376, 145, 380, 218, 0, 2.2, travW); bx(375.8, 145, 380.2, 217.8, 2.2, 2.25, P.quartz, { collide: false });          // garden wall: forecourt | trees (plan line)
    bx(313, 218, 380, 222, 0, 2.2, travW); bx(312.8, 217.8, 380.2, 222.2, 2.2, 2.25, P.quartz, { collide: false });   // full-height wall from the lobby entrance: forecourt | garden
    bx(313, 222, 316, 300, 0, 2.2, travW); bx(312.8, 222, 316.2, 300, 2.2, 2.25, P.quartz, { collide: false });   // full wall: shrub mass | garden (plan)                                                                             // curb: shrub mass | garden
    bx(588, 229, 591, 292, 0, 0.35, travW); bx(587.8, 229, 591.2, 292, 0.35, 0.38, P.quartz, { collide: false });          // low wall: lawn | spa deck
    bx(591, 229, 600, 292, 0, 0.7, hedge);                                                                              // hedge on the deck side (plan)

    // ---- west part (plan): a paved concrete forecourt continuing the praça sidewalk into the lot (ix 270–364 ×
    // iy 158–215, no furniture), a lawn strip along the north wall, a dense shrub mass (ix 240–313 × 215–300) under
    // two large shade trees, then the garden with the red flower beds; walls only where the plan draws dark lines
    fl(270, 158, 364, 215, concreteTex, 2.0, 0.85, 0.007);
    fl(240, 215, 313, 300, grassTex, 3, 1, 0.005); fl(270, 145, 376, 158, grassTex, 3, 1, 0.005);
    for (let i = 0; i < 46; i++) { const [x, z] = W(243 + Math.random() * 67, 218 + Math.random() * 80); const r = 0.3 + Math.random() * 0.35; const c = mesh(world, clumpGeo, LEAF[i % 4], x, r * 0.55, z); c.scale.set(r, r * (0.8 + Math.random() * 0.5), r); }

    // ---- stepping-stone path (plan: grey strip from the coworking patio, then south along the deck wall) ----
    const stoneP = std({ color: '#b9b3a8', roughness: 0.85 });
    for (let ix = 536; ix < 586; ix += 6) bx(ix, 287.5, ix + 4.5, 295.5, 0, 0.03, stoneP, { collide: false });
    for (let iy = 300; iy < 345; iy += 6) bx(591, iy, 599, iy + 4.5, 0, 0.03, stoneP, { collide: false });

    // ---- red flower beds + terracotta planter (plan) ----
    const red = std({ color: '#b3262e', roughness: 0.7 }), red2 = std({ color: '#d0453f', roughness: 0.7 });
    for (const [a, b, c, d] of [[344, 250, 362, 264], [344, 268, 362, 284]]) {
      bx(a, b, c, d, 0, 0.25, std({ color: '#3b5a2a', roughness: 0.95 }));
      for (let i = 0; i < 30; i++) { const [x, z] = W(a + 1 + Math.random() * (c - a - 2), b + 1 + Math.random() * (d - b - 2)); mesh(world, new THREE.IcosahedronGeometry(0.06 + Math.random() * 0.04, 0), i % 2 ? red : red2, x, 0.3 + Math.random() * 0.08, z); }
    }
    bx(375, 274, 394, 284, 0, 0.55, std({ color: '#9a4a2e', roughness: 0.8 })); bx(375.6, 274.6, 393.4, 283.4, 0.55, 0.56, P.soil, { collide: false, cast: false });
    putI(tropicalB(0.9), 384.5, 279, 0.4, 0.56);
    // ---- PRAÇA / ENTRANCE (01 acesso social, 03 acesso serviço) – plan: raised planters with big fan-leaf tropicals and
    // dense ground cover beside the entrance paths (ix 241–292 × iy 383–479, 240–289 × 528–622, corner 232–310 × 663–697,
    // 241–275 × 315–357), narrow planted strips along the curb (ix 179–193), slim black handrails by the steps.
    {
      const rimM = std({ color: '#cfc8bb', roughness: 0.85 }), capM = std({ color: '#e2dccf', roughness: 0.7 }), railM = std({ color: '#1e1f21', roughness: 0.45, metalness: 0.5 });
      const groundM = std({ color: '#3c6a2b', roughness: 0.95, bumpMap: pile, bumpScale: 2 });
      const planter = (a, b, c, d, h, palms) => {
        const t = 1.6;                                                            // rim 9 cm
        for (const [p, q, r, s] of [[a, b, c, b + t], [a, d - t, c, d], [a, b + t, a + t, d - t], [c - t, b + t, c, d - t]]) { bx(p, q, r, s, 0, h, rimM); bx(p - 0.2, q - 0.2, r + 0.2, s + 0.2, h, h + 0.04, capM, { collide: false }); }
        bx(a + t, b + t, c - t, d - t, 0, h - 0.06, P.soil);                     // soil (collider for the whole planter)
        const n = Math.round((c - a) * (d - b) / 16);                             // dense ground cover
        for (let i = 0; i < n; i++) { const [x, z] = W(a + t + 1 + Math.random() * (c - a - 2 * t - 2), b + t + 1 + Math.random() * (d - b - 2 * t - 2)); const r = 0.14 + Math.random() * 0.12;
          const cl = mesh(world, clumpGeo, i % 3 ? groundM : LEAF[i % 4], x, h - 0.06 + r * 0.45, z); cl.scale.set(r, r * 0.8, r); }
        for (const [pi, pj, s] of palms) putI(tropicalB(s), pi, pj, pi * 7 + pj, h - 0.06);   // big fan-leaf tropicals (plan)
        for (const [pi, pj] of palms) { const [x, z] = W(pi + 4, pj + 4); mesh(world, new THREE.CircleGeometry(0.05, 16), P.led, x, h - 0.05, z, -Math.PI / 2, 0, 0, false); }
      };
      planter(241, 383, 292, 479, 0.55, [[281, 430, 0.9]]);
      planter(240, 528, 289, 622, 0.55, [[279, 575, 0.9]]);
      planter(232, 663, 310, 697, 0.45, [[292, 680, 0.8]]);
      // façade photos: slender queen palms rising in front of the slat brise, big rounded pink bougainvillea mounds
      // spilling over the planter rims, and a low white-flowering edge along the sidewalk side
      const pinkM = ['#d9578f', '#ec86b2', '#f3b0cc'].map(c => std({ color: c, roughness: 0.85, bumpMap: pile, bumpScale: 3 }));
      const bougain = (ix, iy, r, y) => {                                         // rounded shrub: green core + clusters of pink bracts
        for (let i = 0; i < 7; i++) { const a = i * 0.9, d = r * 0.35, [x, z] = W(ix + Math.cos(a) * d * 18, iy + Math.sin(a) * d * 18), s = r * (0.42 + Math.random() * 0.14);
          mesh(world, clumpGeo, LEAF[i % 4], x, y + s * 0.6, z).scale.set(s, s * 0.85, s); }
        for (let i = 0; i < 64; i++) { const a = Math.random() * 6.28, b = Math.random() * 1.45, [x, z] = W(ix + Math.cos(a) * Math.sin(b) * r * 15, iy + Math.sin(a) * Math.sin(b) * r * 15), s = r * (0.08 + Math.random() * 0.07);
          mesh(world, clumpGeo, pinkM[i % 3], x, y + r * 0.35 + Math.cos(b) * r * 0.55, z).scale.setScalar(s); }
      };
      const whiteEdge = (a, b, c, d, y) => { const wM = std({ color: '#f4f1ea', roughness: 0.8 });       // low hedge sprinkled with white flowers
        const n = Math.round(Math.abs(d - b) / 4);
        for (let i = 0; i < n; i++) { const [x, z] = W(a + Math.random() * (c - a), b + (i + Math.random()) * (d - b) / n), r = 0.16 + Math.random() * 0.08;
          mesh(world, clumpGeo, LEAF[i % 2 ? 0 : 2], x, y + r * 0.5, z).scale.set(r, r * 0.8, r);
          for (let k = 0; k < 3; k++) mesh(world, clumpGeo, wM, x + (Math.random() - 0.5) * r * 1.4, y + r * 0.9, z + (Math.random() - 0.5) * r * 1.4).scale.setScalar(0.035 + Math.random() * 0.02); } };
      for (const [ix, iy, h] of [[251, 397, 5.6], [251, 462, 6.2], [250, 545, 6.0], [250, 607, 5.4], [252, 680, 5.8]]) putI(queenPalmB(h, 0.8), ix, iy, ix + iy, iy > 660 ? 0.39 : 0.49);
      for (const [ix, iy, r] of [[268, 400, 0.75], [266, 454, 0.85], [252, 430, 0.6], [265, 553, 0.85], [266, 600, 0.75], [250, 576, 0.6], [270, 684, 0.6]]) bougain(ix, iy, r, iy > 660 ? 0.39 : 0.49);
      whiteEdge(243, 386, 247, 476, 0.49); whiteEdge(242, 531, 246, 619, 0.49);
      planter(241, 315, 275, 357, 0.55, [[257, 336, 1.1]]);
      // slim black handrails beside the steps (plan lines)
      const rail = (a, b, c, d) => { const alongIx = Math.abs(c - a) > Math.abs(d - b), L = alongIx ? c - a : d - b, n = Math.max(1, Math.round(L / 22));
        for (let i = 0; i <= n; i++) { const t = (alongIx ? a : b) + L * i / n; alongIx ? bx(t - 0.35, b - 0.35, t + 0.35, b + 0.35, 0, 0.9, railM) : bx(a - 0.35, t - 0.35, a + 0.35, t + 0.35, 0, 0.9, railM); }
        alongIx ? bx(a, b - 0.45, c, b + 0.45, 0.88, 0.94, railM, { collide: false }) : bx(a - 0.45, b, a + 0.45, d, 0.88, 0.94, railM, { collide: false }); };
      planter(239, 818, 270, 866, 0.5, []); premiumTree(256, 842, 0.95, 'round');   // tree planter at the driveway corner (plan)
      rail(273, 379, 294, 379); rail(294, 379, 294, 482); rail(264, 525, 294, 525); rail(275, 623, 294, 623); rail(275, 660, 292, 660);
    }
    // service corridor (marked): a tall tropical in a stone pot next to the delivery room
    { const p = new THREE.Group(); lathe(p, [[0, 0], [0.26, 0], [0.3, 0.55], [0.28, 0.56], [0.25, 0.06], [0, 0.06]], std({ color: '#3a2f28', roughness: 0.5 }), 0, 0, 0, 32);
      putI(p, 352, 689); putI(tropicalB(1.0), 352, 689, 0.7, 0.5); solidI(346, 683, 358, 695); }
    bed(272, 142, 860, 155);                                                    // hedge along the north boundary wall (lounge + beyond the spa deck)

    // ---- PET PLACE (12) – render: soft lawn under slender shade trees, a dense hedge mass behind, a black bar fence
    // with white flowers separating the paved patio in front of the pet care glass door (gate open), pots by the door,
    // a few toys on the grass (no dogs). Plan: lawn ix 860–970 × iy 150–292 (+ 860–912 down to the patio), hedge along
    // the east edge, patio 860–913 × 318–343, the lobby 2 / churrasqueira terrace east of ix 912.
    {
      fl(860, 318, 913, 343, porcelainTex, 0.9, 0.3, 0.006);                   // patio in front of the pet care door
      fl(912, 292, 970, 351, porcelainTex, 0.9, 0.3, 0.006);                   // terrace lobby 2 → churrasqueira
      const bar = std({ color: '#1e1f21', roughness: 0.45, metalness: 0.4 });
      const fence = (a, b, c, d, gaps = []) => {                              // vertical-bar railing, 1.1 m, along ix or iy
        const alongIx = Math.abs(c - a) > Math.abs(d - b), L0 = alongIx ? a : b, L1 = alongIx ? c : d, k = alongIx ? b : a;
        const segs = []; let s = L0; for (const [g0, g1] of gaps) { segs.push([s, g0]); s = g1; } segs.push([s, L1]);
        for (const [p, q] of segs) {
          for (let t = p; t <= q; t += 2.2) alongIx ? bx(t - 0.25, k - 0.25, t + 0.25, k + 0.25, 0, 1.1, bar, { collide: false }) : bx(k - 0.25, t - 0.25, k + 0.25, t + 0.25, 0, 1.1, bar, { collide: false });
          for (const y of [0.08, 1.06]) alongIx ? bx(p, k - 0.4, q, k + 0.4, y, y + 0.05, bar) : bx(k - 0.4, p, k + 0.4, q, y, y + 0.05, bar);
          for (const t of [p, q]) alongIx ? bx(t - 0.6, k - 0.6, t + 0.6, k + 0.6, 0, 1.15, bar) : bx(k - 0.6, t - 0.6, k + 0.6, t + 0.6, 0, 1.15, bar);   // posts
          alongIx ? bx(p, k - 1, q, k + 1, 0, 0.06, bar) : bx(k - 1, p, k + 1, q, 0, 0.06, bar);   // also the collider for the run
        }
      };
      fence(860, 318, 912, 318, [[876, 898]]);                                 // patio | lawn, gate open in front of the door
      fence(912, 292, 912, 318); fence(912, 292, 970, 292, [[948, 964]]);      // lawn | terrace, gate from the terrace
      fence(860, 155, 860, 318);                                                 // west edge (behind the shrubs)
      // white flower beds behind the fence on the patio side (render)
      const wFl = std({ color: '#f4f2ec', roughness: 0.7 }), stemM = std({ color: '#5d8a3a', roughness: 0.9 });
      for (const [a, c] of [[861, 876], [898, 911]]) {
        bx(a, 319, c, 326, 0, 0.12, P.soil, { collide: true, cast: false });
        for (let i = 0; i < 60; i++) { const [x, z] = W(a + 0.8 + Math.random() * (c - a - 1.6), 319.8 + Math.random() * 5.4), h = 0.35 + Math.random() * 0.35;
          cylinder(world, 0.006, 0.006, h, stemM, x, 0.12, z, 5); mesh(world, new THREE.IcosahedronGeometry(0.025 + Math.random() * 0.015, 1), wFl, x, 0.12 + h, z, 0, 0, 0, false); }
        for (let i = 0; i < 6; i++) { const [x, z] = W(a + 1 + Math.random() * (c - a - 2), 322.5); const r = 0.2 + Math.random() * 0.1; const cl = mesh(world, clumpGeo, LEAF[i % 2 ? 1 : 3], x, 0.12 + r * 0.5, z); cl.scale.setScalar(r); }
      }
      // pots with shrubs by the pet care door (plan: two round plants)
      for (const b of [328, 337]) { const p = new THREE.Group(); lathe(p, [[0, 0], [0.2, 0], [0.24, 0.42], [0.22, 0.42], [0.2, 0.05], [0, 0.05]], std({ color: '#d9d3c7', roughness: 0.8 }), 0, 0, 0, 28);
        const cl = mesh(p, clumpGeo, LEAF[1], 0, 0.62, 0); cl.scale.setScalar(0.3); const cl2 = mesh(p, clumpGeo, LEAF[3], 0.08, 0.8, 0.05); cl2.scale.setScalar(0.2); putI(p, 866, b); solidI(862, b - 4, 870, b + 4); }
      // slender shade trees over the lawn (render) + a dense hedge mass on the east edge and along the north wall
      for (const [a, b, s, k] of [[884, 182, 1.15, 'shade'], [932, 214, 1.0, 'shade'], [878, 262, 1.05, 'shade'], [930, 168, 0.8, 'round'], [905, 300, 0.75, 'round']]) premiumTree(a, b, s, k);
      // east edge: low clipped hedge with clipped boxwood spheres in front + ornamental grass tufts (premium, compact)
      bx(962, 158, 969, 290, 0, 0.75, hedge); bx(962.3, 158.3, 968.7, 289.7, 0.75, 0.8, hedge, { collide: false });
      const grassT = std({ color: '#9fae6a', roughness: 0.9, side: THREE.DoubleSide });
      for (let iy = 166; iy < 288; iy += 11) { const [x, z] = W(957, iy); const r = 0.32 + ((iy / 11) % 2) * 0.06; const c = mesh(world, clumpGeo, LEAF[iy % 22 < 11 ? 1 : 0], x, r * 0.82, z); c.scale.setScalar(r);
        const [gx, gz] = W(956, iy + 5.5); for (let k = 0; k < 9; k++) { const bl = mesh(world, new THREE.ConeGeometry(0.02, 0.5 + Math.random() * 0.2, 3), grassT, gx + (Math.random() - 0.5) * 0.2, 0.28, gz + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6, false); } }
      for (let ix = 868; ix < 950; ix += 12) { const [x, z] = W(ix, 159); const r = 0.3 + ((ix / 12) % 2) * 0.05; const c = mesh(world, clumpGeo, LEAF[1], x, r * 0.82, z); c.scale.setScalar(r); }   // boxwood row along the north hedge
      solidI(952, 158, 970, 290);
      bed(860, 142, 970, 155);
      // dog toys on the grass: red rope bone, blue + green balls
      { const g = new THREE.Group(), red = std({ color: '#b3262e', roughness: 0.8 }); const rp = mesh(g, new THREE.CylinderGeometry(0.025, 0.025, 0.22, 10), red, 0, 0.03, 0); rp.rotation.z = Math.PI / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.SphereGeometry(0.035, 12, 8), red, sx * 0.12, 0.035, sz * 0.03); putI(g, 902, 240, 0.4); }
      for (const [a, b, c] of [[910, 246, '#2f5fa8'], [925, 262, '#4fa83a']]) { const [x, z] = W(a, b); mesh(world, new THREE.SphereGeometry(0.035, 16, 10), std({ color: c, roughness: 0.6 }), x, 0.035, z); }
    }
  }

  // ---------------------------------------------------------------------------
  // LOBBY 2 (05, by the parking) – double height like the main lobby (LH). Plan: kidney sofa in the NW corner, round
  // coffee table, two tub chairs facing it on an oval rug; walnut console on the WC wall (east); tall glazing to the
  // terrace (north) with the door at its east end; opening to the hall (south). Modern: stone floor, full-height fluted
  // walnut wall, back-lit travertine slab behind the console, a cascade of glass globes from the high ceiling.
  // ---------------------------------------------------------------------------
  {
    fl(917, 357, 1001, 459, marble('#e6dccb', '170,150,120', 0.12, '#d6cab6'), 1.2, 0.3, 0.006);
    // tall glazing: black mullions + a transom at the door head
    for (let ix = 935.5; ix < 960; ix += 14) bx(ix - 0.6, 351.6, ix + 0.6, 356.4, 0.15, LH - 0.15, M.frame, { collide: false, cast: false });
    bx(921, 351.4, 962, 356.6, 2.38, 2.46, M.frame, { collide: false });
    bx(917, 455, 1001, 459, H, LH, M.wall, { collide: false });           // bulkhead over the opening to the hall
    // west: full-height fluted walnut wall with an LED wash at the top
    bx(917, 358, 918, 430, 0, LH - 0.15, P.walnut, { collide: false });
    for (let iy = 358.6; iy < 429.5; iy += 1.6) bx(918, iy, 918.3, iy + 0.8, 0.05, LH - 0.2, P.walnut, { collide: false, cast: false });
    bx(918, 358, 918.6, 430, LH - 0.2, LH - 0.15, P.cove, { collide: false, cast: false });
    // east: back-lit travertine slab + floating walnut console (plan) with objects
    bx(1000.3, 426, 1001, 456, 0, LH - 0.15, PK.travertine, { collide: false });
    for (const b of [425.4, 456]) bx(1000.4, b, 1001, b + 0.6, 0, LH - 0.15, P.cove, { collide: false, cast: false });
    bx(993, 432, 1000.3, 454, 0.38, 0.82, P.walnut); bx(992.8, 431.8, 1000.3, 454.2, 0.82, 0.85, PK.travertine, { collide: false });
    { const [x, z] = W(996.5, 437); lathe(world, [[0, 0], [0.09, 0], [0.13, 0.15], [0.07, 0.42], [0.05, 0.5], [0.06, 0.52], [0, 0.52]], std({ color: '#3b2f28', roughness: 0.35 }), x, 0.85, z, 32);
      const [x2, z2] = W(996.5, 447); mesh(world, new THREE.SphereGeometry(0.13, 32, 16), PK.travertine, x2, 0.98, z2);
      const [x3, z3] = W(996.5, 451); books(world, x3, 0.85, z3); }
    // seating (plan): kidney sofa, round coffee table, two tub chairs, oval jute rug
    { const g = new THREE.Group(); mesh(g, new THREE.CircleGeometry(1.45, 64), P.jute, 0, 0.018, 0, -Math.PI / 2, 0, 0, false); g.scale.x = 1.35; putI(g, 945, 399); }
    putI(curvedLoungeSofaB(1.7, 1.45), 942, 369, look(942, 369, 945, 400)); solidI(922, 359, 964, 384);
    putI(organicTableB(), 945, 399, 0.3);
    for (const [a, b] of [[929, 428], [961, 428]]) { putI(boucleTubChairB(), a, b, look(a, b, 945, 399)); solidI(a - 8, b - 8, a + 8, b + 8); }
    { const g = new THREE.Group(); cylinder(g, 0.18, 0.22, 0.5, std({ color: '#b58a5a', roughness: 0.55 }), 0, 0, 0, 24); putI(g, 969, 381); }
    // plants away from the glass
    // cascade of glass globes on wires from the double-height ceiling over the seating
    { const globe = std({ color: '#fff6e8', roughness: 0.2, emissive: '#ffd9a0', emissiveIntensity: 1.2 }), wire = std({ color: '#222', roughness: 0.6 });
      for (let i = 0; i < 9; i++) { const a = i * 2.39996, r = 0.25 + 0.55 * Math.sqrt(i / 9), [x, z] = W(945 + Math.cos(a) * r * 18.33, 399 + Math.sin(a) * r * 18.33), y = 3.0 + ((i * 7) % 9) * 0.15, s = 0.1 + (i % 3) * 0.035;
        mesh(world, new THREE.SphereGeometry(s, 24, 16), globe, x, y, z, 0, 0, 0, false); cylinder(world, 0.003, 0.003, LH - y - s, wire, x, y + s, z, 6); }
      const [x, z] = W(945, 399); cylinder(world, 0.18, 0.18, 0.04, std({ color: '#b08d57', metalness: 1, roughness: 0.3 }), x, LH - 0.04, z, 32); }
    for (const [a, b] of [[941, 394], [975, 420], [960, 370]]) { const l = addLight(new THREE.PointLight('#ffd7a0', 3, 9, 2)); const [x, z] = W(a, b); l.position.set(x, LH - 1.6, z); world.add(l); }
    // WCs (plan): toilet in the corner + vanity on the east wall, entered from the vestibule between them
    it(toiletB, 1010, 376, 1022, 389, 'up'); it(vanity2B, 1043, 358, 1050, 376, 'left');
    it(toiletB, 1010, 442, 1022, 455, 'up'); it(vanity2B, 1043, 430, 1050, 448, 'left');
  }
  // ---------------------------------------------------------------------------
  // PET CARE (11) – no render; pet spa in the house style (plan: bathing tub + grooming counter along the west wall,
  // glass door to the pet place on the north, door to lobby 2 on the east). Sage zellige wet wall, travertine tub with
  // walnut steps, grooming table with arm, fluted walnut storage wall, bench with leash hooks, dog beds.
  // ---------------------------------------------------------------------------
  {
    const walnut = PK.walnutDark, trav = PK.travertine, blk = PK.matBlack, quartz = P.quartz;
    const white = phys({ color: '#f4f2ee', roughness: 0.15, clearcoat: 0.8 }), steel = std({ color: '#cfd3d6', metalness: 1, roughness: 0.22 });
    const brass = std({ color: '#b08d57', metalness: 1, roughness: 0.3 }), sage = fabric('#9aa88c', 1.4), rubber = std({ color: '#3a3d3f', roughness: 0.95 });
    const zellige = canvasTex(512, 512, (g, w, h) => {                        // glossy sage handmade tiles, 8 × 8
      g.fillStyle = '#e9e6dd'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const t = 0.88 + Math.random() * 0.2; g.fillStyle = `rgb(${142 * t | 0},${162 * t | 0},${138 * t | 0})`; g.fillRect(c * 64 + 2, r * 64 + 2, 60, 60);
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(c * 64 + 6, r * 64 + 6, 30, 18); }
    });
    zellige.repeat.set(6, 2);
    const tileM = phys({ map: zellige, roughness: 0.25, clearcoat: 0.6 });
    bx(862, 352, 862.5, 455, 0, 1.5, tileM, { collide: false });              // wet wall wainscot (west)
    bx(862, 352, 862.7, 455, 1.5, 1.53, brass, { collide: false, cast: false });   // brass trim

    // bathing tub (raised, walk-in for big dogs): travertine base, white tub, quartz rim, walnut front, steps
    bx(862.5, 378, 879, 424, 0, 0.6, trav);
    for (const [a, b, c, d] of [[862.5, 378, 864.5, 424], [877, 378, 879, 424], [864.5, 378, 877, 380], [864.5, 422, 877, 424]]) { bx(a, b, c, d, 0.6, 0.88, white); bx(a - 0.2, b - 0.2, c + 0.2, d + 0.2, 0.88, 0.9, quartz, { collide: false }); }
    bx(864.5, 380, 877, 422, 0.6, 0.63, white, { collide: false });
    { const [x, z] = W(870.5, 416); mesh(world, new THREE.CircleGeometry(0.05, 20), steel, x, 0.632, z, -Math.PI / 2); }
    bx(879, 378.5, 879.4, 423.5, 0.06, 0.6, walnut, { collide: false });
    for (let iy = 381; iy < 423; iy += 2.2) bx(879.4, iy, 879.7, iy + 0.6, 0.08, 0.58, walnut, { collide: false, cast: false });   // flutes
    for (const [a, c, h] of [[887, 891, 0.24], [883, 887, 0.48], [879.7, 883, 0.7]]) { bx(a, 384, c, 398, 0, h, walnut); bx(a + 0.2, 384.5, c - 0.2, 397.5, h, h + 0.01, rubber, { collide: false }); }
    { // wall faucet + handheld sprayer on a slide bar
      const f = new THREE.Group(); cylinder(f, 0.03, 0.03, 0.1, steel, 0, 0, 0, 16); const sp = mesh(f, new THREE.CylinderGeometry(0.018, 0.018, 0.3, 12), steel, 0, 0.05, 0.15); sp.rotation.x = Math.PI / 2;
      mesh(f, new THREE.CylinderGeometry(0.018, 0.018, 0.08, 12), steel, 0, 0.01, 0.3);
      putI(f, 862.6, 392, look(862.6, 392, 880, 392), 1.05);
      const s = new THREE.Group(); rb(s, 0.025, 0.7, 0.025, steel, 0, 0, 0, 0.005); rb(s, 0.07, 0.18, 0.07, steel, 0, 0.45, 0.05, 0.02); cylinder(s, 0.05, 0.05, 0.03, steel, 0, 0.6, 0.06, 20);
      putI(s, 862.7, 410, look(862.7, 410, 880, 410), 1.0);
      const dr = new THREE.Group(); rb(dr, 0.36, 0.28, 0.18, white, 0, 0, 0.09, 0.04); const nz = mesh(dr, new THREE.CylinderGeometry(0.035, 0.05, 0.16, 16), steel, 0.12, 0.1, 0.2); nz.rotation.x = Math.PI / 2;   // wall dryer
      putI(dr, 862.6, 384, look(862.6, 384, 880, 384), 1.6);
    }

    // grooming table: walnut cabinet, quartz top, rubber mat, stainless grooming arm; open shelves with towels above
    bx(862.5, 428, 878, 452, 0, 0.06, blk); bx(862.5, 428, 878, 452, 0.06, 0.82, walnut);
    for (const iy of [434, 440, 446]) bx(878, iy, 878.4, iy + 0.4, 0.12, 0.76, blk, { collide: false, cast: false });   // door reveals
    bx(862.3, 427.7, 878.3, 452.3, 0.82, 0.86, quartz, { collide: false }); bx(864, 431, 876, 449, 0.86, 0.875, rubber, { collide: false });
    { const [x, z] = W(864, 449); cylinder(world, 0.018, 0.018, 1.05, steel, x, 0.86, z, 12); const [x2, z2] = W(869, 449); const arm = mesh(world, new THREE.CylinderGeometry(0.016, 0.016, 0.3, 12), steel, (x + x2) / 2, 1.9, (z + z2) / 2); arm.rotation.set(0, 0, 0); arm.lookAt(x2, 1.9, z2); arm.rotateX(Math.PI / 2);
      const loop = mesh(world, new THREE.TorusGeometry(0.07, 0.006, 8, 24), std({ color: '#a24a2e', roughness: 0.6 }), x2, 1.75, z2); }
    const towel = [std({ color: '#f3efe6', roughness: 0.95 }), std({ color: '#9aa88c', roughness: 0.95 }), std({ color: '#d9cbb3', roughness: 0.95 })];
    for (const y of [1.6, 2.0]) { bx(862.5, 428, 869, 452, y, y + 0.04, walnut, { collide: false });
      for (let iy = 430; iy < 450; iy += 3.6) { const [x, z] = W(865.6, iy + 1.6); const t = mesh(world, new THREE.CylinderGeometry(0.085, 0.085, 0.32, 18), towel[(iy / 3.6 | 0) % 3], x, y + 0.125, z); t.rotation.x = Math.PI / 2; } }

    // storage wall (east): tall fluted walnut cabinet with brass pulls
    bx(902, 352, 913, 392, 0, 0.06, blk); bx(902, 352, 913, 392, 0.06, 2.4, walnut);
    for (let iy = 353; iy < 391.5; iy += 1.6) bx(901.6, iy, 902, iy + 0.7, 0.1, 2.36, walnut, { collide: false, cast: false });
    for (const iy of [362, 372, 382]) bx(901.2, iy - 0.3, 901.6, iy + 0.3, 0.9, 1.4, brass, { collide: false, cast: false });
    // bench with sage cushion + leash hooks and a framed print above; bowls on a walnut stand
    bx(905, 398, 913, 428, 0, 0.42, walnut); bx(905.3, 398.3, 912.8, 427.7, 0.42, 0.5, sage, { collide: false });
    const leash = [std({ color: '#a24a2e', roughness: 0.6 }), std({ color: '#2f4f6f', roughness: 0.6 }), std({ color: '#c9a24a', roughness: 0.6 })];
    [402, 409, 416, 423].forEach((iy, i) => { bx(911.5, iy, 913, iy + 0.8, 1.5, 1.55, brass, { collide: false }); if (i < 3) bx(911.8, iy + 0.1, 912.2, iy + 0.7, 1.05, 1.5, leash[i], { collide: false, cast: false }); });
    bx(912.6, 403, 913, 423, 1.7, 2.3, walnut, { collide: false }); bx(912.4, 404, 912.6, 422, 1.76, 2.24, std({ color: '#e8e1d2', roughness: 0.9 }), { collide: false });
    bx(889, 448, 903, 454, 0, 0.12, walnut);                                   // feeding stand with two bowls
    for (const a of [892.5, 899.5]) { const [x, z] = W(a, 451); lathe(world, [[0, 0], [0.09, 0], [0.11, 0.07], [0.1, 0.07], [0.085, 0.01], [0, 0.01]], steel, x, 0.12, z, 24); }
    // dog beds: round oat bolster beds + cushion
    for (const [a, b, s] of [[889, 371, 1], [884, 438, 0.8]]) {
      const [x, z] = W(a, b); cylinder(world, 0.45 * s, 0.45 * s, 0.08, fabric('#d9cbb3', 1.4), x, 0, z, 32);
      const r = mesh(world, new THREE.TorusGeometry(0.4 * s, 0.1 * s, 14, 40), fabric('#cbbba0', 1.4), x, 0.12, z, Math.PI / 2); r.scale.z = 1.2;
      cylinder(world, 0.36 * s, 0.36 * s, 0.06, sage, x, 0.08, z, 32);
    }
    for (const b of [372, 430]) putI(conePendant(1.8), 889, b, 0, 0, ceilingGroup);
    { const l = addLight(new THREE.PointLight('#ffd6a8', 1.1, 6, 2)); const [x, z] = W(888, 402); l.position.set(x, 2.3, z); world.add(l); }
  }

  // ---------------------------------------------------------------------------
  // CHURRASQUEIRA (13) – covered gourmet space: masonry grill + counter, island, round table
  // ---------------------------------------------------------------------------
  // Plan (measured): space ix 975–1059 × iy 148–295 (≈ 4.6 × 8.0 m). Along the north wall: masonry churrasqueira
  // (ix 980–993) + 3.5 m counter (sink ≈ ix 1013, cooktop ≈ 1042–1054), depth ≈ 0.76 m. Island ix 996–1038 × iy 194–218
  // with 3 chairs on its south side; round table Ø 1.2 m at (1016, 252) with 6 chairs. West wall stub ix 972–975 down to
  // iy 178 (then the pet place hedge), east: solid to iy 180, then glass to the quadra. Covered by a wood-slat ceiling.
  {
    const walnut = PK.walnutDark, trav = PK.travertine, blk = PK.matBlack, steel = PK.steel;
    const brick = std({ color: '#7a4a35', roughness: 0.9 }), stoneD = std({ color: '#3d3a37', roughness: 0.6 });
    bx(972, 143, 1059, 149, 2.6, 3.0, M.wall, { collide: false });            // neighbour wall topped up to the churrasqueira ceiling
    bx(972, 148, 975, 178, 0, 3.0, M.wall);                                    // west wall stub (plan)
    // masonry churrasqueira: dark stone base, brick firebox, steel grate, tapered hood to the ceiling
    bx(980, 148, 993, 162, 0, 0.9, stoneD); bx(979.8, 147.8, 993.2, 162.4, 0.9, 0.94, trav, { collide: false });
    bx(981.5, 149, 991.5, 161.2, 0.94, 1.45, brick); bx(982.5, 149.5, 990.5, 161.4, 0.98, 1.4, blk, { collide: false, cast: false });   // firebox
    for (let ix = 983; ix < 990.5; ix += 0.9) bx(ix, 152, ix + 0.25, 161.3, 1.1, 1.12, steel, { collide: false, cast: false });       // grate (espetos)
    bx(980, 148, 993, 158, 1.45, 3.0, stoneD, { collide: false });             // hood / chimney breast
    bx(979.8, 157.8, 993.2, 158.2, 1.45, 1.5, trav, { collide: false });
    // counter (sink + cooktop + open shelves) along the north wall
    putI(kitchenWallB(3.55, 0.76), 1025.5, 155.2, look(1025.5, 155.2, 1025.5, 170)); solidI(993, 148, 1058, 162);
    // island with three chairs (plan), travertine with a walnut-front
    bx(996, 194, 1038, 218, 0, 0.06, blk); bx(996.3, 194.3, 1037.7, 213, 0.06, 0.9, walnut);
    for (let ix = 997; ix < 1037.5; ix += 0.9) bx(ix, 213, ix + 0.4, 213.3, 0.08, 0.88, walnut, { collide: false, cast: false });
    bx(995.5, 193.5, 1038.5, 219, 0.9, 0.95, trav);                              // top, overhangs the seating side
    // round walnut table Ø 1.2 m + 6 chairs
    { const t = new THREE.Group(); cylinder(t, 0.6, 0.6, 0.04, walnut, 0, 0.72, 0, 48); cylinder(t, 0.1, 0.28, 0.72, walnut, 0, 0, 0, 32);
      cylinder(t, 0.12, 0.12, 0.12, std({ color: '#d9cdb8', roughness: 0.6 }), 0, 0.76, 0, 24); putI(t, 1016, 252); solidI(1005, 241, 1027, 263); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6, ix = 1016 + Math.cos(a) * 17, iy = 252 + Math.sin(a) * 17; putI(diningChairB(), ix, iy, look(ix, iy, 1016, 252)); }
    // wood-slat ceiling at 3.0 m, pendants over the island and the table
    for (let iy = 149; iy < 294; iy += 2.6) bx(975, iy, 1059, iy + 1.3, 2.93, 2.99, P.walnut, { collide: false, cast: false });
    for (const a of [1008, 1026]) putI(conePendant(1.95), a, 206, 0, 0.4, ceilingGroup);
    putI(conePendant(1.85), 1016, 252, 0, 0.4, ceilingGroup);
    for (const [a, b] of [[1017, 206], [1016, 252], [1000, 160]]) { const l = addLight(new THREE.PointLight('#ffd7a0', 2, 7, 2)); const [x, z] = W(a, b); l.position.set(x, 2.5, z); world.add(l); }
    putI(ficusTreeB(2.6), 1050, 176, 0.3); solidI(1045, 171, 1055, 181);
  }

  // ---------------------------------------------------------------------------
  // QUADRA RECREATIVA (14) – plan: court ix 1064–1324 × iy 153–293 (≈ 14.2 × 7.6 m) with basketball lines, hoops at
  // both ends (posts against the end walls) and futsal goals under them; render: tall walls painted in two-tone ochre
  // organic shapes, dark frame + chain-link screen above them, glass wall with a door to the churrasqueira (west).
  // ---------------------------------------------------------------------------
  {
    const CX0 = 1064, CX1 = 1324, CY0 = 153, CY1 = 293;
    // ---- painted court: light sand base, ochre organic field (plan), white lines ----
    const courtT = canvasTex(1024, 2048, (g, w, h) => {
      const P2 = (ix, iy) => [(iy - CY0) / (CY1 - CY0) * w, (ix - CX0) / (CX1 - CX0) * h];   // image px → canvas
      g.fillStyle = '#d8cdb8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c4904f';
      const blob = pts => { const q = pts.map(p => P2(...p)), n = q.length, mid = i => [(q[i % n][0] + q[(i + 1) % n][0]) / 2, (q[i % n][1] + q[(i + 1) % n][1]) / 2];   // smooth closed curve through the midpoints
        g.beginPath(); g.moveTo(...mid(0)); for (let i = 1; i <= n; i++) g.quadraticCurveTo(...q[i % n], ...mid(i)); g.closePath(); g.fill(); };
      blob([[1180, 153], [1180, 175], [1160, 182], [1140, 180], [1120, 178], [1075, 180], [1066, 185], [1066, 210], [1066, 245], [1066, 262], [1080, 262], [1110, 268], [1130, 262], [1160, 262],
        [1185, 280], [1185, 293], [1215, 293], [1215, 280], [1222, 262], [1255, 262], [1290, 270], [1310, 262], [1320, 250], [1322, 200], [1310, 185], [1280, 182], [1250, 178], [1235, 168], [1215, 160], [1212, 153]]);
      g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round';
      const line = (a, b) => { g.beginPath(); g.moveTo(...P2(...a)); g.lineTo(...P2(...b)); g.stroke(); };
      const arc = (ix, iy, r, a0, a1) => { g.beginPath(); for (let i = 0; i <= 48; i++) { const a = a0 + (a1 - a0) * i / 48, p = P2(ix + Math.cos(a) * r, iy + Math.sin(a) * r); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); };
      const L0 = 1072, L1 = 1316, T0 = 160, T1 = 286, MID = (L0 + L1) / 2, MY = (T0 + T1) / 2;
      line([L0, T0], [L1, T0]); line([L1, T0], [L1, T1]); line([L1, T1], [L0, T1]); line([L0, T1], [L0, T0]);
      line([MID, T0], [MID, T1]); arc(MID, MY, 16, 0, Math.PI * 2);
      for (const s of [1, -1]) {                                              // keys, free-throw circles, three-point arcs
        const e = s > 0 ? L0 : L1, ft = e + s * 46, hoop = e + s * 16;
        line([e, MY - 16], [ft, MY - 16]); line([e, MY + 16], [ft, MY + 16]); line([ft, MY - 16], [ft, MY + 16]);
        arc(ft, MY, 16, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5);
        line([e, MY - 56], [e + s * 22, MY - 56]); line([e, MY + 56], [e + s * 22, MY + 56]);
        const a = Math.acos(56 / 61); arc(hoop, MY, 61, s > 0 ? -Math.PI / 2 + a : Math.PI / 2 + a, s > 0 ? Math.PI / 2 - a : Math.PI * 1.5 - a);
      }
      line([L0 + 70, T0 + 14], [L1 - 70, T0 + 14]); line([L0 + 70, T1 - 14], [L1 - 70, T1 - 14]);   // inner futsal box (plan)
      line([L0 + 70, T0 + 14], [L0 + 70, T1 - 14]); line([L1 - 70, T0 + 14], [L1 - 70, T1 - 14]);
    });
    { const [xa, za] = W(CX0, CY0), [xb, zb] = W(CX1, CY1), w = Math.abs(xb - xa), d = Math.abs(zb - za);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std({ map: courtT, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -12 }));
      m.rotation.x = -Math.PI / 2; m.position.set((xa + xb) / 2, 0.006, (za + zb) / 2); m.receiveShadow = true; world.add(m); }

    // ---- painted walls (render): sand base with sweeping ochre / caramel shapes, 4 m high ----
    const wallT = (seed, wpx) => canvasTex(wpx, 512, (g, w, h) => {
      g.fillStyle = '#ead9b3'; g.fillRect(0, 0, w, h);
      let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
      for (const [col, k] of [['#c98a43', 0], ['#dcb57c', 1], ['#c98a43', 2]]) {
        const x0 = w * (0.12 + 0.3 * k + rnd() * 0.08), x1 = x0 + w * (0.12 + rnd() * 0.08);
        g.fillStyle = col; g.beginPath(); g.moveTo(x0 - w * 0.08, h);
        g.bezierCurveTo(x0, h * 0.6, x0 - w * 0.06, h * 0.35, x0 - w * 0.12, 0); g.lineTo(x1 + w * 0.1, 0);
        g.bezierCurveTo(x1 + w * 0.02, h * 0.3, x1 + w * 0.08, h * 0.65, x1 + w * 0.16, h); g.closePath(); g.fill();
      }
    });
    const WH = 4.0, wallN = std({ map: wallT(7, 2048), roughness: 0.85 }), wallE = std({ map: wallT(3, 1024), roughness: 0.85 });
    bx(CX0, 149.2, CX1 + 6, CY0, 0, WH, wallN);                              // north (in front of the neighbour wall)
    bx(CX1, CY0, CX1 + 6, CY1 + 4, 0, WH, wallE);                            // east end
    // south: low painted wall + chain-link up to the podium slab (plan: wall | white rail in the middle | wall)
    bx(CX0, CY1, CX1, CY1 + 4, 0, 0.9, wallN);
    // ---- dark frame + chain-link screen above the walls and on the south side ----
    const chain = (len, hgt) => { const t = canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(70,70,72,1)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); });
      t.repeat.set(len / 0.12, hgt / 0.12); return std({ map: t, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.5 }); };
    const fr = std({ color: '#3b3029', roughness: 0.5, metalness: 0.4 });
    const screen = (a, b, c, d, y0, y1) => {                                  // posts every ~3 m, top + mid rails, mesh panel
      const alongIx = Math.abs(c - a) > Math.abs(d - b), L = (alongIx ? c - a : d - b) / 18.33;
      const m = chain(L, y1 - y0); alongIx ? bx(a, b + 0.9, c, b + 1.1, y0, y1, m, { collide: false, cast: false }) : bx(a + 0.9, b, a + 1.1, d, y0, y1, m, { collide: false, cast: false });
      const n = Math.max(1, Math.round(L / 3));
      for (let i = 0; i <= n; i++) { const t = (alongIx ? a : b) + (alongIx ? c - a : d - b) * i / n; alongIx ? bx(t - 0.8, b, t + 0.8, b + 2, y0, y1 + 0.05, fr, { collide: false }) : bx(a, t - 0.8, a + 2, t + 0.8, y0, y1 + 0.05, fr, { collide: false }); }
      for (const y of [y1 - 0.06, (y0 + y1) / 2]) alongIx ? bx(a, b + 0.5, c, b + 1.5, y, y + 0.06, fr, { collide: false }) : bx(a + 0.5, b, a + 1.5, d, y, y + 0.06, fr, { collide: false });
    };
    screen(CX0, 150, CX1 + 6, 150, WH, 6.5); screen(CX1 + 2, CY0, CX1 + 2, CY1 + 4, WH, 6.5);
    // entrance end (render): dark bronze frame – glazing grid, a deep beam over it, chain-link 'grade' above up to 6.5 m
    const brownW = std({ color: '#93623a', roughness: 0.85 });                 // solid panel + low sill wall (render, marked)
    bx(1064, 148.5, 1064.6, 200.3, 0, 2.75, brownW, { collide: false });
    for (const [a, c] of [[200.3, 246.3], [287.3, 294.5]]) bx(1064, a, 1064.6, c, 0, 0.5, brownW, { collide: false });
    for (const iy of [212, 223.5, 235]) bx(1064, iy - 0.45, 1064.6, iy + 0.45, 0.5, 2.75, fr, { collide: false });
    for (const iy of [201, 247, 287, 293.8]) bx(1064.6, iy - 0.7, 1065, iy + 0.7, 0, 2.75, fr, { collide: false });
    for (const [a, c] of [[200.3, 246.3], [287.3, 294.5]]) bx(1064.6, a, 1064.9, c, 0.5, 0.56, fr, { collide: false });
    bx(1064.6, 200.3, 1064.9, 294.5, 2.4, 2.48, fr, { collide: false });
    bx(1063.9, 148, 1065.2, 297, 2.75, 3.25, fr, { collide: false });          // beam
    bx(1058.8, 148, 1059, 295, 2.75, 3.0, fr, { collide: false });             // beam face on the churrasqueira side
    screen(1061.5, 149.2, 1061.5, CY1 + 4, 3.25, 6.5);
    screen(CX0, CY1 + 1, CX1, CY1 + 1, 0.9, 2.85); solidI(CX0, CY1, CX1, CY1 + 4);   // south screen (+ its collider)
    // ---- hoops (posts against the end walls) with futsal goals under them ----
    const white = std({ color: '#f4f4f2', roughness: 0.4 }), board = std({ color: '#ffffff', transparent: true, opacity: 0.55, roughness: 0.05 });
    const netT = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#f2f2f2'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2); });
    const netM = (rx, ry) => { const t = netT.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return std({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }); };
    for (const s of [1, -1]) {
      const e = s > 0 ? CX0 : CX1, MY = 223;
      bx(e + s * 1.5, MY - 2, e + s * 4.5, MY + 2, 0, 3.45, fr);                // hoop post (clear of the glazing frame)
      bx(e + s * 4.5, MY - 1, e + s * 13.8, MY + 1, 3.25, 3.35, fr, { collide: false });   // arm (no faces shared with the post)
      bx(e + s * 14.2, MY - 15.6, e + s * 14.8, MY + 15.6, 2.95, 3.9, board, { collide: false, cast: false });   // glass sits inside the frame
      { const p = MY - 16, q = MY + 16;                                         // white frame: sides full height, top/bottom between them
        bx(e + s * 13.8, p, e + s * 15.2, p + 0.5, 2.9, 3.95, white, { collide: false }); bx(e + s * 13.8, q - 0.5, e + s * 15.2, q, 2.9, 3.95, white, { collide: false });
        bx(e + s * 13.8, p + 0.5, e + s * 15.2, q - 0.5, 3.9, 3.95, white, { collide: false }); bx(e + s * 13.8, p + 0.5, e + s * 15.2, q - 0.5, 2.9, 2.95, white, { collide: false }); }
      { const [x, z] = W(e + s * 19.5, MY); mesh(world, new THREE.TorusGeometry(0.23, 0.012, 8, 32), std({ color: '#e0592a', roughness: 0.5 }), x, 3.05, z, Math.PI / 2);
        const net = mesh(world, new THREE.CylinderGeometry(0.23, 0.15, 0.4, 16, 1, true), netM(8, 3), x, 2.85, z); }
      // futsal goal 3 × 2 m, mouth towards the court, net back to the post
      const g0 = e + s * 12, g1 = e + s * 5, Y0 = MY - 27.5, Y1 = MY + 27.5;
      for (const iy of [Y0, Y1]) bx(g0 - 0.9, iy - 0.9, g0 + 0.9, iy + 0.9, 0, 2.0, white);
      bx(g0 - 0.9, Y0 - 0.9, g0 + 0.9, Y1 + 0.9, 2.0, 2.08, white, { collide: false });
      const lo = Math.min(g0, g1), hi = Math.max(g0, g1);
      bx(g1, Y0, g1 + 0.2 * s, Y1, 0, 2.0, netM(30, 10), { collide: false, cast: false });                 // back net
      bx(lo, Y0, hi, Y1, 1.99, 2.0, netM(4, 30), { collide: false, cast: false });                           // top net
      for (const iy of [Y0, Y1]) bx(lo, iy, hi, iy + 0.2, 0, 2.0, netM(4, 10), { collide: false, cast: false });
    }
    // ---- soccer ball (render) ----
    { const ballT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#f6f6f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1b';
        for (let i = 0; i < 12; i++) { const x = (i % 6) * w / 6 + (i < 6 ? 0 : w / 12), y = i < 6 ? h * 0.3 : h * 0.72; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); } g.fill(); } });
      const [x, z] = W(1096, 278); mesh(world, new THREE.SphereGeometry(0.11, 32, 20), std({ map: ballT, roughness: 0.5 }), x, 0.11, z, 0.4, 0.8, 0); }
    // ---- flood lights on the north screen posts ----
    for (const a of [1120, 1194, 1268]) { const [x, z] = W(a, 152); const l = addLight(new THREE.PointLight('#fff4e0', 2.2, 12, 2)); l.position.set(x - 0.6, 5.8, z); world.add(l);
      bx(a - 3, 151, a + 3, 155, 6.0, 6.25, std({ color: '#2a2a2a', roughness: 0.5 }), { collide: false }); bx(a - 2.5, 154.9, a + 2.5, 155.1, 6.03, 6.22, P.led, { collide: false, cast: false }); }
  }

  // ---------------------------------------------------------------------------
  // ESTACIONAMENTO (16) – stall lines and cars
  // ---------------------------------------------------------------------------
  const line = std({ color: '#f2f2ee', roughness: 0.8 }), LN = (a, b, c, d) => bx(a, b, c, d, 0.003, 0.008, line, { collide: false, cast: false });
  const vLines = (xs, y0, y1) => xs.forEach(x => LN(x - 0.6, y0, x + 0.6, y1)), hLine = (y, x0, x1) => LN(x0, y - 0.6, x1, y + 0.6);
  // north block (plan): double-depth stalls between the core and the drive aisle, split at iy 624
  vLines([488, 540, 594, 639, 671, 717, 764, 810, 861, 914, 958, 1002], 539, 710); hLine(539, 488, 1002); hLine(624, 488, 1002); hLine(710, 488, 1056);
  // south-west block + south-east block (beside the ramp)
  vLines([488, 536, 580, 625, 671, 717, 761, 802], 815, 900); hLine(815, 488, 802);
  vLines([931, 975, 1022, 1068, 1112], 815, 900); hLine(815, 931, 1112); hLine(900, 931, 1112); vLines([931, 1022, 1112], 910, 953); hLine(910, 931, 1112); hLine(953, 931, 1112);
  // middle column (plan): stalls across, then motorbike bays
  vLines([1057, 1142], 301, 492); [301, 351, 397, 446, 492].forEach(y => hLine(y, 1057, 1142));
  vLines([1057, 1142], 528, 666); [528, 574, 620, 666].forEach(y => hLine(y, 1057, 1142));
  vLines([1064, 1083, 1102, 1121], 673, 709); hLine(673, 1064, 1121); hLine(709, 1064, 1121);
  // along Rua Platina
  vLines([1241], 301, 975); [301, 351, 429, 478, 521, 567, 613, 655, 702, 744, 790, 836, 882, 928, 974].forEach(y => hLine(y, 1241, 1326));
  // accessible bays: blue fill, white symbol, hatched transfer zone
  for (const [b, d] of [[978, 1024], [1044, 1091]]) { bx(1241, b, 1326, d, 0.003, 0.007, std({ color: '#3b6fb6', roughness: 0.8 }), { collide: false, cast: false });
    const [x, z] = W(1284, (b + d) / 2); const sym = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 32), line); sym.rotation.x = -Math.PI / 2; sym.position.set(x, 0.009, z); world.add(sym);
    const hd = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), line); hd.rotation.x = -Math.PI / 2; hd.position.set(x - 0.15, 0.009, z - 0.55); world.add(hd); }
  for (let ix = 1243; ix < 1324; ix += 5) LN(ix, 1025, ix + 2.2, 1043);
  // ramp areas: slightly darker concrete with white direction arrows
  fl(805, 815, 926, 1095, concreteTex, 1.4, 0.9, 0.004); fl(928, 972, 1114, 1095, concreteTex, 1.4, 0.9, 0.004);
  for (const [a, b] of [[865, 880], [865, 1000]]) { LN(a - 0.8, b, a + 0.8, b + 40); const [x, z] = W(a, b); const tri = new THREE.Mesh(new THREE.CircleGeometry(0.6, 3), line); tri.rotation.set(-Math.PI / 2, 0, Math.PI); tri.position.set(x, 0.009, z); world.add(tri); }
  for (const [a, b, dir, c] of [[736, 581, 'down', 'obsidian'], [560, 666, 'up', 'graphite'], [1031, 666, 'up', 'midnight'], [1098, 378, 'right', 'pearl'],
    [1282, 407, 'left', 'silver'], [1284, 592, 'left', 'burgundy'], [644, 857, 'down', 'champagne'], [952, 857, 'down', 'pearl'], [1088, 857, 'down', 'racing'], [1282, 905, 'left', 'obsidian']])
    car(a, b, dir, c);
}
