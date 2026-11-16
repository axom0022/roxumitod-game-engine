var rigstate = { eff: [0, 0, 0], chain: [], iters: 8 };

function sknode(picklast) {
  var n = selected();
  if (n && n.type === "skinned") return n;
  var found = null;
  walk(app.scene.objects, function (x) {
    if (x.type === "skinned" && (!picklast || !found)) found = x;
  });
  return found;
}

function rigtwo(a, b, c, target, pole) {
  var ab = Math.min(vlen(vsub(b, a)), Math.max(0.001, vlen(vsub(b, c)) + 0.001));
  var bc = vlen(vsub(c, b));
  var at = vlen(vsub(target, a));
  var maxlen = ab + bc - 0.001;
  var len = Math.min(at, maxlen);
  var dir = vnorm(vsub(target, a));
  var cosa = (ab * ab + len * len - bc * bc) / (2 * ab * len);
  cosa = Math.max(-1, Math.min(1, cosa));
  var sina = Math.sqrt(Math.max(0, 1 - cosa * cosa));
  var side = vnorm(vcross(dir, pole && vlen(pole) > 0.0001 ? pole : [0, 1, 0]));
  if (!isFinite(side[0])) side = [1, 0, 0];
  var knee = [
    a[0] + (dir[0] * cosa + side[0] * sina) * ab,
    a[1] + (dir[1] * cosa + side[1] * sina) * ab,
    a[2] + (dir[2] * cosa + side[2] * sina) * ab
  ];
  var end = [a[0] + dir[0] * len, a[1] + dir[1] * len, a[2] + dir[2] * len];
  return { mid: knee, end: end, reach: len >= maxlen - 0.002 };
}

function vlen(v) {
  return Math.hypot(v[0], v[1], v[2]);
}

function rigsetrot(bone, from, to) {
  var d = vnorm(vsub(to, from));
  bone.rot[0] = Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180 / Math.PI;
  bone.rot[1] = Math.atan2(d[0], d[2]) * 180 / Math.PI;
  bone.rot[2] = 0;
}

function rigsolve(node, target) {
  var s = skindef(node);
  var th = null;
  var sh = null;
  var hip = null;
  s.bones.forEach(function (b) {
    if (!th && b.name.indexOf("Thigh") === 0) th = b;
    if (!sh && b.name.indexOf("Shin") === 0) sh = b;
    if (!hip && b.name === "Hips") hip = b;
  });
  if (!th || !sh) {
    toast("Rig needs thigh and shin bones. Build a humanoid rig first.", "warn");
    return null;
  }
  var rootw = boneworld(s, hip || th);
  var a = rootw;
  var b = boneworld(s, th);
  var c = boneworld(s, sh);
  var res = rigtwo(a, b, c, target, [0, 0, 1]);
  rigsetrot(th, a, res.mid);
  rigsetrot(sh, res.mid, target);
  node.rigtarget = target.slice();
  commit("ik");
  return res;
}

