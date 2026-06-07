// useMediaQuery.ts — subscribe to a CSS media query and re-render on change.
// Used for the mobile layout breakpoint and the coarse-pointer (touch) flag.
// Re-rendering on change also makes the CSS-laid-out landing self-heal on rotate
// the way the game canvas already does in its rAF loop.

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof matchMedia !== 'undefined' ? matchMedia(query).matches : false,
  )
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mql = matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}
