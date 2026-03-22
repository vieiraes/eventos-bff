-- ============================================
-- Migration 004: Fix handle_new_user to properly handle instance_id
-- ============================================
-- PROBLEMA IDENTIFICADO:
-- - Organizers criados não estão tendo instance_id salvo na tabela users
-- - Suspeita: conversão de string para UUID pode estar falhando silenciosamente
-- 
-- SOLUÇÃO:
-- - Melhorar validação e conversão de instance_id no trigger
-- - Adicionar tratamento de erro mais robusto
-- - Garantir que instance_id seja salvo corretamente quando fornecido

-- Recriar função handle_new_user com melhor tratamento de instance_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_instance_id UUID;
  v_instance_id_text TEXT;
BEGIN
  -- Extrair instance_id do metadata como texto
  v_instance_id_text := NEW.raw_user_meta_data->>'instance_id';
  
  -- Tentar converter para UUID se não for nulo
  IF v_instance_id_text IS NOT NULL AND v_instance_id_text != '' THEN
    BEGIN
      v_instance_id := v_instance_id_text::uuid;
    EXCEPTION WHEN OTHERS THEN
      -- Se der erro na conversão, deixar NULL e registrar no log do PostgreSQL
      RAISE WARNING 'Failed to convert instance_id to UUID: %. Setting to NULL.', v_instance_id_text;
      v_instance_id := NULL;
    END;
  ELSE
    v_instance_id := NULL;
  END IF;

  -- Inserir usuário na tabela public.users
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
    v_instance_id,  -- Usar a variável validada
    'active',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Cria user em public.users quando auth.users é criado. ' ||
  'Suporta role e instance_id via metadata com validação robusta de UUID.';
