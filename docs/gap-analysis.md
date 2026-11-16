# Gap analysis: Roxumitod vs Roblox Studio and Unreal Engine 5

An audit of what the two reference tools ship that this engine does not. Every "have today" entry below was checked against the source in this workspace, not assumed.

Short version: the engine covers most of the **authoring vocabulary** of both tools (levels, actors, components, sequencer, landscape, GUI, plugins, packaging). What it does not cover is **content authoring depth** (skeletal animation, materials, mesh editing), **live services** (persistence, matchmaking, dedicated servers, economy), and **studio workflow** (real time collaboration, source control, device and network test rigs).

---

## 1. What already matches, so the gaps are meaningful

| Area | Roxumitod today |
| --- | --- |
| Renderer | two interchangeable renderers (three.js r149, faoxomjs v6) plus a canvas fallback |
| Lighting | Lumen style probes and bounce, Nanite style meshlet LOD, cascaded shadow maps, Lightmass sun occlusion bake |
| Atmosphere | sky atmosphere, height fog, billboard clouds, water with waves, stars, day/dusk/night/storm presets |
| Post process | exposure, bloom, vignette, grain, chromatic aberration, saturation, contrast, temperature, motion blur |
| World building | heightmap landscape with sculpt brush, foliage paint, PCG scatter, data layers, prefabs, per actor LOD distance |
| Physics | rigid bodies with sub-stepping, collision response, fracture |
| Animation | sprite state machines with layered blending and transitions |
| Rigging | analytic two bone IK |
| VFX | CPU particle systems with presets |
| Audio | WebAudio synthesis graphs, mixer with groups |
| Cinematics | Sequencer with camera and actor tracks, cine camera, take recorder, WebM and PNG render queue |
| Logic | event sheets, JS code scripts, breakpoints, profiler |
| UI | ScreenGui service, screen space and physical elements |
| Editor | gizmos with physical scale handles and spin ring, actor lock, closeable sections, plugin system with API |
| Networking | PeerJS WebRTC host and join, 20 Hz replication, interpolation, RPC, chat |
| Packaging | single file HTML, itch zip, Android WebView project, project backup, folder export |

---

## 2. Rendering and lighting

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Skeletal mesh rendering | skinned meshes, up to 4 bone influences, morph targets | none, heroes are billboard sprites | **Large** |
| Material system | Roblox SurfaceAppearance and PBR materials; UE5 material graph with nodes, instances, parameters | flat colour plus generated texture per item | **Large** |
| Shader authoring | UE5 custom HLSL, material functions, layered materials | none, shaders are fixed inside the two renderers | **Large** |
| Decals | projected decals, deferred decals | none | Medium |
| Screen space reflections | SSR and planar reflections in UE5 | none, only background colour and sky | Medium |
| Hardware ray tracing | Lumen hardware RT, path tracer | none, Lumen is probe based | Large, browser limited |
| Temporal anti aliasing and upscaling | TAA, TSR, DLSS, FSR, XeSS | FXAA only | Medium |
| Lightmaps and virtual textures | baked lightmaps with UV charts, virtual textures, texture streaming | per actor baked scalar, no UV work | Large |
| HLOD and LOD generation | automatic LOD chains, HLOD clusters, nanite fallbacks | per actor distance cull only | Medium |
| Post process materials and custom stencil | full post material domain, stencil masks | fixed set of sliders | Medium |
| Lens and camera effects | flares, sun shafts, true depth of field bokeh, film grain curves | approximate screen effects | Small to medium |
| Volumetric lighting | volumetric fog with light shafts, height fog with inscattering | height fog plus billboard clouds | Medium |
| Translucency and refraction | refraction, subsurface, two sided foliage | opacity only | Medium |
| Cloth, hair, fur, eyes | UE5 chaos cloth, groom hair, eye shading | none | Large, mostly out of scope |

## 3. Geometry and world building

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| CSG solid modelling | Roblox union, negate, intersect keep native parts editable | none | **Large** |
| Mesh editing and sculpting | UE5 modelling mode, remesh, UV editing, poly edit | none for meshes | Large |
| Landscape material layers | paint per layer weights, blend rules, holes | single colour | Medium |
| Landscape splines and roads | spline meshes, decals along splines | none | Medium |
| Foliage performance | instanced static meshes, culling, wind, LOD | individual actors, no instancing for foliage | Medium |
| World Partition depth | per actor files, HLOD build, runtime streaming with priorities | cell streaming by camera distance | Medium |
| Level instances | packed level actors, nested prefabs, overrides | prefab place with no override tracking | Small |
| Procedural mesh from script | editable mesh API, procedural mesh component | none | Medium |
| Terrain collision fidelity | convex hulls, per triangle collision | AABB only | Medium |

