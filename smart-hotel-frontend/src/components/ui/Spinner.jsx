export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block flex-shrink-0 ${className}`}
      style={{
        borderRadius: '50%',
        border: '2.5px solid rgba(99,102,241,0.15)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}
