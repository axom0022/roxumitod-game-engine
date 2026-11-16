var game = null;
var playres = { w: 1280, h: 720, label: "1280 × 720", orient: "landscape" };

function setplayres(w, h, label, orient) {
  playres = { w: w, h: h, label: label || w + " × " + h, orient: orient || "landscape" };
  updateletterbox();
  var chip = qs("#reschip");
  if (chip) chip.textContent = playres.label;
}

function bindgamekeys() {
  if (bindgamekeys.done) return;
  bindgamekeys.done = true;
  document.addEventListener("keydown", function (ev) {
    if (!game || !app.play) return;
    game.keys[ev.code] = true;
    if (ev.code === "Space" || ev.code.indexOf("Arrow") === 0) ev.preventDefault();
  });
  document.addEventListener("keyup", function (ev) {
    if (game) game.keys[ev.code] = false;
  });
}

function startplay() {
  if (app.tab !== "scene") {
    app.tab = "scene";
    renderdocs();
  }
  if (!view.stage) return;
  if (typeof plugfire === "function") plugfire("playstart", null);
  var orient = app.project.orientation || "landscape";
  if (orient === "portrait") setplayres(720, 1280);
  else if (orient === "auto") setplayres(1024, 1024);
  else if (playres.w < playres.h) setplayres(1280, 720);
  var hero = null;
  var platforms = [];
  var coins = [];
  var hazards = [];
  var goal = null;
  var pickups = [];
  var movers = [];
  walk(app.scene.objects, function (n) {
    if (n.type === "sprite" && n.sprite === "hero" && !hero) hero = n;
    if (n.type === "sprite" && n.sprite === "tiles") platforms.push(n);
    if ((n.tags || []).indexOf("coin") >= 0) coins.push(n);
    if ((n.tags || []).indexOf("hazard") >= 0) hazards.push(n);
    if ((n.tags || []).indexOf("goal") >= 0) goal = n;
    if ((n.tags || []).indexOf("pickup") >= 0) pickups.push(n);
    if ((n.behaviors || []).some(function (b) {
      return /Move/i.test(b.name || "") || b.type === "mover" || b.type === "patrol";
    })) movers.push(n);
  });
  physreset();
  phys.bodies.forEach(function (b) {
    if (!b.static) return;
    if (b.node.type === "tilemap" || b.node.type === "tile") return;
    if (platforms.indexOf(b.node) >= 0) return;
    platforms.push(b.node);
  });
  walk(app.scene.objects, function (n) {
    if (n.type !== "tilemap") return;
    tilemapwalls(n).forEach(function (w) {
      platforms.push({ id: n.id + "pw" + w.x + "_" + w.y, name: n.name, type: "tile", pos: [w.x, w.y, w.z], scl: [w.hw * 2, w.hh * 2, 1], rot: [0, 0, 0] });
    });
  });
  if (!hero) {
    var hasui = false;
    walk(app.scene.objects, function (n) {
      if (n.type === "canvas" || n.type === "button" || n.type === "slider" || n.type === "bar" || n.type === "joystick") hasui = true;
    });
    var ghost = basenode("sprite", { name: "Player", sprite: "hero", pos: [0, 0.2, 1] });
    ghost.visible = false;
    ghost.comps = ["sprite"];
    ghost.tags = ["player"];
    app.scene.objects.push(ghost);
    app.playghost = ghost;
    hero = ghost;
    if (!hasui) toast("No hero in this scene · playing in spectator mode", "warn");
  }
  var hs = nodesize(hero);
  game = {
    hero: hero,
    hw: hs[0] * 0.42,
    hh: hs[1] * 0.5,
    start: hero.pos.slice(),
    x: hero.pos[0],
    y: hero.pos[1],
    vy: 0,
    onground: false,
    face: 1,
    score: 0,
    lives: 3,
    coins: coins.map(function (c) {
      return { node: c, got: false, base: c.pos.slice(), spin: 0 };
    }),
    hazards: hazards.map(function (h) {
      return { node: h, base: h.pos.slice(), t: Math.random() * 6 };
    }),
    pickups: pickups.map(function (p) {
      return { node: p, got: false, base: p.pos.slice() };
    }),
    platforms: platforms.map(function (p) {
      return { node: p, base: p.pos.slice() };
    }),
    goal: goal,
    movers: movers.map(function (m) {
      return { node: m, base: m.pos.slice(), t: 0 };
    }),
    keys: {},
    time: 0,
    invuln: 0,
    status: "playing",
    winat: 0
  };
  gameover = {};
  fxreset();
  bindgamekeys();
  if (typeof uibind === "function") uibind();
  app.play = true;
  game.status = "playing";
  document.body.classList.add("playing");
  var toolsbox = qs(".viewtools");
  if (toolsbox) toolsbox.classList.add("hide");
  var pb = qs("#perspbtn");
  if (pb) pb.classList.add("hide");
  var cam = qs("#campreview");
  if (cam) cam.classList.add("hide");
  var gz = qs("#viewgizmo");
  if (gz) gz.classList.add("hide");
  var hud = qs("#viewhud");
  if (hud) hud.classList.add("hide");
  renderplayui();
  updateletterbox();
  var playbtn = qs("#playbtn");
  if (playbtn) {
    playbtn.classList.add("running");
    playbtn.innerHTML = '<span class="tri">' + ic("stop", "ico-sm") + "</span>Stop";
  }
}

