// Rune.tsx — render a single rune as self-lit glowing inlay, optionally carrying the
// keystone direction chevron. This is the one place hue is applied; everything in
// glyphs.tsx is authored in `currentColor`.

import type { CSSProperties, ReactElement } from 'react'
import { DEFAULT_GLOW, chevron, glyph, glowFilter } from './glyphs'
import type { GlowPalette } from './glyphs'
import type { Direction, RuneIndex, RuneScript } from './geometry'

export interface RuneProps {
  /** Which alphabet the rune belongs to. */
  script: RuneScript
  /** Which of the script's five runes (0–4). */
  index: RuneIndex
  /** If set, the rune carries the keystone chevron pointing this way. */
  dir?: Direction
  /** Rendered square size in px. */
  size?: number
  /** Glow colour pair; defaults to the locked amber. */
  palette?: GlowPalette
}

export function Rune({ script, index, dir, size = 64, palette = DEFAULT_GLOW }: RuneProps): ReactElement {
  const style: CSSProperties = {
    color: palette.core,
    filter: glowFilter(palette),
    display: 'block',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      {glyph(script, index)}
      {dir && chevron(dir)}
    </svg>
  )
}
