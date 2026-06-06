# Daily Maze — Design

**Version:** v13 · **Last updated:** 2026-06-05

Daily Maze is a once-a-day maze race. Each day the server builds one maze — the same maze for everyone. You drop in at a shared entrance, first-person, lit only by a small light that travels with you, and look for a hidden exit. Your score is how few steps it took. Don't reach the exit? Your score is how close you got. Next day, new maze.

It's a first-person solo run. (This replaces the older top-down concept. A social / multiplayer layer may come back later — see Parked — but it's not part of the current design.)

The detailed rules system — the hidden daily rule you crack — has its own doc: [maze-rules.md](maze-rules.md).

## The loop

- One maze per day, same for everyone, with a shared entrance and a hidden exit. The entrance splits into several paths right away, so you're making choices (and reading runes) from the very first step.
- The maze is a grid of tiles. You move one tile at a time. Your map fills in as you go — every tile the light has touched is charted; the rest stay dark.
- One shared daily window: it opens for everyone at the same time and closes for everyone at the same time.
- First-person, lit by a small moving light — about a tile in each open direction, no farther. Enough to see the walls and exits around you, not to plan ahead. You read a junction's runes when you reach it, and the maze is built so the light never shows you where a path *ends* — so you still can't see a dead end coming: you commit on the runes, then find out (full reasoning in [maze-rules.md](maze-rules.md)).
- Goal: reach the hidden exit. It's a race.

## Scoring

- Score is steps. Fewer is better.
- Leaderboard has two tiers: people who reached the exit (ranked by fewest steps), then below them people who didn't (ranked by how close they got). Finishers always beat non-finishers.
- No death, no elimination. The only thing that ends your run is the window closing.
- Everyone gets a result, even non-finishers (see Sharing).
- The maze is big enough that finishing is hard. Reaching the exit is an achievement, not the norm.

## Your map

- As you move, the maze charts itself for you — every tile the light has touched gets marked (if you saw it, you keep it), the rest stay dark. The server tracks it; you don't draw it.
- In a steps race, the map is your stored progress: knowing where corridors and dead ends are means fewer wasted steps. The map isn't the score, but the score is made of it.
- It's also what you share at the end of the day (see Sharing).

## World mechanics

**Trap doors** make a wrong read *cost* you — and they're part of the rune language, not a random hazard. A branch marked with nothing but silence (a stack of MUTE runes) is a trap: step on it and you're flung elsewhere in the maze — a big step loss, not just a dead-end. You can't see it coming until you've cracked which runes are mute; then the silence warns you. Full mechanic in [maze-rules.md](maze-rules.md).

**Server is authoritative.** It holds the true maze and sends each player only the tiles they've revealed, so the full maze never sits on the client to be read off. The client just draws what it's told.

## Sharing

Like Wordle, you can share your result without spoiling the maze for people who haven't played.

- **Run-strip.** A short, spoiler-free summary you can post any time, even mid-window. Shows your result and the shape of your run, but nothing about where things are:

```
Daily Maze #142 🏁 47 steps · top 12%
🟩🟩🟩🟥🟩⬛🟩🟩🟩🏁
(🟩 progress · 🟥 backtrack · ⬛ dead end)
```

  A non-finisher gets the same strip without the 🏁 — a ⏳ and a closeness marker instead.
- **Full path.** After the window closes the maze is revealed to everyone, so a richer share opens up: your full route drawn over the solved maze. Fine post-window — nothing left to spoil.

## Look and rendering

- First-person. A small pool of light around you (about a tile in each open direction — a starting radius we can widen later) and the dark beyond it are the whole look: you see the walls and exits immediately around you, nothing farther.
- Render approach undecided: a **raycast renderer** (Wolfenstein-style wall slices on a 2D canvas, no 3D engine) or a **3D renderer** (Three.js). Raycast is cheaper and simpler; 3D looks better in the dark.
- Either way the client is a dumb renderer — it can't build the maze, it only draws the tiles the server sends.

## Stack

