// render3d.ts — the shipped look: a Wolfenstein-style raycast down the corridor
// you're facing. Layer-1 atmosphere (AO, edge rim, flicker, head-bob, turn-sway,
// grain, world-anchored haze) is preserved; Layer-2 adds TEXTURED walls and a
// per-world light model, both driven by getWorld(). Walls are drawn as
// 1px-wide texture slices (the wall-x texcoord comes off the existing DDA), then
// shaded toward the world's fog by distance.
//
// drawFirstPerson is the single orchestrator: it computes the shared frame state
// once into a RenderCtx (rc), then calls the small per-layer helpers in the exact
// draw order, preserving the camera save/restore nesting. The decomposition is
// behaviour-preserving — every numeric constant, formula, and ctx call is intact.

import type { GameState, Tweaks } from '../types'
import { hexToRgb, mix, rgba } from '../lib/color'
import { theme } from '../theme'
import { getWorld } from '../worlds'
import { bugs, clouds, driftLeaves, grainTile, groundLife, pebbles, rain, splashes, spires, spores, stars } from './particles'
import { QUANTITY, qty } from './quantity'

// coarse pointer => touch device, so the in-canvas control hint should say "swipe"
// rather than naming arrow/WASD keys the player doesn't have. Read once at module
// load (pointer type doesn't change at runtime).
const COARSE_POINTER = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

// cheap deterministic hash -> 0..1 (for vine placement)
function _h2(a: number, b: number): number { let t = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; t = Math.imul(t ^ (t >>> 13), 1274126177); t ^= t >>> 16; return ((t >>> 0) % 100003) / 100003; }
// a small pointed leaf (teardrop), tilted — for the Ivy vine style
function _leaf(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tilt: number, fill: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.95, -r * 0.15, 0, r); ctx.quadraticCurveTo(-r * 0.95, -r * 0.15, 0, -r); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// lightning state machine (module scope): one flash = a sharp double-spike that
// decays over ~0.4s, with a random next-strike timer. Persists across frames.
let _stormState: { next?: number | null; start?: number | null; az?: number; dur?: number; mag?: number } | null = null
// audio seam: the audio layer registers a listener to play thunder when a new bolt
// is born. Kept as a one-way subscription so render3d has no dependency on audio.
// mag 0..1 = brightness/closeness, az = bearing (for volume / future panning).
let _onLightning: ((mag: number, az: number) => void) | null = null
export function onLightning(fn: ((mag: number, az: number) => void) | null) { _onLightning = fn }
// reusable downscale buffer for the bloom pass
let _bloomCCache: HTMLCanvasElement | null = null

// World is referenced via ReturnType so RenderCtx stays in lockstep with getWorld.
type World = ReturnType<typeof getWorld>

// All shared per-frame state, computed once at the top of drawFirstPerson and
// passed to every helper. Nothing here mutates between helpers except the per-
// column arrays, which drawWalls populates and later helpers read.
interface RenderCtx {
  gs: GameState
  tw: Tweaks
  now: number
  // grid
  GW: number
  GH: number
  tiles: Uint8Array
  // world + light model
  world: World
  daylight: boolean
  W: number
  H: number
  R: number
  fall: number
  fog: number[]
  M: number
  // torch flicker + breathe
  flick: number
  breathe: number
  // weather
  weather: string
  overcast: boolean
  raining: boolean
  storming: boolean
  wetness: number
  cloud: number
  // weather-driven open-sky gradient (top → horizon). Overrides world.ceil for the
  // sky strip only — walls/floor/fog keep world.fog. Clear day = muted blue paling
  // to a warm-grey pollution haze band; overcast/storm/night fall back to world.ceil.
  skyTop: number[]
  skyMid: number[] | null   // optional middle gradient stop (Storm bruise belly); null = 2-stop
  skyHorizon: number[]
  // lightning
  flash: number
  flashAz: number
  fcx: number
  fcy: number
  // film grade
  gradeAmt: number
  gShadow: number[]
  gTint: number[]
  gTintA: number
  gSat: number
  // camera shake
  bobY: number
  roll: number
  // camera basis
  eyeX: number
  eyeY: number
  ang: number
  FOV: number
  half: number
  // sun/moon direction
  sunAz: number
  sunEl: number
  sdx: number
  sdy: number
  // raycast cadence
  step: number
  aoS: number
  sliceW: number
  // per-column records (populated by drawWalls, read by later layers)
  cN: number[]
  cX: number[]
  cDepth: number[]
  cTop: number[]
  cBot: number[]
  cU: number[]
  // light value at a given depth (matches the wall light model)
  lightAt: (d: number) => number
  // wind sway at a given pendulum fraction + per-element phase
  windAt: (f: number, ph: number) => number
}

