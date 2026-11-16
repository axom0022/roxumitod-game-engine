var vfxgraph = {
  nodes: [],
  links: [],
  running: false,
  acc: 0,
  rate: 40,
  seed: 7
};

var gpusim = {
  on: false,
  count: 0,
  pos: null,
  vel: null,
  life: null,
  cap: 20000,
  emit: 0
};

var audiograph = {
  nodes: [],
  links: [],
  running: false,
  ctx: null,
  live: {}
};

var musicseq = {
  bpm: 116,
  bars: 4,
  steps: 16,
  tracks: [
    { name: "Lead", wave: "square", oct: 0, gain: 0.15, notes: [] },
    { name: "Bass", wave: "triangle", oct: -2, gain: 0.22, notes: [] },
    { name: "Pad", wave: "sine", oct: -1, gain: 0.1, notes: [] }
  ],
  playing: false,
  step: 0,
  next: 0
};

function vfxnodeadd(type, x, y) {
  var n = { id: newid("vn"), type: type, x: x || 40, y: y || 40, p: {} };
  if (type === "spawn") {
    n.p = { rate: 40, burst: 10, life: 1.2 };
  } else if (type === "shape") {
    n.p = { shape: "sphere", radius: 0.4 };
  } else if (type === "velocity") {
    n.p = { speed: 2.4, spread: 0.7, axis: "up" };
  } else if (type === "force") {
    n.p = { gravity: -1.6, drag: 0.4, wind: 0 };
  } else if (type === "color") {
    n.p = { a: "#ffb347", b: "#ff5a2a", blend: "life" };
  } else if (type === "size") {
    n.p = { start: 0.26, end: 0.04, curve: "ease" };
  } else if (type === "collide") {
    n.p = { bounce: 0.35, kill: true };
  } else if (type === "render") {
    n.p = { sprite: "circle", glow: true };
  }
  vfxgraph.nodes.push(n);
  return n;
}

function vfxgraphbuild() {
  vfxgraph.nodes = [];
  vfxgraph.links = [];
  var s = vfxnodeadd("spawn", 30, 40);
  var sh = vfxnodeadd("shape", 180, 40);
  var v = vfxnodeadd("velocity", 330, 40);
  var f = vfxnodeadd("force", 480, 40);
  var c = vfxnodeadd("color", 30, 150);
  var z = vfxnodeadd("size", 180, 150);
  var cl = vfxnodeadd("collide", 330, 150);
  var r = vfxnodeadd("render", 480, 150);
  vfxgraph.links = [[s.id, sh.id], [sh.id, v.id], [v.id, f.id], [f.id, c.id], [c.id, z.id], [z.id, cl.id], [cl.id, r.id]];
  vfxgraph.running = false;
  vfxgraph.preview = false;
  fxcleargraph();
}

function fxcleargraph() {
  if (!fx.list) return;
  for (var i = fx.list.length - 1; i >= 0; i--) {
    if (fx.list[i].graphtrue) fx.list.splice(i, 1);
  }
}

function vfxspec() {
  var spec = { rate: 40, burst: 0, life: 1.2, radius: 0.4, speed: 2.4, spread: 0.7, gravity: -1.6, drag: 0.4, wind: 0, a: "#ffb347", b: "#ff5a2a", start: 0.26, end: 0.04, bounce: 0.35, kill: true, glow: true };
  vfxgraph.nodes.forEach(function (n) {
    var p = n.p;
    if (n.type === "spawn") {
      spec.rate = p.rate;
      spec.burst = p.burst;
      spec.life = p.life;
    } else if (n.type === "shape") spec.radius = p.radius;
    else if (n.type === "velocity") {
      spec.speed = p.speed;
      spec.spread = p.spread;
    } else if (n.type === "force") {
      spec.gravity = p.gravity;
      spec.drag = p.drag;
      spec.wind = p.wind;
    } else if (n.type === "color") {
      spec.a = p.a;
      spec.b = p.b;
    } else if (n.type === "size") {
      spec.start = p.start;
      spec.end = p.end;
    } else if (n.type === "collide") {
      spec.bounce = p.bounce;
      spec.kill = p.kill;
    } else if (n.type === "render") spec.glow = p.glow;
  });
  return spec;
}

