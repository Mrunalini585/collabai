import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const META: Record<string, { title: string; sub?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/projects': { title: 'Kanban Board' },
  '/ai-assistant': { title: 'AI Assistant', sub: 'Grounded in your live project' },
  '/requirements': { title: 'AI Requirement Analyzer' },
  '/meetings': { title: 'Meetings' },
  '/github': { title: 'GitHub Integration' },
  '/reports': { title: 'Project Analytics' },
  '/chat': { title: 'Team Chat' },
  '/admin': { title: 'Admin Dashboard' },
  '/settings': { title: 'Settings' },
}

export default function Layout() {
  const { pathname } = useLocation()
  const meta = META[pathname] || { title: 'CollabAI' }
  return (
    <div className="h-screen w-full flex bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={meta.title} subtitle={meta.sub} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
