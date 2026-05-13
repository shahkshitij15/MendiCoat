import pytest
from models.player import Player
from models.card import Card, Suit
from game.game_state import GameState, Phase


def make_players(n: int) -> list[Player]:
    return [Player(name=f"P{i}", seat=i, team=i % 2) for i in range(n)]


def test_start_deals_correct_hand_sizes():
    gs = GameState(num_players=4, dealer_seat=0)
    players = make_players(4)
    gs.start(players)
    assert all(len(p.hand) == 13 for p in players)
    assert gs.phase == Phase.PLAYING


def test_start_6_player_deals_8_cards():
    gs = GameState(num_players=6, dealer_seat=0)
    players = make_players(6)
    gs.start(players)
    assert all(len(p.hand) == 8 for p in players)


def test_cannot_play_out_of_turn():
    gs = GameState(num_players=4, dealer_seat=0)
    players = make_players(4)
    gs.start(players)
    wrong_player = next(p for p in players if p.seat != gs.current_turn)
    with pytest.raises(ValueError, match="Not your turn"):
        gs.play_card(wrong_player.seat, wrong_player.hand[0], players)


def test_must_follow_suit():
    gs = GameState(num_players=4, dealer_seat=0)
    players = make_players(4)
    gs.start(players)

    # Force a known led suit by playing first card manually
    leader = next(p for p in players if p.seat == gs.current_turn)
    lead_card = leader.hand[0]
    gs.play_card(leader.seat, lead_card, players)

    # Next player must follow suit if possible
    next_player = next(p for p in players if p.seat == gs.current_turn)
    led_suit = lead_card.suit
    has_suit = any(c.suit == led_suit for c in next_player.hand)
    off_suit_card = next((c for c in next_player.hand if c.suit != led_suit), None)

    if has_suit and off_suit_card:
        with pytest.raises(ValueError, match="Must follow suit"):
            gs.play_card(next_player.seat, off_suit_card, players)


def test_full_4p_round_completes():
    """Play through an entire 4-player round and expect round_over."""
    gs = GameState(num_players=4, dealer_seat=0)
    players = make_players(4)
    gs.start(players)

    round_over_seen = False
    for _ in range(13):  # 13 tricks
        for _ in range(4):  # 4 cards per trick
            current = next(p for p in players if p.seat == gs.current_turn)
            led_suit = gs.current_trick[0][1].suit if gs.current_trick else None

            # Pick a valid card (follow suit if possible)
            if led_suit:
                card = next(
                    (c for c in current.hand if c.suit == led_suit),
                    current.hand[0],
                )
            else:
                card = current.hand[0]

            events = gs.play_card(current.seat, card, players)
            if any(e["type"] == "round_over" for e in events):
                round_over_seen = True

    assert round_over_seen
    assert gs.phase == Phase.DONE
