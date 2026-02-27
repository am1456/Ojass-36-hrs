import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getActiveSOSList, addSOSPin, removeSOSPin } from '../features/sos/sosSlice'
import { getSocket } from '../services/socket'
import SOSModal from '../components/SOSModal'
import NotificationToast from '../components/NotificationToast'
import { useNavigate } from 'react-router-dom'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CRISIS_ICONS = {
    Medical: '🏥',
    Fire: '🔥',
    Breakdown: '🚗',
    'Gas Leak': '☣️',
    Other: '⚠️',
}

// Red pulsing marker for SOS pins
const createSOSIcon = (crisisType) =>
    L.divIcon({
        html: `<div class="sos-pin">
      <div class="sos-pin-ring"></div>
      <div class="sos-pin-dot">${CRISIS_ICONS[crisisType] || '⚠️'}</div>
    </div>`,
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
    })

// Blue marker for user position
const userIcon = L.divIcon({
    html: `<div class="user-pin">📍</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
})

function MapUpdater({ center }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.setView([center.lat, center.lng], 14)
    }, [center, map])
    return null
}

export default function MapPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { activeList } = useSelector((s) => s.sos)
    const { user } = useSelector((s) => s.auth)
    const [userLocation, setUserLocation] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [mapCenter, setMapCenter] = useState(null)

    // Load active SOS on mount
    useEffect(() => {
        dispatch(getActiveSOSList())
    }, [dispatch])

    // Get user geolocation
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            },
            () => console.warn('Location permission denied')
        )
    }, [])

    // Socket listeners
    useEffect(() => {
        const s = getSocket()
        if (!s) return

        const onSOSNew = (data) => {
            dispatch(addSOSPin(data))
            setNotifications((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    type: 'sos:new',
                    title: `🆘 ${data.crisisType} Emergency Nearby!`,
                    body: `From ${data.triggeredBy?.name} · ${data.radius}m radius`,
                },
            ])
        }

        const onResolved = (data) => {
            dispatch(removeSOSPin(data))
            setNotifications((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    type: 'success',
                    title: 'SOS Resolved',
                    body: 'A nearby emergency has been resolved.',
                },
            ])
        }

        s.on('sos:new', onSOSNew)
        s.on('sos:resolved', onResolved)

        return () => {
            s.off('sos:new', onSOSNew)
            s.off('sos:resolved', onResolved)
        }
    }, [dispatch])

    const dismissNotification = (id) =>
        setNotifications((prev) => prev.filter((n) => n.id !== id))

    return (
        <div className="fixed inset-0 pt-14 bg-primary">
            {/* Notifications */}
            <NotificationToast notifications={notifications} onDismiss={dismissNotification} />

            {/* Map */}
            <MapContainer
                center={[20.5937, 78.9629]}   // India center as fallback
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <MapUpdater center={mapCenter} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />

                {/* User position */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup>
                            <div className="text-center font-medium">📍 You are here</div>
                        </Popup>
                    </Marker>
                )}

                {/* SOS pins */}
                {activeList.map((sos) => {
                    const [lng, lat] = sos.location?.coordinates || [0, 0]
                    return (
                        <Marker
                            key={sos._id}
                            position={[lat, lng]}
                            icon={createSOSIcon(sos.crisisType)}
                            eventHandlers={{ click: () => navigate(`/sos/${sos._id}`) }}
                        >
                            <Popup>
                                <div className="min-w-[160px]">
                                    <p className="font-bold text-base mb-1">
                                        {CRISIS_ICONS[sos.crisisType]} {sos.crisisType}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        By {sos.triggeredBy?.name ?? 'Unknown'}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/sos/${sos._id}`)}
                                        className="w-full text-center text-xs bg-red-600 text-white rounded py-1.5 hover:bg-red-700 transition-colors"
                                    >
                                        Respond →
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>

            {/* Trigger SOS button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent/85 text-white font-bold rounded-2xl shadow-xl shadow-accent/30 transition-all duration-200 text-lg hover:scale-105 active:scale-95"
                >
                    🆘 Trigger SOS
                </button>
            </div>

            {/* Active count badge */}
            {activeList.length > 0 && (
                <div className="absolute top-20 left-4 z-10 bg-surface/90 border border-accent/40 rounded-xl px-4 py-2 backdrop-blur">
                    <p className="text-accent font-bold text-sm">
                        🔴 {activeList.length} Active Emergency{activeList.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}

            {showModal && (
                <SOSModal
                    onClose={() => setShowModal(false)}
                    userLocation={userLocation}
                />
            )}
        </div>
    )
}
