// runeCarve.ts — how a rune meets the wall: the carved-into-stone material for
// the alphabet in runes/geometry.ts (the SVG side renders the same shapes as
// self-lit inlay; this side cuts them into the board-formed concrete).
//
// Each T-junction tablet bakes once to an offscreen canvas the exact aspect of a
// wall face (256×384, like mazerunner's concrete tiles) and is overlaid in
// drawWalls as 1px texture strips, so it inherits perspective, fog and the torch
// falloff for free. The carve itself is layered like real chiseled stone:
//   1. a soft wide depression (the dressed recess around the cut)
//   2. the dark cut, shadowed along its TOP inner edge (light comes from the
//      carrier's lamp, i.e. roughly above/centre) and double-struck with a
//      seeded wobble so it reads hand-chiseled, not printed
//   3. a faint amber EMBER inlaid in the groove — the locked glow palette,
//      dimmed to "old light ingrained in the stone", tweakable via runeGlow
//   4. a thin catch-light on the BOTTOM inner edge — the chisel bevel
// plus per-tablet weathering: hairline cracks running off the cuts and a few
// chipped nicks, seeded per tablet so every wall is its own hand.
//
// Layout: an incised frame; three columns of runes — left column = the branch
// to the reader's left, centre = the branch behind them, right = to the right —
// each column signed with the keystone chevron pointing its way (left/down/right).

import type { RuneTablet, TabletGroup } from '../types'
import { GLYPH_GEOMETRY, SCRIPT_STROKE, chevronPath } from '../runes/geometry'
import type { RuneScript } from '../runes/geometry'
import { GLOW } from '../runes/glyphs'
import { hexToRgb, rgba } from '../lib/color'
import { makeRng } from '../lib/rng'

const TW = 256, TH = 384 // one wall face, same dims as the concrete tiles

const EMBER_GLOW = hexToRgb(GLOW.amber.glow)
const EMBER_CORE = hexToRgb(GLOW.amber.core)

// ── the engraver ───────────────────────────────────────────────────────────────
// Strokes one path as a cut. `w` is the stroke width in the CURRENT transform's
// units (glyphs pass their 100-space width and are pre-scaled). `glow` 0..1
// scales the ember; rng drives the hand-cut wobble.
function engrave(x: CanvasRenderingContext2D, p: Path2D, w: number, glow: number, rng: () => number): void {
  x.lineCap = 'round'; x.lineJoin = 'round'
  const pass = (dx: number, dy: number, width: number, style: string, blur = 0, blurCol = '') => {
    x.save(); x.translate(dx, dy)
    if (blur > 0) { x.shadowBlur = blur; x.shadowColor = blurCol }
    x.strokeStyle = style; x.lineWidth = width; x.stroke(p)
    x.restore()
  }
  pass(0, 0, w * 3.2, 'rgba(0,0,0,0.09)')                     // wide soft depression
  pass(0, 0, w * 2.0, 'rgba(0,0,0,0.12)')
  pass(0.3 * w / 6, -1.1 * w / 6, w * 1.05, 'rgba(10,9,7,0.55)') // cut, top edge in shadow
  pass(0, 0, w * 0.95, 'rgba(17,15,12,0.48)')
  // double-strike wobble: the second blow never lands exactly on the first
  pass((rng() - 0.5) * w * 0.22, (rng() - 0.5) * w * 0.22, w * 0.9, 'rgba(14,12,10,0.26)')
  if (glow > 0.01) {
    pass(0, 0, w * 0.55, rgba(EMBER_GLOW, 0.30 * glow), 5, rgba(EMBER_GLOW, 0.55 * glow))
    pass(0, 0, w * 0.26, rgba(EMBER_CORE, 0.40 * glow))
  }
  pass(-0.2 * w / 6, 1.25 * w / 6, w * 0.42, 'rgba(255,243,226,0.20)') // chisel bevel catch-light
}

// Filled marks (glyph dots, the chevron): a recessed fill with the same shadow /
// ember / bevel reading as the strokes.
function engraveFill(x: CanvasRenderingContext2D, p: Path2D, glow: number): void {
  x.save()
  x.translate(0.3, -1.0); x.fillStyle = 'rgba(10,9,7,0.50)'; x.fill(p)
  x.translate(-0.3, 1.0); x.fillStyle = 'rgba(17,15,12,0.45)'; x.fill(p)
  if (glow > 0.01) {
    x.shadowBlur = 5; x.shadowColor = rgba(EMBER_GLOW, 0.5 * glow)
    x.fillStyle = rgba(EMBER_GLOW, 0.28 * glow); x.fill(p)
    x.shadowBlur = 0
  }
  x.translate(-0.2, 2.0); x.strokeStyle = 'rgba(255,243,226,0.16)'; x.lineWidth = 0.8; x.stroke(p)
  x.restore()
}

// one rune, carved at (cx, cy) with a seeded hand-cut jitter
function carveRune(x: CanvasRenderingContext2D, script: RuneScript, index: number, cx: number, cy: number, size: number, glow: number, rng: () => number): void {
  const g = GLYPH_GEOMETRY[script][index]
  const w = SCRIPT_STROKE[script]
  x.save()
  x.translate(cx + (rng() - 0.5) * 3, cy + (rng() - 0.5) * 3)
  x.rotate((rng() - 0.5) * 0.09)
  const s = (size / 100) * (0.94 + rng() * 0.10)
  x.scale(s, s); x.translate(-50, -50)
  engrave(x, new Path2D(g.stroke), w, glow, rng)
  if (g.fill) engraveFill(x, new Path2D(g.fill), glow)
  x.restore()
}