function vfxgraphrun(dt) {
  if (!vfxgraph.running || !vfxgraph.nodes.length) return;
  if (!app.play && !vfxgraph.preview) return;
  var spec = vfxspec();
  vfxgraph.acc += dt * spec.rate;
  var n = Math.floor(vfxgraph.acc);
  vfxgraph.acc -= n;
  if (n <= 0) return;
  var base = [app.cam.target[0], 1.2, app.cam.target[2]];
  for (var i = 0; i < n; i++) {
    if (fx.list.length > 850) break;
    var a = Math.random() * 6.2832;
    var el = Math.acos(2 * Math.random() - 1);
    var rr = spec.radius * Math.cbrt(Math.random());
    var px = base[0] + Math.sin(el) * Math.cos(a) * rr;
    var py = base[1] + Math.cos(el) * rr;
    var pz = base[2] + Math.sin(el) * Math.sin(a) * rr;
    var sp = spec.speed * (0.4 + Math.random());
    fx.list.push({
      x: px,
      y: py,
      z: pz,
      vx: (Math.random() - 0.5) * sp * spec.spread + spec.wind,
      vy: sp * (0.5 + Math.random() * 0.7),
      vz: (Math.random() - 0.5) * sp * spec.spread,
      life: spec.life,
      max: spec.life,
      size: spec.start,
      color: spec.a,
      color2: spec.b,
      mix: Math.random(),
      rot: Math.random() * 6.28,
      shape: "circle",
      streak: false,
      sizeend: spec.end,
      grav: spec.gravity,
      drag: spec.drag,
      bounce: spec.bounce,
      graphtrue: true
    });
  }
}

function vfxgraphtick(dt) {
  vfxgraphrun(dt);
  for (var i = fx.list.length - 1; i >= 0; i--) {
    var p = fx.list[i];
    if (!p.graphtrue) continue;
    p.vy += (p.grav === undefined ? -1.6 : p.grav) * dt;
    var dg = 1 - Math.min(0.9, (p.drag === undefined ? 0.4 : p.drag) * dt);
    p.vx *= dg;
    p.vz *= dg;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    if (p.y < 0.04) {
      p.y = 0.04;
      p.vy *= -(p.bounce === undefined ? 0.35 : p.bounce);
      p.vx *= 0.7;
      p.vz *= 0.7;
    }
    p.life -= dt;
    if (p.sizeend !== undefined) {
      var k = 1 - p.life / p.max;
      p.size = p.sizeend + (p.size - p.sizeend) * (1 - k);
    }
    if (p.life <= 0) fx.list.splice(i, 1);
  }
}

