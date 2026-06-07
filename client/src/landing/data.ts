// data.ts — static landing data: leaderboard, vine tints, the day's metadata.

export const DAY_NO = 142;
export const TODAY = '2026-06-06';

export const VINE_TINTS = ['#9cb870', '#88a85c', '#7a9a4e', '#6d8d44', '#aac487', '#94b266'];

type LurkerSpec = {
  side: 'left' | 'right';
  t: number;
  scale: number;
  lean: number;
  blink: number;
  lurk: number;
  cling: number;
};

export const LURKERS: LurkerSpec[] = [
  { side: 'left',  t: 0.21, scale: 1.24, lean:  7, blink: 3.1, lurk: 0,    cling: 0   },
  { side: 'left',  t: 0.50, scale: 0.66, lean:  5, blink: 4.7, lurk: 9,    cling: 1.3 },
  { side: 'right', t: 0.24, scale: 1.12, lean: -6, blink: 2.4, lurk: 4.5,  cling: 0.6 },
  { side: 'right', t: 0.54, scale: 0.60, lean: -5, blink: 5.3, lurk: 14,   cling: 2.0 },
];

type BoardEntry = { name: string; steps: number; time: string };

export const BOARD: BoardEntry[] = [
  { name: 'ariadne', steps: 48, time: '1:02' },
  { name: 'no_thread', steps: 51, time: '1:09' },
  { name: 'umbra', steps: 53, time: '0:58' },
  { name: 'left_hand_rule', steps: 56, time: '1:21' },
  { name: 'wallcrawler', steps: 59, time: '1:14' },
  { name: 'fathom', steps: 60, time: '1:33' },
  { name: 'knot_theory', steps: 62, time: '1:11' },
  { name: 'spelunk', steps: 64, time: '1:40' },
  { name: 'graphite', steps: 67, time: '1:27' },
  { name: 'dead_end_ed', steps: 71, time: '1:52' },
];
export const YOU = { rank: 14, name: 'you', steps: 78, time: '2:04' };
