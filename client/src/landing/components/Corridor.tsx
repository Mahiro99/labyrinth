// Corridor.tsx — the corridor scene: overcast concrete room, sandy floor, far towers.
import { TOWER_WINDOWS } from '../towerWindows';
import { LEFT_WEATHER, RIGHT_WEATHER } from '../cracks';
import { CORRIDOR_DEFAULTS, vignetteCss, towerCss } from '../corridorTweaks';
import type { CorridorTweaks } from '../corridorTweaks';

export function Corridor({ dim = false, t = CORRIDOR_DEFAULTS, portrait = false }: { dim?: boolean; t?: CorridorTweaks; portrait?: boolean }) {
  const vig = vignetteCss(t);
  const twr = towerCss(t);
  const wall = (clip: string, grad: string, extra?: React.CSSProperties): React.CSSProperties =>
    ({ position: 'absolute', inset: 0, clipPath: clip, background: grad, ...extra });
  const streak = 'repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 7px, rgba(60,64,58,0.035) 7px 8px)';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden',
      filter: dim ? 'brightness(0.62) saturate(0.9) blur(1.5px)' : 'none',
      transition: 'filter 0.5s ease' }}>
      {/* sky — sickly pallid band up top dropping fast to black. A brighter glow
          band sits right behind the towers' crowns so the silhouettes read against
          it instead of vanishing into the near-black. */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, var(--sky-hi) 0%, var(--sky) 38%, #060804 60%)' }}></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '42%', pointerEvents: 'none',
        background: twr.glow }}></div>
      {/* distant towers — looming, jagged monoliths crowding the horizon. On a
          portrait-ish viewport, 'none' stretches them into thin needles, but 'meet'
          alone shrinks them to a tiny centred cluster. So we slice (fill width, crop
          excess height) and bottom-anchor the bases to the horizon — the skyline
          stays full-width and looming instead of dwindling. */}
      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%',
        height: portrait ? '40%' : '50%' }}
        viewBox="0 0 100 50" preserveAspectRatio={portrait ? 'xMidYMax slice' : 'none'}>
        <defs>
          {/* near towers fade from a visible cold grey at the crowns (catching the
              horizon glow) down to near-black at the base — reads as form, not a
              flat black cutout, so the skyline is legible. */}
          <linearGradient id="lab-tower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={twr.crown} />
            <stop offset="55%" stopColor="#191d15" />
            <stop offset="100%" stopColor="#0c0f08" />
          </linearGradient>
        </defs>
        {/* far haze layer — pale, distant, tall */}
        <g fill="#5b6357" opacity={t.twrHaze}>
          <polygon points="35,50 35.6,18 36.3,18 36.7,50" />
          <polygon points="43,50 43.5,14 44.4,14 44.8,50" />
          <polygon points="57,50 57.6,16 58.5,16 58.9,50" />
          <polygon points="66,50 66.5,21 67.2,21 67.5,50" />
        </g>
        {/* near layer — looming silhouettes, lit at the crowns by the horizon glow */}
        <g fill="url(#lab-tower)">
          <polygon points="34,50 34.6,12 36.1,5 37.4,11 37.9,50" />
          <polygon points="39.5,50 39.8,9 41.6,9 42.0,3 42.9,3 43.3,9 45.1,9 45.5,50" />
          <polygon points="47,50 47.6,6 48.0,1.5 48.7,6 49.1,50" />
          <polygon points="50,50 50.5,15 51.2,8 51.7,11 52.3,3 53.0,8 53.7,2 54.4,9 55.0,15 55.5,50" />
          <polygon points="57,50 58.6,8 59.0,5 59.5,50" />
          <polygon points="61,50 61.4,12 62.7,12 63.1,7 63.8,50" />
          <polygon points="64.5,50 65.0,17 65.4,14 65.9,17 66.3,50" />
        </g>
        {/* faint cold rim catching the horizon light on the tallest crowns */}
        <g fill="#828a7c" opacity="0.7">
          <polygon points="36.1,5 37.0,8 35.6,9" />
          <polygon points="48.0,1.5 48.5,4 47.7,4.5" />
          <polygon points="53.7,2 54.2,5 53.2,5" />
        </g>
        {/* tiny red window-lights scattered up the towers — a city out there,
            occupied, watching. Seeded so the lit windows are stable; a few flicker. */}
        <g fill="#c2402a" style={{ filter: 'drop-shadow(0 0 0.4px rgba(216,80,52,0.9))' }}>
          {TOWER_WINDOWS.map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} opacity={Math.min(1, w.o * t.twrWin)} rx={0.08}
              style={w.dur ? { animation: `lab-window-flicker ${w.dur}s ease-in-out infinite`,
                animationDelay: `${w.delay}s` } : undefined} />
          ))}
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
      {/* concrete relief — pale pitting, panel form-lines, and cracks (dark core +
          a light catching-edge so they read on dark stone). Each set clipped to its
          wall so the texture sits on the stone, perspective-correct via the clip. */}
      {([
        { clip: 'polygon(0 3%, 40% 38%, 40% 62%, 0 100%)', wx: LEFT_WEATHER },
        { clip: 'polygon(100% 3%, 60% 38%, 60% 62%, 100% 100%)', wx: RIGHT_WEATHER },
      ] as const).map((side, si) => (
        <div key={si} style={{ position: 'absolute', inset: 0, clipPath: side.clip, pointerEvents: 'none' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* horizontal panel form-lines */}
            {side.wx.seams.map((s, i) => (
              <line key={`m${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                stroke="#cfd4c8" strokeWidth={0.1} opacity={s.o} />
            ))}
            {/* pale pitting/aggregate speckle — the rough surface catching light */}
            {side.wx.pits.map((p, i) => (
              <circle key={`p${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#d4d8cc" opacity={p.o} />
            ))}
            {/* cracks: light highlight edge under a dark core = carved relief */}
            {side.wx.cracks.map((c, i) => (
              <g key={`c${i}`} opacity={c.o}>
                <path d={c.d} stroke="#c8ccc0" strokeWidth={c.w + 0.12} fill="none"
                  opacity={0.28} strokeLinecap="round" transform="translate(0,0.12)" />
                <path d={c.d} stroke="#050604" strokeWidth={c.w} fill="none" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        </div>
      ))}

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

      {/* the exit grate on the floor — a dark iron grate set into the concrete, only
          its edges catching the dim light. The ENTER dive's target. Minimal: no glow,
          no colour — just the way down. Laid flat into the floor via rotateX. */}
      <div style={{ position: 'absolute', left: '42%', top: '67%', width: '16%', height: '13%',
        transform: 'perspective(420px) rotateX(62deg)', transformOrigin: '50% 0%',
        pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* the dark opening behind the bars */}
          <rect x="6" y="6" width="88" height="88" rx="2" fill="#04050399" />
          {/* the iron bars — neutral cold grey, just catching the dim light */}
          <g fill="#14160f" stroke="rgba(226,228,220,0.16)" strokeWidth="0.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={11 + i * 13.6} y="8" width="6.2" height="84" />
            ))}
          </g>
          {/* a couple of cross-ties */}
          <g fill="#1a1c14" stroke="rgba(226,228,220,0.12)" strokeWidth="0.4">
            <rect x="7" y="32" width="86" height="4" />
            <rect x="7" y="64" width="86" height="4" />
          </g>
          {/* raised frame — a faint top-edge highlight reads as a metal lip */}
          <rect x="3" y="3" width="94" height="94" fill="none"
            stroke="rgba(226,228,220,0.22)" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
