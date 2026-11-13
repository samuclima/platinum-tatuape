// Shared 3D engine – generated from apartamento-27m2.html by tools/migrate.mjs (Phase 1).
// Renderer, procedural textures, materials, geometry helpers and the furniture kit used by every
// apartment. The plan scale/origin (PX/OX/OY, X(), Z()) comes from plan.js, set per apartment
// before this module is first imported.
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
import { CFG, PX, OX, OY, X, Z } from './plan.js';

// ---------------------------------------------------------------------------
// Scale: the 27 m² studio brochure plan (at 2000 px width) measures ~118 px per metre (Estar/Dorm = 3.75 m
// = 443 px, Cozinha 5.05 m = 597 px, Terraço 3.26 m = 386 px). Origin = top-left outer corner of the unit.
// ---------------------------------------------------------------------------

export const H = 2.6;           // ceiling height (m)
export const EYE = 1.63;        // eye height (m) – average adult (~1.75 m tall)
export const R = 0.18;          // body radius (m)



// ---------- renderer / scene ----------
export const canvas = document.getElementById('view');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
export const DPR = Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
RectAreaLightUniformsLib.init();

export const scene = new THREE.Scene();
// distance haze: the neighbourhood melts into the horizon colour (hides the edge of the mapped area too)
scene.fog = new THREE.Fog('#c3d0dc', 320, 2300);
export const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.4;

export const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 4000);
export const topCam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 6000);

// ---------------------------------------------------------------------------
// PROCEDURAL TEXTURES
// ---------------------------------------------------------------------------
export function canvasTex(w, h, draw, color = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
// wood veneer – grain runs vertically
export function veneer(base, dark) {
  return canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      const x0 = Math.random() * w;
      g.strokeStyle = `rgba(${dark},${0.03 + Math.random() * 0.12})`; g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath(); let x = x0; g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 24) { x += (Math.random() - 0.5) * 2 + Math.sin(y / 140 + x0) * 0.8; g.lineTo(x, y); }
      g.stroke();
    }
    for (let k = 0; k < 4; k++) {          // cathedral figure
      const cx = Math.random() * w, top = Math.random() * h * 0.6;
      for (let j = 0; j < 9; j++) {
        g.strokeStyle = `rgba(${dark},0.07)`; g.lineWidth = 1.5; g.beginPath();
        const ww = 12 + j * 10; g.moveTo(cx - ww, h);
        g.bezierCurveTo(cx - ww, top + j * 25, cx + ww, top + j * 25, cx + ww, h); g.stroke();
      }
    }
  });
}
// marble / granite
export function marble(base, vein, a = 0.35, grout = null) {
  return canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 50 + Math.random() * 220;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${vein},0.05)`); gr.addColorStop(1, `rgba(${vein},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.filter = 'blur(1.2px)';
    for (let v = 0; v < 12; v++) {
      let x = Math.random() * w, y = -20; const dx = (Math.random() - 0.5) * 2;
      g.strokeStyle = `rgba(${vein},${a * (0.3 + Math.random() * 0.7)})`; g.lineWidth = 0.6 + Math.random() * 2.5;
      g.beginPath(); g.moveTo(x, y);
      while (y < h + 20) { x += dx * 12 + (Math.random() - 0.5) * 18; y += 10 + Math.random() * 14; g.lineTo(x, y); }
      g.stroke();
    }
    g.filter = 'none';
    if (grout) { g.strokeStyle = grout; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); }
  });
}
// wide oak floor planks
export const floorWoodTex = canvasTex(1024, 1024, (g) => {
  const rows = 8, rh = 1024 / rows;
  for (let r = 0; r < rows; r++) {
    let x = -Math.random() * 600;
    while (x < 1024) {
      const len = 500 + Math.random() * 500, s = 0.9 + Math.random() * 0.2;
      g.fillStyle = `rgb(${196 * s | 0},${154 * s | 0},${110 * s | 0})`; g.fillRect(x, r * rh, len, rh);
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = `rgba(110,70,35,${Math.random() * 0.16})`; g.lineWidth = 0.5 + Math.random() * 1.5;
        const y = r * rh + Math.random() * rh; g.beginPath(); g.moveTo(x, y);
        g.bezierCurveTo(x + len * 0.3, y + (Math.random() - 0.5) * 8, x + len * 0.7, y + (Math.random() - 0.5) * 8, x + len, y); g.stroke();
      }
      g.fillStyle = 'rgba(60,35,15,0.5)'; g.fillRect(x, r * rh, 2, rh);
      x += len;
    }
    g.fillStyle = 'rgba(60,35,15,0.4)'; g.fillRect(0, r * rh, 1024, 2);
  }
});
export const porcelainTex = marble('#ebe6de', '150,140,125', 0.12, '#cfc7ba');
export const bathTileTex = marble('#d6d4d0', '120,118,115', 0.2, '#b9b7b2');
export const terraceTex = marble('#d9d1c3', '140,125,105', 0.08, '#bdb3a2');
export const concreteTex = marble('#9a9a98', '70,70,70', 0.1);
// grey-scale bump maps
export function noiseBump(w, fn) {
  return canvasTex(w, w, (g) => {
    const im = g.createImageData(w, w);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const v = Math.max(0, Math.min(255, fn(x, y))), i = (y * w + x) * 4;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    if (CFG.noiseBlur) { g.filter = 'blur(0.9px)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none'; }   // no per-pixel noise → no sparkle while moving
  }, false);
}
export const weave = noiseBump(256, (x, y) => 128 + 45 * Math.sin(x * 0.8) * Math.cos(y * 0.8) + (Math.random() - 0.5) * 70); weave.repeat.set(6, 6);
export const pile = noiseBump(256, () => 128 + (Math.random() - 0.5) * 200); pile.repeat.set(10, 10);
export const grain = noiseBump(256, (x, y) => 128 + 30 * Math.sin((x + y) * 0.3) + (Math.random() - 0.5) * 60); grain.repeat.set(4, 4);
export const screenTex = canvasTex(512, 288, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#0b1a3a'); gr.addColorStop(0.5, '#3a1f4f'); gr.addColorStop(1, '#0a0f1f');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 60 + Math.random() * 120;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,170,120,0.35)'); rg.addColorStop(1, 'rgba(255,170,120,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }
});

// ---------------------------------------------------------------------------
// walnut veneer – used for the wall panelling AND all joinery/furniture (one wood throughout).
// 2 leaves (≈1.2 m) per repeat, cathedral figure; seams only on the wall panels.
export function walnutTex(seams) { return canvasTex(1024, 2048, (g, w, h) => {
  for (let p = 0; p < 2; p++) {
    const x0 = p * w / 2, pw = w / 2, tone = p && seams ? CFG.walnutTone[1] : CFG.walnutTone[0];
    g.fillStyle = `rgb(${tone})`; g.fillRect(x0, 0, pw, h);
    const sh = g.createLinearGradient(x0, 0, x0 + pw, 0);                  // soft tone drift across a leaf
    sh.addColorStop(0, 'rgba(40,22,10,0.10)'); sh.addColorStop(0.5, 'rgba(160,110,70,0.06)'); sh.addColorStop(1, 'rgba(40,22,10,0.10)');
    g.fillStyle = sh; g.fillRect(x0, 0, pw, h);
    for (let i = 0; i < 260; i++) {                                         // straight grain
      const sx = x0 + Math.random() * pw;
      g.strokeStyle = `rgba(${Math.random() < 0.6 ? '35,18,8' : '140,100,66'},${0.04 + Math.random() * 0.12})`;
      g.lineWidth = 0.5 + Math.random() * 2.2; g.beginPath(); let x = sx; g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) { x += (Math.random() - 0.5) * 1.4 + Math.sin(y / 230 + sx) * 0.7; g.lineTo(x, y); }
      g.stroke();
    }
    for (let k = 0; k < 3; k++) {                                           // cathedral arches
      const cx = x0 + pw * (0.25 + Math.random() * 0.5), top = h * (0.1 + Math.random() * 0.6);
      for (let j = 0; j < 14; j++) {
        g.strokeStyle = `rgba(35,18,8,${0.05 + Math.random() * 0.05})`; g.lineWidth = 1 + Math.random() * 1.5;
        const ww = 8 + j * 11; g.beginPath(); g.moveTo(cx - ww, top + 600 + j * 30);
        g.bezierCurveTo(cx - ww, top + j * 22, cx + ww, top + j * 22, cx + ww, top + 600 + j * 30); g.stroke();
      }
    }
    if (seams) { g.fillStyle = 'rgba(15,8,3,0.65)'; g.fillRect(x0, 0, 2, h); }             // seam
  }
}); }
export const panelTex = walnutTex(true), furnTex = walnutTex(false);
export const panelBump = panelTex.clone(); panelBump.colorSpace = THREE.NoColorSpace;
export const furnBump = furnTex.clone(); furnBump.colorSpace = THREE.NoColorSpace;
export const WALNUT = new THREE.MeshPhysicalMaterial({ map: furnTex, bumpMap: furnBump, bumpScale: 0.5, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.5 });

