// Landing.tsx — Labyrinth landing shell: corridor backdrop, top nav, view switch, grain, rules modal.
import { useState } from 'react';
import './landing.css';
import { Corridor } from './components/Corridor';
import { CorridorTweaks } from './components/CorridorTweaks';
import { Logo, Tab, HelpButton } from './components/Nav';
import { PlayView } from './components/PlayView';
import { LeaderboardView } from './components/LeaderboardView';
import { RulesModal } from './components/RulesModal';
import { useTweaks } from '../tweaks';
import { useMediaQuery } from '../lib/useMediaQuery';
import { CORRIDOR_DEFAULTS } from './corridorTweaks';

export default function Landing({ onEnter }: { onEnter: () => void }) {
  // Isolated store ('corridor') so these don't share the game's path-keyed blob.
  const [cor, setCor] = useTweaks(CORRIDOR_DEFAULTS, 'corridor');
  // single mobile breakpoint; re-renders on resize/rotate so the CSS-laid-out
  // landing re-fits instead of clipping (the game canvas already self-heals).
  const mobile = useMediaQuery('(max-width: 480px)');
  // Towers stretch into needles whenever the viewport is portrait-ish, not only at
  // the phone breakpoint — drive their aspect handling off the actual shape.
  const portrait = useMediaQuery('(max-aspect-ratio: 4/3)');
  const [view, setView] = useState(() => {
    const h = (location.hash || '').replace('#', '');
    return h === 'board' ? 'board' : (localStorage.getItem('lab_view') === 'board' ? 'board' : 'play');
  });
  const [help, setHelp] = useState(false);
  const [diving, setDiving] = useState(false);
  const go = (v: string) => { setView(v); try { localStorage.setItem('lab_view', v); location.hash = v; } catch { /* ignore */ } };
  // ENTER doesn't navigate instantly — it dives down the corridor into the floor
  // hatch, then hands off to the game once the flight-in beat has played.
  const dive = () => {
    if (diving) return;
    setDiving(true);
    setTimeout(onEnter, 820); // match the lab-dive duration in landing.css
  };
  return (
    <div className={diving ? 'lab-diving' : undefined}
      style={{ position: 'fixed', inset: 0, background: 'var(--sky)', overflow: 'hidden' }}>
      <Corridor dim={view === 'board'} t={cor} portrait={portrait} />

      {/* top nav — insets shrink on mobile and add safe-area so it clears the notch */}
      <div style={{ position: 'absolute', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        top: `calc(${mobile ? 16 : 28}px + env(safe-area-inset-top))`,
        left: `calc(${mobile ? 14 : 36}px + env(safe-area-inset-left))`,
        right: `calc(${mobile ? 14 : 36}px + env(safe-area-inset-right))` }}>
        <Logo compact={mobile} />
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 14 : 30 }}>
          <Tab label="PLAY" active={view === 'play'} onClick={() => go('play')} compact={mobile} />
          <Tab label="LEADERBOARD" active={view === 'board'} onClick={() => go('board')} compact={mobile} />
          <div style={{ width: 1, height: 18, background: 'rgba(226,228,220,0.2)' }}></div>
          <HelpButton onClick={() => setHelp(true)} compact={mobile} />
        </div>
      </div>

      {/* views */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        {view === 'play' ? <PlayView onEnter={dive} mobile={mobile} /> : <LeaderboardView mobile={mobile} />}
      </div>

      <div className="lab-grain" style={{ zIndex: 12 }}></div>
      {diving && <div className="lab-dive-flash"></div>}
      <RulesModal open={help} onClose={() => setHelp(false)} />
      {/* dev-only tuning rig; the baked CORRIDOR_DEFAULTS ship in production */}
      {import.meta.env.DEV && <CorridorTweaks t={cor} setTweak={setCor} />}
    </div>
  );
}
