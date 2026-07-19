from app.ai_service.client import complete_json

SYSTEM = (
    "You are an AI sprint planner. Given a flat list of project tasks and a "
    "target number of sprints, group the tasks into a logical sprint sequence "
    "(dependencies first: auth/database before UI features, before testing/"
    'deployment). Respond with this exact JSON shape: {"sprints": '
    '[{"name": string, "tasks": string[]}]}.'
)


def plan_sprints(task_titles: list, num_sprints: int = 3) -> dict:
    prompt = f"Tasks: {', '.join(task_titles)}\nTarget number of sprints: {num_sprints}"
    return complete_json(SYSTEM, prompt)
