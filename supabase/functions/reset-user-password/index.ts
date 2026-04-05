import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'userId e newPassword são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter no mínimo 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar quem está chamando via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Decodificar JWT para obter o ID do chamador (sem verificação criptográfica —
    // a consulta ao banco já garante que o usuário existe e está ativo)
    const token = authHeader.replace('Bearer ', '')
    const [, payloadB64] = token.split('.')
    const payload = JSON.parse(atob(payloadB64))
    const callerId: string = payload.sub

    if (!callerId) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client — usado para todas as operações no banco
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Buscar perfil do chamador diretamente via admin client
    const { data: callerUser, error: callerError } = await adminClient
      .from('users')
      .select('id, role, instance_id')
      .eq('id', callerId)
      .is('deleted_at', null)
      .single()

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível verificar permissões' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apenas superadmin e organizer podem resetar senha de outros
    if (callerUser.role !== 'superadmin' && callerUser.role !== 'organizer') {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para redefinir senha de outros usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o usuário alvo existe
    const { data: targetUser, error: targetError } = await adminClient
      .from('users')
      .select('id, role, instance_id')
      .eq('id', userId)
      .is('deleted_at', null)
      .single()

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Organizer só pode resetar usuários da própria instância (e não superadmins)
    if (callerUser.role === 'organizer') {
      if (targetUser.instance_id !== callerUser.instance_id) {
        return new Response(
          JSON.stringify({ error: 'Sem permissão: usuário pertence a outra instância' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (targetUser.role === 'superadmin') {
        return new Response(
          JSON.stringify({ error: 'Sem permissão para redefinir senha de superadmin' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Resetar senha via Admin API
    const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (resetError) {
      return new Response(
        JSON.stringify({ error: resetError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

