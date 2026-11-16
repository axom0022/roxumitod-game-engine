# Effects

Effects are built two ways: with the **effect graph** for new systems, and with the **Particles** component for quick emitters on an actor.

## Effect graph

Open **Window → effect graph**. A graph is a chain of modules:

| Module | Purpose |
| --- | --- |
| Spawn | Rate, burst and lifetime |
| Shape | Sphere, cone, box or edge emission volume |
| Velocity | Speed, spread and direction |
| Force | Gravity, drag and wind |
| Colour | Start and end colour with a gradient |
| Size | Start and end size |
| Collide | Bounce and kill behaviour |
| Render | Sprite shape, additive or alpha blending |

Parameters are editable per module, and the panel shows a live preview of the emitted particles. **Play graph** runs the preview in the viewport; the same graph runs during play mode.

## GPU simulation

The simulation panel runs up to 20,000 particles in typed arrays with one batched draw call. Positions, velocities and lifetimes live in flat buffers, so the cost stays flat as the count climbs.

## Decals

Decals project an image onto the surface under a ray cast. Add one from **Rendering → decals**, pick the sprite, set the size and the fade, then click the surface in the viewport. Decals follow moving actors when they are parented.

## Volumetric lighting

Volumetric light marches a ray through a density field from the camera towards the light and accumulates scattering. Step count and density are per level, so shafts through fog cost what you choose.

## Reflections and refraction

Screen space reflections trace the depth buffer, then blend in proportion to the roughness of the surface. Translucency adds a resolution aware refraction offset, so glass and water bend what is behind them.

## Lens effects

Lens flare, lens dirt, chromatic distortion and bokeh depth of field are per level switches with amount sliders. They run in the same post pass as tone mapping, so the cost is one extra full screen pass.

## Trails and beams

The **Trail** actor leaves a fading ribbon behind a moving actor. The **Beam** actor stretches a lit strip between two points. Both take colour and width in the Details panel.

## Presets

Eight presets ship ready to drop in: sparkles, fire, smoke, explosion, dust, magic, rain and confetti. Trigger one from code with `fxburst(position, "explosion")`.
