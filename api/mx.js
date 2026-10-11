// api/mx.js — заработок монет + комнаты MAX SHOOTERS.
// Отдельная функция Vercel: адрес /api/mx?a=ДЕЙСТВИЕ
// Работает с той же базой (DATABASE_URL), что и основной api/index.js.
const { Pool } = require('pg');
const crypto = require('crypto');

let pool = null, ready = false;
function db() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
  return pool;
}
async function init(c) {
  if (ready) return;
  await c.query("create table if not exists mx_state(name text primary key, data jsonb not null default '{}'::jsonb)");
  await c.query('create table if not exists mx_rooms(id text primary key, data jsonb not null, ts bigint not null)');
  ready = true;
}

/* ---------- поиск пользователя в основном документе ---------- */
const BAL_KEYS = ['coins', 'balance', 'bal', 'money', 'cash', 'gold', 'monet', 'mon'];
const NAME_KEYS = ['name', 'nick', 'login', 'username', 'user', 'n', 'u'];
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');

function nameOf(u, key) {
  for (const k of NAME_KEYS) if (typeof u[k] === 'string' && u[k]) return u[k];
  return String(key);
}
function holdsToken(u, tok, hash) {
  for (const f in u) {
    const v = u[f];
    if (typeof v === 'string') { if (v === tok || v === hash) return true; }
    else if (Array.isArray(v)) { if (v.includes(tok) || v.includes(hash)) return true; }
    else if (isObj(v)) { if (Object.prototype.hasOwnProperty.call(v, tok) || Object.prototype.hasOwnProperty.call(v, hash)) return true; }
  }
  return false;
}
function entriesOf(v) { return Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v); }
function findUser(doc, tok) {
  if (!tok || !isObj(doc)) return null;
  const hash = sha(tok);
  const tops = Object.keys(doc);
  for (const k of tops) {
    const v = doc[k];
    if (!v || typeof v !== 'object') continue;
    for (const [key, u] of entriesOf(v)) {
      if (isObj(u) && holdsToken(u, tok, hash)) return { u, name: nameOf(u, key), key, top: k };
    }
  }
  // карта токен -> имя
  for (const k of tops) {
    const m = doc[k];
    if (!isObj(m)) continue;
    const has = Object.prototype.hasOwnProperty.call(m, tok) ? tok : (Object.prototype.hasOwnProperty.call(m, hash) ? hash : null);
    if (!has) continue;
    const val = m[has];
    const nm = typeof val === 'string' ? val : (isObj(val) ? (val.name || val.user || val.u || val.n || val.nick) : null);
    if (!nm) continue;
    for (const k2 of tops) {
      const c = doc[k2];
      if (!c || typeof c !== 'object' || c === m) continue;
      if (isObj(c) && isObj(c[nm])) return { u: c[nm], name: nameOf(c[nm], nm), key: nm, top: k2 };
      if (Array.isArray(c)) { const f = c.find(x => isObj(x) && nameOf(x, '') === nm); if (f) return { u: f, name: nm, key: nm, top: k2 }; }
    }
  }
  return null;
}
function balKey(u) {
  for (const k of BAL_KEYS) if (typeof u[k] === 'number' && isFinite(u[k])) return k;
  return null;
}

/* ---------- состояние заработка ---------- */
const DAY = 86400000;
const dayNum = now => Math.floor((now + 3 * 3600000) / DAY); // сутки по Москве
function fresh(now) {
  return {
    streak: 0, lastDaily: -9, wheelAt: 0, chestAt: 0,
    mine: { lv: 0, at: now }, fish: { biteAt: 0, kind: null, cdAt: 0 },
    math: { q: null, hour: -1, cnt: 0, streak: 0 }, promo: [],
    d: { day: -1, claimed: [] }, t: {}, ach: [], shDay: { day: -1, sum: 0 }, sh: null
  };
}
function normSt(st, now) {
  const f = fresh(now);
  for (const k in f) if (st[k] === undefined) st[k] = f[k];
  const dn = dayNum(now);
  if (st.d.day !== dn) st.d = { day: dn, claimed: [] };
  if (st.shDay.day !== dn) st.shDay = { day: dn, sum: 0 };
  return st;
}
const num = v => Math.max(0, Math.floor(Number(v) || 0));
function add(o, k, n) { o[k] = (o[k] || 0) + n; }

