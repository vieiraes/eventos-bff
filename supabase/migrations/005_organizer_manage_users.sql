-- ============================================
-- Migration 005: Organizer User Management
-- ============================================
-- REGRA DE NEGÓCIO:
-- - Organizers podem criar/editar usuários da própria instância
-- - NÃO podem criar/promover para superadmin
-- - Podem gerenciar: staff, speaker, vip, attendee, organizer (da própria instância)
-- - Útil para resolver problemas durante check-in (corrigir dados, criar cadastros rápidos)

-- 1. Policy para Organizers CRIAR usuários da própria instância
CREATE POLICY "organizers_insert_instance_users"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Quem está criando deve ser organizer
    public.get_user_role() = 'organizer'
    -- O novo usuário deve pertencer à mesma instância do organizer
    AND instance_id = public.get_user_instance_id()
    -- NÃO pode criar superadmin (superadmin tem instance_id = NULL)
    AND role != 'superadmin'
    -- Validação extra: instance_id não pode ser NULL (exceto superadmin que é bloqueado acima)
    AND instance_id IS NOT NULL
  );

-- 2. Policy para Organizers ATUALIZAR usuários da própria instância
CREATE POLICY "organizers_update_instance_users"
  ON public.users FOR UPDATE
  USING (
    -- Quem está editando deve ser organizer
    public.get_user_role() = 'organizer'
    -- O usuário editado deve pertencer à mesma instância
    AND instance_id = public.get_user_instance_id()
    -- Não pode editar usuários deletados (soft delete check)
    AND deleted_at IS NULL
  )
  WITH CHECK (
    -- O usuário atualizado deve continuar na mesma instância
    instance_id = public.get_user_instance_id()
    -- NÃO pode promover para superadmin
    AND role != 'superadmin'
  );

-- 3. Policy para Organizers DELETAR usuários da própria instância (soft delete via função)
-- Nota: Organizers usarão a função soft_delete_user() que já existe
-- Mas adicionamos policy para garantir que só podem deletar da própria instância
CREATE POLICY "organizers_delete_instance_users"
  ON public.users FOR DELETE
  USING (
    public.get_user_role() = 'organizer'
    AND instance_id = public.get_user_instance_id()
    AND role != 'superadmin'  -- Nunca deletar superadmin
  );

-- Comentários explicativos
COMMENT ON POLICY "organizers_insert_instance_users" ON public.users IS 
  'Permite Organizers criarem users (staff, speaker, vip, attendee) da própria instância. Bloqueia criação de superadmin.';

COMMENT ON POLICY "organizers_update_instance_users" ON public.users IS 
  'Permite Organizers editarem users da própria instância. Bloqueia promoção a superadmin e migração de instância.';

COMMENT ON POLICY "organizers_delete_instance_users" ON public.users IS 
  'Permite Organizers deletarem users da própria instância (usado com soft_delete_user). Bloqueia delete de superadmin.';
