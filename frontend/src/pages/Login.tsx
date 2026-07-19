import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen w-full flex items-center justify-center p-6">
      {/* Decorative orbs */}
      <div className="orb absolute w-80 h-80 rounded-full opacity-20 top-10 left-10"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '0s' }} />
      <div className="orb absolute w-60 h-60 rounded-full opacity-15 bottom-20 right-20"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDelay: '3s' }} />
      <div className="orb absolute w-40 h-40 rounded-full opacity-10 top-1/2 left-1/3"
        style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)', animationDelay: '1.5s' }} />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg glow-indigo">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">CollabAI</span>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to continue your project journey</p>

          <form onSubmit={submit} className="space-y-5">
            {/* Username or Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Username or Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or email address"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-400/30 rounded-xl px-4 py-2.5 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Spinner size={16} className="text-white" /> : <ArrowRight size={16} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
              Sign Up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          AI-Powered Project Lifecycle Platform · Final Year Project
        </p>
      </div>
    </div>
  )
}
