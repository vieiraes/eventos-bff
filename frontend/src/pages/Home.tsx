import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redireciona baseado no role do usuário
  switch (user.role) {
    case 'superadmin':
      return <Navigate to="/admin" replace />
    case 'organizer':
      return <Navigate to="/organizer" replace />
    case 'staff':
    case 'speaker':
    case 'vip':
    case 'attendee':
    default:
      return <Navigate to="/events" replace />
  }
}
