import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../services/axiosInstance'
import { connectSocket, disconnectSocket } from '../../services/socket'

// ── Thunks ───────────────────────────────────────────────────────────────────

// Called on every app mount — tries to restore session from httpOnly cookie
export const initAuth = createAsyncThunk(
    'auth/init',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/v1/auth/refresh')
            return data
        } catch {
            return rejectWithValue(null) // not logged in — that's fine
        }
    }
)

export const registerUser = createAsyncThunk(
    'auth/register',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/v1/auth/register', formData)
            return data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Registration failed')
        }
    }
)

export const loginUser = createAsyncThunk(
    'auth/login',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/v1/auth/login', formData)
            return data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Login failed')
        }
    }
)

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await axiosInstance.post('/api/v1/auth/logout')
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Logout failed')
        }
    }
)

// ── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        accessToken: null,
        loading: false,
        initializing: true,  // true until initAuth resolves
        error: null,
    },
    reducers: {
        setCredentials: (state, action) => {
            state.accessToken = action.payload.accessToken
            state.user = action.payload.user
        },
        logout: (state) => {
            state.user = null
            state.accessToken = null
            disconnectSocket()
        },
        clearError: (state) => { state.error = null },
    },
    extraReducers: (builder) => {
        // INIT (session restore)
        builder
            .addCase(initAuth.pending, (state) => { state.initializing = true })
            .addCase(initAuth.fulfilled, (state, action) => {
                state.initializing = false
                if (action.payload) {
                    state.user = action.payload.user
                    state.accessToken = action.payload.accessToken
                    connectSocket(action.payload.user._id)
                }
            })
            .addCase(initAuth.rejected, (state) => { state.initializing = false })

        // REGISTER
        builder
            .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                connectSocket(action.payload.user._id)
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false; state.error = action.payload
            })

        // LOGIN
        builder
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                connectSocket(action.payload.user._id)
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false; state.error = action.payload
            })

        // LOGOUT
        builder.addCase(logoutUser.fulfilled, (state) => {
            state.user = null
            state.accessToken = null
            disconnectSocket()
        })
    },
})

export const { setCredentials, logout, clearError } = authSlice.actions
export default authSlice.reducer
