var plugsys = {
  list: [],
  running: {},
  errors: [],
  uid: 1,
  loadonstart: true,
  widgets: {},
  widgetlist: [],
  toolbar: [],
  routes: {},
  cmds: {},
  docked: {},
  events: {},
  tickers: [],
  keybinds: {},
  prefs: {},
  log: []
};

function plugnewid(prefix) {
  plugsys.uid++;
  return (prefix || "plg") + plugsys.uid;
}

function plugcleanname(s) {
  return String(s || "plugin")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 24) || "plugin";
}

function plugdefaultcode() {
  return [
    "var plugin = api.createPlugin({",
    '  name: "hello plugin",',
    '  description: "A starter plugin: a toolbar button, a menu command and an overlay widget.",',
    '  author: "you",',
    "  version: \"1.0.0\",",
    "  icon: \"sparkle\"",
    "});",
    "",
    "api.toolbarButton({",
    '  tooltip: "Fizzbuzz the selection",',
    '  icon: "sparkle",',
    '  onClick: function () {',
    '    var node = api.selection.get();',
    "    if (!node) {",
    '      api.ui.toast("Select an actor first", "warn");',
    "      return;",
    "    }",
    "    api.selection.rename(node.id, node.name + \" ✦\");",
    '    api.ui.toast("Renamed " + node.name, "ok");',
    "  }",
    "});",
    "",
    "api.menuCommand({",
    '  menu: "tools",',
    '  label: "Fizzbuzz selection",',
    '  icon: "sparkle",',
    '  onClick: function () {',
    "    api.ui.toast(\"Hello from the plugin system\", \"ok\");",
    "  }",
    "});",
    "",
    "api.widget({",
    '  title: "Welcome widget",',
    '  corner: "topright",',
    "  render: function () {",
    "    return \"<div style='font-size:12px'>Plugins are loaded and running.</div>\";",
    "  }",
    "});",
    "",
    "api.log(\"hello plugin started\");"
  ].join("\n");
}

function plugwrap(rec) {
  var api = plugapi(rec);
  rec.context = { api: api, plugin: null };
  return rec;
}

