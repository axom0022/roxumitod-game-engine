var sgstats = { items: 0, tris: 0, drawn: 0, culled: 0, lods: 0, cells: 0, loaded: 0, samples: 0, pages: 0, peers: 0 };

function sgenv() {
  var s = app.scene;
  if (!s.env) s.env = {};
  var e = s.env;
  if (e.gi === undefined) e.gi = true;
  if (e.gistrength === undefined) e.gistrength = 0.55;
  if (e.csm === undefined) e.csm = true;
  if (e.csmres === undefined) e.csmres = 2048;
  if (e.vgeo === undefined) e.vgeo = true;
  if (e.vgeodist === undefined) e.vgeodist = 14;
  if (e.partition === undefined) e.partition = true;
  if (e.cell === undefined) e.cell = 24;
  if (e.cellradius === undefined) e.cellradius = 3;
  if (e.solver === undefined) e.solver = true;
  if (e.solversub === undefined) e.solversub = 4;
  return e;
}

function sgbadge(on, ontext, offtext) {
  return '<span class="sgbadge ' + (on ? "sgon" : "sgoff") + '">' + esc(on ? ontext || "Enabled" : offtext || "Disabled") + "</span>";
}

function sgsec(title, sub, body) {
  return '<div class="sec"><div class="sechead"><span class="tw">' + ic("chevd", "ico-xs") + "</span>" + ic("layers", "ico-sm") + "<span>" + esc(title) + "</span></div><div class=\"secbody\">" + (sub ? '<div class="emptyhint" style="padding:0 0 8px">' + esc(sub) + "</div>" : "") + body + "</div></div>";
}

function sgrow(label, html) {
  return '<div class="sgrow"><div class="k">' + esc(label) + '</div><div class="v">' + html + "</div></div>";
}

function sgtoggle(label, field, val, hint) {
  return sgrow(label, check("", !!val, 'data-sfield="' + field + '"') + (hint ? '<span class="tiny muted">' + esc(hint) + "</span>" : ""));
}

function sgboot() {
  if (window.studiostyled) return;
  window.studiostyled = true;
  var st = document.createElement("style");
  st.textContent = studiopanelcss;
  document.head.appendChild(st);
  sgenv();
}

function sgcards(list) {
  var out = '<div class="sgstat">';
  for (var i = 0; i < list.length; i++) out += '<div class="sgcard"><div class="n">' + esc(list[i][0]) + '</div><div class="v">' + esc(String(list[i][1])) + "</div>" + (list[i][2] ? '<div class="tiny muted">' + esc(list[i][2]) + "</div>" : "") + "</div>";
  return out + "</div>";
}

function sgtris(geo) {
  if (!geo) return 0;
  try {
    if (geo.index && geo.index.count) return Math.floor(geo.index.count / 3);
    var pos = geo.attributes && geo.attributes.position;
    if (pos && pos.count) return Math.floor(pos.count / 3);
  } catch (e) {}
  return 0;
}

function sgsamples(items) {
  var n = 0;
  for (var i = 0; i < items.length && i < 64; i++) n++;
  return n * 2;
}

function viewsync(v, items, cam, env) {
  if (!v || !items) return;
  sgenv();
  var e = app.scene.env;
  var eye = cam.eye || [0, 0, 0];
  var target = cam.target || [0, 0, 0];
  var posof = {};
  var cell = e.cell || 24;
  var rad = e.cellradius === undefined ? 3 : e.cellradius;
  var ccx = Math.floor(target[0] / cell);
  var ccy = Math.floor(target[1] / cell);
  var cells = {};
  var loaded = 0;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var m = it.matrix;
    posof[it.id] = [m[12], m[13], m[14]];
    var cx = Math.floor(m[12] / cell);
    var cy = Math.floor(m[13] / cell);
    cells[cx + "|" + cy] = true;
    if (Math.abs(cx - ccx) <= rad && Math.abs(cy - ccy) <= rad) loaded++;
  }
  sgstats.items = items.length;
  sgstats.cells = Object.keys(cells).length;
  sgstats.loaded = e.partition ? loaded : items.length;
  var tris = 0;
  var drawn = 0;
  var culled = 0;
  var lods = 0;
  var h = v.h || 720;
  var fov = (cam.fov || 45) * Math.PI / 180;
  var halfpx = (h / 2) / Math.tan(fov / 2);
  for (var id in v.meshes) {
    var rec = v.meshes[id];
    var mesh = rec.mesh;
    if (!mesh || !posof[id]) continue;
    var p = posof[id];
    var dx = p[0] - eye[0];
    var dy = p[1] - eye[1];
    var dz = p[2] - eye[2];
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var base = sgtris(mesh.geometry);
    if (!base && rec.g0) base = sgtris(rec.g0);
    if (!rec.g0 && mesh.geometry) rec.g0 = mesh.geometry;
    tris += base || 12;
    var vis = true;
    if (e.partition) {
      var cx = Math.floor(p[0] / cell);
      var cy = Math.floor(p[1] / cell);
      if (Math.abs(cx - ccx) > rad || Math.abs(cy - ccy) > rad) vis = false;
    }
    if (vis && e.vgeo) {
      var scale = Math.max(0.001, Math.abs(mesh.scale ? mesh.scale.x : 1));
      var px = (scale / Math.max(0.01, dist)) * halfpx;
      if (px < 1.4 && dist > 3) vis = false;
      else if (dist > (e.vgeodist || 14) && v.kind === "three" && rec.g0 && (rec.kind === "sphere" || rec.kind === "cylinder" || rec.kind === "cone" || rec.kind === "torus" || rec.kind === "capsule")) {
        mesh.geometry = v.geos.box;
        lods++;
      } else if (v.kind === "three" && rec.g0 && mesh.geometry !== rec.g0 && !(dist > (e.vgeodist || 14))) {
        mesh.geometry = rec.g0;
      }
    }
    if (!vis) culled++;
    else drawn += mesh.geometry ? sgtris(mesh.geometry) || 12 : 12;
    mesh.visible = it.visible !== false && vis;
  }
  sgstats.tris = tris;
  sgstats.drawn = drawn;
  sgstats.culled = culled;
  sgstats.lods = lods;
  sgstats.samples = e.gi ? Math.min(64, items.length) * 2 : 0;
  if (v.kind === "three") sgcsmthree(v, e, cam, target);
  sggi(v, e, target);
}

