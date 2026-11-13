// Premium lift halls / corridors for the térreo, 1º and 2º pavimentos – same language as the leisure rooms:
// travertine-clad lift wall with champagne-bronze portals, fluted walnut panels, limewash plaster,
// brass sconces, LED coves at the ceiling, warm stone floor with a walnut inlay.
// Builders work in local metres, footprint centred on the origin, FRONT faces +z, back on z = 0 (the wall face).
// makeCorridor() wraps them for a floor whose plan is drawn in IMAGE pixels (see siteKit.js).
import * as THREE from 'three';
import { H, P, addLight, canvasTex, cove, marble, mesh, phys, rb, std, world } from '../engine/core.js';
import { PK } from './premiumKit.js';
import { brassSconce } from './pav2Kit.js';

export const CK = {
  bronze: std({ color: '#c09a6b', metalness: 0.6, roughness: 0.3 }),                      // portal frames, trims
  leaf: phys({ color: '#d6c3a3', metalness: 0.3, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.15 }),   // champagne stainless doors
  reveal: std({ color: '#141210', roughness: 0.8 }),
  limewash: std({ color: '#e4d8c6', roughness: 0.97 }),
  floorTex: marble('#d8c8ae', '150,126,96', 0.18, '#bfae94'),
  inlay: phys({ color: '#5a3d2b', roughness: 0.4, clearcoat: 0.5 }),
};

// floor indicator: amber arrow + floor label on black glass
const indicatorMat = new Map();
function indicator(label) {
  if (!indicatorMat.has(label)) {
    const t = canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffb45a'; g.font = 'bold 46px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.beginPath(); g.moveTo(70, 44); g.lineTo(86, 20); g.lineTo(102, 44); g.closePath(); g.fill();
      g.fillText(label, 160, 34);
    });
    indicatorMat.set(label, std({ color: '#050505', roughness: 0.1, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 1.4 }));
  }
  return indicatorMat.get(label);
}
const btnRing = std({ color: '#ffffff', emissive: '#ffe6c0', emissiveIntensity: 1.6 });

// lift landing door: two champagne leaves in a dark reveal, bronze portal, threshold, floor indicator, call panel
export function elevatorB(label = 'T', w = 1.1, h = 2.15) {
  const g = new THREE.Group(), fw = 0.075, fd = 0.05;
  rb(g, w + 0.02, h + 0.01, 0.012, CK.reveal, 0, 0, 0.006, 0.002);                       // reveal (depth behind the leaves)
  for (const s of [-1, 1]) {
    rb(g, w / 2 - 0.004, h - 0.004, 0.024, CK.leaf, s * (w / 4 + 0.002), 0.002, 0.024, 0.003);
    rb(g, 0.004, h - 0.3, 0.002, CK.bronze, s * (w / 2 - 0.09), 0.15, 0.037, 0.001);     // hairline accents
  }
  for (const s of [-1, 1]) rb(g, fw, h + fw, fd, CK.bronze, s * (w / 2 + fw / 2), 0, fd / 2, 0.005);   // jambs
  rb(g, w + 2 * fw, fw, fd, CK.bronze, 0, h, fd / 2, 0.005);                             // head
  rb(g, w + 2 * fw, 0.005, 0.11, P.brushed, 0, 0, 0.055, 0.002);                          // threshold
  // floor indicator over the head
  rb(g, 0.36, 0.1, 0.018, PK.matBlack, 0, h + fw + 0.1, 0.009, 0.004);
  mesh(g, new THREE.PlaneGeometry(0.32, 0.08), indicator(label), 0, h + fw + 0.15, 0.0185, 0, 0, 0, false);
  // call panel on the right of the door (as you face it): bronze plate, two lit buttons
  const px = w / 2 + fw + 0.2;
  rb(g, 0.09, 0.24, 0.012, CK.bronze, px, 0.98, 0.006, 0.004);
  for (const y of [1.15, 1.05]) {
    mesh(g, new THREE.CylinderGeometry(0.017, 0.017, 0.006, 24), P.brushed, px, y, 0.015, Math.PI / 2, 0, 0, false);
    mesh(g, new THREE.TorusGeometry(0.019, 0.0025, 6, 24), btnRing, px, y, 0.017, 0, 0, 0, false);
  }
  return g;
}