// MATERIALS
// ---------------------------------------------------------------------------
export const phys = o => new THREE.MeshPhysicalMaterial(o), std = o => new THREE.MeshStandardMaterial(o);
export const fabric = (color, bump = 1) => phys({
  color, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5),
  bumpMap: weave, bumpScale: bump,
});
export const velvet = (color, sheenCol) => phys({ color, roughness: 0.85, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(sheenCol), bumpMap: weave, bumpScale: 0.5 });
export const P = {
  freijo: WALNUT,                                   // all joinery now uses the same walnut as the panelling
  walnut: WALNUT,
  oak: phys({ map: veneer('#cfae86', '110,75,40'), roughness: 0.45, clearcoat: 0.2, clearcoatRoughness: 0.5 }),
  teak: WALNUT,
  lacquer: phys({ color: '#f1ede6', roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
  greige: phys({ color: '#cbc2b4', roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
  linen: fabric('#e6dccb'), sofa: fabric('#bcae9e', 1.4), linenGray: fabric('#b7b0a6'), outdoor: fabric('#d6ccbb'),
  sheet: fabric('#f7f5f0', 0.5), duvet: fabric('#efeae1', 0.7), towel: fabric('#f1ece3', 2.5), sage: fabric('#9aa889'),
  taupe: velvet('#8a786a', '#d2bfae'), terracottaV: velvet('#a85a3f', '#e09a7a'),
  leather: phys({ color: '#9c4f35', roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.6, bumpMap: grain, bumpScale: 0.4 }),
  rug: phys({ color: '#d8cfbf', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.8, bumpMap: pile, bumpScale: 2 }),
  rugGray: phys({ color: '#9c9fa1', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#dddddd'), sheenRoughness: 0.8, bumpMap: pile, bumpScale: 2 }),
  marble: phys({ map: marble('#efebe4', '120,110,100'), roughness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.08 }),
  granite: phys({ map: marble('#e2d8c8', '140,120,95', 0.45), roughness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.12 }),
  brushed: std({ color: '#cfd2d6', metalness: 1, roughness: 0.3 }),
  steelDark: std({ color: '#7d8084', metalness: 1, roughness: 0.38 }),
  brass: std({ color: '#c8a26a', metalness: 1, roughness: 0.25 }),
  black: std({ color: '#1c1c1e', metalness: 0.7, roughness: 0.42 }),
  blackGlass: phys({ color: '#060607', roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 }),
  screen: phys({ color: '#020203', roughness: 0.06, metalness: 0.2, clearcoat: 1, emissive: '#ffffff', emissiveMap: screenTex, emissiveIntensity: 0.5 }),
  ceramic: phys({ color: '#fbfbfa', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04 }),
  sand: phys({ color: '#d9cdb8', roughness: 0.3, clearcoat: 0.6 }),
  terracotta: std({ color: '#b46f55', roughness: 0.85 }),
  concrete: std({ color: '#8e8a84', roughness: 0.9 }),
  soil: std({ color: '#3a2a1e', roughness: 1 }),
  leaf: std({ color: '#3d6a33', roughness: 0.55, side: THREE.DoubleSide }),
  leaf2: std({ color: '#5a8442', roughness: 0.55, side: THREE.DoubleSide }),
  succA: std({ color: '#7f9e7a', roughness: 0.5, side: THREE.DoubleSide }),
  succB: std({ color: '#93a888', roughness: 0.5, side: THREE.DoubleSide }),
  moss: std({ color: '#55703f', roughness: 1 }),
  shade: std({ color: '#f2e8d6', emissive: '#ffcf9a', emissiveIntensity: 0.6, roughness: 0.95, side: THREE.DoubleSide }),
  led: std({ color: '#ffffff', emissive: '#ffe1b8', emissiveIntensity: 3 }),
  mirror: std({ color: '#ffffff', metalness: 1, roughness: 0.02 }),
  sheer: std({ color: '#f5f1ea', roughness: 1, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
  drape: phys({ color: '#d9cdbb', roughness: 0.95, sheen: 0.8, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, bumpMap: weave, bumpScale: 0.6 }),
  books: ['#7b8a7a', '#c9b79c', '#2f3b4a', '#a85a3f', '#e7e1d6'].map(c => std({ color: c, roughness: 0.8 })),
  // remodel palette (reference: dark wood-panelled living room with LED coves)
  rust: fabric('#b4623c', 1.6),
  taupeLac: phys({ color: '#8d7f74', roughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
  taupeDark: std({ color: '#5e534b', roughness: 0.8 }),
  tvPanel: phys({ color: '#050506', roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
  tintGlass: phys({ color: '#3a3330', roughness: 0.04, transparent: true, opacity: 0.28, clearcoat: 1, depthWrite: false }),
  budGreen: std({ color: '#9bb46a', roughness: 0.5 }), budWhite: std({ color: '#f1efe4', roughness: 0.5 }),
  bench: fabric('#d8d0c4', 1.8),
  whiteLac: phys({ color: '#f3f1ed', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  darkChain: phys({ map: veneer('#4a3226', '20,10,4'), roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  cove: std({ color: '#ffffff', emissive: '#ffcf96', emissiveIntensity: 1.6 }),
  stemGreen: std({ color: '#4f7a3a', roughness: 0.6 }),
  glassBottle: phys({ color: '#3d2a14', roughness: 0.08, clearcoat: 1 }),
  clearGlass: phys({ color: '#e8eef0', roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false }),
};
// architecture
export const M = {
  wall: std({ color: '#ece6dc', roughness: 0.92 }),
  extWall: std({ color: '#6b6f78', roughness: 0.9 }),
  ceiling: std({ color: '#fbfbf8', roughness: 0.95 }),
  glass: std({ color: '#cfe8ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.1, depthWrite: false }),
  frame: std({ color: '#2b2e33', roughness: 0.45, metalness: 0.6 }),
  skirt: std({ color: '#ffffff', roughness: 0.4 }),
  steel: std({ color: '#c8ccd0', roughness: 0.3, metalness: 0.9 }),
  ground: std({ color: '#6f7d62', roughness: 1 }),
  building: std({ color: '#b9bcc2', roughness: 0.9 }),
};

// ---------------------------------------------------------------------------
// GEOMETRY HELPERS
// ---------------------------------------------------------------------------
export const colliders = [];       // {x0,x1,z0,z1} in metres
export const planLines = { walls: [], glass: [] };   // [x0,z0,x1,z1] in metres: full-height wall pieces + window panes (home page's line plan, tools/bake_pano.mjs)
export const world = new THREE.Group(); scene.add(world);
export const ceilingGroup = new THREE.Group(); world.add(ceilingGroup);

// axis-aligned box in plan pixels (architecture)
export function box(ax, az, bx, bz, yb, yt, mat, opts = {}) {
  const x0 = X(Math.min(ax, bx)), x1 = X(Math.max(ax, bx));
  const z0 = Z(Math.min(az, bz)), z1 = Z(Math.max(az, bz));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, yt - yb, z1 - z0), mat);
  mesh.position.set((x0 + x1) / 2, (yb + yt) / 2, (z0 + z1) / 2);
  mesh.castShadow = opts.cast ?? mat !== M.glass;
  mesh.receiveShadow = true;
  (opts.parent ?? world).add(mesh);
  const collide = opts.collide ?? (yb < 1.2 && yt > 0.2);
  if (collide) colliders.push({ x0, x1, z0, z1 });
  if (mat === M.wall && yb <= 0.01 && yt >= H - 0.01 && (opts.parent ?? world) === world) planLines.walls.push([x0, z0, x1, z1]);   // shafts, partitions
  return mesh;
}

// Wall with openings. openings: {from,to (px along wall), sill, top, glass:'window'|'fixed'}
export function wall(ax, az, bx, bz, openings = [], mat = M.wall, h = H) {
  const horiz = Math.abs(bx - ax) >= Math.abs(bz - az);
  const s0 = horiz ? Math.min(ax, bx) : Math.min(az, bz);
  const s1 = horiz ? Math.max(ax, bx) : Math.max(az, bz);
  const lo = horiz ? Math.min(az, bz) : Math.min(ax, bx), hi = horiz ? Math.max(az, bz) : Math.max(ax, bx);
  const seg = (p0, p1, yb, yt, m = mat, o = {}) =>
    horiz ? box(p0, az, p1, bz, yb, yt, m, o) : box(ax, p0, bx, p1, yb, yt, m, o);
  const across = (p0, p1, c0, c1, yb, yt, m, o) => horiz ? box(p0, c0, p1, c1, yb, yt, m, o) : box(c0, p0, c1, p1, yb, yt, m, o);
  const pane = (p0, p1, yb, yt, collide) => { const c = (lo + hi) / 2; across(p0, p1, c - 0.8, c + 0.8, yb, yt, M.glass, { collide, cast: false }); };
  // skirting stops 0.05 px (≈ 0.5 mm) short of each end: flush with the jamb it shared that plane and flickered
  const skirt = (p0, p1) => { if (mat === M.wall) across(p0 + 0.05, p1 - 0.05, lo - 0.9, hi + 0.9, 0, 0.07, M.skirt, { collide: false, cast: false }); };
  const trims = (p0, p1, top) => {            // door casings on both faces
    if (mat !== M.wall) return;
    for (const [c0, c1] of [[lo - 1.3, lo], [hi, hi + 1.3]]) {
      across(p0 - 6, p0, c0, c1, 0, top + 0.07, P.walnut, { collide: false, cast: false });
      across(p1, p1 + 6, c0, c1, 0, top + 0.07, P.walnut, { collide: false, cast: false });
      across(p0 - 6, p1 + 6, c0, c1, top, top + 0.07, P.walnut, { collide: false, cast: false });
    }
  };
  const rec = (list, p0, p1) => { const r = horiz ? [p0, az, p1, bz] : [ax, p0, bx, p1];
    list.push([X(Math.min(r[0], r[2])), Z(Math.min(r[1], r[3])), X(Math.max(r[0], r[2])), Z(Math.max(r[1], r[3]))]); };
  const solid = (p0, p1) => { seg(p0, p1, 0, h); skirt(p0, p1); if (mat !== M.wall) rec(planLines.walls, p0, p1); };   // M.wall pieces are logged by box()
  let cur = s0;
  for (const o of [...openings].sort((a, b) => a.from - b.from)) {
    if (o.from > cur) solid(cur, o.from);
    const top = o.top ?? 2.1, sill = o.sill ?? 0;
    if (sill > 0) { seg(o.from, o.to, 0, sill); skirt(o.from, o.to); }
    if (top < h) seg(o.from, o.to, top, h, mat, { collide: false });
    if (o.glass === 'open') { /* open sliding leaf – nothing in the opening */ }
    else if (o.glass) {
      rec(planLines.glass, o.from, o.to);
      pane(o.from, o.to, sill, top, o.glass === 'fixed');
      if (sill > 0) seg(o.from, o.to, sill, sill + 0.04, M.frame, { collide: false });
      seg(o.from, o.to, top - 0.04, top, M.frame, { collide: false });
    } else if (sill === 0) trims(o.from, o.to, top);
    cur = Math.max(cur, o.to);
  }
  if (cur < s1) solid(cur, s1);
}
export function railing(ax, az, bx, bz) {
  const c = (az + bz) / 2;
  box(ax, c - 1, bx, c + 1, 0, 1.1, M.glass, { collide: true, cast: false });
  box(ax, c - 2, bx, c + 2, 1.1, 1.15, M.steel, { collide: false });
}
export function floor(ax, az, bx, bz, tex, tile, rough, y = 0.001) {
  const w = X(bx) - X(ax), d = Z(bz) - Z(az);
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / tile, d / tile);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), phys({ map: t, roughness: rough, clearcoat: rough < 0.3 ? 0.4 : 0, clearcoatRoughness: 0.2,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -Math.round(y * 2000) }));   // higher layer wins, no z-fighting
  m.rotation.x = -Math.PI / 2; m.position.set(X(ax) + w / 2, y, Z(az) + d / 2);
  m.receiveShadow = true; m.material.userData.glossFloor = rough < 0.3; world.add(m);   // on the material: it survives mergeStatic (Ultra's screen-space reflections)
}

// ---------- furniture kit (local metres; footprint centred on origin, FRONT faces +z) ----------
export const RBG = (w, h, d, r = 0.012, s = 4) => new RoundedBoxGeometry(w, h, d, s, Math.max(0.0005, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)));
export function mesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
// rounded box placed by its bottom-centre
export const rb = (p, w, h, d, mat, x = 0, y = 0, z = 0, r = 0.012, rx = 0, ry = 0, rz = 0) => mesh(p, RBG(w, h, d, r), mat, x, y + h / 2, z, rx, ry, rz);
export const cylinder = (p, rt, rbt, h, mat, x = 0, y = 0, z = 0, seg = 32) => mesh(p, new THREE.CylinderGeometry(rt, rbt, h, seg), mat, x, y + h / 2, z);
export const lathe = (p, pts, mat, x = 0, y = 0, z = 0, seg = 48) => mesh(p, new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), mat, x, y, z);
export const FACE = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
// build an item to fit a plan rectangle (px). face = direction its front points to.
export function item(builder, ax, az, bx, bz, face = 's', collide = true, ...args) {
  const dx = Math.abs(X(bx) - X(ax)), dz = Math.abs(Z(bz) - Z(az));
  const [w, d] = face === 's' || face === 'n' ? [dx, dz] : [dz, dx];
  const g = builder(w, d, ...args);
  g.position.set((X(ax) + X(bx)) / 2, 0, (Z(az) + Z(bz)) / 2); g.rotation.y = FACE[face];
  world.add(g);
  if (collide) colliders.push({ x0: X(Math.min(ax, bx)), x1: X(Math.max(ax, bx)), z0: Z(Math.min(az, bz)), z1: Z(Math.max(az, bz)) });
  return g;
}
export function at(builder, px, pz, rotY = 0, ...args) {
  const g = builder(...args); g.position.set(X(px), 0, Z(pz)); g.rotation.y = rotY; world.add(g); return g;
}
export const roomLights = [];
export function addLight(l) { l.userData.d = l.distance; roomLights.push(l); return l; }

// ---- builders ----
// floor-to-ceiling wardrobe: lacquer carcass, ribbed walnut doors (shadow gaps, black finger
// grooves between pairs, slim brass pulls), plain walnut top-box doors above a shadow line
export function wardrobeB(w, d, h = H - 0.004, doorMat = P.freijo) {
  const g = new THREE.Group(), base = 0.08, split = 2.2, fz = d / 2 - 0.012;
  rb(g, w, h - base, d - 0.025, P.lacquer, 0, base, -0.0125, 0.004);
  rb(g, w - 0.04, base, d - 0.08, P.black, 0, 0, -0.04, 0.002);
  const n = Math.max(1, Math.round(w / 0.5)), dw = w / n, ribs = [];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + dw * (i + 0.5);
    rb(g, dw - 0.006, split - base - 0.004, 0.02, doorMat, x, base + 0.002, fz, 0.003);          // lower door
    rb(g, dw - 0.006, h - split - 0.014, 0.02, doorMat, x, split + 0.01, fz, 0.003);              // top-box door
    for (let rx = x - dw / 2 + 0.024; rx < x + dw / 2 - 0.02; rx += 0.03) ribs.push(rx);
    if (i % 2 === 1 || n === 1) {                                                                // pair edge: groove + pulls
      const ex = n === 1 ? x + dw / 2 - 0.03 : x - dw / 2;
      rb(g, 0.014, split - base - 0.06, 0.006, P.black, ex, base + 0.03, d / 2 + 0.006, 0.002);
      for (const s of n === 1 ? [0] : [-1, 1]) cylinder(g, 0.006, 0.006, 0.5, P.brass, ex + s * 0.022, 0.8, d / 2 + 0.022, 12);
    }
  }
  const rh = split - base - 0.06, im = new THREE.InstancedMesh(RBG(0.018, rh, 0.012, 0.005), doorMat, ribs.length), m4 = new THREE.Matrix4();
  ribs.forEach((rx, i) => im.setMatrixAt(i, m4.makeTranslation(rx, base + 0.03 + rh / 2, d / 2 + 0.004)));
  im.castShadow = im.receiveShadow = true; g.add(im);
  return g;
}
// puffy pillow / cushion: thick in the middle, pinched at the seams
export function pillowGeo(w, h, t) {
  const geo = new THREE.BoxGeometry(w, h, t, 14, 10, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (w / 2), v = p.getY(i) / (h / 2), f = Math.sqrt(Math.max(0, (1 - u ** 4) * (1 - v ** 4)));
    p.setZ(i, p.getZ(i) * (0.12 + 0.88 * f));
    p.setX(i, p.getX(i) * (1 - 0.05 * v * v)); p.setY(i, p.getY(i) * (1 - 0.07 * u * u));
  }
  geo.computeVertexNormals(); return geo;
}
// bed: walnut-framed headboard with an upholstered channel cushion, upholstered base on a recessed
// plinth, fitted mattress, duvet that drapes over the sides, knit throw over the foot, puffy pillows
export function bedB(w, d, o = {}) {
  const g = new THREE.Group(), headH = o.headH ?? 1.1, zb = -d / 2, hb = 0.08;
  rb(g, w, headH, 0.035, P.walnut, 0, 0, zb + 0.0175, 0.006);                                     // walnut frame / back
  const cw0 = w - 0.07, n = Math.max(3, Math.round(cw0 / 0.16)), cw = cw0 / n, ch = headH - 0.33;
  for (let i = 0; i < n; i++) rb(g, cw - 0.005, ch, hb - 0.035, o.head ?? P.taupe, -cw0 / 2 + cw * (i + 0.5), 0.3, zb + 0.035 + (hb - 0.035) / 2, Math.min(0.03, cw / 2 - 0.004));
  const bw = w - 0.03, bd = d - hb - 0.01, bz = zb + hb + 0.01 + bd / 2;
  rb(g, bw - 0.14, 0.07, bd - 0.14, P.black, 0, 0, bz, 0.005);                                    // recessed plinth (floats)
  rb(g, bw, 0.22, bd, o.base ?? P.linenGray, 0, 0.07, bz, 0.03);                                   // upholstered base
  const mw = bw - 0.04, md = bd - 0.04;
  rb(g, mw, 0.2, md, P.sheet, 0, 0.29, bz, 0.05);                                                   // mattress + fitted sheet
  const dd = md * 0.72, dz = bz + md / 2 - dd / 2 + 0.015, duv = o.duvet ?? P.duvet, top = 0.55;
  rb(g, mw + 0.06, 0.06, dd, duv, 0, top - 0.06, dz, 0.03);                                        // duvet top
  for (const s of [-1, 1]) rb(g, 0.03, 0.27, dd - 0.02, duv, s * (mw / 2 + 0.03), top - 0.29, dz, 0.014); // drops over the sides
  rb(g, mw + 0.09, 0.27, 0.03, duv, 0, top - 0.29, dz + dd / 2 + 0.005, 0.014);                     // drop over the foot
  rb(g, mw + 0.08, 0.075, 0.17, duv, 0, top - 0.035, dz - dd / 2 + 0.085, 0.037);                  // turned-down fold
  const tw = o.single ? mw + 0.1 : mw * 0.9, tz = dz + dd / 2 - 0.25;
  rb(g, tw, 0.022, 0.5, o.throw ?? P.taupe, 0, top, tz, 0.01);                                     // knit throw over the foot
  if (o.single) for (const s of [-1, 1]) rb(g, 0.02, 0.2, 0.48, o.throw ?? P.taupe, s * (tw / 2 + 0.005), top - 0.18, tz, 0.008);
  const np = o.single ? 1 : 2, pw = o.single ? Math.min(0.62, mw - 0.12) : (mw - 0.08) / 2, pz = zb + hb + 0.13;
  for (let i = 0; i < np; i++) {
    const x = np === 1 ? 0 : (i ? 1 : -1) * (pw / 2 + 0.02);
    mesh(g, pillowGeo(pw, 0.5, 0.18), P.sheet, x, top + 0.17, pz, -0.32);                           // euro sham / sleeping pillow
    mesh(g, pillowGeo(pw * 0.92, 0.38, 0.16), o.cushion ?? P.linen, x, top + 0.14, pz + 0.14, -0.28);
  }
  if (!o.single) for (const s of [-1, 1]) mesh(g, pillowGeo(0.42, 0.42, 0.15), o.accent ?? P.taupe, s * 0.24, top + 0.13, pz + 0.27, -0.24, 0, s * 0.06);
  if (o.lumbar !== false) mesh(g, pillowGeo(0.48, 0.3, 0.14), o.accent ?? P.taupe, 0, top + 0.1, pz + (o.single ? 0.27 : 0.35), -0.22);  // lumbar cushion (middle; lumbar: false leaves it out)
  return g;
}
export function drumB(w, d, h = 0.55, mat = P.walnut) {
  const g = new THREE.Group(), r = Math.min(w, d) / 2;
  lathe(g, [[0, 0], [r - 0.01, 0], [r, 0.01], [r, h - 0.012], [r - 0.012, h], [0, h]], mat);
  return g;
}
export function floatStandB(w, d, h = 0.55) {               // wall-hung walnut nightstand, drawer reveal, LED underneath
  const g = new THREE.Group(), bh = 0.2;
  rb(g, w, bh, d, P.walnut, 0, h - bh, 0, 0.01);
  rb(g, w - 0.03, 0.005, 0.004, P.black, 0, h - 0.1, d / 2 + 0.001, 0.001);
  mesh(g, new THREE.SphereGeometry(0.012, 12, 8), P.brass, 0, h - 0.06, d / 2 + 0.01);
  rb(g, w - 0.06, 0.005, d - 0.1, P.led, 0, h - bh - 0.006, -0.02, 0.002);
  return g;
}
export function tableLamp(x, y, z) {
  const g = new THREE.Group();
  lathe(g, [[0, 0], [0.07, 0], [0.085, 0.06], [0.07, 0.16], [0.035, 0.24], [0.02, 0.28], [0, 0.28]], P.sand);
  cylinder(g, 0.006, 0.006, 0.07, P.brass, 0, 0.28, 0, 8);
  lathe(g, [[0.14, 0.3], [0.105, 0.52]], P.shade);
  mesh(g, new THREE.SphereGeometry(0.025, 16, 12), P.led, 0, 0.37, 0, 0, 0, 0, false);
  const l = addLight(new THREE.PointLight('#ffc98a', 1.0, 3, 2)); l.position.set(0, 0.4, 0); g.add(l);
  g.position.set(x, y, z); world.add(g);
}
export function sofaB(w, d, mat = P.sofa) {
  const g = new THREE.Group(), aw = 0.17, sw = w - 2 * aw;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(g, 0.018, 0.012, 0.1, P.walnut, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08), 12);
  rb(g, w, 0.2, d, mat, 0, 0.1, 0, 0.03);                                             // base
  for (const s of [-1, 1]) rb(g, aw, 0.52, d, mat, s * (w / 2 - aw / 2), 0.1, 0, 0.07); // arms
  rb(g, sw, 0.52, 0.18, mat, 0, 0.3, -d / 2 + 0.09, 0.05);                            // back frame
  const n = sw > 1.7 ? 2 : 1, cw = sw / n;
  for (let i = 0; i < n; i++) {
    const x = -sw / 2 + cw * (i + 0.5);
    rb(g, cw - 0.012, 0.14, d - 0.2, mat, x, 0.3, 0.09, 0.06);                        // seat cushion (top 0.44 m)
    rb(g, cw - 0.02, 0.44, 0.17, mat, x, 0.42, -d / 2 + 0.26, 0.07, -0.17);           // back cushion
  }
  rb(g, 0.44, 0.44, 0.13, P.terracottaV, -sw / 2 + 0.3, 0.42, -d / 2 + 0.4, 0.06, -0.25, 0.25);
  rb(g, 0.42, 0.42, 0.13, P.taupe, sw / 2 - 0.3, 0.42, -d / 2 + 0.4, 0.06, -0.25, -0.2);
  rb(g, 0.55, 0.02, 0.5, P.drape, sw / 2 - 0.35, 0.44, 0.05, 0.01);                   // folded throw
  return g;
}
export function slats(g, count, step, sw, sh, sd, mat, x0, y0, z0, alongX = true) {
  const im = new THREE.InstancedMesh(RBG(sw, sh, sd, 0.003), mat, count), m4 = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m4.makeTranslation(alongX ? x0 + i * step : x0, y0 + sh / 2, alongX ? z0 : z0 + i * step);
    im.setMatrixAt(i, m4);
  }
  im.castShadow = im.receiveShadow = true; g.add(im); return im;
}
export function vase(g, x, y, z, s = 1, mat = P.sand) {
  lathe(g, [[0, 0], [0.05 * s, 0], [0.09 * s, 0.08 * s], [0.08 * s, 0.2 * s], [0.035 * s, 0.28 * s], [0.04 * s, 0.32 * s], [0, 0.3 * s]], mat, x, y, z);
}
export function books(g, x, y, z, n = 4, ry = 0) {
  let yy = y;
  for (let i = 0; i < n; i++) { const h = 0.025 + Math.random() * 0.02; rb(g, 0.22 - i * 0.012, h, 0.16 - i * 0.008, P.books[i % P.books.length], x, yy, z, 0.003, 0, ry + (Math.random() - 0.5) * 0.3); yy += h; }
}
export function sideboardB(w, d, h = 0.75) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(g, 0.014, 0.014, 0.15, P.black, sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), 10);
  rb(g, w, h - 0.15, d - 0.012, P.walnut, 0, 0.15, -0.006, 0.006);
  const n = Math.floor((w - 0.04) / 0.032);
  slats(g, n, 0.032, 0.02, h - 0.19, 0.012, P.walnut, -w / 2 + 0.02 + 0.016, 0.17, d / 2 - 0.006);
  vase(g, -w / 2 + 0.25, h, 0, 1.1); vase(g, -w / 2 + 0.42, h, 0.02, 0.7, P.terracotta);
  books(g, w / 2 - 0.3, h, 0, 3, 0.2);
  return g;
}
export function sideTableB(w, d) {
  const g = new THREE.Group(), r = Math.min(w, d) / 2;
  cylinder(g, 0.13, 0.14, 0.015, P.black, 0, 0, 0);
  cylinder(g, 0.018, 0.018, 0.46, P.black, 0, 0.015, 0, 12);
  lathe(g, [[0, 0], [r - 0.008, 0], [r, 0.008], [r, 0.022], [r - 0.008, 0.03], [0, 0.03]], P.marble, 0, 0.47, 0);
  vase(g, 0.04, 0.5, 0, 0.6, P.ceramic);
  return g;
}
export function banquetteB(w, d) {
  const g = new THREE.Group();
  // simple built-in oak bench with a seat cushion and a slim upholstered back panel (as on the plan)
  rb(g, w, 0.05, d - 0.06, P.black, 0, 0, -0.01, 0.003);                              // recessed plinth
  rb(g, w, 0.35, d - 0.02, P.oak, 0, 0.05, 0.01, 0.006);                               // oak box (top 0.40)
  rb(g, w - 0.08, 0.06, d - 0.08, P.linen, 0, 0.40, 0.03, 0.025);                      // seat cushion (0.46)
  rb(g, w - 0.08, 0.36, 0.05, P.linen, 0, 0.5, -d / 2 + 0.03, 0.02);                   // back panel on the wall
  return g;
}
// small round tub dining chair on slim legs (plan: round terracotta chairs)
export function tubChairB(mat = P.leather) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    mesh(g, new THREE.CylinderGeometry(0.012, 0.009, 0.42, 10), P.black, Math.cos(a) * 0.17, 0.21, Math.sin(a) * 0.17, Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08);
  }
  lathe(g, [[0, 0], [0.2, 0], [0.225, 0.025], [0.225, 0.05], [0.2, 0.07], [0, 0.07]], mat, 0, 0.4, 0);  // seat (top 0.47)
  mesh(g, new THREE.TorusGeometry(0.2, 0.035, 12, 40, Math.PI * 1.15), mat, 0, 0.55, 0, -Math.PI / 2, 0, -0.075 * Math.PI); // curved back rest
  const shell = mat.clone(); shell.side = THREE.DoubleSide;
  mesh(g, new THREE.CylinderGeometry(0.2, 0.2, 0.12, 40, 1, true, Math.PI * 0.425, Math.PI * 1.15), shell, 0, 0.49, 0); // back shell
  return g;
}
export function chairB(mat = P.leather, legMat = P.walnut) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.014, 0.01, 0.42, 12), legMat, sx * 0.18, 0.21, sz * 0.17, sz * 0.05, 0, -sx * 0.05);
  rb(g, 0.47, 0.06, 0.46, mat, 0, 0.4, 0.01, 0.028);                                  // seat (top 0.46)
  rb(g, 0.45, 0.38, 0.05, mat, 0, 0.5, -0.21, 0.024, -0.12);                         // back
  return g;
}
// swivel desk chair: 5-star base on castors, gas column, upholstered seat, curved upholstered back, front +z
export function roundChairB(mat = P.linenGray) {
  const g = new THREE.Group(), shell = mat.clone(); shell.side = THREE.DoubleSide;
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5, arm = new THREE.Group(); arm.rotation.y = a; g.add(arm);
    rb(arm, 0.035, 0.025, 0.3, P.black, 0, 0.06, 0.15, 0.008, 0.08);
    mesh(arm, new THREE.SphereGeometry(0.025, 14, 10), P.black, 0, 0.025, 0.29);                 // castor
  }
  cylinder(g, 0.035, 0.04, 0.06, P.black, 0, 0.05, 0, 20);
  cylinder(g, 0.022, 0.022, 0.26, P.brushed, 0, 0.1, 0, 16);                                       // gas lift
  rb(g, 0.2, 0.03, 0.2, P.black, 0, 0.36, 0, 0.008);                                               // mechanism
  rb(g, 0.47, 0.075, 0.45, mat, 0, 0.39, 0.02, 0.035);                                             // seat cushion
  rb(g, 0.04, 0.32, 0.03, P.black, 0, 0.42, -0.215, 0.01, -0.12);                                   // back spine
  mesh(g, new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32, 1, true, Math.PI - 0.72, 1.44), shell, 0, 0.74, 0.04, -0.1);  // curved back
  for (const s of [-1, 1]) {                                                                         // armrests
    rb(g, 0.025, 0.2, 0.025, P.black, s * 0.235, 0.44, -0.02, 0.008);
    rb(g, 0.05, 0.025, 0.24, P.black, s * 0.235, 0.64, 0.02, 0.012);
  }
  return g;
}
// desk lamp: round base, two-piece black arm, brass knuckle, cone shade lit inside
export function deskLamp(g, x, y, z, ry = 0) {
  const l = new THREE.Group(); l.position.set(x, y, z); l.rotation.y = ry; g.add(l);
  cylinder(l, 0.075, 0.08, 0.02, P.black, 0, 0, 0, 28);
  mesh(l, new THREE.CylinderGeometry(0.008, 0.008, 0.36, 10), P.black, 0, 0.19, -0.03, -0.18);
  mesh(l, new THREE.SphereGeometry(0.014, 12, 8), P.brass, 0, 0.36, -0.06);
  mesh(l, new THREE.CylinderGeometry(0.008, 0.008, 0.3, 10), P.black, 0, 0.42, 0.06, 1.05);
  const sh = new THREE.Group(); sh.position.set(0, 0.49, 0.2); sh.rotation.x = 0.55; l.add(sh);
  mesh(sh, new THREE.CylinderGeometry(0.03, 0.075, 0.12, 28, 1, true), P.black.clone(), 0, 0, 0).material.side = THREE.DoubleSide;
  mesh(sh, new THREE.CircleGeometry(0.07, 24), P.led, 0, -0.045, 0, Math.PI / 2, 0, 0, false);
}
// desk: walnut top on a black sled leg (local +x) and a 3-drawer walnut pedestal (local -x);
// laptop, lamp, pen pot; optional floating shelf on the wall above
export function deskB(w, d, o = {}) {
  const g = new THREE.Group(), top = 0.72, pw = Math.min(0.4, w * 0.33), px = -w / 2 + pw / 2 + 0.01;
  rb(g, w, 0.03, d, P.walnut, 0, top, 0, 0.006);
  const lx = w / 2 - 0.04;                                                                           // sled leg
  for (const z of [-1, 1]) rb(g, 0.03, top, 0.03, P.black, lx, 0, z * (d / 2 - 0.05), 0.006);
  rb(g, 0.03, 0.03, d - 0.07, P.black, lx, 0, 0, 0.006); rb(g, 0.03, 0.03, d - 0.07, P.black, lx, top - 0.03, 0, 0.006);
  rb(g, w - pw - 0.08, 0.06, 0.02, P.walnut, (px + pw / 2 + lx) / 2, top - 0.06, -d / 2 + 0.03, 0.004);  // modesty rail
  rb(g, pw, top - 0.02, d - 0.04, P.walnut, px, 0.0, -0.01, 0.006);                                  // pedestal
  for (const [y0, h] of [[0.04, 0.26], [0.32, 0.17], [0.51, 0.17]]) {
    rb(g, pw - 0.02, h - 0.008, 0.012, P.walnut, px, y0, d / 2 - 0.025, 0.003);
    rb(g, 0.1, 0.012, 0.016, P.brass, px, y0 + h - 0.045, d / 2 - 0.012, 0.004);
  }
  const lap = new THREE.Group(); lap.position.set(o.laptopX ?? 0.08, top + 0.03, 0.02); lap.rotation.y = -0.12; g.add(lap);
  rb(lap, 0.32, 0.012, 0.22, P.brushed, 0, 0, 0.03, 0.004);
  rb(lap, 0.32, 0.21, 0.006, P.brushed, 0, 0.004, -0.08, 0.003, -0.28);
  mesh(lap, new THREE.PlaneGeometry(0.3, 0.19), P.screen, 0, 0.11, -0.077, -0.28, 0, 0, false);
  deskLamp(g, w / 2 - 0.13, top + 0.03, -d / 2 + 0.12, -0.5);
  const ppx = px + pw / 2 - 0.07, ppz = -d / 2 + 0.08;                                               // pen pot on the pedestal end
  cylinder(g, 0.035, 0.035, 0.1, P.ceramic, ppx, top + 0.03, ppz, 20);
  for (let i = 0; i < 4; i++) mesh(g, new THREE.CylinderGeometry(0.004, 0.004, 0.15, 6), P.books[i], ppx + (i - 1.5) * 0.012, top + 0.1, ppz + (i % 2) * 0.01, 0, 0, (i - 1.5) * 0.08);
  books(g, px - 0.04, top + 0.03, 0.04, 2, 0.2);
  if (o.shelf) {                                                                                     // floating wall shelf
    const sy = o.shelfY ?? 1.42, sw = w * 0.85, sz = -d / 2 + 0.12;
    rb(g, sw, 0.035, 0.24, P.walnut, 0, sy, sz, 0.006);
    rb(g, sw - 0.06, 0.006, 0.01, P.led, 0, sy - 0.006, sz + 0.07, 0.002);
    let bx = -sw / 2 + 0.06;
    for (let i = 0; i < 9; i++) {                                                                    // standing books
      const bh = 0.17 + Math.random() * 0.08, bt = 0.022 + Math.random() * 0.018;
      rb(g, bt, bh, 0.15 + Math.random() * 0.04, P.books[i % P.books.length], bx + bt / 2, sy + 0.035, sz - 0.02, 0.002, 0, 0, i === 8 ? -0.25 : 0);
      bx += bt + 0.003;
    }
    vase(g, sw / 2 - 0.12, sy + 0.035, sz, 0.75, P.ceramic);
    const pl = plantB(0, 0, 0.3, P.sand); pl.position.set(0.05, sy + 0.035, sz); g.add(pl);
  }
  return g;
}
// bedside chest: walnut body on slim black legs, two ribbed drawer fronts, brass knobs
export function chestB(w, d, h = 0.5) {
  const g = new THREE.Group(), leg = 0.14, fz = d / 2 - 0.01;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.012, 0.008, leg, 10), P.black, sx * (w / 2 - 0.05), leg / 2, sz * (d / 2 - 0.05));
  rb(g, w, h - leg, d - 0.02, P.walnut, 0, leg, -0.01, 0.01);
  const dh = (h - leg - 0.03) / 2;
  for (let i = 0; i < 2; i++) {
    const y0 = leg + 0.012 + i * (dh + 0.006);
    rb(g, w - 0.03, dh, 0.012, P.walnut, 0, y0, fz, 0.003);
    slats(g, Math.floor((w - 0.06) / 0.022), 0.022, 0.014, dh - 0.02, 0.008, P.walnut, -w / 2 + 0.04, y0 + 0.01, fz + 0.008);
    mesh(g, new THREE.SphereGeometry(0.014, 14, 10), P.brass, 0, y0 + dh / 2, fz + 0.022);
  }
  books(g, -w / 4, h, 0, 2, 0.3);
  vase(g, w / 4, h, 0, 0.6, P.ceramic);
  return g;
}
export function tallUnitB(w, d) {
  const g = new THREE.Group(), h = 2.3, fz = d / 2 - 0.01, cw = 0.62;
  rb(g, w, h - 0.08, d - 0.02, P.lacquer, 0, 0.08, -0.01, 0.004);
  rb(g, w - 0.04, 0.08, d - 0.08, P.black, 0, 0, -0.04, 0.002);
  const ax = -w / 2 + cw / 2;                                                           // appliance column
  rb(g, cw - 0.004, 0.76, 0.02, P.freijo, ax, 0.085, fz, 0.003);
  rb(g, cw - 0.02, 0.6, 0.025, P.blackGlass, ax, 0.86, fz, 0.004);                    // oven
  cylinder(g, 0.008, 0.008, cw - 0.12, P.brushed, ax, 0, 0, 12).position.set(ax, 1.4, fz + 0.035);
  g.children[g.children.length - 1].rotation.z = Math.PI / 2;
  rb(g, cw - 0.02, 0.38, 0.025, P.blackGlass, ax, 1.48, fz, 0.004);                   // microwave
  rb(g, cw - 0.004, 0.4, 0.02, P.freijo, ax, 1.88, fz, 0.003);
  const ox = cw / 2, ow = w - cw;                                                       // pantry column + niche
  rb(g, ow - 0.004, 0.84, 0.02, P.freijo, ox, 0.085, fz, 0.003);
  rb(g, ow - 0.02, 0.6, 0.01, P.walnut, ox, 0.93, -d / 2 + 0.03, 0.002);              // niche back
  rb(g, ow - 0.02, 0.02, d - 0.05, P.walnut, ox, 1.22, 0, 0.003);                     // niche shelf
  for (let i = 0; i < 4; i++) lathe(g, [[0, 0], [0.035, 0], [0.035, 0.12], [0.03, 0.13], [0, 0.13]], i % 2 ? P.ceramic : P.sand, ox - 0.3 + i * 0.18, 0.93, 0);
  for (let i = 0; i < 3; i++) lathe(g, [[0, 0], [0.04, 0], [0.04, 0.16], [0, 0.17]], M.glass, ox - 0.25 + i * 0.22, 1.24, 0);
  rb(g, ow - 0.004, 0.76, 0.02, P.freijo, ox, 1.53, fz, 0.003);
  return g;
}
export function fridgeB(w, d) {
  const g = new THREE.Group(), h = 1.85;
  rb(g, w, h, d - 0.05, P.brushed, 0, 0, -0.025, 0.02);
  rb(g, w / 2 - 0.004, 1.08, 0.05, P.brushed, -w / 4, 0.75, d / 2 - 0.05, 0.015);
  rb(g, w / 2 - 0.004, 1.08, 0.05, P.brushed, w / 4, 0.75, d / 2 - 0.05, 0.015);
  rb(g, w - 0.004, 0.68, 0.05, P.brushed, 0, 0.05, d / 2 - 0.05, 0.015);
  for (const s of [-1, 1]) cylinder(g, 0.012, 0.012, 0.75, P.steelDark, s * 0.035, 0.95, d / 2 + 0.02, 12);
  mesh(g, new THREE.CylinderGeometry(0.012, 0.012, w - 0.2, 12), P.steelDark, 0, 0.66, d / 2 + 0.02, 0, 0, Math.PI / 2);
  return g;
}
export function faucet(g, x, y, z, mat = P.brushed) {
  cylinder(g, 0.025, 0.025, 0.04, mat, x, y, z, 20);
  cylinder(g, 0.011, 0.011, 0.25, mat, x, y + 0.04, z, 14);
  mesh(g, new THREE.TorusGeometry(0.08, 0.011, 10, 24, Math.PI), mat, x, y + 0.29, z + 0.08, 0, Math.PI / 2, 0);
  cylinder(g, 0.011, 0.009, 0.06, mat, x, y + 0.23, z + 0.16, 12);
}
export function baseCabB(w, d, o = {}) {
  const g = new THREE.Group(), h = 0.87;
  rb(g, w - 0.01, 0.1, d - 0.07, P.black, 0, 0, -0.035, 0.002);                       // recessed plinth
  rb(g, w, h - 0.1, d - 0.02, o.body ?? P.greige, 0, 0.1, -0.01, 0.004);
  const n = Math.max(1, Math.round(w / 0.6)), dw = w / n;
  for (let i = 0; i < n; i++) rb(g, dw - 0.004, h - 0.16, 0.019, o.door ?? P.greige, -w / 2 + dw * (i + 0.5), 0.1, d / 2 - 0.01, 0.003);
  rb(g, w, 0.035, 0.012, P.black, 0, h - 0.06, d / 2 - 0.02, 0.002);                 // handleless gola groove
  rb(g, w + 0.01, 0.03, d + 0.01, o.top ?? P.granite, 0, h, 0.005, 0.004);            // stone top
  const top = h + 0.03;
  if (o.sinkX !== undefined) {
    rb(g, 0.52, 0.004, 0.4, P.brushed, o.sinkX, top, 0.02, 0.01);
    rb(g, 0.47, 0.003, 0.35, P.steelDark, o.sinkX, top + 0.002, 0.02, 0.01);
    faucet(g, o.sinkX, top, -d / 2 + 0.06);
  }
  if (o.tankX !== undefined) {
    rb(g, 0.5, 0.004, 0.45, P.brushed, o.tankX, top, 0, 0.01);
    rb(g, 0.44, 0.003, 0.39, P.steelDark, o.tankX, top + 0.002, 0, 0.01);
    faucet(g, o.tankX, top, -d / 2 + 0.05);
  }
  if (o.cooktopX !== undefined) {
    rb(g, 0.6, 0.008, 0.5, P.blackGlass, o.cooktopX, top, 0, 0.006);
    for (const [bx, bz, r] of [[-0.15, -0.12, 0.07], [0.15, -0.12, 0.06], [-0.15, 0.12, 0.06], [0.15, 0.12, 0.08]]) {
      mesh(g, new THREE.TorusGeometry(r, 0.004, 8, 40), P.steelDark, o.cooktopX + bx, top + 0.01, bz, Math.PI / 2, 0, 0, false);
      mesh(g, new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.012, 24), P.black, o.cooktopX + bx, top + 0.012, bz);
    }
  }
  if (o.ovenX !== undefined) {                                                          // built-in oven under the cooktop
    rb(g, 0.58, 0.56, 0.012, P.blackGlass, o.ovenX, 0.16, d / 2 + 0.004, 0.004);
    mesh(g, new THREE.CylinderGeometry(0.008, 0.008, 0.48, 12), P.brushed, o.ovenX, 0.68, d / 2 + 0.035, 0, 0, Math.PI / 2);
  }
  if (o.grillX !== undefined) {
    rb(g, 0.52, 0.006, 0.44, P.black, o.grillX, top - 0.001, 0, 0.004);
    slats(g, 14, 0.035, 0.008, 0.01, 0.42, P.brushed, o.grillX - 0.23, top + 0.005, 0);
  }
  if (o.washerX !== undefined) {
    const fx = o.washerX;
    rb(g, 0.6, 0.82, 0.02, P.lacquer, fx, 0.04, d / 2 - 0.005, 0.01);
    mesh(g, new THREE.TorusGeometry(0.17, 0.022, 12, 40), P.brushed, fx, 0.4, d / 2 + 0.02);
    mesh(g, new THREE.CircleGeometry(0.16, 40), P.blackGlass, fx, 0.4, d / 2 + 0.017);
  }
  if (o.fruit) {
    lathe(g, [[0, 0], [0.06, 0], [0.15, 0.06], [0.16, 0.07], [0.15, 0.07], [0.06, 0.012], [0, 0.012]], P.walnut, 0, top, 0);
    const fm = [std({ color: '#e0a23c', roughness: 0.5 }), std({ color: '#8fb34a', roughness: 0.5 }), std({ color: '#c23b2a', roughness: 0.4 })];
    for (let i = 0; i < 6; i++) mesh(g, new THREE.SphereGeometry(0.035, 16, 12), fm[i % 3], Math.cos(i) * 0.06, top + 0.05 + (i > 3 ? 0.03 : 0), Math.sin(i) * 0.06);
  }
  return g;
}
export function upperCabB(w, d, o = {}) {
  const g = new THREE.Group(), y0 = 1.6, h = 0.7;
  rb(g, w, h, d - 0.02, P.lacquer, 0, y0, -0.01, 0.004);
  const n = Math.max(1, Math.round(w / 0.5)), dw = w / n;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + dw * (i + 0.5);
    if (o.hoodX !== undefined && Math.abs(x - o.hoodX) < dw / 2) continue;
    rb(g, dw - 0.004, h - 0.004, 0.02, P.freijo, x, y0 + 0.002, d / 2 - 0.01, 0.003);
  }
  if (o.hoodX !== undefined) {
    rb(g, 0.6, 0.12, d + 0.02, P.brushed, o.hoodX, y0 - 0.05, 0.01, 0.006);
    rb(g, 0.6, h - 0.07, 0.02, P.freijo, o.hoodX, y0 + 0.07, d / 2 - 0.01, 0.003);
  }
  rb(g, w - 0.04, 0.006, 0.02, P.led, 0, y0 - 0.006, d / 2 - 0.06, 0.002);           // LED strip
  const l = new THREE.RectAreaLight('#ffdcb0', 6, w - 0.1, 0.05);
  l.position.set(0, y0 - 0.01, d / 2 - 0.08); l.rotation.x = -Math.PI / 2; g.add(l); addLight(l);
  return g;
}
export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export function vanityB(w, d) {
  const g = new THREE.Group();
  rb(g, w - 0.02, 0.36, d - 0.04, P.freijo, 0, 0.45, -0.02, 0.006);                  // floating drawer unit
  rb(g, w - 0.06, 0.004, 0.004, P.black, 0, 0.62, d / 2 - 0.04, 0.001);
  rb(g, w, 0.03, d, P.marble, 0, 0.81, 0, 0.005);                                     // marble top (0.84 m)
  const bw = Math.min(0.5, w * 0.5), top = 0.84;
  const basin = lathe(g, [[0, 0.005], [0.15, 0], [0.19, 0.03], [0.2, 0.12], [0.19, 0.13], [0.175, 0.12], [0.165, 0.03], [0, 0.02]], P.ceramic, 0, top, 0.02);
  basin.scale.set(bw / 0.4, 1, (bw / 0.4) * 0.75);
  cylinder(g, 0.012, 0.012, 0.18, P.brushed, 0, 1.0, -d / 2 + 0.01, 14).rotation.x = Math.PI / 2;
  g.children[g.children.length - 1].position.set(0, 1.02, -d / 2 + 0.09);
  mesh(g, new THREE.ShapeGeometry(roundedRectShape(w * 0.86 + 0.03, 0.83, 0.12)), P.led, 0, 1.5, -d / 2 + 0.004, 0, 0, 0, false);
  mesh(g, new THREE.ShapeGeometry(roundedRectShape(w * 0.86, 0.8, 0.11)), P.mirror, 0, 1.5, -d / 2 + 0.014, 0, 0, 0, false);
  rb(g, w * 0.86, 0.8, 0.01, P.black, 0, 1.1, -d / 2 + 0.006, 0.004).visible = false;
  return g;
}
export function toiletB(w, d) {
  const g = new THREE.Group(), zb = -d / 2;
  rb(g, 0.36, 0.36, 0.17, P.ceramic, 0, 0.42, zb + 0.085, 0.03);                      // tank
  rb(g, 0.37, 0.03, 0.18, P.ceramic, 0, 0.78, zb + 0.09, 0.012);
  cylinder(g, 0.025, 0.025, 0.006, P.brushed, 0, 0.81, zb + 0.09, 20);
  const bowl = lathe(g, [[0, 0], [0.12, 0], [0.13, 0.1], [0.165, 0.32], [0.175, 0.38], [0.17, 0.4], [0, 0.4]], P.ceramic, 0, 0, zb + 0.36);
  bowl.scale.z = 1.3;
  const lid = cylinder(g, 0.18, 0.18, 0.035, P.ceramic, 0, 0.4, zb + 0.36, 40); lid.scale.z = 1.25;
  return g;
}
// small echeveria-style succulent rosette
export const succLeafGeo = (() => {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.45, 0.35, 0.12, 0.9); sh.lineTo(0, 1); sh.lineTo(-0.12, 0.9); sh.quadraticCurveTo(-0.45, 0.35, 0, 0);
  const geo = new THREE.ShapeGeometry(sh, 6), pp = geo.attributes.position;
  for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i); pp.setZ(i, 0.18 * y * y - 0.25 * x * x); }
  geo.computeVertexNormals(); return geo;
})();
export function succulent(g, x, y, z, s = 1, mat = P.succA) {
  for (let ring = 0; ring < 3; ring++) {
    const n = 8 - ring * 2, len = s * (0.065 - ring * 0.014), tilt = 1.1 - ring * 0.35;
    for (let i = 0; i < n; i++) {
      const l = new THREE.Mesh(succLeafGeo, mat); l.scale.setScalar(len); l.position.set(x, y + ring * 0.004, z);
      l.rotation.set(tilt, (i / n) * Math.PI * 2 + ring * 0.5, 0, 'YXZ'); l.castShadow = true; g.add(l);
    }
  }
}
export function tableB(w, d, top = P.teak) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rb(g, 0.05, 0.72, 0.05, P.black, sx * (w / 2 - 0.12), 0, sz * (d / 2 - 0.1), 0.006);
  for (const sx of [-1, 1]) rb(g, 0.04, 0.04, d - 0.2, P.black, sx * (w / 2 - 0.12), 0.66, 0, 0.004);
  // grain along the length of the table
  const tm = top.clone(); tm.map = top.map.clone(); tm.map.needsUpdate = true; tm.map.rotation = Math.PI / 2; tm.map.center.set(0.5, 0.5);
  rb(g, w, 0.04, d, tm, 0, 0.72, 0, 0.01);
  // slim ceramic planter with a row of small succulents (as on the plan)
  rb(g, 0.56, 0.055, 0.11, P.sand, 0, 0.76, 0, 0.012);
  rb(g, 0.53, 0.004, 0.085, P.soil, 0, 0.808, 0, 0.003);
  for (let i = 0; i < 6; i++) succulent(g, -0.225 + i * 0.09, 0.81, (i % 2 ? 0.012 : -0.012), 0.8 + (i % 3) * 0.15, i % 2 ? P.succA : P.succB);
  for (let i = 0; i < 5; i++) mesh(g, new THREE.SphereGeometry(0.018, 10, 8), P.moss, -0.18 + i * 0.09, 0.808, (i % 2 ? -0.025 : 0.025));
  return g;
}
export function wineB(w, d) {
  const g = new THREE.Group();
  rb(g, w, 0.85, d, P.black, 0, 0, 0, 0.01);
  rb(g, w - 0.04, 0.78, 0.015, P.blackGlass, 0, 0.04, d / 2, 0.006);
  rb(g, w - 0.08, 0.72, 0.004, std({ color: '#2a1810', emissive: '#ff9a50', emissiveIntensity: 0.25 }), 0, 0.07, d / 2 - 0.012, 0.002);
  cylinder(g, 0.01, 0.01, 0.6, P.brushed, w / 2 - 0.05, 0.15, d / 2 + 0.03, 12);
  return g;
}
// procedural plant
export const leafGeo = (() => {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.13, 0.45, 0, 1); s.quadraticCurveTo(-0.13, 0.45, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 8), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.28 * p.getY(i) ** 2);
  geo.computeVertexNormals(); return geo;
})();
export function leafCluster(g, x, y, z, s = 1, n = 7) {
  for (let i = 0; i < n; i++) {
    const l = new THREE.Mesh(leafGeo, Math.random() < 0.5 ? P.leaf : P.leaf2), len = s * (0.25 + Math.random() * 0.25);
    l.scale.setScalar(len); l.position.set(x, y, z);
    l.rotation.set(0.3 + Math.random() * 0.8, i * 2.39996 + Math.random(), 0, 'YXZ');
    l.castShadow = true; g.add(l);
  }
}
export function plantB(w, d, s = 1, pot = P.terracotta) {
  const g = new THREE.Group(), ph = 0.32 * s, pr = 0.15 * s;
  lathe(g, [[0, 0], [pr * 0.75, 0], [pr, ph * 0.92], [pr * 1.04, ph], [pr * 0.92, ph], [pr * 0.9, ph * 0.95], [0, ph * 0.9]], pot);
  cylinder(g, pr * 0.9, pr * 0.9, 0.01, P.soil, 0, ph * 0.88, 0, 24);
  leafCluster(g, 0, ph * 0.9, 0, 1.0 * s, Math.round(18 * Math.sqrt(s)));
  leafCluster(g, 0, ph * 0.9 + 0.1 * s, 0, 0.8 * s, Math.round(9 * Math.sqrt(s)));
  return g;
}
export function rug(ax, az, bx, bz, mat) {
  const g = new THREE.Group(); rb(g, X(bx) - X(ax), 0.012, Z(bz) - Z(az), mat, 0, 0, 0, 0.005);
  g.position.set((X(ax) + X(bx)) / 2, 0.002, (Z(az) + Z(bz)) / 2); g.traverse(o => o.castShadow = false); world.add(g);
}
export function worldRb(ax, az, bx, bz, yb, yt, mat, r = 0.008) {
  const g = new THREE.Group(); rb(g, X(bx) - X(ax), yt - yb, Z(bz) - Z(az), mat, 0, yb, 0, r);
  g.position.set((X(ax) + X(bx)) / 2, 0, (Z(az) + Z(bz)) / 2); world.add(g); return g;
}
// TV hung on a wall. dir = +1 faces +x, -1 faces -x
export function tvOnWall(xFace, zc, w, h, yc, dir) {
  const g = new THREE.Group();
  rb(g, 0.03, h, w, P.black, 0, -h / 2, 0, 0.004);
  mesh(g, new THREE.PlaneGeometry(w - 0.012, h - 0.012), P.screen, 0.0155, 0, 0, 0, Math.PI / 2, 0, false);
  g.position.set(xFace + dir * 0.025, yc, zc); if (dir < 0) g.rotation.y = Math.PI; world.add(g);
}
// curtains on a wall that runs along x. dir = side of the room (+1 → room at +z)
export function curtain(x0p, x1p, zWallP, dir, sheer = true) {
  const x0 = X(x0p), x1 = X(x1p), zf = Z(zWallP) + dir * 0.1, hh = H - 0.08;
  const wave = (w, amp, per) => {
    const geo = new THREE.PlaneGeometry(w, hh, Math.ceil(w * 60), 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, amp * Math.sin(p.getX(i) * Math.PI * 2 / per));
    geo.computeVertexNormals(); return geo;
  };
  if (sheer) mesh(world, wave(x1 - x0, 0.025, 0.12), P.sheer, (x0 + x1) / 2, hh / 2 + 0.02, zf, 0, 0, 0, false);
  const pw = Math.min(0.36, (x1 - x0) * 0.2);
  for (const xc of [x0 + pw / 2, x1 - pw / 2]) mesh(world, wave(pw, 0.05, 0.09), P.drape, xc, hh / 2 + 0.02, zf + dir * 0.06, 0, 0, 0, true);
  mesh(world, new THREE.CylinderGeometry(0.012, 0.012, x1 - x0 + 0.1, 12), P.black, (x0 + x1) / 2, hh + 0.04, zf + dir * 0.03, 0, 0, Math.PI / 2);
}
export function rollerBlind(x0p, x1p, zWallP, dir, top = 2.2) {
  const x0 = X(x0p), x1 = X(x1p), zf = Z(zWallP) + dir * 0.06;
  mesh(world, RBG(x1 - x0, 0.08, 0.08, 0.02), P.lacquer, (x0 + x1) / 2, top - 0.04, zf);
  mesh(world, new THREE.PlaneGeometry(x1 - x0 - 0.04, 0.45), std({ color: '#e9e3d8', roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }), (x0 + x1) / 2, top - 0.3, zf, 0, 0, 0, false);
}
// Recessed downlights: every fixture is drawn, but only the LIGHT_SLOTS nearest to the viewer
// actually shine (lights in rooms you can't see add nothing but cost per pixel). The number of
// lights never changes, so shaders are never recompiled while walking.
export const downlights = [], LIGHT_SLOTS = 6, spotSlots = [];
export function downlight(px, pz, intensity = 9) {
  const x = X(px), z = Z(pz);
  mesh(ceilingGroup, new THREE.BoxGeometry(0.19, 0.012, 0.1), P.black, x, H - 0.006, z, 0, 0, 0, false);           // double square trimless spot
  for (const s of [-1, 1]) mesh(ceilingGroup, new THREE.CylinderGeometry(0.022, 0.022, 0.013, 20), P.led, x + s * 0.045, H - 0.0085, z, 0, 0, 0, false);
  downlights.push({ x, z, intensity });
}
export function initSpotSlots() {
  for (let i = 0; i < LIGHT_SLOTS; i++) {
    const s = addLight(new THREE.SpotLight('#ffd9b0', 0, 0, 1.0, 0.9, 2));
    world.add(s, s.target); spotSlots.push(s);
  }
}
export let lastSlotPos = null;
// Each slot fades out before it moves to another fixture and fades in at the new one, so walking
// never makes lights pop on/off (this was the main flicker). Held fixtures get a small distance
// bonus (hysteresis) so two equidistant fixtures don't keep trading places.
export function slotFader(slots, defs, place) {
  const st = slots.map(s => ({ s, cur: null }));
  return (cx, cz, a) => {
    const held = new Set(st.map(o => o.cur));
    const near = defs.map(d => ({ d, k: Math.hypot(d.x - cx, d.z - cz) - (held.has(d) ? 0.6 : 0) }))
      .sort((p, q) => p.k - q.k).slice(0, slots.length).map(p => p.d);
    const want = new Set(near), free = near.filter(d => !held.has(d));
    for (const o of st) {
      if (o.cur && !want.has(o.cur) && o.s.intensity <= o.cur.intensity * 0.02) o.cur = null;
      if (!o.cur && free.length) { o.cur = free.shift(); place(o.s, o.cur); o.s.intensity = 0; }
      const t = o.cur && want.has(o.cur) ? o.cur.intensity : 0;
      o.s.intensity += (t - o.s.intensity) * a;
    }
  };
}
export let updateSpotSlots = () => {};
export function setUpdateSpotSlots(f) { updateSpotSlots = f; }
export function resetSlotPos() { lastSlotPos = null; }

