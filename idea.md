# Daily Maze — The Idea & Design

**Version:** v2 · **Last updated:** 2026-06-02

This doc is the game itself — what it is, and the v1 design. The Go learning plan it's a vehicle for lives in [syllabus.md](syllabus.md).

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

## Scope & stack notes

- **What "done" looks like:** a daily maze everyone explores blind in a shared ~25-min window, fog-of-war revealing, a hidden exit, closeness-to-exit scoring with a fewest-steps tiebreak, a leaderboard, and the live layer (presence + fuzzy crowd heatmap). No duels, parties, or seeing each other. That's the finish line — resist scope creep until it plays.
- **Stack split:** Go owns the live layer (the window, per-connection sessions, the shared heatmap and presence count, broadcast); Postgres/Supabase owns durable state (the day's seed, saved maps, the leaderboard). The browser frontend (rendering grid/fog/heatmap) is real work but out of scope _here_. Deploying it to a URL so strangers can play is a real goal, not an afterthought.

---

## Changelog

- **v2 — 2026-06-02** — Reworked from collaborative cartography into a **competitive race-to-a-hidden-exit**. Scoring is now closeness-to-exit with a fewest-steps tiebreak (was "% charted"); the shared map became a coarse, fuzzy **crowd heatmap** — presence + direction, not a shared solution; the window is set to ~25 min (long enough for the heatmap to form and the maze to be deep, fair because everyone starts together). Removed the "what Go is for / Go's wheelhouse" thesis framing and the anti-competition / loneliness-via-collaboration argument (both now stale).
- **v1 — 2026-06-02** — Initial idea & design doc, extracted from the original `overview.md`.
