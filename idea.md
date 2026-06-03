# Daily Maze — The Idea & Design

**Version:** v3 · **Last updated:** 2026-06-02

This doc is the game itself — what it is, and the v1 design. The Go learning plan it's a vehicle for lives in [go-syllabus.md](go-syllabus.md); the React/frontend plan in [react-syllabus.md](react-syllabus.md).

Once a day, one maze opens for everyone at the same time — the same maze for every player. You start at the entrance and explore it blind: the map fills in tile by tile as you move. The goal is to get as close as you can to a hidden exit before the window closes. You don't see the other players directly, but a rough heatmap shows where the crowd is exploring. Your score is how close to the exit you got. The next day, a new maze.

---

## The design

The smallest version that's still a real, novel, demoable game:

- **One maze per day** — procedurally generated, identical for every player, with a **shared entrance and a hidden exit**.
- **A synchronized daily window (~25 min)** — opens for everyone at the same moment, closes for everyone at the same moment. Long enough that the maze is genuinely deep and the crowd heatmap has time to form; short enough to stay a punchy daily ritual, not a grind. A bounded session — no grinding, no advantage for having more hours to burn — and because everyone starts blind at the same instant, no one gets an information head start.
- **Blind exploration (fog of war)** — you reveal the maze tile by tile as you move. Movement is free and local; you do **not** see other players, so there are no positions to sync between players — each person explores the shared layout on their own.
- **Score = how close you charted to the exit.** Your charted map is your score, pointed at a goal. The leaderboard ranks the few who _reach_ the exit by **fewest steps**, and everyone else by **how close they got**. The maze is sized so the best finish and most don't — which is what keeps "how close" a real differentiator.
- **The live layer (felt, not seen):**
  - _Presence_ — a live "**N runners exploring now**" indicator.
  - _Crowd heatmap_ — a **coarse, fuzzy** live density of _where the crowd is exploring_, shown at region level, **not** as the maze's actual walls. It tells you the crowd is surging northeast; it does **not** hand you the route there — you still solve the local maze blind. The fuzziness is the point: it's a directional read on the field, not a shared solution, so it can't be farmed to skip the maze (and late-joiners can't trace a trail to the exit).

### Optional / later (called out)

- **Maze Runner mechanics** — _closing walls_ (a threat that seals the maze as the window ends) and _nightly reconfiguration_ (the maze reshapes between days). Great for tension and theme; add once the core loop works.
- **Social layer** — seeing each other, parties (pooling maps), duels with map-stakes. This is where real-time player-to-player netcode difficulty lives; strictly v2+.
- **Seasons** — periodic wipes, fresh leaderboard, prizes/cosmetics.

---

## Look & feel

Flat, top-down, 2D — no 3D, ever. Everything in the game is information on a grid (a cell, a wall, fog, your marker, crowd heat), so a flat overhead view is the _correct_ representation, not a budget one — the visual ceiling is "Pac-Man maze + fog of war," in the r/place lineage of a grid of colored cells. The charm is deliberately roguelike: a clean glyph-or-tile grid with a tight palette, enhanced just enough to feel alive, never realistic.

```
█████████████      █ wall            · charted floor
█ · · · █ ? ? ?    @ you             ? fog (unknown)
█ ███ █ █ ? ? ?    ▒ ▓ lit / recent  (torchlight around you)
█ · @ · · ? ? ?
███ █ ███ ? ? ?    crowd radar:  ░ none  ▒ few  ▓ many  █ swarm
  ? ? ? · ? ? ?                  (cool → warm: teal → amber → red)
```

**The screen — a few flat panels:**

- **Exploration view (primary).** A top-down viewport centered on you; the camera follows and the fog lifts around you as you move, so you see a local window of the maze, not the whole thing. Move one cell at a time (arrow keys / WASD / swipe) with a small tween between cells — discrete and calm, never twitchy.
- **Crowd radar (small, corner).** A tiny map of the _whole_ arena split into a few coarse regions (e.g. 8×8, regardless of the true cell count), each tinted by how many runners are active there, blurred — a weather-radar of the crowd. No walls, no detail: it shows _where_ people are, never _what's there_, so it can't leak the maze. This is where the "felt, not seen" layer becomes a picture.
- **Personal minimap (small, optional toggle).** A zoomed-out view of everything _you've_ charted so far — the "look how far I've mapped" panel; can share the corner with the radar.
- **HUD chrome.** Plain text: the window countdown, the live "N running" presence count, your step count.

