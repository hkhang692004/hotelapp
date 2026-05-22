from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsManager, IsManagerOrReceptionist
from apps.core.schema import PARAM_PAGE, PARAM_PAGE_SIZE, TAG_INVOICES, TAG_PAYMENTS
from apps.payments.models import Invoice
from apps.payments.serializers import (
    InvoiceCreateSerializer,
    InvoiceSerializer,
    PaymentCreateSerializer,
    PaymentRefundSerializer,
    PaymentSerializer,
    PaymentWebhookSerializer,
    VNPayReturnSerializer,
)
from apps.payments.services.payment_service import PaymentService
from apps.payments.services.vnpay_service import VNPayService


@extend_schema_view(
    get=extend_schema(
        tags=[TAG_PAYMENTS],
        summary='Danh sách thanh toán',
        parameters=[
            PARAM_PAGE,
            PARAM_PAGE_SIZE,
            OpenApiParameter(name='booking_id', type=str, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name='status', type=str, location=OpenApiParameter.QUERY, required=False),
        ],
        responses={200: PaymentSerializer(many=True)},
    ),
    post=extend_schema(
        tags=[TAG_PAYMENTS],
        summary='Tạo thanh toán',
        request=PaymentCreateSerializer,
        responses={201: PaymentSerializer},
        examples=[
            OpenApiExample('Tiền mặt', value={'booking_id': 'uuid', 'amount': '10000000.00', 'method': 'cash'}, request_only=True),
            OpenApiExample('VNPay', value={'booking_id': 'uuid', 'amount': '10000000.00', 'method': 'vnpay'}, request_only=True),
        ],
    ),
)
class PaymentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        booking_id = request.query_params.get('booking_id')
        qs = PaymentService.get_payments_for_user(request.user, booking_id)
        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs.order_by('-created_at'), request)
        return paginator.get_paginated_response(PaymentSerializer(page, many=True).data)

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payment = PaymentService.create_payment(
            data['booking_id'],
            data['amount'],
            data['method'],
            request.user,
            request=request,
            bank_code=data.get('bank_code') or None,
            locale=data.get('locale', 'vn'),
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(tags=[TAG_PAYMENTS], summary='Chi tiết thanh toán', responses={200: PaymentSerializer}),
)
class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        payment = get_object_or_404(PaymentService.get_payments_for_user(request.user), pk=pk)
        return Response(PaymentSerializer(payment).data)


@extend_schema_view(
    get=extend_schema(
        tags=[TAG_PAYMENTS],
        summary='VNPay IPN (callback server-to-server)',
        description='VNPay gọi GET với query params. Trả JSON thuần RspCode/Message (không bọc envelope).',
        parameters=[OpenApiParameter(name='vnp_TxnRef', type=str, location=OpenApiParameter.QUERY)],
        responses={200: {'description': 'JSON thuần: RspCode, Message'}},
        auth=[],
    ),
)
class VNPayIPNView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        valid, params = VNPayService.verify_return_params(request.GET)
        if not valid:
            return JsonResponse({'RspCode': '97', 'Message': 'Invalid Checksum'})
        result = PaymentService.process_vnpay_ipn(params)
        return JsonResponse(result)


@extend_schema_view(
    get=extend_schema(
        tags=[TAG_PAYMENTS],
        summary='VNPay Return URL (sau khi khách thanh toán)',
        description='Trình duyệt redirect về đây. Xác thực chữ ký và cập nhật payment.',
        responses={200: VNPayReturnSerializer},
        auth=[],
    ),
)
class VNPayReturnView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        valid, params = VNPayService.verify_return_params(request.GET)
        if not valid:
            return Response(
                {'success': False, 'vnp_response_code': '97', 'message': 'Invalid Checksum'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment, vnp_params = PaymentService.process_vnpay_return(params)
        payload = {
            'payment': PaymentSerializer(payment).data,
            'vnp_response_code': str(vnp_params.get('vnp_ResponseCode', '')),
            'vnp_transaction_status': str(vnp_params.get('vnp_TransactionStatus', '')),
            'vnp_transaction_no': str(vnp_params.get('vnp_TransactionNo', '')),
            'success': VNPayService.is_payment_success(vnp_params),
        }
        return Response(payload)


@extend_schema_view(
    post=extend_schema(
        tags=[TAG_PAYMENTS],
        summary='Webhook thanh toán thủ công (dev/MoMo)',
        request=PaymentWebhookSerializer,
        responses={200: PaymentSerializer},
        auth=[],
    ),
)
class PaymentWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PaymentWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = PaymentService.complete_webhook(serializer.validated_data['transaction_ref'])
        return Response(PaymentSerializer(payment).data)


@extend_schema_view(
    post=extend_schema(tags=[TAG_PAYMENTS], summary='Hoàn tiền', request=PaymentRefundSerializer, responses={200: PaymentSerializer}),
)
class PaymentRefundView(APIView):
    permission_classes = [IsManager]

    def post(self, request, pk):
        payment = get_object_or_404(PaymentService.get_payments_for_user(request.user), pk=pk)
        serializer = PaymentRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = PaymentService.refund(
            pk, serializer.validated_data['amount'], serializer.validated_data.get('reason', ''), request.user,
        )
        return Response(PaymentSerializer(payment).data)


@extend_schema_view(
    get=extend_schema(
        tags=[TAG_INVOICES],
        summary='Danh sách hóa đơn',
        parameters=[PARAM_PAGE, PARAM_PAGE_SIZE, OpenApiParameter(name='booking_id', type=str, location=OpenApiParameter.QUERY)],
        responses={200: InvoiceSerializer(many=True)},
    ),
    post=extend_schema(tags=[TAG_INVOICES], summary='Tạo hóa đơn từ booking', request=InvoiceCreateSerializer, responses={201: InvoiceSerializer}),
)
class InvoiceListCreateView(APIView):
    permission_classes = [IsManagerOrReceptionist]

    def get(self, request):
        qs = Invoice.objects.select_related('booking').filter(is_active=True)
        booking_id = request.query_params.get('booking_id')
        if booking_id:
            qs = qs.filter(booking_id=booking_id)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs.order_by('-issued_at'), request)
        return paginator.get_paginated_response(InvoiceSerializer(page, many=True).data)

    def post(self, request):
        serializer = InvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = PaymentService.create_invoice(serializer.validated_data['booking_id'])
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(tags=[TAG_INVOICES], summary='Chi tiết hóa đơn', responses={200: InvoiceSerializer}),
)
class InvoiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        invoice = get_object_or_404(Invoice.objects.select_related('booking'), pk=pk)
        if request.user.role == 'customer' and invoice.booking.customer_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return Response(InvoiceSerializer(invoice).data)
