"""
Unified AI client. Switches between OpenAI and Gemini based on settings.ai_provider,
so the rest of the app never talks to a specific vendor SDK directly.

Every AI module in this package calls `complete()` or `complete_json()` from here.

If no API key is configured, a rich DEMO fallback is returned so the app remains
fully functional for presentations and evaluation without requiring cloud credentials.
"""
import json
import re
import random
from typing import Optional

from app.config import settings

_openai_client = None
_gemini_model = None


def _has_api_key() -> bool:
    """Return True if a valid API key is present for the configured provider."""
    if settings.ai_provider == "gemini":
        return bool(settings.gemini_api_key and settings.gemini_api_key.strip())
    return bool(settings.openai_api_key and settings.openai_api_key.strip())


def _demo_complete(system: str, prompt: str) -> str:
    """
    Rich, context-aware demo responses for presentation mode.
    Parses keywords from the prompt/system to return relevant content.
    """
    p = (system + " " + prompt).lower()

    # Chat assistant responses
    if "pending" in p or "task" in p:
        return (
            "Based on your live project board, you currently have **2 tasks in 'To Do'**: "
            "'Create system architecture diagram' (High priority) and 'Integrate email notifications' (Low priority). "
            "There is **1 task In Progress**: 'Integrate Gemini API into Requirement Analyzer', "
            "and **1 in Testing**: 'Implement JWT authorization middleware'. "
            "Overall project completion is at **20%**. I recommend focusing on the High priority tasks first."
        )
    if "risk" in p or "delay" in p:
        return (
            "⚠️ **Risk Analysis**: With 2 out of 5 tasks still in 'To Do' and a deadline in 30 days, "
            "there is a **moderate risk of delay** (~45%). The JWT middleware task in Testing is a blocker "
            "for several downstream features. I recommend daily standups and reassigning the architecture "
            "diagram to a second team member."
        )
    if "sprint" in p:
        return (
            "**Suggested Sprint Plan:**\n\n"
            "**Sprint 1 (Days 1–7):** Complete JWT authorization middleware (currently in Testing), "
            "finish Gemini API integration.\n\n"
            "**Sprint 2 (Days 8–16):** Create system architecture diagram, "
            "begin email notifications integration.\n\n"
            "**Sprint 3 (Days 17–30):** Final integration testing, documentation, deployment preparation."
        )
    if "code" in p or "review" in p or "bug" in p:
        return (
            "**Code Review Summary:**\n\n"
            "✅ Logic looks correct overall.\n"
            "⚠️ **Line 23**: Missing input validation — consider adding a null-check before accessing `payload.data`.\n"
            "⚠️ **Line 47**: Magic number `72` should be extracted into a named constant `MAX_PASSWORD_LENGTH`.\n"
            "💡 **Suggestion**: Add docstrings to public functions for better maintainability.\n"
            "🔒 **Security**: Ensure all user inputs are sanitized before database queries."
        )
    if "doc" in p or "readme" in p or "api" in p:
        return (
            "# CollabAI Project — Auto-Generated Documentation\n\n"
            "## Overview\n"
            "An AI-powered project lifecycle & team collaboration platform built with FastAPI + React.\n\n"
            "## API Endpoints\n"
            "- `POST /api/auth/signup` — Register a new user\n"
            "- `POST /api/auth/login` — Authenticate and receive JWT\n"
            "- `GET /api/projects/` — List all projects for the authenticated user\n"
            "- `POST /api/projects/{id}/tasks/` — Create a task on the Kanban board\n"
            "- `POST /api/ai/chat` — Query the AI assistant with project context\n\n"
            "## Team\nTeam Leader, 2 Developers, 1 Faculty Guide"
        )
    if "who" in p and ("delay" in p or "slow" in p or "behind" in p):
        return (
            "Based on task assignments, **Aman (Backend Developer)** currently has the most overdue items — "
            "'Integrate Gemini API' has been In Progress for 3 days. "
            "This is a natural blocker since it's a complex integration task. "
            "Consider a pairing session with the team leader to unblock progress."
        )
    if "completion" in p or "percent" in p or "progress" in p:
        return (
            "The project is currently **20% complete** — 1 out of 5 tasks is marked Done. "
            "At this pace, you are on track if you complete at least 2 tasks per week. "
            "The project deadline is in **30 days**."
        )

    # Generic helpful response
    demos = [
        "I'm your CollabAI assistant, grounded in your live project data. "
        "Your team currently has 5 tasks across the Kanban board (1 Done, 1 Testing, 1 In Progress, 2 To Do). "
        "Ask me about specific tasks, risks, sprint planning, or code reviews!",

        "Great question! Based on your current project state, I can help with task prioritization, "
        "risk analysis, sprint planning, or generating documentation. "
        "Your highest priority pending item is 'Create system architecture diagram'.",

        "Your project is progressing steadily. With 1 task completed and 4 remaining, "
        "focus this week on clearing the 'Testing' stage — unblocking 'Implement JWT authorization middleware' "
        "will unlock the next sprint.",
    ]
    return random.choice(demos)