function stopplay() {
  if (app.playghost) {
    var gi = app.scene.objects.indexOf(app.playghost);
    if (gi >= 0) app.scene.objects.splice(gi, 1);
    app.playghost = null;
  }
  app.play = false;
  game = null;
  if (typeof plugfire === "function") plugfire("playstop", null);
  gameover = null;
  document.body.classList.remove("playing");
  var toolsbox = qs(".viewtools");
  if (toolsbox) toolsbox.classList.remove("hide");
  var pb = qs("#perspbtn");
  if (pb) pb.classList.remove("hide");
  var cam = qs("#campreview");
  if (cam) cam.classList.remove("hide");
  var gz = qs("#viewgizmo");
  if (gz) gz.classList.remove("hide");
  var hud = qs("#viewhud");
  if (hud) hud.classList.remove("hide");
  var ui = qs("#playui");
  if (ui) {
    ui.classList.add("hide");
    ui.innerHTML = "";
  }
  var bar = qs("#playbar");
  if (bar) bar.remove();
  qsa("#letterbox, .letterboxbox").forEach(function (el) {
    el.remove();
  });
  var playbtn = qs("#playbtn");
  if (playbtn) {
    playbtn.classList.remove("running");
    playbtn.innerHTML = '<span class="tri">' + ic("play", "ico-sm") + "</span>Play In Editor";
  }
}

function toggleplay() {
  if (app.play) stopplay();
  else startplay();
}

function renderplayui() {
  var ui = qs("#playui");
  if (!ui) return;
  ui.classList.remove("hide");
  ui.innerHTML = '<div class="hud"><div><div class="score" id="playscore">Score: 0</div><div class="lives" id="playlives"></div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><div class="playui-scale">' + esc(app.project.name) + "</div></div></div>" +
    '<div class="hint">Arrows or A / D to move · Space to jump · Esc to stop</div>' +
    '<div id="playbanner" class="banner hide"></div>';
  if (typeof buildtouch === "function") buildtouch();
  var stage = qs("#stage");
  if (!qs("#playbar")) {
    var bar = document.createElement("div");
    bar.id = "playbar";
    bar.className = "playbar";
    bar.innerHTML = '<button class="iconbtn stop" data-act="stopplay" title="Stop">' + ic("stop") + '</button><span class="val" id="playfps">60 fps</span><span class="dim">|</span><span id="reschip">' + esc(playres.label) + '</span><button class="iconbtn" data-act="playresmenu" title="Resolution">' + ic("sliders", "ico-sm") + '</button><span class="dim">|</span><button class="btn sm" data-act="restartplay">' + ic("redo", "ico-sm") + 'Restart</button>';
    stage.appendChild(bar);
  }
  updatelives();
}

