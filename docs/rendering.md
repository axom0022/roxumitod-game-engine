# Rendering - Lumen, Nanite, Virtual Shadow Maps, World Partition

The rendering stack is a set of level-scoped features, exactly like UE5. They live in **World Settings → Rendering**, are saved with the project, and are applied identically by the viewport, by Play In Editor and by packaged builds.

Each feature can be switched independently. The **Engine stats** panel (Window → Engine stats) reports what they are actually doing: triangles drawn, clusters culled, LOD swaps, virtual shadow pages, loaded cells and GI probes.

---

## Renderer selection

The **3D library** dropdown in the toolbar chooses between **three.js** (r149, UMD from a CDN) and **faoxomjs** (v6, UMD from a CDN, falling back to the bundled copy). Both renderers receive the same item list, camera state and environment block from the engine, so the level, the physics and the lighting concepts are identical.

Packaged builds resolve the library in this order: the CDN build first, then a spare library, then a 2D canvas painter that needs no WebGL at all.

---

## Lumen - global illumination

**What it does.** Lumen adds indirect light: the colour of the sky and the colour of the ground bleed onto every actor. In UE5 this is a full radiance cache; in Roxumitod it is a real-time probe approximation that costs almost nothing.

**How it works.** Every frame the engine builds hemisphere probes from the environment colours: sky colour from the background, ground colour from the level palette. A hemisphere light is blended in at `0.22 + intensity × 0.5`, and a bounce light of the ground colour lifts the underside of actors at `0.1 + intensity × 0.22`. Both are driven by the same intensity slider, so the lighting stays coherent when you change the level's mood.

**Walkthrough.**
1. Open **World Settings → Rendering**.
2. Tick **Lumen**. The badge turns green and the scene gains bounce light.
3. Drag **Lumen intensity** from `0` to `1.5`. Zero is a flat ambient scene; `0.55` is the neutral default; above `1` the level reads as a tropical bounce-light shot.
4. Change **Environment → Color** and watch the bounce follow the sky.

**Reference.** `env.lumen` (boolean), `env.lumenstrength` (0 - 1.5). Probe count is shown in Engine stats; it scales with the number of visible items, capped at 64 probes per view.

---

## Nanite - virtualized geometry

**What it does.** Nanite virtualizes geometry so that distance costs pixels, not triangles. In Roxumitod the same idea is implemented as three cooperating stages:

1. **Meshlet LOD** - beyond the LOD distance, curved primitives (spheres, cylinders, cones, tori, capsules) swap to their box proxy. The high-resolution geometry stays allocated but is never submitted.
2. **Pixel culling** - any actor whose projected height falls below 1.4 px is dropped from the draw list entirely.
3. **Budget accounting** - the engine sums the triangle count of everything on screen and reports the saving against the level's full triangle cost.

**Walkthrough.**
1. Enable **Nanite**.
2. Set **LOD distance** to `8` and orbit away from a group of actors: the curved primitives snap to proxies and *LOD swaps* in Engine stats climbs.
3. Set it to `60`: swaps stop, triangles drawn return to the full count.
4. Add a hundred coins and watch *clusters culled* rise as they recede.

**Reference.** `env.nanite`, `env.nanitedist` (4 - 60 m). Stats: `u5stats.tris`, `u5stats.drawn`, `u5stats.culled`, `u5stats.lods`.

---

## Virtual Shadow Maps

**What it does.** Virtual Shadow Maps give crisp contact shadows near the camera and soft shadows far away, using two cascades instead of one uniform shadow map.

**How it works.** The near cascade is a directional light with a tight shadow camera (18 m by default) at the configured resolution. The far cascade is a second directional light at 46 m and half the resolution. Both are re-targeted to the camera focus every frame, so shadows never leave the visible region.

**Walkthrough.**
1. Tick **Virtual Shadow Maps**.
2. Choose a **Shadow resolution**: `1024` for a netbook, `2048` for the default, `4096` for hero shots.
3. Orbit the camera. Shadows follow the focus point instead of tearing at a fixed boundary.

**Reference.** `env.vsm`, `env.vsmres` (512 / 1024 / 2048 / 4096). Engine stats reports *VSM pages*, the total shadow area expressed in 256 × 256 pages.

---

## World Partition

**What it does.** World Partition divides the level into square cells and only loads the cells inside a radius around the camera. Large levels keep a constant actor count in the renderer instead of degrading as they grow.

**Walkthrough.**
1. Open **Window → World Partition**. The panel lists every cell with its actor count and the first few names.
2. Set **Cell size** (4 - 64 m) and **Loaded radius** (1 - 8 cells).
3. Enable **Stream cells**. Actors outside the radius disappear from the viewport and from PIE; the Engine stats readout shows *loaded N of M actors*.

**Reference.** `env.partition`, `env.cell`, `env.cellradius`. Cells are keyed `x,y` from the actor's position in the level plane.

**Tip.** Keep the radius generous while editing so actors do not vanish under the cursor, and tighten it for packaged builds with very large levels.

---

## Renderer-independent by design

Both renderers receive the same `env` block:

```
lumen, lumenstrength, vsm, vsmres, nanite, nanitedist, partition, cell, cellradius
```

The three.js path also implements the near and far shadow cascades and the meshlet LOD swap; the faoxomjs path applies Lumen, Nanite culling and World Partition, and leaves shadow-cascade tuning to the renderer's own shadow settings. Nothing in the level data depends on the choice.
