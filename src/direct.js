var snapset = { on: true, step: 0.25, rot: 15 };
var numdrag = null;
var numtip = null;

function snapready() {
  if (app.snapstep === undefined) app.snapstep = snapset.step;
  if (app.snaprot === undefined) app.snaprot = snapset.rot;
  if (app.snapon === undefined) app.snapon = snapset.on;
  snapset.step = app.snapstep;
  snapset.rot = app.snaprot;
  snapset.on = app.snapon;
}

function snapunit(ev) {
  snapready();
  if (!app.snapon) return 0.001;
  var step = app.snapstep;
  if (!step || step <= 0) step = 0.25;
  if (ev && ev.altKey) return step / 5;
  if (ev && ev.shiftKey) return step * 4;
  return step;
}

function snaprot(ev) {
  snapready();
  if (!app.snapon) return 1;
  var step = app.snaprot || 15;
  if (ev && ev.altKey) return 1;
  if (ev && ev.shiftKey) return step * 3;
  return step;
}

function numeval(text) {
  var raw = String(text).trim();
  if (!raw) return null;
  if (!/^[0-9+\-*/%(). ]+$/.test(raw)) return null;
  if (!/[0-9]/.test(raw)) return null;
  if (/[+\-*/%]\s*[+\-*/%]/.test(raw)) return null;
  if (/[+\-*/%]\s*$/.test(raw)) return null;
  try {
    var out = Function('"use strict";return (' + raw + ")")();
    if (typeof out !== "number") return null;
    if (!isFinite(out)) return null;
    return out;
  } catch (e) {
    return null;
  }
}

function numstep(el) {
  var step = parseFloat(el.getAttribute("data-step"));
  if (!step || !isFinite(step)) {
    step = parseFloat(el.getAttribute("step"));
  }
  if (!step || !isFinite(step)) step = 0.1;
  return step;
}

function numclamp(el, val) {
  var lo = parseFloat(el.getAttribute("data-min"));
  var hi = parseFloat(el.getAttribute("data-max"));
  if (isFinite(lo)) val = Math.max(lo, val);
  if (isFinite(hi)) val = Math.min(hi, val);
  return val;
}

function numround(val, step) {
  var grid = step < 0.01 ? 0.001 : 0.001;
  var out = Math.round(val / grid) * grid;
  return Math.abs(out) < 0.0005 ? 0 : out;
}

function numwrite(el, val, quiet) {
  var step = numstep(el);
  var out = numround(numclamp(el, val), step);
  el.value = String(out);
  if (!quiet) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    numtwin(el, out);
  }
  return out;
}

function numtwin(el, val) {
  var field = el.getAttribute("data-field");
  if (!field || !/^(pos|rot|scl)\.\d$/.test(field)) return;
  var pick = selectionnodes();
  if (pick.length < 2) return;
  var part = field.split(".");
  pick.forEach(function (n) {
    n[part[0]][+part[1]] = val;
    numsync(n);
  });
  if (typeof touch === "function") touch();
}

function numtipshow(x, y, text) {
  if (!numtip) {
    numtip = document.createElement("div");
    numtip.id = "numtip";
    document.body.appendChild(numtip);
  }
  numtip.textContent = text;
  numtip.style.left = x + 14 + "px";
  numtip.style.top = y - 26 + "px";
  numtip.classList.add("on");
}

function numtiphide() {
  if (numtip) numtip.classList.remove("on");
}

function numpress(ev) {
  var el = ev.target;
  if (!el || !el.hasAttribute || !el.hasAttribute("data-num")) return;
  if (ev.button !== 0) return;
  numdrag = { el: el, x: ev.clientX, y: ev.clientY, base: parseFloat(el.value) || 0, live: false, step: numstep(el) };
}

function nummove(ev) {
  if (!numdrag) return;
  var dx = ev.clientX - numdrag.x;
  if (!numdrag.live) {
    if (Math.abs(dx) < 4) return;
    numdrag.live = true;
    numdrag.el.blur();
    document.body.classList.add("numscrub");
    window.getSelection && window.getSelection().removeAllRanges();
  }
  ev.preventDefault();
  var el = numdrag.el;
  var step = numdrag.step;
  var mult = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
  var val = numdrag.base + dx * step * mult * 0.6;
  numwrite(el, val);
  numtipshow(ev.clientX, ev.clientY, String(numround(numclamp(el, val), step)));
}

