// 2º PAVIMENTO – leisure floor of Platinum Tatuapé, traced from the brochure's "Implantação | 2º Pavimento"
// (DOC-20260928-WA0007-10.jpg shown 2310 px wide; the 25 m pool ⇒ ≈ 20.9 image px = 1 m) and dressed after
// the brochure renders: fitness, espaço gourmet, salão de festas, espaço jogos, churrasqueira, brinquedoteca,
// spa e sauna seca, piscina adulto.
// 01 elevadores · 02 fitness c/ sala multifuncional · 03 sala de luta · 04 espaço gourmet · 05 terraço festas ·
// 06 salão de festas c/ copa · 07 churrasqueira c/ forno de pizza · 08 playground · 09 brinquedoteca ·
// 10 espaço jogos · 11 spa · 12 sauna seca · 13 pool bar · 14 solarium · 15 piscina infantil ·
// 16 piscina adulto (raia dupla 25 m) · 17 deck molhado · 18 pool spa · 19 ducha.
// Coordinates are IMAGE pixels (ix → right = north, iy → down = east) – see siteKit.js.
import * as THREE from 'three';
import { ROT_IMG, makeKit } from './siteKit.js';
import { makeCorridor } from './corridorKit.js';
import {
  H, M, P, canvasTex, marble, sanca, ceilingGroup, colliders, cylinder, floorWoodTex, fridgeB, mesh, plantB, porcelainTex, rb,
  std, phys, toiletB, vanity2B, world, baseCabB, fabric,
} from '../engine/core.js';
import {
  K2, ballPitB, barStoolB, beanbagB, benchB, benchPressB, bikeB, bistroSetB, brassSconce, cableCrossB, curvedBenchB, daybedB,
  dumbbellRackB, ellipticalB, foosballB, grillWallB, hoodCyl, islandB, kidTableB, lanterns, lavenderRow,
  linearPendant, longTableB, medBallsB, moduleSofaB, mushroomB, oakChairB, openShelvesB, ovalDiningB, palmB,
  pedestalRoundB, pingPongB, playTowerB, stumpStoolB, poufB, powerRackB, punchBagB, ropeChairB, shopBoothB, shrubB,
  sideboardTrav, spaLoungerB, stackMachineB, sunLoungerB, tileArtB, treadmillB, tropicalB, umbrellaB,
  uphChairB, queenPalmB, agapanthusRow, slatLoungerB, bushRow,
} from './pav2Kit.js';
import { lBanquetteB, plankTex, velvetBanquetteB } from './premiumKit.js';

export const K = 5;
const { bx, fl, wl, atI, W, ceil } = makeKit(K);
const G0 = -6.15;                                                  // street / térreo garden level below this floor

