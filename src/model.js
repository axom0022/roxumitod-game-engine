var idseq = 1;

function newid(pre) {
  idseq++;
  return (pre || "n") + idseq.toString(36) + Math.floor(Math.random() * 1296).toString(36);
}

function deep(v) {
  return JSON.parse(JSON.stringify(v));
}

var spriteinfo = {
  hero: { name: "Hero", w: 64, h: 64, depth: 0.18, side: "#e0a566", mode: "billboard" },
  slime: { name: "Slime", w: 64, h: 64, depth: 0.18, side: "#a86fd6", mode: "billboard" },
  coin: { name: "Coin", w: 64, h: 64, depth: 0.14, side: "#d79c1f", mode: "billboard" },
  heart: { name: "Heart", w: 64, h: 64, depth: 0.14, side: "#c93c2c", mode: "billboard" },
  flag: { name: "Flag", w: 64, h: 64, depth: 0.14, side: "#c98a52", mode: "billboard" },
  spikes: { name: "Spikes", w: 64, h: 64, depth: 0.5, side: "#8b929c", mode: "sprite" },
  tiles: { name: "Tiles", w: 64, h: 64, depth: 1.1, side: "#c8794a", mode: "sprite" },
  nearhills: { name: "Near hills", w: 256, h: 128, depth: 0.01, side: "#5cc446", mode: "plane" },
  farhills: { name: "Far hills", w: 256, h: 128, depth: 0.01, side: "#c3efb9", mode: "plane" },
  crate: { name: "Crate", w: 64, h: 64, depth: 0.9, side: "#a9713f", mode: "sprite" },
  tree: { name: "Tree", w: 64, h: 64, depth: 0.9, side: "#3f9c3a", mode: "sprite" },
  rock: { name: "Rock", w: 64, h: 64, depth: 0.9, side: "#8e95a0", mode: "sprite" },
  mushroom: { name: "Mushroom", w: 64, h: 64, depth: 0.7, side: "#e8503a", mode: "sprite" },
  column: { name: "Column", w: 64, h: 64, depth: 0.9, side: "#a9adb6", mode: "sprite" },
  door: { name: "Door", w: 64, h: 64, depth: 0.9, side: "#8a5a3a", mode: "sprite" },
  fence: { name: "Fence", w: 64, h: 64, depth: 0.2, side: "#b5753f", mode: "sprite" }
};

var imageassets = [
  { id: "engine", name: "Engine logo", sprite: "logo", type: "image" },
  { id: "hero", name: "Hero", sprite: "hero", type: "image" },
  { id: "slime", name: "Slime", sprite: "slime", type: "image" },
  { id: "coin", name: "Coin", sprite: "coin", type: "image" },
  { id: "heart", name: "Heart", sprite: "heart", type: "image" },
  { id: "flag", name: "Flag", sprite: "flag", type: "image" },
  { id: "spikes", name: "Spikes", sprite: "spikes", type: "image" },
  { id: "tiles", name: "Tiles", sprite: "tiles", type: "image" },
  { id: "farhills", name: "Far hills", sprite: "farhills", type: "image" },
  { id: "nearhills", name: "Near hills", sprite: "nearhills", type: "image" }
];

var soundassets = [
  { id: "sndcoin", name: "Coin", size: "6.0 KB", freq: 880 },
  { id: "sndjump", name: "Jump", size: "6.6 KB", freq: 520 },
  { id: "sndwin", name: "Win", size: "9.4 KB", freq: 740 },
  { id: "sndlose", name: "Lose", size: "6.9 KB", freq: 220 },
  { id: "sndpunch", name: "Punch", size: "8.6 KB", freq: 160 },
  { id: "sndpower", name: "PowerUp", size: "8.8 KB", freq: 990 }
];

var nodemeta = {
  camera: { label: "Camera", icon: "camera", group: "objects" },
  sun: { label: "Sun", icon: "sun", group: "objects" },
  cube: { label: "Cube", icon: "cube", group: "shapes" },
  sphere: { label: "Sphere", icon: "sphere", group: "shapes" },
  plane: { label: "Plane", icon: "plane", group: "shapes" },
  capsule: { label: "Capsule", icon: "capsule", group: "shapes" },
  cylinder: { label: "Cylinder", icon: "cylinder", group: "shapes" },
  cone: { label: "Cone", icon: "cone", group: "shapes" },
  torus: { label: "Torus", icon: "torus", group: "shapes" },
  empty: { label: "Empty object", icon: "empty", group: "objects" },
  terrain: { label: "Terrain (hills)", icon: "hills", group: "objects" },
  screengui: { label: "ScreenGui", icon: "layers", group: "gui" },
  frame: { label: "Frame", icon: "square", group: "gui" },
  image: { label: "Image", icon: "image", group: "gui" },
  water: { label: "Water", icon: "water", group: "objects" },
  curve: { label: "Curve", icon: "curve", group: "objects" },
  text3d: { label: "Text (3D)", icon: "text", group: "objects" },
  canvas: { label: "Canvas", icon: "monitor", group: "ui" },
  label: { label: "Text", icon: "text", group: "ui" },
  button: { label: "Button", icon: "squareplus", group: "ui" },
  slider: { label: "Slider", icon: "sliders", group: "ui" },
  bar: { label: "Progress bar", icon: "table", group: "ui" },
  joystick: { label: "Joystick", icon: "joystick", group: "ui" },
  tilemap: { label: "Tilemap", icon: "grid", group: "objects" },
  model: { label: "3D model", icon: "cube", group: "objects" },
  sprite: { label: "Sprite", icon: "sprite", group: "sprites" }
};

