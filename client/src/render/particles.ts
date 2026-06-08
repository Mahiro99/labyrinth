// particles.ts — the lazily-built, seeded particle/detail pools used by the raycaster.
// Each is a module-level singleton built once (browser PRNG, Math.random) and reused
// every frame. These were formerly window.__* caches in render3d; here each is exposed
// via an exported getter that builds-on-first-call and returns the same array thereafter.
// Contents, sizes, and seeding are preserved exactly.

// ---- module-level singleton caches (were window.__*) ----
let _grainTileCache: HTMLCanvasElement | null = null
let _sporesCache: { ux: number; uy: number; uz: number; spd: number; sz: number; ph: number }[] | null = null
let _starsCache: { az: number; el: number; mag: number; sz: number; ph: number }[] | null = null
let _pebblesCache: { ux: number; uy: number; gx: number; gy: number; sz: number; rot: number; tone: number[] }[] | null = null
let _rainCache: { x: number; y: number; spd: number; len: number }[] | null = null
let _splashesCache: { x: number; y: number; ph: number; rate: number }[] | null = null
let _groundLifeCache: { ux: number; uy: number; kind: string; sz: number; rot: number; blades: number; hue: number }[] | null = null
let _bugsCache: { ux: number; uy: number; spd: number; sz: number; ph: number; ph2: number; kind: string }[] | null = null
let _driftLeavesCache: { ux: number; uy: number; uz: number; fall: number; sway: number; sz: number; spin: number }[] | null = null
let _cloudsCache: { az: number; el: number; dist: number; sz: number; spd: number; puff: number }[] | null = null
let _spiresCache: { az: number; dist: number; shape: string; w: number; h: number; lean: number; seed: number }[] | null = null

// lazily-built 128px monochrome noise tile for film grain
export function grainTile(): HTMLCanvasElement {
  if (_grainTileCache) return _grainTileCache;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!; const img = x.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) { const v = (Math.random() * 255) | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); _grainTileCache = c; return c;
}
// seeded haze volume — fixed points in maze space (unit cube, scaled by a world
// tiling period at draw time). World-anchored, not screen. Pool sized to the
// haze peak in quantity.ts.
export function spores() {
  if (_sporesCache) return _sporesCache;
  const a = [];
  for (let i = 0; i < 400; i++) a.push({ ux: Math.random(), uy: Math.random(), uz: Math.random(), spd: 0.6 + Math.random() * 1.2, sz: 0.7 + Math.random() * 1.8, ph: Math.random() * 7 });
  _sporesCache = a; return a;
}
// seeded starfield — fixed bearings/elevations on a sky dome (night only)
export function stars() {
  if (_starsCache) return _starsCache;
  const a = [];
  // fully random scatter across the whole dome — jittered magnitude & size so no
  // grid/banding reads. Larger pool so a higher density slider has headroom.
  for (let i = 0; i < 760; i++) a.push({ az: Math.random() * 6.2832, el: Math.pow(Math.random(), 0.85), mag: 0.25 + Math.random() * 0.75, sz: 0.5 + Math.random() * Math.random() * 1.8, ph: Math.random() * 7 });
  _starsCache = a; return a;
}
// seeded pebble scatter — fixed points on the floor plane, tiled around the player
export function pebbles() {
  if (_pebblesCache) return _pebblesCache;
  const pal = [[120, 118, 104], [98, 96, 86], [142, 138, 122], [110, 104, 90], [86, 88, 82]];
  const a = []; const G = 13;
  for (let i = 0; i < 760; i++) a.push({ ux: Math.random(), uy: Math.random(), gx: ((i % G) + 0.5) / G, gy: (((i / G) | 0) % G + 0.5) / G, sz: 0.5 + Math.random() * 1.4, rot: Math.random() * 3.14, tone: pal[(Math.random() * pal.length) | 0] });
  _pebblesCache = a; return a;
}

