# CLAUDE.md

"電気イスゲーム" (Electric Chair Game) — a 2-player, multi-device web game. The defender picks chairs while avoiding the "out" the attacker has set, racing to reach a score of 40.

## Project layout

- The app lives under **`lenge-game/`**. The repo root holds only the design docs (`design.md`, `flowchart.md`).
- Run all commands inside `lenge-game/`.
- See [design.md](design.md) for full specs — game rules, decision logic, and the phase roadmap are the source of truth there.

## Tech stack

- React 19 + TypeScript + Vite
- Routing: `react-router-dom` v7 (`/` and `/game/:roomId`)
- Realtime sync: Supabase (`@supabase/supabase-js`) — Realtime + Presence
- QR codes: `qrcode.react`
- Styling: plain CSS (`index.css` / `App.css`), themed via CSS variables

## Commands

Run inside `lenge-game/`. Use PowerShell 7 (pwsh) for shell commands:

```powershell
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint
npm run preview  # preview the production build
```

## Architecture

### State management

- All game state lives in a single `GameState` ([src/types.ts](lenge-game/src/types.ts)).
- State transitions are centralized in the `useReducer` reducer ([src/useGameState.ts](lenge-game/src/useGameState.ts)). **All game rules and win/loss decisions belong here** — do not scatter logic into screen components.
- The `useRoom` hook ([src/hooks/useRoom.ts](lenge-game/src/hooks/useRoom.ts)) owns the two-way Supabase sync:
  - `dispatch` → run `reducer` locally (optimistic update) → write to Supabase
  - Subscribe to Realtime `postgres_changes` (UPDATE) → receive the opponent's changes and `setGameState`
- Spectating uses `useSpectatorRoom` (read-only, no dispatch).

### Supabase integration

- The table is `rooms` (`id`, `game_state` JSONB, `player1_token`, `player2_token`, `created_at`, `expires_at`).
- `Set<number>` fields (`deactivated` / `outNumbers`) are not JSON-serializable, so `serialize` / `deserialize` ([src/lib/roomUtils.ts](lenge-game/src/lib/roomUtils.ts)) convert to/from `number[]`. **When you add a field to `GameState` that is a non-JSON type (Set, etc.), you must update these functions.**
- Room creation `createRoom` / joining `joinRoom` also live in `roomUtils.ts`.
- Player identity: a `crypto.randomUUID()` token and `playerIdx` are stored in `localStorage` (keys `room_${roomId}_*`).
- The Supabase client is a singleton ([src/lib/supabase.ts](lenge-game/src/lib/supabase.ts)); it throws at startup if env vars are missing.
- Presence: disconnect detection uses the `players_${roomId}_presence` channel; spectator count uses `spectators_${roomId}`.

### Phases and screens

`GameState.phase` drives which screen renders ([src/App.tsx](lenge-game/src/App.tsx)):
`START → LOBBY → WAITING_LOBBY → SETTER_SETUP → CHOOSER_PICK → RESULT → (GAME_OVER | next cycle)`.
For a given phase, the attacker and defender see different screens (the active player vs. `WaitingScreen`).

### Timer

- To keep a shared reference across devices, `timerStartedAt` (ISO string) is synced in `game_state`, and each device computes the remaining seconds from elapsed time ([src/components/CountdownTimer.tsx](lenge-game/src/components/CountdownTimer.tsx)). The design does not depend on each device's absolute `Date.now()`.

## Environment variables

Set in `lenge-game/.env.local` (`.env*` is gitignored — never commit values):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | anon/public key (client-only) |

Never include the `service_role` key in the client bundle.

## Implementation notes

- Constants (`WIN_SCORE=40` / `MAX_OUTS=3` / `MAX_TURNS=16` / `LENGE_COUNT=12`) are defined in [src/types.ts](lenge-game/src/types.ts). Do not hardcode magic numbers.
- The displayed turn is `ceil(turn/2)` of the internal cycle `turn` (1–16 → 1–8).
- The win/loss decision priority (score reached → out limit → max turns → one chair left → no comeback possible → continue) is governed by `design.md` §5.3. Preserve this order when editing the reducer.
- When you add a new phase or action, update the `Phase` / `Action` types and the branching in `App.tsx` together.