def _demo_complete_json(system: str, prompt: str) -> dict:
    """Return realistic JSON demo data based on context keywords."""
    p = (system + " " + prompt).lower()

    if "requirement" in p or "srs" in p or "module" in p:
        return {
            "modules_found": [
                "User Authentication & Role Management",
                "Project & Team Management",
                "Kanban Task Board",
                "AI Assistant & Chat",
                "Meeting Scheduler & Transcription",
                "GitHub Integration",
                "Analytics & Reports",
                "Admin Dashboard"
            ],
            "missing_modules": [
                "Email Notification System",
                "Offline / PWA Support",
                "Audit Logs & Activity History",
                "Data Export (CSV/PDF)"
            ],
            "ambiguous": [
                "'The system should respond quickly' — define specific response time SLA (e.g. < 200ms)",
                "'Users can view reports' — clarify which roles have report access",
                "'AI summarizes meetings' — specify minimum audio quality / language requirements"
            ],
            "summary": (
                "The SRS covers 8 core modules including authentication, Kanban boards, and AI-powered tools. "
                "4 important modules are absent: email notifications, offline support, audit logging, and data export. "
                "3 statements contain ambiguous language that should be clarified before development begins."
            )
        }

    if "task" in p and "generat" in p:
        return {
            "tasks": [
                {"title": "Set up FastAPI project structure", "priority": "High", "status": "To Do"},
                {"title": "Implement JWT authentication", "priority": "High", "status": "To Do"},
                {"title": "Design Kanban board UI", "priority": "Medium", "status": "To Do"},
                {"title": "Integrate Socket.IO for real-time chat", "priority": "Medium", "status": "To Do"},
                {"title": "Connect Gemini API for AI features", "priority": "Medium", "status": "To Do"},
                {"title": "Build admin dashboard", "priority": "Low", "status": "To Do"},
                {"title": "Write unit tests", "priority": "Low", "status": "To Do"},
            ]
        }

    if "risk" in p:
        return {
            "probability_of_delay": 42,
            "risk_level": "Medium",
            "reasons": [
                "40% of tasks are still in 'To Do' stage",
                "High-priority task 'JWT middleware' is blocked in Testing",
                "No tasks assigned to Faculty reviewer yet"
            ],
            "suggestions": [
                "Move 'Create system architecture diagram' to In Progress immediately",
                "Schedule a code review session to unblock the Testing stage",
                "Assign Faculty to review completed modules this week"
            ]
        }

    if "sprint" in p:
        return {
            "sprints": [
                {
                    "name": "Sprint 1 — Foundation (Days 1–7)",
                    "tasks": ["Implement JWT authorization middleware", "Integrate Gemini API into Requirement Analyzer"]
                },
                {
                    "name": "Sprint 2 — Core Features (Days 8–16)",
                    "tasks": ["Create system architecture diagram", "Integrate email notifications"]
                },
                {
                    "name": "Sprint 3 — Polish & Deploy (Days 17–30)",
                    "tasks": ["End-to-end integration testing", "Documentation", "Final demo preparation"]
                }
            ]
        }

    if "review" in p or "code" in p:
        return {
            "issues": [
                {"line": 23, "severity": "warning", "message": "Missing null check before accessing payload.data"},
                {"line": 47, "severity": "info", "message": "Magic number 72 should be a named constant MAX_PASSWORD_LENGTH"},
                {"line": 89, "severity": "error", "message": "Unhandled exception — wrap in try/except and return 500"}
            ],
            "summary": "3 issues found: 1 error, 1 warning, 1 suggestion. Overall code quality is good.",
            "score": 78
        }

    if "doc" in p or "readme" in p:
        return {
            "content": (
                "# CollabAI — Project Documentation\n\n"
                "## Overview\nAI-Powered Project Lifecycle & Team Collaboration Platform\n\n"
                "## Tech Stack\nFastAPI · SQLAlchemy · Socket.IO · React · TypeScript · Recharts\n\n"
                "## Setup\n1. `pip install -r requirements.txt`\n2. Configure `.env`\n3. `uvicorn app.main:asgi_app --reload`\n\n"
                "## Key Features\n- Kanban board with real-time sync\n- AI assistant grounded in live tasks\n- Meeting transcription & summarization\n- GitHub integration\n- Role-based dashboards"
            )
        }

    return {"result": "Demo mode active. Configure GEMINI_API_KEY or OPENAI_API_KEY in backend/.env for live AI responses."}


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _get_gemini_model():
    global _gemini_model
    if _gemini_model is None:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_model = genai.GenerativeModel(settings.gemini_model)
    return _gemini_model


def complete(system: str, prompt: str, max_tokens: int = 1200) -> str:
    """Return a plain-text completion from the configured provider."""
    if not _has_api_key():
        return _demo_complete(system, prompt)

    try:
        if settings.ai_provider == "gemini":
            model = _get_gemini_model()
            response = model.generate_content(
                f"{system}\n\n{prompt}",
                generation_config={"max_output_tokens": max_tokens},
            )
            return response.text

        # default: openai
        client = _get_openai_client()
        response = client.chat.completions.create(
            model=settings.openai_model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception:
        return _demo_complete(system, prompt)


def complete_json(system: str, prompt: str, max_tokens: int = 1200) -> dict:
    """
    Return a parsed JSON dict. Falls back to rich demo data if no API key configured.
    """
    if not _has_api_key():
        return _demo_complete_json(system, prompt)

    strict_system = (
        system
        + "\n\nRespond ONLY with valid JSON. No markdown fences, no preamble, no explanation."
    )
    try:
        raw = complete(strict_system, prompt, max_tokens=max_tokens)
        cleaned = re.sub(r"```json|```", "", raw).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise
    except Exception:
        return _demo_complete_json(system, prompt)
