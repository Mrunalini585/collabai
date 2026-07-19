from typing import List, Optional
from pydantic import BaseModel


class RequirementAnalyzeRequest(BaseModel):
    srs_text: str


class RequirementAnalyzeResponse(BaseModel):
    modules_found: List[str]
    missing_modules: List[str]
    ambiguous: List[str]
    summary: str


class TaskGenerateRequest(BaseModel):
    project_description: str


class GeneratedTask(BaseModel):
    title: str
    category: str  # Frontend | Backend | Testing | DevOps ...


class TaskGenerateResponse(BaseModel):
    tasks: List[GeneratedTask]


class ChatAssistantRequest(BaseModel):
    project_id: int
    message: str


class ChatAssistantResponse(BaseModel):
    reply: str


class CodeReviewRequest(BaseModel):
    code: str
    filename: Optional[str] = "unknown.py"


class CodeIssue(BaseModel):
    type: str  # code_smell | duplicate | complexity | naming | security
    description: str
    suggestion: str


class CodeReviewResponse(BaseModel):
    issues: List[CodeIssue]


class MeetingSummarizeRequest(BaseModel):
    project_id: int
    transcript: str


class ActionItem(BaseModel):
    task: str
    owner: str
    due: str


class MeetingSummarizeResponse(BaseModel):
    summary: List[str]
    decisions: List[str]
    action_items: List[ActionItem]


class RiskPredictionResponse(BaseModel):
    probability_of_delay: int
    reasons: List[str]
    suggestions: List[str]


class SprintPlanRequest(BaseModel):
    project_id: int
    num_sprints: int = 3


class Sprint(BaseModel):
    name: str
    tasks: List[str]


class SprintPlanResponse(BaseModel):
    sprints: List[Sprint]


class DocGenerateRequest(BaseModel):
    project_id: int
    doc_type: str  # readme | api_docs | user_manual | technical_report | test_cases


class DocGenerateResponse(BaseModel):
    content: str
