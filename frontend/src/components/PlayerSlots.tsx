import type { PlayerInfo } from '../types/game'

interface Props {
  players: PlayerInfo[]
  currentTurn: number
  mySeat: number
  dealerSeat: number
}

export default function PlayerSlots({ players, currentTurn, mySeat, dealerSeat }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {players.map((p) => (
        <div
          key={p.seat}
          className={[
            'flex flex-col items-center rounded-xl px-3 py-2 text-xs transition-all border',
            p.seat === currentTurn
              ? 'border-amber-400 bg-amber-400/10'
              : 'border-slate-700 bg-slate-800',
          ].join(' ')}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-red-500'}`} />
            <span className={`font-semibold ${p.seat === mySeat ? 'text-amber-400' : 'text-white'}`}>
              {p.name}
              {p.seat === mySeat && ' (you)'}
            </span>
          </div>
          <div className="flex gap-1 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded-full ${p.team === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'}`}>
              T{p.team + 1}
            </span>
            {p.seat === dealerSeat && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">D</span>
            )}
            {p.seat === currentTurn && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">▶</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
