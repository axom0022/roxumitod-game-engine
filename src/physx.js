var px = {
  layers: ["default", "player", "enemy", "world", "trigger", "debris", "vehicle", "water"],
  matrix: {},
  ccd: true,
  fields: [],
  chunks: [],
  fluid: []
};

function pxlayers() {
  if (Object.keys(px.matrix).length) return px.matrix;
  px.layers.forEach(function (a) {
    px.layers.forEach(function (b) {
      px.matrix[a + "|" + b] = true;
    });
  });
  return px.matrix;
}

function pxcanhit(a, b) {
  var m = pxlayers();
  return m[a + "|" + b] !== false;
}

function pxlayerof(node) {
  if (!node) return "default";
  return node.collayer || "default";
}

function pxsetlayer(node, layer) {
  node.collayer = layer;
  commit("layer");
}

function collisionpanel() {
  var m = pxlayers();
  var body = '<div class="colbody">' + u5sec("Collision channels", "Which layers collide with which",
    '<div class="matrixtable"><div class="mtrow mthead"><span></span>' + px.layers.map(function (l) {
      return "<span>" + esc(l.slice(0, 4)) + "</span>";
    }).join("") + "</div>" +
    px.layers.map(function (a) {
      return '<div class="mtrow"><span class="mtk">' + esc(a) + "</span>" + px.layers.map(function (b) {
        var on = m[a + "|" + b] !== false;
        return '<button class="mtcell' + (on ? " on" : "") + '" data-colpair="' + a + "|" + b + '"></button>';
      }).join("") + "</div>";
    }).join("") + "</div>") + "</div>";
  openmodal({
    title: "Collision Filtering",
    icon: "collider",
    width: "wide",
    body: body,
    onmount: function (mod) {
      mod.querySelectorAll("[data-colpair]").forEach(function (b) {
        b.addEventListener("click", function () {
          var key = b.getAttribute("data-colpair");
          px.matrix[key] = px.matrix[key] === false ? true : false;
          var parts = key.split("|");
          px.matrix[parts[1] + "|" + parts[0]] = px.matrix[key];
          b.classList.toggle("on", px.matrix[key]);
          commit("collision");
        });
      });
    }
  });
}

function ccdpanel() {
  var body = '<div class="ccdbody">' + u5sec("Continuous collision", "Swept volume tests for fast actors",
    u5row("Continuous detection", check("Enable swept tests", px.ccd, 'data-ccd="on"')) +
    sliderrow("Speed threshold", px.ccdspeed === undefined ? 6 : px.ccdspeed, 0.5, 40, 0.5, 'data-ccd="speed"') +
    u5row("Substeps", '<input class="inp num" type="number" min="1" max="16" value="' + (px.ccdsteps || 4) + '" data-ccd="steps">') +
    u5note("Actors faster than the threshold are swept along their motion vector and the earliest contact is resolved before the move commits.")) + "</div>";
  openmodal({
    title: "Continuous Collision",
    icon: "move",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-ccd]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-ccd");
          if (f === "on") px.ccd = inp.checked;
          else if (f === "speed") px.ccdspeed = parseFloat(inp.value);
          else px.ccdsteps = parseInt(inp.value, 10) || 4;
          commit("ccd");
        });
      });
    }
  });
}

function ccdsweep(from, to, half) {
  var steps = Math.max(1, px.ccdsteps || 4);
  var dir = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  var dist = Math.hypot(dir[0], dir[1], dir[2]);
  if (dist < 0.0001) return null;
  for (var i = 1; i <= steps; i++) {
    var t = i / steps;
    var p = [from[0] + dir[0] * t, from[1] + dir[1] * t, from[2] + dir[2] * t];
    var hit = null;
    (phys.bodies || []).forEach(function (b) {
      if (!b.node || !b.aabb) return;
      var bb = b.aabb;
      if (p[0] + half[0] > bb.min[0] && p[0] - half[0] < bb.max[0] && p[1] + half[1] > bb.min[1] && p[1] - half[1] < bb.max[1] && p[2] + half[2] > bb.min[2] && p[2] - half[2] < bb.max[2]) {
        if (!hit) hit = { t: t, node: b.node, point: p.slice() };
      }
    });
    if (hit) return hit;
  }
  return null;
}

