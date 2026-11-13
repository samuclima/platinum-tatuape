// The building visit (visita/): a street-view walk from the entrance hall, beside the portaria, through the térreo, the 1º and the
// 2º pavimento. No library: each point's six baked faces (tools/bake_visit.mjs → visita/pano/) form a CSS 3D cube around the viewer.
// The route is linear – stops with in-between photos along the real walking path – so "next" plays the photos up to the next stop
// in a row (each a short cross-fade while the view turns the way you walk), like someone walking. A popup per stop: the area's
// name, a short text and the floor's plan with the route and where you are. The last stop of a floor takes the lift up.
//
// Conventions (same as the bake and home/pano.js): faces f = −Z, r = +X, b = +Z, l = −X, u = up, d = down of the three.js world;
// the view is translateZ(P) rotateX(pitch) rotateY(−yaw) – yaw > 0 turns left, pitch > 0 looks up. Plan: x → right, z → down.
const FACE_T = { f: '', r: 'rotateY(-90deg) ', b: 'rotateY(180deg) ', l: 'rotateY(90deg) ', u: 'rotateX(-90deg) ', d: 'rotateX(90deg) ' };
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TEXT = {
  hall: 'A chegada pela Praça Heitor Levi: portaria com caixilhos, vidro e porta blindados, logo ao lado do hall de entrada.',
  lobby: 'Pé-direito duplo, grandes panos de vidro e paisagismo: a luz natural recebe você logo na entrada.',
  coworking: 'Um espaço reservado para trabalhar ou estudar a poucos passos de casa.',
  casa: 'Um living aberto para o jardim, com spa e churrasqueira, para receber sem pressa.',
  spa: 'Deck de madeira com spa aquecido e espreguiçadeiras, aberto para o jardim e para a casa de campo.',
  pet: 'Área ao ar livre para os pets brincarem, ao lado do pet care.',
  churrasqueira: 'Churrasqueira com bancada, ilha e mesa sob o pergolado de madeira, aberta para a quadra.',
  quadra: 'Para jogar, treinar ou só gastar energia sem sair do condomínio.',
  lobby2: 'O segundo lobby, junto aos elevadores: quem chega de carro também é recebido com pé-direito alto, madeira e luz natural.',
  hall1: 'Um andar acima do térreo: espaço beauty, salas de massagem e bicicletário.',
  bike: 'Bicicletário amplo, com suportes e espaço para manutenção, a um elevador da rua.',
  massagem: 'Salas reservadas e silenciosas para massagem e relaxamento, ao lado do espaço beauty.',
  beauty: 'Um salão completo dentro do condomínio, com terraço próprio e luz natural.',
  terraco1: 'Um terraço aberto no 1º pavimento, ao lado do espaço beauty.',
  hall2: 'O andar do lazer: espaço gourmet, salão de festas, brinquedoteca, fitness, spa e a piscina com raia de 25 m.',
  gourmet: 'Cozinha aberta e mesa para receber em 60 m², ao lado do terraço.',
  terraco2: 'Terraço coberto entre o salão de festas e o espaço gourmet, com sofás, poltronas e vista aberta para o bairro.',
  salao: '130 m² para festas e encontros, com lounge e terraço próprios.',
  churrasqueira2: 'Churrasqueira e forno de pizza ao ar livre, ao lado do playground.',
  playground: 'Brinquedos ao ar livre para as crianças, com a churrasqueira por perto.',
  brinquedoteca: 'Um espaço lúdico e seguro para as crianças, junto à pista infantil.',
  jogos: 'Mesas de jogos e um lounge para reunir os amigos.',
  fitness: 'Fitness de 200 m² com sala multifuncional, equipado para treinar sem sair de casa.',
  spa2: 'Spa aquecido, sauna seca e vestiários, com o pool bar ao lado.',
  poolbar: 'O pool bar, entre o spa e a piscina, para a pausa à beira d’água.',
  piscina: 'Raia dupla de 25 m, deck molhado e solarium com vista para o bairro.',
};

