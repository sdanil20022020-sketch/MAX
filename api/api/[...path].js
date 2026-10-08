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
  [['Золотой Дракон',9200],['Лаки Seven',7400],['Мини-Вегас',5100]].forEach(([name,metric],i)=>{
    db.casinos['b'+i]={id:'b'+i,name,owner:'бот',members:[],bot:true,team:false,metric,lv:{}};
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

const UPS={a:{cost:30,red:100},b:{cost:60,red:150},c:{cost:120,red:300},d:{cost:250,red:600},e:{cost:500,red:1500}};
const FR=[{s:'🍋',v:2},{s:'🍒',v:3},{s:'🍇',v:4},{s:'🍉',v:5},{s:'🍊',v:6},{s:'⭐',v:10}];
const CODE=/^print\(\s*["']?hello world["']?\s*\)$/i;

const err=(code,msg)=>{const e=new Error(msg);e.code=code;return e};
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const level=c=>Object.values(c.lv||{}).reduce((a,b)=>a+b,0);
const factor=c=>Math.max(.05,Math.min(.8,.4+c.metric/25000));
const pub=c=>({id:c.id,name:c.name,owner:c.owner,team:c.team,bot:!!c.bot,metric:c.metric,level:level(c),members:c.members,lv:c.lv,rtp:Math.round(1.17*factor(c)*100)});
const userPub=u=>({nick:u.nick,coins:u.coins,tap:u.tap,tapLv:u.tapLv,auto:u.auto,autoLv:u.autoLv});

function handle(db,method,p,q,b,headers){
  const casinoOf=u=>Object.values(db.casinos).find(c=>!c.bot&&c.members.includes(u.nick));
  const notify=(nick,t)=>{const x=db.users[nick.toLowerCase()];if(x){x.notes.push(t);if(x.notes.length>20)x.notes.shift()}};
  const settle=u=>{
    const now=Date.now(),s=Math.floor((now-u.last)/1000);
    if(s>0){if(u.auto)u.coins+=Math.min(s,86400)*u.auto;u.last+=s*1000;if(s>86400)u.last=now}
  };

  if(p==='/api/login'&&method==='POST'){
    const nick=String(b.nick||'').trim(),pass=String(b.pass||'');
    if(!/^[\wа-яёА-ЯЁ .-]{2,20}$/.test(nick))throw err(400,'Ник: 2–20 символов (буквы, цифры, пробел, . -)');
    if(pass.length<4)throw err(400,'Пароль минимум 4 символа');
    const k=nick.toLowerCase();let u=db.users[k];
    if(!u){
      const salt=crypto.randomBytes(8).toString('hex');
      u=db.users[k]={nick,salt,hash:hash(pass,salt),coins:100,tap:10,tapLv:0,auto:0,autoLv:0,last:Date.now(),lastTap:0,lastBattle:0,notes:[]};
    }else if(u.hash!==hash(pass,u.salt))throw err(403,'Неверный пароль');
    const keys=Object.keys(db.tokens);
    if(keys.length>3000)keys.slice(0,1000).forEach(x=>delete db.tokens[x]);
    const t=crypto.randomBytes(24).toString('hex');db.tokens[t]=k;return{token:t};
  }

  const u=db.users[db.tokens[headers['x-token']]];
  if(!u)throw err(401,'Войди в аккаунт');
  settle(u);

  if(p==='/api/me'){
    const c=casinoOf(u),notes=u.notes.splice(0);
    return{user:userPub(u),casino:c?pub(c):null,notes};
  }

  if(p==='/api/search'){
    const s=String(q.get('q')||'').trim().toLowerCase();
    const casinos=Object.values(db.casinos).filter(c=>!s||c.name.toLowerCase().includes(s)).slice(0,30).map(pub);
    const users=s?Object.values(db.users).filter(x=>x.nick.toLowerCase().includes(s)).slice(0,20).map(x=>{
      const c=casinoOf(x);return{nick:x.nick,casinoId:c?c.id:null,casinoName:c?c.name:null};
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
    db.casinos[id]={id,name,owner:u.nick,members:[u.nick],team:!!b.team,metric:10000,lv:{}};
    return{id};
  }

  if(p==='/api/casino/upgrade'){
    const c=casinoOf(u);if(!c)throw err(400,'Нет казика');
    const d=UPS[b.k];if(!d)throw err(400,'Нет такого улучшения');
    const n=c.lv[b.k]||0,cost=d.cost*2**n;
    if(u.coins<cost)throw err(400,'Не хватает монет');
    u.coins-=cost;c.metric-=d.red*2**n;c.lv[b.k]=n+1;return{ok:1};
  }

  if(p==='/api/casino/delete'){
    const c=casinoOf(u);if(!c)throw err(400,'Нет казика');
    c.members.forEach(m=>m!==u.nick&&notify(m,`Казик «${c.name}» удалён`));
    delete db.casinos[c.id];return{ok:1};
  }

  if(p==='/api/casino/invite'){
    const c=casinoOf(u);if(!c||!c.team)throw err(400,'Это не командный казик');
    const t=db.users[String(b.nick||'').trim().toLowerCase()];
    if(!t)throw err(404,'Такого игрока нет');
    if(casinoOf(t))throw err(400,'У игрока уже есть казик');
    c.members.push(t.nick);notify(t.nick,`${u.nick} позвал(а) тебя в команду «${c.name}»`);return{ok:1};
  }

  if(p==='/api/tap'){
    const now=Date.now();
    let n=Math.floor(+b.n)||0;
    n=Math.min(n,Math.max(1,Math.ceil((now-u.lastTap)/60)),100);
    if(n>0){u.coins+=n*u.tap;u.lastTap=now}
    return{coins:u.coins};
  }

  if(p==='/api/hup'){
    if(b.t==='tap'){const c=50*2**u.tapLv;if(u.coins<c)throw err(400,'Не хватает монет');u.coins-=c;u.tapLv++;u.tap+=5}
    else if(b.t==='auto'){const c=100*2**u.autoLv;if(u.coins<c)throw err(400,'Не хватает монет');u.coins-=c;u.autoLv++;u.auto+=5}
    else throw err(400,'?');
    return{user:userPub(u)};
  }

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
    const total=Math.floor(sum*factor(c));
    u.coins+=total;
    const net=bet-total;
    if(net>0&&!c.bot&&c.members.length){
      const each=Math.floor(net/c.members.length);
      c.members.forEach((m,i)=>{const x=db.users[m.toLowerCase()];if(x)x.coins+=each+(i===0?net-each*c.members.length:0)});
    }
    return{grid:grid.map(r=>r.map(f=>f.s)),win,total,coins:u.coins};
  }

  if(p==='/api/battle'){
    const a=casinoOf(u);if(!a)throw err(400,'Сначала создай свой казик');
    const t=db.casinos[b.id];if(!t)throw err(404,'Казик не найден');
    if(t.id===a.id)throw err(400,'Нельзя бить самого себя');
    const now=Date.now();
    if(now-u.lastBattle<30000)throw err(429,`Подожди ${Math.ceil((30000-(now-u.lastBattle))/1000)} сек.`);
    u.lastBattle=now;
    const result=a.metric<t.metric?'win':a.metric>t.metric?'lose':'draw';
    if(result==='win')u.coins+=200;
    t.members.forEach(m=>notify(m,`${u.nick} бросил(а) вызов казику «${t.name}»: ${result==='win'?'вы проиграли':result==='lose'?'вы победили':'ничья'}`));
    return{result,a:{name:a.name,metric:a.metric},b:{name:t.name,metric:t.metric},coins:u.coins};
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
    await client.query('update store set data=$1 where id=1',[JSON.stringify(db)]);
    await client.query('commit');
  }catch(e){
    if(client)try{await client.query('rollback')}catch{}
    code=Number.isInteger(e.code)&&e.code>=400&&e.code<500?e.code:500;
    out={error:code===500?'Ошибка сервера':e.message};
    if(code===500)console.error(e);
  }finally{
    if(client)client.release();
  }
  res.statusCode=code;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(out));
};