function fieldnew(kind) {
  var n = basenode("empty", { name: "Field " + kind, pos: [app.cam.target[0], 1, app.cam.target[2]] });
  n.field = { kind: kind, radius: 6, strength: 6, axis: [0, 1, 0], falloff: "linear", mask: "default" };
  addnode(n, null);
  toast("Field " + kind + " added", "ok");
  return n;
}

function fieldforce(f, p) {
  var c = worldpos(f.fieldnode || f);
  var dx = p[0] - c[0];
  var dy = p[1] - c[1];
  var dz = p[2] - c[2];
  var d = Math.hypot(dx, dy, dz) || 0.0001;
  var spec = f.field || f;
  var rad = spec.radius || 6;
  if (d > rad) return [0, 0, 0];
  var fall = spec.falloff === "inverse" ? rad / d : 1 - d / rad;
  var s = (spec.strength || 6) * fall;
  if (spec.kind === "radial") return [dx / d * s, dy / d * s, dz / d * s];
  if (spec.kind === "gravity") return [dx / d * -s, dy / d * -s, dz / d * -s];
  if (spec.kind === "vortex") return [-dz / d * s, 0, dx / d * s];
  if (spec.kind === "wind") return [spec.axis[0] * s, spec.axis[1] * s, spec.axis[2] * s];
  if (spec.kind === "drag") return [-dx * s * 0.2, -dy * s * 0.2, -dz * s * 0.2];
  if (spec.kind === "noise") return [Math.sin(p[1] * 3.1) * s * 0.4, Math.cos(p[2] * 2.7) * s * 0.4, Math.sin(p[0] * 3.6) * s * 0.4];
  return [0, 0, 0];
}

function fieldtick(dt) {
  var fields = [];
  walk(app.scene.objects, function (n) {
    if (n.field) fields.push(n);
  });
  if (!fields.length) return;
  (phys.bodies || []).forEach(function (b) {
    if (!b.node || !b.vel) return;
    var p = [b.node.pos[0], b.node.pos[1], b.node.pos[2]];
    fields.forEach(function (f) {
      var force = fieldforce(f, p);
      b.vel[0] += force[0] * dt;
      b.vel[1] += force[1] * dt;
      b.vel[2] += force[2] * dt;
    });
  })
}

function fieldpanel() {
  var f = null;
  walk(app.scene.objects, function (n) {
    if (n.field && !f) f = n;
  });
  var body = '<div class="fieldbody">' + u5sec("Fields and forces", "Radial, vortex, wind, drag and noise",
    '<div class="u5btns"><button class="btn" data-fieldadd="radial">Radial</button>' +
    '<button class="btn ghost" data-fieldadd="gravity">Gravity</button>' +
    '<button class="btn ghost" data-fieldadd="vortex">Vortex</button>' +
    '<button class="btn ghost" data-fieldadd="wind">Wind</button>' +
    '<button class="btn ghost" data-fieldadd="drag">Drag</button>' +
    '<button class="btn ghost" data-fieldadd="noise">Noise</button></div>' +
    (f ? u5row("Selected field", '<span class="u5val">' + esc(f.name) + "</span>") +
      sliderrow("Radius", f.field.radius, 0.5, 40, 0.5, 'data-fdf="radius"') +
      sliderrow("Strength", f.field.strength, -30, 30, 0.5, 'data-fdf="strength"') +
      selectrow("Falloff", ["linear", "inverse"], f.field.falloff, 'data-fdf="falloff"') +
      u5row("Axis", '<input class="inp" value="' + f.field.axis.join(",") + '" data-fdf="axis">') +
      '<div class="u5btns"><button class="btn ghost" data-fieldadd="remove">Remove field</button></div>'
      : u5note("No field actors yet.")) +
    u5note("Fields push every dynamic physics body inside their radius. Pair with a particles system for smoke."));
  body += "</div>";
  openmodal({
    title: "Fields and Forces",
    icon: "sparkle",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-fieldadd]").forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-fieldadd");
          if (k === "remove") {
            if (f) {
              app.scene.objects = app.scene.objects.filter(function (x) {
                return x.id !== f.id;
              });
              commit("field");
              refreshall();
            }
          } else fieldnew(k);
          closemodal();
          setTimeout(fieldpanel, 130);
        });
      });
      m.querySelectorAll("[data-fdf]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          if (!f) return;
          var k = inp.getAttribute("data-fdf");
          if (k === "axis") f.field.axis = inp.value.split(",").map(parseFloat);
          else if (k === "falloff") f.field.falloff = inp.value;
          else f.field[k] = parseFloat(inp.value);
          commit("field");
        });
      });
    }
  });
}

