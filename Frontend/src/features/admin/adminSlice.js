import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../services/axiosInstance'

// ── Thunks ───────────────────────────────────────────────────────────────────

export const fetchStats = createAsyncThunk(
    'admin/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/api/v/admin/stats')
            return data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats')
        }
    }
)

export const fetchAllUsers = createAsyncThunk(
    'admin/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/api/v/admin/users')
            return data.users
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch users')
        }
    }
)

export const fetchAllSOS = createAsyncThunk(
    'admin/fetchSOS',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/api/v/admin/sos')
            return data.sosList
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch SOS list')
        }
    }
)

export const suspendUser = createAsyncThunk(
    'admin/suspend',
    async (userId, { rejectWithValue }) => {
        try {
            await axiosInstance.patch(`/api/v/admin/suspend/${userId}`)
            return userId
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to suspend user')
        }
    }
)

export const unsuspendUser = createAsyncThunk(
    'admin/unsuspend',
    async (userId, { rejectWithValue }) => {
        try {
            await axiosInstance.patch(`/api/v/admin/unsuspend/${userId}`)
            return userId
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to unsuspend user')
        }
    }
)

export const flagFalseAlert = createAsyncThunk(
    'admin/flag',
    async (sosId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/api/v/admin/flag/${sosId}`)
            return { sosId, ...data }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to flag alert')
        }
    }
)

// ── Slice ────────────────────────────────────────────────────────────────────

const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        stats: null,
        users: [],
        sosList: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => { state.error = null },
    },
    extraReducers: (builder) => {
        // Stats
        builder
            .addCase(fetchStats.pending, (state) => { state.loading = true })
            .addCase(fetchStats.fulfilled, (state, action) => {
                state.loading = false
                state.stats = action.payload
            })
            .addCase(fetchStats.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Users
        builder
            .addCase(fetchAllUsers.pending, (state) => { state.loading = true })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.loading = false
                state.users = action.payload
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // All SOS
        builder
            .addCase(fetchAllSOS.pending, (state) => { state.loading = true })
            .addCase(fetchAllSOS.fulfilled, (state, action) => {
                state.loading = false
                state.sosList = action.payload
            })
            .addCase(fetchAllSOS.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Suspend
        builder.addCase(suspendUser.fulfilled, (state, action) => {
            const user = state.users.find((u) => u._id === action.payload)
            if (user) user.isSuspended = true
        })

        // Unsuspend
        builder.addCase(unsuspendUser.fulfilled, (state, action) => {
            const user = state.users.find((u) => u._id === action.payload)
            if (user) {
                user.isSuspended = false
                user.falseAlertCount = 0
            }
        })

        // Flag false alert
        builder.addCase(flagFalseAlert.fulfilled, (state, action) => {
            const sos = state.sosList.find((s) => s._id === action.payload.sosId)
            if (sos) sos.flagged = true
        })
    },
})

export const { clearError } = adminSlice.actions
export default adminSlice.reducer
