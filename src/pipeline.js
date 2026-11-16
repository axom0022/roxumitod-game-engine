var crctable = (function () {
  var t = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  var c = 0xffffffff;
  for (var i = 0; i < bytes.length; i++) c = crctable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function utf8bytes(str) {
  var out = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c >= 0xd800 && c < 0xdc00) {
      var c2 = str.charCodeAt(++i);
      var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
      out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(out);
}

function zipmake(files) {
  var chunks = [];
  var central = [];
  var offset = 0;
  files.forEach(function (f) {
    var name = utf8bytes(f.name);
    var data = f.binary ? f.data : utf8bytes(f.text || "");
    var crc = crc32(data);
    var local = new Uint8Array(30 + name.length);
    var dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, data.length, true);
    dv.setUint32(22, data.length, true);
    dv.setUint16(26, name.length, true);
    dv.setUint16(28, 0, true);
    local.set(name, 30);
    chunks.push(local, data);
    var cen = new Uint8Array(46 + name.length);
    var cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cen.set(name, 46);
    central.push(cen);
    offset += local.length + data.length;
  });
  var csize = central.reduce(function (a, c) {
    return a + c.length;
  }, 0);
  var end = new Uint8Array(22);
  var ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, csize, true);
  ev.setUint32(16, offset, true);
  var all = chunks.concat(central).concat([end]);
  var total = all.reduce(function (a, c) {
    return a + c.length;
  }, 0);
  var out = new Uint8Array(total);
  var at = 0;
  all.forEach(function (c) {
    out.set(c, at);
    at += c.length;
  });
  return out;
}

function downloadblob(name, blob) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 4000);
}

function downloadbytes(name, bytes, type) {
  downloadblob(name, new Blob([bytes], { type: type || "application/octet-stream" }));
}

function builddata2() {
  var used = {};
  var objs = [];
  walk(app.scene.objects, function (n) {
    if (n.type === "camera" || n.type === "sun" || n.type === "empty" || n.type === "canvas") return;
    var size = nodesize(n);
    var src = "";
    if (n.type === "sprite" && n.sprite) {
      src = n.sprite.indexOf("custom:") === 0 ? customasseturl(n.sprite) : arturln(n.sprite);
      used[n.sprite] = src;
    }
    var entry = {
      n: n.name,
      t: n.type,
      s: n.sprite || "",
      p: n.pos.slice(),
      q: n.rot || [0, 0, 0],
      z: n.scl || [1, 1, 1],
      c: n.color || "#c8ccd4",
      o: n.opacity === undefined ? 1 : n.opacity,
      w: size[0],
      h: size[1],
      d: size[2],
      tg: n.tags || [],
      sd: (function () {
        var soft = false;
        ["coin", "pickup", "hazard", "goal", "enemy", "trigger"].forEach(function (t) {
          if ((n.tags || []).indexOf(t) >= 0) soft = true;
        });
        if (soft) return 0;
        if (hascomp(n, "collider") || hascomp(n, "physics")) return 1;
        if (n.type === "cube" || n.type === "terrain") return 1;
        if (n.type === "sprite" && (n.sprite === "tiles" || n.sprite === "crate")) return 1;
        return 0;
      })(),
      b: (n.behaviors || []).map(function (b) {
        var out = { type: b.type || "mover" };
        if (!b.type) {
          out.type = /patrol/i.test(b.name || "") ? "patrol" : /spin/i.test(b.name || "") ? "spin" : "mover";
        }
        ["speed", "range", "jump", "turn", "axis", "target", "dist", "height", "amount", "life", "hp"].forEach(function (k) {
          if (b[k] !== undefined) out[k] = b[k];
        });
        return out;
      })
    };
    if (n.mat && typeof assetfind === "function") {
      var m = assetfind("mat", n.mat);
      if (m) {
        entry.mt = {
          r: m.rough === undefined ? 0.6 : parseFloat(m.rough),
          m: m.metal === undefined ? 0 : parseFloat(m.metal),
          u: m.unlit ? 1 : 0,
          ds: m.double === false ? 0 : 1,
          tex: m.tex && used[m.tex] ? used[m.tex] : (m.tex && lvl.sprites && lvl.sprites[m.tex] ? lvl.sprites[m.tex] : "")
        };
      }
    }
    if (hascomp(n, "particles")) {
      var c = fxconfig(n);
      entry.pt = { preset: c.preset, rate: c.rate, burst: c.burst, life: c.life, size: c.size, speed: c.speed, spread: c.spread, gravity: c.gravity, color: c.color, color2: c.color2, shape: c.shape, ox: c.offset[0], oy: c.offset[1], oz: c.offset[2] };
    }
    if (n.compdata && n.compdata.ui && (n.type === "label" || n.type === "button" || n.type === "slider" || n.type === "bar")) {
      var u = n.compdata.ui;
      entry.ui = {
        kind: n.type,
        anchor: u.anchor || "Center",
        x: parseFloat(u.x) || 0,
        y: parseFloat(u.y) || 0,
        w: parseFloat(u.w) || 160,
        h: parseFloat(u.h) || 44,
        color: u.color || "#2f6fd0",
        textcolor: u.textcolor || "#ffffff",
        value: u.value === undefined ? 0.6 : parseFloat(u.value),
        fontsize: parseFloat(u.fontsize) || (n.type === "label" ? 24 : 18),
        bold: u.bold === undefined ? true : !!u.bold,
        radius: parseFloat(u.radius) || 8,
        text: n.text || u.label || "",
        action: u.action || "",
        scene: u.scene || ""
      };
    }
    if (n.type === "tilemap") {
      var d = tiledata(n);
      var arr = tilearray(n);
      var org = tileorigin(n);
      var runs = [];
      for (var r = 0; r < d.rows; r++) {
        var c2 = 0;
        while (c2 < d.cols) {
          var id = arr[r * d.cols + c2];
          if (!id) {
            c2++;
            continue;
          }
          var len = 1;
          while (c2 + len < d.cols && arr[r * d.cols + c2 + len] === id) len++;
          var t = tilebyid(id);
          runs.push({
            x: org[0] + c2 * d.ts + (len * d.ts) / 2,
            y: org[1] + (d.rows - r - 1) * d.ts + d.ts / 2,
            w: len * d.ts,
            h: d.ts,
            z: n.pos[2],
            c: t.color,
            sc: t.side,
            solid: t.solid && d.solid !== false
          });
          c2 += len;
        }
      }
      entry.tl = { runs: runs };
    }
    if (n.type === "model") {
      var entrymodel = modelbyid(n.model);
      if (entrymodel) entry.md = { parts: entrymodel.parts };
    }
    if (n.compdata && n.compdata.animator) {
      var ad = n.compdata.animator;
      entry.an = {
        current: ad.current || "idle",
        states: ((ad.layers && ad.layers[0] && ad.layers[0].states) || []).map(function (s) {
          return { name: s.name, sprite: s.sprite, bob: s.bob || 0, fps: s.fps || 8 };
        })
      };
      if (!used[entry.s]) used[entry.s] = arturln(entry.s || "hero");
      entry.an.states.forEach(function (s) {
        used[s.sprite] = arturln(s.sprite);
      });
    }
    objs.push(entry);
  });
  var sheet = null;
  app.project.eventsheets.forEach(function (s) {
    if (s.name === app.scene.eventsheet) sheet = s;
  });
  var canvasnode = uicanvasnode();
  var uiref = uirefsize();
  return {
    name: app.project.name,
    sky: (app.scene.env && app.scene.env.color) || "#c5e4ff",
    ground: (app.scene.env && app.scene.env.bgtype) || "color",
    cam: { yaw: app.cam.yaw, pitch: app.cam.pitch, dist: app.cam.dist, target: app.cam.target.slice(0), fov: app.cam.fov || 38, ortho: !!app.cam.ortho, halfw: app.cam.halfw || app.cam.dist * 0.42 },
    objects: objs,
    sprites: used,
    events: sheet ? sheet.events || [] : [],
    gravity: (app.project.graphics && app.project.graphics.gravity) || 23,
    start: app.project.name,
    lives: 3,
    uiref: { w: uiref.w, h: uiref.h },
    mixer: (app.project.mixer || { groups: [] }).groups,
    env: {
      lumen: app.scene.env ? app.scene.env.lumen !== false : true,
      lumenstrength: app.scene.env && app.scene.env.lumenstrength !== undefined ? app.scene.env.lumenstrength : 0.55,
      vsm: app.scene.env ? !!app.scene.env.vsm : true,
      vsmres: app.scene.env && app.scene.env.vsmres ? app.scene.env.vsmres : 2048,
      nanite: app.scene.env ? app.scene.env.nanite !== false : true,
      nanitedist: app.scene.env && app.scene.env.nanitedist ? app.scene.env.nanitedist : 14,
      partition: app.scene.env ? !!app.scene.env.partition : true,
      cell: app.scene.env && app.scene.env.cell ? app.scene.env.cell : 24,
      cellradius: app.scene.env && app.scene.env.cellradius !== undefined ? app.scene.env.cellradius : 3
    }
  };
}