var compmeta = [
  { id: "look", label: "Shape & look", icon: "palette" },
  { id: "camera", label: "Camera", icon: "camera" },
  { id: "light", label: "Light", icon: "light" },
  { id: "collider", label: "Collider", icon: "collider" },
  { id: "physics", label: "Physics body", icon: "physics" },
  { id: "joint", label: "Joint", icon: "network" },
  { id: "sound", label: "Sound", icon: "sound" },
  { id: "text", label: "Text", icon: "text" },
  { id: "ui", label: "UI element", icon: "monitor" },
  { id: "script", label: "Code script", icon: "script" },
  { id: "particles", label: "Particles", icon: "particles" },
  { id: "terrain", label: "Terrain", icon: "hills" },
  { id: "water", label: "Water", icon: "water" },
  { id: "curve", label: "Curve", icon: "curve" },
  { id: "sprite", label: "Sprite", icon: "sprite" },
  { id: "animator", label: "Animator", icon: "animator" },
  { id: "tilemap", label: "Tilemap", icon: "grid" },
  { id: "model", label: "3D model", icon: "cube" },
  { id: "navlink", label: "Nav link", icon: "target" }
];

var defaultcode = "// Runs on the entity this script is attached to.\n// Available: entity, game, input, and helpers (see docs).\n\nexport let speed = 2;\n\nfunction start() {\n  // called once when the scene starts\n}\n\nfunction update(dt) {\n  // called every frame; dt = seconds since last frame\n}\n\nfunction oncollision(other, collision) {\n  // called when this entity starts touching another;\n  // collision.point, collision.normal, collision.speed, collision.impulse...\n}\n";

var scripttemplates = {
  GameScript: "// Scene-wide game logic for this scene sheet.\n// game holds the running scene, input the keyboard state.\n\nlet score = 0;\nlet lives = 3;\n\nfunction start() {\n  game.setui(\"ScoreText\", \"Score: \" + score);\n}\n\nfunction update(dt) {\n  if (input.pressed(\"Space\")) game.jump(\"Player\");\n  if (game.count(\"Coin\") === 0) game.win();\n}\n\nfunction oncollect(coin) {\n  score += 1;\n  game.setui(\"ScoreText\", \"Score: \" + score);\n  game.play(\"Coin\");\n}\n",
  MyScript: defaultcode,
  Utils: "// Shared helper library, import from any script.\n\nexport function clamp(value, min, max) {\n  return Math.max(min, Math.min(max, value));\n}\n\nexport function lerp(a, b, t) {\n  return a + (b - a) * t;\n}\n\nexport function sign(value) {\n  return value < 0 ? -1 : value > 0 ? 1 : 0;\n}\n"
};

function basenode(type, opt) {
  opt = opt || {};
  var meta = nodemeta[type] || nodemeta.empty;
  var n = {
    id: newid(),
    name: opt.name || meta.label,
    type: type,
    visible: true,
    active: true,
    lock: false,
    pos: opt.pos || [0, 0, 0],
    rot: opt.rot || [0, 0, 0],
    scl: opt.scl || [1, 1, 1],
    tags: opt.tags || [],
    comps: opt.comps || [],
    vars: opt.vars || [],
    behaviors: opt.behaviors || [],
    compdata: opt.compdata || {},
    sprite: opt.sprite || "",
    color: opt.color || "#ffffff",
    opacity: 1,
    ppm: 64,
    flipx: false,
    flipy: false,
    facecamera: false,
    text: opt.text || "",
    children: []
  };
  if (type === "sprite") n.comps = ["sprite"];
  if (type === "camera") n.comps = ["camera"];
  if (type === "sun") n.comps = ["light"];
  if (type === "cube" || type === "sphere" || type === "cylinder" || type === "cone" || type === "capsule" || type === "torus" || type === "plane") n.comps = ["look"];
  if (type === "canvas" || type === "screengui" || type === "frame" || type === "image") n.comps = ["ui"];
  if (type === "label") n.comps = ["ui", "text"];
  if (type === "button" || type === "slider" || type === "bar" || type === "joystick") n.comps = ["ui"];
  if (type === "tilemap") n.comps = ["tilemap"];
  if (type === "model") n.comps = ["model"];
  if (type === "model") n.model = opt.model || "";
  if (type === "screengui") n.children = n.children || [];
  return n;
}

function mksprite(name, sprite, pos, scl, extra) {
  var n = basenode("sprite", { name: name, sprite: sprite, pos: pos, scl: scl || [1, 1, 1], tags: (extra && extra.tags) || [] });
  if (extra) for (var k in extra) if (k !== "tags") n[k] = extra[k];
  return n;
}

