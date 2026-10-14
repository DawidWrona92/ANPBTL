// Generator map potyczki (faza 10): układy ASCII zapisywane do assets/maps.js (window.MAPS_DATA). Mapy są dane, nie kod: ten sam format wczyta później edytor.
// Uruchomienie: node tools/maps/build_maps.js [--preview]   (podgląd ASCII w konsoli i walidacja połączeń)
// Legenda: . teren  # klif  ~ woda  F las  T gęsty las  G złoto  P obóz gracza (lewy górny kafel 3x3)  E obóz wroga  h konie  b bizony  c bydło
// Osie: x rośnie w prawo-dół ekranu, y w lewo-dół; wiersz = y, kolumna = x. Gracz zwykle u dołu ekranu (duże x i y), wróg u góry (małe x i y).
const fs = require('fs'), path = require('path');

function rngOf(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

class Grid {
  constructor(n, seed) { this.n = n; this.r = rngOf(seed); this.g = Array.from({ length: n }, () => Array(n).fill('.')); this.keep = Array.from({ length: n }, () => Array(n).fill(false)); }
  in(x, y) { return x >= 0 && y >= 0 && x < this.n && y < this.n; }
  set(x, y, c, force) { if (this.in(x, y) && (force || !this.keep[y][x])) this.g[y][x] = c; }
  get(x, y) { return this.in(x, y) ? this.g[y][x] : '#'; }
  rect(x0, y0, x1, y1, c, force) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c, force); }
  where(fn, c, force) { for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) if (fn(x, y)) this.set(x, y, c, force); }
  disc(cx, cy, rad, c, force) { this.where((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad, c, force); }
  // nieregularna bryła klifu/lasu: kula z poszarpanym brzegiem
  blob(cx, cy, rad, c, force) { this.where((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= (rad * (0.75 + 0.5 * this.r())) ** 2, c, force); }
  clearZone(cx, cy, rad) { this.where((x, y) => Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= rad, '.', true); for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (this.in(x, y)) this.keep[y][x] = true; }
  forestClusters(count, minDist, avoid) {
    for (let k = 0; k < count; k++) {
      let cx, cy, tries = 0;
      do { cx = 2 + Math.floor(this.r() * (this.n - 4)); cy = 2 + Math.floor(this.r() * (this.n - 4)); tries++; } while (tries < 40 && (avoid(cx, cy) || this.get(cx, cy) !== '.'));
      if (tries >= 40) continue;
      const n = 12 + Math.floor(this.r() * 14);
      for (let i = 0; i < n; i++) { const x = cx + Math.floor(this.r() * 7 - 3), y = cy + Math.floor(this.r() * 7 - 3); if (this.get(x, y) === '.' && !avoid(x, y)) this.set(x, y, 'F'); }
    }
  }
  reserve(fn) { for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) if (fn(x, y)) this.keep[y][x] = true; }
  vein(x, y) { for (let i = 0; i < 4; i++) this.set(x + (i % 2), y + (i >> 1), 'G', true); }
  base(tx, ty, ch) { this.set(tx, ty, ch, true); }
  rows() { return this.g.map(r => r.join('')); }
}

// --- walidacja: BFS po polach nie-klifowych, nie-wodnych i nie-lasu (piechota Osadników); woda dla pływaków osobno
function reach(rows, from, canWater) {
  const n = rows.length, seen = new Uint8Array(n * n), q = [from[1] * n + from[0]]; seen[q[0]] = 1;
  const free = (x, y) => x >= 0 && y >= 0 && x < n && y < n && !'#FG'.includes(rows[y][x]) && (canWater || rows[y][x] !== '~');
  let h = 0, dist = new Int32Array(n * n).fill(-1); dist[q[0]] = 0;
  while (h < q.length) { const c = q[h++], x = c % n, y = (c - x) / n; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (free(nx, ny) && !seen[ny * n + nx]) { seen[ny * n + nx] = 1; dist[ny * n + nx] = dist[c] + 1; q.push(ny * n + nx); } } }
  return dist;
}
function find(rows, ch) { for (let y = 0; y < rows.length; y++) { const x = rows[y].indexOf(ch); if (x >= 0) return [x, y]; } return null; }

