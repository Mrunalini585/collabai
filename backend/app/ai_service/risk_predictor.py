from app.ai_service.client import complete_json

SYSTEM = (
    "You are an AI project-risk predictor. Given task/status metrics for a "
    'software project, estimate delay risk. Respond with this exact JSON shape: '
    '{"probability_of_delay": number (0-100), "reasons": string[] (max 4, each '
    'under 12 words), "suggestions": string[] (max 3, each under 12 words, '
    "actionable)}. Base the estimate on the actual numbers given, don't invent data."
)


def predict_risk(metrics_summary: str) -> dict:
    return complete_json(SYSTEM, metrics_summary)


def build_metrics_summary(tasks: list) -> str:
    """Helper: turn a list of Task ORM objects/dicts into a compact text summary."""
    total = len(tasks) or 1
    done = sum(1 for t in tasks if t.get("status") == "Done")
    pct_done = round(done / total * 100)
    by_status = {}
    for t in tasks:
        by_status[t.get("status", "Unknown")] = by_status.get(t.get("status", "Unknown"), 0) + 1
    return (
        f"Total tasks: {total}. Completed: {done} ({pct_done}%). "
        f"Breakdown by status: {by_status}."
    )
