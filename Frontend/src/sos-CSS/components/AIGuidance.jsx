import { useEffect, useState } from "react"

export default function AIGuidance() {
  const [guidance, setGuidance] = useState("Loading guidance...")

  useEffect(() => {
    // later replace with real API call
    setTimeout(() => {
      setGuidance("Stay calm. Apply pressure to bleeding area.")
    }, 1000)
  }, [])

  return (
    <div className="p-4 border-t">
      <h4 className="font-bold mb-2">AI Guidance</h4>
      <p className="text-sm">{guidance}</p>
    </div>
  )
}