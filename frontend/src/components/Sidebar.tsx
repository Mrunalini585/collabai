import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Bot, FileText, Video, Github,
  BarChart3, MessageSquare, ShieldCheck, Settings, LogOut, Sparkles,
  Zap, Users, ChevronRight, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SECTIONS = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
      { to: '/projects',  label: 'Projects',   icon: FolderKanban, roles: ['team_leader', 'faculty', 'admin'] },
    ],
  },
  {
    label: 'AI Suite',
    items: [
      { to: '/ai-assistant',  label: 'AI Assistant',        icon: Bot },
      { to: '/requirements',  label: 'Req. Analyzer',       icon: FileText, roles: ['team_leader', 'faculty', 'admin'] },
      { to: '/meetings',      label: 'Meetings',            icon: Video },
    ],
  },
  {
    label: 'Team',
    items: [
      { to: '/github',   label: 'GitHub',      icon: Github,        roles: ['team_leader', 'faculty', 'admin'] },
      { to: '/reports',  label: 'Reports',     icon: BarChart3,     roles: ['team_leader', 'faculty', 'admin'] },
      { to: '/chat',     label: 'Team Chat',   icon: MessageSquare },
    ],
  },
  {
    label: null,
    items: [
      { to: '/admin',    label: 'Admin',       icon: ShieldCheck,   roles: ['admin'] },
      { to: '/settings', label: 'Settings',    icon: Settings },
    ],
  },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const visibleSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(user?.role || '')),
  })).filter((section) => section.items.length > 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleColors: Record<string, string> = {
    admin:       'text-rose-400',
    faculty:     'text-amber-400',
    team_leader: 'text-indigo-400',
    student:     'text-emerald-400',
  }
  const roleLabel: Record<string, string> = {
    admin:       'Administrator',
    faculty:     'Faculty Guide',
    team_leader: 'Team Leader',
    student:     'Student',
  }

  return (
    <div className="w-64 shrink-0 flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, #0f0f23 0%, #12122e 50%, #0f0f23 100%)' }}>

      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow glow-indigo shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">CollabAI</div>
            <div className="text-indigo-400 text-[10px] leading-tight">Project Platform</div>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {visibleSections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-2">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'active bg-indigo-500/20 text-indigo-300 font-semibold'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={16} className={isActive ? 'text-indigo-400' : ''} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={12} className="text-indigo-500" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Card */}
      <div className="p-3 border-t border-white/8">
        <div className="bg-white/5 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
              <div className={`text-[10px] font-medium ${roleColors[user?.role || 'student']}`}>
                {roleLabel[user?.role || 'student']}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )
}
