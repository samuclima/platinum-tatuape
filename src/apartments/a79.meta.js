// Apartamento 79m² 3D - everything the shared runtime needs to know about this apartment.
// Plan coordinates are pixels on the brochure plan; X()/Z() convert them to metres.
export const meta = {
  id: '79',
  title: "Apartamento 79m² 3D",
  heading: "<b>79m²</b> – 2 dorms (1 suíte)",
  lead: "Life-size 3D walkthrough built from the floor plan (≈ 86 px = 1 m).",
  plan: { PX: 86, OX: 568, OY: 197,
    // built with a dark walnut and without the noise-texture blur
    walnutTone: [[90, 63, 44], [96, 67, 47]], noiseBlur: false,
  },
  spawn: [1120, 390, Math.PI],                          // plan x, plan y, yaw (radians)
  top: { at: [1000, 570], height: 16, back: 7 },  // V view: orbit centre (plan px), camera height + offset (m)
  mapScale: 24,                                          // minimap pixels per metre
  sun: { from: [1300, 950], at: [1000, 570] },
  downlights: [
  [1135, 470, 8], [1135, 600, 8], [960, 385, 6], [1320, 420, 7], [1320, 600, 7],
  [700, 440, 7], [700, 600, 6], [740, 280, 6], [880, 280, 6],
  [960, 720, 7], [1090, 720, 7], [1320, 790, 6],
],
  windows: [
  [1121, 655, 1.8, 2.25, 1.15, 0, -1, 2.5],
  [703, 655, 1.65, 1.15, 1.6, 0, -1, 3], [940, 655, 1.35, 1.15, 1.6, 0, -1, 3],
],                                        // daylight area lights: cx, cz, w, h, y, nx, nz, intensity
  tower: { depth: 943, east: 1433, wing: [1276, 45], extra: [] },
  pinPole: true,
  rooms: [
  { name: 'Banho 01', r: [588, 215, 808, 335], c: '#b9c4cc' },
  { name: 'Banho 02', r: [828, 215, 1024, 335], c: '#b9c4cc' },
  { name: 'Suíte', r: [588, 347, 808, 655], c: '#c99f6e' },
  { name: 'Dorm. 01', r: [825, 432, 1030, 655], c: '#c99f6e' },
  { name: 'Cozinha', r: [1255, 300, 1415, 655], c: '#e6e1d8' },
  { name: 'Estar / Jantar', r: [825, 215, 1415, 655], c: '#e6e1d8' },
  { name: 'Terraço de Serviço', r: [1258, 668, 1415, 925], c: '#d0c7b6' },
  { name: 'Terraço', r: [808, 668, 1258, 925], c: '#d0c7b6' },
  { name: 'Área Técnica', r: [588, 672, 800, 757], c: '#9a9a98' },
  { name: 'Hall (área comum)', r: [1290, 59, 2374, 197], c: '#cfcac0' },
  ],
};
