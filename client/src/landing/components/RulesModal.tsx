// RulesModal.tsx — the briefing dossier. Framed as a recovered orientation file from
// "the Concern" (the corporation behind the maze): registration brackets, a stamped
// header, a faint scanline surface, a decoder key for the runes, and a terminal footer.
// Two tabs — HOW TO PLAY (the rules, made as plain as possible) and THE WORLD (the lore,
// drawn from the in-game environment, its sounds, and a nod to Maze Runner). Thematic but
// restrained; leans on the landing palette + fonts.

import { useState } from 'react';
import { MazeGlyph } from './MazeGlyph';

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', Georgia, serif";

// ── HOW TO PLAY: four plain directives ────────────────────────────────────────
const STEPS: [string, string][] = [
  ['ONE MAZE A DAY', 'The whole world runs the same maze each day. At midnight it’s gone, and a new one takes its place.'],
  ['YOU CAN BARELY SEE', 'A small light moves with you. One step ahead is fog — you choose blind, then find out.'],
  ['FEWEST STEPS WIN', 'Reach the hidden exit in as few steps as you can. Everyone shares one leaderboard.'],
  ['READ THE WALLS', 'Every fork is marked with runes. Add up each path’s runes — the highest total is the way through.'],
];

// rune voices — the decoder key
const MARKS: [string, string, string, string][] = [
  ['TRUTH', '+1', 'a good path', 'var(--vine-deep)'],
  ['LIE', '−1', 'bait — avoid', 'var(--you)'],
  ['MUTE', '0', 'says nothing', 'var(--ink-faint)'],
];

// ── THE WORLD: lore beats (drafted to be edited) ──────────────────────────────
const LORE: [string, string][] = [
  ['WHERE YOU ARE',
    'You come to at the foot of a wall you don’t remember reaching. Wet concrete climbs out of sight on every side, veined with creeping green. Far past the maze, brutalist towers stand against a dead sky — the spires of the Concern, the corporation that poured this place and still watches it.'],
  ['THE TEST',
    'The maze belongs to them. Each day it tears itself down and builds again. There is always a way out; there has never been an explanation. The runes scratched at every fork are the only language the Concern left behind — and it will not tell you what they mean. Read them, or wander.'],
  ['YOU ARE NOT ALONE',
    'The factories never powered down. Their machines still grind somewhere past the walls, tending a city that emptied long ago. And in the quiet between your footsteps, something listens to your breathing. Stand still too long and it finds you — a growl too close for the walls to allow. Keep moving.'],
  ['NO ONE HAS LEFT',
    'Rain comes. Thunder. The vines drink and climb. The lamps still burn in the towers, and no one answers them. They left the lights on, the machines running, and the maze hungry. Find the exit. No one has yet.'],
];

type Tab = 'play' | 'world';

// L-shaped registration brackets in each corner — a technical/brutalist instrument cue.
function Corner({ at }: { at: 'tl' | 'tr' | 'bl' | 'br' }) {
  const c = 'var(--accent)';
  const v: React.CSSProperties = { position: 'absolute', width: 12, height: 12, opacity: 0.55, pointerEvents: 'none' };
  const m: Record<typeof at, React.CSSProperties> = {
    tl: { top: 7, left: 7, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` },
    tr: { top: 7, right: 7, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` },
    bl: { bottom: 7, left: 7, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` },
    br: { bottom: 7, right: 7, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` },
  } as const;
  return <span aria-hidden style={{ ...v, ...m[at] }} />;
}

