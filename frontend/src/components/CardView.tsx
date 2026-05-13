import type { Card } from '../types/game'

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const RED_SUITS = new Set(['hearts', 'diamonds'])

interface Props {
  card: Card
  onClick?: () => void
  disabled?: boolean
  small?: boolean
}

export default function CardView({ card, onClick, disabled = false, small = false }: Props) {
  const isRed = RED_SUITS.has(card.suit)
  const symbol = SUIT_SYMBOLS[card.suit]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative rounded-xl border-2 font-bold select-none transition-all',
        small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm',
        'bg-white shadow-md',
        isRed ? 'text-red-600' : 'text-slate-900',
        !disabled && onClick
          ? 'border-transparent hover:-translate-y-2 hover:border-amber-400 hover:shadow-amber-400/30 hover:shadow-lg cursor-pointer'
          : 'border-slate-200 cursor-default',
        disabled && onClick ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span className="absolute top-1 left-1.5 leading-none">{card.rank}</span>
      <span className="absolute top-1 right-1 leading-none text-base">{symbol}</span>
      <span className="absolute bottom-1 right-1.5 leading-none rotate-180">{card.rank}</span>
    </button>
  )
}
