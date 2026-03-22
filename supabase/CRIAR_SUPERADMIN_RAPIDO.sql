-- ============================================
-- CRIAR SUPERADMIN RAPIDAMENTE
-- Execute este código no Supabase Dashboard → SQL Editor
-- ============================================

-- 1️⃣ CRIAR SUPERADMIN no auth.users (com senha)
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
)
ON CONFLICT (id) DO NOTHING;

-- 2️⃣ VERIFICAR se foi criado
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email = 'superadmin@eventos-bff.com';

-- 3️⃣ VERIFICAR se existe em public.users também (trigger deve ter criado)
SELECT 
  id,
  email,
  full_name,
  role,
  instance_id,
  status,
  created_at
FROM public.users 
WHERE email = 'superadmin@eventos-bff.com';

-- ============================================
-- Se deu tudo certo, você verá:
-- ✅ 1 registro em auth.users
-- ✅ 1 registro em public.users
--
-- AGORA PODE FAZER LOGIN:
-- Email: superadmin@eventos-bff.com
-- Senha: superadmin123
-- ============================================
