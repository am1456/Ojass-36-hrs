import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { triggerSOS } from '../features/sos/sosSlice'

const CRISIS_TYPES = ['Medical', 'Fire', 'Breakdown', 'Gas Leak', 'Other']
const RADII = [
    { label: '500 m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km', value: 2000 },
]

export default function SOSModal({ onClose, userLocation }) {
    const dispatch = useDispatch()
    const { loading } = useSelector((s) => s.sos)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ defaultValues: { crisisType: 'Medical', radius: 1000 } })

    const onSubmit = async (data) => {
        if (!userLocation) {
            alert('Cannot detect your location. Please allow location access.')
            return
        }
        await dispatch(
            triggerSOS({
                crisisType: data.crisisType,
                lat: userLocation.lat,
                lng: userLocation.lng,
                radius: Number(data.radius),
            })
        )
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🆘 Trigger SOS</h2>
                        <p className="text-text/60 text-sm mt-0.5">Alert nearby community members</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text/40 hover:text-white text-2xl leading-none transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Crisis Type */}
                    <div>
                        <label className="block text-sm font-medium text-text/80 mb-2">Crisis Type</label>
                        <select
                            {...register('crisisType', { required: 'Please select a crisis type' })}
                            className="w-full bg-primary border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 transition-all"
                        >
                            {CRISIS_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        {errors.crisisType && (
                            <p className="text-accent text-xs mt-1">{errors.crisisType.message}</p>
                        )}
                    </div>

                    {/* Radius */}
                    <div>
                        <label className="block text-sm font-medium text-text/80 mb-2">Alert Radius</label>
                        <div className="grid grid-cols-3 gap-2">
                            {RADII.map((r) => (
                                <label
                                    key={r.value}
                                    className="cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        value={r.value}
                                        {...register('radius', { required: true })}
                                        className="sr-only peer"
                                    />
                                    <div className="text-center py-2.5 rounded-xl border border-white/10 text-text/60 text-sm font-medium peer-checked:border-accent peer-checked:text-accent peer-checked:bg-accent/10 transition-all duration-200 hover:border-white/20">
                                        {r.label}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Location info */}
                    <div className="bg-primary/50 rounded-xl px-4 py-3 border border-white/5">
                        <p className="text-xs text-text/50 mb-0.5">Your Location</p>
                        {userLocation ? (
                            <p className="text-sm text-text/80 font-mono">
                                {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                            </p>
                        ) : (
                            <p className="text-sm text-accent">⚠ Location unavailable</p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-accent hover:bg-accent/85 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending SOS...' : '🆘 Send SOS Alert'}
                    </button>
                </form>
            </div>
        </div>
    )
}
