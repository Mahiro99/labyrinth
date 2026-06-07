// LeaderboardView.tsx — the LEADERBOARD view: today's fastest-out board + your pinned standing.
import { useCountdown } from '../useCountdown';
import { DAY_NO, BOARD, YOU } from '../data';

type RowProps = {
  rank: number;
  name: string;
  steps: number;
  time: string;
  mine?: boolean;
  delay: number;
};

function Row({ rank, name, steps, time, mine, delay }: RowProps) {
  const top = rank <= 3;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 92px 84px', alignItems: 'center',
      padding: '13px 20px', borderRadius: 3,
      background: mine ? 'rgba(216,116,74,0.16)' : (top ? 'rgba(174,203,128,0.13)' : 'transparent'),
      border: mine ? '1px solid rgba(216,116,74,0.5)' : '1px solid transparent',
      animation: `lab-rowin 0.4s ease ${delay}s both` }}>
      <span style={{ color: rank === 1 ? 'var(--vine-deep)' : 'var(--ink-faint)', fontSize: 13,
        fontWeight: 600 }}>{String(rank).padStart(2, '0')}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {top && <span style={{ color: 'var(--vine-deep)', fontSize: 10 }}>◆</span>}
        <span style={{ color: 'var(--ink)', fontSize: 14, letterSpacing: '0.04em',
          fontWeight: mine ? 600 : 400 }}>{name}</span>
        {mine && <span style={{ color: 'var(--you)', fontSize: 10, letterSpacing: '0.2em',
          border: '1px solid rgba(194,96,58,0.5)', borderRadius: 2, padding: '2px 6px' }}>YOU</span>}
      </span>
      <span style={{ color: top ? 'var(--vine-deep)' : 'var(--ink)', fontSize: 14, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', fontWeight: top ? 600 : 400 }}>{steps}</span>
      <span style={{ color: 'var(--ink-soft)', fontSize: 13, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums' }}>{time}</span>
    </div>
  );
}

export function LeaderboardView() {
  const reset = useCountdown();
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace",
      animation: 'lab-fade 0.5s ease both', padding: '92px 24px 40px' }}>
      <div style={{ width: 640, maxWidth: '100%', maxHeight: '100%', display: 'flex',
        flexDirection: 'column', background: 'rgba(30,35,27,0.92)',
        border: '1px solid rgba(226,228,220,0.14)', borderRadius: 5, padding: '26px 26px 22px',
        boxShadow: '0 30px 80px rgba(4,6,4,0.5)' }}>
        {/* meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, flexShrink: 0 }}>
          <div style={{ color: 'var(--ink-soft)', fontSize: 12, letterSpacing: '0.34em',
            whiteSpace: 'nowrap' }}>
            DAILY MAZE · NO. {DAY_NO}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--ink-soft)', fontSize: 11, letterSpacing: '0.2em' }}>RESETS IN</span>
            <span style={{ color: 'var(--vine-deep)', fontSize: 17, letterSpacing: '0.08em',
              fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{reset}</span>
          </div>
        </div>
        {/* title */}
        <h1 style={{ margin: '0 0 22px', color: 'var(--ink)', fontFamily: "'Fraunces', serif",
          fontWeight: 400, fontSize: 40, letterSpacing: '0.02em', whiteSpace: 'nowrap',
          flexShrink: 0 }}>Today’s fastest out.</h1>

        {/* column header */}
        <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 92px 84px',
          padding: '0 20px 11px', borderBottom: '1px solid rgba(226,228,220,0.14)',
          color: 'var(--ink-faint)', fontSize: 11, letterSpacing: '0.2em', flexShrink: 0 }}>
          <span>#</span><span>RUNNER</span>
          <span style={{ textAlign: 'right' }}>STEPS</span>
          <span style={{ textAlign: 'right' }}>TIME</span>
        </div>

        {/* rows */}
        <div style={{ overflowY: 'auto', margin: '6px 0', paddingRight: 2 }}>
          {BOARD.map((r, i) => (
            <Row key={r.name} rank={i + 1} {...r} delay={i * 0.04} />
          ))}
        </div>

        {/* your standing pinned */}
        <div style={{ marginTop: 8, paddingTop: 13, borderTop: '1px solid rgba(226,228,220,0.14)',
          flexShrink: 0 }}>
          <Row rank={YOU.rank} name={YOU.name} steps={YOU.steps} time={YOU.time} mine delay={0.2} />
        </div>
      </div>
    </div>
  );
}
