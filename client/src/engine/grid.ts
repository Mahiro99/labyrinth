// grid.ts — tile-grid walkability check.

import type { Maze } from '../types'

export function canStand(maze: Maze, x: number, y: number): boolean {
  const { tiles, GW, GH } = maze;
  if (x < 0 || y < 0 || x >= GW || y >= GH) return false;
  if (tiles[y * GW + x] !== 0) return false;
  return true;
}
