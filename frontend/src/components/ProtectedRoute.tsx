import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <div className="text-sm text-gray-600">Lade ...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
