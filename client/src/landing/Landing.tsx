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
import { CORRIDOR_DEFAULTS } from './corridorTweaks';

export default function Landing({ onEnter }: { onEnter: () => void }) {
  // Isolated store ('corridor') so these don't share the game's path-keyed blob.
  const [cor, setCor] = useTweaks(CORRIDOR_DEFAULTS, 'corridor');
  const [view, setView] = useState(() => {
    const h = (location.hash || '').replace('#', '');
    return h === 'board' ? 'board' : (localStorage.getItem('lab_view') === 'board' ? 'board' : 'play');
  });
  const [help, setHelp] = useState(false);
  const go = (v: string) => { setView(v); try { localStorage.setItem('lab_view', v); location.hash = v; } catch (e) {} };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--sky)', overflow: 'hidden' }}>
      <Corridor dim={view === 'board'} t={cor} />

      {/* top nav */}
      <div style={{ position: 'absolute', top: 28, left: 36, right: 36, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <Tab label="PLAY" active={view === 'play'} onClick={() => go('play')} />
          <Tab label="LEADERBOARD" active={view === 'board'} onClick={() => go('board')} />
          <div style={{ width: 1, height: 18, background: 'rgba(226,228,220,0.2)' }}></div>
          <HelpButton onClick={() => setHelp(true)} />
        </div>
      </div>

      {/* views */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        {view === 'play' ? <PlayView onEnter={onEnter} /> : <LeaderboardView />}
      </div>

      <div className="lab-grain" style={{ zIndex: 12 }}></div>
      <RulesModal open={help} onClose={() => setHelp(false)} />
      {/* dev-only tuning rig; the baked CORRIDOR_DEFAULTS ship in production */}
      {import.meta.env.DEV && <CorridorTweaks t={cor} setTweak={setCor} />}
    </div>
  );
}
