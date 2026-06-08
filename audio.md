# Daily Maze — Audio Design

**Version:** v5 · **Last updated:** 2026-06-07

How sound ties into the game. This doc covers the *design* — what plays, when, and why — and the *architecture* that makes it fit Daily Maze's runtime (a mutable-ref rAF game loop, no server yet). The asset library lives in `client/public/sounds/`.

## The constraint that shapes everything

The game state is a **mutable ref** (`gsRef` in [useGame.ts](client/src/game/useGame.ts)) mutated every frame by an rAF loop; React only sees a throttled HUD slice every 200ms. So **sound has to be triggered imperatively from inside the game loop / `step()`** — the same place the events actually happen — *not* from React effects watching state. An effect-driven approach would miss most events (they never reach React) and lag the ones it caught by up to 200ms. This is the single load-bearing decision: **audio is event-driven from the engine, parallel to the canvas render, not a function of React render.**

A second hard constraint comes from the browser: **autoplay is blocked until a user gesture.** Nothing can play before the player's first click/key. We already have a perfect unlock point — the ESCAPE button / first movement — so the audio context gets resumed there.

## Server? Not yet.

The earlier idea of *synchronized-window* and *threat-tick* sounds riding a WebSocket is **deferred** — there is no server, no wire, and multiplayer + the closing-window timer are parked (see [daily-maze.md](daily-maze.md) → Parked). Every sound below is **100% client-side and event-driven**. When the Go server and the synchronized daily window land, two new *server-driven* cues join (window-open chime, window-closing warning); they're specced in "Future: server-driven cues" so the architecture leaves room, but nothing waits on them.

## The three roles of sound

Sound isn't one system — it's three, each with a different trigger source and lifecycle:

1. **One-shot SFX** — fire once on a discrete event, then forget. Footstep, charting flourish, trap-door drop, thunder, exit sting. Triggered imperatively from `step()` / the render flash. *Many can overlap* (rapid footsteps), so each play grabs a fresh buffer source. (A wall-bump sound was tried and removed — walking into a wall now makes no sound.)
2. **Ambient beds** — long loops that fade in/out and crossfade, setting the mood of being in the dark. Rain + wind, or the factory-machine drones for deeper/tenser stretches. Driven by *state* (am I in the maze? how lost am I?), not events. *One instance per bed*, volume-automated.
3. **Stateful / continuous** — the breathing loop, whose *intensity* tracks a game variable (calm when charting, heavier when backtracking / lost / near a trap). One instance, gain modulated continuously from the loop.

## The sound → event map

Assets are grouped by theme in `client/public/sounds/` (see that folder). Mapping to Daily Maze's real moments:

| Asset group | Role | Game trigger | Hook site |
|---|---|---|---|
| `player/footstep` | one-shot | every successful tile move (dry) | `step()` returns true ([useGame.ts](client/src/game/useGame.ts)) |
| `player/waterstep` | one-shot | every move **in Storm weather** (wet splash, replaces footstep) | `step()`, gated on `t.weather === 'Storm'` |
| `player/breathing` | stateful loop | always on under gameplay; gain swells when lost/backtracking | game-loop, modulated per frame |
| `weather/thunder/*` (4) | one-shot | the lightning flash; also the **trap-door** drop | lightning in [render3d.ts](client/src/render/render3d.ts) (the "thunder off for now" TODO); trap-door branch |
| `weather/rain` | ambient bed | base atmosphere of the dark maze | mounts with gameplay, fades on entry/exit |
| `weather/wind` | ambient bed | base atmosphere, layered with rain | same |
| `machines/*` (4) | ambient bed | alt/tenser atmosphere for deeper stretches (optional, later) | state-driven crossfade |
| `nature/leaves` | one-shot | a softer step variant, or a "charting new ground" flourish | `reveal()` when new tiles get marked |

### Discrete events that want a sound

Derived from the runtime + the design docs, in rough priority:

