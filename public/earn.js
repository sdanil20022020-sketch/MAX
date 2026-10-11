/* earn.js — раздел «Заработок»: бонусы, колесо, сундук, рудник, рыбалка, примеры, промокоды, задания, достижения */
(function () {
  var MX = window.MX; if (!MX) return;
  var ov = null, S = null, got = 0, timer = null, fishT = null, mathQ = null;

  function el(h) { var d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; }
  function mmss(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }
  function left(ms) { return Math.max(0, ms - (Date.now() - got)); }

  function act(a, body, cb) {
    MX.api(a, body || {}).then(function (j) {
      if (j.err) { MX.toast(j.err); if (j.st) { S = j.st; got = Date.now(); } render(); return; }
      if (j.st) { S = j.st; got = Date.now(); }
      if (j.msg) MX.toast(j.msg);
      if (ov && typeof j.coins === 'number') ov.setBal(j.coins);
      if (cb) cb(j);
      render();
    });
  }

  function open() {
    ov = MX.overlay('💰 Заработок', function () { clearInterval(timer); ov = null; });
    ov.body.innerHTML = '<div class="mx-card">Загрузка…</div>';
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    MX.api('state').then(function (j) {
      if (j.err) { ov.body.innerHTML = '<div class="mx-card"><h3>Не получилось</h3><p>' + j.err + '</p><p>Если пишет про аккаунт — закрой, подожди пару секунд после входа и открой снова.</p></div>'; return; }
      S = j.st; got = Date.now(); ov.setBal(j.coins); render();
    });
  }

  function render() {
    if (!ov || !S) return;
    var q = ov.body;
    var scroll = ov.scrollTop;
    var h = '<div class="mx-grid">';

    // ежедневный бонус
    var dots = '';
    for (var i = 1; i <= 7; i++) dots += '<span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:8px;margin:2px;background:' + (i <= S.streak % 7 || (S.streak >= 7 && !S.dailyReady) ? '#16a34a' : '#1f2937') + ';font-size:12px">' + i + '</span>';
    h += '<div class="mx-card"><h3>🎁 Ежедневный бонус</h3><p>Заходи каждый день: серия растёт до 7 дней (до +35 000).</p><div>' + dots + '</div>' +
      '<p>Серия: ' + S.streak + ' · следующий бонус: ' + MX.fmt(S.dailyNext) + '</p>' +
      '<button class="mx-b g" data-a="daily" ' + (S.dailyReady ? '' : 'disabled') + '>' + (S.dailyReady ? 'Забрать' : 'Уже получен сегодня') + '</button></div>';

    // колесо
    var w = left(S.wheelIn);
    h += '<div class="mx-card"><h3>🎡 Колесо удачи</h3><p>Бесплатно раз в 3 часа. Призы от 500 до 100 000.</p><div class="mx-big" id="wh">🎡</div>' +
      '<button class="mx-b y" id="wheelBtn" data-t="wheel" ' + (w ? 'disabled' : '') + '>' + (w ? 'Через ' + mmss(w) : 'Крутить!') + '</button></div>';

    // сундук
    var c = left(S.chestIn);
    h += '<div class="mx-card"><h3>📦 Сундук</h3><p>Открывается каждые 10 минут: 500–2000 монет.</p><div class="mx-big">' + (c ? '🔒' : '📦') + '</div>' +
      '<button class="mx-b g" data-a="chest" data-t="chest" ' + (c ? 'disabled' : '') + '>' + (c ? 'Через ' + mmss(c) : 'Открыть') + '</button></div>';

    // рудник
    var m = S.mine, acc = Math.min(m.cap, m.acc + (Date.now() - got) / 60000 * m.rate);
    h += '<div class="mx-card"><h3>⛏️ Рудник (ур. ' + m.lv + ')</h3><p>Копает сам, даже когда тебя нет (до 4 часов): ' + MX.fmt(m.rate) + ' в минуту.</p>' +
      '<div class="mx-bar"><i style="width:' + Math.min(100, acc / m.cap * 100) + '%"></i></div><p id="mineAcc">Накоплено: ' + MX.fmt(acc) + ' / ' + MX.fmt(m.cap) + '</p>' +
      '<div class="mx-row"><button class="mx-b g" data-a="mine_collect">Забрать</button>' +
      (m.up ? '<button class="mx-b" data-a="mine_up">Улучшить за ' + MX.fmt(m.up) + '</button>' : '<span>Макс. уровень</span>') + '</div></div>';

    // рыбалка
    var fs = S.fishing, fc = left(S.fishCd);
    var bite = fs >= 0 && left(fs) === 0;
    h += '<div class="mx-card"><h3>🎣 Рыбалка</h3><p>Закинь удочку, дождись поклёвки и сразу дёрни! Редкая рыба стоит до 25 000.</p>' +
      '<div class="mx-big" id="fish">' + (fs < 0 ? '🌊' : (bite ? '❗🐟' : '…')) + '</div>';
    if (fs < 0) h += '<button class="mx-b" data-a="fish_start" data-t="fishcd" ' + (fc ? 'disabled' : '') + '>' + (fc ? 'Подожди ' + Math.ceil(fc / 1000) + ' с' : 'Закинуть') + '</button>';
    else h += '<button class="mx-b ' + (bite ? 'r' : '') + '" data-a="fish_claim">' + (bite ? 'Тяни!' : 'Дёрнуть') + '</button>';
    h += '</div>';

    // примеры
    h += '<div class="mx-card"><h3>🧮 Быстрый счёт</h3><p>Реши пример за 25 секунд: 300 монет, за серию больше (до 2000). Осталось в этом часу: ' + S.mathLeft + '.</p><div id="mathBox">';
    if (mathQ) {
      h += '<div class="mx-big">' + mathQ.q + ' = ?</div><div class="mx-row">' + mathQ.choices.map(function (x) { return '<button class="mx-b" data-m="' + x + '">' + x + '</button>'; }).join('') + '</div>';
    } else h += '<button class="mx-b" data-a="math_new">Получить пример</button>';
    h += '</div></div>';

    // промокод
    h += '<div class="mx-card"><h3>🎟️ Промокод</h3><p>Ввёл код — получил монеты (один раз на аккаунт). Подсказка: попробуй MAX2026.</p><div class="mx-row"><input class="mx-in" id="promo" placeholder="КОД" style="flex:1"><button class="mx-b" id="promoBtn">ОК</button></div></div>';

    // шутер
    h += '<div class="mx-card"><h3>🔫 MAX SHOOTERS</h3><p>За матчи: убийство +120, headshot +60, выигранный раунд +800, победа в матче +5000, бомба +500/+800. Сегодня можно получить ещё: ' + MX.fmt(S.shLeft) + '. С живыми игроками награда вдвое больше, чем только с ботами.</p><button class="mx-b g" id="goSh">Играть</button></div>';
    h += '</div>';

    // задания
    h += '<div class="mx-card" style="margin-top:14px"><h3>📋 Задания на сегодня</h3>';
    S.quests.forEach(function (x) {
      var can = !x.done && x.have >= x.need;
      h += '<div class="mx-q"><span>' + x.t + '<span class="mx-sub">' + x.have + ' / ' + x.need + ' · награда ' + MX.fmt(x.rew) + '</span></span>' +
        '<button class="mx-b ' + (can ? 'g' : '') + '" data-q="' + x.id + '" ' + (can ? '' : 'disabled') + '>' + (x.done ? '✔' : 'Забрать') + '</button></div>';
    });
    h += '</div><div class="mx-card" style="margin-top:14px"><h3>🏆 Достижения</h3>';
    S.ach.forEach(function (x) {
      var can = !x.done && x.have >= x.need;
      h += '<div class="mx-q"><span>' + x.t + '<span class="mx-sub">' + x.have + ' / ' + x.need + ' · награда ' + MX.fmt(x.rew) + '</span></span>' +
        '<button class="mx-b ' + (can ? 'g' : '') + '" data-ac="' + x.id + '" ' + (can ? '' : 'disabled') + '>' + (x.done ? '✔' : 'Забрать') + '</button></div>';
    });
    h += '</div>';
    q.innerHTML = h;
    ov.scrollTop = scroll;

    q.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-a');
        if (a === 'math_new') act(a, {}, function (j) { mathQ = { q: j.q, choices: j.choices }; });
        else act(a, {});
      };
    });
    q.querySelectorAll('[data-m]').forEach(function (b) {
      b.onclick = function () { var v = Number(b.getAttribute('data-m')); mathQ = null; act('math_ans', { v: v }); };
    });
    q.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { act('quest_claim', { id: b.getAttribute('data-q') }); }; });
    q.querySelectorAll('[data-ac]').forEach(function (b) { b.onclick = function () { act('ach_claim', { id: b.getAttribute('data-ac') }); }; });
    var wb = q.querySelector('#wheelBtn');
    if (wb) wb.onclick = function () {
      wb.disabled = true;
      var box = q.querySelector('#wh'), n = 0, ic = ['💰', '💎', '🪙', '⭐', '🍀', '🔥'];
      var spin = setInterval(function () { box.textContent = ic[n++ % ic.length]; }, 90);
      MX.api('wheel', {}).then(function (j) {
        setTimeout(function () {
          clearInterval(spin);
          if (j.err) { MX.toast(j.err); render(); return; }
          S = j.st; got = Date.now();
          if (ov) ov.setBal(j.coins);
          render();
          var b2 = ov && ov.querySelector('#wh'); if (b2) b2.textContent = '+' + MX.fmt(j.prize);
          MX.toast(j.msg);
        }, 1400);
      });
    };
    var pb = q.querySelector('#promoBtn');
    if (pb) pb.onclick = function () { act('promo', { code: q.querySelector('#promo').value }); };
    var gs = q.querySelector('#goSh');
    if (gs) gs.onclick = function () { ov.querySelector('.mx-x').click(); if (window.MXS && MXS.open) MXS.open(); else MX.toast('Шутер ещё загружается…'); };
  }

  // раз в секунду меняем только подписи таймеров (без перерисовки, чтобы клики не терялись)
  function tick() {
    if (!ov || !S) return;
    var rerender = false;
    ov.querySelectorAll('[data-t]').forEach(function (b) {
      var k = b.getAttribute('data-t'), v = k === 'wheel' ? S.wheelIn : (k === 'chest' ? S.chestIn : S.fishCd), l = left(v);
      if (!l) { rerender = true; return; }
      b.textContent = k === 'fishcd' ? 'Подожди ' + Math.ceil(l / 1000) + ' с' : 'Через ' + mmss(l);
    });
    if (S.fishing >= 0 && left(S.fishing) === 0 && ov.querySelector('#fish') && ov.querySelector('#fish').textContent.indexOf('❗') < 0) rerender = true;
    var a = ov.querySelector('#mineAcc');
    if (a) { var m = S.mine; a.textContent = 'Накоплено: ' + MX.fmt(Math.min(m.cap, m.acc + (Date.now() - got) / 60000 * m.rate)) + ' / ' + MX.fmt(m.cap); }
    var pf = document.activeElement && document.activeElement.id === 'promo';
    if (rerender && !pf) render();
  }

  MX.earnOpen = open;
  MX.addMenu('earn', '💰', 'Заработок', 'бонусы, рыбалка, рудник…', open);
})();
