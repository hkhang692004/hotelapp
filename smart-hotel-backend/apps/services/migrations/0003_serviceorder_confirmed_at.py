# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hotel_services', '0002_service_staff_only_custom_items'),
    ]

    operations = [
        migrations.AddField(
            model_name='serviceorder',
            name='confirmed_at',
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text='Thời điểm được confirm hoặc tạo với status CONFIRMED',
            ),
        ),
    ]
