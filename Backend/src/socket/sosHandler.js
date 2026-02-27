const sosHandler = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`)


        socket.on("join", (userId) => {
            socket.join(userId)
            console.log(`User ${userId} joined their room`)
        })

        socket.on("chat:send", ({ sosId, from, message }) => {
            io.to(sosId).emit("chat:message", { sosId, from, message })
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