# Levels and actors

## Levels

A level is a scene: a set of actors, an environment block, a graphics stack and optional cinematic tracks. Projects hold one or more levels, and one of them is marked as the start level.

Open a level from the tab strip above the viewport. Each level keeps its own camera, selection and undo history, so switching between levels never loses your place.

## Actors

Everything placed in a level is an actor. An actor has:

- a **name** and an **id**
- a **transform**: position, rotation, scale
- a **type**: sprite, cube, plane, sphere, cylinder, cone, torus, capsule, tilemap, terrain, water, curve, 3D text, model, camera, light, UI widget
- **components**: sprite renderer, collider, physics, particles, audio, joint, light
- **tags**: `player`, `coin`, `hazard`, `goal`, `enemy`, `pickup`
- **variables**: per-instance state used by the logic graph

Children inherit the parent transform. Dragging in the World Outliner re-parents an actor.

## Components

| Component | Adds |
| --- | --- |
| Sprite Renderer | billboarded sprite with a colour and an optional texture |
| Static Mesh | cube, sphere, cylinder, cone, torus, capsule, plane |
| Collider | solid OBB used by the character controller and by hazards |
| Physics | rigid body: Static, Dynamic or Kinematic, with mass, friction, restitution |
| Particles | an effect graph system attached to the actor |
| Audio | an audio graph or a built-in cue |
| Joint | a constraint to another body |
| Light | a point or directional contribution |

## The World Outliner

The left dock lists every actor in a hierarchy. Each row has a visibility toggle, a lock, and a context menu with duplicate, delete, rename, focus and re-parent. The search box matches names, types and tags across the whole tree, and the filter chips narrow the list to shapes, scripts, lights, models or screen UI.

Selection is direct. Click a row to select it, `Ctrl` click to add or remove, `Shift` click to take a range, `Ctrl+A` for everything, and double click a name to rename it in place. The footer reports how many actors are selected and carries **Group**, **Copy** and **Delete** for the whole selection. **Group** moves the selection into a folder actor so a level stays readable as it grows.

The same actions are one right click away in the viewport: duplicate, copy, group, hide, focus, add an actor, paste, snapping and delete.

## Details

The right dock edits the selection: the transform, the component stack, the tags and the variables. Changes apply live in the viewport and are undoable with `Ctrl+Z`.

Every number is a direct numeral field. Drag across it to scrub, type an expression such as `2*3+1`, press `ArrowUp` and `ArrowDown` to step, and double click to reset. Position, rotation and scale sit on coloured axis badges that match the viewport gizmo, and a transform edit applies to every actor in a multi selection. The full list is in [`controls.md`](controls.md).

## Play in viewport

**Play in viewport** swaps the editor camera for the game camera, starts the physics solver, runs the logic graph, starts the scripts and networking, and renders the same level through the same renderer. `Esc` stops the session and restores the editor state, including the cinematic overrides.

While PIE runs, the toolbar shows a live FPS counter, a resolution selector and a **2D Platform** badge describing the active template.

## GUI service

GUI lives in a **ScreenGui** actor. Anything parented to a ScreenGui is drawn in screen space: it appears in the viewport while you edit, and it stays on screen when you press Play.

**Tools > GUI service - ScreenGui** opens the manager. From there you add a ScreenGui, then add elements into it:

| Element | What it is |
| --- | --- |
| Frame | A coloured rectangle, the container for other elements |
| Label | Text drawn on screen |
| Button | Clickable element that runs events or switches scenes |
| Image | A sprite drawn at its screen rectangle |
| Bar | Progress bar driven by a value |
| Slider | Draggable value |
| Joystick | On-screen thumbstick for touch games |

Elements are children of the ScreenGui in the World Outliner, so they move with it and copy with it. Drag an element in the viewport to change its screen position; the Details panel owns anchor, position, size, pivot, colour, corner radius and text.

### Physical elements

Tick **Physical** on an element (or on the whole ScreenGui) and that element leaves the screen layer and is drawn in the 3D world instead, at its Position, as a world space element. Untick it to put it back on screen. Physical elements are pickable, movable and scaled with the normal transform gizmos.

## Scene service actors

Outside the solid shapes, the palette carries actors that describe how a level behaves rather than how it looks. They cost nothing to render beyond a small marker in the viewport.

| Actor | What it does |
| --- | --- |
| Folder | Groups actors in the Outliner and the Details tree. Drop an actor on a folder to move it inside |
| Highlight | Draws a translucent marker around the actor it is parented to, useful for objective markers and tutorials |
| Decal | Paints a sprite onto the surface of the actor it is parented to |
| Team | Names a side and gives it a colour. The play HUD announces the team and scripts can read it |
| Sky | Replaces the level background colour for the duration of play mode, then restores it on stop |
| Seat | A low block the player can stand on. Scripts receive a seat event when the player reaches it |
| Attachment | A transform only actor, used as a mount point for beams, effects and cameras |
| Billboard text | A label that always faces the camera |
| Remote event | A named event for scripts, raised with `fireevent` and received in `onevent` |
| Number value, Text value | Shared values that scripts and the logic graph read and write |

## Advanced actors

The **Add object** palette now ends with an **Advanced** group:

| Actor | What it carries |
| --- | --- |
| Static mesh | A vertex and index list, editable and sculptable, the target of every CSG result |
| Skeletal mesh | A bone hierarchy, skin weights, clips, blend space, montage, morph targets and LOD chain |
| Procedural mesh | A script that builds its own vertex and index arrays |
| Landscape | Layers with weights, a height field, bilinear height queries and baked collision |
| Spline | Control points and a road ribbon width |
| Foliage | A seed, radius, count, density and a list of placed instances |
| World cell | A reference to a streamed cell |
| Level instance | A reference to another level in the project |

Selecting a mesh actor exposes **Solid modelling and sculpting** in the Tools menu, where booleans, subdivide, bevel, weld, flip and the four brushes live. Selecting a landscape exposes **Landscape material layers**. Selecting a skeletal mesh exposes **Rig solver and ragdoll** and **Facial and morph animation**.
