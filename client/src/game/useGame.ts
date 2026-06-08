// useGame.ts — the Labyrinth game runtime. Owns the GameState ref, builds the
// daily maze, wires keyboard + tweaks, and runs the rAF render loop (facing
// tween, sway, head-bob, camera tween, lighting recompute, canvas dpr sizing,
// first-person + minimap draws, throttled HUD). The React shell reads only the
// returned canvas refs and presentational state.

import { useState, useRef, useEffect } from 'react'
import { makeMaze, computeLight, canStand } from '../engine'
import { drawFirstPerson, drawMinimap, onLightning } from '../render'
import { THUNDERS, type SoundName } from '../audio'
import { useTweaks } from '../tweaks'
import { TWEAK_DEFAULTS, DAILY_SEED, MAZE_CELLS, KEY_DIR } from './defaults'
import { useKeyboard } from './useKeyboard'
import { useTouch } from './useTouch'
import { useMediaQuery } from '../lib/useMediaQuery'
import type { GameState, Tweaks } from '../types'
import type { AudioEngine } from '../audio'

// the four factory machines — played one at a time, in sequence with random gaps, through
// the engine's "distant" bus (see updateAudio's factory scheduler)
const MACHINES: SoundName[] = ['machine1', 'machine2', 'machine3', 'machine4'];

// per-frame audio scheduler state (kept in a ref so it survives renders). `lastTileMove`
// is bumped in step() on every actual tile step; `nextFactory` is the wall-clock time the
// next machine should start; `lastGrowl`/`lastMachineIdx` gate re-triggers.
interface AudioSched { lastTileMove: number; lastGrowl: number; nextFactory: number; lastMachineIdx: number }

// One ambient bed on or off, idempotently — ramps to the live tweak gain when on,
// fades out when off. The engine change-gates the per-frame setLoopGain, so a steady
// bed costs ~nothing here.
function ensureBed(ae: AudioEngine, name: SoundName, on: boolean, gain: number) {
  if (on) { ae.startLoop(name, 1.5); ae.setLoopGain(name, gain, 0.4); }
  else ae.stopLoop(name, 1.0);
}

