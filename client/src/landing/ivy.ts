// ivy.ts — generative ivy: cascades of small leaf-dots hanging from the wall tops.
// Built once at load from a seeded RNG so the silhouette is stable.
import { makeRng } from '../lib/rng';
import { VINE_TINTS } from './data';

// the wall-top silhouette: V-shaped side walls + flat far wall across the middle
export function silhouette(x: number) {
  if (x <= 40) { const t = x / 40; return { y: 3 + t * 35, near: 1 - t * 0.62 }; }
  if (x >= 60) { const t = (x - 60) / 40; return { y: 38 - t * 35, near: 0.38 + t * 0.62 }; }
  return { y: 38, near: 0.30 };
}

type Leaf = { x: number; y: number; r: number; c: string; o: number };

export function buildVines(): Leaf[] {
  const rnd = makeRng(20260606);
  const leaves: Leaf[] = [];
  for (let x = 1.5; x < 99; x += 1.35) {
    if (rnd() > 0.84) continue;                       // ragged gaps between strands
    const px = x + (rnd() - 0.5) * 1.0;
    const { y, near } = silhouette(px);
    const len = 5 + near * 30 + (rnd() - 0.5) * 4;    // % of viewport height
    const baseR = 1.8 + near * 3.6;
    const phase = rnd() * 6.28;
    const nLeaf = Math.max(3, Math.round(len / 1.7));
    for (let i = 0; i < nLeaf; i++) {
      const f = i / nLeaf;
      if (f > 0.4 && rnd() < (f - 0.4) * 1.05) continue; // thin the tail
      const ly = y + f * len;
      const lx = px + Math.sin(f * 7 + phase) * 0.7 * near + (rnd() - 0.5) * 0.5;
      const lr = baseR * (0.7 + 0.5 * rnd()) * (1 - 0.22 * f);
      leaves.push({ x: lx, y: ly, r: lr, c: VINE_TINTS[(rnd() * VINE_TINTS.length) | 0],
        o: 0.58 * (1 - 0.2 * f) });
    }
  }
  return leaves;
}

export const VINES = buildVines();
