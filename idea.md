# Daily Maze — The Idea & Design

**Version:** v1 · **Last updated:** 2026-06-02

The **product**: what this game is, where the idea came from, and the v1 design. The Go
_learning plan_ that this project is a vehicle for lives in [syllabus.md](syllabus.md);
this doc is the game itself.

A daily, shared-maze exploration game. Once a day a window opens for everyone at the
same time. You drop into one procedurally generated maze — identical for every player —
and explore it blind, revealing the map tile by tile before your time runs out. Your
charted map _is_ your score. Tomorrow, a new maze.

Think _The Maze Runner_: one shared maze nobody fully knows, runners mapping it during a
fixed window, the map as a collective survival project — not a twitchy action game.

---

## Why this project, and how I got here

The goal was never the game itself — it's to learn Go. The game is the vehicle. The path
here was deliberate, and worth recording because it explains the shape of the design:

1. **Started from what Go is for.** My working thesis (the bet this project makes, not
   settled fact): Go shines at _coordinating many simultaneous actors over a network into
   one consistent, live shared state — cheaply and simply._ Not raw traffic —
   _coordination of interacting actors around shared state._ The project should point
   straight at that and test whether the thesis holds.
2. **Filtered by motivation.** It had to be something fun and showable, public, usable by
   strangers, and useful from the very first players — not a two-sided market or a crowd
   that has to exist before it works.
3. **Followed the pull.** Across a long exploration (watch-party sync, P2P, distributed
   compute, distributed AI) the recurring instinct was _the power of the crowd_ and
   _territoriality_ — r/place kept coming back. The lesson learned along the way: crowd-
   _compute_ and "public product" are in tension, but crowd-_coordination around shared
   state_ is exactly the buildable, public, Go-shaped sweet spot.
4. **From r/place to a maze.** Tried pushing r/place's mechanics (shared surface, tiny
   atomic actions, cooldown, contested/persistent) into other mediums (sound, text, music)
   and themes (education, sports). The realization: a **maze** beats a flat canvas because
   structure has _consequence_ — a wall blocks, a path enables — so "claim space" becomes
   "shape space," which is richer while staying just as simple to render.
5. **Maze Runner reframed the social layer.** Thinking about _The Maze Runner_ surfaced the
   key insight: the magic was **collective cartography** — runners pooling partial maps for
   a shared goal — not competition. That's what pointed away from a competitive leaderboard
   and toward shared/collective knowledge.
6. **Solved the loneliness problem.** Exploring a maze alone felt lonely. The fix is
   _collective presence + a shared goal_, **not** a competitive live ranking — a ranking
   makes you feel watched and behind and corrodes patient exploration. (See the design's
   anti-loneliness layer.)
7. **Shaped by constraints.** Simple visuals (no 3D — flat grid, fog, cells), one mechanic
   anyone grasps in five seconds (Wordle-simple), and a daily ritual (BeReal-style
   synchronized window) so there's a reason to show up at a moment.
8. **Kept it honest about scope.** The full vision (duels, parties, real-time seeing each
   other, combat, treasure) is _five projects in one_. v1 deliberately strips to the core
   so it's finishable by a Go beginner — the rest is v2+.

(The real path was messier than this tidy list — lots of dead ends and a fair amount of
spiralling before it narrowed. The list is the _logic_ that survived, not a claim that it
was linear.)

The through-line: **a daily shared-maze run, explored blind, scored by how much you
chart** — territorial/collective soul, dead-simple to render, a daily ritual, and dead-
center in Go's wheelhouse.

---

## The design (v1)

The smallest version that is still a real, novel, demoable game:

- **One maze per day**, procedurally generated, identical for every player.
- **A synchronized daily window** — it opens for everyone at the same time and closes for
  everyone at the same time. Bounded session, no grinding, no advantage for having more
  hours to burn.
- **Blind exploration** — you reveal the maze tile by tile (fog of war). Movement is free
  and _local_: in v1 players do **not** see each other, so there are no positions to sync
  between players — each person just explores the shared layout. (This is what keeps v1
  easy; see "the one genuinely hard idea" in [syllabus.md](syllabus.md).)
- **Cartography is the score** — your value is how much of the maze you charted. A
  leaderboard compares everyone on _today's_ maze.
- **Anti-loneliness layer (keep both for now):**
  - _Light:_ a live "N runners exploring now" presence indicator + a **collective progress
    bar** ("the group has charted 47% of today's maze").
  - _Richer:_ a **shared but fuzzy/lagged collective map** — your own map is crisp and
    live; the collective map is blurry, delayed, or only shows _that_ an area was found,
    not its detail. The tension between your sharp personal knowledge and the blurry
    collective picture is the point — and it stops the crowd from trivially charting the
    whole maze on the first day.
  - Design note: the fix for loneliness is **collective presence + a shared goal**, _not_
    a competitive live ranking — a ranking makes you feel watched and behind, and it
    corrodes the patient-cartography feel by rewarding speed over care.

### Optional / later (called out, not in v1)

- **Maze Runner mechanics** — _closing walls_ (a threat that seals the maze as the window
  ends) and _nightly reconfiguration_ (the maze reshapes between days). Great for tension
  and theme; add once the core loop works.
- **Social layer** — seeing each other, parties (pooling maps), duels with map-stakes. This
  is where real-time netcode difficulty lives; strictly v2+.
- **Seasons** — periodic wipes, fresh leaderboard, prizes/cosmetics.

---

## Scope & stack notes

- **What "done" looks like (v1):** a daily maze everyone can explore blind in a shared
  window, fog-of-war revealing, % charted as score, a leaderboard, and the anti-loneliness
  layer (presence + collective progress, plus the fuzzy shared map). No duels, parties, or
  seeing each other. That's the finish line — resist scope creep until it plays.
- **Stack split:** Go owns the live layer (sessions, shared state, the window, broadcast);
  Postgres/Supabase owns durable state (seed, saved maps, leaderboard). The browser
  frontend (rendering grid/fog/maps) is real work but out of scope _here_. Deploying it to
  a URL so strangers can play is a real goal, not an afterthought.

---

## Changelog

- **v1 — 2026-06-02** — Initial idea & design doc, extracted from the original `overview.md`
  (the game pitch, "Why this project / how I got here," the v1 design, and scope/stack
  notes). The Go learning plan stayed in [syllabus.md](syllabus.md).
