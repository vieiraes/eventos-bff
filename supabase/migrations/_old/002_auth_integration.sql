-- ============================================
-- EVENTOS-BFF - Auth Integration
-- Integração entre Supabase Auth e public.users
-- ============================================

-- ============================================
-- 1. Function: handle_new_user
-- Quando um usuário se registra no Supabase Auth,
-- cria automaticamente um registro em public.users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    status,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee'),
    'active',
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Trigger: on_auth_user_created
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. Function: handle_user_update
-- Sincroniza updates de email_verified e metadata
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    last_login_at = COALESCE(NEW.last_sign_in_at, OLD.last_sign_in_at),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Trigger: on_auth_user_updated
-- ============================================

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- 5. RLS Policies - Refatoração
-- ============================================

-- Drop policies antigas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view instance events" ON events;

-- Users: Cada user pode ver/editar seus próprios dados
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- SUPERADMIN pode ver tudo
CREATE POLICY "superadmin_all_users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Organizers podem ver users da mesma instância
CREATE POLICY "organizers_view_instance_users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('organizer', 'staff')
      AND u.instance_id = users.instance_id
    )
  );

-- ============================================
-- 6. RLS Policies - Instances
-- ============================================

-- SUPERADMIN pode gerenciar todas as instâncias
CREATE POLICY "superadmin_all_instances"
  ON instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Organizers podem ver sua própria instância
CREATE POLICY "organizers_view_own_instance"
  ON instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND instance_id = instances.id
      AND role IN ('organizer', 'staff')
    )
  );

-- ============================================
-- 7. RLS Policies - Events
-- ============================================

-- Users podem ver eventos de sua instância
CREATE POLICY "users_view_instance_events"
  ON events FOR SELECT
  USING (
    instance_id IN (
      SELECT instance_id FROM users WHERE id = auth.uid()
    )
    OR
    status = 'published' -- Eventos publicados são públicos
  );

-- Organizers podem criar/editar eventos de sua instância
CREATE POLICY "organizers_manage_instance_events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND instance_id = events.instance_id
      AND role IN ('organizer', 'staff')
    )
  );

-- ============================================
-- 8. RLS Policies - Registrations
-- ============================================

-- Users podem ver suas próprias registrations
CREATE POLICY "users_view_own_registrations"
  ON registrations FOR SELECT
  USING (user_id = auth.uid());

-- Users podem criar suas próprias registrations
CREATE POLICY "users_create_own_registrations"
  ON registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users podem atualizar suas próprias registrations (cancelar, etc)
CREATE POLICY "users_update_own_registrations"
  ON registrations FOR UPDATE
  USING (user_id = auth.uid());

-- Organizers/Staff podem ver todas registrations dos eventos de sua instância
CREATE POLICY "organizers_view_event_registrations"
  ON registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.instance_id = e.instance_id
      WHERE e.id = registrations.event_id
      AND u.id = auth.uid()
      AND u.role IN ('organizer', 'staff')
    )
  );

-- ============================================
-- 9. RLS Policies - Registration Items
-- ============================================

-- Users podem ver seus próprios items
CREATE POLICY "users_view_own_items"
  ON registration_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.id = registration_items.registration_id
      AND registrations.user_id = auth.uid()
    )
  );

-- Users podem criar items em suas registrations
CREATE POLICY "users_create_own_items"
  ON registration_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.id = registration_items.registration_id
      AND registrations.user_id = auth.uid()
    )
  );

-- Users podem deletar items (remover do carrinho)
CREATE POLICY "users_delete_own_items"
  ON registration_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.id = registration_items.registration_id
      AND registrations.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. RLS Policies - Event Areas
-- ============================================

-- Todos podem ver áreas de eventos publicados
CREATE POLICY "public_view_event_areas"
  ON event_areas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_areas.event_id
      AND events.status = 'published'
    )
  );