// seeded screen-space rain — stateless (position scrolls with time). Layered for depth.
export function rain() {
  if (_rainCache) return _rainCache;
  const a = [];
  for (let i = 0; i < 1400; i++) a.push({ x: Math.random(), y: Math.random(), spd: 0.8 + Math.random() * 0.7, len: 0.7 + Math.random() * 0.6 });
  _rainCache = a; return a;
}
// seeded ground splashes — fixed screen anchors near the floor that pulse on a cycle
export function splashes() {
  if (_splashesCache) return _splashesCache;
  const a = [];
  for (let i = 0; i < 40; i++) a.push({ x: Math.random(), y: Math.random(), ph: Math.random(), rate: 0.6 + Math.random() * 0.8 });
  _splashesCache = a; return a;
}

// seeded ground-life scatter — a MIX of weed silhouettes + fallen leaves on the
// floor plane, so it doesn't read as one repeated tuft. The weighted `kinds` table
// keeps grass blades common while sprinkling in broadleaf/clover/fern/flower; each
// kind is drawn differently in drawGroundLife().
export function groundLife() {
  if (_groundLifeCache) return _groundLifeCache;
  const a = [];
  const kinds = ['grass', 'grass', 'broadleaf', 'clover', 'fern', 'flower', 'leaf', 'leaf'];
  for (let i = 0; i < 600; i++) {
    const kind = kinds[(Math.random() * kinds.length) | 0];
    a.push({ ux: Math.random(), uy: Math.random(), kind, sz: 0.6 + Math.random() * 1.1, rot: Math.random() * 3.14, blades: 3 + (Math.random() * 3 | 0), hue: Math.random() });
  }
  _groundLifeCache = a; return a;
}
// seeded ground bugs — world-anchored anchors that WANDER. The pool only stores an
// anchor + per-bug phases/speed; the actual crawling path is computed each frame
// from `now` in drawBugs (two summed sinusoids per axis → an organic meander).
export function bugs() {
  if (_bugsCache) return _bugsCache;
  const a = [];
  for (let i = 0; i < 60; i++) {
    a.push({ ux: Math.random(), uy: Math.random(), spd: 0.6 + Math.random() * 0.9, sz: 0.7 + Math.random() * 0.7, ph: Math.random() * 7, ph2: Math.random() * 7, kind: Math.random() < 0.6 ? 'ant' : 'beetle' });
  }
  _bugsCache = a; return a;
}
// seeded drifting leaves — world-anchored motes that fall & blow with the wind
export function driftLeaves() {
  if (_driftLeavesCache) return _driftLeavesCache;
  const a = [];
  for (let i = 0; i < 400; i++) a.push({ ux: Math.random(), uy: Math.random(), uz: Math.random(), fall: 0.5 + Math.random() * 0.8, sway: Math.random() * 7, sz: 0.7 + Math.random() * 1.1, spin: Math.random() * 7 });
  _driftLeavesCache = a; return a;
}
// seeded clouds — soft blobs drifting across the open-top sky strip. `dist` (0 near
// → 1 far) drives atmospheric perspective at draw time: far clouds sit higher, smaller
// and hazier. Biased toward far so the sky reads deep, not a wall of near blobs.
export function clouds() {
  if (_cloudsCache) return _cloudsCache;
  const a = [];
  for (let i = 0; i < 84; i++) a.push({ az: Math.random() * 6.2832, el: Math.random(), dist: Math.pow(Math.random(), 0.7), sz: 0.7 + Math.random() * 1.1, spd: 0.2 + Math.random() * 0.5, puff: Math.random() * 7 });
  _cloudsCache = a; return a;
}
// seeded distant spires — each at its own bearing + distance (depth), with a shape.
// Far ones are smaller, hazier, cooler — parallax handled at draw via depth scale.
export function spires() {
  if (_spiresCache) return _spiresCache;
  const shapes = ['stepped', 'tapered', 'crown', 'finned', 'twin', 'cooling', 'mast', 'capsule'];
  const a = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    a.push({
      az: (i / N) * 6.2832 + Math.random() * 0.16,    // ring the player in all directions
      dist: 0.45 + Math.random() * 0.55,              // mostly far → a distant skyline
      shape: shapes[(Math.random() * shapes.length) | 0],
      w: 0.7 + Math.random() * 0.7,
      h: 0.8 + Math.random() * 0.7,
      lean: (Math.random() - 0.5) * 0.12,
      seed: Math.random() * 1000,
    });
  }
  _spiresCache = a; return a;
}
