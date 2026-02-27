import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
    const { user } = useSelector((s) => s.auth)
    if (!user) return <Navigate to="/auth" replace />
    if (!user.isAdmin) return <Navigate to="/map" replace />
    return <Outlet />
}
