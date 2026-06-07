// RulesModal.tsx — the "how to play" light card.

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const steps: [string, string][] = [
    ['ONE MAZE A DAY', 'Everyone races the same maze. It resets at midnight. Miss it and it’s gone.'],
    ['WALK BY LAMPLIGHT', 'You explore first-person by the small light you carry. A step ahead is fog — you commit, then find out.'],
    ['FEWEST STEPS WIN', 'Your score is the number of steps to the hidden exit. The leaderboard is shared.'],
    ['READ THE MARKS', 'At every fork the walls are marked. Each branch adds up its runes — the highest-scoring branch is the way through.'],
  ];
  return (
    <div className="lab-modal-back" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '88%',
        background: 'var(--card)', border: '1px solid rgba(226,228,220,0.16)',
        borderRadius: 5, boxShadow: '0 40px 110px rgba(2,3,2,0.6)',
        maxHeight: '86vh', overflowY: 'auto', overscrollBehavior: 'contain',
        fontFamily: "'IBM Plex Mono', monospace", animation: 'lab-rise 0.3s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px', borderBottom: '1px solid rgba(226,228,220,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }}></span>
            <span style={{ color: 'var(--ink)', fontSize: 13, letterSpacing: '0.22em' }}>HOW TO PLAY</span>
          </div>
          <button onClick={onClose} title="Close" aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer',
              fontSize: 18, fontFamily: 'inherit', lineHeight: 1, width: 44, height: 44, marginRight: -10,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '22px 24px 8px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <span style={{ color: 'var(--vine-deep)', fontSize: 12, fontWeight: 600, width: 22,
                flexShrink: 0, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div style={{ color: 'var(--ink)', fontSize: 12.5, letterSpacing: '0.16em',
                  marginBottom: 5 }}>{s[0]}</div>
                <div style={{ color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.6 }}>{s[1]}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '4px 24px 22px' }}>
          <div style={{ color: 'var(--ink-faint)', fontSize: 11, letterSpacing: '0.18em',
            marginBottom: 12 }}>THE MARKS — EACH DAY EACH ONE SECRETLY MEANS…</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([['TRUTH', '+1', 'var(--vine-deep)'], ['LIE', '−1', 'var(--you)'], ['MUTE', '0', 'var(--ink-faint)']] as [string, string, string][]).map((v, i) => (
              <div key={i} style={{ flex: 1, minWidth: 120, border: '1px solid rgba(226,228,220,0.14)',
                borderRadius: 3, padding: '12px 14px' }}>
                <div style={{ color: v[2], fontSize: 12.5, letterSpacing: '0.14em',
                  fontWeight: 600 }}>{v[0]}</div>
                <div style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 4 }}>scores {v[1]}</div>
              </div>
            ))}
          </div>
          <div style={{ color: 'var(--ink-soft)', fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>
            Nobody tells you which is which. You learn by walking, getting it wrong, and noticing the
            pattern. A branch marked with nothing but silence is a trap.
          </div>
        </div>
      </div>
    </div>
  );
}
