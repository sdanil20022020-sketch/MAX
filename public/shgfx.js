/* shgfx.js — графика и звук MAX SHOOTERS: текстуры, оружие от первого лица (красный камуфляж как в Crazy Shooters 2), модели игроков, звуки */
(function () {
  var T = window.THREE;
  var GFX = window.MXGFX = {};

  /* ---------- звук (синтез, без файлов) ---------- */
  var AC = null, master = null;
  function ctx() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) {} }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  var noiseBuf = null;
  function noise() {
    var a = ctx(); if (!a) return null;
    if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return noiseBuf;
  }
  // dur сек, freq — тон, nz — доля шума, vol 0..1, slide — падение частоты
  GFX.snd = function (kind, vol) {
    var a = ctx(); if (!a) return;
    vol = vol == null ? 1 : vol; if (vol < 0.02) return;
    var P = {
      pistol: [0.14, 220, 0.9, 0.5, 120], smg: [0.1, 260, 0.9, 0.45, 140], rifle: [0.16, 150, 0.9, 0.65, 70], sniper: [0.4, 90, 0.8, 0.9, 40],
      shotgun: [0.28, 110, 0.9, 0.85, 50], mg: [0.14, 130, 0.9, 0.65, 70], launcher: [0.35, 70, 0.7, 0.8, 35], rpg: [0.5, 60, 0.6, 0.9, 30],
      knife: [0.1, 800, 0.9, 0.25, 300], bknife: [0.1, 600, 0.8, 0.3, 200], boom: [1.2, 55, 0.8, 1.0, 20], c4: [2.2, 40, 0.7, 1.0, 15],
      reload: [0.07, 1400, 0.3, 0.3, 900], click: [0.04, 1800, 0.2, 0.25, 1200], beep: [0.09, 1600, 0, 0.35, 1600], step: [0.06, 180, 0.8, 0.12, 90],
      hit: [0.06, 900, 0.1, 0.4, 700], hs: [0.1, 1300, 0.1, 0.5, 1000], buy: [0.12, 600, 0, 0.35, 900], hurt: [0.15, 130, 0.5, 0.5, 80], flash: [0.3, 3000, 0.2, 0.5, 2000],
      throw: [0.12, 400, 0.9, 0.2, 200], plant: [0.2, 500, 0, 0.35, 400], win: [0.5, 520, 0, 0.35, 780], nade: [0.4, 70, 0.8, 0.9, 30]
    }[kind] || [0.1, 300, 0.5, 0.3, 200];
    var t0 = a.currentTime, dur = P[0], g = a.createGain();
    g.gain.setValueAtTime(P[3] * vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    g.connect(master);
    if (P[2] > 0) {
      var s = a.createBufferSource(); s.buffer = noise(); s.loop = true;
      var f = a.createBiquadFilter(); f.type = kind === 'step' ? 'lowpass' : 'bandpass'; f.frequency.setValueAtTime(P[1] * 4, t0); f.frequency.exponentialRampToValueAtTime(Math.max(60, P[4]), t0 + dur);
      var ng = a.createGain(); ng.gain.value = P[2];
      s.connect(f); f.connect(ng); ng.connect(g); s.start(t0); s.stop(t0 + dur + 0.02);
    }
    if (P[2] < 1) {
      var o = a.createOscillator(); o.type = kind === 'beep' || kind === 'win' || kind === 'plant' ? 'square' : 'sine';
      o.frequency.setValueAtTime(P[1], t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, P[4]), t0 + dur);
      var og = a.createGain(); og.gain.value = 1 - P[2] * 0.5; o.connect(og); og.connect(g); o.start(t0); o.stop(t0 + dur + 0.02);
    }
  };
  GFX.audioInit = ctx;

  /* ---------- текстуры ---------- */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(a, b) { return a + Math.random() * (b - a); }
  GFX.camoTex = function () {
    var c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = '#b3141a'; x.fillRect(0, 0, 256, 256);
    var cols = ['#d93a40', '#7d0d12', '#f3d6d6', '#e25b60', '#5e090d'];
    for (var i = 0; i < 90; i++) {
      x.fillStyle = cols[i % cols.length]; x.globalAlpha = rr(0.55, 0.95);
      x.beginPath(); x.ellipse(rr(0, 256), rr(0, 256), rr(8, 30), rr(5, 18), rr(0, 3.14), 0, 6.28); x.fill();
    }
    x.globalAlpha = 1;
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  };
  function noiseTex(base, spread, w, h, bricks) {
    var c = cv(w || 128, h || 128), x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
    var img = x.getImageData(0, 0, c.width, c.height), d = img.data;
    for (var i = 0; i < d.length; i += 4) { var n = (Math.random() - 0.5) * spread; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(img, 0, 0);
    if (bricks) {
      x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 2;
      for (var y = 0; y < c.height; y += 16) { x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke(); for (var xx = (y / 16) % 2 ? 0 : 16; xx < c.width; xx += 32) { x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 16); x.stroke(); } }
    }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  GFX.noiseTex = noiseTex;
  GFX.crateTex = function (base) {
    var c = cv(128, 128), x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 6; x.strokeRect(3, 3, 122, 122);
    x.lineWidth = 4; x.beginPath(); x.moveTo(6, 6); x.lineTo(122, 122); x.moveTo(122, 6); x.lineTo(6, 122); x.stroke();
    for (var i = 0; i < 400; i++) { x.fillStyle = 'rgba(0,0,0,' + rr(0, 0.08) + ')'; x.fillRect(rr(0, 128), rr(0, 128), 2, 2); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  };
  GFX.labelTex = function (txt, col, bg) {
    var c = cv(256, 64), x = c.getContext('2d');
    x.font = 'bold 34px system-ui,Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 7; x.strokeStyle = 'rgba(0,0,0,.8)'; x.strokeText(txt, 128, 34); x.fillStyle = col || '#fff'; x.fillText(txt, 128, 34);
    return new T.CanvasTexture(c);
  };
  GFX.siteTex = function (letter) {
    var c = cv(128, 128), x = c.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 128, 128);
    x.font = 'bold 110px Arial Black,Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(214,60,40,0.85)'; x.fillText(letter, 64, 70);
    return new T.CanvasTexture(c);
  };

  /* UV-раскладка: плитки по 4 метра, чтобы текстура не растягивалась на больших стенах */
  GFX.boxGeo = function (w, h, d, tile) {
    var g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv, i;
    var dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (var f = 0; f < 6; f++) for (i = 0; i < 4; i++) {
      var k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile);
    }
    uv.needsUpdate = true; return g;
  };

  /* ---------- материалы для оружия ---------- */
  GFX.makeMats = function (skin) {
    var camo = skin === 'camo';
    var body = camo ? new T.MeshLambertMaterial({ map: GFX.camoTex() }) : new T.MeshLambertMaterial({ color: 0x3c4148 });
    return {
      body: body,
      dark: new T.MeshLambertMaterial({ color: 0x1d2024 }),
      metal: new T.MeshLambertMaterial({ color: 0x4a5058 }),
      wood: new T.MeshLambertMaterial({ color: camo ? 0x7a1016 : 0x6b4423 }),
      glove: new T.MeshLambertMaterial({ color: 0x2b2e34 }),
      sleeve: camo ? new T.MeshLambertMaterial({ map: GFX.camoTex() }) : new T.MeshLambertMaterial({ color: 0x4a5d3a }),
      blade: new T.MeshLambertMaterial({ color: camo ? 0xd9333a : 0xb8c0c8 }),
      orange: new T.MeshLambertMaterial({ color: 0xff7a1a }),
      glass: new T.MeshBasicMaterial({ color: 0x223344 }),
      flash: new T.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })
    };
  };
  function bx(g, mat, w, h, d, x, y, z, rx, ry, rz) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
    if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz; g.add(m); return m;
  }
  function cyl(g, mat, r0, r1, len, x, y, z, axisZ) {
    var m = new T.Mesh(new T.CylinderGeometry(r0, r1, len, 10), mat); m.position.set(x, y, z);
    if (axisZ !== false) m.rotation.x = Math.PI / 2; g.add(m); return m;
  }
  // руки: правая у рукояти и левая у цевья (перчатки + рукава)
  function arms(g, M, rx, ry, rz, lx, ly, lz, noLeft) {
    bx(g, M.glove, 0.075, 0.09, 0.1, rx, ry, rz);
    bx(g, M.sleeve, 0.09, 0.09, 0.5, rx + 0.04, ry - 0.07, rz + 0.3, -0.18, -0.12);
    if (!noLeft) {
      bx(g, M.glove, 0.08, 0.075, 0.11, lx, ly, lz);
      bx(g, M.sleeve, 0.09, 0.09, 0.5, lx - 0.1, ly - 0.08, lz + 0.32, -0.12, 0.35);
    }
  }
  // Возвращает {g, muzzle, off:[x,y,z]}
  GFX.buildVM = function (type, M) {
    var g = new T.Group(), mz = new T.Object3D(), off = [0.2, -0.2, -0.38];
    switch (type) {
      case 'pistol':
        bx(g, M.body, 0.05, 0.065, 0.26, 0, 0.02, -0.12); bx(g, M.dark, 0.042, 0.045, 0.2, 0, -0.025, -0.1);
        bx(g, M.dark, 0.042, 0.115, 0.055, 0, -0.085, 0.0, 0.25); bx(g, M.metal, 0.012, 0.012, 0.03, 0, 0.06, -0.24);
        mz.position.set(0, 0.025, -0.27); arms(g, M, 0, -0.1, 0.02, 0.03, -0.11, -0.01, true); off = [0.17, -0.17, -0.34]; break;
      case 'smg':
        bx(g, M.body, 0.06, 0.09, 0.4, 0, 0, -0.14); bx(g, M.dark, 0.045, 0.15, 0.055, 0, -0.1, -0.1, 0.05); bx(g, M.dark, 0.05, 0.1, 0.06, 0, -0.085, 0.04, 0.3);
        bx(g, M.metal, 0.02, 0.02, 0.2, 0, 0.01, -0.46); bx(g, M.dark, 0.05, 0.05, 0.16, 0, 0.0, 0.18); bx(g, M.dark, 0.014, 0.03, 0.03, 0, 0.065, -0.3);
        mz.position.set(0, 0.012, -0.57); arms(g, M, 0, -0.1, 0.05, 0.0, -0.06, -0.3); off = [0.2, -0.2, -0.38]; break;
      case 'rifle': case 'mg':
        bx(g, M.body, 0.065, 0.1, 0.55, 0, 0, -0.2); bx(g, M.dark, 0.05, 0.18, 0.06, 0, -0.13, -0.12, -0.2);
        bx(g, M.metal, 0.024, 0.024, 0.35, 0, 0.015, -0.6); bx(g, M.wood, 0.06, 0.1, 0.28, 0, -0.03, 0.2, 0.1);
        bx(g, M.dark, 0.03, 0.035, 0.06, 0, 0.075, -0.35); bx(g, M.dark, 0.015, 0.03, 0.015, 0, 0.065, -0.72);
        if (type === 'mg') bx(g, M.dark, 0.1, 0.12, 0.16, 0, -0.14, -0.15);
        bx(g, M.wood, 0.055, 0.07, 0.3, 0, -0.01, -0.42);
        mz.position.set(0, 0.015, -0.8); arms(g, M, 0.0, -0.1, 0.1, 0.0, -0.06, -0.42); off = [0.21, -0.21, -0.4]; break;
      case 'sniper':
        bx(g, M.body, 0.055, 0.09, 0.7, 0, 0, -0.25); bx(g, M.metal, 0.022, 0.022, 0.5, 0, 0.012, -0.85); bx(g, M.wood, 0.06, 0.12, 0.34, 0, -0.03, 0.2, 0.08);
        cyl(g, M.dark, 0.034, 0.034, 0.3, 0, 0.1, -0.2); cyl(g, M.dark, 0.045, 0.045, 0.06, 0, 0.1, -0.34); cyl(g, M.glass, 0.036, 0.036, 0.062, 0, 0.1, -0.34);
        bx(g, M.dark, 0.012, 0.045, 0.012, 0, 0.065, -0.2); bx(g, M.metal, 0.07, 0.02, 0.02, 0.05, 0.02, -0.08);
        bx(g, M.dark, 0.04, 0.1, 0.05, 0, -0.1, -0.1, 0.12);
        mz.position.set(0, 0.012, -1.1); arms(g, M, 0, -0.1, 0.08, 0.0, -0.06, -0.45); off = [0.21, -0.22, -0.42]; break;
      case 'shotgun':
        bx(g, M.body, 0.06, 0.09, 0.4, 0, 0, -0.12); cyl(g, M.metal, 0.021, 0.021, 0.62, 0, 0.025, -0.52); cyl(g, M.dark, 0.026, 0.026, 0.5, 0, -0.02, -0.46);
        bx(g, M.wood, 0.065, 0.1, 0.18, 0, -0.04, -0.4); bx(g, M.wood, 0.058, 0.11, 0.3, 0, -0.03, 0.2, 0.1);
        mz.position.set(0, 0.025, -0.85); arms(g, M, 0, -0.1, 0.06, 0.0, -0.075, -0.4); off = [0.21, -0.21, -0.4]; break;
      case 'launcher': // M79
        cyl(g, M.dark, 0.05, 0.05, 0.55, 0, 0.03, -0.35); cyl(g, M.metal, 0.058, 0.058, 0.1, 0, 0.03, -0.12);
        bx(g, M.body, 0.06, 0.1, 0.32, 0, -0.02, 0.0); bx(g, M.wood, 0.06, 0.1, 0.3, 0, -0.04, 0.3, 0.1); bx(g, M.dark, 0.04, 0.1, 0.05, 0, -0.1, 0.06, 0.2);
        bx(g, M.dark, 0.012, 0.04, 0.012, 0, 0.1, -0.55);
        mz.position.set(0, 0.03, -0.66); arms(g, M, 0, -0.1, 0.1, 0.0, -0.06, -0.38); off = [0.21, -0.21, -0.4]; break;
      case 'rpg':
        cyl(g, M.body, 0.075, 0.075, 1.0, 0, 0.0, -0.25); cyl(g, M.dark, 0.085, 0.06, 0.2, 0, 0.0, 0.3);
        var cone = new T.Mesh(new T.ConeGeometry(0.1, 0.32, 12), M.orange); cone.rotation.x = -Math.PI / 2; cone.position.set(0, 0, -0.9); g.add(cone);
        bx(g, M.dark, 0.04, 0.12, 0.05, 0, -0.12, 0.05, 0.2); bx(g, M.dark, 0.04, 0.1, 0.05, 0, -0.12, -0.35); bx(g, M.metal, 0.012, 0.06, 0.012, 0, 0.1, -0.2);
        mz.position.set(0, 0, 0.45); arms(g, M, 0.0, -0.17, 0.05, 0.0, -0.17, -0.35); off = [0.17, -0.1, -0.5]; break;
      case 'nade':
        var s = new T.Mesh(new T.SphereGeometry(0.055, 12, 10), M.wood.map ? M.wood : new T.MeshLambertMaterial({ color: 0x3a4a2a })); s.position.set(0, 0, 0); g.add(s);
        bx(g, M.metal, 0.012, 0.05, 0.012, 0, 0.065, 0.0); bx(g, M.metal, 0.012, 0.012, 0.06, 0, 0.09, 0.02);
        bx(g, M.glove, 0.08, 0.09, 0.1, 0.01, -0.06, 0.04); bx(g, M.sleeve, 0.09, 0.09, 0.5, 0.04, -0.12, 0.34, -0.2, -0.1);
        off = [0.17, -0.17, -0.36]; break;
      case 'bknife':
        bx(g, M.blade, 0.015, 0.05, 0.3, 0, 0.0, -0.26, 0, 0, 0); bx(g, M.body, 0.045, 0.06, 0.16, 0, -0.01, -0.06);
        bx(g, M.dark, 0.05, 0.02, 0.04, 0, 0.03, -0.12); bx(g, M.metal, 0.025, 0.025, 0.09, 0, -0.02, 0.07);
        bx(g, M.glove, 0.075, 0.09, 0.1, 0, -0.05, 0.0); bx(g, M.sleeve, 0.09, 0.09, 0.5, 0.04, -0.12, 0.3, -0.2, -0.1);
        mz.position.set(0, 0, -0.42); off = [0.17, -0.17, -0.34]; break;
      default: // нож
        bx(g, M.blade, 0.012, 0.055, 0.28, 0, 0, -0.22, 0, 0, 0); bx(g, M.dark, 0.04, 0.045, 0.12, 0, -0.01, -0.02); bx(g, M.metal, 0.03, 0.03, 0.02, 0, 0, -0.09);
        bx(g, M.glove, 0.075, 0.09, 0.1, 0, -0.04, 0.0); bx(g, M.sleeve, 0.09, 0.09, 0.5, 0.04, -0.1, 0.3, -0.2, -0.1);
        mz.position.set(0, 0, -0.4); off = [0.17, -0.18, -0.34];
    }
    g.add(mz);
    return { g: g, muzzle: mz, off: off };
  };

  /* ---------- модели игроков ---------- */
  var HUMAN_LEN = { pistol: 0.22, smg: 0.42, rifle: 0.68, sniper: 0.95, shotgun: 0.8, mg: 0.78, launcher: 0.62, rpg: 1.0, knife: 0.25, bknife: 0.3, nade: 0.1 };
  /* ---------- внешности бойцов (свои, выдаются случайно) ---------- */
  var SKIN_TONES = [0xe0b090, 0xc68a62, 0x8d5a3c, 0xf1cfae, 0x6b4429];
  // c — куртка, p — штаны, h — голова (cap/beanie/bandana/bal/skull/helmet/beret/bare), hc — цвет головного убора,
  // v — жилет, bp — рюкзак, k — наколенники, gl — очки, n — ПНВ
  var LOOKS_T = [
    { c: 0x8a6a3a, p: 0x4d3f26, h: 'bandana', hc: 0xa3262a, v: 0x3a3326 },
    { c: 0x2b2d31, p: 0x1f2125, h: 'bal', hc: 0x15171a, v: 0x2a2c30, k: 0x1a1b1e },
    { c: 0x5a6b3a, p: 0x3b4a2a, h: 'beanie', hc: 0x2e3a22, bp: 0x4a4a32 },
    { c: 0x6f737a, p: 0x2f4666, h: 'cap', hc: 0x222222 },
    { c: 0x6b2a2a, p: 0x3a2a24, h: 'bal', hc: 0x5a1a1d, v: 0x3a3a3a },
    { c: 0xb59b6a, p: 0x6a5a3a, h: 'bandana', hc: 0x3a3a3a, v: 0x6a5a40, bp: 0x5a4a30 },
    { c: 0x333a3f, p: 0x20252a, h: 'skull', hc: 0xd8d8cc, v: 0x25292d },
    { c: 0xa0662c, p: 0x3b3b3b, h: 'bare', gl: 0x111111, v: 0x4a3a28 }
  ];
  var LOOKS_CT = [
    { c: 0x232b3a, p: 0x1d2330, h: 'helmet', hc: 0x2a3040, v: 0x1a1e26, k: 0x15171a },
    { c: 0x4a5560, p: 0x3a4350, h: 'helmet', hc: 0x3c4a3a, v: 0x2c3438, n: 1, k: 0x1f2326 },
    { c: 0x3f5a35, p: 0x2f4228, h: 'helmet', hc: 0x364a2e, v: 0x2c3a24, bp: 0x3a4a2e },
    { c: 0x1b1d22, p: 0x16181c, h: 'bal', hc: 0x101114, v: 0x24262c, gl: 0x1d3a4a },
    { c: 0x2c4a7a, p: 0x23365a, h: 'cap', hc: 0x1b2a44, v: 0x1c2433 },
    { c: 0xa89468, p: 0x8a7a54, h: 'helmet', hc: 0x7a6a48, v: 0x6a5c3e, k: 0x5a4c34 },
    { c: 0xbfc6cc, p: 0xa9b1b8, h: 'helmet', hc: 0x8f989f, v: 0x7f8890, gl: 0x2a3a4a },
    { c: 0x3a4a3a, p: 0x2d3a2d, h: 'beret', hc: 0x6a1f2a }
  ];
  GFX.randLook = function () { return { i: Math.floor(Math.random() * 8), s: Math.floor(Math.random() * SKIN_TONES.length) }; };
  function lm(c) { return new T.MeshLambertMaterial({ color: c }); }

  GFX.humanoid = function (team, camo, look) {
    var g = new T.Group(), parts = {};
    look = look || GFX.randLook();
    var set = team === 0 ? LOOKS_T : LOOKS_CT, L = set[look.i % set.length];
    var cloth = lm(L.c), pants = lm(L.p), skin = lm(SKIN_TONES[look.s % SKIN_TONES.length]);
    var dark = lm(0x15171a), hat = lm(L.hc || 0x222222), boots = lm(0x1a1a1c), glove = lm(0x1d1f23);
    var legL = new T.Group(), legR = new T.Group(); legL.position.set(-0.12, 0.8, 0); legR.position.set(0.12, 0.8, 0);
    bx(legL, pants, 0.17, 0.8, 0.2, 0, -0.4, 0); bx(legR, pants, 0.17, 0.8, 0.2, 0, -0.4, 0);
    bx(legL, boots, 0.19, 0.14, 0.27, 0, -0.73, -0.02); bx(legR, boots, 0.19, 0.14, 0.27, 0, -0.73, -0.02);
    if (L.k) { var kp = lm(L.k); bx(legL, kp, 0.19, 0.12, 0.22, 0, -0.45, -0.03); bx(legR, kp, 0.19, 0.12, 0.22, 0, -0.45, -0.03); }
    g.add(legL); g.add(legR);
    bx(g, cloth, 0.52, 0.66, 0.3, 0, 1.13, 0);
    bx(g, dark, 0.54, 0.07, 0.32, 0, 0.84, 0);
    if (L.v) {
      var vest = lm(L.v);
      bx(g, vest, 0.56, 0.44, 0.34, 0, 1.2, 0);
      bx(g, vest, 0.14, 0.12, 0.08, -0.15, 1.02, -0.2); bx(g, vest, 0.14, 0.12, 0.08, 0.15, 1.02, -0.2);
    }
    if (L.bp) bx(g, lm(L.bp), 0.34, 0.42, 0.16, 0, 1.18, 0.25);
    var head = new T.Group(); head.position.set(0, 1.62, 0);
    bx(head, skin, 0.24, 0.26, 0.24, 0, 0, 0);
    var h = L.h, cover = h === 'bal' || h === 'skull';
    if (cover) bx(head, hat, 0.265, 0.28, 0.265, 0, 0, 0);
    if (h === 'bal') bx(head, skin, 0.18, 0.05, 0.02, 0, 0.03, -0.135);
    if (h === 'skull') { bx(head, dark, 0.05, 0.05, 0.02, -0.05, 0.03, -0.14); bx(head, dark, 0.05, 0.05, 0.02, 0.05, 0.03, -0.14); bx(head, dark, 0.13, 0.03, 0.02, 0, -0.07, -0.14); }
    if (h === 'cap') { bx(head, hat, 0.27, 0.1, 0.27, 0, 0.14, 0); bx(head, hat, 0.2, 0.03, 0.12, 0, 0.1, -0.18); }
    if (h === 'beanie') bx(head, hat, 0.27, 0.15, 0.27, 0, 0.15, 0);
    if (h === 'bandana') { bx(head, hat, 0.265, 0.06, 0.265, 0, 0.1, 0); bx(head, hat, 0.25, 0.11, 0.02, 0, -0.07, -0.125); }
    if (h === 'helmet') { bx(head, hat, 0.3, 0.15, 0.3, 0, 0.12, 0); bx(head, hat, 0.31, 0.1, 0.06, 0, 0.04, 0.13); bx(head, hat, 0.04, 0.12, 0.2, -0.16, 0.05, 0); bx(head, hat, 0.04, 0.12, 0.2, 0.16, 0.05, 0); }
    if (h === 'beret') { bx(head, hat, 0.3, 0.06, 0.3, 0, 0.14, 0.01); bx(head, hat, 0.2, 0.05, 0.2, 0.05, 0.18, 0); }
    if (L.n) {
      bx(head, dark, 0.2, 0.08, 0.08, 0, 0.17, -0.16);
      var lens = new T.MeshBasicMaterial({ color: 0x39ff6a });
      bx(head, lens, 0.05, 0.05, 0.02, -0.05, 0.17, -0.21); bx(head, lens, 0.05, 0.05, 0.02, 0.05, 0.17, -0.21);
    }
    if (L.gl) bx(head, lm(L.gl), 0.26, 0.07, 0.03, 0, 0.03, -0.13);
    else if (!cover && !L.n) bx(head, dark, 0.18, 0.05, 0.02, 0, 0.0, -0.125);
    g.add(head);
    var armL = new T.Group(), armR = new T.Group(); armL.position.set(-0.34, 1.42, 0); armR.position.set(0.34, 1.42, 0);
    bx(armL, cloth, 0.14, 0.55, 0.14, 0, -0.26, 0); bx(armR, cloth, 0.14, 0.55, 0.14, 0, -0.26, 0);
    bx(armL, glove, 0.15, 0.12, 0.15, 0, -0.55, 0); bx(armR, glove, 0.15, 0.12, 0.15, 0, -0.55, 0);
    armR.rotation.x = -1.35; armL.rotation.x = -1.2; armL.rotation.z = 0.35; g.add(armL); g.add(armR);
    var hold = new T.Group(); hold.position.set(0, -0.5, -0.1); armR.add(hold);
    parts = { legL: legL, legR: legR, head: head, hold: hold, armR: armR, armL: armL, body: g };
    return { g: g, p: parts };
  };
  GFX.worldGun = function (model, M) {
    var g = new T.Group(), len = HUMAN_LEN[model] || 0.5;
    var mat = M.body;
    var b = new T.Mesh(new T.BoxGeometry(0.06, 0.09, len), mat); b.position.set(0, 0, -len / 2 + 0.05); g.add(b);
    if (model === 'rpg' || model === 'launcher') { var c = new T.Mesh(new T.BoxGeometry(0.14, 0.14, len), M.dark); c.position.set(0, 0.02, -len / 2 + 0.05); g.add(c); }
    g.rotation.x = Math.PI / 2 * 0.0; return g;
  };
  GFX.hitSprite = function () { return new T.Mesh(new T.PlaneGeometry(0.2, 0.2), new T.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false })); };
})();
