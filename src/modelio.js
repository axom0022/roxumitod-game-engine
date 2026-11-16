var meshcolors = ["#c9ced6", "#9aa2ad", "#c08a54", "#67c95c", "#c25c46", "#4fb6e8", "#e8d59b", "#b9884e"];

function meshnew() {
  return { pos: [], idx: [], color: meshcolors[0] };
}

function meshcenter(parts) {
  var minx = 1e9, miny = 1e9, minz = 1e9, maxx = -1e9, maxy = -1e9, maxz = -1e9;
  parts.forEach(function (p) {
    for (var i = 0; i < p.pos.length; i += 3) {
      minx = Math.min(minx, p.pos[i]);
      maxx = Math.max(maxx, p.pos[i]);
      miny = Math.min(miny, p.pos[i + 1]);
      maxy = Math.max(maxy, p.pos[i + 1]);
      minz = Math.min(minz, p.pos[i + 2]);
      maxz = Math.max(maxz, p.pos[i + 2]);
    }
  });
  if (minx > maxx) return { size: [1, 1, 1], center: [0, 0, 0] };
  return { size: [maxx - minx, maxy - miny, maxz - minz], center: [(minx + maxx) / 2, (miny + maxy) / 2, (minz + maxz) / 2], miny: miny };
}

function meshnormalize(parts) {
  var info = meshcenter(parts);
  var scale = 2 / Math.max(0.001, Math.max(info.size[0], Math.max(info.size[1], info.size[2])));
  parts.forEach(function (p) {
    for (var i = 0; i < p.pos.length; i += 3) {
      p.pos[i] = Math.round((p.pos[i] - info.center[0]) * scale * 1000) / 1000;
      p.pos[i + 1] = Math.round((p.pos[i + 1] - info.center[1]) * scale * 1000) / 1000;
      p.pos[i + 2] = Math.round((p.pos[i + 2] - info.center[2]) * scale * 1000) / 1000;
    }
  });
  return { size: info.size, scale: scale };
}

function meshtrim(parts, max) {
  var total = 0;
  var out = [];
  parts.forEach(function (p) {
    if (total >= max) return;
    var tris = Math.floor(p.idx.length / 3);
    var keep = Math.min(tris, max - total);
    if (keep <= 0) return;
    var part = { pos: p.pos, idx: p.idx.slice(0, keep * 3), color: p.color };
    out.push(part);
    total += keep;
  });
  return out;
}

function parseobj(text) {
  var verts = [];
  var groups = {};
  var order = [];
  var cur = "default";
  var matcolors = {};
  var lines = text.split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) === "#") continue;
    var sp = line.split(/\s+/);
    if (sp[0] === "v") {
      verts.push([parseFloat(sp[1]) || 0, parseFloat(sp[2]) || 0, parseFloat(sp[3]) || 0]);
    } else if (sp[0] === "usemtl") {
      cur = sp.slice(1).join(" ") || "default";
    } else if (sp[0] === "mtllib") {
      continue;
    } else if (sp[0] === "f") {
      var face = [];
      for (var k = 1; k < sp.length; k++) {
        var idx = parseInt(sp[k].split("/")[0], 10);
        if (isNaN(idx)) continue;
        face.push(idx > 0 ? idx - 1 : verts.length + idx);
      }
      if (face.length < 3) continue;
      if (!groups[cur]) {
        groups[cur] = meshnew();
        order.push(cur);
      }
      var g = groups[cur];
      for (var t = 1; t < face.length - 1; t++) {
        var base = g.pos.length / 3;
        [face[0], face[t], face[t + 1]].forEach(function (vi) {
          var v = verts[vi] || [0, 0, 0];
          g.pos.push(v[0], v[1], v[2]);
        });
        g.idx.push(base, base + 1, base + 2);
      }
    } else if (sp[0] === "g" || sp[0] === "o") {
      cur = sp.slice(1).join(" ") || "default";
    }
  }
  var parts = order.map(function (key, i) {
    return { pos: groups[key].pos, idx: groups[key].idx, color: matcolors[key] || meshcolors[i % meshcolors.length] };
  });
  if (!parts.length && verts.length) {
    var solo = meshnew();
    solo.pos = verts.reduce(function (acc, v) {
      return acc.concat(v);
    }, []);
    for (var q = 0; q + 2 < verts.length; q += 3) solo.idx.push(q, q + 1, q + 2);
    parts.push(solo);
  }
  return parts;
}

