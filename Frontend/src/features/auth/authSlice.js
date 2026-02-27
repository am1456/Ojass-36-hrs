import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../services/axiosInstance'
import { connectSocket, disconnectSocket } from '../../services/socket'

// ── Thunks ───────────────────────────────────────────────────────────────────

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
        error: null,
    },
    reducers: {
        // Called by axiosInstance interceptor after a silent refresh
        setCredentials: (state, action) => {
            state.accessToken = action.payload.accessToken
            state.user = action.payload.user
        },
        // Called by axiosInstance interceptor when refresh itself fails
        logout: (state) => {
            state.user = null
            state.accessToken = null
            disconnectSocket()
        },
        clearError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        // REGISTER
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                connectSocket(action.payload.user._id)
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // LOGIN
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.accessToken = action.payload.accessToken
                connectSocket(action.payload.user._id)
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // LOGOUT
        builder
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null
                state.accessToken = null
                disconnectSocket()
            })
    },
})

export const { setCredentials, logout, clearError } = authSlice.actions
export default authSlice.reducer