// the column's direction caret, carved standalone (centred, larger than the
// per-rune baseline slot — it signs the whole column)
function carveChevron(x: CanvasRenderingContext2D, dir: 'left' | 'right' | 'down', cx: number, cy: number, size: number, glow: number, rng: () => number): void {
  x.save()
  x.translate(cx + (rng() - 0.5) * 2, cy + (rng() - 0.5) * 2)
  x.rotate((rng() - 0.5) * 0.07)
  const s = size / 100
  x.scale(s, s); x.translate(-50, -50)
  engraveFill(x, new Path2D(chevronPath(dir, 50, 50, 26)), glow)
  x.restore()
}

// hairline cracks running off the carve — same family as the concrete bake's,
// but anchored to the inscription so the stone looks stressed by the cutting
function weather(x: CanvasRenderingContext2D, rng: () => number): void {
  const nCracks = 1 + ((rng() * 2) | 0)
  for (let i = 0; i < nCracks; i++) {
    let cx = TW * (0.2 + rng() * 0.6), cy = TH * (0.27 + rng() * 0.5)
    let a = Math.PI * (rng() < 0.5 ? 0.25 + rng() * 0.5 : -0.25 - rng() * 0.3)
    x.strokeStyle = `rgba(0,0,0,${0.10 + rng() * 0.12})`; x.lineWidth = 0.5 + rng() * 0.7
    x.beginPath(); x.moveTo(cx, cy)
    const segs = 5 + ((rng() * 7) | 0)
    for (let s = 0; s < segs; s++) {
      a += (rng() - 0.5) * 1.0
      cx += Math.cos(a) * (4 + rng() * 10); cy += Math.abs(Math.sin(a)) * (4 + rng() * 10)
      x.lineTo(cx, cy)
    }
    x.stroke()
  }
  // chipped nicks along the frame: a dark flake + a light speck where it broke off
  for (let i = 0; i < 5; i++) {
    const px = TW * (0.15 + rng() * 0.7)
    const py = rng() < 0.5 ? TH * (0.26 + rng() * 0.02) : TH * (0.74 + rng() * 0.02)
    const r = 1.5 + rng() * 2.5
    x.fillStyle = `rgba(0,0,0,${0.14 + rng() * 0.1})`
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + r, py + r * 0.4); x.lineTo(px + r * 0.3, py + r); x.closePath(); x.fill()
    x.fillStyle = 'rgba(255,250,240,0.08)'
    x.fillRect(px + r * 0.3, py + r, r * 0.8, 0.8)
  }
}

// ── the tablet bake ─────────────────────────────────────────────────────────────
function bake(tablet: RuneTablet, script: RuneScript, glow: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH
  const x = c.getContext('2d') as CanvasRenderingContext2D
  const rng = makeRng(tablet.seed)

  // incised frame: outer + inner line, cut with the same engraver (no ember —
  // only the runes themselves hold the old light)
  const fx0 = TW * 0.15, fx1 = TW * 0.85, fy0 = TH * 0.26, fy1 = TH * 0.755
  engrave(x, new Path2D(`M${fx0} ${fy0} H${fx1} V${fy1} H${fx0} Z`), 3.2, 0, rng)
  engrave(x, new Path2D(`M${fx0 + 7} ${fy0 + 7} H${fx1 - 7} V${fy1 - 7} H${fx0 + 7} Z`), 1.6, 0, rng)
  // faint column separators
  engrave(x, new Path2D(`M${TW * 0.40} ${fy0 + 14} V${fy1 - 14} M${TW * 0.60} ${fy0 + 14} V${fy1 - 14}`), 1.2, 0, rng)

  // columns: left | back (centre) | right, each signed with its chevron
  const colX: Record<TabletGroup['dir'], number> = { left: TW * 0.275, back: TW * 0.5, right: TW * 0.725 }
  const caret: Record<TabletGroup['dir'], 'left' | 'down' | 'right'> = { left: 'left', back: 'down', right: 'right' }
  const RS = TW * 0.175 // rune size
  for (const group of tablet.groups) {
    const cx = colX[group.dir]
    const n = group.runes.length
    // stack the column's runes around the tablet's eye-line band
    const span = TH * 0.125
    const y0 = TH * 0.465 - span * (n - 1) * 0.5
    group.runes.forEach((rIdx, i) => carveRune(x, script, rIdx, cx, y0 + i * span, RS, glow, rng))
    carveChevron(x, caret[group.dir], cx, TH * 0.685, RS * 0.6, glow, rng)
  }

  weather(x, rng)
  return c
}

// small LRU so close-by tablets stay baked but a long run can't hoard canvases
const _cache = new Map<string, HTMLCanvasElement>()
const CACHE_MAX = 40

export function tabletCanvas(tablet: RuneTablet, script: RuneScript, glow: number): HTMLCanvasElement {
  const bucket = Math.round((glow ?? 0.5) * 4) / 4 // quantize so slider drags don't rebake per frame
  const key = `${script}|${tablet.wallIdx}:${tablet.face}|${bucket}`
  const hit = _cache.get(key)
  if (hit) { _cache.delete(key); _cache.set(key, hit); return hit } // refresh recency
  const c = bake(tablet, script, bucket)
  _cache.set(key, c)
  if (_cache.size > CACHE_MAX) _cache.delete(_cache.keys().next().value as string)
  return c
}
