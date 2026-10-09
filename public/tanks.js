(function(){
const W=800,H=520,R=13,KILLS=10,STICK=50;
const TK={
 baby:{n:'Малыш',hp:100,sp:110,rl:.8,dm:20,bs:330,tr:2.2,col:'#6b7f45',price:0,sz:1},
 scout:{n:'Скаут',hp:80,sp:165,rl:.6,dm:14,bs:340,tr:3,col:'#9a8f52',price:150,sz:.9},
 fighter:{n:'Боец',hp:130,sp:115,rl:.7,dm:24,bs:350,tr:2.4,col:'#4f6f3a',price:400,sz:1.05},
 heavy:{n:'Тяжёлый',hp:230,sp:70,rl:1.3,dm:45,bs:300,tr:1.5,col:'#56603f',price:900,sz:1.25},
 sniper:{n:'Снайпер',hp:90,sp:100,rl:1.8,dm:70,bs:560,tr:1.8,col:'#8d9298',price:1500,sz:1},
 rapid:{n:'Скорострел',hp:110,sp:120,rl:.3,dm:16,bs:380,tr:2.6,col:'#a08a55',price:2500,sz:1},
 rapier:{n:'Рапира',hp:100,sp:150,rl:.5,dm:22,bs:400,tr:3.2,col:'#3f7fa6',price:4000,sz:.95},
 guard:{n:'Страж',hp:190,sp:95,rl:.9,dm:30,bs:340,tr:2,col:'#5c6f8a',price:6000,sz:1.1},
 storm:{n:'Буря',hp:125,sp:130,rl:.4,dm:18,bs:420,tr:2.8,col:'#7a4fa3',price:9000,sz:1},
 titan:{n:'Титан',hp:420,sp:55,rl:1.8,dm:85,bs:320,tr:1.1,col:'#4a4f57',price:15000,sz:1.4},
 phantom:{n:'Призрак',hp:70,sp:185,rl:.5,dm:28,bs:450,tr:3.6,col:'#2d3a4a',price:22000,sz:.88},
 howitzer:{n:'Гаубица',hp:150,sp:60,rl:2.6,dm:130,bs:500,tr:1.2,col:'#7d6b3a',price:35000,sz:1.15},
 destroyer:{n:'Разрушитель',hp:310,sp:85,rl:1.1,dm:58,bs:380,tr:1.6,col:'#8a3030',price:50000,sz:1.3},
 legend:{n:'Легенда',hp:270,sp:125,rl:.45,dm:42,bs:480,tr:2.6,col:'#c9a227',price:100000,sz:1.2}
};
const ORDER=['baby','scout','fighter','heavy','sniper','rapid','rapier','guard','storm','titan','phantom','howitzer','destroyer','legend'];
const MD={
 baby:{sl:1,tt:'round',tr:7.5,th:5,gun:18,gt:2.6,wh:5,sk:0,br:0,twin:0},
 scout:{sl:1,tt:'round',tr:6.5,th:4.2,gun:16,gt:2.2,wh:4,sk:0,br:0,twin:0},
 fighter:{sl:1,tt:'round',tr:8.2,th:6,gun:24,gt:3,wh:5,sk:0,br:1,twin:0},
 heavy:{sl:1,tt:'round',tr:10.5,th:7.5,gun:26,gt:4.2,wh:6,sk:0,br:1,twin:0},
 sniper:{sl:0,tt:'box',tl:14,tw:15,th:6.5,gun:38,gt:2.6,wh:4,sk:1,br:1,twin:0},
 rapid:{sl:0,tt:'box',tl:13,tw:14,th:6,gun:15,gt:2.2,wh:4,sk:1,br:0,twin:1},
 rapier:{sl:1,tt:'round',tr:6.8,th:4.6,gun:22,gt:2.2,wh:5,sk:0,br:1,twin:0},
 guard:{sl:0,tt:'box',tl:13,tw:14,th:6.2,gun:24,gt:3.2,wh:5,sk:1,br:1,twin:0},
 storm:{sl:1,tt:'round',tr:8,th:5.2,gun:16,gt:2,wh:5,sk:0,br:0,twin:1},
 titan:{sl:1,tt:'round',tr:12,th:9,gun:30,gt:5,wh:7,sk:1,br:1,twin:0},
 phantom:{sl:1,tt:'round',tr:6,th:3.8,gun:20,gt:1.9,wh:4,sk:0,br:1,twin:0},
 howitzer:{sl:0,tt:'box',tl:16,tw:16,th:8,gun:34,gt:4.8,wh:5,sk:1,br:1,twin:0},
 destroyer:{sl:0,tt:'box',tl:18,tw:15,th:6,gun:36,gt:4,wh:6,sk:1,br:1,twin:0},
 legend:{sl:1,tt:'round',tr:9.5,th:6.5,gun:28,gt:3.4,wh:6,sk:1,br:1,twin:1}
};
const BORDER=[[0,0,800,20],[0,500,800,20],[0,0,20,520],[780,0,20,520]];
const MAPS={
 forest:{n:'🌲 Лес',
  walls:BORDER.concat([[180,120,60,60],[560,120,60,60],[180,340,60,60],[560,340,60,60],[370,230,60,60],[340,70,120,20],[340,430,120,20],[100,240,20,100],[680,240,20,100]]),
  bush:[[60,60,110,80],[620,60,110,80],[60,380,110,80],[620,380,110,80],[260,225,80,70],[460,225,80,70]],
  spawns:[[50,200],[750,200],[50,320],[750,320],[400,150],[400,370],[300,60],[500,460],[150,60],[650,460]],
  th:{sky:0x8ec9ff,g:['#4d9142','#458a3b'],out:0x2f6b2f,bd:0x7d838c,bx:0xa57b3c,tp:0xcc9d55,wh:22,bc:[0x2e8b3a,0x3fae4c],dec:'pine',dc:[0x6b4a2a,0x1f6b34]}},
 desert:{n:'🏜️ Пустыня',
  walls:BORDER.concat([[150,100,80,30],[570,100,80,30],[150,390,80,30],[570,390,80,30],[350,230,100,60],[260,170,20,60],[520,290,20,60],[60,240,50,40],[690,240,50,40]]),
  bush:[[300,60,80,50],[420,410,80,50],[60,100,70,60],[670,360,70,60]],
  spawns:[[50,60],[750,60],[50,460],[750,460],[400,60],[400,460],[50,200],[750,320],[200,260],[600,260]],
  th:{sky:0xf0d9a0,g:['#d9b878','#d1af6e'],out:0xc9a35e,bd:0x9c8860,bx:0xb98b56,tp:0xd3aa72,wh:22,bc:[0x8a9a3b,0xa3b24c],dec:'rock',dc:[0xb98b56,0x4f8a3a]}},
 city:{n:'🏙️ Город',
  walls:BORDER.concat([[100,70,90,80],[270,70,70,60],[460,70,70,60],[610,70,90,80],[100,370,90,80],[270,390,70,60],[460,390,70,60],[610,370,90,80],[330,215,140,90],[60,215,40,90],[700,215,40,90]]),
  bush:[[220,170,50,40],[540,330,50,40]],
  spawns:[[45,45],[755,45],[45,475],[755,475],[400,50],[400,470],[230,260],[570,260],[400,160],[400,360]],
  th:{sky:0xb7c3d1,g:['#6b6f75','#63676d'],out:0x4a4d52,bd:0x8a8f96,bx:0x9aa0a8,tp:0xb5bbc4,wh:26,bc:[0x3c7a4a,0x4d9a5c],dec:'building',dc:[0x8a8f96,0x777d85]}},
 snow:{n:'❄️ Снег',
  walls:BORDER.concat([[200,110,50,50],[550,110,50,50],[200,360,50,50],[550,360,50,50],[375,235,50,50],[90,200,40,40],[670,280,40,40],[300,280,30,30],[470,210,30,30]]),
  bush:[[60,60,100,70],[640,390,100,70],[330,70,90,60],[390,390,90,60]],
  spawns:[[50,260],[750,260],[400,60],[400,460],[150,60],[650,460],[150,460],[650,60],[250,260],[550,260]],
  th:{sky:0xcfe3f5,g:['#e8eef3','#dde6ee'],out:0xf5f8fb,bd:0x9fb0c0,bx:0x8a96a3,tp:0xdfe7ee,wh:22,bc:[0x4f7d6a,0x6aa08a],dec:'pine',dc:[0x5a4a3a,0xdbe8e4]}}
};
let MAP=MAPS.forest;

let G=null,curTab='garage',sel='baby',owned=['baby'],roomsTimer=null,pickMap='forest',pickMax=4;
const ks={};let md=false;
const T={l:null,r:null,mx:0,my:0,fire:false};
const V={yaw:0,aim:0,pitch:.05,scope:false,fov:62};
const PMAX=1.45;
const clamp=v=>Math.max(-1,Math.min(1,v));
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const isMobile=()=>('ontouchstart' in window)||(navigator.maxTouchPoints>0);
const XC=['#ff3b3b','#ffd23b','#3bff6a'],XT=['рикошет','малый урон','полный урон'];

/* ---------- симуляция ---------- */
function newSim(){return{tanks:{},bullets:[],over:0,winner:null,fx:[],fid:0}}
function hitsWall(x,y){
  for(const w of MAP.walls){
    const px=Math.max(w[0],Math.min(x,w[0]+w[2])),py=Math.max(w[1],Math.min(y,w[1]+w[3]));
    if(Math.hypot(x-px,y-py)<R)return true;
  }
  return false;
}
function wallAt(x,y){for(const w of MAP.walls)if(x>=w[0]&&x<=w[0]+w[2]&&y>=w[1]&&y<=w[1]+w[3])return true;return false}
function inBush(x,y){for(const b of MAP.bush)if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return true;return false}
function spawn(s,t){
  const k=TK[t.type]||TK.baby;let best=MAP.spawns[0],bd=-1;
  for(const p of MAP.spawns){
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
  s.tanks[id]=t;spawn(s,t);t.ta=t.a=Math.atan2(H/2-t.y,W/2-t.x);return t;
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
// зона попадания: 0 рикошет, 1 малый урон, 2 полный урон
function zone(ang,face){
  ang+=face==='f'?14:face==='r'?-8:0;
  return ang>=70?0:ang>=48?1:2;
}
const ZM=[0,.4,1];
function hitInfo(t,b){
  const k=TK[t.type]||TK.baby,hl=15*k.sz,hw=9*k.sz;
  const dx=b.x-t.x,dy=b.y-t.y,c=Math.cos(t.a),s=Math.sin(t.a);
  const lx=dx*c+dy*s,ly=-dx*s+dy*c;
  let nx=0,ny=0,face='s';
  if(Math.abs(lx)/hl>Math.abs(ly)/hw){nx=lx>0?1:-1;face=lx>0?'f':'r'}else ny=ly>0?1:-1;
  const wx=nx*c-ny*s,wy=nx*s+ny*c,vl=Math.hypot(b.vx,b.vy)||1;
  const cs=cl(-(b.vx*wx+b.vy*wy)/vl,-1,1);
  return zone(Math.acos(cs)*57.2958,face);
}
function step(s,dt){
  if(s.over){s.over-=dt;if(s.over<=0)reset(s);return}
  for(const t of Object.values(s.tanks)){
    const k=TK[t.type]||TK.baby;
    if(t.bot)ai(s,t,dt);
    if(!t.alive){t.rs-=dt;if(t.rs<=0){spawn(s,t);t.ta=t.a=Math.atan2(H/2-t.y,W/2-t.x)}continue}
    const i=t.in,len=Math.hypot(i.dx,i.dy);
    if(len>0){
      const vx=i.dx/len*k.sp*dt,vy=i.dy/len*k.sp*dt;
      if(!hitsWall(t.x+vx,t.y))t.x+=vx;
      if(!hitsWall(t.x,t.y+vy))t.y+=vy;
      t.a=Math.atan2(i.dy,i.dx);
    }
    let df=i.aim-t.ta;df=Math.atan2(Math.sin(df),Math.cos(df));
    const mx=(t.bot?4:k.tr)*dt;
    t.ta+=cl(df,-mx,mx);
    t.cd-=dt;
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
          const z=hitInfo(t,b);
          t.hp-=b.d*ZM[z];dead=true;
          s.fx.push([++s.fid,Math.round(b.x),Math.round(b.y),z]);
          if(s.fx.length>10)s.fx.shift();
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
    B:s.bullets.map(b=>[Math.round(b.x),Math.round(b.y)]),F:s.fx.slice()};
}
function parse(s){
  return{over:s.o,winner:s.w,fx:s.F||[],bullets:s.B.map(b=>({x:b[0],y:b[1]})),
    tanks:s.T.map(a=>({id:a[0],nick:a[1],type:a[2],x:a[3],y:a[4],a:a[5],ta:a[6],hp:a[7],alive:!!a[8],kills:a[9],cd:a[10]}))};
}
function hostView(g){
  const s=g.sim,v=g.hv||(g.hv={});
  v.over=s.over>0;v.winner=s.winner;v.tanks=Object.values(s.tanks);v.bullets=s.bullets;v.fx=s.fx;
  return v;
}

/* ---------- лучи (цвет прицела) ---------- */
function rayObb(ox,oy,dx,dy,cx,cy,hx,hy,ang){
  const c=Math.cos(ang),s=Math.sin(ang);
  const rx=ox-cx,ry=oy-cy;
  const lox=rx*c+ry*s,loy=-rx*s+ry*c;
  const ldx=dx*c+dy*s,ldy=-dx*s+dy*c;
  let t0=-1e9,t1=1e9,nx=0,ny=0;
  if(Math.abs(ldx)<1e-9){if(Math.abs(lox)>hx)return null}
  else{let a=(-hx-lox)/ldx,b=(hx-lox)/ldx,na=-1;if(a>b){const t=a;a=b;b=t;na=1}
    if(a>t0){t0=a;nx=na;ny=0}if(b<t1)t1=b}
  if(Math.abs(ldy)<1e-9){if(Math.abs(loy)>hy)return null}
  else{let a=(-hy-loy)/ldy,b=(hy-loy)/ldy,na=-1;if(a>b){const t=a;a=b;b=t;na=1}
    if(a>t0){t0=a;nx=0;ny=na}if(b<t1)t1=b}
  if(t0>t1||t1<0||t0<0)return null;
  return{t:t0,wx:nx*c-ny*s,wy:nx*s+ny*c,lnx:nx,lny:ny};
}
function aimZone(g,v,m){
  const d=g.d,dx=Math.cos(m.ta),dy=Math.sin(m.ta);
  let best=(TK[m.type]||TK.baby).bs*1.6,z=-1;
  for(const w of MAP.walls){
    const r=rayObb(m.x,m.y,dx,dy,w[0]+w[2]/2,w[1]+w[3]/2,w[2]/2,w[3]/2,0);
    if(r&&r.t<best)best=r.t;
  }
  let hitT=1e9;
  for(const t of v.tanks){
    if(t.id===m.id||!t.alive)continue;
    const o=d.tanks[t.id];if(!o||!o.vis)continue;
    const k=TK[t.type]||TK.baby;
    const r=rayObb(m.x,m.y,dx,dy,t.x,t.y,15*k.sz,9*k.sz,t.a);
    if(r&&r.t<best&&r.t<hitT){
      hitT=r.t;
      const face=r.lnx>0?'f':r.lnx<0?'r':'s';
      const cs=cl(-(dx*r.wx+dy*r.wy),-1,1);
      z=zone(Math.acos(cs)*57.2958,face);
    }
  }
  return z;
}

/* ---------- ввод ---------- */
function readInput(){
  let a=(ks.KeyW||ks.ArrowUp?1:0)-(ks.KeyS||ks.ArrowDown?1:0);
  let s=(ks.KeyD||ks.ArrowRight?1:0)-(ks.KeyA||ks.ArrowLeft?1:0);
  if(T.l){a+=-T.my;s+=T.mx}
  a=clamp(a);s=clamp(s);
  const c=Math.cos(V.yaw),n=Math.sin(V.yaw);
  return{dx:clamp(a*c-s*n),dy:clamp(a*n+s*c),aim:V.yaw,shoot:md||!!ks.Space||T.fire};
}
function onKD(e){
  if(!G)return;
  if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  ks[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
}
function onKU(e){ks[e.code]=false}
function onMM(e){
  if(!G||!G.d||document.pointerLockElement!==G.d.root)return;
  const k=V.scope?.4:1;
  V.aim+=e.movementX*.0024*k;
  V.pitch=cl(V.pitch-e.movementY*.0016*k,-PMAX,PMAX);
}
function onMU(e){if(e.button===0)md=false;if(e.button===2)V.scope=false}
function onBlur(){for(const k in ks)ks[k]=false;md=false;T.fire=false}

/* ---------- сеть ---------- */
function loadScript(src,test){
  return new Promise((ok,no)=>{
    if(test())return ok();
    const s=document.createElement('script');
    s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Не загрузилась библиотека'));
    document.head.appendChild(s);
  });
}
const loadPeer=()=>loadScript('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',()=>!!window.Peer);
const loadThree=()=>loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',()=>!!window.THREE);

async function sendResult(kills,win,online,played){
  try{
    const j=await api('tank/result',{kills,win,mode:online?'online':'train',played:Math.round(played)});
    if(j.delta>0)toast('+'+fmt(j.delta)+' 🪙 за бой');
    else if(j.delta<0)toast('Проигрыш: '+fmt(j.delta)+' 🪙');
    me.coins=j.coins;upCoins();
  }catch(e){}
}
function checkEnd(g){
  const v=g.view;if(!v)return;
  const now=performance.now();
  if(!v.over){g.ended=false;if(!g.rs)g.rs=now;return}
  if(g.ended)return;
  g.ended=true;
  const m=v.tanks.find(t=>t.id===g.myId);
  const played=g.rs?(now-g.rs)/1000:0;g.rs=0;
  const online=g.online&&v.tanks.length>=2;
  sendResult(m?m.kills:0,v.winner===g.myId,online,played);
}

async function startHost(online,mapId,max){
  clearInterval(roomsTimer);
  if(G)stopGame(true);
  MAP=MAPS[mapId]||MAPS.forest;
  const sim=newSim();
  const g=G={host:true,online,sim,myId:'me',conns:{},view:null,tick:0,max:max||4,mapId:mapId};
  try{await loadThree();if(online)await loadPeer()}
  catch(e){toast(e.message);G=null;return showTanks('play')}
  if(G!==g)return;
  addTank(sim,'me',me.nick,sel,false);
  if(!online){
    [['b1','Бот Вася','scout'],['b2','Бот Петя','fighter'],['b3','Бот Гоша','heavy']].forEach(a=>addTank(sim,a[0],a[1],a[2],true));
  }else{
    g.peer=new Peer();
    const beat=()=>{if(g.peerId)api('tank/room',{peer:g.peerId,players:1+Object.keys(g.conns).length,map:mapId,max:g.max}).catch(()=>{})};
    g.peer.on('open',id=>{g.peerId=id;beat();g.hb=setInterval(beat,15000)});
    g.peer.on('error',e=>{toast('Ошибка соединения');stopGame()});
    g.peer.on('connection',c=>{
      c.on('data',async m=>{
        if(!G||G!==g)return;
        if(m.t==='join'){
          if(g.conns[c.peer])return;
          if(Object.keys(g.conns).length>=g.max-1){c.send({t:'full'});setTimeout(()=>c.close(),300);return}
          g.conns[c.peer]=c;
          let type='baby';
          const nick=String(m.nick||'Игрок').slice(0,20);
          try{const r=await api('tank/check',{nick,tank:String(m.tank||'')});if(r.ok)type=String(m.tank)}catch(e){}
          if(!g.conns[c.peer])return;
          addTank(g.sim,c.peer,nick,type,false);
          c.send({t:'welcome',id:c.peer,map:mapId});
          beat();
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
    const mine=g.sim.tanks.me;
    if(mine)mine.in=readInput();
    while(d>0){const h=Math.min(d,1/60);step(g.sim,h);d-=h}
    g.tick++;
    if(g.online&&g.tick%2===0){
      const sn=snap(g.sim);
      for(const c of Object.values(g.conns)){try{c.send({t:'s',s:sn})}catch(e){}}
    }
  },16);
  mountGame(g,(online?'🌐 Твоя комната: ':'🤖 Тренировка: ')+MAP.n);
}

async function startClient(peerId,mapId){
  clearInterval(roomsTimer);
  if(G)stopGame(true);
  MAP=MAPS[mapId]||MAPS.forest;
  const g=G={host:false,online:true,view:null,myId:null};
  try{await loadThree();await loadPeer()}
  catch(e){toast(e.message);G=null;return showTanks('play')}
  if(G!==g)return;
  g.peer=new Peer();
  g.peer.on('error',e=>{toast('Ошибка соединения');stopGame()});
  g.peer.on('open',()=>{
    const c=g.conn=g.peer.connect(peerId);
    c.on('open',()=>{
      c.send({t:'join',nick:me.nick,tank:sel});
      g.sendIv=setInterval(()=>{if(g.myId){try{c.send(Object.assign({t:'in'},readInput()))}catch(e){}}},33);
    });
    c.on('data',m=>{
      if(G!==g)return;
      if(m.t==='welcome')g.myId=m.id;
      else if(m.t==='s')g.view=parse(m.s);
      else if(m.t==='full'){toast('Комната заполнена');stopGame()}
    });
    c.on('close',()=>{if(G===g){toast('Хост вышел из комнаты');stopGame()}});
  });
  g.to=setTimeout(()=>{if(G===g&&!g.myId){toast('Не удалось подключиться');stopGame()}},10000);
  mountGame(g,'🌐 Онлайн-бой: '+MAP.n);
}

function stopGame(silent){
  const g=G;if(!g)return;G=null;
  clearInterval(g.loop);clearInterval(g.hb);clearInterval(g.sendIv);clearTimeout(g.to);
  if(g.host&&g.online)api('tank/leave',{}).catch(()=>{});
  try{if(g.peer)g.peer.destroy()}catch(e){}
  try{if(document.pointerLockElement)document.exitPointerLock()}catch(e){}
  if(g.d){
    try{g.d.r.dispose();g.d.r.forceContextLoss()}catch(e){}
    if(g.d.root)g.d.root.remove();
    window.removeEventListener('resize',g.d.onResize);
    window.removeEventListener('orientationchange',g.d.onResize);
  }
  T.l=null;T.r=null;T.mx=0;T.my=0;T.fire=false;md=false;V.scope=false;
  window.removeEventListener('keydown',onKD);
  window.removeEventListener('keyup',onKU);
  window.removeEventListener('mousemove',onMM);
  window.removeEventListener('mouseup',onMU);
  window.removeEventListener('blur',onBlur);
  if(!silent)showTanks('play');
}

/* ---------- 3D ---------- */
const matCache={};
function mat(c){
  return matCache[c]||(matCache[c]=new THREE.MeshLambertMaterial({color:c,flatShading:true}));
}
function rnd(i){const x=Math.sin(i*127.1)*43758.5453;return x-Math.floor(x)}
function la(a,b,f){let d=b-a;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*f}

function buildWorld(d,mobile){
  const sc=d.sc,th=MAP.th;
  const mesh=(geo,m)=>{const o=new THREE.Mesh(geo,m);if(!mobile){o.castShadow=true;o.receiveShadow=true}return o};
  d.mesh=mesh;
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  const cx=cv.getContext('2d');
  cx.fillStyle=th.g[0];cx.fillRect(0,0,64,64);
  cx.fillStyle=th.g[1];cx.fillRect(0,0,32,32);cx.fillRect(32,32,32,32);
  const tex=new THREE.CanvasTexture(cv);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(10,6.5);
  tex.magFilter=THREE.NearestFilter;
  const field=new THREE.Mesh(new THREE.PlaneGeometry(W,H).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:tex}));
  field.position.set(W/2,0,H/2);if(!mobile)field.receiveShadow=true;sc.add(field);
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(3200,2400).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:th.out}));
  outer.position.set(W/2,-1,H/2);sc.add(outer);
  MAP.walls.forEach((w,i)=>{
    const h=i<4?12:th.wh;
    const b=mesh(d.box,mat(i<4?th.bd:th.bx));
    b.scale.set(w[2],h,w[3]);b.position.set(w[0]+w[2]/2,h/2,w[1]+w[3]/2);sc.add(b);
    if(i>=4){
      const t=new THREE.Mesh(d.box,mat(th.tp));
      t.scale.set(w[2]-6,2,w[3]-6);t.position.set(w[0]+w[2]/2,h+1,w[1]+w[3]/2);sc.add(t);
    }
  });
  const spots=[];
  MAP.bush.forEach((b,bi)=>{
    for(let gx=b[0]+12,ix=0;gx<b[0]+b[2];gx+=24,ix++)
      for(let gy=b[1]+12,iy=0;gy<b[1]+b[3];gy+=22,iy++){
        const r=rnd(bi*100+ix*10+iy);
        spots.push([gx+(r-.5)*10,gy+(rnd(r*99)-.5)*8,.85+r*.5]);
      }
  });
  const bg=new THREE.IcosahedronGeometry(13,0);
  const bm=new THREE.InstancedMesh(bg,mat(th.bc[0]),spots.length);
  const bm2=new THREE.InstancedMesh(bg,mat(th.bc[1]),spots.length);
  const mx=new THREE.Matrix4(),q=new THREE.Quaternion(),pv=new THREE.Vector3(),sv=new THREE.Vector3();
  spots.forEach((s,i)=>{
    pv.set(s[0],9,s[1]);sv.set(s[2],s[2]*.85,s[2]);mx.compose(pv,q,sv);bm.setMatrixAt(i,mx);
    pv.set(s[0]+3,16,s[1]-2);sv.set(s[2]*.6,s[2]*.55,s[2]*.6);mx.compose(pv,q,sv);bm2.setMatrixAt(i,mx);
  });
  bm.instanceMatrix.needsUpdate=true;bm2.instanceMatrix.needsUpdate=true;
  sc.add(bm);sc.add(bm2);
  const pts=[];
  for(let x=-70;x<=870;x+=65){pts.push([x+rnd(x)*20,-45-rnd(x+1)*40]);pts.push([x+rnd(x+2)*20,565+rnd(x+3)*40])}
  for(let z=-10;z<=530;z+=65){pts.push([-45-rnd(z+4)*40,z]);pts.push([845+rnd(z+5)*40,z])}
  if(th.dec==='pine'){
    const tm=new THREE.InstancedMesh(new THREE.CylinderGeometry(3,4,16,6),mat(th.dc[0]),pts.length);
    const cm=new THREE.InstancedMesh(new THREE.ConeGeometry(17,44,7),mat(th.dc[1]),pts.length);
    pts.forEach((p,i)=>{
      const s=.8+rnd(i*7)*.7;
      pv.set(p[0],8*s,p[1]);sv.set(s,s,s);mx.compose(pv,q,sv);tm.setMatrixAt(i,mx);
      pv.set(p[0],36*s,p[1]);mx.compose(pv,q,sv);cm.setMatrixAt(i,mx);
    });
    tm.instanceMatrix.needsUpdate=true;cm.instanceMatrix.needsUpdate=true;sc.add(tm);sc.add(cm);
  }else if(th.dec==='rock'){
    const rm=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(16,0),mat(th.dc[0]),pts.length);
    const km=new THREE.InstancedMesh(new THREE.CylinderGeometry(3,3,34,6),mat(th.dc[1]),pts.length);
    pts.forEach((p,i)=>{
      const s=.7+rnd(i*5)*1.1;
      pv.set(p[0],7*s,p[1]);sv.set(s*1.3,s*.8,s);mx.compose(pv,q,sv);rm.setMatrixAt(i,mx);
      pv.set(p[0]+22,15,p[1]+10);sv.set(1,1,1);mx.compose(pv,q,sv);km.setMatrixAt(i,mx);
    });
    rm.instanceMatrix.needsUpdate=true;km.instanceMatrix.needsUpdate=true;sc.add(rm);sc.add(km);
  }else{
    pts.forEach((p,i)=>{
      const h=50+rnd(i*3)*90,b=new THREE.Mesh(d.box,mat(th.dc[i%2]));
      b.scale.set(40+rnd(i)*30,h,40+rnd(i+9)*30);b.position.set(p[0],h/2,p[1]);sc.add(b);
    });
  }
}

function buildModel(type,d){
  const k=TK[type]||TK.baby,m=MD[type]||MD.baby;
  const grp=new THREE.Group(),hull=new THREE.Group(),tur=new THREE.Group();
  const base=new THREE.Color(k.col);
  const col=mat(k.col),dk=mat(base.clone().multiplyScalar(.72).getHex()),lt=mat(base.clone().multiplyScalar(1.15).getHex());
  const track=mat(0x2a2a2a),whl=mat(0x454545),gm=mat(0x333333);
  const HL=30,HW=17,HH=7;
  const bx=(mt,sx,sy,sz,x,y,z,p)=>{const o=d.mesh(d.box,mt);o.scale.set(sx,sy,sz);o.position.set(x,y,z);(p||hull).add(o);return o};
  for(const sd of[-1,1]){
    bx(track,HL,6.5,4.6,0,3.25,sd*(HW/2+1));
    for(let i=0;i<m.wh;i++){
      const w=d.mesh(d.wheel,whl);
      w.position.set(-HL/2+4.2+i*((HL-8.4)/(m.wh-1)),3.4,sd*(HW/2+3.4));
      hull.add(w);
    }
    if(m.sk)bx(col,HL-6,4.5,.9,-1,5.2,sd*(HW/2+4.2));
  }
  bx(col,HL-3,HH,HW-4,0,3.2+HH/2,0);
  if(m.sl){const g=bx(lt,9,1.8,HW-5,HL/2-5.5,3.2+HH-.3,0);g.rotation.z=.5}
  else bx(lt,7,3,HW-6,HL/2-6,3.2+HH+1.5,0);
  bx(dk,8,1.4,HW-6,-HL/2+6,3.2+HH+.7,0);
  tur.position.set(m.sl?-2:-1,3.2+HH,0);
  let front;
  if(m.tt==='round'){
    const t=d.mesh(d.cyl8,lt);t.scale.set(m.tr,m.th,m.tr);t.position.y=m.th/2;tur.add(t);
    const c=d.mesh(d.cyl8,dk);c.scale.set(m.tr*.35,2.2,m.tr*.35);c.position.set(-m.tr*.25,m.th+1.1,m.tr*.25);tur.add(c);
    bx(dk,3,m.th*.8,5.5,m.tr-.5,m.th*.5,0,tur);
    front=m.tr+.5;
  }else{
    bx(lt,m.tl,m.th,m.tw,0,m.th/2,0,tur);
    bx(dk,2.4,m.th*.8,m.tw*.55,m.tl/2+1,m.th*.55,0,tur);
    const c=d.mesh(d.cyl8,dk);c.scale.set(2.6,2.2,2.6);c.position.set(-2,m.th+1.1,m.tw*.2);tur.add(c);
    front=m.tl/2+2.2;
  }
  const gy=m.th*.55,zs=m.twin?[-m.gt*1.3,m.gt*1.3]:[0];
  for(const z of zs){
    bx(gm,m.gun,m.gt,m.gt,front+m.gun/2,gy,z,tur);
    if(m.br)bx(dk,3,m.gt*1.7,m.gt*1.7,front+m.gun,gy,z,tur);
  }
  grp.add(hull);grp.add(tur);grp.scale.setScalar(k.sz);
  return{grp,hull,tur};
}
function makeTank(t,d){
  const md=buildModel(t.type,d);
  d.sc.add(md.grp);
  const lab=document.createElement('div');
  lab.style.cssText='position:absolute;left:0;top:0;text-align:center;color:#fff;font:bold 11px sans-serif;text-shadow:0 1px 2px #000;white-space:nowrap;display:none';
  lab.innerHTML='<div class="nn"></div><div style="width:36px;height:5px;background:rgba(0,0,0,.65);margin:1px auto;border-radius:2px;overflow:hidden"><div class="hb" style="height:100%;width:100%;background:#2ecc71"></div></div>';
  lab.firstChild.textContent=t.nick;
  d.lab.appendChild(lab);
  return{g:md.grp,hull:md.hull,tur:md.tur,lab,hb:lab.querySelector('.hb'),nn:lab.firstChild,type:t.type,x:t.x,y:t.y,a:t.a,ta:t.ta,init:0,lhp:-1,s:(TK[t.type]||TK.baby).sz,vis:false};
}
function removeTank(o,d){d.sc.remove(o.g);o.lab.remove()}

function mountGame(g,title){
  const mobile=isMobile(),th=MAP.th;
  const root=document.createElement('div');
  root.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:100;background:#8ec9ff;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;--xc:rgba(255,255,255,.85)';
  const line='position:absolute;left:50%;top:50%;background:var(--xc);';
  root.innerHTML=
   '<canvas id="tc3" style="position:absolute;left:0;top:0;width:100%;height:100%;display:block"></canvas>'+
   '<div id="tlab" style="position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;overflow:hidden"></div>'+
   '<div id="tpad" style="position:absolute;left:0;top:0;right:0;bottom:0;z-index:1;touch-action:none"></div>'+
   '<div id="tsc" style="position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:2;display:none;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 0,rgba(0,0,0,0) 36vmin,rgba(0,0,0,.94) 36.6vmin)">'+
     '<div style="'+line+'width:72vmin;height:2px;margin:-1px 0 0 -36vmin;opacity:.7"></div>'+
     '<div style="'+line+'width:2px;height:72vmin;margin:-36vmin 0 0 -1px;opacity:.7"></div>'+
     '<div style="position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border:3px solid var(--xc);border-radius:50%;box-sizing:border-box"></div>'+
     '<div style="'+line+'width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%"></div></div>'+
   '<div id="txh" style="position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border:2px solid var(--xc);border-radius:50%;box-sizing:border-box;pointer-events:none;z-index:2"><div style="'+line+'width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%"></div></div>'+
   '<div id="txt" style="position:absolute;left:0;right:0;top:calc(50% + 26px);text-align:center;color:var(--xc);font:bold 12px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none;z-index:2"></div>'+
   '<div id="ttl" style="position:absolute;left:50%;top:8px;transform:translateX(-50%);color:#fff;font:bold 13px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none;z-index:2;text-align:center"></div>'+
   '<div id="tport" style="position:absolute;left:50%;top:34px;transform:translateX(-50%);background:rgba(255,90,106,.9);color:#fff;font:bold 12px sans-serif;padding:5px 10px;border-radius:10px;pointer-events:none;z-index:2;display:none">Поверни телефон горизонтально</div>'+
   '<div id="ths" style="position:absolute;left:10px;top:8px;color:#fff;font:12px sans-serif;text-shadow:0 1px 2px #000;line-height:1.4;pointer-events:none;z-index:2"></div>'+
   '<div style="position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(260px,46%);pointer-events:none;z-index:2"><div style="height:14px;background:rgba(0,0,0,.55);border-radius:7px;overflow:hidden"><div id="thp" style="height:100%;width:100%;background:#2ecc71"></div></div><div style="height:6px;margin-top:4px;background:rgba(0,0,0,.55);border-radius:3px;overflow:hidden"><div id="trl" style="height:100%;width:100%;background:#5b6cff"></div></div></div>'+
   '<div id="tmsg" style="position:absolute;left:0;right:0;top:30%;text-align:center;color:#fff;font:bold 28px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none;z-index:2;display:none"></div>'+
   '<button id="tx" style="position:absolute;top:8px;right:8px;z-index:5;background:#ff5a6a;color:#fff;border:0;border-radius:10px;padding:8px 12px;font-size:13px">✕ Выйти</button>'+
   '<div id="thint" style="position:absolute;right:10px;bottom:8px;color:rgba(255,255,255,.85);font:11px sans-serif;text-shadow:0 1px 2px #000;pointer-events:none;z-index:2;text-align:right;max-width:34%"></div>';
  document.body.appendChild(root);
  const q=s=>root.querySelector(s);
  q('#ttl').textContent=title;
  q('#thint').innerHTML=mobile?'Левый стик: ехать<br>Правая половина: вращать обзор':'WASD: ехать · мышь: обзор (вверх и вниз тоже)<br>ЛКМ: огонь · ПКМ (держать): прицел<br>Esc: отпустить мышь';

  let r;
  try{
    r=new THREE.WebGLRenderer({canvas:q('#tc3'),antialias:!mobile,powerPreference:'high-performance'});
  }catch(e){root.remove();toast('Твой браузер не поддерживает 3D (WebGL)');G=g;stopGame();return}
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.5:2));
  r.setSize(innerWidth,innerHeight,false);
  if(!mobile){r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap}
  const sc=new THREE.Scene();
  sc.background=new THREE.Color(th.sky);
  sc.fog=new THREE.Fog(th.sky,520,1150);
  const cam=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,4,2200);
  sc.add(new THREE.HemisphereLight(0xffffff,0x4a5a4a,.9));
  const dl=new THREE.DirectionalLight(0xffffff,.75);
  dl.position.set(560,520,330);dl.target.position.set(W/2,0,H/2);
  if(!mobile){
    dl.castShadow=true;dl.shadow.mapSize.set(1024,1024);
    const c=dl.shadow.camera;c.left=-480;c.right=480;c.top=380;c.bottom=-380;c.near=50;c.far=1400;
  }
  sc.add(dl);sc.add(dl.target);

  const d=g.d={r,sc,cam,root,box:new THREE.BoxGeometry(1,1,1),cyl8:new THREE.CylinderGeometry(1,1,1,8),
    wheel:new THREE.CylinderGeometry(3.2,3.2,2,8).rotateX(Math.PI/2),
    tanks:{},bp:[],fl:[],fxMax:0,fxInit:false,lab:q('#tlab'),hudT:0,wasAlive:false,
    el:{msg:q('#tmsg'),hs:q('#ths'),hp:q('#thp'),rl:q('#trl'),port:q('#tport'),sc:q('#tsc'),xh:q('#txh'),xt:q('#txt')}};
  buildWorld(d,mobile);
  d.bGeo=new THREE.SphereGeometry(3.2,6,6);
  d.bMat=new THREE.MeshBasicMaterial({color:0xffd34d});
  d.fxg=new THREE.SphereGeometry(5,8,8);
  d.fxm=[0xff3b3b,0xffd23b,0x3bff6a].map(c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.85}));
  d.v3=new THREE.Vector3();

  d.onResize=()=>{
    r.setSize(innerWidth,innerHeight,false);
    cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();
    d.el.port.style.display=(mobile&&innerHeight>innerWidth)?'block':'none';
  };
  window.addEventListener('resize',d.onResize);
  window.addEventListener('orientationchange',d.onResize);
  d.onResize();
  try{if(mobile&&screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{})}catch(e){}

  // ввод: мышь
  root.addEventListener('contextmenu',e=>e.preventDefault());
  root.addEventListener('mousedown',e=>{
    if(!mobile&&document.pointerLockElement!==root){try{root.requestPointerLock()}catch(x){}}
    if(e.button===0)md=true;
    if(e.button===2)V.scope=true;
    e.preventDefault();
  });
  q('#tx').addEventListener('mousedown',e=>e.stopPropagation());
  q('#tx').onclick=()=>stopGame();
  // ввод: сенсор
  const pad=q('#tpad');
  const sb=document.createElement('div');
  sb.style.cssText='position:absolute;width:100px;height:100px;margin:-50px 0 0 -50px;border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.35);display:none;pointer-events:none;z-index:2';
  const sk=document.createElement('div');
  sk.style.cssText='position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.55)';
  sb.appendChild(sk);root.appendChild(sb);
  pad.addEventListener('touchstart',e=>{
    e.preventDefault();
    for(const c of e.changedTouches){
      if(c.clientX<innerWidth/2&&!T.l){T.l={id:c.identifier,ox:c.clientX,oy:c.clientY};sb.style.left=c.clientX+'px';sb.style.top=c.clientY+'px';sb.style.display='block';sk.style.transform='translate(0,0)'}
      else if(c.clientX>=innerWidth/2&&!T.r){T.r={id:c.identifier,lx:c.clientX,ly:c.clientY}}
    }
  },{passive:false});
  pad.addEventListener('touchmove',e=>{
    e.preventDefault();
    for(const c of e.changedTouches){
      if(T.l&&c.identifier===T.l.id){
        let dx=c.clientX-T.l.ox,dy=c.clientY-T.l.oy;const l=Math.hypot(dx,dy),k=l>STICK?STICK/l:1;dx*=k;dy*=k;
        sk.style.transform='translate('+dx+'px,'+dy+'px)';
        if(l>8){T.mx=dx/STICK;T.my=dy/STICK}else{T.mx=0;T.my=0}
      }else if(T.r&&c.identifier===T.r.id){
        const k=V.scope?.4:1;
        V.aim+=(c.clientX-T.r.lx)*.006*k;
        V.pitch=cl(V.pitch-(c.clientY-T.r.ly)*.004*k,-PMAX,PMAX);
        T.r.lx=c.clientX;T.r.ly=c.clientY;
      }
    }
  },{passive:false});
  const tend=e=>{
    e.preventDefault();
    for(const c of e.changedTouches){
      if(T.l&&c.identifier===T.l.id){T.l=null;T.mx=0;T.my=0;sb.style.display='none'}
      else if(T.r&&c.identifier===T.r.id)T.r=null;
    }
  };
  pad.addEventListener('touchend',tend,{passive:false});
  pad.addEventListener('touchcancel',tend,{passive:false});
  if(mobile){
    const mk=(txt,css)=>{const b=document.createElement('div');b.textContent=txt;b.style.cssText='position:absolute;border-radius:50%;border:3px solid rgba(255,255,255,.7);color:#fff;display:grid;place-items:center;z-index:3;touch-action:none;font-size:26px;'+css;root.appendChild(b);return b};
    const bf=mk('🔥','right:26px;bottom:60px;width:86px;height:86px;background:rgba(255,90,106,.55)');
    const bs=mk('🔭','right:34px;bottom:164px;width:62px;height:62px;background:rgba(91,108,255,.55)');
    bf.addEventListener('touchstart',e=>{e.preventDefault();T.fire=true},{passive:false});
    const fe=e=>{e.preventDefault();T.fire=false};
    bf.addEventListener('touchend',fe,{passive:false});bf.addEventListener('touchcancel',fe,{passive:false});
    bs.addEventListener('touchstart',e=>{e.preventDefault();V.scope=!V.scope},{passive:false});
  }
  window.addEventListener('keydown',onKD);
  window.addEventListener('keyup',onKU);
  window.addEventListener('mousemove',onMM);
  window.addEventListener('mouseup',onMU);
  window.addEventListener('blur',onBlur);

  V.scope=false;V.pitch=.05;V.fov=62;
  g.lt=performance.now();
  requestAnimationFrame(frame);
}

