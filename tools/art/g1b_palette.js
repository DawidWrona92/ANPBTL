// G1b: próbki w palecie oryginału (screeny od właściciela). Dwie sceny: preria ochrowa (Osadnicy/Desperado) i oliwkowa trawa (Sioux, Meksykanie).
// Budynki, drzewa, teren: rts-prerender-3d (przenośny JS). Jednostki: painted-rts-sprites. Kafel TILE px (domyślnie 128).
//   node tools/art/g1b_palette.js   (OUT=katalog, SKILLS_DIR=ścieżka do skilli)
const fs = require('fs'), path = require('path');
const SK = process.env.SKILLS_DIR || '/root/.claude/skills/synced/3f48fc38-d005-456a-896a-d33cbff9e6e1_f8d362e6-5cd9-406f-ad0d-703fa9bc0f31';
const rt = require(SK + '/rts-prerender-3d/scripts/portable/rtcore.js');
const pt = require(SK + '/painted-rts-sprites/scripts/painter.js');
const TILE = +process.env.TILE || 128, K = TILE / 96, OUT = process.env.OUT || __dirname;
const t0 = Date.now(), lap = n => console.log(n, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
const clamp = x => Math.min(1, Math.max(0, x)), mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const TEAM = { us: [0.12, 0.30, 0.78], mx: [0.18, 0.55, 0.28], ban: [0.92, 0.76, 0.10], red: [0.75, 0.15, 0.12] };

// ---------- tekstury własne (paleta z oryginału)
function paint(size, fn) { const tex = rt.newTexture(size); for (let i = 0; i < size * size; i++) { const c = fn(i); for (let k = 0; k < 3; k++) tex.data[i * 3 + k] = clamp(c[k]); } return tex; }
function texOchre(size, seed) {   // wypalona, spękana preria: ochra i pomarańcz
  const big = rt.fbm(size, seed, [4, 14]), mid = rt.fbm(size, seed + 1, [1.5, 4]), fine = rt.fbm(size, seed + 2, [0.6, 1.6]), crk = rt.fbm(size, seed + 3, [3, 8]);
  const dark = [0.42, 0.26, 0.09], base = [0.64, 0.43, 0.15], light = [0.77, 0.55, 0.22];
  return paint(size, i => {
    const t = clamp(0.5 + 0.26 * big[i] + 0.12 * mid[i]);
    let c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2);
    const cr = Math.abs(crk[i]); if (cr < 0.09) c = mix(c, [0.30, 0.17, 0.06], 0.75 * (0.09 - cr) / 0.09);
    const f = 1 + 0.06 * fine[i]; return [c[0] * f, c[1] * f, c[2] * f];
  });
}
function texOlive(size, seed) {   // oliwkowo-żółta trawa z ochrowymi plamami
  const big = rt.fbm(size, seed, [5, 16]), mid = rt.fbm(size, seed + 1, [1.2, 3]), blade = rt.fbm(size, seed + 2, [0.5, 1.4], [0.4, 1.6]);
  const dark = [0.30, 0.32, 0.09], base = [0.48, 0.48, 0.15], light = [0.62, 0.59, 0.22], ochre = [0.60, 0.42, 0.16];
  return paint(size, i => {
    const t = clamp(0.5 + 0.25 * big[i] + 0.15 * mid[i]);
    let c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2);
    if (big[i] > 1.5) c = mix(c, ochre, clamp((big[i] - 1.5) * 0.8));
    const f = 1 + 0.10 * blade[i]; return [c[0] * f, c[1] * f, c[2] * f];
  });
}
function texAutumnLeaf(size, seed) {
  const n = rt.fbm(size, seed, [1.0, 2.5]), m = rt.fbm(size, seed + 1, [0.6, 1.5]);
  const pal = [[0.55, 0.26, 0.08], [0.72, 0.38, 0.11], [0.84, 0.52, 0.15], [0.46, 0.22, 0.08]];
  return paint(size, i => { const k = clamp(0.5 + 0.35 * n[i] + 0.25 * m[i]); const f = k * (pal.length - 1), a = Math.floor(f); return mix(pal[a], pal[Math.min(pal.length - 1, a + 1)], f - a); });
}
function texRustNeedle(size, seed) {
  const n = rt.fbm(size, seed, [1.0, 2.5]), m = rt.fbm(size, seed + 1, [0.5, 1.2]);
  return paint(size, i => { const t = clamp(0.5 + 0.3 * n[i] + 0.2 * m[i]); return mix(mix([0.36, 0.30, 0.10], [0.52, 0.40, 0.15], t), [0.66, 0.38, 0.13], clamp((m[i] - 0.3) * 0.9)); });
}
function texHide(size, seed) {    // skóra tepee: kość słoniowa z delikatnymi smugami
  const n = rt.fbm(size, seed, [3, 9]), s = rt.fbm(size, seed + 1, [0.8, 3], [0.6, 5]);
  return paint(size, i => { const f = 1 + 0.07 * n[i] + 0.04 * s[i]; return [0.86 * f, 0.77 * f, 0.58 * f]; });
}
function texPattern(size, seed) { // czerwono-brązowy, zdobiony pas na tepee
  const n = rt.fbm(size, seed, [1, 3]);
  return paint(size, i => { const stripe = ((i % size) / size * 8) % 1 < 0.5 ? 1 : 0.8; const f = (1 + 0.1 * n[i]) * stripe; return [0.55 * f, 0.22 * f, 0.14 * f]; });
}
function texWhite(size, seed) { const n = rt.fbm(size, seed, [2, 6]), f = rt.fbm(size, seed + 1, [0.7, 1.8]); return paint(size, i => { const k = 1 + 0.025 * n[i] + 0.02 * f[i]; return [0.90 * k, 0.86 * k, 0.77 * k]; }); }
const T = rt.standardTextures();
const TX = {
  ochre: texOchre(512, 11), olive: texOlive(512, 21), leaf: texAutumnLeaf(256, 5), needle: texRustNeedle(256, 8), hide: texHide(256, 3), pattern: texPattern(256, 4),
  planks: rt.adjustTexture(T.planks, { saturation: 0.28, brightness: 1.95, contrast: 1.0 }), timber: rt.adjustTexture(T.timber, { saturation: 0.35, brightness: 1.5 }),
  grayRoof: rt.adjustTexture(T.planks, { saturation: 0.22, brightness: 1.6 }), plaster: texWhite(256, 9),
  bark: rt.adjustTexture(T.bark, { saturation: 0.7, brightness: 0.55 }),
  clay: rt.adjustTexture(T.roof, { saturation: 0.95, brightness: 1.4, contrast: 0.7 }),
};
function model(nation) {
  const m = rt.standardModel(T);
  if (nation === 'us' || nation === 'ban') {
    m.material('planks', { texture: TX.planks, worldSize: 1.2 }); m.material('timber', { texture: TX.timber, worldSize: 1.6 }); m.material('roof', { texture: TX.grayRoof, worldSize: 1.5 });
  } else if (nation === 'mx') {
    m.material('plaster', { texture: TX.plaster, worldSize: 2.4 }); m.material('roof', { texture: TX.clay, worldSize: 1.7 });
  }
  m.material('hide', { texture: TX.hide, worldSize: 1.6 }); m.material('pattern', { texture: TX.pattern, worldSize: 1.2 });
  m.material('leaf', { texture: TX.leaf, worldSize: 1.0 }); m.material('needle', { texture: TX.needle, worldSize: 1.0 });
  m.material('bark', { texture: TX.bark, worldSize: 1.2 });
  m.material('foliage_core', { color: [0.30, 0.20, 0.08] });   // domyślny rdzeń korony jest zielono-niebieski i przebija na końcówkach pięter sosny
  return m;
}
const cam = (half, target, scale = 1) => new rt.Camera({ tilePx: TILE * scale, halfExtent: half, target });

