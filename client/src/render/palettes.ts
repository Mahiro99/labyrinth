// palettes.ts — ground-tone palettes + light warmth presets, plus the palette lookup.
// Shared colour state for the renderer. (Local hexToRgb/mix/rgba live in '../lib/color' now.)

import type { Palette } from '../types'

// ---------- palettes (ground tone variations) ----------
export const PALETTES: Record<string, Palette> = {
  'Cool void':   { fog: '#06080c', floor: '#1a2330', wall: '#0d141e', wallEdge: '#243244', dot: '#3a4a60' },
  'Warm hearth': { fog: '#0a0807', floor: '#2a2017', wall: '#1a130d', wallEdge: '#3a2c1d', dot: '#5a4632' },
  'Neutral ink': { fog: '#070707', floor: '#212123', wall: '#101011', wallEdge: '#2e2e31', dot: '#46464a' },
  'Pac noir':    { fog: '#04040a', floor: '#10162e', wall: '#0a0f24', wallEdge: '#1c2b6b', dot: '#2a3a7a' },
};
export function getPalette(name: string): Palette { return PALETTES[name] || PALETTES['Cool void']; }

export const WARMTH: Record<string, string> = {
  Amber: '#ffb24d', Cream: '#ffe6b8', Ember: '#ff7a3c', 'Cool white': '#cfe6ff', Teal: '#7af0d8',
};
