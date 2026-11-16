# Roxumitod Game Engine

**An Unreal Engine 5 style editor that runs on the open web.**

Roxumitod Game Engine is a level editor, a runtime and a packaging pipeline for browser games. It borrows the language, the panel layout and the feature vocabulary of Unreal Engine 5 so that anyone who has opened UE5 can sit down and start working immediately - while every feature runs in plain HTML, CSS and JavaScript, with no install and no build server.

The editor drives two interchangeable renderers: **three.js** and **faoxomjs**. The level, the physics, the effects, the audio, the cinematics and the networking are engine-side, so switching renderer never changes how a level behaves.

---

## The framework at a glance

| Unreal Engine 5 | Roxumitod Game Engine | Where it lives |
| --- | --- | --- |
| Actor | Actor - any object placed in a level | World Outliner |
| Component | Component - Sprite Renderer, Collider, Rigid Body, Particle System, Audio | Details |
| Level | Level - a scene with its own actors, world settings and sequences | Level tabs |
| World Outliner | World Outliner - hierarchy of every actor | Left dock |
| Details | Details - transform, components, tags, variables | Right dock |
| Content Browser | Content Browser - models, sprites, materials, audio | Left dock |
| Play In Editor (PIE) | Play In Editor - simulate in the viewport, with netcode live | Play In Editor |
| Blueprint | Blueprint - event graph logic per actor or level | Left dock → Blueprint |
| Lumen | Lumen - probe based global illumination and bounce light | World Settings → Rendering |
| Nanite | Nanite - virtualized geometry, meshlet LOD and pixel culling | World Settings → Rendering |
| Virtual Shadow Maps | Virtual Shadow Maps - two cascaded shadow pages | World Settings → Rendering |
| World Partition | World Partition - actor cells streamed around the camera | World Settings → Rendering |
| Chaos | Chaos - sub-stepped rigid bodies, joints, geometry collections | Window → Chaos |
| Niagara | Niagara - modular particle systems | Window → Niagara |
| Sequencer | Sequencer - camera and actor tracks with keyframes | Window → Sequencer |
| MetaSounds | MetaSounds - procedural audio graphs | Window → MetaSounds |
| Control Rig | Control Rig - analytic two-bone IK | Window → Control Rig |
| Online Subsystem | Online Subsystem - PeerJS sessions | Window → Online Subsystem |

---

## First ten minutes

1. **Create a level.** Open the launcher, choose a template, press **New project**. The level opens in the editor with a starter scene.
2. **Look around.** Drag with the left mouse button to orbit, with the right button to pan, wheel to zoom. `F` focuses the selection.
3. **Place an actor.** Press **Add** in the World Outliner, or use **Tools → Add actor…**. The new actor appears in the outliner and is selected.
4. **Edit it.** The **Details** panel shows the transform, the component stack and the tags. Change the position, add a Collider, then add a Sprite Renderer.
5. **Give it behaviour.** Open the **Blueprint** tab and add an event: *on start*, *each frame*, *on collide*, *on trigger*.
6. **Play.** Press **Play In Editor**. The level simulates inside the viewport; `Esc` returns to editing.
7. **Light it.** Open **World Settings → Rendering** and turn on **Lumen**, **Nanite** and **Virtual Shadow Maps**. The same switches exist in the packaged build.
8. **Package.** **File → Package game (HTML)** writes a single self-contained file you can upload anywhere.

---

## What is actually simulated

- **Rendering** - three.js or faoxomjs, both fed by the same item list, camera state and environment block.
- **Geometry** - meshes, sprites, tilemaps, terrain, water, curves, 3D text and imported models.
- **Physics** - an oriented-box character controller with slopes, plus a rigid-body solver with joints, sub-stepping and fracture.
- **Effects** - a modular particle system with presets, colour over life, gravity, collision and additive glow.
- **Audio** - procedural MetaSounds graphs rendered by WebAudio, plus per-actor audio components.
- **Logic** - event sheets evaluated per actor and per level, with variables, globals and actions.
- **Cinematics** - Sequencer tracks that drive the camera and actor transforms during PIE.
- **Networking** - PeerJS sessions with replicated actors, RPCs and interpolation.
- **Persistence** - projects, levels and assets saved in the browser, exportable as `.ugm` backups or folders.

---

## Reading order

