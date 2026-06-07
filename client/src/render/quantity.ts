// quantity.ts — one place to tune how the "amount / density" sliders become
// on-screen counts. Every such slider is a plain 0..1 intensity in the UI; this
// maps that intensity to an actual element count.
//
// Why this exists: the old maps were linear (count = base * value) and the value
// effectively topped out around 1, so cranking a slider barely changed anything.
// Here each layer gets a generous `peak` (its count at intensity 1) and a `gamma`
// curve, so the slider has real range and the top end piles on hard. To make a
// layer denser everywhere, raise its `peak`; the matching pool in particles.ts
// must be >= peak or the pool, not the slider, becomes the ceiling.

export interface QtySpec {
  peak: number // element count at intensity 1
  gamma?: number // >1 ramps growth toward the top of the slider; 1 = linear
}

export const QUANTITY = {
  pebbles: { peak: 760, gamma: 1.4 },
  groundLife: { peak: 600, gamma: 1.4 },
  bugs: { peak: 40, gamma: 1.3 },
  driftLeaves: { peak: 400, gamma: 1.4 },
  stars: { peak: 760, gamma: 1.3 },
  clouds: { peak: 84, gamma: 1.3 },
  haze: { peak: 380, gamma: 1.5 },
  rain: { peak: 1400, gamma: 1.2 },
} as const

/** Map an intensity (0..1) to an integer element count via the spec's curve. */
export function qty(intensity: number, spec: QtySpec): number {
  const f = intensity <= 0 ? 0 : intensity >= 1 ? 1 : intensity
  return Math.round(spec.peak * Math.pow(f, spec.gamma ?? 1.4))
}
