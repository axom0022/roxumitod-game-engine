var view = {};

function camerastate() {
  var c = app.cam;
  var cp = Math.cos(c.pitch);
  var eye = [c.target[0] + Math.sin(c.yaw) * cp * c.dist, c.target[1] + Math.sin(c.pitch) * c.dist, c.target[2] + Math.cos(c.yaw) * cp * c.dist];
  var st = { eye: eye, target: c.target.slice(), fov: c.fov, mode: c.mode, ortho: !!c.ortho, halfw: c.halfw || c.dist * 0.42 };
  if (c.mode === "top") st.eye = [c.target[0], c.target[1] + c.dist, c.target[2] + 0.001];
  if (c.mode === "front") st.eye = [c.target[0], c.target[1], c.target[2] + c.dist];
  if (c.mode === "side") st.eye = [c.target[0] + c.dist, c.target[1], c.target[2]];
  return st;
}

function sceneenv() {
  var env = app.scene.env || {};
  var g = app.project.graphics || {};
  gfx.opts = {
    shadows: !!g.shadows,
    shadowsize: g.shadowsize || 1024,
    cascades: g.cascades || 4,
    tonemap: env.tonemap || "none",
    bloom: !!g.bloom,
    dof: !!g.dof,
    ao: !!g.ao,
    fxaa: !!g.fxaa
  };
  return {
    bg: env.bgtype === "sky" ? (env.loadingcolor || "#f7dcb6") : (env.color || "#c5e4ff"),
    ambient: env.ambient || "#ffffff",
    strength: env.strength === undefined ? 0.6 : env.strength,
    grid: app.showgrid && !app.play,
    gridy: env.gridy === undefined ? -0.001 : env.gridy,
    sunintensity: 0.95,
    shadows: !!g.shadows,
    gi: env.gi !== false,
    gistrength: env.gistrength === undefined ? 0.55 : env.gistrength,
    csm: !!env.csm,
    csmres: env.csmres || 2048,
    vgeo: env.vgeo !== false,
    vgeodist: env.vgeodist || 14,
    partition: !!env.partition,
    cell: env.cell || 24,
    cellradius: env.cellradius === undefined ? 3 : env.cellradius
  };
}

function cameranode() {
  var cam = null;
  (app.scene.objects || []).forEach(function (n) {
    if (n.type === "camera") cam = n;
  });
  return cam;
}

function previewcamera() {
  var n = cameranode();
  if (!n) return camerastate();
  var m = worldmatrix(n);
  var eye = [m[12], m[13], m[14]];
  var dir = vnorm([-m[8], -m[9], -m[10]]);
  var fov = 50;
  if (n.compdata && n.compdata.camera && n.compdata.camera.fov) fov = n.compdata.camera.fov;
  return { eye: eye, target: [eye[0] + dir[0] * 10, eye[1] + dir[1] * 10, eye[2] + dir[2] * 10], fov: fov, mode: "persp" };
}

function itemtexture(node) {
  if (node.sprite) return texturecanvas(node.sprite, app.project);
  if (node.type === "text3d") return textcanvas(node.text || "Text", node.color || "#ffffff", 56);
  return null;
}

function markerspec(n) {
  var t = n.type;
  if (t === "pointlight") return { shape: "sphere", size: [0.34, 0.34, 0.34], offset: [0, 0, 0], unlit: true };
  if (t === "spotlight") return { shape: "cone", size: [0.5, 0.8, 0.5], offset: [0, -0.3, 0], unlit: true };
  if (t === "arealight") return { shape: "plane", size: [1.2, 0.8, 0.02], offset: [0, 0.4, 0.4], rot: [90, 0, 0], unlit: true };
  if (t === "soundemitter") return { shape: "sphere", size: [0.7, 0.7, 0.7], opacity: 0.25, unlit: true };
  if (t === "musiczone") return { shape: "sphere", size: [1.4, 1.4, 1.4], opacity: 0.16, unlit: true };
  if (t === "trail") return { shape: "box", size: [0.2, 0.2, 1.4], opacity: 0.5, unlit: true };
  if (t === "beam") return { shape: "cylinder", size: [0.5, 6, 0.5], opacity: 0.35, unlit: true };
  if (t === "spawn") return { shape: "cylinder", size: [1.1, 0.08, 1.1], offset: [0, 0.04, 0], unlit: true };
  if (t === "checkpoint") return { shape: "torus", size: [1, 1, 1], unlit: true };
  if (t === "portal") return { shape: "torus", size: [1.4, 1.4, 1.4], unlit: true };
  if (t === "door") return { shape: "box", size: [1.4, 2.2, 0.3] };
  if (t === "hazard") return { shape: "box", size: [1, 1, 1] };
  if (t === "pickup") return { shape: "torus", size: [0.7, 0.7, 0.7], unlit: true };
  if (t === "zone") return { shape: "box", size: [3, 2, 3], opacity: 0.18, unlit: true };
  if (t === "platform") return { shape: "box", size: [2, 0.4, 1] };
  if (t === "attachment") return { shape: "sphere", size: [0.3, 0.3, 0.3], unlit: true };
  if (t === "billboard") return { shape: "plane", size: [1.2, 0.4, 0.02], offset: [0, 1.4, 0], unlit: true };
  if (t === "remote") return { shape: "sphere", size: [0.5, 0.5, 0.5], opacity: 0.5, unlit: true };
  if (t === "numbervalue" || t === "stringvalue") return { shape: "box", size: [0.4, 0.4, 0.08], offset: [0, 0.5, 0], unlit: true };
  if (t === "seat") return { shape: "box", size: [1.2, 0.3, 1.2] };
  if (t === "script" || t === "modulescript" || t === "scenescript" || t === "clientscript" || t === "serverscript" || t === "toolscript") return { shape: "box", size: [0.6, 0.6, 0.06], offset: [0, 0.6, 0], unlit: true };
  return null;
}

