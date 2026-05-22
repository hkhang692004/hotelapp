from rest_framework import serializers

from apps.rooms.models import Amenity, Room, RoomPrice, RoomStatus, RoomType, RoomTypeImage


class RoomTypeWriteSerializer(serializers.ModelSerializer):
    amenity_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = RoomType
        fields = (
            'name', 'description', 'max_occupancy', 'base_price', 'amenity_ids', 'is_active',
        )

    def create(self, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', [])
        instance = super().create(validated_data)
        if amenity_ids:
            instance.amenities.set(Amenity.objects.filter(pk__in=amenity_ids))
        return instance

    def update(self, instance, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', None)
        instance = super().update(instance, validated_data)
        if amenity_ids is not None:
            instance.amenities.set(Amenity.objects.filter(pk__in=amenity_ids))
        return instance


class RoomWriteSerializer(serializers.ModelSerializer):
    room_type_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Room
        fields = ('room_number', 'floor', 'room_type_id', 'status', 'notes', 'is_active')

    def validate_room_type_id(self, value):
        if not RoomType.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError('Room type không tồn tại')
        return value

    def create(self, validated_data):
        room_type_id = validated_data.pop('room_type_id')
        return Room.objects.create(room_type_id=room_type_id, **validated_data)

    def update(self, instance, validated_data):
        room_type_id = validated_data.pop('room_type_id', None)
        if room_type_id is not None:
            instance.room_type_id = room_type_id
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class RoomStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RoomStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class AmenityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ('name', 'icon', 'is_active')


class RoomTypeImageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomTypeImage
        fields = ('image', 'is_primary', 'sort_order')


class RoomPriceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPrice
        fields = ('price', 'valid_from', 'valid_to', 'is_active')
