export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <input
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all duration-150 placeholder:text-slate-400 ${
          error
            ? 'border-red-300 ring-2 ring-red-100'
            : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
        } ${className}`}
        style={{
          '--tw-ring-color': error ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
        }}
        {...props}
      />
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
