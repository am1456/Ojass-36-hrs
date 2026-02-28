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
        console.log(`[Socket] Connecting for user ${userId}...`)

        s.on('connect', () => {
            console.log(`[Socket] Connected with ID: ${s.id}`)
            s.emit('join', userId)
        })

        s.on('disconnect', (reason) => {
            console.log(`[Socket] Disconnected: ${reason}`)
        })

        s.on('connect_error', (err) => {
            console.error(`[Socket] Connection error:`, err)
        })

        s.connect()
    } else {
        // If already connected, just ensure they are in their personal room
        console.log(`[Socket] Already connected with ID: ${s.id}. Emitting join for user ${userId}.`)
        s.emit('join', userId)
    }
    return s
}

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect()
    }
}
