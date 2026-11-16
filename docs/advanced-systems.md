# Advanced systems reference

Every capability below is implemented in the engine source, reachable from the editor, and saved with the level. Open the **Feature hub** (Window menu, Tools menu, or `Ctrl+Shift+F`) to jump straight to any of them, or press `Ctrl+K` for the **Command bar** and type the name.

Where a capability cannot run on browser hardware as it would on a discrete GPU, the implementation is a real algorithm with a stated approximation. Those cases are labelled **Hardware limit**, and the note says what the engine computes.

---

## Rendering

### Skeletal mesh rendering
The rig solver. A humanoid rig carries Root, Hips, Spine, Chest, Neck, Head, Arm and Forearm left and right, Thigh and Shin left and right, plus a quadruped preset. `skingenmesh` builds a tube mesh per bone segment, skins it in world space, and pushes it to the renderer as a custom geometry with a per version geometry key so animation updates redraw at the same cost as a static mesh. Bone rotation, parenting, world transform, LOD distance and morph weights all live on the actor.

### Advanced material system
The material library holds named material assets with base colour, roughness, metalness, opacity, clearcoat, subsurface, normal strength, refraction, index of refraction, emission colour and strength, blend mode, two sided flag, parallax depth, stencil id and decal sprite. Materials are stored in local storage, assigned per actor, and compiled to a three.js standard or physical material, or to a shader material when the material owns custom GLSL.

### Shader authoring
Vertex and fragment source are edited in the material panel. `shadercheck` gates the compile: it requires `void main`, an output write, balanced braces and semicolons. Valid source is compiled into a `ShaderMaterial` with `time`, `tint`, `scale`, `amp` and `speed` uniforms, and every actor using the material updates at once.

### Decals
`decaladd` ray casts from the viewport centre through the pick volumes, finds the nearest surface point and stores a decal with sprite, position, normal, size, rotation and fade. `r2decals` projects each decal through the camera matrix every frame.

### Screen space reflections
`r2ssr` samples the previous frame upside down across the lower silhouette and blends it by strength, standing in for a depth buffer trace. A roughness term in the material reduces the blend.

### Ray tracing
`rtstill` is a real path tracer: it builds a box hierarchy over every visible actor, jitters each pixel across `samples` subframes, marches primary and shadow rays with a slab test, and writes an `ImageData` to a PNG. `rt` also enables ray traced contact shadows in the viewport.
**Hardware limit**: the browser exposes no ray tracing pipeline, so the tracer runs on the CPU in JavaScript. Shadow rays are counted against every box, so cost scales with actor count squared.

### Temporal anti aliasing and upscalers
`taa` accumulates jittered frames. The upscaler selector offers TSR, DLSS, FSR and XeSS presets that change the internal render ratio between 50 and 100 percent and the badge in the viewport reports the active preset and scale.
**Hardware limit**: DLSS, FSR and XeSS are vendor upscalers with no browser binding. The engine implements the same contract, a lower internal resolution feeding a spatial and temporal reconstruction pass, and reports the ratio it renders at.

### Lightmaps and virtual textures
`lightmapbake` samples eight points on the top face of every actor, casts shadow rays to the sun and stores a visibility term per actor. `vtexanalyse` walks every mesh actor, computes texel density from its world area and derives a mip count.

### LOD and HLOD
`lodgen` writes a far distance and three levels to every actor. `hlodbuild` buckets actors into twelve metre cells and records merged clusters that are culled past the far clip. Skeletal meshes carry their own `lodfar` and `lods` arrays and `skinlodapply` maps distance to the active level.

### Post material domain and stencil
`r2post` runs one of outline, toon, scanline or heat over the frame at a chosen stencil id and strength. The outline pass traces the screen space silhouette of every pick volume.

### Lens and camera effects
`r2flare` renders a sun flare with an adjustable number of aperture blades, a lens dirt overlay, and `r2dof` a bokeh disc ring. Distortion applies a canvas blur filter scaled by the lens setting.

### Volumetric lighting
`r2volume` marches a configurable number of steps from the camera to the sun position and accumulates screen blended radial gradients, giving shafts and inscatter that respond to volume density and step count.

### Translucency and refraction
`r2refract` offsets three copies of the frame by the refraction strength. Material level refraction feeds the physical material transmission term.