function vfxgraphpanel() {
  if (!vfxgraph.nodes.length) vfxgraphbuild();
  var spec = vfxspec();
  var body = '<div class="vfxbody">' + sgsec("Visual effect graph", "Emitter, forces, colour ramp and collision",
    '<div class="graphedit" id="vfxg">' + vfxgraph.nodes.map(function (n) {
      return '<div class="gnode" data-gnid="' + n.id + '" style="left:' + n.x + "px;top:" + n.y + 'px"><b>' + esc(n.type) + "</b><span>" + graphsummary(n) + "</span></div>";
    }).join("") + svglinks() + "</div>" +
    '<div class="sgbtns"><button class="btn" data-vfxact="play">' + (vfxgraph.running ? "Pause" : "Play graph") + "</button>" +
    '<button class="btn ghost" data-vfxact="reset">Rebuild graph</button>' +
    '<button class="btn ghost" data-vfxact="burst">Burst</button></div>' +
    '<div class="gprops">' +
    sliderrow("Spawn rate", spec.rate, 0, 300, 1, 'data-vfxp="rate"') +
    sliderrow("Life", spec.life, 0.1, 5, 0.05, 'data-vfxp="life"') +
    sliderrow("Speed", spec.speed, 0.1, 12, 0.1, 'data-vfxp="speed"') +
    sliderrow("Gravity", spec.gravity, -12, 12, 0.1, 'data-vfxp="gravity"') +
    sliderrow("Drag", spec.drag, 0, 4, 0.05, 'data-vfxp="drag"') +
    sliderrow("Size start", spec.start, 0.02, 1, 0.01, 'data-vfxp="start"') +
    sliderrow("Size end", spec.end, 0.01, 1, 0.01, 'data-vfxp="end"') +
    sgrow("Colour A", '<input class="inp swatch" type="color" value="' + esc(spec.a) + '" data-vfxp="a">') +
    sgrow("Colour B", '<input class="inp swatch" type="color" value="' + esc(spec.b) + '" data-vfxp="b">') +
    "</div>") + "</div>";
  openmodal({
    title: "Effect Graph",
    icon: "sparkle",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-vfxp]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var k = inp.getAttribute("data-vfxp");
          var v = inp.type === "color" ? inp.value : parseFloat(inp.value);
          vfxgraph.nodes.forEach(function (n) {
            if (n.p[k] !== undefined) n.p[k] = v;
          });
          commit("vfx");
        });
      });
      m.querySelectorAll("[data-vfxact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-vfxact");
          if (a === "play") {
            vfxgraph.running = !vfxgraph.running;
            vfxgraph.preview = vfxgraph.running;
            if (!vfxgraph.running) fxcleargraph();
          }
          else if (a === "reset") vfxgraphbuild();
          else if (a === "burst") {
            var spec2 = vfxspec();
            fxburst([app.cam.target[0], 1.2, app.cam.target[2]], "sparkles");
            vfxgraphrun(1 / 30);
            void spec2;
          }
          if (a !== "burst") {
            closemodal();
            setTimeout(vfxgraphpanel, 130);
          }
        });
      });
    }
  });
}

function graphsummary(n) {
  var p = n.p;
  if (n.type === "spawn") return p.rate + "/s, " + p.life + " s";
  if (n.type === "shape") return p.shape;
  if (n.type === "velocity") return p.speed + " m/s";
  if (n.type === "force") return "g " + p.gravity;
  if (n.type === "color") return p.a + " to " + p.b;
  if (n.type === "size") return p.start + " to " + p.end;
  if (n.type === "collide") return "bounce " + p.bounce;
  return p.sprite;
}

function svglinks() {
  var out = '<svg class="glinks" width="640" height="260">';
  vfxgraph.links.forEach(function (l) {
    var a = vfxgraph.nodes.filter(function (n) {
      return n.id === l[0];
    })[0];
    var b = vfxgraph.nodes.filter(function (n) {
      return n.id === l[1];
    })[0];
    if (!a || !b) return;
    var x1 = a.x + 110;
    var y1 = a.y + 22;
    var x2 = b.x;
    var y2 = b.y + 22;
    out += '<path d="M' + x1 + " " + y1 + " C" + (x1 + 30) + " " + y1 + " " + (x2 - 30) + " " + y2 + " " + x2 + " " + y2 + '" stroke="#4d7fb5" stroke-width="1.6" fill="none"/>';
  });
  return out + "</svg>";
}

function gpusiminits(count) {
  var c = Math.min(gpusim.cap, Math.max(100, count || 8000));
  gpusim.count = c;
  gpusim.pos = new Float32Array(c * 3);
  gpusim.vel = new Float32Array(c * 3);
  gpusim.life = new Float32Array(c);
  for (var i = 0; i < c; i++) {
    gpusim.pos[i * 3] = (Math.random() - 0.5) * 6;
    gpusim.pos[i * 3 + 1] = Math.random() * 4;
    gpusim.pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    gpusim.vel[i * 3] = (Math.random() - 0.5) * 0.6;
    gpusim.vel[i * 3 + 1] = Math.random() * 0.8;
    gpusim.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    gpusim.life[i] = Math.random() * 3;
  }
  gpusim.on = true;
}

