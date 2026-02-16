import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { OrganizerLayout } from '../../components/OrganizerLayout'
import type { Event, Instance } from '../../types'

interface Stats {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  totalRegistrations: number
  totalRevenue: number
}

export function OrganizerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
  })
  const [instance, setInstance] = useState<Instance | null>(null)
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user?.instance_id) {
      setLoading(false)
      return
    }

    try {
      // Load instance info
      const { data: instanceData } = await supabase
        .from('instances')
        .select('*')
        .eq('id', user.instance_id)
        .single()

      if (instanceData) {
        setInstance(instanceData)
      }

      // Count events from this instance
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('instance_id', user.instance_id)

      const publishedCount = events?.filter(e => e.status === 'published').length || 0
      const draftCount = events?.filter(e => e.status === 'draft').length || 0

      // Get recent events
      const { data: recentEventsData } = await supabase
        .from('events')
        .select('*')
        .eq('instance_id', user.instance_id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Count registrations for all instance events
      const eventIds = events?.map(e => e.id) || []
      
      let totalRegistrations = 0
      let totalRevenue = 0

      if (eventIds.length > 0) {
        const { data: registrations } = await supabase
          .from('registrations')
          .select('total_amount, status')
          .in('event_id', eventIds)

        totalRegistrations = registrations?.length || 0

        const confirmedRegistrations = registrations?.filter(
          r => r.status === 'confirmed' || r.status === 'paid'
        ) || []

        totalRevenue = confirmedRegistrations.reduce(
          (sum, r) => sum + (r.total_amount || 0), 
          0
        )
      }

      setStats({
        totalEvents: events?.length || 0,
        publishedEvents: publishedCount,
        draftEvents: draftCount,
        totalRegistrations,
        totalRevenue,
      })

      setRecentEvents(recentEventsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Organizer</h1>
        <p className="mt-2 text-gray-600">Bem-vindo, {user?.full_name}</p>
        {instance && (
          <p className="mt-1 text-sm text-gray-500">
            Instância: <span className="font-medium">{instance.name}</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando estatísticas...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Eventos
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.totalEvents}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  to="/organizer/events"
                  className="text-sm font-medium text-purple-600 hover:text-purple-500"
                >
                  Ver todos →
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Eventos Publicados
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                      {stats.publishedEvents}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  {stats.draftEvents} em rascunho
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Inscrições
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.totalRegistrations}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  Todas as inscrições
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Receita Total
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  Confirmadas
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Eventos Recentes
              </h3>
              {recentEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum evento criado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/organizer/events`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(event.start_date)} • {event.venue_city}, {event.venue_state}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {event.status === 'published' ? 'Publicado' : 
                           event.status === 'draft' ? 'Rascunho' : event.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações da Instância
              </h3>
              {instance ? (
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Nome</dt>
                    <dd className="text-sm font-medium text-gray-900">{instance.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Tipo</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {instance.type === 'enterprise' ? 'Enterprise' :
                       instance.type === 'premium' ? 'Premium' : 'Standard'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          instance.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {instance.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Eventos Criados</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {stats.totalEvents} de {instance.settings?.max_events || '∞'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-500 text-sm">Carregando informações...</p>
              )}
            </div>
          </div>
        </>
      )}
    </OrganizerLayout>
  )
}
