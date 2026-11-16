function behaviorsection(node) {
  var out = '<div class="sec"><div class="sechead"><span class="tw">' + ic("chevd", "ico-xs") + "</span>" + ic("network", "ico-sm") + "<span>Behaviors</span></div><div class=\"secbody\">";
  if (!(node.behaviors || []).length) out += '<div class="emptyhint">No behaviors yet. Behaviors run while the game plays.</div>';
  (node.behaviors || []).forEach(function (b, i) {
    var meta = behavfind(b.type) || { label: b.name || "Behavior", icon: "network" };
    var summary = "";
    if ((b.type || "") === "camerafollow") summary = (b.dist || 14) + " m back";
    else if ((b.type || "") === "health") summary = (b.hp || 3) + " hp";
    else summary = "speed " + (b.speed === undefined ? 1 : b.speed) + (b.type === "health" ? "" : " · range " + (b.range === undefined ? 1.5 : b.range));
    out += '<div class="behrow"><span class="behico">' + ic(meta.icon, "ico-xs") + "</span><span class=\"behname\">" + esc(behavlabel(b)) + '</span><span class="behsum">' + esc(summary) + "</span>" +
      '<button class="iconbtn" data-act="behaviorsettings" data-index="' + i + '" title="Settings">' + ic("sliders", "ico-xs") + "</button>" +
      '<button class="iconbtn" data-act="removebehavior" data-id="' + node.id + '" data-index="' + i + '" title="Remove">' + ic("x", "ico-xs") + "</button></div>";
  });
  out += '<button class="addrow" data-act="addbehavior">' + ic("plus", "ico-xs") + "Add behavior</button></div></div>";
  return out;
}

function openbehaviormodal() {
  var node = selected();
  if (!node) {
    toast("Select an object first", "warn");
    return;
  }
  var body = '<div class="searchbox mb8">' + ic("search", "ico-sm") + '<input data-autofocus placeholder="Search behaviors..."></div><div class="picklist" id="behlist">';
  behavmeta.forEach(function (b) {
    body += '<button class="pickitem" data-behtype="' + b.id + '"><span class="ico">' + ic(b.icon, "ico-sm") + '</span><span class="t">' + esc(b.label) + "</span></button>";
  });
  body += "</div>";
  var ref = openmodal({
    title: "Add behavior",
    icon: "network",
    body: body,
    onmount: function (modal) {
      var search = modal.querySelector("input");
      search.addEventListener("input", function () {
        var q = search.value.toLowerCase();
        modal.querySelectorAll("[data-behtype]").forEach(function (b) {
          b.style.display = b.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none";
        });
      });
      modal.addEventListener("click", function (ev) {
        var b = ev.target.closest("[data-behtype]");
        if (!b) return;
        applybehavior(node, b.getAttribute("data-behtype"));
        closemodal(ref.scrim);
      });
    }
  });
}

function applybehavior(node, id) {
  var meta = behavfind(id);
  if (!meta) return;
  var beh = { type: id, name: meta.label, speed: 1, range: 1.5 };
  if (id === "platformer") beh.jump = 9.4;
  if (id === "car" || id === "boat") beh.turn = 70;
  if (id === "camerafollow") {
    beh.dist = 14;
    beh.height = 3;
  }
  if (id === "health") beh.hp = 3;
  if (id === "bullet") beh.life = 3;
  node.behaviors = node.behaviors || [];
  node.behaviors.push(beh);
  if (id === "platformer" || id === "car" || id === "boat" || id === "bullet") {
    node.comps = node.comps || [];
    if (!hascomp(node, "physics")) node.comps.push("physics");
    node.compdata = node.compdata || {};
    node.compdata.physics = node.compdata.physics || { type: "Dynamic", mass: 1, gravity: 1, friction: 0.4 };
    if (!hascomp(node, "collider")) node.comps.push("collider");
  }
  if (id === "health" || id === "follow" || id === "lookattarget" || id === "camerafollow") {
    if (!hascomp(node, "collider")) node.comps.push("collider");
  }
  physreset();
  commit("behavior");
  toast(meta.label + " added to " + node.name, "ok");
}

acts.addbehavior = function () {
  openbehaviormodal();
};

acts.physwake = function () {
  var node = selected();
  if (!node) return;
  physreset();
  commit("physreset");
  toast("Physics bodies rebuilt", "ok");
};

acts.physimpulse = function () {
  var node = selected();
  var body = node ? physbyid(node.id) : null;
  if (!body) {
    toast("Select an object with a physics body", "warn");
    return;
  }
  body.vel = [body.vel[0], 8, body.vel[2]];
  toast("Impulse applied to " + node.name, "ok");
};

acts.fxburst = function () {
  var node = selected();
  if (!node) return;
  if (!fxtrigger(node.id)) {
    node.compdata = node.compdata || {};
    node.compdata.particles = node.compdata.particles || { preset: "explosion" };
    if (!hascomp(node, "particles")) node.comps.push("particles");
    fxreset();
    fxtrigger(node.id);
  }
  commit("fxburst");
};