function collectitems() {
  var items = [];
  var picks = [];
  var gs = gameover || {};
  function visit(list, parentmat, parentvis) {
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var over = gs[n.id] || null;
      var sprname = over && over.sprite ? over.sprite : n.sprite;
      var pos = over && over.pos ? over.pos : n.pos;
      var rot = over && over.rot ? over.rot : n.rot;
      var scl = over && over.scl ? over.scl : n.scl;
      var vis = parentvis && n.visible !== false && (!over || over.visible !== false);
      var local = m4compose(pos, rot, scl);
      var world = m4mul(parentmat, local);
      var px = world[12], py = world[13], pz = world[14];
      var firstchild = !(app.play && over && over.hidden);
      var guiworld = typeof guiphys === "function" && guiphys(n);
      if (vis && guiworld && typeof guielement === "function" && guielement(n)) {
        var gtex = guidrawphysicalcanvas(n);
        var gw = Math.max(0.2, uivalue(n, "w", 200) / 100);
        var gh = Math.max(0.2, uivalue(n, "h", 48) / 100);
        items.push({ id: n.id, kind: "plane", matrix: m4mul(world, m4scale(gw, gh, 1)), color: "#ffffff", opacity: 1, unlit: true, texid: "guiphy" + n.id, texture: gtex, double: true });
        var gb = matrixbounds(m4mul(world, m4scale(gw, gh, 1)), [0.5, 0.5, 0.01]);
        picks.push({ id: n.id, node: n, min: gb.min, max: gb.max });
      } else if (vis && n.type !== "canvas" && n.type !== "screengui" && n.type !== "frame" && n.type !== "image" && n.type !== "label" && n.type !== "empty" && n.type !== "sun" && n.type !== "button" && n.type !== "slider" && n.type !== "bar" && n.type !== "joystick") {
        if (n.type === "camera") {
          if (app.play) continue;
          var cdir = vnorm([-world[8], -world[9], -world[10]]);
          items.push({
            id: n.id + "cam",
            kind: "box",
            matrix: m4mul(world, m4compose([0, 0, -2], [0, 0, 0], [0.32, 0.24, 0.24])),
            color: "#2b2f36",
            unlit: false,
            opacity: 0.85,
            texid: "",
            texture: null
          });
        } else if (n.type === "sprite") {
          var info = spriteinfo[sprname];
          if (info) {
            var nat = [info.w / 64, info.h / 64, info.mode === "plane" ? 0.04 : info.depth];
            var mat = m4mul(world, m4scale(nat[0], nat[1], nat[2]));
            if (over && over.boby) mat[13] += over.boby;
            if (n.facecamera) {
              var st = app.camstate || camerastate();
              var yaw = Math.atan2(st.eye[0] - px, st.eye[2] - pz) * 180 / Math.PI;
              mat = m4mul(m4compose([px, py, pz], [0, yaw, 0], [1, 1, 1]), m4mul(m4compose([0, 0, 0], [0, 0, 0], scl), m4scale(nat[0], nat[1], nat[2])));
            }
            items.push({
              id: n.id,
              kind: info.mode === "plane" ? "plane" : "box",
              matrix: mat,
              color: n.color || "#ffffff",
              opacity: over && over.opacity !== undefined ? over.opacity : n.opacity,
              unlit: true,
              texid: "spr" + sprname,
              texture: spriteinfo[sprname] ? texturecanvas(sprname, app.project) : itemtexture(n),
              faces: info.mode === "plane" ? "" : "sprite",
              sidecolor: info.side,
              double: true,
              visible: true
            });
            if (info.mode === "plane") picks.push({ id: n.id, node: n, min: [px - nat[0] * scl[0] / 2, py - nat[1] * scl[1] / 2, pz - 0.2], max: [px + nat[0] * scl[0] / 2, py + nat[1] * scl[1] / 2, pz + 0.2] });
            else {
              var b = matrixbounds(mat, [0.5, 0.5, 0.5]);
              picks.push({ id: n.id, node: n, min: b.min, max: b.max });
            }
          }
        } else if (n.type === "tilemap") {
          tilemapitems(n, items);
          var tlb = matrixbounds(m4compose([px, py + 0.6, pz], [0, 0, 0], [8, 3, 1]), [0.5, 0.5, 0.5]);
          picks.push({ id: n.id, node: n, min: tlb.min, max: tlb.max });
        } else if (n.type === "model") {
          modelitems(n, items, world, picks);
        } else if (n.type === "mesh" || n.type === "skinned" || n.type === "procmesh") {
          var mg = null;
          var mk = "";
          if (n.type === "skinned") {
            if (typeof skingenmesh === "function") {
              mg = skingenmesh(n);
              mk = n.id + "sk" + (mg && mg.version ? mg.version : 0);
            }
          } else if (n.type === "procmesh") {
            if (!n.geo && typeof procmeshrun === "function") procmeshrun(n);
            mg = n.geo;
            mk = n.id + "pm" + (n.gver || 0);
          } else {
            mg = n.geo;
            mk = n.id + "ms" + (n.gver || 0);
          }
          if (mg && mg.pos && mg.pos.length) {
            items.push({ id: n.id, kind: "box", matrix: world, color: n.color || "#c8c8c8", opacity: n.opacity === undefined ? 1 : n.opacity, unlit: false, texid: "", texture: null, geokey: mk, geo: mg, double: true, vcolor: !!(mg.col && mg.col.length) });
            var mb = matrixbounds(world, [0.5, 0.5, 0.5]);
            picks.push({ id: n.id, node: n, min: mb.min, max: mb.max });
          }
        } else if (n.type === "landscape") {
          if (typeof landgeo === "function") {
            var lgeo = landgeo(n);
            items.push({ id: n.id, kind: "plane", matrix: world, color: "#ffffff", opacity: 1, unlit: false, texid: "", texture: null, geokey: n.id + "lg" + (n.lver || 0), geo: lgeo, double: true, vcolor: true });
            var half2 = (n.size || 30) / 2;
            picks.push({ id: n.id, node: n, min: [px - half2, py - 0.1, pz - half2], max: [px + half2, py + 6 + 0.1, pz + half2] });
          }
        } else if (markerspec(n)) {
          var ms2 = markerspec(n);
          items.push({
            id: n.id,
            kind: ms2.shape || "box",
            matrix: m4mul(world, m4compose(ms2.offset || [0, 0.5, 0], ms2.rot || [0, 0, 0], ms2.size || [1, 1, 1])),
            color: n.color || ms2.color || "#9aa7b4",
            opacity: ms2.opacity === undefined ? 0.85 : ms2.opacity,
            unlit: !!ms2.unlit,
            texid: "",
            texture: null,
            double: true
          });
          var mb2 = matrixbounds(world, ms2.size || [1, 1, 1]);
          picks.push({ id: n.id, node: n, min: mb2.min, max: mb2.max });
        } else if (n.type === "spline") {
          if (typeof splinegeo === "function") {
            var sgeo = splinegeo(n);
            items.push({ id: n.id, kind: "plane", matrix: world, color: n.color || "#4a4a52", opacity: 1, unlit: false, texid: "", texture: null, geokey: n.id + "sg" + (n.sver || 0), geo: sgeo, double: true });
            var sb = matrixbounds(world, [4, 0.2, 4]);
            picks.push({ id: n.id, node: n, min: sb.min, max: sb.max });
          }
        } else if (n.type === "foliage") {
          if (n.instances && n.instances.length) {
            var sinfo = spriteinfo[n.sprite || "tree"];
            if (sinfo) {
              n.instances.forEach(function (inst, ii) {
                var imat = m4mul(world, m4compose(inst.pos, [0, inst.rot || 0, 0], [inst.scl || 1, inst.scl || 1, inst.scl || 1]));
                imat = m4mul(imat, m4scale(sinfo.w / 64, sinfo.h / 64, sinfo.mode === "plane" ? 0.05 : sinfo.depth || 0.5));
                items.push({ id: n.id + "f" + ii, kind: "plane", matrix: imat, color: n.color || "#ffffff", opacity: 1, unlit: true, texid: "spr" + (n.sprite || "tree"), texture: texturecanvas(n.sprite || "tree", app.project), double: true });
              });
            }
            var fb = matrixbounds(world, [n.radius || 10, 3, n.radius || 10]);
            picks.push({ id: n.id, node: n, min: fb.min, max: fb.max });
          }
        } else if (n.type === "terrain") {
          if (n.heights && n.heights.length) {
            var tg = n.layers && n.layers.length && typeof landgeo === "function" ? landgeo(n) : tergeo(n);
            var tmat2 = m4mul(world, m4scale(1, n.scalez || 1, 1));
            items.push({ id: n.id, kind: "plane", matrix: tmat2, color: n.color || "#7fb35a", geokey: n.id + "t" + (n.tver || 0) + "l" + (n.lver || 0), geo: tg, opacity: 1, unlit: false, texid: "", texture: null, double: true, vcolor: !!(tg.col && tg.col.length) });
            var halfs = (n.size || 40) / 2;
            var tmax = 0;
            for (var hi = 0; hi < n.heights.length; hi++) if (n.heights[hi] > tmax) tmax = n.heights[hi];
            picks.push({ id: n.id, node: n, min: [px - halfs, py - 0.05, pz - halfs], max: [px + halfs, py + tmax * (n.scalez || 1) + 0.05, pz + halfs] });
          } else {
            var tmat = m4mul(world, m4scale(8, 2.4, 1));
            items.push({ id: n.id, kind: "plane", matrix: tmat, color: "#ffffff", opacity: 1, unlit: true, texid: "terrainhills", texture: artmake("nearhills"), double: true });
            var tb = matrixbounds(tmat, [0.5, 0.5, 0.5]);
            picks.push({ id: n.id, node: n, min: tb.min, max: tb.max });
          }
        } else if (n.type === "water") {
          var wmat = m4mul(world, m4scale(4, 0.06, 4));
          items.push({ id: n.id, kind: "box", matrix: wmat, color: "#8fd7f5", opacity: 0.85, unlit: true, texid: "watertex", texture: artmake("water"), faces: "", double: true });
          var wb = matrixbounds(wmat, [0.5, 0.5, 0.5]);
          picks.push({ id: n.id, node: n, min: wb.min, max: wb.max });
        } else if (n.type === "curve") {
          var cmat = m4mul(world, m4scale(2, 0.1, 0.1));
          items.push({ id: n.id, kind: "box", matrix: cmat, color: "#e2a03f", opacity: 1, unlit: false });
          picks.push({ id: n.id, node: n, min: [px - 1, py - 0.1, pz - 0.1], max: [px + 1, py + 0.1, pz + 0.1] });
        } else if (n.type === "text3d") {
          var t3 = m4mul(world, m4scale(4, 1, 0.1));
          items.push({ id: n.id, kind: "plane", matrix: t3, color: "#ffffff", opacity: 1, unlit: true, texid: "txt" + (n.text || ""), texture: textcanvas(n.text || "Text", n.color || "#ffffff", 56), double: true });
          var b3 = matrixbounds(t3, [0.5, 0.5, 0.5]);
          picks.push({ id: n.id, node: n, min: b3.min, max: b3.max });
        } else if (nodemeta[n.type]) {
          var kind = n.type === "plane" ? "plane" : n.type;
          items.push({ id: n.id, kind: kind, matrix: world, color: n.color || "#ffffff", opacity: n.opacity, unlit: false, texid: "", texture: null, double: n.type === "plane" });
          var bb = matrixbounds(world, [0.5, 0.5, n.type === "plane" ? 0.01 : 0.5]);
          picks.push({ id: n.id, node: n, min: bb.min, max: bb.max });
        }
      }
      if (vis && (n.type === "empty" || n.type === "canvas" || n.type === "camera" || n.type === "sun")) {
        picks.push({ id: n.id, node: n, min: [px - 0.35, py - 0.35, pz - 0.35], max: [px + 0.35, py + 0.35, pz + 0.35] });
      }
      if (n.children && n.children.length) visit(n.children, world, vis);
    }
  }
  visit(app.scene.objects || [], m4(), true);
  if (typeof lightspecs === "function") {
    var ls = lightspecs();
    for (var li = 0; li < ls.length; li++) items.push(ls[li]);
  }
  if (app.scene.env && app.scene.env.bgtype === "sky" && app.scene.env.sky) {
    var st2 = app.camstate || camerastate();
    var tex = artmake(app.scene.env.sky === "sky" ? "sky" : "sky");
    items.push({ id: "skyplane", kind: "plane", matrix: m4compose([st2.target[0], st2.target[1] + 6, -60], [0, 0, 0], [150, 90, 1]), color: "#ffffff", opacity: 1, unlit: true, texid: "skyplane", texture: tex, double: true });
  }
  var bakeon = app.scene.env && app.scene.env.baked;
  for (var bi = 0; bi < items.length; bi++) {
    var bit = items[bi];
    if (bit.id === "skyplane") continue;
    var bnode = null;
    for (var pi = 0; pi < picks.length && !bnode; pi++) {
      if (picks[pi].id === bit.id) bnode = picks[pi].node;
    }
    if (bnode && bnode.id) bnode = findnode(app.scene.objects, bnode.id) || bnode;
    if (!bnode || !bnode.bakelight) continue;
    if (!bakeon) {
      bit.color = bit.color || "#ffffff";
      continue;
    }
    if (typeof bit.color === "string" && bit.color.charAt(0) === "#" && bit.color.length === 7) {
      var fr = parseInt(bit.color.substr(1, 2), 16);
      var fg = parseInt(bit.color.substr(3, 2), 16);
      var fb = parseInt(bit.color.substr(5, 2), 16);
      var lf = Math.max(0.15, Math.min(1, bnode.bakelight));
      fr = Math.round(fr * lf);
      fg = Math.round(fg * lf);
      fb = Math.round(fb * lf);
      bit.color = "#" + ((1 << 24) + (fr << 16) + (fg << 8) + fb).toString(16).slice(1);
    }
  }
  return { items: items, picks: picks };
}

