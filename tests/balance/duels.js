'use strict';
// Pojedynki 1:1 (macierz) i bitwa armii przy równym koszcie. Wyniki opisują MODEL prototypu.
//   node tests/balance/duels.js --n 20 --out docs/balance/duels.json
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1]]]) : a, []));
const VAL = args.val || 'all', SKIP = !!args.skipmatrix, N = +(args.n || 20), FILE = path.resolve(args.file || path.join(__dirname, '..', '..', 'index.html'));
function loadPlaywright() { try { return require('playwright'); } catch (e) { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } }
(async () => {
  const pw = loadPlaywright();
  const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await page.goto('file://' + FILE); await page.waitForTimeout(300);
  const res = await page.evaluate(({ N, VAL, SKIP }) => {
    const UNITS = ['piechota', 'jezdiec', 'desperado', 'bandleader', 'konnobanda', 'wojownik', 'lucznik', 'wodz'];
    function arena(seed) {
      newGame(seed, 'settler'); S.testMode = true; S.menuOpen = false; S.units = []; S.buildings = S.buildings.filter(b => b.fac === 'player');
      for (let x = 8; x < 34; x++) for (let y = 8; y < 34; y++) { S.terrain[idx(x, y)] = T_GRASS; S.amt[idx(x, y)] = 0; }
      S.explored.fill(1);
      addUnit('worker', 'player', 4.5, 36.5); // żywy "obserwator" gracza: bez niego gra ogłasza kapitulację
    }
    function duel(a, b, seed, swap) {
      arena(seed);
      const L = [a, 'player', 18.5, 20.5], R = [b, 'enemy', 24.5, 20.5];
      const [first, second] = swap ? [R, L] : [L, R];
      const ua = addUnit(first[0], first[1], first[2], first[3]), ub = addUnit(second[0], second[1], second[2], second[3]);
      ua.stance = ub.stance = 'aggr';
      for (const [x, y] of [[ua, ub], [ub, ua]]) { x.attackTarget = y; x.ordered = false; x.state = 'attack'; }
      let t = 0; while (t < 90 && S.units.includes(ua) && S.units.includes(ub)) { update(1 / 60); t += 1 / 60; }
      const aliveA = S.units.includes(ua), aliveB = S.units.includes(ub);
      const winnerIsL = swap ? (aliveB && !aliveA ? true : (!aliveB && aliveA ? false : null)) : (aliveA && !aliveB ? true : (!aliveA && aliveB ? false : null));
      return { winL: winnerIsL, t };
    }
    const matrix = {};
    for (const a of UNITS) for (const b of UNITS) {
      if (SKIP || (a >= b && a !== b)) continue;
      let wa = 0, wb = 0, dr = 0; const ts = [];
      for (let i = 0; i < N; i++) { const r = duel(a, b, 100 + i, i % 2 === 1); ts.push(r.t); if (r.winL === true) wa++; else if (r.winL === false) wb++; else dr++; }
      ts.sort((x, y) => x - y);
      matrix[a + ' vs ' + b] = { N, winA: wa, winB: wb, draw: dr, medianTime: +ts[Math.floor(N / 2)].toFixed(1) };
    }
    // bitwa armii: Sioux (łucznicy + wojownicy) kontra Osadnicy (piechota) przy równej wartości zasobów
    // wartość: 'all' = wszystkie zasoby (broń 15 = koszt produkcji, koń 30), 'cheap' = tylko żywność i drewno (bez złota, broni i koni)
    const val = c => VAL === 'cheap' ? (c.food || 0) + (c.wood || 0) : (c.food || 0) + (c.wood || 0) + (c.gold || 0) + (c.guns || 0) * 15 + (c.horses || 0) * 30;
    const budget = 600, armies = {};
    function make(types) { const per = types.map(t => val(CFG.units[t].cost)); const out = []; let spent = 0, i = 0; while (spent + per[i % types.length] <= budget) { out.push(types[i % types.length]); spent += per[i % types.length]; i++; } return out; }
    const compositions = { 'Sioux łucznicy+wojownicy': make(['lucznik', 'wojownik']), 'Sioux sami łucznicy': make(['lucznik']), 'Osadnicy piechota': make(['piechota']), 'Osadnicy piechota+jeźdźcy': make(['piechota', 'jezdiec']) };
    const battles = {};
    function battle(A, B, seed) {
      arena(seed);
      A.forEach((t, i) => { const u = addUnit(t, 'player', 14.5 + (i % 3), 14.5 + Math.floor(i / 3) * 1.2); u.stance = 'aggr'; });
      B.forEach((t, i) => { const u = addUnit(t, 'enemy', 26.5 - (i % 3), 26.5 - Math.floor(i / 3) * 1.2); u.stance = 'aggr'; });
      const mine = S.units.filter(u => u.fac === 'player' && u.type !== 'worker'), theirs = S.units.filter(u => u.fac === 'enemy');
      // obie strony maszerują do środka areny (ścieżki BFS idą po osiach, więc marsz na przeciwny róg mijałby wroga o ok. 11 kafli)
      executeAttackMove({ units: mine, x: 20, y: 20 }); executeAttackMove({ units: theirs, x: 20, y: 20 });
      let t = 0; while (t < 180) { update(1 / 60); t += 1 / 60; const a = S.units.filter(u => u.fac === 'player' && u.type !== 'worker').length, b = S.units.filter(u => u.fac === 'enemy').length; if (!a || !b) break; }
      const a = S.units.filter(u => u.fac === 'player' && u.type !== 'worker').length, b = S.units.filter(u => u.fac === 'enemy').length;
      return { a, b, t };
    }
    const names = Object.keys(compositions);
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const key = names[i] + '  vs  ' + names[j]; let wa = 0, wb = 0, dr = 0; const left = [];
      for (let s = 0; s < N; s++) { const swap = s % 2 === 1; const r = swap ? battle(compositions[names[j]], compositions[names[i]], 300 + s) : battle(compositions[names[i]], compositions[names[j]], 300 + s); const ai = swap ? r.b : r.a, bi = swap ? r.a : r.b; if (ai > 0 && bi === 0) wa++; else if (bi > 0 && ai === 0) wb++; else dr++; left.push(ai - bi); }
      battles[key] = { N, winFirst: wa, winSecond: wb, draw: dr, sizes: [compositions[names[i]].length, compositions[names[j]].length], budget };
    }
    return { matrix, battles, compositions: Object.fromEntries(Object.entries(compositions).map(([k, v]) => [k, v.length + ' jedn.'])) };
  }, { N, VAL, SKIP });
  res.errors = errors; res.note = 'Wyniki modelu (prototyp), nie oryginału. N pojedynków na parę, strony naprzemiennie.';
  if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(res, null, 1)); }
  console.log('Pojedynki 1:1 (wygrane pierwszego / drugiego / remis, mediana czasu):');
  for (const [k, v] of Object.entries(res.matrix)) console.log('  ' + k.padEnd(26), v.winA + '/' + v.winB + '/' + v.draw, v.medianTime + ' s');
  console.log('Bitwy armii przy równym koszcie (' + JSON.stringify(res.compositions) + '):');
  for (const [k, v] of Object.entries(res.battles)) console.log('  ' + k, '->', v.winFirst + '/' + v.winSecond + '/' + v.draw, '(N=' + v.N + ')');
  console.log('błędy strony:', errors.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