export function acSplit(xFace, zc, yc, dir) {
  const g = new THREE.Group();
  rb(g, 0.21, 0.29, 0.8, P.lacquer, 0, -0.145, 0, 0.03);
  rb(g, 0.02, 0.02, 0.7, P.black, 0.1, -0.13, 0, 0.005);
  g.position.set(xFace + dir * 0.11, yc, zc); world.add(g);
}

// ===========================================================================
// REUSABLE DEFINITIONS (materials + furniture builders) shared with the 79 m² model
// ===========================================================================
// ---------- textures ----------
export function woodMat(len, vrep = 1) {
  const t = panelTex.clone(); t.needsUpdate = true; t.repeat.set(len / 1.2, vrep);
  const b = panelBump.clone(); b.needsUpdate = true; b.repeat.copy(t.repeat);
  return phys({ map: t, bumpMap: b, bumpScale: 0.6, roughness: 0.52, clearcoat: 0.12, clearcoatRoughness: 0.55 });
}
export function woodClad(ax, az, bx, bz, yb = 0, yt = H) {
  const len = Math.max(Math.abs(X(bx) - X(ax)), Math.abs(Z(bz) - Z(az)));
  return box(ax, az, bx, bz, yb, yt, woodMat(len), { collide: false });
}
// fibre texture for the woven art: fine vertical cords
export function fiberMat(base, light, dark) {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3) {
      g.fillStyle = Math.random() < 0.5 ? light : dark; g.globalAlpha = 0.25 + Math.random() * 0.45;
      g.fillRect(x, 0, 1.4, h);
    }
    g.globalAlpha = 1;
  });
  t.repeat.set(5, 5);                                                       // ShapeGeometry UVs are in metres → 0.2 m per tile
  return std({ map: t, roughness: 1, bumpMap: t, bumpScale: 1.5, side: THREE.DoubleSide });
}
// ---------- LED cove: bright slot at the ceiling + light grazing down the wall ----------
export const glowTex = canvasTex(4, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(255,196,125,0.95)'); gr.addColorStop(0.08, 'rgba(255,186,115,0.55)');
  gr.addColorStop(0.35, 'rgba(255,176,105,0.18)'); gr.addColorStop(1, 'rgba(255,170,100,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.6 });
export function cove(face, a0, a1, dir, alongX = false) {
  const len = Math.abs(a1 - a0), c = (a0 + a1) / 2, gh = 1.3;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(len, gh), glowMat); glow.renderOrder = 2;
  if (alongX) { glow.position.set(c, H - 0.04 - gh / 2, face + dir * 0.006); if (dir < 0) glow.rotation.y = Math.PI; }
  else { glow.position.set(face + dir * 0.006, H - 0.04 - gh / 2, c); glow.rotation.y = dir * Math.PI / 2; }
  world.add(glow);
  // recessed slot in the ceiling (dark reveal) with the LED line inside
  const mk = (w, d, mat, off, y) => {
    const m = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, 0.004, w) : new THREE.BoxGeometry(w, 0.004, len), mat);
    if (alongX) m.position.set(c, y, face + dir * off); else m.position.set(face + dir * off, y, c);
    ceilingGroup.add(m);
  };
  mk(0.06, 0, P.black, 0.03, H - 0.003);
  mk(0.02, 0, P.cove, 0.02, H - 0.01);
}
// ---------- builders ----------
export function flutedConsoleB(w, d) {                   // floating fluted console, rounded end at local +x, front +z
  const g = new THREE.Group(), y0 = 0.14, h = 0.38, r = d / 2, sw = w - r, ex = w / 2 - r;
  const cx = -w / 2 + sw / 2;
  // recessed plinth (shadow gap) with its own rounded end
  rb(g, sw - 0.04, y0, d - 0.1, P.taupeDark, cx + 0.02, 0, -0.03, 0.004);
  cylinder(g, r - 0.06, r - 0.06, y0, P.taupeDark, ex, 0, -0.03, 40);
  // core body
  rb(g, sw, h, d - 0.03, P.taupeLac, cx, y0, -0.015, 0.004);
  cylinder(g, r - 0.015, r - 0.015, h, P.taupeLac, ex, y0, 0, 64);
  // vertical half-round flutes along the front and around the rounded end
  const fr = 0.0095, step = 0.021, fl = new THREE.CylinderGeometry(fr, fr, h - 0.004, 12);
  const nStraight = Math.floor(sw / step), nCurve = Math.floor(Math.PI * (r - 0.015) / step);
  const im = new THREE.InstancedMesh(fl, P.taupeLac, nStraight + nCurve), m4 = new THREE.Matrix4();
  for (let i = 0; i < nStraight; i++) im.setMatrixAt(i, m4.makeTranslation(-w / 2 + step / 2 + i * step, y0 + h / 2, d / 2 - 0.015 - fr * 0.3));
  for (let k = 0; k < nCurve; k++) {
    const t = (k + 0.5) / nCurve * Math.PI, rr = r - 0.015 - fr * 0.3;
    im.setMatrixAt(nStraight + k, m4.makeTranslation(ex + Math.sin(t) * rr, y0 + h / 2, Math.cos(t) * rr));
  }
  im.castShadow = im.receiveShadow = true; g.add(im);
  // top slab, slightly proud
  rb(g, sw, 0.03, d + 0.01, P.taupeLac, cx, y0 + h, 0, 0.008);
  cylinder(g, r + 0.005, r + 0.005, 0.03, P.taupeLac, ex, y0 + h, 0, 64);
  const top = y0 + h + 0.03;
  // decor: glass vase with lilies (buds + leaves)
  const vx = ex - 0.25;
  lathe(g, [[0, 0], [0.045, 0], [0.05, 0.01], [0.035, 0.16], [0.04, 0.22], [0.037, 0.22], [0.031, 0.16], [0.043, 0.012], [0, 0.008]], P.clearGlass, vx, top, 0.02, 28);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39996, tilt = 0.08 + (i % 4) * 0.1, len = 0.32 + (i % 3) * 0.08;
    const dir = new THREE.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt));
    const base = new THREE.Vector3(vx, top + 0.05, 0.02);
    const st = mesh(g, new THREE.CylinderGeometry(0.0035, 0.004, len, 6), P.stemGreen, 0, 0, 0, 0, 0, 0, false);
    st.quaternion.setFromUnitVectors(up, dir); st.position.copy(base).addScaledVector(dir, len / 2);
    const tip = base.clone().addScaledVector(dir, len);
    const bud = mesh(g, new THREE.SphereGeometry(0.014, 12, 10), i % 3 ? P.budGreen : P.budWhite, tip.x, tip.y + 0.02, tip.z);
    bud.scale.set(1, 2.6, 1); bud.quaternion.copy(st.quaternion);
    const lf = new THREE.Mesh(leafGeo, P.leaf2); lf.scale.set(0.09, 0.16, 0.09);
    lf.position.copy(base).addScaledVector(dir, len * 0.55); lf.rotation.set(0.9, a + 1.2, 0, 'YXZ'); lf.castShadow = true; g.add(lf);
  }
  // books + small terracotta bowl at the other end
  const bxp = -w / 2 + 0.6;
  rb(g, 0.3, 0.035, 0.22, P.books[4], bxp, top, 0.0, 0.004, 0, 0.05);
  rb(g, 0.27, 0.03, 0.2, P.books[1], bxp, top + 0.035, 0.0, 0.004, 0, -0.04);
  lathe(g, [[0, 0], [0.04, 0], [0.075, 0.035], [0.07, 0.07], [0.055, 0.075], [0.05, 0.07], [0, 0.068]], P.terracotta, bxp, top + 0.065, 0, 32);
  return g;
}
// slim TV with an aluminium frame on a wall along z (room at +x)
export function tvSlim(xFace, zc, w, h, yc) {
  const g = new THREE.Group();
  rb(g, 0.028, h, w, P.black, 0.014, -h / 2, 0, 0.003);                           // body
  rb(g, 0.006, h + 0.006, w + 0.006, P.brushed, 0.03, -h / 2 - 0.003, 0, 0.002);  // thin bezel
  mesh(g, new THREE.PlaneGeometry(w - 0.01, h - 0.01), P.tvPanel, 0.0335, 0, 0, 0, Math.PI / 2, 0, false);
  rb(g, 0.004, 0.008, 0.05, P.brushed, 0.035, -h / 2 + 0.002, 0, 0.001);           // logo
  g.position.set(xFace + 0.03, yc, zc); world.add(g);
}
export function barCabB(w, d) {                          // wood bar counter with built-in wine cooler (local -x end), front +z
  const g = new THREE.Group(), h = 0.88, fw = 0.6, wood = woodMat(w, 0.4);
  rb(g, w - 0.04, 0.08, d - 0.08, P.black, 0, 0, -0.04, 0.002);                    // recessed toe
  rb(g, w - fw - 0.03, h - 0.08, d - 0.025, wood, (fw + 0.03) / 2, 0.08, -0.0125, 0.003);   // carcass beside the cooler
  rb(g, 0.03, h - 0.08, d - 0.025, wood, -w / 2 + 0.015, 0.08, -0.0125, 0.003);             // end panel
  const fx = -w / 2 + 0.03 + fw / 2, fh = h - 0.1, fz = d / 2;
  // wine cooler – open black cavity, wooden racks with bottles, LED at the top, glass door
  const cav = (cw, ch, cd, x, y, z) => rb(g, cw, ch, cd, P.black, x, y, z, 0.002);
  cav(fw, fh, 0.01, fx, 0.04, -d / 2 + 0.02);                                       // back
  cav(fw, 0.012, d - 0.04, fx, 0.04, 0); cav(fw, 0.012, d - 0.04, fx, 0.04 + fh - 0.012, 0);   // floor + roof
  for (const s of [-1, 1]) cav(0.012, fh, d - 0.04, fx + s * (fw / 2 - 0.006), 0.04, 0);       // sides
  rb(g, fw - 0.08, 0.01, 0.02, P.cove, fx, fh - 0.03, fz - 0.06, 0.002);            // LED strip
  const bottle = [std({ color: '#2b0a0e', roughness: 0.15, metalness: 0.1 }), std({ color: '#16261a', roughness: 0.15, metalness: 0.1 }), P.glassBottle];
  for (let r = 0; r < 6; r++) {
    const y = 0.13 + r * 0.115;
    rb(g, fw - 0.08, 0.012, 0.28, P.oak, fx, y, fz - 0.18, 0.003);                  // wooden rack
    for (let k = 0; k < 6; k++) {
      const bx = fx - 0.22 + k * 0.088, m = bottle[(r * 2 + k) % 3];
      mesh(g, new THREE.CylinderGeometry(0.034, 0.034, 0.2, 16), m, bx, y + 0.046, fz - 0.2, Math.PI / 2);
      mesh(g, new THREE.CylinderGeometry(0.012, 0.03, 0.06, 12), m, bx, y + 0.046, fz - 0.07, Math.PI / 2);
      mesh(g, new THREE.CylinderGeometry(0.013, 0.013, 0.03, 10), k % 2 ? P.brass : P.black, bx, y + 0.046, fz - 0.03, Math.PI / 2);
    }
  }
  const wl = addLight(new THREE.PointLight('#ffd2a0', 0.35, 0.8, 2)); wl.position.set(fx, fh - 0.1, fz - 0.12); g.add(wl);
  rb(g, fw - 0.05, fh - 0.06, 0.006, P.tintGlass, fx, 0.07, fz + 0.002, 0.003);   // glass door
  rb(g, fw - 0.04, 0.035, 0.012, P.black, fx, 0.06, fz + 0.004, 0.002);            // bottom rail with logo
  rb(g, 0.06, 0.008, 0.002, P.brushed, fx, 0.073, fz + 0.011, 0.001);
  rb(g, 0.012, 0.4, 0.02, P.black, fx + fw / 2 - 0.05, 0.3, fz + 0.012, 0.003);    // handle
  // flush wood doors for the rest (handleless, shadow-gap top)
  const dw0 = w - fw - 0.06, n = Math.max(1, Math.round(dw0 / 0.45)), dw = dw0 / n;
  for (let i = 0; i < n; i++) rb(g, dw - 0.004, h - 0.13, 0.02, wood, -w / 2 + fw + 0.05 + dw * (i + 0.5), 0.085, fz - 0.01, 0.002);
  rb(g, w + 0.02, 0.04, d + 0.02, wood, 0, h, 0.01, 0.004);                         // 4 cm wood top
  // decor: smoked-steel tray with a decanter, two bottles and tumblers
  const top = h + 0.04, tx = -w / 2 + 0.36;
  rb(g, 0.44, 0.012, 0.26, P.steelDark, tx, top, 0.02, 0.004);
  rb(g, 0.42, 0.012, 0.24, P.black, tx, top + 0.004, 0.02, 0.004);
  const t0 = top + 0.016;
  lathe(g, [[0, 0], [0.065, 0], [0.072, 0.03], [0.07, 0.11], [0.03, 0.15], [0.02, 0.19], [0.026, 0.2], [0, 0.2]], P.clearGlass, tx + 0.1, t0, 0.03, 32);
  mesh(g, new THREE.SphereGeometry(0.03, 16, 12), P.clearGlass, tx + 0.1, t0 + 0.23, 0.03);
  lathe(g, [[0, 0], [0.058, 0], [0.06, 0.06], [0.055, 0.11], [0, 0.11]], std({ color: '#7a3c0e', roughness: 0.2, transparent: true, opacity: 0.85 }), tx + 0.1, t0 + 0.004, 0.03, 24);
  lathe(g, [[0, 0], [0.034, 0], [0.035, 0.18], [0.013, 0.23], [0.012, 0.29], [0, 0.29]], P.glassBottle, tx - 0.08, t0, -0.05, 24);
  cylinder(g, 0.014, 0.014, 0.035, P.black, tx - 0.08, t0 + 0.29, -0.05, 12);
  rb(g, 0.066, 0.07, 0.002, P.books[4], tx - 0.08, t0 + 0.07, -0.05 + 0.035, 0.001);
  lathe(g, [[0, 0], [0.03, 0], [0.032, 0.2], [0.012, 0.25], [0.011, 0.3], [0, 0.3]], P.clearGlass, tx - 0.15, t0, 0.04, 24);
  cylinder(g, 0.013, 0.013, 0.03, P.brass, tx - 0.15, t0 + 0.3, 0.04, 12);
  for (const [x, z] of [[0.02, 0.07], [-0.01, -0.01]]) lathe(g, [[0, 0], [0.035, 0], [0.037, 0.085], [0.034, 0.085], [0.032, 0.01], [0, 0.01]], P.clearGlass, tx + x, t0, z, 24);
  return g;
}
export function wovenArtB() {                            // woven fibre wall art (≈0.95 × 1.3 m), faces +z, top edge at y = 0
  const g = new THREE.Group();
  const sand = fiberMat('#d6c49d', '#efe3c6', '#b49b6c'), cream = fiberMat('#e2d6bf', '#f4ecdc', '#c2b398');
  const grey = fiberMat('#a9a39b', '#cfc9c1', '#7d776f'), brown = fiberMat('#7a5a40', '#9b7656', '#4f3826');
  const slate = fiberMat('#6f6a66', '#8f8984', '#4c4744');
  const add = (shape, mat, z) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), mat); m.position.z = z; m.castShadow = true; g.add(m); };
  // back: big brown drop with a rounded bottom
  { const s = new THREE.Shape(); s.moveTo(-0.3, -0.35); s.lineTo(0.34, -0.35); s.lineTo(0.34, -0.98); s.absarc(0.02, -0.98, 0.32, 0, -Math.PI, true); s.lineTo(-0.3, -0.35); add(s, brown, 0); }
  // grey cords hanging through the middle
  { const s = new THREE.Shape(); s.moveTo(0.02, 0); s.lineTo(0.16, 0); s.lineTo(0.16, -1.1); s.lineTo(0.02, -1.0); s.lineTo(0.02, 0); add(s, grey, 0.004); }
  { const s = new THREE.Shape(); s.moveTo(0.3, -0.2); s.lineTo(0.44, -0.2); s.lineTo(0.44, -1.05); s.absarc(0.37, -1.05, 0.07, 0, -Math.PI, true); s.lineTo(0.3, -0.2); add(s, slate, 0.004); }
  // top-left sand panel with an arched bottom
  { const s = new THREE.Shape(); s.moveTo(-0.47, 0); s.lineTo(-0.02, 0); s.lineTo(-0.02, -0.52); s.absarc(-0.245, -0.52, 0.225, 0, -Math.PI, true); s.lineTo(-0.47, 0); add(s, sand, 0.008); }
  // top-right cream panel with a slanted, rounded bottom
  { const s = new THREE.Shape(); s.moveTo(0.06, 0); s.lineTo(0.47, 0); s.lineTo(0.47, -0.42); s.quadraticCurveTo(0.3, -0.75, 0.06, -0.62); s.lineTo(0.06, 0); add(s, cream, 0.012); }
  // narrow grey strip on the left reaching down
  { const s = new THREE.Shape(); s.moveTo(-0.4, -0.45); s.lineTo(-0.3, -0.45); s.lineTo(-0.3, -1.12); s.lineTo(-0.4, -1.12); s.lineTo(-0.4, -0.45); add(s, grey, 0.006); }
  rb(g, 0.98, 0.022, 0.022, P.walnut, 0, -0.008, -0.004, 0.006);                     // hanging rod
  return g;
}
export function benchUphB(w, d) {                         // upholstered banquette on a wood base, front +z
  const g = new THREE.Group(), wood = woodMat(w, 0.3);
  rb(g, w - 0.04, 0.06, d - 0.08, P.black, 0, 0, -0.03, 0.002);
  rb(g, w, 0.32, d - 0.02, wood, 0, 0.06, -0.01, 0.004);                             // wood box (top 0.38)
  rb(g, w - 0.01, 0.09, d - 0.1, P.bench, 0, 0.38, 0.04, 0.035);                     // seat cushion (0.47)
  const n = Math.max(1, Math.round(w / 0.7)), cw = w / n;
  for (let i = 0; i < n; i++) rb(g, cw - 0.012, 0.46, 0.13, P.bench, -w / 2 + cw * (i + 0.5), 0.47, -d / 2 + 0.08, 0.05, -0.1);   // back cushions
  return g;
}
export function ovalTableB() {                           // oval wood top on two white flared legs
  const g = new THREE.Group(), top = 0.75;
  const ellipse = new THREE.Shape(); ellipse.absellipse(0, 0, 0.8, 0.45, 0, Math.PI * 2);
  const topGeo = new THREE.ExtrudeGeometry(ellipse, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 4, curveSegments: 80 });
  const topMap = P.walnut.map.clone(); topMap.needsUpdate = true; topMap.repeat.set(0.8, 0.45); topMap.rotation = Math.PI / 2;
  const topMat = P.walnut.clone(); topMat.map = topMap;
  mesh(g, topGeo, topMat, 0, top - 0.006, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    lathe(g, [[0, 0], [0.06, 0], [0.06, 0.008], [0.03, 0.03], [0.022, 0.4], [0.04, 0.62], [0.07, 0.7], [0.07, top - 0.03], [0, top - 0.03]], P.whiteLac, s * 0.42, 0, 0, 40);
  }
  rb(g, 0.84, 0.03, 0.06, P.whiteLac, 0, top - 0.06, 0, 0.01);
  // wooden chain sculpture: five interlocking links
  for (let i = 0; i < 5; i++) {
    const R = 0.065, tube = 0.022, flat = i % 2 === 0, x = -0.24 + i * 0.105;
    const link = mesh(g, new THREE.TorusGeometry(R, tube, 16, 40), P.darkChain, x, top + (flat ? tube : R + tube - 0.012), 0.04 + Math.sin(i) * 0.01, flat ? Math.PI / 2 : 0, flat ? 0 : 0, 0);
    link.scale.set(1.25, 1, 1);
  }
  return g;
}
export function rustChairB() {                           // terracotta chair with a light-oak frame, front +z
  const g = new THREE.Group(), legH = 0.43;
  for (const sx of [-1, 1]) {
    rb(g, 0.035, legH, 0.035, P.oak, sx * 0.2, 0, 0.18, 0.006);                        // front legs
    rb(g, 0.035, 0.88, 0.035, P.oak, sx * 0.2, 0, -0.19, 0.006, -0.06);               // rear legs rise into the back posts
    rb(g, 0.025, 0.025, 0.36, P.oak, sx * 0.2, 0.16, 0, 0.004);                        // side stretchers
  }
  rb(g, 0.43, 0.025, 0.025, P.oak, 0, 0.16, 0.18, 0.004);
  rb(g, 0.46, 0.03, 0.42, P.oak, 0, legH - 0.03, 0, 0.006);                          // seat frame
  rb(g, 0.47, 0.09, 0.45, P.rust, 0, legH, 0.01, 0.04);                              // padded seat (top 0.52)
  rb(g, 0.46, 0.28, 0.07, P.rust, 0, 0.6, -0.17, 0.035, -0.08);                       // padded back, in front of the posts
  return g;
}