function plugapi(rec) {
  var api = {};
  function ctx() {
    return rec.context;
  }
  api.createPlugin = function (spec) {
    spec = spec || {};
    var p = {
      id: rec.id,
      name: String(spec.name || rec.name || "plugin").slice(0, 60),
      description: String(spec.description || rec.description || "").slice(0, 240),
      author: String(spec.author || rec.author || "unknown").slice(0, 40),
      version: String(spec.version || rec.version || "1.0.0").slice(0, 20),
      icon: spec.icon || "sparkle"
    };
    ctx().plugin = p;
    rec.info = p;
    return p;
  };
  api.log = function () {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) parts.push(String(arguments[i]));
    pluglog(rec.id, parts.join(" "));
  };
  api.warn = function () {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) parts.push(String(arguments[i]));
    pluglog(rec.id, "warn: " + parts.join(" "));
  };
  api.error = function (msg) {
    pluglog(rec.id, "error: " + String(msg || ""));
    plugsys.errors.push({ id: rec.id, msg: String(msg || "") });
  };
  api.prefs = {
    get: function (key, fallback) {
      return rec.prefs[key] === undefined ? fallback : rec.prefs[key];
    },
    set: function (key, val) {
      rec.prefs[key] = val;
      plugsave();
      return val;
    }
  };
  api.scene = {
    objects: function () {
      return app.scene ? app.scene.objects : [];
    },
    walk: function (fn) {
      walk(app.scene.objects, function (n) {
        return fn(n);
      });
    },
    find: function (id) {
      return findnode(app.scene.objects, id);
    },
    add: function (type, opts) {
      var n = basenode(type || "cube", opts || {});
      n.name = uniqueid(app.scene.objects, n.name);
      app.scene.objects.push(n);
      commit("plugin add");
      refreshall();
      return n;
    },
    remove: function (id) {
      var n = findnode(app.scene.objects, id);
      if (n) deletenode(n);
    },
    rename: function (id, name) {
      var n = findnode(app.scene.objects, id);
      if (!n) return;
      n.name = name;
      commit("plugin rename");
      refreshall();
    },
    size: function (node) {
      return nodesize(node);
    },
    worldpos: function (node) {
      return worldpos(node);
    },
    snapshot: function () {
      return snapshot();
    }
  };
  api.selection = {
    get: function () {
      return selected();
    },
    ids: function () {
      return (app.selids || []).slice(0);
    },
    all: function () {
      return selectionnodes();
    },
    select: function (id) {
      app.selid = id;
      app.selids = [id];
      refreshall();
    },
    clear: function () {
      app.selid = null;
      app.selids = [];
      refreshall();
    },
    rename: function (id, name) {
      api.scene.rename(id, name);
    },
    lock: function (id, on) {
      var n = findnode(app.scene.objects, id);
      if (!n) return;
      n.lock = !!on;
      commit("lock");
      refreshall();
    }
  };
  api.transform = {
    move: function (node, x, y, z) {
      if (!node) return;
      node.pos = [x, y, z === undefined ? node.pos[2] : z];
      commit("plugin move");
      refreshall();
    },
    rotate: function (node, x, y, z) {
      if (!node) return;
      node.rot = [x, y, z === undefined ? node.rot[2] : z];
      commit("plugin rotate");
      refreshall();
    },
    scale: function (node, x, y, z) {
      if (!node) return;
      node.scl = [x, y, z === undefined ? node.scl[2] : z];
      commit("plugin scale");
      refreshall();
    },
    moveBy: function (node, dx, dy, dz) {
      if (!node) return;
      node.pos = [node.pos[0] + dx, node.pos[1] + dy, node.pos[2] + (dz || 0)];
      commit("plugin move");
      refreshall();
    },
    apply: function (arr) {
      (arr || []).forEach(function (t) {
        var n = findnode(app.scene.objects, t.id);
        if (!n) return;
        if (t.pos) n.pos = t.pos.slice(0);
        if (t.rot) n.rot = t.rot.slice(0);
        if (t.scl) n.scl = t.scl.slice(0);
      });
      commit("plugin transform");
      refreshall();
    }
  };
  api.play = {
    start: function () {
      if (!app.play) startplay();
    },
    stop: function () {
      if (app.play) stopplay();
    },
    isplaying: function () {
      return !!app.play;
    },
    game: function () {
      return game;
    },
    setvar: function (name, value) {
      (app.project.globals || []).forEach(function (g) {
        if (g.name === name) g.value = value;
      });
      refreshall();
    }
  };
  api.ui = {
    toast: function (msg, kind) {
      toast(String(msg || ""), kind);
    },
    alert: function (title, body) {
      openmodal({ title: String(title || "Plugin"), icon: "info", width: "narrow", body: "<div style='font-size:13px;line-height:1.65'>" + String(body || "") + "</div>", footer: '<button class="btn primary" data-mact="close">Close</button>', actions: {} });
    },
    prompt: function (title, value, cb) {
      promptbox(title, value, cb);
    },
    modal: function (spec) {
      spec = spec || {};
      openmodal({ title: spec.title || "Plugin", icon: spec.icon || "sparkle", width: spec.width || "narrow", body: spec.body || "", footer: spec.footer || '<button class="btn" data-mact="close">Close</button>', onmount: spec.onmount || null, actions: spec.actions || {} });
    },
    menu: function (items, x, y, onpick) {
      openmenu(items, x || 200, y || 200, {
        onact: function (name) {
          if (onpick) onpick(name);
        }
      });
    },
    refresh: function () {
      refreshall();
    }
  };
  api.toolbarButton = function (spec) {
    spec = spec || {};
    var b = { id: plugnewid("tb"), owner: rec.id, icon: spec.icon || "sparkle", tooltip: String(spec.tooltip || spec.label || "Plugin action"), onClick: spec.onClick || function () {} };
    plugsys.toolbar.push(b);
    plugrenderbar();
    return b.id;
  };
  api.menuCommand = function (spec) {
    spec = spec || {};
    var c = { id: plugnewid("cmd"), owner: rec.id, menu: spec.menu || "tools", label: String(spec.label || "Plugin command"), icon: spec.icon || "sparkle", key: spec.key || "", onClick: spec.onClick || function () {} };
    plugsys.cmds[c.id] = c;
    plugsys.routes[c.id] = c;
    acts[c.id] = function () {
      pluginvoke(c.id);
    };
    return c.id;
  };
  api.menuSeparator = function (menu) {
    plugsys.cmds[plugnewid("sep")] = { separator: true, menu: menu || "tools", owner: rec.id };
  };
  api.panel = function (spec) {
    spec = spec || {};
    var w = { id: plugnewid("pn"), owner: rec.id, title: String(spec.title || "Plugin panel"), icon: spec.icon || "layers", render: spec.render || function () { return "<div class='emptyhint'>Empty panel</div>"; }, dock: spec.dock || "center" };
    plugsys.widgets[w.id] = w;
    plugsys.widgetlist.push(w);
    plugrenderbar();
    if (spec.open) plugpanelopen(w.id);
    return w.id;
  };
  api.widget = function (spec) {
    spec = spec || {};
    var w = { id: plugnewid("wd"), owner: rec.id, title: String(spec.title || "Plugin"), render: spec.render || function () { return ""; }, corner: spec.corner || "topright" };
    plugsys.widgets[w.id] = w;
    plugsys.widgetlist.push(w);
    plugoverlay();
    return w.id;
  };
  api.widgets = function () {
    return plugsys.widgetlist.filter(function (w) {
      return w.owner === rec.id;
    });
  };
  api.command = function (id, fn) {
    plugsys.routes[id] = { id: id, owner: rec.id, onClick: fn, hidden: true };
    acts[id] = function () {
      pluginvoke(id);
    };
  };
  api.run = function (id) {
    pluginvoke(id);
  };
  api.on = function (event, fn) {
    if (!plugsys.events[event]) plugsys.events[event] = [];
    plugsys.events[event].push({ owner: rec.id, fn: fn });
  };
  api.onTick = function (fn) {
    plugsys.tickers.push({ owner: rec.id, fn: fn });
  };
  api.onKey = function (combo, fn) {
    plugsys.keybinds[String(combo || "").toLowerCase()] = { owner: rec.id, fn: fn };
  };
  api.emit = function (event, data) {
    plugfire(event, data);
  };
  api.state = {
    get: function (key, fallback) {
      return rec.state[key] === undefined ? fallback : rec.state[key];
    },
    set: function (key, val) {
      rec.state[key] = val;
      return val;
    }
  };
  api.http = {
    get: function (url, onok, onerr) {
      var x = new XMLHttpRequest();
      x.open("GET", url);
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) onok && onok(x.responseText);
        else onerr && onerr(x.status);
      };
      x.onerror = function () {
        onerr && onerr(0);
      };
      x.send();
    },
    json: function (url, onok, onerr) {
      api.http.get(url, function (t) {
        var d = null;
        try {
          d = JSON.parse(t);
        } catch (e) {
          onerr && onerr(e);
          return;
        }
        onok && onok(d);
      }, onerr);
    }
  };
  api.storage = {
    save: function (key, val) {
      try {
        localStorage.setItem("unxplg:" + rec.id + ":" + key, JSON.stringify(val));
      } catch (e) {}
    },
    load: function (key, fallback) {
      try {
        var raw = localStorage.getItem("unxplg:" + rec.id + ":" + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    }
  };
  api.docs = function () {
    plugdocs();
  };
  return api;
}

function pluglog(id, line) {
  var rec = plugfind(id);
  var name = rec ? rec.name : id;
  plugsys.log.unshift({ t: new Date().toLocaleTimeString(), id: id, name: name, m: line });
  if (plugsys.log.length > 200) plugsys.log.length = 200;
  var panel = qs("#plugconsole");
  if (panel) panel.innerHTML = plugconsolehtml();
}

function plugfire(event, data) {
  var list = plugsys.events[event] || [];
  for (var i = 0; i < list.length; i++) {
    var rec = plugfind(list[i].owner);
    if (!rec || !rec.enabled) continue;
    try {
      list[i].fn(data);
    } catch (e) {
      pluglog(list[i].owner, "error in " + event + ": " + e.message);
    }
  }
}

function plugtick(dt) {
  for (var i = 0; i < plugsys.tickers.length; i++) {
    var rec = plugfind(plugsys.tickers[i].owner);
    if (!rec || !rec.enabled) continue;
    try {
      plugsys.tickers[i].fn(dt);
    } catch (e) {
      plugsys.tickers.splice(i, 1);
      i--;
    }
  }
  var last = plugtick.last || 0;
  plugtick.last = Date.now();
  if (plugsys.widgetlist.length && Date.now() - last > 240) plugoverlay();
}

function plugkey(ev) {
  var key = String(ev.key || "").toLowerCase();
  var combo = (ev.ctrlKey || ev.metaKey ? "ctrl+" : "") + (ev.shiftKey ? "shift+" : "") + (ev.altKey ? "alt+" : "") + key;
  var k = plugsys.keybinds[combo];
  if (!k) return false;
  var rec = plugfind(k.owner);
  if (!rec || !rec.enabled) return false;
  try {
    k.fn(ev);
  } catch (e) {
    pluglog(k.owner, "error in key " + combo + ": " + e.message);
  }
  return true;
}

function plugfind(id) {
  for (var i = 0; i < plugsys.list.length; i++) if (plugsys.list[i].id === id) return plugsys.list[i];
  return null;
}

function pluginvoke(id) {
  var r = plugsys.routes[id];
  if (!r || !r.onClick) return;
  try {
    r.onClick();
  } catch (e) {
    pluglog(r.owner, "error in command: " + e.message);
    toast("Plugin error: " + e.message, "bad");
  }
}

function plugmenuitems(which) {
  var out = [];
  var ids = Object.keys(plugsys.routes);
  var grouped = {};
  ids.forEach(function (k) {
    var r = plugsys.routes[k];
    if (r.hidden || r.separator) return;
    if (r.menu !== which) return;
    grouped[r.menu] = grouped[r.menu] || [];
    var rec = plugfind(r.owner);
    grouped[r.menu].push({ label: r.label, icon: r.icon || "sparkle", act: r.id, key: r.key, plugin: rec ? rec.name : "" });
  });
  if (grouped[which]) {
    grouped[which].forEach(function (it) {
      out.push({ label: it.label, icon: it.icon, act: it.act, key: it.key });
    });
  }
  return out;
}

function plugrenderbar() {
  var el = qs("#plugbar");
  if (!el) return;
  if (!plugsys.toolbar.length) {
    el.innerHTML = "";
    el.classList.add("hide");
    return;
  }
  el.classList.remove("hide");
  el.innerHTML = plugsys.toolbar
    .map(function (b) {
      var rec = plugfind(b.owner);
      if (!rec || !rec.enabled) return "";
      return '<button class="plugtool" data-plugtool="' + b.id + '" title="' + esc(b.tooltip) + '">' + ic(b.icon, "ico-sm") + "</button>";
    })
    .join("");
  el.querySelectorAll("[data-plugtool]").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var id = btn.getAttribute("data-plugtool");
      var b = null;
      plugsys.toolbar.forEach(function (t) {
        if (t.id === id) b = t;
      });
      if (!b) return;
      try {
        b.onClick();
      } catch (e) {
        pluglog(b.owner, "error in toolbar: " + e.message);
        toast("Plugin error: " + e.message, "bad");
      }
    });
  });
}

