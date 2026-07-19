from app.ai_service.client import complete

TEMPLATES = {
    "readme": "Write a professional README.md for this software project. Include "
    "sections: Overview, Features, Tech Stack, Setup Instructions, Usage, "
    "Contributing, License. Use real markdown formatting.",
    "api_docs": "Write API documentation in markdown for this project's main "
    "endpoints, inferring reasonable REST routes from the project description. "
    "Include method, path, request body, response body for each endpoint.",
    "user_manual": "Write a concise end-user manual in markdown explaining how "
    "to use this application's main features, step by step.",
    "technical_report": "Write a technical report section (markdown) covering "
    "system architecture, modules, and design decisions for this project, "
    "suitable for a final-year academic report.",
    "test_cases": "Write a markdown table of test cases (Test ID, Description, "
    "Steps, Expected Result) covering the core features of this project.",
}


def generate_documentation(doc_type: str, project_context: str) -> str:
    instruction = TEMPLATES.get(doc_type, TEMPLATES["readme"])
    system = "You are an AI technical writer generating documentation for a software project."
    prompt = f"{instruction}\n\nProject context:\n{project_context[:4000]}"
    return complete(system, prompt, max_tokens=1800)