const WHEEL = [[500, 30], [1000, 25], [2500, 20], [5000, 13], [10000, 8], [25000, 3.5], [100000, 0.5]];
const FISH = [['🥾', 0, 10], ['🐟', 800, 40], ['🐠', 1500, 25], ['🐡', 3000, 15], ['🦈', 8000, 8], ['🐋', 25000, 2]];
const PROMOS = { MAX2026: 10000, KAZINO: 25000, DUST2: 15000, FIRSTBLOOD: 20000, HELLO: 5000, SHOOTERS: 30000 };
const QUESTS = [
  { id: 'q_daily', t: 'Забрать ежедневный бонус', k: 'daily', need: 1, rew: 1000 },
  { id: 'q_wheel', t: 'Крутануть колесо удачи', k: 'wheel', need: 1, rew: 1500 },
  { id: 'q_mine', t: 'Собрать руду в руднике', k: 'mine', need: 1, rew: 2000 },
  { id: 'q_math', t: 'Решить 10 примеров', k: 'math', need: 10, rew: 3000 },
  { id: 'q_fish', t: 'Поймать 5 рыб', k: 'fish', need: 5, rew: 4000 },
  { id: 'q_match', t: 'Сыграть матч в MAX SHOOTERS', k: 'matches', need: 1, rew: 3000 },
  { id: 'q_kills', t: 'Убить 10 врагов в MAX SHOOTERS', k: 'kills', need: 10, rew: 6000 },
  { id: 'q_rw', t: 'Выиграть 3 раунда в MAX SHOOTERS', k: 'rwins', need: 3, rew: 5000 }
];
const ACHS = [
  { id: 'a_k1', t: 'Первая кровь (1 убийство)', k: 'kills', need: 1, rew: 1000 },
  { id: 'a_k100', t: '100 убийств', k: 'kills', need: 100, rew: 50000 },
  { id: 'a_k1000', t: '1000 убийств', k: 'kills', need: 1000, rew: 500000 },
  { id: 'a_hs50', t: '50 выстрелов в голову', k: 'hs', need: 50, rew: 25000 },
  { id: 'a_w10', t: 'Выиграть 10 матчей', k: 'wins', need: 10, rew: 75000 },
  { id: 'a_pl10', t: 'Заложить бомбу 10 раз', k: 'plants', need: 10, rew: 30000 },
  { id: 'a_df10', t: 'Разминировать бомбу 10 раз', k: 'defuses', need: 10, rew: 30000 },
  { id: 'a_f100', t: 'Поймать 100 рыб', k: 'fish', need: 100, rew: 30000 },
  { id: 'a_s7', t: 'Ежедневный бонус 7 дней подряд', k: 'streakMax', need: 7, rew: 20000 }
];
function pick(tbl, w) {
  let s = 0; for (const r of tbl) s += w(r);
  let x = Math.random() * s;
  for (const r of tbl) { x -= w(r); if (x < 0) return r; }
  return tbl[tbl.length - 1];
}
function pubState(st, now) {
  const mineRate = 300 * Math.pow(2, st.mine.lv);
  const acc = Math.floor(Math.min(now - st.mine.at, 4 * 3600000) / 60000 * mineRate);
  return {
    now, streak: st.streak, dailyReady: st.lastDaily !== dayNum(now),
    dailyNext: dailyReward(st.lastDaily === dayNum(now) ? st.streak + 1 : (st.lastDaily === dayNum(now) - 1 ? st.streak + 1 : 1)),
    wheelIn: Math.max(0, st.wheelAt - now), chestIn: Math.max(0, st.chestAt - now),
    mine: { lv: st.mine.lv, rate: mineRate, acc, cap: mineRate * 240, up: st.mine.lv >= 12 ? 0 : 25000 * Math.pow(2, st.mine.lv) },
    fishCd: Math.max(0, st.fish.cdAt - now), fishing: st.fish.kind ? Math.max(0, st.fish.biteAt - now) : -1,
    mathLeft: st.math.hour === Math.floor(now / 3600000) ? Math.max(0, 40 - st.math.cnt) : 40,
    quests: QUESTS.map(q => ({ id: q.id, t: q.t, need: q.need, rew: q.rew, have: Math.min(q.need, st.d[q.k] || 0), done: st.d.claimed.includes(q.id) })),
    ach: ACHS.map(a => ({ id: a.id, t: a.t, need: a.need, rew: a.rew, have: Math.min(a.need, st.t[a.k] || 0), done: st.ach.includes(a.id) })),
    shLeft: Math.max(0, 400000 - st.shDay.sum)
  };
}
function dailyReward(streak) { return 5000 * Math.min(Math.max(streak, 1), 7); }

