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
// Geometry is authored on a 100×100 viewBox and is colour-independent: marks are
// drawn in `currentColor`, so the rendering component sets the hue once. The runes'
// material (glowing inlay vs. carved-into-stone) is a separate rendering concern —
// this module owns the shapes, not how they meet a wall.

import type { ReactElement, SVGProps } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
export type RuneScript = 'geometric' | 'alchemical'
export type RuneIndex = 0 | 1 | 2 | 3 | 4
export type Direction = 'up' | 'down' | 'left' | 'right'

/** A glow pair: the bright `core` the mark is drawn in, and the `glow` it bleeds. */
export interface GlowPalette {
  core: string
  glow: string
}

export const RUNES_PER_SCRIPT = 5

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

// ── Glyph geometry ───────────────────────────────────────────────────────────────
// Authored on a 0..100 viewBox. Marks inherit their colour from `currentColor`, so
// the tables below are static and shared across every render.

// One stroke weight per script keeps each alphabet optically uniform.
const STROKE: Record<RuneScript, SVGProps<SVGGElement>> = {
  geometric:  { fill: 'none', stroke: 'currentColor', strokeWidth: 7, strokeLinecap: 'round', strokeLinejoin: 'round' },
  alchemical: { fill: 'none', stroke: 'currentColor', strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' },
}

// A · Geometric — constructed primitives at one optical size.
// 00 triangle-bar · 01 ringed-bar · 02 dotted-diamond · 03 hourglass · 04 windowpane
const GEOMETRIC: readonly ReactElement[] = [
  <><polygon points="30,70 50,28 70,70" /><line x1="38" y1="57" x2="62" y2="57" /></>,
  <><circle cx="50" cy="50" r="22" /><line x1="28" y1="50" x2="72" y2="50" /></>,
  <><polygon points="50,28 72,50 50,72 28,50" /><circle cx="50" cy="50" r="2.6" fill="currentColor" stroke="none" /></>,
  <><polygon points="32,29 68,29 50,50" /><polygon points="32,71 68,71 50,50" /></>,
  <><rect x="30" y="30" width="40" height="40" rx="2" /><line x1="50" y1="30" x2="50" y2="70" /><line x1="30" y1="50" x2="70" y2="50" /></>,
]

// C · Alchemical — a shared circle module with one distinct appended mark each.
// 00 sun · 01 crescent · 02 orb-on-stem · 03 horns-up · 04 barred-circle
const ALCHEMICAL: readonly ReactElement[] = [
  <><circle cx="50" cy="48" r="21" /><circle cx="50" cy="48" r="3.2" fill="currentColor" stroke="none" /></>,
  <path d="M59 28 A21 21 0 1 0 59 68 A15 15 0 1 1 59 28 Z" />,
  <><circle cx="50" cy="42" r="19" /><line x1="50" y1="61" x2="50" y2="80" /></>,
  <><circle cx="50" cy="54" r="18" /><line x1="38" y1="40" x2="31" y2="24" /><line x1="62" y1="40" x2="69" y2="24" /></>,
  <><circle cx="50" cy="48" r="20" /><line x1="23" y1="48" x2="77" y2="48" /></>,
]

const GLYPHS: Record<RuneScript, readonly ReactElement[]> = {
  geometric: GEOMETRIC,
  alchemical: ALCHEMICAL,
}

/** The glyph mark for a script + index, wrapped in that script's stroke preset. */
export function glyph(script: RuneScript, index: RuneIndex): ReactElement {
  return <g {...STROKE[script]}>{GLYPHS[script][index]}</g>
}

// ── Keystone chevron (the locked direction vector) ─────────────────────────────────
// A filled caret in the rune's reserved baseline slot, centred at (50, 88). Always
// read, never deduced — cosmetic most days, decisive on a "vector" day.
function chevronPoints(dir: Direction, cx = 50, cy = 88, s = 6): string {
  switch (dir) {
    case 'up':    return `${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`
    case 'down':  return `${cx},${cy + s} ${cx - s},${cy - s} ${cx + s},${cy - s}`
    case 'right': return `${cx + s},${cy} ${cx - s},${cy - s} ${cx - s},${cy + s}`
    case 'left':  return `${cx - s},${cy} ${cx + s},${cy - s} ${cx + s},${cy + s}`
  }
}

export function chevron(dir: Direction): ReactElement {
  return <polygon points={chevronPoints(dir)} fill="currentColor" stroke="none" />
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
