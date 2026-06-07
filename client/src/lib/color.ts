// color.ts — shared color helpers used by the renderer, the worlds, and the minimap.
// Consolidates what were three near-identical private copies (_rgb/_mix/_rgba in
// render3d, hexToRgb/mix/rgba in render, _rgb/css/clamp in worlds).

/** "#rgb" or "#rrggbb" -> [r, g, b] (0-255). */
export function hexToRgb(h: string): number[] {
  h = h.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Linear blend of two colors (hex string or rgb array) at t in [0,1] -> rgb array. */
export function mix(a: string | number[], b: string | number[], t: number): number[] {
  const A = typeof a === 'string' ? hexToRgb(a) : a
  const B = typeof b === 'string' ? hexToRgb(b) : b
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]
}

/** rgb array + alpha -> "rgba(...)" css string. */
export function rgba(c: number[], a: number): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
}

/** rgb array -> "rgb(...)" css string. */
export function css(c: number[]): string {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
}

/** Clamp a channel value to [0, 255]. */
export function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}
