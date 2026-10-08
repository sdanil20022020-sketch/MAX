(function(){
const W=800,H=520,R=13,KILLS=10,STICK=50;
const TK={
 baby:{n:'Малыш',hp:100,sp:110,rl:.8,dm:20,bs:330,col:'#6aa84f',price:0,sz:1,bl:18,bt:3.2},
 scout:{n:'Скаут',hp:80,sp:165,rl:.6,dm:14,bs:340,col:'#3d85c6',price:150,sz:.9,bl:16,bt:2.6},
 fighter:{n:'Боец',hp:130,sp:115,rl:.7,dm:24,bs:350,col:'#e69138',price:400,sz:1.05,bl:20,bt:3.6},
 heavy:{n:'Тяжёлый',hp:230,sp:70,rl:1.3,dm:45,bs:300,col:'#a33a22',price:900,sz:1.25,bl:22,bt:5.5},
 sniper:{n:'Снайпер',hp:90,sp:100,rl:1.8,dm:70,bs:560,col:'#8e7cc3',price:1500,sz:1,bl:32,bt:2.6},
 rapid:{n:'Скорострел',hp:110,sp:120,rl:.25,dm:9,bs:380,col:'#cc2b2b',price:2500,sz:1,bl:14,bt:2.8,twin:1}
};
const ORDER=['baby','scout','fighter','heavy','sniper','rapid'];
const WALLS=[[0,0,800,20],[0,500,800,20],[0,0,20,520],[780,0,20,520],
 [180,120,60,60],[560,120,60,60],[180,340,60,60],[560,340,60,60],[370,230,60,60],
 [340,70,120,20],[340,430,120,20],[100,240,20,100],[680,240,20,100]];
const BUSH=[[60,60,110,80],[620,60,110,80],[60,380,110,80],[620,380,110,80],[260,225,80,70],[460,225,80,70]];
const SPAWNS=[[50,200],[750,200],[50,320],[750,320],[400,150],[400,370]];

let G=null,curTab='garage',sel='baby',owned=['baby'],roomsTimer=null;
const ks={};let md=false,lastAim=0;
const M={x:0,y:0,has:false};
const T={l:null,r:null,mx:0,my:0,ang:0,has:false};
const clamp=v=>Math.max(-1,Math.min(1,v));
const isMobile=()=>('ontouchstart' in window)||(navigator.maxTouchPoints>0);

/* ---------- симуляция (как раньше) ---------- */
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
  return{over:s.o,winner:s.w,bullets:s.B.map(b=>({x:b[0],y:b[1]})),
    tanks:s.T.map(a=>({id:a[0],nick:a[1],type:a[2],x:a[3],y:a[4],a:a[5],ta:a[6],hp:a[7],alive:!!a[8],kills:a[9],cd:a[10]}))};
}
function hostView(g){
  const s=g.sim,v=g.hv||(g.hv={});
  v.over=s.over>0;v.winner=s.winner;v.tanks=Object.values(s.tanks);v.bullets=s.bullets;
  return v;
}

/* ---------- ввод ---------- */
let _rc=null,_pl=null,_hit=null,_nd=null;
function readInput(v,id){
  let dx=(ks.KeyD||ks.ArrowRight?1:0)-(ks.KeyA||ks.ArrowLeft?1:0);
  let dy=(ks.KeyS||ks.ArrowDown?1:0)-(ks.KeyW||ks.ArrowUp?1:0);
  if(T.l){dx+=T.mx;dy+=T.my}
  dx=clamp(dx);dy=clamp(dy);
  const m=v&&v.tanks.find(t=>t.id===id);
  if(T.r)lastAim=T.ang;
  else if(M.has&&!T.has&&m&&G&&G.d&&window.THREE){
    if(!_rc){_rc=new THREE.Raycaster();_pl=new THREE.Plane(new THREE.Vector3(0,1,0),-8);_hit=new THREE.Vector3();_nd=new THREE.Vector2()}
    _nd.set(M.x/innerWidth*2-1,-(M.y/innerHeight)*2+1);
    _rc.setFromCamera(_nd,G.d.cam);
    if(_rc.ray.intersectPlane(_pl,_hit))lastAim=Math.atan2(_hit.z-m.y,_hit.x-m.x);
  }
  return{dx,dy,aim:lastAim,shoot:md||!!ks.Space||!!T.r};
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

async function reward(kills,win){
  try{
    const j=await api('tank/reward',{kills,win});
    if(j.got>0)toast('+'+j.got+' 🪙 за бой');
    me.coins=j.coins;upCoins();
  }catch(e){}
}
function checkEnd(g){
  const v=g.view;if(!v)return;
  if(v.over&&!g.ended){
    g.ended=true;
    const m=v.tanks.find(t=>t.id===g.myId);
    reward(m?m.kills:0,v.winner===g.myId);
  }
  if(!v.over)g.ended=false;
}

async function startHost(online){
  clearInterval(roomsTimer);
  if(G)stopGame(true);
  const sim=newSim();
  const g=G={host:true,online,sim,myId:'me',conns:{},view:null,tick:0};
  try{await loadThree();if(online)await loadPeer()}
  catch(e){toast(e.message);G=null;return showTanks('play')}
  if(G!==g)return;
  const mine=addTank(sim,'me',me.nick,sel,false);
  const hv={tanks:[mine]};
  if(!online){
    [['b1','Бот Вася','scout'],['b2','Бот Петя','fighter'],['b3','Бот Гоша','heavy']].forEach(a=>addTank(sim,a[0],a[1],a[2],true));
  }else{
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
    mine.in=readInput(hv,'me');
    g.tick++;
    if(g.online&&g.tick%2===0){
      const sn=snap(g.sim);
      for(const c of Object.values(g.conns)){try{c.send({t:'s',s:sn})}catch(e){}}
    }
  },16);
  mountGame(g,online?'🌐 Твоя онлайн-комната: жди друзей':'🤖 Тренировка с ботами');
}

async function startClient(peerId){
  clearInterval(roomsTimer);
  if(G)stopGame(true);
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
      g.sendIv=setInterval(()=>{if(g.myId){try{c.send(Object.assign({t:'in'},readInput(g.view,g.myId)))}catch(e){}}},33);
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
  mountGame(g,'🌐 Онлайн-бой');
}

function stopGame(silent){
  const g=G;if(!g)return;G=null;
  clearInterval(g.loop);clearInterval(g.hb);clearInterval(g.sendIv);clearTimeout(g.to);
  if(g.host&&g.online)api('tank/leave',{}).catch(()=>{});
  try{if(g.peer)g.peer.destroy()}catch(e){}
  if(g.d){
    try{g.d.r.dispose();g.d.r.forceContextLoss()}catch(e){}
    if(g.d.root)g.d.root.remove();
    window.removeEventListener('resize',g.d.onResize);
    window.removeEventListener('orientationchange',g.d.onResize);
  }
  T.l=null;T.r=null;T.mx=0;T.my=0;T.has=false;md=false;
  window.removeEventListener('keydown',onKD);
  window.removeEventListener('keyup',onKU);
  window.removeEventListener('mouseup',onMU);
  window.removeEventListener('blur',onBlur);
  if(!silent)showTanks('play');
}

/* ---------- 3D ---------- */
const matCache={};
function mat(c){
  const key=String(c);
  return matCache[key]||(matCache[key]=new THREE.MeshLambertMaterial({color:c,flatShading:true}));
}
function rnd(i){const x=Math.sin(i*127.1)*43758.5453;return x-Math.floor(x)}
function la(a,b,f){let d=b-a;d=((d+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*f}

function buildWorld(d,mobile){
  const sc=d.sc;
  const mesh=(geo,m)=>{const o=new THREE.Mesh(geo,m);if(!mobile){o.castShadow=true;o.receiveShadow=true}return o};
  d.mesh=mesh;
  // земля
  const cv=document.createElement('canvas');cv.width=cv.height=64;
  const cx=cv.getContext('2d');
  cx.fillStyle='#4d9142';cx.fillRect(0,0,64,64);
  cx.fillStyle='#458a3b';cx.fillRect(0,0,32,32);cx.fillRect(32,32,32,32);
  const tex=new THREE.CanvasTexture(cv);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(10,6.5);
  tex.magFilter=THREE.NearestFilter;
  const field=new THREE.Mesh(new THREE.PlaneGeometry(W,H).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:tex}));
  field.position.set(W/2,0,H/2);if(!mobile)field.receiveShadow=true;sc.add(field);
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(3200,2400).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0x2f6b2f}));
  outer.position.set(W/2,-1,H/2);sc.add(outer);
  // стены и ящики
  WALLS.forEach((w,i)=>{
    const h=i<4?12:22;
    const b=mesh(d.box,mat(i<4?0x7d838c:0xa57b3c));
    b.scale.set(w[2],h,w[3]);b.position.set(w[0]+w[2]/2,h/2,w[1]+w[3]/2);sc.add(b);
    if(i>=4){
      const t=new THREE.Mesh(d.box,mat(0xcc9d55));
      t.scale.set(w[2]-6,2,w[3]-6);t.position.set(w[0]+w[2]/2,h+1,w[1]+w[3]/2);sc.add(t);
    }
  });
  // кусты (инстансы)
  const spots=[];
  BUSH.forEach((b,bi)=>{
    for(let gx=b[0]+12,ix=0;gx<b[0]+b[2];gx+=24,ix++)
      for(let gy=b[1]+12,iy=0;gy<b[1]+b[3];gy+=22,iy++){
        const r=rnd(bi*100+ix*10+iy);
        spots.push([gx+(r-.5)*10,gy+(rnd(r*99)-.5)*8,.85+r*.5]);
      }
  });
  const bg=new THREE.IcosahedronGeometry(13,0);
  const bm=new THREE.InstancedMesh(bg,mat(0x2e8b3a),spots.length);
  const bm2=new THREE.InstancedMesh(bg,mat(0x3fae4c),spots.length);
  const mx=new THREE.Matrix4(),q=new THREE.Quaternion(),pv=new THREE.Vector3(),sv=new THREE.Vector3();
  spots.forEach((s,i)=>{
    pv.set(s[0],9,s[1]);sv.set(s[2],s[2]*.85,s[2]);mx.compose(pv,q,sv);bm.setMatrixAt(i,mx);
    pv.set(s[0]+3,16,s[1]-2);sv.set(s[2]*.6,s[2]*.55,s[2]*.6);mx.compose(pv,q,sv);bm2.setMatrixAt(i,mx);
  });
  bm.instanceMatrix.needsUpdate=true;bm2.instanceMatrix.needsUpdate=true;
  sc.add(bm);sc.add(bm2);
  // деревья вокруг арены
  const pts=[];
  for(let x=-70;x<=870;x+=65){pts.push([x+rnd(x)*20,-45-rnd(x+1)*40]);pts.push([x+rnd(x+2)*20,565+rnd(x+3)*40])}
  for(let z=-10;z<=530;z+=65){pts.push([-45-rnd(z+4)*40,z]);pts.push([845+rnd(z+5)*40,z])}
  const tg=new THREE.CylinderGeometry(3,4,16,6),cg=new THREE.ConeGeometry(17,44,7);
  const tm=new THREE.InstancedMesh(tg,mat(0x6b4a2a),pts.length);
  const cm=new THREE.InstancedMesh(cg,mat(0x1f6b34),pts.length);
  pts.forEach((p,i)=>{
    const s=.8+rnd(i*7)*.7;
    pv.set(p[0],8*s,p[1]);sv.set(s,s,s);mx.compose(pv,q,sv);tm.setMatrixAt(i,mx);
    pv.set(p[0],36*s,p[1]);mx.compose(pv,q,sv);cm.setMatrixAt(i,mx);
  });
  tm.instanceMatrix.needsUpdate=true;cm.instanceMatrix.needsUpdate=true;
  sc.add(tm);sc.add(cm);
}

