-- ============================================
-- EVENTOS-BFF - Initial Schema Migration
-- Sistema SaaS Multi-tenant para Gestão de Eventos Corporativos
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: instances
-- ============================================
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

-- Indexes
CREATE INDEX idx_instances_slug ON instances(slug);
CREATE INDEX idx_instances_status ON instances(status);

-- Comments
COMMENT ON TABLE instances IS 'Instância SaaS - Uma empresa pode criar N eventos. Cada instância é isolada.';
COMMENT ON COLUMN instances.type IS 'standard, enterprise, premium';
COMMENT ON COLUMN instances.status IS 'active, suspended, cancelled';

-- ============================================
-- Table: users
-- ============================================
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
  email_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_instance_id ON users(instance_id);
CREATE INDEX idx_users_instance_role ON users(instance_id, role);
CREATE INDEX idx_users_document_number ON users(document_number);

-- Comments
COMMENT ON TABLE users IS 'Usuários do sistema - TUDO é user (participantes, organizadores, staff, palestrantes, vip)';
COMMENT ON COLUMN users.instance_id IS 'Null apenas para SUPERADMIN';
COMMENT ON COLUMN users.role IS 'superadmin, organizer, staff, attendee, speaker, vip';
COMMENT ON COLUMN users.status IS 'active, inactive, blocked';
COMMENT ON COLUMN users.metadata IS 'Dados adicionais flexíveis (dietary_restrictions, special_needs, etc)';

-- ============================================
-- Table: events
-- ============================================
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

-- Indexes
CREATE INDEX idx_events_instance_id ON events(instance_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);

-- Comments
COMMENT ON TABLE events IS 'Eventos criados por uma instância. Ex: Congresso de Cirurgia Plástica 2026';
COMMENT ON COLUMN events.event_type IS 'conference, workshop, seminar, congress, fair';
COMMENT ON COLUMN events.status IS 'draft, published, ongoing, completed, cancelled';
COMMENT ON COLUMN events.venue_name IS 'e.g., Centro de Convenções de Vitória';

-- ============================================
-- Table: registrations
-- ============================================
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

-- Indexes
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_code ON registrations(registration_code);

-- Comments
COMMENT ON TABLE registrations IS 'Inscrições no evento - Rastreia funil desde pré-cadastro até confirmação';
COMMENT ON COLUMN registrations.registration_code IS 'Código único da inscrição: VET2026-0001';
COMMENT ON COLUMN registrations.status IS 'pre_registered, awaiting_payment, paid, confirmed, cancelled, expired';
COMMENT ON COLUMN registrations.ticket_type IS 'early_bird, regular, vip, free';
COMMENT ON COLUMN registrations.total_amount IS 'Soma de todos os registration_items';

-- ============================================
-- Table: event_areas
-- ============================================
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

-- Indexes
CREATE INDEX idx_event_areas_event_id ON event_areas(event_id);
CREATE INDEX idx_event_areas_area_type ON event_areas(area_type);

-- Comments
COMMENT ON TABLE event_areas IS 'Áreas/salas do evento. Controle de acesso via access_packages.';
COMMENT ON COLUMN event_areas.name IS 'Sala 1, Sala 14, Área de Stands, Hall Principal';
COMMENT ON COLUMN event_areas.code IS 'S1, S14, STANDS, HALL - Identificador curto';
COMMENT ON COLUMN event_areas.area_type IS 'room, hall, stands, vip_lounge, entrance, backstage';
COMMENT ON COLUMN event_areas.status IS 'active, inactive, maintenance';

-- ============================================
-- Table: access_packages
-- ============================================
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

-- Indexes
CREATE INDEX idx_access_packages_event_id ON access_packages(event_id);
CREATE INDEX idx_access_packages_package_type ON access_packages(package_type);
CREATE INDEX idx_access_packages_status ON access_packages(status);

-- Comments
COMMENT ON TABLE access_packages IS 'Pacotes de acesso que definem quais áreas o usuário pode acessar.';
COMMENT ON COLUMN access_packages.name IS 'Básico, Premium, Full Access, Acesso Sala 14';
COMMENT ON COLUMN access_packages.package_type IS 'base, addon, premium, vip';
COMMENT ON COLUMN access_packages.allowed_areas IS 'Array de IDs de event_areas que este pacote libera';
COMMENT ON COLUMN access_packages.status IS 'active, inactive, sold_out';

-- ============================================
-- Table: registration_items
-- ============================================
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

-- Indexes
CREATE INDEX idx_registration_items_registration_id ON registration_items(registration_id);
CREATE INDEX idx_registration_items_access_package_id ON registration_items(access_package_id);
CREATE INDEX idx_registration_items_status ON registration_items(status);

-- Comments
COMMENT ON TABLE registration_items IS 'Items/Pacotes escolhidos durante o pré-cadastro. Funciona como carrinho de compras.';
COMMENT ON COLUMN registration_items.quantity IS 'Quantidade de pacotes (geralmente 1)';
COMMENT ON COLUMN registration_items.unit_price IS 'Preço unitário no momento da compra';
COMMENT ON COLUMN registration_items.total_price IS 'quantity * unit_price';
COMMENT ON COLUMN registration_items.status IS 'pending, paid, cancelled';

-- ============================================
-- Table: user_access
-- ============================================
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

-- Indexes
CREATE INDEX idx_user_access_registration_id ON user_access(registration_id);
CREATE INDEX idx_user_access_registration_item_id ON user_access(registration_item_id);
CREATE INDEX idx_user_access_user_id ON user_access(user_id);
CREATE INDEX idx_user_access_event_id ON user_access(event_id);
CREATE INDEX idx_user_access_access_package_id ON user_access(access_package_id);
CREATE INDEX idx_user_access_status ON user_access(status);
CREATE INDEX idx_user_access_user_event_status ON user_access(user_id, event_id, status);

-- Comments
COMMENT ON TABLE user_access IS 'Acessos efetivos do usuário. Criado quando registration_item é pago/confirmado.';
COMMENT ON COLUMN user_access.registration_id IS 'NULL para acessos cortesia/diretos sem inscrição formal';
COMMENT ON COLUMN user_access.registration_item_id IS 'Item específico que originou este acesso';
COMMENT ON COLUMN user_access.acquired_type IS 'purchased, complimentary, upgraded, sponsor';
COMMENT ON COLUMN user_access.status IS 'active, expired, revoked';

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- Row Level Security (RLS) - Basic Setup
-- ============================================

-- Enable RLS on all tables
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

-- Basic policies (você pode refinar depois)
-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to view events from their instance
CREATE POLICY "Users can view instance events" ON events
  FOR SELECT USING (
    instance_id IN (
      SELECT instance_id FROM users WHERE id::text = auth.uid()::text
    )
  );

-- ============================================
-- Initial Data - SUPERADMIN (Optional)
-- ============================================

-- Você pode criar o primeiro SUPERADMIN aqui ou via Supabase Auth
-- INSERT INTO users (id, email, full_name, role, instance_id, status)
-- VALUES (
--   'uuid-do-superadmin',
--   'admin@eventos-bff.com',
--   'Super Admin',
--   'superadmin',
--   NULL,
--   'active'
-- );
