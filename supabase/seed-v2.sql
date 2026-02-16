-- ============================================
-- EVENTOS-BFF - SEED DATA
-- Dados de exemplo para desenvolvimento
-- NOVA ESTRUTURA: Instâncias = Empresas de Eventos
-- ============================================

-- ============================================
-- 1. SUPERADMIN (sem instance_id)
-- ============================================
INSERT INTO users (id, email, full_name, phone, role, instance_id, status, email_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'superadmin@eventos-bff.com', 'Bruno Vieira', '+55 27 99999-0001', 'superadmin', NULL, 'active', true);

-- ============================================
-- 2. INSTANCES (Empresas de Gerenciamento de Eventos)
-- ============================================
INSERT INTO instances (id, name, slug, type, status, settings) VALUES
('10000000-0000-0000-0000-000000000001', 'MultiEventos Professional', 'multieventos', 'enterprise', 'active', '{"max_events": 50, "custom_domain": "eventos.multieventos.com.br", "features": ["qrcode", "checkin", "analytics", "custom_branding"]}'),
('10000000-0000-0000-0000-000000000002', 'EventosPro Brasil', 'eventospro', 'premium', 'active', '{"max_events": 20, "features": ["qrcode", "checkin", "analytics"]}'),
('10000000-0000-0000-0000-000000000003', 'Campus Events Manager', 'campus-events', 'standard', 'active', '{"max_events": 10}');

-- ============================================
-- 3. ORGANIZERS (Administradores das Instâncias)
-- ============================================

-- MultiEventos Professional - Organizers
INSERT INTO users (id, instance_id, email, full_name, phone, company, position, role, status, email_verified) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'carlos.silva@multieventos.com.br', 'Carlos Silva', '+55 27 99999-1001', 'MultiEventos', 'CEO', 'organizer', 'active', true),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'maria.santos@multieventos.com.br', 'Maria Santos', '+55 27 99999-1002', 'MultiEventos', 'Diretora de Operações', 'organizer', 'active', true);

-- EventosPro Brasil - Organizer
INSERT INTO users (id, instance_id, email, full_name, phone, company, position, role, status, email_verified) VALUES
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'lucas.admin@eventospro.com.br', 'Lucas Admin', '+55 11 98888-0001', 'EventosPro', 'Diretor Geral', 'organizer', 'active', true);

-- Campus Events Manager - Organizer
INSERT INTO users (id, instance_id, email, full_name, phone, company, position, role, status, email_verified) VALUES
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'coordenacao@campusevents.edu.br', 'Ana Coordenadora', '+55 27 99999-3001', 'UFES', 'Coordenadora de Eventos', 'organizer', 'active', true);

-- ============================================
-- 4. STAFF (Equipe das Instâncias)
-- ============================================

-- MultiEventos Professional - Staff
INSERT INTO users (id, instance_id, email, full_name, phone, company, position, role, status, email_verified) VALUES
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'joao.recep@multieventos.com.br', 'João Recepcionista', '+55 27 99999-1010', 'MultiEventos', 'Recepcionista', 'staff', 'active', true),
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'ana.coord@multieventos.com.br', 'Ana Coordenadora', '+55 27 99999-1011', 'MultiEventos', 'Coordenadora de Campo', 'staff', 'active', true);

-- ============================================
-- 5. EVENTS (Eventos gerenciados pelas instâncias)
-- Instância MultiEventos gerencia: Congresso SBCP + Festa do Colonão
-- ============================================

