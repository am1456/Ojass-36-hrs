import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { io } from "socket.io-client"
import SOSModal from "./SOSModal"

const socket = io("http://localhost:3000")

// Fix Leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
})

export default function Home() {
  const [position, setPosition] = useState(null)
  const [sosList, setSosList] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [activeSOS, setActiveSOS] = useState(null)

  // Get User Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("Location received")
        setPosition([pos.coords.latitude, pos.coords.longitude])
      },
      (err) => {
        console.log("Location error:", err)
        alert("Please allow location access")
      }
    )
  }, [])

  // Socket listeners
  useEffect(() => {
    socket.on("sos:new", (sosData) => {
      setSosList((prev) => [...prev, sosData])
    })

    socket.on("sos:resolved", ({ sosId }) => {
      setSosList((prev) => prev.filter((s) => s._id !== sosId))
    })

    return () => {
      socket.off("sos:new")
      socket.off("sos:resolved")
    }
  }, [])

  if (!position) return <div>Loading map...</div>

  return (
    <div className="h-screen w-full relative">
      <MapContainer center={position} zoom={15} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sosList.map((sos) => {
          const [lng, lat] = sos.location.coordinates
          return (
            <Marker key={sos._id} position={[lat, lng]}>
              <Popup>
                <div className="space-y-2">
                  <h3 className="font-bold text-red-600">
                    {sos.crisisType}
                  </h3>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* SOS Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 
        bg-red-600 hover:bg-red-700 text-white 
        px-10 py-4 rounded-full text-xl font-bold shadow-xl"
      >
        SOS
      </button>

      {/* Modal */}
      {showModal && (
    <SOSModal
    position={position}
    onClose={() => setShowModal(false)}
    onSend={(data) => {
      const newSOS = {
        id: Date.now(),
        crisisType: data.crisisType,
        location: {
          coordinates: [data.lng, data.lat],
        },
        responders: [],
      }

      setActiveSOS(newSOS)
      setShowModal(false)
    }}
  />
)}
  

    </div>
  )
}