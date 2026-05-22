from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.schema import PARAM_PAGE, PARAM_PAGE_SIZE, TAG_NOTIFICATIONS
from apps.notifications.models import Notification
from apps.analytics.serializers import NotificationReadAllSerializer
from apps.notifications.serializers import NotificationSerializer


@extend_schema_view(
    get=extend_schema(
        tags=[TAG_NOTIFICATIONS],
        summary='Danh sách thông báo',
        parameters=[
            PARAM_PAGE,
            PARAM_PAGE_SIZE,
            OpenApiParameter(name='is_read', type=bool, location=OpenApiParameter.QUERY, required=False),
        ],
        responses={200: NotificationSerializer(many=True)},
    ),
)
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user, is_active=True)
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == 'true')
        data = NotificationSerializer(qs[:50], many=True).data
        return Response({'data': data, 'meta': {'total_count': qs.count()}})


@extend_schema_view(
    post=extend_schema(tags=[TAG_NOTIFICATIONS], summary='Đánh dấu đã đọc', responses={200: NotificationSerializer}),
)
class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        n = get_object_or_404(Notification, pk=pk, user=request.user)
        n.is_read = True
        n.save(update_fields=['is_read', 'updated_at'])
        return Response(NotificationSerializer(n).data)


@extend_schema_view(
    post=extend_schema(tags=[TAG_NOTIFICATIONS], summary='Đánh dấu tất cả đã đọc', responses={200: NotificationReadAllSerializer}),
)
class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'updated': updated})
