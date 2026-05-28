import { useEffect, useState } from 'react'
import {
  fetchBookingStats,
  fetchOccupancy,
  fetchRevenue,
  fetchServiceStats,
} from '../../api/analytics'
import { Header } from '../../components/layout/Header'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { Tabs } from '../../components/ui/Tabs'
import { getErrorMessage } from '../../hooks/useAsync'
import { addDaysISO, formatMoney, todayISO } from '../../utils/format'

export function AnalyticsPage() {
  const [tab, setTab] = useState('revenue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('month')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [from, setFrom] = useState(todayISO())
  const [to, setTo] = useState(addDaysISO(todayISO(), 30))

  async function load() {
    setLoading(true)
    setError('')
    try {
      let result
      if (tab === 'revenue') {
        result = await fetchRevenue({ period, year, month })
      } else if (tab === 'occupancy') {
        result = await fetchOccupancy(from, to)
      } else if (tab === 'bookings') {
        result = await fetchBookingStats({ period: 'quarter', year })
      } else {
        result = await fetchServiceStats({ period, year, month })
      }
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [tab])

  const tabs = [
    { key: 'revenue', label: 'Doanh thu' },
    { key: 'occupancy', label: 'Công suất phòng' },
    { key: 'bookings', label: 'Booking' },
    { key: 'services', label: 'Dịch vụ' },
  ]

  return (
    <>
      <Header title="Báo cáo" subtitle="Phân tích doanh thu và vận hành" />
      <div className="flex-1 space-y-6 p-8">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        <div className="flex flex-wrap items-end gap-4">
          {tab === 'occupancy' ? (
            <>
              <Input label="Từ ngày" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label="Đến ngày" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          ) : (
            <>
              {tab !== 'bookings' && (
                <Select label="Kỳ" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="day">Ngày</option>
                  <option value="month">Tháng</option>
                  <option value="quarter">Quý</option>
                  <option value="year">Năm</option>
                </Select>
              )}
              <Input label="Năm" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              {(tab === 'revenue' || tab === 'services') && period === 'month' && (
                <Input label="Tháng" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} />
              )}
            </>
          )}
          <Button onClick={load}>Áp dụng</Button>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : data && (
          <div className="grid gap-6 lg:grid-cols-2">
            {tab === 'revenue' && (
              <>
                <Card title="Tổng doanh thu">
                  <p className="text-3xl font-semibold text-slate-900">{formatMoney(data.total_revenue)}</p>
                  <p className="mt-2 text-sm text-slate-500">Phòng: {formatMoney(data.room_revenue)} · Dịch vụ: {formatMoney(data.service_revenue)}</p>
                </Card>
                <Card title="Theo phương thức">
                  <div className="space-y-2 text-sm">
                    {Object.entries(data.payment_breakdown || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}</span>
                        <span>{formatMoney(v)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card title="Theo ngày" className="lg:col-span-2">
                  <div className="space-y-2">
                    {(data.daily || []).map((d) => (
                      <div key={d.date} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                        <span>{d.date}</span>
                        <span className="font-medium">{formatMoney(d.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {tab === 'occupancy' && (
              <>
                <Card title="Công suất phòng">
                  <p className="text-3xl font-semibold text-slate-900">{data.occupancy_rate}%</p>
                </Card>
                <Card title="Chi tiết">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Tổng phòng</span><span>{data.total_rooms}</span></div>
                    <div className="flex justify-between"><span>Đêm có khách</span><span>{data.occupied_room_nights}</span></div>
                    <div className="flex justify-between"><span>Đêm trống</span><span>{data.available_room_nights}</span></div>
                  </div>
                </Card>
              </>
            )}

            {tab === 'bookings' && (
              <>
                <Card title="Tổng booking">
                  <p className="text-3xl font-semibold text-slate-900">{data.total_bookings}</p>
                  <p className="mt-2 text-sm text-slate-500">Tỷ lệ hủy: {data.cancellation_rate}%</p>
                </Card>
                <Card title="Theo trạng thái">
                  <div className="space-y-2 text-sm">
                    {Object.entries(data.by_status || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {tab === 'services' && (
              <>
                <Card title="Doanh thu dịch vụ">
                  <p className="text-3xl font-semibold text-slate-900">{formatMoney(data.total_service_revenue)}</p>
                </Card>
                <Card title="Top dịch vụ">
                  <div className="space-y-2 text-sm">
                    {(data.top_services || []).map((s) => (
                      <div key={s.service_name} className="flex justify-between gap-4">
                        <span>{s.service_name}</span>
                        <span>{formatMoney(s.revenue)} · {s.order_count} đơn</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
