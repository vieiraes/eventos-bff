-- ============================================
-- Migration 006: Organizer Manage Registrations
-- ============================================
-- REGRA DE NEGÓCIO:
-- - Organizers podem criar/editar registrations dos eventos de sua instância
-- - Útil para onboarding rápido durante check-in (vincular user ao evento)
-- - Organizers podem criar registrations para qualquer user da sua instância em qualquer evento da sua instância

-- 1. Policy para Organizers CRIAR registrations (vincular users aos eventos)
CREATE POLICY "organizers_create_event_registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (
    -- Quem está criando deve ser organizer
    public.get_user_role() = 'organizer'
    -- O evento deve pertencer à instância do organizer
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.instance_id = public.get_user_instance_id()
    )
    -- O usuário deve pertencer à instância do organizer
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_id
      AND users.instance_id = public.get_user_instance_id()
    )
  );

-- 2. Policy para Organizers ATUALIZAR registrations dos eventos de sua instância
CREATE POLICY "organizers_update_event_registrations"
  ON public.registrations FOR UPDATE
  USING (
    -- Quem está editando deve ser organizer
    public.get_user_role() = 'organizer'
    -- O evento deve pertencer à instância do organizer
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.instance_id = public.get_user_instance_id()
    )
  )
  WITH CHECK (
    -- O evento atualizado deve continuar sendo da mesma instância
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.instance_id = public.get_user_instance_id()
    )
  );

-- Comentários explicativos
COMMENT ON POLICY "organizers_create_event_registrations" ON public.registrations IS 
  'Permite Organizers criarem registrations para vincular users aos eventos da instância (check-in rápido).';

COMMENT ON POLICY "organizers_update_event_registrations" ON public.registrations IS 
  'Permite Organizers editarem registrations dos eventos da instância (atualizar status, badge_name, etc).';
