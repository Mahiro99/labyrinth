// Minimap.tsx — the bottom-right "YOUR MAP" panel. The rAF loop in useGame draws
// into the canvas via miniRef; this component just positions the label + canvas.

export function Minimap({ miniRef, show }: { miniRef: React.RefObject<HTMLCanvasElement | null>; show: boolean }) {
  if (!show) return null;
  return (
    <div style={{ position: 'absolute', right: 22, bottom: 22 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.24em', color: '#6b7787', marginBottom: 5 }}>YOUR MAP</div>
      <canvas ref={miniRef} style={{ width: 150, height: 150, display: 'block', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }} />
    </div>
  );
}
