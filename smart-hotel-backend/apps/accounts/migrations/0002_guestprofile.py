from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GuestProfile',
            fields=[
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True,
                    related_name='guest_profile',
                    serialize=False,
                    to=settings.AUTH_USER_MODEL,
                )),
                ('national_id', models.CharField(blank=True, db_index=True, default='', max_length=50)),
                ('address', models.TextField(blank=True, default='')),
                ('notes', models.TextField(blank=True, default='')),
                ('is_temporary', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'accounts_guest_profile',
            },
        ),
    ]