// ============================================================== FIRST PERSON (raycast)
export function drawFirstPerson(ctx: CanvasRenderingContext2D, gs: GameState, tw: Tweaks, now: number): void {
  const { maze } = gs; const { GW, GH, tiles } = maze;
  const world = getWorld(tw.world, tw.mrTime, tw.stainAmount, tw.crackAmount);
  const daylight = world.lightModel === 'daylight';
  const W = gs.cssW, H = gs.cssH, R = gs.effR || tw.torchRadius, fall = tw.falloff;
  const fog = world.fog;

  // --- torch flicker + slow breathe (one scalar each) — flicker off in daylight ---
  let flick = 1;
  if (tw.flicker && !daylight) {
    const n = 0.5 * Math.sin(now * 0.013) + 0.3 * Math.sin(now * 0.029 + 1.3) + 0.2 * Math.sin(now * 0.052 + 2.1);
    flick = 1 + tw.flickerAmt * 0.16 * n;
  }
  const breathe = 1 + 0.05 * Math.sin(now * 0.0011);

  // ---- WEATHER: Clear / Overcast / Rain / Storm. Drives clouds (dim sun+stars),
  // wetness (floor sheen), rain (screen-space batched lines), and lightning. ----
  const weather: string = (world.id === 'mazerunner' && tw.weather) ? tw.weather : 'Clear';
  const overcast = weather !== 'Clear';
  const raining = weather === 'Rain' || weather === 'Storm';
  const storming = weather === 'Storm';
  const wetness = raining ? (storming ? 1 : 0.72) : 0;
  const cloud = overcast ? (raining ? 0.9 : 0.55) : 0;

  // ---- weather-driven OPEN-SKY palette (sky strip only). On a Clear day we paint
  // a believable daytime sky: blue-dominant up top, paling to a warm grey-tan haze
  // band at the horizon — "clear, but with some pollution" — instead of the world's
  // flat grey-green ceiling. Overcast/Storm/Night keep world.ceil (the grey wash and
  // night model own those looks). Touches ONLY the sky gradient + spire base; walls,
  // floor, fog and creatures still read from world.fog as before.
  const clearDay = daylight && weather === 'Clear';
  const stormDay = daylight && storming;
  // skyBlue (0..1) lerps the zenith from a pale/hazy blue toward a deep clear blue;
  // the horizon stays a warm-grey pollution band but cools slightly as blueness rises.
  const skyBlue = tw.skyBlue == null ? 0.5 : tw.skyBlue;
  // Storm sky is a BRUISED gradient, not a flat grey wash: an oppressive near-black
  // slate-indigo zenith → a heavy storm grey-blue belly → a sickly luminous green-
  // yellow band glowing at the horizon (the classic severe-weather / tornado tell).
  // Three stops (skyTop, skyMid, skyHorizon) painted in drawCeilingFloor; the belly
  // stop is pushed low so the green-yellow reads as a thin horizon band, not a wash.
  const skyTop = clearDay
    ? mix([176, 192, 210], [96, 142, 206], skyBlue)   // pale-blue → deep-blue zenith
    : stormDay ? [26, 30, 40]                          // oppressive near-black slate-indigo
    : world.ceil[0];
  const skyMid = stormDay ? [54, 62, 74] : null;       // heavy storm grey-blue belly (Storm only)
  const skyHorizon = clearDay
    ? mix([200, 198, 186], [182, 192, 196], skyBlue)  // warm haze → slightly cooler haze
    : stormDay ? [138, 140, 92]                        // sickly luminous green-yellow tell
    : world.ceil[1];

  // lightning: a state machine on module scope. One flash = a sharp double-spike that
  // decays over ~0.4s. It boosts wall ambient (corridor flashes into view) and
  // paints a white overlay; thunder would lag it (audio off for now).
  let flash = 0, flashAz = 0;
  if (storming && tw.lightning) {
    let S = _stormState;
    if (!S || S.next == null) S = _stormState = { next: now + 1200 };
    if (now >= S.next!) {
      // gap between strikes: thunderGap seconds (tweakable) ± 40% jitter. Spacing the
      // flash here also spaces the boom, since thunder is fired off this same event.
      const gapMs = (tw.thunderGap ?? 5) * 1000;
      S.start = now; S.az = (Math.random() * 2 - 1) * Math.PI; S.dur = 300 + Math.random() * 280;
      S.next = now + gapMs * (0.6 + Math.random() * 0.8); S.mag = 0.75 + Math.random() * 0.25;
      _onLightning?.(S.mag, S.az);
    }
    if (S.start != null) {
      const e = (now - S.start) / S.dur!;
      if (e >= 0 && e <= 1) {
        const f1 = Math.exp(-e * 6.5), f2 = e > 0.16 ? Math.exp(-(e - 0.16) * 9) * 0.85 : 0;
        flash = Math.min(1, (f1 + f2)) * S.mag!; flashAz = S.az!;
      }
    }
  }
  const fcx = Math.cos(flashAz), fcy = Math.sin(flashAz);

  // ---- FILM GRADE targets (also encodes DAWN/DUSK via sun height). A washed,
  // slightly desaturated, black-lifted look. Applied as cheap blend passes at the
  // very end — no per-pixel work. gShadow = milky shadow floor, gTint = color cast.
  const gradeAmt = (world.id === 'mazerunner' && tw.grade) ? (tw.gradeAmt == null ? 0.6 : tw.gradeAmt) : 0;
  let gShadow = [0, 0, 0], gTint = [0, 0, 0], gTintA = 0, gSat = 0;
  if (gradeAmt > 0) {
    if (!daylight) { gShadow = [24, 30, 44]; gTint = [46, 60, 88]; gTintA = 0.12; gSat = 0.34; }       // cool night blue
    else if (overcast) { gShadow = [64, 72, 70]; gTint = [110, 122, 114]; gTintA = 0.15; gSat = 0.48; } // flat grey-green
    else {
      const warm = Math.max(0, 1 - (tw.sunHeight == null ? 0.32 : tw.sunHeight) / 0.42); // low sun → amber dawn/dusk
      // high-sun end is now a neutral-cool cast (not grey-green) with a lighter
      // desaturate, so the Clear-day blue sky survives instead of being washed grey;
      // the low-sun (warm) end is unchanged — dawn/dusk still go amber.
      gShadow = mix([60, 66, 74], [56, 44, 32], warm);
      gTint = mix([120, 130, 142], [158, 120, 76], warm);
      gTintA = 0.08 + 0.07 * warm; gSat = 0.16 + 0.10 * warm;
    }
  }

  // --- camera shake transform: head-bob (vertical) + turn sway (roll) ---
  const bobY = (gs.bobUnit || 0) * H * 0.020;
  const roll = (gs.swayRoll || 0) * 0.06;
  const M = 70; // overscan so the rotated/shifted frame never shows an edge

  const eyeX = gs.camx + 0.5, eyeY = gs.camy + 0.5, ang = gs.faceA;
  // aspect-aware horizontal FOV: widen it a touch on tall/narrow (portrait) screens
  // so the first-person view isn't a claustrophobic "mail slot" — but only gently,
  // since a strong widen reads as crowded/wide-angle and crams extra skyline in.
  // Clamped to a small boost; stays 1 (the tuned ~69deg) at the reference aspect and
  // on wider screens. Bump the cap (1.1) for more portrait width, drop to 1 for off.
  const fovBoost = Math.min(1.1, Math.max(1, 1.25 / (W / H)));
  const FOV = (Math.PI / 2.6) * fovBoost, half = Math.tan(FOV / 2);
  // sun/moon world direction (shared by the sky and the directional wall lighting)
  const sunAz = (tw.sunAz == null ? 30 : tw.sunAz) * 0.0174533;
  const sunEl = tw.sunHeight == null ? 0.32 : tw.sunHeight;
  const sdx = Math.cos(sunAz), sdy = Math.sin(sunAz);
  const step = 2;
  const aoS = tw.ao ? tw.aoStrength : 0;
  const sliceW = step + 0.6;
  // per-column records for edge detection (rim light + corner AO) + vines
  const cN: number[] = [], cX: number[] = [], cDepth: number[] = [], cTop: number[] = [], cBot: number[] = [], cU: number[] = [];

  // light value at a given depth (matches the wall light model)
  const lightAt = (d: number) => daylight
    ? world.ambient! + (1 - world.ambient!) * Math.pow(Math.max(0, 1 - d / world.viewDist), 0.7)
    : Math.pow(Math.max(0, 1 - d / (R * 1.15)), fall) * flick;

  // --- WIND: cheap sine sway. Tips move more than anchors (pendulum). One gust
  // envelope shared, plus a per-element phase. No new draw calls — basically free.
  const windAmt = tw.wind ? tw.windAmt : 0;
  const gust = 0.5 + 0.5 * Math.sin(now * 0.00035) + 0.18 * Math.sin(now * 0.0013 + 1.7);
  const windAt = (f: number, ph: number) => windAmt * 24 * Math.pow(f < 0 ? 0 : f, 1.4) * gust * Math.sin(now * 0.0017 + ph);

  const rc: RenderCtx = {
    gs, tw, now, GW, GH, tiles,
    world, daylight, W, H, R, fall, fog, M,
    flick, breathe,
    weather, overcast, raining, storming, wetness, cloud, skyTop, skyMid, skyHorizon,
    flash, flashAz, fcx, fcy,
    gradeAmt, gShadow, gTint, gTintA, gSat,
    bobY, roll,
    eyeX, eyeY, ang, FOV, half,
    sunAz, sunEl, sdx, sdy,
    step, aoS, sliceW,
    cN, cX, cDepth, cTop, cBot, cU,
    lightAt, windAt,
  };

  // --- background fog fills any gap exposed by the bob/sway transform ---
  ctx.fillStyle = world.fogCss; ctx.fillRect(0, 0, W, H);

  // ====== inside the camera-shake transform: world-anchored layers ======
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.translate(-W / 2, -H / 2 + bobY);

  drawCeilingFloor(ctx, rc);
  drawSky(ctx, rc);
  drawWalls(ctx, rc);
  drawFloorGrates(ctx, rc);
  drawPebbles(ctx, rc);
  drawGroundLife(ctx, rc);
  drawBugs(ctx, rc);
  drawDriftLeaves(ctx, rc);
  drawVines(ctx, rc);

  ctx.restore(); // end camera shake

  // ====== screen-space / post layers ======
  drawHeldGlow(ctx, rc);
  drawHaze(ctx, rc);          // note: haze does its OWN save/translate/rotate/restore
  drawRain(ctx, rc);
  drawVignette(ctx, rc);
  drawLightningFlash(ctx, rc);
  drawBloom(ctx, rc);
  drawFilmGrade(ctx, rc);
  drawFilmGrain(ctx, rc);
  drawCompass(ctx, rc);
}

// ceiling (or open sky) + floor (or water): the gradient backdrop the walls paint over.
function drawCeilingFloor(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, W, H, M, wetness, now, skyTop, skyMid, skyHorizon } = rc;
  // ceiling (or open sky) + floor (or water). Open sky uses the weather-driven
  // palette (Clear day = blue→haze; Storm = bruised slate→green-yellow via skyMid);
  // equals world.ceil for night.
  const cg = ctx.createLinearGradient(0, -M, 0, H / 2);
  cg.addColorStop(0, rgba(skyTop, 1));
  if (skyMid) cg.addColorStop(0.72, rgba(skyMid, 1));   // bruise belly stop low → green-yellow stays a thin horizon band
  cg.addColorStop(1, rgba(skyHorizon, 1));
  ctx.fillStyle = cg; ctx.fillRect(-M, -M, W + 2 * M, H / 2 + M);
  const fgr = ctx.createLinearGradient(0, H / 2, 0, H + M);
  fgr.addColorStop(0, world.floorCss[0]); fgr.addColorStop(1, world.floorCss[1]);
  ctx.fillStyle = fgr; ctx.fillRect(-M, H / 2, W + 2 * M, H / 2 + M);
  // wet slab (rain) OR flooded floor (cistern): a subtle darken + animated sheen.
  if (world.water || wetness > 0) {
    const wa = world.water ? 1 : wetness;
    if (!world.water) { ctx.fillStyle = rgba([8, 12, 16], 0.30 * wetness); ctx.fillRect(-M, H / 2, W + 2 * M, H / 2 + M); }
    for (let i = 0; i < 5; i++) {
      const yy = H / 2 + ((i + 1) / 6) * (H / 2);
      const ph = Math.sin(now * 0.0012 + i * 1.3);
      const tint = world.water ? world.haze : [150, 168, 190];
      ctx.fillStyle = rgba(tint, (0.04 + 0.045 * (0.5 + 0.5 * ph)) * wa);
      ctx.fillRect(-M, yy + ph * 3, W + 2 * M, 1.4 + i * 0.7);
    }
  }
}