function vehiclenew() {
  var n = basenode("cube", { name: "Vehicle", pos: [app.cam.target[0], 0.8, app.cam.target[2]] });
  n.scl = [1.9, 0.55, 3.6];
  n.color = "#c94f4f";
  n.comps = (n.comps || []).concat(["physics"]);
  n.compdata = n.compdata || {};
  n.compdata.physics = { mode: "dynamic", mass: 900 };
  n.vehicle = { wheels: 4, wheelbase: 2.6, track: 1.7, engine: 260, brake: 30, steer: 32, susp: 0.28, grip: 1.1, speed: 0, steerangle: 0, gear: 1 };
  addnode(n, null);
  toast("Vehicle with four wheel suspension added", "ok");
  return n;
}

function vehiclestep(n, dt, input) {
  var v = n.vehicle;
  if (!v) return;
  var throttle = input && input.forward ? 1 : input && input.back ? -1 : 0;
  var brake = input && input.brake ? 1 : 0;
  var steerin = input ? input.right - input.left : 0;
  v.speed += throttle * (v.engine / 60) * dt;
  v.speed -= v.speed * 0.9 * dt;
  if (brake) v.speed -= Math.sign(v.speed) * v.brake * dt;
  v.speed = Math.max(-22, Math.min(38, v.speed));
  v.steerangle += (steerin * v.steer - v.steerangle) * Math.min(1, dt * 6);
  var yaw = Math.atan2(v.steerangle, 8) * (v.speed / 12);
  n.rot[1] += yaw * dt * 57.3;
  var fwd = [Math.sin(n.rot[1] * Math.PI / 180), 0, Math.cos(n.rot[1] * Math.PI / 180)];
  n.pos[0] += fwd[0] * v.speed * dt;
  n.pos[2] += fwd[2] * v.speed * dt;
  var ground = typeof terrainheightat === "function" ? terrainheightat(n.pos[0], n.pos[2]) : 0;
  var target = ground + 0.55 + Math.sin(performance.now() * 0.012) * 0.01 * v.susp;
  n.pos[1] += (target - n.pos[1]) * Math.min(1, dt * 12);
  v.gear = Math.max(1, Math.min(6, Math.ceil(Math.abs(v.speed) / 6.5)));
}

function vehiclepanel() {
  var n = null;
  walk(app.scene.objects, function (x) {
    if (x.vehicle && !n) n = x;
  });
  var body = '<div class="vehbody">' + u5sec("Vehicle physics", "Suspension, engine and steering",
    (n ? u5row("Vehicle", '<span class="u5val">' + esc(n.name) + "</span>") +
      sliderrow("Engine power", n.vehicle.engine, 40, 900, 5, 'data-veh="engine"') +
      sliderrow("Brake force", n.vehicle.brake, 5, 90, 1, 'data-veh="brake"') +
      sliderrow("Steer angle", n.vehicle.steer, 5, 60, 1, 'data-veh="steer"') +
      sliderrow("Suspension", n.vehicle.susp, 0.05, 1, 0.01, 'data-veh="susp"') +
      sliderrow("Grip", n.vehicle.grip, 0.1, 3, 0.01, 'data-veh="grip"') +
      u5row("Wheels", '<input class="inp num" type="number" min="3" max="8" value="' + n.vehicle.wheels + '" data-veh="wheels">') +
      u5row("Live", '<span class="u5val" id="vehlive">speed 0, gear 1</span>')
      : u5note("No vehicle yet, add one below.")) +
    '<div class="u5btns"><button class="btn" data-vehact="add">Add vehicle</button>' +
    '<button class="btn ghost" data-vehact="drive">Test drive in PIE</button></div>');
  body += "</div>";
  openmodal({
    title: "Vehicle",
    icon: "car",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-veh]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          if (!n) return;
          n.vehicle[inp.getAttribute("data-veh")] = parseFloat(inp.value);
          commit("vehicle");
        });
      });
      m.querySelectorAll("[data-vehact]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.getAttribute("data-vehact") === "add") vehiclenew();
          else if (typeof toggleplay === "function") toggleplay();
          closemodal();
        });
      });
    }
  });
}

