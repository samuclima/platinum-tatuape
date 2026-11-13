// Studio 27m² 3D - everything the shared runtime needs to know about this apartment.
// Plan coordinates are pixels on the brochure plan; X()/Z() convert them to metres.
export const meta = {
  id: '27',
  title: "Studio 27m² 3D",
  heading: "<b>27m²</b> – Studio",
  lead: "Life-size 3D walkthrough built from the floor plan (≈ 101 px = 1 m).",
  plan: { PX: 118, OX: 751, OY: 108, },
  spawn: [1064, 170, Math.PI],                          // plan x, plan y, yaw (radians)
  top: { at: [1000, 530], height: 12, back: 6 },  // V view: orbit centre (plan px), camera height + offset (m)
  mapScale: 26,                                          // minimap pixels per metre
  sun: { from: [1000, 953], at: [1000, 530] },
  downlights: [
  [1070, 200, 7], [1070, 330, 7], [900, 560, 8], [1080, 520, 7], [1080, 650, 7],
  [880, 300, 6], [870, 180, 5], [1000, 830, 6], [950, 25, 6], [1350, 25, 6],
],
  windows: [
  [1015, 730, 2.1, 2.25, 1.15, 0, -1, 2.8],
],                                        // daylight area lights: cx, cz, w, h, y, nx, nz, intensity
  tower: { depth: 953, east: 1242, wing: [751, -70], extra: [] },
  pinPole: false,
  rooms: [
  { name: 'Banho', r: [775, 133, 935, 410], c: '#b9c4cc' },
  { name: 'Cozinha', r: [950, 133, 1218, 425], c: '#e6e1d8' },
  { name: 'Estar / Dorm', r: [775, 425, 1218, 730], c: '#c99f6e' },
  { name: 'Terraço', r: [775, 755, 1218, 912], c: '#d0c7b6' },
  { name: 'Hall (área comum)', r: [766, -55, 1700, 108], c: '#cfcac0' },
  ],
};
