-- ============================================
-- EVENTOS-BFF - Seed Data
-- Dados de exemplo para teste e desenvolvimento
-- ============================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE user_access, registration_items, registrations, access_packages, event_areas, events, users, instances RESTART IDENTITY CASCADE;

-- ============================================
-- 1. SUPERADMIN (sem instance_id)
-- ============================================
INSERT INTO users (id, email, full_name, phone, role, instance_id, status, email_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'superadmin@eventos-bff.com', 'Bruno Vieira', '+55 27 99999-0001', 'superadmin', NULL, 'active', true);

-- ============================================
-- 2. INSTANCES (Clientes SaaS)
-- ============================================
INSERT INTO instances (id, name, slug, type, status, settings) VALUES
('10000000-0000-0000-0000-000000000001', 'SBCP - Sociedade Brasileira de Cirurgia Plástica', 'sbcp', 'enterprise', 'active', '{"max_events": 10, "custom_domain": "eventos.sbcp.org.br"}'),
('10000000-0000-0000-0000-000000000002', 'TechConf Brasil', 'techconf-brasil', 'premium', 'active', '{"max_events": 5, "features": ["qrcode", "checkin"]}'),
('10000000-0000-0000-0000-000000000003', 'Universidade Federal do ES', 'ufes', 'standard', 'active', '{"max_events": 3}');

-- ============================================
-- 3. USERS (Organizadores, Staff, Participantes)
-- ============================================

-- SBCP Users
INSERT INTO users (id, instance_id, email, full_name, phone, document_number, company, position, role, status, email_verified) VALUES
-- Organizers
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'carlos.silva@sbcp.org.br', 'Dr. Carlos Silva', '+55 27 99999-1001', '123.456.789-01', 'SBCP', 'Presidente', 'organizer', 'active', true),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'maria.santos@sbcp.org.br', 'Maria Santos', '+55 27 99999-1002', '234.567.890-12', 'SBCP', 'Coordenadora', 'organizer', 'active', true),

-- Staff
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'joao.recep@eventos.com', 'João Recepção', '+55 27 99999-1003', '345.678.901-23', 'Eventos Inc', 'Recepcionista', 'staff', 'active', true),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'ana.coord@eventos.com', 'Ana Coordenadora', '+55 27 99999-1004', '456.789.012-34', 'Eventos Inc', 'Coordenadora', 'staff', 'active', true),

-- Speakers/VIP
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'dra.patricia@hospital.com.br', 'Dra. Patricia Rodrigues', '+55 21 99999-2001', '567.890.123-45', 'Hospital São Lucas', 'Cirurgiã Plástica', 'speaker', 'active', true),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'dr.fernando@clinica.com.br', 'Dr. Fernando Costa', '+55 11 99999-3001', '678.901.234-56', 'Clínica Estética VIP', 'Cirurgião', 'vip', 'active', true),

-- Attendees
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'julia.almeida@email.com', 'Julia Almeida', '+55 27 99999-4001', '789.012.345-67', 'Clínica Bella', 'Médica Residente', 'attendee', 'active', true),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'pedro.oliveira@email.com', 'Pedro Oliveira', '+55 27 99999-4002', '890.123.456-78', 'Hospital Infantil', 'Estudante Medicina', 'attendee', 'active', true),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'camila.souza@email.com', 'Camila Souza', '+55 27 99999-4003', '901.234.567-89', 'Universidade XYZ', 'Estudante', 'attendee', 'active', false),
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'rafael.costa@email.com', 'Rafael Costa', '+55 27 99999-4004', '012.345.678-90', 'Autônomo', 'Cirurgião', 'attendee', 'active', true);