// ---- SKY: sun (day) / moon + twinkling stars (night), overcast wash, distant
// spires skyline, and drifting clouds. Drawn BEFORE the walls, so the walls paint
// over it and it only shows through the open-top strip. ----
function drawSky(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, daylight, W, H, M, cloud, raining, storming, flash, ang, half, sunAz, sunEl, now, skyTop, skyMid, skyHorizon } = rc;
  if (!(world.id === 'mazerunner' && tw.sky)) return;
  const bearing = (az: number) => { let b = az - ang; while (b > Math.PI) b -= 6.2832; while (b < -Math.PI) b += 6.2832; return b; };
  const skyX = (b: number) => W / 2 + (Math.tan(b) / half) * (W / 2);
  const sunY = H * (0.03 + sunEl * 0.34);
  const clear = 1 - cloud;            // how much the sun/moon/stars show through cloud
  // cloud wash: dim the open-top strip. The daylight Storm sky is already a bruised
  // gradient (skyMid set, painted in drawCeilingFloor), so we skip the flat overlay
  // there and only wash at night, where there's no gradient to preserve.
  if (cloud > 0 && !(daylight && skyMid)) {
    const grey = daylight ? (raining ? [88, 96, 100] : [120, 128, 134]) : [26, 32, 40];
    ctx.fillStyle = rgba(grey, cloud * (daylight ? (raining ? 0.62 : 0.5) : 0.6)); ctx.fillRect(-M, -M, W + 2 * M, H / 2 + M);
  }
  // ---- LIGHTNING LIGHTS THE SKY: a strike briefly floods the open strip with a
  // cool blue-white, backlighting the storm clouds drawn just below. Additive so it
  // reads as a flash of light, not a paint layer; decays with the strike's `flash`.
  if (storming && flash > 0.02) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lf = Math.min(1, flash);
    const lg = ctx.createLinearGradient(0, -M, 0, H * 0.5);
    lg.addColorStop(0, rgba([150, 170, 210], 0.42 * lf));
    lg.addColorStop(0.6, rgba([120, 140, 185], 0.20 * lf));
    lg.addColorStop(1, rgba([120, 140, 185], 0));
    ctx.fillStyle = lg; ctx.fillRect(-M, -M, W + 2 * M, H / 2 + M);
    ctx.restore();
  }
  if (daylight) {
    const b = bearing(sunAz);
    if (Math.abs(b) < 0.72 && clear > 0.05) {
      const sx = skyX(b), sy = sunY;
      // gentle sky glow — soft, not a blown-out dome
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.3);
      g.addColorStop(0, `rgba(252,251,244,${0.26 * clear})`); g.addColorStop(0.35, `rgba(250,249,240,${0.09 * clear})`); g.addColorStop(1, 'rgba(250,249,240,0)');
      ctx.fillStyle = g; ctx.fillRect(-M, -M, W + 2 * M, H / 2 + M);
      // small soft halo + crisp disc — a glowing circle, not a fireball
      const hot = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.042);
      hot.addColorStop(0, `rgba(255,255,252,${0.5 * clear})`); hot.addColorStop(1, 'rgba(255,255,252,0)');
      ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(sx, sy, H * 0.042, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(253,252,247,${0.9 * clear})`;
      ctx.beginPath(); ctx.arc(sx, sy, H * 0.019, 0, 7); ctx.fill();
    }
  } else {
    const st = stars();
    const nStars = Math.min(st.length, Math.round(qty(tw.starDensity == null ? 0.24 : tw.starDensity, QUANTITY.stars) * clear));
    for (let i = 0; i < nStars; i++) {
      const s = st[i], b = bearing(s.az);
      if (Math.abs(b) > 0.72) continue;
      const sx = skyX(b), sy = -M * 0.4 + s.el * (H * 0.46);
      const tw2 = 0.55 + 0.45 * Math.sin(now * 0.003 + s.ph);
      ctx.fillStyle = rgba([232, 238, 250], s.mag * tw2 * 0.95);
      ctx.beginPath(); ctx.arc(sx, sy, 0.5 + s.sz * 0.9, 0, 7); ctx.fill();
    }
    // moon — clean full disc: soft halo, shaded body, faint maria
    const b = bearing(sunAz);
    if (Math.abs(b) < 0.72 && clear > 0.05) {
      const sx = skyX(b), sy = sunY, mr = H * 0.032;
      const halo = ctx.createRadialGradient(sx, sy, mr * 0.7, sx, sy, mr * 4.5);
      halo.addColorStop(0, `rgba(202,216,240,${0.26 * clear})`); halo.addColorStop(1, 'rgba(202,216,240,0)');
      ctx.fillStyle = halo; ctx.fillRect(-M, -M, W + 2 * M, H / 2 + M);
      const body = ctx.createRadialGradient(sx - mr * 0.32, sy - mr * 0.32, mr * 0.2, sx, sy, mr);
      body.addColorStop(0, `rgba(232,239,250,${0.98 * clear})`); body.addColorStop(1, `rgba(198,208,228,${0.95 * clear})`);
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(sx, sy, mr, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(178,190,210,${0.4 * clear})`;
      ctx.beginPath(); ctx.arc(sx - mr * 0.26, sy - mr * 0.14, mr * 0.27, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + mr * 0.22, sy + mr * 0.24, mr * 0.17, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + mr * 0.08, sy - mr * 0.32, mr * 0.11, 0, 7); ctx.fill();
    }
  }

  // ---- DISTANT LANDMARK: a far tower glimpsed over the wall-tops, at a fixed
  // world bearing. Hazy silhouette — gives the maze a center and you a sense of
  // scale/orientation. Drawn in the sky strip so walls in front occlude it. ----
  // ---- DISTANT SPIRES: a skyline of far towers over the wall-tops, each at its
  // own bearing + distance (depth). Far ones smaller, hazier, cooler. Count and
  // visibility tunable. Drawn far→near; walls in front still occlude them. ----
  if (tw.landmark) {
    const sp = spires();
    const nSp = Math.min(sp.length, Math.max(0, Math.round(tw.spireCount == null ? 18 : tw.spireCount)));
    // sort the visible ones far→near so nearer spires overlap farther ones
    const vis = [];
    for (let i = 0; i < nSp; i++) { const s = sp[i]; let b = bearing(s.az); if (Math.abs(b) < 0.95) vis.push({ s, b }); }
    vis.sort((p, q) => q.s.dist - p.s.dist);
    for (const { s, b } of vis) {
      const lx = skyX(b);
      const near = 1 - s.dist;                       // 1 near, 0 far
      const vDist = world.viewDist || 17;            // fallback so horizon is never NaN
      const horizon = H * 0.5 - H * 0.5 * 0.92 / vDist;
      const baseY = horizon + H * 0.02;
      if (!Number.isFinite(baseY) || !Number.isFinite(lx)) continue;   // never let a bad value kill the frame
      const hMul = tw.spireHeight == null ? 1 : tw.spireHeight;
      const tall = H * (0.2 + 0.26 * near) * s.h * hMul;   // tall enough that the top clears the wall
      const topY = baseY - tall;
      // width keyed to the tower's OWN height (not viewport width) so it holds a
      // believable ~7:1 tower aspect on any screen instead of going needle-thin in
      // portrait, where viewport-width-scaled bars collapse. (tuned to match the
      // prior desktop width at the reference aspect.)
      const wBot = tall * 0.13 * s.w, wTop = wBot * 0.34;
      const lean = s.lean * tall;
      // solid hazy silhouette — color blended toward the sky/fog so it still reads
      // atmospheric, but drawn OPAQUE so it always occludes the sun/moon behind it.
      const skyBase = daylight ? mix(skyHorizon, skyTop, 0.5) : world.fog;
      const towerCol = daylight ? [98, 106, 116] : [40, 48, 62];
      const dens = (daylight ? 0.5 : 0.52) + 0.26 * near;
      const tint = mix(skyBase, towerCol, dens);
      ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = rgba(tint, 1);
      const OL = !daylight;                                  // night: light edge outline
      if (OL) { ctx.strokeStyle = rgba(mix(tint, [140, 158, 188], 0.6), 0.5); ctx.lineWidth = Math.max(0.6, 0.9 * (0.6 + near)); ctx.lineJoin = 'round'; }
      const cx = lx, txp = lx + lean;
      // helper: tapered vertical body between two y's at given half-widths
      const body = (y0: number, y1: number, w0: number, w1: number, dx: number) => { ctx.beginPath(); ctx.moveTo(cx - w0 + dx * 0, y0); ctx.lineTo(cx - w1 + dx, y1); ctx.lineTo(cx + w1 + dx, y1); ctx.lineTo(cx + w0, y0); ctx.closePath(); ctx.fill(); if (OL) ctx.stroke(); };
      const slab = (y: number, h: number, w: number, dx: number) => { ctx.fillRect(cx - w + dx, y - h, w * 2, h); if (OL) ctx.strokeRect(cx - w + dx, y - h, w * 2, h); };
      const spike = (y: number, h: number, w: number, dx: number) => { ctx.beginPath(); ctx.moveTo(cx - w + dx, y); ctx.lineTo(cx + dx, y - h); ctx.lineTo(cx + w + dx, y); ctx.closePath(); ctx.fill(); if (OL) ctx.stroke(); };
      const mast = (y: number, h: number, dx: number) => { ctx.fillRect(cx - Math.max(1, wTop * 0.18) + dx, y - h, Math.max(1.5, wTop * 0.36), h); if (OL) ctx.strokeRect(cx - Math.max(1, wTop * 0.18) + dx, y - h, Math.max(1.5, wTop * 0.36), h); };
      if (s.shape === 'stepped') {
        // 3 setback tiers, each narrower, capped with a spire
        body(baseY, baseY - tall * 0.45, wBot, wBot * 0.74, lean * 0.45);
        slab(baseY - tall * 0.45, tall * 0.04, wBot * 0.82, lean * 0.5);
        body(baseY - tall * 0.49, baseY - tall * 0.78, wBot * 0.66, wBot * 0.44, lean * 0.8);
        slab(baseY - tall * 0.78, tall * 0.035, wBot * 0.5, lean * 0.9);
        body(baseY - tall * 0.815, topY + tall * 0.06, wBot * 0.4, wBot * 0.22, lean);
        spike(topY + tall * 0.06, tall * 0.06, wBot * 0.22, lean);
        mast(topY + tall * 0.06, tall * 0.08, lean);
      } else if (s.shape === 'tapered') {
        // smooth taper with a mid mechanical band + crown + mast
        body(baseY, baseY - tall * 0.62, wBot, wBot * 0.52, lean * 0.5);
        slab(baseY - tall * 0.4, tall * 0.03, wBot * 0.78, lean * 0.35);   // mid band
        body(baseY - tall * 0.62, topY + tall * 0.08, wBot * 0.52, wBot * 0.3, lean);
        slab(topY + tall * 0.08, tall * 0.05, wBot * 0.42, lean);          // crown cap
        mast(topY + tall * 0.08, tall * 0.1, lean);
      } else if (s.shape === 'crown') {
        // body that flares wider near the top (inverted), with antenna cluster
        body(baseY, baseY - tall * 0.66, wBot * 0.78, wBot * 0.62, lean * 0.5);
        body(baseY - tall * 0.66, topY, wBot * 0.62, wBot * 0.92, lean);   // flare out
        slab(topY, tall * 0.04, wBot * 1.0, lean);
        mast(topY, tall * 0.12, lean - wBot * 0.4); mast(topY, tall * 0.16, lean); mast(topY, tall * 0.1, lean + wBot * 0.4);
      } else if (s.shape === 'finned') {
        // central shaft with vertical buttress fins stepping up + spire
        body(baseY, topY + tall * 0.1, wBot * 0.5, wBot * 0.28, lean);
        for (const sgn of [-1, 1]) { ctx.fillRect(cx + sgn * wBot * 0.5 - (sgn < 0 ? wBot * 0.22 : 0) + lean * 0.4, baseY - tall * 0.5, wBot * 0.22, tall * 0.5); ctx.fillRect(cx + sgn * wBot * 0.32 - (sgn < 0 ? wBot * 0.18 : 0) + lean * 0.7, baseY - tall * 0.74, wBot * 0.18, tall * 0.74); }
        spike(topY + tall * 0.1, tall * 0.1, wBot * 0.28, lean); mast(topY + tall * 0.1, tall * 0.06, lean);
      } else if (s.shape === 'twin') {
        // two linked shafts with a connecting sky-bridge and twin masts
        const gap = wBot * 0.95;
        for (const off of [-gap, gap]) { ctx.beginPath(); ctx.moveTo(cx + off - wTop * 1.1, baseY); ctx.lineTo(cx + off - wTop * 0.8 + lean, topY + tall * 0.08); ctx.lineTo(cx + off + wTop * 0.8 + lean, topY + tall * 0.08); ctx.lineTo(cx + off + wTop * 1.1, baseY); ctx.closePath(); ctx.fill(); mast(topY + tall * 0.08, tall * 0.09, off + lean); }
        ctx.fillRect(cx - gap + lean * 0.6, baseY - tall * 0.62, gap * 2, tall * 0.035);  // sky bridge
      } else if (s.shape === 'cooling') {
        // hyperboloid waisted tower with a rim cap
        ctx.beginPath();
        const wWaist = wBot * 0.6, wTopC = wBot * 0.84;
        ctx.moveTo(cx - wBot, baseY);
        ctx.quadraticCurveTo(cx - wWaist, baseY - tall * 0.55, cx - wTopC + lean, topY);
        ctx.lineTo(cx + wTopC + lean, topY);
        ctx.quadraticCurveTo(cx + wWaist, baseY - tall * 0.55, cx + wBot, baseY);
        ctx.closePath(); ctx.fill();
        slab(topY, tall * 0.03, wTopC * 1.06, lean);
      } else if (s.shape === 'mast') {
        // lattice mast: tapered shaft + stacked crossbars + tall antenna
        body(baseY, topY + tall * 0.18, wBot * 0.34, wBot * 0.14, lean);
        for (let r = 0; r < 7; r++) { const ry = baseY - tall * (0.12 + r * 0.12); ctx.fillRect(cx - wBot * (0.34 - r * 0.03) + lean * (r / 7), ry, wBot * (0.68 - r * 0.06), Math.max(1, tall * 0.01)); }
        mast(topY + tall * 0.18, tall * 0.2, lean);
      } else { // 'capsule' — rounded futuristic tower with banding + beacon mast
        body(baseY, topY + tall * 0.12, wBot * 0.62, wBot * 0.5, lean);
        ctx.beginPath(); ctx.ellipse(txp, topY + tall * 0.12, wBot * 0.5, tall * 0.12, 0, Math.PI, 0); ctx.fill(); // dome top
        for (let r = 1; r <= 3; r++) { ctx.fillRect(cx - wBot * 0.62 + lean * (r / 6), baseY - tall * (0.2 * r), wBot * 1.24, Math.max(1, tall * 0.012)); }
        mast(topY + tall * 0.06, tall * 0.1, lean);
      }
      // ---- night detailing: static lit windows scattered up the tower (no beacon).
      // Night only — daylight towers are left as clean silhouettes. ----
      if (!daylight) {
        const rows = 9, cols = 3;
        const ww = Math.max(0.9, wBot * 0.17), wh = Math.max(0.9, tall * 0.013);
        for (let wr = 0; wr < rows; wr++) for (let wc = 0; wc < cols; wc++) {
          if (_h2(s.seed * 31 + wr * 7, wc * 13 + 5) > 0.5) continue;        // ~half lit, stable
          const fy = 0.1 + 0.78 * (wr / (rows - 1));
          const wy = baseY - tall * fy;
          const halfW = (wBot * (1 - 0.55 * fy));
          const wx = cx + lean * fy + (wc - (cols - 1) / 2) * (halfW * 1.05 / cols);
          ctx.globalAlpha = 0.5 * (0.6 + 0.4 * near);                        // steady, dimmer
          ctx.fillStyle = 'rgba(255,206,120,1)';
          ctx.fillRect(wx, wy, ww, wh);
        }
      }
      ctx.restore();
    }
  }

  // ---- DRIFTING CLOUDS: soft blobs easing across the open-top strip. During a
  // STORM the layer is forced ON and turned turbulent — dense, dark, fast and low-
  // hanging — so the sky churns overhead instead of sitting empty, and the lightning
  // flash backlights the blobs. Outside storms it honours the cloud tweaks as before.
  if (tw.clouds || storming) {
    const cl = clouds();
    // storm cloud cover comes from its OWN slider (tw.stormClouds), independent of the
    // normal "Cloud amount" — so the storm sky fills regardless of the clear-day setting.
    const stormCl = tw.stormClouds == null ? 0.9 : tw.stormClouds;
    const cAmt = storming ? stormCl : (tw.cloudAmount == null ? 0.28 : tw.cloudAmount);
    const cSpd = (tw.cloudSpeed == null ? 1 : tw.cloudSpeed) * (storming ? 2.6 : 1);   // wind-driven
    // denser storm cover also reads as heavier/darker cloud
    const cShade = storming ? (0.55 + 0.4 * stormCl)
      : (tw.cloudShade == null ? 0 : tw.cloudShade);   // 0 light → 1 heavy/dark
    const nDraw = Math.min(cl.length, qty(cAmt, QUANTITY.clouds));
    // base colour from the tweak (hex), darkened by shade; night is always darker.
    // storm clouds skip the user hex and use a cold bruised grey.
    const baseRGB = storming ? (daylight ? [70, 78, 88] : [30, 36, 46])
      : ((tw.cloudColor ? hexToRgb(tw.cloudColor) : null) || (daylight ? [188, 195, 199] : [50, 58, 72]));
    const col = daylight ? mix(baseRGB, [30, 34, 40], cShade * 0.7) : mix(baseRGB, [10, 12, 16], 0.4 + cShade * 0.4);
    // lightning backlight: brighten the blobs toward a cool white while a strike decays
    const lit = storming && flash > 0.02 ? Math.min(1, flash) : 0;
    const cloudCol = lit ? mix(col, [180, 196, 224], 0.6 * lit) : col;
    for (let i = 0; i < nDraw; i++) {
      const c2 = cl[i];
      const az = (c2.az + now * 0.00006 * c2.spd * cSpd) % 6.2832;
      const b = bearing(az);
      if (Math.abs(b) > 0.95) continue;
      // storm clouds hang lower and spread wider across the open strip
      const elR = storming ? 0.5 : 0.3;
      const cx = skyX(b), cy = -M * 0.1 + c2.el * (H * elR);   // sit in the open sky gap
      const cw = H * (storming ? 0.26 : 0.2) * c2.sz, ch = H * (storming ? 0.09 : 0.06) * c2.sz;
      const a = (daylight ? 0.5 : 0.3) * (storming ? 1 : (1 - cloud * 0.4)) * (1 + cShade * 0.5);
      for (let p = 0; p < 5; p++) {
        const px = cx + Math.sin(c2.puff + p * 1.7) * cw * 0.55, py = cy + Math.cos(c2.puff + p) * ch * 0.5;
        const rad = cw * (0.5 + 0.18 * Math.sin(c2.puff + p * 2.3));
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, rgba(cloudCol, a)); g.addColorStop(0.7, rgba(cloudCol, a * 0.5)); g.addColorStop(1, rgba(cloudCol, 0));
        ctx.fillStyle = g; ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      }
    }
  }
}

