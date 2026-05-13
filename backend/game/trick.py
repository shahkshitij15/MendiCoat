from __future__ import annotations
from models.card import Card, Suit

# A trick is a list of (seat_index, Card) in play order.
Trick = list[tuple[int, Card]]


def trick_winner(trick: Trick, trump_suit: str | None) -> int:
    """Return the seat index of the player who wins the trick."""
    led_suit = trick[0][1].suit

    if trump_suit:
        trumps = [(seat, card) for seat, card in trick if card.suit.value == trump_suit]
        if trumps:
            return max(trumps, key=lambda x: x[1].rank_value())[0]

    # No trumps played — highest card of the led suit wins
    followers = [(seat, card) for seat, card in trick if card.suit == led_suit]
    return max(followers, key=lambda x: x[1].rank_value())[0]
