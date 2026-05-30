# Migration to handle old CONFIRMED orders

from django.db import migrations
from django.db.models import F


def set_confirmed_at_for_old_orders(apps, schema_editor):
    """Set confirmed_at = created_at cho những CONFIRMED orders cũ (trước fix)"""
    ServiceOrder = apps.get_model('hotel_services', 'ServiceOrder')
    ServiceOrder.objects.filter(
        status='confirmed',
        confirmed_at__isnull=True
    ).update(confirmed_at=F('created_at'))


def reverse_set_confirmed_at(apps, schema_editor):
    """Revert confirmed_at về NULL"""
    ServiceOrder = apps.get_model('hotel_services', 'ServiceOrder')
    ServiceOrder.objects.filter(
        status='confirmed',
        confirmed_at__isnull=False
    ).update(confirmed_at=None)


class Migration(migrations.Migration):

    dependencies = [
        ('hotel_services', '0003_serviceorder_confirmed_at'),
    ]

    operations = [
        migrations.RunPython(set_confirmed_at_for_old_orders, reverse_set_confirmed_at),
    ]
