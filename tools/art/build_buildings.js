// Budynki: 7 typów × nacje us (świeże brązowe deski, biała baza, zniszczony magazyn), ban (szare zniszczone, Desperado), sx (Sioux: tepee i szałasy).
// Zasady stylu z docs/zrodla.md (pamięć gracza): budynki bez koloru właściciela, frakcje różnią się architekturą.
const L = require('./lib');
const { rt, TX, model, cam, saveStatic } = L;
const G = { groundTexture: TX.ochre };
const rad = d => d * Math.PI / 180;

// okna na ścianach +x i -y (tylko te widać); n okien na ścianę
function windows(m, hx, hy, z, nx, ny, size = 0.46) {
  for (let i = 0; i < nx; i++) { const wy = (i - (nx - 1) / 2) * (2 * hy / (nx + 0.6)); m.box('timber', [hx + 0.02, wy, z], [0.05, size, size + 0.1]); m.box('glass', [hx + 0.045, wy, z], [0.03, size - 0.12, size - 0.02]); for (const s of [-1, 1]) m.box('team_dark', [hx + 0.06, wy + s * (size / 2 + 0.04), z], [0.04, 0.14, size + 0.1]); }
  for (let i = 0; i < ny; i++) { const wx = (i - (ny - 1) / 2) * (2 * hx / (ny + 0.6)) - 0.2; m.box('timber', [wx, -hy - 0.02, z], [size, 0.05, size + 0.1]); m.box('glass', [wx, -hy - 0.045, z], [size - 0.12, 0.03, size - 0.02]); for (const s of [-1, 1]) m.box('team_dark', [wx + s * (size / 2 + 0.04), -hy - 0.06, z], [0.14, 0.04, size + 0.1]); }
}
// dom z desek: o = { w, d, floors, rise, porch, chimney, ruin, sign, cupola, flag }
function plank(style, o) {
  const m = model(style), w = o.w, d = o.d, hx = w / 2, hy = d / 2, h1 = o.h1 || 1.2, h2 = 1.05, floors = o.floors || 1;
  m.box('stone', [0, 0, 0.12], [w + 0.1, d + 0.1, 0.24]);
  m.box('planks', [0, 0, 0.24 + h1 / 2], [w, d, h1]);
  for (let i = 0; i < 3; i++) m.box('timber', [hx + 0.02, (i - 1) * (d / 3), 0.24 + h1 / 2], [0.04, 0.05, h1]);
  let zTop = 0.24 + h1, hx2 = hx, hy2 = hy;
  if (floors === 2) {
    m.box('team', [0, 0, zTop], [w + 0.08, d + 0.08, 0.07]);
    hx2 = (w - 0.34) / 2; hy2 = (d - 0.34) / 2;
    m.box('planks', [0, 0, zTop + h2 / 2], [w - 0.34, d - 0.34, h2]);
    windows(m, hx2, hy2, zTop + h2 / 2, Math.max(1, Math.round(o.w / 1.8)), 1, 0.42);
    zTop += h2;
  }
  m.box('timber', [hx + 0.03, 0, 0.62], [0.06, 0.62, 0.78]); m.box('team', [hx + 0.06, 0, 0.62], [0.03, 0.5, 0.66]);
  windows(m, hx, hy, 0.95, Math.max(1, Math.round(o.d / 1.5)), Math.max(1, Math.round(o.w / 1.6)), 0.46);
  const zr = rt.gableRoof(m, hx2 + 0.08, hy2 + 0.08, zTop - 0.02, o.rise || 0.9);
  if (o.chimney) { m.box('stone', [-hx * 0.45, hy * 0.35, zr + 0.2], [0.38, 0.38, 0.9]); m.box('stone', [-hx * 0.45, hy * 0.35, zr + 0.68], [0.5, 0.5, 0.09]); }
  if (o.porch !== false) {
    m.box('timber', [hx + 0.5, 0, 0.32], [1.0, d * 0.95, 0.07]);
    for (const sy of [-1, 1]) { m.beam('timber', [hx + 0.95, sy * hy * 0.9, 0.3], [hx + 0.95, sy * hy * 0.9, 1.5], 0.07, 0.07, [1, 0, 0]); m.box('timber', [hx + 0.95, sy * hy * 0.45, 1.02], [0.04, hy * 0.9, 0.05]); }
    m.box('planks', [hx + 0.5, 0, 1.52], [1.1, d * 0.97, 0.07], { rotation: rt.rotY(rad(8)) });
    m.box('timber', [hx + 1.1, 0, 0.1], [0.5, 0.9, 0.06]);
  }
  if (o.sign) { m.box('planks', [hx + 1.0, 0, 1.28], [0.04, 1.2, 0.32]); m.box('team', [hx + 1.03, 0, 1.28], [0.02, 1.05, 0.2]); }
  if (o.cupola) { m.box('planks', [0, 0, zr + 0.3], [0.7, 0.7, 0.6]); const z2 = rt.gableRoof(m, 0.45, 0.45, zr + 0.58, 0.35); if (o.flag) rt.pennant(m, 0, 0, z2); }
  if (o.ruin) {   // zniszczony styl Desperado: rusztowanie, beczki, skrzynie, przekrzywione deski dachu
    for (let i = 0; i < 3; i++) m.beam('timber', [-hx - 0.2, -hy + i * (d / 2), 0.1], [-hx - 0.2, -hy + i * (d / 2), 2.2], 0.07, 0.07, [1, 0, 0]);
    m.beam('timber', [-hx - 0.2, -hy, 1.4], [-hx - 0.2, hy, 1.4], 0.06, 0.06, [1, 0, 0]); m.beam('timber', [-hx - 0.2, -hy, 0.7], [-hx + 0.4, -hy, 1.9], 0.05, 0.05, [1, 0, 0]);
    m.box('planks', [-hx * 0.3, -hy * 0.2, zr - 0.15], [0.9, 0.5, 0.06], { rotation: rt.rotY(rad(-22)) });
    rt.barrel(m, 0.6, -hy - 0.55); rt.barrel(m, 1.0, -hy - 0.4); rt.barrel(m, hx + 1.25, hy * 0.7); rt.crate(m, -0.4, -hy - 0.5, { size: 0.5, angle: 0.4 }); rt.crate(m, hx + 1.4, -hy * 0.9, { size: 0.45, angle: -0.3 });
  } else { rt.barrel(m, hx + 1.3, hy * 0.7); rt.crate(m, hx + 1.4, -hy * 0.9, { size: 0.45, angle: 0.3 }); }
  return m;
}
const render = (m, half, target, scale) => rt.renderSprite(m, cam(half, target, scale), G);

