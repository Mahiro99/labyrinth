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

export function AudioTweaks({ t, setTweak }: { t: Tweaks; setTweak: (keyOrEdits: keyof Tweaks | Partial<Tweaks>, val?: unknown) => void }) {
  // A volume slider on a 0–100 scale, backed by a 0..1 tweak. Drag range is whole
  // numbers 0–100; we scale the stored 0..1 up for display and divide back down on
  // change, so no audio formula has to learn a new unit.
  const VolSlider = ({ label, k }: { label: string; k: keyof Tweaks }) => (
    <TweakSlider label={label} value={Math.round((t[k] as number) * 100)} min={0} max={100} step={1}
      onChange={(v) => setTweak(k, v / 100)} />
  );

  return (
    <TweaksPanel title="Audio" hotkey="y" fabLabel="♪ Audio" fabStyle={{ right: 132 }}>
      <TweakSection label="Master" />
      <TweakToggle label="Mute all" value={t.audioMuted} onChange={(v) => setTweak('audioMuted', v)} />
      {!t.audioMuted && <VolSlider label="Volume" k="audioVolume" />}

      <TweakSection label="You" />
      <TweakToggle label="Footsteps" value={t.soundFootsteps} onChange={(v) => setTweak('soundFootsteps', v)} />
      {t.soundFootsteps && <VolSlider label="Footstep volume" k="footstepVolume" />}
      <TweakToggle label="Breathing" value={t.soundBreathing} onChange={(v) => setTweak('soundBreathing', v)} />
      {t.soundBreathing && <>
        {/* base loudness (the floor the breath sits at) … */}
        <VolSlider label="Breathing volume" k="breathVolume" />
        {/* … and how much fast stepping swells it above that floor */}
        <VolSlider label="Exertion swell" k="breathAmt" />
      </>}
      <VolSlider label="Exit sting volume" k="exitVolume" />

      <TweakSection label="Ambient beds" />
      {/* dry-leaves rustle — a standalone ambient bed that swells in and out on its own */}
      <TweakToggle label="Leaves rustle" value={t.soundLeaves} onChange={(v) => setTweak('soundLeaves', v)} />
      {t.soundLeaves && <>
        <VolSlider label="Leaves volume" k="leavesVolume" />
        {/* how deeply the bed swells between gusts: 0 = steady, 100 = fades right down */}
        <VolSlider label="Leaves swell" k="leavesAmt" />
      </>}
      {/* rain follows the visual Weather — it's only audible in Storm */}
      <TweakToggle label={t.weather === 'Storm' ? 'Rain' : 'Rain (Storm only)'} value={t.soundRain} onChange={(v) => setTweak('soundRain', v)} />
      {t.soundRain && <VolSlider label="Rain volume" k="rainVolume" />}
      {/* wind follows the visual Wind toggle */}
      <TweakToggle label={t.wind ? 'Wind' : 'Wind (needs Wind on)'} value={t.soundWind} onChange={(v) => setTweak('soundWind', v)} />
      {t.soundWind && <VolSlider label="Wind volume" k="windVolume" />}
      <TweakToggle label="Factory drone" value={t.soundFactory} onChange={(v) => setTweak('soundFactory', v)} />
      {t.soundFactory && <VolSlider label="Factory volume" k="factoryVolume" />}

      <TweakSection label="Thunder" />
      {/* the strike CADENCE lives in visual Tweaks > Storm (one timer drives flash+boom);
          here we only gate the boom + set its loudness */}
      <TweakToggle label="Thunder" value={t.soundThunder} onChange={(v) => setTweak('soundThunder', v)} />
      {t.soundThunder && <VolSlider label="Thunder volume" k="thunderVolume" />}

      <TweakSection label="Music" />
      {/* the same shuffle score as the landing, kept quiet under gameplay */}
      <TweakToggle label="Background music" value={t.soundMusic} onChange={(v) => setTweak('soundMusic', v)} />
      {t.soundMusic && <VolSlider label="Music volume" k="musicVolume" />}
    </TweaksPanel>
  );
}
