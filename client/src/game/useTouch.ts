// useTouch.ts — swipe input for the maze, the touch analog of useKeyboard.
//
// It deliberately funnels through the SAME onPress(key) callback the keyboard
// uses, emitting the existing synthetic key strings ('ArrowUp'/'ArrowDown'/
// 'ArrowLeft'/'ArrowRight'). That keeps applyKey() in useGame the single source
// of truth for the control model and inherits its 130ms throttle for free.
//
// The control model is RELATIVE first-person, so swipes map to the player's
// frame, not absolute compass directions:
//   swipe up    -> step forward along facing   (ArrowUp)
//   swipe down  -> step back                    (ArrowDown)
//   swipe left  -> turn right 90deg, no move    (ArrowRight)
//   swipe right -> turn left 90deg, no move     (ArrowLeft)
// Turns use the "drag the world" feel: dragging the view left swings you right.
//
// Each completed swipe is ONE discrete action (matching one keypress), since
// turns/steps are discrete on the grid. Listeners are attached imperatively with
// { passive: false } on the target element so preventDefault() actually stops the
// page from scrolling / pull-to-refresh — JSX onTouch* props register passive.

import { useEffect, useRef } from 'react'

const SWIPE_MIN = 28 // px the finger must travel before it counts as a swipe (ignores taps)

export function useTouch(
  targetRef: React.RefObject<HTMLElement | null>,
  onPress: (key: string) => void,
): void {
  const pressRef = useRef(onPress); pressRef.current = onPress;

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    let sx = 0, sy = 0, tracking = false;

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) { tracking = false; return; } // ignore multi-touch (pinch)
      tracking = true;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    };
    // Suppress scroll/pull-to-refresh/url-bar jump while a single-finger drag is live.
    const move = (e: TouchEvent) => { if (tracking && e.cancelable) e.preventDefault(); };
    const end = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < SWIPE_MIN) return;               // a tap, not a swipe
      const key = ax > ay
        ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')               // dominant axis = horizontal -> turn
        : (dy > 0 ? 'ArrowDown' : 'ArrowUp');                 // vertical -> move (screen up = forward)
      pressRef.current(key);
    };

    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('touchcancel', end, { passive: false });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [targetRef]);
}
