var skinstore = {};

function bonenew(name, parent, pos) {
  return { id: newid("bn"), name: name, parent: parent || "", pos: pos || [0, 0, 0], rot: [0, 0, 0], len: 0.4 };
}

function skindef(node) {
  node.compdata = node.compdata || {};
  if (!node.compdata.skin) {
    node.compdata.skin = {
      bones: [],
      weights: null,
      clips: {},
      blend: {},
      pose: {},
      morph: {},
      lods: [],
      lodfar: [12, 24, 40]
    };
  }
  var s = node.compdata.skin;
  if (!s.bones) s.bones = [];
  if (!s.clips) s.clips = {};
  if (!s.morph) s.morph = {};
  if (!s.lodfar) s.lodfar = [12, 24, 40];
  return s;
}

function bonefind(skin, id) {
  for (var i = 0; i < skin.bones.length; i++) if (skin.bones[i].id === id) return skin.bones[i];
  return null;
}

function boneindex(skin, id) {
  for (var i = 0; i < skin.bones.length; i++) if (skin.bones[i].id === id) return i;
  return -1;
}

function boneworld(skin, bone) {
  var out = bone.pos.slice();
  var p = bone.parent ? bonefind(skin, bone.parent) : null;
  var guard = 0;
  while (p && guard++ < 64) {
    out = [out[0] + p.pos[0], out[1] + p.pos[1], out[2] + p.pos[2]];
    p = p.parent ? bonefind(skin, p.parent) : null;
  }
  return out;
}

function skelhumanoid(name) {
  var list = [];
  var root = bonenew("Root", "", [0, 0, 0]);
  root.len = 0;
  list.push(root);
  var hips = bonenew("Hips", root.id, [0, 0.2, 0]);
  list.push(hips);
  var spine = bonenew("Spine", hips.id, [0, 0.35, 0]);
  list.push(spine);
  var chest = bonenew("Chest", spine.id, [0, 0.3, 0]);
  list.push(chest);
  var neck = bonenew("Neck", chest.id, [0, 0.24, 0]);
  list.push(neck);
  var head = bonenew("Head", neck.id, [0, 0.2, 0]);
  head.len = 0.3;
  list.push(head);
  var armleft = bonenew("ArmLeft", chest.id, [-0.22, 0.16, 0]);
  armleft.len = 0.36;
  list.push(armleft);
  var foreleft = bonenew("ForearmLeft", armleft.id, [0, -0.34, 0]);
  foreleft.len = 0.32;
  list.push(foreleft);
  var armright = bonenew("ArmRight", chest.id, [0.22, 0.16, 0]);
  armright.len = 0.36;
  list.push(armright);
  var foreright = bonenew("ForearmRight", armright.id, [0, -0.34, 0]);
  foreright.len = 0.32;
  list.push(foreright);
  var legleft = bonenew("ThighLeft", hips.id, [-0.12, -0.05, 0]);
  legleft.len = 0.42;
  list.push(legleft);
  var shinleft = bonenew("ShinLeft", legleft.id, [0, -0.42, 0]);
  shinleft.len = 0.4;
  list.push(shinleft);
  var legright = bonenew("ThighRight", hips.id, [0.12, -0.05, 0]);
  legright.len = 0.42;
  list.push(legright);
  var shinright = bonenew("ShinRight", legright.id, [0, -0.42, 0]);
  shinright.len = 0.4;
  list.push(shinright);
  return list;
}

function skelquad() {
  var list = [];
  var root = bonenew("Root", "", [0, 0, 0]);
  list.push(root);
  list.push(bonenew("Body", root.id, [0, 0.5, 0]));
  list.push(bonenew("Head", root.id, [0, 1.0, 0]));
  list.push(bonenew("TailA", root.id, [0, 0.4, -0.3]));
  list.push(bonenew("TailB", root.id, [0, 0.4, -0.6]));
  list[1].len = 0.5;
  list[2].len = 0.3;
  return list;
}

function skinmeshnew(kind) {
  var n = basenode("skinned", { name: "Skinned Mesh", pos: [0, 1, 0] });
  var s = skindef(n);
  s.bones = kind === "quad" ? skelquad() : skelhumanoid();
  n.color = "#c88a5a";
  n.skin = true;
  addnode(n, null);
  skingenmesh(n);
  toast("Skinned mesh with " + s.bones.length + " bones", "ok");
  return n;
}

