import React, { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { api } from '../api/client'
import { Card, Badge } from '../components/ui'
import type { Project, Task } from '../types'

const STATUS_COLS  = ['To Do', 'In Progress', 'Testing', 'Done']
const STATUS_COLORS = ['#94a3b8', '#6366f1', '#f59e0b', '#22c55e']

const PRIORITY_COLS   = ['Low', 'Medium', 'High']
const PRIORITY_COLORS = ['#22c55e', '#f59e0b', '#f43f5e']

export default function Reports() {
  const [projects, setProjects]   = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [tasks, setTasks]         = useState<Task[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(async ({ data }) => {
      setProjects(data)
      if (data[0]) {
        setProjectId(data[0].id)
        const { data: t } = await api.get<Task[]>(`/api/projects/${data[0].id}/tasks/`)
        setTasks(t)
      }
      setLoading(false)
    })
  }, [])

  const loadTasks = async (pid: number) => {
    setProjectId(pid)
    const { data } = await api.get<Task[]>(`/api/projects/${pid}/tasks/`)
    setTasks(data)
  }

  const statusData   = STATUS_COLS.map((c) => ({ name: c, value: tasks.filter((t) => t.status === c).length }))
  const priorityData = PRIORITY_COLS.map((c) => ({ name: c, value: tasks.filter((t) => t.priority === c).length }))
  const total        = tasks.length || 1
  const done         = tasks.filter((t) => t.status === 'Done').length
  const donePct      = Math.round((done / total) * 100)
  const inProg       = tasks.filter((t) => t.status === 'In Progress').length
  const highRisk     = tasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length

  const activeProject = projects.find((p) => p.id === projectId)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
          <p className="font-semibold text-slate-700">{label}</p>
          <p className="text-indigo-600">{payload[0].value} tasks</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Project Analytics</h2>
          <p className="text-sm text-slate-500">Real-time progress insights</p>
        </div>
        {projects.length > 1 && (
          <select
            value={projectId ?? ''}
            onChange={(e) => loadTasks(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none input-ring bg-white"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Completed', value: `${donePct}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Progress', value: inProg, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'High Priority Pending', value: highRisk, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((kpi) => (
          <Card key={kpi.label} className={`p-4 stat-card ${kpi.bg}`}>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
            <div className={`h-1 rounded-full mt-2 ${kpi.bg.replace('50', '200')}`} />
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Overall Completion</span>
          <span className="text-sm font-bold text-indigo-600">{donePct}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${donePct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>0%</span>
          <span>{done} of {tasks.length} tasks done</span>
          <span>100%</span>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">Task Status Distribution</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={180}>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[i] }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-bold text-slate-800 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Bar chart */}
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">Priority Breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Task list table */}
      {tasks.length > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">Task Details</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="text-left py-2 pr-4 font-semibold">Title</th>
                  <th className="text-left py-2 pr-4 font-semibold">Status</th>
                  <th className="text-left py-2 pr-4 font-semibold">Priority</th>
                  <th className="text-left py-2 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5 pr-4 text-slate-700 font-medium">{t.title}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        t.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                        t.status === 'Testing' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{t.status}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        t.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                        t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>{t.priority}</span>
                    </td>
                    <td className="py-2.5 text-slate-400">{t.due_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length > 10 && (
              <p className="text-xs text-slate-400 mt-2 text-center">Showing 10 of {tasks.length} tasks</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
