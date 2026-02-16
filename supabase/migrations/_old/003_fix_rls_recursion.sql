-- ============================================
-- Fix RLS Policies - Remove Infinite Recursion
-- ============================================

-- Cria funções helper que verificam role sem causar recursão
-- (usando SECURITY DEFINER que bypassa RLS)

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_instance_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT instance_id FROM public.users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop e recria as políticas problemáticas

DROP POLICY IF EXISTS "superadmin_all_users" ON users;
DROP POLICY IF EXISTS "organizers_view_instance_users" ON users;

-- SUPERADMIN pode ver/editar tudo (sem recursão)
CREATE POLICY "superadmin_all_users"
  ON users FOR ALL
  USING (public.is_superadmin());

-- Organizers podem ver users da mesma instância (sem recursão)
CREATE POLICY "organizers_view_instance_users"
  ON users FOR SELECT
  USING (
    public.get_user_role() IN ('organizer', 'staff')
    AND instance_id = public.get_user_instance_id()
  );
