from app.ai_service.client import complete_json

SYSTEM = (
    "You are an AI task generator for a software project management tool. "
    "Given a short project description, break it down into concrete engineering "
    'tasks. Respond with this exact JSON shape: {"tasks": [{"title": string, '
    '"category": string}]}. category must be one of: Frontend, Backend, Database, '
    "Testing, DevOps, Documentation. Generate 8-14 tasks covering the full stack."
)


def generate_tasks(project_description: str) -> dict:
    return complete_json(SYSTEM, project_description[:2000])
