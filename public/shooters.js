/* shooters.js — MAX SHOOTERS: меню, выбор карты, создание комнаты, список комнат, лобби, сеть (PeerJS), запуск матча */
(function () {
  var MX = window.MX, W = window.MXW.W, MXM = window.MXM, S = window.MXSIM;
  if (!MX || !window.MXG) return;
  var MXS = window.MXS = {};
  var ov = null, sess = null, roomTimer = null, hbTimer = null;
  var MODES = { bomb: 'Закладка бомбы (как de_)', elim: 'Бой на уничтожение (команды)', dm: 'Все против всех' };
  var CFG = { sens: 1, skin: 'camo', name: '', map: 'de_dust2', mode: 'bomb', max: 10, bots: 6, diff: 'mid', rtw: 5, preset: 'classic', pub: true };
  try { var sv = JSON.parse(localStorage.getItem('mxs_cfg') || '{}'); for (var k in sv) if (k in CFG) CFG[k] = sv[k]; } catch (e) {}
  function save() { try { localStorage.setItem('mxs_cfg', JSON.stringify(CFG)); } catch (e) {} }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = document.createElement('style');
  css.textContent = [
    '.ms-maps{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '.ms-map{background:#0b1220;border:2px solid #1f2937;border-radius:12px;padding:8px;cursor:pointer;text-align:center}',
    '.ms-map.on{border-color:#f59e0b;background:#1b1a10}',
    '.ms-map canvas{width:100%;aspect-ratio:1;border-radius:8px;background:#141c28;display:block}',
    '.ms-map b{display:block;margin-top:5px;font-size:14px}.ms-map small{display:block;opacity:.65;font-size:11px;min-height:28px}',
    '.ms-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:10px 0}',
    '.ms-f label{display:block;font-size:12px;color:#9ca3af;margin-bottom:3px}',
    '.ms-f select,.ms-f input[type=text]{background:#0b1220;border:1px solid #374151;color:#fff;border-radius:10px;padding:9px;width:100%;font-size:14px}',
    '.ms-f input[type=range]{width:100%}',
    '.ms-w{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px}',
    '.ms-w label{display:flex;gap:6px;align-items:center;font-size:13px;color:#e5e7eb;margin:0}',
    '.ms-w h4{grid-column:1/-1;margin:10px 0 2px;font-size:13px;color:#fbbf24}',
    '.ms-title{font-size:26px;font-weight:900;letter-spacing:2px;margin:0}.ms-title span{color:#f59e0b}',
    '.ms-room{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px;border-top:1px solid #1f2937}',
    '.ms-pl{display:flex;justify-content:space-between;padding:6px 10px;border-radius:8px;background:#0b1220;margin-bottom:4px}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- превью карты сверху ---------- */
  function drawMap(cv, m) {
    var N = 140; cv.width = cv.height = N; var x = cv.getContext('2d'), s = N / Math.max(m.w, m.d), ox = (N - m.w * s) / 2, oy = (N - m.d * s) / 2;
    x.fillStyle = '#141c28'; x.fillRect(0, 0, N, N); x.fillStyle = '#243044'; x.fillRect(ox, oy, m.w * s, m.d * s);
    m.boxes.forEach(function (b) { if (b.x0 < 0 || b.z0 < 0 || b.x1 > m.w || b.z1 > m.d) return; x.fillStyle = b.h > 3 ? '#8a93a3' : (b.mat === 'metal' ? '#4d7a8c' : '#b8894d'); x.fillRect(ox + b.x0 * s, oy + (m.d - b.z1) * s, (b.x1 - b.x0) * s, (b.z1 - b.z0) * s); });
    m.spawnT.forEach(function (p) { x.fillStyle = '#f59e0b'; x.fillRect(ox + p[0] * s - 1.5, oy + (m.d - p[1]) * s - 1.5, 3, 3); });
    m.spawnCT.forEach(function (p) { x.fillStyle = '#60a5fa'; x.fillRect(ox + p[0] * s - 1.5, oy + (m.d - p[1]) * s - 1.5, 3, 3); });
    (m.sites || []).forEach(function (st) { x.fillStyle = '#ff5a3a'; x.font = 'bold 14px Arial'; x.textAlign = 'center'; x.fillText(st.n, ox + st.x * s, oy + (m.d - st.z) * s + 5); });
  }

  /* ---------- окно ---------- */
  function openOv() {
    if (ov && document.body.contains(ov)) { ov.style.display = ''; return ov; }
    ov = MX.overlay('MAX SHOOTERS', function () { stopLists(); if (sess && !sess.game) leaveSession(); ov = null; });
    return ov;
  }
  function stopLists() { clearInterval(roomTimer); roomTimer = null; }
  function setBody(node) { stopLists(); ov.body.innerHTML = ''; ov.body.appendChild(node); }

  MXS.open = function () {
    if (sess && sess.game) return;
    openOv(); home();
    MX.api('state').then(function (j) { if (j && j.name) MXS.name = j.name; if (j && typeof j.coins === 'number') ov && ov.setBal(j.coins); });
  };

  /* ---------- главная ---------- */
  function home() {
    if (sess) leaveSession(true);
    var w = el('div');
    w.innerHTML = '<div class="mx-card" style="margin-bottom:14px;background:linear-gradient(135deg,#1c1407,#111827)"><p class="ms-title">MAX <span>SHOOTERS</span></p><p style="font-size:14px;margin:6px 0 0">констр страйк — рассчитывай бомбу, покупай оружие, играй с друзьями или ботами</p></div><div class="mx-grid" id="msg"></div>';
    var g = w.querySelector('#msg');
    var cards = [
      ['🆕 Создать комнату', 'Выбери карту (Dust 2 и другие), режим, ботов и разрешённое оружие.', 'Создать', 'g', createForm],
      ['🌐 Список комнат', 'Зайти к друзьям или в открытую комнату.', 'Открыть', '', roomsList],
      ['⚡ Быстрая игра с ботами', 'Dust 2, бомба, ты и боты 5 на 5. Без ожидания.', 'Играть', 'y', quick],
      ['🎯 Тренировка', 'Все против всех на арене с ботами (aim_map).', 'Тренировка', '', training],
    ];
    cards.forEach(function (c) {
      var d = el('div', 'mx-card', '<h3>' + c[0] + '</h3><p>' + c[1] + '</p>'); var b = el('button', 'mx-b ' + c[3], c[2]); b.onclick = c[4]; d.appendChild(b); g.appendChild(d);
    });
    var code = el('div', 'mx-card', '<h3>🔑 Войти по коду</h3><p>Код комнаты пришлёт друг (он виден в лобби).</p><div class="mx-row"><input class="mx-in" id="msc" placeholder="Код" style="flex:1"><button class="mx-b">Войти</button></div>');
    code.querySelector('button').onclick = function () { var v = code.querySelector('#msc').value.trim(); if (v) joinPeer(v); };
    g.appendChild(code);
    var st = el('div', 'mx-card', '<h3>⚙️ Настройки</h3><p>Чувствительность мыши и вид оружия.</p>' +
      '<label style="font-size:12px;color:#9ca3af">Чувствительность</label><input type="range" id="mss" min="0.3" max="3" step="0.1" value="' + CFG.sens + '" style="width:100%">' +
      '<label style="font-size:12px;color:#9ca3af">Оружие</label><select class="mx-in" id="msk"><option value="camo">Красный камуфляж (как в видео)</option><option value="classic">Классика</option></select>');
    st.querySelector('#msk').value = CFG.skin;
    st.querySelector('#mss').oninput = function () { CFG.sens = +this.value; save(); };
    st.querySelector('#msk').onchange = function () { CFG.skin = this.value; save(); };
    g.appendChild(st);
    var hp = el('div', 'mx-card', '<h3>📖 Управление</h3><p style="line-height:1.6">WASD — ходьба · Мышь — обзор · ЛКМ — огонь · ПКМ — прицел/удар ножом<br>R — перезарядка · B — магазин · E (держать) — бомба · 1–4 — оружие<br>Ctrl — присесть · Shift — тихо · Пробел — прыжок · Tab — таблица<br>На телефоне: стик слева, кнопки справа.</p>');
    g.appendChild(hp);
    setBody(w);
  }

  /* ---------- создание комнаты ---------- */
  function createForm() {
    var w = el('div'), allowed = window.MXW.presetSet(CFG.preset);
    var h = '<div class="mx-card"><h3>🆕 Новая комната</h3><div class="ms-f">' +
      '<div><label>Название комнаты</label><input type="text" id="rn" maxlength="24"></div>' +
      '<div><label>Режим</label><select id="rm"></select></div>' +
      '<div><label>Игроков (вместе с ботами): <b id="rmaxv"></b></label><input type="range" id="rmax" min="2" max="10" step="1"></div>' +
      '<div><label>Ботов: <b id="rbv"></b></label><input type="range" id="rb" min="0" max="9" step="1"></div>' +
      '<div><label>Сложность ботов</label><select id="rd"><option value="easy">Лёгкая</option><option value="mid">Средняя</option><option value="hard">Сложная</option></select></div>' +
      '<div><label>Раундов до победы</label><select id="rr"><option>3</option><option>5</option><option>8</option><option>12</option></select></div>' +
      '</div><label style="font-size:13px;color:#e5e7eb"><input type="checkbox" id="rp"> Показывать комнату в общем списке</label></div>' +
      '<div class="mx-card" style="margin-top:12px"><h3>🗺️ Карта</h3><div class="ms-maps" id="rmaps"></div></div>' +
      '<div class="mx-card" style="margin-top:12px"><h3>🔫 Оружие в комнате</h3><p>Отметь, что можно покупать. Нож есть всегда.</p><div class="mx-row" style="margin-bottom:8px"><select class="mx-in" id="rpre" style="max-width:300px"></select><button class="mx-b" id="rall" style="background:#374151">Всё</button><button class="mx-b" id="rnone" style="background:#374151">Ничего</button></div><div class="ms-w" id="rw"></div></div>' +
      '<div class="mx-row" style="margin-top:14px"><button class="mx-b g" id="rgo" style="font-size:16px;padding:12px 22px">Создать комнату</button><button class="mx-b" id="rback" style="background:#374151">Назад</button></div>';
    w.innerHTML = h;
    var q = function (s) { return w.querySelector(s); };
    q('#rn').value = CFG.name || ('Комната ' + (MXS.name || ''));
    Object.keys(MODES).forEach(function (k) { var o = el('option', '', MODES[k]); o.value = k; q('#rm').appendChild(o); });
    q('#rm').value = CFG.mode; q('#rmax').value = CFG.max; q('#rb').value = CFG.bots; q('#rd').value = CFG.diff; q('#rr').value = String(CFG.rtw); q('#rp').checked = !!CFG.pub;
    var sync = function () {
      var mx = +q('#rmax').value; q('#rb').max = mx - 1; if (+q('#rb').value > mx - 1) q('#rb').value = mx - 1;
      q('#rmaxv').textContent = mx; q('#rbv').textContent = q('#rb').value;
      var m = MXM.maps[CFG.map]; var bo = q('#rm').querySelector('option[value=bomb]'); bo.disabled = !m.bomb; if (!m.bomb && q('#rm').value === 'bomb') q('#rm').value = 'elim';
    };
    q('#rmax').oninput = sync; q('#rb').oninput = sync; q('#rm').onchange = sync;
    // карты
    MXM.list.forEach(function (id) {
      var m = MXM.maps[id], c = el('div', 'ms-map' + (id === CFG.map ? ' on' : ''), '<canvas></canvas><b>' + id + '</b><small>' + esc(m.desc) + '</small>');
      drawMap(c.querySelector('canvas'), m);
      c.onclick = function () { CFG.map = id; q('#rmaps').querySelectorAll('.ms-map').forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); if (!m.bomb && q('#rm').value === 'bomb') q('#rm').value = 'elim'; sync(); };
      q('#rmaps').appendChild(c);
    });
    // оружие
    var boxes = {};
    window.MXW.GROUPS.forEach(function (g) {
      q('#rw').appendChild(el('h4', '', g.n));
      g.ids.forEach(function (id) {
        var wp = W[id], l = el('label', '', '<input type="checkbox"> ' + wp.n + (wp.price ? ' <small style="opacity:.6">$' + wp.price + '</small>' : '') + (wp.crazy ? ' <small style="color:#f87171">crazy</small>' : ''));
        var cb = l.firstChild; boxes[id] = cb; if (id === 'knife') { cb.checked = true; cb.disabled = true; }
        cb.onchange = function () { if (cb.checked) allowed[id] = true; else delete allowed[id]; };
        q('#rw').appendChild(l);
      });
    });
    var fill = function () { Object.keys(boxes).forEach(function (id) { if (id !== 'knife') boxes[id].checked = !!allowed[id]; }); };
    window.MXW.PRESETS.forEach(function (p) { var o = el('option', '', 'Набор: ' + p.n); o.value = p.id; q('#rpre').appendChild(o); });
    q('#rpre').value = CFG.preset;
    q('#rpre').onchange = function () { CFG.preset = this.value; allowed = window.MXW.presetSet(this.value); fill(); };
    q('#rall').onclick = function () { allowed = window.MXW.presetSet('all'); fill(); };
    q('#rnone').onclick = function () { allowed = { knife: true }; fill(); };
    fill(); sync();
    q('#rback').onclick = home;
    q('#rgo').onclick = function () {
      CFG.name = q('#rn').value.trim() || ('Комната ' + (MXS.name || '')); CFG.mode = q('#rm').value; CFG.max = +q('#rmax').value; CFG.bots = +q('#rb').value; CFG.diff = q('#rd').value; CFG.rtw = +q('#rr').value; CFG.pub = q('#rp').checked; save();
      if (!Object.keys(allowed).some(function (k) { return k !== 'knife'; }) && !confirm('Разрешён только нож. Создать комнату «только ножи»?')) return;
      hostRoom({ name: CFG.name, map: CFG.map, mode: CFG.mode, max: CFG.max, bots: CFG.bots, diff: CFG.diff, rtw: CFG.rtw, allowed: allowed, pub: CFG.pub, autostart: false });
    };
    setBody(w);
  }
  function quick() { hostRoom({ name: 'Быстрая игра', map: 'de_dust2', mode: 'bomb', max: 10, bots: 9, diff: 'mid', rtw: 5, allowed: window.MXW.presetSet('classic'), pub: false, autostart: true, solo: true }); }
  function training() { hostRoom({ name: 'Тренировка', map: 'aim_map', mode: 'dm', max: 6, bots: 5, diff: 'mid', rtw: 1, allowed: window.MXW.presetSet('all'), pub: false, autostart: true, solo: true }); }

  /* ---------- список комнат ---------- */
  function roomsList() {
    var w = el('div', 'mx-card', '<h3>🌐 Комнаты</h3><p>Список обновляется сам. Если комнаты нет — создай свою.</p><div id="rl">Загрузка…</div><div class="mx-row" style="margin-top:10px"><button class="mx-b" id="rlb" style="background:#374151">Назад</button></div>');
    w.querySelector('#rlb').onclick = home;
    setBody(w);
    var load = function () {
      MX.api('rooms').then(function (j) {
        var box = w.querySelector('#rl'); if (!box) return;
        if (j.err) { box.textContent = j.err; return; }
        if (!j.rooms.length) { box.innerHTML = '<p>Пока нет открытых комнат.</p>'; return; }
        box.innerHTML = '';
        j.rooms.forEach(function (r) {
          var ws = window.MXW.decode(r.weapons), cnt = Object.keys(ws).length - 1;
          var d = el('div', 'ms-room', '<div><b>' + esc(r.name) + '</b><div style="font-size:12px;opacity:.75">' + esc(r.map) + ' · ' + esc(MODES[r.mode] || r.mode) + ' · хозяин ' + esc(r.host) + '<br>игроков ' + r.hum + '/' + r.max + ' · ботов ' + r.bots + ' · оружия разрешено: ' + cnt + '</div></div>');
          var b = el('button', 'mx-b g', 'Войти'); b.onclick = function () { joinPeer(r.peer); }; d.appendChild(b); box.appendChild(d);
        });
      });
    };
    load(); roomTimer = setInterval(load, 4000);
  }

  /* ---------- сессия ---------- */
  function mkSession(isHost, opts) {
    var s = { isHost: isHost, opts: opts, roster: {}, game: null, myId: 0, send: function () {}, closed: false, conns: {}, started: false };
    return s;
  }
  function optsPublic(o) { return { map: o.map, mode: o.mode, rtw: o.rtw, diff: o.diff, max: o.max, bots: o.bots, name: o.name, wh: window.MXW.encode(o.allowed) }; }
  function leaveSession(silent) {
    var s = sess; if (!s) return; sess = null; s.closed = true;
    clearInterval(hbTimer); hbTimer = null;
    try { if (s.worker) { s.worker.terminate(); } } catch (e) {}
    try { if (s.isHost && s.pub) MX.api('room_del', {}); } catch (e) {}
    try { if (s.peer) s.peer.destroy(); } catch (e) {}
    try { if (s.conn) s.conn.close(); } catch (e) {}
    if (s.game) { var g = s.game; s.game = null; try { g.destroy(); } catch (e) {} if (g.root && g.root.parentNode) g.root.parentNode.removeChild(g.root); }
  }

  /* ---------- хозяин ---------- */
  function hostRoom(o) {
    var s = sess = mkSession(true, o);
    s.sim = new S.Sim({ map: o.map, mode: o.mode, rtw: o.rtw, diff: o.diff, max: o.max, bots: o.bots, allowed: o.allowed });
    s.opts.mode = s.sim.o.mode; // если карта без бомбы — режим уже поправлен
    var me = s.sim.addHuman(MXS.name || 'Игрок', 'auto'); s.myId = me.id;
    s.sim.sendTo = function (id, m) { if (id === s.myId) feed(s, m); else { var c = s.conns[id]; if (c && c.open) try { c.send(m); } catch (e) {} } };
    s.send = function (m) { hostHandle(s, s.myId, m); };
    s.worker = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(1)},33)'], { type: 'text/javascript' })));
    var last = performance.now(), acc = 0;
    s.worker.onmessage = function () {
      if (s.closed) return;
      var now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      s.sim.tick(dt); acc += dt;
      if (acc >= 0.05) { acc = 0; broadcast(s); }
    };
    var afterPeer = function () {
      if (o.autostart) startMatch(s); else lobby(s);
    };
    if (o.solo) { afterPeer(); return; }
    var done = false;
    var fallback = setTimeout(function () { if (done) return; done = true; MX.toast('Не удалось подключиться к серверу соединений — комната только для тебя'); afterPeer(); }, 9000);
    try {
      s.peer = new Peer();
      s.peer.on('open', function (id) {
        if (done || s.closed) return; done = true; clearTimeout(fallback); s.code = id;
        s.peer.on('connection', function (c) { hostConn(s, c); });
        if (o.pub) { s.pub = true; publish(s); hbTimer = setInterval(function () { publish(s); }, 8000); }
        afterPeer();
      });
      s.peer.on('error', function (e) { if (!done) { done = true; clearTimeout(fallback); MX.toast('Ошибка сети: ' + (e && e.type || e)); afterPeer(); } });
    } catch (e) { done = true; clearTimeout(fallback); afterPeer(); }
  }
  function publish(s) {
    if (s.closed || !s.code) return;
    MX.api('room_save', { name: s.opts.name, map: s.opts.map, mode: s.opts.mode, max: s.opts.max, bots: s.opts.bots, hum: s.sim.humans().length, weapons: window.MXW.encode(s.opts.allowed), diff: s.opts.diff, rounds: s.opts.rtw, peer: s.code });
  }
  function hostConn(s, c) {
    c.on('data', function (d) {
      if (s.closed || !d) return;
      if (d.t === 'join') {
        if (s.sim.humans().length >= s.opts.max) { try { c.send({ t: 'full' }); } catch (e) {} setTimeout(function () { try { c.close(); } catch (e) {} }, 400); return; }
        var p = s.sim.addHuman(String(d.name || 'Игрок').slice(0, 20), 'auto'); c.pid = p.id; s.conns[p.id] = c;
        c.send({ t: 'welcome', id: p.id, opts: optsPublic(s.opts), started: s.sim.started, code: s.code });
        if (s.sim.started) { c.send({ t: 'pk', e: [{ t: 'roster', list: s.sim.players.map(function (q) { return { id: q.id, n: q.name, tm: q.team, b: q.bot ? 1 : 0 }; }) }, { t: 'start' }] }); }
      } else if (c.pid) hostHandle(s, c.pid, d);
    });
    c.on('close', function () { if (c.pid && !s.closed) { s.sim.removePlayer(c.pid); delete s.conns[c.pid]; } });
  }
  function hostHandle(s, id, m) {
    var sim = s.sim;
    switch (m.t) {
      case 'in': sim.input(id, m); break;
      case 'fire': sim.humanFire(id, m); break;
      case 'buy': sim.humanBuy(id, m.id); break;
      case 'use': sim.use(id, m.on); break;
      case 'team': if (!sim.started) sim.setTeam(id, m.team); break;
    }
  }
  function broadcast(s) {
    var ev = s.sim.drainEvents(), pk = { t: 'pk', s: s.sim.snapshot(), e: ev };
    var raw = pk;
    for (var id in s.conns) { var c = s.conns[id]; if (c && c.open) try { c.send(raw); } catch (e) {} }
    feed(s, pk);
  }
  function startMatch(s) {
    if (s.started) return; s.started = true;
    s.sim.startMatch();
    launchGame(s);
    broadcast(s);
  }

  /* ---------- игрок: вход в комнату ---------- */
  function joinPeer(code) {
    openOv();
    var w = el('div', 'mx-card', '<h3>Подключение…</h3><p>Заходим в комнату. Это занимает несколько секунд.</p><button class="mx-b" style="background:#374151">Отмена</button>');
    w.querySelector('button').onclick = function () { leaveSession(); home(); };
    setBody(w);
    var s = sess = mkSession(false, null), done = false;
    var fail = function (m) { if (done) return; done = true; MX.toast(m); leaveSession(); home(); };
    var to = setTimeout(function () { fail('Не удалось подключиться к комнате'); }, 12000);
    try {
      s.peer = new Peer();
      s.peer.on('error', function (e) { clearTimeout(to); fail('Ошибка соединения: ' + (e && e.type || e)); });
      s.peer.on('open', function () {
        var c = s.conn = s.peer.connect(code, { reliable: true });
        c.on('open', function () { c.send({ t: 'join', name: MXS.name || 'Игрок' }); });
        c.on('data', function (d) {
          if (!d || s.closed) return;
          if (d.t === 'full') { clearTimeout(to); fail('Комната заполнена'); return; }
          if (d.t === 'welcome') {
            clearTimeout(to); done = true; s.myId = d.id; s.code = d.code;
            s.opts = { map: d.opts.map, mode: d.opts.mode, rtw: d.opts.rtw, diff: d.opts.diff, max: d.opts.max, bots: d.opts.bots, name: d.opts.name, allowed: window.MXW.decode(d.opts.wh) };
            s.send = function (m) { try { c.send(m); } catch (e) {} };
            if (!MXM.maps[s.opts.map]) { fail('Эта карта неизвестна'); return; }
            lobby(s); return;
          }
          feed(s, d);
        });
        c.on('close', function () { if (!s.closed) { MX.toast('Связь с хозяином комнаты потеряна'); exitToHome(); } });
      });
    } catch (e) { fail('Сетевой модуль недоступен'); }
  }

  /* ---------- общий приём сообщений: лобби -> игра ---------- */
  function feed(s, m) {
    if (s.closed) return;
    if (s.game) { s.game.onMsg(m); return; }
    if (m.t === 'inv') { s.pend = m; return; } // личные сообщения до начала игры запоминаем
    if (m.t === 'pk' && m.e) {
      var launch = false;
      m.e.forEach(function (e) {
        if (e.t === 'roster') { s.roster = {}; e.list.forEach(function (r) { s.roster[r.id] = r; }); lobbyRefresh(s); }
        if (e.t === 'start') launch = true;
      });
      if (launch && !s.started) { s.started = true; launchGame(s); s.game && s.game.onMsg(m); }
    }
  }

  /* ---------- лобби ---------- */
  function lobby(s) {
    openOv(); s.lobbyOn = true;
    var o = s.opts, w = el('div');
    var cnt = Object.keys(o.allowed).length - 1;
    w.innerHTML = '<div class="mx-card"><h3>🚪 ' + esc(o.name) + '</h3><p>' + esc(o.map) + ' · ' + esc(MODES[o.mode]) + ' · ботов: ' + o.bots + ' · игроков до ' + o.max + ' · оружия разрешено: ' + cnt + '</p>' +
      (s.code ? '<p>Код комнаты для друзей: <b style="user-select:all;color:#fbbf24" id="lcode">' + esc(s.code) + '</b> <button class="mx-b" id="lcopy" style="padding:4px 10px;font-size:12px;background:#374151">Копировать</button></p>' : '<p>Комната только для тебя (без сети).</p>') +
      '<div id="lpl"></div><div class="mx-row" style="margin-top:12px" id="lbt"></div></div>';
    var bt = w.querySelector('#lbt');
    if (!s.isHost) { var t1 = el('button', 'mx-b', 'Команда: T'), t2 = el('button', 'mx-b', 'Команда: CT'); t1.onclick = function () { s.send({ t: 'team', team: 'T' }); }; t2.onclick = function () { s.send({ t: 'team', team: 'CT' }); }; bt.appendChild(t1); bt.appendChild(t2); }
    else {
      var t1h = el('button', 'mx-b', 'Я за T'), t2h = el('button', 'mx-b', 'Я за CT'); t1h.onclick = function () { s.sim.setTeam(s.myId, 'T'); lobbyRefresh(s); }; t2h.onclick = function () { s.sim.setTeam(s.myId, 'CT'); lobbyRefresh(s); };
      bt.appendChild(t1h); bt.appendChild(t2h);
      var go = el('button', 'mx-b g', '▶ Начать матч'); go.onclick = function () { startMatch(s); }; bt.appendChild(go);
    }
    var lv = el('button', 'mx-b r', 'Выйти'); lv.onclick = function () { exitToHome(); }; bt.appendChild(lv);
    var cp = w.querySelector('#lcopy'); if (cp) cp.onclick = function () { try { navigator.clipboard.writeText(s.code); MX.toast('Код скопирован'); } catch (e) { MX.toast('Выдели код и скопируй'); } };
    setBody(w); s.lobbyEl = w; lobbyRefresh(s);
    if (s.isHost) { s.lobbyTimer = setInterval(function () { if (s.closed || s.game) clearInterval(s.lobbyTimer); else lobbyRefresh(s); }, 1000); }
  }
  function lobbyRefresh(s) {
    if (!s.lobbyEl || s.game || !s.lobbyEl.isConnected) return;
    var box = s.lobbyEl.querySelector('#lpl'); if (!box) return;
    var list;
    if (s.isHost) list = s.sim.humans().map(function (p) { return { id: p.id, n: p.name, tm: p.team }; });
    else list = Object.keys(s.roster).map(function (k) { return s.roster[k]; }).filter(function (r) { return !r.b; });
    var h = '<div style="margin:8px 0;font-size:13px;opacity:.8">Игроки в комнате (' + list.length + '):</div>';
    list.forEach(function (r) { h += '<div class="ms-pl"><span>' + esc(r.n) + (r.id === s.myId ? ' (ты)' : '') + '</span><b style="color:' + (r.tm === 'T' ? '#f6ad55' : '#7cb7ff') + '">' + r.tm + '</b></div>'; });
    if (!s.isHost && !list.length) h += '<p style="opacity:.7">Ждём список игроков… Хозяин комнаты скоро начнёт матч.</p>';
    box.innerHTML = h;
  }
  function exitToHome() { var had = sess; leaveSession(); if (ov && document.body.contains(ov)) { ov.style.display = ''; home(); } }

  /* ---------- запуск матча ---------- */
  function launchGame(s) {
    clearInterval(s.lobbyTimer);
    if (ov) ov.style.display = 'none';
    var root = document.createElement('div'); document.body.appendChild(root);
    var reported = false;
    var report = function (won, cb) {
      if (reported) return; reported = true; var g = s.game; if (!g) return;
      MX.api('sh_result', { kills: g.stats.k, hs: g.stats.hs, rw: g.stats.rw, won: won ? 1 : 0, secs: Math.floor(g.stats.sec), plants: g.stats.pl, defuses: g.stats.df }).then(function (j) {
        var t = j.err ? j.err : (j.msg || ''); if (j.st && ov) { }
        cb && cb(t);
      });
    };
    var g = s.game = new window.MXG.Game({
      root: root, mapId: s.opts.map, myId: s.myId, myName: MXS.name || 'Игрок', sens: CFG.sens,
      opts: { mode: s.opts.mode, rtw: s.opts.rtw, diff: s.opts.diff, max: s.opts.max, allowed: s.opts.allowed, skin: CFG.skin },
      send: s.send,
      onOver: function (won, setTxt) { report(won, function (t) { setTxt(t || 'Матч завершён'); }); },
      onExit: function (why) {
        var gg = s.game;
        if (!reported && gg && gg.stats.sec >= 30 && !gg.ended) report(false, function (t) { if (t) MX.toast(t); });
        if (why && why !== 'leave') MX.toast(why);
        s.game = null;
        try { gg.destroy(); } catch (e) {} if (root.parentNode) root.parentNode.removeChild(root);
        sess = s; leaveSession();
        if (ov && document.body.contains(ov)) { ov.style.display = ''; home(); } else MXS.open();
      }
    });
    if (g.dead) return;
    MX.api('sh_start', { humans: s.isHost ? s.sim.humans().length : Math.max(1, Object.keys(s.roster).filter(function (k) { return !s.roster[k].b; }).length), bots: s.opts.bots });
    // начальный состав
    var rl = s.isHost ? s.sim.players.map(function (q) { return { id: q.id, n: q.name, tm: q.team, b: q.bot ? 1 : 0 }; }) : Object.keys(s.roster).map(function (k) { return s.roster[k]; });
    g.onEvent({ t: 'roster', list: rl });
    if (s.pend) { g.onMsg(s.pend); s.pend = null; }
    g.start();
  }

  MXS.dbg = function () { return sess; };
  MXS._hc = function (s, c) { hostConn(s, c); };
  MX.addMenu('shooters', '🔫', 'MAX SHOOTERS', 'констр страйк', MXS.open, true);
})();
