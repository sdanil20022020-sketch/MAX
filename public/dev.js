/* dev.js — секретная панель разработчика.
   Открывается нажатием на название/иконку MAX. Пароль проверяет сервер, поэтому подделать доступ в браузере нельзя. */
(function () {
  var MX = window.MX;
  if (!MX || MX.devLoaded) return;
  MX.devLoaded = true;

  function dapi(path, body) {
    return window.fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-token': MX.getToken() || '' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().catch(function () { return { error: 'Ошибка ответа сервера' }; }); })
      .catch(function () { return { error: 'Нет связи с сервером', net: 1 }; });
  }

  /* ---------- пункт меню «Панель разработчика» — самый первый ---------- */
  var added = false;
  function setAdmin(on) {
    if (on && !added) { added = true; MX.addMenu('dev', '🛠', 'Панель разработчика', 'только для админа', openPanel, false, true); }
    if (!on && added) { added = false; MX.removeMenu('dev'); }
  }
  var lastTok = null;
  function check() {
    var t = MX.getToken();
    if (!t || t === lastTok) return;
    lastTok = t;
    dapi('/api/dev/status').then(function (j) {
      if (j && j.net) { lastTok = null; return; }
      setAdmin(!!(j && j.admin));
    });
  }
  setInterval(check, 3000); check();

  /* ---------- клик по MAX ---------- */
  function vis(n) { return !!(n.offsetWidth || n.offsetHeight || (n.getClientRects && n.getClientRects().length)); }
  function settingsOpen() {
    var all = document.body.querySelectorAll('*'), i, n, t;
    for (i = 0; i < all.length; i++) {
      n = all[i];
      if (n.children.length > 2 || /^(SCRIPT|STYLE)$/.test(n.tagName)) continue;
      t = (n.textContent || '').replace(/[\u2699\uFE0F\u26ED\s]/g, '');
      if (/^(настройки|settings)$/i.test(t) && vis(n)) return true;
    }
    return false;
  }
  function isGearEl(n) {
    var tx = (n.textContent || '').replace(/\s+/g, '').trim();
    var idc = ((n.id || '') + ' ' + (typeof n.className === 'string' ? n.className : (n.className && n.className.baseVal) || '') + ' ' + (n.getAttribute ? (n.getAttribute('title') || '') + (n.getAttribute('aria-label') || '') + (n.getAttribute('data-icon') || '') + (n.getAttribute('alt') || '') : '')).toLowerCase();
    if (/^[\u2699\u26ED]\uFE0F?$/.test(tx)) return true;
    if (/gear|cog|setting|настр|шестер/.test(idc) && tx.length < 3) return true;
    return false;
  }
  function gearOf(e) {
    var list = (document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [e.target]), i, n, k;
    if (e.clientY > 200) return null;
    for (i = 0; i < list.length; i++) {
      n = list[i];
      if (n.closest && n.closest('.mx-ov')) return null;
      for (k = 0; n && n !== document.body && k < 3; n = n.parentElement, k++) if (isGearEl(n)) return n;
    }
    return null;
  }
  var taps = [], gtaps = [], lastG = null, lastT = 0;
  document.addEventListener('click', function (e) {
    try {
      var g = gearOf(e), t = Date.now();
      if (g) {
        var inSet = settingsOpen();
        var second = lastG && lastG !== g && (t - lastT) < 20000;
        gtaps.push(t);
        gtaps = gtaps.filter(function (x) { return t - x < 1600; });
        lastG = g; lastT = t;
        if (inSet || second || gtaps.length >= 3) { gtaps = []; lastG = null; askPass(); }
        return;
      }
      if (e.clientX < 140 && e.clientY < 110 && !(e.target.closest && e.target.closest('.mx-ov'))) {
        taps.push(t);
        taps = taps.filter(function (x) { return t - x < 2500; });
        if (taps.length >= 5) { taps = []; askPass(); }
      }
    } catch (x) {}
  }, true);
  /* запасные способы: Ctrl+Alt+M, адрес с #dev, команда MXDEV() в консоли */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) askPass();
  });
  window.MXDEV = askPass;
  function hashCheck() { if (/dev/.test(location.hash)) { setTimeout(askPass, 600); } }
  hashCheck();
  window.addEventListener('hashchange', hashCheck);

  function askPass() {
    if (added) { openPanel(); return; }
    if (document.querySelector('.mx-dev-ask')) return;
    var ov = document.createElement('div');
    ov.className = 'mx-ov mx-dev-ask';
    ov.style.cssText += ';display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75)';
    ov.innerHTML = '<div class="mx-card" style="width:min(340px,92vw)"><h3>🔒 Доступ</h3><input class="mx-in" type="password" inputmode="numeric" autocomplete="off" placeholder="Пароль"><div class="mx-row" style="margin-top:10px"><button class="mx-b g go">Войти</button><button class="mx-b no" style="background:#374151">Отмена</button></div><p class="msg" style="color:#fca5a5"></p></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('input'), msg = ov.querySelector('.msg');
    function close() { ov.remove(); }
    function go() {
      var v = inp.value;
      if (!v) return;
      dapi('/api/dev/unlock', { pass: v }).then(function (j) {
        if (j && j.ok) { setAdmin(true); close(); openPanel(); }
        else msg.textContent = (j && (j.msg || j.error)) || 'Ошибка';
      });
    }
    ov.querySelector('.go').onclick = go;
    ov.querySelector('.no').onclick = close;
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); else if (e.key === 'Escape') close(); });
    setTimeout(function () { inp.focus(); }, 50);
  }

  /* ---------- сама панель ---------- */
  function openPanel() {
    var ov = MX.overlay('🛠 Панель разработчика');
    var w = ov.body;
    w.innerHTML =
      '<div class="mx-grid">' +
      '<div class="mx-card"><h3>Игрок</h3><p>Выбери игрока из списка или впиши ник.</p>' +
      '<input class="mx-in dn" placeholder="Ник игрока" style="margin-bottom:8px">' +
      '<input class="mx-in da" type="number" min="1" placeholder="Сумма монет" style="margin-bottom:10px">' +
      '<div class="mx-row"><button class="mx-b g bg">➕ Выдать</button><button class="mx-b y bt">➖ Забрать</button></div>' +
      '<div class="mx-row" style="margin-top:8px"><button class="mx-b r bb">🚫 Забанить</button><button class="mx-b bu">✅ Разбанить</button></div></div>' +
      '<div class="mx-card"><h3>Игроки <span class="cnt" style="opacity:.6;font-weight:400"></span></h3>' +
      '<div class="mx-row" style="margin-bottom:8px"><input class="mx-in ds" placeholder="Поиск по нику" style="flex:1"><button class="mx-b dr">⟳</button></div>' +
      '<div class="dl" style="max-height:340px;overflow:auto"></div></div>' +
      '<div class="mx-card" style="border-color:#7f1d1d"><h3>⚠ Опасная зона</h3><p>Нельзя отменить.</p>' +
      '<div class="mx-row"><button class="mx-b r bw">💸 Забрать деньги у всех</button></div>' +
      '<div class="mx-row" style="margin-top:8px"><button class="mx-b r bz">🧹 Обнулить все аккаунты</button></div>' +
      '<p style="margin-top:8px">«Обнулить» стирает у всех монеты, прокачку, казино, танки, друзей, заработок и аватарки. Сами аккаунты (ник и пароль) остаются.</p></div>' +
      '</div>';
    var q = function (s) { return w.querySelector(s); };
    var users = [];
    function render() {
      var f = q('.ds').value.trim().toLowerCase(), box = q('.dl');
      box.innerHTML = '';
      users.filter(function (u) { return !f || u.nick.toLowerCase().indexOf(f) >= 0; }).forEach(function (u) {
        var r = document.createElement('div');
        r.className = 'mx-q'; r.style.cursor = 'pointer';
        var a = document.createElement('span'); a.textContent = (u.admin ? '👑 ' : '') + (u.banned ? '🚫 ' : '') + u.nick;
        var b = document.createElement('b'); b.textContent = '🪙 ' + MX.fmt(u.coins); b.style.color = '#fbbf24';
        r.appendChild(a); r.appendChild(b);
        r.onclick = function () { q('.dn').value = u.nick; };
        box.appendChild(r);
      });
    }
    function load() {
      dapi('/api/dev/users').then(function (j) {
        if (!j || !j.users) { MX.toast((j && j.error) || 'Не удалось загрузить игроков'); return; }
        users = j.users; q('.cnt').textContent = '(' + j.total + ')'; render();
      });
    }
    function act(path, body, okMsg) {
      dapi(path, body).then(function (j) {
        if (j && j.ok) { MX.toast(okMsg(j)); load(); }
        else MX.toast((j && (j.error || j.msg)) || 'Ошибка');
      });
    }
    function target() { var n = q('.dn').value.trim(); if (!n) { MX.toast('Впиши ник игрока'); return null; } return n; }
    function amount() { var a = Math.floor(+q('.da').value); if (!(a > 0)) { MX.toast('Впиши сумму больше нуля'); return 0; } return a; }
    q('.bg').onclick = function () { var n = target(), a = n && amount(); if (n && a) act('/api/dev/give', { nick: n, amount: a }, function (j) { return j.nick + ': +' + MX.fmt(a) + ' (теперь ' + MX.fmt(j.coins) + ')'; }); };
    q('.bt').onclick = function () { var n = target(), a = n && amount(); if (n && a) act('/api/dev/take', { nick: n, amount: a }, function (j) { return j.nick + ': −' + MX.fmt(a) + ' (теперь ' + MX.fmt(j.coins) + ')'; }); };
    q('.bb').onclick = function () { var n = target(); if (n && confirm('Забанить ' + n + '?')) act('/api/dev/ban', { nick: n, on: 1 }, function (j) { return j.nick + ' забанен'; }); };
    q('.bu').onclick = function () { var n = target(); if (n) act('/api/dev/ban', { nick: n, on: 0 }, function (j) { return j.nick + ' разбанен'; }); };
    q('.bw').onclick = function () { if (confirm('Забрать монеты у ВСЕХ игроков?')) act('/api/dev/wipecoins', {}, function (j) { return 'Монеты обнулены у ' + j.count + ' игроков'; }); };
    q('.bz').onclick = function () {
      var v = prompt('Это обнулит ВСЕ аккаунты (ники и пароли останутся). Напиши слово СБРОС, чтобы подтвердить:');
      if (v === 'СБРОС') act('/api/dev/resetall', { confirm: 'СБРОС' }, function (j) { return 'Обнулено аккаунтов: ' + j.count; });
    };
    q('.dr').onclick = load;
    q('.ds').oninput = render;
    load();
  }

  MX.devOpen = askPass;
})();
try{console.log('[dev.js] загружен');}catch(e){}