function plugoverlay() {
  var host = qs("#plugoverlay");
  if (!host) return;
  if (!plugsys.widgetlist.length) {
    host.innerHTML = "";
    return;
  }
  var corners = { topright: [], topleft: [], bottomright: [], bottomleft: [] };
  plugsys.widgetlist.forEach(function (w) {
    var rec = plugfind(w.owner);
    if (!rec || !rec.enabled) return;
    var c = corners[w.corner] ? w.corner : "topright";
    corners[c].push(w);
  });
  host.innerHTML = Object.keys(corners)
    .map(function (c) {
      if (!corners[c].length) return "";
      return (
        '<div class="plugcorner ' +
        c +
        '">' +
        corners[c]
          .map(function (w) {
            var body = "";
            try {
              body = w.render();
            } catch (e) {
              body = "<div class='plugerr'>Widget error: " + esc(e.message) + "</div>";
            }
            return '<div class="plugwidget"><div class="plugwhead"><span>' + esc(w.title) + '</span><button class="plugwx" data-plugclose="' + w.id + '">×</button></div><div class="plugwbody">' + body + "</div></div>";
          })
          .join("") +
        "</div>"
      );
    })
    .join("");
  host.querySelectorAll("[data-plugclose]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-plugclose");
      plugsys.widgetlist = plugsys.widgetlist.filter(function (w) {
        return w.id !== id;
      });
      plugoverlay();
    });
  });
}

