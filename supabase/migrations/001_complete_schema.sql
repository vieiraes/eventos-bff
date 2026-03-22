-- ============================================
-- EVENTOS-BFF - Complete Schema (Consolidated)
-- Sistema SaaS Multi-tenant para Gestão de Eventos Corporativos
-- Versão: 1.0.0 - Consolidada (16/02/2026)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Table: instances
CREATE TABLE instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'standard',
  status VARCHAR NOT NULL DEFAULT 'active',
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instances_slug ON instances(slug);
CREATE INDEX idx_instances_status ON instances(status);

COMMENT ON TABLE instances IS 'Instância SaaS - Uma empresa pode criar N eventos. Cada instância é isolada.';
COMMENT ON COLUMN instances.type IS 'standard, enterprise, premium';
COMMENT ON COLUMN instances.status IS 'active, suspended, cancelled';

-- Table: users (SEM email_verified)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  avatar_url VARCHAR,
  document_number VARCHAR,
  company VARCHAR,
  position VARCHAR,
  bio TEXT,
  role VARCHAR NOT NULL DEFAULT 'attendee',
  status VARCHAR NOT NULL DEFAULT 'active',
  metadata JSONB,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_instance_id ON users(instance_id);
CREATE INDEX idx_users_instance_role ON users(instance_id, role);
CREATE INDEX idx_users_document_number ON users(document_number);

COMMENT ON TABLE users IS 'Usuários do sistema - TUDO é user (participantes, organizadores, staff, palestrantes, vip)';
COMMENT ON COLUMN users.instance_id IS 'Null apenas para SUPERADMIN';
COMMENT ON COLUMN users.role IS 'superadmin, organizer, staff, attendee, speaker, vip';
COMMENT ON COLUMN users.status IS 'active, inactive, blocked';

-- Table: events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description TEXT,
  event_type VARCHAR NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone VARCHAR DEFAULT 'America/Sao_Paulo',
  venue_name VARCHAR NOT NULL,
  venue_address TEXT,
  venue_city VARCHAR,
  venue_state VARCHAR,
  venue_country VARCHAR DEFAULT 'Brasil',
  venue_map_url VARCHAR,
  capacity INTEGER,
  status VARCHAR NOT NULL DEFAULT 'draft',
  banner_url VARCHAR,
  logo_url VARCHAR,
  website_url VARCHAR,
  settings JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance_id, slug)
);

CREATE INDEX idx_events_instance_id ON events(instance_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);

COMMENT ON TABLE events IS 'Eventos criados por uma instância';
COMMENT ON COLUMN events.event_type IS 'conference, workshop, seminar, congress, fair';
COMMENT ON COLUMN events.status IS 'draft, published, ongoing, completed, cancelled';

-- Table: registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registration_code VARCHAR UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'pre_registered',
  badge_name VARCHAR,
  ticket_type VARCHAR,
  total_amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR DEFAULT 'BRL',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  payment_requested_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_code ON registrations(registration_code);

COMMENT ON TABLE registrations IS 'Inscrições no evento - Rastreia funil desde pré-cadastro até confirmação';
COMMENT ON COLUMN registrations.status IS 'pre_registered, awaiting_payment, paid, confirmed, cancelled, expired';

-- Table: event_areas
CREATE TABLE event_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  code VARCHAR,
  description TEXT,
  area_type VARCHAR,
  capacity INTEGER,
  floor VARCHAR,
  status VARCHAR DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, code)
);

CREATE INDEX idx_event_areas_event_id ON event_areas(event_id);
CREATE INDEX idx_event_areas_area_type ON event_areas(area_type);

COMMENT ON TABLE event_areas IS 'Áreas/salas do evento';
COMMENT ON COLUMN event_areas.area_type IS 'room, hall, stands, vip_lounge, entrance, backstage';

-- Table: access_packages
CREATE TABLE access_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  package_type VARCHAR,
  allowed_areas JSONB,
  price DECIMAL(10,2),
  currency VARCHAR DEFAULT 'BRL',
  available_quantity INTEGER,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_packages_event_id ON access_packages(event_id);
CREATE INDEX idx_access_packages_package_type ON access_packages(package_type);
CREATE INDEX idx_access_packages_status ON access_packages(status);

COMMENT ON TABLE access_packages IS 'Pacotes de acesso que definem quais áreas o usuário pode acessar';

-- Table: registration_items
CREATE TABLE registration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  access_package_id UUID NOT NULL REFERENCES access_packages(id) ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(registration_id, access_package_id)
);

CREATE INDEX idx_registration_items_registration_id ON registration_items(registration_id);
CREATE INDEX idx_registration_items_access_package_id ON registration_items(access_package_id);
CREATE INDEX idx_registration_items_status ON registration_items(status);

