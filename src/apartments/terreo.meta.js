// Térreo (ground floor) – everything the shared runtime needs. Plan coordinates are the IMAGE pixels of
// the brochure site plan converted to the engine frame: px = −iy·5, pz = ix·5 (see terreo.js).
const K = 5, p = (ix, iy) => [-iy * K, ix * K], r = (ix0, iy0, ix1, iy1) => [-iy1 * K, ix0 * K, -iy0 * K, ix1 * K];
export const meta = {
  id: 'terreo',
  title: 'Térreo – Platinum Tatuapé',
  heading: '<b>Térreo</b> – lobby, lazer e estacionamento',
  lead: 'Walk the ground floor, built from the brochure site plan (≈ 18 px = 1 m).',
  plan: { PX: 18.33 * K, OX: -1100 * K, OY: 270 * K },
  floor: 0,                                             // street level
  site: {
    towerX: -700 * K,                                   // tower east face (2º pavimento plan → image iy 700)
    towerNorth: 1322 * K,                               // tower face on Rua Platina (image ix 1322)
    street: 1527 * K,                                   // Rua Platina centre line (image ix 1527)
    // brochure implantação: the acesso social + lobby face Praça Heitor Levi (left of the image), the garage end faces
    // Rua Platina – the level is used as drawn. (flip: p(770.5, 620.5) would turn the outside world 180° around the lot.)
    // 1º + 2º pavimento mass over the térreo – kept off the double-height lobby (315–443 × 295–449), which only
    // gets the 2º pavimento slab above its 5.6 m ceiling (5th value = bottom of the mass, m)
    // the modelled lot: neighbourhood (OSM) buildings reaching into it are left out
    clear: [r(176, 140, 1365, 903), r(805, 903, 1365, 1101)],
    podium: [r(443, 295, 915, 900), r(1003, 295, 1330, 900), r(915, 457, 1003, 900), [...r(917, 295, 1001, 459), 5.9], [...r(305, 449, 437, 519), 5.9], r(437, 449, 443, 519), r(305, 519, 443, 900), r(805, 900, 1330, 1095), [...r(315, 295, 443, 449), 5.9]],
  },
  shadowSize: 40,
  spawn: [...p(240, 500), Math.PI],                     // on the praça sidewalk at the acesso social, facing in
  top: { at: p(800, 620), height: 70, back: 30 },
  mapScale: 3.5,
  sun: { from: p(800, 1300), at: p(800, 600) },
  downlights: [
    [...p(390, 600), 7],                                // (the double-height lobby has its own lights in terreo.js)
    [...p(505, 400), 7], [...p(640, 400), 8], [...p(760, 400), 8],
    [...p(888, 400), 6], [...p(560, 472), 6], [...p(760, 472), 6], [...p(950, 472), 6],
    [...p(600, 650), 6], [...p(850, 650), 6], [...p(1100, 650), 6], [...p(1280, 500), 6], [...p(1280, 800), 6], [...p(1000, 850), 6],
  ],
  windows: [],
  tower: { depth: 0, east: 0, wing: [0, 0], extra: [] },
  pinPole: false,
  rooms: [
    { name: 'Portaria', r: r(321, 526, 405, 618), c: '#b9c4cc' },
    { name: 'Hall de entrada', r: r(321, 449, 436, 519), c: '#e6e1d8' },
    { name: 'Acesso serviço', r: r(321, 622, 437, 655), c: '#cfcac0' },
    { name: 'Espaço delivery', r: r(371, 660, 437, 701), c: '#b9c4cc' },
    { name: 'Espaço p/ minimercado', r: r(441, 491, 474, 588), c: '#e6e1d8' },
    { name: 'Lobby', r: r(321, 300, 436, 445), c: '#c99f6e' },
    { name: 'Coworking', r: r(443, 349, 568, 455), c: '#e6e1d8' },
    { name: 'Casa de campo c/ spa e churrasqueira', r: r(572, 349, 858, 455), c: '#c99f6e' },
    { name: 'Pet care', r: r(862, 349, 913, 455), c: '#e6e1d8' },
    { name: 'Lobby (estacionamento)', r: r(917, 357, 1001, 519), c: '#c99f6e' },
    { name: 'Hall dos elevadores', r: r(440, 459, 1000, 488), c: '#e6e1d8' },
    { name: 'Deck c/ spa', r: r(600, 228, 770, 343), c: '#c99f6e' },
    { name: 'Lounge externo', r: r(272, 142, 600, 292), c: '#8fb06f' },
    { name: 'Pet place', r: r(860, 150, 970, 343), c: '#8fb06f' },
    { name: 'Churrasqueira', r: r(975, 148, 1059, 295), c: '#d0c7b6' },
    { name: 'Quadra recreativa', r: r(1062, 152, 1328, 292), c: '#d8b48a' },
    { name: 'Estacionamento', r: r(440, 298, 1330, 1095), c: '#9a9a98' },
    { name: 'Acesso / praça', r: r(150, 140, 312, 900), c: '#cfcac0' },
  ],
};
