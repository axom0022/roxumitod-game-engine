var spstate = null;

function hsvtorgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  var c = v * s;
  var x = c * (1 - Math.abs((h / 60) % 2 - 1));
  var m = v - c;
  var r = 0;
  var g = 0;
  var b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgb2hex(r, g, b) {
  return "#" + [r, g, b].map(function (v) {
    return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
  }).join("");
}

function hex2rgb(hex) {
  var h = hex.replace("#", "");
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  var n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function openspriteeditor(size, label, existing) {
  if (qs("#spriteed")) qs("#spriteed").remove();
  var w = size ? size[0] : 256;
  var h = size ? size[1] : 256;
  spstate = {
    w: w,
    h: h,
    title: label || "Sprite " + (app.spritecount = (app.spritecount || 11)),
    tool: "brush",
    color: "#ffffff",
    hue: 0,
    sat: 1,
    val: 1,
    brushsize: 4,
    brushop: 100,
    scatter: 0,
    shape: "round",
    zoom: 1,
    fit: true,
    rot: 0,
    inertia: false,
    layer: 0,
    layers: [{ name: "Layer 1", visible: true, canvas: cvw(w, h) }],
    undo: [],
    redo: [],
    drawing: false,
    last: null,
    pointer: [0, 0]
  };
  var el = document.createElement("div");
  el.className = "spriteed";
  el.id = "spriteed";
  el.innerHTML = spriteedhtml();
  document.body.appendChild(el);
  spstate.root = el;
  var cvs = el.querySelector("#spcanvas");
  spstate.canvas = cvs;
  cvs.width = w;
  cvs.height = h;
  spstate.g = spstate.layers[0].canvas.getContext("2d");
  spstate.g.imageSmoothingEnabled = false;
  spstate.out = cvs.getContext("2d");
  spstate.out.imageSmoothingEnabled = false;
  if (existing) {
    var img = new Image();
    img.onload = function () {
      spstate.g.drawImage(img, 0, 0, w, h);
      pushspriteundo();
    };
    img.src = existing;
  } else {
    pushspriteundo();
  }
  bindspriteed(el);
  fitcanvas();
  drawpalette();
  refreshbrushinfo();
  refreshlayers();
  redrawsprite();
  var titlebox = el.querySelector("#sptitle");
  titlebox.textContent = spstate.title + " - frame 1";
}

function spriteedhtml() {
  return '<div class="spritetop"><span class="title" id="sptitle">Sprite 11 - frame 1</span>' +
    '<div class="center"><button class="btn primary" data-sact="submit">Submit</button>' +
    '<button class="iconbtn" data-sact="undo" title="Undo">' + ic("undo") + "</button>" +
    '<button class="iconbtn" data-sact="redo" title="Redo">' + ic("redo") + "</button>" +
    '<button class="iconbtn" data-sact="help" title="Help">' + ic("help") + "</button></div>" +
    '<div class="row" style="margin-left:auto;gap:6px"><button class="btn" data-sact="done">Done</button><button class="iconbtn" data-sact="close">' + ic("x") + "</button></div></div>" +
    '<div class="spritemain"><div class="spritetools" id="sptools">' +
    '<div class="toolrow">' +
    sptool("brush", "brush", "Brush") + sptool("pencil", "pen", "Pencil") + sptool("eraser", "eraser", "Eraser") + sptool("fill", "fill", "Fill") + sptool("line", "line", "Line") + sptool("rect", "rect", "Rectangle") + sptool("ellipse", "ellipse", "Ellipse") + sptool("eyedropper", "eyedropper", "Eyedropper") + sptool("pan", "hand", "Pan") + sptool("zoom", "zoomin", "Zoom") +
    "</div>" +
    '<div class="layerhead"><span class="tiny dim">Layers</span><button class="iconbtn" style="width:20px;height:20px;margin-left:auto" data-sact="addlayer" title="Add layer">' + ic("plus", "ico-sm") + '</button><button class="iconbtn" style="width:20px;height:20px" data-sact="layermenu" title="Layer options">' + ic("dots", "ico-sm") + '</button></div><div class="layerlist" id="splayerlist"></div>' +
    '<div class="cvswrap"><div class="cvssq"><canvas id="spsat" width="260" height="100"></canvas></div><div class="huerow"><canvas id="sphue" width="260" height="14"></canvas></div>' +
    '<div class="hexrow"><input class="inp" id="sphex" value="#ffffff"><span class="swatch" id="spswatch" style="background:#ffffff"></span><select class="inp" id="spstab" style="width:96px"><option>Stabilizer</option><option>1</option><option>2</option><option>3</option></select></div></div>' +
    '<div class="toolrow">' +
    '<button class="stool" data-sact="preset" title="Round brush">' + ic("sparkle") + "</button>" +
    '<button class="stool" data-sact="preset" title="Blur">' + ic("particles") + "</button>" +
    '<button class="stool" data-sact="preset" title="Scatter">' + ic("spray") + "</button>" +
    '<button class="stool" data-sact="preset" title="Line">' + ic("line") + "</button>" +
    '<button class="stool" data-sact="preset" title="Chalk">' + ic("shader") + "</button>" +
    "</div>" +
    paintfield("Size", "brushsize", 4, "size") +
    paintfield("Opacity", "brushop", 100, "op") +
    paintfield("Scatter", "scatter", 0, "scat") +
    '<div class="toolrow" style="gap:4px;margin-top:8px">' +
    shapebtn("round", ic("sphere")) + shapebtn("spray", ic("spray")) + shapebtn("line", ic("line")) + shapebtn("square", ic("rect")) +
    "</div>" +
    '<div class="brushshapes">' + shapebtn("pattern", ic("grid")) + shapebtn("mirror", ic("mirror")) + shapebtn("fill", ic("fill")) + shapebtn("eraser", ic("eraser")) + "</div>" +
    '<div class="zoombox"><span id="spzoomlabel">797%</span><div class="row" style="margin-left:auto;gap:4px"><button class="dicebtn" data-sact="zoomout">' + ic("zoomout", "ico-sm") + '</button><button class="dicebtn" data-sact="zoomin">' + ic("zoomin", "ico-sm") + "</button></div></div>" +
    '<div class="row" style="gap:4px;margin-top:6px"><input class="inp" id="sprotation" value="0" style="width:52px"><span class="tiny muted">deg</span><button class="btn sm" data-sact="reset">Reset</button><button class="btn sm" data-sact="fit">Fit</button></div>' +
    '<div class="row" style="gap:4px;margin-top:6px"><button class="dicebtn" data-sact="rotleft">' + ic("undo", "ico-sm") + '</button><button class="dicebtn" data-sact="rotright">' + ic("redo", "ico-sm") + '</button><button class="dicebtn" data-sact="fliph" title="Flip horizontal">' + ic("flip", "ico-sm") + '</button><button class="dicebtn" data-sact="flipv" title="Flip vertical">' + ic("arrowup", "ico-sm") + "</button>" +
    '<label class="check" style="margin-left:auto"><input type="checkbox" id="spinertia"><span class="box">' + ic("check", "ico-xs") + "</span>Inertia Scrolling</label></div>" +
    '<div class="tiny dim" id="sppaintinfo" style="margin-top:10px">Layer 1 · 100%</div>' +
    "</div><div class=\"spritecanvasarea\" id=\"sparea\"><div class=\"checker\" id=\"spborder\"><canvas id=\"spcanvas\" class=\"checkerbg\"></canvas></div><div class=\"cursorring\" id=\"spcursor\"></div></div></div>";
}

function sptool(id, icon, label) {
  return '<button class="stool' + (id === "brush" ? " on" : "") + '" data-sact="tool" data-tool="' + id + '" title="' + label + '">' + ic(icon) + "</button>";
}

function shapebtn(id, icon) {
  return '<button class="bshape' + (id === "round" ? " on" : "") + '" data-sact="shape" data-shape="' + id + '">' + icon + "</button>";
}

function paintfield(label, key, val, id) {
  return '<div class="paintfield"><span class="lab">' + label + '</span><input class="inp" id="spin-' + id + '" type="number" value="' + val + '"><div class="dicebtn" data-sact="dice" data-key="' + key + '">' + ic("dice", "ico-sm") + "</div></div>";
}

function bindspriteed(el) {
  el.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-sact]");
    if (!btn) return;
    var act = btn.getAttribute("data-sact");
    if (act === "tool") {
      spstate.tool = btn.getAttribute("data-tool");
      el.querySelectorAll('[data-sact="tool"]').forEach(function (b) {
        b.classList.toggle("on", b === btn);
      });
    } else if (act === "shape") {
      spstate.shape = btn.getAttribute("data-shape");
      el.querySelectorAll('[data-sact="shape"]').forEach(function (b) {
        b.classList.toggle("on", b === btn);
      });
    } else if (act === "submit") {
      submitsprite();
    } else if (act === "done" || act === "close") {
      el.remove();
      spstate = null;
    } else if (act === "undo") {
      spriteundo();
    } else if (act === "redo") {
      spriteredo();
    } else if (act === "help") {
      toast("Paint your sprite, then press Submit to add it to Files", "ok");
    } else if (act === "dice") {
      var key = btn.getAttribute("data-key");
      var vals = { brushsize: [1, 2, 3, 4, 6, 8, 12], brushop: [25, 50, 75, 100], scatter: [0, 10, 25, 50] };
      var arr = vals[key] || [4];
      spstate[key] = arr[Math.floor(Math.random() * arr.length)];
      refreshbrushinfo();
    } else if (act === "zoomin") {
      spstate.fit = false;
      spstate.zoom = Math.min(16, spstate.zoom * 1.3);
      fitcanvas();
    } else if (act === "zoomout") {
      spstate.fit = false;
      spstate.zoom = Math.max(0.1, spstate.zoom / 1.3);
      fitcanvas();
    } else if (act === "fit") {
      spstate.fit = true;
      fitcanvas();
    } else if (act === "reset") {
      spstate.zoom = 1;
      spstate.fit = false;
      spstate.rot = 0;
      el.querySelector("#spborder").style.transform = "";
      el.querySelector("#sprotation").value = "0";
      fitcanvas();
    } else if (act === "rotleft") {
      spstate.rot = (spstate.rot - 15 + 360) % 360;
      el.querySelector("#spborder").style.transform = "rotate(" + spstate.rot + "deg)";
      el.querySelector("#sprotation").value = spstate.rot;
    } else if (act === "rotright") {
      spstate.rot = (spstate.rot + 15) % 360;
      el.querySelector("#spborder").style.transform = "rotate(" + spstate.rot + "deg)";
      el.querySelector("#sprotation").value = spstate.rot;
    } else if (act === "fliph" || act === "flipv") {
      var c = spstate.layers[0].canvas;
      var tmp = cvw(c.width, c.height);
      var tg = tmp.getContext("2d");
      tg.translate(act === "fliph" ? c.width : 0, act === "flipv" ? c.height : 0);
      tg.scale(act === "fliph" ? -1 : 1, act === "flipv" ? -1 : 1);
      tg.drawImage(c, 0, 0);
      spstate.g.clearRect(0, 0, c.width, c.height);
      spstate.g.drawImage(tmp, 0, 0);
      redrawsprite();
      pushspriteundo();
    } else if (act === "layers" || act === "layerfilter" || act === "layermenu") {
      splayeract(act, ev);
    } else if (act === "addlayer") {
      splayeract("addlayer", ev);
    } else if (act === "picklayer") {
      uselayer(+btn.getAttribute("data-index"));
    } else if (act === "layervis") {
      var lv = spstate.layers[+btn.getAttribute("data-index")];
      lv.visible = !lv.visible;
      refreshlayers();
      redrawsprite();
    } else if (act === "preset") {
      el.querySelectorAll('[data-sact="preset"]').forEach(function (b) {
        b.classList.toggle("on", b === btn);
      });
      spstate.shape = "round";
    }
  });

  var area = el.querySelector("#sparea");
  var cvs = el.querySelector("#spcanvas");
  area.addEventListener("pointerdown", function (ev) {
    if (!spstate) return;
    var p = spcoords(ev);
    if (spstate.tool === "zoom") {
      spstate.fit = false;
      spstate.zoom = Math.min(16, spstate.zoom * 1.25);
      fitcanvas();
      return;
    }
    if (spstate.tool === "pan") return;
    if (spstate.tool === "eyedropper") {
      var d = spstate.out.getImageData(p[0], p[1], 1, 1).data;
      spstate.color = rgb2hex(d[0], d[1], d[2]);
      el.querySelector("#sphex").value = spstate.color;
      el.querySelector("#spswatch").style.background = spstate.color;
      return;
    }
    spstate.drawing = true;
    spstate.last = p;
    spstate.snapshot = spstate.g.getImageData(0, 0, spstate.w, spstate.h);
    spstate.snapshotlayer = spstate.layers[0].canvas;
    if (spstate.tool === "fill") {
      floodfill(p[0], p[1]);
      spstate.drawing = false;
      redrawsprite();
      pushspriteundo();
      return;
    }
    spstate.start = p;
    stamp(p[0], p[1]);
    area.setPointerCapture(ev.pointerId);
  });
  area.addEventListener("pointermove", function (ev) {
    var ring = el.querySelector("#spcursor");
    var ar = area.getBoundingClientRect();
    ring.style.left = ev.clientX - ar.left + "px";
    ring.style.top = ev.clientY - ar.top + "px";
    ring.style.width = Math.max(10, spstate.brushsize * spstate.zoom * 2) + "px";
    ring.style.height = ring.style.width;
    if (!spstate.drawing) return;
    var p = spcoords(ev);
    if (spstate.tool === "pencil" || spstate.tool === "brush" || spstate.tool === "eraser") {
      var a = spstate.last;
      var steps = Math.max(1, Math.ceil(Math.hypot(p[0] - a[0], p[1] - a[1])));
      for (var i = 1; i <= steps; i++) {
        stamp(a[0] + (p[0] - a[0]) * i / steps, a[1] + (p[1] - a[1]) * i / steps);
      }
      spstate.last = p;
      redrawsprite();
    } else {
      if (spstate.snapshot) spstate.g.putImageData(spstate.snapshot, 0, 0);
      spstate.g.save();
      spstate.g.globalAlpha = spstate.brushop / 100;
      spstate.g.strokeStyle = spstate.color;
      spstate.g.lineWidth = spstate.brushsize;
      spstate.g.lineCap = "round";
      if (spstate.tool === "pencil" || spstate.tool === "eraser") {
        spstate.g.beginPath();
        spstate.g.moveTo(spstate.last[0], spstate.last[1]);
        spstate.g.lineTo(p[0], p[1]);
        spstate.g.stroke();
      } else if (spstate.tool === "line") {
        spstate.g.beginPath();
        spstate.g.moveTo(spstate.start[0], spstate.start[1]);
        spstate.g.lineTo(p[0], p[1]);
        spstate.g.stroke();
      } else if (spstate.tool === "rect") {
        spstate.g.strokeRect(spstate.start[0], spstate.start[1], p[0] - spstate.start[0], p[1] - spstate.start[1]);
      } else if (spstate.tool === "ellipse") {
        spstate.g.beginPath();
        spstate.g.ellipse((spstate.start[0] + p[0]) / 2, (spstate.start[1] + p[1]) / 2, Math.abs(p[0] - spstate.start[0]) / 2, Math.abs(p[1] - spstate.start[1]) / 2, 0, 0, Math.PI * 2);
        spstate.g.stroke();
      }
      spstate.g.restore();
      redrawsprite();
    }
  });
  area.addEventListener("pointerup", function () {
    if (spstate && spstate.drawing) {
      spstate.drawing = false;
      pushspriteundo();
    }
  });
  area.addEventListener("wheel", function (ev) {
    if (!spstate) return;
    ev.preventDefault();
    spstate.fit = false;
    spstate.zoom = Math.max(0.1, Math.min(24, spstate.zoom * Math.exp(-ev.deltaY * 0.0015)));
    fitcanvas();
  }, { passive: false });

  el.querySelector("#sphex").addEventListener("change", function (ev) {
    var v = ev.target.value.trim();
    if (!/^#?[0-9a-f]{3,8}$/i.test(v)) return;
    if (v.charAt(0) !== "#") v = "#" + v;
    spstate.color = v;
    el.querySelector("#spswatch").style.background = v;
    var rgb = hex2rgb(v);
    spstate.val = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
    drawpalette();
  });
  ["size", "op", "scat"].forEach(function (id) {
    var input = el.querySelector("#spin-" + id);
    if (!input) return;
    input.addEventListener("input", function () {
      var v = parseFloat(input.value) || 0;
      if (id === "size") spstate.brushsize = Math.max(1, v);
      if (id === "op") spstate.brushop = Math.max(0, Math.min(100, v));
      if (id === "scat") spstate.scatter = Math.max(0, v);
      refreshbrushinfo();
    });
  });
  el.querySelector("#sprotation").addEventListener("change", function (ev) {
    spstate.rot = parseFloat(ev.target.value) || 0;
    el.querySelector("#spborder").style.transform = "rotate(" + spstate.rot + "deg)";
  });
  el.querySelector("#spinertia").addEventListener("change", function (ev) {
    spstate.inertia = ev.target.checked;
  });
  var sat = el.querySelector("#spsat");
  var hue = el.querySelector("#sphue");
  var palfn = function (ev, target) {
    var r = target.getBoundingClientRect();
    var x = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    var y = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
    if (target === hue) {
      spstate.hue = x * 360;
    } else {
      spstate.sat = x;
      spstate.val = 1 - y;
    }
    var rgb = hsvtorgb(spstate.hue, spstate.sat, spstate.val);
    spstate.color = rgb2hex(rgb[0], rgb[1], rgb[2]);
    el.querySelector("#sphex").value = spstate.color;
    el.querySelector("#spswatch").style.background = spstate.color;
    drawpalette();
  };
  sat.addEventListener("pointerdown", function (ev) {
    sat.setPointerCapture(ev.pointerId);
    palfn(ev, sat);
    sat.onpointermove = function (e2) {
      palfn(e2, sat);
    };
  });
  sat.addEventListener("pointerup", function () {
    sat.onpointermove = null;
  });
  hue.addEventListener("pointerdown", function (ev) {
    hue.setPointerCapture(ev.pointerId);
    palfn(ev, hue);
    hue.onpointermove = function (e2) {
      palfn(e2, hue);
    };
  });
  hue.addEventListener("pointerup", function () {
    hue.onpointermove = null;
  });
}

