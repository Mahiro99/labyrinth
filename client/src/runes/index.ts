// runes/ — the Labyrinth rune alphabet. The same glyph geometry renders two ways: as
// self-lit glowing SVG inlay (Rune / glyphs.tsx) and carved into stone on the maze walls
// (render/runeCarve.ts), both off the shared path data in geometry.ts. `Rune` is the
// convenience component; the rest are the building blocks.

export { Rune } from './Rune'
export type { RuneProps } from './Rune'

// JSX dressing + glow palettes (the inlay material) live in glyphs.tsx
export {
  GLOW, DEFAULT_GLOW, glowFilter, glyph, chevron, SCRIPT_LABEL, RUNE_LABELS,
} from './glyphs'
export type { GlowPalette } from './glyphs'

// renderer-agnostic geometry (shared with the canvas carver) lives in geometry.ts
export { RUNES_PER_SCRIPT, GLYPH_GEOMETRY, SCRIPT_STROKE, chevronPath } from './geometry'
export type { RuneScript, RuneIndex, Direction, GlyphGeometry } from './geometry'