// ---- WALLS: the DDA column loop. Casts one ray per `step` columns, draws the
// textured slice shaded toward fog by distance, applies AO, then a second pass for
// the edge-rim/corner-AO. Populates the per-column arrays the later layers read. ----
function drawWalls(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { gs, tw, world, daylight, W, H, R, fall, flick, flash, fcx, fcy, eyeX, eyeY, ang, half,
    sunEl, sdx, sdy, step, aoS, sliceW, GW, GH, tiles, cN, cX, cDepth, cTop, cBot, cU } = rc;
  const maze = gs.maze;
  // nearest-neighbour for the 1px texture slices — ~4x faster than smoothed and
  // actually crisper at this scale (was the single biggest render cost).
  const smooth = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;

  for (let col = 0; col < W; col += step) {
    const camX = (col / W) * 2 - 1;
    const rdx = Math.cos(ang) - Math.sin(ang) * camX * half;
    const rdy = Math.sin(ang) + Math.cos(ang) * camX * half;
    const len = Math.hypot(rdx, rdy); const dx = rdx / len, dy = rdy / len;
    // DDA
    let mapX = Math.floor(eyeX), mapY = Math.floor(eyeY);
    const dDX = Math.abs(1 / (dx || 1e-9)), dDY = Math.abs(1 / (dy || 1e-9));
    let sDX, sDY, stX, stY;
    if (dx < 0) { stX = -1; sDX = (eyeX - mapX) * dDX; } else { stX = 1; sDX = (mapX + 1 - eyeX) * dDX; }
    if (dy < 0) { stY = -1; sDY = (eyeY - mapY) * dDY; } else { stY = 1; sDY = (mapY + 1 - eyeY) * dDY; }
    let side = 0, hit = false, guard = 0;
    while (!hit && guard++ < 200) {
      if (sDX < sDY) { sDX += dDX; mapX += stX; side = 0; } else { sDY += dDY; mapY += stY; side = 1; }
      if (mapX < 0 || mapY < 0 || mapX >= GW || mapY >= GH) { hit = true; }
      else if (tiles[mapY * GW + mapX] === 1) hit = true;
    }
    let perp = side === 0 ? (sDX - dDX) : (sDY - dDY);
    if (perp < 0.02) perp = 0.02;
    const lineH = (H * 0.92) / perp;
    const top = (H - lineH) / 2, bot = (H + lineH) / 2;

    // wall-x texcoord: fractional hit position along the wall face
    let u = side === 0 ? (eyeY + perp * dy) : (eyeX + perp * dx);
    u -= Math.floor(u);
    if (side === 0 && dx > 0) u = 1 - u;
    if (side === 1 && dy < 0) u = 1 - u;

    // light model: torch = distance falloff from the eye (Guarantee #25 keeps the
    // far dark); daylight = high ambient with gentle aerial fade toward the sky.
    let L;
    if (daylight) {
      const near = Math.max(0, 1 - perp / world.viewDist);
      L = world.ambient! + (1 - world.ambient!) * Math.pow(near, 0.7);
    } else {
      L = Math.pow(Math.max(0, 1 - perp / (R * 1.15)), fall) * flick;
    }
    if (L > 1.1) L = 1.1; if (L < 0) L = 0;
    let Ls = side === 1 ? L * world.sideShade : L;
    // directional light: walls facing the sun/moon brighten, walls facing away dim.
    // normal is an axis vector (the DDA step that caused the hit). One dot product.
    if (tw.sunLight) {
      const ndotl = side === 0 ? (-stX) * sdx : (-stY) * sdy;
      const contrast = (tw.lightContrast == null ? 0.5 : tw.lightContrast) * (daylight ? (0.3 + 0.5 * sunEl) : 0.22);
      Ls *= (1 + contrast * ndotl); if (Ls < 0) Ls = 0;
    }
    // lightning flash floods the corridor — walls facing the bolt brighten most
    if (flash > 0) {
      const fn = side === 0 ? (-stX) * fcx : (-stY) * fcy;
      Ls += flash * (0.55 + 0.45 * (fn > 0 ? fn : 0));
      if (Ls > 1.35) Ls = 1.35;
    }

    const isExit = mapX === maze.exit.x && mapY === maze.exit.y && gs.exitReached;
    if (isExit) {
      ctx.fillStyle = rgba(mix('#2dd4bf', '#ffffff', 0.3 + 0.4 * Math.min(1, Ls)), 1);
      ctx.fillRect(col, top, sliceW, lineH);
    } else {
      // textured slice, then shade toward fog by (1 - light)
      const t = world.pick(mapX, mapY, side);
      const sx = Math.min(t.width - 1, Math.max(0, (u * t.width) | 0));
      ctx.drawImage(t, sx, 0, 1, t.height, col, top, sliceW, lineH);
      const a = 1 - Ls;
      if (a > 0.003) { ctx.globalAlpha = a > 1 ? 1 : a; ctx.fillStyle = world.fogCss; ctx.fillRect(col, top, sliceW, lineH); ctx.globalAlpha = 1; }
    }

    // ambient occlusion: contact shadow where the wall meets floor / ceiling
    if (aoS > 0) {
      const hb = Math.max(3, lineH * 0.12);
      ctx.fillStyle = rgba([0, 0, 0], aoS * 0.22); ctx.fillRect(col, bot - hb, sliceW, hb);
      ctx.fillStyle = rgba([0, 0, 0], aoS * 0.28); ctx.fillRect(col, bot - hb * 0.5, sliceW, hb * 0.5);
      const ht = Math.max(2, lineH * 0.08);
      ctx.fillStyle = rgba([0, 0, 0], aoS * 0.20); ctx.fillRect(col, top, sliceW, ht);
    }

    cN.push(mapY * GW + mapX); cX.push(col); cDepth.push(perp); cTop.push(top); cBot.push(bot); cU.push(u);
  }
  ctx.imageSmoothingEnabled = smooth;

  // edge rim light + corner crease AO at depth/cell/side discontinuities
  if (tw.rim || aoS > 0) {
    const rimC = mix(daylight ? [210, 216, 208] : world.glow, [255, 255, 255], 0.4);
    for (let j = 1; j < cN.length; j++) {
      if (cN[j] === cN[j - 1]) continue;          // same wall cell — no visible seam
      const nearer = cDepth[j] < cDepth[j - 1] ? j : j - 1;
      const ex = cX[j];
      const near = daylight ? 0.7 : Math.max(0, 1 - cDepth[nearer] / (R * 1.4)) * flick;
      if (near <= 0) continue;
      const t0 = cTop[nearer], h0 = cBot[nearer] - t0;
      if (aoS > 0) { ctx.fillStyle = rgba([0, 0, 0], aoS * 0.5 * near); ctx.fillRect(ex - 1, t0, 2, h0); }
      if (tw.rim) {
        const rx = (nearer === j) ? ex + 0.5 : ex - 2;
        ctx.fillStyle = rgba(rimC, tw.rimStrength * near);
        ctx.fillRect(rx, t0, 1.5, h0);
      }
    }
  }
}