-- Evento 1: Congresso SBCP (gerenciado por MultiEventos)
INSERT INTO events (id, instance_id, created_by, name, slug, description, event_type, start_date, end_date, venue_name, venue_address, venue_city, venue_state, capacity, status, settings) VALUES
(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Congresso Brasileiro de Cirurgia Plástica 2026',
  'cbcp-2026',
  'O maior evento de cirurgia plástica da América Latina. Organizado pela SBCP com gestão da MultiEventos Professional.',
  'congress',
  '2026-06-15 08:00:00-03',
  '2026-06-18 18:00:00-03',
  'Centro de Convenções de Vitória',
  'Av. Princesa Isabel, 629 - Centro',
  'Vitória',
  'ES',
  2000,
  'published',
  '{"client": "SBCP", "allow_registrations": true, "requires_payment": true, "certificate_enabled": true}'
),
-- Evento 2: Festa do Colonão (gerenciado por MultiEventos)
(
  '30000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Festa do Colonão 2026',
  'festa-colonao-2026',
  'Tradicional festival de Blumenau celebrando a cultura germânica com música, gastronomia e tradição.',
  'fair',
  '2026-10-10 14:00:00-03',
  '2026-10-13 23:00:00-03',
  'Parque Vila Germânica',
  'Rua Alberto Stein, 199',
  'Blumenau',
  'SC',
  5000,
  'published',
  '{"client": "Prefeitura de Blumenau", "allow_registrations": true, "requires_payment": true}'
),
-- Evento 3: Workshop Técnicas Avançadas (gerenciado por MultiEventos)
(
  '30000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  'Workshop de Técnicas Avançadas',
  'workshop-tecnicas-2026',
  'Workshop exclusivo para profissionais da área médica.',
  'workshop',
  '2026-08-20 09:00:00-03',
  '2026-08-20 18:00:00-03',
  'Hotel Senac Ilha do Boi',
  'Av. Estudante José Júlio de Souza, 790',
  'Vitória',
  'ES',
  50,
  'draft',
  '{"client": "SBCP", "requires_payment": true}'
),
-- Evento 4: TechConf IA 2026 (gerenciado por EventosPro)
(
  '30000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  'TechConf 2026 - Inteligência Artificial e o Futuro',
  'techconf-ia-2026',
  'Conferência sobre IA, Machine Learning e o futuro da tecnologia.',
  'conference',
  '2026-09-05 08:00:00-03',
  '2026-09-07 19:00:00-03',
  'Expo Center Norte',
  'Rua José Bernardo Pinto, 333',
  'São Paulo',
  'SP',
  1500,
  'published',
  '{"client": "TechConf Brasil", "allow_registrations": true, "requires_payment": true}'
);

-- ============================================
-- 6. ATTENDEES, SPEAKERS, VIPs
-- (Participantes dos eventos específicos)
-- ============================================

-- Participantes do Congresso SBCP
INSERT INTO users (id, instance_id, email, full_name, phone, document_number, company, position, role, status, email_verified) VALUES
-- Speakers SBCP
('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', 'dra.patricia@hospital.com.br', 'Dra. Patricia Rodrigues', '+55 21 99999-2001', '567.890.123-45', 'Hospital São Lucas', 'Cirurgiã Plástica', 'speaker', 'active', true),
-- VIP SBCP
('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', 'dr.fernando@clinica.com.br', 'Dr. Fernando Costa', '+55 11 99999-3001', '678.901.234-56', 'Clínica Estética VIP', 'Cirurgião', 'vip', 'active', true),
-- Attendees SBCP
('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001', 'julia.almeida@email.com', 'Julia Almeida', '+55 27 99999-4001', '789.012.345-67', 'Clínica Bella', 'Médica Residente', 'attendee', 'active', true),
('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', 'pedro.oliveira@email.com', 'Pedro Oliveira', '+55 27 99999-4002', '890.123.456-78', 'Hospital Infantil', 'Estudante Medicina', 'attendee', 'active', true),
('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000001', 'camila.souza@email.com', 'Camila Souza', '+55 27 99999-4003', '901.234.567-89', 'Universidade XYZ', 'Estudante', 'attendee', 'active', false),
('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001', 'rafael.costa@email.com', 'Rafael Costa', '+55 27 99999-4004', '012.345.678-90', 'Autônomo', 'Cirurgião', 'attendee', 'active', true);

-- Participante TechConf
INSERT INTO users (id, instance_id, email, full_name, phone, company, position, role, status, email_verified) VALUES
('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000002', 'mariana.dev@email.com', 'Mariana Developer', '+55 11 98888-0002', 'StartupXYZ', 'Tech Lead', 'attendee', 'active', true);

-- ============================================
-- 7. EVENT AREAS (Áreas dos eventos)
-- ============================================

-- Áreas do Congresso SBCP
INSERT INTO event_areas (id, event_id, name, code, description, area_type, capacity, floor, status) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Hall Principal', 'HALL-01', 'Área de circulação e coffee break', 'hall', 500, 'Térreo', 'active'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Sala Plenária', 'PLEN-01', 'Auditório principal para palestras', 'room', 800, '1º Andar', 'active'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Sala 1 - Workshops', 'WORK-01', 'Sala para workshops práticos', 'room', 100, '2º Andar', 'active'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'Sala 14 - VIP Lounge', 'VIP-14', 'Área exclusiva VIP com coffee premium', 'vip_lounge', 50, '1º Andar', 'active'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'Área de Stands', 'STANDS', 'Exposição de produtos e serviços', 'stands', 300, 'Térreo', 'active'),
('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 'Backstage', 'BACK-01', 'Área restrita para palestrantes', 'backstage', 30, '1º Andar', 'active');

-- Áreas Festa do Colonão
INSERT INTO event_areas (id, event_id, name, code, description, area_type, capacity, status) VALUES
('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000002', 'Área Geral', 'GERAL', 'Acesso geral ao parque', 'hall', 4000, 'active'),
('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000002', 'Camarote Premium', 'CAM-PREM', 'Camarote com vista privilegiada', 'vip_lounge', 200, 'active'),
('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000002', 'Área Gastronômica', 'GASTRO', 'Praça de alimentação tradicional alemã', 'stands', 800, 'active');

-- ============================================
-- 8. ACCESS PACKAGES (Pacotes de acesso)
-- ============================================

-- Pacotes Congresso SBCP
INSERT INTO access_packages (id, event_id, name, description, package_type, allowed_areas, price, available_quantity, status) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Pacote Básico', 'Acesso às palestras principais e área de stands', 'base', 
  '["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000005"]'::jsonb, 450.00, 1500, 'active'),

