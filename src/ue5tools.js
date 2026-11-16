function tergeo(n) {
  var seg = Math.max(4, Math.min(96, n.seg || 32));
  var size = n.size || 30;
  var h = n.heights;
  var pos = [];
  var idx = [];
  var step = size / seg;
  var half = size / 2;
  for (var z = 0; z <= seg; z++) {
    for (var x = 0; x <= seg; x++) {
      var hh = h && h.length ? h[z * (seg + 1) + x] || 0 : 0;
      pos.push(x * step - half, hh, z * step - half);
    }
  }
  for (var zz = 0; zz < seg; zz++) {
    for (var xx = 0; xx < seg; xx++) {
      var a = zz * (seg + 1) + xx;
      var b = a + 1;
      var c = a + seg + 1;
      var d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  return { pos: pos, idx: idx, seg: seg, size: size };
}

function terinit(n) {
  var seg = n.seg || 32;
  var count = (seg + 1) * (seg + 1);
  var arr = new Array(count);
  for (var i = 0; i < count; i++) arr[i] = 0;
  n.heights = arr;
  n.tver = (n.tver || 0) + 1;
  return n;
}

function terheight(n, x, z) {
  var seg = n.seg || 32;
  var size = n.size || 30;
  var gx = Math.round(((x + size / 2) / size) * seg);
  var gz = Math.round(((z + size / 2) / size) * seg);
  gx = Math.max(0, Math.min(seg, gx));
  gz = Math.max(0, Math.min(seg, gz));
  return n.heights[gz * (seg + 1) + gx] || 0;
}

function tersample(n, x, z) {
  var seg = n.seg || 32;
  var size = n.size || 30;
  var fx = ((x + size / 2) / size) * seg;
  var fz = ((z + size / 2) / size) * seg;
  var x0 = Math.max(0, Math.min(seg - 1, Math.floor(fx)));
  var z0 = Math.max(0, Math.min(seg - 1, Math.floor(fz)));
  var tx = fx - x0;
  var tz = fz - z0;
  var h00 = n.heights[z0 * (seg + 1) + x0] || 0;
  var h10 = n.heights[z0 * (seg + 1) + x0 + 1] || 0;
  var h01 = n.heights[(z0 + 1) * (seg + 1) + x0] || 0;
  var h11 = n.heights[(z0 + 1) * (seg + 1) + x0 + 1] || 0;
  return h00 * (1 - tx) * (1 - tz) + h10 * tx * (1 - tz) + h01 * (1 - tx) * tz + h11 * tx * tz;
}

function terbrush(n, x, z, radius, strength, mode) {
  var seg = n.seg || 32;
  var size = n.size || 30;
  var step = size / seg;
  for (var gz = 0; gz <= seg; gz++) {
    for (var gx = 0; gx <= seg; gx++) {
      var wx = gx * step - size / 2;
      var wz = gz * step - size / 2;
      var d = Math.hypot(wx - x, wz - z);
      if (d > radius) continue;
      var fall = 1 - d / radius;
      fall = fall * fall * (3 - 2 * fall);
      var i = gz * (seg + 1) + gx;
      if (mode === "smooth") n.heights[i] = n.heights[i] * (1 - fall * 0.35) + (n.heights[i] + 0) * 0;
      else if (mode === "flatten") n.heights[i] += (0 - n.heights[i]) * fall * 0.25 * strength;
      else n.heights[i] += strength * fall * 0.16;
      if (n.heights[i] < 0) n.heights[i] = 0;
    }
  }
  n.tver = (n.tver || 0) + 1;
}

function ternew() {
  var n = basenode("terrain", { pos: [0, -1.2, 0] });
  n.name = "Landscape";
  n.size = 60;
  n.seg = 48;
  n.color = "#4a7a37";
  n.amp = 4;
  n.scalez = 0.45;
  terinit(n);
  for (var i = 0; i < n.heights.length; i++) {
    var seg = n.seg;
    var gx = i % (seg + 1);
    var gz = Math.floor(i / (seg + 1));
    var dx = gx / seg - 0.5;
    var dz = gz / seg - 0.5;
    var r = Math.hypot(dx, dz);
    n.heights[i] = Math.max(0, (Math.sin(dx * 9) * Math.cos(dz * 7) * 0.5 + 0.5 - r * 1.1) * 2.2);
  }
  addnode(n, null);
  return n;
}

function tersculptmode(on) {
  var n = selected();
  if (!n || n.type !== "terrain") {
    toast("Select a landscape first");
    return;
  }
  app.sculpt = on ? { on: true, node: n, radius: app.sculptrad || 4, strength: app.sculptstr || 1, mode: app.sculptmode || "raise" } : null;
  toast(on ? "Sculpt mode - drag on the landscape" : "Sculpt mode off");
}

function terhitpt(sx, sy) {
  var st = app.camstate || camerastate();
  var ray = rayfromscreen(st, sx, sy, view.w, view.h);
  if (!ray) return null;
  var n = app.sculpt && app.sculpt.node;
  if (!n) return null;
  var w = worldpos(n);
  var d = ray.dir;
  var o = ray.origin;
  var t = d[1] === 0 ? -1 : (w[1] - o[1]) / d[1];
  if (t < 0) return null;
  var hx = o[0] + d[0] * t;
  var hz = o[2] + d[2] * t;
  return { x: hx - w[0], z: hz - w[2] };
}

function terbind() {
  var stage = qs("#stagewrap");
  if (!stage || stage.dataset.terbound) return;
  stage.dataset.terbound = "1";
  stage.addEventListener("pointerdown", function (ev) {
    if (!app.sculpt || !app.sculpt.on || ev.button !== 0) return;
    if (ev.target && ev.target.closest && ev.target.closest("button, input, select, .viewtools, .playui")) return;
    var r = qs("#stage").getBoundingClientRect();
    var pt = terhitpt(ev.clientX - r.left, ev.clientY - r.top);
    if (!pt) return;
    app.sculpt.painting = true;
    terbrush(app.sculpt.node, pt.x, pt.z, app.sculpt.radius, app.sculpt.strength * (ev.shiftKey ? -1 : 1), app.sculpt.mode);
    ev.stopPropagation();
  }, true);
  stage.addEventListener("pointermove", function (ev) {
    if (!app.sculpt || !app.sculpt.on || !app.sculpt.painting) return;
    var r = qs("#stage").getBoundingClientRect();
    var pt = terhitpt(ev.clientX - r.left, ev.clientY - r.top);
    if (!pt) return;
    terbrush(app.sculpt.node, pt.x, pt.z, app.sculpt.radius, app.sculpt.strength * (ev.shiftKey ? -1 : 1), app.sculpt.mode);
    ev.stopPropagation();
  }, true);
  window.addEventListener("pointerup", function () {
    if (app.sculpt && app.sculpt.painting) {
      app.sculpt.painting = false;
      commit("sculpt");
    }
  }, true);
}

function terpanel() {
  var n = selected();
  var ister = n && n.type === "terrain";
  var body = '<div class="modalter">';
  body += u5sec("Landscape", "Heightmap terrain, sculpted in the viewport",
    u5row("Size", '<input class="inp num" type="range" min="10" max="120" step="2" value="' + (ister ? n.size : 40) + '" data-ter="size">') +
    u5row("Resolution", '<input class="inp num" type="range" min="8" max="96" step="4" value="' + (ister ? n.seg : 40) + '" data-ter="seg">') +
    u5row("Material color", '<input class="inp swatch" type="color" value="' + (ister ? n.color : "#7fb35a") + '" data-ter="color">') +
    '<div class="u5btns"><button class="btn" data-teract="new">' + ic("hills", "ico-sm") + " New landscape</button>" +
    '<button class="btn ghost" data-teract="noise">Regenerate</button></div>');
  body += u5sec("Sculpt", "Brush strength and radius",
    u5row("Brush radius", '<input class="inp num" type="range" min="0.5" max="16" step="0.25" value="' + (app.sculptrad || 4) + '" data-ter="rad">') +
    u5row("Brush strength", '<input class="inp num" type="range" min="0.1" max="3" step="0.05" value="' + (app.sculptstr || 1) + '" data-ter="str">') +
    selectrow("Tool", ["raise", "lower", "smooth", "flatten"], app.sculptmode || "raise", 'data-ter="mode"') +
    '<div class="u5btns"><button class="btn' + (app.sculpt && app.sculpt.on ? " on" : "") + '" data-teract="sculpt">' + (app.sculpt && app.sculpt.on ? "Stop sculpting" : "Start sculpting") + "</button></div>" +
    '<div class="u5note">Drag on the landscape to raise. Hold Shift to lower. Sculpting writes real heightmap data.</div>');
  body += u5sec("Foliage Mode", "Paint instances of any asset on the surface",
    selectrow("Foliage asset", ["grass", "flowerred", "flowerpurple", "bush", "tree", "rock"], app.foliageasset || "grass", 'data-ter="asset"') +
    u5row("Density", '<input class="inp num" type="range" min="0.2" max="3" step="0.1" value="' + (app.foliageden || 1) + '" data-ter="den">') +
    u5row("Scale jitter", '<input class="inp num" type="range" min="0" max="1" step="0.05" value="' + (app.foliajitter === undefined ? 0.35 : app.foliajitter) + '" data-ter="jit">') +
    '<div class="u5btns"><button class="btn' + (app.foliage ? " on" : "") + '" data-teract="foliage">' + (app.foliage ? "Stop painting" : "Start painting") + "</button>" +
    '<button class="btn ghost" data-teract="foliageclear">Clear</button></div>');
  body += "</div>";
  openmodal({
    title: "Landscape & Foliage",
    icon: "hills",
    width: "wide",
    body: body,
    onmount: function (m) {
      terbindsimple(m);
      if (!ister) {
        var first = terfirst();
        if (first) terupdate(m, first);
      }
    }
  });
}

function terfirst() {
  var found = null;
  walk(app.scene.objects, function (n) {
    if (!found && n.type === "terrain") found = n;
  });
  return found;
}

function terupdate(root, n) {
  if (!root || !n) return;
  root.querySelectorAll('[data-ter="size"]').forEach(function (o) {
    o.value = n.size;
  });
  root.querySelectorAll('[data-ter="seg"]').forEach(function (o) {
    o.value = n.seg;
  });
  root.querySelectorAll('[data-ter="color"]').forEach(function (o) {
    o.value = n.color;
  });
}

function terbindsimple(root) {
  if (!root) return;
  root.querySelectorAll("[data-ter]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var f = inp.getAttribute("data-ter");
      var v = inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
      var n = selected();
      if (f === "size" || f === "seg" || f === "color") {
        if (!n || n.type !== "terrain") {
          var t = terfirst();
          if (!t) return;
          n = t;
        }
        if (f === "seg") {
          n.seg = v;
          terinit(n);
        } else n[f] = v;
        commit("landscape");
      } else if (f === "rad") app.sculptrad = v;
      else if (f === "str") app.sculptstr = v;
      else if (f === "mode") {
        app.sculptmode = v;
      } else if (f === "asset") app.foliageasset = v;
      else if (f === "den") app.foliageden = v;
      else if (f === "jit") app.foliajitter = v;
      if (app.sculpt) {
        app.sculpt.radius = app.sculptrad || 4;
        app.sculpt.strength = app.sculptstr || 1;
        app.sculpt.mode = app.sculptmode || "raise";
      }
    });
  });
  root.querySelectorAll("[data-teract]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var a = btn.getAttribute("data-teract");
      if (a === "new") {
        ternew();
        closemodal();
        setTimeout(function () {
          terpanel();
        }, 120);
      } else if (a === "noise") {
        var n = selected();
        if (n && n.type === "terrain") {
          for (var i = 0; i < n.heights.length; i++) {
            var seg = n.seg;
            var gx = i % (seg + 1);
            var gz = Math.floor(i / (seg + 1));
            var dx = gx / seg - 0.5;
            var dz = gz / seg - 0.5;
            n.heights[i] = Math.max(0, (Math.sin(dx * 11 + Math.random() * 0.4) * Math.cos(dz * 9)) * 2.4 + Math.random() * 0.3);
          }
          n.tver = (n.tver || 0) + 1;
          commit("regenerate");
        }
      } else if (a === "sculpt") {
        tersculptmode(!(app.sculpt && app.sculpt.on));
        closemodal();
        setTimeout(function () {
          terpanel();
        }, 120);
      } else if (a === "foliage") {
        foliagepaint(!app.foliage);
        closemodal();
        setTimeout(function () {
          terpanel();
        }, 120);
      } else if (a === "foliageclear") {
        foliageclear();
      }
    });
  });
}

