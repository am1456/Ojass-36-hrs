import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    fetchStats, fetchAllUsers, fetchAllSOS,
    suspendUser, unsuspendUser, flagFalseAlert,
} from '../features/admin/adminSlice'
import {
    Activity, Users, CheckCircle2, Calendar, ShieldAlert, UserX,
    TrendingUp, BarChart2, Loader2, Flag, Circle,
    Ban, UserCheck, AlertOctagon, Info,
} from 'lucide-react'

// ── Mini bar spark visual ─────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
    const pct = max ? Math.round((value / max) * 100) : 0
    return (
        <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
    )
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, color, barColor, max, sub, loading }) {
    return (
        <div className="card p-4 hover:border-white/12 transition-colors group">
            <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${barColor}15`, border: `1px solid ${barColor}25` }}>
                    <Icon size={15} style={{ color: barColor }} />
                </div>
                <TrendingUp size={12} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
            </div>
            {loading
                ? <div className="h-7 w-16 bg-white/4 rounded animate-pulse" />
                : <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value ?? '—'}</p>
            }
            <p className="text-slate-600 text-xs mt-0.5">{label}</p>
            {sub && <p className="text-[10px] mt-0.5" style={{ color: barColor + 'aa' }}>{sub}</p>}
            {max != null && <MiniBar value={value ?? 0} max={max} color={barColor} />}
        </div>
    )
}

const CRISIS_DOT = {
    Medical: '#e11d48', Fire: '#f97316', Breakdown: '#eab308', 'Gas Leak': '#a855f7', Other: '#64748b',
}
const STATUS_PILL = {
    active: { cls: 'badge-red', label: 'Active' },
    resolved: { cls: 'badge-green', label: 'Resolved' },
}

export default function AdminDashboard() {
    const dispatch = useDispatch()
    const { stats, users, sosList, loading } = useSelector((s) => s.admin)

    useEffect(() => {
        dispatch(fetchStats())
        dispatch(fetchAllUsers())
        dispatch(fetchAllSOS())
    }, [dispatch])

    const totalSOS = stats?.totalSOS ?? 0
    const activeSOS = stats?.activeSOS ?? 0
    const resolvedSOS = stats?.resolvedSOS ?? 0
    const totalUsers = stats?.totalUsers ?? 0
    const suspended = stats?.suspendedUsers ?? 0
    const resolveRate = totalSOS ? Math.round((resolvedSOS / totalSOS) * 100) : 0

    return (
        <div className="min-h-screen bg-primary pt-14">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                            <ShieldAlert size={17} className="text-accent" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-100 text-xl tracking-tight">Admin Console</h1>
                            <p className="text-slate-600 text-xs">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    {loading && <Loader2 size={16} className="text-slate-700 animate-spin-slow" />}
                </div>

                {/* ── Stat cards ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard label="Total SOS" value={totalSOS} Icon={Activity} color="#e11d48" barColor="#e11d48" loading={loading} />
                    <StatCard label="Active Now" value={activeSOS} Icon={AlertOctagon} color="#f97316" barColor="#f97316" max={totalSOS} sub={activeSOS ? "needs attention" : "all clear"} loading={loading} />
                    <StatCard label="Resolved" value={resolvedSOS} Icon={CheckCircle2} color="#10b981" barColor="#10b981" max={totalSOS} loading={loading} />
                    <StatCard label="Today's SOS" value={stats?.todaySOS} Icon={Calendar} color="#3b82f6" barColor="#3b82f6" loading={loading} />
                    <StatCard label="Total Users" value={totalUsers} Icon={Users} color="#a78bfa" barColor="#a78bfa" loading={loading} />
                    <StatCard label="Suspended" value={suspended} Icon={UserX} color="#94a3b8" barColor="#94a3b8" max={totalUsers} loading={loading} />
                </div>

                {/* ── Summary strip ────────────────────────────────────────── */}
                <div className="card px-5 py-4 flex flex-wrap gap-6"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                        <BarChart2 size={14} className="text-slate-500" />
                        <span className="text-slate-500 text-xs">Resolution rate</span>
                        <span className="text-emerald-400 font-bold text-sm tabular-nums">{resolveRate}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-slate-500" />
                        <span className="text-slate-500 text-xs">Active / Total</span>
                        <span className="text-slate-300 font-semibold text-sm">{activeSOS} / {totalSOS}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-500" />
                        <span className="text-slate-500 text-xs">Active users</span>
                        <span className="text-slate-300 font-semibold text-sm">{totalUsers - suspended}</span>
                    </div>
                </div>

                {/* ── SOS Table ────────────────────────────────────────────── */}
                <div className="card overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-4"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Activity size={15} className="text-slate-500" />
                        <p className="font-semibold text-slate-200 text-sm">SOS Events</p>
                        <span className="ml-auto text-xs text-slate-700">{sosList.length} total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <tr>
                                    {['Crisis', 'Triggered By', 'Trust', 'Responders', 'Radius', 'Status', 'Date', ''].map((h) => (
                                        <th key={h} className="tbl-head">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sosList.length === 0 && (
                                    <tr><td colSpan={8} className="tbl-cell text-center text-slate-700 py-12">No SOS events recorded</td></tr>
                                )}
                                {sosList.map((sos) => {
                                    const dot = CRISIS_DOT[sos.crisisType] || '#64748b'
                                    const pill = STATUS_PILL[sos.status] || STATUS_PILL.resolved
                                    return (
                                        <tr key={sos._id} className="tbl-row">
                                            <td className="tbl-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                                                    <span className="font-medium text-slate-200">{sos.crisisType}</span>
                                                </div>
                                            </td>
                                            <td className="tbl-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/6 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                                                        {sos.triggeredBy?.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-300 text-sm">{sos.triggeredBy?.name}</p>
                                                        <p className="text-slate-600 text-xs">{sos.triggeredBy?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tbl-cell">
                                                <span className={`text-xs font-bold tabular-nums ${(sos.triggeredBy?.trustScore ?? 100) < 60 ? 'text-rose-400' : 'text-amber-400'
                                                    }`}>
                                                    {sos.triggeredBy?.trustScore ?? 100}
                                                </span>
                                            </td>
                                            <td className="tbl-cell text-slate-400 text-sm tabular-nums">
                                                {sos.responders?.length ?? 0}
                                            </td>
                                            <td className="tbl-cell text-slate-500 text-xs">
                                                {sos.radius ? `${(sos.radius / 1000).toFixed(1)} km` : '—'}
                                            </td>
                                            <td className="tbl-cell">
                                                <div className="flex flex-col gap-1">
                                                    <span className={pill.cls}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 5, border: '1px solid', fontWeight: 500 }}>
                                                        <Circle size={5} fill="currentColor" /> {sos.status}
                                                    </span>
                                                    {sos.flagged && (
                                                        <span className="badge-amber"
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 6px', borderRadius: 4, border: '1px solid', fontWeight: 500 }}>
                                                            <Flag size={8} /> false alert
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="tbl-cell">
                                                <p className="text-slate-500 text-xs">{new Date(sos.createdAt).toLocaleDateString('en-IN')}</p>
                                                <p className="text-slate-700 text-[10px]">{new Date(sos.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="tbl-cell">
                                                {!sos.flagged && (
                                                    <button onClick={() => dispatch(flagFalseAlert(sos._id))}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/8 border border-amber-500/18 hover:bg-amber-500/15 transition-colors whitespace-nowrap">
                                                        <Flag size={11} /> Flag
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Users Table ──────────────────────────────────────────── */}
                <div className="card overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-4"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <Users size={15} className="text-slate-500" />
                        <p className="font-semibold text-slate-200 text-sm">Users</p>
                        <span className="ml-auto text-xs text-slate-700">{users.length} registered</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <tr>
                                    {['User', 'Skills', 'Trust Score', 'False Alerts', 'Joined', 'Status', ''].map((h) => (
                                        <th key={h} className="tbl-head">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 && (
                                    <tr><td colSpan={7} className="tbl-cell text-center text-slate-700 py-12">No users yet</td></tr>
                                )}
                                {users.map((u) => {
                                    const trustColor = u.trustScore >= 80 ? '#10b981' : u.trustScore >= 50 ? '#f59e0b' : '#e11d48'
                                    return (
                                        <tr key={u._id} className="tbl-row">
                                            <td className="tbl-cell">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                                                        {u.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-200 font-medium text-sm">{u.name}</span>
                                                            {u.isAdmin && (
                                                                <span className="badge-blue"
                                                                    style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, border: '1px solid', display: 'inline-flex' }}>
                                                                    admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-600 text-xs">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tbl-cell">
                                                <div className="flex gap-1 flex-wrap max-w-[140px]">
                                                    {u.skills?.length
                                                        ? u.skills.map((sk) => (
                                                            <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded text-slate-500 bg-white/4 border border-white/6">{sk}</span>
                                                        ))
                                                        : <span className="text-slate-700 text-xs">—</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="tbl-cell">
                                                <div>
                                                    <span className="font-bold tabular-nums text-sm" style={{ color: trustColor }}>
                                                        {u.trustScore}
                                                    </span>
                                                    <div className="h-1 w-16 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${u.trustScore}%`, background: trustColor }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tbl-cell">
                                                <span className={`font-semibold tabular-nums text-sm ${u.falseAlertCount > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                                                    {u.falseAlertCount ?? 0}
                                                </span>
                                                {u.falseAlertCount >= 2 && (
                                                    <p className="text-rose-500 text-[10px] mt-0.5">⚠ near ban</p>
                                                )}
                                            </td>
                                            <td className="tbl-cell text-slate-600 text-xs">
                                                {new Date(u.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="tbl-cell">
                                                <span className={u.isSuspended ? 'badge-red' : 'badge-green'}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 5, border: '1px solid', fontWeight: 500 }}>
                                                    <Circle size={5} fill="currentColor" />
                                                    {u.isSuspended ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="tbl-cell">
                                                {!u.isAdmin && (
                                                    u.isSuspended ? (
                                                        <button onClick={() => dispatch(unsuspendUser(u._id))}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/8 border border-emerald-500/18 hover:bg-emerald-500/15 transition-colors">
                                                            <UserCheck size={12} /> Restore
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => dispatch(suspendUser(u._id))}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/8 border border-rose-500/18 hover:bg-rose-500/15 transition-colors">
                                                            <Ban size={12} /> Suspend
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
