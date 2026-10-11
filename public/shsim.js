/* shsim.js — логика матча MAX SHOOTERS (работает у хозяина комнаты): раунды, экономика, бомба, боты, урон.
   Без графики и сети — только расчёты. */
(function (root) {
  var MXW = root.MXW, MXM = root.MXM;
  var Wp = MXW.W;
  var H_STAND = 1.8, H_CROUCH = 1.4, EYE = 1.62, EYE_C = 1.2, RAD = 0.42, GRAV = 22, JUMP = 7.0, STEP = MXM.STEP;
  var FREEZE = 5, ROUND_T = 115, END_T = 4.5, BUY_T = 20, PLANT_T = 3, DEFUSE_T = 10, DEFUSE_KIT_T = 5, BOMB_T = 40;
  var BOT_NAMES = ['Дима', 'Влад', 'Саша', 'Макс', 'Толя', 'Женя', 'Коля', 'Иван', 'Миша', 'Артём', 'Паша', 'Глеб', 'Рома', 'Лёха'];
  var DIFF = {
    easy: { react: 0.7, turn: 5, err: 5.5, burst: [2, 3], hold: 0.45 },
    mid: { react: 0.42, turn: 8, err: 3.2, burst: [3, 5], hold: 0.3 },
    hard: { react: 0.22, turn: 12, err: 1.5, burst: [4, 8], hold: 0.18 }
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function angDiff(a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
  function dirFromYaw(yaw, pitch) { var c = Math.cos(pitch); return [-Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c]; }
  function yawTo(dx, dz) { return Math.atan2(-dx, -dz); }

  /* ---------- движение (общее для хозяина, клиента и ботов) ---------- */
  function blockedAt(map, x, z, y, h) {
    var b = map.boxes, i, q;
    for (i = 0; i < b.length; i++) {
      q = b[i];
      if (x > q.x0 - RAD && x < q.x1 + RAD && z > q.z0 - RAD && z < q.z1 + RAD && q.y0 + q.h > y + STEP && q.y0 < y + h) return true;
    }
    return false;
  }
  // p: {x,y,z,vx,vy,vz,og(on ground),cr}; inp: {mx,mz,jump,crouch,walk,wspd}
  function stepMove(map, p, inp, dt) {
    var h = p.cr ? H_CROUCH : H_STAND;
    var want = inp.crouch ? 1 : 0;
    if (p.cr && !want) { if (!blockedAt(map, p.x, p.z, p.y + 0.0, H_STAND)) p.cr = 0; }
    else if (want) p.cr = 1;
    h = p.cr ? H_CROUCH : H_STAND;
    var sp = 6.3 * (inp.wspd || 1) * (p.cr ? 0.42 : 1) * (inp.walk ? 0.5 : 1);
    var tx = inp.mx * sp, tz = inp.mz * sp, acc = p.og ? 70 : 14, k = Math.min(1, acc * dt);
    p.vx += (tx - p.vx) * k; p.vz += (tz - p.vz) * k;
    var nx = p.x + p.vx * dt, nz = p.z + p.vz * dt;
    if (!blockedAt(map, nx, p.z, p.y, h)) p.x = nx; else p.vx = 0;
    if (!blockedAt(map, p.x, nz, p.y, h)) p.z = nz; else p.vz = 0;
    p.x = clamp(p.x, 0.6, map.w - 0.6); p.z = clamp(p.z, 0.6, map.d - 0.6);
    if (p.og && inp.jump && !p.cr) { p.vy = JUMP; p.og = false; }
    var g = MXM.groundAt(map, p.x, p.z, p.y);
    if (p.og) {
      if (g > p.y - 0.3 || g >= p.y) { p.y = g; }     // шагаем по ступеням/спускаемся без «полёта»
      else { p.og = false; }
    }
    if (!p.og) {
      p.vy -= GRAV * dt; p.y += p.vy * dt;
      g = MXM.groundAt(map, p.x, p.z, p.y - p.vy * dt);
      if (p.y <= g && p.vy <= 0) { p.y = g; p.vy = 0; p.og = true; }
    }
    return Math.sqrt(p.vx * p.vx + p.vz * p.vz);
  }

  /* ---------- лучи ---------- */
  function rayBox(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1) {
    var tmin = 0, tmax = 1e9, t1, t2, t;
    if (Math.abs(dx) < 1e-9) { if (ox < x0 || ox > x1) return -1; } else { t1 = (x0 - ox) / dx; t2 = (x1 - ox) / dx; if (t1 > t2) { t = t1; t1 = t2; t2 = t; } if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return -1; }
    if (Math.abs(dy) < 1e-9) { if (oy < y0 || oy > y1) return -1; } else { t1 = (y0 - oy) / dy; t2 = (y1 - oy) / dy; if (t1 > t2) { t = t1; t1 = t2; t2 = t; } if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return -1; }
    if (Math.abs(dz) < 1e-9) { if (oz < z0 || oz > z1) return -1; } else { t1 = (z0 - oz) / dz; t2 = (z1 - oz) / dz; if (t1 > t2) { t = t1; t1 = t2; t2 = t; } if (t1 > tmin) tmin = t1; if (t2 < tmax) tmax = t2; if (tmin > tmax) return -1; }
    return tmin;
  }
  function rayWorld(map, ox, oy, oz, dx, dy, dz, maxD) {
    var best = maxD, b = map.boxes, i, q, t;
    for (i = 0; i < b.length; i++) {
      q = b[i];
      t = rayBox(ox, oy, oz, dx, dy, dz, q.x0, q.y0, q.z0, q.x1, q.y0 + q.h, q.z1);
      if (t >= 0 && t < best) best = t;
    }
    return best;
  }

  /* ---------- Sim ---------- */
  function Sim(o) {
    this.o = {
      map: o.map || 'de_dust2', mode: o.mode || 'bomb', rtw: o.rtw || 5, diff: o.diff || 'mid', max: o.max || 10, bots: o.bots == null ? 4 : o.bots,
      allowed: o.allowed || MXW.presetSet('classic')
    };
    this.map = MXM.maps[this.o.map];
    if (!this.map.bomb && this.o.mode === 'bomb') this.o.mode = 'elim';
    this.nav = MXM.buildNav(this.map);
    this.players = []; this.nextId = 1; this.proj = []; this.smokes = []; this.events = [];
    this.time = 0; this.started = false; this.over = false;
    this.r = { n: 0, phase: 'lobby', t: 0, wins: { T: 0, CT: 0 }, lose: { T: 0, CT: 0 }, winner: '', why: '' };
    this.bomb = { st: 'none', carrier: 0, x: 0, y: 0, z: 0, t: 0, site: '', defBy: 0, defP: 0, planter: 0 };
    this.sendTo = function () {}; this.bcast = function () {};
    this.matchT = 0;
  }
  var P = Sim.prototype;

  P.emit = function (e) { this.events.push(e); };
  P.byId = function (id) { for (var i = 0; i < this.players.length; i++) if (this.players[i].id === id) return this.players[i]; return null; };
  P.teamPlayers = function (t) { return this.players.filter(function (p) { return p.team === t; }); };
  P.humans = function () { return this.players.filter(function (p) { return !p.bot; }); };
  P.mkPlayer = function (name, team, bot) {
    var p = {
      id: this.nextId++, name: name, team: team, bot: !!bot, x: 5, y: 0, z: 5, vx: 0, vy: 0, vz: 0, og: true, cr: 0, yaw: 0, pitch: 0,
      hp: 100, armor: 0, helm: false, kit: false, alive: false, money: this.o.mode === 'dm' ? 16000 : 800,
      k: 0, d: 0, hs: 0, plants: 0, defuses: 0, inv: { p: null, s: null, k: 'knife', g: [], bomb: false }, wid: 'knife', ammo: {},
      lastFire: 0, reloadT: 0, fireCd: 0, useOn: false, useT: 0, ping: 0, respawnT: 0, blind: 0, lastSeen: 0
    };
    if (bot) p.ai = { path: null, pi: 0, pathT: 0, tgt: 0, seen: 0, react: 0, burst: 0, burstT: 0, strafe: 1, strafeT: 0, goal: null, goalKind: '', stuckT: 0, lx: 0, lz: 0, scanT: 0, alert: null, site: '', look: 0, buyT: 0, yawWant: 0 };
    this.players.push(p);
    return p;
  };
  P.addHuman = function (name, team) {
    var T = this.teamPlayers('T').length, C = this.teamPlayers('CT').length;
    var t = team === 'T' || team === 'CT' ? team : (T <= C ? 'T' : 'CT');
    var p = this.mkPlayer(name, t, false);
    this.roster();
    return p;
  };
  P.removePlayer = function (id) {
    var p = this.byId(id); if (!p) return;
    if (this.bomb.carrier === id) this.dropBomb(p);
    this.players = this.players.filter(function (x) { return x.id !== id; });
    this.roster(); this.emit({ t: 'left', id: id, name: p.name });
  };
  P.setTeam = function (id, team) {
    var p = this.byId(id); if (!p || (team !== 'T' && team !== 'CT')) return;
    var n = this.teamPlayers(team).filter(function (x) { return !x.bot; }).length;
    if (n >= Math.ceil(this.o.max / 2)) return;
    p.team = team; this.roster();
  };
  P.roster = function () {
    this.emit({ t: 'roster', list: this.players.map(function (p) { return { id: p.id, n: p.name, tm: p.team, b: p.bot ? 1 : 0 }; }) });
  };

  /* --- боты: добавить/убрать, чтобы команды были ровными --- */
  P.fillBots = function () {
    var hum = this.humans().length, want = clamp(this.o.bots, 0, Math.max(0, this.o.max - hum));
    var bots = this.players.filter(function (p) { return p.bot; });
    var self = this;
    while (bots.length > want) {
      var rem = bots.pop(); this.players = this.players.filter(function (p) { return p !== rem; });
      if (this.bomb.carrier === rem.id) this.bomb.carrier = 0;
    }
    var used = {}; this.players.forEach(function (p) { used[p.name] = 1; });
    while (bots.length < want) {
      var T = this.teamPlayers('T').length, C = this.teamPlayers('CT').length;
      var nm; var guard = 0;
      do { nm = '[бот] ' + BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; guard++; } while (used[nm] && guard < 40);
      used[nm] = 1;
      var b = this.mkPlayer(nm, T <= C ? 'T' : 'CT', true); bots.push(b);
    }
    // выравниваем: переводим ботов из большей команды в меньшую
    var guard2 = 0;
    for (;;) {
      var t = this.teamPlayers('T'), c = this.teamPlayers('CT');
      if (Math.abs(t.length - c.length) <= 1 || guard2++ > 20) break;
      var big = t.length > c.length ? t : c, small = t.length > c.length ? 'CT' : 'T';
      var mv = big.filter(function (p) { return p.bot; })[0];
      if (!mv) break;
      mv.team = small;
    }
    this.roster();
  };

  /* --- оружие --- */
  P.allowedList = function (team, grp) {
    var a = this.o.allowed, out = [];
    MXW.ORDER.forEach(function (id) { var w = Wp[id]; if (a[id] && (!w.team || w.team === team) && (!grp || w.grp === grp)) out.push(id); });
    return out;
  };
  P.isAllowed = function (id) { return !!this.o.allowed[id]; };
  P.giveWeapon = function (p, id) {
    var w = Wp[id]; if (!w) return;
    if (w.slot === 1) p.inv.p = id; else if (w.slot === 2) p.inv.s = id; else if (w.slot === 3) p.inv.k = id;
    else if (w.slot === 4) { if (p.inv.g.indexOf(id) < 0) p.inv.g.push(id); }
    if (p.bot) p.ammo[id] = { mag: w.mag, res: w.res };
  };
  P.defaultKit = function (p) {
    p.inv = { p: null, s: null, k: this.isAllowed('bknife') && !this.isAllowed('knife') ? 'bknife' : 'knife', g: [], bomb: false };
    var pistols = this.allowedList(p.team, 'Пистолеты');
    var pref = p.team === 'T' ? 'glock' : 'usp';
    var pick = pistols.indexOf(pref) >= 0 ? pref : pistols[0];
    var anyOther = MXW.ORDER.some(function (id) { return false; });
    if (pick && this.o.allowed[pick]) this.giveWeapon(p, pick);
    // если пистолетов нет, но есть другое оружие — выдаём самое дешёвое из доступных основных
    if (!pick) {
      var alt = this.allowedList(p.team).filter(function (id) { var w = Wp[id]; return w.slot === 1; }).sort(function (a, b) { return Wp[a].price - Wp[b].price; })[0];
      if (alt && this.o.mode === 'dm') this.giveWeapon(p, alt);
    }
    this.pickBest(p);
  };
  P.pickBest = function (p) { p.wid = p.inv.p || p.inv.s || p.inv.k; if (p.bot) { var a = p.ammo[p.wid]; if (!a && Wp[p.wid].mag) p.ammo[p.wid] = { mag: Wp[p.wid].mag, res: Wp[p.wid].res }; } };
  P.owns = function (p, id) { return p.inv.p === id || p.inv.s === id || p.inv.k === id || p.inv.g.indexOf(id) >= 0; };
  P.sendInv = function (p) {
    if (p.bot) return;
    this.sendTo(p.id, { t: 'inv', p: p.inv.p, s: p.inv.s, k: p.inv.k, g: p.inv.g, bomb: p.inv.bomb ? 1 : 0, armor: p.armor, helm: p.helm ? 1 : 0, kit: p.kit ? 1 : 0, money: p.money, wid: p.wid });
  };
  P.buy = function (p, id, silent) {
    if (!p.alive) return false;
    var okTime = this.o.mode === 'dm' || this.r.phase === 'freeze' || (this.r.phase === 'live' && this.r.t > ROUND_T - BUY_T);
    if (!okTime) { if (!silent) this.sendTo(p.id, { t: 'msg', m: 'Время покупки закончилось' }); return false; }
    var eq = MXW.EQ[id], w = Wp[id];
    if (!eq && !w) return false;
    var price = eq ? eq.price : w.price;
    if (!eq && !this.isAllowed(id)) { if (!silent) this.sendTo(p.id, { t: 'msg', m: 'Это оружие запрещено в комнате' }); return false; }
    if ((eq && eq.team && eq.team !== p.team) || (w && w.team && w.team !== p.team)) { if (!silent) this.sendTo(p.id, { t: 'msg', m: 'Оружие чужой команды' }); return false; }
    if (p.money < price) { if (!silent) this.sendTo(p.id, { t: 'msg', m: 'Не хватает денег' }); return false; }
    if (eq) {
      if (id === 'defuse') { if (p.kit) return false; p.kit = true; }
      else if (id === 'kevlar') { if (p.armor >= 100) return false; p.armor = 100; }
      else if (id === 'kevhelm') { if (p.armor >= 100 && p.helm) return false; p.armor = 100; p.helm = true; }
    } else {
      if (w.slot === 3) return false;
      if (w.slot === 4) { if (p.inv.g.length >= 4 || p.inv.g.indexOf(id) >= 0) return false; }
      else if ((w.slot === 1 && p.inv.p === id) || (w.slot === 2 && p.inv.s === id)) return false;
      this.giveWeapon(p, id);
      if (w.slot !== 4) p.wid = id;
    }
    p.money -= price;
    this.sendInv(p);
    return true;
  };

  /* --- старт матча и раундов --- */
  P.startMatch = function () {
    if (this.started) return;
    this.started = true;
    this.fillBots();
    this.r.wins = { T: 0, CT: 0 }; this.r.lose = { T: 0, CT: 0 };
    this.r.n = 0; this.matchT = 0;
    this.players.forEach(function (p) { p.k = p.d = p.hs = p.plants = p.defuses = 0; p.alive = false; p.money = this.o.mode === 'dm' ? 16000 : 800; p.inv = null; }, this);
    this.players.forEach(function (p) { this.defaultKit(p); p.armor = 0; p.helm = false; p.kit = false; }, this);
    this.emit({ t: 'start' });
    this.newRound(true);
  };
  P.spawnPoint = function (team, idx) {
    var s = (team === 'T' ? this.map.spawnT : this.map.spawnCT);
    var q = s[idx % s.length];
    return q;
  };
  P.newRound = function (first) {
    var self = this, r = this.r;
    r.n++; r.phase = this.o.mode === 'dm' ? 'live' : 'freeze'; r.t = r.phase === 'live' ? 480 : FREEZE; r.winner = ''; r.why = '';
    this.proj = []; this.smokes = [];
    this.bomb = { st: 'none', carrier: 0, x: 0, y: 0, z: 0, t: 0, site: '', defBy: 0, defP: 0, planter: 0 };
    if (!first) this.fillBots();
    var cnt = { T: 0, CT: 0 };
    var ts = this.teamPlayers('T');
    this.players.forEach(function (p) {
      var wasAlive = p.alive;
      if (!wasAlive) { self.defaultKit(p); p.armor = 0; p.helm = false; p.kit = false; }
      else { p.inv.bomb = false; }
      if (!p.inv) self.defaultKit(p);
      if (p.team === 'CT' ) { /* набор сапёра остаётся */ } else p.kit = false;
      var sp = self.spawnPoint(p.team, cnt[p.team]++);
      p.x = sp[0]; p.z = sp[1]; p.y = 0; p.vx = p.vz = p.vy = 0; p.og = true; p.cr = 0; p.yaw = sp[2]; p.pitch = 0;
      p.hp = 100; p.alive = true; p.useOn = false; p.useT = 0; p.reloadT = 0; p.blind = 0; p.respawnT = 0;
      if (!wasAlive && p.bot) p.ammo = {};
      self.pickBest(p);
      if (p.bot) { Object.keys(p.inv).forEach(function () {}); [p.inv.p, p.inv.s, p.inv.k].concat(p.inv.g).forEach(function (id) { if (id && Wp[id].mag && !p.ammo[id]) p.ammo[id] = { mag: Wp[id].mag, res: Wp[id].res }; }); var ai = p.ai; ai.path = null; ai.tgt = 0; ai.goal = null; ai.alert = null; ai.buyT = rnd(0.3, 1.2); ai.site = ''; ai.look = 0; }
    });
    if (this.o.mode === 'bomb' && ts.length) {
      var c = ts[Math.floor(Math.random() * ts.length)];
      c.inv.bomb = true; this.bomb.st = 'carried'; this.bomb.carrier = c.id;
    }
    if (this.o.mode === 'dm') this.players.forEach(function (p) { p.money = 16000; });
    this.players.forEach(function (p) { self.sendInv(p); });
    this.emit({ t: 'round', n: r.n, sc: [r.wins.T, r.wins.CT] });
  };

  P.dropBomb = function (p) {
    if (!p.inv.bomb) return;
    p.inv.bomb = false; this.bomb.st = 'dropped'; this.bomb.carrier = 0;
    this.bomb.x = p.x; this.bomb.y = p.y; this.bomb.z = p.z;
    this.emit({ t: 'bombdrop' });
  };

  /* --- урон --- */
  P.damage = function (victim, att, dmg, zone, wid, hx, hy, hz) {
    if (!victim.alive || this.r.phase === 'freeze' || this.r.phase === 'over') return;
    if (att && att !== victim && this.o.mode !== 'dm' && att.team === victim.team) return;
    var w = Wp[wid] || Wp.knife;
    var ratio = w.armor || 0.7;
    var hpd = dmg, ad = 0;
    if (victim.armor > 0 && (zone !== 'head' || victim.helm)) {
      hpd = dmg * ratio; ad = (dmg - hpd) * 0.5;
      if (ad > victim.armor) { hpd += (ad - victim.armor) * 2; ad = victim.armor; }
      victim.armor = Math.max(0, victim.armor - ad);
    }
    hpd = Math.round(hpd);
    victim.hp -= hpd;
    if (!victim.bot) this.sendTo(victim.id, { t: 'hurt', d: hpd, from: att ? [att.x, att.z] : null, hp: Math.max(0, victim.hp), ar: Math.round(victim.armor) });
    if (att && !att.bot && att !== victim) this.sendTo(att.id, { t: 'hit', hs: zone === 'head' ? 1 : 0, d: hpd, kill: victim.hp <= 0 ? 1 : 0 });
    if (victim.bot && att) { victim.ai.alert = { x: att.x, z: att.z, t: 3 }; }
    if (victim.hp <= 0) this.kill(victim, att, wid, zone === 'head');
  };
  P.kill = function (v, att, wid, hs) {
    if (!v.alive) return;
    v.alive = false; v.hp = 0; v.d++;
    if (v.inv.bomb) this.dropBomb(v);
    v.useOn = false; v.useT = 0;
    var self = this;
    if (att && att !== v) {
      att.k++; if (hs) att.hs++;
      var w = Wp[wid] || Wp.knife;
      att.money = Math.min(16000, att.money + (w.kill != null ? w.kill : 300));
      this.sendInv(att);
    } else if (att === v) { v.k = Math.max(0, v.k - 1); }
    this.emit({ t: 'kill', a: att ? att.id : 0, v: v.id, w: wid, hs: hs ? 1 : 0 });
    if (this.o.mode === 'dm') { v.respawnT = 3; return; }
    this.checkEnd();
  };

  P.aliveCount = function (t) { var n = 0; this.players.forEach(function (p) { if (p.team === t && p.alive) n++; }); return n; };
  P.checkEnd = function () {
    var r = this.r;
    if (r.phase !== 'live' || this.o.mode === 'dm') return;
    var T = this.aliveCount('T'), C = this.aliveCount('CT');
    var tTot = this.teamPlayers('T').length, cTot = this.teamPlayers('CT').length;
    var bombPlanted = this.bomb.st === 'planted';
    if (bombPlanted) { if (C === 0 && cTot > 0) this.endRound('T', 'Все контр-террористы уничтожены'); return; }
    if (T === 0 && tTot > 0 && cTot > 0) this.endRound('CT', 'Все террористы уничтожены');
    else if (C === 0 && cTot > 0 && tTot > 0) this.endRound('T', 'Все контр-террористы уничтожены');
  };
  P.endRound = function (winner, why) {
    var r = this.r, self = this;
    if (r.phase !== 'live') return;
    r.phase = 'end'; r.t = END_T; r.winner = winner; r.why = why;
    r.wins[winner]++;
    var loser = winner === 'T' ? 'CT' : 'T';
    r.lose[winner] = 0; r.lose[loser] = Math.min(4, r.lose[loser] + 1);
    this.players.forEach(function (p) {
      var add;
      if (p.team === winner) add = 3250;
      else { add = 1400 + 500 * Math.max(0, r.lose[loser] - 1); if (p.team === 'T' && self.bomb.st === 'planted') add += 800; }
      p.money = Math.min(16000, p.money + add); self.sendInv(p);
    });
    this.emit({ t: 'rend', w: winner, why: why, sc: [r.wins.T, r.wins.CT] });
    this.bomb.defP = 0;
    if (r.wins[winner] >= this.o.rtw) { r.phase = 'over'; this.over = true; this.emit({ t: 'over', w: winner, sc: [r.wins.T, r.wins.CT], stats: this.stats() }); }
  };
  P.stats = function () {
    var o = {}; this.players.forEach(function (p) { o[p.id] = { n: p.name, tm: p.team, k: p.k, d: p.d, hs: p.hs, pl: p.plants, df: p.defuses }; }); return o;
  };

  /* --- попадания --- */
  P.traceShot = function (att, ox, oy, oz, dx, dy, dz, maxD, wid, dmgBase) {
    var tw = rayWorld(this.map, ox, oy, oz, dx, dy, dz, maxD), best = tw, hitP = null, zone = '', i, p, h, t, hy;
    for (i = 0; i < this.players.length; i++) {
      p = this.players[i];
      if (!p.alive || p === att) continue;
      if (att && this.o.mode !== 'dm' && p.team === att.team) continue;
      h = p.cr ? H_CROUCH : H_STAND;
      t = rayBox(ox, oy, oz, dx, dy, dz, p.x - 0.34, p.y, p.z - 0.34, p.x + 0.34, p.y + h, p.z + 0.34);
      if (t >= 0 && t < best) { best = t; hitP = p; hy = oy + dy * t - p.y; zone = hy > h - 0.3 ? 'head' : (hy < 0.65 ? 'legs' : 'body'); }
    }
    return { t: best, p: hitP, zone: zone };
  };
  P.applyHit = function (att, r, ox, oy, oz, dx, dy, dz, wid, dmgBase) {
    if (!r.p) return;
    var w = Wp[wid];
    var mult = r.zone === 'head' ? 4 : (r.zone === 'legs' ? 0.75 : 1);
    var fall = Math.pow(w.rng, r.t / 12.5);
    this.damage(r.p, att, dmgBase * mult * fall, r.zone, wid, ox + dx * r.t, oy + dy * r.t, oz + dz * r.t);
  };
  // выстрел из хитскан-оружия (сам игрок передаёт направление уже с разбросом)
  P.shoot = function (att, wid, ox, oy, oz, dx, dy, dz) {
    var w = Wp[wid], n = w.pel || 1, i, first = null, len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= len; dy /= len; dz /= len;
    for (i = 0; i < n; i++) {
      var ddx = dx, ddy = dy, ddz = dz;
      if (i > 0) { var s = (w.spread * 0.6) * Math.PI / 180; ddx += (Math.random() - 0.5) * 2 * s; ddy += (Math.random() - 0.5) * 2 * s; ddz += (Math.random() - 0.5) * 2 * s; var l2 = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz); ddx /= l2; ddy /= l2; ddz /= l2; }
      var r = this.traceShot(att, ox, oy, oz, ddx, ddy, ddz, 150, wid);
      if (!first) first = { x: ox + ddx * r.t, y: oy + ddy * r.t, z: oz + ddz * r.t, p: r.p ? 1 : 0 };
      this.applyHit(att, r, ox, oy, oz, ddx, ddy, ddz, wid, w.dmg);
    }
    this.emit({ t: 'shot', id: att.id, w: wid, o: [ox, oy, oz], e: [first.x, first.y, first.z], hp: first.p });
    var self = this;
    this.players.forEach(function (b) { // боты слышат выстрелы
      if (b.bot && b.alive && b.team !== att.team && b.ai) { var d = Math.hypot(b.x - att.x, b.z - att.z); if (d < 38 && !b.ai.tgt) b.ai.alert = { x: att.x, z: att.z, t: 3 }; }
    });
  };
  P.melee = function (att, alt) {
    var wid = att.wid, w = Wp[wid]; if (w.slot !== 3) wid = att.inv.k;
    w = Wp[wid];
    var d = dirFromYaw(att.yaw, att.pitch), eye = (att.cr ? EYE_C : EYE), best = null, bt = 2.4;
    var oy = att.y + eye;
    for (var i = 0; i < this.players.length; i++) {
      var p = this.players[i];
      if (!p.alive || p === att || (this.o.mode !== 'dm' && p.team === att.team)) continue;
      var h = p.cr ? H_CROUCH : H_STAND;
      var t = rayBox(att.x, oy, att.z, d[0], d[1], d[2], p.x - 0.5, p.y, p.z - 0.5, p.x + 0.5, p.y + h, p.z + 0.5);
      if (t >= 0 && t < bt) { bt = t; best = p; }
    }
    this.emit({ t: 'stab', id: att.id, alt: alt ? 1 : 0 });
    if (best) {
      var tw = rayWorld(this.map, att.x, oy, att.z, d[0], d[1], d[2], bt);
      if (tw < bt - 0.05) return;
      // удар в спину сильнее
      var vf = dirFromYaw(best.yaw, 0), back = (vf[0] * d[0] + vf[2] * d[2]) > 0.5;
      this.damage(best, att, (alt ? w.alt : w.dmg) * (back && alt ? 1.8 : 1), 'body', wid);
    }
  };

  /* --- снаряды --- */
  P.launch = function (att, wid, ox, oy, oz, dx, dy, dz, kind) {
    var w = Wp[wid], len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1; dx /= len; dy /= len; dz /= len;
    var pr = w.proj || {}, sp = pr.speed || 14, id = this.nextId++;
    var o = { id: id, kind: kind || (wid === 'rpg' ? 'rocket' : (wid === 'm79' ? 'grenade' : (wid === 'bknife' ? 'blade' : wid))), wid: wid, owner: att.id, team: att.team, x: ox, y: oy, z: oz,
      vx: dx * sp, vy: dy * sp, vz: dz * sp, g: pr.g || 0, t: 0, fuse: pr.fuse || 3, splash: pr.splash || 0, rad: pr.rad || 0, stopped: 0 };
    this.proj.push(o);
    this.emit({ t: 'launch', id: att.id, w: wid, o: [ox, oy, oz] });
  };
  P.throwNade = function (att, nid, ox, oy, oz, dx, dy, dz) {
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1; dx /= len; dy /= len; dz /= len;
    var o = { id: this.nextId++, kind: nid, wid: nid, owner: att.id, team: att.team, x: ox, y: oy, z: oz, vx: dx * 15 + att.vx * 0.5, vy: dy * 15 + 2.2, vz: dz * 15 + att.vz * 0.5, g: 18, t: 0, fuse: nid === 'smoke' ? 2.0 : (nid === 'flash' ? 1.5 : 1.8), splash: 0, rad: 0, stopped: 0, bounce: 1 };
    this.proj.push(o);
    this.emit({ t: 'throw', id: att.id, w: nid });
  };
  P.explode = function (o) {
    var self = this, att = this.byId(o.owner);
    if (o.kind === 'smoke') { this.smokes.push({ x: o.x, y: o.y, z: o.z, t: 18 }); this.emit({ t: 'smoke', x: o.x, y: o.y, z: o.z }); return; }
    if (o.kind === 'flash') {
      this.emit({ t: 'flash', x: o.x, y: o.y, z: o.z });
      this.players.forEach(function (p) {
        if (!p.alive || !p.bot) return;
        var d = Math.hypot(p.x - o.x, p.z - o.z); if (d > 30) return;
        var dir = [o.x - p.x, o.y - (p.y + 1.5), o.z - p.z], l = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
        var t = rayWorld(self.map, p.x, p.y + 1.5, p.z, dir[0] / l, dir[1] / l, dir[2] / l, l);
        if (t < l - 0.2) return;
        var f = dirFromYaw(p.yaw, 0);
        if ((f[0] * dir[0] + f[2] * dir[2]) / l > -0.3) p.blind = Math.max(p.blind, 3.5 * (1 - d / 32));
      });
      return;
    }
    var rad = o.kind === 'he' ? 9 : o.rad, dmg = o.kind === 'he' ? 100 : o.splash;
    this.emit({ t: 'boom', x: o.x, y: o.y, z: o.z, r: rad, k: o.kind });
    this.players.forEach(function (p) {
      if (!p.alive) return;
      var cx = p.x, cy = p.y + 1.0, cz = p.z, d = Math.sqrt((cx - o.x) * (cx - o.x) + (cy - o.y) * (cy - o.y) + (cz - o.z) * (cz - o.z));
      if (d > rad) return;
      var dx = (cx - o.x) / (d || 1), dy = (cy - o.y) / (d || 1), dz = (cz - o.z) / (d || 1);
      var t = rayWorld(self.map, o.x, o.y + 0.1, o.z, dx, dy, dz, d);
      if (t < d - 0.4) return;
      var f = Math.pow(1 - d / rad, 1.1), dm = dmg * f;
      if (att === p) dm *= 0.5;
      self.damage(p, att, dm, 'body', o.wid === 'he' ? 'he' : o.wid);
    });
  };
  P.stepProj = function (dt) {
    var self = this, keep = [];
    this.proj.forEach(function (o) {
      o.t += dt;
      if (o.g) o.vy -= o.g * dt;
      var dist = Math.sqrt(o.vx * o.vx + o.vy * o.vy + o.vz * o.vz) * dt, steps = Math.max(1, Math.ceil(dist / 0.4)), sdt = dt / steps, dead = false;
      for (var s = 0; s < steps && !dead; s++) {
        var nx = o.x + o.vx * sdt, ny = o.y + o.vy * sdt, nz = o.z + o.vz * sdt;
        // пол
        if (ny < 0.1) { ny = 0.1; if (o.bounce) { o.vy = -o.vy * 0.4; o.vx *= 0.7; o.vz *= 0.7; } else { dead = true; } }
        // блоки
        var hit = false, b = self.map.boxes;
        for (var i = 0; i < b.length; i++) {
          var q = b[i];
          if (nx > q.x0 && nx < q.x1 && nz > q.z0 && nz < q.z1 && ny > q.y0 && ny < q.y0 + q.h) {
            hit = true;
            if (o.bounce) {
              var px = o.x > q.x0 && o.x < q.x1, pz = o.z > q.z0 && o.z < q.z1;
              if (!px) { o.vx = -o.vx * 0.5; nx = o.x; } else if (!pz) { o.vz = -o.vz * 0.5; nz = o.z; } else { o.vy = Math.abs(o.vy) * 0.4; ny = q.y0 + q.h + 0.05; o.vx *= 0.7; o.vz *= 0.7; }
              hit = false;
            }
            break;
          }
        }
        if (hit) { dead = true; }
        o.x = nx; o.y = ny; o.z = nz;
        if (!o.bounce) { // игроки
          for (var j = 0; j < self.players.length; j++) {
            var p = self.players[j];
            if (!p.alive || p.id === o.owner) continue;
            if (self.o.mode !== 'dm' && p.team === o.team) continue;
            var h = p.cr ? H_CROUCH : H_STAND;
            if (o.x > p.x - 0.4 && o.x < p.x + 0.4 && o.z > p.z - 0.4 && o.z < p.z + 0.4 && o.y > p.y && o.y < p.y + h) {
              if (o.kind === 'blade') self.damage(p, self.byId(o.owner), Wp.bknife.alt, o.y > p.y + h - 0.3 ? 'head' : 'body', 'bknife');
              dead = true; break;
            }
          }
        }
      }
      if (o.bounce && o.t > 0.4) { var sp = o.vx * o.vx + o.vz * o.vz; if (sp < 0.3 && o.y < 0.3) o.stopped = 1; }
      if (!dead && o.bounce && o.t >= o.fuse) dead = true;
      if (!dead && !o.bounce && o.kind !== 'blade' && o.t >= o.fuse) dead = true;
      if (!dead && o.t > 6) dead = true;
      if (dead) { if (o.kind !== 'blade') self.explode(o); }
      else keep.push(o);
    });
    this.proj = keep;
  };
  /* --- ввод от людей --- */
  P.input = function (id, m) {
    var p = this.byId(id); if (!p || p.bot || !p.alive) return;
    if (this.r.phase === 'freeze') { p.yaw = +m.yaw || 0; p.pitch = clamp(+m.pitch || 0, -1.5, 1.5); return; } // в заморозке стоим на месте
    var nx = +m.x, ny = +m.y, nz = +m.z;
    if (isFinite(nx) && isFinite(ny) && isFinite(nz)) {
      var d = Math.hypot(nx - p.x, nz - p.z);
      if (d < 4) { p.x = clamp(nx, 0.5, this.map.w - 0.5); p.z = clamp(nz, 0.5, this.map.d - 0.5); p.y = clamp(ny, -1, 12); }
      else { p.x += (nx - p.x) * 0.3; p.z += (nz - p.z) * 0.3; }
    }
    p.yaw = +m.yaw || 0; p.pitch = clamp(+m.pitch || 0, -1.5, 1.5); p.cr = m.cr ? 1 : 0;
    if (m.wid && this.owns(p, m.wid)) p.wid = m.wid;
    p.speed = +m.sp || 0;
  };
  P.humanFire = function (id, m) {
    var p = this.byId(id); if (!p || !p.alive || this.r.phase === 'freeze' || this.r.phase === 'over') return;
    var wid = m.wid; if (!this.owns(p, wid)) return;
    var w = Wp[wid], now = this.time;
    var gap = 60 / Math.max(30, w.rpm) * 0.7;
    if (now - p.lastFire < gap && w.slot !== 4) return;
    p.lastFire = now; p.wid = wid;
    var eye = p.y + (p.cr ? EYE_C : EYE);
    var d = [+m.dx, +m.dy, +m.dz]; if (!isFinite(d[0] + d[1] + d[2])) return;
    if (w.slot === 3) { if (wid === 'bknife' && m.alt) { this.launch(p, 'bknife', p.x + d[0] * 0.5, eye, p.z + d[2] * 0.5, d[0], d[1], d[2]); } else this.melee(p, !!m.alt); return; }
    if (w.slot === 4) {
      if (p.inv.g.indexOf(wid) < 0) return;
      p.inv.g.splice(p.inv.g.indexOf(wid), 1); this.throwNade(p, wid, p.x + d[0] * 0.5, eye, p.z + d[2] * 0.5, d[0], d[1], d[2]);
      this.sendInv(p); return;
    }
    if (w.proj) { this.launch(p, wid, p.x + d[0] * 0.6, eye, p.z + d[2] * 0.6, d[0], d[1], d[2]); return; }
    this.shoot(p, wid, p.x, eye, p.z, d[0], d[1], d[2]);
  };
  P.use = function (id, on) { var p = this.byId(id); if (p) { p.useOn = !!on; if (!on) p.useT = 0; } };
  P.humanBuy = function (id, item) { var p = this.byId(id); if (p) this.buy(p, item); };

  /* --- бомба: закладка и разминирование, подбор --- */
  P.inSite = function (x, z) {
    var s = this.map.sites;
    for (var i = 0; i < s.length; i++) if (Math.hypot(x - s[i].x, z - s[i].z) < s[i].r) return s[i];
    return null;
  };
  P.stepBomb = function (dt) {
    var b = this.bomb, self = this;
    if (this.o.mode !== 'bomb') return;
    if (b.st === 'dropped') {
      this.players.forEach(function (p) {
        if (b.st === 'dropped' && p.alive && p.team === 'T' && Math.hypot(p.x - b.x, p.z - b.z) < 1.4 && Math.abs(p.y - b.y) < 1.5) {
          p.inv.bomb = true; b.st = 'carried'; b.carrier = p.id; self.sendInv(p); self.emit({ t: 'bombpick', id: p.id });
        }
      });
    }
    this.players.forEach(function (p) {
      if (!p.alive) return;
      // закладка
      if (p.team === 'T' && p.inv.bomb && b.st === 'carried') {
        var site = self.inSite(p.x, p.z), spd = Math.hypot(p.vx || 0, p.vz || 0) + (p.bot ? 0 : (p.speed || 0));
        if (p.useOn && site && spd < 1.6) {
          p.useT += dt; b.plantP = p.useT;
          if (p.useT >= PLANT_T) {
            p.useT = 0; p.useOn = false; p.inv.bomb = false;
            b.st = 'planted'; b.x = p.x; b.y = p.y; b.z = p.z; b.t = BOMB_T; b.site = site.n; b.planter = p.id; b.carrier = 0; b.plantP = 0;
            p.plants++; p.money = Math.min(16000, p.money + 300); self.sendInv(p);
            self.emit({ t: 'planted', id: p.id, site: site.n });
          }
        } else if (p.useT) { p.useT = 0; b.plantP = 0; }
      }
      // разминирование
      if (p.team === 'CT' && b.st === 'planted') {
        var near = Math.hypot(p.x - b.x, p.z - b.z) < 2.4, spd2 = p.bot ? Math.hypot(p.vx, p.vz) : (p.speed || 0);
        if (p.useOn && near && spd2 < 1.6) {
          if (b.defBy !== p.id) { b.defBy = p.id; b.defP = 0; }
          b.defP += dt;
          var need = p.kit ? DEFUSE_KIT_T : DEFUSE_T;
          if (b.defP >= need) {
            b.st = 'defused'; b.defP = 0; p.defuses++; p.money = Math.min(16000, p.money + 300); self.sendInv(p);
            self.emit({ t: 'defused', id: p.id });
            self.r.phase = 'live'; self.endRound('CT', 'Бомба обезврежена');
          }
        } else if (b.defBy === p.id) { b.defBy = 0; b.defP = 0; }
      }
    });
    if (b.st === 'planted') {
      b.t -= dt;
      if (b.t <= 0) {
        b.st = 'exploded'; b.t = 0;
        this.emit({ t: 'boom', x: b.x, y: b.y + 0.3, z: b.z, r: 38, k: 'c4' });
        this.players.forEach(function (p) {
          if (!p.alive) return;
          var d = Math.hypot(p.x - b.x, p.z - b.z);
          if (d < 38) self.damage(p, self.byId(b.planter), 400 * (1 - d / 38), 'body', 'he');
        });
        if (this.r.phase === 'live') this.endRound('T', 'Бомба взорвалась');
        else if (this.r.phase === 'end') {}
      }
    }
  };

  /* --- основной шаг --- */
  P.tick = function (dt) {
    if (!this.started) return;
    this.time += dt;
    var r = this.r, self = this;
    this.smokes = this.smokes.filter(function (s) { s.t -= dt; return s.t > 0; });
    if (r.phase === 'freeze') {
      r.t -= dt;
      this.players.forEach(function (p) { if (p.bot) self.botBuy(p, dt); });
      if (r.t <= 0) { r.phase = 'live'; r.t = ROUND_T; this.emit({ t: 'live' }); }
    } else if (r.phase === 'live') {
      r.t -= dt; this.matchT += dt;
      if (this.o.mode === 'dm') {
        this.players.forEach(function (p) { if (!p.alive && (p.respawnT -= dt) <= 0) self.respawn(p); if (p.bot) self.botBuy(p, dt); });
        var top = this.players.slice().sort(function (a, b) { return b.k - a.k; })[0];
        if (r.t <= 0 || (top && top.k >= 30)) { r.phase = 'over'; this.over = true; this.emit({ t: 'over', w: top ? top.name : '', sc: [0, 0], stats: this.stats(), dm: 1 }); }
      } else {
        this.players.forEach(function (p) { if (p.bot) self.botBuy(p, dt); });
        if (r.t <= 0 && this.bomb.st !== 'planted') { this.endRound('CT', 'Время вышло'); }
      }
    } else if (r.phase === 'end') {
      r.t -= dt;
      if (r.t <= 0) this.newRound(false);
    }
    if (r.phase === 'live' || r.phase === 'end') {
      this.players.forEach(function (p) { if (p.bot && p.alive) self.botThink(p, dt); });
      this.stepProj(dt);
      this.stepBomb(dt);
      if (r.phase === 'live') this.checkEnd();
    }
    this.players.forEach(function (p) { if (p.blind > 0) p.blind -= dt; });
  };
  P.respawn = function (p) {
    var idx = Math.floor(Math.random() * 10), sp = this.spawnPoint(Math.random() < 0.5 ? 'T' : 'CT', idx);
    p.x = sp[0]; p.z = sp[1]; p.y = 0; p.hp = 100; p.alive = true; p.armor = 0; p.vx = p.vz = p.vy = 0; p.og = true; p.yaw = sp[2];
    this.defaultKit(p); p.money = 16000; if (p.bot) { p.ammo = {}; p.ai.path = null; this.botBuy(p, 99, true); }
    this.sendInv(p); this.emit({ t: 'spawn', id: p.id });
  };

  /* ---------- снимок для клиентов ---------- */
  P.snapshot = function () {
    var r = this.r, b = this.bomb, ph = { lobby: 0, freeze: 0, live: 1, end: 2, over: 3 }[r.phase];
    var self = this;
    return {
      t: 's', ph: ph, tm: Math.round(r.t * 10) / 10, sc: [r.wins.T, r.wins.CT], rn: r.n, win: r.winner, why: r.why,
      b: [{ none: 0, carried: 1, dropped: 2, planted: 3, defused: 4, exploded: 5 }[b.st], Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10, Math.round(b.z * 10) / 10, Math.round(b.t * 10) / 10, Math.round((b.defP || 0) * 10) / 10, b.carrier, Math.round((b.plantP || 0) * 10) / 10],
      p: this.players.map(function (p) {
        return [p.id, Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, Math.round(p.z * 100) / 100, Math.round(p.yaw * 100) / 100, Math.round(p.pitch * 100) / 100,
          Math.max(0, Math.round(p.hp)), Math.round(p.armor), p.alive ? 1 : 0, p.cr, p.wid, p.money, p.k, p.d, p.team === 'T' ? 0 : 1, p.bot ? Math.round(Math.hypot(p.vx, p.vz) * 10) / 10 : Math.round((p.speed || 0) * 10) / 10];
      }),
      pr: this.proj.map(function (o) { return [o.id, o.kind, Math.round(o.x * 10) / 10, Math.round(o.y * 10) / 10, Math.round(o.z * 10) / 10]; })
    };
  };
  P.drainEvents = function () { var e = this.events; this.events = []; return e; };

  /* ======================= БОТЫ ======================= */
  P.botBuy = function (p, dt, force) {
    var ai = p.ai; if (!ai || ai.bought === this.r.n && !force) return;
    ai.buyT -= dt; if (ai.buyT > 0 && !force) return;
    ai.bought = this.r.n;
    var self = this, team = p.team, list = this.allowedList(team), has = function (id) { return list.indexOf(id) >= 0; };
    var tryBuy = function (id) { return has(id) || MXW.EQ[id] ? self.buy(p, id, true) : false; };
    if (this.o.mode === 'dm') { // в DM боты берут любое доступное основное оружие
      var prim = list.filter(function (id) { return Wp[id].slot === 1; });
      if (prim.length) { var pick = prim[Math.floor(Math.random() * prim.length)]; self.buy(p, pick, true); }
      this.pickBest(p); return;
    }
    if (!p.inv.p) {
      var wants;
      if (team === 'T') wants = ['awp', 'ak47', 'sg552', 'galil', 'g3sg1', 'm249', 'mac10', 'p90', 'ump45', 'mp5', 'xm1014', 'm3'];
      else wants = ['awp', 'm4a1', 'aug', 'famas', 'sg550', 'm249', 'p90', 'mp5', 'ump45', 'tmp', 'xm1014', 'm3'];
      wants = wants.concat(['blaser', 'stw25', 'm87t', 'mp5k4', 'scout']);
      var order = Math.random() < 0.18 ? wants : wants.filter(function (id) { return id !== 'awp' && id !== 'm249' && id !== 'g3sg1'; });
      var money = p.money;
      for (var i = 0; i < order.length; i++) {
        var id = order[i];
        if (!has(id)) continue;
        var reserve = money > 5000 ? 650 : 0;
        if (Wp[id].price + reserve <= money) { if (self.buy(p, id, true)) break; }
      }
    }
    if (!p.inv.p && p.money >= 650) { var ps = ['deagle', 'fiveseven', 'p228', 'elite'].filter(has); if (ps.length && Math.random() < 0.6) self.buy(p, ps[0], true); }
    if (p.armor < 100 && p.money >= 1000) self.buy(p, 'kevhelm', true); else if (p.armor < 100 && p.money >= 650) self.buy(p, 'kevlar', true);
    if (team === 'CT' && p.money >= 200 && !p.kit && this.o.mode === 'bomb') self.buy(p, 'defuse', true);
    if (p.money >= 300 && has('he') && Math.random() < 0.5) self.buy(p, 'he', true);
    this.pickBest(p);
  };
  P.botEye = function (p) { return p.y + (p.cr ? EYE_C : EYE); };
  P.visible = function (a, b) { // видит ли a игрока b
    var ox = a.x, oy = this.botEye(a), oz = a.z, tx = b.x, ty = b.y + (b.cr ? 1.0 : 1.3), tz = b.z;
    var dx = tx - ox, dy = ty - oy, dz = tz - oz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < 0.01) return true;
    dx /= d; dy /= d; dz /= d;
    if (rayWorld(this.map, ox, oy, oz, dx, dy, dz, d) < d - 0.15) return false;
    for (var i = 0; i < this.smokes.length; i++) { // дым закрывает обзор
      var s = this.smokes[i], px = s.x - ox, py = s.y - oy, pz = s.z - oz, t = clamp(px * dx + py * dy + pz * dz, 0, d);
      var qx = ox + dx * t - s.x, qy = oy + dy * t - s.y, qz = oz + dz * t - s.z;
      if (qx * qx + qy * qy + qz * qz < 3.4 * 3.4) return false;
    }
    return true;
  };
  P.botGoal = function (p) {
    var ai = p.ai, mode = this.o.mode, map = this.map, b = this.bomb;
    if (mode === 'bomb') {
      if (p.team === 'T') {
        if (b.st === 'planted') { return { x: b.x + rnd(-4, 4), z: b.z + rnd(-4, 4), kind: 'guard' }; }
        if (p.inv.bomb) { var s = map.sites[ai.site === 'B' && map.sites[1] ? 1 : 0]; if (!ai.site) { ai.site = Math.random() < 0.5 ? 'A' : 'B'; s = map.sites[ai.site === 'B' && map.sites[1] ? 1 : 0]; } return { x: s.x, z: s.z, kind: 'plant' }; }
        if (b.st === 'dropped' && Math.random() < 0.5) return { x: b.x, z: b.z, kind: 'pick' };
        if (!ai.site) ai.site = Math.random() < 0.5 ? 'A' : 'B';
        var s2 = map.sites[ai.site === 'B' && map.sites[1] ? 1 : 0];
        return { x: s2.x + rnd(-s2.r * 0.8, s2.r * 0.8), z: s2.z + rnd(-s2.r * 0.8, s2.r * 0.8), kind: 'site' };
      }
      if (b.st === 'planted') return { x: b.x, z: b.z, kind: 'defuse' };
      if (!ai.site) ai.site = Math.random() < 0.5 ? 'A' : 'B';
      var s3 = map.sites[ai.site === 'B' && map.sites[1] ? 1 : 0];
      return { x: s3.x + rnd(-s3.r * 0.9, s3.r * 0.9), z: s3.z + rnd(-s3.r * 0.9, s3.r * 0.9), kind: 'hold' };
    }
    // бой на уничтожение / все против всех: идём к врагам
    var foes = this.players.filter(function (q) { return q.alive && q !== p && (mode === 'dm' || q.team !== p.team); });
    if (foes.length && Math.random() < 0.75) { var f = foes[Math.floor(Math.random() * foes.length)]; return { x: f.x + rnd(-5, 5), z: f.z + rnd(-5, 5), kind: 'hunt' }; }
    return { x: rnd(4, map.w - 4), z: rnd(4, map.d - 4), kind: 'roam' };
  };
  P.botThink = function (p, dt) {
    var ai = p.ai, D = DIFF[this.o.diff] || DIFF.mid, self = this;
    if (!p.alive) return;
    var w = Wp[p.wid] || Wp.knife;
    if (this.r.phase === 'end' && this.o.mode !== 'dm') { stepMove(this.map, p, { mx: 0, mz: 0 }, dt); return; }
    // --- восприятие ---
    ai.scanT -= dt;
    if (ai.scanT <= 0) {
      ai.scanT = 0.18;
      var best = null, bd = 1e9;
      this.players.forEach(function (q) {
        if (!q.alive || q === p || (self.o.mode !== 'dm' && q.team === p.team)) return;
        var dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
        if (d > 70 || d >= bd) return;
        var yawTo2 = yawTo(dx, dz), fov = Math.abs(angDiff(p.yaw, yawTo2));
        var close = d < 9 || ai.tgt === q.id; // вплотную и уже замеченных видим вокруг
        if (!close && fov > 1.15) return;
        if (p.blind > 0.5) return;
        if (self.visible(p, q)) { best = q; bd = d; }
      });
      if (best) { if (ai.tgt !== best.id) { ai.tgt = best.id; ai.react = D.react * rnd(0.8, 1.3); } ai.seen = 1.2; }
      else if (ai.tgt) { ai.seen -= 0.18; if (ai.seen <= 0) { var lost = this.byId(ai.tgt); if (lost && lost.alive) ai.alert = { x: lost.x, z: lost.z, t: 4 }; ai.tgt = 0; } }
    }
    var tgt = ai.tgt ? this.byId(ai.tgt) : null;
    if (tgt && !tgt.alive) { ai.tgt = 0; tgt = null; }
    if (ai.alert) { ai.alert.t -= dt; if (ai.alert.t <= 0) ai.alert = null; }
    // --- выбор оружия ---
    if (tgt && p.inv.p && p.wid !== p.inv.p && !p.reloadT) p.wid = p.inv.p;
    if (tgt && !p.inv.p && p.inv.s && p.wid !== p.inv.s) p.wid = p.inv.s;
    if (!tgt && !p.inv.p && !p.inv.s) p.wid = p.inv.k;
    w = Wp[p.wid] || Wp.knife;
    // --- цель движения ---
    var mx = 0, mz = 0, crouch = 0, walk = false;
    ai.pathT -= dt;
    var wantKind = ai.goal ? ai.goal.kind : '';
    if (!ai.goal || ai.pathT <= 0 || (ai.goal.kind === 'defuse' && this.bomb.st !== 'planted') || (p.team === 'T' && this.bomb.st === 'planted' && ai.goal.kind !== 'guard' && this.o.mode === 'bomb') || (ai.goal.kind === 'plant' && !p.inv.bomb)) {
      if (!ai.goal || ai.pathT <= 0 || ai.goal.kind !== wantKind || true) {
        if (!ai.goal || Math.hypot(ai.goal.x - p.x, ai.goal.z - p.z) < 3 || ai.goal.kind === 'defuse' || ai.goal.kind === 'plant' || ai.pathT <= -5 || this.bomb.st === 'planted' && ai.goal.kind !== 'defuse' && ai.goal.kind !== 'guard') ai.goal = this.botGoal(p);
        if (ai.alert && !tgt && this.o.mode !== 'dm' && ai.goal.kind !== 'plant' && ai.goal.kind !== 'defuse') ai.goal = { x: ai.alert.x, z: ai.alert.z, kind: 'alert' };
        ai.path = MXM.path(this.nav, p.x, p.z, ai.goal.x, ai.goal.z); ai.pi = 0; ai.pathT = 1.2;
      }
    }
    // --- движение ---
    var moving = true, wp = null;
    if (ai.goal && (ai.goal.kind === 'plant') && p.inv.bomb) {
      var si = this.inSite(p.x, p.z); if (si) { moving = false; p.useOn = true; }
    }
    if (ai.goal && ai.goal.kind === 'defuse' && Math.hypot(p.x - this.bomb.x, p.z - this.bomb.z) < 2.0 && !(tgt && this.visible(p, tgt) && Math.hypot(tgt.x - p.x, tgt.z - p.z) < 25)) { moving = false; p.useOn = true; }
    else if (ai.goal && ai.goal.kind !== 'plant') { if (p.useOn && !(ai.goal.kind === 'defuse')) p.useOn = false; }
    if (ai.goal && (ai.goal.kind === 'hold' || ai.goal.kind === 'guard') && ai.path && ai.pi >= ai.path.length - 1 && Math.hypot(ai.goal.x - p.x, ai.goal.z - p.z) < 3) { moving = false; }
    if (moving && ai.path && ai.pi < ai.path.length) {
      wp = ai.path[ai.pi];
      var dx = wp[0] - p.x, dz = wp[1] - p.z, dd = Math.hypot(dx, dz);
      if (dd < 0.9) ai.pi++;
      else { mx = dx / dd; mz = dz / dd; }
    }
    // stuck
    ai.stuckT += dt;
    if (ai.stuckT > 1) {
      var mvd = Math.hypot(p.x - ai.lx, p.z - ai.lz); ai.lx = p.x; ai.lz = p.z; ai.stuckT = 0;
      if (moving && mvd < 0.5 && mx * mx + mz * mz > 0) { ai.jump = 0.3; ai.sideT = 0.6; ai.side = Math.random() < 0.5 ? 1 : -1; ai.pathT = 0; }
    }
    var jump = false;
    if (ai.jump > 0) { ai.jump -= dt; jump = true; }
    if (ai.sideT > 0) { ai.sideT -= dt; var sx = -mz * ai.side, sz = mx * ai.side; mx = sx * 0.8 + mx * 0.2; mz = sz * 0.8 + mz * 0.2; }
    // --- прицеливание и стрельба ---
    var wantYaw, wantPitch;
    var eye = this.botEye(p);
    if (tgt) {
      var tx = tgt.x, tz = tgt.z, ty = tgt.y + (tgt.cr ? 1.0 : 1.35) + (Math.random() < 0.0 ? 0.3 : 0);
      var hd = Math.hypot(tx - p.x, tz - p.z);
      if (w.scope || w.model === 'sniper') ty = tgt.y + 1.3;
      wantYaw = yawTo(tx - p.x, tz - p.z); wantPitch = Math.atan2(ty - eye, hd);
      // тактика: стрейф в перестрелке
      if (moving || true) {
        ai.strafeT -= dt;
        if (ai.strafeT <= 0) { ai.strafeT = rnd(0.4, 1.3); ai.strafe = Math.random() < 0.5 ? 1 : -1; }
        var f = [-Math.sin(wantYaw), -Math.cos(wantYaw)], rgt = [Math.cos(wantYaw), -Math.sin(wantYaw)];
        var adv = (w.model === 'shotgun' ? 1 : (hd > 28 ? 0.5 : (w.model === 'sniper' ? 0 : 0.0)));
        if (w.slot === 3) adv = 1;
        mx = f[0] * adv + rgt[0] * ai.strafe * 0.9; mz = f[1] * adv + rgt[1] * ai.strafe * 0.9;
        if (w.model === 'sniper') { mx *= 0.2; mz *= 0.2; }
        walk = false;
        if (hd > 18 && Math.random() < 0.02) ai.crouchT = 0.6;
        if (ai.crouchT > 0) { ai.crouchT -= dt; crouch = 1; }
      }
    } else {
      var lookYaw = p.yaw;
      if (mx * mx + mz * mz > 0.01) lookYaw = yawTo(mx, mz);
      else { ai.look += dt; lookYaw = p.yaw + Math.sin(ai.look * 0.8) * 0.02 + 0.01; }
      wantYaw = lookYaw; wantPitch = 0;
      if (ai.alert && moving === false) { wantYaw = yawTo(ai.alert.x - p.x, ai.alert.z - p.z); }
    }
    // поворот
    var maxTurn = D.turn * dt * (tgt ? 1 : 0.6), dy = angDiff(p.yaw, wantYaw);
    p.yaw += clamp(dy, -maxTurn, maxTurn);
    p.pitch += clamp(wantPitch - p.pitch, -maxTurn * 0.8, maxTurn * 0.8);
    // оружие: перезарядка
    var am = p.ammo[p.wid];
    if (p.reloadT > 0) { p.reloadT -= dt; if (p.reloadT <= 0 && am) { var need = w.mag - am.mag, take = Math.min(need, am.res); am.mag += take; am.res -= take; } }
    if (am && am.mag <= 0 && am.res > 0 && p.reloadT <= 0 && w.mag > 0) { p.reloadT = w.rel; this.emit({ t: 'reload', id: p.id }); }
    // огонь
    p.fireCd -= dt;
    if (tgt && p.blind <= 0.3 && this.r.phase === 'live') {
      ai.react -= dt;
      var ang = Math.abs(angDiff(p.yaw, wantYaw)) + Math.abs(p.pitch - wantPitch);
      var hd2 = Math.hypot(tgt.x - p.x, tgt.z - p.z);
      var tol = 0.05 + 0.5 / Math.max(6, hd2);
      if (ai.react <= 0 && ang < tol * 3 && p.reloadT <= 0 && p.fireCd <= 0) {
        if (w.slot === 3) { if (hd2 < 2.2) { this.melee(p, Math.random() < 0.4); p.fireCd = 0.6; } }
        else if (am && am.mag > 0) {
          if (ai.burstT > 0) { ai.burstT -= dt; }
          else {
            var move = Math.hypot(p.vx, p.vz), errDeg = D.err * (1 + hd2 / 28) * (1 + move / 6) + w.spread;
            if (w.scope && !(w.model === 'sniper')) errDeg *= 1;
            var er = errDeg * Math.PI / 180;
            var dir = dirFromYaw(p.yaw + (Math.random() - 0.5) * 2 * er, p.pitch + (Math.random() - 0.5) * 2 * er);
            am.mag--;
            if (w.proj) this.launch(p, p.wid, p.x + dir[0] * 0.6, eye, p.z + dir[2] * 0.6, dir[0], dir[1], dir[2]);
            else this.shoot(p, p.wid, p.x, eye, p.z, dir[0], dir[1], dir[2]);
            p.fireCd = 60 / w.rpm * (w.auto === false ? 1.3 : 1) + (w.model === 'sniper' ? 0.4 : 0);
            ai.burst = (ai.burst || 0) + 1;
            var maxB = w.auto === false ? 1 : Math.round(rnd(D.burst[0], D.burst[1]));
            if (ai.burst >= maxB) { ai.burst = 0; ai.burstT = D.hold * rnd(0.7, 1.4); }
          }
        } else if (am && am.mag <= 0 && am.res <= 0 && p.wid !== p.inv.k) { // кончились патроны — другое оружие или нож
          var alt = p.wid === p.inv.p ? (p.inv.s && p.ammo[p.inv.s] && p.ammo[p.inv.s].mag > 0 ? p.inv.s : p.inv.k) : p.inv.k; p.wid = alt;
        }
      }
    } else { ai.react = Math.max(ai.react, 0); }
    // двигаемся
    var l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
    var run = tgt && w.model === 'sniper' ? 0.3 : 1;
    stepMove(this.map, p, { mx: mx * run, mz: mz * run, jump: jump, crouch: crouch, walk: walk, wspd: w.spd || 1 }, dt);
    p.speed = Math.hypot(p.vx, p.vz);
  };

  root.MXSIM = { Sim: Sim, stepMove: stepMove, dirFromYaw: dirFromYaw, rayWorld: rayWorld, rayBox: rayBox, angDiff: angDiff, yawTo: yawTo,
    C: { EYE: EYE, EYE_C: EYE_C, H: H_STAND, HC: H_CROUCH, RAD: RAD, FREEZE: FREEZE, ROUND_T: ROUND_T, BUY_T: BUY_T, PLANT_T: PLANT_T }, DIFF: DIFF };
})(typeof window !== 'undefined' ? window : global);
