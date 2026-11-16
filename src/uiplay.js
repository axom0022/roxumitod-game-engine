var uistate = { hover: null, active: null, drag: null, press: 0 };

function uicanvasnode() {
  var out = null;
  (app.scene.objects || []).forEach(function (n) {
    if ((n.type === "canvas" || n.type === "screengui") && !out) out = n;
  });
  return out;
}

function uirefsize() {
  var c = uicanvasnode();
  var d = (c && c.compdata && c.compdata.ui) || {};
  var refw = parseFloat(d.refw) || 740;
  var refh = parseFloat(d.refh) || 360;
  return { w: refw, h: refh, mode: d.scalemode || "Scale with screen size" };
}

function uivalue(node, key, fallback) {
  var d = node.compdata && node.compdata.ui ? node.compdata.ui : {};
  var v = d[key];
  if (v === undefined || v === null || v === "") return fallback;
  var n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function uitext(node) {
  if (node.text !== undefined && node.text !== "") return node.text;
  var d = node.compdata && node.compdata.ui ? node.compdata.ui : {};
  return d.label === undefined ? "" : String(d.label);
}

function uianchor(anchor) {
  var map = { "Top left": [0, 0], "Top center": [0.5, 0], "Top right": [1, 0], "Center": [0.5, 0.5], "Bottom left": [0, 1], "Bottom center": [0.5, 1], "Bottom right": [1, 1] };
  return map[anchor] || [0.5, 0.5];
}

function uirect(node, w, h, s, ref) {
  var ax = uianchor(node.compdata && node.compdata.ui ? node.compdata.ui.anchor : "Center");
  var ox = uivalue(node, "x", 0) * s;
  var oy = uivalue(node, "y", 0) * s;
  var bw = Math.max(4, uivalue(node, "w", 160) * s);
  var bh = Math.max(4, uivalue(node, "h", 44) * s);
  if (node.type === "joystick") {
    bw = bh = uivalue(node, "w", 130) * s;
  }
  var cx = (w - ref.w * s) / 2 + ax[0] * ref.w * s + ox;
  var cy = (h - ref.h * s) / 2 + ax[1] * ref.h * s + oy;
  var px = uivalue(node, "pivot", 0.5);
  var py = uivalue(node, "pivot", 0.5);
  return { x: cx - bw * px, y: cy - bh * py, w: bw, h: bh, cx: cx, cy: cy };
}

function uicolors(node) {
  var d = node.compdata && node.compdata.ui ? node.compdata.ui : {};
  return {
    bg: d.color || "#2f6fd0",
    fg: d.textcolor || "#ffffff",
    border: d.border || "rgba(0,0,0,.28)",
    radius: uivalue(node, "radius", 8)
  };
}

function uiround(g, r) {
  var rad = Math.min(r.h / 2, Math.max(0, r.radius || 6));
  g.beginPath();
  if (g.roundRect) g.roundRect(r.x, r.y, r.w, r.h, rad);
  else {
    g.moveTo(r.x + rad, r.y);
    g.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
    g.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
    g.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
    g.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
    g.closePath();
  }
}

function uifont(node) {
  var d = node.compdata && node.compdata.ui ? node.compdata.ui : {};
  var size = Math.round(uivalue(node, "fontsize", 20));
  var bold = d.bold === undefined ? true : !!d.bold;
  var italic = !!d.italic;
  var fam = d.font || "Inter, Segoe UI, sans-serif";
  return (italic ? "italic " : "") + (bold ? "700 " : "500 ") + size + "px " + fam;
}

function udrawitem(g, node, w, h, s, ref) {
  if (node.visible === false) return;
  var r = uirect(node, w, h, s, ref);
  var col = uicolors(node);
  if (node.type === "label") {
    var fsize = uivalue(node, "fontsize", 22) * s;
    var d = node.compdata && node.compdata.ui ? node.compdata.ui : {};
    var fam = d.font || "Inter, Segoe UI, sans-serif";
    var bold = d.bold === undefined ? true : !!d.bold;
    g.font = (d.italic ? "italic " : "") + (bold ? "700 " : "500 ") + Math.round(fsize) + "px " + fam;
    g.fillStyle = col.fg;
    g.textBaseline = "middle";
    g.textAlign = "center";
    g.fillText(uitext(node), r.cx, r.cy);
  } else if (node.type === "button") {
    var press = uistate.active === node.id;
    var hov = uistate.hover === node.id;
    g.save();
    g.shadowColor = "rgba(0,0,0,.35)";
    g.shadowBlur = hov ? 12 : 6;
    g.shadowOffsetY = 2;
    g.fillStyle = press ? uishade(col.bg, -0.18) : hov ? uishade(col.bg, 0.12) : col.bg;
    uiround(g, r);
    g.fill();
    g.restore();
    g.strokeStyle = col.border;
    g.lineWidth = 1.5;
    uiround(g, r);
    g.stroke();
    g.font = uifont(node).replace(/^\d+px/, Math.round(uivalue(node, "fontsize", 20) * s) + "px");
    g.fillStyle = col.fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(uitext(node), r.cx, r.cy);
  } else if (node.type === "bar") {
    var v = Math.max(0, Math.min(1, uivalue(node, "value", 0.6)));
    g.fillStyle = "rgba(12,16,22,.55)";
    uiround(g, r);
    g.fill();
    var inner = { x: r.x + 2, y: r.y + 2, w: Math.max(0, (r.w - 4) * v), h: r.h - 4, radius: Math.max(0, col.radius - 2) };
    var grad = g.createLinearGradient(r.x, r.y, r.x + r.w, r.y);
    grad.addColorStop(0, col.bg);
    grad.addColorStop(1, uishade(col.bg, 0.28));
    g.fillStyle = grad;
    uiround(g, inner);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.25)";
    g.lineWidth = 1;
    uiround(g, r);
    g.stroke();
    if (uitext(node)) {
      g.font = uifont(node).replace(/^\d+px/, Math.round(uivalue(node, "fontsize", 13) * s) + "px");
      g.fillStyle = col.fg;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(uitext(node), r.cx, r.cy);
    }
  } else if (node.type === "slider") {
    var sv = Math.max(0, Math.min(1, uivalue(node, "value", 0.5)));
    var trk = { x: r.x, y: r.cy - r.h * 0.16, w: r.w, h: Math.max(4, r.h * 0.32), radius: r.h * 0.16 };
    g.fillStyle = "rgba(14,18,24,.5)";
    uiround(g, trk);
    g.fill();
    var fill = { x: trk.x, y: trk.y, w: trk.w * sv, h: trk.h, radius: trk.radius };
    g.fillStyle = col.bg;
    uiround(g, fill);
    g.fill();
    var kx = r.x + r.w * sv;
    g.beginPath();
    g.arc(kx, r.cy, Math.max(5, r.h * 0.34), 0, 6.283);
    g.fillStyle = "#ffffff";
    g.fill();
    g.strokeStyle = col.bg;
    g.lineWidth = 2;
    g.stroke();
  } else if (node.type === "frame") {
    g.save();
    g.fillStyle = col.bg;
    uiround(g, r);
    g.fill();
    g.strokeStyle = col.border;
    g.lineWidth = 1.5;
    uiround(g, r);
    g.stroke();
    g.restore();
    if (uitext(node)) {
      g.font = uifont(node).replace(/^\d+px/, Math.round(uivalue(node, "fontsize", 18) * s) + "px");
      g.fillStyle = col.fg;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(uitext(node), r.cx, r.cy);
    }
  } else if (node.type === "image") {
    try {
      g.drawImage(artmake(node.sprite || "coin"), r.x, r.y, r.w, r.h);
    } catch (e) {}
  } else if (node.type === "joystick") {
    var rad = Math.min(r.w, r.h) / 2;
    g.beginPath();
    g.arc(r.cx, r.cy, rad, 0, 6.283);
    g.fillStyle = "rgba(16,22,30,.34)";
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.5)";
    g.lineWidth = 2;
    g.stroke();
    var jx = r.cx + (uistate.joyx || 0) * rad * 0.6;
    var jy = r.cy + (uistate.joyy || 0) * rad * 0.6;
    g.beginPath();
    g.arc(jx, jy, rad * 0.42, 0, 6.283);
    g.fillStyle = col.bg;
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.75)";
    g.stroke();
  }
}

