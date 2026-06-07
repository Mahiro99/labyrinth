// MazeGlyph.tsx — the small maze-path logo mark.

export function MazeGlyph({ size = 18, color = 'var(--ink-soft)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.6" strokeLinecap="square">
      <path d="M3 3 H21 V21 H7 V9 H17 V17 H11 V13" />
    </svg>
  );
}
