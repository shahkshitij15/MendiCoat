import { useEffect, useRef } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { useWebSocket } from '../hooks/useWebSocket'
import type { ServerEvent } from '../types/game'

export default function Lobby() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { name, isHost } = (location.state ?? {}) as { name?: string; isHost?: boolean }

  const { state, dispatch } = useGame()
  const sendRef = useRef<(msg: object) => void>(() => {})

  const onMessage = (event: ServerEvent) => {
    dispatch(event)
    if (event.type === 'game_started') {
      navigate(`/game/${code}`, { state: { name, isHost } })
    }
  }

  const { send } = useWebSocket({
    roomCode: code!,
    playerName: name!,
    onMessage,
  })

  useEffect(() => { sendRef.current = send }, [send])

  const shareUrl = `${window.location.origin}/join/${code}`
  const spotsLeft = state.numPlayers - state.players.length

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">Room <span className="font-mono">{code}</span></h1>
          <p className="text-slate-400 text-sm mt-1">
            {spotsLeft > 0 ? `Waiting for ${spotsLeft} more player(s)...` : 'Room full — ready to start!'}
          </p>
        </div>

        {/* Invite link */}
        <div className="bg-slate-700 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-slate-400 text-xs truncate flex-1">{shareUrl}</span>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="text-amber-400 text-xs font-semibold whitespace-nowrap hover:text-amber-300"
          >
            Copy link
          </button>
        </div>

        {/* Player list */}
        <ul className="space-y-2">
          {state.players.map((p) => (
            <li
              key={p.seat}
              className="flex items-center gap-3 bg-slate-700 rounded-lg px-4 py-2.5"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-green-400' : 'bg-slate-500'}`} />
              <span className="flex-1 text-white">{p.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.team === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'}`}>
                Team {p.team + 1}
              </span>
              {p.seat === 0 && <span className="text-xs text-amber-400">host</span>}
            </li>
          ))}
          {Array.from({ length: spotsLeft }).map((_, i) => (
            <li key={`empty-${i}`} className="flex items-center gap-3 bg-slate-700/40 rounded-lg px-4 py-2.5 border border-dashed border-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span className="text-slate-500 italic text-sm">Waiting...</span>
            </li>
          ))}
        </ul>

        {isHost && (
          <button
            disabled={spotsLeft > 0}
            onClick={() => sendRef.current({ type: 'start_game' })}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
        )}
        {!isHost && (
          <p className="text-center text-slate-500 text-sm">Waiting for host to start...</p>
        )}

        {state.statusMessage && (
          <p className="text-center text-sm text-amber-300">{state.statusMessage}</p>
        )}
      </div>
    </div>
  )
}
