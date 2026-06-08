// GameTweaks.tsx — the full Tweaks control tree for the Labyrinth view. Every
// section/row/range/option is driven by the live Tweaks state from useGame.

import { TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakSlider, TweakToggle, TweakColor } from '../tweaks'
import type { Tweaks } from '../types'

// Slider readout for 0..1 "intensity" sliders — show a whole-number percentage.
const asPercent = (v: number) => Math.round(v * 100) + '%'

export function GameTweaks({ t, setTweak }: { t: Tweaks; setTweak: (keyOrEdits: keyof Tweaks | Partial<Tweaks>, val?: unknown) => void }) {
  return (
    <TweaksPanel>
      <TweakSection label="World" />
      <TweakRadio label="Time of day" value={t.mrTime} options={['Day', 'Night']} onChange={(v) => setTweak('mrTime', v)} />
      <TweakSelect label="Weather" value={t.weather} options={['Clear', 'Storm']} onChange={(v) => setTweak('weather', v)} />
      {t.weather === 'Storm' && <TweakSlider label="Rain intensity" value={t.rainAmt} min={0.05} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('rainAmt', v)} />}
      {t.weather === 'Storm' && <TweakSlider label="Storm clouds" value={t.stormClouds} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('stormClouds', v)} />}
      {t.weather === 'Storm' && <TweakToggle label="Lightning" value={t.lightning} onChange={(v) => setTweak('lightning', v)} />}
      <TweakToggle label="Sky (sun / stars)" value={t.sky} onChange={(v) => setTweak('sky', v)} />
      {t.sky && <>
        <TweakSlider label="Sun azimuth" value={t.sunAz} min={-180} max={180} step={5} onChange={(v) => setTweak('sunAz', v)} />
        <TweakSlider label="Sun height" value={t.sunHeight} min={0} max={1} step={0.05} onChange={(v) => setTweak('sunHeight', v)} />
        {t.mrTime === 'Day' && t.weather === 'Clear' && <TweakSlider label="Sky blueness" value={t.skyBlue} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('skyBlue', v)} />}
        {t.mrTime === 'Night' && <TweakSlider label="Star density" value={t.starDensity} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('starDensity', v)} />}
        <TweakToggle label="Distant spires" value={t.landmark} onChange={(v) => setTweak('landmark', v)} />
        {t.landmark && <TweakSlider label="Spire count" value={t.spireCount} min={0} max={64} step={1} onChange={(v) => setTweak('spireCount', v)} />}
        {t.landmark && <TweakSlider label="Spire height" value={t.spireHeight} min={0.3} max={3} step={0.1} onChange={(v) => setTweak('spireHeight', v)} />}
        <TweakToggle label="Drifting clouds" value={t.clouds} onChange={(v) => setTweak('clouds', v)} />
        {t.clouds && t.weather !== 'Storm' && <TweakSlider label="Cloud amount" value={t.cloudAmount} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('cloudAmount', v)} />}
        {t.clouds && <TweakSlider label="Cloud speed" value={t.cloudSpeed} min={0} max={4} step={0.1} onChange={(v) => setTweak('cloudSpeed', v)} />}
        {t.clouds && <TweakSlider label="Cloud shade" value={t.cloudShade} min={0} max={1} step={0.05} onChange={(v) => setTweak('cloudShade', v)} />}
        {t.clouds && <TweakColor label="Cloud color" value={t.cloudColor} options={['#bcc3c7', '#e8eaec', '#9aa6b0', '#c9b9a4', '#7a8694']} onChange={(v) => setTweak('cloudColor', v)} />}
      </>}
      <TweakToggle label="Directional light" value={t.sunLight} onChange={(v) => setTweak('sunLight', v)} />
      {t.sunLight && <TweakSlider label="Light contrast" value={t.lightContrast} min={0} max={1} step={0.05} onChange={(v) => setTweak('lightContrast', v)} />}

      <TweakSection label="Ground" />
      <TweakToggle label="Floor grates" value={t.floorDetail} onChange={(v) => setTweak('floorDetail', v)} />
      {t.floorDetail && <TweakSlider label="Grate frequency" value={t.grateAmt} min={0} max={1} step={0.02} format={asPercent} onChange={(v) => setTweak('grateAmt', v)} />}
      <TweakToggle label="Pebbles" value={t.pebbles} onChange={(v) => setTweak('pebbles', v)} />
      {t.pebbles && <>
        <TweakSlider label="Density" value={t.pebbleDensity} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('pebbleDensity', v)} />
        <TweakSlider label="Size" value={t.pebbleSize} min={0.3} max={2.5} step={0.1} onChange={(v) => setTweak('pebbleSize', v)} />
        <TweakSlider label="Randomness" value={t.pebbleRandom} min={0} max={1} step={0.05} onChange={(v) => setTweak('pebbleRandom', v)} />
      </>}
      <TweakToggle label="Grass & leaves" value={t.groundLife} onChange={(v) => setTweak('groundLife', v)} />
      {t.groundLife && <TweakSlider label="Ground life" value={t.groundLifeAmt} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('groundLifeAmt', v)} />}
      <TweakToggle label="Drifting leaves" value={t.driftLeaves} onChange={(v) => setTweak('driftLeaves', v)} />
      {t.driftLeaves && <>
        <TweakSlider label="Leaf amount" value={t.driftAmt} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('driftAmt', v)} />
        <TweakSlider label="Blow direction" value={t.driftDir} min={-180} max={180} step={15} onChange={(v) => setTweak('driftDir', v)} />
        <TweakSlider label="Blow speed" value={t.driftSpeed} min={0.1} max={3} step={0.1} onChange={(v) => setTweak('driftSpeed', v)} />
      </>}
      <TweakToggle label="Bugs" value={t.bugs} onChange={(v) => setTweak('bugs', v)} />
      {t.bugs && <TweakSlider label="Bug amount" value={t.bugAmt} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('bugAmt', v)} />}

      <TweakSection label="Walls" />
      <TweakSlider label="Staining" value={t.stainAmount} min={0} max={2} step={0.25} onChange={(v) => setTweak('stainAmount', v)} />
      <TweakSlider label="Cracks" value={t.crackAmount} min={0} max={2} step={0.25} onChange={(v) => setTweak('crackAmount', v)} />

      <TweakSection label="Vines" />
      <TweakToggle label="Hanging vines" value={t.vines} onChange={(v) => setTweak('vines', v)} />
      {t.vines && <>
        <TweakRadio label="Leaf style" value={t.vineStyle} options={['Leaves', 'Ivy', 'Mixed']} onChange={(v) => setTweak('vineStyle', v)} />
        <TweakSlider label="Density" value={t.vineDensity} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('vineDensity', v)} />
        <TweakSlider label="Length" value={t.vineLength} min={0.05} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('vineLength', v)} />
        <TweakSlider label="Closeness" value={t.vineCloseness} min={4} max={56} step={1} onChange={(v) => setTweak('vineCloseness', v)} />
        <TweakSlider label="Randomness" value={t.vineRandomness} min={0} max={1} step={0.05} onChange={(v) => setTweak('vineRandomness', v)} />
      </>}

      <TweakSection label="Wind" />
      <TweakToggle label="Wind" value={t.wind} onChange={(v) => setTweak('wind', v)} />
      {t.wind && <TweakSlider label="Strength" value={t.windAmt} min={0} max={1} step={0.05} onChange={(v) => setTweak('windAmt', v)} />}

      <TweakSection label="The marker — you" />
      <TweakColor label="Marker" value={t.markerColor} options={['#ff7a59', '#7c9cff', '#5ee0c8', '#f5c542', '#e8e6df']} onChange={(v) => setTweak('markerColor', v)} />
      <TweakSlider label="Move tween" value={t.tweenSpeed} min={0.05} max={0.5} step={0.01} onChange={(v) => setTweak('tweenSpeed', v)} />

      <TweakSection label="The light" />
      <TweakSlider label="Light radius" value={t.torchRadius} min={1} max={3} unit=" tiles" onChange={(v) => setTweak('torchRadius', v)} />
      <TweakSlider label="Falloff" value={t.falloff} min={0.6} max={3} step={0.1} onChange={(v) => setTweak('falloff', v)} />
      <TweakToggle label="Light flicker" value={t.flicker} onChange={(v) => setTweak('flicker', v)} />
      {t.flicker && <TweakSlider label="Flicker amount" value={t.flickerAmt} min={0} max={1} step={0.05} onChange={(v) => setTweak('flickerAmt', v)} />}

      <TweakSection label="Film grade" />
      <TweakToggle label="Grade" value={t.grade} onChange={(v) => setTweak('grade', v)} />
      {t.grade && <TweakSlider label="Grade strength" value={t.gradeAmt} min={0} max={1} step={0.05} onChange={(v) => setTweak('gradeAmt', v)} />}
      <TweakToggle label="Bloom" value={t.bloom} onChange={(v) => setTweak('bloom', v)} />
      {t.bloom && <TweakSlider label="Bloom strength" value={t.bloomAmt} min={0} max={0.7} step={0.02} onChange={(v) => setTweak('bloomAmt', v)} />}

      <TweakSection label="Atmosphere" />
      <TweakToggle label="Ambient occlusion" value={t.ao} onChange={(v) => setTweak('ao', v)} />
      {t.ao && <TweakSlider label="AO strength" value={t.aoStrength} min={0} max={1} step={0.05} onChange={(v) => setTweak('aoStrength', v)} />}
      <TweakToggle label="Edge rim light" value={t.rim} onChange={(v) => setTweak('rim', v)} />
      {t.rim && <TweakSlider label="Rim strength" value={t.rimStrength} min={0} max={1} step={0.05} onChange={(v) => setTweak('rimStrength', v)} />}
      <TweakToggle label="Airborne spores" value={t.haze} onChange={(v) => setTweak('haze', v)} />
      {t.haze && <TweakSlider label="Spore density" value={t.hazeAmt} min={0} max={1} step={0.05} format={asPercent} onChange={(v) => setTweak('hazeAmt', v)} />}
      <TweakToggle label="Film grain" value={t.grain} onChange={(v) => setTweak('grain', v)} />
      {t.grain && <TweakSlider label="Grain amount" value={t.grainAmt} min={0} max={1} step={0.05} onChange={(v) => setTweak('grainAmt', v)} />}

      <TweakSection label="Motion" />
      <TweakToggle label="Head bob" value={t.headBob} onChange={(v) => setTweak('headBob', v)} />
      {t.headBob && <TweakSlider label="Bob amount" value={t.bobAmt} min={0} max={1.5} step={0.05} onChange={(v) => setTweak('bobAmt', v)} />}
      <TweakToggle label="Turn sway" value={t.sway} onChange={(v) => setTweak('sway', v)} />
      {t.sway && <TweakSlider label="Sway amount" value={t.swayAmt} min={0} max={1.5} step={0.05} onChange={(v) => setTweak('swayAmt', v)} />}

      <TweakSection label="Display" />
      <TweakToggle label="Personal minimap" value={t.showMinimap} onChange={(v) => setTweak('showMinimap', v)} />
    </TweaksPanel>
  );
}
