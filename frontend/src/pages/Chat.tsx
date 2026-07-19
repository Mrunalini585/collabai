import React, { useEffect, useState, useRef } from 'react'
import { MessageSquare, Send, Users } from 'lucide-react'
import { Card, Avatar, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../api/socket'
import { api } from '../api/client'
import type { Project } from '../types'

interface ChatMessage {
  project_id: number
  user: string
  text: string
  ts?: number
}

function formatTime(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { user } = useAuth()
  const [projects, setProjects]   = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input, setInput]         = useState('')
  const [connected, setConnected] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef(getSocket())

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(({ data }) => {
      setProjects(data)
      if (data[0]) setProjectId(data[0].id)
      setLoadingProjects(false)
    })
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    // Update connection state from current socket status
    setConnected(socket.connected)
    const onConnect    = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  useEffect(() => {
    if (!projectId) return
    const socket = socketRef.current
    socket.emit('join_project', { project_id: projectId })

    api.get<ChatMessage[]>(`/api/projects/${projectId}/chat`)
      .then(({ data }) => setMessages(data))
      .catch(() => setMessages([]))

    const onMessage = (msg: ChatMessage) =>
      setMessages((m) => [...m, msg])
    socket.on('chat_message', onMessage)

    return () => {
      socket.emit('leave_project', { project_id: projectId })
      socket.off('chat_message', onMessage)
    }
  }, [projectId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim() || !projectId) return
    const msg: ChatMessage = { project_id: projectId, user: user?.name || 'You', text: input, ts: Date.now() }
    setMessages((m) => [...m, msg])
    socketRef.current.emit('chat_message', msg)
    setInput('')
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Project selector */}
      {projects.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">Project:</span>
          <select
            value={projectId ?? ''}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none input-ring bg-white"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-2 font-semibold text-slate-700">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <MessageSquare size={13} className="text-white" />
            </div>
            {projects.find((p) => p.id === projectId)?.name || 'Project'} · Chat
          </span>
          <span className={`text-xs flex items-center gap-1.5 font-semibold ${connected ? 'text-emerald-500' : 'text-slate-300'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {messages.length === 0 && !loadingProjects && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                <MessageSquare size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-600">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1">Say hi to your team — messages appear in real time</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMe = m.user === user?.name
            return (
              <div key={i} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar name={m.user} size={8} />
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && <span className="text-xs font-semibold text-slate-500 px-1">{m.user}</span>}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMe ? 'msg-bubble-user text-white' : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                    {m.text}
                  </div>
                  {m.ts && <span className="text-[10px] text-slate-400 px-1">{formatTime(m.ts)}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none input-ring"
          />
          <button
            onClick={send}
            disabled={!input.trim() || !projectId}
            className="btn-primary text-white rounded-full p-2.5 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </Card>

      <p className="text-xs text-slate-400 text-center">
        Real-time via Socket.IO — open in two tabs to see messages sync instantly
      </p>
    </div>
  )
}
