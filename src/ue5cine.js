var cinerun = null;

function cinefixed() {
  return {
    width: 1280,
    height: 720,
    fps: 30,
    seconds: 8,
    bitrate: 8000000,
    focus: 0,
    fstop: 2.8,
    shutter: 180,
    iso: 400,
    bloom: 0.2
  };
}

function cineconf() {
  app.scene.cine = app.scene.cine || {};
  var d = cinefixed();
  for (var k in d) {
    if (app.scene.cine[k] === undefined) app.scene.cine[k] = d[k];
  }
  return app.scene.cine;
}

function cinecamera() {
  var cam = null;
  walk(app.scene.objects, function (n) {
    if (!cam && n.type === "camera" && n.cine) cam = n;
  });
  return cam;
}

function cineadd() {
  var n = basenode("camera", { pos: [app.cam.target[0] + 4, Math.max(2, app.cam.target[1] + 2), app.cam.target[2] + 6] });
  n.name = "Cine Camera";
  n.cine = true;
  n.focal = 35;
  n.aperture = 2.8;
  n.focusdist = 8;
  n.rot = [-15, 200, 0];
  addnode(n, null);
  toast("Cine Camera actor added", "ok");
  return n;
}

function cineframeseq() {
  var q = seqdata();
  var cam = cinecamera();
  if (!cam) return null;
  var w = worldpos(cam);
  var m = worldmatrix(cam);
  var dir = vnorm([-m[8], -m[9], -m[10]]);
  var eye = [w[0], w[1] + 0.4, w[2]];
  var target = [eye[0] - dir[0] * 10, eye[1] - dir[1] * 10, eye[2] - dir[2] * 10];
  return { eye: eye, target: target, fov: 2 * Math.atan(18 / (cam.focal || 35)) * 180 / Math.PI };
}

function cinesetfov() {
  var cam = cinecamera();
  if (!cam) return 45;
  return 2 * Math.atan(18 / (cam.focal || 35)) * 180 / Math.PI;
}

function cinerender() {
  var cfg = cineconf();
  var canvas = qs("#maincanvas");
  if (!canvas) {
    toast("Viewport not ready", "bad");
    return;
  }
  if (typeof MediaRecorder === "undefined") {
    toast("MediaRecorder unavailable in this browser", "bad");
    return;
  }
  if (cinerun) {
    toast("Already rendering");
    return;
  }
  var stream;
  try {
    stream = canvas.captureStream(cfg.fps);
  } catch (e) {
    toast("Cannot capture viewport", "bad");
    return;
  }
  var mime = "video/webm;codecs=vp9";
  if (!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";
  var rec;
  try {
    rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: cfg.bitrate });
  } catch (e2) {
    toast("Recorder failed: " + e2.message, "bad");
    return;
  }
  var chunks = [];
  rec.ondataavailable = function (ev) {
    if (ev.data && ev.data.size) chunks.push(ev.data);
  };
  var q = seqdata();
  var start = performance.now();
  var was = q.playing;
  cinerun = { rec: rec, chunks: chunks, frames: 0, cfg: cfg, start: start };
  q.t = 0;
  q.playing = q.tracks.length > 0;
  q.hold = true;
  if (!app.play) startplay();
  setTimeout(function () {
    var cam = cinecamera();
    if (cam && app.play) {
      app.cinecam = framefromnode(cam);
    }
  }, 60);
  rec.start(120);
  toast("Rendering " + cfg.seconds + "s at " + cfg.width + "x" + cfg.height + " · " + cfg.fps + "fps", "ok");
  var ticker = setInterval(function () {
    cinerun.frames++;
    var el = (performance.now() - start) / 1000;
    var bar = qs("#cinerenderbar");
    if (bar) bar.style.width = Math.min(100, (el / cfg.seconds) * 100) + "%";
    if (el >= cfg.seconds) {
      clearInterval(ticker);
      cinefinish(was);
    }
  }, 100);
}

function framefromnode(cam) {
  var m = worldmatrix(cam);
  var w = worldpos(cam);
  var dir = vnorm([-m[8], -m[9], -m[10]]);
  var eye = [w[0], w[1] + 0.4, w[2]];
  return { eye: eye, target: [eye[0] - dir[0] * 10, eye[1] - dir[1] * 10, eye[2] - dir[2] * 10], fov: cinesetfov(), mode: "persp" };
}