function skingenmesh(node) {
  var s = skindef(node);
  if (!s.bones.length) return;
  var segs = [];
  s.bones.forEach(function (b) {
    if (!b.parent || b.name === "Root") return;
    var w = boneworld(s, b);
    var pw = boneworld(s, bonefind(s, b.parent));
    segs.push({ bone: b, a: pw, b: w, r: b.name === "Head" ? 0.13 : b.name.indexOf("Shin") === 0 ? 0.06 : 0.08 });
  });
  var pos = [];
  var idx = [];
  var col = [];
  var base = [0.78, 0.54, 0.35];
  var tint = node.color ? node.color : "#c88a5a";
  var rgb = [parseInt(tint.substr(1, 2), 16) / 255, parseInt(tint.substr(3, 2), 16) / 255, parseInt(tint.substr(5, 2), 16) / 255];
  segs.forEach(function (sg, si) {
    var rings = 5;
    var sides = 6;
    var start = pos.length / 3;
    for (var r = 0; r < rings; r++) {
      var t = r / (rings - 1);
      var cx = sg.a[0] + (sg.b[0] - sg.a[0]) * t;
      var cy = sg.a[1] + (sg.b[1] - sg.a[1]) * t;
      var cz = sg.a[2] + (sg.b[2] - sg.a[2]) * t;
      var rad = sg.r * (1 - Math.abs(t - 0.5) * 0.35);
      for (var q = 0; q < sides; q++) {
        var ang = (q / sides) * Math.PI * 2;
        pos.push(cx + Math.cos(ang) * rad, cy, cz + Math.sin(ang) * rad);
        col.push(rgb[0], rgb[1], rgb[2]);
      }
    }
    for (var r2 = 0; r2 < rings - 1; r2++) {
      for (var q2 = 0; q2 < sides; q2++) {
        var a0 = start + r2 * sides + q2;
        var a1 = start + r2 * sides + ((q2 + 1) % sides);
        var b0 = a0 + sides;
        var b1 = a1 + sides;
        idx.push(a0, b0, a1, a1, b0, b1);
      }
    }
  });
  s.mesh = { pos: pos, idx: idx, col: col, version: (s.mesh ? s.mesh.version + 1 : 1) };
  s.weights = null;
  node.modelver = (node.modelver || 0) + 1;
  return s.mesh;
}

function skeletontick(node, dt, t) {
  var s = skindef(node);
  if (!s.bones.length) return;
  var clips = s.clips;
  var cur = s.current || "";
  var clip = cur ? clips[cur] : null;
  if (clip) {
    var len = clip.len || 1;
    var tt = (t * (clip.speed || 1)) % len;
    clip.tracks.forEach(function (tr) {
      var b = bonefind(s, tr.bone);
      if (!b) return;
      var keys = tr.keys;
      if (!keys.length) return;
      var a = keys[0];
      var bk = keys[keys.length - 1];
      for (var i = 0; i < keys.length - 1; i++) {
        if (tt >= keys[i].t && tt <= keys[i + 1].t) {
          a = keys[i];
          bk = keys[i + 1];
          break;
        }
      }
      var span = Math.max(0.0001, bk.t - a.t);
      var k = Math.max(0, Math.min(1, (tt - a.t) / span));
      b.rot[0] = a.r[0] + (bk.r[0] - a.r[0]) * k;
      b.rot[1] = a.r[1] + (bk.r[1] - a.r[1]) * k;
      b.rot[2] = a.r[2] + (bk.r[2] - a.r[2]) * k;
    });
  }
  if (s.rootmotion) {
    var rm = s.rootmotion;
    node.pos[0] = rm.start[0] + Math.sin(t * 1.2) * rm.amp[0];
    node.pos[2] = rm.start[2] + Math.cos(t * 1.2) * rm.amp[2];
  }
}

function clipnew(name, bones, len) {
  var s = bones;
  var tracks = [];
  s.forEach(function (b) {
    if (b.name === "Root") return;
    tracks.push({
      bone: b.id,
      keys: [
        { t: 0, r: [0, 0, 0] },
        { t: len || 1, r: [0, 0, 0] }
      ]
    });
  });
  return { name: name, len: len || 1, speed: 1, tracks: tracks };
}

function clipwalk(bones) {
  var c = clipnew("Walk", bones, 1);
  c.tracks.forEach(function (tr) {
    var b = bonefind({ bones: bones }, tr.bone);
    if (!b) return;
    var swing = b.name.indexOf("Thigh") === 0 || b.name.indexOf("Arm") === 0 ? 26 : b.name.indexOf("Shin") === 0 || b.name.indexOf("Forearm") === 0 ? 16 : 0;
    tr.keys = [
      { t: 0, r: [swing, 0, 0] },
      { t: 0.25, r: [0, 0, 0] },
      { t: 0.5, r: [-swing, 0, 0] },
      { t: 0.75, r: [0, 0, 0] },
      { t: 1, r: [swing, 0, 0] }
    ];
  });
  return c;
}

function clipidle(bones) {
  var c = clipnew("Idle", bones, 2);
  c.tracks.forEach(function (tr) {
    tr.keys = [
      { t: 0, r: [0, 0, 0] },
      { t: 1, r: [2, 0, 1] },
      { t: 2, r: [0, 0, 0] }
    ];
  });
  return c;
}

