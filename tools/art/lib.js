// Wspólny kod generatora grafiki: ładowanie skilli, własne tekstury w palecie oryginału, modele, zapis zasobów i manifest.
// Skille: SKILLS_DIR (domyślnie ścieżka z tej maszyny). Backend rts-prerender-3d: przenośny JS (Mitsuba niepotrzebna).
const fs = require('fs'), path = require('path');
const SK = process.env.SKILLS_DIR || '/root/.claude/skills/synced/3f48fc38-d005-456a-896a-d33cbff9e6e1_f8d362e6-5cd9-406f-ad0d-703fa9bc0f31';
const rt = require(SK + '/rts-prerender-3d/scripts/portable/rtcore.js');
const pt = require(SK + '/painted-rts-sprites/scripts/painter.js');
const TILE = 128;                                   // piksele szerokości kafla w zasobach; gra rysuje je w połowie (ZOOM=2, CFG.tileW=64)
const ROOT = path.join(__dirname, '..', '..'), ASSETS = path.join(ROOT, 'assets');
const clamp = x => Math.min(1, Math.max(0, x)), mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- tekstury własne (paleta z oryginału: ochra, szare i brązowe deski, jesienne liście, skóra tepee)
function paint(size, fn) { const tex = rt.newTexture(size); for (let i = 0; i < size * size; i++) { const c = fn(i); for (let k = 0; k < 3; k++) tex.data[i * 3 + k] = clamp(c[k]); } return tex; }
function texOchre(size, seed, dim = 1) {   // wypalona, spękana preria
  const big = rt.fbm(size, seed, [4, 14]), mid = rt.fbm(size, seed + 1, [1.5, 4]), fine = rt.fbm(size, seed + 2, [0.6, 1.6]), crk = rt.fbm(size, seed + 3, [3, 8]);
  const dark = [0.42, 0.26, 0.09], base = [0.64, 0.43, 0.15], light = [0.77, 0.55, 0.22];
  return paint(size, i => {
    const t = clamp(0.5 + 0.26 * big[i] + 0.12 * mid[i]);
    let c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2);
    const cr = Math.abs(crk[i]); if (cr < 0.09) c = mix(c, [0.30, 0.17, 0.06], 0.75 * (0.09 - cr) / 0.09);
    const f = (1 + 0.06 * fine[i]) * dim; return [c[0] * f, c[1] * f, c[2] * f];
  });
}
function texOlive(size, seed) {   // oliwkowo-żółta trawa
  const big = rt.fbm(size, seed, [5, 16]), mid = rt.fbm(size, seed + 1, [1.2, 3]), blade = rt.fbm(size, seed + 2, [0.5, 1.4], [0.4, 1.6]);
  const dark = [0.30, 0.32, 0.09], base = [0.48, 0.48, 0.15], light = [0.62, 0.59, 0.22], ochre = [0.60, 0.42, 0.16];
  return paint(size, i => {
    const t = clamp(0.5 + 0.25 * big[i] + 0.15 * mid[i]);
    let c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2);
    if (big[i] > 1.5) c = mix(c, ochre, clamp((big[i] - 1.5) * 0.8));
    const f = 1 + 0.10 * blade[i]; return [c[0] * f, c[1] * f, c[2] * f];
  });
}
function texGrass(size, seed) {   // sucha preria: słomkowo-khaki, zieleń tylko jako rzadkie, ciemniejsze plamy; drobny szum źdźbeł daje ostrość przy powiększeniu
  const big = rt.fbm(size, seed, [5, 16]), mid = rt.fbm(size, seed + 1, [1.2, 3]), blade = rt.fbm(size, seed + 2, [0.5, 1.4], [0.4, 1.6]), fine = rt.fbm(size, seed + 3, [0.18, 0.5]), grn = rt.fbm(size, seed + 4, [6, 14]);
  const dark = [0.33, 0.29, 0.13], base = [0.56, 0.50, 0.26], light = [0.72, 0.65, 0.38], dry = [0.68, 0.53, 0.28], green = [0.40, 0.45, 0.19];
  return paint(size, i => {
    const t = clamp(0.5 + 0.25 * big[i] + 0.15 * mid[i]);
    let c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2);
    if (big[i] > 1.2) c = mix(c, dry, clamp((big[i] - 1.2) * 0.8));
    if (grn[i] > 1.05) c = mix(c, green, clamp((grn[i] - 1.05) * 0.9));
    const f = 1 + 0.12 * blade[i] + 0.16 * fine[i]; return [c[0] * f, c[1] * f, c[2] * f];
  });
}
function texSand(size, seed) {   // piasek: jasny, zszarzały beż z drobnym ziarnem i słabymi zmarszczkami, bez pomarańczu ochry
  const big = rt.fbm(size, seed, [4, 12]), mid = rt.fbm(size, seed + 1, [1.5, 4]), fine = rt.fbm(size, seed + 2, [0.2, 0.55]), rip = rt.fbm(size, seed + 3, [1.5, 4], [0.5, 3]);
  const dark = [0.52, 0.42, 0.26], base = [0.72, 0.62, 0.42], light = [0.84, 0.76, 0.56];
  return paint(size, i => {
    const t = clamp(0.5 + 0.25 * big[i] + 0.12 * mid[i] + 0.06 * Math.abs(rip[i]));
    const c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2), f = 1 + 0.12 * fine[i];
    return [c[0] * f, c[1] * f, c[2] * f];
  });
}
// wierzch klifu (mesa): jasny spękany piaskowiec; sieć ciemnych szczelin z przecięć szumu, plamy i drobne ziarno. pal = [ciemny, bazowy, jasny]
function texCliffTop(size, seed, pal) {
  const big = rt.fbm(size, seed, [4, 12]), fine = rt.fbm(size, seed + 1, [0.25, 0.7]), c1 = rt.fbm(size, seed + 2, [2, 6]), c2 = rt.fbm(size, seed + 3, [2, 6]);
  return paint(size, i => {
    const t = clamp(0.55 + 0.12 * big[i] + 0.1 * fine[i]);
    let c = t < 0.5 ? mix(pal[0], pal[1], t * 2) : mix(pal[1], pal[2], (t - 0.5) * 2);
    const crack = Math.min(Math.abs(c1[i]), Math.abs(c2[i]));
    if (crack < 0.07) c = mix(c, [pal[0][0] * 0.5, pal[0][1] * 0.5, pal[0][2] * 0.5], 0.85 * (1 - crack / 0.07));
    return c;
  });
}
// ściana klifu: pionowe żłobienia od erozji (szum próbkowany wolno wzdłuż pionu), poziome półki, kruszejąca jasna krawędź u góry i ciemniejsza podstawa
function texCliffFace(size, seed, pal) {
  const flute = rt.fbm(size, seed, [0.5, 1.6]), big = rt.fbm(size, seed + 1, [3, 9]), crk = rt.fbm(size, seed + 2, [0.6, 2]), warp = rt.fbm(size, seed + 3, [4, 12]);
  return paint(size, i => {
    const x = i % size, y = Math.floor(i / size), v = flute[Math.floor(y * 0.08) * size + x], yy = y / size;
    const ledge = Math.pow(Math.max(0, Math.sin(yy * 6.283 * 4 + warp[i] * 0.5)), 6);          // jaśniejsze półki
    const t = clamp(0.38 + 0.3 * v + 0.12 * big[i] + 0.28 * ledge - 0.3 * Math.pow(yy, 3));
    let c = t < 0.5 ? mix(pal[0], pal[1], t * 2) : mix(pal[1], pal[2], (t - 0.5) * 2);
    if (Math.abs(crk[Math.floor(y * 0.15) * size + x]) < 0.04) c = mix(c, [pal[0][0] * 0.5, pal[0][1] * 0.5, pal[0][2] * 0.5], 0.7);   // pionowe szczeliny
    return c;
  });
}
function texMeadow(size, seed) {   // łąka: żywa, ciemniejsza zieleń z jaśniejszymi plamami i drobnym szumem źdźbeł
  const big = rt.fbm(size, seed, [5, 14]), mid = rt.fbm(size, seed + 1, [1.2, 3]), fine = rt.fbm(size, seed + 2, [0.18, 0.5]);
  const dark = [0.14, 0.27, 0.08], base = [0.27, 0.45, 0.14], light = [0.46, 0.62, 0.24];
  return paint(size, i => { const t = clamp(0.5 + 0.25 * big[i] + 0.15 * mid[i]); const c = t < 0.5 ? mix(dark, base, t * 2) : mix(base, light, (t - 0.5) * 2), f = 1 + 0.14 * fine[i]; return [c[0] * f, c[1] * f, c[2] * f]; });
}
function texGravel(size, seed) {   // żwirowisko: szarobeżowe kamyki w drobnej plamistej fakturze
  const big = rt.fbm(size, seed, [3, 9]), fine = rt.fbm(size, seed + 1, [0.25, 0.7]), spk = rt.fbm(size, seed + 2, [0.12, 0.35]);
  return paint(size, i => {
    const t = clamp(0.5 + 0.2 * big[i] + 0.35 * fine[i]);
    let c = mix([0.34, 0.31, 0.25], [0.66, 0.61, 0.50], t);
    if (spk[i] > 0.55) c = mix(c, [0.78, 0.74, 0.64], 0.5); else if (spk[i] < -0.55) c = mix(c, [0.20, 0.18, 0.15], 0.6);
    return c;
  });
}
function texWater(size, seed) {   // woda: ciemna zieleń-błękit z jaśniejszymi smugami fal
  const big = rt.fbm(size, seed, [3, 8]), rip = rt.fbm(size, seed + 1, [0.4, 1.4], [0.4, 3.0]);
  return paint(size, i => {
    const t = clamp(0.5 + 0.2 * big[i] + 0.3 * rip[i]);
    let c = mix([0.13, 0.28, 0.32], [0.30, 0.50, 0.52], t);
    if (rip[i] > 0.7) c = mix(c, [0.62, 0.78, 0.76], clamp((rip[i] - 0.7) * 1.2));
    return c;
  });
}
function texAutumnLeaf(size, seed) {
  const n = rt.fbm(size, seed, [1.0, 2.5]), m = rt.fbm(size, seed + 1, [0.6, 1.5]);
  const pal = [[0.55, 0.26, 0.08], [0.72, 0.38, 0.11], [0.84, 0.52, 0.15], [0.46, 0.22, 0.08]];
  return paint(size, i => { const k = clamp(0.5 + 0.35 * n[i] + 0.25 * m[i]); const f = k * (pal.length - 1), a = Math.floor(f); return mix(pal[a], pal[Math.min(pal.length - 1, a + 1)], f - a); });
}
function texRustNeedle(size, seed) {
  const n = rt.fbm(size, seed, [1.0, 2.5]), m = rt.fbm(size, seed + 1, [0.5, 1.2]);
  return paint(size, i => { const t = clamp(0.5 + 0.3 * n[i] + 0.2 * m[i]); const c = mix(mix([0.36, 0.30, 0.10], [0.52, 0.40, 0.15], t), [0.66, 0.38, 0.13], clamp((m[i] - 0.3) * 0.9)); return [c[0] * 1.4, c[1] * 1.35, c[2] * 1.1]; });   // jaśniejsze i cieplejsze: ciemna tekstura łapała szary odcień nieba
}
function texHide(size, seed) {
  const n = rt.fbm(size, seed, [3, 9]), s = rt.fbm(size, seed + 1, [0.8, 3], [0.6, 5]);
  return paint(size, i => { const f = 1 + 0.07 * n[i] + 0.04 * s[i]; return [0.86 * f, 0.77 * f, 0.58 * f]; });
}
function texPattern(size, seed) {
  const n = rt.fbm(size, seed, [1, 3]);
  return paint(size, i => { const stripe = ((i % size) / size * 8) % 1 < 0.5 ? 1 : 0.8; const f = (1 + 0.1 * n[i]) * stripe; return [0.55 * f, 0.22 * f, 0.14 * f]; });
}
function texWhite(size, seed) { const n = rt.fbm(size, seed, [2, 6]), f = rt.fbm(size, seed + 1, [0.7, 1.8]); return paint(size, i => { const k = 1 + 0.025 * n[i] + 0.02 * f[i]; return [0.90 * k, 0.86 * k, 0.77 * k]; }); }
function texGold(size, seed) { const n = rt.fbm(size, seed, [1.5, 4]); return paint(size, i => { const k = 1 + 0.18 * n[i]; return [0.92 * k, 0.70 * k, 0.12 * k]; }); }
const T = rt.standardTextures();
const TX = {
  cliffTopArid: texCliffTop(1024, 81, [[0.70, 0.48, 0.24], [0.94, 0.76, 0.44], [1.0, 0.90, 0.60]]), cliffTopPrairie: texCliffTop(1024, 82, [[0.66, 0.53, 0.32], [0.90, 0.78, 0.52], [1.0, 0.92, 0.70]]), cliffTopGrass: texCliffTop(1024, 83, [[0.56, 0.52, 0.42], [0.78, 0.74, 0.62], [0.92, 0.88, 0.76]]),
  cliffFaceArid: texCliffFace(256, 84, [[0.26, 0.13, 0.06], [0.60, 0.34, 0.18], [0.84, 0.56, 0.32]]), cliffFacePrairie: texCliffFace(256, 85, [[0.28, 0.20, 0.12], [0.58, 0.45, 0.30], [0.82, 0.70, 0.50]]), cliffFaceGrass: texCliffFace(256, 86, [[0.18, 0.17, 0.14], [0.42, 0.38, 0.31], [0.64, 0.60, 0.50]]),
  grass: texGrass(1024, 31), meadow: texMeadow(1024, 91), sand: texSand(1024, 71), gravel: texGravel(1024, 51), water: texWater(1024, 61), ochre: texOchre(1024, 11), dirt: texOchre(1024, 41, 0.72), olive: texOlive(1024, 21),
  leaf: texAutumnLeaf(256, 5), needle: texRustNeedle(256, 8), hide: texHide(256, 3), pattern: texPattern(256, 4), gold: texGold(128, 2),
  grayPlanks: rt.adjustTexture(T.planks, { saturation: 0.28, brightness: 1.95 }), grayTimber: rt.adjustTexture(T.timber, { saturation: 0.35, brightness: 1.5 }), grayRoof: rt.adjustTexture(T.planks, { saturation: 0.22, brightness: 1.6 }),
  freshPlanks: rt.adjustTexture(T.planks, { saturation: 1.0, brightness: 1.35, contrast: 0.9 }), freshTimber: rt.adjustTexture(T.timber, { saturation: 0.95, brightness: 1.15 }), freshRoof: rt.adjustTexture(T.planks, { saturation: 0.8, brightness: 0.95 }),
  whitePlanks: (() => { const w = texWhite(256, 14), p = rt.adjustTexture(T.planks, { saturation: 0.0, brightness: 1.0 }); return paint(256, i => { const g = (p.data[i * 3] + p.data[i * 3 + 1] + p.data[i * 3 + 2]) / 3; const k = 0.85 + 0.45 * g; return [w.data[i * 3] * k, w.data[i * 3 + 1] * k, w.data[i * 3 + 2] * k]; }); })(),
  bark: rt.adjustTexture(T.bark, { saturation: 0.7, brightness: 0.55 }), plaster: texWhite(256, 9), clay: rt.adjustTexture(T.roof, { saturation: 0.95, brightness: 1.4, contrast: 0.7 }),
};
// style budynków (dok. zrodla.md, pamięć gracza): 'ruin' = szare, zniszczone (Desperado, magazyn USA); 'fresh' = brązowe świeże deski (domy USA); 'white' = deski malowane na biało (główna baza USA)
const STYLE = {
  ruin: { planks: TX.grayPlanks, timber: TX.grayTimber, roof: TX.grayRoof, trim: [0.85, 0.68, 0.12] },
  fresh: { planks: TX.freshPlanks, timber: TX.freshTimber, roof: TX.freshRoof, trim: [0.16, 0.32, 0.62] },
  white: { planks: TX.whitePlanks, timber: TX.freshTimber, roof: TX.freshRoof, trim: [0.16, 0.32, 0.62] },
};
function model(style) {
  const m = rt.standardModel(T);
  const st = STYLE[style];
  if (st) {
    m.material('planks', { texture: st.planks, worldSize: 1.2 }); m.material('timber', { texture: st.timber, worldSize: 1.6 }); m.material('roof', { texture: st.roof, worldSize: 1.5 });
    // wykończenia budynków to stały element stylu, nie kolor właściciela (zrodla.md): materiały 'team*' nadpisane stałymi barwami bez maski drużyny
    m.material('team', { color: st.trim, team: false }); m.material('team_dark', { color: st.trim.map(c => c * 0.8), team: false }); m.material('team_light', { color: st.trim.map(c => Math.min(1, c * 1.2)), team: false });
  }
  m.material('hide', { texture: TX.hide, worldSize: 1.6 }); m.material('pattern', { texture: TX.pattern, worldSize: 1.2 });
  m.material('leaf', { texture: TX.leaf, worldSize: 1.0 }); m.material('needle', { texture: TX.needle, worldSize: 1.0 });
  m.material('bark', { texture: TX.bark, worldSize: 1.2 }); m.material('foliage_core', { color: [0.30, 0.20, 0.08] });   // domyślny rdzeń korony przebijał zielono-niebieski
  m.material('plaster', { texture: TX.plaster, worldSize: 2.4 }); m.material('gold', { texture: TX.gold, worldSize: 0.6 });
  return m;
}
const cam = (half, target, scale = 1) => new rt.Camera({ tilePx: TILE * scale, halfExtent: half, target });