function parsegltfjson(gltf, bin) {
  var parts = [];
  function accessor(index) {
    var acc = gltf.accessors[index];
    var bufview = gltf.bufferViews[acc.bufferView];
    var buffer = bin ? bin : null;
    if (!buffer) return null;
    var compsize = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[acc.componentType] || 4;
    var count = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type] || 3;
    var offset = (bufview.byteOffset || 0) + (acc.byteOffset || 0);
    var stride = bufview.byteStride || compsize * count;
    var out = new Float32Array(acc.count * count);
    var dv = new DataView(buffer);
    for (var i = 0; i < acc.count; i++) {
      for (var c = 0; c < count; c++) {
        var o = offset + i * stride + c * compsize;
        var v = 0;
        if (acc.componentType === 5126) v = dv.getFloat32(o, true);
        else if (acc.componentType === 5125) v = dv.getUint32(o, true);
        else if (acc.componentType === 5123) v = dv.getUint16(o, true);
        else if (acc.componentType === 5121) v = dv.getUint8(o);
        else if (acc.componentType === 5122) v = dv.getInt16(o, true);
        out[i * count + c] = v;
      }
    }
    return out;
  }
  (gltf.meshes || []).forEach(function (mesh, mi) {
    (mesh.primitives || []).forEach(function (prim) {
      if (prim.attributes == null || prim.attributes.POSITION === undefined) return;
      var posarr = accessor(prim.attributes.POSITION);
      if (!posarr) return;
      var color = meshcolors[mi % meshcolors.length];
      if (prim.material !== undefined && gltf.materials && gltf.materials[prim.material]) {
        var pbr = gltf.materials[prim.material].pbrMetallicRoughness || {};
        if (pbr.baseColorFactor) {
          color = "#" + pbr.baseColorFactor.slice(0, 3).map(function (c) {
            return ("0" + Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16)).slice(-2);
          }).join("");
        }
      }
      var part = { pos: Array.prototype.slice.call(posarr), idx: [], color: color };
      if (prim.indices !== undefined) {
        var idxarr = accessor(prim.indices);
        if (idxarr) part.idx = Array.prototype.slice.call(idxarr);
      }
      if (!part.idx.length) {
        for (var i = 0; i < part.pos.length / 3; i++) part.idx.push(i);
      }
      if (part.idx.length >= 3) parts.push(part);
    });
  });
  return parts;
}

