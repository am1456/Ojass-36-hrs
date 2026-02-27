import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initAuth } from './features/auth/authSlice'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import AuthPage from './pages/AuthPage'
import MapPage from './pages/MapPage'
import SOSDetailPage from './pages/SOSDetailPage'
import AdminDashboard from './pages/AdminDashboard'
import { Loader2 } from 'lucide-react'

function AppRoutes() {
  const { initializing } = useSelector((s) => s.auth)

  if (initializing) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center gap-3 text-slate-500">
        <Loader2 size={20} className="animate-spin-slow" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/map" element={<MapPage />} />
          <Route path="/sos/:sosId" element={<SOSDetailPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  const dispatch = useDispatch()

  // Restore session from refreshToken cookie on every mount
  useEffect(() => {
    dispatch(initAuth())
  }, [dispatch])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
