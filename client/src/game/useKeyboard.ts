// useKeyboard.ts — owns the held-keys Set and the keydown/keyup wiring for the
// game. Calls onPress(key) once on the initial keydown (preventing default for
// movement keys) so the caller can fire an immediate first step; the rAF loop
// reads the returned ref to drive held-key repeat movement.

import { useRef, useEffect } from 'react'
import { KEY_DIR } from './defaults'

export function useKeyboard(onPress: (key: string) => void): React.RefObject<Set<string>> {
  const keysRef = useRef(new Set<string>());
  const pressRef = useRef(onPress); pressRef.current = onPress;

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.key in KEY_DIR) {
        e.preventDefault();
        if (!keysRef.current.has(e.key)) {
          keysRef.current.add(e.key);
          // immediate first step
          pressRef.current(e.key);
        }
      }
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key); };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  return keysRef;
}
