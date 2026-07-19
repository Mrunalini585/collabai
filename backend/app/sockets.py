"""
Socket.IO layer for real-time features:
  - Team Chat: messages broadcast instantly to everyone in a project "room"
  - Live Kanban: task create/update/move events broadcast so every open board
    updates without a page refresh

Rooms are named f"project:{project_id}" so events for one project never leak
into another. Chat messages are also persisted to Mongo so history survives
reconnects/refreshes.
"""
import socketio

from app.database import chat_collection

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def join_project(sid, data):
    """data: { project_id: int }"""
    room = f"project:{data['project_id']}"
    sio.enter_room(sid, room)


@sio.event
async def leave_project(sid, data):
    room = f"project:{data['project_id']}"
    sio.leave_room(sid, room)


@sio.event
async def chat_message(sid, data):
    """data: { project_id: int, user: str, text: str, ts?: int }"""
    import time
    room = f"project:{data['project_id']}"
    ts_ms = int(time.time() * 1000)
    data["ts"] = data.get("ts") or ts_ms
    doc = {
        "project_id": data["project_id"],
        "user": data["user"],
        "text": data["text"],
        "ts": data["ts"]
    }
    chat_collection.insert_one(doc)
    await sio.emit("chat_message", data, room=room, skip_sid=sid)


async def emit_task_event(project_id: int, event: str, task: dict):
    """
    Called from the REST task router after a create/update/delete commits,
    so every browser with that project's Kanban board open updates live
    without polling. event is one of: "task_created", "task_updated", "task_deleted".
    """
    room = f"project:{project_id}"
    await sio.emit(event, task, room=room)
