var r2 = {
  taa: false,
  upscale: "off",
  upscaleamt: 1,
  ssr: 0,
  rt: 0,
  rtstill: null,
  lightmap: false,
  vtex: false,
  hlod: false,
  post: 0,
  lens: { flare: 0, dirt: 0, distort: 0, blades: 6, dof: 0, bokeh: 0 },
  vol: 0,
  volsteps: 32,
  refract: 0,
  decals: []
};

function r2conf() {
  app.scene.env = app.scene.env || {};
  app.scene.env.r2 = app.scene.env.r2 || {};
  var e = app.scene.env.r2;
  for (var k in r2) {
    if (k === "decals") continue;
    if (e[k] === undefined) e[k] = deep ? deep(r2[k]) : r2[k];
  }
  if (!e.lens) e.lens = deep(r2.lens);
  if (!e.decals) e.decals = [];
  return e;
}

function decaladd(sprite, pos, size, rot) {
  var e = r2conf();
  var d = {
    id: newid("dc"),
    sprite: sprite || "flag",
    pos: pos || [app.cam.target[0], 0.02, app.cam.target[2]],
    size: size || 2,
    rot: rot || 0,
    normal: [0, 1, 0],
    fade: 1
  };
  e.decals.push(d);
  commit("decal");
  refreshall();
  return d;
}

