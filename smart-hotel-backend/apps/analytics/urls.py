from django.urls import path

from apps.analytics.views.v1 import (
    BookingStatsView,
    DashboardView,
    OccupancyReportView,
    RevenueReportView,
    ServiceStatsView,
)

urlpatterns = [
    path('analytics/revenue/', RevenueReportView.as_view(), name='analytics-revenue'),
    path('analytics/occupancy/', OccupancyReportView.as_view(), name='analytics-occupancy'),
    path('analytics/bookings/', BookingStatsView.as_view(), name='analytics-bookings'),
    path('analytics/services/', ServiceStatsView.as_view(), name='analytics-services'),
    path('analytics/dashboard/', DashboardView.as_view(), name='analytics-dashboard'),
]
