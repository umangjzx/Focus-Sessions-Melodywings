from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

from app.models.meeting import Meeting, MeetingParticipant
from app.models.presence import UserPresence
from app.models.statistics import MeetingStatistics, ParticipantStatistics

def generate_meeting_statistics(meeting_id: int):
    with SessionLocal() as db:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return

        participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
        
        total_participants = len(participants)
        completed_count = 0
        total_focus_time = 0

        # Create meeting stats entry first
        meeting_stats = db.query(MeetingStatistics).filter(MeetingStatistics.meeting_id == meeting_id).first()
        if not meeting_stats:
            meeting_stats = MeetingStatistics(
                meeting_id=meeting_id,
                host_id=meeting.host_id,
                session_duration=meeting.meeting_duration or 0
            )
            db.add(meeting_stats)
            db.commit()
            db.refresh(meeting_stats)

        for p in participants:
            # Simple assumption: focus duration is the duration of the meeting for now,
            # or based on presence. Let's calculate from presence table.
            presence_records = db.query(UserPresence).filter(
                UserPresence.meeting_id == meeting_id,
                UserPresence.user_id == p.user_id
            ).all()

            focus_duration_seconds = 0
            for r in presence_records:
                if r.joined_at and r.left_at:
                    diff = (r.left_at - r.joined_at).total_seconds()
                    focus_duration_seconds += max(0, int(diff))
                elif r.joined_at and meeting.status == "COMPLETED":
                    # If they didn't officially leave but meeting is done
                    diff = (datetime.utcnow() - r.joined_at).total_seconds()
                    focus_duration_seconds += max(0, int(diff))

            # Limit to max duration
            max_duration = (meeting.meeting_duration or 0) * 60
            focus_duration_seconds = min(focus_duration_seconds, max_duration)

            attendance_pct = (focus_duration_seconds / max_duration * 100) if max_duration > 0 else 0
            completion_status = "completed" if attendance_pct > 80 else "incomplete"

            if completion_status == "completed":
                completed_count += 1
                
            total_focus_time += focus_duration_seconds

            p_stats = db.query(ParticipantStatistics).filter(
                ParticipantStatistics.meeting_id == meeting_id,
                ParticipantStatistics.user_id == p.user_id
            ).first()

            if not p_stats:
                p_stats = ParticipantStatistics(
                    meeting_id=meeting_id,
                    user_id=p.user_id,
                )
                db.add(p_stats)

            p_stats.focus_duration = focus_duration_seconds
            p_stats.attendance_percentage = attendance_pct
            p_stats.completion_status = completion_status
            db.commit()

        meeting_stats.participants_count = total_participants
        meeting_stats.completed_count = completed_count
        meeting_stats.completion_rate = (completed_count / total_participants * 100) if total_participants > 0 else 0
        meeting_stats.average_focus_time = (total_focus_time / total_participants) if total_participants > 0 else 0

        db.commit()
