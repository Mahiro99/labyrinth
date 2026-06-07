// useCountdown.ts — ticks down to midnight (when the daily maze resets).
import { useState, useEffect } from 'react';

export function useCountdown() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const mid = new Date(now); mid.setHours(24, 0, 0, 0);
      let s = Math.floor((mid.getTime() - now.getTime()) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      setT(`${h}:${m}:${ss}`);
    };
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
