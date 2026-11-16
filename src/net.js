var netsys = { on: false, role: "", room: "", me: "", name: "Player", peers: {}, remotes: [], hostconn: null, hostpeer: null, client: null, ping: 0, sent: 0, got: 0, up: 0, down: 0, log: [], loaded: "", error: "", max: 8, tick: 0, name2: "", chat: [] };

function netrand(n) {
  var s = "";
  var a = "abcdefghjkmnpqrstuvwxyz23456789";
  for (var i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
}

function netclean(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

function netaddr() {
  return "https://0.peerjs.com";
}

function netload(cb) {
  if (window.Peer) {
    netsys.loaded = "peerjs";
    cb("");
    return;
  }
  var urls = ["https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js", "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", "vendor/peerjs.min.js"];
  var i = 0;
  function next() {
    if (window.Peer) {
      netsys.loaded = "peerjs";
      cb("");
      return;
    }
    if (i >= urls.length) {
      cb("PeerJS could not be loaded. Check the connection and try again.");
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

function netunique() {
  return "unx" + netrand(6) + Math.floor(Math.random() * 900 + 100);
}

function netopen(role, room, name, cb) {
  netclose(true);
  netload(function (err) {
    if (err) {
      netsys.error = err;
      if (cb) cb(err);
      return;
    }
    room = netclean(room) || netrand(5);
    netsys.role = role;
    netsys.room = room;
    netsys.name = name || netsys.name || "Player";
    netsys.error = "";
    netsys.on = true;
    netsys.remotes = [];
    netsys.peers = {};
    netsys.chat = [];
    netsys.tick = 0;
    netpublog((role === "host" ? "Hosting session " : "Joining session ") + room);
    var id = role === "host" ? "unx" + room + "h" : netunique();
    var peer = role === "host" ? new Peer(id, { debug: 0 }) : new Peer(id, { debug: 0 });
    netsys.me = id;
    if (role === "host") netsys.hostpeer = peer;
    else netsys.client = peer;
    peer.on("open", function () {
      netpublog("Peer ready as " + id);
      if (cb) cb("");
    });
    peer.on("error", function (e) {
      netsys.error = String((e && e.type) || e);
      netpublog("Peer error: " + netsys.error);
      if (cb && !netsys.opened) cb(netsys.error);
    });
    peer.on("connection", function (conn) {
      if (role !== "host") return;
      if (Object.keys(netsys.peers).length >= netsys.max) {
        conn.on("open", function () {
          conn.send({ t: "reject", m: "Session full" });
          setTimeout(function () {
            conn.close();
          }, 200);
        });
        return;
      }
      conn.on("open", function () {
        netpublog("Peer connected " + conn.peer);
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
        netsys.hostconn = conn;
        netsys.opened = true;
        conn.on("open", function () {
          conn.send({ t: "join", n: netsys.name });
          netpublog("Connected to host " + conn.peer);
          if (cb) cb("");
        });
        conn.on("data", function (d) {
          netrecv(d, conn);
        });
        conn.on("close", function () {
          netsys.error = "Host closed the session";
          netpublog("Host closed the session");
          netclose();
        });
        conn.on("error", function (e) {
          netsys.error = "Connection failed";
          netpublog("Connection failed");
          if (cb) cb("Connection failed");
        });
      });
    }
  });
}

function netclose(silent) {
  try {
    if (netsys.client) netsys.client.destroy();
  } catch (e) {}
  try {
    if (netsys.hostpeer) netsys.hostpeer.destroy();
  } catch (e) {}
  if (netsys.hostconn) {
    try {
      netsys.hostconn.send({ t: "bye", id: netsys.me });
      netsys.hostconn.close();
    } catch (e) {}
  }
  netsys.on = false;
  netsys.remotes = [];
  netsys.peers = {};
  netsys.hostconn = null;
  netsys.hostpeer = null;
  netsys.client = null;
  netsys.opened = false;
  netsys.ping = 0;
  if (!silent) {
    netpublog("Session closed");
    if (typeof netrefresh === "function") netrefresh();
  }
}

function netpublog(line) {
  netsys.log.unshift({ t: new Date().toLocaleTimeString(), m: line });
  if (netsys.log.length > 60) netsys.log.length = 60;
  if (typeof netrefresh === "function") netrefresh();
}

function netconns() {
  var list = [];
  if (netsys.hostpeer) {
    var c = netsys.hostpeer.connections;
    for (var k in c) {
      var arr = c[k];
      for (var i = 0; i < arr.length; i++) list.push(arr[i]);
    }
  }
  if (netsys.hostconn) list.push(netsys.hostconn);
  return list;
}

function netsend(msg, only) {
  var list = only ? [only] : netconns();
  for (var i = 0; i < list.length; i++) {
    try {
      if (list[i].open) {
        list[i].send(msg);
        netsys.sent++;
        if (netsys.sent % 25 === 0) {}
      }
    } catch (e) {}
  }
}

function netrecv(d, conn) {
  if (!d || !d.t) return;
  netsys.got++;
  if (d.t === "join") {
    if (netsys.role !== "host") return;
    var id = conn.peer.slice(-6);
    netsys.peers[conn.peer] = { id: id, peer: conn.peer, name: String(d.n || "Player").slice(0, 16), x: 0, y: 1, z: 0, face: 1, color: netplayercolor(Object.keys(netsys.peers).length) };
    netpublog("Player joined: " + netsys.peers[conn.peer].name);
    var roster = netroster();
    netsend({ t: "welcome", id: id, room: netsys.room, roster: roster, host: netsys.name });
    netsend({ t: "roster", roster: roster });
    if (typeof netrefresh === "function") netrefresh();
    return;
  }
  if (d.t === "welcome") {
    netsys.mine = d.id;
    netsys.hostname = d.host || "Host";
    netpublog("Joined " + netsys.room + " as " + d.id);
    netrosterapply(d.roster);
    if (typeof netrefresh === "function") netrefresh();
    return;
  }
  if (d.t === "roster") {
    netrosterapply(d.roster);
    if (typeof netrefresh === "function") netrefresh();
    return;
  }
  if (d.t === "state") {
    if (netsys.role === "host") {
      var p = netsys.peers[conn.peer];
      if (p) {
        p.x = d.x;
        p.y = d.y;
        p.z = d.z;
        p.face = d.f;
        p.last = Date.now();
        var rr = netbyname(p.id);
        if (!rr) {
          rr = { id: p.id, name: p.name, color: p.color, x: d.x, y: d.y, z: d.z || 0, tx: d.x, ty: d.y, tz: d.z || 0, face: d.f || 1, tface: d.f || 1, last: Date.now() };
          netsys.remotes.push(rr);
        }
        rr.tx = d.x;
        rr.ty = d.y;
        rr.tz = d.z || 0;
        rr.tface = d.f || 1;
      }
      return;
    }
    netapply(d);
    return;
  }
  if (d.t === "snap") {
    for (var s = 0; s < d.p.length; s++) netapply({ id: d.p[s][0], x: d.p[s][1], y: d.p[s][2], z: d.p[s][3], f: d.p[s][4], a: d.p[s][5] });
    if (d.c) netsys.down = d.c;
    return;
  }
  if (d.t === "rpc") {
    netpublog("RPC " + d.f);
    if (netsys.role === "host") netsend({ t: "rpc", f: d.f, a: d.a });
    if (typeof netrpcrun === "function") netrpcrun(d);
    return;
  }
  if (d.t === "chat") {
    netsys.chat.push({ n: d.n, m: String(d.m || "").slice(0, 140) });
    if (netsys.chat.length > 40) netsys.chat.shift();
    if (typeof netrefresh === "function") netrefresh();
    return;
  }
  if (d.t === "ping") {
    netsend({ t: "pong", s: d.s }, conn);
    return;
  }
  if (d.t === "pong") {
    netsys.ping = Math.max(1, Math.round(performance.now() - d.s));
    return;
  }
  if (d.t === "bye") {
    netdrop(conn.peer);
    return;
  }
  if (d.t === "reject") {
    netsys.error = d.m || "Connection rejected";
    netclose();
  }
}

function netdrop(peer) {
  var p = netsys.peers[peer];
  if (p) netpublog("Player left: " + p.name);
  delete netsys.peers[peer];
  netsys.remotes = netsys.remotes.filter(function (r) {
    return r.peer !== peer;
  });
  if (netsys.role === "host") {
    var roster = [];
    for (var k in netsys.peers) roster.push({ id: netsys.peers[k].id, n: netsys.peers[k].name, c: netsys.peers[k].color });
    netsend({ t: "roster", roster: roster });
  }
  if (typeof netrefresh === "function") netrefresh();
}

function netapply(d) {
  if (d.id && d.id === netsys.mine) return;
  var found = null;
  for (var i = 0; i < netsys.remotes.length; i++) if (netsys.remotes[i].id === d.id) found = netsys.remotes[i];
  if (!found) {
    if (!d.id) return;
    found = { id: d.id, name: d.n || "Player", color: d.c || "#4fa3ff", x: d.x, y: d.y, z: d.z || 0, tx: d.x, ty: d.y, tz: d.z || 0, face: d.f || 1, tface: d.f || 1, last: Date.now() };
    netsys.remotes.push(found);
    return;
  }
  found.tx = d.x;
  found.ty = d.y;
  found.tz = d.z || 0;
  found.tface = d.f || 1;
  found.last = Date.now();
}


function netroster() {
  var roster = [{ id: "h", n: netsys.name, c: "#ffb02e", host: true }];
  for (var k in netsys.peers) roster.push({ id: netsys.peers[k].id, n: netsys.peers[k].name, c: netsys.peers[k].color });
  return roster;
}

function netrosterapply(list) {
  if (!list) return;
  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    if (r.id === netsys.mine) continue;
    var found = null;
    for (var j = 0; j < netsys.remotes.length; j++) if (netsys.remotes[j].id === r.id) found = netsys.remotes[j];
    if (!found) {
      found = { id: r.id, name: r.n, color: r.c || "#4fa3ff", x: 0, y: 1, z: 0, tx: 0, ty: 1, tz: 0, face: 1, tface: 1, last: Date.now() };
      netsys.remotes.push(found);
      netpublog("Player online: " + r.n);
    } else {
      found.name = r.n;
      found.color = r.c || found.color;
    }
  }
  netsys.remotes = netsys.remotes.filter(function (x) {
    return list.some(function (y) {
      return y.id === x.id;
    });
  });
}

function netbyname(id) {
  for (var i = 0; i < netsys.remotes.length; i++) if (netsys.remotes[i].id === id) return netsys.remotes[i];
  return null;
}

function netplayercolor(i) {
  var pal = ["#4fa3ff", "#ff8a3d", "#8f6bff", "#39d98a", "#ff5d8f", "#f5c542", "#41d6d6", "#c076ff"];
  return pal[i % pal.length];
}

function nettick(dt) {
  if (!netsys.on) return;
  netsys.tick += dt;
  var now = performance.now();
  if (!netsys.pingbase) netsys.pingbase = now;
  if (now - netsys.pingbase > 2000) {
    netsys.pingbase = now;
    netsend({ t: "ping", s: now });
  }
  var rate = game && game.status === "playing" ? 0.05 : 0.2;
  if (netsys.since === undefined) netsys.since = 0;
  netsys.since += dt;
  var px = game ? +game.x.toFixed(3) : 0;
  var py = game ? +game.y.toFixed(3) : 0;
  var pf = game ? game.face : 1;
  if (netsys.since >= rate) {
    netsys.since = 0;
    if (netsys.role === "host") {
      netsys.self = { x: px, y: py, z: 0, f: pf };
      var pts = [];
      for (var k in netsys.peers) {
        var p = netsys.peers[k];
        pts.push([p.id, +p.x.toFixed(2), +p.y.toFixed(2), +(p.z || 0).toFixed(2), p.face || 1]);
      }
      pts.unshift(["h", px, py, 0, pf]);
      netsend({ t: "snap", p: pts, c: netsys.got });
    } else if (netsys.role === "client") {
      netsend({ t: "state", id: netsys.mine, x: px, y: py, z: 0, f: pf });
    }
  }
  var k2 = Math.min(1, dt * 14);
  for (var i = 0; i < netsys.remotes.length; i++) {
    var r = netsys.remotes[i];
    r.x += (r.tx - r.x) * k2;
    r.y += (r.ty - r.y) * k2;
    r.z += (r.tz - r.z) * k2;
    if (r.tface !== r.face) r.face += (r.tface - r.face) * Math.min(1, dt * 18);
  }
}

function netitems(list) {
  if (!netsys.on || !netsys.remotes.length) return list;
  for (var i = 0; i < netsys.remotes.length; i++) {
    var r = netsys.remotes[i];
    list.push({
      id: "netuser" + r.id,
      kind: "box",
      matrix: m4compose([r.x, r.y, 1.15], [0, r.face >= 0 ? 16 : -16, 0], [0.72, 1.02, 0.3]),
      color: r.color,
      opacity: 1,
      unlit: false,
      texid: "netuser",
      texture: window.spriteinfo && spriteinfo.hero ? texturecanvas("hero", app.project) : null,
      faces: "sprite",
      sidecolor: r.color,
      double: true,
      visible: true
    });
  }
  return list;
}

function netstate() {
  if (!netsys.on) return "Offline";
  var n = netsys.role === "host" ? Object.keys(netsys.peers).length + 1 : netsys.remotes.length + 1;
  return (netsys.role === "host" ? "Hosting " : "Connected ") + (netsys.room || "") + " · " + n + " player" + (n === 1 ? "" : "s") + " · " + netsys.ping + " ms";
}

function netrpc(f, args) {
  if (!netsys.on) return;
  netsend({ t: "rpc", f: f, a: args || [] });
}

function netrpcrun(d) {
  if (d.f === "event" && typeof runevents === "function") {
    runevents(d.a[0], d.a[1]);
    return;
  }
  if (d.f === "msg" && typeof showbanner === "function") showbanner(d.a[0], d.a[1] || "", "net");
  if (typeof netrpchook === "function") netrpchook(d);
}

function netchat(text) {
  if (!netsys.on || !text) return;
  if (netsys.role === "host") {
    netsend({ t: "chat", n: netsys.name, m: text });
    netsys.chat.push({ n: netsys.name, m: text });
  } else {
    netsys.hostconn.send({ t: "chat", n: netsys.name, m: text });
    netsys.chat.push({ n: netsys.name, m: text });
  }
  if (typeof netrefresh === "function") netrefresh();
}

var ue5panelcss = ".u5row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}.u5row .k{width:190px;color:#c8ccd4;font-size:12.5px}.u5row .v{flex:1;display:flex;gap:8px;align-items:center}.u5stat{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:10px 0}.u5card{background:#171a1f;border:1px solid #2a2f37;border-radius:8px;padding:10px}.u5card .n{font-size:10.5px;text-transform:uppercase;letter-spacing:.8px;color:#8b93a1}.u5card .v{font-size:20px;font-weight:700;color:#f0f2f5;margin-top:2px}.u5badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(79,163,255,.14);color:#8ec5ff;border:1px solid rgba(79,163,255,.3)}.u5on{background:rgba(57,217,138,.16);color:#6fe3a5;border-color:rgba(57,217,138,.34)}.u5off{background:rgba(255,255,255,.05);color:#98a1ad;border-color:rgba(255,255,255,.09)}.u5log{font-family:ui-monospace,monospace;font-size:11px;background:#101318;border:1px solid #242a33;border-radius:8px;padding:8px;max-height:190px;overflow:auto;color:#9aa6b5}.u5log b{color:#e6ecf5;font-weight:600}.u5track{display:grid;grid-template-columns:150px 1fr;border-bottom:1px solid #232830}.u5track .h{font-size:12px;padding:8px;color:#c8ccd4;border-right:1px solid #232830}.u5lane{position:relative;height:34px;background:linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,.01))}.u5key{position:absolute;top:9px;width:10px;height:16px;border-radius:3px;background:#ffb02e;box-shadow:0 0 0 1px rgba(0,0,0,.3)}.u5ruler{display:grid;grid-template-columns:150px 1fr;font-size:10px;color:#7c8492}.u5ruler .r{display:flex;justify-content:space-between;padding:4px 2px}.u5mod{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;background:#14181d;border:1px solid #242a33;margin-bottom:6px;font-size:12px}.u5mod .dots{color:#5d6674;font-size:15px;letter-spacing:-2px}.u5mod b{font-weight:600;color:#dfe6ef;font-size:12px}.u5chain{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.u5node{background:#1b2a3d;border:1px solid #2f4a6b;border-radius:8px;padding:7px 10px;font-size:12px;color:#bcd7f5}.u5node.hot{background:#24384f;border-color:#4d7fb5;color:#e3f0ff}.u5wire{height:2px;width:18px;background:#3c4a5c}";


function netrpchook(d) {
  if (!d || d.f !== "pick" || !game) return;
  var id = d.a && d.a[1];
  if (!id) return;
  gameover = gameover || {};
  gameover[id] = { visible: false };
  if (d.a[0] === "coin") {
    (game.coins || []).forEach(function (c) {
      if (c.node && c.node.id === id) c.got = true;
    });
  }
  if (d.a[0] === "heart") {
    game.lives = Math.min(9, (game.lives || 0) + 1);
    if (typeof updatelives === "function") updatelives();
  }
}

function netplayername() {
  var n = "";
  try {
    n = localStorage.getItem("unxplayername") || "";
  } catch (e) {}
  return n || netsys.name || "Player";
}

function netsavename(n) {
  netsys.name = n;
  try {
    localStorage.setItem("unxplayername", n);
  } catch (e) {}
}

function netplayers() {
  var list = [];
  if (netsys.role === "host") {
    list.push({ id: "host", name: netsys.name + " (host)", color: "#ffb02e", you: true, ping: 0 });
    for (var k in netsys.peers) {
      var p = netsys.peers[k];
      list.push({ id: p.id, name: p.name, color: p.color, you: false, ping: netsys.ping });
    }
  } else {
    for (var j = 0; j < netsys.remotes.length; j++) {
      var r = netsys.remotes[j];
      list.push({ id: r.id, name: r.name, color: r.color, you: false, ping: netsys.ping });
    }
    list.push({ id: netsys.mine, name: netsys.name + " (you)", color: "#ffb02e", you: true, ping: netsys.ping });
  }
  return list;
}

function netpanel() {
  var on = netsys.on;
  var players = on ? netplayers() : [];
  var body = '<div class="row" style="gap:8px;align-items:center;margin-bottom:10px"><span class="u5badge ' + (on ? "u5on" : "u5off") + '">' + (on ? (netsys.role === "host" ? "Hosting" : "Connected") : "Offline") + "</span>" +
    (on ? '<span class="tiny muted">' + esc(netstate()) + "</span>" : '<span class="tiny muted">WebRTC through PeerJS · peer to peer</span>') +
    "</div>" +
    '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
    '<input class="inp" id="netname" placeholder="Your player name" value="' + esc(netplayername()) + '" style="max-width:170px">' +
    '<input class="inp" id="netroom" placeholder="Room code" value="' + esc(netsys.room || netrand(5)) + '" style="max-width:130px;text-transform:lowercase">' +
    '<button class="btn primary" data-mact="host" ' + (on ? "disabled" : "") + ">" + ic("globe", "ico-xs") + " Host session</button>" +
    '<button class="btn" data-mact="join" ' + (on ? "disabled" : "") + ">" + ic("play", "ico-xs") + " Join session</button>" +
    (on ? '<button class="btn" data-mact="leave">Leave</button>' : "") +
    "</div>" +
    (netsys.error ? '<div class="u5warn">' + esc(netsys.error) + "</div>" : "") +
    '<div class="u5divider"></div>' +
    '<div class="tiny muted" style="margin:8px 0">Players</div>' +
    (players.length ? players.map(function (p) {
      return '<div class="u5player"><span class="dot" style="background:' + p.color + '"></span><b>' + esc(p.name) + "</b>" + (p.you ? '<span class="tiny muted">you</span>' : '<span class="tiny muted">' + (p.ping || 0) + " ms</span>") + "</div>";
    }).join("") : '<div class="emptyhint">No players. Host a session and share the room code, or join a session.</div>') +
    '<div class="u5divider"></div>' +
    '<div class="row" style="gap:6px;margin:8px 0"><input class="inp" id="netchat" placeholder="Send a message to the session" style="flex:1"><button class="btn" data-mact="chat">Send</button></div>' +
    '<div class="u5chat">' + (netsys.chat.length ? netsys.chat.map(function (c) {
      return "<div><b>" + esc(c.n) + ":</b> " + esc(c.m) + "</div>";
    }).join("") : '<div class="emptyhint">No messages yet.</div>') + "</div>" +
    '<div class="u5divider"></div>' +
    '<div class="row" style="gap:6px;margin:8px 0"><button class="btn" data-mact="rpc" ' + (on ? "" : "disabled") + ">Send test RPC</button><span class=\"tiny muted\">RPCs reach every peer in the session.</span></div>" +
    '<div class="u5log">' + netsys.log.map(function (l) {
      return "<div><span class=\"dim\">" + l.t + "</span> " + esc(l.m) + "</div>";
    }).join("") + "</div>";
  openmodal({
    title: "Online Subsystem - PeerJS Sessions",
    icon: "globe",
    width: "wide",
    body: body,
    onmount: function (modal) {
      var chat = modal.querySelector("#netchat");
      if (chat) chat.addEventListener("keydown", function (e) {
        if (e.key === "Enter") netchatsend(modal);
      });
    },
    footer: '<button class="btn" data-mact="close">Close</button>',
    actions: {
      host: function (m) {
        netstartfromform(m, "host");
      },
      join: function (m) {
        netstartfromform(m, "client");
      },
      leave: function (m, s) {
        netclose();
        closemodal(s);
        netpanel();
      },
      chat: function (m) {
        netchatsend(m);
      },
      rpc: function () {
        netrpc("msg", ["Online Subsystem", "RPC delivered to all peers"]);
        toast("RPC sent to " + (netconns().length || 0) + " peer(s)", "ok");
      }
    }
  });
}

function netchatsend(modal) {
  var box = modal.querySelector("#netchat");
  if (!box) return;
  var text = box.value.trim();
  if (!text) return;
  netchat(text);
  box.value = "";
  var chatel = modal.querySelector(".u5chat");
  if (chatel) {
    chatel.innerHTML = netsys.chat.map(function (c) {
      return "<div><b>" + esc(c.n) + ":</b> " + esc(c.m) + "</div>";
    }).join("");
  }
}

function netstartfromform(modal, role) {
  var namefield = modal.querySelector("#netname");
  var roomfield = modal.querySelector("#netroom");
  var name = namefield && namefield.value.trim() ? namefield.value.trim().slice(0, 16) : "Player";
  var room = roomfield ? roomfield.value : netsys.room;
  netsavename(name);
  toast(role === "host" ? "Creating session…" : "Connecting…", "");
  netopen(role, room, name, function (err) {
    if (err) {
      toast(err, "bad");
    } else {
      toast(role === "host" ? "Session ready: " + netsys.room : "Connected to " + netsys.room, "ok");
    }
    closemodal(modal.parentNode);
    if (typeof closemodal === "function") {}
    netpanel();
  });
}

function netrefresh() {
  var el = qs("#netlive");
  if (el) el.textContent = netstate();
  var badge = qs("#netbadge");
  if (badge) {
    badge.className = "netbadge" + (netsys.on ? " on" : "");
    badge.textContent = netsys.on ? (netsys.role === "host" ? "Host " : "Net ") + netsys.room : "";
    badge.style.display = netsys.on ? "inline-flex" : "none";
  }
}

function netaddcss() {
  if (qs("#netcss")) return;
  var st = document.createElement("style");
  st.id = "netcss";
  st.textContent = ".netbadge{display:none;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#8ec5ff;background:rgba(79,163,255,.14);border:1px solid rgba(79,163,255,.3);border-radius:999px;padding:3px 9px;margin-right:6px}.u5warn{background:rgba(255,93,143,.12);border:1px solid rgba(255,93,143,.3);color:#ff9dba;padding:7px 9px;border-radius:7px;font-size:12px;margin:6px 0}.u5divider{height:1px;background:#232830;margin:10px 0}.u5player{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12.5px}.u5player .dot{width:9px;height:9px;border-radius:50%}.u5player .grow{flex:1}.u5chat{background:#101318;border:1px solid #232830;border-radius:8px;padding:8px;height:110px;overflow:auto;font-size:12px;color:#b9c4d2}.u5chat b{color:#e6ecf5}.u5grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.u5block{background:#151a20;border:1px solid #242a33;border-radius:9px;padding:10px}.u5blockhead{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:#e6ecf5;margin-bottom:6px}.u5blockhead .grow{flex:1}";
  document.head.appendChild(st);
}
