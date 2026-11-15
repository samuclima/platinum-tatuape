// The apartments on the site. Each entry is loaded only when that apartment is opened.
// Only the models present on disk are listed: the apartment and 1º/2º floor models are kept out of git (.gitignore),
// so the published build (GitHub Pages) has just the térreo, which the home page hero uses. Locally all of them
// build, for the bake tools.
const meta = import.meta.glob('./*.meta.js');
const build = import.meta.glob(['./*.js', '!./*.meta.js', '!./*Kit.js', '!./index.js']);
const FILES = {
  '27': 'a27', '33': 'a33', '61': 'a61', '79': 'a79', '93': 'a93',
  '93s': 'a93s',   // 93 m² without Dorm. 02
  terreo: 'terreo', pav1: 'pav1', pav2: 'pav2',
};
export const APARTMENTS = Object.fromEntries(Object.entries(FILES)
  .filter(([, f]) => meta[`./${f}.meta.js`] && build[`./${f}.js`])
  .map(([id, f]) => [id, { meta: meta[`./${f}.meta.js`], build: build[`./${f}.js`] }]));
