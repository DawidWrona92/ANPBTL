// Bot gracza (Osadnicy) dla badań balansu. Wstrzykiwany do strony; gra tylko przez te same funkcje, których używa interfejs
// (tryPlace, tryTrain, executeOrder, orderGatherAuto), więc nie omija reguł gry. Prosty build order bez mikro, według drzewka z poradnika (faza 13):
// Farma + pola, Magazyn złota + Ranczo (konie) + Tartak (wóz kryty) do dowozu złota, Biuro szeryfa -> Fort -> Obóz szkoleniowy + Fabryka broni -> Infantryman.
(function () {
  const P = { men: 4, women: 6, fieldsMax: 4, armyToAttack: 10, attackAfter: 900, stepEvery: 1.0 };
  const bot = { P, next: 0, log: { infantry: [], res: {}, milestones: {} }, attacked: false };
  const origAdd = addUnit;
  addUnit = function (type, fac, x, y) { const u = origAdd(type, fac, x, y); if (fac === 'player' && type === 'infantryman') bot.log.infantry.push(+S.time.toFixed(1)); return u; };
  const mark = k => { if (bot.log.milestones[k] === undefined) bot.log.milestones[k] = +S.time.toFixed(1); };

  const qcount = () => S.buildings.filter(b => b.fac === 'player').reduce((n, b) => n + b.queue.length, 0);
  const mine = fn => S.units.filter(u => u.fac === 'player' && fn(u));
  const blds = (type, built) => S.buildings.filter(b => b.fac === 'player' && b.type === type && (built === undefined || b.built === built));
  // wolne miejsce na budynek w pierścieniu wokół punktu (cx, cy)
  function spotNear(type, cx, cy, rMin, rMax) {
    const def = CFG.buildings[type];
    for (let r = rMin; r <= rMax; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const tx = cx + dx - Math.floor(def.w / 2), ty = cy + dy - Math.floor(def.h / 2);
      let ok = true;
      for (let y = ty - 1; y <= ty + def.h && ok; y++) for (let x = tx - 1; x <= tx + def.w; x++) if (!inMap(x, y) || isBlocked(x, y) || !S.explored[idx(x, y)]) { ok = false; break; }
      if (ok) return [tx, ty];
    }
    return null;
  }
  function build(type, around) {
    const def = CFG.buildings[type]; if (!canAfford(def.cost) || reqMissing(def.req, 'player')) return false;
    const builders = mine(u => unitRole(u, 'builder') && u.state !== 'farming' && u.state !== 'building' && u.state !== 'toBuild');
    const hq = blds('hq')[0]; if (!hq || !builders.length) return false;
    const c = around || [Math.floor(hq.cx), Math.floor(hq.cy)];
    const sp = spotNear(type, c[0], c[1], around ? 2 : 3, around ? 8 : 12); if (!sp) return false;
    S.selected.units = [builders[0]]; const n = S.buildings.length; tryPlace(type, sp[0], sp[1]);
    return S.buildings.length > n;
  }
  bot.step = function () {
    if (S.time < bot.next) return; bot.next = S.time + P.stepEvery;
    const hq = blds('hq', true)[0]; if (!hq) return;
    const men = mine(u => u.type === 'frontiersman'), women = mine(u => u.type === 'frontierswoman'), workers = men.concat(women);
    const qn = t => hq.queue.filter(q => q.type === t).length;
    if (women.length + qn('frontierswoman') < P.women && (women.length <= men.length + 1 || men.length + qn('frontiersman') >= P.men)) tryTrain(hq, 'frontierswoman');
    else if (men.length + qn('frontiersman') < P.men) tryTrain(hq, 'frontiersman');
    const unbuilt = S.buildings.some(b => b.fac === 'player' && !b.built);
    const farm = blds('farm', true)[0], wh = blds('goldWarehouse', true)[0], wagons = mine(u => u.type === 'coveredWagon');
    if (farm) mark('farm'); if (wh) mark('warehouse');
    if (!unbuilt) {
      const goldNode = findNodeNear(T_GOLD, Math.floor(hq.cx), Math.floor(hq.cy), 30);
      const fields = blds('field');
      if (popUsed() + qcount() >= popCap() - 1) build('house');
      else if (!blds('farm').length) build('farm');
      else if (farm && fields.length < Math.min(P.fieldsMax, 2 + Math.floor(S.time / 300)) && S.res.food < 450) build('field', [Math.floor(farm.cx), Math.floor(farm.cy)]);
      else if (!blds('ranch').length) build('ranch');
      else if (!blds('sawmill').length) build('sawmill');
      else if (!blds('goldWarehouse').length && goldNode) build('goldWarehouse', goldNode);
      else if (wh && wagons.length && !blds('sheriffsOffice').length) build('sheriffsOffice');
      else if (blds('sheriffsOffice', true).length && !blds('fort').length) build('fort');
      else if (blds('fort', true).length && !blds('weaponsFactory').length) build('weaponsFactory');
      else if (blds('fort', true).length && !blds('trainingCamp').length) build('trainingCamp');
    }
    for (const t of ['sheriffsOffice', 'fort', 'weaponsFactory', 'trainingCamp', 'ranch', 'sawmill']) if (blds(t, true).length) mark(t);
    // wóz kryty: jeden, jak tylko są koń i magazyn; bezczynne wozy dowożą złoto
    const sm = blds('sawmill', true)[0];
    if (sm && wh && !wagons.length && !sm.queue.length) tryTrain(sm, 'coveredWagon');
    for (const w of wagons) if (wh && (w.state === 'idle')) executeOrder({ units: [w], x: wh.tx, y: wh.ty, targetUnit: null, targetHorse: null, silent: true });
    // obrona przed pierwszą wyprawą Desperado: kowboje z Rancza (tani, bez broni palnej), zanim Fort i Obóz szkoleniowy staną
    const ranchB = blds('ranch', true)[0], cow = mine(u => u.type === 'cowboy').length + (ranchB ? ranchB.queue.length : 0);
    if (ranchB && cow < 8 && ranchB.queue.length < 2 && S.res.food >= 140) tryTrain(ranchB, 'cowboy');
    const tc = blds('trainingCamp', true)[0];
    if (tc && tc.queue.length < 2) tryTrain(tc, 'infantryman');
    // wolne pola dostają kobiety nawet od drwali: żywność jest wąskim gardłem (robotnicy, konie)
    for (const f of blds('field', true)) if (!f.busy) {
      const w = women.find(u => !u.farm && ['idle', 'gather', 'toNode', 'toDeposit', 'deposit'].includes(u.state));
      if (w) { executeOrder({ units: [w], x: f.tx, y: f.ty, targetUnit: null, targetHorse: null, silent: true }); break; }
    }
    for (const w of workers.filter(u => u.state === 'idle')) {
      if (w.type === 'frontiersman') { if (!unbuilt) { if (wh && wagons.length) orderGatherAuto(w, T_GOLD); else orderGatherAuto(w, T_FOREST); } continue; }   // złoto dopiero, gdy jest wóz do dowozu: do tego czasu drewno
      const f = blds('field', true).find(x => !x.busy);
      if (f) executeOrder({ units: [w], x: f.tx, y: f.ty, targetUnit: null, targetHorse: null, silent: true });
      else orderGatherAuto(w, T_FOREST);
    }
    const army = mine(u => u.type === 'infantryman' || u.type === 'cavalrymanH' || u.type === 'cowboy');
    const ehq = S.buildings.find(b => b.fac === 'enemy' && b.type === 'hq');
    if (!bot.attacked && ehq && S.time >= P.attackAfter && army.length >= P.armyToAttack) {
      bot.attacked = true; executeOrder({ units: army, x: Math.floor(ehq.cx), y: Math.floor(ehq.cy), targetUnit: null, targetHorse: null, silent: true });
    }
    for (const t of [300, 600, 1200]) if (S.time >= t && !bot.log.res[t]) bot.log.res[t] = { wood: Math.floor(S.res.wood), food: Math.floor(S.res.food), gold: Math.floor(S.res.gold), guns: Math.floor(S.res.guns), army: army.length, workers: workers.length };
  };
  window.BOT = bot;
})();
