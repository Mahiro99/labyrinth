// theme.ts — the single source of truth for the GAME UI skin: fonts, HUD text,
// the minimap, accent colours, and the floating Tweaks
// panel's palette. Procedural/world colours (fog, walls, foliage, sky) still live
// in palettes.ts and the renderer — those are *content*. This file is only the
// chrome you read over the top of the game, so "change how the interface looks"
// is one edit here.
//
// Convention: values are ready-to-use CSS strings. The `panel` block exposes a
// couple of bare "r,g,b" tuples (ink/paper) because the Tweaks CSS composes them
// with many different alphas — see styles.ts.

export const theme = {
  font: {
    mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    ui: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  },

  // In-game HUD text sits over the live 3D view, which can be bright (daylight)
  // or dark (night). Every readout pairs a high-contrast colour with a shadow so
  // it stays legible on either. `scrim` is the gradient behind the top bar.
  hud: {
    // Light text everywhere — paired with `shadow` (legible at night) + `scrim`
    // (dark backing on a bright daytime sky). Brighter than before so the readouts
    // don't wash out against the pale sky in the screenshot.
    title: '#ffffff',
    primary: '#f3f7fd',
    secondary: '#dfe7f3',  // was #cdd8e8 — lifted for contrast on bright sky
    dim: '#b8c4d6',        // was #a6b3c6
    faint: '#94a2b7',
    // Layered shadow: a tight near-black core kills bright-day glare around the
    // glyphs, a wider soft halo keeps it readable when the night view goes dark.
    shadow: '0 1px 2px rgba(0,0,0,0.95), 0 1px 10px rgba(0,0,0,0.7), 0 0 22px rgba(0,0,0,0.45)',
    // Stronger, slightly taller top scrim so the bar always has a dark backing —
    // critical on the bright daytime view where light text alone disappears.
    scrim: 'linear-gradient(180deg, rgba(6,9,14,0.82) 0%, rgba(6,9,14,0.45) 52%, rgba(6,9,14,0) 100%)',
    // the bottom movement-hint pill: a glassy dark capsule that reads on day or night
    pillBg: 'rgba(8,11,16,0.72)',
    pillBorder: 'rgba(255,255,255,0.18)',
    pillText: '#e7edf6',
    pillAccent: '#ffd9a3',  // the live FACING value — warm, so it pops from the white controls
  },

  accent: {
    // success / exit-reached
    success: '#b6f7e6',
    successBorder: 'rgba(122,240,216,0.62)',
    successBg: 'rgba(122,240,216,0.16)',
  },

  // default player marker (matches the first chip in the marker picker)
  marker: '#ff7a59',

  minimap: {
    bg: '#05070a',
    label: '#cdd8e8',  // lifted for legibility over a bright daytime sky
    walked: 'rgba(160,190,228,0.62)',
    wall: 'rgba(122,142,172,0.2)',
    border: 'rgba(255,255,255,0.12)',
    labelShadow: '0 1px 2px rgba(0,0,0,0.85)',
  },

  // The floating Tweaks panel (a light "paper glass" surface). ink/paper are bare
  // "r,g,b" tuples because the panel CSS layers them at many alphas.
  panel: {
    ink: '41,38,27',
    paper: '250,249,247',
    accentOn: '#34c759',
    anchor: 'top', // where the FAB + panel dock vertically ('top' | 'bottom')
  },
} as const

export type Theme = typeof theme
