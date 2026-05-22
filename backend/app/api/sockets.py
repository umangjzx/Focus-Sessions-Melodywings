import socketio
from datetime import datetime
from sqlalchemy import func

from app.core.security import decode_token
from app.core.database import SessionLocal
from app.models.user import User
from app.models.presence import UserPresence
from app.models.meeting import Meeting, MeetingParticipant
from app.services.meeting_sync import build_meeting_sync

# Create Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

@sio.on('connect')
async def connect(sid, environ, auth):
    if not auth or 'token' not in auth:
        return False
    payload = decode_token(auth['token'])
    if not payload or "sub" not in payload:
        return False
        
    async with sio.session(sid) as session:
        session['user_id'] = int(payload["sub"])
    return True

@sio.on('disconnect')
async def disconnect(sid):
    async with sio.session(sid) as session:
        user_id = session.get('user_id')
        room_code = session.get('room_code')
        
    if user_id and room_code:
        # Mark user as offline
        with SessionLocal() as db:
            meeting = _find_meeting(db, room_code)
            if meeting:
                presence = db.query(UserPresence).filter(
                    UserPresence.meeting_id == meeting.id,
                    UserPresence.user_id == user_id,
                    UserPresence.connected == True
                ).first()
                if presence:
                    presence.connected = False
                    presence.left_at = datetime.utcnow()
                    db.commit()
                
                await sio.emit('participant_offline', {'user_id': user_id}, room=f"meeting_{meeting.id}")

def _normalize_room_code(room_code: str) -> str:
    return (room_code or "").strip().upper()


def _find_meeting(db, room_code: str):
    code = _normalize_room_code(room_code)
    return (
        db.query(Meeting)
        .filter(func.upper(Meeting.room_code) == code)
        .first()
    )


@sio.on('join_room')
async def join_room(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    if not room_code:
        return {'error': 'No room code provided'}

    async with sio.session(sid) as session:
        user_id = session.get('user_id')
        session['room_code'] = room_code

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if not meeting:
            return {'error': 'Meeting not found'}
            
        # Verify user is a participant
        participant = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.user_id == user_id
        ).first()
        
        if not participant:
            return {'error': 'Not a participant of this meeting'}

        await sio.enter_room(sid, f"meeting_{meeting.id}")

        # Update presence
        presence = db.query(UserPresence).filter(
            UserPresence.meeting_id == meeting.id,
            UserPresence.user_id == user_id
        ).first()
        
        if not presence:
            presence = UserPresence(
                meeting_id=meeting.id,
                user_id=user_id,
                joined_at=datetime.utcnow()
            )
            db.add(presence)
        
        presence.connected = True
        presence.last_seen = datetime.utcnow()
        if not presence.joined_at:
            presence.joined_at = datetime.utcnow()
            
        db.commit()

        # Broadcast that user joined
        user = db.query(User).filter(User.id == user_id).first()
        await sio.emit('participant_online', {
            'user_id': user.id,
            'name': user.name
        }, room=f"meeting_{meeting.id}")

        sync = build_meeting_sync(db, meeting)

    return {'status': 'joined', 'sync': sync}


