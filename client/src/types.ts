// types.ts — shared contract for the Labyrinth port.
// Every ported module imports its types from here (import type { ... }).

export interface Coord {
  x: number
  y: number
}

/** The maze, as returned by makeMaze. tiles: 1 = wall, 0 = floor. */
export interface Maze {
  tiles: Uint8Array
  GW: number // grid width in tiles  (cols * 2 + 1)
  GH: number // grid height in tiles (rows * 2 + 1)
  start: Coord
  exit: Coord
  cols: number // cells
  rows: number // cells
}

/** Mutable per-run game state, owned by a ref and mutated by the rAF loop. */
export interface GameState {
  maze: Maze
  totalFloor: number
  px: number
  py: number
  camx: number
  camy: number
  seen: Uint8Array
  tracked: Uint8Array
  revealTime: Float32Array
  light: Float32Array
  trail: Coord[]
  steps: number
  exitReached: boolean
  faceA: number // current facing angle (radians)
  faceTarget: number // target facing angle
  effR: number // effective light radius
  lastMove: number
  lastR: number
  tileSize: number
  cssW: number
  cssH: number
  bobPhase: number
  bobAmp: number
  bobUnit: number
  swayRoll: number
}

/** A baked world descriptor returned by getWorld. */
export interface World {
  id: string
  lightModel: 'daylight' | 'torch'
  tiles: HTMLCanvasElement[]
  fog: number[]
  ceil: number[][]
  floor: number[][]
  glow: number[]
  glowAlpha: number
  haze: number[]
  hazeDrift: number
  ambient?: number
  viewDist: number
  sideShade: number
  vignAlpha: number
  water: boolean
  fogCss: string
  ceilCss: string[]
  floorCss: string[]
  pick: (mx: number, my: number, side: number) => HTMLCanvasElement
}

/** A ground-tone palette (render.ts). */
export interface Palette {
  fog: string
  floor: string
  wall: string
  wallEdge: string
  dot: string
}

/** The full tweak configuration (mirrors TWEAK_DEFAULTS). */
export interface Tweaks {
  world: string
  mrTime: 'Day' | 'Night'
  weather: 'Clear' | 'Storm'
  rainAmt: number
  stormClouds: number    // Storm cloud cover density (0..1) — own control, replaces cloudAmount in Storm
  lightning: boolean
  grade: boolean
  gradeAmt: number
  bloom: boolean
  bloomAmt: number
  vines: boolean
  vineStyle: string
  vineDensity: number
  vineLength: number
  vineCloseness: number
  vineRandomness: number
  wind: boolean
  windAmt: number
  pebbles: boolean
  pebbleDensity: number
  pebbleSize: number
  pebbleRandom: number
  sky: boolean
  skyBlue: number       // Clear-day sky blueness (0 = pale/hazy, 1 = deep blue)
  sunAz: number
  sunHeight: number
  sunLight: boolean
  lightContrast: number
  starDensity: number
  landmark: boolean
  spireCount: number
  spireHeight: number
  clouds: boolean
  cloudAmount: number
  cloudSpeed: number
  cloudShade: number
  cloudColor: string
  groundLife: boolean
  groundLifeAmt: number
  driftLeaves: boolean
  driftAmt: number
  driftDir: number
  driftSpeed: number
  bugs: boolean
  bugAmt: number
  floorDetail: boolean
  grateAmt: number
  stainAmount: number
  crackAmount: number
  markerColor: string
  torchRadius: number
  falloff: number
  tweenSpeed: number
  showMinimap: boolean
  ao: boolean
  aoStrength: number
  rim: boolean
  rimStrength: number
  flicker: boolean
  flickerAmt: number
  haze: boolean
  hazeAmt: number
  grain: boolean
  grainAmt: number
  headBob: boolean
  bobAmt: number
  sway: boolean
  swayAmt: number
  // --- audio (see audio.md + AudioEngine) ---
  audioMuted: boolean
  audioVolume: number       // master 0..1
  soundFootsteps: boolean
  footstepVolume: number
  soundCharted: boolean     // "new ground" flourish
  chartedVolume: number
  soundBreathing: boolean
  breathAmt: number         // how much exertion (step cadence) swells the breath (0..1)
  soundRain: boolean        // rain bed (only audible in Storm — follows weather)
  rainVolume: number
  soundWind: boolean        // wind bed (follows the visual Wind toggle)
  windVolume: number
  soundFactory: boolean     // the machines/* ambient drone bed
  factoryVolume: number
  soundThunder: boolean
  thunderVolume: number
  thunderGap: number        // seconds between strikes (spacing) — drives flash + boom
  exitVolume: number        // the exit-reached victory sting
  soundMusic: boolean       // background score bed during the game (quiet, like landing)
  musicVolume: number       // in-game music ceiling (lower than the landing's)
}
