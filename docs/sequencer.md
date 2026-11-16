# Sequencer - cinematics

Sequencer animates the camera and actors over time with keyframed tracks. It evaluates inside Play In Editor, so a cutscene is simply *PIE with a sequence playing*.

## Concepts

**Track** - one animated subject: the cinematic camera, or a selected actor.

**Key** - a stored state at a time in seconds. Camera keys store eye, target and field of view. Actor keys store position, rotation and scale.

**Playhead** - the current time. Dragging it previews the sequence in the viewport.

**Length** - the duration of the sequence in seconds; playback loops at the end.

## Walkthrough

1. Open **Window → Sequencer**.
2. Move the viewport camera to the opening shot and press **Key camera**. A key appears on the Cine Camera track at `0.00`.
3. Drag the playhead to `2.0`, move the camera to the ending shot, press **Key camera** again.
4. Drag the playhead from `0` to `2` and watch the viewport interpolate.
5. Select an actor, set the playhead to `0.5`, press **Key selected actor**, then move the actor and key it again at `1.5`.
6. Press **Play**. The engine starts PIE and the sequence drives the camera and the actor together.
7. Press **Stop** to return the playhead to zero and clear the overrides.

## How it evaluates

Every frame during PIE the playhead advances by `dt`, wraps at the sequence length, and each track is sampled between its surrounding keys with linear interpolation. Actor tracks write into the play-time override map, which is the same mechanism the game uses for animated transforms - that is why sequencer animation and gameplay animation coexist without conflict.

## Reference

| Field | Meaning |
| --- | --- |
| `app.scene.seq.len` | sequence length, seconds |
| `app.scene.seq.t` | playhead, seconds |
| `app.scene.seq.playing` | playback state |
| `app.scene.seq.tracks[]` | `{ id, name, kind, keys[] }` |
| camera key | `{ t, eye, target, fov }` |
| actor key | `{ t, p, r, s }` |

Use one sequence per level for an intro, and a second one-shot sequence for the ending. Because keys are absolute, retiming a shot is simply dragging its keys.