// ---------------------------------------------------------------------------
// TERRAÇO GOURMET – after the reference render: grey plaster walls, quartzite (Taj Mahal-style)
// counter + backsplash + shelf, walnut cabinets, charcoal grill with a stainless spit frame and a
// pyramid stainless hood, LED under the shelf, trailing pothos, cutting boards, a quartzite
// waterfall table with cane-back oak chairs.
// ---------------------------------------------------------------------------
export const quartzTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#d3c8b7'; g.fillRect(0, 0, w, h);
  const cols = ['196,176,146', '150,141,130', '228,219,204', '182,160,128'];
  for (let i = 0; i < 70; i++) {                                           // cloudy warm/grey patches
    const x = Math.random() * w, y = Math.random() * h, r = 60 + Math.random() * 260;
    const gr = g.createRadialGradient(x, y, 0, x, y, r), c = cols[i % cols.length];
    gr.addColorStop(0, `rgba(${c},0.22)`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  const flow = (alpha, wMin, wMax, n, blur, col) => {                      // diagonal flowing veins
    g.filter = `blur(${blur}px)`;
    for (let v = 0; v < n; v++) {
      let x = Math.random() * w * 1.4 - w * 0.4, y = -40; const ph = Math.random() * 6;
      g.strokeStyle = `rgba(${col},${alpha * (0.4 + Math.random() * 0.6)})`; g.lineWidth = wMin + Math.random() * (wMax - wMin);
      g.beginPath(); g.moveTo(x, y);
      while (y < h + 40) { y += 14; x += 5 + Math.sin(y / 90 + ph) * 7 + (Math.random() - 0.5) * 4; g.lineTo(x, y); }
      g.stroke();
    }
  };
  flow(0.22, 14, 40, 7, 8, '120,104,88'); flow(0.35, 3, 8, 12, 2, '105,92,80'); flow(0.5, 0.6, 2, 30, 0.6, '85,74,64');
  flow(0.35, 2, 6, 6, 1.5, '235,228,215');
  g.filter = 'none';
});
P.quartz = phys({ map: quartzTex, roughness: 0.16, clearcoat: 0.7, clearcoatRoughness: 0.12 });
P.terraceWall = std({ color: '#a8a6a1', roughness: 0.95 });
export const caneTex = canvasTex(128, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = '#c8a26a'; g.lineCap = 'round';
  const ln = (a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  g.lineWidth = 7; for (const k of [0, 64, 128]) { ln(k, 0, k, h); ln(0, k, w, k); }
  g.lineWidth = 6; g.strokeStyle = '#b48d56'; for (const o of [-128, 0, 128]) { ln(o, 0, o + 128, 128); ln(o + 128, 0, o, 128); }
});
caneTex.repeat.set(10, 10);
P.cane = std({ map: caneTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });

