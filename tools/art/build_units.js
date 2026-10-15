// Jednostki: ludzie i jeźdźcy z painted-rts-sprites (8 kierunków × 4 fazy chodu), zwierzyna z brył prerendera (8 kierunków, poza).
// Kolor drużyny (gracz niebieski, wróg czerwony) wypiekany w osobnych arkuszach.
const L = require('./lib');
const { rt, pt, TILE, TX, model, cam } = L;
const K = TILE / 96, sc = n => Math.round(n * K);
const FH = { width: sc(200), height: sc(170), anchor: [sc(100), sc(135)], supersample: 3, tilePx: TILE };        // pieszy
const FR = { width: sc(300), height: sc(240), anchor: [sc(150), sc(185)], supersample: 3, tilePx: TILE };       // koń, jeździec
const DIRS = pt.directions(8), PH = 4;
const HUMAN = { scale: 0.68 };   // ludzie ok. 1/3 wysokości domu, jak w oryginale
const LOOK = {
  worker:    { kind: 'foot', o: { hat: 'cowboy', hatColor: [0.55, 0.45, 0.30], shirt: [0.70, 0.62, 0.45], pants: [0.30, 0.24, 0.18], weapon: 'pickaxe', team: 'sleeves' } },
  frontiersman:   { kind: 'foot', o: { hat: 'cowboy', hatColor: [0.34, 0.30, 0.26], shirt: [0.46, 0.55, 0.68], pants: [0.30, 0.26, 0.20], weapon: 'pickaxe', team: 'sleeves' } },
  frontierswoman: { kind: 'foot', o: { scale: 0.62, hat: 'cap', hatColor: [0.86, 0.82, 0.74], shirt: [0.80, 0.72, 0.80], pants: [0.46, 0.30, 0.24], weapon: 'none', team: 'sleeves' } },
  szeryf:         { kind: 'foot', o: { scale: 0.74, hat: 'cowboy', hatColor: [0.76, 0.66, 0.46], shirt: [0.82, 0.78, 0.64], pants: [0.18, 0.18, 0.26], weapon: 'rifle', team: 'hat' } },
  piechota:  { kind: 'foot', o: { hat: 'cap', shirt: [0.20, 0.28, 0.50], pants: [0.28, 0.26, 0.30], weapon: 'rifle', team: 'torso' } },
  desperado: { kind: 'foot', o: { hat: 'cowboy', hatColor: [0.20, 0.15, 0.10], shirt: [0.36, 0.26, 0.18], pants: [0.20, 0.18, 0.15], weapon: 'rifle', team: 'sleeves' } },
  bandleader:{ kind: 'foot', o: { scale: 0.74, hat: 'cowboy', hatColor: [0.12, 0.10, 0.08], shirt: [0.16, 0.12, 0.12], pants: [0.18, 0.14, 0.10], weapon: 'rifle', team: 'hat' } },
  squaw:     { kind: 'foot', o: { scale: 0.62, hat: 'none', shirt: [0.74, 0.46, 0.30], pants: [0.70, 0.45, 0.28], skin: [0.62, 0.40, 0.28], weapon: 'none', team: 'sleeves' } },
  wojownik:  { kind: 'foot', o: { hat: 'none', shirt: [0.62, 0.40, 0.27], pants: [0.50, 0.34, 0.22], skin: [0.62, 0.40, 0.28], weapon: 'axe', team: 'torso' } },
  lucznik:   { kind: 'foot', o: { hat: 'none', shirt: [0.62, 0.42, 0.28], pants: [0.45, 0.32, 0.20], skin: [0.62, 0.40, 0.28], weapon: 'bow', team: 'sleeves' } },
  medicine:  { kind: 'foot', o: { hat: 'none', shirt: [0.30, 0.48, 0.38], pants: [0.40, 0.30, 0.20], skin: [0.62, 0.40, 0.28], poncho: [0.30, 0.50, 0.40], weapon: 'none', team: 'torso' } },
  wodz:      { kind: 'foot', o: { scale: 0.74, hat: 'none', shirt: [0.70, 0.48, 0.28], pants: [0.50, 0.34, 0.20], skin: [0.62, 0.40, 0.28], weapon: 'axe', team: 'hat' } },
  jezdiec:   { kind: 'horse', o: { coat: [0.52, 0.34, 0.20], rider: { weapon: 'rifle', hat: 'cap', shirt: [0.20, 0.28, 0.50], team: 'torso' } } },
  konnobanda:{ kind: 'horse', o: { coat: [0.18, 0.14, 0.12], rider: { weapon: 'sword', hat: 'cowboy', hatColor: [0.18, 0.14, 0.10], shirt: [0.36, 0.20, 0.16], team: 'torso' } } },
  horse:     { kind: 'horse', team: false, o: { coat: [0.62, 0.45, 0.28], mane: [0.18, 0.13, 0.10], rider: null } },
};
function sheetOf(key) {
  const look = LOOK[key], frame = look.kind === 'foot' ? FH : FR;
  const frames = pt.renderFrames({ frame, directions: 8, phases: PH, build: (P, dir, phase) => {
    if (look.kind === 'foot') pt.humanoid(P, Object.assign({ yaw: dir.yaw, phase, moving: true }, HUMAN, look.o));
    else pt.horse(P, Object.assign({ yaw: dir.yaw, phase, moving: true, scale: 0.78 }, look.o));
  } });
  return L.saveSheet(key, frames, 'units', { columns: PH, dirs: DIRS.map(d => d.yaw), phases: PH, team: look.team !== false });
}
// zwierzyna: bryły prerendera, 8 kierunków, bez animacji chodu (kołysanie robi silnik)
function quadruped(kind) {
  const m = model(null), bison = kind === 'bizon';
  m.material('fur', { color: bison ? [0.22, 0.14, 0.09] : [0.80, 0.74, 0.66] }); m.material('fur2', { color: bison ? [0.30, 0.20, 0.12] : [0.46, 0.28, 0.18] }); m.material('horn', { color: [0.82, 0.78, 0.66] });
  const L1 = bison ? 0.6 : 0.5;
  m.blob('fur', [0, 0, 0.62], [L1, 0.34, 0.34], { seed: 3, roughness: 0.12, subdivisions: 2 });
  if (bison) { m.blob('fur2', [0.28, 0, 0.92], [0.34, 0.3, 0.26], { seed: 4, roughness: 0.2, subdivisions: 2 }); m.blob('fur2', [0.78, 0, 0.52], [0.28, 0.24, 0.26], { seed: 5, roughness: 0.2, subdivisions: 2 }); }
  else { m.blob('fur2', [-0.1, 0.12, 0.7], [0.22, 0.2, 0.18], { seed: 6, roughness: 0.2, subdivisions: 1 }); m.blob('fur', [0.68, 0, 0.62], [0.22, 0.17, 0.2], { seed: 7, roughness: 0.12, subdivisions: 2 }); }
  const hx = bison ? 0.85 : 0.75;
  for (const s of [-1, 1]) m.cylinder('horn', [hx, s * 0.14, 0.7], [hx + 0.05, s * 0.3, bison ? 0.86 : 0.8], 0.04, 0.012, 8);
  for (const [x, y] of [[0.4, 0.18], [0.4, -0.18], [-0.4, 0.18], [-0.4, -0.18]]) m.cylinder('fur2', [x, y, 0.42], [x, y, 0.02], 0.075, 0.05, 8);
  m.cylinder('fur2', [-L1 + 0.05, 0, 0.7], [-L1 - 0.12, 0, 0.35], 0.04, 0.02, 6);
  return m;
}
// armata Osadników: bryła prerendera (drewniana laweta, żelazna lufa wzdłuż +x), 8 kierunków, pasek koloru drużyny na tarczy
function cannon() {
  const m = model(null);
  for (const sd of [-1, 1]) {
    m.box('timber', [0.0, sd * 0.3, 0.46], [1.15, 0.1, 0.16]);
    rt.wheel(m, [0.05, sd * 0.46, 0.36], { radius: 0.36, thickness: 0.1 });
  }
  m.box('timber', [0.1, 0, 0.5], [0.5, 0.62, 0.1]);
  m.beam('timber', [-0.3, 0, 0.46], [-1.05, 0, 0.1], 0.1, 0.1, [0, 1, 0]);
  m.cylinder('iron', [-0.3, 0, 0.64], [0.95, 0, 0.78], 0.19, 0.13, 14);
  m.cylinder('iron', [0.93, 0, 0.775], [1.02, 0, 0.785], 0.16, 0.16, 14);
  m.box('team', [0.35, 0, 0.9], [0.04, 0.34, 0.3]);
  m.blob('iron', [-0.35, 0, 0.64], [0.15, 0.15, 0.15], { seed: 3, roughness: 0.05, subdivisions: 2 });
  return m;
}
// wóz-travois Sioux (spakowane tepee): dwie żerdzie zbiegające się z przodu (+x), końce wleczone po ziemi z tyłu, na nich rulon skóry ze sterczącymi żerdziami tepee i pasek koloru drużyny
function travois() {
  const m = model(null);
  for (const sd of [-1, 1]) {
    m.beam('timber', [0.95, sd * 0.08, 0.62], [-0.95, sd * 0.5, 0.06], 0.05, 0.05, [0, 1, 0]);
    m.cylinder('timber', [0.55, sd * 0.05, 0.62], [1.0, sd * 0.16, 0.98], 0.028, 0.02, 6);
  }
  m.cylinder('timber', [0.5, 0, 0.64], [1.05, 0, 1.02], 0.028, 0.02, 6);
  for (const x of [-0.55, 0.05]) { const t = (0.95 - x) / 1.9; m.box('timber', [x, 0, 0.62 - t * 0.56 + 0.03], [0.07, 0.16 + 0.84 * t, 0.06]); }
  m.cylinder('hide', [-0.62, 0, 0.5], [0.42, 0, 0.68], 0.24, 0.19, 14);
  m.cylinder('hide', [-0.2, 0, 0.5], [0.02, 0, 0.58], 0.255, 0.25, 14);
  m.box('team', [-0.08, 0, 0.8], [0.06, 0.5, 0.16]);
  return m;
}
function extras(lap) {
  const frames = DIRS.map(d => rt.renderSprite(travois(), cam(2.8, [0, 0, 0.5], 0.6), { groundTexture: TX.ochre, trim: false, viewAngleDeg: d.yaw }));
  L.saveSheet('travois', frames, 'units', { columns: 1, dirs: DIRS.map(d => d.yaw), phases: 1, team: true, packer: rt });
  lap('travois');
}
function animals(lap) {
  const cam2 = () => cam(2.6, [0, 0, 0.55], 0.6);
  {
    const frames = DIRS.map(d => rt.renderSprite(cannon(), cam2(), { groundTexture: TX.ochre, trim: false, viewAngleDeg: d.yaw }));
    L.saveSheet('armata', frames, 'units', { columns: 1, dirs: DIRS.map(d => d.yaw), phases: 1, team: true, packer: rt });
    lap('armata');
  }
  for (const kind of ['bizon', 'bydlo']) {
    const frames = DIRS.map(d => rt.renderSprite(quadruped(kind), cam(2.2, [0, 0, 0.5], 0.62), { groundTexture: TX.ochre, trim: false, viewAngleDeg: d.yaw }));
    L.saveSheet(kind, frames, 'units', { columns: 1, dirs: DIRS.map(d => d.yaw), phases: 1, team: false, packer: rt });
    lap(kind);
  }
}
function all(lap) {
  for (const key of Object.keys(LOOK)) { sheetOf(key); lap(key); }
  animals(lap); extras(lap);
  if (process.env.PREVIEW) preview(process.env.PREVIEW);
}
// podgląd: każda jednostka w 8 kierunkach (faza 0), wiersz na typ; tylko do oceny przez człowieka
function preview(file) {
  const fs = require('fs'), man = L.entries;
  const keys = Object.keys(man).filter(k => man[k].dirs), cell = 120, W = 8 * cell + 20, H = keys.length * cell + 20, img = rt.makeImage(W, H, 4);
  for (let i = 0; i < img.data.length; i += 4) { img.data[i] = 170; img.data[i + 1] = 120; img.data[i + 2] = 50; img.data[i + 3] = 255; }
  // dekoder PNG niedostępny w rdzeniu: podgląd budujemy z ponownego renderu pierwszych klatek (te same funkcje)
  keys.forEach((key, row) => {
    DIRS.forEach((d, col) => {
      const look = LOOK[key]; let res;
      if (look) { const P = pt.sprite(look.kind === 'foot' ? FH : FR); if (look.kind === 'foot') pt.humanoid(P, Object.assign({ yaw: d.yaw, phase: 0, moving: true }, HUMAN, look.o)); else pt.horse(P, Object.assign({ yaw: d.yaw, phase: 0, moving: true, scale: 0.78 }, look.o)); res = P.render(); }
      else if (key === 'travois') res = rt.renderSprite(travois(), cam(2.8, [0, 0, 0.5], 0.6), { groundTexture: TX.ochre, trim: true, viewAngleDeg: d.yaw });
      else if (key === 'armata') res = rt.renderSprite(cannon(), cam(2.6, [0, 0, 0.55], 0.6), { groundTexture: TX.ochre, trim: true, viewAngleDeg: d.yaw });
      else res = rt.renderSprite(quadruped(key), cam(2.2, [0, 0, 0.5], 0.62), { groundTexture: TX.ochre, trim: true, viewAngleDeg: d.yaw });
      const ox = 10 + col * cell + cell / 2 - res.anchor[0], oy = 10 + row * cell + cell * 0.8 - res.anchor[1];
      for (const layer of [res.shadow, res.sprite]) for (let y = 0; y < layer.height; y++) for (let x = 0; x < layer.width; x++) {
        const s = (y * layer.width + x) * 4, a = layer.data[s + 3] / 255; if (!a) continue; const dx = Math.round(ox + x), dy = Math.round(oy + y); if (dx < 0 || dy < 0 || dx >= W || dy >= H) continue;
        const dd = (dy * W + dx) * 4; for (let c = 0; c < 3; c++) img.data[dd + c] = Math.round(layer.data[s + c] * a + img.data[dd + c] * (1 - a));
      }
    });
  });
  fs.writeFileSync(file, rt.encodePng(img));
}
module.exports = { all, extras };
