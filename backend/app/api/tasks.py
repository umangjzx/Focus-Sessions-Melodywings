import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.task import Task
from app.models.subtask import Subtask
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, BulkAction

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _task_response(task: Task) -> TaskResponse:
    tags = json.loads(task.tags) if task.tags else []
    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        parent_id=None,
        title=task.title,
        description=task.description,
        priority=task.priority,
        estimated_minutes=task.estimated_minutes,
        status=task.status,
        tags=tags,
        notes=task.notes,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _subtask_response(subtask: Subtask) -> TaskResponse:
    tags = json.loads(subtask.tags) if subtask.tags else []
    return TaskResponse(
        id=subtask.id,
        user_id=subtask.user_id,
        parent_id=subtask.task_id,
        title=subtask.title,
        description=subtask.description,
        priority=subtask.priority,
        estimated_minutes=subtask.estimated_minutes,
        status=subtask.status,
        tags=tags,
        notes=subtask.notes,
        due_date=subtask.due_date,
        created_at=subtask.created_at,
        updated_at=subtask.updated_at,
    )


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: str | None = Query(None),
    priority: str | None = Query(None),
    search: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task_q = db.query(Task).filter(Task.user_id == user.id)
    subtask_q = db.query(Subtask).filter(Subtask.user_id == user.id)

    if status:
        task_q = task_q.filter(Task.status == status)
        subtask_q = subtask_q.filter(Subtask.status == status)
    if priority:
        task_q = task_q.filter(Task.priority == priority)
        subtask_q = subtask_q.filter(Subtask.priority == priority)
    if search:
        like = f"%{search}%"
        task_q = task_q.filter(Task.title.ilike(like))
        subtask_q = subtask_q.filter(Subtask.title.ilike(like))

    tasks = task_q.order_by(Task.sort_order, Task.created_at.desc()).all()
    subtasks = subtask_q.order_by(Subtask.sort_order, Subtask.created_at.desc()).all()
    return [_task_response(t) for t in tasks] + [_subtask_response(s) for s in subtasks]


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    data: TaskCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.parent_id:
        parent = (
            db.query(Task)
            .filter(Task.id == data.parent_id, Task.user_id == user.id)
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent task not found")
        subtask = Subtask(
            user_id=user.id,
            task_id=data.parent_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            estimated_minutes=data.estimated_minutes,
            tags=json.dumps(data.tags) if data.tags else None,
            notes=data.notes,
            due_date=data.due_date,
        )
        db.add(subtask)
        db.commit()
        db.refresh(subtask)
        return _subtask_response(subtask)

    task = Task(
        user_id=user.id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        estimated_minutes=data.estimated_minutes,
        tags=json.dumps(data.tags) if data.tags else None,
        notes=data.notes,
        due_date=data.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    data: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if task:
        for field, value in data.model_dump(exclude_unset=True).items():
            if field in {"parent_id"}:
                continue
            if field == "tags" and value is not None:
                setattr(task, field, json.dumps(value))
            else:
                setattr(task, field, value)
        db.commit()
        db.refresh(task)
        return _task_response(task)

    subtask = db.query(Subtask).filter(Subtask.id == task_id, Subtask.user_id == user.id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Task not found")

    payload = data.model_dump(exclude_unset=True)
    parent_id = payload.pop("parent_id", None)
    if parent_id is not None:
        parent = (
            db.query(Task)
            .filter(Task.id == parent_id, Task.user_id == user.id)
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent task not found")
        subtask.task_id = parent_id
    for field, value in payload.items():
        if field == "tags" and value is not None:
            setattr(subtask, field, json.dumps(value))
        else:
            setattr(subtask, field, value)
    db.commit()
    db.refresh(subtask)
    return _subtask_response(subtask)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if task:
        db.query(Subtask).filter(Subtask.task_id == task_id).delete()
        db.delete(task)
        db.commit()
        return {"success": True}

    subtask = db.query(Subtask).filter(Subtask.id == task_id, Subtask.user_id == user.id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(subtask)
    db.commit()
    return {"success": True}


@router.post("/bulk")
def bulk_action(
    data: BulkAction,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Perform bulk actions on multiple tasks at once."""
    affected = 0

    if data.action == "delete":
        for tid in data.ids:
            task = db.query(Task).filter(Task.id == tid, Task.user_id == user.id).first()
            if task:
                db.query(Subtask).filter(Subtask.task_id == tid).delete()
                db.delete(task)
                affected += 1
                continue
            subtask = db.query(Subtask).filter(Subtask.id == tid, Subtask.user_id == user.id).first()
            if subtask:
                db.delete(subtask)
                affected += 1
    else:
        new_status = data.action if data.action in ("todo", "in-progress") else "completed"
        for tid in data.ids:
            task = db.query(Task).filter(Task.id == tid, Task.user_id == user.id).first()
            if task:
                task.status = new_status
                affected += 1
                continue
            subtask = db.query(Subtask).filter(Subtask.id == tid, Subtask.user_id == user.id).first()
            if subtask:
                subtask.status = new_status
                affected += 1

    db.commit()
    return {"success": True, "affected": affected}
