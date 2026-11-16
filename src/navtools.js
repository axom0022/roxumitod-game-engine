var navkeys = {};
var navfly = false;
var navspeed = 8;
var navhover = false;
var navpilot = null;

function navclamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function navsphere() {
  var c = app.cam;
  var cp = Math.cos(c.pitch);
  return [Math.sin(c.yaw) * cp, Math.sin(c.pitch), Math.cos(c.yaw) * cp];
}

function navlook(dx, dy) {
  var c = app.cam;
  var st = camerastate();
  var eye = st.eye.slice();
  c.yaw -= dx * 0.0042;
  c.pitch = navclamp(c.pitch + dy * 0.0042, -1.5, 1.5);
  var d = navsphere();
  c.target = [eye[0] - d[0] * c.dist, eye[1] - d[1] * c.dist, eye[2] - d[2] * c.dist];
  c.mode = "persp";
  c.ortho = false;
  refreshpersp();
}

function refreshpersp() {
  var pb = qs("#perspbtn");
  if (!pb) return;
  var m = app.cam.mode || "persp";
  pb.textContent = m === "persp" ? "Persp" : m.charAt(0).toUpperCase() + m.slice(1);
  var ob = qs("#orthobtn");
  if (ob) ob.classList.toggle("on", !!app.cam.ortho);
}

function navpan(dx, dy) {
  var c = app.cam;
  var st = camerastate();
  var d = navsphere();
  var right = [d[2], 0, -d[0]];
  var rl = Math.hypot(right[0], right[2]) || 1;
  right = [right[0] / rl, 0, right[2] / rl];
  var up = [0, 1, 0];
  var s = c.dist * 0.0022;
  c.target = [
    c.target[0] - right[0] * dx * s + up[0] * dy * s,
    c.target[1] - right[1] * dx * s + up[1] * dy * s,
    c.target[2] - right[2] * dx * s + up[2] * dy * s
  ];
}

function navmove(dt) {
  var c = app.cam;
  if (navpilot) {
    navpilottick(dt);
    return;
  }
  var f = 0;
  var s = 0;
  var u = 0;
  if (navkeys["w"]) f += 1;
  if (navkeys["s"]) f -= 1;
  if (navkeys["d"]) s += 1;
  if (navkeys["a"]) s -= 1;
  if (navkeys["e"]) u += 1;
  if (navkeys["q"]) u -= 1;
  if (!f && !s && !u && !navkeys["arrowup"] && !navkeys["arrowdown"]) return;
  var d = navsphere();
  var right = [d[2], 0, -d[0]];
  var rl = Math.hypot(right[0], right[2]) || 1;
  right = [right[0] / rl, 0, right[2] / rl];
  var sp = navspeed * dt * (navkeys["shift"] ? 4 : 1);
  if (navkeys["arrowup"]) f += 1;
  if (navkeys["arrowdown"]) f -= 1;
  var mv = [
    -d[0] * f * sp + right[0] * s * sp,
    -d[1] * f * sp + u * sp,
    -d[2] * f * sp + right[2] * s * sp
  ];
  c.target = [c.target[0] + mv[0], c.target[1] + mv[1], c.target[2] + mv[2]];
  c.mode = "persp";
  c.ortho = false;
  refreshpersp();
}

function navpilotstart() {
  var n = selected();
  if (!n) {
    toast("Select an actor to pilot");
    return;
  }
  navpilot = n;
  app.piloting = n.id;
  var w = worldpos(n);
  app.cam.target = [w[0], w[1] + 0.6, w[2]];
  app.cam.dist = 3.2;
  toast("Piloting " + n.name + " · WASD to move · Shift+P or Esc to eject");
}

function navpilotstop() {
  if (!navpilot) return;
  navpilot = null;
  app.piloting = null;
  toast("Ejected from actor");
}

function navpilotdir() {
  var c = app.cam;
  var y = c.yaw + Math.PI;
  return [Math.sin(y), 0, Math.cos(y)];
}