function frame(now){
  const g=G;if(!g||!g.d)return;
  requestAnimationFrame(frame);
  const d=g.d,el=d.el;
  const dt=Math.min(.1,Math.max(.001,(now-g.lt)/1000));g.lt=now;
  const v=g.host?hostView(g):g.view;
  if(!v){el.msg.textContent='Подключение…';el.msg.style.display='block';d.r.render(d.sc,d.cam);return}
  g.view=v;checkEnd(g);
  const m=v.tanks.find(t=>t.id===g.myId);
  if(m&&!m.alive)V.scope=false;
  const seen={};
  for(const t of v.tanks){
    seen[t.id]=1;
    let o=d.tanks[t.id];
    if(!o||o.type!==t.type){if(o)removeTank(o,d);o=d.tanks[t.id]=makeTank(t,d)}
    if(g.host){o.x=t.x;o.y=t.y;o.a=t.a;o.ta=t.ta;o.init=1}
    else if(!o.init||Math.hypot(t.x-o.x,t.y-o.y)>80){o.x=t.x;o.y=t.y;o.a=t.a;o.ta=t.ta;o.init=1}
    else{const f=1-Math.exp(-dt*20);o.x+=(t.x-o.x)*f;o.y+=(t.y-o.y)*f;o.a=la(o.a,t.a,f);o.ta=la(o.ta,t.ta,f)}
    const mine=t.id===g.myId;
    const hid=inBush(t.x,t.y)&&!mine&&!(m&&m.alive&&Math.hypot(m.x-t.x,m.y-t.y)<90);
    o.vis=t.alive&&!hid;
    o.g.visible=o.vis&&!(mine&&V.scope);
    o.g.position.set(o.x,0,o.y);
    o.hull.rotation.y=-o.a;o.tur.rotation.y=-o.ta;
    if(o.lhp!==t.hp){
      o.lhp=t.hp;const mh=(TK[t.type]||TK.baby).hp;
      o.hb.style.width=Math.max(0,Math.min(100,t.hp/mh*100))+'%';
      o.hb.style.background=t.hp/mh>.4?'#2ecc71':'#ff5a6a';
    }
    o.nn.style.color=mine?'#ffd34d':'#fff';
  }
  for(const id in d.tanks)if(!seen[id]){removeTank(d.tanks[id],d);delete d.tanks[id]}

  // снаряды
  const bs=v.bullets;
  while(d.bp.length<bs.length){const b=new THREE.Mesh(d.bGeo,d.bMat);b.visible=false;d.sc.add(b);d.bp.push(b)}
  for(let i=0;i<d.bp.length;i++){
    const b=d.bp[i];
    if(i<bs.length){b.visible=true;b.position.set(bs[i].x,15,bs[i].y)}else b.visible=false;
  }
  // вспышки попаданий
  const fx=v.fx||[];
  if(!d.fxInit){d.fxInit=true;for(const e of fx)if(e[0]>d.fxMax)d.fxMax=e[0]}
  for(const e of fx){
    if(e[0]>d.fxMax){
      d.fxMax=e[0];
      const f=new THREE.Mesh(d.fxg,d.fxm[e[3]]);
      f.position.set(e[1],15,e[2]);f.userData.l=.3;d.sc.add(f);d.fl.push(f);
    }
  }
  for(let i=d.fl.length-1;i>=0;i--){
    const f=d.fl[i];f.userData.l-=dt;
    if(f.userData.l<=0){d.sc.remove(f);d.fl.splice(i,1)}
    else f.scale.setScalar(1+(.3-f.userData.l)*8);
  }

  // камера (свободно вверх и вниз)
  const o=g.myId&&d.tanks[g.myId];
  if(o&&m){
    if(!d.wasAlive&&m.alive){V.aim=V.yaw=Math.atan2(H/2-m.y,W/2-m.x)}
    d.wasAlive=m.alive;
  }
  V.yaw=la(V.yaw,V.aim,1-Math.exp(-dt*9));
  const px=o?o.x:W/2,pz=o?o.y:H/2;
  const sc=V.scope;
  V.fov+=((sc?16:62)-V.fov)*(1-Math.exp(-dt*12));
  d.cam.fov=V.fov;d.cam.updateProjectionMatrix();
  const cy=Math.cos(V.yaw),sy=Math.sin(V.yaw),cp=Math.cos(V.pitch),sp=Math.sin(V.pitch);
  const fx0=cp*cy,fy0=sp,fz0=cp*sy;
  let cx,camY,cz;
  if(sc){cx=px+cy*10;camY=19;cz=pz+sy*10}
  else{cx=px-fx0*64;camY=Math.max(4,18-fy0*64);cz=pz-fz0*64}
  cx=cl(cx,12,788);cz=cl(cz,12,508);
  d.cam.position.set(cx,camY,cz);
  d.cam.lookAt(cx+fx0*200,camY+fy0*200,cz+fz0*200);
  d.cam.updateMatrixWorld();
  d.cam.matrixWorldInverse.copy(d.cam.matrixWorld).invert();

  // подписи
  const W2=innerWidth,H2=innerHeight;
  for(const t of v.tanks){
    const k=d.tanks[t.id];if(!k)continue;
    if(k.vis&&t.id!==g.myId){
      d.v3.set(k.x,34*k.s,k.y).project(d.cam);
      if(d.v3.z<1&&d.v3.z>-1){
        k.lab.style.display='block';
        k.lab.style.transform='translate('+((d.v3.x*.5+.5)*W2).toFixed(0)+'px,'+((-d.v3.y*.5+.5)*H2).toFixed(0)+'px) translate(-50%,-100%)';
      }else k.lab.style.display='none';
    }else k.lab.style.display='none';
  }

  // прицел
  el.sc.style.display=sc?'block':'none';
  el.xh.style.display=sc?'none':'block';
  let col='rgba(255,255,255,.85)',txt='';
  if(m&&m.alive){
    let df=V.yaw-m.ta;df=Math.atan2(Math.sin(df),Math.cos(df));
    if(Math.abs(df)<.12){
      const z=aimZone(g,v,m);
      if(z>=0){col=XC[z];txt=XT[z]}
    }
  }
  d.root.style.setProperty('--xc',col);
  el.xt.textContent=txt;

  // HUD
  if(m){
    const k=TK[m.type]||TK.baby;
    el.hp.style.width=Math.max(0,m.hp/k.hp*100)+'%';
    el.rl.style.width=(m.alive?(1-Math.max(0,Math.min(k.rl,m.cd))/k.rl)*100:0)+'%';
  }
  if(now-d.hudT>150){
    d.hudT=now;
    const sc2=[...v.tanks].sort((a,b)=>b.kills-a.kills).slice(0,10);
    let h='До победы: '+KILLS+' убийств';
    for(const t of sc2)h+='<br><span style="color:'+(t.id===g.myId?'#ffd34d':'#fff')+'">'+esc(t.nick)+': '+t.kills+'</span>';
    el.hs.innerHTML=h;
  }
  if(v.over){
    const w=v.tanks.find(t=>t.id===v.winner);
    el.msg.textContent='Победил: '+(w?w.nick:'?');el.msg.style.display='block';
  }else if(m&&!m.alive){el.msg.textContent='Возрождение…';el.msg.style.display='block'}
  else el.msg.style.display='none';

  d.r.render(d.sc,d.cam);
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
    return `<div class="box"><div style="display:flex;gap:14px;align-items:center">${icon(k.col)}<div style="flex:1"><b>${k.n}</b>${id===sel?' <span class="ok">✔ выбран</span>':''}<div class="sub">❤️ здоровье ${k.hp} · ⚡ скорость ${k.sp} · 💥 урон ${k.dm} · 🔁 перезарядка ${k.rl} с · 🚀 пуля ${k.bs} · 🔄 башня ${k.tr}</div></div>${btn}</div></div>`;
  }).join('');
}
async function buy(id){
  try{const j=await api('tank/buy',{id});me.coins=j.coins;upCoins();owned=j.tanks;sel=j.sel;garage()}
  catch(e){toast(e.message)}
}
async function select(id){
  try{await api('tank/select',{id});sel=id;garage()}catch(e){toast(e.message)}
}
function readPick(){
  const mp=$('#tmap'),mx=$('#tmax');
  if(mp)pickMap=mp.value;
  if(mx)pickMax=cl(Math.floor(+mx.value)||4,1,10);
}
function play(){
  $('#tb').innerHTML=`<div class="box"><div class="sub">Твой танк: <b>${TK[sel].n}</b> (меняется в гараже)</div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin:12px 0;align-items:end">
   <div><div class="sub">Карта</div><select id="tmap" style="padding:10px;border-radius:10px;background:var(--panel2);color:var(--txt);border:1px solid var(--line);font-size:14px">${Object.keys(MAPS).map(k=>`<option value="${k}" ${k===pickMap?'selected':''}>${MAPS[k].n}</option>`).join('')}</select></div>
   <div><div class="sub">Игроков в комнате (1–10)</div><input id="tmax" type="number" min="1" max="10" value="${pickMax}" style="width:110px"></div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="p" onclick="TK_train()">🤖 Тренировка с ботами</button><button class="p" onclick="TK_host()">🌐 Создать онлайн-комнату</button></div></div>
  <div class="box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Комнаты</b><button onclick="TK_refresh()">Обновить</button></div><div id="rooms" class="sub">Загрузка…</div></div>
  <div class="sub">3D-бой от третьего лица. ПК: мышь (вверх и вниз тоже), WASD, ПКМ — прицел. Телефон: горизонтально, левый стик едет, правая половина экрана вращает обзор. Цвет прицела: красный — рикошет, жёлтый — малый урон, зелёный — полный. Победа = 10 убийств. Онлайн: победа +50 000 🪙, поражение −10 000 🪙. Тренировка: 3 🪙 за убийство и +500 за победу.</div>`;
  loadRooms();
  roomsTimer=setInterval(loadRooms,4000);
}
async function loadRooms(){
  const el=$('#rooms');
  if(!el){clearInterval(roomsTimer);return}
  try{
    const j=await api('tank/rooms');
    el.innerHTML=j.rooms.length?j.rooms.map(r=>{
      const mx=r.max||4,full=r.players>=mx;
      return `<div class="row"><div><b>${esc(r.host)}</b><div class="sub">${MAPS[r.map]?MAPS[r.map].n:''} · Игроков: ${r.players}/${mx}</div></div><button class="p" ${full?'disabled':''} onclick='TK_join(${JSON.stringify(r.peer)},${JSON.stringify(r.map||'forest')})'>Войти</button></div>`;
    }).join(''):'Пока нет комнат. Создай свою!';
  }catch(e){el.textContent=e.message}
}

window.TKINFO=TK;
Object.assign(window,{
  TK_open:()=>showTanks('garage'),
  TK_tab:t=>showTanks(t),TK_buy:buy,TK_sel:select,
  TK_train:()=>{readPick();startHost(false,pickMap,4)},
  TK_host:()=>{readPick();startHost(true,pickMap,pickMax)},
  TK_join:(p,mp)=>startClient(p,mp),TK_refresh:loadRooms
});
})();