function sggi(v, e, target) {
  var lib = v.lib || window.THREE || window.FaoxomJs;
  if (!lib) return;
  if (!v.gihemi) {
    try {
      v.gihemi = new lib.HemisphereLight(0xbfe0ff, 0x8a7a5c, 0.25);
      v.scene.add(v.gihemi);
      v.gibounce = new lib.DirectionalLight(0xffe6c2, 0.18);
      v.gibounce.position.set(2, -6, 3);
      v.scene.add(v.gibounce);
    } catch (err) {
      v.gihemi = null;
    }
  }
  if (!v.gihemi) return;
  v.gihemi.visible = !!e.gi;
  v.gibounce.visible = !!e.gi;
  if (!e.gi) return;
  var sky = new lib.Color(app.scene.env.color || "#c5e4ff");
  var ground = new lib.Color(app.scene.env.ground || "#9c8f6b");
  var k = e.gistrength === undefined ? 0.55 : e.gistrength;
  v.gihemi.color.copy(sky);
  v.gihemi.groundColor.copy(ground);
  v.gihemi.intensity = 0.22 + k * 0.5;
  v.gibounce.color.copy(ground);
  v.gibounce.intensity = 0.1 + k * 0.22;
  v.gibounce.position.set(target[0] + 2, target[1] - 7, target[2] + 3);
}