function demoobjects() {
  var list = [];
  list.push(basenode("camera", { name: "Camera", pos: [0, 0.6, 12.5], rot: [0, 0, 0] }));
  list.push(basenode("sun", { name: "Sun", pos: [0, 8, 4], rot: [-50, -35, 0] }));
  list.push(mksprite("Player", "hero", [-2.6, 0.12, 0.8], [1, 1, 1], { comps: ["sprite", "collider", "physics"] }));
  list.push(basenode("empty", { name: "Level", pos: [0, 0, 0] }));
  list.push(mksprite("Moving platform", "tiles", [1.2, -1.2, 0.4], [1.5, 0.36, 1], { comps: ["sprite", "collider"], behaviors: [{ name: "Move x", speed: 1.4, range: 1.8 }] }));
  list.push(mksprite("Spikes", "spikes", [-4.6, -1.62, 0.55], [0.75, 0.75, 1], { tags: ["hazard"], comps: ["sprite", "collider"] }));
  list.push(mksprite("Spikes", "spikes", [0.2, -1.62, 0.7], [0.75, 0.75, 1], { tags: ["hazard"], comps: ["sprite", "collider"] }));
  list.push(mksprite("Enemy", "slime", [2.6, -1.55, 0.6], [0.9, 0.9, 1], { tags: ["enemy", "hazard"], comps: ["sprite", "collider"], behaviors: [{ name: "Patrol", speed: 0.9, range: 1.2 }] }));
  var coinpos = [[-0.7, -0.05, 0.2], [0.1, 0.35, 0.15], [0.9, 0.62, 0.1], [1.7, 0.36, 0.1], [2.5, 0.0, 0.15], [4.0, 0.55, 0.2], [4.85, 0.95, 0.2], [5.7, 1.3, 0.2], [6.7, 1.0, 0.15], [7.55, 1.32, 0.1]];
  for (var c = 0; c < coinpos.length; c++) {
    list.push(mksprite("Coin", "coin", coinpos[c], [0.5, 0.5, 1], { tags: ["coin"], comps: ["sprite", "collider"], behaviors: [{ name: "Spin", speed: 2 }] }));
  }
  list.push(mksprite("Heart", "heart", [0.2, 1.95, 0.1], [0.7, 0.7, 1], { tags: ["pickup"], comps: ["sprite"] }));
  var goalflag = mksprite("Goal", "flag", [8.4, -1.44, 0.3], [1.05, 1.05, 1], { tags: ["goal"], comps: ["sprite", "collider", "particles"] });
  goalflag.compdata = { particles: { preset: "sparkles", rate: 12 } };
  list.push(goalflag);
  var fh = [-9.6, -3.2, 3.2, 9.6];
  for (var f = 0; f < fh.length; f++) list.push(mksprite("Far hills", "farhills", [fh[f], -0.9, -10], [3.2, 3.2, 1], { comps: ["sprite"] }));
  var nh = [-9.6, -3.2, 3.2, 9.6];
  for (var n = 0; n < nh.length; n++) list.push(mksprite("Near hills", "nearhills", [nh[n], -1.25, -6.5], [3.0, 3.0, 1], { comps: ["sprite"] }));
  var level = mksprite("Ground", "tiles", [0.9, -2.75, -1.3], [16, 1.0, 1], { comps: ["sprite"] });
  var platleft = mksprite("Platform left", "tiles", [-1.9, -0.9, 0.75], [4.4, 1.0, 1], { comps: ["sprite", "collider"] });
  var platright = mksprite("Platform right", "tiles", [4.6, -0.2, 0.5], [3.2, 1.0, 1], { comps: ["sprite", "collider"] });
  var platfar = mksprite("Platform far", "tiles", [7.7, 0.3, -0.3], [1.8, 0.8, 1], { comps: ["sprite", "collider"] });
  var lvl = list[3];
  lvl.children = [platleft, platright, platfar, level];
  var canvas = basenode("canvas", { name: "Canvas", pos: [0, 0, 0] });
  var score = basenode("label", { name: "ScoreText", pos: [0, 0, 0] });
  score.text = "Score: 0";
  score.compdata = { text: { size: 28, color: "#ffffff", bold: true } };
  var lives = basenode("label", { name: "LivesBar", pos: [0, 0, 0] });
  lives.text = "Lives";
  canvas.children = [score, lives];
  list.push(canvas);
  return list;
}
function demoscene(name) {
  return {
    id: newid("sc"),
    name: name || "Main",
    isstart: true,
    loadingscreen: false,
    objects: demoobjects(),
    env: { bgtype: "color", color: "#c5e4ff", sky: "sky", tonemap: "none", ambient: "#ffffff", strength: 0.6, fog: false, turn: 0, brightness: 1, lightwithsky: true, loadingcolor: "#f9e0c2", gridy: -3.25 },
    vars: [],
    eventsheet: "Main events"
  };
}

function emptyscene(name) {
  return {
    id: newid("sc"),
    name: name || "Main",
    objects: [],
    env: { bgtype: "color", color: "#c5e4ff", sky: "sky", tonemap: "none", ambient: "#ffffff", strength: 0.6, fog: false, turn: 0, brightness: 1, lightwithsky: true, loadingcolor: "#f9e0c2", gridy: -0.001 },
    vars: [],
    eventsheet: "Main events"
  };
}

