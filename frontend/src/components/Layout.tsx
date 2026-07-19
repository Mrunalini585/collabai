import React, { useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen w-full flex bg-slate-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-0`}
      >
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopBar 
          title={meta.title} 
          subtitle={meta.sub} 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
