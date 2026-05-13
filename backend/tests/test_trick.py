import pytest
from models.card import Card, Suit
from game.trick import trick_winner


def c(rank: str, suit_char: str) -> Card:
    suit_map = {"S": Suit.SPADES, "H": Suit.HEARTS, "D": Suit.DIAMONDS, "C": Suit.CLUBS}
    return Card(suit=suit_map[suit_char], rank=rank)


def test_highest_led_suit_wins_no_trump():
    trick = [(0, c("A", "S")), (1, c("K", "S")), (2, c("Q", "S")), (3, c("J", "S"))]
    assert trick_winner(trick, None) == 0


def test_highest_trump_beats_high_led():
    trick = [(0, c("A", "S")), (1, c("2", "H")), (2, c("K", "S")), (3, c("Q", "S"))]
    assert trick_winner(trick, "hearts") == 1


def test_off_suit_non_trump_does_not_win():
    trick = [(0, c("A", "S")), (1, c("A", "D")), (2, c("K", "S")), (3, c("Q", "S"))]
    assert trick_winner(trick, None) == 0


def test_higher_trump_beats_lower_trump():
    trick = [(0, c("A", "S")), (1, c("3", "H")), (2, c("K", "S")), (3, c("Q", "H"))]
    assert trick_winner(trick, "hearts") == 3
