// mazerunner.ts — the Maze Runner world for Labyrinth: board-formed concrete walls
// (baked procedurally, no asset deps) with a Day/Night light model. Vines are NOT
// baked here — they're a live, fully-tweakable layer in render3d so density/length/
// spacing/randomness and wall-to-wall swags can be dialed in real time.
// Exported as getWorld(name, mrTime).

import type { World } from '../types'
import { css, clamp255 } from '../lib/color'
import { makeRng } from '../lib/rng'

const rngFor = (s: number): (() => number) => makeRng(s);

const TW = 256, TH = 384;
function tile(): HTMLCanvasElement { const c = document.createElement('canvas'); c.width = TW; c.height = TH; return c; }
function grain(x: CanvasRenderingContext2D, rng: () => number, amt: number): void {
  const img = x.getImageData(0, 0, TW, TH), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rng() * 2 - 1) * amt * 255; d[i] = clamp255(d[i] + n); d[i + 1] = clamp255(d[i + 1] + n); d[i + 2] = clamp255(d[i + 2] + n); }
  x.putImageData(img, 0, 0);
}
function vgrad(x: CanvasRenderingContext2D, top: number[], bot: number[]): CanvasGradient { const g = x.createLinearGradient(0, 0, 0, TH); g.addColorStop(0, css(top)); g.addColorStop(1, css(bot)); return g; }

