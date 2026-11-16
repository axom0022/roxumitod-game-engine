# Multiplayer - Online Subsystem

Roxumitod Game Engine ships a peer-to-peer multiplayer stack built on **PeerJS**, the WebRTC data-channel library. There is no game server to run: one player hosts, everyone else connects directly to the host over an encrypted WebRTC channel.

The same code path runs in **Play In Editor** and in **packaged HTML builds**, so you can test a session in the editor and ship the identical behaviour.

---

## Concepts

**Session** - one host and up to eight clients, identified by a short **room code** (for example `kx7qp`).

**Host** - creates the session, owns the roster, and relays state between clients. The host's peer id is derived from the room code, so joining is just *"connect to `unx<room>h`"*.

**Client** - joins with a room code, receives a roster, and streams its player state to the host at 20 Hz.

**Replication** - players are *actors*. Their transform (x, y, facing) is replicated every 50 ms. Remote actors are interpolated on the receiving side, so movement stays smooth even with jitter or packet loss.

**RPC** - a remote procedure call reaches every peer in the session. Use it for events that must fire everywhere: *open the door*, *start the round*, *play the victory sting*.

**Chat** - a text channel carried on the same data channel as the state stream.

---

## Hosting from the editor

1. Open **Window → Online Subsystem - Multiplayer**, or **Build → Host multiplayer session…**.
2. Type your player name and a room code (or keep the generated one).
3. Press **Host session**. The status line turns green and the toolbar shows a `Host <room>` badge.
4. Press **Play In Editor**. Your avatar now exists on the network.
5. Send the room code to the other players and have them press **Join session**.

While the session runs, the panel lists every connected player, their round-trip latency and the message log. **Send test RPC** proves the event channel end to end.

## Joining from a packaged build

Every exported game carries a small **Co-op** button in the bottom-right corner. It opens the same session panel: name, room code, **Host session**, **Join session**, **Leave session**, plus the live roster.

Sessions can also be started from the URL:

```
game.html?room=kx7qp&host=1&name=Ava     opens and hosts room kx7qp
game.html?room=kx7qp&name=Ben            joins room kx7qp
```

This is the recommended way to run playtests: send each tester a link with the room code baked in.

---

## Pickups and world state

Collecting a coin or a heart sends a `pick` RPC. Every peer marks that pickup as taken, so the coin disappears from every screen at once and no two players chase the same coin. Score and lives stay per-player, which is the usual co-op reading: you collect for yourself, the world depletes for everyone.

For level-wide state (doors, gates, rounds) use a `pick`-style RPC with your own payload, and let the host decide the outcome before broadcasting.

## What gets replicated

| Data | Direction | Rate | Notes |
| --- | --- | --- | --- |
| Player transform | client → host → all | 20 Hz | x, y, facing; interpolated on arrival |
| Host transform | host → all | 20 Hz | included in every snapshot |
| Roster | host → all | on join / leave | ids, names, colours |
| Chat | both ways | per message | capped at 140 characters |
| RPC | both ways | per call | name plus argument array |
| Pickup | client → host → all | on pickup | coin and heart keys disappear everywhere |
| Ping / pong | both ways | 0.5 Hz | drives the latency readout |

The snapshot is a compact array of `[id, x, y, z, facing]` tuples, which keeps the data channel quiet enough for eight players on a residential connection.

---

## Wiring replication into a level

Remote actors are ordinary actors in the render pass, so they respect the same camera, lighting and materials as everything else. In the editor they are injected into the PIE item list; in packaged builds they are injected as meshes in the GL path and as sprites in the 2D painter fallback.

To replicate gameplay state, call an RPC from a Blueprint event:

```
on trigger -> rpc "door" {"open": true}
rpc "door" -> every peer runs the door-open action
```

Use the host as the authority for anything that must not diverge: score, rounds, spawns. A client asks the host through an RPC, the host validates, then broadcasts the result.

---

## Reference

| Call | Purpose |
| --- | --- |
| `netopen(role, room, name, cb)` | Start a session. `role` is `"host"` or `"client"`. |
| `netclose()` | Leave the session and destroy the peer. |
| `netstate()` | Human-readable status: role, room, player count, latency. |
| `netrpc(name, args)` | Broadcast an RPC to every peer. |
| `netchat(text)` | Send a chat line. |
| `netitems(list)` | Append remote avatars to a PIE render list. |
| `nettick(dt)` | Advance replication. Called by the play loop. |
| `netsys` | Live state: `on`, `role`, `room`, `peers`, `remotes`, `ping`, `log`. |

Packaged builds expose `window.__netdebug()` for diagnostics; it returns the session role, room, remote actors and latency.

---

## Troubleshooting

**"PeerJS could not be loaded"** - the page could not reach the PeerJS CDN. The engine tries jsDelivr, then unpkg, then the bundled `vendor/peerjs.min.js`.

**Join hangs on "Connecting…"** - the host closed the tab, or the room code is wrong. Room codes are lowercase letters and digits only.

**Connected but no remote avatars** - one side is paused. Replication only ticks while Play In Editor is running; press **Play In Editor** on both machines.

**High latency** - WebRTC picks a direct route when it can. If both players sit behind symmetric NATs the connection falls back to a relay; latency of 150-300 ms is normal on a relay.

**Corporate networks** - some firewalls block WebRTC entirely. Test with `netsys.log` open; the failure appears as a peer error with type `network`.