var templates = [
  { id: "empty", name: "Empty 3D scene", desc: "Camera, light and ground. Start from scratch.", project: "Empty Scene" },
  { id: "physics", name: "Physics playground", desc: "Boxes and balls falling onto the ground.", project: "Physics Playground" },
  { id: "rollaball", name: "Roll-a-ball: Coin collector", desc: "Roll the ball around and collect spinning coins.", project: "Roll-a-ball" },
  { id: "platform3d", name: "3D Platform", desc: "Run and jump with an animated hero, grab the coins, reach the flag.", project: "3D Platform" },
  { id: "platform2d", name: "2D Platform", desc: "Side-on platformer: run, jump gaps, stomp the slime, reach the flag.", project: "2D Platform" },
  { id: "runner", name: "Endless runner", desc: "Swipe between lanes, jump over crates, grab coins. How far can you get?", project: "Endless Runner" },
  { id: "arena", name: "Arena shooter", desc: "Dodge waves of slimes while your hero shoots the nearest one. Survive as long as you can!", project: "Arena Shooter" },
  { id: "hill", name: "Hill explorer", desc: "Find the gems on rolling hills while a hunter chases you around the trees.", project: "Hill Explorer" },
  { id: "space", name: "Space shooter", desc: "Blast asteroids and survive the endless waves.", project: "Space Shooter" },
  { id: "kart", name: "Kart racer", desc: "Race opponents around the track and finish first.", project: "Kart Racer" },
  { id: "defense", name: "Tower defense", desc: "Build towers and stop the slimes reaching your base.", project: "Tower Defense" },
  { id: "puzzle", name: "Puzzle blocks", desc: "Match three or more blocks to clear the board.", project: "Puzzle Blocks" }
];

function projectbyid(id) {
  for (var i = 0; i < templates.length; i++) if (templates[i].id === id) return templates[i];
  return null;
}

function templateor(id) {
  return projectbyid(id) || projectbyid("empty");
}

function demoevents() {
  return [
    { when: "Player collides with Coin", do: "Add 1 to Score", obj: "Coin" },
    { when: "Player collides with Coin", do: "Play sound Coin", obj: "Coin" },
    { when: "Player collides with Spikes", do: "Remove 1 life", obj: "Spikes" },
    { when: "Player collides with Enemy", do: "Remove 1 life", obj: "Enemy" },
    { when: "Player collides with Goal", do: "Add 5 to Score", obj: "Goal" },
    { when: "Player collides with Goal", do: "Win the game", obj: "Goal" }
  ];
}

function makeproject(tplid) {
  var tpl = templateor(tplid);
  tplid = tpl.id;
  var sc = tplid === "platform2d" || tplid === "empty" ? (tplid === "empty" ? emptyscene("Main") : demoscene("Main")) : scenefortemplate(tplid);
  var p = {
    id: newid("pr"),
    name: tpl.project,
    template: tplid,
    startscene: sc.id,
    orientation: "landscape",
    loadingstyle: "bar",
    icon: "none",
    graphics: {
      quality: "high",
      startquality: "high",
      maxratio: 1.5,
      smooth: false,
      shadows: true,
      shadowsize: 1024,
      cascades: 4,
      bloom: false,
      dof: false,
      ao: false,
      fxaa: true
    },
    globals: [{ name: "Score", type: "number", value: 0 }],
    assets: [],
    models: [],
    navmesh: { cell: 0.5, slope: 45, step: 0.4, agent: 0.4, links: true, baked: false },
    scripts: [
      { id: newid("s"), name: "GameScript", kind: "Scene script", code: scripttemplates.GameScript },
      { id: newid("s"), name: "MyScript", kind: "Object script", code: scripttemplates.MyScript },
      { id: newid("s"), name: "Utils", kind: "Library", code: scripttemplates.Utils }
    ],
    eventsheets: [
      { id: newid("e"), name: "Main events", scene: sc.id, count: 21, events: demoevents() },
      { id: newid("e"), name: "Loading events", scene: "", count: 4 }
    ],
    scenes: [sc],
    created: Date.now(),
    updated: Date.now()
  };
  if (tplid !== "platform2d" && tplid !== "empty") {
    var extra = { id: newid("sc"), name: "Loading", isstart: false, loadingscreen: true, objects: [basenode("camera", { name: "Camera", pos: [0, 2, 12] }), basenode("sun", { name: "Sun", pos: [0, 8, 4], rot: [-50, -35, 0] })], env: deep(sc.env), vars: [], eventsheet: "Loading events" };
    p.scenes.push(extra);
  }
  return p;
}

