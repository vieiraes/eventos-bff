import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { OrganizerLayout } from '../../components/OrganizerLayout'
import type { Event } from '../../types'

export function OrganizerEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadEvents()
  }, [user, filterStatus])

  const loadEvents = async () => {
    if (!user?.instance_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('instance_id', user.instance_id)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho' },
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Publicado' },
      ongoing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em Andamento' },
      finished: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Finalizado' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
    }

    const badge = badges[status as keyof typeof badges] || badges.draft

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getEventTypeName = (type: string) => {
    const types: Record<string, string> = {
      congress: 'Congresso',
      conference: 'Conferência',
      workshop: 'Workshop',
      seminar: 'Seminário',
      fair: 'Feira',
      exhibition: 'Exposição',
      course: 'Curso',
      meeting: 'Encontro',
      other: 'Outro',
    }
    return types[type] || type
  }

  if (!user?.instance_id) {
    return (
      <OrganizerLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Erro: Usuário não está associado a uma instância.</p>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Eventos</h1>
            <p className="mt-2 text-gray-600">
              Gerencie os eventos da sua instância
            </p>
          </div>
          <Link
            to="/organizer/events/new"
            className="px-4 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Novo Evento
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filterStatus === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterStatus('published')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filterStatus === 'published'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Publicados
        </button>
        <button
          onClick={() => setFilterStatus('draft')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filterStatus === 'draft'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Rascunhos
        </button>
        <button
          onClick={() => setFilterStatus('ongoing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filterStatus === 'ongoing'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Em Andamento
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando eventos...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum evento encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            {filterStatus === 'all'
              ? 'Comece criando seu primeiro evento.'
              : `Não há eventos com o status "${filterStatus}".`}
          </p>
          <Link
            to="/organizer/events/new"
            className="inline-block px-4 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Criar Primeiro Evento
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Local
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidade
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      to={`/organizer/events/${event.id}/edit`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {event.name}
                    </Link>
                    <div className="text-sm text-gray-500">
                      {event.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getEventTypeName(event.event_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{formatDate(event.start_date)}</div>
                    {event.end_date && (
                      <div className="text-xs text-gray-400">
                        até {formatDate(event.end_date)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{event.venue_city}, {event.venue_state}</div>
                    <div className="text-xs text-gray-400">{event.venue_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {event.capacity ? event.capacity.toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      to={`/organizer/events/${event.id}/edit`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OrganizerLayout>
  )
}