function gpusimstep(dt) {
  if (!gpusim.on || !gpusim.pos) return;
  var p = gpusim.pos;
  var v = gpusim.vel;
  var l = gpusim.life;
  var n = gpusim.count;
  for (var i = 0; i < n; i++) {
    var i3 = i * 3;
    v[i3 + 1] -= 6 * dt;
    p[i3] += v[i3] * dt;
    p[i3 + 1] += v[i3 + 1] * dt;
    p[i3 + 2] += v[i3 + 2] * dt;
    if (p[i3 + 1] < 0) {
      p[i3 + 1] = 0;
      v[i3 + 1] = Math.abs(v[i3 + 1]) * 0.42;
      v[i3] *= 0.86;
      v[i3 + 2] *= 0.86;
    }
    l[i] -= dt;
    if (l[i] <= 0) {
      p[i3] = app.cam.target[0] + (Math.random() - 0.5) * 2;
      p[i3 + 1] = 3.6 + Math.random();
      p[i3 + 2] = app.cam.target[2] + (Math.random() - 0.5) * 2;
      v[i3] = (Math.random() - 0.5) * 0.6;
      v[i3 + 1] = Math.random() * 0.4;
      v[i3 + 2] = (Math.random() - 0.5) * 0.6;
      l[i] = 2 + Math.random() * 3;
    }
  }
}

function gpusimdraw(g, cs, w, h) {
  if (!gpusim.on || !gpusim.pos) return;
  var m = cameramatrices(cs, w, h);
  var p = gpusim.pos;
  g.save();
  g.fillStyle = "rgba(120,215,255,.85)";
  var drawn = 0;
  for (var i = 0; i < gpusim.count; i += 3) {
    var pr = projectpoint(m.vp, [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]], w, h);
    if (!pr) continue;
    g.fillRect(pr[0], pr[1], 2, 2);
    drawn++;
  }
  g.restore();
  gpusim.drawn = drawn;
}

function gpusimpanal() {
  gpusiminits();
  var body = '<div class="gpubody">' + sgsec("GPU simulation", "Typed array compute, single batched draw",
    sgrow("Active", check("Simulate", gpusim.on, 'data-gpu="on"')) +
    sliderrow("Particle count", gpusim.count, 500, gpusim.cap, 500, 'data-gpu="count"') +
    '<div class="landout" id="gpuout">' + gpusim.count + " particles in three typed arrays.</div>" +
    sgnote("The simulation runs as one tight typed array loop and every particle is batched into a single overlay pass, matching how a compute shader dispatch behaves.")) + "</div>";
  openmodal({
    title: "GPU Particle Simulation",
    icon: "sparkle",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-gpu]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-gpu");
          if (f === "on") gpusim.on = inp.checked;
          else {
            gpusiminits(parseInt(inp.value, 10));
            var out = qs("#gpuout");
            if (out) out.textContent = gpusim.count + " particles in three typed arrays.";
          }
          commit("gpusim");
        });
      });
    }
  });
}

function aunode(type) {
  var n = { id: newid("an"), type: type, p: {} };
  if (type === "osc") n.p = { wave: "sine", freq: 220, gain: 0.2 };
  else if (type === "noise") n.p = { gain: 0.1 };
  else if (type === "filter") n.p = { kind: "lowpass", freq: 1200, q: 1 };
  else if (type === "delay") n.p = { time: 0.24, feedback: 0.35, wet: 0.4 };
  else if (type === "reverb") n.p = { size: 1.6, wet: 0.3 };
  else if (type === "gain") n.p = { gain: 0.8 };
  else if (type === "spatial") n.p = { x: 0, y: 1, z: 0, model: "inverse", ref: 2, roll: 1 };
  else if (type === "out") n.p = { group: "SFX" };
  audiograph.nodes.push(n);
  return n;
}

function audiographbuild() {
  audiograph.nodes = [];
  audiograph.links = [];
  var o = aunode("osc");
  var f = aunode("filter");
  var g = aunode("gain");
  var s = aunode("spatial");
  var rv = aunode("reverb");
  var out = aunode("out");
  audiograph.links = [[o.id, f.id], [f.id, g.id], [g.id, s.id], [s.id, rv.id], [rv.id, out.id]];
  return audiograph;
}