function scenefortemplate(id) {
  if (typeof scenebuilder === "function") {
    var built = scenebuilder(id);
    if (built) return built;
  }
  var sc = demoscene("Main");
  var objs = sc.objects;
  function find(nm) {
    var out = null;
    walk(objs, function (n) {
      if (n.name === nm) out = n;
    });
    return out;
  }
  var cam = find("Camera");
  var sun = find("Sun");
  var lvl = find("Level");
  var canvas = find("Canvas");
  if (id === "physics") {
    cam.pos = [0, 3.6, 13.5];
    cam.rot = [-6, 0, 0];
    objs.length = 0;
    objs.push(cam, sun, lvl, canvas);
    lvl.children = [mksprite("Ground", "tiles", [0, -2.2, 0.4], [13, 1.9, 1], {})];
    var cols = ["#e08a4f", "#d9b44a", "#6ec0a0", "#7fa8e8", "#b47fd6"];
    for (var i = 0; i < 7; i++) {
      var b = basenode(i % 3 === 0 ? "sphere" : "cube", { name: "Box " + (i + 1), pos: [-3 + i * 1.05, 1.4 + (i % 3) * 1.1, 0.6 - (i % 2) * 0.7], scl: [0.75, 0.75, 0.75] });
      b.color = cols[i % cols.length];
      b.comps = ["look", "physics", "collider"];
      objs.push(b);
    }
  } else if (id === "rollaball") {
    objs.length = 0;
    objs.push(cam, sun, lvl, canvas);
    cam.pos = [0, 4.6, 13];
    cam.rot = [-10, 0, 0];
    lvl.children = [mksprite("Ground", "tiles", [0, -2.2, 0.4], [13, 1.9, 1], {})];
    var ball = basenode("sphere", { name: "Ball", pos: [0, 0.4, 0], scl: [1, 1, 1] });
    ball.color = "#5aa9d1";
    ball.comps = ["look", "physics"];
    objs.push(ball);
    for (var c2 = 0; c2 < 9; c2++) {
      objs.push(mksprite("Coin", "coin", [-4 + c2 * 1.0, 0.6, -1 + (c2 % 3) * 0.9], [0.5, 0.5, 1], { tags: ["coin"], comps: ["sprite", "collider"], behaviors: [{ name: "Spin", speed: 2 }] }));
    }
  } else if (id === "runner" || id === "kart") {
    objs.length = 0;
    objs.push(cam, sun, lvl, canvas);
    cam.pos = [0, 2.2, 10.5];
    cam.rot = [-4, 0, 0];
    lvl.children = [];
    for (var l = 0; l < 5; l++) lvl.children.push(mksprite("Lane " + (l + 1), "tiles", [0, -2.3, 2.4 - l * 2.4], [1.9, 1.7, 1], {}));
    objs.push(mksprite("Player", "hero", [-1.35, -0.7, 1.2], [1, 1, 1], { comps: ["sprite", "collider"] }));
    for (var k = 0; k < 6; k++) objs.push(mksprite("Coin", "coin", [-1.35 + (k % 3) * 1.35, -1.2 + Math.floor(k / 3) * 0.4, 0 - k * 1.1], [0.5, 0.5, 1], { tags: ["coin"], comps: ["sprite"] }));
    objs.push(mksprite("Crate", "crate", [1.35, -0.5, -2.4], [0.8, 0.8, 0.8], { comps: ["sprite"] }));
  } else if (id === "arena") {
    objs.length = 0;
    objs.push(cam, sun, lvl, canvas);
    cam.pos = [0, 8.5, 11];
    cam.rot = [-35, 0, 0];
    lvl.children = [mksprite("Floor", "tiles", [0, -2.3, -2], [15, 1.6, 1], {})];
    objs.push(mksprite("Player", "hero", [0, -0.4, 0], [1, 1, 1], { comps: ["sprite", "collider"] }));
    for (var e = 0; e < 6; e++) {
      var sl = mksprite("Slime " + (e + 1), "slime", [-4 + e * 1.6, -0.5 + (e % 2) * 0.4, -3 - (e % 3) * 1.4], [0.8, 0.8, 1], { tags: ["enemy"], comps: ["sprite", "collider"] });
      objs.push(sl);
    }
  } else if (id === "hill") {
    objs.length = 0;
    objs.push(cam, sun, lvl, canvas);
    cam.pos = [0, 4.2, 12];
    cam.rot = [-8, 0, 0];
    lvl.children = [mksprite("Ground", "tiles", [0, -2.2, 0.4], [14, 1.9, 1], {})];
    for (var h = 0; h < 4; h++) objs.push(mksprite("Hill " + (h + 1), "nearhills", [-6 + h * 4, -0.8, -4], [1.6, 1.6, 1], {}));
    for (var g2 = 0; g2 < 5; g2++) objs.push(mksprite("Coin", "coin", [-3 + g2 * 1.5, 0.6, 1], [0.5, 0.5, 1], { tags: ["coin"], comps: ["sprite"] }));
    objs.push(mksprite("Player", "hero", [0, -0.4, 1.5], [1, 1, 1], { comps: ["sprite", "collider"] }));
    objs.push(mksprite("Tree", "tree", [3.5, -0.9, 0], [1.2, 1.2, 1], { comps: ["sprite"] }));
  } else if (id === "space") {
    objs.length = 0;
    objs.push(cam, sun, lvl, canvas);
    cam.pos = [0, 3.5, 12];
    cam.rot = [-6, 0, 0];
    sc.env.bgtype = "color";
    sc.env.color = "#141a2b";
    sc.env.strength = 0.9;
    objs.push(mksprite("Player", "hero", [0, -0.8, 1], [0.9, 0.9, 1], { comps: ["sprite", "collider"] }));
    for (var s = 0; s < 10; s++) {
      var rk = basenode("cube", { name: "Asteroid " + (s + 1), pos: [-5 + s, 1 + (s % 4), -2 - (s % 3) * 2], rot: [s * 12, s * 21, s * 8], scl: [0.5, 0.5, 0.5] });
      rk.color = "#8e95a0";
      rk.comps = ["look"];
      objs.push(rk);
    }
  } else if (id === "defense" || id === "puzzle") {
    cam.pos = [0, 7.5, 13];
    cam.rot = [-30, 0, 0];
    lvl.children = [mksprite("Ground", "tiles", [0, -2.3, 0.4], [14, 1.7, 1], {})];
  }
  return sc;
}

