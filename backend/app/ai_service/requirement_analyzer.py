from app.ai_service.client import complete_json

SYSTEM = (
    "You are an AI requirement analyzer for a software project. Given SRS "
    "(Software Requirements Specification) text, extract structured information. "
    'Respond with this exact JSON shape: {"modules_found": string[], '
    '"missing_modules": string[], "ambiguous": string[], "summary": string}. '
    "modules_found = concrete functional modules clearly described. "
    "missing_modules = standard modules commonly expected but absent "
    "(e.g. authentication, notifications, backup, logging, security, reporting). "
    "ambiguous = vague or underspecified statements. "
    "summary = one sentence overview. Keep each array item to 1-4 words."
)


def analyze_requirements(srs_text: str) -> dict:
    return complete_json(SYSTEM, srs_text[:8000])
