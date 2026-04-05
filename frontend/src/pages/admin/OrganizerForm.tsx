import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, createEphemeralClient } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { AdminLayout } from '../../components/AdminLayout'
import { FormInput } from '../../components/FormInput'
import { FormSelect } from '../../components/FormSelect'
import type { Instance } from '../../types'

export function OrganizerForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const { user: currentUser } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [loadingInstances, setLoadingInstances] = useState(true)
  const [loadingData, setLoadingData] = useState(isEditing)
  const [error, setError] = useState('')
  const [instances, setInstances] = useState<Instance[]>([])
  const [resetPassword, setResetPassword] = useState({ newPassword: '', confirmPassword: '' })
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

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
    const loadData = async () => {
      await loadInstances()
      if (isEditing && id) {
        await loadUser(id)
      }
    }
    loadData()
  }, [id, isEditing])

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

  const loadUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, instances(*)')
        .eq('id', userId)
        .is('deleted_at', null) // Não carregar usuários deletados
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          role: data.role as 'superadmin' | 'organizer',
          email: data.email,
          full_name: data.full_name,
          phone: data.phone || '',
          instance_id: data.instance_id || '',
          company: data.company || '',
          position: data.position || '',
          password: '',
          confirmPassword: '',
        })

        // Se o usuário tem instance_id e a instância não está na lista (por não ser active), adicionar
        if (data.instance_id && data.instances) {
          setInstances(prev => {
            const instanceExists = prev.some(i => i.id === data.instance_id)
            if (!instanceExists) {
              return [...prev, data.instances as Instance]
            }
            return prev
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuário')
    } finally {
      setLoadingData(false)
    }
  }

  const handleResetPassword = async () => {
    setResetError('')
    setResetSuccess(false)

    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      setResetError('As senhas não coincidem')
      return
    }
    if (resetPassword.newPassword.length < 6) {
      setResetError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setResetLoading(true)
    try {
      const isOwnProfile = id === currentUser?.id
      if (isOwnProfile) {
        // Alterar própria senha diretamente (sem Edge Function)
        const { error } = await supabase.auth.updateUser({ password: resetPassword.newPassword })
        if (error) throw error
      } else {
        // Resetar senha de outro usuário via Edge Function (requer service_role)
        const { error } = await supabase.functions.invoke('reset-user-password', {
          body: { userId: id, newPassword: resetPassword.newPassword },
        })
        if (error) throw new Error((error as any).message || 'Erro ao redefinir senha')
      }
      setResetSuccess(true)
      setResetPassword({ newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setResetError(err.message || 'Erro ao redefinir senha')
    } finally {
      setResetLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!isEditing) {
      // Validações apenas para criação (senha obrigatória)
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem')
        return
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres')
        return
      }
    }

    if (formData.role === 'organizer' && !formData.instance_id) {
      setError('Selecione uma instância para o Organizer')
      return
    }

    setLoading(true)

    try {
      if (isEditing && id) {
        // MODO EDIÇÃO: Atualizar usuário existente
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: formData.role,
            full_name: formData.full_name,
            phone: formData.phone || null,
            instance_id: formData.role === 'organizer' ? formData.instance_id : null,
            company: formData.company || null,
            position: formData.position || null,
          })
          .eq('id', id)

        if (updateError) throw updateError
        navigate('/admin/users')
        return
      }
      // 1. Criar cliente efêmero para criar usuário sem afetar sessão atual
      const anonClient = createEphemeralClient()
      
      // 2. Criar usuário usando cliente efêmero (não afeta sessão do SuperAdmin)
      const { data: authData, error: authError } = await anonClient.auth.signUp({
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

      // 3. Atualizar dados adicionais usando o cliente principal (com sessão do SuperAdmin)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
        })
        .eq('id', authData.user.id)

      if (updateError) throw updateError

      navigate('/admin/users')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  const selectedInstance = instances.find(i => i.id === formData.instance_id)

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Usuário Administrativo' : 'Novo Usuário Administrativo'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing 
              ? 'Edite os dados do SuperAdmin ou Organizer'
              : 'Crie um SuperAdmin (gerencia tudo) ou Organizer (gerencia uma instância)'}
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
            <FormSelect
              label="Tipo de Usuário *"
              required
              value={formData.role}
              disabled={isEditing}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'superadmin' | 'organizer', instance_id: e.target.value === 'superadmin' ? '' : prev.instance_id }))}
              helperText={
                isEditing 
                  ? '🔒 O tipo de usuário não pode ser alterado. Para mudanças, crie um novo usuário.'
                  : (formData.role === 'superadmin' 
                    ? '🔑 SuperAdmin pode gerenciar todas as instâncias, usuários e configurações globais' 
                    : '🏢 Organizer gerencia eventos e usuários apenas de sua instância')
              }
            >
              <option value="organizer">Organizer - Administra uma instância específica</option>
              <option value="superadmin">SuperAdmin - Acesso total ao sistema</option>
            </FormSelect>

            {/* Instância (apenas para Organizer) */}
            {formData.role === 'organizer' && (
              <>
                {isEditing && formData.instance_id ? (
                  /* Modo Edição: Instância é READ-ONLY (não pode migrar) */
                  <FormInput
                    label="Instância (Empresa) *"
                    type="text"
                    value={selectedInstance?.name || 'Carregando...'}
                    disabled
                    helperText="⚠️ Não é possível alterar a instância de um Organizer. Se necessário, exclua este usuário e crie um novo."
                  />
                ) : (
                  /* Modo Criação: Selecione a instância */
                  <FormSelect
                    label="Instância (Empresa) *"
                    required={formData.role === 'organizer'}
                    value={formData.instance_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, instance_id: e.target.value }))}
                    helperText={selectedInstance ? `Tipo: ${selectedInstance.type}` : 'Selecione a empresa que este Organizer irá gerenciar'}
                  >
                    <option value="">Selecione uma instância</option>
                    {instances.map(instance => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name} ({instance.type})
                      </option>
                    ))}
                  </FormSelect>
                )}
              </>
            )}

            {/* Dados Pessoais */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
              
              <div className="space-y-4">
                <FormInput
                  label="Nome Completo *"
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />

                <FormInput
                  label="Email *"
                  type="email"
                  required
                  disabled={isEditing}
                  placeholder="carlos@multieventos.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  helperText={isEditing ? 'Email não pode ser alterado' : undefined}
                />

                <FormInput
                  label="Telefone (Opcional)"
                  type="tel"
                  placeholder="+55 27 99999-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />

                <FormInput
                  label="Empresa (Opcional)"
                  type="text"
                  placeholder="Ex: MultiEventos"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />

                <FormInput
                  label="Cargo (Opcional)"
                  type="text"
                  placeholder="Ex: CEO, Diretor"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </div>

            {/* Senha (apenas para criação) */}
            {!isEditing && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Senha de Acesso</h3>
                
                <div className="space-y-4">
                  <FormInput
                    label="Senha *"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />

                  <FormInput
                    label="Confirmar Senha *"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Redefinir senha (apenas em modo edição) */}
            {isEditing && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Redefinir Senha</h3>

                {resetSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">✅ Senha redefinida com sucesso!</p>
                  </div>
                )}

                {resetError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{resetError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <FormInput
                    label="Nova senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={resetPassword.newPassword}
                    onChange={(e) => setResetPassword(prev => ({ ...prev, newPassword: e.target.value }))}
                  />

                  <FormInput
                    label="Confirmar nova senha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={resetPassword.confirmPassword}
                    onChange={(e) => setResetPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />

                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading || !resetPassword.newPassword}
                    className="px-4 py-3 text-base font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resetLoading ? 'Redefinindo...' : 'Redefinir senha'}
                  </button>
                </div>
              </div>
            )}

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
                {loading 
                  ? (isEditing ? 'Salvando...' : 'Criando...') 
                  : (isEditing ? 'Salvar Alterações' : (formData.role === 'superadmin' ? 'Criar SuperAdmin' : 'Criar Organizer'))}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}