function buildrun2() {
  return `
(function(){
var lvl = window.__level;
var cv = document.getElementById('c'), ctx = cv.getContext('2d');
var vw = 800, vh = 600, vpr = 1;
var imgs = {};
for (var k in lvl.sprites) { var im = new Image(); im.src = lvl.sprites[k]; imgs[k] = im; }
function fit(){ vpr = Math.min(2, window.devicePixelRatio || 1); vw = cv.clientWidth || window.innerWidth; vh = cv.clientHeight || window.innerHeight; cv.width = Math.round(vw*vpr); cv.height = Math.round(vh*vpr); ctx.setTransform(vpr,0,0,vpr,0,0); if (grend) { grend.setSize(vw, vh, false); } if (gcam) { gcam.aspect = vw / Math.max(1, vh); gcam.updateProjectionMatrix(); } }
window.addEventListener('resize', fit); fit();
var vcam = lvl.cam;
var tanh = Math.tan((vcam.fov*Math.PI/180)/2);
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
var cp = Math.cos(vcam.pitch);
var eye = [vcam.target[0]+Math.sin(vcam.yaw)*cp*vcam.dist, vcam.target[1]+Math.sin(vcam.pitch)*vcam.dist, vcam.target[2]+Math.cos(vcam.yaw)*cp*vcam.dist];
var fwd = norm(sub(vcam.target, eye)), right = norm(cross(fwd,[0,1,0])), up = cross(right, fwd);
function view(p){ var d = sub(p, eye); return [dot(d,right), dot(d,up), dot(d,fwd)]; }
function proj(p){ var v = view(p); if (v[2] < 0.05) return null; if (vcam.ortho){ var hw = vcam.halfw; return { x:(v[0]/hw*0.5+0.5)*vw, y:(0.5-v[1]/hw*0.5*vw/vh)*vh, z:v[2], s:vw/(2*hw) }; } var f = (vh/2)/tanh; return { x:(v[0]/(v[2]*tanh*(vw/vh))*0.5+0.5)*vw, y:(0.5-v[1]/(v[2]*tanh)*0.5)*vh, z:v[2], s:f/v[2] }; }
function shade(hex, k){ if (!hex || hex.charAt(0) !== '#') return '#c8ccd4'; var n = parseInt(hex.slice(1),16); return 'rgb('+Math.round(Math.min(255,((n>>16)&255)*k))+','+Math.round(Math.min(255,((n>>8)&255)*k))+','+Math.round(Math.min(255,(n&255)*k))+')'; }
function rnd(){ return Math.random(); }
var hero = null, coins = [], hearts = [], hazards = [], plats = [], goal = null, decor = [], models = [], emitters = [], uis = [], actors = [];
var statics = [];
lvl.objects.forEach(function(o){
  o.p = o.p.slice(0); o.q = (o.q||[0,0,0]).slice(0); o.z = o.z || [1,1,1];
  o.k = o.n + '|' + o.p[0] + '|' + o.p[1];
  if (o.t === 'label' || o.t === 'canvas' || o.t === 'empty' || o.t === 'button' || o.t === 'slider' || o.t === 'bar' || o.t === 'joystick') { if (o.ui) uis.push(o); return; }
  if (o.s === 'hero' || (o.tg||[]).indexOf('player') >= 0) { if (!hero) hero = o; actors.push(o); return; }
  if (o.s === 'coin') { coins.push(o); decor.push(o); return; }
  if (o.s === 'heart') { hearts.push(o); decor.push(o); return; }
  if ((o.tg||[]).indexOf('hazard') >= 0 || o.s === 'spikes' || o.s === 'slime' || /enemy|spike/i.test(o.n)) { hazards.push(o); decor.push(o); return; }
  if ((o.tg||[]).indexOf('goal') >= 0 || /goal|flag/i.test(o.n) || o.s === 'flag') { goal = o; decor.push(o); return; }
  if (o.ui) { uis.push(o); return; }
  if (o.pt) emitters.push({ o:o, cfg:o.pt, acc:0, t:0 });
  if (o.md) { models.push(o); decor.push(o); }
  if (o.tl) { o.tl.runs.forEach(function(r){ var tl = { p:[r.x,r.y,r.z], q:[0,0,0], z:[1,1,1], w:r.w, h:r.h, d:0.5, c:r.c, s:r.sc, o:1, t:'tile' }; plats.push(tl); decor.push(tl); if (r.solid) statics.push({ x:r.x, y:r.y, hw:r.w/2, hh:r.h/2 }); }); return; }
  if (o.sd) statics.push({ x:o.p[0], y:o.p[1], hw:o.w/2, hh:o.h/2, a:(o.q && o.q[2] ? o.q[2] * Math.PI / 180 : 0) });
  if (o.t === 'sprite' || o.t === 'model') { decor.push(o); return; }
  if (o.t === 'cube' || o.t === 'box' || o.t === 'plane' || o.t === 'terrain' || o.t === 'cylinder' || o.t === 'sphere') { plats.push(o); statics.push({ x:o.p[0], y:o.p[1], hw:o.w/2, hh:o.h/2, a:(o.q && o.q[2] ? o.q[2] * Math.PI / 180 : 0), node:o }); decor.push(o); return; }
  decor.push(o);
});
if (goal) decor.push(goal);
var g = { x: hero?hero.p[0]:0, y: hero?hero.p[1]:1, vy:0, vx:0, face:1, ground:false, score:0, lives:lvl.lives, status:'play', time:0, got:{}, inv:0, start:[hero?hero.p[0]:0, hero?hero.p[1]:1], paused:false };
var hw = hero ? hero.w/2 : 0.34, hh = hero ? hero.h/2 : 0.45;
var keys = {};
window.addEventListener('keydown', function(e){ keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); if (e.code === 'KeyR' && g.status !== 'play') restart(); });
window.addEventListener('keyup', function(e){ keys[e.code] = false; });
function restart(){ g.x = g.start[0]; g.y = g.start[1]; g.vy = 0; g.vx = 0; g.score = 0; g.lives = lvl.lives; g.status = 'play'; g.got = {}; g.inv = 0; msg(''); hud(); }
function msg(t){ var el = document.getElementById('msg'); el.innerHTML = t; el.style.display = t ? 'block' : 'none'; }
function hud(){ document.getElementById('score').textContent = 'Score: ' + g.score; var l = ''; for (var i = 0; i < g.lives; i++) l += '<span class=hp></span>'; document.getElementById('lives').innerHTML = l; }
function act(text){
  if (!text) return;
  var m = text.match(/add\\s+(\\d+)\\s+to\\s+(.+)$/i);
  if (m) { if (/^score$/i.test(m[2].trim())) { g.score += parseInt(m[1],10); hud(); } return; }
  m = text.match(/remove\\s+(\\d+)\\s+life/i);
  if (m) { g.lives = Math.max(0, g.lives - parseInt(m[1],10)); hud(); if (!g.lives) { g.status = 'lost'; msg('Game over<br><small>Press R to restart</small>'); } return; }
  m = text.match(/add\\s+(\\d+)\\s+life/i);
  if (m) { g.lives = Math.min(9, g.lives + parseInt(m[1],10)); hud(); return; }
  m = text.match(/spawn\\s+(.+)$/i);
  if (m) { return; }
  m = text.match(/burst\\s+(\\w+)\\s+particles/i);
  if (m) { emitters.forEach(function(e){ e.burst = Math.max(e.burst||0, 30); }); return; }
  m = text.match(/set\\s+(\\w+)\\s+volume\\s+to\\s+([\\d.]+)/i);
  if (m) { (lvl.mixer||[]).forEach(function(gr){ if (gr.name.toLowerCase() === m[1].toLowerCase()) gr.volume = parseFloat(m[2]); }); return; }
  if (/destroy/i.test(text)) return;
  m = text.match(/go\\s+to\\s+scene\\s+(.+)$/i);
  if (m) { msg('Scene ' + m[1] + '<br><small>Press R to restart</small>'); return; }
  if (/win/i.test(text)) { g.status = 'won'; msg('You win!<br><small>Score ' + g.score + ' · press R to restart</small>'); return; }
  if (/lose/i.test(text)) { g.status = 'lost'; msg('Game over<br><small>Press R to restart</small>'); }
}
function fire(kind, node, extra){
  lvl.events.forEach(function(e){
    if (e.and && e.and.length) { var ok = e.and.every(function(t){ var m = t.match(/lives\\s+at\\s+most\\s+(\\d+)/i); if (m) return g.lives <= +m[1]; m = t.match(/score\\s+is\\s+at\\s+least\\s+(\\d+)/i); if (m) return g.score >= +m[1]; m = t.match(/score\\s+below\\s+(\\d+)/i); if (m) return g.score < +m[1]; return true; }); if (!ok) return; }
    var ob = e.obj || '';
    if (kind === 'coin' && /coin/i.test(ob)) act(e.do);
    else if (kind === 'hazard' && /hazard|enemy|spike|slime/i.test(ob)) act(e.do);
    else if (kind === 'heart' && /heart/i.test(ob)) act(e.do);
    else if (kind === 'goal' && /goal|flag/i.test(ob)) act(e.do);
    else if (kind === 'ui' && (e.obj === (node && node.n) || /ui|button/i.test(ob))) act(e.do);
  });
}
var parts = [];
function emit(cfg, p){
  if (parts.length > 700) return;
  var sp = cfg.speed * (0.45 + rnd()), a = rnd()*6.283;
  parts.push({ x:p[0]+(cfg.ox||0), y:p[1]+(cfg.oy||0.2), z:p[2]+(cfg.oz||0), vx:Math.cos(a)*sp*cfg.spread, vy:sp*(0.7+(rnd()-0.15)*cfg.spread), vz:Math.sin(a)*sp*cfg.spread*0.5, life:cfg.life, max:cfg.life, size:cfg.size, color:rnd()>0.5?cfg.color:cfg.color2, shape:cfg.shape });
}
function stepparts(dt){
  emitters.forEach(function(e){ e.t += dt; if (e.cfg.rate > 0){ e.acc += dt*e.cfg.rate; while (e.acc >= 1){ e.acc -= 1; emit(e.cfg, e.o.p); } } if (e.burst){ for (var i=0;i<Math.min(60,e.burst);i++) emit(e.cfg, e.o.p); e.burst = 0; } });
  for (var i = parts.length-1; i>=0; i--){ var p = parts[i]; p.life -= dt; if (p.life <= 0){ parts.splice(i,1); continue; } p.vy -= p.gravity*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.z += p.vz*dt; if (p.y < -3.2){ p.y = -3.2; p.vy *= -0.3; } }
}
function behavior(o, dt){
  (o.b||[]).forEach(function(b){
    o.bt = (o.bt||0) + dt;
    var sp = b.speed===undefined?1:b.speed, rg = b.range===undefined?1.5:b.range;
    if (!o.home) o.home = o.p.slice(0);
    if (b.type === 'mover'){ var off = Math.sin(o.bt*sp)*rg; o.p[0]=o.home[0]; o.p[1]=o.home[1]; o.p[2]=o.home[2]; if (b.axis==='y') o.p[1]+=off; else if (b.axis==='z') o.p[2]+=off; else o.p[0]+=off; }
    else if (b.type === 'patrol'){ o.p[0] = o.home[0] + Math.sin(o.bt*sp)*rg; }
    else if (b.type === 'sine'){ o.p[1] = o.home[1] + Math.sin(o.bt*sp)*rg; }
    else if (b.type === 'spin'){ o.q[1] = (o.q[1]||0) + sp*dt*60; }
    else if (b.type === 'rotate'){ var ai = b.axis==='x'?0:b.axis==='z'?2:1; o.q[ai] = (o.q[ai]||0) + sp*dt*60; }
    else if (b.type === 'bullet'){ o.q[1]=o.q[1]||0; o.p[0]+=Math.sin(o.q[1]*Math.PI/180)*sp*dt; o.p[2]+=Math.cos(o.q[1]*Math.PI/180)*sp*dt; }
    else if (b.type === 'follow' || b.type === 'lookattarget'){ var tn = hero; if (tn){ var dx = tn.p[0]-o.p[0], dy = tn.p[1]-o.p[1], dd = Math.hypot(dx,dy)||1; if (b.type==='follow' && dd > (b.range||0.8)){ o.p[0]+=dx/dd*sp*dt; o.p[1]+=dy/dd*sp*dt; } else if (b.type==='lookattarget'){ o.q[1] = Math.atan2(dx, 0.0001)*180/Math.PI; } } }
    else if (b.type === 'camerafollow'){ g.camfollow = { dist: b.dist||14, height: b.height||3 }; }
    else if (b.type === 'health'){ o.hp = b.hp===undefined?3:b.hp; }
  });
}
function animstep(o, dt){
  if (!o.an) return;
  o.ant = (o.ant||0) + dt;
  var st = null, cur = o.an.current;
  o.an.states.forEach(function(s){ if (s.name === cur) st = s; });
  if (!st) st = o.an.states[0];
  if (st){ o.anbob = (st.bob||0)*Math.sin(o.ant*(st.fps||8)); if (st.sprite) o.s = st.sprite; }
}
function tick(dt){
  if (typeof nettick==='function') nettick(dt);
  g.time += dt; g.inv = Math.max(0, g.inv - dt);
  if (g.paused) return;
  decor.forEach(function(o){ behavior(o, dt); animstep(o, dt); });
  stepparts(dt);
  var left = keys.ArrowLeft||keys.KeyA, right = keys.ArrowRight||keys.KeyD, jump = keys.Space||keys.ArrowUp||keys.KeyW;
  var speed = 5.4;
  if (g.status === 'play'){
    var mdx = ((right?1:0)-(left?1:0))*speed*dt;
    if (right) g.face = 1; if (left) g.face = -1;
    if (jump && g.ground) { g.vy = 9.4; g.ground = false; }
    g.vy -= lvl.gravity*dt;
    var mdy = g.vy*dt;
    var msteps = Math.max(1, Math.min(12, Math.ceil(Math.max(Math.abs(mdx), Math.abs(mdy)) / 0.14)));
    var rad = Math.max(0.16, Math.min(hw, hh) * 0.45);
    for (var mk = 0; mk < msteps; mk++) {
    g.x = Math.max(-11, Math.min(11, g.x + mdx / msteps));
    g.y += mdy / msteps;
    g.ground = false;
    for (var si = 0; si < statics.length; si++) {
      var s = statics[si];
      if (Math.abs(g.x - s.x) > s.hw + s.hh + rad + 1) continue;
      var sa = s.a || 0, ca = Math.cos(sa), sna = Math.sin(sa);
      var dx = g.x - s.x, dy = (g.y - hh + rad) - s.y;
      var lx = dx * ca + dy * sna, ly = -dx * sna + dy * ca;
      var cx = Math.max(-s.hw, Math.min(s.hw, lx));
      var cy = Math.max(-s.hh, Math.min(s.hh, ly));
      var ox = lx - cx, oy = ly - cy;
      var d2 = ox * ox + oy * oy;
      if (d2 > rad * rad) continue;
      var nx, ny, pen;
      if (d2 < 1e-8) {
        var px = s.hw - Math.abs(lx), py = s.hh - Math.abs(ly);
        if (px < py) { nx = lx < 0 ? -1 : 1; ny = 0; pen = px + rad; }
        else { nx = 0; ny = ly < 0 ? -1 : 1; pen = py + rad; }
      } else {
        var dl = Math.sqrt(d2);
        nx = ox / dl; ny = oy / dl; pen = rad - dl;
      }
      var wnx = nx * ca - ny * sna, wny = nx * sna + ny * ca;
      var nxw = (lx + nx * pen) * ca - (ly + ny * pen) * sna;
      var nyw = (lx + nx * pen) * sna + (ly + ny * pen) * ca;
      if (wny > 0.42) {
        g.x = s.x + nxw;
        g.y = s.y + nyw - rad + hh;
        if (g.vy < 0) g.vy = 0;
        g.ground = true;
        g.slope = wny;
      } else if (wny < -0.42) {
        g.y += wny * pen;
        if (g.vy > 0) g.vy = 0;
      } else {
        var wtop = s.y + s.hh;
        if (Math.abs(sna) < 0.25 && wtop <= g.y - hh + 0.66 && wtop > g.y - hh - 0.02) {
          g.y = wtop + hh;
          g.ground = true;
          g.slope = 1;
        } else {
          g.x += wnx * pen;
        }
      }
    }
    }
    if (g.y < -8) { g.y = 6; g.vy = 0; }
    coins.forEach(function(o){ if (g.got[o.k]) return; if (Math.hypot(o.p[0]-g.x, o.p[1]-(g.y+0.1)) < 0.72) { g.got[o.k]=1; fire('coin', o); if (typeof netsync==='function') netsync('coin', o.k); } });
    hearts.forEach(function(o){ if (g.got[o.k]) return; if (Math.hypot(o.p[0]-g.x, o.p[1]-g.y) < 0.7) { g.got[o.k]=1; g.lives=Math.min(9,g.lives+1); hud(); fire('heart', o); if (typeof netsync==='function') netsync('heart', o.k); } });
    if (g.inv <= 0) hazards.forEach(function(o){
      if (Math.abs(o.p[0]-g.x) < o.w*0.35+hw && Math.abs(o.p[1]-g.y) < o.h*0.4+hh*0.8) {
        var before = g.lives; fire('hazard', o); g.inv = 1.2;
        if (g.lives === before) { g.lives--; hud(); }
        if (!g.lives) { g.status='lost'; msg('Game over<br><small>Press R to restart</small>'); }
      }
    });
    if (goal && Math.abs(goal.p[0]-g.x) < goal.w*0.5+hw && Math.abs(goal.p[1]-g.y) < goal.h*0.6+hh) { fire('goal', goal); if (g.status==='play'){ g.status='won'; msg('You win!<br><small>Score '+g.score+' · press R to restart</small>'); } }
    if (hero) { hero.p[0] = g.x; hero.p[1] = g.y; }
  }
}
function drawbg(){ var grad = ctx.createLinearGradient(0,0,0,vh); grad.addColorStop(0, lvl.sky); grad.addColorStop(1, '#ffffff'); ctx.fillStyle = grad; ctx.fillRect(0,0,vw,vh); }
function boxfaces(o){ var w=o.w/2,h=o.h/2,d=o.d/2, ry=(o.q[1]||0)*Math.PI/180, c=Math.cos(ry), s=Math.sin(ry), pts=[];
  [[-w,-h,-d],[w,-h,-d],[w,h,-d],[-w,h,-d],[-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]].forEach(function(p){ var x=p[0]*c+p[2]*s, z=-p[0]*s+p[2]*c; pts.push(proj([o.p[0]+x, o.p[1]+p[1], o.p[2]+z])); }); return pts; }
function poly(pts, fill){ if (pts.some(function(p){return !p;})) return; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (var i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
function drawmodel(o){
  var parts2 = o.md.parts || [];
  parts2.forEach(function(pt2){
    var pos = pt2.pos, idx = pt2.idx, ry = (o.q[1]||0)*Math.PI/180, c = Math.cos(ry), s = Math.sin(ry);
    for (var i = 0; i + 8 < idx.length + 1 && i + 2 < idx.length + 1; i += 3){
      var ia = idx[i]*3, ib = idx[i+1]*3, ic = idx[i+2]*3;
      if (ia === undefined || ib === undefined || ic === undefined) break;
      var aa = [pos[ia]*o.z[0], pos[ia+1]*o.z[1], pos[ia+2]*o.z[2]];
      var bb = [pos[ib]*o.z[0], pos[ib+1]*o.z[1], pos[ib+2]*o.z[2]];
      var cq = [pos[ic]*o.z[0], pos[ic+1]*o.z[1], pos[ic+2]*o.z[2]];
      function world(v){ var x = v[0]*c + v[2]*s, z = -v[0]*s + v[2]*c; return [o.p[0]+x, o.p[1]+v[1], o.p[2]+z]; }
      var pa = proj(world(aa)), pb = proj(world(bb)), pc = proj(world(cq));
      if (!pa || !pb || !pc) continue;
      var ux = bb[0]-aa[0], uy = bb[1]-aa[1], uz = bb[2]-aa[2], vx = cq[0]-aa[0], vy = cq[1]-aa[1], vz = cq[2]-aa[2];
      var nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx;
      var len = Math.hypot(nx,ny,nz)||1; ny = ny/len;
      var k = 0.62 + Math.max(0, ny)*0.5;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.lineTo(pc.x, pc.y); ctx.closePath();
      ctx.fillStyle = shade(pt2.color || o.c, k); ctx.fill();
    }
  });
}
function drawobj(o){
  if (o.ui) return;
  if (o.t === 'tile'){ var tpts = boxfaces(o); poly([tpts[4],tpts[5],tpts[6],tpts[7]], o.c); poly([tpts[0],tpts[1],tpts[5],tpts[4]], o.s || shade(o.c,0.7)); return; }
  if (o.md) { drawmodel(o); return; }
  if (o.t === 'sprite'){
    var p = proj([o.p[0], o.p[1] + (o.anbob||0), o.p[2]]);
    if (!p || !imgs[o.s] || !imgs[o.s].complete) return;
    var w = o.w*p.s, h = o.h*p.s;
    ctx.globalAlpha = o.o;
    if (o.s === 'coin') { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(Math.abs(Math.cos(g.time*4))*0.85+0.15, 1); ctx.drawImage(imgs[o.s], -w/2, -h/2, w, h); ctx.restore(); }
    else if (o === hero) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(g.face, 1); ctx.drawImage(imgs[o.s], -w/2, -h/2, w, h); ctx.restore(); }
    else if (o === goal) { ctx.save(); ctx.translate(p.x, p.y + Math.sin(g.time*2)*3); ctx.drawImage(imgs[o.s], -w/2, -h/2, w, h); ctx.restore(); }
    else ctx.drawImage(imgs[o.s], p.x - w/2, p.y - h/2, w, h);
    ctx.globalAlpha = 1;
    return;
  }
  var pts = boxfaces(o);
  var unlit = o.mt && o.mt.u;
  poly([pts[4],pts[5],pts[6],pts[7]], unlit ? o.c : shade(o.c, 1.08));
  poly([pts[0],pts[1],pts[5],pts[4]], unlit ? o.c : shade(o.c, 0.62));
  poly([pts[1],pts[2],pts[6],pts[5]], unlit ? o.c : shade(o.c, 0.82));
}
function drawparts(){
  parts.slice().sort(function(a,b){ return view([b.x,b.y,b.z])[2] - view([a.x,a.y,a.z])[2]; }).forEach(function(p){
    var pr = proj([p.x,p.y,p.z]); if (!pr) return;
    var fade = Math.max(0, p.life/p.max);
    ctx.globalAlpha = 0.9*fade;
    ctx.fillStyle = p.color;
    var r = Math.max(1, p.size*pr.s*0.5);
    if (p.shape === 'rect') ctx.fillRect(pr.x - r*0.5, pr.y - r*0.8, r, r*1.5);
    else { ctx.beginPath(); ctx.arc(pr.x, pr.y, r, 0, 6.283); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
}
function uiscale(){ var s = Math.min(vw/lvl.uiref.w, vh/lvl.uiref.h); return s; }
function uianchor(a){ var m = { 'Top left':[0,0], 'Top center':[0.5,0], 'Top right':[1,0], 'Center':[0.5,0.5], 'Bottom left':[0,1], 'Bottom center':[0.5,1], 'Bottom right':[1,1] }; return m[a]||[0.5,0.5]; }
var uihits = [];
function drawui(){
  var s = uiscale(), ref = lvl.uiref; uihits = [];
  uis.forEach(function(o){
    var u = o.ui, ax = uianchor(u.anchor);
    var cx = (vw - ref.w*s)/2 + ax[0]*ref.w*s + u.x*s, cy = (vh - ref.h*s)/2 + ax[1]*ref.h*s + u.y*s;
    var w = Math.max(4, u.w*s), h = Math.max(4, u.h*s);
    var x = cx - w/2, y = cy - h/2;
    ctx.font = (u.bold?'700 ':'500 ') + Math.round(u.fontsize*s) + 'px Inter, Segoe UI, sans-serif';
    if (u.kind === 'label'){ ctx.fillStyle = u.textcolor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(u.text, cx, cy); return; }
    if (u.kind === 'button'){
      ctx.fillStyle = u.color; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(h/2, u.radius*s)); else ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = u.textcolor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(u.text, cx, cy);
      uihits.push({ x:x, y:y, w:w, h:h, o:o });
      return;
    }
    if (u.kind === 'bar'){
      ctx.fillStyle = 'rgba(12,16,22,.55)'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x,y,w,h,6); else ctx.rect(x,y,w,h); ctx.fill();
      var v = Math.max(0, Math.min(1, u.value));
      ctx.fillStyle = u.color; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x+2,y+2,Math.max(0,(w-4)*v),h-4,5); else ctx.rect(x+2,y+2,(w-4)*v,h-4); ctx.fill();
      return;
    }
    ctx.fillStyle = 'rgba(14,18,24,.5)'; ctx.fillRect(x, y + h*0.35, w, Math.max(4, h*0.3));
    ctx.fillStyle = u.color; ctx.fillRect(x, y + h*0.35, w*Math.max(0,Math.min(1,u.value)), Math.max(4, h*0.3));
    ctx.beginPath(); ctx.arc(x + w*Math.max(0,Math.min(1,u.value)), y + h/2, Math.max(5, h*0.3), 0, 6.283); ctx.fillStyle = '#fff'; ctx.fill();
    uihits.push({ x:x, y:y, w:w, h:h, o:o, slider:true });
  });
}
cv.addEventListener('pointerdown', function(ev){
  var r = cv.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
  uihits.forEach(function(hit){
    if (mx < hit.x || mx > hit.x + hit.w || my < hit.y || my > hit.y + hit.h) return;
    var u = hit.o.ui;
    if (hit.slider){ u.value = Math.max(0, Math.min(1, (mx - hit.x)/Math.max(1,hit.w))); return; }
    if (u.action === 'restart') { restart(); return; }
    fire('ui', hit.o);
  });
});
var glok = false, glook = null, glib = null, gthree = false, grend = null, gscn = null, gcam = null, gmap = [], ghero = null, gsun = null, gboxgeo = null, gplanegeo = null, gmatcache = {};
function glhex(c){ return c && c.charAt(0) === '#' ? c : '#c8ccd4'; }
function glint(c){ return parseInt(glhex(c).slice(1), 16); }
function glcol(c){ return new glib.Color(glint(c)); }
function glstd(){ return glib.MeshStandardMaterial || glib.StandardMaterial; }
function glbasic(){ return glib.MeshBasicMaterial || glib.BasicMaterial; }
function gltex(url){
  if (gthree) {
    var t = new glib.TextureLoader().load(url);
    t.magFilter = glib.NearestFilter;
    t.minFilter = glib.LinearFilter;
    if (glib.sRGBEncoding) t.encoding = glib.sRGBEncoding;
    return t;
  }
  return new glib.Texture(url, { magFilter: 'nearest', minFilter: 'linear', wrapS: 'clamp', wrapT: 'clamp', flipY: false });
}
function glrep(t, n){
  if (gthree && t) {
    t.wrapS = glib.RepeatWrapping;
    t.wrapT = glib.ClampToEdgeWrapping;
    t.repeat.set(Math.max(1, Math.round(n)), 1);
    t.needsUpdate = true;
  }
  return t;
}
function glmat(o){
  var stdmat = glstd(), MB = glbasic();
  if (o.mt) {
    var mk = 'mm' + glhex(o.c) + o.mt.r + '|' + o.mt.m + '|' + o.mt.u + '|' + o.mt.ds + '|' + (o.mt.tex ? 1 : 0) + (o.o !== undefined && o.o < 1 ? 't' : '');
    if (!gmatcache[mk]) {
      var mopts = {
        color: glint(o.c),
        transparent: o.o !== undefined && o.o < 1,
        opacity: o.o === undefined ? 1 : o.o,
        side: o.mt.ds ? 2 : 0
      };
      if (o.mt.tex) mopts.map = gltex(o.mt.tex);
      if (o.mt.u) gmatcache[mk] = new MB(mopts);
      else {
        mopts.roughness = Math.max(0.02, Math.min(1, o.mt.r));
        mopts.metalness = Math.max(0, Math.min(1, o.mt.m));
        gmatcache[mk] = new stdmat(mopts);
      }
    }
    return gmatcache[mk];
  }
  if (o.t === 'sprite' || o.bill) {
    var key = 's' + o.s;
    if (!gmatcache[key]) {
      var sopt = { transparent: true, alphaTest: 0.08, side: 2, depthWrite: false };
      if (lvl.sprites[o.s]) sopt.map = gltex(lvl.sprites[o.s]);
      gmatcache[key] = new MB(sopt);
    }
    return gmatcache[key];
  }
  var key2 = 'b' + glhex(o.c) + (o.o !== undefined && o.o < 1 ? 't' : '');
  if (!gmatcache[key2]) gmatcache[key2] = new stdmat({ color: glint(o.c), roughness: 0.86, metalness: 0.03, transparent: o.o !== undefined && o.o < 1, opacity: o.o === undefined ? 1 : o.o });
  return gmatcache[key2];
}
function glflat(c){
  var key = 'f' + glhex(c);
  if (!gmatcache[key]) {
    var stdmat = glstd();
    gmatcache[key] = new stdmat({ color: glint(c), roughness: 0.94, metalness: 0.02 });
  }
  return gmatcache[key];
}
function glside(o){ return glflat(o.sidecolor || '#a4552f'); }
function glmulti(face, side, top){ return gthree ? [side, side, top, side, face, side] : face; }
function glcell(g2, x, c, side) {
  g2.fillStyle = glhex(c);
  g2.fillRect(x, 0, 64, 64);
  g2.fillStyle = glhex(side);
  g2.fillRect(x, 58, 64, 6);
  g2.fillStyle = 'rgba(255,255,255,0.34)';
  g2.fillRect(x, 0, 64, 6);
  g2.fillStyle = 'rgba(0,0,0,0.11)';
  g2.fillRect(x, 30, 64, 2);
  g2.fillRect(x + 30, 0, 2, 64);
  g2.fillStyle = 'rgba(255,255,255,0.11)';
  g2.fillRect(x, 32, 64, 1);
}
function gltiletex(c, side, count) {
  count = Math.max(1, Math.min(26, count | 0));
  var key = 'q' + glhex(c) + '|' + glhex(side) + '|' + count;
  if (!gmatcache[key]) {
    var cnv = document.createElement('canvas');
    cnv.width = 64 * count;
    cnv.height = 64;
    var g2 = cnv.getContext('2d');
    for (var i = 0; i < count; i++) glcell(g2, i * 64, c, side);
    var tx = gthree ? new glib.CanvasTexture(cnv) : new glib.Texture(cnv, { magFilter: 'nearest', minFilter: 'linear' });
    if (gthree && glib.sRGBEncoding) tx.encoding = glib.sRGBEncoding;
    if (gthree) {
      tx.wrapS = glib.ClampToEdgeWrapping;
      tx.wrapT = glib.ClampToEdgeWrapping;
      tx.magFilter = glib.NearestFilter;
      tx.minFilter = glib.LinearMipmapLinearFilter;
    }
    gmatcache[key] = { tex: tx };
  }
  return gmatcache[key].tex;
}
function gltilemat(o) {
  var c = o.c || '#8fd06a';
  var sc = o.sidecolor || o.s || '#a4552f';
  var count = Math.max(1, Math.round((o.w || 1) / 0.9));
  var key = 'm' + glhex(c) + '|' + glhex(sc) + '|' + count;
  if (!gmatcache[key]) {
    var stdmat = glstd();
    gmatcache[key] = new stdmat({ map: gltiletex(c, sc, count), roughness: 0.9, metalness: 0.02 });
  }
  return gmatcache[key];
}
function gltiled(o) {
  if (!gthree) {
    var fkey = 'tf' + o.s + '|' + Math.round((o.w || 1) * 2);
    if (!gmatcache[fkey]) {
      var stdmat0 = glstd();
      var fopts = { roughness: 0.9, metalness: 0.02, transparent: true, alphaTest: 0.04 };
      if (lvl.sprites[o.s]) fopts.map = gltex(lvl.sprites[o.s]);
      gmatcache[fkey] = new stdmat0(fopts);
    }
    return gmatcache[fkey];
  }
  var key = 't' + o.s + '|' + Math.round((o.w || 1) * 2);
  if (!gmatcache[key]) {
    if (!lvl.sprites[o.s]) return glmat(o);
    var stdmat = glstd();
    gmatcache[key] = new stdmat({ map: glrep(gltex(lvl.sprites[o.s]), Math.max(1, Math.round((o.w || 1) * 0.55))), roughness: 0.88, metalness: 0.02 });
  }
  return gmatcache[key];
}
function glmesh(o){
  var m;
  var plane = false;
  if (o.mt) {
    m = new glib.Mesh(gboxgeo, glmat(o));
    m.scale.set(o.w || 1, o.h || 1, o.d || 1);
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(o.p[0], o.p[1], o.p[2]);
    if (o.q && o.q[2]) m.rotation.z = (o.q[2] * Math.PI) / 180;
    gscn.add(m);
    gmap.push({ o: o, m: m });
    return m;
  }
  if (o.t === 'tile') {
    m = new glib.Mesh(gboxgeo, glmulti(gltilemat(o), glflat('#a4552f'), gltilemat(o)));
    m.scale.set(o.w, o.h, o.d || 0.5);
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(o.p[0], o.p[1], o.p[2]);
    gscn.add(m);
    gmap.push({ o: o, m: m });
    return m;
  }
  if (o.t === 'sprite') {
    if (o.d && o.d > 0.6) {
      m = new glib.Mesh(gboxgeo, glmulti(gltiled(o), glside(o), glflat('#6ecf57')));
      m.scale.set(o.w, o.h, o.d);
      m.castShadow = true;
      m.receiveShadow = true;
    } else {
      m = new glib.Mesh(gplanegeo, glmat(o));
      m.scale.set(o.w, o.h, 1);
      m.castShadow = true;
      plane = true;
    }
  } else {
    m = new glib.Mesh(gboxgeo, glmat(o));
    m.scale.set(o.w || 1, o.h || 1, o.d || 1);
    m.castShadow = true;
    m.receiveShadow = true;
  }
  m.position.set(o.p[0], o.p[1], o.p[2]);
  if (o.q && o.q[2]) m.rotation.z = (o.q[2] * Math.PI) / 180;
  gscn.add(m);
  gmap.push({ o: o, m: m, plane: plane });
  return m;
}
function glmodel(o){
  (o.md.parts || []).forEach(function(pt){
    if (gthree) {
      var geo = new glib.BufferGeometry();
      geo.setAttribute('position', new glib.Float32BufferAttribute(pt.pos, 3));
      geo.setIndex(pt.idx);
      var col = glcol(pt.color || o.c);
      var cols = new Float32Array(pt.pos.length);
      for (var i = 0; i < pt.pos.length; i += 3) {
        cols[i] = col.r;
        cols[i + 1] = col.g;
        cols[i + 2] = col.b;
      }
      geo.setAttribute('color', new glib.Float32BufferAttribute(cols, 3));
      if (geo.computeVertexNormals) geo.computeVertexNormals();
      var stdmat = glstd();
      var mesh = new glib.Mesh(geo, new stdmat({ vertexColors: true, roughness: 0.8, metalness: 0.05 }));
      mesh.position.set(o.p[0], o.p[1], o.p[2]);
      mesh.rotation.y = ((o.q[1] || 0) * Math.PI) / 180;
      mesh.scale.set(o.z[0], o.z[1], o.z[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      gscn.add(mesh);
      gmap.push({ o: o, m: mesh, model: true });
      return;
    }
    var bx = glmesh({ t: 'cube', p: [o.p[0], o.p[1], o.p[2]], q: o.q, w: (o.z[0] || 1) * 0.8, h: (o.z[1] || 1) * 0.8, d: (o.z[2] || 1) * 0.8, c: pt.color || o.c, o: 1 });
    gmap[gmap.length - 1].model = true;
    gmap[gmap.length - 1].m = bx;
  });
}
function glbatch(list){
  if (!gthree) {
    list.forEach(function(o) { glmesh(o); });
    return;
  }
  var buckets = {};
  list.forEach(function(o) {
    var mk2 = o.mt ? '|' + o.mt.r + '|' + o.mt.m + '|' + o.mt.u + '|' + o.mt.ds : '';
    var key = 'g' + o.t + '|' + glhex(o.c || '#c8ccd4') + '|' + (o.s || '') + '|' + (o.sidecolor || '') + '|' + Math.round((o.w || 1) * 4) + mk2;
    (buckets[key] = buckets[key] || []).push(o);
  });
  Object.keys(buckets).forEach(function(k) {
    var arr = buckets[k];
    var o0 = arr[0];
    if (arr.length < 4) {
      arr.forEach(function(o) { glmesh(o); });
      return;
    }
    var mats;
    if (o0.mt) mats = glmat(o0);
    else if (o0.t === 'sprite') mats = glmulti(gltiled(o0), glside(o0), glflat('#6ecf57'));
    else if (o0.t === 'tile') mats = glmulti(gltilemat(o0), glflat('#a4552f'), gltilemat(o0));
    else mats = glmat(o0);
    var im = new glib.InstancedMesh(gboxgeo, mats, arr.length);
    im.castShadow = true;
    im.receiveShadow = true;
    var dummy = new glib.Object3D();
    arr.forEach(function(o, i) {
      dummy.position.set(o.p[0], o.p[1], o.p[2]);
      dummy.rotation.set(0, 0, o.q ? (o.q[2] || 0) * Math.PI / 180 : 0);
      dummy.scale.set(o.w || 1, o.h || 1, o.d || 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.computeBoundingSphere) im.computeBoundingSphere();
    gscn.add(im);
    gmap.push({ o: o0, m: im, inst: true });
  });
}
function glboot(){
  var prefer = String(lvl.lib || '').toLowerCase().indexOf('faoxom') >= 0 ? window.FaoxomJs : window.THREE;
  var lib = prefer || window.THREE || window.FaoxomJs || null;
  if (!lib || !lib.WebGLRenderer) return false;
  if (glok) return true;
  glib = lib;
  gthree = lib === window.THREE;
  try {
    var c3 = document.createElement('canvas');
    c3.id = 'c3d';
    c3.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:0';
    document.body.insertBefore(c3, cv);
    cv.style.position = 'fixed';
    cv.style.inset = '0';
    cv.style.width = '100%';
    cv.style.height = '100%';
    cv.style.zIndex = '1';
    cv.style.background = 'transparent';
    grend = new lib.WebGLRenderer({ canvas: c3, antialias: true, alpha: false });
    if (grend.setPixelRatio) grend.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    if (gthree && lib.sRGBEncoding) grend.outputEncoding = lib.sRGBEncoding;
    if (grend.shadowMap) {
      grend.shadowMap.enabled = true;
      if (gthree) grend.shadowMap.type = lib.PCFSoftShadowMap;
    }
    grend.setSize(vw, vh, false);
    gscn = new lib.Scene();
    var sky = glhex(lvl.sky || '#c5e4ff');
    if (gthree) {
      var skyc = document.createElement('canvas');
      skyc.width = 4;
      skyc.height = 256;
      var skg = skyc.getContext('2d');
      var grd = skg.createLinearGradient(0, 0, 0, 256);
      grd.addColorStop(0, '#7fb6e8');
      grd.addColorStop(0.55, sky);
      grd.addColorStop(1, '#e8f6ff');
      skg.fillStyle = grd;
      skg.fillRect(0, 0, 4, 256);
      var skytx = new lib.CanvasTexture(skyc);
      if (lib.sRGBEncoding) skytx.encoding = lib.sRGBEncoding;
      gscn.background = skytx;
    } else {
      gscn.background = { color: glint(sky), alpha: 1 };
    }
    if (gthree) gscn.fog = { color: glcol('#d8eefc'), near: 40, far: 108 };
    if (gthree) {
      try {
        var pmrem = new lib.PMREMGenerator(grend);
        skytx.mapping = lib.EquirectangularReflectionMapping;
        gscn.environment = pmrem.fromEquirectangular(skytx).texture;
        pmrem.dispose();
      } catch (e) {
        gscn.environment = null;
      }
    }
    gcam = new lib.PerspectiveCamera(vcam.fov || 50, vw / Math.max(1, vh), 0.1, 700);
    gscn.add(new lib.AmbientLight(0xffffff, gthree ? 0.62 : 0.52));
    gsun = new lib.DirectionalLight(0xfff4e2, gthree ? 1.05 : 0.78);
    gsun.position.set(-9, 16, 11);
    gsun.castShadow = true;
    if (gthree && gsun.shadow && gsun.shadow.camera) {
      gsun.shadow.mapSize.width = 1024;
      gsun.shadow.mapSize.height = 1024;
      gsun.shadow.camera.left = -26;
      gsun.shadow.camera.right = 26;
      gsun.shadow.camera.top = 26;
      gsun.shadow.camera.bottom = -26;
      gsun.shadow.camera.near = 1;
      gsun.shadow.camera.far = 90;
      gsun.shadow.bias = -0.0011;
      gsun.shadow.radius = 2.4;
      gsun.shadow.normalBias = 0.02;
    }
    gscn.add(gsun);
    if (gthree) gscn.add(gsun.target);
    var envq = lvl.env || {};
    if (envq.vsm) {
      if (grend.shadowMap) grend.shadowMap.enabled = true;
      gsun.castShadow = true;
      var sres = Math.min(4096, Math.max(256, envq.vsmres || 1024));
      if (gthree && gsun.shadow) {
        gsun.shadow.mapSize.width = sres;
        gsun.shadow.mapSize.height = sres;
        if (gsun.shadow.camera) {
          gsun.shadow.camera.left = -26;
          gsun.shadow.camera.right = 26;
          gsun.shadow.camera.top = 26;
          gsun.shadow.camera.bottom = -26;
          gsun.shadow.camera.updateProjectionMatrix();
        }
      }
    }
    if (envq.lumen) {
      try {
        gscn.add(new lib.HemisphereLight(lvl.sky || '#c5e4ff', 0x9c8f6b, 0.2 + (envq.lumenstrength || 0.55) * 0.5));
      } catch (e) {}
    }
    gboxgeo = new lib.BoxGeometry(1, 1, 1);
    gplanegeo = new lib.PlaneGeometry(1, 1);
    var statics3 = [];
    decor.forEach(function(o) {
      if (o.ui || o.pt || o === hero) return;
      if (o.s === 'nearhills' || o.s === 'farhills') return;
      if (o.md) { glmodel(o); return; }
      if (o.t !== 'sprite' || (o.d && o.d > 0.6 && !o.an && !o.spin && !o.pt)) { statics3.push(o); return; }
      glmesh(o);
    });
    glbatch(statics3);
    if (hero) {
      var hf = glmat({ t: 'sprite', s: hero.s || 'hero' });
      ghero = new glib.Mesh(gboxgeo, glmulti(hf, glflat('#e7c49b'), glflat('#e7c49b')));
      ghero.scale.set(hero.w, hero.h, 0.1);
      ghero.castShadow = true;
      gscn.add(ghero);
    }
    glok = true;
    glsync();
  } catch (err) {
    glok = false;
    var dead = document.getElementById('c3d');
    if (dead && dead.parentNode) dead.parentNode.removeChild(dead);
    cv.style.position = '';
    cv.style.inset = '';
    cv.style.width = '';
    cv.style.height = '';
    cv.style.zIndex = '';
    cv.style.background = '';
  }
  return glok;
}
function glsync(){
  if (!glok) return;
  var cpp = Math.cos(vcam.pitch);
  var ex = vcam.target[0] + Math.sin(vcam.yaw) * cpp * vcam.dist;
  var ey = vcam.target[1] + Math.sin(vcam.pitch) * vcam.dist;
  var ez = vcam.target[2] + Math.cos(vcam.yaw) * cpp * vcam.dist;
  gcam.position.set(ex, ey, ez);
  if (gcam.up && gcam.up.set) gcam.up.set(0, 1, 0);
  if (!glook) glook = new glib.Vector3();
  glook.set(vcam.target[0], vcam.target[1], vcam.target[2]);
  gcam.lookAt(glook);
  gcam.aspect = vw / Math.max(1, vh);
  if (gcam.updateProjectionMatrix) gcam.updateProjectionMatrix();
  gsun.position.set(vcam.target[0] - 9, 16, 11);
  if (gsun.target) gsun.target.position.set(vcam.target[0], 0, 0);
  var envp = lvl.env || {};
  var cellp = envp.cell || 24;
  var radp = envp.cellradius === undefined ? 3 : envp.cellradius;
  var ccxp = Math.floor(vcam.target[0] / cellp);
  var ccyp = Math.floor(vcam.target[1] / cellp);
  gmap.forEach(function(e){
    if (e.inst) return;
    var o = e.o;
    var m = e.m;
    var visp = true;
    if (envp.partition) {
      var cxp = Math.floor(o.p[0] / cellp);
      var cyp = Math.floor(o.p[1] / cellp);
      if (Math.abs(cxp - ccxp) > radp || Math.abs(cyp - ccyp) > radp) visp = false;
    }
    if (visp && envp.nanite) {
      var ddx = o.p[0] - ex;
      var ddy = o.p[1] - ey;
      var ddz = o.p[2] - ez;
      if (Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz) > (envp.nanitedist || 14) * 2.6 && (o.w || 1) < 1.6) visp = false;
    }
    m.visible = visp && !(o.k && g.got[o.k]);
    m.position.set(o.p[0], o.p[1] + (o.anbob || 0), o.p[2]);
    if (e.model) {
      m.rotation.y = ((o.q[1] || 0) * Math.PI) / 180;
      return;
    }
    if (e.plane) {
      if (o.h < 3 && o.w < 4) m.quaternion.copy(gcam.quaternion);
      if (o.s === 'coin') m.rotateZ(g.time * 2.4);
    } else if (o.q) {
      m.rotation.z = ((o.q[2] || 0) * Math.PI) / 180;
    }
  });
  if (ghero) {
    var hs = hero.an ? hero.s : hero.s || 'hero';
    ghero.material = glmat({ t: 'sprite', s: hs });
    ghero.position.set(g.x, g.y + (hero.anbob || 0), (hero.p[2] || 0) + 1.4);
    ghero.scale.set(hero.w * (g.face < 0 ? -1 : 1), hero.h, 0.1);
    ghero.visible = !(g.inv > 0 && Math.floor(g.time * 14) % 2);
  }
}
var last = 0;
function frame(t){
  var dt = Math.min(0.05, (t-last)/1000 || 0.016); last = t;
  tick(dt);
  if (glok) {
    glsync();
    if (typeof netgl==='function') netgl();
    grend.render(gscn, gcam);
    ctx.clearRect(0, 0, vw, vh);
    drawparts();
    drawui();
    requestAnimationFrame(frame);
    return;
  }
  drawbg();
  var list = decor.slice();
  if (typeof netdecor==='function') list = list.concat(netdecor());
  if (hero) list.push({ t:'sprite', s: hero.an ? hero.s : (hero.s||'hero'), p:[g.x, g.y + (hero.anbob||0), hero.p[2]], w: hero.w, h: hero.h, o: g.inv > 0 && Math.floor(g.time*14)%2 ? 0.45 : 1, q:[0,0,0], z:[1,1,1] });
  list = list.filter(function(o){ return !(o.k && g.got[o.k]); });
  list.forEach(function(o){ o.__z = view([o.p[0], o.p[1], o.p[2]])[2]; });
  list.sort(function(a,b){ return b.__z - a.__z; });
  list.forEach(drawobj);
  drawparts();
  drawui();
  requestAnimationFrame(frame);
}
if (!glboot() && window.__libready) window.__libready.then(function(){ glboot(); });
__NETRUNTIME__
hud(); msg(''); requestAnimationFrame(frame);
})();
`;
}

