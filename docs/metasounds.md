# MetaSounds - procedural audio

MetaSounds synthesises sound at runtime instead of streaming files. A MetaSound is a small graph: oscillator → filter → envelope → output. The engine renders it with WebAudio, which means zero download size and infinite variation.

## Concepts

**Source** - sine, triangle, square, sawtooth or noise.

**Filter** - a low-pass with cutoff and resonance, which is what turns a buzzy square into a soft pad or a laser.

**Envelope** - attack, decay, sustain, release. Attack shapes the strike, release shapes the tail.

**Pitch bend** - a linear glide applied at the end of the decay, the classic coin or jump sweep.

## Walkthrough

1. Open **Window → MetaSounds**.
2. Press **New MetaSound**; the graph appears as `MetaSound Source → Oscillator → Filter → Envelope → Output`.
3. Set **Waveform** to `triangle`, **Frequency** to `880`, **Filter cutoff** to `3200`.
4. Shorten **Attack** to `0.005` and **Release** to `0.25` for a crisp pickup.
5. Set **Pitch bend** to `−0.3` to make it fall as it fades.
6. Press **Preview** as often as you like - every press re-synthesises the graph.

## Reference

| Parameter | Range | Use |
| --- | --- | --- |
| `wave` | sine / triangle / square / sawtooth / noise | timbre family |
| `freq` | 60 - 2000 Hz | pitch |
| `cutoff` | 120 - 12000 Hz | brightness |
| `resonance` | 0.1 - 16 | filter character |
| `attack` | 0.002 - 1 s | transient |
| `decay` | 0.01 - 2 s | body |
| `sustain` | 0 - 1 | held level |
| `release` | 0.02 - 3 s | tail |
| `pitchbend` | −1 - 1 | glide |

MetaSounds live in the project (`app.project.metasounds`) and travel with the level, including into packaged builds, where the play actions resolve them at runtime.
