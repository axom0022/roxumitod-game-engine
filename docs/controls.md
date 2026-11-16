# Controls & shortcuts

The viewport uses a right mouse navigation scheme built for level editing. Right drag looks around, middle drag pans, the wheel dollies, and a right tap without dragging opens the actor menu at the cursor. Press `Tools → Controls & shortcuts` inside the editor for the same list.

## Navigation

| Input | Action |
| --- | --- |
| Right mouse drag | Look around |
| Right mouse tap | Opens the actor menu at the cursor, selecting the actor under the cursor first |
| Right mouse + `W` `A` `S` `D` | Fly through the level |
| Right mouse + `Q` / `E` | Fly down / up |
| `Shift` while flying | 4x speed |
| `Ctrl` + wheel | Camera speed, 0.5 - 80 m/s |
| Middle mouse drag | Pan |
| Wheel | Dolly / zoom |
| `Alt` + `G` | Perspective |
| `Alt` + `H` | Front |
| `Alt` + `J` | Top |
| `Alt` + `K` | Side |
| `F` | Focus the selection |
| `F11` | Immersive fullscreen |
| `Shift` + `G` | Game view - hide editor overlays |
| `Shift` + `P` | Pilot the selected actor |
| `End` | Drop the selection to the floor |
| `Ctrl` + `H` | Hide the selection |
| `Ctrl` + `Shift` + `H` | Show every actor |
| `1` - `9` | Recall camera bookmark |
| `Ctrl` + `1` - `9` | Save camera bookmark |

## Transform

| Input | Action |
| --- | --- |
| `W` / `E` / `R` | Move / rotate / scale tool |
| Arrow drag | Move along one axis |
| Plane handle drag | Move on a plane |
| Ring drag | Rotate around that axis |
| Spin ring drag | Rotate around Z in 15 degree steps |
| Box corner drag | Scale from the corner, `Ctrl` keeps the ratio |
| Box edge drag | Scale a single axis |
| `Shift` while dragging | Uniform scale or maximum angle snap |
| `Alt` while dragging | Anchor the opposite edge, 1 degree rotation steps |
| Marquee drag | Box select |
| `Shift` + click | Add to the selection |
| `Ctrl` + click | Add to or remove from the selection |
| Right click the viewport | Quick menu for duplicate, copy, group, hide, focus, add, paste, snapping, delete and play |

## Numerals

Every number field in Details and in the panels is a direct numeral editor.

| Input | Action |
| --- | --- |
| Drag across a field | Scrub the value. `Shift` runs 10x faster, `Alt` runs 10x finer |
| Type | Accepts plain numbers and arithmetic, for example `2*3+1` or `(4+2)/3` |
| `Enter` | Apply the typed or computed value |
| `ArrowUp` / `ArrowDown` | Step by the field step, `Shift` for ten steps, `Alt` for a tenth |
| Double click | Reset the field, scale returns to 1 and everything else to 0 |
| `Tab` | Move to the next field, the value is kept |

Transform rows carry a coloured axis badge per component: X red, Y green, Z blue, the same colours as the viewport gizmo. Editing a position, rotation or scale number with more than one actor selected writes the same component into every selected actor.

## The World Outliner

| Input | Action |
| --- | --- |
| Click a row | Select that actor |
| `Ctrl` + click | Add or remove an actor from the selection |
| `Shift` + click | Select the range between the two rows |
| `Ctrl` + `A` | Select every actor in the level |
| Double click the name, or `F2` | Rename in place, `Enter` keeps it and `Esc` discards it |
| Right click a row | Rename, duplicate, copy, paste, add a child, detach, reorder, focus, hide, delete |
| Right click empty space | Add an actor, paste, group, expand all, collapse all |
| Click empty space | Clear the selection |
| Search box | Matches names, types and tags |
| Filter chips | All, Shapes, Scripts, Lights, Models, UI |
| Group | Moves the whole selection into a folder actor, also `Ctrl` + `G` |
| Footer | Selection count plus Group, Copy and Delete for the whole selection |

Shift click uses the visible order of rows, so it follows the filters that are on screen.

## Snapping

The magnet button in the viewport tool rail opens the snap menu, and `Select → Snap step and rotation step` opens the same menu.

| Input | Action |
| --- | --- |
| Move step | 0.05, 0.1, 0.25, 0.5, 1 or 2 m |
| Rotate step | 1, 5, 15, 45 or 90 degrees |
| `Alt` while dragging | A fifth of the move step, 1 degree for rotation |
| `Shift` while dragging | Four times the move step |
| Arrow keys | Nudge the selection by one step on X and Y, `PageUp` / `PageDown` for Z |

## Editing

| Input | Action |
| --- | --- |
| `Space` | Play in viewport / stop |
| `Delete` | Delete the selected actor |
| `F2` | Rename |
| `Ctrl` + `Z` / `Ctrl` + `Y` | Undo / redo |
| `Ctrl` + `S` | Save level |
| `Ctrl` + `D` | Duplicate |
| `Ctrl` + `C` / `Ctrl` + `V` | Copy / paste |
| `Ctrl` + `G` | Group the selection into a folder |
| `Ctrl` + `A` | Select every actor |

## Locking

Every actor has a lock toggle in the World Outliner and a **Locked** checkbox in Details. A locked actor cannot be picked, marquee-selected, moved by a gizmo or deleted; it draws a dashed amber ring instead of transform handles. `Tools → Lock all actors` and `Unlock all actors` apply it in bulk.

## Sections

Every collapsible section header in the editor and in the Free assets page carries an **X** on the right. Closing a section hides its contents and leaves a compact strip in its place; click that strip to bring the section back. Nothing is deleted, and the state survives until you reopen the project.

## Advanced panels

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+F` | Feature hub, the searchable list of every advanced system |
| `Ctrl+Shift+P` | Command bar, resolves any advanced panel by name |
| `Ctrl+K` | Command bar, alternative binding |
| `Ctrl+Shift+M` | Toggle the profiler |

The **Window** menu carries **Feature hub** and **Command bar** under the tool list. The **Tools** menu carries both above **Focus selection**. Inside the Feature hub, typing filters the list and Enter on a row opens that panel.
