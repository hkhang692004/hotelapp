export function EmptyState({ title, description, icon }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center"
      style={{ border: '1.5px dashed #cbd5e1' }}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}
      >
        {icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 9h6M9 13h4" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-slate-400 max-w-xs">{description}</p>
      )}
    </div>
  )
}
