import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export default function PrivateRoute() {
    const { user } = useSelector((s) => s.auth)
    return user ? <Outlet /> : <Navigate to="/auth" replace />
}
