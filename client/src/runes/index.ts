// runes/ — the extracted Labyrinth rune alphabet (not yet wired into the renderer).
// Two coherent 5-rune scripts as self-lit glowing inlay, plus the keystone direction
// chevron. `Rune` is the convenience component; the rest are the building blocks.

export { Rune } from './Rune'
export type { RuneProps } from './Rune'

export {
  GLOW, DEFAULT_GLOW, glowFilter, glyph, chevron,
  RUNES_PER_SCRIPT, SCRIPT_LABEL, RUNE_LABELS,
} from './glyphs'
export type { RuneScript, RuneIndex, Direction, GlowPalette } from './glyphs'
