// corridorTweaks.ts — live-tunable knobs for the landing corridor's lighting.
//
// This is a *tuning rig*: dial the sliders until the tunnel reads right, then
// bake the readout values into CORRIDOR_DEFAULTS below — those are the shipped
// look for any visitor with no saved overrides. Corridor.tsx renders straight
// from these values (via vignetteCss), so the defaults ARE the scene.
//
// Effect groups:
//  - vig*    → the static "suffocating dark" vignette (the main tunnel-vision).
//  - breathe → base alpha of the slow-pulsing second vignette.
//  - twr*    → the distant towers' visibility (glow behind them, how lit they are).

export type CorridorTweaks = {
  vigInner: number;   // % radius of the clear, lit centre — smaller = tighter tunnel
  vigMid: number;     // % where the mid-dark stop sits — pull in to crowd the dark
  vigMidA: number;    // 0..1 alpha of that mid-dark — higher = darker walls
  vigEdgeA: number;   // 0..1 blackness at the very edges
  breathe: number;    // 0..1 base alpha of the breathing vignette (0 = off)
  twrGlow: number;    // 0..1 strength of the horizon glow band behind the towers
  twrLit: number;     // 0..1 how lit the tower crowns are (gradient top brightness)
  twrHaze: number;    // 0..1 opacity of the far pale haze towers
  twrWin: number;     // 0..2 red window brightness multiplier
};

// Baked from the dialed-in tuning panel: edges go full black and the dark
// breathes hard for maximum dread.
export const CORRIDOR_DEFAULTS: CorridorTweaks = {
  vigInner: 0,
  vigMid: 95,
  vigMidA: 1,
  vigEdgeA: 1,
  breathe: 1,
  twrGlow: 0.32,
  twrLit: 0.5,
  twrHaze: 0.4,
  twrWin: 1,
};

// Build the two vignette gradient strings from the current tweak values. Kept
// here (not in the component) so the panel's readout and Corridor render from
// one source — what you copy is exactly what's painted.
export function vignetteCss(t: CorridorTweaks) {
  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    // the static "suffocating dark — hard tunnel-vision closing in"
    static: `radial-gradient(86% 70% at 50% 47%, transparent ${r(t.vigInner)}%, ` +
      `rgba(2,3,2,${r(t.vigMidA)}) ${r(t.vigMid)}%, rgba(0,0,0,${r(t.vigEdgeA)}) 100%)`,
    // the slow "dark breathing" pulse layered on top
    breathe: `radial-gradient(68% 54% at 50% 47%, transparent 26%, rgba(0,0,0,${r(t.breathe)}) 100%)`,
  };
}

// Build the towers' visibility from the tweak values: the horizon glow band that
// sits behind their crowns, and the crown colour of the tower gradient (the rest
// of the gradient is fixed in Corridor.tsx). Kept here so the panel and the scene
// render from one source.
export function towerCss(t: CorridorTweaks) {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  // crown grey scales with twrLit: 0 → near-black, 1 → a clearly-lit cold grey.
  const c = Math.round(12 + t.twrLit * 52); // 12..64 grey level
  const crown = `rgb(${c},${c + 4},${Math.max(0, c - 6)})`;
  return {
    crown,
    glow: `radial-gradient(120% 100% at 50% 0%, rgba(120,130,118,${r(t.twrGlow)}) 0%, ` +
      `rgba(90,100,90,${r(t.twrGlow * 0.38)}) 40%, transparent 72%)`,
  };
}
