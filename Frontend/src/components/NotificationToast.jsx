import { AlertCircle, X } from 'lucide-react'

const VARIANTS = {
    sos: { bar: 'bg-rose-500', icon: AlertCircle, iconCls: 'text-rose-400', bg: 'bg-rose-500/8 border-rose-500/20' },
    success: { bar: 'bg-emerald-500', icon: null, iconCls: '', bg: 'bg-emerald-500/8 border-emerald-500/20' },
    info: { bar: 'bg-blue-500', icon: null, iconCls: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/20' },
    error: { bar: 'bg-rose-500', icon: AlertCircle, iconCls: 'text-rose-400', bg: 'bg-rose-500/8 border-rose-500/20' },
}

export default function NotificationToast({ notifications, onDismiss }) {
    return (
        <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
            {notifications.map((n) => {
                const v = VARIANTS[n.type] || VARIANTS.info
                const Icon = v.icon
                return (
                    <div key={n.id} className={`pointer-events-auto relative flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl overflow-hidden animate-slide-in ${v.bg}`}>
                        {/* Left accent bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${v.bar}`} />

                        {Icon && <Icon size={16} className={`flex-shrink-0 mt-0.5 ${v.iconCls}`} />}
                        <div className="flex-1 min-w-0 ml-1">
                            <p className="font-semibold text-sm text-slate-200 leading-snug">{n.title}</p>
                            {n.body && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>}
                        </div>
                        <button onClick={() => onDismiss(n.id)} className="flex-shrink-0 text-slate-600 hover:text-slate-400 transition-colors mt-0.5">
                            <X size={14} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