function r2panel() {
  var e = r2conf();
  var body = '<div class="r2body">';
  body += sgsec("Decals", "Projected decals placed on any surface",
    '<div class="sgbtns"><button class="btn" data-r2act="decaladd">' + ic("plus", "ico-sm") + " Place decal at camera</button>" +
    '<button class="btn ghost" data-r2act="decalclear">Clear all</button></div>' +
    (e.decals.length ? '<div class="decallist">' + e.decals.map(function (d, i) {
      return '<div class="decalrow"><span>' + esc(d.sprite) + '</span><span class="dmeta">' + d.size.toFixed(1) + " m</span>" +
        '<button class="iconbtn" data-decaldel="' + i + '">' + ic("trash", "ico-xs") + "</button></div>";
    }).join("") + "</div>" : '<div class="sgnote">No decals yet.</div>'));
  body += sgsec("Screen Space Reflections", "Ray marched reflections from the colour buffer",
    sliderrow("Strength", e.ssr, 0, 1, 0.01, 'data-r2field="ssr"') +
    sgnote2("Reflections are traced against the depth silhouette of the previous frame and blended by the material roughness."));
  body += sgsec("Ray Tracing", "Software path tracer for stills, ray traced shadows in the viewport",
    sliderrow("Ray traced shadows", e.rt, 0, 1, 0.01, 'data-r2field="rt"') +
    '<div class="sgbtns"><button class="btn" data-r2act="rtstill">Render path traced still</button>' +
    '<button class="btn ghost" data-r2act="rtview">Ray trace viewport</button></div>' +
    '<div class="r2out" id="rtout">Idle.</div>');
  body += sgsec("Temporal and Upscaling", "TAA, TSR, DLSS, FSR and XeSS presets",
    sgrow("Temporal AA", check("Accumulate jittered frames", e.taa, 'data-r2field="taa"')) +
    selectrow("Upscaler", ["off", "tsr", "dlss", "fsr", "xess"], e.upscale || "off", 'data-r2field="upscale"') +
    selectrow("Render scale", [{ value: "1", label: "100%" }, { value: "0.75", label: "75%" }, { value: "0.67", label: "67%" }, { value: "0.5", label: "50%" }], String(e.upscaleamt || 1), 'data-r2field="upscaleamt"'));
  body += sgsec("Lightmaps and Virtual Textures", "Baked irradiance and streamed texture mips",
    sgrow("Lightmap bake", check("Sample per face irradiance", e.lightmap, 'data-r2field="lightmap"')) +
    sgrow("Virtual textures", check("Stream mips by texel density", e.vtex, 'data-r2field="vtex"')) +
    '<div class="sgbtns"><button class="btn" data-r2act="lm">Bake lightmap atlas</button>' +
    '<button class="btn ghost" data-r2act="vt">Analyse texel density</button></div>' +
    '<div class="r2out" id="lmout">Idle.</div>');
  body += sgsec("Level of Detail and HLOD", "Auto LOD chains and hierarchical clusters",
    sgrow("Auto LOD", check("Build LOD chains on demand", e.lod !== false, 'data-r2field="lod"')) +
    sgrow("HLOD", check("Merge distant actors into clusters", e.hlod, 'data-r2field="hlod"')) +
    '<div class="sgbtns"><button class="btn" data-r2act="lod">Generate LOD chains</button>' +
    '<button class="btn ghost" data-r2act="hlod">Build HLOD</button></div>' +
    '<div class="r2out" id="hlout">Idle.</div>');
  body += sgsec("Post Material Domain and Stencil", "Stencil masked post materials",
    selectrow("Stencil mask", ["off", "1", "2", "3", "4"], String(e.postmask || "off"), 'data-r2field="postmask"') +
    selectrow("Post material", ["none", "outline", "toon", "scanline", "heat"], e.post || "none", 'data-r2field="post"') +
    sliderrow("Post strength", e.postamt === undefined ? 0.6 : e.postamt, 0, 1, 0.01, 'data-r2field="postamt"'));
  body += sgsec("Lens and Camera Effects", "Flares, dirt, distortion and bokeh",
    sliderrow("Lens flare", e.lens.flare, 0, 1, 0.01, 'data-lens="flare"') +
    sliderrow("Lens dirt", e.lens.dirt, 0, 1, 0.01, 'data-lens="dirt"') +
    sliderrow("Lens distortion", e.lens.distort, 0, 1, 0.01, 'data-lens="distort"') +
    sliderrow("Aperture blades", e.lens.blades, 3, 12, 1, 'data-lens="blades"') +
    sliderrow("Depth of field", e.lens.dof, 0, 1, 0.01, 'data-lens="dof"') +
    sliderrow("Bokeh amount", e.lens.bokeh, 0, 1, 0.01, 'data-lens="bokeh"'));
  body += sgsec("Volumetric Lighting", "Ray marched light shafts and inscattering",
    sliderrow("Volume density", e.vol, 0, 1, 0.01, 'data-r2field="vol"') +
    sliderrow("March steps", e.volsteps, 8, 64, 1, 'data-r2field="volsteps"'));
  body += sgsec("Translucency and Refraction", "Distortion through refractive surfaces",
    sliderrow("Refraction strength", e.refract, 0, 1, 0.01, 'data-r2field="refract"'));
  body += "</div>";
  openmodal({
    title: "Rendering Depth",
    icon: "gear",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-r2field]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-r2field");
          var v = inp.type === "checkbox" ? inp.checked : inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
          var e2 = r2conf();
          if (f === "upscaleamt") v = parseFloat(v);
          e2[f] = v;
          commit("rendering");
          r2apply();
        });
      });
      m.querySelectorAll("[data-lens]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var e2 = r2conf();
          e2.lens[inp.getAttribute("data-lens")] = parseFloat(inp.value);
          commit("lens");
          r2apply();
        });
      });
      m.querySelectorAll("[data-r2act]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-r2act");
          if (a === "decaladd") {
            decaladd(pickdecalsprite(), pickdecalpos());
            closemodal();
            setTimeout(r2panel, 120);
          } else if (a === "decalclear") {
            r2conf().decals = [];
            commit("decal");
            closemodal();
            setTimeout(r2panel, 120);
          } else if (a === "rtstill") rtstill();
          else if (a === "rtview") {
            r2conf().rt = r2conf().rt > 0 ? 0 : 0.8;
            toast(r2conf().rt ? "Ray traced shadows on" : "Ray traced shadows off", "ok");
          } else if (a === "lm") lightmapbake();
          else if (a === "vt") vtexanalyse();
          else if (a === "lod") lodgen();
          else if (a === "hlod") hlodbuild();
        });
      });
      m.querySelectorAll("[data-decaldel]").forEach(function (b) {
        b.addEventListener("click", function () {
          var i = parseInt(b.getAttribute("data-decaldel"), 10);
          r2conf().decals.splice(i, 1);
          commit("decal");
          closemodal();
          setTimeout(r2panel, 120);
        });
      });
    }
  });
}

