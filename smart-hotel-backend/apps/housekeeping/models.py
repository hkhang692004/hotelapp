from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class TaskStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    NORMAL = 'normal', 'Normal'
    HIGH = 'high', 'High'


class TaskType(models.TextChoices):
    CHECKOUT_CLEAN = 'checkout_clean', 'Checkout Clean'
    DAILY_CLEAN = 'daily_clean', 'Daily Clean'
    MAINTENANCE = 'maintenance', 'Maintenance'


class HousekeepingTask(BaseModel):
    room = models.ForeignKey('rooms.Room', on_delete=models.PROTECT, related_name='housekeeping_tasks')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='housekeeping_tasks',
    )
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    priority = models.CharField(max_length=10, choices=TaskPriority.choices, default=TaskPriority.NORMAL)
    task_type = models.CharField(max_length=20, choices=TaskType.choices, default=TaskType.CHECKOUT_CLEAN)
    notes = models.TextField(blank=True, default='')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'housekeeping_task'
        indexes = [models.Index(fields=['assigned_to', 'status'])]


class HousekeepingLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    task = models.ForeignKey(HousekeepingTask, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=50)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'housekeeping_log'
        ordering = ['-timestamp']
