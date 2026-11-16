// glass panes: fewer on phones; each pane shows the picture aligned to the viewport (+ a small refraction shift)
const panes = document.getElementById('panes'), hero = document.getElementById('stage');
function buildPanes() {
  const w = hero.clientWidth, n = w < 480 ? 5 : w < 1000 ? 7 : 9;
  panes.replaceChildren();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div'); p.className = 'pane';
    const mid = (n - 1) / 2, k = Math.abs(i - mid);
    p.style.setProperty('--d', (0.25 + k * 0.12 + (i % 2) * 0.05).toFixed(2) + 's');   // centre first, outwards
    p.style.setProperty('--from', (i % 2 ? '-110%' : '110%'));                          // alternate up / down
    p.style.setProperty('--skew', (i % 2 ? 4 : -4) + 'deg');
    p.style.setProperty('--shift', ((i - mid) * -3) + 'px');
    p.style.setProperty('--float', (i % 2 ? -7 : 7) + 'px');
    panes.appendChild(p);
  }
  placePanes();
}
function placePanes() {
  const w = hero.clientWidth;
  for (const p of panes.children) { p.style.setProperty('--x', p.offsetLeft + 'px'); p.style.setProperty('--vw', w + 'px'); }
}
buildPanes();
let lastN = panes.children.length;
addEventListener('resize', () => { const w = hero.clientWidth, n = w < 480 ? 5 : w < 1000 ? 7 : 9; if (n !== lastN) { lastN = n; buildPanes(); document.body.classList.contains('done') && panes.classList.add('settle'); } else placePanes(); });

// the 360° (tour.html?apt=terreo&embed=home – aerial view only, no interior) loads behind the hero while the logo
// animates. When both are done the hero slides up and the building flies in from far away, then keeps orbiting.
// Scrolling slides the text panel over it. No WebGL / load failure / 40 s timeout → the plain page (hero, then tours).
const body = document.body, sceneEl = document.getElementById('scene'), frame = document.getElementById('three'), hint = document.getElementById('hint'), panel = document.getElementById('panel');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// 3D only on a real GPU: software WebGL (SwiftShader / llvmpipe: Lighthouse, Googlebot, PCs without a GPU driver),
// Data Saver and very weak phones get the plain page – the 3D city would freeze them
const gl = (() => { try {
  const c = document.createElement('canvas').getContext('webgl2'); if (!c) return false;
  const ext = c.getExtension('WEBGL_debug_renderer_info'), r = ext ? String(c.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  c.getExtension('WEBGL_lose_context')?.loseContext();
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r)) return false;
  if (navigator.connection?.saveData) return false;
  if ((navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 3)) return false;
  return true; } catch { return false; } })();
let introDone = false, ready3d = false, lifted = false;
if (gl) {
  body.classList.add('has3d');
  frame.src = 'tour.html?apt=terreo&embed=home';
  addEventListener('message', e => {
    if (e.origin !== location.origin || e.data !== 'platinum-3d-ready') return;
    ready3d = true; sceneEl.classList.add('ready'); maybeLift();
  });
  var fail = setTimeout(() => { if (!ready3d) { body.classList.remove('has3d'); frame.removeAttribute('src'); } }, 40000);
}
const post = msg => frame.contentWindow && frame.contentWindow.postMessage(msg, location.origin);
function maybeLift() {
  if (lifted || !introDone || !ready3d) return;
  lifted = true; clearTimeout(fail); scrollTo(0, 0);
  body.classList.add('lift'); post({ type: 'intro' });
  setTimeout(() => load(shots[0]), 3500);
  body.classList.remove('locked');
}
// the white panel: the two words rise when it is well into view; the renders are fetched only after the hero lifts
// (first one early, the rest when the panel shows up) so they never compete with the 3D download
const MINI_YAW = new URLSearchParams(location.search).has('yaw') ? +new URLSearchParams(location.search).get('yaw') : -1.5708;
const feel = document.getElementById('feel'), shots = [...document.querySelectorAll('#frame img')], capName = document.getElementById('capName');
const load = im => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } };
new IntersectionObserver(es => { for (const e of es) panel.classList.toggle('show', e.isIntersecting); }, { rootMargin: '0px 0px -38% 0px' }).observe(panel);
new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); panel.querySelectorAll('img[data-src]').forEach(load); } }).observe(panel);
{ const o = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }, { rootMargin: '0px 0px -12% 0px' });
  panel.querySelectorAll('.rv').forEach(el => o.observe(el)); }