function navpilotcam() {
  if (!navpilot || !navpilot.mesh) return;
  var c = app.cam;
  var w = worldpos(navpilot);
  navpilot.mesh.rotation.y = c.yaw + Math.PI;
  navpilot.rot[1] = (c.yaw + Math.PI) * 180 / Math.PI;
  c.target = [w[0], w[1] + 0.6, w[2]];
}

function navpilotmove(dt) {
  if (!navpilot) return;
  var dir = navpilotdir();
  var sp = navspeed * 0.6 * dt * (navkeys["shift"] ? 3 : 1);
  var f = 0;
  var s = 0;
  if (navkeys["w"]) f += 1;
  if (navkeys["s"]) f -= 1;
  if (navkeys["d"]) s += 1;
  if (navkeys["a"]) s -= 1;
  if (!f && !s) return;
  var right = [-dir[2], 0, dir[0]];
  navpilot.pos[0] += dir[0] * f * sp + right[0] * s * sp;
  navpilot.pos[2] += dir[2] * f * sp + right[2] * s * sp;
  if (navkeys["space"]) navpilot.pos[1] += sp;
  if (navkeys["control"]) navpilot.pos[1] -= sp;
  app.dirty = true;
}

function navpilotstep(dt) {
  navpilotstepping = true;
  navpilotmove(dt);
  navpilotcam();
  navpilotstepping = false;
}

function navtick(dt) {
  if (app.play) return;
  if (navpilot) {
    navpilotstep(dt);
    return;
  }
  if (navfly) navmove(dt);
}

function navmode(m) {
  app.cam.mode = m;
  if (m === "persp") app.cam.ortho = false;
  else app.cam.ortho = true;
  refreshpersp();
  toast(m === "persp" ? "Perspective view" : m.charAt(0).toUpperCase() + m.slice(1) + " view");
}

function navortho() {
  app.cam.ortho = !app.cam.ortho;
  refreshpersp();
  toast(app.cam.ortho ? "Orthographic projection" : "Perspective projection");
}

function navgameview(on) {
  app.gameview = on;
  var st = qs("#stagewrap");
  if (st) st.classList.toggle("gameview", !!on);
  toast(on ? "Game view · editor overlays hidden" : "Editor view");
  refreshall();
}

function navorbit(on) {
  app.navorbit = on;
  toast("Orbit pivot " + (on ? "locked to selection" : "free"));
}

function navbookmark(i, save) {
  app.bookmarks = app.bookmarks || {};
  if (save) {
    app.bookmarks[i] = { yaw: app.cam.yaw, pitch: app.cam.pitch, dist: app.cam.dist, target: app.cam.target.slice(), mode: app.cam.mode, ortho: app.cam.ortho };
    toast("Bookmark " + i + " saved");
  } else {
    var b = app.bookmarks[i];
    if (!b) {
      toast("No bookmark " + i);
      return;
    }
    app.cam.yaw = b.yaw;
    app.cam.pitch = b.pitch;
    app.cam.dist = b.dist;
    app.cam.target = b.target.slice();
    app.cam.mode = b.mode;
    app.cam.ortho = b.ortho;
    refreshpersp();
    toast("Bookmark " + i);
  }
}

function navdrop() {
  var list = selectionnodes();
  if (!list.length) return;
  list.forEach(function (n) {
    if (n.lock) return;
    var h = nodesize(n)[1];
    n.pos[1] = h / 2;
  });
  commit("drop to floor");
  toast("Snapped " + list.length + " to floor", "ok");
}

function navhide(which) {
  var list = which === "all" ? [] : selectionnodes();
  if (which === "all") {
    walknodes(app.scene.objects, function (n) {
      n.visible = true;
    });
    commit("show all");
    toast("All actors visible", "ok");
    return;
  }
  list.forEach(function (n) {
    n.visible = false;
  });
  commit("hide");
  toast("Hid " + list.length, "ok");
}