// ---- FLOOR GRATES: recessed rectangular drain grilles set into occasional
// slabs. Each is a perspective-projected pit with a dark void floor (you sense
// something below), inner walls, and metal grille bars across the opening. ----
function drawFloorGrates(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, W, H, M, eyeX, eyeY, ang, half, step, cDepth, lightAt } = rc;
  if (world.id === 'mazerunner' && tw.floorDetail) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const proj = (wx: number, wy: number) => {
      const dxw = wx - eyeX, dyw = wy - eyeY;
      const depth = dxw * ca + dyw * sa;
      if (depth <= 0.12) return null;
      const lateral = -dxw * sa + dyw * ca;
      const sx = W / 2 + (lateral / (depth * half)) * (W / 2);
      const sy = H / 2 + 0.5 * (H * 0.92) / depth;
      return { sx, sy, depth };
    };
    const occluded = (sx: number, depth: number) => { const ci = Math.max(0, Math.min(cDepth.length - 1, Math.round(sx / step))); return cDepth[ci] !== undefined && depth > cDepth[ci] + 0.02; };
    const gx0 = Math.floor(eyeX), gy0 = Math.floor(eyeY), RNG = 7;

    // collect visible grates, draw far→near
    const grates = [];
    for (let gx = gx0 - RNG; gx <= gx0 + RNG; gx++) for (let gy = gy0 - RNG; gy <= gy0 + RNG; gy++) {
      if (_h2(gx * 23 + 7, gy * 29 + 3) > (tw.grateAmt == null ? 0.16 : tw.grateAmt)) continue;   // tunable frequency
      const cxw = gx + 0.5, cyw = gy + 0.5;
      const cp = proj(cxw, cyw); if (!cp || cp.sy > H + M || occluded(cp.sx, cp.depth)) continue;
      grates.push({ gx, gy, cxw, cyw, depth: cp.depth });
    }
    grates.sort((a, b) => b.depth - a.depth);

    for (const G of grates) {
      const { gx, gy, cxw, cyw } = G;
      // grate footprint: a rectangle on the slab, long axis along the corridor
      const along = _h2(gx, gy) < 0.5;
      const hw = along ? 0.15 : 0.26, hh = along ? 0.26 : 0.15;     // half-extents in world
      const c00 = proj(cxw - hw, cyw - hh), c10 = proj(cxw + hw, cyw - hh);
      const c11 = proj(cxw + hw, cyw + hh), c01 = proj(cxw - hw, cyw + hh);
      if (!c00 || !c10 || !c11 || !c01) continue;
      const lf = lightAt(G.depth);
      // simple flush drain: a faint recess shadow + 3 thin grille bars + a faint frame.
      ctx.fillStyle = rgba([0, 0, 0], 0.18 * lf);
      ctx.beginPath(); ctx.moveTo(c00.sx, c00.sy); ctx.lineTo(c10.sx, c10.sy); ctx.lineTo(c11.sx, c11.sy); ctx.lineTo(c01.sx, c01.sy); ctx.closePath(); ctx.fill();
      // 3 grille bars across the SHORT axis
      ctx.lineCap = 'butt';
      const bw = Math.max(0.8, 1.3 / G.depth);
      for (let bI = 1; bI <= 3; bI++) {
        const t = bI / 4;
        const aPt = along ? proj(cxw - hw, cyw - hh + 2 * hh * t) : proj(cxw - hw + 2 * hw * t, cyw - hh);
        const bPt = along ? proj(cxw + hw, cyw - hh + 2 * hh * t) : proj(cxw - hw + 2 * hw * t, cyw + hh);
        if (!aPt || !bPt) continue;
        ctx.strokeStyle = rgba(mix(world.floor[0], [110, 116, 112], 0.4), 0.5 * lf);
        ctx.lineWidth = bw;
        ctx.beginPath(); ctx.moveTo(aPt.sx, aPt.sy); ctx.lineTo(bPt.sx, bPt.sy); ctx.stroke();
      }
      // faint frame edge
      ctx.strokeStyle = rgba(mix(world.floor[1], [0, 0, 0], 0.4), 0.4 * lf); ctx.lineWidth = Math.max(0.8, 1.4 / G.depth);
      ctx.beginPath(); ctx.moveTo(c00.sx, c00.sy); ctx.lineTo(c10.sx, c10.sy); ctx.lineTo(c11.sx, c11.sy); ctx.lineTo(c01.sx, c01.sy); ctx.closePath(); ctx.stroke();
    }
  }
}

