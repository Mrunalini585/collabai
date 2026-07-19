import React from 'react'
import { useAuth } from '../context/AuthContext'
import TeamLeaderDashboard from './dashboards/TeamLeaderDashboard'
import StudentDashboard from './dashboards/StudentDashboard'
import FacultyDashboard from './dashboards/FacultyDashboard'
import Admin from './Admin'

/**
 * Role-based dashboard router. Each role sees a purpose-built view instead of
 * one generic dashboard with hidden/disabled widgets:
 *   student      -> assigned tasks only
 *   team_leader  -> full project health, kanban summary, AI risk
 *   faculty      -> cross-project review + evaluation view
 *   admin        -> system-wide stats (reuses the Admin page)
 */
export default function Dashboard() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'student':
      return <StudentDashboard />
    case 'faculty':
      return <FacultyDashboard />
    case 'admin':
      return <Admin />
    case 'team_leader':
    default:
      return <TeamLeaderDashboard />
  }
}
