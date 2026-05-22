from rest_framework import serializers

from apps.accounts.serializers.user import UserSerializer
from apps.bookings.models import Booking, BookingRoom, BookingStatus, BookingStatusHistory


class BookingRoomSerializer(serializers.ModelSerializer):
    room_id = serializers.UUIDField(source='room.id', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)

    class Meta:
        model = BookingRoom
        fields = (
            'id', 'room_id', 'room_number', 'room_type_name',
            'price_per_night', 'nights', 'subtotal',
        )


class BookingListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'booking_code', 'status', 'customer_name', 'customer_email',
            'check_in_date', 'check_out_date', 'total_amount', 'created_at',
        )


class BookingDetailSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    rooms = BookingRoomSerializer(source='booking_rooms', many=True, read_only=True)
    nights = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id', 'booking_code', 'status', 'customer', 'check_in_date', 'check_out_date',
            'adults', 'children', 'nights', 'rooms', 'total_amount', 'special_request',
            'checked_in_at', 'checked_out_at', 'cancelled_at', 'cancel_reason', 'created_at',
        )

    def get_nights(self, obj):
        return (obj.check_out_date - obj.check_in_date).days


class BookingCreateSerializer(serializers.Serializer):
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    adults = serializers.IntegerField(default=1, min_value=1)
    children = serializers.IntegerField(default=0, min_value=0)
    rooms = serializers.ListField(
        child=serializers.DictField(),
        help_text='[{"room_type_id": "uuid", "quantity": 1}]',
    )
    special_request = serializers.CharField(required=False, allow_blank=True, default='')


class BookingWalkInSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    check_in_date = serializers.DateField()
    check_out_date = serializers.DateField()
    adults = serializers.IntegerField(default=1, min_value=1)
    children = serializers.IntegerField(default=0, min_value=0)
    room_ids = serializers.ListField(child=serializers.UUIDField())
    special_request = serializers.CharField(required=False, allow_blank=True, default='')
    status = serializers.ChoiceField(
        choices=[BookingStatus.CONFIRMED, BookingStatus.PENDING],
        required=False,
    )


class BookingCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default='')


class BookingActionNoteSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default='')


class BookingCheckInSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default='')


class BookingStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True, default='')

    class Meta:
        model = BookingStatusHistory
        fields = ('from_status', 'to_status', 'changed_by_name', 'changed_at', 'note')
