import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 3000 })

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_PROJECTS = [
  { id: 1, name: "AI-Powered Project Lifecycle Platform", description: "Centralized web app with Kanban boards, AI sprint planning, real-time chat, and GitHub integration.", deadline: "2026-08-19", github_repo: "Krushitha30/collabai-project-final", risk_level: "Medium" }
]
const SEED_TASKS = [
  { id: 101, project_id: 1, title: "Create system architecture diagram", description: "Draft the multi-tier component architecture.", assignee_id: 3, priority: "High", status: "To Do", due_date: "2026-07-24" },
  { id: 102, project_id: 1, title: "Integrate email notifications", description: "Set up API credentials for automated mail triggers.", assignee_id: 2, priority: "Low", status: "To Do", due_date: "2026-08-04" },
  { id: 103, project_id: 1, title: "Integrate Gemini API into Requirement Analyzer", description: "Connect unified client to complete_json.", assignee_id: 3, priority: "Medium", status: "In Progress", due_date: "2026-07-22" },
  { id: 104, project_id: 1, title: "Implement JWT authorization middleware", description: "Secure API routes with custom require_role checks.", assignee_id: 3, priority: "High", status: "Testing", due_date: "2026-07-20" },
  { id: 105, project_id: 1, title: "Design Figma mockup of project workspace", description: "Create visual layout files.", assignee_id: 2, priority: "Low", status: "Done", due_date: "2026-07-17" }
]
const SEED_MEETINGS = [
  { id: 1, project_id: 1, title: "Sprint 1 Planning & AI Features Review", scheduled_at: "2026-07-21T10:00:00.000Z" }
]
const SEED_MEMBERS = [
  { id: 1, project_id: 1, user_id: 2, role_in_team: "leader", user: { name: "Rahul (Leader)", email: "leader@collabai.com" } },
  { id: 2, project_id: 1, user_id: 3, role_in_team: "member", user: { name: "Priya (Frontend)", email: "student@collabai.com" } },
  { id: 3, project_id: 1, user_id: 4, role_in_team: "member", user: { name: "Aman (Backend)", email: "student2@collabai.com" } }
]

const getStored = (key: string, fallback: any) => {
  try {
    const val = localStorage.getItem(key)
    if (val) return JSON.parse(val)
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  } catch { return fallback }
}

