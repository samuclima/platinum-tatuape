// Street-view style visit of one apartment for the home page's plan cards. No library: the six baked faces of each
// point (tools/bake_pano.mjs → home/pano/<apt>/) form a CSS 3D cube around the viewer. Drag to look around, wheel to
// zoom, arrows on the floor (and the room names below) move to the next point with a zoom-and-blend.
//   const v = await pano(element, { base: 'home/pano/61/', onReady })      v.destroy()
//
// Conventions (same as the bake): faces f = −Z, r = +X, b = +Z, l = −X, u = up, d = down of the three.js world;
// CSS has y pointing down, so a world point (x, y, z) sits at CSS (x, −y, z). The view is
// translateZ(P) rotateX(pitch) rotateY(−yaw) – yaw > 0 turns left, pitch > 0 looks up.
const FACE_T = { f: '', r: 'rotateY(-90deg) ', b: 'rotateY(180deg) ', l: 'rotateY(90deg) ', u: 'rotateX(-90deg) ', d: 'rotateX(90deg) ' };
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export async function pano(el, { base, onReady } = {}) {
  const data = await (await fetch(new URL('pano.json', new URL(base, document.baseURI)))).json();
  const S = data.face, H = S / 2, PX = 150;                       // PX: CSS px per metre for the floor arrows (inside the cube)
  el.classList.add('pv');
  el.innerHTML = '<div class="pv-cam"></div><nav class="pv-rooms" aria-label="Ambientes"></nav>';
  const cam = el.querySelector('.pv-cam'), nav = el.querySelector('.pv-rooms');
  const map = data.plan ? planMap(el, data, i => go(i)) : null;
  let yaw = 0, pitch = -0.06, fov = 132, vf = 80, P = 600, cur = -1, cube = null, busy = false, dead = false, intro = 0, trans = 0;   // fov: horizontal (°), vf: the vertical it gives
  const url = (i, f) => new URL(`${i}_${f}.jpg`, new URL(base, document.baseURI)).href;

  const view = () => { cam.style.transform = `translateZ(${P.toFixed(1)}px) rotateX(${pitch.toFixed(4)}rad) rotateY(${(-yaw).toFixed(4)}rad)`; map?.look(yaw, 2 * Math.atan(Math.tan(vf * Math.PI / 360) * w2h()) * 180 / Math.PI); };
  const w2h = () => Math.max(el.clientWidth, 1) / Math.max(el.clientHeight, 1);
  // zoom is set by the horizontal angle (very wide by default), capped at 115° vertically (tall phone screens)
  const fit = () => {
    const w = Math.max(el.clientWidth, 1), h = Math.max(el.clientHeight, 1);
    vf = Math.min(122, 2 * Math.atan(Math.tan(Math.min(fov, 170) * Math.PI / 360) * h / w) * 180 / Math.PI);
    P = h / 2 / Math.tan(vf * Math.PI / 360); el.style.perspective = P.toFixed(1) + 'px'; view();
  };
  const ro = new ResizeObserver(fit); ro.observe(el);

  // one point's cube (+ its floor arrows), resolved once all six faces are decoded
  async function build(i) {
    const c = document.createElement('div'); c.className = 'pv-cube';
    const imgs = Object.keys(FACE_T).map(f => {
      const im = new Image(); im.className = 'pv-face'; im.alt = ''; im.draggable = false; im.decoding = 'async'; im.src = url(i, f);
      im.style.cssText = `width:${S}px;height:${S}px;margin:${-H}px 0 0 ${-H}px;transform:${FACE_T[f]}translateZ(${-H}px) scale(1.004)`;
      c.appendChild(im); return im;
    });
    // arrows: one per doorway – links leaving in about the same direction collapse into the nearest one
    const kept = [];
    for (const l of [...data.points[i].links].sort((a, b) => a.len - b.len)) {
      const a = Math.atan2(l.dx, -l.dz);
      if (kept.some(k => Math.abs(Math.atan2(Math.sin(a - k.a), Math.cos(a - k.a))) < 0.5)) continue;
      kept.push({ ...l, a });
    }
    for (const l of kept) {
      const L = Math.hypot(l.dx, l.dz) || 1, d = 2.4, x = l.dx / L * d * PX, z = l.dz / L * d * PX, y = data.eye * PX;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pv-arrow';
      b.innerHTML = `${ARROW}<span>${data.points[l.to].name}</span>`; b.setAttribute('aria-label', `Ir para ${data.points[l.to].name}`);
      b.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(90deg) rotateZ(${l.a.toFixed(4)}rad)`;
      b.addEventListener('click', e => { e.stopPropagation(); go(l.to); });
      b.addEventListener('pointerdown', e => e.stopPropagation());
      c.appendChild(b);
    }
    await Promise.all(imgs.map(im => im.decode().catch(() => {})));
    return c;
  }
  const prefetch = i => data.points[i].links.forEach(l => Object.keys(FACE_T).forEach(f => { const im = new Image(); im.src = url(l.to, f); }));

  // Google Street View style move: turn towards where you are going, then the camera glides forward THROUGH the current photo
  // (its cube slides back past you, so the picture stretches towards you) while it dissolves into the next photo, which settles
  // in from slightly behind. Only the old cube is ever half-transparent (two of them showed their face edges as squares).
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const tween = (dur, f) => new Promise(res => { const t0 = performance.now();
    const step = now => { if (dead) return res(); const t = Math.min(1, (now - t0) / dur); f(t); if (t < 1) trans = requestAnimationFrame(step); else res(); };
    trans = requestAnimationFrame(step); });
  async function go(i, first = false) {
    if (busy || i === cur || dead) return; busy = true;
    const from = data.points[cur], to = data.points[i], link = from?.links.find(k => k.to === i);
    let dx = link ? link.dx : to.x - (from?.x ?? to.x), dz = link ? link.dz : to.z - (from?.z ?? to.z); const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const nextP = build(i);
    const old = cube;
    if (old && !first) {
      cancelAnimationFrame(intro); cancelAnimationFrame(trans);
      const y0 = yaw, dy = wrap(Math.atan2(-dx, -dz) - y0);           // 1) turn to face the way (skipped when already facing it)
      if (Math.abs(dy) > 0.12) await tween(Math.min(520, 180 + Math.abs(dy) * 260), t => { yaw = y0 + dy * ease(t); view(); });
    }
    const next = await nextP; if (dead) return;
    cam.prepend(next); cube = next; cur = i;
    [...nav.children].forEach((b, k) => b.classList.toggle('on', k === i));
    map?.at(i);
    if (old && !first) {                                              // 2) glide forward and dissolve into the next photo
      const T = H * 0.62, n0 = 0.38, mv = (el2, k) => { el2.style.transform = `translate3d(${(dx * k).toFixed(1)}px, 0, ${(dz * k).toFixed(1)}px)`; };
      old.style.transition = 'none'; mv(next, T * n0);
      await tween(720, t => { const e = ease(t), f = Math.min(1, Math.max(0, (t - 0.18) / 0.62));
        mv(old, -T * e); old.style.opacity = String(1 - f * f * (3 - 2 * f)); mv(next, T * n0 * (1 - e)); });
      old.remove(); next.style.transform = '';
    } else old?.remove();
    busy = false;
    prefetch(i);
  }

  // room names along the bottom: jump straight to a room
  data.points.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = p.name; b.addEventListener('click', () => go(i)); nav.appendChild(b); });

  // drag to look, wheel to zoom
  let drag = null;
  el.addEventListener('pointerdown', e => { if (e.target.closest('.pv-rooms')) return; cancelAnimationFrame(intro); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw, pitch }; el.setPointerCapture(e.pointerId); el.classList.add('drag'); });
  el.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = (vf * Math.PI / 180) / Math.max(el.clientHeight, 1);   // the image follows the finger
    yaw = drag.yaw + (e.clientX - drag.x) * k; pitch = Math.max(-1.35, Math.min(1.35, drag.pitch + (e.clientY - drag.y) * k)); view();
  });
  const up = e => { if (drag && e.pointerId === drag.id) { drag = null; el.classList.remove('drag'); } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); cancelAnimationFrame(intro); fov = Math.max(60, Math.min(150, fov + Math.sign(e.deltaY) * 6)); fit(); }, { passive: false });

  // start in the living room, looking towards the terrace when there is one
  let start = data.points.findIndex(p => /estar/i.test(p.name)); if (start < 0) start = 0;
  const toTerrace = data.points[start].links.find(l => /^terraço$/i.test(data.points[l.to].name)) || data.points[start].links[0];
  if (toTerrace) yaw = Math.atan2(-toTerrace.dx, -toTerrace.dz);
  // opening: like dropping into Street View – looking down at the floor with an extra-wide angle, then the view lifts
  // up and opens into the room (a drag or the wheel takes over at once)
  const endFov = fov, endPitch = pitch, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm) { fov = 165; pitch = -1.3; }
  fit(); await go(start, true); onReady?.();
  if (!calm) {
    const t0 = performance.now(), D = 1900, ease = t => 1 - Math.pow(1 - t, 4), from = { fov, pitch, yaw }, turn = 0.35;   // + a slight turn while rising
    yaw -= turn; from.yaw = yaw;
    const step = now => {
      const t = Math.min(1, (now - t0) / D), e = ease(t);
      fov = from.fov + (endFov - from.fov) * e; pitch = from.pitch + (endPitch - from.pitch) * e; yaw = from.yaw + turn * e; fit();
      if (t < 1 && !dead) intro = requestAnimationFrame(step);
    };
    intro = requestAnimationFrame(step);
  }
  return { destroy() { dead = true; ro.disconnect(); el.replaceChildren(); el.classList.remove('pv'); } };
}

// line plan of the apartment (walls as thin strokes, window panes as hairlines), one dot per photo point – click a dot to
// go there; the current point carries a cone showing where you look. World x → right, z → down (same frame as the bake).
function planMap(el, data, onPick) {
  const { box: [x0, z0, x1, z1], walls, glass } = data.plan, w = x1 - x0, h = z1 - z0, NS = 'http://www.w3.org/2000/svg';
  const wrap = document.createElement('div'); wrap.className = 'pv-map';
  const r = a => `<rect x="${(a[0] - x0).toFixed(2)}" y="${(a[1] - z0).toFixed(2)}" width="${(a[2] - a[0]).toFixed(2)}" height="${(a[3] - a[1]).toFixed(2)}"/>`;
  wrap.innerHTML = `<svg viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" aria-label="Planta">
    <g class="pv-map-glass">${glass.map(r).join('')}</g><g class="pv-map-walls">${walls.map(r).join('')}</g>
    <path class="pv-map-cone" d=""/><g class="pv-map-pts"></g></svg>`;
  const svg = wrap.firstElementChild, cone = svg.querySelector('.pv-map-cone'), pts = svg.querySelector('.pv-map-pts');
  const dots = data.points.map((p, i) => {
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pv-map-pt'); g.setAttribute('transform', `translate(${(p.x - x0).toFixed(2)} ${(p.z - z0).toFixed(2)})`);
    g.innerHTML = `<title>${p.name}</title><circle class="hit" r="0.55"/><circle class="dot" r="0.2"/>`;
    g.addEventListener('click', e => { e.stopPropagation(); onPick(i); });
    g.addEventListener('pointerdown', e => e.stopPropagation());
    pts.appendChild(g); return g;
  });
  wrap.addEventListener('pointerdown', e => e.stopPropagation());
  el.appendChild(wrap);
  let cur = 0, yaw = 0, hf = 90;
  const draw = () => {
    const p = data.points[cur]; if (!p) return;
    const cx = p.x - x0, cz = p.z - z0, R = 1.6, half = Math.min(hf, 150) * Math.PI / 360;
    const pt = a => `${(cx - Math.sin(a) * R).toFixed(2)} ${(cz - Math.cos(a) * R).toFixed(2)}`;   // view direction = (−sin yaw, −cos yaw)
    cone.setAttribute('d', `M${cx.toFixed(2)} ${cz.toFixed(2)} L${pt(yaw - half)} A${R} ${R} 0 0 0 ${pt(yaw + half)} Z`);
  };
  return {
    at(i) { cur = i; dots.forEach((d, k) => d.classList.toggle('on', k === i)); pts.appendChild(dots[i]); draw(); },
    look(y, horizFov) { yaw = y; hf = horizFov; draw(); },
  };
}