function plugpanelopen(id) {
  var w = plugsys.widgets[id];
  if (!w) return;
  var body = "";
  try {
    body = w.render();
  } catch (e) {
    body = "<div class='plugerr'>Panel error: " + esc(e.message) + "</div>";
  }
  openmodal({
    title: w.title,
    icon: w.icon || "layers",
    width: "wide",
    body: '<div class="plugpanel" id="plugpanel-' + id + '">' + body + "</div>",
    footer: '<button class="btn" data-mact="refresh">' + ic("refresh", "ico-sm") + " Refresh</button><button class=\"btn primary\" data-mact=\"close\">Close</button>",
    actions: {
      refresh: function (modal) {
        var host = modal.querySelector("#plugpanel-" + id);
        if (!host) return;
        try {
          host.innerHTML = w.render();
        } catch (e) {
          host.innerHTML = "<div class='plugerr'>" + esc(e.message) + "</div>";
        }
      }
    }
  });
}

function plugexport(rec) {
  return JSON.stringify({ format: "unixomut-plugin", version: 1, engine: "Roxumitod Game Engine", plugin: { id: rec.id, name: rec.name, description: rec.description, author: rec.author, version: rec.version, icon: rec.icon, code: rec.code, enabled: rec.enabled } }, null, 2);
}

function plugimport(text) {
  var data = null;
  try {
    data = JSON.parse(text);
  } catch (e) {
    toast("That file is not a plugin (bad JSON)", "bad");
    return null;
  }
  var p = data && data.plugin ? data.plugin : data;
  if (!p || !p.code) {
    toast("That file has no plugin code", "bad");
    return null;
  }
  var rec = plugadd(p.name, p.code, p);
  toast("Installed " + rec.name, "ok");
  return rec;
}

function plugadd(name, code, info) {
  info = info || {};
  var rec = {
    id: plugnewid("p"),
    name: String(info.name || name || "plugin").slice(0, 60),
    description: String(info.description || "").slice(0, 240),
    author: String(info.author || "you").slice(0, 40),
    version: String(info.version || "1.0.0").slice(0, 20),
    icon: info.icon || "sparkle",
    code: code || "",
    enabled: info.enabled === undefined ? true : !!info.enabled,
    prefs: info.prefs || {},
    state: {},
    errors: []
  };
  plugsys.list.push(rec);
  plugsave();
  return rec;
}

function plugrun(rec) {
  if (!rec) return false;
  plugstop(rec.id);
  rec.errors = [];
  rec.context = { api: null, plugin: null };
  var api = plugapi(rec);
  rec.context.api = api;
  var sandbox = {
    api: api,
    console: {
      log: api.log,
      warn: api.warn,
      error: api.error
    },
    setTimeout: function (fn, ms) {
      return setTimeout(function () {
        var r2 = plugfind(rec.id);
        if (!r2 || !r2.enabled) return;
        try {
          fn();
        } catch (e) {
          pluglog(rec.id, "error in timer: " + e.message);
        }
      }, ms);
    },
    clearTimeout: clearTimeout,
    JSON: JSON,
    Math: Math,
    Date: Date
  };
  var fn = null;
  try {
    fn = new Function("api", "console", "setTimeout", "clearTimeout", "JSON", "Math", "Date", "with (api) {\n" + rec.code + "\n}");
  } catch (e) {
    rec.enabled = false;
    rec.errors.push(String(e.message));
    pluglog(rec.id, "syntax error: " + e.message);
    plugsave();
    return false;
  }
  try {
    fn.apply(null, [api, sandbox.console, sandbox.setTimeout, sandbox.clearTimeout, JSON, Math, Date]);
    plugsys.running[rec.id] = true;
    (rec.errors || []).slice(0);
    pluglog(rec.id, "started v" + rec.version + " by " + rec.author);
    return true;
  } catch (e) {
    rec.enabled = false;
    rec.errors.push(String(e.message));
    pluglog(rec.id, "runtime error: " + e.message);
    plugsave();
    return false;
  }
}

