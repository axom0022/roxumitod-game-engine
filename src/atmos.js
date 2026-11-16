var fxsky = {
  sunel: 38,
  sunaz: 135,
  suncolor: "#fff3d6",
  skylight: "#bcd8ff",
  skyintensity: 0.6,
  fog: 0.0,
  fogcolor: "#cfe4f7",
  clouds: 0,
  cloudh: 26,
  stars: 0,
  water: 0,
  waterv: 0.35,
  watercol: "#3a86c8"
};

function fxenv() {
  app.scene.env = app.scene.env || {};
  var e = app.scene.env;
  for (var k in fxsky) {
    if (e[k] === undefined) e[k] = fxsky[k];
  }
  return e;
}

function ppdef() {
  return {
    exposure: 1,
    bloom: 0,
    vignette: 0.12,
    grain: 0,
    chroma: 0,
    sat: 1,
    contrast: 1,
    temp: 0,
    dof: 0,
    motion: 0
  };
}

function ppget() {
  app.scene.env = app.scene.env || {};
  app.scene.env.pp = app.scene.env.pp || {};
  var d = ppdef();
  for (var k in d) {
    if (app.scene.env.pp[k] === undefined) app.scene.env.pp[k] = d[k];
  }
  return app.scene.env.pp;
}

function sunvec() {
  var e = fxenv();
  var el = e.sunel * Math.PI / 180;
  var az = e.sunaz * Math.PI / 180;
  return [Math.cos(el) * Math.sin(az) * 14, Math.max(0.6, Math.sin(el) * 14), Math.cos(el) * Math.cos(az) * 14];
}

function fxapply() {
  var e = fxenv();
  var v = view.main;
  if (!v) return;
  var vec = sunvec();
  if (v.sun && v.sun.position) v.sun.position.set(vec[0], vec[1], vec[2]);
  if (v.sun && v.sun.color && v.sun.color.set) v.sun.color.set(e.suncolor);
  if (v.ambient && v.ambient.color && v.ambient.color.set) v.ambient.color.set(e.skylight);
  if (v.scene) {
    var lib = window.THREE;
    if (e.fog > 0.001 && lib && lib.Fog) {
      if (!v.scene.fog) v.scene.fog = new lib.Fog(e.fogcolor, 8, 90);
      v.scene.fog.color.set(e.fogcolor);
      v.scene.fog.near = 90 - e.fog * 84;
      v.scene.fog.far = 200 - e.fog * 150;
    } else if (v.scene.fog) {
      v.scene.fog = null;
    }
    fxclouds(v);
    fxwater(v);
    var cs = app.camstate || (typeof camerastate === "function" ? camerastate() : null);
    if (v.cloudroot && cs) v.cloudroot.position.set(cs.eye[0], 0, cs.eye[2]);
  }
  ppapply();
}

function fxclouds(v) {
  var e = fxenv();
  var lib = window.THREE;
  if (!lib || !lib.CanvasTexture) return;
  if (e.clouds <= 0.001) {
    if (v.cloudroot) v.cloudroot.visible = false;
    return;
  }
  if (!v.cloudroot) {
    v.cloudroot = new lib.Group();
    v.scene.add(v.cloudroot);
    for (var i = 0; i < 16; i++) {
      var c = document.createElement("canvas");
      c.width = 128;
      c.height = 128;
      var g = c.getContext("2d");
      var grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      grd.addColorStop(0, "rgba(255,255,255,0.95)");
      grd.addColorStop(0.55, "rgba(255,255,255,0.55)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      var tex = new lib.CanvasTexture(c);
      var mat = new lib.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true, opacity: 0.9, fog: false });
      var geo = new lib.PlaneGeometry(1, 1);
      var m = new lib.Mesh(geo, mat);
      m.userData.seed = i;
      v.cloudroot.add(m);
    }
  }
  v.cloudroot.visible = true;
  var n = Math.round(18 * Math.min(1, e.clouds));
  v.cloudroot.children.forEach(function (m, i) {
    m.visible = i < n;
    var s = 26 + (i % 5) * 9;
    var ang = (i / 18) * Math.PI * 2 + (i % 3) * 0.21;
    var rad = 46 + (i % 4) * 9;
    m.scale.set(s * 2.1, s * 1.1, 1);
    m.position.set(Math.cos(ang) * rad, e.cloudh + ((i * 7) % 14) - 3, Math.sin(ang) * rad);
    m.rotation.set(0, -ang + Math.PI / 2, (i % 5) * 0.12);
    m.material.opacity = 0.5 + (i % 4) * 0.13;
  });
}

