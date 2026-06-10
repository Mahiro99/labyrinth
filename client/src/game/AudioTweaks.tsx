// AudioTweaks.tsx — a second, audio-only Tweaks panel for the Labyrinth view.
// Separate FAB (offset from the visual Tweaks button) + its own hotkey ('Y'), but
// reuses the same TweaksPanel UI. Drives the audio.* fields of the live Tweaks
// state; the game loop reads those each frame (see useGame + audio.md).
//
// Every sound has a control here, and every VOLUME slider drags on a 0–100 scale
// (see VolSlider): the gain math elsewhere stays in 0..1, so the slider converts at
// the edges (×100 in, ÷100 out) rather than rippling a new unit through the engine.
// The storm CADENCE (how often lightning+thunder fire) is NOT here — it's a single
// "Storm frequency" control in the visual Tweaks > World > Storm section, because one
// timer drives both the flash and the boom (see render3d + useGame).

import { TweaksPanel, TweakSection, TweakSlider, TweakToggle } from '../tweaks'
import type { Tweaks } from '../types'

type SetTweak = (keyOrEdits: keyof Tweaks | Partial<Tweaks>, val?: unknown) => void

// A volume slider on a 0–100 scale, backed by a 0..1 tweak. Drag range is whole numbers
// 0–100; we scale the stored 0..1 up for display and divide back down on change, so no
// audio formula has to learn a new unit.
//
// MUST live at module scope, not inside AudioTweaks: a component defined in the render body
// gets a fresh function identity every render, so React unmounts/remounts its <input> on
// each tweak change — which severs the native range slider's drag mid-gesture (one step per
// drag). Hoisted here, t/setTweak come in as props.
function VolSlider({ label, k, t, setTweak }: { label: string; k: keyof Tweaks; t: Tweaks; setTweak: SetTweak }) {
  return (
    <TweakSlider label={label} value={Math.round((t[k] as number) * 100)} min={0} max={100} step={1}
      onChange={(v) => setTweak(k, v / 100)} />
  )
}

export function AudioTweaks({ t, setTweak }: { t: Tweaks; setTweak: SetTweak }) {
  // vol() is a plain render helper that CALLS VolSlider's element into being inline; the
  // element type stays the stable module-scope VolSlider, so its <input> is never remounted
  // mid-drag (the bug a render-body component would reintroduce).
  const vol = (label: string, k: keyof Tweaks) => <VolSlider label={label} k={k} t={t} setTweak={setTweak} />
  return (
    <TweaksPanel title="Audio" hotkey="y" fabLabel="♪ Audio" fabStyle={{ right: 132 }}>
      <TweakSection label="Master" />
      <TweakToggle label="Mute all" value={t.audioMuted} onChange={(v) => setTweak('audioMuted', v)} />
      {!t.audioMuted && vol('Volume', 'audioVolume')}

      <TweakSection label="You" />
      <TweakToggle label="Footsteps" value={t.soundFootsteps} onChange={(v) => setTweak('soundFootsteps', v)} />
      {t.soundFootsteps && vol('Footstep volume', 'footstepVolume')}
      <TweakToggle label="Breathing" value={t.soundBreathing} onChange={(v) => setTweak('soundBreathing', v)} />
      {t.soundBreathing && <>
        {/* base loudness (the floor the breath sits at) … */}
        {vol('Breathing volume', 'breathVolume')}
        {/* … and how much fast stepping swells it above that floor */}
        {vol('Exertion swell', 'breathAmt')}
      </>}
      {vol('Exit sting volume', 'exitVolume')}

      <TweakSection label="Ambient beds" />
      {/* dry-leaves rustle — a standalone ambient bed that swells in and out on its own */}
      <TweakToggle label="Leaves rustle" value={t.soundLeaves} onChange={(v) => setTweak('soundLeaves', v)} />
      {t.soundLeaves && <>
        {vol('Leaves volume', 'leavesVolume')}
        {/* how deeply the bed swells between gusts: 0 = steady, 100 = fades right down */}
        {vol('Leaves swell', 'leavesAmt')}
      </>}
      {/* rain follows the visual Weather — it's only audible in Storm */}
      <TweakToggle label={t.weather === 'Storm' ? 'Rain' : 'Rain (Storm only)'} value={t.soundRain} onChange={(v) => setTweak('soundRain', v)} />
      {t.soundRain && vol('Rain volume', 'rainVolume')}
      {/* wind follows the visual Wind toggle */}
      <TweakToggle label={t.wind ? 'Wind' : 'Wind (needs Wind on)'} value={t.soundWind} onChange={(v) => setTweak('soundWind', v)} />
      {t.soundWind && vol('Wind volume', 'windVolume')}
      {/* distant factory machines, played one at a time with random gaps */}
      <TweakToggle label="Distant machines" value={t.soundFactory} onChange={(v) => setTweak('soundFactory', v)} />
      {t.soundFactory && <>
        {vol('Machine volume', 'factoryVolume')}
        {/* how far off they sound — 0 close & clear, 100 muffled & echoing in the distance */}
        {vol('Distance', 'factoryDistance')}
      </>}

      <TweakSection label="Creatures" />
      {/* monster growl when the player stands still too long — ducks everything else */}
      <TweakToggle label="Monster growl" value={t.soundGrowl} onChange={(v) => setTweak('soundGrowl', v)} />
      {t.soundGrowl && <>
        {vol('Growl volume', 'growlVolume')}
        {/* idle time before it growls — your 1–15s knob */}
        <TweakSlider label="Growl after idle" value={t.growlIdleSec} min={1} max={15} step={1} unit="s" onChange={(v) => setTweak('growlIdleSec', v)} />
        {/* how much it lowers every other sound while it growls */}
        {vol('Ducks others by', 'growlDuck')}
      </>}

      <TweakSection label="Thunder" />
      {/* the strike CADENCE lives in visual Tweaks > Storm (one timer drives flash+boom);
          here we only gate the boom + set its loudness */}
      <TweakToggle label="Thunder" value={t.soundThunder} onChange={(v) => setTweak('soundThunder', v)} />
      {t.soundThunder && vol('Thunder volume', 'thunderVolume')}

      <TweakSection label="Music" />
      {/* the same shuffle score as the landing, kept quiet under gameplay */}
      <TweakToggle label="Background music" value={t.soundMusic} onChange={(v) => setTweak('soundMusic', v)} />
      {t.soundMusic && vol('Music volume', 'musicVolume')}
    </TweaksPanel>
  );
}