var glcdns = {
  three: [{ u: "https://unpkg.com/three@0.149.0/build/three.min.js" }, { u: "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js" }, { u: "vendor/three.min.js" }],
  faoxomjs: [{ u: "https://cdn.jsdelivr.net/gh/axom0022/faoxomjs@main/dist/faoxom.min.js" }, { u: "vendor/faoxomjs.js" }]
};
function gllibof(backend) {
  return String(backend || "").toLowerCase().indexOf("faoxom") >= 0 ? "faoxomjs" : "three";
}
function glprimary(backend) {
  var e = glcdns[gllibof(backend)][0];
  return e.u + (e.m ? '" type="module' : "");
}
function glloader(backend) {
  var want = gllibof(backend);
  var name = want === "faoxomjs" ? "FaoxomJs" : "THREE";
  var alt = want === "faoxomjs" ? "FaoxomJs" : "THREE";
  var spare = want === "faoxomjs" ? glcdns.three : glcdns.faoxomjs;
  var first = glcdns[want];
  return "(function(){var n='" + name + "',a='" + alt + "',own=" + JSON.stringify(first) + ",spare=" + JSON.stringify(spare) + ",tries=0,ai=0;window.__libready=new Promise(function(done){var poll=setInterval(function(){if(window[n]){clearInterval(poll);done(n);return;}if(++tries>150){clearInterval(poll);alt();}},50);function alt(){if(window[a]){done(a);return;}if(ai>=spare.length){done(null);return;}var e=spare[ai++],sc=document.createElement('script');sc.src=e.u;if(e.m)sc.type='module';sc.onload=function(){alt();};sc.onerror=function(){alt();};document.head.appendChild(sc);}if(window[n]){clearInterval(poll);done(n);}});})();";
}

