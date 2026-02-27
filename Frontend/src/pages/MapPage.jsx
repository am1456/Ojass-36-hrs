import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getActiveSOSList, addSOSPin, removeSOSPin } from '../features/sos/sosSlice'
import { getSocket } from '../services/socket'
import axiosInstance from '../services/axiosInstance'
import SOSModal from '../components/SOSModal'
import NotificationToast from '../components/NotificationToast'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Radio, ChevronRight, Navigation, Bot, X } from 'lucide-react'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CRISIS_COLORS = {
    Medical: '#e11d48', Fire: '#f97316', Breakdown: '#eab308',
    'Gas Leak': '#a855f7', Other: '#64748b',
}

const createSOSIcon = (crisisType) => {
    const c = CRISIS_COLORS[crisisType] || '#e11d48'
    return L.divIcon({
        html: `<div class="sos-pin">
      <div class="sos-pin-ring" style="border-color:${c}50"></div>
      <div class="sos-pin-ring-2" style="border-color:${c}30"></div>
      <div class="sos-pin-dot" style="background:${c}20;border-color:${c}aa">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      </div>
    </div>`,
        className: '', iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -22],
    })
}

const userIcon = L.divIcon({
    html: `<div class="user-pin-dot"></div>`,
    className: '', iconSize: [14, 14], iconAnchor: [7, 7],
})

// ── Google-Maps-style flyTo + save location to backend on first fix ───────
function LocationWatcher({ onLocated }) {
    const map = useMap()
    const flewRef = useRef(false)

    useEffect(() => {
        if (!navigator.geolocation) return
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                onLocated(loc)
                if (!flewRef.current) {
                    flewRef.current = true
                    // Save to backend → makes $nearSphere find this user correctly
                    axiosInstance.patch('/api/v1/sos/location', loc).catch(() => { })
                    // Google-Maps-style: pull back to country, then fly in
                    map.setView([loc.lat, loc.lng], 4, { animate: false })
                    setTimeout(() => {
                        map.flyTo([loc.lat, loc.lng], 15, { animate: true, duration: 2.0, easeLinearity: 0.25 })
                    }, 350)
                }
            },
            () => console.warn('Location denied'),
            { enableHighAccuracy: true, timeout: 12000 }
        )
        return () => navigator.geolocation.clearWatch(id)
    }, [])

    return null
}