var gameover = null;

function mountscene(host) {
  host.innerHTML = '<div class="sceneview" id="stagewrap"><div class="scenestage" id="stage"><canvas id="maincanvas"></canvas><canvas id="overlaycanvas"></canvas></div></div>';
  view.stage = qs("#stage");
  view.canvas = qs("#maincanvas");
  view.overlay = qs("#overlaycanvas");
  view.octx = view.overlay.getContext("2d");
  view.main = makeview(view.canvas);
  if (typeof ppmount === "function") ppmount();
  if (typeof navbind === "function") navbind();
  if (typeof toolboot === "function") toolboot();
  if (typeof fxboot === "function") fxboot();
  if (typeof guitick === "function") guitick();
  var tools = [
    { act: "toolselect", icon: "move", label: "Select / move (W)", on: app.transformmode === "move" },
    { act: "toolrotate", icon: "rotate", label: "Rotate (E)", on: app.transformmode === "rotate" },
    { act: "toolscale", icon: "scale", label: "Scale (R)", on: app.transformmode === "scale" },
    { act: "toolmarquee", icon: "marquee", label: "Marquee select", on: app.transformmode === "marquee" },
    { sep: true },
    { act: "addobject", icon: "squareplus", label: "Add object" },
    { act: "focussel", icon: "target", label: "Focus selection (F)" },
    { act: "toggleortho", icon: "camera2d", label: "2D / orthographic view" },
    { act: "viewtop", icon: "grid", label: "Top view" },
    { act: "togglesun", icon: "sun", label: "Toggle sun light" },
    { act: "addcube", icon: "cube", label: "Add cube" },
    { act: "togglecam", icon: "camera", label: "Camera preview" },
    { act: "togglegrid", icon: "grid", label: "Grid (G)" },
    { act: "viewside", icon: "layers", label: "Side view" },
    { act: "viewpersp", icon: "cubeoutline", label: "Perspective view" }
  ];
  var html = '<div class="viewtools">';
  tools.forEach(function (t) {
    if (t.sep) html += '<div class="sep"></div>';
    else html += '<button class="vtool' + (t.on ? " on" : "") + '" data-act="' + t.act + '" title="' + esc(t.label) + '">' + ic(t.icon) + "</button>";
  });
  html += "</div>";
  html += '<div class="viewgizmo" id="viewgizmo"><svg viewBox="0 0 100 100">' +
    '<line x1="50" y1="52" x2="50" y2="16" stroke="#2c8a4b" stroke-width="3"/><circle cx="50" cy="13" r="8" fill="#2c8a4b"/><text x="50" y="16.5" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">Y</text>' +
    '<line x1="50" y1="52" x2="87" y2="66" stroke="#a8392f" stroke-width="3"/><circle cx="90" cy="67" r="8" fill="#a8392f"/><text x="90" y="70" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">X</text>' +
    '<line x1="50" y1="52" x2="16" y2="66" stroke="#2c5cae" stroke-width="3"/><circle cx="11" cy="67" r="8" fill="#2c5cae"/><text x="11" y="70" font-size="8" fill="#fff" text-anchor="middle" font-weight="700">Z</text>' +
    '<circle cx="50" cy="52" r="4.5" fill="#e2e6ee"/>' +
    "</svg></div>";
  html += '<button class="perspbtn" data-act="cycleview" id="perspbtn">Persp</button>';
  html += '<div class="campreview" id="campreview"><canvas id="previewcanvas"></canvas><span class="lbl">Camera</span><span class="grip" id="previewgrip"></span></div>';
  html += '<div class="viewhud" id="viewhud"></div>';
  html += '<div id="plugoverlay"></div>';
  html += '<div class="playui hide" id="playui"></div>';
  view.stage.insertAdjacentHTML("beforeend", html);
  view.previewbox = qs("#campreview");
  view.previewcanvas = qs("#previewcanvas");
  view.preview = makeview(view.previewcanvas);
  view.hud = qs("#viewhud");
  bindstage();
  resizestage();
  if (!view.loop) {
    view.loop = true;
    requestAnimationFrame(frameloop);
  }
}

