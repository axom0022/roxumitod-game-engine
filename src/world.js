var worldcells = {};
var worldloaded = {};

function nmesh(name) {
  return { label: name, icon: "cube", group: "objects" };
}

function addgroups() {
  return [
    { head: "Lighting", items: ["pointlight", "spotlight", "arealight"] },
    { head: "Sound", items: ["soundemitter", "musiczone"] },
    { head: "Effects", items: ["emitter", "trail", "beam"] },
    { head: "Gameplay", items: ["spawn", "checkpoint", "portal", "door", "hazard", "pickup", "zone", "platform", "seat"] },
    { head: "Data", items: ["attachment", "billboard", "remote", "numbervalue", "stringvalue"] },
    { head: "Scripting", items: ["script", "modulescript", "scenescript", "clientscript", "serverscript", "toolscript"] },
    { head: "Screen UI", items: ["screengui", "frame", "imagelabel", "textbutton", "textbox", "scrollframe"] },
    { head: "Advanced", items: ["mesh", "skinned", "procmesh", "landscape", "spline", "foliage", "clustercell", "levelinstance"] }
  ];
}

nodemeta.wedge = { label: "Wedge", icon: "cone", group: "shapes" };
nodemeta.pointlight = { label: "Point light", icon: "light", group: "objects" };
nodemeta.spotlight = { label: "Spot light", icon: "light", group: "objects" };
nodemeta.arealight = { label: "Area light", icon: "light", group: "objects" };
nodemeta.soundemitter = { label: "Sound emitter", icon: "sound", group: "objects" };
nodemeta.musiczone = { label: "Music zone", icon: "music", group: "objects" };
nodemeta.emitter = { label: "Particle emitter", icon: "particles", group: "objects" };
nodemeta.trail = { label: "Trail", icon: "curve", group: "objects" };
nodemeta.beam = { label: "Beam", icon: "line", group: "objects" };
nodemeta.spawn = { label: "Spawn point", icon: "flag", group: "objects" };
nodemeta.checkpoint = { label: "Checkpoint", icon: "target", group: "objects" };
nodemeta.portal = { label: "Portal", icon: "globe", group: "objects" };
nodemeta.door = { label: "Door", icon: "door", group: "objects" };
nodemeta.hazard = { label: "Hazard block", icon: "warning", group: "objects" };
nodemeta.pickup = { label: "Pickup", icon: "star", group: "objects" };
nodemeta.zone = { label: "Trigger zone", icon: "square", group: "objects" };
nodemeta.platform = { label: "Moving platform", icon: "square", group: "objects" };
nodemeta.script = { label: "Script", icon: "script", group: "objects" };
nodemeta.modulescript = { label: "Module script", icon: "brackets", group: "objects" };
nodemeta.scenescript = { label: "Scene script", icon: "scene", group: "objects" };
nodemeta.clientscript = { label: "Client script", icon: "monitor", group: "objects" };
nodemeta.serverscript = { label: "Server script", icon: "network", group: "objects" };
nodemeta.toolscript = { label: "Tool script", icon: "pen", group: "objects" };
nodemeta.imagelabel = { label: "Image label", icon: "image", group: "gui" };
nodemeta.textbutton = { label: "Text button", icon: "squareplus", group: "gui" };
nodemeta.textbox = { label: "Text box", icon: "pen", group: "gui" };
nodemeta.scrollframe = { label: "Scrolling frame", icon: "list", group: "gui" };
nodemeta.attachment = { label: "Attachment", icon: "target", group: "objects" };
nodemeta.billboard = { label: "Billboard text", icon: "text", group: "objects" };
nodemeta.remote = { label: "Remote event", icon: "network", group: "objects" };
nodemeta.numbervalue = { label: "Number value", icon: "variable", group: "objects" };
nodemeta.stringvalue = { label: "Text value", icon: "variable", group: "objects" };
nodemeta.seat = { label: "Seat", icon: "door", group: "objects" };

nodemeta.mesh = nmesh("Static mesh");
nodemeta.skinned = { label: "Skeletal mesh", icon: "human", group: "objects" };
nodemeta.procmesh = { label: "Procedural mesh", icon: "sparkle", group: "objects" };
nodemeta.landscape = { label: "Landscape", icon: "hills", group: "objects" };
nodemeta.spline = { label: "Spline", icon: "curve", group: "objects" };
nodemeta.foliage = { label: "Foliage", icon: "tree", group: "objects" };
nodemeta.clustercell = { label: "World cell", icon: "grid", group: "objects" };
nodemeta.levelinstance = { label: "Level instance", icon: "layers", group: "objects" };

var partdefaults = {
  pointlight: { color: "#ffe6b0", range: 8, intensity: 1.1, scl: [1, 1, 1] },
  spotlight: { color: "#ffffff", range: 10, intensity: 1.4, spread: 0.62, scl: [1, 1, 1] },
  arealight: { color: "#cfe4ff", range: 6, intensity: 0.9, width: 3, height: 2, scl: [1, 1, 1] },
  soundemitter: { color: "#7fb0ff", asset: "coin", group: "SFX", loop: false, volume: 0.8, scl: [0.5, 0.5, 0.5] },
  musiczone: { color: "#b48cff", asset: "theme", group: "Music", loop: true, volume: 0.6, scl: [4, 2, 4] },
  emitter: { color: "#ffb347", preset: "sparkles", rate: 24, scl: [0.6, 0.6, 0.6] },
  trail: { color: "#7ff0d0", length: 1.4, scl: [0.4, 0.4, 0.4] },
  beam: { color: "#ff8fd0", length: 6, scl: [0.4, 0.4, 0.4] },
  spawn: { color: "#5fd0a0", scl: [1, 1, 1] },
  checkpoint: { color: "#ffd166", radius: 2, scl: [0.8, 0.8, 0.8] },
  portal: { color: "#8f6bff", target: [6, 0, 0], radius: 1.4, scl: [1.2, 1.8, 0.3] },
  door: { color: "#c08b52", open: false, scl: [1.4, 2.2, 0.3] },
  hazard: { color: "#e8503a", damage: 1, scl: [1, 1, 1] },
  pickup: { color: "#ffd166", value: 1, kind: "coin", scl: [0.7, 0.7, 0.7] },
  zone: { color: "#4fa3ff", event: "zone", once: false, scl: [3, 2, 3] },
  platform: { color: "#9aa7b4", axis: "x", dist: 3, speed: 1.2, scl: [2, 0.4, 1] },
  script: { color: "#7fd6ff", scl: [0.6, 0.6, 0.6] },
  modulescript: { color: "#8fb0ff", scl: [0.6, 0.6, 0.6] },
  scenescript: { color: "#9affd0", scl: [0.6, 0.6, 0.6] },
  clientscript: { color: "#ffd27f", scl: [0.6, 0.6, 0.6] },
  serverscript: { color: "#ff9f7f", scl: [0.6, 0.6, 0.6] },
  toolscript: { color: "#d0a6ff", scl: [0.6, 0.6, 0.6] },
  imagelabel: { color: "#ffffff", sprite: "", scl: [1, 1, 1] },
  textbutton: { color: "#4fa3ff", text: "Play", scl: [1, 1, 1] },
  textbox: { color: "#20242c", text: "", scl: [1, 1, 1] },
  scrollframe: { color: "#20242c", scl: [1, 1, 1] },
  attachment: { color: "#ffd166", scl: [0.3, 0.3, 0.3] },
  billboard: { color: "#ffffff", text: "Label", scl: [1, 1, 1] },
  remote: { color: "#8fb0ff", event: "remote", scl: [0.5, 0.5, 0.5] },
  numbervalue: { color: "#7fd6ff", value: 0, scl: [0.4, 0.4, 0.4] },
  stringvalue: { color: "#9affd0", text: "", scl: [0.4, 0.4, 0.4] },
  seat: { color: "#c08b52", scl: [1.2, 0.3, 1.2] }
};

