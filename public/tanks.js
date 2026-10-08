(function(){
const W=800,H=520,R=13,KILLS=10;
const TK={
 baby:{n:'Малыш',hp:100,sp:110,rl:.8,dm:20,bs:330,col:'#6aa84f',price:0},
 scout:{n:'Скаут',hp:80,sp:165,rl:.6,dm:14,bs:340,col:'#3d85c6',price:150},
 fighter:{n:'Боец',hp:130,sp:115,rl:.7,dm:24,bs:350,col:'#e69138',price:400},
 heavy:{n:'Тяжёлый',hp:230,sp:70,rl:1.3,dm:45,bs:300,col:'#a33a22',price:900},
 sniper:{n:'Снайпер',hp:90,sp:100,rl:1.8,dm:70,bs:560,col:'#8e7cc3',price:1500},
 rapid:{n:'Скорострел',hp:110,sp:120,rl:.25,dm:9,bs:380,col:'#cc2b2b',price:2500}
};
const ORDER=['baby','scout','fighter','heavy','sniper','rapid'];
const WALLS=[[0,0,800,20],[0,500,800,20],[0,0,20,520],[780,0,20,520],
 [180,120,60,60],[560,120,60,60],[180,340,60,60],[560,340,60,60],[370,230,60,60],
 [340,70,120,20],[340,430,120,20],[100,240,20,100],[680,240,20,100]];
const BUSH=[[60,60,110,80],[620,60,110,80],[60,380,110,80],[620,380,110,80],[260,225,80,70],[460,225,80,70]];
const SPAWNS=[[50,200],[750,200],[50,320],[750,320],[400,150],[400,370]];

let G=null,curTab='garage',sel='baby',owned=['baby'],roomsTimer=null;
const ks={};let mx=400,my=260,md=false;
const clamp=v=>Math.max(-1,Math.min(1,v));

/* ---------- симуляция ---------- */
function newSim(){return{tanks:{},bullets:[],over:0,winner:null}}
function hitsWall(x,y){
  for(const w of WALLS){
    const px=Math.max(w[0],Math.min(x,w[0]+w[2])),py=Math.max(w[1],Math.min(y,w[1]+w[3]));
    if(Math.hypot(x-px,y-py)<R)return true;
  }
  return false;
}
function wallAt(x,y){for(const w of WALLS)if(x>=w[0]&&x<=w[0]+w[2]&&y>=w[1]&&y<=w[1]+w[3])return true;return false}
function inBush(x,y){for(const b of BUSH)if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return true;return false}
function spawn(s,t){
  const k=TK[t.type]||TK.baby;let best=SPAWNS[0],bd=-1;
  for(const p of SPAWNS){
    let d=1e9;
    for(const o of Object.values(s.tanks))if(o!==t&&o.alive)d=Math.min(d,Math.hypot(o.x-p[0],o.y-p[1]));
    d+=Math.random()*60;
    if(d>bd){bd=d;best=p}
  }
  t.x=best[0];t.y=best[1];t.hp=k.hp;t.alive=true;t.cd=1;
}
function addTank(s,id,nick,type,bot){
  const t={id,nick,type:TK[type]?type:'baby',bot:!!bot,x:0,y:0,a:0,ta:0,hp:1,alive:true,cd:0,rs:0,kills:0,
    in:{dx:0,dy:0,aim:0,shoot:false},ai:{t:0,dir:1,ang:0}};
  s.tanks[id]=t;spawn(s,t);return t;
}
function reset(s){
  s.over=0;s.winner=null;s.bullets=[];
  for(const t of Object.values(s.tanks)){t.kills=0;spawn(s,t)}
}
function ai(s,t,dt){
  t.ai.t-=dt;
  let tg=null,bd=1e9;
  for(const o of Object.values(s.tanks)){
    if(o===t||!o.alive)continue;
    const d=Math.hypot(o.x-t.x,o.y-t.y);
    if(d<bd){bd=d;tg=o}
  }
  if(!tg||!t.alive){t.in={dx:0,dy:0,aim:t.ta,shoot:false};return}
  const ang=Math.atan2(tg.y-t.y,tg.x-t.x);
  if(t.ai.t<=0){t.ai.t=.6+Math.random()*1.2;t.ai.dir=Math.random()<.5?-1:1;t.ai.ang=(Math.random()-.5)*1.4}
  let mv=ang+t.ai.ang;
  if(bd<170)mv=ang+Math.PI/2*t.ai.dir;
  t.in={dx:Math.cos(mv),dy:Math.sin(mv),aim:ang+(Math.random()-.5)*.1,shoot:bd<420};
}
function step(s,dt){
  if(s.over){s.over-=dt;if(s.over<=0)reset(s);return}
  for(const t of Object.values(s.tanks)){
    const k=TK[t.type]||TK.baby;
    if(t.bot)ai(s,t,dt);
    if(!t.alive){t.rs-=dt;if(t.rs<=0)spawn(s,t);continue}
    const i=t.in,len=Math.hypot(i.dx,i.dy);
    if(len>0){
      const vx=i.dx/len*k.sp*dt,vy=i.dy/len*k.sp*dt;
      if(!hitsWall(t.x+vx,t.y))t.x+=vx;
      if(!hitsWall(t.x,t.y+vy))t.y+=vy;
      t.a=Math.atan2(i.dy,i.dx);
    }
    t.ta=i.aim;t.cd-=dt;
    if(i.shoot&&t.cd<=0){
      t.cd=k.rl;
      s.bullets.push({x:t.x+Math.cos(t.ta)*18,y:t.y+Math.sin(t.ta)*18,vx:Math.cos(t.ta)*k.bs,vy:Math.sin(t.ta)*k.bs,o:t.id,d:k.dm,l:1.6});
    }
  }
  for(let n=s.bullets.length-1;n>=0;n--){
    const b=s.bullets[n];b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;
    let dead=b.l<=0||wallAt(b.x,b.y);
    if(!dead){
      for(const t of Object.values(s.tanks)){
        if(!t.alive||t.id===b.o)continue;
        if(Math.hypot(t.x-b.x,t.y-b.y)<R+3){
          t.hp-=b.d;dead=true;
          if(t.hp<=0){
            t.alive=false;t.rs=3;
            const o=s.tanks[b.o];
            if(o){o.kills++;if(o.kills>=KILLS&&!s.over){s.over=7;s.winner=o.id}}
          }
          break;
        }
      }
    }
    if(dead)s.bullets.splice(n,1);
  }
}
function snap(s){
  return{o:s.over>0?1:0,w:s.winner,
    T:Object.values(s.tanks).map(t=>[t.id,t.nick,t.type,Math.round(t.x),Math.round(t.y),+t.a.toFixed(2),+t.ta.toFixed(2),Math.round(t.hp),t.alive?1:0,t.kills,+Math.max(0,t.cd).toFixed(2)]),
    B:s.bullets.map(b=>[Math.round(b.x),Math.round(b.y)])};
}
function parse(s){
  return{over:s.o,winner:s.w,bullets:s.B,
    tanks:s.T.map(a=>({id:a[0],nick:a[1],type:a[2],x:a[3],y:a[4],a:a[5],ta:a[6],hp:a[7],alive:!!a[8],kills:a[9],cd:a[10]}))};
}

/* ---------- ввод ---------- */
function readInput(v,id){
  const dx=(ks.KeyD||ks.ArrowRight?1:0)-(ks.KeyA||ks.ArrowLeft?1:0);
  const dy=(ks.KeyS||ks.ArrowDown?1:0)-(ks.KeyW||ks.ArrowUp?1:0);
  let aim=0;
  const m=v&&v.tanks.find(t=>t.id===id);
  if(m)aim=Math.atan2(my-m.y,mx-m.x);
  return{dx,dy,aim,shoot:md||!!ks.Space};
}
function onKD(e){
  if(!G)return;
  if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  ks[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
}
function onKU(e){ks[e.code]=false}
function onMU(){md=false}
function onBlur(){for(const k in ks)ks[k]=false;md=false}

/* ---------- сеть ---------- */
function loadPeer(){
  return new Promise((ok,no)=>{
    if(window.Peer)return ok();
    const s=document.createElement('script');
    s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload=ok;s.onerror=()=>no(new Error('Не загрузился PeerJS'));
    document.head.appendChild(s);
  });
}
async function reward(kills,win){
  try{
    const j=await api('tank/reward',{kills,win});
    if(j.got>0)toast('+'+j.got+' 🪙 за бой');
    me.coins=j.coins;upCoins();
  }catch(e){}
}
function checkEnd(g){
  const v=g.view;
  if(v.over&&!g.ended){
    g.ended=true;
    const m=v.tanks.find(t=>t.id===g.myId);
    reward(m?m.kills:0,v.winner===g.myId);
  }
  if(!v.over)g.ended=false;
}

async function startHost(online){
  clearInterval(roomsTimer);
  const sim=newSim();
  const g=G={host:true,online,sim,myId:'me',conns:{},view:null,tick:0};
  addTank(sim,'me',me.nick,sel,false);
  if(!online){
    [['b1','Бот Вася','scout'],['b2','Бот Петя','fighter'],['b3','Бот Гоша','heavy']].forEach(a=>addTank(sim,a[0],a[1],a[2],true));
  }else{
    try{await loadPeer()}catch(e){toast(e.message);G=null;return showTanks('play')}
    g.peer=new Peer();
    const beat=()=>{if(g.peerId)api('tank/room',{peer:g.peerId,players:1+Object.keys(g.conns).length}).catch(()=>{})};
    g.peer.on('open',id=>{g.peerId=id;beat();g.hb=setInterval(beat,15000)});
    g.peer.on('error',e=>{toast('Ошибка соединения');stopGame()});
    g.peer.on('connection',c=>{
      c.on('data',async m=>{
        if(!G||G!==g)return;
        if(m.t==='join'){
          if(g.conns[c.peer])return;
          if(Object.keys(g.conns).length>=3){c.send({t:'full'});setTimeout(()=>c.close(),300);return}
          g.conns[c.peer]=c;
          let type='baby';
          const nick=String(m.nick||'Игрок').slice(0,20);
          try{const r=await api('tank/check',{nick,tank:String(m.tank||'')});if(r.ok)type=String(m.tank)}catch(e){}
          if(!g.conns[c.peer])return;
          addTank(g.sim,c.peer,nick,type,false);
          c.send({t:'welcome',id:c.peer});
        }else if(m.t==='in'){
          const t=g.sim.tanks[c.peer];
          if(t)t.in={dx:clamp(+m.dx||0),dy:clamp(+m.dy||0),aim:+m.aim||0,shoot:!!m.shoot};
        }
      });
      c.on('close',()=>{delete g.conns[c.peer];delete g.sim.tanks[c.peer]});
    });
  }
  g.last=performance.now();
  g.loop=setInterval(()=>{
    const now=performance.now();let d=Math.min(.1,(now-g.last)/1000);g.last=now;
    while(d>0){const h=Math.min(d,1/60);step(g.sim,h);d-=h}
    const t=g.sim.tanks.me;
    if(t)t.in=readInput({tanks:Object.values(g.sim.tanks)},'me');
    g.tick++;
    if(g.online&&g.tick%3===0){
      const sn=snap(g.sim);
      for(const c of Object.values(g.conns)){try{c.send({t:'s',s:sn})}catch(e){}}
    }
  },16);
  mountGame(online?'🌐 Твоя онлайн-комната (жди друзей)':'🤖 Тренировка с ботами');
}

async function startClient(peerId){
  clearInterval(roomsTimer);
  try{await loadPeer()}catch(e){toast(e.message);return showTanks('play')}
  const g=G={host:false,online:true,view:null,myId:null};
  g.peer=new Peer();
  g.peer.on('error',e=>{toast('Ошибка соединения');stopGame()});
  g.peer.on('open',()=>{
    const c=g.conn=g.peer.connect(peerId);
    c.on('open',()=>{
      c.send({t:'join',nick:me.nick,tank:sel});
      g.sendIv=setInterval(()=>{if(g.myId){try{c.send(Object.assign({t:'in'},readInput(g.view,g.myId)))}catch(e){}}},33);
    });
    c.on('data',m=>{
      if(G!==g)return;
      if(m.t==='welcome')g.myId=m.id;
      else if(m.t==='s'){g.view=parse(m.s);if(g.myId)checkEnd(g)}
      else if(m.t==='full'){toast('Комната заполнена');stopGame()}
    });
    c.on('close',()=>{if(G===g){toast('Хост вышел из комнаты');stopGame()}});
  });
  g.to=setTimeout(()=>{if(G===g&&!g.myId){toast('Не удалось подключиться');stopGame()}},10000);
  mountGame('🌐 Онлайн-бой');
}

function stopGame(silent){
  const g=G;if(!g)return;G=null;
  clearInterval(g.loop);clearInterval(g.hb);clearInterval(g.sendIv);clearTimeout(g.to);
  if(g.host&&g.online)api('tank/leave',{}).catch(()=>{});
  try{if(g.peer)g.peer.destroy()}catch(e){}
  window.removeEventListener('keydown',onKD);
  window.removeEventListener('keyup',onKU);
  window.removeEventListener('mouseup',onMU);
  window.removeEventListener('blur',onBlur);
  if(!silent)showTanks('play');
}

/* ---------- рисование ---------- */
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function drawTank(x,t,mine){
  const k=TK[t.type]||TK.baby;
  x.save();x.translate(t.x,t.y);
  x.save();x.rotate(t.a);
  x.fillStyle='#222';x.fillRect(-14,-13,28,6);x.fillRect(-14,7,28,6);
  x.fillStyle=k.col;x.fillRect(-13,-8,26,16);
  x.restore();
  x.rotate(t.ta);
  x.fillStyle='#333';x.fillRect(0,-3,20,6);
  x.beginPath();x.arc(0,0,7,0,7);x.fillStyle=mine?'#fff':'#ddd';x.fill();
  x.beginPath();x.arc(0,0,4.5,0,7);x.fillStyle=k.col;x.fill();
  x.restore();
  x.fillStyle='rgba(0,0,0,.6)';x.fillRect(t.x-15,t.y-24,30,5);
  x.fillStyle=t.hp/k.hp>.4?'#2ecc71':'#ff5a6a';
  x.fillRect(t.x-15,t.y-24,30*Math.max(0,t.hp)/k.hp,5);
  x.fillStyle='#fff';x.font='10px sans-serif';x.textAlign='center';x.fillText(t.nick,t.x,t.y-28);
}
function draw(g){
  const cv=$('#tc');if(!cv)return;
  const x=cv.getContext('2d'),v=g.view;
  x.fillStyle='#1e2d1e';x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(255,255,255,.05)';x.lineWidth=1;
  for(let i=0;i<=W;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}
  for(let j=0;j<=H;j+=40){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke()}
  for(const w of WALLS){
    x.fillStyle='#7a5a30';x.fillRect(w[0],w[1],w[2],w[3]);
    x.strokeStyle='#432f14';x.lineWidth=3;x.strokeRect(w[0]+1,w[1]+1,w[2]-2,w[3]-2);
  }
  if(!v){x.fillStyle='#fff';x.font='20px sans-serif';x.textAlign='center';x.fillText('Подключение…',W/2,H/2);return}
  const m=v.tanks.find(t=>t.id===g.myId);
  for(const t of v.tanks){
    if(!t.alive)continue;
    const hid=inBush(t.x,t.y)&&t.id!==g.myId&&!(m&&m.alive&&Math.hypot(m.x-t.x,m.y-t.y)<90);
    if(!hid)drawTank(x,t,t.id===g.myId);
  }
  x.fillStyle='#ffd34d';
  for(const b of v.bullets){x.beginPath();x.arc(b[0],b[1],3.5,0,7);x.fill()}
  for(const b of BUSH){
    x.fillStyle='rgba(46,125,50,.85)';rr(x,b[0],b[1],b[2],b[3],24);x.fill();
    x.fillStyle='rgba(27,94,32,.7)';
    for(let i=0;i<5;i++){x.beginPath();x.arc(b[0]+((i*37)%b[2]),b[1]+((i*53)%b[3]),14,0,7);x.fill()}
  }
  if(m&&m.alive&&inBush(m.x,m.y)){x.globalAlpha=.6;drawTank(x,m,true);x.globalAlpha=1}
  // табло
  const sc=[...v.tanks].sort((a,b)=>b.kills-a.kills);
  x.textAlign='left';x.font='12px sans-serif';
  x.fillStyle='#fff';x.fillText('До победы: '+KILLS+' убийств',30,34);
  sc.forEach((t,i)=>{x.fillStyle=t.id===g.myId?'#ffd34d':'#fff';x.fillText(t.nick+': '+t.kills,30,50+i*15)});
  if(m){
    const k=TK[m.type]||TK.baby;
    x.fillStyle='rgba(0,0,0,.6)';x.fillRect(W/2-60,H-44,120,8);
    x.fillStyle='#5b6cff';x.fillRect(W/2-60,H-44,120*(1-Math.max(0,m.cd)/k.rl),8);
    x.fillStyle='#fff';x.textAlign='center';x.fillText(m.alive?'Перезарядка':'Возрождение…',W/2,H-50);
  }
  if(v.over){
    const w=v.tanks.find(t=>t.id===v.winner);
    x.fillStyle='rgba(0,0,0,.65)';x.fillRect(0,0,W,H);
    x.fillStyle='#fff';x.textAlign='center';x.font='bold 34px sans-serif';
    x.fillText('Победил: '+(w?w.nick:'?'),W/2,H/2);
    x.font='16px sans-serif';x.fillText('Новый раунд сейчас начнётся…',W/2,H/2+30);
  }
}
function frame(){
  const g=G;if(!g)return;
  if(!$('#tc')){stopGame(true);return}
  if(g.host)g.view=parse(snap(g.sim));
  if(g.view)checkEnd(g);
  draw(g);
  requestAnimationFrame(frame);
}
function mountGame(title){
  $('#content').innerHTML=`<div class="box" style="text-align:center"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>${title}</b><button class="d" id="tx">Выйти из боя</button></div><canvas id="tc" width="${W}" height="${H}" style="width:100%;max-width:${W}px;background:#111;border-radius:12px;cursor:crosshair"></canvas><div class="sub" style="margin-top:8px">WASD или стрелки: ехать · мышь: целиться · клик или пробел: стрелять · кусты прячут танки</div></div>`;
  const cv=$('#tc');
  cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();mx=(e.clientX-r.left)*W/r.width;my=(e.clientY-r.top)*H/r.height});
  cv.addEventListener('mousedown',e=>{md=true;e.preventDefault()});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  $('#tx').onclick=()=>stopGame();
  window.addEventListener('keydown',onKD);
  window.addEventListener('keyup',onKU);
  window.addEventListener('mouseup',onMU);
  window.addEventListener('blur',onBlur);
  requestAnimationFrame(frame);
}

/* ---------- гараж и лобби ---------- */
function icon(c){return `<div style="width:62px;height:42px;background:${c};border-radius:7px;position:relative;flex:none"><div style="position:absolute;left:32px;top:17px;width:32px;height:8px;background:#222;border-radius:3px"></div><div style="position:absolute;left:20px;top:11px;width:20px;height:20px;background:#ddd;border-radius:50%"></div></div>`}
async function showTanks(tab){
  if(G)stopGame(true);
  if(tab)curTab=tab;
  clearInterval(roomsTimer);
  const ct=$('#content');
  try{
    const g=await api('tank/garage');
    me.coins=g.coins;upCoins();owned=g.tanks;sel=g.sel;
  }catch(e){ct.innerHTML='<div class="empty">'+esc(e.message)+'</div>';return}
  ct.innerHTML=`<h2>🪖 Танки</h2><div style="display:flex;gap:8px;margin-bottom:14px"><button class="${curTab==='garage'?'p':''}" onclick="TK_tab('garage')">🛠️ Гараж</button><button class="${curTab==='play'?'p':''}" onclick="TK_tab('play')">⚔️ Играть</button></div><div id="tb"></div>`;
  if(curTab==='garage')garage();else play();
}
function garage(){
  $('#tb').innerHTML=ORDER.map(id=>{
    const k=TK[id],has=owned.includes(id);
    const btn=has?(id===sel?'':`<button class="p" onclick="TK_sel('${id}')">Выбрать</button>`)
      :`<button class="p" ${me.coins<k.price?'disabled':''} onclick="TK_buy('${id}')">🪙 ${fmt(k.price)}</button>`;
    return `<div class="box"><div style="display:flex;gap:14px;align-items:center">${icon(k.col)}<div style="flex:1"><b>${k.n}</b>${id===sel?' <span class="ok">✔ выбран</span>':''}<div class="sub">❤️ здоровье ${k.hp} · ⚡ скорость ${k.sp} · 💥 урон ${k.dm} · 🔁 перезарядка ${k.rl} с · 🚀 пуля ${k.bs}</div></div>${btn}</div></div>`;
  }).join('');
}
async function buy(id){
  try{const j=await api('tank/buy',{id});me.coins=j.coins;upCoins();owned=j.tanks;sel=j.sel;garage()}
  catch(e){toast(e.message)}
}
async function select(id){
  try{await api('tank/select',{id});sel=id;garage()}catch(e){toast(e.message)}
}
function play(){
  $('#tb').innerHTML=`<div class="box"><div class="sub">Твой танк: <b>${TK[sel].n}</b> (меняется в гараже)</div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="p" onclick="TK_train()">🤖 Тренировка с ботами</button><button class="p" onclick="TK_host()">🌐 Создать онлайн-комнату</button></div></div><div class="box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Комнаты</b><button onclick="TK_refresh()">Обновить</button></div><div id="rooms" class="sub">Загрузка…</div></div><div class="sub">Победа = 10 убийств. Награда за бой: 3 🪙 за убийство и +20 🪙 за победу.</div>`;
  loadRooms();
  roomsTimer=setInterval(loadRooms,4000);
}
async function loadRooms(){
  const el=$('#rooms');
  if(!el){clearInterval(roomsTimer);return}
  try{
    const j=await api('tank/rooms');
    el.innerHTML=j.rooms.length?j.rooms.map(r=>`<div class="row"><div><b>${esc(r.host)}</b><div class="sub">Игроков: ${r.players}/4</div></div><button class="p" ${r.players>=4?'disabled':''} onclick='TK_join(${JSON.stringify(r.peer)})'>Войти</button></div>`).join(''):'Пока нет комнат. Создай свою!';
  }catch(e){el.textContent=e.message}
}

Object.assign(window,{
  openTanks:()=>showTanks('garage'),
  TK_tab:t=>showTanks(t),TK_buy:buy,TK_sel:select,
  TK_train:()=>startHost(false),TK_host:()=>startHost(true),
  TK_join:p=>startClient(p),TK_refresh:loadRooms
});

/* ---------- пункт меню ---------- */
const _rm=renderMenu;
renderMenu=function(){
  _rm();
  const m=$('#menu');
  if(m)m.insertAdjacentHTML('beforeend','<div class="item" onclick="openTanks()"><div class="ava">🪖</div><div><b>Танки</b><div class="sub">покупай танки и играй онлайн</div></div></div>');
};
if(typeof me!=='undefined'&&me)renderMenu();
})();