- [Levels and actors](levels-and-actors.md) - the object model, components and the World Outliner.
- [Rendering](rendering.md) - Lumen, Nanite, Virtual Shadow Maps, World Partition and the renderer switch.
- [Physics and destruction](physics.md) - Chaos bodies, joints, geometry collections.
- [Niagara effects](niagara.md) - particle systems and their modules.
- [MetaSounds](metasounds.md) - procedural audio graphs.
- [Sequencer](sequencer.md) - camera and actor tracks.
- [Control Rig](controlrig.md) - two-bone IK.
- [Blueprints](blueprints.md) - event graph logic.
- [Multiplayer](multiplayer.md) - PeerJS sessions, rooms, replication and RPCs.
- [Packaging](packaging.md) - HTML, itch.io, Android and backup exports.


---

## Systems added in this pass

| System | What it does | Where it lives | Reference |
| --- | --- | --- | --- |
| Physical transform handles | Box corner and edge handles for scale, spin ring for rotation, axis arrows for move - all draggable in the viewport | Viewport | `docs/controls.md` |
| Actor lock | A locked actor cannot be picked, marqueed, transformed or deleted | Outliner, Details, Tools | `docs/controls.md` |
| Plugin system | Roblox Studio style plugins with toolbar buttons, commands, widgets and an API | Tools → Plugins | `docs/plugins.md` |
| Sky atmosphere | Sun vector, sky light, height fog, volumetric clouds, stars, water | Tools → Sky atmosphere | `docs/rendering.md` |
| Post process | Exposure, bloom, vignette, grain, chromatic aberration, saturation, contrast, temperature, motion blur | Tools → Sky atmosphere | `docs/rendering.md` |
| Lightmass bake | Traces sun occlusion per actor and writes it into shading | Tools → Sky atmosphere | `docs/rendering.md` |
| Landscape | Real heightmap terrain with a sculpt brush and resolution control | Tools → Landscape | `docs/levels-and-actors.md` |
| Foliage mode | Paint instances onto the surface | Tools → Landscape | `docs/levels-and-actors.md` |
| PCG | Deterministic scatter of generated content into a group | Tools → PCG | `docs/levels-and-actors.md` |
| Data layers, prefabs, LOD | Stream actor groups, save selections as level instances, per actor LOD distance | Tools → Data layers | `docs/levels-and-actors.md` |
| Cine camera, take recorder, movie render queue | Camera actor with focal length, camera key baking, WebM and PNG capture | Tools → Cinematics | `docs/sequencer.md` |
| UE5 navigation | Right mouse look, WASD fly, ortho views, bookmarks, pilot, immersive | Viewport | `docs/controls.md` |
| GUI service | ScreenGui actors with screen space elements, plus a Physical toggle for world space GUI | Tools -> GUI service | `docs/levels-and-actors.md` |
| Closeable sections | Every section header has an X and can be restored from its strip | Every panel | `docs/controls.md` |

---

## Advanced systems

The engine ships a second layer of systems on top of the framework above. Every one of them is wired into the editor and reachable from the **Feature hub** in the Window and Tools menus, or from the command bar.

| Domain | Systems |
| --- | --- |
| Rendering | Skeletal mesh rendering, material system, shader authoring, decals, screen space reflections, ray tracing, temporal and upscaler presets, lightmaps, virtual textures, LOD and HLOD, post materials with stencils, lens effects, volumetric lighting, refraction, cloth, hair, fur and eyes |
| World | CSG solids, mesh editing, sculpting, landscape layers, splines and roads, foliage instancing, world partition, level instances, procedural meshes, terrain collision fidelity |
| Animation | Clip editor, blend spaces, montages, bone limits, control rig, ragdoll, notifies, root motion, facial morphs |
| Physics | Constraints, vehicles, character controller, collision channels, continuous collision, fields, destruction, soft bodies, fluid, buoyancy |
| Effects and audio | Effect graph, GPU style simulation, audio graph, spatialisation, voice chat, music sequencer |
| Logic | Visual scripting, script runtime, lint and type checking, hot reload, debugger, profiler |
| Pipeline | Packages, version history, source control, marketplace, device emulator, play testing, command bar, dock layouts, themes, keybinds, crash recovery, accessibility |
| Live | Anti cheat, teleport, leaderboards, stats, experiments, remote config, lag compensation |
| Input and assets | Touch, gamepad, VR, localisation, texture import and compression, animation import, audio import, dependency graph, texture painting |

The per system reference, including the exact algorithm and the stated hardware approximation for ray tracing, upscaling and GPU simulation, is in [`advanced-systems.md`](advanced-systems.md).
