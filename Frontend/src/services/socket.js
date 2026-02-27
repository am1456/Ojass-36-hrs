import { io } from 'socket.io-client'

// Socket connects to the same origin in dev (Vite proxy forwards /socket.io)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

let socket = null

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: false,
        })
    }
    return socket
}

export const connectSocket = (userId) => {
    const s = getSocket()
    if (!s.connected) {
        s.connect()
        s.emit('join', userId)
    }
    return s
}

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect()
    }
}
