import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCustomers, fetchCustomerBookings } from '../../api/customers'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Pagination } from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { getErrorMessage } from '../../hooks/useAsync'
import { formatDate, formatDateTime, formatMoney } from '../../utils/format'
import { BOOKING_STATUS } from '../../utils/status'

export function CustomersPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [bookings, setBookings] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchCustomers({ page, page_size: 20, search })
      setRows(result.items)
      setMeta(result.meta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  async function openCustomer(customer) {
    setSelected(customer)
    try {
      const data = await fetchCustomerBookings(customer.id)
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      setBookings([])
    }
  }

  const columns = [
    { key: 'full_name', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Điện thoại' },
    { key: 'date_joined', label: 'Ngày tạo', render: (r) => formatDateTime(r.date_joined) },
  ]

  return (
    <>
      <Header title="Khách hàng" subtitle="Danh sách khách và lịch sử đặt phòng" />
      <div className="flex-1 space-y-6 p-8">
        <Input
          label="Tìm kiếm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Tên hoặc email"
        />
        {error && <Alert>{error}</Alert>}
        <DataTable columns={columns} rows={rows} loading={loading} onRowClick={openCustomer} />
        <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.full_name} wide>
        {selected && (
          <div className="space-y-6">
            <Card>
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <div><span className="text-slate-500">Email: </span>{selected.email}</div>
                <div><span className="text-slate-500">Phone: </span>{selected.phone || '—'}</div>
              </dl>
            </Card>
            <div>
              <h4 className="mb-3 font-medium text-slate-900">Booking</h4>
              {bookings.length ? bookings.map((b) => (
                <Link key={b.id} to={`/bookings/${b.id}`} className="mb-2 block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{b.booking_code}</span>
                    <StatusBadge map={BOOKING_STATUS} value={b.status} />
                  </div>
                  <p className="text-slate-500">{formatDate(b.check_in_date)} → {formatDate(b.check_out_date)} · {formatMoney(b.total_amount)}</p>
                </Link>
              )) : <p className="text-sm text-slate-500">Chưa có booking</p>}
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
