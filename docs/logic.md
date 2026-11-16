# Logic graph

The logic graph is the event driven layer. Each actor and each level can carry an event sheet: a list of triggers and the actions they run.

## Opening it

Select an actor and open the **Logic graph** tab in the left dock, or open the level sheet from the same tab with nothing selected.

## Triggers

| Trigger | When it fires |
| --- | --- |
| On start | Once, when play mode starts |
| Each frame | Every frame, with `dt` |
| On collision | When two actors touch |
| On event | When a named event is fired by code or by a zone |
| On collect | When a pickup is taken |
| On key | When a key is pressed |

## Actions

Every action is a small operation: add to a variable, set a value, play a sound, spawn an effect, win or lose the game, send a network message, jump the player, set UI text. Actions read from and write to the actor's variables.

## Variables

Actors hold variables with a name, a type (number or text) and a value. The Details panel edits them; the logic graph reads and writes them; code reaches them through `entity.vars`.

## Scripts and the logic graph together

Logic graph sheets are the visual layer and scripts are the text layer. Both run in play mode. A script can fire an event that a sheet listens for:

```js
fireevent("door", actor)
```

A sheet can call a script by firing the same event name in the other direction.

## Script actors

Add a **Script** actor from the Add menu to attach code to a specific object. Every script actor gets its own module and receives its actor as `entity`:

```js
function start(entity) { entity.color = "#ffcc00"; }
function update(dt, entity) { entity.rot[1] += dt * 40; }
function onevent(name, node) { console.log(name, node && node.name); }
```

Six script actors ship in the Add menu:

| Actor | Use |
| --- | --- |
| Script | General purpose behaviour on one actor |
| Module script | Exports helpers that other scripts import |
| Scene script | Runs once for the whole level |
| Client script | Runs on the client in a network session |
| Server script | Runs on the host in a network session |
| Tool script | Runs while a tool actor is held |

## The script runtime

Open **Window → script runtime** for compile state, the module list, hot reload, lint and type checks. Scripts are JavaScript with modules and live bindings:

```js
import { clamp } from "Utils"
```

| Feature | Behaviour |
| --- | --- |
| Compile | Every module is compiled on run and on save |
| Hot reload | Saving a script recompiles it without restarting play |
| Breakpoints | Line level breakpoints pause the runtime and step |
| Profiler | Per module frame cost with a budget line |
| Lint | Undefined names, unused variables, risky patterns |
| Types | Flow style inference over assignments and calls |