- **Footstep** — `step()` succeeds. The bread-and-butter sound; pitch/vary slightly so repeats don't machine-gun.
- **Turn** — `applyKey()` 90° rotate ([useGame.ts:61](client/src/game/useGame.ts#L61)). A soft cloth/swish, distinct from a step.
- **Trap door** — stepping onto a stacked-MUTE branch flings you across the maze ([maze-rules.md](maze-rules.md) → Trap doors). *The* dramatic moment: a thunder hit + a whoosh as you're thrown. (Engine support for trap doors isn't built yet — this is the reserved trigger for when it is.)
- **Exit reached** — `gs.exitReached` goes false→true ([useGame.ts:54](client/src/game/useGame.ts#L54)). A victory sting. **Needs edge-detect** — it's set every frame you stand on the exit.
- **Lightning / thunder** — the render already flashes the screen ([render3d.ts](client/src/render/render3d.ts)); thunder lands a beat after the flash, as the author's TODO intends.
- **New ground charted** — `reveal()` marks new `seen` tiles. A subtle discovery tick (leaves, or a soft chime). Throttle so a wide light-pool doesn't spam it.

### Continuous / state-driven

- **Ambient bed** (rain + wind): fades in when gameplay mounts, ducks out on the exit sting and on leaving the game screen.
- **Breathing**: always on under gameplay; its gain rises with a "stress" signal — e.g. consecutive backtracks (a step onto a `trail` tile), time since last *new* tile charted, or proximity to a known trap once those exist. Calm exploration ≈ near-silent; thrashing in a dead-end ≈ audible.

## Tweaks & weather coupling

Audio is tunable live through a **separate dev-only panel** — `AudioTweaks` ([client/src/game/AudioTweaks.tsx](client/src/game/AudioTweaks.tsx)), its own FAB (♪ Audio, offset from the visual ✦ Tweaks button) and hotkey (`Y`). It reuses the shared `TweaksPanel` UI and drives the `audio*` fields now on the `Tweaks` type (so prefs persist via the existing localStorage tweaks store). A player-facing mute button (bottom-left) drives the same `audioMuted` tweak.

**Beds follow the visual weather/world — they are not always-on.** The loop's `ensureBed(name, on, gain)` starts/stops each loop idempotently and ramps to the live tweak gain:

- **rain** plays only when `soundRain && weather === 'Storm'` — fixing the original bug where rain droned in clear skies.
- **wind** follows the visual `wind` toggle.
- **factory** (`machines/*` drone) is its own opt-in bed (default off).
- **breath** is always on (if enabled); its gain = `(0.12 + stress) * breathAmt`.

**Thunder spacing is one tweak for both flash and boom.** The interval lives in the renderer's lightning state machine ([render3d.ts](client/src/render/render3d.ts)); it now reads `thunderGap` seconds (± 40% jitter) instead of the old hardcoded 2.6–7.8 s. Because thunder fires off the *same* strike event (via the `onLightning` seam), widening the gap spaces the audio and the animation together — they can't drift apart.

## Background music (a separate system)

There's a **background score** — four long cinematic tracks in `sounds/music/` (suspense / tension / drama / mystery, 1.5–4 min each) — playing as a **sequential shuffle**: pick a random track, play it fully, crossfade (~4 s) into another *different* random track, forever, one at a time. It starts on the player's **first gesture** (move/click/key/touch — autoplay policy) and **fades out on unmount**.

The **same bed plays on both screens**, scoped to each: on the **landing** at its normal ceiling (~0.45, with a ♪ nav toggle + persisted volume), and **in-game** much quieter (`musicVolume` tweak, default ~0.18 — background, not the focus). They're two independent instances (the landing's fades out on the dive; the game's starts fresh on the next gesture), so the in-game track is independently random, not a continuation.

This is deliberately **not** the in-game `AudioEngine`. That engine decodes whole files into `AudioBuffer`s, which is right for short, overlapping SFX but wasteful for minutes-long stereo music (tens of MB, decode stalls). So music **streams** through plain `HTMLAudioElement`s and we just automate their `.volume` for crossfades — no Web Audio graph:

- **[client/src/audio/landingMusic.ts](client/src/audio/landingMusic.ts)** — `LandingMusic` class: track list, no-immediate-repeat shuffle, crossfade on near-end (`timeupdate`) with an `ended` safety net, `setVolume`, `stop` (fade + dispose).
- **[client/src/audio/useLandingMusic.ts](client/src/audio/useLandingMusic.ts)** — React seam owned by `Landing`: starts on first gesture, persists volume + on/off in localStorage, fades out on unmount.
- **Wiring** — `Landing.tsx` calls `useLandingMusic()` and renders a ♪ on/off button in the top nav (its click also serves as the unlock gesture). In-game audio (the `AudioEngine`) is untouched.

## Architecture

A small, framework-agnostic **audio engine** (plain TS, Web Audio under the hood) plus a thin React seam to own its lifecycle.

- **`client/src/audio/AudioEngine.ts`** — a singleton-ish class wrapping one `AudioContext`. Responsibilities: load + decode each asset to an `AudioBuffer` once (cached); `playOneShot(name, {volume, rate})` (fresh `BufferSourceNode` per call, so overlaps are fine); `startBed(name)` / `setBedGain` / `crossfadeBed` for looping beds via a per-bed `GainNode`; `startBreath()` + `setBreathGain` for the modulated loop; a master `GainNode` for global volume/mute; and `unlock()` to `resume()` the context on first gesture. No React inside it — it's testable and reusable.
- **`client/src/audio/sounds.ts`** — the manifest: a typed map from logical name (`'footstep'`, `'bump'`, `'thunder'`, `'rain'`, `'wind'`, `'breath'`, …) to its public URL under `/sounds/...`, plus per-sound defaults (base volume, whether it's a one-shot/bed/loop, pitch-variance). One place to add a sound.
- **`client/src/audio/useAudio.ts`** — a tiny hook that constructs one engine per Game mount, calls `unlock()` on the first input gesture, and `dispose()`s it (closing the `AudioContext`) on unmount so contexts aren't orphaned across landing↔game navigation (browsers cap concurrent contexts). It exposes the engine so the game loop can fire one-shots. Mute/volume are **not** owned here — they live in the Tweaks state and the loop pushes them to the engine each frame.
- **Wiring into the loop** — `useGame` receives the engine (param or context) and calls it at the hook sites: `engine.playOneShot('footstep')` after a successful `step()`, `'bump'` on the early return, `'turn'` on rotate, the breathing-gain update once per frame in the loop, the exit sting behind a false→true edge check. The render-side thunder fires from where the lightning flash is decided.

### Why a plain class, not just `use-sound`/Howler

`use-sound` is React-hook-shaped (one sound per hook call, plays via state) — it fights a ref-driven rAF loop where we fire dozens of overlapping one-shots imperatively. Howler would work but is a dependency we don't need: the Web Audio API gives us buffer reuse, per-source pitch variance, sample-accurate gain ramps for crossfades, and overlap for free. A ~150-line engine is less code than bending a library to this loop, and it's a cleaner thing to own in a learning project. (Revisit if 3D/positional audio or streaming long files becomes worth it.)

### Loading strategy

Decode-once, cache forever. On unlock the engine preloads only what the *default* (clear-weather) experience needs — footstep, the charting flourish, breath, and the wind bed. Everything Storm-only or opt-in lazy-loads on first use via the "no buffer yet? kick a load and skip this trigger" path in `playOneShot`/`startLoop`: rain + waterstep (Storm), the thunder claps (big files), the factory drone. `startLoop` retries each frame and the 1.5s fade-in masks a bed's decode latency. Assets live in `public/`, served as-is by URL — no bundler import. The library is ~27 MB on disk (mostly the music), but only a few hundred KB is eager.

The per-frame surface is kept cheap: the engine **change-gates** its loop calls — `setLoopGain`/`setVolume`/`setMuted` skip the work when the value hasn't moved, so the constant beds stop rescheduling a ramp 60×/sec (only breath, which modulates every frame, actually ramps). Loops also fade out on a **cancelable** timer rather than a source-scheduled stop, so a quick off→on re-toggle within the fade revives the same source instead of double-playing.

## Future: server-driven cues

When the Go server + synchronized daily window arrive (see [daily-maze.md](daily-maze.md) → Stack/Parked), two cues join, triggered by **WebSocket messages**, not local events:

- **Window-open chime** — the daily window opens for everyone at once; a shared "go" tone on the open message.
- **Window-closing warning** — a rising tension cue as the shared close approaches. This *must* ride the server's clock (the same message everyone gets), never a client-side timer guess, or players hear it at different real-world moments — which would undercut the "closes for everyone at the same instant" promise.

These slot into the same engine (`playOneShot` / a tension bed); only the *trigger source* is new — a message handler in the (not-yet-built) WebSocket layer instead of the game loop. Nothing in the current design blocks on them.

## Changelog

- **v5 — 2026-06-07** — Performance + lifecycle pass on the audio *code* (no design change): the engine change-gates its per-frame bed gain / mute / volume calls (constant beds no longer reschedule a ramp every frame); loops fade out on a cancelable timer so a quick re-toggle revives the same source instead of double-playing; the engine now `dispose()`s its `AudioContext` on unmount (was leaking one per landing↔game trip until the browser refused new ones). Preload trimmed to the default-weather set (footstep/charted/breath/wind) — rain + waterstep lazy-load in Storm. `useAudio` shed its dead mute/volume state (the loop owns that via Tweaks). Landing music: detach the first-gesture listeners once playback starts (was firing on every `pointermove`), and guard the crossfade against a `stop()` landing mid-`play()`. Shared `clamp01` (`lib/num.ts`) replaces the hand-inlined 0..1 clamps.
- **v4 — 2026-06-07** — Removed the wall-bump sound (walking into a wall is now silent). Extended the background score to play **in-game too**, much quieter than on the landing (`soundMusic`/`musicVolume` tweaks, default ~18%), reusing the same shuffle bed as a separate quiet instance. Added volume tweaks for the remaining sounds without one — charting flourish, exit sting, and in-game music — so every sound now has a level control in the Audio panel.
- **v3 — 2026-06-07** — Added landing-page background music: four cinematic tracks organized into `sounds/music/`, played as a sequential shuffle (random track → full play → ~4 s crossfade → another random track) via a separate streaming system (`LandingMusic` over `HTMLAudioElement`, not the buffer-based in-game engine — music is minutes-long stereo). Starts on the first gesture on the landing, fades out on the dive; a ♪ on/off toggle lives in the landing nav.
- **v2 — 2026-06-07** — Made audio tunable + fixed always-on rain. Added the `audio*` fields to the `Tweaks` type and a separate dev-only `AudioTweaks` panel (own FAB + `Y` hotkey) for master volume/mute, per-sound toggles + volumes, breath intensity, factory drone, and thunder volume + spacing. Beds now follow the visual weather (rain only in Storm — the bug fix; wind follows the Wind toggle; factory is opt-in) via `ensureBed`. Thunder spacing (`thunderGap`) drives the renderer's strike interval so flash and boom space out together. Added a wet `waterstep` that replaces the footstep in Storm.
- **v1 — 2026-06-07** — Initial audio design: the three roles (one-shot SFX / ambient beds / stateful loop), the sound→event map against the real runtime, the engine/manifest/hook architecture (plain Web Audio class, not `use-sound`/Howler, because the game loop is a mutable-ref rAF loop firing overlapping one-shots imperatively), the autoplay-unlock and decode-once loading strategy, and a parked section for server-driven window cues once the Go server lands.
