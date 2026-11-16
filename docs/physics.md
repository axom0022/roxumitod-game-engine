# Physics and destruction

The physics solver runs rigid bodies, joints and fracture inside play mode. It is sub stepped, so fast objects still collide with thin geometry.

## Bodies

Any actor can carry a **Physics body** component. In the Details panel set the type:

| Type | Behaviour |
| --- | --- |
| Static | Never moves, collides with everything |
| Dynamic | Driven by gravity and impulses |
| Kinematic | Moves only by animation or code, pushes dynamic bodies |

Mass, friction and restitution are per body. Static bodies are collected at the start of play mode, so moving an actor while stopped also moves its collider.

## Sub steps

Fast projectiles tunnel through thin platforms at one step per frame. The solver splits the frame into sub steps.

| Setting | Range | Default |
| --- | --- | --- |
| Physics solver | on / off | on |
| Sub steps | 1 - 12 | 4 |

Raise it to 8 for fast projectiles, lower it to 2 for slow puzzle scenes.

## Joints and constraints

Add a **Joint** component to link two actors. Five kinds are available: hinge, ball, spring, distance and fixed. Each one exposes the two actors, the anchor point and the limits. Joints solve after the bodies, so a chain of linked actors stays stable.

## Character controller

The character controller is a capsule with step height, slope limit and ground snap. It is what the player uses in play mode:

| Field | Default |
| --- | --- |
| Walk speed | 5.2 m/s |
| Jump height | 6.4 m |
| Step height | 0.35 m |
| Slope limit | 46 degrees |

## Collision channels

Eight channels filter what collides with what: default, player, enemy, world, trigger, debris, vehicle and water. The matrix in **Window → collision** decides which pairs interact. Debris ignores debris, triggers ignore everything and only report overlap.

## Continuous collision

Fast body motion is swept against static geometry in four sub samples per step, which stops tunnelling without the cost of a full solver restep.

## Fields and forces

Fields push, pull or drag bodies inside a volume. Six types: radial, directional, vortex, drag, gravity and turbulence. Each has a strength, a radius and a falloff curve.

## Destruction

Any actor can be fractured. The solver splits it recursively to a chosen depth, builds a shard per piece and hands each shard to the simulation with the parent velocity. Depth 3 is the default, up to 5 on a heavy actor.

```js
fracture(actor, 3)
```

## Cloth and soft body

Cloth is a mass spring grid over the actor's vertices. Pin the top edge, set the stiffness and let gravity do the rest. Soft bodies use a spring lattice over a closed mesh, which is what balloons, jelly blocks and flags use.

## Fluid and buoyancy

Water volumes carry a density. Any dynamic body dropped inside receives an upward force proportional to the displaced volume and a drag force proportional to velocity, so light bodies float and heavy ones sink.

## Colliders

The **Collider** component offers box, sphere, capsule and mesh shapes. The viewport shows collider outlines as an overlay, so you can see exactly what the solver sees.
