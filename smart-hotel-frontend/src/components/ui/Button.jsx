export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 select-none'

  const sizes = {
    sm: 'rounded-lg px-3 py-1.5 text-xs',
    md: 'rounded-xl px-4 py-2.5 text-sm',
    lg: 'rounded-xl px-5 py-3 text-sm',
  }

  const variants = {
    primary: 'text-white shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    danger: 'text-white shadow-sm',
  }

  const gradients = {
    primary: {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      boxShadow: '0 2px 8px rgba(239,68,68,0.35)',
    },
  }

  const handleMouseEnter = (e) => {
    if (disabled) return
    if (variant === 'primary') {
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.5)'
      e.currentTarget.style.transform = 'translateY(-1px)'
    } else if (variant === 'danger') {
      e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.5)'
      e.currentTarget.style.transform = 'translateY(-1px)'
    }
  }

  const handleMouseLeave = (e) => {
    if (variant === 'primary' || variant === 'danger') {
      e.currentTarget.style.boxShadow = gradients[variant]?.boxShadow || ''
      e.currentTarget.style.transform = ''
    }
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant]} ${className}`}
      style={gradients[variant] || {}}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  )
}
