// MAX — Cloudflare Worker. Весь сервер сайта: /api/* (аккаунты, казино, танки, друзья)
// и /api/mx (заработок, комнаты MAX SHOOTERS). Сайт (папка public) отдаёт сама Cloudflare.
// База — тот же Neon Postgres (секрет DATABASE_URL). Библиотек не нужно: говорим с Neon по HTTPS.

const enc = new TextEncoder();
const hex = u8 => Array.from(u8).map(x => x.toString(16).padStart(2, '0')).join('');
const rnd = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

/* ---------- Neon по HTTPS ---------- */
function neonCfg(env) {
  if (!env.DATABASE_URL) throw new Error('Нет секрета DATABASE_URL');
  const u = new URL(String(env.DATABASE_URL).trim().replace(/^postgres(ql)?:/, 'https:'));
  return { host: u.host, cs: 'postgresql://' + u.username + ':' + u.password + '@' + u.host + u.pathname + '?sslmode=require' };
}
async function sql(env, list) { // list: [[текст, [параметры]], ...] — несколько запросов идут одной транзакцией
  const c = neonCfg(env), one = list.length === 1;
  const mk = q => ({ query: q[0], params: (q[1] || []).map(v => v == null ? null : String(v)) });
  const r = await fetch('https://' + c.host + '/sql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Neon-Connection-String': c.cs, 'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'true' },
    body: JSON.stringify(one ? mk(list[0]) : { queries: list.map(mk) })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('БД: ' + (j.message || r.status));
  return one ? [j] : j.results;
}
let ready = false;
function seed() {
  const db = { users: {}, casinos: {}, tokens: {} };
  [['Золотой Дракон', 3000], ['Лаки Seven', 1500], ['Мини-Вегас', 800]].forEach(([name, binc], i) => {
    db.casinos['b' + i] = { id: 'b' + i, name, owner: 'бот', members: [], bot: true, team: false, binc, lv: {}, v2: 1, reqs: [] };
  });
  return db;
}
async function init(env) {
  if (ready) return;
  await sql(env, [
    ['create table if not exists store(id int primary key, data jsonb not null)'],
    ["create table if not exists mx_state(name text primary key, data jsonb not null default '{}'::jsonb)"],
    ['create table if not exists mx_rooms(id text primary key, data jsonb not null, ts bigint not null)'],
    ['create table if not exists mx_avatars(k text primary key, img text not null)'],
    ['insert into store(id,data) values(1,$1::jsonb) on conflict(id) do nothing', [JSON.stringify(seed())]]
  ]);
  ready = true;
}
async function loadDoc(env) {
  const r = (await sql(env, [['select data::text, md5(data::text) from store where id=1']]))[0].rows[0];
  if (!r) throw new Error('Нет данных сервера');
  return { h: r[1], doc: JSON.parse(r[0]) };
}
// запись документа, только если его никто не успел изменить (иначе вернёт false — надо повторить)
async function saveDoc(env, h, doc, stName, stData) {
  const D = JSON.stringify(doc);
  let q;
  if (stName) q = ['with u as (update store set data=$1::jsonb where id=1 and md5(data::text)=$2 returning id) insert into mx_state(name,data) select $3,$4::jsonb from u on conflict(name) do update set data=excluded.data returning name', [D, h, stName, JSON.stringify(stData)]];
  else q = ['update store set data=$1::jsonb where id=1 and md5(data::text)=$2 returning id', [D, h]];
  return (await sql(env, [q]))[0].rows.length > 0;
}
const json = (o, code, extra) => new Response(JSON.stringify(o), { status: code || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, extra || {}) });
async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  try { const b = await request.json(); return isObj(b) ? b : {}; } catch (e) { return {}; }
}

/* ================= ОСНОВНОЙ API (бывший api/index.js) ================= */
const UP={cam:{b:100,c:1000},vip:{b:1000,c:15000},tip:{b:5000,c:80000},ad:{b:20000,c:400000}};
const MAXL=30,MAXTAP=25,OFFCAP=259200;
const FR=[{s:'🍋',v:2},{s:'🍒',v:3},{s:'🍇',v:4},{s:'🍉',v:5},{s:'🍊',v:6},{s:'⭐',v:10}];
const CODE=/^print\(\s*["']?hello world["']?\s*\)$/i;
const PR={baby:0,scout:25000,fighter:75000,heavy:200000,sniper:400000,rapid:500000,rapier:600000,guard:800000,storm:1000000,titan:1500000,phantom:2200000,howitzer:3500000,destroyer:5000000,legend:10000000};
const WIN=50000,LOSE=10000,RENAME=50000;

const err=(code,msg)=>{const e=new Error(msg);e.code=code;return e};
async function pbk(pass,salt){
  const key=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:10000},key,256);
  return 'p1:'+hex(new Uint8Array(bits));
}
/* новые пароли — PBKDF2 (быстро), старые аккаунты — scrypt, при первом входе переводятся на новый вид */
async function verify(u,pass){
  if(String(u.hash||'').startsWith('p1:'))return u.hash===await pbk(pass,u.salt);
  const {scryptSync}=await import('node:crypto');
  if(scryptSync(pass,u.salt,32).toString('hex')!==u.hash)return false;
  u.hash=await pbk(pass,u.salt);
  return true;
}
const level=c=>Object.values(c.lv||{}).reduce((a,b)=>a+b,0);
const incOf=c=>c.bot?(c.binc||0):Object.keys(UP).reduce((s,k)=>s+UP[k].b*(Math.pow(2,(c.lv||{})[k]||0)-1),0);
const pub=c=>({id:c.id,name:c.name,owner:c.owner,team:c.team,bot:!!c.bot,inc:incOf(c),level:level(c),members:c.members,lv:c.lv,reqn:(c.reqs||[]).length});
const userPub=u=>({nick:u.nick,coins:Math.floor(u.coins),tap:u.tap,tapLv:u.tapLv,av:u.avaV||0});

