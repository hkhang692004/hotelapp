import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.accounts.constants import UserRole


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.CHOICES, default=UserRole.CUSTOMER)
    phone = models.CharField(max_length=20, blank=True, default='')
    full_name = models.CharField(max_length=255, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f'{self.first_name} {self.last_name}'.strip()
        super().save(*args, **kwargs)


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='staff_profile')
    employee_code = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True, default='')
    hire_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_staff',
    )

    class Meta:
        db_table = 'accounts_staff_profile'


class GuestProfile(models.Model):
    """Hồ sơ khách walk-in — không bắt buộc đăng ký tài khoản."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='guest_profile',
    )
    national_id = models.CharField(max_length=50, blank=True, default='', db_index=True)
    address = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    is_temporary = models.BooleanField(default=True)

    class Meta:
        db_table = 'accounts_guest_profile'



class PasswordResetToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts_password_reset_token'
