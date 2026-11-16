var tiletypes = [
  { id: 0, label: "Erase", color: "#2a2f36", side: "#1d2127", solid: false },
  { id: 1, label: "Grass", color: "#67c95c", side: "#3f8c41", solid: true },
  { id: 2, label: "Dirt", color: "#c08a54", side: "#8a5f37", solid: true },
  { id: 3, label: "Brick", color: "#c25c46", side: "#8c3f2f", solid: true },
  { id: 4, label: "Stone", color: "#9aa2ad", side: "#6b727c", solid: true },
  { id: 5, label: "Wood", color: "#b9884e", side: "#7f5c33", solid: true },
  { id: 6, label: "Ice", color: "#9fdcff", side: "#6aa8cc", solid: true },
  { id: 7, label: "Water", color: "#4fb6e8", side: "#2f7fae", solid: false },
  { id: 8, label: "Lava", color: "#f26722", side: "#a83a11", solid: false },
  { id: 9, label: "Spikes", color: "#c9ced6", side: "#8b929c", solid: false },
  { id: 10, label: "Sand", color: "#e8d59b", side: "#bda870", solid: true },
  { id: 11, label: "Platform", color: "#7ac4f0", side: "#4a90b8", solid: true },
  { id: 12, label: "Void", color: "#3b3f47", side: "#26292f", solid: false }
];

var tilemeta = null;