### Cloth, hair, fur and eyes
The cloth step is a position based mass spring grid: gravity, wind, damping, and three relaxation passes over structural links, pinned at the first row. `hairnew` and `furnew` add groom and shell actors with strand, length, curl, shell and density parameters. `eyesnew` adds a parallax iris with catch light.

---

## World building

### CSG solid modelling
`csgselected` rasterizes every selected actor into a shared 22 cubed voxel grid, applies union, subtract, intersect or exclusive or bitwise, then `csgmesh` emits only the exposed faces. The result is a mesh actor with a real triangle list and the sources are hidden.

### Mesh editing and sculpting
`mesheditops` implements subdivide with midpoints and a compiled midpoint cache, bevel by centre pull, weld by quantized vertex key, normal flip and reset. `sculptapply` runs four brushes, raise, flatten, smooth and grab, with squared smoothstep falloff inside a brush radius, driven from the viewport.

### Landscape material layers
A landscape actor owns up to any number of layers, each with a name and colour, plus a weight array per layer per grid vertex. `landpaint` writes weights with radial falloff and normalizes them into vertex colours, so the terrain renders each layer through the vertex colour path in both backends.

### Landscape splines and roads
`splinenew` stores control points. `splinesample` is a Catmull Rom evaluation and `splinegeo` extrudes a ribbon of the configured width along the curve, with the tangent computed per step.

### Instanced foliage
`foliagenew` seeds a deterministic linear congruential generator, scatters within a radius, conforms each instance to the terrain height and stores position, rotation and scale per instance. The renderer emits one billboard per instance.

### World streaming
`partitionbuild` buckets every actor into 32 metre cells, stores actor counts and bounds, and `partitiontick` loads or unloads each cell against the stream radius around the camera.

### Level instances
`levelinstpanel` lists the other levels in the project and places an instance actor that records the source level id, name and actor count.

### Procedural mesh from script
A procedural mesh actor holds a script. `procmeshrun` compiles it with `geo` in scope and expects a `pos` and `idx` pair back, then rebuilds the actor and bumps the geometry version. The default template generates a sine surface.

### Terrain collision fidelity
`landheight` samples the height field with bilinear interpolation rather than nearest cell. `terraincollisiontest` measures the error between the two against random points and reports the maximum in metres, so the claim is a measurement, not an assertion.

---

## Animation

### Skeletal animation editor, blend spaces and montages
Clips hold per bone key tracks with times and Euler rotations. `skeletontick` samples the active clip, and `blendspaceeval` returns the two adjacent clips and the blend factor for a one dimensional speed axis. The montage slot name is stored per actor.

### Bone control
Every bone exposes a rotation triple and an optional per axis limit. `rigpanel` edits limits directly and stores them with the rig.

### Rig solver
`rigtwo` is an analytic two bone IK solve: law of cosines for the elbow angle, a pole vector to pick the bend plane, clamping to the chain reach. `rigsolve` applies the result to the thigh and shin bones.

### Ragdoll
`ragdollinit` turns every bone into a particle. `ragdollstep` integrates gravity and damping, then runs four relaxation passes over parent links to hold rest lengths, with a ground clamp and restitution.

### Animation events and root motion
`animnotifytick` fires a notify once per clip pass when the clip time crosses the stored time, and pushes the event name into the gameplay event bus. Root motion is an amplitude and a start pose on the actor, applied in `skeletontick`.

### Facial and morph animation
Morph targets are named weights from zero to one. The panel adds targets, plays a blink burst and a talking loop, and `skinmorphtick` folds the weights into the head scale.

---

## Physics

### Joints and constraints
`jointnew` stores a hinge, ball, spring, distance or fixed constraint between two actors with rest length, stiffness, damping, limits and axis. `jointtick` solves distance and spring error, locks fixed joints and clamps hinge and ball angles.

### Vehicle physics
`vehiclestep` integrates throttle into speed with an engine term and rolling resistance, a brake term that opposes the sign of speed, smoothed steering, yaw from a bicycle model, forward motion along the heading, terrain following and gear selection.

### Character controller
`charstep` moves a capsule along the camera relative input, rejects slopes above the limit, applies gravity and jump velocity, clamps to the terrain height plus half the height and snaps to the ground within the configured distance.

### Collision filtering
`px.layers` names eight channels and `px.matrix` holds a symmetric interaction matrix. `collisionpanel` renders it as a clickable grid and `pxcanhit` is the query the solver would use.

