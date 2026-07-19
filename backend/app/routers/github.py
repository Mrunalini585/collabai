"""
GitHub integration. Uses a Personal Access Token (GITHUB_TOKEN) with read access
to the configured repo. In production, prefer a GitHub App / OAuth flow instead
of a static PAT, and add webhook handling for push/PR events.

Includes a demo fallback mode to return realistic repository commits and pull requests
if no token is configured.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.config import settings
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/github", tags=["github"])

GITHUB_API = "https://api.github.com"


def _has_github_config() -> bool:
    """Return True if GitHub integration variables are configured with actual keys."""
    token = settings.github_token or ""
    repo = settings.github_repo or ""
    return bool(token.strip() and not token.startswith("ghp_your") and repo.strip() and not repo.startswith("yourUsername"))


def _headers():
    if not settings.github_token:
        raise HTTPException(status_code=400, detail="GITHUB_TOKEN is not configured on the server")
    return {"Authorization": f"Bearer {settings.github_token}", "Accept": "application/vnd.github+json"}


@router.get("/commits")
def get_commits(_=Depends(get_current_user)):
    if not _has_github_config():
        # Premium demo commits
        return [
            {
                "sha": "a1b2c3d4e5f6g7h8i9j0",
                "commit": {
                    "message": "refactor: replace passlib CryptContext with native bcrypt library for Windows compatibility",
                    "author": {
                        "name": "Aman (Backend Developer)",
                        "date": "2026-07-19T14:30:00Z"
                    }
                }
            },
            {
                "sha": "b8f7e6d5c4b3a2918273",
                "commit": {
                    "message": "feat: add Invite Team Member modal and view active members on Projects board",
                    "author": {
                        "name": "Rahul (Leader)",
                        "date": "2026-07-19T13:45:00Z"
                    }
                }
            },
            {
                "sha": "7a8b9c0d1e2f3a4b5c6d",
                "commit": {
                    "message": "style: update dashboard metrics cards and add responsive charts to Reports page",
                    "author": {
                        "name": "Priya (Frontend Developer)",
                        "date": "2026-07-18T18:20:00Z"
                    }
                }
            },
            {
                "sha": "f1e2d3c4b5a697887766",
                "commit": {
                    "message": "fix: resolve hardcoded project ID 1 in Meetings page and add active project selector",
                    "author": {
                        "name": "Aman (Backend Developer)",
                        "date": "2026-07-18T10:15:00Z"
                    }
                }
            },
            {
                "sha": "9e8d7c6b5a4938271605",
                "commit": {
                    "message": "initial commit: set up FastAPI app scaffolding, SQLite/SQLAlchemy schemas, and dev server",
                    "author": {
                        "name": "Rahul (Leader)",
                        "date": "2026-07-17T09:00:00Z"
                    }
                }
            }
        ]

    try:
        with httpx.Client() as client:
            resp = client.get(f"{GITHUB_API}/repos/{settings.github_repo}/commits", headers=_headers(), params={"per_page": 10})
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub connection failed: {str(e)}")


@router.get("/pulls")
def get_pull_requests(state: str = "all", _=Depends(get_current_user)):
    if not _has_github_config():
        # Premium demo PRs
        return [
            {
                "title": "feat: Integrate Gemini API into Requirement Analyzer",
                "number": 4,
                "user": {
                    "login": "aman_backend"
                },
                "state": "open"
            },
            {
                "title": "refactor: Use native bcrypt and fix signup ValueError",
                "number": 3,
                "user": {
                    "login": "aman_backend"
                },
                "state": "closed"
            },
            {
                "title": "style: Revamp login screen with glassmorphic dark design",
                "number": 2,
                "user": {
                    "login": "priya_frontend"
                },
                "state": "closed"
            },
            {
                "title": "feat: Set up SQLite database seeding script",
                "number": 1,
                "user": {
                    "login": "rahul_leader"
                },
                "state": "closed"
            }
        ]

    try:
        with httpx.Client() as client:
            resp = client.get(f"{GITHUB_API}/repos/{settings.github_repo}/pulls", headers=_headers(), params={"state": state, "per_page": 20})
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub connection failed: {str(e)}")
