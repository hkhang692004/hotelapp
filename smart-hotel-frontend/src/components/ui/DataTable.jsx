import { Spinner } from './Spinner'

export function DataTable({ columns, rows, loading, onRowClick, emptyTitle = 'Không có dữ liệu' }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!rows?.length) {
    return (
      <div
        className="rounded-2xl bg-white px-6 py-14 text-center"
        style={{ border: '1px solid #e2e8f0' }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyTitle}</p>
        <p className="mt-1 text-xs text-slate-400">Chưa có dữ liệu để hiển thị</p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl bg-white"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: '#64748b' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`transition-colors duration-100 ${onRowClick ? 'cursor-pointer' : ''}`}
              style={{
                borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none',
              }}
              onMouseEnter={onRowClick ? (e) => { e.currentTarget.style.background = '#fafbff' } : undefined}
              onMouseLeave={onRowClick ? (e) => { e.currentTarget.style.background = '' } : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-5 py-3.5 text-slate-700"
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
