// Offline "render farm" mode for the baked photos: the same scene, but path traced (three-gpu-pathtracer) instead of
// rasterised – real sky light through the windows, bounce light, soft shadows, true glass and mirror reflections.
// Loaded on demand (dynamic import from runtime.js), never on the live site. Used by tools/bake_pt.mjs:
//   const pt = await apt.pathtracer({ ... });  await pt.render(x, y, z, yawDeg, pitchDeg, samples);
import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export async function makePathTracer(ctx, opts = {}) {
  const { renderer, scene, camera, sky, hideList = [], downlights, ceilingY, rectDefs = [], spotSlots = [], rectSlots = [], fakeLights = [] } = ctx;
  const o = { exposure: 0.9, envIntensity: 1, sun: 1, spot: 1, bounces: 8, tone: 'agx', ...opts };

  // ---- sky → HDR environment (no sun disc: the directional light IS the sun, sampled sharply) ----
  sky.material.uniforms.showSunDisc.value = 0;
  const envScene = new THREE.Scene(), parent = sky.parent; envScene.add(sky);
  const crt = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType });
  const cc = new THREE.CubeCamera(1, 6000, crt); envScene.add(cc);
  const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping; cc.update(renderer, envScene); renderer.toneMapping = tm;
  parent.add(sky); sky.visible = false;
  const env = cubeToEquirect(renderer, crt.texture, 2048);
  scene.background = env; scene.environment = env; scene.environmentIntensity = o.envIntensity; scene.backgroundIntensity = 1;

  // ---- lights: real ones only ----
  for (const l of fakeLights) l.visible = false;                         // window "bounce" area lights + hemisphere fill: the tracer does that for real
  for (const s of [...spotSlots, ...rectSlots]) s.visible = false;      // the 6 nearest-fixture slots → every fixture gets its own light
  const added = [], lp = ctx.world ?? scene;   // fixture positions are in world-local metres
  for (const d of downlights) {
    const s = new THREE.SpotLight('#ffd9b0', d.intensity * o.spot, 0, 1.0, 0.9, 2);
    s.position.set(d.x, ceilingY - 0.03, d.z); s.target.position.set(d.x, 0, d.z); lp.add(s, s.target); added.push(s, s.target);
  }
  for (const d of rectDefs) {
    const l = new THREE.RectAreaLight(d.color, d.intensity ?? d.i ?? 1, d.w, d.h); l.position.copy(d.pos); l.quaternion.copy(d.q); lp.add(l); added.push(l);
  }
  scene.traverse(x => { if (x.isDirectionalLight) x.intensity *= o.sun; });
  for (const h of hideList) if (h) h.visible = false;

  // ---- a flat copy for the tracer: one plain mesh per material, world transforms baked, instances expanded,
  //      hidden things dropped (its own generator mixed up materials on the merged / instanced / grouped meshes) ----
  const glassFor = new Map(), glassOf = mt => {
    if (!glassFor.has(mt)) glassFor.set(mt, new THREE.MeshPhysicalMaterial({
      color: mt.color.clone().lerp(new THREE.Color('#ffffff'), 0.7), roughness: 0.01, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.01, side: THREE.DoubleSide }));
    return glassFor.get(mt);
  };
  const isGlass = mt => mt.transparent && !(mt.alphaTest > 0) && !mt.alphaMap && mt.opacity <= 0.6 && !mt.map;
  const shown = x => { for (let n = x; n; n = n.parent) if (!n.visible) return false; return true; };
  const buckets = new Map(), M4 = new THREE.Matrix4(), C = new THREE.Color();
  let inLvl = false;                             // the mesh being flattened belongs to the level itself (not the city / tower around it)
  const put = (mt, g, color) => {
    if (!g) return;
    let mat = mt;
    if (isGlass(mt)) { if (o.noGlass) return; mat = glassOf(mt); }
    else if (mt.transparent && mt.opacity < 0.02) return;
    let key = mat.uuid + (inLvl ? ':L' : ':O');
    if (color) { key += ':vc'; if (!buckets.has(key)) { const c = mat.clone(); c.vertexColors = true; buckets.set(key, { mat: c, list: [], lvl: inLvl }); } }
    else if (!buckets.has(key)) buckets.set(key, { mat, list: [], lvl: inLvl });
    buckets.get(key).list.push(g);
  };
  const clean = (geo, matrix, color) => {        // → non-indexed position / normal / uv (+ color) in world space
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    const out = new THREE.BufferGeometry(); out.setAttribute('position', g.attributes.position.clone());
    if (g.attributes.normal) out.setAttribute('normal', g.attributes.normal.clone()); else out.computeVertexNormals();
    const n = out.attributes.position.count;
    out.setAttribute('uv', g.attributes.uv ? g.attributes.uv.clone() : new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (color) {
      const a = new Float32Array(n * 3), vc = g.attributes.color;
      for (let i = 0; i < n; i++) { a[i * 3] = color.r * (vc ? vc.getX(i) : 1); a[i * 3 + 1] = color.g * (vc ? vc.getY(i) : 1); a[i * 3 + 2] = color.b * (vc ? vc.getZ(i) : 1); }
      out.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    out.applyMatrix4(matrix);
    if (o.cull) {                                   // drop triangles farther than R (horizontal) from the bake point: the far city barely shows, but costs
      const [cx, cz, R] = o.cull, P = out.attributes.position, keep = [];
      for (let t = 0; t < P.count; t += 3) {
        let near = false;
        for (let k = 0; k < 3 && !near; k++) near = Math.hypot(P.getX(t + k) - cx, P.getZ(t + k) - cz) < R;
        if (near) keep.push(t);
      }
      if (keep.length * 3 < P.count) {
        if (!keep.length) return null;
        const r = new THREE.BufferGeometry();
        for (const [k, at] of Object.entries(out.attributes)) { const n = at.itemSize, d = new Float32Array(keep.length * 3 * n);
          keep.forEach((t, j) => d.set(at.array.subarray(t * n, (t + 3) * n), j * 3 * n)); r.setAttribute(k, new THREE.BufferAttribute(d, n)); }
        return r;
      }
    }
    return out;
  };
  const sub = (geo, grp) => {                    // one material group of an indexed / non-indexed geometry
    const g = geo.clone();
    if (g.index) g.setIndex(Array.from(g.index.array.slice(grp.start, grp.start + grp.count)));
    else { const r = new THREE.BufferGeometry(); for (const [k, a] of Object.entries(g.attributes)) r.setAttribute(k, new THREE.BufferAttribute(a.array.slice(grp.start * a.itemSize, (grp.start + grp.count) * a.itemSize), a.itemSize, a.normalized)); return r; }
    return g;
  };
  scene.updateMatrixWorld(true);
  let tris = 0;
  scene.traverse(m => {
    if (!m.isMesh || m.isSprite || !shown(m) || !m.geometry?.attributes?.position) return;
    inLvl = false; for (let n = m; n; n = n.parent) if (n === ctx.levelG) { inLvl = true; break; }
    const parts = Array.isArray(m.material) ? m.geometry.groups.map(gr => [m.material[gr.materialIndex], sub(m.geometry, gr)]) : [[m.material, m.geometry]];
    for (const [mt, geo] of parts) {
      if (!mt || !mt.visible || mt.isShaderMaterial || mt.isSpriteMaterial) continue;
      const hasVC = mt.vertexColors && geo.attributes.color;
      if (m.isInstancedMesh) {
        for (let i = 0; i < m.count; i++) {
          m.getMatrixAt(i, M4); M4.premultiply(m.matrixWorld);
          const col = m.instanceColor ? (m.getColorAt(i, C), C.clone()) : hasVC ? new THREE.Color(1, 1, 1) : null;
          put(mt, clean(geo, M4, col), col);
        }
      } else put(mt, clean(geo, m.matrixWorld, hasVC ? new THREE.Color(1, 1, 1) : null), hasVC);
    }
  });
  const ptScene = new THREE.Scene();
  for (const { mat, list, lvl } of buckets.values()) {
    const vc = !!mat.vertexColors;
    const g = mergeGeometries(list.map(x => { if (!vc) x.deleteAttribute('color'); return x; }), false);
    if (!g) continue; tris += g.attributes.position.count / 3;
    const mesh = new THREE.Mesh(g, mat); mesh.userData.lvl = lvl; ptScene.add(mesh);
  }
  scene.traverse(l => {                          // lights, in world space
    if (!l.isLight || l.isHemisphereLight || l.isAmbientLight || !shown(l) || !(l.intensity > 0)) return;
    const c = l.clone(); l.matrixWorld.decompose(c.position, c.quaternion, c.scale);
    if (l.target) { c.target = new THREE.Object3D(); c.target.position.setFromMatrixPosition(l.target.matrixWorld); ptScene.add(c.target); }
    ptScene.add(c);
  });
  ptScene.background = env; ptScene.environment = env; ptScene.environmentIntensity = o.envIntensity; ptScene.backgroundIntensity = 1;
  ptScene.updateMatrixWorld(true);
  console.log('pathtracer: meshes', ptScene.children.filter(x => x.isMesh).length, 'lights', ptScene.children.filter(x => x.isLight).length, 'tris', Math.round(tris));

  // ---- tracer ----
  renderer.toneMapping = o.tone === 'agx' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure;
  globalThis.__ptRenderer = renderer;
  const pt = new WebGLPathTracer(renderer);
  Object.assign(pt, { renderDelay: 0, minSamples: 1, fadeDuration: 0, rasterizeScene: false, dynamicLowRes: false, synchronizeRenderSize: true, renderScale: 1 });
  pt.bounces = o.bounces; pt.transmissiveBounces = 10; pt.filterGlossyFactor = 1; pt.multipleImportanceSampling = true;
  pt.tiles.set(2, 2);
  const t0 = performance.now();
  pt.setScene(ptScene, camera);
  const buildMs = performance.now() - t0;

  return {
    buildMs, pt,
    async render(x, y, z, yaw, pitch, samples = 256) {
      camera.position.set(x, y, z); camera.rotation.set(pitch * Math.PI / 180, yaw * Math.PI / 180, 0, 'YXZ'); camera.updateMatrixWorld();
      pt.updateCamera();
      while (pt.isCompiling) await new Promise(r => setTimeout(r, 50));
      const t = performance.now();
      const px = new Float32Array(4);
      while (pt.samples < samples) {
        pt.renderSample();
        if (Number.isInteger(pt.samples)) { renderer.readRenderTargetPixels(pt.target, 0, 0, 1, 1, px); await new Promise(r => setTimeout(r, 0)); }   // GPU sync: keeps the queue short (else the screenshot times out)
      }
      return { samples: pt.samples, ms: performance.now() - t };
    },
    // linear HDR RGB of the accumulated image (bottom-up rows, like PFM), base64 float32
    beauty() { return readRGB(pt.target); },
    // denoiser guides: albedo (flat material colour / texture, glass hidden) and normals, rasterised from the same flat scene
    aovs() {
      const w = pt.target.width, h = pt.target.height, rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType }), keep = new Map();
      ptScene.traverse(m => { if (m.isMesh) keep.set(m, m.material); });
      const out = {}, tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
      const bg = ptScene.background; 
      for (const kind of ['alb', 'nrm']) {
        for (const [m, mt] of keep) {
          m.visible = !(mt.transmission > 0);
          m.material = kind === 'alb' ? (mt.__alb ??= new THREE.MeshBasicMaterial({ color: mt.color, map: mt.map, vertexColors: mt.vertexColors, side: mt.side, alphaTest: mt.alphaTest, transparent: false }))
                                      : (mt.__nrm ??= new THREE.MeshNormalMaterial({ side: mt.side }));
        }
        ptScene.background = kind === 'alb' ? bg : new THREE.Color(0.5, 0.5, 1);
        renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ptScene, camera); renderer.setRenderTarget(null);
        out[kind] = readRGB(rt);
      }
      {
        const mk = (lvl, mir) => new THREE.ShaderMaterial({ side: THREE.DoubleSide,
          vertexShader: 'varying float vD; void main(){ vec4 p = modelViewMatrix * vec4(position, 1.0); vD = length(p.xyz); gl_Position = projectionMatrix * p; }',
          fragmentShader: `varying float vD; void main(){ gl_FragColor = vec4(${lvl ? '0.0' : '1.0'}, vD, ${mir ? '0.5' : '0.0'}, 1.0); }` });
        const V = [mk(false, false), mk(true, false), mk(false, true), mk(true, true)], mirror = mt => mt.metalness > 0.5 && mt.roughness < 0.25;   // B = 0.5: mirror-like (the denoiser's guides can't see its reflection)
        for (const [m, mt] of keep) { m.visible = !(mt.transmission > 0); m.material = V[(m.userData.lvl ? 1 : 0) + (mirror(mt) ? 2 : 0)]; }
        ptScene.background = null; const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
        renderer.setClearColor(new THREE.Color(1, 1e4, 1), 1);
        renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ptScene, camera); renderer.setRenderTarget(null);
        renderer.setClearColor(cc, ca); out.msk = readRGB(rt); V.forEach(v => v.dispose());
      }
      for (const [m, mt] of keep) { m.material = mt; m.visible = true; }
      ptScene.background = bg; renderer.toneMapping = tm; rt.dispose();
      return out;
    },
    // draw a (denoised) linear float RGB buffer to the canvas through the renderer's tone mapping + sRGB output
    show(b64, w, h) {
      const f = new Float32Array(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer), d = new Float32Array(w * h * 4);
      for (let i = 0; i < w * h; i++) { d[i * 4] = f[i * 3]; d[i * 4 + 1] = f[i * 3 + 1]; d[i * 4 + 2] = f[i * 3 + 2]; d[i * 4 + 3] = 1; }
      const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat, THREE.FloatType); t.needsUpdate = true;
      const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: t, depthTest: false })), sc = new THREE.Scene(); sc.add(q);
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer.setRenderTarget(null); renderer.render(sc, cam); t.dispose(); q.material.dispose();
      return new Promise(r => requestAnimationFrame(() => r()));
    },
    setExposure(e) { renderer.toneMappingExposure = e; },
  };
}

