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
  await test('gra startuje bez błędów, menu ma 4 przyciski', async () => {
    eq(pageErrors, [], 'błędy strony');
    eq(await page.$$eval('#overlay button', b => b.length), 4, 'przyciski menu');
  });
  await test('F1: ścieżki jednostek nie zapętlają się', async () => {
    const r = await page.evaluate(() => { T.fresh(); const u = addUnit('worker', 'player', 20.5, 20.5); return [uPath(u, 25, 20).length, pathToBuildingU(u, S.buildings[0]).length >= 0]; });
    ok(r[0] > 0 && r[1], 'uPath/pathToBuildingU');
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
      const br = testPlace('player', 'barracks', 28, 28); tryTrain(br, 'piechota'); tryTrain(br, 'piechota'); destroyBuilding(br);
      const refunded = [S.res.food, S.res.gold, S.res.guns];
      S.res.horses = CFG.resCap.horses; const h = addUnit('horse', 'neutral', 20.5, 20.5), u = addUnit('worker', 'player', 20.5, 21.5);
      executeOrder({ units: [u], x: 20, y: 20, targetUnit: null, targetHorse: h }); T.run(8);
      return { refunded, horseStillOnMap: S.units.includes(h) };
    });
    eq(r, { refunded: [300, 100, 5], horseStillOnMap: true }, 'zwroty / koń');
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
      return { placed: a.y > 0 && a.x > 0, noOverlap: a.bottom <= s.top, styled: getComputedStyle(document.querySelector('#abilitybar button')).backgroundColor !== 'rgb(239, 239, 239)' };
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
    await page.click('text=Graj: Osadnicy'); await page.waitForTimeout(200);
    await page.click('#helpbtn'); await page.waitForTimeout(100);
    const t2 = await page.evaluate(() => S.time); await page.waitForTimeout(400);
    eq(await page.evaluate(() => S.time), t2, 'czas w trakcie pomocy');
    await page.click('text=Do dzieła');
    await page.evaluate(() => endGame('lose', 'test'));
    eq(await page.$$eval('#overlay button', b => b.map(x => x.textContent)), ['Jeszcze raz', 'Menu'], 'przyciski końca gry');
    await page.click('text=Menu'); await page.click('text=Test: Sioux'); await page.waitForTimeout(300);
    eq(await page.evaluate(() => [S.gameOver, S.testMode]), [null, true], 'stan po wejściu w test z menu');
  });

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
