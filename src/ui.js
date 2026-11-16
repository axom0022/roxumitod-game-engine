function qs(sel) {
  return document.querySelector(sel);
}

function qsa(sel) {
  return Array.prototype.slice.call(document.querySelectorAll(sel));
}

function esc(s) {
  return String(s === undefined || s === null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toast(msg, kind) {
  var wrap = qs("#toasts");
  if (!wrap) return;
  var d = document.createElement("div");
  d.className = "toast " + (kind || "");
  d.textContent = msg;
  wrap.appendChild(d);
  setTimeout(function () {
    d.style.opacity = "0";
    d.style.transition = "opacity .25s";
    setTimeout(function () {
      d.remove();
    }, 260);
  }, 2600);
}

var openmenuel = null;

function closemenu() {
  var m = qs("#menu");
  if (m) {
    m.classList.add("hide");
    m.innerHTML = "";
  }
  openmenuel = null;
}

function openmenu(items, x, y, opts) {
  var m = qs("#menu");
  if (!m) return;
  opts = opts || {};
  var html = "";
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (it.sep) {
      html += '<div class="menusep"></div>';
      continue;
    }
    if (it.head) {
      html += '<div class="menulabel">' + esc(it.head) + "</div>";
      continue;
    }
    html += '<button class="menuitem' + (it.disabled ? " disabled" : "") + '" data-menuact="' + esc(it.act || "") + '">' + (it.icon ? ic(it.icon) : "") + "<span>" + esc(it.label) + "</span>" + (it.key ? '<span class="key">' + esc(it.key) + "</span>" : "") + "</button>";
  }
  m.innerHTML = html;
  m.classList.remove("hide");
  var rect = m.getBoundingClientRect();
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var left = Math.min(x, vw - rect.width - 8);
  var top = Math.min(y, vh - rect.height - 8);
  m.style.left = Math.max(6, left) + "px";
  m.style.top = Math.max(6, top) + "px";
  openmenuel = opts;
  var act = function (ev) {
    var btn = ev.target.closest("[data-menuact]");
    if (!btn || !m.contains(btn)) return;
    var name = btn.getAttribute("data-menuact");
    closemenu();
    var handler = (opts && opts.onact) || acts[name];
    if (!handler && name.indexOf(":") > 0) {
      var base = name.split(":")[0];
      if (typeof acts[base] === "function") acts[base](name.slice(base.length + 1));
    } else if (handler) handler(name);
  };
  m.onclick = act;
  setTimeout(function () {
    document.addEventListener("pointerdown", function closer(ev) {
      if (!m.contains(ev.target)) {
        closemenu();
        document.removeEventListener("pointerdown", closer);
      }
    });
  }, 0);
}

function modalroot() {
  var r = qs("#modalroot");
  return r;
}

function openmodal(spec) {
  var root = modalroot();
  var scrim = document.createElement("div");
  scrim.className = "scrim";
  var width = spec.width === "wide" ? " wide" : spec.width === "narrow" ? " narrow" : "";
  scrim.innerHTML = '<div class="modal' + width + '"><div class="modalhead">' + (spec.icon ? ic(spec.icon) : "") + '<span class="t">' + esc(spec.title) + '</span><button class="iconbtn x" data-mact="close">' + ic("x") + "</button></div>" + (spec.body !== undefined ? '<div class="modalbody' + (spec.flush ? " flush" : "") + '">' + spec.body + "</div>" : "") + (spec.footer ? '<div class="modalfoot">' + spec.footer + "</div>" : "") + "</div>";
  root.appendChild(scrim);
  var modal = scrim.querySelector(".modal");
  if (spec.onmount) spec.onmount(modal, scrim);
  scrim.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t === scrim) {
      if (spec.sticky) return;
      closemodal(scrim);
      return;
    }
    var btn = t.closest("[data-mact]");
    if (!btn) return;
    var name = btn.getAttribute("data-mact");
    if (name === "close") {
      closemodal(scrim);
      return;
    }
    if (spec.actions && spec.actions[name]) spec.actions[name](modal, scrim, btn);
  });
  var first = modal.querySelector("[data-autofocus]");
  if (first) setTimeout(function () {
    first.focus();
    if (first.select) first.select();
  }, 30);
  return { modal: modal, scrim: scrim, close: function () { closemodal(scrim); } };
}

