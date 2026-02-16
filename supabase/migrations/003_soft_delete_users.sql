-- ============================================
-- Migration 003: Soft Delete for Users
-- ============================================
-- REGRA DE NEGÓCIO:
-- - Usuários não devem ser deletados fisicamente (hard delete)
-- - Soft delete: marca com timestamp deleted_at
-- - Queries ignoram usuários com deleted_at preenchido
-- - Permite restauração se necessário
-- - Mantém integridade referencial e histórico

-- 1. Adicionar coluna deleted_at
ALTER TABLE public.users
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Criar índice para performance (queries sempre filtram IS NULL)
CREATE INDEX idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.users.deleted_at IS 'Soft delete: quando preenchido, usuário está inativo. NULL = ativo';

-- 3. Atualizar RLS Policies para ignorar deletados
-- Dropar policies existentes que precisam ser alteradas
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "superadmin_all_users" ON public.users;
DROP POLICY IF EXISTS "organizers_view_instance_users" ON public.users;

-- Recriar policies COM filtro deleted_at IS NULL

-- Users podem ver/editar seus próprios dados (apenas se não deletados)
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL);

-- SUPERADMIN pode gerenciar tudo (incluindo ver deletados para restaurar)
CREATE POLICY "superadmin_all_users"
  ON public.users FOR ALL
  USING (public.is_superadmin());

-- Organizers podem ver users da mesma instância (apenas não deletados)
CREATE POLICY "organizers_view_instance_users"
  ON public.users FOR SELECT
  USING (
    public.get_user_role() IN ('organizer', 'staff')
    AND instance_id = public.get_user_instance_id()
    AND deleted_at IS NULL
  );

-- 4. Função para Soft Delete
CREATE OR REPLACE FUNCTION public.soft_delete_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Marca usuário como deletado
  UPDATE public.users
  SET 
    deleted_at = NOW(),
    status = 'inactive',
    updated_at = NOW()
  WHERE id = user_id
    AND deleted_at IS NULL; -- Não pode deletar quem já está deletado
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou já está deletado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.soft_delete_user(UUID) IS 'Soft delete: marca usuário como deletado sem remover do banco';

-- 5. Função para Restaurar Usuário
CREATE OR REPLACE FUNCTION public.restore_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Restaura usuário deletado
  UPDATE public.users
  SET 
    deleted_at = NULL,
    status = 'active',
    updated_at = NOW()
  WHERE id = user_id
    AND deleted_at IS NOT NULL; -- Só pode restaurar quem está deletado
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado ou não está deletado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.restore_user(UUID) IS 'Restaura usuário que foi soft deleted';

-- 6. View para facilitar queries (apenas usuários ativos)
CREATE OR REPLACE VIEW public.active_users AS
SELECT * FROM public.users
WHERE deleted_at IS NULL;

COMMENT ON VIEW public.active_users IS 'View com apenas usuários ativos (não deletados)';

-- 7. Atualizar função get_user_profile para ignorar deletados
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  id uuid,
  email varchar,
  full_name varchar,
  role varchar,
  instance_id uuid,
  instance_name varchar,
  avatar_url varchar,
  phone varchar,
  company varchar,
  user_position varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.instance_id,
    i.name as instance_name,
    u.avatar_url,
    u.phone,
    u.company,
    u.position as user_position
  FROM public.users u
  LEFT JOIN public.instances i ON u.instance_id = i.id
  WHERE u.id = auth.uid()
    AND u.deleted_at IS NULL; -- Não retornar perfil de usuário deletado
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_profile() IS 'API - Retorna perfil completo do usuário autenticado (apenas se não deletado)';
