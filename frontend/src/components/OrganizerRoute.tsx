import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface OrganizerRouteProps {
  children: ReactNode
}

export function OrganizerRoute({ children }: OrganizerRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'organizer') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