function buildgame2() {
  var data = builddata2();
  var backend = app.backend || "three";
  data.lib = backend;
  var json = JSON.stringify(data);
  var rt = buildrun2().split("__NETRUNTIME__").join(typeof netcode === "function" ? netcode() : "");
  var color = (app.scene.env && app.scene.env.color) || "#c5e4ff";
  var css = "html,body{margin:0;height:100%;overflow:hidden;background:" + color + ";font-family:system-ui,-apple-system,'Segoe UI',sans-serif;touch-action:none}" +
    "#c{display:block;width:100vw;height:100vh}" +
    "#hud{position:fixed;left:18px;top:14px;z-index:4;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.45);pointer-events:none}" +
    "#score{font-weight:800;font-size:24px;letter-spacing:.3px}" +
    "#lives{display:flex;gap:5px;margin-top:6px}" +
    ".hp{width:20px;height:20px;display:block;background:#e8503a;border-radius:3px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)}" +
    "#msg{position:fixed;inset:0;display:none;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:800;font-size:44px;text-shadow:0 6px 24px rgba(0,0,0,.5);background:rgba(12,14,18,.42);pointer-events:none;padding:24px;z-index:4}" +
    "#msg small{font-size:17px;font-weight:600;opacity:.9}" +
    "#pad{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:space-between;padding:18px 22px;pointer-events:none}" +
    "#pad button{pointer-events:auto;width:62px;height:62px;border-radius:50%;border:0;background:rgba(255,255,255,.32);backdrop-filter:blur(6px);color:#fff;font-size:24px;font-weight:800;margin-left:10px}" +
    "#pad button:active{background:rgba(255,255,255,.55)}" +
    "@media (hover:hover) and (pointer:fine){#pad{display:none}}";
  var pad = '<div id="pad"><div><button data-k="ArrowLeft">&#8592;</button><button data-k="ArrowRight">&#8594;</button></div><div><button data-k="Space">&#9650;</button></div></div>';
  var closer = "</" + "script>";
  var opener = "<" + "script>";
  var tail = "(function(){document.querySelectorAll('#pad button').forEach(function(b){var c=b.getAttribute('data-k');function on(e){e.preventDefault();window.dispatchEvent(new KeyboardEvent('keydown',{code:c}));b.classList.add('on');}function off(e){e.preventDefault();window.dispatchEvent(new KeyboardEvent('keyup',{code:c}));b.classList.remove('on');}b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});})();";
  var libtags = '<script src="' + glprimary(backend) + '"></script>' + opener + glloader(backend) + closer + '<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"></script>';
  return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\"><title>" + esc(data.name) + "</title><style>" + css + "</style></head><body><canvas id=\"c\"></canvas><div id=\"hud\"><div id=\"score\">Score: 0</div><div id=\"lives\"></div></div><div id=\"msg\"></div>" + pad + libtags + opener + "window.__level=" + json + ";" + closer + opener + rt + closer + opener + tail + closer + "</body></html>";
}

