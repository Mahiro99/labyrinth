// Minimap.tsx — the bottom-right "YOUR MAP" panel. The rAF loop in useGame draws
// into the canvas via miniRef; this component just positions the label + canvas.
// On phones it shrinks (the draw loop reads clientWidth, so the map adapts) so it
// stops eating the view and overlapping the bottom compass line.
//
// The label + canvas are wrapped in one bordered capsule so the heading reads as
// part of the map rather than floating loose above it, and so the whole unit has a
// dark backing that keeps it legible over a bright daytime sky.

import { theme } from '../theme'
import { useMediaQuery } from '../lib/useMediaQuery'

export function Minimap({ miniRef, show }: { miniRef: React.RefObject<HTMLCanvasElement | null>; show: boolean }) {
  const compact = useMediaQuery('(max-width: 560px)');
  if (!show) return null;
  const size = compact ? 104 : 150;
  const inset = compact ? 12 : 22;
  return (
    <div style={{ position: 'absolute',
      right: `calc(${inset}px + env(safe-area-inset-right))`,
      bottom: `calc(${inset}px + env(safe-area-inset-bottom))`,
      padding: 6,
      background: 'rgba(8,11,16,0.55)',
      border: `1px solid ${theme.minimap.border}`,
      borderRadius: 8,
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '1px 3px 5px', fontSize: 9.5, letterSpacing: '0.22em',
        color: theme.minimap.label, textShadow: theme.minimap.labelShadow }}>
        <span>YOUR MAP</span>
        {/* the "you are here" dot, echoing the marker drawn on the canvas */}
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: theme.marker,
          boxShadow: `0 0 6px ${theme.marker}` }} />
      </div>
      <canvas ref={miniRef} style={{ width: size, height: size, display: 'block', borderRadius: 4 }} />
    </div>
  );
}
