import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../features/auth/authSlice'
import { MapPin, Shield, LogOut, Star } from 'lucide-react'

export default function Navbar() {
    const { user } = useSelector((s) => s.auth)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await dispatch(logoutUser())
        navigate('/auth')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 gap-4"
            style={{ background: 'rgba(8,14,26,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>

            {/* Logo */}
            <Link to="/map" className="flex items-center gap-2.5 mr-auto group">
                <div className="w-7 h-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center transition-colors group-hover:bg-accent/25">
                    <MapPin size={14} className="text-accent" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-100 text-[15px] tracking-tight">NearHelp</span>
            </Link>

            {user && (
                <>
                    <Link to="/map" className="btn-ghost hidden sm:flex items-center gap-1.5 text-xs">
                        <MapPin size={13} /> Live Map
                    </Link>

                    {user.isAdmin && (
                        <Link to="/admin" className="btn-ghost flex items-center gap-1.5 text-xs">
                            <Shield size={13} /> Admin
                        </Link>
                    )}

                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6">
                        <Star size={12} className="text-amber-400" fill="currentColor" />
                        <span className="text-slate-300 text-xs font-medium">{user.trustScore ?? 100}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-slate-400 text-xs">{user.name}</span>
                    </div>

                    <button onClick={handleLogout} className="btn-ghost flex items-center gap-1.5 text-xs text-rose-400 border-rose-500/20 hover:bg-rose-500/8 hover:text-rose-300">
                        <LogOut size={13} /> Sign out
                    </button>
                </>
            )}
        </nav>
    )
}
