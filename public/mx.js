/* mx.js — общий загрузчик: заработок + MAX SHOOTERS.
   Подключается в index.html одной строкой: <script src="/mx.js"></script> */
(function () {
  if (window.MX) return;
  var MX = window.MX = { token: '', ver: '1' };

  /* ---------- токен аккаунта: подсматриваем в запросах сайта ---------- */
  var of = window.fetch;
  if (of) {
    window.fetch = function (input, init) {
      try {
        var h = init && init.headers, t = '';
        if (h) t = (typeof h.get === 'function') ? h.get('x-token') : (h['x-token'] || h['X-Token'] || h['X-token']);
        if (!t && input && input.headers && input.headers.get) t = input.headers.get('x-token');
        if (t) MX.token = t;
      } catch (e) {}
      return of.apply(this, arguments);
    };
  }
  function scanStore() {
    try {
      var best = '';
      [localStorage, sessionStorage].forEach(function (S) {
        for (var i = 0; i < S.length; i++) {
          var v = S.getItem(S.key(i)) || '';
          var k = S.key(i) || '';
          if (/^[A-Za-z0-9_\-]{24,128}$/.test(v) && /tok|auth|session/i.test(k)) best = v;
          else if (v.charAt(0) === '{' || v.charAt(0) === '[') {
            try {
              (function walk(o, d) {
                if (!o || typeof o !== 'object' || d > 3) return;
                for (var kk in o) {
                  var x = o[kk];
                  if (typeof x === 'string' && /^(token|tok|t|x-token)$/i.test(kk) && /^[A-Za-z0-9_\-]{16,128}$/.test(x)) best = best || x;
                  else if (x && typeof x === 'object') walk(x, d + 1);
                }
              })(JSON.parse(v), 0);
            } catch (e) {}
          }
        }
      });
      return best;
    } catch (e) { return ''; }
  }
  MX.getToken = function () { return MX.token || scanStore(); };

  /* ---------- запросы к /api/mx ---------- */
  MX.api = function (a, body) {
    var t = MX.getToken();
    return of.call(window, '/api/mx?a=' + encodeURIComponent(a), {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-token': t || '' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && typeof j.coins === 'number') MX.setBalance(j.coins);
      return j;
    }).catch(function () { return { err: 'Нет связи с сервером' }; });
  };

  MX.fmt = function (n) { return Math.floor(n).toLocaleString('ru-RU'); };
  MX.toast = function (m) {
    if (typeof window.toast === 'function') { try { window.toast(m); return; } catch (e) {} }
    var d = document.createElement('div');
    d.className = 'mx-toast'; d.textContent = m;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2600);
  };
  // обновляем число баланса на странице (🪙 123)
  MX.setBalance = function (n) {
    try {
      var els = document.querySelectorAll('body *');
      for (var i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.children.length === 0 && !e.closest('.mx-ov') && /^\s*🪙\s*[\d\s  .,]+\s*$/.test(e.textContent)) e.textContent = '🪙 ' + MX.fmt(n);
      }
    } catch (e) {}
    MX.coins = n;
  };

  /* ---------- стили ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.mx-ov{position:fixed;inset:0;z-index:9000;background:#0b0f17;color:#e8ecf4;font:15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow:auto;-webkit-overflow-scrolling:touch}',
    '.mx-ov *{box-sizing:border-box}',
    '.mx-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 16px;background:#111827;border-bottom:1px solid #1f2937}',
    '.mx-top h2{margin:0;font-size:18px;flex:1}',
    '.mx-x{background:#1f2937;color:#fff;border:0;border-radius:10px;padding:8px 14px;font-size:15px;cursor:pointer}',
    '.mx-bal{font-weight:700;color:#fbbf24}',
    '.mx-wrap{max-width:980px;margin:0 auto;padding:16px}',
    '.mx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}',
    '.mx-card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px}',
    '.mx-card h3{margin:0 0 6px;font-size:16px}',
    '.mx-card p{margin:4px 0 10px;color:#9ca3af;font-size:13px}',
    '.mx-b{background:#2563eb;color:#fff;border:0;border-radius:10px;padding:10px 14px;font-size:14px;font-weight:600;cursor:pointer}',
    '.mx-b:disabled{background:#374151;color:#9ca3af;cursor:default}',
    '.mx-b.g{background:#16a34a}.mx-b.r{background:#dc2626}.mx-b.y{background:#d97706}',
    '.mx-in{background:#0b1220;border:1px solid #374151;color:#fff;border-radius:10px;padding:10px;font-size:14px;width:100%}',
    '.mx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.mx-bar{height:8px;background:#1f2937;border-radius:6px;overflow:hidden;margin:6px 0}',
    '.mx-bar i{display:block;height:100%;background:#22c55e}',
    '.mx-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#111827;color:#fff;border:1px solid #374151;padding:10px 16px;border-radius:12px;z-index:99999}',
    '.mx-big{font-size:34px;text-align:center;margin:6px 0;min-height:42px}',
    '.mx-q{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 0;border-top:1px solid #1f2937;font-size:13px}',
    '.mx-sub{font-size:11px;opacity:.65;display:block;font-weight:400}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- окно поверх сайта ---------- */
  MX.overlay = function (title, onClose) {
    var ov = document.createElement('div');
    ov.className = 'mx-ov';
    ov.innerHTML = '<div class="mx-top"><h2></h2><span class="mx-bal"></span><button class="mx-x">✕ Закрыть</button></div><div class="mx-wrap"></div>';
    ov.querySelector('h2').textContent = title;
    ov.querySelector('.mx-x').onclick = function () { ov.remove(); document.body.style.overflow = ''; if (onClose) onClose(); };
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    ov.body = ov.querySelector('.mx-wrap');
    ov.setBal = function (n) { ov.querySelector('.mx-bal').textContent = '🪙 ' + MX.fmt(n); };
    if (typeof MX.coins === 'number') ov.setBal(MX.coins);
    return ov;
  };

  /* ---------- кнопки в меню (клонируем пункт «Друзья») ---------- */
  var items = [];
  MX.addMenu = function (id, ico, label, sub, fn, first) { var it = { id: id, ico: ico, label: label, sub: sub, fn: fn }; if (first) items.unshift(it); else items.push(it); schedule(); };

  function findItem(text) {
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('.mx-ov') || e.children.length) continue;
      if (e.textContent.trim() !== text) continue;
      var n = e;
      while (n.parentElement && n.parentElement !== document.body) {
        var p = n.parentElement;
        if (p.children.length >= 2) {
          var same = 0; for (var j = 0; j < p.children.length; j++) if (p.children[j].tagName === n.tagName) same++;
          if (same >= 2) return n;
        }
        n = p;
      }
    }
    return null;
  }
  function leaves(el) {
    var r = [], all = el.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) if (!all[i].children.length) r.push(all[i]);
    if (!r.length) r.push(el);
    return r;
  }
  function build(it, proto) {
    var cl = proto.cloneNode(true);
    cl.setAttribute('data-mx', it.id);
    cl.removeAttribute('onclick'); cl.removeAttribute('id');
    ['on', 'active', 'sel', 'selected', 'act'].forEach(function (c) { cl.classList.remove(c); });
    var lv = leaves(cl), label = null, icon = null, extra = [];
    lv.forEach(function (l) {
      var t = l.textContent.trim();
      if (t === 'Друзья') label = l;
      else if (!icon && (t.length <= 3 || l.tagName === 'IMG' || l.tagName === 'SVG')) icon = l;
      else extra.push(l);
    });
    if (label) label.textContent = it.label;
    if (icon) { if (icon.tagName === 'IMG') icon.replaceWith(document.createTextNode(it.ico)); else icon.textContent = it.ico; }
    else cl.insertBefore(document.createTextNode(it.ico + ' '), cl.firstChild);
    var subEl = extra.filter(function (l) { return !/^\d+$/.test(l.textContent.trim()); })[0];
    extra.forEach(function (l) { if (l !== subEl) l.remove(); });
    if (subEl) subEl.textContent = it.sub;
    else if (it.sub && label) {
      var d = document.createElement('div');
      d.className = 'mx-sub'; d.textContent = it.sub;
      label.parentElement.insertBefore(d, label.nextSibling);
    }
    cl.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); it.fn(); }, true);
    return cl;
  }
  var pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; ensure(); }); }
  function ensure() {
    if (!items.length) return;
    var fr = findItem('Друзья');
    if (!fr) return;
    var par = fr.parentElement, prev = fr;
    items.forEach(function (it) {
      var ex = par.querySelector('[data-mx="' + it.id + '"]');
      if (!ex) { ex = build(it, fr); }
      if (prev.nextSibling !== ex) par.insertBefore(ex, prev.nextSibling);
      prev = ex;
    });
  }
  new MutationObserver(function () { schedule(); }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- загрузка остальных файлов ---------- */
  function load(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = function () { cb && cb(); };
    s.onerror = function () { console.warn('MX: не загрузился ' + src); cb && cb(); };
    document.head.appendChild(s);
  }
  function need(test, src, cb) { if (test()) cb(); else load(src, cb); }
  MX.ready = function (cb) {
    need(function () { return window.THREE; }, 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function () {
      need(function () { return window.Peer; }, 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', cb);
    });
  };
  var files = ['/earn.js', '/weapons.js', '/maps.js', '/shsim.js'], files3d = ['/shgfx.js', '/shgame.js', '/shooters.js'];
  function seq(list, done) { (function next(i) { if (i < list.length) load(list[i] + '?v=' + MX.ver, function () { next(i + 1); }); else done && done(); })(0); }
  seq(files, function () {
    schedule();
    MX.ready(function () { seq(files3d, schedule); }); // Three.js и PeerJS (если сайт их ещё не подключил)
  });
})();
