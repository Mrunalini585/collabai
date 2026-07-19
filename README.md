# CollabAI — AI-Powered Project Lifecycle & Team Collaboration Platform

A centralized platform that replaces the usual GitHub + Trello + Google Docs +
WhatsApp + ChatGPT sprawl with one tool, and layers real AI on top of the
software development lifecycle: requirement analysis, task generation, code
review, meeting summarization, risk prediction, sprint planning, and an
in-app project-aware chat assistant.

This repo is a **working scaffold**, not a finished product: the architecture,
models, auth, and AI pipeline are real and runnable, but you should expect to
extend it (tests, migrations, deployment hardening, more UI polish) as part
of your final-year build.

## Architecture

```
React (Vite + TS + Tailwind)
        │  REST (axios, JWT)
        ▼
FastAPI backend
   ├── Postgres   → users, projects, tasks, teams, meetings
   ├── MongoDB    → chat messages, meeting transcripts, AI logs
   └── AI service layer (app/ai_service)
          ├── requirement_analyzer.py
          ├── task_generator.py
          ├── documentation_generator.py
          ├── code_reviewer.py
          ├── meeting_summarizer.py
          ├── risk_predictor.py
          ├── sprint_planner.py
          ├── chat_assistant.py
          └── transcriber.py    (Whisper, OpenAI only)
          (all route through client.py, which switches between
           OpenAI and Gemini based on AI_PROVIDER in .env)

Note: requirements.txt intentionally does NOT include langchain or
faiss-cpu — nothing in this codebase uses them. They're common additions
if you later want retrieval-augmented generation (e.g. embedding your SRS
docs into a vector store), but adding them pulls in numpy<2.0 as a
transitive dependency, which has no pre-built wheel for very new Python
versions (3.13+) and will try to compile from source, requiring a C
compiler. If you add them later, either use Python 3.11/3.12, or install
Visual Studio Build Tools (Windows) / Xcode Command Line Tools (Mac) first.
        │
        ▼
GitHub REST API (commits / PRs, via a PAT)
```

## Repo layout

```
collabai-project/
├── backend/            FastAPI app
│   ├── app/
│   │   ├── models/     SQLAlchemy models (User, Project, Task, TeamMember, Meeting)
│   │   ├── schemas/     Pydantic request/response schemas
│   │   ├── routers/     auth, projects, tasks, teams, ai, meetings, github, admin
│   │   ├── ai_service/  the 8 AI modules + the provider-agnostic client
│   │   ├── core/        JWT + password hashing, auth dependency
│   │   ├── config.py    pydantic-settings, reads .env
│   │   ├── database.py  Postgres engine/session + Mongo client
│   │   └── main.py      FastAPI app, CORS, router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/            React + TypeScript (Vite)
│   ├── src/
│   │   ├── pages/        Login, Signup, Dashboard, Projects (Kanban),
│   │   │                 AIAssistant, RequirementAnalyzer, Meetings,
│   │   │                 GitHubPage, Reports, Chat, Admin, Settings
│   │   ├── components/    Sidebar, TopBar, Layout, ProtectedRoute, ui.tsx
│   │   ├── context/       AuthContext (JWT storage + /api/auth/me)
│   │   ├── api/client.ts  axios instance with auth interceptor
│   │   └── types/         shared TS interfaces
│   └── .env.example
├── docker-compose.yml   Postgres + Mongo + backend in containers
└── README.md
```

## Running it locally

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: set OPENAI_API_KEY (or GEMINI_API_KEY + AI_PROVIDER=gemini),
# and point DATABASE_URL at a running Postgres instance (or use docker-compose below)
uvicorn app.main:app --reload
```

The API comes up on `http://localhost:8000`. Interactive docs at `/docs`.
On first run, `Base.metadata.create_all()` creates all Postgres tables
automatically — swap this for Alembic migrations before going to production
(an `alembic.ini` is already stubbed in for you).

Postgres + Mongo, without installing them locally:

```bash
docker compose up -d postgres mongo
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Opens on `http://localhost:5173`. Sign up a user (any role), then create a
project from the Projects page — the Dashboard, Kanban, Reports, and AI
Assistant all key off your first project.

### 3. Try the AI features

- **Requirement Analyzer** — paste any SRS-style paragraph and click Analyze.
- **AI Assistant** — ask "what tasks are pending?"; it reads your live task board.
- **Meetings** — paste rough meeting notes and click Summarize.
- **Risk prediction** — shown automatically on the Dashboard once you have tasks.

All of these require a valid `OPENAI_API_KEY` (or Gemini equivalent) in
`backend/.env` — without one, those endpoints will return an auth error from
the AI provider, everything else in the app works independently of it.

## What's fully wired vs. stubbed

| Area | Status |
|---|---|
| Auth (signup/login/JWT) | ✅ working |
| Projects & Kanban tasks | ✅ working, persisted to Postgres |
| AI: requirements, tasks, chat, docs, code review, risk, sprints, meetings | ✅ working (needs an API key) |
| GitHub commits/PRs | ✅ working (needs a `GITHUB_TOKEN` + `GITHUB_REPO`) |
| **Alembic migrations** | ✅ working — `alembic/` with an initial migration for all 5 tables |
| **Pytest suite** | ✅ working — 12 tests, SQLite in-memory + mocked AI client, zero setup |
| **Role-based dashboards** | ✅ working — student/faculty/team_leader/admin each get a different `/dashboard`, sidebar items filtered by role, `/admin` gated by `RoleRoute` |
| **Real-time chat (Socket.IO)** | ✅ working — messages broadcast instantly per-project room, persisted to Mongo |
| **Live Kanban sync (Socket.IO)** | ✅ working — task create/update/delete broadcast to every open board for that project |
| **Whisper meeting transcription** | ✅ working — upload audio in the Meetings page (or `POST /api/meetings/transcribe`), transcript feeds straight into the existing summarizer |
| Admin stats | ⚠️ minimal — extend `routers/admin.py` with the metrics you want to track |
| Email (password reset, notifications) | ⚠️ stubbed — plug in SendGrid/SES in `routers/auth.py` |

## Running the pieces added above

**Migrations** (run once against a real Postgres, before starting the API):
```bash
cd backend
alembic upgrade head
```

**Tests** (no Postgres/Mongo needed — uses SQLite + mocked AI calls):
```bash
cd backend
pip install -r requirements.txt
pytest -v
```

**Socket.IO** — the backend now exposes a *combined* ASGI app. Run it with
`asgi_app`, not the bare `app`:
```bash
uvicorn app.main:asgi_app --reload
```
The frontend already connects automatically (`src/api/socket.ts`). Open the
Team Chat or Projects page in two browser tabs to see it sync live.

**Whisper transcription** — needs `OPENAI_API_KEY` set (Whisper is
OpenAI-only, even if `AI_PROVIDER=gemini` for everything else). Go to
Meetings → "Upload meeting recording" → pick an mp3/wav/m4a file → the
transcript appears in the notes box, ready to summarize.

## Suggested next steps for your submission

1. Add automated tests for the frontend too (Vitest + React Testing Library).
2. Flesh out Admin stats with real metrics (active users this week, AI usage
   by module, per-project velocity).
3. Add email (SendGrid/SES) for password reset and deadline notifications.
4. Add a "team performance" evaluation form for faculty (the Faculty
   Dashboard has a placeholder for this already).
5. Deploy: backend to Render/Railway/Fly.io, frontend to Vercel/Netlify,
   Postgres via a managed provider (Neon, Supabase, RDS).
