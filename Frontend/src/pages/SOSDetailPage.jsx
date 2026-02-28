import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    getSOSById, respondToSOS, resolveSOS,
    addResponder, updateResponder, clearCurrentSOS, getAIGuidance,
} from '../features/sos/sosSlice'
import { getSocket } from '../services/socket'
import {
    ArrowLeft, CheckCircle2, UserPlus, Loader2,
    Bot, MessageSquare, Send, MapPin, Circle, Clock,
    ShieldCheck, Star, TriangleAlert,
} from 'lucide-react'

const STATUS_BADGE = {
    'on the way': 'badge-amber',
    arrived: 'badge-green',
}

const CRISIS_COLOR = {
    Medical: '#e11d48', Fire: '#f97316', Breakdown: '#eab308',
    'Gas Leak': '#a855f7', Other: '#64748b',
}

export default function SOSDetailPage() {
    const { sosId } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { currentSOS, aiGuidance, loading } = useSelector((s) => s.sos)
    const { user } = useSelector((s) => s.auth)

    const [userLoc, setUserLoc] = useState(null)
    const [chatMsgs, setChatMsgs] = useState([])
    const [chatInput, setChatInput] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

    // Load SOS
    useEffect(() => {
        dispatch(getSOSById(sosId))
        return () => dispatch(clearCurrentSOS())
    }, [sosId, dispatch])

    // Geolocation
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (p) => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => { }
        )
    }, [])

    // Socket
    useEffect(() => {
        const s = getSocket()
        if (!s) return
        s.emit('join:sos:room', sosId)
        s.on('responder:joined', (d) => { if (d.sosId === sosId) dispatch(addResponder(d)) })
        s.on('responder:statusUpdate', (d) => { if (d.sosId === sosId) dispatch(updateResponder(d)) })
        s.on('sos:resolved', (d) => { if (d.sosId === sosId) dispatch(getSOSById(sosId)) })
        s.on('chat:message', (d) => { if (d.sosId === sosId) setChatMsgs((p) => [...p, d]) })
        return () => {
            s.off('responder:joined')
            s.off('responder:statusUpdate')
            s.off('sos:resolved')
            s.off('chat:message')
        }
    }, [sosId, dispatch])

    const handleRespond = () => {
        if (!userLoc) return alert('Allow location access to respond')
        dispatch(respondToSOS({ sosId, ...userLoc }))
    }

    const handleResolve = () => {
        if (window.confirm('Mark this SOS as resolved?'))
            dispatch(resolveSOS(sosId)).then(() => navigate('/map'))
    }

    const handleAI = async () => {
        setAiLoading(true)
        await dispatch(getAIGuidance(sosId))
        setAiLoading(false)
    }

    const sendChat = (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        const s = getSocket()
        s?.emit('chat:send', { sosId, from: user.name, message: chatInput.trim() })
        setChatMsgs((p) => [...p, { sosId, from: user.name, message: chatInput.trim(), self: true }])
        setChatInput('')
    }

    const isTriggerer = currentSOS?.triggeredBy?._id === user?._id
    const isResponding = currentSOS?.responders?.some((r) => r.user?._id === user?._id)
    const isResolved = currentSOS?.status === 'resolved'
    const accentColor = CRISIS_COLOR[currentSOS?.crisisType] || '#e11d48'

    if (loading && !currentSOS) {
        return (
            <div className="min-h-screen bg-primary pt-14 flex items-center justify-center gap-3 text-slate-500">
                <Loader2 size={18} className="animate-spin-slow" /> Loading...
            </div>
        )
    }
    if (!currentSOS) return null

    return (
        <div className="min-h-screen bg-primary pt-14">
            <div className="max-w-5xl mx-auto p-4 lg:p-6 grid gap-4 lg:grid-cols-5">

                {/* ── Left column (3) ──────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Header */}
                    <div className="card p-5">
                        <div className="flex items-start gap-3">
                            <button onClick={() => navigate('/map')}
                                className="mt-0.5 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
                                <ArrowLeft size={18} />
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-100 text-lg">
                                                {currentSOS.crisisType}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md border"
                                                style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}12` }}>
                                                {isResolved ? 'Resolved' : 'Active'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={11} /> {currentSOS.radius}m radius
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} /> {new Date(currentSOS.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Triggerer */}
                                <div className="mt-4 flex items-center gap-2.5 p-3 rounded-lg"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                        {currentSOS.triggeredBy?.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{currentSOS.triggeredBy?.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Star size={10} className="text-amber-400" fill="currentColor" />
                                            {currentSOS.triggeredBy?.trustScore ?? 100}
                                        </div>
                                    </div>
                                    <span className="ml-auto text-xs text-slate-600">Triggered by</span>
                                </div>

                                {/* Actions */}
                                {!isResolved && (
                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        {!isTriggerer && !isResponding && (
                                            <button onClick={handleRespond}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150"
                                                style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}50`, color: accentColor }}>
                                                <UserPlus size={15} /> I'm Responding
                                            </button>
                                        )}
                                        {isTriggerer && (
                                            <button onClick={handleResolve}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/18 transition-all">
                                                <CheckCircle2 size={15} /> Mark Resolved
                                            </button>
                                        )}
                                        {isResponding && (
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                                <ShieldCheck size={15} /> You're Responding
                                            </div>
                                        )}
                                        <button onClick={handleAI} disabled={aiLoading}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/18 transition-all disabled:opacity-50">
                                            {aiLoading
                                                ? <><Loader2 size={14} className="animate-spin-slow" /> Analyzing...</>
                                                : <><Bot size={15} /> AI Guidance</>
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Guidance */}
                    {aiGuidance && (
                        <div className="card p-5" style={{ borderColor: 'rgba(59,130,246,0.15)' }}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <Bot size={15} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-200 text-sm">AI Crisis Guidance</p>
                                    <p className="text-slate-600 text-xs">
                                        {aiGuidance.fallback ? 'Offline fallback' : aiGuidance.cached ? 'Cached · Groq AI' : 'Groq AI'}
                                    </p>
                                </div>
                            </div>

                            {/* Resolve the nested .guidance if present */}
                            {(() => {
                                const g = aiGuidance.guidance ?? aiGuidance
                                if (typeof g === 'string') {
                                    return <p className="text-slate-400 text-sm leading-relaxed">{g}</p>
                                }
                                return (
                                    <div className="space-y-4">
                                        {/* Immediate steps */}
                                        {g.immediateSteps?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                                                    ✅ Immediate Steps
                                                </p>
                                                <ol className="space-y-1.5">
                                                    {g.immediateSteps.map((step, i) => (
                                                        <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                                                            <span className="text-emerald-500 font-bold flex-shrink-0 w-4">{i + 1}.</span>
                                                            {step}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}

                                        {/* Do NOT */}
                                        {g.doNot?.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                                                    ⛔ Do NOT
                                                </p>
                                                <ul className="space-y-1.5">
                                                    {g.doNot.map((item, i) => (
                                                        <li key={i} className="flex gap-2 text-sm text-slate-400">
                                                            <span className="text-rose-500 flex-shrink-0">—</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {g.emergencySummary && (
                                            <div className="p-3 rounded-lg text-sm text-slate-400 leading-relaxed"
                                                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                                                {g.emergencySummary}
                                            </div>
                                        )}

                                        {/* Call numbers */}
                                        {g.callNumbers?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs text-slate-600">Call:</span>
                                                {g.callNumbers.map((n) => (
                                                    <a key={n} href={`tel:${n}`}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-300"
                                                        style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                                                        📞 {n}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {/* Responders */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-semibold text-slate-200 text-sm">Responders</p>
                            <span className="text-xs text-slate-600">{currentSOS.responders?.length ?? 0} people</span>
                        </div>

                        {!currentSOS.responders?.length ? (
                            <div className="text-center py-6 text-slate-600 text-sm">No responders yet</div>
                        ) : (
                            <div className="space-y-2.5">
                                {currentSOS.responders.map((r, i) => (
                                    <div key={r.user?._id ?? i}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg"
                                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                                {r.user?.name?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-300">{r.user?.name ?? 'Unknown'}</p>
                                                <div className="flex gap-1 flex-wrap mt-0.5">
                                                    {r.user?.skills?.map((sk) => (
                                                        <span key={sk} className="badge-blue text-[10px] py-0.5 px-1.5">{sk}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={STATUS_BADGE[r.status] + ' badge text-[10px]'}>
                                            <Circle size={6} fill="currentColor" />
                                            {r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right column — Chat (2) ───────────────────────────────── */}
                <div className="lg:col-span-2 card flex flex-col" style={{ height: 'calc(100vh - 96px)' }}>
                    <div className="flex items-center gap-2.5 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <MessageSquare size={15} className="text-slate-500" />
                        <p className="font-semibold text-slate-200 text-sm">Coordination Chat</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMsgs.length === 0 && (
                            <p className="text-center text-slate-700 text-xs mt-6">No messages yet</p>
                        )}
                        {chatMsgs.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.self ? 'items-end' : 'items-start'}`}>
                                <p className="text-slate-700 text-[10px] mb-0.5 px-1">{m.from}</p>
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.self
                                    ? 'text-rose-300 rounded-br-sm'
                                    : 'text-slate-300 rounded-bl-sm'
                                    }`}
                                    style={m.self
                                        ? { background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.2)' }
                                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                                    }>
                                    {m.message}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    {!isResolved && (
                        <form onSubmit={sendChat} className="p-3 flex gap-2"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Message..." className="input-field flex-1 text-xs py-2" />
                            <button type="submit"
                                style={{ background: '#e11d48' }}
                                className="flex items-center justify-center w-9 h-9 rounded-lg text-white transition-colors flex-shrink-0 hover:opacity-90">
                                <Send size={14} />
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    )
}