function foliagepick() {
  var map = {
    grass: { type: "plane", color: "#61a84a", s: 0.8 },
    flowerred: { type: "sphere", color: "#e0554a", s: 0.22 },
    flowerpurple: { type: "sphere", color: "#a463d8", s: 0.22 },
    bush: { type: "sphere", color: "#376f3a", s: 0.9 },
    tree: { type: "cylinder", color: "#7b5a35", s: 1.6 },
    rock: { type: "sphere", color: "#8d8f94", s: 0.55 }
  };
  return map[app.foliageasset || "grass"] || map.grass;
}

function foliagepaint(on) {
  app.foliage = on ? { on: true, group: app.foliagesel || null } : null;
  toast(on ? "Foliage paint - drag on the ground" : "Foliage paint off");
  refreshall();
}

function foliageat(sx, sy) {
  var st = app.camstate || camerastate();
  var ray = rayfromscreen(st, sx, sy, view.w, view.h);
  if (!ray) return null;
  var best = null;
  var t = ray.dir[1] < -0.0001 ? -ray.origin[1] / ray.dir[1] : -1;
  if (t > 0) best = { x: ray.origin[0] + ray.dir[0] * t, y: 0, z: ray.origin[2] + ray.dir[2] * t };
  var ter = terfirst();
  if (ter) {
    var w = worldpos(ter);
    var tt = ray.dir[1] < -0.0001 ? (w[1] - ray.origin[1]) / ray.dir[1] : -1;
    if (tt > 0) {
      var px = ray.origin[0] + ray.dir[0] * tt - w[0];
      var pz = ray.origin[2] + ray.dir[2] * tt - w[2];
      if (Math.abs(px) < ter.size / 2 && Math.abs(pz) < ter.size / 2) {
        var hy = tersample(ter, px, pz) * (ter.scalez || 1);
        if (!best || Math.abs(tt) < Math.abs(t)) best = { x: w[0] + px, y: w[1] + hy, z: w[2] + pz };
      }
    }
  }
  return best;
}