async function handle(db,method,p,q,b,headers,ctx){
  const casinoOf=u=>Object.values(db.casinos).find(c=>!c.bot&&c.members.includes(u.nick));
  const notify=(nick,t)=>{const x=db.users[nick.toLowerCase()];if(x){x.notes=x.notes||[];x.notes.push(t);if(x.notes.length>20)x.notes.shift()}};
  const ukey=x=>x.nick.toLowerCase();
  const findU=n=>db.users[String(n||'').trim().toLowerCase()];
  const brief=k=>{const x=db.users[k];return x?{nick:x.nick,av:x.avaV||0}:null};
  const ensure=x=>{
    x.friends=x.friends||[];x.fin=x.fin||[];x.fout=x.fout||[];x.breq=x.breq||[];x.tinv=x.tinv||[];
    if(!x.v2){x.auto=0;x.autoLv=0;x.v2=1}
  };
  const rm=(a,k)=>a.filter(y=>y!==k);
  const settle=x=>{
    const now=Date.now();
    if(!x.last)x.last=now;
    const s=Math.floor((now-x.last)/1000);
    if(s>0){
      const c=casinoOf(x);
      if(c&&!c.bot&&c.members.length)x.coins+=Math.min(s,OFFCAP)*(incOf(c)/c.members.length);
      x.last=s>OFFCAP?now:x.last+s*1000;
    }
  };
  const settleAll=c=>c.members.forEach(m=>{const x=db.users[m.toLowerCase()];if(x)settle(x)});
  const leaveOld=x=>{
    const c=casinoOf(x);if(!c)return;
    settleAll(c);
    if(c.owner===x.nick||c.members.length<=1){
      c.members.forEach(m=>m!==x.nick&&notify(m,`Казик «${c.name}» удалён`));
      delete db.casinos[c.id];
    }else c.members=c.members.filter(m=>m!==x.nick);
  };
  const validInv=x=>{
    x.tinv=x.tinv.filter(i=>{const c=db.casinos[i.cid];return c&&c.team&&!c.bot&&!c.members.includes(x.nick)});
    return x.tinv;
  };

  for(const c of Object.values(db.casinos)){
    if(!c.v2){
      c.v2=1;c.lv={};delete c.metric;delete c.earn;
      if(c.bot&&!c.binc)c.binc=({b0:3000,b1:1500,b2:800})[c.id]||1000;
    }
    if(!c.reqs)c.reqs=[];
  }

  if(p==='/api/login'&&method==='POST'){
    const nick=String(b.nick||'').trim(),pass=String(b.pass||'');
    if(!/^[\wа-яёА-ЯЁ .-]{2,20}$/.test(nick))throw err(400,'Ник: 2–20 символов (буквы, цифры, пробел, . -)');
    if(pass.length<4)throw err(400,'Пароль минимум 4 символа');
    const k=nick.toLowerCase();let u=db.users[k];
    if(!u){
      const salt=rnd(8),hh=await pbk(pass,salt);
      u=db.users[k]={nick,salt,hash:hh,coins:100,tap:10,tapLv:0,v2:1,last:Date.now(),lastTap:0,lastBattle:0,notes:[]};
    }else{
      if(!(await verify(u,pass)))throw err(403,'Неверный пароль');
      if(u.banned)throw err(403,'Аккаунт заблокирован');
    }
    const keys=Object.keys(db.tokens);
    if(keys.length>3000)keys.slice(0,1000).forEach(x=>delete db.tokens[x]);
    const t=rnd(24);db.tokens[t]=k;return{token:t};
  }

  if(p==='/api/admin/reset'&&method==='POST'){
    if(!ctx.env.ADMIN_KEY||headers['x-admin']!==ctx.env.ADMIN_KEY)throw err(403,'Нет доступа');
    const x=findU(b.nick);if(!x)throw err(404,'Игрок не найден');
    const pw=String(b.pass||'');if(pw.length<4)throw err(400,'Пароль минимум 4 символа');
    x.salt=rnd(8);x.hash=await pbk(pw,x.salt);return{ok:1};
  }

  const u=db.users[db.tokens[headers['x-token']]];
  if(!u)throw err(401,'Войди в аккаунт');
  if(u.banned)throw err(403,'Аккаунт заблокирован');
  ensure(u);settle(u);

  /* ---------- панель разработчика ---------- */
  if(p.startsWith('/api/dev/')){
    if(p==='/api/dev/status')return{admin:!!u.admin};
    if(p==='/api/dev/unlock'){
      const now=Date.now();
      if(u.devFailT&&now-u.devFailT>600000)u.devFails=0;
      if((u.devFails||0)>=5)return{ok:0,msg:'Слишком много попыток, подожди 10 минут'};
      if(String(b.pass||'')!==String(ctx.env.ADMIN_PASS||'9090')){u.devFails=(u.devFails||0)+1;u.devFailT=now;return{ok:0,msg:'Неверный пароль'}}
      u.devFails=0;u.admin=true;return{ok:1,admin:true};
    }
    if(!u.admin)throw err(403,'Нет доступа');
    if(p==='/api/dev/users'){
      return{users:Object.values(db.users).map(x=>({nick:x.nick,coins:Math.floor(x.coins||0),banned:!!x.banned,admin:!!x.admin})).sort((a,c)=>c.coins-a.coins).slice(0,300),total:Object.keys(db.users).length};
    }
    if(p==='/api/dev/give'||p==='/api/dev/take'){
      const x=findU(b.nick);if(!x)throw err(404,'Игрок не найден');
      const amt=Math.floor(+b.amount);
      if(!(amt>0)||amt>1e12)throw err(400,'Сумма: от 1 до 1 000 000 000 000');
      x.coins=p==='/api/dev/give'?(x.coins||0)+amt:Math.max(0,(x.coins||0)-amt);
      return{ok:1,nick:x.nick,coins:Math.floor(x.coins)};
    }
    if(p==='/api/dev/ban'){
      const x=findU(b.nick);if(!x)throw err(404,'Игрок не найден');
      if(x===u)throw err(400,'Себя банить нельзя');
      if(b.on){
        x.banned=true;
        for(const t in db.tokens)if(db.tokens[t]===ukey(x))delete db.tokens[t];
        if(db.rooms)delete db.rooms[x.nick];
      }else delete x.banned;
      return{ok:1,nick:x.nick,banned:!!x.banned};
    }
    if(p==='/api/dev/wipecoins'){
      let n=0;for(const x of Object.values(db.users)){x.coins=0;n++}
      return{ok:1,count:n};
    }
    if(p==='/api/dev/resetall'){
      if(String(b.confirm||'')!=='СБРОС')throw err(400,'Нужно подтверждение');
      let n=0;
      for(const k of Object.keys(db.users)){
        const x=db.users[k],f={nick:x.nick,salt:x.salt,hash:x.hash,coins:0,tap:10,tapLv:0,v2:1,last:Date.now(),lastTap:0,lastBattle:0,notes:[]};
        if(x.admin)f.admin=true;
        if(x.banned)f.banned=true;
        db.users[k]=f;n++;
      }
      for(const id of Object.keys(db.casinos))if(!db.casinos[id].bot)delete db.casinos[id];
      db.rooms={};
      ctx.after.push(['delete from mx_state'],['delete from mx_avatars'],['delete from mx_rooms']);
      return{ok:1,count:n};
    }
    throw err(404,'Не найдено');
  }

  if(p==='/api/me'){
    const c=casinoOf(u),notes=u.notes.splice(0),now=Date.now();
    u.breq=u.breq.filter(r=>now-r.t<86400000&&db.users[r.from]);
    const own=!!(c&&c.team&&c.owner===u.nick);
    return{user:userPub(u),casino:c?pub(c):null,notes,badges:{fr:u.fin.length,br:u.breq.length,tm:validInv(u).length+(own?c.reqs.length:0)}};
  }

  if(p==='/api/search'){
    const s=String(q.get('q')||'').trim().toLowerCase();
    const casinos=Object.values(db.casinos).filter(c=>!s||c.name.toLowerCase().includes(s)).slice(0,30).map(pub);
    const users=s?Object.values(db.users).filter(x=>x.nick.toLowerCase().includes(s)).slice(0,20).map(x=>{
      const c=casinoOf(x);return{nick:x.nick,av:x.avaV||0,casinoId:c?c.id:null,casinoName:c?c.name:null};
    }):[];
    return{casinos,users};
  }

  if(p.startsWith('/api/casino/')&&method==='GET'){
    const c=db.casinos[p.slice(12)];if(!c)throw err(404,'Казик не найден');return pub(c);
  }

  if(p==='/api/casino/create'){
    if(casinoOf(u))throw err(400,'У тебя уже есть казик. Удали его в настройках.');
    if(!CODE.test(String(b.code||'').trim()))throw err(400,'Код неверный. Нужно: Print(Hello World)');
    const name=String(b.name||'').trim();
    if(!name||name.length>24)throw err(400,'Название: 1–24 символа');
    const id='c'+Date.now().toString(36)+rnd(2);
    db.casinos[id]={id,name,owner:u.nick,members:[u.nick],team:!!b.team,lv:{},v2:1,reqs:[]};
    return{id};
  }

  if(p==='/api/casino/upgrade'){
    const c=casinoOf(u);if(!c)throw err(400,'Нет казика');
    const d=UP[b.k];if(!d)throw err(400,'Нет такого улучшения');
    settleAll(c);
    const n=c.lv[b.k]||0;
    if(n>=MAXL)throw err(400,'Максимальный уровень');
    const cost=d.c*Math.pow(2,n);
    if(u.coins<cost)throw err(400,'Не хватает монет');
    u.coins-=cost;c.lv[b.k]=n+1;return{ok:1};
  }

  if(p==='/api/casino/delete'){
    const c=casinoOf(u);if(!c)throw err(400,'Нет казика');
    if(c.owner!==u.nick)throw err(403,'Удалить казик может только создатель. Ты можешь выйти из него.');
    c.members.forEach(m=>m!==u.nick&&notify(m,`Казик «${c.name}» удалён`));
    delete db.casinos[c.id];return{ok:1};
  }

  if(p==='/api/casino/leave'){
    const c=casinoOf(u);if(!c)throw err(400,'Нет казика');
    if(c.owner===u.nick)throw err(400,'Создатель не может выйти, только удалить казик');
    settleAll(c);
    c.members=c.members.filter(m=>m!==u.nick);
    notify(c.owner,`${u.nick} вышел(а) из команды «${c.name}»`);
    return{ok:1};
  }

  /* ---------- команды ---------- */
  if(p==='/api/team/invite'){
    const c=casinoOf(u);
    if(!c||!c.team||c.owner!==u.nick)throw err(400,'Приглашать может только создатель командного казика');
    const t=findU(b.nick);if(!t)throw err(404,'Такого игрока нет');
    ensure(t);
    if(c.members.includes(t.nick))throw err(400,'Игрок уже в команде');
    if(t.tinv.some(i=>i.cid===c.id))throw err(400,'Приглашение уже отправлено');
    if(t.tinv.length>=20)throw err(400,'У игрока слишком много приглашений');
    t.tinv.push({cid:c.id,from:u.nick,t:Date.now()});
    notify(t.nick,`${u.nick} приглашает тебя в команду «${c.name}»`);
    return{ok:1};
  }

  if(p==='/api/team/inbox'){
    const inv=validInv(u).map(i=>{const c=db.casinos[i.cid];return{cid:i.cid,name:c.name,from:i.from,members:c.members.length}});
    const c=casinoOf(u),own=!!(c&&c.team&&c.owner===u.nick);
    const reqs=own?c.reqs.filter(r=>db.users[r.nick.toLowerCase()]).map(r=>{const x=db.users[r.nick.toLowerCase()];return{nick:x.nick,av:x.avaV||0}}):[];
    return{inv,owner:own,reqs};
  }

  if(p==='/api/team/accept'){
    const i=u.tinv.find(x=>x.cid===b.cid);
    if(!i)return{stale:1};
    const c=db.casinos[b.cid];
    if(!c||!c.team||c.bot){u.tinv=u.tinv.filter(x=>x!==i);return{stale:1}}
    const old=casinoOf(u);
    if(old&&old.id===c.id){u.tinv=u.tinv.filter(x=>x.cid!==c.id);return{ok:1}}
    if(old&&!b.force)return{warn:1,old:{name:old.name,owner:old.owner===u.nick}};
    if(c.members.length>=20)throw err(400,'В команде нет мест');
    leaveOld(u);
    settleAll(c);
    c.members.push(u.nick);
    u.tinv=u.tinv.filter(x=>x.cid!==c.id);
    c.reqs=c.reqs.filter(r=>r.nick!==u.nick);
    notify(c.owner,`${u.nick} вступил(а) в команду «${c.name}»`);
    return{ok:1};
  }

  if(p==='/api/team/decline'){
    u.tinv=u.tinv.filter(x=>x.cid!==b.cid);return{ok:1};
  }

  if(p==='/api/team/request'){
    const c=db.casinos[b.cid];
    if(!c||!c.team||c.bot)throw err(404,'Командный казик не найден');
    if(c.members.includes(u.nick))throw err(400,'Ты уже в этой команде');
    if(c.reqs.some(r=>r.nick===u.nick))throw err(400,'Заявка уже отправлена');
    if(c.reqs.length>=30)throw err(400,'У команды слишком много заявок');
    c.reqs.push({nick:u.nick,t:Date.now()});
    notify(c.owner,`${u.nick} хочет вступить в команду «${c.name}»`);
    return{ok:1};
  }

  if(p==='/api/team/reqaccept'||p==='/api/team/reqdecline'){
    const c=casinoOf(u);
    if(!c||!c.team||c.owner!==u.nick)throw err(400,'Нет прав');
    const k=String(b.nick||'').trim().toLowerCase();
    const r=c.reqs.find(x=>x.nick.toLowerCase()===k);
    if(!r)return{stale:1};
    c.reqs=c.reqs.filter(x=>x!==r);
    if(p==='/api/team/reqdecline'){
      notify(r.nick,`Заявка в команду «${c.name}» отклонена`);
      return{ok:1};
    }
    const x=db.users[k];if(!x)return{stale:1};
    if(c.members.length>=20)throw err(400,'В команде нет мест');
    ensure(x);
    const old=casinoOf(x);
    if(old&&old.id!==c.id)leaveOld(x);
    settleAll(c);
    if(!c.members.includes(x.nick))c.members.push(x.nick);
    x.tinv=x.tinv.filter(i=>i.cid!==c.id);
    notify(x.nick,`Тебя приняли в команду «${c.name}»`);
    return{ok:1};
  }

  /* ---------- хомяк ---------- */
  if(p==='/api/tap'){
    const now=Date.now();
    let n=Math.floor(+b.n)||0;
    n=Math.min(n,Math.max(1,Math.ceil((now-u.lastTap)/60)),100);
    if(n>0){u.coins+=n*u.tap;u.lastTap=now}
    return{coins:Math.floor(u.coins)};
  }

  if(p==='/api/hup'){
    if(b.t!=='tap')throw err(400,'Нет такого улучшения');
    if(u.tapLv>=MAXTAP)throw err(400,'Максимальный уровень');
    const c=50*Math.pow(2,u.tapLv);
    if(u.coins<c)throw err(400,'Не хватает монет');
    u.coins-=c;u.tap+=5*Math.pow(2,u.tapLv);u.tapLv++;
    return{user:userPub(u)};
  }

  /* ---------- слоты (выплата 100%) ---------- */
  if(p==='/api/slots'){
    const c=db.casinos[b.id];if(!c)throw err(404,'Казик не найден');
    const bet=Math.floor(+b.bet);
    if(!(bet>=3))throw err(400,'Минимальная ставка 3');
    if(bet>u.coins)throw err(400,'Не хватает монет');
    u.coins-=bet;
    const grid=[0,1,2].map(()=>[0,1,2,3,4].map(()=>FR[Math.floor(Math.random()*FR.length)]));
    let sum=0;const win={};
    grid.forEach((row,i)=>{
      const cnt={};row.forEach(f=>cnt[f.s]=(cnt[f.s]||0)+1);
      FR.forEach(f=>{if(cnt[f.s]>=3){sum+=bet/3*f.v*(cnt[f.s]-2);win[i]=f.s}});
    });
    const total=Math.floor(sum);
    u.coins+=total;
    return{grid:grid.map(r=>r.map(f=>f.s)),win,total,coins:Math.floor(u.coins)};
  }

  /* ---------- аватарка ---------- */
  if(p==='/api/avatar/set'){
    if(b.remove){delete u.avatar;u.avaV=0;ctx.after.push(['delete from mx_avatars where k=$1',[ukey(u)]]);return{av:0}}
    const img=String(b.img||'');
    if(!/^[A-Za-z0-9+/=]+$/.test(img)||img.length>260000)throw err(400,'Картинка слишком большая или повреждена');
    let hd='';try{hd=atob(img.slice(0,8))}catch(e){}
    if(hd.length<4||hd.charCodeAt(0)!==0xFF||hd.charCodeAt(1)!==0xD8)throw err(400,'Не получилось обработать картинку');
    delete u.avatar;u.avaV=Date.now();
    ctx.after.push(['insert into mx_avatars(k,img) values($1,$2) on conflict(k) do update set img=excluded.img',[ukey(u),img]]);
    return{av:u.avaV};
  }

  /* ---------- аккаунт ---------- */
  if(p==='/api/account/rename'){
    const nick=String(b.nick||'').trim();
    if(!/^[\wа-яёА-ЯЁ .-]{2,20}$/.test(nick))throw err(400,'Ник: 2–20 символов (буквы, цифры, пробел, . -)');
    const ok=ukey(u),nk=nick.toLowerCase();
    if(nk!==ok&&db.users[nk])throw err(400,'Этот ник занят');
    if(u.coins<RENAME)throw err(400,'Нужно 50 000 монет');
    const old=u.nick;
    u.coins-=RENAME;u.nick=nick;
    if(nk!==ok){
      delete db.users[ok];db.users[nk]=u;
      ctx.after.push(['update mx_avatars set k=$2 where k=$1',[ok,nk]],['delete from mx_state where name=$2',[ok,nk]],['update mx_state set name=$2 where name=$1',[ok,nk]]);
      for(const t in db.tokens)if(db.tokens[t]===ok)db.tokens[t]=nk;
      for(const x of Object.values(db.users)){
        for(const f of['friends','fin','fout'])if(x[f])x[f]=x[f].map(k=>k===ok?nk:k);
        if(x.breq)x.breq.forEach(r=>{if(r.from===ok)r.from=nk});
        if(x.tinv)x.tinv=x.tinv.map(i=>i.from===old?Object.assign({},i,{from:nick}):i);
      }
      for(const c of Object.values(db.casinos)){
        if(c.owner===old)c.owner=nick;
        c.members=c.members.map(m=>m===old?nick:m);
        c.reqs=(c.reqs||[]).map(r=>r.nick===old?Object.assign({},r,{nick}):r);
      }
      if(db.rooms&&db.rooms[old]){db.rooms[nick]=db.rooms[old];db.rooms[nick].host=nick;delete db.rooms[old]}
    }
    return{nick,coins:Math.floor(u.coins)};
  }

  if(p==='/api/account/delete'){
    if(!(await verify(u,String(b.pass||''))))throw err(403,'Неверный пароль');
    const k=ukey(u),nick=u.nick;
    leaveOld(u);
    for(const x of Object.values(db.users)){
      for(const f of['friends','fin','fout'])if(x[f])x[f]=x[f].filter(y=>y!==k);
      if(x.breq)x.breq=x.breq.filter(r=>r.from!==k);
      if(x.tinv)x.tinv=x.tinv.filter(i=>i.from!==nick);
    }
    for(const c of Object.values(db.casinos))c.reqs=(c.reqs||[]).filter(r=>r.nick!==nick);
    for(const t in db.tokens)if(db.tokens[t]===k)delete db.tokens[t];
    if(db.rooms)delete db.rooms[nick];
    delete db.users[k];
    ctx.after.push(['delete from mx_avatars where k=$1',[k]],['delete from mx_state where name=$1',[k]]);
    return{ok:1};
  }

  /* ---------- друзья ---------- */
  if(p==='/api/friends'){
    return{friends:u.friends.map(brief).filter(Boolean),incoming:u.fin.map(brief).filter(Boolean),outgoing:u.fout.map(brief).filter(Boolean)};
  }

  if(p==='/api/friend/profile'){
    const t=findU(b.nick);if(!t)throw err(404,'Игрок не найден');
    const k=ukey(t),c=casinoOf(t);
    return{nick:t.nick,av:t.avaV||0,tanks:t.tanks||['baby'],sel:t.tank||'baby',
      casino:c?{id:c.id,name:c.name,inc:incOf(c),level:level(c),team:c.team}:null,
      me:k===ukey(u),friend:u.friends.includes(k),incoming:u.fin.includes(k),outgoing:u.fout.includes(k)};
  }

  if(p==='/api/friend/add'){
    const t=findU(b.nick);if(!t)throw err(404,'Такого игрока нет');
    ensure(t);const k=ukey(t),mk=ukey(u);
    if(k===mk)throw err(400,'Это ты');
    if(u.friends.includes(k))throw err(400,'Вы уже друзья');
    if(u.fin.includes(k)){
      u.fin=rm(u.fin,k);t.fout=rm(t.fout,mk);u.friends.push(k);t.friends.push(mk);
      notify(t.nick,`${u.nick} принял(а) твою заявку в друзья`);
      return{status:'friends'};
    }
    if(u.fout.includes(k))throw err(400,'Заявка уже отправлена');
    if(u.fout.length>=50)throw err(400,'Слишком много заявок');
    u.fout.push(k);t.fin.push(mk);
    notify(t.nick,`${u.nick} хочет добавить тебя в друзья`);
    return{status:'sent'};
  }

  if(p==='/api/friend/accept'){
    const t=findU(b.nick);if(!t)throw err(404,'Игрок не найден');
    ensure(t);const k=ukey(t),mk=ukey(u);
    if(!u.fin.includes(k))throw err(400,'Заявки нет');
    u.fin=rm(u.fin,k);t.fout=rm(t.fout,mk);
    if(!u.friends.includes(k))u.friends.push(k);
    if(!t.friends.includes(mk))t.friends.push(mk);
    notify(t.nick,`${u.nick} принял(а) твою заявку в друзья`);
    return{ok:1};
  }

  if(p==='/api/friend/decline'){
    const t=findU(b.nick);if(!t)return{ok:1};
    ensure(t);u.fin=rm(u.fin,ukey(t));t.fout=rm(t.fout,ukey(u));return{ok:1};
  }

  if(p==='/api/friend/cancel'){
    const t=findU(b.nick);if(!t)return{ok:1};
    ensure(t);u.fout=rm(u.fout,ukey(t));t.fin=rm(t.fin,ukey(u));return{ok:1};
  }

  if(p==='/api/friend/remove'){
    const t=findU(b.nick);if(!t)return{ok:1};
    ensure(t);u.friends=rm(u.friends,ukey(t));t.friends=rm(t.friends,ukey(u));return{ok:1};
  }

  /* ---------- бои казиков (выигрывает тот, кто приносит больше) ---------- */
  if(p==='/api/battle/search'){
    const s=String(q.get('q')||'').trim().toLowerCase();
    if(!s)return{users:[]};
    const users=[];
    for(const x of Object.values(db.users)){
      if(x===u||!x.nick.toLowerCase().includes(s))continue;
      const c=casinoOf(x);if(!c)continue;
      users.push({nick:x.nick,av:x.avaV||0,casinoName:c.name,inc:incOf(c)});
      if(users.length>=20)break;
    }
    return{users};
  }

  if(p==='/api/battle/inbox'){
    const now=Date.now();
    u.breq=u.breq.filter(r=>now-r.t<86400000&&db.users[r.from]);
    return{inbox:u.breq.map(r=>{const x=db.users[r.from],c=casinoOf(x);return{nick:x.nick,av:x.avaV||0,casinoName:c?c.name:'—',inc:c?incOf(c):0}})};
  }

  if(p==='/api/battle/request'){
    const a=casinoOf(u);if(!a)throw err(400,'Сначала создай свой казик');
    const t=findU(b.nick);if(!t)throw err(404,'Игрок не найден');
    if(t===u)throw err(400,'Нельзя вызвать самого себя');
    if(!casinoOf(t))throw err(400,'У игрока нет казика');
    ensure(t);const k=ukey(u);
    if(t.breq.some(r=>r.from===k))throw err(400,'Заявка уже отправлена');
    if(t.breq.length>=30)throw err(400,'У игрока слишком много заявок');
    t.breq.push({from:k,t:Date.now()});
    notify(t.nick,`${u.nick} кинул(а) тебе заявку на бой`);
    return{ok:1};
  }

  if(p==='/api/battle/decline'){
    const k=String(b.nick||'').trim().toLowerCase();
    u.breq=u.breq.filter(r=>r.from!==k);return{ok:1};
  }

  if(p==='/api/battle/accept'){
    const k=String(b.nick||'').trim().toLowerCase();
    const r=u.breq.find(x=>x.from===k);
    if(!r)throw err(404,'Заявки уже нет');
    const bc=casinoOf(u);if(!bc)throw err(400,'Сначала создай свой казик');
    const now=Date.now();
    if(now-(u.lastBattle||0)<600000)throw err(429,`Подожди ${Math.ceil((600000-(now-u.lastBattle))/1000)} сек.`);
    const t=db.users[k],ac=t&&casinoOf(t);
    u.breq=u.breq.filter(x=>x!==r);
    if(!t||!ac)return{stale:1};
    u.lastBattle=now;
    const my=incOf(bc),foe=incOf(ac);
    let result='draw',delta=0;
    if(my>foe){
      result='win';u.coins+=WIN;delta=WIN;
      const l=Math.min(LOSE,Math.floor(t.coins));t.coins-=l;
      notify(t.nick,`Бой с ${u.nick}: ты проиграл(а), −${l} 🪙`);
    }else if(my<foe){
      result='lose';const l=Math.min(LOSE,Math.floor(u.coins));u.coins-=l;delta=-l;t.coins+=WIN;
      notify(t.nick,`Бой с ${u.nick}: ты победил(а), +${WIN} 🪙`);
    }else notify(t.nick,`Бой с ${u.nick}: ничья`);
    return{result,delta,coins:Math.floor(u.coins),you:{name:bc.name,inc:my},foe:{name:ac.name,inc:foe}};
  }

  /* ---------- танки ---------- */
  if(p.startsWith('/api/tank/')){
    db.rooms=db.rooms||{};
    u.tanks=u.tanks||['baby'];u.tank=u.tank||'baby';
    const now=Date.now();
    for(const k in db.rooms)if(now-db.rooms[k].t>45000)delete db.rooms[k];
    if(p==='/api/tank/garage')return{coins:Math.floor(u.coins),tanks:u.tanks,sel:u.tank};
    if(p==='/api/tank/buy'){
      const id=String(b.id);
      if(!(id in PR))throw err(400,'Нет такого танка');
      if(u.tanks.includes(id))throw err(400,'Уже куплен');
      if(u.coins<PR[id])throw err(400,'Не хватает монет');
      u.coins-=PR[id];u.tanks.push(id);
      return{coins:Math.floor(u.coins),tanks:u.tanks,sel:u.tank};
    }
    if(p==='/api/tank/select'){
      const id=String(b.id);
      if(!u.tanks.includes(id))throw err(400,'Танк не куплен');
      u.tank=id;return{ok:1};
    }
    if(p==='/api/tank/rooms')return{rooms:Object.values(db.rooms).filter(r=>r.host!==u.nick).map(r=>({host:r.host,peer:r.peer,players:r.players,map:r.map,max:r.max}))};
    if(p==='/api/tank/room'){
      const peer=String(b.peer||'');
      if(!/^[\w-]{5,80}$/.test(peer))throw err(400,'Плохой id');
      const map=['forest','desert','city','snow'].includes(b.map)?b.map:'forest';
      const mx=Math.min(10,Math.max(1,Math.floor(+b.max)||4));
      db.rooms[u.nick]={host:u.nick,peer,players:Math.min(mx,Math.max(1,Math.floor(+b.players)||1)),map,max:mx,t:now};
      return{ok:1};
    }
    if(p==='/api/tank/leave'){delete db.rooms[u.nick];return{ok:1}}
    if(p==='/api/tank/check'){
      const x=db.users[String(b.nick||'').toLowerCase()];
      return{ok:!!(x&&(x.tanks||['baby']).includes(String(b.tank)))};
    }
    if(p==='/api/tank/result'){
      if(now-(u.lastTankRes||0)<60000)return{delta:0,coins:Math.floor(u.coins),cool:1};
      u.lastTankRes=now;
      const win=!!b.win,online=b.mode==='online';
      const kills=Math.max(0,Math.min(15,Math.floor(+b.kills)||0));
      let delta=0;
      if(online){
        if(win)delta=WIN;
        else if((+b.played||0)>=20)delta=-Math.min(LOSE,Math.floor(u.coins));
      }else delta=kills*3+(win?500:0);
      u.coins+=delta;
      return{delta,coins:Math.floor(u.coins)};
    }
  }

  throw err(404,'Не найдено');}

