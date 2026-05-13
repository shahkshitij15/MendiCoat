from enum import Enum
from dataclasses import dataclass

class Suit(str, Enum):
    SPADES = "spades"
    HEARTS = "hearts"
    DIAMONDS = "diamonds"
    CLUBS = "clubs"

# Low to high — index = relative strength
RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

@dataclass(frozen=True)
class Card:
    suit: Suit
    rank: str

    def rank_value(self) -> int:
        return RANK_ORDER.index(self.rank)

    def to_dict(self) -> dict:
        return {"suit": self.suit.value, "rank": self.rank}

    def __repr__(self) -> str:
        return f"{self.rank}{self.suit.value[0].upper()}"