const MAPS = {};
function finish(id, name, desc, g, extra) {
  const rows = g.rows(), p = find(rows, 'P'), e = find(rows, 'E');
  const start = [p[0] + 1, p[1] + 1], goal = [e[0] + 1, e[1] + 1];
  const dFoot = reach(rows, start, false), dSwim = reach(rows, start, true);
  const d1 = dFoot[goal[1] * g.n + goal[0]], d2 = dSwim[goal[1] * g.n + goal[0]];
  if (d1 < 0) throw new Error(id + ': brak przejścia dla piechoty');
  console.log(id, 'rozmiar', g.n, 'droga piechoty', d1, 'droga pływaka', d2);
  MAPS[id] = Object.assign({ id, name, desc, size: g.n, rows, p, e }, extra || {});
}

// ---------- 2. KANION DWÓCH PRZEJŚĆ (40): ukośny mur klifów z wąską przełęczą pośrodku i otwartym obejściem przy prawym rogu
{
  const g = new Grid(40, 2201);
  const P = [33, 33], E = [2, 2];
  g.clearZone(P[0] + 1, P[1] + 1, 5); g.clearZone(E[0] + 1, E[1] + 1, 5);
  // mur: 3 kafle grubości, w środku 5 (tunel o długości ok. 5); obejście: brak muru od x=31 w stronę rogu
  g.where((x, y) => x <= 36 && x + y >= 38 && x + y <= 40, '#');
  g.where((x, y) => Math.abs(x - 19.5) <= 5 && x + y >= 36 && x + y <= 42, '#');
  g.where((x, y) => Math.abs(x - y) <= 1 && x + y >= 35 && x + y <= 43, '.', true);   // przełęcz szer. ok. 3
  g.reserve((x, y) => Math.abs(x - y) <= 2 && x + y >= 30 && x + y <= 48);               // nic (las, skały) nie zawęża przełęczy
  g.reserve((x, y) => x >= 36 && x + y >= 36 && x + y <= 42);                            // ani obejścia
  // skały przy obejściu tworzą wąski gardziel po prawej
  g.blob(30, 6, 2.2, '#'); g.blob(27, 4, 1.8, '#'); g.blob(34, 18, 2, '#');
  // wyspy klifowe osłaniają bazy od flank
  g.blob(30, 24, 2.5, '#'); g.blob(9, 16, 2.5, '#'); g.blob(24, 31, 2, '#'); g.blob(14, 8, 2, '#');
  g.vein(22, 22); g.vein(16, 16); g.vein(26, 26); g.vein(8, 10);
  const nearBase = (x, y) => Math.max(Math.abs(x - 34), Math.abs(y - 34)) <= 6 || Math.max(Math.abs(x - 3), Math.abs(y - 3)) <= 6;
  g.forestClusters(11, 4, (x, y) => nearBase(x, y) && false);
  for (let i = 0; i < 10; i++) { const x = 24 + Math.floor(g.r() * 4), y = 28 + Math.floor(g.r() * 7); if (g.get(x, y) === '.') g.set(x, y, 'F'); }   // las przy bazie gracza
  for (let i = 0; i < 10; i++) { const x = 8 + Math.floor(g.r() * 4), y = 3 + Math.floor(g.r() * 6); if (g.get(x, y) === '.') g.set(x, y, 'F'); }    // las przy bazie wroga
  g.where((x, y) => x >= 9 && x <= 11 && y >= 20 && y <= 22, 'T'); g.where((x, y) => x >= 26 && x <= 28 && y >= 5 && y <= 7, 'T');   // gęsty las po obu stronach muru, nie w murze
  g.base(P[0], P[1], 'P'); g.base(E[0], E[1], 'E');
  for (const [x, y, c] of [[28, 22, 'h'], [12, 28, 'h'], [20, 10, 'h'], [32, 12, 'b'], [6, 24, 'b'], [20, 16, 'b'], [27, 31, 'c'], [12, 7, 'c']]) g.set(x, y, c, true);
  finish('canyon', 'Kanion Dwóch Przejść', 'Ukośny mur klifów dzieli mapę. Krótka, wąska przełęcz pośrodku i długie, otwarte obejście przy prawym rogu.', g);
}

