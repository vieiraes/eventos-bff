import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'

interface EventWithRegistration {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  status: string
  instance_name: string
  registration_id: string | null
  registration_status: string | null
}

export function Events() {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState<EventWithRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_events')
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string | null) => {
    const badges: Record<string, { text: string; color: string }> = {
      confirmed: { text: 'Confirmado', color: 'bg-green-100 text-green-800' },
      paid: { text: 'Pago', color: 'bg-blue-100 text-blue-800' },
      awaiting_payment: { text: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-800' },
      pre_registered: { text: 'Pré-inscrito', color: 'bg-gray-100 text-gray-800' },
      cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
    }

    if (!status) return null

    const badge = badges[status] || { text: status, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Eventos BFF</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  ⚡ Admin
                </Link>
              )}
              <span className="text-sm text-gray-700">
                {user?.full_name} ({user?.role})
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Eventos Disponíveis</h2>
            <p className="mt-1 text-sm text-gray-600">
              Veja os eventos publicados e suas inscrições
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando eventos...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">Nenhum evento disponível no momento</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {event.title}
                      </h3>
                      {event.registration_status && getStatusBadge(event.registration_status)}
                    </div>
                    
                    {event.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2 text-sm text-gray-500">
                      <div>
                        <strong>Instituição:</strong> {event.instance_name}
                      </div>
                      <div>
                        <strong>Início:</strong> {formatDate(event.start_date)}
                      </div>
                      <div>
                        <strong>Fim:</strong> {formatDate(event.end_date)}
                      </div>
                      {event.location && (
                        <div>
                          <strong>Local:</strong> {event.location}
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      {event.registration_id ? (
                        <Link
                          to={`/events/${event.id}/registration`}
                          className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Ver Inscrição
                        </Link>
                      ) : (
                        <Link
                          to={`/events/${event.id}/register`}
                          className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Inscrever-se
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
