from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task, TaskComment
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskCommentCreate, TaskCommentOut
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
    
    # Generate notification if assigned
    if task.assignee_id:
        from app.models.notification import Notification
        db.add(Notification(user_id=task.assignee_id, text=f"You have been assigned the task '{task.title}'"))
        db.commit()

    await emit_task_event(project_id, "task_created", _task_dict(task))
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(project_id: int, task_id: int, payload: TaskUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_assignee_id = task.assignee_id
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)

    # Generate notification
    from app.models.notification import Notification
    if task.assignee_id and task.assignee_id != old_assignee_id:
        db.add(Notification(user_id=task.assignee_id, text=f"You have been assigned the task '{task.title}'"))
        db.commit()
    elif task.assignee_id:
        db.add(Notification(user_id=task.assignee_id, text=f"Task '{task.title}' has been updated"))
        db.commit()

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


@router.get("/{task_id}/comments", response_model=List[TaskCommentOut])
def list_comments(project_id: int, task_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).order_by(TaskComment.created_at.asc()).all()
    
    out = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        user_name = user.name if user else "Unknown"
        out.append(TaskCommentOut(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            content=c.content,
            created_at=c.created_at,
            user_name=user_name
        ))
    return out


@router.post("/{task_id}/comments", response_model=TaskCommentOut)
def create_comment(project_id: int, task_id: int, payload: TaskCommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        content=payload.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return TaskCommentOut(
        id=comment.id,
        task_id=comment.task_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        user_name=current_user.name
    )

