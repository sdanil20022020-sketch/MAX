/* maps.js — карты MAX SHOOTERS (упрощённые версии карт CS 1.6, 1 единица = 1 метр).
   Карты нарисованы заново из блоков; это не оригинальные файлы Valve. */
(function () {
  var MAPS = {}, LIST = [];

  function mk(id, name, o) {
    var m = {
      id: id, name: name, w: 100, d: 100, sky: 0x9fc4e8, fog: 0xc9d9e6, floor: '#c8b27f', wall: '#b79a62', crate: '#8a6a3a', metal: '#4f6b7a',
      boxes: [], spawnT: [], spawnCT: [], sites: [], bomb: true, desc: ''
    };
    for (var k in o) m[k] = o[k];
    m.boxes = [];
    LIST.push(id); MAPS[id] = m;
    return m;
  }
  // блок: [x0,z0,x1,z1,высота, материал, низ]
  function B(m, x0, z0, x1, z1, h, mat, y0) {
    m.boxes.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), h: h, y0: y0 || 0, mat: mat || 'wall' });
  }
  function walls(m) { // внешняя стена
    var t = 2, H = 14;
    B(m, -t, -t, m.w + t, 0, H, 'wall'); B(m, -t, m.d, m.w + t, m.d + t, H, 'wall');
    B(m, -t, 0, 0, m.d, H, 'wall'); B(m, m.w, 0, m.w + t, m.d, H, 'wall');
  }
  function spawns(m, tx0, tz0, tx1, tz1, cx0, cz0, cx1, cz1) {
    var i, c = 0;
    for (i = 0; i < 10; i++) m.spawnT.push([tx0 + (tx1 - tx0) * ((i % 5) + 0.5) / 5, tz0 + (tz1 - tz0) * (Math.floor(i / 5) + 0.5) / 2, Math.PI]);
    for (i = 0; i < 10; i++) m.spawnCT.push([cx0 + (cx1 - cx0) * ((i % 5) + 0.5) / 5, cz0 + (cz1 - cz0) * (Math.floor(i / 5) + 0.5) / 2, 0]);
  }
  function stairs(m, x0, z0, x1, z1, dir, n, hTop, mat) { // лестница: dir 'e','w','n','s' — куда поднимается
    var i, dh = hTop / n;
    for (i = 0; i < n; i++) {
      var f0 = i / n, f1 = (i + 1) / n, h = dh * (i + 1);
      if (dir === 'e') B(m, x0 + (x1 - x0) * f0, z0, x0 + (x1 - x0) * f1, z1, h, mat || 'stone');
      else if (dir === 'w') B(m, x1 - (x1 - x0) * f1, z0, x1 - (x1 - x0) * f0, z1, h, mat || 'stone');
      else if (dir === 'n') B(m, x0, z0 + (z1 - z0) * f0, x1, z0 + (z1 - z0) * f1, h, mat || 'stone');
      else B(m, x0, z1 - (z1 - z0) * f1, x1, z1 - (z1 - z0) * f0, h, mat || 'stone');
    }
  }

  /* ================= de_dust2 (подробная) ================= */
  (function () {
    var m = mk('de_dust2', 'de_dust2', { w: 130, d: 130, desc: 'Легенда. Длинная А, мид, туннели Б, катвок. Точки: A и B.' });
    walls(m);
    // здания и стены (север — это рост z; T внизу, CT вверху)
    B(m, 2, 26, 14, 92, 9);               // западный массив
    B(m, 30, 26, 62, 90, 9);              // между туннелями и мидом
    B(m, 72, 26, 96, 66, 9);              // между мидом и длинной А
    B(m, 112, 26, 128, 92, 9);            // восточный массив
    B(m, 92, 66, 96, 90, 9);              // стена между катвоком и длинной
    B(m, 44, 90, 62, 96, 9); B(m, 68, 90, 84, 96, 9);  // южная стена ЦТ (мид-двери между ними)
    B(m, 44, 92, 48, 104, 9); B(m, 44, 112, 48, 126, 9);   // двери Б (проём z 104..112)
    B(m, 82, 96, 86, 104, 9); B(m, 82, 114, 86, 126, 9);   // рампа А (проём z 104..114)
    // катвок: лестницы и площадка
    stairs(m, 72, 72, 76, 80, 'e', 3, 1.5);
    B(m, 76, 68, 90, 86, 1.5, 'stone');
    // спуск с катвока на север (ступени вниз)
    B(m, 78, 86, 88, 87.4, 1.0, 'stone'); B(m, 78, 87.4, 88, 88.8, 0.5, 'stone');
    // укрытия
    B(m, 64, 56, 67, 59, 1.6, 'crate');                      // xbox на миду
    B(m, 100, 44, 104, 48, 2.2, 'crate'); B(m, 106, 60, 110, 64, 1.6, 'crate');
    B(m, 98, 72, 100.5, 78, 1.7, 'metal');                   // машина на длинной
    B(m, 104, 84, 111, 91, 2.8, 'metal');                    // контейнер у длинной
    B(m, 92, 100, 96, 104, 2.0, 'crate'); B(m, 106, 108, 110, 112, 2.6, 'crate');
    B(m, 98, 116, 106, 119, 1.5, 'crate'); B(m, 112, 98, 118, 104, 2.2, 'metal');
    B(m, 14, 102, 20, 108, 3.0, 'metal'); B(m, 30, 110, 34, 114, 2.0, 'crate');
    B(m, 8, 118, 16, 121, 1.6, 'crate'); B(m, 34, 98, 38, 102, 1.4, 'crate');
    B(m, 60, 108, 64, 112, 1.5, 'crate'); B(m, 70, 116, 74, 120, 1.5, 'crate');
    B(m, 50, 12, 54, 16, 1.5, 'crate'); B(m, 78, 8, 82, 12, 1.5, 'crate');
    B(m, 20, 12, 26, 16, 1.5, 'crate'); B(m, 105, 14, 110, 18, 1.5, 'crate');
    B(m, 16, 44, 20, 48, 1.4, 'crate'); B(m, 24, 58, 28, 62, 1.4, 'crate'); B(m, 18, 72, 22, 76, 1.4, 'crate');
    spawns(m, 50, 4, 82, 22, 52, 100, 78, 124);
    m.sites = [{ n: 'A', x: 106, z: 110, r: 9 }, { n: 'B', x: 22, z: 108, r: 10 }];
  })();

  /* ================= de_dust ================= */
  (function () {
    var m = mk('de_dust', 'de_dust', { desc: 'Классическая Dust: три коридора, мид, две точки.' });
    walls(m);
    B(m, 2, 22, 22, 60, 9); B(m, 28, 22, 40, 50, 9); B(m, 60, 22, 72, 50, 9); B(m, 78, 22, 98, 60, 9);
    B(m, 2, 62, 18, 70, 9); B(m, 82, 62, 98, 70, 9);
    B(m, 38, 72, 46, 76, 9); B(m, 54, 72, 62, 76, 9);
    B(m, 38, 76, 40, 82, 9); B(m, 38, 90, 40, 98, 9); B(m, 60, 76, 62, 82, 9); B(m, 60, 90, 62, 98, 9);
    B(m, 44, 52, 48, 56, 1.5, 'crate'); B(m, 52, 56, 56, 60, 1.5, 'crate');
    B(m, 30, 56, 34, 60, 2, 'crate'); B(m, 66, 56, 70, 60, 2, 'crate');
    B(m, 10, 80, 18, 86, 2.4, 'crate'); B(m, 26, 90, 32, 94, 1.6, 'crate'); B(m, 6, 92, 12, 96, 1.6, 'crate');
    B(m, 82, 80, 90, 86, 2.4, 'crate'); B(m, 68, 90, 74, 94, 1.6, 'crate'); B(m, 88, 92, 94, 96, 1.6, 'crate');
    B(m, 24, 8, 28, 12, 1.5, 'crate'); B(m, 72, 8, 76, 12, 1.5, 'crate'); B(m, 46, 12, 54, 15, 1.2, 'crate');
    spawns(m, 30, 4, 70, 20, 42, 84, 58, 96);
    m.sites = [{ n: 'A', x: 82, z: 86, r: 9 }, { n: 'B', x: 18, z: 86, r: 9 }];
  })();

  /* ================= de_inferno ================= */
  (function () {
    var m = mk('de_inferno', 'de_inferno', { w: 110, d: 110, floor: '#b8a58a', wall: '#a8664a', crate: '#7a5a3a', sky: 0xb8cbe0, desc: 'Итальянская деревушка: «банан», мид, апартаменты.' });
    walls(m);
    B(m, 2, 28, 16, 76, 9);                     // банан: западная стена
    B(m, 22, 28, 34, 84, 9);                    // между бананом и мидом
    B(m, 46, 28, 62, 62, 9);                    // здание у мида
    B(m, 68, 28, 78, 56, 9); B(m, 84, 28, 108, 48, 9);   // апартаменты
    B(m, 84, 56, 108, 70, 9);
    B(m, 40, 76, 56, 88, 9); B(m, 62, 76, 72, 96, 9);
    B(m, 34, 90, 40, 108, 9); B(m, 46, 96, 56, 108, 9);
    B(m, 76, 82, 84, 100, 9);
    B(m, 10, 34, 14, 38, 1.5, 'crate'); B(m, 8, 56, 12, 60, 1.5, 'crate'); B(m, 38, 46, 42, 50, 1.5, 'crate');
    B(m, 66, 66, 70, 70, 1.5, 'crate'); B(m, 20, 90, 28, 96, 2.8, 'crate'); B(m, 8, 96, 14, 102, 1.8, 'crate');
    B(m, 96, 90, 102, 96, 2.4, 'crate'); B(m, 88, 76, 94, 80, 1.6, 'crate'); B(m, 66, 100, 72, 104, 1.6, 'crate');
    B(m, 14, 8, 18, 12, 1.5, 'crate'); B(m, 40, 12, 44, 16, 1.5, 'crate');
    spawns(m, 4, 4, 44, 20, 72, 90, 104, 106);
    m.sites = [{ n: 'A', x: 94, z: 82, r: 9 }, { n: 'B', x: 20, z: 96, r: 10 }];
  })();

  /* ================= de_nuke ================= */
  (function () {
    var m = mk('de_nuke', 'de_nuke', { w: 120, d: 96, floor: '#9aa3a8', wall: '#8c959a', crate: '#5d6f55', metal: '#4a5560', sky: 0x8fa5b8, fog: 0xa9b8c4, desc: 'Ангар, силосы и двор. Точки: A (ангар) и B (силосы).' });
    walls(m);
    B(m, 40, 30, 80, 66, 9, 'wall');              // главное здание, проходы вокруг
    B(m, 52, 66, 68, 70, 9); B(m, 52, 26, 68, 30, 9);
    B(m, 6, 36, 20, 52, 9, 'metal'); B(m, 100, 36, 114, 52, 9, 'metal');   // силосы
    B(m, 24, 14, 30, 20, 2, 'crate'); B(m, 90, 14, 96, 20, 2, 'crate'); B(m, 30, 70, 36, 76, 2, 'crate');
    B(m, 84, 70, 90, 76, 2, 'crate'); B(m, 10, 60, 16, 66, 2.4, 'crate'); B(m, 104, 60, 110, 66, 2.4, 'crate');
    B(m, 56, 8, 64, 12, 1.5, 'crate'); B(m, 56, 84, 64, 88, 1.5, 'crate');
    B(m, 4, 76, 14, 90, 2.6, 'metal'); B(m, 106, 76, 116, 90, 2.6, 'metal');
    spawns(m, 40, 3, 80, 20, 40, 78, 80, 92);
    m.sites = [{ n: 'A', x: 96, z: 82, r: 10 }, { n: 'B', x: 22, z: 82, r: 10 }];
  })();

  /* ================= de_train ================= */
  (function () {
    var m = mk('de_train', 'de_train', { w: 120, d: 100, floor: '#8b8478', wall: '#6d6a64', crate: '#8a5a3a', metal: '#5b3e32', sky: 0x9fb2c4, fog: 0xb4c1cd, desc: 'Депо: ряды вагонов-укрытий. Точки: A и B.' });
    walls(m);
    for (var i = 0; i < 4; i++) { B(m, 12, 22 + i * 14, 52, 28 + i * 14, 3.2, 'metal'); B(m, 68, 22 + i * 14, 108, 28 + i * 14, 3.2, 'metal'); }
    B(m, 56, 30, 64, 70, 9, 'wall');
    B(m, 8, 88, 16, 94, 2.8, 'crate'); B(m, 104, 88, 112, 94, 2.8, 'crate');
    B(m, 30, 86, 36, 90, 1.6, 'crate'); B(m, 84, 86, 90, 90, 1.6, 'crate');
    B(m, 20, 6, 28, 10, 1.5, 'crate'); B(m, 92, 6, 100, 10, 1.5, 'crate');
    spawns(m, 20, 3, 100, 16, 30, 90, 90, 98);
    m.sites = [{ n: 'A', x: 100, z: 80, r: 9 }, { n: 'B', x: 20, z: 80, r: 9 }];
  })();

  /* ================= de_cbble ================= */
  (function () {
    var m = mk('de_cbble', 'de_cbble', { w: 110, d: 100, floor: '#8f8b80', wall: '#74706a', crate: '#6a5a44', sky: 0x9db3c7, fog: 0xb3c0cc, desc: 'Замок: узкие улицы, ворота, два входа на точки.' });
    walls(m);
    B(m, 2, 24, 28, 56, 9, 'stone'); B(m, 36, 24, 52, 70, 9, 'stone'); B(m, 60, 24, 76, 50, 9, 'stone'); B(m, 84, 24, 108, 64, 9, 'stone');
    B(m, 2, 62, 20, 70, 9, 'stone'); B(m, 60, 60, 76, 74, 9, 'stone');
    B(m, 30, 78, 38, 98, 9, 'stone'); B(m, 72, 80, 80, 98, 9, 'stone');
    B(m, 12, 84, 20, 90, 2.2, 'crate'); B(m, 90, 84, 98, 90, 2.2, 'crate'); B(m, 20, 66, 26, 72, 1.6, 'crate');
    B(m, 82, 70, 88, 76, 1.6, 'crate'); B(m, 52, 10, 58, 14, 1.5, 'crate'); B(m, 44, 80, 50, 86, 1.6, 'crate');
    spawns(m, 30, 4, 80, 20, 42, 84, 68, 96);
    m.sites = [{ n: 'A', x: 92, z: 78, r: 9 }, { n: 'B', x: 16, z: 78, r: 9 }];
  })();

  /* ================= cs_italy (без бомбы) ================= */
  (function () {
    var m = mk('cs_italy', 'cs_italy', { w: 100, d: 100, floor: '#a89c85', wall: '#c07a52', crate: '#7a5a3a', sky: 0xb6d0e8, bomb: false, desc: 'Итальянский городок: рынок, дома, переулки. Командный бой на уничтожение.' });
    walls(m);
    B(m, 10, 20, 30, 36, 8, 'wall'); B(m, 40, 20, 60, 32, 8, 'wall'); B(m, 70, 20, 90, 36, 8, 'wall');
    B(m, 10, 48, 24, 62, 8, 'wall'); B(m, 76, 48, 90, 62, 8, 'wall'); B(m, 38, 46, 62, 56, 8, 'wall');
    B(m, 10, 70, 30, 86, 8, 'wall'); B(m, 40, 74, 60, 88, 8, 'wall'); B(m, 70, 70, 90, 86, 8, 'wall');
    B(m, 32, 40, 36, 44, 1.6, 'crate'); B(m, 64, 40, 68, 44, 1.6, 'crate'); B(m, 46, 62, 54, 66, 1.4, 'crate');
    B(m, 32, 62, 36, 66, 1.6, 'crate'); B(m, 64, 62, 68, 66, 1.6, 'crate'); B(m, 48, 8, 52, 12, 1.5, 'crate');
    spawns(m, 20, 3, 80, 16, 20, 90, 80, 98);
  })();

  /* ================= cs_office (без бомбы) ================= */
  (function () {
    var m = mk('cs_office', 'cs_office', { w: 90, d: 90, floor: '#9b9588', wall: '#c9c2b0', crate: '#6a5a44', metal: '#6b7780', sky: 0xa8bdd0, bomb: false, desc: 'Офис: комнаты, коридоры, столы. Командный бой на уничтожение.' });
    walls(m);
    B(m, 2, 30, 34, 33, 6); B(m, 40, 30, 88, 33, 6); B(m, 2, 58, 22, 61, 6); B(m, 30, 58, 60, 61, 6); B(m, 68, 58, 88, 61, 6);
    B(m, 20, 33, 23, 48, 6); B(m, 56, 33, 59, 48, 6); B(m, 40, 61, 43, 76, 6);
    B(m, 8, 38, 16, 42, 1.0, 'crate'); B(m, 64, 38, 72, 42, 1.0, 'crate'); B(m, 8, 66, 16, 70, 1.0, 'crate'); B(m, 72, 66, 80, 70, 1.0, 'crate');
    B(m, 28, 14, 34, 18, 1.4, 'metal'); B(m, 56, 72, 62, 76, 1.4, 'metal'); B(m, 40, 44, 50, 48, 1.0, 'crate');
    spawns(m, 10, 3, 80, 22, 10, 68, 80, 86);
  })();

  /* ================= fy_pool_day ================= */
  (function () {
    var m = mk('fy_pool_day', 'fy_pool_day', { w: 70, d: 70, floor: '#6fb5c9', wall: '#e7e1d0', crate: '#d8a24a', sky: 0x7fc8f2, bomb: false, desc: 'Весёлая карта у бассейна: тесно, быстро, много укрытий.' });
    walls(m);
    B(m, 28, 28, 42, 42, 1.1, 'crate'); B(m, 10, 16, 20, 22, 2.6); B(m, 50, 48, 60, 54, 2.6); B(m, 10, 48, 18, 54, 1.6, 'crate');
    B(m, 52, 16, 60, 22, 1.6, 'crate'); B(m, 30, 14, 40, 18, 2.0, 'crate'); B(m, 30, 52, 40, 56, 2.0, 'crate');
    spawns(m, 10, 3, 60, 10, 10, 60, 60, 67);
  })();

  /* ================= aim_map ================= */
  (function () {
    var m = mk('aim_map', 'aim_map', { w: 60, d: 40, floor: '#7d8790', wall: '#5d6670', crate: '#a35d3a', sky: 0x8aa0b4, bomb: false, desc: 'Арена для тренировки стрельбы.' });
    walls(m);
    B(m, 26, 12, 34, 14, 2.2, 'crate'); B(m, 26, 26, 34, 28, 2.2, 'crate'); B(m, 14, 18, 18, 22, 1.4, 'crate'); B(m, 42, 18, 46, 22, 1.4, 'crate');
    spawns(m, 4, 5, 10, 35, 50, 5, 56, 35);
    m.spawnT = m.spawnT.map(function (s, i) { return [4 + (i % 2) * 4, 6 + i * 3, -Math.PI / 2]; });
    m.spawnCT = m.spawnCT.map(function (s, i) { return [52 + (i % 2) * 4, 6 + i * 3, Math.PI / 2]; });
  })();

  /* ================= awp_map ================= */
  (function () {
    var m = mk('awp_map', 'awp_map', { w: 140, d: 50, floor: '#9a8f78', wall: '#7b705c', crate: '#6a5a44', sky: 0xa8c3dc, bomb: false, desc: 'Длинный двор для снайперов.' });
    walls(m);
    B(m, 30, 8, 36, 14, 2.4, 'crate'); B(m, 56, 30, 62, 36, 2.4, 'crate'); B(m, 80, 8, 86, 14, 2.4, 'crate'); B(m, 104, 30, 110, 36, 2.4, 'crate');
    B(m, 68, 18, 72, 32, 1.4, 'crate'); B(m, 18, 22, 22, 28, 1.4, 'crate'); B(m, 118, 22, 122, 28, 1.4, 'crate');
    spawns(m, 4, 8, 12, 42, 128, 8, 136, 42);
    m.spawnT = m.spawnT.map(function (s, i) { return [4 + (i % 2) * 4, 8 + i * 3.2, -Math.PI / 2]; });
    m.spawnCT = m.spawnCT.map(function (s, i) { return [130 + (i % 2) * 4, 8 + i * 3.2, Math.PI / 2]; });
  })();


  /* ---------- проверка точек появления: сдвигаем из-под ящиков ---------- */
  function freeAt(m, x, z, r) {
    if (x < r + 1 || z < r + 1 || x > m.w - r - 1 || z > m.d - r - 1) return false;
    for (var i = 0; i < m.boxes.length; i++) {
      var q = m.boxes[i];
      if (q.y0 + q.h > 0.1 && x > q.x0 - r && x < q.x1 + r && z > q.z0 - r && z < q.z1 + r) return false;
    }
    return true;
  }
  function nearestFree(m, x, z, r) {
    if (freeAt(m, x, z, r)) return [x, z];
    for (var rad = 1; rad < 40; rad += 1)
      for (var a = 0; a < 16; a++) {
        var px = x + Math.cos(a / 16 * 6.2832) * rad, pz = z + Math.sin(a / 16 * 6.2832) * rad;
        if (freeAt(m, px, pz, r)) return [px, pz];
      }
    return [x, z];
  }
  LIST.forEach(function (id) {
    var m = MAPS[id];
    m.spawnT.forEach(function (s) { var f = nearestFree(m, s[0], s[1], 0.7); s[0] = f[0]; s[1] = f[1]; });
    m.spawnCT.forEach(function (s) { var f = nearestFree(m, s[0], s[1], 0.7); s[0] = f[0]; s[1] = f[1]; });
    m.sites.forEach(function (s) { var f = nearestFree(m, s.x, s.z, 1.0); s.x = f[0]; s.z = f[1]; });
  });

  /* ---------- высота земли и сетка навигации ---------- */
  var STEP = 0.62;
  function groundAt(map, x, z, y) { // самая высокая крышка блока под (x,z), на которую можно шагнуть с высоты y
    var g = 0, b = map.boxes, i, r = 0.0;
    for (i = 0; i < b.length; i++) {
      var q = b[i];
      if (x > q.x0 - r && x < q.x1 + r && z > q.z0 - r && z < q.z1 + r) {
        var top = q.y0 + q.h;
        if (top <= y + STEP && top > g) g = top;
      }
    }
    return g;
  }
  function buildNav(map, cell) {
    cell = cell || 1.5;
    var nx = Math.ceil(map.w / cell), nz = Math.ceil(map.d / cell), n = nx * nz, h = new Float32Array(n), i, j;
    for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
      var cx = (i + 0.5) * cell, cz = (j + 0.5) * cell, t = 0, b = map.boxes;
      for (var k = 0; k < b.length; k++) {
        var q = b[k];
        if (cx > q.x0 && cx < q.x1 && cz > q.z0 && cz < q.z1 && q.y0 + q.h > t) t = q.y0 + q.h;
      }
      h[j * nx + i] = t;
    }
    return { nx: nx, nz: nz, cell: cell, h: h };
  }
  function navCan(nv, a, b, diag) {
    var d = nv.h[b] - nv.h[a];
    return d <= STEP && d >= -4;
  }
  function path(nv, sx, sz, ex, ez) {
    var c = nv.cell, nx = nv.nx, nz = nv.nz;
    var si = Math.max(0, Math.min(nx - 1, Math.floor(sx / c))), sj = Math.max(0, Math.min(nz - 1, Math.floor(sz / c)));
    var ei = Math.max(0, Math.min(nx - 1, Math.floor(ex / c))), ej = Math.max(0, Math.min(nz - 1, Math.floor(ez / c)));
    var s = sj * nx + si, e = ej * nx + ei;
    if (s === e) return [[ex, ez]];
    var N = nx * nz, g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    var heap = [], pushH = function (id, f) { heap.push([f, id]); var i = heap.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; var t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; } };
    var popH = function () { var top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; var t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m; } } return top; };
    g[s] = 0; pushH(s, 0);
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], found = false, iter = 0;
    while (heap.length && iter++ < 20000) {
      var cur = popH()[1];
      if (closed[cur]) continue; closed[cur] = 1;
      if (cur === e) { found = true; break; }
      var ci = cur % nx, cj = (cur / nx) | 0;
      for (var d = 0; d < 8; d++) {
        var ni = ci + dirs[d][0], nj = cj + dirs[d][1];
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        var nid = nj * nx + ni;
        if (closed[nid] || !navCan(nv, cur, nid)) continue;
        if (d >= 4) { // диагональ только если обе стороны проходимы
          if (!navCan(nv, cur, cj * nx + ni) || !navCan(nv, cur, nj * nx + ci)) continue;
          if (!navCan(nv, cj * nx + ni, nid) || !navCan(nv, nj * nx + ci, nid)) continue;
        }
        // штраф около стен (чтобы боты не жались к ним)
        var pen = 0;
        for (var q = 0; q < 4; q++) {
          var ai = ni + dirs[q][0], aj = nj + dirs[q][1];
          if (ai < 0 || aj < 0 || ai >= nx || aj >= nz || nv.h[aj * nx + ai] - nv.h[nid] > STEP) { pen += 0.35; }
        }
        var ng = g[cur] + (d >= 4 ? 1.414 : 1) + pen;
        if (ng < g[nid]) { g[nid] = ng; from[nid] = cur; var hx = Math.abs(ni - ei), hz = Math.abs(nj - ej); pushH(nid, ng + Math.max(hx, hz) + 0.414 * Math.min(hx, hz)); }
      }
    }
    if (!found) return null;
    var out = [], p = e;
    while (p !== s && p >= 0) { out.push([((p % nx) + 0.5) * c, (((p / nx) | 0) + 0.5) * c]); p = from[p]; }
    out.reverse();
    if (out.length) out[out.length - 1] = [ex, ez];
    return out;
  }

  window.MXM = { maps: MAPS, list: LIST, groundAt: groundAt, buildNav: buildNav, path: path, STEP: STEP };
})();
