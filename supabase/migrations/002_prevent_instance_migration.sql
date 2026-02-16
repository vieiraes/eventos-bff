-- ============================================
-- Migration 002: Prevent Instance Migration
-- ============================================
-- REGRA DE NEGÓCIO:
-- - Uma vez que um usuário (especialmente Organizer) é vinculado a uma instância
-- - Não é possível migrar para outra instância
-- - Se precisar mudar, deve APAGAR o usuário e criar novo
-- - Isso garante integridade e evita confusão de dados entre instâncias

-- Function: Previne mudança de instance_id
CREATE OR REPLACE FUNCTION public.prevent_instance_migration()
RETURNS TRIGGER AS $$
BEGIN
  -- Se instance_id está sendo alterado (não é NULL para NULL ou vice-versa)
  IF OLD.instance_id IS DISTINCT FROM NEW.instance_id THEN
    -- Permite apenas se o OLD.instance_id era NULL (primeira atribuição)
    -- Caso contrário, bloqueia a mudança
    IF OLD.instance_id IS NOT NULL THEN
      RAISE EXCEPTION 'Não é permitido migrar usuário entre instâncias. Regra de negócio: instance_id não pode ser alterado após definido. Se necessário, exclua o usuário e crie um novo.'
        USING HINT = 'Para mudar de instância, delete este usuário e crie um novo vinculado à instância desejada';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Aplica a validação antes de UPDATE
CREATE TRIGGER prevent_instance_migration_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_instance_migration();

COMMENT ON FUNCTION public.prevent_instance_migration() IS 'Previne migração de usuários entre instâncias. Uma vez definido instance_id, não pode ser alterado.';
COMMENT ON TRIGGER prevent_instance_migration_trigger ON public.users IS 'Bloqueia UPDATE que tenta alterar instance_id existente';
