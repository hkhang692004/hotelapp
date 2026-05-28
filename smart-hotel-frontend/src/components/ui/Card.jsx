export function Card({ title, description, children, action, className = '' }) {
  return (
    <section
      className={`rounded-2xl bg-white ${className}`}
      style={{
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06), 0 0 0 0 transparent',
      }}
    >
      {(title || action) && (
        <div
          className="flex items-start justify-between gap-4 px-6 py-4"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <div>
            {title && (
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={title || action ? 'p-6' : 'p-6'}>
        {children}
      </div>
    </section>
  )
}
