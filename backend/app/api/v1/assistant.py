from datetime import datetime

from typing import cast

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.assistant import CalendarEvent, DashboardResponse, PendingTask

router = APIRouter(prefix="/assistant", tags=["assistant"])

MOCK_DATA: dict[str, dict[str, object]] = {
    "developer": {
        "greeting": "Ready to ship some code?",
        "calendar_events": [
            CalendarEvent(time="09:00", title="Daily Standup", duration_min=15, event_type="meeting"),
            CalendarEvent(time="10:30", title="Code Review: PR #234", duration_min=45, event_type="review"),
            CalendarEvent(time="14:00", title="Sprint Planning Prep", duration_min=60, event_type="workshop"),
        ],
        "pending_tasks": [
            PendingTask(id="t1", title="Submit timesheet", due="Today 17:00", priority="high"),
            PendingTask(id="t2", title="Portal login confirmation", due="Today 10:00", priority="medium"),
            PendingTask(id="t3", title="Push feature/auth-wip branch", due="EOD", priority="high"),
            PendingTask(id="t4", title="Update API documentation", due="Tomorrow", priority="low"),
        ],
        "timesheet_status": "Pending submission",
        "reminders": [
            "Scrum call in 15 min",
            "Code review queue: 3 pending",
        ],
    },
    "qa": {
        "greeting": "Quality first! Here's your day.",
        "calendar_events": [
            CalendarEvent(time="09:00", title="Daily Standup", duration_min=15, event_type="meeting"),
            CalendarEvent(time="11:00", title="Test Case Review", duration_min=60, event_type="review"),
            CalendarEvent(time="15:00", title="Bug Triage Meeting", duration_min=30, event_type="meeting"),
        ],
        "pending_tasks": [
            PendingTask(id="t1", title="Submit timesheet", due="Today 17:00", priority="high"),
            PendingTask(id="t2", title="Verify bug fixes #121-#125", due="Today 16:00", priority="high"),
            PendingTask(id="t3", title="Write regression test suite", due="Friday", priority="medium"),
        ],
        "timesheet_status": "Pending submission",
        "reminders": [
            "Scrum call in 15 min",
            "3 high-priority bugs awaiting verification",
        ],
    },
    "pm": {
        "greeting": "Let's keep things on track!",
        "calendar_events": [
            CalendarEvent(time="09:00", title="Daily Standup", duration_min=15, event_type="meeting"),
            CalendarEvent(time="10:00", title="Stakeholder Sync", duration_min=60, event_type="meeting"),
            CalendarEvent(time="13:00", title="Sprint Retro Prep", duration_min=45, event_type="workshop"),
            CalendarEvent(time="15:30", title="Client Call - Project Alpha", duration_min=30, event_type="call"),
        ],
        "pending_tasks": [
            PendingTask(id="t1", title="Submit timesheet", due="Today 17:00", priority="high"),
            PendingTask(id="t2", title="Review sprint velocity report", due="Today 14:00", priority="high"),
            PendingTask(id="t3", title="Prepare stakeholder presentation", due="Tomorrow 10:00", priority="high"),
            PendingTask(id="t4", title="Follow up with design team", due="Today", priority="medium"),
        ],
        "timesheet_status": "Pending submission",
        "reminders": [
            "Stakeholder sync in 1 hour",
            "Project Gamma escalation needs attention",
        ],
    },
    "devops": {
        "greeting": "Keeping the infrastructure solid.",
        "calendar_events": [
            CalendarEvent(time="09:30", title="Infra Standup", duration_min=15, event_type="meeting"),
            CalendarEvent(time="11:00", title="Deploy Review: Staging", duration_min=30, event_type="review"),
            CalendarEvent(time="14:00", title="Security Patch Window", duration_min=120, event_type="maintenance"),
        ],
        "pending_tasks": [
            PendingTask(id="t1", title="Submit timesheet", due="Today 17:00", priority="high"),
            PendingTask(id="t2", title="Rotate SSL certificates", due="Today 12:00", priority="high"),
            PendingTask(id="t3", title="Monitor staging deployment", due="Ongoing", priority="high"),
        ],
        "timesheet_status": "Pending submission",
        "reminders": [
            "SSL certs expiring in 7 days",
            "Staging deployment in progress",
        ],
    },
    "po": {
        "greeting": "Let's build the right thing.",
        "calendar_events": [
            CalendarEvent(time="09:00", title="Daily Standup", duration_min=15, event_type="meeting"),
            CalendarEvent(time="10:00", title="Roadmap Review", duration_min=60, event_type="meeting"),
            CalendarEvent(time="13:30", title="Customer Feedback Session", duration_min=45, event_type="call"),
            CalendarEvent(time="16:00", title="Backlog Grooming", duration_min=60, event_type="workshop"),
        ],
        "pending_tasks": [
            PendingTask(id="t1", title="Submit timesheet", due="Today 17:00", priority="high"),
            PendingTask(id="t2", title="Approve Q3 roadmap changes", due="Today 16:00", priority="high"),
            PendingTask(id="t3", title="Review feature proposals", due="Friday", priority="medium"),
        ],
        "timesheet_status": "Pending submission",
        "reminders": [
            "Roadmap review in 1 hour",
            "2 pending feature proposals to review",
        ],
    },
    "admin": {
        "greeting": "Admin dashboard ready.",
        "calendar_events": [
            CalendarEvent(time="10:00", title="Team Sync", duration_min=30, event_type="meeting"),
            CalendarEvent(time="14:00", title="System Review", duration_min=45, event_type="review"),
        ],
        "pending_tasks": [
            PendingTask(id="t1", title="Review pending document uploads", due="Today", priority="medium"),
            PendingTask(id="t2", title="Check system health", due="Daily", priority="low"),
        ],
        "timesheet_status": "Completed",
        "reminders": [
            "2 documents pending approval",
        ],
    },
}


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(user: User = Depends(get_current_user)):
    today = datetime.now().strftime("%A, %B %d, %Y")
    data = MOCK_DATA.get(user.role, MOCK_DATA["developer"])

    return DashboardResponse(
        date=today,
        greeting=cast(str, data["greeting"]),
        calendar_events=cast(list[CalendarEvent], data["calendar_events"]),
        pending_tasks=cast(list[PendingTask], data["pending_tasks"]),
        timesheet_status=cast(str, data["timesheet_status"]),
        reminders=cast(list[str], data["reminders"]),
    )
