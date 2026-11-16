var phys = { bodies: [], joints: [], grid: null, cell: 0.5, min: [0, 0, 0], cols: 0, rows: 0, count: 0 };

var behavmeta = [
  { id: "platformer", label: "Platformer", icon: "human", p: ["speed", "jump"] },
  { id: "topdown", label: "Top-down movement", icon: "joystick", p: ["speed"] },
  { id: "car", label: "Car", icon: "human", p: ["speed", "turn"] },
  { id: "boat", label: "Boat", icon: "water", p: ["speed", "turn"] },
  { id: "firstperson", label: "First person", icon: "camera", p: ["speed", "mouse"] },
  { id: "camerafollow", label: "Camera follow", icon: "target", p: ["dist", "height"] },
  { id: "followcurve", label: "Follow curve", icon: "curve", p: ["speed"] },
  { id: "repeatalongcurve", label: "Repeat along curve", icon: "refresh", p: ["speed"] },
  { id: "lookattarget", label: "Look at target", icon: "eye", p: ["speed"] },
  { id: "parallax", label: "Parallax", icon: "hills", p: ["amount"] },
  { id: "mover", label: "Moving platform", icon: "move", p: ["speed", "range"] },
  { id: "rotate", label: "Rotate", icon: "rotate", p: ["speed"] },
  { id: "bullet", label: "Bullet", icon: "arrowup", p: ["speed", "life"] },
  { id: "sine", label: "Wave (sine)", icon: "curve", p: ["speed", "range"] },
  { id: "follow", label: "Follow target", icon: "target", p: ["speed", "range"] },
  { id: "destroyoffscreen", label: "Destroy when far", icon: "trash", p: ["range"] },
  { id: "draggable", label: "Draggable", icon: "hand", p: [] },
  { id: "health", label: "Health", icon: "heart", p: ["hp"] },
  { id: "twoboneik", label: "Two-bone IK", icon: "bone", p: ["length", "stiffness", "height"] }
];

function behavfind(id) {
  var out = null;
  behavmeta.forEach(function (b) {
    if (b.id === id) out = b;
  });
  return out;
}

function behavlabel(b) {
  var m = behavfind(b.type);
  return m ? m.label : b.name || "Behavior";
}

function beval(beh, key, fallback) {
  return beh[key] === undefined ? fallback : beh[key];
}

function physsize(node) {
  var s = nodesize(node);
  return [Math.max(0.05, s[0]), Math.max(0.05, s[1]), Math.max(0.05, s[2])];
}

function hascomp(node, id) {
  return (node.comps || []).indexOf(id) >= 0;
}

