// num.ts — small shared numeric helpers (sibling to color.ts's clamp255).

/** Clamp a value to the normalized [0, 1] range — gains, volumes, fade factors. */
export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
