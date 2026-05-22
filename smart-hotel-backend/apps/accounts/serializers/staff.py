from rest_framework import serializers

from apps.accounts.constants import UserRole
from apps.accounts.models import StaffProfile, User
from apps.accounts.serializers.user import UserSerializer


class StaffSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = StaffProfile
        fields = (
            'id', 'email', 'full_name', 'phone', 'role', 'is_active',
            'employee_code', 'department', 'hire_date',
        )


class StaffCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=[c for c in UserRole.CHOICES if c[0] != UserRole.CUSTOMER])
    employee_code = serializers.CharField(max_length=50)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    hire_date = serializers.DateField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email đã tồn tại')
        return value

    def validate_employee_code(self, value):
        if StaffProfile.objects.filter(employee_code=value).exists():
            raise serializers.ValidationError('Mã nhân viên đã tồn tại')
        return value
