from decimal import Decimal

from django.db import migrations
from django.db.models import Sum


def sync_existing_paid_amounts(apps, schema_editor):
    Booking = apps.get_model('bookings', 'Booking')
    Payment = apps.get_model('payments', 'Payment')
    for booking in Booking.objects.all():
        paid = (
            Payment.objects.filter(
                booking_id=booking.id,
                status='completed',
                is_active=True,
            ).aggregate(total=Sum('amount'))['total']
            or Decimal('0')
        )
        booking.paid_amount = paid
        if paid <= 0:
            booking.payment_status = 'unpaid'
        elif paid >= booking.total_amount:
            booking.payment_status = 'paid'
        else:
            booking.payment_status = 'partial'
        booking.save(update_fields=['paid_amount', 'payment_status'])


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0002_bookingroom_subtotal_bookingstatushistory'),
        ('payments', '0002_payment_gateway_meta_payment_vnp_transaction_no'),
    ]

    operations = [
        migrations.RunPython(sync_existing_paid_amounts, migrations.RunPython.noop),
    ]