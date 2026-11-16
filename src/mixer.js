var mixergroups = ["Master", "Music", "SFX", "UI", "Ambient"];

function mixerdef() {
  app.project = app.project || {};
  var p = app.project;
  if (!p.mixer) {
    p.mixer = {
      groups: mixergroups.map(function (g) {
        return { name: g, volume: g === "Master" ? 1 : g === "SFX" ? 0.9 : 0.7, lowpass: 20000, mute: false };
      })
    };
  }
  p.mixer.groups.forEach(function (g) {
    if (g.lowpass === undefined) g.lowpass = 20000;
    if (g.volume === undefined) g.volume = 1;
  });
  return p.mixer;
}

function mixergroup(name) {
  var m = mixerdef();
  var out = null;
  m.groups.forEach(function (g) {
    if (g.name === name) out = g;
  });
  if (!out) {
    out = { name: name, volume: 0.8, lowpass: 20000, mute: false };
    m.groups.push(out);
  }
  return out;
}

function mixeraudio() {
  try {
    var actx = window.AudioContext || window.webkitAudioContext;
    if (!actx) return null;
    if (!mixeraudio.ctx) mixeraudio.ctx = new actx();
    if (mixeraudio.ctx.state === "suspended") mixeraudio.ctx.resume();
    return mixeraudio.ctx;
  } catch (e) {
    return null;
  }
}

function mixernodes() {
  var ctx = mixeraudio();
  if (!ctx) return null;
  if (mixernodes.built) return mixernodes.built;
  var map = {};
  var master = mixerdef().groups[0];
  var mastergain = ctx.createGain();
  mastergain.gain.value = master.mute ? 0 : master.volume;
  var masterfilter = ctx.createBiquadFilter();
  masterfilter.type = "lowpass";
  masterfilter.frequency.value = Math.min(20000, master.lowpass || 20000);
  masterfilter.connect(mastergain);
  mastergain.connect(ctx.destination);
  map.Master = { gain: mastergain, filter: masterfilter, input: masterfilter };
  mixerdef().groups.forEach(function (g) {
    if (g.name === "Master") return;
    var gain = ctx.createGain();
    gain.gain.value = g.mute ? 0 : g.volume;
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = Math.min(20000, g.lowpass || 20000);
    filter.connect(gain);
    gain.connect(masterfilter);
    map[g.name] = { gain: gain, filter: filter, input: filter };
  });
  mixernodes.built = map;
  return map;
}

function mixersync() {
  var map = mixernodes.built;
  if (!map) return;
  mixerdef().groups.forEach(function (g) {
    var n = map[g.name];
    if (!n) return;
    n.gain.gain.value = g.mute ? 0 : g.volume;
    n.filter.frequency.value = Math.max(80, Math.min(20000, g.lowpass || 20000));
  });
}

function mixerplay(name, group, opts) {
  opts = opts || {};
  var ctx = mixeraudio();
  if (!ctx) return;
  var map = mixernodes();
  if (!map) return;
  var g = mixergroup(group || "SFX");
  if (g.mute) return;
  var target = map[group || "SFX"] || map.Master;
  var freq = opts.freq;
  if (!freq) {
    soundassets.forEach(function (s) {
      if (s.name.toLowerCase() === String(name).toLowerCase()) freq = s.freq;
    });
  }
  if (!freq) {
    var freqs = { coin: 880, jump: 520, win: 740, lose: 220, power: 990, punch: 160 };
    freq = freqs[name] || 440;
  }
  var dur = opts.duration || 0.26;
  var osc = ctx.createOscillator();
  var env = ctx.createGain();
  osc.type = opts.wave || (name === "punch" ? "square" : "triangle");
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (opts.sweep) osc.frequency.linearRampToValueAtTime(Math.max(60, freq * opts.sweep), ctx.currentTime + dur * 1.6);
  env.gain.setValueAtTime(0.0001, ctx.currentTime);
  env.gain.linearRampToValueAtTime(opts.gain || 0.09, ctx.currentTime + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(env);
  env.connect(target.input);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
  if (name === "win") {
    var o2 = ctx.createOscillator();
    var g2 = ctx.createGain();
    o2.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    o2.frequency.linearRampToValueAtTime(990, ctx.currentTime + 0.3);
    g2.gain.setValueAtTime(0.0001, ctx.currentTime + 0.1);
    g2.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.13);
    g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o2.connect(g2);
    g2.connect(target.input);
    o2.start(ctx.currentTime + 0.1);
    o2.stop(ctx.currentTime + 0.52);
  }
}