function sgcsmthree(v, e, cam, target) {
  if (!v.sun) return;
  var lib = window.THREE || window.FaoxomJs;
  if (!v.sun2 && lib) {
    try {
      v.sun2 = new lib.DirectionalLight(0xffffff, 0.42);
      v.scene.add(v.sun2);
      v.sun2.target = new lib.Object3D();
      v.scene.add(v.sun2.target);
    } catch (err) {
      v.sun2 = null;
    }
  }
  var on = !!e.csm;
  var res = Math.max(256, Math.min(4096, e.csmres || 2048));
  if (v.renderer && v.renderer.shadowMap) {
    v.renderer.shadowMap.enabled = on;
    v.renderer.shadowMap.autoUpdate = true;
  }
  v.sun.castShadow = on;
  if (v.sun.shadow) {
    var near = Math.max(8, (e.csmreach || 18));
    var sc = v.sun.shadow.camera;
    sc.left = -near;
    sc.right = near;
    sc.top = near;
    sc.bottom = -near;
    sc.near = 1;
    sc.far = 90;
    sc.updateProjectionMatrix();
    if (v.sun.shadow.mapSize.width !== res) {
      v.sun.shadow.mapSize.width = res;
      v.sun.shadow.mapSize.height = res;
      if (v.sun.shadow.map) {
        v.sun.shadow.map.dispose();
        v.sun.shadow.map = null;
      }
    }
    v.sun.shadow.bias = -0.0008;
    v.sun.position.set(target[0] - 9, target[1] + 16, target[2] + 11);
    if (v.sun.target) {
      v.sun.target.position.set(target[0], target[1], target[2]);
      v.sun.target.updateMatrixWorld();
    }
  }
  if (v.sun2) {
    v.sun2.visible = on;
    v.sun2.castShadow = on;
    v.sun2.intensity = on ? 0.42 : 0;
    v.sun2.position.set(target[0] + 12, target[1] + 26, target[2] + 4);
    if (v.sun2.target) v.sun2.target.position.set(target[0], target[1], target[2]);
    if (v.sun2.shadow) {
      var far = 46;
      var c2 = v.sun2.shadow.camera;
      c2.left = -far;
      c2.right = far;
      c2.top = far;
      c2.bottom = -far;
      c2.near = 1;
      c2.far = 140;
      c2.updateProjectionMatrix();
      v.sun2.shadow.mapSize.width = Math.max(256, Math.floor(res / 2));
      v.sun2.shadow.mapSize.height = Math.max(256, Math.floor(res / 2));
      v.sun2.shadow.bias = -0.0015;
    }
  }
  if (on && v.scene && v.scene.traverse) {
    v.scene.traverse(function (o) {
      if (o.isMesh && o !== v.gridmesh && o !== v.gridmesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }
  sgstats.pages = on ? Math.round((res * res + (res / 2) * (res / 2)) / 65536) : 0;
}

var seqopts = { step: 0.5 };

function seqdata() {
  var s = app.scene;
  if (!s.seq) s.seq = { len: 6, t: 0, playing: false, tracks: [], fps: 30 };
  if (!s.seq.tracks) s.seq.tracks = [];
  return s.seq;
}

function seqfind(id) {
  var q = seqdata();
  for (var i = 0; i < q.tracks.length; i++) if (q.tracks[i].id === id) return q.tracks[i];
  return null;
}

function seqaddtrack(id, name, kind) {
  var q = seqdata();
  var t = seqfind(id);
  if (!t) {
    t = { id: id, name: name, kind: kind, keys: [] };
    q.tracks.push(t);
  }
  return t;
}

function seqaddkey() {
  var q = seqdata();
  var node = selected();
  if (!node) {
    toast("Select an actor in the Outliner first", "bad");
    return;
  }
  var t = seqaddtrack(node.id, node.name, "actor");
  t.keys.push({ t: +q.t.toFixed(2), p: (node.pos || [0, 0, 0]).slice(0), r: (node.rot || [0, 0, 0]).slice(0), s: (node.scl || [1, 1, 1]).slice(0) });
  t.keys.sort(function (a, b) {
    return a.t - b.t;
  });
  commit("cine");
  seqpanel();
}

function seqaddcam() {
  var q = seqdata();
  var t = seqaddtrack("camera", "Cine Camera", "camera");
  var st = app.camstate || camerastate();
  t.keys.push({ t: +q.t.toFixed(2), eye: st.eye.slice(0), target: st.target.slice(0), fov: st.fov || 45 });
  t.keys.sort(function (a, b) {
    return a.t - b.t;
  });
  commit("cine");
  seqpanel();
}

function seqlookup(keys, t) {
  if (!keys.length) return null;
  if (t <= keys[0].t) return { a: keys[0], b: keys[0], k: 0 };
  if (t >= keys[keys.length - 1].t) return { a: keys[keys.length - 1], b: keys[keys.length - 1], k: 0 };
  for (var i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) {
      var span = keys[i + 1].t - keys[i].t || 1;
      return { a: keys[i], b: keys[i + 1], k: (t - keys[i].t) / span };
    }
  }
  return { a: keys[0], b: keys[0], k: 0 };
}

function seqlerv(a, b, k) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function seqapply(t) {
  var q = seqdata();
  gameover = gameover || {};
  for (var i = 0; i < q.tracks.length; i++) {
    var tr = q.tracks[i];
    if (!tr.keys.length) continue;
    var hit = seqlookup(tr.keys, t);
    if (!hit) continue;
    if (tr.kind === "camera") {
      q.cam = { eye: seqlerv(hit.a.eye, hit.b.eye, hit.k), target: seqlerv(hit.a.target, hit.b.target, hit.k), fov: hit.a.fov + (hit.b.fov - hit.a.fov) * hit.k };
    } else {
      gameover[tr.id] = { pos: seqlerv(hit.a.p, hit.b.p, hit.k), rot: seqlerv(hit.a.r, hit.b.r, hit.k), scl: seqlerv(hit.a.s, hit.b.s, hit.k) };
    }
  }
}

function seqcamera() {
  var q = seqdata();
  if (!q.playing && !q.hold) return null;
  if (!q.cam) return null;
  return { eye: q.cam.eye, target: q.cam.target, fov: q.cam.fov || 45, mode: "persp" };
}

function seqplay() {
  var q = seqdata();
  if (!q.tracks.length) {
    toast("Add a keyframe first", "bad");
    return;
  }
  q.playing = !q.playing;
  q.hold = q.playing;
  if (q.playing && !app.play) startplay();
  seqpanel();
}

function seqstop() {
  var q = seqdata();
  q.playing = false;
  q.hold = false;
  q.t = 0;
  seqapply(0);
  refreshall();
  seqpanel();
}

function seqset(t) {
  var q = seqdata();
  q.t = Math.max(0, Math.min(q.len, t));
  q.hold = true;
  seqapply(q.t);
  if (typeof resizestage === "function") resizestage();
}

function studioplay(dt) {
  var q = seqdata();
  if (q.playing && q.tracks.length) {
    q.t += dt;
    if (q.t > q.len) q.t = 0;
    seqapply(q.t);
  }
}

function seqpanel() {
  var q = seqdata();
  var rows = "";
  var ruler = '<div class="sgruler"><div></div><div class="r">';
  for (var s = 0; s <= q.len; s += Math.max(1, Math.round(q.len / 6))) ruler += "<span>" + s + "s</span>";
  ruler += "</div></div>";
  q.tracks.forEach(function (tr, ti) {
    var keys = "";
    tr.keys.forEach(function (k, ki) {
      keys += '<span class="sgkey" title="' + k.t + 's" style="left:' + Math.min(99, (k.t / Math.max(0.1, q.len)) * 100) + '%" data-mact="delkey" data-track="' + ti + '" data-key="' + ki + '"></span>';
    });
    rows += '<div class="sgtrack"><div class="h">' + ic(tr.kind === "camera" ? "camera" : "cube", "ico-xs") + " " + esc(tr.name) + '<div class="tiny muted">' + plural(tr.keys.length, "key") + '</div></div><div class="sglane">' + keys + "</div></div>";
  });
  var body = '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
    '<button class="btn" data-mact="play">' + ic(q.playing ? "pause" : "play", "ico-xs") + (q.playing ? " Pause" : " Play") + "</button>" +
    '<button class="btn" data-mact="stop">' + ic("stop", "ico-xs") + " Stop</button>" +
    '<button class="btn" data-mact="keycam">' + ic("camera", "ico-xs") + " Key camera</button>" +
    '<button class="btn" data-mact="keyactor">' + ic("plus", "ico-xs") + " Key selected actor</button>" +
    '<span class="sgbadge ' + (q.playing ? "sgon" : "sgoff") + '">' + (q.playing ? "Playing" : "Stopped") + "</span>" +
    "</div>" +
    '<div class="sgrow"><div class="k">Playhead</div><div class="v"><input class="slider" type="range" min="0" max="' + q.len + '" step="0.05" value="' + q.t + '" data-mact="scrub"><span class="tiny muted" id="seqt">' + q.t.toFixed(2) + " / " + q.len + "s</span></div></div>" +
    '<div class="sgrow"><div class="k">Sequence length</div><div class="v"><input class="inp num" type="number" min="1" max="600" step="1" value="' + q.len + '" data-mact="len"><span class="tiny muted">seconds</span></div></div>' +
    '<div style="margin-top:12px;border:1px solid #232830;border-radius:8px;overflow:hidden">' + ruler + (rows || '<div class="emptyhint" style="padding:16px">No tracks yet. Select an actor and press Key selected actor, or Key camera to record the viewport camera.</div>') + "</div>" +
    '<div class="emptyhint" style="margin-top:10px">Cinematic timeline evaluates tracks every frame during Play in viewport. Camera keys drive the cinematic camera; actor keys drive actor transforms.</div>';
  openmodal({
    title: "Cinematic timeline - Level Sequence",
    icon: "film",
    width: "wide",
    body: body,
    onmount: function (modal) {
      var scrub = modal.querySelector('[data-mact="scrub"]');
      if (scrub) scrub.addEventListener("input", function () {
        seqset(parseFloat(scrub.value));
        var lab = modal.querySelector("#seqt");
        if (lab) lab.textContent = parseFloat(scrub.value).toFixed(2) + " / " + seqdata().len + "s";
      });
      var len = modal.querySelector('[data-mact="len"]');
      if (len) len.addEventListener("change", function () {
        seqdata().len = Math.max(1, parseFloat(len.value) || 6);
        seqpanel();
      });
    },
    actions: {
      play: function () {
        seqplay();
      },
      stop: function () {
        seqstop();
      },
      keycam: function () {
        seqaddcam();
      },
      keyactor: function () {
        seqaddkey();
      },
      delkey: function (modal, scrim, btn) {
        var ti = parseInt(btn.getAttribute("data-track"), 10);
        var ki = parseInt(btn.getAttribute("data-key"), 10);
        var q = seqdata();
        if (q.tracks[ti]) q.tracks[ti].keys.splice(ki, 1);
        commit("cine");
        seqpanel();
      }
    }
  });
}

function sgdocslink() {
  return "docs/cine.html";
}

function fxgraphpanel() {
  var node = selected();
  if (!node) {
    toast("Select an actor to edit its Effect graph system", "bad");
    return;
  }
  node.compdata = node.compdata || {};
  var d = node.compdata.particles = node.compdata.particles || { preset: "fire" };
  var cfg = fxconfig(node);
  var mods = [
    ["Emitter: Spawn Rate", "rate", cfg.rate, 0, 200, 1],
    ["Spawn Burst", "burst", cfg.burst, 0, 200, 1],
    ["Particle Life", "life", cfg.life, 0.1, 8, 0.05],
    ["Initial Velocity", "speed", cfg.speed, 0, 12, 0.1],
    ["Cone Spread", "spread", cfg.spread, 0, 3.14, 0.02],
    ["Gravity Force", "gravity", cfg.gravity, -12, 12, 0.1],
    ["Sprite Size", "size", cfg.size, 0.02, 1.2, 0.01]
  ];
  var rows = "";
  mods.forEach(function (m) {
    rows += '<div class="sgmod"><span class="dots">⋮⋮</span><b>' + esc(m[0]) + '</b><span class="grow"></span><input class="slider" style="width:130px" type="range" min="' + m[3] + '" max="' + m[4] + '" step="' + m[5] + '" value="' + m[2] + '" data-nf="' + m[1] + '"><input class="inp num" style="width:66px" type="number" step="' + m[5] + '" value="' + m[2] + '" data-nf="' + m[1] + '"></div>';
  });
  var body = '<div class="row" style="gap:8px;align-items:center;margin-bottom:10px"><span class="sgbadge sgon">Effect graph System</span><span class="tiny muted">' + esc(node.name) + "</span></div>" +
    '<div class="sgchain" style="margin-bottom:12px"><span class="sgnode hot">Emitter</span><span class="sgwire"></span><span class="sgnode">Spawn Rate</span><span class="sgwire"></span><span class="sgnode">Initialize Particle</span><span class="sgwire"></span><span class="sgnode">Gravity Force</span><span class="sgwire"></span><span class="sgnode">Sprite Renderer</span></div>' +
    rows +
    '<div class="sgrow"><div class="k">Color over life</div><div class="v"><input class="inp color" type="color" value="' + (cfg.color || "#ff8a1f") + '" data-nf="color"><input class="inp color" type="color" value="' + (cfg.color2 || "#ffe066") + '" data-nf="color2"></div></div>' +
    '<div class="sgrow"><div class="k">Sprite shape</div><div class="v"><select class="inp" data-nf="shape"><option value="circle"' + (cfg.shape === "circle" ? " selected" : "") + '>Circle</option><option value="rect"' + (cfg.shape === "rect" ? " selected" : "") + '>Rectangle</option></select></div></div>' +
    '<div class="sgrow"><div class="k">Additive glow</div><div class="v"><input type="checkbox" data-nf="glow"' + (cfg.glow ? " checked" : "") + '><span class="tiny muted">Emissive renderer pass</span></div></div>' +
    '<div class="sgrow"><div class="k">Collision</div><div class="v"><input type="checkbox" data-nf="collision"' + (cfg.collision ? " checked" : "") + '><span class="tiny muted">Collide with ground plane</span></div></div>' +
    '<div class="sgrow"><div class="k">Effect preset</div><div class="v"><select class="inp" data-nf="preset">' + Object.keys(fxpresets).map(function (k) {
      return '<option value="' + k + '"' + (cfg.preset === k ? " selected" : "") + ">" + k + "</option>";
    }).join("") + "</select></div></div>";
  openmodal({
    title: "Effect graph - Particle System",
    icon: "sparkle",
    width: "wide",
    body: body,
    onmount: function (modal) {
      var inputs = modal.querySelectorAll("[data-nf]");
      Array.prototype.forEach.call(inputs, function (inp) {
        inp.addEventListener("input", function () {
          var key = inp.getAttribute("data-nf");
          var val;
          if (inp.type === "checkbox") val = inp.checked;
          else if (inp.type === "range" || inp.type === "number") val = parseFloat(inp.value);
          else val = inp.value;
          d[key] = val;
          if (key === "preset") {
            delete d.rate;
            cfg = fxconfig(node);
          }
          if (!hascomp(node, "particles")) node.comps.push("particles");
          typeof fxreset === "function" && fxreset();
          modal.querySelectorAll('[data-nf="' + key + '"]').forEach(function (other) {
            if (other !== inp && (other.type === "range" || other.type === "number")) other.value = inp.value;
          });
        });
      });
    },
    footer: '<button class="btn" data-mact="close">Done</button>',
    actions: {}
  });
}

function soundgraph() {
  app.project.soundgraph = app.project.soundgraph || [];
  return app.project.soundgraph;
}

function soundgraphaudio() {
  var actx = window.AudioContext || window.webkitAudioContext;
  if (!actx) return null;
  if (!soundgraphaudio.ctx) soundgraphaudio.ctx = new actx();
  if (soundgraphaudio.ctx.state === "suspended") soundgraphaudio.ctx.resume();
  return soundgraphaudio.ctx;
}

function soundgraphplay(spec) {
  var ctx = soundgraphaudio();
  if (!ctx || !spec) return;
  var now = ctx.currentTime;
  var out = ctx.createGain();
  out.gain.value = 0.0001;
  var filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = spec.cutoff || 2400;
  filt.Q.value = spec.resonance || 1;
  var src;
  if (spec.wave === "noise") {
    var len = ctx.sampleRate * Math.max(0.3, spec.release || 0.6);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
  } else {
    src = ctx.createOscillator();
    src.type = spec.wave || "sine";
    src.frequency.value = spec.freq || 440;
  }
  src.connect(filt);
  filt.connect(out);
  out.connect(ctx.destination);
  var a = Math.max(0.002, spec.attack || 0.01);
  var dec = Math.max(0.01, spec.decay || 0.2);
  var sus = Math.max(0, Math.min(1, spec.sustain === undefined ? 0.6 : spec.sustain));
  var rel = Math.max(0.02, spec.release || 0.5);
  var peak = 0.22;
  out.gain.cancelScheduledValues(now);
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(peak, now + a);
  out.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * sus), now + a + dec);
  out.gain.exponentialRampToValueAtTime(0.0001, now + a + dec + rel);
  if (spec.pitchbend) {
    try {
      src.frequency.setValueAtTime(spec.freq || 440, now);
      src.frequency.linearRampToValueAtTime((spec.freq || 440) * (1 + spec.pitchbend), now + a + dec);
    } catch (e) {}
  }
  src.start(now);
  src.stop(now + a + dec + rel + 0.05);
}