function fxwater(v) {
  var e = fxenv();
  var lib = window.THREE;
  if (!lib) return;
  if (e.water <= 0.001) {
    if (v.watermesh) v.watermesh.visible = false;
    return;
  }
  if (!v.watermesh) {
    var geo = new lib.PlaneGeometry(400, 400, 40, 40);
    var mat = new lib.MeshLambertMaterial({ color: e.watercol, transparent: true, opacity: 0.82 });
    v.watermesh = new lib.Mesh(geo, mat);
    v.watermesh.rotation.x = -Math.PI / 2;
    v.scene.add(v.watermesh);
  }
  v.watermesh.visible = true;
  v.watermesh.position.y = -0.35 + (1 - e.water) * 0.0;
  v.watermesh.material.color.set(e.watercol);
}

function fxwatertick(t) {
  var v = view.main;
  var e = fxenv();
  if (!v || !v.watermesh || !v.watermesh.visible) return;
  var pos = v.watermesh.geometry.attributes.position;
  var amp = e.waterv * 0.5;
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i);
    var y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 0.22 + t * 1.7) * amp + Math.cos(y * 0.19 - t * 1.2) * amp);
  }
  pos.needsUpdate = true;
  v.watermesh.geometry.computeVertexNormals();
}

function fxstars() {
  var e = fxenv();
  if (e.stars <= 0.001) return;
  var v = view.main;
  var lib = window.THREE;
  if (!v || !lib) return;
  if (!v.starfield) {
    var g = new lib.BufferGeometry();
    var arr = [];
    for (var i = 0; i < 600; i++) {
      var th = Math.random() * Math.PI * 2;
      var ph = Math.random() * 0.9;
      arr.push(Math.cos(th) * Math.cos(ph) * 260, Math.sin(ph) * 260 + 20, Math.sin(th) * Math.cos(ph) * 260);
    }
    g.setAttribute("position", new lib.Float32BufferAttribute(arr, 3));
    var m = new lib.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: true });
    v.starfield = new lib.Points(g, m);
    v.scene.add(v.starfield);
  }
  v.starfield.visible = true;
  v.starfield.material.opacity = e.stars;
  v.starfield.material.transparent = true;
}

function ppapply() {
  var pp = ppget();
  var v = view.main;
  if (v && v.renderer) {
    if (v.renderer.toneMappingExposure !== undefined) v.renderer.toneMappingExposure = Math.max(0.05, pp.exposure);
  }
  var cv = qs("#maincanvas");
  if (cv) {
    var fl = [];
    if (pp.sat !== 1) fl.push("saturate(" + pp.sat.toFixed(2) + ")");
    if (pp.contrast !== 1) fl.push("contrast(" + pp.contrast.toFixed(2) + ")");
    if (pp.temp > 0) fl.push("sepia(" + (pp.temp * 0.3).toFixed(2) + ")");
    if (pp.temp < 0) fl.push("hue-rotate(" + Math.round(pp.temp * -16) + "deg)");
    cv.style.filter = fl.length ? fl.join(" ") : "";
  }
  var ov = qs("#ppoverlay");
  if (ov) {
    var vig = Math.max(0, Math.min(1, pp.vignette));
    ov.style.background = vig > 0.001
      ? "radial-gradient(ellipse at center, rgba(0,0,0,0) " + Math.round(46 + (1 - vig) * 30) + "%, rgba(0,0,0," + (vig * 0.85).toFixed(2) + ") 100%)"
      : "none";
  }
  var gr = qs("#ppgrain");
  if (gr) gr.style.opacity = Math.max(0, Math.min(1, pp.grain)).toFixed(2);
  var bl = qs("#ppbloom");
  if (bl) bl.style.opacity = Math.max(0, Math.min(1, pp.bloom)).toFixed(2);
  var ch = qs("#ppchroma");
  if (ch) ch.style.opacity = Math.max(0, Math.min(1, pp.chroma)).toFixed(2);
  var mo = qs("#pptrail");
  if (mo) mo.style.opacity = (pp.motion * 0.55).toFixed(2);
}

