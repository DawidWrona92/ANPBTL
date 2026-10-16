'use strict';
// Badanie balansu: bot gracza vs AI, wiele seedów, wiele horyzontów. Uruchomienie:
//   npm run balance -- --seeds 20 --minutes 20 --file index.html --out docs/balance/baseline.json
// Wyniki opisują MODEL gry (prototyp), nie oryginał. Seed + parametry bota zapisywane w pliku wyjściowym.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => x.startsWith('--') ? a.concat([[x.slice(2), arr[i + 1]]]) : a, []));
const SEEDS = +(args.seeds || 20), MINUTES = +(args.minutes || 20), FILE = path.resolve(args.file || path.join(__dirname, '..', '..', 'index.html'));
function loadPlaywright() { try { return require('playwright'); } catch (e) { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] : null; };
const summ = a => ({ n: a.length, min: q(a, 0), median: q(a, 0.5), p90: q(a, 0.9), max: q(a, 1) });

(async () => {
  const pw = loadPlaywright();
  const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await page.goto('file://' + FILE); await page.waitForTimeout(300);
  await page.addScriptTag({ path: path.join(__dirname, 'bot.js') }).catch(() => {});
  const botSrc = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
  const runs = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = await page.evaluate(({ seed, minutes, botSrc }) => {
      newGame(seed, 'settler'); S.menuOpen = false;
      document.getElementById('overlay').style.display = 'none';
      // świeży bot na świeżej partii (addUnit jest opakowywany przy każdym wstrzyknięciu: najpierw przywróć oryginał z pierwszego opakowania)
      if (window.__origAddUnit) addUnit = window.__origAddUnit; else window.__origAddUnit = addUnit;
      (0, eval)(botSrc);
      const end = minutes * 60; let ticks = 0, outcome = 'timeout'; let sinceWood = 0;
      while (S.time < end) {
        update(1 / 60); BOT.step(); ticks++;
        if (S.gameOver) { outcome = S.gameOver; break; }
      }
      const inf = BOT.log.infantry;
      return { seed, mil: BOT.log.milestones, outcome, endTime: +S.time.toFixed(1), tFirstInf: inf[0] ?? null, tThirdInf: inf[2] ?? null, infantryBuilt: inf.length, res: BOT.log.res, playerUnits: S.units.filter(u => u.fac === 'player').length, attacks: S.ai.attacks };
    }, { seed, minutes: MINUTES, botSrc });
    runs.push(r); process.stdout.write('.');
  }
  console.log();
  const tally = {}; for (const r of runs) tally[r.outcome] = (tally[r.outcome] || 0) + 1;
  const horizon = t => { const rs = runs.map(r => r.res[t]).filter(Boolean); const f = k => summ(rs.map(x => x[k])); return rs.length ? { n: rs.length, wood: f('wood'), food: f('food'), gold: f('gold'), guns: f('guns'), army: f('army'), workers: f('workers'), enemyArmy: f('enemyArmy') } : null; };
  const out = {
    note: 'Wyniki modelu (prototyp), nie oryginału. Bot z tests/balance/bot.js; parametry w polu bot.',
    file: path.relative(process.cwd(), FILE), seeds: SEEDS, minutes: MINUTES, errors,
    outcomes: tally, endTime: summ(runs.map(r => r.endTime)),
    tFirstInfantry: summ(runs.map(r => r.tFirstInf).filter(x => x != null)), tThirdInfantry: summ(runs.map(r => r.tThirdInf).filter(x => x != null)),
    infantryBuilt: summ(runs.map(r => r.infantryBuilt)), aiAttacks: summ(runs.map(r => r.attacks)),
    at300s: horizon(300), at600s: horizon(600), at1200s: horizon(1200), runs,
  };
  if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 1)); }
  const show = o => JSON.stringify(o);
  console.log('plik:', out.file, '| seedy:', SEEDS, '| minut:', MINUTES, '| błędy strony:', errors.length);
  console.log('zakończenia:', show(tally), '| czas końca:', show(out.endTime));
  const milKeys = [...new Set(runs.flatMap(r => Object.keys(r.mil || {})))];
  out.milestones = Object.fromEntries(milKeys.map(k => [k, summ(runs.map(r => (r.mil || {})[k]).filter(x => x != null))]));
  console.log('kamienie milowe (mediana s, liczba seedów):', milKeys.map(k => k + ' ' + out.milestones[k].median + ' (' + out.milestones[k].n + ')').join(', '));
  console.log('pierwsza piechota [s]:', show(out.tFirstInfantry)); console.log('trzecia piechota [s]:', show(out.tThirdInfantry));
  for (const t of ['at300s', 'at600s', 'at1200s']) if (out[t]) console.log(t, 'n=' + out[t].n, 'drewno', out[t].wood.median, 'żywność', out[t].food.median, 'złoto', out[t].gold.median, 'broń', out[t].guns.median, 'armia', out[t].army.median, 'robotnicy', out[t].workers.median);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
