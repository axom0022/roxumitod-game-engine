var extratemplates = [
  { id: "fxlab", name: "Particles lab", desc: "Fire, smoke, confetti and fireworks emitters you can tweak live.", project: "Particles Lab" },
  { id: "tilemap2d", name: "Tilemap platformer", desc: "Paint a level with the tile palette and run it with solid tile collision.", project: "Tilemap Platformer" },
  { id: "uikit", name: "UI menu kit", desc: "Canvas with buttons, sliders and progress bars wired to events.", project: "UI Menu Kit" },
  { id: "navdemo", name: "Navmesh chase", desc: "Baked navmesh, nav links and enemies chasing the hero.", project: "Navmesh Chase" },
  { id: "ragdolldemo", name: "Physics & joints", desc: "Rigid bodies, distance and spring joints, impulses and ragdoll parts.", project: "Physics Lab" }
];

function registertemplates() {
  extratemplates.forEach(function (t) {
    var exists = false;
    templates.forEach(function (x) {
      if (x.id === t.id) exists = true;
    });
    if (!exists) templates.push(t);
  });
}

function tidybase(name) {
  var sc = demoscene(name || "Main");
  var keep = [];
  sc.objects.forEach(function (n) {
    if (n.type === "camera" || n.type === "sun" || n.type === "canvas") {
      if (n.type === "canvas") n.children = [];
      keep.push(n);
    }
  });
  sc.objects = keep;
  return sc;
}

function addui(sc, kind, name, extra) {
  var node = basenode(kind, { name: name, pos: [0, 0, 0] });
  node.compdata = { ui: extra || {} };
  node.compdata.ui.anchor = node.compdata.ui.anchor || "Center";
  if (kind === "label") node.compdata.text = { size: 26, color: "#ffffff", bold: true };
  if (kind !== "label") node.comps = ["ui"];
  var canvas = null;
  sc.objects.forEach(function (n) {
    if (n.type === "canvas" && !canvas) canvas = n;
  });
  if (canvas) {
    canvas.children = canvas.children || [];
    canvas.children.push(node);
  } else sc.objects.push(node);
  return node;
}