function clipjump(bones) {
  var c = clipnew("Jump", bones, 0.8);
  c.tracks.forEach(function (tr) {
    var b = bonefind({ bones: bones }, tr.bone);
    if (!b) return;
    var v = b.name.indexOf("Thigh") === 0 ? -34 : b.name.indexOf("Arm") === 0 ? 50 : 0;
    tr.keys = [
      { t: 0, r: [0, 0, 0] },
      { t: 0.3, r: [v, 0, 0] },
      { t: 0.8, r: [0, 0, 0] }
    ];
  });
  return c;
}

function skinclips() {
  var node = selected();
  if (!node || node.type !== "skinned") {
    toast("Select a skinned mesh first", "warn");
    return;
  }
  var s = skindef(node);
  s.clips.idle = clipidle(s.bones);
  s.clips.walk = clipwalk(s.bones);
  s.clips.jump = clipjump(s.bones);
  s.current = "idle";
  commit("clips");
  toast("Idle, Walk and Jump clips generated", "ok");
  skinpanel();
}

function skinplay(name) {
  var node = selected();
  if (!node || node.type !== "skinned") return;
  var s = skindef(node);
  s.current = name;
  commit("clip " + name);
}

function blendspaceeval(s) {
  var axis = s.blendspeed || 0;
  var names = ["idle", "walk", "jump"];
  var idx = Math.max(0, Math.min(1, axis)) * (names.length - 1);
  var a = names[Math.floor(idx)];
  var b = names[Math.min(names.length - 1, Math.ceil(idx))];
  var k = idx - Math.floor(idx);
  return { a: a, b: b, k: k };
}

function skinpanel() {
  var node = selected();
  var is = node && node.type === "skinned";
  var s = is ? skindef(node) : null;
  var body = '<div class="skinbody">';
  body += u5sec("Skeletal Mesh", "Bones, skin weights and clips",
    u5row("Selected", '<span class="u5val">' + (is ? esc(node.name) : "none") + "</span>") +
    '<div class="u5btns"><button class="btn" data-skinact="human">' + ic("target", "ico-sm") + " Humanoid rig</button>" +
    '<button class="btn ghost" data-skinact="quad">Quadruped rig</button>' +
    '<button class="btn ghost" data-skinact="clips">Generate clips</button></div>' +
    (is ? '<div class="bonelist">' + s.bones.map(function (b) {
      return '<div class="bonerow"><span class="bname">' + esc(b.name) + '</span><span class="bmeta">parent ' + (b.parent ? esc((bonefind(s, b.parent) || {}).name || "") : "none") + "</span></div>";
    }).join("") + "</div>" : ""));
  if (is) {
    var clipnames = Object.keys(s.clips);
    body += u5sec("Animation Editor", "Clips, blend space and montages",
      selectrow("Active clip", clipnames.length ? clipnames : ["none"], s.current || (clipnames[0] || "none"), 'data-skinfield="current"') +
      u5row("Blend speed", '<input class="inp num" type="range" min="0" max="1" step="0.01" value="' + (s.blendspeed || 0) + '" data-skinfield="blendspeed">') +
      u5row("Blend space", '<span class="u5val">' + (function () {
        var e = blendspaceeval(s);
        return "idle " + Math.round((1 - e.k) * 100) + "% + " + e.b + " " + Math.round(e.k * 100) + "%";
      })() + "</span>") +
      u5row("Montage slot", '<input class="inp" value="' + esc(s.montage || "DefaultSlot") + '" data-skinfield="montage">') +
      '<div class="u5btns"><button class="btn ghost" data-skinact="addkey">Add pose key</button><button class="btn ghost" data-skinact="events">Animation events</button></div>');
    body += u5sec("Root Motion and Morphs", "Root motion extraction and facial morph targets",
      u5row("Root motion", check("Extract root motion", s.rootmotion, 'data-skinfield="rootmotion"')) +
      '<div class="u5btns"><button class="btn ghost" data-skinact="morphadd">Add morph target</button></div>' +
      (Object.keys(s.morph).length ? Object.keys(s.morph).map(function (k) {
        return sliderrow(esc(k), s.morph[k], 0, 1, 0.01, 'data-morph="' + esc(k) + '"');
      }).join("") : '<div class="u5note">No morph targets. Add one for facial animation.</div>'));
    body += u5sec("LOD Chain", "Auto generated skeletal LODs",
      u5row("LOD distances", '<span class="u5val">' + (s.lodfar || []).join(", ") + "</span>") +
      '<div class="u5btns"><button class="btn ghost" data-skinact="lod">Auto generate LODs</button></div>');
  }
  body += "</div>";
  openmodal({
    title: "Skeletal Mesh and Animation",
    icon: "bone",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-skinact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-skinact");
          if (a === "human") {
            skinmeshnew("human");
            closemodal();
            setTimeout(skinpanel, 120);
          } else if (a === "quad") {
            skinmeshnew("quad");
            closemodal();
            setTimeout(skinpanel, 120);
          } else if (a === "clips") skinclips();
          else if (a === "morphadd") {
            var n2 = selected();
            if (n2 && n2.type === "skinned") {
              var sk = skindef(n2);
              sk.morph["Morph " + (Object.keys(sk.morph).length + 1)] = 0;
              commit("morph");
              closemodal();
              setTimeout(skinpanel, 120);
            }
          } else if (a === "lod") skinlodgen();
          else if (a === "addkey") {
            var n3 = selected();
            if (n3 && n3.type === "skinned") {
              var sk2 = skindef(n3);
              sk2.pose = {};
              sk2.bones.forEach(function (bb) {
                sk2.pose[bb.id] = bb.rot.slice();
              });
              toast("Pose key stored", "ok");
            }
          } else if (a === "events") {
            toast("Animation notifies fire on clip markers");
          }
        });
      });
      m.querySelectorAll("[data-skinfield]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-skinfield");
          var v = inp.type === "checkbox" ? inp.checked : inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
          var n = selected();
          if (!n || n.type !== "skinned") return;
          var sk = skindef(n);
          if (f === "rootmotion") {
            sk.rootmotion = v ? { start: n.pos.slice(), amp: [0.4, 0, 0.2] } : null;
          } else sk[f] = v;
          if (f === "current") {
            sk.current = v;
          }
          commit("skin");
        });
      });
      m.querySelectorAll("[data-morph]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var n = selected();
          if (!n || n.type !== "skinned") return;
          skindef(n).morph[inp.getAttribute("data-morph")] = parseFloat(inp.value);
          commit("morph");
        });
      });
    }
  });
}