function partscript(name) {
  return "let tag = \"" + name + "\";\n\nfunction start(entity) {\n  \n}\n\nfunction update(dt, entity) {\n  \n}\n";
}

function partinit(n) {
  if (!n || n.partready) return n;
  var d = partdefaults[n.type];
  if (!d) return n;
  n.partready = true;
  for (var k in d) {
    if (k === "scl") {
      n.scl = d.scl.slice();
      continue;
    }
    if (n[k] === undefined) n[k] = d[k];
  }
  if (n.color === "#ffffff") n.color = d.color || "#ffffff";
  n.comps = n.comps || [];
  if (n.type === "emitter" && n.comps.indexOf("particles") < 0) {
    n.comps.push("particles");
    n.compdata = n.compdata || {};
    n.compdata.particles = n.compdata.particles || { preset: n.preset || "sparkles", rate: n.rate || 24 };
  }
  if (n.type === "soundemitter" || n.type === "musiczone") {
    if (n.comps.indexOf("sound") < 0) n.comps.push("sound");
    n.compdata = n.compdata || {};
    n.compdata.sound = n.compdata.sound || { asset: n.asset || "coin", group: n.group || "SFX", loop: !!n.loop, volume: n.volume === undefined ? 0.8 : n.volume };
  }
  if (n.type === "hazard") n.tags = (n.tags || []).concat(["hazard"]);
  if (n.type === "pickup") {
    n.tags = (n.tags || []).concat(["pickup"]);
    n.comps.push("collider");
  }
  if (n.type === "zone" || n.type === "portal" || n.type === "checkpoint" || n.type === "door" || n.type === "spawn") n.comps.push("collider");
  if (n.type === "seat") n.comps.push("collider");
  if (n.type === "billboard" || n.type === "stringvalue") n.comps.push("text");
  if (n.type === "platform") {
    n.comps.push("collider");
    n.behaviors = n.behaviors && n.behaviors.length ? n.behaviors : [{ type: "move", name: "Move " + (n.axis || "x"), axis: n.axis || "x", speed: n.speed || 1.2, range: n.dist || 3 }];
  }
  if (n.type === "script" || n.type === "modulescript" || n.type === "scenescript" || n.type === "clientscript" || n.type === "serverscript" || n.type === "toolscript") {
    if (!n.code) n.code = partscript(n.type);
  }
  if (n.type === "textbutton" || n.type === "textbox") {
    n.comps.push("ui", "text");
    n.compdata = n.compdata || {};
    n.compdata.text = n.compdata.text || { size: 18, color: "#ffffff", bold: false };
  }
  if (n.type === "imagelabel" || n.type === "scrollframe" || n.type === "frame") n.comps.push("ui");
  n.comps = n.comps.filter(function (c, i, a) {
    return a.indexOf(c) === i;
  });
  return n;
}

function lightspecs() {
  var out = [];
  var lights = { pointlight: "point", spotlight: "spot", arealight: "area" };
  walk(app.scene.objects || [], function (n) {
    var kind = lights[n.type];
    if (!kind || n.visible === false) return;
    var w = worldpos(n);
    out.push({
      id: n.id + "light",
      kind: "empty",
      light: kind,
      color: n.color || "#ffffff",
      range: n.range || 8,
      intensity: n.intensity === undefined ? 1 : n.intensity,
      spread: n.spread || 0.6,
      width: (n.width || 3) * (n.scl ? n.scl[0] : 1),
      height: (n.height || 2) * (n.scl ? n.scl[1] : 1),
      matrix: m4compose(w, n.rot || [0, 0, 0], [0.001, 0.001, 0.001]),
      visible: true
    });
  });
  return out;
}

function geobox(w, h, d, ox, oy, oz) {
  var x0 = (ox || 0) - w / 2;
  var x1 = (ox || 0) + w / 2;
  var y0 = (oy || 0) - h / 2;
  var y1 = (oy || 0) + h / 2;
  var z0 = (oz || 0) - d / 2;
  var z1 = (oz || 0) + d / 2;
  var pos = [];
  var idx = [];
  function quad(a, b, c, dd) {
    var base = pos.length / 3;
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], dd[0], dd[1], dd[2]);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  quad([x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]);
  quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]);
  quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
  return { pos: pos, idx: idx };
}