function charnew() {
  var n = basenode("capsule", { name: "Character", pos: [app.cam.target[0], 1, app.cam.target[2]] });
  n.scl = [0.5, 1, 0.5];
  n.color = "#4f7fc9";
  n.charsys = { radius: 0.32, height: 1.7, step: 0.36, slope: 48, snap: 0.3, speed: 5.2, jump: 6.4, vy: 0, grounded: false };
  addnode(n, null);
  toast("Character controller added", "ok");
  return n;
}

function charstep(n, dt, input) {
  var c = n.charsys;
  if (!c) return;
  var mvx = 0;
  var mvz = 0;
  if (input) {
    mvx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    mvz = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
  }
  var yaw = (app.camstate && app.camstate.yaw) || app.cam.yaw || 0;
  var siny = Math.sin(yaw * Math.PI / 180);
  var cosy = Math.cos(yaw * Math.PI / 180);
  var wx = mvx * cosy - mvz * siny;
  var wz = mvx * siny + mvz * cosy;
  var ground = typeof terrainheightat === "function" ? terrainheightat(n.pos[0], n.pos[2]) : 0;
  var tryx = n.pos[0] + wx * c.speed * dt;
  var tryz = n.pos[2] + wz * c.speed * dt;
  var tryh = typeof terrainheightat === "function" ? terrainheightat(tryx, tryz) : 0;
  var slope = Math.abs(tryh - ground) / Math.max(0.0001, Math.hypot(tryx - n.pos[0], tryz - n.pos[2])) * 57.3;
  if (slope <= c.slope || tryh < ground) {
    n.pos[0] = tryx;
    n.pos[2] = tryz;
  }
  c.vy -= 18 * dt;
  if (input && input.jump && c.grounded) {
    c.vy = c.jump;
    c.grounded = false;
  }
  n.pos[1] += c.vy * dt;
  var feet = ground + c.height / 2;
  if (n.pos[1] < feet) {
    n.pos[1] = feet;
    c.vy = 0;
    c.grounded = true;
  } else if (n.pos[1] - feet < c.snap && c.vy <= 0) {
    n.pos[1] = feet;
    c.vy = 0;
    c.grounded = true;
  } else c.grounded = false;
  c.stepup = slope > c.slope;
}

function charpanel() {
  var n = null;
  walk(app.scene.objects, function (x) {
    if (x.charsys && !n) n = x;
  });
  var body = '<div class="charbody">' + u5sec("Character controller", "Capsule with step height and slope limit",
    (n ? u5row("Character", '<span class="u5val">' + esc(n.name) + "</span>") +
      sliderrow("Radius", n.charsys.radius, 0.1, 1.5, 0.01, 'data-char="radius"') +
      sliderrow("Height", n.charsys.height, 0.4, 3, 0.05, 'data-char="height"') +
      sliderrow("Step height", n.charsys.step, 0.05, 1, 0.01, 'data-char="step"') +
      sliderrow("Slope limit", n.charsys.slope, 5, 85, 1, 'data-char="slope"') +
      sliderrow("Ground snap", n.charsys.snap, 0, 1, 0.01, 'data-char="snap"') +
      sliderrow("Move speed", n.charsys.speed, 0.5, 20, 0.1, 'data-char="speed"') +
      sliderrow("Jump velocity", n.charsys.jump, 1, 20, 0.1, 'data-char="jump"')
      : u5note("No character yet.")) +
    '<div class="u5btns"><button class="btn" data-charact="add">Add character</button></div>' +
    u5note("Run in PIE with arrow keys. Grounded, slope rejection and step up are evaluated every frame."));
  body += "</div>";
  openmodal({
    title: "Character Controller",
    icon: "human",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-char]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          if (!n) return;
          n.charsys[inp.getAttribute("data-char")] = parseFloat(inp.value);
          commit("character");
        });
      });
      m.querySelectorAll("[data-charact]").forEach(function (b) {
        b.addEventListener("click", function () {
          charnew();
          closemodal();
          setTimeout(charpanel, 130);
        });
      });
    }
  });
}