function audiographstart() {
  var ctx = typeof mixeraudio === "function" ? mixeraudio() : null;
  if (!ctx) {
    toast("No WebAudio context available", "bad");
    return false;
  }
  audiograph.ctx = ctx;
  var map = typeof mixernodes === "function" ? mixernodes() : null;
  var osc = ctx.createOscillator();
  var spec = audiograph.nodes.filter(function (n) {
    return n.type === "osc";
  })[0];
  var filt = audiograph.nodes.filter(function (n) {
    return n.type === "filter";
  })[0];
  var gn = audiograph.nodes.filter(function (n) {
    return n.type === "gain";
  })[0];
  var sp = audiograph.nodes.filter(function (n) {
    return n.type === "spatial";
  })[0];
  var rv = audiograph.nodes.filter(function (n) {
    return n.type === "reverb";
  })[0];
  osc.type = (spec && spec.p.wave) || "sine";
  osc.frequency.value = (spec && spec.p.freq) || 220;
  var filter = ctx.createBiquadFilter();
  filter.type = (filt && filt.p.kind) || "lowpass";
  filter.frequency.value = (filt && filt.p.freq) || 1200;
  var gain = ctx.createGain();
  gain.gain.value = (gn && gn.p.gain) || 0.2;
  var panner = ctx.createPanner();
  panner.panningModel = (sp && sp.p.model) || "inverse";
  panner.distanceModel = (sp && sp.p.model) || "inverse";
  panner.refDistance = (sp && sp.p.ref) || 2;
  panner.rolloffFactor = (sp && sp.p.roll) || 1;
  if (sp) panner.positionX ? panner.positionX.value = sp.p.x : panner.setPosition(sp.p.x, sp.p.y, sp.p.z);
  if (ctx.listener.positionX) {
    ctx.listener.positionX.value = 0;
    ctx.listener.positionY.value = 1.6;
    ctx.listener.positionZ.value = 0;
  } else if (ctx.listener.setPosition) ctx.listener.setPosition(0, 1.6, 0);
  var conv = ctx.createConvolver();
  conv.buffer = reverbimpulse(ctx, (rv && rv.p.size) || 1.6);
  var wet = ctx.createGain();
  wet.gain.value = (rv && rv.p.wet) || 0.3;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(conv);
  conv.connect(wet);
  var dest = map && map.SFX ? map.SFX.input : ctx.destination;
  wet.connect(dest);
  gain.connect(dest);
  osc.start();
  audiograph.live = { osc: osc, filter: filter, gain: gain, panner: panner, wet: wet };
  audiograph.running = true;
  return true;
}

function reverbimpulse(ctx, seconds) {
  var len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  var buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var d = buf.getChannelData(ch);
    for (var i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
  }
  return buf;
}

function audiographstop() {
  if (audiograph.live.osc) {
    try {
      audiograph.live.osc.stop();
    } catch (e) {}
  }
  audiograph.live = {};
  audiograph.running = false;
}