function downloadgame() {
  var html = "";
  try {
    html = buildgame2();
  } catch (err) {
    toast("Build failed: " + err.message, "bad");
    return;
  }
  var name = gamenameclean(app.project.name) + ".html";
  downloadblob(name, new Blob([html], { type: "text/html" }));
  toast("Exported " + name + " · " + Math.round(html.length / 1024) + " KB", "ok");
}

function projectbackup() {
  return { format: "unixomut-project", version: 2, engine: "Roxumitod Game Engine", saved: new Date().toISOString(), project: app.project };
}

function itchreadme() {
  return "Roxumitod Game Engine build\n\n1. Upload this zip to itch.io as an HTML game.\n2. Set the entry point to index.html.\n3. Enable 'This file will be played in the browser'.\n\n" + app.project.name + "\nBuilt " + new Date().toLocaleString() + "\n";
}

function apkreadme(pkg) {
  return "Android package for " + app.project.name + "\n\nappId: " + pkg.appid + "\nlabel: " + pkg.label + "\nversionName: " + pkg.version + "\norientation: " + pkg.orientation + "\n\nThis bundle contains a WebView wrapper ready for Android Studio:\n- app/src/main/assets/index.html holds the exported game.\n- app/src/main/AndroidManifest.xml is configured for the appId above.\n- signing.json holds the keystore settings you entered (keep this file private).\n\nBuild with Gradle: ./gradlew assembleRelease\n";
}

