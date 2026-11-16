# Roxumitod Game Engine

A realtime game editor that runs in the browser. Levels, actors, components, play mode, global illumination, virtual geometry, cascaded shadows, world streaming, a physics solver, an effect graph, an audio graph, cinematics, a rig solver and peer to peer multiplayer.

Plain HTML, CSS and JavaScript. No build step, no framework, no comments in the source.

Open `index.html` over HTTP and press **Play in viewport**.

```
python3 -m http.server 8100
# then open http://localhost:8100/index.html
```

Documentation lives in [`docs/`](docs/index.md), and the full system reference is [`docs/advanced-systems.md`](docs/advanced-systems.md).

## Feature hub

**Window, Tools, then Feature hub** (or `Ctrl+Shift+F`) opens a searchable list of every system in the engine, grouped by Rendering, World, Animation, Physics, Effects, Audio, Logic, Pipeline, Editor, Live, Input and Assets. Each row opens the panel that drives it. `Ctrl+K` opens the command bar, which resolves the same list by name.

## Advanced systems

Rendering gains skeletal mesh rendering, a named material system with custom GLSL, projected decals, screen space reflections, a CPU path tracer for stills with ray traced shadows, temporal anti aliasing with TSR, DLSS, FSR and XeSS presets, lightmap baking, virtual texture analysis, automatic LOD and HLOD, stencil masked post materials, lens and camera effects, volumetric lighting, translucency and refraction, and cloth, hair, fur and eyes.

World building gains CSG booleans on a shared voxel grid, mesh editing with subdivide, bevel, weld and flip, four sculpt brushes, landscape material layers painted into vertex colours, splines with road ribbons, instanced foliage, world streaming, level instances and procedural meshes built from script.

Animation gains an editor with clips, blend spaces and montages, per bone limits, a two bone rig solver, ragdoll, notifies, root motion and facial morph targets. Physics gains joints and constraints, a vehicle with suspension and steering, a character controller with step and slope handling, an eight channel collision matrix, swept continuous collision, six field types, recursive destruction, soft bodies, fluid and buoyancy.

Effects and audio gain a wired effect graph, a typed array GPU style simulation, a Web Audio node graph, spatialisation with three distance models, microphone voice chat over the peer session, and a tempo locked music machine.

Logic gains a visual scripting graph that compiles to real script, a full JavaScript runtime with module imports and live bindings, a lint and type pass, hot reload, a line level debugger and a profiler.

The pipeline gains a semantic package manager, version snapshots with rollback and diff, a local commit graph, an asset marketplace, a device emulator, multi client play testing, a command bar, dock layouts and themes, a keybind editor, crash recovery and accessibility switches. Live services gain anti cheat validation, teleport, leaderboards and stats, experiment flags and remote config, and lag compensation. Input gains touch, gamepad and VR, plus a five locale localisation pipeline. Assets gain texture import with BC1 and BC7 style compression, glTF animation import, audio import with streaming, a dependency graph and texture painting.

## Framework

**Levels** hold **actors**; actors are built from **components**. The left dock is the **Outliner**, **Content** and the **Logic graph**; the right dock is **Details** and **World settings**. The toolbar carries the **Play in viewport** button, the renderer picker (three.js or faoxomjs), undo, redo, Export and Project settings.

**Play in viewport** swaps the editor camera for the game camera, ticks the physics solver, runs the scripts and the logic graph, ticks the particle systems, the cinematic timeline and the network stack, and renders through the same renderer as the viewport. `Esc` stops and restores the editor.

## Adding actors

**Add** in the Outliner is grouped into Shapes, Objects, UI, Models, Sprites, Lighting, Sound, Effects, Gameplay, Scripting, Screen UI and Advanced. The same menu opens when you add a child object to an existing actor.

| Group | Actors |
| --- | --- |
| Lighting | Point light, spot light, area light |
| Sound | Sound emitter, music zone |
| Effects | Particle emitter, trail, beam |
| Gameplay | Spawn point, checkpoint, portal, door, hazard block, pickup, trigger zone, moving platform |
| Scripting | Script, module script, scene script, client script, server script, tool script |
| Screen UI | ScreenGui, frame, image label, text button, text box, scrolling frame |
| Advanced | Static mesh, skeletal mesh, procedural mesh, landscape, spline, foliage, world cell, level instance |

Gameplay actors behave in play mode out of the box: a spawn point sets the start position, a checkpoint moves the respawn point, a portal teleports on contact, a door opens and closes, a hazard damages, a pickup is collected and a trigger zone fires a named event into the script runtime. Script actors receive their own actor as `entity` in `start`, `update` and `onevent`.

