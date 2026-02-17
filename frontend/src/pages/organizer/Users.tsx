import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { OrganizerLayout } from '../../components/OrganizerLayout'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  phone: string | null
  created_at: string
  event_slug?: string | null
  event_name?: string | null
}

export function OrganizerUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadUsers()
  }, [user, filter])

  const loadUsers = async () => {
    if (!user?.instance_id) {
      setLoading(false)
      return
    }

    try {
      // Query com LEFT JOIN para pegar o evento vinculado (via registrations)
      let query = supabase
        .from('users')
        .select(`
          id, email, full_name, role, status, phone, created_at,
          registrations!left(
            event:events!inner(
              slug,
              name
            )
          )
        `)
        .eq('instance_id', user.instance_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('role', filter)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Mapear para incluir event_slug do primeiro registro encontrado
      const mappedUsers = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        created_at: user.created_at,
        event_slug: user.registrations?.[0]?.event?.slug || null,
        event_name: user.registrations?.[0]?.event?.name || null,
      }))
      
      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      return
    }

    setDeleting(userId)
    try {
      const { error } = await supabase.rpc('soft_delete_user', {
        user_id: userId,
      })

      if (error) throw error

      alert('Usuário excluído com sucesso!')
      loadUsers() // Recarrega a lista
    } catch (err: any) {
      alert(`Erro ao excluir usuário: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      organizer: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Organizador' },
      staff: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Staff' },
      speaker: { bg: 'bg-green-100', text: 'text-green-800', label: 'Palestrante' },
      vip: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'VIP' },
      attendee: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Participante' },
    }

    const badge = badges[role as keyof typeof badges] || badges.attendee

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
      blocked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bloqueado' },
    }

    const badge = badges[status as keyof typeof badges] || badges.active

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
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
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="mt-2 text-gray-600">
              Gerencie participantes, staff, palestrantes e VIPs da sua instância
            </p>
          </div>
          <Link
            to="/organizer/users/new"
            className="px-4 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Novo Usuário
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('attendee')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'attendee'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Participantes
        </button>
        <button
          onClick={() => setFilter('staff')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'staff'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Staff
        </button>
        <button
          onClick={() => setFilter('speaker')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'speaker'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Palestrantes
        </button>
        <button
          onClick={() => setFilter('vip')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'vip'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          VIPs
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando usuários...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? 'Comece criando seu primeiro usuário.'
              : `Não há usuários com o perfil "${filter}".`}
          </p>
          <Link
            to="/organizer/users/new"
            className="inline-block px-4 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Criar Primeiro Usuário
          </Link>
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
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {u.event_slug || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.phone || '—'}</td>
                  <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      to={`/organizer/users/${u.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3 inline-block"
                      title="Editar usuário"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(u.id, u.full_name)}
                      disabled={deleting === u.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed inline-flex"
                      title="Excluir usuário"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
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
