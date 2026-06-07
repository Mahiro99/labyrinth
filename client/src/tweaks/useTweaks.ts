// useTweaks.ts
// Single source of truth for tweak values. Persists to localStorage under a
// fixed key so every slider works and survives refresh. On mount, any saved
// values are merged over the supplied defaults.

import { useState, useCallback } from 'react'

const __TWK_STORE = '__tweaks_' + (typeof location !== 'undefined' ? location.pathname : 'app')

export function useTweaks<T extends object>(
  defaults: T,
): [T, (keyOrEdits: keyof T | Partial<T>, val?: unknown) => void] {
  const [values, setValues] = useState<T>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(__TWK_STORE) || 'null')
      if (saved && typeof saved === 'object') return { ...defaults, ...saved }
    } catch (e) { /* ignore */ }
    return defaults
  })
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = useCallback((keyOrEdits: keyof T | Partial<T>, val?: unknown) => {
    const edits: Partial<T> = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : ({ [keyOrEdits]: val } as Partial<T>)
    setValues((prev) => {
      const next = { ...prev, ...edits }
      try { localStorage.setItem(__TWK_STORE, JSON.stringify(next)) } catch (e) { /* ignore */ }
      return next
    })
  }, [])
  return [values, setTweak]
}