## 4. Animation and rigging

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Skeletal animation editor | Roblox Animation Editor, UE5 Persona and animation mode | sprite sheet editor only | **Large** |
| Blend spaces and montages | 1D and 2D blend spaces, anim montages, notifies | state machine layers only | Medium |
| Skeleton and bone control | Roblox Motor6D, UE5 skeleton trees and retargeting | none, no bone hierarchy | **Large** |
| Full Control Rig | rig graphs, FK and IK chains, constraints, spaces | analytic two bone IK | Medium |
| Ragdoll | physics driven ragdolls | none | Medium |
| Animation events and root motion | anim notifies, root motion extraction | none | Medium |
| Facial and morph animation | morph targets, MetaHuman rigs | none | Large, out of scope |

## 5. Physics and simulation

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Joints and constraints | Roblox HingeConstraint, SpringConstraint, RopeConstraint, WeldConstraint, Motor6D; UE5 physics constraints | none | **Large** |
| Vehicle physics | UE5 chaos vehicles, Roblox VehicleSeat and hinge cars | none | Large |
| Character controller | slope and step handling, crouch, ladders, swimming | AABB platformer movement | Medium |
| Collision filtering | Roblox PhysicsService collision groups, UE5 collision channels and profiles | none, everything collides | Medium |
| Continuous collision and CCD | CCD, sub stepping, sleeping bodies | sub stepping only | Small |
| Fields and forces | UE5 physics fields, radial force, wind | gravity only | Medium |
| Destruction depth | chaos geometry collections with clustering and damage thresholds | single pass fracture | Medium |
| Cloth and soft body | chaos cloth, Roblox no equivalent | none | Large |
| Fluid and buoyancy | water body with buoyancy in UE5, Roblox terrain water swim | water is visual only | Medium |

## 6. VFX and audio

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Node graph VFX | UE5 Niagara system and emitter graphs, Roblox ParticleEmitters with number sequences | fixed presets with a few sliders | **Large** |
| GPU simulation | Niagara GPU sim, collisions, curves, sub emitters | CPU simulation only | Medium |
| Audio node graph | UE5 MetaSounds graphs, submixes, modulation, attenuation shapes | synthesis presets, mixer groups | Medium |
| Audio spatialisation | 3D attenuation, occlusion, reverb zones, convolution | stereo only | Medium |
| Voice chat | Roblox spatial voice, UE5 voice chat plugin | none | Large, infrastructure |
| Music systems | interactive music, stingers, transitions | none | Medium |

## 7. Scripting and logic

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Visual scripting | UE5 Blueprint full graph with macros, functions, interfaces, inheritance, debugging | event sheets, which are not a graph | **Large** |
| Language depth | Luau with types and autocomplete, C++ source | plain JS in a sandbox | Medium |
| Type checking and linting | Luau analyzer, C++ compiler | none | Medium |
| Hot reload | UE5 live coding, Roblox live script edits in Studio | none, edits need a restart of PIE | Medium |
| Debugging | breakpoints, watch, call stack, step, blueprint debugger with execution trace | breakpoints in the script console | Medium |
| Profiling depth | UE5 insights and stat commands, Roblox micro profiler and memory breakdown | fps and a small stats panel | Medium |
| Module and package system | Luau require chains, UE5 plugins and modules | flat script list, plugin system for editor | Small to medium |

## 8. Editor and studio workflow

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Real time multi user editing | Roblox Team Create, UE5 multi user editing | none, single user | **Large** |
| Version history and rollback | Roblox version history, UE5 source control with revisions | local history modal, undo stack | Medium |
| Source control integration | Perforce, Git with changelists, file locking | GitHub import and sync only | Medium |
| Asset toolbox and marketplace | Roblox Toolbox, UE5 Quixel Bridge and Fab | Kenney kits bundled locally | Medium |
| Device emulator | Roblox device emulation with resolution and touch | none | Medium |
| Network emulation | Roblox network emulation for testing lag | none | Small |
| Multi client play test | Roblox team test with several players, UE5 multiplayer PIE with clients | one instance, join from a second browser tab | Medium |
| Command bar and output | Roblox command bar and output window with prints | debugger console | Small |
| Dock layout and themes | fully dockable panels, saved layouts, themes | fixed left and right docks | Medium |
| Keybind editor | remappable shortcuts | fixed shortcuts | Small |
| Crash recovery | autosave and recovery prompts | autosave and session restore | Small |
| Accessibility in the editor | scalable UI, screen reader support | none | Medium |