export function build() {
  // ---------------------------------------------------------------------------
  // MATERIALS + TEXTURES
  // ---------------------------------------------------------------------------
  const speck = (base, cols, n, s = 2.2) => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; const r = Math.random() * s + 0.6; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, r, 0, 7); g.fill(); }
  });
  const terrazzoTex = speck('#ddd6ca', ['rgba(150,135,115,0.55)', 'rgba(90,85,80,0.45)', 'rgba(240,236,228,0.8)', 'rgba(185,160,130,0.5)'], 5200);
  const gymFloorTex = speck('#cfc6b6', ['rgba(120,108,92,0.55)', 'rgba(70,66,62,0.4)', 'rgba(245,240,232,0.8)'], 6000, 1.6);   // granilite (fitness render)
  const pavingTex = canvasTex(256, 256, (g, w, h) => {              // 0.9 × 0.9 m light stone
    g.fillStyle = '#d6cfc3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60 | 0},${140 + Math.random() * 50 | 0},${120 + Math.random() * 40 | 0},0.25)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = 'rgba(120,110,95,0.45)'; g.lineWidth = 2; for (const i of [0, 128]) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  const deckTex = canvasTex(512, 512, (g, w, h) => {                // ipê deck boards
    for (let i = 0; i < 16; i++) { const t = 0.85 + Math.random() * 0.3; g.fillStyle = `rgb(${132 * t | 0},${86 * t | 0},${54 * t | 0})`; g.fillRect(0, i * 32, w, 31); g.fillStyle = 'rgba(40,20,10,0.6)'; g.fillRect(0, i * 32 + 30, w, 2); }
    for (let i = 0; i < 300; i++) { g.strokeStyle = 'rgba(70,40,20,0.15)'; g.beginPath(); const y = Math.random() * h; g.moveTo(Math.random() * w, y); g.lineTo(Math.random() * w, y + 1); g.stroke(); }
  });
  const mosaicTex = canvasTex(512, 512, (g, w, h) => {              // pool mosaic (render): muted teal / grey-green glass tiles + caustics
    const c = ['#4f9aa3', '#5ea8ad', '#3f8791', '#6fb1b0', '#58969a', '#7fb8b4', '#467f86', '#8cc0bb'];
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { g.fillStyle = c[(Math.random() * c.length) | 0]; g.fillRect(x * w / 24, y * h / 24, w / 24 - 1.5, h / 24 - 1.5); }
    g.fillStyle = 'rgba(210,225,222,0.7)'; for (let i = 0; i <= 24; i++) { g.fillRect(i * w / 24 - 1.5, 0, 1.5, h); g.fillRect(0, i * h / 24 - 1.5, w, 1.5); }
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(190,240,240,0.22)'; g.lineWidth = 3;
    for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 40; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + r, y - r * 0.6, x + r * 1.6, y + r * 0.4, x + r * 2.2, y - r * 0.2); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
  });
  const rippleTex = canvasTex(256, 256, (g, w, h) => {              // gentle water ripples (bump)
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 22; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},0.25)`); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  }, false);
  rippleTex.repeat.set(6, 6);
  const spaTileTex = canvasTex(512, 512, (g, w, h) => {             // wood-look porcelain planks on the spa walls (render)
    for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) {
      const t = 0.9 + Math.random() * 0.15, off = (r % 2) * 85;
      g.fillStyle = `rgb(${184 * t | 0},${174 * t | 0},${158 * t | 0})`; g.fillRect(c * 170 + off - 170, r * 64, 168, 62); g.fillRect(c * 170 + off, r * 64, 168, 62);
      for (let k = 0; k < 12; k++) { g.fillStyle = 'rgba(90,80,65,0.07)'; g.fillRect(c * 170 + off, r * 64 + Math.random() * 60, 168, 1); }
    }
  });
  const tatamiTex = canvasTex(256, 256, (g, w, h) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#2d4a7a' : '#1f2226'; g.fillRect(x * 128, y * 128, 127, 127); }
  });
  const rubberTex = canvasTex(512, 512, (g, w, h) => {              // playground EPDM, tan with brown paths (plan)
    g.fillStyle = '#d7b98d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a6342'; g.lineWidth = 40; g.beginPath(); g.moveTo(0, 120); g.bezierCurveTo(200, 60, 300, 260, 512, 200); g.stroke();
    g.beginPath(); g.arc(120, 512, 160, -Math.PI / 2, 0); g.stroke();
    for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(90,60,30,0.15)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  const trackTex = canvasTex(512, 512, (g, w, h) => {               // kids' outdoor loop track (plan, next to the brinquedoteca)
    g.fillStyle = '#d9b88a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6d5a48'; g.lineWidth = 14; g.beginPath();
    g.moveTo(40, 256); g.bezierCurveTo(40, 40, 230, 60, 260, 150); g.bezierCurveTo(290, 240, 470, 60, 470, 250); g.bezierCurveTo(470, 470, 280, 420, 250, 360); g.bezierCurveTo(220, 300, 40, 470, 40, 256); g.stroke();
    g.strokeStyle = '#f0e6d4'; g.lineWidth = 2; g.setLineDash([10, 10]); g.stroke();
  });
  const grassTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5f8a3f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${100 + Math.random() * 60 | 0},${30 + Math.random() * 30 | 0},0.6)`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 3); }
  });
  const muralTex = canvasTex(2048, 512, (g, w, h) => {              // brinquedoteca mural: green hills + big painted red mushrooms (render)
    g.fillStyle = '#f2ece2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c4dba4'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 300); g.bezierCurveTo(500, 220, 900, 380, 1300, 280); g.bezierCurveTo(1600, 210, 1850, 290, w, 260); g.lineTo(w, h); g.fill();
    g.fillStyle = '#a6c785'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, 400); g.bezierCurveTo(600, 330, 1200, 450, w, 370); g.lineTo(w, h); g.fill();
    g.strokeStyle = 'rgba(80,120,60,0.55)'; g.lineWidth = 3; for (let i = 0; i < 160; i++) { const x = Math.random() * w; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + (Math.random() - 0.5) * 20, h - 40, x + (Math.random() - 0.5) * 30, h - 40 - Math.random() * 120); g.stroke(); }
    const shroom = (x, base, s) => {                                    // stem + domed red cap with white spots
      const top = base - 330 * s;
      g.fillStyle = '#eee3cc'; g.beginPath(); g.moveTo(x - 9 * s, base); g.quadraticCurveTo(x - 4 * s, (base + top) / 2, x - 7 * s, top); g.lineTo(x + 7 * s, top); g.quadraticCurveTo(x + 4 * s, (base + top) / 2, x + 9 * s, base); g.fill();
      g.fillStyle = '#e9d8bd'; g.beginPath(); g.ellipse(x, top + 4 * s, 62 * s, 10 * s, 0, 0, Math.PI * 2); g.fill();          // gills
      const cap = g.createLinearGradient(x, top - 60 * s, x, top); cap.addColorStop(0, '#c4523a'); cap.addColorStop(1, '#9b3524');
      g.fillStyle = cap; g.beginPath(); g.ellipse(x, top, 70 * s, 62 * s, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#f7efe2'; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(x - 48 * s + k * 16 * s, top - 18 * s - (k % 3) * 14 * s, 6 * s, 4.5 * s, 0, 0, 7); g.fill(); }
    };
    for (const [x, s] of [[110, 0.55], [260, 1.15], [430, 0.7], [560, 0.45], [700, 1.25], [860, 0.6], [990, 0.85], [1130, 0.5], [1260, 1.1], [1420, 0.65], [1560, 0.9], [1700, 0.5], [1840, 1.2], [1980, 0.6]]) shroom(x, h - 10 - Math.random() * 30, s);
  });
  const tex = t => { const c = t.clone(); c.needsUpdate = true; return c; };
  const water = phys({ color: '#5fb7c2', roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.18, bumpMap: rippleTex, bumpScale: 0.25, envMapIntensity: 0.6, depthWrite: false });
  const spaWater = phys({ color: '#7fd0dc', roughness: 0.02, transparent: true, opacity: 0.5, clearcoat: 1, depthWrite: false });
  const mosaicM = std({ map: tex(mosaicTex), roughness: 0.25 }); mosaicM.map.wrapS = mosaicM.map.wrapT = THREE.RepeatWrapping; mosaicM.map.repeat.set(4, 1);
  const coping = std({ color: '#e6dfd2', roughness: 0.6 });
  const spaWallM = std({ map: tex(spaTileTex), roughness: 0.6 }); spaWallM.map.wrapS = spaWallM.map.wrapT = THREE.RepeatWrapping; spaWallM.map.repeat.set(3, 2);
  const muralM = std({ map: muralTex, roughness: 0.9 });
  const hedge = std({ color: '#3f6b31', roughness: 0.95 }), planterM = std({ color: '#cfc7ba', roughness: 0.8 });
  const sauna = std({ color: '#b07a4a', roughness: 0.7 }), slatM = std({ color: '#8a6a4c', roughness: 0.65 });
  const darkMetal = std({ color: '#2a2b2d', roughness: 0.5, metalness: 0.5 }), white = std({ color: '#f3f1ed', roughness: 0.4 });
  const mirror = std({ color: '#d3dce0', roughness: 0.12, metalness: 0.5 });
  const terracotta = std({ color: '#b5653f', roughness: 0.9 });

  // ---------------------------------------------------------------------------
  // SMALL HELPERS (image px)
  // ---------------------------------------------------------------------------
  const lo = Math.min, hi = Math.max;
  function place(g, ix, iy, dir = 0, y = 0, parent = world) {
    const [x, z] = W(ix, iy); g.position.set(x, y, z); g.rotation.y = typeof dir === 'number' ? dir : ROT_IMG[dir]; parent.add(g); return g;
  }
  function solid(ix0, iy0, ix1, iy1) {                            // walk-blocking footprint for furniture
    const [x0, z0] = W(ix0, iy0), [x1, z1] = W(ix1, iy1);
    colliders.push({ x0: lo(x0, x1), x1: hi(x0, x1), z0: lo(z0, z1), z1: hi(z0, z1) });
  }
  const pot = (ix, iy, s = 1.1, potM = terracotta) => place(plantB(0, 0, s, potM), ix, iy);
  function glassWall(ix0, iy0, ix1, iy1, step = 26, doors = []) {   // full-height glazing with dark mullions; doors = [from, to] open leaves
    const along = Math.abs(ix1 - ix0) >= Math.abs(iy1 - iy0), a0 = along ? lo(ix0, ix1) : lo(iy0, iy1), a1 = along ? hi(ix0, ix1) : hi(iy0, iy1);
    const ops = []; let cur = a0 + 1;
    for (const [f, t] of [...doors].sort((p, q) => p[0] - q[0])) { if (f > cur) ops.push({ from: cur, to: f, sill: 0.03, top: H - 0.08, glass: 'fixed' }); ops.push({ from: f, to: t, top: H - 0.08, glass: 'open' }); cur = t; }
    if (cur < a1 - 1) ops.push({ from: cur, to: a1 - 1, sill: 0.03, top: H - 0.08, glass: 'fixed' });
    wl(ix0, iy0, ix1, iy1, ops, M.frame);
    for (let t = a0 + step; t < a1 - 4; t += step) {
      if (doors.some(([f, q]) => t > f - 1 && t < q + 1)) continue;
      if (along) bx(t - 0.5, lo(iy0, iy1), t + 0.5, hi(iy0, iy1), 0, H, M.frame, { collide: false });
      else bx(lo(ix0, ix1), t - 0.5, hi(ix0, ix1), t + 0.5, 0, H, M.frame, { collide: false });
    }
  }
  function rail(ix0, iy0, ix1, iy1) {                              // glass balustrade with a dark cap
    bx(ix0, iy0, ix1, iy1, 0, 1.1, M.glass, { collide: true, cast: false });
    bx(ix0, iy0, ix1, iy1, 1.1, 1.14, M.frame, { collide: false });
  }
  function planter(ix0, iy0, ix1, iy1, h = 0.45, plants = 'hedge') {   // raised stone planter with planting
    bx(ix0, iy0, ix1, iy1, 0, h, planterM, { collide: true });
    bx(ix0 + 1, iy0 + 1, ix1 - 1, iy1 - 1, h, h + 0.02, P.soil, { collide: false, cast: false });
    const w = (ix1 - ix0) / 20.9, d = (iy1 - iy0) / 20.9;
    if (plants === 'hedge') bx(ix0 + 1.5, iy0 + 1.5, ix1 - 1.5, iy1 - 1.5, h, h + 0.55, hedge, { collide: false });
    if (plants === 'tropical') { const n = Math.max(1, Math.round(hi(w, d) / 0.9)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; place(tropicalB(0.9 + Math.random() * 0.4), ix0 + (ix1 - ix0) * (w > d ? t : 0.5), iy0 + (iy1 - iy0) * (w > d ? 0.5 : t), Math.random() * 6, h); } }
    if (plants === 'agapanthus') { const g = agapanthusRow(hi(w, d) - 0.1, lo(w, d) - 0.1); place(g, (ix0 + ix1) / 2, (iy0 + iy1) / 2, w > d ? 'up' : 'right', h); }
    if (plants === 'bushes') { const g = bushRow(hi(w, d) - 0.1, lo(w, d) - 0.05, 0.9); place(g, (ix0 + ix1) / 2, (iy0 + iy1) / 2, w > d ? 'up' : 'right', h); }
    if (plants === 'lavender') { const g = lavenderRow(hi(w, d) - 0.1, lo(w, d) - 0.1); place(g, (ix0 + ix1) / 2, (iy0 + iy1) / 2, w > d ? 'up' : 'right', h - 0.3); }
  }
  const palm = (ix, iy, h = 5.5 + Math.random() * 1.8, y = 0) => place(queenPalmB(h, 1), ix, iy, Math.random() * 6, y);
  const look = (ix, iy, tx, ty) => Math.atan2(-(ty - iy), tx - ix);           // rotation that turns a front (+z) towards an image point
  function hang(g, ix, iy, dir = 0) { return place(g, ix, iy, dir, 0, ceilingGroup); }   // pendants vanish with the ceiling in the V view
  function ledLine(ix0, iy0, ix1, iy1, y = H - 0.012) { bx(ix0, iy0, ix1, iy1, y - 0.012, y, P.cove, { collide: false, cast: false, parent: ceilingGroup }); }
  function slatCeiling(ix0, iy0, ix1, iy1, alongIx = true, step = 2.6) {   // wood slat ceiling (fitness render)
    if (alongIx) for (let y = iy0; y < iy1; y += step) bx(ix0, y, ix1, y + 1.1, H - 0.1, H - 0.002, slatM, { collide: false, cast: false, parent: ceilingGroup });
    else for (let x = ix0; x < ix1; x += step) bx(x, iy0, x + 1.1, iy1, H - 0.1, H - 0.002, slatM, { collide: false, cast: false, parent: ceilingGroup });
  }
  // slab + podium below, split in cells around holes (pools); fn(cell) lays the floor finish
  function cells(a, b, c, d, holes, fn) {                         // rectangle split into cells around holes (pools)
    const xs = new Set([a, c]), ys = new Set([b, d]);
    for (const [h0, h1, h2, h3] of holes) { for (const x of [h0, h2]) if (x > a && x < c) xs.add(x); for (const y of [h1, h3]) if (y > b && y < d) ys.add(y); }
    const X = [...xs].sort((p, q) => p - q), Y = [...ys].sort((p, q) => p - q);
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Y.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
      if (holes.some(([h0, h1, h2, h3]) => cx > h0 && cx < h2 && cy > h1 && cy < h3)) continue;
      fn(X[i], Y[j], X[i + 1], Y[j + 1]);
    }
  }
  const deck = (a, b, c, d, holes) => cells(a, b, c, d, holes, (p, q, r, t) => bx(p, q, r, t, G0, 0, M.extWall, { collide: false }));   // slab + podium below
  const flH = (a, b, c, d, holes, ...f) => cells(a, b, c, d, holes, (p, q, r, t) => fl(p, q, r, t, ...f));
  function pool(a, b, c, d, depth, wat = water, lanes = 0) {     // sunken basin: mosaic shell, transparent water, stone coping
    bx(a, b, c, d, G0, -depth, M.extWall, { collide: false });
    fl(a, b, c, d, mosaicTex, 0.9, 0.25, -depth + 0.002);
    for (const [p, q, r, s] of [[a, b, c, b + 1.5], [a, d - 1.5, c, d], [a, b, a + 1.5, d], [c - 1.5, b, c, d]]) bx(p, q, r, s, -depth, -0.02, mosaicM, { collide: false });
    for (let i = 1; i <= lanes; i++) { const y = b + (d - b) * i / (lanes + 1); bx(a + 30, y - 1.2, c - 30, y + 1.2, -depth + 0.004, -depth + 0.01, std({ color: '#f4f6f5', roughness: 0.3 }), { collide: false, cast: false }); }
    bx(a, b, c, d, -0.16, -0.1, wat, { collide: true, cast: false });
    for (const [p, q, r, s] of [[a - 6, b - 6, c + 6, b], [a - 6, d, c + 6, d + 6], [a - 6, b, a, d], [c, b, c + 6, d]]) bx(p, q, r, s, 0, 0.04, K2.travertine, { collide: false });
    if (depth > 0.4) for (let x = a + 40; x < c - 20; x += 80) for (const y of [b + 1.6, d - 1.6]) bx(x - 1.2, y - 0.1, x + 1.2, y + 0.1, -0.55, -0.45, P.led, { collide: false, cast: false });   // underwater lights
  }

  // ---------------------------------------------------------------------------
  // TÉRREO BELOW (context): garden, trees, quadra, spa deck – seen over the edges
  // ---------------------------------------------------------------------------
  fl(215, 120, 1478, 1420, grassTex, 3, 1, G0 + 0.004);
  { const [xa, za] = W(1185, 160), [xb, zb] = W(1460, 310);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(xb - xa), Math.abs(zb - za)), std({ color: '#d8b48a', roughness: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.set((xa + xb) / 2, G0 + 0.01, (za + zb) / 2); world.add(m); }
  bx(1080, 150, 1180, 316, G0, G0 + 6, M.wall, { collide: false });                            // ramp tower beside the quadra
  bx(675, 240, 860, 330, G0, G0 + 0.05, P.walnut, { collide: false });                          // térreo spa deck
  bx(705, 262, 790, 318, G0 + 0.05, G0 + 0.12, water, { collide: false });
  for (const [a, b, s] of [[210, 250, 1.2], [215, 420, 1.1], [330, 190, 1.0], [470, 185, 1.2], [600, 190, 1.0], [890, 180, 1.2], [960, 210, 1.0],
    [1560, 250, 1.1], [1560, 450, 1.1], [1560, 700, 1.1], [1560, 900, 1.1], [1560, 1070, 1.1], [300, 900, 1.0], [520, 1100, 1.0], [700, 1250, 1.1]]) {
    const g = new THREE.Group();
    cylinder(g, 0.14 * s, 0.2 * s, 3.2 * s, std({ color: '#6b5443', roughness: 1 }), 0, 0, 0, 10);
    mesh(g, new THREE.IcosahedronGeometry(1.9 * s, 1), std({ color: '#4c7a3a', roughness: 0.9 }), 0, 4.0 * s, 0);
    mesh(g, new THREE.IcosahedronGeometry(1.3 * s, 1), std({ color: '#5e8d45', roughness: 0.9 }), 0.8 * s, 3.5 * s, 0.6 * s);
    place(g, a, b, 0, G0);
  }

  // ---------------------------------------------------------------------------
  // SLAB, PODIUM AND FLOOR FINISHES
  // ---------------------------------------------------------------------------
  const P15 = [745, 890, 855, 952], P16 = [928, 1058, 1448, 1165], P17 = [1035, 975, 1175, 1052], P18 = [1175, 975, 1325, 1052], TUB = [515, 832, 555, 895];
  deck(316, 316, 1478, 780, [[600, 316, 1003, 345]]);                                     // tower block (no slab north of the gourmet / terraço façade – plan)
  deck(392, 780, 900, 985, [P15, TUB]);                                                   // spa wing + pool bar + kids' pool
  deck(900, 780, 1478, 975, [P17, P18]);
  deck(900, 975, 1478, 1195, [P16, P17, P18]);
  // indoor finishes
  fl(362, 321, 497, 668, gymFloorTex, 2.2, 0.55, 0.004); fl(437, 668, 497, 690, gymFloorTex, 2.2, 0.55, 0.004);   // floors never overlap (stacked layers flickered)                                       // fitness (02)
  fl(497, 580, 700, 690, gymFloorTex, 2.2, 0.55, 0.004);
  fl(498, 380, 592, 452, tatamiTex, 2.0, 0.9, 0.005);                                          // sala multifuncional (02)
  fl(348, 668, 437, 766, tatamiTex, 2.0, 0.9, 0.005);                                          // sala de luta (03)
  fl(498, 452, 600, 580, porcelainTex, 0.9, 0.22, 0.003); fl(600, 495, 1003, 580, porcelainTex, 0.9, 0.22, 0.003); fl(1003, 495, 1068, 580, porcelainTex, 0.9, 0.22, 0.003);                                     // hall, WCs, gourmet strip
  fl(600, 380, 1003, 495, porcelainTex, 0.9, 0.22, 0.003);                                     // gourmet (04) + terraço (05)
  fl(1115, 321, 1247, 375, floorWoodTex, 1.6, 0.5, 0.005);                                     // salão lounge
  fl(1003, 580, 1023, 655, porcelainTex, 0.9, 0.22, 0.003); fl(700, 745, 1003, 780, porcelainTex, 0.9, 0.22, 0.003);                                     // hall + espaço jogos (10)
  fl(1023, 580, 1268, 612, porcelainTex, 0.9, 0.22, 0.003); fl(1023, 612, 1118, 655, porcelainTex, 0.9, 0.22, 0.003);                                    // copa + WCs
  fl(1118, 612, 1270, 765, terrazzoTex, 2.2, 0.35, 0.005);                                     // brinquedoteca (09)
  flH(437, 690, 700, 915, [TUB, [437, 723, 562, 910], [535, 723, 600, 790]], porcelainTex, 0.9, 0.22, 0.003);                                      // spa wing (11, 12, 13)
  fl(535, 723, 600, 790, floorWoodTex, 1.2, 0.6, 0.005);                                       // sauna (12)
  // outdoor finishes
  fl(316, 316, 362, 770, pavingTex, 1.8, 0.8, 0.002);                                          // praça-side balcony
  fl(497, 316, 600, 380, pavingTex, 1.8, 0.8, 0.002);                                          // terrace by the sala multifuncional
  fl(600, 345, 1003, 380, pavingTex, 1.8, 0.8, 0.002);                                         // planted strip inside the gourmet / terraço parapet
  fl(1003, 316, 1115, 375, pavingTex, 1.8, 0.8, 0.002);
  flH(1268, 316, 1478, 780, [[1340, 362, 1450, 625], [1303, 660, 1447, 780]], pavingTex, 1.8, 0.8, 0.002); fl(1247, 316, 1268, 375, pavingTex, 1.8, 0.8, 0.002);
  flH(1003, 655, 1268, 780, [[1118, 612, 1268, 765]], pavingTex, 1.8, 0.8, 0.002);                                        // walkway, churrasqueira, playground
  fl(1340, 362, 1450, 625, deckTex, 2.0, 0.7, 0.005);                                          // churrasqueira deck (07)
  fl(1303, 660, 1447, 782, rubberTex, 7, 0.95, 0.004);                                         // playground base (08) – painted plan layer on top
  flH(700, 780, 1478, 975, [P15, P17, P18, [1028, 838, 1330, 975]], pavingTex, 1.8, 0.8, 0.002);                                          // pool deck
  flH(900, 975, 1478, 1195, [P16, P17, P18], pavingTex, 1.8, 0.8, 0.002);
  fl(392, 915, 700, 985, pavingTex, 1.8, 0.8, 0.002); fl(700, 975, 900, 985, pavingTex, 1.8, 0.8, 0.002);
  fl(1028, 838, 1330, 975, deckTex, 2.0, 0.7, 0.006);                                          // solarium deck (14)

  // ---------------------------------------------------------------------------
  // CEILINGS (the tower above covers the north block)
  // ---------------------------------------------------------------------------
  ceil(345, 316, 600, 745); ceil(600, 345, 700, 745); ceil(700, 345, 1003, 722); ceil(1003, 316, 1118, 722); ceil(1118, 316, 1268, 745);   // jogos side ends at the pillar line (iy 722): open air south of it (plan)         // no roof overhang where the plan has no slab
  ceil(1118, 745, 1270, 763);                                                                     // flush with the brinquedoteca outer wall (and the tower face above)
  ceil(345, 745, 700, 915);

  // ---------------------------------------------------------------------------
  // POOLS (15–18) + kids' pool fountain + spa tub
  // ---------------------------------------------------------------------------
  pool(...P16, 1.4, water, 2);                                                                    // piscina adulto, raia dupla 25 m
  pool(...P17, 0.25, water);                                                                      // deck molhado
  pool(...P18, 0.9, spaWater);                                                                    // pool spa
  pool(...P15, 0.45, water);                                                                      // piscina infantil
  pool(...TUB, 0.7, spaWater);                                                                    // spa hot tub
  for (let i = 0; i < 4; i++) bx(1175 + i * 6, P18[1] + 3, 1181 + i * 6, P18[3] - 3, -0.9, -0.3 - i * 0.15, mosaicM, { collide: false });   // steps into the spa
  place(mushroomB(0.75, 0.32), 785, 920, 0, -0.45);                                                // red mushroom fountain (plan)
  for (const ix of [1050, 1080, 1110, 1140]) place(slatLoungerB(), ix, 1010, 'down', -0.22);      // in-water loungers on the deck molhado

  // ---------------------------------------------------------------------------
  // OUTER EDGES: balustrades + perimeter planters
  // ---------------------------------------------------------------------------
  rail(313, 314, 316, 770); rail(313, 314, 497, 317); rail(316, 767, 392, 770);
  rail(497, 314, 600, 317); rail(1003, 314, 1478, 317);
  rail(600, 345, 1003, 348); rail(597, 314, 600, 345); rail(1003, 314, 1006, 345);   // gourmet / terraço façade is the parapet at iy 345 (plan): no balcony beyond it
  rail(1475, 317, 1478, 1195); rail(898, 1195, 1478, 1198); rail(896, 985, 899, 1195); rail(392, 985, 899, 988); rail(389, 770, 392, 988);
  planter(1450, 318, 1470, 975, 0.5, 'bushes');
  planter(1450, 975, 1470, 1192, 0.5, 'agapanthus');                                                  // Rua Platina hedge
  planter(900, 1168, 1450, 1192, 0.5, 'agapanthus');                                            // agapanthus border (pool render)
  for (let ix = 902; ix < 1476; ix += 3) bx(ix, 1193.5, ix + 1.2, 1194.5, 0.5, 2.1, std({ color: '#2c2e30', roughness: 0.6 }), { collide: false });   // dark slat fence (render)
  for (let iy = 975; iy < 1194; iy += 3) bx(1473.5, iy, 1474.5, iy + 1.2, 0.5, 2.1, std({ color: '#2c2e30', roughness: 0.6 }), { collide: false });
  planter(902, 988, 922, 1168, 0.5, 'bushes');
  planter(394, 915, 670, 983, 0.45, 'tropical');
  planter(670, 958, 900, 983, 0.45, 'tropical');                                                 // garden strip south of the spa
  planter(394, 772, 434, 915, 0.45, 'tropical');                                                 // garden west of the spa
  for (const [a, b] of [[412, 800], [450, 960], [650, 965], [745, 970], [860, 970], [912, 1010], [912, 1095], [912, 1160],
    [1000, 1180], [1095, 1180], [1190, 1180], [1285, 1180], [1385, 1180], [1462, 880], [1462, 960]]) palm(a, b, undefined, 0.45);
  bx(990, 792, 1066, 812, 0, 0.45, planterM); bx(991, 793, 1065, 811, 0.45, 0.47, P.soil, { collide: false, cast: false });   // shrub bed at the top of the deck, below the kids' track (plan)
  { const greens = ['#3f6a2e', '#4d7a35', '#5a8a3c', '#355f28', '#6b9a45'].map(c => std({ color: c, roughness: 0.85, flatShading: true })), g = new THREE.Group();
    for (let i = 0; i < 45; i++) { const a = Math.random() * 6.283, d = Math.random() * 0.75, r = 0.22 + Math.random() * 0.2; mesh(g, new THREE.IcosahedronGeometry(r, 1), greens[i % 5], Math.cos(a) * d * 1.6, r * 0.7 + Math.random() * 0.6 * (1 - d / 0.85), Math.sin(a) * d * 0.55, Math.random(), Math.random(), 0); }
    place(g, 1028, 802, 'up', 0.45); }                                                              // large leafy shrub filling the bed

  // ---------------------------------------------------------------------------
  // 02 FITNESS c/ SALA MULTIFUNCIONAL – granilite floor, wood-slat ceiling with LED lines, treadmills
  // facing the Praça glazing, cable machines, power racks, benches, dumbbells, mirror with amber glow
  // ---------------------------------------------------------------------------
  wl(357, 316, 497, 321);                                                                         // north end: mirror wall (render)
  glassWall(360, 321, 365, 668, 24);                                                             // Praça Heitor Levi façade
  wl(493, 321, 498, 452, [{ from: 395, to: 430 }]);                                              // door to the multifunctional room
  wl(493, 452, 498, 495); wl(493, 525, 498, 580);
  wl(695, 580, 700, 720, [{ from: 600, to: 635 }]);                                              // door to the central hall
  wl(437, 718, 700, 723, [{ from: 445, to: 480 }]);                                              // door to the spa corridor
  wl(493, 575, 700, 580);
  // ceiling after the render: wood-slat bands along both sides, white centre panel dropped 10 cm with two long LED lines
  slatCeiling(365, 321, 392, 718, false, 2.4); slatCeiling(466, 321, 493, 718, false, 2.4);
  bx(392, 321, 466, 718, H - 0.12, H - 0.001, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  for (const ix of [404, 454]) ledLine(ix, 330, ix + 1.0, 712, H - 0.125);
  slatCeiling(498, 580, 548, 718, false, 2.4);
  bx(548, 580, 695, 718, H - 0.12, H - 0.001, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  for (const iy of [612, 670]) ledLine(555, iy, 690, iy + 1.0, H - 0.125);
  // north mirror wall framed by an amber LED cove
  bx(368, 321, 488, 322, 0.08, 2.3, mirror, { collide: false });
  bx(366, 321, 490, 322.6, 2.3, 2.36, P.cove, { collide: false, cast: false });
  for (const ix of [366, 488.5]) bx(ix, 321, ix + 1.5, 322.6, 0.08, 2.36, P.cove, { collide: false, cast: false });
  // walnut panelling with TVs on the inner wall, white square columns at the functional area
  for (const [a, b] of [[322, 395], [430, 452]]) bx(491, a, 493, b, 0, H, P.walnut, { collide: false });
  for (const iy of [360, 440]) { bx(490.4, iy - 11, 491, iy + 11, 1.6, 2.2, P.tvPanel, { collide: false }); bx(490.3, iy - 10.5, 490.4, iy + 10.5, 1.63, 2.17, P.screen, { collide: false, cast: false }); }
  for (const iy of [600, 660]) bx(491, iy, 502, iy + 11, 0, H, white);
  bx(489, 528, 493, 575, 0.15, 2.3, mirror, { collide: false });                                 // mirror wall
  bx(488, 528, 489, 575, 2.3, 2.34, P.cove, { collide: false, cast: false });
  for (const iy of [510, 544, 578, 612]) { place(treadmillB(), 410, iy, 'left'); solid(390, iy - 9, 433, iy + 9); }
  for (const [iy, b] of [[350, ellipticalB], [412, bikeB], [444, bikeB], [476, ellipticalB]]) { place(b(), 412, iy, 'left'); solid(398, iy - 8, 428, iy + 8); }
  for (const [iy, kind] of [[345, 'lat'], [399, 'long'], [466, 'upright'], [561, 'upright'], [610, 'long']]) { place(stackMachineB(kind), 468, iy, 'left'); solid(452, iy - 13, 485, iy + 13); }   // positions from the plan
  place(benchB(0.4), 468, 514, 'left');
  place(powerRackB(), 536, 604, 'down'); solid(522, 590, 550, 618);
  place(cableCrossB(), 594, 600, 'down'); solid(570, 592, 618, 610);
  place(benchPressB(), 655, 604, 'down'); solid(641, 590, 669, 622);                              // bench press (plan)
  for (const ix of [534, 576, 617]) place(benchB(0.25), ix, 655, 'down');
  place(dumbbellRackB(3.6), 545, 709, 'up'); solid(505, 703, 586, 716);
  place(medBallsB(), 640, 709, 'up', 0.35);
  bx(605, 700, 690, 718, 0, 0.35, P.walnut);                                                     // wood ball shelf
  // sala multifuncional (02, small room): mats, mirror
  wl(498, 370, 595, 375, [{ from: 510, to: 585, sill: 0.9, top: 2.3, glass: 'window' }]);
  wl(590, 375, 596, 452);
  planter(498, 321, 596, 368, 0.4, 'tropical');
  for (const [a, b] of [[515, 395], [555, 395], [515, 428], [555, 428]]) bx(a - 8, b - 6, a + 8, b + 6, 0.005, 0.03, K2.matGreen, { collide: false });
  place(medBallsB(), 580, 440, 'up');
  bx(498, 446, 590, 448, 0.2, 2.2, mirror, { collide: false });
  // sala de luta (03): tatami, punching bags, dark walls
  wl(348, 665, 437, 670, [{ from: 405, to: 432 }]);
  wl(434, 670, 439, 768); wl(345, 766, 437, 771);
  glassWall(345, 670, 350, 766, 24);
  for (const [a, b] of [[370, 700], [370, 740], [405, 740]]) place(punchBagB(), a, b, 0);
  bx(436, 680, 437, 760, 0.1, 2.4, std({ color: '#2b2d31', roughness: 0.8 }), { collide: false });

  // ---------------------------------------------------------------------------
  // WCs + ELEVATORS (01) + STAIRS
  // ---------------------------------------------------------------------------
  wl(497, 452, 600, 457); wl(535, 457, 540, 492);
  wl(497, 490, 600, 495, [{ from: 505, to: 528 }, { from: 555, to: 580 }]);
  it2(toiletB, 500, 470, 520, 488, 'right'); it2(vanity2B, 560, 458, 595, 470, 'down');
  it2(toiletB, 545, 470, 565, 488, 'right'); it2(vanity2B, 500, 458, 532, 468, 'down');
  wl(497, 522, 540, 527, [{ from: 513, to: 533 }]); wl(535, 527, 540, 575);
  it2(toiletB, 500, 529, 516, 547, 'right'); it2(vanity2B, 501, 564, 534, 575, 'up');           // plan: toilet top-left beside the door, vanity along the far wall
  function elevators(ix0, ix1, cabs) {
    bx(ix0, 527, ix1, 575, 0, H, M.wall);
    CO.stone(ix0, ix1, 527, 'S');
    CO.lifts(cabs, 527 - 0.025 * 20.9, '2', 1.0);
  }
  // HALL DOS ELEVADORES – premium lift hall (corridorKit), same language as the térreo and the 1º pavimento
  const CO = makeCorridor({ bx, fl, W, ppm: 20.9 });
  CO.floor(498, 495, 1068, 527);
  elevators(540, 695, [562, 617, 672]);
  elevators(958, 1068, [985, 1041]);
  {
    const N = 495;
    // room side (face iy 495): WC doors 505–528 + 555–580, gourmet door 615–650, terraço door 958–994
    CO.plaster(529, 554, N, 'N'); CO.sconce(541.5, N, 'N');
    CO.slats(653, 735, N, 'N');
    CO.plaster(735, 955, N, 'N'); CO.cove(735, 955, N + 0.018 * 20.9, 'N');
    CO.sconce(745, N, 'N'); CO.sconce(805, N, 'N');
    CO.slats(820, 870, N, 'N');
    for (const ix of [590, 720, 850, 1010]) CO.light(ix, 511, 0.8);
  }
  bx(958, 574.5, 1068, 580.5, 0, H, M.wall);                                                      // close the slot between the lift core and the WC / copa walls
  wl(738, 522, 912, 527, [{ from: 878, to: 905 }]);                                              // stair core
  wl(738, 527, 743, 578); wl(907, 527, 912, 578); wl(738, 575, 912, 580);
  bx(790, 527, 860, 548, 0, H, M.wall);
  for (let i = 0; i < 12; i++) bx(752 + i * 6, 552, 758 + i * 6, 573, 0, 0.17 * (i + 1), M.ceiling);
  // jogos WCs
  wl(958, 580, 1023, 585); wl(958, 585, 963, 655, [{ from: 592, to: 612 }, { from: 626, to: 646 }]);
  wl(963, 616, 1018, 620); wl(958, 652, 1023, 657); wl(1018, 585, 1023, 652);
  it2(toiletB, 1000, 590, 1016, 612, 'left'); it2(vanity2B, 966, 586, 990, 596, 'down');
  it2(toiletB, 1000, 624, 1016, 648, 'left'); it2(vanity2B, 966, 622, 990, 632, 'down');

  // ---------------------------------------------------------------------------
  // 04 ESPAÇO GOURMET – travertine island + oak dining bar, cylindrical hood, open shelves with LED,
  // fridge, oval oak table with a linear pendant (render)
  // ---------------------------------------------------------------------------
  for (const [a, b, c, d] of [[595, 345, 607, 392], [745, 345, 757, 380], [845, 345, 857, 392], [948, 345, 958, 383], [997, 316, 1003, 495]]) bx(a, b, c, d, 0, H, M.wall);
  glassWall(600, 377, 845, 382, 24, [[700, 742]]);                                              // glazing to the planted terrace
  wl(595, 382, 600, 495);                                                                         // gourmet / WC wall
  wl(600, 490, 1000, 495, [{ from: 615, to: 650 }, { from: 958, to: 994 }]);                     // to the hall
  bx(845, 440, 855, 490, 0, H, M.wall);
  glassWall(847, 392, 853, 440, 24, [[393, 439]]);                                                // opening to the terrace (frame only, slid fully open)
  for (const [a, b] of [[607, 745], [757, 845]]) planter(a, 350, b, 375, 0.45, 'tropical');      // gourmet strip; the terraço (05) strip is open, with armchairs + pots (plan)
  // plan: pillar between kitchen and dining, back counter with the sink, stainless fridge at the terrace end
  bx(733, 446, 743, 490, 0, H, M.wall);                                                           // pillar (plan / render)
  bx(743, 476, 822, 490, 0, 0.9, P.walnut);                                                       // base cabinet run on the hall wall
  bx(743, 474, 823, 490, 0.9, 0.94, K2.travertine);
  place(fridgeB(0.9, 0.7), 833, 479, 'up'); solid(823, 468, 844, 490);
  place(openShelvesB(3.2, H - 1.45), 782, 487, 'up', 1.45);                                     // hung from the ceiling (render)
  { const g = new THREE.Group(); rb(g, 0.62, 0.006, 0.4, P.brushed, 0, 0.94, 0, 0.004); rb(g, 0.5, 0.004, 0.3, P.black, 0, 0.944, 0, 0.002);
    cylinder(g, 0.016, 0.016, 0.34, P.brushed, 0, 0.94, -0.16, 12); rb(g, 0.03, 0.03, 0.2, P.brushed, 0, 1.25, -0.07, 0.01); place(g, 772, 482, 'up'); }   // sink + faucet (plan)
  for (const [x, h] of [[797, 0.42], [801, 0.34]]) { const g = new THREE.Group(); rb(g, 0.26, h, 0.025, K2.oakLight, 0, 0, 0, 0.01, -0.12); place(g, x, 487.5, 'up', 0.94); }   // cutting boards
  place(plantB(0, 0, 0.55, std({ color: '#c9b79c', roughness: 0.8 })), 810, 484, 0, 0.94);
  bx(743, 488.6, 823, 490, 0.94, 2.45, (() => { const m = std({ map: marble('#ddd2bf', '176,158,128', 0.22), roughness: 0.4 }); m.map.repeat.set(2, 1); return m; })(), { collide: false });   // full-height travertine slab (render)
  for (const [a, b] of [[790, 425], [700, 440], [630, 425]]) { const l = new THREE.PointLight('#ffd3a0', 1.6, 6, 2); l.position.set(W(a, b)[0], 2.3, W(a, b)[1]); world.add(l); }
  { const g = new THREE.Group(); place(islandB(3.3, 1.5, 0.8), 790, 422, 'up'); solid(755, 403, 825, 438);
    hoodCyl(g, 0, 1.75, 0); hang(g, 811, 429); }                                                  // hood over the hob
  for (const ix of [764, 781, 798, 815]) place(oakChairB(), ix, 401, 'down');                      // 4 chairs at the wood bar (plan)
  place(oakChairB(), 748, 422, 'right');                                                           // + one at the island end (plan)
  place(ovalDiningB(2.4, 1.1), 700, 440, 'right'); solid(688, 412, 712, 468);
  for (const iy of [418, 440, 462]) { place(oakChairB(), 678, iy, 'right'); place(oakChairB(), 722, iy, 'left'); }
  hang(linearPendant(2.0, 1.9), 700, 440, 'right');
  place(pedestalRoundB(0.5, K2.oakLight, K2.oakLight), 625, 425); solid(616, 416, 634, 434);
  for (const [a, b] of [[625, 405], [608, 438], [642, 438]]) place(oakChairB(), a, b, look(a, b, 625, 425));
  for (const [iy, y, c] of [[425, 1.55, '#d9cdb8'], [436, 1.6, '#c9b79c'], [447, 1.5, '#e3d6c0'], [430, 1.2, '#cdbca2'], [442, 1.25, '#d8c9b0']]) bx(600, iy, 600.6, iy + 8, y, y + 0.38, std({ color: c, roughness: 0.8 }), { collide: false });   // framed squares (render)
  pot(612, 470, 1.2);

  // ---------------------------------------------------------------------------
  // 05 TERRAÇO FESTAS | GOURMET – lounge sofa, armchairs, planters
  // ---------------------------------------------------------------------------
  // plan: L-shaped lounge sofa (long run + chaise end) against the planter, orange cushions, small side table;
  // armchairs, little tables and potted plants out by the façade; the middle stays open for parties
  place(moduleSofaB(3.2, 0.95, K2.beigeCush, [false, true]), 897, 458, 'up'); solid(864, 446, 930, 470);
  place(moduleSofaB(0.85, 1.5, K2.beigeCush, [true, false]), 938.5, 454.5, 'up'); solid(930, 439, 947, 470);   // chaise end of the L
  for (const [ix, t] of [[871, 0.15], [878, -0.1]]) { const g = new THREE.Group(); rb(g, 0.42, 0.4, 0.13, K2.terracottaUph, 0, 0, 0, 0.06, -0.25, 0, t); place(g, ix, 455.5, 'up', 0.52); }   // orange cushions, in front of the back cushions
  const drum = (r, h, m) => { const g = new THREE.Group(); cylinder(g, r, r, h, m, 0, 0, 0, 28); return g; };
  place(drum(0.22, 0.48, P.walnut), 953, 441); solid(949, 437, 957, 445);                        // side table at the chaise
  bx(948, 455, 956, 490, 0, H, M.wall);                                                           // wall stub at the planter end (plan)
  bx(856, 470, 948, 482, 0, 0.45, planterM); bx(857, 471, 947, 481, 0.45, 0.85, hedge, { collide: false });   // planter behind the sofa, up to the wall stub (plan)
  for (const ix of [880, 916]) { place(moduleSofaB(0.8, 0.8, K2.beigeCush), ix, 365, 'down'); solid(ix - 9, 356, ix + 9, 374); }   // armchairs by the façade
  place(drum(0.2, 0.45, P.walnut), 898, 367); solid(894, 363, 902, 371);
  place(moduleSofaB(0.8, 0.8, K2.beigeCush), 986, 375, look(986, 375, 950, 420)); solid(977, 366, 995, 384);   // corner armchair (plan)
  place(drum(0.18, 0.45, P.walnut), 971, 372);
  for (const [a, b, sc] of [[867, 362, 1.1], [937, 362, 1.2], [966, 359, 1.0], [996, 358, 0.9]]) pot(a, b, sc);

  // ---------------------------------------------------------------------------
  // 06 SALÃO DE FESTAS c/ COPA DE APOIO – walnut panelled wall with brass sconces, travertine-topped
  // sideboard, round pedestal tables with slate upholstered chairs, terracotta poufs, tile art, sheers
  // ---------------------------------------------------------------------------
  glassWall(1003, 375, 1115, 380, 24);                                                           // salão terrace: glazed, no entrance (plan)
  wl(1112, 321, 1117, 375);                                                                       // wall between the terrace and the lounge (plan)
  bx(1117, 322.4, 1119, 375, 0, H, P.walnut, { collide: false });                                // walnut panelling behind the orange chairs
  for (let iy = 330; iy < 375; iy += 9) bx(1119, iy, 1119.6, iy + 0.4, 0.05, H - 0.05, P.taupeDark, { collide: false, cast: false });
  for (const ix of [1045, 1078]) { place(moduleSofaB(0.8, 0.8, K2.beigeCush), ix, 357, 'down'); solid(ix - 9, 348, ix + 9, 366); }   // terrace armchairs (plan)
  { const g = new THREE.Group(); cylinder(g, 0.18, 0.18, 0.45, P.walnut, 0, 0, 0, 24); place(g, 1061, 360); }
  for (const [a, b, sc] of [[1022, 330, 1.1], [1092, 330, 1.0], [1101, 332, 0.9]]) pot(a, b, sc);
  wl(1115, 316, 1250, 321);                                                                       // lounge back wall (render: travertine + tile art)
  bx(1115, 321, 1228, 322.4, 0.03, H, (() => { const m = std({ map: marble('#d8cbb6', '170,150,120', 0.25), roughness: 0.6 }); m.map.repeat.set(1.5, 1); return m; })(), { collide: false });
  place(tileArtB(), 1172, 322.5, 'down', 1.15);                                                 // colour tile art above the sofa
  // plan: the lounge runs to a glass side at ix 1247, a planted strip outside it, and a wall closing the corner at iy 375
  glassWall(1245, 321, 1250, 375, 26);                                                             // lounge side glazing (plan)
  wl(1230, 375, 1268, 380);                                                                       // corner wall (plan)
  { const g = new THREE.Group(); const o = mesh(g, new THREE.CylinderGeometry(0.5, 0.5, 0.42, 40), K2.terracottaUph, 0, 0.21, 0); o.scale.set(0.55, 1, 1.5); place(g, 1235, 352); solid(1229, 336, 1241, 368); }   // oval ottoman (plan)

  glassWall(1262, 380, 1268, 575, 26, [[388, 425]]);                                            // to the walkway
  wl(1262, 575, 1268, 612);                                                                       // WC 2 outer wall: solid, not glass (privacy)
  // plan: copa 1023–1110, WC 1 1115–1175 (toilet top-left, vanity along the bottom), WC 2 1180–1262 (vanity on the top wall, toilet at the end)
  wl(1068, 575, 1268, 580, [{ from: 1080, to: 1105 }, { from: 1150, to: 1172 }, { from: 1182, to: 1200 }]);
  wl(1110, 580, 1115, 635); wl(1175, 580, 1180, 612);                                             // copa / WC 1 wall stops at the copa back wall
  it2(toiletB, 1118, 581, 1134, 599, 'down'); it2(vanity2B, 1140, 601, 1173, 612, 'up');
  it2(vanity2B, 1205, 580, 1250, 591, 'down'); it2(toiletB, 1244, 596, 1262, 612, 'left');
  bx(1003, 380, 1008, 489.9, 0.0, H, P.walnut, { collide: false });                                // stops at the lobby wall (overlapping it flickered)                                // walnut wall panelling
  wl(1003, 490, 1068, 495, [{ from: 1025, to: 1055 }]);                                          // to the lift lobby (plan)
  bx(1111, 451, 1120, 494, 0, H, P.walnut);                                                       // walnut-clad pillar mid-room (plan)
  for (let iy = 457; iy < 494; iy += 6) for (const x of [1110.9, 1120.1]) bx(x - 0.15, iy, x + 0.15, iy + 0.4, 0.05, H - 0.05, P.taupeDark, { collide: false, cast: false });   // vertical grooves, as on the walnut wall
  wl(1063, 495, 1068, 527);                                                                       // wall behind the copa counter, closing it off from the lift-lobby passage (plan)
  bx(1068, 503, 1079, 566, 0, 0.9, P.walnut); bx(1067.5, 502.5, 1079.5, 566.5, 0.9, 0.94, K2.travertine);   // copa counter on the lift wall (plan)
  { const g = new THREE.Group(); rb(g, 0.4, 0.006, 0.34, P.brushed, 0, 0.94, 0, 0.004); cylinder(g, 0.014, 0.014, 0.3, P.brushed, 0, 0.94, -0.12, 12); place(g, 1073.5, 515, 'right'); }
  place(plantB(0, 0, 0.5, std({ color: '#c9b79c', roughness: 0.8 })), 1073.5, 552, 0, 0.94);
  for (let iy = 395; iy < 495; iy += 9) bx(1008, iy, 1008.6, iy + 0.4, 0.05, H - 0.05, P.taupeDark, { collide: false, cast: false });
  for (const iy of [400, 470]) place(brassSconce(), 1008.8, iy, 'right', 1.55);
  place(sideboardTrav(3.8, 0.45), 1014, 437, 'right'); solid(1008, 395, 1020, 480);
  for (const [a, b] of [[1138, 415], [1203, 412], [1166, 470], [1129, 527], [1183, 527]]) {        // plan positions
    place(pedestalRoundB(0.55, P.walnut, P.walnut), a, b); solid(a - 9, b - 9, a + 9, b + 9);
    for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2 + Math.PI / 4; place(uphChairB(), a + Math.cos(ang) * 17, b + Math.sin(ang) * 17, look(a + Math.cos(ang) * 17, b + Math.sin(ang) * 17, a, b)); }
    const bowl = new THREE.Group(); cylinder(bowl, 0.13, 0.08, 0.1, std({ color: '#5b4636', roughness: 0.7 }), 0, 0, 0, 20);
    for (let i = 0; i < 9; i++) mesh(bowl, new THREE.SphereGeometry(0.05 + Math.random() * 0.03, 8, 6), K2.shrub2, Math.cos(i) * 0.07, 0.12 + (i % 3) * 0.03, Math.sin(i) * 0.07);
    place(bowl, a, b, 0, 0.75);                                                                     // flower bowl centrepiece (render)
  }
  for (const [a, b] of [[1224, 500], [1224, 552]]) {                                             // tall tables by the planter + poufs (plan)
    place(pedestalRoundB(0.22, P.walnut, K2.concreteSmooth, 0.62), a, b);   // low side table for the poufs solid(a - 5, b - 5, a + 5, b + 5);
    for (const s of [-1, 1]) place(poufB(K2.orangePouf, 0.2, 0.42), a - 11, b + s * 8);
  }
  bx(1235, 475, 1262, 565, 0, 0.45, planterM);                                                    // low planter by the glass (render)
  bx(1236, 476, 1261, 564, 0.45, 0.47, P.soil, { collide: false, cast: false });
  for (let iy = 484; iy < 560; iy += 11) for (const ix of [1243, 1254]) place(tropicalB(0.75 + Math.random() * 0.25), ix, iy + (ix > 1250 ? 5 : 0), Math.random() * 6, 0.45);   // compact planting kept inside the planter
  for (const [a, b] of [[1060, 430], [1160, 430], [1150, 525], [1220, 520]]) { const l = new THREE.PointLight('#ffcf98', 1.8, 7, 2); l.position.set(W(a, b)[0], 2.35, W(a, b)[1]); world.add(l); }
  flH(1003, 375, 1268, 575, [[1003, 495, 1068, 575]], marble('#e2d9ca', '170,155,135', 0.1, '#d3c8b6'), 1.2, 0.3, 0.0055);   // warm stone floor (render)
  { const g = new THREE.Group(); cylinder(g, 0.08, 0.06, 0.2, std({ color: '#5a3b2a' }), 0, 0, 0, 16); g.add(plantB(0, 0, 0.6, std({ color: '#5a3b2a' }))); place(g, 1014, 410, 0, 0.86); }
  // ovals: buffet table (plan: dark oval at the west wall)
  place(ovalDiningB(2.0, 1.1, P.walnut), 1066, 430, 'right'); solid(1058, 410, 1074, 450);
  // lounge (salão annex): sofa + armchairs (plan)
  place(moduleSofaB(2.6, 0.9, K2.beigeCush, [true, true]), 1172, 332, 'down'); solid(1150, 325, 1195, 343);
  for (const iy of [348, 366]) place(uphChairB(K2.terracottaUph, P.walnut), 1132, iy, 'right');
  place(pedestalRoundB(0.35, K2.travertine, K2.travertine, 0.4), 1175, 360);
  for (let ix = 1006; ix < 1112; ix += 28) bx(ix, 382, ix + 26, 384, 0.05, H - 0.05, P.sheer, { collide: false, cast: false });
  pot(1020, 560, 1.2);
  // copa de apoio: counter + cooktop + sink, tall fridge
  // plan: counter (cooktop + sink) along the copa's back wall at iy 635; outside it a strip of floor, then the kids' track
  place(baseCabB(3.6, 0.62), 1076, 628.5, 'up'); solid(1040, 621, 1112, 635);
  bx(1039, 633.6, 1112, 635, 0.9, 1.5, std({ map: tex(porcelainTex), roughness: 0.4 }), { collide: false });   // backsplash
  bx(1058, 623, 1070, 633, 0.94, 0.952, P.blackGlass, { collide: false });                        // cooktop (plan)
  { const g = new THREE.Group(); rb(g, 0.5, 0.008, 0.38, P.brushed, 0, 0.94, 0, 0.003); rb(g, 0.4, 0.004, 0.28, P.black, 0, 0.946, 0, 0.002); cylinder(g, 0.014, 0.014, 0.3, P.brushed, 0, 0.94, -0.14, 12); place(g, 1099, 628, 'up'); }   // sink (plan)
  place(fridgeB(0.8, 0.7), 1030, 590, 'down'); solid(1021, 580, 1040, 598);
  bx(1042, 580, 1077, 593, 0, 0.9, P.walnut); bx(1042, 580, 1077, 593, 0.9, 0.94, K2.travertine);   // serving counter on the salão wall (plan)
  wl(1040, 635, 1123, 640);                                                                       // copa back wall behind the counter only: left of it the copa opens onto the kids' track (plan passage to the salão)

  // ---------------------------------------------------------------------------
  // 10 ESPAÇO JOGOS – ping-pong table, foosball, blue banquette on a wood base, concrete pedestal
  // tables, cove-lit ceiling, planters (render)
  // ---------------------------------------------------------------------------
  // layout measured on the plan: storage column at the left, L planter + L blue banquette along the stair-core
  // wall, two round wood tables with chairs, foosball, ping-pong; white supporting pillars on the open side
  const lush = (ix0, iy0, ix1, iy1, y, hMax = 0.55, rMax = 0.22) => {                                  // dense low leafy planting kept inside a bed
    const greens = ['#3f6a2e', '#4d7a35', '#5a8a3c', '#355f28', '#6b9a45'].map(c => std({ color: c, roughness: 0.85, flatShading: true }));
    const area = (ix1 - ix0) * (iy1 - iy0), n = Math.max(6, Math.round(area / 6));
    for (let i = 0; i < n; i++) {
      const ix = ix0 + 1 + Math.random() * (ix1 - ix0 - 2), iy = iy0 + 1 + Math.random() * (iy1 - iy0 - 2), r = Math.min(rMax, 0.1 + Math.random() * 0.12);
      const [x, z] = W(ix, iy); mesh(world, new THREE.IcosahedronGeometry(r, 1), greens[i % 5], x, y + r * 0.6 + Math.random() * (hMax - 2 * r), z, Math.random(), Math.random(), 0);
    }
  };
  { const pm = std({ map: plankTex.clone(), roughness: 0.75 }); pm.map.needsUpdate = true; pm.map.repeat.set(4, 1.3);   // weathered wood cladding on the core wall above the planter (render)
    bx(747, 580, 912, 581.2, 0, H, pm, { collide: false });
    const pw = std({ map: plankTex.clone(), roughness: 0.75 }); pw.map.needsUpdate = true; pw.map.repeat.set(1.2, 1.3);
    bx(729, 578, 747, 642, 0, H, pw); }                                          // wooden wall behind the banquette's short leg
  bx(748, 581.2, 905, 591, 0, 0.45, planterM); bx(748, 591, 760, 641, 0, 0.45, planterM);      // L planter behind the banquette (plan)
  lush(749.5, 582, 903, 589.5, 0.45, 0.32, 0.12); lush(749.5, 592, 758.5, 639, 0.45, 0.32, 0.12);   // low planting: stays below the sofa back, inside the bed
  place(lBanquetteB(6.1, 2.4, 0.55), 824, 597, 'down'); solid(760, 591, 889, 603); solid(760, 603, 773, 641);   // L banquette (plan: 760–888 × 590–640)
  flH(700, 580, 1003, 745, [], marble('#ddd2c0', '170,155,130', 0.08, '#cdbfa9'), 1.2, 0.3, 0.005);   // large warm porcelain
  for (const ix of [812, 853]) {                                                                   // round wood tables against the banquette, a chair each side (plan)
    place(pedestalRoundB(0.38, P.walnut, P.walnut), ix, 612); solid(ix - 8, 604, ix + 8, 619);
    for (const sgn of [-1, 1]) place(oakChairB(K2.beigeCush), ix + sgn * 7, 627, look(ix + sgn * 7, 627, ix + sgn * 3, 597));   // chairs facing the banquette
  }
  place(foosballB(), 795, 665, 'right'); solid(783, 645, 807, 686);
  place(pingPongB(), 903, 666, 'down'); solid(873, 650, 933, 682);
  for (const [a, b, c, d] of [[736, 686, 751, 722], [835, 686, 857, 722], [948, 686, 963, 722], [1006, 693, 1021, 722]]) bx(a, b, c, d, 0, H, white);   // supporting pillars (plan) – plain white; stop under the roof slab (its edge shared their face plane and flickered)
  sanca(-684 * K, 750 * K, -596 * K, 955 * K, 65, 0.18);                                          // coffer stays inside the games room (ends before the pillars)                                          // recessed coffer with a warm cove (render)
  planter(735, 755, 985, 790, 0.5, 'tropical');
  for (let ix = 745; ix < 980; ix += 22) place(tropicalB(1.3), ix, 765 + (ix % 3) * 6, Math.random() * 6, 0.5);
  for (const ix of [770, 880, 960]) palm(ix, 776, 5.5, 0.5);
  for (const [a, c] of [[966, 983], [987, 1003]]) { bx(a, 692, c, 702, 0, 0.45, planterM); bx(a + 0.5, 692.5, c - 0.5, 701.5, 0.45, 0.47, P.soil, { collide: false, cast: false }); lush(a, 692, c, 702, 0.45, 0.65); }   // two small planters leading to the kids' track (plan)

  // ---------------------------------------------------------------------------
  // 09 BRINQUEDOTECA – ball pit behind a grid with the mushroom mural, hanging discs, wood wall with
  // striped-awning booths (cinema, oficina, pet shop), TV, pink beanbags, little table and stools (render)
  // ---------------------------------------------------------------------------
  wl(1115, 612, 1270, 617);
  wl(1118, 617, 1123, 763, [{ from: 666, to: 692 }]);                                            // door where the track line comes in (plan)
  wl(1118, 758, 1272, 763);
  glassWall(1265, 617, 1270, 763, 26, [[693, 718]]);
  bx(1123, 617.5, 1265, 618, 0.05, 2.5, muralM, { collide: false, cast: false });                 // mushroom mural (painted)
  // plan: wedge-shaped ball pit along the mural wall (deep at the window end), wood platform + steps at the left,
  // wire grid on oak posts along the pit edge, hanging discs above
  const IMG = (pts, y) => pts.map(([a, b]) => { const [x, z] = W(a, b); return new THREE.Vector3(x, y, z); });
  { const rim = std({ color: '#c9a99a', roughness: 0.8 }), outer = [[1137, 618], [1262, 618], [1262, 667], [1137, 651]], inner = [[1141, 622], [1258, 622], [1258, 662], [1141, 647]];
    const sh = new THREE.Shape(IMG(outer, 0).map(v => new THREE.Vector2(v.x, v.z)));
    sh.holes.push(new THREE.Path(IMG(inner, 0).map(v => new THREE.Vector2(v.x, v.z))));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
    geo.rotateX(Math.PI / 2); geo.translate(0, 0.55, 0);                        // shape lay in x/y → now x/z, extruded down to the floor
    const m = new THREE.Mesh(geo, rim); m.castShadow = m.receiveShadow = true; world.add(m);
    solid(1137, 618, 1262, 667);
    const ballGeo = new THREE.SphereGeometry(0.05, 8, 6), n = 3200, inst = new THREE.InstancedMesh(ballGeo, K2.ball, n), m4 = new THREE.Matrix4();
    let i = 0; while (i < n) { const ix = 1141 + Math.random() * 117, iy = 622 + Math.random() * 40; if (iy > 647 + (ix - 1141) / 117 * 15) continue;
      const [x, z] = W(ix, iy); m4.makeTranslation(x, 0.3 + Math.random() * 0.17, z); inst.setMatrixAt(i++, m4); }
    inst.receiveShadow = true; world.add(inst); }
  bx(1123, 617, 1141, 640, 0, 0.55, K2.oakLight);                                                   // wood platform at the pit (plan)
  for (let i = 0; i < 3; i++) bx(1123, 640 + i * 4, 1141, 644 + i * 4, 0, 0.55 - (i + 1) * 0.14, K2.oakLight);   // steps down into the room
  { // fine wire grid on oak posts along the pit's sloping edge (render)
    const wireTex = canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#4a4744'; for (let i = 0; i < w; i += 16) { g.fillRect(i, 0, 2, h); g.fillRect(0, i, w, 2); } });
    const [A, B] = IMG([[1141, 652], [1200, 659]], 0), L = A.distanceTo(B), Hh = 1.85;
    wireTex.repeat.set(L / 0.15 / 8, Hh / 0.15 / 8);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, Hh), std({ map: wireTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }));
    m.position.set((A.x + B.x) / 2, 0.55 + Hh / 2, (A.z + B.z) / 2); m.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x); world.add(m);
    for (const [ix, iy] of [[1141, 652], [1170, 655.5], [1200, 659]]) bx(ix - 0.6, iy - 0.6, ix + 0.6, iy + 0.6, 0.55, 2.42, K2.oakLight, { collide: false });
    const t = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, 0.05), K2.oakLight); t.position.set((A.x + B.x) / 2, 2.42, (A.z + B.z) / 2); t.rotation.y = m.rotation.y; world.add(t);
  }
  for (const [a, b, r] of [[1165, 640, 0.55], [1200, 650, 0.65], [1235, 645, 0.5], [1185, 668, 0.45], [1222, 672, 0.4]]) {   // hanging discs
    const g = new THREE.Group(); cylinder(g, r, r, 0.03, std({ color: '#b58a7a', roughness: 0.8 }), 0, 1.95 + Math.random() * 0.35, 0, 32);
    mesh(g, new THREE.CylinderGeometry(0.002, 0.002, 0.6, 4), P.black, 0, 2.45, 0); hang(g, a, b);
  }
  bx(1123, 754, 1265, 758, 0, H, K2.oakLight, { collide: true });                                  // wood-clad wall with built-in booths
  for (const [a, label] of [[1150, 'OFICINA'], [1180, 'PET SHOP'], [1210, 'CINEMA']]) place(shopBoothB(1.35, label), a, 746, 'up');
  bx(1228, 744, 1262, 754, 0, 0.55, K2.oakLight);                                                  // low drawer unit
  { const cartoon = canvasTex(512, 288, (g, w, h) => {                 // colourful animated-film frame on the TV (render)
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f2b45a'); sky.addColorStop(1, '#8a4a2a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5a3a22'; g.fillRect(0, h * 0.72, w, h * 0.28);
      const cols = ['#2f8a3a', '#e8d24a', '#3a6fc0', '#c8402e', '#8a5ad0', '#f0f0e8', '#3fb0a0'];
      for (let i = 0; i < 9; i++) { const x = 30 + i * 52 + Math.random() * 10, y = h * 0.35 + Math.random() * 40, c = cols[i % cols.length];
        g.fillStyle = c; g.beginPath(); g.ellipse(x, y + 40, 18, 34, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 6, y - 3, 4, 0, 7); g.arc(x + 6, y - 3, 4, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x - 6, y - 3, 2, 0, 7); g.arc(x + 6, y - 3, 2, 0, 7); g.fill(); } });
    const scr = phys({ color: '#020203', roughness: 0.1, emissive: '#ffffff', emissiveMap: cartoon, emissiveIntensity: 0.8 });
    const g = new THREE.Group(); rb(g, 1.7, 0.98, 0.05, P.tvPanel, 0, 0, 0, 0.01); mesh(g, new THREE.PlaneGeometry(1.62, 0.9), scr, 0, 0.49, 0.027, 0, 0, 0, false); place(g, 1245, 753.4, 'up', 1.05); }
  for (let ix = 1231; ix < 1262; ix += 7.5) { mesh(world, new THREE.SphereGeometry(0.03, 12, 8), P.walnut, W(ix + 3.7, 743.6)[0], 0.32, W(ix + 3.7, 743.6)[1]); bx(ix + 0.2, 743.7, ix + 0.4, 744, 0.05, 0.53, std({ color: '#a8824f' }), { collide: false, cast: false }); }   // drawer fronts + knobs
  { // grey double stripe on the terrazzo (plan: the play-track line entering diagonally and leaving through the garden door)
    const ix0 = 1123, iy0 = 618, ix1 = 1265, iy1 = 742, Q = 8;
    const t = canvasTex((ix1 - ix0) * Q, (iy1 - iy0) * Q, (c) => {
      c.clearRect(0, 0, (ix1 - ix0) * Q, (iy1 - iy0) * Q); c.setTransform(Q, 0, 0, Q, -ix0 * Q, -iy0 * Q);
      c.strokeStyle = 'rgba(140,138,128,0.95)'; c.lineWidth = 1.6; c.lineJoin = 'round';
      for (const o of [-2.2, 2.2]) { c.beginPath(); c.moveTo(ix0, 672 + o); c.lineTo(1200, 703 + o); c.quadraticCurveTo(1206, 706 + o, 1214, 706 + o); c.lineTo(ix1 + 2, 706 + o); c.stroke(); }
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
    const pts = IMG([[ix0, iy1], [ix1, iy1], [ix1, iy0], [ix0, iy0]], 0.012), geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { geo.setIndex([0, 2, 1, 0, 3, 2]); geo.computeVertexNormals(); }
    world.add(new THREE.Mesh(geo, std({ map: t, transparent: true, depthWrite: false, roughness: 0.6 })));
  }
  { // track across the walkway joining the brinquedoteca stripe to the playground path (plan)
    const ix0 = 1265, ix1 = 1304, iy0 = 700, iy1 = 712, Q = 10;
    const t = canvasTex((ix1 - ix0) * Q, (iy1 - iy0) * Q, (c) => {
      c.clearRect(0, 0, (ix1 - ix0) * Q, (iy1 - iy0) * Q); c.setTransform(Q, 0, 0, Q, -ix0 * Q, -iy0 * Q);
      c.fillStyle = 'rgba(106,76,52,0.95)'; c.fillRect(ix0, 704, ix1 - ix0, 4);                         // brown band like the playground path
      c.strokeStyle = 'rgba(140,138,128,0.95)'; c.lineWidth = 1.6; for (const o of [-2.2, 2.2]) { c.beginPath(); c.moveTo(ix0, 706 + o); c.lineTo(ix1, 706 + o); c.stroke(); }
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
    const pts = IMG([[ix0, iy1], [ix1, iy1], [ix1, iy0], [ix0, iy0]], 0.008), geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { geo.setIndex([0, 2, 1, 0, 3, 2]); geo.computeVertexNormals(); }
    world.add(new THREE.Mesh(geo, std({ map: t, transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -20 })));
  }
  place(kidTableB(), 1189, 681); solid(1180, 672, 1198, 690);                                        // little table + stools (plan)
  { const g = new THREE.Group(); mesh(g, new THREE.CircleGeometry(1.15, 48), std({ color: '#e7dccb', roughness: 1 }), 0, 0.018, 0, -Math.PI / 2, 0, 0, false); place(g, 1149, 720); }   // round rug
  for (const [a, b] of [[1131, 721], [1149, 711], [1167, 722]]) place(beanbagB(), a, b, look(a, b, 1149, 690));   // pink kids' armchairs round the rug, facing into the room (plan)

  // kids' outdoor track (next to the brinquedoteca): planted mound in the middle
  { // kids' track floor (plan): tan rubber, the loop drawn as the same grey double stripe as the brinquedoteca line,
    // leaving at the top right through the brinquedoteca door to join its stripe
    const ix0 = 1007, iy0 = 660, ix1 = 1118, iy1 = 752, Q = 10;
    const loop = [[1100, 671], [1068, 669], [1063, 680], [1056, 688], [1040, 684], [1027, 693], [1032, 704], [1043, 711], [1031, 723], [1030, 739],
      [1044, 745], [1057, 737], [1067, 733], [1080, 740], [1096, 746], [1104, 734], [1094, 721], [1090, 709], [1097, 695], [1107, 682]];
    const t = canvasTex((ix1 - ix0) * Q, (iy1 - iy0) * Q, (c) => {
      c.setTransform(Q, 0, 0, Q, -ix0 * Q, -iy0 * Q);
      c.fillStyle = '#d6b88a'; c.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
      c.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 3000; i++) c.fillRect(ix0 + Math.random() * 111, iy0 + Math.random() * 92, 0.25, 0.25);
      const path = () => { c.beginPath(); const n = loop.length;                 // smooth closed curve through the points (Catmull-Rom → Bézier)
        c.moveTo(...loop[0]);
        for (let i = 0; i < n; i++) { const p0 = loop[(i - 1 + n) % n], p1 = loop[i], p2 = loop[(i + 1) % n], p3 = loop[(i + 2) % n];
          c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
        c.closePath(); };
      const exit = () => { c.beginPath(); c.moveTo(1104, 676); c.quadraticCurveTo(1112, 673, ix1 + 1, 672); };
      c.lineJoin = c.lineCap = 'round';
      c.strokeStyle = 'rgba(140,138,128,0.95)'; c.lineWidth = 6; path(); c.stroke(); exit(); c.stroke();   // grey band…
      c.strokeStyle = '#d6b88a'; c.lineWidth = 2.8; path(); c.stroke(); exit(); c.stroke();                 // …hollowed out → double stripe
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
    const pts = IMG([[ix0, iy1], [ix1, iy1], [ix1, iy0], [ix0, iy0]], 0.005), geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { geo.setIndex([0, 2, 1, 0, 3, 2]); geo.computeVertexNormals(); }
    const m = new THREE.Mesh(geo, std({ map: t, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -20 })); m.receiveShadow = true; world.add(m);
  }
  { const greens = ['#3f6a2e', '#4d7a35', '#5a8a3c', '#355f28', '#6b9a45'].map(c => std({ color: c, roughness: 0.85, flatShading: true })), g = new THREE.Group();
    for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, d = Math.random() * 0.6, r = 0.2 + Math.random() * 0.18; mesh(g, new THREE.IcosahedronGeometry(r, 1), greens[i % 5], Math.cos(a) * d, r * 0.7 + Math.random() * 0.5 * (1 - d / 0.7), Math.sin(a) * d, Math.random(), Math.random(), 0); }
    place(g, 1062, 710); solid(1046, 694, 1078, 726); }                                     // big round shrub in the middle of the track (plan)                                                                         // leafy round shrub

  // ---------------------------------------------------------------------------
  // WALKWAY + 07 CHURRASQUEIRA c/ FORNO PARA PIZZA – dark pergola, grill with hood, pizza oven,
  // travertine island with stools, long table with rope chairs, slate modular sofa, lavender (render)
  // ---------------------------------------------------------------------------
  planter(1270, 430, 1280, 675, 0.9, 'hedge');
  planter(1302, 428, 1336, 545, 0.5, 'tropical');                                                 // palm planter beside the churrasqueira (plan)
  for (const iy of [455, 520]) palm(1319, iy, 3.5, 0.5);
  bx(1336, 455, 1338, 545, 0, 1.1, M.glass, { collide: true, cast: false }); bx(1336, 455, 1338, 545, 1.1, 1.14, M.frame, { collide: false });   // glass rail between planter and deck (plan)
  planter(1250, 321, 1267, 375, 0.45, 'none');                                                   // planted strip outside the lounge glass (plan)
  for (let iy = 328; iy < 372; iy += 9) place(shrubB(0.38 + Math.random() * 0.1), 1258.5, iy, Math.random() * 6, 0.45);
  wl(1340, 316, 1450, 321); wl(1340, 321, 1345, 362); wl(1345, 357, 1450, 362, [{ from: 1355, to: 1378 }]);   // service WC
  it2(toiletB, 1420, 324, 1440, 345, 'down'); it2(vanity2B, 1380, 322, 1410, 332, 'down');
  place(grillWallB(4.4), 1395, 375, 'down'); solid(1345, 362, 1450, 390);
  // plan: L counter (grill wall + return with a cooktop on the street side), island with sink + 5 stools,
  // table for 6, blue modular sofas in an L round a small orange side table; solid roof over the kitchen end (render)
  bx(1426, 382.5, 1440, 410, 0, 0.9, K2.charcoal); bx(1425.5, 382.5, 1440, 410.5, 0.905, 0.945, K2.concreteSmooth);   // counter return (starts where the grill counter ends: no overlap)
  bx(1428, 394, 1438, 406, 0.94, 0.952, P.blackGlass, { collide: false });                           // cooktop
  place(islandB(3.0, 1.2, 0.8), 1409, 425, 'down'); solid(1378, 413, 1440, 438);
  { const g = new THREE.Group(); rb(g, 0.5, 0.006, 0.36, P.brushed, 0, 0.94, 0, 0.004); cylinder(g, 0.014, 0.014, 0.3, P.brushed, 0, 0.94, -0.12, 12); place(g, 1402, 422, 'down'); }   // island sink
  for (const ix of [1385, 1397, 1409, 1421, 1433]) place(barStoolB(K2.rope), ix, 446, 'up');
  place(longTableB(2.8, 1.0), 1393, 485, 'up'); solid(1364, 475, 1422, 495);
  for (const ix of [1374, 1393, 1412]) { place(ropeChairB(), ix, 468, 'down'); place(ropeChairB(), ix, 502, 'up'); }   // 6 seats (plan)
  const sofaM = fabric('#4d5f7c', 1.4);
  for (const iy of [538, 558, 578]) place(moduleSofaB(0.94, 0.95, sofaM, [false, false]), 1431, iy, 'left');   // modules along the street side
  for (const ix of [1367, 1388, 1409]) place(moduleSofaB(0.94, 0.95, sofaM, [false, false]), ix, 601, 'up');   // 0.94 m modules at 0.96 m spacing: small gaps, no overlapping faces   // modules across the bottom
  solid(1421, 528, 1441, 590); solid(1357, 591, 1419, 611);
  place(pedestalRoundB(0.25, std({ color: '#c26a35', roughness: 0.6 }), P.black, 0.45), 1378, 575);
  bx(1342, 362, 1450, 440, 2.55, 2.62, darkMetal, { collide: false, parent: ceilingGroup });       // solid roof over the kitchen end (render)
  { // pergola: dark posts and beams with LED in the beams
    for (const [a, b] of [[1342, 390], [1342, 622], [1446, 622], [1342, 505]]) bx(a, b, a + 4, b + 4, 0, 2.55, darkMetal);
    for (const [a, b, c, d] of [[1342, 362, 1450, 366], [1342, 620, 1450, 624], [1342, 362, 1346, 624], [1446, 362, 1450, 624]]) bx(a, b, c, d, 2.42, 2.6, darkMetal, { collide: false });
    for (let iy = 400; iy < 620; iy += 28) { bx(1346, iy, 1446, iy + 2.5, 2.45, 2.6, darkMetal, { collide: false }); bx(1350, iy + 0.7, 1442, iy + 1.8, 2.44, 2.45, P.cove, { collide: false, cast: false }); }
  }
  planter(1442, 470, 1450, 620, 0.5, 'agapanthus');
  { const stone = canvasTex(512, 256, (g, w, h) => { for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const t = 0.8 + Math.random() * 0.3; g.fillStyle = 'rgb(' + (92 * t | 0) + ',' + (90 * t | 0) + ',' + (86 * t | 0) + ')'; g.fillRect(c * 128 + (r % 2) * 64 - 64, r * 32, 126, 30); g.fillRect(c * 128 + (r % 2) * 64 + 64, r * 32, 126, 30); } });
    stone.repeat.set(3, 3); bx(1345, 362, 1450, 363.2, 0, H, std({ map: stone, roughness: 0.85 }), { collide: false }); }   // dark stone wall behind the grill (render)
  place(agapanthusRow(4.6, 0.4), 1460, 760, 'right', 0.5);

  // ---------------------------------------------------------------------------
  // 08 PLAYGROUND – shrub row, play tower with slide, sandbox, benches
  // ---------------------------------------------------------------------------
  // planted bed between the churrasqueira and the playground (plan: three round shrubs over low planting; render:
  // leafy shrubs, white flowers, lavender at the playground edge)
  planter(1310, 625, 1450, 660, 0.45, 'none');
  { const greens = ['#3f6a2e', '#4d7a35', '#5a8a3c', '#355f28', '#6b9a45'].map(c => std({ color: c, roughness: 0.85, flatShading: true }));
    const bush = (ix, iy, r) => { const g = new THREE.Group();                         // leafy shrub: many overlapping clumps
      for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.75, h = r * (0.35 + Math.random() * 0.9);
        mesh(g, new THREE.IcosahedronGeometry(r * (0.28 + Math.random() * 0.22), 1), greens[i % 5], Math.cos(a) * d, h, Math.sin(a) * d, Math.random(), Math.random(), 0); }
      place(g, ix, iy, 0, 0.45); };
    for (const [ix, r] of [[1333, 0.95], [1385, 1.0], [1437, 0.95]]) bush(ix, 642, r);
    for (let i = 0; i < 70; i++) {                                                      // low groundcover between the shrubs
      const ix = 1313 + Math.random() * 134, iy = 628 + Math.random() * 29;
      mesh(world, new THREE.IcosahedronGeometry(0.16 + Math.random() * 0.12, 0), greens[i % 5], W(ix, iy)[0], 0.5 + Math.random() * 0.08, W(ix, iy)[1]);
    }
    const flower = std({ color: '#f4f1ea', roughness: 0.7 });
    for (let i = 0; i < 60; i++) { const ix = 1313 + Math.random() * 134, iy = 646 + Math.random() * 11; mesh(world, new THREE.SphereGeometry(0.035, 6, 4), flower, W(ix, iy)[0], 0.72 + Math.random() * 0.2, W(ix, iy)[1]); }   // white flowers
    place(agapanthusRow(6.4, 0.3), 1380, 655.5, 'up', 0.45);                             // agapanthus along the playground edge (same as the pool border)
  }
  { // rubber floor painted from the plan: tan base, brown path from the walkway, brown field under the house,
    // tan half-circle bottom-left, pale edging strips (plan / render)
    const ix0 = 1303, iy0 = 660, ix1 = 1447, iy1 = 782, Q = 6;
    const t = canvasTex((ix1 - ix0) * Q, (iy1 - iy0) * Q, (c) => {
      c.setTransform(Q, 0, 0, Q, -ix0 * Q, -iy0 * Q);
      c.fillStyle = '#d6b88a'; c.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
      c.fillStyle = '#7b5a3e'; c.beginPath(); c.moveTo(ix0, 737); c.lineTo(1352, 737); c.lineTo(1352, 760); c.lineTo(1410, 760);
      c.bezierCurveTo(1424, 760, 1430, 766, 1430, 782); c.lineTo(ix0, 782); c.closePath(); c.fill();
      c.fillStyle = '#d6b88a'; c.beginPath(); c.arc(ix0, 782, 30, -Math.PI / 2, 0); c.closePath(); c.fill();
      c.strokeStyle = '#ece0c8'; c.lineWidth = 2; c.beginPath(); c.arc(ix0, 782, 31, -Math.PI / 2, 0); c.stroke();
      c.beginPath(); c.moveTo(1410, 759); c.bezierCurveTo(1425, 759, 1431, 766, 1431, 782); c.stroke();
      c.strokeStyle = '#6a4c34'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(ix0 - 2, 706); c.lineTo(1326, 706);
      c.bezierCurveTo(1340, 706, 1340, 686, 1356, 686); c.lineTo(1442, 686); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 4000; i++) c.fillRect(ix0 + Math.random() * 144, iy0 + Math.random() * 122, 0.25, 0.25);   // rubber grain
    });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 1);
    const pts = [[ix0, iy1], [ix1, iy1], [ix1, iy0], [ix0, iy0]].map(([a, b]) => W(a, b));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(([x, z]) => [x, 0.006, z]), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) geo.setIndex([0, 2, 1, 0, 3, 2]), geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, std({ map: t, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -20 }));
    m.receiveShadow = true; world.add(m);
  }
  place(playTowerB(), 1373, 742, 'up'); solid(1352, 722, 1394, 763); solid(1394, 732, 1418, 752);   // play house (plan: 1347–1398 × 718–768), stairs to the right
  for (const [a, b] of [[1311, 681], [1323, 679], [1312, 694], [1324, 692]]) place(stumpStoolB(0.42 + ((a + b) % 3) * 0.04), a, b);   // stump stools (plan / render)
  bx(1433, 668, 1443, 698, 0.38, 0.45, K2.oakLight); for (const iy of [671, 695]) bx(1434, iy - 1.5, 1442, iy + 1.5, 0, 0.38, std({ color: '#d9d3c7', roughness: 0.8 }));   // wood bench on stone feet (plan)

  // ---------------------------------------------------------------------------
  // 11 SPA + 12 SAUNA SECA – terracotta loungers by the garden glazing, sunken hot tub, rain shower,
  // wood-look plank walls, brass sconces, glass sauna door, lanterns (render)
  // ---------------------------------------------------------------------------
  // plan: the spa runs up to the fitness wall (iy 723) – the stone pillar stands free in the room, the door to
  // the fitness is left of it, the rain shower right of it, and the sauna's glass front + door face west into the spa
  bx(482, 728, 492, 765, 0, H, std({ map: tex(spaTileTex), roughness: 0.55, color: '#d8d0c4' }));   // full-height stone-clad pillar
  for (const y of [1.45, 1.8]) place(brassSconce(), 487, 765, 'down', y);                          // two brass sconces on the pillar
  glassWall(530, 723, 535, 792, 17, [[755, 778]]);                                                // glass sauna front + door (plan / render)
  wl(535, 787, 603, 792, [], spaWallM);                                                           // sauna back, solid
  { const l = new THREE.PointLight('#ffad66', 1.8, 5, 2); l.position.set(W(566, 755)[0], 1.9, W(566, 755)[1]); world.add(l); }
  bx(537, 742, 596, 743, 0.32, 0.34, P.cove, { collide: false, cast: false });                    // LED under the upper bench
  flH(437, 723, 530, 783, [], marble('#cdc5b8', '150,140,125', 0.08, '#bdb4a6'), 1.2, 0.3, 0.006);   // spa floor up to the fitness wall
  flH(437, 783, 562, 910, [TUB], marble('#cdc5b8', '150,140,125', 0.08, '#bdb4a6'), 1.2, 0.3, 0.006);   // large grey-beige porcelain
  for (let i = 0; i < 14; i++) { const [x, z] = W(522 + Math.random() * 26, 840 + Math.random() * 48); const f = new THREE.Mesh(new THREE.CircleGeometry(0.08 + Math.random() * 0.18, 12), std({ color: '#ffffff', transparent: true, opacity: 0.45, roughness: 0.6, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.position.set(x, -0.095, z); world.add(f); }   // whirlpool foam
  for (const [a, b] of [[410, 800], [420, 835], [412, 870], [422, 895], [470, 940], [530, 950]]) { const g = new THREE.Group(); for (let k = 0; k < 4; k++) mesh(g, new THREE.ConeGeometry(0.05, 0.22, 4), std({ color: '#c8322a', roughness: 0.6 }), (k - 1.5) * 0.06, 1.0 + k * 0.12, 0, 0, 0, (k % 2 ? 0.6 : -0.6)); place(g, a, b, Math.random() * 6, 0.45); }   // heliconia
  for (const [a, b] of [[480, 830], [530, 870]]) { const l = new THREE.PointLight('#ffd6a8', 1.4, 6, 2); l.position.set(W(a, b)[0], 2.3, W(a, b)[1]); world.add(l); }
  wl(598, 723, 603, 787, [], sauna);
  for (const [a, b, c, d, y] of [[537, 725, 596, 742, 0.45], [537, 725, 596, 733, 0.9], [580, 742, 596, 785, 0.45]]) bx(a, b, c, d, y - 0.06, y, sauna);
  for (const [a, b, c, d] of [[535, 723, 598, 724], [535, 786, 598, 787], [597, 723, 598, 787]]) bx(a, b, c, d, 0, 2.3, sauna, { collide: false });   // slatted wood lining
  for (let ix = 538; ix < 596; ix += 2.4) bx(ix, 785.4, ix + 1.6, 786, 0, 2.3, slatM, { collide: false, cast: false });
  bx(535, 723, 598, 787, 2.3, 2.34, sauna, { collide: false, cast: false, parent: ceilingGroup });
  bx(560, 768, 576, 784, 0, 0.6, P.black); for (let i = 0; i < 6; i++) mesh(world, new THREE.SphereGeometry(0.06, 8, 6), std({ color: '#6b6662', roughness: 1 }), W(563 + i * 2, 776)[0], 0.63, W(563 + i * 2, 776)[1]);   // sauna stove, away from the door
  glassWall(434, 783, 439, 912, 22);                                                              // garden glazing
  glassWall(437, 910, 562, 915, 22);
  wl(560, 792, 565, 915, [{ from: 800, to: 828 }], spaWallM);
  for (const iy of [810, 842, 874]) { place(spaLoungerB(), 462, iy, 'right'); solid(442, iy - 9, 484, iy + 9); }
  for (const iy of [826, 858]) { const g = new THREE.Group(); cylinder(g, 0.18, 0.18, 0.42, P.walnut, 0, 0, 0, 28); place(g, 452, iy); }   // drum side tables between the loungers (plan)
  place(plantB(0, 0, 1.4, std({ color: '#5a3b2a', roughness: 0.8 })), 452, 893);   // potted plant by the glazing (plan)
  place(lanterns(), 548, 903);
  { const g = new THREE.Group(); rb(g, 0.06, H - 0.05, 0.06, P.black, 0, 0, 0, 0.01); rb(g, 0.06, 0.04, 0.45, P.black, 0, H - 0.3, 0.22, 0.01); cylinder(g, 0.13, 0.13, 0.02, P.brushed, 0, H - 0.32, 0.45, 20); place(g, 512, 724, 'down'); }   // rain shower between the pillar and the sauna (plan)
  bx(502, 726, 522, 746, 0.003, 0.015, std({ color: '#9aa3a6', roughness: 0.4 }), { collide: false });   // shower floor
  for (let i = 0; i < 6; i++) bx(436.8, 783 + i * 22, 439.4, 790 + i * 22, 2.34, H - 0.006, std({ color: '#e9e2d4', roughness: 0.9 }), { collide: false, parent: ceilingGroup });   // roller-blind boxes (stand 2 cm proud of the frame and just under the ceiling: shared planes flickered)
  ledLine(440, 790, 441.2, 905, H - 0.05);
  // vestiários
  wl(648, 723, 653, 770); wl(695, 723, 700, 770);
  wl(600, 768, 700, 773, [{ from: 610, to: 638 }, { from: 662, to: 690 }]);
  for (const ix0 of [603, 653]) {
    it2(toiletB, ix0 + 28, 726, ix0 + 42, 745, 'down');
    it2(vanity2B, ix0 + 2, 726, ix0 + 24, 736, 'down');
    bx(ix0 + 2, 746, ix0 + 22, 766, 0.003, 0.02, std({ color: '#cfcac0', roughness: 0.4 }), { collide: false });
    bx(ix0 + 22, 746, ix0 + 23, 766, 0, 2.1, M.glass, { collide: true, cast: false });
  }

  // ---------------------------------------------------------------------------
  // 13 POOL BAR + 19 DUCHA
  // ---------------------------------------------------------------------------
  place(baseCabB(4.4, 0.65), 654, 834, 'down'); solid(608, 826, 700, 842);
  bx(606, 820, 700, 826, 0, 2.2, std({ map: tex(spaTileTex), roughness: 0.6 }));
  place(openShelvesB(3.0), 654, 823, 'down', 1.5);
  { const g = new THREE.Group(); rb(g, 2.4, 1.0, 0.6, std({ map: tex(spaTileTex), roughness: 0.6 }), 0, 0, 0, 0.01); rb(g, 2.5, 0.05, 0.75, K2.travertine, 0, 1.0, 0.06, 0.008); place(g, 655, 872, 'down'); solid(628, 865, 682, 880); }
  for (const ix of [635, 650, 665, 680]) place(barStoolB(K2.rope), ix, 892, 'up');
  for (const iy of [860, 892]) { place(moduleSofaB(0.85, 0.85, K2.beigeCush), 590, iy, 'right'); solid(580, iy - 10, 600, iy + 10); }   // low outdoor lounge armchairs
  { const g = new THREE.Group(); cylinder(g, 0.25, 0.25, 0.03, P.walnut, 0, 0.47, 0, 32); cylinder(g, 0.025, 0.025, 0.47, P.black, 0, 0, 0, 12); cylinder(g, 0.16, 0.16, 0.015, P.black, 0, 0, 0, 24); place(g, 590, 876); }   // slim side table between them
  { const g = new THREE.Group(); rb(g, 0.1, 2.3, 0.1, P.brushed, 0, 0, 0, 0.02); rb(g, 0.1, 0.05, 0.4, P.brushed, 0, 2.25, 0.18, 0.02); cylinder(g, 0.15, 0.15, 0.02, P.brushed, 0, 2.22, 0.38, 20); place(g, 688, 942, 'left'); bx(678, 932, 698, 952, 0.003, 0.012, std({ color: '#9aa3a6', roughness: 0.4 }), { collide: false }); }

  // ---------------------------------------------------------------------------
  // 14 SOLARIUM – ipê deck with umbrellas + tables, sun loungers, navy daybeds, bistro sets
  // ---------------------------------------------------------------------------
  planter(740, 812, 1450, 838, 0.45, 'bushes');
  for (const ix of [795, 885, 985, 1085, 1175, 1270, 1365]) palm(ix, 826, undefined, 0.45);
  for (const ix of [1065, 1125, 1185, 1245, 1305]) {
    place(umbrellaB(1.35), ix, 865);
    place(pedestalRoundB(0.38, K2.oakLight, P.black, 0.72), ix, 865); solid(ix - 8, 857, ix + 8, 873);
    for (const s of [-1, 1]) place(ropeChairB(), ix + s * 16, 865, look(ix + s * 16, 865, ix, 865));
  }
  for (let i = 0; i < 10; i++) {
    const ix = 1062 + i * 27 + (i % 2) * -2; place(sunLoungerB(), ix, 935, 'down'); solid(ix - 8, 915, ix + 8, 958);
    if (i % 2 === 0) place(pedestalRoundB(0.18, white, P.black, 0.4), ix + 13, 920);
  }
  for (const ix of [954, 988, 1374, 1408]) { place(daybedB(), ix, 868, 'down'); solid(ix - 15, 846, ix + 15, 890); }
  for (const [a, b] of [[890, 925], [975, 940], [1390, 935]]) { place(bistroSetB(), a, b, 'right'); solid(a - 8, b - 16, a + 8, b + 16); }
  for (const ix of [965, 990, 1015]) { place(slatLoungerB(), ix, 1020, 'down'); solid(ix - 8, 998, ix + 8, 1042); }
  for (const ix of [1342, 1364, 1386, 1408, 1430]) { place(slatLoungerB(), ix, 1020, 'down'); solid(ix - 8, 998, ix + 8, 1042); }
  for (const [a, b] of [[978, 1003], [1383, 1003]]) place(pedestalRoundB(0.18, white, P.black, 0.4), a, b);

  // helper used above (hoisted): item fitted to an image-px rectangle, facing an image direction
  function it2(builder, ix0, iy0, ix1, iy1, face, collide = true) {
    const FACE = { right: 's', left: 'n', up: 'e', down: 'w' }, F = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
    const [xa, za] = W(ix0, iy0), [xb, zb] = W(ix1, iy1), dx = Math.abs(xb - xa), dz = Math.abs(zb - za), f = FACE[face];
    const [w, d] = f === 's' || f === 'n' ? [dx, dz] : [dz, dx];
    const g = builder(w, d); g.position.set((xa + xb) / 2, 0, (za + zb) / 2); g.rotation.y = F[f]; world.add(g);
    if (collide) solid(ix0, iy0, ix1, iy1);
    return g;
  }
}