function numup() {
  if (!numdrag) return;
  var was = numdrag.live;
  numdrag = null;
  document.body.classList.remove("numscrub");
  numtiphide();
  if (was && typeof commit === "function") commit("scrub");
}

function numkey(ev) {
  var el = ev.target;
  if (!el || !el.hasAttribute || !el.hasAttribute("data-num")) return;
  if (ev.key === "Enter") {
    ev.preventDefault();
    var val = numeval(el.value);
    if (val === null) val = parseFloat(el.value);
    if (!isFinite(val)) {
      toast("Type a number, for example 2.5 or 4*0.5", "warn");
      return;
    }
    numwrite(el, val);
    if (typeof commit === "function") commit("numeral");
    el.blur();
    return;
  }
  if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
    ev.preventDefault();
    var base = numeval(el.value);
    if (base === null) base = parseFloat(el.value) || 0;
    var step = numstep(el);
    var mult = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
    numwrite(el, base + (ev.key === "ArrowUp" ? step : -step) * mult);
    if (typeof touch === "function") touch();
    return;
  }
  if (ev.key === "Escape") {
    el.blur();
  }
}

function numreset(ev) {
  var el = ev.target;
  if (!el || !el.hasAttribute || !el.hasAttribute("data-num")) return;
  ev.preventDefault();
  var fallback = el.getAttribute("data-field") && /^scl\.\d$/.test(el.getAttribute("data-field")) ? 1 : 0;
  numwrite(el, fallback);
  if (typeof commit === "function") commit("numeral");
  toast("Value reset", "ok");
}

function numfinish(ev) {
  var el = ev.target;
  if (!el || !el.hasAttribute || !el.hasAttribute("data-num")) return;
  var val = numeval(el.value);
  if (val === null) return;
  numwrite(el, val, true);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  if (typeof touch === "function") touch();
}

function nuberase(ev) {
  var el = ev.target;
  if (!el || !el.hasAttribute || !el.hasAttribute("data-num")) return;
  if (ev.key !== "Backspace" && ev.key !== "Delete") return;
  if (!el.selectionStart && el.selectionStart !== 0) return;
}

function nudgepick() {
  var pick = selectionnodes();
  if (pick.length) return pick;
  var one = selected();
  return one ? [one] : [];
}

function nudgesel(ev) {
  if (!app || app.screen !== "editor" || app.play) return false;
  if (typeof closestmodal === "function" && closestmodal()) return false;
  var tag = (ev.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || ev.target.isContentEditable) return false;
  var key = ev.key;
  var axis = null;
  var dir = 0;
  if (key === "ArrowLeft") {
    axis = 0;
    dir = -1;
  } else if (key === "ArrowRight") {
    axis = 0;
    dir = 1;
  } else if (key === "ArrowUp") {
    axis = 1;
    dir = 1;
  } else if (key === "ArrowDown") {
    axis = 1;
    dir = -1;
  } else if (key === "PageUp") {
    axis = 2;
    dir = 1;
  } else if (key === "PageDown") {
    axis = 2;
    dir = -1;
  }
  if (axis === null) return false;
  var pick = nudgepick();
  if (!pick.length) return false;
  if (ev.ctrlKey || ev.metaKey) return false;
  ev.preventDefault();
  var step = snapunit(ev);
  pick.forEach(function (n) {
    n.pos[axis] = Math.round((n.pos[axis] + dir * step) * 1000) / 1000;
  });
  if (typeof touch === "function") touch();
  pick.forEach(numsync);
  toast(["X", "Y", "Z"][axis] + " " + pick[0].pos[axis].toFixed(2), "ok");
  return true;
}

function numsync(node) {
  if (!node) return;
  var fields = { pos: node.pos, rot: node.rot, scl: node.scl };
  Object.keys(fields).forEach(function (key) {
    for (var i = 0; i < 3; i++) {
      var el = qs('input[data-num][data-node="' + node.id + '"][data-field="' + key + "." + i + '"]');
      if (el && document.activeElement !== el) el.value = String(Math.round(fields[key][i] * 1000) / 1000);
    }
  });
}

function selpaint() {
  var ids = app.selids || [];
  qsa("#objlist .objrow").forEach(function (r) {
    var id = r.getAttribute("data-id");
    var on = ids.length ? ids.indexOf(id) >= 0 : app.selid === id;
    if (on) r.classList.add("on");
    else r.classList.remove("on");
  });
  var foot = qs(".objfoot .selcount");
  if (foot) {
    var n = selectionnodes().length;
    foot.textContent = n ? n + (n === 1 ? " actor selected" : " actors selected") : "Nothing selected";
  }
}

