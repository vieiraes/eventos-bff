import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { AdminLayout } from '../../components/AdminLayout'

interface Stats {
  totalInstances: number
  totalOrganizers: number
  activeInstances: number
  totalUsers: number
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalInstances: 0,
    totalOrganizers: 0,
    activeInstances: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Count instances
      const { count: instancesCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })

      // Count active instances
      const { count: activeInstancesCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Count all users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Count organizers (instance admins)
      const { count: organizersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'organizer')

      setStats({
        totalInstances: instancesCount || 0,
        activeInstances: activeInstancesCount || 0,
        totalUsers: usersCount || 0,
        totalOrganizers: organizersCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard SuperAdmin</h1>
        <p className="mt-2 text-gray-600">Bem-vindo, {user?.full_name}</p>
        <p className="mt-1 text-sm text-gray-500">Gerenciamento de instâncias e organizers</p>
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
                      Total de Instâncias
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.totalInstances}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  to="/admin/instances"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ver todas →
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Instâncias Ativas
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                      {stats.activeInstances}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">
                  {stats.totalInstances - stats.activeInstances} inativas
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Organizers
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.totalOrganizers}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  to="/admin/users"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ver organizers →
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Usuários
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  to="/admin/users"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ver todos →
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Acesso Rápido
              </h3>
              <div className="space-y-3">
                <Link
                  to="/admin/instances"
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h4 className="font-medium text-gray-900">Gerenciar Instâncias</h4>
                  <p className="text-sm text-gray-500">Criar e configurar empresas clientes</p>
                </Link>
                <Link
                  to="/admin/users"
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <h4 className="font-medium text-gray-900">Gerenciar Organizers</h4>
                  <p className="text-sm text-gray-500">Visualizar administradores das instâncias</p>
                </Link>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações do Sistema
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Versão</dt>
                  <dd className="text-sm font-medium text-gray-900">0.1.0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Ambiente</dt>
                  <dd className="text-sm font-medium text-gray-900">Desenvolvimento</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Database</dt>
                  <dd className="text-sm font-medium text-gray-900">Supabase PostgreSQL</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Última atualização</dt>
                  <dd className="text-sm font-medium text-gray-900">16 Fev 2026</dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