// the gap between the words follows the scroll (0 → 1 over the first 55 % of the pinned stretch); while it is open
// the renders cross-fade every few seconds
let gapP = 0, shot = 0;
function openGap() {
  const r = feel.getBoundingClientRect(), t = Math.min(1, Math.max(0, -r.top / ((r.height - innerHeight) * 0.55)));
  const p = t * t * (3 - 2 * t);
  if (p !== gapP) { gapP = p; feel.style.setProperty('--p', p.toFixed(4)); }
  feel.classList.toggle('leaving', r.bottom < innerHeight * 1.25);   // the caption goes before the next screen arrives
}
setInterval(() => {
  if (gapP < 0.2 || document.hidden || feel.getBoundingClientRect().bottom < 0) return;
  const next = shots[(shot + 1) % shots.length]; if (!next.complete || !next.naturalWidth) return;
  shots[shot].classList.remove('on'); shot = (shot + 1) % shots.length; next.classList.add('on'); capName.textContent = next.dataset.cap;
}, 2800);
addEventListener('resize', openGap);
document.getElementById('feelGo').addEventListener('click', () => {   // picture still closed → open it; open → on to the levels
  const r = feel.getBoundingClientRect(), top = r.top + scrollY;
  scrollTo({ top: gapP < 0.98 ? top + (r.height - innerHeight) * 0.6 : top + r.height, behavior: reduced ? 'auto' : 'smooth' }); document.getElementById('feelGo').blur(); });
