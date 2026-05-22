from django.contrib import admin

from apps.bookings.models import Booking, BookingRoom, BookingStatusHistory


class BookingRoomInline(admin.TabularInline):
    model = BookingRoom
    extra = 0


class BookingStatusHistoryInline(admin.TabularInline):
    model = BookingStatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'changed_at', 'note')


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('booking_code', 'customer', 'status', 'check_in_date', 'check_out_date', 'total_amount')
    list_filter = ('status',)
    search_fields = ('booking_code', 'customer__email')
    inlines = [BookingRoomInline, BookingStatusHistoryInline]
