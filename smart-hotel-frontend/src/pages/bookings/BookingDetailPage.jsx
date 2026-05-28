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
import { fetchPayments, createPayment, createInvoice } from '../../api/payments'
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
import { BOOKING_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SERVICE_ORDER_STATUS } from '../../utils/status'
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
  const [serviceOpen, setServiceOpen] = useState(false)
  const [services, setServices] = useState([])
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash' })
  const [serviceForm, setServiceForm] = useState({ service_id: '', quantity: 1 })

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
      setPaymentForm((prev) => ({ ...prev, amount: String(b.total_amount || '') }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function runAction(action) {
    setActionError('')
    try {
      if (action === 'confirm') await confirmBooking(id)
      if (action === 'checkin') await checkInBooking(id)
      if (action === 'checkout') await checkOutBooking(id)
      if (action === 'cancel') await cancelBooking(id, 'Hủy từ web')
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function handlePayment(e) {
    e.preventDefault()
    setActionError('')
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
    }
  }

  async function handleServiceOrder(e) {
    e.preventDefault()
    setActionError('')
    try {
      await createServiceOrder({
        booking_id: id,
        items: [{ service_id: serviceForm.service_id, quantity: Number(serviceForm.quantity) }],
      })
      setServiceOpen(false)
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  async function handleInvoice() {
    setActionError('')
    try {
      await createInvoice(id)
      await load()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (serviceOpen) {
      fetchServices({ is_active: true }).then(setServices).catch(() => {})
    }
  }, [serviceOpen])

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
              <Button onClick={() => runAction('checkin')}>
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
            <Button variant="secondary" onClick={() => setPaymentOpen(true)}>
              <CreditCard style={{ width: '14px', height: '14px' }} />
              Thanh toán
            </Button>
            <Button variant="secondary" onClick={() => setServiceOpen(true)}>
              <Plus style={{ width: '14px', height: '14px' }} />
              Thêm dịch vụ
            </Button>
            {hasRole(user, ['manager', 'receptionist']) && (
              <Button variant="secondary" onClick={handleInvoice}>
                <FileText style={{ width: '14px', height: '14px' }} />
                Tạo hóa đơn
              </Button>
            )}
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
                <InfoRow label="Tổng tiền" value={formatMoney(booking.total_amount)} bold />
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
          <Input label="Số tiền" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
          <Select label="Phương thức" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
            <option value="cash">Tiền mặt</option>
            <option value="vnpay">VNPay</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentOpen(false)}>Hủy</Button>
            <Button type="submit">Xác nhận thanh toán</Button>
          </div>
        </form>
      </Modal>

      <Modal open={serviceOpen} onClose={() => setServiceOpen(false)} title="Thêm dịch vụ">
        <form className="space-y-4" onSubmit={handleServiceOrder}>
          <Select label="Dịch vụ" value={serviceForm.service_id} onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })} required>
            <option value="">Chọn dịch vụ</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {formatMoney(s.price)}</option>
            ))}
          </Select>
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