function closemodal(which) {
  var root = modalroot();
  if (!root) return;
  if (which) which.remove();
  else root.innerHTML = "";
}

function closestmodal() {
  return qsa("#modalroot .scrim").pop() || null;
}

function promptbox(title, value, onok, opts) {
  opts = opts || {};
  var ref = openmodal({
    title: title,
    icon: opts.icon || "pen",
    width: "narrow",
    body: '<input class="inp" data-autofocus data-promptvalue value="' + esc(value || "") + '" placeholder="' + esc(opts.placeholder || "") + '">' + (opts.hint ? '<div class="tiny dim" style="margin-top:8px">' + esc(opts.hint) + "</div>" : ""),
    footer: '<button class="btn" data-mact="cancel">Cancel</button><button class="btn primary" data-mact="ok">' + esc(opts.ok || "OK") + "</button>",
    actions: {
      cancel: function (m, s) {
        closemodal(s);
      },
      ok: function (m, s) {
        var input = m.querySelector("[data-promptvalue]");
        var v = input.value.trim();
        if (!v) return;
        closemodal(s);
        onok(v);
      }
    }
  });
  setTimeout(function () {
    var inp = ref.modal.querySelector("[data-promptvalue]");
    if (inp) {
      inp.focus();
      inp.select();
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          var v = inp.value.trim();
          if (!v) return;
          closemodal(ref.scrim);
          onok(v);
        }
      });
    }
  }, 20);
}

function confirmbox(title, text, onok) {
  openmodal({
    title: title,
    icon: "warning",
    width: "narrow",
    body: '<div style="font-size:12px;color:var(--text-2);line-height:1.55">' + esc(text) + "</div>",
    footer: '<button class="btn" data-mact="cancel">Cancel</button><button class="btn primary" data-mact="ok">Confirm</button>',
    actions: {
      cancel: function (m, s) {
        closemodal(s);
      },
      ok: function (m, s) {
        closemodal(s);
        onok();
      }
    }
  });
}

function srow(label, ctrl, extra) {
  return '<div class="frow ' + (extra || "") + '"><div class="flabel">' + label + '</div><div class="fctrl">' + ctrl + "</div></div>";
}

function srownum(label, value, field, id, step) {
  return srow(label, '<input class="inp num" type="number" step="' + (step || 0.1) + '" value="' + esc(value) + '" data-node="' + esc(id) + '" data-field="' + field + '">');
}

function vectorrow(label, node, kind, axis) {
  var arr = node[kind] || [0, 0, 0];
  var html = '<div class="frow"><div class="flabel">' + label + '</div><div class="vecrow">';
  for (var i = 0; i < 3; i++) {
    html += '<div class="vec"><span class="axis ' + axis[i] + '">' + axis[i].toUpperCase() + '</span><input class="inp num" type="number" step="0.1" value="' + (+arr[i]).toFixed(2).replace(/\.00$/, "") + '" data-node="' + esc(node.id) + '" data-field="' + kind + "." + i + '"></div>';
  }
  html += "</div></div>";
  return html;
}

function check(label, checked, attrs) {
  return '<label class="check"><input type="checkbox" ' + (checked ? "checked" : "") + " " + (attrs || "") + '><span class="box">' + ic("check", "ico-xs") + "</span>" + esc(label) + "</label>";
}

function colorrow(label, color, attrs) {
  return '<div class="frow"><div class="flabel">' + label + '</div><div class="fctrl"><div class="colorbox"><input type="color" value="' + esc(color) + '" ' + attrs + '></div><input class="inp" value="' + esc(color) + '" ' + attrs + "></div></div>";
}

