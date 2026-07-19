from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# --- Postgres / SQLite (relational data) ---
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- MongoDB (unstructured data: chat messages, meeting transcripts, AI logs) ---
try:
    from pymongo import MongoClient
    mongo_client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=2000)
    mongo_client.server_info()  # test connection
    mongo_db = mongo_client[settings.mongo_db]
    chat_collection = mongo_db["chat_messages"]
    meeting_transcripts_collection = mongo_db["meeting_transcripts"]
    ai_logs_collection = mongo_db["ai_logs"]
except Exception:
    class _FakeCollection:
        def __init__(self):
            self.docs = []

        def insert_one(self, doc):
            self.docs.append(doc)

        def find(self, filter_dict=None, *a, **kw):
            if filter_dict:
                # Simple helper to filter by project_id if requested
                pid = filter_dict.get("project_id")
                if pid is not None:
                    return [d for d in self.docs if d.get("project_id") == pid]
            return self.docs

        def find_one(self, *a, **kw):
            return self.docs[0] if self.docs else None

    chat_collection = _FakeCollection()
    meeting_transcripts_collection = _FakeCollection()
    ai_logs_collection = _FakeCollection()