function parseglb(buffer) {
  var dv = new DataView(buffer);
  if (dv.getUint32(0, true) !== 0x46546c67) return null;
  var len = dv.getUint32(12, true);
  var json = JSON.parse(new TextDecoder("utf-8").decode(new Uint8Array(buffer, 20, len)));
  var bin = null;
  var off = 20 + len;
  if (off + 8 <= buffer.byteLength) {
    var blen = dv.getUint32(off, true);
    var btype = dv.getUint32(off + 4, true);
    if (btype === 0x004e4942) bin = buffer.slice(off + 8, off + 8 + blen);
  }
  if (!bin && json.buffers && json.buffers[0] && json.buffers[0].uri && json.buffers[0].uri.indexOf("data:") === 0) {
    var b64 = json.buffers[0].uri.split(",")[1];
    var raw = atob(b64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    bin = arr.buffer;
  }
  return { json: json, bin: bin };
}

function parsefbx(text) {
  var verts = [];
  var polys = [];
  var m = text.match(/Vertices:\s*\*(\d+)\s*\{([^}]*)\}/);
  if (m) {
    var vals = m[2].split(",").map(function (s) {
      return parseFloat(s);
    });
    for (var i = 0; i + 2 < vals.length; i += 3) verts.push([vals[i], vals[i + 1], vals[i + 2]]);
  }
  var pi = text.match(/PolygonVertexIndex:\s*\*(\d+)\s*\{([^}]*)\}/);
  if (pi) {
    var idxs = pi[2].split(",").map(function (s) {
      return parseInt(s, 10);
    });
    var face = [];
    idxs.forEach(function (v) {
      if (v < 0) {
        face.push(-v - 1);
        polys.push(face);
        face = [];
      } else {
        face.push(v);
      }
    });
  }
  if (!verts.length || !polys.length) return [];
  var part = { pos: verts.reduce(function (acc, v) {
    return acc.concat(v);
  }, []), idx: [], color: meshcolors[1] };
  for (var i2 = 0; i2 < polys.length; i2++) {
    var f = polys[i2];
    for (var t = 1; t < f.length - 1; t++) part.idx.push(f[0], f[t], f[t + 1]);
  }
  return [part];
}

function parsestl(buffer, text) {
  var part = { pos: [], idx: [], color: meshcolors[3] };
  if (text && /facet\s+normal/i.test(text.slice(0, 400))) {
    var vs = text.match(/vertex\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)/g) || [];
    vs.forEach(function (line) {
      var p = line.split(/\s+/);
      part.pos.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]));
    });
    for (var i = 0; i < part.pos.length / 3; i++) part.idx.push(i);
  } else if (buffer) {
    var dv = new DataView(buffer);
    var count = dv.getUint32(80, true);
    var off = 84;
    for (var t = 0; t < count; t++) {
      off += 12;
      for (var v = 0; v < 3; v++) {
        part.pos.push(dv.getFloat32(off, true), dv.getFloat32(off + 4, true), dv.getFloat32(off + 8, true));
        off += 12;
      }
      off += 2;
      var base = (part.pos.length / 3) - 3;
      part.idx.push(base, base + 1, base + 2);
    }
  }
  return part.idx.length ? [part] : [];
}

function modelparse(name, text, buffer) {
  var ext = String(name).toLowerCase().split(".").pop();
  var parts = [];
  try {
    if (ext === "obj") parts = parseobj(text || "");
    else if (ext === "gltf") {
      var gltf = JSON.parse(text);
      var binb = null;
      if (gltf.buffers && gltf.buffers[0] && gltf.buffers[0].uri && gltf.buffers[0].uri.indexOf("data:") === 0) {
        var raw = atob(gltf.buffers[0].uri.split(",")[1]);
        var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        binb = arr.buffer;
      }
      parts = parsegltfjson(gltf, binb);
    } else if (ext === "glb") {
      var gl = parseglb(buffer);
      if (gl) parts = parsegltfjson(gl.json, gl.bin);
    } else if (ext === "fbx") parts = parsefbx(text || "");
    else if (ext === "stl") parts = parsestl(buffer, text || "");
  } catch (e) {
    return null;
  }
  if (!parts.length) return null;
  parts = meshtrim(parts, 9000);
  var info = meshnormalize(parts);
  return { parts: parts, size: info.size, tris: parts.reduce(function (acc, p) {
    return acc + p.idx.length / 3;
  }, 0) };
}

function modeladd(name, parsed) {
  app.project.models = app.project.models || [];
  var id = newid("md");
  var entry = { id: id, name: name.replace(/\.[^.]+$/, ""), ext: name.split(".").pop().toLowerCase(), parts: parsed.parts, tris: parsed.tris, size: parsed.size };
  app.project.models.push(entry);
  return entry;
}