function compnum(node, comp, key, fallback) {
  var d = node.compdata && node.compdata[comp];
  var v = d ? d[key] : undefined;
  if (v === undefined || v === null || v === "") return fallback;
  var n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function physreset() {
  phys.bodies = [];
  phys.joints = [];
  if (!app.scene) return;
  walk(app.scene.objects, function (n) {
    if (n.type === "camera" || n.type === "sun" || n.type === "canvas" || n.type === "label" || n.type === "button" || n.type === "slider" || n.type === "bar" || n.type === "joystick" || n.type === "tilemap") return;
    if (n.sprite === "hero" || (n.tags || []).indexOf("player") >= 0) return;
    var solid = hascomp(n, "collider") || hascomp(n, "physics") || (n.type === "cube" || n.type === "terrain" || n.type === "water");
    if (!solid) return;
    var soft = false;
    ["coin", "pickup", "hazard", "goal", "enemy", "trigger"].forEach(function (tag) {
      if ((n.tags || []).indexOf(tag) >= 0) soft = true;
    });
    if (soft && !hascomp(n, "physics")) return;
    var size = physsize(n);
    var kind = "box";
    if (n.type === "sphere") kind = "sphere";
    if (hascomp(n, "collider")) {
      var shape = (n.compdata && n.compdata.collider && n.compdata.collider.shape) || "Box";
      if (shape === "Circle") kind = "sphere";
    }
    var ptype = (n.compdata && n.compdata.physics && n.compdata.physics.type) || (hascomp(n, "physics") ? "Dynamic" : "Static");
    var isstatic = ptype === "Static";
    var body = {
      id: n.id,
      node: n,
      kind: kind,
      hw: size[0] / 2,
      hh: size[1] / 2,
      hd: size[2] / 2,
      static: isstatic,
      kinematic: ptype === "Kinematic",
      trigger: !!(n.compdata && n.compdata.collider && n.compdata.collider.trigger),
      mass: Math.max(0.05, compnum(n, "physics", "mass", 1)),
      grav: compnum(n, "physics", "gravity", 1),
      fric: compnum(n, "physics", "friction", 0.4),
      rest: compnum(n, "physics", "rest", 0.25),
      damp: compnum(n, "physics", "damp", 0.02),
      vel: [0, 0, 0],
      home: n.pos.slice(),
      ground: false,
      time: 0,
      moved: [0, 0, 0]
    };
    phys.bodies.push(body);
  });
  walk(app.scene.objects, function (n) {
    if (n.type !== "tilemap") return;
    var d = tiledata(n);
    if (d.solid === false) return;
    tilemapwalls(n).forEach(function (w) {
      phys.bodies.push({
        id: n.id + "w" + w.x + "_" + w.y,
        node: { id: n.id + "w", pos: [w.x, w.y, w.z], rot: [0, 0, 0], scl: [1, 1, 1], name: n.name, type: "tile", comps: [] },
        kind: "box",
        hw: w.hw,
        hh: w.hh,
        hd: w.hd,
        static: true,
        kinematic: false,
        trigger: false,
        mass: 1,
        grav: 0,
        fric: 0.5,
        rest: 0.1,
        damp: 0,
        vel: [0, 0, 0],
        home: [w.x, w.y, w.z],
        ground: false,
        time: 0,
        moved: [0, 0, 0]
      });
    });
  });
  walk(app.scene.objects, function (n) {
    if (!hascomp(n, "joint")) return;
    var target = (n.compdata && n.compdata.joint && n.compdata.joint.target) || "";
    var other = null;
    walk(app.scene.objects, function (o) {
      if (!other && o.name === target) other = o;
    });
    if (!other) return;
    phys.joints.push({
      a: n.id,
      b: other.id,
      kind: (n.compdata && n.compdata.joint && n.compdata.joint.kind) || "distance",
      length: compnum(n, "joint", "length", 2),
      stiff: compnum(n, "joint", "stiffness", 1)
    });
  });
  phys.bodies.forEach(function (bd) {
    physsetup(bd);
  });
  physreset.ready = true;
}

function physbyid(id) {
  var out = null;
  phys.bodies.forEach(function (b) {
    if (b.id === id) out = b;
  });
  return out;
}

function overlapof(a, b, pa, pb) {
  var dx = Math.abs(pa[0] - pb[0]) - (a.hw + b.hw);
  var dy = Math.abs(pa[1] - pb[1]) - (a.hh + b.hh);
  var dz = Math.abs(pa[2] - pb[2]) - (a.hd + b.hd);
  if (dx >= 0 || dy >= 0 || dz >= 0) return null;
  if (dy > dx && dy > dz) return { axis: 1, depth: -dy, sign: pa[1] > pb[1] ? 1 : -1 };
  if (dx > dz) return { axis: 0, depth: -dx, sign: pa[0] > pb[0] ? 1 : -1 };
  return { axis: 2, depth: -dz, sign: pa[2] > pb[2] ? 1 : -1 };
}

function physgravity() {
  var g = app.project.graphics && app.project.graphics.gravity;
  if (g === undefined || g === null) return 23;
  if (Array.isArray(g)) return Math.abs(g[1] || 9.8) * 2.4;
  return parseFloat(g) || 23;
}


function physsetup(b) {
  b.mass = Math.max(0.05, b.mass || 1);
  b.shape = b.kind === "sphere" ? "circle" : "box";
  b.invmas = b.static ? 0 : 1 / b.mass;
  b.ang = b.ang || 0;
  b.angvel = b.angvel || 0;
  b.radius = b.shape === "circle" ? Math.max(b.hw, b.hh) : Math.hypot(b.hw, b.hh);
  b.inertia = b.static ? 1 : b.shape === "circle" ? 0.5 * b.mass * b.radius * b.radius : (b.mass * (4 * b.hw * b.hw + 4 * b.hh * b.hh)) / 12;
  b.invinertia = b.static ? 0 : 1 / b.inertia;
  return b;
}

function physcos(b) {
  return [Math.cos(b.ang || 0), Math.sin(b.ang || 0)];
}

function physcorner(b, sx, sy) {
  var cs = physcos(b);
  var lx = sx * b.hw;
  var ly = sy * b.hh;
  return [b.node.pos[0] + lx * cs[0] - ly * cs[1], b.node.pos[1] + lx * cs[1] + ly * cs[0]];
}

function physcorners(b) {
  return [physcorner(b, -1, -1), physcorner(b, 1, -1), physcorner(b, 1, 1), physcorner(b, -1, 1)];
}

function physvelat(b, r) {
  return [b.vel[0] - (b.angvel || 0) * r[1], b.vel[1] + (b.angvel || 0) * r[0]];
}

function physzover(a, b) {
  return Math.abs(a.node.pos[2] - b.node.pos[2]) < a.hd + b.hd + 0.12;
}

function physsat(a, b) {
  var ua = physcos(a);
  var va = [-ua[1], ua[0]];
  var ub = physcos(b);
  var vb = [-ub[1], ub[0]];
  var axes = [ua, va, ub, vb];
  var pa = a.node.pos;
  var pb = b.node.pos;
  var best = null;
  for (var i = 0; i < 4; i++) {
    var ax = axes[i];
    var ra = a.hw * Math.abs(ua[0] * ax[0] + ua[1] * ax[1]) + a.hh * Math.abs(va[0] * ax[0] + va[1] * ax[1]);
    var rb = b.hw * Math.abs(ub[0] * ax[0] + ub[1] * ax[1]) + b.hh * Math.abs(vb[0] * ax[0] + vb[1] * ax[1]);
    var dist = (pb[0] - pa[0]) * ax[0] + (pb[1] - pa[1]) * ax[1];
    var ov = ra + rb - Math.abs(dist);
    if (ov <= 0) return null;
    if (!best || ov < best.depth) best = { depth: ov, n: [dist < 0 ? -ax[0] : ax[0], dist < 0 ? -ax[1] : ax[1]] };
  }
  return best;
}

function physcircbox(c, b) {
  var cs = physcos(b);
  var d = [c.node.pos[0] - b.node.pos[0], c.node.pos[1] - b.node.pos[1]];
  var lx = d[0] * cs[0] + d[1] * cs[1];
  var ly = -d[0] * cs[1] + d[1] * cs[0];
  var cx = Math.max(-b.hw, Math.min(b.hw, lx));
  var cy = Math.max(-b.hh, Math.min(b.hh, ly));
  var dx = lx - cx;
  var dy = ly - cy;
  var dist = Math.hypot(dx, dy);
  var r = c.radius;
  if (dist > r) return null;
  var nlx = dist > 0.0001 ? dx / dist : lx > 0 ? 1 : -1;
  var nly = dist > 0.0001 ? dy / dist : 0;
  var depth = r - dist;
  if (dist < 0.0001) {
    depth = r + Math.min(b.hw - Math.abs(lx), b.hh - Math.abs(ly));
    if (Math.abs(lx) / b.hw > Math.abs(ly) / b.hh) {
      nlx = lx > 0 ? 1 : -1;
      nly = 0;
    } else {
      nlx = 0;
      nly = ly > 0 ? 1 : -1;
    }
  }
  var n = [nlx * cs[0] - nly * cs[1], nlx * cs[1] + nly * cs[0]];
  return { depth: depth, n: [n[0], n[1]], point: [c.node.pos[0] - n[0] * r, c.node.pos[1] - n[1] * r] };
}

function physclamp(b, p) {
  var cs = physcos(b);
  if (b.shape === "circle") {
    var dx = p[0] - b.node.pos[0];
    var dy = p[1] - b.node.pos[1];
    var d = Math.hypot(dx, dy) || 0.0001;
    var k = Math.min(1, b.radius / d);
    return [b.node.pos[0] + dx * k, b.node.pos[1] + dy * k];
  }
  var lx = (p[0] - b.node.pos[0]) * cs[0] + (p[1] - b.node.pos[1]) * cs[1];
  var ly = -(p[0] - b.node.pos[0]) * cs[1] + (p[1] - b.node.pos[1]) * cs[0];
  lx = Math.max(-b.hw, Math.min(b.hw, lx));
  ly = Math.max(-b.hh, Math.min(b.hh, ly));
  return [b.node.pos[0] + lx * cs[0] - ly * cs[1], b.node.pos[1] + lx * cs[1] + ly * cs[0]];
}
function physsupport(b, n) {
  var cs = physcos(b);
  var ex = b.hw * Math.abs(cs[0] * n[0] + cs[1] * n[1]) + b.hh * Math.abs(-cs[1] * n[0] + cs[0] * n[1]);
  if (b.shape === "circle") ex = b.radius;
  return [b.node.pos[0] + n[0] * ex, b.node.pos[1] + n[1] * ex];
}

function physpair(a, b) {
  if (!physzover(a, b)) return null;
  var hit = null;
  if (a.shape === "circle" && b.shape === "circle") {
    var dx = b.node.pos[0] - a.node.pos[0];
    var dy = b.node.pos[1] - a.node.pos[1];
    var d = Math.hypot(dx, dy);
    var rr = a.radius + b.radius;
    if (d >= rr || d < 0.00001) return null;
    hit = { depth: rr - d, n: [dx / d, dy / d] };
  } else if (a.shape === "circle") {
    var hb = physcircbox(a, b);
    if (!hb) return null;
    hit = { depth: hb.depth, n: [-hb.n[0], -hb.n[1]] };
  } else if (b.shape === "circle") {
    hit = physcircbox(b, a);
    if (!hit) return null;
  } else {
    hit = physsat(a, b);
    if (!hit) return null;
  }
  var n2 = hit.n;
  var ra2 = physsupport(a, n2);
  var rb2 = physclamp(b, ra2);
  hit.point = [(ra2[0] + rb2[0]) / 2, (ra2[1] + rb2[1]) / 2];
  return hit;
}

function phyimpulse(a, b, hit) {
  var n = hit.n;
  var ra = [hit.point[0] - a.node.pos[0], hit.point[1] - a.node.pos[1]];
  var rb = [hit.point[0] - b.node.pos[0], hit.point[1] - b.node.pos[1]];
  var va = physvelat(a, ra);
  var vb = physvelat(b, rb);
  var rv = [vb[0] - va[0], vb[1] - va[1]];
  var vn = rv[0] * n[0] + rv[1] * n[1];
  var ran = ra[0] * n[1] - ra[1] * n[0];
  var rbn = rb[0] * n[1] - rb[1] * n[0];
  var denom = a.invmas + b.invmas + ran * ran * a.invinertia + rbn * rbn * b.invinertia;
  if (denom <= 0.0000001) return;
  if (vn < 0) {
    var e = Math.max(a.rest, b.rest);
    if (Math.abs(vn) < 1.1) e = 0;
    var jn = (-(1 + e) * vn) / denom;
    var spin = Math.abs(vn) > 2.2;
    a.vel[0] -= jn * n[0] * a.invmas;
    a.vel[1] -= jn * n[1] * a.invmas;
    b.vel[0] += jn * n[0] * b.invmas;
    b.vel[1] += jn * n[1] * b.invmas;
    if (spin) {
      a.angvel += Math.max(-2.5, Math.min(2.5, -ran * jn * a.invinertia));
      b.angvel += Math.max(-2.5, Math.min(2.5, rbn * jn * b.invinertia));
    } else {
      a.angvel *= 0.9;
      b.angvel *= 0.9;
    }
    var t = [-n[1], n[0]];
    var vt = rv[0] * t[0] + rv[1] * t[1];
    var rat = ra[0] * t[1] - ra[1] * t[0];
    var rbt = rb[0] * t[1] - rb[1] * t[0];
    var dent = a.invmas + b.invmas + rat * rat * a.invinertia + rbt * rbt * b.invinertia;
    if (dent > 0.0000001) {
      var mu = (a.fric + b.fric) * 0.55;
      var jt = -vt / dent;
      var lim = Math.abs(jn) * mu;
      jt = Math.max(-lim, Math.min(lim, jt));
      a.vel[0] -= jt * t[0] * a.invmas;
      a.vel[1] -= jt * t[1] * a.invmas;
      if (spin) a.angvel = Math.max(-16, Math.min(16, a.angvel - rat * jt * a.invinertia));
      b.vel[0] += jt * t[0] * b.invmas;
      b.vel[1] += jt * t[1] * b.invmas;
      if (spin) b.angvel = Math.max(-16, Math.min(16, b.angvel + rbt * jt * b.invinertia));
    }
  }
  if (n[1] > 0.25) b.ground = true;
  if (n[1] < -0.25) a.ground = true;
  if (Math.abs(n[1]) > 0.8) {
    if (b.shape === "box") b.angvel *= 0.45;
    if (a.shape === "box") a.angvel *= 0.45;
  }
}

function physcorrect(a, b, hit) {
  var n = hit.n;
  var corr = Math.max(0, hit.depth - 0.006) * 0.6;
  var tot = a.invmas + b.invmas;
  if (tot <= 0) return;
  a.node.pos[0] -= n[0] * corr * (a.invmas / tot);
  a.node.pos[1] -= n[1] * corr * (a.invmas / tot);
  b.node.pos[0] += n[0] * corr * (b.invmas / tot);
  b.node.pos[1] += n[1] * corr * (b.invmas / tot);
}

function physstep(dt, game) {
  if (!physreset.ready) physreset();
  if (phys.sceneid !== app.scene.id) {
    phys.sceneid = app.scene.id;
    physreset();
  }
  var g = physgravity();
  var live = [];
  phys.bodies.forEach(function (b) {
    b.time += dt;
    b.node.btime = b.time;
    if (b.static) return;
    if (b.sleeping) {
      b.ground = true;
      live.push(b);
      return;
    }
    if (!b.kinematic) b.vel[1] -= g * b.grav * dt;
    b.vel[0] *= 1 - b.damp;
    b.vel[1] *= 1 - b.damp * 0.2;
    b.vel[2] *= 1 - b.damp;
    b.angvel *= 1 - b.damp * 1.6;
    live.push(b);
  });
  phys.joints.forEach(function (j) {
    var a = physbyid(j.a);
    var b = physbyid(j.b);
    if (!a || !b) return;
    var dx = b.node.pos[0] - a.node.pos[0];
    var dy = b.node.pos[1] - a.node.pos[1];
    var dz = b.node.pos[2] - a.node.pos[2];
    var d = Math.hypot(dx, dy, dz) || 0.0001;
    var want = j.kind === "spring" ? d + (j.length - d) * 0.5 : j.length;
    var diff = ((d - want) / d) * j.stiff * 0.5;
    if (!a.static) {
      a.node.pos[0] += dx * diff;
      a.node.pos[1] += dy * diff;
      a.node.pos[2] += dz * diff;
    }
    if (!b.static) {
      b.node.pos[0] -= dx * diff;
      b.node.pos[1] -= dy * diff;
      b.node.pos[2] -= dz * diff;
    }
  });
  var sub = 1;
  live.forEach(function (bd) {
    var step = Math.max(Math.abs(bd.vel[0]), Math.abs(bd.vel[1])) * dt;
    var thin = Math.min(bd.hw, bd.hh) * 1.4;
    if (thin > 0.02) sub = Math.max(sub, Math.ceil(step / thin));
  });
  sub = Math.min(6, sub);
  var sdt = dt / sub;
  for (var sp = 0; sp < sub; sp++) {
    live.forEach(function (bd) {
      if (bd.sleeping) return;
      bd.node.pos[0] += bd.vel[0] * sdt;
      bd.node.pos[1] += bd.vel[1] * sdt;
      bd.node.pos[2] += bd.vel[2] * sdt;
      bd.ang += bd.angvel * sdt;
      bd.ground = false;
    });
    for (var pass = 0; pass < 4; pass++) {
      for (var i = 0; i < live.length; i++) {
        var b = live[i];
        for (var k = 0; k < phys.bodies.length; k++) {
          var o = phys.bodies[k];
          if (o === b) continue;
          if (b.trigger || o.trigger) continue;
          if (o.static && b.static) continue;
          if (!o.static && o.id < b.id) continue;
          var hit = physpair(b, o);
          if (!hit) continue;
          if (b.sleeping && o.static) continue;
          if (b.sleeping && Math.abs(o.vel[0]) + Math.abs(o.vel[1]) < 0.05 && o.sleeping) continue;
          b.sleeping = false;
          b.sleepcount = 0;
          phyimpulse(b, o, hit);
        }
      }
    }
    for (var i2 = 0; i2 < live.length; i2++) {
      var bb2 = live[i2];
      for (var k2 = 0; k2 < phys.bodies.length; k2++) {
        var oo2 = phys.bodies[k2];
        if (oo2 === bb2 || oo2.static) continue;
        if (bb2.trigger || oo2.trigger) continue;
        if (oo2.id < bb2.id) continue;
        var h2 = physpair(bb2, oo2);
        if (h2) physcorrect(bb2, oo2, h2);
      }
      for (var k3 = 0; k3 < phys.bodies.length; k3++) {
        var st = phys.bodies[k3];
        if (!st.static || st === bb2) continue;
        var h3 = physpair(bb2, st);
        if (h3) physcorrect(bb2, st, h3);
      }
    }
  }
  phys.bodies.forEach(function (bd) {
    if (bd.static) return;
    if (bd.shape === "circle" && bd.ground) {
      var want = -bd.vel[0] / Math.max(0.1, bd.radius);
      bd.angvel += (want - bd.angvel) * 0.18;
    }
    var cap2 = 8;
    bd.angvel = Math.max(-cap2, Math.min(cap2, bd.angvel));
    if (bd.ground) {
      var sp0 = Math.hypot(bd.vel[0], bd.vel[1]);
      var drop = Math.min(sp0, Math.min(1.1, bd.fric) * 9.2 * dt * 1.35);
      if (sp0 > 0.0001 && drop > 0) {
        bd.vel[0] -= (bd.vel[0] / sp0) * drop;
        bd.vel[1] -= (bd.vel[1] / sp0) * drop;
      }
      bd.angvel *= 0.88;
    }
    if (bd.ground && Math.hypot(bd.vel[0], bd.vel[1]) < 1.1) {
      bd.vel[0] *= 0.88;
      bd.vel[1] *= 0.88;
      bd.angvel *= 0.84;
    }
    var slow = Math.abs(bd.vel[0]) < 0.55 && Math.abs(bd.vel[1]) < 0.55;
    bd.sleeping = bd.ground && slow && (bd.sleeping || bd.sleepcount > 14);
    if (bd.ground && slow) bd.sleepcount = (bd.sleepcount || 0) + 1;
    else bd.sleepcount = 0;
    if (bd.ground) bd.angvel *= 0.86;
    if (bd.ground && bd.shape === "box" && Math.abs(bd.angvel) < 1.6 && Math.hypot(bd.vel[0], bd.vel[1]) < 0.8) {
      var quarter = Math.PI / 2;
      var near = Math.round(bd.ang / quarter) * quarter;
      if (Math.abs(bd.ang - near) < 0.3) bd.ang += (near - bd.ang) * 0.25;
    }
    if (bd.sleeping) {
      bd.vel = [0, 0, 0];
      bd.angvel = 0;
      if (bd.shape === "box") {
        bd.ang = Math.round(bd.ang / (Math.PI / 2)) * (Math.PI / 2);
      }
    }
    if (Math.abs(bd.vel[0]) < 0.02) bd.vel[0] = 0;
    if (Math.abs(bd.angvel) < 0.02 && bd.ground) bd.angvel = 0;
    bd.node.rot[2] = (bd.ang * 180) / Math.PI;
    if (bd.node.pos[1] < -60) {
      bd.node.pos = bd.home.slice();
      bd.vel = [0, 0, 0];
      bd.ang = 0;
      bd.angvel = 0;
    }
    if (!gameover) gameover = {};
    gameover[bd.id] = gameover[bd.id] || {};
    gameover[bd.id].pos = bd.node.pos.slice();
    gameover[bd.id].rot = bd.node.rot;
  });
}

function physray(origin, dir, maxdist) {
  var best = null;
  var len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  var d = [dir[0] / len, dir[1] / len, dir[2] / len];
  phys.bodies.forEach(function (b) {
    var p = b.node.pos;
    var min = [p[0] - b.hw, p[1] - b.hh, p[2] - b.hd];
    var max = [p[0] + b.hw, p[1] + b.hh, p[2] + b.hd];
    var tmin = 0;
    var tmax = maxdist === undefined ? 500 : maxdist;
    for (var i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-6) {
        if (origin[i] < min[i] || origin[i] > max[i]) return;
      } else {
        var t1 = (min[i] - origin[i]) / d[i];
        var t2 = (max[i] - origin[i]) / d[i];
        if (t1 > t2) {
          var tt = t1;
          t1 = t2;
          t2 = tt;
        }
        if (t1 > tmin) tmin = t1;
        if (t2 < tmax) tmax = t2;
        if (tmin > tmax) return;
      }
    }
    if (!best || tmin < best.dist) {
      best = {
        dist: tmin,
        body: b,
        node: b.node,
        point: [origin[0] + d[0] * tmin, origin[1] + d[1] * tmin, origin[2] + d[2] * tmin]
      };
    }
  });
  return best;
}

