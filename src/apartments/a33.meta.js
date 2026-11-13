// Apartamento 33m² 3D - everything the shared runtime needs to know about this apartment.
// Plan coordinates are pixels on the brochure plan; X()/Z() convert them to metres.
export const meta = {
  id: '33',
  title: "Apartamento 33m² 3D",
  heading: "<b>33m²</b> – 1 suíte",
  lead: "Life-size 3D walkthrough built from the floor plan (≈ 101 px = 1 m).",
  plan: { PX: 112, OX: 713, OY: 202, },
  spawn: [1132, 275, Math.PI],                          // plan x, plan y, yaw (radians)
  top: { at: [1010, 600], height: 12, back: 6 },  // V view: orbit centre (plan px), camera height + offset (m)
  mapScale: 26,                                          // minimap pixels per metre
  sun: { from: [1010, 997], at: [1010, 600] },
  downlights: [
  [1150, 300, 7], [1150, 420, 7], [1150, 560, 7], [1150, 690, 7],
  [868, 570, 8], [868, 700, 8], [900, 400, 6], [785, 420, 5],
  [1080, 890, 6], [1250, 130, 6], [1500, 130, 6],
],
  windows: [
  [1160, 797, 2.2, 2.25, 1.15, 0, -1, 2.5], [876, 797, 1.6, 1.2, 1.6, 0, -1, 3],
],                                        // daylight area lights: cx, cz, w, h, y, nx, nz, intensity
  tower: { depth: 997, east: 1315, wing: [845, 45], extra: [[[713, 997, 997, 713], [202, 202, 280, 280]]] },
  pinPole: false,
  rooms: [
  { name: 'Banho', r: [737, 305, 1000, 450], c: '#b9c4cc' },
  { name: 'Suíte', r: [737, 465, 1000, 797], c: '#c99f6e' },
  { name: 'Cozinha', r: [1020, 228, 1290, 505], c: '#e6e1d8' },
  { name: 'Estar / Jantar', r: [1020, 505, 1290, 797], c: '#e6e1d8' },
  { name: 'Terraço', r: [978, 822, 1290, 968], c: '#d0c7b6' },
  { name: 'Área Técnica', r: [737, 822, 968, 968], c: '#9a9a98' },
  { name: 'Hall (área comum)', r: [860, 60, 1700, 202], c: '#cfcac0' },
  ],
};