function rigpanel() {
  var node = sknode(false);
  var body = '<div class="rigbody">';
  body += u5sec("Control Rig", "Two bone IK with pole vector",
    u5row("Target rig", '<span class="u5val">' + (node ? esc(node.name) : "none, add a skeletal mesh") + "</span>") +
    '<div class="u5btns"><button class="btn" data-rigact="solve">Solve IK to camera target</button>' +
    '<button class="btn ghost" data-rigact="reset">Reset pose</button>' +
    '<button class="btn ghost" data-rigact="human">Add humanoid rig</button></div>' +
    sliderrow("Iterations", rigstate.iters, 1, 32, 1, 'data-rig="iters"') +
    '<div class="landout" id="rigout">Ready.</div>');
  body += u5sec("Ragdoll", "Bone particles with distance constraints",
    u5row("Ragdoll", check("Enable physics bones", node && node.ragdollon, 'data-ragdoll="on"')) +
    sliderrow("Damping", node && node.ragdamp !== undefined ? node.ragdamp : 0.94, 0.5, 0.999, 0.001, 'data-ragdoll="damp"') +
    sliderrow("Gravity", node && node.raggrav !== undefined ? node.raggrav : 9.8, 0, 30, 0.1, 'data-ragdoll="grav"') +
    '<div class="u5btns"><button class="btn" data-rigact="ragdrop">Drop ragdoll</button>' +
    '<button class="btn ghost" data-rigact="ragreset">Reset bones</button></div>');
  body += u5sec("Joints and constraints", "Limit bone rotation per axis",
    node ? '<div class="jointlist">' + skindef(node).bones.slice(0, 16).map(function (b) {
      var lim = b.limit || { x: 90, y: 90, z: 45 };
      return '<div class="jointrow"><span class="jn">' + esc(b.name) + "</span>" +
        '<input class="inp num" type="number" value="' + lim.x + '" data-jlimit="' + b.id + '|x">' +
        '<input class="inp num" type="number" value="' + lim.y + '" data-jlimit="' + b.id + '|y">' +
        '<input class="inp num" type="number" value="' + lim.z + '" data-jlimit="' + b.id + '|z"></div>';
    }).join("") + "</div>" : u5note("No rig loaded."));
  body += "</div>";
  openmodal({
    title: "Control Rig and Ragdoll",
    icon: "target",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-rigact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-rigact");
          var n = sknode(false);
          if (!n && a !== "human") {
            toast("Add a skeletal mesh first", "warn");
            return;
          }
          if (a === "solve") {
            var t = [app.cam.target[0], Math.max(0.2, app.cam.target[1]), app.cam.target[2]];
            var r = rigsolve(n, t);
            var out = qs("#rigout");
            if (out && r) out.textContent = "IK solved, reach " + r.reach + ", end effector at " + t.map(function (v) {
              return Math.round(v * 100) / 100;
            }).join(", ");
          } else if (a === "reset") {
            skindef(n).bones.forEach(function (bb) {
              bb.rot = [0, 0, 0];
            });
            n.rigtarget = null;
            commit("rig");
            toast("Pose reset", "ok");
          } else if (a === "human") {
            skinmeshnew("human");
            closemodal();
            setTimeout(rigpanel, 130);
          } else if (a === "ragdrop") {
            n.ragdollon = true;
            ragdollinit(n);
            toast("Ragdoll dropped", "ok");
          } else if (a === "ragreset") {
            ragdollinit(n);
            n.ragdollon = false;
            commit("ragdoll");
          }
        });
      });
      m.querySelectorAll("[data-ragdoll]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var n = sknode(false);
          if (!n) return;
          var f = inp.getAttribute("data-ragdoll");
          var v = inp.type === "checkbox" ? inp.checked : parseFloat(inp.value);
          if (f === "on") {
            n.ragdollon = v;
            if (v) ragdollinit(n);
          } else if (f === "damp") n.ragdamp = v;
          else n.raggrav = v;
          commit("ragdoll");
        });
      });
      m.querySelectorAll("[data-jlimit]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var n = sknode(false);
          if (!n) return;
          var parts = inp.getAttribute("data-jlimit").split("|");
          var b = bonefind(skindef(n), parts[0]);
          if (!b) return;
          b.limit = b.limit || { x: 90, y: 90, z: 45 };
          b.limit[parts[1]] = parseFloat(inp.value) || 0;
          commit("joint");
        });
      });
      m.querySelectorAll("[data-rig]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          rigstate.iters = parseFloat(inp.value);
        });
      });
    }
  });
}

function ragdollinit(node) {
  var s = skindef(node);
  s.rag = s.rag || {};
  s.bones.forEach(function (b) {
    var w = boneworld(s, b);
    s.rag[b.id] = { p: w.slice(), v: [0, 0, 0], pin: b.name === "Root" };
  });
  node.ragdamp = node.ragdamp === undefined ? 0.94 : node.ragdamp;
  node.raggrav = node.raggrav === undefined ? 9.8 : node.raggrav;
}

