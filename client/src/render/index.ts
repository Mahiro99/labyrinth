// render/ — public API barrel for the renderer.
// The first-person raycaster (render3d), the personal minimap, and the shared
// palette/warmth tables. Particles are an internal detail of render3d only.

export { drawFirstPerson, onLightning } from './render3d'
export { drawMinimap } from './minimap'
export { PALETTES, WARMTH, getPalette } from './palettes'
