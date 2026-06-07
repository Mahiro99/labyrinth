// corridorTweaks.ts — live-tunable knobs for the landing corridor's lighting.
//
// This is a *tuning rig*: dial the sliders until the tunnel reads right, then
// bake the readout values into CORRIDOR_DEFAULTS below — those are the shipped
// look for any visitor with no saved overrides. Corridor.tsx renders straight
// from these values (via vignetteCss), so the defaults ARE the scene.
//
// Two effects, two groups:
//  - vig*    → the static "suffocating dark" vignette (the main tunnel-vision).
//  - breathe → base alpha of the slow-pulsing second vignette.
//  - ivy*    → overall brightness/saturation of the green ivy dots.

export type CorridorTweaks = {
  vigInner: number;   // % radius of the clear, lit centre — smaller = tighter tunnel
  vigMid: number;     // % where the mid-dark stop sits — pull in to crowd the dark
  vigMidA: number;    // 0..1 alpha of that mid-dark — higher = darker walls
  vigEdgeA: number;   // 0..1 blackness at the very edges
  breathe: number;    // 0..1 base alpha of the breathing vignette (0 = off)
  ivyGlow: number;    // 0..1 overall ivy brightness (container opacity)
  ivySat: number;     // 0..1.5 ivy saturation (1 = as-authored, <1 = greyer)
};

export const CORRIDOR_DEFAULTS: CorridorTweaks = {
  vigInner: 0,
  vigMid: 95,
  vigMidA: 1,
  vigEdgeA: 0,
  breathe: 0,
  ivyGlow: 0,
  ivySat: 0,
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