function shed(style) {   // magazyn: otwarta szopa ze skośnym dachem, skrzynie i beczki (w obu nacjach w zniszczonym stylu)
  const m = model(style), w = 2.8, d = 2.2, hx = w / 2, hy = d / 2;
  m.box('stone', [0, 0, 0.06], [w + 0.1, d + 0.1, 0.12]);
  m.box('planks', [-hx + 0.04, 0, 0.7], [0.08, d, 1.2]);
  m.box('planks', [0, hy - 0.04, 0.7], [w, 0.08, 1.2]);
  m.box('planks', [0, -hy + 0.04, 0.55], [w, 0.08, 0.9]);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) m.beam('timber', [sx * (hx - 0.08), sy * (hy - 0.08), 0.1], [sx * (hx - 0.08), sy * (hy - 0.08), sy < 0 ? 1.25 : 1.4], 0.1, 0.1, [1, 0, 0]);
  m.box('planks', [0, 0, 1.38], [w + 0.5, d + 0.4, 0.08], { rotation: rt.rotX(rad(-9)) });
  m.box('planks', [0.5, 0, 1.46], [w * 0.5, d * 0.6, 0.06], { rotation: rt.rotX(rad(-9)) });
  rt.crate(m, 0.6, -0.1, { size: 0.6, angle: 0.2 }); rt.crate(m, 0.7, 0.55, { size: 0.5, angle: -0.3 }); rt.crate(m, -0.4, 0.5, { size: 0.55, angle: 0.5 });
  rt.barrel(m, hx + 0.45, -0.5); rt.barrel(m, hx + 0.6, 0.2); rt.crate(m, hx + 0.5, 0.95, { size: 0.45, angle: 0.4 });
  m.beam('timber', [hx + 0.2, -hy, 0.05], [hx + 0.9, -hy - 0.7, 0.05], 0.1, 0.06, [0, 0, 1]);
  return m;
}
function workshop(style) {   // fabryka broni: warsztat z dużym kominem i kołem zębatym
  const m = plank(style, { w: 3.0, d: 2.3, floors: 1, h1: 1.3, rise: 0.75, porch: false, ruin: style === 'ruin' });
  m.box('stone', [-0.9, 0.3, 1.9], [0.6, 0.6, 2.0]); m.box('stone', [-0.9, 0.3, 2.95], [0.75, 0.75, 0.1]);
  m.box('metal', [1.55, 0, 0.9], [0.06, 0.9, 0.9]); rt.wheel(m, [1.6, 0.7, 1.4], { radius: 0.34 });
  m.box('iron', [hxOf(3.0) + 0.5, -0.5, 0.3], [0.5, 0.5, 0.35]);   // kowadło
  return m;
}
const hxOf = w => w / 2;
function bank(style) {   // bank: dwupiętrowy dom z desek, fałszywy front z szyldem, kolumny przed wejściem, kamienne schody
  const m = plank(style, { w: 3.2, d: 2.5, floors: 2, h1: 1.4, rise: 0.55, porch: false });
  const hx = 1.6, hy = 1.25;
  m.box('planks', [hx - 0.05, 0, 3.0], [0.14, 2.7, 0.8]);                        // fałszywy front ponad dachem
  m.box('team', [hx + 0.04, 0, 3.0], [0.04, 2.0, 0.42]);                         // szyld
  m.box('stone', [hx + 0.55, 0, 0.1], [1.1, 1.8, 0.2]); m.box('stone', [hx + 0.85, 0, 0.05], [0.5, 1.8, 0.1]);   // schody
  for (const sy of [-0.75, 0.75]) m.cylinder('timber', [hx + 0.75, sy, 0.2], [hx + 0.75, sy, 1.85], 0.1, 0.1, 10);
  m.box('planks', [hx + 0.55, 0, 1.9], [1.2, 1.9, 0.08]);
  for (const sy of [-0.4, 0.4]) m.box('iron', [hx + 0.02, sy * 1.5, 1.0], [0.04, 0.05, 0.7]);   // kraty w oknie
  rt.crate(m, hx + 1.4, 0.95, { size: 0.5, angle: 0.3 });
  return m;
}
function ranch() {   // ranczo: stodoła z dwuskrzydłowymi wrotami, stóg siana i fragment płotu
  const m = plank('fresh', { w: 3.6, d: 2.6, floors: 1, h1: 1.7, rise: 1.15, porch: false });
  const hx = 1.8;
  m.box('timber', [hx + 0.03, 0, 0.8], [0.06, 1.5, 1.5]);
  for (const sy of [-0.38, 0.38]) m.box('planks', [hx + 0.06, sy, 0.8], [0.04, 0.7, 1.4]);
  m.beam('timber', [hx + 0.09, -0.74, 0.1], [hx + 0.09, 0.0, 1.45], 0.04, 0.05, [1, 0, 0]);
  m.box('timber', [hx + 0.05, 0, 2.05], [0.05, 0.9, 0.55]); m.box('planks', [hx + 0.08, 0, 2.05], [0.03, 0.7, 0.4]);   // luk strychu
  m.blob('thatch', [hx + 0.95, 0.9, 0.35], [0.5, 0.45, 0.4], { seed: 5, roughness: 0.2, subdivisions: 2 });
  for (let i = 0; i < 5; i++) { const y = -1.3 + i * 0.5; m.box('timber', [hx + 1.2, y - 1.9, 0.4], [0.1, 0.1, 0.8]); }
  m.beam('planks', [hx + 1.2, -3.2, 0.35], [hx + 1.2, -1.1, 0.35], 0.04, 0.06, [0, 0, 1]); m.beam('planks', [hx + 1.2, -3.2, 0.62], [hx + 1.2, -1.1, 0.62], 0.04, 0.06, [0, 0, 1]);
  rt.barrel(m, hx + 0.5, -1.1);
  return m;
}
function corral(style) {   // zagroda koni: ogrodzenie, poidło, siano, mała wiata
  const m = model(style), S = 1.5, post = 0.12, step = 0.5;
  for (const [ax, ay, bx, by] of [[-S, -S, S, -S], [S, -S, S, S], [S, S, -S, S], [-S, S, -S, -S]]) {
    const n = Math.round(Math.hypot(bx - ax, by - ay) / step);
    for (let i = 0; i <= n; i++) { const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; m.box('timber', [x, y, 0.4], [post, post, 0.8]); }
    for (const z of [0.3, 0.6]) m.beam('planks', [ax, ay, z], [bx, by, z], 0.05, 0.06, [0, 0, 1]);
  }
  m.box('timber', [-0.8, 0.6, 0.18], [1.0, 0.3, 0.12]); m.box('timber', [-0.8, 0.6, 0.3], [1.0, 0.3, 0.05]);
  m.blob('thatch', [0.7, -0.7, 0.2], [0.4, 0.35, 0.2], { seed: 4, roughness: 0.2, subdivisions: 2 });
  m.box('planks', [-0.9, -0.95, 0.9], [1.1, 0.7, 0.07], { rotation: rt.rotX(rad(-8)) });
  for (const sx of [-1.4, -0.4]) for (const sy of [-1.25, -0.65]) m.beam('timber', [sx, sy, 0.05], [sx, sy, 0.95], 0.07, 0.07, [1, 0, 0]);
  return m;
}
function farmField(style) {  // farma: zaorane pole z rzędami roślin, płotek i strach na wróble
  const m = model(style); m.material('soil', { texture: TX.dirt, worldSize: 1.2 }); m.material('crop', { color: [0.52, 0.55, 0.14] }); m.material('crop2', { color: [0.66, 0.54, 0.16] });
  m.box('soil', [0, 0, 0.02], [3.0, 3.0, 0.04]);
  for (let r = 0; r < 8; r++) { const y = -1.3 + r * 0.37; m.box('soil', [0, y, 0.07], [2.8, 0.14, 0.06]); for (let i = 0; i < 12; i++) { const x = -1.25 + i * 0.23; m.box(r % 2 ? 'crop' : 'crop2', [x, y, 0.2], [0.06, 0.06, 0.28 + 0.08 * ((i + r) % 3)]); } }
  for (const [x, y] of [[-1.55, -1.55], [1.55, -1.55], [1.55, 1.55], [-1.55, 1.55]]) m.box('timber', [x, y, 0.25], [0.1, 0.1, 0.5]);
  m.beam('planks', [-1.55, -1.55, 0.35], [1.55, -1.55, 0.35], 0.04, 0.06, [0, 0, 1]); m.beam('planks', [1.55, -1.55, 0.35], [1.55, 1.55, 0.35], 0.04, 0.06, [0, 0, 1]);
  m.beam('timber', [0.9, 0.9, 0.05], [0.9, 0.9, 0.95], 0.05, 0.05, [1, 0, 0]); m.beam('timber', [0.6, 0.9, 0.7], [1.2, 0.9, 0.7], 0.04, 0.04, [0, 0, 1]); m.blob('thatch', [0.9, 0.9, 1.0], [0.1, 0.1, 0.12], { seed: 3, roughness: 0.1, subdivisions: 1 });
  return m;
}
// Sioux: stożek z pasami (niebieskie pasy to stały element zdobienia, nie kolor właściciela)
function tepee(scale, variant) {
  const m = model(null); m.material('band', { color: [0.14, 0.30, 0.66] }); m.material('red', { texture: TX.pattern, worldSize: 1.2 });
  const H = 2.5 * scale, R0 = 1.05 * scale, r = z => R0 * (1 - z / (H + 0.35 * scale)) + 0.06;
  const bands = [[0, 0.32 * scale, 'red'], [0.32 * scale, 0.56 * scale, 'band'], [0.56 * scale, 1.55 * scale, 'hide'], [1.55 * scale, 1.72 * scale, 'band'], [1.72 * scale, H, 'hide']];
  for (const [a, b, mat] of bands) m.cylinder(mat, [0, 0, a], [0, 0, b], r(a), r(b), 22);
  if (variant === 1) { m.cylinder('red', [0, 0, 1.0 * scale], [0, 0, 1.25 * scale], r(1.0 * scale) + 0.005, r(1.25 * scale) + 0.005, 22); }
  m.box('timber', [R0 * 0.55, 0.0, 0.55 * scale], [0.05, 0.4 * scale, 1.0 * scale]);
  for (let i = 0; i < 7; i++) { const a = i * 2 * Math.PI / 7 + 0.3, tx = Math.cos(a) * 0.06, ty = Math.sin(a) * 0.06; m.beam('timber', [tx, ty, H - 0.2], [Math.cos(a) * 0.55 * scale + tx, Math.sin(a) * 0.55 * scale + ty, H + 0.75 * scale], 0.05, 0.05, [0, 0, 1]); }
  if (variant === 1) { m.beam('timber', [R0 * 1.25, -0.6, 0.05], [R0 * 1.25, -0.6, 1.5], 0.06, 0.06, [1, 0, 0]); m.beam('timber', [R0 * 1.25, 0.6, 0.05], [R0 * 1.25, 0.6, 1.5], 0.06, 0.06, [1, 0, 0]); m.beam('timber', [R0 * 1.25, -0.6, 1.35], [R0 * 1.25, 0.6, 1.35], 0.05, 0.05, [0, 0, 1]); }
  return m;
}
function dryingRack() {   // magazyn Sioux: stelaż z suszącymi się skórami, kosze i skrzynie
  const m = model(null);
  for (const sx of [-1, 1]) for (const sy of [-0.7, 0.7]) m.beam('timber', [sx * 1.0, sy, 0.05], [sx * 1.0, sy, 1.5], 0.08, 0.08, [1, 0, 0]);
  for (const sy of [-0.7, 0.7]) m.beam('timber', [-1.0, sy, 1.4], [1.0, sy, 1.4], 0.06, 0.06, [0, 0, 1]);
  m.beam('timber', [-1.0, -0.7, 1.4], [-1.0, 0.7, 1.4], 0.06, 0.06, [0, 0, 1]); m.beam('timber', [1.0, -0.7, 1.4], [1.0, 0.7, 1.4], 0.06, 0.06, [0, 0, 1]);
  for (let i = 0; i < 4; i++) m.box('hide', [-0.7 + i * 0.47, -0.7, 0.95], [0.4, 0.04, 0.8]);
  for (let i = 0; i < 4; i++) m.box('hide', [-0.7 + i * 0.47, 0.7, 0.95], [0.4, 0.04, 0.8]);
  m.box('hide', [0, 0, 1.2], [1.8, 1.3, 0.05], { rotation: rt.rotX(rad(6)) });
  rt.crate(m, 0.3, 0.1, { size: 0.5, angle: 0.3 }); rt.barrel(m, -0.4, -0.2); rt.crate(m, 1.4, -0.9, { size: 0.45, angle: -0.4 }); rt.barrel(m, 1.5, 0.4);
  return m;
}