@sio.on('request_sync')
async def request_sync(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    if not room_code:
        return {'error': 'No room code provided'}

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if not meeting:
            return {'error': 'Meeting not found'}
        sync = build_meeting_sync(db, meeting)

    await sio.emit('meeting_sync', sync, to=sid)
    return {'status': 'synced', 'sync': sync}


@sio.on('mark_ready')
async def mark_ready(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    ready = bool(data.get('ready', True))

    async with sio.session(sid) as session:
        user_id = session.get('user_id')

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if not meeting:
            return {'error': 'Meeting not found'}

        participant = (
            db.query(MeetingParticipant)
            .filter(
                MeetingParticipant.meeting_id == meeting.id,
                MeetingParticipant.user_id == user_id,
            )
            .first()
        )
        if not participant:
            return {'error': 'Not a participant'}

        if (meeting.status or "").upper() not in ("WAITING", "CREATED", "STARTED"):
            return {'error': 'Session already in progress'}

        participant.is_ready = ready
        db.commit()

        sync = build_meeting_sync(db, meeting)
        await sio.emit('ready_update', {
            'user_id': user_id,
            'is_ready': ready,
            'ready_count': sync['ready_count'],
            'online_count': sync['online_count'],
            'participant_count': sync['participant_count'],
        }, room=f"meeting_{meeting.id}")

    return {'status': 'ok', 'is_ready': ready, 'ready_count': sync['ready_count']}

@sio.on('leave_room')
async def leave_room(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    async with sio.session(sid) as session:
        user_id = session.get('user_id')
        if session.get('room_code') == room_code:
            del session['room_code']

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if meeting:
            await sio.leave_room(sid, f"meeting_{meeting.id}")
            
            presence = db.query(UserPresence).filter(
                UserPresence.meeting_id == meeting.id,
                UserPresence.user_id == user_id,
                UserPresence.connected == True
            ).first()
            if presence:
                presence.connected = False
                presence.left_at = datetime.utcnow()
                db.commit()
            
            await sio.emit('participant_offline', {'user_id': user_id}, room=f"meeting_{meeting.id}")
    return {'status': 'left'}

# Host Controls
@sio.on('start_meeting')
async def handle_start_meeting(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    duration_minutes = data.get('duration_minutes', 25)
    
    async with sio.session(sid) as session:
        user_id = session.get('user_id')

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if not meeting:
            return {'error': 'Meeting not found'}
        if meeting.host_id != user_id:
            return {'error': 'Unauthorized'}
            
        status_upper = (meeting.status or "").upper()
        if status_upper not in ("WAITING", "CREATED", "STARTED"):
            return {'error': f'Cannot start: meeting is {meeting.status}'}

        remaining = duration_minutes * 60
        meeting.status = "RUNNING"
        meeting.meeting_start_time = datetime.utcnow()
        meeting.meeting_duration = duration_minutes
        meeting.remaining_time = remaining

        for p in db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id
        ):
            p.is_ready = False

        db.commit()

        room = f"meeting_{meeting.id}"
        payload = {
            'meeting_id': meeting.id,
            'duration_minutes': duration_minutes,
            'remaining_seconds': remaining,
        }

        await sio.emit('meeting_started', payload, room=room)
        await sio.emit('timer_tick', {
            'meeting_id': meeting.id,
            'remaining_seconds': remaining,
            'status': 'RUNNING',
        }, room=room)

        from app.services.timer_service import start_timer_task
        await start_timer_task(sio, meeting.id)

    return {'status': 'started', 'remaining_seconds': remaining}

@sio.on('pause_meeting')
async def handle_pause_meeting(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    async with sio.session(sid) as session:
        user_id = session.get('user_id')

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if not meeting or meeting.host_id != user_id:
            return {'error': 'Unauthorized'}
        
        if (meeting.status or "").upper() != "RUNNING":
            return {'error': 'Invalid state transition'}

        meeting.status = "PAUSED"
        db.commit()

        await sio.emit('meeting_paused', {'meeting_id': meeting.id}, room=f"meeting_{meeting.id}")
        
        from app.services.timer_service import stop_timer_task
        await stop_timer_task(meeting.id)
        
    return {'status': 'paused'}

@sio.on('resume_meeting')
async def handle_resume_meeting(sid, data):
    room_code = _normalize_room_code(data.get('room_code', ''))
    async with sio.session(sid) as session:
        user_id = session.get('user_id')

    with SessionLocal() as db:
        meeting = _find_meeting(db, room_code)
        if not meeting or meeting.host_id != user_id:
            return {'error': 'Unauthorized'}
        
        if (meeting.status or "").upper() != "PAUSED":
            return {'error': 'Invalid state transition'}

        meeting.status = "RUNNING"
        db.commit()

        room = f"meeting_{meeting.id}"
        remaining = meeting.remaining_time or 0
        await sio.emit('meeting_resumed', {
            'meeting_id': meeting.id,
            'remaining_seconds': remaining,
        }, room=room)
        await sio.emit('timer_tick', {
            'meeting_id': meeting.id,
            'remaining_seconds': remaining,
            'status': 'RUNNING',
        }, room=room)

        from app.services.timer_service import start_timer_task
        await start_timer_task(sio, meeting.id)

    return {'status': 'resumed'}