function foliageput(x, y, z) {
  var spec = foliagepick();
  var n = basenode(spec.type, { pos: [x, y + spec.s * 0.5, z] });
  var jit = app.foliajitter === undefined ? 0.35 : app.foliajitter;
  var sc = spec.s * (1 + (Math.random() - 0.5) * jit * 1.4);
  n.scl = [sc, sc * (spec.type === "plane" ? 1.4 : 1), sc];
  n.rot = [0, Math.random() * 360, 0];
  n.color = spec.color;
  n.foliage = true;
  n.name = "Foliage " + (app.foliageasset || "grass");
  n.tags = ["foliage"];
  app.scene.objects.push(n);
  app.foliagen = (app.foliagen || 0) + 1;
  return n;
}

function foliagebind() {
  var stage = qs("#stagewrap");
  if (!stage || stage.dataset.folbound) return;
  stage.dataset.folbound = "1";
  var painting = false;
  stage.addEventListener("pointerdown", function (ev) {
    if (!app.foliage || !app.foliage.on || ev.button !== 0) return;
    if (ev.target && ev.target.closest && ev.target.closest("button, input, select, .viewtools, .playui")) return;
    var r = qs("#stage").getBoundingClientRect();
    var hit = foliageat(ev.clientX - r.left, ev.clientY - r.top);
    if (!hit) return;
    painting = true;
    foliageput(hit.x, hit.y, hit.z);
    app.dirty = true;
    ev.stopPropagation();
  }, true);
  stage.addEventListener("pointermove", function (ev) {
    if (!painting || !app.foliage) return;
    if ((app.foliagen || 0) % 3 !== 0) {
      app.foliagen = (app.foliagen || 0) + 1;
      return;
    }
    app.foliagen = (app.foliagen || 0) + 1;
    var r = qs("#stage").getBoundingClientRect();
    var hit = foliageat(ev.clientX - r.left, ev.clientY - r.top);
    if (hit) foliageput(hit.x, hit.y, hit.z);
    ev.stopPropagation();
  }, true);
  window.addEventListener("pointerup", function () {
    if (painting) {
      painting = false;
      commit("foliage");
    }
  }, true);
}

