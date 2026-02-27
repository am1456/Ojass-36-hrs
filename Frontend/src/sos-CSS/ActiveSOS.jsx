import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import L from "leaflet"
import axios from "axios"
import { io } from "socket.io-client"
import ResponderList from "./components/ResponderList"
import ChatBox from "./components/ChatBox"

const socket = io("http://localhost:3000")

// 🟡 Yellow icon
const yellowIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  iconSize: [32, 32],
})

// 🟢 Green icon
const greenIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
})

export default function ActiveSOS({ sos, updateSOS, onResolve }) {
  const [selectedResponder, setSelectedResponder] = useState(null)
  const [guidance, setGuidance] = useState("Loading AI guidance...")

  // 🔌 Listen for responder join
  useEffect(() => {
    socket.on("responder:joined", ({ responder }) => {
      updateSOS((prev) => ({
        ...prev,
        responders: [...prev.responders, responder],
      }))
    })

    socket.on("responder:locationUpdate", ({ responderId, location, status }) => {
      updateSOS((prev) => ({
        ...prev,
        responders: prev.responders.map((r) =>
          r._id === responderId
            ? { ...r, location, status }
            : r
        ),
      }))
    })

    return () => {
      socket.off("responder:joined")
      socket.off("responder:locationUpdate")
    }
  }, [])

  // 🤖 Fetch AI Guidance
  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/ai/guidance/${sos._id}`
        )
        setGuidance(res.data.text)
      } catch {
        setGuidance("Unable to fetch AI guidance.")
      }
    }

    fetchGuidance()
  }, [sos._id])

  return (
    <div className="h-screen flex">

      {/* LEFT MAP */}
      <div className="flex-1 relative">
        <MapContainer
          center={[sos.location.coordinates[1], sos.location.coordinates[0]]}
          zoom={15}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Victim Marker */}
          <Marker
            position={[
              sos.location.coordinates[1],
              sos.location.coordinates[0],
            ]}
          />

          {/* Responders */}
          {sos.responders.map((r) => (
            <Marker
              key={r._id}
              position={[r.location.lat, r.location.lng]}
              icon={r.status === "arrived" ? greenIcon : yellowIcon}
            />
          ))}
        </MapContainer>

        <button
          onClick={onResolve}
          className="absolute bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded"
        >
          Mark Resolved
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-96 border-l flex flex-col">

        <ResponderList
          responders={sos.responders}
          onSelect={setSelectedResponder}
        />

        {selectedResponder && (
          <ChatBox
            responder={selectedResponder}
            sosId={sos._id}
          />
        )}

        {/* AI Guidance */}
        <div className="p-4 border-t">
          <h3 className="font-bold mb-2">AI Guidance</h3>
          <p className="text-sm">{guidance}</p>
        </div>

      </div>
    </div>
  )
}