// ─── MOCK HANDLER ────────────────────────────────────────────────────────────
function handleMock(url: string, method: string, body: any): any {
  let projects = getStored("demo_projects", SEED_PROJECTS)
  let tasks    = getStored("demo_tasks", SEED_TASKS)
  let meetings = getStored("demo_meetings", SEED_MEETINGS)
  let members  = getStored("demo_members", SEED_MEMBERS)

  // AUTH
  if (url.includes("/api/auth/login")) {
    const email = body.username || body.email || "leader@collabai.com"
    const role  = email.includes("leader") ? "team_leader"
                : email.includes("faculty") ? "faculty"
                : email.includes("admin")   ? "admin"
                : "student"
    const name  = email.includes("leader")   ? "Rahul (Leader)"
                : email.includes("faculty")  ? "Dr. Verma"
                : email.includes("admin")    ? "Administrator"
                : email.includes("student2") ? "Aman (Backend)"
                : "Priya (Frontend)"
    const mockUser = { id: 2, name, email, role }
    localStorage.setItem("mock_user", JSON.stringify(mockUser))
    return { data: { access_token: "demo_token_" + email, token_type: "bearer" } }
  }

  if (url.includes("/api/auth/me")) {
    const stored = localStorage.getItem("mock_user")
    return { data: stored ? JSON.parse(stored) : { id: 2, name: "Rahul (Leader)", email: "leader@collabai.com", role: "team_leader" } }
  }

  if (url.includes("/api/auth/signup")) {
    const mockUser = { id: Date.now(), name: body.name, email: body.email, role: body.role || "student" }
    localStorage.setItem("mock_user", JSON.stringify(mockUser))
    return { data: mockUser }
  }

  if (url.includes("/api/auth/profile") && method === "PUT") {
    return { data: { message: "Profile updated (Demo)" } }
  }

  // PROJECTS
  if (url.match(/\/api\/projects\/?$/) && method === "GET")  return { data: projects }
  if (url.match(/\/api\/projects\/?$/) && method === "POST") {
    const p = { id: Date.now(), name: body.name, description: body.description || "", deadline: body.deadline || "2026-08-30", github_repo: body.github_repo || "", risk_level: "Low" }
    projects.push(p); localStorage.setItem("demo_projects", JSON.stringify(projects))
    return { data: p }
  }
  if (url.match(/\/api\/projects\/\d+$/) && method === "DELETE") {
    const pid = parseInt(url.split("/").pop() || "0")
    localStorage.setItem("demo_projects", JSON.stringify(projects.filter((p: any) => p.id !== pid)))
    return { data: { message: "Deleted" } }
  }

  // TEAM
  if (url.includes("/team/invite")) {
    const email = body.email || "new@demo.com"
    const m = { id: Date.now(), project_id: 1, user_id: Date.now()+1, role_in_team: "member", user: { name: email.split("@")[0], email } }
    members.push(m); localStorage.setItem("demo_members", JSON.stringify(members))
    return { data: { message: `Invited ${email}` } }
  }
  if (url.includes("/team")) return { data: members }

  // TASKS
  if (url.match(/\/projects\/\d+\/tasks/) && method === "GET")  return { data: tasks }
  if (url.match(/\/projects\/\d+\/tasks/) && method === "POST") {
    const t = { id: Date.now(), project_id: 1, title: body.title, description: body.description || "", assignee_id: body.assignee_id || 2, priority: body.priority || "Medium", status: body.status || "To Do", due_date: body.due_date || "2026-08-10" }
    tasks.push(t); localStorage.setItem("demo_tasks", JSON.stringify(tasks))
    return { data: t }
  }
  if (url.includes("/tasks/") && (method === "PATCH" || method === "PUT")) {
    const parts = url.split("/")
    const tid = parseInt(parts[parts.length - 1])
    const updated = tasks.map((t: any) => t.id === tid ? { ...t, ...body } : t)
    localStorage.setItem("demo_tasks", JSON.stringify(updated))
    return { data: updated.find((t: any) => t.id === tid) }
  }
  if (url.match(/\/api\/tasks\/\d+/) && method === "DELETE") {
    const tid = parseInt(url.split("/").pop() || "0")
    localStorage.setItem("demo_tasks", JSON.stringify(tasks.filter((t: any) => t.id !== tid)))
    return { data: { message: "Deleted" } }
  }

  // MEETINGS
  if (url.match(/\/api\/meetings\/project\/\d+/)) return { data: meetings }
  if (url.match(/\/api\/meetings\/?$/) && method === "POST") {
    const m = { id: Date.now(), project_id: body.project_id, title: body.title, scheduled_at: body.scheduled_at }
    meetings.push(m); localStorage.setItem("demo_meetings", JSON.stringify(meetings))
    return { data: m }
  }
  if (url.includes("/api/meetings/summarize")) {
    return { data: { summary: ["Rahul confirmed auth is complete.", "Priya completed dashboard UI.", "Aman fixed all backend tests."], decisions: ["Approve UI changes after review.", "Proceed with integration tests."], action_items: [{ task: "Fix styling inconsistencies", owner: "Priya", due: "Tomorrow" }, { task: "Complete JWT verification", owner: "Aman", due: "Friday" }] } }
  }

  // AI
  if (url.includes("/api/ai/risk")) {
    return { data: { probability_of_delay: 42, reasons: ["40% tasks still in To Do", "High-priority JWT task blocked in Testing"], suggestions: ["Move architecture task to In Progress", "Schedule a code review session"] } }
  }
  if (url.includes("/api/ai/sprint-plan")) {
    return { data: { sprints: [{ name: "Sprint 1 — Foundation", tasks: ["Implement JWT middleware", "Design UI layouts"] }, { name: "Sprint 2 — Core Integration", tasks: ["Create architecture diagram", "Integrate Gemini API"] }] } }
  }
  if (url.includes("/api/ai/chat")) {
    return { data: { reply: "Based on your Kanban board: Priya completed 'Figma mockup', Aman is working on 'Gemini API integration'. 2 tasks are still in To Do. The project deadline is in 30 days." } }
  }
  if (url.includes("/api/ai/analyze-requirements")) {
    return { data: { modules_found: ["Authentication", "Kanban Workspace", "Live Chat", "Meeting Transcription", "Analytics"], missing_modules: ["Email Notification System", "Role-based Access Logs"], ambiguous: ["'The system should be fast' — clarify latency target", "'Users can generate reports' — specify which roles"], summary: "5 modules identified. Gaps found in email notifications and access logs." } }
  }
  if (url.includes("/api/ai/review-code")) {
    return { data: { issues: [{ type: "warning", description: "Missing input validation.", suggestion: "Validate request body schema before processing." }, { type: "info", description: "Clean code structure detected.", suggestion: "Extract config values to constants." }] } }
  }
  if (url.includes("/api/ai/generate-docs")) {
    return { data: { documentation: "## CollabAI API\n\n**POST /api/auth/login** — Authenticates user and returns JWT token.\n\n**GET /api/projects/** — Returns all projects for the current user.\n\n**GET /api/projects/{id}/tasks** — Returns all Kanban tasks for a project." } }
  }

  // GITHUB
  if (url.includes("/api/github/commits")) {
    return { data: [{ sha: "a1b2c3", commit: { message: "refactor: replace passlib with native bcrypt", author: { name: "Aman", date: "2026-07-19T14:30:00Z" } } }, { sha: "b8f7e6", commit: { message: "feat: add Invite Team Member modal", author: { name: "Rahul", date: "2026-07-19T13:45:00Z" } } }, { sha: "c4d5e6", commit: { message: "feat: implement AI Sprint Planner with demo fallback", author: { name: "Priya", date: "2026-07-18T09:00:00Z" } } }] }
  }
  if (url.includes("/api/github/pulls")) {
    return { data: [{ title: "feat: Integrate Gemini API into Requirement Analyzer", number: 4, user: { login: "aman_dev" }, state: "open" }] }
  }

  // PASSWORD RESET
  if (url.includes("/api/auth/reset-password") && method === "POST") {
    return { data: { message: "Password reset successful" } }
  }

  // COMMENTS
  if (url.includes("/comments") && method === "GET") {
    const tid = parseInt(url.split("/tasks/")[1].split("/comments")[0])
    let mockComments = getStored("demo_comments", [
      { id: 1, task_id: 101, user_id: 2, content: "Drafting the initial diagram layout now.", created_at: new Date(Date.now() - 3600000).toISOString(), user_name: "Rahul (Leader)" }
    ])
    return { data: mockComments.filter((c: any) => c.task_id === tid) }
  }
  if (url.includes("/comments") && method === "POST") {
    const tid = parseInt(url.split("/tasks/")[1].split("/comments")[0])
    let mockComments = getStored("demo_comments", [])
    const stored = localStorage.getItem("mock_user")
    const author = stored ? JSON.parse(stored) : { id: 2, name: "Rahul (Leader)", email: "leader@collabai.com" }
    const c = { id: Date.now(), task_id: tid, user_id: author.id, content: body.content, created_at: new Date().toISOString(), user_name: author.name }
    mockComments.push(c)
    localStorage.setItem("demo_comments", JSON.stringify(mockComments))
    return { data: c }
  }

  // ANNOUNCEMENTS
  if (url.includes("/announcements") && method === "GET") {
    let mockAnnouncements = getStored("demo_announcements", [
      { id: 1, project_id: 1, user_id: 2, title: "Mid-Term Review Schedule", content: "Our project guide confirmed the mid-term evaluations will be held this Thursday. Please ensure all Kanban tasks in 'Testing' are completed.", created_at: new Date(Date.now() - 86400000).toISOString(), author_name: "Rahul (Leader)" }
    ])
    return { data: mockAnnouncements }
  }
  if (url.includes("/announcements") && method === "POST") {
    let mockAnnouncements = getStored("demo_announcements", [])
    const stored = localStorage.getItem("mock_user")
    const author = stored ? JSON.parse(stored) : { id: 2, name: "Rahul (Leader)", email: "leader@collabai.com" }
    const a = { id: Date.now(), project_id: 1, user_id: author.id, title: body.title, content: body.content, created_at: new Date().toISOString(), author_name: author.name }
    mockAnnouncements.unshift(a)
    localStorage.setItem("demo_announcements", JSON.stringify(mockAnnouncements))
    return { data: a }
  }

  // NOTIFICATIONS
  if (url.includes("/api/notifications/read/") && method === "POST") {
    const nid = parseInt(url.split("/read/").pop() || "0")
    let mockNotifs = getStored("demo_notifications", [
      { id: 1, text: "Aman moved 'JWT authorization middleware' to Testing", created_at: new Date(Date.now() - 4 * 3600000).toISOString(), unread: true },
      { id: 2, text: "New Meeting 'Sprint 1 Planning & AI Features Review' was scheduled", created_at: new Date(Date.now() - 48 * 3600000).toISOString(), unread: true },
    ])
    const updated = mockNotifs.map((n: any) => n.id === nid ? { ...n, unread: false } : n)
    localStorage.setItem("demo_notifications", JSON.stringify(updated))
    return { data: { message: "Read" } }
  }
  if (url.includes("/api/notifications") && method === "GET") {
    let mockNotifs = getStored("demo_notifications", [
      { id: 1, text: "Aman moved 'JWT authorization middleware' to Testing", created_at: new Date(Date.now() - 4 * 3600000).toISOString(), unread: true },
      { id: 2, text: "New Meeting 'Sprint 1 Planning & AI Features Review' was scheduled", created_at: new Date(Date.now() - 48 * 3600000).toISOString(), unread: true },
      { id: 3, text: "Priya assigned task 'Set up project structure' to Aman", created_at: new Date(Date.now() - 72 * 3600000).toISOString(), unread: false },
      { id: 4, text: "Rahul created project 'AI-Powered Project Lifecycle Platform'", created_at: new Date(Date.now() - 96 * 3600000).toISOString(), unread: false },
    ])
    return { data: mockNotifs }
  }

  // ADMIN
  if (url.includes("/api/admin/stats")) {
    return { data: { users_count: 5, projects_count: projects.length, tasks_count: tasks.length, roles_distribution: { admin: 1, team_leader: 1, student: 2, faculty: 1 }, status_distribution: { "To Do": 2, "In Progress": 1, "Testing": 1, "Done": 1 }, recent_users: [{ id: 1, name: "Rahul (Leader)", email: "leader@collabai.com", role: "team_leader" }, { id: 2, name: "Priya", email: "student@collabai.com", role: "student" }], recent_projects: projects } }
  }

  // Default fallback
  return { data: [] }
}

