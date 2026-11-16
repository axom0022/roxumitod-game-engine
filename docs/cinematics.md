# Cinematics

The cinematic timeline animates the camera and actors over time with keyframed tracks. It evaluates inside play mode and it can also be scrubbed in the editor.

## Creating a sequence

1. Open **Window → cinematics**.
2. Press **New take**. A take has a duration and a list of tracks.
3. Add a camera track or an actor track.
4. Move the playhead, change the transform, then press **Key** to store the value.
5. Press **Play**. The sequence drives the camera and the actor together.

## Tracks

| Track | Drives |
| --- | --- |
| Camera | Position, rotation and field of view |
| Actor transform | Position, rotation and scale of one actor |
| Property | Any numeric field on any actor |

Keys interpolate linearly by default; set a track to ease for smooth camera moves.

## Taking control during play

While a take is playing, the sequence camera overrides the game camera. Stop the take and the game camera takes over on the next frame. This is how intro shots and boss cameras are built.

## Recording and stills

- **Take recorder** captures the live camera during play mode into a new take.
- **Movie render** writes a WebM of the take at a chosen resolution.
- **Still** writes a single PNG frame at the playhead.