function updatelives() {
  var el = qs("#playlives");
  if (!el || !game) return;
  var hearts = [];
  for (var i = 0; i < Math.max(0, game.lives); i++) hearts.push('<img src="' + artmake("heart").toDataURL() + '" style="width:22px;height:22px;image-rendering:pixelated">');
  el.innerHTML = hearts.join("");
  scoretext(String(game.score));
}

function updateletterbox() {
  qsa("#letterbox, .letterboxbox").forEach(function (el) {
    el.remove();
  });
  if (!app.play || !view.stage) return;
  var sr = view.stage.getBoundingClientRect();
  var target = playres.w / playres.h;
  var cur = sr.width / sr.height;
  var box = document.createElement("div");
  box.id = "letterbox";
  box.className = "letterboxbox";
  box.style.position = "absolute";
  box.style.background = "#0f1114";
  box.style.zIndex = "7";
  box.style.pointerEvents = "none";
  if (cur > target) {
    var w = (sr.width - sr.height * target) / 2;
    box.style.left = "0";
    box.style.top = "0";
    box.style.width = w + "px";
    box.style.height = sr.height + "px";
    var box2 = box.cloneNode();
    box2.id = "";
    box2.className = "letterboxbox";
    box2.style.left = "auto";
    box2.style.right = "0";
    view.stage.appendChild(box);
    view.stage.appendChild(box2);
  } else {
    var h = (sr.height - sr.width / target) / 2;
    box.style.left = "0";
    box.style.top = "0";
    box.style.width = sr.width + "px";
    box.style.height = h + "px";
    var box3 = box.cloneNode();
    box3.id = "";
    box3.className = "letterboxbox";
    box3.style.top = "auto";
    box3.style.bottom = "0";
    view.stage.appendChild(box);
    view.stage.appendChild(box3);
  }
}

function scoretext(text) {
  var el = qs("#playscore");
  if (el) el.textContent = "Score: " + text;
  var node = null;
  walk(app.scene.objects, function (n) {
    if (!node && n.type === "label" && /score/i.test(n.name)) node = n;
  });
  if (node) node.text = "Score: " + text;
}

function eventnodes(obj) {
  var out = [];
  if (!obj) return out;
  if (obj.charAt(0) === "#") {
    var tag = obj.slice(1);
    walk(app.scene.objects, function (n) {
      if ((n.tags || []).indexOf(tag) >= 0) out.push(n);
    });
  } else {
    walk(app.scene.objects, function (n) {
      if (n.name === obj) out.push(n);
    });
  }
  return out;
}

function runaction(text, subject) {
  if (!text || !game) return;
  if (runactionextra(text, subject)) return;
  var m = text.match(/add\s+(\d+)\s+to\s+(.+)$/i);
  if (m) {
    var amount = parseInt(m[1], 10);
    var target = m[2].trim();
    if (/^score$/i.test(target)) {
      game.score += amount;
      scoretext(String(game.score));
      syncglobals();
    } else {
      (app.project.globals || []).forEach(function (gv) {
        if (gv.name.toLowerCase() === target.toLowerCase()) gv.value = Number(gv.value || 0) + amount;
      });
    }
    return;
  }
  m = text.match(/set\s+score\s+to\s+(\d+)/i);
  if (m) {
    game.score = parseInt(m[1], 10);
    scoretext(String(game.score));
    syncglobals();
    return;
  }
  m = text.match(/remove\s+(\d+)\s+life/i);
  if (m) {
    game.lives = Math.max(0, game.lives - parseInt(m[1], 10));
    updatelives();
    if (game.lives <= 0) {
      game.status = "lost";
      showbanner("Game over", "You ran out of lives · press restart", "lost");
    }
    return;
  }
  m = text.match(/add\s+(\d+)\s+life/i);
  if (m) {
    game.lives = Math.min(9, game.lives + parseInt(m[1], 10));
    updatelives();
    return;
  }
  m = text.match(/go\s+to\s+scene\s+(.+)$/i);
  if (m) {
    var sname = m[1].trim();
    var scn = null;
    app.project.scenes.forEach(function (s) {
      if (s.name === sname) scn = s;
    });
    if (scn && scn.id !== app.scene.id) {
      stopplay();
      selectscene(scn.id);
      startplay();
    }
    return;
  }
  m = text.match(/^spawn\s+(.+)$/i);
  if (m) {
    var sname2 = m[1].trim();
    var proto = null;
    walk(app.scene.objects, function (n) {
      if (!proto && n.name === sname2) proto = n;
    });
    if (proto) {
      var copy = clonenode(proto);
      copy.pos = [game.x + 1.2, game.y + 1.4, proto.pos[2]];
      copy.name = uniqueid(app.scene.objects, proto.name);
      app.scene.objects.push(copy);
    }
    return;
  }
  m = text.match(/play\s+sound\s+(.+)$/i);
  if (m) {
    var kind = m[1].trim().toLowerCase();
    playsound(kind.indexOf("coin") === 0 ? "coin" : kind.indexOf("jump") === 0 ? "jump" : kind.indexOf("win") === 0 ? "win" : kind.indexOf("lose") === 0 ? "lose" : kind.indexOf("punch") === 0 ? "punch" : "power");
    return;
  }
  if (/destroy/i.test(text) && subject && subject.node) {
    gameover[subject.node.id] = { visible: false };
    return;
  }
  if (/lose/i.test(text)) {
    game.status = "lost";
    showbanner("Game over", "You ran out of lives · press restart", "lost");
    return;
  }
  if (/win/i.test(text)) {
    game.status = "won";
    showbanner("You win!", "Score " + game.score + " · press restart to play again", "won");
  }
}

