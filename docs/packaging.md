# Packaging

Packaging turns a level into something you can ship. Every option writes files locally; nothing is uploaded.

## Package game (HTML)

One self-contained HTML file with the level, the runtime, the renderer loader and the networking layer inlined. The renderer itself loads from a CDN with a bundled fallback, so the file stays small.

1. **File → Package game (HTML)**.
2. The file downloads as `<level>.html`.
3. Open it from disk, host it anywhere, or send it to a friend.

The packaged runtime resolves the 3D library in this order: the CDN build of the selected renderer, a spare renderer, then a 2D canvas painter. A level therefore always runs, even with WebGL disabled.

## Package for itch.io

Produces a zip with `index.html`, the loader and a README. Upload it as an HTML game, set the entry point to `index.html`, and enable *This file will be played in the browser*.

## Package Android (APK)

Produces an Android Studio project: a WebView wrapper, `AndroidManifest.xml` configured for your app id, the packaged level under `assets/`, and a `signing.json` template. Build with `./gradlew assembleRelease`.

## Backup (.ugm)

A JSON backup of the whole project - levels, actors, assets, graphics settings, audio graphs. This is the file to keep in version control.

## Folder export (.zip)

The project as a folder tree with separate level files, which is convenient for reviewing diffs or handing assets to an artist.

## What travels with the level

- Actors, components, tags and variables.
- World Settings: background, ambient, tone mapping, and the whole rendering stack (global illumination, virtual geometry, cascaded shadow maps, world streaming, physics solver).
- Cinematic tracks and their keys.
- Logic graph event sheets.
- Audio graphs.
- Multiplayer settings: the room code can be supplied by URL at runtime.

## Multiplayer in packaged builds

The exported game carries the **Co-op** panel and the `?room=` URL contract. Nothing else is required: PeerJS loads from a CDN on first use. If you need a fully offline build, include `vendor/peerjs.min.js` next to the HTML; the loader falls back to it automatically.
