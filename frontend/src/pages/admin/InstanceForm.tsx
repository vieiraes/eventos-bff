import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { AdminLayout } from '../../components/AdminLayout'

export function InstanceForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditing)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'standard' as 'standard' | 'premium' | 'enterprise',
    status: 'active' as 'active' | 'suspended' | 'cancelled',
    max_events: '10', // Valor padrão para Standard
    features: [] as string[],
  })

  // Sugestões de limite por tipo de plano
  const planLimits = {
    standard: 10,
    premium: 20,
    enterprise: 50,
  }

  const availableFeatures = [
    { id: 'qrcode', label: 'QR Code Check-in' },
    { id: 'checkin', label: 'Check-in Manual' },
    { id: 'analytics', label: 'Analytics Avançado' },
    { id: 'custom_branding', label: 'Branding Customizado' },
    { id: 'api_access', label: 'Acesso API' },
    { id: 'white_label', label: 'White Label' },
  ]

  useEffect(() => {
    if (isEditing && id) {
      loadInstance(id)
    }
  }, [id, isEditing])

  const loadInstance = async (instanceId: string) => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instanceId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name,
          slug: data.slug,
          type: data.type,
          status: data.status,
          max_events: data.settings?.max_events?.toString() || '',
          features: data.settings?.features || [],
        })
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar instância')
    } finally {
      setLoadingData(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }))
  }

  const handleTypeChange = (type: 'standard' | 'premium' | 'enterprise') => {
    setFormData(prev => ({
      ...prev,
      type,
      max_events: planLimits[type].toString(),
    }))
  }

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const settings: Record<string, any> = {}
      
      // max_events agora é obrigatório
      settings.max_events = parseInt(formData.max_events)
      
      if (formData.features.length > 0) {
        settings.features = formData.features
      }

      const instanceData = {
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        status: formData.status,
        settings,
      }

      if (isEditing && id) {
        // Update
        const { error } = await supabase
          .from('instances')
          .update(instanceData)
          .eq('id', id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('instances')
          .insert([instanceData])

        if (error) throw error
      }

      navigate('/admin/instances')
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar instância')
    } finally {
      setLoading(false)
    }
  }

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
            {isEditing ? 'Editar Instância' : 'Nova Instância'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing ? 'Atualize os dados da empresa cliente' : 'Cadastre uma nova empresa cliente na plataforma'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome da Empresa *
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ex: MultiEventos Professional"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug (URL) *
            </label>
            <input
              type="text"
              id="slug"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="multieventos-professional"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            />
            <p className="mt-1 text-sm text-gray-500">Gerado automaticamente, mas pode ser editado</p>
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo de Plano *
              </label>
              <select
                id="type"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as any)}
              >
                <option value="standard">Standard (10 eventos)</option>
                <option value="premium">Premium (20 eventos)</option>
                <option value="enterprise">Enterprise (50 eventos)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">O limite de eventos é ajustado automaticamente</p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Max Eventos */}
          <div>
            <label htmlFor="max_events" className="block text-sm font-medium text-gray-700">
              Máximo de Eventos *
            </label>
            <input
              type="number"
              id="max_events"
              min="1"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="50"
              value={formData.max_events}
              onChange={(e) => setFormData(prev => ({ ...prev, max_events: e.target.value }))}
            />
            <p className="mt-1 text-sm text-gray-500">
              Deixe 0 para infinito. O recomendado é usar os limites pré-definidos por tipo de plano, mas você pode customizar aqui.
            </p>
          </div>

          {/* Features */}
          <div className="opacity-60">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funcionalidades Habilitadas
            </label>
            <p className="mb-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
              ⚠️ Em desenvolvimento - Funcionalidade preparada para implementação futura
            </p>
            <div className="space-y-2">
              {availableFeatures.map(feature => (
                <label key={feature.id} className="flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    disabled={true}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-not-allowed"
                    checked={formData.features.includes(feature.id)}
                    onChange={() => toggleFeature(feature.id)}
                  />
                  <span className="ml-2 text-sm text-gray-500">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/instances')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Instância'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