### Continuous collision
`ccdsweep` subdivides the frame motion into `ccdsteps` samples and tests the swept box against every static body, returning the earliest contact so the caller can resolve before committing the move.

### Fields and forces
Six field types, radial, gravity, vortex, wind, drag and noise, each with radius, strength and linear or inverse falloff. `fieldtick` sums the acceleration on every dynamic body inside the radius.

### Destruction depth
`fracturerun` splits an actor into four children per level, recursively, down to a configurable depth of five, each chunk a real actor with its own transform. `explodchunks` gives every chunk a velocity and an angular velocity, and `chunktick` integrates, bounces and ages them.

### Cloth and soft body
Cloth is the mass spring grid described above. `makesoft` stores a rest pose and `softstep` runs a spring lattice over mesh vertices with a volume term, so the mesh visibly squashes and recovers.

### Fluid and buoyancy
`spawnfluid` allocates ninety particles and `fluidstep` integrates gravity then resolves pairwise separation, which is a small discrete fluid. `buoyancytick` computes submersion depth against every water volume and applies buoyancy minus gravity with drag.

---

## Effects and audio

### Node graph VFX
`vfxgraph` holds spawn, shape, velocity, force, colour, size, collide and render nodes with links, rendered as a wired graph. `vfxspec` folds the graph into an emitter specification and `vfxgraphrun` emits into the shared particle buffer, while `vfxgraphtick` integrates gravity, drag, ground bounce, size over life and kills.

### GPU simulation
`gpusiminits` allocates three typed arrays, position, velocity and life, for up to twenty thousand particles. `gpusimstep` runs one tight numeric loop with ground bounce and respawn, and `gpusimdraw` issues a single batched overlay pass.
**Hardware limit**: the loop runs on the CPU because the engine has no compute pipeline. The data layout is the same as an instanced compute dispatch, and the draw is one batch.

### Audio node graph
`audiograph` wires oscillator, filter, gain, spatialiser, convolution reverb and output nodes. `audiographstart` builds the real Web Audio graph, `reverbimpulse` synthesizes a decaying noise impulse response per channel, and the output lands on the SFX bus of the mixer.

### Audio spatialisation
The graph uses a `PannerNode` with a selectable inverse, linear or exponential distance model, reference distance and rolloff, plus listener pose at head height. `audiographstart` sets the position and the panel moves the source live.

### Voice chat
`voicestart` captures the microphone, meters it with an analyser into a level bar, records three hundred and twenty millisecond chunks with `MediaRecorder` and sends them as voice messages through the peer session. `voicegot` receives a chunk, rebuilds the blob and plays it. The transport is the existing PeerJS session, so voice rides the same connection as gameplay traffic.

### Music systems
`musicseq` is a tempo locked step machine with sixteen steps, three layers, per layer waveform, octave and gain. `musictick` schedules notes ahead of the audio clock with lookahead so playback is not tied to frame rate, and `musicstinger` plays a four note sting.

---

## Logic

### Visual scripting
`visgraph` holds event, set, branch, call and print nodes with links. `viscodegen` walks downstream from each event and emits real JavaScript, which the panel can preview, install as a script and run.

### Language depth
`scriptbuild` strips `export`, resolves `import { a } from "Mod"` against previously compiled modules, injects line hooks when breakpoints exist, and compiles with `new Function`. Exports are installed as accessor properties, so bindings stay live across calls. The runtime therefore supports the whole language: classes, destructuring, spread, generators, async and await, optional chaining, template literals and closures.

### Type checking and linting
`lintscript` flags assignment in a condition, function bodies that do not open a brace, loose equality, missing semicolons and unbalanced braces. `typecheck` infers a type from each initializer, tracks reassignment and reports a mismatch against the declared type, and catches array methods called on numbers.

### Hot reload
`logictick` hashes the total script source length every frame; a change recompiles and restarts every module, and the output log records it.

### Debugging
`scriptlinenumbers` prefixes each statement with a line hook. `rtnoline` records the line and pauses when a breakpoint matches. `dbgpanel` sets breakpoints, steps a single frame, resumes and shows the log.

### Profiling depth
`scriptupdate` measures each module with a rolling average into `runtime.prof`. `profpanel` ranks them as bars against total script time and reports the engine budget: render milliseconds, body count, live particles and actor count.

---

## Pipeline and editor

