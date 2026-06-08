// sounds.ts — the audio manifest. One typed map from a logical sound name to its
// public URL + playback defaults. This is the only place that knows file paths;
// add or swap a sound here and nowhere else. Files live in client/public/sounds/
// (grouped by theme) and are served as-is, referenced by absolute URL.
//
// See audio.md for the design: three roles (one-shot SFX / ambient bed / stateful
// loop) and the sound -> game-event map.

export type SoundRole = 'oneshot' | 'bed' | 'loop'

export interface SoundDef {
  url: string
  role: SoundRole
  // base gain 0..1 applied on top of master volume
  volume: number
  // +/- random pitch (playbackRate) variance per play, so repeats don't machine-gun.
  // oneshots only; 0 = no variance.
  pitchVar?: number
  // whether to eagerly fetch+decode on init (small/critical) or lazy-load on first use
  preload?: boolean
}

// Logical names the rest of the app uses. Adding a name here is a compile-time
// contract — playOneShot('typo') won't type-check. `satisfies` keeps the literal
// keys (so SoundName below is the union of names) while checking each value is a
// SoundDef; reads go through the SoundDef type via the `defOf` helper at the bottom.
export const SOUNDS = {
  // --- player one-shots ---
  footstep: {
    url: '/sounds/player/data_pion-st1-footstep-sfx-323053.mp3',
    role: 'oneshot', volume: 0.5, pitchVar: 0.12, preload: true,
  },
  // wet footstep — splashy variant played instead of `footstep` in Storm weather.
  // Not preloaded: it's only reachable in Storm, so it lazy-loads on the first wet
  // step (one footstep may be silent while it decodes — inaudible in practice).
  waterstep: {
    url: '/sounds/player/freesound_community-water-step-90358.mp3',
    role: 'oneshot', volume: 0.5, pitchVar: 0.12,
  },
  // ambient dry-leaves rustle — a looping bed that swells in and out on its own (its
  // gain is modulated by a slow LFO in useGame, scaled by the leaves intensity tweak).
  leaves: {
    url: '/sounds/nature/dragon-studio-dry-leaves-rustling-482874.mp3',
    role: 'bed', volume: 0.5, preload: true,
  },

  // --- creatures ---
  // monster growl — a one-shot that fires when the player stands still too long (idle
  // threshold tweak). Loud and meant to startle, so it plays at full level AND ducks
  // every other sound while it sounds (see useGame + AudioEngine.duck). Preloaded so the
  // first scare isn't a silent decode gap.
  growl: {
    url: '/sounds/creatures/dragon-studio-monster-growl-376892.mp3',
    role: 'oneshot', volume: 0.9, pitchVar: 0.08, preload: true,
  },

  // --- stateful loop: gain + playback rate track an "exertion" signal (step
  //     cadence), set every frame ---
  breath: {
    url: '/sounds/player/freesound_community-male-breathing-84775.mp3',
    role: 'loop', volume: 0.0, preload: true, // starts silent, modulated up
  },

  // --- ambient beds: long loops, volume-automated, crossfaded ---
  // rain bed — only audible in Storm (~1 MB), so not preloaded: it lazy-loads when
  // weather first turns Storm; startLoop retries each frame and the 1.5s fade-in masks
  // the decode. Wind below IS preloaded (it's on by default, used from game entry).
  rain: {
    url: '/sounds/weather/rain/freesound_community-rain-on-concrete-sound-30331.mp3',
    role: 'bed', volume: 0.35,
  },
  wind: {
    url: '/sounds/weather/wind/soundreality-wind-blowing-457954.mp3',
    role: 'bed', volume: 0.3, preload: true,
  },
  // distant factory machines — played SEQUENTIALLY as one-shots (one at a time, random
  // gaps between) by useGame's factory scheduler, routed through the engine's "distant"
  // bus (low-pass + reverb) so they read as machinery off in the distance rather than a
  // wall of drone. Opt-in + large, so none preload — they lazy-load on first factory use.
  machine1: { url: '/sounds/machines/audiopapkin-futuristic-factory-machine-ps-014-314825.mp3', role: 'oneshot', volume: 0.6 },
  machine2: { url: '/sounds/machines/audiopapkin-futuristic-factory-machine-ps-022-314833.mp3', role: 'oneshot', volume: 0.6 },
  machine3: { url: '/sounds/machines/audiopapkin-futuristic-factory-machine-ps-023-314834.mp3', role: 'oneshot', volume: 0.6 },
  machine4: { url: '/sounds/machines/audiopapkin-futuristic-factory-machine-ps-024-314835.mp3', role: 'oneshot', volume: 0.6 },

  // --- thunder one-shots (lazy: big files, only needed in a storm) ---
  thunder1: { url: '/sounds/weather/thunder/freesound_community-big-thunder-clap-99753.mp3', role: 'oneshot', volume: 0.7, pitchVar: 0.06 },
  thunder2: { url: '/sounds/weather/thunder/soundreality-thunder-city-377703.mp3', role: 'oneshot', volume: 0.7, pitchVar: 0.06 },
  thunder3: { url: '/sounds/weather/thunder/u_q2hb2391vb-thunder-clap-521194.mp3', role: 'oneshot', volume: 0.75, pitchVar: 0.06 },
  thunder4: { url: '/sounds/weather/thunder/universfield-loud-thunder-192165.mp3', role: 'oneshot', volume: 0.8, pitchVar: 0.06 },
} satisfies Record<string, SoundDef>

export type SoundName = keyof typeof SOUNDS

// Read a sound's def through the uniform SoundDef type. `satisfies` above gives each
// entry a distinct literal type (a union), so optional fields like pitchVar don't
// read cleanly off the raw lookup; this widens to SoundDef for consumers.
export function defOf(name: SoundName): SoundDef {
  return SOUNDS[name]
}

// the four thunder variants, for picking one at random per strike
export const THUNDERS: SoundName[] = ['thunder1', 'thunder2', 'thunder3', 'thunder4']
