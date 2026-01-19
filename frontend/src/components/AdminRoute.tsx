import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AdminRoute({ children }: { children: JSX.Element }) {
  const { isLoading, user } = useAuth()
  if (isLoading) return <div className="text-sm text-gray-600">Lade ...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.isAdmin) return <Navigate to="/" replace />
  return children
}