async function idx(request, env, url) {
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const q = url.searchParams;
  if (p === '/api/avatar' && request.method === 'GET') {
    const k = String(q.get('n') || '').toLowerCase();
    let img = null;
    const r = (await sql(env, [['select img from mx_avatars where k=$1', [k]]]))[0].rows[0];
    if (r) img = r[0];
    else { const { doc } = await loadDoc(env); const x = doc.users[k]; if (x && x.avatar) img = x.avatar; } // старые аватарки лежат в документе
    if (!img) return json({ error: 'Нет аватарки' }, 404);
    const bin = Uint8Array.from(atob(img), c => c.charCodeAt(0));
    return new Response(bin, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' } });
  }
  const b = await readBody(request);
  const headers = { 'x-token': request.headers.get('x-token') || '', 'x-admin': request.headers.get('x-admin') || '' };
  for (let attempt = 0; attempt < 5; attempt++) {
    const { h, doc } = await loadDoc(env);
    const ctx = { env, after: [] };
    let out;
    try { out = await handle(doc, request.method, p, q, b, headers, ctx); }
    catch (e) {
      const code = Number.isInteger(e.code) && e.code >= 400 && e.code < 500 ? e.code : 500;
      if (code === 500) console.error(e);
      return json({ error: code === 500 ? 'Ошибка сервера: ' + (e && e.message) : e.message }, code);
    }
    if (!(await saveDoc(env, h, doc))) continue; // кто-то успел раньше — повторяем с свежими данными
    if (ctx.after.length) { try { await sql(env, ctx.after); } catch (e) { console.error(e); } }
    return json(out);
  }
  return json({ error: 'Сервер занят, попробуй ещё раз' }, 503);
}

/* ================= ЗАРАБОТОК И КОМНАТЫ (бывший api/mx.js) ================= */
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

const clean = (s, n) => String(s == null ? '' : s).replace(/[<>\u0000-\u001f]/g, '').slice(0, n);
const LIGHT = ['state', 'rooms', 'room_save', 'room_del']; // этим действиям не нужен весь документ — читаем только ник и баланс

async function lightUser(env, tok) {
  if (!tok) return null;
  const r = (await sql(env, [["select data->'users'->(data->'tokens'->>$1::text)->>'nick', data->'users'->(data->'tokens'->>$1::text)->>'coins', data->'users'->(data->'tokens'->>$1::text)->>'banned' from store where id=1", [tok]]]))[0].rows[0];
  if (!r || !r[0]) return null;
  return { nick: r[0], coins: Number(r[1]) || 0, banned: r[2] === 'true' };
}

async function mxAct(env, a, body, user, st, now, fl) {
  const bk = 'coins', uname = user.nick, uid = uname.toLowerCase();
  const pay = n => { n = Math.floor(n); user[bk] = Math.max(0, Math.floor(user[bk]) + n); fl.doc = true; };
  const out = extra => Object.assign({ ok: true, coins: Math.floor(user[bk]), name: uname, st: pubState(st, now) }, extra || {});
  let result, stDirty = false;
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
        const rr = await sql(env, [['delete from mx_rooms where ts < $1::bigint', [now - 30000]], ['select id, data::text from mx_rooms order by ts desc limit 60']]);
        result = { ok: true, rooms: rr[1].rows.map(x => Object.assign({ id: x[0] }, JSON.parse(x[1]))) };
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
        await sql(env, [['insert into mx_rooms(id,data,ts) values($1,$2::jsonb,$3::bigint) on conflict (id) do update set data=excluded.data, ts=excluded.ts', ['r_' + uid, JSON.stringify(data), now]]]);
        result = { ok: true }; break;
      }
      case 'room_del': {
        await sql(env, [['delete from mx_rooms where id=$1', ['r_' + uid]]]);
        result = { ok: true }; break;
      }
      default: result = { err: 'Неизвестное действие' };  }
  fl.st = stDirty;
  return result;
}

