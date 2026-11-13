// Apartamento 61m² 3D - everything the shared runtime needs to know about this apartment.
// Plan coordinates are pixels on the brochure plan; X()/Z() convert them to metres.
export const meta = {
  id: '61',
  title: 'Apartamento 61m² 3D',
  heading: '<b>61m²</b> – 2 dorms (1 suíte)',
  lead: 'Life-size 3D walkthrough built from the floor plan (≈ 86 px = 1 m).',
  plan: { PX: 86, OX: 655, OY: 213 },
  spawn: [1286, 280, Math.PI],                          // just inside the front door, looking into the flat
  top: { at: [1000, 590], height: 14, back: 7 },        // V view: orbit centre (plan px), camera height + offset (m)
  mapScale: 24,                                         // minimap pixels per metre
  sun: { from: [1000, 947], at: [1000, 590] },
  downlights: [
    [742, 380, 5], [752, 300, 5],                       // banho 01
    [880, 330, 5],                                      // banho 02
    [1080, 320, 7], [1180, 330, 6], [1285, 300, 6],     // cozinha + foyer
    [1000, 420, 6], [1220, 420, 6],                     // hall
    [1190, 520, 7], [1190, 640, 7],                     // living
    [770, 600, 7], [855, 420, 5],                       // suíte + its corridor
    [1010, 580, 7],                                     // dorm 01
    [1000, 830, 6], [1230, 830, 6],                     // terraço
    [1300, 140, 6], [1650, 140, 6],                     // building corridor
  ],
  windows: [                                            // daylight area lights: cx, cz, w, h, y, nx, nz, intensity
    [1192, 690, 1.6, 2.25, 1.15, 0, -1, 2.6],          // living → terraço opening
    [1025, 690, 1.3, 1.15, 1.6, 0, -1, 3],             // dorm window
    [785, 720, 1.6, 1.15, 1.6, 0, -1, 3],              // suíte window
  ],
  tower: { depth: 947, east: 1349, wing: [1165, 55], extra: [] },
  pinPole: false,
  rooms: [
    { name: 'Banho 01', r: [678, 233, 805, 450], c: '#b9c4cc' },
    { name: 'Banho 02', r: [818, 233, 968, 372], c: '#b9c4cc' },
    { name: 'Cozinha', r: [980, 233, 1240, 383], c: '#e6e1d8' },
    { name: 'Entrada', r: [1240, 233, 1328, 383], c: '#e6e1d8' },
    { name: 'Suíte', r: [678, 383, 893, 720], c: '#c99f6e' },
    { name: 'Dorm. 01', r: [905, 472, 1100, 690], c: '#c99f6e' },
    { name: 'Estar / Jantar', r: [905, 383, 1328, 690], c: '#e6e1d8' },
    { name: 'Terraço', r: [912, 712, 1328, 934], c: '#d0c7b6' },
    { name: 'Área Técnica', r: [678, 742, 875, 818], c: '#9a9a98' },
    { name: 'Hall (área comum)', r: [1180, 70, 2000, 213], c: '#cfcac0' },
  ],
};
