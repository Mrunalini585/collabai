from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.models import user, project, task, meeting, announcement, notification  # noqa: F401
from app.routers import auth, projects, tasks, teams, ai, meetings, github, admin, announcements, notifications
from app.sockets import sio
import socketio

app = FastAPI(title="CollabAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-create tables (dev convenience). For production, use: alembic upgrade head
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
try:
    from app.database import SessionLocal
    from app.models.user import User
    from seed import seed_db
    db = SessionLocal()
    if db.query(User).count() == 0:
        print("Empty database detected. Running seed script...")
        seed_db()
    db.close()
except Exception as e:
    print(f"Failed to auto-seed on startup: {e}")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(teams.router)
app.include_router(ai.router)
app.include_router(meetings.router)
app.include_router(github.router)
app.include_router(admin.router)
app.include_router(announcements.router)
app.include_router(notifications.router)


# Combined ASGI app: HTTP requests fall through to `app` (FastAPI), Socket.IO
# requests are handled by `sio`. Run with: uvicorn app.main:asgi_app --reload
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="socket.io")
