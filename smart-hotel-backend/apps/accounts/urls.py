from django.urls import path

from apps.bookings.views.v1 import CustomerBookingsView
from apps.accounts.views.v1 import (
    AvatarUploadView,
    ChangePasswordView,
    CustomerDetailView,
    CustomerListView,
    EnvelopeTokenRefreshView,
    LoginView,
    LogoutView,
    MeView,
    PasswordForgotView,
    PasswordResetView,
    RegisterView,
    StaffDetailView,
    StaffListCreateView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', EnvelopeTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/password/forgot/', PasswordForgotView.as_view(), name='auth-password-forgot'),
    path('auth/password/reset/', PasswordResetView.as_view(), name='auth-password-reset'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='auth-password-change'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/me/avatar/', AvatarUploadView.as_view(), name='auth-avatar'),
    path('staff/', StaffListCreateView.as_view(), name='staff-list'),
    path('staff/<uuid:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('customers/', CustomerListView.as_view(), name='customer-list'),
    path('customers/<uuid:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<uuid:pk>/bookings/', CustomerBookingsView.as_view(), name='customer-bookings'),
]
