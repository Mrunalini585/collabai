import React, { useEffect, useState } from 'react'
import {
  Plus, ArrowRight, Trash2, Users, Calendar, AlertTriangle,
  FolderKanban, X, ChevronDown, Sparkles, Clock, Edit2, Play
} from 'lucide-react'
import { api } from '../api/client'
import { getSocket } from '../api/socket'
import { Card, Avatar, Badge, Modal, Button, Input, Spinner, EmptyState, Textarea } from '../components/ui'
import type { Project, Task } from '../types'


const COLUMNS: Task['status'][] = ['To Do', 'In Progress', 'Testing', 'Done']
const COL_COLORS: Record<string, string> = {
  'To Do':       'bg-slate-100 text-slate-600',
  'In Progress': 'bg-indigo-100 text-indigo-700',
  'Testing':     'bg-amber-100 text-amber-700',
  'Done':        'bg-emerald-100 text-emerald-700',
}
const COL_ACCENT: Record<string, string> = {
  'To Do':       'border-t-slate-300',
  'In Progress': 'border-t-indigo-400',
  'Testing':     'border-t-amber-400',
  'Done':        'border-t-emerald-400',
}
const PRIORITY_STYLE: Record<string, string> = {
  Low:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  High:   'bg-rose-50 text-rose-700 border border-rose-200',
}

interface NewTaskForm { title: string; priority: 'Low' | 'Medium' | 'High'; description: string }
interface NewProjectForm { name: string; description: string; deadline: string; github_repo: string }

