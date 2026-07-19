import { io, Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

let socket: Socket | null = null

/**
 * Lazily creates a single shared Socket.IO connection for the whole app.
 * Backend must be run as `app.main:asgi_app` (not the bare FastAPI `app`)
 * for this to connect — see backend/README notes.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE_URL, { path: '/socket.io', transports: ['websocket'] })
  }
  return socket
}