function ppmount() {
  var wrap = qs("#stagewrap");
  if (!wrap || qs("#ppoverlay")) return;
  var d = document.createElement("div");
  d.id = "pplayer";
  d.innerHTML =
    '<canvas id="ppbloom"></canvas>' +
    '<canvas id="pptrail"></canvas>' +
    '<div id="ppchroma"></div>' +
    '<div id="ppgrain"></div>' +
    '<div id="ppoverlay"></div>';
  wrap.appendChild(d);
  var cv = qs("#maincanvas");
  if (cv && cv.parentNode) cv.parentNode.insertBefore(d, cv.nextSibling);
  ppapply();
}

function pptick() {
  if (!view.main || !view.main.renderer) return;
  var pp = ppget();
  var src = qs("#maincanvas");
  if (!src) return;
  var bl = qs("#ppbloom");
  if (bl && pp.bloom > 0.001) {
    var w = 160;
    var h = Math.max(1, Math.round(w * src.height / Math.max(1, src.width)));
    if (bl.width !== w || bl.height !== h) {
      bl.width = w;
      bl.height = h;
    }
    var g = bl.getContext("2d");
    try {
      g.drawImage(src, 0, 0, w, h);
    } catch (e) {}
    bl.style.filter = "blur(" + Math.round(2 + pp.bloom * 7) + "px) brightness(1.3)";
    bl.style.mixBlendMode = "screen";
  }
  var tr = qs("#pptrail");
  if (tr && pp.motion > 0.001) {
    if (!tr.width) {
      tr.width = 160;
      tr.height = Math.max(1, Math.round(160 * src.height / Math.max(1, src.width)));
    }
    var tg = tr.getContext("2d");
    tg.globalCompositeOperation = "copy";
    tg.globalAlpha = 0.55;
    tg.drawImage(src, 0, 0, tr.width, tr.height);
    tg.globalAlpha = 1;
    tr.style.filter = "blur(2px)";
  }
}

function fxname(n) {
  return n === undefined ? "" : String(n);
}

function fxbind(root) {
  if (!root) return;
  root.querySelectorAll("[data-fx]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var f = inp.getAttribute("data-fx");
      var v = inp.type === "checkbox" ? inp.checked : inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
      if (f.indexOf("pp.") === 0) ppget()[f.slice(3)] = v;
      else fxenv()[f] = v;
      root.querySelectorAll('[data-fx="' + f + '"]').forEach(function (o) {
        if (o === inp) return;
        if (o.type === "checkbox") o.checked = !!v;
        else o.value = inp.value;
      });
      if (f === "stars") {
        var vv = view.main;
        if (vv && vv.starfield) {
          vv.scene.remove(vv.starfield);
          vv.starfield = null;
        }
      }
      fxapply();
      fxstars();
      if (f === "clouds" || f === "cloudh" || f === "water" || f === "watercol") fxapply();
    });
  });
  root.querySelectorAll("[data-fxact]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var a = btn.getAttribute("data-fxact");
      if (a === "preset:day") fxpreset("day");
      else if (a === "preset:dusk") fxpreset("dusk");
      else if (a === "preset:night") fxpreset("night");
      else if (a === "preset:storm") fxpreset("storm");
      else if (a === "preset:none") fxpreset("none");
      else if (a === "bake") fxbake();
      var body = qs(".modalsky");
      if (body) refreshfx(body);
    });
  });
}

function fxpreset(which) {
  var e = fxenv();
  var pp = ppget();
  if (which === "day") {
    e.sunel = 52;
    e.sunaz = 130;
    e.suncolor = "#fff6e0";
    e.skylight = "#cfe4ff";
    e.fog = 0.16;
    e.fogcolor = "#d8ecff";
    e.clouds = 0.5;
    e.stars = 0;
    e.color = "#9fd0f5";
    pp.exposure = 1;
    pp.sat = 1.05;
  } else if (which === "dusk") {
    e.sunel = 6;
    e.sunaz = 250;
    e.suncolor = "#ffab5e";
    e.skylight = "#7c6ea8";
    e.fog = 0.42;
    e.fogcolor = "#e2a473";
    e.clouds = 0.75;
    e.stars = 0.1;
    e.color = "#f0a86a";
    pp.exposure = 1.1;
    pp.sat = 1.15;
    pp.temp = 0.4;
  } else if (which === "night") {
    e.sunel = 62;
    e.sunaz = 300;
    e.suncolor = "#9db4ff";
    e.skylight = "#28324d";
    e.strength = 0.24;
    e.fog = 0.3;
    e.fogcolor = "#1a2338";
    e.clouds = 0.3;
    e.stars = 1;
    e.color = "#0b1020";
    pp.exposure = 1.25;
    pp.sat = 0.9;
    pp.vignette = 0.4;
  } else if (which === "storm") {
    e.sunel = 40;
    e.sunaz = 100;
    e.suncolor = "#c9d2dd";
    e.skylight = "#6a7484";
    e.fog = 0.45;
    e.fogcolor = "#9aa6b4";
    e.clouds = 1;
    e.stars = 0;
    e.color = "#7f8b99";
    e.strength = 0.45;
    pp.exposure = 0.95;
    pp.sat = 0.8;
    pp.chroma = 0.2;
  } else {
    e.fog = 0;
    e.clouds = 0;
    e.stars = 0;
    e.water = 0;
    pp.exposure = 1;
    pp.sat = 1;
    pp.contrast = 1;
    pp.temp = 0;
    pp.vignette = 0;
  }
  commit("atmosphere " + which);
  fxapply();
  fxstars();
  toast("Atmosphere preset: " + which, "ok");
}

