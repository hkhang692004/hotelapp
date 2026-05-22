from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.bookings.models import Booking, BookingStatus
from apps.core.exceptions import BusinessException
from apps.payments.models import Invoice, Payment, PaymentMethod, PaymentStatus, Transaction
from apps.payments.services.vnpay_service import VNPayService


class PaymentService:
    @staticmethod
    def _generate_invoice_number():
        prefix = timezone.now().strftime('INV-%Y')
        count = Invoice.objects.filter(invoice_number__startswith=prefix).count() + 1
        return f'{prefix}-{count:05d}'

    @staticmethod
    def _generate_transaction_ref():
        return f'TXN-{timezone.now().strftime("%Y%m%d%H%M%S")}-{Payment.objects.count() + 1}'

    @staticmethod
    @transaction.atomic
    def create_payment(booking_id, amount, method, user, request=None, bank_code=None, locale='vn'):
        booking = Booking.objects.filter(pk=booking_id, is_active=True).first()
        if not booking:
            raise BusinessException('Booking không tồn tại', code='NOT_FOUND', status_code=404)
        if booking.status == BookingStatus.CANCELLED:
            raise BusinessException('Booking đã hủy', code='INVALID_BOOKING')

        payment = Payment.objects.create(
            booking=booking,
            amount=amount,
            method=method,
            status=PaymentStatus.PENDING,
        )

        if method == PaymentMethod.CASH:
            payment.status = PaymentStatus.COMPLETED
            payment.paid_at = timezone.now()
            payment.transaction_ref = PaymentService._generate_transaction_ref()
            payment.save()
            Transaction.objects.create(
                payment=payment,
                transaction_type='credit',
                amount=amount,
                note='Cash payment',
            )
            if booking.status == BookingStatus.PENDING:
                from apps.bookings.services.booking_service import BookingService
                BookingService.transition(booking, BookingStatus.CONFIRMED, user, 'Paid cash')
            try:
                from apps.notifications.services.notification_service import NotificationService
                NotificationService.payment_received(payment)
            except Exception:
                pass
        elif method == PaymentMethod.VNPAY:
            payment.save()
            payment.transaction_ref = VNPayService.txn_ref_from_payment_id(payment.id)
            payment.payment_url = VNPayService.build_payment_url(
                payment, booking, request=request, bank_code=bank_code, locale=locale,
            )
            payment.save(update_fields=['transaction_ref', 'payment_url', 'updated_at'])
        elif method in (PaymentMethod.MOMO, PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER):
            ref = PaymentService._generate_transaction_ref()
            payment.transaction_ref = ref
            payment.payment_url = f'https://sandbox.payment.local/pay/{ref}'
            payment.save()
        else:
            payment.save()

        return payment

    @staticmethod
    def _find_payment_by_vnp_txn_ref(txn_ref):
        payment_id = VNPayService.payment_id_from_txn_ref(txn_ref)
        return Payment.objects.select_related('booking').filter(pk=payment_id).first()

    @staticmethod
    def _complete_vnpay_payment(payment, vnp_params):
        payment.status = PaymentStatus.COMPLETED
        payment.paid_at = timezone.now()
        payment.vnp_transaction_no = str(vnp_params.get('vnp_TransactionNo', ''))
        payment.gateway_meta = dict(vnp_params)
        payment.save()
        Transaction.objects.create(
            payment=payment,
            transaction_type='credit',
            amount=payment.amount,
            note=f'VNPay {payment.vnp_transaction_no}',
        )
        booking = payment.booking
        if booking.status == BookingStatus.PENDING:
            from apps.bookings.services.booking_service import BookingService
            BookingService.transition(booking, BookingStatus.CONFIRMED, None, 'VNPay payment completed')
        try:
            from apps.notifications.services.notification_service import NotificationService
            NotificationService.payment_received(payment)
        except Exception:
            pass
        return payment

    @staticmethod
    @transaction.atomic
    def process_vnpay_ipn(vnp_params):
        txn_ref = vnp_params.get('vnp_TxnRef', '')
        payment = PaymentService._find_payment_by_vnp_txn_ref(txn_ref)
        if not payment:
            return {'RspCode': '01', 'Message': 'Order Not Found'}

        if payment.status == PaymentStatus.COMPLETED:
            return {'RspCode': '02', 'Message': 'Order already confirmed'}

        expected_amount = int(Decimal(payment.amount) * 100)
        if int(vnp_params.get('vnp_Amount', 0)) != expected_amount:
            return {'RspCode': '04', 'Message': 'Invalid amount'}

        if VNPayService.is_payment_success(vnp_params):
            PaymentService._complete_vnpay_payment(payment, vnp_params)
        elif payment.status == PaymentStatus.PENDING:
            payment.status = PaymentStatus.FAILED
            payment.gateway_meta = dict(vnp_params)
            payment.save(update_fields=['status', 'gateway_meta', 'updated_at'])

        return {'RspCode': '00', 'Message': 'Confirm Success'}

    @staticmethod
    @transaction.atomic
    def process_vnpay_return(vnp_params):
        txn_ref = vnp_params.get('vnp_TxnRef', '')
        payment = PaymentService._find_payment_by_vnp_txn_ref(txn_ref)
        if not payment:
            raise BusinessException('Payment không tồn tại', code='NOT_FOUND', status_code=404)

        expected_amount = int(Decimal(payment.amount) * 100)
        if int(vnp_params.get('vnp_Amount', 0)) != expected_amount:
            raise BusinessException('Số tiền không khớp', code='INVALID_AMOUNT')

        if payment.status == PaymentStatus.PENDING and VNPayService.is_payment_success(vnp_params):
            PaymentService._complete_vnpay_payment(payment, vnp_params)
        elif payment.status == PaymentStatus.PENDING and not VNPayService.is_payment_success(vnp_params):
            payment.status = PaymentStatus.FAILED
            payment.gateway_meta = dict(vnp_params)
            payment.save(update_fields=['status', 'gateway_meta', 'updated_at'])

        return payment, vnp_params

    @staticmethod
    @transaction.atomic
    def complete_webhook(transaction_ref):
        payment = Payment.objects.select_related('booking').filter(
            transaction_ref=transaction_ref,
            status=PaymentStatus.PENDING,
        ).first()
        if not payment:
            raise BusinessException('Payment không tồn tại', code='NOT_FOUND', status_code=404)
        payment.status = PaymentStatus.COMPLETED
        payment.paid_at = timezone.now()
        payment.save()
        Transaction.objects.create(
            payment=payment,
            transaction_type='credit',
            amount=payment.amount,
            note='Online payment',
        )
        booking = payment.booking
        if booking.status == BookingStatus.PENDING:
            from apps.bookings.services.booking_service import BookingService
            BookingService.transition(booking, BookingStatus.CONFIRMED, None, 'Payment completed')
        try:
            from apps.notifications.services.notification_service import NotificationService
            NotificationService.payment_received(payment)
        except Exception:
            pass
        return payment

    @staticmethod
    @transaction.atomic
    def refund(payment_id, amount, reason, user):
        payment = Payment.objects.filter(pk=payment_id).first()
        if not payment:
            raise BusinessException('Payment không tồn tại', code='NOT_FOUND', status_code=404)
        if payment.status != PaymentStatus.COMPLETED:
            raise BusinessException('Chỉ hoàn tiền payment đã completed', code='INVALID_STATUS')
        if amount > payment.amount:
            raise BusinessException('Số tiền hoàn vượt quá thanh toán', code='INVALID_AMOUNT')
        payment.status = PaymentStatus.REFUNDED
        payment.save()
        Transaction.objects.create(
            payment=payment,
            transaction_type='debit',
            amount=amount,
            note=reason or 'Refund',
        )
        return payment

    @staticmethod
    @transaction.atomic
    def create_invoice(booking_id):
        booking = Booking.objects.prefetch_related('booking_rooms').filter(pk=booking_id).first()
        if not booking:
            raise BusinessException('Booking không tồn tại', code='NOT_FOUND', status_code=404)
        subtotal = booking.total_amount
        tax = (subtotal * Decimal('0.10')).quantize(Decimal('0.01'))
        total = subtotal + tax
        invoice = Invoice.objects.create(
            invoice_number=PaymentService._generate_invoice_number(),
            booking=booking,
            subtotal=subtotal,
            tax=tax,
            discount=Decimal('0'),
            total=total,
        )
        return invoice

    @staticmethod
    def get_payments_for_user(user, booking_id=None):
        qs = Payment.objects.select_related('booking', 'booking__customer').filter(is_active=True)
        if booking_id:
            qs = qs.filter(booking_id=booking_id)
        if user.is_superuser:
            return qs
        if user.role == 'customer':
            return qs.filter(booking__customer_id=user.id)
        if user.role in ('manager', 'receptionist'):
            return qs
        return qs.none()
