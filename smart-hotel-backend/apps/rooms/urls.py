from django.urls import path

from apps.rooms.views.v1 import (
    AmenityDetailView,
    AmenityListCreateView,
    AvailabilityView,
    RoomDetailView,
    RoomListCreateView,
    RoomStatusUpdateView,
    RoomTypeDetailView,
    RoomTypeImageView,
    RoomTypeListCreateView,
    RoomTypePriceView,
)

urlpatterns = [
    path('room-types/', RoomTypeListCreateView.as_view(), name='room-type-list'),
    path('room-types/<uuid:pk>/', RoomTypeDetailView.as_view(), name='room-type-detail'),
    path('room-types/<uuid:pk>/images/', RoomTypeImageView.as_view(), name='room-type-images'),
    path('room-types/<uuid:pk>/prices/', RoomTypePriceView.as_view(), name='room-type-prices'),
    path('rooms/', RoomListCreateView.as_view(), name='room-list'),
    path('rooms/availability/', AvailabilityView.as_view(), name='room-availability'),
    path('rooms/<uuid:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<uuid:pk>/status/', RoomStatusUpdateView.as_view(), name='room-status'),
    path('amenities/', AmenityListCreateView.as_view(), name='amenity-list'),
    path('amenities/<uuid:pk>/', AmenityDetailView.as_view(), name='amenity-detail'),
]