function jointnew(kind) {
  var nodes = selectionnodes();
  if (nodes.length < 2) {
    toast("Select two actors to join", "warn");
    return;
  }
  var j = {
    id: newid("jt"),
    kind: kind || "hinge",
    a: nodes[0].id,
    b: nodes[1].id,
    rest: 0,
    stiffness: 0.6,
    damping: 0.3,
    min: -45,
    max: 45,
    axis: [0, 1, 0]
  };
  app.scene.env = app.scene.env || {};
  app.scene.env.constraints = app.scene.env.constraints || [];
  app.scene.env.constraints.push(j);
  commit("joint");
  toast(kind + " joint created between " + nodes[0].name + " and " + nodes[1].name, "ok");
  return j;
}

function jointtick(dt) {
  var env = app.scene.env;
  if (!env || !env.constraints) return;
  env.constraints.forEach(function (j) {
    var a = findnode(app.scene.objects, j.a);
    var b = findnode(app.scene.objects, j.b);
    if (!a || !b) return;
    var d = [b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]];
    var dist = Math.hypot(d[0], d[1], d[2]);
    if (j.kind === "distance" || j.kind === "spring") {
      var target = j.rest || 2;
      var err = dist - target;
      var k = (j.stiffness || 0.6) * (j.kind === "spring" ? 0.4 : 1);
      var corr = err * k * Math.min(1, dt * 30);
      if (dist > 0.0001) {
        b.pos[0] -= d[0] / dist * corr * 0.5;
        b.pos[1] -= d[1] / dist * corr * 0.5;
        b.pos[2] -= d[2] / dist * corr * 0.5;
      }
    } else if (j.kind === "fixed") {
      b.pos[0] = a.pos[0] + (j.rest === 0 ? 0 : d[0]);
      b.pos[2] = a.pos[2] + d[2];
    } else if (j.kind === "hinge" || j.kind === "ball") {
      var ang = Math.atan2(d[0], d[2]) * 180 / Math.PI;
      var clamped = Math.max(j.min, Math.min(j.max, ang));
      if (ang !== clamped) {
        var rad = clamped * Math.PI / 180;
        b.pos[0] = a.pos[0] + Math.sin(rad) * dist;
        b.pos[2] = a.pos[2] + Math.cos(rad) * dist;
      }
    }
  });
}

function jointpanel() {
  var env = app.scene.env || {};
  var list = env.constraints || [];
  var body = '<div class="jointpanel">' + u5sec("Joints and constraints", "Hinge, ball, spring, distance and fixed",
    '<div class="u5btns"><button class="btn" data-jadd="hinge">Hinge</button>' +
    '<button class="btn ghost" data-jadd="ball">Ball socket</button>' +
    '<button class="btn ghost" data-jadd="spring">Spring</button>' +
    '<button class="btn ghost" data-jadd="distance">Distance</button>' +
    '<button class="btn ghost" data-jadd="fixed">Fixed</button></div>' +
    (list.length ? '<div class="jointlistp">' + list.map(function (j, i) {
      var a = findnode(app.scene.objects, j.a);
      var b = findnode(app.scene.objects, j.b);
      return '<div class="jointrowp"><span class="jk">' + esc(j.kind) + '</span><span class="jn">' + esc((a && a.name) || "?") + " to " + esc((b && b.name) || "?") + "</span>" +
        '<input class="inp num" type="number" value="' + j.rest + '" data-jrest="' + i + '" title="rest length">' +
        '<button class="iconbtn" data-jdel="' + i + '">' + ic("trash", "ico-xs") + "</button></div>";
    }).join("") + "</div>" : u5note("Select two actors then create a joint."))) + "</div>";
  openmodal({
    title: "Physics Constraints",
    icon: "network",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-jadd]").forEach(function (b) {
        b.addEventListener("click", function () {
          jointnew(b.getAttribute("data-jadd"));
          closemodal();
          setTimeout(jointpanel, 130);
        });
      });
      m.querySelectorAll("[data-jrest]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var i = parseInt(inp.getAttribute("data-jrest"), 10);
          env.constraints[i].rest = parseFloat(inp.value) || 0;
          commit("joint");
        });
      });
      m.querySelectorAll("[data-jdel]").forEach(function (b) {
        b.addEventListener("click", function () {
          env.constraints.splice(parseInt(b.getAttribute("data-jdel"), 10), 1);
          commit("joint");
          closemodal();
          setTimeout(jointpanel, 130);
        });
      });
    }
  });
}

