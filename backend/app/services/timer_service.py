from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.services.analytics_service import generate_meeting_statistics

# Active background tasks keyed by meeting_id
active_timers: dict[int, object] = {}


def _is_running(status: str | None) -> bool:
    return (status or "").upper() == "RUNNING"


async def run_timer(meeting_id: int, sio):
    """Decrement meeting timer every second and broadcast ticks."""
    import asyncio

    while True:
        await asyncio.sleep(1)

        with SessionLocal() as db:
            meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
            if not meeting or not _is_running(meeting.status):
                break

            if meeting.remaining_time is None:
                break

            if meeting.remaining_time > 0:
                meeting.remaining_time -= 1
                db.commit()

                await sio.emit(
                    'timer_tick',
                    {
                        'meeting_id': meeting_id,
                        'remaining_seconds': meeting.remaining_time,
                        'status': meeting.status,
                    },
                    room=f'meeting_{meeting_id}',
                )

            if meeting.remaining_time <= 0:
                meeting.status = 'COMPLETED'
                meeting.remaining_time = 0
                db.commit()

                await sio.emit(
                    'meeting_completed',
                    {'meeting_id': meeting_id},
                    room=f'meeting_{meeting_id}',
                )

                generate_meeting_statistics(meeting_id)
                break

    active_timers.pop(meeting_id, None)


async def start_timer_task(sio, meeting_id: int) -> None:
    """Start or restart the server-side timer for a meeting."""
    existing = active_timers.pop(meeting_id, None)
    if existing is not None:
        existing.cancel()

    task = await sio.start_background_task(run_timer, meeting_id, sio)
    active_timers[meeting_id] = task


async def stop_timer_task(meeting_id: int) -> None:
    """Stop the timer background task for a meeting."""
    task = active_timers.pop(meeting_id, None)
    if task is not None:
        task.cancel()
