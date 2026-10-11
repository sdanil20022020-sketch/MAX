/* weapons.js — оружие MAX SHOOTERS: классика CS 1.6 + оружие из Crazy Shooters 2 */
(function () {
  var W = {}, ORDER = [];
  // id, имя, группа, цена, команда, параметры
  function add(id, n, grp, price, team, o) {
    var w = {
      id: id, n: n, grp: grp, price: price, team: team || '',
      dmg: 30, rpm: 600, mag: 30, res: 90, rel: 2.2, spread: 1.2, rec: 1, auto: true, pel: 1,
      spd: 1, kill: 300, armor: 0.7, scope: 0, model: 'rifle', slot: 1, crazy: false, rng: 0.992
    };
    for (var k in o) w[k] = o[k];
    w.id = id; W[id] = w; ORDER.push(id);
  }
  // ---- ножи ----
  add('knife', 'Нож', 'Ножи', 0, '', { slot: 3, model: 'knife', dmg: 40, alt: 65, rpm: 130, mag: 0, res: 0, kill: 1500, spd: 1.08, rng: 1 });
  add('bknife', 'BallisticKnife', 'Ножи', 800, '', { slot: 3, model: 'bknife', dmg: 70, alt: 110, rpm: 150, mag: 1, res: 0, rel: 4, kill: 1500, spd: 1.08, crazy: true, proj: { speed: 55, g: 6, splash: 0 } });
  // ---- пистолеты ----
  add('usp', 'USP .45', 'Пистолеты', 500, 'CT', { slot: 2, model: 'pistol', dmg: 34, rpm: 380, mag: 12, res: 100, rel: 2.2, spread: 0.5, rec: 1.3, auto: false, spd: 1.05, kill: 300 });
  add('glock', 'Glock 18', 'Пистолеты', 400, 'T', { slot: 2, model: 'pistol', dmg: 25, rpm: 480, mag: 20, res: 120, rel: 2.2, spread: 0.7, rec: 1, auto: false, spd: 1.05, kill: 300 });
  add('p228', 'P228', 'Пистолеты', 600, '', { slot: 2, model: 'pistol', dmg: 32, rpm: 400, mag: 13, res: 52, rel: 2.7, spread: 0.6, rec: 1.2, auto: false, spd: 1.05, kill: 300 });
  add('fiveseven', 'Five-seveN', 'Пистолеты', 750, 'CT', { slot: 2, model: 'pistol', dmg: 25, rpm: 430, mag: 20, res: 100, rel: 2.7, spread: 0.6, rec: 1, auto: false, spd: 1.05, kill: 300 });
  add('elite', 'Dual Elites', 'Пистолеты', 800, 'T', { slot: 2, model: 'pistol', dmg: 36, rpm: 520, mag: 30, res: 120, rel: 4.2, spread: 0.9, rec: 1.2, auto: false, spd: 1.05, kill: 300 });
  add('deagle', 'Deagle', 'Пистолеты', 650, '', { slot: 2, model: 'pistol', dmg: 54, rpm: 250, mag: 7, res: 35, rel: 2.2, spread: 0.5, rec: 3, auto: false, spd: 1.03, kill: 300, armor: 0.85 });
  // ---- дробовики ----
  add('m3', 'M3 Super 90', 'Дробовики', 1700, '', { model: 'shotgun', dmg: 18, pel: 8, rpm: 70, mag: 8, res: 32, rel: 3, spread: 3.6, rec: 4, auto: false, spd: 0.97, kill: 900, rng: 0.93 });
  add('xm1014', 'XM1014', 'Дробовики', 3000, '', { model: 'shotgun', dmg: 20, pel: 6, rpm: 240, mag: 7, res: 32, rel: 3.2, spread: 3.2, rec: 3, auto: false, spd: 0.97, kill: 900, rng: 0.93 });
  add('m87t', 'M87T', 'Дробовики', 2200, '', { model: 'shotgun', dmg: 17, pel: 9, rpm: 80, mag: 6, res: 36, rel: 2.8, spread: 3.4, rec: 4, auto: false, spd: 0.98, kill: 900, rng: 0.93, crazy: true });
  // ---- пистолеты-пулемёты ----
  add('tmp', 'TMP', 'Пистолеты-пулемёты', 1250, 'CT', { model: 'smg', dmg: 20, rpm: 750, mag: 30, res: 120, rel: 2.1, spread: 1.4, rec: 0.6, spd: 1.04, kill: 600 });
  add('mac10', 'MAC-10', 'Пистолеты-пулемёты', 1400, 'T', { model: 'smg', dmg: 29, rpm: 800, mag: 30, res: 100, rel: 3.1, spread: 1.6, rec: 0.9, spd: 1.03, kill: 600 });
  add('mp5', 'MP5 Navy', 'Пистолеты-пулемёты', 1500, '', { model: 'smg', dmg: 26, rpm: 750, mag: 30, res: 120, rel: 2.6, spread: 1.2, rec: 0.7, spd: 1.02, kill: 600 });
  add('ump45', 'UMP45', 'Пистолеты-пулемёты', 1700, '', { model: 'smg', dmg: 30, rpm: 600, mag: 25, res: 100, rel: 3.5, spread: 1.1, rec: 0.8, spd: 1.02, kill: 600 });
  add('p90', 'P90', 'Пистолеты-пулемёты', 2350, '', { model: 'smg', dmg: 26, rpm: 900, mag: 50, res: 100, rel: 3.3, spread: 1.4, rec: 0.7, spd: 1.0, kill: 300 });
  add('mp5k4', 'MP5K4', 'Пистолеты-пулемёты', 1800, '', { model: 'smg', dmg: 27, rpm: 900, mag: 30, res: 150, rel: 2.3, spread: 1.3, rec: 0.7, spd: 1.03, kill: 600, crazy: true });
  // ---- винтовки ----
  add('galil', 'Galil', 'Автоматы', 2000, 'T', { model: 'rifle', dmg: 30, rpm: 650, mag: 35, res: 90, rel: 2.4, spread: 1.0, rec: 1.0, spd: 0.97, kill: 300 });
  add('famas', 'FAMAS', 'Автоматы', 2250, 'CT', { model: 'rifle', dmg: 30, rpm: 700, mag: 25, res: 90, rel: 3.3, spread: 1.0, rec: 1.0, spd: 0.97, kill: 300 });
  add('ak47', 'AK-47', 'Автоматы', 2500, 'T', { model: 'rifle', dmg: 36, rpm: 600, mag: 30, res: 90, rel: 2.5, spread: 1.0, rec: 1.5, spd: 0.95, kill: 300, armor: 0.78 });
  add('m4a1', 'M4A1', 'Автоматы', 3100, 'CT', { model: 'rifle', dmg: 33, rpm: 666, mag: 30, res: 90, rel: 3.1, spread: 0.9, rec: 1.1, spd: 0.96, kill: 300 });
  add('sg552', 'SG 552', 'Автоматы', 3500, 'T', { model: 'rifle', dmg: 33, rpm: 666, mag: 30, res: 90, rel: 3.0, spread: 0.9, rec: 1.1, spd: 0.95, kill: 300, scope: 1 });
  add('aug', 'AUG', 'Автоматы', 3500, 'CT', { model: 'rifle', dmg: 32, rpm: 666, mag: 30, res: 90, rel: 3.3, spread: 0.9, rec: 1.0, spd: 0.95, kill: 300, scope: 1 });
  add('m249', 'M249', 'Пулемёты', 5750, '', { model: 'mg', dmg: 32, rpm: 750, mag: 100, res: 200, rel: 5.7, spread: 1.5, rec: 0.9, spd: 0.86, kill: 300 });
  // ---- снайперки ----
  add('scout', 'Scout', 'Снайперки', 2750, '', { model: 'sniper', dmg: 75, rpm: 48, mag: 10, res: 90, rel: 2.8, spread: 0.2, rec: 2, auto: false, spd: 1.05, kill: 300, scope: 2 });
  add('awp', 'AWP', 'Снайперки', 4750, '', { model: 'sniper', dmg: 115, rpm: 40, mag: 10, res: 30, rel: 3.4, spread: 0.1, rec: 3, auto: false, spd: 0.84, kill: 100, scope: 2, armor: 0.95 });
  add('sg550', 'SG 550', 'Снайперки', 4200, 'CT', { model: 'sniper', dmg: 70, rpm: 240, mag: 30, res: 90, rel: 3.4, spread: 0.4, rec: 1.2, spd: 0.85, kill: 300, scope: 2 });
  add('g3sg1', 'G3/SG-1', 'Снайперки', 5000, 'T', { model: 'sniper', dmg: 80, rpm: 240, mag: 20, res: 90, rel: 3.5, spread: 0.4, rec: 1.4, spd: 0.85, kill: 300, scope: 2 });
  add('blaser', 'Blaser R93', 'Снайперки', 3900, '', { model: 'sniper', dmg: 100, rpm: 50, mag: 5, res: 30, rel: 3.0, spread: 0.1, rec: 2.5, auto: false, spd: 0.92, kill: 300, scope: 2, crazy: true, armor: 0.9 });
  add('stw25', 'STW-25', 'Снайперки', 3400, '', { model: 'sniper', dmg: 85, rpm: 100, mag: 8, res: 40, rel: 3.0, spread: 0.2, rec: 1.8, auto: false, spd: 0.92, kill: 300, scope: 2, crazy: true });
  // ---- тяжёлое ----
  add('m79', 'M79', 'Гранатомёты', 3500, '', { model: 'launcher', dmg: 20, rpm: 60, mag: 1, res: 6, rel: 2.6, spread: 0.3, rec: 4, auto: false, spd: 0.95, kill: 600, crazy: true, proj: { speed: 38, g: 9, splash: 120, rad: 5.5, fuse: 3 } });
  add('rpg', 'RPG', 'Гранатомёты', 5500, '', { model: 'rpg', dmg: 20, rpm: 40, mag: 1, res: 5, rel: 3.4, spread: 0.2, rec: 5, auto: false, spd: 0.88, kill: 600, crazy: true, proj: { speed: 46, g: 0, splash: 170, rad: 7, fuse: 6 } });
  // ---- гранаты ----
  add('he', 'Граната HE (M67)', 'Гранаты и снаряжение', 300, '', { slot: 4, model: 'nade', mag: 1, res: 0, rel: 0, kill: 300, nade: 'he' });
  add('flash', 'Светошумовая', 'Гранаты и снаряжение', 200, '', { slot: 4, model: 'nade', mag: 1, res: 0, rel: 0, kill: 0, nade: 'flash' });
  add('smoke', 'Дымовая', 'Гранаты и снаряжение', 300, '', { slot: 4, model: 'nade', mag: 1, res: 0, rel: 0, kill: 0, nade: 'smoke' });
  // ---- снаряжение ----
  var EQ = {
    kevlar: { id: 'kevlar', n: 'Бронежилет', price: 650 },
    kevhelm: { id: 'kevhelm', n: 'Бронежилет + шлем', price: 1000 },
    defuse: { id: 'defuse', n: 'Набор сапёра', price: 200, team: 'CT' }
  };

  var PRESETS = [
    { id: 'classic', n: 'Классика CS 1.6', f: function (w) { return !w.crazy; } },
    { id: 'all', n: 'Всё оружие', f: function () { return true; } },
    { id: 'crazy', n: 'Crazy Shooters (как в видео)', f: function (w) { return w.crazy || w.id === 'deagle' || w.id === 'he' || w.id === 'knife'; } },
    { id: 'knives', n: 'Только ножи', f: function (w) { return w.id === 'knife'; } },
    { id: 'pistols', n: 'Только пистолеты', f: function (w) { return w.grp === 'Пистолеты'; } },
    { id: 'shotguns', n: 'Только дробовики', f: function (w) { return w.grp === 'Дробовики'; } },
    { id: 'snipers', n: 'Только снайперки', f: function (w) { return w.grp === 'Снайперки'; } },
    { id: 'nosnipe', n: 'Без снайперок и тяжёлого', f: function (w) { return !w.crazy && w.grp !== 'Снайперки' && w.grp !== 'Пулемёты'; } }
  ];
  function presetSet(id) {
    var p = PRESETS.filter(function (x) { return x.id === id; })[0] || PRESETS[0], s = {};
    ORDER.forEach(function (k) { if (p.f(W[k])) s[k] = true; });
    s.knife = true; // нож есть всегда
    return s;
  }
  // сжатие набора в короткую строку (hex-маска) и обратно
  function encode(set) {
    var out = '', v = 0, n = 0;
    ORDER.forEach(function (k, i) {
      if (set[k]) v |= (1 << n);
      n++;
      if (n === 4 || i === ORDER.length - 1) { out += v.toString(16); v = 0; n = 0; }
    });
    return out;
  }
  function decode(str) {
    var s = {}, n = 0;
    str = String(str || '');
    ORDER.forEach(function (k, i) {
      var ch = parseInt(str.charAt(Math.floor(i / 4)) || '0', 16) || 0;
      if (ch & (1 << (i % 4))) s[k] = true;
    });
    s.knife = true;
    return s;
  }
  var GROUPS = [];
  ORDER.forEach(function (k) {
    var g = W[k].grp, e = GROUPS.filter(function (x) { return x.n === g; })[0];
    if (!e) { e = { n: g, ids: [] }; GROUPS.push(e); }
    e.ids.push(k);
  });

  window.MXW = { W: W, ORDER: ORDER, EQ: EQ, PRESETS: PRESETS, GROUPS: GROUPS, presetSet: presetSet, encode: encode, decode: decode };
})();
