// useGame.ts — the Labyrinth game runtime. Owns the GameState ref, builds the
// daily maze, wires keyboard + tweaks, and runs the rAF render loop (facing
// tween, sway, head-bob, camera tween, lighting recompute, canvas dpr sizing,
// first-person + minimap draws, throttled HUD). The React shell reads only the
// returned canvas refs and presentational state.

import { useState, useRef, useEffect } from 'react'
import { makeMaze, computeLight, canStand } from '../engine'
import { drawFirstPerson, drawMinimap } from '../render'
import { useTweaks } from '../tweaks'
import { TWEAK_DEFAULTS, DAILY_SEED, MAZE_CELLS, KEY_DIR } from './defaults'
import { useKeyboard } from './useKeyboard'
import { useTouch } from './useTouch'
import { useMediaQuery } from '../lib/useMediaQuery'
import type { GameState, Tweaks } from '../types'

export function useGame() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const twRef = useRef(t); twRef.current = t;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniRef = useRef<HTMLCanvasElement | null>(null);
  const gsRef = useRef<GameState | null>(null);
  const movedRef = useRef(false);

  const [hud, setHud] = useState({ steps: 0, charted: 0, reached: false });
  const [hint, setHint] = useState(true);
  // touch (coarse-pointer) drives swipe-appropriate control hints, not the input
  // wiring itself — swipe listeners are always attached and simply never fire on a
  // mouse-only device.
  const touch = useMediaQuery('(pointer: coarse)');

  // the small always-on light: a tile or so in each open direction (v13)
  function reveal(gs: GameState, now: number) {
    const tw = twRef.current;
    gs.light = computeLight(gs.maze, gs.px, gs.py, tw.torchRadius);
    gs.effR = tw.torchRadius;
    gs.lastR = tw.torchRadius;
    for (let i = 0; i < gs.light.length; i++) {
      if (gs.light[i] !== Infinity && !gs.seen[i]) { gs.seen[i] = 1; gs.revealTime[i] = now; }
    }
  }

  function step(gs: GameState, dx: number, dy: number, now: number, setFace: boolean) {
    const tw = twRef.current;
    const tx = gs.px + dx, ty = gs.py + dy;
    if (!canStand(gs.maze, tx, ty)) return false;
    gs.trail.push({ x: gs.px, y: gs.py });
    if (gs.trail.length > 60) gs.trail.shift();
    gs.px = tx; gs.py = ty; gs.steps++;
    gs.tracked[ty * gs.maze.GW + tx] = 1;
    if (setFace !== false) gs.faceTarget = Math.atan2(dy, dx);
    reveal(gs, now);
    if (tx === gs.maze.exit.x && ty === gs.maze.exit.y) gs.exitReached = true;
    if (!movedRef.current) { movedRef.current = true; setHint(false); }
    return true;
  }

  // resolve a key into a turn or a forward/back move (first-person controls)
  function applyKey(gs: GameState, key: string, now: number) {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') { gs.faceTarget -= Math.PI / 2; return true; }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') { gs.faceTarget += Math.PI / 2; return true; }
    const card = Math.round(gs.faceTarget / (Math.PI / 2)) * (Math.PI / 2);
    let dx = Math.round(Math.cos(card)), dy = Math.round(Math.sin(card));
    if (key === 'ArrowDown' || key === 's' || key === 'S') { dx = -dx; dy = -dy; }
    return step(gs, dx, dy, now, false);
  }

  // build the maze once (fixed daily size)
  useEffect(() => {
    const cells = MAZE_CELLS;
    const maze = makeMaze(cells, cells, DAILY_SEED);
    let totalFloor = 0;
    for (let i = 0; i < maze.tiles.length; i++) if (maze.tiles[i] === 0) totalFloor++;
    const gs: GameState = {
      maze, totalFloor,
      px: maze.start.x, py: maze.start.y,
      camx: maze.start.x, camy: maze.start.y,
      seen: new Uint8Array(maze.GW * maze.GH),
      tracked: new Uint8Array(maze.GW * maze.GH),
      revealTime: new Float32Array(maze.GW * maze.GH),
      light: new Float32Array(maze.GW * maze.GH).fill(Infinity),
      trail: [], steps: 0, exitReached: false,
      faceA: 0, faceTarget: 0, effR: twRef.current.torchRadius,
      lastMove: 0, lastR: -1, tileSize: 32, cssW: 800, cssH: 600,
      // motion state (head-bob + turn sway), driven by the loop
      bobPhase: 0, bobAmp: 0, bobUnit: 0, swayRoll: 0,
    };
    gs.tracked[maze.start.y * maze.GW + maze.start.x] = 1;
    // face down the longest open corridor from spawn — a better first frame than a flat wall
    {
      const open = (x: number, y: number) => canStand(maze, x, y);
      const run = (dx: number, dy: number) => { let n = 0; while (open(gs.px + dx * (n + 1), gs.py + dy * (n + 1)) && n < 8) n++; return n; };
      let best: [number, number] = [1, 0], bl = -1;
      for (const d of [[1, 0], [0, 1], [-1, 0], [0, -1]] as [number, number][]) { const r = run(d[0], d[1]); if (r > bl) { bl = r; best = d; } }
      gs.faceA = gs.faceTarget = Math.atan2(best[1], best[0]);
    }
    gsRef.current = gs;
    reveal(gs, performance.now());
    movedRef.current = false;
    setHint(true);
  }, []);

  // one input resolver, shared by keyboard + touch: the immediate first step on a
  // fresh press is fired here (130ms throttle); held-key repeat lives in the loop.
  const onPress = (key: string) => {
    const gs = gsRef.current;
    if (gs) { const now = performance.now(); if (now - gs.lastMove > 130) { if (applyKey(gs, key, now)) gs.lastMove = now; } }
  };
  const keysRef = useKeyboard(onPress);
  // swipe on the canvas -> the same synthetic arrow keys (relative turn/move model)
  useTouch(canvasRef, onPress);

  // main loop
  useEffect(() => {
    let raf: number, lastHud = 0;
    const loop = () => {
      const now = performance.now();
      const gs = gsRef.current;
      const tw = twRef.current;
      if (gs) {
        // held-key movement
        let heldKey: string | null = null;
        for (const k of keysRef.current) { if (k in KEY_DIR) { heldKey = k; break; } }
        if (heldKey && now - gs.lastMove > 140) { if (applyKey(gs, heldKey, now)) gs.lastMove = now; }

        // facing tween (shortest angular path) for first-person
        let da = gs.faceTarget - gs.faceA;
        while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        gs.faceA += da * 0.22;
        // turn sway: lean into the unresolved part of a turn (self-decays as faceA catches up)
        const swayTarget = Math.max(-1, Math.min(1, da * 1.6)) * (tw.sway ? tw.swayAmt : 0);
        gs.swayRoll += (swayTarget - gs.swayRoll) * 0.25;

        // lighting: recompute the radial torch only when the radius changes
        if (gs.lastR !== tw.torchRadius) reveal(gs, now);

        // camera tween
        gs.camx += (gs.px - gs.camx) * tw.tweenSpeed;
        gs.camy += (gs.py - gs.camy) * tw.tweenSpeed;

        // head-bob: phase advances with how fast the camera is still travelling,
        // amplitude eases in while moving and settles to 0 on arrival
        const moveAmt = Math.hypot(gs.px - gs.camx, gs.py - gs.camy);
        gs.bobPhase += moveAmt * 7.5;
        gs.bobAmp += ((moveAmt > 0.015 ? 1 : 0) - gs.bobAmp) * 0.12;
        gs.bobUnit = Math.sin(gs.bobPhase) * gs.bobAmp * (tw.headBob ? tw.bobAmt : 0);

        // size canvas + draw the first-person view
        const cv = canvasRef.current;
        if (cv) {
          const dpr = Math.min(1.4, window.devicePixelRatio || 1);
          const cw = cv.clientWidth, ch = cv.clientHeight;
          if (cv.width !== cw * dpr || cv.height !== ch * dpr) { cv.width = cw * dpr; cv.height = ch * dpr; }
          gs.cssW = cw; gs.cssH = ch;
          gs.tileSize = Math.max(20, Math.min(42, Math.round(Math.min(cw, ch) / 19)));
          const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawFirstPerson(ctx, gs, tw, now);
        }

        // minimap
        const mc = miniRef.current;
        if (mc && tw.showMinimap) {
          const dpr = Math.min(1.4, window.devicePixelRatio || 1);
          const mw = mc.clientWidth, mh = mc.clientHeight;
          if (mc.width !== mw * dpr || mc.height !== mh * dpr) { mc.width = mw * dpr; mc.height = mh * dpr; }
          const mctx = mc.getContext('2d') as CanvasRenderingContext2D; mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawMinimap(mctx, gs, mw, mh, tw.markerColor);
        }

        // HUD state (throttled)
        if (now - lastHud > 200) {
          lastHud = now;
          let charted = 0;
          for (let i = 0; i < gs.tracked.length; i++) if (gs.tracked[i]) charted++;
          setHud({
            steps: gs.steps,
            charted: Math.round(charted / gs.totalFloor * 100),
            reached: gs.exitReached,
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { canvasRef, miniRef, hud, hint, touch, t, setTweak };
}
