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

function toNumber(value) {
  if (typeof value === 'number') return value
  if (value == null) return 0
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw.replace(/[^0-9.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function MiniLineChart({ points = [], stroke = '#6366f1', fill = 'rgba(99,102,241,0.14)' }) {
  if (!points.length) {
    return <p className="text-sm text-slate-400">Chưa có dữ liệu để vẽ biểu đồ</p>
  }

  const width = 860
  const height = 240
  const padding = 24
  const values = points.map((p) => p.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const isSinglePoint = points.length === 1
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0

  const path = points.map((p, i) => {
    const x = padding + i * xStep
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPath = `${padding},${height - padding} ${path} ${padding + (points.length - 1) * xStep},${height - padding}`
  const singleX = width / 2
  const singleY = height - padding - ((points[0].value - min) / range) * (height - padding * 2)

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible rounded-xl bg-slate-50 p-2">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#dbe2ea" strokeWidth="1" />
        {isSinglePoint ? (
          <>
            <line x1={singleX} y1={height - padding} x2={singleX} y2={singleY} stroke={stroke} strokeWidth="3" strokeLinecap="round" />
            <circle cx={singleX} cy={singleY} r="5" fill={stroke} />
          </>
        ) : (
          <>
            <polyline points={areaPath} fill={fill} stroke="none" />
            <polyline points={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {points.map((p) => (
          <span key={p.label}>{p.label}: <span className="font-medium text-slate-700">{formatMoney(p.value)}</span></span>
        ))}
      </div>
    </div>
  )
}

function HorizontalBarChart({ rows = [], emptyText = 'Chưa có dữ liệu' }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-400">{emptyText}</p>
  }

  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const percent = Math.max(4, Math.round((row.value / max) * 100))
        return (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-medium text-slate-900">{row.display}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${percent}%`,
                  background: '#4f46e5',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AnalyticsPage() {
  const [tab, setTab] = useState('revenue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('month')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [quarter, setQuarter] = useState('1')
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [from, setFrom] = useState(todayISO())
  const [to, setTo] = useState(addDaysISO(todayISO(), 30))

  async function load() {
    setLoading(true)
    setError('')
    try {
      let result
      if (tab === 'revenue') {
        result = await fetchRevenue({
          period,
          year,
          month: period === 'month' ? month : undefined,
          quarter: period === 'quarter' ? quarter : undefined,
          date: period === 'day' ? selectedDate : undefined,
        })
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
              {tab === 'revenue' && period === 'quarter' && (
                <Select label="Quý" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                  <option value="1">Quý 1</option>
                  <option value="2">Quý 2</option>
                  <option value="3">Quý 3</option>
                  <option value="4">Quý 4</option>
                </Select>
              )}
              {tab === 'revenue' && period === 'day' && (
                <Input label="Ngày" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
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
                  <HorizontalBarChart
                    rows={Object.entries(data.payment_breakdown || {}).map(([k, v]) => ({
                      label: k,
                      value: toNumber(v),
                      display: formatMoney(v),
                    }))}
                    emptyText="Chưa có thanh toán theo phương thức"
                  />
                </Card>
                {period !== 'day' && (
                  <Card
                    title={
                      period === 'month'
                        ? 'Biểu đồ doanh thu theo ngày'
                        : period === 'quarter'
                        ? 'Biểu đồ doanh thu theo tháng trong quý'
                        : 'Biểu đồ doanh thu theo tháng'
                    }
                    className="lg:col-span-2"
                  >
                    <MiniLineChart points={(data.daily || []).map((d) => ({ label: d.date, value: toNumber(d.revenue) }))} />
                  </Card>
                )}
              </>
            )}

            {tab === 'occupancy' && (
              <>
                <Card title="Công suất phòng">
                  <p className="text-3xl font-semibold text-slate-900">{data.occupancy_rate}%</p>
                  <div className="mt-4 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(data.occupancy_rate || 0) * 100))}%`,
                        background: '#0ea5a4',
                      }}
                    />
                  </div>
                </Card>
                <Card title="Chi tiết">
                  <HorizontalBarChart
                    rows={[
                      {
                        label: 'Đêm có khách',
                        value: toNumber(data.occupied_room_nights),
                        display: String(data.occupied_room_nights ?? 0),
                      },
                      {
                        label: 'Đêm trống',
                        value: toNumber(data.available_room_nights),
                        display: String(data.available_room_nights ?? 0),
                      },
                    ]}
                  />
                  <p className="mt-3 text-xs text-slate-500">Tổng phòng: {data.total_rooms}</p>
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
                  <HorizontalBarChart
                    rows={Object.entries(data.by_status || {}).map(([k, v]) => ({
                      label: k,
                      value: toNumber(v),
                      display: String(v),
                    }))}
                    emptyText="Chưa có booking"
                  />
                </Card>
              </>
            )}

            {tab === 'services' && (
              <>
                <Card title="Doanh thu dịch vụ">
                  <p className="text-3xl font-semibold text-slate-900">{formatMoney(data.total_service_revenue)}</p>
                </Card>
                <Card title="Top dịch vụ">
                  <HorizontalBarChart
                    rows={(data.top_services || []).map((s) => ({
                      label: s.service_name || 'Dịch vụ khác',
                      value: toNumber(s.revenue),
                      display: `${formatMoney(s.revenue)} · ${s.order_count} đơn`,
                    }))}
                    emptyText="Chưa có doanh thu dịch vụ"
                  />
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
