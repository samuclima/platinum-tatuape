// Runtime shared by every apartment - generated from the 27 m² file by tools/migrate.mjs (Phase 1).
// Lighting, sky, the real neighbourhood, post-processing, auto quality, player/walk controls, V/M
// views, scale/FOV, minimap + HUD and the render loop. Everything that differed between the four
// files is now a field of `meta` (see src/apartments/*.meta.js).
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
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { X, Z } from './plan.js';
import { buildBuildingModel } from './building.js';
import {
  DPR, EYE, H, P, R, camera, canvasTex, ceilingGroup, colliders, planLines, downlight, downlights,
  initSpotSlots, mesh, renderer, resetSlotPos, roomLights, scene, setUpdateSpotSlots, slotFader,
  spotSlots, std, topCam, updateSpotSlots, world,
} from './core.js';

export function start(meta) {
  // the level's own geometry (apartment / térreo / pavimentos) – hidden in the M view, where the stand-alone
  // building model takes over
  const levelG = new THREE.Group(); levelG.name = 'level';
  for (const c of [...world.children]) levelG.add(c);
  world.add(levelG);
  // ---------------------------------------------------------------------------
  // LIGHTING
  // ---------------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight('#dbe9ff', '#8b7d6b', 0.35));
  const sun = new THREE.DirectionalLight('#fff1d8', 3.4);
  sun.position.set(X(meta.sun.from[0]) + 8, 14, Z(meta.sun.from[1]) + 10);
  sun.target.position.set(X(meta.sun.at[0]), 0, Z(meta.sun.at[1]));
  sun.castShadow = true;
  const SHADOW_RES = (meta.shadowSize ?? 9) > 20 && !new URLSearchParams(location.search).has('embed') ? 4096 : 2048;   // (home-page 360: seen from 175 m, 2048 is plenty)   // site levels: big box → double the map (rendered once, the scene is static)
  sun.shadow.mapSize.set(SHADOW_RES, SHADOW_RES);              // tight box around the unit → same texel size as before
  { const S = meta.shadowSize ?? 9; Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: meta.site ? 160 : 60 }); }
  renderer.shadowMap.autoUpdate = false;                       // the scene is static: render the sun shadow once
  renderer.shadowMap.needsUpdate = true;
  { const texel = 2 * (meta.shadowSize ?? 9) / SHADOW_RES;            // big site levels (42 m box) have ~4 cm texels: acne hatched the spa frame + jogos pillars
    sun.shadow.bias = texel > 0.015 ? -0.0006 : -0.0003; sun.shadow.normalBias = Math.max(0.02, texel * 2); sun.shadow.radius = 3; }
  scene.add(sun, sun.target);
  // recessed downlights
  for (const [px, pz, i] of meta.downlights) downlight(px, pz, i);
  // daylight bouncing in through the windows (soft area lights): centre, size, height, inward normal
  for (const [cx, cz, w, h, y, nx, nz, inten] of meta.windows) {
    const l = new THREE.RectAreaLight('#e6eeff', inten, w, h);
    l.position.set(X(cx) + nx * 0.03, y, Z(cz) + nz * 0.03); l.lookAt(X(cx) + nx * 3, y - 0.3, Z(cz) + nz * 3);
    world.add(l);
  }

  // ---------- sky & surroundings ----------
  const sky = new Sky(); sky.scale.setScalar(3000); sky.renderOrder = -100; scene.add(sky);   // drawn first
  {
    const u = sky.material.uniforms;
    u.turbidity.value = 2.5; u.rayleigh.value = 1.6; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8;
    u.sunPosition.value.copy(sun.position).sub(sun.target.position).normalize();
  }

  // ---------------------------------------------------------------------------
  // REAL NEIGHBOURHOOD – Rua Platina, Tatuapé (OpenStreetMap data, window.CITY)
  // World orientation: +z = north (terraces face Rua Platina), +x = west.
  // ---------------------------------------------------------------------------
  // Brochure: 1 tower, residential floors 3º–27º (14 units per floor), térreo + 2 leisure floors.
  const SITE = meta.site;                                      // a level of the building itself (térreo) instead of an apartment
  const APT_FLOOR = meta.floor ?? 12, FLOOR_H = 3.0, TOWER_FLOORS = 27;   // apartments: floor assumed – change if the unit is on another floor
  const STREET = SITE ? 0.15 : 1.5;                             // térreo floor above the street
  const GROUND = -(APT_FLOOR * FLOOR_H + STREET);               // street level relative to this level's floor
  const LEVEL = n => GROUND + STREET + n * FLOOR_H;             // top of floor slab n (térreo = 0); LEVEL(APT_FLOOR) = 0
  const PODIUM = LEVEL(2), ROOF = LEVEL(TOWER_FLOORS + 1);
  // meta.site.flip = plan pivot: everything OUTSIDE the level (city, tower, M-view building, labels) is turned 180°
  // around it – the térreo's acesso social / lobby then faces Rua Platina. The level itself (walls, colliders,
  // lights, minimap) keeps its plan frame. sw() maps site frame ↔ level frame (it is its own inverse).
  const FLIP = SITE?.flip ? [X(SITE.flip[0]), Z(SITE.flip[1])] : null;
  const sw = (x, z) => FLIP ? [2 * FLIP[0] - x, 2 * FLIP[1] - z] : [x, z];
  const flipG = () => { const g = new THREE.Group(); if (FLIP) { g.rotation.y = Math.PI; g.position.set(2 * FLIP[0], 0, 2 * FLIP[1]); } return g; };
  const siteW = flipG(); world.add(siteW);

  // ---- where the tower really stands. The city data is in "city metres" (geoCity); the lot is on the
  // south side of Rua Platina, backing onto Praça Heitor Levi (brochure site plan, north towards Rua
  // Platina). The whole city is rotated + moved so that this lot lands on the apartment's tower.
  const geoCity = (lat, lon) => {                               // lat/lon → city-data metres (+x = west, +z = north)
    const ST_LAT = -23.5378874, ST_LON = -46.5642624, COSL = Math.cos(ST_LAT * Math.PI / 180);
    const e = (lon - ST_LON) * 111320 * COSL - 215, n = (lat - ST_LAT) * 110540 + 165;
    return [10.5 - e, 4.3 + n];
  };
  const PLAT_A = geoCity(-23.5390873, -46.5617538), PLAT_B = geoCity(-23.5387878, -46.5602597);   // Rua Platina (OSM way 17561092)
  const _pl = Math.hypot(PLAT_B[0] - PLAT_A[0], PLAT_B[1] - PLAT_A[1]);
  const SU = [(PLAT_B[0] - PLAT_A[0]) / _pl, (PLAT_B[1] - PLAT_A[1]) / _pl], SV = [-SU[1], SU[0]];   // along the street (→ east), towards the praça (→ south)
  // LOT_S0: the lot's west corner, in metres along Rua Platina from PLAT_A. No street number is published, so
  // the lot is centred on Praça Heitor Levi (its back side faces the square). Move it here if needed.
  const LOT_S0 = 35, LOT_W = 51, LOT_W_BACK = 40, LOT_D0 = 7, LOT_D = 60;   // site plan: 2.701 m², L-shaped (pool wing to the east)
  // tower footprint: 21 m along the street × 46.4 m deep. On the 2º pavimento plan the tower stands over the rooms
  // up to the salão's east wall; the walkway, churrasqueira and playground beyond it (9.6 m) are open podium roof.
  const TXA = SITE ? X(SITE.towerX) : 0;                        // podium / lot anchor (x): the line the city, street and M-view podium are measured from
  const TX0 = SITE ? X(SITE.towerFace ?? SITE.towerX) : 0;      // tower east face (x) – on the 2º pavimento it is flush with the brinquedoteca's outer wall
  const TTRIM = TX0 - TXA;                                      // east face moved in by TTRIM → the west face comes in by the same amount
  const TW = 21 - 2 * TTRIM, TL = 46.4, TFS = 9.6;              // TFS: tower front set back from the podium's Rua Platina face
  const RD = 2.78 - TTRIM;                                      // east-face set-back: its face stays on the espaço jogos pillar line (iy 722)
  // SITE.towerNorth = the podium's Rua Platina face; meta.tower.depth (apartments) = the tower's own front face
  const zN = SITE ? Z(SITE.towerNorth) - TFS : Z(meta.tower.depth), zS = zN - TL;           // tower's Rua Platina face / back face (apartment frame)
  const zP = zN + TFS;                                          // podium front (Rua Platina side)
  const S_EAST = LOT_S0 + 30, D_NORTH = SITE ? Z(SITE.street) - zN : LOT_D0 + 1 + TFS;       // podium face 1 m behind the lot line
  const along = (cx, cz) => (cx - PLAT_A[0]) * SU[0] + (cz - PLAT_A[1]) * SU[1];
  const back = (cx, cz) => (cx - PLAT_A[0]) * SV[0] + (cz - PLAT_A[1]) * SV[1];
  const inLot = (cx, cz) => { const a = along(cx, cz), d = back(cx, cz); return a > LOT_S0 - 2 && a < LOT_S0 + LOT_W + 2 && d > LOT_D0 - 3 && d < LOT_D0 + LOT_D + 3; };
  const CITY_ROT = Math.atan2(-SU[1], -SU[0]);
  const CITY_POS = [TXA + S_EAST + PLAT_A[0] * SU[0] + PLAT_A[1] * SU[1], zN + D_NORTH + PLAT_A[0] * SV[0] + PLAT_A[1] * SV[1]];
  const cityG = new THREE.Group(); cityG.rotation.y = CITY_ROT; cityG.position.set(CITY_POS[0], 0, CITY_POS[1]); siteW.add(cityG);
  const facadeTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#56636f'; g.fillRect(20, 26, 88, 66);        // window
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(20, 26, 88, 8);
    g.fillStyle = '#d6d0c5'; g.fillRect(0, 108, w, 8);          // slab band
  });
  // Brazilian ceramic roof tiles (telha colonial): 10 columns × 5 rows = 2 m × 2 m per texture repeat
  const tileTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7a3a22'; g.fillRect(0, 0, w, h);
    const cols = 10, rows = 5, cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw, y = r * rh, s = 0.85 + Math.random() * 0.3, dark = c % 2 ? 0.82 : 1;
      const gr = g.createLinearGradient(x, 0, x + cw, 0);
      gr.addColorStop(0, `rgb(${118 * s * dark | 0},${50 * s * dark | 0},${28 * s * dark | 0})`);
      gr.addColorStop(0.5, `rgb(${206 * s * dark | 0},${108 * s * dark | 0},${64 * s * dark | 0})`);
      gr.addColorStop(1, `rgb(${118 * s * dark | 0},${50 * s * dark | 0},${28 * s * dark | 0})`);
      g.fillStyle = gr; g.fillRect(x + 1, y, cw - 2, rh - 2);
      g.fillStyle = 'rgba(40,15,5,0.5)'; g.fillRect(x, y + rh - 4, cw, 4);
      if (Math.random() < 0.15) { g.fillStyle = 'rgba(60,60,50,0.25)'; g.fillRect(x + 2, y + Math.random() * rh * 0.6, cw - 4, rh * 0.3); }  // weathering
    }
  });
  function buildCity(C) {
    const pal = a => a.map(c => new THREE.Color(c));
    const TOWER = pal(['#f1eee8', '#e4e0d8', '#d8d6d2', '#cfd6dc', '#e9e1d3', '#c9c4bb', '#b9c3cc']);
    const HOUSE = pal(['#f3efe6', '#e8dcc6', '#f0e2cf', '#dfe3df', '#e9d6c4', '#f5f0e8', '#d6cbb8']);
    const ROOF = pal(['#b5653f', '#a85a3a', '#c07650', '#8e8a84', '#9c9890', '#b06a48']);
    const FLAT = pal(['#9a9893', '#a7a49e', '#8e8c88']);
    const TILE = pal(['#ffffff', '#f4e6dc', '#ead8cc', '#fff3ea', '#e0cbbd', '#f7ece4']);   // tint over the clay-tile texture
    const W0 = { p: [], uv: [], c: [] }, R0 = { p: [], c: [] }, WU = { p: [], uv: [], c: [] }, RU = { p: [], c: [] };
    const push = (o, col, ...pts) => { for (const q of pts) { o.p.push(q[0], q[1], q[2]); o.c.push(col.r, col.g, col.b); } };
    function prism(xs, zs, y0, y1, wallCol, roofCol, W = W0, Rf = R0) {
      const n = xs.length; let per = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, len = Math.hypot(xs[j] - xs[i], zs[j] - zs[i]);
        const u0 = per / 3.2, u1 = (per + len) / 3.2, v0 = 0, v1 = (y1 - y0) / FLOOR_H; per += len;
        const A = [xs[i], y0, zs[i]], B = [xs[j], y0, zs[j]], Cc = [xs[j], y1, zs[j]], D = [xs[i], y1, zs[i]];
        push(W, wallCol, A, B, Cc, A, Cc, D);
        W.uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
      }
      if (!Rf) return;
      const contour = xs.map((x, i) => new THREE.Vector2(x, zs[i]));
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contour, []))
        push(Rf, roofCol, [xs[a], y1, zs[a]], [xs[b], y1, zs[b]], [xs[c], y1, zs[c]]);
    }
    // ---- Brazilian ceramic-tile hip roofs for houses, parapets + rooftop boxes for towers ----
    const RT = { p: [], uv: [], c: [] }, PL = { p: [], c: [] };
    const PITCH = Math.tan(24 * Math.PI / 180), COSP = Math.cos(24 * Math.PI / 180);
    function minRect(xs, zs) {                                   // minimum-area bounding rectangle
      let best = null;
      for (let i = 0; i < xs.length; i++) {
        const j = (i + 1) % xs.length, a = Math.atan2(zs[j] - zs[i], xs[j] - xs[i]), ca = Math.cos(a), sa = Math.sin(a);
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
        for (let k = 0; k < xs.length; k++) {
          const u = xs[k] * ca + zs[k] * sa, v = -xs[k] * sa + zs[k] * ca;
          u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
        }
        const area = (u1 - u0) * (v1 - v0);
        if (!best || area < best.area) best = { area, ca, sa, u0, u1, v0, v1 };
      }
      return best;
    }
    function hipRoof(xs, zs, y0, tint) {
      const r = minRect(xs, zs), o = 0.35;
      const cu = (r.u0 + r.u1) / 2, cv = (r.v0 + r.v1) / 2, du = (r.u1 - r.u0) / 2 + o, dv = (r.v1 - r.v0) / 2 + o;
      const swap = dv > du, Lh = Math.max(du, dv), Wh = Math.min(du, dv), rl = Lh - Wh, hr = Wh * PITCH;
      const P = (sx, tz, y) => {                                  // (long, short) local → world
        const u = cu + (swap ? tz : sx), v = cv + (swap ? sx : tz);
        return [u * r.ca - v * r.sa, y, u * r.sa + v * r.ca];
      };
      const face = (pts, uvf) => { for (const [sx, tz, up] of pts) { const q = P(sx, tz, y0 + (up ? hr : 0)); RT.p.push(...q); RT.c.push(tint.r, tint.g, tint.b); RT.uv.push(...uvf(sx, tz)); } };
      const A = [Lh, Wh, 0], B = [-Lh, Wh, 0], Cc = [-Lh, -Wh, 0], D = [Lh, -Wh, 0], Rp = [rl, 0, 1], Rm = [-rl, 0, 1];
      face([A, B, Rm, A, Rm, Rp], (sx, tz) => [sx / 2, (Wh - tz) / COSP / 2]);
      face([Cc, D, Rp, Cc, Rp, Rm], (sx, tz) => [sx / 2, (Wh + tz) / COSP / 2]);
      face([D, A, Rp], (sx, tz) => [tz / 2, (Lh - sx) / COSP / 2]);
      face([B, Cc, Rm], (sx, tz) => [tz / 2, (Lh + sx) / COSP / 2]);
    }
    const plainQuad = (a, b, y0, y1, col) => push(PL, col, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]);
    function towerTop(xs, zs, y1, wallCol, roofCol) {
      const pc = wallCol.clone().multiplyScalar(0.92);
      for (let i = 0; i < xs.length; i++) { const j = (i + 1) % xs.length; plainQuad([xs[i], zs[i]], [xs[j], zs[j]], y1, y1 + 1.1, pc); }
      const r = minRect(xs, zs), cu = (r.u0 + r.u1) / 2, cv = (r.v0 + r.v1) / 2;
      if ((r.u1 - r.u0) < 8 || (r.v1 - r.v0) < 8) return;
      const hu = (r.u1 - r.u0) * 0.16, hv = (r.v1 - r.v0) * 0.16, h = 3.5;
      const corner = (a, b) => { const u = cu + a, v = cv + b; return [u * r.ca - v * r.sa, u * r.sa + v * r.ca]; };
      const c4 = [corner(-hu, -hv), corner(hu, -hv), corner(hu, hv), corner(-hu, hv)], bc = new THREE.Color('#bdb9b2');
      for (let i = 0; i < 4; i++) plainQuad(c4[i], c4[(i + 1) % 4], y1, y1 + h, bc);
      push(PL, roofCol, [c4[0][0], y1 + h, c4[0][1]], [c4[1][0], y1 + h, c4[1][1]], [c4[2][0], y1 + h, c4[2][1]], [c4[0][0], y1 + h, c4[0][1]], [c4[2][0], y1 + h, c4[2][1]], [c4[3][0], y1 + h, c4[3][1]]);
    }
    // site level: drop every OSM building that reaches into the modelled lot (rects in plan coords → world)
    const CLR = (SITE && SITE.clear || []).map(([a, b, c, d]) => { const p = sw(X(a), Z(b)), q = sw(X(c), Z(d));   // level rects → site frame
      return [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])]; });
    const cR = Math.cos(CITY_ROT), sR = Math.sin(CITY_ROT);
    const toW = (x, z) => [CITY_POS[0] + x * cR + z * sR, CITY_POS[1] - x * sR + z * cR];
    const inClr = (x, z) => { const [wx, wz] = toW(x, z); return CLR.some(([x0, z0, x1, z1]) => wx > x0 && wx < x1 && wz > z0 && wz < z1); };
    const clearHit = (xs, zs) => {
      if (!CLR.length) return false;
      for (let i = 0; i < xs.length; i++) { const j = (i + 1) % xs.length, n = Math.max(1, Math.ceil(Math.hypot(xs[j] - xs[i], zs[j] - zs[i]))), cx = xs.reduce((a, v) => a + v, 0) / xs.length, cz = zs.reduce((a, v) => a + v, 0) / zs.length;
        for (let k = 0; k < n; k++) { const t = k / n, x = xs[i] + (xs[j] - xs[i]) * t, z = zs[i] + (zs[j] - zs[i]) * t; if (inClr(x, z) || inClr((x + cx) / 2, (z + cz) / 2)) return true; } }
      return false;
    };
    // OSM buildings (footprints kept in a 20 m grid so the trees can keep clear of them)
    const FOOT = new Map(), FC = 20, fkey = (i, j) => i * 100003 + j;
    const addFoot = (xs, zs) => { const f = { xs, zs }; const i0 = Math.floor(Math.min(...xs) / FC), i1 = Math.floor(Math.max(...xs) / FC), j0 = Math.floor(Math.min(...zs) / FC), j1 = Math.floor(Math.max(...zs) / FC);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = fkey(i, j); if (!FOOT.has(k)) FOOT.set(k, []); FOOT.get(k).push(f); } };
    // OSM sometimes holds the same footprint twice (outline + building part): drawing both makes their walls flicker.
    // Draw the tallest copy only.
    const drawnBox = new Map();
    const order = C.b.map((b, k) => k).sort((a, c) => C.b[c][0] - C.b[a][0]);
    order.forEach(k => { const b = C.b[k];
      const h = b[0] / 10, house = b[1] === 1, xs = [], zs = [];
      for (let i = 2; i < b.length; i += 2) { xs.push(b[i] / 10); zs.push(b[i + 1] / 10); }
      { const bb = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)], key = Math.round((bb[0] + bb[1]) / 2) + ',' + Math.round((bb[2] + bb[3]) / 2);
        const twin = (drawnBox.get(key) || []).some(o => o.every((v, i) => Math.abs(v - bb[i]) < 0.8));
        if (twin) return; if (!drawnBox.has(key)) drawnBox.set(key, []); drawnBox.get(key).push(bb); }
      if (inLot(xs.reduce((a, v) => a + v, 0) / xs.length, zs.reduce((a, v) => a + v, 0) / zs.length)) return;   // old houses on the lot (OSM)
      if (clearHit(xs, zs)) return;                                   // any part inside the modelled site (meta.site.clear)
      addFoot(xs, zs);
      // big house footprints (short side > 12 m) would get a 3 m+ tile pyramid that reads as a giant triangle from the
      // air → flat concrete slab with a low parapet instead (like the warehouses / sobrados with laje in the photo)
      const mr = house && minRect(xs, zs), bigHouse = house && Math.min(mr.u1 - mr.u0, mr.v1 - mr.v0) > 12;
      if (bigHouse) {
        prism(xs, zs, GROUND, GROUND + h, HOUSE[k % 7], FLAT[k % 3]);
        const pc = HOUSE[k % 7].clone().multiplyScalar(0.94);
        for (let i = 0; i < xs.length; i++) { const j = (i + 1) % xs.length; plainQuad([xs[i], zs[i]], [xs[j], zs[j]], GROUND + h, GROUND + h + 0.7, pc); }
      } else if (house) {
        prism(xs, zs, GROUND, GROUND + h, HOUSE[k % 7], null, W0, null);
        hipRoof(xs, zs, GROUND + h, TILE[k % TILE.length]);
      } else {
        prism(xs, zs, GROUND, GROUND + h, TOWER[k % 7], FLAT[k % 3]);
        towerTop(xs, zs, GROUND + h, TOWER[k % 7], FLAT[k % 3]);
      }
    });
    // distant São Paulo skyline beyond the mapped area (generic towers, 0.8–2.6 km away)
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) {
      // 60 % in a ±70° sector to the west (city +x) where the photo shows the dense high-rise belt
      const west = i % 5 < 3, a = west ? (rnd() - 0.5) * 2.4 : rnd() * Math.PI * 2, r = 830 + rnd() * (west ? 3400 : 2200);
      const cx = 10 + Math.cos(a) * r, cz = 4 + Math.sin(a) * r;
      const w = 15 + rnd() * 15, d = 15 + rnd() * 15, h = 30 + rnd() * rnd() * 95 + (r < 1500 ? 10 : 0);
      prism([cx - w / 2, cx + w / 2, cx + w / 2, cx - w / 2], [cz - d / 2, cz - d / 2, cz + d / 2, cz + d / 2], GROUND, GROUND + h, TOWER[i % 7], FLAT[i % 3]);
    }
    // ---- Estação Carrão + bus terminal (aerial photo): long grey roofs on columns along the tracks
    const railSegs = [];
    for (const r of C.rl) for (let i = 0; i + 3 < r.length; i += 2) railSegs.push([r[i] / 10, r[i + 1] / 10, r[i + 2] / 10, r[i + 3] / 10]);
    function nearestRail(px, pz) {
      let best = null;
      for (const [ax, az, bx, bz] of railSegs) {
        const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2));
        const qx = ax + dx * t, qz = az + dz * t, d = Math.hypot(px - qx, pz - qz);
        if (!best || d < best.d) { const L = Math.sqrt(L2); best = { d, qx, qz, ux: dx / L, uz: dz / L }; }
      }
      return best;
    }
    function shed(cx, cz, ux, uz, len, wid, h, col) {               // roof slab + columns, long side along (ux, uz)
      const vx = -uz, vz = ux, c = (a, b) => [cx + ux * a + vx * b, cz + uz * a + vz * b];
      const pts = [c(-len / 2, -wid / 2), c(len / 2, -wid / 2), c(len / 2, wid / 2), c(-len / 2, wid / 2)];
      prism(pts.map(p => p[0]), pts.map(p => p[1]), GROUND + h - 1.4, GROUND + h, new THREE.Color('#b9bcbf'), new THREE.Color(col));
      for (let a = -len / 2 + 4; a < len / 2; a += 16) for (const b of [-wid / 2 + 1, wid / 2 - 1]) {
        const [px, pz] = c(a, b); prism([px - 0.4, px + 0.4, px + 0.4, px - 0.4], [pz - 0.4, pz - 0.4, pz + 0.4, pz + 0.4], GROUND, GROUND + h - 1.4, new THREE.Color('#c8c8c4'), null, W0, null);
      }
    }
    if (C.st && C.st.length >= 2) {
      const st = nearestRail(C.st[0] / 10, C.st[1] / 10);
      if (st) {
        shed(st.qx, st.qz, st.ux, st.uz, 150, 30, 11, '#8f969c');                                     // station roof over the tracks
        shed(st.qx - st.uz * 42 + st.ux * 15, st.qz + st.ux * 42 + st.uz * 15, st.ux, st.uz, 120, 24, 8, '#9aa1a7');   // bus terminal beside it
        for (const k of [-1, 1]) {                                                                     // footbridge across the avenue
          const bx = st.qx - st.uz * 28 * k, bz = st.qz + st.ux * 28 * k;
          prism([bx - 2, bx + 2, bx + 2, bx - 2].map((x, i) => x + st.ux * (i < 2 ? -1 : 1)), [bz - 2, bz - 2, bz + 2, bz + 2], GROUND + 6, GROUND + 7.5, new THREE.Color('#d6d4cf'), new THREE.Color('#9a9893'));
        }
      }
    }

    const geoOf = (o, uv) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(o.c, 3));
      if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals(); return g;
    };
    const wallMat = std({ map: facadeTex, vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), roofMat = std({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
    cityG.add(new THREE.Mesh(geoOf(W0, W0.uv), wallMat), new THREE.Mesh(geoOf(R0), roofMat));
    cityG.add(new THREE.Mesh(geoOf(RT, RT.uv), std({ map: tileTex, vertexColors: true, roughness: 0.75, side: THREE.DoubleSide })));
    cityG.add(new THREE.Mesh(geoOf(PL), std({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide })));

    // flat ground features: streets, rails, parks
    // flat ground layers are drawn in a fixed order without writing depth, so coplanar
    // streets / parks / rails can never z-fight (flicker) against each other or the ground
    const flat = (list, order, color) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(list, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, std({ color, roughness: 0.95, side: THREE.DoubleSide, depthWrite: false }));
      m.renderOrder = order; m.receiveShadow = true; cityG.add(m); return m;
    };
    const ribbon = (out, pts, w, y, ext = true) => {
      for (let i = 0; i + 3 < pts.length; i += 2) {
        let ax = pts[i], az = pts[i + 1], bx = pts[i + 2], bz = pts[i + 3];
        const L = Math.hypot(bx - ax, bz - az) || 1, dx = (bx - ax) / L, dz = (bz - az) / L, px = -dz * w / 2, pz = dx * w / 2;
        if (ext) { ax -= dx * w / 2; az -= dz * w / 2; bx += dx * w / 2; bz += dz * w / 2; }
        out.push(ax + px, y, az + pz, bx + px, y, bz + pz, bx - px, y, bz - pz, ax + px, y, az + pz, bx - px, y, bz - pz, ax - px, y, az - pz);
      }
    };
    const road = [], gravel = [], steel = [], park = [], pitch = [];
    for (const r of C.r) ribbon(road, r.slice(1).map(v => v / 10), r[0] / 10, GROUND + 0.3);
    { const main = C.rl.reduce((a, b) => (b.length > a.length ? b : a)); ribbon(road, main.map(v => v / 10), 52, GROUND + 0.3, false); }   // Radial Leste carriageways
    for (const r of C.rl) {
      const p = r.map(v => v / 10); ribbon(gravel, p, 3.6, GROUND + 0.4, false);
      for (const off of [-0.72, 0.72]) {
        const q = [];
        for (let i = 0; i + 3 < p.length; i += 2) {
          const L = Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]) || 1, nx = -(p[i + 3] - p[i + 1]) / L * off, nz = (p[i + 2] - p[i]) / L * off;
          q.push(p[i] + nx, p[i + 1] + nz, p[i + 2] + nx, p[i + 3] + nz);
        }
        for (let i = 0; i < q.length; i += 4) ribbon(steel, q.slice(i, i + 4), 0.08, GROUND + 0.5, false);
      }
    }
    const polyOf = arr => { const xs = [], zs = []; for (let i = 0; i + 1 < arr.length; i += 2) { xs.push(arr[i] / 10); zs.push(arr[i + 1] / 10); } return { xs, zs }; };
    const fill = (out, xs, zs, y) => {
      const contour = xs.map((x, i) => new THREE.Vector2(x, zs[i]));
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contour, [])) out.push(xs[a], y, zs[a], xs[b], y, zs[b], xs[c], y, zs[c]);
    };
    const polyArea = (xs, zs) => { let s = 0; for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) s += (xs[j] + xs[i]) * (zs[j] - zs[i]); return Math.abs(s / 2); };
    const inPoly = (x, z, xs, zs) => { let inside = false; for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) if ((zs[i] > z) !== (zs[j] > z) && x < (xs[j] - xs[i]) * (z - zs[i]) / (zs[j] - zs[i]) + xs[i]) inside = !inside; return inside; };
    // big football fields are bare red clay (terrão) in the aerial photos – the Parque do Tatuapé / CEU fields; small courts stay green
    const clay = [], keepOpen = [];                                   // keepOpen: pitches + pool decks, no park trees on them
    for (const gp of C.g) {
      const { xs, zs } = polyOf(gp.slice(1));
      const big = gp[0] === 2 && polyArea(xs, zs) > 1500;
      fill(gp[0] === 2 ? (big ? clay : pitch) : park, xs, zs, GROUND + 0.15);
      if (gp[0] === 2) keepOpen.push({ xs, zs });
    }
    // swimming pools (OSM, ground level): water + a light paved deck around the big ones (the clube's clover pool)
    const water = [], deck = [];
    for (const pp of C.pl || []) {
      const { xs, zs } = polyOf(pp); if (xs.length < 3) continue;
      fill(water, xs, zs, GROUND + 0.2);
      if (polyArea(xs, zs) > 150) {
        const r = minRect(xs, zs), m = 7, c4 = [[r.u0 - m, r.v0 - m], [r.u1 + m, r.v0 - m], [r.u1 + m, r.v1 + m], [r.u0 - m, r.v1 + m]].map(([u, v]) => [u * r.ca - v * r.sa, u * r.sa + v * r.ca]);
        fill(deck, c4.map(p => p[0]), c4.map(p => p[1]), GROUND + 0.18); keepOpen.push({ xs: c4.map(p => p[0]), zs: c4.map(p => p[1]) });
      }
    }
    flat(park, -9, '#5f7f40'); flat(pitch, -8, '#5c9a44'); flat(clay, -8, '#b4703f'); flat(deck, -8, '#d9cdb4'); flat(road, -7, '#45474b'); flat(gravel, -6, '#7a7166'); flat(steel, -5, '#b8bcc0');
    { const w = flat(water, -4, '#3fa7d6'); w.material.roughness = 0.15; w.material.metalness = 0.1; }

    // trees: OSM trees + street trees along local streets + trees inside parks
    const T = [];
    for (const t of C.t) T.push([t[0] / 10, t[1] / 10]);
    for (const r of C.r) {
      const w = r[0] / 10; if (w > 9.5 || w < 6) continue;            // residential / tertiary streets
      const p = r.slice(1).map(v => v / 10);
      for (let i = 0; i + 3 < p.length; i += 2) {
        const L = Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]); if (L < 1) continue;
        const dx = (p[i + 2] - p[i]) / L, dz = (p[i + 3] - p[i + 1]) / L;
        for (let s = 6; s < L; s += 13) for (const side of [-1, 1]) if (rnd() < 0.5)
          T.push([p[i] + dx * s - dz * side * (w / 2 + 1.6), p[i + 1] + dz * s + dx * side * (w / 2 + 1.6)]);
      }
    }
    // parks: a closed canopy like the satellite photo (Parque do Tatuapé is a wood), clear of the fields and pool decks
    const openArea = (x, z) => keepOpen.some(o => inPoly(x, z, o.xs, o.zs));
    for (const gp of C.g) {
      if (gp[0] === 2) continue;
      const { xs, zs } = polyOf(gp.slice(1));
      const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
      const n = Math.min(3000, ((x1 - x0) * (z1 - z0)) / 22);
      for (let k = 0; k < n; k++) {
        const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
        if (inPoly(x, z, xs, zs) && !openArea(x, z)) T.push([x, z]);
      }
    }
    // keep every canopy clear of the buildings: distance from the trunk to the nearest footprint (0 = inside one)
    const footDist = (x, z, r) => {
      let best = Infinity; const i0 = Math.floor((x - r) / FC), i1 = Math.floor((x + r) / FC), j0 = Math.floor((z - r) / FC), j1 = Math.floor((z + r) / FC), seen = new Set();
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const f of FOOT.get(fkey(i, j)) || []) {
        if (seen.has(f)) continue; seen.add(f);
        const { xs, zs } = f; let inside = false;
        for (let a = 0, b = xs.length - 1; a < xs.length; b = a++) {
          if ((zs[a] > z) !== (zs[b] > z) && x < (xs[b] - xs[a]) * (z - zs[a]) / (zs[b] - zs[a]) + xs[a]) inside = !inside;
          const ex = xs[a] - xs[b], ez = zs[a] - zs[b], L2 = ex * ex + ez * ez || 1, t = Math.max(0, Math.min(1, ((x - xs[b]) * ex + (z - zs[b]) * ez) / L2));
          best = Math.min(best, Math.hypot(x - xs[b] - ex * t, z - zs[b] - ez * t));
        }
        if (inside) return 0;
      }
      return best;
    };
    const trees = [];                                                                 // [x, z, canopy radius]
    for (const [x, z] of T) {
      if (inLot(x, z)) continue;                                                      // keep the tower's lot clear
      let s = 2.2 + rnd() * 2.4; const d = footDist(x, z, s + 0.5);
      if (d < 1.6) continue;                                                          // trunk on / against a building: no tree
      s = Math.min(s, d - 0.4); trees.push([x, z, s]);                                // shrink the canopy so it stops short of the wall
    }
    const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std({ roughness: 0.9 }), trees.length);
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.25, 1, 6), std({ color: '#5a4636', roughness: 1 }), trees.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const greens = pal(['#4f7a3a', '#5e8a42', '#3f6a33', '#6a9150', '#567f3d']);
    trees.forEach(([x, z, s], i) => {
      const th = 2.5 + rnd() * 2;
      m4.compose(ps.set(x, GROUND + th + s * 0.7, z), q, sc.set(s, s * 0.8, s)); canopy.setMatrixAt(i, m4);
      canopy.setColorAt(i, greens[i % 5]);
      m4.compose(ps.set(x, GROUND + th / 2 + 0.5, z), q, sc.set(1, th + 1, 1)); trunk.setMatrixAt(i, m4);
    });
    cityG.add(canopy, trunk);

    // base ground (sidewalks / lots)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), std({ color: '#8f8b84', roughness: 1, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND; ground.renderOrder = -10; cityG.add(ground);
  }
  if (window.CITY) buildCity(window.CITY);
  cityG.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) m.userData.city = true; });   // tag: static meshes get merged out of cityG later

  // ---------------------------------------------------------------------------
  // THE TOWER – Platinum Tatuapé by Diálogo, after the brochure renders: white frame with the stack of
  // wood-tone balconies on the Rua Platina face, white long faces with window bands, crown frame on the
  // roof, two-storey podium (wood slats, glass lobby) with the leisure deck, gardens and the 25 m pool.
  // ---------------------------------------------------------------------------
  const towerAbove = new THREE.Group(); world.add(towerAbove);  // floors above the apartment – hidden in the V cut-away
  const TL0 = new THREE.Group(), TA0 = new THREE.Group(); TL0.position.x = TA0.position.x = TX0; siteW.add(TL0); { const g = flipG(); towerAbove.add(g); g.add(TA0); }   // tower-local frames
  function buildTower() {
    const streetTex = canvasTex(1024, 256, (g, w, h) => {      // Rua Platina face: full 21 m width × 2 floors
      g.fillStyle = '#f1efea'; g.fillRect(0, 0, w, h);
      const x0 = w * 0.05, x1 = w * 0.7;
      for (let f = 0; f < 2; f++) {
        const y = f * h / 2, fh = h / 2;
        g.fillStyle = '#4e3829'; g.fillRect(x0, y, x1 - x0, fh);                                   // wood-tone balcony back wall
        for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#5e4535' : '#46332a'; g.fillRect(x0 + (x1 - x0) * k / 6, y, (x1 - x0) / 6 - 2, fh * 0.88); }   // wood panels
        g.fillStyle = 'rgba(205,215,220,0.22)'; g.fillRect(x0, y + fh * 0.5, x1 - x0, fh * 0.38);   // glass railing
        g.fillStyle = '#2b2b2b'; g.fillRect(x0, y + fh * 0.5, x1 - x0, 2);
        g.fillStyle = '#f6f4f0'; g.fillRect(x0 - 6, y + fh * 0.88, x1 - x0 + 12, fh * 0.12);         // balcony slab edge
        g.fillRect(f ? x0 + (x1 - x0) * 0.56 : x0 + (x1 - x0) * 0.2, y + fh * 0.16, (x1 - x0) * 0.2, fh * 0.34);   // white box, alternating
        for (const k of [0.36, 0.66]) g.fillRect(x0 + (x1 - x0) * k, y, 3, fh * 0.88);              // thin white mullions
      }
      g.fillStyle = '#e3e0da'; g.fillRect(x1, 0, w * 0.045, h);                                     // white fin between the two parts
      for (let f = 0; f < 2; f++) {
        const y = f * h / 2, fh = h / 2;
        g.fillStyle = '#4b555e'; g.fillRect(w * 0.79, y + fh * 0.14, w * 0.16, fh * 0.6);
        g.fillStyle = 'rgba(205,214,219,0.75)'; g.fillRect(w * 0.79, y + fh * 0.5, w * 0.16, fh * 0.24);
        g.fillStyle = '#dcd8d1'; g.fillRect(w * 0.745, y + fh * 0.9, w * 0.255, fh * 0.1);
      }
    });
    const sideTex = canvasTex(256, 128, (g, w, h) => {        // long faces: one 3.5 m bay × one floor
      g.fillStyle = '#efede8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#4b555e'; g.fillRect(w * 0.12, h * 0.14, w * 0.62, h * 0.62);
      g.fillStyle = 'rgba(205,214,219,0.75)'; g.fillRect(w * 0.12, h * 0.52, w * 0.62, h * 0.24);
      g.fillStyle = '#2b2b2b'; g.fillRect(w * 0.12, h * 0.52, w * 0.62, 2);
      g.fillStyle = '#dcd8d1'; g.fillRect(0, h * 0.9, w, h * 0.1);
      g.fillStyle = '#e3e0da'; g.fillRect(w * 0.86, 0, w * 0.06, h);
    });
    const slatTex = canvasTex(256, 256, (g, w, h) => {        // podium: vertical wood slats (render at street level)
      g.fillStyle = '#5d4532'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? '#a77d56' : '#97704e'; g.fillRect(x + 3, 0, 10, h); }
    });
    const lobbyTex = canvasTex(256, 256, (g, w, h) => {       // glass lobby with a wood-slat band over it
      g.fillStyle = '#3d4a52'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e9e6e0'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 5, h);
      for (let x = 0; x < w; x += 10) { g.fillStyle = '#a77d56'; g.fillRect(x + 2, 0, 6, h * 0.3); }
    });
    const loggiaTex = canvasTex(256, 256, (g, w, h) => {     // recessed loggia wall: one 3.5 m bay × one floor – wide glazing (photos)
      g.fillStyle = '#e9e7e2'; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9aa8b1'); gr.addColorStop(1, '#6f7d87');
      g.fillStyle = gr; g.fillRect(w * 0.03, h * 0.04, w * 0.94, h * 0.96);                       // glazing, full bay
      g.fillStyle = '#4f5a62'; for (const k of [0.27, 0.5, 0.73]) g.fillRect(w * k, h * 0.04, 3, h * 0.96);   // mullions
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(w * 0.03, h * 0.04, w * 0.94, h * 0.08);
    });
    const stackTex = canvasTex(256, 256, (g, w, h) => {      // Rua Platina balcony stack: wood-tone back wall + glazing
      g.fillStyle = '#4e3829'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#5e4535' : '#46332a'; g.fillRect(k * w / 4, 0, w / 4 - 2, h); }
      g.fillStyle = '#3a434b'; g.fillRect(w * 0.1, h * 0.15, w * 0.45, h * 0.85);
    });
    const smallWinTex = canvasTex(128, 128, (g, w, h) => {   // white wall with the small square windows
      g.fillStyle = '#eceae5'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3d4852'; g.fillRect(w * 0.38, h * 0.35, w * 0.24, h * 0.3);
    });
    const T = { street: streetTex, side: sideTex, slat: slatTex, lobby: lobbyTex, loggia: loggiaTex, stack: stackTex, smallwin: smallWinTex };
    const mat = t => std({ map: T[t], roughness: 0.8, side: THREE.DoubleSide });
    const MT = { street: mat('street'), side: mat('side'), slat: mat('slat'), lobby: mat('lobby'), loggia: mat('loggia'), stack: mat('stack'), smallwin: mat('smallwin') };
    const plain = c => std({ color: c, roughness: 0.85 });
    const white = plain('#efede8'), cap = plain('#d6d2ca'), deck = plain('#cdbfa9'), hedge = plain('#4f7a3a');
    // vertical face (x0,z0)→(x1,z1), y0..y1; texture coordinates follow the real metres so pieces line up
    function face(parent, x0, z0, x1, z1, y0, y1, m, uSize, vSize, uOff = 0) {
      const len = Math.hypot(x1 - x0, z1 - z0), g = new THREE.BufferGeometry();
      const u0 = uOff / uSize, u1 = (uOff + len) / uSize, v0 = (y0 - LEVEL(0)) / vSize, v1 = (y1 - LEVEL(0)) / vSize;
      g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y0, z0, x1, y1, z1, x0, y1, z0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
      g.computeVertexNormals();
      const o = new THREE.Mesh(g, MT[m] ?? m); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
    }
    const slab = (parent, x0, x1, z0, z1, y, m = cap) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m); o.rotation.x = -Math.PI / 2; o.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); o.receiveShadow = true; parent.add(o); };
    const block = (parent, x0, x1, y0, y1, z0, z1, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
    // the four faces of a stretch of tower between y0 and y1
    const shaft = (parent, y0, y1) => {
      face(parent, 0, zN, TW, zN, y0, y1, 'street', TW, 2 * FLOOR_H);          // Rua Platina face
      face(parent, TW, zS, 0, zS, y0, y1, 'side', 3.5, FLOOR_H);               // back face
      face(parent, 0, zS, 0, zN, y0, y1, 'side', 3.5, FLOOR_H);                // east face
      face(parent, TW, zN, TW, zS, y0, y1, 'side', 3.5, FLOOR_H);              // west face
    };
    // THE TOWER BODY – the very same model as the M view (building.js, tower only), clipped: on an apartment level the
    // unit's own floor is left out (only the neighbour flats of that floor are kept, under the apartment's cut plane);
    // everything above the apartment / above the site level goes into towerAbove (hidden in the V cut-away).
    const SITE_MIN = SITE && LEVEL(2) <= H + 0.3 ? H + 0.3 : -Infinity;      // on the 2º pavimento the tower starts above this floor
    {
      const INF = 1e5, gy = y => y - GROUND, tz = z => z - zN, ALL = { x0: -INF, x1: INF, z0: -INF, z1: INF }, low = [], high = [];
      if (SITE) high.push({ ...ALL, y0: SITE_MIN === -Infinity ? -INF : gy(SITE_MIN), y1: INF });
      else {
        low.push({ ...ALL, y0: -INF, y1: gy(-0.3) });
        high.push({ ...ALL, y0: gy(H + 0.3), y1: INF });
        const ue = X(meta.tower.east), wx = Math.max(0, X(meta.tower.wing[0])), wz = Z(meta.tower.wing[1]);
        const fills = [[ue, TW, 0, zN], [0, wx, wz, 0], [0, TW, zS, wz]].filter(([a, b, c, d]) => b - a > 0.05 && d - c > 0.05);
        for (const [xs, zs] of meta.tower.extra) fills.push([Math.min(...xs.map(X)), Math.max(...xs.map(X)), Math.min(...zs.map(Z)), Math.max(...zs.map(Z))]);
        for (const [x0, x1, z0, z1] of fills) {                                // neighbour flats on the apartment's floor (outer façade edges run on)
          low.push({ x0: Math.abs(x0) < 0.01 ? -INF : x0, x1: Math.abs(x1 - TW) < 0.01 ? INF : x1, y0: gy(-0.3), y1: gy(H + 0.3),
            z0: Math.abs(z0 - zS) < 0.01 ? -INF : tz(z0), z1: Math.abs(z1 - zN) < 0.01 ? INF : tz(z1) });
          slab(TL0, x0, x1, z0, z1, H + 0.3 - 0.01);                          // cut floor plate seen in the V view
        }
        slab(TL0, 0, TW, zS, zN, -0.32);
      }
      const opts = { TW, TL, TFS, TXS: TX0 - TXA, REC_D: RD, FH: FLOOR_H, FLOORS: TOWER_FLOORS, STREET, towerOnly: true };
      for (const [list, parent] of [[low, TL0], [high, TA0]]) if (list.length) {
        const m = buildBuildingModel({ ...opts, clip: list }); m.position.set(TXA - TX0, GROUND, zP); parent.add(m);
      }
    }
    if (SITE) {                                                                // site level: podium floors above it (1º + 2º pavimento)
      const pm = std({ map: T.slat, roughness: 0.8, side: THREE.DoubleSide }), deckM = deck;
      for (const [a, b, c, d, yb = H + 0.3] of PODIUM > H + 0.31 ? SITE.podium : []) {     // optional 5th value: bottom of the mass (double-height rooms)
        if (PODIUM - yb < 0.01) continue;
        const x0 = X(Math.min(a, c)), x1 = X(Math.max(a, c)), z0 = Z(Math.min(b, d)), z1 = Z(Math.max(b, d));
        const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, PODIUM - yb, z1 - z0), [white, white, deckM, white, white, white]);
        o.position.set((x0 + x1) / 2, (PODIUM + yb) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; towerAbove.add(o);
      }
      return;
    }
    // tower base: glass lobby with the wood-slat band, white frame (street level render)
    face(TL0, 0, zP, TW, zP, LEVEL(0), PODIUM, 'lobby', 5, PODIUM - LEVEL(0));                                     // lobby on the podium front
    block(TL0, -0.3, TW + 0.3, PODIUM - 0.6, PODIUM, zP, zP + 1.2, white);
    for (const x of [-0.3, TW - 0.3]) block(TL0, x, x + 0.6, LEVEL(0), PODIUM, zP, zP + 1.2, white);
    face(TL0, TW, zS, 0, zS, LEVEL(0), PODIUM, 'side', 3.5, FLOOR_H);
    for (const x of [0, TW]) face(TL0, x, x ? zP : zN, x, x ? zN : zP, LEVEL(0), PODIUM, 'side', 3.5, FLOOR_H);    // podium sides in front of the tower
    slab(TL0, 0, TW, zN, zP, PODIUM, deck);                                                                         // open deck in front of the tower (churrasqueira)
    block(TL0, 0, TW, GROUND, LEVEL(0), zS, zP, plain('#bdb8b0'));                                                  // plinth up to the térreo floor
    // podium (lot minus the tower), apartment frame: x = S_EAST − along-street, z = zN + D_NORTH − depth
    const lx = a => S_EAST - a, lz = d => zN + D_NORTH - d;
    const parts = [
      [lx(LOT_S0 + LOT_W_BACK) + 1, 0, lz(LOT_D0 + LOT_D) + 1, zP],           // east of the tower (full depth)
      [TW, lx(LOT_S0) - 1, lz(LOT_D0 + LOT_D) + 1, zP],                        // west strip
      [lx(LOT_S0 + LOT_W) + 1, lx(LOT_S0 + LOT_W_BACK) + 1, lz(LOT_D0 + 28), zP],   // pool wing
    ];
    for (const [x0, x1, z0, z1] of parts) {
      if (x1 - x0 < 0.5) continue;
      face(TL0, x0, z1, x1, z1, GROUND, PODIUM, 'slat', 3, 3);              // street side: wood slats
      face(TL0, x1, z0, x0, z0, GROUND, PODIUM, 'side', 3.5, FLOOR_H);
      face(TL0, x0, z0, x0, z1, GROUND, PODIUM, 'side', 3.5, FLOOR_H);
      face(TL0, x1, z1, x1, z0, GROUND, PODIUM, 'side', 3.5, FLOOR_H);
      slab(TL0, x0, x1, z0, z1, PODIUM, deck);
      block(TL0, x0, x1, PODIUM, PODIUM + 0.9, z1 - 1.2, z1, hedge);         // planter along the street edge
    }
    // leisure deck: 25 m pool in the pool wing (2º pavimento plan), palms
    const pw = parts[2];
    block(TL0, pw[0] + 1.5, pw[1] - 1.5, PODIUM - 0.4, PODIUM + 0.05, pw[3] - 27, pw[3] - 2, std({ color: '#3fa7c9', roughness: 0.05, metalness: 0.1 }));
    const palm = (x, z) => {
      block(TL0, x - 0.15, x + 0.15, PODIUM, PODIUM + 5, z - 0.15, z + 0.15, plain('#8a7a66'));
      const c = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 7), hedge); c.position.set(x, PODIUM + 5.4, z); c.rotation.x = Math.PI; TL0.add(c);
    };
    for (const [x, z] of [[-3, zN - 3], [-3, zN - 20], [-3, zN - 40], [TW + 4, zN - 10], [TW + 4, zN - 35], [pw[0] + 1, zN - 30]]) palm(x, z);
  }
  buildTower();
  // M view: stand-alone model of the whole building (src/engine/building.js), placed on the tower's real spot
  const mModel = buildBuildingModel({ TW, TL, TFS, TXS: TX0 - TXA, REC_D: RD, FH: FLOOR_H, FLOORS: TOWER_FLOORS, STREET });
  mModel.position.set(TXA, GROUND, zP); mModel.visible = false; siteW.add(mModel);                // model origin = podium front

  // ---------- map pins: the places on the brochure (times from the brochure, "Fonte: Google Maps");
  // positions from OpenStreetMap / Nominatim. Academia Bio Ritmo Tatuapé is not in OpenStreetMap – no pin.
  // labels live in their own scene so the ambient-occlusion pass can't wash them out
  const labelScene = new THREE.Scene(), labelGroup = new THREE.Group(); labelScene.add(labelGroup);
  const labelSite = flipG(); labelGroup.add(labelSite);
  const labelCity = new THREE.Group(); labelCity.rotation.y = CITY_ROT; labelCity.position.set(CITY_POS[0], 0, CITY_POS[1]); labelSite.add(labelCity);
  const pinSprites = [];
  // ?embed=orbit|home (home page): only the places close to the tower get a pin – the far ones (shoppings, Marginal…) were
  // tried as edge cards and made the view too busy (user)
  const EMBED = ['orbit', 'home'].includes(new URLSearchParams(location.search).get('embed')), CLOSE = 1000;
  const TOWER_C = [TX0 + TW / 2, (zN + zS) / 2];
  const cityToWorld = (x, z) => { const c = Math.cos(CITY_ROT), s = Math.sin(CITY_ROT); return [CITY_POS[0] + x * c + z * s, CITY_POS[1] - x * s + z * c]; };
  const LABEL_FONT = 'Manrope, system-ui, "Segoe UI", sans-serif';
  // label look = a white listing card: the place's photo on top (when there is one), its name, a line with a small
  // map-pin glyph, and under the card a round navy marker whose tip is the sprite's anchor. Everything is opaque
  // (the sprites are alpha-tested cut-outs), so the card gets a solid hairline instead of a soft shadow.
  // dir ('l' | 'r' | 'u' | 'd'): edge version for a place outside the frame – text only, an arrow on that side
  // photo: undefined = no picture · null = picture still loading (grey placeholder) · HTMLImageElement
  function drawLabel(title, sub, accent, dir, photo) {
    const K = 2, c = document.createElement('canvas'), g = c.getContext('2d');
    const NAVY = '#151c3a', tf = `700 ${19 * K}px ${LABEL_FONT}`, sf = `500 ${13.5 * K}px ${LABEL_FONT}`;
    const measure = (txt, font) => { g.font = font; if ('letterSpacing' in g) g.letterSpacing = '0px'; return g.measureText(txt).width; };
    const tw = measure(title, tf), sw = measure(sub, sf);
    const pic = photo !== undefined, pad = 12 * K, inset = 6 * K, glyph = 15 * K, r = 15 * K, bw = 1.5 * K;
    const picH = pic ? 112 * K : 0, textH = 58 * K, cardH = (pic ? inset + picH : 0) + textH;
    const mark = 44 * K, ext = 13 * K, sideA = dir === 'l' || dir === 'r', vertA = dir === 'u' || dir === 'd';
    const cardW = Math.ceil(Math.max(pic ? 196 * K : 0, tw + pad * 2, sw + glyph + pad * 2));
    const W = cardW + 4 * K + (sideA ? ext : 0), H = cardH + 4 * K + (dir ? (vertA ? ext : 0) : mark);
    c.width = W; c.height = H;
    const x0 = 2 * K + (dir === 'l' ? ext : 0), y0 = 2 * K + (dir === 'u' ? ext : 0), cx = x0 + cardW / 2;
    // card
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(x0, y0, cardW, cardH, r); g.fill();
    g.strokeStyle = '#cfd5e2'; g.lineWidth = bw; g.beginPath(); g.roundRect(x0 + bw / 2, y0 + bw / 2, cardW - bw, cardH - bw, r - bw / 2); g.stroke();
    let ty = y0;
    if (pic) {                                                                // photo, cover-fitted into a rounded window
      const px = x0 + inset, py = y0 + inset, pw = cardW - inset * 2;
      g.save(); g.beginPath(); g.roundRect(px, py, pw, picH, r - inset * 0.6); g.clip();
      g.fillStyle = '#e6eaf2'; g.fillRect(px, py, pw, picH);
      if (photo) { const s = Math.max(pw / photo.naturalWidth, picH / photo.naturalHeight), iw = photo.naturalWidth * s, ih = photo.naturalHeight * s;
        g.drawImage(photo, px + (pw - iw) / 2, py + (picH - ih) / 2, iw, ih); }
      g.restore();
      ty = py + picH;
    }
    // text: name, then pin glyph + detail line
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    measure('', tf); g.fillStyle = NAVY; g.fillText(title, x0 + pad, ty + 25 * K);
    const gx = x0 + pad + 5 * K, gy = ty + 40 * K;                            // map-pin glyph
    g.fillStyle = accent === '#ffffff' || accent === '#c9d4e4' ? '#7f8aa8' : accent;
    g.beginPath(); g.arc(gx, gy, 4.6 * K, Math.PI * 0.85, Math.PI * 0.15); g.lineTo(gx, gy + 8 * K); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(gx, gy, 1.8 * K, 0, Math.PI * 2); g.fill();
    measure('', sf); g.fillStyle = '#5d6685'; g.fillText(sub, x0 + pad + glyph, ty + 45.5 * K);
    if (dir) {                                                                // arrow towards the place, just outside the card
      const ax = dir === 'l' ? x0 - 3 * K : dir === 'r' ? x0 + cardW + 3 * K : x0 + cardW / 2, ay = dir === 'u' ? y0 - 3 * K : dir === 'd' ? y0 + cardH + 3 * K : y0 + cardH / 2;
      const [fx, fy] = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[dir], a = 8 * K, b = 7 * K;
      g.fillStyle = NAVY; g.beginPath();
      g.moveTo(ax + fx * a, ay + fy * a); g.lineTo(ax - fy * b, ay + fx * b); g.lineTo(ax + fy * b, ay - fx * b); g.closePath(); g.fill();
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      return { tex, aspect: W / H, h: H };
    }
    // round marker under the card; its tip is the anchor
    const my = y0 + cardH + 21 * K, mr = 13 * K;
    g.fillStyle = NAVY; g.beginPath(); g.moveTo(cx - 7 * K, my + 9 * K); g.lineTo(cx, H - 1 * K); g.lineTo(cx + 7 * K, my + 9 * K); g.closePath(); g.fill();
    g.beginPath(); g.arc(cx, my, mr, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2.4 * K; g.beginPath(); g.arc(cx, my, mr - 1.2 * K, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = NAVY; g.lineWidth = 1 * K; g.beginPath(); g.arc(cx, my, mr + 0.5 * K, 0, Math.PI * 2); g.stroke();
    g.fillStyle = accent; g.beginPath(); g.arc(cx, my, 4.4 * K, 0, Math.PI * 2); g.fill();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return { tex, aspect: W / H, h: H };
  }
  const LABEL_U = (EMBED ? 0.064 : 0.085) / 176 * (innerWidth < 700 ? 0.8 : 1);               // sprite height per canvas pixel (fraction of the viewport, sizeAttenuation off)
  const labels = [];
  const redraw = l => {                                         // fonts or the photo arrived → draw the card again
    const old = l.tex; Object.assign(l, drawLabel(l.title, l.sub, l.color, undefined, l.photo));
    for (const k in l.edge) l.edge[k].tex.dispose(); l.edge = {};
    if (!l.sp.userData.edge) { l.sp.material.map = l.tex; l.sp.scale.set(LABEL_U * l.h * l.aspect, LABEL_U * l.h, 1); }
    l.sp.material.needsUpdate = true; old.dispose();
  };
  function pin(x, z, title, sub, height, color = '#5cc4d8', pole = true, city = true, img) {
    if (EMBED && title === 'PLATINUM') return;                         // the home page around the panel already says it
    const [wx, wz] = city ? cityToWorld(x, z) : [x, z], near = Math.hypot(wx - TOWER_C[0], wz - TOWER_C[1]) <= CLOSE;
    const extra = EMBED && title === 'Marginal Tietê';                 // home page: the one far place kept (user), with its photo on its edge card
    if (EMBED && !near && !extra) return;                             // home page: otherwise only the places near the tower (the far ones made it too busy)
    if (extra) height = 36;                                          // a short pin: its card sits low, near the ground, not up in the sky
    const mat = std({ color: '#e8edf3', emissive: color, emissiveIntensity: 0.35, metalness: 0.6, roughness: 0.3 }), parent = city ? cityG : siteW;
    if (pole) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, height, 10), mat);
      p.position.set(x, GROUND + height / 2, z); parent.add(p);
      const head = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 14), std({ color, emissive: color, emissiveIntensity: 0.6 }));
      head.position.set(x, GROUND + height, z); parent.add(head);
      mat.userData.pin = head.material.userData.pin = true;             // tag (survives the mesh merge): H hides the poles with the labels
    }
    const photo = img ? null : undefined;
    const { tex, aspect, h } = drawLabel(title, sub, color, undefined, photo);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, sizeAttenuation: false, toneMapped: false, fog: false, transparent: false, alphaTest: 0.5 }));   // opaque cut-out: blended sprites came out washed in the composer path
    sp.center.set(0.5, 0); sp.scale.set(LABEL_U * h * aspect, LABEL_U * h, 1); sp.position.set(x, GROUND + height + 1, z);
    sp.renderOrder = 10;
    (city ? labelCity : labelSite).add(sp);
    const l = { sp, title, sub, color, tex, aspect, h, edge: {}, near, photo, edgeOk: near || extra, edgePhoto: extra };   // edgeOk: rides the screen edge when off-frame · edgePhoto: keeps its photo there
    labels.push(l); sp.userData.label = l; sp.userData.home = sp.position.clone();
    if (title !== 'PLATINUM') pinSprites.push(sp);                       // (the building's own label stays on its roof)
    if (img) { const im = new Image(); im.onload = () => { l.photo = im; redraw(l); }; im.src = `home/places/${img}.jpg`; }   // photos: Wikimedia Commons, see home/places/CREDITS.txt
  }
  // redraw once Manrope has arrived (the first draw may have used the fallback font)
  document.fonts?.load(`700 38px ${LABEL_FONT}`).then(() => document.fonts.load(`500 27px ${LABEL_FONT}`)).then(() => { labels.forEach(redraw); }).catch(() => {});
  {
    const ACESSO = '#4fb6e3', LAZER = '#5fd6b4', COMERCIO = '#c9d4e4';     // identity tones: cyan, sea-green, silver
    const P = (lat, lon, title, sub, h, col, img) => { const [x, z] = geoCity(lat, lon); pin(x, z, title, sub, h, col, true, true, img); };
    pin(TX0 + TW / 2, (zN + zS) / 2, 'PLATINUM', 'Tatuapé by Diálogo', ROOF - GROUND + 14, '#ffffff', false, false);
    pin(TX0 + TW / 2, zN + D_NORTH, 'Rua Platina', 'rua do empreendimento', 12, COMERCIO, false, false, 'platina');
    { const [x, z] = geoCity(-23.5398338, -46.5609694); pin(x, z, 'Praça Heitor Levi', 'praça', 10, LAZER, false); }
    // ACESSOS
    P(-23.5378874, -46.5642624, 'Estação Carrão', 'Metrô L3 · 250 m · 2 min', 26, ACESSO, 'carrao');
    P(-23.5376, -46.5608, 'Radial Leste', 'acesso · 300 m · 1 min', 34, ACESSO, 'radial');
    P(-23.52529, -46.56716, 'Marginal Tietê', 'acesso · 8 min', 130, ACESSO, 'marginal');
    P(-23.5416286, -46.5804546, 'Av. Salim Farah Maluf', 'acesso · 10 min', 150, ACESSO, 'salim');
    // LAZER
    P(-23.542648, -46.5694127, 'Teatro Fernando Torres', 'lazer · 6 min', 95, LAZER);
    P(-23.5580009, -46.5570272, 'Parque CERET', 'lazer · 10 min', 115, LAZER, 'ceret');     // OSM "Parquinho Ceret" inside the park
    // COMÉRCIO E SERVIÇOS
    P(-23.5467226, -46.5636694, 'Sonda Supermercados', 'supermercado · 4 min', 60, COMERCIO);
    P(-23.5417815, -46.5674717, 'St. Marche', 'supermercado · 7 min', 75, COMERCIO);
    P(-23.541689, -46.5770464, 'Shopping Tatuapé', 'shopping · 7 min', 110, COMERCIO, 'shoptat');
    P(-23.5389987, -46.5763358, 'Shopping Boulevard Tatuapé', 'shopping · 9 min', 80, COMERCIO);
    P(-23.5614602, -46.5601597, 'Shopping Anália Franco', 'shopping · 10 min', 135, COMERCIO, 'analia');
  }

  // ---------------------------------------------------------------------------
  // POST-PROCESSING (ambient occlusion + subtle bloom)
  // ---------------------------------------------------------------------------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth * DPR, innerHeight * DPR, { type: THREE.HalfFloatType, samples: 4 }));
  const renderPass = new RenderPass(scene, camera);
  const gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1, thickness: 1, scale: 1.1, samples: 16, distanceFallOff: 1 });
  // stronger edge-aware denoise → smooth contact shadows without grain
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 10, rings: 4, samples: 32 });
  // GTAO (and Ultra's SSR) render the scene's depth + normals with ONE override material, which ignores alphaTest,
  // transparency and depthWrite. So cut-out foliage, the LED-cove light sheets (additive planes along the walls), glass
  // panes and other see-through helpers were drawn there as solid walls: the AO darkened hard-edged rectangles around
  // them – the "ghost squares". Hide every such mesh while those buffers are drawn; they still render normally.
  const ghostly = o => (o.isMesh || o.isInstancedMesh || o.isSprite) && [].concat(o.material).some(m => m && (m.alphaTest > 0 || m.transparent || !m.depthWrite));
  let ghosts = null;
  const withoutGhosts = fn => (...args) => {
    if (!ghosts) { ghosts = []; scene.traverse(o => { if (ghostly(o)) ghosts.push(o); }); }
    const was = ghosts.map(o => o.visible);
    for (const o of ghosts) o.visible = false;
    try { return fn(...args); } finally { ghosts.forEach((o, i) => { o.visible = was[i]; }); }
  };
  gtao.render = withoutGhosts(gtao.render.bind(gtao));
  const halfAO = () => {};   // full-resolution AO (half-res produced visible grain)
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.12, 0.4, 2.5);
  const labelPass = new RenderPass(labelScene, camera); labelPass.clear = false;
  composer.addPass(renderPass); composer.addPass(labelPass); composer.addPass(gtao); composer.addPass(new OutputPass());   // labels before the AO pass: they share the scene's depth, so walls still hide them   // bloom left out: it hazed the bright sky
  let quality = true;
  // ---------- ULTRA quality (G cycles High → Ultra → Basic): the "game engine" look on a strong PC ----------
  // supersampled resolution, screen-space reflections on the glossy floors, finer + softer sun shadow, denser AO,
  // bloom only on the lamps / LEDs (high threshold – the sky stays clean), a filmic grade + vignette. Never automatic.
  let ultra = false;
  const ssr = new SSRPass({ renderer, scene, camera, width: innerWidth, height: innerHeight, selects: [] });
  ssr.beautyRenderTarget.samples = 4;                          // its own scene render: keep MSAA edges
  Object.assign(ssr, { opacity: 0.5, maxDistance: 6, thickness: 0.03, blur: true, distanceAttenuation: true, fresnel: true, infiniteThick: false });
  ssr.enabled = false;
  ssr._renderOverride = withoutGhosts(ssr._renderOverride.bind(ssr));   // its depth/normal buffers: same ghost rule as GTAO
  ssr._renderMetalness = withoutGhosts(ssr._renderMetalness.bind(ssr));
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, vig: { value: 0.32 }, sat: { value: 1.08 }, con: { value: 1.06 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, sat, con; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
        c.rgb = mix(vec3(l), c.rgb, sat);                                  // a touch richer colour
        c.rgb = clamp((c.rgb - 0.5) * con + 0.5, 0.0, 1.0);                // gentle contrast
        c.rgb *= vec3(1.015, 1.0, 0.98);                                   // warm white balance
        vec2 d = vUv - 0.5; c.rgb *= 1.0 - vig * smoothstep(0.25, 0.85, dot(d, d) * 2.2);   // soft vignette
        gl_FragColor = c;
      }`,
  });
  grade.enabled = false;
  bloom.threshold = 8; bloom.strength = 0.22; bloom.radius = 0.5; bloom.enabled = false;
  composer.insertPass(ssr, 1); composer.insertPass(bloom, 4); composer.addPass(grade);   // renderPass, ssr, labels, AO, bloom, output, grade
  function setUltra(on) {
    ultra = on;
    if (on && !ssr.selects.length) scene.traverse(o => { if (o.isMesh && o.material?.userData?.glossFloor) ssr.selects.push(o); });
    if (!on) { renderPass.enabled = true; ssr.enabled = false; labelPass.enabled = !document.body.classList.contains('clean'); }
    bloom.enabled = grade.enabled = on;
    // Ultra AO: small radius + thin occluders. With thickness 1 a cabinet near the camera threw a dark halo onto the ceiling
    // behind it, and since every baked cube face computes AO on its own, those halos ended in hard squares at the seams.
    gtao.updateGtaoMaterial({ radius: on ? 0.3 : 0.35, distanceExponent: 1, thickness: on ? 0.15 : 1, scale: on ? 1.2 : 1.1, samples: on ? 32 : 16, distanceFallOff: 1 });
    const R = on ? 4096 : SHADOW_RES;                            // finer, softer sun shadow
    if (sun.shadow.mapSize.x !== R) { sun.shadow.mapSize.set(R, R); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    sun.shadow.radius = on ? 5 : 3; renderer.shadowMap.needsUpdate = true;
    setResolution(on ? Math.min(devicePixelRatio * 1.5, 2.5) / DPR : 1);   // supersampling
  }
  // ---------- automatic quality for slower computers ----------
  // Measures real frame time after start-up; if the machine can't keep ~35+ fps it steps down:
  // 1) contact shadows (AO) off → 2) 75 % resolution → 3) 60 % resolution. Never steps back up by
  // itself (avoids flicker); pressing G gives the viewer manual control again.
  let embedMode = false;                                       // home-page panel (?embed=orbit)
  let autoLevel = 0, autoOn = true, perfT = 0, perfN = 0, perfStart = performance.now();
  const autoNote = document.createElement('div');
  autoNote.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);background:var(--panel);padding:6px 12px;border-radius:8px;font-size:12px;z-index:6;display:none';
  autoNote.className = 'ui'; document.body.appendChild(autoNote);
  function setResolution(scale) {
    const pr = DPR * scale;
    renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight);
    if (embedMode) return;                                     // the 360 embed renders direct: no post-processing buffers
    composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
  }
  function applyAutoLevel() {
    quality = autoLevel === 0;
    setResolution(autoLevel >= 3 ? 0.6 : autoLevel >= 2 ? 0.75 : 1);
    const msg = ['', 'contact shadows off', 'resolution 75 %', 'resolution 60 %'][autoLevel];
    autoNote.textContent = `Performance mode: ${msg} (press G for full quality)`;
    autoNote.style.display = autoLevel ? 'block' : 'none';
    clearTimeout(applyAutoLevel.t); applyAutoLevel.t = setTimeout(() => autoNote.style.display = 'none', 6000);
  }
  function autoQuality(rawDt) {
    if (!autoOn || document.hidden || (!embedMode && !document.hasFocus()) || performance.now() - perfStart < 4000 || rawDt > 0.25) { perfT = perfN = 0; return; }  // only measure a focused, visible window after warm-up
    perfT += rawDt; perfN++;
    if (perfT < 2) return;
    const avgMs = (perfT / perfN) * 1000; perfT = 0; perfN = 0;
    autoQuality.slow = avgMs > 28 ? (autoQuality.slow || 0) + 1 : 0;              // two slow 2-second windows in a row
    if (autoQuality.slow >= 2 && autoLevel < 3) { autoQuality.slow = 0; autoLevel++; applyAutoLevel(); perfStart = performance.now() - 3000; }
  }
  halfAO();

  // ---------------------------------------------------------------------------
  // ROOMS (for HUD + minimap)
  // ---------------------------------------------------------------------------
  const rooms = meta.rooms;
  const roomAt = (x, z) => rooms.find(({ r }) => x >= X(r[0]) && x <= X(r[2]) && z >= Z(r[1]) && z <= Z(r[3]));

  // ---------------------------------------------------------------------------
  // PLAYER
  // ---------------------------------------------------------------------------
  const controls = new PointerLockControls(camera, document.body);
  // Chrome/Windows pointer-lock bug: after a frame hitch it can deliver one bogus mousemove with a huge movementX/Y,
  // which spins the view around. Drop such spikes before PointerLockControls sees them (capture phase on window).
  addEventListener('mousemove', e => {
    if (controls.isLocked && (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250)) e.stopImmediatePropagation();
  }, true);
  camera.position.set(X(meta.spawn[0]), EYE, Z(meta.spawn[1]));
  camera.rotation.set(0, meta.spawn[2], 0, 'YXZ');
  const overlay = document.getElementById('overlay');
  const go = document.getElementById('go');
  overlay.addEventListener('click', () => { if (!topView) controls.lock(); else overlay.style.display = 'none'; });
  controls.addEventListener('lock', () => { overlay.style.display = 'none'; if (go) go.textContent = 'Click to enter'; });
  // Chrome sometimes refuses the mouse lock (e.g. right after Esc) – say so instead of doing nothing
  document.addEventListener('pointerlockerror', () => { if (go) go.textContent = 'Click again'; });
  controls.addEventListener('unlock', () => { if (!topView) overlay.style.display = 'flex'; });

  const orbit = new OrbitControls(topCam, renderer.domElement);
  orbit.target.set(X(meta.top.at[0]), 0, Z(meta.top.at[1]));
  topCam.position.set(X(meta.top.at[0]), meta.top.height, Z(meta.top.at[1]) + meta.top.back);
  orbit.enabled = false; orbit.maxDistance = 1500;
  let topView = false, aerialView = false;              // aerialView (M): the whole tower is shown

  const keys = {};
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyV') {
      topView = !topView; aerialView = false;
      ceilingGroup.visible = !topView;
      orbit.enabled = topView;
      if (topView) { controls.unlock(); overlay.style.display = 'none'; }
      else overlay.style.display = 'flex';
    }
    if (e.code === 'KeyM') {                                   // aerial neighbourhood view (like the brochure photo)
      aerialView = true;
      if (!topView) { topView = true; ceilingGroup.visible = false; orbit.enabled = true; controls.unlock(); overlay.style.display = 'none'; }
      { const W_ = [Math.cos(CITY_ROT), -Math.sin(CITY_ROT)], N_ = [Math.sin(CITY_ROT), Math.cos(CITY_ROT)], cx = TXA + TW / 2, cz = (zN + zS) / 2;   // real west / north in this frame
        // from the Rua Platina side, east of the tower – the building fills the view, the neighbourhood around it
        const [px, pz] = sw(cx - W_[0] * 95 + N_[0] * 135, cz - W_[1] * 95 + N_[1] * 135), [tx, tz] = sw(cx, cz);
        topCam.position.set(px * SCALE, (GROUND + 75) * SCALE, pz * SCALE);
        orbit.target.set(tx * SCALE, (GROUND + 30) * SCALE, tz * SCALE); orbit.update(); }   // like the brochure's aerial photo orbit.update();   // from Rua Platina, like the brochure render
    }
    if (e.code === 'KeyV' && topView) { topCam.position.set(X(meta.top.at[0]) * SCALE, meta.top.height, (Z(meta.top.at[1]) + meta.top.back) * SCALE); orbit.target.set(X(meta.top.at[0]) * SCALE, 0, Z(meta.top.at[1]) * SCALE); orbit.update(); }
    if (e.code === 'KeyL') roomLights.forEach(l => l.visible = !l.visible);
    if (e.code === 'KeyG') {                                   // High → Ultra → Basic → High
      autoOn = false; autoNote.style.display = 'none';
      if (autoLevel) { autoLevel = 0; setResolution(1); quality = true; say('Quality: High'); }
      else if (quality && !ultra) { setUltra(true); say('Quality: Ultra'); }
      else if (ultra) { setUltra(false); quality = false; say('Quality: Basic (fast)'); }
      else { quality = true; say('Quality: High'); }
    }
  });
  addEventListener('keyup', e => keys[e.code] = false);

  // ---------- screenshot helpers: H hides every on-screen element, F frees the camera (fly anywhere, through walls) ----------
  let free = false, walkMode = false;                        // walkMode: ?embed=walk (home-page plan cards, street-view style)
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--panel);padding:8px 16px;border-radius:10px;font-size:14px;z-index:20;pointer-events:none;opacity:0;transition:opacity .3s';
  document.body.appendChild(toast);
  const say = msg => { toast.textContent = msg; toast.style.opacity = 1; clearTimeout(say.t); say.t = setTimeout(() => toast.style.opacity = 0, 1100); };
  addEventListener('keydown', e => {
    if (free && /^Alt/.test(e.code)) e.preventDefault();        // Alt = slow, not the browser menu
    if (e.repeat) return;
    if (e.code === 'KeyH') { const on = document.body.classList.toggle('clean'); labelPass.enabled = !on; scene.traverse(o => { if (o.isMesh && o.material?.userData?.pin) o.visible = !on; }); if (!on) say('Interface visible'); }   // also the 3D place pins
    if (e.code === 'KeyF') {
      free = !free;
      if (!free) camera.position.y = EYE;                     // back on your feet (you can walk out of a wall you stopped in)
      if (!document.body.classList.contains('clean')) say(free ? 'Free camera · E / Space up · Q / C down · Shift fast · Alt slow' : 'Walking');
    }
  });

  // ---------- scale (1.00 = real size) & field of view ----------
  let SCALE = 1.0;
  const scaleEl = document.getElementById('scaleInfo');
  function setScale(s) {
    s = Math.round(Math.min(2, Math.max(1, s)) * 100) / 100;
    const k = s / SCALE;
    camera.position.x *= k; camera.position.z *= k;
    SCALE = s;
    world.scale.setScalar(s); labelGroup.scale.setScalar(s); renderer.shadowMap.needsUpdate = true; resetSlotPos();
    roomLights.forEach(l => { if (l.userData.d) l.distance = l.userData.d * s; });
    updateScaleInfo();
  }
  const DEFAULT_HFOV = 95;
  let hFov = DEFAULT_HFOV;
  function setFov(f) {
    hFov = Math.min(120, Math.max(60, f));
    camera.fov = 2 * Math.atan(Math.tan(hFov * Math.PI / 360) / camera.aspect) * 180 / Math.PI;
    camera.updateProjectionMatrix(); updateScaleInfo();
  }
  function updateScaleInfo() {
    scaleEl.textContent = `Scale ${SCALE.toFixed(2)}×${SCALE === 1 ? ' (real size)' : ''} · FOV ${Math.round(hFov)}° · eye ${EYE.toFixed(2)} m`;
  }
  addEventListener('keydown', e => {
    if (e.code === 'Equal' || e.code === 'NumpadAdd') setScale(SCALE + 0.05);
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') setScale(SCALE - 0.05);
    if (e.code === 'Digit0' || e.code === 'Numpad0') { setScale(1); setFov(DEFAULT_HFOV); }
  });
  addEventListener('wheel', e => { if (controls.isLocked) setFov(hFov + Math.sign(e.deltaY) * 3); });
  setFov(DEFAULT_HFOV);

  function blocked(x, z) {
    x /= SCALE; z /= SCALE; const r = R / SCALE;
    for (const c of colliders) {
      const px = Math.max(c.x0, Math.min(x, c.x1)), pz = Math.max(c.z0, Math.min(z, c.z1));
      if ((x - px) ** 2 + (z - pz) ** 2 < r * r) return true;
    }
    return false;
  }
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3();
  let bob = 0;
  function updatePlayer(dt) {
    if (!controls.isLocked && !walkMode) return;
    if (free) {                                               // fly where you look, no walls, no fixed eye height, no bob
      const sp = ((keys.ShiftLeft || keys.ShiftRight) ? 7 : (keys.AltLeft || keys.AltRight) ? 0.4 : 2.2) * SCALE * dt;
      camera.getWorldDirection(fwd); right.crossVectors(fwd, camera.up).normalize();
      mv.set(0, 0, 0);
      if (keys.KeyW || keys.ArrowUp) mv.add(fwd);
      if (keys.KeyS || keys.ArrowDown) mv.sub(fwd);
      if (keys.KeyD || keys.ArrowRight) mv.add(right);
      if (keys.KeyA || keys.ArrowLeft) mv.sub(right);
      if (keys.KeyE || keys.Space) mv.y += 1;
      if (keys.KeyQ || keys.KeyC) mv.y -= 1;
      if (mv.lengthSq() > 0) camera.position.addScaledVector(mv.normalize(), sp);
      return;
    }
    const speed = (keys.ShiftLeft || keys.ShiftRight) ? 3.0 : 1.4;
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    right.crossVectors(fwd, camera.up).normalize();
    mv.set(0, 0, 0);
    if (keys.KeyW || keys.ArrowUp) mv.add(fwd);
    if (keys.KeyS || keys.ArrowDown) mv.sub(fwd);
    if (keys.KeyD || keys.ArrowRight) mv.add(right);
    if (keys.KeyA || keys.ArrowLeft) mv.sub(right);
    const moving = mv.lengthSq() > 0;
    if (moving) mv.normalize().multiplyScalar(speed * dt);
    const p = camera.position;
    const stuck = blocked(p.x, p.z);                          // e.g. left free camera inside furniture: let you walk out
    if (stuck || !blocked(p.x + mv.x, p.z)) p.x += mv.x;
    if (stuck || !blocked(p.x, p.z + mv.z)) p.z += mv.z;
    bob = moving ? bob + dt * speed * 5 : bob * 0.9;
    p.y = EYE + Math.sin(bob) * 0.02;
  }

  // ---------------------------------------------------------------------------
  // MINIMAP + HUD
  // ---------------------------------------------------------------------------
  const map = document.getElementById('map'), g2 = map.getContext('2d');
  const MS = meta.mapScale, MO = 8;
  function drawMap() {
    g2.clearRect(0, 0, map.width, map.height);
    for (const rm of rooms.slice().reverse()) {
      g2.fillStyle = rm.c; const [a, b, c, d] = rm.r;
      g2.fillRect(MO + X(a) * MS, MO + Z(b) * MS, (X(c) - X(a)) * MS, (Z(d) - Z(b)) * MS);
    }
    g2.fillStyle = '#333a48';
    for (const c of colliders) g2.fillRect(MO + c.x0 * MS, MO + c.z0 * MS, (c.x1 - c.x0) * MS, (c.z1 - c.z0) * MS);
    if (!topView) {
      const p = camera.position;
      camera.getWorldDirection(fwd);
      const px = MO + p.x / SCALE * MS, pz = MO + p.z / SCALE * MS;
      g2.fillStyle = 'rgba(226,59,59,.25)';
      g2.beginPath(); g2.moveTo(px, pz);
      const a = Math.atan2(fwd.z, fwd.x);
      g2.arc(px, pz, 40, a - 0.6, a + 0.6); g2.fill();
      g2.fillStyle = '#e23b3b'; g2.beginPath(); g2.arc(px, pz, 5, 0, Math.PI * 2); g2.fill();
    }
  }
  const roomName = document.getElementById('roomName'), roomDim = document.getElementById('roomDim');
  let lastRoom = null;
  function updateHud() {
    const rm = topView ? null : roomAt(camera.position.x / SCALE, camera.position.z / SCALE);
    if (rm !== lastRoom) {
      lastRoom = rm;
      if (rm) {
        const w = X(rm.r[2]) - X(rm.r[0]), d = Z(rm.r[3]) - Z(rm.r[1]);
        roomName.textContent = rm.name;
        roomDim.textContent = `${w.toFixed(2)} m × ${d.toFixed(2)} m`;
      } else { roomName.textContent = topView ? 'Overview' : '—'; roomDim.textContent = topView ? 'Drag to orbit · scroll to zoom' : ''; }
    }
  }

  // ---------------------------------------------------------------------------
  addEventListener('resize', () => {
    for (const c of [camera, topCam]) { c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix(); }
    setFov(hFov);
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight); halfAO();
  });
  // debug / tour hook: apt.tp(planX, planY, yawDeg, pitchDeg) teleports to a plan-pixel position
  window.apt = {
    tower: (([cx, cz]) => ({ cx, cz, ground: GROUND }))(sw(TX0 + TW / 2, zN - TL / 2)),
    THREE, camera, setScale, setFov, colliders, planLines, blocked, X, Z, gtao, bloom, ssr, grade, topCam,
    ultra() { autoOn = false; autoLevel = 0; quality = true; setUltra(true); },   // tools/bake_pano.mjs: Ultra without the toast
    high() { autoOn = false; autoLevel = 0; quality = true; setUltra(false); },   // tools/bake_visit.mjs: High, no automatic downgrade
    orbit, renderer, composer, scene, labelGroup, levelG, ceilingGroup,
    rooms: meta.rooms, eye: EYE,                                // (tools/bake_pano.mjs: one 360° panorama per room)
    tp(px, pz, yaw = 0, pitch = 0) {
      camera.position.set(X(px) * SCALE, EYE, Z(pz) * SCALE);
      camera.rotation.set(pitch * Math.PI / 180, yaw * Math.PI / 180, 0, 'YXZ');
      overlay.style.display = 'none';
    },
  };
  // 1.75 m person, shown in top view as a size reference
  const avatar = new THREE.Group();
  {
    const skin = std({ color: '#e23b3b', roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.12, 8, 16), skin); body.position.y = 0.73; body.scale.z = 0.7;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), skin); head.position.y = 1.64;
    avatar.add(body, head);
  }
  avatar.visible = false; scene.add(avatar);
  // ---------------------------------------------------------------------------
  // PERFORMANCE: merge static meshes that share a material into single draw calls
  // ---------------------------------------------------------------------------
  function mergeStatic(root, skip = null) {
    root.updateMatrixWorld(true);
    const inv = root.matrixWorld.clone().invert(), buckets = new Map(), victims = [];
    root.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.renderOrder !== 0 || !o.visible) return;
      for (let p = o.parent; p; p = p.parent) if ([].concat(skip).includes(p)) return;
      const m = o.material; if (Array.isArray(m) || m.transparent || !m.depthWrite) return;
      const g = o.geometry, key = [m.uuid, o.castShadow, o.receiveShadow, Object.keys(g.attributes).sort().join(), !!g.index].join('|');
      const geo = g.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      for (const k of Object.keys(geo.morphAttributes)) delete geo.morphAttributes[k];
      if (!buckets.has(key)) buckets.set(key, { m, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
      buckets.get(key).geos.push(geo); victims.push(o);
    });
    let before = victims.length, after = 0;
    for (const o of victims) o.parent.remove(o);
    for (const b of buckets.values()) {
      const merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, b.m); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv; root.add(mesh); after++;
    }
    return [before, after];
  }
  initSpotSlots();
  // Area lights (window daylight + under-cabinet LED) get the same treatment: record them,
  // then keep only the RECT_SLOTS nearest ones alive. RectAreaLights have no range, so every
  // pixel pays for every one of them – this is the single biggest per-pixel saving.
  const RECT_SLOTS = 2, rectDefs = [], rectSlots = [];
  {
    world.updateMatrixWorld(true);
    const inv = world.matrixWorld.clone().invert(), found = [];
    world.traverse(o => { if (o.isRectAreaLight) found.push(o); });
    for (const l of found) {
      const m = new THREE.Matrix4().multiplyMatrices(inv, l.matrixWorld), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
      m.decompose(pos, q, sc);
      rectDefs.push({ pos, q, w: l.width, h: l.height, intensity: l.intensity, color: l.color.clone() });
      const i = roomLights.indexOf(l); if (i >= 0) roomLights.splice(i, 1);
      l.parent.remove(l);
    }
    for (let i = 0; i < RECT_SLOTS; i++) { const l = new THREE.RectAreaLight('#ffffff', 0, 1, 1); world.add(l); rectSlots.push(l); roomLights.push(l); }
  }
  const fadeSpots = slotFader(spotSlots, downlights, (s, d) => { s.position.set(d.x, H - 0.03, d.z); s.target.position.set(d.x, 0, d.z); });
  const fadeRects = slotFader(rectSlots, rectDefs.map(d => ({ ...d, x: d.pos.x, z: d.pos.z })), (l, d) => {
    l.position.copy(d.pos); l.quaternion.copy(d.q); l.width = d.w; l.height = d.h; l.color.copy(d.color);
  });
  setUpdateSpotSlots((cx, cz, dt = Infinity) => { const a = 1 - Math.exp(-dt * 4); fadeSpots(cx, cz, a); fadeRects(cx, cz, a); });
  updateSpotSlots(camera.position.x, camera.position.z);
  // ?nomerge keeps every mesh separate – used by tools/zfight.mjs to find overlapping surfaces
  const mergeStats = new URLSearchParams(location.search).has('nomerge') ? [] : [mergeStatic(world, [levelG, towerAbove, mModel, TL0]), mergeStatic(levelG, [ceilingGroup]), mergeStatic(ceilingGroup), mergeStatic(towerAbove), mergeStatic(TL0)];
  console.log('[apt] merged meshes', mergeStats);
  const timer = new THREE.Timer();
  // floating labels never sit on top of the tower: project the tower's box to the screen (convex hull) and slide every
  // label that would cover it up / left / right – whichever is the shortest move – via the sprite's anchor (center)
  const towerHull = (() => {
    const pts = [], v = new THREE.Vector3();
    return cam => {
      pts.length = 0; world.updateMatrixWorld();
      for (const x of [TX0 - 0.5, TX0 + TW + 0.5]) for (const z of [zS - 0.5, zN + 0.8]) for (const y of [GROUND, ROOF + 3.6]) {
        v.set(x, y, z).applyMatrix4(siteW.matrixWorld).project(cam); if (v.z > 1) return null;   // behind the camera
        pts.push([(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]);
      }
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);                                         // monotone-chain hull
      const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
      for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of [...pts].reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
      return lo.slice(0, -1).concat(hi.slice(0, -1));
    };
  })();
  const _lv = new THREE.Vector3(), _lh = new THREE.Vector3(), _ld = new THREE.Vector3();
  // aerial / orbit view: a place outside the frame (or behind the camera) still shows its label, pinned to the screen
  // edge on the side where it lies, with an arrow towards it. The sprite is moved onto a point just in front of the
  // camera on that edge (sprites can't be drawn from an anchor behind the camera).
  function edgeLabels(cam) {
    const W = innerWidth, H = innerHeight, P = cam.projectionMatrix.elements, cx = W / 2, cy = H / 2, PAD = 10, GAP = 8, put = [];
    for (const sp of pinSprites) {
      if (!sp.visible || !sp.parent?.visible) continue;
      const l = sp.userData.label; if (!l.edgeOk) continue;                  // the places within CLOSE m (+ on the home page, the far ones with a photo)
      sp.getWorldPosition(_lv);
      _ld.copy(_lv).applyMatrix4(cam.matrixWorldInverse);                     // camera space: z < 0 = in front
      const behind = _ld.z > -0.01;
      _lv.project(cam);
      let ax = (_lv.x + 1) / 2 * W, ay = (1 - _lv.y) / 2 * H;
      const lw = sp.scale.x * P[0] * W / 2, lh = sp.scale.y * P[5] * H / 2;
      if (!behind && ax > -lw * 0.3 && ax < W + lw * 0.3 && ay > lh * 0.5 && ay < H + 4) continue;   // on screen (label may hang over a bit)
      let vx = _ld.x, vy = -_ld.y;                                            // direction on screen (y down)
      if (!behind) { vx = ax - cx; vy = ay - cy; }
      if (Math.abs(vx) < 1e-6 && Math.abs(vy) < 1e-6) vy = 1;
      const dir = Math.abs(vx) * (H / 2) > Math.abs(vy) * (W / 2) ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd');
      // top edge: the normal card with its marker pointing DOWN to the ground (an up arrow read as "in the sky"); other edges: arrow card
      const e = dir === 'u' ? { tex: l.tex, aspect: l.aspect, h: l.h } : l.edge[dir] || (l.edge[dir] = drawLabel(l.title, l.sub, l.color, dir, l.edgePhoto ? l.photo : undefined));   // edge cards: text only (Marginal Tietê: with its photo)
      const sh = LABEL_U * e.h, w = sh * e.aspect * P[0] * W / 2, h = sh * P[5] * H / 2;
      const hx = cx - w / 2 - PAD, hy = cy - h / 2 - PAD;                      // where the label centre may go
      const t = Math.min(hx / Math.max(Math.abs(vx), 1e-6), hy / Math.max(Math.abs(vy), 1e-6));
      put.push({ sp, l, e, dir, sh, w, h, px: cx + vx * t, py: cy + vy * t });
    }
    // cards on the same edge are spaced out along it so they never overlap (kept in their order, nudged as little as possible)
    for (const d of ['l', 'r', 'u', 'd']) {
      const side = put.filter(q => q.dir === d), v = d === 'l' || d === 'r', key = v ? 'py' : 'px', sz = q => v ? q.h : q.w, lim = v ? H : W;
      if (side.length < 2) continue;
      side.sort((a, b) => a[key] - b[key]);
      for (let i = 1; i < side.length; i++) { const min = side[i - 1][key] + (sz(side[i - 1]) + sz(side[i])) / 2 + GAP; if (side[i][key] < min) side[i][key] = min; }
      const last = side[side.length - 1], over = last[key] + sz(last) / 2 + PAD - lim;
      if (over > 0) side.forEach(q => { q[key] -= over; });                     // ran off the end: slide the stack back
      const first = side[0], under = PAD - (first[key] - sz(first) / 2);
      if (under > 0) side.forEach(q => { q[key] += under; });
    }
    const BOT = EMBED ? (W < 700 ? 96 : 64) : PAD;                                           // home page: the bottom-edge cards stay above the "Arraste para girar" hint
    for (const q of put) if (q.dir === 'd') q.py = Math.min(q.py, H - BOT - q.h / 2);
    for (const { sp, e, sh, px, py } of put) {
      _lv.set(px / W * 2 - 1, 1 - py / H * 2, 0.5).unproject(cam).sub(cam.position).normalize();
      _lv.multiplyScalar(Math.max(cam.near * 4, 2)).add(cam.position);
      sp.parent.worldToLocal(_lv); sp.position.copy(_lv);
      sp.center.set(0.5, 0.5); sp.scale.set(sh * e.aspect, sh, 1);
      sp.material.map = e.tex; sp.material.depthTest = false; sp.userData.edge = true;
    }
  }
  function keepLabelsOffTower(cam) {
    const hull = towerHull(cam);
    for (const sp of pinSprites) {                                          // back to the normal label on its own spot
      const l = sp.userData.label; sp.center.set(0.5, 0); sp.position.copy(sp.userData.home);
      if (sp.userData.edge) { sp.userData.edge = false; sp.material.map = l.tex; sp.scale.set(LABEL_U * l.h * l.aspect, LABEL_U * l.h, 1); sp.material.depthTest = true; }
      sp.material.visible = true;
    }
    if (aerialView) edgeLabels(cam);
    if (!hull) return;
    const n = hull.length, inHull = (x, y) => { for (let i = 0; i < n; i++) { const a = hull[i], b = hull[(i + 1) % n]; if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < 0) return false; } return true; };
    const span = (lo, hi, axis) => {                                        // hull extent along the other axis for a band [lo, hi]
      let mn = Infinity, mx = -Infinity; const o = 1 - axis;
      for (let i = 0; i < n; i++) { const a = hull[i], b = hull[(i + 1) % n];
        for (const p of [a, b]) if (p[axis] >= lo && p[axis] <= hi) { mn = Math.min(mn, p[o]); mx = Math.max(mx, p[o]); }
        for (const c of [lo, hi]) if ((a[axis] - c) * (b[axis] - c) < 0) { const t = (c - a[axis]) / (b[axis] - a[axis]), q = a[o] + (b[o] - a[o]) * t; mn = Math.min(mn, q); mx = Math.max(mx, q); } }
      return [mn, mx];
    };
    const P = cam.projectionMatrix.elements, W = innerWidth, H = innerHeight, M = 6;
    for (const sp of pinSprites) {
      if (!sp.visible || !sp.parent?.visible || sp.userData.edge) continue;
      sp.getWorldPosition(_lv).project(cam); if (_lv.z > 1) continue;
      const ax = (_lv.x + 1) / 2 * W, ay = (1 - _lv.y) / 2 * H;           // anchor = bottom-centre of the label
      const w = sp.scale.x * P[0] * W / 2, h = sp.scale.y * P[5] * H / 2;
      const x0 = ax - w / 2, x1 = ax + w / 2, y0 = ay - h, y1 = ay;
      const [hx0, hx1] = span(y0, y1, 1), [hy0] = span(x0, x1, 0);
      const hit = (hx1 > x0 && hx0 < x1 && hy0 < y1) || [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [ax, (y0 + y1) / 2]].some(([x, y]) => inHull(x, y));
      if (!hit) continue;
      const up = y1 - hy0 + M, left = x1 - hx0 + M, right = hx1 - x0 + M;   // pixels to clear the tower each way
      if (up <= Math.min(left, right)) sp.center.y = -up / h;
      else if (left < right) sp.center.x = 0.5 + left / w; else sp.center.x = 0.5 - right / w;
    }
    // labels never cover each other either: nearest first keeps its spot, a farther one that overlaps moves up
    const placed = [], items = [];
    for (const sp of pinSprites) {
      if (!sp.visible || !sp.parent?.visible) continue;
      _lh.copy(sp.userData.home); sp.parent.localToWorld(_lh); const d = _lh.distanceToSquared(cam.position);
      sp.getWorldPosition(_lv).project(cam); if (_lv.z > 1) continue;
      items.push({ sp, d, ax: (_lv.x + 1) / 2 * W, ay: (1 - _lv.y) / 2 * H });
    }
    items.sort((a, b) => a.d - b.d);
    for (const { sp, ax, ay } of items) {
      const w = sp.scale.x * P[0] * W / 2, h = sp.scale.y * P[5] * H / 2;
      const x0 = ax - w * sp.center.x, x1 = x0 + w, y1s = ay + sp.center.y * h;
      const slide = down => { let y1 = y1s; for (let k = 0; k < 12; k++) {
        const o = placed.find(r => x0 < r[1] && x1 > r[0] && y1 - h < r[3] && y1 > r[2]);
        if (!o) break; y1 = down ? o[3] + M + h : o[2] - M; } return y1; };
      let y1 = slide(false);
      if (y1 - h < 2) y1 = slide(true);                                     // no room above (e.g. along the top edge) → stack downwards
      sp.center.y = (y1 - ay) / h;
      const off = y1 - h < 2 || y1 > H - 2;                                 // still no room inside the frame → hide it
      sp.material.visible = !off;
      if (!off) placed.push([x0, x1, y1 - h, y1]);
    }
  }
  let frameHook = null, inside = false, paused = false;                     // ?embed=home: camera driver / journey camera inside the térreo
  renderer.setAnimationLoop(() => {
    timer.update(); const rawDt = timer.getDelta(), dt = Math.min(rawDt, 0.05);
    if (paused) return;                                        // home page: 360 hidden (behind the hero / under the text panel)
    autoQuality(rawDt);
    if (frameHook) frameHook(rawDt);
    updatePlayer(dt);
    { const lp = inside ? topCam.position : camera.position; updateSpotSlots(lp.x / SCALE, lp.z / SCALE, dt); }
    avatar.visible = topView && !aerialView;
    towerAbove.visible = !topView;
    levelG.visible = TL0.visible = !aerialView; mModel.visible = aerialView;
    if (inside) { towerAbove.visible = true; avatar.visible = false; }   // journey: the real térreo, ceilings and podium on
    avatar.position.set(camera.position.x, 0, camera.position.z);
    if (topView) {
      orbit.update();
      const dist = topCam.position.distanceTo(orbit.target), n = Math.min(Math.max(dist * 0.05, 0.1), 40);   // nearer clip far out → much finer depth (no distant flicker)
      if (Math.abs(n - topCam.near) > 0.01) { topCam.near = n; topCam.far = Math.max(6000, dist * 30); topCam.updateProjectionMatrix(); }
    }
    updateHud(); drawMap();
    const cam = topView ? topCam : camera;
    keepLabelsOffTower(cam);
    if (quality) {
      // Ultra, walking: SSR draws the scene itself (renderPass off). Its target has no depth for the city labels, so they
      // sit out while walking; the top / aerial views keep the normal path with labels.
      const useSsr = ultra && !topView;
      renderPass.enabled = !useSsr; ssr.enabled = useSsr; labelPass.enabled = !useSsr && !document.body.classList.contains('clean');
      if (useSsr) { const u = ssr.ssrMaterial.uniforms; u.cameraProjectionMatrix.value.copy(cam.projectionMatrix); u.cameraInverseProjectionMatrix.value.copy(cam.projectionMatrixInverse); }   // FOV wheel
      renderPass.camera = labelPass.camera = gtao.camera = ssr.camera = cam; composer.render();
    }
    else { renderer.render(scene, cam); if (labelPass.enabled) { renderer.autoClear = false; renderer.render(labelScene, cam); renderer.autoClear = true; } }
  });
  // scene built – clicking can now enter the apartment
  if (go) { go.textContent = 'Click to enter'; go.classList.remove('loading'); }
  // ?embed=orbit – the home page's live 3D panel: straight into the aerial view, no UI, only the nearby place labels,
  // slow automatic 360° orbit around the tower (the page above it is not interactive: pointer-events off)
  const EMB = new URLSearchParams(location.search).get('embed');
  if (EMB === 'orbit' || EMB === 'home') {
    const st = document.createElement('style');
    st.textContent = '#hud,#map,#help,#cross,#osm,#overlay{display:none!important}';
    document.head.appendChild(st);
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' })); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM' }));
    labelGroup.visible = true;                                 // nearby places (pins within CLOSE m) ride along with the orbit
    const c = window.apt.tower, ang = EMB === 'home' ? Math.PI + 0.6 : 0.6, R = 175;   // home: the fly-in ends over Praça Heitor Levi, on the entrance side
    topCam.position.set((c.cx + Math.sin(ang) * R) * SCALE, (c.ground + 95) * SCALE, (c.cz + Math.cos(ang) * R) * SCALE);
    orbit.target.set(c.cx * SCALE, (c.ground + 34) * SCALE, c.cz * SCALE);
    orbit.autoRotate = true; orbit.autoRotateSpeed = 0.75; orbit.enableZoom = false; orbit.update();
    embedMode = true;
    // light mode: from the air the contact-shadow pass changes nothing visible → render direct (native MSAA) and
    // give its buffers back; the frame-time watchdog can still lower the resolution on slow devices
    quality = false; composer.setSize(1, 1);
    if (EMB === 'home') { whiteCity(); homeIntro(c, ang, R); }
    requestAnimationFrame(() => requestAnimationFrame(() => { parent.postMessage('platinum-3d-ready', location.origin); if (EMB === 'home' && !new URLSearchParams(location.search).has('t')) paused = true; }));   // first frames drawn (shaders compiled) → the home page takes over
  }

  // ?embed=walk – the home page's plan cards: a street-view style visit. No UI, no place pins. Drag to look around,
  // click / tap the floor to glide there (a ring shows where you will go), wheel = zoom. Tells the page when it is ready.
  if (EMB === 'walk') {
    const st = document.createElement('style');
    st.textContent = '#hud,#map,#help,#cross,#osm,#overlay,.ui{display:none!important} canvas#view{touch-action:none;cursor:grab} canvas#view.drag{cursor:grabbing}';
    document.head.appendChild(st);
    dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' })); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' }));   // clean frame: labels + pins off
    walkMode = true;
    if (innerWidth < 700) quality = false;                     // phones: direct render, no contact-shadow pass
    const el = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
    const ringM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthTest: false, toneMapped: false });
    const ring = new THREE.Group(), ringA = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.22, 48), ringM), ringB = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), ringM);
    ring.add(ringA, ringB); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 30; ringA.renderOrder = ringB.renderOrder = 30; ring.visible = false; scene.add(ring);
    let goal = null, drag = null;
    // floor point under the pointer (floors are at y = 0); the walk stops short of the first wall on the way
    function floorAt(cx, cy) {
      const r = el.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
      ray.setFromCamera(ndc, camera); const o = ray.ray.origin, d = ray.ray.direction;
      if (d.y > -0.04) return null;
      const t = -o.y / d.y, x = o.x + d.x * t, z = o.z + d.z * t, L = Math.hypot(x - o.x, z - o.z), n = Math.max(1, Math.ceil(L / 0.06));
      let fx = o.x, fz = o.z;
      for (let i = 1; i <= n; i++) { const qx = o.x + (x - o.x) * i / n, qz = o.z + (z - o.z) * i / n; if (blocked(qx, qz)) break; fx = qx; fz = qz; }
      return Math.hypot(fx - o.x, fz - o.z) < 0.3 ? null : { x: fx, z: fz };
    }
    const showRing = p => { ring.visible = !!p; if (p) ring.position.set(p.x, 0.02, p.z); };
    el.addEventListener('pointerdown', e => { eu.setFromQuaternion(camera.quaternion); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: eu.y, pitch: eu.x, moved: 0 }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (drag && e.pointerId === drag.id) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y, k = (camera.fov * Math.PI / 180) / Math.max(el.clientHeight, 1);
        drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
        if (drag.moved > 5) { el.classList.add('drag'); showRing(null);
          eu.set(Math.max(-1.3, Math.min(1.3, drag.pitch + dy * k)), drag.yaw + dx * k, 0, 'YXZ'); camera.quaternion.setFromEuler(eu); }
      } else if (e.pointerType === 'mouse' && !goal) showRing(floorAt(e.clientX, e.clientY));
    });
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved <= 5) { goal = floorAt(e.clientX, e.clientY); showRing(goal); }   // a click / tap: go there
      drag = null; el.classList.remove('drag');
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', () => { if (!goal) showRing(null); });
    el.addEventListener('wheel', e => { e.preventDefault(); setFov(hFov + Math.sign(e.deltaY) * 4); }, { passive: false });
    frameHook = rawDt => {                                     // glide to the goal (eases in at the end), stop at walls
      const dt = Math.min(rawDt, 0.05);
      ringA.scale.setScalar(goal ? 1 + 0.12 * Math.sin(performance.now() / 160) : 1);
      if (!goal) return;
      const p = camera.position, dx = goal.x - p.x, dz = goal.z - p.z, dist = Math.hypot(dx, dz);
      const step = Math.min(dist, Math.max(0.5, Math.min(2.6, dist * 2.2)) * SCALE * dt);
      const nx = p.x + dx / (dist || 1) * step, nz = p.z + dz / (dist || 1) * step;
      if (dist < 0.02 || blocked(nx, nz)) { goal = null; showRing(null); return; }
      p.x = nx; p.z = nz; p.y = EYE;
    };
    requestAnimationFrame(() => requestAnimationFrame(() => parent.postMessage({ type: 'platinum-walk-ready' }, location.origin)));
  }

  // ?embed=home – white architectural-model look: the neighbourhood, ground, trees and sky lose their colours
  // (light greys by brightness); only the Platinum model keeps its materials.
  function whiteCity() {
    const tone = c => { const l = Math.pow(Math.max(0, 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b), 1 / 2.2), t = Math.pow(0.66 + 0.30 * l, 2.2); c.setRGB(t, t, t); };
    const k = new THREE.Color(), arr = a => { if (!a) return; for (let i = 0; i < a.count; i++) { k.fromBufferAttribute(a, i); tone(k); a.setXYZ(i, k.r, k.g, k.b); } a.needsUpdate = true; };
    const seen = new Set();
    scene.traverse(o => {                                      // (by material tag: the static city meshes were merged out of cityG)
      if (!o.isMesh || ![].concat(o.material).some(m => m.userData.city)) return;
      arr(o.geometry.attributes.color); arr(o.instanceColor);
      for (const m of [].concat(o.material)) { if (seen.has(m)) continue; seen.add(m); if (m.map === tileTex) { m.map = null; m.needsUpdate = true; } tone(m.color); }
    });
    { const cv = facadeTex.image, g = cv.getContext('2d'); g.filter = 'grayscale(1) brightness(1.08)'; g.drawImage(cv, 0, 0); g.filter = 'none'; g.fillStyle = 'rgba(255,255,255,0.78)'; g.fillRect(0, 0, cv.width, cv.height); facadeTex.needsUpdate = true; }   // windows: pale grey, so the neighbours stay quiet
    // white sky: the far city melts into it (fog so bright it tone-maps to the same pure white as the background)
    sky.visible = false; scene.background = new THREE.Color('#ffffff'); renderer.setClearColor('#ffffff');
    scene.fog = new THREE.Fog(new THREE.Color().setScalar(9), 450, 3000);
    const hemi = scene.children.find(o => o.isHemisphereLight); if (hemi) { hemi.color.set('#ffffff'); hemi.groundColor.set('#dcdcdc'); hemi.intensity = 0.85; }   // neutral, stronger fill: shaded sides stay light
  }

  // ?embed=home – the home page hero. Waits (paused) far out over the city; on {type:'intro'} it flies in on a
  // descending spiral and settles into the slow 360° orbit. {type:'pause', on} stops / resumes rendering while the
  // page covers it. ?t skips the intro (screenshots).
  function homeIntro(c, ang1, R1) {
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const tgtO = V(c.cx, c.ground + 34, c.cz);
    const orbitAt = (a, R, h) => V(c.cx + Math.sin(a) * R, c.ground + h, c.cz + Math.cos(a) * R);
    const INTRO = 6.5, ease = x => 1 - Math.pow(1 - x, 3);
    let introT = new URLSearchParams(location.search).has('t') ? 1 : -1;
    if (introT < 0) { orbit.autoRotate = false; topCam.position.copy(orbitAt(ang1 - 2.6, 1300, 620)).multiplyScalar(SCALE); orbit.target.copy(tgtO).multiplyScalar(SCALE); orbit.update(); }
    addEventListener('message', e => {
      if (e.origin !== location.origin || !e.data) return;
      if (e.data.type === 'intro' && introT < 0) { introT = 0; paused = false; }
      if (e.data.type === 'pause' && introT >= 0) paused = !!e.data.on;
      if (e.data.type === 'rotate' && introT >= 1) rotateBy(+e.data.dx || 0, +e.data.dy || 0);
    });
    // drag on the home page ({type:'rotate', dx, dy} in radians): turn / tilt the camera around the tower; the slow
    // automatic orbit takes over again a moment after the last drag
    const sph = new THREE.Spherical(), off = V(0, 0, 0); let resume = 0;
    function rotateBy(dx, dy) {
      off.copy(topCam.position).sub(orbit.target); sph.setFromVector3(off);
      sph.theta -= dx; sph.phi = Math.min(1.45, Math.max(0.55, sph.phi - dy));
      topCam.position.copy(orbit.target).add(off.setFromSpherical(sph));
      orbit.autoRotate = false; clearTimeout(resume); resume = setTimeout(() => { orbit.autoRotate = true; }, 2500);
    }
    frameHook = rawDt => {
      if (introT < 0 || introT >= 1) return;
      introT = Math.min(1, introT + Math.min(rawDt, 0.1) / INTRO); const e = ease(introT);
      topCam.position.copy(orbitAt(ang1 - 2.6 * (1 - e), 1300 + (R1 - 1300) * e, 620 + (95 - 620) * e)).multiplyScalar(SCALE);
      orbit.target.copy(tgtO).multiplyScalar(SCALE);
      if (introT === 1) orbit.autoRotate = true;
    };
  }
}
