import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../services/axiosInstance'

// ── Thunks ───────────────────────────────────────────────────────────────────

export const getActiveSOSList = createAsyncThunk(
    'sos/getActive',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/api/v1/sos/active')
            return data.activeList
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch active SOS')
        }
    }
)

export const getSOSById = createAsyncThunk(
    'sos/getById',
    async (sosId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get(`/api/v1/sos/${sosId}`)
            return data.sos
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch SOS')
        }
    }
)

export const triggerSOS = createAsyncThunk(
    'sos/trigger',
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/api/v1/sos/trigger', payload)
            return data.sos
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to trigger SOS')
        }
    }
)

export const respondToSOS = createAsyncThunk(
    'sos/respond',
    async ({ sosId, lat, lng }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/api/v1/sos/respond/${sosId}`, { lat, lng })
            return data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to respond')
        }
    }
)

export const resolveSOS = createAsyncThunk(
    'sos/resolve',
    async (sosId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/api/v1/sos/resolve/${sosId}`)
            return { sosId, message: data.message }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to resolve')
        }
    }
)

export const updateResponderStatus = createAsyncThunk(
    'sos/updateStatus',
    async ({ sosId, status }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/api/v1/sos/status/${sosId}`, { status })
            return data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update status')
        }
    }
)

export const getAIGuidance = createAsyncThunk(
    'sos/aiGuidance',
    async (sosId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get(`/api/ai/guidance/${sosId}`)
            return data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to get AI guidance')
        }
    }
)

// ── Slice ────────────────────────────────────────────────────────────────────

const sosSlice = createSlice({
    name: 'sos',
    initialState: {
        activeList: [],       // all active SOS pins on tmap
        currentSOS: null,     // detail page SOS
        aiGuidance: null,
        loading: false,
        error: null,
    },
    reducers: {
        // Socket events patch state directly
        addSOSPin: (state, action) => {
            // Avoid duplicates
            const exists = state.activeList.find((s) => s._id === action.payload.sosId)
            if (!exists) {
                state.activeList.push({
                    _id: action.payload.sosId,
                    crisisType: action.payload.crisisType,
                    location: {
                        type: 'Point',
                        coordinates: [action.payload.location.lng, action.payload.location.lat],
                    },
                    triggeredBy: action.payload.triggeredBy,
                    radius: action.payload.radius,
                    status: 'active',
                })
            }
        },
        removeSOSPin: (state, action) => {
            state.activeList = state.activeList.filter((s) => s._id !== action.payload.sosId)
        },
        addResponder: (state, action) => {
            if (state.currentSOS && state.currentSOS._id === action.payload.sosId) {
                const alreadyIn = state.currentSOS.responders?.find(
                    (r) => r.user?._id === action.payload.responder._id
                )
                if (!alreadyIn) {
                    state.currentSOS.responders = [
                        ...(state.currentSOS.responders || []),
                        {
                            user: action.payload.responder,
                            status: 'on the way',
                            respondedAt: new Date().toISOString(),
                        },
                    ]
                }
            }
        },
        updateResponder: (state, action) => {
            if (state.currentSOS && state.currentSOS._id === action.payload.sosId) {
                const responder = state.currentSOS.responders?.find(
                    (r) => r.user?._id === action.payload.responderId
                )
                if (responder) responder.status = action.payload.status
            }
        },
        clearCurrentSOS: (state) => {
            state.currentSOS = null
            state.aiGuidance = null
        },
        clearError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        // getActiveSOSList
        builder
            .addCase(getActiveSOSList.pending, (state) => { state.loading = true })
            .addCase(getActiveSOSList.fulfilled, (state, action) => {
                state.loading = false
                state.activeList = action.payload
            })
            .addCase(getActiveSOSList.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // getSOSById
        builder
            .addCase(getSOSById.pending, (state) => { state.loading = true })
            .addCase(getSOSById.fulfilled, (state, action) => {
                state.loading = false
                state.currentSOS = action.payload
            })
            .addCase(getSOSById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // triggerSOS
        builder
            .addCase(triggerSOS.fulfilled, (state, action) => {
                state.activeList.push(action.payload)
            })

        // resolveSOS
        builder
            .addCase(resolveSOS.fulfilled, (state, action) => {
                state.activeList = state.activeList.filter((s) => s._id !== action.payload.sosId)
                if (state.currentSOS?._id === action.payload.sosId) {
                    state.currentSOS.status = 'resolved'
                }
            })

        // getAIGuidance
        builder
            .addCase(getAIGuidance.pending, (state) => { state.loading = true })
            .addCase(getAIGuidance.fulfilled, (state, action) => {
                state.loading = false
                state.aiGuidance = action.payload
            })
            .addCase(getAIGuidance.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const {
    addSOSPin,
    removeSOSPin,
    addResponder,
    updateResponder,
    clearCurrentSOS,
    clearError,
} = sosSlice.actions
export default sosSlice.reducer
