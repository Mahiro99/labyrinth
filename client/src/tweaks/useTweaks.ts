// useTweaks.ts
// Single source of truth for tweak values. Persists to localStorage under a
// fixed key so every slider works and survives refresh. On mount, any saved
// values are merged over the supplied defaults.
//
// `storeKey` namespaces the localStorage entry. It MATTERS here because this is
// a router-less SPA — landing + game both render at the same pathname, so two
// useTweaks consumers would otherwise share (and merge over) one blob. Pass a
// distinct key (e.g. 'corridor') to keep an unrelated panel's values isolated.
// Omit it for the legacy path-keyed behaviour (the game relies on that).

import { useState, useCallback } from 'react'

const pathStore = () => '__tweaks_' + (typeof location !== 'undefined' ? location.pathname : 'app')

export function useTweaks<T extends object>(
  defaults: T,
  storeKey?: string,
): [T, (keyOrEdits: keyof T | Partial<T>, val?: unknown) => void] {
  const store = storeKey ? '__tweaks_' + storeKey : pathStore()
  const [values, setValues] = useState<T>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(store) || 'null')
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
      try { localStorage.setItem(store, JSON.stringify(next)) } catch (e) { /* ignore */ }
      return next
    })
  }, [store])
  return [values, setTweak]
}
