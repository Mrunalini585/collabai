import React, { useEffect, useState } from 'react'
import { ShieldCheck, Star, TrendingUp, Users, MessageSquare, ChevronRight, Sparkles, Clock, AlertTriangle } from 'lucide-react'
import { api } from '../../api/client'
import { Card, Badge, Spinner } from '../../components/ui'
import type { Project, Task } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function FacultyDashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [projects, setProjects]   = useState<Project[]>([])
  const [taskCounts, setTaskCounts] = useState<Record<number, { done: number; total: number; high: number }>>({})
  const [ratings, setRatings]     = useState<Record<number, number>>({})
  const [risks, setRisks]         = useState<Record<number, any>>({})
  const [sprintPlans, setSprintPlans] = useState<Record<number, any>>({})
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(async ({ data }) => {
      setProjects(data)
      const counts: Record<number, { done: number; total: number; high: number }> = {}
      const risksMap: Record<number, any> = {}
      const sprintsMap: Record<number, any> = {}
      
      for (const p of data) {
        const { data: tasks } = await api.get<Task[]>(`/api/projects/${p.id}/tasks/`)
        counts[p.id] = {
          done:  tasks.filter((t) => t.status === 'Done').length,
          total: tasks.length,
          high:  tasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length,
        }
        
        try {
          const { data: riskData } = await api.get(`/api/ai/risk/${p.id}`)
          risksMap[p.id] = riskData
        } catch {}
        
        try {
          const { data: sprintData } = await api.post('/api/ai/sprint-plan', { project_id: p.id, num_sprints: 3 })
          sprintsMap[p.id] = sprintData
        } catch {}
      }
      setTaskCounts(counts)
      setRisks(risksMap)
      setSprintPlans(sprintsMap)
      setLoading(false)
    })
  }, [])

  const setRating = (projectId: number, stars: number) => {
    setRatings((r) => ({ ...r, [projectId]: stars }))
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-full"><Spinner size={32} /></div>

  const totalProjects = projects.length
  const atRisk        = projects.filter((p) => p.risk_level === 'High').length
  const avgCompletion = projects.length
    ? Math.round(
        projects.reduce((sum, p) => {
          const c = taskCounts[p.id]
          return sum + (c?.total ? (c.done / c.total) * 100 : 0)
        }, 0) / projects.length
      )
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck size={24} className="text-indigo-600" /> Faculty Review Panel
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Monitor team progress and evaluate project contributions across all projects.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 stat-card bg-indigo-50 text-center">
          <div className="text-2xl font-bold text-indigo-700">{totalProjects}</div>
          <div className="text-xs text-slate-500 mt-0.5">Projects</div>
        </Card>
        <Card className="p-4 stat-card bg-amber-50 text-center">
          <div className="text-2xl font-bold text-amber-700">{avgCompletion}%</div>
          <div className="text-xs text-slate-500 mt-0.5">Avg. Completion</div>
        </Card>
        <Card className="p-4 stat-card bg-rose-50 text-center">
          <div className="text-2xl font-bold text-rose-700">{atRisk}</div>
          <div className="text-xs text-slate-500 mt-0.5">At Risk</div>
        </Card>
      </div>

      {/* Projects */}
      {projects.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-400">No projects to review yet. You'll see teams' projects here once you're added to their team.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const c   = taskCounts[p.id] || { done: 0, total: 0, high: 0 }
          const pct = c.total ? Math.round((c.done / c.total) * 100) : 0
          const rating = ratings[p.id] || 0
          const projectRisk = risks[p.id]
          const sprintPlan = sprintPlans[p.id]

          return (
            <Card key={p.id} className="p-5 flex flex-col justify-between">
              <div>
                {/* Project header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-800 text-base">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.description || 'No description'}</div>
                  </div>
                  <Badge tone={p.risk_level === 'High' ? 'red' : p.risk_level === 'Medium' ? 'amber' : 'green'}>
                    {p.risk_level} Risk
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{c.done}/{c.total} tasks complete</span>
                    <span className="font-semibold text-indigo-600">{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    />
                  </div>
                  {c.high > 0 && (
                    <div className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <TrendingUp size={10} /> {c.high} high-priority tasks still pending
                    </div>
                  )}
                </div>

                {/* AI Risk Assessment */}
                {projectRisk && (
                  <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-1">
                      <Sparkles size={12} className="text-indigo-600" /> AI Risk prediction: {projectRisk.probability_of_delay}% delay
                    </div>
                    {projectRisk.reasons?.length > 0 && (
                      <div className="space-y-0.5">
                        {projectRisk.reasons.slice(0, 2).map((r: string, idx: number) => (
                          <div key={idx} className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <AlertTriangle size={9} className="text-amber-500 shrink-0" /> {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Sprint Plan summary */}
                {sprintPlan && (
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-600 mb-1">AI Sprints Recommendation:</div>
                    <div className="flex flex-wrap gap-1">
                      {sprintPlan.sprints?.slice(0, 2).map((sprint: any, idx: number) => (
                        <span key={idx} className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {sprint.name} ({sprint.tasks?.length || 0} tasks)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                {/* Star rating */}
                <div className="border-t border-slate-100 pt-3 mt-4">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Your Evaluation</div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setRating(p.id, s)}
                        className="transition hover:scale-110"
                      >
                        <Star
                          size={20}
                          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="text-xs text-amber-600 ml-2 font-semibold">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                      </span>
                    )}
                  </div>
                  {rating === 0 && <p className="text-[11px] text-slate-400">Click stars to rate this team's performance</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate('/reports')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-3 py-2 font-semibold transition"
                  >
                    <TrendingUp size={12} /> Analytics
                  </button>
                  <button
                    onClick={() => navigate('/chat')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2 font-semibold transition"
                  >
                    <MessageSquare size={12} /> Chat
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
