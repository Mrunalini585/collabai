import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, LogOut, Settings, User, Sparkles, Menu } from 'lucide-react'
import { Avatar } from './ui'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

function formatNotificationTime(createdAtStr?: string) {
  if (!createdAtStr) return 'just now'
  const date = new Date(createdAtStr)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function TopBar({ title, subtitle, onMenuClick }: { title: string; subtitle?: string | null; onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications')
      setNotifications(data)
    } catch {
      setNotifications([
        { id: 1, text: "Aman moved 'JWT authorization middleware' to Testing", created_at: new Date(Date.now() - 4 * 3600000).toISOString(), unread: true },
        { id: 2, text: "New Meeting 'Sprint 1 Planning & AI Features Review' was scheduled", created_at: new Date(Date.now() - 48 * 3600000).toISOString(), unread: true },
        { id: 3, text: "Priya assigned task 'Set up project structure' to Aman", created_at: new Date(Date.now() - 72 * 3600000).toISOString(), unread: false },
        { id: 4, text: "Rahul created project 'AI-Powered Project Lifecycle Platform'", created_at: new Date(Date.now() - 96 * 3600000).toISOString(), unread: false },
      ])
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      const unreads = notifications.filter(n => n.unread)
      for (const n of unreads) {
        await api.post(`/api/notifications/read/${n.id}`)
      }
      fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const markSingleRead = async (id: number) => {
    try {
      await api.post(`/api/notifications/read/${id}`)
      fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const dropRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleLabel: Record<string, string> = {
    admin:       'Administrator',
    faculty:     'Faculty Guide',
    team_leader: 'Team Leader',
    student:     'Student',
  }
  const roleBadge: Record<string, string> = {
    admin:       'bg-rose-100 text-rose-700',
    faculty:     'bg-amber-100 text-amber-700',
    team_leader: 'bg-indigo-100 text-indigo-700',
    student:     'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="h-16 shrink-0 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm">
      {/* Title */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="p-1.5 -ml-2 rounded-xl hover:bg-slate-100 lg:hidden text-slate-500 hover:text-slate-700 transition"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 leading-tight">{subtitle}</p>}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition rounded-xl px-3 py-2 w-56">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            placeholder="Search…"
            className="bg-transparent text-sm outline-none w-full text-slate-600 placeholder-slate-400"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-slate-500 hover:text-slate-700"
          >
            <Bell size={17} />
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Notifications</span>
                {notifications.some(n => n.unread) && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => n.unread && markSingleRead(n.id)}
                      className={`p-3.5 text-xs transition-colors hover:bg-slate-50 ${n.unread ? 'bg-indigo-50/20 cursor-pointer' : 'text-slate-500'}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className={`font-medium ${n.unread ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>{n.text}</span>
                        {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{formatNotificationTime(n.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Quick Access */}
        <button
          onClick={() => navigate('/ai-assistant')}
          className="hidden sm:flex items-center gap-1.5 btn-primary text-white rounded-xl px-3 py-2 text-xs font-semibold"
        >
          <Sparkles size={13} /> AI Assistant
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2.5 hover:bg-slate-100 rounded-xl px-2 py-1.5 transition"
          >
            <Avatar name={user?.name || '?'} size={8} />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
              <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold inline-block ${roleBadge[user?.role || 'student']}`}>
                {roleLabel[user?.role || 'student']}
              </div>
            </div>
            <ChevronDown size={13} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowDropdown(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                <Settings size={15} /> Settings
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
