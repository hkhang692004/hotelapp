from apps.accounts.constants import UserRole
from apps.core.permissions import IsManager, IsRole


class IsStaffManager(IsManager):
    pass


class CanManageStaff(IsManager):
    pass


class CanViewCustomers(IsRole):
    role = UserRole.RECEPTIONIST

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role == UserRole.MANAGER