**Cell states (the whole art direction):**

- _Fog / unknown_ — near-black; the default everywhere you haven't been.
- _Charted floor_ — dim; revealed cells you're not standing in.
- _Lit / nearby_ — brighter and warm-tinted, like torchlight; fades back to charted as you move on.
- _Walls_ — a distinct solid or stroke, clearly not floor.
- _You_ — one bright accent marker, gently pulsing, with a faint fading trail of where you just walked.
- _Exit_ — hidden until you reach it, then a distinct glowing marker.

**Touches that make a flat grid feel alive** — all cheap, no art assets: a soft torchlight gradient at the fog edge, cells fading in as they reveal, the pulsing marker and fading trail, the radar updating live so you feel the crowd move, and a clean monospace HUD for the terminal-roguelike flavor. Sound is optional and later: a soft step tick, a reveal chime, a rising hum as the window nears close.

**Palette.** Tight and curated — a dark ground, one accent for _you_, greys for charted, near-black fog, and a cool→warm ramp (teal → amber → red) for crowd heat. A limited palette is what makes a grid of rectangles read as intentional rather than programmer-art.

**The close (payoff screen).** When the window seals, zoom all the way out, fade in the _full_ maze now that it's revealed, draw your charted path through it, and drop a marker where the exit was — with your closeness and rank. A satisfying 2D reveal, no new tech.

**How it's drawn.** The frontend is a **React** app: React owns the shell, all the chrome (timer, presence, leaderboard, screens), and the state + WebSocket wiring. The maze grid, crowd radar, and minimap render to a 2D `<canvas>` _inside_ a React component — canvas is the drawing surface, React is the app around it (you don't draw thousands of cells as DOM nodes). The client is a _dumb renderer_ — it can't build the maze from the day's seed (that would let anyone peek the whole thing), so the server holds the true maze and streams cells over the WebSocket only as you reveal them. No WebGL, no 3D, no game engine.

---

## Scope & stack notes

- **What "done" looks like:** a daily maze everyone explores blind in a shared ~25-min window, fog-of-war revealing, a hidden exit, closeness-to-exit scoring with a fewest-steps tiebreak, a leaderboard, and the live layer (presence + fuzzy crowd heatmap). No duels, parties, or seeing each other. That's the finish line — resist scope creep until it plays.
- **Stack split:** Go owns the live layer (the window, per-connection sessions, the shared heatmap and presence count, broadcast); Postgres/Supabase owns durable state (the day's seed, saved maps, the leaderboard). The **React** browser frontend (rendering grid/fog/heatmap — see **Look & feel**) is real work, but secondary here: the Go learning lives in the server, not the client. Deploying it to a URL so strangers can play is a real goal, not an afterthought.

---

## Changelog

- **v3 — 2026-06-02** — Added a **Look & feel** section: the game is flat 2D top-down (no 3D) — a roguelike-charm grid with fog-of-war, a coarse crowd-heat radar, an optional personal minimap, and a monospace HUD. Specifies cell states, palette, the end-of-window full-maze reveal, and that the client is a dumb `<canvas>` renderer fed revealed cells by the server over WebSocket (React for chrome). Reconciled the Scope note (frontend is secondary, not "out of scope").
- **v2 — 2026-06-02** — Reworked from collaborative cartography into a **competitive race-to-a-hidden-exit**. Scoring is now closeness-to-exit with a fewest-steps tiebreak (was "% charted"); the shared map became a coarse, fuzzy **crowd heatmap** — presence + direction, not a shared solution; the window is set to ~25 min (long enough for the heatmap to form and the maze to be deep, fair because everyone starts together). Removed the "what Go is for / Go's wheelhouse" thesis framing and the anti-competition / loneliness-via-collaboration argument (both now stale).
- **v1 — 2026-06-02** — Initial idea & design doc, extracted from the original `overview.md`.