function spcoords(ev) {
  var c = spstate.canvas.getBoundingClientRect();
  return [Math.floor((ev.clientX - c.left) / c.width * spstate.w), Math.floor((ev.clientY - c.top) / c.height * spstate.h)];
}

function stamp(x, y) {
  var g = spstate.g;
  g.save();
  g.globalAlpha = spstate.brushop / 100;
  g.fillStyle = spstate.tool === "eraser" ? "#000000" : spstate.color;
  if (spstate.tool === "eraser") g.globalCompositeOperation = "destination-out";
  var r = spstate.brushsize / 2;
  var n = spstate.scatter > 0 ? 4 : 1;
  for (var i = 0; i < n; i++) {
    var px = x + (spstate.scatter > 0 ? (Math.random() - 0.5) * spstate.scatter : 0);
    var py = y + (spstate.scatter > 0 ? (Math.random() - 0.5) * spstate.scatter : 0);
    if (spstate.shape === "square") g.fillRect(px - r, py - r, spstate.brushsize, spstate.brushsize);
    else {
      g.beginPath();
      g.arc(px, py, Math.max(0.6, r), 0, Math.PI * 2);
      g.fill();
    }
    if (spstate.shape === "mirror") {
      g.beginPath();
      g.arc(spstate.w - px, py, Math.max(0.6, r), 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
  redrawsprite();
}

function redrawsprite() {
  if (!spstate || !spstate.out) return;
  var g = spstate.out;
  var tmp = cvw(spstate.w, spstate.h);
  var tg = tmp.getContext("2d");
  spstate.layers.forEach(function (l) {
    if (!l.visible) return;
    tg.globalAlpha = l.opacity === undefined ? 1 : l.opacity;
    tg.drawImage(l.canvas, 0, 0);
  });
  tg.globalAlpha = 1;
  g.clearRect(0, 0, spstate.w, spstate.h);
  g.drawImage(tmp, 0, 0);
}

function pushspriteundo() {
  if (!spstate) return;
  spstate.undo.push(spstate.layers[0].canvas.toDataURL());
  if (spstate.undo.length > 30) spstate.undo.shift();
  spstate.redo = [];
}

function spriteundo() {
  if (!spstate || spstate.undo.length < 2) return;
  spstate.redo.push(spstate.undo.pop());
  loadspritesnap(spstate.undo[spstate.undo.length - 1]);
}

function spriteredo() {
  if (!spstate || !spstate.redo.length) return;
  var snap = spstate.redo.pop();
  spstate.undo.push(snap);
  loadspritesnap(snap);
}

function loadspritesnap(url) {
  var img = new Image();
  img.onload = function () {
    spstate.g.clearRect(0, 0, spstate.w, spstate.h);
    spstate.g.drawImage(img, 0, 0, spstate.w, spstate.h);
    redrawsprite();
  };
  img.src = url;
}

function floodfill(x, y) {
  var w = spstate.w;
  var h = spstate.h;
  var img = spstate.g.getImageData(0, 0, w, h);
  var d = img.data;
  var idx = (y * w + x) * 4;
  var target = [d[idx], d[idx + 1], d[idx + 2], d[idx + 3]];
  var rgb = hex2rgb(spstate.color);
  var repl = [rgb[0], rgb[1], rgb[2], Math.round(spstate.brushop / 100 * 255)];
  if (target[0] === repl[0] && target[1] === repl[1] && target[2] === repl[2] && target[3] === repl[3]) return;
  var stack = [[x, y]];
  function same(px, py) {
    var i = (py * w + px) * 4;
    return d[i] === target[0] && d[i + 1] === target[1] && d[i + 2] === target[2] && d[i + 3] === target[3];
  }
  while (stack.length) {
    var p = stack.pop();
    var px2 = p[0];
    var py2 = p[1];
    var yy = py2;
    while (yy >= 0 && same(px2, yy)) yy--;
    yy++;
    var left = false;
    var right = false;
    while (yy < h && same(px2, yy)) {
      var i2 = (yy * w + px2) * 4;
      d[i2] = repl[0];
      d[i2 + 1] = repl[1];
      d[i2 + 2] = repl[2];
      d[i2 + 3] = repl[3];
      if (px2 > 0) {
        if (same(px2 - 1, yy)) {
          if (!left) stack.push([px2 - 1, yy]);
          left = true;
        } else left = false;
      }
      if (px2 < w - 1) {
        if (same(px2 + 1, yy)) {
          if (!right) stack.push([px2 + 1, yy]);
          right = true;
        } else right = false;
      }
      yy++;
    }
  }
  spstate.g.putImageData(img, 0, 0);
}

function drawpalette() {
  if (!spstate) return;
  var el = spstate.root;
  if (!el) return;
  var sat = el.querySelector("#spsat");
  var g = sat.getContext("2d");
  var w = sat.width;
  var h = sat.height;
  for (var x = 0; x < w; x += 2) {
    for (var y = 0; y < h; y += 2) {
      var rgb = hsvtorgb(spstate.hue, x / w, 1 - y / h);
      g.fillStyle = rgb2hex(rgb[0], rgb[1], rgb[2]);
      g.fillRect(x, y, 2, 2);
    }
  }
  var hue = el.querySelector("#sphue");
  var hg = hue.getContext("2d");
  for (var hx = 0; hx < hue.width; hx += 2) {
    var rgb2 = hsvtorgb(hx / hue.width * 360, 1, 1);
    hg.fillStyle = rgb2hex(rgb2[0], rgb2[1], rgb2[2]);
    hg.fillRect(hx, 0, 2, hue.height);
  }
}

function refreshbrushinfo() {
  if (!spstate) return;
  var el = spstate.root;
  if (!el) return;
  var s = el.querySelector("#spin-size");
  var o = el.querySelector("#spin-op");
  var sc = el.querySelector("#spin-scat");
  if (s) s.value = spstate.brushsize;
  if (o) o.value = spstate.brushop;
  if (sc) sc.value = spstate.scatter;
  var info = el.querySelector("#sppaintinfo");
  if (info) info.textContent = "Layer " + (spstate.layer + 1) + " · " + Math.round(spstate.brushsize) + " px · " + spstate.brushop + "%";
}

function activelayer() {
  if (!spstate) return null;
  return spstate.layers[spstate.layer] || spstate.layers[0];
}

function uselayer(i) {
  if (!spstate) return;
  spstate.layer = Math.max(0, Math.min(spstate.layers.length - 1, i));
  var l = activelayer();
  spstate.g = l.canvas.getContext("2d");
  spstate.g.imageSmoothingEnabled = false;
  refreshlayers();
  redrawsprite();
  refreshbrushinfo();
}

function splayeract(act, ev) {
  if (!spstate) return;
  var i = spstate.layer;
  var w = spstate.w;
  var h = spstate.h;
  if (act === "addlayer") {
    var nl = { name: "Layer " + (spstate.layers.length + 1), visible: true, opacity: 1, canvas: cvw(w, h) };
    spstate.layers.push(nl);
    uselayer(spstate.layers.length - 1);
    pushspriteundo();
    toast("Layer added", "ok");
  } else if (act === "duplayer") {
    var src = activelayer();
    var cp = cvw(w, h);
    cp.getContext("2d").drawImage(src.canvas, 0, 0);
    spstate.layers.splice(i + 1, 0, { name: src.name + " copy", visible: true, opacity: src.opacity === undefined ? 1 : src.opacity, canvas: cp });
    uselayer(i + 1);
    pushspriteundo();
    toast("Layer duplicated", "ok");
  } else if (act === "mergedown") {
    if (i === 0) {
      toast("No layer below", "warn");
      return;
    }
    var upper = spstate.layers[i];
    var lower = spstate.layers[i - 1];
    var lg = lower.canvas.getContext("2d");
    lg.globalAlpha = upper.opacity === undefined ? 1 : upper.opacity;
    lg.drawImage(upper.canvas, 0, 0);
    lg.globalAlpha = 1;
    spstate.layers.splice(i, 1);
    uselayer(i - 1);
    pushspriteundo();
    toast("Merged down", "ok");
  } else if (act === "clearlayer") {
    var cg = activelayer().canvas.getContext("2d");
    cg.clearRect(0, 0, w, h);
    redrawsprite();
    pushspriteundo();
    toast("Layer cleared", "ok");
  } else if (act === "dellayer") {
    if (spstate.layers.length < 2) {
      toast("Cannot delete the only layer", "warn");
      return;
    }
    spstate.layers.splice(i, 1);
    uselayer(Math.min(i, spstate.layers.length - 1));
    pushspriteundo();
    toast("Layer deleted", "ok");
  } else {
    openmenu([{ label: "Add layer", icon: "plus", act: "addlayer" }, { label: "Duplicate layer", icon: "duplicate", act: "duplayer" }, { label: "Merge down", icon: "layers", act: "mergedown" }, { label: "Clear layer", icon: "eraser", act: "clearlayer" }, { sep: true }, { label: "Delete layer", icon: "trash", act: "dellayer" }], ev.clientX, ev.clientY, {
      onact: function (name) {
        splayeract(name, ev);
      }
    });
  }
}

function refreshlayers() {
  if (!spstate) return;
  var el = spstate.root;
  if (!el) return;
  var host = el.querySelector("#splayerlist");
  if (!host) return;
  var html = "";
  for (var i = spstate.layers.length - 1; i >= 0; i--) {
    var l = spstate.layers[i];
    var op = Math.round((l.opacity === undefined ? 1 : l.opacity) * 100);
    html += '<div class="layerrow' + (i === spstate.layer ? " on" : "") + '" data-sact="picklayer" data-index="' + i + '">' +
      '<button class="eye' + (l.visible ? "" : " off") + '" data-sact="layervis" data-index="' + i + '" title="Show / hide">' + ic(l.visible ? "eye" : "eyeoff", "ico-xs") + "</button>" +
      '<span class="lname">' + esc(l.name) + "</span>" +
      '<input class="inp lop" type="range" min="0" max="100" step="1" value="' + op + '" data-sop="' + i + '">' +
      "</div>";
  }
  host.innerHTML = html;
  host.querySelectorAll("[data-sop]").forEach(function (r) {
    r.addEventListener("pointerdown", function (ev2) {
      ev2.stopPropagation();
    });
    r.addEventListener("input", function () {
      var li = +r.getAttribute("data-sop");
      spstate.layers[li].opacity = (+r.value) / 100;
      redrawsprite();
    });
    r.addEventListener("change", function () {
      pushspriteundo();
    });
  });
}

function fitcanvas() {
  if (!spstate) return;
  var el = spstate.root;
  var area = el.querySelector("#sparea");
  var border = el.querySelector("#spborder");
  var ar = area.getBoundingClientRect();
  if (spstate.fit) {
    var fit = Math.min((ar.width - 80) / spstate.w, (ar.height - 80) / spstate.h);
    spstate.zoom = Math.max(0.1, fit);
  }
  var scale = spstate.zoom;
  spstate.canvas.style.width = Math.round(spstate.w * scale) + "px";
  spstate.canvas.style.height = Math.round(spstate.h * scale) + "px";
  border.style.width = Math.round(spstate.w * scale) + "px";
  border.style.height = Math.round(spstate.h * scale) + "px";
  var lbl = el.querySelector("#spzoomlabel");
  if (lbl) lbl.textContent = Math.round(spstate.zoom * 100) + "%";
  var rot = el.querySelector("#sprotation");
  if (rot) rot.value = spstate.rot;
}

function submitsprite() {
  if (!spstate) return;
  var url = spstate.canvas.toDataURL("image/png");
  var count = 0;
  app.project.assets.forEach(function (a) {
    if (a.name.indexOf("Sprite") === 0) count++;
  });
  var name = "Sprite " + (app.spritecount = (app.spritecount || 0) + 1);
  var asset = { id: newid("a"), name: name, type: "image", data: url, w: spstate.w, h: spstate.h };
  app.project.assets.push(asset);
  spriteinfo["custom:" + asset.id] = { name: name, w: spstate.w, h: spstate.h, depth: 0.2, side: "#c8ccd4", mode: "billboard", custom: true };
  saveprojects();
  refreshall();
  toast("Sprite submitted to Files", "ok");
}