function walk(list, fn) {
  for (var i = 0; i < list.length; i++) {
    fn(list[i]);
    if (list[i].children && list[i].children.length) walk(list[i].children, fn);
  }
}

function flatfind(id) {
  var found = null;
  walk(app.scene.objects, function (n) {
    if (n.id === id) found = n;
  });
  return found;
}

function findnode(list, id) {
  var found = null;
  walk(list, function (n) {
    if (n.id === id) found = n;
  });
  return found;
}

function parentlistof(id) {
  var out = null;
  (function rec(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return (out = { list: list, index: i, parent: null });
      if (list[i].children && list[i].children.length) {
        var r = lookin(list[i], list[i].children, id);
        if (r) out = r;
      }
    }
  })(app.scene.objects);
  function lookin(parent, list, id2) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id2) return { list: list, index: i, parent: parent };
      if (list[i].children && list[i].children.length) {
        var r = lookin(list[i], list[i].children, id2);
        if (r) return r;
      }
    }
    return null;
  }
  return out;
}

function worldmatrix(node) {
  var chain = [];
  (function find(list, parents) {
    for (var i = 0; i < list.length; i++) {
      var p2 = parents.concat([list[i]]);
      if (list[i].id === node.id) {
        chain = p2;
        return true;
      }
      if (list[i].children && list[i].children.length && find(list[i].children, p2)) return true;
    }
    return false;
  })(app.scene.objects, []);
  var m = m4();
  for (var i = 0; i < chain.length; i++) {
    m = m4mul(m, m4compose(chain[i].pos, chain[i].rot, chain[i].scl));
  }
  return m;
}

function worldpos(node) {
  var m = worldmatrix(node);
  return [m[12], m[13], m[14]];
}

function nodeparent(node) {
  var pl = parentlistof(node.id);
  return pl ? pl.parent : null;
}

function descendants(node) {
  var out = [];
  (function rec(n) {
    (n.children || []).forEach(function (c) {
      out.push(c);
      rec(c);
    });
  })(node);
  return out;
}

function spriteof(node) {
  return spriteinfo[node.sprite] || null;
}

function nodesize(node) {
  var info = spriteof(node);
  if (node.type === "sprite" && info) {
    var sx = info.w / (node.ppm || 64) * node.scl[0];
    var sy = info.h / (node.ppm || 64) * node.scl[1];
    var dz = (info.mode === "plane" ? 0.01 : info.depth) * node.scl[2];
    return [sx, sy, Math.max(0.01, dz)];
  }
  if (node.type === "text3d") {
    return [2 * node.scl[0], 0.5 * node.scl[1], 0.02];
  }
  if (node.type === "terrain") return [8 * node.scl[0], 2.4 * node.scl[1], 1];
  if (node.type === "water") return [4 * node.scl[0], 0.05, 4 * node.scl[2]];
  if (node.type === "curve") return [2 * node.scl[0], 0.1, 0.1];
  if (node.type === "plane") return [node.scl[0], node.scl[1], 0.02];
  if (node.type === "camera" || node.type === "sun" || node.type === "empty" || node.type === "canvas" || node.type === "label" || node.type === "screengui" || node.type === "frame" || node.type === "image") return [0.8, 0.8, 0.8];
  return [node.scl[0], node.scl[1], node.scl[2]];
}

function nodeextents(node) {
  var s = nodesize(node);
  return [s[0] / 2, s[1] / 2, s[2] / 2];
}

function defaultapp() {
  var projects = loadprojects();
  var p = projects.length ? projects[0] : makeproject("platform2d");
  return {
    screen: "editor",
    projects: projects,
    project: p,
    sceneid: p.scenes[0].id,
    selid: null,
    tab: "scene",
    dock: "objects",
    right: "inspector",
    backend: "three",
    play: false,
    cam: { yaw: -0.2, pitch: 0.17, dist: 21.5, target: [1.2, -1.15, 0], mode: "persp", fov: 38 },
    transformmode: "move",
    showgrid: true,
    preview: true,
    undolist: [],
    redolist: [],
    filesview: "grid",
    filesfilter: "all",
    assetkit: "proto",
    imagekit: "uipack",
    assetmode: "models",
    closedsecs: {},
    gui: { active: null },
    spriteedit: null,
    modals: [],
    solotab: null,
    dirty: false
  };
}

var app = null;

function saveprojects() {
  try {
    var list = [];
    var seen = {};
    var found = false;
    var src = app.projects.slice(0);
    for (var i = 0; i < src.length; i++) {
      var key = String(src[i].id);
      if (seen[key]) continue;
      seen[key] = true;
      if (key === String(app.project.id)) {
        list.push(app.project);
        found = true;
      } else {
        list.push(src[i]);
      }
    }
    if (!found) list.unshift(app.project);
    app.projects = list;
    localStorage.setItem("roxumitod-projects-v1", JSON.stringify(list));
  } catch (e) {}
}