// ---------- modele
function windows(m, hx, hy, z, team) {   // okna na ścianach +x i -y (tylko te widać)
  for (const wy of [-0.7, 0.7]) { m.box('timber', [hx + 0.02, wy, z], [0.05, 0.46, 0.56]); m.box('glass', [hx + 0.045, wy, z], [0.03, 0.34, 0.44]); for (const s of [-1, 1]) m.box('team_dark', [hx + 0.06, wy + s * 0.32, z], [0.04, 0.16, 0.56]); }
  for (const wx of [-0.9, 0.2]) { m.box('timber', [wx, -hy - 0.02, z], [0.46, 0.05, 0.56]); m.box('glass', [wx, -hy - 0.045, z], [0.34, 0.03, 0.44]); for (const s of [-1, 1]) m.box('team_dark', [wx + s * 0.32, -hy - 0.06, z], [0.16, 0.04, 0.56]); }
}
function westernHouse(nation) {       // dwupiętrowy dom z postarzonych desek; 'ban' = bardziej zrujnowany, z rusztowaniem i beczkami
  const m = model(nation), w = 3.2, d = 2.4, hx = w / 2, hy = d / 2;
  m.box('stone', [0, 0, 0.12], [w + 0.1, d + 0.1, 0.24]);
  m.box('planks', [0, 0, 0.84], [w, d, 1.2]);
  m.box('planks', [0, 0, 1.99], [w - 0.34, d - 0.34, 1.1]);
  m.box('team', [0, 0, 1.46], [w + 0.08, d + 0.08, 0.08]);
  for (let i = -1; i <= 1; i++) { m.box('timber', [hx + 0.02, i * 0.7, 0.84], [0.04, 0.05, 1.2]); }
  m.box('timber', [hx + 0.03, 0, 0.62], [0.06, 0.62, 0.78]); m.box('team', [hx + 0.06, 0, 0.62], [0.03, 0.5, 0.66]);
  windows(m, hx, hy, 0.95, true);
  const hx2 = (w - 0.34) / 2, hy2 = (d - 0.34) / 2;
  for (const wy of [-0.55, 0.55]) { m.box('timber', [hx2 + 0.02, wy, 2.05], [0.05, 0.42, 0.52]); m.box('glass', [hx2 + 0.045, wy, 2.05], [0.03, 0.32, 0.4]); }
  const zr = rt.gableRoof(m, hx2 + 0.05, hy2 + 0.05, 2.54, nation === 'ban' ? 0.7 : 0.9);
  // galeria na ścianie +x: podest, słupki, daszek
  m.box('timber', [hx + 0.5, 0, 0.32], [1.0, d * 0.95, 0.07]);
  for (const sy of [-1, 1]) { m.beam('timber', [hx + 0.95, sy * hy * 0.9, 0.3], [hx + 0.95, sy * hy * 0.9, 1.5], 0.07, 0.07, [1, 0, 0]); m.box('timber', [hx + 0.95, sy * hy * 0.9 * 0.5, 1.02], [0.04, hy * 0.9, 0.05]); }
  m.box('planks', [hx + 0.5, 0, 1.52], [1.1, d * 0.97, 0.07], { rotation: rt.rotY(8 * Math.PI / 180) });
  m.box('timber', [hx + 1.1, 0, 0.1], [0.5, 0.9, 0.06]); m.box('timber', [hx + 1.35, 0, 0.04], [0.4, 0.9, 0.04]);
  if (nation === 'ban') {
    for (let i = 0; i < 3; i++) { m.beam('timber', [-hx - 0.2, -hy + i * 0.9, 0.1], [-hx - 0.2, -hy + i * 0.9, 2.4], 0.07, 0.07, [1, 0, 0]); }
    m.beam('timber', [-hx - 0.2, -hy, 1.45], [-hx - 0.2, hy, 1.45], 0.06, 0.06, [1, 0, 0]);
    rt.barrel(m, 0.6, -hy - 0.6); rt.barrel(m, 1.0, -hy - 0.45); rt.barrel(m, hx + 1.2, 1.4); rt.crate(m, -0.4, -hy - 0.55, { size: 0.5, angle: 0.4 }); rt.crate(m, hx + 1.4, -1.35, { size: 0.45, angle: -0.3 });
  } else { rt.barrel(m, hx + 1.3, 1.25); rt.crate(m, hx + 1.4, -1.3, { size: 0.45, angle: 0.3 }); }
  return rt.renderSprite(m, cam(4.6, [0.3, 0, 1.2], 0.72), { groundTexture: TX.ochre });
}
function mexicanHouse() {
  const m = model('mx'), w = 3.2, d = 2.4, hx = w / 2, hy = d / 2;
  m.box('plaster', [0, 0, 0.7], [w, d, 1.4]);
  m.box('plaster', [-0.4, 0.1, 1.9], [1.9, 1.8, 1.0]);
  m.box('plaster', [0.55, 0, 1.46], [1.2, d - 0.1, 0.12]);                      // parapet nad niższą częścią
  const zr = rt.gableRoof(m, 0.95 + 0.1, 0.9 + 0.1, 2.38, 0.7);
  m.box('stone', [hx + 0.01, 0, 0.55], [0.06, 0.7, 1.0]);                         // portal
  m.box('glass', [hx + 0.04, 0, 0.5], [0.03, 0.52, 0.86]);
  m.box('team', [hx + 0.05, 0, 1.05], [0.04, 0.78, 0.07]);
  for (const wy of [-0.85, 0.85]) { m.box('timber', [hx + 0.02, wy, 0.85], [0.05, 0.42, 0.55]); m.box('glass', [hx + 0.045, wy, 0.85], [0.03, 0.3, 0.42]); m.box('team', [hx + 0.05, wy, 0.55], [0.04, 0.5, 0.05]); }
  for (const wx of [-1.0, 0.1]) { m.box('timber', [wx, -hy - 0.02, 0.85], [0.42, 0.05, 0.55]); m.box('glass', [wx, -hy - 0.045, 0.85], [0.3, 0.03, 0.42]); m.box('team', [wx, -hy - 0.05, 0.55], [0.5, 0.04, 0.05]); }
  m.box('timber', [-0.4, -0.9 - 0.02, 1.95], [0.5, 0.05, 0.6]); m.box('glass', [-0.4, -0.9 - 0.045, 1.95], [0.36, 0.03, 0.46]); m.box('team', [-0.4, -0.9 - 0.05, 1.62], [0.6, 0.04, 0.05]);
  m.box('timber', [hx + 0.35, 0.0, 1.75], [0.7, 1.6, 0.06]);                       // drewniany balkon
  for (const s of [-1, 1]) m.beam('timber', [hx + 0.65, s * 0.75, 1.0], [hx + 0.65, s * 0.75, 1.75], 0.06, 0.06, [1, 0, 0]);
  rt.barrel(m, hx + 0.6, 1.5); rt.crate(m, hx + 0.7, -1.4, { size: 0.42, angle: 0.2 }); rt.bush(m, -hx - 0.3, hy + 0.2, { radius: 0.35, seed: 4 });
  return rt.renderSprite(m, cam(4.4, [0, 0, 1.2], 0.72), { groundTexture: TX.olive });
}
function tepee(variant, ground) {
  const m = model('sx'), H = 2.5, R0 = 1.05, r = z => R0 * (1 - z / (H + 0.35)) + 0.06;
  const bands = [[0, 0.32, 'pattern'], [0.32, 0.56, 'team'], [0.56, 1.55, 'hide'], [1.55, 1.72, 'team'], [1.72, H, 'hide']];
  for (const [a, b, mat] of bands) m.cylinder(mat === 'pattern' && variant === 1 ? 'hide' : mat, [0, 0, a], [0, 0, b], r(a), r(b), 20);
  if (variant === 1) for (const [a, b, mat] of [[0, 0.32, 'pattern']]) m.cylinder(mat, [0, 0, a], [0, 0, b], r(a) + 0.005, r(b) + 0.005, 20);
  m.box('timber', [R0 * 0.55, 0.0, 0.55], [0.05, 0.4, 1.0]);                      // wejście
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3, tx = Math.cos(a) * 0.06, ty = Math.sin(a) * 0.06; m.beam('timber', [tx, ty, H - 0.2], [Math.cos(a) * 0.55 + tx, Math.sin(a) * 0.55 + ty, H + 0.75], 0.05, 0.05, [0, 0, 1]); }
  return rt.renderSprite(m, cam(3.4, [0, 0, 1.2], 0.85), { groundTexture: ground });
}
const oak = (seed, ground) => { const m = model('sx'); rt.treeOak(m, 0, 0, { height: 2.6, crown: 1.05, seed }); return rt.renderSprite(m, cam(3.4, [0, 0, 1.5]), { groundTexture: ground }); };
const pine = (h, ground) => { const m = model('sx'); rt.treePine(m, 0, 0, { height: h, baseRadius: 0.85 }); return rt.renderSprite(m, cam(3.4, [0, 0, 1.5]), { groundTexture: ground }); };
lap('tekstury i modele zdefiniowane');

