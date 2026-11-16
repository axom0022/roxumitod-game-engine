# Controls & shortcuts

The viewport uses a right mouse navigation scheme built for level editing. Press `Tools → Controls & shortcuts` inside the editor for the same list.

## Navigation

| Input | Action |
| --- | --- |
| Right mouse drag | Look around |
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