-- Organizers podem gerenciar áreas de eventos de sua instância
CREATE POLICY "organizers_manage_event_areas"
  ON event_areas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.instance_id = e.instance_id
      WHERE e.id = event_areas.event_id
      AND u.id = auth.uid()
      AND u.role IN ('organizer', 'staff')
    )
  );

-- ============================================
-- 11. RLS Policies - Access Packages
-- ============================================

-- Todos podem ver pacotes de eventos publicados
CREATE POLICY "public_view_packages"
  ON access_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = access_packages.event_id
      AND (events.status = 'published' OR events.status = 'ongoing')
    )
  );

-- Organizers podem gerenciar pacotes de eventos de sua instância
CREATE POLICY "organizers_manage_packages"
  ON access_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.instance_id = e.instance_id
      WHERE e.id = access_packages.event_id
      AND u.id = auth.uid()
      AND u.role IN ('organizer', 'staff')
    )
  );

-- ============================================
-- 12. RLS Policies - User Access
-- ============================================

-- Users podem ver seus próprios acessos
CREATE POLICY "users_view_own_access"
  ON user_access FOR SELECT
  USING (user_id = auth.uid());

-- Organizers/Staff podem ver acessos de eventos de sua instância
CREATE POLICY "organizers_view_event_access"
  ON user_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.instance_id = e.instance_id
      WHERE e.id = user_access.event_id
      AND u.id = auth.uid()
      AND u.role IN ('organizer', 'staff')
    )
  );

-- Organizers podem criar acessos (cortesias, upgrades, etc)
CREATE POLICY "organizers_manage_access"
  ON user_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.instance_id = e.instance_id
      WHERE e.id = user_access.event_id
      AND u.id = auth.uid()
      AND u.role IN ('organizer', 'staff')
    )
  );

-- ============================================
-- 13. Helper Functions - API
-- ============================================

-- Function: get_user_profile
CREATE OR REPLACE FUNCTION get_user_profile()
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
  FROM users u
  LEFT JOIN instances i ON u.instance_id = i.id
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_user_events
CREATE OR REPLACE FUNCTION get_user_events()
RETURNS TABLE (
  event_id uuid,
  event_name varchar,
  event_slug varchar,
  event_type varchar,
  start_date timestamptz,
  end_date timestamptz,
  status varchar,
  registration_status varchar,
  registration_code varchar,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.name as event_name,
    e.slug as event_slug,
    e.event_type,
    e.start_date,
    e.end_date,
    e.status,
    r.status as registration_status,
    r.registration_code,
    r.total_amount
  FROM events e
  LEFT JOIN registrations r ON e.id = r.event_id AND r.user_id = auth.uid()
  WHERE e.instance_id IN (
    SELECT instance_id FROM users WHERE id = auth.uid()
  )
  OR e.status = 'published'
  ORDER BY e.start_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_user_access_for_event
CREATE OR REPLACE FUNCTION get_user_access_for_event(p_event_id uuid)
RETURNS TABLE (
  package_name varchar,
  package_type varchar,
  allowed_areas jsonb,
  acquired_type varchar,
  valid_from timestamptz,
  valid_until timestamptz,
  status varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.name as package_name,
    ap.package_type,
    ap.allowed_areas,
    ua.acquired_type,
    ua.valid_from,
    ua.valid_until,
    ua.status
  FROM user_access ua
  JOIN access_packages ap ON ua.access_package_id = ap.id
  WHERE ua.user_id = auth.uid()
  AND ua.event_id = p_event_id
  AND ua.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION handle_new_user() IS 'Cria automaticamente user em public.users quando auth.users é criado';
COMMENT ON FUNCTION handle_user_update() IS 'Sincroniza email_verified e last_login_at entre auth.users e public.users';
COMMENT ON FUNCTION get_user_profile() IS 'Retorna perfil completo do usuário autenticado';
COMMENT ON FUNCTION get_user_events() IS 'Retorna eventos disponíveis para o usuário com status de inscrição';
COMMENT ON FUNCTION get_user_access_for_event(uuid) IS 'Retorna acessos ativos do usuário para um evento específico';
