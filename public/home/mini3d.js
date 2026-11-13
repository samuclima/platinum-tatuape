// Tiny viewer for baked levels (tools/bake_mini.mjs → <level>-mini.bin): plain WebGL2, no library.
// Flat colours per vertex, face normals from screen-space derivatives. Several levels can be stacked: they all share
// one frame (tower centre, street level), level 0 sets the framing. A level can be lifted (it flies in from above)
// and faded towards white (context under the active level); only the active level reports its points.
//   const v = await mini3d(canvas, { urls: [...], onFrame(spots) })   spots: [{ id, x, y, front }] in CSS px
//   v.set({ lift: [0, 30], fade: [0, 0], active: 0 })   v.focus(id | null)
async function loadBin(url) {
  if ('DecompressionStream' in window) try {
    const r = await fetch(url + '.gz'); if (!r.ok) throw 0;
    const b = new Uint8Array(await r.arrayBuffer());
    if (b[0] !== 0x1f || b[1] !== 0x8b) return b.buffer;                 // the server already unpacked it
    return await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  } catch { /* plain file below */ }
  const r = await fetch(url); if (!r.ok) throw new Error('mini3d: ' + r.status); return r.arrayBuffer();
}
const VS = `#version 300 es
in vec3 p; in float c; uniform mat4 m; uniform vec3 o; uniform vec3 a; uniform float g; uniform float lh; uniform float sy; out vec3 w; out vec3 k; out vec2 q; out float hb;
void main() { q = (p * g + a).xz; hb = (p * g + a).y - lh; w = p * g + a - o; k = vec3(floor(c / 2048.) / 31., mod(floor(c / 32.), 64.) / 63., mod(c, 32.) / 31.); gl_Position = m * vec4(w, 1.); gl_Position.y += sy * gl_Position.w; }`;   // sy: the level scrolled up / down the frame
const FS = `#version 300 es
precision highp float; in vec3 w; in vec3 k; in vec2 q; in float hb; uniform vec3 e; uniform float fd; uniform vec4 sr[4]; uniform float so; out vec4 f;
void main() {
  vec3 n = normalize(cross(dFdx(w), dFdy(w))); if (dot(n, e - w) < 0.) n = -n;
  float d = max(dot(n, normalize(vec3(.35, .82, .45))), 0.), s = max(dot(n, normalize(vec3(-.6, .3, -.7))), 0.);
  vec3 base = mix(vec3(dot(k, vec3(.3, .55, .15))), k, .42);             // less saturated
  base = mix(base, vec3(.97, .96, .975), .38);                          // lighter, like a painted maquette
  vec3 col = base * (.62 + .4 * d + .06 * s);
  col *= mix(.86, 1., clamp(n.y * 2. + smoothstep(0., 1.4, w.y + 1.), 0., 1.));     // walls darken a little towards the floor
  // black and white everywhere; the selected place (sr = up to 4 boxes x0, z0, x1, z1; so = 0..1) gets its colours back, a little richer
  float ins = 0.;
  for (int i = 0; i < 4; i++) { vec2 in2 = smoothstep(sr[i].xy - .25, sr[i].xy + .25, q) * (1. - smoothstep(sr[i].zw - .25, sr[i].zw + .25, q)); ins = max(ins, in2.x * in2.y); }
  vec3 rich = mix(vec3(dot(k, vec3(.3, .55, .15))), k, .8) * (.6 + .42 * d + .06 * s);
  col = mix(vec3(dot(col, vec3(.3, .55, .15))), rich, ins * so);
  col = mix(col, vec3(.975, .97, .985), .62 * (1. - step(-.2, hb)));     // below this level's floor (garden, street): only a light context
  f = vec4(mix(col, vec3(.975, .97, .985), fd), 1.);                    // fd: a level shown only as context
}`;
function parse(buf) {
  const dv = new DataView(buf), jl = dv.getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, jl))), nv = head.nv;
  let off = 4 + jl; off += (4 - off % 4) % 4;
  const st = new Uint16Array(buf, off, nv * 4); off += nv * 8; off += (4 - off % 4) % 4;
  const idx = head.u32 ? new Uint32Array(buf, off, head.ni) : new Uint16Array(buf, off, head.ni);
  for (let i = 1; i < idx.length; i++) idx[i] += idx[i - 1];              // undo the delta coding
  const pos = new Uint16Array(nv * 3); for (let i = 0; i < nv; i++) { pos[i * 3] = st[i]; pos[i * 3 + 1] = st[nv + i]; pos[i * 3 + 2] = st[2 * nv + i]; }
  return { head, pos, col: st.subarray(3 * nv, 4 * nv), idx };
}
export async function mini3d(canvas, { urls, url, onFrame, yaw = 0, pitch = 0.62 } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('mini3d: no WebGL2');
  urls = urls || [url];
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(pr, 0, 'p'); gl.bindAttribLocation(pr, 1, 'c'); gl.linkProgram(pr); gl.useProgram(pr);
  const U = n => gl.getUniformLocation(pr, n), uM = U('m'), uO = U('o'), uA = U('a'), uG = U('g'), uE = U('e'), uF = U('fd'), uR = U('sr[0]'), uS = U('so'), uL = U('lh'), uY = U('sy');
  const upload = ({ head, pos, col, idx }) => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.UNSIGNED_SHORT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.UNSIGNED_SHORT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    return { head, vao, n: idx.length, type: head.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, lift: 0, gLift: 0, fade: 0, gFade: 0 };
  };
  // level 0 first (it sets the framing), the others load right after it
  const layers = [upload(parse(await loadBin(urls[0])))];
  const rest = urls.slice(1).map((u, i) => loadBin(u).then(b => { layers[i + 1] = upload(parse(b)); layers[i + 1].lift = layers[i + 1].gLift = goals.lift?.[i + 1] ?? 40; if (active === i + 1) { framed = true; frameOn(active); } kick(); }).catch(() => {}));
  // framing: the camera centres on, and fits, the box of the level being shown
  let sx, sz, C, R;
  const frameOn = i => { const h = (layers[i] || layers[0]).head; sx = h.size[0]; sz = h.size[2]; C = [h.anchor[0] + sx / 2, h.anchor[1] + 1.2, h.anchor[2] + sz / 2]; R = Math.hypot(sx, sz) / 2; };
  frameOn(0);
  gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
  const FOV = 0.5, m = new Float32Array(16);
  let fX = 0, fZ = 0, fk = 1, gx = 0, gz = 0, gk = 1, fp = pitch, gp = pitch, fy = 0, gy = 0;   // focus: offset, zoom, tilt, turn (current → goal)
  let sel = new Float32Array(16), so = 0, gso = 0, active = 0, framed = true, goals = {}, last = '', W = 0, H = 0, drag = null, seen = false, raf = 0, turn = 0, dead = false, sc = 0, gsc = 0;   // sc: scroll position between levels (0 = level 0 centred, 1 = level 1 …)
  const size = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); gl.viewport(0, 0, canvas.width, canvas.height); };
  const ease = (v, g, k, eps) => (Math.abs(g - v) < eps ? g : v + (g - v) * k);
  const SHIFT = 2.2;                                                      // clip-space distance between two levels (2 = one frame height)
  // camera framing one level's box; the active level also gets the focus offset / zoom / tilt / turn
  function cam(h, foc) {
    const sx = h.size[0], sz = h.size[2], R = Math.hypot(sx, sz) / 2, C = [h.anchor[0] + sx / 2, h.anchor[1] + 1.2, h.anchor[2] + sz / 2];
    const P = foc ? fp : pitch, a = yaw + turn + (foc ? fy : 0), asp = W / H, t = Math.tan(FOV / 2), m = new Float32Array(16);
    // view basis (the camera looks at the model centre), then the distance at which every corner of the box fits
    const cp = Math.cos(P), fz = [Math.sin(a) * cp, Math.sin(P), Math.cos(a) * cp], rx = [Math.cos(a), 0, -Math.sin(a)];
    const uy = [fz[1] * rx[2] - fz[2] * rx[1], fz[2] * rx[0] - fz[0] * rx[2], fz[0] * rx[1] - fz[1] * rx[0]];
    let dist = 1;
    for (let c = 0; c < 8; c++) { const x = (c & 1 ? 1 : -1) * sx / 2, y = c & 2 ? 4.2 - 1.2 : -1.2, z = (c & 4 ? 1 : -1) * sz / 2, d = fz[0] * x + fz[1] * y + fz[2] * z;
      dist = Math.max(dist, d + Math.abs(rx[0] * x + rx[2] * z) / (t * asp * 0.94), d + Math.abs(uy[0] * x + uy[1] * y + uy[2] * z) / (t * 0.86)); }
    dist *= foc ? fk : 1; const e = fz.map(v => v * dist);
    const n = Math.max(dist * 0.3, 1), f = dist + R * 1.3, A = 1 / t, B = (f + n) / (n - f), D = 2 * f * n / (n - f);
    // m = projection × view, column-major
    for (let c = 0; c < 3; c++) { m[c * 4] = A / asp * rx[c]; m[c * 4 + 1] = A * uy[c]; m[c * 4 + 2] = B * fz[c]; m[c * 4 + 3] = -fz[c]; }
    m[12] = 0; m[13] = 0; m[14] = -B * dist + D; m[15] = dist;
    return { m, e, dist, o: [C[0] + (foc ? fX : 0), C[1], C[2] + (foc ? fZ : 0)] };
  }
  function frame() {
    raf = 0; if (dead || !seen) return;
    if (canvas.clientWidth !== W || canvas.clientHeight !== H) size();
    fX = ease(fX, gx, 0.09, 0.003); fZ = ease(fZ, gz, 0.09, 0.003); fk = ease(fk, gk, 0.09, 0.0004); fp = ease(fp, gp, 0.07, 0.0004); fy = ease(fy, gy, 0.07, 0.0004);
    // (a level jumps to / from 'parked far above' instead of easing through the sky)
    so = ease(so, gso, 0.1, 0.003); sc = ease(sc, gsc, 0.22, 0.0005);
    for (const L of layers) if (L) { L.lift = Math.abs(L.gLift - L.lift) > 60 ? L.gLift : ease(L.lift, L.gLift, 0.16, 0.004); L.fade = ease(L.fade, L.gFade, 0.12, 0.002); }
    const sig = [turn.toFixed(5), W, H, fX, fZ, fk, fp, fy, active, framed, so, sel[0], sel[1], sel[2], sel[3], sc.toFixed(4), ...layers.map(L => L ? L.lift.toFixed(3) + L.fade.toFixed(3) : '-')].join(' ');
    if (sig === last) { raf = requestAnimationFrame(frame); return; }     // nothing changed: no redraw (a still frame cannot shimmer)
    last = sig;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let spotCam = null;
    layers.forEach((L, i) => {
      if (!L || Math.abs(i - sc) >= 1) return;                            // only the level(s) in the frame
      const foc = i === active, c = cam(L.head, foc), shift = (sc - i) * SHIFT;   // below the frame while still to come, above it once passed
      if (L.lift > c.dist * 0.6) return;                                   // still far above the camera
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uM, false, c.m); gl.uniform3f(uE, c.e[0], c.e[1], c.e[2]); gl.uniform3f(uO, c.o[0], c.o[1], c.o[2]); gl.uniform1f(uY, shift);
      const an = L.head.anchor; gl.uniform3f(uA, an[0], an[1] + L.lift, an[2]); gl.uniform1f(uG, L.head.grid); gl.uniform1f(uF, L.fade);
      gl.uniform4fv(uR, sel); gl.uniform1f(uL, L === layers[0] || L.head.floor == null ? -1e3 : L.head.floor + L.lift); gl.uniform1f(uS, foc ? so : 0);
      gl.bindVertexArray(L.vao); gl.drawElements(gl.TRIANGLES, L.n, L.type, 0);
      if (foc) spotCam = { c, shift };
    });
    const AL = layers[active];
    if (onFrame) onFrame(AL && spotCam ? AL.head.spots.map(s => {
      const { m, o } = spotCam.c, x = s.p[0] - o[0], y = s.p[1] + AL.lift - o[1], z = s.p[2] - o[2], w = m[3] * x + m[7] * y + m[11] * z + m[15];
      return { id: s.id, x: ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w + 1) / 2 * W, y: (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w - spotCam.shift) / 2 * H, front: w };
    }) : []);
    raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && seen && !dead) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(es => { seen = es[0].isIntersecting; kick(); }, { rootMargin: '80px' }).observe(canvas);
  canvas.addEventListener('pointerdown', ev => { if (ev.pointerType === 'mouse' && ev.button) return; drag = { id: ev.pointerId, x: ev.clientX }; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointermove', ev => { if (!drag || ev.pointerId !== drag.id) return; turn -= (ev.clientX - drag.x) / Math.max(W, 1) * 3; drag.x = ev.clientX; kick(); });
  const up = ev => { if (drag && ev.pointerId === drag.id) drag = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('webglcontextlost', ev => { ev.preventDefault(); dead = true; });
  size();
  let fid = null;                                                       // the clicked (focused) place, so a hover can hand its colours back
  const boxes = r => { const f = new Float32Array(16); (Array.isArray(r[0]) ? r : [r]).slice(0, 4).forEach((b, i) => f.set(b, i * 4)); return f; };
  return {
    heads: () => layers.map(L => L?.head), ready: Promise.all(rest), stop() { dead = true; },
    set(o) {                                                              // { lift: [], fade: [], active, scroll }
      goals = { ...goals, ...o };
      if (o.scroll != null) { gsc = o.scroll; if (!seen || Math.abs(gsc - sc) > 1.5) sc = gsc; }   // far jumps (or off screen): no long glide
      layers.forEach((L, i) => { if (!L) return; if (o.lift?.[i] != null) L.gLift = o.lift[i]; if (o.fade?.[i] != null) L.gFade = o.fade[i]; });
      if (o.active != null && (o.active !== active || framed !== !!layers[o.active])) { active = o.active; framed = !!layers[active]; frameOn(active); }
      kick();
    },
    focus(id, zoom = 0.4) {                                               // zoom towards a point of the active level (null = whole plan)
      const s = layers[active]?.head.spots.find(q => q.id === id);
      fid = s?.r ? id : null;
      if (s) { gx = s.p[0] - C[0]; gz = s.p[2] - C[2]; gk = zoom; gp = 0.92; gy = 0.28; if (s.r) { sel = boxes(s.r); gso = 1; } } else { gx = gz = 0; gk = 1; gp = pitch; gy = 0; gso = 0; }   // closer, tilted ≈ 53° and turned a little
      kick();
    },
    tint(id) {                                                            // hover: colour only that place, camera stays (null = back to the clicked one, or none)
      const s = layers[active]?.head.spots.find(q => q.id === (id ?? fid));
      if (s?.r) { sel = boxes(s.r); gso = 1; } else gso = 0;
      kick();
    },
  };
}
