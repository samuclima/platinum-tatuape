// 2º pavimento (leisure floor) – everything the shared runtime needs. Coordinates: IMAGE pixels of the brochure
// plan (DOC-20260928-WA0007-10.jpg shown 2310 px wide; ≈ 20.9 px = 1 m) converted with siteKit's p()/r().
import { makeKit } from './siteKit.js';
const K = 5, { p, r } = makeKit(K);
export const meta = {
  id: 'pav2',
  title: '2º Pavimento – Platinum Tatuapé',
  heading: '<b>2º Pavimento</b> – lazer: fitness, salão de festas, gourmet, jogos, spa e piscinas',
  lead: 'Walk the leisure floor, built from the brochure site plan (≈ 21 px = 1 m) and furnished after the renders.',
  plan: { PX: 20.9 * K, OX: -1250 * K, OY: 300 * K },
  floor: 2,
  site: {
    towerX: -780 * K,                                   // podium / lot anchor (unchanged)
    towerFace: -763 * K,                                // tower east face flush with the brinquedoteca's outer wall (iy 763)
    towerNorth: 1468 * K,                               // tower face on Rua Platina
    street: 1702 * K,                                   // Rua Platina centre line (11.2 m from the façade)
    podium: [],                                         // nothing of the podium above this floor
  },
  shadowSize: 42,
  spawn: [...p(1015, 905), Math.PI * 0.68],             // pool deck by the daybeds, looking at the solarium and the pools
  top: { at: p(900, 760), height: 75, back: 32 },
  mapScale: 3.3,
  sun: { from: p(900, 1500), at: p(900, 760) },
  downlights: [
    // fitness
    [...p(420, 360), 7], [...p(420, 470), 7], [...p(420, 580), 7], [...p(470, 650), 6], [...p(560, 620), 7], [...p(650, 650), 7], [...p(545, 410), 5],
    [...p(390, 715), 5],
    // gourmet, terraço, hall, salão
    [...p(800, 430), 7], [...p(700, 440), 6], [...p(630, 430), 5], [...p(910, 430), 6], [...p(620, 510), 5], [...p(830, 510), 5], [...p(1030, 510), 5],
    [...p(1080, 430), 6], [...p(1170, 430), 7], [...p(1160, 520), 7], [...p(1225, 525), 6], [...p(1170, 350), 5], [...p(1060, 615), 5],
    // jogos, brinquedoteca
    [...p(820, 630), 7], [...p(910, 670), 7], [...p(720, 650), 5], [...p(1200, 640), 6], [...p(1190, 710), 6],
    // spa wing
    [...p(470, 830), 5], [...p(520, 880), 5], [...p(568, 755), 4], [...p(650, 860), 6], [...p(490, 750), 4],
    // churrasqueira (pergola LEDs)
    [...p(1400, 420), 5], [...p(1400, 520), 5],
  ],
  windows: [],
  tower: { depth: 0, east: 0, wing: [0, 0], extra: [] },
  pinPole: false,
  rooms: [
    { name: 'Sala de luta', r: r(348, 668, 437, 766), c: '#2d4a7a' },
    { name: 'Sala multifuncional', r: r(498, 375, 592, 452), c: '#5d6b4f' },
    { name: 'Fitness', r: r(362, 321, 497, 720), c: '#9a9a98' },
    { name: 'Fitness – área funcional', r: r(497, 580, 700, 720), c: '#9a9a98' },
    { name: 'Elevadores', r: r(498, 495, 1068, 527), c: '#e6e1d8' },
    { name: 'WC', r: r(497, 452, 600, 495), c: '#b9c4cc' },
    { name: 'Espaço gourmet', r: r(600, 380, 848, 495), c: '#c99f6e' },
    { name: 'Terraço festas | gourmet', r: r(848, 380, 1000, 495), c: '#d0c7b6' },
    { name: 'Terraço', r: r(497, 316, 600, 380), c: '#8fb06f' },
    { name: 'Terraço', r: r(1003, 316, 1115, 380), c: '#8fb06f' },
    { name: 'Salão de festas – lounge', r: r(1115, 316, 1247, 380), c: '#c99f6e' },
    { name: 'Copa de apoio', r: r(1023, 580, 1110, 655), c: '#e6e1d8' },
    { name: 'WC', r: r(1115, 580, 1175, 612), c: '#b9c4cc' },
    { name: 'WC', r: r(1180, 580, 1262, 612), c: '#b9c4cc' },
    { name: 'Salão de festas', r: r(1003, 380, 1268, 580), c: '#c99f6e' },
    { name: 'Escada', r: r(738, 527, 912, 580), c: '#cfcac0' },
    { name: 'WC', r: r(958, 580, 1023, 657), c: '#b9c4cc' },
    { name: 'Espaço jogos', r: r(700, 580, 1003, 780), c: '#e6e1d8' },
    { name: 'Brinquedoteca', r: r(1118, 612, 1270, 765), c: '#e8b3a6' },
    { name: 'Pista infantil', r: r(1003, 655, 1118, 780), c: '#d9b88a' },
    { name: 'Churrasqueira c/ forno de pizza', r: r(1340, 362, 1450, 625), c: '#c99f6e' },
    { name: 'Playground', r: r(1310, 625, 1450, 812), c: '#d7b98d' },
    { name: 'Circulação externa', r: r(1268, 316, 1478, 812), c: '#cfcac0' },
    { name: 'Sauna seca', r: r(535, 723, 600, 790), c: '#b07a4a' },
    { name: 'Vestiários', r: r(600, 723, 700, 773), c: '#b9c4cc' },
    { name: 'Spa', r: r(437, 723, 562, 915), c: '#b46f55' },
    { name: 'Pool bar', r: r(562, 773, 700, 915), c: '#c99f6e' },
    { name: 'Ducha', r: r(670, 925, 705, 958), c: '#3fa7c9' },
    { name: 'Piscina infantil', r: r(745, 890, 855, 952), c: '#3fa7c9' },
    { name: 'Deck molhado', r: r(1035, 975, 1175, 1052), c: '#3fa7c9' },
    { name: 'Pool spa', r: r(1175, 975, 1325, 1052), c: '#3fa7c9' },
    { name: 'Piscina adulto c/ raia dupla de 25 m', r: r(928, 1058, 1448, 1165), c: '#3fa7c9' },
    { name: 'Solarium', r: r(700, 780, 1478, 1195), c: '#c99f6e' },
    { name: 'Terraço da Praça', r: r(316, 316, 362, 770), c: '#8fb06f' },
  ],
};