// ---- board-formed concrete ----
function bakeConcrete(seed: number, stain?: number, crack?: number): HTMLCanvasElement {
  if (stain == null) stain = 1; if (crack == null) crack = 1;
  const c = tile(), x = c.getContext('2d') as CanvasRenderingContext2D, rng = rngFor(seed);
  x.fillStyle = vgrad(x, [150, 158, 150], [120, 126, 118]); x.fillRect(0, 0, TW, TH);
  // board-form vertical striations
  for (let i = 0; i < TW; i++) { if (rng() < 0.45) continue; x.fillStyle = `rgba(0,0,0,${0.015 + rng() * 0.05})`; x.fillRect(i, 0, 1, TH); }
  for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(255,255,255,${0.025 + rng() * 0.05})`; x.fillRect(rng() * TW, 0, 1 + rng() * 1.5, TH); }
  // horizontal lift seams (form-board panel joints)
  for (let s = 1; s < 3; s++) {
    const yy = TH * s / 3 + (rng() - 0.5) * 22;
    x.fillStyle = 'rgba(0,0,0,0.30)'; x.fillRect(0, yy, TW, 2.5);
    x.fillStyle = 'rgba(255,255,255,0.07)'; x.fillRect(0, yy - 2.5, TW, 1.5);
  }
  // blotchy water staining (count scales with stain slider)
  for (let i = 0; i < Math.round(16 * stain); i++) {
    const cx = rng() * TW, cy = rng() * TH, r = 24 + rng() * 80, dark = rng() < 0.62;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${dark ? '34,40,34' : '170,172,160'},${0.05 + rng() * 0.09})`);
    g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  // rusted weep streaks under seams (count scales with stain slider)
  for (let i = 0; i < Math.round(5 * stain); i++) { const sx = rng() * TW; x.fillStyle = `rgba(120,80,46,${0.05 + rng() * 0.06})`; x.fillRect(sx, TH * 0.32, 2 + rng() * 2, TH * 0.5); }

  // ---- weathering features (each gated by rng so variants differ) ----
  // (moss is now a LIVE, controllable overlay in render3d, not baked here)
  // hairline cracks — branching polylines (count scales with crack slider)
  const nCracks = Math.round((2 + (rng() * 4 | 0)) * crack);
  for (let i = 0; i < nCracks; i++) {
    let cx = rng() * TW, cy = rng() * TH * 0.7, a = Math.PI * (0.25 + rng() * 0.5);
    x.strokeStyle = `rgba(0,0,0,${0.1 + rng() * 0.18})`; x.lineWidth = 0.5 + rng() * 0.8;
    x.beginPath(); x.moveTo(cx, cy);
    const segs = 7 + (rng() * 10 | 0);
    for (let s = 0; s < segs; s++) {
      a += (rng() - 0.5) * 1.0; cx += Math.cos(a) * (5 + rng() * 13); cy += Math.abs(Math.sin(a)) * (5 + rng() * 13); x.lineTo(cx, cy);
      if (rng() < 0.18) { x.stroke(); x.beginPath(); x.moveTo(cx, cy); } // branch break
    }
    x.stroke();
  }
  // discoloration patches for tonal personality
  for (let i = 0; i < 6; i++) {
    const dx0 = rng() * TW, dy0 = rng() * TH, dr = 30 + rng() * 70, dark = rng() < 0.5;
    const g = x.createRadialGradient(dx0, dy0, 0, dx0, dy0, dr);
    g.addColorStop(0, `rgba(${dark ? '60,66,58' : '186,188,178'},${0.04 + rng() * 0.06})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(dx0 - dr, dy0 - dr, 2 * dr, 2 * dr);
  }
  // patched panel — a riveted metal repair plate (kept; the liked kind)
  if (rng() < 0.5) {
    const pw = TW * (0.26 + rng() * 0.3), ph = TH * (0.15 + rng() * 0.18), px = rng() * (TW - pw), py = rng() * (TH - ph);
    const t = rng() < 0.5 ? 14 : -14;
    x.fillStyle = `rgba(${120 + t},${126 + t},${122 + t},0.55)`; x.fillRect(px, py, pw, ph);
    x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 1.5; x.strokeRect(px, py, pw, ph);
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1; x.strokeRect(px + 1.5, py + 1.5, pw - 3, ph - 3);
    const rv = (rx: number, ry: number) => { x.fillStyle = 'rgba(38,40,38,0.6)'; x.beginPath(); x.arc(rx, ry, 1.7, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.arc(rx - 0.5, ry - 0.5, 0.7, 0, 7); x.fill(); };
    rv(px + 5, py + 5); rv(px + pw - 5, py + 5); rv(px + 5, py + ph - 5); rv(px + pw - 5, py + ph - 5);
  }

  grain(x, rng, 0.05);
  return c;
}

let _tiles: HTMLCanvasElement[] | null = null, _tileKey = '';
function tiles(stain: number, crack: number): HTMLCanvasElement[] {
  const key = (Math.round(stain * 4) / 4) + '_' + (Math.round(crack * 4) / 4);
  if (_tiles && key === _tileKey) return _tiles;
  _tileKey = key;
  _tiles = [11, 29, 53, 91, 137, 211, 307].map((s) => bakeConcrete(s, stain, crack));
  return _tiles;
}

function build(mrTime: string, stain?: number, crack?: number): World {
  const set = tiles(stain == null ? 1 : stain, crack == null ? 1 : crack);
  const day = mrTime !== 'Night';
  const w: World = day ? {
    id: 'mazerunner', lightModel: 'daylight', tiles: set,
    fog: [156, 164, 156], ceil: [[170, 178, 172], [201, 205, 198]], floor: [[150, 150, 138], [108, 100, 84]],
    glow: [0, 0, 0], glowAlpha: 0, haze: [206, 210, 192], hazeDrift: 0.7,
    ambient: 0.74, viewDist: 17, sideShade: 0.86, vignAlpha: 0.26, water: false,
  } as World : {
    id: 'mazerunner', lightModel: 'torch', tiles: set,
    fog: [12, 16, 19], ceil: [[10, 13, 16], [20, 25, 30]], floor: [[26, 28, 27], [9, 10, 11]],
    glow: [128, 150, 182], glowAlpha: 0.12, haze: [150, 172, 205], hazeDrift: 1,
    viewDist: 17, sideShade: 0.82, vignAlpha: 0.6, water: false,
  } as World;
  w.fogCss = css(w.fog);
  w.ceilCss = [css(w.ceil[0]), css(w.ceil[1])];
  w.floorCss = [css(w.floor[0]), css(w.floor[1])];
  const t = set, n = t.length;
  w.pick = (mx, my, side) => t[(((mx * 73856093) ^ (my * 19349663) ^ (side * 83492791)) >>> 0) % n];
  return w;
}

let _last: World | null = null, _key = '';
export function getWorld(_name: string, mrTime: string, stain?: number, crack?: number): World {
  const k = (mrTime || 'Day') + '|' + (Math.round((stain == null ? 1 : stain) * 4) / 4) + '|' + (Math.round((crack == null ? 1 : crack) * 4) / 4);
  if (k !== _key) { _last = build(mrTime, stain == null ? 1 : stain, crack == null ? 1 : crack); _key = k; }
  return _last as World;
}