function playsound(kind) {
  var group = typeof soundgroupof === "function" ? soundgroupof(kind) : "SFX";
  mixerplay(kind, group);
}

function soundgroupof(kind) {
  var out = "SFX";
  walk(app.scene.objects || [], function (n) {
    if (!hascomp(n, "sound")) return;
    var asset = (n.compdata && n.compdata.sound && n.compdata.sound.asset) || "";
    if (asset.toLowerCase().indexOf(String(kind).toLowerCase()) >= 0) out = (n.compdata.sound.group || "SFX");
  });
  return out;
}

function mixerstriphmtml(g, i) {
  var pct = Math.round((g.mute ? 0 : g.volume) * 100);
  var lp = parseFloat(g.lowpass) || 20000;
  return '<div class="mixstrip"><div class="mixname">' + esc(g.name) + "</div>" +
    '<div class="mixfader"><input class="mixrange" type="range" min="0" max="1" step="0.01" value="' + g.volume + '" data-mix="' + i + '" data-mixkey="volume"></div>' +
    '<div class="mixval">' + pct + "%</div>" +
    '<div class="row" style="gap:4px;justify-content:center"><button class="iconbtn' + (g.mute ? " on" : "") + '" data-act="mixmute" data-index="' + i + '" title="Mute">' + ic("sound", "ico-xs") + "</button>" +
    '<button class="iconbtn" data-act="mixtest" data-index="' + i + '" title="Preview">' + ic("play", "ico-xs") + "</button></div>" +
    '<div class="mixlp">Low-pass ' + (lp >= 20000 ? "off" : Math.round(lp) + " Hz") + '</div><input class="mixrange" type="range" min="200" max="20000" step="100" value="' + Math.min(20000, lp) + '" data-mix="' + i + '" data-mixkey="lowpass">' +
    "</div>";
}

acts.mixer = function () {
  var m = mixerdef();
  var body = '<div class="mixer">' + m.groups.map(function (g, i) {
    return mixerstriphmtml(g, i);
  }).join("") + "</div>";
  body += '<div class="hintline">Each group has its own volume and low-pass filter. Sounds played by the game route through the group set on their Sound component.</div>';
  openmodal({
    title: "Audio mixer",
    icon: "soundwave",
    width: "wide",
    body: body,
    footer: '<button class="btn" data-mact="cancel">Close</button><button class="btn primary" data-mact="save">Save mix</button>',
    onmount: function (modal) {
      modal.addEventListener("input", function (ev) {
        var el = ev.target;
        if (!el.hasAttribute("data-mix")) return;
        var g = m.groups[+el.getAttribute("data-mix")];
        var key = el.getAttribute("data-mixkey");
        g[key] = parseFloat(el.value);
        var strip = el.closest(".mixstrip");
        if (strip) {
          var val = strip.querySelector(".mixval");
          if (val) val.textContent = Math.round((g.mute ? 0 : g.volume) * 100) + "%";
          var lp = strip.querySelector(".mixlp");
          if (lp) lp.textContent = "Low-pass " + (g.lowpass >= 20000 ? "off" : Math.round(g.lowpass) + " Hz");
        }
        mixersync();
      });
    },
    actions: {
      cancel: function (mo, s) {
        closemodal(s);
      },
      save: function (mo, s) {
        mixersync();
        closemodal(s);
        commit("mixer");
        toast("Mixer saved", "ok");
      }
    }
  });
};

acts.mixmute = function (el) {
  var m = mixerdef();
  var g = m.groups[+el.getAttribute("data-index")];
  g.mute = !g.mute;
  mixersync();
  commit("mixer");
  acts.mixer();
};
acts.mixtest = function (el) {
  var m = mixerdef();
  var g = m.groups[+el.getAttribute("data-index")];
  mixerplay("coin", g.name, { freq: 520 + Math.random() * 260 });
  toast("Testing " + g.name + " channel", "ok");
};
