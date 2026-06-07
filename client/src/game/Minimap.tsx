// Minimap.tsx — the bottom-right "YOUR MAP" panel. The rAF loop in useGame draws
// into the canvas via miniRef; this component just positions the label + canvas.
// On phones it shrinks (the draw loop reads clientWidth, so the map adapts) so it
// stops eating the view and overlapping the bottom compass line.

import { theme } from '../theme'
import { useMediaQuery } from '../lib/useMediaQuery'

export function Minimap({ miniRef, show }: { miniRef: React.RefObject<HTMLCanvasElement | null>; show: boolean }) {
  const compact = useMediaQuery('(max-width: 560px)');
  if (!show) return null;
  const size = compact ? 104 : 150;
  return (
    <div style={{ position: 'absolute',
      right: `calc(${compact ? 12 : 22}px + env(safe-area-inset-right))`,
      bottom: `calc(${compact ? 12 : 22}px + env(safe-area-inset-bottom))` }}>
      <div style={{ fontSize: 10, letterSpacing: '0.24em', color: theme.minimap.label, marginBottom: 5, textShadow: theme.minimap.labelShadow }}>YOUR MAP</div>
      <canvas ref={miniRef} style={{ width: size, height: size, display: 'block', borderRadius: 3, border: `1px solid ${theme.minimap.border}` }} />
    </div>
  );
}
