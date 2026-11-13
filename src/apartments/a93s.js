// 93 m² apartment – VARIANT "living ampliado": Dorm. 02 removed and merged into the living room,
// as in the brochure's "LIVING DO APTO. 93m2" perspective (which is also drawn mirrored).
// Copied from a93.js; differences are marked "VARIANT". The living room becomes ≈ 4.9 m wide
// (TV on the old Dorm. 02 west wall) and opens onto the terrace through a ≈ 4 m sliding door.
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PX, X, Z } from '../engine/plan.js';
import {
  FACE, H, M, P, RBG, acSplit, addLight, at, bedB, benchUphB, books, box, caneChairB, canvasTex,
  ceilingGroup, chestB, colliders, concreteTex, cove, curtain, cylinder, deskB, faucet, floatStandB,
  floor, floorWoodTex, fridgeB, glassPendant, item, kitchenRunB, lathe, laundryRunB, mesh, phys,
  plantB, porcelainTex, pothos, railingBars, rainShower, rb, rollerBlind, roundChairB, rug,
  rustChairB, sanca, sofaB, std, tableB, tableLamp, terraceTex, tileBox, toiletB, towelRail,
  tvOnWall, tvSlim, vanity2B, vase, wall, wardrobeB, wineB, woodClad, world, worldRb,
  armchairB, roundCoffeeB, barCabB,
} from '../engine/core.js';

