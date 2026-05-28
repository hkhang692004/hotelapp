import { Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar user={user} />
      <main className="flex min-h-screen flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
