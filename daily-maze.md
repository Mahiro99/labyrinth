# Daily Maze — Design

**Version:** v1 · **Last updated:** 2026-06-03

Daily Maze is a once-a-day competitive maze game. Every day the server generates one maze, the same for every player. You drop in at a shared entrance and look for a hidden exit, first-person and in the dark. Everyone plays the same maze at the same time, in one bounded window. Your score is how few steps it takes to reach the exit; if you don't reach it, your score is how close you got. The next day there's a new maze.

This doc replaces the earlier top-down, single-player concept. The game is now first-person and real-time multiplayer.

## The loop

- One procedurally generated maze per day, identical for every player, with a shared entrance and a hidden exit. The entrance fans out into several paths right away, so the crowd splits immediately instead of funneling into one corridor.
- The maze is a grid of tiles. You move one tile at a time, and the map fills in tile by tile as you go — only tiles you've reached or lit are charted; the rest stay dark.
- A synchronized daily window: it opens for everyone at the same time and closes for everyone at the same time. Duration is not decided yet (see Open questions).
- First-person and blind. With the light off you see only the tile you're on and which ways out are open — enough to move, not enough to plan.
- A flashlight you can toggle on to light a radius around you, so you can see down corridors and read junctions ahead. It drains a finite battery. Every stretch is a choice: burn battery to move fast and see ahead, or stay in the dark to save it.
- The goal is to reach the hidden exit. It's a race.

## Scoring and failing

- Score is steps. Fewer is better.
- The leaderboard has two tiers: players who reach the exit, ranked by fewest steps, then below them players who don't, ranked by how close they got to the exit. Finishers always rank above non-finishers.
- There is no death and no mid-run elimination. The only thing that ends your run is the window closing.
- A dead battery is not a failure. You can still move in the dark; it's just slower and more error-prone, which costs you steps. The score already carries that cost, so there's no separate penalty.
- Everyone gets a result, including players who don't finish (see Sharing).
- The maze is sized so that reaching the exit is hard. Finishing is meant to be an achievement, not the default outcome.

## Your map

- As you move, the maze is charted for you automatically — tiles you've seen are marked, the rest stay dark. You don't draw it by hand; the server tracks it.
- Because the maze is the same for everyone, a charted map is portable: a tile you've revealed is a tile anyone could use.
- In a steps race, your map is stored progress. Knowing where corridors and dead ends are means fewer wasted steps. This is why the map matters: it's not the score, but it's what the score is made of.
- The map is also what you stake and win when you meet another player, and what you share at the end of the day.

## World mechanics

Two features make the maze worth exploring rather than just walking through:

- Trap doors. Stepping on one drops you somewhere else in the maze, with no warning. It might cost you (you land far from the exit) or help you (you skip ahead). Example: you're three tiles from where you think the exit is, you step on a trap, and you're suddenly back near the entrance — those are steps you don't get back.
- Secret routes. Some passages are hidden and bypass whole sections of the maze. Finding one is a direct payoff in a steps race: a shortcut means fewer steps. They're also what makes the "someone found a way through" moment happen on its own when many people play the same maze.

## Multiplayer

Everyone plays the same maze, and the server tracks where everyone is in real time, grouping concurrent players so they can see and meet each other.

- You can see other players and their flashlight beams. A beam sweeping across a far corridor tells you someone is over there, charting it.
- A live count of how many people are in the maze right now is shown ("N exploring"). That's the only crowd-wide signal — there's no spatial crowd map, since you can already see players and beams directly.
- When two players cross paths, an encounter starts. Each player chooses: raid or share.
- The stake and the prize are map. The winner sees part of the loser's charted map — useful intel, maybe a shortcut toward the exit. The loser loses a chunk of their map: those tiles go dark again and have to be re-charted, which costs steps. Nothing here is a hard loss; it all converts back into steps.
- Encounters are guarded so they don't spam when players are bunched up (for example at the crowded start). An encounter should be a deliberate one-on-one moment, not something that fires constantly in a swarm. The exact trigger rule is undecided (see Open questions).

How an encounter is decided is not settled yet. Two forms are on the table, and we like both:

- A — Choice. Both players choose at the same time, without seeing the other's choice, to share or steal. If both share, the maps pool and both gain. If one steals and the other shares, the stealer takes the sharer's map. If both steal, they clash and neither gains. The skill is reading the other player.
- B — Battery bid. Each player bids battery; the higher bid wins the exchange. This reuses the flashlight battery as the currency, so there's no new resource to learn. The skill is deciding how much of your seeing-ahead budget a raid is worth.

There is no party or cooperative map-pooling system beyond the encounter for now. Pooling maps cooperatively is a possible later addition, not part of this design.

The server is authoritative. It holds the true maze, sends each player only the tiles they've revealed (so no one can read the whole maze off the wire), tracks positions, and runs the encounter exchanges. The client just renders what it's told.