function cinefinish(was) {
  var run = cinerun;
  if (!run) return;
  var q = seqdata();
  q.playing = !!was;
  app.cinecam = null;
  run.rec.onstop = function () {
    var blob = new Blob(run.chunks, { type: "video/webm" });
    var name = "unixomut-render-" + Date.now() + ".webm";
    downloadblob(name, blob);
    toast("Render complete · " + Math.round(blob.size / 1024) + " KB", "ok");
    cinerun = null;
    var bar = qs("#cinerenderbar");
    if (bar) bar.style.width = "0%";
  };
  try {
    run.rec.stop();
  } catch (e) {
    cinerun = null;
  }
  if (app.play) stopplay();
}

function cinestill() {
  var canvas = qs("#maincanvas");
  if (!canvas) return;
  var cfg = cineconf();
  var out = document.createElement("canvas");
  out.width = cfg.width;
  out.height = cfg.height;
  var g = out.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, out.width, out.height);
  var sw = canvas.width;
  var sh = canvas.height;
  var sc = Math.min(out.width / sw, out.height / sh);
  var dw = sw * sc;
  var dh = sh * sc;
  g.drawImage(canvas, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh);
  out.toBlob(function (blob) {
    downloadblob("unixomut-still-" + cfg.width + "x" + cfg.height + ".png", blob);
    toast("Still exported at " + cfg.width + "x" + cfg.height, "ok");
  }, "image/png");
}

function cinetake() {
  var cam = cinecamera();
  if (!cam) {
    toast("Add a Cine Camera first", "bad");
    return;
  }
  var q = seqdata();
  var f = framefromnode(cam);
  var t = seqaddtrack("camera", "Cine Camera", "camera");
  t.keys.push({ t: +q.t.toFixed(2), eye: f.eye.slice(), target: f.target.slice(), fov: f.fov });
  t.keys.sort(function (a, b) {
    return a.t - b.t;
  });
  commit("take recorder");
  toast("Take recorded at " + q.t.toFixed(2) + "s", "ok");
}

function cinetakebatch() {
  var cam = cinecamera();
  if (!cam) {
    toast("Add a Cine Camera first", "bad");
    return;
  }
  var q = seqdata();
  var t = seqaddtrack("camera", "Cine Camera", "camera");
  var n = Math.max(4, Math.min(60, Math.round((q.len || 6) * 2)));
  for (var i = 0; i < n; i++) {
    var tt = (i / (n - 1)) * (q.len || 6);
    var fwd = tt / (q.len || 6);
    var f = framefromnode(cam);
    var away = 2 + fwd * 6;
    f.eye = [f.eye[0] + Math.sin(fwd * 3) * away, f.eye[1] + fwd * 1.5, f.eye[2] + Math.cos(fwd * 2) * away];
    t.keys.push({ t: +tt.toFixed(2), eye: f.eye.slice(), target: f.target.slice(), fov: f.fov });
  }
  t.keys.sort(function (a, b) {
    return a.t - b.t;
  });
  commit("take recorder");
  toast("Recorded " + n + " camera keys", "ok");
}