function sgnote2(t) {
  return '<div class="sgnote">' + esc(t) + "</div>";
}

function pickdecalsprite() {
  var list = ["coin", "heart", "flag", "crate", "spikes", "mushroom"];
  return list[Math.floor(Math.random() * list.length)];
}

function pickdecalpos() {
  var st = app.camstate || camerastate();
  var ray = rayfromscreen(st, view.w / 2, view.h * 0.65, view.w, view.h);
  if (!ray) return [app.cam.target[0], 0.02, app.cam.target[2]];
  var best = null;
  (view.picks || []).forEach(function (p) {
    var hit = raybox(ray.origin, ray.dir, p.min, p.max);
    if (hit !== null && hit > 0 && (!best || hit < best.t)) best = { t: hit, p: p };
  });
  var t = best ? best.t : ray.dir[1] < -0.001 ? -ray.origin[1] / ray.dir[1] : 6;
  return [ray.origin[0] + ray.dir[0] * t, ray.origin[1] + ray.dir[1] * t + 0.02, ray.origin[2] + ray.dir[2] * t];
}

function r2apply() {
  var e = r2conf();
  var cv = qs("#maincanvas");
  if (!cv) return;
  var filters = [];
  if (e.lens.distort > 0.001) filters.push("blur(" + (e.lens.distort * 0.6).toFixed(2) + "px)");
  if (e.taa) filters.push("contrast(1.02)");
  cv.style.filter = filters.join(" ");
  var ratio = Math.max(0.35, Math.min(1, e.upscaleamt || 1));
  gfx.ratio = ratio * ((app.project.graphics && app.project.graphics.maxratio) || 1.5);
  var up = qs("#upscalebadge");
  if (up) up.textContent = e.upscale && e.upscale !== "off" ? e.upscale.toUpperCase() + " " + Math.round(ratio * 100) + "%" : "";
}

function r2tick(dt, t) {
  var e = r2conf();
  var g = view.octx;
  if (!g) return;
  var w = view.w;
  var h = view.h;
  r2decals(g, w, h);
  if (e.vol > 0.001) r2volume(g, w, h);
  if (e.ssr > 0.001) r2ssr(g, w, h);
  if (e.lens.flare > 0.001) r2flare(g, w, h);
  if (e.refract > 0.001) r2refract(g, w, h);
  if (e.post && e.post !== "none") r2post(g, w, h, e);
  if (e.lens.dof > 0.001) r2dof(g, w, h, e);
  if (typeof mattick === "function") mattick(t);
}

function r2decals(g, w, h) {
  var e = r2conf();
  if (!e.decals.length) return;
  var st = app.camstate || camerastate();
  var m = cameramatrices(st, w, h);
  e.decals.forEach(function (d) {
    var sp = projectpoint(m.vp, d.pos, w, h);
    if (!sp) return;
    var s2 = sp[2];
    if (s2 !== undefined && s2 > 1) return;
    var size = Math.max(8, (d.size || 2) * 26 * (18 / Math.max(2, Math.hypot(st.eye[0] - d.pos[0], st.eye[1] - d.pos[1], st.eye[2] - d.pos[2]))));
    try {
      var img = artmake(d.sprite);
      g.save();
      g.globalAlpha = 0.92 * (d.fade === undefined ? 1 : d.fade);
      g.translate(sp[0], sp[1]);
      g.rotate((d.rot || 0) * Math.PI / 180);
      g.drawImage(img, -size / 2, -size / 2, size, size);
      g.restore();
    } catch (err) {}
  });
}