function runevents(kind, node) {
  if (!game) return false;
  var fired = false;
  var sheet = null;
  app.project.eventsheets.forEach(function (sh) {
    if (sh.name === app.scene.eventsheet) sheet = sh;
  });
  if (!sheet || !sheet.events) return;
  sheet.events.forEach(function (e) {
    if (typeof condpass === "function" && !condpass(e)) return;
    var when = (e.when || "").toLowerCase();
    var objname = e.obj || "";
    var hit = false;
    if (kind === "coin" && when.indexOf("collides with") >= 0 && /coin/i.test(objname)) hit = true;
    else if (kind === "hazard" && when.indexOf("collides with") >= 0 && !/coin|goal/i.test(objname) && /hazard|enemy/i.test(objname)) hit = true;
    else if (kind === "goal" && /goal/i.test(objname)) hit = true;
    else if (kind === "ui" && (objname === (node && node.name) || /ui|button|menu/i.test(objname))) hit = true;
    else if (kind === "particles" && ((node && objname === node.name) || /particle/i.test(objname))) hit = true;
    else if (kind === "animation" && ((node && objname === node.name) || /anim/i.test(objname))) hit = true;
    if (!hit) return;
    fired = true;
    if (typeof dbglog === "function") dbglog(kind, (e.when || "") + " → " + (e.do || ""));
    if (e.breakpoint && typeof dbgpause === "function") {
      dbgpause((e.when || "event") + " → " + (e.do || ""));
      return;
    }
    runaction(e.do, node);
  });
  return fired;
}