function navimmersive() {
  var st = qs("#stagewrap") || qs("canvas");
  if (!st) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else if (st.requestFullscreen) st.requestFullscreen();
}

function navviewmenu(x, y) {
  var items = [
    { head: "View modes" },
    { label: "Perspective", icon: "cubeoutline", act: "viewpersp", key: "Alt+G" },
    { label: "Top", icon: "camera2d", act: "navmode:top", key: "Alt+J" },
    { label: "Front", icon: "camera2d", act: "navmode:front", key: "Alt+H" },
    { label: "Side", icon: "camera2d", act: "navmode:side", key: "Alt+K" },
    { label: app.cam.ortho ? "Orthographic - on" : "Orthographic - off", icon: "camera2d", act: "toggleortho" },
    { sep: true },
    { head: "Display" },
    { label: app.gameview ? "Game view - on" : "Game view - off", icon: "eye", act: "navgameview", key: "Shift+G" },
    { label: app.showgrid ? "Grid - on" : "Grid - off", icon: "grid", act: "togglegrid", key: "G" },
    { label: "Immersive (fullscreen)", icon: "cubeoutline", act: "navimmersive", key: "F11" },
    { sep: true },
    { head: "Camera" },
    { label: "Pilot selected actor", icon: "target", act: "navpilot", key: "Shift+P" },
    { label: "Reset camera", icon: "refresh", act: "camreset" }
  ];
  openmenu(items, x, y, {
    onact: function (name) {
      if (name.indexOf("navmode:") === 0) navmode(name.split(":")[1]);
      else if (name === "toggleortho") navortho();
      else if (name === "navgameview") navgameview(!app.gameview);
      else if (name === "togglegrid") {
        app.showgrid = !app.showgrid;
        toast("Grid " + (app.showgrid ? "on" : "off"));
      } else if (name === "navimmersive") navimmersive();
      else if (name === "navpilot") navpilot ? navpilotstop() : navpilotstart();
      else if (name === "camreset") camreset();
      else if (typeof acts[name] === "function") acts[name]();
    }
  });
}

function camreset() {
  app.cam.yaw = 0.68;
  app.cam.pitch = 0.42;
  app.cam.dist = 15;
  app.cam.target = [0, 2, 0];
  app.cam.mode = "persp";
  app.cam.ortho = false;
  refreshpersp();
  toast("Camera reset");
}

function navkey(ev) {
  var k = ev.key;
  var low = k.toLowerCase();
  if (ev.type === "keyup") {
    navkeys[low] = false;
    if (low === "shift") navkeys["shift"] = false;
    if (low === "control") navkeys["control"] = false;
    return false;
  }
  navkeys[low] = true;
  if (low === "shift") navkeys["shift"] = true;
  if (low === "control") navkeys["control"] = true;
  if (ev.repeat && low !== "w" && low !== "a" && low !== "s" && low !== "d") return false;
  if (ev.altKey) {
    if (low === "g") {
      navmode("persp");
      return true;
    }
    if (low === "h") {
      navmode("front");
      return true;
    }
    if (low === "j") {
      navmode("top");
      return true;
    }
    if (low === "k") {
      navmode("side");
      return true;
    }
  }
  if (ev.shiftKey && low === "p") {
    navpilot ? navpilotstop() : navpilotstart();
    return true;
  }
  if (ev.shiftKey && low === "g") {
    navgameview(!app.gameview);
    return true;
  }
  if (k === "F11") {
    ev.preventDefault();
    navimmersive();
    return true;
  }
  if (k === "End") {
    navdrop();
    return true;
  }
  if ((ev.ctrlKey || ev.metaKey) && low === "h") {
    ev.preventDefault();
    if (ev.shiftKey) navhide("all");
    else navhide("sel");
    return true;
  }
  if (/^[1-9]$/.test(k)) {
    navbookmark(k, ev.ctrlKey || ev.metaKey);
    if (ev.ctrlKey || ev.metaKey) ev.preventDefault();
    return true;
  }
  if ((navfly || navpilot) && ["w", "a", "s", "d", "q", "e", "arrowup", "arrowdown", "arrowleft", "arrowright", "space", "control"].indexOf(low) >= 0) {
    if (low === "space" || low.indexOf("arrow") === 0) ev.preventDefault();
    return true;
  }
  if (k === "Escape" && navpilot) {
    navpilotstop();
    return true;
  }
  return false;
}

