# Daily Maze — The Rules System

**Version:** v12 · **Last updated:** 2026-06-05

This doc is about the **hidden rule** a player has to figure out each day. The big-picture game design and the locked-in decisions live in [daily-maze.md](daily-maze.md) (see "The deduction core"); this doc works out the rule itself.

**The game, in one paragraph:** Daily Maze is a once-a-day race through a maze you explore first-person by a small moving light — a tile or so glows around you, and everything past it is **fog** in the dark. Everyone plays the same maze that day. Your score is the **number of steps** it takes to reach the hidden exit (fewer is better), and there's a shared **leaderboard**. The light travels with you and charts the maze as you go, but it's built to never give away an *answer*: you can see that a corridor keeps going, never far enough to see where it ends.

The short version of *this* doc: each day the maze is built from a secret rule. At every fork, the marks on the walls tell you which way is correct — *if* you can read them. Players don't get told what the marks mean; they figure it out by walking, getting it wrong, and noticing the pattern. 

## What the maze is

1. The maze is a **2D grid of square cells**, but you play it **first-person 3D** — a Wolfenstein-style corridor view rendered from the grid.
2. Every cell has 4 walls; a knocked-out wall is a **passage**. The maze is just which walls are open.
3. One open way is always behind you, so your **forward choices = (ways open) − 1**: a dead-end (1) or corridor (2) gives no choice, a **T-junction** (3) gives 2, a **+ crossroads** (4) gives 3.
4. So you never choose between more than **3**.
5. **Only junctions (3+ ways open) carry the marks** — corridors and dead-ends have nothing to read.

## The marks: runes with hidden voices

This is the heart of the game — a little symbol language you decode.

6. There are **5 runes** total — 5 distinct symbols (e.g. ▲ ● ◆ ✶ ⬡). They're the alphabet. The same rune can appear at many junctions across the maze.
7. Each branch at a junction is labeled with **1–5 runes**, all **distinct** — a rune never repeats on a branch (a repeat would *weight* it, and there are no weights). Which runes, and how many, is what the maze-builder places — and it guarantees enough **single-rune branches** to give clean footholds (#23).
8. Every rune has a hidden **voice** — what it secretly means that day, i.e. how it behaves. There are **3** possible voices, and figuring out which voice each rune has is the secret you crack each day:
   - **TRUTH** — this rune says "this branch is good."
   - **LIE** — this rune says "this branch is good," but it's lying — it's bait.
   - **MUTE** — this rune says nothing; it adds 0 to a branch's score. (But silence has teeth: a branch made of *only* mutes is a trap door — see "Trap doors" below.)
9. **A rune's voice is the same everywhere that day.** If ▲ is TRUTH today, it's TRUTH at every junction — that consistency is exactly what lets you learn it by watching it across the maze. Tomorrow the voices are reshuffled.

## How a junction is decided

10. Each branch is scored by **its own runes** (the marks don't point elsewhere — they describe the branch they're on):
    - a **TRUTH** rune = **+1** for that branch,
    - a **LIE** rune = **−1**,
    - a **MUTE** rune = **0**.
11. Add up each branch's runes. **The highest-scoring branch is the correct one.** The maze is **built around this** — the builder places runes so that following the highest score at every junction leads from entrance to exit. The correct branch always **strictly** outscores every other — the builder never leaves a tie at the top (ties between *losing* branches don't matter).
12. **Worked example.** Say today: **▲ = TRUTH · ● = LIE · ◆ = LIE · ✶ = TRUTH · ⬡ = MUTE**. You hit a + crossroads:

    | Branch | Runes shown | Score |
    |--------|-------------|-------|
    | LEFT | ▲, ● | +1 − 1 = **0** |
    | FORWARD | ◆, ⬡ | −1 + 0 = **−1** |
    | RIGHT | ✶, ▲, ⬡ | +1 + 1 + 0 = **+2** |

    **RIGHT wins (+2)** → that's the correct branch. FORWARD (−1) is the trap. ⬡ being MUTE did nothing to these scores — but a branch made of *nothing but* ⬡-type silence is its own danger (see "Trap doors"), and emptiness is also a weapon at the keystone.
13. **No single rune is a guaranteed "dead end."** Because the winner is just the *highest* score, a lone LIE doesn't doom a branch and a lone TRUTH doesn't save it — it's always relative to the other branches. The most valuable thing to know (which way is safe) is never handed to you by one symbol.