// ---------- zapis zasobów i manifest
const entries = {};
function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function writePng(rel, image) { const f = path.join(ASSETS, rel); ensureDir(path.dirname(f)); fs.writeFileSync(f, rt.encodePng(image)); return 'assets/' + rel.replace(/\\/g, '/'); }
// statyczny sprite (wynik renderSprite): sprite + cień jako osobne PNG, kotwica = rzut (0,0,0) w pikselach zasobu
// ramka przycinająca do niezerowej alfy (px zasobu): miniatury w interfejsie nie mogą czytać pikseli (canvas z file:// jest "tainted"), więc ramka idzie w manifeście
function bbox(images) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (const im of images) for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) if (im.data[(y * im.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? [0, 0, 1, 1] : [x0, y0, x1 + 1, y1 + 1];
}
function saveStatic(key, res, group) {
  if (res.frameClipped) console.warn('UWAGA: kadr uciął', key);
  if (res.shadow.width !== res.sprite.width || res.shadow.height !== res.sprite.height) console.warn("UWAGA: cień ma inny rozmiar niż sprite", key);
  const w = res.sprite.width, h = res.sprite.height;
  entries[key] = { file: writePng(group + '/' + key + '.png', res.sprite), shadow: writePng(group + '/' + key + '_shadow.png', res.shadow), w, h, ax: Math.round(res.anchor[0]), ay: Math.round(res.anchor[1]), bb: bbox([res.sprite]) };
  return entries[key];
}
// arkusz klatek (jednostki): kierunki (wiersze) × fazy (kolumny). Kolor drużyny wypieczony w osobnych arkuszach (_p gracz, _e wróg):
// przebarwianie w grze wymagałoby odczytu pikseli, a canvas z obrazem z file:// jest w Chromium "tainted"
const TEAM_COLORS = { p: [0.12, 0.30, 0.78], e: [0.75, 0.15, 0.12] };
function saveSheet(key, frames, group, opts) {
  const packer = opts.packer || pt, sheet = packer.packSheet(frames, { columns: opts.columns, padding: 1 });
  const m = sheet.meta, fw = m.frame_size[0], fh = m.frame_size[1];
  // packSheet przycina klatki do wspólnego kadru: ramka z oryginalnych współrzędnych klatki przesuwa się o różnicę kotwic
  const off = [frames[0].anchor[0] - m.anchor[0], frames[0].anchor[1] - m.anchor[1]], bb0 = bbox(frames.map(f => f.sprite));
  const e = { bb: [Math.max(0, Math.round(bb0[0] - off[0])), Math.max(0, Math.round(bb0[1] - off[1])), Math.min(fw, Math.round(bb0[2] - off[0])), Math.min(fh, Math.round(bb0[3] - off[1]))], shadow: writePng(group + '/' + key + '_shadow.png', sheet.shadow), fw, fh, cols: opts.columns, rows: Math.ceil(frames.length / opts.columns), pad: m.padding || 1, ax: Math.round(m.anchor[0]), ay: Math.round(m.anchor[1]), dirs: opts.dirs, phases: opts.phases };
  if (opts.team) { for (const t of ['p', 'e']) e['file_' + t] = writePng(group + '/' + key + '_' + t + '.png', packer.swapTeamColor(sheet.rgba, sheet.team, TEAM_COLORS[t])); }
  else e.file = writePng(group + '/' + key + '.png', sheet.rgba);
  entries[key] = e;
  return e;
}
function writeManifest(extra) {
  const file = path.join(ASSETS, 'manifest.json');
  let all = {}; try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* pierwszy przebieg */ }
  Object.assign(all, entries, extra || {});
  ensureDir(ASSETS);
  fs.writeFileSync(file, JSON.stringify(all, null, 1));
  // manifest jako skrypt: fetch/XHR na file:// jest blokowany w Chromium, <script src> działa
  fs.writeFileSync(path.join(ASSETS, 'manifest.js'), '// Wygenerowane przez tools/art/build_assets.js, nie edytować ręcznie.\nwindow.ASSETS = ' + JSON.stringify(all) + ';\n');
  return all;
}
const timer = () => { const t0 = Date.now(); return n => console.log(n, ((Date.now() - t0) / 1000).toFixed(1) + ' s'); };
module.exports = { rt, pt, fs, path, TILE, ROOT, ASSETS, clamp, mix, paint, T, TX, STYLE, model, cam, saveStatic, saveSheet, writeManifest, entries, writePng, timer };
