// G1: próbki grafiki AoE2 w jednej scenie. Budynki i drzewa: rts-prerender-3d (przenośny JS). Jednostki: painted-rts-sprites.
const fs = require('fs'), path = require('path');
const SK = process.env.SKILLS_DIR || '/root/.claude/skills/synced/3f48fc38-d005-456a-896a-d33cbff9e6e1_f8d362e6-5cd9-406f-ad0d-703fa9bc0f31';
const rt = require(SK + '/rts-prerender-3d/scripts/portable/rtcore.js');
const pt = require(SK + '/painted-rts-sprites/scripts/painter.js');
const TILE = +process.env.TILE || 128, K = TILE / 96;
const OUT = process.env.OUT || __dirname;
const T = rt.standardTextures(), grass = T.grass;
const t0 = Date.now(); const lap = n => console.log(n, ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// --- budynki i drzewa (prerender 3D)
const cam = (half, target) => new rt.Camera({ tilePx: TILE, halfExtent: half, target });
function house() {
  const m = rt.standardModel(T), width = 3.0, depth = 2.2, wall = 1.45, hx = width / 2, hy = depth / 2;
  m.box('stone', [0, 0, 0.15], [width + 0.16, depth + 0.16, 0.30]);
  m.box('plaster', [0, 0, 0.30 + (wall - 0.30) / 2], [width, depth, wall - 0.30]);
  rt.halfTimberWall(m, '+x', hy, hx, 0.30, wall); rt.halfTimberWall(m, '-y', hx, hy, 0.30, wall);
  m.box('timber', [hx + 0.03, 0, 0.85], [0.06, 0.74, 1.12]); m.box('planks', [hx + 0.06, 0, 0.82], [0.04, 0.60, 1.04], { uvOffset: [0.1, 0.2] });
  const wx = -0.55, wz = 0.92;
  m.box('timber', [wx, -hy - 0.03, wz], [0.62, 0.06, 0.62]); m.box('glass', [wx, -hy - 0.055, wz], [0.50, 0.03, 0.50]);
  for (const s of [-1, 1]) m.box('team_dark', [wx + s * 0.42, -hy - 0.07, wz], [0.24, 0.05, 0.62]);
  const zr = rt.gableRoof(m, hx, hy, wall - 0.05, 1.15);
  m.box('stone', [-0.8, 0.45, zr + 0.35], [0.42, 0.42, 1.0]); rt.pennant(m, hx + 0.20, 0, zr);
  rt.barrel(m, 1.95, 0.85); rt.crate(m, 1.95, -1.15, { size: 0.5, angle: 0.3 }); rt.bush(m, -1.75, -1.55, { radius: 0.48, seed: 3 });
  return rt.renderSprite(m, cam(4.2, [0, 0, 1.0]), { groundTexture: grass });
}
const oak = seed => { const m = rt.standardModel(T); rt.treeOak(m, 0, 0, { height: 2.5, crown: 1.0, seed }); return rt.renderSprite(m, cam(3.4, [0, 0, 1.5]), { groundTexture: grass }); };
const pine = h => { const m = rt.standardModel(T); rt.treePine(m, 0, 0, { height: h, baseRadius: 0.85 }); return rt.renderSprite(m, cam(3.4, [0, 0, 1.5]), { groundTexture: grass }); };
const H = house(); lap('dom'); const O1 = oak(1), O2 = oak(7), P1 = pine(3.3); lap('drzewa');

// --- jednostki (painted)
const sc = n => Math.round(n * K);
const FR = { width: sc(260), height: sc(210), anchor: [sc(130), sc(160)], supersample: 3, tilePx: TILE };
const FRH = { width: sc(340), height: sc(270), anchor: [sc(170), sc(205)], supersample: 3, tilePx: TILE };
const unit = (yaw, o) => { const P = pt.sprite(FR); pt.humanoid(P, Object.assign({ yaw, phase: 0.15 }, o)); return P.render(); };
const men = [unit(315, { weapon: 'rifle', shirt: [0.2, 0.28, 0.5], pants: [0.25, 0.22, 0.2], hat: 'cowboy', team: 'torso' }),
  unit(270, { weapon: 'pickaxe', shirt: [0.9, 0.88, 0.8], hat: 'sombrero', hatColor: [0.86, 0.80, 0.62], team: 'hat' }),
  unit(0, { weapon: 'rifle', shirt: [0.5, 0.2, 0.15], pants: [0.2, 0.15, 0.12], hat: 'cowboy', team: 'torso' })];
const horse = (() => { const P = pt.sprite(FRH); pt.horse(P, { yaw: 315, rider: { weapon: 'rifle', shirt: [0.4, 0.5, 0.35], team: 'torso' } }); return P.render(); })();
const wild = (() => { const P = pt.sprite(FRH); pt.horse(P, { yaw: 40, coat: [0.6, 0.5, 0.35] }); return P.render(); })();
lap('jednostki');

// --- scena
const c = new rt.Camera({ tilePx: TILE, halfExtent: 3.6 });
const W = Math.round(1100 * K), Hh = Math.round(640 * K), origin = [Math.round(500 * K), Math.round(330 * K)];
const gain = rt.groundGain(c, { groundTexture: grass });
const ground = rt.groundLayer(c, W, Hh, origin, grass, { gain });
const items = [{ res: H, x: 0, y: 0 }, { res: H, x: -1, y: 5.5 }, { res: O1, x: 4.5, y: -3.2 }, { res: O2, x: -4, y: -2.2 }, { res: P1, x: 6, y: 3.5 }, { res: O2, x: 6.8, y: -1.5 },
  { res: men[0], x: 3.6, y: 2.4 }, { res: men[1], x: 4.1, y: 2.9 }, { res: men[2], x: 4.6, y: 2.0 }, { res: horse, x: 2.8, y: 3.8 }, { res: wild, x: 6.6, y: 1.2 }];
const img = rt.composeScene(items, c, W, Hh, origin, ground);
fs.writeFileSync(path.join(OUT, 'spike_scene.png'), rt.encodePng(img));
for (const [n, r] of [['house', H], ['oak', O1], ['pine', P1], ['unit', men[0]], ['horse', horse]]) fs.writeFileSync(path.join(OUT, 'spike_' + n + '.png'), rt.encodePng(r.preview));
lap('scena ' + W + 'x' + Hh);

// wycinek z jednostkami w powiększeniu 2x (najbliższy sąsiad), do oceny sylwetek
{
  const src = img, ch = src.data.length / (src.width * src.height);
  const [sx, sy] = c.project ? [0, 0] : [0, 0];
  const cx0 = Math.round(660 * K), cy0 = Math.round(270 * K), cw = Math.round(420 * K), chh = Math.round(250 * K);
  const out = { width: cw * 2, height: chh * 2, data: new Uint8Array(cw * 2 * chh * 2 * ch), channels: src.channels };
  for (let y = 0; y < chh * 2; y++) for (let x = 0; x < cw * 2; x++) for (let k = 0; k < ch; k++)
    out.data[(y * cw * 2 + x) * ch + k] = src.data[((cy0 + (y >> 1)) * src.width + cx0 + (x >> 1)) * ch + k];
  for (const key of Object.keys(src)) if (!(key in out)) out[key] = src[key];
  out.width = cw * 2; out.height = chh * 2;
  fs.writeFileSync(path.join(OUT, 'spike_units_zoom.png'), rt.encodePng(out));
}
