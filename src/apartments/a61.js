// 61 m² – 2 dorms (1 suíte) – traced from the brochure plan (2000 px wide image, ≈ 86 px = 1 m,
// origin = outer top-left corner of the unit at plan px 655, 213).
// Built with the current engine look: light freijó joinery, porcelain + wood floors, quartzite
// feature walls with LED coves in the bathrooms, plaster sancas with indirect light.
import * as THREE from 'three';
import { X, Z } from '../engine/plan.js';
import {
  H, M, P, RBG, acSplit, addLight, at, baseCabB, bedB, box, caneChairB, ceilingGroup, colliders,
  concreteTex, cove, cylinder, deskB, faucet, floatStandB, floor, floorWoodTex, flutedConsoleB, fridgeB,
  glassPendant, item, lathe, mesh, plantB, porcelainTex, railingBars, rainShower, rb, 
  rug, std, sanca, sofaB, tableB, tableLamp, terraceTex, tileBox, toiletB,
  towelRail, tvOnWall, tvSlim, upperCabB, vanity2B, wall, wardrobeB, woodClad, world, worldRb,
} from '../engine/core.js';

export function build() {
  // roller shutter (persiana de enrolar) built into a window opening, outside the glass: shutter box
  // at the top of the opening and the slats lowered a little – nothing sticks out into the room
  const slat = std({ color: '#d9d6cf', roughness: 0.7 });
  function persiana(x0, x1, zGlass, zOut, top = 2.2, down = 0.35) {
    const z0 = zGlass + 1.2, z1 = zOut - 0.6, yb = top - 0.18;
    box(x0, z0, x1, z1, yb, top - 0.04, P.lacquer, { collide: false });
    box(x0, z0, x1, z0 + 1.2, yb - down, yb, slat, { collide: false, cast: false });
    for (let y = yb - down + 0.045; y < yb - 0.01; y += 0.045) box(x0, z0 - 0.15, x1, z0, y, y + 0.004, P.black, { collide: false, cast: false });
  }
  // ---------------------------------------------------------------------------
  // SLABS, FLOORS, CEILING
  // ---------------------------------------------------------------------------
  for (const [a, b, c, d] of [[655, 213, 1349, 830], [893, 830, 1349, 947]]) {
    box(a, b, c, d, -0.3, 0, M.extWall, { collide: false });
    box(a, b, c, d, H, H + 0.3, M.extWall, { collide: false, parent: ceilingGroup });
    const w = X(c) - X(a), dd = Z(d) - Z(b);
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, dd), M.ceiling);
    ce.rotation.x = Math.PI / 2; ce.position.set(X(a) + w / 2, H - 0.001, Z(b) + dd / 2); ce.receiveShadow = true;
    ceilingGroup.add(ce);
  }
  floor(818, 233, 1328, 712, porcelainTex, 0.9, 0.22);                    // kitchen / foyer / hall / living
  floor(678, 462, 893, 720, floorWoodTex, 1.6, 0.5, 0.003);               // suíte
  floor(818, 383, 893, 462, floorWoodTex, 1.6, 0.5, 0.003);               // suíte entrance corridor
  floor(905, 472, 1100, 690, floorWoodTex, 1.6, 0.5, 0.003);              // dorm 01
  floor(678, 233, 805, 450, porcelainTex, 0.9, 0.25, 0.004);              // banho 01
  floor(818, 233, 968, 372, porcelainTex, 0.9, 0.25, 0.004);              // banho 02
  floor(912, 712, 1328, 934, terraceTex, 0.9, 0.5, 0.002);                // terraço (4.81 × 2.58 m)
  floor(678, 742, 875, 818, concreteTex, 1.0, 0.8, 0.002);                // área técnica

  // ---------------------------------------------------------------------------
  // WALLS (traced from the plan)
  // ---------------------------------------------------------------------------
  wall(655, 213, 1349, 233, [{ from: 1250, to: 1322 }]);                  // FRONT DOOR (into the foyer, top right)
  wall(655, 233, 678, 830);                                               // west façade
  wall(1328, 233, 1349, 947);                                             // east party wall
  wall(805, 233, 818, 450, [{ from: 390, to: 446 }]);                     // banho 01 | banho 02, banho 01 door to the suíte corridor
  wall(678, 450, 818, 462);                                               // banho 01 | suíte
  wall(818, 372, 980, 383, [{ from: 912, to: 960 }]);                     // banho 02 door (to the hall) – its frame clears the suíte wall
  wall(968, 233, 980, 372);                                               // banho 02 | cozinha
  box(980, 233, 1000, 278, 0, H, M.wall);                                 // shaft in the kitchen corner
  wall(1225, 233, 1240, 300);                                             // fridge niche
  wall(893, 383, 905, 712, [{ from: 395, to: 450 }]);                     // suíte | hall + dorm (suíte door) – stops where the terrace wall starts
  wall(905, 460, 1108, 472, [{ from: 950, to: 1010 }]);                   // dorm door
  wall(1100, 472, 1108, 690);                                             // dorm | living (TV wall)
  wall(905, 690, 1108, 712, [{ from: 965, to: 1085, sill: 0.9, top: 2.2, glass: 'window' }]);   // dorm window → terraço (starts at 905: no overlap with the suíte wall)
  wall(1108, 690, 1328, 712, [{ from: 1112, to: 1272, top: 2.3, glass: 'open' }]);   // living fully open to the terraço, no glass (as on the plan)
  wall(678, 720, 893, 742, [{ from: 712, to: 858, sill: 1.0, top: 2.2, glass: 'window' }]);    // suíte window → área técnica
  wall(893, 712, 912, 947);                                               // terraço | área técnica
  box(875, 742, 893, 818, 0, H, M.wall);                                  // shaft
  wall(678, 818, 893, 830, [{ from: 690, to: 870, sill: 0.2, top: 2.3, glass: 'window' }]);    // área técnica louvre
  box(912, 712, 935, 800, 0, H, M.wall);                                  // shaft on the terrace (laundry side)
  box(1292, 712, 1328, 800, 0, H, M.wall);                                // shaft beside the grill
  railingBars(912, 934, 1328, 947);
  // front door leaf + handles + peephole
  box(1252, 220, 1320, 226, 0.005, 2.095, P.walnut);
  for (const [z0, z1] of [[226, 229], [217, 220]]) {
    box(1305, z0, 1308, z1, 0.98, 1.08, P.brass, { collide: false });
    box(1293, z0, 1308, z1, 1.02, 1.045, P.brass, { collide: false });
  }
  box(1268, 220.5, 1272, 225.5, 1.55, 1.59, P.brass, { collide: false });
  // building corridor / elevator lobby outside the front door
  box(1165, 55, 2015, 213, -0.3, 0, M.extWall, { collide: false });
  floor(1180, 70, 2000, 213, porcelainTex, 0.9, 0.22, 0.002);
  box(1165, 55, 2015, 213, H, H + 0.3, M.extWall, { collide: false, parent: ceilingGroup });
  box(1180, 70, 2000, 213, H - 0.012, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });   // inside the walls (no overlap)
  wall(1165, 55, 2015, 70);                                               // corridor back wall
  wall(1165, 70, 1180, 213);                                              // corridor end walls
  wall(2000, 70, 2015, 213);
  wall(1349, 213, 2000, 233, [{ from: 1700, to: 1772 }]);                 // neighbour's flat + door
  box(1702, 220, 1770, 226, 0.005, 2.095, P.walnut);
  for (const ex of [1450, 1560]) {                                        // two elevators
    box(ex, 70, ex + 86, 73, 0, 2.15, M.steel, { collide: false });
    box(ex + 42.5, 72.5, ex + 43.5, 73.3, 0.02, 2.13, P.black, { collide: false });
    box(ex + 93, 70, ex + 99, 72, 1.0, 1.25, P.black, { collide: false });
    box(ex + 95, 71.5, ex + 97, 72.6, 1.07, 1.1, P.led, { collide: false });
  }

  // ---------------------------------------------------------------------------
  // BANHO 01 (1.47 m) – shower at the top with the gas heater, toilet + vanity on the façade wall
  // ---------------------------------------------------------------------------
  box(700, 296, 770, 300, 0, 2.0, M.glass, { cast: false }); box(768, 295, 772, 301, 0, 2.0, P.black, { collide: false });
  tileBox(700, 233, 805, 234.5, 0, H); tileBox(803.5, 234.5, 805, 296, 0, H);
  rainShower(752, 233, 752, 266);
  box(678, 233, 700, 296, 0, H, M.wall);                                  // boxed-in gas water heater (full-height wall section)
  box(678, 300, 679.5, 450, 0, H, P.quartz, { collide: false }); cove(X(679.5), Z(300), Z(450), 1);
  item(toiletB, 680, 312, 734, 352, 'e');
  item(vanity2B, 680, 382, 728, 448, 'e');
  towelRail(805, 335, false, -1);

  // ---------------------------------------------------------------------------
  // BANHO 02 (1.78 × 1.60 m) – shower top-left, granite vanity top-right, toilet below
  // ---------------------------------------------------------------------------
  box(818, 296, 868, 300, 0, 2.0, M.glass, { cast: false }); box(866, 295, 870, 301, 0, 2.0, P.black, { collide: false });
  tileBox(818, 233, 897, 234.5, 0, H); tileBox(818, 234.5, 819.5, 296, 0, H);
  rainShower(856, 233, 856, 266);
  box(897, 233, 968, 234.5, 0, H, P.quartz, { collide: false }); cove(Z(234.5), X(897), X(968), 1, true);
  item(vanity2B, 900, 235, 966, 282, 's');
  item(toiletB, 820, 312, 872, 352, 'e');
  towelRail(968, 325, false, -1);

  // ---------------------------------------------------------------------------
  // COZINHA – fridge in its niche, sink run on the north wall, cooktop on the L return,
  // rounded wood bar facing the living room
  // ---------------------------------------------------------------------------
  item(fridgeB, 1158, 234, 1224, 300, 's');
  item((w, d) => baseCabB(w, d, { sinkX: 0, body: P.greige, door: P.freijo }), 1000, 234, 1156, 288, 's');
  item((w, d) => upperCabB(w, d), 1000, 234, 1156, 266, 's', false);
  item((w, d) => baseCabB(w, d, { cooktopX: -0.1, ovenX: -0.1, body: P.greige, door: P.freijo }), 980, 288, 1035, 372, 'e');
  item((w, d) => upperCabB(w, d, { hoodX: -0.1 }), 980, 288, 1012, 372, 'e', false);
  { // wood bar with a rounded east end on a lacquered base
    const x0 = X(1037), x1 = X(1200), z0 = Z(372), z1 = Z(398), r = (z1 - z0) / 2, zc = (z0 + z1) / 2, top = 0.92, len = x1 - x0 - r;
    mesh(world, RBG(len, 0.04, z1 - z0, 0.006), P.freijo, x0 + len / 2, top - 0.02, zc);
    mesh(world, new THREE.CylinderGeometry(r, r, 0.04, 48, 1, false, 0, Math.PI), P.freijo, x0 + len, top - 0.02, zc);
    mesh(world, RBG(len - 0.1, top - 0.14, z1 - z0 - 0.08, 0.004), P.greige, x0 + 0.05 + (len - 0.1) / 2, 0.1 + (top - 0.14) / 2, zc);
    mesh(world, RBG(len - 0.14, 0.1, z1 - z0 - 0.12, 0.002), P.black, x0 + 0.07 + (len - 0.14) / 2, 0.05, zc);
    colliders.push({ x0, x1, z0, z1 });
  }
  glassPendant(1085, 385, 1.7); glassPendant(1145, 385, 1.7);
  { const pl = plantB(0, 0, 0.9, P.ceramic); pl.position.set(X(1305), 0, Z(258)); world.add(pl); }   // foyer plant

  // ---------------------------------------------------------------------------
  // SUÍTE (2.50 × 3.05 m) – ribbed wardrobe on the banho wall, double bed against the façade with
  // a walnut headboard panel, floating nightstands with lamps, TV on the dorm wall, roller blind
  // ---------------------------------------------------------------------------
  item(wardrobeB, 680, 463, 812, 510, 's');
  woodClad(678, 518, 682, 718, 0, 1.32);
  box(678, 518, 683, 718, 1.32, 1.335, P.walnut, { collide: false });
  box(682, 523, 683, 713, 1.305, 1.315, P.led, { collide: false, cast: false });
  item(bedB, 683, 553, 838, 692, 'e', true, { headH: 1.15 });
  item(floatStandB, 683, 516, 720, 550, 'e');
  item(floatStandB, 683, 694, 720, 718, 'e');
  tableLamp(X(700), 0.55, Z(533)); tableLamp(X(700), 0.55, Z(706));
  rug(720, 523, 862, 718, P.rugGray);
  tvOnWall(X(893), Z(622), 1.11, 0.64, 1.32, -1);
  acSplit(X(678), Z(600), 2.28, 1);
  persiana(712, 858, 731, 742);                                          // roller shutter in the window opening
  sanca(678, 510, 893, 720, 32, 0.12);

  // ---------------------------------------------------------------------------
  // DORM 01 (2.20 × 2.59 m) – wardrobe on the west wall, single bed against the hall wall,
  // desk under the terrace window
  // ---------------------------------------------------------------------------
  item(wardrobeB, 906, 474, 946, 688, 'e');
  item(bedB, 1013, 474, 1098, 648, 's', true, { single: true, headH: 1.05, head: P.linen, throw: P.sage, accent: P.sage });
  item(deskB, 950, 652, 1060, 689, 'n', true, { laptopX: 0.1 });
  persiana(965, 1085, 701, 712);
  sanca(946, 472, 1100, 690, 28, 0.12);

  // ---------------------------------------------------------------------------
  // ESTAR / JANTAR – wood-clad TV wall with a fluted console, cream bouclé sofa on the party wall,
  // jute rug and a round glass coffee table
  // ---------------------------------------------------------------------------
  woodClad(1108, 472, 1111, 690);
  tvSlim(X(1111), Z(580), 1.25, 0.72, 1.32);
  item(flutedConsoleB, 1111, 492, 1145, 668, 'e');
  item((w, d) => sofaB(w, d, P.boucleW), 1250, 470, 1326, 686, 'w');
  rug(1150, 480, 1248, 680, P.jute);
  { const pl = plantB(0, 0, 1.0, P.terracotta); pl.position.set(X(1305), 0, Z(455)); world.add(pl); }
  sanca(1111, 465, 1328, 690, 32, 0.12);

  // ---------------------------------------------------------------------------
  // TERRAÇO (4.81 × 2.58 m, as on the plan) – laundry counter with tank + washer on the west, granite counter with
  // charcoal grill + sink on the east, wood dining table for six under amber pendants
  // ---------------------------------------------------------------------------
  item((w, d) => baseCabB(w, d, { tankX: 0.2, washerX: -0.45, body: P.greige, door: P.freijo }), 913, 800, 968, 932, 'e');
  // churrasqueira – same design as the 93 m² terrace, mirrored onto the east wall (front faces west):
  // fluted stone counter, quartzite top + backsplash, charcoal grill with grate and spit frame,
  // wood-clad hood box with a light, recessed steel sink at the south end
  box(1276, 802, 1326, 930, 0, 0.1, P.black);                                         // recessed plinth
  box(1273, 800, 1328, 896, 0.1, 0.86, P.onyx); box(1273, 926, 1328, 932, 0.1, 0.86, P.onyx);
  box(1318, 896, 1328, 926, 0.1, 0.86, P.onyx); box(1273, 896, 1283, 926, 0.1, 0.86, P.onyx);
  box(1283, 896, 1318, 926, 0.1, 0.66, P.onyx);                                       // under the basin
  {
    const n = Math.floor((Z(932) - Z(800)) / 0.026), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 10), P.onyx, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(X(1273) - 0.004, 0.1 + 0.375, Z(800) + 0.013 + i * 0.026));
    im.castShadow = im.receiveShadow = true; world.add(im);                          // fluted front
  }
  box(1270, 798, 1328, 898, 0.86, 0.9, P.quartz); box(1270, 924, 1328, 933, 0.86, 0.9, P.quartz);
  box(1318, 898, 1328, 924, 0.86, 0.9, P.quartz); box(1270, 898, 1283, 924, 0.86, 0.9, P.quartz);
  box(1283, 898, 1318, 924, 0.68, 0.69, P.steelSat, { collide: false });               // basin
  for (const [a, b, c, d] of [[1283, 898, 1318, 899], [1283, 923, 1318, 924], [1283, 899, 1284, 923], [1317, 899, 1318, 923]])
    box(a, b, c, d, 0.69, 0.9, P.steelSat, { collide: false, cast: false });
  { const fg = new THREE.Group(); faucet(fg, 0, 0, 0, P.brushed); fg.rotation.y = -Math.PI / 2; fg.position.set(X(1324), 0.9, Z(911)); world.add(fg); }
  box(1326.5, 800, 1328, 932, 0.9, 1.75, P.quartz, { collide: false });              // stone backsplash
  // charcoal grill: steel tray, grate, spit frame
  box(1277, 808, 1324, 888, 0.9, 0.97, M.steel);
  box(1279, 810, 1322, 886, 0.97, 0.972, P.black, { collide: false, cast: false });
  for (let z = 811; z < 886; z += 3) box(1280, z, 1321, z + 0.7, 0.975, 0.983, M.steel, { collide: false, cast: false });
  for (const z of [807, 887]) {
    box(1278, z, 1280, z + 2, 0.97, 1.5, M.steel, { collide: false });
    for (const y of [1.22, 1.48]) box(1278, z, 1324, z + 2, y, y + 0.02, M.steel, { collide: false });
  }
  for (const y of [1.22, 1.48]) box(1278, 807, 1280, 889, y, y + 0.02, M.steel, { collide: false });
  // wood-clad hood box over the grill (steel underside with a light)
  box(1271, 801, 1328, 893, 1.75, H, P.walnut, { collide: false });
  box(1273, 803, 1326, 891, 1.744, 1.75, P.brushed, { collide: false, cast: false });
  box(1283, 818, 1318, 878, 1.74, 1.744, P.cove, { collide: false, cast: false });
  item((w, d) => tableB(w, d), 1060, 805, 1178, 915, 's');
  for (const [x, z, r] of [                         // six chairs, as on the plan: two at the top, two each side
    [1098, 790, 0], [1142, 790, 0],
    [1040, 838, Math.PI / 2], [1040, 885, Math.PI / 2],
    [1198, 838, -Math.PI / 2], [1198, 885, -Math.PI / 2],
  ]) at(caneChairB, x, z, r);
  glassPendant(1100, 860, 1.62); glassPendant(1138, 860, 1.78);
  { const pl = addLight(new THREE.PointLight('#ffc98a', 2.5, 4.5, 2)); pl.position.set(X(1120), 1.5, Z(860)); world.add(pl); }

  // ---------------------------------------------------------------------------
  // ÁREA TÉCNICA – two AC condensers
  // ---------------------------------------------------------------------------
  for (const x of [700, 790]) {
    worldRb(x, 746, x + 78, 792, 0, 0.6, P.lacquer, 0.01);
    mesh(world, new THREE.CircleGeometry(0.2, 32), P.black, X(x + 39), 0.3, Z(792) + 0.002);
  }
}
