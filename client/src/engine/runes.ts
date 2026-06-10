// runes.ts — which walls speak. Finds every T-junction in the tile maze and
// assigns its blind wall a carved tablet: three rune groups (left / right /
// back, relative to a reader facing the tablet), each signed with the keystone
// chevron for its branch. Pure data, no canvas, no React — the renderer
// (render/runeCarve.ts + render3d) decides how a tablet meets the stone.
//
// Placement is deterministic from the maze alone (salted by the exit), so every
// player carves the same walls the same day. The rune CONTENT here is visual
// dressing only — when the daily rule engine lands (maze-builder assigns voices
// and scores branches, maze-rules.md #10–12), it replaces pickGroup; the tablet
// placement, layout, and rendering stay as-is.
//
// Why the blind wall: a T-junction (3 ways open) always has exactly one closed
// face, and it faces INTO the junction — the one surface a player can always
// square up to and read. Corridors and dead-ends carry nothing (rule #5);
// + crossroads have no blind wall and stay bare for now.

import type { Maze, RuneField, RuneTablet, TabletGroup } from '../types'

// deterministic hash → 0..1, same family as the renderer's _h2
function h2(a: number, b: number): number {
  let t = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0
  t = Math.imul(t ^ (t >>> 13), 1274126177)
  t ^= t >>> 16
  return ((t >>> 0) % 100003) / 100003
}

// grid directions in face order 0=N 1=E 2=S 3=W (y grows south, like the tiles)
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

// 1–3 distinct runes for one branch, weighted toward fewer — single-rune reads
// are the footholds (maze-rules.md #23). Capped at 3 so a tablet column never
// crowds; the full 1–5 range arrives with the real rule engine.
function pickGroup(cellIdx: number, branch: number, salt: number, dir: TabletGroup['dir']): TabletGroup {
  const base = cellIdx * 4 + branch
  const r = h2(base, salt)
  const n = r < 0.45 ? 1 : r < 0.8 ? 2 : 3
  const runes: number[] = []
  for (let probe = 0; runes.length < n && probe < 40; probe++) {
    const cand = Math.floor(h2(base * 5 + probe, salt ^ 0x9e37) * 5) % 5
    if (!runes.includes(cand)) runes.push(cand)
  }
  for (let f = 0; runes.length < n; f++) if (!runes.includes(f)) runes.push(f) // hash-collision backstop
  return { dir, runes }
}

export function computeRuneField(maze: Maze): RuneField {
  const { tiles, GW, GH } = maze
  // day salt: keyed off the exit so a different maze ⇒ different script + runes
  const salt = ((maze.exit.y * GW + maze.exit.x) * 7919 + GW) | 0
  const script = h2(salt, 11) < 0.5 ? 'geometric' : 'alchemical'
  const tablets = new Map<number, RuneTablet>()

  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      if (tiles[y * GW + x] !== 0) continue
      let openMask = 0, openCount = 0
      for (let d = 0; d < 4; d++) {
        if (tiles[(y + DY[d]) * GW + (x + DX[d])] === 0) { openMask |= 1 << d; openCount++ }
      }
      if (openCount !== 3) continue // T-junctions only: exactly one blind wall

      let closed = 0
      while (openMask & (1 << closed)) closed++
      const wx = x + DX[closed], wy = y + DY[closed]
      const wallIdx = wy * GW + wx
      const face = (closed + 2) % 4 // the wall's face that looks back at the junction

      // branches relative to a reader facing the blind wall (facing `closed`)
      const cellIdx = y * GW + x
      const groups: TabletGroup[] = [
        pickGroup(cellIdx, (closed + 3) % 4, salt, 'left'),
        pickGroup(cellIdx, (closed + 1) % 4, salt, 'right'),
        pickGroup(cellIdx, (closed + 2) % 4, salt, 'back'),
      ]
      tablets.set(wallIdx * 4 + face, {
        wallIdx, face, jx: x, jy: y,
        seed: (salt ^ (wallIdx * 131 + face * 17)) | 0,
        groups,
      })
    }
  }
  return { script, tablets }
}