function behaviorstep(dt, game) {
  var nodes = [];
  walk(app.scene.objects, function (n) {
    if ((n.behaviors || []).length) nodes.push(n);
  });
  var keys = game ? game.keys : {};
  var cam = app.cam;
  nodes.forEach(function (n) {
    (n.behaviors || []).forEach(function (b) {
      var type = b.type || b.name;
      if (type === "Move x" || type === "mover" || type === "Moving platform") type = "mover";
      if (type === "Patrol") type = "patrol";
      if (type === "Spin") type = "spin";
      var speed = beval(b, "speed", 1);
      var range = beval(b, "range", 1.5);
      var body = physbyid(n.id);
      n.btime = (n.btime || 0) + dt;
      if (type === "mover") {
        var off = Math.sin(n.btime * speed) * range;
        var axis = b.axis || "x";
        n.pos[0] = body ? body.home[0] : n.pos[0];
        n.pos[1] = body ? body.home[1] : n.pos[1];
        n.pos[2] = body ? body.home[2] : n.pos[2];
        if (axis === "y") n.pos[1] += off;
        else if (axis === "z") n.pos[2] += off;
        else n.pos[0] += off;
        if (body) body.vel = [0, 0, 0];
      } else if (type === "sine") {
        if (!n.sinebase) n.sinebase = n.pos.slice();
        n.pos[1] = n.sinebase[1] + Math.sin(n.btime * speed) * range;
      } else if (type === "patrol") {
        if (!n.patrolbase) n.patrolbase = n.pos.slice();
        n.pos[0] = n.patrolbase[0] + Math.sin(n.btime * speed) * range;
        n.scalex = Math.cos(n.btime * speed) < 0 ? -1 : 1;
        if (body) body.vel = [Math.cos(n.btime * speed) * speed * range, body.vel[1], body.vel[2]];
      } else if (type === "spin") {
        n.rot[1] = (n.rot[1] || 0) + speed * dt * 60;
        if (b.axis === "x") n.rot[0] = (n.rot[0] || 0) + speed * dt * 60;
      } else if (type === "rotate") {
        var ax = b.axis === "x" ? 0 : b.axis === "z" ? 2 : 1;
        n.rot[ax] = (n.rot[ax] || 0) + speed * dt * 60;
      } else if (type === "platformer") {
        var left = keys.ArrowLeft || keys.KeyA;
        var right = keys.ArrowRight || keys.KeyD;
        var jump = keys.Space || keys.ArrowUp || keys.KeyW;
        var vx = ((right ? 1 : 0) - (left ? 1 : 0)) * speed;
        var vy = body ? body.vel[1] : 0;
        if (jump && (!body || body.ground)) vy = beval(b, "jump", 9.4);
        if (body) {
          body.vel[0] = vx;
          body.vel[1] = vy;
        } else {
          n.pos[0] += vx * dt;
          if (jump) n.pos[1] += beval(b, "jump", 9.4) * dt;
        }
      } else if (type === "topdown") {
        var tl = keys.ArrowLeft || keys.KeyA;
        var tr = keys.ArrowRight || keys.KeyD;
        var tu = keys.ArrowUp || keys.KeyW;
        var td = keys.ArrowDown || keys.KeyS;
        var tx = ((tr ? 1 : 0) - (tl ? 1 : 0)) * speed;
        var tz = ((td ? 1 : 0) - (tu ? 1 : 0)) * speed;
        n.pos[0] += tx * dt;
        n.pos[2] += tz * dt;
        if (tx || tz) n.rot[1] = Math.atan2(tx, tz) * 180 / Math.PI;
      } else if (type === "car") {
        var acc = keys.ArrowUp || keys.KeyW;
        var back = keys.ArrowDown || keys.KeyS;
        var sl = keys.ArrowLeft || keys.KeyA;
        var sr = keys.ArrowRight || keys.KeyD;
        b.vel = beval(b, "vel", 0);
        if (acc) b.vel += speed * dt * 3;
        if (back) b.vel -= speed * dt * 3;
        b.vel *= 0.98;
        if (sl) n.rot[1] = (n.rot[1] || 0) + beval(b, "turn", 70) * dt * Math.min(1, Math.abs(b.vel) / 2);
        if (sr) n.rot[1] = (n.rot[1] || 0) - beval(b, "turn", 70) * dt * Math.min(1, Math.abs(b.vel) / 2);
        var yaw = (n.rot[1] || 0) * Math.PI / 180;
        if (body) {
          body.vel[0] = Math.sin(yaw) * b.vel;
          body.vel[2] = Math.cos(yaw) * b.vel;
        } else {
          n.pos[0] += Math.sin(yaw) * b.vel * dt;
          n.pos[2] += Math.cos(yaw) * b.vel * dt;
        }
      } else if (type === "boat") {
        b.vel = beval(b, "vel", 0);
        if (keys.ArrowUp || keys.KeyW) b.vel += speed * dt * 2;
        if (keys.ArrowDown || keys.KeyS) b.vel -= speed * dt * 2;
        b.vel *= 0.99;
        if (keys.ArrowLeft || keys.KeyA) n.rot[1] = (n.rot[1] || 0) + beval(b, "turn", 50) * dt;
        if (keys.ArrowRight || keys.KeyD) n.rot[1] = (n.rot[1] || 0) - beval(b, "turn", 50) * dt;
        var byaw = (n.rot[1] || 0) * Math.PI / 180;
        n.pos[0] += Math.sin(byaw) * b.vel * dt;
        n.pos[2] += Math.cos(byaw) * b.vel * dt;
        n.pos[1] = Math.sin(n.btime * 2) * 0.06 + (n.homey === undefined ? (n.homey = n.pos[1]) : n.homey);
      } else if (type === "firstperson") {
        n.pos[0] += ((keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0)) * speed * dt;
        n.pos[2] += ((keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0)) * speed * dt;
        if (keys.Space) n.pos[1] += speed * dt;
        if (game) {
          game.eye = [n.pos[0], n.pos[1] + 1.5, n.pos[2]];
          game.eyeon = true;
          game.yaw = (n.rot[1] || 0) * Math.PI / 180;
        }
      } else if (type === "camerafollow") {
        if (game) {
          game.follow = n;
          game.followdist = beval(b, "dist", 14);
          game.followheight = beval(b, "height", 3);
        }
      } else if (type === "parallax") {
        if (!n.parbase) n.parbase = n.pos.slice();
        var st = app.camstate || { eye: [0, 0, 12] };
        n.pos[0] = n.parbase[0] + st.eye[0] * beval(b, "amount", 0.5);
      } else if (type === "lookattarget") {
        var tname = b.target || "Player";
        var tnode = null;
        walk(app.scene.objects, function (o) {
          if (!tnode && o.name === tname) tnode = o;
        });
        if (tnode) n.rot[1] = Math.atan2(tnode.pos[0] - n.pos[0], tnode.pos[2] - n.pos[2]) * 180 / Math.PI;
      } else if (type === "bullet") {
        var byaw2 = (n.rot[1] || 0) * Math.PI / 180;
        var bspd = beval(b, "speed", 8);
        n.pos[0] += Math.sin(byaw2) * bspd * dt;
        n.pos[2] += Math.cos(byaw2) * bspd * dt;
        b.life = beval(b, "life", 3) - dt;
        if (b.life <= 0 && gameover) gameover[n.id] = { visible: false };
      } else if (type === "follow") {
        var fname = b.target || "Player";
        var fnode = null;
        walk(app.scene.objects, function (o) {
          if (!fnode && o.name === fname) fnode = o;
        });
        if (fnode) {
          var fdx = fnode.pos[0] - n.pos[0];
          var fdy = fnode.pos[1] - n.pos[1];
          var fdist = Math.hypot(fdx, fdy);
          if (fdist > beval(b, "range", 0.8)) {
            n.pos[0] += (fdx / fdist) * speed * dt;
            n.pos[1] += (fdy / fdist) * speed * dt;
          }
        }
      } else if (type === "destroyoffscreen") {
        if (game && Math.abs(n.pos[0] - game.x) > beval(b, "range", 22) && gameover) gameover[n.id] = { visible: false };
      } else if (type === "followcurve") {
        var curve = curvepoints(n);
        if (curve.length > 1) {
          b.t = ((beval(b, "t", 0)) + speed * dt * 0.12) % 1;
          var at = curvesample(curve, b.t);
          n.pos = at;
          n.rot[1] = Math.atan2(at[0] - n.pos[0], 0.0001) * 180 / Math.PI;
        }
      } else if (type === "repeatalongcurve") {
        var crv = curvepoints(n);
        if (crv.length > 1) {
          var tt = ((beval(b, "t", 0)) + speed * dt * 0.12);
          b.t = tt - Math.floor(tt);
          n.pos = curvesample(crv, b.t);
        }
      } else if (type === "twoboneik") {
        var tname = b.target || "";
        var tgt = null;
        walk(app.scene.objects, function (o) {
          if (!tgt && o.name === tname) tgt = o;
        });
        var len1 = beval(b, "length", 0.9);
        var len2 = beval(b, "stiffness", 0.9);
        var reachy = beval(b, "height", 1.1);
        var tp = tgt ? tgt.pos : [n.pos[0] + Math.sin(n.btime * 1.6) * 0.8, n.pos[1] + reachy, n.pos[2]];
        var dx2 = tp[0] - n.pos[0];
        var dy2 = tp[1] - n.pos[1];
        var dist2 = Math.max(0.05, Math.min(Math.hypot(dx2, dy2), len1 + len2 - 0.01));
        var base = Math.atan2(dy2, dx2);
        var ang = Math.acos(Math.max(-1, Math.min(1, (len1 * len1 + dist2 * dist2 - len2 * len2) / (2 * len1 * dist2))));
        var a1 = base + ang;
        var ex = n.pos[0] + Math.cos(a1) * len1;
        var ey = n.pos[1] + Math.sin(a1) * len1;
        n.rot[2] = a1 * 180 / Math.PI;
        n.ik = { elbow: [ex, ey], target: tp };
        var limb = null;
        (n.children || []).forEach(function (ch, ci) {
          if (ci === 0) limb = ch;
        });
        if (limb) {
          limb.pos[0] = ex;
          limb.pos[1] = ey;
          limb.pos[2] = n.pos[2];
          limb.rot[2] = Math.atan2(tp[1] - ey, tp[0] - ex) * 180 / Math.PI;
        }
      } else if (type === "health") {
        b.hp = beval(b, "hp", 3);
      }
    });
  });
}