function androidmanifest(pkg) {
  return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" package=\"" + pkg.appid + "\">\n  <application android:label=\"" + pkg.label + "\" android:hardwareAccelerated=\"true\" android:allowBackup=\"false\">\n    <activity android:name=\".MainActivity\" android:screenOrientation=\"" + pkg.orientation + "\" android:exported=\"true\">\n      <intent-filter>\n        <action android:name=\"android.intent.action.MAIN\" />\n        <category android:name=\"android.intent.category.LAUNCHER\" />\n      </intent-filter>\n    </activity>\n  </application>\n  <uses-permission android:name=\"android.permission.INTERNET\" />\n</manifest>\n";
}

function apkactivity() {
  return "package APPID;\n\nimport android.app.Activity;\nimport android.os.Bundle;\nimport android.webkit.WebView;\nimport android.webkit.WebSettings;\n\npublic class MainActivity extends Activity {\n  WebView view;\n\n  @Override\n  protected void onCreate(Bundle state) {\n    super.onCreate(state);\n    view = new WebView(this);\n    WebSettings s = view.getSettings();\n    s.setJavaScriptEnabled(true);\n    s.setDomStorageEnabled(true);\n    s.setAllowFileAccess(true);\n    view.loadUrl(\"file:///android_asset/index.html\");\n    setContentView(view);\n  }\n}\n";
}

