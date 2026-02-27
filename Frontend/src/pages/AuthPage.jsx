import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { registerUser, loginUser, clearError } from '../features/auth/authSlice'
import { Mail, Lock, User, MapPin, AlertCircle, CheckSquare, Square, Bot, X, ArrowRight } from 'lucide-react'

const SKILLS = ['CPR', 'Doctor', 'Nurse', 'Firefighter', 'Mechanic', 'Other']

// ── AI Welcome modal shown after registration ─────────────────────────────
function AIWelcomeModal({ name, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,8,16,0.85)', backdropFilter: 'blur(10px)' }}>
            <div className="card w-full max-w-sm p-6 shadow-2xl shadow-black/60 animate-fade-up space-y-5">
                <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/12 border border-blue-500/25 flex items-center justify-center">
                        <Bot size={22} className="text-blue-400" />
                    </div>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div>
                    <h2 className="font-bold text-slate-100 text-lg">Welcome, {name}!</h2>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        NearHelp uses an AI assistant powered by Gemini. During an active SOS you can request instant crisis guidance — step-by-step first aid, safety instructions, and coordination tips.
                    </p>
                </div>

                <div className="space-y-2.5">
                    {[
                        { label: 'Step-by-step first aid instructions', color: 'text-rose-400' },
                        { label: 'Real-time safety guidance per crisis type', color: 'text-amber-400' },
                        { label: 'Coordination tips for responders', color: 'text-blue-400' },
                    ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-2.5 text-sm text-slate-400">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current ${color}`} />
                            {label}
                        </div>
                    ))}
                </div>

                <button onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold
            text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                    Go to Live Map <ArrowRight size={15} />
                </button>
            </div>
        </div>
    )
}

// ── Main Auth Page ────────────────────────────────────────────────────────
export default function AuthPage() {
    const [tab, setTab] = useState('login')
    const [showAI, setShowAI] = useState(false)
    const [registeredName, setRegisteredName] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { loading, error } = useSelector((s) => s.auth)

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm()
    const watchedSkills = watch('skills') || {}

    const switchTab = (t) => { setTab(t); reset(); dispatch(clearError()) }

    const onSubmit = async (data) => {
        dispatch(clearError())
        if (tab === 'login') {
            const result = await dispatch(loginUser({ email: data.email, password: data.password }))
            if (!result.error) navigate('/map')
        } else {
            const skills = SKILLS.filter((s) => data.skills?.[s])
            const result = await dispatch(registerUser({ name: data.name, email: data.email, password: data.password, skills }))
            if (!result.error) {
                setRegisteredName(data.name)
                setShowAI(true)   // ← show AI welcome instead of navigating immediately
            }
        }
    }

    const toggleSkill = (skill) =>
        setValue(`skills.${skill}`, !watchedSkills[skill], { shouldDirty: true })

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/3 w-[400px] h-[350px] bg-blue-700/7 rounded-full blur-[90px]" />
            </div>

            <div className="relative w-full max-w-[400px]">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 border border-accent/20 rounded-xl mb-4">
                        <MapPin size={22} className="text-accent" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">NearHelp</h1>
                    <p className="text-slate-500 text-sm mt-1">Community crisis response</p>
                </div>

                {/* Card */}
                <div className="card overflow-hidden shadow-2xl shadow-black/40">
                    <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {[{ key: 'login', label: 'Sign In' }, { key: 'register', label: 'Create Account' }].map(({ key, label }) => (
                            <button key={key} onClick={() => switchTab(key)}
                                className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 ${tab === key ? 'text-slate-100 border-b-2 border-accent bg-accent/5' : 'text-slate-500 hover:text-slate-300'
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm">
                                <AlertCircle size={14} className="flex-shrink-0" /> {error}
                            </div>
                        )}

                        {tab === 'register' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">Full Name</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input {...register('name', { required: 'Name is required' })}
                                        placeholder="Your full name" className="input-field pl-9" />
                                </div>
                                {errors.name && <p className="text-rose-400 text-xs">{errors.name.message}</p>}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Email Address</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
                                })}
                                    type="email" placeholder="you@example.com" className="input-field pl-9" />
                            </div>
                            {errors.email && <p className="text-rose-400 text-xs">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Password</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'Minimum 6 characters' },
                                })}
                                    type="password" placeholder="••••••••" className="input-field pl-9" />
                            </div>
                            {errors.password && <p className="text-rose-400 text-xs">{errors.password.message}</p>}
                        </div>

                        {tab === 'register' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">
                                    Skills <span className="text-slate-600 font-normal">(optional)</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {SKILLS.map((skill) => {
                                        const checked = !!watchedSkills[skill]
                                        return (
                                            <button type="button" key={skill} onClick={() => toggleSkill(skill)}
                                                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all duration-150 ${checked
                                                        ? 'bg-accent/10 border-accent/35 text-rose-300'
                                                        : 'bg-secondary border-white/7 text-slate-500 hover:border-white/14 hover:text-slate-400'
                                                    }`}>
                                                {checked ? <CheckSquare size={11} className="text-accent" /> : <Square size={11} />}
                                                {skill}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary mt-2">
                            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Welcome Modal — shown after registration */}
            {showAI && (
                <AIWelcomeModal name={registeredName} onClose={() => { setShowAI(false); navigate('/map') }} />
            )}
        </div>
    )
}
