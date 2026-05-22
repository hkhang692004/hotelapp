from rest_framework.permissions import BasePermission

from apps.accounts.constants import UserRole


class IsRole(BasePermission):
    role = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role == self.role


class IsManager(IsRole):
    role = UserRole.MANAGER


class IsReceptionist(IsRole):
    role = UserRole.RECEPTIONIST


class IsHousekeeping(IsRole):
    role = UserRole.HOUSEKEEPING


class IsCustomer(IsRole):
    role = UserRole.CUSTOMER


class IsStaff(BasePermission):
    staff_roles = (
        UserRole.MANAGER,
        UserRole.RECEPTIONIST,
        UserRole.HOUSEKEEPING,
    )

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in self.staff_roles


class IsManagerOrReceptionist(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in (UserRole.MANAGER, UserRole.RECEPTIONIST)