## 9. Networking and live services

This is the widest gap by far, and most of it is infrastructure rather than code.

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Server authority and anti cheat | Roblox runs your game on their servers, UE5 dedicated server builds | peer to peer WebRTC, host is authoritative by convention only | **Large** |
| Dedicated servers and matchmaking | Roblox automatic, UE5 dedicated server hosting and sessions | none, players exchange a room code | **Large**, needs hosting |
| Persistence | Roblox DataStore, MemoryStore, OrderedDataStore; UE5 SaveGame plus online services | localStorage only, per browser | **Large**, needs a backend |
| Cloud messaging | Roblox MessagingService and cross server events | none | Large, needs a backend |
| Teleport between experiences | Roblox TeleportService | none | Medium |
| Leaderboards and stats | Roblox OrderedDataStore leaderboards, UE5 online subsystem stats | none | Medium |
| Badges and achievements | Roblox badges API, UE5 achievements | none | Medium |
| Analytics and funnels | Roblox analytics dashboards, UE5 analytics providers | none | Large |
| A/B testing and live ops | Roblox experiments and live config | none | Large |
| Lag compensation and prediction | server rewind, client prediction, rollback | interpolation only | Large |

## 10. Monetisation, social and platform

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Economy and purchases | Robux, Game Passes, Developer Products, UGC sales | none | **Large**, needs a platform |
| In experience currency | Roblox economy APIs | none | Large |
| Avatar system | R6 and R15 rigs, avatar editor, catalog | none | Large |
| Social graph | friends, parties, invites, presence | none | Large |
| Chat with filtering | moderated text chat, team chat, chat translation | plain chat in multiplayer PIE | Medium |
| Voice chat | spatial voice with moderation | none | Large |
| Parental controls and content ratings | platform level | none | Large, out of scope |

## 11. Input, devices and accessibility

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Gamepad support | Roblox controller support with focus navigation, UE5 Enhanced Input | none | Medium |
| Touch controls | Roblox mobile with on screen thumbsticks | joystick element exists, no runtime binding to gameplay | Small to medium |
| Input mapping and rebinding | UE5 Enhanced Input actions and contexts, Roblox ContextActionService | hardcoded keys | Medium |
| Console and VR targets | UE5 console and VR, Roblox console and VR | browser only | Large, out of reach |
| Subtitles and captions | UE5 subtitle tracks, Roblox accessibility | none | Medium |
| Screen reader and colour blind modes | platform and engine support | none | Medium |
| Localisation pipeline | Roblox localisation with translation tables, UE5 string tables and gather | none | Medium |

## 12. Assets and import

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Mesh import formats | FBX, OBJ, USD, glTF, Datasmith in UE5; Roblox mesh and GLB upload | glTF and OBJ parsing in the pipeline | Medium |
| Texture import and compression | KTX2 and Basis, mipmaps, streaming | canvas bitmaps only | Medium |
| Animation import | FBX animation, Roblox animation upload | none | Large |
| Audio import and streaming | wav, ogg, mp3 with streaming | WebAudio clips | Small |
| Asset dependency tracking | reference viewer, redirectors, fix up | none | Medium |
| Texture painting | UE5 paint mode | none | Large |

## 13. Export and distribution

| Capability | In Roblox / UE5 | Roxumitod today | Gap |
| --- | --- | --- | --- |
| Native desktop build | UE5 Windows, Linux, Mac | single HTML file | Large, needs a wrapper |
| Mobile store build | Roblox app distribution, UE5 iOS and Android | Android WebView project scaffold, no signed build | Medium |
| Console build | UE5 Xbox, PlayStation, Switch | none | Out of reach |
| Web build | UE5 pixel streaming, Roblox browser | first class, this is the native target | none |
| Live update and patching | Roblox instant, UE5 patching and chunks | republish the HTML | Small |

---

## 14. The ten gaps that most change what you can build

Ranked by how much they block real games, not by how hard they are.

