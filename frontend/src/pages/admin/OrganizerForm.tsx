import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { AdminLayout } from '../../components/AdminLayout'
import type { Instance } from '../../types'

export function OrganizerForm() {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [loadingInstances, setLoadingInstances] = useState(true)
  const [error, setError] = useState('')
  const [instances, setInstances] = useState<Instance[]>([])

  const [formData, setFormData] = useState({
    role: 'organizer' as 'superadmin' | 'organizer',
    email: '',
    full_name: '',
    phone: '',
    instance_id: '',
    company: '',
    position: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    loadInstances()
  }, [])

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setInstances(data || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar instâncias')
    } finally {
      setLoadingInstances(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (formData.role === 'organizer' && !formData.instance_id) {
      setError('Selecione uma instância para o Organizer')
      return
    }

    setLoading(true)

    try {
      // 1. Salvar sessão atual do SuperAdmin antes de criar novo usuário
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      // 2. Criar usuário no Supabase Auth (isso vai logar automaticamente o novo usuário)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            instance_id: formData.role === 'organizer' ? formData.instance_id : null,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 3. Atualizar o registro em public.users com dados adicionais
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
        })
        .eq('id', authData.user.id)

      if (updateError) throw updateError

      // 4. IMPORTANTE: Restaurar a sessão do SuperAdmin
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        })
      }

      alert(`✅ Usuário criado com sucesso!
      
📧 Email: ${formData.email}
🔑 Senha: ${formData.password}
👤 Nome: ${formData.full_name}
🎯 Role: ${formData.role}
${formData.role === 'organizer' ? `🏢 Instância: ${selectedInstance?.name}` : ''}

⚠️ IMPORTANTE: 
- Se o login falhar, verifique no Supabase se "Email Confirmation" está DESABILITADO
- Authentication → Providers → Email → Confirm email: OFF`)
      
      navigate('/admin/users')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  const selectedInstance = instances.find(i => i.id === formData.instance_id)

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Novo Usuário Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Crie um SuperAdmin (gerencia tudo) ou Organizer (gerencia uma instância)
          </p>
        </div>

        {loadingInstances ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando instâncias...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Tipo de Usuário */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de Usuário *
              </label>
              <select
                id="role"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'superadmin' | 'organizer', instance_id: e.target.value === 'superadmin' ? '' : prev.instance_id }))}
              >
                <option value="organizer">Organizer - Administra uma instância específica</option>
                <option value="superadmin">SuperAdmin - Acesso total ao sistema</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.role === 'superadmin' 
                  ? '🔑 SuperAdmin pode gerenciar todas as instâncias, usuários e configurações globais' 
                  : '🏢 Organizer gerencia eventos e usuários apenas de sua instância'}
              </p>
            </div>

            {/* Instância (apenas para Organizer) */}
            {formData.role === 'organizer' && (
              <div>
                <label htmlFor="instance_id" className="block text-sm font-medium text-gray-700">
                  Instância (Empresa) *
                </label>
                <select
                  id="instance_id"
                  required={formData.role === 'organizer'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.instance_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, instance_id: e.target.value }))}
                >
                  <option value="">Selecione uma instância</option>
                  {instances.map(instance => (
                    <option key={instance.id} value={instance.id}>
                      {instance.name} ({instance.type})
                    </option>
                  ))}
                </select>
                {selectedInstance && (
                  <p className="mt-1 text-sm text-gray-500">
                    Tipo: <span className="font-medium">{selectedInstance.type}</span>
                  </p>
                )}
              </div>
            )}

            {/* Dados Pessoais */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: Carlos Silva"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="carlos@multieventos.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefone (Opcional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="+55 27 99999-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Empresa (Opcional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: MultiEventos"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Cargo (Opcional)
                  </label>
                  <input
                    type="text"
                    id="position"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: CEO, Diretor"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Senha */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Senha de Acesso</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha *
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : formData.role === 'superadmin' ? 'Criar SuperAdmin' : 'Criar Organizer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}