- **Go server:** the authoritative maze and the WebSocket to each player (it serves only the tiles you've revealed, so the full maze never reaches the client). The main part of the project. Go plan: [go-syllabus.md](go-syllabus.md) — note that plan is currently built around the (now-pulled) multiplayer hub and will need revisiting; see Parked.
- **React + TypeScript client:** the shell, the HUD, the renderer. Frontend plan: [react-syllabus.md](react-syllabus.md).
- **Postgres:** durable state — the day's seed, saved maps, the leaderboard.
- Deploying to a public URL so strangers can play is a real goal, not an afterthought.

## The deduction core (why this game has a brain)

This is the part that makes a solo run worth playing.

**The problem it solves.** A blind maze you just navigate is busywork — you execute and clear fog, but there's nothing to *figure out*. Fun runs dry once the novelty's gone. The fix is giving the player something to *reason about while they walk*. With that in place, the run is a complete game on its own. (Any social or competitive layer added later sits on top of this — it's not what carries the fun.)

**The core idea: crack the maze's hidden rule.** Each day the maze is built from a hidden rule. You figure it out from the inside by moving, observing, and reasoning — not by zooming out to inspect the maze from above. The rule **changes every day**, so cracking it is the daily challenge everyone races at. You can share that you cracked it without spoiling how (post the glyph, not the answer).

**It is *not* Wordle.** Wordle gives you a scoreboard after each guess (green/yellow/grey). We don't. There's no "correct!" signal — the game never tells you the rule or confirms a guess; you only ever see things that are *consistent* with the rule, and one day it clicks. (Games like *Outer Wilds*, *The Witness*, and *Tunic* do this too — you decode a hidden system from honest-but-unexplained clues, and the payoff is "*oh — it was that the whole time.*") We keep only two things from Wordle:

- **Daily + shared + spoiler-safe** — the social shell.
- **Partial progress, never zero** — you can crack part of the rule and still make headway.

**Two decisions locked in** (full reasoning in "Decisions already made" below — don't reopen):

1. **The rule is 100% reliable.** It holds at *every* junction, no exceptions. This keeps the leaderboard fair (everyone faces the same truth) but makes the rule fully spoilable — one posted sentence gives it away.
2. **Because it's spoilable, the daily window is synchronized.** Everyone plays at the same time, before a posted answer can spread. Cost we accept: it's less convenient and unfair across timezones.

**The hard part is the generator.** Since there's no feedback system to build (feedback is just "the maze stays consistent"), the whole game comes down to one thing: **a program that builds a fair, solvable, uniquely-crackable maze every day, unattended** — "uniquely-crackable" meaning there's exactly one rule that fits, and you can deduce it from the inside without guessing. That generator and the rule system are specced in detail in [maze-rules.md](maze-rules.md).

## Decisions already made (don't reopen)

The reasoning behind settled choices, kept so we don't relitigate them.

### Why the rule is deterministic, not probabilistic

We considered a maze *dealt* from a hidden distribution — gamble on the likely path, poker-meets-maze. It had a nicer difficulty curve (every observation improves your read a bit; you're never fully stuck or fully done) and was more forgiving. **But it breaks leaderboard fairness:** players walking different paths face different draws, so the same seed isn't the same experience — the leaderboard would rank luck dressed as skill. A deterministic rule means everyone at a given junction sees the identical truth, so step counts are comparable. That's why it won. (The forgiving curve we lose is bought back below, by decomposing the rule.)

### Why the rule is split into several parts

A single all-or-nothing rule has a **cliff**: you have nothing until you crack it, then everything. On a hard day a player sits at zero for 20 minutes and quits — fatal for a daily. The fix: split the rule into several parts (currently 5 runes, each with a hidden meaning — see [maze-rules.md](maze-rules.md)) you can crack one at a time, so partial progress is real (crack one rune, save some steps). This is the "never at zero" property. A single-insight rule would give a crisper brag ("it was primes!") but brings the cliff back; the gradual climb beats the cliff, and there's still a hard, brag-worthy twist sitting on top — the "keystone" in [maze-rules.md](maze-rules.md).

### Why 100% reliable + synchronized window go together

These two are coupled. A 100% rule is crisp and fair but fully spoilable (one sentence gives it away), so it needs everyone playing at once — a synchronized window — before the answer can spread. The alternative we rejected was a ~95%-reliable rule (one that occasionally breaks its own pattern) paired with an open, play-anytime window: harder to spoil, more convenient, but it muddies the leaderboard and the brag. We chose **100% + synchronized** and accept the timezone unfairness.

### Cut from contention

- **Maze-as-external-object** (Battleship-style probing from outside) — breaks the first-person, in-the-dark frame.
- **Plain empty-maze navigation** — the daily-Sudoku problem above; no reasoning.

## Parked

Recorded so we don't relitigate, but not part of this design:

- **Multiplayer / real-time co-presence — pulled out, to be redefined later.** Everything where players share a live space: seeing other players and their flashlight beams, a live presence count ("N exploring"), encounters that stake and exchange map (raid/share, or a battery bid), and instancing to keep crowds healthy. This was a core part of an earlier draft; we've pulled it to focus the design on the solo deduction run, and will redefine it from scratch later. **Note:** when it returns it also reshapes the Go concurrency plan ([go-syllabus.md](go-syllabus.md)), which is currently built around the multiplayer hub (shared state, presence, fan-out). (The *shared daily maze*, the *async leaderboard*, and *spoiler-safe sharing* are **not** part of this pull — they're not real-time multiplayer and stay in the design.)
- Party / co-op map-pooling.
- **Flashlight + battery economy — pulled out, parked for later.** A toggleable light that reveals a radius around you and lets you read junctions ahead, draining a finite battery — so every stretch was a choice: burn battery to see ahead, or stay dark to save it. It was the game's risk-economy pillar in an earlier draft; pulled to simplify the current design. **Without it the maze is still first-person — lit only by the small always-on light (about a tile), so there's no resource to manage and still no seeing far ahead.** (That ambient light is a different thing from this flashlight: tiny, free, always on, and built to reveal no answers — the flashlight was bigger, battery-limited, and let you scout junctions ahead.) (When/if it returns, it also revives the "see ahead vs. save" tension and pairs with the warmth hint below.)
- **Echolocation** — tap/clap/drop a stone and read the returns (late echo = open space, quick slap = near wall, resonance = chamber, exit hums). A sensing tool, same family as the parked flashlight; could layer on later.
- **Two senses that disagree** — two unreliable instruments (a compass that lies near traps; a map-sense accurate only behind you); truth is in the overlap. A triangulation tool to layer on later.
- **Warmth / proximity hint** — graded "how close to the exit" feedback (Cold→Burning by straight-line distance). Agreed in principle, not in this design yet (would pair with the parked flashlight).
- **Maze Runner mechanics** — closing walls that seal the maze as the window ends; a maze that visibly reshapes. Good for tension, add once the core works.
- **Seasons** (persistent dungeon + leaderboard across days), prizes, cosmetics.
- **Territories, alliances**, other emergent-social systems.

## Changelog

- **v13 — 2026-06-05** — Gave the player a **small always-on light** (about a tile in each open direction) in place of pure blind-in-the-dark: you explore by a moving pool of light that charts every tile it touches (if you saw it, you keep it — the map is *what the light has touched*, not just what you stepped on). It's tuned for *mood, not information* — the maze is built so the light never reveals where a path ends, so you still commit to a branch on the runes and only then hit a dead end (matching builder guarantee in [maze-rules.md](maze-rules.md) v10). Reworded the intro, the loop, "Your map," and "Look and rendering," and clarified in Parked that this ambient light is distinct from the pulled battery-flashlight.
- **v12 — 2026-06-05** — Two changes. (1) **Trap doors folded into the rune language:** a branch of nothing but silence (stacked MUTE runes) is a trap — punishment-only, readable once you've cracked the mute runes (full mechanic in [maze-rules.md](maze-rules.md) v9). (2) **Removed the flashlight + battery economy** to Parked (no longer current). The maze stays first-person and blind, but you now see only the tile you're on and its exits — no seeing ahead, no battery to manage; reworded the loop, scoring (dropped the dead-battery bullet), and "Look and rendering," and de-coupled the parked echolocation/warmth notes from the light.
- **v11 — 2026-06-05** — Removed the **Secret routes** mechanic (World mechanics is now just trap doors) and deleted the **Open questions** section (window duration, render approach, rule-system pointer) as resolved/redundant — render approach is still described in "Look and rendering," and the rule system lives in [maze-rules.md](maze-rules.md).
- **v10 — 2026-06-05** — Removed the multiplayer layer from the current design, to be redefined later. Deleted the whole "Multiplayer" section (co-presence, beams, presence count, encounters/raid-share, battery-bid, instancing) and stripped the crowd/encounter references from the loop, "Your map," "Look and rendering," "Stack," the deduction core, and Open questions. Recorded the pulled feature in Parked, flagging that it also reshapes the Go concurrency plan when it returns. The game is now framed as a single-player daily run; the shared daily maze, async leaderboard, and spoiler-safe sharing remain (they aren't real-time multiplayer).
- **v9 — 2026-06-03** — Synced with the rune-voice rule system now locked in [maze-rules.md](maze-rules.md) (v7): the brag is no longer "one of the parts" but a **keystone twist on top** of the 5 runes; "split into several parts" now says "5 runes, each with a hidden meaning"; reworded "occasionally lies" → "occasionally breaks its own pattern" (the word "lies" now collides with the LIE rune voice); and "the actual sub-rules" → "the runes and their hidden voices."
- **v8 — 2026-06-03** — Clarity fixes from a fresh-reader review: replaced the confusing "daily Sudoku" put-down with plain "busywork — nothing to figure out"; made the *Outer Wilds/Witness/Tunic* comparison carry its own meaning instead of relying on having played them; glossed "uniquely-crackable" inline; flagged the battery-bid payment as an open detail; replaced "ramp/keystone" jargon with plain wording and fixed the stale "~3 parts" (now ~5, pointing to maze-rules.md).
- **v7 — 2026-06-03** — Plain-language rewrite + restructure. Same content, simpler words. Renamed "Deduction direction" → "The deduction core" and shortened it to the essentials; moved all the long "why we rejected X" reasoning into a new **"Decisions already made (don't reopen)"** section near the bottom so the main read flows. Merged "Mahir's questions" into a clean "Open questions" list. Pointed the detailed rule/generator content to the new [maze-rules.md](maze-rules.md) instead of carrying it inline.
- **v6 — 2026-06-03** — Reframed away from "maze-Wordle": Wordle's engine is an oracle (guess → scored → refine), which we dropped (100%, no "correct" signal), so the real family is embodied deduction (*Outer Wilds* / *The Witness* / *Tunic*). Kept only two Wordle properties (daily+shared+spoiler-safe; partial-progress). Established that there's no separate feedback system — feedback *is* consistency — so the game reduces to a generator hitting five properties. Named "uniquely inferable" as the deepest property.
- **v5 — 2026-06-03** — Locked **100% reliability + synchronized window** as the coherent package; accept timezone-unfairness. Closed the old "~95%" sub-question.
- **v4 — 2026-06-03** — Settled the rule as **decomposable into ~3 independent parts** (the never-at-zero ramp), not one gestalt. Called out the generator constraints: independence and path-invariant evidence.
- **v3 — 2026-06-03** — Chose **crack-the-rule (deterministic)** over the probabilistic "read the odds" core, for leaderboard fairness. Separated the two axes the debate kept conflating: reliability and feedback structure.
- **v2 — 2026-06-03** — Added the deduction direction resolving the empty-maze problem; narrowed to two candidate cores; folded solo-play fulfillment in.
- **v1 — 2026-06-03** — First version of the new design: tile-based, first-person, real-time multiplayer race to a hidden exit, scored by steps, with a charted map, trap doors, secret routes, and encounters that stake and exchange map.