function tickgame(dt) {
  if (!game) return;
  if (typeof nettick === "function") nettick(dt);
  if (typeof ue5pie === "function") ue5pie(dt);
  game.time += dt;
  if (game.paused) return;
  if (game.status !== "playing") {
    if (typeof fxtick === "function") fxtick(dt, true);
    return;
  }
  var g = game;
  if (typeof behaviorstep === "function") behaviorstep(dt, g);
  if (typeof physstep === "function") physstep(dt, g);
  if (typeof fxtick === "function") fxtick(dt, true);
  if (typeof xtick === "function") xtick(dt, g.time, true);
  var left = g.keys.ArrowLeft || g.keys.KeyA;
  var right = g.keys.ArrowRight || g.keys.KeyD;
  var jump = g.keys.Space || g.keys.ArrowUp || g.keys.KeyW;
  var speed = 5.4;
  var mdx = (right ? 1 : 0) * speed * dt - (left ? 1 : 0) * speed * dt;
  if (right) g.face = 1;
  if (left) g.face = -1;
  g.slope = 0;
  if (jump && g.onground) {
    g.vy = 9.4;
    g.onground = false;
    playsound("jump");
  }
  g.vy -= 23 * dt;
  var mdy = g.vy * dt;
  var platforms = g.platforms.map(function (p) {
    return p;
  });
  var msteps = Math.max(1, Math.min(12, Math.ceil(Math.max(Math.abs(mdx), Math.abs(mdy)) / 0.14)));
  var hr = Math.max(0.16, Math.min(g.hw, g.hh) * 0.45);
  for (var mk = 0; mk < msteps; mk++) {
  g.x = Math.max(-9, Math.min(9, g.x + mdx / msteps));
  g.y += mdy / msteps;
  g.onground = false;
  g.ride = null;
  platforms.forEach(function (p) {
    var n = p.node;
    var size = nodesize(n);
    var ang = ((n.rot && n.rot[2]) || 0) * Math.PI / 180;
    var ca = Math.cos(ang);
    var sa = Math.sin(ang);
    var sw = size[0] / 2;
    var sh = size[1] / 2;
    if (Math.abs(g.x - n.pos[0]) > sw + sh + hr + 1) return;
    var dx = g.x - n.pos[0];
    var dy = g.y - g.hh + hr - n.pos[1];
    var lx = dx * ca + dy * sa;
    var ly = -dx * sa + dy * ca;
    var qx = Math.max(-sw, Math.min(sw, lx));
    var qy = Math.max(-sh, Math.min(sh, ly));
    var ox = lx - qx;
    var oy = ly - qy;
    if (ox * ox + oy * oy > hr * hr) return;
    var nx;
    var ny;
    var pen;
    if (ox * ox + oy * oy < 1e-8) {
      var px = sw - Math.abs(lx);
      var py = sh - Math.abs(ly);
      if (px < py) {
        nx = lx < 0 ? -1 : 1;
        ny = 0;
        pen = px + hr;
      } else {
        nx = 0;
        ny = ly < 0 ? -1 : 1;
        pen = py + hr;
      }
    } else {
      var dl = Math.sqrt(ox * ox + oy * oy);
      nx = ox / dl;
      ny = oy / dl;
      pen = hr - dl;
    }
    var wnx = nx * ca - ny * sa;
    var wny = nx * sa + ny * ca;
    var tx = lx + nx * pen;
    var ty = ly + ny * pen;
    if (wny > 0.42) {
      var wx = n.pos[0] + tx * ca - ty * sa;
      var wy = n.pos[1] + tx * sa + ty * ca;
      g.x = wx;
      g.y = wy - hr + g.hh;
      if (g.vy < 0) g.vy = 0;
      g.onground = true;
      g.slope = wny;
      g.ride = n;
    } else if (wny < -0.42) {
      g.y += wny * pen;
      if (g.vy > 0) g.vy = 0;
    } else {
      var top = n.pos[1] + sh;
      var limit = g.y - g.hh + 0.66;
      if (Math.abs(sa) < 0.25 && top <= limit && top > g.y - g.hh - 0.02) {
        g.y = top + g.hh;
        g.onground = true;
        g.ride = n;
        g.slope = 1;
      } else {
        g.x += wnx * pen;
        g.slope = 0;
      }
    }
  });
  }
  if (g.slope === undefined) g.slope = 0;
  if (g.ride && g.ride.__dx) g.x += g.ride.__dx;
  if (g.y < -8) {
    g.y = 6;
    g.vy = 0;
  }
  g.movers.forEach(function (m) {
    m.t += dt;
    var beh = (m.node.behaviors || [])[0] || { speed: 1, range: 1.5 };
    var was = m.node.pos[0];
    m.node.pos[0] = m.base[0] + Math.sin(m.t * (beh.speed || 1)) * (beh.range || 1.5);
    m.node.__dx = m.node.pos[0] - was;
  });
  g.coins.forEach(function (c) {
    if (c.got) return;
    c.spin += dt * 4;
    var d = Math.hypot(c.base[0] - g.x, c.base[1] - (g.y + 0.1));
    if (d < 0.72) {
      c.got = true;
      gameover[c.node.id] = { visible: false };
      if (typeof netrpc === "function" && netsys.on) netrpc("pick", ["coin", c.node.id]);
      runevents("coin", c);
      if (typeof fxburst === "function") fxburst([c.base[0], c.base[1], c.base[2]], "sparkles");
      playsound("coin");
      syncglobals();
    }
    gameover[c.node.id] = gameover[c.node.id] || { pos: c.base.slice(), rot: [0, 0, 0] };
    if (!c.got) gameover[c.node.id].rot = [0, c.spin * 30, 0];
  });
  g.pickups.forEach(function (p) {
    if (p.got) return;
    var d = Math.hypot(p.base[0] - g.x, p.base[1] - g.y);
    if (d < 0.7) {
      p.got = true;
      g.lives = Math.min(9, g.lives + 1);
      gameover[p.node.id] = { visible: false };
      playsound("power");
      updatelives();
    }
  });
  g.invuln = Math.max(0, g.invuln - dt);
  if (g.invuln <= 0) {
    g.hazards.forEach(function (h) {
      var n = h.node;
      h.t += dt;
      if ((n.behaviors || []).length) {
        var b = n.behaviors[0];
        n.pos[0] = h.base[0] + Math.sin(h.t * (b.speed || 1)) * (b.range || 1);
      }
      var size = nodesize(n);
      if (Math.abs(n.pos[0] - g.x) < size[0] * 0.35 + g.hw && Math.abs(n.pos[1] - g.y) < size[1] * 0.4 + g.hh * 0.8) {
        g.invuln = 1.2;
        var before = g.lives;
        runevents("hazard", h);
        if (g.lives === before) {
          g.lives--;
          updatelives();
        }
        playsound("lose");
        if (g.lives <= 0) {
          g.status = "lost";
          showbanner("Game over", "You ran out of lives · press restart", "lost");
        } else if (game && g.lives === before) {
          g.x = g.start[0];
          g.y = g.start[1];
          g.vy = 0;
        }
      }
    });
  }
  if (g.goal) {
    var gs = nodesize(g.goal);
    if (Math.abs(g.goal.pos[0] - g.x) < gs[0] * 0.5 + g.hw && Math.abs(g.goal.pos[1] - g.y) < gs[1] * 0.6 + g.hh) {
      runevents("goal", null);
      if (g.status !== "won") {
        g.status = "won";
        showbanner("You win!", "Score " + g.score + " · press restart to play again", "won");
      }
      playsound("win");
    }
  }
  gameover[g.hero.id] = { pos: [g.x, g.y, g.hero.pos[2]], rot: [0, g.face > 0 ? 0 : 0, 0], scl: [1, 1, 1], opacity: g.invuln > 0 && Math.floor(g.time * 12) % 2 ? 0.4 : 1 };
}

