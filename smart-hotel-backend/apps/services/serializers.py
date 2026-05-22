from rest_framework import serializers

from apps.services.models import Service, ServiceCategory, ServiceOrder, ServiceOrderItem


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ('id', 'name', 'slug', 'is_active')


class ServiceSerializer(serializers.ModelSerializer):
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Service
        fields = ('id', 'category', 'category_id', 'name', 'description', 'price', 'unit', 'is_active')


class ServiceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ('category_id', 'name', 'description', 'price', 'unit', 'is_active')


class ServiceOrderItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = ServiceOrderItem
        fields = ('id', 'service_name', 'quantity', 'unit_price', 'subtotal')


class ServiceOrderSerializer(serializers.ModelSerializer):
    items = ServiceOrderItemSerializer(many=True, read_only=True)
    booking_code = serializers.CharField(source='booking.booking_code', read_only=True)

    class Meta:
        model = ServiceOrder
        fields = (
            'id', 'booking_id', 'booking_code', 'status', 'total_amount',
            'scheduled_at', 'note', 'items', 'created_at',
        )


class ServiceOrderItemInputSerializer(serializers.Serializer):
    service_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class ServiceOrderCreateSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')
    items = ServiceOrderItemInputSerializer(many=True)