export default function Projects() {
  const [projects, setProjects]           = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [tasks, setTasks]                 = useState<Task[]>([])
  const [loading, setLoading]             = useState(true)

  // View Mode: board | timeline | sprint-planner
  const [viewMode, setViewMode] = useState<'board' | 'timeline' | 'sprint-planner'>('board')
  const [sprintFilter, setSprintFilter] = useState('All')

  // Task Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAssignee, setEditAssignee] = useState<number | null>(null)
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [editStatus, setEditStatus] = useState<Task['status']>('To Do')
  const [editDueDate, setEditDueDate] = useState('')
  const [editSprint, setEditSprint] = useState('')

  // Task Comments
  const [comments, setComments] = useState<any[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // AI Sprint Planner
  const [sprintPlan, setSprintPlan] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [applyingSprint, setApplyingSprint] = useState(false)

  // Invite member modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting]       = useState(false)
  const [inviteMsg, setInviteMsg]     = useState<string | null>(null)
  const [inviteErr, setInviteErr]     = useState<string | null>(null)
  const [members, setMembers]         = useState<any[]>([])

  // Create project modal
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProject, setNewProject] = useState<NewProjectForm>({ name: '', description: '', deadline: '', github_repo: '' })
  const [creatingProject, setCreatingProject] = useState(false)

  // Add task inline
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newTask, setNewTask]   = useState<NewTaskForm>({ title: '', priority: 'Medium', description: '' })
  const [addingTask, setAddingTask] = useState(false)

  // Delete confirm
  const [deletingTask, setDeletingTask] = useState<number | null>(null)


  const loadProjects = async () => {
    try {
      const { data } = await api.get<Project[]>('/api/projects/')
      setProjects(data)
      if (data[0]) selectProject(data[0])
    } finally {
      setLoading(false)
    }
  }

  const selectProject = (p: Project) => {
    setActiveProject(p)
    api.get<Task[]>(`/api/projects/${p.id}/tasks/`).then(({ data }) => setTasks(data))
    api.get(`/api/projects/${p.id}/team/`).then(({ data }) => setMembers(data)).catch(() => [])
  }

  const loadComments = async (taskId: number) => {
    if (!activeProject) return
    setLoadingComments(true)
    try {
      const { data } = await api.get(`/api/projects/${activeProject.id}/tasks/${taskId}/comments`)
      setComments(data)
    } catch {
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const addComment = async () => {
    if (!activeProject || !selectedTask || !newCommentText.trim()) return
    try {
      const { data } = await api.post(`/api/projects/${activeProject.id}/tasks/${selectedTask.id}/comments`, {
        content: newCommentText
      })
      setComments((prev) => [...prev, data])
      setNewCommentText('')
    } catch (e) {
      console.error("Failed to post comment", e)
    }
  }

  const openTaskDetails = (t: Task) => {
    setSelectedTask(t)
    setEditTitle(t.title)
    setEditDesc(t.description || '')
    setEditAssignee(t.assignee_id || null)
    setEditPriority(t.priority)
    setEditStatus(t.status)
    setEditDueDate(t.due_date ? String(t.due_date) : '')
    setEditSprint(t.sprint || '')
    loadComments(t.id)
  }

  const saveTaskDetails = async () => {
    if (!activeProject || !selectedTask) return
    try {
      const { data } = await api.patch<Task>(`/api/projects/${activeProject.id}/tasks/${selectedTask.id}`, {
        title: editTitle,
        description: editDesc,
        assignee_id: editAssignee || null,
        priority: editPriority,
        status: editStatus,
        due_date: editDueDate || null,
        sprint: editSprint || null
      })
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? data : t)))
      setSelectedTask(null)
    } catch (e) {
      console.error("Failed to update task details", e)
    }
  }

  const generateSprintPlan = async () => {
    if (!activeProject) return
    setLoadingPlan(true)
    try {
      const { data } = await api.post('/api/ai/sprint-plan', { project_id: activeProject.id, num_sprints: 3 })
      setSprintPlan(data)
    } catch (err) {
      console.error("Sprint planner failed", err)
    } finally {
      setLoadingPlan(false)
    }
  }

  const applySprintPlan = async () => {
    if (!sprintPlan || !activeProject) return
    setApplyingSprint(true)
    try {
      for (const sprint of sprintPlan.sprints) {
        for (const recommendation of sprint.tasks) {
          const matchedTask = tasks.find(
            (t) => t.title.toLowerCase().trim() === recommendation.toLowerCase().trim() ||
                   t.title.toLowerCase().includes(recommendation.toLowerCase()) ||
                   recommendation.toLowerCase().includes(t.title.toLowerCase())
          )
          if (matchedTask) {
            await api.patch(`/api/projects/${activeProject.id}/tasks/${matchedTask.id}`, {
              sprint: sprint.name
            })
          }
        }
      }
      const { data } = await api.get<Task[]>(`/api/projects/${activeProject.id}/tasks/`)
      setTasks(data)
      alert('Sprint plan applied to your Kanban tasks!')
      setSprintPlan(null)
      setViewMode('board')
    } catch (err) {
      console.error("Error applying sprint plan", err)
    } finally {
      setApplyingSprint(false)
    }
  }


  useEffect(() => { loadProjects() }, [])

  // Live Kanban via Socket.IO
  useEffect(() => {
    if (!activeProject) return
    const socket = getSocket()
    socket.emit('join_project', { project_id: activeProject.id })
    const onCreated = (t: any) => setTasks((prev) => (prev.some((p) => p.id === t.id) ? prev : [...prev, t as Task]))
    const onUpdated = (t: any) => setTasks((prev) => prev.map((p) => (p.id === t.id ? { ...p, ...t } : p)))
    const onDeleted = (t: any) => setTasks((prev) => prev.filter((p) => p.id !== t.id))
    socket.on('task_created', onCreated)
    socket.on('task_updated', onUpdated)
    socket.on('task_deleted', onDeleted)
    return () => {
      socket.emit('leave_project', { project_id: activeProject.id })
      socket.off('task_created', onCreated)
      socket.off('task_updated', onUpdated)
      socket.off('task_deleted', onDeleted)
    }
  }, [activeProject])

  const createProject = async () => {
    if (!newProject.name.trim()) return
    setCreatingProject(true)
    try {
      await api.post('/api/projects/', {
        name: newProject.name,
        description: newProject.description,
        github_repo: newProject.github_repo,
        deadline: newProject.deadline || null,
      })
      setShowCreateProject(false)
      setNewProject({ name: '', description: '', deadline: '', github_repo: '' })
      await loadProjects()
    } finally {
      setCreatingProject(false)
    }
  }

  const inviteMember = async () => {
    if (!activeProject || !inviteEmail.trim()) return
    setInviting(true)
    setInviteMsg(null)
    setInviteErr(null)
    try {
      await api.post(`/api/projects/${activeProject.id}/team/invite`, {
        email: inviteEmail,
        role_in_team: 'member'
      })
      setInviteMsg('Member added successfully!')
      setInviteEmail('')
      // Reload team
      const { data } = await api.get(`/api/projects/${activeProject.id}/team/`)
      setMembers(data)
      setTimeout(() => {
        setInviteMsg(null)
        setShowInvite(false)
      }, 2000)
    } catch (e: any) {
      setInviteErr(e?.response?.data?.detail || 'Failed to invite member. Make sure they signed up first.')
    } finally {
      setInviting(false)
    }
  }

  const addTask = async (status: string) => {
    if (!activeProject || !newTask.title.trim()) return
    setAddingTask(true)
    try {
      const { data } = await api.post<Task>(`/api/projects/${activeProject.id}/tasks/`, {
        title: newTask.title,
        description: newTask.description,
        status,
        priority: newTask.priority,
      })
      setTasks((prev) => [...prev, data])
      setNewTask({ title: '', priority: 'Medium', description: '' })
      setAddingTo(null)
    } finally {
      setAddingTask(false)
    }
  }

  const moveTask = async (task: Task) => {
    const idx        = COLUMNS.indexOf(task.status)
    const nextStatus = COLUMNS[Math.min(COLUMNS.length - 1, idx + 1)]
    const { data }   = await api.patch<Task>(`/api/projects/${task.project_id}/tasks/${task.id}`, { status: nextStatus })
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)))
  }

  const deleteTask = async (id: number) => {
    if (!activeProject) return
    await api.delete(`/api/projects/${activeProject.id}/tasks/${id}`)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setDeletingTask(null)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner size={32} />
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {projects.length > 0 ? (
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const p = projects.find((p) => p.id === Number(e.target.value))
                if (p) selectProject(p)
              }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 bg-white outline-none input-ring"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : null}
          {activeProject && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {activeProject.deadline && (
                <span className="flex items-center gap-1"><Calendar size={12} /> {activeProject.deadline}</span>
              )}
              <Badge tone={activeProject.risk_level === 'High' ? 'red' : activeProject.risk_level === 'Medium' ? 'amber' : 'green'}>
                {activeProject.risk_level} Risk
              </Badge>
              {members.length > 0 && (
                <div className="flex items-center -space-x-1.5 ml-2">
                  {members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} name={m.name} size={5} />
                  ))}
                  {members.length > 4 && (
                    <span className="text-[10px] text-slate-500 font-semibold pl-2">+{members.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeProject && (
            <Button onClick={() => setShowInvite(true)} variant="secondary" className="text-xs px-3 py-2">
              <Users size={14} /> Invite Member
            </Button>
          )}
          <Button onClick={() => setShowCreateProject(true)} className="text-xs px-3 py-2">
            <Plus size={14} /> New Project
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <EmptyState
          icon={<FolderKanban size={28} />}
          title="No projects yet"
          description="Create your first project to start managing tasks with the Kanban board."
        />
      )}

      {/* View Switcher and Sprint Filter */}
      {activeProject && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Project Timeline
            </button>
            <button
              onClick={() => setViewMode('sprint-planner')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'sprint-planner' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              AI Sprint Planner
            </button>
          </div>

          {viewMode === 'board' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Sprint:</span>
              <select
                value={sprintFilter}
                onChange={(e) => setSprintFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white outline-none font-sans"
              >
                <option value="All">All Sprints</option>
                {Array.from(new Set(tasks.map(t => t.sprint).filter(Boolean))).map(sprint => {
                  const sVal = sprint as string
                  return <option key={sVal} value={sVal}>{sVal}</option>
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Kanban board */}
      {projects.length > 0 && viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col && (sprintFilter === 'All' || t.sprint === sprintFilter))
            return (
              <div key={col} className={`bg-slate-50 rounded-2xl border-t-2 border border-slate-200 ${COL_ACCENT[col]} flex flex-col min-h-0`}>
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${COL_COLORS[col]}`}>{col}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => openTaskDetails(t)}
                      className="kanban-card bg-white rounded-xl border border-slate-200 p-3 shadow-sm group cursor-pointer hover:border-indigo-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-slate-800 font-medium leading-snug flex-1">{t.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingTask(t.id); }}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {t.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={String(t.assignee_id || 'U')} size={5} />
                          {t.due_date && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Calendar size={10} /> {t.due_date}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${PRIORITY_STYLE[t.priority]}`}>
                            {t.priority}
                          </span>
                          {col !== 'Done' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTask(t); }}
                              title="Move to next stage"
                              className="text-slate-300 hover:text-indigo-600 transition"
                            >
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add task */}
                  {addingTo === col ? (
                    <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2 shadow-sm">
                      <input
                        autoFocus
                        value={newTask.title}
                        onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addTask(col)}
                        placeholder="Task title…"
                        className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none input-ring"
                      />
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value as any }))}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-white"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addTask(col)}
                          disabled={addingTask || !newTask.title.trim()}
                          className="flex-1 bg-indigo-600 disabled:opacity-40 text-white text-xs rounded-lg py-1.5 font-semibold flex items-center justify-center gap-1"
                        >
                          {addingTask ? <Spinner size={12} className="text-white" /> : null}
                          Add Task
                        </button>
                        <button
                          onClick={() => { setAddingTo(null); setNewTask({ title: '', priority: 'Medium', description: '' }) }}
                          className="px-3 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTo(col)}
                      className="w-full text-xs text-slate-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center gap-1 py-2.5 border border-dashed border-slate-300 rounded-xl transition"
                    >
                      <Plus size={13} /> Add Task
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Project Timeline View */}
      {projects.length > 0 && viewMode === 'timeline' && (
        <Card className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-indigo-600" size={20} /> Project Timeline
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Deadline: {activeProject?.deadline || 'No overall deadline set'}
            </span>
          </div>

          <div className="space-y-6">
            {tasks.filter(t => t.due_date).length === 0 ? (
              <EmptyState
                icon={<Clock size={28} />}
                title="No due dates assigned"
                description="Assign due dates to tasks in the Kanban Board to populate the timeline."
              />
            ) : (
              Object.entries(
                tasks.filter(t => t.due_date).reduce((acc, t) => {
                  const dateStr = String(t.due_date)
                  if (!acc[dateStr]) acc[dateStr] = []
                  acc[dateStr].push(t)
                  return acc
                }, {} as Record<string, Task[]>)
              )
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([dateStr, dateTasks]) => {
                const dueDate = new Date(dateStr)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const timeDiff = dueDate.getTime() - today.getTime()
                const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))

                let progressPercent = 100
                if (activeProject?.deadline) {
                  const projectDeadline = new Date(activeProject.deadline)
                  const totalProjectTime = projectDeadline.getTime() - today.getTime()
                  if (totalProjectTime > 0) {
                    progressPercent = Math.max(0, Math.min(100, Math.round((timeDiff / totalProjectTime) * 100)))
                  }
                }

                return (
                  <div key={dateStr} className="border-l-2 border-indigo-200 pl-4 relative space-y-2 animate-fade-in">
                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm font-bold text-slate-700">
                        {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          daysRemaining < 0 ? 'bg-rose-100 text-rose-700' :
                          daysRemaining === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {daysRemaining < 0 ? 'Overdue' : daysRemaining === 0 ? 'Due Today' : `${daysRemaining} days remaining`}
                        </span>
                        
                        {activeProject?.deadline && daysRemaining >= 0 && (
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden" title={`${progressPercent}% of project duration remaining`}>
                            <div className="bg-indigo-500 h-full" style={{ width: `${progressPercent}%` }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {dateTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => openTaskDetails(t)}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 hover:border-indigo-300 transition cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-700">{t.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{t.status}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${PRIORITY_STYLE[t.priority]}`}>
                              {t.priority}
                            </span>
                            <Avatar name={String(t.assignee_id || 'U')} size={5} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      )}

      {/* AI Sprint Planner View */}
      {projects.length > 0 && viewMode === 'sprint-planner' && (
        <Card className="p-6 flex-1 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} /> AI Sprint Planner
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate sprint recommendations using Gemini AI based on priority, status, and deadlines.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={generateSprintPlan} loading={loadingPlan} className="text-xs px-3 py-2">
                <Sparkles size={14} /> Generate Sprint Plan
              </Button>
              {sprintPlan && (
                <Button
                  onClick={applySprintPlan}
                  loading={applyingSprint}
                  variant="secondary"
                  className="text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play size={12} /> Apply Sprint Plan
                </Button>
              )}
            </div>
          </div>

          {loadingPlan ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
              <Spinner size={32} />
              <span className="text-sm text-slate-500 animate-pulse">Consulting AI model...</span>
            </div>
          ) : !sprintPlan ? (
            <EmptyState
              icon={<Sparkles size={28} className="text-slate-400" />}
              title="No sprint plan generated yet"
              description="Click the button above to run the AI Sprint Planner."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {sprintPlan.sprints?.map((sprint: any, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3">
                  <div className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 flex justify-between items-center">
                    <span>{sprint.name}</span>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {sprint.tasks?.length || 0} tasks
                    </span>
                  </div>
                  <div className="space-y-2 flex-1">
                    {sprint.tasks?.map((taskName: string, j: number) => (
                      <div key={j} className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-600 shadow-sm flex items-center justify-between animate-fade-in">
                        <span className="truncate flex-1 pr-2">{taskName}</span>
                        {(() => {
                          const matched = tasks.find(
                            (t) => t.title.toLowerCase().trim() === taskName.toLowerCase().trim() ||
                                   t.title.toLowerCase().includes(taskName.toLowerCase()) ||
                                   taskName.toLowerCase().includes(t.title.toLowerCase())
                          )
                          return matched ? (
                            <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">
                              Mapped
                            </span>
                          ) : (
                            <span className="text-[8px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase" title="Recommendation doesn't match an active board task. Will not be updated on apply.">
                              New
                            </span>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal open={selectedTask !== null} onClose={() => setSelectedTask(null)} title="Task Details">
          <div className="space-y-4">
            <Input
              label="Task Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <Textarea
              label="Description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Assignee</label>
                <select
                  value={editAssignee || ''}
                  onChange={(e) => setEditAssignee(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none input-ring"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => {
                    const idVal = m.id || m.user_id
                    const nameVal = m.name || m.user?.name || m.email
                    return (
                      <option key={idVal} value={idVal}>
                        {nameVal}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Sprint</label>
                <input
                  type="text"
                  value={editSprint}
                  onChange={(e) => setEditSprint(e.target.value)}
                  placeholder="e.g. Sprint 1"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white input-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white outline-none input-ring"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white outline-none input-ring"
                >
                  {COLUMNS.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 block">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none bg-white input-ring"
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Comments</h4>
              
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {loadingComments ? (
                  <div className="flex justify-center py-2"><Spinner size={14} /></div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{c.user_name || 'User'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-400 focus:bg-white transition"
                />
                <Button onClick={addComment} disabled={!newCommentText.trim()} className="px-3 py-2 text-xs">
                  Post
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveTaskDetails} className="flex-1">
                Save Details
              </Button>
              <Button variant="secondary" onClick={() => setSelectedTask(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      <Modal open={showCreateProject} onClose={() => setShowCreateProject(false)} title="Create New Project">
        <div className="space-y-4">
          <Input
            label="Project Name *"
            value={newProject.name}
            onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Hospital Management System"
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 block">Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of what this project is about…"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none input-ring resize-none"
            />
          </div>
          <Input
            label="Deadline (optional)"
            type="date"
            value={newProject.deadline}
            onChange={(e) => setNewProject((p) => ({ ...p, deadline: e.target.value }))}
          />
          <Input
            label="GitHub Repo (optional)"
            value={newProject.github_repo}
            onChange={(e) => setNewProject((p) => ({ ...p, github_repo: e.target.value }))}
            placeholder="owner/repo"
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={createProject} loading={creatingProject} className="flex-1" disabled={!newProject.name.trim()}>
              Create Project
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateProject(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete task confirm */}
      <Modal open={deletingTask !== null} onClose={() => setDeletingTask(null)} title="Delete Task">
        <p className="text-sm text-slate-500 mb-4">Are you sure you want to delete this task? This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => deletingTask && deleteTask(deletingTask)} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setDeletingTask(null)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Enter the registered email of the student or faculty member you want to add to this project.
          </p>
          <Input
            label="User Email Address *"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="e.g. member@collabai.com"
          />
          {inviteMsg && (
            <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {inviteMsg}
            </div>
          )}
          {inviteErr && (
            <div className="text-xs text-rose-500 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {inviteErr}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={inviteMember}
              loading={inviting}
              disabled={!inviteEmail.trim()}
              className="flex-1"
            >
              Add Member
            </Button>
            <Button variant="secondary" onClick={() => setShowInvite(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