function showbanner(title, sub, kind) {
  var b = qs("#playbanner");
  if (!b) return;
  b.classList.remove("hide");
  b.innerHTML = esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "");
}

function syncglobals() {
  (app.project.globals || []).forEach(function (gv) {
    if (gv.name === "Score" && game) gv.value = game.score;
  });
}

function renderplay() {
  if (!game || !view.main) return;
  var cs = playcamera();
  app.camstate = cs;
  var data = collectitems();
  if (typeof netitems === "function") netitems(data.items);
  view.items = data.items;
  view.picks = data.picks;
  var env = sceneenv();
  env.grid = false;
  view.main.resize(view.w, view.h);
  view.main.render(data.items, cs, env);
  var g = view.octx;
  if (g) g.clearRect(0, 0, view.w, view.h);
  if (g && typeof fxdraw === "function") fxdraw(g, cs, view.w, view.h);
  if (g && typeof r2tick === "function") r2tick(0.016, performance.now() / 1000);
  if (g && typeof uidraw === "function") uidraw(g, view.w, view.h);
  if (typeof dbgtick === "function") dbgtick();
  var fps = qs("#playfps");
  if (fps && framecount % 10 === 0) fps.textContent = Math.round(fpsval) + " fps";
}

function playcamera() {
  if (typeof seqcamera === "function") {
    var sq = seqcamera();
    if (sq) return sq;
  }
  var targetx = game ? Math.max(-3.2, Math.min(3.6, game.x * 0.42)) : 0;
  var y = game ? Math.max(-1.1, Math.min(0.2, game.y * 0.2 - 0.6)) : -0.9;
  return { eye: [targetx, 3.1, 15.4], target: [targetx, y, 0], fov: 50, mode: "persp" };
}

