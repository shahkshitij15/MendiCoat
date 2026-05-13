import { useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { useWebSocket } from '../hooks/useWebSocket'
import type { Card, ServerEvent } from '../types/game'
import Hand from '../components/Hand'
import Table from '../components/Table'
import PlayerSlots from '../components/PlayerSlots'
import ScoreBoard from '../components/ScoreBoard'
import TrumpBadge from '../components/TrumpBadge'

export default function Game() {
  const { code } = useParams<{ code: string }>()
  const location = useLocation()
  const { name, isHost } = (location.state ?? {}) as { name?: string; isHost?: boolean }

  const { state, dispatch } = useGame()
  const sendRef = useRef<(msg: object) => void>(() => {})

  const { send } = useWebSocket({
    roomCode: code!,
    playerName: name!,
    onMessage: (event: ServerEvent) => dispatch(event),
  })

  useEffect(() => { sendRef.current = send }, [send])

  function playCard(card: Card) {
    sendRef.current({ type: 'play_card', card })
  }

  function startNewRound() {
    sendRef.current({ type: 'new_round' })
  }

  const isMyTurn = state.phase === 'playing' && state.currentTurn === state.mySeat

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-amber-400 font-bold text-lg">MendiCoat</h1>
        <TrumpBadge suit={state.trumpSuit} />
        <span className="text-slate-400 text-sm font-mono">{code}</span>
      </header>

      <div className="flex flex-1 gap-4 p-4 max-w-5xl mx-auto w-full">
        {/* Main game area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Players */}
          <PlayerSlots
            players={state.players}
            currentTurn={state.currentTurn}
            mySeat={state.mySeat}
            dealerSeat={state.dealerSeat}
          />

          {/* Table / current trick */}
          <Table
            trickCards={state.trickCards}
            players={state.players}
            currentTurn={state.currentTurn}
            mySeat={state.mySeat}
          />

          {/* Status message */}
          {state.statusMessage && (
            <p className="text-center text-amber-300 text-sm">{state.statusMessage}</p>
          )}

          {/* Player's hand */}
          {state.phase === 'playing' && (
            <div className="mt-auto pt-4 border-t border-slate-700">
              <Hand
                cards={state.hand}
                isMyTurn={isMyTurn}
                onPlay={playCard}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <ScoreBoard
            trickCounts={state.trickCounts}
            tenCounts={state.tenCounts}
            players={state.players}
            lastRound={state.lastRound}
            isHost={!!isHost}
            onNewRound={startNewRound}
            phase={state.phase}
          />
        </aside>
      </div>
    </div>
  )
}
