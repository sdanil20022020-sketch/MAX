/* shgame.js — клиентская часть матча MAX SHOOTERS: 3D, управление, оружие, интерфейс (HUD), покупки, радар */
(function () {
  var T = window.THREE, S = window.MXSIM, W = window.MXW.W, GFX = window.MXGFX, MP = window.MXM;
  var G = window.MXG = {};
  var D2R = Math.PI / 180;

  var css = document.createElement('style');
  css.textContent = [
    '.sg{position:fixed;inset:0;z-index:9500;background:#000;overflow:hidden;font:14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;user-select:none;-webkit-user-select:none;touch-action:none}',
    '.sg canvas.sgc{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '.sg *{box-sizing:border-box}',
    '.sg .hud{position:absolute;inset:0;pointer-events:none}',
    '.sg .abs{position:absolute}',
    '.sg .timer{left:50%;top:6px;transform:translateX(-50%);text-align:center;text-shadow:0 1px 3px #000}',
    '.sg .timer b{font-size:26px;display:block;letter-spacing:1px}',
    '.sg .timer .sc{font-size:15px;opacity:.95}',
    '.sg .timer .lead{font-size:12px;opacity:.75}',
    '.sg .slots{left:8px;top:160px;display:flex;flex-direction:column;gap:3px}',
    '.sg .slot{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.2);padding:3px 8px;border-radius:5px;font-size:12px;min-width:110px}',
    '.sg .slot.on{background:rgba(220,40,50,.55);border-color:#ff8a8a}',
    '.sg .radar{left:8px;top:8px;width:140px;height:140px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.35);border-radius:6px}',
    '.sg .feed{right:8px;top:8px;text-align:right;font-size:13px;text-shadow:0 1px 2px #000}',
    '.sg .feed div{background:rgba(0,0,0,.45);padding:2px 8px;margin-bottom:3px;border-radius:5px}',
    '.sg .hp{left:12px;bottom:12px;font-size:12px}',
    '.sg .hp .n{font-size:30px;font-weight:800;text-shadow:0 1px 3px #000}',
    '.sg .bar{width:190px;height:11px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.25);margin-top:3px;border-radius:3px;overflow:hidden}',
    '.sg .bar i{display:block;height:100%}',
    '.sg .ammo{right:14px;bottom:12px;text-align:right;text-shadow:0 1px 3px #000}',
    '.sg .ammo .n{font-size:32px;font-weight:800}',
    '.sg .money{color:#fbbf24;font-weight:700;font-size:18px}',
    '.sg .cross{left:50%;top:50%;width:0;height:0}',
    '.sg .cross i{position:absolute;background:#fff;box-shadow:0 0 2px #000}',
    '.sg .hitm{left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;opacity:0;transition:opacity .15s}',
    '.sg .hitm:before,.sg .hitm:after{content:"";position:absolute;left:12px;top:-3px;width:2px;height:32px;background:#fff;transform:rotate(45deg)}',
    '.sg .hitm:after{transform:rotate(-45deg)}',
    '.sg .scope{position:absolute;inset:0;display:none;background:radial-gradient(circle at 50% 50%,transparent 0,transparent 33vh,#000 33.3vh)}',
    '.sg .scope:before{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:#000;margin-top:-1px}',
    '.sg .scope:after{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;background:#000;margin-left:-1px}',
    '.sg .banner{left:50%;top:22%;transform:translateX(-50%);font-size:28px;font-weight:800;text-shadow:0 2px 6px #000;text-align:center;opacity:0;transition:opacity .3s}',
    '.sg .hint{left:50%;bottom:90px;transform:translateX(-50%);font-size:15px;text-shadow:0 1px 3px #000;background:rgba(0,0,0,.45);padding:5px 12px;border-radius:8px;display:none}',
    '.sg .prog{left:50%;bottom:140px;transform:translateX(-50%);width:240px;height:14px;background:rgba(0,0,0,.6);border:1px solid #fff;display:none}',
    '.sg .prog i{display:block;height:100%;background:#f59e0b}',
    '.sg .fx{inset:0;position:absolute;pointer-events:none}',
    '.sg .spec{left:50%;bottom:30px;transform:translateX(-50%);background:rgba(0,0,0,.55);padding:6px 14px;border-radius:8px;display:none}',
    '.sg .modal{position:absolute;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;pointer-events:auto;z-index:5}',
    '.sg .panel{background:#111827;border:1px solid #374151;border-radius:14px;padding:16px;max-width:96vw;max-height:92vh;overflow:auto}',
    '.sg .btn{background:#2563eb;color:#fff;border:0;border-radius:10px;padding:10px 16px;font-size:15px;font-weight:600;cursor:pointer;pointer-events:auto}',
    '.sg .btn.r{background:#dc2626}.sg .btn.g{background:#16a34a}',
    '.sg .buy{display:none;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;width:min(980px,96vw)}',
    '.sg .buy h4{margin:0 0 6px;font-size:13px;color:#fbbf24}',
    '.sg .bi{display:flex;justify-content:space-between;gap:6px;padding:6px 8px;border-radius:7px;background:#1f2937;margin-bottom:4px;cursor:pointer;font-size:13px}',
    '.sg .bi:hover{background:#374151}.sg .bi.no{opacity:.4}.sg .bi small{opacity:.7}',
    '.sg table{border-collapse:collapse;width:100%;font-size:13px}.sg td,.sg th{padding:3px 8px;text-align:left}',
    '.sg .tabT{color:#f6ad55}.sg .tabC{color:#7cb7ff}',
    '.sg .tc{position:absolute;pointer-events:auto;touch-action:none}',
    '.sg .tb{position:absolute;pointer-events:auto;width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.45);display:flex;align-items:center;justify-content:center;font-size:22px;touch-action:none}'
  ].join('');
  document.head.appendChild(css);

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(n) { return Math.floor(n).toLocaleString('ru-RU'); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  var BUY_GROUPS = [
    ['Пистолеты', ['Пистолеты']], ['Дробовики', ['Дробовики']], ['Пистолеты-пулемёты', ['Пистолеты-пулемёты']],
    ['Автоматы и пулемёты', ['Автоматы', 'Пулемёты']], ['Снайперки', ['Снайперки']], ['Гранатомёты', ['Гранатомёты']], ['Ножи', ['Ножи']], ['Снаряжение', ['Гранаты и снаряжение', 'EQ']]
  ];

  /* =============================== Game =============================== */
  function Game(cfg) {
    this.cfg = cfg; this.root = cfg.root; this.map = MP.maps[cfg.mapId]; this.opts = cfg.opts;
    this.allowed = cfg.opts.allowed; this.skin = cfg.opts.skin || 'camo';
    this.mobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 1;
    this.keys = {}; this.pl = {}; this.roster = {}; this.time = 0; this.last = performance.now();
    this.ph = 0; this.tm = 0; this.sc = [0, 0]; this.rn = 0; this.bomb = [0, 0, 0, 0, 0, 0, 0, 0]; this.dead = false;
    this.stats = { k: 0, hs: 0, rw: 0, pl: 0, df: 0, sec: 0 };
    this.feedItems = []; this.tracers = []; this.decals = []; this.booms = []; this.smokes = []; this.projM = {}; this.flashT = 0; this.hurtT = 0; this.shake = 0;
    var m = this.me = {
      id: cfg.myId, team: 'T', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, og: true, cr: 0, yaw: 0, pitch: 0, hp: 100, armor: 0, alive: false, money: 0,
      inv: { p: null, s: null, k: 'knife', g: [], bomb: 0 }, helm: 0, kit: 0, wid: 'knife', lastWid: 'knife', ammo: {}, reload: 0, reloadT: 0, nextFire: 0, spray: 0,
      punchP: 0, punchY: 0, scope: 0, draw: 0, needSync: true, eyeH: 1.62, gIdx: 0, k: 0, d: 0, speed: 0, sendT: 0, wasAlive: false, bobT: 0, specId: 0, mouseL: false, mouseR: false, clicked: false, bk: 0
    };
    this.buildDom(); this.buildScene(); this.buildMap(); this.bindInput();
    if (!this.dead) this.selectWeapon('knife', true);
  }
  G.Game = Game;
  var P = Game.prototype;

  P.buildDom = function () {
    var r = this.root; r.className = 'sg';
    r.innerHTML = '<canvas class="sgc"></canvas><div class="scope"></div><div class="fx" id="fxFlash" style="background:#fff;opacity:0"></div><div class="fx" id="fxHurt" style="box-shadow:inset 0 0 120px 40px #d00;opacity:0"></div>' +
      '<div class="hud">' +
      '<canvas class="abs radar" width="140" height="140"></canvas>' +
      '<div class="abs slots"></div>' +
      '<div class="abs timer"><b class="tt">0:00</b><div class="sc"></div><div class="lead"></div></div>' +
      '<div class="abs feed"></div>' +
      '<div class="abs hp"><span class="n hpn">100</span> ❤ <span class="arn"></span><div class="bar"><i class="hpb" style="background:#4ade80;width:100%"></i></div><div class="bar" style="height:7px"><i class="arb" style="background:#60a5fa;width:0"></i></div></div>' +
      '<div class="abs ammo"><div class="money mny"></div><div class="n amn"></div><div class="wn" style="font-size:12px;opacity:.85"></div></div>' +
      '<div class="abs cross"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i></div><div class="abs hitm"></div>' +
      '<div class="abs banner"></div><div class="abs hint"></div><div class="abs prog"><i></i></div><div class="abs spec"></div>' +
      '</div>' +
      '<div class="modal buyM"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>🛒 Магазин</b><span class="money buyMoney"></span><button class="btn r buyX" style="padding:6px 12px">✕</button></div><div class="buy"></div></div></div>' +
      '<div class="modal scoreM"><div class="panel" style="min-width:min(640px,94vw)"><div class="scoreB"></div></div></div>' +
      '<div class="modal pauseM"><div class="panel" style="text-align:center"><h3 style="margin:0 0 10px">Пауза</h3><p style="opacity:.8;margin:0 0 12px">WASD — ходьба, мышь — обзор, ЛКМ — огонь, ПКМ — прицел,<br>R — перезарядка, B — магазин, E — бомба, 1-4 — оружие, Tab — таблица, Ctrl — присесть</p><button class="btn g pauseGo">Продолжить</button> <button class="btn r pauseExit">Выйти из матча</button></div></div>' +
      '<div class="modal endM"><div class="panel" style="min-width:min(560px,94vw)"><div class="endB"></div><div style="text-align:center;margin-top:12px"><button class="btn endExit">В меню</button></div></div></div>';
    this.cv = r.querySelector('.sgc');
    this.q = function (s) { return r.querySelector(s); };
    this.hudSlots = this.q('.slots'); this.radar = this.q('.radar'); this.rctx = this.radar.getContext('2d');
    var self = this;
    this.q('.buyX').onclick = function () { self.toggleBuy(false); };
    this.q('.pauseGo').onclick = function () { self.resume(); };
    this.q('.pauseExit').onclick = function () { self.leave(); };
    this.q('.endExit').onclick = function () { self.leave(); };
    this.q('.buyM').addEventListener('click', function (e) { if (e.target === this) self.toggleBuy(false); });
    if (this.mobile) this.buildTouch();
  };

  P.buildScene = function () {
    var cv = this.cv, ren;
    try { ren = this.ren = new T.WebGLRenderer({ canvas: cv, antialias: !this.mobile, powerPreference: 'high-performance' }); } catch (e) { this.cfg.onExit('Не удалось включить 3D (WebGL)'); this.dead = true; return; }
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 1.75));
    ren.autoClear = false;
    var sc = this.scene = new T.Scene(), mp = this.map;
    sc.background = new T.Color(mp.sky); sc.fog = new T.Fog(mp.fog, 70, 220);
    this.cam = new T.PerspectiveCamera(75, 1, 0.05, 400); this.cam.rotation.order = 'YXZ';
    sc.add(new T.AmbientLight(0xffffff, 0.62));
    sc.add(new T.HemisphereLight(0xdfeeff, 0x8a7a5a, 0.5));
    var dl = new T.DirectionalLight(0xfff0d8, 0.75); dl.position.set(-30, 60, 25); sc.add(dl);
    this.vmScene = new T.Scene(); this.vmCam = new T.PerspectiveCamera(58, 1, 0.01, 5);
    this.vmScene.add(new T.AmbientLight(0xffffff, 0.85)); var vd = new T.DirectionalLight(0xffffff, 0.7); vd.position.set(0.5, 1, 0.8); this.vmScene.add(vd);
    this.mats = GFX.makeMats(this.skin);
    this.vmHolder = new T.Group(); this.vmScene.add(this.vmHolder);
    this.vmCache = {};
    this.flashMesh = new T.Group();
    var f1 = new T.Mesh(new T.PlaneGeometry(0.16, 0.16), this.mats.flash), f2 = f1.clone(); f2.rotation.z = Math.PI / 4; this.flashMesh.add(f1); this.flashMesh.add(f2); this.flashMesh.visible = false;
    this.resize(); var self = this; this._rs = function () { self.resize(); }; window.addEventListener('resize', this._rs);
    // сферы взрывов, трассеры
    for (var i = 0; i < 24; i++) {
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 0, 0, 1], 3));
      var ln = new T.Line(g, new T.LineBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9 })); ln.visible = false; ln.frustumCulled = false; sc.add(ln); this.tracers.push({ m: ln, t: 0 });
    }
    this.bombMesh = new T.Group();
    var bb = new T.Mesh(new T.BoxGeometry(0.4, 0.18, 0.28), new T.MeshLambertMaterial({ color: 0x2a2f2a })); bb.position.y = 0.09; this.bombMesh.add(bb);
    this.led = new T.Mesh(new T.BoxGeometry(0.06, 0.03, 0.06), new T.MeshBasicMaterial({ color: 0xff2020 })); this.led.position.set(0.1, 0.2, 0); this.bombMesh.add(this.led);
    this.bombMesh.visible = false; sc.add(this.bombMesh);
  };
  P.resize = function () {
    if (!this.ren) return;
    var w = this.root.clientWidth || window.innerWidth, h = this.root.clientHeight || window.innerHeight;
    this.ren.setSize(w, h, false); this.aspect = w / h;
    this.cam.aspect = this.aspect; this.cam.updateProjectionMatrix(); this.vmCam.aspect = this.aspect; this.vmCam.updateProjectionMatrix();
  };

  P.buildMap = function () {
    if (this.dead) return;
    var mp = this.map, sc = this.scene, t = {};
    var wallT = GFX.noiseTex(mp.wall, 28, 128, 128, true), floorT = GFX.noiseTex(mp.floor, 34, 128, 128, false);
    wallT.encoding = floorT.encoding = T.sRGBEncoding;
    t.wall = new T.MeshLambertMaterial({ map: wallT });
    t.stone = new T.MeshLambertMaterial({ map: GFX.noiseTex('#9a9588', 30, 128, 128, true) });
    t.crate = new T.MeshLambertMaterial({ map: GFX.crateTex(mp.crate) });
    t.metal = new T.MeshLambertMaterial({ map: GFX.noiseTex(mp.metal, 22, 128, 128, false) });
    t.wood = t.crate; t.dark = t.wall; t.water = t.metal;
    floorT.repeat.set(mp.w / 6, mp.d / 6);
    var fl = new T.Mesh(new T.PlaneGeometry(mp.w + 60, mp.d + 60), new T.MeshLambertMaterial({ map: floorT })); fl.rotation.x = -Math.PI / 2; fl.position.set(mp.w / 2, 0, mp.d / 2);
    floorT.repeat.set((mp.w + 60) / 6, (mp.d + 60) / 6); sc.add(fl);
    mp.boxes.forEach(function (b) {
      var w = b.x1 - b.x0, d = b.z1 - b.z0, h = b.h;
      var m = new T.Mesh(GFX.boxGeo(w, h, d, 4), t[b.mat] || t.wall);
      m.position.set((b.x0 + b.x1) / 2, b.y0 + h / 2, (b.z0 + b.z1) / 2); sc.add(m);
    });
    (mp.sites || []).forEach(function (s) {
      var ring = new T.Mesh(new T.RingGeometry(s.r - 0.35, s.r, 40), new T.MeshBasicMaterial({ color: 0xd9482a, transparent: true, opacity: 0.45, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(s.x, 0.04, s.z); sc.add(ring);
      var lt = new T.Mesh(new T.PlaneGeometry(4.5, 4.5), new T.MeshBasicMaterial({ map: GFX.siteTex(s.n), transparent: true, depthWrite: false }));
      lt.rotation.x = -Math.PI / 2; lt.position.set(s.x, 0.05, s.z); sc.add(lt);
    });
    // радар: статический слой
    var rc = document.createElement('canvas'); rc.width = rc.height = 140; var x = rc.getContext('2d');
    this.rsc = 140 / Math.max(mp.w, mp.d);
    mp.boxes.forEach(function (b) { if (b.x0 < 0 || b.z0 < 0 || b.x1 > mp.w || b.z1 > mp.d) return; x.fillStyle = b.h > 3 ? '#8a8f98' : '#555b64'; x.fillRect(b.x0 * this.rsc, (mp.d - b.z1) * this.rsc, (b.x1 - b.x0) * this.rsc, (b.z1 - b.z0) * this.rsc); }, this);
    (mp.sites || []).forEach(function (s) { x.fillStyle = '#ff6b4a'; x.font = 'bold 13px Arial'; x.textAlign = 'center'; x.fillText(s.n, s.x * this.rsc, (mp.d - s.z) * this.rsc + 5); }, this);
    this.radarBase = rc;
  };

  /* ---------------------- ввод ---------------------- */
  P.bindInput = function () {
    var self = this, me = this.me;
    this._kd = function (e) {
      if (self.dead) return;
      var k = e.code;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'F1'].indexOf(k) >= 0) e.preventDefault();
      if (e.repeat) return;
      self.keys[k] = true;
      if (self.ended) return;
      if (self.buyOpen && /^Digit[1-8]$/.test(k)) { self.buyKey(+k.slice(5)); return; }
      if (k === 'KeyB') self.toggleBuy();
      else if (k === 'Tab') self.showScore(true);
      else if (k === 'KeyR') self.reload();
      else if (k === 'Digit1') self.selectSlot(1); else if (k === 'Digit2') self.selectSlot(2); else if (k === 'Digit3') self.selectSlot(3); else if (k === 'Digit4') self.selectSlot(4);
      else if (k === 'KeyQ') self.selectWeapon(me.lastWid);
      else if (k === 'KeyE') self.cfg.send({ t: 'use', on: 1 });
      else if (k === 'Escape') { if (self.buyOpen) self.toggleBuy(false); }
    };
    this._ku = function (e) {
      var k = e.code; self.keys[k] = false;
      if (k === 'Tab') self.showScore(false);
      if (k === 'KeyE') self.cfg.send({ t: 'use', on: 0 });
    };
    this._mm = function (e) {
      if (!self.locked() || self.dead) return;
     var s = 0.0022 * (me.scope ? (me.scope === 1 ? 0.55 : 0.25) : 1) * (1 - 0.3 * (me.ads || 0)) * (self.cfg.sens || 1);
      me.yaw -= e.movementX * s; me.pitch = clamp(me.pitch - e.movementY * s, -1.45, 1.45);
    };
    this._md = function (e) {
      if (self.dead || self.mobile) return;
            if (e.target && e.target.closest && e.target.closest('.btn,.bi,.modal .panel')) return;
      if (!self.locked() && !self.buyOpen && !self.ended && self.cv) { self.resume(); return; }
      if (e.button === 0) { me.mouseL = true; me.clicked = true; } else if (e.button === 2) { me.mouseR = true; self.rightClick(); }
    };
    this._mu = function (e) { if (e.button === 0) me.mouseL = false; else if (e.button === 2) me.mouseR = false; };
    this._wh = function (e) { if (self.dead || !self.locked()) return; self.cycleWeapon(e.deltaY > 0 ? 1 : -1); };
    this._cm = function (e) { e.preventDefault(); };
    this._lc = function () { if (!self.locked() && !self.buyOpen && !self.ended && !self.dead && !self.mobile && self.started) self.q('.pauseM').style.display = 'flex'; else self.q('.pauseM').style.display = 'none'; };
    this._vis = function () { if (document.hidden) { self.keys = {}; me.mouseL = me.mouseR = false; } };
    window.addEventListener('keydown', this._kd); window.addEventListener('keyup', this._ku);
    document.addEventListener('mousemove', this._mm); window.addEventListener('mousedown', this._md); window.addEventListener('mouseup', this._mu);
    window.addEventListener('wheel', this._wh, { passive: true }); this.root.addEventListener('contextmenu', this._cm);
    document.addEventListener('pointerlockchange', this._lc); document.addEventListener('visibilitychange', this._vis);
  };
  P.unbindInput = function () {
    window.removeEventListener('keydown', this._kd); window.removeEventListener('keyup', this._ku);
    document.removeEventListener('mousemove', this._mm); window.removeEventListener('mousedown', this._md); window.removeEventListener('mouseup', this._mu);
    window.removeEventListener('wheel', this._wh); this.root.removeEventListener('contextmenu', this._cm);
    document.removeEventListener('pointerlockchange', this._lc); document.removeEventListener('visibilitychange', this._vis);
    window.removeEventListener('resize', this._rs);
  };
  P.locked = function () { return document.pointerLockElement === this.cv; };
  P.resume = function () {
    GFX.audioInit();
    if (this.mobile) return;
    try { var p = this.cv.requestPointerLock(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    this.q('.pauseM').style.display = 'none';
  };

  /* ---------------------- оружие ---------------------- */
  P.owned = function (id) { var v = this.me.inv; return id && (v.p === id || v.s === id || v.k === id || v.g.indexOf(id) >= 0); };
  P.vmFor = function (id) {
    var w = W[id], key = w.model;
    if (!this.vmCache[key]) { var v = GFX.buildVM(w.model, this.mats); this.vmCache[key] = v; this.vmHolder.add(v.g); v.g.visible = false; }
    return this.vmCache[key];
  };
  P.selectWeapon = function (id, force) {
    var me = this.me;
    if (!id || (!force && !this.owned(id))) return;
    if (!force && id === me.wid) return;
    if (!force) me.lastWid = me.wid;
    me.wid = id; me.reload = 0; me.scope = 0; me.draw = 0.4; me.nextFire = this.time + 0.35; me.clicked = false;
    var w = W[id], a = me.ammo[id];
    if (!a && w.mag > 0) me.ammo[id] = { mag: w.mag, res: w.res };
    for (var k in this.vmCache) this.vmCache[k].g.visible = false;
    var v = this.curVM = this.vmFor(id); v.g.visible = true;
    v.muzzle.add(this.flashMesh); this.flashMesh.visible = false;
    GFX.snd('click', 0.6);
  };
  P.selectSlot = function (n) {
    var me = this.me, v = me.inv;
    if (!me.alive) return;
    if (n === 1 && v.p) this.selectWeapon(v.p);
    else if (n === 2 && v.s) this.selectWeapon(v.s);
    else if (n === 3) this.selectWeapon(v.k);
    else if (n === 4 && v.g.length) { var cur = v.g.indexOf(me.wid); me.gIdx = cur >= 0 ? (cur + 1) % v.g.length : 0; this.selectWeapon(v.g[me.gIdx]); }
  };
  P.cycleWeapon = function (dir) {
    var me = this.me, v = me.inv, list = [v.p, v.s, v.k].concat(v.g).filter(Boolean), i = list.indexOf(me.wid);
    if (!list.length) return; this.selectWeapon(list[(i + dir + list.length) % list.length]);
  };
  P.reload = function () {
    var me = this.me, w = W[me.wid], a = me.ammo[me.wid];
    if (!me.alive || !a || me.reload > 0 || a.mag >= w.mag || a.res <= 0 || w.slot >= 3) return;
    me.reload = w.rel; me.reloadT = w.rel; me.scope = 0; GFX.snd('reload', 0.8);
  };
  P.rightClick = function () {
    var me = this.me, w = W[me.wid];
    if (!me.alive) { this.spectateNext(); return; }
    if (w.scope) { me.scope = (me.scope + 1) % (w.scope + 1); GFX.snd('click', 0.5); }
    else if (w.slot === 3) me.altNow = true;
  };
   P.adsOk = function (w) { return w.slot <= 2 && !w.scope && /^(pistol|smg|rifle|mg|shotgun)$/.test(w.model); };
  P.spread = function (w) {
    var me = this.me, sp = Math.hypot(me.vx, me.vz), s = w.spread + sp * 0.22 + me.spray * 0.14;
    if (!me.og) s += 3.5;
    if (me.cr && sp < 1) s *= 0.65;
    if (w.model === 'sniper' && !me.scope) s += 5;
      if (me.scope && sp < 1) s *= 0.15;
    if (me.ads) s *= 1 - 0.45 * me.ads;
    return s;
  };  P.tryFire = function (dt) {
    var me = this.me, w = W[me.wid], t = this.time;
    if (!me.alive || this.ph === 3 || this.ph === 0 && this.ph !== 1 && false) return;
    if (this.ph === 0 && this.opts.mode !== 'dm') return; // заморозка
    var want = me.mouseL || me.altNow;
    if (!want) return;
    if (t < me.nextFire || me.draw > 0.12) return;
    var alt = !!me.altNow;
    if (w.slot === 3) {
      if (!me.mouseL && !alt) return;
      if (w.id === 'bknife' && alt) { var a0 = me.ammo.bknife; if (!a0 || a0.mag < 1) { me.altNow = false; return; } a0.mag = 0; setTimeout(function () { var q = me.ammo.bknife; if (q) q.mag = 1; }, 4000); }
      var d = this.aimDir(0);
      this.cfgSend({ t: 'fire', wid: me.wid, dx: d[0], dy: d[1], dz: d[2], alt: alt ? 1 : 0 });
      me.nextFire = t + 60 / w.rpm * (alt ? 1.6 : 1); this.vmStab = 1; me.altNow = false; me.clicked = false;
      GFX.snd(w.model === 'bknife' ? 'bknife' : 'knife', 0.6);
      return;
    }
    if (w.slot === 4) {
      var dd = this.aimDir(0);
      this.cfgSend({ t: 'fire', wid: me.wid, dx: dd[0], dy: dd[1], dz: dd[2] });
      me.inv.g.splice(me.inv.g.indexOf(me.wid), 1); me.nextFire = t + 1; me.clicked = false; GFX.snd('throw', 0.8);
      var nxt = me.inv.g[0] || me.inv.p || me.inv.s || me.inv.k; this.selectWeapon(nxt, true); me.lastWid = me.inv.p || me.inv.s || me.inv.k;
      return;
    }
    var a = me.ammo[me.wid];
    if (!a) return;
    if (me.reload > 0) return;
    if (!w.auto && !me.clicked) return;
    if (!me.mouseL) return;
    if (a.mag <= 0) { if (a.res > 0) this.reload(); else { GFX.snd('click', 0.7); me.nextFire = t + 0.3; } me.clicked = false; return; }
    a.mag--; me.clicked = false;
    me.nextFire = t + 60 / w.rpm + (w.model === 'sniper' && w.auto === false ? 0.25 : 0);
    var sp = this.spread(w) * D2R, d2 = this.aimDir(sp);
    this.cfgSend({ t: 'fire', wid: me.wid, dx: d2[0], dy: d2[1], dz: d2[2] });
    // отдача
    me.spray = Math.min(14, me.spray + 1);
    me.punchP += w.rec * 0.0105 * (1 + Math.min(me.spray, 10) * 0.07) * (me.scope ? 1.4 : 1) * (1 - 0.3 * (me.ads || 0));
    me.punchY += (Math.random() - 0.5) * w.rec * 0.008;
    me.punchP = Math.min(me.punchP, 0.22);
    this.vmKick = 1; this.flashT = 0.045; this.flashMesh.visible = true; this.flashMesh.rotation.z = Math.random() * 3; this.shake += w.rec * 0.0015;
    GFX.snd(w.model, 1);
    // свой трассер сразу
    var eye = this.eyePos(), org = [eye[0] + d2[0] * 0.6 + Math.cos(me.yaw) * 0.18, eye[1] - 0.14, eye[2] + d2[2] * 0.6 - Math.sin(me.yaw) * 0.18];
    var tw = S.rayWorld(this.map, eye[0], eye[1], eye[2], d2[0], d2[1], d2[2], 120);
    if (!w.proj) this.addTracer(org, [eye[0] + d2[0] * tw, eye[1] + d2[1] * tw, eye[2] + d2[2] * tw], 0.06);
    if (a.mag <= 0 && a.res > 0) setTimeout(function () { }, 0);
  };
  P.cfgSend = function (m) { this.cfg.send(m); };
  P.aimDir = function (spreadRad) {
    var me = this.me, yaw = me.yaw + me.punchY, pit = me.pitch + me.punchP;
    if (spreadRad > 0) { var r = spreadRad * Math.sqrt(Math.random()), th = Math.random() * 6.2832; yaw += r * Math.cos(th); pit += r * Math.sin(th); }
    return S.dirFromYaw(yaw, pit);
  };
  P.eyePos = function () { var me = this.me; return [me.x, me.y + me.eyeH, me.z]; };
  P.addTracer = function (a, b, life) {
    for (var i = 0; i < this.tracers.length; i++) {
      var tr = this.tracers[i]; if (tr.t > 0) continue;
      var p = tr.m.geometry.attributes.position; p.setXYZ(0, a[0], a[1], a[2]); p.setXYZ(1, b[0], b[1], b[2]); p.needsUpdate = true; tr.m.visible = true; tr.t = life || 0.06; tr.max = tr.t; return;
    }
  };
  P.addDecal = function (x, y, z, nx, ny, nz) {
    var m = GFX.hitSprite(); m.position.set(x + nx * 0.02, y + ny * 0.02, z + nz * 0.02); m.lookAt(x + nx, y + ny, z + nz); this.scene.add(m); this.decals.push(m);
    if (this.decals.length > 50) { var o = this.decals.shift(); this.scene.remove(o); }
  };

  /* ---------------------- покупки ---------------------- */
  P.buyList = function () {
    var out = [], self = this, me = this.me, tm = me.team;
    BUY_GROUPS.forEach(function (g) {
      var items = [];
      g[1].forEach(function (grp) {
        if (grp === 'EQ') { Object.keys(window.MXW.EQ).forEach(function (id) { var e = window.MXW.EQ[id]; if (!e.team || e.team === tm) items.push({ id: id, n: e.n, price: e.price }); }); }
        else window.MXW.GROUPS.forEach(function (gr) { if (gr.n === grp) gr.ids.forEach(function (id) { var w = W[id]; if (!self.allowed[id] || w.slot === 3 && id === 'knife') return; if (w.team && w.team !== tm) return; items.push({ id: id, n: w.n, price: w.price }); }); });
      });
      if (items.length) out.push({ n: g[0], items: items });
    });
    return out;
  };
  P.toggleBuy = function (on) {
    var me = this.me, m = this.q('.buyM');
    if (on === undefined) on = !this.buyOpen;
    if (on && (this.ended || !me.alive)) return;
    this.buyOpen = on; this.buyGrp = 0;
    m.style.display = on ? 'flex' : 'none';
    if (on) { if (document.exitPointerLock) document.exitPointerLock(); this.renderBuy(); } else if (!this.mobile) this.resume();
  };
  P.renderBuy = function () {
    var me = this.me, self = this, box = this.q('.buy'), list = this.buyList(); this.buyData = list;
    box.style.display = 'grid'; this.q('.buyMoney').textContent = '$' + fmt(me.money);
    box.innerHTML = '';
    list.forEach(function (g, gi) {
      var c = el('div', '', '<h4>' + (gi + 1) + '. ' + g.n + '</h4>');
      g.items.forEach(function (it, ii) {
        var d = el('div', 'bi' + (me.money < it.price ? ' no' : ''), '<span>' + it.n + '</span><small>$' + fmt(it.price) + '</small>');
        d.onclick = function () { self.buy(it.id); };
        c.appendChild(d);
      });
      box.appendChild(c);
    });
  };
  P.buyKey = function (n) {
    var list = this.buyData || [];
    if (!this.buyGrp) { if (list[n - 1]) { this.buyGrp = n; this.hintBuy(list[n - 1]); } }
    else { var g = list[this.buyGrp - 1]; var it = g && g.items[n - 1]; if (it) this.buy(it.id); this.buyGrp = 0; this.renderBuy(); }
  };
  P.hintBuy = function (g) {
    var box = this.q('.buy'); box.innerHTML = '<div style="grid-column:1/-1"><h4>' + g.n + ' — нажми цифру</h4></div>';
    var self = this, c = el('div'); g.items.forEach(function (it, i) { var d = el('div', 'bi' + (self.me.money < it.price ? ' no' : ''), '<span>' + (i + 1) + '. ' + it.n + '</span><small>$' + fmt(it.price) + '</small>'); d.onclick = function () { self.buy(it.id); self.buyGrp = 0; self.renderBuy(); }; c.appendChild(d); }); box.appendChild(c);
  };
  P.buy = function (id) { this.cfgSend({ t: 'buy', id: id }); GFX.snd('buy', 0.6); };

  /* ---------------------- сообщения от хозяина ---------------------- */
  P.start = function () {
    if (this.dead) return;
    this.started = true; this.last = performance.now(); var self = this;
    this.raf = requestAnimationFrame(function f() { if (self.dead) return; self.raf = requestAnimationFrame(f); self.frame(); });
    this.resume();
    var gm = this; setTimeout(function () { if (!gm.dead && !gm.mobile && !gm.locked()) gm.q('.pauseM').style.display = 'flex'; }, 500);
    this.banner('Раунд готовится…', 1500);
  };
  P.onMsg = function (m) {
    if (this.dead) return;
    switch (m.t) {
      case 'pk': if (m.e) for (var i = 0; i < m.e.length; i++) this.onEvent(m.e[i]); if (m.s) this.applySnap(m.s); break;
      case 'inv': this.applyInv(m); break;
      case 'hurt': this.me.hp = m.hp; this.me.armor = m.ar; this.hurtT = 0.6; GFX.snd('hurt', 0.8); if (m.from) this.lastHurtFrom = m.from; break;
      case 'hit': this.q('.hitm').style.opacity = 1; var hm = this.q('.hitm'); setTimeout(function () { hm.style.opacity = 0; }, 120); GFX.snd(m.hs ? 'hs' : 'hit', 0.7); break;
      case 'msg': this.banner(m.m, 1400, true); break;
    }
  };
  P.applyInv = function (m) {
    var me = this.me, v = me.inv;
    v.p = m.p; v.s = m.s; v.k = m.k; v.g = m.g || []; v.bomb = m.bomb; me.armor = m.armor; me.helm = m.helm; me.kit = m.kit; me.money = m.money;
    var own = [v.p, v.s, v.k].concat(v.g).filter(Boolean), self = this;
    own.forEach(function (id) { if (!me.ammo[id] && W[id].mag > 0) me.ammo[id] = { mag: W[id].mag, res: W[id].res }; });
    Object.keys(me.ammo).forEach(function (id) { if (own.indexOf(id) < 0) delete me.ammo[id]; });
    if (!this.owned(me.wid) || (m.wid && m.wid !== me.wid && !me.alive)) this.selectWeapon(m.wid && this.owned(m.wid) ? m.wid : (v.p || v.s || v.k), true);
    if (this.buyOpen) this.renderBuy();
  };
  P.getPl = function (id) {
    var p = this.pl[id];
    if (p) return p;
    var r = this.roster[id] || {};
    p = this.pl[id] = { id: id, name: r.n || ('Игрок ' + id), team: r.tm === 'CT' ? 1 : 0, bot: r.b, x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, yaw: 0, pitch: 0, hp: 100, armor: 0, alive: false, cr: 0, wid: 'knife', money: 0, k: 0, d: 0, sp: 0, mesh: null, ph: 0, first: true, look: GFX.randLook() };
  };
  P.mkMesh = function (p) {
    var h = GFX.humanoid(p.team, this.skin === 'camo', p.look); p.mesh = h; this.scene.add(h.g);
    p.gunWid = null; p.lastTeam = p.team;
    if (p.team === this.me.teamIdx || this.opts.mode === 'dm') { }
    p.label = new T.Sprite(new T.SpriteMaterial({ map: GFX.labelTex(p.name, p.team === 0 ? '#ffb86b' : '#8ec5ff'), transparent: true, depthTest: false }));
    p.label.scale.set(1.8, 0.45, 1); p.label.position.set(0, 2.15, 0); p.label.renderOrder = 10; h.g.add(p.label);
  };
  P.applySnap = function (s) {
    var me = this.me, seen = {};
    this.ph = s.ph; this.tm = s.tm; this.sc = s.sc; this.rn = s.rn; this.bomb = s.b; this.winner = s.win;
    for (var i = 0; i < s.p.length; i++) {
      var e = s.p[i], id = e[0], p = this.getPl(id); seen[id] = 1;
      p.tx = e[1]; p.ty = e[2]; p.tz = e[3]; p.yawT = e[4]; p.pitch = e[5]; p.hp = e[6]; p.armor = e[7]; var wasA = p.alive; p.alive = !!e[8]; p.cr = e[9]; p.wid = e[10]; p.money = e[11]; p.k = e[12]; p.d = e[13]; p.team = e[14]; p.sp = e[15];
      if (p.first) { p.x = p.tx; p.y = p.ty; p.z = p.tz; p.yaw = p.yawT; p.first = false; }
      if (p.mesh && p.lastTeam !== p.team) { this.scene.remove(p.mesh.g); p.mesh = null; }
      if (!wasA && p.alive) { p.x = p.tx; p.y = p.ty; p.z = p.tz; p.yaw = p.yawT; }
      if (id === me.id) {
        me.team = p.team === 0 ? 'T' : 'CT'; me.teamIdx = p.team; me.hp = p.hp; me.armor = p.armor; me.money = p.money; me.k = p.k; me.d = p.d;
        if (p.alive && (!me.alive || me.needSync)) { // воскресли / новый раунд — телепортируемся на точку
          me.x = p.tx; me.y = p.ty; me.z = p.tz; me.vx = me.vy = me.vz = 0; me.og = true; me.yaw = p.yawT; me.pitch = 0; me.needSync = false; me.cr = 0;
          if (!me.alive) { Object.keys(me.ammo).forEach(function (k) { me.ammo[k] = { mag: W[k].mag, res: W[k].res }; }); }
          me.punchP = me.punchY = 0; me.spray = 0; me.reload = 0; me.scope = 0;
        }
        if (me.alive && !p.alive) this.onMyDeath();
        me.alive = p.alive;
      }
    }
    for (var k in this.pl) if (!seen[k]) { var o = this.pl[k]; if (o.mesh) this.scene.remove(o.mesh.g); delete this.pl[k]; }
    // снаряды
    var pr = s.pr, have = {};
    for (var j = 0; j < pr.length; j++) {
      var a = pr[j], m = this.projM[a[0]]; have[a[0]] = 1;
      if (!m) {
        var kind = a[1], g;
        if (kind === 'rocket') { g = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.5, 8), new T.MeshLambertMaterial({ color: 0xcc6622 })); g.rotation.x = Math.PI / 2; }
        else if (kind === 'blade') g = new T.Mesh(new T.BoxGeometry(0.03, 0.08, 0.3), this.mats.blade);
        else g = new T.Mesh(new T.SphereGeometry(kind === 'grenade' ? 0.1 : 0.09, 8, 6), new T.MeshLambertMaterial({ color: kind === 'smoke' ? 0x9aa0a8 : (kind === 'flash' ? 0xeeeeee : (kind === 'grenade' ? 0x44553a : 0x3a4a2a)) }));
        m = this.projM[a[0]] = { mesh: g, px: a[2], py: a[3], pz: a[4] }; this.scene.add(g); g.position.set(a[2], a[3], a[4]);
      }
      m.tx = a[2]; m.ty = a[3]; m.tz = a[4];
    }
    for (var q in this.projM) if (!have[q]) { this.scene.remove(this.projM[q].mesh); delete this.projM[q]; }
  };
  P.onMyDeath = function () {
    var me = this.me; me.scope = 0; me.mouseL = false; this.toggleBuy(false); me.specId = 0;
    this.q('.hint').style.display = 'none';
  };
  P.onEvent = function (e) {
    var me = this.me, self = this;
    switch (e.t) {
      case 'roster':
        e.list.forEach(function (r) { self.roster[r.id] = r; var p = self.pl[r.id]; if (p) { p.name = r.n; } });
        break;
      case 'round':
        this.needSyncAll(); this.clearFx(); this.banner('Раунд ' + e.n, 1600); this.sc = e.sc; this.cleanDead();
        break;
      case 'live': GFX.snd('click', 0.6); this.banner('Бой!', 900); break;
      case 'rend':
        this.sc = e.sc;
        var myT = me.team; if (e.w === myT) { this.stats.rw++; GFX.snd('win', 0.8); }
        this.banner((e.w === 'T' ? 'Террористы' : 'Контр-террористы') + ' победили<div style="font-size:16px;font-weight:500">' + e.why + '</div>', 4000);
        break;
      case 'over': this.onOver(e); break;
      case 'shot': this.onShot(e); break;
      case 'stab': if (e.id !== me.id) this.sndAt(this.pl[e.id], 'knife', 0.5); break;
      case 'launch': this.sndAt(this.pl[e.id], W[e.w].model, 0.9); break;
      case 'throw': this.sndAt(this.pl[e.id], 'throw', 0.5); break;
      case 'boom': this.addBoom(e); break;
      case 'smoke': this.addSmoke(e); break;
      case 'flash': this.onFlash(e); break;
      case 'kill': this.onKill(e); break;
      case 'planted': GFX.snd('plant', 1); this.banner('Бомба заложена: ' + e.site, 2500); if (e.id === me.id) this.stats.pl++; break;
      case 'defused': this.banner('Бомба обезврежена', 2500); GFX.snd('plant', 1); if (e.id === me.id) this.stats.df++; break;
      case 'bombdrop': this.addFeed('💣 Бомба упала'); break;
      case 'bombpick': this.addFeed('💣 Бомбу подобрал ' + this.nameOf(e.id)); break;
      case 'left': this.addFeed(e.name + ' вышел'); break;
      case 'start': this.banner('Матч начался', 1500); break;
    }
  };
  P.needSyncAll = function () { this.me.needSync = true; };
  P.nameOf = function (id) { var r = this.roster[id]; return r ? r.n : '?'; };
  P.cleanDead = function () { for (var k in this.pl) { var p = this.pl[k]; if (p.mesh) { p.mesh.g.rotation.z = 0; p.mesh.g.position.y = p.y; } } };
  P.clearFx = function () {
    var self = this;
    this.smokes.forEach(function (s) { self.scene.remove(s.g); }); this.smokes = [];
    this.decals.forEach(function (d) { self.scene.remove(d); }); this.decals = [];
  };
  P.sndAt = function (p, kind, vol) {
    if (!p) return; var me = this.me, d = Math.hypot(p.x - me.x, p.z - me.z);
    GFX.snd(kind, vol * Math.max(0, 1 - d / 70));
  };
  P.onShot = function (e) {
    var me = this.me, p = this.pl[e.id], w = W[e.w]; if (!w) return;
    if (e.id !== me.id) {
      this.addTracer(e.o, e.e, 0.07); this.sndAt(p, w.model, 1);
      if (p && p.mesh) { p.flash = 0.05; }
      if (!e.hp) this.addDecal(e.e[0], e.e[1], e.e[2], 0, 1, 0);
    } else if (!e.hp) {
      var dd = [e.e[0] - e.o[0], e.e[1] - e.o[1], e.e[2] - e.o[2]], l = Math.hypot(dd[0], dd[1], dd[2]) || 1;
      this.addDecal(e.e[0] - dd[0] / l * 0.02, e.e[1], e.e[2] - dd[2] / l * 0.02, -dd[0] / l, -dd[1] / l, -dd[2] / l);
    }
  };
  P.addBoom = function (e) {
    var m = new T.Mesh(new T.SphereGeometry(1, 14, 10), new T.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0.9, depthWrite: false }));
    m.position.set(e.x, e.y, e.z); this.scene.add(m); this.booms.push({ m: m, t: 0, r: Math.min(e.r, e.k === 'c4' ? 20 : e.r) });
    var me = this.me, d = Math.hypot(e.x - me.x, e.z - me.z); GFX.snd(e.k === 'c4' ? 'c4' : 'boom', Math.max(0.15, 1 - d / 90));
    if (d < 25) this.shake += (1 - d / 25) * 0.05;
  };
  P.addSmoke = function (e) {
    var g = new T.Group();
    for (var i = 0; i < 9; i++) { var s = new T.Mesh(new T.SphereGeometry(rnd(1.6, 2.4), 10, 8), new T.MeshBasicMaterial({ color: 0xcfd3d8, transparent: true, opacity: 0.88, depthWrite: false })); s.position.set(rnd(-1.4, 1.4), rnd(0.6, 2.4), rnd(-1.4, 1.4)); g.add(s); }
    g.position.set(e.x, Math.max(0.1, e.y - 0.5), e.z); this.scene.add(g); this.smokes.push({ g: g, t: 18 });
  };
  P.onFlash = function (e) {
    var me = this.me; if (!me.alive) return;
    var dx = e.x - me.x, dy = e.y - (me.y + me.eyeH), dz = e.z - me.z, d = Math.hypot(dx, dy, dz);
    if (d > 40) return;
    var tw = S.rayWorld(this.map, me.x, me.y + me.eyeH, me.z, dx / d, dy / d, dz / d, d);
    if (tw < d - 0.3) return;
    var f = S.dirFromYaw(me.yaw, me.pitch), dot = (f[0] * dx + f[1] * dy + f[2] * dz) / d;
    var k = Math.max(0.15, (dot + 1) / 2) * (1 - d / 45); this.flashAmt = Math.min(1, k * 1.6); this.flashDur = 3.2 * k + 0.4; this.flashLeft = this.flashDur; GFX.snd('flash', 0.6);
  };
  P.onKill = function (e) {
    var me = this.me, a = e.a ? this.nameOf(e.a) : '', v = this.nameOf(e.v), w = W[e.w] ? W[e.w].n : (e.w === 'he' ? 'HE' : e.w);
    var ac = this.pl[e.a] ? (this.pl[e.a].team === 0 ? '#ffb86b' : '#8ec5ff') : '#fff', vc = this.pl[e.v] ? (this.pl[e.v].team === 0 ? '#ffb86b' : '#8ec5ff') : '#fff';
    this.addFeed((a ? '<b style="color:' + ac + '">' + a + '</b> ' : '') + '🔫 ' + w + (e.hs ? ' 🎯' : '') + ' <b style="color:' + vc + '">' + v + '</b>');
    if (e.a === me.id && e.v !== me.id) { this.stats.k++; if (e.hs) this.stats.hs++; }
    var p = this.pl[e.v]; if (p) { p.alive = false; }
  };
  P.addFeed = function (html) {
    var f = this.q('.feed'), d = el('div', '', html); f.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove(); }, 6000);
    while (f.children.length > 6) f.removeChild(f.firstChild);
  };
  P.banner = function (html, ms, small) {
    var b = this.q('.banner'); b.innerHTML = html; b.style.opacity = 1; b.style.fontSize = small ? '18px' : '28px';
    clearTimeout(this._bt); this._bt = setTimeout(function () { b.style.opacity = 0; }, ms || 2000);
  };
  P.onOver = function (e) {
    this.ended = true; var me = this.me; if (document.exitPointerLock) document.exitPointerLock();
    this.toggleBuy(false); this.q('.pauseM').style.display = 'none';
    var rows = Object.keys(e.stats).map(function (id) { var s = e.stats[id]; s.id = id; return s; }).sort(function (a, b) { return b.k - a.k; });
    var h = '<h2 style="margin:0 0 6px;text-align:center">' + (e.dm ? 'Победитель: ' + e.w : (e.w === 'T' ? 'Террористы победили' : 'Контр-террористы победили')) + '</h2>';
    if (!e.dm) h += '<div style="text-align:center;margin-bottom:8px">Счёт: <span class="tabT">T ' + e.sc[0] + '</span> : <span class="tabC">' + e.sc[1] + ' CT</span></div>';    h += '<table><tr><th>Игрок</th><th>Убийства</th><th>Смерти</th><th>В голову</th></tr>';
    rows.forEach(function (r) { h += '<tr class="' + (r.tm === 'T' ? 'tabT' : 'tabC') + '"><td>' + r.n + '</td><td>' + r.k + '</td><td>' + r.d + '</td><td>' + r.hs + '</td></tr>'; });
    h += '</table><div class="endReward" style="text-align:center;margin-top:10px;color:#fbbf24">Начисляем награду…</div>';
    this.q('.endB').innerHTML = h; this.q('.endM').style.display = 'flex';
    this.won = e.dm ? (e.w === this.cfg.myName) : (e.w === me.team);
    var self = this; this.cfg.onOver && this.cfg.onOver(this.won, function (txt) { var r = self.q('.endReward'); if (r) r.textContent = txt; });
  };
  P.leave = function () { this.cfg.onExit('leave'); };

  /* ---------------------- спектр ---------------------- */
  P.spectateNext = function () {
    var me = this.me, ids = []; for (var k in this.pl) { var p = this.pl[k]; if (p.alive && p.id !== me.id && (p.team === me.teamIdx || this.opts.mode === 'dm' || true)) ids.push(p.id); }
    if (!ids.length) { me.specId = 0; return; }
    var i = ids.indexOf(me.specId); me.specId = ids[(i + 1) % ids.length];
  };

  /* ---------------------- кадр ---------------------- */
  P.frame = function () {
    var now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.time += dt;
    if (this.ph === 1) this.stats.sec += dt;
    this.update(dt); this.render();
  };
  P.update = function (dt) {
    var me = this.me, K = this.keys, w = W[me.wid] || W.knife;
        // прицеливание по ПКМ (механический прицел) — для автоматов без оптики, пистолетов, ПП, дробовиков
    var adsT = me.alive && !this.ended && me.mouseR && this.adsOk(w) && me.reload <= 0 && me.draw <= 0 && this.locked() ? 1 : 0;
    me.ads = (me.ads || 0) + (adsT - (me.ads || 0)) * Math.min(1, dt * 14); if (me.ads < 0.01) me.ads = 0;
    // движение
    if (me.alive && !this.ended) {
      var fwd = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0), rgt = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0);
      if (this.joy) { fwd = -this.joy.y; rgt = this.joy.x; }
      var l = Math.hypot(fwd, rgt); if (l > 1) { fwd /= l; rgt /= l; }
      var fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw), rx = Math.cos(me.yaw), rz = -Math.sin(me.yaw);
      var frozen = this.ph === 0 && this.opts.mode !== 'dm';
      if (frozen) { fwd = rgt = 0; }
      var ws = (w.spd || 1) * (me.scope ? 0.6 : 1) * (1 - 0.2 * (me.ads || 0));
      S.stepMove(this.map, me, { mx: fx * fwd + rx * rgt, mz: fz * fwd + rz * rgt, jump: !!(K.Space || this.jumpT), crouch: !!(K.ControlLeft || K.KeyC || this.crouchT), walk: !!K.ShiftLeft, wspd: ws }, dt);
      me.speed = Math.hypot(me.vx, me.vz);
      me.eyeH += ((me.cr ? S.C.EYE_C : S.C.EYE) - me.eyeH) * Math.min(1, dt * 14);
      // шаги
      if (me.og && me.speed > 3.5 && !K.ShiftLeft) { me.bobT += dt * me.speed * 1.5; if (Math.floor(me.bobT / 3) !== Math.floor((me.bobT - dt * me.speed * 1.5) / 3)) GFX.snd('step', 0.35); } else me.bobT += dt * me.speed * 0.5;
      // перезарядка
      if (me.reload > 0) { me.reload -= dt; if (me.reload <= 0) { var a = me.ammo[me.wid]; if (a) { var need = w.mag - a.mag, take = Math.min(need, a.res); a.mag += take; a.res -= take; } me.reload = 0; } }
      if (me.draw > 0) me.draw -= dt;
      // авто-перезарядка
      var am = me.ammo[me.wid]; if (am && am.mag === 0 && am.res > 0 && me.reload <= 0 && w.slot < 3 && !me.mouseL) this.reload();
      this.tryFire(dt);
      if (me.mouseL === false) { /* clicked остаётся до выстрела */ }
      // отправка позиции
      me.sendT -= dt;
      if (me.sendT <= 0) { me.sendT = 1 / 30; this.cfgSend({ t: 'in', x: me.x, y: me.y, z: me.z, yaw: me.yaw, pitch: me.pitch, cr: me.cr, wid: me.wid, sp: me.speed }); }
    } else {
      me.mouseL = false; if (this.ended) me.scope = 0;
    }
    me.spray = Math.max(0, me.spray - dt * (me.mouseL ? 1.2 : 6));
    me.punchP -= me.punchP * Math.min(1, dt * (me.mouseL ? 2.2 : 7)); me.punchY -= me.punchY * Math.min(1, dt * 6);
    this.shake = Math.max(0, this.shake - dt * 0.3);
    // чужие игроки
    var kk = 1 - Math.exp(-dt * 16);
    for (var id in this.pl) {
      var p = this.pl[id]; if (+id === me.id) { continue; }
      p.x += (p.tx - p.x) * kk; p.y += (p.ty - p.y) * kk; p.z += (p.tz - p.z) * kk; p.yaw += S.angDiff(p.yaw, p.yawT) * kk;
      if (!p.mesh) this.mkMesh(p);
      this.updMesh(p, dt);
    }
    // снаряды
    for (var q in this.projM) { var m = this.projM[q]; m.mesh.position.x += (m.tx - m.mesh.position.x) * 0.5; m.mesh.position.y += (m.ty - m.mesh.position.y) * 0.5; m.mesh.position.z += (m.tz - m.mesh.position.z) * 0.5; if (m.mesh.geometry.type === 'CylinderGeometry') m.mesh.lookAt(m.tx + (m.tx - m.px), m.ty + (m.ty - m.py), m.tz + (m.tz - m.pz)); m.px = m.tx; m.py = m.ty; m.pz = m.tz; }
    // эффекты
    var self = this;
    this.tracers.forEach(function (tr) { if (tr.t > 0) { tr.t -= dt; tr.m.material.opacity = Math.max(0, tr.t / tr.max); if (tr.t <= 0) tr.m.visible = false; } });
    this.booms = this.booms.filter(function (b) { b.t += dt; var f = b.t / 0.5; b.m.scale.setScalar(0.5 + b.r * 0.5 * Math.min(1, f * 1.6)); b.m.material.opacity = Math.max(0, 0.9 - f); if (f >= 1) { self.scene.remove(b.m); return false; } return true; });
    this.smokes = this.smokes.filter(function (s) { s.t -= dt; var o = s.t < 3 ? s.t / 3 : 1; s.g.children.forEach(function (c) { c.material.opacity = 0.88 * o; }); if (s.t <= 0) { self.scene.remove(s.g); return false; } return true; });
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.flashMesh.visible = false; }
    // бомба
    var b = this.bomb;
    if (b[0] === 2 || b[0] === 3 || b[0] === 4 || b[0] === 5) {
      this.bombMesh.visible = b[0] !== 5; this.bombMesh.position.set(b[1], b[2], b[3]);
      var rate = b[0] === 3 ? Math.max(0.12, b[4] / 40) : 99; var on = (this.time % (rate * 1.6 + 0.05)) < 0.1; this.led.visible = b[0] === 3 ? on : true;
      if (b[0] === 3 && on && !this._beep) { this._beep = true; var d = Math.hypot(b[1] - me.x, b[3] - me.z); GFX.snd('beep', Math.max(0.2, 1 - d / 60)); } if (!on) this._beep = false;
    } else this.bombMesh.visible = false;
    this.updateHud(dt);
  };
  P.updMesh = function (p, dt) {
    var h = p.mesh, g = h.g, me = this.me, spec = this.specTarget();
    var vis = p.alive && (!spec || spec.id !== p.id);
    if (!p.alive) { // лежит, пока не начнётся новый раунд
      g.visible = p.dieShown !== false; g.rotation.z = Math.min(Math.PI / 2, (g.rotation.z || 0) + dt * 6); g.position.set(p.x, p.y + 0.25, p.z); g.rotation.y = p.yaw; h.p.hold.visible = false; p.label.visible = false;
      if (p.deadT === undefined) p.deadT = 0; p.deadT += dt; if (p.deadT > 8) g.visible = false; return;
    }
    p.deadT = undefined; g.visible = vis; g.rotation.z = 0; g.position.set(p.x, p.y, p.z); g.rotation.y = p.yaw;
    g.scale.y = p.cr ? 0.78 : 1; h.p.head.rotation.x = p.pitch * 0.8;
    p.ph += dt * Math.min(9, p.sp * 1.6); var sw = Math.sin(p.ph) * Math.min(0.9, p.sp * 0.14);
    h.p.legL.rotation.x = sw; h.p.legR.rotation.x = -sw;
    h.p.armR.rotation.x = -1.35 + p.pitch * 0.5; h.p.armL.rotation.x = -1.2 + p.pitch * 0.5;
    h.p.hold.visible = true;
    if (p.gunWid !== p.wid) { p.gunWid = p.wid; while (h.p.hold.children.length) h.p.hold.remove(h.p.hold.children[0]); var wp = W[p.wid]; if (wp) { var gun = GFX.worldGun(wp.model, this.mats); gun.rotation.x = Math.PI / 2; gun.position.set(0, -0.05, 0); h.p.hold.add(gun); } }
    p.label.visible = (p.team === me.teamIdx && this.opts.mode !== 'dm') && vis;
  };
  P.specTarget = function () {
    var me = this.me; if (me.alive) return null;
    var t = this.pl[me.specId];
    if (!t || !t.alive) { me.specId = 0; for (var k in this.pl) { var p = this.pl[k]; if (p.alive && p.id !== me.id && p.team === me.teamIdx) { me.specId = p.id; break; } } if (!me.specId) for (var k2 in this.pl) { var p2 = this.pl[k2]; if (p2.alive && p2.id !== me.id) { me.specId = p2.id; break; } } t = this.pl[me.specId]; }
    return t && t.alive ? t : null;
  };

  P.render = function () {
    if (!this.ren) return;
    var me = this.me, cam = this.cam, spec = this.specTarget(), w = W[me.wid] || W.knife;
    var sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    if (spec) { cam.position.set(spec.x, spec.y + 1.6, spec.z); cam.rotation.set(spec.pitch + sy, spec.yaw + sx, 0); }
    else { cam.position.set(me.x, me.y + me.eyeH, me.z); cam.rotation.set(me.pitch + me.punchP + sy, me.yaw + me.punchY + sx, 0); }
    var fov = 75; if (me.scope && me.alive) fov = me.scope === 1 && w.scope === 2 ? 38 : (w.scope === 1 ? 45 : 14);
    if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * 0.35; cam.updateProjectionMatrix(); }
    // оружие в руках
    var showVM = me.alive && !me.scope && this.curVM && !this.ended;
    if (this.curVM) this.curVM.g.visible = showVM;
    if (showVM) {
      var v = this.curVM, bob = Math.sin(me.bobT * 1.6) * Math.min(1, me.speed / 6) * 0.012, bobY = Math.abs(Math.cos(me.bobT * 1.6)) * Math.min(1, me.speed / 6) * 0.012;
      this.vmKick = Math.max(0, (this.vmKick || 0) - 0.12); this.vmStab = Math.max(0, (this.vmStab || 0) - 0.07);
      var drawK = me.draw > 0 ? me.draw / 0.4 : 0, relK = me.reload > 0 ? Math.sin(Math.PI * (1 - me.reload / me.reloadT)) : 0;
       var ad = me.ads || 0, ADSY = { pistol: -0.062, smg: -0.07, rifle: -0.075, mg: -0.075, shotgun: -0.052 }[w.model];
      var px = v.off[0] + bob, py = v.off[1] - bobY - drawK * 0.3 - relK * 0.14, pz = v.off[2] + this.vmKick * 0.05 - this.vmStab * 0.12;
      if (ad > 0 && ADSY !== undefined) { px = px * (1 - ad); py = py * (1 - ad) + (ADSY - bobY * 0.2) * ad; pz += 0.04 * ad; }
      v.g.position.set(px, py, pz);
      v.g.rotation.set(this.vmKick * 0.1 + relK * 0.5 + drawK * 0.6 - this.vmStab * 0.5, -relK * 0.2 + this.vmStab * 0.6, relK * 0.15);
    }
    this.ren.clear();
    this.ren.render(this.scene, cam);
    if (showVM) { this.ren.clearDepth(); this.ren.render(this.vmScene, this.vmCam); }
  };

  /* ---------------------- HUD ---------------------- */
  P.updateHud = function (dt) {
    var me = this.me, w = W[me.wid] || W.knife, spec = this.specTarget();
    this._hudT = (this._hudT || 0) - dt;
    // быстрые вещи каждый кадр
    var scopeOn = me.scope && me.alive && !this.ended; this.q('.scope').style.display = scopeOn ? 'block' : 'none';
    var cr = this.q('.cross'), gap = 4 + this.spread(w) * 4.2, L = 8;
   cr.style.display = scopeOn || me.ads > 0.6 || !me.alive || w.slot >= 3 && false ? 'none' : 'block';
    var c = cr.children; c[0].style.cssText = 'left:-1px;top:' + (-gap - L) + 'px;width:2px;height:' + L + 'px'; c[1].style.cssText = 'left:-1px;top:' + gap + 'px;width:2px;height:' + L + 'px';
    c[2].style.cssText = 'top:-1px;left:' + (-gap - L) + 'px;height:2px;width:' + L + 'px'; c[3].style.cssText = 'top:-1px;left:' + gap + 'px;height:2px;width:' + L + 'px';
    // вспышки
    var fl = this.q('#fxFlash'); if (this.flashLeft > 0) { this.flashLeft -= dt; fl.style.opacity = Math.min(1, this.flashAmt * Math.min(1, this.flashLeft / (this.flashDur * 0.6) + 0.0)); } else fl.style.opacity = 0;
    var hu = this.q('#fxHurt'); this.hurtT = Math.max(0, this.hurtT - dt); hu.style.opacity = Math.min(0.8, this.hurtT * 1.2 + (me.alive && me.hp < 25 ? 0.25 : 0));
    if (this._hudT > 0) { this.drawRadar(); return; }
    this._hudT = 0.1;
    var T_ = this.q('.tt'); T_.textContent = this.opts.mode === 'dm' ? mmss(this.tm) : (this.bomb[0] === 3 ? '💣 ' + Math.ceil(this.bomb[4]) : mmss(this.tm));
    T_.style.color = this.bomb[0] === 3 ? '#ff6b6b' : '#fff';
    this.q('.sc').innerHTML = this.opts.mode === 'dm' ? 'Все против всех' : '<span class="tabT">T ' + this.sc[0] + '</span> &nbsp;:&nbsp; <span class="tabC">' + this.sc[1] + ' CT</span> &nbsp; <span style="opacity:.7">' + (this.ph === 0 && this.opts.mode !== 'dm' ? 'подготовка' : 'раунд ' + this.rn) + '</span>';
    var best = null; for (var k in this.pl) { var p = this.pl[k]; if (!best || p.k > best.k) best = p; }
    this.q('.lead').textContent = best && best.k > 0 ? 'Ведущий игрок: ' + best.name + ' (' + best.k + ')' : '';
    var hp = spec ? spec.hp : me.hp, ar = spec ? spec.armor : me.armor;
    this.q('.hpn').textContent = hp; this.q('.hpb').style.width = hp + '%'; this.q('.hpb').style.background = hp > 50 ? '#4ade80' : (hp > 25 ? '#fbbf24' : '#ef4444');
    this.q('.arn').textContent = ar > 0 ? '🛡 ' + ar : ''; this.q('.arb').style.width = ar + '%';
    this.q('.mny').textContent = '$' + fmt(me.money);
    var a = me.ammo[me.wid];
    this.q('.amn').textContent = !me.alive ? '' : (a && w.mag > 0 ? (me.reload > 0 ? '…' : a.mag) + ' | ' + a.res : (w.slot === 4 ? '×' + me.inv.g.length : ''));
    this.q('.wn').textContent = me.alive ? w.n : '';
    // слоты
    var v = me.inv, sl = [[1, v.p], [2, v.s], [3, v.k]], h = '';
    sl.forEach(function (s) { if (s[1]) h += '<div class="slot' + (me.wid === s[1] ? ' on' : '') + '">' + s[0] + '  ' + W[s[1]].n + '</div>'; });
    if (v.g.length) h += '<div class="slot' + (W[me.wid] && W[me.wid].slot === 4 ? ' on' : '') + '">4  ' + v.g.map(function (g) { return W[g].n.split(' ')[0]; }).join(', ') + '</div>';
    if (v.bomb) h += '<div class="slot" style="border-color:#ff6b4a">💣 C4 (E)</div>';
    if (!me.alive) h = ''; if (this._slotH !== h) { this.hudSlots.innerHTML = h; this._slotH = h; }
    // подсказки / полосы
    var hint = this.q('.hint'), prog = this.q('.prog'), txt = '', pv = 0, b = this.bomb, mp = this.map;
    if (me.alive && !this.ended) {
      var inSite = false; (mp.sites || []).forEach(function (s) { if (Math.hypot(me.x - s.x, me.z - s.z) < s.r) inSite = true; });
      if (me.team === 'T' && v.bomb && inSite && b[0] === 1) { txt = 'Удерживай E — заложить бомбу'; if (b[7] > 0) pv = b[7] / S.C.PLANT_T; }
      else if (me.team === 'CT' && b[0] === 3 && Math.hypot(me.x - b[1], me.z - b[3]) < 2.4) { txt = 'Удерживай E — разминировать' + (me.kit ? '' : ' (с набором быстрее)'); if (b[5] > 0) pv = b[5] / (me.kit ? 5 : 10); }
      else if (this.ph === 0 && this.opts.mode !== 'dm') txt = 'B — магазин. Раунд скоро начнётся';
      else if (this.ph === 1 && this.tm > S.C.ROUND_T - S.C.BUY_T && this.opts.mode !== 'dm') txt = '';
    }
    hint.style.display = txt ? 'block' : 'none'; if (txt) hint.textContent = txt;
    prog.style.display = pv > 0 ? 'block' : 'none'; if (pv > 0) prog.firstChild.style.width = Math.min(100, pv * 100) + '%';
    var sp = this.q('.spec'); if (!me.alive && !this.ended) { sp.style.display = 'block'; sp.textContent = spec ? 'Наблюдение: ' + spec.name + ' (клик — следующий)' : 'Вы погибли. Ждите нового раунда'; } else sp.style.display = 'none';
    if (this.scoreOpen) this.renderScore();
    if (this.buyOpen) this.q('.buyMoney').textContent = '$' + fmt(me.money);
  };
  P.drawRadar = function () {
    var x = this.rctx, me = this.me, mp = this.map, s = this.rsc, spec = this.specTarget(), cx = spec || me;
    x.clearRect(0, 0, 140, 140); x.drawImage(this.radarBase, 0, 0);
    var dot = function (px, pz, col, r) { x.fillStyle = col; x.beginPath(); x.arc(px * s, (mp.d - pz) * s, r, 0, 6.28); x.fill(); };
    var self = this;
    for (var k in this.pl) {
      var p = this.pl[k]; if (!p.alive || p.id === me.id) continue;
      var mine = p.team === me.teamIdx || this.opts.mode === 'dm' && false;
      if (mine) dot(p.x, p.z, '#4ade80', 3);
      else { var dx = p.x - me.x, dz = p.z - me.z, d = Math.hypot(dx, dz); if (me.alive && d < 70 && S.rayWorld(mp, me.x, me.y + 1.5, me.z, dx / d, (p.y + 1.3 - me.y - 1.5) / d, dz / d, d) >= d - 0.2) dot(p.x, p.z, '#ef4444', 3.2); }
    }
    var b = this.bomb; if (b[0] === 2 || b[0] === 3) { x.fillStyle = b[0] === 3 && Math.floor(this.time * 3) % 2 ? '#fff' : '#f33'; x.fillRect(b[1] * s - 3, (mp.d - b[3]) * s - 3, 6, 6); }
    if (me.alive) { x.save(); x.translate(me.x * s, (mp.d - me.z) * s); x.rotate(me.yaw + Math.PI); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, -6); x.lineTo(4, 4); x.lineTo(-4, 4); x.closePath(); x.fill(); x.restore(); }
  };
  P.showScore = function (on) { this.scoreOpen = on; this.q('.scoreM').style.display = on ? 'flex' : 'none'; if (on) this.renderScore(); };
  P.renderScore = function () {
    var me = this.me, rows = [], k; for (k in this.pl) rows.push(this.pl[k]);
    var build = function (team, cls, title) {
      var h = '<table class="' + cls + '"><tr><th>' + title + '</th><th>Убийств</th><th>Смертей</th><th></th></tr>';
      rows.filter(function (p) { return p.team === team; }).sort(function (a, b) { return b.k - a.k; }).forEach(function (p) { h += '<tr' + (p.id === me.id ? ' style="background:rgba(255,255,255,.1)"' : '') + '><td>' + (p.alive ? '' : '☠ ') + p.name + '</td><td>' + p.k + '</td><td>' + p.d + '</td><td>' + (p.bot ? '🤖' : '') + '</td></tr>'; });
      return h + '</table>';
    };
    this.q('.scoreB').innerHTML = this.opts.mode === 'dm' ? build(0, 'tabC', 'Игроки') + build(1, 'tabC', '') : '<div style="text-align:center;margin-bottom:6px">' + this.q('.sc').innerHTML + '</div>' + build(0, 'tabT', 'Террористы') + '<div style="height:10px"></div>' + build(1, 'tabC', 'Контр-террористы');
  };

  /* ---------------------- сенсорное управление ---------------------- */
  P.buildTouch = function () {
    var self = this, me = this.me, r = this.root;
    var stick = el('div', 'tc', '<div style="position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px;border-radius:50%;background:rgba(255,255,255,.3)" class="knob"></div>');
    stick.style.cssText = 'left:14px;bottom:18px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.3)';
    var knob = stick.firstChild; stick.appendChild(knob); knob.style.position = 'absolute';
    var sid = null, c0;
    stick.addEventListener('touchstart', function (e) { e.preventDefault(); var t = e.changedTouches[0]; sid = t.identifier; var b = stick.getBoundingClientRect(); c0 = [b.left + 65, b.top + 65]; }, { passive: false });
    stick.addEventListener('touchmove', function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier !== sid) continue; var dx = t.clientX - c0[0], dy = t.clientY - c0[1], l = Math.hypot(dx, dy), m = 50; if (l > m) { dx = dx / l * m; dy = dy / l * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; self.joy = { x: dx / m, y: dy / m }; } }, { passive: false });
    var endS = function (e) { for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) { sid = null; self.joy = null; knob.style.transform = ''; } };
    stick.addEventListener('touchend', endS); stick.addEventListener('touchcancel', endS);
    r.appendChild(stick);
    // зона обзора
    var look = el('div', 'tc'); look.style.cssText = 'right:0;top:0;width:55%;height:100%'; var lid = null, lx = 0, ly = 0;
    look.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; lid = t.identifier; lx = t.clientX; ly = t.clientY; }, { passive: true });
    look.addEventListener('touchmove', function (e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier !== lid) continue; var s = 0.005 * (me.scope ? 0.4 : 1); me.yaw -= (t.clientX - lx) * s; me.pitch = clamp(me.pitch - (t.clientY - ly) * s, -1.45, 1.45); lx = t.clientX; ly = t.clientY; } }, { passive: false });
    look.addEventListener('touchend', function (e) { lid = null; });
    r.insertBefore(look, r.querySelector('.hud').nextSibling);
    var btn = function (ico, style, down, up) {
      var b = el('div', 'tb', ico); b.style.cssText += style; b.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); GFX.audioInit(); down(); }, { passive: false });
      if (up) { b.addEventListener('touchend', function (e) { e.preventDefault(); up(); }); b.addEventListener('touchcancel', up); } r.appendChild(b); return b;
    };
    var fire = btn('🔫', 'right:20px;bottom:90px;width:76px;height:76px;background:rgba(220,40,50,.4)', function () { me.mouseL = true; me.clicked = true; }, function () { me.mouseL = false; });
    btn('⤒', 'right:112px;bottom:40px', function () { self.jumpT = true; setTimeout(function () { self.jumpT = false; }, 120); });
    btn('↻', 'right:112px;bottom:112px;width:48px;height:48px;font-size:18px', function () { self.reload(); });
    btn('🔭', 'right:20px;bottom:180px;width:48px;height:48px;font-size:18px', function () { self.rightClick(); });
    btn('⇄', 'right:84px;bottom:176px;width:48px;height:48px;font-size:18px', function () { self.cycleWeapon(1); });
    btn('🛒', 'left:160px;bottom:30px;width:48px;height:48px;font-size:18px', function () { self.toggleBuy(); });
    btn('✋', 'left:160px;bottom:86px;width:48px;height:48px;font-size:18px', function () { self.cfgSend({ t: 'use', on: 1 }); }, function () { self.cfgSend({ t: 'use', on: 0 }); });
    btn('▼', 'left:218px;bottom:30px;width:44px;height:44px;font-size:16px', function () { self.crouchT = !self.crouchT; });
    btn('☰', 'left:50%;top:6px;width:38px;height:38px;font-size:15px;margin-left:100px', function () { self.q('.pauseM').style.display = 'flex'; });
    var sc = btn('📋', 'right:8px;top:90px;width:38px;height:38px;font-size:14px', function () { self.showScore(!self.scoreOpen); });
  };

  /* ---------------------- завершение ---------------------- */
  P.destroy = function () {
    this.dead = true; cancelAnimationFrame(this.raf); this.unbindInput();
    if (document.exitPointerLock) try { document.exitPointerLock(); } catch (e) {}
    try { if (this.ren) { this.ren.dispose(); this.ren.forceContextLoss && this.ren.forceContextLoss(); } } catch (e) {}
    clearTimeout(this._bt);
    this.root.innerHTML = '';
  };
})();
