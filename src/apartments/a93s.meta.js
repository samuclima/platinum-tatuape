// Apartamento 93m² 3D, VARIANT without Dorm. 02 (living room enlarged, as in the brochure perspective) - everything the shared runtime needs to know about this apartment.
// Plan coordinates are pixels on the brochure plan; X()/Z() convert them to metres.
export const meta = {
  id: '93s',
  title: "Apartamento 93m² 3D – living ampliado",
  heading: "<b>93m²</b> – living ampliado (sem Dorm. 02)",
  lead: "Variant of the 93 m² plan with bedroom 02 merged into the living room, as shown in the brochure's living-room image. Not an official plan – confirm with the developer.",
  plan: { PX: 101, OX: 722, OY: 287, },
  spawn: [1680, 478, Math.PI - 0.58],                          // behind the sofa by the dining table, looking at the terrace (like the brochure image)                          // plan x, plan y, yaw (radians)
  top: { at: [1320, 730], height: 16, back: 7 },  // V view: orbit centre (plan px), camera height + offset (m)
  mapScale: 20,                                          // minimap pixels per metre
  sun: { from: [1600, 1170], at: [1320, 730] },
  downlights: [
  [1520, 560, 7], [1640, 560, 7], [1580, 690, 7], [1570, 385, 6], [1790, 560, 7], [1790, 720, 7], [1760, 360, 6],
  [1130, 510, 6], [1300, 520, 6], [1300, 700, 7], [1460, 625, 7], [910, 460, 9], [900, 700, 8], [880, 810, 8], [1340, 710, 9],
  [1140, 385, 6], [1415, 400, 5], [1098, 820, 6], [1098, 965, 5],
  [1330, 900, 6], [1600, 900, 6], [1462, 1110, 6], [1800, 950, 6], [1800, 1080, 6], [1800, 205, 6], [2150, 205, 6],
],
  windows: [
  [1451, 830, 3.9, 2.3, 1.17, 0, -1, 4],
  [892, 905, 2.0, 1.15, 1.6, 0, -1, 3], [747, 461, 1.6, 1.15, 1.45, 1, 0, 3],
],                                        // daylight area lights: cx, cz, w, h, y, nx, nz, intensity
  tower: { depth: 1170, east: 1925, wing: [1486, 110], extra: [] },
  pinPole: false,
  rooms: [
  { name: 'Banho 02', r: [1090, 310, 1340, 440], c: '#b9c4cc' },
  { name: 'Lavabo', r: [1352, 310, 1478, 445], c: '#b9c4cc' },
  { name: 'Banho 01', r: [1022, 735, 1175, 1012], c: '#b9c4cc' },
  { name: 'Dorm. 01', r: [747, 310, 1075, 562], c: '#c99f6e' },
  { name: 'Suíte', r: [747, 577, 1185, 905], c: '#c99f6e' },
  { name: 'Cozinha', r: [1745, 430, 1900, 830], c: '#e6e1d8' },
  { name: 'Estar / Jantar', r: [1075, 310, 1900, 830], c: '#e6e1d8' },
  { name: 'Terraço de Serviço', r: [1720, 850, 1900, 1150], c: '#d0c7b6' },
  { name: 'Terraço', r: [1205, 850, 1700, 1150], c: '#d0c7b6' },
  { name: 'Área Técnica', r: [747, 925, 990, 1030], c: '#9a9a98' },
  { name: 'Hall (área comum)', r: [1500, 125, 2770, 287], c: '#cfcac0' },
  ],
};