export function caneChairB() {                           // oak frame, cane seat + cane back panel, front +z
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    rb(g, 0.034, 0.44, 0.034, P.oak, sx * 0.2, 0, 0.18, 0.006);                      // front legs
    rb(g, 0.034, 0.88, 0.034, P.oak, sx * 0.2, 0, -0.19, 0.006, -0.06);             // rear legs → back posts
    rb(g, 0.03, 0.04, 0.36, P.oak, sx * 0.2, 0.4, 0, 0.005);                         // seat side rails
  }
  for (const z of [0.18, -0.18]) rb(g, 0.4, 0.04, 0.03, P.oak, 0, 0.4, z, 0.005);  // seat front/back rails
  mesh(g, new THREE.PlaneGeometry(0.38, 0.34), P.cane, 0, 0.44, 0, -Math.PI / 2, 0, 0, false);   // cane seat
  rb(g, 0.42, 0.05, 0.03, P.oak, 0, 0.82, -0.213, 0.01, -0.06);                    // top rail
  rb(g, 0.4, 0.03, 0.025, P.oak, 0, 0.55, -0.2, 0.006, -0.06);                     // lower back rail
  mesh(g, new THREE.PlaneGeometry(0.37, 0.26), P.cane, 0, 0.7, -0.207, -0.06, 0, 0, false);       // cane back
  return g;
}
export function quartzTableB(w, d) {                     // quartzite waterfall table, front +z
  const g = new THREE.Group(), h = 0.76, t = 0.05;
  rb(g, w, t, d, P.quartz, 0, h - t, 0, 0.004);
  for (const s of [-1, 1]) rb(g, t, h - t, d, P.quartz, s * (w / 2 - t / 2), 0, 0, 0.004);
  rb(g, w - 2 * t, 0.42, 0.04, P.quartz, 0, 0.29, 0, 0.003);                         // recessed centre fin
  // decor: walnut board with a bowl
  rb(g, 0.5, 0.02, 0.26, P.walnut, 0.1, h, 0, 0.01);
  lathe(g, [[0, 0], [0.05, 0], [0.12, 0.05], [0.13, 0.07], [0.115, 0.065], [0.045, 0.012], [0, 0.012]], P.ceramic, 0.1, h + 0.02, 0, 40);
  return g;
}
// ---- jiboia (golden pothos): heart-shaped glossy leaves, some variegated, on continuous vines ----
export const pothosLeafGeo = (() => {                    // unit leaf: petiole joint at the origin, tip at +y, faces +z
  const s = new THREE.Shape();
  s.moveTo(0, 0.07);
  s.bezierCurveTo(-0.1, -0.06, -0.5, -0.04, -0.48, 0.3);
  s.bezierCurveTo(-0.46, 0.6, -0.2, 0.84, 0, 1);
  s.bezierCurveTo(0.2, 0.84, 0.46, 0.6, 0.48, 0.3);
  s.bezierCurveTo(0.5, -0.04, 0.1, -0.06, 0, 0.07);
  const geo = new THREE.ShapeGeometry(s, 12), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    uv.setXY(i, x + 0.5, y);
    p.setZ(i, 0.16 * Math.abs(x) + 0.12 * y * y - 0.05 * y);                   // folded at the midrib, tip curling back
  }
  geo.computeVertexNormals(); return geo;
})();
export function pothosLeafMat(varieg) {
  const t = canvasTex(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#2f6a26'); gr.addColorStop(0.5, '#3f8a30'); gr.addColorStop(1, '#2f6a26');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(190,220,120,0.55)'; g.lineWidth = 2.5;                 // midrib
    g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(160,200,100,0.25)';                  // side veins
    for (let k = 1; k < 7; k++) for (const s of [-1, 1]) {
      const y = h - k * h / 7.5; g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w / 2 + s * w * 0.25, y - 18, w / 2 + s * w * 0.45, y - 40); g.stroke();
    }
    if (varieg) {                                                                // golden streaks out of the midrib
      g.filter = 'blur(1.5px)';
      for (let i = 0; i < 16; i++) {
        const y = Math.random() * h, s = Math.random() < 0.5 ? -1 : 1;
        g.strokeStyle = `rgba(222,214,120,${0.35 + Math.random() * 0.4})`; g.lineWidth = 2 + Math.random() * 6;
        g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w / 2 + s * 20, y - 10, w / 2 + s * (25 + Math.random() * 35), y - 25 - Math.random() * 30); g.stroke();
      }
      g.filter = 'none';
    }
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return phys({ map: t, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
}
export const POTHOS = [pothosLeafMat(false), pothosLeafMat(true), pothosLeafMat(true)];
export const vineMat = std({ color: '#5d7d3a', roughness: 0.7 });
// px,pz,y: pot position (plan px / metres). b: shelf bounds relative to the pot centre (metres)
// {x0,x1,z0,z1}; a0..a1: horizontal directions (radians, 0 = +x) the vines may take.
export function pothos(px, y, pz, b = { x0: -0.2, x1: 0.2, z0: -0.2, z1: 0.2 }, a0 = -1, a1 = 1, nV = 10, hangMax = 1.0) {
  const g = new THREE.Group(), up = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4();
  // matte stoneware pot with a rim
  lathe(g, [[0, 0], [0.065, 0], [0.075, 0.01], [0.09, 0.12], [0.098, 0.13], [0.098, 0.145], [0.088, 0.145], [0.083, 0.13], [0, 0.125]], P.sand, 0, 0, 0, 40);
  cylinder(g, 0.084, 0.084, 0.008, P.soil, 0, 0.122, 0, 24);
  const leafAt = (pos, tip, normal, size, k) => {
    const yA = tip.clone().normalize(), zA = normal.clone().addScaledVector(yA, -normal.dot(yA)).normalize(), xA = new THREE.Vector3().crossVectors(yA, zA);
    const lf = new THREE.Mesh(pothosLeafGeo, POTHOS[k % 3]);
    lf.quaternion.setFromRotationMatrix(m4.makeBasis(xA, yA, zA)); lf.position.copy(pos); lf.scale.setScalar(size);
    lf.castShadow = true; g.add(lf);
    // short petiole from the vine to the leaf
    const pet = mesh(g, new THREE.CylinderGeometry(0.0018, 0.0018, size * 0.35, 4), vineMat, 0, 0, 0, 0, 0, 0, false);
    pet.quaternion.setFromUnitVectors(up, yA); pet.position.copy(pos).addScaledVector(yA, -size * 0.17);
  };
  // crown: leaves arching up and out of the pot
  for (let i = 0; i < 16; i++) {
    const a = i * 2.39996, r = 0.03 + (i % 3) * 0.02, out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const pos = new THREE.Vector3(out.x * r, 0.15 + (i % 4) * 0.025, out.z * r);
    leafAt(pos, out.clone().multiplyScalar(0.8).add(new THREE.Vector3(0, 0.6 - (i % 3) * 0.25, 0)), out.clone().add(up), 0.075 + (i % 3) * 0.012, i);
  }
  // vines: over the rim, along the shelf to its edge, then hanging with a gentle sway
  for (let v = 0; v < nV; v++) {
    const a = a0 + (a1 - a0) * (v + 0.5) / nV + Math.sin(v * 7.3) * 0.08, dx = Math.cos(a), dz = Math.sin(a);
    const ts = [dx > 0 ? b.x1 / dx : dx < 0 ? b.x0 / dx : 9, dz > 0 ? b.z1 / dz : dz < 0 ? b.z0 / dz : 9];
    const reach = Math.min(...ts), hang = hangMax * (0.4 + (((v * 5) % 7) / 6) * 0.6);
    const out = new THREE.Vector3(dx, 0, dz), side = new THREE.Vector3(-dz, 0, dx);
    const pts = [new THREE.Vector3(dx * 0.07, 0.13, dz * 0.07), new THREE.Vector3(dx * 0.11, 0.15, dz * 0.11)];
    if (reach > 0.16) pts.push(new THREE.Vector3(dx * (reach * 0.6), 0.012, dz * (reach * 0.6)));
    pts.push(new THREE.Vector3(dx * (reach + 0.015), 0.0, dz * (reach + 0.015)));
    for (let k = 1; k <= 5; k++) {
      const t = k / 5, sw = Math.sin(t * 3 + v) * 0.03;
      pts.push(new THREE.Vector3(dx * (reach + 0.03 + t * 0.03), -hang * t, dz * (reach + 0.03 + t * 0.03)).addScaledVector(side, sw));
    }
    const curve = new THREE.CatmullRomCurve3(pts), L = curve.getLength();
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0028, 5), vineMat); tube.castShadow = true; g.add(tube);
    const n = Math.floor(L / 0.045);
    for (let k = 1; k <= n; k++) {
      const u = k / (n + 0.6), pos = curve.getPointAt(u), tan = curve.getTangentAt(u);
      const alt = k % 2 ? 1 : -1, hanging = tan.y < -0.5;
      const sideDir = side.clone().multiplyScalar(alt);
      const tip = hanging ? new THREE.Vector3(0, -0.75, 0).addScaledVector(sideDir, 0.55).addScaledVector(out, 0.25)
                          : sideDir.clone().multiplyScalar(0.8).addScaledVector(out, 0.4).add(new THREE.Vector3(0, 0.35, 0));
      const normal = hanging ? out.clone().add(new THREE.Vector3(0, 0.25, 0)) : up.clone().addScaledVector(out, 0.3);
      const size = 0.075 - 0.04 * u + Math.sin(k * 3.1 + v) * 0.008;
      leafAt(pos.clone().addScaledVector(sideDir, 0.012), tip, normal, size, k + v);
    }
  }
  g.position.set(X(px), y, Z(pz)); world.add(g);
  return g;
}
P.steelSat = std({ color: '#b8bcc1', metalness: 1, roughness: 0.32 });              // satin stainless for sink basins
// Kitchen – remodelled to match the living room: walnut joinery to the ceiling, quartzite top +
// full-height backsplash, handleless (gola) fronts, integrated fridge column with a built-in
// microwave, induction cooktop over a built-in oven, slim hood, open lit niche, LED under the uppers.
export function tallKitchenB(w, d) {                     // fridge + pantry column, front +z, local +x = south
  const g = new THREE.Group(), fz = d / 2, hh = H - 0.01, half = w / 2;
  rb(g, w - 0.04, 0.1, d - 0.08, P.black, 0, 0, -0.04, 0.002);                       // recessed toe
  rb(g, w - 0.036, hh - 0.1, d - 0.03, P.lacquer, 0, 0.1, -0.015, 0.003);            // carcass
  for (const s of [-1, 1]) rb(g, 0.018, hh, d - 0.01, P.walnut, s * (w / 2 - 0.009), 0, -0.005, 0.002);   // walnut end panels
  const iw = w - 0.036, x0 = -iw / 2, xm = 0, x1 = iw / 2;
  const door = (a, b, y0, y1) => rb(g, b - a - 0.004, y1 - y0 - 0.004, 0.019, P.walnut, (a + b) / 2, y0 + 0.002, fz - 0.0105, 0.002);
  // pantry (north half): doors with a built-in microwave at eye level
  door(x0, xm, 0.1, 1.2); door(x0, xm, 1.62, 2.12); door(x0, xm, 2.12, hh);
  rb(g, xm - x0 - 0.004, 0.42, 0.02, P.black, (x0 + xm) / 2, 1.2, fz - 0.0105, 0.003);
  rb(g, xm - x0 - 0.12, 0.3, 0.006, P.blackGlass, (x0 + xm) / 2 - 0.04, 1.26, fz + 0.001, 0.003);
  rb(g, 0.07, 0.3, 0.006, P.steelDark, xm - 0.06, 1.26, fz + 0.001, 0.003);
  rb(g, 0.012, 0.22, 0.02, P.brushed, (x0 + xm) / 2 + 0.13, 1.3, fz + 0.012, 0.003);
  // integrated fridge (south half): tall fridge door + freezer door + top box
  door(xm, x1, 0.1, 0.82); door(xm, x1, 0.82, 2.12); door(xm, x1, 2.12, hh);
  for (const [y, hgt] of [[1.0, 0.9], [0.35, 0.4]]) rb(g, 0.018, hgt, 0.022, P.black, xm + 0.045, y, fz + 0.012, 0.004);   // slim black pulls
  return g;
}
export function kitchenRunB(w, d) {                      // base run + uppers, front +z, local +x = south
  const g = new THREE.Group(), h = 0.88, fz = d / 2, top = h + 0.04, L = s => -w / 2 + s;
  rb(g, w - 0.04, 0.1, d - 0.08, P.black, 0, 0, -0.04, 0.002);                       // recessed toe
  const sx = L(1.0), sw = 0.5, sd = 0.38, sz = 0.03, bd = 0.2;                       // sink cut-out (centre, width, depth, basin depth)
  const cseg = (x0, x1, yt) => rb(g, x1 - x0, yt - 0.1, d - 0.03, P.lacquer, (x0 + x1) / 2, 0.1, -0.015, 0.003);
  cseg(-w / 2 + 0.018, L(0.7), h); cseg(L(0.7), L(1.3), top - bd - 0.012); cseg(L(1.3), w / 2 - 0.018, h);   // carcass, lowered under the basin
  rb(g, 0.018, h, d - 0.01, P.walnut, w / 2 - 0.009, 0, -0.005, 0.002);              // walnut end panel (living side)
  const door = (a, b, y0, y1) => rb(g, b - a - 0.004, y1 - y0 - 0.004, 0.019, P.walnut, (L(a) + L(b)) / 2, y0 + 0.002, fz - 0.0105, 0.002);
  const W = w - 0.018;
  door(0, 0.6, 0.1, h - 0.05);                                                       // integrated dishwasher
  door(0.6, 1.0, 0.1, h - 0.05); door(1.0, 1.4, 0.1, h - 0.05);                      // sink cabinet
  for (const [a, b] of [[0.1, 0.36], [0.36, 0.62], [0.62, h - 0.05]]) { door(1.4, 1.85, a, b); door(2.55, W, a, b); }   // drawer stacks
  door(1.85, 2.55, 0.1, 0.24);                                                       // drawer under the oven
  rb(g, w - 0.036, 0.045, 0.01, P.black, -0.009, h - 0.048, fz - 0.025, 0.002);      // gola groove
  // built-in oven
  rb(g, 0.68, 0.58, 0.02, P.black, L(2.2), 0.245, fz - 0.0105, 0.004);
  rb(g, 0.6, 0.4, 0.006, P.blackGlass, L(2.2), 0.28, fz + 0.001, 0.004);
  rb(g, 0.62, 0.07, 0.006, P.steelDark, L(2.2), 0.74, fz + 0.001, 0.003);
  for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.016, 0.016, 0.02, 20), P.brushed, L(2.2) + s * 0.22, 0.775, fz + 0.012, Math.PI / 2);
  mesh(g, new THREE.CylinderGeometry(0.008, 0.008, 0.5, 12), P.brushed, L(2.2), 0.7, fz + 0.035, 0, 0, Math.PI / 2);
  // quartzite top + full backsplash up to the uppers
  // (the top is built from four slabs around a real cut-out, so the sink is a recessed basin –
  //  no stacked coplanar plates any more, which is what made the old sink flicker)
  const zb = -d / 2, zf = d / 2 + 0.01;
  const slab = (x0, x1, z0, z1) => rb(g, x1 - x0, 0.04, z1 - z0, P.quartz, (x0 + x1) / 2, h, (z0 + z1) / 2, 0.002);
  slab(-w / 2, sx - sw / 2, zb, zf); slab(sx + sw / 2, w / 2, zb, zf);
  slab(sx - sw / 2, sx + sw / 2, zb, sz - sd / 2); slab(sx - sw / 2, sx + sw / 2, sz + sd / 2, zf);
  rb(g, w, 1.55 - top, 0.02, P.quartz, 0, top, -d / 2 + 0.01, 0.002);
  // undermount stainless basin + black gooseneck tap
  rb(g, sw, 0.008, sd, P.steelSat, sx, top - bd, sz, 0.002);                           // basin floor
  for (const s of [-1, 1]) {
    rb(g, 0.008, bd, sd, P.steelSat, sx + s * (sw / 2 - 0.004), top - bd, sz, 0.002);
    rb(g, sw - 0.016, bd, 0.008, P.steelSat, sx, top - bd, sz + s * (sd / 2 - 0.004), 0.002);
  }
  cylinder(g, 0.04, 0.04, 0.004, P.steelDark, sx, top - bd + 0.008, sz + 0.07, 24);   // drain
  cylinder(g, 0.012, 0.012, 0.005, P.black, sx, top - bd + 0.008, sz + 0.07, 12);
  faucet(g, sx, top, -d / 2 + 0.07, P.black);
  // flush induction cooktop
  rb(g, 0.6, 0.006, 0.52, P.blackGlass, L(2.2), top - 0.003, 0.02, 0.004);
  for (const [bx, bz, r] of [[-0.15, -0.1, 0.09], [0.15, -0.1, 0.07], [-0.15, 0.13, 0.07], [0.15, 0.13, 0.09]])
    mesh(g, new THREE.TorusGeometry(r, 0.0022, 6, 48), P.steelDark, L(2.2) + bx, top + 0.0035, 0.02 + bz, Math.PI / 2, 0, 0, false);
  rb(g, 0.2, 0.002, 0.03, P.steelDark, L(2.2), top + 0.0035, 0.25, 0.001);
  // ---- uppers to the ceiling (walnut), open lit niche at the north end, slim hood over the cooktop ----
  const du = 0.35, y0 = 1.55, zc = -d / 2 + 0.02 + du / 2, uf = zc + du / 2, yt = H - 0.01;
  rb(g, w - 0.6 - 0.018, yt - y0, du - 0.02, P.lacquer, 0.3 - 0.009, y0, zc - 0.01, 0.003);
  const udoor = (a, b, ya, yb) => rb(g, b - a - 0.004, yb - ya - 0.004, 0.019, P.walnut, (L(a) + L(b)) / 2, ya + 0.002, uf - 0.0105, 0.002);
  for (const [a, b] of [[0.6, 1.0], [1.0, 1.425], [2.55, W]]) udoor(a, b, y0, yt);
  // built-in microwave at the bottom of the upper column between sink and hob (it used to be in the tall column)
  { const mx = (L(1.425) + L(1.85)) / 2, mw = 0.42;
    rb(g, mw, 0.38, 0.02, P.black, mx, y0 + 0.002, uf - 0.0105, 0.003);
    rb(g, mw - 0.12, 0.28, 0.006, P.blackGlass, mx - 0.045, y0 + 0.05, uf + 0.001, 0.003);
    rb(g, 0.07, 0.28, 0.006, P.steelDark, mx + mw / 2 - 0.05, y0 + 0.05, uf + 0.001, 0.003);
    udoor(1.425, 1.85, y0 + 0.385, yt); }
  // hood: brushed slab + LED, doors above
  rb(g, 0.7, 0.07, du + 0.03, P.brushed, L(2.2), y0, zc + 0.005, 0.004);
  rb(g, 0.6, 0.004, 0.25, P.black, L(2.2), y0 - 0.002, zc, 0.002);
  udoor(1.85, 2.55, y0 + 0.07, yt);
  // open niche (0 – 0.6): walnut box, two shelves, LED, plates, jars, a small jiboia
  const nx = L(0.3), nw = 0.6;
  rb(g, nw, yt - y0, 0.018, P.walnut, nx, y0, -d / 2 + 0.03, 0.002);                // back
  for (const y of [y0, yt - 0.018]) rb(g, nw, 0.018, du, P.walnut, nx, y, zc, 0.002);
  rb(g, 0.018, yt - y0, du, P.walnut, L(0.009), y0, zc, 0.002);
  for (const y of [1.92, 2.26]) {
    rb(g, nw - 0.04, 0.025, du - 0.03, P.walnut, nx, y, zc - 0.01, 0.002);
    rb(g, nw - 0.06, 0.005, 0.012, P.led, nx, y - 0.006, uf - 0.04, 0.002);
  }
  for (let i = 0; i < 6; i++) cylinder(g, 0.12, 0.11, 0.012, P.ceramic, nx - 0.13, y0 + 0.018 + i * 0.013, zc, 40);   // plate stack
  lathe(g, [[0, 0], [0.05, 0], [0.065, 0.06], [0.05, 0.16], [0.03, 0.2], [0.035, 0.22], [0, 0.21]], P.sand, nx + 0.12, y0 + 0.018, zc, 32);  // jug
  for (let i = 0; i < 3; i++) {                                                       // glass storage jars
    lathe(g, [[0, 0], [0.045, 0], [0.047, 0.16], [0, 0.16]], P.clearGlass, nx - 0.16 + i * 0.12, 1.945, zc, 24);
    cylinder(g, 0.048, 0.048, 0.025, P.walnut, nx - 0.16 + i * 0.12, 2.105, zc, 24);
    cylinder(g, 0.04, 0.04, 0.09 - i * 0.02, [P.sand, P.terracotta, P.books[1]][i], nx - 0.16 + i * 0.12, 1.947, zc, 20);
  }
  // LED strip + soft light under the uppers
  rb(g, w - 0.7, 0.006, 0.02, P.led, 0.3, y0 - 0.008, uf - 0.05, 0.002);
  const l = new THREE.RectAreaLight('#ffdcb0', 7, w - 0.3, 0.06); l.position.set(0, y0 - 0.012, uf - 0.06); l.rotation.x = -Math.PI / 2; g.add(l); addLight(l);
  // ---- counter styling ----
  // espresso machine
  rb(g, 0.24, 0.34, 0.34, P.black, L(0.28), top, -0.1, 0.02);
  rb(g, 0.2, 0.12, 0.006, P.brushed, L(0.28), top + 0.18, 0.073, 0.004);
  rb(g, 0.16, 0.012, 0.1, P.steelDark, L(0.28), top + 0.01, 0.1, 0.003);
  lathe(g, [[0, 0], [0.03, 0], [0.036, 0.06], [0.033, 0.06], [0.027, 0.006], [0, 0.006]], P.ceramic, L(0.28), top + 0.022, 0.1, 24);
  // walnut + oak cutting boards leaning on the backsplash
  rb(g, 0.36, 0.48, 0.022, P.walnut, L(1.6), top, -d / 2 + 0.05, 0.03, -0.12);
  rb(g, 0.28, 0.36, 0.02, P.oak, L(1.68), top, -d / 2 + 0.085, 0.03, -0.1);
  // utensil crock with wooden spoons
  lathe(g, [[0, 0], [0.055, 0], [0.058, 0.15], [0.052, 0.15], [0.05, 0.01], [0, 0.01]], P.sand, L(1.92), top, -0.12, 32);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6, tilt = 0.12 + (i % 2) * 0.08, sp = mesh(g, new THREE.CylinderGeometry(0.006, 0.006, 0.3, 8), P.oak, L(1.92) + Math.sin(a) * 0.02, top + 0.18, -0.12 + Math.cos(a) * 0.02, Math.cos(a) * tilt, 0, -Math.sin(a) * tilt);
    const head = mesh(g, new THREE.SphereGeometry(0.025, 14, 10), P.oak, L(1.92) + Math.sin(a) * 0.045, top + 0.33, -0.12 + Math.cos(a) * 0.045);
    head.scale.set(1, 1.5, 0.35); sp.castShadow = true;
  }
  // olive oil, salt cellar and pepper mill beside the hob
  lathe(g, [[0, 0], [0.032, 0], [0.033, 0.2], [0.012, 0.25], [0.011, 0.29], [0, 0.29]], std({ color: '#6b7a1e', roughness: 0.1, transparent: true, opacity: 0.85 }), L(2.62), top, -0.15, 24);
  lathe(g, [[0, 0], [0.04, 0], [0.045, 0.05], [0.04, 0.05], [0.035, 0.008], [0, 0.008]], P.walnut, L(2.72), top, -0.13, 24);
  cylinder(g, 0.022, 0.026, 0.16, P.walnut, L(2.72), top, -0.04, 20);
  // fruit bowl at the living end
  lathe(g, [[0, 0], [0.07, 0], [0.16, 0.06], [0.17, 0.075], [0.155, 0.072], [0.065, 0.014], [0, 0.014]], P.ceramic, L(2.85), top, 0.06, 40);
  const fm = [std({ color: '#e0a23c', roughness: 0.5 }), std({ color: '#8fb34a', roughness: 0.5 }), std({ color: '#c23b2a', roughness: 0.35 })];
  for (let i = 0; i < 7; i++) mesh(g, new THREE.SphereGeometry(0.036, 16, 12), fm[i % 3], L(2.85) + Math.cos(i * 1.3) * 0.07, top + 0.05 + (i > 4 ? 0.035 : 0), 0.06 + Math.sin(i * 1.3) * 0.07);
  return g;
}
P.rattan = phys({ color: '#b08a58', roughness: 0.85, bumpMap: weave, bumpScale: 2.5 });
P.appliance = phys({ color: '#f2f2f0', roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2 });
export function frontLoaderB(dryer = false) {            // 0.6 × 0.85 × 0.6 front-loading machine, front +z
  const g = new THREE.Group(), w = 0.6, h = 0.85, d = 0.58, fz = d / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylinder(g, 0.02, 0.02, 0.02, P.black, sx * 0.25, 0, sz * 0.22, 12);
  rb(g, w, h - 0.02, d, P.appliance, 0, 0.02, 0, 0.015);
  rb(g, w - 0.02, 0.13, 0.006, std({ color: '#e4e4e2', roughness: 0.35 }), 0, h - 0.15, fz, 0.004);   // control fascia
  rb(g, 0.16, 0.06, 0.004, P.blackGlass, 0.02, h - 0.12, fz + 0.006, 0.004);          // display
  mesh(g, new THREE.CylinderGeometry(0.032, 0.032, 0.025, 32), P.brushed, 0.17, h - 0.09, fz + 0.012, Math.PI / 2);   // dial
  mesh(g, new THREE.TorusGeometry(0.036, 0.004, 8, 32), P.steelDark, 0.17, h - 0.09, fz + 0.007);
  if (!dryer) {
    rb(g, 0.18, 0.08, 0.008, std({ color: '#ececea', roughness: 0.3 }), -0.18, h - 0.13, fz + 0.004, 0.006);  // detergent drawer
    rb(g, 0.1, 0.012, 0.004, P.steelDark, -0.18, h - 0.1, fz + 0.009, 0.004);
  } else {
    rb(g, 0.16, 0.12, 0.006, std({ color: '#e8e8e6', roughness: 0.4 }), -0.18, h - 0.14, fz + 0.003, 0.004);  // condenser water tank
  }
  // porthole door: chrome ring, smoked glass bowl, drum with perforations behind it
  const cy = 0.4, r = 0.2;
  mesh(g, new THREE.CircleGeometry(r + 0.03, 48), std({ color: '#d9d9d7', roughness: 0.3 }), 0, cy, fz + 0.002);
  mesh(g, new THREE.TorusGeometry(r, 0.028, 16, 64), dryer ? P.steelDark : P.brushed, 0, cy, fz + 0.025);
  const drum = canvasTex(256, 256, (c, W, Hh) => {
    c.fillStyle = '#8f9296'; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#3c3e42'; for (let y = 6; y < Hh; y += 14) for (let x = (y / 14 % 2) * 7 + 6; x < W; x += 14) { c.beginPath(); c.arc(x, y, 3, 0, 6.3); c.fill(); }
  });
  mesh(g, new THREE.CircleGeometry(r - 0.01, 48), std({ map: drum, metalness: 0.8, roughness: 0.4 }), 0, cy, fz + 0.004);
  const bowl = mesh(g, new THREE.SphereGeometry(r - 0.01, 40, 16, 0, Math.PI * 2, 0, Math.PI / 4), P.tintGlass, 0, cy, fz - 0.105, Math.PI / 2, 0, 0, false);
  bowl.scale.set(1, 0.9, 1);
  rb(g, 0.03, 0.09, 0.02, std({ color: '#cfcfcd', metalness: 0.6, roughness: 0.3 }), r + 0.01, cy - 0.045, fz + 0.03, 0.008);  // door handle
  if (!dryer) for (let i = 0; i < 3; i++) mesh(g, new THREE.SphereGeometry(0.05, 14, 10), [P.towel, P.sage, P.linen][i], -0.06 + i * 0.06, cy - 0.12 + (i % 2) * 0.03, fz - 0.15);   // laundry inside
  return g;
}
export function laundryRunB(w, d) {                      // local +x = south, front +z faces west
  const g = new THREE.Group(), h = 0.88, top = h + 0.04, fz = d / 2, L = s => -w / 2 + s;
  const door = (a, b, y0, y1, zf = fz) => rb(g, b - a - 0.004, y1 - y0 - 0.004, 0.019, P.walnut, (L(a) + L(b)) / 2, y0 + 0.002, zf - 0.0105, 0.002);
  // tall cabinet (0 – 0.64): boxes in the gas water heater (louvred top door) + brooms/ironing board
  rb(g, 0.64 - 0.004, H - 0.11, d - 0.03, P.lacquer, L(0.32), 0.1, -0.015, 0.003);
  rb(g, 0.6, 0.1, d - 0.08, P.black, L(0.32), 0, -0.04, 0.002);
  door(0, 0.32, 0.1, 1.75); door(0.32, 0.64, 0.1, 1.75); door(0, 0.64, 1.75, H - 0.01);
  for (let i = 0; i < 9; i++) rb(g, 0.5, 0.008, 0.006, P.black, L(0.32), 1.95 + i * 0.06, fz + 0.002, 0.002);   // vent slots for the heater
  for (const x of [0.29, 0.35]) rb(g, 0.014, 0.35, 0.022, P.black, L(x), 0.85, fz + 0.012, 0.004);           // slim pulls
  // washer + dryer under the counter
  { const m = frontLoaderB(false); m.position.set(L(1.83), 0, -0.01); g.add(m); }
  { const m = frontLoaderB(true); m.position.set(L(2.45), 0, -0.01); g.add(m); }
  // walnut end panel closing the appliance bay at the railing end
  rb(g, 0.018, h, d - 0.01, P.walnut, w / 2 - 0.009, 0, -0.005, 0.002);
  // tank cabinet (0.64 – 1.52, right after the heater, as on the plan) with a lowered carcass under the basin
  const tx0 = 0.64, tx1 = 1.52, tA = 0.74, tB = 1.42, tz0 = -d / 2 + 0.09, tz1 = d / 2 - 0.07, bd = 0.32;
  rb(g, tx1 - tx0 - 0.004, 0.1, d - 0.08, P.black, (L(tx0) + L(tx1)) / 2, 0, -0.04, 0.002);
  rb(g, L(tA) - L(tx0), h - 0.1, d - 0.03, P.lacquer, (L(tx0) + L(tA)) / 2, 0.1, -0.015, 0.003);
  rb(g, L(tx1) - L(tB), h - 0.1, d - 0.03, P.lacquer, (L(tB) + L(tx1)) / 2, 0.1, -0.015, 0.003);
  rb(g, L(tB) - L(tA), top - bd - 0.012 - 0.1, d - 0.03, P.lacquer, (L(tA) + L(tB)) / 2, 0.1, -0.015, 0.003);
  door(tx0, (tx0 + tx1) / 2, 0.1, h - 0.05); door((tx0 + tx1) / 2, tx1, 0.1, h - 0.05);
  rb(g, L(tx1) - L(tx0), 0.045, 0.01, P.black, (L(tx0) + L(tx1)) / 2, h - 0.048, fz - 0.025, 0.002);   // gola
  // quartzite top with the tank cut-out
  const slab = (a, b, z0, z1) => rb(g, b - a, 0.04, z1 - z0, P.quartz, (a + b) / 2, h, (z0 + z1) / 2, 0.002);
  slab(L(0.64), L(tA), -d / 2, d / 2 + 0.01); slab(L(tB), L(w), -d / 2, d / 2 + 0.01);
  slab(L(tA), L(tB), -d / 2, tz0); slab(L(tA), L(tB), tz1, d / 2 + 0.01);
  // deep quartzite tank with a ribbed washboard
  const bx = (L(tA) + L(tB)) / 2, bw = L(tB) - L(tA), bzc = (tz0 + tz1) / 2, bdp = tz1 - tz0;
  rb(g, bw, 0.012, bdp, P.quartz, bx, top - bd, bzc, 0.003);
  for (const s of [-1, 1]) {
    rb(g, 0.012, bd, bdp, P.quartz, bx + s * (bw / 2 - 0.006), top - bd, bzc, 0.002);
    rb(g, bw - 0.024, bd, 0.012, P.quartz, bx, top - bd, bzc + s * (bdp / 2 - 0.006), 0.002);
  }
  // integrated washboard: a solid sloped wedge at the back of the basin (rim → floor), ribbed on top
  { const iw = bw - 0.024, zb = tz0 + 0.012, yF = top - bd + 0.012, yT = top - 0.03, run = 0.22;
    const sh = new THREE.Shape(); sh.moveTo(zb, yT); sh.lineTo(zb, yF); sh.lineTo(zb + run, yF); sh.lineTo(zb, yT);
    const wedge = mesh(g, new THREE.ExtrudeGeometry(sh, { depth: iw, bevelEnabled: false }), P.quartz, bx + iw / 2, 0, 0, 0, -Math.PI / 2, 0);
    wedge.castShadow = false;
    const len = Math.hypot(run, yT - yF), nz = (yT - yF) / len, ny = run / len;   // outward normal of the slope
    for (let i = 1; i < 12; i++) {
      const t = i / 12, z = zb + run * t + nz * 0.003, y = yT - (yT - yF) * t + ny * 0.003;
      mesh(g, new THREE.CylinderGeometry(0.0055, 0.0055, iw - 0.01, 10), P.quartz, bx, y, z, 0, 0, Math.PI / 2);
    }
    rb(g, iw, 0.012, 0.03, P.quartz, bx, yT - 0.006, zb + 0.015, 0.004);             // flat lip at the top of the board
  }
  cylinder(g, 0.035, 0.035, 0.004, P.steelDark, bx - 0.12, top - bd + 0.012, (tz0 + 0.24 + tz1) / 2, 24);   // drain in the open part of the basin
  cylinder(g, 0.012, 0.012, 0.005, P.black, bx - 0.12, top - bd + 0.012, (tz0 + 0.24 + tz1) / 2, 12);
  // backsplash + wall-mounted tap above the tank
  rb(g, L(w) - L(0.64), 1.32 - top, 0.02, P.quartz, (L(0.64) + L(w)) / 2, top, -d / 2 + 0.01, 0.002);
  { const tz = -d / 2 + 0.02;
    mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 24), P.brushed, bx, 1.12, tz + 0.006, Math.PI / 2);
    mesh(g, new THREE.CylinderGeometry(0.012, 0.012, 0.34, 14), P.brushed, bx, 1.12, tz + 0.17, Math.PI / 2);
    mesh(g, new THREE.CylinderGeometry(0.012, 0.009, 0.05, 14), P.brushed, bx, 1.07, tz + 0.33);
    rb(g, 0.012, 0.012, 0.07, P.brushed, bx, 1.15, tz + 0.04, 0.004, 0, 0.6); }
  // open walnut shelf over the machines with detergents + woven baskets, LED underneath
  const sh0 = 1.52, sh1 = w, shy = 1.32, shd = 0.3, shz = -d / 2 + 0.02 + shd / 2;
  rb(g, L(sh1) - L(sh0), 0.03, shd, P.walnut, (L(sh0) + L(sh1)) / 2, shy, shz, 0.003);
  rb(g, L(sh1) - L(sh0) - 0.06, 0.005, 0.012, P.led, (L(sh0) + L(sh1)) / 2, shy - 0.006, shz + shd / 2 - 0.03, 0.002);
  const st = shy + 0.03;
  for (const [x, wdt] of [[1.72, 0.34], [2.12, 0.34]]) {                              // woven baskets
    rb(g, wdt, 0.18, 0.26, P.rattan, L(x), st, shz, 0.02);
    rb(g, wdt - 0.03, 0.005, 0.23, P.soil, L(x), st + 0.17, shz, 0.01);
  }
  const bottleCols = ['#f4f2ee', '#9fb7c9', '#d9c6a5'];
  for (let i = 0; i < 3; i++) {                                                      // detergent bottles (amber glass + pumps)
    const x = L(2.42 + i * 0.09);
    lathe(g, [[0, 0], [0.038, 0], [0.04, 0.17], [0.02, 0.2], [0.015, 0.21], [0, 0.21]], std({ color: bottleCols[i], roughness: 0.25 }), x, st, shz - 0.02, 24);
    cylinder(g, 0.006, 0.006, 0.05, P.black, x, st + 0.21, shz - 0.02, 8);
    rb(g, 0.035, 0.012, 0.012, P.black, x + 0.012, st + 0.25, shz - 0.02, 0.003);
  }
  // uppers to the ceiling over the tank, LED + soft light under them
  const du = 0.35, y0 = 1.6, zc = -d / 2 + 0.02 + du / 2, uf = zc + du / 2;
  rb(g, L(tx1) - L(tx0) - 0.004, H - 0.01 - y0, du - 0.02, P.lacquer, (L(tx0) + L(tx1)) / 2, y0, zc - 0.01, 0.003);
  door(tx0, (tx0 + tx1) / 2, y0, H - 0.01, uf); door((tx0 + tx1) / 2, tx1, y0, H - 0.01, uf);
  rb(g, L(tx1) - L(tx0) - 0.08, 0.006, 0.02, P.led, (L(tx0) + L(tx1)) / 2, y0 - 0.008, uf - 0.05, 0.002);
  const l = new THREE.RectAreaLight('#ffe2bf', 6, L(tx1) - L(tx0) - 0.1, 0.06); l.position.set((L(tx0) + L(tx1)) / 2, y0 - 0.012, uf - 0.06); l.rotation.x = -Math.PI / 2; g.add(l); addLight(l);
  // folded towel stack on the counter
  for (let i = 0; i < 3; i++) rb(g, 0.3, 0.05, 0.22, [P.towel, P.linen, P.sage][i], L(2.6), top + i * 0.05, 0.02, 0.02);
  return g;
}
// ---------------------------------------------------------------------------
export const showerTileTex = marble('#9e968c', '70,64,58', 0.22, '#857d74');
export function tileBox(ax, az, bx, bz, yb, yt) {
  const len = Math.max(Math.abs(X(bx) - X(ax)), Math.abs(Z(bz) - Z(az)));
  const t = showerTileTex.clone(); t.needsUpdate = true; t.repeat.set(len / 0.6, (yt - yb) / 1.2);
  box(ax, az, bx, bz, yb, yt, phys({ map: t, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.25 }), { collide: false });
}
export function vanity2B(w, d) {                         // floating fluted walnut vanity, front +z
  const g = new THREE.Group(), y0 = 0.42, hb = 0.4, top = y0 + hb + 0.04;
  rb(g, w - 0.02, hb, d - 0.05, P.walnut, 0, y0, -0.025, 0.004);                   // carcass
  const step = 0.02, n = Math.floor((w - 0.04) / step);                             // vertical walnut flutes
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0095, 0.0095, hb - 0.01, 10), P.walnut, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(-w / 2 + 0.02 + step / 2 + i * step, y0 + hb / 2, d / 2 - 0.03));
  im.castShadow = im.receiveShadow = true; g.add(im);
  rb(g, w, 0.04, d, P.quartz, 0, y0 + hb, 0, 0.004);                                // quartzite top
  rb(g, w - 0.06, 0.006, 0.02, P.led, 0, y0 - 0.008, d / 2 - 0.08, 0.002);          // LED under the floating unit
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.5), glowMat); fg.rotation.x = -Math.PI / 2; fg.position.set(0, 0.004, -d / 2 + 0.25); fg.renderOrder = 2; g.add(fg);
  // thin-walled oval vessel basin
  const basin = lathe(g, [[0, 0], [0.11, 0], [0.16, 0.035], [0.18, 0.1], [0.176, 0.115], [0.166, 0.112], [0.15, 0.04], [0.1, 0.016], [0, 0.016]], P.ceramic, 0, top, 0.03, 56);
  basin.scale.z = 0.72;
  cylinder(g, 0.022, 0.022, 0.004, P.steelDark, 0, top + 0.016, 0.03, 20);
  // black wall-mounted tap: plate, spout, lever
  rb(g, 0.16, 0.07, 0.008, P.black, 0, top + 0.22, -d / 2 + 0.004, 0.01);
  mesh(g, new THREE.CylinderGeometry(0.011, 0.011, 0.19, 14), P.black, 0, top + 0.255, -d / 2 + 0.1, Math.PI / 2);
  mesh(g, new THREE.CylinderGeometry(0.013, 0.013, 0.03, 14), P.black, 0.05, top + 0.255, -d / 2 + 0.02, Math.PI / 2);
  rb(g, 0.012, 0.012, 0.08, P.black, 0.05, top + 0.25, -d / 2 + 0.06, 0.004, 0.3);
  // arched mirror with an LED halo behind it
  const arch = (aw, ah) => { const s = new THREE.Shape(), r = aw / 2;
    s.moveTo(-r, -ah / 2); s.lineTo(r, -ah / 2); s.lineTo(r, ah / 2 - r); s.absarc(0, ah / 2 - r, r, 0, Math.PI, false); s.lineTo(-r, -ah / 2); return s; };
  const mw = Math.min(0.6, w * 0.62), mh = 0.95, my = 1.62;
  mesh(g, new THREE.ShapeGeometry(arch(mw + 0.04, mh + 0.04), 32), P.cove, 0, my, -d / 2 + 0.004, 0, 0, 0, false);
  mesh(g, new THREE.ShapeGeometry(arch(mw, mh), 32), P.mirror, 0, my, -d / 2 + 0.024, 0, 0, 0, false);
  mesh(g, new THREE.ShapeGeometry(arch(mw - 0.01, mh - 0.01), 32), P.black, 0, my, -d / 2 + 0.014, 0, 0, 0, false);
  // accessories: amber soap pump, small stone tray with a candle, a sprig of greenery
  const ax = w / 2 - 0.13;
  lathe(g, [[0, 0], [0.035, 0], [0.036, 0.14], [0.012, 0.16], [0, 0.16]], std({ color: '#8a4b16', roughness: 0.15, transparent: true, opacity: 0.9 }), ax, top, -0.08, 24);
  cylinder(g, 0.006, 0.006, 0.04, P.black, ax, top + 0.16, -0.08, 8); rb(g, 0.035, 0.01, 0.01, P.black, ax + 0.012, top + 0.195, -0.08, 0.003);
  rb(g, 0.18, 0.012, 0.12, P.quartz, -w / 2 + 0.16, top, -0.06, 0.004);
  cylinder(g, 0.035, 0.035, 0.07, P.sand, -w / 2 + 0.12, top + 0.012, -0.06, 24);
  lathe(g, [[0, 0], [0.025, 0], [0.03, 0.05], [0.015, 0.11], [0.018, 0.13], [0, 0.125]], P.ceramic, -w / 2 + 0.2, top + 0.012, -0.06, 24);
  leafCluster(g, -w / 2 + 0.2, top + 0.13, -0.06, 0.25, 6);
  return g;
}
// ===========================================================================
// 27 m² – STUDIO – layout traced from the brochure plan (≈ 118 px = 1 m,
// origin = outer top-left corner). Style after the "Living" and "Terraço" renders:
// light freijó joinery, cream bouclé, dusty-pink accents, fluted stone, amber glass pendants.
// ===========================================================================
// ---------- extra materials ----------
P.darkWood = phys({ map: veneer('#5b3b28', '25,12,5'), roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 });
P.blush = fabric('#c4948a', 2.2);
P.boucleW = fabric('#ece7de', 2.6);
P.jute = phys({ color: '#8f8472', roughness: 1, sheen: 0.4, sheenColor: new THREE.Color('#c9bda8'), bumpMap: pile, bumpScale: 3 });
P.goldM = std({ color: '#c9a14a', metalness: 1, roughness: 0.25 });
P.amberGlass = phys({ color: '#e9c48f', roughness: 0.04, transparent: true, opacity: 0.38, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
P.onyx = phys({ map: quartzTex, color: '#f4dfcc', roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.1 });
P.railBlack = std({ color: '#2a2d33', metalness: 0.6, roughness: 0.45 });
export const flameTex = canvasTex(128, 128, (g, w, h) => {
  for (let i = 0; i < 5; i++) {
    const cx = 16 + i * 24, hh = 70 + (i % 3) * 20, gr = g.createRadialGradient(cx, h - 10, 2, cx, h - hh * 0.5, hh * 0.6);
    gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.3, 'rgba(255,190,80,0.9)'); gr.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 12, h - 6); g.quadraticCurveTo(cx - 14, h - hh * 0.6, cx, h - hh); g.quadraticCurveTo(cx + 14, h - hh * 0.6, cx + 12, h - 6); g.fill();
  }
});
P.flame = new THREE.MeshBasicMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });

