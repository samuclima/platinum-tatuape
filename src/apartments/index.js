// The apartments on the site. Each entry is loaded only when that apartment is opened.
export const APARTMENTS = {
  '27': { meta: () => import('./a27.meta.js'), build: () => import('./a27.js') },
  '33': { meta: () => import('./a33.meta.js'), build: () => import('./a33.js') },
  '61': { meta: () => import('./a61.meta.js'), build: () => import('./a61.js') },
  '79': { meta: () => import('./a79.meta.js'), build: () => import('./a79.js') },
  '93': { meta: () => import('./a93.meta.js'), build: () => import('./a93.js') },
  '93s': { meta: () => import('./a93s.meta.js'), build: () => import('./a93s.js') },   // 93 m² without Dorm. 02
  terreo: { meta: () => import('./terreo.meta.js'), build: () => import('./terreo.js') },
  pav1: { meta: () => import('./pav1.meta.js'), build: () => import('./pav1.js') },
  pav2: { meta: () => import('./pav2.meta.js'), build: () => import('./pav2.js') },
};
