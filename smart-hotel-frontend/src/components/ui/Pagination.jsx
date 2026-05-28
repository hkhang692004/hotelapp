import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  const pages = []
  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)

  for (let i = left; i <= right; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between gap-4 pt-5">
      <p className="text-xs text-slate-500">
        Trang <span className="font-medium text-slate-700">{page}</span> / {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ border: '1px solid #e2e8f0' }}
        >
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
        </button>

        {left > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-600 transition-all duration-150 hover:bg-white hover:shadow-sm"
              style={{ border: '1px solid #e2e8f0' }}
            >
              1
            </button>
            {left > 2 && <span className="px-1 text-slate-400 text-sm">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all duration-150"
            style={
              p === page
                ? {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                    border: 'none',
                  }
                : {
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                  }
            }
            onMouseEnter={(e) => {
              if (p !== page) e.currentTarget.style.background = '#fff'
            }}
            onMouseLeave={(e) => {
              if (p !== page) e.currentTarget.style.background = ''
            }}
          >
            {p}
          </button>
        ))}

        {right < totalPages && (
          <>
            {right < totalPages - 1 && <span className="px-1 text-slate-400 text-sm">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-600 transition-all duration-150 hover:bg-white hover:shadow-sm"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ border: '1px solid #e2e8f0' }}
        >
          <ChevronRight style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  )
}
