// geometry.ts — renderer-agnostic geometry for the rune alphabet. One source of
// truth: every mark is an SVG path d-string, consumed two ways — as <path d> by
// the SVG layer (glyphs.tsx → Rune.tsx, the self-lit inlay look) and as
// `new Path2D(d)` by the canvas carver (render/runeCarve.ts, the carved-into-
// stone look). Authored on the same 0..100 viewBox as the original hand-written
// primitives; the conversions are exact (circles become two arcs, the rounded
// rect becomes four corner arcs).

export type RuneScript = 'geometric' | 'alchemical'
export type RuneIndex = 0 | 1 | 2 | 3 | 4
export type Direction = 'up' | 'down' | 'left' | 'right'

export const RUNES_PER_SCRIPT = 5

/** A glyph's marks: `stroke` is the outlined geometry, `fill` the solid dots. */
export interface GlyphGeometry {
  stroke: string
  fill?: string
}

/** One stroke weight per script keeps each alphabet optically uniform. */
export const SCRIPT_STROKE: Record<RuneScript, number> = { geometric: 7, alchemical: 6 }

// a full circle as two arcs (Path2D and <path> both accept it; rendering is
// identical to <circle>)
const circ = (cx: number, cy: number, r: number): string =>
  `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} Z`

// A · Geometric — constructed primitives at one optical size.
// 00 triangle-bar · 01 ringed-bar · 02 dotted-diamond · 03 hourglass · 04 windowpane
const GEOMETRIC: readonly GlyphGeometry[] = [
  { stroke: 'M30 70 L50 28 L70 70 Z M38 57 L62 57' },
  { stroke: `${circ(50, 50, 22)} M28 50 L72 50` },
  { stroke: 'M50 28 L72 50 L50 72 L28 50 Z', fill: circ(50, 50, 2.6) },
  { stroke: 'M32 29 L68 29 L50 50 Z M32 71 L68 71 L50 50 Z' },
  // rect(30,30,40,40,rx=2) expanded to arcs + the windowpane cross
  { stroke: 'M32 30 H68 A2 2 0 0 1 70 32 V68 A2 2 0 0 1 68 70 H32 A2 2 0 0 1 30 68 V32 A2 2 0 0 1 32 30 Z M50 30 V70 M30 50 H70' },
]

// C · Alchemical — a shared circle module with one distinct appended mark each.
// 00 sun · 01 crescent · 02 orb-on-stem · 03 horns-up · 04 barred-circle
const ALCHEMICAL: readonly GlyphGeometry[] = [
  { stroke: circ(50, 48, 21), fill: circ(50, 48, 3.2) },
  { stroke: 'M59 28 A21 21 0 1 0 59 68 A15 15 0 1 1 59 28 Z' },
  { stroke: `${circ(50, 42, 19)} M50 61 L50 80` },
  { stroke: `${circ(50, 54, 18)} M38 40 L31 24 M62 40 L69 24` },
  { stroke: `${circ(50, 48, 20)} M23 48 L77 48` },
]

export const GLYPH_GEOMETRY: Record<RuneScript, readonly GlyphGeometry[]> = {
  geometric: GEOMETRIC,
  alchemical: ALCHEMICAL,
}

// ── Keystone chevron (the locked direction vector) ────────────────────────────
// A filled caret in the rune's reserved baseline slot, centred at (50, 88).
export function chevronPath(dir: Direction, cx = 50, cy = 88, s = 6): string {
  switch (dir) {
    case 'up':    return `M${cx} ${cy - s} L${cx - s} ${cy + s} L${cx + s} ${cy + s} Z`
    case 'down':  return `M${cx} ${cy + s} L${cx - s} ${cy - s} L${cx + s} ${cy - s} Z`
    case 'right': return `M${cx + s} ${cy} L${cx - s} ${cy - s} L${cx - s} ${cy + s} Z`
    case 'left':  return `M${cx - s} ${cy} L${cx + s} ${cy - s} L${cx + s} ${cy + s} Z`
  }
}