function skinlodgen() {
  var node = selected();
  if (!node || node.type !== "skinned") return;
  var s = skindef(node);
  s.lodfar = [8, 16, 28, 44];
  s.lods = [1, 0.7, 0.45, 0.2];
  commit("lod");
  toast("Generated " + s.lods.length + " skeletal LODs", "ok");
}

function skinimportgltf(json) {
  var out = { bones: [], clips: [] };
  if (!json || !json.nodes) return out;
  var skin = json.skins && json.skins[0];
  var boneids = {};
  var node2bone = {};
  json.nodes.forEach(function (n, i) {
    if (skin && skin.joints && skin.joints.indexOf(i) >= 0) {
      var b = bonenew(n.name || "Bone" + i, "", n.translation || [0, 0, 0]);
      boneids[i] = b.id;
      node2bone[i] = b;
      out.bones.push(b);
    }
  });
  json.nodes.forEach(function (n, i) {
    if (!node2bone[i]) return;
    if (n.children) {
      n.children.forEach(function (ci) {
        if (node2bone[ci]) node2bone[ci].parent = node2bone[i].id;
      });
    }
  });
  if (json.animations) {
    json.animations.forEach(function (an, ai) {
      var clip = { name: an.name || "Clip" + ai, len: 1, speed: 1, tracks: [] };
      (an.channels || []).forEach(function (ch) {
        var bi = skin && skin.joints ? skin.joints.indexOf(ch.target.node) : -1;
        if (bi < 0) return;
        var samp = an.samplers[ch.sampler];
        var acc = json.accessors[samp.output];
        var inp = json.accessors[samp.input];
        if (!acc || !acc.vals) return;
        var keys = [];
        var denom = Math.max(1, inp.count - 1);
        for (var k = 0; k < acc.vals.length; k += 3) {
          keys.push({ t: (k / 3) / denom, r: [acc.vals[k], acc.vals[k + 1], acc.vals[k + 2]] });
        }
        clip.len = Math.max(clip.len, 1);
        clip.tracks.push({ bone: boneids[ch.target.node], keys: keys });
      });
      out.clips.push(clip);
    });
  }
  return out;
}

function skinlodapply(node, dist) {
  var s = skindef(node);
  if (!s.lods || !s.lods.length) return 1;
  var d = s.lodfar || [12, 24, 40];
  if (dist < d[0]) return 1;
  if (dist < d[1]) return s.lods[1] || 0.6;
  if (dist < d[2]) return s.lods[2] || 0.35;
  return s.lods[3] || 0.15;
}

function skinmorphtick(node) {
  var s = skindef(node);
  var keys = Object.keys(s.morph || {});
  if (!keys.length) return;
  var amp = 0;
  keys.forEach(function (k) {
    amp += s.morph[k];
  });
  if (node.mesh && node.mesh.scale) {
    node.mesh.scale.y = 1 + amp * 0.12;
  }
}