function fracturerun(node, depth, maxdepth) {
  var d = depth || 0;
  var md = maxdepth === undefined ? 3 : maxdepth;
  if (!node) return 0;
  var t0 = performance.now();
  var chunks = [];
  function split(level, w, h, d2, ox, oy, oz, par) {
    if (level > md) return;
    var n = basenode("cube", { name: "Chunk", pos: [par.pos[0] + ox, par.pos[1] + oy, par.pos[2] + oz] });
    n.scl = [w, h, d2];
    n.color = par.color || "#b9bdc4";
    n.fragment = { depth: level, id: par.id };
    chunks.push(n);
    if (level < md) {
      var sx = w / 2;
      var sy = h / 2;
      var sz = d2 / 2;
      split(level + 1, sx * 0.96, sy * 0.96, sz * 0.96, -sx * 0.52, -sy * 0.52, 0, n);
      split(level + 1, sx * 0.96, sy * 0.96, sz * 0.96, sx * 0.52, sy * 0.52, 0, n);
      split(level + 1, sx * 0.96, sy * 0.96, sz * 0.96, -sx * 0.52, sy * 0.52, 0, n);
      split(level + 1, sx * 0.96, sy * 0.96, sz * 0.96, sx * 0.52, -sy * 0.52, 0, n);
    }
  }
  var s = nodesize(node);
  split(1, s[0], s[1], 0.12, 0, 0, 0, node);
  node.visible = false;
  chunks.forEach(function (c) {
    addnode(c, null);
  });
  var ms = Math.round(performance.now() - t0);
  toast("Fractured into " + chunks.length + " chunks, depth " + md + ", " + ms + " ms", "ok");
  return chunks.length;
}

