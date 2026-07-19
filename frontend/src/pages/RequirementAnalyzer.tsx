import React, { useState } from 'react'
import { FileText, Sparkles, Loader2, CheckCircle2, AlertTriangle, Upload, XCircle, Info } from 'lucide-react'
import { api } from '../api/client'
import { Card, Button } from '../components/ui'
import type { RequirementAnalysis } from '../types'

export default function RequirementAnalyzer() {
  const [srsText, setSrsText] = useState('')
  const [result, setResult]   = useState<RequirementAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSrsText(String(reader.result))
    reader.readAsText(file)
  }

  const analyze = async () => {
    if (!srsText.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.post<RequirementAnalysis>('/api/ai/analyze-requirements', { srs_text: srsText })
      setResult(data)
    } catch {
      setError('Could not analyze. Make sure your AI API key is configured in backend/.env')
    } finally {
      setLoading(false)
    }
  }

  const EXAMPLE_SRS = `Hospital Management System - SRS

1. Patient Registration
The system shall allow new patients to register with their personal details including name, DOB, contact information and medical history.

2. Doctor Management
Doctors can view their appointment schedule, update patient records and prescribe medications through the portal.

3. Appointment Booking
Patients can book appointments with available doctors by selecting a date and time slot from the doctor's schedule.

4. Billing
The system generates bills for consultations, tests and medications. Payments can be made online or at the counter.

5. Medical Records
Patient medical history, test results, and prescriptions are stored securely and accessible to authorized staff.`

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          AI Requirement Analyzer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Paste your SRS text or upload a .txt file — AI extracts modules, gaps, and ambiguous statements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-700">SRS / Requirements Document</div>
              <button
                onClick={() => setSrsText(EXAMPLE_SRS)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Load example
              </button>
            </div>
            <textarea
              value={srsText}
              onChange={(e) => setSrsText(e.target.value)}
              rows={14}
              placeholder="Paste your SRS text here…"
              className="w-full text-sm border border-slate-200 rounded-xl p-3.5 outline-none input-ring resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition font-medium">
                <Upload size={13} /> Upload .txt / .md file
                <input type="file" accept=".txt,.md" className="hidden" onChange={handleFile} />
              </label>
              <span className="text-xs text-slate-400">{srsText.length} chars</span>
            </div>
            <Button
              onClick={analyze}
              loading={loading}
              disabled={!srsText.trim()}
              className="w-full mt-3"
            >
              <Sparkles size={14} /> Analyze Requirements
            </Button>
            {error && (
              <div className="text-xs text-rose-500 mt-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
          </Card>

          {/* Summary card */}
          {result?.summary && (
            <Card className="p-5 bg-indigo-50 border-indigo-200 animate-fade-in">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-2">
                <Info size={15} /> AI Summary
              </div>
              <p className="text-sm text-indigo-800 leading-relaxed">{result.summary}</p>
            </Card>
          )}

          {/* Ambiguous statements */}
          {result && result.ambiguous.length > 0 && (
            <Card className="p-5 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-600 font-semibold mb-3 text-sm">
                <AlertTriangle size={15} /> Ambiguous Statements
              </div>
              <div className="space-y-2">
                {result.ambiguous.map((m) => (
                  <div key={m} className="flex items-start gap-2 text-sm bg-amber-50 text-amber-800 rounded-xl px-3 py-2">
                    <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" /> {m}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {/* Modules Found */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <CheckCircle2 size={15} className="text-emerald-500" /> Modules Found
              {result && <span className="text-xs font-normal text-slate-400 ml-auto">{result.modules_found.length}</span>}
            </div>
            {!result && <div className="text-xs text-slate-300 italic">Run analysis to see results</div>}
            {result?.modules_found.map((m) => (
              <div key={m} className="flex items-center gap-2 text-sm text-slate-700 py-1.5 border-b border-slate-50 last:border-0">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> {m}
              </div>
            ))}
          </Card>

          {/* Missing Modules */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <XCircle size={15} className="text-rose-400" /> Missing Modules
              {result && <span className="text-xs font-normal text-slate-400 ml-auto">{result.missing_modules.length}</span>}
            </div>
            {!result && <div className="text-xs text-slate-300 italic">—</div>}
            {result?.missing_modules.length === 0 && (
              <div className="text-xs text-emerald-500 italic">✓ No missing modules detected</div>
            )}
            {result?.missing_modules.map((m) => (
              <div key={m} className="flex items-center gap-2 text-sm text-slate-600 py-1.5 border-b border-slate-50 last:border-0">
                <XCircle size={13} className="text-rose-400 shrink-0" /> {m}
              </div>
            ))}
          </Card>

          {/* Tips */}
          {!result && (
            <Card className="p-4 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">💡 Tips</div>
              <ul className="text-xs text-slate-500 space-y-1.5">
                <li>• Paste at least 200 characters for best results</li>
                <li>• Include module names and feature descriptions</li>
                <li>• The AI looks for authentication, notifications, backup, reporting gaps</li>
                <li>• Load the example above to see how it works</li>
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
