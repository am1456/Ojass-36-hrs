import { SOS } from "../models/SOS.model.js"

const sosHandler = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        socket.on("join", (userId) => {
            socket.join(userId)
            console.log(`User ${userId} joined their room`)
        })

        socket.on("chat:send", async ({ sosId, from, message }) => {
            console.log(`Received chat:send from ${from} in room ${sosId}: ${message}`)
            try {
                // Persist message to DB
                console.log("Attempting to save message to DB...")
                const updated = await SOS.findByIdAndUpdate(
                    sosId,
                    { $push: { messages: { from, message } } },
                    { new: true, select: "messages" }
                )

                if (!updated) {
                    console.log(`SOS room ${sosId} not found in DB! Still broadcasting in memory.`)
                } else {
                    console.log("Message saved to DB successfully")
                }

                const lastMsg = updated?.messages?.at(-1)

                console.log(`Broadcasting chat:message to room ${sosId}`)
                // Broadcast to ALL members of the room (including sender)
                // Frontend will tag it self:true by comparing from === user.name
                io.to(sosId).emit("chat:message", {
                    sosId,
                    from,
                    message,
                    _id: lastMsg?._id || new Date().getTime().toString(),
                    sentAt: lastMsg?.sentAt || new Date()
                })
            } catch (err) {
                console.error("chat:send error:", err)
                // Even if DB fails, broadcast it so chat works for current session
                io.to(sosId).emit("chat:message", {
                    sosId,
                    from,
                    message,
                    _id: new Date().getTime().toString(),
                    sentAt: new Date()
                })
            }
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