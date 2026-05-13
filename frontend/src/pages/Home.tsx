import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiBase } from '../config'

export default function Home() {
  const { code: codeParam } = useParams<{ code?: string }>()
  const navigate = useNavigate()

  const isJoining = Boolean(codeParam)
  const [name, setName] = useState('')
  const [numPlayers, setNumPlayers] = useState<4 | 6 | 8>(4)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setError('')
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_players: numPlayers, host_name: name.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { room_code } = await res.json()
      navigate(`/room/${room_code}`, { state: { name: name.trim(), isHost: true } })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    setError('')
    if (!name.trim()) { setError('Enter your name'); return }
    // Verify room exists before navigating
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/room/${codeParam}`)
      if (!res.ok) throw new Error('Room not found')
      navigate(`/room/${codeParam}`, { state: { name: name.trim(), isHost: false } })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Room not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-400 tracking-tight">MendiCoat</h1>
          <p className="text-slate-400 mt-1 text-sm">Multiplayer Mendikot</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-slate-300">Your name</label>
          <input
            className="w-full bg-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Enter name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (isJoining ? handleJoin() : handleCreate())}
          />
        </div>

        {!isJoining && (
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">Number of players</label>
            <div className="flex gap-3">
              {([4, 6, 8] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setNumPlayers(n)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
                    numPlayers === n
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {n}P
                </button>
              ))}
            </div>
          </div>
        )}

        {isJoining && (
          <p className="text-slate-400 text-sm text-center">
            Joining room <span className="text-amber-400 font-mono font-bold">{codeParam}</span>
          </p>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          disabled={loading}
          onClick={isJoining ? handleJoin : handleCreate}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : isJoining ? 'Join Game' : 'Create Room'}
        </button>
      </div>
    </div>
  )
}
