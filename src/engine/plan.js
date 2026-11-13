// Per-apartment plan scale + origin, and the few engine settings that differ between apartments.
// setPlan() MUST run before core.js is first imported: core builds its textures at load time.
//
// Plan coordinates are pixels on the brochure floor plan: PX pixels = 1 m, (OX, OY) = the unit's
// outer top-left corner. X()/Z() convert plan pixels to metres in the 3D world.
export const CFG = {
  walnutTone: [[178, 132, 92], [186, 140, 98]],   // walnut veneer: [plain leaf, seamed wall-panel leaf]
  noiseBlur: true,                                 // soften bump-noise textures (no sparkle while moving)
};
export let PX = 100, OX = 0, OY = 0;
export function setPlan(plan) {
  ({ PX, OX, OY } = plan);
  for (const k of Object.keys(CFG)) if (plan[k] !== undefined) CFG[k] = plan[k];
}
export const X = p => (p - OX) / PX;
export const Z = p => (p - OY) / PX;
