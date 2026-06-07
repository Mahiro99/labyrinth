// Ivy.tsx — renders the prebuilt leaf-dots from the seeded ivy silhouette.
import { VINES } from '../ivy';

export function Ivy() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {VINES.map((l, i) => (
        <div key={i} style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`,
          width: l.r * 2, height: l.r * 2.3, marginLeft: -l.r, marginTop: -l.r,
          borderRadius: '50% 50% 48% 48%', background: l.c, opacity: l.o }}></div>
      ))}
    </div>
  );
}
