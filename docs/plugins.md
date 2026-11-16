# Plugins

Roxumitod Game Engine ships a plugin system built around one idea: a plugin is a named bundle of code that adds toolbar buttons, menu commands, docked widgets and event handlers to the editor, and can be enabled, disabled, exported and imported without reloading the engine.

## Opening the plugin manager

`Tools → Plugins…`

The manager lists every installed plugin with its enable toggle, author, version and log output. From here you can:

- **New plugin** - open the code editor with a working starter plugin.
- **Import .unxplug** - load a plugin from a file someone shared.
- **Reload all** - re-run every enabled plugin from scratch.
- **Export** - write the plugin out as a `.unxplug` JSON file.
- **Delete** - remove it and unregister everything it created.

## Anatomy of a plugin

A plugin record holds `name`, `author`, `version`, `desc`, `code`, `enabled`. The code body is compiled as a function with the plugin API in scope, so `selection.get()`, `ui.toast()`, `scene.walk()` and friends work without any imports.

```js
var bar = api.createToolbar("My Tools");

bar.button("Snap to grid", function () {
  selection.all().forEach(function (node) {
    node.pos[0] = Math.round(node.pos[0] * 4) / 4;
    node.pos[2] = Math.round(node.pos[2] * 4) / 4;
  });
  scene.change();
  ui.toast("Snapped " + selection.all().length + " actors");
});

menuCommand("My Tools", "Delete hidden actors", function () {
  scene.walk(function (node) {
    if (node.visible === false) scene.remove(node);
  });
});

panel("Selection info", "topright", function (host) {
  host.innerHTML = "<b>" + selection.all().length + "</b> selected";
});

on("selection", function (node) {
  log("selected " + (node ? node.name : "nothing"));
});
```

## API surface

| Object | Members |
| --- | --- |
| `createPlugin` | register metadata, returns the plugin record |
| `toolbarButton` | add a button to the viewport plugin bar |
| `menuCommand` | add a command to a named menu |
| `panel` / `widget` | mount DOM into one of four overlay corners |
| `command` | run a named command, with an optional shortcut |
| `on` | subscribe to `selection`, `scenechange`, `playstart`, `playstop`, `save` |
| `onTick` | run a callback every editor frame |
| `onKey` | capture a keyboard shortcut |
| `scene` | `objects`, `walk`, `find`, `add`, `remove`, `rename`, `size`, `worldpos`, `snapshot`, `change` |
| `selection` | `get`, `ids`, `all`, `select`, `clear`, `rename`, `lock` |
| `transform` | `move`, `rotate`, `scale`, `moveBy`, `apply` |
| `play` | `start`, `stop`, `isplaying`, `game`, `setvar` |
| `ui` | `toast`, `alert`, `prompt`, `modal`, `menu`, `refresh` |
| `prefs` / `state` | persistent and per-session key value storage |
| `storage` | `get`, `set`, `clear` - scoped to the plugin |
| `http` | `get`, `json` - fetch helpers |
| `docs` | open the plugin API reference |

## Safety

Plugins run inside a function scope, not in the page's global scope. Each plugin owns every button, command, widget, ticker, keybinding and event subscription it created; disabling the plugin unregisters all of them and stops its timers. A syntax error or a thrown exception disables that plugin, reports the message in the console pane and leaves the editor running.

Plugins cannot delete protected engine functions, replace the renderer, or reach the network without going through `http`.

## Sharing

`Export` writes `myplugin.unxplug`, a JSON file with code and metadata. Drop it on another machine, choose `Import .unxplug`, and the plugin appears in the list disabled until you enable it.
