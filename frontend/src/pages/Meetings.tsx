import React, { useEffect, useState } from 'react'
import { Sparkles, Loader2, Mic, Calendar, Video, Plus, Clock } from 'lucide-react'
import { api } from '../api/client'
import { Card, Button, Spinner, Modal, Input, EmptyState, Badge } from '../components/ui'
import type { MeetingSummary, Project } from '../types'

export default function Meetings() {
  const [projects, setProjects]   = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [notes, setNotes]         = useState('')
  const [summary, setSummary]     = useState<MeetingSummary | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [transcribing, setTranscribing] = useState(false)

  // Schedule meeting modal
  const [meetings, setMeetings]         = useState<any[]>([])
  const [showSchedule, setShowSchedule] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDate, setMeetingDate]   = useState('')
  const [schedulingMeeting, setSchedulingMeeting] = useState(false)
  const [scheduledMsg, setScheduledMsg] = useState<string | null>(null)

  useEffect(() => {
    api.get<Project[]>('/api/projects/').then(({ data }) => {
      setProjects(data)
      if (data[0]) setProjectId(data[0].id)
    })
  }, [])

  const loadMeetings = () => {
    if (!projectId) return
    api.get(`/api/meetings/project/${projectId}`)
      .then(({ data }) => setMeetings(data as any[]))
      .catch(() => {})
  }

  useEffect(() => {
    loadMeetings()
  }, [projectId])

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTranscribing(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/api/meetings/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setNotes((prev) => (prev ? prev + '\n\n' + data.transcript : data.transcript))
    } catch {
      setError('Could not transcribe. Supported: mp3, wav, m4a, webm. Requires OpenAI API key.')
    } finally {
      setTranscribing(false)
      e.target.value = ''
    }
  }

  const summarize = async () => {
    if (!notes.trim() || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<MeetingSummary>('/api/meetings/summarize', {
        project_id: projectId,
        transcript: notes,
      })
      setSummary(data)
    } catch {
      setError('Could not summarize. Make sure your AI API key is configured in backend/.env')
    } finally {
      setLoading(false)
    }
  }

  const scheduleMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDate || !projectId) return
    setSchedulingMeeting(true)
    try {
      await api.post('/api/meetings/', {
        project_id: projectId,
        title: meetingTitle,
        scheduled_at: new Date(meetingDate).toISOString(),
      })
      setScheduledMsg(`Meeting "${meetingTitle}" scheduled!`)
      setShowSchedule(false)
      setMeetingTitle('')
      setMeetingDate('')
      loadMeetings()
      setTimeout(() => setScheduledMsg(null), 3000)
    } finally {
      setSchedulingMeeting(false)
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Top actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {projects.length > 1 && (
            <select
              value={projectId ?? ''}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none input-ring bg-white"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <Button variant="secondary" onClick={() => setShowSchedule(true)}>
          <Calendar size={14} /> Schedule Meeting
        </Button>
      </div>

      {scheduledMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700 flex items-center gap-2">
          <Clock size={14} /> {scheduledMsg}
        </div>
      )}

      {/* Scheduled meetings section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">🗓️ Upcoming Team Meetings</h3>
        {meetings.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-center text-sm text-slate-400">
            No meetings scheduled yet. Click <strong>Schedule Meeting</strong> to set one up.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {meetings.map((meeting) => {
              const dateObj = new Date(meeting.scheduled_at)
              const formattedDate = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <Card key={meeting.id} className="p-4 flex items-center justify-between border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Video size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{meeting.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{formattedDate} at {formattedTime}</div>
                    </div>
                  </div>
                  <Badge tone="indigo">
                    Upcoming
                  </Badge>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Summarizer card */}
      <Card className="p-5">
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          AI Meeting Summarizer
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Paste meeting notes or upload a recording — AI extracts summary, key decisions, and action items.
        </p>

        {/* Audio upload */}
        <label className="inline-flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-4 py-2 mb-3 cursor-pointer transition font-semibold">
          {transcribing ? <Spinner size={13} className="text-indigo-500" /> : <Mic size={13} />}
          {transcribing ? 'Transcribing audio…' : 'Upload meeting recording (mp3 / wav / m4a)'}
          <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm" className="hidden" onChange={handleAudioUpload} disabled={transcribing} />
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={7}
          placeholder="e.g. Rahul: Authentication is done. Priya: Dashboard UI ready for review. Aman: Testing in progress, 3 bugs found…"
          className="w-full text-sm border border-slate-200 rounded-xl p-3.5 outline-none input-ring resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">{notes.length} characters</span>
          <Button onClick={summarize} loading={loading} disabled={!notes.trim() || !projectId}>
            <Sparkles size={14} /> Summarize Meeting
          </Button>
        </div>
        {error && <div className="text-xs text-rose-500 mt-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      </Card>

      {/* Summary output */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <Card className="p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">📋 Summary</div>
            <ul className="space-y-2">
              {summary.summary.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span> {s}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">✅ Decisions</div>
            <ul className="space-y-2">
              {summary.decisions.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">⚡ Action Items</div>
            <div className="space-y-2">
              {summary.action_items.map((a, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-sm font-semibold text-slate-700">{a.task}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.owner} · Due {a.due}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule a Meeting">
        <div className="space-y-4">
          <Input
            label="Meeting Title *"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="e.g. Sprint Planning, Code Review"
          />
          <Input
            label="Date & Time *"
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
          />
          {projects.length > 1 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 block">Project</label>
              <select
                value={projectId ?? ''}
                onChange={(e) => setProjectId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none input-ring bg-white"
              >
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={scheduleMeeting}
              loading={schedulingMeeting}
              disabled={!meetingTitle.trim() || !meetingDate}
              className="flex-1"
            >
              Schedule
            </Button>
            <Button variant="secondary" onClick={() => setShowSchedule(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
