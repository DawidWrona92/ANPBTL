// Generator zasobów graficznych gry (G2). Uruchomienie: node tools/art/build_assets.js [--only nature,buildings,units]
// Wymaga skilli rts-prerender-3d i painted-rts-sprites (SKILLS_DIR). Wynik: assets/ (PNG) + assets/manifest.js.
const L = require('./lib');
const only = (process.argv.indexOf('--only') > -1 ? process.argv[process.argv.indexOf('--only') + 1] : 'nature,buildings,units').split(',');
const lap = L.timer();
if (only.includes('nature')) { const N = require('./build_nature'); N.terrain(lap); N.trees(lap); N.props(lap); N.resources(lap); N.cliffs(lap); }
if (only.includes('buildings')) require('./build_buildings').all(lap);
if (only.includes('units')) require('./build_units').all(lap);
const all = L.writeManifest();
console.log('manifest:', Object.keys(all).length, 'wpisów');