function modelnode(entry) {
  var node = basenode("model", { name: entry.name, pos: [0, 1, 0] });
  node.comps = ["model"];
  node.model = entry.id;
  node.color = "#ffffff";
  return node;
}

function modelbyid(id) {
  var out = null;
  (app.project.models || []).forEach(function (m) {
    if (m.id === id) out = m;
  });
  return out;
}

function modelimportdialog() {
  var body = '<div class="hintline">Import a 3D model. Supported: Wavefront OBJ, glTF 2.0 (.gltf / .glb), ASCII FBX and STL. Meshes are converted to engine geometry and stored in the project.</div>';
  body += '<div class="dropzone" id="modeldrop"><input type="file" id="modelfile" accept=".obj,.gltf,.glb,.fbx,.stl" style="display:none"><div class="dzico">' + ic("upload", "ico-xl") + '</div><div class="dzt">Drop a model here or click to browse</div><div class="dzs">.obj · .gltf · .glb · .fbx · .stl</div></div>';
  body += '<div class="pickgroup">Imported models</div><div id="modellist">' + modellisthtml() + "</div>";
  var ref = openmodal({
    title: "Import 3D model",
    icon: "import",
    body: body,
    onmount: function (modal, scrim) {
      var dz = modal.querySelector("#modeldrop");
      var input = modal.querySelector("#modelfile");
      dz.addEventListener("click", function () {
        input.click();
      });
      dz.addEventListener("dragover", function (ev) {
        ev.preventDefault();
        dz.classList.add("over");
      });
      dz.addEventListener("dragleave", function () {
        dz.classList.remove("over");
      });
      dz.addEventListener("drop", function (ev) {
        ev.preventDefault();
        dz.classList.remove("over");
        var files = Array.from(ev.dataTransfer.files || []);
        files.forEach(function (f) {
          fileread(f);
        });
      });
      input.addEventListener("change", function () {
        Array.from(input.files || []).forEach(function (f) {
          fileread(f);
        });
      });
      function fileread(file) {
        var reader = new FileReader();
        var binary = /\.(glb|stl)$/i.test(file.name);
        reader.onload = function () {
          var parsed = modelparse(file.name, binary ? null : reader.result, binary ? reader.result : null);
          if (!parsed) {
            toast("Could not read " + file.name, "warn");
            return;
          }
          var entry = modeladd(file.name, parsed);
          var held = modal.querySelector("#modellist");
          if (held) held.innerHTML = modellisthtml();
          var list = tilebyid;
          toast(entry.name + " · " + entry.tris + " tris imported", "ok");
          if (app.modelimportcb) {
            app.modelimportcb(entry);
            app.modelimportcb = null;
          }
          commit("modelimport");
          renderdock();
        };
        if (binary) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
      }
    },
    footer: '<button class="btn" data-mact="close2">Done</button>',
    actions: {
      close2: function (m, s) {
        closemodal(s);
        commit("modelimport");
      }
    }
  });
}

function modellisthtml() {
  var out = "";
  if (!(app.project.models || []).length) return '<div class="emptyhint">No imported models yet.</div>';
  (app.project.models || []).forEach(function (m) {
    out += '<div class="gvarrow"><span class="axis y">3D</span><span class="nm">' + esc(m.name) + "</span><span class=\"dim tiny\">" + m.tris + " tris</span><button class=\"btn sm\" data-act=\"addmodelnode\" data-key=\"" + m.id + '">' + ic("plus", "ico-xs") + 'Add</button><button class="iconbtn" data-act="delmodel" data-key="' + m.id + '">' + ic("trash", "ico-xs") + "</button></div>";
  });
  return out;
}

acts.importmodel = function () {
  modelimportdialog();
};

