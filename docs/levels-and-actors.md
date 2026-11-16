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

The left dock lists every actor in a hierarchy. Each row has a visibility toggle, a lock, and a context menu with duplicate, delete, rename, focus and re-parent. The search box filters by name across the whole tree.

## Details

The right dock edits the selection: the transform, the component stack, the tags and the variables. Changes apply live in the viewport and are undoable with `Ctrl+Z`.

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