// the little levels: baked models (tools/bake_mini.mjs, ~110 + 40 KB) drawn by home/mini3d.js, fetched only when the
// block comes close. The block stays pinned while the page scrolls: the 1º pavimento comes down onto the térreo, where
// it really sits, and the text and the numbered points switch to it. A point opens its render + a few words.
{ const LEVELS = [
    { key: 'terreo', title: 'Térreo', sub: 'Implantação · lazer e estacionamento', tag: 'Toque nos pontos · role para subir',
      places: [   // same order as the points baked into terreo-mini.bin
        ['acesso', 'Acesso social', 'A chegada pela Praça Heitor Levi: acesso social e portaria com caixilhos, vidro e porta blindados.', 'acesso'],
        ['lobby', 'Lobby com pé-direito duplo', 'Pé-direito duplo, grandes panos de vidro e paisagismo: a luz natural recebe você logo na entrada.', 'lobby'],
        ['lobby2', 'Lobby do estacionamento', 'O segundo lobby, junto aos elevadores: quem chega de carro também é recebido com pé-direito alto, madeira e luz natural.', 't-lobby2'],
        ['coworking', 'Coworking', 'Um espaço reservado para trabalhar ou estudar a poucos passos de casa.', 't-coworking'],
        ['casa', 'Casa de campo', 'Um living aberto para o jardim, com spa e churrasqueira, para receber sem pressa.', 't-casa'],
        ['spa', 'Deck com spa', 'Deck de madeira com spa aquecido e espreguiçadeiras, aberto para o jardim e para a casa de campo.', 't-spa'],
        ['pet', 'Pet place', 'Área ao ar livre para os pets brincarem, ao lado do pet care.', 't-pet'],
        ['churrasqueira', 'Churrasqueira', 'Churrasqueira com bancada, ilha e mesa sob o pergolado de madeira, aberta para a quadra.', 't-churrasqueira'],
        ['quadra', 'Quadra recreativa', 'Para jogar, treinar ou só gastar energia sem sair do condomínio.', 't-quadra'],
      ] },
    { key: 'pav1', title: '1º Pavimento', sub: 'Beauty, massagem e bicicletário', tag: 'Toque nos pontos · role para subir',
      places: [   // same order as the points baked into pav1-mini.bin
        ['beauty', 'Espaço beauty', 'Um salão completo dentro do condomínio, com terraço próprio e luz natural.', 't-beauty'],
        ['massagem', 'Salas de massagem', 'Salas reservadas e silenciosas para massagem e relaxamento, ao lado do espaço beauty.', 't-massagem'],
        ['bike', 'Bicicletário', 'Bicicletário amplo, com suportes e espaço para manutenção, a um elevador da rua.', 't-bike'],
        ['terraco', 'Terraço', 'Um terraço aberto no 1º pavimento, de frente para a praça.', null],
      ] },
    { key: 'pav2', title: '2º Pavimento', sub: 'Lazer: piscinas, fitness, festas e jogos', tag: 'Toque nos pontos · role para continuar',
      places: [   // same order as the points baked into pav2-mini.bin
        ['fitness', 'Fitness', 'Fitness de 200 m² com sala multifuncional, equipado para treinar sem sair de casa.', 't-fitness'],
        ['gourmet', 'Espaço gourmet', 'Cozinha aberta e mesa para receber em 60 m², ao lado do terraço.', 't-gourmet'],
        ['terraco', 'Terraço de festas', 'Terraço coberto entre o salão de festas e o espaço gourmet, com sofás, poltronas e vista aberta para o bairro.', 't-terraco2'],
        ['salao', 'Salão de festas', '130 m² para festas e encontros, com lounge e terraço próprios.', 't-salao'],
        ['jogos', 'Espaço jogos', 'Mesas de jogos e um lounge para reunir os amigos.', 't-jogos'],
        ['brinquedoteca', 'Brinquedoteca', 'Um espaço lúdico e seguro para as crianças, junto à pista infantil.', 't-brinquedoteca'],
        ['churrasqueira', 'Churrasqueira com forno de pizza', 'Churrasqueira e forno de pizza ao ar livre, ao lado do playground.', 't-churrasqueira2'],
        ['playground', 'Playground', 'Brinquedos ao ar livre para as crianças, com a churrasqueira por perto.', 't-playground'],
        ['spa', 'Spa e sauna seca', 'Spa aquecido, sauna seca e vestiários, com o pool bar ao lado.', 't-spa2'],
        ['piscina', 'Piscina adulto', 'Raia dupla de 25 m, deck molhado e solarium com vista para o bairro.', 't-piscina2'],
      ] },
  ];
  const mini = document.getElementById('mini'), spotsEl = document.getElementById('spots'), side = document.getElementById('side'), detail = document.getElementById('detail');
  const stack = document.getElementById('stack'), mag = document.getElementById('mag');
  const $ = id => document.getElementById(id), two = n => String(n).padStart(2, '0');
  let lv = 0, PLACES = LEVELS[0].places, btns = [], cur = -1, swap = 0, view = null, fbImg = null, goals = { lift: [0, 0, 0], fade: [0, 0, 0], active: 0, scroll: 0 };   // (set by onStack)
  const makeSpots = () => {
    spotsEl.replaceChildren();
    btns = PLACES.map(([, title], i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'spot'; b.textContent = i + 1; b.title = title; b.setAttribute('aria-label', title);
      b.addEventListener('click', () => open(i));
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') view?.tint?.(PLACES[i][0]); });   // hover: that area in colour
      b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') view?.tint?.(null); });
      b.addEventListener('focus', () => view?.tint?.(PLACES[i][0])); b.addEventListener('blur', () => view?.tint?.(null));
      spotsEl.append(b); return b; });
  };
  makeSpots();
  // the place on show beside the plan: always one (the level's first by default); the arrows and the points change it
  function open(i) {
    i = (i + PLACES.length) % PLACES.length; const [id, title, desc, img] = PLACES[i], first = cur < 0; cur = i;
    btns.forEach((b, k) => b.classList.toggle("sel", k === i)); view?.pick(id);
    detail.classList.remove('show'); clearTimeout(swap);
    $('dNum').textContent = two(i + 1); $('dOf').textContent = ' / ' + two(PLACES.length);
    // progress: one quiet segment per place of this floor (an indicator, not more buttons)
    const prog = $('dProg');
    if (prog.children.length !== PLACES.length || prog.dataset.lv !== String(lv)) {
      prog.dataset.lv = lv; prog.replaceChildren(...PLACES.map(() => document.createElement('i')));
    }
    [...prog.children].forEach((s, k) => s.classList.toggle('on', k === i));
    swap = setTimeout(() => {
      $('dTitle').textContent = title; $('dDesc').textContent = desc;
      const im = $('dImg'), show = () => { if (cur === i) detail.classList.add('show'); };
      detail.classList.toggle('noimg', !img);
      if (!img) { im.removeAttribute('src'); show(); return; }
      im.alt = 'Perspectiva ilustrada: ' + title; im.onload = im.onerror = show; im.src = `home/feel/${img}.jpg`; if (im.complete) show();
    }, first ? 0 : 380);
  }
  $('dPrev').addEventListener('click', () => open(cur - 1)); $('dNext').addEventListener('click', () => open(cur + 1));
  // keyboard: ← / → change the place while the floors block fills the screen (not inside a tour, not while typing)
  $('dPrev').setAttribute('aria-keyshortcuts', 'ArrowLeft'); $('dNext').setAttribute('aria-keyshortcuts', 'ArrowRight');
  addEventListener('keydown', e => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || document.documentElement.classList.contains('walking')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    const r = document.getElementById('mag').getBoundingClientRect();
    if (r.top > innerHeight * 0.3 || r.bottom < innerHeight * 0.7) return;
    e.preventDefault(); open(cur + (e.key === 'ArrowRight' ? 1 : -1));
  });
  open(0);
  // switch the title and the points to another level: the old lines leave upwards, the new ones rise into the same place
  const floorEl = document.getElementById('ft'), lvBtns = [...document.querySelectorAll('#lvls button')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  let swapTok = 0;
  function writeLevel() {
    const L = LEVELS[lv];
    $('fTitle').textContent = L.title; $('fSub').textContent = L.sub;
    $('tag').textContent = (matchMedia('(hover: hover)').matches ? 'Clique' : 'Toque') + ' nos pontos do mapa';   // short: one line beside the "next floor" link
    $('stackGo').querySelector('span').textContent = lv < LEVELS.length - 1 ? 'Próximo pavimento' : 'Continuar';   // says where it goes
    if (fbImg) fbImg.src = `home/feel/${['fachada', 't-massagem', 'piscina'][lv]}.jpg`;   // no-WebGL fallback picture follows the floor
  }
  writeLevel();
  // swipe the photo: next / previous place (phones; a mouse drag does nothing)
  { const ph = detail.querySelector('.ph'); let sx = null, sy = 0;
    ph.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    ph.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) open(cur + (dx < 0 ? 1 : -1)); });
    ph.addEventListener('pointercancel', () => { sx = null; }); }
  function setLevel(n) {
    if (n === lv) return; lv = n;
    PLACES = LEVELS[n].places; makeSpots(); open(0);
    lvBtns.forEach((b, k) => { b.classList.toggle('on', k === n); b.toggleAttribute('aria-current', k === n); });
    const els = [floorEl, $('tag')], tok = ++swapTok;
    if (calm.matches || !els[0].animate) { writeLevel(); return; }
    const outs = els.map((el, i) => el.animate([{}, { opacity: 0, translate: '0 -18px', filter: 'blur(6px)' }],
      { duration: 280, delay: i * 40, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }));
    Promise.all(outs.map(a => a.finished)).then(() => {
      if (tok !== swapTok) return;                                    // a newer swap took over
      writeLevel();
      els.forEach((el, i) => { el.getAnimations().forEach(a => a.cancel());
        el.animate([{ opacity: 0, translate: '0 22px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0)' }],
          { duration: 700, delay: i * 80, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }); });
    }).catch(() => {});
  }
  // scroll → the plans scroll through the frame like a film strip: the térreo rises out of the top while the 1º pavimento comes up
  // from the bottom to the centre, then the same for the 2º. Each level rests in the centre for part of the scroll.
  const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  function onStack() {
    const r = stack.getBoundingClientRect(), range = stack.offsetHeight - mag.offsetHeight;
    mag.style.top = Math.min(0, innerHeight - mag.offsetHeight) + 'px';   // taller than the screen (phones): it sticks with its bottom in view
    const t = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0, pos = t * (LEVELS.length - 1);
    const k = Math.min(LEVELS.length - 2, Math.floor(pos)), f = pos - k;   // step k → k + 1, f = 0..1 through it
    const s = k + smooth((f - 0.2) / 0.6), n = Math.round(s);          // s: where the strip is (fractional while moving)
    goals = { lift: LEVELS.map(() => 0), fade: LEVELS.map(() => 0), active: n, scroll: s };
    view?.set(goals); setLevel(n);
    spotsEl.classList.toggle('moving', Math.abs(s - n) > 0.02);
  }
  // the switch above the plan: scroll straight to that level's resting place (the film strip runs on its own way there)
  lvBtns.forEach((b, k) => b.addEventListener('click', () => {
    const range = stack.offsetHeight - mag.offsetHeight, top = stack.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + range * k / (LEVELS.length - 1) + (k === 0 ? 2 : 0), behavior: calm.matches ? 'auto' : 'smooth' });
  }));
  // the pill beside the hint under the plan: on to the next level's resting place; from the last level, on to the next screen
  $('stackGo').removeAttribute('aria-label');                         // the visible label (next floor / continue) is its name
  $('stackGo').addEventListener('click', e => {
    const range = stack.offsetHeight - mag.offsetHeight, top = stack.getBoundingClientRect().top + scrollY, last = LEVELS.length - 1;
    scrollTo({ top: lv < last ? top + range * (lv + 1) / last : top + stack.offsetHeight, behavior: calm.matches ? 'auto' : 'smooth' }); e.currentTarget.blur();
  });
  // the glass starts just before the text, leaving a clear gap after the 3D plan
  // big screens: the whole block (plan + text) scales with the screen, limited by its height so it still fits; phones / small: 1
  const placeGlass = () => {
    const z = innerWidth > 860 ? Math.min(1.9, Math.max(1, Math.min(innerWidth / 1440, innerHeight / 860))) : 1;
    if (mag.style.getPropertyValue('--z') !== z.toFixed(3)) mag.style.setProperty('--z', z.toFixed(3));
    const m = mag.getBoundingClientRect(), a = mini.getBoundingClientRect(), b = side.getBoundingClientRect();
    // a clear gap after the plan: the glass starts just before the text (a little padding inside it), never touching the plan
    if (b.left > a.right) mag.style.setProperty('--glassL', (Math.max(a.right + 24 * z, b.left - 44 * z) - m.left).toFixed(1) + 'px');
  };
  new ResizeObserver(placeGlass).observe(mag); addEventListener('resize', placeGlass); placeGlass();
  // statement: split into words (keeping <b>), then fill them in reading order with the scroll
  { const sayEl = document.getElementById('say'), t = document.getElementById('sayT'), units = document.getElementById('units'), words = [];
    const split = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => { if (!part) return; if (/^\s+$/.test(part)) { f.append(part); return; }
          const w = document.createElement('span'); w.className = 'w'; w.textContent = part; words.push(w); f.append(w); });
        n.replaceWith(f); }
      else if (n.nodeType === 1) split(n);
    });
    split(t);
    const fill = () => { const r = sayEl.getBoundingClientRect(), run = r.height - innerHeight;
      const k = run > 0 ? Math.min(1, Math.max(0, (-r.top + innerHeight * 0.35) / (run * 0.9 + innerHeight * 0.35))) : 1, at = k * words.length;
      words.forEach((w, i) => { const p = Math.min(1, Math.max(0, at - i)).toFixed(3); if (w.style.getPropertyValue('--p') !== p) w.style.setProperty('--p', p); }); };
    addEventListener('scroll', fill, { passive: true }); addEventListener('resize', fill); fill();
    document.getElementById('sayGo').addEventListener('click', e => {   // on to the plans (the first apartment)
      scrollTo({ top: units.getBoundingClientRect().top + scrollY + 1, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); e.currentTarget.blur(); }); }
  // the plans, one per screen (pinned): each apartment holds for a moment, then the next one wipes up over it (--e: 0 → 1 for that
  // slide, --x: how far the next one has covered it). The one on show (.on) brings its lines up; the switch on top jumps to one.
  { const sec = document.getElementById('units'), row = document.getElementById('uRow'), slides = [...row.querySelectorAll('.unit')], N = slides.length;
    const navB = [...document.querySelectorAll('#uNav button')], sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    sec.style.setProperty('--n', N);
    slides.forEach(s => [...s.querySelector('.u-txt').children].forEach((el, k) => { const m = document.createElement('span'); m.className = 'u-ln'; m.style.setProperty('--k', k); el.replaceWith(m); m.append(el); }));
    let act = -2, raf = 0;
    const paint = () => { raf = 0;
      const r = sec.getBoundingClientRect(), run = sec.offsetHeight - innerHeight;
      const pos = (run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0) * (N - 1);
      row.style.setProperty('--g', sm(1 - r.top / innerHeight).toFixed(4));          // the frame grows into place while it arrives
      let a = 0;
      slides.forEach((s, i) => {
        const e = i === 0 ? 1 : sm((pos - (i - 1) - 0.22) / 0.56), x = i + 1 < N ? sm((pos - i - 0.22) / 0.56) : 0;   // each step: hold, wipe (middle 56 %), hold
        s.style.setProperty('--e', e.toFixed(4)); s.style.setProperty('--x', x.toFixed(4));
        s.classList.toggle('seen', e > 0.001 && x < 0.999); s.classList.toggle('moving', x > 0.001);
        if (e >= 0.5) a = i;
      });
      if (r.top > innerHeight * 0.45 || r.bottom < innerHeight * 0.4) a = -1;      // off screen: the lines go back down, to rise again
      if (a !== act) { act = a; slides.forEach((s, i) => s.classList.toggle('on', i === a));
        navB.forEach((b, i) => { b.classList.toggle('on', i === Math.max(0, a)); b.toggleAttribute('aria-current', i === Math.max(0, a)); }); }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(paint); };
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); paint();
    navB.forEach((b, i) => b.addEventListener('click', () => { const run = sec.offsetHeight - innerHeight;
      scrollTo({ top: sec.getBoundingClientRect().top + scrollY + run * i / (N - 1) + 1, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }));
    // each apartment's plan, drawn from its tour's pano.json like the map inside the tour: walls, window panes, a dot + name per room
    const planSvg = d => {
      const [x0, z0, x1, z1] = d.plan.box, f = n => n.toFixed(2);
      const rect = (a, c) => `<rect class="${c}" x="${f(a[0] - x0)}" y="${f(a[1] - z0)}" width="${f(a[2] - a[0])}" height="${f(a[3] - a[1])}"/>`;
      return `<svg viewBox="0 0 ${f(x1 - x0)} ${f(z1 - z0)}">${d.plan.glass.map(a => rect(a, 'g')).join('')}${(d.plan.rail || []).map(a => rect(a, 'r')).join('')}${d.plan.walls.map(a => rect(a, 'w')).join('')}`
        + d.points.map(p => `<circle class="d" cx="${f(p.x - x0)}" cy="${f(p.z - z0)}" r=".15"/><text x="${f(p.x - x0)}" y="${f(p.z - z0 + .58)}">${p.name}</text>`).join('') + '</svg>';
    };
    const drawPlans = () => slides.forEach(s => {
      const id = s.dataset.pano || s.dataset.apt, host = s.querySelector('.u-svg');
      fetch(new URL(`home/pano/${id}/pano.json`, document.baseURI)).then(r => r.json()).then(d => { host.innerHTML = planSvg(d); })
        .catch(() => s.querySelector('.u-pl')?.remove());
    });
    new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); drawPlans(); } }, { rootMargin: '800px 0px' }).observe(sec);
  }
  // the visit panel: the lobby's baked 360° photo (visita/pano/2_*, the visit's own) as a CSS cube turning slowly – slower while the
  // mouse is over it, a touch faster with the scroll. The whole panel opens the visit at the lobby; a "click to enter" disc trails the cursor.
  { const a = document.getElementById('lobIn'), host = document.getElementById('lobPv'), cam = host.firstElementChild, go = document.getElementById('lobGo');
    const FT = { f: '', r: 'rotateY(-90deg) ', b: 'rotateY(180deg) ', l: 'rotateY(90deg) ', u: 'rotateX(-90deg) ', d: 'rotateX(90deg) ' }, S = 1024, H = S / 2;
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    let yaw = 0.6, P = 600, on = false, raf = 0, last = 0, lastY = scrollY, mx = 0, my = 0, tx = 0, ty = 0, hov = false, spin = 1;
    const fit = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1, hf = w > h ? 96 : 84;
      const vf = Math.min(100, 2 * Math.atan(Math.tan(hf * Math.PI / 360) * h / w) * 180 / Math.PI);
      P = h / 2 / Math.tan(vf * Math.PI / 360); host.style.perspective = P.toFixed(1) + 'px'; };
    new ResizeObserver(fit).observe(host); fit();
    const build = () => {
      const ims = Object.keys(FT).map(f => { const im = new Image(); im.className = 'lob-face'; im.alt = ''; im.decoding = 'async'; im.draggable = false;
        im.src = new URL(`visita/pano/2_${f}.jpg`, document.baseURI).href;
        im.style.cssText = `width:${S}px;height:${S}px;margin:${-H}px 0 0 ${-H}px;transform:${FT[f]}translateZ(${-H}px) scale(1.004)`; cam.append(im); return im; });
      Promise.all(ims.map(im => im.decode().catch(() => {}))).then(() => host.classList.add('ready'));
    };
    const frame = now => { raf = 0; if (!on) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; const dy = scrollY - lastY; lastY = scrollY;
      spin += ((hov ? 0.35 : 1) - spin) * 0.04;
      if (!calm.matches) yaw += dt * 0.08 * spin + dy * 0.0005;                   // about one turn in 80 s
      cam.style.transform = `translateZ(${P.toFixed(1)}px) rotateX(0.03rad) rotateY(${(-yaw).toFixed(4)}rad)`;
      tx += (mx - tx) * 0.18; ty += (my - ty) * 0.18;
      go.style.setProperty('--mx', tx.toFixed(1) + 'px'); go.style.setProperty('--my', ty.toFixed(1) + 'px');
      raf = requestAnimationFrame(frame); };
    new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); build(); } }, { rootMargin: '900px 0px' }).observe(a);
    new IntersectionObserver(es => es.forEach(e => { on = e.isIntersecting; last = 0; lastY = scrollY; if (on && !raf) raf = requestAnimationFrame(frame); })).observe(a);
    const at = e => { const r = a.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    a.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; at(e); tx = mx; ty = my; hov = true; a.classList.add('hov'); });
    a.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; at(e); if (!hov) { tx = mx; ty = my; hov = true; a.classList.add('hov'); } });
    a.addEventListener('pointerleave', () => { hov = false; a.classList.remove('hov'); }); }
  }
  // contact: an editorial block (big headline, numbered list, marquee). It rises into view once; the floating WhatsApp
  // steps aside while it is on screen (the contact has its own WhatsApp button)
  { const sec = document.getElementById('contato'), waFab = document.getElementById('waFab');
    new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { sec.classList.add('in'); o.disconnect(); } }, { rootMargin: '0px 0px -20% 0px' }).observe(sec);
    new IntersectionObserver(es => es.forEach(e => waFab?.classList.toggle('off', e.isIntersecting)), { rootMargin: '-30% 0px -30% 0px' }).observe(sec);
    const btn = document.getElementById('ctCopy'), mail = document.getElementById('ctMail').textContent.trim();
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mail); } catch { const t = document.createElement('textarea'); t.value = mail; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
      const icon = btn.innerHTML; btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'; btn.classList.add('ok'); btn.setAttribute('aria-label', 'E-mail copiado');
      setTimeout(() => { btn.innerHTML = icon; btn.classList.remove('ok'); btn.setAttribute('aria-label', 'Copiar o e-mail'); }, 2200); }); }
  function goContact() { document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' }); }
  if (location.hash === '#contato') addEventListener('load', () => setTimeout(() => document.getElementById('contato').scrollIntoView(), 400));
  // plan cards: a click opens a street-view style visit - baked 360° photos (home/pano.js), not the live 3D - in a modal
  // that grows out of the card (full screen on phones). Plan tabs in the modal switch apartments. Big screens get the
  // HD photo set (home/pano/<apt>/hd/, 1536 px faces), falling back to the standard one.
  { const row = document.querySelector('.units-row'), cards = [...row.querySelectorAll('.unit')], phone = matchMedia('(hover: none), (max-width: 860px)');
    let modal = null, walk = null, cur = null;
    const R = 22, ez = 'cubic-bezier(.2, .8, .2, 1)';
    const clipFrom = (card, box) => { const a = card.getBoundingClientRect(), b = box.getBoundingClientRect();
      return `inset(${a.top - b.top}px ${b.right - a.right}px ${b.bottom - a.bottom}px ${a.left - b.left}px round ${R}px)`; };
    const closeWalk = () => {
      if (!modal) return;
      if (document.fullscreenElement) document.exitFullscreen();
      const m = modal, w = walk, card = cur; modal = walk = cur = null;
      document.documentElement.classList.remove('walking');
      m.classList.add('closing');
      const a = card.getBoundingClientRect();
      const shrink = !m.classList.contains('full') && a.bottom > 0 && a.top < innerHeight;
      if (shrink) w.animate([{ clipPath: `inset(0 round ${R}px)` }, { clipPath: clipFrom(card, w) }], { duration: 420, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
      setTimeout(() => { w._viewer?.destroy(); m.remove(); }, shrink ? 430 : 360);
    };
    const loadPano = (w, card, full, alt) => {
      const id = alt ? card.dataset.panoAlt : card.dataset.pano || card.dataset.apt, std = `home/pano/${id}/`;
      const bases = !full && Math.max(innerWidth, innerHeight) * devicePixelRatio > 1300 ? [`${std}hd/`, std] : [std];
      const tryBase = k => import(new URL('home/pano.js', document.baseURI).href)
        .then(mod => mod.pano(w.querySelector('.pv-host'), { base: bases[k], onReady: () => { w.classList.add('ready'); setTimeout(() => w.classList.add('used'), 6500); } }))
        .catch(err => { if (k + 1 < bases.length) return tryBase(k + 1); throw err; });
      tryBase(0).then(v => { if (w.isConnected) w._viewer = v; else v.destroy(); })
        .catch(err => { console.error('pano:', err); w.querySelector('.u-load span:last-child').textContent = 'Não foi possível abrir o tour'; });
    };
    let alt = false;                                                   // 93 m²: showing the original 3-dorm plan instead of the personalized one
    const openWalk = (card, grow = true, useAlt = false) => {
      if (card === cur && useAlt === alt) return;
      alt = useAlt && !!card.dataset.panoAlt;
      const full = phone.matches, name = `${card.querySelector('.u-type').textContent} · ${card.querySelector('.u-m').textContent}`;
      if (!modal) {
        modal = document.createElement('div'); modal.className = 'u-modal' + (full ? ' full' : '');
        modal.addEventListener('click', e => { if (e.target === modal) closeWalk(); });
        document.body.append(modal); document.documentElement.classList.add('walking');
      } else { walk?._viewer?.destroy(); walk?.remove(); grow = false; }
      cur = card;
      const tabs = cards.map(c => `<button type="button" data-apt="${c.dataset.apt}"${c === card ? ' class="on" aria-current="true"' : ''}>${c.querySelector('.u-m').textContent}</button>`).join('');
      walk = document.createElement('div'); walk.className = 'u-walk';
      walk.innerHTML = `<div class="pv-host" role="application" aria-label="Tour 360° – ${name}"></div>
        <div class="u-load"><span class="u-spin"></span><span>Preparando o tour</span></div>
        <div class="u-bar"><span class="u-chip">${name}</span>${(alt ? card.dataset.altNote : card.dataset.note) ? `<span class="u-chip u-chip-note">${alt ? card.dataset.altNote : card.dataset.note}</span>` : ''}${card.dataset.panoAlt ? `<button class="u-alt" type="button" data-a="alt">${alt ? 'Ver planta personalizada' : 'Explorar com 3 dorms'}</button>` : ''}<nav class="u-plans" aria-label="Plantas">${tabs}</nav><button class="u-talk" type="button" data-a="talk">Fale conosco</button><button class="u-btn" type="button" data-a="fs" aria-label="Tela cheia">⤢</button><button class="u-btn" type="button" data-a="x" aria-label="Fechar o tour">×</button></div>
        <p class="u-hint">Arraste para olhar · ${full ? 'toque' : 'clique'} nas setas para andar</p><p class="ill-tag u-ill">Perspectiva ilustrativa</p>`;
      walk.style.backgroundImage = `url("${card.querySelector('img').src}")`;
      modal.append(walk);
      { const w = walk, bar = w.querySelector('.u-bar'); new ResizeObserver(() => w.style.setProperty('--bh', bar.offsetHeight + 'px')).observe(bar); }   // phones: map + tag go under the bar
      if (grow && !full) walk.animate([{ clipPath: clipFrom(card, walk) }, { clipPath: `inset(0 round ${R}px)` }], { duration: 650, easing: ez });
      else if (!grow) walk.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      const w = walk;
      w.querySelector('[data-a=x]').addEventListener('click', closeWalk);
      w.querySelector('[data-a=talk]').addEventListener('click', () => { closeWalk(); setTimeout(goContact, 450); });
      w.querySelector('[data-a=fs]').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : w.requestFullscreen?.());
      w.querySelectorAll('.u-plans button').forEach(b => b.addEventListener('click', () => openWalk(cards.find(c => c.dataset.apt === b.dataset.apt))));
      w.querySelector('[data-a=alt]')?.addEventListener('click', () => openWalk(card, false, !alt));
      loadPano(w, card, full, alt);
    };
    cards.forEach(c => c.querySelector('.u-open').addEventListener('click', () => openWalk(c)));
    // /?tour=27 (the plan pages' "Entrar no tour 3D"): once the intro is over, go to that apartment and open its tour
    { const want = cards.find(c => c.dataset.apt === new URLSearchParams(location.search).get('tour'));
      if (want) { const t = setInterval(() => { if (!document.body.classList.contains('done') || document.body.classList.contains('locked')) return; clearInterval(t);
        const sec = document.getElementById('units'), i = cards.indexOf(want), run = sec.offsetHeight - innerHeight;
        scrollTo(0, sec.getBoundingClientRect().top + scrollY + (run > 0 ? run * i / (cards.length - 1) : 0) + 1);
        setTimeout(() => openWalk(want), 500); }, 250); } }
    addEventListener('keydown', e => { if (e.key === 'Escape' && cur && !document.fullscreenElement) closeWalk(); });
  }
  addEventListener('scroll', onStack, { passive: true }); addEventListener('resize', onStack); onStack();
  // no WebGL2 / the model failed: a render of the level in place of the 3D plan. The title, the floor switch and the
  // "next floor" link stay (the script keeps using them), only the canvas and the numbered points go.
  const FB = ['fachada', 't-massagem', 'piscina'];   // (not the first place's own picture, which shows in the card beside it)
  const fallback = () => { if (fbImg) return; mini.classList.add('nogl'); fbImg = new Image(); fbImg.decoding = 'async'; fbImg.alt = 'Perspectiva ilustrada do Platinum Tatuapé'; fbImg.src = `home/feel/${FB[lv]}.jpg`; mini.prepend(fbImg); const tg = mini.querySelector('.ill-mini'); if (tg) tg.textContent = 'Perspectiva ilustrativa'; };
  new IntersectionObserver((es, o) => {
    if (!es.some(e => e.isIntersecting)) return; o.disconnect();
    if (!gl) { fallback(); return; }   // same rule as the hero: no 3D without a real GPU
    import(new URL('home/mini3d.js', document.baseURI).href).then(m => m.mini3d(document.getElementById('miniC'), { urls: ['home/terreo-mini.bin', 'home/pav1-mini.bin', 'home/pav2-mini.bin'], yaw: MINI_YAW, pitch: 1.5707,
      onFrame(ps) { ps.forEach((p, k) => { if (!btns[k]) return; btns[k].style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`; btns[k].style.zIndex = (k === cur ? 3000 : 1000) - Math.round(p.front); }); } }))
      .then(v => { view = v; v.set(goals); if (cur >= 0) v.pick(PLACES[cur][0]); mini.classList.add('on'); }).catch(e => { console.error('mini3d:', e); fallback(); });
  }, { rootMargin: '900px 0px' }).observe(mini);
}
// scroll: hide the hint; stop rendering the 360° once the panel covers it completely (phones / old computers)
let raf = 0, covered = false;
addEventListener('scroll', () => {
  if ((!lifted && body.classList.contains('has3d')) || raf) return;   // (with the 3D: only once the hero has lifted; without it: always)
  raf = requestAnimationFrame(() => {
    raf = 0;
    hint.classList.toggle('gone', scrollY > 24);
    openGap();
    const c = panel.getBoundingClientRect().top <= 1;
    if (c !== covered) { covered = c; post({ type: 'pause', on: c }); }
  });
}, { passive: true });
// drag on the 360° → rotate it (mouse: also tilt). The 3D frame itself takes no pointer input, so the wheel and
// vertical swipes keep scrolling the page; touch-action: pan-y leaves horizontal swipes for the rotation.
{ const view = sceneEl.querySelector('.view'); let id = null, x = 0, y = 0;
  view.addEventListener('pointerdown', e => { if (!lifted || (e.pointerType === 'mouse' && e.button !== 0)) return; id = e.pointerId; x = e.clientX; y = e.clientY; view.setPointerCapture(id); view.classList.add('drag'); });
  view.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const k = 3.2 / view.clientWidth, dx = (e.clientX - x) * k, dy = e.pointerType === 'mouse' ? (e.clientY - y) * k * 0.6 : 0; x = e.clientX; y = e.clientY;
    if (dx || dy) { post({ type: 'rotate', dx, dy }); hint.classList.add('gone'); }
  });
  const end = e => { if (e.pointerId === id) { id = null; view.classList.remove('drag'); } };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
}
// the pill over the 360°: scrolls on to the white panel (a click, not a drag – it keeps its pointer from the rotation)
{ const b = document.getElementById('hintB'); b.addEventListener('pointerdown', e => e.stopPropagation());
  b.addEventListener('click', () => scrollTo({ top: panel.getBoundingClientRect().top + scrollY, behavior: reduced ? 'auto' : 'smooth' }));
  if (matchMedia('(hover: none)').matches) document.getElementById('hintD').textContent = 'Deslize para girar'; }
document.addEventListener('visibilitychange', () => { if (lifted) post({ type: 'pause', on: document.hidden || covered }); });

// intro finished (or skipped): panes switch to a slow float; scroll unlocks now (no 3D) or when the hero lifts
const finish = () => {
  introDone = true; body.classList.add('done'); panes.classList.add('settle');
  if (body.classList.contains('has3d')) maybeLift(); else body.classList.remove('locked');
};
const timer = setTimeout(finish, 4600);
document.getElementById('skip').addEventListener('click', () => { clearTimeout(timer); body.classList.add('instant'); finish(); });
if (reduced) { clearTimeout(timer); finish(); }
// the 3D failed while the visitor waits on the finished hero → unlock
if (gl) setTimeout(() => { if (!lifted) { body.classList.remove('locked'); } }, 40100);

// the info section: each block rises in once it enters the view, siblings staggered
{ const els = [...document.querySelectorAll('.ix [data-rv]')];
  const groups = new Map(); els.forEach(el => { const k = el.parentElement; groups.set(k, (groups.get(k) || 0) + 1); el.style.setProperty('--rv', groups.get(k) - 1); });
  if (!('IntersectionObserver' in window)) els.forEach(el => el.classList.add('in'));
  else { const o = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => o.observe(el)); } }
