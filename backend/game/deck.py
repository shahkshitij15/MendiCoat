import random
from models.card import Card, Suit, RANK_ORDER


def build_deck(num_players: int) -> list[Card]:
    cards = [Card(suit, rank) for suit in Suit for rank in RANK_ORDER]
    if num_players in (6, 8):
        # 48-card variant: remove all four 2s
        cards = [c for c in cards if c.rank != "2"]
    random.shuffle(cards)
    return cards


def deal(num_players: int) -> list[list[Card]]:
    deck = build_deck(num_players)
    n = len(deck) // num_players
    return [deck[i * n : (i + 1) * n] for i in range(num_players)]
