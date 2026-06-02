# Daily Maze — Design & Go Learning Plan

A daily, shared-maze exploration game. Once a day a window opens for everyone at the
same time. You drop into one procedurally generated maze — identical for every player —
and explore it blind, revealing the map tile by tile before your time runs out. Your
charted map _is_ your score. Tomorrow, a new maze.

Think _The Maze Runner_: one shared maze nobody fully knows, runners mapping it during a
fixed window, the map as a collective survival project — not a twitchy action game.

This document is two things at once: the **design** of the game, and a map of the **Go
concepts** we intend to cover while building it (and roughly how deep). It is not a
step-by-step build manual.

---

## Why this project, and how I got here

The goal was never the game itself — it's to learn Go. The game is the vehicle. The path
here was deliberate, and worth recording because it explains the shape of the design:

1. **Started from what Go is for.** Go's real strength is _coordinating many simultaneous
   actors over a network into one consistent, live shared state — cheaply and simply._
   Not raw traffic — _coordination of interacting actors around shared state._ The project
   should point straight at that.
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
  easy; see "the hard idea" below.)
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

## Goal

Learn Go from zero by building one real, fun, public game. Touch all core fundamentals at
least once, cover Go's signature features at least lightly, and go deep on the
concurrency cluster the game naturally stresses.

Depth legend: **Core** = covered thoroughly · **Solid** = real practice · **Light** =
touched once, deliberately.

---

## Go's practical core — and how this project covers it

This is the most important section: Go's _fundamentals_ (structs, errors, etc.) matter,
but they exist in every language. The reason to learn **Go specifically** is its practical
core:

> **Coordinating many simultaneous actors over a network into one consistent, live shared
> state — cheaply and simply.**

Note the emphasis: not _raw traffic_ (a static site serving millions is not Go-special),
but _coordination of interacting actors around shared state that must stay consistent and
be broadcast live._ That single capability — and the three pillars under it (easy
concurrency, first-class networking, deploy-anywhere single binaries) — is what Go is for.

How this project exercises that core, concretely:

- **Many simultaneous actors** → every player connected at once during the daily window
  (goroutines, one per connection).
- **One consistent shared state** → the maze, the collective progress counter, and the
  fuzzy shared map, owned by a hub and guarded against concurrent corruption (channels,
  `sync`/atomics, the race detector). _This is the deep end_ — contended shared state, not
  gentle one-way broadcast.
- **Live** → reveals, presence, and progress pushed to everyone in real time (WebSockets,
  fan-out).
- **A shared clock** → the synchronized daily window that opens and closes for everyone at
  the same instant (`time`, `context`).
- **Cheaply / deploy-anywhere** → ships as a single binary to one cheap server (`go build`,
  optionally `embed`).

In short: the project is not "a game that happens to use Go" — it is a direct, deliberate
exercise of the exact thing Go is best at. (See "Honest limitations" for the parts of the
practical core this project covers only partially.)

## Language fundamentals

- **Structs & data modeling** _(Core)_ — model the maze, cells, walls, a player's revealed
  map, a daily run, the session. The foundation of how Go represents data.
- **Methods & receivers** _(Solid)_ — behavior on those structs; value-vs-pointer receivers.
- **Error handling** _(Core)_ — the `if err != nil` rhythm everywhere; wrapping, when to
  return vs. handle.
- **Slices, maps & basic types** _(Core)_ — the grid, revealed-cell sets, per-player state.
- **Interfaces** _(Light-Solid, and it fits naturally here)_ — a pluggable `MazeGenerator`
  (different algorithms) and/or a `Threat`/scoring abstraction. Unlike some projects, this
  one has an honest place for interfaces rather than a contrived one.
- **Generics** _(Light - deliberate practice)_ — the design doesn't strictly need them; a
  type-safe broadcast helper or a generic set type is a fine place to meet the syntax once,
  named honestly as the exercise it is.
- **`defer`** _(Solid)_ — cleanup: closing connections, unlocking.
- **Closures & functions** _(Solid)_ — handlers, per-connection callbacks.
- **Packages & project layout** _(Solid)_ — organizing into packages and a module.

## Concurrency (the deep cluster)

- **Goroutines** _(Core)_ — per-connection read/write; the daily-window timer; the threat
  ticker. Make every goroutine exit cleanly (no leaks).
- **Channels** _(Core)_ — the session "hub"/actor pattern: one goroutine owns shared maze
  and progress state and receives commands (move, reveal, join, leave).