('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Acesso Sala 1 Workshops', 'Addon para acesso aos workshops', 'addon', 
  '["40000000-0000-0000-0000-000000000003"]'::jsonb, 200.00, 100, 'active'),

('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Pacote Premium', 'Acesso completo exceto VIP Lounge', 'premium', 
  '["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000003", "40000000-0000-0000-0000-000000000005"]'::jsonb, 800.00, 200, 'active'),

('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'VIP Full Access', 'Acesso total incluindo VIP Lounge e Backstage', 'vip', 
  '["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000003", "40000000-0000-0000-0000-000000000004", "40000000-0000-0000-0000-000000000005", "40000000-0000-0000-0000-000000000006"]'::jsonb, 1500.00, 50, 'active');

-- Pacotes Festa do Colonão
INSERT INTO access_packages (id, event_id, name, description, package_type, allowed_areas, price, available_quantity, status) VALUES
('50000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000002', 'Ingresso Geral', 'Acesso geral ao parque e área gastronômica', 'base',
  '["40000000-0000-0000-0000-000000000010", "40000000-0000-0000-0000-000000000012"]'::jsonb, 80.00, 3800, 'active'),

('50000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000002', 'Camarote Premium', 'Camarote com open bar e menu especial', 'vip',
  '["40000000-0000-0000-0000-000000000010", "40000000-0000-0000-0000-000000000011", "40000000-0000-0000-0000-000000000012"]'::jsonb, 350.00, 200, 'active');

-- ============================================
-- 9. REGISTRATIONS (Inscrições)
-- ============================================

-- Inscrições Congresso SBCP
INSERT INTO registrations (id, event_id, user_id, registration_code, status, badge_name, ticket_type, total_amount, registered_at, payment_requested_at, paid_at, confirmed_at) VALUES
-- Julia - CONFIRMADA
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000022', 'CBCP2026-0001', 'confirmed', 'Dra. Julia Almeida', 'Médica', 650.00, '2026-01-15 10:30:00-03', '2026-01-15 10:35:00-03', '2026-01-15 14:20:00-03', '2026-01-15 14:25:00-03'),

-- Pedro - CONFIRMADO
('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000023', 'CBCP2026-0002', 'confirmed', 'Pedro Oliveira', 'Estudante', 450.00, '2026-01-20 14:00:00-03', '2026-01-20 14:05:00-03', '2026-01-21 09:15:00-03', '2026-01-21 09:20:00-03'),

-- Rafael - CONFIRMADO
('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000025', 'CBCP2026-0003', 'confirmed', 'Dr. Rafael Costa', 'Cirurgião', 1500.00, '2026-01-22 11:00:00-03', '2026-01-22 11:05:00-03', '2026-01-22 15:30:00-03', '2026-01-22 15:35:00-03'),

-- Camila - AGUARDANDO PAGAMENTO
('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000024', 'CBCP2026-0004', 'awaiting_payment', 'Camila Souza', 'Estudante', 450.00, '2026-02-01 09:00:00-03', '2026-02-01 09:10:00-03', NULL, NULL),

-- Dr. Fernando - PRÉ-INSCRITO (carrinho aberto)
('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000021', 'CBCP2026-0005', 'pre_registered', NULL, NULL, 0.00, '2026-02-10 16:30:00-03', NULL, NULL, NULL);

-- Inscrição TechConf
INSERT INTO registrations (id, event_id, user_id, registration_code, status, badge_name, ticket_type, total_amount, registered_at, payment_requested_at, paid_at, confirmed_at) VALUES
('60000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000030', 'TECH2026-0001', 'confirmed', 'Mariana Developer', 'Dev', 350.00, '2026-02-05 10:00:00-03', '2026-02-05 10:05:00-03', '2026-02-05 11:00:00-03', '2026-02-05 11:05:00-03');

-- ============================================
-- 10. REGISTRATION ITEMS (Itens do carrinho)
-- ============================================