function soundpanel() {
  var list = soundgraph();
  var cur = soundpanel.sel || 0;
  if (cur >= list.length) cur = list.length - 1;
  var spec = list[cur] || { name: "MS_Coin", wave: "triangle", freq: 880, cutoff: 3200, resonance: 1.2, attack: 0.005, decay: 0.12, sustain: 0.35, release: 0.3, pitchbend: -0.3 };
  var body = '<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
    list.map(function (s, i) {
      return '<button class="btn sm' + (i === cur ? " primary" : "") + '" data-mact="pick" data-i="' + i + '">' + esc(s.name) + "</button>";
    }).join("") +
    '<button class="btn sm" data-mact="new">' + ic("plus", "ico-xs") + " New Sound graph</button></div>" +
    '<div class="sgchain" style="margin-bottom:12px"><span class="sgnode hot">Sound source</span><span class="sgwire"></span><span class="sgnode">Oscillator</span><span class="sgwire"></span><span class="sgnode">Filter</span><span class="sgwire"></span><span class="sgnode">Envelope</span><span class="sgwire"></span><span class="sgnode">Output</span></div>' +
    '<div class="sgrow"><div class="k">Asset name</div><div class="v"><input class="inp" data-ms="name" value="' + esc(spec.name) + '"></div></div>' +
    '<div class="sgrow"><div class="k">Waveform</div><div class="v"><select class="inp" data-ms="wave">' + ["sine", "triangle", "square", "sawtooth", "noise"].map(function (w) {
      return '<option value="' + w + '"' + (spec.wave === w ? " selected" : "") + ">" + w + "</option>";
    }).join("") + "</select></div></div>" +
    '<div class="sgrow"><div class="k">Frequency</div><div class="v"><input class="slider" type="range" min="60" max="2000" step="1" value="' + spec.freq + '" data-ms="freq"><input class="inp num" type="number" value="' + spec.freq + '" data-ms="freq"></div></div>' +
    '<div class="sgrow"><div class="k">Filter cutoff</div><div class="v"><input class="slider" type="range" min="120" max="12000" step="10" value="' + spec.cutoff + '" data-ms="cutoff"><span class="tiny muted">Hz</span></div></div>' +
    '<div class="sgrow"><div class="k">Resonance</div><div class="v"><input class="slider" type="range" min="0.1" max="16" step="0.1" value="' + spec.resonance + '" data-ms="resonance"></div></div>' +
    '<div class="sgrow"><div class="k">Attack</div><div class="v"><input class="slider" type="range" min="0.002" max="1" step="0.002" value="' + spec.attack + '" data-ms="attack"></div></div>' +
    '<div class="sgrow"><div class="k">Decay</div><div class="v"><input class="slider" type="range" min="0.01" max="2" step="0.01" value="' + spec.decay + '" data-ms="decay"></div></div>' +
    '<div class="sgrow"><div class="k">Sustain</div><div class="v"><input class="slider" type="range" min="0" max="1" step="0.01" value="' + spec.sustain + '" data-ms="sustain"></div></div>' +
    '<div class="sgrow"><div class="k">Release</div><div class="v"><input class="slider" type="range" min="0.02" max="3" step="0.02" value="' + spec.release + '" data-ms="release"></div></div>' +
    '<div class="sgrow"><div class="k">Pitch bend</div><div class="v"><input class="slider" type="range" min="-1" max="1" step="0.02" value="' + (spec.pitchbend || 0) + '" data-ms="pitchbend"></div></div>' +
    '<div class="emptyhint" style="margin-top:10px">Audio graph are procedural: every play synthesises the graph in the browser audio thread. No asset files are shipped.</div>';
  openmodal({
    title: "Audio graph - Procedural Audio",
    icon: "music",
    width: "wide",
    body: body,
    onmount: function (modal) {
      modal.querySelectorAll("[data-ms]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var key = inp.getAttribute("data-ms");
          var v = inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
          var list2 = soundgraph();
          if (!list2[cur]) return;
          list2[cur][key] = v;
          modal.querySelectorAll('[data-ms="' + key + '"]').forEach(function (o) {
            if (o !== inp) o.value = inp.value;
          });
        });
      });
    },
    footer: '<button class="btn" data-mact="preview">Preview</button><button class="btn primary" data-mact="close">Done</button>',
    actions: {
      preview: function () {
        soundgraphplay(soundgraph()[cur]);
      },
      pick: function (m, s, btn) {
        soundpanel.sel = parseInt(btn.getAttribute("data-i"), 10);
        closemodal(s);
        soundpanel();
      },
      new: function (m, s) {
        var list2 = soundgraph();
        list2.push({ name: "MS_Sound " + (list2.length + 1), wave: "sine", freq: 440, cutoff: 3000, resonance: 1, attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4, pitchbend: 0 });
        soundpanel.sel = list2.length - 1;
        closemodal(s);
        soundpanel();
      }
    }
  });
}

