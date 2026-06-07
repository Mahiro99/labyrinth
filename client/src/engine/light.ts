// light.ts — torchlight: corridor-bending BFS fog with dead-end-cap suppression.

import type { Maze } from '../types'

// Torchlight: BFS distance from player THROUGH corridors (light bends round corners,
// never through walls). Returns Float32Array of distances; Infinity = not lit this frame.
export function computeLight(maze: Maze, px: number, py: number, radius: number): Float32Array {
  const { tiles, GW, GH } = maze;
  const idx = (x: number, y: number) => y * GW + x;
  const dist = new Float32Array(GW * GH).fill(Infinity);
  const q = [px, py];
  dist[idx(px, py)] = 0;
  let head = 0;
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const R = Math.ceil(radius) + 1;
  // a floor tile with exactly one open neighbour is a TERMINUS (dead-end cap)
  const openNbrs = (x: number, y: number) => {
    let n = 0;
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < GW && ny < GH && tiles[idx(nx, ny)] === 0) n++;
    }
    return n;
  };
  while (head < q.length) {
    const x = q[head++], y = q[head++];
    const d = dist[idx(x, y)];
    if (d >= R) continue;
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const i = idx(nx, ny);
      if (dist[i] !== Infinity) continue;
      dist[i] = d + 1;
      // walls one step past a floor are still SEEN (you see the wall faces of the corridor)
      // but light does not propagate through them.
      if (tiles[i] === 0) q.push(nx, ny);
    }
  }
  // Guarantee #25 — the light never gives away an answer. A corridor may be
  // seen to CONTINUE, but never seen to END: keep dead-end caps dark unless
  // you're right on top of them (d<=1). You commit on the runes, then find out.
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = idx(x, y);
    if (dist[i] === Infinity || dist[i] <= 1) continue;
    if (tiles[i] === 0 && openNbrs(x, y) === 1) dist[i] = Infinity;
  }
  return dist;
}
