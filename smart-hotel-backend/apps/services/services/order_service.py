from decimal import Decimal

from django.db import transaction

from apps.accounts.constants import UserRole
from apps.bookings.models import Booking
from apps.core.exceptions import BusinessException
from apps.services.models import Service, ServiceOrder, ServiceOrderItem, ServiceOrderStatus


class ServiceOrderService:
    @staticmethod
    @transaction.atomic
    def create_order(user, booking_id, items_data, scheduled_at=None, note=''):
        booking = Booking.objects.filter(pk=booking_id, is_active=True).first()
        if not booking:
            raise BusinessException('Booking không tồn tại', code='NOT_FOUND', status_code=404)
        if user.role == UserRole.CUSTOMER and booking.customer_id != user.id:
            raise BusinessException('Không có quyền', code='FORBIDDEN', status_code=403)

        order = ServiceOrder.objects.create(
            booking=booking,
            customer=booking.customer,
            scheduled_at=scheduled_at,
            note=note or '',
        )
        total = Decimal('0')
        for item in items_data:
            service = Service.objects.filter(pk=item['service_id'], is_active=True).first()
            if not service:
                raise BusinessException('Dịch vụ không tồn tại', code='NOT_FOUND', status_code=404)
            qty = item.get('quantity', 1)
            subtotal = service.price * qty
            ServiceOrderItem.objects.create(
                order=order,
                service=service,
                quantity=qty,
                unit_price=service.price,
                subtotal=subtotal,
            )
            total += subtotal
        order.total_amount = total
        order.save(update_fields=['total_amount', 'updated_at'])
        booking.total_amount += total
        booking.save(update_fields=['total_amount', 'updated_at'])
        return order

    @staticmethod
    @transaction.atomic
    def confirm(order_id, user):
        order = ServiceOrder.objects.filter(pk=order_id).first()
        if not order:
            raise BusinessException('Đơn không tồn tại', code='NOT_FOUND', status_code=404)
        if order.status != ServiceOrderStatus.PENDING:
            raise BusinessException('Trạng thái không hợp lệ', code='INVALID_STATUS')
        order.status = ServiceOrderStatus.CONFIRMED
        order.save(update_fields=['status', 'updated_at'])
        return order

    @staticmethod
    @transaction.atomic
    def cancel(order_id, user):
        order = ServiceOrder.objects.filter(pk=order_id).first()
        if not order:
            raise BusinessException('Đơn không tồn tại', code='NOT_FOUND', status_code=404)
        if order.status in (ServiceOrderStatus.COMPLETED, ServiceOrderStatus.CANCELLED):
            raise BusinessException('Không thể hủy', code='INVALID_STATUS')
        if user.role == UserRole.CUSTOMER and order.status != ServiceOrderStatus.PENDING:
            raise BusinessException('Chỉ hủy được đơn pending', code='FORBIDDEN', status_code=403)
        order.status = ServiceOrderStatus.CANCELLED
        order.save(update_fields=['status', 'updated_at'])
        return order

    @staticmethod
    def queryset_for_user(user):
        qs = ServiceOrder.objects.select_related('booking', 'customer').prefetch_related('items__service')
        if user.is_superuser:
            return qs.filter(is_active=True)
        if user.role == UserRole.CUSTOMER:
            return qs.filter(customer_id=user.id, is_active=True)
        if user.role in (UserRole.MANAGER, UserRole.RECEPTIONIST):
            return qs.filter(is_active=True)
        return qs.none()