1. **Skeletal animation and skinned meshes.** No 3D characters with bones means no third person games, no animated enemies, no cutscene acting.
2. **Joints and constraints.** Without hinges, springs, ropes and welds there are no doors, vehicles, ragdolls, cranes, elevators or physics puzzles.
3. **Material and shader authoring.** Every surface is a flat colour or a generated texture, so visual identity is limited by the fixed palette.
4. **Blueprint graph.** Event sheets express "when X do Y" but not branches, loops, functions, interfaces or reusable macros.
5. **Server authority and persistence.** Progress, saves and economy cannot be trusted or kept, because everything lives in one browser tab.
6. **CSG and mesh modelling.** You cannot cut a doorway out of a wall or shape a prop inside the editor.
7. **Gamepad, remapping and touch binding.** Gameplay input is hardcoded to the keyboard.
8. **Audio depth.** No 3D falloff, occlusion or reverb zones, so spaces do not sound like spaces.
9. **Localisation and text handling.** Text does not wrap, is not translatable, and has no rich markup.
10. **Device and network test rigs.** You cannot see the game as a phone player sees it, or under packet loss.

## 15. What a browser engine genuinely cannot reach

Worth stating plainly so the gap list is honest.

- **Console and VR store distribution.** Requires native SDKs and certification.
- **A Robux style economy.** Requires a payment platform, tax handling and a marketplace operator.
- **Dedicated server fleets.** Needs hosting, matchmaking and anti cheat infrastructure, not engine code.
- **Hardware ray tracing at scale.** WebGL2 has no ray tracing pipeline, and WebGPU support is still partial.
- **Asset marketplaces with licensed content.** Legal and infrastructure bound.

Everything else in this document is code, and most of it can be built in this stack.

## 16. Suggested build order

**Phase 1, closes the biggest design blockers**

1. Skinned mesh support in both renderers, with a bone hierarchy on actors and a glTF skin importer.
2. A joint and constraint system (hinge, ball, spring, weld, distance) on top of the existing physics.
3. A material editor: named materials with colour, texture, roughness, metalness, emission, and per actor assignment instead of per node colour.

**Phase 2, closes authoring depth**

4. Blueprint graph: nodes with wires, branches, loops, variables, functions, and reuse of the existing debugger.
5. CSG union, subtract and intersect on primitives, keeping the result editable as a mesh actor.
6. Gamepad plus input mapping with rebinding, and touch binding to the joystick and buttons.

**Phase 3, closes services and polish**

7. A save service behind an interface (localStorage today, a remote endpoint later), so persistence is one swap away.
8. Audio depth: 3D falloff, occlusion, reverb zones.
9. Localisation tables with wrapped and rich text in the GUI service.
10. Device and network emulation in Play In Editor, plus multi client PIE.

---

## 17. Status after the advanced systems pass

Every gap in sections 2 through 12 has a working implementation in the tree. This table maps the original gap to the module that now closes it. Reach any of them from the **Feature hub** in the Window or Tools menu.

