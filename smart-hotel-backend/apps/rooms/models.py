from django.db import models

from apps.core.models import BaseModel


class RoomStatus(models.TextChoices):
    AVAILABLE = 'available', 'Available'
    RESERVED = 'reserved', 'Reserved'
    OCCUPIED = 'occupied', 'Occupied'
    CLEANING = 'cleaning', 'Cleaning'
    MAINTENANCE = 'maintenance', 'Maintenance'


class Amenity(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        db_table = 'rooms_amenity'
        ordering = ['name']

    def __str__(self):
        return self.name


class RoomType(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    max_occupancy = models.PositiveIntegerField(default=2)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    amenities = models.ManyToManyField(Amenity, blank=True, related_name='room_types')

    class Meta:
        db_table = 'rooms_room_type'
        ordering = ['name']

    def __str__(self):
        return self.name


class RoomTypeImage(BaseModel):
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='room_types/')
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'rooms_room_type_image'
        ordering = ['sort_order', 'created_at']


class RoomPrice(BaseModel):
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='prices')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'rooms_room_price'
        indexes = [
            models.Index(fields=['room_type', 'valid_from', 'valid_to']),
        ]


class Room(BaseModel):
    room_number = models.CharField(max_length=20, unique=True)
    floor = models.PositiveIntegerField(default=1)
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name='rooms')
    status = models.CharField(max_length=20, choices=RoomStatus.choices, default=RoomStatus.AVAILABLE)
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'rooms_room'
        ordering = ['floor', 'room_number']
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.room_number
