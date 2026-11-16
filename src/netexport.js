function netruntime() {
  var net = { on: false, role: "", room: "", name: "Player", peer: null, conn: null, peers: {}, remotes: [], ping: 0, mine: "", last: 0, since: 0, pingat: 0, ui: null, list: null, status: null, full: false, chat: [] };

  function netel(tag, css, text) {
    var d = document.createElement(tag);
    if (css) d.setAttribute("style", css);
    if (text) d.textContent = text;
    return d;
  }

  function netload(done) {
    if (window.Peer) {
      done("");
      return;
    }
    var urls = ["https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js", "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"];
    var i = 0;
    function next() {
      if (window.Peer) {
        done("");
        return;
      }
      if (i >= urls.length) {
        done("PeerJS could not be loaded");
        return;
      }
      var sc = document.createElement("script");
      sc.src = urls[i++];
      sc.onload = next;
      sc.onerror = next;
      document.head.appendChild(sc);
    }
    next();
  }

  function netrand(n) {
    var s = "";
    var a = "abcdefghjkmnpqrstuvwxyz23456789";
    for (var i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length));
    return s;
  }

  function netcode(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  }

  function netui() {
    if (net.ui) return;
    var css = "position:fixed;right:14px;bottom:14px;z-index:20;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#eaf0f7";
    var wrap = netel("div", css);
    var btn = netel("button", "border:0;border-radius:10px;padding:9px 13px;font-weight:700;font-size:13px;background:rgba(16,20,26,.72);color:#dfe8f5;cursor:pointer;backdrop-filter:blur(6px);box-shadow:0 6px 22px rgba(0,0,0,.35)", "Co-op");
    var panel = netel("div", "display:none;margin-top:8px;width:250px;background:rgba(14,18,24,.94);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:12px;font-size:12.5px;box-shadow:0 18px 48px rgba(0,0,0,.5)");
    var title = netel("div", "font-weight:800;font-size:12px;letter-spacing:.4px;text-transform:uppercase;color:#8fb7e8;margin-bottom:8px", "Online Subsystem");
    var nameinput = netel("input", "width:100%;box-sizing:border-box;margin-bottom:6px;padding:7px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#0d1116;color:#eaf0f7;font-size:12.5px");
    nameinput.placeholder = "Player name";
    nameinput.value = net.name;
    var roominput = netel("input", "width:100%;box-sizing:border-box;margin-bottom:8px;padding:7px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#0d1116;color:#eaf0f7;font-size:12.5px");
    roominput.placeholder = "Room code";
    roominput.value = netrand(5);
    var hostbtn = netel("button", "width:100%;margin-bottom:6px;padding:8px;border:0;border-radius:8px;background:#2f6fd0;color:#fff;font-weight:700;font-size:12.5px;cursor:pointer", "Host session");
    var joinbtn = netel("button", "width:100%;margin-bottom:6px;padding:8px;border:0;border-radius:8px;background:rgba(255,255,255,.08);color:#dfe8f5;font-weight:700;font-size:12.5px;cursor:pointer", "Join session");
    var leavebtn = netel("button", "display:none;width:100%;margin-bottom:6px;padding:8px;border:0;border-radius:8px;background:rgba(255,93,143,.18);color:#ffb3c9;font-weight:700;font-size:12.5px;cursor:pointer", "Leave session");
    var status = netel("div", "color:#93a3b8;font-size:11.5px;line-height:1.5;margin-bottom:6px", "Offline · peer to peer");
    var list = netel("div", "border-top:1px solid rgba(255,255,255,.08);padding-top:7px;font-size:12px;color:#cfd9e6");
    panel.appendChild(title);
    panel.appendChild(nameinput);
    panel.appendChild(roominput);
    panel.appendChild(hostbtn);
    panel.appendChild(joinbtn);
    panel.appendChild(leavebtn);
    panel.appendChild(status);
    panel.appendChild(list);
    wrap.appendChild(btn);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);
    btn.addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
    nameinput.addEventListener("input", function () {
      net.name = nameinput.value.slice(0, 16) || "Player";
    });
    hostbtn.addEventListener("click", function () {
      netopen("host", roominput.value, nameinput.value);
    });
    joinbtn.addEventListener("click", function () {
      netopen("client", roominput.value, nameinput.value);
    });
    leavebtn.addEventListener("click", function () {
      netclose();
    });
    net.ui = panel;
    net.list = list;
    net.status = status;
    net.hostbtn = hostbtn;
    net.joinbtn = joinbtn;
    net.leavebtn = leavebtn;
    net.nameinput = nameinput;
    net.roominput = roominput;
    net.panel = panel;
  }

  function netpaint() {
    if (!net.list) return;
    var rows = "";
    if (net.on) {
      var players = [];
      if (net.role === "host") {
        players.push(net.name + " (host)");
        for (var k in net.peers) players.push(net.peers[k].name);
      } else {
        for (var i = 0; i < net.remotes.length; i++) players.push(net.remotes[i].name);
        players.push(net.name + " (you)");
      }
      for (var j = 0; j < players.length; j++) rows += "<div style='padding:2px 0'>• " + players[j] + "</div>";
    } else {
      rows = "<div style='color:#7d8798'>No players connected.</div>";
    }
    net.list.innerHTML = rows;
    net.status.textContent = net.on ? (net.role === "host" ? "Hosting " : "Connected ") + net.room + " · " + net.ping + " ms" : "Offline · peer to peer";
    net.hostbtn.style.display = net.on ? "none" : "block";
    net.joinbtn.style.display = net.on ? "none" : "block";
    net.leavebtn.style.display = net.on ? "block" : "none";
  }

  function netsend(msg) {
    var c = net.role === "host" ? Object.keys(net.peers) : null;
    if (net.role === "host") {
      if (net.peer && net.peer.connections) {
        var all = net.peer.connections;
        for (var k in all) {
          var arr = all[k];
          for (var i = 0; i < arr.length; i++) {
            try {
              if (arr[i].open) arr[i].send(msg);
            } catch (e) {}
          }
        }
      }
      return;
    }
    try {
      if (net.conn && net.conn.open) net.conn.send(msg);
    } catch (e) {}
  }

  function netopen(role, room, name) {
    netload(function (err) {
      if (err) {
        netui();
        net.status.textContent = err;
        return;
      }
      room = netcode(room) || netrand(5);
      net.role = role;
      net.room = room;
      net.name = String(name || "Player").slice(0, 16);
      net.remotes = [];
      net.peers = {};
      net.on = true;
      var id = role === "host" ? "unx" + room + "h" : "unx" + netrand(6) + Math.floor(Math.random() * 900 + 100);
      var peer = new Peer(id, { debug: 0 });
      net.peer = peer;
      peer.on("error", function (e) {
        net.status.textContent = "Peer error: " + ((e && e.type) || "unknown");
        netfull(false);
      });
      peer.on("connection", function (conn) {
        conn.on("open", function () {
          if (role !== "host") return;
          netpeerslot(conn);
        });
        conn.on("data", function (d) {
          netrecv(d, conn);
        });
        conn.on("close", function () {
          netdrop(conn.peer);
        });
        conn.on("error", function () {
          netdrop(conn.peer);
        });
      });
      if (role === "client") {
        peer.on("open", function () {
          var conn = peer.connect("unx" + room + "h", { reliable: false, serialization: "json" });
          net.conn = conn;
          conn.on("open", function () {
            conn.send({ t: "join", n: net.name });
          });
          conn.on("data", function (d) {
            netrecv(d, conn);
          });
          conn.on("close", function () {
            net.on = false;
            netpaint();
          });
        });
      }
      netpaint();
    });
  }

  function netpeerslot(conn) {
    net.status.textContent = "Peer connected";
  }

  function netdrop(peerid) {
    delete net.peers[peerid];
    net.remotes = net.remotes.filter(function (r) {
      return r.peer !== peerid;
    });
    netpaint();
  }

  function netrecv(d, conn) {
    if (!d || !d.t) return;
    if (d.t === "join") {
      var id = conn.peer.slice(-6);
      net.peers[conn.peer] = { id: id, peer: conn.peer, name: String(d.n || "Player").slice(0, 16), x: 0, y: 1, f: 1 };
      netsend({ t: "welcome", id: id, room: net.room, roster: netroster(), host: net.name });
      netsend({ t: "roster", roster: netroster() });
      netpaint();
      return;
    }
    if (d.t === "welcome") {
      net.mine = d.id;
      netrosterapply(d.roster);
      netpaint();
      return;
    }
    if (d.t === "roster") {
      netrosterapply(d.roster);
      netpaint();
      return;
    }
    if (d.t === "state") {
      var p = net.peers[conn.peer];
      if (p) {
        p.x = d.x;
        p.y = d.y;
        p.f = d.f;
        var rr = netfind(p.id);
        if (!rr) {
          rr = { id: p.id, name: p.name, color: "#4fa3ff", x: d.x, y: d.y, tx: d.x, ty: d.y, f: d.f || 1, tf: d.f || 1 };
          net.remotes.push(rr);
        }
        rr.tx = d.x;
        rr.ty = d.y;
        rr.tf = d.f || 1;
      }
      return;
    }
    if (d.t === "snap") {
      for (var i = 0; i < d.p.length; i++) netapply(d.p[i]);
      return;
    }
    if (d.t === "rpc") {
      if (d.f === "pick") {
        netpick(d.a[0], d.a[1]);
        return;
      }
      if (d.f === "msg" && typeof msg === "function") {
        msg(String(d.a[0] || "") + "<br><small>" + String(d.a[1] || "") + "</small>");
        setTimeout(function () {
          if (g.status === "play") msg("");
        }, 2200);
      }
      return;
    }
    if (d.t === "ping") {
      netsend({ t: "pong", s: d.s });
      return;
    }
    if (d.t === "pong") {
      net.ping = Math.max(1, Math.round(performance.now() - d.s));
      netpaint();
      return;
    }
    if (d.t === "bye") {
      netdrop(conn.peer);
    }
  }

  function netroster() {
    var list = [{ id: "h", n: net.name, c: "#ffb02e" }];
    for (var k in net.peers) list.push({ id: net.peers[k].id, n: net.peers[k].name, c: "#4fa3ff" });
    return list;
  }

  function netfind(id) {
    for (var i = 0; i < net.remotes.length; i++) if (net.remotes[i].id === id) return net.remotes[i];
    return null;
  }

  function netrosterapply(list) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.id === net.mine) continue;
      var found = netfind(r.id);
      if (!found) {
        found = { id: r.id, name: r.n, color: r.c || "#4fa3ff", x: 0, y: 1, tx: 0, ty: 1, f: 1, tf: 1 };
        net.remotes.push(found);
      } else {
        found.name = r.n;
        found.color = r.c || found.color;
      }
    }
    net.remotes = net.remotes.filter(function (x) {
      for (var j = 0; j < list.length; j++) if (list[j].id === x.id) return true;
      return false;
    });
  }

  function netapply(p) {
    if (!p || p[0] === net.mine) return;
    var r = netfind(p[0]);
    if (!r) {
      r = { id: p[0], name: "Player", color: "#4fa3ff", x: p[1], y: p[2], tx: p[1], ty: p[2], f: p[4] || 1, tf: p[4] || 1 };
      net.remotes.push(r);
    }
    r.tx = p[1];
    r.ty = p[2];
    r.tf = p[4] || 1;
  }

  function nettick(dt) {
    if (!net.on) return;
    var now = performance.now();
    net.since += dt;
    if (now - net.pingat > 2000) {
      net.pingat = now;
      netsend({ t: "ping", s: now });
    }
    if (net.since > 0.06) {
      net.since = 0;
      if (net.role === "client") netsend({ t: "state", id: net.mine, x: g.x, y: g.y, f: g.face });
      else {
        var pts = [["h", +g.x.toFixed(3), +g.y.toFixed(3), 0, g.face]];
        for (var k in net.peers) pts.push([net.peers[k].id, +net.peers[k].x.toFixed(3), +net.peers[k].y.toFixed(3), 0, net.peers[k].f || 1]);
        netsend({ t: "snap", p: pts });
      }
    }
    var k2 = Math.min(1, dt * 14);
    for (var i = 0; i < net.remotes.length; i++) {
      var r = net.remotes[i];
      r.x += (r.tx - r.x) * k2;
      r.y += (r.ty - r.y) * k2;
      r.f += (r.tf - r.f) * Math.min(1, dt * 16);
    }
  }

  function netsync(kind, key) {
    if (!net.on || !key) return;
    netsend({ t: "rpc", f: "pick", a: [kind, key] });
  }

  function netpick(kind, key) {
    if (!key) return;
    if (!g.got) g.got = {};
    g.got[key] = 1;
    if (kind === "heart") {
      g.lives = Math.min(9, g.lives + 1);
      if (typeof hud === "function") hud();
    }
  }

  function netgl() {
    if (!glok || !gscn || !glib) return;
    for (var i = 0; i < net.remotes.length; i++) {
      var r = net.remotes[i];
      if (!r.m) {
        try {
          var geo = gboxgeo || new glib.BoxGeometry(1, 1, 1);
          var mat = null;
          if (hero && typeof glmat === "function") mat = glmat({ t: "sprite", s: hero.s || "hero" });
          if (!mat) {
            var stdmat = glib.MeshStandardMaterial || glib.StandardMaterial;
            mat = new stdmat({ color: r.color || "#4fa3ff", roughness: 0.8 });
          }
          r.m = new glib.Mesh(geo, mat);
          r.m.scale.set(0.72, 1.02, 0.3);
          r.m.castShadow = true;
          gscn.add(r.m);
        } catch (err) {}
      }
      if (r.m) {
        r.m.position.set(r.x, r.y, 1.15);
        r.m.visible = true;
      }
    }
  }

  function netdecor() {
    var out = [];
    for (var i = 0; i < net.remotes.length; i++) {
      var r = net.remotes[i];
      out.push({ t: "sprite", s: (hero && hero.s) || "hero", p: [r.x, r.y, 1.15], w: 0.9, h: 1.15, o: 1, q: [0, 0, 0, 0], z: [r.f < 0 ? -1 : 1, 1, 1] });
    }
    return out;
  }

  function netclose() {
    try {
      if (net.peer) net.peer.destroy();
    } catch (e) {}
    net.on = false;
    net.peer = null;
    net.conn = null;
    net.remotes = [];
    net.peers = {};
    netpaint();
  }

  function netstart() {
    netui();
    var q = location.search || "";
    var rm = /room=([a-z0-9]+)/i.exec(q);
    var nm = /name=([^&]+)/i.exec(q);
    if (nm) net.name = decodeURIComponent(nm[1]).slice(0, 16);
    if (rm) {
      if (/host=1/i.test(q)) netopen("host", rm[1], net.name);
      else netopen("client", rm[1], net.name);
    }
    if (rm) net.roominput.value = rm[1];
    net.nameinput.value = net.name;
    net.panel.style.display = rm ? "block" : "none";
    netpaint();
    window.__netdebug = function () {
      return { on: net.on, role: net.role, room: net.room, mine: net.mine, remotes: net.remotes.map(function (r) { return [r.id, r.name, +r.x.toFixed(2), +r.y.toFixed(2)]; }), peers: Object.keys(net.peers).length, ping: net.ping, got: Object.keys(g.got || {}).length, lives: g.lives };
    };
  }

  netstart();
}

function netcode() {
  var s = netruntime.toString();
  s = s.slice(s.indexOf("{") + 1, s.lastIndexOf("}"));
  return s;
}