-- Julia: Básico + Workshops
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, 450.00, 450.00, 'confirmed', '2026-01-15 10:32:00-03', '2026-01-15 14:20:00-03'),
('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 1, 200.00, 200.00, 'confirmed', '2026-01-15 10:33:00-03', '2026-01-15 14:20:00-03');

-- Pedro: Básico
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 1, 450.00, 450.00, 'confirmed', '2026-01-20 14:02:00-03', '2026-01-21 09:15:00-03');

-- Rafael: VIP Full Access
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', 1, 1500.00, 1500.00, 'confirmed', '2026-01-22 11:02:00-03', '2026-01-22 15:30:00-03');

-- Camila: Básico (aguardando pagamento)
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
('70000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 1, 450.00, 450.00, 'pending_payment', '2026-02-01 09:05:00-03', NULL);

-- Dr. Fernando: Premium (carrinho, não finalizado)
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
('70000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 1, 800.00, 800.00, 'in_cart', '2026-02-10 16:35:00-03', NULL);

-- Mariana: TechConf
INSERT INTO registration_items (id, registration_id, access_package_id, quantity, unit_price, total_price, status, added_at, paid_at) VALUES
('70000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000010', NULL, 1, 350.00, 350.00, 'confirmed', '2026-02-05 10:03:00-03', '2026-02-05 11:00:00-03');

-- ============================================
-- 11. USER ACCESS (Acessos efetivos)
-- Criados automaticamente após confirmação
-- ============================================

-- Julia: 2 acessos (Básico + Workshops)
INSERT INTO user_access (id, registration_id, registration_item_id, user_id, event_id, access_package_id, acquired_type, acquired_at, valid_from, valid_until, status) VALUES
('80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'purchased', '2026-01-15 14:25:00-03', '2026-06-15 00:00:00-03', '2026-06-18 23:59:59-03', 'active'),
('80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'purchased', '2026-01-15 14:25:00-03', '2026-06-15 00:00:00-03', '2026-06-18 23:59:59-03', 'active');

-- Pedro: 1 acesso (Básico)
INSERT INTO user_access (id, registration_id, registration_item_id, user_id, event_id, access_package_id, acquired_type, acquired_at, valid_from, valid_until, status) VALUES
('80000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'purchased', '2026-01-21 09:20:00-03', '2026-06-15 00:00:00-03', '2026-06-18 23:59:59-03', 'active');

-- Rafael: 1 acesso (VIP Full)
INSERT INTO user_access (id, registration_id, registration_item_id, user_id, event_id, access_package_id, acquired_type, acquired_at, valid_from, valid_until, status) VALUES
('80000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000025', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'purchased', '2026-01-22 15:35:00-03', '2026-06-15 00:00:00-03', '2026-06-18 23:59:59-03', 'active');

-- Dra. Patricia: Acesso cortesia (speaker, sem registration)
INSERT INTO user_access (id, registration_id, registration_item_id, user_id, event_id, access_package_id, acquired_type, acquired_at, valid_from, valid_until, status) VALUES
('80000000-0000-0000-0000-000000000005', NULL, NULL, '20000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'complimentary', '2026-01-10 10:00:00-03', '2026-06-15 00:00:00-03', '2026-06-18 23:59:59-03', 'active');

-- Mariana: TechConf
INSERT INTO user_access (id, registration_id, registration_item_id, user_id, event_id, access_package_id, acquired_type, acquired_at, valid_from, valid_until, status) VALUES
('80000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000010', '70000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000004', NULL, 'purchased', '2026-02-05 11:05:00-03', '2026-09-05 00:00:00-03', '2026-09-07 23:59:59-03', 'active');

-- ============================================
-- RESUMO DOS DADOS:
-- - 1 SUPERADMIN
-- - 3 Instâncias (Empresas de Gestão de Eventos)
-- - 4 Organizers (Admins das instâncias)
-- - 2 Staff (MultiEventos)
-- - 7 Participantes (speakers, vips, attendees)
-- - 4 Eventos (2 MultiEventos: SBCP + Colonão, 1 EventosPro: TechConf, 1 Workshop draft)
-- - 9 Áreas de eventos
-- - 7 Pacotes de acesso
-- - 6 Inscribiões (3 confirmed, 1 awaiting, 1 pre-registered, 1 TechConf)
-- - 7 Itens de registro (carrinho)
-- - 6 Acessos ativos
-- - Receita MultiEventos SBCP: R$ 2.600,00 (Julia R$ 650 + Pedro R$ 450 + Rafael R$ 1.500)
-- - Receita EventosPro TechConf: R$ 350,00
-- - TOTAL: R$ 2.950,00
-- ============================================