function destructionpanel() {
  var n = selected();
  var body = '<div class="destbody">' + u5sec("Destruction", "Recursive fracture with depth control",
    u5row("Target", '<span class="u5val">' + (n ? esc(n.name) : "none") + "</span>") +
    sliderrow("Fracture depth", px.depth || 3, 1, 5, 1, 'data-dest="depth"') +
    sliderrow("Chunk impulse", px.impulse || 4, 0, 20, 0.5, 'data-dest="impulse"') +
    sliderrow("Debris life", px.life || 6, 1, 30, 0.5, 'data-dest="life"') +
    '<div class="u5btns"><button class="btn" data-destact="fracture">Fracture selection</button>' +
    '<button class="btn ghost" data-destact="clear">Clear debris</button>' +
    '<button class="btn ghost" data-destact="demo">Explode chunks</button></div>' +
    '<div class="landout" id="destout">' + (px.chunks.length ? px.chunks.length + " chunks tracked." : "Ready.") + "</div>");
  body += u5sec("Soft body", "Mass spring lattice over mesh vertices",
    sliderrow("Stiffness", px.soft || 0.35, 0.02, 1, 0.01, 'data-dest="soft"') +
    '<div class="u5btns"><button class="btn" data-destact="soft">Make selection soft</button>' +
    '<button class="btn ghost" data-destact="jelly">Jelly step</button></div>');
  body += u5sec("Fluid and buoyancy", "Volume buoyancy and particle fluid",
    sliderrow("Buoyancy", px.buoy || 1.2, 0, 4, 0.05, 'data-dest="buoy"') +
    sliderrow("Water drag", px.wdrag || 1.4, 0, 6, 0.05, 'data-dest="wdrag"') +
    '<div class="u5btns"><button class="btn" data-destact="fluid">Spawn fluid particles</button>' +
    '<button class="btn ghost" data-destact="float">Test buoyancy</button></div>');
  body += "</div>";
  openmodal({
    title: "Destruction, Soft Body and Fluid",
    icon: "layers",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-dest]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-dest");
          var v = parseFloat(inp.value);
          if (f === "depth") px.depth = v;
          else if (f === "impulse") px.impulse = v;
          else if (f === "life") px.life = v;
          else if (f === "soft") px.soft = v;
          else if (f === "buoy") px.buoy = v;
          else px.wdrag = v;
          commit("destruction");
        });
      });
      m.querySelectorAll("[data-destact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-destact");
          if (a === "fracture") {
            var c = fracturerun(selected(), 1, Math.round(px.depth || 3));
            var out = qs("#destout");
            if (out) out.textContent = c + " chunks created.";
          } else if (a === "clear") {
            app.scene.objects = app.scene.objects.filter(function (x) {
              return !x.fragment;
            });
            px.chunks = [];
            commit("clear debris");
            refreshall();
          } else if (a === "demo") explodchunks();
          else if (a === "soft") makesoft(selected());
          else if (a === "jelly") softstep(selected(), 0.016);
          else if (a === "fluid") spawnfluid();
          else if (a === "float") buoyancytest();
        });
      });
    }
  });
}

function explodchunks() {
  var list = [];
  walk(app.scene.objects, function (n) {
    if (n.fragment) list.push(n);
  });
  if (!list.length) {
    toast("Fracture an actor first", "warn");
    return;
  }
  px.chunks = list;
  list.forEach(function (c, i) {
    c.vel = [Math.sin(i * 2.1) * (px.impulse || 4), 2 + Math.cos(i * 1.7) * (px.impulse || 4) * 0.5, Math.cos(i * 2.7) * (px.impulse || 4)];
    c.rotvel = [(i % 5) - 2, (i % 7) - 3, (i % 3) - 1];
    c.chunklife = px.life || 6;
  });
  commit("explode");
  toast(list.length + " chunks launched", "ok");
}

function chunktick(dt) {
  if (!px.chunks || !px.chunks.length) return;
  px.chunks.forEach(function (c) {
    if (!c.vel) return;
    c.vel[1] -= 16 * dt;
    c.pos[0] += c.vel[0] * dt;
    c.pos[1] += c.vel[1] * dt;
    c.pos[2] += c.vel[2] * dt;
    if (c.pos[1] < 0.1) {
      c.pos[1] = 0.1;
      c.vel[1] *= -0.32;
      c.vel[0] *= 0.7;
      c.vel[2] *= 0.7;
    }
    if (c.rotvel) {
      c.rot[0] += c.rotvel[0] * dt * 30;
      c.rot[1] += c.rotvel[1] * dt * 30;
      c.rot[2] += c.rotvel[2] * dt * 30;
    }
    if (c.chunklife !== undefined) c.chunklife -= dt;
  });
}

function makesoft(node) {
  if (!node) {
    toast("Select a mesh actor", "warn");
    return;
  }
  node.soft = { rest: node.geo && node.geo.pos ? node.geo.pos.slice() : [], a: 0, v: 0 };
  if (!node.geo) {
    node.geo = geobox(1.6, 1.6, 1.6);
    node.gver = (node.gver || 0) + 1;
    node.soft.rest = node.geo.pos.slice();
  }
  commit("soft");
  toast(node.name + " is now a soft body, use Jelly step", "ok");
}

