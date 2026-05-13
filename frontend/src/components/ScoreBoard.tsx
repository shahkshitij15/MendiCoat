import type { RoundResult } from '../context/GameContext'
import type { PlayerInfo } from '../types/game'

interface Props {
  trickCounts: Record<number, number>
  tenCounts: Record<number, number>
  players: PlayerInfo[]
  lastRound: RoundResult | null
  isHost: boolean
  onNewRound: () => void
  phase: string
}

export default function ScoreBoard({ trickCounts, tenCounts, players, lastRound, isHost, onNewRound, phase }: Props) {
  const teams = [0, 1] as const
  const teamNames = (team: number) =>
    players.filter((p) => p.team === team).map((p) => p.name).join(' & ')

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3 text-sm">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Score</h3>

      {teams.map((team) => (
        <div key={team} className="flex items-center justify-between">
          <div>
            <span className={`font-semibold ${team === 0 ? 'text-blue-300' : 'text-rose-300'}`}>
              Team {team + 1}
            </span>
            <span className="text-slate-500 text-xs ml-1">({teamNames(team)})</span>
          </div>
          <span className="text-white font-bold">
            {trickCounts[team] ?? 0} tricks · {tenCounts[team] ?? 0} mendis
          </span>
        </div>
      ))}

      {lastRound && (
        <div className="pt-3 border-t border-slate-700 space-y-2">
          <p className="text-center font-semibold text-amber-400">
            {lastRound.mangya_coat
              ? '🏆 Mangya Coat! All tricks!'
              : lastRound.mendikot
              ? '🎉 Mendikot! All 4 tens!'
              : `Team ${lastRound.winnerTeam + 1} wins!`}
          </p>
          <div className="text-slate-400 text-xs text-center space-x-3">
            {teams.map((t) => (
              <span key={t}>T{t + 1}: {lastRound.tens[t]} tens, {lastRound.trickCounts[t]} tricks</span>
            ))}
          </div>
          {isHost && phase === 'lobby' && (
            <button
              onClick={onNewRound}
              className="w-full mt-2 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-lg text-sm transition-colors"
            >
              Next Round
            </button>
          )}
          {!isHost && phase === 'lobby' && (
            <p className="text-center text-slate-500 text-xs">Waiting for host to start next round...</p>
          )}
        </div>
      )}
    </div>
  )
}
