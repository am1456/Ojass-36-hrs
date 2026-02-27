import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    getSOSById,
    respondToSOS,
    resolveSOS,
    addResponder,
    updateResponder,
    clearCurrentSOS,
    getAIGuidance,
} from '../features/sos/sosSlice'
import { getSocket } from '../services/socket'

const CRISIS_ICONS = {
    Medical: '🏥', Fire: '🔥', Breakdown: '🚗', 'Gas Leak': '☣️', Other: '⚠️',
}

const STATUS_COLOR = {
    'on the way': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    arrived: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export default function SOSDetailPage() {
    const { sosId } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { currentSOS, aiGuidance, loading } = useSelector((s) => s.sos)
    const { user } = useSelector((s) => s.auth)
    const [userLocation, setUserLocation] = useState(null)
    const [chatMessages, setChatMessages] = useState([])
    const [chatInput, setChatInput] = useState('')

    // Load SOS details
    useEffect(() => {
        dispatch(getSOSById(sosId))
        return () => dispatch(clearCurrentSOS())
    }, [sosId, dispatch])

    // Get location for responding
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => { }
        )
    }, [])

    // Socket: join SOS room + listen for events
    useEffect(() => {
        const s = getSocket()
        if (!s) return

        s.emit('join:sos:room', sosId)

        s.on('responder:joined', (data) => {
            if (data.sosId === sosId) dispatch(addResponder(data))
        })
        s.on('responder:statusUpdate', (data) => {
            if (data.sosId === sosId) dispatch(updateResponder(data))
        })
        s.on('sos:resolved', (data) => {
            if (data.sosId === sosId) dispatch(getSOSById(sosId))
        })
        s.on('chat:message', (data) => {
            if (data.sosId === sosId) {
                setChatMessages((prev) => [...prev, data])
            }
        })

        return () => {
            s.off('responder:joined')
            s.off('responder:statusUpdate')
            s.off('sos:resolved')
            s.off('chat:message')
        }
    }, [sosId, dispatch])

    const handleRespond = () => {
        if (!userLocation) {
            alert('Allow location access to respond')
            return
        }
        dispatch(respondToSOS({ sosId, ...userLocation }))
    }

    const handleResolve = () => {
        if (window.confirm('Mark this SOS as resolved?')) {
            dispatch(resolveSOS(sosId)).then(() => navigate('/map'))
        }
    }

    const handleGetAI = () => {
        dispatch(getAIGuidance(sosId))
    }

    const sendChat = (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        const s = getSocket()
        s?.emit('chat:send', { sosId, from: user.name, message: chatInput.trim() })
        setChatMessages((prev) => [...prev, { sosId, from: user.name, message: chatInput.trim(), self: true }])
        setChatInput('')
    }

    const isTriggerer = currentSOS?.triggeredBy?._id === user?._id
    const isResponding = currentSOS?.responders?.some((r) => r.user?._id === user?._id)
    const isResolved = currentSOS?.status === 'resolved'

    if (loading && !currentSOS) {
        return (
            <div className="min-h-screen bg-primary pt-14 flex items-center justify-center">
                <div className="text-text/50 text-lg animate-pulse">Loading emergency details...</div>
            </div>
        )
    }

    if (!currentSOS) return null

    return (
        <div className="min-h-screen bg-primary pt-14">
            <div className="max-w-4xl mx-auto p-4 lg:p-6 grid gap-4 lg:grid-cols-5">

                {/* Left — SOS Info (3 cols) */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Header card */}
                    <div className={`bg-surface border rounded-2xl p-5 ${isResolved ? 'border-emerald-500/30' : 'border-accent/30'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-4xl">{CRISIS_ICONS[currentSOS.crisisType] || '⚠️'}</span>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">{currentSOS.crisisType}</h1>
                                        <p className="text-text/60 text-sm">Emergency</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isResolved
                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                            : 'bg-accent/15 text-accent border-accent/30'
                                        }`}>
                                        {isResolved ? '✅ Resolved' : '🔴 Active'}
                                    </span>
                                    <span className="text-text/50 text-xs">Radius: {currentSOS.radius}m</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/map')} className="text-text/40 hover:text-white text-2xl leading-none">←</button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-sm text-text/60">
                                Triggered by{' '}
                                <span className="text-white font-medium">{currentSOS.triggeredBy?.name}</span>
                                {currentSOS.triggeredBy?.trustScore !== undefined && (
                                    <span className="ml-2 text-yellow-400">⭐ {currentSOS.triggeredBy.trustScore}</span>
                                )}
                            </p>
                            <p className="text-xs text-text/40 mt-1">
                                {new Date(currentSOS.createdAt).toLocaleString()}
                            </p>
                        </div>

                        {/* Action buttons */}
                        {!isResolved && (
                            <div className="flex gap-2 mt-4 flex-wrap">
                                {!isTriggerer && !isResponding && (
                                    <button
                                        onClick={handleRespond}
                                        className="flex-1 py-2.5 bg-accent hover:bg-accent/80 text-white font-semibold rounded-xl text-sm transition-all"
                                    >
                                        🙋 I'm Responding
                                    </button>
                                )}
                                {isTriggerer && (
                                    <button
                                        onClick={handleResolve}
                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-600/80 text-white font-semibold rounded-xl text-sm transition-all"
                                    >
                                        ✅ Mark Resolved
                                    </button>
                                )}
                                {isResponding && (
                                    <div className="flex-1 py-2.5 text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-semibold">
                                        ✅ You're Responding
                                    </div>
                                )}
                                <button
                                    onClick={handleGetAI}
                                    disabled={loading}
                                    className="px-4 py-2.5 bg-blue-700/30 hover:bg-blue-700/50 text-blue-300 border border-blue-600/30 rounded-xl text-sm font-semibold transition-all"
                                >
                                    🤖 AI Help
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Guidance */}
                    {aiGuidance && (
                        <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-5">
                            <h3 className="text-blue-300 font-bold mb-3 flex items-center gap-2">
                                🤖 AI Crisis Guidance
                            </h3>
                            <div className="text-text/80 text-sm leading-relaxed whitespace-pre-line">
                                {typeof aiGuidance === 'string' ? aiGuidance : JSON.stringify(aiGuidance, null, 2)}
                            </div>
                        </div>
                    )}

                    {/* Responders */}
                    <div className="bg-surface border border-white/8 rounded-2xl p-5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            👥 Responders
                            <span className="ml-auto text-text/40 text-sm font-normal">
                                {currentSOS.responders?.length ?? 0} people
                            </span>
                        </h3>
                        {currentSOS.responders?.length === 0 || !currentSOS.responders ? (
                            <p className="text-text/40 text-sm text-center py-4">No responders yet...</p>
                        ) : (
                            <div className="space-y-3">
                                {currentSOS.responders.map((r, i) => (
                                    <div
                                        key={r.user?._id || i}
                                        className="flex items-center justify-between gap-3 bg-primary/60 rounded-xl px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-white font-medium text-sm">{r.user?.name ?? 'Unknown'}</p>
                                            <div className="flex gap-1 flex-wrap mt-1">
                                                {r.user?.skills?.map((sk) => (
                                                    <span key={sk} className="text-xs bg-blue-700/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-600/20">
                                                        {sk}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[r.status] || ''}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right — Chat (2 cols) */}
                <div className="lg:col-span-2 bg-surface border border-white/8 rounded-2xl flex flex-col" style={{ height: '70vh' }}>
                    <div className="p-4 border-b border-white/8">
                        <h3 className="text-white font-bold flex items-center gap-2">💬 Coordination Chat</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 ? (
                            <p className="text-text/30 text-sm text-center mt-4">No messages yet</p>
                        ) : (
                            chatMessages.map((m, i) => (
                                <div key={i} className={`flex flex-col ${m.self ? 'items-end' : 'items-start'}`}>
                                    <p className="text-text/40 text-xs mb-0.5">{m.from}</p>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.self
                                            ? 'bg-accent/20 text-accent border border-accent/20'
                                            : 'bg-primary/80 text-text/90 border border-white/5'
                                        }`}>
                                        {m.message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat input */}
                    {!isResolved && (
                        <form onSubmit={sendChat} className="p-4 border-t border-white/8 flex gap-2">
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Send a message..."
                                className="flex-1 bg-primary border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-xl text-sm font-semibold transition-all"
                            >
                                Send
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
