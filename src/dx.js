var dbg = { log: [], paused: false, hits: {}, watch: [], steps: 0 };

var shortcuts = [
  { keys: "Ctrl Z", label: "Undo" },
  { keys: "Ctrl Shift Z", label: "Redo" },
  { keys: "Ctrl Y", label: "Redo (alternative)" },
  { keys: "Ctrl S", label: "Save project" },
  { keys: "Ctrl D", label: "Duplicate selection" },
  { keys: "Ctrl C / Ctrl V", label: "Copy / paste object" },
  { keys: "Del", label: "Delete selection" },
  { keys: "W", label: "Move tool" },
  { keys: "E", label: "Rotate tool" },
  { keys: "R", label: "Scale tool" },
  { keys: "F", label: "Focus selection" },
  { keys: "G", label: "Toggle grid" },
  { keys: "Space", label: "Play / stop" },
  { keys: "F2", label: "Rename object" },
  { keys: "Esc", label: "Close modal, cancel play" },
  { keys: "Arrow keys", label: "Nudge selection in the viewport" },
  { keys: "Shift + click", label: "Add to selection" },
  { keys: "Right drag", label: "Pan camera" },
  { keys: "Middle drag", label: "Orbit camera" },
  { keys: "Wheel", label: "Zoom camera" },
  { keys: "Ctrl Shift D", label: "Toggle debugger" },
  { keys: "Ctrl Shift M", label: "Toggle profiler" },
  { keys: "Ctrl Shift F", label: "Feature hub" },
  { keys: "Ctrl Shift P", label: "Command bar" }
];

function shortcuthelp() {
  var body = '<div class="scgrid">';
  shortcuts.forEach(function (s) {
    body += '<div class="scrow"><span class="keycap">' + esc(s.keys) + "</span><span>" + esc(s.label) + "</span></div>";
  });
  body += "</div>";
  body += '<div class="hintline">Panels: colliders ⬚, navmesh ▦, debugger, profiler and the audio mixer are in the View and Scene menus.</div>';
  openmodal({
    title: "Keyboard shortcuts",
    icon: "key",
    body: body,
    footer: '<button class="btn primary" data-mact="close">Close</button>',
    actions: {
      close: function (m, s) {
        closemodal(s);
      }
    }
  });
}

acts.shortcuts = function () {
  shortcuthelp();
};

function autosavestart() {
  if (autosavestart.on) return;
  autosavestart.on = true;
  setInterval(function () {
    if (!app || app.screen !== "editor" || !app.project) return;
    if (app.play) return;
    saveprojects();
    savesession();
    app.autosavedat = Date.now();
    var dot = qs("#autosavedot");
    if (dot) {
      dot.classList.add("on");
      setTimeout(function () {
        dot.classList.remove("on");
      }, 900);
    }
  }, 20000);
}

function autosavepill() {
  return '<div class="autosave" id="autosavepill"><span class="dot" id="autosavedot"></span>Autosave</div>';
}

function dbglog(kind, detail) {
  var entry = { t: Date.now(), kind: kind, detail: detail, frame: framecount };
  dbg.log.push(entry);
  if (dbg.log.length > 300) dbg.log.shift();
  var host = qs("#dbglist");
  if (host) dbgrender();
}

function dbghit(id) {
  return !!dbg.hits[id];
}

function dbgpause(label) {
  if (!game) return;
  game.paused = true;
  dbg.paused = true;
  showbanner("Breakpoint", label + " · press Continue in the debugger", "lost");
  dbgrender();
  toast("Breakpoint hit: " + label, "warn");
}

function dbgtick() {
  var host = qs("#dbgpanel");
  if (!host) return;
  var stats = dbgstats();
  var sum = host.querySelector("#dbgstats");
  if (sum) sum.innerHTML = stats;
  var list = host.querySelector("#dbglist");
  if (list && framecount % 12 === 0) dbglist();
}

function dbgstats() {
  var items = (view.items || []).length;
  var bodies = phys.bodies.length;
  var parts = fx.list.length;
  var state = game ? (game.paused ? "paused" : game.status) : "editor";
  return '<span>' + Math.round(fpsval) + " fps</span><span>" + items + " draws</span><span>" + bodies + " bodies</span><span>" + parts + " particles</span><span>state " + state + "</span>";
}

function dbglist() {
  var host = qs("#dbglist");
  if (!host) return;
  var out = "";
  var events = [];
  (app.project.eventsheets || []).forEach(function (sh) {
    if (sh.name !== app.scene.eventsheet) return;
    (sh.events || []).forEach(function (e, i) {
      events.push({ e: e, i: i });
    });
  });
  out += '<div class="pickgroup">Event sheet · ' + esc(app.scene.eventsheet || "none") + "</div>";
  if (!events.length) out += '<div class="emptyhint">No events in this sheet.</div>';
  events.slice(0, 14).forEach(function (row) {
    var on = !!row.e.breakpoint;
    out += '<div class="dbgrow"><button class="bp' + (on ? " on" : "") + '" data-act="dbgbreak" data-index="' + row.i + '" title="Toggle breakpoint"></button><span class="t">' + esc((row.e.when || "event") + " → " + (row.e.do || "")) + "</span></div>";
  });
  out += '<div class="pickgroup">Log</div>';
  if (!dbg.log.length) out += '<div class="emptyhint">Nothing logged yet. Play the game.</div>';
  dbg.log.slice(-9).reverse().forEach(function (l) {
    out += '<div class="dbglog"><span class="tm">' + new Date(l.t).toLocaleTimeString() + "</span><span class=\"k\">" + esc(l.kind) + "</span><span class=\"d\">" + esc(String(l.detail || "").slice(0, 60)) + "</span></div>";
  });
  host.innerHTML = out;
}

