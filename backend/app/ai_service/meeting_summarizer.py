from app.ai_service.client import complete_json

SYSTEM = (
    "You summarize software team meeting notes or transcripts. Respond with this "
    'exact JSON shape: {"summary": string[], "decisions": string[], '
    '"action_items": [{"task": string, "owner": string, "due": string}]}. '
    "summary = 3-5 bullet points, each under 14 words. If owner or due date "
    'are not mentioned for an action item, use "Unassigned" / "TBD".'
)


def summarize_meeting(transcript: str) -> dict:
    return complete_json(SYSTEM, transcript[:8000])