function sliderrow(label, value, min, max, step, attrs, numin) {
  return '<div class="frow"><div class="flabel">' + label + '</div><div class="fctrl"><input class="slider" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '" ' + attrs + ">" + (numin === false ? "" : '<input class="inp num numin" type="number" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '" ' + attrs + ">") + "</div></div>";
}

function selectrow(label, options, value, attrs) {
  var html = '<select class="inp" ' + attrs + ">";
  for (var i = 0; i < options.length; i++) {
    var o = options[i];
    var v = typeof o === "string" ? o : o.value;
    var t = typeof o === "string" ? o : o.label;
    html += '<option value="' + esc(v) + '"' + (String(v) === String(value) ? " selected" : "") + ">" + esc(t) + "</option>";
  }
  html += "</select>";
  return srow(label, html);
}

function sechead(icon, title, id, tools) {
  if (app.closedsecs && app.closedsecs[id]) {
    return '<div class="sechead secgone" data-act="opensec" data-sec="' + esc(id) + '" title="Click to restore this section"><span class="tw">' + ic("plus", "ico-xs") + "</span>" + (icon ? ic(icon, "ico-sm") : "") + '<span class="dim">' + esc(title) + '</span><span class="tools"><span class="pill">closed</span></span></div>';
  }
  var open = !app.collapsed || !app.collapsed[id];
  return '<div class="sechead' + (open ? "" : " closed") + '" data-act="togglesec" data-sec="' + esc(id) + '"><span class="tw">' + ic(open ? "chevd" : "chevr", "ico-xs") + "</span>" + (icon ? ic(icon, "ico-sm") : "") + "<span>" + esc(title) + "</span>" + '<span class="tools">' + (tools || "") + '<button class="iconbtn secx" data-act="closesec" data-sec="' + esc(id) + '" title="Close this section">' + ic("x", "ico-xs") + "</button></span></div>";
}

function secx(id) {
  return '<button class="iconbtn secx" data-act="closesec" data-sec="' + esc(id) + '" title="Close this section">' + ic("x", "ico-xs") + "</button>";
}

function sechead2(icon, title, id, right) {
  if (app.closedsecs && app.closedsecs[id]) {
    return '<div class="sectionhead secgone" data-act="opensec" data-sec="' + esc(id) + '">' + (icon ? ic(icon, "ico-sm") : "") + '<span class="dim">' + esc(title) + '</span><span class="pill" style="margin-left:6px">closed</span></div>';
  }
  return '<div class="sectionhead">' + (icon ? ic(icon, "ico-sm") : "") + esc(title) + '<span style="margin-left:auto;display:flex;gap:4px;align-items:center">' + (right || "") + secx(id) + "</span></div>";
}

function plural(n, word) {
  return n + " " + word + (n === 1 ? "" : "s");
}

function fmtkb(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  return (bytes / 1024).toFixed(1) + " KB";
}

function databytes(url) {
  var b = url.length - (url.indexOf(",") + 1);
  return Math.round(b * 0.75);
}

function todaystr() {
  var d = new Date();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

var shortcutrows = [
  ["Undo / Redo", "Ctrl+Z / Ctrl+Shift+Z"],
  ["Save project", "Ctrl+S"],
  ["Duplicate object", "Ctrl+D"],
  ["Delete object", "Delete"],
  ["Focus selected", "F"],
  ["Move / Rotate / Scale", "W / E / R"],
  ["Play / Stop", "Space"],
  ["Orbit camera", "Left drag"],
  ["Pan camera", "Right drag"],
  ["Zoom camera", "Mouse wheel"],
  ["Add child drag", "Drag onto object"],
  ["Rename object", "F2"]
];

function shortcutsmodal() {
  var body = '<div class="picklist">';
  shortcutrows.forEach(function (r) {
    body += '<div class="row" style="height:30px;padding:0 8px"><span style="flex:1">' + esc(r[0]) + '</span><span class="kbd">' + esc(r[1]) + "</span></div>";
  });
  body += "</div>";
  openmodal({ title: "Keyboard shortcuts", icon: "key", body: body, width: "narrow" });
}

function u5note(text) {
  return '<div class="u5note">' + esc(text) + "</div>";
}
