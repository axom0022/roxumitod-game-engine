# Audio

Audio is synthesised and mixed in the browser with the Web Audio API. Nothing streams and nothing downloads unless you import a file.

## Audio graph

Open **Window → audio graph**. An audio graph is a chain of modules that render continuously:

| Module | Purpose |
| --- | --- |
| Oscillator | Sine, square, saw or triangle with a frequency |
| Noise | White and pink noise source |
| Filter | Low pass, high pass or band pass with resonance |
| Envelope | Attack, decay, sustain and release |
| Delay | Time, feedback and mix |
| Reverb | Room size and damping |
| Mixer | Combine several chains with per chain gain |
| Output | Master gain into the mixer bus |

**Play graph** previews the graph in the editor. The same graph runs during play mode.

## Spatialisation

Sound emitters are placed in 3D. Three distance models are available:

| Model | Falloff |
| --- | --- |
| Linear | Falls off evenly to the maximum distance |
| Inverse | Natural falloff, loud near the source |
| Exponential | Fast drop close to the source |

Set the model, the rolloff distance and the panning width per emitter. Position updates come from the emitter actor, so a moving source pans naturally.

## Mixer

Five buses: master, music, sound effects, UI and ambient. Each bus has a volume, a mute switch and a low-pass cutoff. The mixer panel shows live levels while play mode runs.

## Sound emitters and music zones

- **Sound emitter** plays a one shot asset, with volume, group and loop.
- **Music zone** plays a looping bed while the player is inside its volume.

Both are ordinary actors: move them, duplicate them, parent them.

## Voice chat

Voice chat captures microphone chunks and sends them over the peer session. It is off by default, and the online panel shows who is speaking and the current bitrate.

## Music

The music machine is a tempo locked step machine with sixteen steps across three tracks (drums, bass and lead). Set the tempo in beats per minute, paint steps, and the machine loops them in time. Stingers fire on top without waiting for the loop point, which is what win and lose sounds use.

## Importing audio

**Content → import** accepts WAV, MP3 and OGG. Small files are decoded into buffers, long files are streamed from a blob URL. Either way the sound is available to emitters and to code as `game.play(asset)`.