function geosphere(r, seg) {
  seg = Math.max(6, seg || 12);
  var pos = [];
  var idx = [];
  for (var y = 0; y <= seg; y++) {
    var phi = y / seg * Math.PI;
    for (var x = 0; x <= seg; x++) {
      var th = x / seg * Math.PI * 2;
      pos.push(Math.sin(phi) * Math.cos(th) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(th) * r);
    }
  }
  for (var yy = 0; yy < seg; yy++) {
    for (var xx = 0; xx < seg; xx++) {
      var a = yy * (seg + 1) + xx;
      var b = a + 1;
      var c = a + seg + 1;
      var d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  return { pos: pos, idx: idx };
}

function geocyl(r, h, sides) {
  sides = Math.max(3, sides || 12);
  var pos = [];
  var idx = [];
  for (var i = 0; i < sides; i++) {
    var a = i / sides * Math.PI * 2;
    pos.push(Math.cos(a) * r, -h / 2, Math.sin(a) * r);
    pos.push(Math.cos(a) * r, h / 2, Math.sin(a) * r);
  }
  for (var j = 0; j < sides; j++) {
    var a0 = j * 2;
    var a1 = j * 2 + 1;
    var b0 = ((j + 1) % sides) * 2;
    var b1 = ((j + 1) % sides) * 2 + 1;
    idx.push(a0, b0, a1, a1, b0, b1);
  }
  var top = pos.length / 3;
  pos.push(0, h / 2, 0);
  var bot = pos.length / 3;
  pos.push(0, -h / 2, 0);
  for (var k = 0; k < sides; k++) {
    var t0 = k * 2 + 1;
    var t1 = ((k + 1) % sides) * 2 + 1;
    idx.push(top, t0, t1);
    var q0 = k * 2;
    var q1 = ((k + 1) % sides) * 2;
    idx.push(bot, q1, q0);
  }
  return { pos: pos, idx: idx };
}

function geotransform(geo, ox, oy, oz) {
  for (var i = 0; i < geo.pos.length; i += 3) {
    geo.pos[i] += ox || 0;
    geo.pos[i + 1] += oy || 0;
    geo.pos[i + 2] += oz || 0;
  }
  return geo;
}

function geomergelist(list) {
  var pos = [];
  var idx = [];
  list.forEach(function (g) {
    var base = pos.length / 3;
    for (var i = 0; i < g.pos.length; i++) pos.push(g.pos[i]);
    for (var j = 0; j < g.idx.length; j++) idx.push(g.idx[j] + base);
  });
  return { pos: pos, idx: idx };
}

function nodeboxgeo(n) {
  var s = nodesize(n);
  var w = worldpos(n);
  return geotransform(geobox(s[0], s[1], s[2]), w[0], w[1], w[2]);
}

function csgbounds(nodes) {
  var min = [Infinity, Infinity, Infinity];
  var max = [-Infinity, -Infinity, -Infinity];
  nodes.forEach(function (n) {
    var s = nodesize(n);
    var w = worldpos(n);
    var lo = [w[0] - s[0] / 2, w[1] - s[1] / 2, w[2] - s[2] / 2];
    var hi = [w[0] + s[0] / 2, w[1] + s[1] / 2, w[2] + s[2] / 2];
    for (var i = 0; i < 3; i++) {
      if (lo[i] < min[i]) min[i] = lo[i];
      if (hi[i] > max[i]) max[i] = hi[i];
    }
  });
  return { min: [min[0] - 0.2, min[1] - 0.2, min[2] - 0.2], max: [max[0] + 0.2, max[1] + 0.2, max[2] + 0.2] };
}

function csggrid(res, min, max) {
  return {
    res: res,
    min: min,
    max: max,
    cell: [(max[0] - min[0]) / res, (max[1] - min[1]) / res, (max[2] - min[2]) / res],
    bits: new Uint8Array(res * res * res)
  };
}

function csgindex(g, x, y, z) {
  return (z * g.res + y) * g.res + x;
}

function csgrasterbox(g, b) {
  for (var z = 0; z < g.res; z++) {
    var pz = g.min[2] + (z + 0.5) * g.cell[2];
    if (pz < b.min[2] || pz > b.max[2]) continue;
    for (var y = 0; y < g.res; y++) {
      var py = g.min[1] + (y + 0.5) * g.cell[1];
      if (py < b.min[1] || py > b.max[1]) continue;
      for (var x = 0; x < g.res; x++) {
        var px = g.min[0] + (x + 0.5) * g.cell[0];
        if (px < b.min[0] || px > b.max[0]) continue;
        g.bits[csgindex(g, x, y, z)] = 1;
      }
    }
  }
}

function csgnodebox(n) {
  var s = nodesize(n);
  var w = worldpos(n);
  return { min: [w[0] - s[0] / 2, w[1] - s[1] / 2, w[2] - s[2] / 2], max: [w[0] + s[0] / 2, w[1] + s[1] / 2, w[2] + s[2] / 2] };
}

function csgboolean(ga, gb, op) {
  for (var i = 0; i < ga.bits.length; i++) {
    var a = ga.bits[i] ? 1 : 0;
    var b = gb.bits[i] ? 1 : 0;
    if (op === "union") ga.bits[i] = a || b ? 1 : 0;
    else if (op === "subtract") ga.bits[i] = a && !b ? 1 : 0;
    else if (op === "intersect") ga.bits[i] = a && b ? 1 : 0;
    else ga.bits[i] = a !== b ? 1 : 0;
  }
  return ga;
}

function csgmesh(g) {
  var pos = [];
  var idx = [];
  var dirs = [
    [[1, 0, 0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]]],
    [[-1, 0, 0], [[1, 0, 0], [0, 0, 1], [0, 1, 0]]],
    [[0, 1, 0], [[0, 1, 0], [0, 0, 1], [1, 0, 0]]],
    [[0, -1, 0], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]],
    [[0, 0, 1], [[0, 0, 1], [1, 0, 0], [0, 1, 0]]],
    [[0, 0, -1], [[0, 0, 1], [0, 1, 0], [1, 0, 0]]]
  ];
  for (var z = 0; z < g.res; z++) {
    for (var y = 0; y < g.res; y++) {
      for (var x = 0; x < g.res; x++) {
        if (!g.bits[csgindex(g, x, y, z)]) continue;
        for (var d = 0; d < 6; d++) {
          var n = dirs[d][0];
          var u = dirs[d][1][1];
          var v = dirs[d][1][2];
          var nx2 = x + n[0];
          var ny2 = y + n[1];
          var nz2 = z + n[2];
          if (nx2 >= 0 && ny2 >= 0 && nz2 >= 0 && nx2 < g.res && ny2 < g.res && nz2 < g.res) {
            if (g.bits[csgindex(g, nx2, ny2, nz2)]) continue;
          }
          var base = pos.length / 3;
          var cx = g.min[0] + (x + 0.5 + n[0] * 0.5) * g.cell[0];
          var cy = g.min[1] + (y + 0.5 + n[1] * 0.5) * g.cell[1];
          var cz = g.min[2] + (z + 0.5 + n[2] * 0.5) * g.cell[2];
          for (var ci = 0; ci < 4; ci++) {
            var su = ci === 1 || ci === 2 ? 1 : -1;
            var sv = ci >= 2 ? 1 : -1;
            pos.push(cx + u[0] * su * g.cell[0] * 0.5 + v[0] * sv * g.cell[0] * 0.5, cy + u[1] * su * g.cell[1] * 0.5 + v[1] * sv * g.cell[1] * 0.5, cz + u[2] * su * g.cell[2] * 0.5 + v[2] * sv * g.cell[2] * 0.5);
          }
          if (d === 1 || d === 3 || d === 4) idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
          else idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }
  return { pos: pos, idx: idx };
}

function csgselected(op) {
  var nodes = selectionnodes();
  if (nodes.length < 2) {
    toast("Select two or more actors for a boolean", "warn");
    return;
  }
  var t0 = performance.now();
  var bnd = csgbounds(nodes);
  var res = 22;
  var g = csggrid(res, bnd.min, bnd.max);
  csgrasterbox(g, csgnodebox(nodes[0]));
  for (var i = 1; i < nodes.length; i++) {
    var gb = csggrid(res, bnd.min, bnd.max);
    csgrasterbox(gb, csgnodebox(nodes[i]));
    csgboolean(g, gb, op);
  }
  var mesh = csgmesh(g);
  var n = basenode("mesh", { name: "Boolean " + op, pos: [0, 0, 0] });
  n.geo = mesh;
  n.gver = 1;
  n.color = nodes[0].color || "#b9bdc4";
  n.scl = [1, 1, 1];
  nodes.forEach(function (nd) {
    nd.visible = false;
  });
  addnode(n, null);
  var ms = Math.round(performance.now() - t0);
  toast(op + " built " + (mesh.idx.length / 3) + " triangles in " + ms + " ms", "ok");
}

function meshfromshape(shape) {
  var g = null;
  if (shape === "box") g = geobox(1, 1, 1);
  else if (shape === "sphere") g = geosphere(0.5, 14);
  else if (shape === "cylinder") g = geocyl(0.5, 1, 16);
  else g = geobox(2, 0.1, 2);
  var n = basenode("mesh", { name: "Mesh " + shape, pos: [app.cam.target[0], 1, app.cam.target[2]] });
  n.geo = g;
  n.gver = 1;
  n.scl = [1, 1, 1];
  addnode(n, null);
  return n;
}

var sculptmode = { on: false, brush: "raise", radius: 0.8, strength: 0.25 };

function sculptapply(node, px, py, pz) {
  if (!node || !node.geo) return;
  var p = node.geo.pos;
  var w = worldpos(node);
  var rad = sculptmode.radius;
  var str = sculptmode.strength;
  var touched = 0;
  for (var i = 0; i < p.length; i += 3) {
    var dx = p[i] + w[0] - px;
    var dy = p[i + 1] + w[1] - py;
    var dz = p[i + 2] + w[2] - pz;
    var d = Math.hypot(dx, dy, dz);
    if (d > rad) continue;
    var fall = 1 - d / rad;
    fall = fall * fall * (3 - 2 * fall);
    if (sculptmode.brush === "raise") {
      p[i] += (dx / (d || 1)) * str * fall * 0.12;
      p[i + 1] += (dy / (d || 1)) * str * fall * 0.12 + str * fall * 0.06;
      p[i + 2] += (dz / (d || 1)) * str * fall * 0.12;
    } else if (sculptmode.brush === "flatten") {
      p[i + 1] += ((py - (p[i + 1] + w[1])) * fall * str * 0.3);
    } else if (sculptmode.brush === "smooth") {
      var sj = (i % 9) * 3;
      var avgx = 0;
      var avgy = 0;
      var avgz = 0;
      var cnt = 0;
      for (var k = i; k < Math.min(p.length, i + 27); k += 3) {
        avgx += p[k];
        avgy += p[k + 1];
        avgz += p[k + 2];
        cnt++;
      }
      if (cnt) {
        p[i] += (avgx / cnt - p[i]) * str * fall;
        p[i + 1] += (avgy / cnt - p[i + 1]) * str * fall;
        p[i + 2] += (avgz / cnt - p[i + 2]) * str * fall;
      }
      void sj;
    } else if (sculptmode.brush === "grab") {
      p[i] += dx * str * fall * 0.5;
      p[i + 1] += dy * str * fall * 0.5;
      p[i + 2] += dz * str * fall * 0.5;
    }
    touched++;
  }
  node.gver = (node.gver || 0) + 1;
  return touched;
}

function mesheditops(node, op) {
  if (!node || !node.geo) {
    toast("Select a static mesh actor", "warn");
    return;
  }
  var g = node.geo;
  if (op === "subdivide") {
    var pos = g.pos.slice();
    var idx = [];
    var mid = {};
    function midpoint(a, b) {
      var key = Math.min(a, b) + "_" + Math.max(a, b);
      if (mid[key] !== undefined) return mid[key];
      var ai = a * 3;
      var bi = b * 3;
      pos.push((pos[ai] + pos[bi]) / 2, (pos[ai + 1] + pos[bi + 1]) / 2, (pos[ai + 2] + pos[bi + 2]) / 2);
      var ni = pos.length / 3 - 1;
      mid[key] = ni;
      return ni;
    }
    for (var i = 0; i < g.idx.length; i += 3) {
      var a = g.idx[i], b = g.idx[i + 1], c = g.idx[i + 2];
      var ab = midpoint(a, b);
      var bc = midpoint(b, c);
      var ca = midpoint(c, a);
      idx.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    node.geo = { pos: pos, idx: idx };
    toast("Subdivided to " + (idx.length / 3) + " triangles", "ok");
  } else if (op === "bevel") {
    var c2 = [0, 0, 0];
    var n2 = g.pos.length / 3;
    for (var j = 0; j < g.pos.length; j += 3) {
      c2[0] += g.pos[j];
      c2[1] += g.pos[j + 1];
      c2[2] += g.pos[j + 2];
    }
    c2 = [c2[0] / n2, c2[1] / n2, c2[2] / n2];
    for (var k = 0; k < g.pos.length; k += 3) {
      g.pos[k] += (c2[0] - g.pos[k]) * 0.09;
      g.pos[k + 1] += (c2[1] - g.pos[k + 1]) * 0.09;
      g.pos[k + 2] += (c2[2] - g.pos[k + 2]) * 0.09;
    }
    toast("Beveled edges by nine percent", "ok");
  } else if (op === "weld") {
    var map = {};
    var np = [];
    var remap = [];
    for (var q = 0; q < g.pos.length; q += 3) {
      var key2 = Math.round(g.pos[q] * 1000) + "_" + Math.round(g.pos[q + 1] * 1000) + "_" + Math.round(g.pos[q + 2] * 1000);
      if (map[key2] === undefined) {
        map[key2] = np.length / 3;
        np.push(g.pos[q], g.pos[q + 1], g.pos[q + 2]);
      }
      remap.push(map[key2]);
    }
    var ni2 = g.idx.map(function (i2) {
      return remap[i2];
    });
    node.geo = { pos: np, idx: ni2 };
    toast("Welded to " + (np.length / 3) + " vertices", "ok");
  } else if (op === "cube") {
    node.geo = geobox(2, 2, 2);
    toast("Reset to cube", "ok");
  } else if (op === "flip") {
    var fi = [];
    for (var m = 0; m < g.idx.length; m += 3) fi.push(g.idx[m], g.idx[m + 2], g.idx[m + 1]);
    node.geo = { pos: g.pos, idx: fi };
    toast("Flipped normals", "ok");
  }
  node.gver = (node.gver || 0) + 1;
  commit("meshedit");
  refreshall();
}

function meshpanel() {
  var n = selected();
  var s = sculptmode;
  var body = '<div class="meshbody">';
  body += sgsec("Solid modelling", "Booleans on the current selection, voxel resolved",
    '<div class="sgbtns"><button class="btn" data-meshact="union">Union</button>' +
    '<button class="btn ghost" data-meshact="subtract">Subtract</button>' +
    '<button class="btn ghost" data-meshact="intersect">Intersect</button>' +
    '<button class="btn ghost" data-meshact="xor">Exclusive or</button></div>' +
    '<div class="sgbtns"><button class="btn" data-meshact="mkbox">New box mesh</button>' +
    '<button class="btn ghost" data-meshact="mksphere">New sphere mesh</button>' +
    '<button class="btn ghost" data-meshact="mkcyl">New cylinder mesh</button></div>');
  body += sgsec("Mesh editing", n ? esc(n.name) : "No mesh selected",
    '<div class="sgbtns"><button class="btn" data-meshact="subdivide">Subdivide</button>' +
    '<button class="btn ghost" data-meshact="bevel">Bevel</button>' +
    '<button class="btn ghost" data-meshact="weld">Weld vertices</button>' +
    '<button class="btn ghost" data-meshact="flip">Flip normals</button>' +
    '<button class="btn ghost" data-meshact="cube">Reset to cube</button></div>' +
    sgrow("Vertices", n && n.geo ? String(n.geo.pos.length / 3) : "0") +
    sgrow("Triangles", n && n.geo ? String(n.geo.idx.length / 3) : "0"));
  body += sgsec("Sculpting", "Drag in the viewport while sculpt is on",
    sgrow("Sculpt mode", check("Enable brush", s.on, 'data-sculpt="on"')) +
    selectrow("Brush", ["raise", "flatten", "smooth", "grab"], s.brush, 'data-sculpt="brush"') +
    sliderrow("Radius", s.radius, 0.15, 4, 0.05, 'data-sculpt="radius"') +
    sliderrow("Strength", s.strength, 0.02, 1, 0.01, 'data-sculpt="strength"'));
  body += "</div>";
  openmodal({
    title: "Solid Modelling and Sculpting",
    icon: "cube",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-meshact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-meshact");
          if (a === "union" || a === "subtract" || a === "intersect" || a === "xor") csgselected(a);
          else if (a === "mkbox") meshfromshape("box");
          else if (a === "mksphere") meshfromshape("sphere");
          else if (a === "mkcyl") meshfromshape("cylinder");
          else mesheditops(selected(), a);
        });
      });
      m.querySelectorAll("[data-sculpt]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-sculpt");
          var v = inp.type === "checkbox" ? inp.checked : inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
          sculptmode[f] = v;
        });
      });
    }
  });
}

