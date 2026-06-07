// Corridor.tsx — the corridor scene: overcast concrete room, sandy floor, far towers, ivy.
import { Ivy } from './Ivy';
import { CORRIDOR_DEFAULTS, vignetteCss } from '../corridorTweaks';
import type { CorridorTweaks } from '../corridorTweaks';

export function Corridor({ dim = false, t = CORRIDOR_DEFAULTS }: { dim?: boolean; t?: CorridorTweaks }) {
  const vig = vignetteCss(t);
  const wall = (clip: string, grad: string, extra?: React.CSSProperties): React.CSSProperties =>
    ({ position: 'absolute', inset: 0, clipPath: clip, background: grad, ...extra });
  const streak = 'repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 7px, rgba(60,64,58,0.035) 7px 8px)';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden',
      filter: dim ? 'brightness(0.62) saturate(0.9) blur(1.5px)' : 'none',
      transition: 'filter 0.5s ease' }}>
      {/* sky — sickly pallid band up top dropping fast to black */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, var(--sky-hi) 0%, var(--sky) 32%, #060804 58%)' }}></div>
      {/* distant towers — looming, jagged monoliths crowding the horizon */}
      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '50%' }}
        viewBox="0 0 100 50" preserveAspectRatio="none">
        {/* far haze layer — pale, distant, tall */}
        <g fill="#525a4f" opacity="0.34">
          <polygon points="35,50 35.6,18 36.3,18 36.7,50" />
          <polygon points="43,50 43.5,14 44.4,14 44.8,50" />
          <polygon points="57,50 57.6,16 58.5,16 58.9,50" />
          <polygon points="66,50 66.5,21 67.2,21 67.5,50" />
        </g>
        {/* near layer — dark, menacing silhouettes against the pallid band */}
        <g fill="#0e120a" opacity="0.97">
          <polygon points="34,50 34.6,12 36.1,5 37.4,11 37.9,50" />
          <polygon points="39.5,50 39.8,9 41.6,9 42.0,3 42.9,3 43.3,9 45.1,9 45.5,50" />
          <polygon points="47,50 47.6,6 48.0,1.5 48.7,6 49.1,50" />
          <polygon points="50,50 50.5,15 51.2,8 51.7,11 52.3,3 53.0,8 53.7,2 54.4,9 55.0,15 55.5,50" />
          <polygon points="57,50 58.6,8 59.0,5 59.5,50" />
          <polygon points="61,50 61.4,12 62.7,12 63.1,7 63.8,50" />
          <polygon points="64.5,50 65.0,17 65.4,14 65.9,17 66.3,50" />
        </g>
        {/* faint cold rim catching the horizon light on the tallest crowns */}
        <g fill="#6b7367" opacity="0.6">
          <polygon points="36.1,5 37.0,8 35.6,9" />
          <polygon points="48.0,1.5 48.5,4 47.7,4.5" />
          <polygon points="53.7,2 54.2,5 53.2,5" />
        </g>
      </svg>
      {/* far wall (center, hazy lighter) */}
      <div style={wall('polygon(40% 38%, 60% 38%, 60% 62%, 40% 62%)',
        'linear-gradient(180deg, #383e31, var(--concrete-far))', { backgroundBlendMode: 'normal' })}></div>
      <div style={wall('polygon(40% 38%, 60% 38%, 60% 62%, 40% 62%)', streak)}></div>
      {/* left wall */}
      <div style={wall('polygon(0 3%, 40% 38%, 40% 62%, 0 100%)',
        'linear-gradient(90deg, var(--concrete-sh) 0%, var(--concrete) 88%)')}></div>
      <div style={wall('polygon(0 3%, 40% 38%, 40% 62%, 0 100%)', streak)}></div>
      {/* right wall */}
      <div style={wall('polygon(100% 3%, 60% 38%, 60% 62%, 100% 100%)',
        'linear-gradient(270deg, var(--concrete-sh) 0%, var(--concrete) 88%)')}></div>
      <div style={wall('polygon(100% 3%, 60% 38%, 60% 62%, 100% 100%)', streak)}></div>
      {/* floor */}
      <div style={wall('polygon(0 100%, 40% 62%, 60% 62%, 100% 100%)',
        'linear-gradient(180deg, var(--floor) 0%, var(--floor-hi) 70%)')}></div>
      {/* the exit hatch on the floor */}
      <div style={{ position: 'absolute', left: '44%', top: '70%', width: '12%', height: '7%',
        background: 'rgba(226,228,220,0.05)', border: '1px solid rgba(226,228,220,0.12)',
        transform: 'perspective(280px) rotateX(58deg)' }}></div>

      {/* concrete seam lines (perspective) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="none" viewBox="0 0 100 100">
        <g stroke="rgba(226,228,220,0.09)" strokeWidth="0.12" fill="none">
          <line x1="0" y1="24" x2="40" y2="46" /><line x1="0" y1="86" x2="40" y2="56" />
          <line x1="100" y1="24" x2="60" y2="46" /><line x1="100" y1="86" x2="60" y2="56" />
          <line x1="40" y1="38" x2="40" y2="62" /><line x1="60" y1="38" x2="60" y2="62" />
          <line x1="40" y1="50" x2="60" y2="50" />
        </g>
      </svg>

      <div style={{ opacity: t.ivyGlow, filter: `saturate(${t.ivySat})` }}>
        <Ivy />
      </div>

      {/* cold mist pooling and creeping up from the void floor */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%',
        pointerEvents: 'none', mixBlendMode: 'screen', filter: 'blur(7px)',
        background: 'linear-gradient(0deg, rgba(150,162,150,0.13) 0%, rgba(140,152,142,0.05) 48%, transparent 100%)',
        animation: 'lab-mist 13s ease-in-out infinite' }}></div>

      {/* suffocating dark — hard tunnel-vision closing in from every edge */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: vig.static }}></div>
      {/* the dark breathing — slow pulse so the walls feel like they press in */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        animation: 'lab-suffocate 9s ease-in-out infinite',
        background: vig.breathe }}></div>
    </div>
  );
}
