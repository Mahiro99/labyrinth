# Daily Maze — React / Frontend Learning Syllabus

**Version:** v2 · **Last updated:** 2026-06-02

A high-level **syllabus**: the map of **React + frontend concepts** this project's client covers while building it, and roughly how deep. The game and its look live in [idea.md](idea.md); the **Go** server's learning plan lives in [go-syllabus.md](go-syllabus.md). This is the project's **secondary** learning track — the Go server is the primary one, and the frontend is the live client to it.

> **Calibrated to:** comfortable with JavaScript and the browser, **new to React**, writing **TypeScript**. So plain JS / DOM / ES idioms (modules, `async`/`await`, array methods, `fetch`) are **assumed** — not re-taught. React's mental model and hooks are the Core lift; TypeScript gets real practice (you already know types from Java — TS's twist is _structural_ typing and _union_ types, not the idea of types).

> **Scope note (deliberate):** build-order/sequencing and proof-of-learning checkpoints are **out of scope here** — same as the Go syllabus, they belong in a later build-path doc. This file stays the high-level map.

Depth legend: **Core** = covered thoroughly · **Solid** = real practice · **Light** = touched once, deliberately.

---

## Goal

Build a clean, live React client for the maze: a daily-window UI, a `<canvas>` that renders the fog-of-war grid and the crowd radar from a live WebSocket feed, and a leaderboard. Learn React properly (it's new), get real TypeScript practice, and go deep on the one part that's genuinely interesting here — bridging React with an imperative canvas render loop driven by a high-frequency socket.

---

## The heart of this project (frontend)

The defining frontend challenge here is **a React app whose state is driven by a live WebSocket stream, rendering a maze grid and crowd heat to a `<canvas>` at interactive framerates** — while React owns the chrome (timer, presence, leaderboard, screen phases). The interesting tension, and the thing worth getting right:

> **React's declarative "UI is a function of state" re-render model vs. an imperative, high-frequency canvas draw loop.** You do _not_ want React re-rendering on every socket message or every animation frame, and you do _not_ render thousands of cells as DOM nodes.

The resolution — and the analog to the Go server's contended-shared-state problem — is deciding what lives where: React state owns the **chrome and the screen phase** (lobby → running → results); **refs + a `requestAnimationFrame` loop** own the **hot game state and the canvas draw**. The socket feeds an imperative store that the draw loop reads; React only re-renders when chrome-level things change. Getting that boundary right is the frontend's "one genuinely hard idea" (see bottom).

---

## React fundamentals _(Core — new to you)_

- **The component model & JSX** _(Core)_ — components are functions returning UI; data flows down via props. The unit of composition.
- **The render model** _(Core)_ — "UI is a function of state": you don't mutate the DOM, you set state and React reconciles. This is the biggest mindset shift from imperative backgrounds (jQuery / Swing / direct DOM) — lean into it, then learn the escape hatch (refs) for the canvas.
- **`useState`** _(Core)_ — local component state; the setter triggers a re-render; state is immutable-by-convention (replace, don't mutate).
- **`useEffect`** _(Core)_ — side effects and **cleanup**. The WebSocket lifecycle lives here: open on mount, close on unmount, re-subscribe on dependency change. Dependency arrays and the cleanup function are the #1 beginner footgun — and the "close the connection on unmount" lesson is the direct cousin of Go's "make every goroutine exit cleanly."
- **`useRef`** _(Core — critical here)_ — a mutable box that does **not** trigger re-renders: the handle to the `<canvas>` DOM node, _and_ the home for hot game state (player position, revealed cells, the raf id) you don't want re-rendering React.
- **`useReducer` and/or Context** _(Solid)_ — model the app/game phase as a small state machine; a reducer fits the "incoming messages mutate state" shape well, and Context shares it without prop-drilling.
- **`useMemo` / `useCallback`** _(Light-Solid)_ — when (and when _not_) to bother; memoizing handlers/derived values to keep re-renders cheap.
- **Lists & keys** _(Solid)_ — leaderboard rows; why stable keys matter.
- **Conditional rendering** _(Solid)_ — swapping the screen by phase (countdown lobby / in-run / results).
- **Event handling & synthetic events** _(Solid)_ — `onClick` / `onChange` / form events on the chrome (the join button, the minimap toggle, replay); React's synthetic-event system; passing handlers down as props. (In-canvas movement is a different path — raw `keydown` on the window, not React events; see Canvas.)
- **Forms & controlled inputs** _(Light)_ — minimal here: a handle/name field, maybe a settings toggle; controlled vs uncontrolled inputs and the `value` + `onChange` loop. Present, not stressed.
- **Custom hooks** _(Core — very natural here)_ — the main way you reuse stateful logic. You'll extract the socket into `useWebSocket`, the draw loop into `useGameLoop`, and the window timer into `useCountdown`; once these click, the whole app composes from a few clean hooks. This is the React skill that ties the fundamentals together.
- **Rules of Hooks & the gotchas** _(Core — newcomer footguns)_ — call hooks only at the top level of a component or custom hook (never in a conditional/loop); trust the `exhaustive-deps` lint and understand the **stale-closure** trap it guards against (an effect, handler, or raf loop that captured yesterday's state — you _will_ hit this with the socket and the loop). And: in dev, **StrictMode double-invokes effects**, so your socket/loop setup must be idempotent and tear down cleanly — you'll see the connection open twice, and that's the lesson, not a bug.

## Canvas & the render loop _(Core — the deep cluster, project-specific)_

- **The Canvas 2D context** _(Core)_ — `getContext('2d')`, drawing rects, strokes, text, gradients: maze cells, walls, fog, the torchlight, the heat ramp. This is your renderer.
- **`requestAnimationFrame` loop** _(Core)_ — the game/draw loop, decoupled from React's render cycle. Start/stop it cleanly (cancel on unmount — same discipline as the socket).
- **Canvas ↔ React integration** _(Core — the hard part)_ — `useRef` to the canvas, draw imperatively from the raf loop reading a mutable store; React is the app _around_ the canvas, not the thing drawing it.
- **Camera / viewport math** _(Solid)_ — world (cell) coords → screen coords, camera centered on the player, scrolling as you move; only draw the visible window of a large maze.
- **Crisp rendering & resize** _(Solid)_ — `devicePixelRatio` for sharp pixels on retina, handling canvas resize.
- **Input handling** _(Solid)_ — `keydown` (arrows / WASD) → discrete cell moves; throttle so held keys don't spam; touch/swipe later.
- **Performance** _(Solid)_ — keep React out of the hot path; redraw cheaply; the radar/minimap update on their own cadence.

## Live data & networking _(Core)_

- **The browser `WebSocket` API** _(Core)_ — connect, `onmessage`, `send`, `onclose`; the live transport to the Go hub.
- **Applying server messages to state** _(Core)_ — handle `revealed-cell`, `heat-update`, `presence`, `window-state` messages and fold them into the game store / React state. The shape of these messages is the contract with the Go server.
- **Socket lifecycle in React** _(Core)_ — own it in `useEffect` with cleanup; don't leak connections across re-renders or unmounts.
- **Reconnect / resume** _(Solid)_ — rejoin mid-window and restore your charted map (server is authoritative; client re-syncs).
- **`fetch` for REST** _(Light)_ — non-live calls (leaderboard history, auth/session) over plain HTTP.

## TypeScript _(Solid)_

- **Interfaces / type aliases** _(Solid)_ — model `Cell`, `Coord`, `GameState`, the leaderboard row, and the WebSocket message types.
- **Discriminated unions** _(Core — the high-value TS lesson)_ — model the inbound socket messages as a tagged union (`{ kind: 'reveal', ... } | { kind: 'heat', ... } | …`) and handle them with an exhaustive `switch`. This is the TS analog of Go's typed message constants + `iota`, and the one TS idiom to actually internalize here.
- **Structural vs nominal typing** _(Solid)_ — flag where TS differs from Java: types match by _shape_, not by name; union types have no real Java equivalent; `unknown` vs `any` and why `any` is a smell.
- **Generics** _(Light)_ — meet them where they're natural (a typed event helper, a small generic store), not for their own sake.
- **Shared contract with Go** _(Light, optional)_ — keep the TS message types mirrored to the Go structs by hand for now (codegen is a later nicety); end-to-end typing from server to client is a real payoff.

## Styling & UI chrome _(Light-Solid)_

- **CSS layout for the panels** _(Solid)_ — flexbox/grid to place the exploration view, radar, minimap, and HUD around the canvas. Plain CSS or CSS Modules — keep it minimal.
- **The palette** _(Light)_ — the tight, curated palette from [idea.md](idea.md)'s look & feel; a clean monospace HUD for the roguelike flavor.
- **No heavy UI kit** _(Light)_ — no Material-UI/Chakra; the aesthetic is deliberately spare. Tailwind is an optional convenience, not a requirement.

## Tooling & workflow _(Solid)_

- **Vite** _(Solid)_ — dev server, hot-module reload, production build; the everyday loop and the React analog of `go run`/`go build`.
- **npm / pnpm** _(Solid)_ — package management; `package.json` scripts.
- **`tsconfig`, ESLint, Prettier** _(Solid)_ — type-checking config and the formatting/linting culture (the frontend's `gofmt`/`go vet`).
- **Browser devtools** _(Solid)_ — React DevTools for the component tree/state, and the Network → WS inspector for debugging the live socket (you'll live here).
- **Dev proxy to the Go server** _(Light)_ — Vite's proxy so the local client talks to the local Go backend without CORS friction.

---

## Concepts intentionally left out (v1)

Skipped honestly, good targets for later:

- **SSR / Next.js** — pointless for a canvas SPA behind a socket; a plain Vite SPA is the right tool.
- **Heavy state libraries (Redux, Zustand, …)** — `useReducer` + Context covers v1; reach for a store only if state genuinely sprawls.
- **WebGL / game engines (Pixi, Three.js)** — 2D canvas is plenty; only consider WebGL if profiling proves the 2D context is the bottleneck.
- **Routing (React Router)** — the app is one screen with internal phases; routing is barely needed.
- **Animation libraries** — simple raf tweens suffice; no Framer Motion etc.
- **Deep accessibility / mobile** — touched, not stressed (a canvas game is inherently awkward for screen readers; note it, don't solve it in v1).
- **The advanced React surface** — error boundaries, portals, `Suspense` / `lazy` / code-splitting, transitions (`useTransition` / `useDeferredValue`), and Server Components. None are needed for a single-screen canvas SPA fed by a socket. Worth knowing they exist; this project just won't push you to them. (An error boundary around the canvas is the one you might add later for robustness.)

## Honest limitations — what this track does NOT make you great at

- **It's a canvas-heavy app**, so you'll learn React's _escape hatches_ (refs, raf, imperative integration) as much as idiomatic component-tree React. You won't deeply exercise large component hierarchies, forms, complex routing, or a design system.
- **State management at scale** (Redux-style architectures) isn't stressed — the app's state is small and local.
- **It's the secondary track.** Depth is calibrated to "build a clean, live client," not "become a senior frontend engineer." The Go server is where the project pushes hardest.

---

## The one genuinely hard idea (frontend)

Bridging React's **declarative re-render** world with an **imperative, high-frequency canvas loop** fed by a **live WebSocket** — deciding what belongs in React state (chrome, screen phase, leaderboard) versus in refs and the draw loop (player position, revealed cells, the heat buffer), so React never re-renders on a per-message or per-frame basis. That boundary is the real frontend lesson, and the mirror image of the Go server's contended-shared-state problem. The **synchronized daily window** shows up here too, as a client-side countdown / phase machine that must agree with the server's clock.

---

## Changelog

- **v2 — 2026-06-02** — Audited React-fundamentals coverage and filled the gaps: added **event handling & synthetic events**, **custom hooks** (`useWebSocket` / `useGameLoop` / `useCountdown`), **Rules of Hooks** with the stale-closure and dev-only StrictMode-double-invoke gotchas, and **forms / controlled inputs** (Light). Listed the advanced React surface the project deliberately won't exercise (error boundaries, portals, `Suspense`/`lazy`, transitions, Server Components) so the coverage claim stays honest.
- **v1 — 2026-06-02** — Initial React/frontend syllabus, mirroring the Go [go-syllabus.md](go-syllabus.md) structure. Calibrated to "comfortable with JS, new to React, TypeScript." Scoped to this project's client: React fundamentals (Core), canvas + raf render loop (Core, the deep cluster), live WebSocket state (Core), TypeScript with discriminated-union messages (Solid), Vite tooling, and the canvas-vs-React boundary as the one hard idea.