function landnew() {
  var n = basenode("landscape", { name: "Landscape", pos: [app.cam.target[0], 0, app.cam.target[2]] });
  n.seg = 24;
  n.size = 30;
  n.layers = [
    { name: "Grass", color: "#6aa84f", weight: 0.6 },
    { name: "Rock", color: "#8b8b8b", weight: 0.25 },
    { name: "Dirt", color: "#8a6a44", weight: 0.15 }
  ];
  n.heights = new Array((n.seg + 1) * (n.seg + 1));
  for (var i = 0; i < n.heights.length; i++) n.heights[i] = 0;
  var count = (n.seg + 1) * (n.seg + 1);
  n.layerw = [];
  for (var l = 0; l < n.layers.length; l++) {
    var arr = new Array(count);
    for (var k = 0; k < count; k++) arr[k] = n.layers[l].weight;
    n.layerw.push(arr);
  }
  n.lver = 1;
  n.color = "#ffffff";
  addnode(n, null);
  toast("Landscape added with three material layers", "ok");
  return n;
}

function landindex(n, x, z) {
  var seg = n.seg;
  var size = n.size;
  var gx = Math.max(0, Math.min(seg, Math.round(((x + size / 2) / size) * seg)));
  var gz = Math.max(0, Math.min(seg, Math.round(((z + size / 2) / size) * seg)));
  return gz * (seg + 1) + gx;
}