// ---- GROUND PEBBLES: procedurally scattered on the floor plane, parallaxing
// correctly as you walk. World-anchored points tiled around the player. ----
function drawPebbles(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, W, H, M, eyeX, eyeY, ang, half, step, cDepth, lightAt } = rc;
  if (world.id === 'mazerunner' && tw.pebbles) {
    const pb = pebbles(); const P = 4, ca = Math.cos(ang), sa = Math.sin(ang);
    const rnd = tw.pebbleRandom == null ? 1 : tw.pebbleRandom;
    const szMul = tw.pebbleSize == null ? 1 : tw.pebbleSize;
    const nDraw = Math.min(pb.length, qty(tw.pebbleDensity == null ? 0.26 : tw.pebbleDensity, QUANTITY.pebbles));
    for (let i = 0; i < nDraw; i++) {
      const p = pb[i];
      const ux = p.gx + (p.ux - p.gx) * rnd, uy = p.gy + (p.uy - p.gy) * rnd;
      const wx = ux * P + P * Math.round((eyeX - ux * P) / P);
      const wy = uy * P + P * Math.round((eyeY - uy * P) / P);
      const dxw = wx - eyeX, dyw = wy - eyeY;
      const depth = dxw * ca + dyw * sa; if (depth <= 0.18 || depth > world.viewDist) continue;
      const lateral = -dxw * sa + dyw * ca;
      const sx = W / 2 + (lateral / (depth * half)) * (W / 2);
      if (sx < -20 || sx > W + 20) continue;
      const sy = H / 2 + 0.5 * (H * 0.92) / depth;
      if (sy > H + M) continue;
      const ci = Math.max(0, Math.min(cDepth.length - 1, Math.round(sx / step)));
      if (cDepth[ci] !== undefined && depth > cDepth[ci] + 0.02) continue;   // behind a wall
      const lf = lightAt(depth);
      const rad = Math.max(0.6, p.sz * szMul * (2.4 / depth));
      ctx.fillStyle = rgba([0, 0, 0], 0.16 * lf);
      ctx.beginPath(); ctx.ellipse(sx, sy + rad * 0.45, rad * 1.25, rad * 0.5, 0, 0, 7); ctx.fill();
      const base = mix(world.fog, p.tone, lf);
      ctx.fillStyle = rgba(base, 0.96);
      ctx.beginPath(); ctx.ellipse(sx, sy, rad, rad * 0.76, p.rot, 0, 7); ctx.fill();
      ctx.fillStyle = rgba(mix(base, [255, 255, 248], 0.45), 0.5 * lf);
      ctx.beginPath(); ctx.ellipse(sx - rad * 0.28, sy - rad * 0.26, rad * 0.42, rad * 0.3, p.rot, 0, 7); ctx.fill();
    }
  }
}