function resizestage() {
  if (!view.stage) return;
  var r = view.stage.getBoundingClientRect();
  view.w = Math.max(1, Math.round(r.width));
  view.h = Math.max(1, Math.round(r.height));
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.canvas.style.width = "100%";
  view.canvas.style.height = "100%";
  view.overlay.width = Math.round(view.w * dpr);
  view.overlay.height = Math.round(view.h * dpr);
  view.overlay.style.width = view.w + "px";
  view.overlay.style.height = view.h + "px";
  view.octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (view.main) view.main.resize(view.w, view.h);
  if (view.preview) {
    var pr = view.previewcanvas.parentElement.getBoundingClientRect();
    view.preview.resize(Math.max(1, Math.round(pr.width)), Math.max(1, Math.round(pr.height)));
  }
}

var framecount = 0;
var lastts = 0;
var fpsval = 60;

function frameloop(ts) {
  if (!view.stage) {
    view.loop = false;
    return;
  }
  var dt = lastts ? Math.min(0.05, (ts - lastts) / 1000) : 0.016;
  lastts = ts;
  fpsval = fpsval * 0.9 + (1 / Math.max(0.001, dt)) * 0.1;
  framecount++;
  if (app.play) {
    tickgame(dt);
    renderplay();
  } else {
    if (typeof tickextras === "function") tickextras(dt);
    if (typeof plugtick === "function") plugtick(dt);
    if (typeof fxtick === "function") fxtick(dt, ts / 1000);
    if (typeof navtick === "function") navtick(dt);
    if (typeof xtick === "function") xtick(dt, ts / 1000, false);
    app.camstate = camerastate();
    var data = collectitems();
    view.items = data.items;
    view.picks = data.picks;
    var env = sceneenv();
    view.main.resize(view.w, view.h);
    view.main.render(data.items, app.camstate, env);
    drawoverlay();
    if (typeof guieditordraw === "function") guieditordraw(view.octx);
    if (typeof fxdraw === "function") fxdraw(view.octx, app.camstate, view.w, view.h);
    if (typeof r2tick === "function") r2tick(dt, ts / 1000);
    if (typeof gpusimdraw === "function") gpusimdraw(view.octx, app.camstate, view.w, view.h);
    if (typeof touchdraw === "function") touchdraw(view.octx, view.w, view.h);
    if (typeof proftick === "function") proftick();
  }
  if (view.preview && app.preview && !app.play && framecount % 3 === 0) {
    var prevcam = previewcamera();
    var penv = sceneenv();
    penv.grid = false;
    view.preview.resize(Math.round(view.previewcanvas.clientWidth || 250), Math.round(view.previewcanvas.clientHeight || 140));
    view.preview.render(view.items || [], prevcam, penv);
  }
  requestAnimationFrame(frameloop);
}

function drawoverlay() {
  var g = view.octx;
  if (!g) return;
  var w = view.w;
  var h = view.h;
  g.clearRect(0, 0, w, h);
  var cs = app.camstate;
  var m = cameramatrices(cs, w, h);
  if (typeof drawextras === "function") drawextras(g, cs, w, h);
  var node = selected();
  view.picks = view.picks || [];
  var selnodes = selectionnodes();
  selnodes.forEach(function (n) {
    var pick = null;
    for (var i = 0; i < view.picks.length; i++) if (view.picks[i].id === n.id) pick = view.picks[i];
    if (!pick) return;
    var corners = boxcorners(pick.min, pick.max);
    var pts = corners.map(function (c) {
      return projectpoint(m.vp, c, w, h);
    });
    if (!pts.every(function (p) { return !!p; })) return;
    var edges = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    g.strokeStyle = n === node ? "rgba(255,176,32,0.95)" : "rgba(140,190,255,0.85)";
    g.lineWidth = 1.4;
    g.setLineDash([]);
    edges.forEach(function (ed) {
      g.beginPath();
      g.moveTo(pts[ed[0]][0], pts[ed[0]][1]);
      g.lineTo(pts[ed[1]][0], pts[ed[1]][1]);
      g.stroke();
    });
    var top = pts.reduce(function (acc, p) {
      return p[1] < acc[1] ? p : acc;
    }, pts[0]);
    g.font = "600 11px Inter, Segoe UI, sans-serif";
    var label = n === node && selnodes.length > 1 ? n.name + "  +" + (selnodes.length - 1) + " selected" : n.name;
    if (selnodes.length > 1 && n !== node && selnodes.length > 3) return;
    var tw = g.measureText(label).width;
    g.fillStyle = "rgba(32,34,39,.9)";
    g.beginPath();
    var bx = top[0] - tw / 2 - 6;
    var by = top[1] - 26;
    if (g.roundRect) g.roundRect(bx, by, tw + 12, 18, 4);
    else g.rect(bx, by, tw + 12, 18);
    g.fill();
    g.fillStyle = "#f2f4f8";
    g.fillText(label, top[0] - tw / 2, by + 13);
  });
  if (node && !app.play) drawgizmo(g, node, m, w, h);
  if (dragstate && dragstate.mode === "marquee") {
    var x0 = Math.min(dragstate.sx, dragstate.cx);
    var y0 = Math.min(dragstate.sy, dragstate.cy);
    var bw = Math.abs(dragstate.cx - dragstate.sx);
    var bh = Math.abs(dragstate.cy - dragstate.sy);
    g.fillStyle = "rgba(96,150,240,0.12)";
    g.fillRect(x0, y0, bw, bh);
    g.strokeStyle = "rgba(120,175,255,0.95)";
    g.lineWidth = 1;
    g.setLineDash([4, 3]);
    g.strokeRect(x0 + 0.5, y0 + 0.5, bw, bh);
    g.setLineDash([]);
  }
  if (dragstate && dragstate.readout && dragstate.moved) {
    g.font = "600 11px Inter, Segoe UI, sans-serif";
    var txt = dragstate.readout;
    var tw2 = g.measureText(txt).width;
    var rx = dragstate.cx + 16;
    var ry = dragstate.cy + 18;
    g.fillStyle = "rgba(24,26,31,.94)";
    g.beginPath();
    if (g.roundRect) g.roundRect(rx, ry, tw2 + 14, 20, 4);
    else g.rect(rx, ry, tw2 + 14, 20);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.12)";
    g.stroke();
    g.fillStyle = "#ffd479";
    g.fillText(txt, rx + 7, ry + 14);
  }
}