async function mx(request, env, url) {
  const a = url.searchParams.get('a') || '';
  const body = await readBody(request);
  const tok = String(request.headers.get('x-token') || body.token || url.searchParams.get('t') || '');
  const noAuth = { err: 'Не удалось определить аккаунт. Войди в аккаунт заново.', auth: false };
  const light = LIGHT.includes(a);
  for (let attempt = 0; attempt < 5; attempt++) {
    let loaded = null, user;
    if (light) user = await lightUser(env, tok);
    else { loaded = await loadDoc(env); user = loaded.doc.users[loaded.doc.tokens[tok]]; }
    if (!user || typeof user.coins !== 'number') return json(noAuth);
    if (user.banned) return json({ err: 'Аккаунт заблокирован', auth: false });
    const now = Date.now(), uid = String(user.nick).toLowerCase();
    const sr = (await sql(env, [['select data::text from mx_state where name=$1', [uid]]]))[0].rows[0];
    const st = normSt(sr ? JSON.parse(sr[0]) : {}, now);
    const fl = { doc: false, st: false };
    const result = await mxAct(env, a, body, user, st, now, fl);
    if (!result || result.err || (!fl.doc && !fl.st)) return json(result);
    if (fl.doc) { if (!(await saveDoc(env, loaded.h, loaded.doc, fl.st ? uid : null, st))) continue; }
    else await sql(env, [['insert into mx_state(name,data) values($1,$2::jsonb) on conflict (name) do update set data=excluded.data', [uid, JSON.stringify(st)]]]);
    return json(result);
  }
  return json({ err: 'Сервер занят, попробуй ещё раз' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/mx') { await init(env); return await mx(request, env, url); }
      if (url.pathname.startsWith('/api/')) { await init(env); return await idx(request, env, url); }
    } catch (e) {
      console.error(e);
      return json({ error: 'Ошибка сервера: ' + (e && e.message ? e.message : e) }, 500);
    }
    return env.ASSETS.fetch(request);
  }
};
