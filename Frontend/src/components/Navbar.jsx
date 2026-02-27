import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../features/auth/authSlice'

export default function Navbar() {
    const { user } = useSelector((s) => s.auth)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await dispatch(logoutUser())
        navigate('/auth')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur border-b border-white/5 h-14 flex items-center px-6 gap-4">
            {/* Logo */}
            <Link to="/map" className="flex items-center gap-2 mr-auto">
                <span className="text-accent text-xl font-bold tracking-tight">🆘</span>
                <span className="text-white font-bold text-lg tracking-tight">NearHelp</span>
            </Link>

            {user && (
                <>
                    <Link
                        to="/map"
                        className="text-text/70 hover:text-white text-sm transition-colors duration-200"
                    >
                        Live Map
                    </Link>
                    {user.isAdmin && (
                        <Link
                            to="/admin"
                            className="text-text/70 hover:text-accent text-sm transition-colors duration-200"
                        >
                            Admin
                        </Link>
                    )}
                    <span className="text-text/50 text-sm hidden md:block">
                        {user.name} · <span className="text-yellow-400">⭐ {user.trustScore ?? 100}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="ml-2 px-4 py-1.5 bg-accent/20 text-accent border border-accent/40 rounded-lg text-sm hover:bg-accent/30 transition-all duration-200"
                    >
                        Logout
                    </button>
                </>
            )}
        </nav>
    )
}