## Rendering

- **Global illumination** - sky and ground light with a ground bounce. Intensity slider, live sample count.
- **Virtual geometry** - meshlet LOD swaps, sub pixel cluster culling and a triangle budget readout.
- **Cascaded shadows** - near and far cascaded depth pages, retargeted to the camera focus, 512 to 4096 px.
- **World streaming** - level cells streamed in a radius around the camera; the panel lists every cell with its actor count.

All four live in **World settings → Rendering**, are saved with the project and are applied identically in the viewport, in play mode and in packaged builds. **Engine stats** reports what they are actually doing.

## Simulation

- **Physics solver** - sub stepped rigid bodies, static, dynamic and kinematic bodies, joints, mass, friction, restitution, and geometry collection fracture that splits an actor into simulated shards.
- **Character controller** - oriented box resolution with slopes, moving platforms, wall sliding and swept sub steps.
- **Effect graph** - spawn rate, burst, life, velocity, cone spread, gravity, size, colour over life, sprite shape, additive rendering, collision and eight presets.
- **Audio graph** - oscillator, filter, envelope and delay chains synthesised by Web Audio; nothing streams, nothing downloads.
- **Cinematic timeline** - camera and actor tracks with keyframes, a scrubable playhead, looping playback and camera override during play mode.
- **Rig solver** - analytic two bone IK with reach clamping and pole direction.
- **Logic graph** - per actor and per level event sheets: events, conditions, actions, variables.
- **Animator** - state machines with layers, blend trees, parameters and crossfades.

## Multiplayer

The online subsystem is built on PeerJS over WebRTC:

- **Host or join by room code** - the host owns the roster; clients connect peer to peer, no game server.
- **Actor replication** at 20 Hz with interpolation, host snapshots and per peer latency.
- **RPCs** and **chat** on the same data channel.
- Works in play mode and in packaged builds, including the editor to build case.
- Packaged games expose a **Co-op** panel and accept `?room=code&host=1&name=` in the URL.

See [`docs/multiplayer.md`](docs/multiplayer.md).

## Content

**Templates** - seventeen project templates, including an empty scene, a particle lab, a tilemap platformer, a UI menu kit, a navmesh chase and a physics lab, each with its own thumbnail.

**Assets** - material, GLSL shader, animator controller, timeline, localisation, services, data tables and sliced sprite sheets, each with a working editor page. **Sprite editor** with layers, brushes, shapes, stabiliser, palette and undo. **Model library** of fifteen built models, plus OBJ, glTF, GLB, FBX and STL import and navmesh baking with A* agents. **Tilemaps** with twelve tile types, painting, solids and draw order. **Audio mixer** with groups, volume, mute and low-pass routing.

**Overlays and diagnostics** - collider and navmesh overlays, autosave, a shortcut map, an event debugger with breakpoints and stepping, and a profiler with an fps graph.

## Plugins

`Tools → Plugins` opens the plugin manager. A plugin is a small program that adds toolbar buttons, menu commands, docked widgets and event handlers to the editor. It is compiled inside a function scope with the plugin API in front of it (`scene`, `selection`, `transform`, `play`, `ui`, `prefs`, `storage`, `http`, `on`, `onTick`, `onKey`), so it needs no imports. Plugins can be enabled and disabled at any time; disabling one unregisters every button, widget, ticker and event it created. `Export` writes a `.unxplug` file, `Import` reads one back. See [`docs/plugins.md`](docs/plugins.md).

## Controls

Right mouse look, right mouse plus `WASD` fly, `Ctrl` plus wheel for camera speed, `Alt` `G`, `H`, `J` and `K` for perspective, front, top and side, camera bookmarks on the number row, `End` to drop an actor to the floor and `Shift` plus `P` to pilot one. Actors can be locked so they cannot be picked or transformed. The full list is in [`docs/controls.md`](docs/controls.md) and under `Tools → Controls & shortcuts`.

## Packaging

**File → Package game (HTML)** writes one self contained file. The renderer loads from a CDN (`three.js` r149 or `faoxomjs` v6), with a spare library and a canvas 2D painter as fallbacks, so a build never fails to run. The same menu builds an itch.io zip, an Android APK project (WebView activity, manifest, Gradle config, signing profile) and a project folder zip; **Backup** writes a project file; GitHub import and sync move projects through a repository. `exports/demo-game.html` and `exports/mp-game.html` are builds - open either in a browser and play with arrows and space.
