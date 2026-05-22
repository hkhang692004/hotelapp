from apps.notifications.models import Notification, NotificationChannel, NotificationType


class NotificationService:
    @staticmethod
    def send(user, notification_type, title, body, metadata=None, channel=NotificationChannel.IN_APP):
        return Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            body=body,
            channel=channel,
            metadata=metadata or {},
        )

    @staticmethod
    def booking_confirmed(booking):
        return NotificationService.send(
            booking.customer,
            NotificationType.BOOKING_CONFIRMED,
            'Đặt phòng thành công',
            f'Booking {booking.booking_code} đã được xác nhận',
            {'booking_id': str(booking.id)},
        )

    @staticmethod
    def payment_received(payment):
        return NotificationService.send(
            payment.booking.customer,
            NotificationType.PAYMENT_RECEIVED,
            'Thanh toán thành công',
            f'Đã thanh toán {payment.amount} cho {payment.booking.booking_code}',
            {'payment_id': str(payment.id)},
        )

    @staticmethod
    def room_ready(user, room):
        return NotificationService.send(
            user,
            NotificationType.ROOM_READY,
            'Phòng sẵn sàng',
            f'Phòng {room.room_number} đã dọn xong',
            {'room_id': str(room.id)},
        )
