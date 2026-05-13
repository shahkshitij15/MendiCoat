import type { Card } from '../types/game'
import CardView from './CardView'

interface Props {
  cards: Card[]
  isMyTurn: boolean
  onPlay: (card: Card) => void
}

const SUIT_ORDER = ['spades', 'hearts', 'diamonds', 'clubs']
const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']

function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const suitDiff = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit)
    if (suitDiff !== 0) return suitDiff
    return RANK_ORDER.indexOf(b.rank) - RANK_ORDER.indexOf(a.rank)
  })
}

export default function Hand({ cards, isMyTurn, onPlay }: Props) {
  const sorted = sortHand(cards)

  return (
    <div className="flex flex-col items-center gap-3">
      {isMyTurn && (
        <p className="text-amber-400 text-sm font-semibold animate-pulse">Your turn — play a card</p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {sorted.map((card) => (
          <CardView
            key={`${card.rank}-${card.suit}`}
            card={card}
            onClick={isMyTurn ? () => onPlay(card) : undefined}
            disabled={!isMyTurn}
          />
        ))}
      </div>
    </div>
  )
}
