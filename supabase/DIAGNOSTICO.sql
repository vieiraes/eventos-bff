-- ============================================
-- DIAGNÓSTICO COMPLETO - Eventos BFF
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1️⃣ VERIFICAR se existe usuário no auth.users
SELECT 
  '1. VERIFICAR AUTH.USERS' as etapa,
  COUNT(*) as total_usuarios,
  STRING_AGG(email, ', ') as emails
FROM auth.users;

-- 2️⃣ VERIFICAR se existe usuário no public.users
SELECT 
  '2. VERIFICAR PUBLIC.USERS' as etapa,
  COUNT(*) as total_usuarios,
  STRING_AGG(email, ', ') as emails
FROM public.users;

-- 3️⃣ VERIFICAR se a função get_user_profile existe
SELECT 
  '3. VERIFICAR FUNÇÃO get_user_profile' as etapa,
  proname as nome_funcao,
  pg_get_functiondef(oid) as definicao
FROM pg_proc 
WHERE proname = 'get_user_profile';

-- 4️⃣ VERIFICAR se as helper functions existem
SELECT 
  '4. VERIFICAR HELPER FUNCTIONS' as etapa,
  proname as nome_funcao
FROM pg_proc 
WHERE proname IN ('is_superadmin', 'get_user_instance_id', 'get_user_role')
ORDER BY proname;

-- 5️⃣ VERIFICAR se o trigger handle_new_user existe
SELECT 
  '5. VERIFICAR TRIGGER handle_new_user' as etapa,
  tgname as trigger_name,
  tgrelid::regclass as tabela
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 6️⃣ VERIFICAR tabelas criadas
SELECT 
  '6. VERIFICAR TABELAS' as etapa,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 7️⃣ VERIFICAR RLS (Row Level Security)
SELECT 
  '7. VERIFICAR RLS ATIVO' as etapa,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- RESULTADOS ESPERADOS:
-- 
-- 1. AUTH.USERS: Deve ter pelo menos 1 usuário (superadmin)
-- 2. PUBLIC.USERS: Deve ter o mesmo usuário
-- 3. GET_USER_PROFILE: Deve existir a função
-- 4. HELPER FUNCTIONS: Deve mostrar 3 funções
-- 5. TRIGGER: Deve existir on_auth_user_created
-- 6. TABELAS: Deve ter 8 tabelas (instances, users, events, etc)
-- 7. RLS: Todas devem estar com rls_ativo = true
-- ============================================
