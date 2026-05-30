import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hotel_services', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='is_staff_only',
            field=models.BooleanField(
                default=False,
                help_text='Chỉ nhân viên thấy (tiền cọc, minibar, hư hỏng, …)',
            ),
        ),
        migrations.AddField(
            model_name='serviceorderitem',
            name='description',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AlterField(
            model_name='serviceorderitem',
            name='service',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to='hotel_services.service',
            ),
        ),
    ]