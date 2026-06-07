import { useState } from 'react'
import Landing from './landing/Landing'
import Game from './game/Game'

// Top-level screen switch (no router — keeps the single-bundle SPA simple):
// the landing page is shown first; "ENTER" hands off to the game. The `#game`
// hash deep-links straight into the game and keeps it across a refresh.
export default function Root() {
  const [screen, setScreen] = useState<'landing' | 'game'>(() =>
    typeof location !== 'undefined' && location.hash.replace('#', '') === 'game' ? 'game' : 'landing',
  )
  const enter = () => {
    setScreen('game')
    try {
      location.hash = 'game'
    } catch {
      /* ignore */
    }
  }
  return screen === 'landing' ? <Landing onEnter={enter} /> : <Game />
}
