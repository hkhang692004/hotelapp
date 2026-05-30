from django.urls import path

from apps.services.views.v1 import (
    ServiceCategoryListCreateView,
    ServiceDetailView,
    ServiceListCreateView,
    ServiceOrderCancelView,
    ServiceOrderConfirmView,
    ServiceOrderDetailView,
    ServiceOrderListCreateView,
)

from apps.services.views.v1 import BookingServiceOrdersView

urlpatterns = [
    path('service-categories/', ServiceCategoryListCreateView.as_view(), name='service-category-list'),
    path('services/', ServiceListCreateView.as_view(), name='service-list'),
    path('services/<uuid:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    path('service-orders/', ServiceOrderListCreateView.as_view(), name='service-order-list'),
    path('service-orders/<uuid:pk>/', ServiceOrderDetailView.as_view(), name='service-order-detail'),
    path('service-orders/<uuid:pk>/confirm/', ServiceOrderConfirmView.as_view(), name='service-order-confirm'),
    path('service-orders/<uuid:pk>/cancel/', ServiceOrderCancelView.as_view(), name='service-order-cancel'),
    path('bookings/<uuid:booking_id>/service-orders/', BookingServiceOrdersView.as_view(), name='booking-service-orders'),
]
