// towerWindows.ts — generative red window-lights scattered up the near towers.
// Built once from a seed (same pattern as the ivy / fireflies) so the lit windows
// are stable across renders. Coordinates are in the towers' SVG space (viewBox
// "0 0 100 50"), so they sit in the silhouette and scale with it.
//
// Each band is a solid stretch of the near-tower silhouette in Corridor.tsx's
// first SVG: x-range of the column and the y of its crown. Windows are placed
// inside a band, below its crown, in loose vertical rows so they read as floors.
import { makeRng } from '../lib/rng';

type Band = { x0: number; x1: number; top: number };

// Matches the near-layer polygons' solid columns (the dark menacing silhouettes).
const BANDS: Band[] = [
  { x0: 34.4, x1: 37.6, top: 6 },
  { x0: 40.0, x1: 45.0, top: 4 },
  { x0: 47.4, x1: 48.9, top: 3 },
  { x0: 50.4, x1: 55.2, top: 4 },
  { x0: 57.3, x1: 59.3, top: 6 },
  { x0: 61.3, x1: 63.6, top: 8 },
  { x0: 64.8, x1: 66.1, top: 15 },
];

// dur/delay are 0 for a steady window; >0 marks one that slowly flickers (a few do,
// like the lurker eyes) — the renderer drives those with the lab-window-flicker anim.
export type Window = { x: number; y: number; w: number; h: number; o: number; dur: number; delay: number };

export function buildTowerWindows(): Window[] {
  const rnd = makeRng(70260607);
  const wins: Window[] = [];
  for (const b of BANDS) {
    const w = 0.32;                       // window width in viewBox units (tiny)
    const h = 0.5;                        // a touch taller than wide, like a slit
    const cols = Math.max(1, Math.round((b.x1 - b.x0) / 0.9)); // ~1 window per 0.9 wide
    const colGap = (b.x1 - b.x0) / (cols + 1);
    // rows run from just under the crown down toward the horizon (y≈48).
    for (let row = b.top + 2; row < 48; row += 2.2) {
      for (let c = 1; c <= cols; c++) {
        if (rnd() > 0.42) continue;       // most windows are dark — only some lit
        const x = b.x0 + colGap * c + (rnd() - 0.5) * 0.3;
        const y = row + (rnd() - 0.5) * 0.6;
        // dimmer toward the top (far/high) and a little flicker of intensity
        const o = 0.35 + rnd() * 0.5;
        // ~1 in 5 flickers, on its own slow period & phase so they never sync.
        const flickers = rnd() < 0.2;
        const dur = flickers ? 3.5 + rnd() * 5 : 0;   // 3.5–8.5s
        const delay = flickers ? -rnd() * 8 : 0;       // negative → mid-cycle at load
        wins.push({ x, y, w, h, o, dur, delay });
      }
    }
  }
  return wins;
}

export const TOWER_WINDOWS = buildTowerWindows();
