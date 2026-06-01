import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, LogIn, LogOut, XCircle, FileText, Plus, CreditCard } from 'lucide-react'
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  confirmBooking,
  fetchBooking,
  fetchBookingHistory,
  fetchBookingServiceOrders,
} from '../../api/bookings'
import { fetchPayments, createPayment } from '../../api/payments'
import { createServiceOrder, fetchServices } from '../../api/services'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Tabs } from '../../components/ui/Tabs'
import { getErrorMessage } from '../../hooks/useAsync'
import { formatDate, formatDateTime, formatMoney } from '../../utils/format'
import { BOOKING_PAYMENT_STATUS, BOOKING_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SERVICE_ORDER_STATUS } from '../../utils/status'
import { hasRole } from '../../utils/roles'
import { useAuth } from '../../contexts/AuthContext'

function InfoRow({ label, value, bold }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid #f8fafc' }}
    >
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{value}</span>
    </div>
  )
}

export function BookingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [payments, setPayments] = useState([])
  const [orders, setOrders] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [tab, setTab] = useState('overview')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkInSubmitting, setCheckInSubmitting] = useState(false)
  const [checkInForm, setCheckInForm] = useState({ national_id: '', address: '', note: '' })
  const [serviceOpen, setServiceOpen] = useState(false)
  const [services, setServices] = useState([])
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash' })
  const [serviceMode, setServiceMode] = useState('catalog')
  const [serviceForm, setServiceForm] = useState({
    service_id: '',
    quantity: 1,
    description: '',
    unit_price: '',
  })
  const isStaff = hasRole(user, ['manager', 'receptionist'])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [b, p, o, h] = await Promise.all([
        fetchBooking(id),
        fetchPayments({ booking_id: id }),
        fetchBookingServiceOrders(id),
        fetchBookingHistory(id),
      ])
      setBooking(b)
      setPayments(p.items || p)
      setOrders(Array.isArray(o) ? o : [])
      setHistory(Array.isArray(h) ? h : [])
      const remaining = b.remaining_balance ?? Math.max(Number(b.actual_total_amount || b.total_amount || 0) - Number(b.paid_amount || 0), 0)
      setPaymentForm((prev) => ({ ...prev, amount: String(remaining || b.total_amount || '') }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!checkInOpen || !booking) return
    const profile = booking.customer_guest_profile || {}
    setCheckInForm((prev) => ({
      ...prev,
      national_id: profile.national_id || prev.national_id,
      address: profile.address || prev.address,
      note: prev.note,
    }))
  }, [checkInOpen, booking])

  async function runAction(action) {
    setActionError('')
    try {
      if (action === 'confirm') await confirmBooking(id)
      if (action === 'checkout') await checkOutBooking(id)
      if (action === 'cancel') await cancelBooking(id, 'Hủy từ web')
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function handleCheckIn(e) {
    e.preventDefault()
    if (!checkInForm.national_id.trim() || !checkInForm.address.trim()) {
      setActionError('Cần nhập CCCD/Passport và địa chỉ lưu trú')
      return
    }
    setActionError('')
    setCheckInSubmitting(true)
    try {
      await checkInBooking(id, {
        note: checkInForm.note.trim(),
        national_id: checkInForm.national_id.trim(),
        address: checkInForm.address.trim(),
      })
      setCheckInOpen(false)
      setCheckInForm({ national_id: '', address: '', note: '' })
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setCheckInSubmitting(false)
    }
  }

  async function handlePayment(e) {
    e.preventDefault()
    setActionError('')
    setPaymentLoading(true)
    try {
      const payment = await createPayment({
        booking_id: id,
        amount: paymentForm.amount,
        method: paymentForm.method,
      })
      if (paymentForm.method === 'vnpay' && payment.payment_url) {
        window.location.href = payment.payment_url
        return
      }
      setPaymentOpen(false)
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setPaymentLoading(false)
    }
  }

  async function handleServiceOrder(e) {
    e.preventDefault()
    setActionError('')
    try {
      let item
      if (serviceMode === 'manual') {
        item = {
          description: serviceForm.description.trim(),
          unit_price: serviceForm.unit_price,
          quantity: Number(serviceForm.quantity),
        }
      } else {
        item = { service_id: serviceForm.service_id, quantity: Number(serviceForm.quantity) }
      }
      await createServiceOrder({
        booking_id: id,
        items: [item],
      })
      setServiceOpen(false)
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (serviceOpen) {
      const params = { is_active: true }
      if (isStaff) params.include_staff_only = true
      fetchServices(params).then(setServices).catch(() => {})
    }
  }, [serviceOpen, isStaff])

  if (loading) {
    return (
      <>
        <Header title="Chi tiết booking" />
        <div className="flex flex-1 flex-col items-center justify-center py-24 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-slate-400">Đang tải…</p>
        </div>
      </>
    )
  }

  if (error || !booking) {
    return (
      <>
        <Header title="Chi tiết booking" />
        <div className="p-8 space-y-4">
          <Alert>{error || 'Không tìm thấy booking'}</Alert>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            Quay lại danh sách
          </Link>
        </div>
      </>
    )
  }

  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'payments', label: 'Thanh toán' },
    { key: 'services', label: 'Dịch vụ' },
    { key: 'history', label: 'Lịch sử' },
  ]
  const lockedNationalId = Boolean(booking?.customer_guest_profile?.national_id)

  return (
    <>
      <Header
        title={booking.booking_code}
        subtitle={`${booking.customer?.full_name || booking.customer_name} · ${formatDate(booking.check_in_date)} → ${formatDate(booking.check_out_date)}`}
      />
      <div className="flex-1 space-y-6 p-8 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/bookings"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Danh sách
            </Link>
            <span className="text-slate-300">/</span>
            <StatusBadge map={BOOKING_STATUS} value={booking.status} dot />
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status === 'pending' && (
              <Button onClick={() => runAction('confirm')}>
                <CheckCircle style={{ width: '14px', height: '14px' }} />
                Xác nhận
              </Button>
            )}
            {booking.status === 'confirmed' && (
              <Button onClick={() => setCheckInOpen(true)}>
                <LogIn style={{ width: '14px', height: '14px' }} />
                Check-in
              </Button>
            )}
            {booking.status === 'checked_in' && (
              <Button onClick={() => runAction('checkout')}>
                <LogOut style={{ width: '14px', height: '14px' }} />
                Check-out
              </Button>
            )}
            {['pending', 'confirmed'].includes(booking.status) && (
              <Button variant="danger" onClick={() => runAction('cancel')}>
                <XCircle style={{ width: '14px', height: '14px' }} />
                Hủy booking
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => setPaymentOpen(true)}
              disabled={booking.status !== 'checked_out'}
              title={booking.status !== 'checked_out' ? 'Chỉ có thể thanh toán sau khi check-out' : 'Tạo thanh toán'}
            >
              <CreditCard style={{ width: '14px', height: '14px' }} />
              Thanh toán
            </Button>
            <Button variant="secondary" onClick={() => setServiceOpen(true)}>
              <Plus style={{ width: '14px', height: '14px' }} />
              Thêm dịch vụ
            </Button>
          </div>
        </div>

        {actionError && <Alert>{actionError}</Alert>}

        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'overview' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Thông tin booking">
              <div>
                <InfoRow label="Khách hàng" value={booking.customer?.full_name} />
                <InfoRow label="Email" value={booking.customer?.email} />
                <InfoRow label="Số đêm" value={booking.nights} />
                <InfoRow label="Người lớn / Trẻ em" value={`${booking.adults} / ${booking.children}`} />
                <InfoRow label="Tổng tiền" value={formatMoney(booking.actual_total_amount ?? booking.total_amount)} bold />
                <InfoRow label="Đã thanh toán" value={formatMoney(booking.paid_amount || 0)} />
                <InfoRow label="Còn nợ" value={formatMoney(booking.remaining_balance ?? 0)} bold />
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-500">Trạng thái thanh toán</span>
                  <StatusBadge map={BOOKING_PAYMENT_STATUS} value={booking.payment_status || 'unpaid'} dot />
                </div>
              </div>
            </Card>
            <Card title="Phòng đã đặt">
              <div className="space-y-3">
                {booking.rooms?.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-xl p-4"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      Phòng {room.room_number}
                      <span className="ml-2 font-normal text-slate-500">— {room.room_type_name}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatMoney(room.price_per_night)}/đêm × {room.nights} đêm
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-medium text-slate-700">{formatMoney(room.subtotal)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'payments' && (
          <Card title="Lịch sử thanh toán">
            {payments.length ? (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{PAYMENT_METHOD[p.method] || p.method}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(p.paid_at || p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge map={PAYMENT_STATUS} value={p.status} dot />
                      <span className="text-sm font-semibold text-slate-900">{formatMoney(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Chưa có thanh toán</p>
            )}
          </Card>
        )}

        {tab === 'services' && (
          <Card title="Đơn dịch vụ">
            {orders.length ? (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl p-4"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <StatusBadge map={SERVICE_ORDER_STATUS} value={o.status} dot />
                      <span className="text-sm font-semibold text-slate-900">{formatMoney(o.total_amount)}</span>
                    </div>
                    <div className="space-y-1">
                      {o.items?.map((item) => (
                        <p key={item.id} className="text-sm text-slate-600">
                          {item.service_name}
                          <span className="ml-1.5 text-slate-400">× {item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Chưa có đơn dịch vụ</p>
            )}
          </Card>
        )}

        {tab === 'history' && (
          <Card title="Lịch sử trạng thái">
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-xl p-4"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                >
                  <div
                    className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', marginTop: '6px' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {item.from_status || '—'} → {item.to_status}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.changed_by_name} · {formatDateTime(item.changed_at)}
                    </p>
                    {item.note && <p className="mt-1 text-sm text-slate-600">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Tạo thanh toán">
        <form className="space-y-4" onSubmit={handlePayment}>
          <Input label="Số tiền" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required disabled={paymentLoading} />
          <Select label="Phương thức" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} disabled={paymentLoading}>
            <option value="cash">Tiền mặt</option>
            <option value="vnpay">VNPay</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentOpen(false)} disabled={paymentLoading}>Hủy</Button>
            <Button type="submit" disabled={paymentLoading}>{paymentLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={checkInOpen} onClose={() => setCheckInOpen(false)} title="Check-in và cập nhật hồ sơ lưu trú">
        <form className="space-y-4" onSubmit={handleCheckIn}>
          <Input
            label="CCCD / Passport"
            value={checkInForm.national_id}
            onChange={(e) => setCheckInForm({ ...checkInForm, national_id: e.target.value })}
            required
            disabled={checkInSubmitting || lockedNationalId}
          />
          {lockedNationalId ? <p className="text-xs text-slate-500">CCCD đã liên kết với tài khoản này nên không thể chỉnh sửa.</p> : null}
          <Input
            label="Địa chỉ"
            value={checkInForm.address}
            onChange={(e) => setCheckInForm({ ...checkInForm, address: e.target.value })}
            required
            disabled={checkInSubmitting}
          />
          <Input
            label="Ghi chú (không bắt buộc)"
            value={checkInForm.note}
            onChange={(e) => setCheckInForm({ ...checkInForm, note: e.target.value })}
            disabled={checkInSubmitting}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCheckInOpen(false)}
              disabled={checkInSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={checkInSubmitting}>
              {checkInSubmitting ? 'Đang check-in...' : 'Xác nhận check-in'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={serviceOpen} onClose={() => setServiceOpen(false)} title="Thêm dịch vụ">
        <form className="space-y-4" onSubmit={handleServiceOrder}>
          {isStaff && (
            <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm ${serviceMode === 'catalog' ? 'bg-white font-medium shadow-sm' : 'text-slate-600'}`}
                onClick={() => setServiceMode('catalog')}
              >
                Chọn từ danh mục
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm ${serviceMode === 'manual' ? 'bg-white font-medium shadow-sm' : 'text-slate-600'}`}
                onClick={() => setServiceMode('manual')}
              >
                Nhập thủ công
              </button>
            </div>
          )}
          {serviceMode === 'manual' && isStaff ? (
            <>
              <Input
                label="Mô tả (tiền cọc, minibar, hư hỏng…)"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                required
              />
              <Input
                label="Đơn giá (VND)"
                type="number"
                min="0"
                value={serviceForm.unit_price}
                onChange={(e) => setServiceForm({ ...serviceForm, unit_price: e.target.value })}
                required
              />
            </>
          ) : (
            <Select
              label="Dịch vụ"
              value={serviceForm.service_id}
              onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
              required
            >
              <option value="">Chọn dịch vụ</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.is_staff_only ? ' (nội bộ)' : ''} — {formatMoney(s.price)}
                </option>
              ))}
            </Select>
          )}
          <Input label="Số lượng" type="number" min="1" value={serviceForm.quantity} onChange={(e) => setServiceForm({ ...serviceForm, quantity: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setServiceOpen(false)}>Hủy</Button>
            <Button type="submit">Thêm dịch vụ</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
