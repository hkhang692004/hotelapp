# Migration to fix old CONFIRMED orders not added to booking.total_amount

from django.db import migrations
from decimal import Decimal


def add_old_confirmed_services_to_booking(apps, schema_editor):
    """Cộng những CONFIRMED services cũ (trước fix) vào booking.total_amount"""
    ServiceOrder = apps.get_model('hotel_services', 'ServiceOrder')
    Booking = apps.get_model('bookings', 'Booking')
    
    # Tìm những CONFIRMED services có confirmed_at được set từ migration 0004 (tức old data)
    # Nhưng chúng chưa được cộng vào booking (booking.total_amount không bao gồm nó)
    old_confirmed_orders = ServiceOrder.objects.filter(
        status='confirmed',
        confirmed_at__isnull=False  # Đã được set từ migration 0004
    ).select_related('booking')
    
    for order in old_confirmed_orders:
        # Kiểm tra xem order này đã được cộng vào booking chưa
        # (không có cách check trực tiếp, nên ta giả định nó chưa được cộng)
        booking = order.booking
        booking.total_amount += order.total_amount
        booking.save(update_fields=['total_amount', 'updated_at'])


def reverse_add_old_confirmed_services(apps, schema_editor):
    """Revert: trừ những CONFIRMED services cũ từ booking.total_amount"""
    ServiceOrder = apps.get_model('hotel_services', 'ServiceOrder')
    Booking = apps.get_model('bookings', 'Booking')
    
    old_confirmed_orders = ServiceOrder.objects.filter(
        status='confirmed',
        confirmed_at__isnull=False
    ).select_related('booking')
    
    for order in old_confirmed_orders:
        booking = order.booking
        booking.total_amount -= order.total_amount
        booking.save(update_fields=['total_amount', 'updated_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('hotel_services', '0004_set_confirmed_at_for_old_orders'),
    ]

    operations = [
        migrations.RunPython(add_old_confirmed_services_to_booking, reverse_add_old_confirmed_services),
    ]