function ragdollstep(node, dt) {
  var s = skindef(node);
  if (!s.rag) return;
  var damp = node.ragdamp === undefined ? 0.94 : node.ragdamp;
  var grav = node.raggrav === undefined ? 9.8 : node.raggrav;
  s.bones.forEach(function (b) {
    var r = s.rag[b.id];
    if (!r || r.pin) return;
    r.v[1] -= grav * dt;
    r.p[0] += r.v[0] * dt;
    r.p[1] += r.v[1] * dt;
    r.p[2] += r.v[2] * dt;
    r.v[0] *= damp;
    r.v[1] *= damp;
    r.v[2] *= damp;
  });
  for (var it = 0; it < 4; it++) {
    s.bones.forEach(function (b) {
      if (!b.parent) return;
      var a = s.rag[b.parent];
      var c = s.rag[b.id];
      if (!a || !c) return;
      var rest = vlen(vsub(boneworld(s, b), boneworld(s, bonefind(s, b.parent))));
      var dx = c.p[0] - a.p[0];
      var dy = c.p[1] - a.p[1];
      var dz = c.p[2] - a.p[2];
      var d = Math.hypot(dx, dy, dz) || 0.0001;
      var diff = ((d - rest) / d) * 0.5;
      if (!a.pin) {
        a.p[0] += dx * diff;
        a.p[1] += dy * diff;
        a.p[2] += dz * diff;
      }
      if (!c.pin) {
        c.p[0] -= dx * diff;
        c.p[1] -= dy * diff;
        c.p[2] -= dz * diff;
      }
    });
  }
  s.bones.forEach(function (b) {
    var r = s.rag[b.id];
    if (r && r.p[1] < 0.05) {
      r.p[1] = 0.05;
      r.v[1] *= -0.24;
    }
    b.pos = [
      r.p[0] - (b.parent ? s.rag[b.parent].p[0] : 0),
      r.p[1] - (b.parent ? s.rag[b.parent].p[1] : 0),
      r.p[2] - (b.parent ? s.rag[b.parent].p[2] : 0)
    ];
  });
}

function ragdolltick(node, dt) {
  if (!node.ragdollon) return;
  if (!skindef(node).rag) ragdollinit(node);
  ragdollstep(node, dt);
}

function animnotifylist(node) {
  var s = skindef(node);
  s.notifies = s.notifies || [
    { clip: "walk", time: 0.25, event: "footstep" },
    { clip: "jump", time: 0.3, event: "takeoff" }
  ];
  return s.notifies;
}

function animnotifytick(node, t) {
  var s = skindef(node);
  if (!s.notifies || !s.current) return;
  var clip = s.clips[s.current];
  if (!clip) return;
  var tt = (t * (clip.speed || 1)) % (clip.len || 1);
  s.notifies.forEach(function (nt) {
    if (nt.clip !== s.current) return;
    if (Math.abs(nt.time - tt) < 0.035 && !nt.done) {
      nt.done = true;
      s.lastevent = nt.event;
      if (typeof runevents === "function") runevents(nt.event, node);
      if (typeof toast === "function") toast("Notify " + nt.event + " on " + node.name);
    }
    if (tt < 0.02) nt.done = false;
  });
}

