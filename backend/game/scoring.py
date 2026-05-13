from models.card import Card


def score_round(
    team_tricks: dict[int, list[Card]],
    num_players: int,
    dealer_seat: int,
    dealer_team: int,
    players: list,
) -> dict:
    """
    Compute round result and determine who deals next.

    team_tricks: maps team (0 or 1) → flat list of all cards won by that team.
    Returns a dict broadcast as round_over.
    """
    cards_per_trick = num_players
    tens = {t: sum(1 for c in cards if c.rank == "10") for t, cards in team_tricks.items()}
    trick_counts = {t: len(cards) // cards_per_trick for t, cards in team_tricks.items()}
    total_tricks = sum(trick_counts.values())

    if tens[0] >= 3:
        winner_team = 0
    elif tens[1] >= 3:
        winner_team = 1
    else:
        # 2-2 tie on tens: majority tricks wins
        winner_team = 0 if trick_counts[0] >= 7 else 1

    mendikot = tens[winner_team] == 4
    # Mangya coat = winner took every single trick
    mangya_coat = trick_counts[winner_team] == total_tricks

    next_dealer = _next_dealer(
        dealer_seat, dealer_team, winner_team, mangya_coat, players
    )

    return {
        "winner_team": winner_team,
        "tens": tens,
        "trick_counts": trick_counts,
        "mendikot": mendikot,
        "mangya_coat": mangya_coat,
        "next_dealer_seat": next_dealer,
    }


def _next_dealer(
    dealer_seat: int,
    dealer_team: int,
    winner_team: int,
    mangya_coat: bool,
    players: list,
) -> int:
    seats = [p.seat for p in players]
    n = len(seats)
    dealer_idx = seats.index(dealer_seat)

    if dealer_team != winner_team:
        # Dealer's team lost
        if mangya_coat:
            # Whitewash → dealer's partner takes over
            partner_idx = (dealer_idx + 2) % n  # partner is 2 seats away (same team)
            return seats[partner_idx]
        # Same dealer deals again
        return dealer_seat
    else:
        # Dealer's team won → deal passes right (anticlockwise = index - 1)
        return seats[(dealer_idx - 1) % n]
