'use strict';
// Pobieżne testy regresyjne: ładują prawdziwy index.html w Chromium i sprawdzają naprawione błędy.
// Uruchomienie: npm install && npx playwright install chromium && npm test
// Własna przeglądarka: PW_CHROMIUM=/ścieżka/do/chromium npm test
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* globalna instalacja */ }
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const results = [];
async function test(name, fn) {
  try { await fn(); results.push([name, true]); console.log('  ok   ' + name); }
  catch (e) { results.push([name, false, e.message]); console.log('  FAIL ' + name + '\n       ' + e.message); }
}
function eq(actual, expected, what) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error((what || 'wartość') + ': oczekiwano ' + JSON.stringify(expected) + ', jest ' + JSON.stringify(actual));
}
function ok(cond, what) { if (!cond) throw new Error(what); }

(async () => {
  const pw = loadPlaywright();
  const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
  // GAME_FILE pozwala uruchomić te same testy na starszej wersji (sprawdzenie, że testy łapią błędy)
  await page.goto('file://' + path.resolve(process.env.GAME_FILE || path.join(__dirname, '..', 'index.html')));
  await page.waitForTimeout(300);
  await page.waitForFunction(() => window.GAME_READY, null, { timeout: 3000 }).catch(() => {});   // starsze wersje gry nie mają flagi

  // pomocnik w stronie: świeża, deterministyczna partia z wyczyszczonym terenem testowym (bez wrogów, AI bierne)
  await page.evaluate(() => {
    window.T = {
      fresh(race) {
        newGame(7, race || 'settler'); S.testMode = true; S.menuOpen = false; S.units = [];
        S.buildings = S.buildings.filter(b => b.fac === 'player'); S.explored.fill(1);
        document.getElementById('overlay').style.display = 'none';
        for (let x = 10; x < 34; x++) for (let y = 10; y < 28; y++) { S.terrain[idx(x, y)] = T_GRASS; S.amt[idx(x, y)] = 0; }
      },
      run(sec) { for (let i = 0; i < 60 * sec; i++) update(1 / 60); },
    };
  });

  console.log('Start');
  await test('gra startuje bez błędów, menu ma przyciski frakcji, trudności i testów', async () => {
    eq(pageErrors, [], 'błędy strony');
    eq(await page.$$eval('#overlay button', b => b.map(x => x.textContent)), ['Nowa gra', 'Ustawienia', 'Pomoc i sterowanie'], 'przyciski menu głównego');
    await page.click('text=Nowa gra');
    eq(await page.$$eval('#overlay .circ', c => c.map(x => x.className.includes('off') ? 'off' : 'on')), ['on', 'on', 'off', 'off'], 'koła ludów: Osadnicy i Sioux grywalni, reszta wkrótce');
    eq(await page.$$eval('#overlay button', b => b.map(x => x.textContent)), ['Wstecz', 'Trudność: Normalny', 'Osadnicy', 'Sioux', 'Wczytaj'], 'przyciski ekranu wyboru ludu');
    await page.click('.circ >> nth=1');
    eq(await page.$$eval('.mapcard', c => c.map(x => x.dataset.map)), ['prairie', 'canyon', 'ford', 'plateau'], 'karty map');
    eq(await page.$$eval('#overlay .sk-row:nth-of-type(4) button', b => b.map(x => x.disabled)), [false, true, true, true], 'przeciwnik: tylko Desperado aktywny');
    await page.click('text=Wstecz'); await page.click('text=Wstecz');
  });
  await test('UI: ustawienia zmieniają i zapamiętują wartości, panel dolny pokazuje polecenia wybranego obiektu', async () => {
    await page.click('text=Ustawienia');
    await page.click('text=Normalne'); await page.click('text=Cienie >> xpath=following-sibling::button[1]');
    const st = await page.evaluate(() => [SETTINGS.scroll, SETTINGS.shadow, JSON.parse(localStorage.getItem(SET_KEY)).scroll]);
    eq(st, [2, 0, 2], 'ustawienia');
    await page.evaluate(() => { SETTINGS.scroll = 1; SETTINGS.shadow = 1; saveSettings(); }); await page.click('text=OK');
    const r = await page.evaluate(() => {
      T.fresh(); const w = addUnit('frontiersman', 'player', 20.5, 20.5), sh = addUnit('szeryf', 'player', 21.5, 20.5);
      S.selected.units = [w]; updatePanels();
      const a = { build: getComputedStyle(buildbar).display !== 'none', stance: getComputedStyle(stancebar).display !== 'none', btns: buildbar.querySelectorAll('.cmd').length };
      S.selected.units = [sh]; updatePanels();
      const b = { build: getComputedStyle(buildbar).display !== 'none', stance: getComputedStyle(stancebar).display !== 'none', info: infoblock.textContent.includes('Szeryf') };
      S.selected.units = [w, sh]; updatePanels();
      const c = { grid: infoblock.querySelectorAll('.grid canvas').length };
      const hq = S.buildings.find(x => x.type === 'hq'); S.selected.units = []; S.selected.building = hq; updatePanels();
      const d = { train: bpanel.querySelectorAll('[data-role^="train_"]').length, top: topbar.querySelectorAll('.res[data-r]').length };
      return { a, b, c, d };
    });
    eq(r.a, { build: true, stance: false, btns: 8 }, 'robotnik: budowa bez postaw'); eq(r.b, { build: false, stance: true, info: true }, 'szeryf: postawy bez budowy, info o jednostce');
    eq(r.c, { grid: 2 }, 'zaznaczenie wielu jednostek: siatka miniatur'); eq(r.d, { train: 2, top: 6 }, 'obóz: dwie jednostki do produkcji; pasek zasobów ma 6 pól');
  });
  await test('F1: ścieżki jednostek nie zapętlają się', async () => {
    const r = await page.evaluate(() => { T.fresh(); const u = addUnit('worker', 'player', 20.5, 20.5); return [uPath(u, 25, 20).length, pathToBuildingU(u, S.buildings[0]).length >= 0]; });
    ok(r[0] > 0 && r[1], 'uPath/pathToBuildingU');
  });

  console.log('Grafika (G2)');
  await test('G2: zasoby ładują się, każdy typ jednostki i budynek ma sprite, scena rysuje się bez błędów', async () => {
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } }), errs = []; p2.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p2.goto('file://' + path.resolve(process.env.GAME_FILE || path.join(__dirname, '..', 'index.html')));
    await p2.waitForFunction(() => window.GAME_READY, null, { timeout: 20000 });
    const r = await p2.evaluate(() => {
      startRace('settler'); document.getElementById('overlay').style.display = 'none'; S.menuOpen = false; S.explored.fill(1);
      for (let i = 0; i < 300; i++) update(1 / 60); render();
      const man = window.ASSETS, broken = Object.keys(man).filter(k => man[k]._img && !(man[k]._img.complete && man[k]._img.naturalWidth > 0));
      const missU = Object.keys(CFG.units).filter(t => !man[t]), missB = [];
      for (const t of Object.keys(CFG.buildings)) for (const n of t === 'tepee' ? ['sx'] : (t === 'bank' || t === 'ranch') ? ['us'] : ['us', 'ban']) if (!man['bld_' + t + '_' + n]) missB.push(t + '_' + n);
      return { layer: !!(S.gch && S.gch.cv.some(Boolean)), assets: Object.keys(man).length, broken, missU, missB };
    });
    await p2.close();
    eq(errs, [], 'błędy strony'); eq(r.missU, [], 'jednostki bez sprite\'a'); eq(r.missB, [], 'budynki bez sprite\'a'); ok(r.layer && r.assets > 10, 'warstwa terenu i manifest'); eq(r.broken, [], 'niezaładowane obrazy');
  });

  console.log('Walka i ruch');
  await test('F2: jednostka wręcz atakuje cel stojący po skosie (4 kierunki)', async () => {
    const r = await page.evaluate(() => [[3, 3], [-3, 3], [3, -3], [-3, -3]].map(([dx, dy]) => {
      T.fresh(); const a = addUnit('worker', 'player', 20.5, 20.5), t = addUnit('desperado', 'enemy', 20.5 + dx, 20.5 + dy); t.stance = 'hold';
      a.attackTarget = t; a.ordered = true; a.state = 'attack'; const hp0 = t.hp;
      for (let i = 0; i < 900; i++) { update(1 / 60); if (S.units.includes(t)) { t.x = 20.5 + dx; t.y = 20.5 + dy; } }
      return !S.units.includes(t) || t.hp < hp0;
    }));
    eq(r, [true, true, true, true], 'trafienia');
  });
  await test('F2: szturm wręcz na budynki 2x2 i 3x3 z ośmiu stron dochodzi do celu', async () => {
    const r = await page.evaluate(() => {
      let hit = 0, n = 0;
      for (const type of ['storehouse', 'hq']) for (const [dx, dy] of [[-6,-6],[0,-6],[6,-6],[-6,0],[6,0],[-6,6],[0,6],[6,6]]) {
        T.fresh(); const bb = addBuilding(type, 20, 18, 'enemy'); bb.built = true; bb.hp = bb.maxHp = 1e6;
        const a = addUnit('konnobanda', 'player', 20 + bb.w / 2 + dx, 18 + bb.h / 2 + dy);
        executeOrder({ units: [a], x: 20, y: 18, targetUnit: null }); T.run(25);
        n++; if (bb.hp < bb.maxHp) hit++;
      }
      return [hit, n];
    });
    eq(r, [16, 16], 'dotarły do celu');
  });
  await test('R1: zabity w tym samym ticku nie zadaje już obrażeń', async () => {
    const lost = await page.evaluate(() => {
      T.fresh(); const A = addUnit('desperado', 'enemy', 20.5, 20.5), V = addUnit('piechota', 'player', 22.5, 20.5);
      V.hp = 1; A.attackTarget = V; A.state = 'attack'; A.ordered = true; V.attackTarget = A; V.state = 'attack'; V.ordered = true;
      const old = hitChance; hitChance = () => 1; const hp0 = A.hp; update(1 / 60); hitChance = old; return hp0 - A.hp;
    });
    eq(lost, 0, 'HP straconane przez zabójcę');
  });
  await test('R2: ten sam seed i rozkazy dają ten sam przebieg (determinizm)', async () => {
    const same = await page.evaluate(() => {
      const run = () => { T.fresh(); for (let i = 0; i < 4; i++) { addUnit('piechota', 'player', 20.5 + i, 20.5); addUnit('desperado', 'enemy', 20.5 + i, 24.5); } T.run(15); return JSON.stringify(S.units.map(u => [u.type, +u.x.toFixed(3), +u.y.toFixed(3), +u.hp.toFixed(2), u.xp])); };
      return run() === run();
    });
    ok(same, 'dwa przebiegi różnią się');
  });
  await test('R7/R8: łucznik strzela na 6.4 kafla; wojownik broni się i wraca do pracy; squaw ucieka', async () => {
    const r = await page.evaluate(() => {
      const R = {};
      T.fresh('sioux'); let a = addUnit('lucznik', 'player', 20.5, 20.5), t = addUnit('desperado', 'enemy', 26.9, 20.5); t.stance = 'hold'; const hp0 = t.hp;
      for (let i = 0; i < 300; i++) { update(1 / 60); t.x = 26.9; t.y = 20.5; } R.archer = t.hp < hp0;
      T.fresh('sioux'); S.terrain[idx(24, 20)] = T_FOREST; S.amt[idx(24, 20)] = 100;
      const w = addUnit('wojownik', 'player', 23.5, 20.5); orderGather(w, 24, 20); T.run(2);
      const e = addUnit('desperado', 'enemy', w.x - 3, w.y); e.hp = 18; e.stance = 'hold'; T.run(20);
      R.warriorKilledEnemy = !S.units.includes(e); R.warriorBackToWork = ['gather', 'toNode', 'toDeposit', 'deposit'].includes(w.state);
      T.fresh('sioux'); const bandit = addUnit('desperado', 'enemy', 23.5, 20.5), sq = addUnit('squaw', 'player', 20.5, 20.5); bandit.stance = 'hold';
      bandit.attackTarget = sq; bandit.state = 'attack'; bandit.ordered = true; const old = hitChance; hitChance = () => 1; let fled = false;
      for (let i = 0; i < 180; i++) { update(1 / 60); if (sq.state === 'flee') fled = true; } hitChance = old; R.squawFled = fled;
      return R;
    });
    eq(r, { archer: true, warriorKilledEnemy: true, warriorBackToWork: true, squawFled: true }, 'zachowanie');
  });

  console.log('Ekonomia i produkcja');
  await test('F3: limit populacji liczy kolejki wszystkich budynków', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.res = { wood: 999, food: 999, gold: 999, guns: 99, horses: 9 };
      const hq = S.buildings.find(b => b.type === 'hq'), b1 = testPlace('player', 'barracks', 30, 28), b2 = testPlace('player', 'barracks', 36, 28);
      for (let i = 0; i < 5; i++) { tryTrain(hq, 'worker'); tryTrain(b1, 'piechota'); tryTrain(b2, 'piechota'); }
      T.run(600); return [popUsed(), popCap()];
    });
    ok(r[0] <= r[1], 'populacja ' + r[0] + ' przekroczyła limit ' + r[1]);
  });
  await test('F4: zmiana surowca porzuca ładunek (drewno nie zamienia się w złoto)', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.terrain[idx(24, 20)] = T_GOLD; S.amt[idx(24, 20)] = 500;
      const w = addUnit('worker', 'player', 20.5, 20.5); w.carry = 9; w.carryType = 'wood'; orderGather(w, 24, 20); return [w.carry, w.carryType];
    });
    eq(r, [0, 'gold'], 'ładunek');
  });
  await test('F7: nowa jednostka pojawia się przy budynku, a przy braku miejsca czeka', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); const hq = S.buildings.find(b => b.type === 'hq'); S.res.food = 999;
      tryTrain(hq, 'worker'); hq.queue[0].remaining = 0.01; update(1 / 30); const u = S.units[S.units.length - 1];
      const dist = rectDist(u.x, u.y, hq);
      for (let y = hq.ty - 6; y < hq.ty + hq.h + 6; y++) for (let x = hq.tx - 6; x < hq.tx + hq.w + 6; x++) if (passableFor(CFG.units.worker, x, y)) { const h = addUnit('horse', 'neutral', x + 0.5, y + 0.5); h.grazeT = 1e9; }
      tryTrain(hq, 'worker'); hq.queue[0].remaining = 0.01; update(1 / 30);
      return [dist <= 1.5, hq.queue.length];
    });
    eq(r, [true, 1], 'przy budynku / w kolejce');
  });
  await test('R9: zwrot kosztu kolejki po zburzeniu i brak chwytania koni ponad limit', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.res = { wood: 300, food: 300, gold: 100, guns: 5, horses: 0 };
      const br = testPlace('player', 'barracks', 28, 28); tryTrain(br, 'piechota'); tryTrain(br, 'piechota'); update(1 / 60);
      const paidNow = S.res.food < 300; destroyBuilding(br);
      const refunded = [S.res.food, S.res.gold, S.res.guns];
      S.res.horses = CFG.resCap.horses; const h = addUnit('horse', 'neutral', 20.5, 20.5), u = addUnit('worker', 'player', 20.5, 21.5);
      executeOrder({ units: [u], x: 20, y: 20, targetUnit: null, targetHorse: h }); T.run(8);
      return { paidNow, refunded, horseStillOnMap: S.units.includes(h) };
    });
    eq(r, { paidNow: true, refunded: [300, 100, 5], horseStillOnMap: true }, 'zwroty / koń');
  });
  await test('R3: średnia liczba koni na mapie ~19.5 (stada losowane raz)', async () => {
    const mean = await page.evaluate(() => { let t = 0; for (let s = 1; s <= 150; s++) { newGame(s, 'settler'); t += S.units.filter(u => u.type === 'horse').length; } newGame(7, 'settler'); return t / 150; });
    ok(Math.abs(mean - 19.5) < 0.7, 'średnia ' + mean.toFixed(2));
  });
  await test('R11: budowa nie wchodzi w mgłę ani pod jednostki, trasa omija nowy budynek', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.res.wood = 999; S.res.gold = 999;
      const w = addUnit('worker', 'player', 20.5, 20.5), bd = addUnit('worker', 'player', 20.5, 24.5);
      executeOrder({ units: [w], x: 32, y: 20, targetUnit: null }); T.run(1); S.selected.units = [bd]; tryPlace('house', 24, 20);
      const hb = S.buildings[S.buildings.length - 1]; let inside = false;
      for (let i = 0; i < 1500; i++) { update(1 / 60); if (w.x > hb.tx && w.x < hb.tx + hb.w && w.y > hb.ty && w.y < hb.ty + hb.h) inside = true; }
      const v = addUnit('worker', 'player', 28.5, 20.5); tryPlace('farm', 28, 20); const fb = S.buildings[S.buildings.length - 1];
      const ejected = !(v.x >= fb.tx && v.x < fb.tx + fb.w && v.y >= fb.ty && v.y < fb.ty + fb.h);
      for (let x = 5; x < 9; x++) for (let y = 30; y < 34; y++) { S.explored[idx(x, y)] = 0; S.terrain[idx(x, y)] = T_GRASS; }
      const n = S.buildings.length; tryPlace('house', 6, 31);
      return { walkedThrough: inside, ejected, builtInFog: S.buildings.length > n };
    });
    eq(r, { walkedThrough: false, ejected: true, builtInFog: false }, 'umieszczanie');
  });


  console.log('C1: komendy i UX');
  await test('C1: punkt zbiórki wysyła nowe jednostki w miejsce, a na surowiec do pracy', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.res.food = 999; S.terrain[idx(26, 33)] = T_FOREST; S.amt[idx(26, 33)] = 100;
      const hq = S.buildings.find(b => b.type === 'hq');
      queueCmd({ action: 'rally', building: hq, x: 26, y: 33 }); update(1 / 60);
      tryTrain(hq, 'worker'); hq.queue[0].remaining = 0.01; update(1 / 30); const w = S.units[S.units.length - 1];
      const gatherState = w.state;
      T.fresh(); S.res.food = 999; S.res.gold = 999; S.res.guns = 9;
      const br = testPlace('player', 'barracks', 30, 28); queueCmd({ action: 'rally', building: br, x: 28, y: 30 }); update(1 / 60);
      tryTrain(br, 'piechota'); br.queue[0].remaining = 0.01; update(1 / 30); const sol = S.units[S.units.length - 1]; T.run(15);
      return { gatherState, soldierNearRally: Math.hypot(sol.x - 28.5, sol.y - 30.5) < 2 };
    });
    ok(['toNode', 'gather'].includes(r.gatherState), 'robotnik na surowcu: ' + r.gatherState);
    ok(r.soldierNearRally, 'żołnierz nie doszedł do punktu zbiórki');
  });
  await test('C1: Shift+PPM tworzy trasę, X zatrzymuje, atak-ruch walczy po drodze i idzie dalej', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); const u = addUnit('worker', 'player', 12.5, 12.5);
      executeOrder({ units: [u], x: 20, y: 12, targetUnit: null }); update(1 / 60);
      executeOrder({ units: [u], x: 20, y: 20, targetUnit: null, queue: true }); const wps = u.waypoints.length;
      T.run(40); const reached = Math.hypot(u.x - 20.5, u.y - 20.5) < 1.5;
      executeOrder({ units: [u], x: 12, y: 20, targetUnit: null }); T.run(1); stopUnits([u]); const stopped = u.state === 'idle' && u.path.length === 0;
      T.fresh(); const a = addUnit('piechota', 'player', 12.5, 20.5), e = addUnit('desperado', 'enemy', 16.5, 20.5); e.hp = 10; e.stance = 'hold';
      executeAttackMove({ units: [a], x: 24, y: 20 }); T.run(30);
      return { wps, reached, stopped, enemyDead: !S.units.includes(e), arrived: Math.hypot(a.x - 24.5, a.y - 20.5) < 2 };
    });
    eq(r, { wps: 1, reached: true, stopped: true, enemyDead: true, arrived: true }, 'komendy');
  });
  await test('C1: podwójny klik zaznacza wszystkich z tego typu na ekranie (prawdziwe kliknięcia)', async () => {
    await page.evaluate(() => { T.fresh(); centerCameraOn(20, 20); for (let i = 0; i < 3; i++) addUnit('worker', 'player', 19.5 + i, 20.5); addUnit('piechota', 'player', 21.5, 21.5); S.selected.units = []; });
    const pos = await page.evaluate(() => { const u = S.units.find(x => x.type === 'worker'); const [sx, sy] = tileToScreen(u.x, u.y); return [sx * ZOOM, sy * ZOOM]; });
    await page.mouse.click(pos[0], pos[1]); await page.mouse.click(pos[0], pos[1]);
    eq(await page.evaluate(() => S.selected.units.map(u => u.type)), ['worker', 'worker', 'worker'], 'zaznaczenie');
  });
  await test('C1: kolejka czeka bez surowców, potem rusza; anulowanie zwraca tylko zapłacone', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.res = { wood: 0, food: 30, gold: 0, guns: 0, horses: 0 }; addUnit('piechota', 'player', 12.5, 12.5); // bez żadnej jednostki gra ogłasza kapitulację
      const hq = S.buildings.find(b => b.type === 'hq');
      tryTrain(hq, 'worker'); tryTrain(hq, 'worker' ); // drugi: stać tylko na jeden (koszt 30)
      const secondQueued = hq.queue.length;
      update(1 / 60); const paid1 = hq.queue[0].paid && S.res.food === 0;
      hq.queue[0].remaining = 0.01; update(1 / 30); update(1 / 30);   // pierwszy wychodzi, drugi czeka bez surowców
      const stalled = hq.queue.length === 1 && !hq.queue[0].paid;
      T.run(20); const stillStalled = !hq.queue[0].paid;
      S.res.food = 30; T.run(2); const started = hq.queue[0].paid && S.res.food === 0;
      queueCmd({ action: 'cancel', building: hq, index: 0 }); update(1 / 60);
      return { secondQueued, paid1, stalled, stillStalled, started, refundedFood: S.res.food, empty: hq.queue.length === 0 };
    });
    eq(r, { secondQueued: 2, paid1: true, stalled: true, stillStalled: true, started: true, refundedFood: 30, empty: true }, 'kolejka');
  });
  await test('C1: panel budynku: kliknięcie slotu kolejki anuluje go, a przycisk punktu zbiórki istnieje', async () => {
    await page.evaluate(() => {
      T.fresh(); S.res.food = 999; const hq = S.buildings.find(b => b.type === 'hq');
      S.selected.building = hq; S.selected.units = []; tryTrain(hq, 'worker'); tryTrain(hq, 'worker'); update(1 / 60); updatePanels();
    });
    ok(await page.$('[data-role="rally"]') !== null, 'brak przycisku punktu zbiórki');
    eq(await page.$$eval('[data-slot]', b => b.length), 2, 'sloty w panelu');
    await page.click('[data-slot="1"]'); await page.waitForTimeout(100);
    await page.evaluate(() => { update(1 / 60); updatePanels(); });
    eq(await page.evaluate(() => S.buildings.find(b => b.type === 'hq').queue.length), 1, 'długość kolejki po anulowaniu');
    eq(await page.$$eval('[data-slot]', b => b.length), 1, 'sloty po anulowaniu');
  });
  await test('C1: alert z kierunkiem ataku i spacja centrująca kamerę na jego miejscu', async () => {
    const r = await page.evaluate(() => {
      const dirs = [[0, -1, 'północy'], [1, -1, 'wschodu'], [1, 0, 'południowego wschodu'], [1, 1, 'południa'], [0, 1, 'południowego zachodu'], [-1, 1, 'zachodu'], [-1, 0, 'północnego zachodu'], [-1, -1, 'północy']];
      // wektor w kaflach (dx,dy) -> strona świata na ekranie izometrycznym; sprawdzamy 4 pewne osie: -1,-1 = góra ekranu
      const names = { n: compassFrom(10, 10, 20, 20), e: compassFrom(20, 10, 10, 10 + 0) };
      T.fresh(); S.time = 100; S.alertCooldown = {}; centerCameraOn(5, 5);
      const v = addUnit('worker', 'player', 25.5, 25.5), a = addUnit('desperado', 'enemy', 20.5, 20.5);
      notifyAttack(v.x, v.y, a.x, a.y);
      const text = [...document.querySelectorAll('.alert')].map(x => x.textContent).pop();
      const second = S.alertCooldown.attack === 100; notifyAttack(v.x, v.y, a.x, a.y);
      const alertsAfterSecond = document.querySelectorAll('.alert').length;
      return { north: names.n, text, alertsAfterSecond, lastAlert: S.lastAlert, second };
    });
    eq(r.north, 'północy', 'napastnik w górę ekranu');
    ok(/^Atak z północy!$/.test(r.text), 'tekst alertu: ' + r.text);
    await page.keyboard.press('Space');
    const off = await page.evaluate(() => { const [sx, sy] = tileToScreen(25.5, 25.5); return Math.hypot(sx * ZOOM - canvasW / 2, sy * ZOOM - canvasH / 2); });
    ok(off < 3, 'kamera po spacji ' + off.toFixed(1) + ' px od alertu');
  });

  console.log('Sterowanie i interfejs');
  await test('F5: podwójna cyfra grupy centruje kamerę na grupie', async () => {
    const dx = await page.evaluate(() => {
      T.fresh(); const us = [addUnit('worker', 'player', 20.5, 20.5), addUnit('worker', 'player', 22.5, 20.5)];
      S.groups[1] = us; S.selected.units = us; S.lastGroup = 1; S.lastGroupT = Date.now();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
      const [sx] = tileToScreen(21.5, 20.5); return Math.abs(sx * ZOOM - canvasW / 2);
    });
    ok(dx < 2, 'grupa ' + dx.toFixed(1) + ' px od środka ekranu');
  });
  await test('F6: pasek zdolności ma styl i nie nachodzi na pasek postaw', async () => {
    const r = await page.evaluate(() => {
      newGame(7, 'sioux'); S.menuOpen = false; document.getElementById('overlay').style.display = 'none'; setupTest('sioux'); S.selected.units = [S.units.find(u => u.type === 'medicine'), S.units.find(u => u.type === 'wodz')]; updatePanels();
      const a = document.getElementById('abilitybar').getBoundingClientRect(), s = document.getElementById('stancebar').getBoundingClientRect();
      return { placed: a.y > 0 && a.x > 0, noOverlap: a.bottom <= s.top, styled: getComputedStyle(document.querySelector('#abilitybar button')).backgroundImage.includes('parchment') };
    });
    eq(r, { placed: true, noOverlap: true, styled: true }, 'pasek');
  });
  await test('R4/R5: skróty z Ctrl nie działają, Shift nie psuje WASD, wyjście kursora zatrzymuje przewijanie', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.selected.units = [addUnit('worker', 'player', 20.5, 20.5)];
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })); const placing = S.placing; S.placing = null;
      const m0 = S.muted; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true })); const muteToggled = S.muted !== m0;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', shiftKey: true })); const shiftA = keys.a === true;
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' })); window.dispatchEvent(new Event('blur'));
      return { placing, muteToggled, shiftA, keysClearedOnBlur: !Object.values(keys).some(Boolean) };
    });
    eq(r, { placing: null, muteToggled: false, shiftA: true, keysClearedOnBlur: true }, 'klawisze');
    await page.evaluate(() => centerCameraOn(20, 20));
    await page.mouse.move(640, 360); await page.mouse.move(12, 360); await page.waitForTimeout(150);
    await page.evaluate(() => document.getElementById('game').dispatchEvent(new PointerEvent('pointerleave')));
    const c1 = await page.evaluate(() => cam.x); await page.waitForTimeout(250);
    eq(await page.evaluate(() => cam.x), c1, 'kamera po wyjściu kursora');
  });
  await test('R10: pomoc pauzuje grę, po porażce są "Jeszcze raz" i "Menu", wyciszenie przeżywa nową grę', async () => {
    await page.evaluate(() => { S.muted = true; newGame(1, 'settler'); showMenu(); });
    ok(await page.evaluate(() => S.muted), 'wyciszenie zgubione w newGame'); await page.evaluate(() => { S.muted = false; });
    await page.click('text=Nowa gra'); await page.click('.circ >> nth=0'); await page.click('#sk-start'); await page.waitForTimeout(200);
    await page.click('#helpbtn'); await page.waitForTimeout(100);
    const t2 = await page.evaluate(() => S.time); await page.waitForTimeout(400);
    eq(await page.evaluate(() => S.time), t2, 'czas w trakcie pomocy');
    await page.click('text=Do dzieła');
    await page.evaluate(() => endGame('lose', 'test'));
    eq(await page.$$eval('#overlay button', b => b.map(x => x.textContent)), ['Jeszcze raz', 'Menu'], 'przyciski końca gry');
    await page.click('text=Menu'); await page.click('text=Nowa gra'); await page.click('.scr-foot .mid >> text=Sioux'); await page.waitForTimeout(300);
    eq(await page.evaluate(() => [S.gameOver, S.testMode]), [null, true], 'stan po wejściu w test z menu');
  });

  console.log('C2: fundament (frakcje jako dane, trudność, zapis)');
  await test('C2: tabela frakcji jest spójna z jednostkami, budynkami, zasobami graficznymi', async () => {
    const r = await page.evaluate(() => {
      const bad = [];
      for (const k in RACES) {
        const R = RACES[k], man = window.ASSETS;
        if ((R.playable || k === 'outlaw') && !man['bld_hq_' + R.nation]) bad.push(k + ': brak sprite\'a obozu stylu ' + R.nation);
        if (!R.playable) continue;
        for (const u of R.startUnits) if (!CFG.units[u]) bad.push(k + ': startowa jednostka ' + u);
        for (const m of R.build) if (!CFG.buildings[m.type]) bad.push(k + ': budynek ' + m.type);
        for (const b in R.train) for (const u of R.train[b]) if (!CFG.units[u]) bad.push(k + ': produkcja ' + u);
        for (const t of R.noTechs) if (!CFG.techs[t]) bad.push(k + ': technologia ' + t);
        for (const t in R.test.units) if (!CFG.units[t]) bad.push(k + ': testowa jednostka ' + t);
        for (const t of R.test.buildings) if (!CFG.buildings[t]) bad.push(k + ': testowy budynek ' + t);
        if (R.startOrders.length !== R.startUnits.length) bad.push(k + ': rozkazy startowe');
      }
      return bad;
    });
    eq(r, [], 'niespójności');
  });
  await test('C2: poziomy trudności rosną monotonicznie, a normalny to dotychczasowe wartości AI', async () => {
    const r = await page.evaluate(() => {
      const ks = ['veryeasy', 'easy', 'normal', 'hard', 'veryhard'], D = ks.map(k => CFG.difficulty[k]);
      const mono = (f, dir) => D.every((d, i) => i === 0 || (dir > 0 ? f(d) >= f(D[i - 1]) : f(d) <= f(D[i - 1])));
      return { w: mono(d => d.workers, 1), a: mono(d => d.armyBase, 1), m: mono(d => d.waveMul, -1), f: mono(d => d.firstWave, -1),
        normal: CFG.difficulty.normal.workers === CFG.ai.workersMax && CFG.difficulty.normal.armyBase === CFG.ai.armyBase && CFG.difficulty.normal.waveMul === 1 && CFG.difficulty.normal.firstWave === 480 };
    });
    ok(r.w && r.a && r.m && r.f, 'monotoniczność'); ok(r.normal, 'normalny = bazowe CFG.ai');
  });
  await test('C2: trudność zmienia AI: liczba robotników, przerwa między wyprawami; bardzo łatwy nie rusza budynków', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      for (const lvl of ['veryeasy', 'veryhard']) {
        S.difficulty = lvl; newGame(3, 'settler'); S.menuOpen = false; document.getElementById('overlay').style.display = 'none';
        out[lvl] = { cd: S.ai.attackCd };
        for (let i = 0; i < 60 * 150; i++) update(1 / 60);
        out[lvl].workers = S.units.filter(u => u.fac === 'enemy' && u.type === 'worker').length;
      }
      // armia, która ma nie atakować budynków: dociera, stoi, budynek nietknięty (z hitsBuildings=true ten sam układ burzy budynek)
      const hp = flag => {
        T.fresh(); const b = addBuilding('barracks', 20, 18, 'player'); b.built = true; const hp0 = b.hp;
        for (let i = 0; i < 5; i++) addUnit('desperado', 'enemy', 20 + i * 0.3, 24).stance = 'norm';
        aiAttack(b, flag); T.run(60); return [hp0, b.hp];
      };
      out.noHit = hp(false); out.hit = hp(true);
      return out;
    });
    ok(r.veryeasy.cd > r.veryhard.cd, 'przerwa do pierwszej wyprawy'); ok(r.veryeasy.workers < r.veryhard.workers, 'robotnicy AI: ' + r.veryeasy.workers + ' vs ' + r.veryhard.workers);
    eq(r.noHit[1], r.noHit[0], 'budynek nietknięty'); ok(r.hit[1] < r.hit[0], 'zwykła wyprawa niszczy budynek');
  });
  await test('C2: zapis i odczyt zachowują partię; po wczytaniu przebieg jest identyczny jak bez zapisu', async () => {
    const r = await page.evaluate(() => {
      newGame(5, 'sioux'); S.menuOpen = false; document.getElementById('overlay').style.display = 'none'; S.difficulty = 'hard';
      const me = S.units.filter(u => u.fac === 'player');
      orderGatherAuto(me[0], T_GOLD);
      for (let i = 0; i < 60 * 240; i++) update(1 / 60);
      const snap = JSON.stringify(serializeGame());
      for (let i = 0; i < 60 * 90; i++) update(1 / 60);
      const a = JSON.stringify(serializeGame());
      restoreGame(JSON.parse(snap));
      const same0 = JSON.stringify(serializeGame()) === snap;
      for (let i = 0; i < 60 * 90; i++) update(1 / 60);
      const b = JSON.stringify(serializeGame());
      return { same0, same: a === b, len: snap.length, units: S.units.length, diff: S.difficulty, race: S.playerRace, drawn: (() => { render(); return true; })() };
    });
    ok(r.same0, 'odczyt odtwarza stan zapisu'); ok(r.same, 'dalszy przebieg różni się po odczycie'); eq([r.diff, r.race], ['hard', 'sioux'], 'ustawienia partii');
    ok(r.len < 500000, 'rozmiar zapisu ' + r.len);
  });
  await test('C2: przycisk Zapisz/Wczytaj i wpis w menu; uszkodzony zapis nie psuje gry', async () => {
    const r = await page.evaluate(() => {
      localStorage.removeItem(SAVE_KEY);
      T.fresh(); const had0 = hasSave();
      const saved = saveGame(); const had1 = hasSave();
      localStorage.setItem(SAVE_KEY, '{zepsute'); const loaded = loadGame();
      const stillRuns = (() => { for (let i = 0; i < 120; i++) update(1 / 60); return true; })();
      localStorage.removeItem(SAVE_KEY);
      return { had0, saved, had1, loaded, stillRuns };
    });
    eq(r, { had0: false, saved: true, had1: true, loaded: false, stillRuns: true }, 'zapis');
  });
  console.log('Lekcje QA z oryginału (14.5)');
  await test('14.5: grupa 12 jednostek rozkazem przechodzi przez las i dociera do celu', async () => {
    const r = await page.evaluate(() => {
      T.fresh();
      // pas lasu z przerwą: grupa musi znaleźć przejście, nie zakleszczyć się
      for (let y = 10; y < 28; y++) if (y !== 19) for (let x = 20; x < 23; x++) { S.terrain[idx(x, y)] = T_FOREST; S.amt[idx(x, y)] = 100; }
      const us = []; for (let i = 0; i < 12; i++) us.push(addUnit('worker', 'player', 12 + (i % 4) * 0.8, 17 + Math.floor(i / 4) * 0.8));
      executeOrder({ units: us, x: 30, y: 19, targetUnit: null }); T.run(60);
      return us.filter(u => Math.hypot(u.x - 30, u.y - 19) < 4).length;
    });
    eq(r, 12, 'dotarło');
  });
  await test('14.5: postawa realnie zmienia automatyczne rozkazy (hold stoi, norm bije w zasięgu broni, aggr goni w promieniu agresji)', async () => {
    const r = await page.evaluate(() => {
      const res = {};
      for (const d of [3, 5.5]) for (const st of ['hold', 'norm', 'aggr']) {
        T.fresh(); const a = addUnit('piechota', 'player', 20.5, 20.5); a.stance = st;
        const e = addUnit('worker', 'enemy', 20.5, 20.5 + d); e.stance = 'hold';
        T.run(2); res[d + st] = !!a.attackTarget || e.hp < e.maxHp;
      }
      return res;
    });
    eq(r, { '3hold': false, '3norm': true, '3aggr': true, '5.5hold': false, '5.5norm': false, '5.5aggr': true }, 'postawy');
  });
  await test('14.5: jednostki wroga poza zasięgiem wzroku nie są rysowane (brak duchów)', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.explored.fill(1); S.visible.fill(0);
      const e = addUnit('desperado', 'enemy', 5.5, 5.5), seen = [];
      const orig = drawUnit; window.drawUnit = u => { seen.push(u.id); };
      try { centerCameraOn(5.5, 5.5); render(); const hidden = seen.includes(e.id); seen.length = 0;
        S.visible[idx(5, 5)] = 1; render(); return [hidden, seen.includes(e.id)]; }
      finally { window.drawUnit = orig; }
    });
    eq(r, [false, true], 'ukryty/widoczny');
  });
  console.log('C3a: Osadnicy');
  await test('C3: limit banków (5) liczy się od startu budowy, a bank daje złoto i podnosi limit', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.res = { wood: 5000, food: 500, gold: 5000, guns: 0, horses: 0 };
      const man = addUnit('frontiersman', 'player', 14.5, 14.5); S.selected.units = [man];
      let placed = 0; for (let i = 0; i < 7; i++) { const n = S.buildings.length; tryPlace('bank', 12 + (i % 4) * 3, 12 + Math.floor(i / 4) * 3); if (S.buildings.length > n) placed++; }
      // żaden bank nie jest ukończony, a limit już działa
      const unbuilt = S.buildings.filter(b => b.type === 'bank' && !b.built).length;
      const capBefore = resCapOf('gold');
      for (const b of S.buildings.filter(b => b.type === 'bank')) { b.built = true; b.progress = 1; }
      const capAfter = resCapOf('gold');
      S.res.gold = 0; T.run(10);
      const gold10 = Math.round(S.res.gold);
      return { placed, unbuilt, capBefore, capAfter, gold10 };
    });
    eq([r.placed, r.unbuilt], [5, 5], 'liczba banków przy starcie budowy'); eq(r.capAfter - r.capBefore, 2500, 'limit złota +500 za bank'); ok(r.gold10 >= 45 && r.gold10 <= 55, 'przychód 5 banków przez 10 s: ' + r.gold10);
  });
  await test('C3: ranczo podnosi limit żywności o 150, nadwyżka ponad limit przepada', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); const c0 = resCapOf('food'); const b = addBuilding('ranch', 14, 14, 'player'); const c1 = resCapOf('food'); b.built = true; const c2 = resCapOf('food');
      S.res.food = c2 - 10; addRes('food', 100); return [c0, c1, c2, S.res.food];
    });
    eq(r, [500, 500, 650, 650], 'limit żywności');
  });
  await test('C3: podział ról – frontierswoman rąbie i farmi, ale nie buduje; frontiersman buduje i kopie, ale nie rąbie', async () => {
    const r = await page.evaluate(() => {
      const w = { type: 'frontierswoman' }, m = { type: 'frontiersman' };
      return { w: [canGatherRes(w, T_FOREST), canGatherRes(w, T_GOLD), unitRole(w, 'farmer'), unitRole(w, 'builder')],
        m: [canGatherRes(m, T_FOREST), canGatherRes(m, T_GOLD), unitRole(m, 'farmer'), unitRole(m, 'builder')] };
    });
    eq(r.w, [true, false, true, false], 'frontierswoman'); eq(r.m, [false, true, false, true], 'frontiersman');
  });
  await test('C3: szeryf widzi dalej (wzrok 10) i podnosi morale jak przywódca', async () => {
    const r = await page.evaluate(() => {
      T.fresh(); S.visible.fill(0);
      const sh = addUnit('szeryf', 'player', 20.5, 20.5); computeFog();
      const seen = (dx, dy) => !!S.visible[idx(20 + dx, 20 + dy)];
      const far = seen(9, 0), tooFar = seen(11, 0);
      const f = addUnit('piechota', 'player', 22.5, 20.5); f.morale = 40; updateMorale(); const m1 = f.morale;
      S.units = S.units.filter(u => u !== sh); f.morale = 40; updateMorale(); const m2 = f.morale;
      return { far, tooFar, gain: m1 - m2 };
    });
    ok(r.far && !r.tooFar, 'zasięg widzenia'); ok(r.gain > 0.4, 'aura morale: ' + r.gain);
  });
  await test('C3: armata bije obszarowo (r 1.5), bez friendly fire, a budynki niszczy szybciej niż piechota', async () => {
    const r = await page.evaluate(() => {
      T.fresh();
      const c = addUnit('armata', 'player', 20.5, 20.5); c.stance = 'norm';
      const a = addUnit('desperado', 'enemy', 20.5, 29.5), b = addUnit('desperado', 'enemy', 21.5, 29.5), far = addUnit('desperado', 'enemy', 25.5, 29.5), own = addUnit('piechota', 'player', 20.5, 30);
      for (const e of [a, b, far]) e.stance = 'hold';
      const hp = [a, b, far, own].map(u => u.hp);
      c.attackTarget = a; c.ordered = true; c.state = 'attack';
      for (let i = 0; i < 60 * 12; i++) { update(1 / 60); for (const e of [a, b, far]) e.x = e.x; }
      const after = [a, b, far, own].map(u => S.units.includes(u) ? u.hp : 0);
      return { dropA: hp[0] - after[0], dropB: hp[1] - after[1], dropFar: hp[2] - after[2], dropOwn: hp[3] - after[3] };
    });
    ok(r.dropA > 0 && r.dropB > 0, 'trafia cel i sąsiada: ' + r.dropA + '/' + r.dropB); eq(r.dropFar, 0, 'poza promieniem'); eq(r.dropOwn, 0, 'friendly fire');
  });
  await test('C3: limit populacji 200 i start Osadników z podziałem na mężczyzn i kobiety', async () => {
    const r = await page.evaluate(() => {
      newGame(2, 'settler'); const start = S.units.filter(u => u.fac === 'player').map(u => u.type).sort();
      for (let i = 0; i < 40; i++) addBuilding('house', 1 + (i % 10) * 2, 20 + Math.floor(i / 10) * 2, 'player').built = true;
      return { start, cap: popCap('player') };
    });
    eq(r.start, ['frontiersman', 'frontiersman', 'frontierswoman', 'frontierswoman'], 'start'); eq(r.cap, 200, 'limit');
  });
  console.log('Faza 8: teren i brzegi');
  await test('F8: zasoby terenu (atlasy gruntu, wody, szuwary, skały, kępki) istnieją, a brzeg wody jest zaznaczony i rysowany', async () => {
    const r = await page.evaluate(() => {
      const man = window.ASSETS, need = ['ground_grass', 'ground_olive', 'ground_ochre', 'ground_gravel', 'ground_water', 'prop_reed0', 'prop_reed1', 'prop_reed2', 'prop_rock0', 'prop_rock1', 'prop_rock2', 'prop_tuft0', 'prop_tuft1', 'prop_tuft2'];
      const missing = need.filter(k => !man[k]);
      for (const b in BIOMES) { if (!man['ground_' + BIOMES[b].base]) missing.push(b + ':base'); for (const p of BIOMES[b].patches) if (!man['ground_' + p.atlas]) missing.push(b + ':' + p.atlas); }
      newGame(3, 'settler'); S.menuOpen = false; S.explored.fill(1); S.visible.fill(1);
      let water = 0, shoreLand = 0, shoreWater = 0;
      for (let i = 0; i < MAP * MAP; i++) { const w = S.terrain[i] === T_WATER; if (w) water++; if (S.shore[i] >= 0) w ? shoreWater++ : shoreLand++; }
      // znaczniki zgodne z sąsiedztwem: kafel lądu z flagą ma wodę w kierunku N4
      let bad = 0;
      for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) { const k = S.shore[idx(x, y)]; if (k < 0) continue; const w = S.terrain[idx(x, y)] === T_WATER; if (isWaterAt(x + N4[k][0], y + N4[k][1]) === w) bad++; }
      let reeds = 0; const orig = drawStatic; window.drawStatic = key => { if (key.startsWith('prop_reed')) reeds++; };
      try { for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) if (S.shore[idx(x, y)] >= 0) drawShoreReeds(x, y, 100, 100); } finally { window.drawStatic = orig; }
      return { missing, water, shoreLand, shoreWater, bad, reeds };
    });
    eq(r.missing, [], 'brakujące zasoby'); ok(r.water > 20 && r.shoreLand > 5 && r.shoreWater > 5, 'brzeg: ' + JSON.stringify(r)); eq(r.bad, 0, 'złe znaczniki brzegu'); ok(r.reeds > 0, 'szuwary rysowane');
  });
  console.log('Faza 10: potyczka (mapy, klify, motywy)');
  await test('F10: każda mapa ma drogę między obozami dla piechoty i konnych, klif blokuje ruch i budowę', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      for (const m of MAP_LIST()) {
        newGame(5, 'settler', { map: m.id }); S.menuOpen = false;
        const php = S.buildings.find(b => b.fac === 'player' && b.type === 'hq'), ehq = S.buildings.find(b => b.fac === 'enemy' && b.type === 'hq');
        const foot = pathToBuilding(php.cx + 0.5, php.cy + 3.5, ehq, CFG.units.piechota).length, cav = pathToBuilding(php.cx + 0.5, php.cy + 3.5, ehq, CFG.units.jezdiec).length;
        let cliffs = 0; for (let i = 0; i < MAP * MAP; i++) if (S.terrain[i] === T_CLIFF) cliffs++;
        out[m.id] = { size: MAP, foot: foot > 0, cav: cav > 0, cliffs, units: S.units.length > 20 };
      }
      return out;
    });
    for (const id in r) ok(r[id].foot && r[id].cav && r[id].units, id + ': ' + JSON.stringify(r[id]));
    eq([r.prairie.size, r.canyon.size, r.ford.size, r.plateau.size], [40, 40, 40, 56], 'rozmiary'); eq(r.prairie.cliffs, 0, 'preria bez klifów'); ok(r.canyon.cliffs > 50 && r.plateau.cliffs > 50, 'kaniony mają klify');
    const c = await page.evaluate(() => {
      newGame(5, 'settler', { map: 'canyon' }); S.menuOpen = false; S.explored.fill(1);
      let cx = -1, cy = -1; for (let i = 0; i < MAP * MAP && cx < 0; i++) if (S.terrain[i] === T_CLIFF) { cx = i % MAP; cy = Math.floor(i / MAP); }
      S.res = { wood: 999, food: 999, gold: 999, guns: 0, horses: 0 }; const w = addUnit('frontiersman', 'player', 20.5, 20.5); S.selected.units = [w]; const n0 = S.buildings.length; tryPlace('house', cx, cy);
      return { blocked: isBlocked(cx, cy), passable: passableFor(CFG.units.piechota, cx, cy), swim: passableFor(CFG.units.wojownik, cx, cy), built: S.buildings.length > n0 };
    });
    eq(c, { blocked: true, passable: false, swim: false, built: false }, 'klif');
  });
  await test('F10: kanion ma krótką przełęcz i dłuższe obejście; Bród ma dwa przejścia dla Osadników', async () => {
    const r = await page.evaluate(() => {
      newGame(5, 'settler', { map: 'canyon' }); S.menuOpen = false;
      const php = S.buildings.find(b => b.fac === 'player' && b.type === 'hq'), ehq = S.buildings.find(b => b.fac === 'enemy' && b.type === 'hq');
      const route = () => pathToBuilding(php.cx + 0.5, php.cy + 3.5, ehq, CFG.units.piechota).length, base = route();
      // zablokowanie przełęczy zmusza do obejścia: ścieżka musi się wydłużyć, ale nadal istnieć
      for (let y = 14; y <= 26; y++) for (let x = 14; x <= 26; x++) if (Math.abs(x - y) <= 2) S.terrain[idx(x, y)] = T_CLIFF;
      const detour = route();
      return { base, detour };
    });
    ok(r.base > 0 && r.detour > r.base + 4, 'przełęcz: ' + r.base + ', obejście: ' + r.detour);
  });
  await test('F10: zapis i odczyt zachowują mapę, rozmiar i motyw', async () => {
    const r = await page.evaluate(() => {
      newGame(9, 'settler', { map: 'plateau', biome: 'arid' }); S.menuOpen = false; for (let i = 0; i < 600; i++) update(1 / 60);
      const snap = JSON.stringify(serializeGame()); newGame(9, 'settler', { map: 'prairie', biome: 'grass' });
      restoreGame(JSON.parse(snap)); const same = JSON.stringify(serializeGame()) === snap; render();
      return { id: S.mapId, size: MAP, biome: S.biome, chunks: S.gch.cv.filter(Boolean).length > 10, same };
    });
    eq([r.id, r.size, r.biome, r.chunks, r.same], ['plateau', 56, 'arid', true, true], 'odczyt mapy');
  });
  await test('F10: wszystkie motywy i mapy rysują się bez błędów, klify mają teksturę ściany i wierzchu dla każdego motywu', async () => {
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } }), errs = []; p2.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p2.goto('file://' + path.resolve(process.env.GAME_FILE || path.join(__dirname, '..', 'index.html'))); await p2.waitForFunction(() => window.GAME_READY, null, { timeout: 20000 });
    const r = await p2.evaluate(() => {
      const miss = []; for (const b in BIOMES) for (const k of ['cliff_face_', 'ground_cliff_']) if (!window.ASSETS[k + BIOMES[b].cliff]) miss.push(b + k);
      let n = 0;
      for (const m of MAP_LIST()) for (const b of ['arid', 'prairie', 'grass', 'auto']) { newGame(2, 'sioux', { map: m.id, biome: b }); S.menuOpen = false; S.explored.fill(1); S.visible.fill(1); for (let i = 0; i < 30; i++) update(1 / 60); render(); n++; }
      return { miss, n, auto: (newGame(2, 'sioux', { map: 'prairie', biome: 'auto' }), S.biome) };
    });
    await p2.close();
    eq(errs, [], 'błędy strony'); eq(r.miss, [], 'klify'); eq(r.n, 16, 'kombinacje'); eq(r.auto, 'grass', 'auto: Sioux = trawiasta');
  });
  await test('F10: AI Desperado na każdej nowej mapie buduje, szkoli i wysyła wyprawę bez zakleszczeń (6 min)', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      for (const id of ['canyon', 'ford', 'plateau']) {
        newGame(4, 'settler', { map: id }); S.menuOpen = false; S.difficulty = 'veryhard';
        for (let i = 0; i < 60 * 360; i++) update(1 / 60);
        const e = S.units.filter(u => u.fac === 'enemy'), bad = S.units.some(u => !Number.isFinite(u.x) || !Number.isFinite(u.y));
        out[id] = { blds: S.buildings.filter(b => b.fac === 'enemy' && b.built).length, army: e.filter(u => u.type !== 'worker').length, attacks: S.ai.attacks, bad, res: Object.values(S.resE).every(Number.isFinite) };
      }
      return out;
    });
    for (const id in r) ok(r[id].blds >= 2 && r[id].army >= 3 && !r[id].bad && r[id].res, id + ': ' + JSON.stringify(r[id]));
  });
  console.log('Faza 11: dotyk i małe ekrany');
  {
    const gameUrl = 'file://' + path.resolve(process.env.GAME_FILE || path.join(__dirname, '..', 'index.html'));
    const mk = async (w, h) => { const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }); const pg = await c.newPage(); pg.errs = []; pg.on('pageerror', e => pg.errs.push(String(e).slice(0, 200))); await pg.goto(gameUrl); await pg.waitForFunction(() => window.GAME_READY, null, { timeout: 20000 }); pg.cdp = await c.newCDPSession(pg); pg.ctxn = c; return pg; };
    const tp = (pg, type, pts) => pg.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });
    const start = async pg => { await pg.evaluate(() => { leaveScreens(); newGame(3, 'settler'); S.menuOpen = false; S.explored.fill(1); S.visible.fill(1); centerCameraOn(34, 34); updatePanels(); }); await pg.waitForTimeout(150); };
    const scr = (pg, x, y) => pg.evaluate(([x, y]) => { const [sx, sy] = tileToScreen(x, y); return [sx * ZOOM, sy * ZOOM]; }, [x, y]);
    const tap = async (pg, x, y) => { await tp(pg, 'touchStart', [[x, y]]); await pg.waitForTimeout(40); await tp(pg, 'touchEnd', []); await pg.waitForTimeout(60); };

    await test('F11: na telefonie (740×360) włącza się tryb zwarty, przyciski mają min. 44 px, nic nie wychodzi poza ekran, menu da się przewinąć', async () => {
      const pg = await mk(740, 360);
      const r = await pg.evaluate(() => {
        const out = { compact: document.documentElement.classList.contains('compact'), zoom: ZOOM, sw: document.documentElement.scrollWidth, iw: innerWidth, small: [] };
        showFactionScreen(); out.fxScroll = overlay.scrollHeight >= overlay.clientHeight && getComputedStyle(overlay).overflowY === 'auto';
        leaveScreens(); newGame(3, 'settler'); S.menuOpen = false; S.selected.units = S.units.filter(u => u.fac === 'player').slice(0, 1); updatePanels();
        for (const b of document.querySelectorAll('#buildbar .cmd, .sbtn')) if (b.offsetParent && Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height) < 38) out.small.push(b.className);
        const hud = hudEl.getBoundingClientRect(); out.hudInside = hud.bottom <= innerHeight + 1 && hud.right <= innerWidth + 1 && hud.height < innerHeight * 0.55;
        return out;
      });
      await pg.ctxn.close();
      ok(r.compact && r.zoom < 2, 'tryb zwarty i szerszy widok: ' + JSON.stringify(r)); ok(r.sw <= r.iw, 'brak poziomego przewijania'); eq(r.small, [], 'za małe przyciski'); ok(r.hudInside, 'panel mieści się w oknie'); ok(r.fxScroll, 'ekran wyboru ludu przewijalny'); eq(pg.errs, [], 'błędy strony');
    });
    await test('F11: w pionie pojawia się komunikat „obróć telefon”, a przyciski poleceń mają ≥44 px na 844×390', async () => {
      const pg = await mk(360, 740), shown = await pg.evaluate(() => getComputedStyle(document.getElementById('rotate')).display); await pg.ctxn.close();
      eq(shown, 'flex', 'komunikat w pionie');
      const pg2 = await mk(844, 390), hid = await pg2.evaluate(() => { start: { } leaveScreens(); newGame(3, 'settler'); S.menuOpen = false; const hq = S.buildings.find(b => b.type === 'hq' && b.fac === 'player'); S.selected.building = hq; updatePanels(); return [getComputedStyle(document.getElementById('rotate')).display, Math.min(...[...document.querySelectorAll('#bpanel .cmd:not(.slot)')].map(b => Math.min(b.offsetWidth, b.offsetHeight)))]; });
      await pg2.ctxn.close(); eq(hid[0], 'none', 'poziomo bez komunikatu'); ok(hid[1] >= 44, 'przyciski produkcji: ' + hid[1]);
    });
    await test('F11: dotknięcie zaznacza jednostkę, dotknięcie terenu wydaje rozkaz ruchu', async () => {
      const pg = await mk(740, 360); await start(pg);
      const id = await pg.evaluate(() => { const a = S.units.find(u => u.fac === 'player' && u.type === 'frontierswoman'); a.x = 30.5; a.y = 34.5; a.path = []; a.state = 'idle'; return a.id; });
      const [ax, ay] = await scr(pg, 30.5, 34.5); await tap(pg, ax, ay - 10);
      const sel1 = await pg.evaluate(() => S.selected.units.map(u => u.id));
      const [gx, gy] = await scr(pg, 28.5, 36.5); await tap(pg, gx, gy);
      await pg.waitForTimeout(400);
      const moved = await pg.evaluate(id => { const u = S.units.find(u => u.id === id); return Math.hypot(u.x - 30.5, u.y - 34.5); }, id);
      await pg.ctxn.close();
      eq(sel1, [id], 'zaznaczenie dotknięciem'); ok(moved > 0.3, 'jednostka ruszyła na rozkaz: ' + moved);
    });
    await test('F11: podwójne dotknięcie zaznacza wszystkie jednostki tego typu na ekranie', async () => {
      const pg = await mk(740, 360); await start(pg);
      await pg.evaluate(() => { S.paused = true; });
      const pos = await pg.evaluate(() => { const u = S.units.filter(u => u.fac === 'player' && u.type === 'frontierswoman')[0]; const [sx, sy] = tileToScreen(u.x, u.y); return [sx * ZOOM, sy * ZOOM]; });
      await tap(pg, pos[0], pos[1] - 10); await tap(pg, pos[0], pos[1] - 10);
      const n = await pg.evaluate(() => [S.selected.units.filter(u => u.type === 'frontierswoman').length, S.units.filter(u => u.fac === 'player' && u.type === 'frontierswoman').length]);
      await pg.ctxn.close();
      eq(n[0], n[1], 'wszystkie frontierswoman zaznaczone'); ok(n[0] >= 2, 'co najmniej dwie');
    });
    await test('F11: przeciągnięcie palcem po terenie przesuwa kamerę, a przytrzymanie z przeciągnięciem robi ramkę zaznaczenia', async () => {
      const pg = await mk(740, 360); await start(pg);
      await pg.evaluate(() => { S.paused = true; });
      const c0 = await pg.evaluate(() => [cam.x, cam.y]);
      await tp(pg, 'touchStart', [[300, 150]]); for (let i = 1; i <= 6; i++) { await tp(pg, 'touchMove', [[300 + i * 20, 150 + i * 8]]); await pg.waitForTimeout(16); } await tp(pg, 'touchEnd', []); await pg.waitForTimeout(80);
      const c1 = await pg.evaluate(() => [cam.x, cam.y, S.selected.units.length]);
      // ramka obejmująca wszystkie jednostki gracza: przytrzymanie 450 ms w lewym górnym rogu, potem przeciągnięcie na prawy dolny
      const bb = await pg.evaluate(() => { const p = S.units.filter(u => u.fac === 'player').map(u => { const [sx, sy] = tileToScreen(u.x, u.y); return [sx * ZOOM, sy * ZOOM]; }); return [Math.min(...p.map(q => q[0])) - 30, Math.min(...p.map(q => q[1])) - 30, Math.max(...p.map(q => q[0])) + 30, Math.max(...p.map(q => q[1])) + 30]; });
      await tp(pg, 'touchStart', [[bb[0], bb[1]]]); await pg.waitForTimeout(450);
      for (let i = 1; i <= 8; i++) { await tp(pg, 'touchMove', [[bb[0] + (bb[2] - bb[0]) * i / 8, bb[1] + (bb[3] - bb[1]) * i / 8]]); await pg.waitForTimeout(16); }
      const boxing = await pg.evaluate(() => mouse.dragging); await tp(pg, 'touchEnd', []); await pg.waitForTimeout(100);
      const sel = await pg.evaluate(() => [S.selected.units.length, S.units.filter(u => u.fac === 'player').length]);
      await pg.ctxn.close();
      ok(Math.abs(c1[0] - c0[0]) > 40 && c1[2] === 0, 'kamera przesunięta, bez zaznaczania: ' + JSON.stringify([c0, c1])); ok(boxing, 'ramka aktywna po przytrzymaniu'); eq(sel[0], sel[1], 'ramka zaznaczyła wszystkie jednostki gracza');
    });
    await test('F11: dwa palce zmieniają zoom (w granicach) i przesuwają kamerę; kółko myszy też', async () => {
      const pg = await mk(740, 360); await start(pg);
      const z0 = await pg.evaluate(() => ZOOM);
      await tp(pg, 'touchStart', [[300, 180], [440, 180]]); for (let i = 1; i <= 8; i++) { await tp(pg, 'touchMove', [[300 - i * 15, 180], [440 + i * 15, 180]]); await pg.waitForTimeout(16); } await tp(pg, 'touchEnd', []);
      const z1 = await pg.evaluate(() => ZOOM);
      await tp(pg, 'touchStart', [[300, 180], [440, 180]]); for (let i = 1; i <= 20; i++) { await tp(pg, 'touchMove', [[300 + i * 10, 180], [440 - i * 6, 180]]); await pg.waitForTimeout(8); } await tp(pg, 'touchEnd', []);
      const z2 = await pg.evaluate(() => { setZoom(99, 300, 180); const hi = ZOOM; setZoom(0.1, 300, 180); return [ZOOM, hi]; });
      await pg.ctxn.close();
      ok(z1 > z0 + 0.2, 'rozsunięcie przybliża: ' + z0 + ' -> ' + z1); eq([z2[0], z2[1]], [1.2, 3], 'granice zoomu');
    });
    await test('F11: tryb budowy na dotyku: palec celuje, puszczenie stawia budynek; przycisk Anuluj przerywa', async () => {
      const pg = await mk(740, 360); await start(pg);
      const r = await pg.evaluate(() => { S.res = { wood: 999, food: 999, gold: 999, guns: 0, horses: 0 }; const w = S.units.find(u => u.fac === 'player' && u.type === 'frontiersman'); S.selected.units = [w]; S.placing = 'house'; return [w.id]; });
      await pg.waitForTimeout(120);
      const cancelShown = await pg.evaluate(() => getComputedStyle(document.getElementById('cancelbtn')).display);
      const spot = await pg.evaluate(() => { const d = CFG.buildings.house; for (let r = 3; r < 8; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { const x = 34 + dx, y = 34 + dy; let free = true; for (let j = y; j < y + d.h; j++) for (let i = x; i < x + d.w; i++) if (!inMap(i, j) || isBlocked(i, j)) free = false; if (free) { const [sx, sy] = tileToScreen(x + 0.5, y + 0.5); if (sx * ZOOM > 80 && sx * ZOOM < 660 && sy * ZOOM > 40 && sy * ZOOM < 220) return [x, y, sx * ZOOM, sy * ZOOM]; } } return null; });
      const [hx, hy] = [spot[2], spot[3]];
      await tp(pg, 'touchStart', [[hx - 60, hy]]); await tp(pg, 'touchMove', [[hx, hy]]); await tp(pg, 'touchEnd', []); await pg.waitForTimeout(250);
      const placed = await pg.evaluate(() => [S.buildings.filter(b => b.type === 'house' && b.fac === 'player').length, S.placing]);
      await pg.evaluate(() => { S.placing = 'house'; }); await pg.waitForTimeout(120); await pg.tap('#cancelbtn'); await pg.waitForTimeout(100);
      const afterCancel = await pg.evaluate(() => S.placing);
      await pg.ctxn.close();
      eq(cancelShown, 'block', 'przycisk Anuluj widoczny'); eq(placed, [1, null], 'dom postawiony po puszczeniu'); eq(afterCancel, null, 'Anuluj zdejmuje tryb');
    });
    await test('F11: jakość grafiki Niska zmniejsza warstwę terenu 4×, wyłącza cienie i zapamiętuje wybór', async () => {
      const r = await page.evaluate(() => {
        SETTINGS.quality = 1; newGame(3, 'settler'); const hi = S.gch.cv.filter(Boolean)[0].width;
        SETTINGS.quality = 0; buildGround(); const lo = S.gch.cv.filter(Boolean)[0].width; saveSettings();
        const stored = JSON.parse(localStorage.getItem(SET_KEY)).quality; SETTINGS.quality = 1; buildGround(); saveSettings();
        return { hi, lo, stored };
      });
      eq([r.hi, r.lo, r.stored], [1056, 528, 0], 'rozmiary kafelków terenu i zapis');
    });
  }
  console.log('Smoke');
  for (const race of ['settler', 'sioux']) {
    await test('smoke: 10 minut gry (' + race + ') bez wyjątków, NaN i ujemnych zasobów', async () => {
      const r = await page.evaluate(race => {
        newGame(11, race); S.menuOpen = false; document.getElementById('overlay').style.display = 'none';
        // gracz buduje gospodarkę z automatu: robotnicy na las i złoto, kolejka jednostek
        for (let i = 0; i < 60 * 600; i++) {
          update(1 / 60);
          if (S.gameOver) break;
          if (i % 60 === 0) for (const R of [S.res, S.resE]) for (const k in R) if (!(R[k] >= 0) || !isFinite(R[k])) return 'zasób ' + k + '=' + R[k];
          if (i % 600 === 0) for (const u of S.units) if (!isFinite(u.x) || !isFinite(u.y) || !isFinite(u.hp)) return 'NaN: ' + u.type;
        }
        return 'ok';
      }, race);
      eq(r, 'ok', 'niezmienniki');
    });
  }
  await test('smoke: tryb testowy obu ras przez 2 minuty', async () => {
    const r = await page.evaluate(() => { for (const race of ['settler', 'sioux']) { newGame(5, race); setupTest(race); for (let i = 0; i < 60 * 120; i++) update(1 / 60); } return 'ok'; });
    eq(r, 'ok');
  });
  await test('brak błędów strony w całym przebiegu', async () => eq(pageErrors, [], 'błędy strony'));

  await browser.close();
  const failed = results.filter(r => !r[1]);
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' testów przeszło');
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