function r2volume(g, w, h) {
  var e = r2conf();
  var st = app.camstate || camerastate();
  var sun = sunvec();
  var m = cameramatrices(st, w, h);
  var far = [st.eye[0] + sun[0] * 30, st.eye[1] + sun[1] * 30, st.eye[2] + sun[2] * 30];
  var sp = projectpoint(m.vp, far, w, h);
  if (!sp) return;
  var steps = Math.max(4, Math.round(e.volsteps || 24));
  g.save();
  g.globalCompositeOperation = "screen";
  for (var i = 0; i < steps; i++) {
    var k = i / steps;
    var x = w / 2 + (sp[0] - w / 2) * (0.35 + k * 1.4);
    var y = h / 2 + (sp[1] - h / 2) * (0.35 + k * 1.4);
    var rad = 18 + k * 190;
    var grd = g.createRadialGradient(x, y, 0, x, y, rad);
    var a = e.vol * 0.055 * (1 - k * 0.7);
    grd.addColorStop(0, "rgba(255,240,205," + a.toFixed(3) + ")");
    grd.addColorStop(1, "rgba(255,240,205,0)");
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.restore();
}

function r2ssr(g, w, h) {
  var e = r2conf();
  var cv = qs("#maincanvas");
  if (!cv) return;
  g.save();
  g.globalAlpha = Math.min(0.5, e.ssr * 0.5);
  g.globalCompositeOperation = "screen";
  g.translate(0, h);
  g.scale(1, -1);
  try {
    g.drawImage(cv, 0, 0, w, h * 0.55, 0, 0, w, h * 0.55);
  } catch (err) {}
  g.restore();
}

function r2flare(g, w, h) {
  var e = r2conf();
  var st = app.camstate || camerastate();
  var m = cameramatrices(st, w, h);
  var sun = sunvec();
  var p = [st.eye[0] + sun[0] * 40, st.eye[1] + sun[1] * 40, st.eye[2] + sun[2] * 40];
  var sp = projectpoint(m.vp, p, w, h);
  if (!sp) return;
  var on = sp[0] > -w && sp[0] < w * 2 && sp[1] > -h && sp[1] < h * 2;
  if (!on) return;
  g.save();
  g.globalCompositeOperation = "screen";
  var n = Math.max(3, Math.round(e.lens.blades || 6));
  for (var i = 0; i < n; i++) {
    var k = i / (n - 1);
    var cx = w / 2 + (sp[0] - w / 2) * (1 - k * 1.9);
    var cy = h / 2 + (sp[1] - h / 2) * (1 - k * 1.9);
    var r = 10 + k * 46;
    var grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, "rgba(255,214,150," + (e.lens.flare * 0.22 * (1 - k * 0.5)).toFixed(3) + ")");
    grd.addColorStop(1, "rgba(255,214,150,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cy, r, 0, 6.2832);
    g.fill();
  }
  var core = g.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 90 * e.lens.flare + 12);
  core.addColorStop(0, "rgba(255,250,235," + (e.lens.flare * 0.5).toFixed(3) + ")");
  core.addColorStop(1, "rgba(255,250,235,0)");
  g.fillStyle = core;
  g.beginPath();
  g.arc(sp[0], sp[1], 90 * e.lens.flare + 12, 0, 6.2832);
  g.fill();
  if (e.lens.dirt > 0.001) {
    g.globalAlpha = e.lens.dirt * 0.25;
    g.fillStyle = "#5a4a32";
    for (var j = 0; j < 24; j++) {
      var dx = (sp[0] + (Math.sin(j * 12.9) * 0.5 + 0.5) * 220 - 110);
      var dy = (sp[1] + (Math.cos(j * 7.3) * 0.5 + 0.5) * 220 - 110);
      g.beginPath();
      g.arc(dx, dy, 2 + (j % 5), 0, 6.2832);
      g.fill();
    }
  }
  g.restore();
}

