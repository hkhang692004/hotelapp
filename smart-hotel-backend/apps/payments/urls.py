from django.urls import path

from apps.payments.views.v1 import (
    InvoiceDetailView,
    InvoiceListCreateView,
    PaymentDetailView,
    PaymentListCreateView,
    PaymentRefundView,
    PaymentWebhookView,
    VNPayIPNView,
    VNPayReturnView,
)

urlpatterns = [
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('payments/vnpay/ipn/', VNPayIPNView.as_view(), name='vnpay-ipn'),
    path('payments/vnpay/return/', VNPayReturnView.as_view(), name='vnpay-return'),
    path('payments/webhook/vnpay/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('payments/<uuid:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/<uuid:pk>/refund/', PaymentRefundView.as_view(), name='payment-refund'),
    path('invoices/', InvoiceListCreateView.as_view(), name='invoice-list'),
    path('invoices/<uuid:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
]
