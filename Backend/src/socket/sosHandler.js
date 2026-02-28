const sosHandler = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`)


        socket.on("join", (userId) => {
            socket.join(userId)
            console.log(`User ${userId} joined their room`)
        })

        socket.on("chat:send", ({ sosId, from, message }) => {
            // socket.to() → broadcast to everyone in room EXCEPT the sender
            // (sender already added the message locally with self:true)
            socket.to(sosId).emit("chat:message", { sosId, from, message })
        })

        socket.on("join:sos:room", (sosId) => {
            socket.join(sosId)
        })

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`)
        })
    })
}

export default sosHandler