function foliageclear() {
  var remove = [];
  walk(app.scene.objects, function (n) {
    if (n.foliage) remove.push(n);
  });
  remove.forEach(function (n) {
    var pl = parentlistof(n.id);
    if (pl) pl.list.splice(pl.index, 1);
  });
  commit("clear foliage");
  toast("Removed " + remove.length + " foliage instances", "ok");
}

function pcgrun() {
  var spec = app.pcg || {};
  var count = spec.count || 40;
  var radius = spec.radius || 8;
  var smin = spec.smin === undefined ? 0.6 : spec.smin;
  var smax = spec.smax === undefined ? 1.4 : spec.smax;
  var seed = spec.seed === undefined ? 3 : spec.seed;
  var type = spec.type || "cube";
  var color = spec.color || "#c8b48a";
  var pattern = spec.pattern || "random";
  var rnd = seedrand(seed);
  var group = basenode("empty", { pos: [app.cam.target[0], 0, app.cam.target[2]] });
  group.name = "PCG " + type;
  var made = 0;
  for (var i = 0; i < count; i++) {
    var a = rnd() * Math.PI * 2;
    var rr = pattern === "ring" ? radius * (0.82 + rnd() * 0.18) : pattern === "grid" ? radius * 0.9 : Math.sqrt(rnd()) * radius;
    var x;
    var z;
    if (pattern === "grid") {
      var side = Math.ceil(Math.sqrt(count));
      x = ((i % side) / Math.max(1, side - 1) - 0.5) * radius * 2;
      z = (Math.floor(i / side) / Math.max(1, side - 1) - 0.5) * radius * 2;
    } else {
      x = Math.cos(a) * rr;
      z = Math.sin(a) * rr;
    }
    var ter = terfirst();
    var y = 0;
    if (ter) {
      var w = worldpos(ter);
      if (Math.abs(x - w[0]) < ter.size / 2 && Math.abs(z - w[2]) < ter.size / 2) y = w[1] + tersample(ter, x - w[0], z - w[2]) * (ter.scalez || 1);
    }
    var n = basenode(type, { pos: [x, y + 0.5, z] });
    var s = smin + rnd() * (smax - smin);
    n.scl = [s, s, s];
    n.rot = [0, rnd() * 360, 0];
    n.color = color;
    n.name = "PCG " + type;
    group.children.push(n);
    made++;
  }
  addnode(group, null);
  toast("PCG built " + made + " instances", "ok");
}