export async function visita(el, { base = 'pano/', ui, onReady, start = null } = {}) {   // start: a stop id (e.g. 'piscina') to begin there
  const B = new URL(base, document.baseURI), data = await (await fetch(new URL('visit.json', B))).json();
  const S = data.face, H = S / 2, PX = 150, pts = data.points, stops = data.stops;
  const stopAt = new Map(stops.map((s, i) => [s.pt, i]));
  el.classList.add('pv');
  el.innerHTML = '<div class="pv-cam"></div>';
  const cam = el.querySelector('.pv-cam'), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let yaw = 0, pitch = -0.08, fov = 120, vf = 80, P = 600, cur = -1, curStop = 0, cube = null, busy = false, dead = false, anim = 0;
  const url = (i, f) => new URL(`${i}_${f}.jpg`, B).href;
  const view = () => { cam.style.transform = `translateZ(${P.toFixed(1)}px) rotateX(${pitch.toFixed(4)}rad) rotateY(${(-yaw).toFixed(4)}rad)`; ui.look?.(yaw, hfov()); };
  const hfov = () => 2 * Math.atan(Math.tan(vf * Math.PI / 360) * el.clientWidth / Math.max(el.clientHeight, 1)) * 180 / Math.PI;
  const fit = () => { const w = Math.max(el.clientWidth, 1), h = Math.max(el.clientHeight, 1);
    vf = Math.min(115, 2 * Math.atan(Math.tan(Math.min(fov, 170) * Math.PI / 360) * h / w) * 180 / Math.PI);
    P = h / 2 / Math.tan(vf * Math.PI / 360); el.style.perspective = P.toFixed(1) + 'px'; view(); };
  const ro = new ResizeObserver(fit); ro.observe(el);
  const dirTo = (a, b) => Math.atan2(-(pts[b].x - pts[a].x), -(pts[b].z - pts[a].z));   // yaw that faces from point a to point b
  const sameLv = (a, b) => pts[a] && pts[b] && pts[a].lv === pts[b].lv;

  // a point's cube; at a stop, floor arrows to the previous and next stop (same floor) – resolved once its faces are decoded
  const cache = new Map();
  const faces = i => { if (!cache.has(i)) cache.set(i, Object.keys(FACE_T).map(f => { const im = new Image(); im.decoding = 'async'; im.src = url(i, f); return im; })); return cache.get(i); };
  const preloadStops = si => [si - 1, si + 1].forEach(k => { if (stops[k]) faces(stops[k].pt); });   // only the neighbouring areas (no in-between photos any more)
  async function build(i) {
    const c = document.createElement('div'); c.className = 'pv-cube';
    const ims = faces(i), keys = Object.keys(FACE_T);
    ims.forEach((src, k) => { const im = src.cloneNode(); im.className = 'pv-face'; im.alt = ''; im.draggable = false;
      im.style.cssText = `width:${S}px;height:${S}px;margin:${-H}px 0 0 ${-H}px;transform:${FACE_T[keys[k]]}translateZ(${-H}px) scale(1.004)`; c.appendChild(im); });
    const si = stopAt.get(i);
    if (si !== undefined) for (const [to, label] of [[si + 1, 'next'], [si - 1, 'prev']]) {
      const t = stops[to]; if (!t || t.lv !== pts[i].lv) continue;
      const step = label === 'next' ? i + 1 : i - 1, a = Math.atan2(pts[step].x - pts[i].x, -(pts[step].z - pts[i].z));
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pv-arrow' + (label === 'prev' ? ' back' : '');
      b.innerHTML = `${ARROW}<span>${t.name}</span>`; b.setAttribute('aria-label', `Ir para ${t.name}`);
      const x = Math.sin(a) * 2.4 * PX, z = -Math.cos(a) * 2.4 * PX, y = pts[i].eye * PX;
      b.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(90deg) rotateZ(${a.toFixed(4)}rad)`;
      b.addEventListener('click', e => { e.stopPropagation(); goStop(to); });
      b.addEventListener('pointerdown', e => e.stopPropagation());
      c.appendChild(b);
    }
    await Promise.all([...c.querySelectorAll('.pv-face')].map(im => im.decode().catch(() => {})));
    return c;
  }

  // Google Street View style move: turn towards the way, then the camera glides forward THROUGH the current photo (its cube
  // slides back past you, so the picture stretches towards you) while it dissolves into the next photo, which settles in from
  // slightly behind. Only the old cube is ever half-transparent (two of them showed their face edges as squares).
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const tween = (dur, f, curve = ease) => new Promise(res => { const t0 = performance.now();
    const step = now => { if (dead) return res(); const t = Math.min(1, (now - t0) / dur); f(curve(t), t); if (t < 1) anim = requestAnimationFrame(step); else res(); };
    anim = requestAnimationFrame(step); });
  async function turn(to) { const y0 = yaw, dy = wrap(to - y0); if (Math.abs(dy) > 0.12 && !calm) await tween(Math.min(520, 180 + Math.abs(dy) * 260), e => { yaw = y0 + dy * e; view(); }); else { yaw = y0 + dy; view(); } }
  // show point i; from = the point you come from (null: just appear). mid: a step inside a walk (steadier pace, no ease-out stop)
  async function show(i, from = null, { dur = 720, mid = false } = {}) {
    const next = await build(i); if (dead) return;
    cam.prepend(next); const old = cube; cube = next; cur = i; ui.at?.(i);
    if (!old || from === null || calm) { old?.remove(); view(); return; }
    let dx = pts[i].x - pts[from].x, dz = pts[i].z - pts[from].z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const T = H * 0.62, n0 = 0.38, mv = (c, k) => { c.style.transform = `translate3d(${(dx * k).toFixed(1)}px, 0, ${(dz * k).toFixed(1)}px)`; };
    const y0 = yaw, dy = wrap(Math.atan2(-dx, -dz) - y0);             // keep facing the way while walking round bends
    old.style.transition = 'none'; mv(next, T * n0);
    await tween(dur, (e, t) => { const f = Math.min(1, Math.max(0, (t - 0.18) / 0.62));
      mv(old, -T * e); old.style.opacity = String(1 - f * f * (3 - 2 * f)); mv(next, T * n0 * (1 - e)); yaw = y0 + dy * e; view(); },
      mid ? (t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) : ease);
    old.remove(); next.style.transform = '';
  }

  // walk to a stop: turn to the way, then glide through every photo between here and there (same floor), or the lift
  async function goStop(si) {
    if (busy || dead || si < 0 || si >= stops.length || si === curStop) return; busy = true; ui.walking?.(true);
    const target = stops[si].pt;
    if (!sameLv(cur, target)) {                                     // another floor: the lift
      await ui.lift?.(data.levels[stops[si].lv].name, async () => {
        const nxt = target + 1 < pts.length && sameLv(target, target + 1) ? target + 1 : null;
        cube?.remove(); cube = null; if (nxt !== null) yaw = dirTo(target, nxt); pitch = -0.08; await show(target);
      });
    } else {                                                       // same floor: straight to the area with a calm cross-fade – no walk through the
      const into = target > 0 && sameLv(target - 1, target) && target - 1 !== cur ? dirTo(target - 1, target) : dirTo(cur, target);   // in-between photos, no glide, no turn
      const next = await build(target); if (dead) return;            // (the user found walking photo to photo dizzying). You arrive facing into the area.
      cam.prepend(next); const old = cube; cube = next; cur = target; ui.at?.(target);
      yaw = into; view();
      if (old && !calm) { old.style.transition = 'none'; await tween(480, e => { old.style.opacity = String(1 - e); }, t => t * t * (3 - 2 * t)); }
      old?.remove();
    }
    curStop = si; ui.stop?.(si); busy = false; ui.walking?.(false); preloadStops(si);
  }

  // drag to look, wheel to zoom
  let drag = null;
  el.addEventListener('pointerdown', e => { cancelAnimationFrame(intro); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw, pitch }; el.setPointerCapture(e.pointerId); el.classList.add('drag'); });
  el.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; const k = (vf * Math.PI / 180) / Math.max(el.clientHeight, 1);
    yaw = drag.yaw + (e.clientX - drag.x) * k; pitch = Math.max(-1.35, Math.min(1.35, drag.pitch + (e.clientY - drag.y) * k)); view(); });
  const up = e => { if (drag && e.pointerId === drag.id) { drag = null; el.classList.remove('drag'); } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); fov = Math.max(60, Math.min(150, fov + Math.sign(e.deltaY) * 6)); fit(); }, { passive: false });

  // start: the entrance hall, beside the portaria, looking the way the walk goes; the view opens up from the floor
  const si0 = Math.max(0, stops.findIndex(s => s.id === start)), s0 = stops[si0].pt; let intro = 0;
  yaw = s0 + 1 < pts.length && sameLv(s0, s0 + 1) ? dirTo(s0, s0 + 1) : dirTo(s0 - 1, s0);   // look the way the walk goes on (last stop: the way you came)
  const endFov = fov, endPitch = pitch; if (!calm) { fov = 160; pitch = -1.25; }
  fit(); preloadStops(si0); await show(s0); curStop = si0; ui.stop?.(si0); onReady?.();
  if (!calm) { const t0 = performance.now(), D = 1800, ease = t => 1 - Math.pow(1 - t, 4), f0 = fov, p0 = pitch;
    const step = now => { const t = Math.min(1, (now - t0) / D), e = ease(t); fov = f0 + (endFov - f0) * e; pitch = p0 + (endPitch - p0) * e; fit(); if (t < 1 && !dead) intro = requestAnimationFrame(step); };
    intro = requestAnimationFrame(step); }
  return { data, text: id => TEXT[id] || '', goStop, get stop() { return curStop; }, get point() { return cur; },
    destroy() { dead = true; cancelAnimationFrame(anim); ro.disconnect(); el.replaceChildren(); } };
}