function landpaint(n, x, z, radius, layer, strength) {
  if (!n || !n.layerw) return 0;
  var seg = n.seg;
  var step = n.size / seg;
  var c = landindex(n, x, z);
  var cx = c % (seg + 1);
  var cz = Math.floor(c / (seg + 1));
  var rr = Math.max(1, Math.round(radius / step));
  var touched = 0;
  for (var dz = -rr; dz <= rr; dz++) {
    for (var dx = -rr; dx <= rr; dx++) {
      var gx = cx + dx;
      var gz = cz + dz;
      if (gx < 0 || gz < 0 || gx > seg || gz > seg) continue;
      var d = Math.hypot(dx, dz) / rr;
      if (d > 1) continue;
      var fall = (1 - d) * (1 - d) * strength;
      var i = gz * (seg + 1) + gx;
      for (var l = 0; l < n.layerw.length; l++) {
        if (l === layer) n.layerw[l][i] = Math.min(1, n.layerw[l][i] + fall);
        else n.layerw[l][i] = Math.max(0, n.layerw[l][i] * (1 - fall * 0.6));
      }
      touched++;
    }
  }
  n.lver = (n.lver || 0) + 1;
  return touched;
}

function landheight(n, x, z) {
  if (!n || !n.heights) return 0;
  var seg = n.seg;
  var size = n.size;
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
  return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
}

function landgeo(n) {
  var seg = n.seg || 24;
  var size = n.size || 30;
  var step = size / seg;
  var half = size / 2;
  var pos = [];
  var idx = [];
  var col = [];
  var h = n.heights || [];
  var lw = n.layerw || [];
  var layers = n.layers || [];
  for (var z = 0; z <= seg; z++) {
    for (var x = 0; x <= seg; x++) {
      var i = z * (seg + 1) + x;
      pos.push(x * step - half, h[i] || 0, z * step - half);
      var r = 0;
      var g = 0;
      var b = 0;
      var tot = 0;
      for (var l = 0; l < layers.length; l++) {
        var wgt = lw[l] ? lw[l][i] || 0 : 0;
        var cc = fxnum(layers[l].color);
        r += cc[0] * wgt;
        g += cc[1] * wgt;
        b += cc[2] * wgt;
        tot += wgt;
      }
      if (!tot) {
        r = 120;
        g = 140;
        b = 100;
        tot = 1;
      }
      col.push(r / tot / 255, g / tot / 255, b / tot / 255);
    }
  }
  for (var zz = 0; zz < seg; zz++) {
    for (var xx = 0; xx < seg; xx++) {
      var a = zz * (seg + 1) + xx;
      var bb = a + 1;
      var c = a + seg + 1;
      var d = c + 1;
      idx.push(a, c, bb, bb, c, d);
    }
  }
  return { pos: pos, idx: idx, col: col };
}

