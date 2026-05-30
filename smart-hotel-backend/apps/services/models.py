from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class ServiceOrderStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    CONFIRMED = 'confirmed', 'Confirmed'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class ServiceCategory(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        db_table = 'hotel_service_category'
        verbose_name_plural = 'service categories'

    def __str__(self):
        return self.name


class Service(BaseModel):
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name='services')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=50, default='per_person')
    is_staff_only = models.BooleanField(
        default=False,
        help_text='Chỉ nhân viên thấy (tiền cọc, minibar, hư hỏng, …)',
    )

    class Meta:
        db_table = 'hotel_service'

    def __str__(self):
        return self.name


class ServiceOrder(BaseModel):
    booking = models.ForeignKey('bookings.Booking', on_delete=models.PROTECT, related_name='service_orders')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='service_orders')
    status = models.CharField(max_length=20, choices=ServiceOrderStatus.choices, default=ServiceOrderStatus.PENDING)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True, help_text='Thời điểm được confirm hoặc tạo với status CONFIRMED')
    note = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'hotel_service_order'


class ServiceOrderItem(BaseModel):
    order = models.ForeignKey(ServiceOrder, on_delete=models.CASCADE, related_name='items')
    service = models.ForeignKey(Service, on_delete=models.PROTECT, null=True, blank=True)
    description = models.CharField(max_length=255, blank=True, default='')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        db_table = 'hotel_service_order_item'
