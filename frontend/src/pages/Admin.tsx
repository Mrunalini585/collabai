import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card, Badge, Spinner } from '../components/ui'
import {
  Users, FolderKanban, CheckSquare, TrendingUp, Clock,
  UserCircle, Activity, ShieldCheck,
} from 'lucide-react'

interface AdminStats {
  total_users: number
  total_projects: number
  total_tasks: number
  tasks_done: number
  tasks_in_progress: number
  role_breakdown: Record<string, number>
  recent_users: { id: number; name: string; email: string; role: string }[]
  recent_projects: { id: number; name: string; risk_level: string; created_at: string }[]
}

const ROLE_COLORS: Record<string, string> = {
  admin:       'bg-rose-100 text-rose-700',
  faculty:     'bg-amber-100 text-amber-700',
  team_leader: 'bg-indigo-100 text-indigo-700',
  student:     'bg-emerald-100 text-emerald-700',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', faculty: 'Faculty', team_leader: 'Team Leader', student: 'Student',
}

export default function Admin() {
  const [stats, setStats]   = useState<AdminStats | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AdminStats>('/api/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Admin access required. Make sure your account has the "admin" role.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 flex items-center justify-center h-full"><Spinner size={32} /></div>
  if (error) return (
    <div className="p-6">
      <Card className="p-6 border-rose-200">
        <div className="flex items-center gap-2 text-rose-600 font-semibold mb-2">
          <ShieldCheck size={18} /> Access Restricted
        </div>
        <p className="text-sm text-rose-500">{error}</p>
      </Card>
    </div>
  )
  if (!stats) return null

  const donePct = stats.total_tasks ? Math.round((stats.total_tasks / stats.total_tasks) * 100) : 0
  const completionPct = stats.total_tasks ? Math.round((stats.tasks_done / stats.total_tasks) * 100) : 0

  const kpis = [
    { label: 'Total Users',       value: stats.total_users,       icon: Users,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Projects',    value: stats.total_projects,    icon: FolderKanban, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Tasks',       value: stats.total_tasks,       icon: CheckSquare,  color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Completion Rate',   value: `${completionPct}%`,     icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck size={22} className="text-indigo-600" /> Admin Dashboard
        </h2>
        <p className="text-sm text-slate-400">System-wide overview and user management</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={`p-5 stat-card ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
          </Card>
        ))}
      </div>

      {/* Role breakdown */}
      <Card className="p-5">
        <div className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Users size={15} className="text-indigo-600" /> Role Distribution
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stats.role_breakdown).map(([role, count]) => (
            <div key={role} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-800">{count}</div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Task status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Activity size={15} className="text-indigo-600" /> Task Status Summary
          </div>
          <div className="space-y-3">
            {[
              { label: 'Completed', value: stats.tasks_done, color: 'bg-emerald-500' },
              { label: 'In Progress', value: stats.tasks_in_progress, color: 'bg-indigo-500' },
              { label: 'Other', value: stats.total_tasks - stats.tasks_done - stats.tasks_in_progress, color: 'bg-slate-300' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color} transition-all duration-700`}
                    style={{ width: `${stats.total_tasks ? (s.value / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent signups */}
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <UserCircle size={15} className="text-indigo-600" /> Recent Users
          </div>
          <div className="space-y-2">
            {stats.recent_users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{u.name}</div>
                  <div className="text-xs text-slate-400 truncate">{u.email}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent projects */}
      <Card className="p-5">
        <div className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FolderKanban size={15} className="text-indigo-600" /> Recent Projects
        </div>
        <div className="space-y-2">
          {stats.recent_projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FolderKanban size={16} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-700 truncate">{p.name}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={10} /> {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge tone={p.risk_level === 'High' ? 'red' : p.risk_level === 'Medium' ? 'amber' : 'green'}>
                {p.risk_level} Risk
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
