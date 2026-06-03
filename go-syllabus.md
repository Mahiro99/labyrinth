# Daily Maze — Go Learning Syllabus

**Version:** v2 · **Last updated:** 2026-06-02

A high-level **syllabus**: the map of **Go concepts** this project covers while building it, and roughly how deep. The game itself — the pitch, why this project, and the v1 design — lives in [idea.md](idea.md), and the frontend's React concepts in [react-syllabus.md](react-syllabus.md). This is not a step-by-step build manual.

> **Scope note (deliberate):** ordering/sequencing (what to build first, what unlocks what), proof-of-learning checkpoints ("you understand X when you can do Y without looking it up"), and the anti-shallowness discipline for the _Light_ topics are intentionally **out of scope here** — they'll live in separate planning docs (e.g. a build-order / learning-path doc) created later, as implementation and planning actually begin. This file stays the high-level syllabus; the sequencing and checkpoints are downstream artifacts, not gaps.

---

## Goal

Learn Go from zero by building one real, fun, public game. Touch all core fundamentals at least once, cover Go's signature features at least lightly, and go deep on the concurrency cluster the game naturally stresses.

Depth legend: **Core** = covered thoroughly · **Solid** = real practice · **Light** = touched once, deliberately.

---

## The concurrency & networking cluster (the heart of this project)

This is the most important section. Go's _fundamentals_ (structs, errors, etc.) matter and this project covers them, but they exist in every language. What makes this particular game a good Go vehicle is the cluster it leans on hardest:

> **Coordinating many simultaneous connections into one consistent, live shared state, and broadcasting it back — cheaply and simply.**

