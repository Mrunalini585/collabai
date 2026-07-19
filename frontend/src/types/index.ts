export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'team_leader' | 'faculty' | 'admin'
}

export interface Project {
  id: number
  name: string
  description: string
  github_repo: string
  deadline: string | null
  risk_level: 'Low' | 'Medium' | 'High'
  created_at: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string
  assignee_id: number | null
  priority: 'Low' | 'Medium' | 'High'
  status: 'To Do' | 'In Progress' | 'Testing' | 'Done'
  sprint: string | null
  due_date: string | null
  created_at: string
}

export interface RequirementAnalysis {
  modules_found: string[]
  missing_modules: string[]
  ambiguous: string[]
  summary: string
}

export interface MeetingSummary {
  summary: string[]
  decisions: string[]
  action_items: { task: string; owner: string; due: string }[]
}
