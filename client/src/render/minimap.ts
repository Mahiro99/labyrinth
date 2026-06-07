// minimap.ts — the personal minimap (only what you've TRACKED — cells you stepped through).

import type { GameState } from '../types'

// ---------- personal minimap (only what you've TRACKED — cells you stepped through) ----------
export function drawMinimap(ctx: CanvasRenderingContext2D, gs: GameState, W: number, H: number, mk: string): void {
  const { maze, tracked } = gs;
  const { GW, GH } = maze;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, W, H);
  const s = Math.min((W - 8) / GW, (H - 8) / GH);
  const ox = (W - GW * s) / 2, oy = (H - GH * s) / 2;
  const idx = (x: number, y: number) => y * GW + x;
  const cell = Math.max(1, s);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = idx(x, y);
      if (tracked[i]) {
        ctx.fillStyle = 'rgba(150,180,220,0.55)'; // a cell you actually walked
        ctx.fillRect(ox + x * s, oy + y * s, cell, cell);
      } else if (maze.tiles[i] !== 0) {
        // a wall, but only if it borders somewhere you've been (a wall you'd have felt)
        const nb = (x > 0 && tracked[idx(x - 1, y)]) || (x < GW - 1 && tracked[idx(x + 1, y)]) ||
                   (y > 0 && tracked[idx(x, y - 1)]) || (y < GH - 1 && tracked[idx(x, y + 1)]);
        if (nb) { ctx.fillStyle = 'rgba(120,140,170,0.16)'; ctx.fillRect(ox + x * s, oy + y * s, cell, cell); }
      }
    }
  }
  // player
  ctx.fillStyle = mk;
  ctx.fillRect(ox + gs.px * s - 0.5, oy + gs.py * s - 0.5, Math.max(2, s + 1), Math.max(2, s + 1));
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}
