// Nav.tsx — top-nav pieces: the logo, the view tabs, and the help button.
// `compact` is the mobile breakpoint: drop the wordmark to just the glyph, tighten
// tracking, and grow tap targets toward the 44px guideline.
import { useState } from 'react';
import { MazeGlyph } from './MazeGlyph';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <MazeGlyph size={compact ? 22 : 18} color="var(--ink)" />
      {!compact && (
        <span style={{ color: 'var(--ink)', fontSize: 12, letterSpacing: '0.34em',
          fontFamily: "'IBM Plex Mono', monospace" }}>LABYRINTH</span>
      )}
    </div>
  );
}

export function Tab({ label, active, onClick, compact = false }:
  { label: string; active: boolean; onClick: () => void; compact?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: compact ? 11 : 12,
        letterSpacing: compact ? '0.12em' : '0.24em',
        padding: compact ? '10px 4px' : '6px 2px', minHeight: compact ? 44 : undefined,
        color: active ? 'var(--ink)' : (hover ? 'var(--ink-soft)' : 'var(--ink-faint)'),
        transition: 'color 0.2s ease' }}>
      {label}
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: compact ? 6 : -7, height: 2,
        background: 'var(--accent)', borderRadius: 2, transform: active ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left', transition: 'transform 0.28s ease' }}></span>
    </button>
  );
}

export function HelpButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  const [hover, setHover] = useState(false);
  const d = compact ? 44 : 38;
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title="How to play"
      style={{ width: d, height: d, borderRadius: '50%', cursor: 'pointer',
        background: hover ? 'var(--accent)' : 'rgba(18,22,17,0.42)',
        color: hover ? '#1c2016' : 'var(--ink)',
        border: `1px solid ${hover ? 'var(--accent)' : 'rgba(226,228,220,0.24)'}`,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease', backdropFilter: 'blur(2px)' }}>?</button>
  );
}