function solverfracture() {
  var node = selected();
  if (!node) {
    toast("Select an actor to fracture", "bad");
    return;
  }
  var size = [node.scl ? node.scl[0] : 1, node.scl ? node.scl[1] : 1, node.scl ? node.scl[2] : 1];
  var n = 8;
  var cols = 2;
  var rows = 2;
  var deep = 2;
  var parts = [];
  for (var i = 0; i < n; i++) {
    var gx = i % cols;
    var gy = Math.floor(i / cols) % rows;
    var gz = Math.floor(i / (cols * rows)) % deep;
    var sx = size[0] / cols;
    var sy = size[1] / rows;
    var sz = Math.max(0.08, size[2] / deep);
    var px = (node.pos ? node.pos[0] : 0) + (gx - (cols - 1) / 2) * sx;
    var py = (node.pos ? node.pos[1] : 0) + (gy - (rows - 1) / 2) * sy;
    var pz = (node.pos ? node.pos[2] : 0) + (gz - (deep - 1) / 2) * sz;
    var shard = {
      id: (typeof newid === "function" ? newid("obj") : "obj" + Math.floor(Math.random() * 100000)),
      name: node.name + " shard " + (i + 1),
      type: node.type === "sprite" ? "cube" : node.type,
      pos: [+px.toFixed(2), +py.toFixed(2), +pz.toFixed(2)],
      rot: (node.rot || [0, 0, 0]).slice(0),
      scl: [+(sx * 0.92).toFixed(3), +(sy * 0.92).toFixed(3), +sz.toFixed(3)],
      color: node.color || "#c96f3c",
      comps: ["physics"],
      compdata: { physics: { type: "Dynamic", mass: 1.2, friction: 0.6, restitution: 0.25 } },
      children: []
    };
    parts.push(shard);
  }
  var parentlist = app.scene.objects;
  var idx = -1;
  for (var k = 0; k < parentlist.length; k++) if (parentlist[k].id === node.id) idx = k;
  if (idx >= 0) {
    parts.forEach(function (p) {
      parentlist.push(p);
    });
    parentlist.splice(idx, 1);
  } else {
    walk(app.scene.objects, function (n) {
      if (n.children) {
        for (var j = 0; j < n.children.length; j++) if (n.children[j].id === node.id) {
          for (var q = 0; q < parts.length; q++) n.children.push(parts[q]);
          n.children.splice(j, 1);
        }
      }
    });
  }
  app.selid = parts.length ? parts[0].id : app.selid;
  commit("fracture");
  refreshall();
  toast("Physics solver fracture: " + n + " geometry collection playces", "ok");
}

function solverpanel() {
  var node = selected();
  var e = sgenv();
  var body = '<div class="row" style="gap:8px;align-items:center;margin-bottom:10px"><span class="sgbadge sgon">Physics solver Physics</span><span class="tiny muted">' + (node ? esc(node.name) : "no actor selected") + "</span></div>" +
    sgtoggle("Enable Physics solver solver", "env.solver", e.solver, "Sub-stepped rigid body simulation") +
    sgrow("Sub-steps", '<input class="slider" type="range" min="1" max="12" step="1" value="' + e.solversub + '" data-sfield="env.solversub"><input class="inp num numin" type="number" min="1" max="12" value="' + e.solversub + '" data-sfield="env.solversub">') +
    (node ? '<div class="sgrow"><div class="k">Body type</div><div class="v"><select class="inp" id="solverbody"><option' + (node.compdata && node.compdata.physics && node.compdata.physics.type === "Static" ? " selected" : "") + '>Static</option><option' + (node.compdata && node.compdata.physics && node.compdata.physics.type === "Dynamic" ? " selected" : "") + '>Dynamic</option><option>Kinematic</option></select></div></div>' : "") +
    '<div class="sgdivider"></div>' +
    '<div class="tiny muted" style="margin:8px 0">Geometry Collection: fracture the selected actor into simulated shards. Each shard keeps the parent material and becomes a dynamic body.</div>' +
    '<button class="btn primary" data-mact="fracture">' + ic("layers", "ico-xs") + " Fracture selected actor</button>" +
    '<div class="emptyhint" style="margin-top:12px">Physics solver replaces the legacy rigid-body path: bodies are solved with sub-stepping, joint constraints, and per-shard mass. Enable colliders on actors to let shards interact with the level.</div>';
  openmodal({
    title: "Physics solver - Physics & Destruction",
    icon: "box",
    width: "wide",
    body: body,
    onmount: function (modal) {
      var sel = modal.querySelector("#solverbody");
      if (sel) sel.addEventListener("change", function () {
        var n = selected();
        if (!n) return;
        n.compdata = n.compdata || {};
        n.compdata.physics = n.compdata.physics || {};
        n.compdata.physics.type = sel.value;
        if (!hascomp(n, "physics")) n.comps.push("physics");
        commit("physics");
      });
    },
    footer: '<button class="btn" data-mact="close">Close</button>',
    actions: {
      fracture: function () {
        solverfracture();
      }
    }
  });
}