function plugstop(id) {
  delete plugsys.running[id];
  plugsys.toolbar = plugsys.toolbar.filter(function (b) {
    return b.owner !== id;
  });
  plugsys.widgetlist = plugsys.widgetlist.filter(function (w) {
    return w.owner !== id;
  });
  Object.keys(plugsys.widgets).forEach(function (k) {
    if (plugsys.widgets[k].owner === id) delete plugsys.widgets[k];
  });
  Object.keys(plugsys.cmds).forEach(function (k) {
    if (plugsys.cmds[k] && plugsys.cmds[k].owner === id) {
      delete plugsys.cmds[k];
      delete plugsys.routes[k];
      delete acts[k];
    }
  });
  Object.keys(plugsys.routes).forEach(function (k) {
    if (plugsys.routes[k] && plugsys.routes[k].owner === id) delete plugsys.routes[k];
  });
  Object.keys(plugsys.events).forEach(function (k) {
    plugsys.events[k] = plugsys.events[k].filter(function (e2) {
      return e2.owner !== id;
    });
  });
  plugsys.tickers = plugsys.tickers.filter(function (t) {
    return t.owner !== id;
  });
  Object.keys(plugsys.keybinds).forEach(function (k) {
    if (plugsys.keybinds[k].owner === id) delete plugsys.keybinds[k];
  });
  plugrenderbar();
  plugoverlay();
}

function plugtoggle(id) {
  var rec = plugfind(id);
  if (!rec) return;
  if (rec.enabled) {
    rec.enabled = false;
    plugstop(rec.id);
    pluglog(rec.id, "disabled");
  } else {
    rec.enabled = true;
    plugrun(rec);
  }
  plugsave();
  plugmanager();
}

function plugsave() {
  try {
    var list = plugsys.list.map(function (r) {
      return { id: r.id, name: r.name, description: r.description, author: r.author, version: r.version, icon: r.icon, code: r.code, enabled: r.enabled, prefs: r.prefs };
    });
    localStorage.setItem("unxplugins", JSON.stringify(list));
  } catch (e) {}
}

function plugload() {
  try {
    var raw = localStorage.getItem("unxplugins");
    if (!raw) return;
    var list = JSON.parse(raw);
    if (!list || !list.length) return;
    plugsys.list = list.map(function (p) {
      return { id: p.id || plugnewid("p"), name: p.name, description: p.description || "", author: p.author || "you", version: p.version || "1.0.0", icon: p.icon || "sparkle", code: p.code || "", enabled: p.enabled !== false, prefs: p.prefs || {}, state: {}, errors: [] };
    });
  } catch (e) {}
}

function plugboot() {
  plugload();
  plugrenderbar();
  var ran = 0;
  plugsys.list.forEach(function (rec) {
    if (rec.enabled) {
      if (plugrun(rec)) ran++;
    }
  });
  if (ran) pluglog("boot", ran + " plugin" + (ran === 1 ? "" : "s") + " loaded");
}

function plugsteps() {
  return [
    { t: "1 · Create the plugin", d: "Open Tools → Plugins, press New plugin. Give it a name, an author and a version. The starter code already registers one toolbar button, one menu command and one widget." },
    { t: "2 · Code against the API", d: "Every plugin receives an api object: selection, scene, transform, play, ui, menuCommand, toolbarButton, widget, panel, on, onTick, onKey, storage and http. Code runs in a function scope with no direct access to the page." },
    { t: "3 · Run it", d: "Press Save & run. The plugin's toolbar button appears in the viewport bar, its command appears under Tools, and its widgets mount in the corner you chose. Logs show in the console pane." },
    { t: "4 · Distribute it", d: "Export writes a .unxplug file with the code and metadata. Anyone can drop that file into another project through Import, or paste its JSON into the editor." },
    { t: "5 · Disable safely", d: "The toggle unregisters every button, command, widget, ticker, keybind and event the plugin created and stops its code. Nothing is left behind in the editor state." }
  ];
}

