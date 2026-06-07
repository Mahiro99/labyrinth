// Nav.tsx — top-nav pieces: the logo, the view tabs, and the help button.
import { useState } from 'react';
import { MazeGlyph } from './MazeGlyph';

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <MazeGlyph size={18} color="var(--ink)" />
      <span style={{ color: 'var(--ink)', fontSize: 12, letterSpacing: '0.34em',
        fontFamily: "'IBM Plex Mono', monospace" }}>LABYRINTH</span>
    </div>
  );
}

export function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.24em',
        padding: '6px 2px', color: active ? 'var(--ink)' : (hover ? 'var(--ink-soft)' : 'var(--ink-faint)'),
        transition: 'color 0.2s ease' }}>
      {label}
      <span style={{ position: 'absolute', left: 0, right: 0, bottom: -7, height: 2,
        background: 'var(--accent)', borderRadius: 2, transform: active ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left', transition: 'transform 0.28s ease' }}></span>
    </button>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title="How to play"
      style={{ width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
        background: hover ? 'var(--accent)' : 'rgba(18,22,17,0.42)',
        color: hover ? '#1c2016' : 'var(--ink)',
        border: `1px solid ${hover ? 'var(--accent)' : 'rgba(226,228,220,0.24)'}`,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 17, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease', backdropFilter: 'blur(2px)' }}>?</button>
  );
}