// minimal line icons for the "best experienced" advisory
const ico = { width: 17, height: 17, fill: 'none', stroke: 'var(--accent-soft)', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const IconHeadphones = () => (<svg viewBox="0 0 24 24" {...ico}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="7" rx="1.5" /><rect x="17" y="13" width="4" height="7" rx="1.5" /></svg>);
const IconFullscreen = () => (<svg viewBox="0 0 24 24" {...ico}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>);
const IconDesktop = () => (<svg viewBox="0 0 24 24" {...ico}><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" /></svg>);
const ADVISORY: [() => React.ReactElement, string, string][] = [
  [IconHeadphones, 'HEADPHONES', 'the maze breathes around you in stereo'],
  [IconFullscreen, 'FULLSCREEN', 'let the dark fill the room'],
  [IconDesktop, 'ON A DESKTOP', 'built for a big screen, not a phone'],
];

const Divider = ({ label }: { label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 11, margin: '20px 0 14px' }}>
    <span style={{ color: 'var(--ink-faint)', fontSize: 10, letterSpacing: '0.24em', whiteSpace: 'nowrap' }}>{label}</span>
    <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
  </div>
);

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('play');
  if (!open) return null;

  return (
    <div className="lab-modal-back" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 540, maxWidth: '92%',
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4,
        boxShadow: '0 40px 120px rgba(2,3,2,0.66)', maxHeight: '88vh', display: 'flex',
        flexDirection: 'column', overflow: 'hidden', fontFamily: MONO,
        animation: 'lab-rise 0.32s cubic-bezier(0.2,0.8,0.2,1) both' }}>

        {/* faint scanline surface — a dystopian terminal texture, kept very low */}
        <span aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 3px)' }} />
        <Corner at="tl" /><Corner at="tr" /><Corner at="bl" /><Corner at="br" />

        {/* header — a stamped dossier strip */}
        <div style={{ position: 'relative', zIndex: 1, padding: '15px 20px 12px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.022), transparent)',
          borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <MazeGlyph size={20} color="var(--accent)" />
              <div>
                <div style={{ color: 'var(--you)', fontSize: 9, letterSpacing: '0.28em', marginBottom: 3 }}>THE CONCERN ▸ ORIENTATION</div>
                <div style={{ color: 'var(--ink)', fontSize: 13, letterSpacing: '0.26em' }}>FIELD BRIEFING</div>
              </div>
            </div>
            <button onClick={onClose} title="Close" aria-label="Close"
              style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer',
                fontSize: 15, fontFamily: 'inherit', lineHeight: 1, width: 38, height: 38, marginRight: -8, marginTop: -6,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* tabs + file code */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {([['play', 'HOW TO PLAY'], ['world', 'THE WORLD']] as [Tab, string][]).map(([id, label]) => {
              const on = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '11px 0',
                    fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.18em',
                    color: on ? 'var(--ink)' : 'var(--ink-faint)',
                    borderBottom: `2px solid ${on ? 'var(--accent)' : 'transparent'}`,
                    marginBottom: -1, transition: 'color 0.2s' }}>{label}</button>
              );
            })}
          </div>
          <span style={{ color: 'var(--ink-faint)', fontSize: 9.5, letterSpacing: '0.14em', paddingBottom: 12 }}>DOC·0451</span>
        </div>

        {/* body */}
        <div style={{ position: 'relative', zIndex: 1, padding: '18px 22px 22px', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {tab === 'play' ? (
            <>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600, width: 20,
                    flexShrink: 0, paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 14 }}>
                    <div style={{ color: 'var(--ink)', fontSize: 12, letterSpacing: '0.14em', marginBottom: 5 }}>{s[0]}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 12.5, lineHeight: 1.6 }}>{s[1]}</div>
                  </div>
                </div>
              ))}

              {/* decoder key */}
              <Divider label="DECODE KEY" />
              <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid var(--line)', borderRadius: 4, padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                  <span style={{ color: 'var(--ink-faint)', fontSize: 10, letterSpacing: '0.18em' }}>THE FIVE MARKS</span>
                  <span style={{ color: 'var(--ink-soft)', fontSize: 15, letterSpacing: '0.34em', opacity: 0.9 }}>▲ ● ◆ ✶ ⬡</span>
                </div>
                <div style={{ color: 'var(--ink-soft)', fontSize: 12, lineHeight: 1.55, marginBottom: 11 }}>Each day, every mark is secretly one of three:</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {MARKS.map((m, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 108, border: `1px solid ${m[3]}33`,
                      background: `${m[3]}10`, borderRadius: 3, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ color: m[3], fontSize: 12, letterSpacing: '0.1em', fontWeight: 600 }}>{m[0]}</span>
                        <span style={{ color: m[3], fontSize: 12, fontWeight: 600 }}>{m[1]}</span>
                      </div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: 11, marginTop: 5 }}>{m[2]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: 12.5, lineHeight: 1.65, marginTop: 13 }}>
                No one tells you which is which — you learn by walking, guessing wrong, and spotting the
                pattern. A path of <span style={{ color: 'var(--ink)' }}>nothing but silence</span> is a
                trap: step on it and you’re flung somewhere far.
              </div>

              {/* best experienced */}
              <Divider label="BEST EXPERIENCED" />
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {ADVISORY.map(([Icon, head, sub], i) => (
                  <div key={i} style={{ flex: 1, minWidth: 130, display: 'flex', gap: 11, alignItems: 'flex-start',
                    border: '1px solid var(--line)', borderRadius: 3, padding: '11px 12px' }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}><Icon /></span>
                    <div>
                      <div style={{ color: 'var(--ink)', fontSize: 10.5, letterSpacing: '0.12em', marginBottom: 4 }}>{head}</div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: 11, lineHeight: 1.5 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: 'var(--ink-faint)', fontSize: 9.5, letterSpacing: '0.22em', marginBottom: 16 }}>
                RECOVERED LOG ▸ SUBJECT-0
              </div>
              {LORE.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                  <span style={{ flexShrink: 0, width: 1, background: 'var(--line)', marginTop: 3 }} />
                  <div>
                    <div style={{ color: 'var(--accent-soft)', fontSize: 10, letterSpacing: '0.2em', marginBottom: 7 }}>{b[0]}</div>
                    <p style={{ margin: 0, color: 'var(--ink-soft)', fontFamily: SERIF, fontSize: 14.5, lineHeight: 1.72 }}>{b[1]}</p>
                  </div>
                </div>
              ))}
              {/* a stamped seal closes the file */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <span style={{ display: 'inline-block', transform: 'rotate(-4deg)', border: '1px solid rgba(216,116,74,0.5)',
                  color: 'var(--you)', padding: '5px 11px', fontSize: 9, letterSpacing: '0.22em', borderRadius: 2, opacity: 0.85 }}>
                  PROPERTY OF THE CONCERN
                </span>
              </div>
            </>
          )}
        </div>

        {/* terminal footer */}
        <div style={{ position: 'relative', zIndex: 1, padding: '11px 22px', borderTop: '1px solid var(--line)',
          color: 'var(--ink-faint)', fontSize: 10.5, letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: 'var(--accent)' }}>›</span>
          <span>FIND THE EXIT</span>
          <span style={{ color: 'var(--accent)', animation: 'lab-blink 1.1s step-end infinite' }}>▊</span>
        </div>
      </div>
    </div>
  );
}