Instancing. There's a cap on how many players share one live instance. Everyone plays the same daily maze, but the crowd you can see and encounter is your instance. When a player joins, the server puts them in the emptiest instance that still has room — so crowds stay healthy rather than spread thin — and only opens a new instance once the existing ones are full. So with a cap of, say, 500, the 501st player to need a spot starts populating a second instance, and so on. The leaderboard is global across every instance, because steps on an identical maze are comparable. One mechanism handles both ends of the population problem: it caps the start-of-run swarm and it keeps off-peak players from exploring alone. The per-instance cap is undecided, and is probably much smaller than it sounds — a few dozen reads as a livelier, more legible crowd than hundreds.

## Sharing

Like Wordle, the result is shareable without spoiling the maze for people who haven't played.

- Run-strip. A short, spoiler-free summary of your run you can post any time, even mid-window. It shows your result and the shape of your run, but nothing about where things are. Example:

```
Daily Maze #142 🏁 47 steps · top 12%
🟩🟩🟩🟥🟩⬛🟩🟩🟩🏁
(🟩 progress · 🟥 backtrack · ⬛ dead end)
```

  A non-finisher gets the same strip without the 🏁 — a ⏳ and a closeness marker instead.
- Full path. After the window closes, the maze is revealed to everyone anyway, so a richer share opens up: your full route drawn over the solved maze. This is fine post-window because there's nothing left to spoil.

## Look and rendering

- The view is first-person. The dark, the flashlight radius, and other players' beams are the whole look.
- The render approach is not decided: a raycast renderer (Wolfenstein-style wall slices on a 2D canvas, no 3D engine) or a 3D renderer (Three.js). Raycast is cheaper and keeps the client simple; 3D looks better, especially for beams in the dark. See Open questions.
- The client is a dumb renderer either way — it can't build the maze itself, it only draws the tiles the server sends.

## Stack

- Go server: the authoritative maze, the real-time hub (positions, presence, encounters), and the WebSocket connection to each player. This is the main part of the project. The Go learning plan is in [go-syllabus.md](go-syllabus.md).
- React + TypeScript client: the shell, the HUD, and the renderer. The frontend plan is in [react-syllabus.md](react-syllabus.md).
- Postgres: durable state — the day's seed, saved maps, the leaderboard.
- Deploying to a public URL so strangers can actually play is a real goal, not an afterthought.

## Open questions

- Window duration. How long the daily window stays open. It's a balance lever: window length, maze size, and how many people are playing together decide how often players actually cross paths, which is what makes encounters happen.
- Encounter form. A (choice) or B (battery bid), or some mix.
- Render approach. Raycast or Three.js.
- Encounter trigger rule. How an encounter fires without spamming in a crowd. Candidates (likely a mix): a no-encounter grace zone for the first few tiles near the entrance; a per-player cooldown between encounters; and firing only on a clean one-on-one — for instance when two players end up adjacent and facing each other (there's no collision, so they can share a tile, but a deliberate face-off is what triggers it).

## Mahir's questions

Bigger open tensions to come back to, not just undecided knobs:

- Timing / period / cycle. Grouping the live crowd is handled by instancing (decided — see Multiplayer), so what's left is the window itself: a single synchronized daily event (everyone drops in at one set time — densest crowd, but timezone-unfair and least convenient) versus an open window you can play anytime during the day (convenient and Wordle-like; instancing groups whoever's concurrently online, though off-peak instances will still be small). Window duration and timezone handling fall out of this. Not decided.
- Solo-play fulfillment. Is a run where you never meet anyone fulfilling enough on its own? Current read: yes — the solo loop (blind flashlight race, traps, shortcuts) plus async competition (same maze, steps leaderboard, run-strip) is a complete game, and encounters are the differentiating ceiling rather than the fun floor. Open question is whether that's actually enough, or whether encounters should be load-bearing. Tied to timing: if solo holds up, the convenient play-anytime model is de-risked.

## Parked

Recorded so we don't relitigate, but not part of this design:

- Party / cooperative map-pooling.
- Warmth / proximity hint. Graded feedback on how close you are to the exit — about four bands, Cold to Burning, by straight-line distance — readable only while the light is on. The direct Wordle analog (graded hints); agreed in principle earlier, but not part of this design yet.
- Maze Runner mechanics — closing walls that seal the maze as the window ends (a hard-fail that conflicts with the soft-fail rule above), and a maze that visibly reshapes (walls moving), rather than just a fresh maze each day. Good for tension and theme; add once the core loop works.
- Seasons (a persistent dungeon and leaderboard across many days), prizes, cosmetics.
- Territories, alliances, and other emergent-social systems.

## Changelog

- **v1 — 2026-06-03** — First version of the new design: a tile-based, first-person, real-time multiplayer race to a hidden exit, scored by steps, with a charted map as the player's asset, trap doors and secret routes, and player encounters that stake and exchange map. Replaces the earlier top-down, single-player concept. Keeps a live presence count but drops the spatial crowd heatmap as redundant with direct presence. Window duration, encounter form, and render approach left open.