function plugmanager() {
  var body =
    '<div class="plugbar"><button class="btn primary" data-mact="new">' + ic("plus", "ico-sm") + " New plugin</button>" +
    '<button class="btn" data-mact="import">' + ic("upload", "ico-sm") + " Import .unxplug</button>" +
    '<button class="btn" data-mact="reload">' + ic("refresh", "ico-sm") + " Reload all</button>" +
    '<span class="grow"></span><span class="tiny muted">' + plugsys.list.length + " installed · " + plugsys.toolbar.length + " toolbar · " + plugsys.widgetlist.length + " widgets</span></div>" +
    '<div class="pluglist">' +
    (plugsys.list.length
      ? plugsys.list
          .map(function (r) {
            var running = !!plugsys.running[r.id];
            return (
              '<div class="plugrow"><span class="plugico">' + ic(r.icon || "sparkle", "ico-sm") + "</span>" +
              '<div class="plugmain"><div class="t">' + esc(r.name) + ' <span class="tiny muted">v' + esc(r.version) + "</span></div><div class=\"s\">" + esc(r.description || "no description") + " · by " + esc(r.author) + "</div>" +
              (r.errors && r.errors.length ? '<div class="plugerr">' + esc(r.errors[r.errors.length - 1]) + "</div>" : "") +
              "</div>" +
              '<span class="plugstate ' + (r.enabled ? "on" : "off") + '">' + (r.enabled ? (running ? "running" : "enabled") : "disabled") + "</span>" +
              '<button class="btn sm" data-mact="toggle" data-id="' + r.id + '">' + (r.enabled ? "Disable" : "Enable") + "</button>" +
              '<button class="btn sm" data-mact="edit" data-id="' + r.id + '">Edit</button>' +
              '<button class="btn sm" data-mact="exportp" data-id="' + r.id + '">' + ic("download", "ico-xs") + "</button>" +
              '<button class="btn sm ghost" data-mact="delp" data-id="' + r.id + '">' + ic("trash", "ico-xs") + "</button></div>"
            );
          })
          .join("")
      : '<div class="emptyhint">No plugins yet. Press New plugin to start from the template, or import a .unxplug file.</div>') +
    "</div>" +
    '<div class="plugdocs"><div class="plugdochead">' + ic("book", "ico-sm") + " How the plugin system works</div>" +
    plugsteps()
      .map(function (s) {
        return '<div class="plugstep"><b>' + esc(s.t) + "</b><div>" + esc(s.d) + "</div></div>";
      })
      .join("") +
    '<div class="plugstep"><b>API surface</b><div><code>createPlugin</code> <code>toolbarButton</code> <code>menuCommand</code> <code>panel</code> <code>widget</code> <code>command</code> <code>on</code> <code>onTick</code> <code>onKey</code> <code>emit</code> <code>selection.*</code> <code>scene.*</code> <code>transform.*</code> <code>play.*</code> <code>ui.*</code> <code>prefs.*</code> <code>state.*</code> <code>storage.*</code> <code>http.*</code></div></div></div>' +
    '<div class="plugdochead" style="margin-top:12px">' + ic("table", "ico-sm") + ' Console</div><div class="plugconsole" id="plugconsole">' + plugconsolehtml() + "</div>";
  openmodal({
    title: "Plugin Manager - Roblox Studio style",
    icon: "layers",
    width: "wide",
    body: body,
    footer: '<button class="btn primary" data-mact="close">Close</button>',
    actions: {
      new: function () {
        plugeditor(null);
      },
      import: function () {
        plugimportfile();
      },
      reload: function () {
        plugsys.list.forEach(function (r) {
          plugstop(r.id);
        });
        plugboot();
        plugmanager();
        toast("All plugins reloaded", "ok");
      },
      toggle: function (m, s, btn) {
        plugtoggle(btn.getAttribute("data-id"));
      },
      edit: function (m, s, btn) {
        plugeditor(plugfind(btn.getAttribute("data-id")));
      },
      exportp: function (m, s, btn) {
        var rec = plugfind(btn.getAttribute("data-id"));
        if (!rec) return;
        downloadblob(plugcleanname(rec.name) + ".unxplug", new Blob([plugexport(rec)], { type: "application/json" }));
        toast("Exported " + rec.name + ".unxplug", "ok");
      },
      delp: function (m, s, btn) {
        var rec = plugfind(btn.getAttribute("data-id"));
        if (!rec) return;
        plugstop(rec.id);
        plugsys.list = plugsys.list.filter(function (r) {
          return r.id !== rec.id;
        });
        plugsave();
        plugmanager();
        toast("Removed " + rec.name, "warn");
      }
    }
  });
}

function plugconsolehtml() {
  if (!plugsys.log.length) return '<div class="emptyhint">No plugin output yet.</div>';
  return plugsys.log
    .slice(0, 60)
    .map(function (l) {
      return '<div class="plugline"><span class="dim">' + esc(l.t) + "</span> <b>" + esc(l.name) + "</b> " + esc(l.m) + "</div>";
    })
    .join("");
}

