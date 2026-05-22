from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.constants import UserRole
from apps.core.permissions import IsManager
from apps.rooms.models import RoomStatus


class RoomPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return IsManager().has_permission(request, view)


class RoomStatusPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in (
            UserRole.MANAGER,
            UserRole.RECEPTIONIST,
            UserRole.HOUSEKEEPING,
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        role = request.user.role
        if role in (UserRole.MANAGER, UserRole.RECEPTIONIST):
            return True
        if role == UserRole.HOUSEKEEPING:
            new_status = request.data.get('status')
            if new_status == RoomStatus.AVAILABLE and obj.status == RoomStatus.CLEANING:
                return True
            return False
        return False


class AmenityPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return IsManager().has_permission(request, view)
