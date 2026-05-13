from __future__ import annotations
from enum import Enum
from models.card import Card, Suit
from models.player import Player
from game.deck import deal
from game.trick import trick_winner
from game.scoring import score_round


class Phase(str, Enum):
    LOBBY = "lobby"
    PLAYING = "playing"
    DONE = "done"


class GameState:
    def __init__(self, num_players: int, dealer_seat: int = 0):
        self.num_players = num_players
        self.dealer_seat = dealer_seat
        self.phase = Phase.LOBBY

        # Set during PLAYING
        self.current_turn: int = -1
        self.trump_suit: str | None = None
        self.current_trick: list[tuple[int, Card]] = []
        # Maps team → flat list of every card won (trick_count = len // num_players)
        self.team_tricks: dict[int, list[Card]] = {0: [], 1: []}

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self, players: list[Player]) -> None:
        hands = deal(self.num_players)
        for i, player in enumerate(players):
            player.hand = hands[i]

        self.trump_suit = None
        self.current_trick = []
        self.team_tricks = {0: [], 1: []}
        self.phase = Phase.PLAYING

        # First lead is to dealer's right (anticlockwise = index - 1)
        dealer_idx = next(i for i, p in enumerate(players) if p.seat == self.dealer_seat)
        self.current_turn = players[(dealer_idx - 1) % self.num_players].seat

    # ------------------------------------------------------------------
    # Core action
    # ------------------------------------------------------------------

    def play_card(self, seat: int, card: Card, players: list[Player]) -> list[dict]:
        """
        Validate and apply a card play.
        Returns a list of event dicts to broadcast (in order).
        Raises ValueError with a user-facing message on invalid plays.
        """
        if self.phase != Phase.PLAYING:
            raise ValueError("Game is not in progress")
        if self.current_turn != seat:
            raise ValueError("Not your turn")

        player = next((p for p in players if p.seat == seat), None)
        if player is None:
            raise ValueError("Player not found")
        if card not in player.hand:
            raise ValueError("Card not in your hand")

        self._validate_suit(card, player)

        player.hand.remove(card)
        self.current_trick.append((seat, card))

        events: list[dict] = []

        # Trump trigger: first off-suit play sets trump
        if len(self.current_trick) > 1:
            led_suit = self.current_trick[0][1].suit
            if card.suit != led_suit and self.trump_suit is None:
                self.trump_suit = card.suit.value
                events.append({
                    "type": "trump_set",
                    "suit": self.trump_suit,
                    "triggered_by": player.name,
                })

        events.append({
            "type": "card_played",
            "player": player.name,
            "seat": seat,
            "card": card.to_dict(),
            # next_turn filled in below after we know if trick ended
        })

        if len(self.current_trick) == self.num_players:
            events.extend(self._resolve_trick(players))
        else:
            self._advance_turn(seat, players)
            events[-1]["next_turn"] = self.current_turn

        return events

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _validate_suit(self, card: Card, player: Player) -> None:
        if not self.current_trick:
            return  # Leading — any card allowed
        led_suit = self.current_trick[0][1].suit
        if card.suit != led_suit and any(c.suit == led_suit for c in player.hand):
            raise ValueError("Must follow suit")

    def _advance_turn(self, from_seat: int, players: list[Player]) -> None:
        seats = [p.seat for p in players]
        idx = seats.index(from_seat)
        self.current_turn = seats[(idx - 1) % self.num_players]

    def _resolve_trick(self, players: list[Player]) -> list[dict]:
        events: list[dict] = []

        winner_seat = trick_winner(self.current_trick, self.trump_suit)
        winner = next(p for p in players if p.seat == winner_seat)
        trick_cards = [c for _, c in self.current_trick]
        self.team_tricks[winner.team].extend(trick_cards)

        trick_counts = {
            t: len(cards) // self.num_players
            for t, cards in self.team_tricks.items()
        }
        tens_counts = {
            t: sum(1 for c in cards if c.rank == "10")
            for t, cards in self.team_tricks.items()
        }
        self.current_trick = []
        self.current_turn = winner_seat

        events.append({
            "type": "trick_done",
            "winner": winner.name,
            "winner_seat": winner_seat,
            "winner_team": winner.team,
            "trick_counts": trick_counts,
            "tens_counts": tens_counts,
            "next_turn": winner_seat,
        })

        # Round over when every player has played all their cards
        if all(not p.hand for p in players):
            self.phase = Phase.DONE
            dealer_team = next(p.team for p in players if p.seat == self.dealer_seat)
            result = score_round(
                self.team_tricks, self.num_players, self.dealer_seat, dealer_team, players
            )
            events.append({"type": "round_over", **result})
            # Advance dealer for next round
            self.dealer_seat = result["next_dealer_seat"]

        return events

    def public_state(self) -> dict:
        return {
            "phase": self.phase,
            "current_turn": self.current_turn,
            "trump_suit": self.trump_suit,
            "dealer_seat": self.dealer_seat,
            "trick_cards": [
                {"seat": s, "card": c.to_dict()} for s, c in self.current_trick
            ],
        }
