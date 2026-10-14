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
  };GFX.humanoid = function (team, camo) {
    var g = new T.Group(), T1 = team === 0, parts = {};
    var cloth = new T.MeshLambertMaterial({ color: T1 ? 0x8a6a3a : 0x2f4f8f }), pants = new T.MeshLambertMaterial({ color: T1 ? 0x4d3f26 : 0x243b6b });
    var skin = new T.MeshLambertMaterial({ color: 0xe0b090 }), hat = new T.MeshLambertMaterial({ color: T1 ? 0x222222 : 0x1b2a44 });
    var dark = new T.MeshLambertMaterial({ color: 0x15171a });
    var legL = new T.Group(), legR = new T.Group(); legL.position.set(-0.12, 0.8, 0); legR.position.set(0.12, 0.8, 0);
    bx(legL, pants, 0.17, 0.8, 0.2, 0, -0.4, 0); bx(legR, pants, 0.17, 0.8, 0.2, 0, -0.4, 0); g.add(legL); g.add(legR);
    bx(g, cloth, 0.52, 0.66, 0.3, 0, 1.13, 0);
    var head = new T.Group(); head.position.set(0, 1.62, 0); bx(head, skin, 0.24, 0.26, 0.24, 0, 0, 0); bx(head, hat, 0.27, 0.12, 0.27, 0, 0.14, 0); bx(head, dark, 0.18, 0.05, 0.02, 0, 0.0, -0.125); g.add(head);
    var armL = new T.Group(), armR = new T.Group(); armL.position.set(-0.34, 1.42, 0); armR.position.set(0.34, 1.42, 0);
    bx(armL, cloth, 0.14, 0.55, 0.14, 0, -0.26, 0); bx(armR, cloth, 0.14, 0.55, 0.14, 0, -0.26, 0);
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
