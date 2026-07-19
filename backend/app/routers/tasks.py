from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.core.deps import get_current_user
from app.sockets import emit_task_event

router = APIRouter(prefix="/api/projects/{project_id}/tasks", tags=["tasks"])


def _task_dict(task: Task) -> dict:
    return {
        "id": task.id,
        "project_id": task.project_id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "assignee_id": task.assignee_id,
    }


@router.get("/", response_model=List[TaskOut])
def list_tasks(project_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Task).filter(Task.project_id == project_id)
    if status:
        q = q.filter(Task.status == status)
    return q.all()


@router.post("/", response_model=TaskOut)
async def create_task(project_id: int, payload: TaskCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    task = Task(project_id=project_id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    await emit_task_event(project_id, "task_created", _task_dict(task))
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(project_id: int, task_id: int, payload: TaskUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    # This is the event that powers "live Kanban" — when a leader drags a card
    # on their board, every other open board for this project updates instantly.
    await emit_task_event(project_id, "task_updated", _task_dict(task))
    return task


@router.delete("/{task_id}")
async def delete_task(project_id: int, task_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task_id_val = task.id
    db.delete(task)
    db.commit()
    await emit_task_event(project_id, "task_deleted", {"id": task_id_val, "project_id": project_id})
    return {"message": "Task deleted"}
