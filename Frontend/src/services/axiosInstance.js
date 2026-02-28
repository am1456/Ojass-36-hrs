import axios from 'axios'
import { store } from '../app/store'
import { setCredentials, logout } from '../features/auth/authSlice'

// In dev: VITE_API_URL is empty → baseURL '/' → Vite proxy forwards to localhost:3000
// In prod: VITE_API_URL = 'https://your-app.onrender.com' → direct calls to Render
const BASE_URL = import.meta.env.VITE_API_URL || ''

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,  // send the httpOnly refreshToken cookie
    headers: { 'Content-Type': 'application/json' },
})

// ── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Attach accessToken from Redux store to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.accessToken
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// On 401, silently refresh the token then retry the original request once
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue = []
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue subsequent requests while a refresh is in-flight
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`
                        return axiosInstance(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const { data } = await axios.post(
                    `${BASE_URL}/api/v1/auth/refresh`,
                    {},
                    { withCredentials: true }
                )

                const newAccessToken = data.accessToken
                // Persist new tokens + user back into Redux
                store.dispatch(setCredentials({ accessToken: newAccessToken, user: data.user }))

                // Update default header for future requests
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

                processQueue(null, newAccessToken)

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
                return axiosInstance(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                // Refresh itself failed → log the user out
                store.dispatch(logout())
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default axiosInstance