export function build() {
  // ---------------------------------------------------------------------------
  // SLABS, FLOORS, CEILING
  // ---------------------------------------------------------------------------
  for (const [a, b, c, d] of [[722, 287, 1925, 1045], [1180, 1045, 1925, 1170]]) {
    box(a, b, c, d, -0.3, 0, M.extWall, { collide: false });
    box(a, b, c, d, H, H + 0.3, M.extWall, { collide: false, parent: ceilingGroup });
    const w = X(c) - X(a), dd = Z(d) - Z(b);
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, dd), M.ceiling);
    ce.rotation.x = Math.PI / 2; ce.position.set(X(a) + w / 2, H - 0.001, Z(b) + dd / 2); ce.receiveShadow = true;
    ceilingGroup.add(ce);
  }
  floor(1075, 310, 1900, 850, porcelainTex, 0.9, 0.22);                  // living / dining / kitchen / hall / foyer
  floor(747, 310, 1075, 562, floorWoodTex, 1.6, 0.5, 0.003);              // dorm 01
  floor(747, 577, 1185, 735, floorWoodTex, 1.6, 0.5, 0.003);              // suíte (closet side)
  floor(747, 735, 1005, 905, floorWoodTex, 1.6, 0.5, 0.003);              // suíte (bed side)
  // VARIANT: no dorm 02 wood floor – the living porcelain runs through
  floor(1090, 310, 1340, 440, porcelainTex, 0.9, 0.25, 0.004);            // banho 02
  floor(1352, 310, 1478, 445, porcelainTex, 0.9, 0.25, 0.004);            // lavabo
  floor(1022, 735, 1175, 1012, porcelainTex, 0.9, 0.25, 0.004);           // banho 01
  floor(1205, 850, 1900, 1150, terraceTex, 0.9, 0.5, 0.002);              // terraço + serviço
  floor(747, 925, 990, 1030, concreteTex, 1.0, 0.8, 0.002);               // área técnica

  // ---------------------------------------------------------------------------
  // WALLS (traced from the plan)
  // ---------------------------------------------------------------------------
  wall(722, 287, 1925, 310, [
    { from: 1272, to: 1338, sill: 1.6, glass: 'window' },                // banho 02 ventilation window
    { from: 1725, to: 1812 },                                             // FRONT DOOR
  ]);
  wall(722, 310, 747, 1045, [{ from: 378, to: 545, sill: 0.9, top: 2.2, glass: 'window' }]);   // dorm 01 window
  wall(1900, 287, 1925, 1170);
  wall(747, 1030, 1005, 1045, [{ from: 760, to: 960, sill: 0.2, top: 2.3, glass: 'window' }]); // área técnica louvre
  wall(1005, 1012, 1180, 1035, [{ from: 1065, to: 1145, sill: 1.5, glass: 'window' }]);       // banho 01 window
  wall(1180, 830, 1205, 1170);                                                                // terraço west wall
  box(990, 925, 1005, 1030, 0, H, M.wall);                                                    // shaft
  // bedrooms wing
  wall(747, 562, 1185, 577, [{ from: 1100, to: 1170 }]);                 // dorm 01 | suíte  (suíte door)
  wall(1075, 310, 1090, 562, [{ from: 478, to: 542 }]);                  // dorm 01 door
  wall(1005, 720, 1185, 735, [{ from: 1037, to: 1100 }]);                // suíte | banho 01 (banho door)
  wall(1005, 735, 1022, 1012);
  wall(1175, 735, 1185, 1012);
  wall(747, 905, 1005, 925, [{ from: 785, to: 1000, sill: 1.0, top: 2.2, glass: 'window' }]);  // suíte window → área técnica
  wall(1185, 577, 1200, 850);                                             // suíte / banho 01 | living – VARIANT: now the TV wall
  // VARIANT: dorm 02 door wall, dorm 02 | living wall and dorm 02 window removed
  // bathrooms on the north side
  wall(1090, 440, 1352, 455, [{ from: 1100, to: 1166 }]);                // banho 02 door
  wall(1340, 310, 1352, 455);
  wall(1352, 445, 1492, 460, [{ from: 1402, to: 1466 }]);                // lavabo door
  wall(1478, 310, 1492, 460);
  // living ↔ terraço / kitchen ↔ serviço sliding doors, partitions
  // VARIANT: one wide sliding door (≈ 4 m, leaves stacked open) from the grill shaft to the terrace shaft
  wall(1200, 830, 1700, 850, [{ from: 1252, to: 1650, top: 2.35, glass: 'open' }]);
  box(1252, 832, 1262, 848, 0, 2.35, M.frame, { collide: false }); box(1640, 832, 1650, 848, 0, 2.35, M.frame, { collide: false });   // door jambs
  box(1252, 832, 1650, 848, 2.32, 2.35, M.frame, { collide: false });                                                                 // head track
  curtain(1252, 1335, 830, -1); curtain(1567, 1650, 830, -1);            // sheers bunched at both sides, as in the render
  box(1700, 717, 1720, 1062, 0, H, M.wall);                               // terraço | serviço (back of the kitchen bar)
  wall(1720, 830, 1900, 850, [{ from: 1728, to: 1808, top: 2.3, glass: 'open' }]);   // narrower: single 0.8 m sliding door to the laundry
  wall(1815, 415, 1900, 430);                                             // foyer stub (fridge niche)
  box(1205, 850, 1250, 952, 0, H, M.wall);                                // shaft beside the grill
  box(1652, 850, 1685, 940, 0, H, M.wall);                                // shaft on the terrace
  railingBars(1205, 1150, 1900, 1170);
  // front door + building corridor / elevator lobby outside it
  box(1727, 296, 1810, 302, 0.005, 2.095, P.walnut);
  for (const [z0, z1] of [[302, 305], [293, 296]]) {
    box(1792, z0, 1795, z1, 0.98, 1.08, P.brass, { collide: false });
    box(1778, z0, 1795, z1, 1.02, 1.045, P.brass, { collide: false });
  }
  box(1745, 296.5, 1749, 301.5, 1.55, 1.59, P.brass, { collide: false });
  box(1500, 125, 2770, 287, -0.3, 0, M.extWall, { collide: false });
  floor(1500, 125, 2770, 287, porcelainTex, 0.9, 0.22, 0.002);
  box(1500, 125, 2770, 287, H, H + 0.3, M.extWall, { collide: false, parent: ceilingGroup });
  box(1500, 125, 2770, 287, H - 0.012, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  wall(1500, 110, 2770, 125);
  wall(1486, 110, 1500, 287);
  wall(1925, 279, 2770, 287, [{ from: 2300, to: 2387 }]);
  box(2302, 281, 2385, 286, 0.005, 2.095, P.walnut);
  for (const ex of [2000, 2125]) {
    box(ex, 125, ex + 101, 128, 0, 2.15, M.steel, { collide: false });
    box(ex + 50, 127.5, ex + 51, 128.3, 0.02, 2.13, P.black, { collide: false });
    box(ex + 108, 125, ex + 115, 127, 1.0, 1.25, P.black, { collide: false });
    box(ex + 110, 126.5, ex + 113, 127.6, 1.07, 1.1, P.led, { collide: false });
  }

  // ---------------------------------------------------------------------------
  // BEDROOM EXTRAS – framed art, roller blind on a wall running along z, wall sconce
  // ---------------------------------------------------------------------------
  function artMat(bg, cols) {
    const t = canvasTex(512, 640, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      cols.forEach((c, i) => {
        g.fillStyle = c; g.globalAlpha = 0.85;
        g.beginPath();
        if (i % 3 === 0) g.arc(w * (0.3 + 0.4 * Math.random()), h * (0.25 + 0.5 * Math.random()), w * (0.16 + 0.12 * Math.random()), 0, Math.PI * 2);
        else if (i % 3 === 1) { const y = h * (0.45 + 0.35 * Math.random()); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y - h * 0.2, w * 0.7, y + h * 0.15, w, y - h * 0.05); g.lineTo(w, h); g.lineTo(0, h); }
        else g.rect(w * 0.15 * Math.random(), h * 0.1, w * (0.25 + 0.3 * Math.random()), h * 0.06);
        g.fill();
      });
      g.globalAlpha = 1;
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return std({ map: t, roughness: 0.9 });
  }
  function wallArt(px, pz, w, h, yc, face, mat) {      // walnut float frame + print; face = direction it looks
    const g = new THREE.Group();
    rb(g, w, h, 0.03, P.walnut, 0, -h / 2, 0.015, 0.004);
    rb(g, w - 0.04, h - 0.04, 0.012, P.lacquer, 0, -h / 2 + 0.02, 0.026, 0.002);                   // mat board
    mesh(g, new THREE.PlaneGeometry(w - 0.1, h - 0.1), mat, 0, 0, 0.0335, 0, 0, 0, false);
    g.position.set(X(px), yc, Z(pz)); g.rotation.y = FACE[face]; world.add(g);
  }
  function rollerBlindZ(z0p, z1p, xWallP, dir, top = 2.2) {
    const z0 = Z(z0p), z1 = Z(z1p), xf = X(xWallP) + dir * 0.06, zc = (z0 + z1) / 2;
    mesh(world, RBG(0.08, 0.08, z1 - z0, 0.02), P.lacquer, xf, top - 0.04, zc);
    mesh(world, new THREE.PlaneGeometry(z1 - z0 - 0.04, 0.45), std({ color: '#e9e3d8', roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }), xf, top - 0.3, zc, 0, Math.PI / 2, 0, false);
  }
  function sconce(px, pz, y, face) {                    // black wall arm + opal globe (emissive only, no extra light)
    const g = new THREE.Group();
    cylinder(g, 0.04, 0.04, 0.015, P.brass, 0, 0, 0.0075, 24).rotation.x = Math.PI / 2;
    mesh(g, new THREE.CylinderGeometry(0.007, 0.007, 0.14, 10), P.black, 0, 0, 0.08, Math.PI / 2);
    mesh(g, new THREE.SphereGeometry(0.065, 24, 16), P.shade, 0, 0.02, 0.17, 0, 0, 0, false);
    g.position.set(X(px), y, Z(pz)); g.rotation.y = FACE[face]; world.add(g);
  }

  // ---------------------------------------------------------------------------
  // DORM 01 (3.25 × 2.50 m) – per the plan: single bed on the window wall, headboard to the south,
  // L of wardrobes (north wall + return), chest by the foot, desk on the south wall
  // ---------------------------------------------------------------------------
  item(wardrobeB, 842, 311, 1073, 366, 's');
  item(wardrobeB, 1017, 366, 1073, 452, 'w');
  item(bedB, 750, 372, 842, 560, 'n', true, { single: true, headH: 1.05, head: P.linen, throw: P.sage, accent: P.sage });
  item(deskB, 848, 512, 985, 560, 'n', true, { shelf: true, laptopX: 0.12 });
  item(chestB, 750, 313, 840, 366, 's');
  rollerBlindZ(378, 545, 747, 1);
  rug(852, 400, 1010, 505, P.rug);
  sanca(747, 366, 1075, 562, 35, 0.12);                                   // plaster sanca + indirect LED, as in the living room

  // ---------------------------------------------------------------------------
  // SUÍTE (4.29 m wide) – wardrobe wall + closet, walnut headboard wall with LED, floating
  // nightstands (plant / lamp as on the plan), bed facing the TV
  // ---------------------------------------------------------------------------
  rug(805, 645, 1000, 903, P.rugGray);
  item(wardrobeB, 750, 580, 1096, 636, 's');
  item(wardrobeB, 1106, 690, 1183, 719, 'n');
  woodClad(747, 645, 751, 903, 0, 1.32);                                    // headboard wall panel
  box(747, 645, 752, 903, 1.32, 1.335, P.walnut, { collide: false });
  box(751, 650, 752, 898, 1.305, 1.315, P.led, { collide: false, cast: false });
  item(bedB, 752, 707, 955, 860, 'e', true, { headH: 1.15 });
  item(floatStandB, 752, 662, 798, 704, 'e');
  item(floatStandB, 752, 862, 798, 903, 'e');
  tableLamp(X(775), 0.55, Z(683)); tableLamp(X(775), 0.55, Z(882));      // a lamp on each nightstand
  tvOnWall(X(1005), Z(808), 1.11, 0.64, 1.32, -1);
  acSplit(X(747), Z(785), 2.28, 1);
  curtain(785, 1000, 905, -1);
  sanca(747, 636, 1005, 905, 35, 0.12);                                   // sanca over the bed area (curtain rail hidden in it)

  // VARIANT: no DORM 02 – its area is part of the living room below

  // ---------------------------------------------------------------------------
  // BATHROOMS + LAVABO – quartzite feature walls with LED coves, greige shower tiles,
  // floating fluted vanities, black fittings
  // ---------------------------------------------------------------------------
  // banho 02
  box(1090, 310, 1256, 311, 0, H, P.quartz, { collide: false }); cove(Z(311), X(1090), X(1256), 1, true);
  item(vanity2B, 1092, 311, 1185, 362, 's');
  item(toiletB, 1198, 311, 1250, 378, 's');
  box(1256, 325, 1260, 440, 0, 2.0, M.glass, { cast: false }); box(1255, 324, 1261, 327, 0, 2.0, P.black, { collide: false });
  tileBox(1260, 310, 1340, 311, 0, 1.6); tileBox(1260, 310, 1340, 311, 2.1, H); tileBox(1339, 311, 1340, 439, 0, H); tileBox(1260, 439, 1339, 440, 0, H);
  rainShower(1300, 311, 1300, 362);
  towelRail(1090, 400, false, 1);
  // lavabo
  box(1352, 310, 1353.5, 445, 0, H, P.quartz, { collide: false }); cove(X(1353.5), Z(310), Z(445), 1);
  woodClad(1353.5, 310, 1478, 311.5);
  item(vanity2B, 1354, 378, 1392, 442, 'e');
  item(toiletB, 1410, 312, 1462, 378, 's');
  // banho 01
  box(1173.5, 735, 1175, 916, 0, H, P.quartz, { collide: false }); cove(X(1173.5), Z(735), Z(916), -1);
  item(vanity2B, 1122, 742, 1173, 905, 'w');
  item(toiletB, 1023, 838, 1083, 892, 'e');
  box(1022, 916, 1120, 920, 0, 2.0, M.glass, { cast: false }); box(1118, 915, 1122, 921, 0, 2.0, P.black, { collide: false });
  tileBox(1022, 920, 1023.5, 1012, 0, H); tileBox(1173.5, 920, 1175, 1011, 0, H);
  tileBox(1022, 1010.5, 1065, 1012, 0, H); tileBox(1145, 1010.5, 1175, 1012, 0, H);
  tileBox(1065, 1010.5, 1145, 1012, 0, 1.5); tileBox(1065, 1010.5, 1145, 1012, 2.1, H);
  rainShower(1023, 965, 1072, 965);
  towelRail(1022, 790, false, 1);
  // shower shelves (quartzite ledge, LED underneath, bottles)
  for (const [x0, x1, z0, z1, alongZ] of [[1332, 1339, 345, 400, true], [1023.5, 1031, 935, 995, true]]) {
    box(x0, z0, x1, z1, 1.05, 1.08, P.quartz, { collide: false });
    const cx = X((x0 + x1) / 2);
    [['#f2efe8', 0], ['#3b3a38', 1], ['#c9b79c', 2]].forEach(([c, i]) =>
      lathe(world, [[0, 0], [0.028, 0], [0.03, 0.17], [0.013, 0.2], [0, 0.2]], std({ color: c, roughness: 0.3 }), cx, 1.08, Z(z0 + 12 + i * 14), 20));
  }

  // ---------------------------------------------------------------------------
  // LIVING – light-wood TV wall with lit shelves + bio-fireplace, cream bouclé sofa, jute rug,
  // wood-rim glass coffee table, pink barrel armchair, plaster sanca with indirect light
  // ---------------------------------------------------------------------------
  // VARIANT: the TV wall moves to the old Dorm. 02 west wall (x = 1200); everything below is shifted
  // 252 px (2.5 m) west compared with a93.js, so the living room is ≈ 4.9 m wide instead of 2.4 m.
  const TX = -252;
  woodClad(1200, 577, 1203, 830);
  tvSlim(X(1203), Z(668), 1.65, 0.95, 1.42);
  // shelves column with LED + stone bio-fireplace at the bottom
  box(1455 + TX, 755, 1490 + TX, 829, 0, 0.14, P.quartz); box(1455 + TX, 755, 1490 + TX, 829, 0.56, 0.6, P.quartz);
  box(1455 + TX, 755, 1490 + TX, 760, 0.14, 0.56, P.quartz); box(1455 + TX, 824, 1490 + TX, 829, 0.14, 0.56, P.quartz);
  box(1455 + TX, 760, 1457 + TX, 824, 0.14, 0.56, P.black, { collide: false });
  box(1462 + TX, 770, 1478 + TX, 814, 0.14, 0.165, M.steel, { collide: false });
  for (const r of [0, Math.PI / 2.6, -Math.PI / 2.6]) {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.22), P.flame); fl.position.set(X(1470 + TX), 0.27, Z(792)); fl.rotation.y = Math.PI / 2 + r * 0.25; fl.renderOrder = 3; world.add(fl);
  }
  { const fire = addLight(new THREE.PointLight('#ff9a40', 0.9, 2.6, 2)); fire.position.set(X(1475 + TX), 0.35, Z(792)); world.add(fire); }
  box(1455 + TX, 752, 1488 + TX, 756, 0.6, H, P.walnut, { collide: false }); box(1455 + TX, 826, 1488 + TX, 830, 0.6, H, P.walnut, { collide: false });
  for (const y of [1.0, 1.4, 1.8, 2.2]) {
    box(1455 + TX, 756, 1486 + TX, 826, y, y + 0.03, P.walnut, { collide: false });
    box(1482 + TX, 758, 1484 + TX, 824, y - 0.006, y, P.led, { collide: false, cast: false });
  }
  books(world, X(1468 + TX), 1.03, Z(775), 4, 1.6); vase(world, X(1468 + TX), 1.03, Z(808), 0.8, P.sand);
  vase(world, X(1468 + TX), 1.43, Z(772), 1.0, P.black); vase(world, X(1470 + TX), 1.43, Z(800), 0.7, P.ceramic);
  { const pl = plantB(0, 0, 0.45, P.ceramic); pl.position.set(X(1468 + TX), 1.83, Z(792)); world.add(pl); }
  pothos(1468 + TX, 2.23, 791, { x0: -0.13, x1: 0.18, z0: -0.34, z1: 0.34 }, -0.9, 0.9, 6, 0.5);

  // VARIANT: large jute rug, straight cream bouclé sofa with its
  // back against the kitchen peninsula, ending at the terrace wall (no chaise, no side table)
  // and a dusty-pink barrel armchair facing the sofa
  rug(1290, 495, 1640, 815, P.jute);
  {
    const S = P.boucleW, back = 1695, seat = 1600;
    worldRb(seat, 552, back, 828, 0.06, 0.3, S, 0.03);                     // straight sofa (≈ 2.7 m): from the end of the peninsula to the terrace wall
    worldRb(back - 18, 552, back, 828, 0.3, 0.8, S, 0.05);                 // back frame on the peninsula side
    worldRb(seat, 552, back - 18, 570, 0.3, 0.6, S, 0.06);                 // north arm (in line with the peninsula's rounded end)
    worldRb(seat, 810, back - 18, 828, 0.3, 0.6, S, 0.06);                 // south arm (at the terrace wall)
    for (const [z0, z1] of [[570, 650], [650, 730], [730, 810]]) {
      worldRb(seat + 2, z0 + 1, back - 18, z1 - 1, 0.3, 0.45, S, 0.06);    // seat cushions
      worldRb(back - 38, z0 + 2, back - 18, z1 - 2, 0.45, 0.82, S, 0.07);  // back cushions
    }
    for (const [z0, z1, m] of [[585, 630, P.linen], [668, 714, P.boucleW], [750, 795, P.linen]])
      worldRb(back - 44, z0, back - 30, z1, 0.45, 0.88, m, 0.06);            // scatter cushions
    colliders.push({ x0: X(seat), x1: X(back), z0: Z(552), z1: Z(828) });
  }
  at(() => roundCoffeeB(0.5), 1465, 690, 0);                              // round wood-rim glass coffee table, centred on the sofa
  colliders.push({ x0: X(1465) - 0.5, x1: X(1465) + 0.5, z0: Z(690) - 0.5, z1: Z(690) + 0.5 });
  at(armchairB, 1290, 575, 1.25);
  colliders.push({ x0: X(1290) - 0.4, x1: X(1290) + 0.4, z0: Z(575) - 0.4, z1: Z(575) + 0.4 });
  sanca(1203, 462, 1698, 830, 45);

  // ---------------------------------------------------------------------------
  // DINING (by the lavabo): upholstered bench, wood table with a succulent planter, pink chairs
  // ---------------------------------------------------------------------------
  // VARIANT: dining table, bench and chairs by the lavabo removed (the table is on the terrace)
  // foyer planter by the front door
  function entryConsoleB(w, d) {                   // walnut console with fluted doors, stone top, potted plant, front +z
    const g = new THREE.Group(), y0 = 0.1, h = 0.72, top = y0 + h + 0.03;
    rb(g, w - 0.06, y0, d - 0.06, P.black, 0, 0, -0.02, 0.002);                       // recessed plinth
    rb(g, w, h, d - 0.02, P.walnut, 0, y0, -0.01, 0.004);
    const step = 0.02, n = Math.floor((w - 0.04) / step);
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0095, 0.0095, h - 0.02, 10), P.walnut, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(-w / 2 + 0.02 + step / 2 + i * step, y0 + h / 2, d / 2 - 0.012));
    im.castShadow = im.receiveShadow = true; g.add(im);
    rb(g, 0.004, h - 0.04, 0.004, P.black, 0, y0 + 0.02, d / 2 + 0.002, 0.001);       // door split
    rb(g, w + 0.01, 0.03, d + 0.01, P.quartz, 0, y0 + h, 0, 0.004);                    // stone top
    const pl = plantB(0, 0, 1.0, P.ceramic); pl.position.set(-w / 2 + 0.24, top, 0); g.add(pl);
    books(g, w / 2 - 0.2, top, 0, 2, 0.15);
    lathe(g, [[0, 0], [0.05, 0], [0.11, 0.04], [0.12, 0.06], [0.105, 0.058], [0.045, 0.01], [0, 0.01]], P.sand, w / 2 - 0.2, top + 0.06, 0, 32);
    return g;
  }
  item(entryConsoleB, 1866, 316, 1899, 412, 'w');

  // ---------------------------------------------------------------------------
  // ENTRANCE WALL (living side, between the lavabo corner and the front door) – walnut panelling to the ceiling with
  // built-in joinery: a wine corner (cabinet with a lit wine cooler, two floating shelves with LED, bottles and a decanter)
  // and a slim modern entrance table (stone top on a thin black frame, walnut shelf, round bronze mirror). VARIANT only.
  // ---------------------------------------------------------------------------
  woodClad(1492, 310, 1722, 313);
  // CORRIDOR (lavabo corner → dorm 01 door) – the same panelling on every corridor face. 1.1 px deep: covers the skirting
  // (0.9 px) but stays inside the walnut door casings (1.3 px), which are left free with a 6 px margin; above each door the
  // panel continues from the casing head to the ceiling.
  { const D = 1.1, HEAD = 2.1 + 0.07;
    const run = (face, dir, alongX, a0, a1, doors = []) => {     // dir: side of the face the corridor is on (+1 / -1)
      const c0 = dir > 0 ? face : face - D, c1 = dir > 0 ? face + D : face;
      const clad = (p0, p1, yb = 0, yt = H) => { if (p1 - p0 > 0.5) alongX ? woodClad(p0, c0, p1, c1, yb, yt) : woodClad(c0, p0, c1, p1, yb, yt); };
      let p = a0;
      for (const [d0, d1] of doors) { clad(p, d0 - 6); clad(d0 - 6, d1 + 6, HEAD, H); p = d1 + 6; }
      clad(p, a1);
    };
    run(1492, 1, false, 313, 460);                                  // lavabo east face (beside the wine wall)
    run(460, 1, true, 1352, 1492 + D, [[1402, 1466]]);               // lavabo front (lavabo door)
    run(1352, 1, false, 455, 460);                                  // small step between the two bath fronts
    run(455, 1, true, 1090 + D, 1352, [[1100, 1166]]);               // banho 02 front (banho door)
    run(1090, 1, false, 455, 562, [[478, 542]]);                     // corridor end – dorm 01 door wall
    run(562, -1, true, 1090 + D, 1185, [[1100, 1170]]);              // suíte wall (suíte door)
    run(1185, 1, false, 562 - D, 577);                              // notch between the suíte wall and the TV wall
    run(577, -1, true, 1185, 1200);                                  // …and its other side, up to the TV wall panelling
  }
  item(barCabB, 1500, 313, 1600, 358, 's');                                                   // wine cabinet with cooler
  { const bot = [std({ color: '#2b0a0e', roughness: 0.15, metalness: 0.1 }), std({ color: '#16261a', roughness: 0.15, metalness: 0.1 }), P.glassBottle];
    for (const [k, y] of [[0, 1.34], [1, 1.70]]) {
      box(1505, 313, 1595, 338, y, y + 0.035, P.walnut, { collide: false });                  // floating shelf
      box(1508, 333, 1592, 336, y - 0.008, y, P.cove, { collide: false, cast: false });      // warm LED strip under it
      for (let i = 0; i < 5; i++) {                                                            // standing bottles
        const x = X(1513 + i * 9 + k * 30), z = Z(325), m = bot[(i + k) % 3];
        if (k === 1 && i > 2) break;
        mesh(world, new THREE.CylinderGeometry(0.036, 0.036, 0.22, 16), m, x, y + 0.035 + 0.11, z);
        mesh(world, new THREE.CylinderGeometry(0.012, 0.03, 0.08, 12), m, x, y + 0.035 + 0.26, z);
      }
    }
    lathe(world, [[0, 0], [0.07, 0], [0.09, 0.05], [0.08, 0.13], [0.025, 0.2], [0.02, 0.3], [0, 0.3]], P.glassBottle, X(1585), 1.735, Z(325), 32);   // decanter
  }
  function entryTableB(w, d) {                     // slim modern entrance table: stone top on a thin black frame, walnut low shelf, front +z
    const g = new THREE.Group(), top = 0.8, t = 0.018;
    rb(g, w, 0.025, d, P.quartz, 0, top, 0, 0.004);                                       // stone top
    rb(g, w - 0.08, 0.02, d - 0.06, P.walnut, 0, 0.16, 0, 0.003);                          // low walnut shelf
    for (const sx of [-1, 1]) {                                                            // two closed black frames (legs)
      const x = sx * (w / 2 - 0.035);
      for (const sz of [-1, 1]) rb(g, t, top, t, P.black, x, 0, sz * (d / 2 - 0.03), 0.002);
      rb(g, t, t, d - 0.06, P.black, x, 0, 0, 0.002); rb(g, t, t, d - 0.06, P.black, x, top - t, 0, 0.002);
    }
    vase(g, -w / 2 + 0.17, top + 0.025, 0, 1.1, P.sand);                                  // sculpted vase
    rb(g, 0.26, 0.012, 0.14, P.brushed, w / 2 - 0.22, top + 0.025, 0, 0.004);             // tray for keys
    books(g, 0.05, 0.18, 0, 3, 0.1);
    return g;
  }
  item(entryTableB, 1615, 313, 1705, 345, 's');
  { const mx = X(1660), mz = Z(313) + 0.012, my = 1.48;                                   // round mirror above the table, bronze rim
    mesh(world, new THREE.CylinderGeometry(0.4, 0.4, 0.012, 64), std({ color: '#9a7a52', metalness: 0.8, roughness: 0.3 }), mx, my, mz, Math.PI / 2);
    mesh(world, new THREE.CylinderGeometry(0.38, 0.38, 0.014, 64), std({ color: '#d9e0e3', metalness: 0.35, roughness: 0.08 }), mx, my, mz + 0.002, Math.PI / 2); }   // light glass (a full metal mirror reads as a black disc here)

  // ---------------------------------------------------------------------------
  // KITCHEN – fridge niche, joinery run with stone top + backsplash, fluted stone peninsula, stools
  // ---------------------------------------------------------------------------
  box(1820, 431, 1900, 434, 0, H - 0.01, P.walnut); box(1820, 516, 1900, 519, 0, H - 0.01, P.walnut);
  box(1824, 434, 1900, 516, 1.93, H - 0.01, P.lacquer, { collide: false });
  box(1821, 434.3, 1824, 475, 1.932, H - 0.012, P.walnut, { collide: false }); box(1821, 475.4, 1824, 515.7, 1.932, H - 0.012, P.walnut, { collide: false });
  item(fridgeB, 1826, 436, 1898, 514, 'w');
  item(kitchenRunB, 1840, 520, 1900, 828, 'w');
  pothos(1880, 2.285, 550, { x0: -0.15, x1: 0.12, z0: -0.25, z1: 0.25 }, Math.PI - 0.9, Math.PI + 0.9, 6, 0.55);
  { // peninsula: rosé stone top with a rounded end, fluted stone column + fluted panel on the sofa side
    const g = new THREE.Group(), x0 = X(1698), x1 = X(1745), r = (x1 - x0) / 2, zA = Z(552), zB = Z(735), top = 0.95, zc = zA + r, len = zB - zc;
    rb(g, 2 * r + 0.02, 0.04, len, P.onyx, 0, top - 0.04, zc + len / 2, 0.004);
    // rounded end = HALF disc only (north side), butting the slab – a full disc overlapped the slab with coplanar faces and flickered
    mesh(g, new THREE.CylinderGeometry(r + 0.01, r + 0.01, 0.04, 64, 1, false, Math.PI / 2, Math.PI), P.onyx, 0, top - 0.02, zc);
    cylinder(g, r - 0.06, r - 0.06, top - 0.04, P.onyx, 0, 0, zc, 48);
    const fl = new THREE.CylinderGeometry(0.016, 0.016, top - 0.05, 10), nC = 26, nS = Math.floor((len - 0.02) / 0.034);
    const im = new THREE.InstancedMesh(fl, P.onyx, nC + nS), m4 = new THREE.Matrix4();
    for (let i = 0; i < nC; i++) { const a = i / nC * Math.PI * 2; im.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * (r - 0.06), (top - 0.05) / 2, zc + Math.sin(a) * (r - 0.06))); }
    rb(g, 0.04, top - 0.04, len, P.onyx, -r + 0.035, 0, zc + len / 2, 0.004);
    for (let i = 0; i < nS; i++) im.setMatrixAt(nC + i, m4.makeTranslation(-r + 0.016, (top - 0.05) / 2, zc + 0.02 + i * 0.034));
    im.castShadow = im.receiveShadow = true; g.add(im);
    mesh(g, new THREE.CylinderGeometry(0.01, 0.01, len, 12), P.goldM, r - 0.05, 0.25, zc + len / 2, Math.PI / 2);   // brass foot rail
    g.position.set((x0 + x1) / 2, 0, 0); world.add(g);
    colliders.push({ x0, x1, z0: zA, z1: zB });
  }
  function barBenchB(w, d) {                       // counter-height bench: walnut slab legs, orange cushion, brass footrest, front +z
    const g = new THREE.Group(), sh = 0.64;
    for (const s of [-1, 1]) rb(g, 0.04, sh - 0.04, d, P.darkWood, s * (w / 2 - 0.02), 0, 0, 0.008);
    rb(g, w, 0.04, d, P.darkWood, 0, sh - 0.04, 0, 0.008);
    rb(g, w - 0.02, 0.07, d - 0.02, P.rust, 0, sh, 0, 0.03);
    mesh(g, new THREE.CylinderGeometry(0.01, 0.01, w - 0.08, 12), P.goldM, 0, 0.24, d / 2 - 0.05, 0, 0, Math.PI / 2);
    rb(g, w - 0.08, 0.03, 0.03, P.darkWood, 0, 0.24, -d / 2 + 0.04, 0.006);
    return g;
  }
  function roundStoolB() {                          // modern pedestal stool: round base, single column, simple round seat
    const g = new THREE.Group(), sh = 0.66;
    lathe(g, [[0, 0], [0.19, 0], [0.19, 0.008], [0.17, 0.02], [0, 0.02]], P.black);                    // flat round base
    cylinder(g, 0.03, 0.03, sh - 0.06, P.black, 0, 0.02, 0, 24);                                        // single column
    mesh(g, new THREE.TorusGeometry(0.14, 0.008, 8, 48), P.black, 0, 0.26, 0, Math.PI / 2);            // slim foot ring
    for (let k = 0; k < 3; k++) { const a = k * 2.094; rb(g, 0.13, 0.008, 0.012, P.black, Math.cos(a) * 0.075, 0.256, Math.sin(a) * 0.075, 0.002, 0, -a); }
    lathe(g, [[0, 0], [0.17, 0], [0.18, 0.012], [0.18, 0.04], [0.172, 0.05], [0, 0.05]], P.rust, 0, sh - 0.04, 0, 48);   // simple round seat
    return g;
  }
  at(roundStoolB, 1763, 668, 0); at(roundStoolB, 1763, 716, 0);   // free-standing, half under the bar top       // tucked under the bar top, at the balcony end – the kitchen aisle stays free

  // ---------------------------------------------------------------------------
  // TERRAÇO – grill counter with fluted stone front, stone backsplash, wood hood box, lit wood
  // shelves, jiboia; pedestal dining table with pink chairs under amber glass pendants
  // ---------------------------------------------------------------------------
  box(1207, 957, 1257, 1146, 0, 0.1, P.black);
  box(1205, 955, 1260, 1078, 0.1, 0.86, P.onyx); box(1205, 1117, 1260, 1148, 0.1, 0.86, P.onyx);
  box(1205, 1078, 1215, 1117, 0.1, 0.86, P.onyx); box(1250, 1078, 1260, 1117, 0.1, 0.86, P.onyx);
  box(1215, 1078, 1250, 1117, 0.1, 0.66, P.onyx);
  {
    const n = Math.floor((Z(1146) - Z(957)) / 0.026), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 10), P.onyx, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(X(1260) + 0.004, 0.1 + 0.375, Z(957) + 0.013 + i * 0.026));
    im.castShadow = im.receiveShadow = true; world.add(im);
  }
  box(1203, 953, 1265, 1080, 0.86, 0.9, P.quartz); box(1203, 1115, 1265, 1150, 0.86, 0.9, P.quartz);
  box(1203, 1080, 1215, 1115, 0.86, 0.9, P.quartz); box(1250, 1080, 1265, 1115, 0.86, 0.9, P.quartz);
  box(1215, 1080, 1250, 1115, 0.68, 0.69, P.steelSat, { collide: false });
  for (const [a, b, c, d] of [[1215, 1080, 1250, 1081], [1215, 1114, 1250, 1115], [1215, 1081, 1216, 1114], [1249, 1081, 1250, 1114]])
    box(a, b, c, d, 0.69, 0.9, P.steelSat, { collide: false, cast: false });
  { const fg = new THREE.Group(); faucet(fg, 0, 0, 0, P.brushed); fg.rotation.y = Math.PI / 2; fg.position.set(X(1208), 0.9, Z(1097)); world.add(fg); }
  box(1205, 955, 1206.5, 1148, 0.9, 1.75, P.quartz, { collide: false });
  // charcoal grill: steel tray, grate, spit frame
  box(1209, 965, 1256, 1045, 0.9, 0.97, M.steel);
  box(1211, 967, 1254, 1043, 0.97, 0.972, P.black, { collide: false, cast: false });
  for (let z = 968; z < 1043; z += 3) box(1212, z, 1253, z + 0.7, 0.975, 0.983, M.steel, { collide: false, cast: false });
  for (const z of [964, 1044]) {
    box(1253, z, 1255, z + 2, 0.97, 1.5, M.steel, { collide: false });
    for (const y of [1.22, 1.48]) box(1209, z, 1255, z + 2, y, y + 0.02, M.steel, { collide: false });
  }
  for (const y of [1.22, 1.48]) box(1253, 964, 1255, 1046, y, y + 0.02, M.steel, { collide: false });
  // wood-clad hood box over the grill (steel underside with a light)
  box(1205, 958, 1262, 1050, 1.75, H, P.walnut, { collide: false });
  box(1207, 960, 1260, 1048, 1.744, 1.75, P.brushed, { collide: false, cast: false });
  box(1215, 975, 1250, 1035, 1.74, 1.744, P.cove, { collide: false, cast: false });
  // floating wood shelves with LED, plates and a jiboia
  for (const y of [1.55, 1.9]) {
    box(1206.5, 1054, 1232, 1146, y, y + 0.035, P.walnut, { collide: false });
    box(1229, 1056, 1231, 1144, y - 0.006, y, P.led, { collide: false, cast: false });
  }
  for (let i = 0; i < 5; i++) cylinder(world, 0.11, 0.1, 0.012, P.ceramic, X(1219), 1.585 + i * 0.013, Z(1075), 40);
  lathe(world, [[0, 0], [0.05, 0], [0.065, 0.06], [0.05, 0.16], [0.03, 0.2], [0.035, 0.22], [0, 0.21]], P.sand, X(1219), 1.585, Z(1110), 32);
  pothos(1219, 1.935, 1100, { x0: -0.12, x1: 0.13, z0: -0.45, z1: 0.45 }, -1.1, 1.1, 8, 0.4);
  // dining table + chairs + pendants
  { // organic table: wide rounded end to the west, narrower to the east (plan), on two tapered pedestals
    const g = new THREE.Group(), top = 0.75, s = new THREE.Shape();
    s.moveTo(-1.05, 0); s.bezierCurveTo(-1.05, -0.58, -0.35, -0.56, 0.25, -0.44); s.bezierCurveTo(0.8, -0.34, 1.08, -0.2, 1.08, 0.02);
    s.bezierCurveTo(1.08, 0.24, 0.8, 0.36, 0.25, 0.44); s.bezierCurveTo(-0.35, 0.56, -1.05, 0.58, -1.05, 0);
    const tm = P.walnut.clone(); tm.map = P.walnut.map.clone(); tm.map.needsUpdate = true; tm.map.repeat.set(0.5, 0.5); tm.map.rotation = Math.PI / 2;
    mesh(g, new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 3, curveSegments: 48 }), tm, 0, top - 0.006, 0, Math.PI / 2);
    for (const x of [-0.55, 0.5]) lathe(g, [[0, 0], [0.24, 0], [0.24, 0.02], [0.08, 0.06], [0.06, top - 0.06], [0.14, top - 0.04], [0, top - 0.04]], P.walnut, x, 0, 0, 40);
    const pl = plantB(0, 0, 0.6, P.ceramic); pl.position.set(-0.05, top + 0.03, 0); g.add(pl);
    g.position.set(X(1462), 0, Z(992)); world.add(g);
    colliders.push({ x0: X(1462) - 1.0, x1: X(1462) + 1.05, z0: Z(992) - 0.45, z1: Z(992) + 0.45 });
  }
  for (const [x, z, r] of [[1425, 922, 0], [1505, 928, 0.15], [1425, 1064, Math.PI], [1510, 1056, Math.PI - 0.15], [1335, 978, Math.PI / 2]])
    at(caneChairB, x, z, r);                        // oak + cane chairs from the 79 m² terrace
  glassPendant(1428, 990, 1.62); glassPendant(1464, 1000, 1.78); glassPendant(1502, 992, 1.5);
  { const pl = addLight(new THREE.PointLight('#ffc98a', 3, 5, 2)); pl.position.set(X(1464), 1.5, Z(995)); world.add(pl); }
  item(wineB, 1652, 950, 1698, 1045, 'w');

  // ---------------------------------------------------------------------------
  // TERRAÇO DE SERVIÇO – porcelain walls, laundry run (heater cabinet → tank → washer → dryer)
  // ---------------------------------------------------------------------------
  {
    const wt = (ax, az, bx, bz, len) => {
      const t = porcelainTex.clone(); t.needsUpdate = true; t.repeat.set(len / 0.6, H / 0.6);
      box(ax, az, bx, bz, 0, H, phys({ map: t, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.2 }), { collide: false });
    };
    wt(1898.5, 850, 1900, 1150, (1150 - 850) / PX);
    wt(1720, 850, 1721.5, 1062, (1062 - 850) / PX);
  }
  item(laundryRunB, 1840, 855, 1900, 1148, 'w');

  // ---------------------------------------------------------------------------
  // ÁREA TÉCNICA – AC condensers
  // ---------------------------------------------------------------------------
  for (const x of [770, 870]) {
    worldRb(x, 927, x + 80, 977, 0, 0.6, P.lacquer, 0.01);
    mesh(world, new THREE.CircleGeometry(0.2, 32), P.black, X(x + 40), 0.3, Z(977) + 0.002);
  }


}
