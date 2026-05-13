import { useEffect, useRef, useCallback } from 'react'
import type { ServerEvent } from '../types/game'
import { wsUrl } from '../config'

interface Options {
  roomCode: string
  playerName: string
  onMessage: (event: ServerEvent) => void
  onOpen?: () => void
  onClose?: () => void
}

export function useWebSocket({ roomCode, playerName, onMessage, onOpen, onClose }: Options) {
  const wsRef = useRef<WebSocket | null>(null)

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  useEffect(() => {
    const url = wsUrl(`/ws/${roomCode}/${encodeURIComponent(playerName)}`)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => onOpen?.()
    ws.onclose = () => onClose?.()
    ws.onmessage = (e) => {
      try {
        const event: ServerEvent = JSON.parse(e.data)
        onMessage(event)
      } catch {
        console.error('Failed to parse WS message', e.data)
      }
    }

    return () => ws.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerName])

  return { send }
}
