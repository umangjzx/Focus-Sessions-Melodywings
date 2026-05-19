from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.task import Task
from app.models.subtask import Subtask
from app.models.session import FocusSession
from app.models.session_note import SessionNote
from app.models.settings import UserSettings
from app.models.streak import Streak
from app.services.achievements import evaluate_achievements, update_streak
from app.services.productivity import calculate_productivity_score, calculate_xp


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Seed data already exists. Skipping.")
            return

        user = User(
            name="Demo User",
            email="demo@focus.local",
            hashed_password=get_password_hash("demo1234"),
        )
        db.add(user)
        db.flush()

        db.add(UserSettings(user_id=user.id))
        db.add(Streak(user_id=user.id))

        task1 = Task(
            user_id=user.id,
            title="Draft project outline",
            priority="high",
            estimated_minutes=45,
            status="todo",
        )
        task2 = Task(
            user_id=user.id,
            title="Review meeting notes",
            priority="medium",
            estimated_minutes=25,
            status="in-progress",
        )
        db.add_all([task1, task2])
        db.flush()

        db.add(
            Subtask(
                user_id=user.id,
                task_id=task1.id,
                title="Capture key milestones",
                priority="medium",
                estimated_minutes=15,
                status="todo",
            )
        )

        started_at = datetime.utcnow() - timedelta(minutes=30)
        completed_at = datetime.utcnow()
        score = calculate_productivity_score(25, 25, True, 4)
        xp = calculate_xp(25, score, True)
        session = FocusSession(
            user_id=user.id,
            task_id=task1.id,
            title="Deep work sprint",
            goal="Finish a clear outline",
            planned_minutes=25,
            actual_minutes=25,
            pauses=0,
            ambient_sound="rain",
            pomodoro_work=25,
            pomodoro_break=5,
            productivity_score=score,
            mood=4,
            notes="Felt focused after a quick stretch.",
            xp_earned=xp,
            task_completed=True,
            started_at=started_at,
            completed_at=completed_at,
            status="completed",
        )
        db.add(session)
        db.flush()
        db.add(SessionNote(user_id=user.id, session_id=session.id, content=session.notes or ""))

        update_streak(db, user.id)
        evaluate_achievements(db, user.id)
        db.commit()
        print("Seed data inserted. Demo login: demo@focus.local / demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
