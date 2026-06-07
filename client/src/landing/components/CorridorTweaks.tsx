// CorridorTweaks.tsx — Tweaks panel for the landing corridor's lighting. Same
// shell/controls as the game's GameTweaks; drives the live CorridorTweaks state
// from Landing. The bottom block echoes the resulting gradient CSS so you can
// copy the dialed-in values straight back into Corridor.tsx.

import { TweaksPanel, TweakSection, TweakSlider, TweakButton } from '../../tweaks'
import { vignetteCss } from '../corridorTweaks'
import type { CorridorTweaks as T } from '../corridorTweaks'

const asPercent = (v: number) => Math.round(v * 100) + '%'

export function CorridorTweaks(
  { t, setTweak }: { t: T; setTweak: (keyOrEdits: keyof T | Partial<T>, val?: unknown) => void },
) {
  const css = vignetteCss(t)
  const copy = () => {
    try { navigator.clipboard?.writeText(`static:  ${css.static}\nbreathe: ${css.breathe}`) } catch { /* ignore */ }
  }
  return (
    <TweaksPanel title="Corridor" anchor="bottom">
      <TweakSection label="Tunnel vision" />
      <TweakSlider label="Lit centre" value={t.vigInner} min={0} max={50} step={1} unit="%"
        onChange={(v) => setTweak('vigInner', v)} />
      <TweakSlider label="Dark closes in" value={t.vigMid} min={30} max={95} step={1} unit="%"
        onChange={(v) => setTweak('vigMid', v)} />
      <TweakSlider label="Dark strength" value={t.vigMidA} min={0} max={1} step={0.02} format={asPercent}
        onChange={(v) => setTweak('vigMidA', v)} />
      <TweakSlider label="Edge blackness" value={t.vigEdgeA} min={0} max={1} step={0.02} format={asPercent}
        onChange={(v) => setTweak('vigEdgeA', v)} />
      <TweakSlider label="Breathing" value={t.breathe} min={0} max={1} step={0.02} format={asPercent}
        onChange={(v) => setTweak('breathe', v)} />

      <TweakSection label="Ivy glow" />
      <TweakSlider label="Brightness" value={t.ivyGlow} min={0} max={1} step={0.02} format={asPercent}
        onChange={(v) => setTweak('ivyGlow', v)} />
      <TweakSlider label="Saturation" value={t.ivySat} min={0} max={1.5} step={0.05} format={asPercent}
        onChange={(v) => setTweak('ivySat', v)} />

      <TweakSection label="Resulting CSS" />
      <div style={{ font: '10.5px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
        opacity: 0.7, wordBreak: 'break-all', userSelect: 'text' }}>
        {css.static}
      </div>
      <TweakButton label="Copy gradients" onClick={copy} />
    </TweaksPanel>
  )
}
