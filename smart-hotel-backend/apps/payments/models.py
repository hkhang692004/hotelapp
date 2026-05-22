from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class PaymentMethod(models.TextChoices):
    CASH = 'cash', 'Cash'
    CARD = 'card', 'Card'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    MOMO = 'momo', 'MoMo'
    VNPAY = 'vnpay', 'VNPay'


class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    REFUNDED = 'refunded', 'Refunded'


class Payment(BaseModel):
    booking = models.ForeignKey('bookings.Booking', on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    transaction_ref = models.CharField(max_length=100, blank=True, default='', db_index=True)
    vnp_transaction_no = models.CharField(max_length=32, blank=True, default='')
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_url = models.URLField(blank=True, default='')
    gateway_meta = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'payments_payment'


class Invoice(BaseModel):
    invoice_number = models.CharField(max_length=30, unique=True)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.PROTECT, related_name='invoices')
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'payments_invoice'


class Transaction(BaseModel):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=[('credit', 'Credit'), ('debit', 'Debit')])
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    note = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'payments_transaction'
