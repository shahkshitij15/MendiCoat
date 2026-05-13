import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Invite link shared to friends */}
          <Route path="/join/:code" element={<Home />} />
          <Route path="/room/:code" element={<Lobby />} />
          <Route path="/game/:code" element={<Game />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}
