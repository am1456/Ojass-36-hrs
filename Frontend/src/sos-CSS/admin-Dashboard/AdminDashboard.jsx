import { useEffect, useState } from "react"
import axios from "axios"
import StatsCards from "./StatsCards"
import SOSTable from "./SOSTable"



export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [sosList, setSosList] = useState([])

  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    fetchStats()
    fetchSOS()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/admin/stats",
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setStats(res.data)
    } catch (err) {
      console.log("Stats error", err)
    }
  }

  const fetchSOS = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/admin/sos",
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSosList(res.data)
    } catch (err) {
      console.log("SOS fetch error", err)
    }
  }

  const suspendUser = async (userId) => {
    await axios.patch(
      `http://localhost:3000/api/admin/suspend/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchSOS()
  }

  const flagFalseAlert = async (sosId) => {
    await axios.patch(
      `http://localhost:3000/api/admin/flag/${sosId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchSOS()
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>

      {stats && <StatsCards stats={stats} />}

      <SOSTable
        sosList={sosList}
        onSuspend={suspendUser}
        onFlag={flagFalseAlert}
      />
    </div>
  )
}