// ---- GROUND LIFE: grass tufts + fallen leaves between the pebbles, color-matched
// to the vines. Same floor projection; grass sways with wind. ----
function drawGroundLife(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, W, H, M, eyeX, eyeY, ang, half, step, cDepth, lightAt, windAt } = rc;
  if (world.id === 'mazerunner' && tw.groundLife) {
    const gl = groundLife(); const P = 5, ca = Math.cos(ang), sa = Math.sin(ang);
    const nDraw = Math.min(gl.length, qty(tw.groundLifeAmt == null ? 0.28 : tw.groundLifeAmt, QUANTITY.groundLife));
    for (let i = 0; i < nDraw; i++) {
      const p = gl[i];
      const wx = p.ux * P + P * Math.round((eyeX - p.ux * P) / P);
      const wy = p.uy * P + P * Math.round((eyeY - p.uy * P) / P);
      const dxw = wx - eyeX, dyw = wy - eyeY;
      const depth = dxw * ca + dyw * sa; if (depth <= 0.2 || depth > world.viewDist) continue;
      const lateral = -dxw * sa + dyw * ca;
      const sx = W / 2 + (lateral / (depth * half)) * (W / 2);
      if (sx < -30 || sx > W + 30) continue;
      const sy = H / 2 + 0.5 * (H * 0.92) / depth;
      if (sy > H + M) continue;
      const ci = Math.max(0, Math.min(cDepth.length - 1, Math.round(sx / step)));
      if (cDepth[ci] !== undefined && depth > cDepth[ci] + 0.02) continue;
      const lf = lightAt(depth);
      const scale = (5.5 / depth) * p.sz;
      const ph = (wx * 0.7 + wy * 1.3);
      const lean = windAt(1, ph) * 0.12;                          // shared wind sway
      const green = mix(world.fog, p.hue < 0.5 ? [88, 116, 52] : [70, 102, 44], lf);
      if (p.kind === 'grass') {
        for (let b = 0; b < p.blades; b++) {
          const off = (b - p.blades / 2) * scale * 0.5;
          const h = scale * (2.4 + (b % 2) * 0.7);
          ctx.strokeStyle = rgba(green, 0.92); ctx.lineWidth = Math.max(0.5, scale * 0.32);
          ctx.beginPath(); ctx.moveTo(sx + off, sy);
          ctx.quadraticCurveTo(sx + off + lean * h * 0.5, sy - h * 0.6, sx + off + lean * h, sy - h); ctx.stroke();
        }
      } else if (p.kind === 'broadleaf') {
        // a few wide rounded leaves fanning up from a short central stem (dock/plantain)
        const n = 3 + (p.blades % 2);
        const stemH = scale * 2.0;
        ctx.strokeStyle = rgba(mix(green, [0, 0, 0], 0.2), 0.9); ctx.lineWidth = Math.max(0.6, scale * 0.3);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + lean * stemH, sy - stemH); ctx.stroke();
        ctx.fillStyle = rgba(green, 0.9);
        for (let b = 0; b < n; b++) {
          const a2 = (b - (n - 1) / 2) * 0.6 + lean;
          const lh = scale * (2.2 + (b % 2) * 0.6);
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(a2);
          ctx.beginPath(); ctx.ellipse(0, -lh * 0.5, scale * 0.7, lh * 0.5, 0, 0, 7); ctx.fill();
          ctx.restore();
        }
      } else if (p.kind === 'clover') {
        // three round lobes on short stems (trefoil)
        const stemH = scale * 1.8;
        for (let b = 0; b < 3; b++) {
          const a2 = (b - 1) * 0.5 + lean;
          const tx = sx + Math.sin(a2) * stemH, ty = sy - Math.cos(a2) * stemH;
          ctx.strokeStyle = rgba(mix(green, [0, 0, 0], 0.15), 0.85); ctx.lineWidth = Math.max(0.5, scale * 0.22);
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.fillStyle = rgba(green, 0.92);
          ctx.beginPath(); ctx.arc(tx, ty, scale * 0.55, 0, 7); ctx.fill();
        }
      } else if (p.kind === 'fern') {
        // a feathery frond: curved spine + paired side leaflets
        const h = scale * 3.2;
        const tipx = sx + lean * h, tipy = sy - h;
        ctx.strokeStyle = rgba(green, 0.9); ctx.lineWidth = Math.max(0.5, scale * 0.26);
        ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + lean * h * 0.5, sy - h * 0.6, tipx, tipy); ctx.stroke();
        ctx.lineWidth = Math.max(0.4, scale * 0.16);
        for (let s = 1; s <= 4; s++) {
          const f = s / 5;
          const mx = sx + (tipx - sx) * f, my = sy + (tipy - sy) * f;
          const ll = scale * 0.9 * (1 - f * 0.5);
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - ll, my - ll * 0.5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + ll, my - ll * 0.5); ctx.stroke();
        }
      } else if (p.kind === 'flower') {
        // thin stems each capped with a tiny bloom (hue picks the petal colour)
        const bloom = p.hue < 0.34 ? [220, 210, 120] : (p.hue < 0.67 ? [212, 150, 178] : [228, 228, 232]);
        for (let b = 0; b < 2; b++) {
          const off = (b - 0.5) * scale * 0.7;
          const h = scale * (2.6 + b * 0.5);
          const tx = sx + off + lean * h, ty = sy - h;
          ctx.strokeStyle = rgba(green, 0.85); ctx.lineWidth = Math.max(0.5, scale * 0.22);
          ctx.beginPath(); ctx.moveTo(sx + off, sy);
          ctx.quadraticCurveTo(sx + off + lean * h * 0.5, sy - h * 0.6, tx, ty); ctx.stroke();
          ctx.fillStyle = rgba(mix(world.fog, bloom, lf), 0.92);
          ctx.beginPath(); ctx.arc(tx, ty, scale * 0.45, 0, 7); ctx.fill();
        }
      } else {
        const lc = mix(world.fog, p.hue < 0.4 ? [120, 110, 56] : (p.hue < 0.7 ? [96, 116, 54] : [134, 96, 50]), lf);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot); ctx.fillStyle = rgba(lc, 0.9);
        ctx.beginPath(); ctx.ellipse(0, 0, scale * 1.5, scale * 0.8, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = rgba(mix(lc, [0, 0, 0], 0.4), 0.5); ctx.lineWidth = Math.max(0.4, scale * 0.18);
        ctx.beginPath(); ctx.moveTo(-scale * 1.4, 0); ctx.lineTo(scale * 1.4, 0); ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ---- GROUND BUGS: small ants/beetles that WANDER across the floor. World-anchored
// like ground life, but each bug's position meanders along a smooth, time-driven
// path (two summed sinusoids per axis → an organic, non-obvious-loop crawl), and the
// body is rotated to face its travel direction. Same floor projection + occlusion. ----
function drawBugs(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, W, H, M, eyeX, eyeY, ang, half, step, cDepth, lightAt, now } = rc;
  if (world.id === 'mazerunner' && tw.bugs) {
    const bg = bugs(); const P = 5, ca = Math.cos(ang), sa = Math.sin(ang);
    const nDraw = Math.min(bg.length, qty(tw.bugAmt == null ? 0.3 : tw.bugAmt, QUANTITY.bugs));
    const R = 0.07;                                    // wander radius (unit-tile fraction)
    for (let i = 0; i < nDraw; i++) {
      const b = bg[i];
      const t = now * 0.00016 * b.spd;
      // smooth meander: position = anchor + two summed sinusoids per axis
      const ox = Math.cos(t + b.ph) + 0.6 * Math.cos(2.3 * t + b.ph2);
      const oy = Math.sin(t + b.ph) + 0.6 * Math.sin(2.3 * t + b.ph2);
      // velocity (analytic derivative) → screen heading so the body faces travel
      const vx = -Math.sin(t + b.ph) - 1.38 * Math.sin(2.3 * t + b.ph2);
      const vy = Math.cos(t + b.ph) + 1.38 * Math.cos(2.3 * t + b.ph2);
      const bx = b.ux + ox * R, by = b.uy + oy * R;
      const wx = bx * P + P * Math.round((eyeX - bx * P) / P);
      const wy = by * P + P * Math.round((eyeY - by * P) / P);
      const dxw = wx - eyeX, dyw = wy - eyeY;
      const depth = dxw * ca + dyw * sa; if (depth <= 0.2 || depth > world.viewDist) continue;
      const lateral = -dxw * sa + dyw * ca;
      const sx = W / 2 + (lateral / (depth * half)) * (W / 2);
      if (sx < -30 || sx > W + 30) continue;
      const sy = H / 2 + 0.5 * (H * 0.92) / depth;
      if (sy > H + M) continue;
      const ci = Math.max(0, Math.min(cDepth.length - 1, Math.round(sx / step)));
      if (cDepth[ci] !== undefined && depth > cDepth[ci] + 0.02) continue;
      const lf = lightAt(depth);
      const scale = (5.5 / depth) * b.sz * 0.5;         // bugs are small
      const srot = Math.atan2(-(vx * ca + vy * sa), -vx * sa + vy * ca); // travel dir on screen
      const body = mix(world.fog, b.kind === 'ant' ? [40, 28, 22] : [30, 30, 34], lf);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(srot); ctx.fillStyle = rgba(body, 0.92);
      if (b.kind === 'ant') {
        // three segments along +x: abdomen, thorax, head
        ctx.beginPath(); ctx.ellipse(-scale * 1.1, 0, scale * 0.6, scale * 0.5, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, scale * 0.4, scale * 0.35, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(scale * 1.0, 0, scale * 0.45, scale * 0.4, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = rgba(body, 0.7); ctx.lineWidth = Math.max(0.4, scale * 0.14);
        for (let l = -1; l <= 1; l++) {
          ctx.beginPath(); ctx.moveTo(l * scale * 0.5, 0); ctx.lineTo(l * scale * 0.5 - scale * 0.3, -scale * 0.9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(l * scale * 0.5, 0); ctx.lineTo(l * scale * 0.5 - scale * 0.3, scale * 0.9); ctx.stroke();
        }
      } else {
        // beetle: one rounded shell + a center seam
        ctx.beginPath(); ctx.ellipse(0, 0, scale * 1.3, scale * 0.85, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = rgba(mix(body, [0, 0, 0], 0.5), 0.6); ctx.lineWidth = Math.max(0.4, scale * 0.16);
        ctx.beginPath(); ctx.moveTo(-scale * 1.1, 0); ctx.lineTo(scale * 1.1, 0); ctx.stroke();
        ctx.lineWidth = Math.max(0.4, scale * 0.14);
        for (let l = -1; l <= 1; l++) {
          ctx.beginPath(); ctx.moveTo(l * scale * 0.6, -scale * 0.7); ctx.lineTo(l * scale * 0.6 - scale * 0.3, -scale * 1.2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(l * scale * 0.6, scale * 0.7); ctx.lineTo(l * scale * 0.6 - scale * 0.3, scale * 1.2); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}

// ---- DRIFTING LEAVES: world-anchored motes that fall and blow with the wind.
// Same depth-occlusion as pebbles; spin as they fall. ----
function drawDriftLeaves(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, W, H, eyeX, eyeY, ang, half, step, cDepth, lightAt, now } = rc;
  if (world.id === 'mazerunner' && tw.driftLeaves) {
    const dl = driftLeaves(); const P = 9, ca = Math.cos(ang), sa = Math.sin(ang);
    const nD = Math.min(dl.length, qty(tw.driftAmt == null ? 0.24 : tw.driftAmt, QUANTITY.driftLeaves));
    const wind = (tw.wind ? tw.windAmt : 0.3) * (tw.driftSpeed == null ? 1 : tw.driftSpeed);
    // blow direction in WORLD space (degrees → unit vector); leaves stream along it
    const dir = (tw.driftDir == null ? 45 : tw.driftDir) * 0.0174533;
    const ddx = Math.cos(dir), ddy = Math.sin(dir);
    for (let i = 0; i < nD; i++) {
      const m = dl[i];
      let fz = (m.uz - now * 0.00004 * m.fall) % 1; if (fz < 0) fz += 1;   // 1=top, 0=floor
      const z = 0.05 + 0.92 * fz;
      const flow = now * 0.00013 * wind;
      const wob = 0.12 * Math.sin(now * 0.0007 + m.sway);
      const bx = (((m.ux + ddx * flow + ddy * wob) % 1) + 1) % 1;
      const by = (((m.uy + ddy * flow - ddx * wob) % 1) + 1) % 1;
      const wx = bx * P + P * Math.round((eyeX - bx * P) / P);
      const wy = by * P + P * Math.round((eyeY - by * P) / P);
      const dxw = wx - eyeX, dyw = wy - eyeY;
      const depth = dxw * ca + dyw * sa; if (depth <= 0.12 || depth > world.viewDist) continue;
      const lateral = -dxw * sa + dyw * ca;
      const sx = W / 2 + (lateral / (depth * half)) * (W / 2);
      if (sx < -20 || sx > W + 20) continue;
      const sy = H / 2 - (z - 0.5) * (H * 0.92) / depth;
      const ci = Math.max(0, Math.min(cDepth.length - 1, Math.round(sx / step)));
      if (cDepth[ci] !== undefined && depth > cDepth[ci] + 0.05) continue;
      const lf = lightAt(depth);
      const scale = Math.max(0.6, (4 / depth) * m.sz);
      const a2 = m.spin + now * 0.001 * (0.6 + m.fall) + flow * 3;
      const lc = mix(world.fog, m.sz > 1.3 ? [128, 100, 50] : [104, 116, 56], lf);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(a2);
      ctx.fillStyle = rgba(lc, 0.82);
      ctx.beginPath(); ctx.ellipse(0, 0, scale * 1.4, scale * 0.55, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
}

// ---- VINES (Maze Runner only): live, tweakable. Leafy cascades off wall tops.
// Two drooping styles: Leaves (default soft foliage) and Ivy (pointed leaves on a
// swaying stem). Both sway with wind. ----
function drawVines(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, cN, cU, cTop, cBot, cX, cDepth, lightAt, windAt } = rc;
  if (world.id === 'mazerunner' && tw.vineDensity > 0 && tw.vines) {
    // Density (0..1) is a fill fraction, so on its own it saturates at "every
    // slot". To let it keep adding vines past that, density ALSO grows the number
    // of anchor slots — so quantity climbs across the whole slider, not just to 1.
    const density = Math.min(1, tw.vineDensity);
    const slots = Math.max(3, Math.round(tw.vineCloseness * (0.6 + 0.7 * density)));
    const style = tw.vineStyle || 'Leaves';
    for (let j = 0; j < cN.length; j++) {
      const cell = cN[j], u = cU[j], top = cTop[j], lineH = cBot[j] - cTop[j], col = cX[j];
      const si = (u * slots) | 0;
      if (_h2(cell, si * 131 + 5) > density) continue;
      const center = (si + 0.5 + (_h2(cell, si * 131 + 9) - 0.5) * tw.vineRandomness) / slots;
      const halfW = (0.5 / slots) * (0.45 + 0.55 * _h2(cell, si * 131 + 13));
      if (Math.abs(u - center) > halfW) continue;
      const lr = _h2(cell, si * 131 + 17);
      let len = tw.vineLength * (1 - tw.vineRandomness * 0.8 * lr);
      len *= 0.82 + 0.18 * _h2(cell * 733 + (col | 0), 3);          // ragged silhouette
      const vlen = Math.max(0.02, len) * lineH;
      const lf = lightAt(cDepth[j]);
      const leafR = Math.min(5.5, Math.max(1.1, lineH * 0.0062));
      const nLeaf = Math.min(22, Math.max(2, (vlen / (leafR * 1.5)) | 0));
      const ph = cell * 0.7 + col * 0.013;
      // 'Mixed' assigns each vine one of the two styles at random (stable per vine)
      const vStyle = style === 'Mixed' ? ['Leaves', 'Ivy'][(_h2(cell * 9 + si, 21) * 2) | 0] : style;
      // swaying stem for the structured styles
      if (vStyle !== 'Leaves') {
        ctx.strokeStyle = rgba(mix(world.fog, [66, 90, 42], lf), 0.55);
        ctx.lineWidth = Math.max(0.6, leafR * 0.4); ctx.beginPath();
        for (let s = 0; s <= nLeaf; s++) { const f = s / nLeaf; const yy = top - 1 + f * vlen; const xx = col + windAt(f, ph); s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
      for (let s = 0; s <= nLeaf; s++) {
        const f = s / nLeaf;
        if (f > 0.35 && _h2(cell * 17 + (col | 0), s * 7) < (f - 0.35) * 0.95) continue; // thin the tail
        const yy = top - 1 + f * vlen;
        const jx = (_h2(cell * 53 + (col | 0), s * 13) - 0.5) * leafR * 1.7 + windAt(f, ph);
        const r = leafR * (0.7 + 0.5 * _h2(cell, s * 5)) * (1 - 0.3 * f);
        const tone = s % 3;
        const gcol = tone === 0 ? [96, 124, 56] : tone === 1 ? [74, 104, 46] : [58, 86, 40];
        const fill = rgba(mix(world.fog, gcol, lf), 0.86);
        if (vStyle === 'Ivy') {
          _leaf(ctx, col + jx, yy, r * 1.3, (s % 2 ? 1 : -1) * (0.5 + 0.2 * Math.sin(s)), fill);
        } else {
          ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(col + jx, yy - r * 0.2, r * 0.9, r * 1.3, 0, 0, 7); ctx.fill();
        }
      }
    }
  }
}

// --- held-light glow at bottom-centre (torch worlds only) ---
function drawHeldGlow(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, W, H, bobY, breathe, flick } = rc;
  if (world.glowAlpha > 0) {
    const cxp = W / 2, cyp = H + bobY * 0.5;
    const tg = ctx.createRadialGradient(cxp, cyp, 10, cxp, cyp, H * 0.7 * breathe);
    tg.addColorStop(0, rgba(world.glow, world.glowAlpha * flick)); tg.addColorStop(1, rgba(world.glow, 0));
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  }
}

// airborne haze — anchored to the WORLD, not the screen. Fixed points in the
// maze; you walk through them (parallax) and they swing past as you turn. In
// torch worlds they're lit only where your light reaches; in daylight, ambient.
// Does its OWN camera save/translate/rotate/restore (the camera transform is
// already closed by the time this runs).
function drawHaze(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, tw, daylight, W, H, R, fall, flick, eyeX, eyeY, ang, half, step, cDepth, bobY, roll, now } = rc;
  if (tw.haze && tw.hazeAmt > 0) {
    const sp = spores(); const nM = Math.min(sp.length, qty(tw.hazeAmt, QUANTITY.haze));
    const P = 6;                                  // world tiling period (tiles)
    const tint = world.haze, drift = world.hazeDrift;
    const t = now, ca = Math.cos(ang), sa = Math.sin(ang);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.translate(-W / 2, -H / 2 + bobY);
    for (let i = 0; i < nM; i++) {
      const m = sp[i];
      const bx = m.ux * P + Math.sin(t * 0.00033 + m.ph) * 0.12;
      const by = m.uy * P + Math.cos(t * 0.00029 + m.ph * 1.3) * 0.12;
      const wx = bx + P * Math.round((eyeX - bx) / P);
      const wy = by + P * Math.round((eyeY - by) / P);
      let fz = (m.uz - t * 0.0000125 * m.spd * drift) % 1; if (fz < 0) fz += 1;
      const z = 0.12 + 0.76 * fz;
      const dxw = wx - eyeX, dyw = wy - eyeY;
      const depth = dxw * ca + dyw * sa;
      if (depth <= 0.06) continue;
      const lateral = -dxw * sa + dyw * ca;
      const sx = W / 2 + (lateral / (depth * half)) * (W / 2);
      if (sx < -10 || sx > W + 10) continue;
      const sy = H / 2 - (z - 0.5) * (H * 0.92) / depth;
      const ci = Math.max(0, Math.min(cDepth.length - 1, Math.round(sx / step)));
      if (cDepth[ci] !== undefined && depth > cDepth[ci] + 0.05) continue;
      const dist = Math.hypot(dxw, dyw);
      let lightF;
      if (daylight) lightF = Math.max(0.2, 1 - dist / world.viewDist);
      else lightF = Math.pow(Math.max(0, 1 - dist / (R * 1.15)), fall);
      if (lightF <= 0.04) continue;
      // count scales via qty(); per-mote alpha scales linearly so the layer goes
      // from a faint veil to thick fog without ever fully washing out the frame.
      const a = 0.7 * tw.hazeAmt * lightF * (0.72 + 0.28 * flick);
      const rad = Math.max(0.4, m.sz * (1.3 / depth));   // parallax size
      ctx.fillStyle = rgba(tint, a);
      ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}

// ---- RAIN (screen-space, batched): each depth layer = ONE stroke() call. Slants
// with the Wind value. Storm-grey wash + ground splashes + lightning overlay. ----
function drawRain(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { tw, raining, W, H, now } = rc;
  if (raining) {
    const rainP = rain();
    const intensity = tw.rainAmt == null ? 0.32 : tw.rainAmt;
    const nD = Math.min(rainP.length, qty(intensity, QUANTITY.rain));
    const gust = 0.5 + 0.5 * Math.sin(now * 0.00035) + 0.18 * Math.sin(now * 0.0013 + 1.7);
    const baseSlant = (tw.wind ? tw.windAmt : 0.3) * 0.5 * (0.6 + 0.4 * gust) + 0.12;
    const layers = [
      { sc: 1.0, sp: 1.5, len: 46, w: 1.6, a: 0.20 },
      { sc: 0.7, sp: 1.1, len: 30, w: 1.1, a: 0.15 },
      { sc: 0.45, sp: 0.8, len: 20, w: 0.8, a: 0.10 },
    ];
    for (let L = 0; L < 3; L++) {
      const ly = layers[L], path = new Path2D();
      const slant = baseSlant * ly.len;
      for (let i = L; i < nD; i += 3) {
        const d = rainP[i];
        let fy = (d.y + now * 0.00035 * ly.sp * d.spd) % 1;
        const y = fy * (H + 120) - 60;
        const x = (d.x + (((i * 97) % 100) / 100 - 0.5) * 0.02) * (W + 240) - 120 + fy * slant;
        path.moveTo(x, y); path.lineTo(x - slant * d.len * 0.02 - 0, y - ly.len * d.len);
      }
      ctx.strokeStyle = `rgba(200,212,228,${ly.a * (0.6 + 0.6 * intensity)})`;
      ctx.lineWidth = ly.w; ctx.lineCap = 'round';
      ctx.stroke(path);
    }
    // ground splashes — small expanding ticks near the floor
    const sp = splashes();
    ctx.strokeStyle = `rgba(200,214,230,${0.5 * intensity})`; ctx.lineWidth = 1.1;
    const spath = new Path2D();
    for (let i = 0; i < sp.length; i++) {
      const s = sp[i]; let ph = (s.ph + now * 0.001 * s.rate) % 1;
      const r = ph * 7 + 1; if (ph > 0.6) continue;
      const x = s.x * W, y = H * 0.55 + s.y * H * 0.42;
      spath.moveTo(x - r, y); spath.lineTo(x - r * 0.4, y - r * 0.5);
      spath.moveTo(x + r, y); spath.lineTo(x + r * 0.4, y - r * 0.5);
    }
    ctx.stroke(spath);
  }
}

// vignette
function drawVignette(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { world, fog, W, H } = rc;
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, rgba(fog, world.vignAlpha));
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// lightning flash — full-screen wash on top of the vignette (one fillRect)
function drawLightningFlash(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { flash, W, H } = rc;
  if (flash > 0) {
    ctx.fillStyle = `rgba(226,234,250,${0.55 * flash})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---- BLOOM: downscale the frame and add it back with 'lighter' — soft highlight
// glow (sky, sun, lightning, headlamp). Two drawImages, cheap. ----
function drawBloom(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { tw, gradeAmt, W, H } = rc;
  if (tw.bloom && gradeAmt >= 0 && (tw.bloom)) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const bw = Math.max(8, (cw / 10) | 0), bh = Math.max(8, (ch / 10) | 0);
    let bc = _bloomCCache;
    if (!bc) bc = _bloomCCache = document.createElement('canvas');
    if (bc.width !== bw || bc.height !== bh) { bc.width = bw; bc.height = bh; }
    const bx = bc.getContext('2d')!;
    bx.clearRect(0, 0, bw, bh); bx.imageSmoothingEnabled = true;
    bx.drawImage(ctx.canvas, 0, 0, cw, ch, 0, 0, bw, bh);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (tw.bloomAmt == null ? 0.32 : tw.bloomAmt);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bc, 0, 0, bw, bh, 0, 0, W, H);
    ctx.restore();
  }
}

// ---- FILM GRADE: lift blacks (lighten), desaturate (saturation blend), tint wash.
// Three full-screen fillRects with blend modes — no per-pixel work. ----
function drawFilmGrade(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { gradeAmt, gShadow, gTint, gTintA, gSat, W, H } = rc;
  if (gradeAmt > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = gradeAmt * 0.55;
    ctx.fillStyle = rgba(gShadow, 1); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = gradeAmt * gSat;
    ctx.fillStyle = 'hsl(0,0%,50%)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = gradeAmt * gTintA;
    ctx.fillStyle = rgba(gTint, 1); ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// film grain
function drawFilmGrain(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { tw, W, H } = rc;
  if (tw.grain && tw.grainAmt > 0) {
    const pat = ctx.createPattern(grainTile(), 'repeat')!;
    ctx.save();
    ctx.globalAlpha = tw.grainAmt * 0.5; ctx.globalCompositeOperation = 'overlay';
    ctx.translate(-(Math.random() * 128) | 0, -(Math.random() * 128) | 0);
    ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 128, H + 128);
    ctx.restore();
  }
}

// facing readout — a contrasting halo keeps it legible over bright or dark floor
function drawCompass(ctx: CanvasRenderingContext2D, rc: RenderCtx): void {
  const { gs, daylight, W, H } = rc;
  const compass = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  const ci = ((Math.round(gs.faceA / (Math.PI / 4)) % 8) + 8) % 8;
  ctx.save();
  ctx.font = '600 12px ' + theme.font.mono; ctx.textAlign = 'center';
  ctx.shadowColor = daylight ? theme.compass.dayHalo : theme.compass.nightHalo;
  ctx.shadowBlur = 6;
  ctx.fillStyle = daylight ? theme.compass.day : theme.compass.night;
  const controls = COARSE_POINTER ? 'SWIPE TO MOVE · ← → SWIPE TO TURN' : '← → TURN  ·  ↑ ↓ MOVE';
  ctx.fillText('▲ FACING ' + compass[ci] + '  ·  ' + controls, W / 2, H - 22);
  ctx.restore();
}
