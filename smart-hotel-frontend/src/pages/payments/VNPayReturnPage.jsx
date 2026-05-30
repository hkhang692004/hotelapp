import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { BOOKING_PAYMENT_STATUS } from '../../utils/status'

export function VNPayReturnPage() {
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success') === '1'
  const error = searchParams.get('error')
  const bookingId = searchParams.get('booking_id')
  const bookingCode = searchParams.get('booking_code')
  const message = searchParams.get('message')
  const paymentStatus = searchParams.get('payment_status')

  const paymentMeta = paymentStatus ? BOOKING_PAYMENT_STATUS[paymentStatus] : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-4 text-center">
          {error === 'checksum' && (
            <Alert>Sai chữ ký VNPay. Kiểm tra VNPAY_HASH_SECRET trong .env và Return URL đã đăng ký trên Merchant Admin.</Alert>
          )}
          {error === 'processing' && (
            <Alert>Không xử lý được kết quả thanh toán. Liên hệ lễ tân để đối soát.</Alert>
          )}

          <h1 className="text-lg font-semibold text-slate-900">
            {success ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
          </h1>

          {success && bookingCode && (
            <p className="text-sm text-slate-600">
              Mã booking: <span className="font-medium">{bookingCode}</span>
            </p>
          )}

          {success && paymentMeta && (
            <p className="text-sm text-slate-600">
              Trạng thái booking: <span className="font-medium">{paymentMeta.label}</span>
            </p>
          )}

          {message && (
            <p className="text-sm text-slate-600">{message}</p>
          )}

          {bookingId && (
            <Link to={`/bookings/${bookingId}`}>
              <Button className="w-full">Xem booking</Button>
            </Link>
          )}

          <Link to="/payments" className="block text-sm text-indigo-600 hover:text-indigo-700">
            Danh sách thanh toán
          </Link>
        </div>
      </div>
    </div>
  )
}
