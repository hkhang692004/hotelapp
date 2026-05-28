import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { fetchBookings } from '../../api/bookings'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { getErrorMessage } from '../../hooks/useAsync'
import { formatDate, formatMoney } from '../../utils/format'
import { BOOKING_STATUS } from '../../utils/status'
import { WalkInModal } from './WalkInModal'

export function BookingsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [walkInOpen, setWalkInOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchBookings({ page, page_size: 20, status, search })
      setRows(result.items)
      setMeta(result.meta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    {
      key: 'booking_code',
      label: 'Mã booking',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-indigo-600">{row.booking_code}</span>
      ),
    },
    { key: 'customer_name', label: 'Khách hàng' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge map={BOOKING_STATUS} value={row.status} />,
    },
    {
      key: 'check_in_date',
      label: 'Check-in',
      render: (row) => formatDate(row.check_in_date),
    },
    {
      key: 'check_out_date',
      label: 'Check-out',
      render: (row) => formatDate(row.check_out_date),
    },
    {
      key: 'total_amount',
      label: 'Tổng tiền',
      render: (row) => (
        <span className="font-semibold text-slate-800">{formatMoney(row.total_amount)}</span>
      ),
    },
  ]

  return (
    <>
      <Header title="Đặt phòng" subtitle="Quản lý booking, check-in và check-out" />
      <div className="flex-1 space-y-6 p-8 animate-fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <Input
                label="Tìm mã booking"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="BK-..."
              />
            </div>
            <div className="min-w-[160px]">
              <Select label="Trạng thái" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
                <option value="">Tất cả</option>
                {Object.keys(BOOKING_STATUS).map((key) => (
                  <option key={key} value={key}>{BOOKING_STATUS[key].label}</option>
                ))}
              </Select>
            </div>
            {(search || status) && (
              <div className="flex items-end">
                <Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setPage(1) }}>
                  <X style={{ width: '14px', height: '14px' }} />
                  Xóa lọc
                </Button>
              </div>
            )}
          </div>
          <Button onClick={() => setWalkInOpen(true)}>
            <Plus style={{ width: '15px', height: '15px' }} />
            Walk-in
          </Button>
        </div>

        {error && <Alert>{error}</Alert>}

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          onRowClick={(row) => navigate(`/bookings/${row.id}`)}
          emptyTitle="Không có booking nào"
        />
        <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
      </div>

      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSuccess={(booking) => {
          setWalkInOpen(false)
          navigate(`/bookings/${booking.id}`)
        }}
      />
    </>
  )
}
