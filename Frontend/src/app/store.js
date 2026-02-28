import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import sosReducer from '../features/sos/sosSlice'
import adminReducer from '../features/admin/adminSlice'
import { connectSocket } from '../services/socket'

// ── LocalStorage persistence helpers ─────────────────────────────────────────
const LS_KEY = 'resqnow_auth'

const loadAuthState = () => {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : undefined
    } catch {
        return undefined
    }
}

const saveAuthState = (state) => {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({
            user: state.user,
            accessToken: state.accessToken,
        }))
    } catch { /* ignore write errors */ }
}

const clearAuthState = () => {
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
}

// Rehydrate auth from localStorage so the user is never thrown back to AuthPage
const persistedAuth = loadAuthState()

export const store = configureStore({
    reducer: {
        auth: authReducer,
        sos: sosReducer,
        admin: adminReducer,
    },
    // Seed the initial auth state from localStorage
    preloadedState: persistedAuth
        ? { auth: { user: persistedAuth.user, accessToken: persistedAuth.accessToken, loading: false, initializing: false, error: null } }
        : undefined,
})

// If we woke up with a persisted user, connect the socket immediately
if (persistedAuth?.user?._id) {
    connectSocket(persistedAuth.user._id)
}

// Subscribe to save auth state on every change
store.subscribe(() => {
    const { auth } = store.getState()
    if (auth.user) {
        saveAuthState(auth)
    } else {
        // User logged out — wipe storage
        clearAuthState()
    }
})

