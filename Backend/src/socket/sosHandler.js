import { SOS } from "../models/SOS.model.js"

const sosHandler = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        socket.on("join", (userId) => {
            socket.join(userId)
            console.log(`User ${userId} joined their room`)
        })

        socket.on("chat:send", async ({ sosId, from, message }) => {
            try {
                // Persist message to DB
                const updated = await SOS.findByIdAndUpdate(
                    sosId,
                    { $push: { messages: { from, message } } },
                    { new: true, select: "messages" }
                )
                const lastMsg = updated?.messages?.at(-1)

                // Broadcast to ALL members of the room (including sender)
                // Frontend will tag it self:true by comparing from === user.name
                io.to(sosId).emit("chat:message", {
                    sosId,
                    from,
                    message,
                    _id: lastMsg?._id,
                    sentAt: lastMsg?.sentAt
                })
            } catch (err) {
                console.error("chat:send error:", err)
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