from django.core.management.base import BaseCommand
from apps.accounts.constants import UserRole
from apps.accounts.models import StaffProfile, User
from apps.rooms.models import Amenity, Room, RoomType
from apps.services.models import Service, ServiceCategory


class Command(BaseCommand):
    help = 'Seed demo data'

    def handle(self, *args, **options):
        if not User.objects.filter(email='admin@hotel.com').exists():
            User.objects.create_superuser(
                email='admin@hotel.com',
                username='admin@hotel.com',
                password='Admin@123',
                full_name='Super Admin',
                role=UserRole.MANAGER,
            )
            self.stdout.write(self.style.SUCCESS('Admin: admin@hotel.com / Admin@123'))

        if not User.objects.filter(email='manager@hotel.com').exists():
            m = User.objects.create_user(
                email='manager@hotel.com',
                username='manager@hotel.com',
                password='Admin@123',
                full_name='Hotel Manager',
                role=UserRole.MANAGER,
                is_staff=True,
            )
            StaffProfile.objects.create(user=m, employee_code='MGR-001', department='Management')

        if not User.objects.filter(email='reception@hotel.com').exists():
            r = User.objects.create_user(
                email='reception@hotel.com',
                username='reception@hotel.com',
                password='Admin@123',
                full_name='Le Tan',
                role=UserRole.RECEPTIONIST,
                is_staff=True,
            )
            StaffProfile.objects.create(user=r, employee_code='REC-001', department='Front Desk')

        if not User.objects.filter(email='housekeeping@hotel.com').exists():
            hk = User.objects.create_user(
                email='housekeeping@hotel.com',
                username='housekeeping@hotel.com',
                password='Admin@123',
                full_name='Nhan Vien Don Phong',
                role=UserRole.HOUSEKEEPING,
                is_staff=True,
            )
            StaffProfile.objects.create(user=hk, employee_code='HK-001', department='Housekeeping')
            self.stdout.write(self.style.SUCCESS('Housekeeping: housekeeping@hotel.com'))

        if not User.objects.filter(email='customer@hotel.com').exists():
            User.objects.create_user(
                email='customer@hotel.com',
                username='customer@hotel.com',
                password='Admin@123',
                full_name='Khach Hang Demo',
                role=UserRole.CUSTOMER,
            )

        if not RoomType.objects.exists():
            wifi, _ = Amenity.objects.get_or_create(name='WiFi', defaults={'icon': 'wifi'})
            breakfast, _ = Amenity.objects.get_or_create(name='Breakfast', defaults={'icon': 'food'})
            rt = RoomType.objects.create(
                name='Deluxe Double',
                description='Phong doi view thanh pho',
                max_occupancy=2,
                base_price='2500000.00',
            )
            rt.amenities.set([wifi, breakfast])
            Room.objects.create(room_number='101', floor=1, room_type=rt, status='available')
            Room.objects.create(room_number='102', floor=1, room_type=rt, status='available')
            Room.objects.create(room_number='201', floor=2, room_type=rt, status='available')
            self.stdout.write(self.style.SUCCESS('Rooms seeded'))

        if not ServiceCategory.objects.exists():
            spa, _ = ServiceCategory.objects.get_or_create(name='Spa', slug='spa')
            restaurant, _ = ServiceCategory.objects.get_or_create(name='Nha hang', slug='restaurant')
            transport, _ = ServiceCategory.objects.get_or_create(name='Dua don', slug='transport')
            Service.objects.get_or_create(
                category=spa,
                name='Spa 60 phut',
                defaults={'description': 'Massage toan than', 'price': '800000.00', 'unit': 'per_person'},
            )
            Service.objects.get_or_create(
                category=restaurant,
                name='Buffet sang',
                defaults={'description': 'Buffet breakfast', 'price': '350000.00', 'unit': 'per_person'},
            )
            Service.objects.get_or_create(
                category=transport,
                name='Dua don san bay',
                defaults={'description': 'Airport pickup', 'price': '500000.00', 'unit': 'per_trip'},
            )
            self.stdout.write(self.style.SUCCESS('Services seeded'))

        self.stdout.write(self.style.SUCCESS('Seed completed. Password: Admin@123'))
