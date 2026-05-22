from rest_framework.permissions import BasePermission

from apps.accounts.constants import UserRole
from apps.bookings.models import Booking


class BookingAccessPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        if request.user.role in (UserRole.MANAGER, UserRole.RECEPTIONIST):
            return True
        if request.user.role == UserRole.CUSTOMER:
            return obj.customer_id == request.user.id
        return False


class BookingStaffActionPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in (UserRole.MANAGER, UserRole.RECEPTIONIST)