### Module and package system
`pkgreg` stores name, installed version, latest version, dependencies, size and enabled flag. `pkgsemvercmp` compares semantic versions, `pkgresolve` walks the dependency graph with a seen set, and `pkginstall` refuses when a dependency is missing.

### Multi user editing
The net stack already replicates presence, selection and actor operations. `featopen("multi")` opens the multiplayer panel, which hosts or joins through PeerJS with a room code.

### Version history and rollback
`versnapshot` serializes the active level with a label, timestamp and actor count into local storage. `verrestore` swaps it back in. The panel also diffs added and removed actor names against any snapshot.

### Source control
`scmcommit` records a commit with id, message, branch, parent and a full level snapshot. `scmpanel` lists the log, creates branches, checks out any commit and hands off pushes to the GitHub sync dialog.

### Asset toolbox and marketplace
`marketpacks` lists free packs. `marketinstall` places real sample actors from the pack in front of the camera.

### Device emulator
`devicemodels` holds five device profiles with resolution, pixel ratio and touch flag. Applying one calls the existing `setplayres`, so play mode renders at that size with the correct letterbox.

### Multi client play test
`playtestpanel` launches between one and four clients in their own frames, each against the same session.

### Command bar and output
`devcommandlist` registers every advanced panel as a named command. `cmdpanel` is a searchable palette over that list and `runcommand` resolves a command by id or label. Script output lifetimes are in `runtime.out`.

### Dock layout and themes
`dockpanel` sets the main grid columns to one of four presets and applies any of five palettes by overriding the CSS custom properties on the document root. The theme persists.

### Keybind editor
`keymaps` lists nine core shortcuts. The panel captures the next combination per field, stores the map and persists it.

### Crash recovery
`crashsave` writes a dirty flag plus the level into local storage, `crashclear` removes it on a clean exit and `crashpanel` restores a draft after an unclean one.

### Accessibility
`accessapply` toggles four document classes: high contrast, larger text, reduced motion and a visible focus ring. The panel audits buttons for missing labels.

---

## Live services

### Anti cheat
`antistep` validates two things per replicated body: velocity against the configured maximum, which it also clamps, and displacement per second against the teleport threshold. Every violation is recorded in `px` style with the actor, kind and detail.

### Teleport
The panel moves the selection to the camera, the player to the camera, or the player to the origin, and reports the new position.

### Leaderboards and stats
`boardsubmit` inserts, sorts, truncates and persists a board entry and returns the new rank. Counters for plays, wins, deaths, best combo and time played persist per level.

### Experiments and live operations
`livesys.exp` holds a bucket and five feature flags with individual toggles. The remote config editor validates JSON before pushing it onto the level.

### Lag compensation and prediction
The panel sets the rewind window in milliseconds, toggles prediction, records latency samples into a histogram and reports the snapshot buffer size and measured ping.

### Touch, gamepad and VR
`touchdraw` renders the on screen stick and buttons and `touchpress` folds them into the same key state the keyboard writes. `padpoll` reads the standard gamepad mapping into that state each frame. The VR panel queries `navigator.xr` for immersive support and requests a session.

### Localisation
`locpacks` carries five locales. `locbuild` installs the selected table on the level, `loctranslate` resolves a key with an English fallback, and the panel edits strings and exports the table as JSON.

---

## Assets

### Texture import and compression
`teximport` reads an image into a canvas. `texcompress` implements BC1 style block mode with alpha flattening, BC7 style high quality mode, and a half resolution mode, and reports the resulting byte size and elapsed time. **Hardware limit**: browsers cannot create real DXT or BCn payloads, so the compressor applies the mode semantics and the size estimate, then stores a PNG or JPEG payload.
### Animation import
`animimportjson` reads glTF joint nodes and animation samplers into bones and key tracks through `skinimportgltf`, then builds a skeletal actor that plays the first clip.

### Audio import and streaming
`audioimportfile` reads a file, decodes metadata and stores the data URL. The panel toggles each clip between buffered and streamed mode and plays it.

### Asset dependency tracking
`depgraph` builds nodes for actors, sprites, materials, assets and scripts, adds a link per reference, counts references per node and lists orphans with no inbound link.

### Texture painting
`paintnew` seeds a paintable canvas. The panel implements brush, erase, blur and fill with pointer capture, layer bookkeeping, and an apply step that registers the painted canvas as a sprite asset and assigns it to the selection.