function renpick(id) {
  var node = findnode(app.scene.objects, id);
  var row = qs('#objlist .objrow[data-id="' + id + '"]');
  var span = row ? row.querySelector(".name") : null;
  if (!node || !span) return;
  if (row.querySelector(".renin")) return;
  var inp = document.createElement("input");
  inp.className = "inp renin";
  inp.value = node.name;
  span.replaceWith(inp);
  inp.focus();
  inp.select();
  var done = function (save) {
    if (!inp.parentElement) return;
    var next = inp.value.trim();
    if (save && next && next !== node.name) {
      node.name = next;
      commit("rename");
    } else {
      renderdock();
    }
  };
  inp.addEventListener("blur", function () {
    done(true);
  });
  inp.addEventListener("keydown", function (ev) {
    ev.stopPropagation();
    if (ev.key === "Enter") {
      ev.preventDefault();
      inp.blur();
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      done(false);
    }
  });
}

function renrow(ev) {
  var name = ev.target.closest ? ev.target.closest("#objlist .objrow .name") : null;
  if (!name) return;
  var row = name.closest(".objrow");
  if (!row) return;
  ev.preventDefault();
  renpick(row.getAttribute("data-id"));
}

function objclear(ev) {
  var list = ev.target.closest ? ev.target.closest("#objlist") : null;
  if (!list) return;
  if (ev.target !== list) return;
  app.selid = null;
  app.selids = [];
  refreshall();
}

function contextpick(ev) {
  if (!app || app.screen !== "editor" || app.play) return;
  if (ev.target.closest && ev.target.closest("button, input, select, textarea, .viewtools, .viewgizmo, .perspbtn, .campreview, .playui, .playbar")) return;
  var hit = null;
  if (typeof pickat === "function" && view.main && view.main.meshes) {
    var r = view.stage.getBoundingClientRect();
    var p = [ev.clientX - r.left, ev.clientY - r.top];
    hit = pickat(p[0], p[1]);
  }
  if (hit && hit.id) {
    if (!hit.node && typeof findnode === "function") hit.node = findnode(app.scene.objects, hit.id);
    if (hit.node && hit.node.type === "folder") hit.node = null;
    if (hit.node && !hit.node.lock) {
      if ((app.selids || []).indexOf(hit.node.id) < 0) {
        app.selid = hit.node.id;
        app.selids = [hit.node.id];
      }
      if (typeof selpaint === "function") selpaint();
      if (typeof renderright === "function") renderright();
    }
  }
  openstage(ev.clientX, ev.clientY);
}

function openstage(cx, cy) {
  var pick = selectionnodes();
  var items = [{ head: pick.length ? pick.length + (pick.length === 1 ? " actor selected" : " actors selected") : "Scene" }];
  if (pick.length) {
    items.push({ label: "Duplicate", icon: "duplicate", act: "objduplicate", key: "Ctrl+D" });
    items.push({ label: "Copy", icon: "copy", act: "objcopy" });
    items.push({ label: "Group into a folder", icon: "group", act: "objgroup", key: "Ctrl+G" });
    items.push({ label: pickshow(pick), icon: "eye", act: "objvisibility" });
    items.push({ label: "Focus", icon: "target", act: "objfocus", key: "F" });
    items.push({ sep: true });
  }
  items.push({ label: "Add actor…", icon: "plus", act: "addobject" });
  if (app.clipboard) items.push({ label: "Paste", icon: "file", act: "objpaste" });
  items.push({ label: "Snap and rotation step", icon: "magnet", act: "snapmenu" });
  items.push({ label: "Reset camera", icon: "camera", act: "resetcamera" });
  items.push({ sep: true });
  if (pick.length) items.push({ label: "Delete", icon: "trash", act: "objdelete", key: "Del" });
  items.push({ label: "Play in viewport", icon: "play", act: "play" });
  openmenu(items, cx, cy);
}

function pickshow(pick) {
  var hidden = 0;
  pick.forEach(function (n) {
    if (n.visible === false) hidden++;
  });
  return hidden === pick.length ? "Show" : "Hide";
}

