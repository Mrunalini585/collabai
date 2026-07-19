import React, { useEffect, useState } from 'react'
import { CheckCircle2, Sparkles, Loader2, TrendingUp, Users, Calendar, Zap, AlertTriangle, ArrowRight } from 'lucide-react'
import { api } from '../../api/client'
import { Card, Badge, Spinner } from '../../components/ui'
import type { Project, Task } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function TeamLeaderDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects]     = useState<Project[]>([])
  const [tasks, setTasks]           = useState<Task[]>([])
  const [risk, setRisk]             = useState<any>(null)
  const [sprintPlan, setSprintPlan] = useState<any>(null)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(async ({ data }) => {
      setProjects(data)
      if (data[0]) {
        const { data: taskData } = await api.get<Task[]>(`/api/projects/${data[0].id}/tasks/`)
        setTasks(taskData)
        setLoadingRisk(true)
        try {
          const { data: riskData } = await api.get(`/api/ai/risk/${data[0].id}`)
          setRisk(riskData)
        } catch {}
        try {
          const { data: sprintData } = await api.post('/api/ai/sprint-plan', { project_id: data[0].id, num_sprints: 3 })
          setSprintPlan(sprintData)
        } catch {}
        setLoadingRisk(false)
      }
      setLoading(false)
    })
  }, [])

  const done    = tasks.filter((t) => t.status === 'Done').length
  const inProg  = tasks.filter((t) => t.status === 'In Progress').length
  const highPri = tasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length
  const pct     = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  if (loading) return <div className="p-6 flex items-center justify-center h-full"><Spinner size={32} /></div>

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Here's what's happening with your projects today.</p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="btn-primary text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2"
        >
          Open Kanban <ArrowRight size={14} />
        </button>
      </div>

      {projects.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
          <p className="text-sm text-slate-400 mb-4">Create your first project to unlock the full AI-powered dashboard.</p>
          <button onClick={() => navigate('/projects')} className="btn-primary text-white rounded-xl px-5 py-2 text-sm">
            Create Project
          </button>
        </Card>
      )}

      {projects.length > 0 && (
        <>
          {/* KPI stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 stat-card bg-indigo-50">
              <div className="text-xs text-indigo-500 font-semibold mb-1">Project Health</div>
              <div className="text-3xl font-bold text-indigo-700">{pct}%</div>
              <div className="text-xs text-slate-400 mb-2">Completed</div>
              <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </Card>
            <Card className="p-5 stat-card bg-amber-50">
              <div className="text-xs text-amber-500 font-semibold mb-1">In Progress</div>
              <div className="text-3xl font-bold text-amber-700">{inProg}</div>
              <div className="text-xs text-slate-400">Active tasks</div>
            </Card>
            <Card className="p-5 stat-card bg-rose-50">
              <div className="text-xs text-rose-500 font-semibold mb-1">High Priority</div>
              <div className="text-3xl font-bold text-rose-700">{highPri}</div>
              <div className="text-xs text-slate-400">Pending tasks</div>
            </Card>
            <Card className="p-5 stat-card bg-emerald-50">
              <div className="text-xs text-emerald-500 font-semibold mb-1">Next Deadline</div>
              <div className="text-xl font-bold text-emerald-700 truncate">
                {projects[0].deadline || '—'}
              </div>
              <div className="text-xs text-slate-400">Project deadline</div>
            </Card>
          </div>

          {/* AI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Risk Prediction */}
            <Card className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
              <div className="flex items-center gap-2 font-semibold mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                AI Risk Prediction
              </div>
              {loadingRisk && (
                <div className="flex items-center gap-2 text-indigo-200 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Analyzing project…
                </div>
              )}
              {risk && (
                <div>
                  <div className="text-5xl font-black mb-1">{risk.probability_of_delay}%</div>
                  <div className="text-indigo-200 text-sm mb-3">delay probability</div>
                  <div className="space-y-1.5">
                    {risk.reasons?.slice(0, 3).map((r: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-indigo-100">
                        <AlertTriangle size={11} className="text-amber-300 shrink-0" /> {r}
                      </div>
                    ))}
                  </div>
                  {risk.suggestions?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="text-xs font-semibold text-indigo-200 mb-2">Suggestions:</div>
                      {risk.suggestions.slice(0, 2).map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-indigo-100 mb-1">
                          <Zap size={10} className="text-yellow-300 shrink-0" /> {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!risk && !loadingRisk && (
                <div className="text-indigo-200 text-sm">
                  AI risk prediction requires an API key in backend/.env
                </div>
              )}
            </Card>

            {/* Sprint Plan */}
            <Card className="p-5">
              <div className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Zap size={14} className="text-amber-600" />
                </div>
                AI Sprint Plan
              </div>
              {!sprintPlan && !loadingRisk && (
                <div className="text-sm text-slate-400">Sprint plan requires an API key in backend/.env</div>
              )}
              {loadingRisk && <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Planning sprints…</div>}
              {sprintPlan && (
                <div className="space-y-2">
                  {sprintPlan.sprints?.slice(0, 3).map((sprint: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs font-bold text-slate-700 mb-1.5">{sprint.name}</div>
                      <div className="flex flex-wrap gap-1">
                        {sprint.tasks?.slice(0, 4).map((t: string, j: number) => (
                          <span key={j} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t}</span>
                        ))}
                        {sprint.tasks?.length > 4 && (
                          <span className="text-[10px] text-slate-400">+{sprint.tasks.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recent tasks */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <CheckCircle2 size={15} className="text-indigo-600" /> Recent Tasks
              </div>
              <button onClick={() => navigate('/projects')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                View Kanban <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === 'Done' ? 'bg-emerald-400' :
                    t.status === 'In Progress' ? 'bg-indigo-400' :
                    t.status === 'Testing' ? 'bg-amber-400' : 'bg-slate-300'
                  }`} />
                  <span className="text-sm text-slate-700 flex-1 truncate">{t.title}</span>
                  <Badge tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'green'}>
                    {t.priority}
                  </Badge>
                  <span className="text-xs text-slate-400">{t.status}</span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-slate-400 py-2">No tasks yet. Add tasks from the Projects page.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
