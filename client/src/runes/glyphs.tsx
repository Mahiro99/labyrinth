// glyphs.tsx — the Labyrinth rune alphabet: glyph geometry, glow palettes, and the
// keystone direction chevron. Extracted from the "Rune Alphabet" design handoff.
//
// The design, as it was locked in the design session:
//   • Two coherent 5-rune scripts — GEOMETRIC and ALCHEMICAL. (The "phosphor matrix"
//     script explored in the handoff was cut.)
//   • Each rune is self-lit "glowing inlay": a core-coloured mark that bleeds a soft
//     glow, read against the dark concrete-void of the maze.
//   • One keystone vector — the chevron diacritic — that any rune may carry in its
//     reserved baseline slot to point along a grid direction. (The two rival
//     treatments, baseline-vector and perimeter-tick, were cut.)
//
// Geometry lives in geometry.ts as plain path data (shared with the canvas carver
// in render/runeCarve.ts — the carved-into-stone material); this module dresses it
// as SVG. Marks are drawn in `currentColor`, so the rendering component sets the
// hue once. The runes' material (glowing inlay vs. carved-into-stone) is a
// rendering concern — this module owns the inlay side only.

import type { ReactElement, SVGProps } from 'react'
import { GLYPH_GEOMETRY, SCRIPT_STROKE, chevronPath } from './geometry'
import type { Direction, GlyphGeometry, RuneIndex, RuneScript } from './geometry'

// The shared geometry types (RuneScript / RuneIndex / Direction / RUNES_PER_SCRIPT) live
// in geometry.ts — import them from there. They're intentionally NOT re-exported here: a
// .tsx that exports both components (glyph/chevron) and re-exported values trips
// react-refresh's only-export-components rule. The runes/ barrel (index.ts) re-exports
// everything from one place.

/** A glow pair: the bright `core` the mark is drawn in, and the `glow` it bleeds. */
export interface GlowPalette {
  core: string
  glow: string
}

// ── Glow palettes ────────────────────────────────────────────────────────────────
// Amber is the locked working glow (it matches the headlamp); the rest stayed on the
// table. Hue must never imply a rune's hidden voice, so the choice is purely
// aesthetic — never semantic.
export const GLOW = {
  amber:  { core: '#ffe1b0', glow: '#ff9e3d' },
  cyan:   { core: '#d2eeff', glow: '#48b8ff' },
  green:  { core: '#d8ffe8', glow: '#43dd86' },
  violet: { core: '#ecdcff', glow: '#a877ff' },
  rose:   { core: '#ffdfe2', glow: '#ff6f8a' },
} satisfies Record<string, GlowPalette>

export const DEFAULT_GLOW: GlowPalette = GLOW.amber

/** The layered drop-shadow that turns a flat mark into self-lit inlay. */
export function glowFilter({ core, glow }: GlowPalette): string {
  return `drop-shadow(0 0 1.5px ${core}) drop-shadow(0 0 5px ${glow}) drop-shadow(0 0 13px ${glow})`
}

// ── Glyph dressing ───────────────────────────────────────────────────────────────
// Path data → SVG marks. One stroke weight per script keeps each alphabet
// optically uniform; filled marks (dots) ride alongside their stroked geometry.
const STROKE: Record<RuneScript, SVGProps<SVGGElement>> = {
  geometric:  { fill: 'none', stroke: 'currentColor', strokeWidth: SCRIPT_STROKE.geometric, strokeLinecap: 'round', strokeLinejoin: 'round' },
  alchemical: { fill: 'none', stroke: 'currentColor', strokeWidth: SCRIPT_STROKE.alchemical, strokeLinecap: 'round', strokeLinejoin: 'round' },
}

const marks = (g: GlyphGeometry): ReactElement => (
  <>
    <path d={g.stroke} />
    {g.fill && <path d={g.fill} fill="currentColor" stroke="none" />}
  </>
)

/** The glyph mark for a script + index, wrapped in that script's stroke preset. */
export function glyph(script: RuneScript, index: RuneIndex): ReactElement {
  return <g {...STROKE[script]}>{marks(GLYPH_GEOMETRY[script][index])}</g>
}

// ── Keystone chevron (the locked direction vector) ─────────────────────────────────
// A filled caret in the rune's reserved baseline slot, centred at (50, 88). Always
// read, never deduced — cosmetic most days, decisive on a "vector" day.
export function chevron(dir: Direction): ReactElement {
  return <path d={chevronPath(dir)} fill="currentColor" stroke="none" />
}

// ── Catalogue (human labels for tooling / debugging) ───────────────────────────────
export const SCRIPT_LABEL: Record<RuneScript, string> = {
  geometric: 'Geometric',
  alchemical: 'Alchemical',
}

export const RUNE_LABELS: Record<RuneScript, readonly string[]> = {
  geometric: ['triangle-bar', 'ringed-bar', 'dotted-diamond', 'hourglass', 'windowpane'],
  alchemical: ['sun', 'crescent', 'orb-on-stem', 'horns-up', 'barred-circle'],
}
