import { useState, useEffect } from 'react'
import Landing from './landing/Landing'
import Game from './game/Game'

// Top-level screen switch (no router — keeps the single-bundle SPA simple):
// the landing page is shown first; "ENTER" hands off to the game. The `#game`
// hash deep-links straight into the game and keeps it across a refresh, and a
// hashchange listener keeps the screen in sync with browser back/forward — so a
// touch user (no keyboard) can leave the game via the OS back gesture or the
// in-game back affordance, not just by editing the URL.
const hashIsGame = () =>
  typeof location !== 'undefined' && location.hash.replace('#', '') === 'game'

export default function Root() {
  const [screen, setScreen] = useState<'landing' | 'game'>(() => (hashIsGame() ? 'game' : 'landing'))

  useEffect(() => {
    const onHash = () => setScreen(hashIsGame() ? 'game' : 'landing')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const enter = () => {
    setScreen('game')
    try {
      location.hash = 'game'
    } catch {
      /* ignore */
    }
  }
  const exit = () => {
    setScreen('landing')
    try {
      if (location.hash) location.hash = ''
    } catch {
      /* ignore */
    }
  }
  return screen === 'landing' ? <Landing onEnter={enter} /> : <Game onExit={exit} />
}
