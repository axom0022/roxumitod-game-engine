# Roxumitod Game Engine

Full documentation in [`docs/`](docs/index.md): is [`docs/advanced-systems.md`](docs/advanced-systems.md).

## Multiplayer

**Online Subsystem** is built on **PeerJS** over WebRTC:

- **Host / join by room code** - the host owns the roster; clients connect peer to peer, no game server.
- **Actor replication** at 20 Hz with interpolation, host snapshots and per-peer latency.
- **RPCs** and **chat** on the same data channel.
- Works in **Play In Editor** and in **packaged builds**, including the editor-to-build case.
- Packaged games expose a **Co-op** panel and accept `?room=code&host=1&name=` in the URL.

See [`docs/multiplayer.md`](docs/multiplayer.md).

## Content

**Templates** - the game engine has full templates

**Assets** - material, GLSL shader, animator controller, timeline, localization, services, data tables and sliced sprite sheets, each with a working editor page. **Sprite editor** with layers, brushes, shapes, stabiliser, palette and undo. **Model library** of fifteen built models, plus OBJ / glTF / GLB / FBX / STL import and navmesh baking with A* agents. **Tilemaps** with twelve tile types, painting, solids and draw order. **Audio mixer** with groups, volume, mute and low-pass routing.

**Overlays and DX** - collider and navmesh overlays, autosave, shortcut map, event debugger with breakpoints and stepping, profiler with an fps graph.

## Plugins

`Tools → Plugins…` opens a plugin manager modelled on Roblox Studio. A plugin is a small program that adds toolbar buttons, menu commands, docked widgets and event handlers to the editor. It is compiled inside a function scope with the plugin API in front of it - `scene`, `selection`, `transform`, `play`, `ui`, `prefs`, `storage`, `http`, `on`, `onTick`, `onKey` - so it needs no imports. Plugins can be enabled and disabled at any time; disabling one unregisters every button, widget, ticker and event it created. `Export` writes a `.unxplug` file, `Import` reads one back. See [`docs/plugins.md`](docs/plugins.md).

## Controls

The viewport uses UE5 navigation: right mouse look, right mouse plus `WASD` fly, `Ctrl` plus wheel for camera speed, `Alt` `G`/`H`/`J`/`K` for perspective, front, top and side, camera bookmarks on the number row, `End` to drop an actor to the floor and `Shift` plus `P` to pilot one. Actors can be locked so they cannot be picked or transformed. The full list is in [`docs/controls.md`](docs/controls.md) and under `Tools → Controls & shortcuts`.

## Packaging

**File → Package game (HTML)** writes one self-contained file. The renderer loads from a CDN (`three.js` r149 or `faoxomjs` v6 `dist/faoxom.min.js`), with a spare library and a canvas-2D painter as fallbacks, so a build never fails to run. The same menu builds an itch.io zip, an Android APK project (WebView activity, manifest, Gradle config, signing profile) and a project folder zip; **Backup** writes a `.ugm` project file; GitHub import and sync move projects through a repository. `exports/demo-game.html` and `exports/mp-game.html` are builds - open either in a browser and play with arrows and space.

made by AXOM 
