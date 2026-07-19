import React, { useEffect, useState } from 'react'
import { CheckSquare, Clock, AlertTriangle, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { api } from '../../api/client'
import { Card, Badge, Spinner } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Project, Task } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  'To Do':       'bg-slate-100 text-slate-600',
  'In Progress': 'bg-indigo-100 text-indigo-700',
  'Testing':     'bg-amber-100 text-amber-700',
  'Done':        'bg-emerald-100 text-emerald-700',
}
const PRIORITY_COLORS: Record<string, string> = {
  Low:    'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High:   'bg-rose-100 text-rose-700',
}

export default function StudentDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(async ({ data }) => {
      if (!data[0]) { setLoading(false); return }
      const { data: tasks } = await api.get<Task[]>(`/api/projects/${data[0].id}/tasks/`)
      setMyTasks(tasks.filter((t) => t.assignee_id === user?.id))
      setLoading(false)
    })
  }, [user])

  const done   = myTasks.filter((t) => t.status === 'Done').length
  const inProg = myTasks.filter((t) => t.status === 'In Progress').length
  const highPri = myTasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length
  const pct     = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0

  if (loading) return <div className="p-6 flex items-center justify-center h-full"><Spinner size={32} /></div>

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Hey, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-slate-500 text-sm mt-1">Here's what's on your plate today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 stat-card bg-indigo-50 text-center">
          <div className="text-2xl font-bold text-indigo-700">{myTasks.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Assigned</div>
        </Card>
        <Card className="p-4 stat-card bg-amber-50 text-center">
          <div className="text-2xl font-bold text-amber-700">{inProg}</div>
          <div className="text-xs text-slate-500 mt-0.5">In Progress</div>
        </Card>
        <Card className="p-4 stat-card bg-emerald-50 text-center">
          <div className="text-2xl font-bold text-emerald-700">{done}</div>
          <div className="text-xs text-slate-500 mt-0.5">Done</div>
        </Card>
      </div>

      {/* My progress */}
      {myTasks.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">My Progress</span>
            <span className="text-sm font-bold text-indigo-600">{pct}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
            />
          </div>
        </Card>
      )}

      {/* My Tasks */}
      <Card className="p-5">
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
          <CheckSquare size={16} className="text-indigo-600" /> My Tasks
        </div>
        {myTasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm text-slate-500">No tasks assigned to you yet.</p>
            <p className="text-xs text-slate-400 mt-1">Your team leader will assign tasks soon.</p>
          </div>
        )}
        <div className="space-y-2">
          {myTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                t.status === 'Done' ? 'bg-emerald-400' :
                t.status === 'In Progress' ? 'bg-indigo-400' :
                t.status === 'Testing' ? 'bg-amber-400' : 'bg-slate-300'
              }`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${t.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {t.title}
                </div>
                {t.due_date && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={9} /> Due {t.due_date}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>
                  {t.priority}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/ai-assistant')}
          className="p-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl text-left hover:shadow-lg transition"
        >
          <Sparkles size={20} className="mb-2" />
          <div className="text-sm font-semibold">AI Assistant</div>
          <div className="text-xs text-indigo-200 mt-0.5">Ask about your tasks</div>
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="p-4 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-2xl text-left hover:shadow-lg transition"
        >
          <div className="text-xl mb-2">💬</div>
          <div className="text-sm font-semibold">Team Chat</div>
          <div className="text-xs text-slate-400 mt-0.5">Talk to your team</div>
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Students see only their own assigned tasks — not full project analytics
      </p>
    </div>
  )
}
