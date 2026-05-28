export function Badge({ children, tone = 'default', dot = false }) {
  const tones = {
    default: {
      background: '#f1f5f9',
      color: '#475569',
      dotColor: '#94a3b8',
    },
    success: {
      background: 'rgba(16,185,129,0.1)',
      color: '#059669',
      dotColor: '#10b981',
    },
    warning: {
      background: 'rgba(245,158,11,0.1)',
      color: '#d97706',
      dotColor: '#f59e0b',
    },
    danger: {
      background: 'rgba(239,68,68,0.1)',
      color: '#dc2626',
      dotColor: '#ef4444',
    },
    info: {
      background: 'rgba(99,102,241,0.1)',
      color: '#4f46e5',
      dotColor: '#6366f1',
    },
  }

  const style = tones[tone] || tones.default

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: style.background,
        color: style.color,
      }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: style.dotColor }}
        />
      )}
      {children}
    </span>
  )
}
