// Helpers for building levels traced from the brochure's site plans (implantação), drawn with north to
// the RIGHT. Coordinates are written in IMAGE pixels (ix → right, iy → down) and converted to the
// engine's plan frame:  plan px = −iy·K,  plan pz = ix·K.
// Image directions: right = north (+z), left = south, up = west (+x), down = east (−x).
import * as THREE from 'three';
import { X, Z } from '../engine/plan.js';
import { H, M, at, box, ceilingGroup, floor, item, wall } from '../engine/core.js';

export const FACE_IMG = { right: 's', left: 'n', up: 'e', down: 'w' };              // image direction → engine face
export const ROT_IMG = { right: 0, left: Math.PI, up: Math.PI / 2, down: -Math.PI / 2 }; // image direction → rotation.y

export function makeKit(K) {
  const lo = Math.min, hi = Math.max;
  const bx = (ix0, iy0, ix1, iy1, y0, y1, mat, o) => box(-iy0 * K, ix0 * K, -iy1 * K, ix1 * K, y0, y1, mat, o);
  const fl = (ix0, iy0, ix1, iy1, tex, tile, rough, y) => floor(-hi(iy0, iy1) * K, lo(ix0, ix1) * K, -lo(iy0, iy1) * K, hi(ix0, ix1) * K, tex, tile, rough, y);
  function wl(ix0, iy0, ix1, iy1, ops = [], mat = M.wall, h = H) {   // openings in image px along the wall
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
  // plan coordinates for the .meta.js files
  const p = (ix, iy) => [-iy * K, ix * K];
  const r = (ix0, iy0, ix1, iy1) => [-iy1 * K, ix0 * K, -iy0 * K, ix1 * K];
  return { bx, fl, wl, it, atI, W, ceil, p, r };
}