function uishade(hex, amt) {
  var rgb = fxnum(hex);
  var out = rgb.map(function (c) {
    var v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return "rgb(" + out[0] + "," + out[1] + "," + out[2] + ")";
}

function uitree() {
  var list = [];
  walk(app.scene.objects || [], function (n) {
    if (n.type !== "label" && n.type !== "button" && n.type !== "slider" && n.type !== "bar" && n.type !== "joystick" && n.type !== "frame" && n.type !== "image") return;
    if (typeof guiphys === "function" && guiphys(n)) return;
    list.push(n);
  });
  return list;
}

function uidraw(g, w, h) {
  if (!g) return;
  var ref = uirefsize();
  var mode = ref.mode;
  var s = mode === "Constant pixel size" || mode === "Constant physical size" ? 1 : Math.min(w / ref.w, h / ref.h);
  uistate.scale = s;
  uistate.ref = ref;
  var c = uicanvasnode();
  if (c && c.compdata && c.compdata.ui && c.compdata.ui.color) {
    var cr = uirect(c, w, h, s, ref);
    g.globalAlpha = 0.01;
    g.fillStyle = c.compdata.ui.color;
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
  }
  uitree().forEach(function (n) {
    udrawitem(g, n, w, h, s, ref);
  });
}

function uihit(x, y) {
  var w = view.w;
  var h = view.h;
  var ref = uistate.ref || uirefsize();
  var s = uistate.scale || 1;
  var found = null;
  uitree().forEach(function (n) {
    if (n.type !== "button" && n.type !== "slider" && n.type !== "joystick") return;
    if (n.visible === false) return;
    var r = uirect(n, w, h, s, ref);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) found = { node: n, rect: r };
  });
  return found;
}

function uipress(x, y) {
  var hit = uihit(x, y);
  if (!hit) return;
  uistate.active = hit.node.id;
  if (hit.node.type === "slider") {
    uistate.drag = hit;
    uislide(hit, x);
  } else if (hit.node.type === "joystick") {
    uistate.drag = hit;
    uijoystick(hit, x, y);
  } else {
    uistate.press = 1;
  }
}

function uimove(x, y) {
  var hit = uihit(x, y);
  uistate.hover = hit ? hit.node.id : null;
  if (uistate.drag) {
    if (uistate.drag.node.type === "slider") uislide(uistate.drag, x);
    else uijoystick(uistate.drag, x, y);
  }
}

function uirelease(x, y) {
  var hit = uihit(x, y);
  var pressed = uistate.active;
  uistate.active = null;
  uistate.drag = null;
  uistate.joyx = 0;
  uistate.joyy = 0;
  if (game) {
    game.keys.KeyA = game.keys.ArrowLeft = false;
    game.keys.KeyD = game.keys.ArrowRight = false;
    game.keys.KeyW = game.keys.ArrowUp = false;
    game.keys.KeyS = game.keys.ArrowDown = false;
  }
  if (!hit || hit.node.id !== pressed) return;
  if (hit.node.type !== "button") return;
  uiclick(hit.node);
}

function uiclick(node) {
  var d = (node.compdata && node.compdata.ui) || {};
  uistate.press = 0;
  var fired = runevents("ui", node);
  if (d.action === "restart") {
    if (app.play) {
      stopplay();
      startplay();
    }
    return;
  }
  if (d.action === "scene" && d.scene) {
    var target = null;
    (app.project.scenes || []).forEach(function (s) {
      if (s.name === d.scene || s.id === d.scene) target = s;
    });
    if (target) {
      app.scene = target;
      app.selid = null;
      app.selids = [];
      app.project.startscene = target.id;
      if (app.play) {
        stopplay();
        startplay();
      }
    }
    return;
  }
  if (!fired && !app.play) toast("Button " + node.name, "ok");
}

function uislide(hit, x) {
  var v = Math.max(0, Math.min(1, (x - hit.rect.x) / Math.max(1, hit.rect.w)));
  hit.node.compdata = hit.node.compdata || {};
  hit.node.compdata.ui = hit.node.compdata.ui || {};
  hit.node.compdata.ui.value = Math.round(v * 1000) / 1000;
  if (game) {
    game.uivals = game.uivals || {};
    game.uivals[hit.node.name] = v;
  }
  uifirevar(hit.node, v);
}

function uijoystick(hit, x, y) {
  var r = hit.rect;
  var rad = Math.min(r.w, r.h) / 2;
  var dx = Math.max(-1, Math.min(1, (x - r.cx) / (rad * 0.7)));
  var dy = Math.max(-1, Math.min(1, (y - r.cy) / (rad * 0.7)));
  uistate.joyx = dx;
  uistate.joyy = dy;
  if (game) {
    game.joyx = dx;
    game.joyy = dy;
    game.keys.KeyA = game.keys.ArrowLeft = dx < -0.28;
    game.keys.KeyD = game.keys.ArrowRight = dx > 0.28;
    game.keys.KeyW = game.keys.ArrowUp = dy < -0.34;
    game.keys.KeyS = game.keys.ArrowDown = dy > 0.34;
  }
}

function uifirevar(node, v) {
  (node.vars || []).forEach(function (vr) {
    if (vr.name === "value") vr.value = v;
  });
}

function uibind() {
  if (uibind.done) return;
  uibind.done = true;
  var cv = view.overlay;
  if (!cv) return;
  cv.addEventListener("pointerdown", function (ev) {
    if (!app.play) return;
    var r = cv.getBoundingClientRect();
    uipress(ev.clientX - r.left, ev.clientY - r.top);
    if (uistate.active) cv.setPointerCapture(ev.pointerId);
  });
  cv.addEventListener("pointermove", function (ev) {
    if (!app.play) return;
    var r = cv.getBoundingClientRect();
    uimove(ev.clientX - r.left, ev.clientY - r.top);
  });
  cv.addEventListener("pointerup", function (ev) {
    if (!app.play) return;
    var r = cv.getBoundingClientRect();
    uirelease(ev.clientX - r.left, ev.clientY - r.top);
  });
}

function uimakelabel(node) {
  node.compdata = node.compdata || {};
  node.compdata.ui = node.compdata.ui || {};
  node.compdata.text = node.compdata.text || {};
  return node;
}

acts.adduinode = function (el) {
  var kind = el.getAttribute("data-kind") || "button";
  var node = basenode(kind, { name: kind.charAt(0).toUpperCase() + kind.slice(1), pos: [0, 0, 0] });
  var canvas = uicanvasnode();
  if (!canvas) {
    canvas = basenode("canvas", { name: "Canvas", pos: [0, 0, 0] });
    app.scene.objects.push(canvas);
  }
  node.compdata = node.compdata || {};
  node.compdata.ui = node.compdata.ui || {};
  node.compdata.ui.anchor = kind === "joystick" ? "Bottom left" : kind === "bar" ? "Top right" : kind === "slider" ? "Bottom center" : "Center";
  node.compdata.ui.x = kind === "joystick" ? 110 : 0;
  node.compdata.ui.y = kind === "bar" ? -30 : kind === "slider" ? -60 : 0;
  node.compdata.ui.w = kind === "joystick" ? 130 : kind === "bar" ? 220 : 200;
  node.compdata.ui.h = kind === "joystick" ? 130 : 48;
  node.compdata.ui.color = kind === "bar" ? "#37c46f" : kind === "slider" ? "#5b8def" : "#2f6fd0";
  node.compdata.ui.textcolor = "#ffffff";
  node.compdata.ui.value = kind === "bar" ? 0.7 : 0.5;
  if (kind === "button") node.text = "Play";
  if (kind === "label") node.text = "Label";
  if (kind === "bar") node.text = "";
  if (kind === "button") node.comps = ["ui"];
  else node.comps = ["ui"];
  canvas.children = canvas.children || [];
  canvas.children.push(node);
  app.selid = node.id;
  app.selids = [node.id];
  commit("addui");
  toast(node.name + " added to Canvas", "ok");
};

acts.uitest = function () {
  if (!app.play) {
    startplay();
    return;
  }
  if (game) {
    game.uivals = game.uivals || {};
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
  }
  toast("UI is live: click buttons, drag sliders", "ok");
};