function dbgrender() {
  var host = qs("#dbgbody");
  if (!host) return;
  host.innerHTML = '<div id="dbglist"></div>';
  dbglist();
}

function dbgtoggle() {
  var panel = qs("#dbgpanel");
  if (panel) {
    panel.remove();
    return;
  }
  var html = '<div class="dbgpanel" id="dbgpanel"><div class="head">' + ic("events", "ico-sm") + "<span>Event debugger</span><div id=\"dbgstats\"></div><button class=\"iconbtn\" data-act=\"dbgtoggle\">" + ic("x", "ico-xs") + '</button></div><div class="body" id="dbgbody"><div id="dbglist"></div></div><div class="foot"><button class="btn sm" data-act="dbgstep">' + ic("play", "ico-xs") + 'Continue</button><button class="btn sm" data-act="dbgclear">Clear log</button><button class="btn sm" data-act="shortcuts">Shortcuts</button></div></div>';
  var stage = qs(".sceneview") || qs("#stageshell") || document.body;
  stage.insertAdjacentHTML("beforeend", html);
  dbglist();
}

acts.dbgtoggle = function () {
  dbgtoggle();
};

acts.dbgbreak = function (el) {
  var i = +el.getAttribute("data-index");
  var sheet = null;
  (app.project.eventsheets || []).forEach(function (sh) {
    if (sh.name === app.scene.eventsheet) sheet = sh;
  });
  if (!sheet || !sheet.events[i]) return;
  sheet.events[i].breakpoint = !sheet.events[i].breakpoint;
  commit("breakpoint");
  dbglist();
};

acts.dbgstep = function () {
  if (game) {
    game.paused = false;
    dbg.paused = false;
  }
  var b = qs("#playbanner");
  if (b) b.classList.add("hide");
  dbglist();
  toast("Resumed", "ok");
};

acts.dbgclear = function () {
  dbg.log = [];
  dbglist();
};

var profhist = [];

acts.profiler = function () {
  var on = qs("#profiler");
  if (on) {
    on.remove();
    return;
  }
  var stage = qs(".sceneview") || document.body;
  stage.insertAdjacentHTML("beforeend", '<div class="profiler" id="profiler"><div class="head">' + ic("table", "ico-sm") + "<span>Profiler</span><button class=\"iconbtn\" data-act=\"profiler\">" + ic("x", "ico-xs") + '</button></div><canvas id=\"profcanvas\" width=\"240\" height=\"56\"></canvas><div class="rows" id="profrows"></div></div>');
};

function proftick() {
  var host = qs("#profrows");
  if (!host) return;
  profhist.push(Math.min(120, Math.round(fpsval)));
  if (profhist.length > 120) profhist.shift();
  if (framecount % 6 === 0) {
    var bodies = phys.bodies.length;
    var tris = 0;
    (view.items || []).forEach(function (it) {
      if (it.geo) tris += it.geo.idx.length / 3;
      else tris += it.kind === "sphere" ? 900 : it.kind === "plane" ? 2 : 12;
    });
    host.innerHTML = '<div class="row"><span>FPS</span><b>' + Math.round(fpsval) + '</b></div><div class="row"><span>Frame</span><b>' + (1000 / Math.max(1, fpsval)).toFixed(1) + ' ms</b></div><div class="row"><span>Draw items</span><b>' + (view.items || []).length + '</b></div><div class="row"><span>Triangles</span><b>' + Math.round(tris) + '</b></div><div class="row"><span>Physics bodies</span><b>' + bodies + '</b></div><div class="row"><span>Particles</span><b>' + fx.list.length + '</b></div><div class="row"><span>Objects</span><b>' + countnodes() + '</b></div>';
    var cv = qs("#profcanvas");
    if (cv) {
      var g = cv.getContext("2d");
      g.clearRect(0, 0, cv.width, cv.height);
      g.fillStyle = "#1a1d22";
      g.fillRect(0, 0, cv.width, cv.height);
      g.strokeStyle = "#3b4250";
      g.beginPath();
      g.moveTo(0, 28);
      g.lineTo(cv.width, 28);
      g.stroke();
      g.strokeStyle = "#5cc47a";
      g.lineWidth = 1.6;
      g.beginPath();
      profhist.forEach(function (v, i) {
        var x = (i / Math.max(1, profhist.length - 1)) * cv.width;
        var y = cv.height - (v / 120) * cv.height;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      });
      g.stroke();
      g.fillStyle = "#8d96a5";
      g.font = "9px Inter, sans-serif";
      g.fillText("60", 2, 10);
    }
  }
}

function countnodes() {
  var n = 0;
  walk(app.scene.objects || [], function () {
    n++;
  });
  return n;
}

function dbginstall() {
  document.addEventListener("keydown", function (ev) {
    if (app.screen !== "editor") return;
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === "d") {
      ev.preventDefault();
      dbgtoggle();
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === "m") {
      ev.preventDefault();
      acts.profiler();
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === "k") {
      ev.preventDefault();
      shortcuthelp();
    }
  });
}