## Trap doors — the cost of stacked silence

Trap doors are part of the rune language, not a random hazard bolted on:

- A branch marked with **only MUTE runes — two or more, with no TRUTH or LIE among them** — is a **trap door**. Step on it and you're flung elsewhere in the maze (a big step loss), not just sent to a dead-end.
- **Consistent with scoring:** a pure-mute branch sums to 0, so it's never the correct (highest) branch anyway. The trap only catches a player who hasn't yet cracked *which* runes are MUTE — once you have, you see the silence coming and walk around it. So trap doors **reward** decoding rather than punishing blindly. (For someone who hasn't cracked it, the drop comes with no warning — which is the whole game.)
- **Why two or more, not one:** a single mute can't doom a branch (rule #13) — it takes a *pattern* of silence. A lone mute is still just ignored.
- **This is what makes MUTE matter in the moment:** MUTE is the rune you actively watch for, because a branch *full* of it is the floor dropping out. Silence = danger.
- **Where it flings you:** a **deterministic** destination baked into the maze — a function of the *trap's* location, never your path (different players reach a trap by different routes, so a path-relative throwback would break fairness #19). Default: back to the **entrance**; the generator may place a nearer anchor to soften the drop. The step-loss is just whatever that throwback costs you — start harsh, tune in playtest.
- **Generator's job:** keep trap doors off the correct path (a pure-mute branch is never the highest-scoring one) and verify the maze is still solvable with the teleport in place (guarantee #21).

## How a player cracks it

14. You start knowing nothing. You guess.
15. A wrong guess sends you into a trap or dead-end — wasted steps. You backtrack and try another branch.
16. Do that a few times and a rune's behavior shows up ("every branch with ◆ on it seems to be a trap… ▲ seems to mean good"). That's how you learn one rune's voice. **The wrong turns aren't punishment — they're the evidence.** There's no "correct!" buzzer; getting burned is the only way to learn.
17. There are **5 runes**, so cracking the day = figuring out the voice of each. That's **5 things to deduce, each learnable on its own** by watching that one rune across junctions. Each rune is TRUTH/LIE/MUTE, so it's 3 possibilities each → **3⁵ = 243 distinct daily rules**. That's the replayability: the alphabet is fixed, the voices are reshuffled every day.

## The one rule that keeps it from overloading

18. **One hidden layer per day, always a visible floor.** The mental load comes from what you must *infer*, not what you *read* — visible info is nearly free, hidden info is the puzzle. The **voices are the one hidden layer**. Anything else a rune carries (for example a visible direction arrow, defined later) must be **visible**, never a second thing to deduce at the same time. And there must always be at least one rune whose voice is cleanly learnable early, so nobody is ever stuck at zero. This is the guardrail that keeps a 5-rune logic puzzle from tipping into homework.

## What the maze-builder has to guarantee

Every day, automatically, with nobody checking by hand, the maze-builder (the program that generates the day's maze) has to produce a maze with all of these:

19. **Same for everyone** — the same day's seed gives every player the identical maze. The leaderboard only makes sense if everyone raced the same maze. (Easy: just seed the random-number generator.)
20. **Fresh each day** — a new voice assignment each day, ideally not a recent repeat. This is what stops the game from being "crack it once, then it's just fog-clearing forever."
21. **Actually solvable** — the maze can really be finished *if* you read the runes right. The builder has to check this on every maze, never just assume it.
22. **Only one possible answer** — the voices a player deduces have to be the *only* set of voices that fits everything they've seen. If two different voice assignments would both explain the marks they've passed, there's no single right answer to land on, and the puzzle is broken. This is the hardest one to guarantee and the most likely to go wrong.
23. **Always a foothold** — a player must never be totally stuck with zero progress. At least one rune's voice must be simple to crack on its own (e.g. a rune that shows up alone on branches often enough to read clearly). The harder runes and the keystone are fine *on top* of that — as long as there's always an easy foothold first. In particular, the **very first junction** is a clean single-rune choice, so the opening lesson lands instead of overwhelming.
24. **Learnable no matter your route** — whatever path a player happens to walk, they must run into enough **teaching moments** — junctions where guessing wrong visibly fails — to learn each rune's voice. If someone's route never clearly shows a given rune, they'd be stuck by bad luck instead of bad skill, which is exactly what we're trying to avoid.
25. **The light never gives away an answer** — because the player explores by a small moving light (about one tile in each open direction — see [daily-maze.md](daily-maze.md)), the builder must place the maze so that **no branch resolves within the lit radius of a junction**: no dead-end and no loop-back is ever visible from the fork it would decide. A branch may *continue* in view — that leaks its shape, not the solution — but it may never be seen to *end*. Otherwise geometry answers a fork the runes exist to answer, and the marks go dead exactly where they should matter most. (Footholds (#23) still come from short dead-ends — just ones sitting a step past the light, not inside it.)

## The keystone (the hard bonus, the brag)

The voices are the everyday puzzle. The **keystone** is one or two extra, harder twists per day that sit *on top* — the thing players post about. It must stay at the top layer so it never breaks "only one answer" (#22) for everyone below.

26. **Meaning from what's missing (omission).** A twist keyed off a rune that *isn't* there. Example: *"at any junction where no MUTE rune appears, every LIE flips to TRUTH."* You can only spot this once you already know the alphabet — which is why it's a late-game capstone, not a beginner's foothold. **MUTE does double duty:** in the moment its *saturation* marks trap doors (a branch full of it drops you — see "Trap doors"), and at the keystone its *absence* flips the board. So MUTE is the rune you read both ways — by too much of it (trap) and by none of it (flip). Far from dead weight, it's the most attention-worthy rune on the wall.
27. **The visible vector (a rune that points).** A rune can also carry a **direction arrow** you always *read* (never deduce). On a normal day the arrow is cosmetic — it doesn't affect which branch is correct. On a keystone day it becomes the thing that decides the answer — e.g. *"ignore the scores; follow the one TRUTH rune's arrow."* This is how a rune can be both a **definition** ("good branch") *and* a **vector** ("go this way") — but only one of those decides the answer on a given day, never both, so it never doubles the hidden layer (#18). (Exactly how an arrow resolves to a branch is still open — see #29.)
28. **Compositional, not surprise.** Combinations of runes mean the **sum of their parts** (the scoring in #10–12 already is this) — predictable, so learning runes separately is enough to read them together. Brand-new "emergent" meanings, if ever used, are confined to the keystone and never the everyday layer.

## Still open

29. **How the vector resolves to a branch** (for keystone days) — does the arrow point *at* a branch geometrically, or sit *on* a branch? Parked until we build the keystone.
30. **Which keystone, when.** The menu of keystone twists (#26–27) and how the builder picks one per day without breaking "only one answer."

## Superseded (don't relitigate)

(You haven't seen this earlier system described anywhere above — it's recorded here only so we remember why we moved off it.) The earlier candidate was a **flat 5-axis system**: each branch showed a shape + color + dot-count, and the day's rule was a setting of 5 separate axes (which shape is "live," which color, low/high dots, even/odd dots, a direction tiebreak) applied as a **narrowing chain**. We replaced it with the rune-voice language above because the chain had a fatal flaw — the later axes (even/odd, direction) only fired when earlier ones tied, so players almost never saw them and couldn't learn them (the "rarely-seen-rule problem"). The rune-voice system fixes this: all 5 runes contribute at once (no chain), so every rune gets seen and is learnable. The "shape + color + count" vocabulary and the narrowing chain are both retired.

## Changelog

- **v12 — 2026-06-05** — Resolved five **open questions** into the rules and deleted them from "Still open." **Runes per branch:** locked at **1–5 distinct runes** — no repeats, since a repeat would be a weight and there are no weights — with single-rune branches guaranteed as footholds (→ #7). **Ties:** the correct branch must **strictly** outscore every other; the builder never leaves a top tie (→ #11). **First junction:** the opening fork is a clean single-rune read (→ #23). **Trap-door destination:** deterministic, a function of the trap's location (default: the entrance), step-loss emergent and playtest-tuned (→ Trap doors). **Teaching-moment density:** dropped as already covered by #24. "Still open" now holds only the two keystone-dependent questions — vector-resolve (#29) and keystone selection (#30).
- **v11 — 2026-06-05** — Cleanup pass. (1) Removed the **Demos** section — three throwaway HTML demos for the retired shape/count system, out of date, and `maze-play-demo.html` already deleted. (2) Cut the **dots / weights** mechanic entirely: dropped the open-question, the "or a dot count" example in #18, and the "vector/dots" tiebreak mention — runes stay pure ±1, no weights anywhere in the live design (the only remaining mention is the *Superseded* autopsy of the old count system). Renumbered the open questions (now #29–35) after the cut. (3) Tightened **"What the maze is"** — kept the load-bearing facts (forward choices = ways−1, max 3, only junctions carry marks) and cut the "everyone knows what a maze is" filler and the per-row table.
- **v10 — 2026-06-05** — Swapped the "blind, in the dark, see only what you've walked" framing for a **small moving light** (about one tile in each open direction): you explore by a tight pool of light that charts the maze as it touches it. Added builder guarantee #25 — **the light never gives away an answer**: the generator must keep every dead-end and loop-back *out of the lit radius of the junction it would decide*, so geometry never pre-empts the runes (a branch may be seen to *continue*, never to *end*). This is the fix for "a visible dead-end makes that junction's runes pointless." Renumbered the keystone (now #26–28) and the open questions (now #29–36) below the new guarantee and updated the cross-references.
- **v9 — 2026-06-05** — Folded **trap doors into the rune language**: a branch marked with only MUTE runes (≥2, pure silence) is a trap door — flung elsewhere, not just dead-ended. This gives MUTE a moment-to-moment job (you watch for stacked silence), so MUTE now does **double duty** — saturation = trap, absence = the keystone flip — and is no longer "dead until the keystone." Added a "Trap doors" section, rewrote the MUTE rationale (#26), and added open item #35 (trap-door destination must be deterministic). Trap doors are now punishment-only (the old "might help" upside was the secret-route idea, already cut). Also synced the intro to the flashlight removal (dropped "or lit" — you now see only what you've walked).
- **v8 — 2026-06-03** — Recorded the rationale for MUTE (#26): it's dead weight in the moment (adds 0) but earns one of the 3 voices because its payoff is *deferred to the keystone* (it's the hinge the omission twist swings on). The mechanic was already in the doc; this states the *why* so "a do-nothing property" reads as deliberate.
- **v7 — 2026-06-03** — Replaced the flat 5-axis shape/color/count system with the **rune-voice language** (now the decided design, not an alternative): 5 runes, each secretly TRUTH / LIE / MUTE that day (3⁵ = 243 daily rules); each branch scored by its own runes (TRUTH +1, LIE −1, MUTE 0), highest branch wins; no dots to start. Cracking = deducing the 5 voices, each learnable alone. Added the **overload guardrail** ("one hidden layer per day, always a visible floor"). Recast the layered "language" as the **keystone** (omission/emergent + the visible vector), with a rune able to be a definition *and* a vector but only one load-bearing per day. Moved the old 5-axis/narrowing-chain system to "Superseded" (it caused the rarely-seen-rule problem, which the all-at-once scoring fixes). Flagged the demos as out of date. Reset the open questions to the live ones (one-vs-many runes per branch, dots in/out, vector resolve, ties, teaching density, first junction, keystone selection). Landed with a fresh-reader/consistency review: defined "voice" as a concept, glossed "load-bearing"/"flavor" (→ cosmetic vs. decides-the-answer) and "Wolfenstein," fixed a dangling "(see the keystone)" forward ref, moved the "(ways open) − 1" rationale before "ways forward," restored the keystone count to **one or two** twists/day, and noted the arrow-resolve is parked (#30).
- **v6 — 2026-06-03** — Clarity fixes from a fresh-reader review: standalone "the game in one paragraph" framing, glossed "Wolfenstein-style," fixed a "rune"→"rule" slip, added a forward note for "still in the running," a worked micro-example of meaning-from-absence, glossed the *Tunic/Outer Wilds* reference, and a concrete "hundreds of daily rules" number.
- **v5 — 2026-06-03** — Plain-language pass across the whole doc. Same decisions, simpler words; verb-y section headings. No design content changed.
- **v4 — 2026-06-03** — Bumped the (then) simple ruleset from ~3 to ~5 sub-rules and added the layered rune language as an alternative (since promoted to the design in v7).
- **v3 — 2026-06-03** — Replaced strict "no sub-rule depends on another" with **"always a foothold"** (the real goal is never being stuck at zero). Opened the door to a richer rune system where sets and missing runes carry meaning.
- **v2 — 2026-06-03** — Cut an earlier essay down to a tight numbered list. Fixed the structure line: 2D grid model, first-person 3D render — both true.
- **v1 — 2026-06-03** — First version: maze structure, what the rule does, the ~3-sub-rule split with a shape/count example, the learning loop, the maze-builder guarantees, and open questions.