// ---------- jednostki (painted)
const sc = n => Math.round(n * K);
const FR = { width: sc(260), height: sc(210), anchor: [sc(130), sc(160)], supersample: 3, tilePx: TILE }, FRH = { width: sc(340), height: sc(270), anchor: [sc(170), sc(205)], supersample: 3, tilePx: TILE };
const unit = (o) => { const P = pt.sprite(FR); pt.humanoid(P, Object.assign({ yaw: 315, phase: 0.15, scale: 1.0 }, o)); return P.render(); };
const recolor = (res, color) => Object.assign({}, res, { sprite: rt.swapTeamColor(res.sprite, res.team, color) });
const horse = (o) => { const P = pt.sprite(FRH); pt.horse(P, Object.assign({ scale: 1.1 }, o)); return P.render(); };
const U = {
  us: [recolor(unit({ weapon: 'rifle', hat: 'cowboy', shirt: [0.22, 0.30, 0.52], pants: [0.30, 0.27, 0.25], team: 'torso' }), TEAM.us), recolor(unit({ yaw: 270, weapon: 'pickaxe', hat: 'cowboy', shirt: [0.62, 0.55, 0.42], pants: [0.30, 0.26, 0.2], team: 'hat' }), TEAM.us)],
  mx: [recolor(unit({ weapon: 'rifle', hat: 'sombrero', hatColor: [0.86, 0.80, 0.62], shirt: [0.88, 0.86, 0.78], pants: [0.25, 0.25, 0.28], team: 'sleeves' }), TEAM.mx), recolor(unit({ yaw: 0, weapon: 'rifle', hat: 'sombrero', hatColor: [0.82, 0.72, 0.5], shirt: [0.3, 0.45, 0.3], pants: [0.2, 0.2, 0.22], team: 'torso' }), TEAM.mx)],
  ban: [recolor(unit({ weapon: 'rifle', hat: 'cowboy', hatColor: [0.18, 0.14, 0.10], shirt: [0.28, 0.2, 0.15], pants: [0.2, 0.18, 0.16], team: 'sleeves' }), TEAM.ban), recolor(unit({ yaw: 0, weapon: 'rifle', hat: 'cowboy', hatColor: [0.2, 0.16, 0.12], shirt: [0.5, 0.2, 0.15], pants: [0.2, 0.17, 0.14], team: 'hat' }), TEAM.ban)],
  sx: [unit({ weapon: 'bow', hat: 'none', shirt: [0.72, 0.5, 0.32], pants: [0.62, 0.42, 0.26], skin: [0.6, 0.38, 0.26], team: 'none' }), unit({ yaw: 270, weapon: 'none', hat: 'none', shirt: [0.7, 0.3, 0.3], pants: [0.6, 0.4, 0.26], skin: [0.6, 0.38, 0.26], team: 'none' })],
};
const H_US = recolor(horse({ yaw: 315, rider: { weapon: 'rifle', hat: 'cowboy', shirt: [0.22, 0.30, 0.52], team: 'torso' }, coat: [0.55, 0.36, 0.2] }), TEAM.us);
const H_WILD = horse({ yaw: 40, coat: [0.72, 0.52, 0.3], mane: [0.2, 0.14, 0.1] }), H_WILD2 = horse({ yaw: 200, coat: [0.88, 0.8, 0.65], mane: [0.82, 0.74, 0.6] });
lap('jednostki');