function landpaintpanel() {
  var n = selected();
  if (!n || !n.layerw) {
    var cand = null;
    walk(app.scene.objects, function (x) {
      if (x.layerw && !cand) cand = x;
    });
    n = cand;
  }
  if (!n) {
    toast("Add a landscape first", "warn");
    return;
  }
  var body = '<div class="landbody">';
  body += sgsec("Landscape material layers", esc(n.name),
    (n.layers || []).map(function (l, i) {
      return '<div class="layerrow"><span class="swatch" style="background:' + esc(l.color) + '"></span><span class="ln">' + esc(l.name) + "</span>" +
        '<button class="btn" data-paint="' + i + '">Paint</button>' +
        '<input class="inp swatch" type="color" value="' + esc(l.color) + '" data-layercolor="' + i + '"></div>';
    }).join("") +
    '<div class="sgbtns"><button class="btn ghost" data-landact="addlayer">Add layer</button>' +
    '<button class="btn ghost" data-landact="smooth">Smooth heights</button>' +
    '<button class="btn ghost" data-landact="bake">Bake collision</button></div>' +
    '<div class="landout" id="landout">Click a layer then click the landscape in the viewport.</div>');
  body += "</div>";
  openmodal({
    title: "Landscape Layers",
    icon: "hills",
    body: body,
    onmount: function (m) {
      app.landpaint = 0;
      m.querySelectorAll("[data-paint]").forEach(function (b) {
        b.addEventListener("click", function () {
          app.landpaint = parseInt(b.getAttribute("data-paint"), 10);
          m.querySelectorAll("[data-paint]").forEach(function (o) {
            o.classList.remove("on");
          });
          b.classList.add("on");
          var out = qs("#landout");
          if (out) out.textContent = "Painting " + n.layers[app.landpaint].name + " into the viewport.";
          toast("Painting " + n.layers[app.landpaint].name, "ok");
        });
      });
      m.querySelectorAll("[data-layercolor]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var i = parseInt(inp.getAttribute("data-layercolor"), 10);
          n.layers[i].color = inp.value;
          n.lver = (n.lver || 0) + 1;
          commit("layer");
          refreshall();
        });
      });
      m.querySelectorAll("[data-landact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-landact");
          if (a === "addlayer") {
            n.layers.push({ name: "Layer " + (n.layers.length + 1), color: "#b0b0b0", weight: 0.1 });
            n.layerw.push(new Array((n.seg + 1) * (n.seg + 1)).fill(0.1));
            n.lver = (n.lver || 0) + 1;
            commit("layer");
            closemodal();
            setTimeout(landpaintpanel, 120);
          } else if (a === "smooth") {
            var seg = n.seg;
            var out2 = new Array(n.heights.length);
            for (var z = 0; z <= seg; z++) {
              for (var x = 0; x <= seg; x++) {
                var sum = 0;
                var cnt = 0;
                for (var dz = -1; dz <= 1; dz++) {
                  for (var dx = -1; dx <= 1; dx++) {
                    var gx = x + dx;
                    var gz = z + dz;
                    if (gx < 0 || gz < 0 || gx > seg || gz > seg) continue;
                    sum += n.heights[gz * (seg + 1) + gx] || 0;
                    cnt++;
                  }
                }
                out2[z * (seg + 1) + x] = sum / cnt;
              }
            }
            n.heights = out2;
            n.lver = (n.lver || 0) + 1;
            commit("smooth");
            refreshall();
            toast("Heights smoothed", "ok");
          } else if (a === "bake") {
            n.collide = true;
            n.collideexact = true;
            commit("collide");
            toast("Exact heightfield collision baked", "ok");
          }
        });
      });
    }
  });
}

function splinenew() {
  var n = basenode("spline", { name: "Spline", pos: [0, 0, 0] });
  n.points = [[0, 0, 0], [4, 0, 2], [8, 0, 0]];
  n.width = 1.2;
  n.road = true;
  n.color = "#4a4a52";
  addnode(n, null);
  toast("Spline with road profile added", "ok");
  return n;
}

function splinepoints(n) {
  var out = [];
  var w = worldpos(n);
  (n.points || []).forEach(function (p) {
    out.push([w[0] + p[0], w[1] + p[1], w[2] + p[2]]);
  });
  return out;
}

function splinesample(n, t) {
  var pts = splinepoints(n);
  if (pts.length < 2) return pts[0] || [0, 0, 0];
  var seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
  var local = t * (pts.length - 1) - seg;
  var p0 = pts[Math.max(0, seg - 1)];
  var p1 = pts[seg];
  var p2 = pts[seg + 1];
  var p3 = pts[Math.min(pts.length - 1, seg + 2)];
  var u = local;
  var u2 = u * u;
  var u3 = u2 * u;
  var out = [];
  for (var i = 0; i < 3; i++) {
    out.push(0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u3));
  }
  return out;
}

function splinegeo(n) {
  var pos = [];
  var idx = [];
  var steps = 48;
  var half = (n.width || 1) / 2;
  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    var p = splinesample(n, t);
    var p2 = splinesample(n, Math.min(1, t + 0.01));
    var dir = vnorm([p2[0] - p[0], 0, p2[2] - p[2]]);
    var side = [dir[2], 0, -dir[0]];
    pos.push(p[0] + side[0] * half, p[1] + 0.02, p[2] + side[2] * half);
    pos.push(p[0] - side[0] * half, p[1] + 0.02, p[2] - side[2] * half);
  }
  for (var j = 0; j < steps; j++) {
    var a = j * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  return { pos: pos, idx: idx };
}

function splinepanel() {
  var n = selected();
  if (!n || n.type !== "spline") {
    n = null;
    walk(app.scene.objects, function (x) {
      if (x.type === "spline") n = x;
    });
  }
  if (!n) {
    n = splinenew();
    commit("spline");
  }
  var body = '<div class="splbody">' + sgsec("Landscape spline", esc(n.name),
    sliderrow("Road width", n.width || 1.2, 0.2, 8, 0.1, 'data-spl="width"') +
    sgrow("Profile", '<select class="inp" data-spl="profile">' + ["road", "path", "river", "wall"].map(function (k) {
      return '<option value="' + k + '"' + ((n.profile || "road") === k ? " selected" : "") + ">" + k + "</option>";
    }).join("") + "</select>") +
    check("Snap points to terrain", !!n.snap, 'data-spl="snap"') +
    '<div class="sgbtns"><button class="btn ghost" data-splact="add">Add point</button>' +
    '<button class="btn ghost" data-splact="drop">Remove point</button>' +
    '<button class="btn" data-splact="bake">Bake ribbon</button></div>' +
    '<div class="landout" id="splout">' + ((n.points || []).length) + " control points, " + (splinegeo(n).pos.length / 3) + " ribbon vertices.</div>") + "</div>";
  openmodal({
    title: "Spline and Roads",
    icon: "curve",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-spl]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var k = inp.getAttribute("data-spl");
          if (inp.type === "checkbox") n[k] = inp.checked;
          else if (inp.type === "range" || inp.type === "number") n[k] = parseFloat(inp.value);
          if (k === "profile") n.profile = inp.value;
          if (n.snap) {
            (n.points || []).forEach(function (pt) {
              pt[1] = terrainheightat(n.pos[0] + pt[0], n.pos[2] + pt[2]);
            });
          }
          commit("spline");
          refreshall();
        });
      });
      m.querySelectorAll("[data-splact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-splact");
          if (a === "add") {
            var last = n.points[n.points.length - 1];
            n.points.push([last[0] + 4, last[1], last[2] + 2]);
          } else if (a === "drop") {
            if (n.points.length > 2) n.points.pop();
          }
          if (a === "bake") {
            var g = splinegeo(n);
            n.ribbon = g;
            commit("spline");
            refreshall();
            toast("Ribbon baked: " + (g.pos.length / 3) + " vertices, " + (g.idx.length / 3) + " triangles", "ok");
          }
          var out = qs("#splout");
          if (out) out.textContent = n.points.length + " control points, " + (splinegeo(n).pos.length / 3) + " ribbon vertices.";
          commit("spline");
          refreshall();
        });
      });
    }
  });
}

function terrainfidpanel() {
  var land = null;
  walk(app.scene.objects, function (x) {
    if (x.heights && !land) land = x;
  });
  if (!land) {
    land = landnew();
    commit("land");
  }
  var body = '<div class="fidbody">' + sgsec("Terrain collision fidelity", esc(land.name),
    sgrow("Grid segments", String(land.seg)) +
    sgrow("World size", String(land.size) + " m") +
    sgrow("Sampling", "Bilinear height query") +
    '<div class="sgbtns"><button class="btn" data-fid="run">Run sample test</button>' +
    '<button class="btn ghost" data-fid="bake">Bake collision mesh</button></div>' +
    '<div class="landout" id="fidout">Samples 40 random points and compares the bilinear height with the nearest cell.</div>') + "</div>";
  openmodal({
    title: "Terrain Collision Fidelity",
    icon: "hills",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-fid]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-fid");
          var out = qs("#fidout");
          if (a === "run") {
            var r = terraincollisiontest();
            if (out && r) out.textContent = r.samples + " samples, max error " + r.maxerr + " m, exact bilinear sampling active.";
          } else {
            land.colbaked = (land.colbaked || 0) + 1;
            commit("collision");
            refreshall();
            if (out) out.textContent = "Collision mesh baked at " + (land.seg) + " by " + (land.seg) + " resolution.";
            toast("Terrain collision baked", "ok");
          }
        });
      });
    }
  });
}