// walnut door with a bronze frame + pull and a small sign (stairs / service)
export function doorB(w = 0.95, h = 2.1, sign = '') {
  const g = new THREE.Group(), fw = 0.05;
  rb(g, w, h, 0.03, PK.walnutDark, 0, 0, 0.02, 0.004);
  for (let x = -w / 2 + 0.08; x < w / 2 - 0.05; x += 0.08) rb(g, 0.012, h - 0.12, 0.006, PK.walnutDark, x, 0.06, 0.037, 0.002);   // grooves
  for (const s of [-1, 1]) rb(g, fw, h + fw, 0.04, CK.bronze, s * (w / 2 + fw / 2), 0, 0.02, 0.004);
  rb(g, w + 2 * fw, fw, 0.04, CK.bronze, 0, h, 0.02, 0.004);
  rb(g, 0.022, 0.6, 0.03, CK.bronze, w / 2 - 0.12, 0.75, 0.06, 0.01);                     // long pull
  if (sign) {
    const t = canvasTex(256, 64, (c, cw, ch) => { c.fillStyle = '#2b2622'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#e8d6b5'; c.font = '600 30px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sign, cw / 2, ch / 2 + 2); });
    mesh(g, new THREE.PlaneGeometry(0.26, 0.065), std({ map: t, roughness: 0.5 }), 0, 1.6, 0.038, 0, 0, 0, false);
  }
  return g;
}

// ---------------------------------------------------------------------------
// per-floor wrapper: ppm = image px per metre; kit = makeKit() result (bx, fl, W)
// side: 'S' = the wall is on the larger-iy side (things face image up), 'N' = smaller-iy side (face image down)
// ---------------------------------------------------------------------------
export function makeCorridor({ bx, fl, W, ppm }) {
  const m = v => v * ppm, nc = { collide: false, cast: false };
  const rot = side => side === 'S' ? Math.PI / 2 : -Math.PI / 2;
  const off = (side, iyFace, d) => side === 'S' ? [iyFace - m(d), iyFace] : [iyFace, iyFace + m(d)];
  const put = (g, ix, iy, side, y = 0) => { const [x, z] = W(ix, iy); g.position.set(x, y, z); g.rotation.y = rot(side); world.add(g); return g; };

  return {
    // warm stone floor (plain – no inlay lines)
    floor(ix0, iyN, ix1, iyS) {
      fl(ix0, iyN, ix1, iyS, CK.floorTex, 1.2, 0.28, 0.006);
    },
    // travertine cladding to the ceiling, bronze shadow line at the floor, LED cove above
    stone(a, b, iyFace, side, h = H) {
      const [y0, y1] = off(side, iyFace, 0.025);
      bx(a, y0, b, y1, 0, h - 0.002, PK.travertine, { collide: false });
      const [s0, s1] = off(side, iyFace, 0.03); bx(a, s0, b, s1, 0, 0.05, CK.bronze, nc);
      this.cove(a, b, side === 'S' ? y0 : y1, side);
    },
    // fluted walnut panel (instanced slats) with an LED reveal at the top
    slats(a, b, iyFace, side, h = H - 0.004) {
      const [y0, y1] = off(side, iyFace, 0.02); bx(a, y0, b, y1, 0, h, PK.walnutDark, { collide: false });
      const step = m(0.05), n = Math.floor((b - a - m(0.02)) / step), sw = 0.03, geo = new THREE.BoxGeometry(sw, h - 0.06, 0.018);
      const im = new THREE.InstancedMesh(geo, PK.walnutDark, n), mm = new THREE.Matrix4(), dir = side === 'S' ? -1 : 1;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), sc = new THREE.Vector3(1, 1, 1);   // slats built along x, corridor runs along world z
      for (let i = 0; i < n; i++) { const [x, z] = W(a + m(0.035) + i * step, iyFace + dir * m(0.029)); im.setMatrixAt(i, mm.compose(new THREE.Vector3(x, 0.03 + (h - 0.06) / 2, z), q, sc)); }
      im.castShadow = false; im.receiveShadow = true;
      world.add(im);
      this.cove(a, b, side === 'S' ? y0 - m(0.02) : y1 + m(0.02), side);
    },
    // limewash plaster panel (covers the white wall + its skirting) with a bronze base line
    plaster(a, b, iyFace, side) {
      const [y0, y1] = off(side, iyFace, 0.018); bx(a, y0, b, y1, 0, H - 0.003, CK.limewash, { collide: false });
      const [s0, s1] = off(side, iyFace, 0.024); bx(a, s0, b, s1, 0, 0.06, PK.walnutDark, nc);
    },
    cove(a, b, iyFace, side) { const [x] = W(a, iyFace), [, z0] = W(a, iyFace), [, z1] = W(b, iyFace); cove(x, z0, z1, side === 'S' ? 1 : -1); },
    lifts(cxs, iyFace, label, w = 1.1) { for (const cx of cxs) put(elevatorB(label, w), cx, iyFace, 'S'); },
    door(cx, iyFace, side, w, sign) { put(doorB(w, 2.1, sign), cx, iyFace, side); },
    sconce(ix, iyFace, side, y = 1.75) {
      put(brassSconce(), ix, iyFace + (side === 'S' ? -m(0.02) : m(0.02)), side, y);
    },
    light(ix, iy, i = 0.9) { const l = addLight(new THREE.PointLight('#ffd2a0', i, 5, 2)); const [x, z] = W(ix, iy); l.position.set(x, H - 0.35, z); world.add(l); },
  };
}