function loadprojects() {
  try {
    var raw = localStorage.getItem("roxumitod-projects-v1") || localStorage.getItem("unixomut-projects-v1");
    if (!raw) return [];
    var list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function savesession() {
  try {
    if (!app || !app.project) return;
    saveprojects();
    localStorage.setItem("roxumitod-session-v1", JSON.stringify({ projectid: app.project.id, sceneid: app.sceneid, backend: app.backend }));
  } catch (e) {}
}

function loadsession() {
  try {
    var raw = localStorage.getItem("roxumitod-session-v1") || localStorage.getItem("unixomut-session-v1");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function activescene() {
  for (var i = 0; i < app.project.scenes.length; i++) if (app.project.scenes[i].id === app.sceneid) return app.project.scenes[i];
  return app.project.scenes[0];
}

function sceneindex() {
  for (var i = 0; i < app.project.scenes.length; i++) if (app.project.scenes[i].id === app.sceneid) return i;
  return 0;
}

function selectscene(id) {
  if (typeof camsave === "function") camsave();
  app.sceneid = id;
  app.scene = activescene();
  if (typeof camload === "function") camload();
  app.selid = null;
  app.selids = [];
  app.undolist = [];
  app.redolist = [];
  app.snapbase = snapshot();
  saveprojects();
}

function snapshot() {
  return JSON.stringify({
    objects: app.scene.objects,
    name: app.scene.name,
    env: app.scene.env,
    vars: app.scene.vars,
    cam: app.scene.cam || null,
    graphics: app.project.graphics,
    globals: app.project.globals,
    scripts: app.project.scripts,
    eventsheets: app.project.eventsheets,
    projectname: app.project.name,
    startscene: app.project.startscene,
    mats: app.project.mats,
    anims: app.project.anims,
    sheets: app.project.sheets,
    shaders: app.project.shaders,
    timelines: app.project.timelines,
    locs: app.project.locs,
    services: app.project.services,
    tables: app.project.tables
  });
}

function commit(label) {
  if (!app || !app.scene) return;
  var cur = snapshot();
  if (app.snapbase && app.snapbase !== cur) {
    app.undolist.push(app.snapbase);
    if (app.undolist.length > 60) app.undolist.shift();
  }
  app.snapbase = cur;
  app.redolist = [];
  app.project.updated = Date.now();
  app.dirty = true;
  saveprojects();
  if (typeof refreshall === "function") refreshall(label);
}

function restore(snap) {
  var data = JSON.parse(snap);
  app.scene.objects = data.objects;
  app.scene.name = data.name;
  app.scene.env = data.env;
  app.scene.vars = data.vars;
  if (data.cam) app.scene.cam = data.cam;
  if (data.graphics) app.project.graphics = data.graphics;
  if (data.globals) app.project.globals = data.globals;
  if (data.scripts) app.project.scripts = data.scripts;
  if (data.eventsheets) app.project.eventsheets = data.eventsheets;
  if (data.projectname) app.project.name = data.projectname;
  if (data.startscene) app.project.startscene = data.startscene;
  if (data.mats) app.project.mats = data.mats;
  if (data.anims) app.project.anims = data.anims;
  if (data.sheets) app.project.sheets = data.sheets;
  if (data.shaders) app.project.shaders = data.shaders;
  if (data.timelines) app.project.timelines = data.timelines;
  if (data.locs) app.project.locs = data.locs;
  if (data.services) app.project.services = data.services;
  if (data.tables) app.project.tables = data.tables;
  if (app.selid && !findnode(app.scene.objects, app.selid)) app.selid = null;
  app.snapbase = snapshot();
  saveprojects();
  if (typeof refreshall === "function") refreshall();
}

function undostep() {
  if (!app.undolist.length) {
    toast("Nothing to undo", "warn");
    return;
  }
  app.redolist.push(snapshot());
  restore(app.undolist.pop());
}

function redostep() {
  if (!app.redolist.length) {
    toast("Nothing to redo", "warn");
    return;
  }
  app.undolist.push(snapshot());
  restore(app.redolist.pop());
}

function selected() {
  return app.selid ? findnode(app.scene.objects, app.selid) : null;
}

function selectionnodes() {
  var out = [];
  var ids = (app.selids && app.selids.length ? app.selids : (app.selid ? [app.selid] : []));
  ids.forEach(function (id) {
    var n = findnode(app.scene.objects, id);
    if (n && out.indexOf(n) < 0) out.push(n);
  });
  return out;
}

function camsave() {
  if (!app.scene) return;
  app.scene.cam = { yaw: app.cam.yaw, pitch: app.cam.pitch, dist: app.cam.dist, target: app.cam.target.slice(), mode: app.cam.mode, ortho: !!app.cam.ortho, halfw: app.cam.halfw || 6 };
}

function camload() {
  var c = app.scene && app.scene.cam;
  if (!c) {
    app.cam.yaw = -0.2;
    app.cam.pitch = 0.17;
    app.cam.dist = 21.5;
    app.cam.target = [1.2, -1.15, 0];
    app.cam.mode = "persp";
    app.cam.ortho = false;
    app.cam.halfw = 6;
    return;
  }
  app.cam.yaw = c.yaw;
  app.cam.pitch = c.pitch;
  app.cam.dist = c.dist;
  app.cam.target = c.target.slice();
  app.cam.mode = c.mode || "persp";
  app.cam.ortho = !!c.ortho;
  app.cam.halfw = c.halfw || 6;
}

function uniqueid(list, base) {
  var names = {};
  walk(list, function (n) {
    names[n.name] = true;
  });
  if (!names[base]) return base;
  var i = 2;
  while (names[base + " " + i]) i++;
  return base + " " + i;
}

function addnode(node, parentnode) {
  if (typeof partinit === "function") partinit(node);
  if (parentnode) parentnode.children = parentnode.children || [];
  var list = parentnode ? parentnode.children : app.scene.objects;
  node.name = uniqueid(app.scene.objects, node.name);
  list.push(node);
  app.selid = node.id;
  commit("add");
  return node;
}

function clonenode(node) {
  var copy = deep(node);
  copy.id = newid();
  copy.name = node.name;
  (copy.children || []).forEach(function (c) {
    (function reid(n) {
      n.id = newid();
      (n.children || []).forEach(reid);
    })(c);
  });
  copy.id = newid();
  return copy;
}

function duplicatenode(node) {
  var pl = parentlistof(node.id);
  if (!pl) return;
  var copy = clonenode(node);
  copy.name = uniqueid(app.scene.objects, node.name);
  copy.pos = [node.pos[0] + 0.8, node.pos[1] + 0.6, node.pos[2]];
  pl.list.splice(pl.index + 1, 0, copy);
  app.selid = copy.id;
  commit("duplicate");
}

function deletenode(node) {
  if (!node) return;
  if (node.lock) {
    toast(node.name + " is locked - unlock it first", "warn");
    return;
  }
  if (node.type === "camera") {
    toast("The camera cannot be deleted", "warn");
    return;
  }
  var pl = parentlistof(node.id);
  if (!pl) return;
  pl.list.splice(pl.index, 1);
  app.selid = null;
  commit("delete");
}

function reparentnode(node, newparent) {
  if (!node || node === newparent) return;
  if (newparent && descendants(node).indexOf(newparent) >= 0) return;
  var pl = parentlistof(node.id);
  if (!pl) return;
  pl.list.splice(pl.index, 1);
  (newparent ? newparent.children : app.scene.objects).push(node);
  commit("reparent");
}

function tagnodes(tag) {
  var out = [];
  walk(app.scene.objects, function (n) {
    if ((n.tags || []).indexOf(tag) >= 0) out.push(n);
  });
  return out;
}

function nodesoftype(type) {
  var out = [];
  walk(app.scene.objects, function (n) {
    if (n.type === type) out.push(n);
  });
  return out;
}

function alltags() {
  var map = {};
  walk(app.scene.objects, function (n) {
    (n.tags || []).forEach(function (t) {
      map[t] = (map[t] || 0) + 1;
    });
  });
  return map;
}

function spriteassets() {
  var list = [];
  for (var k in spriteinfo) list.push({ key: k, name: spriteinfo[k].name });
  return list;
}

function projectasset(label) {
  for (var i = 0; i < app.project.assets.length; i++) if (app.project.assets[i].name === label) return app.project.assets[i];
  return null;
}

function addcustomsprite(name, dataurl) {
  var a = { id: newid("a"), name: name, type: "image", data: dataurl };
  app.project.assets.push(a);
  var key = "custom:" + a.id;
  spriteinfo[key] = { name: name, w: 128, h: 128, depth: 0.2, side: "#c8ccd4", mode: "billboard", custom: true };
  saveprojects();
  return a;
}

function addscript(name) {
  var s = { id: newid("s"), name: name || "NewScript", kind: "Object script", code: defaultcode };
  app.project.scripts.push(s);
  saveprojects();
  return s;
}

function addscene(name) {
  var sc = emptyscene(name || "Scene " + (app.project.scenes.length + 1));
  sc.isstart = false;
  app.project.scenes.push(sc);
  selectscene(sc.id);
  return sc;
}

function duplicatscene() {
  var copy = deep(app.scene);
  copy.id = newid("sc");
  copy.name = app.scene.name + " copy";
  copy.isstart = false;
  walk(copy.objects, function (n) {
    n.id = newid();
  });
  app.project.scenes.push(copy);
  selectscene(copy.id);
  return copy;
}

function deletescene() {
  if (app.project.scenes.length <= 1) {
    toast("A project needs at least one scene", "warn");
    return;
  }
  var idx = sceneindex();
  var removed = app.project.scenes.splice(idx, 1)[0];
  if (app.project.startscene === removed.id) app.project.startscene = app.project.scenes[0].id;
  selectscene(app.project.scenes[Math.max(0, idx - 1)].id);
}

function markstart() {
  app.project.startscene = app.scene.id;
  app.project.scenes.forEach(function (s) {
    s.isstart = s.id === app.project.startscene;
  });
  saveprojects();
  refreshall();
  toast("Start scene set to " + app.scene.name, "ok");
}