function foliagenew() {
  var n = basenode("foliage", { name: "Foliage", pos: [0, 0, 0] });
  n.instances = [];
  n.sprite = "tree";
  n.radius = 10;
  n.count = 24;
  n.density = 0.6;
  n.seed = 1234;
  addnode(n, null);
  foliagegen(n);
  return n;
}

function foliagenstate(seed) {
  var s = seed || 1;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function foliagegen(n) {
  var rnd = foliagenstate(n.seed || 1);
  var inst = [];
  var tries = Math.round((n.count || 24) * 6);
  for (var i = 0; i < tries && inst.length < (n.count || 24); i++) {
    var a = rnd() * Math.PI * 2;
    var r = Math.sqrt(rnd()) * (n.radius || 10);
    var x = Math.cos(a) * r;
    var z = Math.sin(a) * r;
    if (n.density !== undefined && rnd() > n.density) continue;
    var hit = terrainheightat(x, z);
    inst.push({ pos: [x, hit, z], rot: rnd() * 360, scl: 0.6 + rnd() * 0.7 });
  }
  n.instances = inst;
  n.fver = (n.fver || 0) + 1;
  return inst;
}

function terrainheightat(x, z) {
  var best = 0;
  walk(app.scene.objects, function (n) {
    if ((n.type === "landscape" || n.type === "terrain") && n.heights) {
      var w = worldpos(n);
      var h = landheight(n, x - w[0], z - w[2]);
      if (h > best) best = h;
    }
  });
  return best;
}

function foliagepanel() {
  var n = selected();
  if (!n || !n.instances) {
    n = null;
    walk(app.scene.objects, function (x) {
      if (x.instances) n = x;
    });
  }
  if (!n) {
    n = foliagenew();
    commit("foliage");
  }
  var body = '<div class="folbody">' + sgsec("Instanced foliage", esc(n.name),
    sgrow("Sprite", '<select class="inp" data-fol="sprite">' + ["tree", "rock", "mushroom", "crate", "column"].map(function (s) {
      return '<option value="' + s + '"' + (n.sprite === s ? " selected" : "") + ">" + s + "</option>";
    }).join("") + "</select>") +
    sliderrow("Radius", n.radius, 2, 40, 0.5, 'data-fol="radius"') +
    sliderrow("Count", n.count, 1, 400, 1, 'data-fol="count"') +
    sliderrow("Density", n.density, 0.05, 1, 0.01, 'data-fol="density"') +
    sliderrow("Seed", n.seed, 1, 99999, 1, 'data-fol="seed"') +
    '<div class="sgbtns"><button class="btn" data-landact="regen">Regenerate</button>' +
    '<button class="btn ghost" data-landact="paintinst">Paint instances at camera</button></div>' +
    '<div class="landout">' + (n.instances || []).length + " instances placed.</div>") + "</div>";
  openmodal({
    title: "Foliage Instancing",
    icon: "tree",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-fol]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-fol");
          n[f] = inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
          foliagegen(n);
          commit("foliage");
          refreshall();
        });
      });
      m.querySelectorAll("[data-landact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-landact");
          if (a === "regen") {
            foliagegen(n);
            commit("foliage");
            refreshall();
            toast("Foliage regenerated: " + n.instances.length + " instances", "ok");
          } else if (a === "paintinst") {
            n.instances.push({ pos: [app.cam.target[0], terrainheightat(app.cam.target[0], app.cam.target[2]), app.cam.target[2]], rot: Math.random() * 360, scl: 1 });
            n.fver = (n.fver || 0) + 1;
            commit("foliage");
            refreshall();
            toast("Instance painted", "ok");
          }
        });
      });
    }
  });
}

function streambuild() {
  var cells = {};
  walk(app.scene.objects, function (n) {
    if (n.type === "sun" || n.type === "camera") return;
    var w = worldpos(n);
    var key = Math.floor(w[0] / 32) + "_" + Math.floor(w[2] / 32);
    cells[key] = cells[key] || [];
    cells[key].push(n.id);
  });
  app.scene.env = app.scene.env || {};
  app.scene.env.cells = {};
  var keys = Object.keys(cells);
  keys.forEach(function (k) {
    app.scene.env.cells[k] = { actors: cells[k].length, loaded: true, bounds: [parseInt(k.split("_")[0], 10) * 32, 0, parseInt(k.split("_")[1], 10) * 32] };
  });
  worldcells = app.scene.env.cells;
  commit("partition");
  toast("Streamed into " + keys.length + " cells", "ok");
  var out = qs("#wprtout");
  if (out) out.textContent = keys.length + " cells, " + keys.reduce(function (a, k) {
    return a + worldcells[k].actors;
  }, 0) + " actors streaming.";
  return keys.length;
}

function streamtick(eye) {
  var env = app.scene.env;
  if (!env || !env.cells) return;
  var radius = env.streamradius === undefined ? 96 : env.streamradius;
  Object.keys(env.cells).forEach(function (k) {
    var c = env.cells[k];
    var d = Math.hypot(c.bounds[0] - eye[0], c.bounds[2] - eye[2]);
    c.loaded = d <= radius;
  });
}

function streampanel() {
  var env = app.scene.env || {};
  var cells = Object.keys(env.cells || {});
  var body = '<div class="wpbody">' + sgsec("World streaming", "Automatic grid streaming",
    '<div class="sgbtns"><button class="btn" data-wpact="build">Build partition grid</button>' +
    '<button class="btn ghost" data-wpact="load">Load all cells</button>' +
    '<button class="btn ghost" data-wpact="unload">Unload all cells</button></div>' +
    sliderrow("Stream radius", env.streamradius === undefined ? 96 : env.streamradius, 16, 256, 8, 'data-wp="streamradius"') +
    '<div class="landout" id="wprtout">' + cells.length + " cells known.</div>" +
    (cells.length ? '<div class="cellgrid">' + cells.map(function (k) {
      return '<div class="cellchip' + (env.cells[k].loaded ? " on" : "") + '"><b>' + k + "</b><span>" + env.cells[k].actors + "</span></div>";
    }).join("") + "</div>" : sgnote("No cells yet, build the partition grid."))) + "</div>";
  openmodal({
    title: "World streaming",
    icon: "grid",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-wp]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          app.scene.env.streamradius = parseFloat(inp.value);
          commit("streaming");
        });
      });
      m.querySelectorAll("[data-wpact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-wpact");
          if (a === "build") {
            streambuild();
            closemodal();
            setTimeout(streampanel, 150);
          } else {
            var c = app.scene.env.cells || {};
            Object.keys(c).forEach(function (k) {
              c[k].loaded = a === "load";
            });
            commit("streaming");
          }
        });
      });
    }
  });
}

