// cracks.ts — generative concrete relief for the walls: hairline cracks, pale
// pitting/speckle, and faint horizontal form-lines (the seams where poured
// concrete panels meet). Built once from a seed (same pattern as ivy / tower
// windows) so the weathering is stable.
//
// Key: on near-black stone, texture only reads if it has LIGHT contrast. So cracks
// are drawn dark-core + a pale catching-edge (relief), and pitting is light specks.
// Output is in 0..100 viewBox space; Corridor.tsx clips each set to a wall polygon.
import { makeRng } from '../lib/rng';

export type Crack = { d: string; w: number; o: number };
export type Pit = { cx: number; cy: number; r: number; o: number };
export type Seam = { x1: number; y1: number; x2: number; y2: number; o: number };

// A jagged, branching hairline starting near (x,y) and wandering downward.
function crackPath(rnd: () => number, x: number, y: number, len: number): string {
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  let cx = x, cy = y;
  const steps = 5 + ((rnd() * 5) | 0);
  for (let i = 0; i < steps; i++) {
    cx += (rnd() - 0.5) * 7;
    cy += len / steps + (rnd() - 0.5) * 2.5;
    d += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  return d;
}

// `region` is a rough x/y box to scatter weathering within (a wall's bounds).
export function buildWeathering(seed: number, region: { x0: number; x1: number; y0: number; y1: number }) {
  const rnd = makeRng(seed);
  const cracks: Crack[] = [];
  const pits: Pit[] = [];
  const seams: Seam[] = [];
  const w = region.x1 - region.x0;
  const h = region.y1 - region.y0;

  // cracks — several, visibly wide enough to catch light.
  for (let i = 0; i < 8; i++) {
    const x = region.x0 + rnd() * w;
    const y = region.y0 + rnd() * h * 0.6;
    cracks.push({ d: crackPath(rnd, x, y, 12 + rnd() * 30), w: 0.12 + rnd() * 0.22, o: 0.5 + rnd() * 0.4 });
  }
  // pitting/speckle — pale flecks scattered all over, the rough aggregate surface.
  for (let i = 0; i < 90; i++) {
    pits.push({ cx: region.x0 + rnd() * w, cy: region.y0 + rnd() * h, r: 0.12 + rnd() * 0.4,
      o: 0.05 + rnd() * 0.22 });
  }
  // horizontal form-lines — faint panel seams from the concrete pour.
  for (let i = 0; i < 4; i++) {
    const y = region.y0 + (i + 0.5) / 4 * h + (rnd() - 0.5) * 4;
    seams.push({ x1: region.x0, y1: y, x2: region.x1, y2: y + (rnd() - 0.5) * 2, o: 0.06 + rnd() * 0.06 });
  }
  return { cracks, pits, seams };
}

// Left and right walls roughly span these boxes (mirror of each other).
export const LEFT_WEATHER = buildWeathering(80260607, { x0: 2, x1: 38, y0: 8, y1: 96 });
export const RIGHT_WEATHER = buildWeathering(80260931, { x0: 62, x1: 98, y0: 8, y1: 96 });
