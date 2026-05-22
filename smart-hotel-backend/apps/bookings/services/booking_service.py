from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.accounts.constants import UserRole
from apps.accounts.models import User
from apps.bookings.models import Booking, BookingRoom, BookingStatus, BookingStatusHistory
from apps.core.exceptions import BusinessException
from apps.rooms.models import Room, RoomStatus, RoomType
from apps.rooms.services.room_service import RoomService


class BookingService:
    ACTIVE_BLOCK_STATUSES = (
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.CHECKED_IN,
    )

    @staticmethod
    def _nights(check_in, check_out):
        return (check_out - check_in).days

    @staticmethod
    def _generate_code():
        prefix = timezone.now().strftime('BK-%Y%m%d')
        count = Booking.objects.filter(booking_code__startswith=prefix).count() + 1
        return f'{prefix}-{count:04d}'

    @staticmethod
    def _log_status(booking, from_status, to_status, user, note=''):
        BookingStatusHistory.objects.create(
            booking=booking,
            from_status=from_status or '',
            to_status=to_status,
            changed_by=user,
            note=note,
        )

    @staticmethod
    def _allocate_rooms(room_type_id, quantity, check_in, check_out):
        busy = set(RoomService._busy_room_ids(check_in, check_out))
        rooms = list(
            Room.objects.select_for_update().filter(
                room_type_id=room_type_id,
                is_active=True,
                status=RoomStatus.AVAILABLE,
            ).exclude(pk__in=busy).order_by('room_number')[:quantity]
        )
        if len(rooms) < quantity:
            raise BusinessException('Không đủ phòng trống', code='ROOM_NOT_AVAILABLE', status_code=422)
        return rooms

    @staticmethod
    def _allocate_room_ids(room_ids, check_in, check_out):
        busy = set(RoomService._busy_room_ids(check_in, check_out))
        rooms = list(
            Room.objects.select_for_update().filter(pk__in=room_ids, is_active=True).order_by('room_number')
        )
        if len(rooms) != len(room_ids):
            raise BusinessException('Một hoặc nhiều phòng không tồn tại', code='ROOM_NOT_FOUND', status_code=404)
        for room in rooms:
            if room.pk in busy:
                raise BusinessException(f'Phòng {room.room_number} đã được đặt', code='ROOM_NOT_AVAILABLE', status_code=422)
            if room.status not in (RoomStatus.AVAILABLE, RoomStatus.RESERVED):
                raise BusinessException(
                    f'Phòng {room.room_number} không khả dụng',
                    code='ROOM_NOT_AVAILABLE',
                    status_code=422,
                )
        return rooms

    @staticmethod
    @transaction.atomic
    def create_booking(customer, check_in, check_out, adults, children, rooms_data, special_request=''):
        nights = BookingService._nights(check_in, check_out)
        if nights < 1:
            raise BusinessException('check_out phải sau check_in', code='INVALID_DATE_RANGE')

        booking = Booking.objects.create(
            booking_code=BookingService._generate_code(),
            customer=customer,
            status=BookingStatus.PENDING,
            check_in_date=check_in,
            check_out_date=check_out,
            adults=adults,
            children=children,
            special_request=special_request or '',
        )
        total = Decimal('0')
        for item in rooms_data:
            rt = RoomType.objects.get(pk=item['room_type_id'], is_active=True)
            qty = item.get('quantity', 1)
            allocated = BookingService._allocate_rooms(rt.id, qty, check_in, check_out)
            price = RoomService.get_price_for_date(rt, check_in)
            for room in allocated:
                subtotal = price * nights
                BookingRoom.objects.create(
                    booking=booking,
                    room=room,
                    room_type=rt,
                    price_per_night=price,
                    nights=nights,
                    subtotal=subtotal,
                )
                room.status = RoomStatus.RESERVED
                room.save(update_fields=['status', 'updated_at'])
                total += subtotal

        booking.total_amount = total
        booking.save(update_fields=['total_amount', 'updated_at'])
        BookingService._log_status(booking, '', BookingStatus.PENDING, customer)
        return booking

    @staticmethod
    @transaction.atomic
    def create_walk_in(staff, customer_id, check_in, check_out, adults, children, room_ids, special_request='', status=None):
        customer = User.objects.filter(pk=customer_id, role=UserRole.CUSTOMER, is_active=True).first()
        if not customer:
            raise BusinessException('Khách hàng không tồn tại', code='NOT_FOUND', status_code=404)

        nights = BookingService._nights(check_in, check_out)
        if nights < 1:
            raise BusinessException('check_out phải sau check_in', code='INVALID_DATE_RANGE')

        initial_status = status or BookingStatus.CONFIRMED
        booking = Booking.objects.create(
            booking_code=BookingService._generate_code(),
            customer=customer,
            status=initial_status,
            check_in_date=check_in,
            check_out_date=check_out,
            adults=adults,
            children=children,
            special_request=special_request or '',
        )
        rooms = BookingService._allocate_room_ids(room_ids, check_in, check_out)
        total = Decimal('0')
        for room in rooms:
            price = RoomService.get_price_for_date(room.room_type, check_in)
            subtotal = price * nights
            BookingRoom.objects.create(
                booking=booking,
                room=room,
                room_type=room.room_type,
                price_per_night=price,
                nights=nights,
                subtotal=subtotal,
            )
            room.status = RoomStatus.RESERVED if initial_status != BookingStatus.CHECKED_IN else RoomStatus.OCCUPIED
            room.save(update_fields=['status', 'updated_at'])
            total += subtotal

        booking.total_amount = total
        booking.save(update_fields=['total_amount', 'updated_at'])
        BookingService._log_status(booking, '', initial_status, staff, 'Walk-in booking')
        return booking

    @staticmethod
    @transaction.atomic
    def transition(booking, new_status, user, note='', room_ids=None):
        old = booking.status
        if old == new_status:
            return booking

        if new_status == BookingStatus.CONFIRMED:
            if old not in (BookingStatus.PENDING,):
                raise BusinessException('Không thể xác nhận booking này', code='INVALID_STATUS')
            booking.status = new_status
            booking.save(update_fields=['status', 'updated_at'])
            try:
                from apps.notifications.services.notification_service import NotificationService
                NotificationService.booking_confirmed(booking)
            except Exception:
                pass

        elif new_status == BookingStatus.CANCELLED:
            if old in (BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED):
                raise BusinessException('Không thể hủy booking này', code='INVALID_STATUS')
            if user.role == UserRole.CUSTOMER and old != BookingStatus.PENDING:
                raise BusinessException('Chỉ hủy được booking pending', code='FORBIDDEN', status_code=403)
            booking.status = new_status
            booking.cancelled_at = timezone.now()
            booking.cancel_reason = note
            booking.save(update_fields=['status', 'cancelled_at', 'cancel_reason', 'updated_at'])
            for br in booking.booking_rooms.select_related('room'):
                if br.room.status == RoomStatus.RESERVED:
                    br.room.status = RoomStatus.AVAILABLE
                    br.room.save(update_fields=['status', 'updated_at'])

        elif new_status == BookingStatus.CHECKED_IN:
            if old != BookingStatus.CONFIRMED:
                raise BusinessException('Booking phải ở trạng thái confirmed', code='INVALID_STATUS')
            booking.status = new_status
            booking.checked_in_at = timezone.now()
            booking.save(update_fields=['status', 'checked_in_at', 'updated_at'])
            for br in booking.booking_rooms.select_related('room'):
                br.room.status = RoomStatus.OCCUPIED
                br.room.save(update_fields=['status', 'updated_at'])

        elif new_status == BookingStatus.CHECKED_OUT:
            if old != BookingStatus.CHECKED_IN:
                raise BusinessException('Booking phải đang checked-in', code='INVALID_STATUS')
            booking.status = new_status
            booking.checked_out_at = timezone.now()
            booking.save(update_fields=['status', 'checked_out_at', 'updated_at'])
            task_ids = []
            for br in booking.booking_rooms.select_related('room'):
                br.room.status = RoomStatus.CLEANING
                br.room.save(update_fields=['status', 'updated_at'])
                try:
                    from apps.housekeeping.services.task_service import HousekeepingTaskService
                    task = HousekeepingTaskService.auto_create_checkout_task(br.room, user)
                    if task:
                        task_ids.append(str(task.id))
                except Exception:
                    pass
            BookingService._log_status(booking, old, new_status, user, note)
            booking._housekeeping_task_ids = task_ids
            return booking

        BookingService._log_status(booking, old, new_status, user, note)
        return booking

    @staticmethod
    def get_queryset_for_user(user):
        qs = Booking.objects.select_related('customer').prefetch_related(
            'booking_rooms__room',
            'booking_rooms__room_type',
        ).filter(is_active=True)
        if user.is_superuser:
            return qs
        if user.role == UserRole.CUSTOMER:
            return qs.filter(customer_id=user.id)
        if user.role in (UserRole.MANAGER, UserRole.RECEPTIONIST):
            return qs
        return qs.none()
