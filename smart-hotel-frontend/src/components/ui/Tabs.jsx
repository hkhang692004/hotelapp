export function Tabs({ tabs, active, onChange }) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl w-fit"
      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150"
          style={
            active === tab.key
              ? {
                  background: '#fff',
                  color: '#4f46e5',
                  boxShadow: '0 1px 4px rgba(15,23,42,0.1)',
                }
              : {
                  background: 'transparent',
                  color: '#64748b',
                }
          }
          onMouseEnter={(e) => {
            if (active !== tab.key) e.currentTarget.style.color = '#334155'
          }}
          onMouseLeave={(e) => {
            if (active !== tab.key) e.currentTarget.style.color = '#64748b'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
