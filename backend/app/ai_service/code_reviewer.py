from app.ai_service.client import complete_json

SYSTEM = (
    "You are an AI code reviewer. Given a source file's contents, identify real "
    "issues only (do not invent problems that aren't present). Respond with this "
    'exact JSON shape: {"issues": [{"type": string, "description": string, '
    '"suggestion": string}]}. type must be one of: code_smell, duplicate, '
    "complexity, naming, security. If the code has no issues in a category, omit it. "
    "Keep descriptions under 20 words each."
)


def review_code(code: str, filename: str = "unknown.py") -> dict:
    prompt = f"Filename: {filename}\n\n```\n{code[:6000]}\n```"
    return complete_json(SYSTEM, prompt)