// ---------- 3. BRÓD (40): rzeka przez całą mapę z jednym brodem i kanionowym mostem przy lewym rogu; Sioux przepływają wszędzie
{
  const g = new Grid(40, 3301);
  const P = [33, 33], E = [2, 2];
  g.clearZone(P[0] + 1, P[1] + 1, 5); g.clearZone(E[0] + 1, E[1] + 1, 5);
  g.where((x, y) => x + y >= 38 && x + y <= 40 + Math.round(Math.sin(x * 0.7) * 0.8), '~');
  // bród: pas lądu w poprzek rzeki, po obu stronach bród osłaniają klify
  g.where((x, y) => x - y >= 9 && x - y <= 12 && x + y >= 36 && x + y <= 42, '.', true);
  g.blob(27, 17, 2.3, '#'); g.blob(30, 22, 1.8, '#'); g.blob(21, 24, 2, '#'); g.blob(33, 19, 1.6, '#');
  // drugi, wąski bród na zachód od środka: korytarz między dwoma murami klifów
  g.where((x, y) => x - y >= -16 && x - y <= -14 && x + y >= 36 && x + y <= 42, '.', true);
  g.where((x, y) => (x - y === -18 || x - y === -12 || x - y === -19 || x - y === -11) && x + y >= 32 && x + y <= 46, '#');
  g.where((x, y) => x - y >= -17 && x - y <= -13 && x + y >= 32 && x + y <= 46 && g.get(x, y) === '#', '.', true);
  g.reserve((x, y) => x - y >= 8 && x - y <= 13 && x + y >= 32 && x + y <= 46);
  g.reserve((x, y) => x - y >= -17 && x - y <= -13 && x + y >= 32 && x + y <= 46);
  g.vein(26, 26); g.vein(8, 10); g.vein(21, 28); g.vein(15, 12);
  for (let i = 0; i < 12; i++) { const x = 24 + Math.floor(g.r() * 4), y = 28 + Math.floor(g.r() * 7); if (g.get(x, y) === '.') g.set(x, y, 'F'); }
  for (let i = 0; i < 10; i++) { const x = 8 + Math.floor(g.r() * 4), y = 3 + Math.floor(g.r() * 6); if (g.get(x, y) === '.') g.set(x, y, 'F'); }
  g.forestClusters(8, 4, () => false);
  g.where((x, y) => x >= 31 && x <= 33 && y >= 14 && y <= 16, 'T'); g.where((x, y) => x >= 5 && x <= 7 && y >= 24 && y <= 26, 'T');
  g.base(P[0], P[1], 'P'); g.base(E[0], E[1], 'E');
  for (const [x, y, c] of [[28, 30, 'h'], [10, 22, 'h'], [18, 8, 'h'], [34, 10, 'b'], [6, 18, 'b'], [30, 34, 'c'], [14, 6, 'c'], [22, 16, 'b']]) g.set(x, y, c, true);
  finish('ford', 'Bród', 'Rzeka przecina całą mapę. Osadnicy mają szeroki bród pośrodku i wąski kanionowy most przy lewym rogu, a Sioux przepływają wszędzie.', g);
}