function refreshfx(root) {
  if (!root) return;
  root.querySelectorAll("[data-fx]").forEach(function (inp) {
    var f = inp.getAttribute("data-fx");
    var v = f.indexOf("pp.") === 0 ? ppget()[f.slice(3)] : fxenv()[f];
    if (v === undefined) return;
    if (inp.type === "checkbox") inp.checked = !!v;
    else inp.value = v;
  });
}

function fxbake() {
  var nodes = [];
  walk(app.scene.objects, function (n) {
    if (n.type === "sun" || n.type === "camera" || n.type === "empty") return;
    if (n.visible === false) return;
    nodes.push(n);
  });
  if (!nodes.length) {
    toast("Nothing to bake");
    return;
  }
  var e = fxenv();
  var sv = vnorm(sunvec());
  var boxes = nodes.map(function (n) {
    var w = worldpos(n);
    var s = nodesize(n);
    return { node: n, min: [w[0] - s[0] / 2, w[1] - s[1] / 2, w[2] - s[2] / 2], max: [w[0] + s[0] / 2, w[1] + s[1] / 2, w[2] + s[2] / 2] };
  });
  var t0 = performance.now();
  boxes.forEach(function (b) {
    var w = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
    var hit = 0;
    var samples = 6;
    for (var i = 0; i < samples; i++) {
      var o = b.min.slice();
      o[0] = b.min[0] + (b.max[0] - b.min[0]) * ((i % 2) ? 0.75 : 0.25);
      o[2] = b.min[2] + (b.max[2] - b.min[2]) * ((i % 3) ? 0.7 : 0.3);
      o[1] = b.max[1] + 0.05;
      var r = raybox(o, sv, [b.min[0] - 40, b.min[1] - 40, b.min[2] - 40], [b.max[0] + 40, b.max[1] + 40, b.max[2] + 40]);
      var blocked = false;
      for (var j = 0; j < boxes.length; j++) {
        if (boxes[j] === b) continue;
        var ob = boxes[j];
        var hb = raybox(o, sv, ob.min, ob.max);
        if (hb && hb.t > 0.02 && hb.t < 30) {
          blocked = true;
          break;
        }
      }
      if (blocked) hit++;
    }
    var vis = 1 - hit / samples;
    var sky = Math.max(0, Math.min(1, vis));
    b.node.bakelight = 0.55 + sky * 0.45;
    b.node.bakesky = sky;
    if (b.node.pos[1] < 0.1) b.node.bakelight *= 0.82;
    void w;
  });
  app.scene.env.baked = true;
  app.scene.env.baketime = performance.now() - t0;
  app.scene.env.bakecount = nodes.length;
  commit("bake lighting");
  refreshall();
  toast("Lighting built · " + nodes.length + " actors · " + Math.round(app.scene.env.baketime) + " ms", "ok");
}

function fxunbake() {
  walk(app.scene.objects, function (n) {
    delete n.bakelight;
    delete n.bakesky;
  });
  app.scene.env.baked = false;
  commit("clear lighting");
  refreshall();
  toast("Lighting data cleared");
}

