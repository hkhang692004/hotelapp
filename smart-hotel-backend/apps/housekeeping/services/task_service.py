from django.db import transaction
from django.utils import timezone

from apps.accounts.constants import UserRole
from apps.core.exceptions import BusinessException
from apps.housekeeping.models import HousekeepingLog, HousekeepingTask, TaskStatus, TaskType
from apps.rooms.models import RoomStatus


class HousekeepingTaskService:
    @staticmethod
    def _log(task, action, user, note=''):
        HousekeepingLog.objects.create(task=task, action=action, performed_by=user, note=note)

    @staticmethod
    @transaction.atomic
    def auto_create_checkout_task(room, user):
        existing = HousekeepingTask.objects.filter(
            room=room,
            status__in=(TaskStatus.PENDING, TaskStatus.IN_PROGRESS),
            is_active=True,
        ).exists()
        if existing:
            return None
        task = HousekeepingTask.objects.create(
            room=room,
            task_type=TaskType.CHECKOUT_CLEAN,
            priority='high',
            notes='Auto after checkout',
        )
        HousekeepingTaskService._log(task, 'created', user, 'Auto checkout clean')
        return task

    @staticmethod
    @transaction.atomic
    def create_task(room_id, assigned_to_id, priority, task_type, notes, user):
        from apps.rooms.models import Room
        room = Room.objects.filter(pk=room_id).first()
        if not room:
            raise BusinessException('Phòng không tồn tại', code='NOT_FOUND', status_code=404)
        assigned = None
        if assigned_to_id:
            from apps.accounts.models import User
            assigned = User.objects.filter(pk=assigned_to_id, role=UserRole.HOUSEKEEPING).first()
        task = HousekeepingTask.objects.create(
            room=room,
            assigned_to=assigned,
            priority=priority or 'normal',
            task_type=task_type or TaskType.DAILY_CLEAN,
            notes=notes or '',
        )
        HousekeepingTaskService._log(task, 'created', user)
        return task

    @staticmethod
    @transaction.atomic
    def assign(task_id, assigned_to_id, user):
        from apps.accounts.models import User
        task = HousekeepingTask.objects.select_related('room').filter(pk=task_id).first()
        if not task:
            raise BusinessException('Task không tồn tại', code='NOT_FOUND', status_code=404)
        assigned = User.objects.filter(pk=assigned_to_id, role=UserRole.HOUSEKEEPING).first()
        if not assigned:
            raise BusinessException('Nhân viên housekeeping không tồn tại', code='NOT_FOUND', status_code=404)
        task.assigned_to = assigned
        task.save(update_fields=['assigned_to', 'updated_at'])
        HousekeepingTaskService._log(task, 'assigned', user, f'Assigned to {assigned.full_name}')
        return task

    @staticmethod
    @transaction.atomic
    def update_status(task_id, new_status, user):
        task = HousekeepingTask.objects.select_related('room').filter(pk=task_id).first()
        if not task:
            raise BusinessException('Task không tồn tại', code='NOT_FOUND', status_code=404)
        if user.role == UserRole.HOUSEKEEPING and not user.is_superuser:
            if task.assigned_to_id and task.assigned_to_id != user.id:
                raise BusinessException('Không phải task của bạn', code='FORBIDDEN', status_code=403)

        old = task.status
        if new_status == TaskStatus.IN_PROGRESS:
            task.status = new_status
            task.started_at = timezone.now()
            task.save(update_fields=['status', 'started_at', 'updated_at'])
        elif new_status == TaskStatus.COMPLETED:
            task.status = new_status
            task.completed_at = timezone.now()
            task.save(update_fields=['status', 'completed_at', 'updated_at'])
            task.room.status = RoomStatus.AVAILABLE
            task.room.save(update_fields=['status', 'updated_at'])
        elif new_status == TaskStatus.CANCELLED:
            task.status = new_status
            task.save(update_fields=['status', 'updated_at'])
        else:
            task.status = new_status
            task.save(update_fields=['status', 'updated_at'])

        HousekeepingTaskService._log(task, f'{old}_to_{new_status}', user)
        return task

    @staticmethod
    def queryset_for_user(user, assigned_to_me=False, unassigned=False):
        qs = HousekeepingTask.objects.select_related('room', 'assigned_to').filter(is_active=True)
        if user.is_superuser or user.role in (UserRole.MANAGER, UserRole.RECEPTIONIST):
            if assigned_to_me:
                qs = qs.filter(assigned_to_id=user.id)
            elif unassigned:
                qs = qs.filter(assigned_to__isnull=True)
            return qs
        if user.role == UserRole.HOUSEKEEPING:
            from django.db.models import Q
            return qs.filter(Q(assigned_to_id=user.id) | Q(assigned_to__isnull=True, status=TaskStatus.PENDING))
        return qs.none()
