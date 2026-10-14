// Teren, drzewa, skały, krzaki, żyła złota i padlina. Uruchamiane przez build_assets.js.
const L = require('./lib');
const { rt, pt, TX, TILE, model, cam, saveStatic, clamp } = L;
const K = TILE / 96, sc = n => Math.round(n * K);
const BIG = { width: sc(560), height: sc(440), anchor: [sc(300), sc(340)], supersample: 3, tilePx: TILE };
const SMALL = { width: sc(260), height: sc(200), anchor: [sc(140), sc(150)], supersample: 3, tilePx: TILE };
const TS = 0.7;      // drzewa mniejsze niż model: oryginał ma korony ok. 1,5 kafla
const PERIOD = 6;   // okres tekstury gruntu w kaflach: 6x6 różnych kafli daje ciągłą powierzchnię bez szwów

function terrain(lap) {
  for (const [name, tex] of [['ochre', L.TX.ochre], ['olive', L.TX.olive], ['dirt', L.TX.dirt], ['grass', L.TX.grass], ['sand', L.TX.sand], ['meadow', L.TX.meadow], ['gravel', L.TX.gravel], ['water', L.TX.water]]) {
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
// skały: pęki obróconych płyt i brył (wyraźne płaskie ściany i ostre krawędzie), ciepły piaskowiec z ciemniejszymi blokami i szczeliną u dołu; gładkie elipsoidy wyglądały jak bułki
const mul = (A, B) => A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
function rockModel(spec, seed) {
  const m = model(null); m.material('rockA', { color: [0.58, 0.41, 0.23] }); m.material('rockB', { color: [0.40, 0.28, 0.15] }); m.material('rockC', { color: [0.68, 0.52, 0.31] }); m.material('crack', { color: [0.24, 0.18, 0.12] });
  m.box('crack', [0, 0, 0.03], [0.62, 0.5, 0.06], { rotation: rt.rotZ(0.4) });
  const r = rt.makeRng(seed);
  for (const [x, y, z, sx, sy, sz, mt] of spec) {
    const rot = mul(rt.rotZ(r.uniform(0, 3.14)), mul(rt.rotY(r.uniform(-0.35, 0.35)), rt.rotX(r.uniform(-0.35, 0.35))));
    m.box(mt === 'a' ? 'rockA' : mt === 'b' ? 'rockB' : 'rockC', [x, y, z], [sx, sy, sz], { rotation: rot });
  }
  return m;
}
function rocks() {
  const spec = {
    prop_rock0: [[0, 0, 0.2, 0.46, 0.38, 0.4, 'a'], [0.3, 0.12, 0.12, 0.28, 0.24, 0.24, 'b'], [-0.2, -0.16, 0.34, 0.26, 0.22, 0.26, 'c']],
    prop_rock1: [[0, 0, 0.13, 0.3, 0.26, 0.26, 'a'], [0.2, -0.1, 0.08, 0.16, 0.14, 0.14, 'b']],
    prop_rock2: [[0, 0, 0.26, 0.5, 0.42, 0.5, 'b'], [-0.08, 0.06, 0.58, 0.32, 0.28, 0.3, 'a'], [0.34, 0.14, 0.1, 0.24, 0.2, 0.2, 'c'], [-0.3, -0.2, 0.12, 0.2, 0.2, 0.2, 'a']],
  };
  let n = 1;
  for (const key in spec) saveStatic(key, rt.renderSprite(rockModel(spec[key], n++), cam(1.2, [0, 0, 0.25], 0.8), { groundTexture: TX.ochre }), 'props');
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
// klify (faza 10): blok 1x1 kafla z warstwową ścianą, jasnym wierzchem i luźnymi odłamkami; cztery wysokości na motyw terenu. Sąsiednie bloki tworzą mur.
function cliffs(lap) {
  for (const [biome, texKey] of [['arid', 'cliffArid'], ['prairie', 'cliffPrairie'], ['grass', 'cliffGrass']]) {
    [0.95, 1.1, 1.25, 1.4].forEach((h, v) => {
      const m = model(null), r = rt.makeRng(500 + v * 7 + biome.length);
      m.material('cliff', { texture: TX[texKey], worldSize: 1.4 }); m.material('cliffTop', { texture: TX[texKey], worldSize: 0.9 });
      m.box('cliff', [0, 0, h / 2], [1.02, 1.02, h]);
      m.box('cliffTop', [0, 0, h + 0.03], [0.98, 0.98, 0.07]);
      for (let i = 0; i < v; i++) m.blob("cliffTop", [r.uniform(-0.3, 0.3), r.uniform(-0.3, 0.3), h + 0.08], [r.uniform(0.12, 0.22), r.uniform(0.12, 0.22), r.uniform(0.07, 0.14)], { seed: 40 + i + v, roughness: 0.5, subdivisions: 1 });
      saveStatic('cliff_' + biome + '_' + v, rt.renderSprite(m, cam(2.2, [0, 0, 0.7], 1), { groundTexture: TX.ochre }), 'props');
    });
  }
  lap('klify');
}
function resources(lap) {
  for (const [key, seed] of [['gold_vein0', 3], ['gold_vein1', 11]]) {
    const m = model(); m.material('rock', { color: [0.50, 0.36, 0.20] }); m.material('rockD', { color: [0.33, 0.23, 0.13] });
    const rng = rt.makeRng(seed);
    for (let i = 0; i < 6; i++) {
      const rot = mul(rt.rotZ(rng.uniform(0, 3.14)), mul(rt.rotY(rng.uniform(-0.35, 0.35)), rt.rotX(rng.uniform(-0.35, 0.35))));
      m.box(i % 2 ? 'rock' : 'rockD', [rng.uniform(-0.32, 0.32), rng.uniform(-0.27, 0.27), 0.16 + 0.06 * (i % 3)], [rng.uniform(0.28, 0.5), rng.uniform(0.26, 0.44), rng.uniform(0.26, 0.46)], { rotation: rot });
    }
    for (let i = 0; i < 7; i++) m.blob('gold', [rng.uniform(-0.38, 0.38), rng.uniform(-0.32, 0.32), rng.uniform(0.12, 0.42)], [0.09, 0.08, 0.08], { seed: seed + 20 + i, roughness: 0.5, subdivisions: 1 });
    saveStatic(key, rt.renderSprite(m, cam(1.4, [0, 0, 0.3]), { groundTexture: TX.dirt }), 'props');
  }
  { const m = model(); m.material('meat', { color: [0.46, 0.16, 0.11] }); m.material('bone', { color: [0.85, 0.80, 0.68] });
    m.blob('meat', [0, 0, 0.16], [0.42, 0.28, 0.14], { seed: 5, roughness: 0.2, subdivisions: 2 }); m.blob('meat', [-0.12, 0.05, 0.28], [0.26, 0.18, 0.1], { seed: 8, roughness: 0.2, subdivisions: 1 });
    m.cylinder('bone', [-0.4, -0.2, 0.12], [0.35, 0.22, 0.3], 0.035, 0.035, 8); m.cylinder('bone', [-0.1, 0.3, 0.1], [0.3, -0.25, 0.22], 0.03, 0.03, 8);
    saveStatic('carcass', rt.renderSprite(m, cam(1.4, [0, 0, 0.2]), { groundTexture: TX.ochre }), 'props'); }
  lap('złoto i padlina');
}
module.exports = { terrain, trees, props, resources, cliffs };
