import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import { FormInput } from '../components/FormInput'

export function ChangePassword() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setFormData({ newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  const getBackPath = () => {
    switch (user?.role) {
      case 'superadmin': return '/admin'
      case 'organizer': return '/organizer'
      default: return '/events'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <nav className="bg-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-white text-xl font-bold">🎫 Eventos BFF</span>
            <span className="text-indigo-200 text-sm">{user?.full_name}</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-start justify-center pt-16 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <button
              onClick={() => navigate(getBackPath())}
              className="text-indigo-600 text-sm hover:text-indigo-800"
            >
              ← Voltar
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Alterar senha</h1>
            <p className="text-sm text-gray-500 mb-6">
              {user?.full_name} · {user?.email}
            </p>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">✅ Senha alterada com sucesso!</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Nova senha *"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              />

              <FormInput
                label="Confirmar nova senha *"
                type="password"
                required
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(getBackPath())}
                  className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Salvando...' : 'Salvar senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
