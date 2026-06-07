// maze.ts — deterministic maze generation: recursive backtracker + extra openings + BFS farthest exit.

import type { Maze, Coord } from '../types'
import { makeRng } from '../lib/rng'

// Generate a perfect maze on a tile grid via recursive backtracker.
// cols/rows = number of CELLS; tile grid is (cols*2+1) x (rows*2+1).
// Every floor tile is individually walkable (1-wide corridors), so you step tile-by-tile.
export function makeMaze(cols: number, rows: number, seed: number): Maze {
  const rng = makeRng(seed);
  const GW = cols * 2 + 1;
  const GH = rows * 2 + 1;
  const tiles = new Uint8Array(GW * GH); // 1 = wall, 0 = floor
  tiles.fill(1);
  const idx = (x: number, y: number) => y * GW + x;

  const visited = new Uint8Array(cols * rows);
  const cidx = (cx: number, cy: number) => cy * cols + cx;
  const stack: number[][] = [[0, 0]];
  visited[cidx(0, 0)] = 1;
  tiles[idx(1, 1)] = 0;

  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    // gather unvisited neighbours
    const opts: number[][] = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[cidx(nx, ny)]) {
        opts.push([nx, ny, dx, dy]);
      }
    }
    if (!opts.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = opts[(rng() * opts.length) | 0];
    visited[cidx(nx, ny)] = 1;
    // carve passage: cell tile + wall tile between
    const tx = nx * 2 + 1, ty = ny * 2 + 1;
    tiles[idx(tx, ty)] = 0;
    tiles[idx(cx * 2 + 1 + dx, cy * 2 + 1 + dy)] = 0;
    stack.push([nx, ny]);
  }

  // Sprinkle a few extra openings so it's not a pure tree — gives loops & choices.
  const extra = Math.floor(cols * rows * 0.04);
  for (let i = 0; i < extra; i++) {
    const wx = 1 + ((rng() * (GW - 2)) | 0);
    const wy = 1 + ((rng() * (GH - 2)) | 0);
    if (tiles[idx(wx, wy)] === 1) {
      // only knock walls that join two floors (keep border intact)
      const h = tiles[idx(wx - 1, wy)] === 0 && tiles[idx(wx + 1, wy)] === 0;
      const v = tiles[idx(wx, wy - 1)] === 0 && tiles[idx(wx, wy + 1)] === 0;
      if (h || v) tiles[idx(wx, wy)] = 0;
    }
  }

  const start: Coord = { x: 1, y: 1 };
  // exit = farthest floor tile from start (BFS), hidden until reached
  const exit = farthest(tiles, GW, GH, start);
  return { tiles, GW, GH, start, exit, cols, rows };
}

export function farthest(tiles: Uint8Array, GW: number, GH: number, from: Coord): Coord {
  const idx = (x: number, y: number) => y * GW + x;
  const dist = new Int32Array(GW * GH).fill(-1);
  const q = [from.x, from.y];
  dist[idx(from.x, from.y)] = 0;
  let best: Coord = { x: from.x, y: from.y }, bestD = 0;
  let head = 0;
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  while (head < q.length) {
    const x = q[head++], y = q[head++];
    const d = dist[idx(x, y)];
    if (d > bestD) { bestD = d; best = { x, y }; }
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      if (tiles[idx(nx, ny)] !== 0) continue;
      if (dist[idx(nx, ny)] !== -1) continue;
      dist[idx(nx, ny)] = d + 1;
      q.push(nx, ny);
    }
  }
  return best;
}
