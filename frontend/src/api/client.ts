import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 4000 })

// --- CLIENT-SIDE FALLBACK DATABASE (Ensures website works instantly for everyone) ---
// Initialize localStorage with realistic seed data if not present
const getStored = (key: string, fallback: any) => {
  const val = localStorage.getItem(key)
  if (val) return JSON.parse(val)
  localStorage.setItem(key, JSON.stringify(fallback))
  return fallback
}

const SEED_PROJECTS = [
  {
    id: 1,
    name: "AI-Powered Project Lifecycle Platform",
    description: "A centralized web application integrating Kanban boards, AI sprint planning, real-time team chat, and GitHub code logs.",
    deadline: "2026-08-19",
    github_repo: "Krushitha30/collabai-project-final",
    risk_level: "Medium"
  }
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

const SEED_TEAM_MEMBERS = [
  { id: 1, project_id: 1, user_id: 2, role_in_team: "leader", user: { name: "Rahul (Leader)", email: "leader@collabai.com" } },
  { id: 2, project_id: 1, user_id: 3, role_in_team: "member", user: { name: "Priya (Developer)", email: "student@collabai.com" } }
]

// Auth interceptor: Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('collabai_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global flag to track if we should run in standalone mock mode
let standaloneMode = false

// Intercept all requests. If standaloneMode is active or backend fails, resolve locally!
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // If backend is sleeping, unreachable, or returns a bad status, trigger Standalone Fallback Mode
    const isNetworkError = !err.response || err.response.status >= 500 || err.code === 'ECONNABORTED'
    
    if (isNetworkError) {
      if (!standaloneMode) {
        console.warn("⚠️ Backend is offline or sleeping. Switching to Client-Side stand-alone demo mode...")
        standaloneMode = true
      }
      
      const config = err.config
      const url = config.url || ""
      const method = (config.method || "").toUpperCase()
      
      // Parse body — handle both JSON strings and URLSearchParams (form-encoded login)
      let body: any = {}
      if (config.data) {
        try {
          body = JSON.parse(config.data)
        } catch {
          // Form-encoded: username=foo&password=bar
          const params = new URLSearchParams(config.data)
          params.forEach((v, k) => { body[k] = v })
        }
      }

      // Retrieve state
      let projects = getStored("demo_projects", SEED_PROJECTS)
      let tasks = getStored("demo_tasks", SEED_TASKS)
      let meetings = getStored("demo_meetings", SEED_MEETINGS)
      let members = getStored("demo_members", SEED_TEAM_MEMBERS)
      let chats = getStored("demo_chats", [])

      // Simulate endpoints
      try {
        // --- 1. AUTHENTICATION ---
        if (url.includes("/api/auth/login")) {
          // body.username comes from URLSearchParams form; body.email from JSON
          const email = body.username || body.email || "leader@collabai.com"
          const role = email.includes("leader") ? "team_leader"
            : email.includes("faculty") ? "faculty"
            : email.includes("admin") ? "admin"
            : "student"
          const name = email.includes("leader") ? "Rahul (Leader)"
            : email.includes("faculty") ? "Dr. Verma"
            : email.includes("admin") ? "Administrator"
            : email.includes("student2") ? "Aman (Developer)"
            : "Priya (Developer)"

          // Store mock user so /api/auth/me can return the same person
          localStorage.setItem("mock_user", JSON.stringify({ id: 2, name, email, role }))

          return {
            data: {
              access_token: "mock_token_for_" + email,
              token_type: "bearer",
              user: { id: 2, name, email, role }
            }
          }
        }
        
        if (url.includes("/api/auth/me")) {
          const stored = localStorage.getItem("mock_user")
          const mockUser = stored
            ? JSON.parse(stored)
            : { id: 2, name: "Rahul (Leader)", email: "leader@collabai.com", role: "team_leader" }
          return { data: mockUser }
        }
        
        if (url.includes("/api/auth/profile") && method === "PUT") {
          return { data: { message: "Profile updated successfully (Demo)" } }
        }

        // --- 2. PROJECTS ---
        if (url.endsWith("/api/projects/") || url.endsWith("/api/projects")) {
          if (method === "GET") return { data: projects }
          if (method === "POST") {
            const newProj = {
              id: Date.now(),
              name: body.name,
              description: body.description || "",
              deadline: body.deadline || "2026-08-30",
              github_repo: body.github_repo || "",
              risk_level: "Low"
            }
            projects.push(newProj)
            localStorage.setItem("demo_projects", JSON.stringify(projects))
            return { data: newProj }
          }
        }
        
        // Single project details
        const projectMatch = url.match(/\/api\/projects\/(\d+)/)
        if (projectMatch) {
          const pid = parseInt(projectMatch[1])
          if (method === "DELETE") {
            projects = projects.filter((p: any) => p.id !== pid)
            localStorage.setItem("demo_projects", JSON.stringify(projects))
            return { data: { message: "Project deleted" } }
          }
        }

        // --- 3. TEAM MEMBERS & INVITATION ---
        if (url.includes("/team/invite")) {
          const email = body.email || "newmember@collabai.com"
          const name = email.split("@")[0]
          const newMem = {
            id: Date.now(),
            project_id: 1,
            user_id: Date.now() + 1,
            role_in_team: "member",
            user: { name: name.charAt(0).toUpperCase() + name.slice(1), email }
          }
          members.push(newMem)
          localStorage.setItem("demo_members", JSON.stringify(members))
          return { data: { message: `Invited ${email} successfully` } }
        }
        
        if (url.includes("/team")) {
          return { data: members }
        }

        // --- 4. KANBAN TASKS ---
        const tasksMatch = url.match(/\/api\/projects\/(\d+)\/tasks/)
        if (tasksMatch) {
          if (method === "GET") return { data: tasks }
          if (method === "POST") {
            const newTask = {
              id: Date.now(),
              project_id: 1,
              title: body.title,
              description: body.description || "",
              assignee_id: body.assignee_id || 2,
              priority: body.priority || "Medium",
              status: body.status || "To Do",
              due_date: body.due_date || "2026-08-10"
            }
            tasks.push(newTask)
            localStorage.setItem("demo_tasks", JSON.stringify(tasks))
            return { data: newTask }
          }
        }

        const taskSingleMatch = url.match(/\/api\/tasks\/(\d+)/)
        if (taskSingleMatch) {
          const tid = parseInt(taskSingleMatch[1])
          if (method === "PUT") {
            tasks = tasks.map((t: any) => t.id === tid ? { ...t, ...body } : t)
            localStorage.setItem("demo_tasks", JSON.stringify(tasks))
            return { data: tasks.find((t: any) => t.id === tid) }
          }
          if (method === "DELETE") {
            tasks = tasks.filter((t: any) => t.id !== tid)
            localStorage.setItem("demo_tasks", JSON.stringify(tasks))
            return { data: { message: "Task deleted" } }
          }
        }

        // --- 5. MEETINGS ---
        const meetingsMatch = url.match(/\/api\/meetings\/project\/(\d+)/)
        if (meetingsMatch) {
          return { data: meetings }
        }
        
        if (url.endsWith("/api/meetings") || url.endsWith("/api/meetings/")) {
          if (method === "POST") {
            const newMeet = {
              id: Date.now(),
              project_id: body.project_id,
              title: body.title,
              scheduled_at: body.scheduled_at
            }
            meetings.push(newMeet)
            localStorage.setItem("demo_meetings", JSON.stringify(meetings))
            return { data: newMeet }
          }
        }
        
        if (url.includes("/api/meetings/summarize")) {
          return {
            data: {
              summary: [
                "Rahul confirmed authentication is fully complete.",
                "Priya requested feedback on dashboard UI styling.",
                "Aman reported testing is underway, fixing minor bugs."
              ],
              decisions: [
                "Approve dashboard UI changes after styling review.",
                "Proceed with final integration tests next sprint."
              ],
              action_items: [
                { task: "Fix remaining styling inconsistencies", owner: "Priya", due: "Tomorrow" },
                { task: "Complete unit tests & JWT verification", owner: "Aman", due: "Friday" }
              ]
            }
          }
        }

        // --- 6. CHAT HISTORY ---
        if (url.includes("/chat")) {
          return { data: chats }
        }

        // --- 7. AI ASSISTANT FEATURES ---
        if (url.includes("/api/ai/risk")) {
          return {
            data: {
              probability_of_delay: 42,
              reasons: [
                "40% of tasks are still in 'To Do' stage",
                "High-priority task 'JWT middleware' is blocked in Testing"
              ],
              suggestions: [
                "Move 'Create system architecture diagram' to In Progress immediately",
                "Schedule a code review session to unblock the Testing stage"
              ]
            }
          }
        }
        
        if (url.includes("/api/ai/sprint-plan")) {
          return {
            data: {
              sprints: [
                { name: "Sprint 1 — Foundation", tasks: ["Implement JWT authorization middleware", "Design UI layouts"] },
                { name: "Sprint 2 — Core Integration", tasks: ["Create architecture diagram", "Setup database tables"] }
              ]
            }
          }
        }
        
        if (url.includes("/api/ai/chat")) {
          return {
            data: {
              reply: "Standalone Mode: Grounded in your Kanban tasks, Priya has 1 task completed ('Figma mockup'), and Aman is currently working on 'Integrate Gemini API'."
            }
          }
        }
        
        if (url.includes("/api/ai/analyze-requirements")) {
          return {
            data: {
              modules_found: ["User Authentication", "Kanban Workspace", "Live Chat", "Meeting Transcription", "Reports"],
              missing_modules: ["Email Notification System", "Offline Standalone Fallback Mode"],
              ambiguous: ["'The system should be fast' - clarify max response latency", "'Users can generate reports' - specify role permissions"],
              summary: "Requirements contain 5 standard modules. Gaps found in email alerts and offline standalone modes."
            }
          }
        }
        
        if (url.includes("/api/ai/review-code")) {
          return {
            data: {
              issues: [
                { type: "warning", description: "Missing validation payload check.", suggestion: "Validate body schema before mapping." },
                { type: "info", description: "Clean code structure detected.", suggestion: "Extract configuration to constants." }
              ]
            }
          }
        }

        // --- 8. GITHUB LOGS ---
        if (url.includes("/api/github/commits")) {
          return {
            data: [
              { sha: "a1b2c3d4", commit: { message: "refactor: replace passlib with native bcrypt library", author: { name: "Aman", date: "2026-07-19T14:30:00Z" } } },
              { sha: "b8f7e6d5", commit: { message: "feat: add Invite Team Member modal to Projects", author: { name: "Rahul", date: "2026-07-19T13:45:00Z" } } }
            ]
          }
        }
        
        if (url.includes("/api/github/pulls")) {
          return {
            data: [
              { title: "feat: Integrate Gemini API into Requirement Analyzer", number: 4, user: { login: "aman_backend" }, state: "open" }
            ]
          }
        }

        // --- 9. ADMIN SUMMARY ---
        if (url.includes("/api/admin/stats")) {
          return {
            data: {
              users_count: 5,
              projects_count: 1,
              tasks_count: 5,
              roles_distribution: { admin: 1, team_leader: 1, student: 2, faculty: 1 },
              status_distribution: { "To Do": 2, "In Progress": 1, "Testing": 1, "Done": 1 },
              recent_users: [
                { id: 1, name: "Rahul (Leader)", email: "leader@collabai.com", role: "team_leader" },
                { id: 2, name: "Priya", email: "student@collabai.com", role: "student" }
              ],
              recent_projects: projects
            }
          }
        }

      } catch (mockError) {
        console.error("Standalone simulation failed", mockError)
      }
    }

    // If it's a 401 Unauthorized, drop the token
    if (err.response?.status === 401) {
      localStorage.removeItem('collabai_token')
    }
    return Promise.reject(err)
  }
)