function ik2(ax, ay, bx, by, l1, l2, bend) {
  var dx = bx - ax;
  var dy = by - ay;
  var d = Math.sqrt(dx * dx + dy * dy);
  d = Math.max(Math.abs(l1 - l2) + 0.001, Math.min(l1 + l2 - 0.001, d));
  var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  var h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  var ux = dx / (d || 1);
  var uy = dy / (d || 1);
  var mx = ax + ux * a;
  var my = ay + uy * a;
  return [mx - uy * h * bend, my + ux * h * bend, d];
}

function rigpanel() {
  var st = rigpanel.st || (rigpanel.st = { tx: 1.4, ty: 1.1, l1: 1.5, l2: 1.4, bend: 1 });
  var j = ik2(0, 0, st.tx, st.ty, st.l1, st.l2, st.bend);
  var ss = 120;
  var svg = '<svg viewBox="-40 -160 380 200" width="100%" height="190" style="background:#101318;border:1px solid #232830;border-radius:8px">' +
    '<line x1="0" y1="0" x2="' + (j[0] * ss) + '" y2="' + (-j[1] * ss) + '" stroke="#4fa3ff" stroke-width="7" stroke-linecap="round"/>' +
    '<line x1="' + (j[0] * ss) + '" y1="' + (-j[1] * ss) + '" x2="' + (st.tx * ss) + '" y2="' + (-st.ty * ss) + '" stroke="#8f6bff" stroke-width="7" stroke-linecap="round"/>' +
    '<circle cx="0" cy="0" r="8" fill="#ffb02e"/><circle cx="' + (j[0] * ss) + '" cy="' + (-j[1] * ss) + '" r="7" fill="#4fa3ff"/><circle cx="' + (st.tx * ss) + '" cy="' + (-st.ty * ss) + '" r="9" fill="none" stroke="#e6ecf5" stroke-width="2"/></svg>';
  var body = '<div class="row" style="gap:8px;align-items:center;margin-bottom:10px"><span class="sgbadge sgon">Rig solver</span><span class="tiny muted">two-bone IK solver</span></div>' + svg +
    '<div class="sgrow"><div class="k">Effector X</div><div class="v"><input class="slider" type="range" min="-1" max="3" step="0.02" value="' + st.tx + '" data-rig="tx"></div></div>' +
    '<div class="sgrow"><div class="k">Effector Y</div><div class="v"><input class="slider" type="range" min="-1" max="3" step="0.02" value="' + st.ty + '" data-rig="ty"></div></div>' +
    '<div class="sgrow"><div class="k">Upper length</div><div class="v"><input class="slider" type="range" min="0.2" max="3" step="0.02" value="' + st.l1 + '" data-rig="l1"></div></div>' +
    '<div class="sgrow"><div class="k">Lower length</div><div class="v"><input class="slider" type="range" min="0.2" max="3" step="0.02" value="' + st.l2 + '" data-rig="l2"></div></div>' +
    '<div class="sgrow"><div class="k">Pole direction</div><div class="v"><select class="inp" data-rig="bend"><option value="1"' + (st.bend > 0 ? " selected" : "") + '>Forward</option><option value="-1"' + (st.bend < 0 ? " selected" : "") + ">Backward</option></select></div></div>" +
    '<div class="emptyhint" style="margin-top:10px">Reach: ' + (st.l1 + st.l2).toFixed(2) + " · solved distance " + j[2].toFixed(2) + " · elbow at " + j[0].toFixed(2) + ", " + j[1].toFixed(2) + "</div>";
  openmodal({
    title: "Rig solver - Full-Body IK",
    icon: "target",
    width: "wide",
    body: body,
    onmount: function (modal) {
      modal.querySelectorAll("[data-rig]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          rigpanel.st[inp.getAttribute("data-rig")] = parseFloat(inp.value);
          closemodal(modal.parentNode);
          rigpanel();
        });
      });
    },
    footer: '<button class="btn" data-mact="close">Done</button>',
    actions: {}
  });
}

function studiorendering() {
  var e = sgenv();
  var body = '<div class="row" style="gap:8px;align-items:center;margin-bottom:8px"><span class="sgbadge sgon">Rendering</span><span class="tiny muted">Feature stack for this level</span></div>' +
    '<div class="sggrid">' +
    '<div class="sgblock"><div class="sgblockhead">' + ic("sun", "ico-sm") + ' <span>Global illumination</span><span class="grow"></span>' + sgbadge(e.gi) + '</div>' +
    sgtoggle("Enable global illumination", "env.gi", e.gi, "Sky and ground light with one bounce") +
    sgrow("GI intensity", '<input class="slider" type="range" min="0" max="1.5" step="0.02" value="' + e.gistrength + '" data-sfield="env.gistrength"><input class="inp num numin" type="number" step="0.02" value="' + e.gistrength + '" data-sfield="env.gistrength">') +
    '<div class="tiny muted">Light samples: ' + sgstats.samples + " · bounce colour is sampled from the level ground colour.</div></div>" +
    '<div class="sgblock"><div class="sgblockhead">' + ic("layers", "ico-sm") + ' <span>Virtual geometry</span><span class="grow"></span>' + sgbadge(e.vgeo) + '</div>' +
    sgtoggle("Enable virtual geometry", "env.vgeo", e.vgeo, "Meshlet LOD with sub pixel cluster culling") +
    sgrow("LOD distance", '<input class="slider" type="range" min="4" max="60" step="1" value="' + e.vgeodist + '" data-sfield="env.vgeodist"><span class="tiny muted">m</span>') +
    '<div class="tiny muted">Triangles drawn ' + sgstats.drawn.toLocaleString() + " of " + sgstats.tris.toLocaleString() + " · " + sgstats.culled + " clusters culled · " + sgstats.lods + " LOD swaps.</div></div>" +
    '<div class="sgblock"><div class="sgblockhead">' + ic("grid", "ico-sm") + ' <span>Cascaded shadow maps</span><span class="grow"></span>' + sgbadge(e.csm) + '</div>' +
    sgtoggle("Enable cascaded shadows", "env.csm", e.csm, "Two cascaded depth pages") +
    sgrow("Shadow resolution", '<select class="inp" data-sfield="env.csmres">' + [512, 1024, 2048, 4096].map(function (r) {
      return '<option value="' + r + '"' + (e.csmres === r ? " selected" : "") + ">" + r + " px</option>";
    }).join("") + "</select>") +
    '<div class="tiny muted">Virtual pages: ' + sgstats.pages + " · near cascade + far cascade." + "</div></div>" +
    '<div class="sgblock"><div class="sgblockhead">' + ic("cube", "ico-sm") + ' <span>World streaming</span><span class="grow"></span>' + sgbadge(e.partition) + '</div>' +
    sgtoggle("Stream cells", "env.partition", e.partition, "Load only cells near the camera") +
    sgrow("Cell size", '<input class="slider" type="range" min="4" max="64" step="2" value="' + e.cell + '" data-sfield="env.cell"><span class="tiny muted">m</span>') +
    sgrow("Loaded radius", '<input class="slider" type="range" min="1" max="8" step="1" value="' + e.cellradius + '" data-sfield="env.cellradius"><span class="tiny muted">cells</span>') +
    '<div class="tiny muted">Cells in level ' + sgstats.cells + " · loaded " + sgstats.loaded + " of " + sgstats.items + " actors.</div></div>" +
    "</div>" +
    '<div class="emptyhint" style="margin-top:12px">These settings live on the level (World Settings → Rendering). They are saved with the project and applied in Play in viewport and in packaged builds.</div>';
  openmodal({
    title: "Rendering",
    icon: "settings",
    width: "wide",
    body: body,
    onmount: function (modal) {
      bindstudiofields(modal);
    },
    footer: '<button class="btn" data-mact="close">Done</button>',
    actions: {}
  });
}