function all(lap) {
  const results = {};
  const put = (key, m, half, target, scale) => { const res = render(m, half, target, scale); results[key] = res; saveStatic(key, res, 'buildings'); lap(key); };
  // Osadnicy (us): świeże brązowe deski; główna baza biała; magazyn zniszczony
  put('bld_house_us', plank('fresh', { w: 3.0, d: 2.2, floors: 1, h1: 1.35, rise: 0.85, chimney: true }), 4.6, [0.3, 0, 1.2], 0.5);
  put('bld_hq_us', plank('white', { w: 4.4, d: 3.2, floors: 2, h1: 1.3, rise: 1.0, chimney: true, cupola: true, flag: true }), 6.2, [0.4, 0, 1.6], 0.58);
  put('bld_barracks_us', plank('fresh', { w: 3.8, d: 2.2, floors: 1, h1: 1.3, rise: 0.8, chimney: true }), 5.4, [0.4, 0, 1.2], 0.48);
  put('bld_factory_us', workshop('fresh'), 5.0, [0.3, 0, 1.3], 0.48);
  put('bld_storehouse_us', shed('ruin'), 4.2, [0.3, 0, 0.8], 0.56);
  put('bld_zagroda_us', corral('fresh'), 4.2, [0, 0, 0.5], 0.6);
  put('bld_farm_us', farmField('fresh'), 4.2, [0, 0, 0.3], 0.6);
  put('bld_bank_us', bank('fresh'), 5.0, [0.3, 0, 1.6], 0.5);
  put('bld_ranch_us', ranch(), 5.4, [0.3, 0, 1.3], 0.5);
  // Desperado (ban): szare, zniszczone deski
  put('bld_house_ban', plank('ruin', { w: 3.2, d: 2.4, floors: 2, rise: 0.7, ruin: true }), 4.8, [0.3, 0, 1.3], 0.48);
  put('bld_hq_ban', plank('ruin', { w: 4.4, d: 3.4, floors: 2, h1: 1.3, rise: 0.8, ruin: true, sign: true }), 6.2, [0.4, 0, 1.6], 0.58);
  put('bld_barracks_ban', plank('ruin', { w: 3.8, d: 2.2, floors: 1, h1: 1.3, rise: 0.7, ruin: true }), 5.4, [0.4, 0, 1.2], 0.48);
  put('bld_factory_ban', workshop('ruin'), 5.0, [0.3, 0, 1.3], 0.48);
  put('bld_storehouse_ban', shed('ruin'), 4.2, [0.3, 0, 0.8], 0.56);
  put('bld_zagroda_ban', corral('ruin'), 4.2, [0, 0, 0.5], 0.6);
  put('bld_farm_ban', farmField('ruin'), 4.2, [0, 0, 0.3], 0.6);
  // Sioux (sx): tepee i szałasy
  put('bld_tepee_sx', tepee(1.0, 0), 3.6, [0, 0, 1.2], 0.75);
  put('bld_hq_sx', tepee(1.45, 1), 5.0, [0, 0, 1.8], 0.75);
  put('bld_barracks_sx', tepee(1.2, 1), 4.2, [0, 0, 1.5], 0.75);
  put('bld_storehouse_sx', dryingRack(), 4.0, [0, 0, 0.8], 0.56);
  put('bld_farm_sx', farmField(null), 4.2, [0, 0, 0.3], 0.6);
  if (process.env.PREVIEW) preview(results, process.env.PREVIEW);
}
// podgląd wszystkich budynków w jednej scenie (tylko do oceny przez człowieka): wiersze nacji us, ban, sx
function preview(results, file) {
  const fs = require('fs'), c = new rt.Camera({ tilePx: L.TILE, halfExtent: 3.6 }), W = 2900, H = 2400, origin = [300, 260];
  const ground = rt.groundLayer(c, W, H, origin, TX.ochre, { gain: rt.groundGain(c, { groundTexture: TX.ochre }) });
  const rows = { us: ['house', 'hq', 'barracks', 'factory', 'storehouse', 'zagroda', 'farm', 'bank', 'ranch'], ban: ['house', 'hq', 'barracks', 'factory', 'storehouse', 'zagroda', 'farm'], sx: ['tepee', 'hq', 'barracks', 'storehouse', 'farm'] };
  const items = []; let row = 0;
  for (const nation of ['us', 'ban', 'sx']) { rows[nation].forEach((t, i) => { const r = results['bld_' + t + '_' + nation]; if (r) items.push({ res: r, x: i * 3.0 + row * 4.4, y: -i * 3.0 + row * 4.4 }); }); row++; }
  fs.writeFileSync(file, rt.encodePng(rt.composeScene(items, c, W, H, origin, ground)));
}
module.exports = { all };