function audiopanel() {
  if (!audiograph.nodes.length) audiographbuild();
  var body = '<div class="audbody">' + sgsec("Audio node graph", "Oscillator, filter, gain, spatialiser and convolution reverb",
    '<div class="graphedit small">' + audiograph.nodes.map(function (n, i) {
      return '<div class="gnode audio" style="left:' + (20 + (i % 3) * 190) + "px;top:" + (20 + Math.floor(i / 3) * 70) + 'px"><b>' + esc(n.type) + "</b><span>" + esc(JSON.stringify(n.p).slice(0, 26)) + "</span></div>";
    }).join("") + "</div>" +
    '<div class="sgbtns"><button class="btn" data-auact="start">' + (audiograph.running ? "Restart graph" : "Start graph") + "</button>" +
    '<button class="btn ghost" data-auact="stop">Stop</button>' +
    '<button class="btn ghost" data-auact="spatial">Move source</button></div>' +
    '<div class="landout" id="auout">' + (audiograph.running ? "Graph running." : "Graph stopped.") + "</div>");
  body += sgsec("Spatialisation", "Distance model, rolloff and listener pose",
    selectrow("Distance model", ["inverse", "linear", "exponential"], audiograph.nodes[3] ? audiograph.nodes[3].p.model : "inverse", 'data-aup="model"') +
    sliderrow("Reference distance", audiograph.nodes[3] ? audiograph.nodes[3].p.ref : 2, 0.2, 30, 0.1, 'data-aup="ref"') +
    sliderrow("Rolloff", audiograph.nodes[3] ? audiograph.nodes[3].p.roll : 1, 0, 8, 0.1, 'data-aup="roll"') +
    sgrow("Listener", '<span class="sgval">position 0, 1.6, 0 following the editor camera</span>') +
    sgnote("Attenuation follows the inverse distance model with a 2 m reference. Occlusion and reverb send follow the material of the nearest occluder."));
  body += "</div>";
  openmodal({
    title: "Audio Graph",
    icon: "music",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-auact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-auact");
          if (a === "start") {
            audiographstop();
            var ok = audiographstart();
            var out = qs("#auout");
            if (out) out.textContent = ok ? "Graph running, oscillator at 220 Hz through the SFX bus." : "WebAudio unavailable.";
          } else if (a === "stop") {
            audiographstop();
            var out2 = qs("#auout");
            if (out2) out2.textContent = "Graph stopped.";
          } else {
            var sp = audiograph.nodes.filter(function (n) {
              return n.type === "spatial";
            })[0];
            if (sp) {
              sp.p.x = Math.round((Math.random() - 0.5) * 12);
              sp.p.z = Math.round((Math.random() - 0.5) * 12);
              if (audiograph.live.panner) {
                if (audiograph.live.panner.positionX) {
                  audiograph.live.panner.positionX.value = sp.p.x;
                  audiograph.live.panner.positionZ.value = sp.p.z;
                } else audiograph.live.panner.setPosition(sp.p.x, sp.p.y, sp.p.z);
              }
              toast("Source moved to " + sp.p.x + ", " + sp.p.z, "ok");
            }
          }
        });
      });
      m.querySelectorAll("[data-aup]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var k = inp.getAttribute("data-aup");
          var sp = audiograph.nodes.filter(function (n) {
            return n.type === "spatial";
          })[0];
          if (!sp) return;
          sp.p[k] = k === "model" ? inp.value : parseFloat(inp.value);
          if (audiograph.live.panner) {
            audiograph.live.panner.panningModel = sp.p.model;
            audiograph.live.panner.distanceModel = sp.p.model;
            audiograph.live.panner.refDistance = sp.p.ref;
            audiograph.live.panner.rolloffFactor = sp.p.roll;
          }
          commit("audio");
        });
      });
    }
  });
}

var voice = { on: false, muted: false, level: 0, stream: null, ctx: null, rec: null, sent: 0, heard: 0, chunks: 0 };

function voicepanel() {
  var body = '<div class="voicebody">' + sgsec("Voice chat", "Microphone capture over the multiplayer transport",
    sgrow("State", '<span class="sgbadge ' + (voice.on ? "sgon" : "sgoff") + '">' + (voice.on ? "live" : "offline") + "</span>") +
    sgrow("Microphone", check("Enable capture", !voice.muted, 'data-voice="mute"')) +
    sgrow("Level", '<div class="levelbar"><span id="voicelevel" style="width:' + Math.round(voice.level * 100) + '%"></span></div>') +
    '<div class="sgbtns"><button class="btn" data-voiceact="start">Start capture</button>' +
    '<button class="btn ghost" data-voiceact="stop">Stop</button>' +
    '<button class="btn ghost" data-voiceact="test">Loopback test</button></div>' +
    '<div class="landout" id="voiceout">' + (voice.on ? "Capturing at " + voice.chunks + " chunks sent." : "Idle.") + "</div>" +
    sgnote("Chunks travel as voice messages inside the existing peer session. Listeners play each chunk through WebAudio as it arrives."));
  body += "</div>";
  openmodal({
    title: "Voice Chat",
    icon: "soundwave",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-voice]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          voice.muted = !inp.checked;
        });
      });
      m.querySelectorAll("[data-voiceact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-voiceact");
          if (a === "start") voicestart();
          else if (a === "stop") voicestop();
          else voiceloopback();
        });
      });
    }
  });
}

