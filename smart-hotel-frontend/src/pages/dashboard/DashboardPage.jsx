import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BedDouble, CalendarDays, ClipboardList, CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react'
import { fetchBookings } from '../../api/bookings'
import { fetchDashboard } from '../../api/analytics'
import { Header } from '../../components/layout/Header'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { formatMoney } from '../../utils/format'
import { hasRole } from '../../utils/roles'

const CARD_GRADIENTS = [
  { from: '#6366f1', to: '#8b5cf6', shadow: 'rgba(99,102,241,0.3)' },
  { from: '#06b6d4', to: '#0284c7', shadow: 'rgba(6,182,212,0.3)' },
  { from: '#10b981', to: '#059669', shadow: 'rgba(16,185,129,0.3)' },
  { from: '#f59e0b', to: '#d97706', shadow: 'rgba(245,158,11,0.3)' },
  { from: '#ec4899', to: '#db2777', shadow: 'rgba(236,72,153,0.3)' },
  { from: '#8b5cf6', to: '#6d28d9', shadow: 'rgba(139,92,246,0.3)' },
  { from: '#14b8a6', to: '#0d9488', shadow: 'rgba(20,184,166,0.3)' },
]

function StatCard({ icon: Icon, label, value, hint, to, colorIdx = 0 }) {
  const grad = CARD_GRADIENTS[colorIdx % CARD_GRADIENTS.length]

  const content = (
    <div
      className="group rounded-2xl bg-white p-5 transition-all duration-200"
      style={{
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${grad.shadow}, 0 1px 4px rgba(15,23,42,0.06)`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.06)'
        e.currentTarget.style.transform = ''
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p
            className="mt-2 text-2xl font-bold text-slate-900 tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
              boxShadow: `0 4px 12px ${grad.shadow}`,
            }}
          >
            <Icon style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          {to && (
            <ArrowUpRight
              style={{ width: '14px', height: '14px', color: '#94a3b8' }}
              className="transition-all duration-150 group-hover:text-indigo-500"
            />
          )}
        </div>
      </div>
    </div>
  )

  return to ? (
    <Link to={to} className="block no-underline">
      {content}
    </Link>
  ) : content
}

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        if (hasRole(user, ['manager'])) {
          setStats(await fetchDashboard())
        } else {
          const pending = await fetchBookings({ status: 'pending', page_size: 1 })
          setPendingCount(pending.meta?.total_count || 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return (
    <>
      <Header title="Tổng quan" subtitle="Theo dõi hoạt động vận hành khách sạn" />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-slate-400">Đang tải dữ liệu…</p>
          </div>
        ) : hasRole(user, ['manager']) && stats ? (
          <>
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Hoạt động hôm nay
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={TrendingUp} label="Doanh thu hôm nay" value={formatMoney(stats.today_revenue)} colorIdx={0} />
                <StatCard icon={CalendarDays} label="Check-in hôm nay" value={stats.today_check_ins ?? 0} to="/bookings" colorIdx={1} />
                <StatCard icon={BedDouble} label="Phòng trống" value={stats.rooms_available ?? 0} hint={`${stats.rooms_occupied ?? 0} đang sử dụng`} to="/rooms" colorIdx={2} />
                <StatCard icon={CreditCard} label="Booking chờ" value={stats.pending_bookings ?? 0} to="/bookings" colorIdx={3} />
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Vận hành
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={CalendarDays} label="Check-out hôm nay" value={stats.today_check_outs ?? 0} colorIdx={4} />
                <StatCard icon={ClipboardList} label="Task dọn phòng" value={stats.pending_housekeeping_tasks ?? 0} to="/housekeeping" colorIdx={5} />
                <StatCard icon={BedDouble} label="Phòng đang dọn" value={stats.rooms_cleaning ?? 0} colorIdx={6} />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Truy cập nhanh
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={CreditCard} label="Booking chờ xác nhận" value={pendingCount} to="/bookings" colorIdx={3} />
              <StatCard icon={CalendarDays} label="Đặt phòng" value="→" hint="Tạo walk-in, check-in/out" to="/bookings" colorIdx={1} />
              <StatCard icon={BedDouble} label="Phòng" value="→" hint="Theo dõi trạng thái phòng" to="/rooms" colorIdx={2} />
              <StatCard icon={ClipboardList} label="Dọn phòng" value="→" hint="Phân công task" to="/housekeeping" colorIdx={5} />
            </div>
          </>
        )}
      </div>
    </>
  )
}
