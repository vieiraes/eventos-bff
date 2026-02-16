import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { AdminLayout } from '../../components/AdminLayout'

interface UserWithInstance {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  created_at: string
  instance_slug: string | null
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadUsers()
  }, [filter])

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          status,
          created_at,
          instances (slug)
        `)
        .is('deleted_at', null) // Filtro explícito: apenas usuários não deletados
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('role', filter)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedData = data?.map((user: any) => ({
        ...user,
        instance_slug: user.instances?.slug || null,
      })) || []

      setUsers(formattedData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      superadmin: { text: 'SuperAdmin', color: 'bg-purple-100 text-purple-800' },
      organizer: { text: 'Organizador', color: 'bg-blue-100 text-blue-800' },
      staff: { text: 'Staff', color: 'bg-green-100 text-green-800' },
      speaker: { text: 'Palestrante', color: 'bg-yellow-100 text-yellow-800' },
      vip: { text: 'VIP', color: 'bg-pink-100 text-pink-800' },
      attendee: { text: 'Participante', color: 'bg-gray-100 text-gray-800' },
    }

    const badge = badges[role] || { text: role, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Ativo' : 'Inativo'}
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

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja desativar o usuário "${userName}"? Esta ação pode ser revertida posteriormente.`)) {
      return
    }

    setDeleting(userId)
    try {
      // Chama a função soft_delete_user do banco de dados
      const { error } = await supabase.rpc('soft_delete_user', {
        user_id: userId
      })

      if (error) throw error

      // Recarrega a lista (usuário deletado não aparecerá mais)
      await loadUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Erro ao desativar usuário: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie todos os usuários da plataforma
            </p>
          </div>
          <Link
            to="/admin/users/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Novo Usuário Admin
          </Link>
        </div>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <span className="font-medium">ℹ️ Permissões:</span> Você pode editar apenas usuários dos tipos <strong>SuperAdmin</strong> e <strong>Organizer</strong>. 
          Outros tipos (Staff, Speaker, VIP, Participante) são gerenciados pelos Organizers de cada instância.
        </p>
      </div>

      <div className="mb-4 flex space-x-2">
        {['all', 'superadmin', 'organizer', 'staff', 'speaker', 'vip', 'attendee'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === role
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {role === 'all' ? 'Todos' : role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando usuários...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instância
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const canEdit = user.role === 'superadmin' || user.role === 'organizer'
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${!canEdit ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                        {!canEdit && (
                          <span className="ml-2 text-xs text-gray-400" title="Usuário gerenciado pelo Organizer">
                            🔒
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.instance_slug || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEdit ? (
                        <>
                          <Link
                            to={`/admin/users/${user.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 mr-3 inline-block"
                            title="Editar usuário"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <button 
                            onClick={() => handleDelete(user.id, user.full_name)}
                            disabled={deleting === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Desativar usuário"
                          >
                            {deleting === user.id ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs" title="Gerenciado pelo Organizer da instância">
                          Somente leitura
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