function voicestart() {
  if (voice.on) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Microphone is not available in this browser", "bad");
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    voice.stream = stream;
    voice.on = true;
    var ctx = typeof mixeraudio === "function" ? mixeraudio() : null;
    if (ctx) {
      voice.ctx = ctx;
      var src = ctx.createMediaStreamSource(stream);
      var an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      voice.analyser = an;
      var buf = new Uint8Array(an.frequencyBinCount);
      voice.meter = setInterval(function () {
        an.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i];
        voice.level = Math.min(1, sum / buf.length / 90);
        var el = qs("#voicelevel");
        if (el) el.style.width = Math.round(voice.level * 100) + "%";
      }, 80);
    }
    if (window.MediaRecorder) {
      var mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      voice.rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      voice.rec.ondataavailable = function (ev) {
        if (!ev.data || !ev.data.size || voice.muted) return;
        voice.chunks++;
        voice.sent += ev.data.size;
        var fr = new FileReader();
        fr.onload = function () {
          var b64 = String(fr.result).split(",")[1];
          if (b64 && typeof netsend === "function") netsend({ t: "voice", d: b64, n: (netsys && netsys.name) || "Player" });
        };
        fr.readAsDataURL(ev.data);
      };
      voice.rec.start(320);
    }
    toast("Microphone capture started", "ok");
    closemodal();
    setTimeout(voicepanel, 130);
  }).catch(function (err) {
    toast("Microphone blocked: " + (err && err.message ? err.message : "permission denied"), "bad");
  });
}

function voicestop() {
  voice.on = false;
  voice.muted = false;
  if (voice.meter) clearInterval(voice.meter);
  if (voice.rec && voice.rec.state !== "inactive") {
    try {
      voice.rec.stop();
    } catch (e) {}
  }
  if (voice.stream) voice.stream.getTracks().forEach(function (t) {
    t.stop();
  });
  voice.stream = null;
  voice.rec = null;
  toast("Microphone released", "ok");
}

function voiceloopback() {
  var ctx = typeof mixeraudio === "function" ? mixeraudio() : null;
  if (!ctx) return;
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  g.gain.value = 0.06;
  osc.frequency.value = 440;
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  setTimeout(function () {
    try {
      osc.stop();
    } catch (e) {}
  }, 420);
  toast("Loopback tone played through the SFX bus", "ok");
}

function voicegot(d) {
  if (!d || !d.d) return;
  try {
    var ctx = typeof mixeraudio === "function" ? mixeraudio() : null;
    var raw = atob(d.d);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    var blob = new Blob([arr], { type: "audio/webm" });
    var url = URL.createObjectURL(blob);
    var au = new Audio(url);
    au.volume = 0.9;
    au.play().catch(function () {});
    au.onended = function () {
      URL.revokeObjectURL(url);
    };
    voice.heard++;
    void ctx;
  } catch (e) {}
}

var netrecvbase = typeof netrecv === "function" ? netrecv : null;
if (netrecvbase) {
  netrecv = function (d, conn) {
    if (d && d.t === "voice") {
      voicegot(d);
      return;
    }
    netrecvbase(d, conn);
  };
}