- **`select`** _(Core)_ — wait on "a player action OR the window-close tick OR shutdown."
- **`sync` primitives** _(Core - heavier here than most projects)_ — the **collective
  progress counter** under many simultaneous writers (`atomic`), and the shared collective
  map (`RWMutex` / sharding). This is the meaty correctness lesson, and it's central, not
  incidental. Also `WaitGroup` for batch cleanup on window close.
- **Channel idioms** _(Solid)_ — closing channels and the `v, ok := <-ch` pattern; you'll
  hit this in week one.
- **`context` package** _(Core)_ — cancellation/cleanup when a run ends, the daily window
  closes, a player disconnects, or the server shuts down.
- **Race detector** _(Solid-Core)_ — `go test -race` to _prove_ the shared progress/map
  state is correct under concurrent access. With contended shared counters, this matters.

## Standard library & external packages

- **`net/http`** _(Solid)_ — serve the page and the WebSocket upgrade endpoint.
- **WebSockets** _(Core)_ — the live transport; pushing reveals, presence, and progress.
- **`encoding/json`** _(Core)_ — the messages both ways; struct tags.
- **`time`** _(Core - central here)_ — the synchronized daily window (shared clock), the
  threat/ticker, the per-run countdown, and (optional) nightly reconfiguration. The "it
  opens and closes for everyone at once" property lives here.
- **`math/rand`** _(Solid)_ — seeded, deterministic maze generation so everyone gets the
  _same_ maze from the day's seed. (Bonus: the generation + reachability logic is a real
  grid/graph algorithm sub-problem — free CS practice, no visual complexity.)
- **`database/sql` / `pgx`** _(Solid)_ — persistence (Postgres / Supabase): the day's maze
  seed, each player's revealed map, the leaderboard, seasons. Split the state honestly —
  fast-changing live state in memory; durable state in the DB.
- **`embed`** _(Light)_ — optionally bundle the frontend into the binary. With a separate
  web client this is optional rather than the capstone.

## Tooling & workflow

- **`go mod` / `go build` / `go run` / `gofmt` / `go vet`** _(Solid)_ — modules, the
  everyday loop, the single-binary payoff, and Go's formatting/linting culture.
- **Testing** _(Solid — and partly the hard part)_ — testing the concurrent shared state
  under simultaneous writers with `go test -race`, plus unit-testing the maze generator
  (solvable? deterministic from a seed?). Not an afterthought.

---

## Concepts intentionally left out (v1)

Skipped honestly, good targets for later:

- **Real-time player-to-player sync** — v1 players don't see each other, so there are no
  positions to broadcast between players. This is _the_ thing that keeps v1 tractable. The
  hard tick-vs-free-movement netcode decision only bites in v2 (the social layer).
- **Raw TCP / `net` below WebSockets** — we stay at the WebSocket layer.
- **Reflection** — we use its results (JSON tags) but never write it.

## Honest limitations — what this project does NOT make you good at

Even done well, this project has real blind spots. Naming them so the coverage claims
above stay honest:

- **The "live interacting actors" half of the practical core is only partial.** v1 nails
  _shared consistent state_ (the contended progress counter and map), but because players
  don't see or collide with each other yet, the _direct real-time interaction_ dimension —
  lag compensation, reconciling who-did-what-first between players — is barely touched. That
  is the v2 social layer (duels, parties, seeing each other). So v1 covers roughly the
  shared-state ~75% of Go's sweet spot; the interacting-netcode remainder is later.
- **Large-codebase architecture is not exercised.** The project is big enough to teach
  packages and clean structure, but not big enough to teach how Go scales to a large
  codebase (module boundaries at scale, internal APIs, large-team conventions). That needs a
  bigger or a second project.
- **The "mundane but professional" layer is touched, not stressed.** Robust error
  strategies, dependency-management discipline, and deep test suites are all present at
  _Solid_, not _Core_ — you'll do them, but the project won't force mastery. Going deep on
  testing in particular is a choice you have to make, not something the game demands.

None of these are reasons not to build it — they're the honest edges of a _first_ project
whose goal is Go's core. They simply mark where the next project should go.

---

## The one genuinely hard idea

The interesting correctness problem is the **shared collective state under many
simultaneous writers**: the live progress counter and the fuzzy collective map are touched
by every player at once and must stay correct and fast. That's the real Go lesson — choosing
between channel-owned state (the hub) and lock/atomic-guarded state, and proving it under
`-race`. The **synchronized daily window** (one shared clock that opens and closes for
everyone at the same moment) is the other distinctive piece. Neither needs graphics — both
are pure coordination, which is exactly what Go is for.

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
