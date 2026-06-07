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
  mobile?: boolean;
};

// Fixed numeric columns collapse the name column to ~0 on a phone, so on mobile
// drop the TIME column and shrink the rest to keep RUNNER readable.
const cols = (mobile: boolean) => (mobile ? '36px 1fr auto' : '54px 1fr 92px 84px');

function Row({ rank, name, steps, time, mine, delay, mobile = false }: RowProps) {
  const top = rank <= 3;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols(mobile), alignItems: 'center',
      padding: mobile ? '11px 12px' : '13px 20px', borderRadius: 3, columnGap: mobile ? 10 : 0,
      background: mine ? 'rgba(216,116,74,0.16)' : (top ? 'rgba(174,203,128,0.13)' : 'transparent'),
      border: mine ? '1px solid rgba(216,116,74,0.5)' : '1px solid transparent',
      animation: `lab-rowin 0.4s ease ${delay}s both` }}>
      <span style={{ color: rank === 1 ? 'var(--vine-deep)' : 'var(--ink-faint)', fontSize: 13,
        fontWeight: 600 }}>{String(rank).padStart(2, '0')}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {top && <span style={{ color: 'var(--vine-deep)', fontSize: 10 }}>◆</span>}
        <span style={{ color: 'var(--ink)', fontSize: 14, letterSpacing: '0.04em', fontWeight: mine ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {mine && <span style={{ color: 'var(--you)', fontSize: 10, letterSpacing: '0.2em', flexShrink: 0,
          border: '1px solid rgba(194,96,58,0.5)', borderRadius: 2, padding: '2px 6px' }}>YOU</span>}
      </span>
      <span style={{ color: top ? 'var(--vine-deep)' : 'var(--ink)', fontSize: 14, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums', fontWeight: top ? 600 : 400 }}>{steps}</span>
      {!mobile && (
        <span style={{ color: 'var(--ink-soft)', fontSize: 13, textAlign: 'right',
          fontVariantNumeric: 'tabular-nums' }}>{time}</span>
      )}
    </div>
  );
}

export function LeaderboardView({ mobile = false }: { mobile?: boolean }) {
  const reset = useCountdown();
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace", animation: 'lab-fade 0.5s ease both',
      padding: `calc(${mobile ? 68 : 92}px + env(safe-area-inset-top)) calc(${mobile ? 14 : 24}px + env(safe-area-inset-right)) calc(${mobile ? 20 : 40}px + env(safe-area-inset-bottom)) calc(${mobile ? 14 : 24}px + env(safe-area-inset-left))` }}>
      <div style={{ width: 640, maxWidth: '100%', maxHeight: '100%', display: 'flex',
        flexDirection: 'column', background: 'rgba(30,35,27,0.92)',
        border: '1px solid rgba(226,228,220,0.14)', borderRadius: 5, padding: mobile ? '16px 14px 14px' : '26px 26px 22px',
        boxShadow: '0 30px 80px rgba(4,6,4,0.5)' }}>
        {/* meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, flexShrink: 0 }}>
          <div style={{ color: 'var(--ink-soft)', fontSize: 12, letterSpacing: '0.34em',
            whiteSpace: 'nowrap' }}>
            NO. {DAY_NO}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--ink-soft)', fontSize: 11, letterSpacing: '0.2em' }}>RESETS IN</span>
            <span style={{ color: 'var(--vine-deep)', fontSize: 17, letterSpacing: '0.08em',
              fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{reset}</span>
          </div>
        </div>
        {/* title */}
        <h1 style={{ margin: '0 0 22px', color: 'var(--ink)', fontFamily: "'Fraunces', serif",
          fontWeight: 400, fontSize: 'clamp(26px, 7vw, 40px)', letterSpacing: '0.02em',
          flexShrink: 0 }}>Today’s fastest out.</h1>

        {/* column header */}
        <div style={{ display: 'grid', gridTemplateColumns: cols(mobile), columnGap: mobile ? 10 : 0,
          padding: mobile ? '0 12px 11px' : '0 20px 11px', borderBottom: '1px solid rgba(226,228,220,0.14)',
          color: 'var(--ink-faint)', fontSize: 11, letterSpacing: '0.2em', flexShrink: 0 }}>
          <span>#</span><span>RUNNER</span>
          <span style={{ textAlign: 'right' }}>STEPS</span>
          {!mobile && <span style={{ textAlign: 'right' }}>TIME</span>}
        </div>

        {/* rows */}
        <div style={{ overflowY: 'auto', margin: '6px 0', paddingRight: 2 }}>
          {BOARD.map((r, i) => (
            <Row key={r.name} rank={i + 1} {...r} delay={i * 0.04} mobile={mobile} />
          ))}
        </div>

        {/* your standing pinned */}
        <div style={{ marginTop: 8, paddingTop: 13, borderTop: '1px solid rgba(226,228,220,0.14)',
          flexShrink: 0 }}>
          <Row rank={YOU.rank} name={YOU.name} steps={YOU.steps} time={YOU.time} mine delay={0.2} mobile={mobile} />
        </div>
      </div>
    </div>
  );
}
