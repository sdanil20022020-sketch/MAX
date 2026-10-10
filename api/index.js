const crypto=require('crypto');
const {Pool}=require('pg');

let pool=null,ready=false;
function getPool(){
  if(!pool){
    if(!process.env.DATABASE_URL)throw new Error('Нет DATABASE_URL');
    pool=new Pool({connectionString:process.env.DATABASE_URL,max:1,ssl:{rejectUnauthorized:false}});
  }
  return pool;
}
function seed(){
  const db={users:{},casinos:{},tokens:{}};
  [['Золотой Дракон',3000],['Лаки Seven',1500],['Мини-Вегас',800]].forEach(([name,binc],i)=>{
    db.casinos['b'+i]={id:'b'+i,name,owner:'бот',members:[],bot:true,team:false,binc,lv:{},v2:1,reqs:[]};
  });
  return db;
}
async function init(){
  if(ready)return;
  const p=getPool();
  await p.query('create table if not exists store(id int primary key, data jsonb not null)');
  await p.query('insert into store(id,data) values(1,$1) on conflict(id) do nothing',[JSON.stringify(seed())]);
  ready=true;
}

const UP={cam:{b:100,c:1000},vip:{b:1000,c:15000},tip:{b:5000,c:80000},ad:{b:20000,c:400000}};
const MAXL=30,MAXTAP=25,OFFCAP=259200;
const FR=[{s:'🍋',v:2},{s:'🍒',v:3},{s:'🍇',v:4},{s:'🍉',v:5},{s:'🍊',v:6},{s:'⭐',v:10}];
const CODE=/^print\(\s*["']?hello world["']?\s*\)$/i;
const PR={baby:0,scout:25000,fighter:75000,heavy:200000,sniper:400000,rapid:500000,rapier:600000,guard:800000,storm:1000000,titan:1500000,phantom:2200000,howitzer:3500000,destroyer:5000000,legend:10000000};
const WIN=50000,LOSE=10000,RENAME=50000;

const err=(code,msg)=>{const e=new Error(msg);e.code=code;return e};
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const level=c=>Object.values(c.lv||{}).reduce((a,b)=>a+b,0);
const incOf=c=>c.bot?(c.binc||0):Object.keys(UP).reduce((s,k)=>s+UP[k].b*(Math.pow(2,(c.lv||{})[k]||0)-1),0);
const pub=c=>({id:c.id,name:c.name,owner:c.owner,team:c.team,bot:!!c.bot,inc:incOf(c),level:level(c),members:c.members,lv:c.lv,reqn:(c.reqs||[]).length});
const userPub=u=>({nick:u.nick,coins:Math.floor(u.coins),tap:u.tap,tapLv:u.tapLv,av:u.avaV||0});

function handle(db,method,p,q,b,headers){
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

  if(p==='/api/avatar'&&method==='GET'){
    const x=db.users[String(q.get('n')||'').toLowerCase()];
    if(!x||!x.avatar)throw err(404,'Нет аватарки');
    return{__bin:Buffer.from(x.avatar,'base64'),type:'image/jpeg'};
  }

  if(p==='/api/login'&&method==='POST'){
    const nick=String(b.nick||'').trim(),pass=String(b.pass||'');
    if(!/^[\wа-яёА-ЯЁ .-]{2,20}$/.test(nick))throw err(400,'Ник: 2–20 символов (буквы, цифры, пробел, . -)');
    if(pass.length<4)throw err(400,'Пароль минимум 4 символа');
    const k=nick.toLowerCase();let u=db.users[k];
    if(!u){
      const salt=crypto.randomBytes(8).toString('hex');
      u=db.users[k]={nick,salt,hash:hash(pass,salt),coins:100,tap:10,tapLv:0,v2:1,last:Date.now(),lastTap:0,lastBattle:0,notes:[]};
    }else if(u.hash!==hash(pass,u.salt))throw err(403,'Неверный пароль');
    const keys=Object.keys(db.tokens);
    if(keys.length>3000)keys.slice(0,1000).forEach(x=>delete db.tokens[x]);
    const t=crypto.randomBytes(24).toString('hex');db.tokens[t]=k;return{token:t};
  }

  const u=db.users[db.tokens[headers['x-token']]];
  if(!u)throw err(401,'Войди в аккаунт');
  ensure(u);settle(u);

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
    const id='c'+Date.now().toString(36)+crypto.randomBytes(2).toString('hex');
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
    if(b.remove){delete u.avatar;u.avaV=0;return{av:0}}
    const img=String(b.img||'');
    if(!/^[A-Za-z0-9+/=]+$/.test(img)||img.length>260000)throw err(400,'Картинка слишком большая или повреждена');
    const buf=Buffer.from(img,'base64');
    if(buf.length<4||buf[0]!==0xFF||buf[1]!==0xD8)throw err(400,'Не получилось обработать картинку');
    u.avatar=img;u.avaV=Date.now();
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
    if(u.hash!==hash(String(b.pass||''),u.salt))throw err(403,'Неверный пароль');
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

  throw err(404,'Не найдено');
}

module.exports=async(req,res)=>{
  let client,code=200,out;
  try{
    await init();
    const url=new URL(req.url,'http://x');
    const p=url.pathname.replace(/\/+$/,'')||'/';
    let b=req.body;
    if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}
    b=b||{};
    client=await getPool().connect();
    await client.query('begin');
    const r=await client.query('select data from store where id=1 for update');
    const db=r.rows[0].data;
    out=handle(db,req.method,p,url.searchParams,b,req.headers);
    if(!(out&&out.__bin))await client.query('update store set data=$1 where id=1',[JSON.stringify(db)]);
    await client.query('commit');
  }catch(e){
    if(client)try{await client.query('rollback')}catch{}
    code=Number.isInteger(e.code)&&e.code>=400&&e.code<500?e.code:500;
    out={error:code===500?'Ошибка сервера':e.message};
    if(code===500)console.error(e);
  }finally{
    if(client)client.release();
  }
  if(out&&out.__bin){
    res.statusCode=200;
    res.setHeader('content-type',out.type);
    res.setHeader('cache-control','public, max-age=86400');
    res.end(out.__bin);
    return;
  }
  res.statusCode=code;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(out));
};