function curvepoints(node) {
  var list = [];
  walk(app.scene.objects, function (n) {
    if (n.type === "curve") list.push([n.pos[0], n.pos[1], n.pos[2]]);
  });
  if (list.length < 2) {
    var b = node.pos;
    list = [[b[0] - 2, b[1], b[2]], [b[0], b[1] + 1, b[2]], [b[0] + 2, b[1], b[2]]];
  }
  return list;
}

function curvesample(pts, t) {
  var f = Math.max(0, Math.min(0.9999, t)) * (pts.length - 1);
  var i = Math.floor(f);
  var k = f - i;
  var a = pts[i];
  var b = pts[Math.min(pts.length - 1, i + 1)];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function physstepaabb(dt, game) {
  if (!physreset.ready) physreset();
  var g = physgravity();
  var key = app.scene.id;
  if (phys.sceneid !== key) {
    phys.sceneid = key;
    physreset();
  }
  var i, b;
  var live = [];
  for (i = 0; i < phys.bodies.length; i++) {
    b = phys.bodies[i];
    b.time += dt;
    b.node.btime = b.time;
    if (b.static) continue;
    if (!b.kinematic) b.vel[1] -= g * b.grav * dt;
    b.vel[0] *= 1 - b.damp;
    b.vel[1] *= 1 - b.damp * 0.2;
    b.vel[2] *= 1 - b.damp;
    live.push(b);
  }
  phys.joints.forEach(function (j) {
    var a = physbyid(j.a);
    var bb = physbyid(j.b);
    if (!a || !bb) return;
    var dx = bb.node.pos[0] - a.node.pos[0];
    var dy = bb.node.pos[1] - a.node.pos[1];
    var dz = bb.node.pos[2] - a.node.pos[2];
    var d = Math.hypot(dx, dy, dz) || 0.0001;
    var want = j.kind === "spring" ? d + (j.length - d) * 0.5 : j.length;
    var diff = (d - want) / d * j.stiff * 0.5;
    if (!a.static) {
      a.node.pos[0] += dx * diff;
      a.node.pos[1] += dy * diff;
      a.node.pos[2] += dz * diff;
    }
    if (!bb.static) {
      bb.node.pos[0] -= dx * diff;
      bb.node.pos[1] -= dy * diff;
      bb.node.pos[2] -= dz * diff;
    }
  });
  var sub = 1;
  live.forEach(function (bd) {
    var step = Math.max(Math.abs(bd.vel[0]), Math.max(Math.abs(bd.vel[1]), Math.abs(bd.vel[2]))) * dt;
    var thin = Math.min(bd.hw, Math.min(bd.hh, bd.hd)) * 1.4;
    if (thin > 0.02) sub = Math.max(sub, Math.ceil(step / thin));
  });
  sub = Math.min(6, sub);
  var sdt = dt / sub;
  for (var sp = 0; sp < sub; sp++) {
    if (sp > 0) {
      live.forEach(function (bd) {
        if (!bd.kinematic) bd.vel[1] -= g * bd.grav * sdt;
        bd.node.pos[0] += bd.vel[0] * sdt;
        bd.node.pos[1] += bd.vel[1] * sdt;
        bd.node.pos[2] += bd.vel[2] * sdt;
        bd.ground = false;
      });
    } else {
      live.forEach(function (bd) {
        bd.node.pos[0] += bd.vel[0] * sdt;
        bd.node.pos[1] += bd.vel[1] * sdt;
        bd.node.pos[2] += bd.vel[2] * sdt;
        bd.ground = false;
      });
    }
    var all = phys.bodies;
    for (var pass = 0; pass < 3; pass++) {
      for (i = 0; i < live.length; i++) {
        b = live[i];
        for (var k = 0; k < all.length; k++) {
          var o = all[k];
          if (o === b) continue;
          var hit = overlapof(b, o, b.node.pos, o.node.pos);
          if (!hit) continue;
          if (b.trigger || o.trigger) continue;
          if (o.static) {
            if (hit.axis === 1) {
              b.node.pos[1] = o.node.pos[1] + (o.hh + b.hh) * hit.sign;
              if (hit.sign > 0) {
                b.ground = true;
                var impact = Math.abs(b.vel[1]);
                b.vel[1] = impact < 2.2 ? 0 : Math.max(0, impact * b.rest);
                b.vel[0] *= 1 - b.fric * 0.35;
                b.vel[2] *= 1 - b.fric * 0.35;
              } else if (b.vel[1] > 0) b.vel[1] = -b.vel[1] * b.rest;
            } else if (hit.axis === 0) {
              b.node.pos[0] = o.node.pos[0] + (o.hw + b.hw) * hit.sign;
              b.vel[0] = -b.vel[0] * b.rest * 0.3;
            } else {
              b.node.pos[2] = o.node.pos[2] + (o.hd + b.hd) * hit.sign;
              b.vel[2] = -b.vel[2] * b.rest * 0.3;
            }
          } else if (b.mass >= o.mass) {
            b.node.pos[hit.axis] += hit.depth * hit.sign;
            o.node.pos[hit.axis] -= hit.depth * hit.sign * 0.5;
            o.vel[hit.axis] -= b.vel[hit.axis] * 0.3;
            if (hit.axis === 1 && hit.sign > 0) b.ground = true;
            b.vel[hit.axis] *= 0.6;
          } else {
            o.node.pos[hit.axis] += hit.depth * hit.sign;
            b.node.pos[hit.axis] -= hit.depth * hit.sign * 0.5;
            b.vel[hit.axis] *= 0.6;
          }
        }
      }
    }
  }
  phys.bodies.forEach(function (bd) {
    if (bd.static) return;
    if (bd.node.pos[1] < -60) {
      bd.node.pos = bd.home.slice();
      bd.vel = [0, 0, 0];
    }
    if (!gameover) gameover = {};
    gameover[bd.id] = gameover[bd.id] || {};
    gameover[bd.id].pos = bd.node.pos.slice();
    gameover[bd.id].rot = bd.node.rot;
  });
}

function navreset() {
  var st = app.project.navmesh || {};
  phys.cell = Math.max(0.25, parseFloat(st.cell) || 0.5);
  phys.grid = null;
  var solids = [];
  var minx = 999, maxx = -999, minz = 999, maxz = -999;
  phys.bodies.forEach(function (b) {
    if (!b.static || b.trigger) return;
    solids.push(b);
    minx = Math.min(minx, b.node.pos[0] - b.hw);
    maxx = Math.max(maxx, b.node.pos[0] + b.hw);
    minz = Math.min(minz, b.node.pos[2] - b.hd);
    maxz = Math.max(maxz, b.node.pos[2] + b.hd);
  });
  if (!solids.length) return;
  phys.min = [minx - 1, 0, minz - 1];
  phys.cols = Math.ceil((maxx - minx + 2) / phys.cell);
  phys.rows = Math.ceil((maxz - minz + 2) / phys.cell);
  var total = phys.cols * phys.rows;
  if (total > 40000) return;
  var grid = new Uint8Array(total);
  var tops = new Float32Array(total);
  phys.tops = tops;
  var slope = Math.max(0.1, parseFloat(st.slope) || 45);
  for (var r = 0; r < phys.rows; r++) {
    for (var c = 0; c < phys.cols; c++) {
      var wx = phys.min[0] + (c + 0.5) * phys.cell;
      var wz = phys.min[2] + (r + 0.5) * phys.cell;
      var top = -999;
      var blocked = false;
      for (var i = 0; i < solids.length; i++) {
        var b = solids[i];
        if (Math.abs(wx - b.node.pos[0]) > b.hw + 0.05) continue;
        if (Math.abs(wz - b.node.pos[2]) > b.hd + 0.05) continue;
        top = Math.max(top, b.node.pos[1] + b.hh);
      }
      if (top === -999) continue;
      grid[r * phys.cols + c] = 1;
      tops[r * phys.cols + c] = top;
    }
  }
  phys.grid = { cells: grid, top: 0, slope: slope };
  return phys.grid;
}

function navwalkable(c, r) {
  if (!phys.grid) return false;
  if (c < 0 || r < 0 || c >= phys.cols || r >= phys.rows) return false;
  return phys.grid.cells[r * phys.cols + c] === 1;
}

function navcellof(pos) {
  if (!phys.grid) return null;
  var c = Math.floor((pos[0] - phys.min[0]) / phys.cell);
  var r = Math.floor((pos[2] - phys.min[2]) / phys.cell);
  return [c, r];
}

function navpath(from, to) {
  if (!phys.grid) navreset();
  if (!phys.grid) return [];
  var a = navcellof(from);
  var b = navcellof(to);
  if (!a || !b) return [];
  if (!navwalkable(a[0], a[1]) || !navwalkable(b[0], b[1])) return [];
  var cols = phys.cols;
  var open = [{ c: a[0], r: a[1], g: 0, f: 0, p: null }];
  var seen = {};
  seen[a[1] * cols + a[0]] = 0;
  var best = null;
  var guard = 0;
  while (open.length && guard++ < 6000) {
    var bi = 0;
    for (var i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    var cur = open.splice(bi, 1)[0];
    if (cur.c === b[0] && cur.r === b[1]) {
      best = cur;
      break;
    }
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (var d = 0; d < dirs.length; d++) {
      var nc = cur.c + dirs[d][0];
      var nr = cur.r + dirs[d][1];
      if (!navwalkable(nc, nr)) continue;
      var id = nr * cols + nc;
      var ng = cur.g + (dirs[d][0] && dirs[d][1] ? 1.41 : 1);
      if (seen[id] !== undefined && seen[id] <= ng) continue;
      seen[id] = ng;
      var hx = Math.abs(nc - b[0]) + Math.abs(nr - b[1]);
      open.push({ c: nc, r: nr, g: ng, f: ng + hx, p: cur });
    }
  }
  if (!best) return [];
  var path = [];
  var node = best;
  while (node) {
    path.unshift([phys.min[0] + (node.c + 0.5) * phys.cell, 0, phys.min[2] + (node.r + 0.5) * phys.cell]);
    node = node.p;
  }
  return path;
}

function navtarget(node) {
  if (!phys.grid) return null;
  var c = navcellof(node.pos);
  if (!c) return null;
  for (var r = 0; r < phys.rows; r++) {
    for (var cc = 0; cc < phys.cols; cc++) {
      if (navwalkable(cc, r)) return [phys.min[0] + (cc + 0.5) * phys.cell, 0, phys.min[2] + (r + 0.5) * phys.cell];
    }
  }
  return null;
}

acts.addbehavior = function () {
  var node = selected();
  if (!node) {
    toast("Select an object first", "warn");
    return;
  }
  openmenu([{ head: "Behaviors" }].concat(behavmeta.map(function (b) {
    return { label: b.label, icon: b.icon, act: "usebehavior:" + b.id };
  })), window.innerWidth / 2 - 120, 150, {
    onact: function (name) {
      var id = name.split(":")[1];
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
      node.behaviors = node.behaviors || [];
      node.behaviors.push(beh);
      if (id === "platformer" || id === "car" || id === "boat" || id === "bullet") {
        if (hascomp(node, "physics") === false) {
          node.comps.push("physics");
          node.compdata = node.compdata || {};
          node.compdata.physics = { type: id === "car" || id === "boat" ? "Dynamic" : "Dynamic", mass: 1, gravity: 1, friction: 0.4 };
        }
      }
      if (id === "platformer" && !hascomp(node, "collider")) node.comps.push("collider");
      commit("behavior");
      toast(meta.label + " added to " + node.name, "ok");
    }
  });
};

acts.usebehavior = function (el) {
  var id = el.getAttribute("data-key");
  var node = selected();
  if (!node || !id) return;
  node.behaviors = node.behaviors || [];
  node.behaviors.push({ type: id, name: behavfind(id) ? behavfind(id).label : id, speed: 1, range: 1.5 });
  commit("behavior");
};

acts.behaviorsettings = function (el) {
  var node = selected();
  if (!node) return;
  var i = +el.getAttribute("data-index");
  var beh = (node.behaviors || [])[i];
  if (!beh) return;
  var meta = behavfind(beh.type || "mover") || behavmeta[10];
  var body = '<div class="evtform">';
  meta.p.forEach(function (key) {
    body += '<div class="frow"><div class="flabel">' + esc(key.charAt(0).toUpperCase() + key.slice(1)) + '</div><div class="fctrl"><input class="inp num" type="number" step="0.1" value="' + beval(beh, key, key === "range" ? 1.5 : 1) + '" data-bkey="' + key + '"></div></div>';
  });
  body += '<div class="frow"><div class="flabel">Target object</div><div class="fctrl"><input class="inp" value="' + esc(beh.target || "") + '" data-bkey="target" placeholder="Player"></div></div>';
  body += '<div class="frow"><div class="flabel">Axis</div><div class="fctrl"><select class="inp" data-bkey="axis">' + ["x", "y", "z"].map(function (a) {
    return '<option' + (beh.axis === a ? " selected" : "") + ">" + a + "</option>";
  }).join("") + "</select></div></div>";
  body += "</div>";
  openmodal({
    title: beval(beh, "name", meta.label),
    icon: meta.icon,
    body: body,
    footer: '<button class="btn" data-mact="cancel">Close</button><button class="btn primary" data-mact="save">Save</button>',
    onmount: function (modal) {},
    actions: {
      cancel: function (m, s) {
        closemodal(s);
      },
      save: function (m, s) {
        m.querySelectorAll("[data-bkey]").forEach(function (inp) {
          var key = inp.getAttribute("data-bkey");
          var v = inp.value;
          beh[key] = inp.type === "number" ? parseFloat(v) || 0 : v;
        });
        closemodal(s);
        commit("behavior");
      }
    }
  });
};