function navbind() {
  var stage = qs("#stagewrap");
  if (!stage || stage.dataset.navbound) return;
  stage.dataset.navbound = "1";
  stage.addEventListener("pointerdown", function (ev) {
    if (app.play) return;
    if (ev.target && ev.target.closest && ev.target.closest("button, input, select, .viewtools, .viewgizmo, .perspbtn, .campreview, .playui, .playbar")) return;
    if (ev.button === 2) {
      ev.preventDefault();
      ev.stopPropagation();
      navfly = true;
      window.dragstate = { mode: "look", sx: ev.clientX, sy: ev.clientY, cx: ev.clientX, cy: ev.clientY, moved: false };
      stage.setPointerCapture && stage.setPointerCapture(ev.pointerId);
      return;
    }
    if (ev.button === 1) {
      ev.preventDefault();
      ev.stopPropagation();
      window.dragstate = { mode: "navpan", sx: ev.clientX, sy: ev.clientY };
      stage.setPointerCapture && stage.setPointerCapture(ev.pointerId);
    }
  }, true);
  stage.addEventListener("pointermove", function (ev) {
    var ds = window.dragstate;
    if (!ds) return;
    if (ds.mode === "look") {
      var dx = ev.clientX - ds.sx;
      var dy = ev.clientY - ds.sy;
      ds.sx = ev.clientX;
      ds.sy = ev.clientY;
      if (!ds.moved && (Math.abs(ev.clientX - ds.cx) > 5 || Math.abs(ev.clientY - ds.cy) > 5)) ds.moved = true;
      navlook(dx, dy);
      ev.stopPropagation();
    } else if (ds.mode === "navpan") {
      var px = ev.clientX - ds.sx;
      var py = ev.clientY - ds.sy;
      ds.sx = ev.clientX;
      ds.sy = ev.clientY;
      navpan(px, py);
      ev.stopPropagation();
    }
  }, true);
  stage.addEventListener("pointerup", function (ev) {
    var ds = window.dragstate;
    navfly = false;
    if (ds && ds.mode === "look" && !ds.moved && ev.button === 2) {
      window.dragstate = null;
      contextpick(ev);
      return;
    }
    window.dragstate = null;
  }, true);
  stage.addEventListener("pointerleave", function () {
    navfly = false;
  });
  stage.addEventListener("wheel", function (ev) {
    if (ev.ctrlKey || ev.metaKey) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      navspeed = navclamp(navspeed * (ev.deltaY > 0 ? 0.85 : 1.18), 0.5, 80);
      toast("Camera speed " + navspeed.toFixed(1) + " m/s");
    }
  }, { capture: true, passive: false });
  stage.addEventListener("contextmenu", function (ev) {
    ev.preventDefault();
  });
  var pb = qs("#perspbtn");
  if (pb) {
    pb.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      var r = pb.getBoundingClientRect();
      navviewmenu(r.left, r.bottom + 4);
    }, true);
  }
}

window.addEventListener("blur", function () {
  navkeys = {};
  navfly = false;
});

if (typeof window !== "undefined") {
  window.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (app.play) return;
    if (ev.key === "Shift" || ev.key === "Control" || ev.key === "Alt") {
      navkeys[ev.key.toLowerCase()] = true;
      return;
    }
    if (navkey(ev)) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }, true);
  window.addEventListener("keyup", function (ev) {
    navkeys[ev.key.toLowerCase()] = false;
  }, true);
}