// ---------- sceny
function scene(name, groundTex, items, W, H, origin) {
  const c = new rt.Camera({ tilePx: TILE, halfExtent: 3.6 }), gain = rt.groundGain(c, { groundTexture: groundTex });
  const ground = rt.groundLayer(c, W, H, origin, groundTex, { gain });
  fs.writeFileSync(path.join(OUT, name + '.png'), rt.encodePng(rt.composeScene(items, c, W, H, origin, ground)));
}
const W = Math.round(1100 * K), Hh = Math.round(640 * K), origin = [Math.round(500 * K), Math.round(300 * K)];
// scena A: preria ochrowa (Osadnicy, Desperado)
const hUS = recolor(westernHouse('us'), TEAM.us), hBAN = recolor(westernHouse('ban'), TEAM.ban); lap('domy A');
const oaksA = [oak(1, TX.ochre), oak(7, TX.ochre)], pineA = pine(3.4, TX.ochre);
scene('g1b_scene_A_ochre', TX.ochre, [
  { res: hUS, x: -1.5, y: 2.5 }, { res: hBAN, x: 2.5, y: -2.5 }, { res: oaksA[0], x: 5.5, y: 2.5 }, { res: oaksA[1], x: -4.5, y: -1.5 }, { res: pineA, x: 7, y: -1 },
  { res: U.us[0], x: 1.2, y: 3.2 }, { res: U.us[1], x: 1.7, y: 3.6 }, { res: U.ban[0], x: 3.4, y: 0.6 }, { res: U.ban[1], x: 3.9, y: 1.0 }, { res: H_US, x: 0.4, y: 4.2 }, { res: H_WILD, x: 6.8, y: 4.6 },
], W, Hh, origin);
lap('scena A');
// scena B: oliwkowa trawa (Sioux, Meksykanie)
const hMX = recolor(mexicanHouse(), TEAM.mx), tp = [tepee(0, TX.olive), tepee(1, TX.olive)].map(r => recolor(r, TEAM.us));
const oaksB = [oak(3, TX.olive)], pineB = [pine(3.2, TX.olive), pine(3.7, TX.olive)];
lap('domy B');
scene('g1b_scene_B_olive', TX.olive, [
  { res: tp[0], x: -2.5, y: 1.5 }, { res: tp[1], x: -0.5, y: 4.0 }, { res: tp[0], x: 1.6, y: 1.0 }, { res: hMX, x: 4.5, y: -2.8 }, { res: pineB[0], x: 8, y: 1.5 }, { res: pineB[1], x: 8.6, y: 3.0 }, { res: oaksB[0], x: -5, y: -1 },
  { res: U.sx[0], x: -1.0, y: 2.7 }, { res: U.sx[1], x: 0.3, y: 2.3 }, { res: U.mx[0], x: 3.3, y: 0.4 }, { res: U.mx[1], x: 4.0, y: 0.9 }, { res: H_WILD, x: 1.5, y: 5.2 }, { res: H_WILD2, x: 2.7, y: 5.8 },
], W, Hh, origin);
lap('scena B');
// podgląd samego gruntu (kafle): nasycenie i spękania
const c0 = new rt.Camera({ tilePx: TILE, halfExtent: 3.6 }), Wg = Math.round(900 * K), Hg = Math.round(300 * K);
for (const [n, tex] of [['ochre', TX.ochre], ['olive', TX.olive]]) {
  const g = rt.groundLayer(c0, Wg, Hg, [Wg / 2, Hg / 2], tex, { gain: rt.groundGain(c0, { groundTexture: tex }) }), img = rt.makeImage(Wg, Hg, 3);
  for (let i = 0; i < g.data.length; i++) img.data[i] = Math.round(clamp(g.data[i]) * 255);
  fs.writeFileSync(path.join(OUT, 'g1b_ground_' + n + '.png'), rt.encodePng(img));
}
lap('gotowe');
