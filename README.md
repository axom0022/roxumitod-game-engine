# Roxumitod Game Engine

An **Unreal Engine 5 style** game editor for the open web - levels, actors, components, Play In Editor, Lumen, Nanite, Virtual Shadow Maps, World Partition, Chaos physics, Niagara effects, Sequencer cinematics, MetaSounds, Control Rig and PeerJS multiplayer. Plain HTML, CSS and JavaScript. No build step, no framework, no comments in the source.

Open `index.html` (served over HTTP) and press **Play In Editor**.

```
python3 -m http.server 8100
# then open http://localhost:8100/index.html
```

Full documentation lives in [`docs/`](docs/index.md): concepts, walkthroughs and reference for every system. The advanced systems reference is [`docs/advanced-systems.md`](docs/advanced-systems.md). A feature audit against Roblox Studio and Unreal Engine 5 is in [`docs/gap-analysis.md`](docs/gap-analysis.md).

## Feature hub

**Window, Tools, then Feature hub** (or `Ctrl+Shift+F`) opens a searchable list of every advanced system in the engine, grouped by Rendering, World, Animation, Physics, Effects, Audio, Logic, Pipeline, Editor, Live, Input and Assets. Each row opens the panel that drives it. `Ctrl+Shift+P` opens the command bar, which resolves the same list by name.

## Advanced systems

Rendering gains skeletal mesh rendering, a named material system with custom GLSL, projected decals, screen space reflections, a CPU path tracer for stills with live ray traced shadows, temporal anti aliasing with TSR, DLSS, FSR and XeSS presets, lightmap baking, virtual texture analysis, automatic LOD and HLOD, stencil masked post materials, lens and camera effects, volumetric lighting, translucency and refraction, and cloth, hair, fur and eyes.

World building gains CSG booleans on a shared voxel grid, mesh editing with subdivide, bevel, weld and flip, four sculpt brushes, landscape material layers painted into vertex colours, Catmull Rom splines with road ribbons, instanced foliage, world partition streaming, level instances, and procedural meshes built from script.

Animation gains an editor with clips, blend spaces and montages, per bone limits, a two bone control rig, ragdoll, notifies, root motion and facial morph targets. Physics gains joints and constraints, a vehicle with suspension and steering, a character controller with step and slope handling, an eight channel collision matrix, swept continuous collision, six field types, recursive destruction, soft bodies, fluid and buoyancy.

Effects and audio gain a wired effect graph, a typed array GPU style simulation, a Web Audio node graph, spatialisation with three distance models, microphone voice chat over the peer session, and a tempo locked music sequencer.

Logic gains a visual scripting graph that compiles to real script, a full JavaScript runtime with module imports and live bindings, a lint and type pass, hot reload, a line level debugger and a profiler.

The pipeline gains a semantic package manager, version snapshots with rollback and diff, a local commit graph, an asset marketplace, a device emulator, multi client play testing, a command bar, dock layouts and themes, a keybind editor, crash recovery and accessibility switches. Live services gain anti cheat validation, teleport, leaderboards and stats, experiment flags and remote config, and lag compensation. Input gains touch, gamepad and VR, plus a five locale localisation pipeline. Assets gain texture import with BC1 and BC7 style compression, glTF animation import, audio import with streaming, a dependency graph and texture painting.

## Framework

**Levels** hold **actors**; actors are built from **components**. The left dock is the **World Outliner**, **Content Browser** and **Blueprint** editor; the right dock is **Details** and **World Settings**. The toolbar carries the **Play In Editor** button, the 3D library picker (three.js or faoxomjs), undo / redo, Export and Project settings.

**Play In Editor** swaps the editor camera for the game camera, ticks the physics solver, the Blueprint sheets, the particle systems, the Sequencer and the network stack, and renders through the same renderer as the viewport. `Esc` stops and restores the editor.

## Rendering

- **Lumen** - hemisphere probes and a ground-colour bounce light give every level indirect lighting. Intensity slider, live probe count.
- **Nanite** - virtualized geometry: meshlet LOD swaps, sub-pixel cluster culling and a triangle budget readout.
- **Virtual Shadow Maps** - near and far cascaded shadow pages, re-targeted to the camera focus, 512-4096 px.
- **World Partition** - level cells streamed in a radius around the camera; the panel lists every cell with its actor count.
- Tone mapping (ACES / Reinhard / none), bloom, depth of field, ambient occlusion, FXAA, fog, sky images and a per-level environment block.

All four stacks live in **World Settings → Rendering**, are saved with the project and are applied identically in the viewport, in PIE and in packaged builds. **Engine stats** reports what they are actually doing: anchors drawn / virtualized, clusters culled, LOD swaps, VSM pages, loaded cells, GI probes, particles and peers.

## Simulation

- **Chaos** - sub-stepped rigid bodies, static / dynamic / kinematic bodies, joints, mass, friction, restitution, and **geometry collection fracture** that splits an actor into simulated shards.
- **Character controller** - oriented-box resolution with slopes, moving platforms, wall sliding and swept sub-steps.
- **Niagara** - modular particle systems: spawn rate, burst, life, velocity, cone spread, gravity, size, colour over life, sprite shape, additive renderer, collision and eight presets.
- **MetaSounds** - procedural audio graphs (oscillator → filter → envelope → output) synthesised by WebAudio; nothing streams, nothing downloads.
- **Sequencer** - camera and actor tracks with keyframes, a scrubable playhead, looping playback and camera override during PIE.
- **Control Rig** - analytic two-bone IK with reach clamping and pole direction.
- **Blueprints** - per-actor and per-level event sheets: events, conditions, actions, variables.
- **Animator** - state machines with layers, blend trees, parameters and crossfades.