function boxhandles(node, m, w, h) {
  var wp = worldpos(node);
  var size = nodesize(node);
  var half = [Math.max(0.04, size[0] / 2), Math.max(0.04, size[1] / 2), Math.max(0.04, size[2] / 2)];
  var xs = [];
  var ys = [];
  for (var i = 0; i < 8; i++) {
    var p = [wp[0] + (i & 1 ? half[0] : -half[0]), wp[1] + (i & 2 ? half[1] : -half[1]), wp[2] + (i & 4 ? half[2] : -half[2])];
    var sp = projectpoint(m.vp, p, w, h);
    if (!sp) continue;
    xs.push(sp[0]);
    ys.push(sp[1]);
  }
  if (xs.length < 2) return null;
  var x0 = Math.min.apply(null, xs);
  var x1 = Math.max.apply(null, xs);
  var y0 = Math.min.apply(null, ys);
  var y1 = Math.max.apply(null, ys);
  if (x1 - x0 < 8) {
    x0 -= 4;
    x1 += 4;
  }
  if (y1 - y0 < 8) {
    y0 -= 4;
    y1 += 4;
  }
  var mx = (x0 + x1) / 2;
  var my = (y0 + y1) / 2;
  var pts = [
    { id: "nw", x: x0, y: y0, sx: -1, sy: 1, ax: "xy" },
    { id: "n", x: mx, y: y0, sx: 0, sy: 1, ax: "y" },
    { id: "ne", x: x1, y: y0, sx: 1, sy: 1, ax: "xy" },
    { id: "e", x: x1, y: my, sx: 1, sy: 0, ax: "x" },
    { id: "se", x: x1, y: y1, sx: 1, sy: -1, ax: "xy" },
    { id: "s", x: mx, y: y1, sx: 0, sy: -1, ax: "y" },
    { id: "sw", x: x0, y: y1, sx: -1, sy: -1, ax: "xy" },
    { id: "w", x: x0, y: my, sx: -1, sy: 0, ax: "x" }
  ];
  return { x0: x0, y0: y0, x1: x1, y1: y1, cx: mx, cy: my, pts: pts };
}

function drawgizmo(g, node, m, w, h) {
  var wp = worldpos(node);
  var origin = projectpoint(m.vp, wp, w, h);
  if (!origin) return;
  var dist = Math.hypot((app.camstate.eye[0] - wp[0]), (app.camstate.eye[1] - wp[1]), (app.camstate.eye[2] - wp[2]));
  var len = Math.max(0.75, dist * 0.11);
  var axes = [
    { key: 0, name: "X", col: "#d8463a", dir: [1, 0, 0] },
    { key: 1, name: "Y", col: "#2fbb5c", dir: [0, 1, 0] },
    { key: 2, name: "Z", col: "#3b7ff0", dir: [0, 0, 1] }
  ];
  view.gizmohit = [];
  if (node.lock) {
    var lp = projectpoint(m.vp, wp, w, h);
    if (lp) {
      g.strokeStyle = "rgba(255,190,90,.9)";
      g.lineWidth = 1.5;
      g.setLineDash([5, 4]);
      g.beginPath();
      g.arc(lp[0], lp[1], 22, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = "rgba(255,190,90,.95)";
      g.font = "700 10px Inter, Segoe UI, sans-serif";
      g.fillText("LOCKED", lp[0] + 26, lp[1] + 3);
    }
    return;
  }
  var mode = app.transformmode;
  if (mode === "rotate") {
    axes.forEach(function (ax) {
      var pts = [];
      for (var a = 0; a <= 48; a++) {
        var ang = a / 48 * Math.PI * 2;
        var p = [wp[0], wp[1], wp[2]];
        if (ax.key === 0) {
          p[1] += Math.cos(ang) * len;
          p[2] += Math.sin(ang) * len;
        } else if (ax.key === 1) {
          p[0] += Math.cos(ang) * len;
          p[2] += Math.sin(ang) * len;
        } else {
          p[0] += Math.cos(ang) * len;
          p[1] += Math.sin(ang) * len;
        }
        var sp = projectpoint(m.vp, p, w, h);
        if (sp) pts.push(sp);
      }
      if (pts.length < 4) return;
      g.strokeStyle = ax.col;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]);
      g.stroke();
      view.gizmohit.push({ mode: "rotate", axis: ax.key, pts: pts });
    });
    var spinr = Math.max(46, len * 46);
    g.save();
    g.strokeStyle = "rgba(255,190,90,.85)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(origin[0], origin[1], spinr, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([3, 5]);
    g.strokeStyle = "rgba(255,190,90,.35)";
    g.beginPath();
    g.arc(origin[0], origin[1], spinr - 8, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "rgba(255,190,90,.95)";
    g.font = "700 10px Inter, Segoe UI, sans-serif";
    g.fillText("spin", origin[0] + spinr + 4, origin[1] + 3);
    g.restore();
    view.gizmohit.push({ mode: "spinz", cx: origin[0], cy: origin[1], r: spinr });
    return;
  }
  if (mode === "scale") {
    var bh = boxhandles(node, m, w, h);
    if (bh) {
      g.save();
      g.strokeStyle = "rgba(255,255,255,.55)";
      g.lineWidth = 1;
      g.setLineDash([4, 3]);
      g.strokeRect(bh.x0, bh.y0, bh.x1 - bh.x0, bh.y1 - bh.y0);
      g.setLineDash([]);
      g.restore();
      bh.pts.forEach(function (pt) {
        g.fillStyle = pt.ax === "xy" ? "#ffd479" : "#eef2f8";
        g.strokeStyle = "rgba(20,24,30,.85)";
        g.lineWidth = 1.2;
        g.beginPath();
        if (pt.ax === "xy") {
          g.rect(pt.x - 4.5, pt.y - 4.5, 9, 9);
        } else if (pt.ax === "x") {
          g.rect(pt.x - 5, pt.y - 3, 10, 6);
        } else {
          g.rect(pt.x - 3, pt.y - 5, 6, 10);
        }
        g.fill();
        g.stroke();
      });
      view.gizmohit.push({ mode: "boxscale", box: bh });
    }
  }
  axes.forEach(function (ax) {
    var end = [wp[0] + ax.dir[0] * len, wp[1] + ax.dir[1] * len, wp[2] + ax.dir[2] * len];
    var sp = projectpoint(m.vp, end, w, h);
    if (!sp) return;
    g.strokeStyle = ax.col;
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(origin[0], origin[1]);
    g.lineTo(sp[0], sp[1]);
    g.stroke();
    if (mode === "scale") {
      g.fillStyle = ax.col;
      g.fillRect(sp[0] - 4, sp[1] - 4, 8, 8);
    } else {
      var ang = Math.atan2(sp[1] - origin[1], sp[0] - origin[0]);
      g.fillStyle = ax.col;
      g.beginPath();
      g.moveTo(sp[0], sp[1]);
      g.lineTo(sp[0] - Math.cos(ang - 0.4) * 9, sp[1] - Math.sin(ang - 0.4) * 9);
      g.lineTo(sp[0] - Math.cos(ang + 0.4) * 9, sp[1] - Math.sin(ang + 0.4) * 9);
      g.closePath();
      g.fill();
    }
    g.fillStyle = ax.col;
    g.font = "700 10px Inter, Segoe UI, sans-serif";
    g.fillText(ax.name, sp[0] + 6, sp[1] - 5);
    view.gizmohit.push({ mode: mode, axis: ax.key, a: origin, b: sp });
  });
  g.fillStyle = "#f2f4f8";
  g.beginPath();
  g.arc(origin[0], origin[1], 3.4, 0, Math.PI * 2);
  g.fill();
}

function localcoords(ev) {
  var r = view.stage.getBoundingClientRect();
  return [ev.clientX - r.left, ev.clientY - r.top];
}

function pickat(x, y) {
  var cs = app.camstate || camerastate();
  var ray = rayfromscreen(cs, x, y, view.w, view.h);
  var best = null;
  var bestt = Infinity;
  (view.picks || []).forEach(function (p) {
    if (p.node && p.node.lock) return;
    var t = raybox(ray.origin, ray.dir, p.min, p.max);
    if (t !== null && t < bestt) {
      bestt = t;
      best = p;
    }
  });
  return best;
}

