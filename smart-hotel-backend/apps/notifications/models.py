from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class NotificationType(models.TextChoices):
    BOOKING_CONFIRMED = 'booking_confirmed', 'Booking Confirmed'
    PAYMENT_RECEIVED = 'payment_received', 'Payment Received'
    SERVICE_ORDER_CONFIRMED = 'service_order_confirmed', 'Service Order Confirmed'
    ROOM_READY = 'room_ready', 'Room Ready'
    PASSWORD_RESET = 'password_reset', 'Password Reset'


class NotificationChannel(models.TextChoices):
    EMAIL = 'email', 'Email'
    IN_APP = 'in_app', 'In App'
    PUSH = 'push', 'Push'


class Notification(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    body = models.TextField()
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices, default=NotificationChannel.IN_APP)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-sent_at']
