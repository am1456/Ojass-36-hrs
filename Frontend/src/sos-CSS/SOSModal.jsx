import { useState } from "react"

export default function SOSModal({ position, onClose, onSend }) {
  const [crisisType, setCrisisType] = useState("Medical")
  const [radius, setRadius] = useState(1000)

  const handleSubmit = () => {
    onSend({
      crisisType,
      lat: position[0],
      lng: position[1],
      radius,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 space-y-4">

        <h2 className="text-xl font-bold">
          Trigger SOS
        </h2>

        {/* Crisis Type */}
        <div>
          <label className="block mb-1">Crisis Type</label>
          <select
            value={crisisType}
            onChange={(e) => setCrisisType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option>Medical</option>
            <option>Fire</option>
            <option>Breakdown</option>
            <option>Gas Leak</option>
            <option>Other</option>
          </select>
        </div>

        {/* Radius */}
        <div>
          <label className="block mb-1">Radius</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full border p-2 rounded"
          >
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
          </select>
        </div>

        {/* Location */}
        <div className="text-sm text-gray-600">
          Lat: {position[0]} <br />
          Lng: {position[1]}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Send SOS
          </button>
        </div>

      </div>
    </div>
  )
}