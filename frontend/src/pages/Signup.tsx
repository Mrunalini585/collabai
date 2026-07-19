import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, User, Mail, Lock, ChevronDown, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

const ROLES = [
  { value: 'student',     label: '🎓 Student',           desc: 'Works on assigned tasks' },
  { value: 'team_leader', label: '👑 Team Leader',        desc: 'Creates & manages projects' },
  { value: 'faculty',     label: '🏫 Faculty / Guide',    desc: 'Reviews and evaluates teams' },
  { value: 'admin',       label: '⚙️ Administrator',      desc: 'Manages the platform' },
]

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('student')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError(null)
    try {
      await signup(name, email, password, role)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen w-full flex items-center justify-center p-6">
      {/* Decorative orbs */}
      <div className="orb absolute w-96 h-96 rounded-full opacity-15 top-0 right-0"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      <div className="orb absolute w-64 h-64 rounded-full opacity-12 bottom-10 left-10"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '2s' }} />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg glow-indigo">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">CollabAI</span>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-slate-400 text-sm mb-7">Join your team on CollabAI</p>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`text-left rounded-xl p-3 border transition text-xs ${
                      role === r.value
                        ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold">{r.label}</div>
                    <div className="opacity-70 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-400/30 rounded-xl px-4 py-2.5 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full btn-primary text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Spinner size={16} className="text-white" /> : <ArrowRight size={16} />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
