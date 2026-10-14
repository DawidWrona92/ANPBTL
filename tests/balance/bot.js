// Bot gracza (Osadnicy) dla badań balansu. Wstrzykiwany do strony; gra tylko przez te same funkcje, których używa interfejs
// (tryPlace, tryTrain, executeOrder, orderGatherAuto), więc nie omija reguł gry. Prosty build order bez mikro.
(function () {
  const P = { workers: 8, farmsMax: 3, armyToAttack: 10, attackAfter: 720, stepEvery: 1.0 };
  const bot = { P, next: 0, log: { infantry: [], res: {} }, attacked: false };
  const origAdd = addUnit;
  addUnit = function (type, fac, x, y) { const u = origAdd(type, fac, x, y); if (fac === 'player' && type === 'piechota') bot.log.infantry.push(+S.time.toFixed(1)); return u; };

  // zgodność ze starszymi wersjami gry (porównania A/B): brak queuedCount przed poprawką limitu populacji
  const qcount = () => typeof queuedCount === 'function' ? queuedCount() : S.buildings.filter(b => b.fac === 'player').reduce((n, b) => n + b.queue.length, 0);
  const mine = fn => S.units.filter(u => u.fac === 'player' && fn(u));
  const blds = (type, built) => S.buildings.filter(b => b.fac === 'player' && b.type === type && (built === undefined || b.built === built));
  function spot(type) {
    const def = CFG.buildings[type], hq = blds('hq')[0]; if (!hq) return null;
    const cx = Math.floor(hq.cx), cy = Math.floor(hq.cy);
    for (let r = 3; r <= 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const tx = cx + dx - Math.floor(def.w / 2), ty = cy + dy - Math.floor(def.h / 2);
      let ok = true;
      for (let y = ty - 1; y <= ty + def.h && ok; y++) for (let x = tx - 1; x <= tx + def.w; x++) if (!inMap(x, y) || isBlocked(x, y) || !S.explored[idx(x, y)]) { ok = false; break; }
      if (ok) return [tx, ty];
    }
    return null;
  }
  function build(type) {
    const def = CFG.buildings[type]; if (!canAfford(def.cost)) return false;
    const builders = mine(u => unitRole(u, 'builder') && u.state !== 'farming' && u.state !== 'building' && u.state !== 'toBuild');
    const sp = spot(type); if (!builders.length || !sp) return false;
    S.selected.units = [builders[0]]; tryPlace(type, sp[0], sp[1]); return true;
  }
  bot.step = function () {
    if (S.time < bot.next) return; bot.next = S.time + P.stepEvery;
    const hq = blds('hq', true)[0]; if (!hq) return;
    const workers = mine(u => u.type === 'worker');
    const queuedW = hq.queue.filter(q => q.type === 'worker').length;
    if (workers.length + queuedW < P.workers) tryTrain(hq, 'worker');
    const unbuilt = S.buildings.some(b => b.fac === 'player' && !b.built);
    const farms = blds('farm'), houses = blds('house');
    if (!unbuilt) {
      if (popUsed() + qcount() >= popCap() - 1) build('house');
      else if (farms.length < Math.min(P.farmsMax, 1 + Math.floor(S.time / 240)) && S.res.food < 450) build('farm');
      else if (blds('farm', true).length >= 1 && !blds('barracks').length) build('barracks');
      else if (blds('barracks', true).length && !blds('factory').length) build('factory');
    }
    const barr = blds('barracks', true)[0];
    if (barr && barr.queue.length < 2) tryTrain(barr, 'piechota');
    for (const w of workers.filter(u => u.state === 'idle')) {
      const f = blds('farm', true).find(x => !x.busy);
      if (f) executeOrder({ units: [w], x: f.tx, y: f.ty, targetUnit: null, targetHorse: null, silent: true });
      else {
        // przydział wg proporcji z dok. 19.9: drewno przeważa, złoto 1-2 górników po postawieniu koszar
        const gatherers = workers.filter(u => u.node), gold = gatherers.filter(u => u.carryType === 'gold').length, wood = gatherers.length - gold;
        const wantGold = blds('barracks').length ? 2 : 1;
        orderGatherAuto(w, gold < wantGold && wood >= 2 ? T_GOLD : T_FOREST);
      }
    }
    const army = mine(u => u.type === 'piechota' || u.type === 'jezdiec');
    const ehq = S.buildings.find(b => b.fac === 'enemy' && b.type === 'hq');
    if (!bot.attacked && ehq && S.time >= P.attackAfter && army.length >= P.armyToAttack) {
      bot.attacked = true; executeOrder({ units: army, x: Math.floor(ehq.cx), y: Math.floor(ehq.cy), targetUnit: null, targetHorse: null, silent: true });
    }
    for (const t of [300, 600, 1200]) if (S.time >= t && !bot.log.res[t]) bot.log.res[t] = { wood: Math.floor(S.res.wood), food: Math.floor(S.res.food), gold: Math.floor(S.res.gold), guns: Math.floor(S.res.guns), army: army.length, workers: workers.length, enemyArmy: S.units.filter(u => u.fac === 'enemy' && u.type !== 'worker').length, attacks: S.ai.attacks };
  };
  window.BOT = bot;
})();