function makeTank(t,d){
  const k=TK[t.type]||TK.baby,s=k.sz||1;
  const grp=new THREE.Group(),hull=new THREE.Group(),tur=new THREE.Group();
  const col=mat(k.col),dark=mat(0x222222),gun=mat(0x3a3a3a);
  const top=mat(new THREE.Color(k.col).multiplyScalar(1.25).getHex());
  const body=d.mesh(d.box,col);body.scale.set(28*s,8*s,17*s);body.position.y=7*s;
  const trL=d.mesh(d.box,dark);trL.scale.set(31*s,7*s,5*s);trL.position.set(0,4*s,-10.5*s);
  const trR=trL.clone();trR.position.z=10.5*s;
  hull.add(body);hull.add(trL);hull.add(trR);
  const tu=d.mesh(d.cyl8,top);tu.scale.set(7.5*s,5*s,7.5*s);tu.position.y=14*s;tur.add(tu);
  const addGun=z=>{const b=d.mesh(d.box,gun);b.scale.set(k.bl,k.bt,k.bt);b.position.set(4*s+k.bl/2,14*s,z);tur.add(b)};
  if(k.twin){addGun(-3.2*s);addGun(3.2*s)}else addGun(0);
  const ring=new THREE.Mesh(new THREE.RingGeometry(19*s,22*s,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75}));
  ring.position.y=.6;ring.visible=false;
  grp.add(hull);grp.add(tur);grp.add(ring);d.sc.add(grp);
  const lab=document.createElement('div');
  lab.style.cssText='position:absolute;left:0;top:0;text-align:center;color:#fff;font:bold 11px sans-serif;text-shadow:0 1px 2px #000;white-space:nowrap;display:none';
  lab.innerHTML='<div class="nn"></div><div style="width:36px;height:5px;background:rgba(0,0,0,.65);margin:1px auto;border-radius:2px;overflow:hidden"><div class="hb" style="height:100%;width:100%;background:#2ecc71"></div></div>';
  lab.firstChild.textContent=t.nick;
  d.lab.appendChild(lab);
  return{g:grp,hull,tur,ring,lab,hb:lab.querySelector('.hb'),nn:lab.firstChild,type:t.type,x:t.x,y:t.y,a:t.a,ta:t.ta,init:0,lhp:-1,s};
}
function removeTank(o,d){d.sc.remove(o.g);o.lab.remove()}

