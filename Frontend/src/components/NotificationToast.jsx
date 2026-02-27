import { useState, useEffect } from 'react'

const TYPES = {
    'sos:new': { icon: '🆘', color: 'border-accent bg-accent/10 text-accent' },
    success: { icon: '✅', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
    info: { icon: 'ℹ️', color: 'border-blue-500 bg-blue-500/10 text-blue-300' },
    error: { icon: '❌', color: 'border-red-500 bg-red-500/10 text-red-400' },
}

export default function NotificationToast({ notifications, onDismiss }) {
    return (
        <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {notifications.map((n) => {
                const t = TYPES[n.type] || TYPES.info
                return (
                    <div
                        key={n.id}
                        className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl border backdrop-blur-md
              ${t.color} shadow-lg animate-slide-in`}
                    >
                        <span className="text-xl flex-shrink-0">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{n.title}</p>
                            {n.body && <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{n.body}</p>}
                        </div>
                        <button
                            onClick={() => onDismiss(n.id)}
                            className="text-white/40 hover:text-white text-xs ml-1 flex-shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