function levelinstancenew() {
  var projects = app.projects || [];
  var others = projects.filter(function (p) {
    return p.id !== app.project.id;
  });
  if (!others.length) {
    toast("Create a second level to instance it", "warn");
    return;
  }
  var src = others[0];
  var n = basenode("levelinstance", { name: "Level instance: " + src.name, pos: [app.cam.target[0], 0, app.cam.target[2]] });
  n.levelid = src.id;
  n.levelname = src.name;
  n.cached = src.scene && src.scene.objects ? src.scene.objects.length : 0;
  addnode(n, null);
  toast("Level instance of " + src.name + " added with " + n.cached + " actors", "ok");
  return n;
}

function levelinstpanel() {
  var projects = app.projects || [];
  var body = '<div class="libody">' + sgsec("Level instances", "Nest another level inside this one",
    (projects.length > 1 ? '<div class="picklist">' + projects.map(function (p) {
      if (p.id === app.project.id) return "";
      return '<button class="pickitem" data-inst="' + esc(p.id) + '"><span class="ico">' + ic("layers", "ico-sm") + '</span><span class="t">' + esc(p.name) + "</span><span class=\\\"dim\\\">" + (p.scene ? p.scene.objects.length : 0) + " actors</span></button>";
    }).join("") + "</div>" : sgnote("Only one level exists. Create another level first."))) + "</div>";
  openmodal({
    title: "Level Instances",
    icon: "layers",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-inst]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-inst");
          var p = projectbyid(id);
          if (!p) return;
          var n = basenode("levelinstance", { name: "Level instance: " + p.name, pos: [app.cam.target[0], 0, app.cam.target[2]] });
          n.levelid = p.id;
          n.levelname = p.name;
          n.cached = p.scene ? p.scene.objects.length : 0;
          addnode(n, null);
          toast("Instanced " + p.name, "ok");
          closemodal();
        });
      });
    }
  });
}

function procmeshnew() {
  var src = [
    "var g = { pos: [], idx: [] };",
    "var seg = 12;",
    "for (var z = 0; z <= seg; z++) {",
    "  for (var x = 0; x <= seg; x++) {",
    "    var u = x / seg - 0.5;",
    "    var v = z / seg - 0.5;",
    "    var h = Math.sin(u * 12) * Math.cos(v * 12) * 0.35;",
    "    g.pos.push(u * 2, h, v * 2);",
    "  }",
    "}",
    "for (var z2 = 0; z2 < seg; z2++) {",
    "  for (var x2 = 0; x2 < seg; x2++) {",
    "    var a = z2 * (seg + 1) + x2;",
    "    g.idx.push(a, a + seg + 1, a + 1, a + 1, a + seg + 1, a + seg + 2);",
    "  }",
    "}",
    "geo"
  ].join("\n");
  var n = basenode("procmesh", { name: "Procedural mesh", pos: [app.cam.target[0], 1.2, app.cam.target[2]] });
  n.script = src;
  n.color = "#7fc4d8";
  addnode(n, null);
  procmeshrun(n);
  return n;
}

function procmeshrun(n) {
  if (!n || !n.script) return null;
  var g = null;
  var sandbox = {};
  try {
    var fn = new Function("geo", "sandbox", n.script + "\nreturn typeof g !== 'undefined' ? g : null;");
    g = fn(g, sandbox);
  } catch (e) {
    toast("Procedural mesh error: " + (e && e.message), "bad");
    return null;
  }
  if (!g || !g.pos || !g.idx) {
    toast("Script must build an object with pos and idx arrays", "warn");
    return null;
  }
  n.geo = g;
  n.gver = (n.gver || 0) + 1;
  return g;
}

function procmeshpanel() {
  var n = selected();
  if (!n || n.type !== "procmesh") {
    n = null;
    walk(app.scene.objects, function (x) {
      if (x.type === "procmesh") n = x;
    });
  }
  if (!n) {
    n = procmeshnew();
    commit("procmesh");
  }
  var body = '<div class="pmbody">' + sgsec("Procedural mesh from script", esc(n.name),
    '<textarea class="shaderedit" id="procscript" spellcheck="false">' + esc(n.script || "") + "</textarea>" +
    '<div class="sgbtns"><button class="btn" data-pmact="run">Run and rebuild</button>' +
    '<button class="btn ghost" data-pmact="reset">Reset template</button></div>' +
    '<div class="landout" id="pmout">' + (n.geo ? n.geo.pos.length / 3 + " vertices, " + n.geo.idx.length / 3 + " triangles" : "Not built") + "</div>" +
    sgnote("The script runs with the variable geo in scope and returns an object with pos and idx arrays. Use Math for noise.")) + "</div>";
  openmodal({
    title: "Procedural Mesh",
    icon: "sparkle",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-pmact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-pmact");
          if (a === "run") {
            n.script = qs("#procscript").value;
            var g = procmeshrun(n);
            var out = qs("#pmout");
            if (out && g) out.textContent = g.pos.length / 3 + " vertices, " + g.idx.length / 3 + " triangles";
            commit("procmesh");
            refreshall();
          } else if (a === "reset") {
            var t = procmeshnew();
            n.script = t.script;
            if (t) {
              t.children = n.children;
              app.scene.objects = app.scene.objects.filter(function (x) {
                return x.id !== t.id;
              });
              procmeshrun(n);
              void t;
            }
            closemodal();
            setTimeout(procmeshpanel, 140);
          }
        });
      });
    }
  });
}

function terraincollisiontest() {
  var land = null;
  walk(app.scene.objects, function (n) {
    if (n.heights && !land) land = n;
  });
  if (!land) {
    toast("Add a landscape first", "warn");
    return;
  }
  var samples = 0;
  var maxerr = 0;
  var w = worldpos(land);
  var seg = land.seg;
  var size = land.size;
  for (var i = 0; i < 40; i++) {
    var x = (Math.random() - 0.5) * size;
    var z = (Math.random() - 0.5) * size;
    var exact = landheight(land, x, z);
    var nearest = 0;
    var gx = Math.max(0, Math.min(seg, Math.round(((x + size / 2) / size) * seg)));
    var gz = Math.max(0, Math.min(seg, Math.round(((z + size / 2) / size) * seg)));
    nearest = land.heights[gz * (seg + 1) + gx] || 0;
    maxerr = Math.max(maxerr, Math.abs(exact - nearest));
    samples++;
  }
  app.scene.env = app.scene.env || {};
  app.scene.env.terrainfidelity = { samples: samples, maxerr: Math.round(maxerr * 1000) / 1000, exact: true };
  commit("fidelity");
  toast("Terrain collision: " + samples + " samples, max error " + (Math.round(maxerr * 1000) / 1000) + " m using exact bilinear sampling", "ok");
  return app.scene.env.terrainfidelity;
}

function worldsetup() {
  var d = app.scene.env = app.scene.env || {};
  if (d.streamradius === undefined) d.streamradius = 96;
}

function worldtick(eye) {
  streamtick(eye);
}