Not _raw traffic_ (a static site serving millions doesn't stress this), but _many connections around shared state that has to stay consistent and be pushed live._ That capability, plus the pillars under it — easy concurrency, first-class networking, deploy-anywhere single binaries — is what this game exercises hardest.

How, concretely:

- **Many simultaneous connections** → every player connected at once during the daily window (goroutines, one per connection).
- **One consistent shared state** → the maze, the live **crowd heatmap**, and the **presence count**, owned by a hub and guarded against concurrent corruption (channels, `sync`/atomics, the race detector). _This is the deep end_ — contended shared state under many writers, not gentle one-way broadcast.
- **Live** → presence and the crowd heatmap pushed to everyone in real time (WebSockets, fan-out). Each player's own map stays local and private.
- **A shared clock** → the synchronized ~25-min daily window that opens and closes for everyone at the same instant (`time`, `context`).
- **Cheaply / deploy-anywhere** → ships as a single binary to one cheap server (`go build`, optionally `embed`).

(See "Honest limitations" for the parts this project covers only partially.)

## Language fundamentals

- **Structs & data modeling** _(Core)_ — model the maze, cells, walls, a player's revealed map, a daily run, the session. The foundation of how Go represents data.
- **Struct embedding & composition** _(Core)_ — Go's "composition over inheritance" worldview, the biggest type-system shift from Java. Canonical home: embed `sync.RWMutex` into the state struct it protects (`type Hub struct { sync.RWMutex; ... }`) so embedding and locking are learned together; also any shared behavior across maze/run/session types.
- **Zero values** _(Solid)_ — the idiom (constructor-free usable structs, a `nil` slice you can still `append` to, reading a `nil` map) _and_ the gotcha (writing to a `nil` map panics). Lean on zero values instead of writing constructors out of Java habit.
- **Methods & receivers** _(Solid)_ — behavior on those structs; value-vs-pointer receivers.
- **Pointers** _(Solid)_ — pointer-vs-value semantics for structs in maps/slices (when you're copying vs. sharing) and `nil`-pointer panics; the beginner traps the receiver rule alone doesn't cover.
- **Typed constants & `iota`** _(Solid)_ — Go's enum idiom: a defined type + `iota` for directions (N/E/S/W), cell states (wall/path/fog/charted), and WebSocket message types. Pair with a `String()` method (`fmt.Stringer`) — a tiny, high-value interface lesson.
- **Error handling** _(Core)_ — the `if err != nil` rhythm everywhere; wrapping with `%w`, sentinel errors (e.g. a "window closed" sentinel) and `errors.Is`/`errors.As`, plus custom error types; when to return vs. handle.
- **Slices, maps & basic types** _(Core)_ — the grid, revealed-cell sets, per-player state.
- **Interfaces** _(Light-Solid, and it fits naturally here)_ — a pluggable `MazeGenerator` (different algorithms) and/or a `Threat`/scoring abstraction, plus `fmt.Stringer` on the enum types above. Unlike some projects, this one has an honest place for interfaces rather than a contrived one.
- **Generics** _(Light - deliberate practice)_ — the design doesn't strictly need them; a type-safe broadcast helper or a generic set type is a fine place to meet the syntax once, named honestly as the exercise it is.
- **`defer`** _(Solid)_ — cleanup: closing connections, unlocking.
- **Closures & functions** _(Solid)_ — handlers, per-connection callbacks.
- **Packages & project layout** _(Solid)_ — organizing into packages and a module.

## Concurrency (the deep cluster)

- **Goroutines** _(Core)_ — per-connection read/write; the daily-window timer; the threat ticker. Make every goroutine exit cleanly (no leaks).
- **Channels** _(Core)_ — the session "hub"/actor pattern: one goroutine owns the shared maze, heatmap, and presence state and receives commands (move, reveal, join, leave). **This is the idiomatic Go answer** (share by communicating) and the one to reach for first — deliberately build the shared state _this_ way as well as the lock-guarded way below, and compare which is cleaner. Resist the Java instinct to default to mutexes.
- **`select`** _(Core)_ — wait on "a player action OR the window-close tick OR shutdown."
- **`sync` primitives** _(Core)_ — the **presence count** under many simultaneous writers (`atomic`), and the **crowd heatmap** (`RWMutex` / sharding). The meaty correctness lesson — but treat it as the _alternative_ to the channel-owned hub above, built to feel the trade-off, not as the default. Also `WaitGroup` for batch cleanup on window close.
- **Channel idioms** _(Solid)_ — closing channels and the `v, ok := <-ch` pattern; you'll hit this in week one.
- **`context` package** _(Core)_ — cancellation/cleanup when a run ends, the daily window closes, a player disconnects, or the server shuts down.
- **Race detector** _(Solid-Core)_ — `go test -race` to _prove_ the shared heatmap/presence state is correct under concurrent access. With contended shared state, this matters.

## Standard library & external packages

- **`net/http`** _(Solid)_ — serve the page and the WebSocket upgrade endpoint.
- **WebSockets** _(Core)_ — the live transport; pushing presence and the crowd heatmap to everyone live.
- **`encoding/json`** _(Core)_ — the messages both ways; struct tags.
- **`time`** _(Core - central here)_ — the synchronized daily window (shared clock), the threat/ticker, the per-run countdown, and (optional) nightly reconfiguration. The "it opens and closes for everyone at once" property lives here.
- **`math/rand`** _(Solid)_ — seeded, deterministic maze generation so everyone gets the _same_ maze from the day's seed. (Bonus: generation + reachability + **scoring as shortest-path distance to the exit** (BFS) is real grid/graph algorithm practice — free CS, no visual complexity.)
- **`database/sql` / `pgx`** _(Solid)_ — persistence (Postgres / Supabase): the day's maze seed, each player's revealed map, the leaderboard, seasons. Split the state honestly — fast-changing live state in memory; durable state in the DB.
- **`embed`** _(Light)_ — optionally bundle the frontend into the binary. With a separate web client this is optional rather than the capstone.

## Tooling & workflow

- **`go mod` / `go build` / `go run` / `gofmt` / `go vet`** _(Solid)_ — modules, the everyday loop, the single-binary payoff, and Go's formatting/linting culture.
- **Testing** _(Solid — and partly the hard part)_ — table-driven tests with `t.Run` subtests (Go's idiomatic style) for the maze generator (solvable? deterministic from a seed?), plus testing the concurrent shared state under simultaneous writers with `go test -race`. Not an afterthought.

---

## Concepts intentionally left out (v1)

Skipped honestly, good targets for later:

- **Real-time player-to-player sync** — v1 players don't see each other, so there are no positions to broadcast between players. This is _the_ thing that keeps v1 tractable. The hard tick-vs-free-movement netcode decision only bites in v2 (the social layer).
- **Raw TCP / `net` below WebSockets** — we stay at the WebSocket layer.
- **Reflection** — we use its results (JSON tags) but never write it.

## Honest limitations — what this project does NOT make you good at

Even done well, this project has real blind spots. Naming them so the coverage claims above stay honest:

- **Direct real-time player-to-player interaction is only partial.** v1 nails _shared consistent state_ (the contended heatmap and presence count), but because players don't see or collide with each other yet, the _direct real-time interaction_ dimension — lag compensation, reconciling who-did-what-first between players — is barely touched. That is the v2 social layer (duels, parties, seeing each other).
- **Large-codebase architecture is not exercised.** The project is big enough to teach packages and clean structure, but not big enough to teach how Go scales to a large codebase (module boundaries at scale, internal APIs, large-team conventions). That needs a bigger or a second project.
- **The "mundane but professional" layer is touched, not stressed.** Robust error strategies, dependency-management discipline, and deep test suites are all present at _Solid_, not _Core_ — you'll do them, but the project won't force mastery. Going deep on testing in particular is a choice you have to make, not something the game demands.

None of these are reasons not to build it — they're the honest edges of a _first_ project whose goal is Go's core. They simply mark where the next project should go.

---

## The one genuinely hard idea

The interesting correctness problem is the **shared state under many simultaneous writers**: the live crowd heatmap and presence count are touched by every player at once and must stay correct and fast. That's the real Go lesson — choosing between channel-owned state (the hub) and lock/atomic-guarded state, and proving it under `-race`. The **synchronized daily window** (one shared clock that opens and closes for everyone at the same moment) is the other distinctive piece. Neither needs graphics — both are pure coordination, and the part of this build most worth getting right.

---

## Changelog

- **v2 — 2026-06-02** — Synced to the v2 game design (competitive race-to-exit): updated the shared-state nouns throughout (collective progress counter / fuzzy collective map → crowd heatmap + presence count), added shortest-path-to-exit (BFS) as the scoring algorithm, and dropped the "what Go is for / working thesis / ~75% of Go's sweet spot" framing in favor of "the concurrency cluster this game leans on." Go-concept coverage is otherwise unchanged — the same goroutines/channels/`select`/atomics/`-race`/`time` lessons, just renamed nouns.
- **v1 — 2026-06-02** — Initial syllabus, extracted from the original `overview.md`. Kept the Go learning plan (goal, practical core, fundamentals, concurrency, stdlib, tooling, concepts-left-out, honest limitations, the one hard idea) and the downstream-docs scope note; the game pitch and design moved to [idea.md](idea.md). Carries the prior content's additions: embedding/zero-values/pointers/`iota`+`Stringer` fundamentals, CSP-first concurrency framing, table-driven testing, and softened "essence of Go" claims.
