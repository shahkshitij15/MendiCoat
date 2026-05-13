import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import type { Card, PlayerInfo, Phase, TrickCard, ServerEvent } from '../types/game'

export interface GameState {
  phase: Phase
  players: PlayerInfo[]
  numPlayers: number
  mySeat: number
  myTeam: number
  hand: Card[]
  currentTurn: number
  dealerSeat: number
  trumpSuit: string | null
  trickCards: TrickCard[]          // cards played in the current trick
  trickCounts: Record<number, number>  // team → tricks won this round
  tenCounts: Record<number, number>    // team → tens captured this round
  lastRound: RoundResult | null
  statusMessage: string            // transient info (trump set, disconnects, etc.)
}

export interface RoundResult {
  winnerTeam: number
  tens: Record<number, number>
  trickCounts: Record<number, number>
  mendikot: boolean
  mangya_coat: boolean
}

const initial: GameState = {
  phase: 'lobby',
  players: [],
  numPlayers: 4,
  mySeat: -1,
  myTeam: -1,
  hand: [],
  currentTurn: -1,
  dealerSeat: 0,
  trumpSuit: null,
  trickCards: [],
  trickCounts: { 0: 0, 1: 0 },
  tenCounts: { 0: 0, 1: 0 },
  lastRound: null,
  statusMessage: '',
}

type Action = ServerEvent | { type: '_set_num_players'; value: number }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case '_set_num_players':
      return { ...state, numPlayers: action.value }

    case 'player_joined':
      return { ...state, players: action.players, numPlayers: action.num_players }

    case 'player_connected':
    case 'player_disconnected':
      return {
        ...state,
        statusMessage: action.type === 'player_connected'
          ? `${action.player} reconnected`
          : `${action.player} disconnected — waiting...`,
      }

    case 'reconnected':
      return {
        ...state,
        hand: action.hand,
        mySeat: action.your_seat,
        myTeam: action.your_team,
        phase: action.phase,
        currentTurn: action.current_turn,
        trumpSuit: action.trump_suit,
        dealerSeat: action.dealer_seat,
        trickCards: action.trick_cards,
        players: action.players,
        statusMessage: 'Reconnected!',
      }

    case 'game_started':
      return {
        ...state,
        phase: 'playing',
        hand: action.hand,
        mySeat: action.your_seat,
        myTeam: action.your_team,
        currentTurn: action.current_turn,
        dealerSeat: action.dealer_seat,
        players: action.players,
        trumpSuit: null,
        trickCards: [],
        trickCounts: { 0: 0, 1: 0 },
        tenCounts: { 0: 0, 1: 0 },
        lastRound: null,
        statusMessage: '',
      }

    case 'card_played':
      return {
        ...state,
        currentTurn: action.next_turn,
        trickCards: [...state.trickCards, { seat: action.seat, card: action.card }],
        // Remove from hand if it's our card
        hand: state.hand.filter(
          (c) => !(c.suit === action.card.suit && c.rank === action.card.rank)
        ),
      }

    case 'trump_set':
      return {
        ...state,
        trumpSuit: action.suit,
        statusMessage: `${action.triggered_by} set trump: ${action.suit}`,
      }

    case 'trick_done':
      return {
        ...state,
        currentTurn: action.next_turn,
        trickCards: [],
        trickCounts: action.trick_counts as Record<number, number>,
        tenCounts: action.tens_counts as Record<number, number>,
        statusMessage: `${action.winner} wins the trick!`,
      }

    case 'round_over':
      return {
        ...state,
        phase: 'lobby',
        lastRound: {
          winnerTeam: action.winner_team,
          tens: action.tens as Record<number, number>,
          trickCounts: action.trick_counts as Record<number, number>,
          mendikot: action.mendikot,
          mangya_coat: action.mangya_coat,
        },
        statusMessage: '',
      }

    case 'error':
      return { ...state, statusMessage: `Error: ${action.message}` }

    default:
      return state
  }
}

interface GameContextValue {
  state: GameState
  dispatch: (action: Action) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
