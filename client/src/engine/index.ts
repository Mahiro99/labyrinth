// engine — Labyrinth core: deterministic maze gen, movement, fog/torchlight.
// Pure helpers, no React. Barrel re-exporting the public API.

export { makeMaze, farthest } from './maze'
export { computeLight } from './light'
export { canStand } from './grid'
export { computeRuneField } from './runes'
