import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { OrganizerLayout } from '../../components/OrganizerLayout'
import { FormInput } from '../../components/FormInput'
import { FormSelect } from '../../components/FormSelect'
import { FormTextarea } from '../../components/FormTextarea'

interface EventFormData {
  name: string
  slug: string
  description: string
  event_type: string
  start_date: string
  end_date: string
  venue_name: string
  venue_city: string
  venue_state: string
  capacity: string
  status: string
}

export function EventForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    slug: '',
    description: '',
    event_type: 'conference',
    start_date: '',
    end_date: '',
    venue_name: '',
    venue_city: '',
    venue_state: '',
    capacity: '',
    status: 'draft',
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEditing && id) {
      loadEvent(id)
    }
  }, [id, isEditing])

  useEffect(() => {
    // Auto-gerar slug quando o nome mudar
    if (formData.name && !isEditing) {
      const generatedSlug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por -
        .replace(/^-+|-+$/g, '') // Remove - do início e fim
      
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name, isEditing])

  const loadEvent = async (eventId: string) => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('instance_id', user?.instance_id) // Só carrega se for da mesma instância
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          event_type: data.event_type,
          start_date: data.start_date.split('T')[0], // Extrai apenas YYYY-MM-DD
          end_date: data.end_date ? data.end_date.split('T')[0] : '', // Extrai apenas YYYY-MM-DD
          venue_name: data.venue_name,
          venue_city: data.venue_city || '',
          venue_state: data.venue_state || '',
          capacity: data.capacity ? String(data.capacity) : '',
          status: data.status,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar evento')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!formData.name.trim()) {
      setError('Nome do evento é obrigatório')
      return
    }

    if (!formData.event_type) {
      setError('Tipo de evento é obrigatório')
      return
    }

    if (!formData.start_date) {
      setError('Data de início é obrigatória')
      return
    }

    if (!formData.venue_name.trim()) {
      setError('Nome do local é obrigatório')
      return
    }

    // Validação de datas
    if (formData.end_date && formData.start_date > formData.end_date) {
      setError('Data de término não pode ser anterior à data de início')
      return
    }

    if (!user?.instance_id) {
      setError('Erro: Usuário não está associado a uma instância')
      return
    }

    setLoading(true)

    try {
      const eventData = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim() || null,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        venue_name: formData.venue_name.trim(),
        venue_city: formData.venue_city.trim() || null,
        venue_state: formData.venue_state.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        status: formData.status,
        instance_id: user.instance_id,
      }

      if (isEditing && id) {
        // Atualizar evento existente
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id)
          .eq('instance_id', user.instance_id) // Garante que só atualiza da própria instância

        if (updateError) throw updateError
      } else {
        // Criar novo evento
        const { error: insertError } = await supabase
          .from('events')
          .insert([eventData])

        if (insertError) throw insertError
      }

      navigate('/organizer/events')
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Evento' : 'Novo Evento'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing 
              ? 'Atualize as informações do evento' 
              : 'Preencha os dados para criar um novo evento'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Informações Básicas
            </h3>

            <FormInput
              label="Nome do Evento *"
              type="text"
              required
              placeholder="Ex: Congresso Brasileiro de Cirurgia Plástica 2026"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              helperText="Nome completo e descritivo do evento"
            />

            <FormInput
              label="Slug (URL) *"
              type="text"
              required
              placeholder="congresso-brasileiro-cirurgia-plastica-2026"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              helperText={isEditing 
                ? "⚠️ Alterar o slug pode quebrar links existentes" 
                : "Gerado automaticamente do nome. Use apenas letras minúsculas, números e hífens."}
            />

            <FormSelect
              label="Tipo de Evento *"
              required
              value={formData.event_type}
              onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
            >
              <option value="congress">Congresso</option>
              <option value="conference">Conferência</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminário</option>
              <option value="fair">Feira</option>
              <option value="exhibition">Exposição</option>
              <option value="course">Curso</option>
              <option value="meeting">Encontro</option>
              <option value="other">Outro</option>
            </FormSelect>

            <FormTextarea
              label="Descrição"
              rows={5}
              placeholder="Descreva o evento, seus objetivos, público-alvo..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              helperText="Descrição completa que será exibida na página do evento"
            />

            <FormSelect
              label="Status *"
              required
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              helperText="Rascunho = não visível publicamente | Publicado = visível para inscrições"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="ongoing">Em Andamento</option>
              <option value="completed">Finalizado</option>
              <option value="cancelled">Cancelado</option>
            </FormSelect>
          </div>

          {/* Datas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Datas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Data de Início *"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />

              <FormInput
                label="Data de Término"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                helperText="Deixe em branco se for evento de um dia"
              />
            </div>
          </div>

          {/* Local */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Local do Evento
            </h3>

            <FormInput
              label="Nome do Local *"
              type="text"
              required
              placeholder="Ex: Centro de Convenções Frei Caneca"
              value={formData.venue_name}
              onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Cidade"
                type="text"
                placeholder="Ex: São Paulo"
                value={formData.venue_city}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_city: e.target.value }))}
              />

              <FormInput
                label="Estado (UF)"
                type="text"
                placeholder="Ex: SP"
                maxLength={2}
                value={formData.venue_state}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_state: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>

          {/* Capacidade */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Capacidade
            </h3>

            <FormInput
              label="Capacidade Total"
              type="number"
              min="1"
              placeholder="Ex: 1000"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              helperText="Número máximo de participantes. Deixe em branco se não houver limite."
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/organizer/events')}
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
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Evento' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </OrganizerLayout>
  )
}