function scenebuilder(id) {
  if (id === "fxlab") {
    var sc = tidybase("Main");
    var ground = mksprite("Ground", "tiles", [0, -2.75, -1.3], [16, 1, 1], { comps: ["sprite"] });
    sc.objects.push(ground);
    var spots = [[-4, -1, "fire"], [-1.6, -1, "smoke"], [0.8, -1, "confetti"], [3.4, -1, "sparkles"], [6, -1, "explosion"]];
    spots.forEach(function (s, i) {
      var n = basenode("cube", { name: s[2].charAt(0).toUpperCase() + s[2].slice(1) + " emitter", pos: [s[0], s[1], 0.4] });
      n.scl = [0.35, 0.35, 0.35];
      n.color = "#3b3f47";
      n.comps = ["look", "particles"];
      n.compdata = { particles: { preset: s[2], rate: fxpresets[s[2]].rate, autoplay: true } };
      sc.objects.push(n);
      if (!sc.vars) sc.vars = [];
    });
    sc.env.color = "#20242c";
    sc.name = "Particles";
    return sc;
  }
  if (id === "tilemap2d") {
    var sc2 = tidybase("Main");
    var tm = mktilemapnode();
    tm.name = "Level tiles";
    tm.pos = [0, 0.4, 0];
    var d = tiledata(tm);
    d.ts = 0.9;
    d.cols = 26;
    d.rows = 8;
    var arr = new Array(d.cols * d.rows).fill(0);
    var i2;
    for (i2 = 0; i2 < d.cols; i2++) {
      arr[6 * d.cols + i2] = 1;
      arr[7 * d.cols + i2] = 2;
    }
    for (i2 = 6; i2 <= 10; i2++) arr[5 * d.cols + i2] = 1;
    for (i2 = 11; i2 <= 15; i2++) arr[4 * d.cols + i2] = 1;
    for (i2 = 16; i2 <= 18; i2++) arr[5 * d.cols + i2] = 4;
    for (i2 = 19; i2 <= 22; i2++) arr[4 * d.cols + i2] = 4;
    tilearrayset(tm, arr);
    sc2.objects.push(tm);
    var hero = mksprite("Hero", "hero", [-7.6, -0.9, 0.4], [1, 1, 1], { comps: ["sprite", "collider", "physics"], tags: ["player"] });
    hero.behaviors = [{ type: "platformer", name: "Platformer", speed: 5, jump: 9.4 }];
    sc2.objects.push(hero);
    var coins2 = [[-6.4, -1], [-4.9, -1], [-3.3, -1], [-5.7, -0.1], [-4.4, -0.1], [-3.1, -0.1], [-1, 0.8], [0.2, 0.8], [1.4, 0.8], [3.4, -0.1], [4.4, -0.1], [6.2, 0.8], [7.2, 0.8]];
    coins2.forEach(function (cp) {
      sc2.objects.push(mksprite("Coin", "coin", [cp[0], cp[1], 0.2], [0.5, 0.5, 1], { tags: ["coin"], comps: ["sprite", "collider"] }));
    });
    sc2.objects.push(mksprite("Spikes", "spikes", [-8.6, -1.2, 0.5], [0.7, 0.7, 1], { tags: ["hazard"], comps: ["sprite", "collider"] }));
    sc2.objects.push(mksprite("Goal", "flag", [8.2, 0.95, 0.3], [1.1, 1.1, 1], { tags: ["goal"], comps: ["sprite", "collider"] }));
    sc2.name = "Tile level";
    sc2.env.color = "#bde0ff";
    return sc2;
  }
  if (id === "uikit") {
    var sc3 = tidybase("Main");
    sc3.objects.push(mksprite("Ground", "tiles", [0, -2.75, -1.3], [16, 1, 1], { comps: ["sprite"] }));
    var cv = null;
    sc3.objects.forEach(function (n) {
      if (n.type === "canvas") cv = n;
    });
    if (cv) {
      cv.children = [];
      cv.compdata = { ui: { render: "Screen Space - Overlay", refw: 740, refh: 360, scalemode: "Scale with screen size" } };
    }
    addui(sc3, "label", "Title", { anchor: "Top center", y: 52, fontsize: 34, bold: true, textcolor: "#ffffff" }).text = "Roxumitod Game Engine";
    addui(sc3, "button", "StartButton", { anchor: "Center", y: 10, w: 240, h: 56, color: "#2f6fd0", action: "restart" }).text = "Start game";
    addui(sc3, "slider", "VolumeSlider", { anchor: "Bottom center", y: -96, w: 260, h: 40, color: "#5b8def", value: 0.7 });
    addui(sc3, "bar", "HealthBar", { anchor: "Top right", x: -140, y: 42, w: 220, h: 26, color: "#37c46f", value: 0.8, text: "" });
    var joystick = addui(sc3, "joystick", "MoveStick", { anchor: "Bottom left", x: 120, y: -110, w: 130, h: 130, color: "#2f6fd0" });
    joystick.visible = true;
    sc3.name = "Menu";
    sc3.env.color = "#1e2a3a";
    return sc3;
  }
  if (id === "navdemo") {
    var sc4 = tidybase("Main");
    var floor = basenode("cube", { name: "Floor", pos: [0, -2.6, 0] });
    floor.scl = [18, 0.6, 12];
    floor.color = "#9aa2ad";
    floor.comps = ["look", "collider"];
    floor.compdata = { collider: { shape: "Box" }, physics: { type: "Static" } };
    sc4.objects.push(floor);
    [-5, 0, 5].forEach(function (x, i) {
      var wall = basenode("cube", { name: "Wall " + (i + 1), pos: [x, -1.2, -2] });
      wall.scl = [1.2, 2.2, 1.2];
      wall.color = "#6b727c";
      wall.comps = ["look", "collider"];
      wall.compdata = { collider: { shape: "Box" }, physics: { type: "Static" } };
      sc4.objects.push(wall);
    });
    var hero4 = mksprite("Hero", "hero", [-6, -1.4, 1], [1, 1, 1], { comps: ["sprite", "collider", "physics"], tags: ["player"] });
    hero4.behaviors = [{ type: "platformer", name: "Platformer", speed: 5, jump: 8 }];
    sc4.objects.push(hero4);
    var chaser = mksprite("Chaser", "slime", [4, -1.4, 1], [0.9, 0.9, 1], { comps: ["sprite", "collider", "physics"], tags: ["hazard"] });
    chaser.behaviors = [{ type: "follow", name: "Follow target", speed: 2.2, range: 0.9, target: "Hero" }];
    sc4.objects.push(chaser);
    var link = basenode("empty", { name: "NavLink", pos: [-5.5, -1.4, 1] });
    link.comps = ["navlink"];
    link.compdata = { navlink: { target: "Chaser" } };
    sc4.objects.push(link);
    sc4.name = "Chase";
    sc4.env.color = "#c9d9e6";
    return sc4;
  }
  if (id === "ragdolldemo") {
    var sc5 = tidybase("Main");
    var floor5 = basenode("cube", { name: "Floor", pos: [0, -2.7, 0] });
    floor5.scl = [20, 0.6, 10];
    floor5.color = "#8f979f";
    floor5.comps = ["look", "collider"];
    floor5.compdata = { collider: { shape: "Box" }, physics: { type: "Static" } };
    sc5.objects.push(floor5);
    var prev = null;
    ["Head", "Chest", "Hips"].forEach(function (nm, i) {
      var part = basenode(i === 0 ? "sphere" : "capsule", { name: nm, pos: [-2 + i * 0.2, 0.8 - i * 0.9, 0.6] });
      part.scl = i === 0 ? [0.55, 0.55, 0.55] : [0.5, 0.8, 0.5];
      part.color = i === 0 ? "#f0c39a" : "#4a7fd0";
      part.comps = ["look", "collider", "physics"];
      part.compdata = { physics: { type: "Dynamic", mass: 1, gravity: 1, friction: 0.5 }, collider: { shape: "Box" } };
      if (prev) {
        part.comps.push("joint");
        part.compdata.joint = { kind: "distance", target: prev.name, length: 0.9, stiffness: 1 };
      }
      sc5.objects.push(part);
      prev = part;
    });
    var arm = basenode("cube", { name: "Shoulder", pos: [-3.4, 0.6, 0.6] });
    arm.scl = [0.34, 0.34, 0.34];
    arm.color = "#7f8ea3";
    arm.rot = [0, 0, 0];
    arm.comps = ["look"];
    arm.behaviors = [{ type: "twoboneik", name: "Two-bone IK", target: "Hand grip", length: 0.9, stiffness: 0.8, height: 0.9 }];
    var forearm = basenode("cube", { name: "Forearm", pos: [-2.6, 0.2, 0.6] });
    forearm.scl = [0.9, 0.22, 0.22];
    forearm.color = "#9aa8bb";
    forearm.comps = ["look"];
    arm.children = [forearm];
    sc5.objects.push(arm);
    sc5.objects.push(forearm);
    var grip = basenode("sphere", { name: "Hand grip", pos: [-1.6, -0.6, 0.6] });
    grip.scl = [0.32, 0.32, 0.32];
    grip.color = "#e2b33f";
    grip.comps = ["look"];
    grip.behaviors = [{ type: "sine", name: "Float", speed: 1.4, range: 0.7 }];
    sc5.objects.push(grip);
    [0.4, -0.3, 1.2].forEach(function (y, i) {
      var ball = basenode("sphere", { name: "Ball " + (i + 1), pos: [2 + i * 1.2, y + 1.6, 0.5] });
      ball.scl = [0.7, 0.7, 0.7];
      ball.color = ["#e8503a", "#f5b942", "#58c46f"][i];
      ball.comps = ["look", "collider", "physics"];
      ball.compdata = { physics: { type: "Dynamic", mass: 1, gravity: 1, friction: 0.35, rest: 0.55 }, collider: { shape: "Circle" } };
      sc5.objects.push(ball);
    });
    sc5.name = "Physics";
    sc5.env.color = "#dfe9f2";
    return sc5;
  }
  return null;
}

registertemplates();