function exportmenu() {
  var r = qs("#exportbtn");
  var x = r ? r.getBoundingClientRect().left : window.innerWidth / 2;
  var y = r ? r.getBoundingClientRect().bottom + 4 : 120;
  openmenu([
    { head: "Export" },
    { label: "Export game (HTML)", icon: "export", act: "exporthtml" },
    { label: "Export for web (itch.io)", icon: "globe", act: "exportitch" },
    { label: "Export game (APK)", icon: "services", act: "exportapk" },
    { sep: true },
    { label: "Backup project (.ugm)", icon: "save", act: "exportbackup" },
    { label: "Project as folder (.zip)", icon: "folder", act: "exportfolder" },
    { sep: true },
    { label: "GitHub import…", icon: "upload", act: "githubimport" },
    { label: "GitHub sync…", icon: "refresh", act: "githubsync" }
  ], x, y);
}

acts.exportmenu = function () {
  exportmenu();
};

acts.exporthtml = function () {
  downloadgame();
};

acts.exportitch = function () {
  var html = buildgame2();
  var name = gamenameclean(app.project.name);
  var bytes = zipmake([
    { name: "index.html", text: html },
    { name: "README.txt", text: itchreadme() }
  ]);
  downloadbytes(name + "-itch.zip", bytes, "application/zip");
  toast("itch.io package ready · " + Math.round(bytes.length / 1024) + " KB", "ok");
};

acts.exportbackup = function () {
  var name = gamenameclean(app.project.name) + ".ugm";
  downloadblob(name, new Blob([JSON.stringify(projectbackup(), null, 1)], { type: "application/json" }));
  toast("Backup saved as " + name, "ok");
};

acts.exportfolder = function () {
  var name = gamenameclean(app.project.name);
  var files = [{ name: "project.ugm", text: JSON.stringify(projectbackup(), null, 1) }, { name: "index.html", text: buildgame2() }, { name: "README.md", text: "# " + app.project.name + "\n\nExported from the Roxumitod Game Engine on " + new Date().toLocaleString() + ".\n\n- project.ugm: full project backup\n- index.html: playable build\n- sprites/: sprite sheets used by the scene\n" }];
  var seen = {};
  walk(app.scene.objects || [], function (n) {
    if (n.type === "sprite" && n.sprite && !seen[n.sprite]) {
      seen[n.sprite] = true;
      var cv = texturecanvas(n.sprite, app.project);
      if (cv && cv.toDataURL) {
        var dataurl = cv.toDataURL("image/png");
        var bin = dataurlbytes(dataurl);
        if (bin) files.push({ name: "sprites/" + n.sprite.replace(/[^a-z0-9]/gi, "") + ".png", binary: true, data: bin });
      }
    }
  });
  var bytes = zipmake(files);
  downloadbytes(name + "-project.zip", bytes, "application/zip");
  toast("Project folder zipped · " + files.length + " files", "ok");
};

