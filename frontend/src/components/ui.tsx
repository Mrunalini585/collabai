import React from 'react'

/* ── Card ──────────────────────────────────────────────────────────────── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────────────────────── */
type Tone = 'slate' | 'green' | 'amber' | 'red' | 'indigo' | 'violet' | 'sky'
export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    slate:  'bg-slate-100 text-slate-600',
    green:  'bg-emerald-100 text-emerald-700',
    amber:  'bg-amber-100 text-amber-700',
    red:    'bg-rose-100 text-rose-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    violet: 'bg-violet-100 text-violet-700',
    sky:    'bg-sky-100 text-sky-700',
  }
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */
export function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
    'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-rose-500',
  ]
  const idx = name ? name.charCodeAt(0) % colors.length : 0
  return (
    <div
      className={`w-${size} h-${size} rounded-full ${colors[idx]} text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-white shadow-sm`}
      title={name}
    >
      {name ? name[0].toUpperCase() : '?'}
    </div>
  )
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin text-indigo-600 ${className}`}
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ── Input ──────────────────────────────────────────────────────────────── */
export function Input({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-slate-600 block">{label}</label>}
      <input
        {...props}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none input-ring transition
          ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:bg-white'}
          ${className}`}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

/* ── Textarea ──────────────────────────────────────────────────────────── */
export function Textarea({
  label,
  error,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-slate-600 block">{label}</label>}
      <textarea
        {...props}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none input-ring transition resize-none
          ${error ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}
          ${className}`}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

/* ── Button ──────────────────────────────────────────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  loading?: boolean
}) {
  const variants: Record<BtnVariant, string> = {
    primary: 'btn-primary text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
  }
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
    >
      {loading && <Spinner size={14} className="text-current" />}
      {children}
    </button>
  )
}

/* ── Select ──────────────────────────────────────────────────────────────── */
export function Select({
  label,
  options,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: { value: string | number; label: string }[]
}) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-slate-600 block">{label}</label>}
      <select
        {...props}
        className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none input-ring transition bg-white ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
    </div>
  )
}
