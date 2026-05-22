from django.urls import path

from apps.bookings.views.v1 import (
    BookingCancelView,
    BookingCheckInView,
    BookingCheckOutView,
    BookingConfirmView,
    BookingDetailView,
    BookingListCreateView,
    BookingStatusHistoryView,
    BookingWalkInView,
)

urlpatterns = [
    path('bookings/', BookingListCreateView.as_view(), name='booking-list'),
    path('bookings/walk-in/', BookingWalkInView.as_view(), name='booking-walk-in'),
    path('bookings/<uuid:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<uuid:pk>/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    path('bookings/<uuid:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('bookings/<uuid:pk>/check-in/', BookingCheckInView.as_view(), name='booking-check-in'),
    path('bookings/<uuid:pk>/check-out/', BookingCheckOutView.as_view(), name='booking-check-out'),
    path('bookings/<uuid:pk>/status-history/', BookingStatusHistoryView.as_view(), name='booking-status-history'),
]
