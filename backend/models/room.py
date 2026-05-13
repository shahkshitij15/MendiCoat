from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from models.player import Player

@dataclass
class Room:
    code: str
    num_players: int
    players: list[Player] = field(default_factory=list)
    # game_state is attached after import to avoid circular deps
    game_state: object = field(default=None)

    def is_full(self) -> bool:
        return len(self.players) == self.num_players

    def get_player(self, name: str) -> Player | None:
        return next((p for p in self.players if p.name == name), None)

    def add_player(self, name: str) -> Player:
        if self.is_full():
            raise ValueError("Room is full")
        if self.get_player(name):
            raise ValueError("Name already taken in this room")
        seat = len(self.players)
        player = Player(name=name, seat=seat, team=seat % 2)
        self.players.append(player)
        return player
