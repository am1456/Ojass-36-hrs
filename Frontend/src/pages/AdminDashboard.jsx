import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    fetchStats,
    fetchAllUsers,
    fetchAllSOS,
    suspendUser,
    unsuspendUser,
    flagFalseAlert,
} from '../features/admin/adminSlice'

const STAT_CARDS = [
    { key: 'totalSOS', label: 'Total SOS', icon: '🆘', color: 'text-accent' },
    { key: 'activeSOS', label: 'Active SOS', icon: '🔴', color: 'text-red-400' },
    { key: 'resolvedSOS', label: 'Resolved', icon: '✅', color: 'text-emerald-400' },
    { key: 'todaySOS', label: "Today's SOS", icon: '📅', color: 'text-blue-400' },
    { key: 'totalUsers', label: 'Total Users', icon: '👥', color: 'text-purple-400' },
    { key: 'suspendedUsers', label: 'Suspended', icon: '🚫', color: 'text-orange-400' },
]

export default function AdminDashboard() {
    const dispatch = useDispatch()
    const { stats, users, sosList, loading } = useSelector((s) => s.admin)

    useEffect(() => {
        dispatch(fetchStats())
        dispatch(fetchAllUsers())
        dispatch(fetchAllSOS())
    }, [dispatch])

    return (
        <div className="min-h-screen bg-primary pt-14">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-text/50 text-sm mt-1">City-wide SOS monitoring & management</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {STAT_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="bg-surface border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors"
                        >
                            <p className="text-2xl mb-2">{card.icon}</p>
                            <p className={`text-2xl font-bold ${card.color}`}>
                                {loading ? '—' : stats?.[card.key] ?? 0}
                            </p>
                            <p className="text-text/50 text-xs mt-0.5">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* SOS Table */}
                <div className="bg-surface border border-white/8 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/8">
                        <h2 className="text-lg font-bold text-white">🆘 All SOS Events</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Type', 'Triggered By', 'Responders', 'Status', 'Created', 'Actions'].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-text/40 font-medium text-xs uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sosList.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-text/30">No SOS events found</td>
                                    </tr>
                                )}
                                {sosList.map((sos) => (
                                    <tr
                                        key={sos._id}
                                        className="border-b border-white/5 hover:bg-white/2 transition-colors"
                                    >
                                        <td className="px-5 py-4 font-medium text-white">{sos.crisisType}</td>
                                        <td className="px-5 py-4 text-text/70">
                                            <div>{sos.triggeredBy?.name}</div>
                                            <div className="text-text/40 text-xs">{sos.triggeredBy?.email}</div>
                                        </td>
                                        <td className="px-5 py-4 text-text/70">{sos.responders?.length ?? 0}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${sos.status === 'active'
                                                    ? 'bg-accent/15 text-accent border-accent/30'
                                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                }`}>
                                                {sos.status}
                                            </span>
                                            {sos.flagged && (
                                                <span className="ml-1 inline-block px-2 py-0.5 rounded-full text-xs bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                                    false alert
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-text/50 text-xs">
                                            {new Date(sos.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4">
                                            {!sos.flagged && (
                                                <button
                                                    onClick={() => dispatch(flagFalseAlert(sos._id))}
                                                    className="px-3 py-1.5 bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-lg text-xs hover:bg-orange-500/25 transition-all"
                                                >
                                                    Flag False
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-surface border border-white/8 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/8">
                        <h2 className="text-lg font-bold text-white">👥 All Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Name', 'Email', 'Skills', 'Trust Score', 'False Alerts', 'Status', 'Actions'].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-text/40 font-medium text-xs uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-text/30">No users found</td>
                                    </tr>
                                )}
                                {users.map((u) => (
                                    <tr
                                        key={u._id}
                                        className="border-b border-white/5 hover:bg-white/2 transition-colors"
                                    >
                                        <td className="px-5 py-4 font-medium text-white flex items-center gap-2">
                                            {u.name}
                                            {u.isAdmin && <span className="text-xs bg-blue-700/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-600/30">admin</span>}
                                        </td>
                                        <td className="px-5 py-4 text-text/60 text-xs">{u.email}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {u.skills?.map((s) => (
                                                    <span key={s} className="text-xs bg-secondary text-text/60 px-2 py-0.5 rounded border border-white/5">
                                                        {s}
                                                    </span>
                                                ))}
                                                {u.skills?.length === 0 && <span className="text-text/30 text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-yellow-400 font-semibold">⭐ {u.trustScore}</td>
                                        <td className="px-5 py-4 text-center">{u.falseAlertCount ?? 0}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${u.isSuspended
                                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                }`}>
                                                {u.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {!u.isAdmin && (
                                                u.isSuspended ? (
                                                    <button
                                                        onClick={() => dispatch(unsuspendUser(u._id))}
                                                        className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs hover:bg-emerald-500/25 transition-all"
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => dispatch(suspendUser(u._id))}
                                                        className="px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/25 transition-all"
                                                    >
                                                        Suspend
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
