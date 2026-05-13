from __future__ import annotations
import random
import string
from models.room import Room
from game.game_state import GameState

_rooms: dict[str, Room] = {}


def _generate_code(length: int = 4) -> str:
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=length))
        if code not in _rooms:
            return code


def create_room(num_players: int, host_name: str) -> tuple[str, object]:
    code = _generate_code()
    room = Room(code=code, num_players=num_players)
    room.game_state = GameState(num_players=num_players, dealer_seat=0)
    host = room.add_player(host_name)
    _rooms[code] = room
    return code, host


def get_room(code: str) -> Room | None:
    return _rooms.get(code.upper())


def remove_room(code: str) -> None:
    _rooms.pop(code.upper(), None)


def all_rooms() -> dict[str, Room]:
    return _rooms
