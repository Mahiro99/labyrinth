// AudioTweaks.tsx — a second, audio-only Tweaks panel for the Labyrinth view.
// Separate FAB (offset from the visual Tweaks button) + its own hotkey ('Y'), but
// reuses the same TweaksPanel UI. Drives the audio.* fields of the live Tweaks
// state; the game loop reads those each frame (see useGame + audio.md).

import { TweaksPanel, TweakSection, TweakSlider, TweakToggle } from '../tweaks'
import type { Tweaks } from '../types'

const asPercent = (v: number) => Math.round(v * 100) + '%'
const asSeconds = (v: number) => v + 's'

export function AudioTweaks({ t, setTweak }: { t: Tweaks; setTweak: (keyOrEdits: keyof Tweaks | Partial<Tweaks>, val?: unknown) => void }) {
  return (
    <TweaksPanel title="Audio" hotkey="y" fabLabel="♪ Audio" fabStyle={{ right: 132 }}>
      <TweakSection label="Master" />
      <TweakToggle label="Mute all" value={t.audioMuted} onChange={(v) => setTweak('audioMuted', v)} />
      {!t.audioMuted && <TweakSlider label="Volume" value={t.audioVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('audioVolume', v)} />}

      <TweakSection label="You" />
      <TweakToggle label="Footsteps" value={t.soundFootsteps} onChange={(v) => setTweak('soundFootsteps', v)} />
      {t.soundFootsteps && <TweakSlider label="Footstep volume" value={t.footstepVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('footstepVolume', v)} />}
      <TweakToggle label="Charting flourish" value={t.soundCharted} onChange={(v) => setTweak('soundCharted', v)} />
      {t.soundCharted && <TweakSlider label="Charting volume" value={t.chartedVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('chartedVolume', v)} />}
      <TweakToggle label="Breathing" value={t.soundBreathing} onChange={(v) => setTweak('soundBreathing', v)} />
      {t.soundBreathing && <TweakSlider label="Breath intensity" value={t.breathAmt} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('breathAmt', v)} />}
      <TweakSlider label="Exit sting volume" value={t.exitVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('exitVolume', v)} />

      <TweakSection label="Ambient beds" />
      {/* rain follows the visual Weather — it's only audible in Storm */}
      <TweakToggle label={t.weather === 'Storm' ? 'Rain' : 'Rain (Storm only)'} value={t.soundRain} onChange={(v) => setTweak('soundRain', v)} />
      {t.soundRain && <TweakSlider label="Rain volume" value={t.rainVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('rainVolume', v)} />}
      {/* wind follows the visual Wind toggle */}
      <TweakToggle label={t.wind ? 'Wind' : 'Wind (needs Wind on)'} value={t.soundWind} onChange={(v) => setTweak('soundWind', v)} />
      {t.soundWind && <TweakSlider label="Wind volume" value={t.windVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('windVolume', v)} />}
      <TweakToggle label="Factory drone" value={t.soundFactory} onChange={(v) => setTweak('soundFactory', v)} />
      {t.soundFactory && <TweakSlider label="Factory volume" value={t.factoryVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('factoryVolume', v)} />}

      <TweakSection label="Thunder" />
      <TweakToggle label="Thunder" value={t.soundThunder} onChange={(v) => setTweak('soundThunder', v)} />
      {t.soundThunder && <>
        <TweakSlider label="Thunder volume" value={t.thunderVolume} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('thunderVolume', v)} />
        {/* spaces both the flash and the boom — they fire off the same strike event */}
        <TweakSlider label="Strike spacing" value={t.thunderGap} min={2} max={30} step={1} format={asSeconds} onChange={(v) => setTweak('thunderGap', v)} />
      </>}

      <TweakSection label="Music" />
      {/* the same shuffle score as the landing, kept quiet under gameplay */}
      <TweakToggle label="Background music" value={t.soundMusic} onChange={(v) => setTweak('soundMusic', v)} />
      {t.soundMusic && <TweakSlider label="Music volume" value={t.musicVolume} min={0} max={0.6} step={0.02} format={asPercent} onChange={(v) => setTweak('musicVolume', v)} />}
    </TweaksPanel>
  );
}
