# Rendering

The rendering stack is a set of level scoped features that live in **World settings → Rendering**. Every switch is saved with the level and applied in the viewport, in play mode and in packaged builds.

Open **Window → Engine stats** to see what each system is doing right now.

## Global illumination

**What it does.** Indirect light. The colour of the sky and the colour of the ground bleed onto every actor, so shadows are lit rather than black.

**How it works.** Every frame the engine samples the environment colours: sky colour from the background, ground colour from the level palette. A hemisphere light is blended in at `0.22 + intensity * 0.5`, and a bounce light of the ground colour lifts the underside of actors at `0.1 + intensity * 0.22`. One slider drives both, so lighting stays coherent when the mood of the level changes.

**Settings**

| Field | Range | Default | Effect |
| --- | --- | --- | --- |
| Enable | on / off | on | Master switch |
| Intensity | 0 - 1.5 | 0.7 | Scales sky and bounce light |

**Reference.** `env.gi` (boolean), `env.gistrength` (number). The sample count is shown in Engine stats and scales with the number of visible items, capped at 64 per view.

## Virtual geometry

**What it does.** Keeps triangle throughput flat as a level grows. Distant actors draw fewer triangles than nearby ones, and clusters that land smaller than a pixel are dropped before they reach the rasteriser.

**How it works.** Each actor is split into clusters at import. Every frame the renderer projects each cluster, measures its screen size, swaps in the matching LOD and culls anything under one pixel. The budget readout in Engine stats reports triangles drawn against triangles in the level.

**Settings**

| Field | Range | Default |
| --- | --- | --- |
| Enable | on / off | on |
| LOD distance | 4 - 60 m | 18 |

## Cascaded shadows

**What it does.** Shadow detail near the camera without paying for a huge map far away.

**How it works.** Two depth pages are rendered each frame, a near cascade covering the camera focus and a far cascade covering the wider level. Both retarget to the camera focus, so detail follows you as you move. Resolution is selectable from 512 to 4096 pixels.

| Field | Range | Default |
| --- | --- | --- |
| Enable | on / off | on |
| Shadow resolution | 512 - 4096 | 1024 |

## World streaming

**What it does.** Loads only the cells around the camera, which keeps large levels cheap.

**How it works.** The level is divided into a grid of cells. Every frame the engine measures the camera cell and loads the cells inside the radius, unloading the rest. Actors keep their state while unloaded, so gameplay is unchanged.

| Field | Range | Default |
| --- | --- | --- |
| Stream cells | on / off | off |
| Cell size | 4 - 64 m | 32 |
| Loaded radius | 1 - 8 cells | 2 |

## Post effects

Tone mapping (ACES, Reinhard or none), bloom, depth of field, ambient occlusion and FXAA are per project graphics settings. The post material domain adds stencil masked effects: outline, scanlines, colour grade and vignette, each driven by a stencil id so only tagged actors receive them.

## Lighting actors

Add **Point light**, **Spot light** or **Area light** from the Add menu. Each one has colour, intensity and range in the Details panel, and shows a marker in the viewport so it can be picked and moved like any other actor.

## Renderer switch

The picker in the toolbar switches between **three.js** and **faoxomjs** without touching the level. Both receive the same item list, so materials, textures, vertex colours and custom geometry look the same on either backend.
