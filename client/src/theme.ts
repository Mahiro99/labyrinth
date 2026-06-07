// theme.ts — the single source of truth for the GAME UI skin: fonts, HUD text,
// the minimap, the on-canvas compass, accent colours, and the floating Tweaks
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
    title: '#ffffff',
    primary: '#eef3fb',
    secondary: '#cdd8e8',
    dim: '#a6b3c6',
    faint: '#8a98ad',
    shadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.6)',
    scrim: 'linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.32) 46%, rgba(0,0,0,0))',
    // for the bottom movement hint pill
    pillBg: 'rgba(10,12,16,0.62)',
    pillBorder: 'rgba(255,255,255,0.16)',
    pillText: '#d6deea',
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
    label: '#b3c0d2',
    walked: 'rgba(160,190,228,0.62)',
    wall: 'rgba(122,142,172,0.2)',
    border: 'rgba(255,255,255,0.12)',
    labelShadow: '0 1px 2px rgba(0,0,0,0.85)',
  },

  // on-canvas facing readout (drawn by render3d.drawCompass)
  compass: {
    day: 'rgba(20,24,20,0.82)',
    night: 'rgba(210,226,244,0.8)',
    dayHalo: 'rgba(245,248,245,0.7)',
    nightHalo: 'rgba(0,0,0,0.55)',
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