// Per-frame audio: weather-driven beds, the exertion-tracking breath loop, master
// mute/volume. Pulled out of the rAF loop so the loop body stays readable and ensureBed
// isn't re-allocated each frame. Runs once per frame (only when an engine exists).
function updateAudio(ae: AudioEngine, tw: Tweaks, exertionRef: { current: number }, sched: AudioSched, now: number) {
  // beds: rain also needs Storm weather (so it doesn't drone in clear skies — that was
  // the always-on bug); wind follows the visual Wind toggle; factory is opt-in.
  ensureBed(ae, 'rain', tw.soundRain && tw.weather === 'Storm', tw.rainVolume);
  ensureBed(ae, 'wind', tw.soundWind && tw.wind, tw.windVolume);

  // factory: distant machines, ONE AT A TIME with random gaps (not a layered drone). Each
  // machine is a one-shot on the engine's "distant" bus (low-pass + reverb → it reads as
  // far-off). When the current one is due to have finished, wait a random beat, then fire a
  // different machine. factoryDistance feeds the distant bus so it's tweakable.
  if (tw.soundFactory) {
    ae.setDistance(tw.factoryDistance);
    if (now >= sched.nextFactory) {
      let idx = sched.lastMachineIdx;
      while (idx === sched.lastMachineIdx && MACHINES.length > 1) idx = Math.floor(Math.random() * MACHINES.length);
      sched.lastMachineIdx = idx;
      const name = MACHINES[idx];
      ae.playOneShot(name, { gain: tw.factoryVolume, out: 'distant' });
      const dur = ae.durationOf(name); // 0 until the buffer decodes
      if (dur <= 0) sched.nextFactory = now + 500; // not loaded yet → retry shortly
      else sched.nextFactory = now + (dur + 1.5 + Math.random() * 5) * 1000; // clip + 1.5–6.5s gap
    }
  } else if (sched.nextFactory !== 0) {
    ae.stopDistant();      // fade out the current machine instead of letting it ring out
    sched.nextFactory = 0; // re-arm so a machine fires promptly when toggled back on
  }

  // growl: stand still too long (no TILE move past the idle threshold) and a monster
  // growls — bypassing the duck bus so it's loud, while ducking everything else for its
  // duration (growlDuck), then the mix returns to normal. Re-arms each threshold, so the
  // longer you loiter the more it growls.
  if (tw.soundGrowl) {
    const idleMs = tw.growlIdleSec * 1000;
    if (now - sched.lastTileMove > idleMs && now - sched.lastGrowl > idleMs) {
      ae.playOneShot('growl', { gain: tw.growlVolume, out: 'master', duck: tw.growlDuck });
      sched.lastGrowl = now;
    }
  }

  // leaves: an ambient rustle bed that swells in and out on its own. A slow LFO (two
  // out-of-phase sines so the rise/fall isn't a metronome) breathes the gain between a
  // quiet floor and the leaves volume; `leavesAmt` (intensity) sets how deep the swell
  // goes — at 0 it's a steady rustle, at 1 it fades nearly silent between gusts.
  if (tw.soundLeaves) {
    ae.startLoop('leaves', 2.0);
    const lfo = 0.5 + 0.5 * (0.6 * Math.sin(now / 4300) + 0.4 * Math.sin(now / 9100)); // 0..1, ~7s period
    const depth = tw.leavesAmt;                 // 0 = constant, 1 = full swell to the floor
    const swell = (1 - depth) + depth * lfo;    // scales the ceiling down by up to `depth`
    ae.setLoopGain('leaves', tw.leavesVolume * swell, 0.5);
  } else {
    ae.stopLoop('leaves', 1.5);
  }

  // breath: gain + rate track "exertion" (step cadence), scaled by breathAmt. Louder in
  // a storm so it carries over the rain bed. Unlike the beds above its target changes
  // every frame — that continuous modulation is the point (setLoopGain ramps each frame).
  // Exertion decays when no step is taken (idle → breathing calms) and is bumped up per
  // step in step() — so the breath rises as you move and settles when you stop.
  exertionRef.current = Math.max(0, exertionRef.current - 0.010); // recover when idle
  const ex = exertionRef.current;
  if (tw.soundBreathing) {
    ae.startLoop('breath', 1.5);
    const stormLift = tw.weather === 'Storm' ? 0.25 : 0; // sit above the rain
    // floor 0.5 (always audibly breathing) → +1.0 at full exertion; ×breathAmt (default
    // 0.5) shapes how much stepping swells it past the floor, then ×breathVolume scales
    // the whole signal. Defaults land idle breath at ~0.25 and a hard sprint at ~0.75.
    ae.setLoopGain('breath', (0.5 + stormLift + 1.0 * ex) * tw.breathAmt * tw.breathVolume, 0.25);
    ae.setLoopRate('breath', 1 + 0.5 * ex, 0.3); // faster steps → faster breathing
  } else {
    ae.stopLoop('breath', 1.0);
  }

  ae.setMuted(tw.audioMuted); ae.setVolume(tw.audioVolume);
}