COMMENT ON TABLE registration_items IS 'Items/Pacotes escolhidos durante o pré-cadastro (carrinho de compras)';

-- Table: user_access
CREATE TABLE user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  registration_item_id UUID REFERENCES registration_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  access_package_id UUID NOT NULL REFERENCES access_packages(id) ON DELETE CASCADE,
  acquired_type VARCHAR NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  status VARCHAR DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(registration_id, access_package_id)
);

CREATE INDEX idx_user_access_registration_id ON user_access(registration_id);
CREATE INDEX idx_user_access_registration_item_id ON user_access(registration_item_id);
CREATE INDEX idx_user_access_user_id ON user_access(user_id);
CREATE INDEX idx_user_access_event_id ON user_access(event_id);
CREATE INDEX idx_user_access_access_package_id ON user_access(access_package_id);
CREATE INDEX idx_user_access_status ON user_access(status);
CREATE INDEX idx_user_access_user_event_status ON user_access(user_id, event_id, status);

COMMENT ON TABLE user_access IS 'Acessos efetivos do usuário. Criado quando item é pago/confirmado';

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_areas_updated_at BEFORE UPDATE ON event_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_packages_updated_at BEFORE UPDATE ON access_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_items_updated_at BEFORE UPDATE ON registration_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_access_updated_at BEFORE UPDATE ON user_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_user_instance_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT instance_id FROM public.users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================
-- AUTH INTEGRATION
-- ============================================

-- Function: handle_new_user (VERSÃO FINAL - suporta role e instance_id via metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    instance_id,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'instance_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'instance_id')::uuid
      ELSE NULL 
    END,
    'active',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger: on_auth_user_created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function: handle_user_update (SEM email_verified)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    last_login_at = COALESCE(NEW.last_sign_in_at, OLD.last_sign_in_at),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET search_path = '';

-- Trigger: on_auth_user_updated
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================

-- Users podem ver/editar seus próprios dados
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- SUPERADMIN pode gerenciar tudo
CREATE POLICY "superadmin_all_users"
  ON users FOR ALL
  USING (public.is_superadmin());

-- Organizers podem ver users da mesma instância
CREATE POLICY "organizers_view_instance_users"
  ON users FOR SELECT
  USING (
    public.get_user_role() IN ('organizer', 'staff')
    AND instance_id = public.get_user_instance_id()
  );

-- ============================================
-- RLS POLICIES - INSTANCES
-- ============================================

-- SUPERADMIN pode gerenciar todas as instâncias
CREATE POLICY "superadmin_all_instances"
  ON instances FOR ALL
  USING (public.is_superadmin());

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
-- RLS POLICIES - EVENTS
-- ============================================

-- Users podem ver eventos de sua instância ou publicados
CREATE POLICY "users_view_instance_events"
  ON events FOR SELECT
  USING (
    instance_id IN (
      SELECT instance_id FROM users WHERE id = auth.uid()
    )
    OR
    status = 'published'
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
-- RLS POLICIES - REGISTRATIONS
-- ============================================

-- Users podem ver suas próprias registrations
CREATE POLICY "users_view_own_registrations"
  ON registrations FOR SELECT
  USING (user_id = auth.uid());

-- Users podem criar suas próprias registrations
CREATE POLICY "users_create_own_registrations"
  ON registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users podem atualizar suas próprias registrations
CREATE POLICY "users_update_own_registrations"
  ON registrations FOR UPDATE
  USING (user_id = auth.uid());

-- Organizers/Staff podem ver registrations dos eventos de sua instância
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
-- RLS POLICIES - REGISTRATION ITEMS
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
-- RLS POLICIES - EVENT AREAS
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
-- RLS POLICIES - ACCESS PACKAGES
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
-- RLS POLICIES - USER ACCESS
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
-- HELPER FUNCTIONS - API
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION handle_new_user() IS 'Cria user em public.users quando auth.users é criado (suporta role e instance_id via metadata)';
COMMENT ON FUNCTION handle_user_update() IS 'Sincroniza last_login_at entre auth.users e public.users';
COMMENT ON FUNCTION is_superadmin() IS 'Helper RLS - Verifica se user é superadmin (SECURITY DEFINER)';
COMMENT ON FUNCTION get_user_instance_id() IS 'Helper RLS - Retorna instance_id do user autenticado (SECURITY DEFINER)';
COMMENT ON FUNCTION get_user_role() IS 'Helper RLS - Retorna role do user autenticado (SECURITY DEFINER)';
COMMENT ON FUNCTION get_user_profile() IS 'API - Retorna perfil completo do usuário autenticado';
COMMENT ON FUNCTION get_user_events() IS 'API - Retorna eventos disponíveis com status de inscrição';
COMMENT ON FUNCTION get_user_access_for_event(uuid) IS 'API - Retorna acessos ativos do usuário para um evento';
