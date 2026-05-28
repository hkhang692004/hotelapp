import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`animate-scale-in max-h-[90vh] w-full overflow-auto rounded-2xl bg-white ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.06)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
