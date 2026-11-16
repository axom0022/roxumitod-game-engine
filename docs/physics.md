# Physics and destruction - Chaos

Chaos is the simulation layer: rigid bodies, joints, sub-stepped integration and geometry collections. It runs in Play In Editor and in packaged builds; the editor viewport shows the result of the solver through the play-time override map.

## Concepts

**Rigid body** - a component with a body type: `Static`, `Dynamic` or `Kinematic`. Dynamic bodies fall, bounce and stack.

**Character controller** - the player is an oriented box resolved against statics, slopes and moving platforms with up to twelve sub-steps per frame, which is what keeps fast falls from tunnelling through thin platforms.

**Joint** - a constraint between two bodies with a pivot, a length and a stiffness. Joints are what turn a pile of boxes into a ragdoll or a chain.

**Geometry collection** - a mesh fractured into shards. Each shard becomes a dynamic body with its own mass and friction.

## Walkthrough - fracture an actor

1. Select a cube in the World Outliner.
2. Open **Window → Chaos - Physics & Destruction**.
3. Set **Body type** to `Dynamic`.
4. Press **Fracture selected actor**.
5. The actor is replaced by eight shards laid out in a 2 × 2 × 2 grid, each with a dynamic body, a mass of 1.2, friction 0.6 and restitution 0.25.
6. Press **Play In Editor**. The shards separate and fall.

## Walkthrough - tune the solver

1. In World Settings → Rendering, leave **Chaos** enabled.
2. Raise **Chaos sub-steps** from `4` to `8` for fast projectiles, lower it to `2` for slow puzzle bodies.

## Reference

| Setting | Range | Default | Effect |
| --- | --- | --- | --- |
| `env.chaos` | on / off | on | Enables the sub-stepped solver |
| `env.chaossub` | 1 - 12 | 4 | Sub-steps per frame |
| `compdata.physics.type` | Static / Dynamic / Kinematic | Dynamic | Body type per actor |
| `compdata.physics.mass` | number | 1.2 | Mass of a shard |
| `compdata.physics.friction` | 0 - 1 | 0.6 | Surface friction |
| `compdata.physics.restitution` | 0 - 1 | 0.25 | Bounciness |

## Notes

Fracture keeps the parent material, so shards inherit the actor colour. Because shards are normal actors they can carry Blueprint events, tags and particles - a classic use is a *Break* event that spawns a Niagara burst when a shard is destroyed.
