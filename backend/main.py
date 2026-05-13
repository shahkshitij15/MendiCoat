import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

load_dotenv()

from models.card import Card, Suit
from game.game_state import Phase
from game.room_manager import create_room, get_room, remove_room

app = FastAPI(title="MendiCoat")

_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# REST — room bootstrap only
# ---------------------------------------------------------------------------

class CreateRoomRequest(BaseModel):
    num_players: int
    host_name: str

    @field_validator("num_players")
    @classmethod
    def validate_num_players(cls, v: int) -> int:
        if v not in (4, 6, 8):
            raise ValueError("num_players must be 4, 6, or 8")
        return v

    @field_validator("host_name")
    @classmethod
    def validate_host_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/room", status_code=201)
async def create_room_endpoint(req: CreateRoomRequest):
    code, _ = create_room(req.num_players, req.host_name)
    return {"room_code": code}


@app.get("/room/{code}")
async def get_room_info(code: str):
    room = get_room(code)
    if not room:
        raise HTTPException(404, "Room not found")
    return {
        "room_code": room.code,
        "num_players": room.num_players,
        "players": [p.to_dict() for p in room.players],
        "phase": room.game_state.phase,
    }


# ---------------------------------------------------------------------------
# WebSocket helpers
# ---------------------------------------------------------------------------

async def _send(player, message: dict) -> None:
    if player.ws and player.connected:
        try:
            await player.ws.send_text(json.dumps(message))
        except Exception:
            player.connected = False


async def _broadcast(room, message: dict) -> None:
    data = json.dumps(message)
    for player in room.players:
        if player.ws and player.connected:
            try:
                await player.ws.send_text(data)
            except Exception:
                player.connected = False


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/{room_code}/{player_name}")
async def ws_endpoint(ws: WebSocket, room_code: str, player_name: str):
    await ws.accept()
    player_name = player_name.strip()

    room = get_room(room_code)
    if not room:
        await ws.send_text(json.dumps({"type": "error", "message": "Room not found"}))
        await ws.close()
        return

    gs = room.game_state

    # Reconnect path: player already seated
    player = room.get_player(player_name)
    if player:
        player.ws = ws
        player.connected = True
        await _send(player, {
            "type": "reconnected",
            "hand": [c.to_dict() for c in player.hand],
            "your_seat": player.seat,
            "your_team": player.team,
            **gs.public_state(),
            "players": [p.to_dict() for p in room.players],
        })
        await _broadcast(room, {"type": "player_connected", "player": player.name})
    elif gs.phase == Phase.LOBBY:
        # New join
        try:
            player = room.add_player(player_name)
        except ValueError as e:
            await ws.send_text(json.dumps({"type": "error", "message": str(e)}))
            await ws.close()
            return
        player.ws = ws
        player.connected = True
        await _broadcast(room, {
            "type": "player_joined",
            "players": [p.to_dict() for p in room.players],
            "num_players": room.num_players,
        })
    else:
        await ws.send_text(json.dumps({"type": "error", "message": "Game already in progress"}))
        await ws.close()
        return

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            await _handle(ws, room, player, msg)
    except WebSocketDisconnect:
        player.connected = False
        await _broadcast(room, {"type": "player_disconnected", "player": player.name})


# ---------------------------------------------------------------------------
# Message dispatcher
# ---------------------------------------------------------------------------

async def _handle(ws: WebSocket, room, player, msg: dict) -> None:
    msg_type = msg.get("type")
    gs = room.game_state

    if msg_type == "start_game":
        if gs.phase != Phase.LOBBY:
            await _send(player, {"type": "error", "message": "Game already started"})
            return
        if player.seat != 0:
            await _send(player, {"type": "error", "message": "Only the host can start the game"})
            return
        if not room.is_full():
            await _send(player, {
                "type": "error",
                "message": f"Waiting for {room.num_players - len(room.players)} more player(s)",
            })
            return

        gs.start(room.players)

        # Send each player only their own hand
        for p in room.players:
            await _send(p, {
                "type": "game_started",
                "hand": [c.to_dict() for c in p.hand],
                "your_seat": p.seat,
                "your_team": p.team,
                "current_turn": gs.current_turn,
                "dealer_seat": gs.dealer_seat,
                "players": [pl.to_dict() for pl in room.players],
            })

    elif msg_type == "play_card":
        if gs.phase != Phase.PLAYING:
            await _send(player, {"type": "error", "message": "Game is not in progress"})
            return

        card_data = msg.get("card", {})
        try:
            card = Card(suit=Suit(card_data["suit"]), rank=card_data["rank"])
            events = gs.play_card(player.seat, card, room.players)
        except (ValueError, KeyError) as e:
            await _send(player, {"type": "error", "message": str(e)})
            return

        for event in events:
            await _broadcast(room, event)

        # After round_over, reset phase to lobby so players can start a new round
        if gs.phase == Phase.DONE:
            gs.phase = Phase.LOBBY  # allow re-start without recreating room

    elif msg_type == "new_round":
        if gs.phase not in (Phase.LOBBY, Phase.DONE):
            await _send(player, {"type": "error", "message": "Cannot start new round now"})
            return
        if player.seat != 0:
            await _send(player, {"type": "error", "message": "Only the host can start a new round"})
            return

        gs.phase = Phase.LOBBY
        # Dealer already advanced in score_round via dealer_seat; start fresh
        gs.start(room.players)
        for p in room.players:
            await _send(p, {
                "type": "game_started",
                "hand": [c.to_dict() for c in p.hand],
                "your_seat": p.seat,
                "your_team": p.team,
                "current_turn": gs.current_turn,
                "dealer_seat": gs.dealer_seat,
                "players": [pl.to_dict() for pl in room.players],
            })

    else:
        await _send(player, {"type": "error", "message": f"Unknown message type: {msg_type}"})