// ─── DETECT BACKEND AVAILABILITY ON STARTUP ──────────────────────────────────
let useMock = false

// Probe the backend once; if unreachable, flip useMock = true for the session
const probe = axios.create({ baseURL: API_BASE_URL, timeout: 3000 })
probe.get('/api/health').catch(() => {
  console.warn('⚠️  Backend unreachable — switching to standalone demo mode')
  useMock = true
})

// ─── INTERCEPTORS ────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('collabai_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  // If backend was already found unreachable, short-circuit immediately
  if (useMock) {
    const ctrl = new AbortController()
    ctrl.abort()
    config.signal = ctrl.signal
    config.headers['X-Mock'] = 'true'
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const config   = err.config || {}
    const url      = config.url || ''
    const method   = (config.method || 'GET').toUpperCase()
    const isMixed  = err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response
    const isMockReq = config.headers?.['X-Mock'] === 'true'

    if (isMixed || isMockReq || (err.response?.status ?? 0) >= 500) {
      useMock = true

      // Parse body
      let body: any = {}
      if (config.data) {
        try { body = JSON.parse(config.data) }
        catch { new URLSearchParams(config.data).forEach((v, k) => { body[k] = v }) }
      }

      const result = handleMock(url, method, body)

      // Store token on login
      if (url.includes('/api/auth/login')) {
        localStorage.setItem('collabai_token', result.data.access_token)
      }

      return Promise.resolve({ ...result, status: 200, statusText: 'OK', headers: {}, config })
    }

    if (err.response?.status === 401) localStorage.removeItem('collabai_token')
    return Promise.reject(err)
  }
)
