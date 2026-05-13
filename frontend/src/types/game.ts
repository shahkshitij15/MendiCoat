export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A'

export interface Card {
  suit: Suit
  rank: Rank
}

export interface PlayerInfo {
  name: string
  seat: number
  team: number
  connected: boolean
}

export type Phase = 'lobby' | 'playing' | 'done'

export interface TrickCard {
  seat: number
  card: Card
}

export interface TrickCounts {
  0: number
  1: number
}

// All WS → client event shapes
export type ServerEvent =
  | { type: 'error'; message: string }
  | { type: 'player_joined'; players: PlayerInfo[]; num_players: number }
  | { type: 'player_connected'; player: string }
  | { type: 'player_disconnected'; player: string }
  | { type: 'reconnected'; hand: Card[]; your_seat: number; your_team: number; phase: Phase; current_turn: number; trump_suit: string | null; dealer_seat: number; trick_cards: TrickCard[]; players: PlayerInfo[] }
  | { type: 'game_started'; hand: Card[]; your_seat: number; your_team: number; current_turn: number; dealer_seat: number; players: PlayerInfo[] }
  | { type: 'card_played'; player: string; seat: number; card: Card; next_turn: number }
  | { type: 'trump_set'; suit: string; triggered_by: string }
  | { type: 'trick_done'; winner: string; winner_seat: number; winner_team: number; trick_counts: Record<string, number>; tens_counts: Record<string, number>; next_turn: number }
  | { type: 'round_over'; winner_team: number; tens: Record<string, number>; trick_counts: Record<string, number>; mendikot: boolean; mangya_coat: boolean; next_dealer_seat: number }