// ---------- extra builders ----------
export function pinkChairB() {                           // walnut dining chair, curved back slat, dusty-pink seat, front +z
  const g = new THREE.Group(), W = P.darkWood;
  for (const sx of [-1, 1]) {
    rb(g, 0.034, 0.45, 0.034, W, sx * 0.2, 0, 0.18, 0.008, 0.04);
    rb(g, 0.034, 0.84, 0.034, W, sx * 0.2, 0, -0.18, 0.008, -0.08);
    rb(g, 0.03, 0.03, 0.36, W, sx * 0.2, 0.4, 0, 0.006);
  }
  rb(g, 0.42, 0.03, 0.03, W, 0, 0.4, 0.18, 0.006);
  rb(g, 0.46, 0.07, 0.44, P.blush, 0, 0.43, 0.01, 0.03);                            // seat (top 0.50)
  for (let i = 0; i < 5; i++) {                                                     // curved back slat
    const a = (i - 2) * 0.2;
    rb(g, 0.105, 0.17, 0.026, W, Math.sin(a) * 0.5, 0.66, 0.3 - Math.cos(a) * 0.5, 0.01, -0.1, -a);
  }
  return g;
}
export function stoolB() {                               // counter stool, front +z
  const g = new THREE.Group(), sh = 0.66;
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    mesh(g, new THREE.CylinderGeometry(0.014, 0.012, sh, 10), P.darkWood, Math.cos(a) * 0.15, sh / 2, Math.sin(a) * 0.15, Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08);
  }
  mesh(g, new THREE.TorusGeometry(0.165, 0.007, 8, 40), P.goldM, 0, 0.26, 0, Math.PI / 2);
  lathe(g, [[0, 0], [0.19, 0], [0.2, 0.02], [0.2, 0.05], [0.18, 0.07], [0, 0.07]], P.blush, 0, sh, 0, 40);
  mesh(g, new THREE.TorusGeometry(0.17, 0.028, 12, 40, Math.PI), P.blush, 0, sh + 0.17, 0, -Math.PI / 2, 0, 0);
  for (const s of [-1, 1]) mesh(g, new THREE.CylinderGeometry(0.012, 0.012, 0.16, 10), P.darkWood, s * 0.17, sh + 0.09, 0);   // back posts
  return g;
}
export function roundCoffeeB(r = 0.44) {                 // wood-rimmed glass coffee table (render)
  const g = new THREE.Group(), h = 0.38;
  mesh(g, new THREE.TorusGeometry(r, 0.035, 16, 72), P.walnut, 0, h, 0, Math.PI / 2);
  mesh(g, new THREE.CylinderGeometry(r - 0.01, r - 0.01, 0.012, 64), P.clearGlass, 0, h + 0.004, 0, 0, 0, 0, false);
  cylinder(g, r - 0.08, r - 0.08, 0.025, P.walnut, 0, 0.12, 0, 64);
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; rb(g, 0.06, h - 0.03, 0.06, P.walnut, Math.cos(a) * (r - 0.05), 0, Math.sin(a) * (r - 0.05), 0.012); }
  books(g, -0.12, 0.145, 0.05, 3, 0.3);
  const pl = plantB(0, 0, 0.45, P.terracotta); pl.position.set(-0.12, h + 0.012, -0.12); g.add(pl);
  lathe(g, [[0, 0], [0.04, 0], [0.11, 0.05], [0.12, 0.07], [0.105, 0.066], [0.035, 0.01], [0, 0.01]], P.black, 0.14, h + 0.012, 0.06, 40);
  return g;
}
export function armchairB() {                            // dusty-pink barrel armchair (render): curved upholstered shell, plump round seat, walnut legs + side arms, front +z
  const g = new THREE.Group(), RO = 0.40, RI = 0.29, bev = 0.045;
  // walnut base: four tapered legs, side rails, open front post + arm rail on each side
  for (const sx of [-1, 1]) {
    for (const z of [0.27, -0.25]) cylinder(g, 0.024, 0.018, 0.2, P.darkWood, sx * 0.33, 0, z, 16);
    rb(g, 0.04, 0.04, 0.58, P.darkWood, sx * 0.33, 0.16, 0.01, 0.012);             // side rail
    rb(g, 0.045, 0.42, 0.045, P.darkWood, sx * 0.415, 0.16, 0.25, 0.015);          // front post
    rb(g, 0.05, 0.04, 0.42, P.darkWood, sx * 0.415, 0.56, 0.07, 0.015);            // arm rail running back into the shell
  }
  for (const z of [0.27, -0.25]) rb(g, 0.62, 0.04, 0.04, P.darkWood, 0, 0.16, z, 0.012);
  // upholstered base + plump round seat cushion
  cylinder(g, RO - 0.02, RO - 0.02, 0.14, P.blush, 0, 0.2, 0, 64);
  lathe(g, [[0, 0], [RI + 0.02, 0], [RI + 0.06, 0.03], [RI + 0.07, 0.07], [RI + 0.05, 0.12], [RI, 0.14], [0, 0.145]], P.blush, 0, 0.34, 0.03, 64);
  // curved back + arms: a thick arc (≈ 230°, open to the front) extruded upward with soft rounded edges
  const a0 = Math.PI / 2 - 2.0, a1 = Math.PI / 2 + 2.0, s = new THREE.Shape();
  s.absarc(0, 0, RO - bev, a0, a1, false);
  s.absarc(0, 0, RI + bev, a1, a0, true);
  s.closePath();
  mesh(g, new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 6, curveSegments: 64 }),
    P.blush, 0, 0.34 + bev, 0, -Math.PI / 2);                                         // shape +y → back (-z), extrusion → up; top ≈ 0.79 m
  return g;
}
export function goldSideB() {                            // brass-stem side table with a walnut top and cone base
  const g = new THREE.Group();
  lathe(g, [[0, 0], [0.12, 0], [0.06, 0.16], [0, 0.16]], P.darkWood);
  cylinder(g, 0.01, 0.01, 0.42, P.goldM, 0, 0.16, 0, 12);
  cylinder(g, 0.21, 0.21, 0.02, P.darkWood, 0, 0.58, 0, 48);
  return g;
}
export function pedestalTableB(w, d) {                   // rectangular wood table on a tapered (trapezoid) pedestal
  const g = new THREE.Group(), top = 0.75;
  const tm = P.walnut.clone(); tm.map = P.walnut.map.clone(); tm.map.needsUpdate = true; tm.map.rotation = Math.PI / 2; tm.map.center.set(0.5, 0.5);
  rb(g, w, 0.035, d, tm, 0, top - 0.035, 0, 0.006);
  rb(g, w - 0.04, 0.012, d - 0.04, P.walnut, 0, top - 0.047, 0, 0.004);
  for (const [bw, bd] of [[0.9, 0.12], [0.12, 0.5]]) {                               // two crossed tapered boards
    const geo = new THREE.BoxGeometry(bw, top - 0.05, bd), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * (bw > 0.5 ? 0.35 : 1)); p.setZ(i, p.getZ(i) * (bd > 0.3 ? 0.35 : 1)); }
    geo.computeVertexNormals(); mesh(g, geo, P.walnut, 0, (top - 0.05) / 2, 0);
  }
  // glass vase with dried flowers (render)
  lathe(g, [[0, 0], [0.06, 0], [0.07, 0.08], [0.05, 0.2], [0.055, 0.24], [0, 0.235]], P.clearGlass, 0, top, 0, 32);
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996, tilt = 0.1 + (i % 4) * 0.12, len = 0.35 + (i % 3) * 0.08;
    const dir = new THREE.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt));
    const st = mesh(g, new THREE.CylinderGeometry(0.003, 0.003, len, 5), P.dried, 0, 0, 0, 0, 0, 0, false);
    st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); st.position.set(0, top + 0.12, 0).addScaledVector(dir, len / 2);
    const tip = new THREE.Vector3(0, top + 0.12, 0).addScaledVector(dir, len);
    mesh(g, new THREE.SphereGeometry(0.018 + (i % 3) * 0.006, 10, 8), P.dried, tip.x, tip.y, tip.z);
  }
  return g;
}
P.dried = P.dried || std({ color: '#b48a5e', roughness: 0.9 });
export function glassPendant(px, pz, y) {                // amber glass capsule pendant with a brass canopy
  const x = X(px), z = Z(pz);
  mesh(ceilingGroup, new THREE.CylinderGeometry(0.045, 0.045, 0.015, 24), P.goldM, x, H - 0.008, z);
  mesh(ceilingGroup, new THREE.CylinderGeometry(0.0022, 0.0022, H - y - 0.16), P.black, x, (H + y + 0.16) / 2, z);
  cylinder(world, 0.022, 0.022, 0.035, P.goldM, x, y + 0.13, z, 16);
  mesh(world, new THREE.CapsuleGeometry(0.085, 0.12, 8, 24), P.amberGlass, x, y, z, 0, 0, 0, false);
  const b = mesh(world, new THREE.SphereGeometry(0.018, 12, 8), P.led, x, y, z, 0, 0, 0, false); b.scale.y = 2.2;
}
export function rainShower(wx, wz, hx, hz) {             // ceiling-height arm from a wall point to the head (plan px)
  const a = new THREE.Vector3(X(wx), 2.18, Z(wz)), b = new THREE.Vector3(X(hx), 2.18, Z(hz)), len = a.distanceTo(b);
  const arm = mesh(world, new THREE.CylinderGeometry(0.01, 0.01, len, 10), P.black, 0, 0, 0);
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); arm.position.copy(a).lerp(b, 0.5);
  mesh(world, new THREE.CylinderGeometry(0.12, 0.12, 0.012, 40), P.black, b.x, 2.16, b.z);
  const m = mesh(world, new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24), P.black, a.x, 1.15, a.z);
  m.quaternion.copy(arm.quaternion);
}
export function towelRail(px, pz, alongX, out) {         // black rail + towel on a wall; out = ±1 side of the room
  const x = X(px), z = Z(pz);
  if (alongX) {
    mesh(world, new THREE.CylinderGeometry(0.008, 0.008, 0.5), P.black, x, 1.15, z + out * 0.035, 0, 0, Math.PI / 2);
    mesh(world, RBG(0.42, 0.55, 0.035, 0.015), P.towel, x, 0.9, z + out * 0.035);
  } else {
    mesh(world, new THREE.CylinderGeometry(0.008, 0.008, 0.5), P.black, x + out * 0.035, 1.15, z, Math.PI / 2);
    mesh(world, RBG(0.035, 0.55, 0.42, 0.015), P.towel, x + out * 0.035, 0.9, z);
  }
}
export function railingBars(ax, az, bx, bz) {            // low white curb + black vertical bars (render)
  const c = (az + bz) / 2, z = Z(c), x0 = X(ax), x1 = X(bx), n = Math.floor((x1 - x0) / 0.1);
  box(ax, az, bx, bz, 0, 0.14, M.wall);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.96, 0.018), P.railBlack, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) im.setMatrixAt(i, m4.makeTranslation(x0 + 0.05 + i * 0.1, 0.14 + 0.48, z));
  im.castShadow = true; world.add(im);
  box(ax, c - 2, bx, c + 2, 1.1, 1.14, P.railBlack, { collide: false });
  colliders.push({ x0, x1, z0: z - 0.12, z1: z + 0.12 });
}
// recessed plaster ceiling band (sanca) with indirect light washing the centre of the ceiling
export function sanca(ax, az, bx, bz, bandPx = 45, drop = 0.16) {
  const by = H - drop;
  box(ax, az, bx, az + bandPx, by, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  box(ax, bz - bandPx, bx, bz, by, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  box(ax, az + bandPx, ax + bandPx, bz - bandPx, by, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  box(bx - bandPx, az + bandPx, bx, bz - bandPx, by, H, M.ceiling, { collide: false, cast: false, parent: ceilingGroup });
  const ix0 = X(ax + bandPx), ix1 = X(bx - bandPx), iz0 = Z(az + bandPx), iz1 = Z(bz - bandPx);
  const side = (cx, cz, len, rotY) => {
    const grp = new THREE.Group(), pl = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.8), glowMat);
    pl.rotation.x = Math.PI / 2; pl.position.z = -0.4; pl.renderOrder = 2; grp.add(pl);
    grp.position.set(cx, H - 0.006, cz); grp.rotation.y = rotY; ceilingGroup.add(grp);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(len, 0.01, 0.01), P.cove); strip.position.set(0, by + 0.005 - (H - 0.006), 0.0); grp.add(strip);
  };
  side((ix0 + ix1) / 2, iz0, ix1 - ix0, Math.PI); side((ix0 + ix1) / 2, iz1, ix1 - ix0, 0);
  side(ix0, (iz0 + iz1) / 2, iz1 - iz0, -Math.PI / 2); side(ix1, (iz0 + iz1) / 2, iz1 - iz0, Math.PI / 2);
}

