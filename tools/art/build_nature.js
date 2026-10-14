// Teren, drzewa, skały, krzaki, żyła złota i padlina. Uruchamiane przez build_assets.js.
const L = require('./lib');
const { rt, pt, TX, TILE, model, cam, saveStatic, clamp } = L;
const K = TILE / 96, sc = n => Math.round(n * K);
const BIG = { width: sc(560), height: sc(440), anchor: [sc(300), sc(340)], supersample: 3, tilePx: TILE };
const SMALL = { width: sc(260), height: sc(200), anchor: [sc(140), sc(150)], supersample: 3, tilePx: TILE };
const TS = 0.7;      // drzewa mniejsze niż model: oryginał ma korony ok. 1,5 kafla
const PERIOD = 6;   // okres tekstury gruntu w kaflach: 6x6 różnych kafli daje ciągłą powierzchnię bez szwów

function terrain(lap) {
  for (const [name, tex] of [['ochre', L.TX.ochre], ['olive', L.TX.olive], ['dirt', L.TX.dirt], ['grass', L.TX.grass], ['gravel', L.TX.gravel], ['water', L.TX.water]]) {
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
  put('prop_bush0', P => pt.bush(P, [0, 0], { size: 0.6, seed: 2 })); put('prop_bush1', P => pt.bush(P, [0, 0], { size: 0.45, seed: 6 }));
  const GREEN = [[0.27, 0.40, 0.12], [0.38, 0.52, 0.16], [0.50, 0.62, 0.22]];   // zielone kępki: żywa trawa wśród wypalonej
  put('prop_tuft0', P => pt.tuft(P, [0, 0], { blades: 16, height: 0.38, palette: GREEN, seed: 3 })); put('prop_tuft1', P => pt.tuft(P, [0, 0], { blades: 11, height: 0.30, palette: GREEN, seed: 9 }));
  put('prop_tuft2', P => pt.tuft(P, [0, 0], { blades: 12, height: 0.30, seed: 5 }));   // sucha kępa (stara)
  rocks(); reeds();
  lap('rekwizyty');
}
// skały: kanciaste, łamane bryły (mało podziałów siatki = wyraźne ściany), szarobrązowy piaskowiec z ciemną szczeliną u dołu; zamiast gładkich "bułek"
function rocks() {
  const spec = [
    ['prop_rock0', [[0, 0, 0.20, 0.34, 0.28, 0.22, 'a', 1], [0.26, 0.1, 0.12, 0.2, 0.17, 0.13, 'b', 2], [-0.22, -0.12, 0.1, 0.16, 0.14, 0.1, 'a', 3]]],
    ['prop_rock1', [[0, 0, 0.14, 0.22, 0.18, 0.14, 'a', 4], [0.18, -0.08, 0.08, 0.12, 0.1, 0.08, 'b', 5]]],
    ['prop_rock2', [[0, 0, 0.30, 0.3, 0.26, 0.3, 'a', 6], [-0.05, 0.05, 0.52, 0.2, 0.18, 0.18, 'b', 7], [0.3, 0.12, 0.1, 0.18, 0.15, 0.1, 'b', 8]]],
  ];
  for (const [key, parts] of spec) {
    const m = model(null); m.material('rockA', { color: [0.55, 0.50, 0.43] }); m.material('rockB', { color: [0.42, 0.37, 0.31] }); m.material('crack', { color: [0.22, 0.19, 0.15] });
    m.blob('crack', [0, 0, 0.05], [0.4, 0.34, 0.06], { seed: 9, roughness: 0.3, subdivisions: 1 });
    for (const [x, y, z, rx, ry, rz, mt, sd] of parts) m.blob(mt === 'a' ? 'rockA' : 'rockB', [x, y, z], [rx, ry, rz], { seed: sd, roughness: 0.62, subdivisions: 1 });
    saveStatic(key, rt.renderSprite(m, cam(1.2, [0, 0, 0.25], 0.8), { groundTexture: TX.ochre }), 'props');
  }
}
// trzciny i pałki wodne: pęk cienkich łodyg z lekkim odchyleniem, brunatne kolby na części łodyg
function reeds() {
  for (const [key, seed, n, h] of [['prop_reed0', 1, 16, 1.0], ['prop_reed1', 2, 11, 0.8], ['prop_reed2', 3, 20, 1.15]]) {
    const m = model(null); m.material('reedS', { color: [0.64, 0.58, 0.30] }); m.material('reedG', { color: [0.38, 0.48, 0.18] }); m.material('cat', { color: [0.32, 0.19, 0.10] });
    const r = rt.makeRng(seed);
    for (let i = 0; i < n; i++) {
      const a = r.uniform(0, 6.283), d = r.uniform(0, 0.24), x = Math.cos(a) * d, y = Math.sin(a) * d, ht = h * r.uniform(0.65, 1.0), lx = r.uniform(-0.12, 0.12), ly = r.uniform(-0.12, 0.12);
      m.cylinder(i % 3 ? 'reedG' : 'reedS', [x, y, 0], [x + lx, y + ly, ht], 0.022, 0.008, 5);
      if (i % 4 === 0) m.cylinder('cat', [x + lx * 0.9, y + ly * 0.9, ht * 0.72], [x + lx, y + ly, ht * 0.94], 0.04, 0.035, 6);
    }
    saveStatic(key, rt.renderSprite(m, cam(1.2, [0, 0, 0.5], 0.7), { groundTexture: TX.dirt }), 'props');
  }
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
