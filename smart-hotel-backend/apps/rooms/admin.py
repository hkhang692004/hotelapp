from django.contrib import admin

from apps.rooms.models import Amenity, Room, RoomPrice, RoomType, RoomTypeImage


class RoomTypeImageInline(admin.TabularInline):
    model = RoomTypeImage
    extra = 1


class RoomInline(admin.TabularInline):
    model = Room
    extra = 0


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'max_occupancy', 'base_price', 'is_active')
    search_fields = ('name',)
    filter_horizontal = ('amenities',)
    inlines = [RoomTypeImageInline, RoomInline]


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number', 'floor', 'room_type', 'status', 'is_active')
    list_filter = ('status', 'floor', 'room_type')
    search_fields = ('room_number',)


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'is_active')


@admin.register(RoomPrice)
class RoomPriceAdmin(admin.ModelAdmin):
    list_display = ('room_type', 'price', 'valid_from', 'valid_to', 'is_active')
