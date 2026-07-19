import React, { useEffect, useState } from 'react'
import { Github, GitCommit, AlertTriangle, GitPullRequest, Settings, Terminal, Shield, FolderGit } from 'lucide-react'
import { api } from '../api/client'
import { Card, Badge, Spinner, Button } from '../components/ui'

export default function GitHubPage() {
  const [commits, setCommits] = useState<any[]>([])
  const [prs, setPrs]         = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/github/commits').then(({ data }) => data).catch(() => []),
      api.get('/api/github/pulls').then(({ data }) => data).catch(() => []),
    ])
      .then(([commitsData, prsData]) => {
        const cList = Array.isArray(commitsData) ? commitsData : []
        const prList = Array.isArray(prsData) ? prsData : []
        if (cList.length === 0 && prList.length === 0) {
          setError('GitHub is not configured yet. Make sure GITHUB_TOKEN and GITHUB_REPO are set in backend/.env')
        } else {
          setCommits(cList)
          setPrs(prList)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Github size={16} className="text-white" />
          </div>
          GitHub Repository Integration
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Monitor code updates, commits, and pull requests directly from your repository.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </div>
      )}

      {!loading && error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2 border-amber-200 bg-amber-50/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">GitHub Integration Pending</h3>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">
                  CollabAI uses the GitHub API to display your repository's commits, pull requests, and branch status. To enable this integration, please follow the steps below.
                </p>

                <div className="mt-5 space-y-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <div>
                      <span className="font-semibold text-slate-700">Generate a Personal Access Token</span>
                      <p className="text-slate-500 mt-0.5">Go to Github &gt; Settings &gt; Developer settings &gt; Personal access tokens &gt; Tokens (classic), and generate a token with <code>repo</code> access.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <div>
                      <span className="font-semibold text-slate-700">Configure Environment Variables</span>
                      <p className="text-slate-500 mt-0.5">Open your backend environment file <code>backend/.env</code> and fill in the GITHUB credentials:</p>
                      <pre className="bg-slate-900 text-slate-300 rounded-xl p-3 mt-2 font-mono text-[10px] overflow-x-auto">
{`GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
GITHUB_REPO=yourUsername/yourRepositoryName`}
                      </pre>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <div>
                      <span className="font-semibold text-slate-700">Restart Backend Server</span>
                      <p className="text-slate-500 mt-0.5">Restart your FastAPI server to load the new credentials.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4 bg-slate-900 text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-white text-xs mb-3">
                <Terminal size={14} className="text-indigo-400" /> CLI Reference
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                You can initialize and push your project to a new repository using Git CLI:
              </p>
              <pre className="bg-black/50 text-[10px] font-mono p-3 rounded-lg space-y-1 overflow-x-auto text-slate-400">
                <div>git init</div>
                <div>git add .</div>
                <div>git commit -m "initial commit"</div>
                <div>git branch -M main</div>
                <div>git remote add origin ...</div>
                <div>git push -u origin main</div>
              </pre>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-700 text-xs mb-2">
                <Shield size={14} className="text-emerald-500" /> Private Repositories
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Personal Access Tokens ensure secure connection. CollabAI never stores or transmits your token outside your local environment.
              </p>
            </Card>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commits */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <GitCommit size={16} className="text-indigo-600" /> Repository Commits
              </span>
              <Badge tone="indigo">{commits.length} recent</Badge>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {commits.map((c, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <GitCommit size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 leading-normal truncate">{c.commit?.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-semibold text-slate-500">{c.commit?.author?.name}</span>
                      <span>·</span>
                      <span>{c.commit?.author?.date ? new Date(c.commit.author.date).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                  <code className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md self-start shrink-0">
                    {c.sha?.slice(0, 7)}
                  </code>
                </div>
              ))}
              {commits.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4">No recent commits found.</p>
              )}
            </div>
          </Card>

          {/* Pull requests */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <GitPullRequest size={16} className="text-violet-600" /> Pull Requests
              </span>
              <Badge tone="violet">{prs.length}</Badge>
            </div>
            <div className="space-y-3">
              {prs.map((pr, i) => (
                <div key={i} className="py-2.5 border-b border-slate-50 last:border-0">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <GitPullRequest size={12} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{pr.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>#{pr.number} by <span className="font-medium text-slate-500">{pr.user?.login}</span></span>
                    <span className={`px-1.5 py-0.5 rounded-md font-semibold text-[8px] uppercase ${
                      pr.state === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>{pr.state}</span>
                  </div>
                </div>
              ))}
              {prs.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4">No open pull requests.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
