import { LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleLabel } from '../../utils/roles'

export function Header({ title, subtitle }) {
  const { user, logout } = useAuth()
  const initials = user?.full_name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'U'

  return (
    <header
      className="flex items-center justify-between px-8 py-4 bg-white"
      style={{
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}
    >
      <div className="animate-fade-in">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell style={{ width: '18px', height: '18px' }} />
        </button>

        <div
          className="h-7 w-px"
          style={{ background: '#e2e8f0' }}
        />

        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initials}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-800 leading-tight">{user?.full_name}</p>
            <p className="text-xs text-slate-500 leading-tight">{getRoleLabel(user)}</p>
          </div>
        </div>

        <div
          className="h-7 w-px"
          style={{ background: '#e2e8f0' }}
        />

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut style={{ width: '15px', height: '15px' }} />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
