import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { AdminLayout } from '../../components/AdminLayout'
import { Instance } from '../../types'

export function AdminInstances() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadInstances()
  }, [])

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInstances(data || [])
    } catch (error) {
      console.error('Error loading instances:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanBadge = (plan: string) => {
    const badges: Record<string, { color: string }> = {
      standard: { color: 'bg-gray-100 text-gray-800' },
      premium: { color: 'bg-blue-100 text-blue-800' },
      enterprise: { color: 'bg-purple-100 text-purple-800' },
    }

    const badge = badges[plan] || { color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {plan.toUpperCase()}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Ativo' : 'Suspenso'}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const handleDelete = async (instanceId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta instância? Os organizers perderão acesso.')) {
      return
    }

    setDeleting(instanceId)
    try {
      const { error } = await supabase
        .from('instances')
        .update({ status: 'cancelled' })
        .eq('id', instanceId)

      if (error) throw error

      // Reload
      await loadInstances()
    } catch (error) {
      console.error('Error deleting instance:', error)
      alert('Erro ao desativar instância')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instâncias</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie as empresas clientes da plataforma
            </p>
          </div>
          <Link
            to="/admin/instances/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Nova Instância
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando instâncias...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Eventos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instances.map((instance) => (
                <tr key={instance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {instance.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {instance.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlanBadge(instance.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(instance.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {instance.settings?.max_events || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(instance.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/admin/instances/${instance.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3 inline-block"
                      title="Editar instância"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(instance.id)}
                      disabled={deleting === instance.id || instance.status === 'cancelled'}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed inline-flex"
                      title={instance.status === 'cancelled' ? 'Já cancelado' : 'Desativar instância'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {instances.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma instância cadastrada</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
