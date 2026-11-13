// 1º pavimento – everything the shared runtime needs. Coordinates: IMAGE pixels of the brochure plan
// (p. 9, displayed 2000 px wide; ≈ 19.4 px = 1 m) converted with siteKit's p()/r().
import { makeKit } from './siteKit.js';
const K = 5, { p, r } = makeKit(K);
export const meta = {
  id: 'pav1',
  title: '1º Pavimento – Platinum Tatuapé',
  heading: '<b>1º Pavimento</b> – beauty, massagem, bicicletário e estacionamento',
  lead: 'Walk the first floor, built from the brochure site plan (≈ 19 px = 1 m).',
  plan: { PX: 19.37 * K, OX: -1170 * K, OY: 290 * K },
  floor: 1,
  site: {
    towerX: -741 * K,                                   // same tower position as the térreo, in this plan's pixels
    towerNorth: 1402 * K,
    street: 1619 * K,                                   // Rua Platina centre line
    podium: [r(335, 312, 1411, 961), r(850, 961, 1411, 1164)],   // 2º pavimento mass above this floor
    clear: [r(185, 140, 1450, 968), r(845, 955, 1450, 1175)],   // the modelled lot: neighbourhood (OSM) buildings reaching into it are left out
  },
  shadowSize: 40,
  spawn: [...p(760, 500), Math.PI / 2],                 // corridor in front of the stairs
  top: { at: p(870, 740), height: 70, back: 30 },
  mapScale: 3.5,
  sun: { from: p(870, 1400), at: p(870, 740) },
  downlights: [
    [...p(525, 400), 7], [...p(525, 455), 6], [...p(660, 399), 5], [...p(660, 455), 5], [...p(780, 425), 7], [...p(900, 425), 7],
    [...p(1010, 400), 6], [...p(600, 500), 6], [...p(900, 500), 6],
    [...p(500, 660), 6], [...p(750, 660), 6], [...p(1000, 660), 6], [...p(600, 820), 6], [...p(900, 820), 6],
    [...p(1260, 450), 6], [...p(1260, 750), 6], [...p(1260, 1000), 6], [...p(1100, 950), 6],
  ],
  windows: [],
  tower: { depth: 0, east: 0, wing: [0, 0], extra: [] },
  pinPole: false,
  rooms: [
    { name: 'Espaço beauty', r: r(471, 375, 584, 482), c: '#c99f6e' },
    { name: 'Terraço (beauty)', r: r(471, 314, 566, 370), c: '#e6e1d8' },
    { name: 'Salas de massagem', r: r(589, 377, 700, 482), c: '#c99f6e' },
    { name: 'Bicicletário', r: r(707, 380, 962, 482), c: '#9a9a98' },
    { name: 'Hall', r: r(967, 375, 1062, 516), c: '#e6e1d8' },
    { name: 'Terraço', r: r(967, 314, 1062, 370), c: '#e6e1d8' },
    { name: 'Hall dos elevadores', r: r(468, 488, 1060, 515), c: '#e6e1d8' },
    { name: 'WC', r: r(469, 520, 505, 552), c: '#b9c4cc' },
    { name: 'WC', r: r(865, 518, 912, 565), c: '#b9c4cc' },
    { name: 'Escada', r: r(709, 488, 863, 566), c: '#cfcac0' },
    { name: 'Vazio do lobby (pé-direito duplo)', r: r(338, 318, 462, 550), c: '#8fb06f' },
    { name: 'Estacionamento', r: r(338, 312, 1411, 1164), c: '#9a9a98' },
  ],
};
