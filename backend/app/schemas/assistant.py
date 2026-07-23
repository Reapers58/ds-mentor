
from pydantic import BaseModel


class CalendarEvent(BaseModel):
    time: str
    title: str
    duration_min: int
    event_type: str


class PendingTask(BaseModel):
    id: str
    title: str
    due: str | None
    priority: str
    completed: bool = False


class DashboardResponse(BaseModel):
    date: str
    greeting: str
    calendar_events: list[CalendarEvent]
    pending_tasks: list[PendingTask]
    timesheet_status: str
    reminders: list[str]