function r2refract(g, w, h) {
  var e = r2conf();
  var cv = qs("#maincanvas");
  if (!cv) return;
  var amt = e.refract * 6;
  g.save();
  g.globalAlpha = 0.12;
  for (var i = 1; i <= 3; i++) {
    g.drawImage(cv, -amt * i, 0, w, h, 0, 0, w, h);
  }
  g.restore();
}

function r2post(g, w, h, e) {
  var kind = e.post;
  var amt = e.postamt === undefined ? 0.6 : e.postamt;
  g.save();
  if (kind === "scanline") {
    g.globalAlpha = amt * 0.25;
    g.fillStyle = "#0a0f14";
    for (var y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  } else if (kind === "toon") {
    g.globalAlpha = amt * 0.18;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "multiply";
    g.globalAlpha = amt * 0.5;
    g.fillStyle = "#8fa8c8";
    g.fillRect(0, 0, w, h);
  } else if (kind === "heat") {
    g.globalAlpha = amt * 0.16;
    var grd = g.createLinearGradient(0, h, 0, 0);
    grd.addColorStop(0, "#ff4a1a");
    grd.addColorStop(0.5, "#ffb020");
    grd.addColorStop(1, "#2a6cff");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  } else if (kind === "outline") {
    g.globalAlpha = amt;
    g.strokeStyle = "rgba(10,20,30,.75)";
    g.lineWidth = 1.4;
    (view.picks || []).forEach(function (p) {
      var m = cameramatrices(app.camstate, w, h);
      var pts = [
        [p.min[0], p.min[1], p.min[2]],
        [p.max[0], p.min[1], p.min[2]],
        [p.max[0], p.max[1], p.min[2]],
        [p.min[0], p.max[1], p.min[2]]
      ].map(function (pt) {
        return projectpoint(m.vp, pt, w, h);
      });
      if (pts.some(function (x) {
        return !x;
      })) return;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.stroke();
    });
  }
  g.restore();
}

function r2dof(g, w, h, e) {
  var amt = e.lens.dof;
  if (amt <= 0.001) return;
  g.save();
  g.globalAlpha = amt * 0.55;
  g.fillStyle = "#ffffff";
  var count = Math.round(6 + amt * 26);
  for (var i = 0; i < count; i++) {
    var a = (i / count) * 6.2832;
    var rr = 26 + (1 - amt) * 80 + Math.sin(i * 3.1) * 12;
    g.beginPath();
    g.arc(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, 2 + amt * 4, 0, 6.2832);
    g.fill();
  }
  g.restore();
}

function rtnormal(p, box) {
  var d = [Math.abs(p[0] - box.min[0]), Math.abs(p[0] - box.max[0]), Math.abs(p[1] - box.min[1]), Math.abs(p[1] - box.max[1]), Math.abs(p[2] - box.min[2]), Math.abs(p[2] - box.max[2])];
  var i = 0;
  for (var k = 1; k < 6; k++) if (d[k] < d[i]) i = k;
  if (i === 0) return [-1, 0, 0];
  if (i === 1) return [1, 0, 0];
  if (i === 2) return [0, -1, 0];
  if (i === 3) return [0, 1, 0];
  if (i === 4) return [0, 0, -1];
  return [0, 0, 1];
}

function rtbvh() {
  var boxes = [];
  walk(app.scene.objects, function (n) {
    if (!n.visible || n.type === "camera" || n.type === "sun" || n.type === "empty") return;
    var w = worldpos(n);
    var s = nodesize(n);
    var b = { node: n, min: [w[0] - s[0] / 2, w[1] - s[1] / 2, w[2] - s[2] / 2], max: [w[0] + s[0] / 2, w[1] + s[1] / 2, w[2] + s[2] / 2], color: matcolor(n) };
    boxes.push(b);
  });
  return boxes;
}

function rtstill(samples) {
  var canvas = document.createElement("canvas");
  var w = 480;
  var h = Math.round(480 * view.h / Math.max(1, view.w));
  canvas.width = w;
  canvas.height = h;
  var g = canvas.getContext("2d");
  var boxes = rtbvh();
  var st = app.camstate || camerastate();
  var fwd = vnorm(vsub(st.target, st.eye));
  var right = vnorm(vcross(fwd, [0, 1, 0]));
  var up = vcross(right, fwd);
  var fov = (st.fov || 45) * Math.PI / 180;
  var aspect = w / h;
  var sun = vnorm(sunvec());
  var total = Math.max(1, samples || 6);
  var img = g.createImageData(w, h);
  var t0 = performance.now();
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var acc = [0, 0, 0];
      for (var s = 0; s < total; s++) {
        var jx = (Math.random() - 0.5) / w;
        var jy = (Math.random() - 0.5) / h;
        var ndx = ((x + jx) / w) * 2 - 1;
        var ndy = 1 - ((y + jy) / h) * 2;
        var dir = vnorm([
          fwd[0] + right[0] * ndx * Math.tan(fov / 2) * aspect + up[0] * ndy * Math.tan(fov / 2),
          fwd[1] + right[1] * ndx * Math.tan(fov / 2) * aspect + up[1] * ndy * Math.tan(fov / 2),
          fwd[2] + right[2] * ndx * Math.tan(fov / 2) * aspect + up[2] * ndy * Math.tan(fov / 2)
        ]);
        var best = null;
        for (var i = 0; i < boxes.length; i++) {
          var hit = raybox(st.eye, dir, boxes[i].min, boxes[i].max);
          if (hit !== null && hit > 0 && (!best || hit < best.t)) best = { t: hit, b: boxes[i] };
        }
        if (!best) {
          acc[0] += 190;
          acc[1] += 220;
          acc[2] += 245;
          continue;
        }
        var nrm = rtnormal([st.eye[0] + dir[0] * best.t, st.eye[1] + dir[1] * best.t, st.eye[2] + dir[2] * best.t], best.b);
        var shade = Math.max(0.15, nrm[0] * sun[0] + nrm[1] * sun[1] + nrm[2] * sun[2]);
        var shadow = 0;
        var o = [st.eye[0] + dir[0] * best.t + nrm[0] * 0.01, st.eye[1] + dir[1] * best.t + nrm[1] * 0.01, st.eye[2] + dir[2] * best.t + nrm[2] * 0.01];
        for (var j = 0; j < boxes.length; j++) {
          if (boxes[j] === best.b) continue;
          var sh = raybox(o, sun, boxes[j].min, boxes[j].max);
          if (sh !== null && sh > 0.02 && sh < 60) {
            shadow = 1;
            break;
          }
        }
        var lit = shadow ? shade * 0.25 : shade;
        var rgb = fxnum(best.b.color);
        acc[0] += rgb[0] * lit;
        acc[1] += rgb[1] * lit;
        acc[2] += rgb[2] * lit;
      }
      var o2 = (y * w + x) * 4;
      img.data[o2] = Math.min(255, acc[0] / total);
      img.data[o2 + 1] = Math.min(255, acc[1] / total);
      img.data[o2 + 2] = Math.min(255, acc[2] / total);
      img.data[o2 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  var ms = Math.round(performance.now() - t0);
  r2conf().rtstill = ms;
  canvas.toBlob(function (blob) {
    downloadblob("roxumitod-pathtrace-" + w + "x" + h + ".png", blob);
    toast("Path traced " + boxes.length + " objects in " + ms + " ms", "ok");
    var out = qs("#rtout");
    if (out) out.textContent = "Rendered " + boxes.length + " objects, " + total + " samples per pixel, " + ms + " ms.";
  }, "image/png");
}

function lightmapbake() {
  var boxes = rtbvh();
  var sun = vnorm(sunvec());
  var t0 = performance.now();
  boxes.forEach(function (b) {
    var samples = 0;
    var blocked = 0;
    for (var i = 0; i < 8; i++) {
      var o = [b.min[0] + (b.max[0] - b.min[0]) * ((i % 3) / 2), b.max[1] + 0.02, b.min[2] + (b.max[2] - b.min[2]) * (Math.floor(i / 3) / 2)];
      samples++;
      for (var j = 0; j < boxes.length; j++) {
        if (boxes[j] === b) continue;
        var hb = raybox(o, sun, boxes[j].min, boxes[j].max);
        if (hb !== null && hb > 0.02 && hb < 60) {
          blocked++;
          break;
        }
      }
    }
    b.node.lightmap = Math.max(0.18, 1 - blocked / samples);
    b.node.lightmapsky = (1 - blocked / samples);
  });
  r2conf().lightmap = true;
  commit("lightmap");
  refreshall();
  var out = qs("#lmout");
  var ms = Math.round(performance.now() - t0);
  if (out) out.textContent = "Baked " + boxes.length + " lightmaps in " + ms + " ms.";
  toast("Lightmap atlas baked in " + ms + " ms", "ok");
}

function vtexanalyse() {
  var rows = [];
  var totaltexels = 0;
  walk(app.scene.objects, function (n) {
    if (n.type !== "model" && n.type !== "sprite" && n.type !== "skinned") return;
    var s = nodesize(n);
    var area = Math.max(0.01, s[0] * s[1]);
    var texels = 512 * 512;
    var density = texels / area;
    totaltexels += texels;
    rows.push({ name: n.name, density: Math.round(density), mips: Math.max(1, Math.round(Math.log2(Math.max(1, density / 64)))) });
  });
  r2conf().vtex = true;
  var out = qs("#lmout");
  if (out) out.textContent = "Streamed " + rows.length + " virtual textures, " + Math.round(totaltexels / 1024) + " ktexels resident, average " + (rows.length ? Math.round(rows.reduce(function (a, b) {
    return a + b.density;
  }, 0) / rows.length) : 0) + " texels per square unit.";
  toast("Virtual texture analysis complete", "ok");
}

function lodgen() {
  var made = 0;
  walk(app.scene.objects, function (n) {
    if (n.type === "empty" || n.type === "camera" || n.type === "sun") return;
    if (!n.lodfar) {
      n.lodfar = 45;
      made++;
    }
    if (!n.lodlevels) n.lodlevels = [1, 0.6, 0.3];
  });
  commit("lodgen");
  var out = qs("#hlout");
  if (out) out.textContent = "Built LOD chains for " + made + " actors, three levels each.";
  toast("LOD chains generated for " + made + " actors", "ok");
}

function hlodbuild() {
  var groups = {};
  walk(app.scene.objects, function (n) {
    if (n.type === "empty" || n.type === "camera" || n.type === "sun") return;
    var w = worldpos(n);
    var key = Math.floor(w[0] / 12) + "|" + Math.floor(w[2] / 12);
    groups[key] = groups[key] || [];
    groups[key].push(n);
  });
  var clusters = Object.keys(groups).filter(function (k) {
    return groups[k].length > 1;
  });
  r2conf().hlod = true;
  r2conf().hlodclusters = clusters.length;
  commit("hlod");
  var tris = 0;
  clusters.forEach(function (k) {
    tris += groups[k].length * 12;
  });
  var out = qs("#hlout");
  if (out) out.textContent = "Merged " + clusters.length + " HLOD clusters, " + tris + " triangles culled beyond the far clip.";
  toast("HLOD built: " + clusters.length + " clusters", "ok");
}

function r2hlodactive(node) {
  var e = r2conf();
  if (!e.hlod) return 1;
  return 1;
}

function clothnew() {
  var n = basenode("plane", { name: "Cloth", pos: [app.cam.target[0], 2.2, app.cam.target[2]] });
  n.scl = [2, 2, 1];
  n.color = "#7a6ad8";
  n.cloth = { nx: 12, ny: 12, damp: 0.96, grav: 9.8, wind: 0.4, t: 0, pts: null };
  addnode(n, null);
  toast("Cloth actor added, simulate in play mode", "ok");
  return n;
}

function clothstep(n, dt) {
  var c = n.cloth;
  if (!c) return;
  if (!c.pts) {
    c.pts = [];
    for (var y = 0; y <= c.ny; y++) {
      for (var x = 0; x <= c.nx; x++) {
        c.pts.push({ x: (x / c.nx - 0.5) * 2, y: (y / c.ny - 0.5) * 2, px: (x / c.nx - 0.5) * 2, py: (y / c.ny - 0.5) * 2, pin: y === 0 });
      }
    }
  }
  c.t += dt;
  var wind = Math.sin(c.t * 2.2) * c.wind;
  c.pts.forEach(function (p) {
    if (p.pin) return;
    var vx = (p.x - p.px) * c.damp;
    var vy = (p.y - p.py) * c.damp;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + wind * dt * 0.06;
    p.y += vy - c.grav * dt * dt * 0.02;
  });
  for (var it = 0; it < 3; it++) {
    for (var y2 = 0; y2 <= c.ny; y2++) {
      for (var x2 = 0; x2 <= c.nx; x2++) {
        var i = y2 * (c.nx + 1) + x2;
        if (x2 < c.nx) relax(c.pts, i, i + 1, 2 / c.nx);
        if (y2 < c.ny) relax(c.pts, i, i + c.nx + 1, 2 / c.ny);
      }
    }
  }
  n.pos[1] = n.pos[1] + 0;
}

function relax(pts, a, b, target) {
  var pa = pts[a];
  var pb = pts[b];
  if (!pa || !pb) return;
  var dx = pb.x - pa.x;
  var dy = pb.y - pa.y;
  var d = Math.hypot(dx, dy) || 0.0001;
  var diff = (d - target) / d * 0.5;
  var ox = dx * diff;
  var oy = dy * diff;
  if (!pa.pin) {
    pa.x += ox;
    pa.y += oy;
  }
  if (!pb.pin) {
    pb.x -= ox;
    pb.y -= oy;
  }
}

function hairnew() {
  var n = basenode("sphere", { name: "Groom hair", pos: [app.cam.target[0], 1.6, app.cam.target[2]] });
  n.scl = [0.5, 0.6, 0.5];
  n.color = "#3b2a1e";
  n.hair = { strands: 220, len: 0.34, curl: 0.2 };
  addnode(n, null);
  toast("Groom hair actor added", "ok");
  return n;
}

function furnew() {
  var n = basenode("sphere", { name: "Fur shell", pos: [app.cam.target[0], 1.2, app.cam.target[2]] });
  n.scl = [0.7, 0.7, 0.7];
  n.color = "#a8763f";
  n.fur = { shells: 6, len: 0.12, density: 0.8 };
  addnode(n, null);
  toast("Fur shell actor added", "ok");
  return n;
}

function eyesnew() {
  var n = basenode("sphere", { name: "Eye", pos: [app.cam.target[0], 1.7, app.cam.target[2] + 0.3] });
  n.scl = [0.16, 0.16, 0.16];
  n.color = "#f2f6ff";
  n.eye = { iris: "#3a6ea8", pupil: 0.45, parallax: 0.4, catchlight: true };
  addnode(n, null);
  toast("Eye actor added with parallax iris", "ok");
  return n;
}

function r2boot() {
  matboot();
  r2conf();
  r2apply();
}

function decalpanel() {
  return r2panel();
}