function plugeditor(rec) {
  var isnew = !rec;
  var code = rec ? rec.code : plugdefaultcode();
  var name = rec ? rec.name : "my plugin";
  var author = rec ? rec.author : "you";
  var version = rec ? rec.version : "1.0.0";
  var desc = rec ? rec.description : "";
  var body =
    '<div class="plugform">' +
    '<label>Name<input class="inp" id="plname" value="' + esc(name) + '"></label>' +
    '<label>Author<input class="inp" id="plauthor" value="' + esc(author) + '"></label>' +
    '<label>Version<input class="inp" id="plversion" value="' + esc(version) + '"></label>' +
    "</div>" +
    '<label class="plugdesc">Description<input class="inp" id="pldesc" value="' + esc(desc) + '"></label>' +
    '<div class="plugcodehead"><span>' + ic("code", "ico-sm") + " plugin code</span><button class=\"btn sm\" data-mact=\"template\">Insert template</button><button class=\"btn sm\" data-mact=\"docs\">API docs</button></div>" +
    '<textarea class="plugcode" id="plcode" spellcheck="false">' + esc(code) + "</textarea>" +
    '<div class="plugerr" id="plerr"></div>';
  openmodal({
    title: isnew ? "New plugin" : "Edit plugin - " + rec.name,
    icon: "code",
    width: "wide",
    body: body,
    footer: '<button class="btn" data-mact="close">Cancel</button><button class="btn" data-mact="save">Save</button><button class="btn primary" data-mact="saverun">Save &amp; run</button>',
    onmount: function (modal) {
      var ta = modal.querySelector("#plcode");
      if (ta) ta.focus();
      var err = modal.querySelector("#plerr");
      if (err && rec && rec.errors && rec.errors.length) err.textContent = rec.errors[rec.errors.length - 1];
    },
    actions: {
      template: function (m) {
        m.querySelector("#plcode").value = plugdefaultcode();
      },
      docs: function () {
        plugdocs();
      },
      save: function (m, s) {
        plugcommit(rec, m, false, s);
      },
      saverun: function (m, s) {
        plugcommit(rec, m, true, s);
      }
    }
  });
}

function plugcommit(rec, modal, run, scrim) {
  var name = modal.querySelector("#plname").value.trim() || "plugin";
  var author = modal.querySelector("#plauthor").value.trim() || "you";
  var version = modal.querySelector("#plversion").value.trim() || "1.0.0";
  var desc = modal.querySelector("#pldesc").value.trim();
  var code = modal.querySelector("#plcode").value;
  var err = modal.querySelector("#plerr");
  try {
    new Function("api", "console", "with (api) {\n" + code + "\n}");
  } catch (e) {
    if (err) err.textContent = "Syntax error: " + e.message;
    toast("Fix the syntax error first", "bad");
    return;
  }
  var target = rec;
  if (!target) {
    target = plugadd(name, code, { name: name, author: author, version: version, description: desc });
  } else {
    plugstop(target.id);
    target.name = name;
    target.author = author;
    target.version = version;
    target.description = desc;
    target.code = code;
    target.enabled = true;
  }
  plugsave();
  if (run) {
    plugrun(target);
    toast("Running " + target.name, "ok");
  } else {
    toast("Saved " + target.name, "ok");
  }
  if (scrim) scrim.remove();
  plugmanager();
}

function plugimportfile() {
  var inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".unxplug,.json,application/json";
  inp.onchange = function () {
    var f = inp.files && inp.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var rec = plugimport(String(rd.result || ""));
      if (rec) {
        plugrun(rec);
        plugmanager();
      }
    };
    rd.readAsText(f);
  };
  inp.click();
}

function plugdocs() {
  var body =
    '<div class="plugdocs" style="line-height:1.65;font-size:13px">' +
    "<h3>Plugin objects</h3>" +
    "<p><code>api.createPlugin(spec)</code> - declares the plugin: name, description, author, version, icon. Returns the plugin record.</p>" +
    "<h3>Editor surface</h3>" +
    "<p><code>api.toolbarButton({icon, tooltip, onClick})</code> - adds a button to the viewport toolbar.<br>" +
    "<code>api.menuCommand({menu, label, icon, key, onClick})</code> - adds a command to File / Edit / Tools / Window / Build / Select / Help.<br>" +
    "<code>api.panel({title, icon, render, open})</code> - registers a dockable panel; <code>render</code> returns HTML.<br>" +
    "<code>api.widget({title, corner, render})</code> - mounts a floating widget in a viewport corner.<br>" +
    "<code>api.command(id, fn)</code> - registers a named action you can also trigger from HTML with <code>data-act=\"id\"</code>.</p>" +
    "<h3>Live data</h3>" +
    "<p><code>api.selection.get() · ids() · all() · select(id) · clear() · lock(id, on)</code><br>" +
    "<code>api.scene.objects() · walk(fn) · find(id) · add(type, opts) · remove(id) · rename(id, name) · size(node) · worldpos(node)</code><br>" +
    "<code>api.transform.move · rotate · scale · moveBy · apply(list)</code><br>" +
    "<code>api.play.start() · stop() · isplaying() · game() · setvar(name, value)</code></p>" +
    "<h3>Events and timing</h3>" +
    "<p><code>api.on(event, fn)</code> - <code>selection</code>, <code>playstart</code>, <code>playstop</code>, <code>scenechange</code>, <code>save</code>, <code>tick</code>.<br>" +
    "<code>api.emit(event, data)</code> - fire your own event to other plugins.<br>" +
    "<code>api.onTick(fn)</code> - called every editor frame with dt.<br>" +
    "<code>api.onKey(\"ctrl+k\", fn)</code> - global key bindings.</p>" +
    "<h3>Storage and IO</h3>" +
    "<p><code>api.prefs.get/set</code> - per-plugin settings saved with the project.<br>" +
    "<code>api.state.get/set</code> - in-memory scratch space.<br>" +
    "<code>api.storage.save/load</code> - namespaced browser storage.<br>" +
    "<code>api.http.get(url, ok, err) · json(url, ok, err)</code> - network requests.<br>" +
    "<code>api.ui.toast · alert · prompt · modal · menu · refresh</code> - editor UI.</p>" +
    "<h3>Lifecycle</h3>" +
    "<p>A plugin runs inside a function scope with only <code>api</code>, <code>console</code>, timers and the standard language globals. Disabling it calls <code>plugstop</code>, which unregisters every button, command, panel, widget, ticker, keybinding and event handler it created, so a broken plugin can never wedge the editor.</p>" +
    "<h3>Distribution</h3>" +
    "<p>Export writes a <code>.unxplug</code> JSON file containing metadata and source. Import accepts that file or pasted JSON.</p>" +
    "</div>";
  openmodal({ title: "Plugin API reference", icon: "book", width: "wide", body: body, footer: '<button class="btn primary" data-mact="close">Close</button>', actions: {} });
}

