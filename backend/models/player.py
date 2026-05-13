from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, TYPE_CHECKING
from models.card import Card

if TYPE_CHECKING:
    from fastapi import WebSocket

@dataclass
class Player:
    name: str
    seat: int
    team: int  # 0 = even seats, 1 = odd seats
    hand: list[Card] = field(default_factory=list)
    ws: Optional[object] = field(default=None, repr=False, compare=False)
    connected: bool = False

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "seat": self.seat,
            "team": self.team,
            "connected": self.connected,
        }
