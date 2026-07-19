import React, { useEffect, useState } from 'react'
import { CheckSquare, Clock, AlertTriangle, Calendar, ArrowRight, Sparkles, Loader2, Zap, TrendingUp } from 'lucide-react'
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
  const [tasks, setTasks]     = useState<Task[]>([])
  const [risk, setRisk]       = useState<any>(null)
  const [sprintPlan, setSprintPlan] = useState<any>(null)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(async ({ data }) => {
      if (!data[0]) { setLoading(false); return }
      const { data: taskData } = await api.get<Task[]>(`/api/projects/${data[0].id}/tasks/`)
      setTasks(taskData)
      setMyTasks(taskData.filter((t) => t.assignee_id === user?.id))
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
      setLoading(false)
    })
  }, [user])

  const done   = myTasks.filter((t) => t.status === 'Done').length
  const inProg = myTasks.filter((t) => t.status === 'In Progress').length
  const highPri = myTasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length
  const pct     = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0

  const totalTasksCount = tasks.length
  const totalDoneCount = tasks.filter((t) => t.status === 'Done').length
  const overallPct = totalTasksCount ? Math.round((totalDoneCount / totalTasksCount) * 100) : 0

  // Chart data calculations
  const statusData = ['To Do', 'In Progress', 'Testing', 'Done'].map((col) => ({
    name: col,
    value: tasks.filter((t) => t.status === col).length
  }))

  const priorityData = ['Low', 'Medium', 'High'].map((col) => ({
    name: col,
    value: tasks.filter((t) => t.priority === col).length
  }))

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

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My progress */}
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
          <p className="text-[10px] text-slate-400 mt-2">{done} of {myTasks.length} tasks completed</p>
        </Card>

        {/* Overall progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Overall Project Progress</span>
            <span className="text-sm font-bold text-violet-600">{overallPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{totalDoneCount} of {totalTasksCount} project tasks completed</p>
        </Card>
      </div>

      {/* Project Analysis Section */}
      {tasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <TrendingUp size={16} className="text-indigo-600" /> Project Reports & Analysis
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Task Status Distribution */}
            <Card className="p-5">
              <div className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Task Status Distribution</div>
              <div className="space-y-4">
                {/* Stacked bar */}
                <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden">
                  {statusData.map((d, i) => {
                    const totalTasks = tasks.length || 1;
                    const percent = Math.round((d.value / totalTasks) * 100);
                    if (d.value === 0) return null;
                    return (
                      <div 
                        key={d.name}
                        style={{ width: `${percent}%`, backgroundColor: ['#94a3b8', '#6366f1', '#f59e0b', '#22c55e'][i] }}
                        className="h-full transition-all duration-500"
                        title={`${d.name}: ${d.value} tasks (${percent}%)`}
                      />
                    );
                  })}
                </div>
                {/* List Legend */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {statusData.map((d, i) => {
                    const totalTasks = tasks.length || 1;
                    const percent = Math.round((d.value / totalTasks) * 100);
                    return (
                      <div key={d.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#94a3b8', '#6366f1', '#f59e0b', '#22c55e'][i] }} />
                          <span className="text-slate-500 truncate">{d.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800 shrink-0 ml-1">{d.value} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Priority Breakdown */}
            <Card className="p-5">
              <div className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Priority Breakdown</div>
              <div className="space-y-3.5">
                {priorityData.map((d, i) => {
                  const maxVal = Math.max(...priorityData.map(item => item.value)) || 1;
                  const percent = Math.round((d.value / maxVal) * 100);
                  const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                  const textColors = ['text-emerald-700', 'text-amber-700', 'text-rose-700'];
                  
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-500">{d.name} Priority</span>
                        <span className={`font-semibold ${textColors[i]}`}>{d.value} tasks</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full ${colors[i]} transition-all duration-500`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

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
            <div key={t.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-55 border border-slate-200/80 bg-white hover:bg-slate-50/80 transition shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  t.status === 'Done' ? 'bg-emerald-400' :
                  t.status === 'In Progress' ? 'bg-indigo-400' :
                  t.status === 'Testing' ? 'bg-amber-400' : 'bg-slate-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.status === 'Done' ? 'line-through text-slate-400 font-normal' : 'text-slate-700 font-semibold'}`}>
                    {t.title}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${STATUS_COLORS[t.status]}`}>
                    {t.status}
                  </span>
                </div>
              </div>

              {t.description && (
                <div className="text-xs text-slate-400 pl-5 leading-relaxed font-sans">
                  {t.description}
                </div>
              )}

              <div className="flex items-center gap-3 pl-5 mt-1">
                {t.due_date && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar size={9} /> Due {t.due_date}
                  </div>
                )}
                {t.sprint && (
                  <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.2 rounded text-[9px] font-bold">
                    {t.sprint}
                  </span>
                )}
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