acts.addmodelnode = function (el) {
  var entry = modelbyid(el.getAttribute("data-key"));
  if (!entry) return;
  var node = modelnode(entry);
  node.name = uniqueid(app.scene.objects, entry.name);
  node.pos = [Math.round(app.cam.target[0] * 10) / 10, Math.round(app.cam.target[1] * 10) / 10, 0];
  app.scene.objects.push(node);
  app.selid = node.id;
  app.selids = [node.id];
  commit("addmodel");
  toast(entry.name + " added", "ok");
};

acts.delmodel = function (el) {
  var id = el.getAttribute("data-key");
  app.project.models = (app.project.models || []).filter(function (m) {
    return m.id !== id;
  });
  commit("delmodel");
  var m = closestmodal();
  if (m) {
    var host = m.querySelector("#modellist");
    if (host) host.innerHTML = modellisthtml();
  }
};

acts.navmesh = function () {
  var nm = app.project.navmesh || (app.project.navmesh = { cell: 0.5, slope: 45, step: 0.4, agent: 0.4, links: true, baked: false });
  var body = '<div class="evtform">';
  body += '<div class="frow"><div class="flabel">Cell size</div><div class="fctrl"><input class="inp num" type="number" step="0.1" value="' + nm.cell + '" data-nmfield="cell"></div></div>';
  body += '<div class="frow"><div class="flabel">Steepest slope</div><div class="fctrl"><input class="inp num" type="number" value="' + nm.slope + '" data-nmfield="slope"><span class="dim tiny">deg</span></div></div>';
  body += '<div class="frow"><div class="flabel">Step height</div><div class="fctrl"><input class="inp num" type="number" step="0.1" value="' + nm.step + '" data-nmfield="step"></div></div>';
  body += '<div class="frow"><div class="flabel">Agent radius</div><div class="fctrl"><input class="inp num" type="number" step="0.1" value="' + nm.agent + '" data-nmfield="agent"></div></div>';
  body += '<div class="frow"><div class="flabel">Nav links</div><div class="fctrl">' + check("Allow off-mesh links", nm.links !== false, 'data-nmfield="links"') + "</div></div>";
  body += "</div>";
  body += '<div class="hintline">Baking samples the static colliders of the scene on a grid. Enable the navmesh overlay to inspect the result and add Nav link objects to connect islands.</div>';
  body += '<div class="row" style="gap:6px;padding:8px 0">' + check("Show navmesh overlay", !!app.shownav, 'data-act="togglenavoverlay"') + "</div>";
  openmodal({
    title: "Navmesh",
    icon: "target",
    body: body,
    onmount: function (modal) {
      modal.addEventListener("change", function (ev) {
        var f = ev.target.getAttribute("data-nmfield");
        if (!f) return;
        nm[f] = ev.target.type === "checkbox" ? ev.target.checked : parseFloat(ev.target.value) || 0;
        commit("navmesh");
      });
    },
    footer: '<button class="btn" data-mact="cancel">Close</button><button class="btn primary" data-mact="bake">' + ic("sparkle", "ico-sm") + 'Bake navmesh</button>',
    actions: {
      cancel: function (m, s) {
        closemodal(s);
      },
      bake: function (m, s) {
        physreset();
        var grid = navreset();
        nm.baked = !!grid;
        app.shownav = true;
        commit("navbake");
        closemodal(s);
        toast(grid ? "Navmesh baked: " + phys.cols + " × " + phys.rows + " cells" : "No static colliders to bake", grid ? "ok" : "warn");
      }
    }
  });
};

acts.togglenavoverlay = function (el) {
  app.shownav = !app.shownav;
  if (app.shownav) {
    physreset();
    navreset();
  }
  var cb = el.querySelector ? el.querySelector('input[type="checkbox"]') : null;
  if (cb) cb.checked = app.shownav;
  toast(app.shownav ? "Navmesh overlay on" : "Navmesh overlay off", "ok");
};

acts.togglecolliders = function () {
  app.showcolliders = !app.showcolliders;
  toast(app.showcolliders ? "Collider overlay on ▦" : "Collider overlay off", "ok");
};

