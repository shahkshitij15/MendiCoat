# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiplayer real-time implementation of the Indian card game Mendikot (see `rules.md` for full rules). Players join via a shared link, no accounts required. Supports 4, 6, or 8 players in two teams.

## Commands

### Backend (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app                    # Dev server on :8000 (no --reload; restart manually after changes)
pytest                              # All tests
pytest tests/test_trick.py         # Single test file
pytest -k "test_trump"             # Single test by name
```

### Frontend (React/TypeScript)
```bash
cd frontend
npm install
npm run dev                         # Dev server on :5173
npm run build
npm run typecheck                   # tsc --noEmit
npm run lint
```

## Architecture

### State Model
All game state lives in server memory — no database. The room manager holds a dict of `room_code → Room`. A `Room` contains an ordered list of `Player` objects (in seating order) and a `GameState`. Rooms are created on demand and cleaned up when empty or timed out.

### Game State Machine
`game_state.py` drives the state machine through three phases: `LOBBY → PLAYING → DONE`. The `PLAYING` phase tracks: whose turn it is, cards played in the current trick, whether trump has been established, and tricks won by each team.

### Turn Order
Play is **anticlockwise** — turn advances as `(current_index - 1) % num_players`. This applies to trick leading, dealing, and next-dealer determination. Team assignment is always alternating seats: even seats vs. odd seats.

### Trump (Cut Hukum)
Trump starts as `None`. When a player plays off-suit, the server checks if `trump_suit is None`. If so, it sets `trump_suit` to that card's suit and broadcasts `trump_set`. The server must validate that the player genuinely could not follow suit before accepting the off-suit play.

### WebSocket Protocol
All real-time communication after room creation is WebSocket. The client sends intent; the server validates, mutates state, and broadcasts results. The server sends different payloads per connection where needed (e.g., `game_started` sends only that player's hand). See README for the full message type reference.

### Hand Privacy
Each player's hand is only ever sent to their own WebSocket connection. Broadcast events never include hand data — only played cards, trick results, and public game state.

### Deck Variants
- 4 players: standard 52 cards, 13 each
- 6 or 8 players: 48 cards (four 2s removed), 8 or 6 each

### Scoring Logic
Winner is the team with 3+ tens. Tie on tens (2 each) → team with 7+ tricks wins. Mendikot = all 4 tens captured. Mangya Coat = all tricks captured. Next dealer: dealer's team loses → same dealer (unless whitewashed → partner deals); dealer's team wins → deal passes right.

### Reconnection
Player identity is `room_code + name`. On reconnect, replace the stored WebSocket on the matching player object and resume. Pause the game while a player is disconnected; abandon after a timeout.