/* ---------- обработчик ---------- */
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function getBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return isObj(b) ? b : {};
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[<>\u0000-\u001f]/g, '').slice(0, n);

module.exports = async (req, res) => {
  let c = null;
  try {
    const url = new URL(req.url, 'http://x');
    const a = url.searchParams.get('a') || '';
    const body = getBody(req);
    const tok = String(req.headers['x-token'] || body.token || url.searchParams.get('t') || '');
    c = await db().connect();
    await init(c);
    await c.query('begin');
    const writes = !['state', 'rooms', 'diag', 'math_new_ro'].includes(a);
    const r = await c.query('select id, data from store order by id limit 1' + (writes ? ' for update' : ''));
    if (!r.rows.length) { await c.query('rollback'); return send(res, 200, { err: 'Нет данных сервера' }); }
    const row = r.rows[0];
    let doc = row.data;
    if (typeof doc === 'string') doc = JSON.parse(doc);

    if (a === 'diag') {
      await c.query('rollback');
      const f = findUser(doc, tok);
      return send(res, 200, {
        topKeys: Object.keys(doc).map(k => k + ':' + (Array.isArray(doc[k]) ? 'array' : typeof doc[k])),
        found: !!f, container: f && f.top, userKeys: f && Object.keys(f.u), balKey: f && balKey(f.u)
      });
    }
    const f = findUser(doc, tok);
    if (!f) { await c.query('rollback'); return send(res, 200, { err: 'Не удалось определить аккаунт. Войди в аккаунт заново.', auth: false }); }
    const bk = balKey(f.u);
    if (!bk) { await c.query('rollback'); return send(res, 200, { err: 'Не найдено поле баланса (открой /api/mx?a=diag и пришли мне результат)' }); }
    const user = f.u, uname = f.name, uid = uname.toLowerCase();
    const now = Date.now();

    // состояние
    const sr = await c.query('select data from mx_state where name=$1', [uid]);
    let st = sr.rows.length ? sr.rows[0].data : {};
    if (typeof st === 'string') st = JSON.parse(st);
    st = normSt(st, now);
    let docDirty = false, stDirty = false;
    const pay = n => { n = Math.floor(n); user[bk] = Math.max(0, Math.floor(user[bk]) + n); docDirty = true; };
    const out = extra => Object.assign({ ok: true, coins: Math.floor(user[bk]), name: uname, st: pubState(st, now) }, extra || {});
    let result;

    switch (a) {
      case 'state': result = out(); break;

      case 'daily': {
        const dn = dayNum(now);
        if (st.lastDaily === dn) { result = { err: 'Сегодня бонус уже получен' }; break; }
        st.streak = st.lastDaily === dn - 1 ? st.streak + 1 : 1;
        st.lastDaily = dn; st.t.streakMax = Math.max(st.t.streakMax || 0, st.streak);
        const rew = dailyReward(st.streak);
        pay(rew); add(st.d, 'daily', 1); stDirty = true;
        result = out({ reward: rew, msg: 'День ' + st.streak + ': +' + rew });
        break;
      }
      case 'wheel': {
        if (now < st.wheelAt) { result = { err: 'Колесо ещё остывает' }; break; }
        const p = pick(WHEEL, r => r[1]);
        st.wheelAt = now + 3 * 3600000; pay(p[0]); add(st.d, 'wheel', 1); stDirty = true;
        result = out({ reward: p[0], prize: p[0], msg: 'Колесо: +' + p[0] });
        break;
      }
      case 'chest': {
        if (now < st.chestAt) { result = { err: 'Сундук ещё закрыт' }; break; }
        const rew = 500 + Math.floor(Math.random() * 1501);
        st.chestAt = now + 10 * 60000; pay(rew); stDirty = true;
        result = out({ reward: rew, msg: 'Сундук: +' + rew });
        break;
      }
      case 'mine_collect': {
        const rate = 300 * Math.pow(2, st.mine.lv);
        const amt = Math.floor(Math.min(now - st.mine.at, 4 * 3600000) / 60000 * rate);
        if (amt < 1) { result = { err: 'Пока нечего собирать' }; break; }
        st.mine.at = now; pay(amt); add(st.d, 'mine', 1); stDirty = true;
        result = out({ reward: amt, msg: 'Руда: +' + amt });
        break;
      }
      case 'mine_up': {
        if (st.mine.lv >= 12) { result = { err: 'Максимальный уровень' }; break; }
        const cost = 25000 * Math.pow(2, st.mine.lv);
        if (user[bk] < cost) { result = { err: 'Не хватает монет' }; break; }
        const rate = 300 * Math.pow(2, st.mine.lv);
        const amt = Math.floor(Math.min(now - st.mine.at, 4 * 3600000) / 60000 * rate);
        pay(amt - cost); st.mine.lv++; st.mine.at = now; stDirty = true;
        result = out({ msg: 'Рудник улучшен до ' + st.mine.lv });
        break;
      }
      case 'fish_start': {
        if (now < st.fish.cdAt) { result = { err: 'Подожди пару секунд' }; break; }
        st.fish.biteAt = now + 4000 + Math.floor(Math.random() * 6000);
        st.fish.kind = pick(FISH, r => r[2])[0]; stDirty = true;
        result = out({ wait: st.fish.biteAt - now });
        break;
      }
      case 'fish_claim': {
        if (!st.fish.kind) { result = { err: 'Сначала закинь удочку' }; break; }
        if (now < st.fish.biteAt - 300) { result = { err: 'Ещё не клюёт' }; break; }
        const kind = st.fish.kind;
        const late = now > st.fish.biteAt + 6000;
        st.fish.kind = null; st.fish.cdAt = now + 8000; stDirty = true;
        if (late) { result = out({ lost: true, msg: 'Рыба сорвалась — клёв был слишком давно' }); break; }
        const e = FISH.find(x => x[0] === kind);
        pay(e[1]); add(st.d, 'fish', 1); add(st.t, 'fish', 1);
        result = out({ reward: e[1], fish: kind, msg: kind + ' +' + e[1] });
        break;
      }
      case 'math_new': {
        const h = Math.floor(now / 3600000);
        if (st.math.hour !== h) { st.math.hour = h; st.math.cnt = 0; }
        if (st.math.cnt >= 40) { result = { err: 'Лимит примеров в час (40). Загляни позже' }; break; }
        const x = 2 + Math.floor(Math.random() * 18), y = 2 + Math.floor(Math.random() * 12), t = Math.floor(Math.random() * 3);
        let ans, q;
        if (t === 0) { ans = x + y; q = x + ' + ' + y; }
        else if (t === 1) { ans = x * y; q = x + ' × ' + y; }
        else { ans = x + y; q = (x + y) + ' − ' + y; ans = x; }
        const ch = new Set([ans]);
        while (ch.size < 4) { const d = Math.floor(Math.random() * 11) - 5; if (d) ch.add(Math.max(0, ans + d)); }
        const arr = Array.from(ch).sort(() => Math.random() - 0.5);
        st.math.q = { ans, t: now }; stDirty = true;
        result = out({ q, choices: arr });
        break;
      }
      case 'math_ans': {
        const q = st.math.q;
        if (!q) { result = { err: 'Нет активного примера' }; break; }
        st.math.q = null; stDirty = true;
        if (now - q.t > 25000) { st.math.streak = 0; result = out({ correct: false, ans: q.ans, msg: 'Время вышло' }); break; }
        if (Number(body.v) === q.ans) {
          const rew = Math.min(300 + st.math.streak * 100, 2000);
          st.math.streak++; st.math.cnt++; pay(rew); add(st.d, 'math', 1);
          result = out({ correct: true, reward: rew, msg: 'Верно! +' + rew });
        } else { st.math.streak = 0; result = out({ correct: false, ans: q.ans, msg: 'Неверно, ответ ' + q.ans }); }
        break;
      }
      case 'promo': {
        const code = clean(body.code, 24).toUpperCase().trim();
        if (!PROMOS[code]) { result = { err: 'Такого промокода нет' }; break; }
        if (st.promo.includes(code)) { result = { err: 'Ты уже активировал этот код' }; break; }
        st.promo.push(code); pay(PROMOS[code]); stDirty = true;
        result = out({ reward: PROMOS[code], msg: 'Промокод: +' + PROMOS[code] });
        break;
      }
      case 'quest_claim': {
        const q = QUESTS.find(x => x.id === body.id);
        if (!q) { result = { err: 'Нет такого задания' }; break; }
        if (st.d.claimed.includes(q.id)) { result = { err: 'Награда уже получена' }; break; }
        if ((st.d[q.k] || 0) < q.need) { result = { err: 'Задание не выполнено' }; break; }
        st.d.claimed.push(q.id); pay(q.rew); stDirty = true;
        result = out({ reward: q.rew, msg: 'Задание: +' + q.rew });
        break;
      }
      case 'ach_claim': {
        const q = ACHS.find(x => x.id === body.id);
        if (!q) { result = { err: 'Нет такого достижения' }; break; }
        if (st.ach.includes(q.id)) { result = { err: 'Награда уже получена' }; break; }
        if ((st.t[q.k] || 0) < q.need) { result = { err: 'Достижение не выполнено' }; break; }
        st.ach.push(q.id); pay(q.rew); stDirty = true;
        result = out({ reward: q.rew, msg: 'Достижение: +' + q.rew });
        break;
      }

      /* ---- MAX SHOOTERS ---- */
      case 'sh_start': {
        st.sh = { t: now, humans: Math.min(10, Math.max(1, num(body.humans))), bots: Math.min(10, num(body.bots)) };
        stDirty = true; result = out(); break;
      }
      case 'sh_result': {
        const sh = st.sh;
        if (!sh) { result = { err: 'Матч не был начат' }; break; }
        st.sh = null; stDirty = true;
        const el = (now - sh.t) / 1000;
        const secs = Math.min(num(body.secs), el + 3);
        if (secs < 30) { result = out({ reward: 0, msg: 'Матч слишком короткий — награды нет' }); break; }
        const kills = Math.min(num(body.kills), Math.floor(secs / 1.2), 80);
        const hs = Math.min(num(body.hs), kills);
        const rw = Math.min(num(body.rw), 30), won = body.won ? 1 : 0;
        const plants = Math.min(num(body.plants), 15), defuses = Math.min(num(body.defuses), 15);
        let rew = kills * 120 + hs * 60 + rw * 800 + won * 5000 + plants * 500 + defuses * 800;
        if (sh.humans < 2) rew = Math.floor(rew * 0.5); // против одних ботов — вдвое меньше
        rew = Math.min(rew, 40000, Math.max(0, 400000 - st.shDay.sum));
        st.shDay.sum += rew; pay(rew);
        add(st.d, 'matches', 1); add(st.d, 'kills', kills); add(st.d, 'rwins', rw);
        add(st.t, 'kills', kills); add(st.t, 'hs', hs); add(st.t, 'matches', 1); add(st.t, 'wins', won);
        add(st.t, 'plants', plants); add(st.t, 'defuses', defuses);
        result = out({ reward: rew, msg: rew ? 'Награда за матч: +' + rew : 'Дневной лимит награды исчерпан' });
        break;
      }
      case 'rooms': {
        await c.query('delete from mx_rooms where ts < $1', [now - 30000]);
        const rr = await c.query('select id, data from mx_rooms order by ts desc limit 60');
        result = { ok: true, rooms: rr.rows.map(x => Object.assign({ id: x.id }, x.data)) };
        break;
      }
      case 'room_save': {
        const peer = clean(body.peer, 64);
        if (!/^[\w-]{4,64}$/.test(peer)) { result = { err: 'Плохой peer' }; break; }
        const data = {
          name: clean(body.name, 24) || ('Комната ' + uname), map: clean(body.map, 24), mode: clean(body.mode, 8),
          host: uname, peer, max: Math.min(10, Math.max(2, num(body.max))), bots: Math.min(10, num(body.bots)),
          hum: Math.min(10, Math.max(1, num(body.hum))), weapons: clean(body.weapons, 300), diff: clean(body.diff, 8),
          rounds: Math.min(16, Math.max(1, num(body.rounds))), pw: body.pw ? 1 : 0
        };
        await c.query('insert into mx_rooms(id,data,ts) values($1,$2,$3) on conflict (id) do update set data=$2, ts=$3', ['r_' + uid, JSON.stringify(data), now]);
        result = { ok: true }; break;
      }
      case 'room_del': {
        await c.query('delete from mx_rooms where id=$1', ['r_' + uid]);
        result = { ok: true }; break;
      }
      default: result = { err: 'Неизвестное действие' };
    }

    if (result && !result.err) {
      if (stDirty) await c.query('insert into mx_state(name,data) values($1,$2) on conflict (name) do update set data=$2', [uid, JSON.stringify(st)]);
      if (docDirty) await c.query('update store set data=$1 where id=$2', [JSON.stringify(doc), row.id]);
    } else if (stDirty || docDirty) {
      // ошибка после частичных изменений не должна ничего писать
    }
    await c.query('commit');
    send(res, 200, result);
  } catch (e) {
    try { if (c) await c.query('rollback'); } catch (e2) {}
    send(res, 200, { err: 'Ошибка сервера: ' + (e && e.message ? e.message : e) });
  } finally {
    if (c) c.release();
  }
};
