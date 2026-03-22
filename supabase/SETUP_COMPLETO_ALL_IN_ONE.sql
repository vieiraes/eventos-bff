-- ============================================
-- SETUP COMPLETO ALL-IN-ONE - Eventos BFF
-- Execute TUDO de uma vez no Supabase SQL Editor
-- ============================================

-- PASSO 1: Criar Extension (se não existir)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PASSO 2: Deletar usuário existente (se houver problema)
DELETE FROM auth.users WHERE email = 'superadmin@eventos-bff.com';
DELETE FROM public.users WHERE email = 'superadmin@eventos-bff.com';

-- PASSO 3: Criar SUPERADMIN no auth.users
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

-- PASSO 4: Criar em public.users MANUALMENTE (caso trigger não exista ainda)
INSERT INTO public.users (
  id,
  email,
  full_name,
  phone,
  role,
  instance_id,
  status,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'superadmin@eventos-bff.com',
  'Bruno Vieira',
  '+55 27 99999-0001',
  'superadmin',
  NULL,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  instance_id = EXCLUDED.instance_id,
  status = EXCLUDED.status,
  updated_at = NOW();

-- PASSO 5: Verificar se foi criado corretamente
SELECT 
  '✅ RESULTADO FINAL' as status,
  'auth.users' as tabela,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email = 'superadmin@eventos-bff.com'

UNION ALL

SELECT 
  '✅ RESULTADO FINAL' as status,
  'public.users' as tabela,
  email,
  status = 'active' as email_confirmado,
  role
FROM public.users 
WHERE email = 'superadmin@eventos-bff.com';

-- ============================================
-- RESULTADO ESPERADO:
-- Deve mostrar 2 linhas:
-- 1. auth.users | superadmin@eventos-bff.com | true | superadmin
-- 2. public.users | superadmin@eventos-bff.com | true | superadmin
--
-- AGORA PODE TESTAR O LOGIN:
-- Email: superadmin@eventos-bff.com
-- Senha: superadmin123
-- ============================================

-- BONUS: Criar instância de teste (opcional)
INSERT INTO public.instances (id, name, slug, type, status, settings)
VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'MultiEventos Professional',
  'multieventos',
  'enterprise',
  'active',
  '{"max_events": 50}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Mostrar resumo final
SELECT 
  'USUÁRIOS CRIADOS' as resumo,
  COUNT(*) as total,
  STRING_AGG(email || ' (' || role || ')', ', ') as usuarios
FROM public.users;