-- TechConf Users
INSERT INTO users (id, instance_id, email, full_name, phone, company, position, role, status, email_verified) VALUES
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'admin@techconf.com.br', 'Lucas Admin', '+55 11 98888-0001', 'TechConf', 'CEO', 'organizer', 'active', true),
('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'mariana.dev@email.com', 'Mariana Developer', '+55 11 98888-0002', 'StartupXYZ', 'Tech Lead', 'attendee', 'active', true);

-- ============================================
-- 4. EVENTS
-- ============================================
INSERT INTO events (id, instance_id, created_by, name, slug, description, event_type, start_date, end_date, venue_name, venue_address, venue_city, venue_state, capacity, status, settings) VALUES
(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Congresso Brasileiro de Cirurgia Plástica 2026',
  'cbcp-2026',
  'O maior evento de cirurgia plástica da América Latina. Palestras, workshops, área de exposição e networking.',
  'congress',
  '2026-06-15 08:00:00-03',
  '2026-06-18 18:00:00-03',
  'Centro de Convenções de Vitória',
  'Av. Princesa Isabel, 629 - Centro',
  'Vitória',
  'ES',
  2000,
  'published',
  '{"allow_registrations": true, "requires_payment": true, "certificate_enabled": true}'
),
(
  '30000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  'Workshop de Técnicas Avançadas',
  'workshop-tecnicas-2026',
  'Workshop exclusivo com técnicas avançadas em procedimentos estéticos.',
  'workshop',
  '2026-08-10 14:00:00-03',
  '2026-08-10 18:00:00-03',
  'Hotel Golden Tulip',
  'Av. Saturnino de Brito, 123',
  'Vitória',
  'ES',
  50,
  'draft',
  '{"allow_registrations": false}'
),
(
  '30000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000011',
  'TechConf 2026 - IA e Futuro',
  'techconf-2026',
  'Conferência sobre Inteligência Artificial, Web3 e o futuro da tecnologia.',
  'conference',
  '2026-09-20 09:00:00-03',
  '2026-09-22 19:00:00-03',
  'São Paulo Expo',
  'Rodovia dos Imigrantes, km 1.5',
  'São Paulo',
  'SP',
  5000,
  'published',
  '{"allow_registrations": true, "requires_payment": true}'
);

-- ============================================
-- 5. EVENT AREAS (Salas/Áreas do evento)
-- ============================================
INSERT INTO event_areas (id, event_id, name, code, description, area_type, capacity, floor, status) VALUES
-- CBCP 2026
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Hall Principal', 'HALL', 'Área de credenciamento e networking', 'hall', 500, 'Térreo', 'active'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Sala Plenária', 'PLEN', 'Palestras principais', 'room', 800, '1º andar', 'active'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Sala 1 - Workshops', 'S1', 'Workshops práticos', 'room', 100, '2º andar', 'active'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'Sala 14 - VIP', 'S14', 'Área exclusiva para palestrantes e VIPs', 'vip_lounge', 50, '3º andar', 'active'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'Área de Stands', 'STANDS', 'Exposição de produtos e serviços', 'stands', 300, 'Térreo', 'active'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 'Backstage', 'BACK', 'Acesso restrito à equipe', 'backstage', 20, '1º andar', 'active'),

-- TechConf 2026
('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 'Auditório Principal', 'AUD1', 'Keynotes e palestras principais', 'room', 2000, 'Piso 1', 'active'),
('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', 'Sala Workshops', 'WORK', 'Workshops técnicos', 'room', 200, 'Piso 2', 'active'),
('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 'Lounge VIP', 'VIP', 'Área VIP para speakers', 'vip_lounge', 100, 'Piso 3', 'active');

-- ============================================
-- 6. ACCESS PACKAGES (Pacotes de Acesso)
-- ============================================
INSERT INTO access_packages (id, event_id, name, description, package_type, allowed_areas, price, available_quantity, status) VALUES
-- CBCP 2026
(
  '50000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'Ingresso Básico',
  'Acesso ao hall, plenária e área de stands',
  'base',
  '["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000005"]',
  450.00,
  1500,
  'active'
),
(
  '50000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000001',
  'Acesso Sala 1',
  'Addon - Acesso aos workshops da Sala 1',
  'addon',
  '["40000000-0000-0000-0000-000000000003"]',
  200.00,
  100,
  'active'
),
(
  '50000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000001',
  'Pacote Premium',
  'Acesso total exceto Sala 14 VIP',
  'premium',
  '["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000003", "40000000-0000-0000-0000-000000000005"]',
  800.00,
  200,
  'active'
),
(
  '50000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000001',
  'VIP Full Access',
  'Acesso total incluindo Sala 14 VIP',
  'vip',
  '["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000003", "40000000-0000-0000-0000-000000000004", "40000000-0000-0000-0000-000000000005"]',
  1500.00,
  50,
  'active'
),

-- TechConf 2026
(
  '50000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000003',
  'Ingresso Geral',
  'Acesso ao auditório principal',
  'base',
  '["40000000-0000-0000-0000-000000000007"]',
  350.00,
  4000,
  'active'
),
(
  '50000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000003',
  'Full Access',
  'Acesso total incluindo VIP Lounge',
  'vip',
  '["40000000-0000-0000-0000-000000000007", "40000000-0000-0000-0000-000000000008", "40000000-0000-0000-0000-000000000009"]',
  1200.00,
  100,
  'active'
);

-- ============================================
-- 7. REGISTRATIONS (Inscrições)
-- ============================================
INSERT INTO registrations (id, event_id, user_id, registration_code, status, badge_name, ticket_type, total_amount, registered_at, payment_requested_at, paid_at, confirmed_at) VALUES
-- CBCP 2026 - Confirmadas (pagas)
(
  '60000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000007',
  'CBCP2026-0001',
  'confirmed',
  'Julia Almeida',
  'early_bird',
  650.00,
  '2026-02-01 10:30:00-03',
  '2026-02-01 10:35:00-03',
  '2026-02-01 11:00:00-03',
  '2026-02-01 11:01:00-03'
),
(
  '60000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000008',
  'CBCP2026-0002',
  'confirmed',
  'Pedro Oliveira',
  'regular',
  800.00,
  '2026-02-05 14:20:00-03',
  '2026-02-05 14:25:00-03',
  '2026-02-05 15:30:00-03',
  '2026-02-05 15:31:00-03'
),
(
  '60000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000010',
  'CBCP2026-0003',
  'confirmed',
  'Dr. Rafael Costa',
  'vip',
  1500.00,
  '2026-02-10 09:00:00-03',
  '2026-02-10 09:05:00-03',
  '2026-02-10 09:30:00-03',
  '2026-02-10 09:31:00-03'
),

-- Aguardando pagamento
(
  '60000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000009',
  'CBCP2026-0004',
  'awaiting_payment',
  'Camila Souza',
  'regular',
  450.00,
  '2026-02-15 16:45:00-03',
  '2026-02-15 16:50:00-03',
  NULL,
  NULL
),

-- Pré-cadastro (carrinho não finalizado)
(
  '60000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000006',
  'CBCP2026-0005',
  'pre_registered',
  'Dr. Fernando Costa',
  NULL,
  0,
  '2026-02-16 08:00:00-03',
  NULL,
  NULL,
  NULL
),

-- TechConf 2026
(
  '60000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000012',
  'TECH2026-0001',
  'confirmed',
  'Mariana Developer',
  'regular',
  350.00,
  '2026-02-12 11:00:00-03',
  '2026-02-12 11:05:00-03',
  '2026-02-12 11:30:00-03',
  '2026-02-12 11:31:00-03'
);

-- ============================================
-- 8. REGISTRATION ITEMS (Carrinho de compras)
-- ============================================
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
-- Julia (Básico + Sala 1)
(
  '70000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  1,
  450.00,
  450.00,
  'paid',
  '2026-02-01 10:30:00-03',
  '2026-02-01 11:00:00-03'
),
(
  '70000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  1,
  200.00,
  200.00,
  'paid',
  '2026-02-01 10:32:00-03',
  '2026-02-01 11:00:00-03'
),

-- Pedro (Premium)
(
  '70000000-0000-0000-0000-000000000003',
  '60000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000003',
  1,
  800.00,
  800.00,
  'paid',
  '2026-02-05 14:20:00-03',
  '2026-02-05 15:30:00-03'
),

-- Rafael (VIP Full)
(
  '70000000-0000-0000-0000-000000000004',
  '60000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000004',
  1,
  1500.00,
  1500.00,
  'paid',
  '2026-02-10 09:00:00-03',
  '2026-02-10 09:30:00-03'
),

-- Camila (Básico - aguardando pagamento)
(
  '70000000-0000-0000-0000-000000000005',
  '60000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000001',
  1,
  450.00,
  450.00,
  'pending',
  '2026-02-15 16:45:00-03',
  NULL
),

-- Fernando (pré-cadastro - items no carrinho)
(
  '70000000-0000-0000-0000-000000000006',
  '60000000-0000-0000-0000-000000000005',
  '50000000-0000-0000-0000-000000000003',
  1,
  800.00,
  800.00,
  'pending',
  '2026-02-16 08:05:00-03',
  NULL
),

-- Mariana (TechConf)
(
  '70000000-0000-0000-0000-000000000007',
  '60000000-0000-0000-0000-000000000006',
  '50000000-0000-0000-0000-000000000005',
  1,
  350.00,
  350.00,
  'paid',
  '2026-02-12 11:00:00-03',
  '2026-02-12 11:30:00-03'
);

-- ============================================
-- 9. USER ACCESS (Acessos efetivos)
-- ============================================
INSERT INTO user_access (id, registration_id, registration_item_id, user_id, event_id, access_package_id, acquired_type, acquired_at, valid_from, valid_until, status) VALUES
-- Julia - Básico + Sala 1
(
  '80000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000007',
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  'purchased',
  '2026-02-01 11:01:00-03',
  '2026-06-15 00:00:00-03',
  '2026-06-18 23:59:59-03',
  'active'
),
(
  '80000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000007',
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  'purchased',
  '2026-02-01 11:01:00-03',
  '2026-06-15 00:00:00-03',
  '2026-06-18 23:59:59-03',
  'active'
),

-- Pedro - Premium
(
  '80000000-0000-0000-0000-000000000003',
  '60000000-0000-0000-0000-000000000002',
  '70000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000008',
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000003',
  'purchased',
  '2026-02-05 15:31:00-03',
  '2026-06-15 00:00:00-03',
  '2026-06-18 23:59:59-03',
  'active'
),

-- Rafael - VIP Full
(
  '80000000-0000-0000-0000-000000000004',
  '60000000-0000-0000-0000-000000000003',
  '70000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000010',
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000004',
  'purchased',
  '2026-02-10 09:31:00-03',
  '2026-06-15 00:00:00-03',
  '2026-06-18 23:59:59-03',
  'active'
),

-- Dra. Patricia - Acesso cortesia (palestrante)
(
  '80000000-0000-0000-0000-000000000005',
  NULL, -- Sem registration, acesso direto
  NULL,
  '20000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000004',
  'complimentary',
  '2026-02-01 10:00:00-03',
  '2026-06-15 00:00:00-03',
  '2026-06-18 23:59:59-03',
  'active'
),

-- Mariana - TechConf
(
  '80000000-0000-0000-0000-000000000006',
  '60000000-0000-0000-0000-000000000006',
  '70000000-0000-0000-0000-000000000007',
  '20000000-0000-0000-0000-000000000012',
  '30000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000005',
  'purchased',
  '2026-02-12 11:31:00-03',
  '2026-09-20 00:00:00-03',
  '2026-09-22 23:59:59-03',
  'active'
);

-- ============================================
-- Summary
-- ============================================
-- Total inserido:
-- - 1 SUPERADMIN
-- - 3 Instances (SBCP, TechConf, UFES)
-- - 12 Users (organizers, staff, speakers, vips, attendees)
-- - 3 Events (1 published SBCP, 1 draft SBCP, 1 published TechConf)
-- - 9 Event Areas (6 SBCP, 3 TechConf)
-- - 6 Access Packages (4 SBCP, 2 TechConf)
-- - 6 Registrations (diferentes status: confirmed, awaiting_payment, pre_registered)
-- - 7 Registration Items (pacotes no carrinho)
-- - 6 User Access (acessos efetivos incluindo 1 cortesia)
-- ============================================