function objctx(ev) {
  var row = ev.target.closest ? ev.target.closest("#objlist .objrow") : null;
  if (row) {
    ev.preventDefault();
    var id = row.getAttribute("data-id");
    if ((app.selids || []).indexOf(id) < 0) {
      app.selid = id;
      app.selids = [id];
      refreshpickers();
      renderdock();
    }
    openobjectmenu(id, ev.clientX, ev.clientY);
    return;
  }
  var list = ev.target.closest ? ev.target.closest("#objlist") : null;
  if (!list) return;
  ev.preventDefault();
  openmenu([
    { head: "Outliner" },
    { label: "Add actor…", icon: "plus", act: "addobject" },
    { label: "Paste", icon: "file", act: "objpaste" },
    { label: "Group selection into a folder", icon: "group", act: "objgroup" },
    { sep: true },
    { label: "Expand all", icon: "chevrd", act: "objopenall" },
    { label: "Collapse all", icon: "chevru", act: "objcloseall" }
  ], ev.clientX, ev.clientY, {
    onact: function (name) {
      if (typeof acts[name] === "function") acts[name]();
    }
  });
}

acts.objselectall = function () {
  app.selids = [];
  walk(app.scene.objects, function (n) {
    app.selids.push(n.id);
  });
  if (app.selids.length) app.selid = app.selids[0];
  selpaint();
  renderright();
  toast(app.selids.length + " actors selected", "ok");
};

acts.snapmenu = function (el) {
  snapready();
  var steps = [0.05, 0.1, 0.25, 0.5, 1, 2];
  var rots = [1, 5, 15, 45, 90];
  var box = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 80, bottom: 200 };
  var items = [
    { head: "Snap and grid step" },
    { label: app.snapon ? "Snapping is on" : "Snapping is off", icon: "magnet", act: "snaptoggle" },
    { sep: true },
    { head: "Move step" }
  ];
  steps.forEach(function (v) {
    items.push({ label: v + " m", icon: app.snapstep === v ? "check" : "empty", act: "snapstep:" + v });
  });
  items.push({ sep: true }, { head: "Rotate step" });
  rots.forEach(function (v) {
    items.push({ label: v + "°", icon: app.snaprot === v ? "check" : "empty", act: "snaprot:" + v });
  });
  items.push({ sep: true }, { head: "Hold Alt while dragging for a fine step, Shift for a wide step" });
  openmenu(items, box.left + 46, box.bottom + 6);
};

acts.snapstep = function (arg) {
  snapready();
  var val = parseFloat(arg);
  if (!isFinite(val) || val <= 0) return;
  app.snapstep = val;
  snapset.step = val;
  toast("Move step " + val + " m", "ok");
};

acts.snaprot = function (arg) {
  snapready();
  var val = parseFloat(arg);
  if (!isFinite(val) || val <= 0) return;
  app.snaprot = val;
  snapset.rot = val;
  toast("Rotate step " + val + "°", "ok");
};

acts.snaptoggle = function () {
  snapready();
  app.snapon = !app.snapon;
  snapset.on = app.snapon;
  toast(app.snapon ? "Snapping on" : "Snapping off", app.snapon ? "ok" : "warn");
};

function dirkey(ev) {
  if (!app || app.screen !== "editor" || app.play) return;
  if (typeof closestmodal === "function" && closestmodal()) return;
  var tag = (ev.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || ev.target.isContentEditable) return;
  if (ev.key === "F2") {
    var one = selected();
    if (one) {
      ev.preventDefault();
      renpick(one.id);
    }
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "g") {
    ev.preventDefault();
    acts.objgroup();
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "a") {
    ev.preventDefault();
    app.selids = [];
    walk(app.scene.objects, function (n) {
      app.selids.push(n.id);
    });
    renderdock();
    refreshpickers();
    return;
  }
  nudgesel(ev);
}

if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", numpress, true);
  document.addEventListener("pointermove", nummove, true);
  document.addEventListener("pointerup", numup, true);
  document.addEventListener("pointercancel", numup, true);
  document.addEventListener("keydown", numkey, true);
  document.addEventListener("dblclick", numreset, true);
  document.addEventListener("blur", numfinish, true);
  document.addEventListener("dblclick", renrow);
  document.addEventListener("pointerdown", objclear);
  document.addEventListener("contextmenu", objctx);
  document.addEventListener("keydown", dirkey);
  window.addEventListener("load", function () {
    snapready();
  });
}