## Multiplayer

**Online Subsystem** is built on **PeerJS** over WebRTC:

- **Host / join by room code** - the host owns the roster; clients connect peer to peer, no game server.
- **Actor replication** at 20 Hz with interpolation, host snapshots and per-peer latency.
- **RPCs** and **chat** on the same data channel.
- Works in **Play In Editor** and in **packaged builds**, including the editor-to-build case.
- Packaged games expose a **Co-op** panel and accept `?room=code&host=1&name=` in the URL.

See [`docs/multiplayer.md`](docs/multiplayer.md).

## Content

**Templates** - seventeen project templates, including Particle Lab, Tilemap platformer, UI menu kit, Navmesh chase and Physics and joints, each with its own thumbnail.

**Assets** - material, GLSL shader, animator controller, timeline, localization, services, data tables and sliced sprite sheets, each with a working editor page. **Sprite editor** with layers, brushes, shapes, stabiliser, palette and undo. **Model library** of fifteen built models, plus OBJ / glTF / GLB / FBX / STL import and navmesh baking with A* agents. **Tilemaps** with twelve tile types, painting, solids and draw order. **Audio mixer** with groups, volume, mute and low-pass routing.

**Overlays and DX** - collider and navmesh overlays, autosave, shortcut map, event debugger with breakpoints and stepping, profiler with an fps graph.

## Plugins

`Tools → Plugins…` opens a plugin manager modelled on Roblox Studio. A plugin is a small program that adds toolbar buttons, menu commands, docked widgets and event handlers to the editor. It is compiled inside a function scope with the plugin API in front of it - `scene`, `selection`, `transform`, `play`, `ui`, `prefs`, `storage`, `http`, `on`, `onTick`, `onKey` - so it needs no imports. Plugins can be enabled and disabled at any time; disabling one unregisters every button, widget, ticker and event it created. `Export` writes a `.unxplug` file, `Import` reads one back. See [`docs/plugins.md`](docs/plugins.md).

## Controls

The viewport uses UE5 navigation: right mouse look, right mouse plus `WASD` fly, `Ctrl` plus wheel for camera speed, `Alt` `G`/`H`/`J`/`K` for perspective, front, top and side, camera bookmarks on the number row, `End` to drop an actor to the floor and `Shift` plus `P` to pilot one. Actors can be locked so they cannot be picked or transformed. The full list is in [`docs/controls.md`](docs/controls.md) and under `Tools → Controls & shortcuts`.

## Packaging

**File → Package game (HTML)** writes one self-contained file. The renderer loads from a CDN (`three.js` r149 or `faoxomjs` v6 `dist/faoxom.min.js`), with a spare library and a canvas-2D painter as fallbacks, so a build never fails to run. The same menu builds an itch.io zip, an Android APK project (WebView activity, manifest, Gradle config, signing profile) and a project folder zip; **Backup** writes a `.ugm` project file; GitHub import and sync move projects through a repository. `exports/demo-game.html` and `exports/mp-game.html` are builds - open either in a browser and play with arrows and space.

## Layout of the source

```
index.html            shell, script order
src/style.css         the whole theme
src/icons.js          inline SVG icon set
src/art.js            procedural pixel art, grid bake, kit thumbnails
src/gfx.js            three.js and faoxomjs render stacks, post processing
src/model.js          scene graph, demo project, undo/redo, camera save
src/ui.js             menus, modals, toasts, small widgets
src/viewport.js       viewport, gizmo, marquee, picking, camera, scene env
src/play.js           play runtime, HUD, events, PIE loop
src/ue5.js            Lumen, Nanite, VSM, World Partition, Sequencer,
                      Niagara, MetaSounds, Chaos, Control Rig, stats, docs
src/net.js            Online Subsystem: PeerJS sessions, replication, RPC, chat
src/netexport.js      the same networking runtime, embedded in packaged builds
src/phys.js           oriented-body physics, joints, behaviors, navmesh A*
src/fx.js             particle presets, emitters, fx preview
src/uiplay.js         UI runtime: canvas tree, widgets, pointer input
src/tilemap.js        tile types, palette, painting, solids
src/animator.js       animator state machines
src/mixer.js          audio groups, low-pass routing
src/modelio.js        OBJ / glTF / GLB / FBX / STL import, navmesh bake
src/templates.js      project templates and their scene builders
src/wire.js           component rows, behaviors page, extra actions
src/pipeline.js       zip writer, HTML build with net runtime, APK, GitHub
src/dx.js             debugger, breakpoints, profiler, autosave, shortcuts
src/launcher.js       launcher screen
src/editor.js         shell, dock, menus, files
src/editor2.js        documents, details, world settings
src/editor3.js        most actions
src/assets_ui.js      model library and asset editor pages
src/editor4.js        event editor, touch controls, publish build
src/main.js           boot
docs/                 Epic-style documentation
vendor/three.min.js   three.js r149, offline fallback
vendor/faoxomjs.js    faoxomjs v6, offline fallback
vendor/peerjs.min.js  PeerJS 1.5.4, offline fallback
```

Editor screenshots live in `previews/`.