function gizmohit(x, y) {
  if (!view.gizmohit) return null;
  for (var i = 0; i < view.gizmohit.length; i++) {
    var h = view.gizmohit[i];
    if (h.mode === "boxscale") {
      for (var b2 = 0; b2 < h.box.pts.length; b2++) {
        var hpt = h.box.pts[b2];
        if (Math.abs(x - hpt.x) <= 6 && Math.abs(y - hpt.y) <= 6) return { mode: "boxscale", axis: hpt.ax, corner: hpt, box: h.box };
      }
      continue;
    }
    if (h.mode === "spinz") {
      var dd = Math.hypot(x - h.cx, y - h.cy);
      if (Math.abs(dd - h.r) < 7) return { mode: "spinz", cx: h.cx, cy: h.cy, r: h.r };
      continue;
    }
    if (h.mode === "rotate") {
      for (var k = 0; k < h.pts.length - 1; k++) {
        if (segdist(x, y, h.pts[k], h.pts[k + 1]) < 6) return h;
      }
    } else if (segdist(x, y, h.a, h.b) < 7) return h;
  }
  return null;
}

function segdist(px, py, a, b) {
  var dx = b[0] - a[0];
  var dy = b[1] - a[1];
  var l2 = dx * dx + dy * dy;
  var t = l2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

var dragstate = null;

function opencanvasmenu(x, y) {
  var items = [
    { label: "Add object…", icon: "plus", act: "addobject" },
    { label: "Add component…", icon: "component", act: "addcomponent" },
    { sep: true },
    { label: "Paste", icon: "file", act: "objpaste" },
    { label: "Focus selection", icon: "target", act: "objfocus", key: "F" },
    { sep: true },
    { label: "Reset camera", icon: "camera", act: "resetcamera" },
    { label: "Toggle grid", icon: "grid", act: "togglegrid", key: "G" },
    { label: "Toggle camera preview", icon: "camera", act: "togglecam" }
  ];
  if (selected()) items.splice(4, 0, { label: "Duplicate", icon: "duplicate", act: "objduplicate", key: "Ctrl+D" }, { label: "Delete", icon: "trash", act: "objdelete", key: "Del" });
  openmenu(items, x, y);
}

function bindstage() {
  var stage = view.stage;
  stage.addEventListener("contextmenu", function (ev) {
    ev.preventDefault();
    if (app.play) return;
    var p = localcoords(ev);
    var pick = pickat(p[0], p[1]);
    if (pick) {
      app.selid = pick.id;
      refreshpickers();
    }
    opencanvasmenu(ev.clientX, ev.clientY);
  });
  stage.addEventListener("pointerdown", function (ev) {
    if (app.play) return;
    if (ev.target && ev.target.closest && ev.target.closest(".viewtools, .viewgizmo, .perspbtn, .campreview, .viewhud, .playui, .playbar, button, input, select")) return;
    var p = localcoords(ev);
    if (ev.button === 2) {
      dragstate = { mode: "pan", sx: p[0], sy: p[1], target: app.cam.target.slice() };
      stage.setPointerCapture(ev.pointerId);
      return;
    }
    if (app.paint && app.paint.on) {
      app.paint.x = p[0];
      app.paint.y = p[1];
      if (tilepaintat(p[0], p[1], ev.altKey)) {
        dragstate = { mode: "paint", erase: ev.altKey };
        stage.setPointerCapture(ev.pointerId);
        return;
      }
    }
    if (app.transformmode === "marquee" || (ev.shiftKey && !pickat(p[0], p[1]))) {
      dragstate = { mode: "marquee", sx: p[0], sy: p[1], cx: p[0], cy: p[1], base: ev.shiftKey && app.selids ? app.selids.slice() : [] };
      stage.setPointerCapture(ev.pointerId);
      return;
    }
    var hit = gizmohit(p[0], p[1]);
    if (hit) {
      var node = selected();
      if (node && !node.lock) {
        var ds = { mode: hit.mode, axis: hit.axis, node: node, sx: p[0], sy: p[1], cx: p[0], cy: p[1], startpos: node.pos.slice(), startrot: node.rot.slice(), startscl: node.scl.slice(), snap: snapshot() };
        if (hit.mode === "boxscale") {
          ds.corner = hit.corner;
          ds.box = hit.box;
          ds.startsize = nodesize(node);
          ds.startworld = worldpos(node);
          ds.group = selectionnodes().map(function (n2) {
            return { node: n2, pos: n2.pos.slice(), scl: n2.scl.slice() };
          });
        }
        if (hit.mode === "spinz") {
          ds.ox = hit.cx;
          ds.oy = hit.cy;
          ds.startangle = Math.atan2(p[1] - hit.cy, p[0] - hit.cx);
          ds.group = selectionnodes().map(function (n2) {
            return { node: n2, rot: n2.rot.slice() };
          });
        }
        dragstate = ds;
        stage.setPointerCapture(ev.pointerId);
        return;
      }
    }
    var pick = pickat(p[0], p[1]);
    if (pick) {
      if (ev.shiftKey) {
        app.selids = app.selids || [];
        var at = app.selids.indexOf(pick.id);
        if (at >= 0) app.selids.splice(at, 1);
        else app.selids.push(pick.id);
        app.selid = app.selids.length ? app.selids[app.selids.length - 1] : null;
      } else if (!app.selids || app.selids.indexOf(pick.id) < 0) {
        app.selid = pick.id;
        app.selids = [pick.id];
      } else {
        app.selid = pick.id;
      }
      refreshpickers();
      view.selpick = pick;
      var nsel = selected();
      var group = selectionnodes().map(function (n) {
        return { node: n, pos: n.pos.slice(), rot: n.rot.slice(), scl: n.scl.slice() };
      });
      dragstate = { mode: "freenmove", node: nsel, group: group, sx: p[0], sy: p[1], cx: p[0], cy: p[1], startpos: nsel.pos.slice(), snap: snapshot(), moved: false };
      stage.setPointerCapture(ev.pointerId);
      return;
    }
    app.selids = [];
    dragstate = { mode: "orbit", sx: p[0], sy: p[1], yaw: app.cam.yaw, pitch: app.cam.pitch };
    stage.setPointerCapture(ev.pointerId);
  });
  stage.addEventListener("pointermove", function (ev) {
    if (app.play) return;
    if (!dragstate) {
      var hov = localcoords(ev);
      if (app.paint && app.paint.on) {
        app.paint.x = hov[0];
        app.paint.y = hov[1];
        stage.style.cursor = "crosshair";
        return;
      }
      var gh = gizmohit(hov[0], hov[1]);
      if (gh && gh.mode === "boxscale") {
        var cc = gh.corner;
        stage.style.cursor = cc.sx === 0 ? "ns-resize" : cc.sy === 0 ? "ew-resize" : (cc.sx * cc.sy > 0 ? "nwse-resize" : "nesw-resize");
      } else if (gh && gh.mode === "spinz") {
        stage.style.cursor = "grab";
      } else if (gh) {
        stage.style.cursor = "move";
      } else {
        stage.style.cursor = "";
      }
      return;
    }
    var p = localcoords(ev);
    if (dragstate.mode === "paint") {
      app.paint.x = p[0];
      app.paint.y = p[1];
      tilepaintat(p[0], p[1], ev.altKey || dragstate.erase);
      return;
    }
    var dx = p[0] - dragstate.sx;
    var dy = p[1] - dragstate.sy;
    if (dragstate.mode !== "orbit" && dragstate.mode !== "pan" && !dragstate.moved && Math.hypot(dx, dy) > 3) dragstate.moved = true;
    if (dragstate.mode === "marquee") {
      dragstate.cx = p[0];
      dragstate.cy = p[1];
      dragstate.moved = Math.abs(dragstate.cx - dragstate.sx) + Math.abs(dragstate.cy - dragstate.sy) > 4;
      var cs0 = app.camstate || camerastate();
      var mm0 = cameramatrices(cs0, view.w, view.h);
      var hits = [];
      (view.picks || []).forEach(function (pk) {
        if (pk.node && pk.node.lock) return;
        var c = [(pk.min[0] + pk.max[0]) / 2, (pk.min[1] + pk.max[1]) / 2, (pk.min[2] + pk.max[2]) / 2];
        var sp = projectpoint(mm0.vp, c, view.w, view.h);
        if (!sp) return;
        var x0 = Math.min(dragstate.sx, dragstate.cx);
        var x1 = Math.max(dragstate.sx, dragstate.cx);
        var y0 = Math.min(dragstate.sy, dragstate.cy);
        var y1 = Math.max(dragstate.sy, dragstate.cy);
        if (sp[0] >= x0 && sp[0] <= x1 && sp[1] >= y0 && sp[1] <= y1 && hits.indexOf(pk.id) < 0) hits.push(pk.id);
      });
      var merged = dragstate.base.slice();
      hits.forEach(function (id) {
        if (merged.indexOf(id) < 0) merged.push(id);
      });
      app.selids = merged;
      app.selid = merged.length ? merged[merged.length - 1] : null;
      refreshpickers();
      return;
    }
    if (dragstate.mode === "orbit") {
      app.cam.yaw = dragstate.yaw - dx * 0.006;
      app.cam.pitch = Math.max(-1.1, Math.min(1.35, dragstate.pitch + dy * 0.005));
      app.cam.mode = "persp";
      updateviewgizmo();
    } else if (dragstate.mode === "pan") {
      var cs = app.camstate;
      var forward = vnorm(vsub(cs.target, cs.eye));
      var right = vnorm(vcross(forward, [0, 1, 0]));
      var up = vcross(right, forward);
      var k = app.cam.dist * 0.0016;
      app.cam.target[0] = dragstate.target[0] - right[0] * dx * k + up[0] * dy * k;
      app.cam.target[1] = dragstate.target[1] - right[1] * dx * k + up[1] * dy * k;
      app.cam.target[2] = dragstate.target[2] - right[2] * dx * k + up[2] * dy * k;
    } else if (dragstate.node) {
      var node = dragstate.node;
      dragstate.cx = p[0];
      dragstate.cy = p[1];
      if (dragstate.mode === "freenmove") {
        var cs2 = app.camstate;
        var forward2 = vnorm(vsub(cs2.target, cs2.eye));
        var right2 = vnorm(vcross(forward2, [0, 1, 0]));
        var up2 = vcross(right2, forward2);
        var scale = Math.hypot(cs2.eye[0] - node.pos[0], cs2.eye[1] - node.pos[1], cs2.eye[2] - node.pos[2]) * 0.0016;
        var snapstep = ev.altKey ? 0.05 : 0.25;
        node.pos[0] = Math.round((dragstate.startpos[0] + (right2[0] * dx + up2[0] * -dy) * scale) / snapstep) * snapstep;
        node.pos[1] = Math.round((dragstate.startpos[1] + (right2[1] * dx + up2[1] * -dy) * scale) / snapstep) * snapstep;
        if (ev.shiftKey) node.pos[2] = Math.round((dragstate.startpos[2] + (forward2[2] * dy) * scale * 0.6) / snapstep) * snapstep;
        dragstate.readout = "X " + node.pos[0].toFixed(2) + "  Y " + node.pos[1].toFixed(2) + "  Z " + node.pos[2].toFixed(2);
        if (dragstate.group && dragstate.group.length > 1) {
          var ddx = node.pos[0] - dragstate.startpos[0];
          var ddy = node.pos[1] - dragstate.startpos[1];
          var ddz = node.pos[2] - dragstate.startpos[2];
          dragstate.group.forEach(function (g) {
            if (g.node === node) return;
            g.node.pos[0] = Math.round((g.pos[0] + ddx) / 0.05) * 0.05;
            g.node.pos[1] = Math.round((g.pos[1] + ddy) / 0.05) * 0.05;
            g.node.pos[2] = Math.round((g.pos[2] + ddz) / 0.05) * 0.05;
          });
          dragstate.readout += "  ·  " + dragstate.group.length + " objects";
        }
      } else if (dragstate.mode === "move") {
        var cs3 = app.camstate;
        var m = cameramatrices(cs3, view.w, view.h);
        var wp = worldpos(node);
        var a = projectpoint(m.vp, wp, view.w, view.h);
        var b0 = [wp[0], wp[1], wp[2]];
        if (dragstate.axis === 0) b0[0] += 1;
        if (dragstate.axis === 1) b0[1] += 1;
        if (dragstate.axis === 2) b0[2] += 1;
        var b = projectpoint(m.vp, b0, view.w, view.h);
        if (a && b) {
          var ax = [b[0] - a[0], b[1] - a[1]];
          var l = Math.hypot(ax[0], ax[1]) || 1;
          var amount = (dx * ax[0] + dy * ax[1]) / l / l;
          var step = ev.altKey ? 0.05 : 0.25;
          node.pos[dragstate.axis] = Math.round((dragstate.startpos[dragstate.axis] + amount) / step) * step;
          dragstate.readout = ["X", "Y", "Z"][dragstate.axis] + " " + node.pos[dragstate.axis].toFixed(2);
          dragstate.cx = p[0];
          dragstate.cy = p[1];
          if (dragstate.group && dragstate.group.length > 1) {
            var delta = node.pos[dragstate.axis] - dragstate.startpos[dragstate.axis];
            dragstate.group.forEach(function (g) {
              if (g.node === node) return;
              g.node.pos[dragstate.axis] = Math.round((g.pos[dragstate.axis] + delta) / 0.05) * 0.05;
            });
            dragstate.readout += "  ·  " + dragstate.group.length + " objects";
          }
        }
      } else if (dragstate.mode === "rotate") {
        var rstep = ev.altKey ? 1 : 15;
        node.rot[dragstate.axis] = Math.round((dragstate.startrot[dragstate.axis] + dx * 0.7) / rstep) * rstep;
        dragstate.readout = ["X", "Y", "Z"][dragstate.axis] + " " + Math.round(node.rot[dragstate.axis]) + "°";
        dragstate.cx = p[0];
        dragstate.cy = p[1];
        if (dragstate.group && dragstate.group.length > 1) {
          var rdelta = node.rot[dragstate.axis] - dragstate.startrot[dragstate.axis];
          dragstate.group.forEach(function (g) {
            if (g.node === node) return;
            g.node.rot[dragstate.axis] = Math.round(g.rot[dragstate.axis] + rdelta);
          });
        }
      } else if (dragstate.mode === "boxscale") {
        var cn = dragstate.corner;
        var bx = dragstate.box;
        var bw = Math.max(12, bx.x1 - bx.x0);
        var bh2 = Math.max(12, bx.y1 - bx.y0);
        var fx = 1;
        var fy = 1;
        if (cn.sx !== 0) fx = 1 + (dx * (cn.sx > 0 ? 1 : -1)) / bw;
        if (cn.sy !== 0) fy = 1 + (-dy * (cn.sy > 0 ? 1 : -1)) / bh2;
        if (cn.ax === "xy") {
          if (ev.ctrlKey || ev.metaKey) {
            var fu = Math.max(fx, fy);
            fx = fu;
            fy = fu;
          }
        }
        fx = Math.max(0.04, Math.min(40, fx));
        fy = Math.max(0.04, Math.min(40, fy));
        var snapf = function (v) {
          return Math.round(v * 50) / 50;
        };
        if (cn.ax !== "y") node.scl[0] = Math.max(0.02, snapf(dragstate.startscl[0] * fx));
        if (cn.ax !== "x") node.scl[1] = Math.max(0.02, snapf(dragstate.startscl[1] * fy));
        if (ev.shiftKey) {
          var uni = Math.max(node.scl[0] / Math.max(0.02, dragstate.startscl[0]), node.scl[1] / Math.max(0.02, dragstate.startscl[1]));
          node.scl[0] = Math.max(0.02, snapf(dragstate.startscl[0] * uni));
          node.scl[1] = Math.max(0.02, snapf(dragstate.startscl[1] * uni));
        }
        var ns = nodesize(node);
        var dw = ns[0] - dragstate.startsize[0];
        var dh = ns[1] - dragstate.startsize[1];
        var dpx = 0;
        var dpy = 0;
        if (!ev.altKey) {
          if (cn.sx !== 0) dpx = cn.sx * dw / 2;
          if (cn.sy !== 0) dpy = cn.sy * dh / 2;
        }
        if (dpx !== 0 || dpy !== 0) {
          node.pos[0] = Math.round((dragstate.startpos[0] + dpx) * 200) / 200;
          node.pos[1] = Math.round((dragstate.startpos[1] + dpy) * 200) / 200;
          if (dragstate.group && dragstate.group.length > 1) {
            dragstate.group.forEach(function (gm) {
              if (gm.node === node) return;
              gm.node.pos[0] = Math.round((gm.pos[0] + dpx) * 200) / 200;
              gm.node.pos[1] = Math.round((gm.pos[1] + dpy) * 200) / 200;
            });
          }
        }
        dragstate.readout = "scale X " + node.scl[0].toFixed(2) + "  Y " + node.scl[1].toFixed(2) + (ev.altKey ? "  from centre" : "  " + (ev.altKey ? "" : "opposite edge pinned"));
        if (dragstate.group && dragstate.group.length > 1) {
          var rx = node.scl[0] / Math.max(0.02, dragstate.startscl[0]);
          var ry = node.scl[1] / Math.max(0.02, dragstate.startscl[1]);
          dragstate.group.forEach(function (g2) {
            if (g2.node === node) return;
            g2.node.scl[0] = Math.max(0.02, Math.round(g2.scl[0] * rx * 50) / 50);
            g2.node.scl[1] = Math.max(0.02, Math.round(g2.scl[1] * ry * 50) / 50);
          });
          dragstate.readout += "  ·  " + dragstate.group.length + " objects";
        }
      } else if (dragstate.mode === "spinz") {
        var ang3 = Math.atan2(p[1] - dragstate.oy, p[0] - dragstate.ox);
        var delta = (ang3 - dragstate.startangle) * 180 / Math.PI;
        if (ev.shiftKey) delta += 45;
        var rstep2 = ev.altKey ? 1 : 15;
        node.rot[2] = Math.round((dragstate.startrot[2] + delta) / rstep2) * rstep2;
        dragstate.readout = "Z " + Math.round(node.rot[2]) + "°";
        if (dragstate.group && dragstate.group.length > 1) {
          var rdel = node.rot[2] - dragstate.startrot[2];
          dragstate.group.forEach(function (g3) {
            if (g3.node === node) return;
            g3.node.rot[2] = Math.round(g3.rot[2] + rdel);
          });
          dragstate.readout += "  ·  " + dragstate.group.length + " objects";
        }
      } else if (dragstate.mode === "scale") {
        var f = Math.max(0.05, 1 + dx * 0.01);
        node.scl[dragstate.axis] = Math.max(0.02, Math.round(dragstate.startscl[dragstate.axis] * f * 20) / 20);
        dragstate.readout = ["X", "Y", "Z"][dragstate.axis] + " ×" + node.scl[dragstate.axis].toFixed(2);
        dragstate.cx = p[0];
        dragstate.cy = p[1];
        if (dragstate.group && dragstate.group.length > 1) {
          var sf = node.scl[dragstate.axis] / Math.max(0.02, dragstate.startscl[dragstate.axis]);
          dragstate.group.forEach(function (g) {
            if (g.node === node) return;
            g.node.scl[dragstate.axis] = Math.max(0.02, Math.round(g.scl[dragstate.axis] * sf * 20) / 20);
          });
        }
      }
      liveupdatefields(node);
    }
  });
  stage.addEventListener("pointerup", function (ev) {
    if (dragstate && dragstate.mode === "marquee") refreshall();
    if (dragstate && dragstate.node && dragstate.moved) {
      app.undolist.push(dragstate.snap);
      if (app.undolist.length > 60) app.undolist.shift();
      app.redolist = [];
      app.dirty = true;
      saveprojects();
      refreshall();
    }
    dragstate = null;
  });
  stage.addEventListener("dblclick", function () {
    focusselected();
  });
  stage.addEventListener("wheel", function (ev) {
    if (app.play) return;
    ev.preventDefault();
    if (app.cam.ortho) {
      app.cam.halfw = Math.max(1.2, Math.min(60, (app.cam.halfw || app.cam.dist * 0.42) * Math.exp(ev.deltaY * 0.0011)));
      app.cam.dist = Math.max(2.5, Math.min(80, app.cam.halfw / 0.42));
    } else {
      app.cam.dist = Math.max(2.5, Math.min(80, app.cam.dist * Math.exp(ev.deltaY * 0.0011)));
    }
  }, { passive: false });

  var prev = qs("#campreview");
  if (prev) {
    var pm = null;
    prev.addEventListener("pointerdown", function (ev) {
      var grip = ev.target.closest("#previewgrip");
      var r = prev.getBoundingClientRect();
      var sr = view.stage.getBoundingClientRect();
      pm = { grip: !!grip, x: ev.clientX, y: ev.clientY, left: r.left - sr.left, top: r.top - sr.top, w: r.width, h: r.height };
      prev.setPointerCapture(ev.pointerId);
      ev.stopPropagation();
    });
    prev.addEventListener("pointermove", function (ev) {
      if (!pm) return;
      var dx = ev.clientX - pm.x;
      var dy = ev.clientY - pm.y;
      if (pm.grip) {
        var w = Math.max(140, pm.w + dx);
        var h = Math.max(80, pm.h + dy);
        prev.style.width = w + "px";
        prev.style.height = h + "px";
        resizestage();
      } else {
        var sr2 = view.stage.getBoundingClientRect();
        var left = Math.max(4, Math.min(sr2.width - pm.w - 4, pm.left + dx));
        var top = Math.max(4, Math.min(sr2.height - pm.h - 4, pm.top + dy));
        prev.style.left = left + "px";
        prev.style.right = "auto";
        prev.style.top = top + "px";
        prev.style.bottom = "auto";
      }
    });
    prev.addEventListener("pointerup", function () {
      pm = null;
    });
  }
}

function liveupdatefields(node) {
  var fields = qsa('[data-node="' + node.id + '"]');
  fields.forEach(function (el) {
    var f = el.getAttribute("data-field");
    if (!f) return;
    var parts = f.split(".");
    if (parts.length === 2 && node[parts[0]]) {
      var v = node[parts[0]][+parts[1]];
      if (document.activeElement !== el) el.value = +(+v).toFixed(2);
    } else if (parts.length === 1 && parts[0] === "opacity") {
      el.value = node.opacity;
    }
  });
}

function focusselected() {
  var node = selected();
  if (!node) {
    app.cam.target = [0, 0.2, 0];
    app.cam.dist = 17.5;
    return;
  }
  var ext = nodeextents(node);
  app.cam.target = worldpos(node);
  app.cam.dist = Math.max(3.5, Math.max(ext[0], ext[1]) * 5.2);
}

function updateviewgizmo() {
  var gz = qs("#viewgizmo");
  if (!gz) return;
  gz.style.transform = "rotate(" + (-app.cam.yaw * 0.55) + "rad)";
  var pb = qs("#perspbtn");
  if (pb) pb.textContent = app.cam.mode === "persp" ? "Persp" : app.cam.mode.charAt(0).toUpperCase() + app.cam.mode.slice(1);
}

function setviewmode(mode) {
  app.cam.mode = mode;
  if (mode === "front") {
    app.cam.yaw = 0;
    app.cam.pitch = 0;
  }
  if (mode === "top") {
    app.cam.pitch = 1.3;
  }
  if (mode === "side") {
    app.cam.yaw = Math.PI / 2;
    app.cam.pitch = 0;
  }
  updateviewgizmo();
}
