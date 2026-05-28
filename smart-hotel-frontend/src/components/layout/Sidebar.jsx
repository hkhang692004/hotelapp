import { NavLink } from 'react-router-dom'
import { Hotel, ChevronRight } from 'lucide-react'
import { getNavForUser } from '../../utils/navigation'

export function Sidebar({ user }) {
  const items = getNavForUser(user)

  return (
    <aside
      style={{
        background: 'linear-gradient(180deg, #0a0f1e 0%, #0f172a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
      className="flex h-screen w-64 flex-col sticky top-0"
    >
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
        >
          <Hotel className="h-4.5 w-4.5" style={{ width: '18px', height: '18px' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-tight">Smart Hotel</p>
          <p className="text-xs" style={{ color: 'rgba(148,163,184,0.8)' }}>Quản trị vận hành</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          if (item.external) {
            return (
              <a
                key={item.path}
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 group"
                style={{ color: 'rgba(148,163,184,0.85)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(148,163,184,0.85)'
                }}
              >
                <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span className="flex-1">{item.label}</span>
                <ChevronRight style={{ width: '12px', height: '12px', opacity: 0.5 }} />
              </a>
            )
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                  isActive ? 'nav-active' : 'nav-default'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                color: '#a5b4fc',
                boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.3)',
              } : {
                color: 'rgba(148,163,184,0.85)',
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('nav-active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(148,163,184,0.85)'
                }
              }}
            >
              <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.full_name || 'Người dùng'}</p>
            <p className="truncate text-xs" style={{ color: 'rgba(100,116,139,0.9)' }}>{user?.role || ''}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
