import hashlib
import secrets
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.constants import UserRole
from apps.accounts.models import PasswordResetToken, User
from apps.core.exceptions import BusinessException


class AuthService:
    @staticmethod
    @transaction.atomic
    def register_customer(email, password, full_name, phone=''):
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password,
            full_name=full_name,
            phone=phone,
            role=UserRole.CUSTOMER,
        )
        return user

    @staticmethod
    def build_tokens(user):
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

    @staticmethod
    def logout(refresh_token):
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as exc:
            raise BusinessException('Refresh token không hợp lệ', code='INVALID_TOKEN') from exc

    @staticmethod
    @transaction.atomic
    def change_password(user, new_password):
        user.set_password(new_password)
        user.save(update_fields=['password'])

    @staticmethod
    @transaction.atomic
    def request_password_reset(email):
        user = User.objects.filter(email=email, is_active=True).first()
        if not user:
            return None
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        PasswordResetToken.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        return raw_token

    @staticmethod
    @transaction.atomic
    def reset_password(raw_token, new_password):
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        reset = PasswordResetToken.objects.select_related('user').filter(
            token_hash=token_hash,
            used=False,
            expires_at__gte=timezone.now(),
        ).first()
        if not reset:
            raise BusinessException('Token không hợp lệ hoặc đã hết hạn', code='INVALID_TOKEN')
        reset.user.set_password(new_password)
        reset.user.save(update_fields=['password'])
        reset.used = True
        reset.save(update_fields=['used'])