acts.plugins = function () {
  plugmanager();
};

acts.plugdocs = function () {
  plugdocs();
};

function plugcss() {
  if (qs("#plugcss")) return;
  var st = document.createElement("style");
  st.id = "plugcss";
  st.textContent =
    ".plugtool{width:26px;height:26px;border-radius:6px;border:1px solid rgba(255,255,255,.09);background:rgba(24,28,34,.9);color:#c8d2e0;display:grid;place-items:center;cursor:pointer;margin-left:4px}" +
    ".plugtool:hover{background:rgba(58,110,190,.55);color:#fff}" +
    "#plugbar{display:flex;align-items:center;gap:2px;padding:0 4px;border-left:1px solid rgba(255,255,255,.08);margin-left:6px}" +
    "#plugoverlay{position:absolute;inset:0;pointer-events:none;z-index:9}" +
    ".plugcorner{position:absolute;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:290px}" +
    ".plugcorner.topright{right:12px;top:12px}.plugcorner.topleft{left:12px;top:12px}.plugcorner.bottomright{right:12px;bottom:12px}.plugcorner.bottomleft{left:12px;bottom:12px}" +
    ".plugwidget{pointer-events:auto;background:rgba(18,21,26,.94);border:1px solid rgba(255,255,255,.1);border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.42);overflow:hidden;min-width:190px}" +
    ".plugwhead{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;font-size:11.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#8fb7e8;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.07)}" +
    ".plugwbody{padding:9px 10px;color:#d6dee8;font-size:12.5px}" +
    ".plugwx{background:none;border:0;color:#7d8798;cursor:pointer;font-size:15px;line-height:1}" +
    ".plugbar{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}" +
    ".plugbar .grow{flex:1}" +
    ".pluglist{display:flex;flex-direction:column;gap:8px;max-height:290px;overflow:auto}" +
    ".plugrow{display:flex;align-items:center;gap:10px;padding:9px 11px;background:#151a20;border:1px solid #242a33;border-radius:9px}" +
    ".plugico{width:26px;height:26px;border-radius:7px;background:rgba(79,163,255,.14);color:#8ec5ff;display:grid;place-items:center}" +
    ".plugmain{flex:1;min-width:0}.plugmain .t{font-size:13px;font-weight:600;color:#eef2f8}.plugmain .s{font-size:11.5px;color:#8b95a3}" +
    ".plugstate{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;padding:2px 7px;border-radius:999px}" +
    ".plugstate.on{background:rgba(57,217,138,.16);color:#6fe3a5}.plugstate.off{background:rgba(255,255,255,.06);color:#98a1ad}" +
    ".plugerr{color:#ff9dba;font-size:11.5px;background:rgba(255,93,143,.1);border:1px solid rgba(255,93,143,.25);border-radius:6px;padding:5px 8px;margin-top:5px}" +
    ".plugdocs{margin-top:14px;border-top:1px solid #232830;padding-top:10px}" +
    ".plugdochead{display:flex;align-items:center;gap:7px;font-weight:700;font-size:12px;color:#cfd9e6;margin-bottom:8px}" +
    ".plugstep{display:flex;flex-direction:column;gap:2px;background:#14181d;border:1px solid #222831;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px;color:#aab6c4}" +
    ".plugstep b{color:#e6ecf5;font-size:12.5px}" +
    ".plugstep code{background:rgba(79,163,255,.12);color:#a9cffd;border-radius:4px;padding:1px 4px;font-size:11.5px}" +
    ".plugconsole{font-family:ui-monospace,monospace;font-size:11px;background:#101318;border:1px solid #242a33;border-radius:8px;padding:8px;max-height:150px;overflow:auto;color:#9aa6b5}" +
    ".plugline b{color:#e6ecf5}" +
    ".plugform{display:flex;gap:10px}.plugform label{flex:1;display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#8b95a3}" +
    ".plugdesc{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#8b95a3;margin:8px 0}" +
    ".plugcodehead{display:flex;align-items:center;gap:8px;font-size:12px;color:#cfd9e6;margin:6px 0}" +
    ".plugcode{width:100%;height:280px;box-sizing:border-box;background:#0d1117;color:#d6dee8;border:1px solid #242a33;border-radius:8px;padding:10px;font-family:ui-monospace,monospace;font-size:12px;line-height:1.55;resize:vertical}";
  document.head.appendChild(st);
}
