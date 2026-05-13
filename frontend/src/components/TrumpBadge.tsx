const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const SUIT_COLORS: Record<string, string> = {
  spades: 'text-slate-200',
  hearts: 'text-red-400',
  diamonds: 'text-red-400',
  clubs: 'text-slate-200',
}

interface Props {
  suit: string | null
}

export default function TrumpBadge({ suit }: Props) {
  if (!suit) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-700 rounded-full px-3 py-1">
        <span className="text-xs text-slate-400">Trump: TBD</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 bg-slate-700 rounded-full px-3 py-1">
      <span className="text-xs text-slate-300">Trump</span>
      <span className={`text-lg font-bold ${SUIT_COLORS[suit]}`}>{SUIT_SYMBOLS[suit]}</span>
    </div>
  )
}