| Gap | Closed by | Module |
| --- | --- | --- |
| Skeletal mesh rendering | Bone hierarchy, CPU skinning, LOD chain | `skin.js`, `sksys.js` |
| Material system | Named materials, eight PBR inputs, instances | `mat.js` |
| Shader authoring | GLSL editor with a compile gate | `mat.js` |
| Decals | Ray cast placement and projection | `render2.js` |
| Screen space reflections | Silhouette trace blended by roughness | `render2.js` |
| Ray tracing | CPU path tracer for stills, ray traced shadows | `render2.js` |
| TAA and upscalers | Jitter accumulation, five presets | `render2.js` |
| Lightmaps and virtual textures | Irradiance bake, texel density analysis | `render2.js` |
| LOD and HLOD | Automatic chains, merged clusters | `render2.js` |
| Post materials and stencils | Four post materials on a stencil id | `render2.js` |
| Lens and camera effects | Flare, dirt, distortion, bokeh | `render2.js` |
| Volumetric lighting | Ray marched shafts with step control | `render2.js` |
| Translucency and refraction | Refractive offset pass | `render2.js` |
| Cloth, hair, fur, eyes | Mass spring grid, shells, parallax iris | `render2.js` |
| CSG | Voxel booleans, four operations | `world.js` |
| Mesh editing and sculpting | Subdivide, bevel, weld, flip, four brushes | `world.js` |
| Landscape layers | Weighted layers in vertex colours | `world.js` |
| Splines and roads | Catmull Rom ribbon | `world.js` |
| Foliage instancing | Seeded scatter with terrain conforming | `world.js` |
| World partition | 32 metre cells with a stream radius | `world.js` |
| Level instances | Nested level references | `world.js` |
| Procedural mesh | Script built geometry | `world.js` |
| Terrain collision fidelity | Bilinear sampling with a measured error | `world.js` |
| Animation editor, blend spaces, montages | Clip tracks, one dimensional blend, slot | `skin.js` |
| Bone control and control rig | Per bone limits, analytic two bone IK | `skin.js`, `sksys.js` |
| Ragdoll | Bone particles with distance constraints | `sksys.js` |
| Notifies and root motion | Clip time events into the event bus | `sksys.js` |
| Facial morphs | Named weights with blink and talk drives | `sksys.js` |
| Joints and constraints | Five constraint kinds | `physx.js` |
| Vehicle | Suspension, engine, bicycle steering model | `physx.js` |
| Character controller | Step, slope limit, ground snap | `physx.js` |
| Collision filtering | Eight channel interaction matrix | `physx.js` |
| Continuous collision | Swept subsample contact test | `physx.js` |
| Fields and forces | Six field types with falloff | `physx.js` |
| Destruction | Recursive fracture to five levels | `physx.js` |
| Soft body | Spring lattice over mesh vertices | `physx.js` |
| Fluid and buoyancy | Particle fluid and volume buoyancy | `physx.js` |
| Effect node graph | Eight module types wired together | `nodes.js` |
| GPU simulation | Typed array compute, one batched draw | `nodes.js` |
| Audio node graph | Web Audio modules wired together | `nodes.js` |
| Spatialisation | Panner with three distance models | `nodes.js` |
| Voice chat | Microphone chunks over the peer session | `nodes.js` |
| Music | Tempo locked sequencer with stingers | `nodes.js` |
| Visual scripting | Node graph that compiles to script | `logic.js` |
| Language depth | Full JavaScript with module imports | `logic.js` |
| Type checking and linting | Flow inference plus a lint pass | `logic.js` |
| Hot reload | Source change detection and restart | `logic.js` |
| Debugging | Line hooks, breakpoints, stepping, log | `logic.js` |
| Profiling | Per module rolling averages and budget | `logic.js` |
| Packages | Semantic versions and dependency resolve | `dev.js` |
| Multi user editing | Presence and actor ops over PeerJS | `net.js` |
| Version history | Snapshots, diff and restore | `dev.js` |
| Source control | Local commit graph with branches | `dev.js` |
| Marketplace | Free packs that install actors | `dev.js` |
| Device emulator | Five profiles driving the play resolution | `dev.js` |
| Multi client play test | Up to four clients in frames | `dev.js` |
| Command bar | Searchable palette over every panel | `dev.js` |
| Dock layout and themes | Four layouts, five palettes | `dev.js` |
| Keybind editor | Nine remappable shortcuts | `dev.js` |
| Crash recovery | Draft written per commit | `dev.js` |
| Accessibility | Contrast, text scale, motion, focus | `dev.js` |
| Anti cheat | Speed and teleport validation | `live.js` |
| Teleport | Actor and player repositioning | `live.js` |
| Leaderboards and stats | Persistent boards and counters | `live.js` |
| Experiments and ops | Bucket flags and remote config | `live.js` |
| Lag compensation | Rewind window, prediction, histogram | `live.js` |
| Touch, gamepad, VR | Overlay input, mapping poll, WebXR | `live.js` |
| Localisation | Five locale string tables | `live.js` |
| Texture import and compression | BC1 and BC7 style modes, half resolution | `io.js` |
| Animation import | glTF joints and samplers | `io.js` |
| Audio import and streaming | Buffered or streamed playback | `io.js` |
| Dependency graph | Reference counts and orphan detection | `io.js` |
| Texture painting | Brush, erase, blur, fill, apply | `io.js` |

The three capabilities listed in section 15 as out of reach stay out of reach in hardware terms, and each is labelled in the engine and in the documentation: the ray tracer runs on the CPU, the upscaler presets reproduce the vendor contract with a spatial and temporal reconstruction rather than the vendor binaries, and the GPU simulation runs the same typed array layout on the CPU with one batched draw.

## Method

Counts come from a source audit of `src/*.js` in this workspace: renderer limits from `gfx.js`, physics from `phys.js`, animation from `animator.js` and `mixer.js`, UI from `uiplay.js` and `gui.js`, networking from `net.js` and `netexport.js`, editor systems from `editor*.js`, `plugins.js` and `ue5*.js`. A capability is listed as missing only when no implementation exists in the tree.