function skypanel() {
  var e = fxenv();
  var pp = ppget();
  var body = '<div class="modalsky">';
  body += sgsec("Sky Atmosphere", "Sun, sky light and aerial perspective", 
    sgrow("Sun elevation", '<input class="inp num" type="range" min="-10" max="90" step="1" value="' + e.sunel + '" data-fx="sunel">') +
    sgrow("Sun azimuth", '<input class="inp num" type="range" min="0" max="360" step="1" value="' + e.sunaz + '" data-fx="sunaz">') +
    sgrow("Sun color", '<input class="inp swatch" type="color" value="' + e.suncolor + '" data-fx="suncolor">') +
    sgrow("Sky light color", '<input class="inp swatch" type="color" value="' + e.skylight + '" data-fx="skylight">') +
    sgrow("Sky intensity", '<input class="inp num" type="range" min="0" max="2" step="0.05" value="' + e.skyintensity + '" data-fx="skyintensity">'));
  body += sgsec("Exponential Height Fog", "Atmospheric scattering and depth haze",
    sgrow("Fog density", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + e.fog + '" data-fx="fog">') +
    sgrow("Fog color", '<input class="inp swatch" type="color" value="' + e.fogcolor + '" data-fx="fogcolor">'));
  body += sgsec("Volumetric Clouds", "Sprite volume layer",
    sgrow("Coverage", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + e.clouds + '" data-fx="clouds">') +
    sgrow("Altitude", '<input class="inp num" type="range" min="8" max="60" step="1" value="' + e.cloudh + '" data-fx="cloudh">') +
    sgrow("Star density", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + e.stars + '" data-fx="stars">'));
  body += sgsec("Water", "Single-layer water body with gerstner waves",
    sgrow("Coverage", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + e.water + '" data-fx="water">') +
    sgrow("Wave amplitude", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + e.waterv + '" data-fx="waterv">') +
    sgrow("Water color", '<input class="inp swatch" type="color" value="' + e.watercol + '" data-fx="watercol">'));
  body += sgsec("Post Process Volume", "Camera grading and screen effects",
    sgrow("Exposure", '<input class="inp num" type="range" min="0.2" max="2.5" step="0.01" value="' + pp.exposure + '" data-fx="pp.exposure">') +
    sgrow("Bloom", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + pp.bloom + '" data-fx="pp.bloom">') +
    sgrow("Vignette", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + pp.vignette + '" data-fx="pp.vignette">') +
    sgrow("Film grain", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + pp.grain + '" data-fx="pp.grain">') +
    sgrow("Chromatic aberration", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + pp.chroma + '" data-fx="pp.chroma">') +
    sgrow("Saturation", '<input class="inp num" type="range" min="0" max="2" step="0.01" value="' + pp.sat + '" data-fx="pp.sat">') +
    sgrow("Contrast", '<input class="inp num" type="range" min="0.5" max="2" step="0.01" value="' + pp.contrast + '" data-fx="pp.contrast">') +
    sgrow("Temperature", '<input class="inp num" type="range" min="-1" max="1" step="0.01" value="' + pp.temp + '" data-fx="pp.temp">') +
    sgrow("Motion blur", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + pp.motion + '" data-fx="pp.motion">'));
  body += sgsec("Global Illumination Bake", "Lightmass GPU - sun occlusion into actor shading",
    '<div class="sgnote">' + (app.scene.env.baked ? "Built · " + app.scene.env.bakecount + " actors · " + Math.round(app.scene.env.baketime || 0) + " ms" : "Preview - lighting not built") + "</div>" +
    '<div class="sgbtns"><button class="btn" data-fxact="bake">' + ic("sun", "ico-sm") + " Build lighting</button>" +
    '<button class="btn ghost" data-fxact="unbake">Clear</button></div>');
  body += '<div class="sgbtns presets"><button class="btn ghost" data-fxact="preset:day">Day</button><button class="btn ghost" data-fxact="preset:dusk">Dusk</button><button class="btn ghost" data-fxact="preset:night">Night</button><button class="btn ghost" data-fxact="preset:storm">Storm</button><button class="btn ghost" data-fxact="preset:none">Reset</button></div>';
  body += "</div>";
  openmodal({
    title: "Sky Atmosphere, Fog & Post Process",
    icon: "sun",
    width: "wide",
    body: body,
    onmount: function (m) {
      fxbind(m);
      m.querySelectorAll("[data-fxact]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.getAttribute("data-fxact") === "unbake") fxunbake();
        });
      });
    }
  });
}

function fxtick(dt, t) {
  fxwatertick(t || 0);
  pptick();
  fxstars();
}

function fxboot() {
  fxenv();
  ppget();
  fxapply();
  fxstars();
}