function mkStick(root){
  const b=document.createElement('div');
  b.style.cssText='position:absolute;width:100px;height:100px;margin:-50px 0 0 -50px;border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.35);display:none;pointer-events:none;z-index:2';
  const k=document.createElement('div');
  k.style.cssText='position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.55)';
  b.appendChild(k);root.appendChild(b);return{b,k};
}

function mountGame(g,title){
  const mobile=isMobile();
  const root=document.createElement('div');
  root.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:100;background:#8ec9ff;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none';
  root.innerHTML=
   '<canvas id="tc3" style="position:absolute;left:0;top:0;width:100%;height:100%;display:block"></canvas>'+
   '<div id="tlab" style="position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;overflow:hidden"></div>'+
   '<div id="tpad" style="position:absolute;left:0;top:0;right:0;bottom:0;z-index:1;touch-action:none"></div>'+
   '<div id="ttl" style="position:absolute;left:50%;top:8px;transform:translateX(-50%);color:#fff;font:bold 13px sans-serif;text-shadow:0 1px 3px #000;pointer-events:none;z-index:2;text-align:center"></div>'+
   '<div id="tport" style="position:absolute;left:50%;top:34px;transform:translateX(-50%);background:rgba(255,90,106,.9);color:#fff;font:bold 12px sans-serif;padding:5px 10px;border-radius:10px;pointer-events:none;z-index:2;display:none">Поверни телефон горизонтально</div>'+
   '<div id="ths" style="position:absolute;left:10px;top:8px;color:#fff;font:12px sans-serif;text-shadow:0 1px 2px #000;line-height:1.4;pointer-events:none;z-index:2"></div>'+
   '<div style="position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(260px,46%);pointer-events:none;z-index:2"><div style="height:14px;background:rgba(0,0,0,.55);border-radius:7px;overflow:hidden"><div id="thp" style="height:100%;width:100%;background:#2ecc71"></div></div><div style="height:6px;margin-top:4px;background:rgba(0,0,0,.55);border-radius:3px;overflow:hidden"><div id="trl" style="height:100%;width:100%;background:#5b6cff"></div></div></div>'+
   '<div id="tmsg" style="position:absolute;left:0;right:0;top:40%;text-align:center;color:#fff;font:bold 28px sans-serif;text-shadow:0 2px 6px #000;pointer-events:none;z-index:2;display:none"></div>'+
   '<button id="tx" style="position:absolute;top:8px;right:8px;z-index:5;background:#ff5a6a;color:#fff;border:0;border-radius:10px;padding:8px 12px;font-size:13px">✕ Выйти</button>'+
   '<div style="position:absolute;right:10px;bottom:8px;color:rgba(255,255,255,.8);font:11px sans-serif;text-shadow:0 1px 2px #000;pointer-events:none;z-index:2;text-align:right;max-width:30%">'+(mobile?'Левый стик: ехать<br>Правый стик: целиться и стрелять':'WASD: ехать · мышь: целиться<br>клик / пробел: стрелять')+'</div>';
  document.body.appendChild(root);
  const q=s=>root.querySelector(s);
  root.querySelector('#ttl').textContent=title;

  let r;
  try{
    r=new THREE.WebGLRenderer({canvas:q('#tc3'),antialias:!mobile,powerPreference:'high-performance'});
  }catch(e){root.remove();toast('Твой браузер не поддерживает 3D (WebGL)');G=g;stopGame();return}
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.5:2));
  r.setSize(innerWidth,innerHeight,false);
  if(!mobile){r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap}
  const sc=new THREE.Scene();
  sc.background=new THREE.Color(0x8ec9ff);
  sc.fog=new THREE.Fog(0x8ec9ff,520,1150);
  const cam=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,10,2200);
  sc.add(new THREE.HemisphereLight(0xffffff,0x4a6a4a,.85));
  const dl=new THREE.DirectionalLight(0xffffff,.75);
  dl.position.set(560,520,330);dl.target.position.set(W/2,0,H/2);
  if(!mobile){
    dl.castShadow=true;dl.shadow.mapSize.set(1024,1024);
    const c=dl.shadow.camera;c.left=-480;c.right=480;c.top=380;c.bottom=-380;c.near=50;c.far=1400;
  }
  sc.add(dl);sc.add(dl.target);

  const d=g.d={r,sc,cam,root,box:new THREE.BoxGeometry(1,1,1),cyl8:new THREE.CylinderGeometry(1,1,1,8),
    tanks:{},bp:[],lab:q('#tlab'),cx:W/2,cz:H/2,hudT:0,
    el:{msg:q('#tmsg'),hs:q('#ths'),hp:q('#thp'),rl:q('#trl'),port:q('#tport')}};
  buildWorld(d,mobile);
  d.bGeo=new THREE.SphereGeometry(3.5,6,6);
  d.bMat=new THREE.MeshBasicMaterial({color:0xffd34d});
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

  // ввод
  const pad=q('#tpad');
  pad.addEventListener('mousemove',e=>{M.x=e.clientX;M.y=e.clientY;M.has=true});
  pad.addEventListener('mousedown',e=>{M.x=e.clientX;M.y=e.clientY;M.has=true;md=true;e.preventDefault()});
  pad.addEventListener('contextmenu',e=>e.preventDefault());
  const sl=mkStick(root),sr=mkStick(root);
  const place=(s,x,y)=>{s.b.style.left=x+'px';s.b.style.top=y+'px';s.b.style.display='block';s.k.style.transform='translate(0,0)'};
  const move=(s,ox,oy,x,y)=>{
    let dx=x-ox,dy=y-oy;const l=Math.hypot(dx,dy),k=l>STICK?STICK/l:1;dx*=k;dy*=k;
    s.k.style.transform='translate('+dx+'px,'+dy+'px)';
    return[dx/STICK,dy/STICK,l];
  };
  pad.addEventListener('touchstart',e=>{
    e.preventDefault();T.has=true;
    for(const c of e.changedTouches){
      if(c.clientX<innerWidth/2&&!T.l){T.l={id:c.identifier,ox:c.clientX,oy:c.clientY};place(sl,c.clientX,c.clientY)}
      else if(c.clientX>=innerWidth/2&&!T.r){T.r={id:c.identifier,ox:c.clientX,oy:c.clientY};place(sr,c.clientX,c.clientY)}
    }
  },{passive:false});
  pad.addEventListener('touchmove',e=>{
    e.preventDefault();
    for(const c of e.changedTouches){
      if(T.l&&c.identifier===T.l.id){
        const v=move(sl,T.l.ox,T.l.oy,c.clientX,c.clientY);
        if(v[2]>8){T.mx=v[0];T.my=v[1]}else{T.mx=0;T.my=0}
      }else if(T.r&&c.identifier===T.r.id){
        const v=move(sr,T.r.ox,T.r.oy,c.clientX,c.clientY);
        if(v[2]>8)T.ang=Math.atan2(v[1],v[0]);
      }
    }
  },{passive:false});
  const tend=e=>{
    e.preventDefault();
    for(const c of e.changedTouches){
      if(T.l&&c.identifier===T.l.id){T.l=null;T.mx=0;T.my=0;sl.b.style.display='none'}
      else if(T.r&&c.identifier===T.r.id){T.r=null;sr.b.style.display='none'}
    }
  };
  pad.addEventListener('touchend',tend,{passive:false});
  pad.addEventListener('touchcancel',tend,{passive:false});
  q('#tx').onclick=()=>stopGame();
  window.addEventListener('keydown',onKD);
  window.addEventListener('keyup',onKU);
  window.addEventListener('mouseup',onMU);
  window.addEventListener('blur',onBlur);

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
  const seen={};
  const W2=innerWidth,H2=innerHeight;
  for(const t of v.tanks){
    seen[t.id]=1;
    let o=d.tanks[t.id];
    if(!o||o.type!==t.type){if(o)removeTank(o,d);o=d.tanks[t.id]=makeTank(t,d)}
    if(g.host){o.x=t.x;o.y=t.y;o.a=t.a;o.ta=t.ta;o.init=1}
    else if(!o.init||Math.hypot(t.x-o.x,t.y-o.y)>80){o.x=t.x;o.y=t.y;o.a=t.a;o.ta=t.ta;o.init=1}
    else{const f=1-Math.exp(-dt*20);o.x+=(t.x-o.x)*f;o.y+=(t.y-o.y)*f;o.a=la(o.a,t.a,f);o.ta=la(o.ta,t.ta,f)}
    const hid=inBush(t.x,t.y)&&t.id!==g.myId&&!(m&&m.alive&&Math.hypot(m.x-t.x,m.y-t.y)<90);
    const vis=t.alive&&!hid;
    o.g.visible=vis;
    o.g.position.set(o.x,0,o.y);
    o.hull.rotation.y=-o.a;o.tur.rotation.y=-o.ta;
    o.ring.visible=(t.id===g.myId);
    if(vis){
      d.v3.set(o.x,34*o.s,o.y).project(d.cam);
      if(d.v3.z<1){
        o.lab.style.display='block';
        o.lab.style.transform='translate('+((d.v3.x*.5+.5)*W2).toFixed(0)+'px,'+((-d.v3.y*.5+.5)*H2).toFixed(0)+'px) translate(-50%,-100%)';
      }else o.lab.style.display='none';
    }else o.lab.style.display='none';
    if(o.lhp!==t.hp){
      o.lhp=t.hp;const mh=(TK[t.type]||TK.baby).hp;
      o.hb.style.width=Math.max(0,Math.min(100,t.hp/mh*100))+'%';
      o.hb.style.background=t.hp/mh>.4?'#2ecc71':'#ff5a6a';
    }
    o.nn.style.color=t.id===g.myId?'#ffd34d':'#fff';
  }
  for(const id in d.tanks)if(!seen[id]){removeTank(d.tanks[id],d);delete d.tanks[id]}

  // снаряды
  const bs=v.bullets;
  while(d.bp.length<bs.length){
    const b=new THREE.Mesh(d.bGeo,d.bMat);b.visible=false;d.sc.add(b);d.bp.push(b);
  }
  for(let i=0;i<d.bp.length;i++){
    const b=d.bp[i];
    if(i<bs.length){b.visible=true;b.position.set(bs[i].x,10,bs[i].y)}else b.visible=false;
  }

  // камера
  const o=g.myId&&d.tanks[g.myId];
  const px=o?o.x:W/2,pz=o?o.y:H/2;
  const tx=Math.max(100,Math.min(700,px)),tz=Math.max(60,Math.min(460,pz));
  const f=1-Math.exp(-dt*8);
  d.cx+=(tx-d.cx)*f;d.cz+=(tz-d.cz)*f;
  const kk=d.cam.aspect<1.2?1.45:1;
  d.cam.position.set(d.cx,300*kk,d.cz+235*kk);
  d.cam.lookAt(d.cx,0,d.cz-10);
  d.cam.updateMatrixWorld();

  // HUD
  if(m){
    const k=TK[m.type]||TK.baby;
    el.hp.style.width=Math.max(0,m.hp/k.hp*100)+'%';
    el.rl.style.width=(m.alive?(1-Math.max(0,Math.min(k.rl,m.cd))/k.rl)*100:0)+'%';
  }
  if(now-d.hudT>150){
    d.hudT=now;
    const sc2=[...v.tanks].sort((a,b)=>b.kills-a.kills);
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
  $('#tb').innerHTML=`<div class="box"><div class="sub">Твой танк: <b>${TK[sel].n}</b> (меняется в гараже)</div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="p" onclick="TK_train()">🤖 Тренировка с ботами</button><button class="p" onclick="TK_host()">🌐 Создать онлайн-комнату</button></div></div><div class="box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Комнаты</b><button onclick="TK_refresh()">Обновить</button></div><div id="rooms" class="sub">Загрузка…</div></div><div class="sub">3D-бой. На телефоне держи экран горизонтально: левый стик едет, правый целится и стреляет. Победа = 10 убийств. Награда: 3 🪙 за убийство и +20 🪙 за победу.</div>`;
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
