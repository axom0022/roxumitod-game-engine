# Roxumitod Game Engine

**A realtime game editor that runs in the browser.**

Roxumitod Game Engine is a level editor, a runtime and a packaging pipeline for browser games, written in plain HTML, CSS and JavaScript. There is nothing to install and no build server: open the page, pick a template, and press Play.

The editor drives two interchangeable renderers, **three.js** and **faoxomjs**. Levels, physics, effects, audio, cinematics and networking are engine side, so switching renderer never changes how a level behaves.

---

## Concepts

| Concept | What it is | Where it lives |
| --- | --- | --- |
| Actor | Any object placed in a level | Outliner |
| Component | A reusable behaviour attached to an actor | Details |
| Level | A scene with its own actors, world settings and cinematics | Level tabs |
| Outliner | The hierarchy of every actor in the level | Left dock |
| Content | Models, sprites, materials, audio and prefabs | Left dock |
| Logic graph | Event driven behaviour for an actor or a level | Left dock |
| Details | Transform, components, tags and variables for the selection | Right dock |
| World settings | Environment, rendering, streaming and lighting | Right dock |
| Play in viewport | Runs the level in place, with physics, audio and netcode live | Toolbar |
| Global illumination | Sky and ground light with a ground bounce | World settings, rendering |
| Virtual geometry | Meshlet LOD with sub pixel cluster culling | World settings, rendering |
| Cascaded shadows | Two shadow pages retargeted to the camera | World settings, rendering |
| World streaming | Cells loaded around the camera | World settings, rendering |
| Physics solver | Sub stepped rigid bodies, joints and fracture | Window, physics |
| Effect graph | Modular particle systems wired as nodes | Window, effect graph |
| Audio graph | Procedural audio wired as nodes | Window, audio graph |
| Cinematic timeline | Camera and actor tracks with keyframes | Window, cinematics |
| Rig solver | Analytic two bone IK | Window, rig solver |
| Online subsystem | Peer sessions over WebRTC | Window, online |

---

## First ten minutes

1. **Create a level.** Open the launcher, choose a template, press **New project**.
2. **Look around.** Drag the left mouse button to orbit, the right button to pan, the wheel to zoom. `F` focuses the selection.
3. **Place an actor.** Press **Add** in the Outliner, or use **Tools → Add actor…**. The Add menu is grouped: shapes, lighting, sound, effects, gameplay, scripting, screen UI and the advanced world actors.
4. **Move it.** `W` move, `E` rotate, `R` scale. Drag the box handles to resize a face; hold `Alt` to resize from the centre.
5. **Give it behaviour.** Add a `Script` actor and write code, or open the **Logic graph** tab and add an event: on start, each frame, on collision, on event.
6. **Light it.** Add point, spot or area lights from the Add menu, then open **World settings → Rendering** for global illumination and cascaded shadows.
7. **Press Play.** Physics, scripts, particles, audio and the network stack start. `Esc` stops and restores the editor.

---

## What is in the box

- **Levels** built from actors and components, with full undo, copy and paste, nesting, locking, hide and show, and a lighting aware viewport.
- **Scripting** in JavaScript with modules, imports, live bindings and hooks: `start`, `update`, `onevent`, `oncollision`, `oncollect`. Every script actor receives its own actor as `entity`.
- **Rendering** with two backends, tone mapping, bloom, depth of field, ambient occlusion, fog, sky, shadows and per level environment settings.
- **World building** with CSG solids, mesh editing and sculpting, landscape layers, splines and roads, foliage instancing, world streaming and level instances.
- **Physics** with rigid bodies, joints, vehicles, a character controller, collision channels, continuous collision, fields, fracture, cloth and fluid.
- **Effects** with a node graph, a GPU style particle simulation, decals, screen space reflections, volumetric light and lens effects.
- **Audio** with a node graph, spatialisation, mixer routing, voice chat and a music machine.
- **Cinematics** with keyframed camera and actor tracks.
- **Multiplayer** over WebRTC with rooms, replication, RPCs and chat.
- **Packaging** to a single HTML file, an itch.io zip, an Android project or a project backup.

---

## Where to read next

- [Controls & shortcuts](controls.md)
- [Levels and actors](levels-and-actors.md)
- [Rendering](rendering.md)
- [Physics and destruction](physics.md)
- [Effects](effects.md)
- [Audio](audio.md)
- [Cinematics](cinematics.md)
- [Rigging](rigging.md)
- [Logic graph](logic.md)
- [Plugins](plugins.md)
- [Multiplayer](multiplayer.md)
- [Packaging](packaging.md)
- [Advanced systems reference](advanced-systems.md)

---

## Editor map

| Area | What it covers | Location |
| --- | --- | --- |
| Outliner | Every actor, grouped and searchable | Left dock |
| Content | Imported models, sprites, sounds, prefabs | Left dock |
| Logic graph | Event sheets per actor and per level | Left dock |
| Details | Transform, components, tags, variables | Right dock |
| World settings | Environment, streaming, lighting, collisions | Right dock |
| Feature hub | A searchable list of every system in the engine | Window, Feature hub (`Ctrl+Shift+F`) |
| Command bar | Runs any action or panel by name | `Ctrl+K` |
| Device emulator | Five device profiles for play testing | Window, device emulator |
| Multi client test | Up to four clients in tiles | Window, multi client |

## Systems index

| Domain | What it includes | Documentation |
| --- | --- | --- |
| Rendering | Global illumination, virtual geometry, cascaded shadows, streaming, post effects, decals, reflections, volumetrics, lens | `rendering.md` |
| World | CSG, sculpting, landscapes, splines, foliage, streaming, instances | `advanced-systems.md` |
| Animation | Clips, blend spaces, montages, bone limits, rig solver, ragdoll, notifies, morphs | `advanced-systems.md` |
| Physics | Bodies, joints, vehicles, character, channels, CCD, fields, fracture, cloth, fluid | `physics.md` |
| Effects | Effect graph, GPU simulation, decals, volumetrics | `effects.md` |
| Audio | Audio graph, spatialisation, voice, music | `audio.md` |
| Logic | Script runtime, logic graph, lint, types, hot reload, debugger, profiler | `logic.md` |
| Pipeline | Packages, versions, source control, marketplace, devices, command bar, themes, keys, recovery, accessibility | `advanced-systems.md` |
| Live | Anti cheat, teleport, leaderboards, experiments, lag compensation | `advanced-systems.md` |
| Input | Touch, gamepad, VR, localisation | `advanced-systems.md` |
| Assets | Texture import and compression, animation import, audio streaming, dependency graph, texture painting | `advanced-systems.md` |
