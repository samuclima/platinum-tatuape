// Entry point of tour.html?apt=27 – loads one apartment into the shared engine.
//
// Order matters: the plan scale must be set BEFORE the engine module is imported (it builds its
// textures at load time), the apartment is built next, and the runtime (lights, city, player,
// render loop) starts last – the same order the original single-file pages ran in.
import { APARTMENTS } from './apartments/index.js';
import { setPlan } from './engine/plan.js';

const id = new URLSearchParams(location.search).get('apt');
const entry = APARTMENTS[id];
if (!entry) {
  location.replace('./');
} else {
  const { meta } = await entry.meta();
  document.title = meta.title;
  document.querySelector('#overlay h1').innerHTML = meta.heading;
  document.querySelector('#overlay .lead').textContent = meta.lead;
  setPlan(meta.plan);

  // neighbourhood data: the gzip copy (≈ 1/3 of the size) unpacked in the browser, whatever the server does with
  // .gz files (if it already decoded it, the bytes are plain JSON); the plain file is the fallback
  async function loadCity() {
    const get = async name => { const r = await fetch(new URL('data/' + name, document.baseURI)); if (!r.ok) throw new Error(`Neighbourhood data not found (${r.status} ${r.url})`); return r; };
    if ('DecompressionStream' in window) try {
      const buf = new Uint8Array(await (await get('city.json.gz')).arrayBuffer());
      const raw = buf[0] === 0x1f && buf[1] === 0x8b ? await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : new TextDecoder().decode(buf);
      return JSON.parse(raw);
    } catch (e) { console.warn('city.json.gz:', e.message); }
    return (await get('city.json')).json();
  }
  // ?embed=orbit / ?embed=home (home-page 360): only the aerial view is ever shown → the level's own interior
  // (furniture, rooms, plants – most of the scene and of the download) is neither loaded nor built
  const embed = ['orbit', 'home'].includes(new URLSearchParams(location.search).get('embed'));
  const [cityData, level] = await Promise.all([
    loadCity(),
    embed ? null : entry.build(),
    import('./engine/core.js'),
  ]);
  window.CITY = cityData;
  if (embed) { meta.downlights = []; meta.windows = []; } else level.build();
  const { start } = await import('./engine/runtime.js');
  start(meta);
}
