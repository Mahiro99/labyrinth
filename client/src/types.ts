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

/** One rune group on a tablet: which branch it labels — relative to a viewer
 *  facing the tablet — and the runes (indices into the day's script). */
export interface TabletGroup {
  dir: 'left' | 'right' | 'back'
  runes: number[]
}

/** A carved inscription on a T-junction's blind wall (see engine/runes.ts).
 *  `face`: which side of the wall tile carries it — 0=N 1=E 2=S 3=W. */
export interface RuneTablet {
  wallIdx: number // tile index of the wall tile that carries the carving
  face: number
  jx: number // the junction tile it speaks for
  jy: number
  seed: number // per-tablet jitter seed (chisel wobble, cracks, chips)
  groups: TabletGroup[]
}

/** The day's rune carving layer: one script + every tablet, keyed wallIdx*4+face. */
export interface RuneField {
  script: 'geometric' | 'alchemical'
  tablets: Map<number, RuneTablet>
}

/** Mutable per-run game state, owned by a ref and mutated by the rAF loop. */
export interface GameState {
  maze: Maze
  runeField: RuneField
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
  starDensity: number
  landmark: boolean
  spireCount: number
  spireHeight: number
  clouds: boolean
  cloudAmount: number
  cloudSpeed: number
  cloudShade: number
  cloudColor: string
  cloudDepth: number    // atmospheric perspective 0..1 — far clouds smaller, higher, hazier
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
  runes: boolean        // carved rune tablets on T-junction blind walls
  runeGlow: number      // ember inlay intensity inside the cuts (0 = bare stone … 1 = bright)
  markerColor: string
  torchRadius: number
  falloff: number
  tweenSpeed: number
  showMinimap: boolean
  renderScale: number   // internal render resolution (0.5–1). <1 rasterizes the first-person view at fewer pixels then upscales — fewer pixels filled = faster, slightly softer.
  ao: boolean
  aoStrength: number
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
  soundLeaves: boolean      // ambient dry-leaves rustle bed (swells in and out on its own)
  leavesVolume: number      // leaves bed loudness ceiling (0..1)
  leavesAmt: number         // swell depth — 0 = steady rustle, 1 = fades between gusts (0..1)
  soundBreathing: boolean
  breathVolume: number      // base loudness of the breath loop (0..1) — the floor it sits at
  breathAmt: number         // how much exertion (step cadence) swells the breath above the floor (0..1)
  soundRain: boolean        // rain bed (only audible in Storm — follows weather)
  rainVolume: number
  soundWind: boolean        // wind bed (follows the visual Wind toggle)
  windVolume: number
  soundFactory: boolean     // distant factory machines, played sequentially with random gaps
  factoryVolume: number
  factoryDistance: number   // how far off the machines sound (0 near … 1 far) — low-pass + reverb
  soundGrowl: boolean       // monster growl when the player stands still too long
  growlVolume: number       // growl loudness (0..1)
  growlIdleSec: number      // seconds of no tile movement before it growls (1–15)
  growlDuck: number         // how much the growl ducks every other sound while it plays (0..1)
  soundThunder: boolean
  thunderVolume: number
  thunderGap: number        // seconds between strikes (spacing) — drives flash + boom
  exitVolume: number        // the exit-reached victory sting
  soundMusic: boolean       // background score bed during the game (quiet, like landing)
  musicVolume: number       // in-game music ceiling (lower than the landing's)
}