function cinepanel() {
  var cfg = cineconf();
  var cams = [];
  walk(app.scene.objects, function (n) {
    if (n.type === "camera") cams.push(n);
  });
  var cur = cinecamera();
  var body = '<div class="modalcine">';
  body += u5sec("Cine Camera Actor", "Filmback, focal length and depth of field",
    u5row("Camera actor", '<span class="u5val">' + (cur ? esc(cur.name) : "none") + "</span>") +
    u5row("Focal length", '<input class="inp num" type="range" min="12" max="200" step="1" value="' + (cur ? cur.focal || 35 : 35) + '" data-cine="focal">') +
    u5row("Aperture f-stop", '<input class="inp num" type="range" min="1" max="22" step="0.1" value="' + (cur ? cur.aperture || 2.8 : 2.8) + '" data-cine="aperture">') +
    u5row("Focus distance", '<input class="inp num" type="range" min="0.5" max="60" step="0.1" value="' + (cur ? cur.focusdist || 8 : 8) + '" data-cine="focusdist">') +
    '<div class="u5btns"><button class="btn" data-cineact="add">' + ic("camera", "ico-sm") + " Add Cine Camera</button>" +
    '<button class="btn ghost" data-cineact="use">Use this camera in game</button></div>');
  body += u5sec("Take Recorder", "Bake camera motion into Sequencer keys",
    u5row("Sequence length", '<input class="inp num" type="range" min="2" max="30" step="0.5" value="' + (seqdata().len || 6) + '" data-cine="len">') +
    '<div class="u5btns"><button class="btn" data-cineact="take">Record take</button>' +
    '<button class="btn ghost" data-cineact="batch">Record camera pass</button>' +
    '<button class="btn ghost" data-cineact="seq">Open Sequencer</button></div>');
  body += u5sec("Movie Render Queue", "Offscreen capture to WebM and PNG",
    u5row("Resolution", selectrow("", [{ value: "1280", label: "1280 x 720" }, { value: "1920", label: "1920 x 1080" }, { value: "960", label: "960 x 540" }, { value: "720", label: "720 x 720" }], String(cfg.width), 'data-cine="res"')) +
    u5row("Frame rate", selectrow("", [{ value: "24", label: "24 fps" }, { value: "30", label: "30 fps" }, { value: "60", label: "60 fps" }], String(cfg.fps), 'data-cine="fps"')) +
    u5row("Duration", '<input class="inp num" type="range" min="2" max="30" step="1" value="' + cfg.seconds + '" data-cine="seconds">') +
    u5row("Bitrate", '<input class="inp num" type="range" min="1000000" max="20000000" step="500000" value="' + cfg.bitrate + '" data-cine="bitrate">') +
    '<div class="renderbar"><div id="cinerenderbar"></div></div>' +
    '<div class="u5btns"><button class="btn" data-cineact="render">' + ic("film", "ico-sm") + " Render movie</button>" +
    '<button class="btn ghost" data-cineact="still">Export still</button>' +
    '<button class="btn ghost" data-cineact="stop">Cancel</button></div>' +
    '<div class="u5note">Renders the live viewport through MediaRecorder and downloads a .webm file. Stills export at the chosen resolution.</div>');
  body += "</div>";
  openmodal({
    title: "Cinematics - Cine Camera, Takes & Movie Render Queue",
    icon: "film",
    width: "wide",
    body: body,
    onmount: function (m) {
      m.querySelectorAll("[data-cine]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          var f = inp.getAttribute("data-cine");
          var v = inp.type === "range" || inp.type === "number" ? parseFloat(inp.value) : inp.value;
          if (f === "res") {
            cfg.width = parseInt(v, 10);
            cfg.height = cfg.width === 720 ? 720 : Math.round(cfg.width * 9 / 16);
          } else if (f === "fps") cfg.fps = parseFloat(v);
          else if (f === "seconds") cfg.seconds = v;
          else if (f === "bitrate") cfg.bitrate = v;
          else if (f === "len") {
            seqdata().len = v;
          } else {
            var cam = cinecamera();
            if (cam) {
              cam[f] = v;
              commit("cine camera");
            }
          }
        });
      });
      m.querySelectorAll("[data-cineact]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-cineact");
          var cam = cinecamera();
          if (a === "add") {
            cineadd();
            closemodal();
            setTimeout(cinepanel, 120);
          } else if (a === "use") {
            if (cam) {
              app.project.cameraactor = cam.id;
              commit("use camera");
              toast("Game will use " + cam.name, "ok");
            } else toast("No Cine Camera", "bad");
          } else if (a === "take") cinetake();
          else if (a === "batch") cinetakebatch();
          else if (a === "seq") {
            closemodal();
            setTimeout(function () {
              ue5panel("sequencer");
            }, 120);
          } else if (a === "render") cinerender();
          else if (a === "still") cinestill();
          else if (a === "stop") {
            if (cinerun) {
              cinefinish(false);
            }
          }
        });
      });
    }
  });
}

function cinecamhook(cam, env) {
  if (app.cinecam) return app.cinecam;
  var id = app.project.cameraactor;
  if (!id) return cam;
  var n = findnode(app.scene.objects, id);
  if (!n) return cam;
  return framefromnode(n);
}