export function useGame(audio?: AudioEngine) {
  // engine in a ref so the rAF loop + step() always see the latest without re-binding
  const audioRef = useRef<AudioEngine | undefined>(audio); audioRef.current = audio;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const twRef = useRef(t); twRef.current = t;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniRef = useRef<HTMLCanvasElement | null>(null);
  const gsRef = useRef<GameState | null>(null);
  const movedRef = useRef(false);
  // "exertion" 0..1 — rises with step cadence (fast stepping), decays when you pause;
  // drives the breath loop's gain AND its playback rate (faster steps → faster breath).
  const exertionRef = useRef(0);
  const lastStepRef = useRef(0); // timestamp of the previous step, for cadence
  // per-frame audio scheduler (factory sequencing + idle-growl timing). lastTileMove is
  // seeded on maze build so the player gets a grace period before the first growl.
  const schedRef = useRef<AudioSched>({ lastTileMove: 0, lastGrowl: 0, nextFactory: 0, lastMachineIdx: -1 });

  const [hud, setHud] = useState({ steps: 0, charted: 0, reached: false, facing: 'S' });
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
    const ae = audioRef.current;
    const tx = gs.px + dx, ty = gs.py + dy;
    if (!canStand(gs.maze, tx, ty)) return false; // walked into a wall — no move, no sound
    // trail = recent tiles, kept for the fading walked-path render (see drawMinimap)
    gs.trail.push({ x: gs.px, y: gs.py });
    if (gs.trail.length > 60) gs.trail.shift();
    gs.px = tx; gs.py = ty; gs.steps++;
    gs.tracked[ty * gs.maze.GW + tx] = 1; // mark charted (drives the % CHARTED stat)
    if (setFace !== false) gs.faceTarget = Math.atan2(dy, dx);
    reveal(gs, now);
    // footstep: a wet splash in the storm, the dry step otherwise; scaled by tweak volume
    if (tw.soundFootsteps) ae?.playOneShot(tw.weather === 'Storm' ? 'waterstep' : 'footstep', { gain: tw.footstepVolume * 2 });
    // exertion from step CADENCE: a quick gap between steps = hurrying = harder breath.
    // gap <= ~260ms (held-move rate is 140ms) counts as fast; slow/first steps add little.
    const gap = lastStepRef.current ? now - lastStepRef.current : 9999;
    lastStepRef.current = now;
    schedRef.current.lastTileMove = now; // reset the idle-growl timer on every real tile step
    const fast = Math.max(0, Math.min(1, (520 - gap) / 420)); // 1 at <=100ms gap, 0 by >=520ms
    exertionRef.current = Math.min(1, exertionRef.current + 0.10 + 0.22 * fast);
    const wasReached = gs.exitReached;
    if (tx === gs.maze.exit.x && ty === gs.maze.exit.y) gs.exitReached = true;
    if (!wasReached && gs.exitReached) ae?.playOneShot('thunder4', { gain: tw.exitVolume }); // exit sting (edge-detected)
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
    schedRef.current.lastTileMove = performance.now(); // grace period before the first growl
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

  // thunder: subscribe to the renderer's lightning state machine. Each new bolt
  // fires a random thunder clap a beat later (so the boom lags the flash, as in
  // life), with volume scaled by the bolt's brightness (mag).
  useEffect(() => {
    const pending = new Set<ReturnType<typeof setTimeout>>();
    onLightning((mag) => {
      const ae = audioRef.current;
      const tw = twRef.current;
      if (!ae || !tw.soundThunder) return;
      const name = THUNDERS[Math.floor(Math.random() * THUNDERS.length)];
      const delay = 250 + (1 - mag) * 700; // closer (brighter) bolt = shorter delay
      const id = setTimeout(() => {
        pending.delete(id);
        ae.playOneShot(name, { gain: tw.thunderVolume * (0.6 + mag * 0.4) });
      }, delay);
      pending.add(id);
    });
    // stop new claps AND drop any already queued for after we leave the screen
    return () => { onLightning(null); for (const id of pending) clearTimeout(id); };
  }, []);

  // main loop
  useEffect(() => {
    let raf: number, lastHud = 0;
    const loop = () => {
      const now = performance.now();
      const gs = gsRef.current;
      const tw = twRef.current;
      if (gs) {
        // weather-driven beds + the exertion-tracking breath loop + master mute/volume,
        // pulled into updateAudio so this loop body stays readable (see audio.md).
        const ae = audioRef.current;
        if (ae) updateAudio(ae, tw, exertionRef, schedRef.current, now);

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
          // facing octant (E, SE, S, …) — same math the canvas compass used; now the
          // React pill owns this readout so the on-canvas controls line can go away.
          const ci = ((Math.round(gs.faceA / (Math.PI / 4)) % 8) + 8) % 8;
          setHud({
            steps: gs.steps,
            charted: Math.round(charted / gs.totalFloor * 100),
            reached: gs.exitReached,
            facing: ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][ci],
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); audioRef.current?.stopAll(); };
  }, []);

  return { canvasRef, miniRef, hud, hint, touch, t, setTweak };
}
