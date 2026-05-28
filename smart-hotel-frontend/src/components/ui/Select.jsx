export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all duration-150 ${
          error
            ? 'border-red-300 ring-2 ring-red-100'
            : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
