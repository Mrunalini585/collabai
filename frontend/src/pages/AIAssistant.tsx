import React, { useEffect, useState, useRef } from 'react'
import { Bot, Send, Sparkles, Code2, FileText, ChevronDown } from 'lucide-react'
import { api } from '../api/client'
import { Card, Spinner, EmptyState, Button } from '../components/ui'
import type { Project } from '../types'

const SUGGESTED: Record<string, string[]> = {
  assistant: [
    'What tasks are pending?',
    'Who is delaying the sprint?',
    'What is the project completion percentage?',
    'Generate API endpoints for Login',
    'Generate test cases for Authentication',
    'What are the high priority tasks?',
  ],
  code: [
    'Review my Python code for security issues',
    'Check my JavaScript for code smells',
    'Analyze naming conventions in my code',
  ],
  docs: [
    'Generate README for this project',
    'Generate API documentation',
    'Generate user manual',
    'Generate test cases document',
  ],
}

type TabType = 'assistant' | 'code' | 'docs'

export default function AIAssistant() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hi! I'm your project's AI assistant. I'm grounded in your live task board.\n\nAsk me about tasks, sprint status, risk — or use the tabs above to review code or generate documentation." },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState<TabType>('assistant')
  const [codeInput, setCodeInput] = useState('')
  const [docType, setDocType]     = useState('readme')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(({ data }) => {
      setProjects(data)
      if (data[0]) setProjectId(data[0].id)
    })
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const q = text ?? input
    if (!q.trim() || !projectId) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/ai/chat', { project_id: projectId, message: q })
      setMessages((m) => [...m, { role: 'ai', text: data.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: '⚠️ Could not reach the AI service. Make sure your API key is configured in backend/.env' }])
    } finally {
      setLoading(false)
    }
  }

  const reviewCode = async () => {
    if (!codeInput.trim()) return
    setLoading(true)
    setMessages((m) => [...m, { role: 'user', text: `Review this code:\n\`\`\`\n${codeInput.slice(0, 200)}…\n\`\`\`` }])
    setTab('assistant')
    try {
      const { data } = await api.post('/api/ai/review-code', { code: codeInput, filename: 'code.py' })
      const issues = data.issues?.map((i: any) => `**${i.type}**: ${i.description}\n→ ${i.suggestion}`).join('\n\n')
      setMessages((m) => [...m, { role: 'ai', text: `Code Review Results:\n\n${issues || 'No issues found — great code!'}` }])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: '⚠️ Code review failed. Check your API key.' }])
    } finally {
      setLoading(false)
    }
  }

  const generateDoc = async () => {
    if (!projectId) return
    setLoading(true)
    setMessages((m) => [...m, { role: 'user', text: `Generate ${docType} for this project` }])
    setTab('assistant')
    try {
      const { data } = await api.post('/api/ai/generate-docs', { project_id: projectId, doc_type: docType })
      setMessages((m) => [...m, { role: 'ai', text: data.content }])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: '⚠️ Documentation generation failed. Check your API key.' }])
    } finally {
      setLoading(false)
    }
  }

  if (projects.length === 0 && !loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <EmptyState
          icon={<Bot size={28} />}
          title="No projects found"
          description="Create a project first from the Projects page, then come back to chat with your AI assistant."
        />
      </div>
    )
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-4rem)]">
      {/* Chat panel */}
      <Card className="lg:col-span-3 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            AI Project Assistant
          </div>
          {projects.length > 1 && (
            <select
              value={projectId ?? ''}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-slate-600"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100">
          {([
            { id: 'assistant', label: 'Chat', icon: Bot },
            { id: 'code',      label: 'Code Review', icon: Code2 },
            { id: 'docs',      label: 'Generate Docs', icon: FileText },
          ] as { id: TabType; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                tab === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Messages (always visible) */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                m.role === 'user' ? 'msg-bubble-user text-white' : 'msg-bubble-ai text-slate-700'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-indigo-500 text-sm">
              <Spinner size={14} className="text-indigo-500" />
              <span className="animate-pulse">AI is thinking…</span>
            </div>
          )}
        </div>

        {/* Input area based on tab */}
        {tab === 'assistant' && (
          <div className="p-4 border-t border-slate-100 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask anything about your project…"
              className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none input-ring"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="btn-primary text-white rounded-full p-2.5 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        )}

        {tab === 'code' && (
          <div className="p-4 border-t border-slate-100 space-y-2">
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste your code here for AI review…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none input-ring resize-none"
            />
            <Button onClick={reviewCode} loading={loading} disabled={!codeInput.trim()} className="w-full">
              <Code2 size={14} /> Review Code
            </Button>
          </div>
        )}

        {tab === 'docs' && (
          <div className="p-4 border-t border-slate-100 space-y-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none input-ring bg-white"
            >
              <option value="readme">README</option>
              <option value="api_docs">API Documentation</option>
              <option value="user_manual">User Manual</option>
              <option value="technical_report">Technical Report</option>
              <option value="test_cases">Test Cases</option>
            </select>
            <Button onClick={generateDoc} loading={loading} disabled={!projectId} className="w-full">
              <Sparkles size={14} /> Generate Document
            </Button>
          </div>
        )}
      </Card>

      {/* Sidebar panel */}
      <Card className="p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="text-sm font-semibold text-slate-700">Suggested</div>
        <div className="space-y-1.5">
          {SUGGESTED[tab].map((s) => (
            <button
              key={s}
              onClick={() => {
                setTab('assistant')
                send(s)
              }}
              className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl px-3 py-2.5 transition border border-slate-100 hover:border-indigo-200"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">AI Capabilities</div>
          {[
            { icon: '🧠', label: 'Project-aware chat', desc: 'Knows your live tasks' },
            { icon: '⚡', label: 'Code review', desc: 'Detects smells & bugs' },
            { icon: '📄', label: 'Doc generation', desc: 'README, API docs & more' },
            { icon: '⚠️', label: 'Risk prediction', desc: 'On your Dashboard' },
            { icon: '🏃', label: 'Sprint planning', desc: 'On your Dashboard' },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
              <span className="text-base">{c.icon}</span>
              <div>
                <div className="text-xs font-semibold text-slate-700">{c.label}</div>
                <div className="text-[10px] text-slate-400">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