function softstep(node, dt) {
  if (!node || !node.soft || !node.geo) {
    toast("Make a selection soft first", "warn");
    return;
  }
  var s = node.soft;
  var p = node.geo.pos;
  var rest = s.rest.length === p.length ? s.rest : p.slice();
  var stiff = px.soft || 0.35;
  s.v += (-p.length * 0.00004 - s.v * 0.25) * dt * 60;
  var squash = 1 - Math.max(-0.35, Math.min(0.35, s.v));
  for (var i = 0; i < p.length; i += 3) {
    var target = rest[i + 1] * squash;
    p[i + 1] += (target - p[i + 1]) * stiff;
    p[i] += (rest[i] - p[i]) * stiff * 0.2;
    p[i + 2] += (rest[i + 2] - p[i + 2]) * stiff * 0.2;
  }
  node.gver = (node.gver || 0) + 1;
  commit("soft");
  refreshall();
}

function spawnfluid() {
  var cx = app.cam.target[0];
  var cz = app.cam.target[2];
  px.fluid = [];
  for (var i = 0; i < 90; i++) {
    px.fluid.push({
      p: [cx + (Math.random() - 0.5) * 3, 3 + Math.random() * 2, cz + (Math.random() - 0.5) * 3],
      v: [0, 0, 0]
    });
  }
  commit("fluid");
  toast("Spawned 90 fluid particles", "ok");
}

function fluidstep(dt) {
  if (!px.fluid || !px.fluid.length) return;
  var grav = 14;
  var rad = 0.32;
  px.fluid.forEach(function (a) {
    a.v[1] -= grav * dt;
    a.p[0] += a.v[0] * dt;
    a.p[1] += a.v[1] * dt;
    a.p[2] += a.v[2] * dt;
    if (a.p[1] < 0.1) {
      a.p[1] = 0.1;
      a.v[1] *= -0.2;
      a.v[0] *= 0.9;
      a.v[2] *= 0.9;
    }
  });
  for (var i = 0; i < px.fluid.length; i++) {
    for (var j = i + 1; j < px.fluid.length; j++) {
      var a = px.fluid[i];
      var b = px.fluid[j];
      var dx = b.p[0] - a.p[0];
      var dy = b.p[1] - a.p[1];
      var dz = b.p[2] - a.p[2];
      var d = Math.hypot(dx, dy, dz);
      if (d < rad && d > 0.0001) {
        var push = (rad - d) * 0.5;
        a.p[0] -= dx / d * push;
        a.p[1] -= dy / d * push;
        a.p[2] -= dz / d * push;
        b.p[0] += dx / d * push;
        b.p[1] += dy / d * push;
        b.p[2] += dz / d * push;
      }
    }
  }
}

function buoyancytest() {
  var n = selected();
  if (!n) {
    toast("Select an actor to float", "warn");
    return;
  }
  n.floater = { vy: 0, buoy: px.buoy || 1.2, drag: px.wdrag || 1.4 };
  toast(n.name + " will float on water volumes", "ok");
  commit("buoyancy");
}

function buoyancytick(dt) {
  var waters = [];
  walk(app.scene.objects, function (n) {
    if (n.type === "water") waters.push(n);
  });
  if (!waters.length) return;
  walk(app.scene.objects, function (n) {
    if (!n.floater) return;
    var s = nodesize(n);
    var submerged = 0;
    waters.forEach(function (w) {
      var ww = worldpos(w);
      var top = ww[1];
      var half = Math.max(s[0], s[2]);
      if (Math.abs(n.pos[0] - ww[0]) < half * 2 && Math.abs(n.pos[2] - ww[2]) < half * 2) {
        var depth = top - (n.pos[1] - s[1] / 2);
        if (depth > 0 && depth < s[1]) submerged = Math.min(1, depth / s[1]);
      }
    });
    n.floater.vy += (submerged * (n.floater.buoy || 1.2) * 18 - 18) * dt;
    n.floater.vy -= n.floater.vy * Math.min(1, (n.floater.drag || 1.4) * dt);
    n.pos[1] += n.floater.vy * dt;
  });
}

function physxtick(dt) {
  fieldtick(dt);
  chunktick(dt);
  fluidstep(dt);
  buoyancytick(dt);
  jointtick(dt);
}