function seedrand(seed) {
  var s = seed || 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pcgpanel() {
  var s = app.pcg || {};
  var body = '<div class="modalpcg">';
  body += u5sec("Procedural Content Generation", "Scatter generated content with deterministic seeds",
    selectrow("Pattern", ["random", "ring", "grid"], s.pattern || "random", 'data-pcg="pattern"') +
    selectrow("Asset", [{ value: "cube", label: "Cube" }, { value: "sphere", label: "Sphere" }, { value: "cylinder", label: "Cylinder" }, { value: "cone", label: "Cone" }, { value: "torus", label: "Torus" }], s.type || "cube", 'data-pcg="type"') +
    u5row("Count", '<input class="inp num" type="range" min="1" max="300" step="1" value="' + (s.count || 40) + '" data-pcg="count">') +
    u5row("Radius", '<input class="inp num" type="range" min="1" max="60" step="1" value="' + (s.radius || 8) + '" data-pcg="radius">') +
    u5row("Scale min", '<input class="inp num" type="range" min="0.1" max="3" step="0.05" value="' + (s.smin === undefined ? 0.6 : s.smin) + '" data-pcg="smin">') +
    u5row("Scale max", '<input class="inp num" type="range" min="0.1" max="4" step="0.05" value="' + (s.smax === undefined ? 1.4 : s.smax) + '" data-pcg="smax">') +
    u5row("Seed", '<input class="inp num" type="number" min="1" max="99999" step="1" value="' + (s.seed || 3) + '" data-pcg="seed">') +
    u5row("Color", '<input class="inp swatch" type="color" value="' + (s.color || "#c8b48a") + '" data-pcg="color">'));
  body += '<div class="u5btns"><button class="btn" data-pcgact="build">' + ic("sparkle", "ico-sm") + " Generate</button></div>";
  body += '<div class="u5note">Generated actors land in a PCG group so you can move, lock or delete them as one.</div>';
  body += "</div>";
  openmodal({
    title: "PCG - Procedural Content Generation",
    icon: "sparkle",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-pcg]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-pcg");
          app.pcg = app.pcg || {};
          app.pcg[f] = inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
        });
      });
      m.querySelector("[data-pcgact]").addEventListener("click", function () {
        pcgrun();
        closemodal();
      });
    }
  });
}

function layerlist() {
  var set = {};
  walk(app.scene.objects, function (n) {
    if (n.layer) set[n.layer] = (set[n.layer] || 0) + 1;
  });
  return set;
}