// ---------- 4. PŁASKOWYŻ (56): obie bazy na płaskowyżach otoczonych klifami, każda z dwoma zjazdami; w środku niecka ze złotem
{
  const N = 56, g = new Grid(N, 4401);
  const P = [44, 44], E = [9, 9], pc = [P[0] + 1, P[1] + 1], ec = [E[0] + 1, E[1] + 1];
  const ring = (c, gaps) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - c[0], y - c[1]);
      if (d < 8.4 || d > 10.6) continue;
      const a = Math.atan2(y - c[1], x - c[0]);
      if (gaps.some(([ga, w]) => { let da = Math.abs(a - ga); da = Math.min(da, 2 * Math.PI - da); return da * d < w / 2; })) continue;
      g.set(x, y, '#', true);
    }
  };
  // gracz: zjazd frontowy ku środkowi (-3π/4) i tylny ku bocznemu rogowi (3π/4); wróg lustrzanie
  ring(pc, [[-Math.PI * 0.75, 4.6], [Math.PI * 0.75, 3.6]]);
  ring(ec, [[Math.PI * 0.25, 4.6], [-Math.PI * 0.25, 3.6]]);
  // niecka środkowa: mesy i dwa korytarze flankowe z przejściami
  g.blob(22, 33, 3.2, '#'); g.blob(33, 22, 3.2, '#'); g.blob(28, 28, 2.2, '#');
  g.where((x, y) => x + y >= 54 && x + y <= 57 && Math.abs(x - y) >= 14 && Math.abs(x - y) <= 30, '#');
  g.where((x, y) => x + y >= 53 && x + y <= 58 && Math.abs(x - y) >= 21 && Math.abs(x - y) <= 24, '.', true);   // przejścia w murach bocznych
  g.where((x, y) => x + y >= 53 && x + y <= 58 && Math.abs(x - y) <= 4, '.', true);                            // środkowa brama
  g.reserve((x, y) => x + y >= 52 && x + y <= 59 && (Math.abs(x - y) <= 5 || (Math.abs(x - y) >= 20 && Math.abs(x - y) <= 25)));
  g.clearZone(pc[0], pc[1], 6); g.clearZone(ec[0], ec[1], 6);
  // złoto: po jednym polu we wnętrzu każdego płaskowyżu, cztery w niecce i dwa na flankach
  g.vein(40, 49); g.vein(14, 5); g.vein(26, 26); g.vein(29, 24); g.vein(24, 29); g.vein(46, 22); g.vein(8, 32); g.vein(33, 44); g.vein(21, 10);
  const inner = (c, n, rMin, rMax, skip) => { for (let i = 0; i < n; i++) { const a = g.r() * 6.283, d = rMin + g.r() * (rMax - rMin), x = Math.round(c[0] + Math.cos(a) * d), y = Math.round(c[1] + Math.sin(a) * d); if (skip(a) || g.get(x, y) !== '.') continue; g.set(x, y, 'F'); } };
  const away = (ga1, ga2) => a => [ga1, ga2].some(ga => { let da = Math.abs(a - ga); da = Math.min(da, 6.283 - da); return da < 0.7; });
  inner(pc, 90, 6.6, 7.8, away(-Math.PI * 0.75 + 6.283, Math.PI * 0.75)); inner(ec, 90, 6.6, 7.8, away(Math.PI * 0.25, -Math.PI * 0.25 + 6.283));
  g.forestClusters(18, 4, (x, y) => Math.hypot(x - pc[0], y - pc[1]) < 11 || Math.hypot(x - ec[0], y - ec[1]) < 11);
  g.where((x, y) => x >= 14 && x <= 16 && y >= 42 && y <= 44, 'T'); g.where((x, y) => x >= 40 && x <= 42 && y >= 12 && y <= 14, 'T');
  g.base(P[0], P[1], 'P'); g.base(E[0], E[1], 'E');
  for (const [x, y, c] of [[33, 34, 'h'], [22, 22, 'h'], [10, 30, 'h'], [46, 20, 'b'], [20, 46, 'b'], [30, 18, 'b'], [26, 36, 'c'], [36, 28, 'c'], [44, 34, 'c'], [12, 20, 'c']]) g.set(x, y, c, true);
  finish('plateau', 'Płaskowyż', 'Duża mapa 56×56. Bazy na płaskowyżach z dwoma zjazdami każda, w środku niecka ze złotem i stadami, korytarze po flankach.', g);
}

const out = path.join(__dirname, '..', '..', 'assets', 'maps.js');
fs.writeFileSync(out, '// Wygenerowane przez tools/maps/build_maps.js, układy ASCII (legenda w tamtym pliku). Nie edytować ręcznie.\nwindow.MAPS_DATA = ' + JSON.stringify(MAPS, null, 1).replace(/\n\s+"(\.|#|~|F|T|G|P|E|h|b|c)[^"\n]*",?/g, m => m) + ';\n');
if (process.argv.includes('--preview')) for (const id in MAPS) { console.log('\n== ' + id + ' ==\n' + MAPS[id].rows.join('\n')); }
