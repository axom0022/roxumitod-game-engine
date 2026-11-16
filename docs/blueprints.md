# Blueprints - event graph logic

Blueprints are the visual scripting layer. Each actor and each level can carry an event sheet: a list of events, each with a list of actions. Sheets are evaluated by the play loop, and their actions are the same actions the editor uses - so what you see in the sheet is exactly what runs.

## Concepts

**Event** - when a sheet runs: *on start*, *each frame*, *on collide*, *on trigger*, *on key*.

**Action** - what it does: move, rotate, set sprite, play particles, play sound, add score, remove a life, spawn, destroy, call an RPC.

**Condition** - a guard on an action, usually a variable comparison or a tag test.

**Variable** - per-actor instance state, readable by conditions and writable by actions.

## Walkthrough

1. Select an actor and open the **Blueprint** tab in the left dock.
2. Press **Add event** and choose **Each frame**.
3. Add an action: *move x* with speed `1.4` and range `1.8`. The actor starts patrolling.
4. Add an event **On trigger** with the action *play particles*.
5. Press **Play In Editor** and touch the actor with the player.

Level sheets work the same way but see every actor: that is where *when score reaches 10, open the gate* belongs.

## Reference

| Event | Fires |
| --- | --- |
| `start` | once, when PIE starts |
| `frame` | every frame with `dt` |
| `collide` | when the player overlaps the actor |
| `trigger` | when an action or key activates the actor |
| `key` | when a bound key is pressed |

Actions accept the same text form used by the scene scripts, for example `add 10 to score`, `remove 1 life`, `set sprite coin`.

## Networking

Blueprints can call RPCs from any event. The RPC runs the action on every peer, which is how doors, scores and round starts stay in sync. See [Multiplayer](multiplayer.md).
