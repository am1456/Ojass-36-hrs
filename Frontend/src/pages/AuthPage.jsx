import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { registerUser, loginUser, clearError } from '../features/auth/authSlice'

const SKILLS = ['CPR', 'Doctor', 'Nurse', 'Firefighter', 'Mechanic', 'Other']

export default function AuthPage() {
    const [tab, setTab] = useState('login')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { loading, error } = useSelector((s) => s.auth)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm()

    const switchTab = (t) => {
        setTab(t)
        reset()
        dispatch(clearError())
    }

    const onSubmit = async (data) => {
        dispatch(clearError())
        let result
        if (tab === 'login') {
            result = await dispatch(loginUser({ email: data.email, password: data.password }))
        } else {
            const skills = SKILLS.filter((s) => data.skills?.[s])
            result = await dispatch(registerUser({ name: data.name, email: data.email, password: data.password, skills }))
        }
        if (!result.error) navigate('/map')
    }

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-800/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/15 rounded-2xl border border-accent/30 mb-4">
                        <span className="text-4xl">🆘</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">NearHelp</h1>
                    <p className="text-text/60 text-sm mt-1">Community crisis response platform</p>
                </div>

                {/* Card */}
                <div className="bg-surface border border-white/8 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/8">
                        {['login', 'register'].map((t) => (
                            <button
                                key={t}
                                onClick={() => switchTab(t)}
                                className={`flex-1 py-4 text-sm font-medium capitalize transition-all duration-200 ${tab === t
                                        ? 'text-accent border-b-2 border-accent bg-accent/5'
                                        : 'text-text/50 hover:text-white'
                                    }`}
                            >
                                {t === 'login' ? '🔑 Sign In' : '✨ Create Account'}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 text-accent text-sm">
                                {error}
                            </div>
                        )}

                        {/* Name (register only) */}
                        {tab === 'register' && (
                            <div>
                                <label className="block text-sm text-text/70 mb-1.5">Full Name</label>
                                <input
                                    {...register('name', { required: 'Name is required' })}
                                    placeholder="Jane Doe"
                                    className="input-field"
                                />
                                {errors.name && <p className="err-msg">{errors.name.message}</p>}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm text-text/70 mb-1.5">Email Address</label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
                                })}
                                type="email"
                                placeholder="you@example.com"
                                className="input-field"
                            />
                            {errors.email && <p className="err-msg">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-text/70 mb-1.5">Password</label>
                            <input
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'Minimum 6 characters' },
                                })}
                                type="password"
                                placeholder="••••••••"
                                className="input-field"
                            />
                            {errors.password && <p className="err-msg">{errors.password.message}</p>}
                        </div>

                        {/* Skills (register only) */}
                        {tab === 'register' && (
                            <div>
                                <label className="block text-sm text-text/70 mb-2">
                                    Your Skills <span className="text-text/40">(optional)</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SKILLS.map((skill) => (
                                        <label key={skill} className="cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...register(`skills.${skill}`)}
                                                className="sr-only peer"
                                            />
                                            <div className="text-center py-2 rounded-lg border border-white/10 text-text/50 text-xs font-medium peer-checked:border-accent peer-checked:text-accent peer-checked:bg-accent/10 transition-all duration-200 hover:border-white/20 select-none">
                                                {skill}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-accent hover:bg-accent/85 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-accent/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading
                                ? 'Please wait...'
                                : tab === 'login'
                                    ? '🔑 Sign In'
                                    : '✨ Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
