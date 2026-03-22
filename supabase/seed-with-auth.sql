-- ============================================
-- EVENTOS-BFF - SEED DATA WITH AUTH
-- IMPORTANTE: Este seed cria usuários COM senha no Supabase Auth
-- ============================================

-- ============================================
-- PART 1: CRIAR SUPERADMIN NO SUPABASE AUTH
-- ============================================
-- Senha: superadmin123
-- IMPORTANTE: Execute este INSERT no Supabase Auth (schema auth)

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'superadmin@eventos-bff.com',
  -- Senha: superadmin123 (hasheada com bcrypt)
  crypt('superadmin123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Bruno Vieira", "role": "superadmin", "phone": "+55 27 99999-0001"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- O trigger handle_new_user() criará automaticamente em public.users
-- com role='superadmin' e instance_id=NULL

-- ============================================
-- PART 2: INSTANCES (Empresas de Gestão de Eventos)
-- ============================================
INSERT INTO instances (id, name, slug, type, status, settings) VALUES
('10000000-0000-0000-0000-000000000001', 'MultiEventos Professional', 'multieventos', 'enterprise', 'active', '{"max_events": 50, "custom_domain": "eventos.multieventos.com.br", "features": ["qrcode", "checkin", "analytics", "custom_branding"]}'),
('10000000-0000-0000-0000-000000000002', 'EventosPro Brasil', 'eventospro', 'premium', 'active', '{"max_events": 20, "features": ["qrcode", "checkin", "analytics"]}'),
('10000000-0000-0000-0000-000000000003', 'Campus Events Manager', 'campus-events', 'standard', 'active', '{"max_events": 10}');

-- ============================================
-- PART 3: ORGANIZERS COM AUTH (Opcional)
-- ============================================
-- Se quiser criar organizers com senha, use este template:

-- Organizer 1: carlos.silva@multieventos.com.br (senha: carlos123)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '20000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'carlos.silva@multieventos.com.br',
  crypt('carlos123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Carlos Silva", "role": "organizer", "instance_id": "10000000-0000-0000-0000-000000000001", "phone": "+55 27 99999-1001", "company": "MultiEventos", "position": "CEO"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Organizer 2: maria.santos@multieventos.com.br (senha: maria123)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '20000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'maria.santos@multieventos.com.br',
  crypt('maria123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Maria Santos", "role": "organizer", "instance_id": "10000000-0000-0000-0000-000000000001", "phone": "+55 27 99999-1002", "company": "MultiEventos", "position": "Diretora de Operações"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Organizer 3: lucas.admin@eventospro.com.br (senha: lucas123)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '20000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'lucas.admin@eventospro.com.br',
  crypt('lucas123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Lucas Admin", "role": "organizer", "instance_id": "10000000-0000-0000-0000-000000000002", "phone": "+55 11 98888-0001", "company": "EventosPro", "position": "Diretor Geral"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- ============================================
-- PART 4: CONTINUAR COM O SEED PADRÃO
-- Agora execute o restante do seed-v2.sql (a partir de EVENTS)
-- ============================================

-- Nota: Os organizers acima terão registros criados automaticamente em public.users
-- via trigger handle_new_user()

-- Para o restante dos dados (events, areas, packages, etc), 
-- execute o arquivo seed-v2.sql começando da linha de EVENTS.

-- ============================================
-- RESUMO DOS LOGINS CRIADOS:
-- ============================================
-- Email: superadmin@eventos-bff.com
-- Senha: superadmin123
-- Role: superadmin
--
-- Email: carlos.silva@multieventos.com.br
-- Senha: carlos123
-- Role: organizer (MultiEventos)
--
-- Email: maria.santos@multieventos.com.br
-- Senha: maria123
-- Role: organizer (MultiEventos)
--
-- Email: lucas.admin@eventospro.com.br
-- Senha: lucas123
-- Role: organizer (EventosPro)
-- ============================================
