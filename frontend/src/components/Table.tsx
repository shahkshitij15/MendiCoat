import type { TrickCard, PlayerInfo } from '../types/game'
import CardView from './CardView'

interface Props {
  trickCards: TrickCard[]
  players: PlayerInfo[]
  currentTurn: number
  mySeat: number
}

export default function Table({ trickCards, players, currentTurn, mySeat }: Props) {
  const getPlayer = (seat: number) => players.find((p) => p.seat === seat)

  return (
    <div className="bg-green-900/40 border border-green-700/30 rounded-2xl p-6 min-h-[180px] flex flex-col items-center justify-center gap-4">
      {trickCards.length === 0 ? (
        <p className="text-green-700/60 text-sm italic">Waiting for first card...</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {trickCards.map(({ seat, card }) => {
            const player = getPlayer(seat)
            return (
              <div key={seat} className="flex flex-col items-center gap-1">
                <span className={`text-xs font-medium ${seat === mySeat ? 'text-amber-400' : 'text-slate-300'}`}>
                  {player?.name ?? `Seat ${seat}`}
                </span>
                <CardView card={card} small />
              </div>
            )
          })}
        </div>
      )}

      {/* Who's turn indicator */}
      <p className="text-xs text-slate-400">
        {currentTurn === mySeat
          ? ''
          : `Waiting for ${getPlayer(currentTurn)?.name ?? '...'} to play`}
      </p>
    </div>
  )
}
