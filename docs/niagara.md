# Niagara - particle systems

Niagara is the effects authoring tool. A Niagara system is a stack of modules attached to an actor; the engine evaluates the stack every frame and draws the result in both the editor and packaged builds.

## Concepts

**System** - the whole effect, attached to an actor through the `particles` component.

**Emitter** - spawns particles. Controlled by **Spawn Rate** (continuous) and **Spawn Burst** (one shot).

**Modules** - each row in the stack changes one property of every particle: life, initial velocity, cone spread, gravity, size, colour, renderer shape.

**Colour over life** - the two colour stops every particle interpolates between.

**Renderer** - circle or rectangle sprites, optionally additive.

## Walkthrough

1. Select the actor that should emit the effect (the goal flag already has one).
2. Open **Window → Niagara**.
3. The stack shows: Emitter → Spawn Rate → Initialize Particle → Gravity Force → Sprite Renderer.
4. Drag **Spawn Rate** to `40`, **Particle Life** to `0.9`, **Gravity Force** to `-2`.
5. Set **Color over life** to `#ff8a1f → #ffe066` for fire, or `#9fdcff → #4fb6e8` for water.
6. Choose a **preset** to jump to a known look: fire, smoke, dust, confetti, explosion, splash, rain, sparkles.

Particles follow the actor. In Play In Editor they also react to the play camera, so the effect reads the same in the viewport and in the game.

## Reference

| Field | Meaning | Default (fire) |
| --- | --- | --- |
| `rate` | particles per second | 46 |
| `burst` | particles per trigger | 12 |
| `life` | seconds alive | 0.85 |
| `speed` | initial velocity | 1.5 |
| `spread` | cone spread in radians | 0.3 |
| `gravity` | vertical acceleration | −2.2 |
| `size` | sprite size | 0.26 |
| `color`, `color2` | colour over life | orange → yellow |
| `shape` | circle or rect | circle |
| `glow` | additive renderer | on |

## Triggering from Blueprints

A particle component can be set to autoplay, or fired by an event:

```
on trigger -> play particles
on collide -> burst particles
```

Bursts are what explosions and coin pickups use: one event, forty particles, no continuous cost.
