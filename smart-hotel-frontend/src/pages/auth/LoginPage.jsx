import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hotel, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Email hoặc mật khẩu không đúng')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2" style={{ background: '#f8faff' }}>
      <section
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{
          background: 'linear-gradient(145deg, #0a0f1e 0%, #0f172a 40%, #1a1040 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139,92,246,0.3) 0%, transparent 50%)`,
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
            }}
          >
            <Hotel style={{ width: '20px', height: '20px', color: '#fff' }} />
          </div>
          <div>
            <p className="text-base font-semibold text-white tracking-tight">Smart Hotel</p>
            <p className="text-xs" style={{ color: 'rgba(148,163,184,0.7)' }}>Hệ thống quản lý khách sạn</p>
          </div>
        </div>

        <div className="relative max-w-md">

          <h1 className="text-4xl font-bold leading-tight text-white tracking-tight">
            Vận hành khách sạn{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              thông minh hơn
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: 'rgba(148,163,184,0.8)' }}>
            Quản lý đặt phòng, thanh toán, dọn phòng và báo cáo — tất cả trong một nền tảng.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '< 0.5s', label: 'Phản hồi' },
              { value: '24/7', label: 'Hỗ trợ' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <section
        className="flex items-center justify-center px-6 py-12"
        style={{ background: '#f8faff' }}
      >
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              <Hotel style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Smart Hotel</p>
              <p className="text-xs text-slate-500">Đăng nhập hệ thống</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại</h2>
            <p className="mt-1.5 text-sm text-slate-500">Đăng nhập để tiếp tục quản lý khách sạn của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reception@hotel.com"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="login-password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderLeft: '3px solid #ef4444',
                  color: '#dc2626',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-px flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: submitting ? '#818cf8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.55)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'
                e.currentTarget.style.transform = ''
              }}
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Đang đăng nhập…
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight style={{ width: '15px', height: '15px' }} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Dành cho lễ tân, quản lý và quản trị viên
          </p>
        </div>
      </section>
    </div>
  )
}