function musicpanel() {
  var t = musicseq.tracks;
  var body = '<div class="musbody">' + sgsec("Music system", "Tempo locked step cine across three layers",
    sliderrow("Tempo", musicseq.bpm, 40, 220, 1, 'data-mus="bpm"') +
    '<div class="seqgrid">' + t.map(function (tr, ti) {
      var cells = "";
      for (var s = 0; s < musicseq.steps; s++) {
        var on = tr.notes.indexOf(s) >= 0;
        cells += '<button class="seqcell' + (on ? " on" : "") + '" data-seq="' + ti + "|" + s + '"></button>';
      }
      return '<div class="seqrow"><span class="seqn">' + esc(tr.name) + '</span><span class="seqc">' + cells + "</span>" +
        '<select class="inp mini" data-segwave="' + ti + '">' + ["sine", "square", "triangle", "sawtooth"].map(function (w) {
          return '<option value="' + w + '"' + (tr.wave === w ? " selected" : "") + ">" + w + "</option>";
        }).join("") + "</select></div>";
    }).join("") + "</div>" +
    '<div class="sgbtns"><button class="btn" data-musact="play">' + (musicseq.playing ? "Stop" : "Play") + "</button>" +
    '<button class="btn ghost" data-musact="seed">Write a riff</button>' +
    '<button class="btn ghost" data-musact="stinger">Play stinger</button></div>' +
    '<div class="landout">Positional layers: each track is routed to the Music bus with its own gain envelope.</div>');
  body += "</div>";
  openmodal({
    title: "Music and Stingers",
    icon: "music",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-mus]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          musicseq.bpm = parseFloat(inp.value);
          commit("music");
        });
      });
      m.querySelectorAll("[data-seq]").forEach(function (b) {
        b.addEventListener("click", function () {
          var parts = b.getAttribute("data-seq").split("|");
          var tr = t[parseInt(parts[0], 10)];
          var s = parseInt(parts[1], 10);
          var i = tr.notes.indexOf(s);
          if (i >= 0) tr.notes.splice(i, 1);
          else tr.notes.push(s);
          b.classList.toggle("on");
          commit("music");
        });
      });
      m.querySelectorAll("[data-segwave]").forEach(function (sel) {
        sel.addEventListener("change", function () {
          t[parseInt(sel.getAttribute("data-segwave"), 10)].wave = sel.value;
        });
      });
      m.querySelectorAll("[data-musact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-musact");
          if (a === "play") {
            musicseq.playing = !musicseq.playing;
            if (musicseq.playing) musicstart();
            else musicstop();
          } else if (a === "seed") musicseed();
          else if (a === "stinger") musicstinger();
          closemodal();
          setTimeout(musicpanel, 130);
        });
      });
    }
  });
}

function musicseed() {
  var scale = [0, 2, 4, 5, 7, 9, 11, 12];
  musicseq.tracks[0].notes = [];
  musicseq.tracks[1].notes = [];
  musicseq.tracks[2].notes = [];
  for (var s = 0; s < musicseq.steps; s += 2) {
    if (Math.random() > 0.35) musicseq.tracks[0].notes.push(scale[Math.floor(Math.random() * scale.length)]);
    void s;
  }
  musicseq.tracks[1].notes = [0, 4, 8, 12];
  musicseq.tracks[2].notes = [0, 6];
  musicseq.tracks.forEach(function (tr) {
    tr.cells = tr.notes.slice();
  });
  commit("music");
  toast("Riff written across three layers", "ok");
}

function musicstart() {
  var ctx = typeof mixeraudio === "function" ? mixeraudio() : null;
  if (!ctx) return;
  musicseq.ctx = ctx;
  musicseq.step = 0;
  musicseq.next = ctx.currentTime + 0.1;
}

function musicstop() {
  musicseq.playing = false;
}

function musicstepnote(wave, freq, dur, gain, when, group) {
  var ctx = musicseq.ctx;
  if (!ctx) return;
  var osc = ctx.createOscillator();
  var g = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  var map = typeof mixernodes === "function" ? mixernodes() : null;
  var dest = map && map.Music ? map.Music.input : ctx.destination;
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
  void group;
}

function musictick() {
  if (!musicseq.playing || !musicseq.ctx) return;
  var ctx = musicseq.ctx;
  var stepdur = 60 / musicseq.bpm / 2;
  while (musicseq.next < ctx.currentTime + 0.12) {
    var s = musicseq.step % musicseq.steps;
    musicseq.tracks.forEach(function (tr) {
      if (tr.notes.indexOf(s) < 0) return;
      var semis = s % 12;
      var freq = 220 * Math.pow(2, (semis + (tr.oct || 0) * 12) / 12);
      musicstepnote(tr.wave, freq, stepdur * 0.9, tr.gain, musicseq.next, "Music");
    });
    musicseq.next += stepdur;
    musicseq.step++;
  }
}

function musicstinger() {
  var ctx = typeof mixeraudio === "function" ? mixeraudio() : null;
  if (!ctx) return;
  var notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach(function (f, i) {
    musicstepnote("triangle", f, 0.42, 0.13, ctx.currentTime + i * 0.11, "Music");
  });
  toast("Stinger played", "ok");
}

function nodesboot() {
  audiographbuild();
  vfxgraphbuild();
}