// cube render target → CPU equirect float texture (the tracer builds its light-importance CDF from the pixels; its own
// CubeToEquirectGenerator uses a shader chunk three r187 no longer has)
function cubeToEquirect(renderer, cube, W) {
  const H = W / 2, rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
  const mat = new THREE.ShaderMaterial({
    uniforms: { env: { value: cube } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform samplerCube env; varying vec2 vUv;
      void main(){ float phi = (vUv.x - 0.5) * 6.28318530718, lat = (vUv.y - 0.5) * 3.14159265359;
        vec3 d = vec3(cos(lat) * cos(phi), sin(lat), cos(lat) * sin(phi));
        gl_FragColor = vec4(textureCube(env, d).rgb, 1.0); }`,
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), sc = new THREE.Scene(); sc.add(q);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), tm = renderer.toneMapping, prev = renderer.getRenderTarget();
  renderer.toneMapping = THREE.NoToneMapping; renderer.setRenderTarget(rt); renderer.render(sc, cam); renderer.setRenderTarget(prev); renderer.toneMapping = tm;
  const data = new Float32Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, data); rt.dispose(); mat.dispose();
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.LinearSRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

function readRGB(rt) {
  const r = rt.texture.image ? null : null, w = rt.width, h = rt.height, rgba = new Float32Array(w * h * 4);
  const R = globalThis.__ptRenderer; R.readRenderTargetPixels(rt, 0, 0, w, h, rgba);
  const rgb = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { rgb[i * 3] = rgba[i * 4]; rgb[i * 3 + 1] = rgba[i * 4 + 1]; rgb[i * 3 + 2] = rgba[i * 4 + 2]; }
  const u = new Uint8Array(rgb.buffer); let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