// ── AI Corner Widget (non-intrusive) ──────────────────────────────────────
function AICornerWidget() {
    const [open, setOpen] = useState(false)
    const [shown, setShown] = useState(false)
    const [aiText, setAiText] = useState('')
    const [loading, setLoading] = useState(false)
    const { user } = useSelector((s) => s.auth)

    // Show a greeting bubble briefly after mount (login / reload)
    useEffect(() => {
        const t = setTimeout(() => setShown(true), 1500)
        const t2 = setTimeout(() => setShown(false), 6000)
        return () => { clearTimeout(t); clearTimeout(t2) }
    }, [])

    const quickTips = [
        'Tap a red pin on the map to view an SOS and respond.',
        'Use "Trigger SOS" to alert people within 500m – 2km of you.',
        'As a responder, update your status to "arrived" in the SOS detail.',
        'Your trust score increases when you resolve an SOS.',
    ]

    return (
        <div style={{ position: 'absolute', bottom: 88, left: 16, zIndex: 1500 }}>
            {/* Greeting bubble */}
            {shown && !open && (
                <div className="animate-fade-up mb-2 max-w-[200px] px-3 py-2 rounded-xl rounded-bl-sm text-xs text-slate-300"
                    style={{ background: 'rgba(18,28,46,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                    Hi {user?.name?.split(' ')[0]}! Tap me for quick help.
                </div>
            )}

            {/* Expanded panel */}
            {open && (
                <div
                    className="mb-2 animate-fade-up rounded-xl overflow-hidden shadow-2xl shadow-black/60"
                    style={{ width: 250, background: 'rgba(18,28,46,0.97)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
                >
                    <div className="flex items-center justify-between px-3.5 py-3"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2">
                            <Bot size={14} className="text-blue-400" />
                            <p className="text-slate-200 text-xs font-semibold">AI Assistant</p>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                            <X size={14} />
                        </button>
                    </div>

                    <div className="px-3.5 py-3 space-y-1.5">
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mb-2">Quick Tips</p>
                        {quickTips.map((tip, i) => (
                            <div key={i} className="flex gap-2 text-[11px] text-slate-400 leading-snug">
                                <span className="text-blue-500 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                                {tip}
                            </div>
                        ))}
                    </div>

                    <div className="px-3.5 pb-3">
                        <p className="text-slate-600 text-[10px] text-center">
                            Full AI guidance available inside each SOS event
                        </p>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => { setOpen((o) => !o); setShown(false) }}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-black/40 transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ background: open ? '#3b82f6' : 'rgba(18,28,46,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                {open ? <X size={16} className="text-white" /> : <Bot size={17} className="text-blue-400" />}
            </button>
        </div>
    )
}

// ── Main MapPage ──────────────────────────────────────────────────────────
export default function MapPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { activeList } = useSelector((s) => s.sos)

    const [userLoc, setUserLoc] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [notifications, setNotifications] = useState([])

    useEffect(() => { dispatch(getActiveSOSList()) }, [dispatch])

    // Socket event listeners
    useEffect(() => {
        const s = getSocket()
        if (!s) return
        const onNew = (data) => {
            dispatch(addSOSPin(data))
            setNotifications((p) => [...p, {
                id: Date.now(), type: 'sos',
                title: `${data.crisisType} Emergency Nearby`,
                body: `By ${data.triggeredBy?.name} · ${data.radius}m radius`,
            }])
        }
        const onResolved = (data) => {
            dispatch(removeSOSPin(data))
            setNotifications((p) => [...p, { id: Date.now(), type: 'success', title: 'Emergency resolved nearby' }])
        }
        s.on('sos:new', onNew)
        s.on('sos:resolved', onResolved)
        return () => { s.off('sos:new', onNew); s.off('sos:resolved', onResolved) }
    }, [dispatch])

    return (
        // Outer container: below navbar (pt-14), takes full screen
        <div className="fixed inset-0 pt-14 bg-primary" style={{ overflow: 'hidden' }}>

            {/* Toast notifications — appear top-right */}
            <NotificationToast
                notifications={notifications}
                onDismiss={(id) => setNotifications((p) => p.filter((n) => n.id !== id))}
            />

            {/* ── Leaflet map ─────────────────────────────────────────── */}
            <MapContainer
                center={[20.5, 78.9]} zoom={4}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution="© CARTO"
                />

                {/* Geolocation watcher — sets userLoc and triggers flyTo */}
                <LocationWatcher onLocated={setUserLoc} />

                {/* User blue dot */}
                {userLoc && (
                    <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                        <Popup>
                            <div className="p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Navigation size={13} className="text-blue-400" />
                                    <p className="text-slate-300 text-sm font-medium">Your location</p>
                                </div>
                                <p className="text-slate-500 text-xs font-mono">
                                    {userLoc.lat.toFixed(6)}, {userLoc.lng.toFixed(6)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Active SOS pins — each is a clickable pulsing marker */}
                {activeList.map((sos) => {
                    /*
                     * HOW SOS PINS HANG ON MAP:
                     * Each SOS in the DB has a GeoJSON location: { coordinates: [lng, lat] }
                     * We extract [lng, lat] then pass [lat, lng] to Leaflet's Marker (Leaflet uses lat,lng order).
                     * The Marker is anchored at iconAnchor [22,22] (center of the 44x44 icon div).
                     * A separate Circle component draws the alert radius around the same point.
                     */
                    const [lng, lat] = sos.location?.coordinates || [0, 0]
                    const color = CRISIS_COLORS[sos.crisisType] || '#e11d48'
                    return (
                        <Marker
                            key={sos._id}
                            position={[lat, lng]}
                            icon={createSOSIcon(sos.crisisType)}
                            eventHandlers={{ click: () => navigate(`/sos/${sos._id}`) }}
                        >
                            <Popup>
                                <div className="p-3 min-w-[170px]">
                                    <p className="font-semibold text-slate-200 text-sm">{sos.crisisType} Emergency</p>
                                    <p className="text-slate-500 text-xs mt-0.5">By {sos.triggeredBy?.name ?? 'Unknown'}</p>
                                    <p className="text-slate-600 text-xs">{sos.radius}m alert radius</p>
                                    <button
                                        onClick={() => navigate(`/sos/${sos._id}`)}
                                        className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                        style={{ background: `${color}1a`, color, border: `1px solid ${color}44` }}
                                    >
                                        View & Respond <ChevronRight size={11} />
                                    </button>
                                </div>
                            </Popup>
                            {/* Dashed radius circle */}
                            <Circle
                                center={[lat, lng]}
                                radius={sos.radius}
                                pathOptions={{ color, fillColor: color, fillOpacity: 0.04, weight: 1, dashArray: '5 5' }}
                            />
                        </Marker>
                    )
                })}
            </MapContainer>

            {/* ── UI overlays (above Leaflet) ──────────────────────────── */}

            {/* Active alerts badge — top-left */}
            {activeList.length > 0 && (
                <div
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                    style={{
                        position: 'absolute', top: 72, left: 16, zIndex: 1000,
                        background: 'rgba(18,28,46,0.92)',
                        border: '1px solid rgba(225,29,72,0.22)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <Radio size={13} className="text-rose-400" />
                    <span className="text-slate-200 text-xs font-medium">
                        {activeList.length} active alert{activeList.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* AI Corner Widget — bottom-left */}
            <AICornerWidget />

            {/* Trigger SOS button — bottom-center */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1400,
                }}
            >
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2.5 px-7 py-3 rounded-xl font-semibold text-[15px] text-white
            shadow-xl shadow-rose-900/35 transition-all duration-150
            hover:scale-[1.04] active:scale-[0.97]"
                    style={{
                        background: 'linear-gradient(135deg,#e11d48 0%,#9f1239 100%)',
                        border: '1px solid rgba(255,255,255,0.12)',
                    }}
                >
                    <AlertTriangle size={17} strokeWidth={2.5} />
                    Trigger SOS
                </button>
            </div>

            {/* SOS Modal — passes already-fetched userLoc so no second permission prompt */}
            {showModal && (
                <SOSModal onClose={() => setShowModal(false)} userLoc={userLoc} />
            )}
        </div>
    )
}
