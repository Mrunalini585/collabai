import React, { useEffect, useState } from 'react'
import {
  Plus, ArrowRight, Trash2, Users, Calendar, AlertTriangle,
  FolderKanban, X, ChevronDown,
} from 'lucide-react'
import { api } from '../api/client'
import { getSocket } from '../api/socket'
import { Card, Avatar, Badge, Modal, Button, Input, Spinner, EmptyState } from '../components/ui'
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

      {/* Kanban board */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col)
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
                    <div key={t.id} className="kanban-card bg-white rounded-xl border border-slate-200 p-3 shadow-sm group">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-slate-800 font-medium leading-snug flex-1">{t.title}</span>
                        <button
                          onClick={() => setDeletingTask(t.id)}
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
                              onClick={() => moveTask(t)}
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