function bindstudiofields(root) {
  if (!root) return;
  root.querySelectorAll("[data-sfield]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var path = inp.getAttribute("data-sfield");
      var parts = path.split(".");
      var obj = app.scene;
      for (var i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = obj[parts[i]] || {};
        obj = obj[parts[i]];
      }
      var last = parts[parts.length - 1];
      var v = inp.type === "checkbox" ? inp.checked : inp.type === "number" || inp.type === "range" ? parseFloat(inp.value) : inp.value;
      obj[last] = v;
      commit("rendering");
      root.querySelectorAll('[data-sfield="' + path + '"]').forEach(function (o) {
        if (o === inp) return;
        if (o.type === "checkbox") o.checked = !!v;
        else o.value = inp.value;
      });
    });
  });
}

function studioworld() {
  var e = sgenv();
  var cells = {};
  walk(app.scene.objects, function (n) {
    var cx = Math.floor((n.pos ? n.pos[0] : 0) / e.cell);
    var cy = Math.floor((n.pos ? n.pos[1] : 0) / e.cell);
    var key = cx + "," + cy;
    cells[key] = cells[key] || [];
    cells[key].push(n.name);
  });
  var keys = Object.keys(cells).sort();
  var rows = keys.map(function (k) {
    return '<div class="sgrow"><div class="k">Cell ' + k + '</div><div class="v"><span class="tiny muted">' + cells[k].length + " actors · " + esc(cells[k].slice(0, 3).join(", ")) + (cells[k].length > 3 ? "…" : "") + "</span></div></div>";
  }).join("");
  var body = '<div class="row" style="gap:8px;align-items:center;margin-bottom:10px"><span class="sgbadge sgon">World streaming</span><span class="tiny muted">' + keys.length + " cells · " + sgstats.items + " actors</span></div>" +
    sgtoggle("Enable streaming", "env.partition", e.partition, "") +
    sgrow("Cell size", '<input class="slider" type="range" min="4" max="64" step="2" value="' + e.cell + '" data-sfield="env.cell"><input class="inp num numin" type="number" value="' + e.cell + '" data-sfield="env.cell">') +
    sgrow("Streaming radius", '<input class="slider" type="range" min="1" max="8" step="1" value="' + e.cellradius + '" data-sfield="env.cellradius"><span class="tiny muted">cells</span>') +
    '<div class="sgdivider"></div><div class="tiny muted" style="margin:8px 0">Cell map</div>' + (rows || '<div class="emptyhint">No actors.</div>');
  openmodal({ title: "World streaming - Streaming", icon: "grid", width: "wide", body: body, footer: '<button class="btn" data-mact="close">Done</button>', onmount: function (m) { bindstudiofields(m); }, actions: {} });
}

function studiopanel(which) {
  sgboot();
  if (which === "rendering") return studiorendering();
  if (which === "world") return studioworld();
  if (which === "cine") return seqpanel();
  if (which === "fxgraph") return fxgraphpanel();
  if (which === "sound") return soundpanel();
  if (which === "solver") return solverpanel();
  if (which === "rig") return rigpanel();
  if (which === "net") return netpanel();
  if (which === "stats") return studioprofiler();
  if (which === "docs") return studiodocs();
}

function studioprofiler() {
  var body = '<div id="sglivestats">' + sgprofhtml() + "</div>" +
    '<div class="emptyhint" style="margin-top:10px">Live values from the renderer and the network stack, refreshed 5 times a second.</div>';
  openmodal({
    title: "Performance - Engine Stats",
    icon: "table",
    width: "wide",
    body: body,
    onmount: function () {
      studioprofiler.timer = setInterval(function () {
        var el = qs("#sglivestats");
        if (!el) {
          clearInterval(studioprofiler.timer);
          return;
        }
        el.innerHTML = sgprofhtml();
      }, 200);
    },
    footer: '<button class="btn" data-mact="close">Close</button>',
    actions: {}
  });
}

function sgprofhtml() {
  var e = sgenv();
  return sgcards([
    ["FPS", Math.round(fpsval || 0), "target 60"],
    ["Frame time", (1000 / Math.max(1, fpsval || 60)).toFixed(1) + " ms", ""],
    ["Actors", sgstats.items, sgstats.loaded + " loaded"],
    ["Triangles", sgstats.drawn.toLocaleString(), sgstats.tris.toLocaleString() + " virtualized"],
    ["shadow pages", sgstats.pages, e.csm ? "enabled" : "off"],
    ["Light samples", sgstats.samples, e.gi ? "GI on" : "off"],
    ["Effect graph", typeof fx !== "undefined" ? fx.list.length : 0, "particles"],
    ["Peers", netsys.on ? netsys.remotes.length + 1 : 0, netsys.on ? netsys.ping + " ms" : "offline"]
  ]);
}