acts.fxclear = function () {
  fx.list = [];
  fx.total = 0;
};

acts.animquick = function () {
  var node = selected();
  if (!node) return;
  node.compdata = node.compdata || {};
  delete node.compdata.animator;
  animdef(node);
  if (!hascomp(node, "animator")) node.comps.push("animator");
  commit("animquick");
  toast("Animator set up with idle / run / jump", "ok");
};

acts.tileclearall = function () {
  var node = selected();
  if (!node || node.type !== "tilemap") return;
  var d = tiledata(node);
  tilearrayset(node, new Array(d.cols * d.rows).fill(0));
  commit("tileclear");
};

document.addEventListener("change", function (ev) {
  var el = ev.target;
  if (!el || !el.getAttribute) return;
  if (el.hasAttribute("data-afield")) {
    var node = selected();
    if (!node) return;
    var d = animdef(node);
    d[el.getAttribute("data-afield")] = el.value;
    commit("animstate");
    return;
  }
  if (el.hasAttribute("data-tf")) {
    var tn = selected();
    if (!tn || tn.type !== "tilemap") return;
    var td = tiledata(tn);
    var f = el.getAttribute("data-tf");
    if (f === "solid") td.solid = el.type === "checkbox" ? el.checked : el.value === "true";
    else if (f === "layer") td.layer = el.value;
    else td[f] = parseFloat(el.value) || 0;
    physreset();
    commit("tilemap");
  }
});

document.addEventListener("input", function (ev) {
  var el = ev.target;
  if (el && el.hasAttribute && el.hasAttribute("data-cfield") && el.getAttribute("data-cfield").indexOf("particles.") === 0) {
    fxreset();
  }
});

function uidrawplay(g) {
  if (!app.play || !game) return;
  uidraw(g, view.w, view.h);
}

function drawextras(g, cs, w, h) {
  if (!g) return;
  collideroverlay(g, cs, w, h);
  navoverlay(g, cs, w, h);
  if (!app.play) tileghost(g);
}

function tickextras(dt) {
  if (!app.scene) return;
  animstep(dt);
  if (app.play) {
    animsyncparams();
    fxtick(dt, true);
  } else {
    fxtick(dt, false);
  }
}

function runactionextra(text, subject) {
  if (!text) return false;
  var m = text.match(/burst\s+(\w+)\s+particles?/i);
  if (m && subject) {
    var node = subject.node || subject;
    var preset = m[1] === "particles" ? "explosion" : m[1];
    if (typeof fxburst === "function") fxburst(node.pos, fxpresets[preset] ? preset : "explosion");
    if (typeof fxtrigger === "function") fxtrigger(node.id);
    runevents("particles", node);
    return true;
  }
  m = text.match(/set\s+animator\s+state\s+to\s+(.+)$/i);
  if (m && subject) {
    var node2 = subject.node || subject;
    var d = node2.compdata && node2.compdata.animator;
    if (d) {
      d.current = m[1].trim();
      d.rt = null;
      runevents("animation", node2);
    }
    return true;
  }
  m = text.match(/set\s+parameter\s+(\w+)\s+to\s+(-?[\d.]+)/i);
  if (m && subject) {
    var node3 = subject.node || subject;
    var d3 = node3.compdata && node3.compdata.animator;
    if (d3) animsetparam(d3, m[1], parseFloat(m[2]));
    return true;
  }
  m = text.match(/set\s+(\w+)\s+volume\s+to\s+([\d.]+)/i);
  if (m) {
    var grp = mixergroup(m[1].charAt(0).toUpperCase() + m[1].slice(1));
    grp.volume = Math.max(0, Math.min(1, parseFloat(m[2])));
    mixersync();
    return true;
  }
  m = text.match(/mute\s+(\w+)/i);
  if (m) {
    mixergroup(m[1].charAt(0).toUpperCase() + m[1].slice(1)).mute = true;
    mixersync();
    return true;
  }
  m = text.match(/play\s+sound\s+(.+?)\s+on\s+(\w+)/i);
  if (m) {
    mixerplay(m[1].trim(), m[2].trim(), {});
    return true;
  }
  m = text.match(/paint\s+tile\s+(\d+)\s+at\s+(-?\d+),(-?\d+)/i);
  if (m) {
    var tm = null;
    var list = tilemapnodes();
    tm = list[0] || null;
    if (tm) {
      var arr = tilearray(tm);
      var d4 = tiledata(tm);
      var idx = (+m[3]) * d4.cols + (+m[2]);
      if (idx >= 0 && idx < arr.length) {
        arr[idx] = +m[1];
        tilearrayset(tm, arr);
        commit("tilepaint");
      }
    }
    return true;
  }
  m = text.match(/impulse\s+(\w+)/i);
  if (m) {
    var body = physbyid(m[1]);
    if (body) body.vel = [body.vel[0], 9, body.vel[2]];
    return true;
  }
  return false;
}
