import { useState, useEffect } from "react"
import { io } from "socket.io-client"

const socket = io("http://localhost:3000")

export default function ChatBox({ responder, sosId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")

  useEffect(() => {
    socket.on("chat:message", ({ responderId, message }) => {
      if (responderId === responder._id) {
        setMessages((prev) => [...prev, message])
      }
    })

    return () => socket.off("chat:message")
  }, [responder._id])

  const sendMessage = () => {
    if (!input) return

    socket.emit("chat:send", {
      sosId,
      responderId: responder._id,
      message: input,
    })

    setInput("")
  }

  return (
    <div className="p-4 border-t">
      <h4 className="font-semibold mb-2">
        Chat with {responder.name}
      </h4>

      <div className="h-40 overflow-y-auto border p-2 mb-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm mb-1">
            {m}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-1"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3"
        >
          Send
        </button>
      </div>
    </div>
  )
}