function studiodocs() {
  var body = '<div class="docs-body" style="line-height:1.6;font-size:13.5px">' +
    '<h2 style="margin:0 0 6px">Roxumitod Game Engine</h2>' +
    '<div class="tiny muted" style="margin-bottom:14px">A realtime game editor that runs in the browser</div>' +
    '<h3>Core concepts</h3>' +
    '<p><b>Levels</b> hold <b>Actors</b>. Actors are built from <b>Components</b> (Static Mesh, Sprite Renderer, Collider, Rigid Body, Particle System, Audio). Select an actor in the <b>Outliner</b> to edit its components in <b>Details</b>.</p>' +
    '<h3>Framework</h3>' +
    '<ul><li><b>Outliner</b> - hierarchy of every actor in the level.</li><li><b>Content</b> - imported models, sprites, materials, audio.</li><li><b>Details</b> - component and transform editing for the selection.</li><li><b>Logic graph</b> - event graph logic attached to actors and levels.</li><li><b>Play in viewport</b> - simulate the level with networking, physics and audio.</li></ul>' +
    '<h3>Rendering</h3>' +
    '<p><b>Global illumination</b> adds indirect lighting from sky and ground samples and a bounce light. <b>Virtual geometry</b> virtualizes geometry with meshlet LOD and pixel culling. <b>Cascaded shadow maps</b> keep crisp contact shadows across two cascades. <b>World streaming</b> streams actor cells around the camera.</p>' +
    '<h3>Simulation</h3>' +
    '<p><b>Physics solver</b> solves rigid bodies with sub-stepping and supports geometry collection fracture. <b>Rig solver</b> evaluates analytic two-bone IK. <b>Effect graph</b> runs modular particle systems. <b>Audio graph</b> synthesises audio graphs at runtime. <b>Cinematic timeline</b> drives cinematic camera and actor tracks.</p>' +
    '<h3>World building</h3>' +
    '<p><b>Landscape</b> is a real heightmap terrain you sculpt with a brush in the viewport. <b>Foliage mode</b> paints instances onto the surface. <b>PCG</b> scatters deterministic procedural content into a group. <b>Data Layers</b> stream actor groups on and off, <b>Level Instances</b> save a selection as a prefab, and every actor has an optional LOD distance.</p>' +
    '<h3>Atmosphere and grading</h3>' +
    '<p><b>Sky Atmosphere</b> drives the sun vector, sky light and aerial perspective. <b>Volumetric clouds</b>, <b>water</b> with gerstner waves, <b>post process</b> exposure, bloom, vignette, grain, chromatic aberration, saturation, contrast and motion blur, and a <b>Lightmass</b> bake that traces sun occlusion per actor. Presets: day, dusk, night, storm.</p>' +
    '<h3>Cinematics</h3>' +
    '<p><b>Cine Camera</b> with focal length and f-stop drives depth of field. <b>Take Recorder</b> writes camera keys into <b>Cinematic timeline</b>. <b>Movie Render Queue</b> captures the viewport to WebM or exports a PNG still at the chosen resolution.</p>' +
    '<h3>Plugins</h3>' +
    '<p><b>Tools → Plugins</b> opens the plugin manager. Plugins add toolbar buttons, menu commands, widgets and event handlers through a sandboxed API, and can be enabled, disabled, exported and imported as <code>.unxplug</code> files.</p>' +
    '<h3>Multiplayer</h3>' +
    '<p><b>Online</b> is built on PeerJS over WebRTC. Host a session, share the room code, and clients join directly peer to peer. Actors are replicated at 20 Hz with client-side interpolation; RPCs deliver events and chat. Works in Play in viewport and in packaged HTML builds.</p>' +
    '<h3>Packaging</h3>' +
    '<p><b>File → Package Game</b> emits a single self-contained HTML file that loads three.js or faoxomjs from a CDN, with the same runtime as Play in viewport.</p>' +
    "</div>";
  openmodal({ title: "Documentation - Roxumitod Game Engine", icon: "book", width: "wide", body: body, footer: '<button class="btn" data-mact="close">Close</button>', actions: {} });
}

acts.studiopanel = function (name) {
  var raw = name && name.getAttribute ? name.getAttribute("data-act") : name;
  raw = String(raw || "");
  var which = raw.indexOf(":") >= 0 ? raw.split(":")[1] : raw;
  studiopanel(which);
};

acts.showoutliner = function () {
  app.dock = "objects";
  renderdock();
};

acts.showcontent = function () {
  app.dock = "files";
  renderdock();
};

acts.showlogic = function () {
  app.dock = "logic";
  renderdock();
};

acts.showdetails = function () {
  app.right = "inspector";
  renderright();
};

acts.showsettings = function () {
  app.right = "scene";
  renderright();
};

acts.fracture = function () {
  solverfracture();
};

acts.studiodocs = function () {
  studiodocs();
};

acts.studiosound = function () {
  studiopanel("sound");
};

acts.startnet = function () {
  netpanel();
};

acts.studiostats = function () {
  studiopanel("stats");
};

function sgsection() {
  var e = sgenv();
  var rows = "";
  rows += '<div class="frow"><div class="flabel">Global illumination</div><div class="fctrl">' + check("", e.gi, 'data-sfield="env.gi"') + '<span class="tiny muted">GI</span></div></div>';
  rows += sliderrow("Global illumination intensity", e.gistrength, 0, 1.5, 0.02, 'data-sfield="env.gistrength"');
  rows += '<div class="frow"><div class="flabel">Virtual geometry</div><div class="fctrl">' + check("", e.vgeo, 'data-sfield="env.vgeo"') + '<span class="tiny muted">virtual geometry</span></div></div>';
  rows += sliderrow("Virtual geometry LOD distance", e.vgeodist, 4, 60, 1, 'data-sfield="env.vgeodist"', false);
  rows += '<div class="frow"><div class="flabel">Cascaded shadow maps</div><div class="fctrl">' + check("", e.csm, 'data-sfield="env.csm"') + '<span class="tiny muted">cascaded</span></div></div>';
  rows += srow("Shadow resolution", '<select class="inp" data-sfield="env.csmres">' + [512, 1024, 2048, 4096].map(function (r) {
    return '<option value="' + r + '"' + (e.csmres === r ? " selected" : "") + ">" + r + " px</option>";
  }).join("") + "</select>");
  rows += '<div class="frow"><div class="flabel">World streaming</div><div class="fctrl">' + check("", e.partition, 'data-sfield="env.partition"') + '<span class="tiny muted">streaming</span></div></div>';
  rows += sliderrow("Cell size", e.cell, 4, 64, 2, 'data-sfield="env.cell"', false);
  rows += sliderrow("Loaded radius", e.cellradius, 1, 8, 1, 'data-sfield="env.cellradius"', false);
  rows += '<div class="frow"><div class="flabel">Physics solver</div><div class="fctrl">' + check("", e.solver, 'data-sfield="env.solver"') + '<span class="tiny muted">sub-steps</span></div></div>';
  rows += sliderrow("Physics solver sub-steps", e.solversub, 1, 12, 1, 'data-sfield="env.solversub"', false);
  rows += '<button class="addrow" data-act="studiopanel:rendering" style="margin-top:6px">Open rendering settings</button>';
  return '<div class="sec"><div class="sechead"><span class="tw">' + ic("chevd", "ico-xs") + '</span>' + ic("settings", "ico-sm") + '<span>Rendering</span><span class="tools"><span class="sgbadge sgon">UE5 stack</span></span></div><div class="secbody">' + rows + "</div></div>";
}
