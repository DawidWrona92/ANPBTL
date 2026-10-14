// Teren, drzewa, skały, krzaki, żyła złota i padlina. Uruchamiane przez build_assets.js.
const L = require('./lib');
const { rt, pt, TX, TILE, model, cam, saveStatic, clamp } = L;
const K = TILE / 96, sc = n => Math.round(n * K);
const BIG = { width: sc(560), height: sc(440), anchor: [sc(300), sc(340)], supersample: 3, tilePx: TILE };
const SMALL = { width: sc(260), height: sc(200), anchor: [sc(140), sc(150)], supersample: 3, tilePx: TILE };
const TS = 0.7;      // drzewa mniejsze niż model: oryginał ma korony ok. 1,5 kafla
const PERIOD = 6;   // okres tekstury gruntu w kaflach: 6x6 różnych kafli daje ciągłą powierzchnię bez szwów

function terrain(lap) {
  for (const [name, tex] of [['ochre', L.TX.ochre], ['olive', L.TX.olive], ['dirt', L.TX.dirt]]) {
    const gain = rt.groundGain(new rt.Camera({ tilePx: TILE, halfExtent: 3.6 }), { groundTexture: tex });
    const atlas = rt.makeImage(PERIOD * TILE, PERIOD * TILE / 2, 4), W = atlas.width;
    for (let j = 0; j < PERIOD; j++) for (let i = 0; i < PERIOD; i++) {
      const img = pt.groundTile(tex, i, j, { tilePx: TILE, tileWorld: PERIOD });
      for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
        const s = (y * img.width + x) * 4, d = ((j * TILE / 2 + y) * W + i * TILE + x) * 4;
        for (let c = 0; c < 3; c++) atlas.data[d + c] = Math.round(clamp(img.data[s + c] / 255 * gain[c]) * 255);
        atlas.data[d + 3] = img.data[s + 3];
      }
    }
    L.entries['ground_' + name] = { file: L.writePng('terrain/ground_' + name + '.png', atlas), tw: TILE, th: TILE / 2, cols: PERIOD, rows: PERIOD, period: PERIOD };
    lap('teren ' + name);
  }
}
function trees(lap) {
  const R = { groundTexture: TX.ochre };
  for (const [key, seed] of [['tree_oak0', 1], ['tree_oak1', 7]]) { const m = model(); rt.treeOak(m, 0, 0, { height: 2.6, crown: 1.05, seed }); saveStatic(key, rt.renderSprite(m, cam(3.4, [0, 0, 1.5], TS), R), 'trees'); }
  { const m = model(); rt.treePine(m, 0, 0, { height: 3.4, baseRadius: 0.85 }); saveStatic('tree_pine', rt.renderSprite(m, cam(3.4, [0, 0, 1.5], TS), R), 'trees'); }
  { const P = pt.sprite(Object.assign({}, BIG, { tilePx: TILE * TS })); pt.deadTree(P, [0, 0], { height: 2.4, seed: 2 }); saveStatic('tree_dead', P.render(), 'trees'); }
  lap('drzewa');
}
function props(lap) {
  const put = (key, fn) => { const P = pt.sprite(SMALL); fn(P); saveStatic(key, P.render(), 'props'); };
  put('prop_rock0', P => pt.rock(P, [0, 0], { size: 0.45, palette: 'sand', seed: 1 })); put('prop_rock1', P => pt.rock(P, [0, 0], { size: 0.3, palette: 'sand', seed: 4 }));
  put('prop_bush0', P => pt.bush(P, [0, 0], { size: 0.6, seed: 2 })); put('prop_bush1', P => pt.bush(P, [0, 0], { size: 0.45, seed: 6 }));
  put('prop_tuft0', P => pt.tuft(P, [0, 0], { blades: 14, height: 0.35, seed: 3 })); put('prop_tuft1', P => pt.tuft(P, [0, 0], { blades: 10, height: 0.28, seed: 9 }));
  lap('rekwizyty');
}
function resources(lap) {
  for (const [key, seed] of [['gold_vein0', 3], ['gold_vein1', 11]]) {
    const m = model(); m.material('rock', { color: [0.34, 0.28, 0.22] });
    const rng = rt.makeRng(seed);
    for (let i = 0; i < 4; i++) m.blob('rock', [rng.uniform(-0.3, 0.3), rng.uniform(-0.25, 0.25), 0.18], [rng.uniform(0.28, 0.4), rng.uniform(0.25, 0.35), rng.uniform(0.2, 0.32)], { seed: seed + i, roughness: 0.3, subdivisions: 2 });
    for (let i = 0; i < 7; i++) m.blob('gold', [rng.uniform(-0.38, 0.38), rng.uniform(-0.32, 0.32), rng.uniform(0.12, 0.42)], [0.09, 0.08, 0.08], { seed: seed + 20 + i, roughness: 0.25, subdivisions: 1 });
    saveStatic(key, rt.renderSprite(m, cam(1.4, [0, 0, 0.3]), { groundTexture: TX.dirt }), 'props');
  }
  { const m = model(); m.material('meat', { color: [0.46, 0.16, 0.11] }); m.material('bone', { color: [0.85, 0.80, 0.68] });
    m.blob('meat', [0, 0, 0.16], [0.42, 0.28, 0.14], { seed: 5, roughness: 0.2, subdivisions: 2 }); m.blob('meat', [-0.12, 0.05, 0.28], [0.26, 0.18, 0.1], { seed: 8, roughness: 0.2, subdivisions: 1 });
    m.cylinder('bone', [-0.4, -0.2, 0.12], [0.35, 0.22, 0.3], 0.035, 0.035, 8); m.cylinder('bone', [-0.1, 0.3, 0.1], [0.3, -0.25, 0.22], 0.03, 0.03, 8);
    saveStatic('carcass', rt.renderSprite(m, cam(1.4, [0, 0, 0.2]), { groundTexture: TX.ochre }), 'props'); }
  lap('złoto i padlina');
}
module.exports = { terrain, trees, props, resources };
