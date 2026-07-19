import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import { Spinner } from '../components/ui'
import { api } from '../api/client'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState(1) // 1 = Request, 2 = Reset
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null)

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      // In a real flow, this sends an email. We call our backend or mock.
      await api.post(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`)
      
      // Simulate token in-app
      const token = Math.floor(100000 + Math.random() * 900000).toString()
      setSimulatedToken(token)
      setSuccess(`Reset link generated! Simulated verification code: ${token}`)
      setStep(2)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  const performReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/auth/reset-password', {
        email: email,
        new_password: newPassword,
      })
      setSuccess('Password updated successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Reset failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg min-h-screen w-full flex items-center justify-center p-6">
      {/* Orbs */}
      <div className="orb absolute w-80 h-80 rounded-full opacity-20 top-10 left-10"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '0s' }} />
      <div className="orb absolute w-60 h-60 rounded-full opacity-15 bottom-20 right-20"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDelay: '3s' }} />

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
          <h2 className="text-2xl font-bold text-white mb-1">
            {step === 1 ? 'Reset password' : 'Set new password'}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {step === 1 
              ? 'Enter your email address and we\'ll send you a password reset code.' 
              : `Code verified. Please enter a new password for ${email}.`
            }
          </p>

          {success && (
            <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-xl px-4 py-3 text-sm text-emerald-300 mb-6">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-rose-500/15 border border-rose-400/30 rounded-xl px-4 py-2.5 text-sm text-rose-300 mb-6">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={requestReset} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <Spinner size={16} className="text-white" /> : <ArrowRight size={16} />}
                {loading ? 'Sending Code…' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={performReset} className="space-y-5">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white/15 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <Spinner size={16} className="text-white" /> : <ArrowRight size={16} />}
                {loading ? 'Resetting Password…' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 flex justify-center">
            <Link to="/login" className="text-sm text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition">
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