function animnotifypanel() {
  var n = sknode(false);
  if (!n) {
    n = skinmeshnew("human");
    commit("skinned");
  }
  var list = animnotifylist(n);
  var body = '<div class="notifybody">' + u5sec("Animation events", "Notifies fired at clip times",
    '<div class="notifylist">' + list.map(function (nt, i) {
      return '<div class="notifyrow"><span class="nn">' + esc(nt.event) + '</span><span class="nc">' + esc(nt.clip) + "</span><span class=\"nt\">" + nt.time.toFixed(2) + " s</span>" +
        '<button class="iconbtn" data-notifydel="' + i + '">' + ic("trash", "ico-xs") + "</button></div>";
    }).join("") + "</div>" +
    '<div class="u5btns"><button class="btn" data-notifyact="add">Add notify</button></div>' +
    u5note("Notifies call the same event bus as the gameplay event nodes, so any handler bound to the event name fires.")) + "</div>";
  openmodal({
    title: "Animation Notifies",
    icon: "events",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-notifydel]").forEach(function (b) {
        b.addEventListener("click", function () {
          list.splice(parseInt(b.getAttribute("data-notifydel"), 10), 1);
          commit("notify");
          closemodal();
          setTimeout(animnotifypanel, 130);
        });
      });
      m.querySelectorAll("[data-notifyact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var clips = Object.keys(skindef(n).clips);
          list.push({ clip: clips[0] || "walk", time: Math.round(Math.random() * 100) / 100, event: "event" + (list.length + 1) });
          commit("notify");
          closemodal();
          setTimeout(animnotifypanel, 130);
        });
      });
    }
  });
}

function facialpanel() {
  var n = sknode(false);
  if (!n) {
    n = skinmeshnew("human");
    commit("skinned");
  }
  var s = skindef(n);
  s.morph = s.morph || {};
  if (!Object.keys(s.morph).length) {
    s.morph = { "Jaw open": 0, "Smile": 0, "Brow raise": 0, "Blink": 0 };
  }
  var body = '<div class="facebody">' + u5sec("Facial animation", "Morph target weights",
    Object.keys(s.morph).map(function (k) {
      return sliderrow(k, s.morph[k], 0, 1, 0.01, 'data-face="' + esc(k) + '"');
    }).join("") +
    '<div class="u5btns"><button class="btn" data-faceact="add">Add morph target</button>' +
    '<button class="btn ghost" data-faceact="blink">Blink burst</button>' +
    '<button class="btn ghost" data-faceact="talk">Talking loop</button></div>' +
    '<div class="landout" id="faceout">Blend weights applied to the head bone scale and jaw offset.</div>');
  body += u5sec("Eyes and gaze", "Parallax iris and catch lights",
    u5row("Eye actor", '<button class="btn ghost" data-faceact="eye">Add eye actor</button>') +
    u5note("Eye actors render a parallax iris disc with a moving catch light."));
  body += "</div>";
  openmodal({
    title: "Facial and Morph Animation",
    icon: "human",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-face]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          s.morph[inp.getAttribute("data-face")] = parseFloat(inp.value);
          commit("face");
        });
      });
      m.querySelectorAll("[data-faceact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-faceact");
          if (a === "add") {
            s.morph["Morph " + (Object.keys(s.morph).length + 1)] = 0;
            commit("face");
            closemodal();
            setTimeout(facialpanel, 130);
          } else if (a === "blink") {
            var out = qs("#faceout");
            var t0 = performance.now();
            s.morph["Blink"] = 1;
            var tick = setInterval(function () {
              var k = (performance.now() - t0) / 260;
              s.morph["Blink"] = Math.max(0, 1 - k);
              if (k >= 1) {
                clearInterval(tick);
                s.morph["Blink"] = 0;
              }
            }, 16);
            if (out) out.textContent = "Blink played over 260 ms.";
          } else if (a === "talk") {
            var out2 = qs("#faceout");
            var t1 = performance.now();
            var tick2 = setInterval(function () {
              var k2 = (performance.now() - t1) / 2000;
              s.morph["Jaw open"] = Math.abs(Math.sin(k2 * 14)) * 0.8;
              if (k2 >= 1) {
                clearInterval(tick2);
                s.morph["Jaw open"] = 0;
              }
            }, 16);
            if (out2) out2.textContent = "Talking loop running for 2 seconds.";
          } else if (a === "eye") {
            eyesnew();
            toast("Eye actor added", "ok");
          }
        });
      });
    }
  });
}

function skboot() {
}

function sksystick(node, dt, t) {
  if (typeof skeletontick === "function") skeletontick(node, dt, t);
  if (typeof animnotifytick === "function") animnotifytick(node, t);
  ragdolltick(node, dt);
  if (typeof skinmorphtick === "function") skinmorphtick(node);
}