function playsound(kind) {
  try {
    var actx = window.AudioContext || window.webkitAudioContext;
    if (!actx) return;
    if (!playsound.ctx) playsound.ctx = new actx();
    var ctx = playsound.ctx;
    if (ctx.state === "suspended") ctx.resume();
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    var freqs = { coin: 880, jump: 520, win: 740, lose: 220, power: 990, punch: 160 };
    o.frequency.value = freqs[kind] || 440;
    o.type = kind === "punch" ? "square" : "triangle";
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.26);
    if (kind === "win") {
      var o2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      o2.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
      o2.frequency.linearRampToValueAtTime(990, ctx.currentTime + 0.3);
      g2.gain.setValueAtTime(0.06, ctx.currentTime + 0.12);
      g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.start(ctx.currentTime + 0.12);
      o2.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {}
}

function playresolutionmodal() {
  var tabs = [
    { id: "landscape", label: "Landscape" },
    { id: "portrait", label: "Portrait" },
    { id: "square", label: "Square" }
  ];
  var sizes = {
    landscape: [["1280 × 720", 1280, 720], ["1920 × 1080", 1920, 1080], ["2560 × 1080", 2560, 1080], ["854 × 480", 854, 480], ["1280 × 800", 1280, 800], ["1024 × 768", 1024, 768], ["960 × 540", 960, 540], ["640 × 480", 640, 480]],
    portrait: [["1080 × 1920", 1080, 1920], ["720 × 1280", 720, 1280], ["480 × 854", 480, 854], ["360 × 640", 360, 640], ["640 × 800", 640, 800]],
    square: [["1080 × 1080", 1080, 1080], ["720 × 720", 720, 720], ["1024 × 1024", 1024, 1024], ["768 × 768", 768, 768], ["640 × 640", 640, 640], ["480 × 480", 480, 480]]
  };
  var cur = playres.orient || "landscape";
  function body() {
    var html = '<div class="segrow" style="margin-bottom:10px">';
    tabs.forEach(function (t) {
      html += '<button class="segbtn' + (cur === t.id ? " on" : "") + '" data-mact="tab" data-tab="' + t.id + '">' + t.label + "</button>";
    });
    html += '</div><div class="picklist" style="display:grid;grid-template-columns:1fr 1fr;gap:4px">';
    sizes[cur].forEach(function (s) {
      html += '<button class="pickitem" data-mact="size" data-w="' + s[1] + '" data-h="' + s[2] + '" data-label="' + esc(s[0]) + '">' + ic(s[1] === s[2] ? "grid" : "monitor", "ico-sm") + '<span class="t">' + esc(s[0]) + "</span></button>";
    });
    html += "</div>";
    return html;
  }
  var ref = openmodal({
    title: "Choose a resolution",
    icon: "monitor",
    width: "wide",
    body: body(),
    footer: '<button class="btn" data-mact="close">Cancel</button>',
    onmount: function (modal) {},
    actions: {
      tab: function (m, s, btn) {
        cur = btn.getAttribute("data-tab");
        m.querySelector(".modalbody").innerHTML = body();
      },
      size: function (m, s, btn) {
        var w = +btn.getAttribute("data-w");
        var h = +btn.getAttribute("data-h");
        closemodal(s);
        setplayres(w, h, btn.getAttribute("data-label"), cur);
        if (app.play) {
          startplay();
        } else {
          toast("Resolution set to " + btn.getAttribute("data-label"), "ok");
        }
      },
      close: function (m, s) {
        closemodal(s);
      }
    }
  });
}
