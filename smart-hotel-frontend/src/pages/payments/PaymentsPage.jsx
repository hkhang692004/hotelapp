import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchInvoices, fetchPayments, refundPayment } from '../../api/payments'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Tabs } from '../../components/ui/Tabs'
import { useAuth } from '../../contexts/AuthContext'
import { getErrorMessage } from '../../hooks/useAsync'
import { formatDateTime, formatMoney } from '../../utils/format'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../../utils/status'
import { hasRole } from '../../utils/roles'

export function PaymentsPage() {
  const { user } = useAuth()
  const isManager = hasRole(user, ['manager'])
  const [tab, setTab] = useState('payments')
  const [rows, setRows] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [status, setStatus] = useState('')
  const [refundTarget, setRefundTarget] = useState(null)
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'payments') {
        const result = await fetchPayments({ page, page_size: 20, status })
        setRows(result.items)
        setMeta(result.meta)
      } else {
        const result = await fetchInvoices({ page, page_size: 20 })
        setInvoices(result.items)
        setMeta(result.meta)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tab, page, status])

  useEffect(() => {
    load()
  }, [load])

  async function handleRefund(e) {
    e.preventDefault()
    setError('')
    try {
      await refundPayment(refundTarget.id, refundForm)
      setRefundTarget(null)
      setRefundForm({ amount: '', reason: '' })
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const paymentColumns = [
    { key: 'booking_code', label: 'Booking', render: (r) => <Link to={`/bookings/${r.booking_id}`} className="text-brand-600 hover:underline">{r.booking_code}</Link> },
    { key: 'method', label: 'Phương thức', render: (r) => PAYMENT_METHOD[r.method] || r.method },
    { key: 'status', label: 'Trạng thái', render: (r) => <StatusBadge map={PAYMENT_STATUS} value={r.status} /> },
    { key: 'amount', label: 'Số tiền', render: (r) => formatMoney(r.amount) },
    { key: 'paid_at', label: 'Thời gian', render: (r) => formatDateTime(r.paid_at || r.created_at) },
    ...(isManager ? [{
      key: 'actions',
      label: '',
      render: (r) => r.status === 'completed' ? (
        <Button variant="ghost" onClick={() => { setRefundTarget(r); setRefundForm({ amount: String(r.amount), reason: '' }) }}>Hoàn tiền</Button>
      ) : null,
    }] : []),
  ]

  const invoiceColumns = [
    { key: 'invoice_number', label: 'Số HĐ' },
    { key: 'booking_code', label: 'Booking' },
    { key: 'total', label: 'Tổng', render: (r) => formatMoney(r.total) },
    { key: 'issued_at', label: 'Ngày phát hành', render: (r) => formatDateTime(r.issued_at) },
  ]

  return (
    <>
      <Header title="Thanh toán" subtitle="Quản lý thanh toán và hóa đơn" />
      <div className="flex-1 space-y-6 p-8">
        <Tabs
          tabs={[
            { key: 'payments', label: 'Thanh toán' },
            { key: 'invoices', label: 'Hóa đơn' },
          ]}
          active={tab}
          onChange={(key) => { setTab(key); setPage(1) }}
        />

        <div className="flex flex-wrap items-end justify-between gap-4">
          {tab === 'payments' && (
            <Select label="Trạng thái" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">Tất cả</option>
              {Object.keys(PAYMENT_STATUS).map((s) => (
                <option key={s} value={s}>{PAYMENT_STATUS[s].label}</option>
              ))}
            </Select>
          )}
        </div>

        {error && <Alert>{error}</Alert>}

        {tab === 'payments' ? (
          <DataTable columns={paymentColumns} rows={rows} loading={loading} />
        ) : (
          <DataTable columns={invoiceColumns} rows={invoices} loading={loading} />
        )}
        <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
      </div>

      <Modal open={Boolean(refundTarget)} onClose={() => setRefundTarget(null)} title="Hoàn tiền">
        <form className="space-y-4" onSubmit={handleRefund}>
          <Input label="Số tiền hoàn" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })} required />
          <Input label="Lý do" value={refundForm.reason} onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setRefundTarget(null)}>Hủy</Button>
            <Button type="submit" variant="danger">Hoàn tiền</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
