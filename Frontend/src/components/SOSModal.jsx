import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { triggerSOS } from '../features/sos/sosSlice'
import { X, AlertTriangle, Loader2, Navigation } from 'lucide-react'

const CRISIS_TYPES = ['Medical', 'Fire', 'Breakdown', 'Gas Leak', 'Other']

const CRISIS_META = {
    Medical: '#e11d48',
    Fire: '#f97316',
    Breakdown: '#eab308',
    'Gas Leak': '#a855f7',
    Other: '#64748b',
}

const RADII = [
    { label: '500 m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km', value: 2000 },
]

// userLoc is passed from MapPage — already fetched when map loads
export default function SOSModal({ onClose, userLoc }) {
    const dispatch = useDispatch()
    const { loading } = useSelector((s) => s.sos)

    const { register, handleSubmit, watch } = useForm({
        defaultValues: { crisisType: 'Medical', radius: 1000 },
    })

    const selectedType = watch('crisisType')

    const onSubmit = async (data) => {
        if (!userLoc) return
        const result = await dispatch(
            triggerSOS({
                crisisType: data.crisisType,
                lat: userLoc.lat,
                lng: userLoc.lng,
                radius: Number(data.radius),
            })
        )
        if (!result.error) onClose()
    }

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,8,16,0.82)', backdropFilter: 'blur(8px)', zIndex: 2000 }}
        >
            <div
                className="card w-full max-w-sm shadow-2xl shadow-black/70 animate-fade-up"
                style={{ zIndex: 2001, position: 'relative' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                            <AlertTriangle size={17} className="text-rose-400" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-100 text-[15px]">Trigger SOS</h2>
                            <p className="text-slate-600 text-xs">Alert nearby community members</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">

                    {/* Crisis type */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">Crisis Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CRISIS_TYPES.map((t) => {
                                const color = CRISIS_META[t]
                                const active = selectedType === t
                                return (
                                    <label key={t} className="cursor-pointer">
                                        <input type="radio" value={t} {...register('crisisType')} className="sr-only" />
                                        <div
                                            className="text-center py-2 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer"
                                            style={
                                                active
                                                    ? { color, borderColor: color + '55', background: color + '18' }
                                                    : { color: '#475569', borderColor: 'rgba(255,255,255,0.07)', background: 'transparent' }
                                            }
                                        >
                                            {t}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    {/* Radius */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">Alert Radius</label>
                        <div className="grid grid-cols-3 gap-2">
                            {RADII.map((r) => (
                                <label key={r.value} className="cursor-pointer">
                                    <input type="radio" value={r.value} {...register('radius')} className="sr-only peer" />
                                    <div className="text-center py-2 rounded-lg border border-white/7 text-slate-600 text-xs font-medium
                    peer-checked:border-rose-500/40 peer-checked:text-rose-400 peer-checked:bg-rose-500/12
                    hover:border-white/14 hover:text-slate-400 transition-all duration-150 cursor-pointer">
                                        {r.label}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Location status */}
                    <div
                        className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg text-xs"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <Navigation size={13} className={userLoc ? 'text-emerald-400' : 'text-slate-600'} />
                        {userLoc ? (
                            <span className="font-mono text-slate-400">
                                {userLoc.lat.toFixed(5)}, {userLoc.lng.toFixed(5)}
                            </span>
                        ) : (
                            <span className="text-rose-400">
                                Location not available — allow browser location access
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !userLoc}
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <><Loader2 size={14} className="animate-spin-slow" /> Sending alert...</>
                            : <><AlertTriangle size={14} /> Send SOS Alert</>
                        }
                    </button>
                </form>
            </div>
        </div>
    )
}