function modelitems(node, items, world, picks) {
  var entry = modelbyid(node.model);
  if (!entry) return;
  var parts = entry.parts || [];
  parts.forEach(function (p, i) {
    items.push({
      id: node.id + "p" + i,
      kind: "box",
      matrix: world,
      color: node.color && node.color !== "#ffffff" ? node.color : p.color || "#cfd4dc",
      opacity: node.opacity === undefined ? 1 : node.opacity,
      unlit: false,
      texid: "",
      texture: null,
      geokey: node.id + "p" + i + "v" + (node.modelver || 1),
      geo: p
    });
  });
  var b = matrixbounds(world, [1, 1, 1]);
  picks.push({ id: node.id, node: node, min: b.min, max: b.max });
}

function navoverlay(g, cs, w, h) {
  if (!app.shownav || app.play) return;
  if (!phys.grid) navreset();
  if (!phys.grid) return;
  var m = cameramatrices(cs, w, h);
  var cells = phys.grid.cells;
  g.fillStyle = "rgba(80,220,160,0.16)";
  g.strokeStyle = "rgba(80,220,160,0.55)";
  g.lineWidth = 1;
  var half = phys.cell / 2;
  for (var r = 0; r < phys.rows; r++) {
    for (var c = 0; c < phys.cols; c++) {
      if (!cells[r * phys.cols + c]) continue;
      var x = phys.min[0] + c * phys.cell + half;
      var z = phys.min[2] + r * phys.cell + half;
      var y = phys.tops ? phys.tops[r * phys.cols + c] + 0.045 : 0;
      var pts = [
        [x - half, y, z - half],
        [x + half, y, z - half],
        [x + half, y, z + half],
        [x - half, y, z + half]
      ].map(function (p) {
        return projectpoint(m.vp, p, w, h);
      });
      if (!pts.every(function (p) {
        return !!p;
      })) continue;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.fill();
      g.stroke();
    }
  }
  walk(app.scene.objects || [], function (n) {
    if (!hascomp(n, "navlink")) return;
    var tname = (n.compdata.navlink && n.compdata.navlink.target) || "";
    var other = null;
    walk(app.scene.objects || [], function (o) {
      if (!other && o.name === tname) other = o;
    });
    if (!other) return;
    var a = projectpoint(m.vp, n.pos, w, h);
    var b = projectpoint(m.vp, other.pos, w, h);
    if (!a || !b) return;
    g.strokeStyle = "rgba(255,200,80,0.9)";
    g.setLineDash([5, 4]);
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.stroke();
    g.setLineDash([]);
  });
}

function collideroverlay(g, cs, w, h) {
  if (!app.showcolliders || app.play) return;
  if (!physreset.ready) physreset();
  var m = cameramatrices(cs, w, h);
  phys.bodies.forEach(function (b) {
    var p = [b.node.pos[0], b.node.pos[1], b.node.pos[2]];
    var box = {
      min: [p[0] - b.hw, p[1] - b.hh, p[2] - b.hd],
      max: [p[0] + b.hw, p[1] + b.hh, p[2] + b.hd]
    };
    var corners = boxcorners(box.min, box.max);
    var pts = corners.map(function (c) {
      return projectpoint(m.vp, c, w, h);
    });
    if (!pts.every(function (q) {
      return !!q;
    })) return;
    g.strokeStyle = b.trigger ? "rgba(120,220,255,0.9)" : b.static ? "rgba(140,200,255,0.75)" : "rgba(255,180,60,0.95)";
    g.lineWidth = 1.2;
    g.setLineDash(b.static ? [4, 3] : []);
    [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (ed) {
      g.beginPath();
      g.moveTo(pts[ed[0]][0], pts[ed[0]][1]);
      g.lineTo(pts[ed[1]][0], pts[ed[1]][1]);
      g.stroke();
    });
    g.setLineDash([]);
  });
}
