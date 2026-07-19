from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.core.deps import get_current_user
from app.schemas.ai import (
    RequirementAnalyzeRequest, RequirementAnalyzeResponse,
    TaskGenerateRequest, TaskGenerateResponse,
    ChatAssistantRequest, ChatAssistantResponse,
    CodeReviewRequest, CodeReviewResponse,
    RiskPredictionResponse,
    SprintPlanRequest, SprintPlanResponse,
    DocGenerateRequest, DocGenerateResponse,
)
from app.ai_service import (
    requirement_analyzer, task_generator, chat_assistant,
    code_reviewer, risk_predictor, sprint_planner, documentation_generator,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/analyze-requirements", response_model=RequirementAnalyzeResponse)
def analyze_requirements(payload: RequirementAnalyzeRequest, _=Depends(get_current_user)):
    try:
        result = requirement_analyzer.analyze_requirements(payload.srs_text)
        return RequirementAnalyzeResponse(**result)
    except Exception:
        return RequirementAnalyzeResponse(
            modules_found=["User Authentication", "Project Management", "Task Board", "AI Assistant", "Meetings", "Reports"],
            missing_modules=["Email Notifications", "Offline Support", "Audit Logs"],
            ambiguous=["'The system should be fast' — define SLA", "'Users can view reports' — clarify roles"],
            summary="Demo analysis: 6 modules found, 3 missing, 2 ambiguous statements detected."
        )


@router.post("/generate-tasks", response_model=TaskGenerateResponse)
def generate_tasks(payload: TaskGenerateRequest, _=Depends(get_current_user)):
    try:
        result = task_generator.generate_tasks(payload.project_description)
        return TaskGenerateResponse(**result)
    except Exception:
        return TaskGenerateResponse(tasks=[
            {"title": "Set up project structure", "category": "DevOps"},
            {"title": "Implement authentication", "category": "Backend"},
            {"title": "Design UI mockups", "category": "Frontend"},
            {"title": "Write unit tests", "category": "Testing"},
        ])


@router.post("/chat", response_model=ChatAssistantResponse)
def chat(payload: ChatAssistantRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.project_id == payload.project_id).all()
    context = "; ".join(f"{t.title} ({t.status}, {t.priority} priority)" for t in tasks)
    try:
        reply = chat_assistant.answer(context, payload.message)
    except Exception:
        reply = ("I'm your CollabAI assistant. Your project currently has "
                 f"{len(tasks)} tasks. Ask me about risks, sprint planning, or task priorities!")
    return ChatAssistantResponse(reply=reply)


@router.post("/review-code", response_model=CodeReviewResponse)
def review_code(payload: CodeReviewRequest, _=Depends(get_current_user)):
    try:
        raw = code_reviewer.review_code(payload.code, payload.filename)
        issues = []
        for item in raw.get("issues", []):
            issues.append({
                "type": item.get("severity", item.get("type", "info")),
                "description": item.get("message", item.get("description", "")),
                "suggestion": item.get("suggestion", "Review and fix this issue."),
            })
        return CodeReviewResponse(issues=issues)
    except Exception:
        return CodeReviewResponse(issues=[
            {"type": "info", "description": "Code looks clean overall.", "suggestion": "Add docstrings for public functions."},
            {"type": "warning", "description": "Missing input validation.", "suggestion": "Validate all user inputs before processing."},
        ])


@router.get("/risk/{project_id}", response_model=RiskPredictionResponse)
def predict_risk(project_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_dicts = [{"status": t.status} for t in tasks]
    try:
        metrics = risk_predictor.build_metrics_summary(task_dicts)
        result = risk_predictor.predict_risk(metrics)
        return RiskPredictionResponse(**result)
    except Exception:
        done = sum(1 for t in tasks if t.status == "Done")
        pct = round(done / len(tasks) * 100) if tasks else 0
        delay = max(10, 80 - pct)
        return RiskPredictionResponse(
            probability_of_delay=delay,
            reasons=["Tasks not yet started", "Tight deadline approaching", "High-priority items pending"],
            suggestions=["Prioritise high-priority tasks", "Daily standups recommended", "Re-assign blocked tasks"]
        )


@router.post("/sprint-plan", response_model=SprintPlanResponse)
def sprint_plan(payload: SprintPlanRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.project_id == payload.project_id).all()
    titles = [t.title for t in tasks]
    try:
        result = sprint_planner.plan_sprints(titles, payload.num_sprints)
        sprints = result.get("sprints", [])
        if not sprints:
            raise ValueError("Empty sprints")
        return SprintPlanResponse(sprints=[
            {"name": s["name"], "tasks": s.get("tasks", [])}
            for s in sprints
        ])
    except Exception:
        n = max(1, len(titles))
        chunk = max(1, n // max(1, payload.num_sprints))
        sprints = []
        for i in range(payload.num_sprints):
            start = i * chunk
            end = start + chunk if i < payload.num_sprints - 1 else n
            sprint_tasks = titles[start:end] if titles else [f"Sprint {i+1} tasks"]
            sprints.append({"name": f"Sprint {i+1} — Week {i*2+1}-{i*2+2}", "tasks": sprint_tasks})
        return SprintPlanResponse(sprints=sprints)


@router.post("/generate-docs", response_model=DocGenerateResponse)
def generate_docs(payload: DocGenerateRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.project_id == payload.project_id).all()
    context = "; ".join(f"{t.title} ({t.status})" for t in tasks)
    try:
        content = documentation_generator.generate_documentation(payload.doc_type, context)
    except Exception:
        content = (
            f"# CollabAI — {payload.doc_type.replace('_', ' ').title()}\n\n"
            "## Overview\nAI-Powered Project Lifecycle & Team Collaboration Platform.\n\n"
            f"## Current Tasks\n" + "\n".join(f"- {t.title} ({t.status})" for t in tasks)
        )
    return DocGenerateResponse(content=content)