function tileadd(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function tilemul(a, k) {
  return [a[0] * k, a[1] * k, a[2] * k];
}

function tilebyid(id) {
  if (!tilemeta) {
    tilemeta = {};
    tiletypes.forEach(function (t) {
      tilemeta[t.id] = t;
    });
  }
  return tilemeta[id] || tilemeta[1];
}

function tiledata(node) {
  node.compdata = node.compdata || {};
  var d = node.compdata.tilemap;
  if (!d) d = node.compdata.tilemap = { ts: 1, cols: 30, rows: 12, layer: "Base", order: 0, solid: true, tiles: [] };
  d.ts = Math.max(0.1, parseFloat(d.ts) || 1);
  d.cols = Math.max(1, Math.min(120, Math.round(parseFloat(d.cols) || 30)));
  d.rows = Math.max(1, Math.min(120, Math.round(parseFloat(d.rows) || 12)));
  d.order = parseFloat(d.order) || 0;
  if (typeof d.layer !== "string" || !d.layer) d.layer = "Base";
  if (!Array.isArray(d.tiles)) d.tiles = [];
  var size = d.cols * d.rows;
  if (d.tiles.length !== size) {
    var old = d.tiles;
    var oldcols = Math.max(1, Math.round(parseFloat(d.oldcols) || d.cols));
    var arr = new Array(size).fill(0);
    for (var i = 0; i < Math.min(old.length, size); i++) arr[i] = old[i] || 0;
    d.tiles = arr;
  }
  d.oldcols = d.cols;
  d.oldrows = d.rows;
  return d;
}

function tilearray(node) {
  return tiledata(node).tiles;
}

function tilearrayset(node, arr) {
  var d = tiledata(node);
  var out = new Array(d.cols * d.rows).fill(0);
  for (var i = 0; i < Math.min(arr.length, out.length); i++) out[i] = arr[i] || 0;
  d.tiles = out;
}

function tileindex(node, c, r) {
  var d = tiledata(node);
  if (c < 0 || r < 0 || c >= d.cols || r >= d.rows) return -1;
  return r * d.cols + c;
}

function tileget(node, c, r) {
  var i = tileindex(node, c, r);
  return i < 0 ? 0 : tilearray(node)[i];
}

function tileset(node, c, r, id) {
  var i = tileindex(node, c, r);
  if (i < 0) return false;
  tilearray(node)[i] = id || 0;
  return true;
}

function tilecount(node) {
  var n = 0;
  tilearray(node).forEach(function (v) {
    if (v) n++;
  });
  return n;
}

function tileorigin(node) {
  var d = tiledata(node);
  return [node.pos[0] - (d.cols * d.ts) / 2, node.pos[1] - (d.rows * d.ts) / 2];
}

function tilecellat(node, x, y) {
  var d = tiledata(node);
  var org = tileorigin(node);
  var c = Math.floor((x - org[0]) / d.ts);
  var up = Math.floor((y - org[1]) / d.ts);
  var r = d.rows - 1 - up;
  return { c: c, r: r, inside: c >= 0 && up >= 0 && c < d.cols && up < d.rows };
}

function tilecellpos(node, c, r) {
  var d = tiledata(node);
  var org = tileorigin(node);
  return [org[0] + c * d.ts + d.ts / 2, org[1] + (d.rows - 1 - r) * d.ts + d.ts / 2];
}

function tilemapitems(node, items) {
  var d = tiledata(node);
  var out = items || [];
  var cs = app.camstate || camerastate();
  var span = Math.max(24, (cs.dist || 20) * 2.4);
  var arr = tilearray(node);
  var org = tileorigin(node);
  var made = 0;
  for (var r = 0; r < d.rows; r++) {
    var c = 0;
    while (c < d.cols) {
      var id = arr[r * d.cols + c];
      if (!id) {
        c++;
        continue;
      }
      var run = 1;
      while (c + run < d.cols && arr[r * d.cols + c + run] === id) run++;
      var w = run * d.ts;
      var h = d.ts;
      var x = org[0] + c * d.ts + w / 2;
      var y = org[1] + (d.rows - r - 1) * d.ts + h / 2;
      if (Math.abs(x - cs.target[0]) < span && Math.abs(y - cs.target[1]) < span && made < 900) {
        var t = tilebyid(id);
        out.push({
          id: node.id + "t" + r + "_" + c,
          kind: "box",
          matrix: m4compose([x, y, node.pos[2] + d.order * 0.05], [0, 0, 0], [w, h, Math.max(0.24, d.ts * 0.45)]),
          color: t.color,
          opacity: t.label === "Water" ? 0.72 : 1,
          unlit: false,
          texid: "",
          texture: null,
          sidecolor: t.side,
          faces: "",
          double: false
        });
        made++;
      }
      c += run;
    }
  }
  return out;
}

function tilemapwalls(node) {
  var d = tiledata(node);
  var out = [];
  if (d.solid === false) return out;
  var arr = tilearray(node);
  var org = tileorigin(node);
  for (var r = 0; r < d.rows; r++) {
    var c = 0;
    while (c < d.cols) {
      var id = arr[r * d.cols + c];
      if (!id || !tilebyid(id).solid) {
        c++;
        continue;
      }
      var run = 1;
      while (c + run < d.cols && arr[r * d.cols + c + run] === id) run++;
      out.push({
        x: org[0] + c * d.ts + (run * d.ts) / 2,
        y: org[1] + (d.rows - r - 1) * d.ts + d.ts / 2,
        z: node.pos[2],
        hw: (run * d.ts) / 2,
        hh: d.ts / 2,
        hd: Math.max(0.2, d.ts * 0.45),
        kind: tilebyid(id).label
      });
      c += run;
    }
  }
  return out;
}

function tilemapnodes() {
  var out = [];
  if (!app.scene) return out;
  walk(app.scene.objects || [], function (n) {
    if (n.type === "tilemap" && n.visible !== false) out.push(n);
  });
  return out;
}

function tilesolidat(x, y, z) {
  var list = tilemapnodes();
  for (var i = 0; i < list.length; i++) {
    var n = list[i];
    var d = tiledata(n);
    if (d.solid === false) continue;
    var cell = tilecellat(n, x, y);
    if (!cell.inside) continue;
    var t = tilebyid(tileget(n, cell.c, cell.r));
    if (t.solid) return t;
  }
  return null;
}

function tilecamray(sx, sy) {
  var cam = app.camstate || camerastate();
  var w = view.w;
  var h = view.h;
  if (cam.ortho) {
    var f = vnorm(vsub(cam.target, cam.eye));
    var rr = vnorm(vcross(f, [0, 1, 0]));
    var uu = vcross(rr, f);
    var ndx = (sx / w) * 2 - 1;
    var ndy = 1 - (sy / h) * 2;
    return {
      origin: tileadd(cam.eye, tileadd(tilemul(rr, ndx * cam.halfw), tilemul(uu, ndy * cam.halfw * (h / w)))),
      dir: f
    };
  }
  return rayfromscreen(cam, sx, sy, w, h);
}

function tilepick(node, sx, sy) {
  if (!node) return null;
  var ray = tilecamray(sx, sy);
  if (!ray) return null;
  var z = node.pos[2];
  var t = (z - ray.origin[2]) / (ray.dir[2] || 0.00001);
  if (!isFinite(t)) return null;
  var p = tileadd(ray.origin, tilemul(ray.dir, t));
  var cell = tilecellat(node, p[0], p[1]);
  cell.x = p[0];
  cell.y = p[1];
  cell.id = cell.inside ? tileget(node, cell.c, cell.r) : 0;
  return cell;
}

function tiletarget() {
  var node = selected();
  if (node && node.type === "tilemap") return node;
  var list = tilemapnodes();
  return list[0] || null;
}

function tilepaintat(sx, sy, erase) {
  var node = tiletarget();
  if (!node) return false;
  var cell = tilepick(node, sx, sy);
  if (!cell || !cell.inside) return false;
  var id = erase ? 0 : app.painttile || 0;
  if (!id && !erase) return false;
  var before = tileget(node, cell.c, cell.r);
  if (before === id) {
    app.paintpos = [sx, sy];
    return true;
  }
  tileset(node, cell.c, cell.r, id);
  app.paintpos = [sx, sy];
  app.paintdirty = true;
  return true;
}

function tilefillarea(node, x0, y0, x1, y1, id) {
  var a = tilecellat(node, Math.min(x0, x1), Math.min(y0, y1));
  var b = tilecellat(node, Math.max(x0, x1), Math.max(y0, y1));
  var c;
  for (c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) {
    for (var r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) tileset(node, c, r, id);
  }
}

function tileghost(g) {
  if (!app.paint || !app.paint.on || app.play) return;
  var node = tiletarget();
  if (!node || !app.paintpos) return;
  var cell = tilepick(node, app.paintpos[0], app.paintpos[1]);
  if (!cell || !cell.inside) return;
  var p = tilecellpos(node, cell.c, cell.r);
  var d = tiledata(node);
  var cs = app.camstate || camerastate();
  var m = cameramatrices(cs, view.w, view.h);
  var half = d.ts / 2;
  var pts = [
    projectpoint(m.vp, [p[0] - half, p[1] - half, node.pos[2]], view.w, view.h),
    projectpoint(m.vp, [p[0] + half, p[1] - half, node.pos[2]], view.w, view.h),
    projectpoint(m.vp, [p[0] + half, p[1] + half, node.pos[2]], view.w, view.h),
    projectpoint(m.vp, [p[0] - half, p[1] + half, node.pos[2]], view.w, view.h)
  ];
  if (!pts.every(function (q) {
    return !!q;
  })) return;
  var t = tilebyid(app.painttile || 0);
  g.save();
  g.globalAlpha = 0.55;
  g.fillStyle = t.id ? t.color : "rgba(0,0,0,0)";
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
  g.strokeStyle = "#ffffff";
  g.lineWidth = 1.5;
  g.stroke();
  g.restore();
}

function tilepalettehtml() {
  var body = '<div class="tilepal">';
  tiletypes.forEach(function (t) {
    var on = (app.painttile || 0) === t.id ? " on" : "";
    body += '<button class="tilechip' + on + '" data-tile="' + t.id + '" title="' + esc(t.label) + '">';
    body += '<span class="swatch" style="background:' + t.color + ';border-bottom-color:' + t.side + '"></span>';
    body += '<span class="tname">' + esc(t.label) + "</span></button>";
  });
  body += "</div>";
  return body;
}

function tilehudhtml() {
  var node = tiletarget();
  if (!node) return "";
  var d = tiledata(node);
  var cur = tilebyid(app.painttile || 0);
  return '<div class="tilehud"><span class="dot" style="background:' + cur.color + '"></span>' +
    esc(cur.label) + " · " + tilecount(node) + " tiles · " + d.cols + "×" + d.rows + " · " + esc(d.layer) + "</div>";
}

function mktilemapnode() {
  var node = basenode("tilemap", { name: "Tilemap", pos: [0, 0, 0] });
  node.comps = ["tilemap"];
  node.compdata = { tilemap: { ts: 1, cols: 30, rows: 12, layer: "Base", order: 0, solid: true, tiles: [] } };
  var d = tiledata(node);
  var c;
  for (c = 0; c < d.cols; c++) {
    tileset(node, c, d.rows - 1, 1);
    tileset(node, c, d.rows - 2, 2);
  }
  for (c = 6; c < 11; c++) tileset(node, c, 4, 3);
  for (c = 18; c < 23; c++) tileset(node, c, 5, 4);
  return node;
}

acts.tilepalette = function () {
  var node = tiletarget();
  if (!node) {
    node = mktilemapnode();
    node.name = uniqueid(app.scene.objects, "Tilemap");
    app.scene.objects.push(node);
    app.selid = node.id;
    app.selids = [node.id];
    commit("add tilemap");
  } else if (!selected() || selected().type !== "tilemap") {
    app.selid = node.id;
    app.selids = [node.id];
  }
  app.paint = { on: true };
  if (app.painttile === undefined) app.painttile = 1;
  var body = tilepalettehtml();
  body += '<div class="row small dim" style="margin-top:10px">Click a swatch, then drag in the viewport. Hold Alt to erase.</div>';
  openmodal({
    title: "Tile palette",
    width: "wide",
    body: body,
    footer: '<button class="btn" data-mact="close">Close</button>',
    onmount: function (root) {
      root.querySelectorAll("[data-tile]").forEach(function (el) {
        el.onclick = function () {
          app.painttile = parseInt(el.getAttribute("data-tile"), 10) || 0;
          app.paint = { on: true };
          root.querySelectorAll(".tilechip").forEach(function (x) {
            x.classList.remove("on");
          });
          el.classList.add("on");
          toast(app.painttile ? tilebyid(app.painttile).label + " brush" : "Erase brush", "ok");
        };
      });
    }
  });
};

acts.tilepaint = function () {
  if (!tiletarget()) {
    acts.tilepalette();
    return;
  }
  app.paint = { on: !(app.paint && app.paint.on) };
  if (app.painttile === undefined) app.painttile = 1;
  toast(app.paint.on ? "Paint mode on" : "Paint mode off", "ok");
  refreshall();
};

acts.tileclearall = function () {
  var node = tiletarget();
  if (!node) return;
  var d = tiledata(node);
  tilearrayset(node, new Array(d.cols * d.rows).fill(0));
  commit("tileclear");
  toast("Tilemap cleared", "ok");
  refreshall();
};

acts.tilefill = function () {
  var node = tiletarget();
  if (!node) return;
  var d = tiledata(node);
  var id = app.painttile || 1;
  tilearrayset(node, new Array(d.cols * d.rows).fill(id));
  commit("tilefill");
  refreshall();
};

acts.tileaddcol = function () {
  var node = tiletarget();
  if (!node) return;
  var d = tiledata(node);
  var arr = tilearray(node).slice(0);
  d.oldcols = d.cols;
  d.cols = Math.min(120, d.cols + 2);
  var out = new Array(d.cols * d.rows).fill(0);
  for (var r = 0; r < d.rows; r++) {
    for (var c = 0; c < d.oldcols; c++) out[r * d.cols + c] = arr[r * d.oldcols + c] || 0;
  }
  d.tiles = out;
  commit("tilecols");
  refreshall();
};

acts.tileaddrow = function () {
  var node = tiletarget();
  if (!node) return;
  var d = tiledata(node);
  var arr = tilearray(node).slice(0);
  var cols = d.cols;
  d.rows = Math.min(120, d.rows + 2);
  var out = new Array(d.cols * d.rows).fill(0);
  for (var r = 0; r < d.rows - 2; r++) {
    for (var c = 0; c < cols; c++) out[(r + 2) * cols + c] = arr[r * cols + c] || 0;
  }
  d.tiles = out;
  commit("tilerows");
  refreshall();
};

acts.addtilemap = function () {
  var node = mktilemapnode();
  node.name = uniqueid(app.scene.objects, "Tilemap");
  app.scene.objects.push(node);
  app.selid = node.id;
  app.selids = [node.id];
  app.painttile = 1;
  app.paint = { on: true };
  commit("addtilemap");
  toast("Tilemap added. Paint with the palette.", "ok");
  refreshall();
};
