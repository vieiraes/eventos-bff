import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { OrganizerLayout } from '../../components/OrganizerLayout'
import { FormInput } from '../../components/FormInput'
import { FormSelect } from '../../components/FormSelect'

interface UserFormData {
  role: 'organizer' | ' staff' | 'speaker' | 'vip' | 'attendee'
  email: string
  full_name: string
  phone: string
  company: string
  position: string
  password: string
  confirmPassword: string
  status: 'active' | 'inactive' | 'blocked'
  event_id: string  // Opcional: vincular ao evento durante criação
}

interface Event {
  id: string
  name: string
  slug: string
  start_date: string
  status: string
}

export function OrganizerUserForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState<UserFormData>({
    role: 'attendee',
    email: '',
    full_name: '',
    phone: '',
    company: '',
    position: '',
    password: '',
    confirmPassword: '',
    status: 'active',
    event_id: '',
  })

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.instance_id) {
      loadEvents()
    }
    if (isEditing && id) {
      loadUser(id)
    }
  }, [id, isEditing, user])

  const loadEvents = async () => {
    setLoadingEvents(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, start_date, status')
        .eq('instance_id', user?.instance_id)
        .in('status', ['draft', 'published', 'ongoing'])
        .order('start_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoadingEvents(false)
    }
  }

  const loadUser = async (userId: string) => {
    setLoadingData(true)
    try {
      // Carregar dados do usuário + evento vinculado (primeira registration)
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          registrations!left(
            event_id
          )
        `)
        .eq('id', userId)
        .eq('instance_id', user?.instance_id)
        .is('deleted_at', null)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          role: data.role,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone || '',
          company: data.company || '',
          position: data.position || '',
          password: '',
          confirmPassword: '',
          status: data.status,
          event_id: (data as any).registrations?.[0]?.event_id || '',
        })
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuário')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!isEditing) {
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem')
        return
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres')
        return
      }
    }

    if (!user?.instance_id) {
      setError('Erro: Você não está associado a uma instância')
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
            company: formData.company || null,
            position: formData.position || null,
            status: formData.status,
          })
          .eq('id', id)
          .eq('instance_id', user.instance_id)

        if (updateError) throw updateError

        // Se evento foi selecionado, verificar se precisa criar registration
        if (formData.event_id) {
          // Verificar se já existe registration para este evento
          const { data: existingReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('user_id', id)
            .eq('event_id', formData.event_id)
            .single()

          // Se não existe, criar nova registration
          if (!existingReg) {
            const registrationCode = `EVT${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`

            const { error: registrationError } = await supabase
              .from('registrations')
              .insert({
                event_id: formData.event_id,
                user_id: id,
                registration_code: registrationCode,
                status: 'confirmed',
                ticket_type: 'onsite',
                badge_name: formData.full_name,
                registered_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString(),
                total_amount: 0,
                currency: 'BRL',
              })

            if (registrationError) {
              console.error('Erro ao criar registration:', registrationError)
            }
          }
        }

        navigate('/organizer/users')
        return
      }

      // MODO CRIAÇÃO: Criar novo usuário
      // 1. Criar cliente Supabase ANÔNIMO para criar usuário sem afetar sessão atual
      const anonClient = createClient(
        'https://jhzqdelkyghibyylrupx.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoenFkZWxreWdoaWJ5eWxydXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTQxNzAsImV4cCI6MjA4NjgzMDE3MH0.0y59gzHWws4Qs4AJcamRfM85_YeF0U6c5TEjPDh1-Ec',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      )

      // 2. Criar usuário
      const { data: authData, error: authError } = await anonClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            instance_id: user.instance_id, // Sempre vincula à instância do organizer
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 3. Atualizar dados adicionais
      const { error: updateError } = await supabase
        .from('users')
        .update({
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
          status: formData.status,
        })
        .eq('id', authData.user.id)

      if (updateError) throw updateError

      // 4. Se evento selecionado, criar registration automaticamente
      if (formData.event_id) {
        // Gerar código único de registro
        const registrationCode = `EVT${new Date().getFullYear()}-${authData.user.id.slice(0, 8).toUpperCase()}`

        const { error: registrationError } = await supabase
          .from('registrations')
          .insert({
            event_id: formData.event_id,
            user_id: authData.user.id,
            registration_code: registrationCode,
            status: 'confirmed',
            ticket_type: 'onsite',
            badge_name: formData.full_name,
            registered_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            total_amount: 0,
            currency: 'BRL',
          })

        if (registrationError) {
          console.error('Erro ao criar registration:', registrationError)
          // Não bloqueia a criação do usuário se der erro na registration
        }
      }

      navigate('/organizer/users')
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  if (!user?.instance_id) {
    return (
      <OrganizerLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Erro: Você não está associado a uma instância.</p>
        </div>
      </OrganizerLayout>
    )
  }

  if (loadingData) {
    return (
      <OrganizerLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing
              ? 'Atualize os dados do usuário'
              : 'Crie um novo usuário (participante, staff, palestrante, VIP)'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 space-y-6">
          {/* Perfil e Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Perfil e Status
            </h3>

            <FormSelect
              label="Perfil *"
              required
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              helperText="Define as permissões e acesso do usuário"
            >
              <option value="attendee">Participante</option>
              <option value="staff">Staff</option>
              <option value="speaker">Palestrante</option>
              <option value="vip">VIP</option>
              <option value="organizer">Organizador</option>
            </FormSelect>

            <FormSelect
              label="Status *"
              required
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              helperText="Ativo = pode acessar | Inativo = bloqueado temporariamente"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </FormSelect>

            {/* Vincular ao evento */}
            <FormSelect
              label="Evento (Opcional)"
              value={formData.event_id}
              onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
              helperText={isEditing 
                ? "Adicionar vínculo com evento (se já vinculado, não altera o existente)" 
                : "Vincular automaticamente ao evento (útil para check-in rápido)"
              }
              disabled={loadingEvents}
            >
              <option value="">Nenhum evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.start_date).toLocaleDateString('pt-BR')} ({event.status})
                </option>
              ))}
            </FormSelect>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Dados Pessoais
            </h3>

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
              placeholder="Ex: carlos@email.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isEditing}
              helperText={isEditing ? '⚠️ Email não pode ser alterado' : 'Usado para login'}
            />

            <FormInput
              label="Telefone"
              type="tel"
              placeholder="(11) 98765-4321"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />

            <FormInput
              label="Empresa"
              type="text"
              placeholder="Ex: Empresa ABC"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            />

            <FormInput
              label="Cargo"
              type="text"
              placeholder="Ex: Gerente de TI"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
            />
          </div>

          {/* Senha (apenas na criação) */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Senha de Acesso
              </h3>

              <FormInput
                label="Senha *"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                helperText="Senha para o usuário fazer login no sistema"
              />

              <FormInput
                label="Confirmar Senha *"
                type="password"
                required
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/organizer/users')}
              className="flex-1 px-6 py-3 text-base font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Usuário' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </OrganizerLayout>
  )
}