function dataurlbytes(url) {
  try {
    var b64 = url.split(",")[1];
    var raw = atob(b64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  } catch (e) {
    return null;
  }
}

acts.exportapk = function () {
  var body = '<div class="hintline">Package the game as an Android app. Fill the app details and keystore settings; the export contains a WebView project ready for Android Studio plus your signing profile.</div>';
  body += '<div class="evtform">';
  body += '<div class="frow"><div class="flabel">App id</div><div class="fctrl"><input class="inp" data-apkfield="appid" value="com.' + gamenameclean(app.project.name).replace(/-/g, "") + '.game"></div></div>';
  body += '<div class="frow"><div class="flabel">App label</div><div class="fctrl"><input class="inp" data-apkfield="label" value="' + esc(app.project.name) + '"></div></div>';
  body += '<div class="frow"><div class="flabel">Version name</div><div class="fctrl"><input class="inp" data-apkfield="version" value="1.0.0"></div></div>';
  body += '<div class="frow"><div class="flabel">Version code</div><div class="fctrl"><input class="inp num" type="number" data-apkfield="code" value="1"></div></div>';
  body += '<div class="frow"><div class="flabel">Orientation</div><div class="fctrl"><select class="inp" data-apkfield="orientation"><option value="landscape">Landscape</option><option value="portrait">Portrait</option><option value="sensor">Sensor</option></select></div></div>';
  body += '<div class="frow"><div class="flabel">Icon</div><div class="fctrl"><button class="assetpick" data-apkicon>' + (app.project.icon && app.project.icon !== "none" ? ic("image", "ico-sm") + "<span>Project icon</span>" : ic("image", "ico-sm") + "<span>Default icon</span>") + '</button></div></div>';
  body += '<div class="pickgroup">Signing key</div>';
  body += '<div class="frow"><div class="flabel">Keystore</div><div class="fctrl"><input class="inp" data-apkfield="keystore" value="release.keystore"></div></div>';
  body += '<div class="frow"><div class="flabel">Alias</div><div class="fctrl"><input class="inp" data-apkfield="alias" value="unixomut"></div></div>';
  body += '<div class="frow"><div class="flabel">Password</div><div class="fctrl"><input class="inp" type="password" data-apkfield="password" value=""></div></div>';
  body += '<div class="frow"><div class="flabel">Key password</div><div class="fctrl"><input class="inp" type="password" data-apkfield="keypassword" value=""></div></div>';
  body += "</div>";
  openmodal({
    title: "Export game · APK",
    icon: "services",
    width: "wide",
    body: body,
    footer: '<button class="btn" data-mact="cancel">Cancel</button><button class="btn primary" data-mact="build">' + ic("download", "ico-sm") + "Export APK package</button>",
    actions: {
      cancel: function (m, s) {
        closemodal(s);
      },
      build: function (m, s) {
        var pkg = { appid: "com.unixomut.game", label: app.project.name, version: "1.0.0", code: 1, orientation: "landscape", keystore: "", alias: "", password: "", keypassword: "" };
        m.querySelectorAll("[data-apkfield]").forEach(function (el) {
          var f = el.getAttribute("data-apkfield");
          pkg[f] = el.type === "number" ? parseInt(el.value, 10) || 1 : el.value;
        });
        var name = gamenameclean(app.project.name);
        var files = [
          { name: "app/src/main/assets/index.html", text: buildgame2() },
          { name: "app/src/main/AndroidManifest.xml", text: androidmanifest(pkg) },
          { name: "app/src/main/java/MainActivity.java", text: apkactivity().replace("APPID", pkg.appid) },
          { name: "app/build.gradle", text: "android {\n  compileSdk 34\n  defaultConfig {\n    applicationId '" + pkg.appid + "'\n    versionCode " + pkg.code + "\n    versionName '" + pkg.version + "'\n  }\n}\n" },
          { name: "signing.json", text: JSON.stringify({ keystore: pkg.keystore, alias: pkg.alias, haspassword: !!pkg.password, haskeypassword: !!pkg.keypassword }, null, 1) },
          { name: "README.txt", text: apkreadme(pkg) }
        ];
        var bytes = zipmake(files);
        downloadbytes(name + "-apk.zip", bytes, "application/zip");
        closemodal(s);
        toast("APK package exported · " + Math.round(bytes.length / 1024) + " KB", "ok");
      }
    }
  });
};

function githubapi(path, opts) {
  var cfg = app.github || (app.github = { token: "", owner: "", repo: "", branch: "main", path: "unixomut-game.ugm" });
  var url = "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo + path;
  var headers = { Accept: "application/vnd.github+json" };
  if (cfg.token) headers.Authorization = "Bearer " + cfg.token;
  opts = opts || {};
  opts.headers = headers;
  return fetch(url, opts).then(function (r) {
    return r.json().then(function (j) {
      if (!r.ok) throw new Error(j.message || "GitHub error " + r.status);
      return j;
    });
  });
}

function githubform(mode) {
  var cfg = app.github || (app.github = { token: "", owner: "", repo: "", branch: "main", path: "unixomut-game.ugm" });
  var body = '<div class="hintline">' + (mode === "import" ? "Load a .ugm project file from a GitHub repository." : "Commit the current project to a GitHub repository as a .ugm backup.") + "</div>";
  body += '<div class="evtform">';
  body += '<div class="frow"><div class="flabel">Owner</div><div class="fctrl"><input class="inp" data-ghfield="owner" value="' + esc(cfg.owner) + '" placeholder="username"></div></div>';
  body += '<div class="frow"><div class="flabel">Repository</div><div class="fctrl"><input class="inp" data-ghfield="repo" value="' + esc(cfg.repo) + '" placeholder="my-game"></div></div>';
  body += '<div class="frow"><div class="flabel">Branch</div><div class="fctrl"><input class="inp" data-ghfield="branch" value="' + esc(cfg.branch) + '"></div></div>';
  body += '<div class="frow"><div class="flabel">File path</div><div class="fctrl"><input class="inp" data-ghfield="path" value="' + esc(cfg.path) + '"></div></div>';
  body += '<div class="frow"><div class="flabel">Token</div><div class="fctrl"><input class="inp" type="password" data-ghfield="token" value="' + esc(cfg.token) + '" placeholder="ghp_… (needed to write)"></div></div>';
  body += "</div>";
  body += '<div id="ghstatus" class="hintline"></div>';
  openmodal({
    title: mode === "import" ? "GitHub import" : "GitHub sync",
    icon: "globe",
    width: "wide",
    body: body,
    footer: '<button class="btn" data-mact="cancel">Cancel</button><button class="btn primary" data-mact="go">' + ic(mode === "import" ? "download" : "upload", "ico-sm") + (mode === "import" ? "Import project" : "Commit project") + "</button>",
    actions: {
      cancel: function (m, s) {
        closemodal(s);
      },
      go: function (m, s) {
        m.querySelectorAll("[data-ghfield]").forEach(function (el) {
          cfg[el.getAttribute("data-ghfield")] = el.value.trim();
        });
        var status = m.querySelector("#ghstatus");
        function say(t, kind) {
          if (status) {
            status.textContent = t;
            status.style.color = kind === "bad" ? "#e8604c" : kind === "ok" ? "#5cc47a" : "";
          }
        }
        if (!cfg.owner || !cfg.repo) {
          say("Owner and repository are required.", "bad");
          return;
        }
        if (mode === "import") {
          say("Reading " + cfg.owner + "/" + cfg.repo + "/" + cfg.path + "…");
          githubapi("/contents/" + encodeURI(cfg.path) + "?ref=" + encodeURI(cfg.branch || "main")).then(function (j) {
            var text = j.content ? decodeURIComponent(escape(atob(j.content.replace(/\s/g, "")))) : "";
            var parsed = JSON.parse(text);
            var proj = parsed.project || parsed;
            if (!proj || !proj.scenes) throw new Error("That file is not a Roxumitod project");
            proj.id = proj.id || newid("pr");
            app.projects = app.projects || [];
            app.projects.unshift(proj);
            saveprojects();
            closemodal(s);
            toast("Imported " + proj.name + " from GitHub", "ok");
            buildlauncherstart();
            renderlauncher("projects");
          }).catch(function (e) {
            say(e.message, "bad");
          });
        } else {
          var payload = JSON.stringify(projectbackup(), null, 1);
          say("Committing " + cfg.path + "…");
          githubapi("/contents/" + encodeURI(cfg.path) + "?ref=" + encodeURI(cfg.branch || "main")).then(function (j) {
            return j.sha;
          }).catch(function () {
            return null;
          }).then(function (sha) {
            var bodyq = { message: "Update " + app.project.name + " from Roxumitod Game Engine", content: b64utf8(payload), branch: cfg.branch || "main" };
            if (sha) bodyq.sha = sha;
            return githubapi("/contents/" + encodeURI(cfg.path), { method: "PUT", body: JSON.stringify(bodyq) });
          }).then(function () {
            closemodal(s);
            toast("Synced to " + cfg.owner + "/" + cfg.repo, "ok");
          }).catch(function (e) {
            say(e.message, "bad");
          });
        }
      }
    }
  });
}

acts.githubimport = function () {
  githubform("import");
};
acts.githubsync = function () {
  githubform("sync");
};

acts.publish = function () {
  var size = 0;
  var html = "";
  try {
    html = buildgame2();
    size = Math.round(html.length / 1024);
  } catch (err) {
    toast("Build failed: " + err.message, "bad");
    return;
  }
  var sheet = null;
  (app.project.eventsheets || []).forEach(function (s) {
    if (s.name === app.scene.eventsheet) sheet = s;
  });
  openmodal({
    title: "Publish game",
    icon: "sparkle",
    width: "narrow",
    body: '<div style="font-size:12.5px;color:var(--text-2);line-height:1.7">' + ic("check", "ico-sm") + " <b>" + esc(app.project.name) + "</b> is ready to build.</div>" +
      '<div class="setsec" style="margin-top:12px"><div class="sethead">' + ic("file", "ico-sm") + '<span>Build output</span></div><div class="setbody">' +
      '<div class="setrow"><div class="setlabel">Single HTML file</div><div class="setctrl"><span class="pill">' + size + " KB</span></div></div>" +
      '<div class="setrow"><div class="setlabel">Scenes</div><div class="setctrl"><span class="pill">' + app.project.scenes.length + "</span></div></div>" +
      '<div class="setrow"><div class="setlabel">Events</div><div class="setctrl"><span class="pill">' + (sheet ? (sheet.events || []).length : 0) + "</span></div></div>" +
      '<div class="setrow"><div class="setlabel">Imported models</div><div class="setctrl"><span class="pill">' + (app.project.models || []).length + "</span></div></div>" +
      "</div></div>" +
      '<div class="setsec"><div class="sethead">' + ic("globe", "ico-sm") + '<span>Options</span></div><div class="setbody">' +
      '<div class="setrow"><div class="setlabel">Touch controls</div><div class="setctrl">' + check("", true, "checked") + "</div></div>" +
      '<div class="setrow"><div class="setlabel">Game name</div><div class="setctrl"><input class="inp" value="' + esc(app.project.name) + '" data-buildname></div></div>' +
      "</div></div>" +
      '<div class="tiny dim" style="margin-top:10px">The build embeds sprites, models, particles, tiles, UI and the event sheet, and links the 3D library from its CDN with an offline 2D fallback.</div>',
    footer: '<button class="btn" data-mact="close">Close</button><button class="btn" data-mact="itch">' + ic("globe", "ico-sm") + 'itch.io zip</button><button class="btn primary" data-mact="build">' + ic("download", "ico-sm") + "Download build</button>",
    actions: {
      close: function (m, s) {
        closemodal(s);
      },
      itch: function (m, s) {
        closemodal(s);
        acts.exportitch();
      },
      build: function (m, s) {
        var inp = m.querySelector("[data-buildname]");
        if (inp && inp.value.trim()) {
          app.project.name = inp.value.trim();
          commit("renameproject");
        }
        closemodal(s);
        downloadgame();
      }
    }
  });
};