function layerpanel() {
  var list = layerlist();
  var keys = Object.keys(list);
  var body = '<div class="modallayer">';
  var layerhtml = keys.length ? keys.map(function (k) {
    var off = app.hiddenlayers && app.hiddenlayers[k];
    return '<div class="u5row"><span class="u5lbl">' + esc(k) + " \u00b7 " + list[k] + " actors</span>" +
      '<span class="u5btns"><button class="btn ghost' + (off ? "" : " on") + '" data-layer="' + esc(k) + '">' + (off ? "Hidden" : "Visible") + "</button></span></div>";
  }).join("") : '<div class="u5note">No data layers yet. Assign the selected actors to a layer below.</div>';
  layerhtml += '<div class="u5btns"><button class="btn" data-layeract="assign">Assign selection to new layer</button></div>';
  body += u5sec("Data Layers", "Stream groups of actors on and off", layerhtml);
  body += u5sec("Level Instances", "Save a selection as a prefab and place copies",
    '<div class="u5btns"><button class="btn" data-layeract="prefab">Save selection as prefab</button></div>' +
    (app.project.prefabs && app.project.prefabs.length ? app.project.prefabs.map(function (p, i) {
      return '<div class="u5row"><span class="u5lbl">' + esc(p.name) + " · " + p.nodes.length + ' actors</span><span class="u5btns"><button class="btn ghost" data-prefab="' + i + '">Place</button></span></div>';
    }).join("") : '<div class="u5note">No prefabs saved yet.</div>'));
  body += u5sec("Level of Detail", "Distance based culling per actor",
    u5row("LOD distance", '<input class="inp num" type="range" min="0" max="120" step="1" value="' + (selected() && selected().lodfar || 60) + '" data-layer="lod">') +
    '<div class="u5btns"><button class="btn ghost" data-layeract="lodapply">Apply to selection</button><button class="btn ghost" data-layeract="lodclear">Clear</button></div>');
  body += "</div>";
  openmodal({
    title: "World - Data Layers, Prefabs & LOD",
    icon: "layers",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-layer]").forEach(function (b) {
        if (b.tagName !== "BUTTON") return;
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-layer");
          app.hiddenlayers = app.hiddenlayers || {};
          app.hiddenlayers[k] = !app.hiddenlayers[k];
          layerapply();
          closemodal();
          setTimeout(layerpanel, 120);
        });
      });
      m.querySelectorAll("[data-prefab]").forEach(function (b) {
        b.addEventListener("click", function () {
          prefabplace(parseInt(b.getAttribute("data-prefab"), 10));
          closemodal();
        });
      });
      m.querySelectorAll("[data-layeract]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-layeract");
          if (a === "assign") {
            var name = "Layer " + (Object.keys(layerlist()).length + 1);
            selectionnodes().forEach(function (n) {
              n.layer = name;
            });
            commit("assign layer");
            closemodal();
            setTimeout(layerpanel, 120);
          } else if (a === "prefab") prefabsave();
          else if (a === "lodapply") {
            var v = parseFloat(m.querySelector('[data-layer="lod"]').value);
            selectionnodes().forEach(function (n) {
              n.lodfar = v;
            });
            commit("lod");
            toast("LOD distance " + v + " applied", "ok");
          } else if (a === "lodclear") {
            selectionnodes().forEach(function (n) {
              delete n.lodfar;
            });
            commit("lod");
          }
        });
      });
    }
  });
}

function layerapply() {
  walk(app.scene.objects, function (n) {
    if (!n.layer) return;
    if (app.hiddenlayers && app.hiddenlayers[n.layer]) n.visible = false;
    else if (n.visible === false) n.visible = true;
  });
  refreshall();
}

function prefabsave() {
  var sel = selectionnodes();
  if (!sel.length) {
    toast("Select actors first");
    return;
  }
  app.project.prefabs = app.project.prefabs || [];
  app.project.prefabs.push({ name: "Prefab " + (app.project.prefabs.length + 1), nodes: deep(sel) });
  commit("save prefab");
  closemodal();
  toast("Saved prefab with " + sel.length + " actors", "ok");
  setTimeout(layerpanel, 120);
}

function prefabplace(i) {
  var p = (app.project.prefabs || [])[i];
  if (!p) return;
  var made = [];
  p.nodes.forEach(function (src) {
    var copy = deep(src);
    copy.id = newid();
    copy.pos[0] += 3;
    copy.pos[2] += 3;
    copy.name = uniqueid(app.scene.objects, copy.name);
    app.scene.objects.push(copy);
    made.push(copy);
  });
  app.selids = made.map(function (n) {
    return n.id;
  });
  app.selid = made.length ? made[0].id : null;
  commit("place prefab");
  toast("Placed " + made.length + " actors", "ok");
}

function loddist(n) {
  var w = worldpos(n);
  var st = app.camstate || camerastate();
  return Math.hypot(w[0] - st.eye[0], w[1] - st.eye[1], w[2] - st.eye[2]);
}

function toolboot() {
  terbind();
  foliagebind();
}

var sculptz = 1;
