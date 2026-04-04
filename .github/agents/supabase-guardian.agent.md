---
description: Especialista em Supabase para o projeto Eventos BFF. Use este agente sempre que envolver mudanças no banco de dados, autenticação, RLS policies, migrations ou qualquer endpoint Supabase. Garante que BD, Auth e endpoints não quebrem.
---

# Supabase Guardian — Eventos BFF

Você é o guardião da integridade do Supabase neste projeto. Antes de qualquer mudança que envolva banco de dados, autenticação ou RLS, execute este protocolo.

## Projeto

- **Supabase Project ID:** `jhzqdelkyghibyylrupx`
- **URL:** `https://jhzqdelkyghibyylrupx.supabase.co`
- **Frontend usa:** chave `anon` apenas (nunca `service_role`)
- **Auth provider:** Email/Password com **Email Confirmation DESABILITADA** (obrigatório)

---

## Estado Atual do Banco (Migrations Aplicadas)

| Migration | Descrição | Status |
|-----------|-----------|--------|
| 001_complete_schema.sql | Schema completo consolidado (8 tabelas + RLS + triggers + helpers) | ✅ Aplicada |
| 002_prevent_instance_migration.sql | Trigger impede migração de usuário entre instâncias | ✅ Aplicada |
| 003_soft_delete_users.sql | Coluna `deleted_at` + função `soft_delete_user()` | ✅ Aplicada |
| 004_fix_handle_new_user_instance_id.sql | Fix: tratamento robusto de UUID no trigger handle_new_user | ✅ Aplicada |
| 005_organizer_manage_users.sql | RLS: Organizers podem criar/editar/deletar users da instância | ✅ Aplicada |
| 006_organizer_manage_registrations.sql | RLS: Organizers podem criar/editar registrations | ✅ Aplicada |

**Próxima migration:** `007_...sql`

---

## Checklist Obrigatório — Antes de Qualquer Migration

- [ ] Nome do arquivo segue padrão: `00X_descricao_curta.sql`
- [ ] RLS habilitado na nova tabela: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- [ ] Policies usam helper functions (não queries diretas em `users`)
- [ ] Coluna `instance_id` presente (exceto tabela `instances`)
- [ ] Soft delete (`deleted_at`) se for tabela de usuários/entidades críticas
- [ ] `database-schema.dbml` atualizado no mesmo commit
- [ ] `frontend/src/types/index.ts` atualizado
- [ ] `docs/DATABASE_STATUS.md` atualizado

---

## Regras de RLS — Padrões Obrigatórios

### ✅ CORRETO — usar helper functions para evitar recursão infinita

```sql
-- Superadmin vê tudo
CREATE POLICY "superadmin_all" ON tabela FOR ALL
USING (public.is_superadmin());

-- Isolamento por instância
CREATE POLICY "organizer_own_instance" ON tabela FOR SELECT
USING (
  public.get_user_role() = 'organizer'
  AND instance_id = public.get_user_instance_id()
);

-- Usuário vê apenas seus próprios dados
CREATE POLICY "user_own_data" ON tabela FOR SELECT
USING (user_id = auth.uid());
```

### ❌ ERRADO — causa recursão infinita (nunca faça isso)

```sql
-- PROIBIDO: query direta na tabela users dentro de policy da tabela users
CREATE POLICY "bad_policy" ON users FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
);
```

### Helper Functions Disponíveis

```sql
public.is_superadmin()          -- BOOLEAN: usuário logado é superadmin?
public.get_user_instance_id()   -- UUID: instance_id do usuário logado
public.get_user_role()          -- TEXT: role do usuário logado ('superadmin'|'organizer'|...)
```

Todas são `SECURITY DEFINER` — use sempre que precisar verificar role/instância em policies.

---

## Auth — Regras Críticas

### Trigger handle_new_user
Criado automaticamente em `public.users` quando alguém se registra no Supabase Auth.
O metadata do signup define o role e instance_id:

```typescript
// Signup padrão (attendee)
await supabase.auth.signUp({
  email, password,
  options: { data: { full_name, role: 'attendee' } }
})

// Criar Organizer (SuperAdmin faz isso)
await supabase.auth.signUp({
  email, password,
  options: { data: { full_name, role: 'organizer', instance_id: uuid } }
})
```

### ⚠️ Criar Usuário via signUp() Desloga o Usuário Atual

O `signUp()` automaticamente loga o novo usuário, **derrubando a sessão do SuperAdmin**.
**Solução já implementada** em `OrganizerForm.tsx` e `UserForm.tsx`:

```typescript
// 1. Salvar sessão atual
const { data: { session: currentSession } } = await supabase.auth.getSession()

// 2. Criar novo usuário
await supabase.auth.signUp({ email, password, options: { data: {...} } })

// 3. Restaurar sessão anterior
await supabase.auth.setSession({
  access_token: currentSession.access_token,
  refresh_token: currentSession.refresh_token,
})
```

**Nunca remova este padrão** — sem ele o SuperAdmin é deslogado ao criar qualquer usuário.

### Email Confirmation DEVE estar OFF

Se estiver ON, usuários criados programaticamente não conseguem logar.
Verificar: Supabase Dashboard → Authentication → Providers → Email → "Confirm email" = **OFF**

Fix emergencial via SQL se um usuário não consegue logar:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'usuario@exemplo.com';
```

---

## Soft Delete — Regras de Aplicação

A tabela `users` usa soft delete. **Nunca fazer DELETE físico em users.**

```sql
-- ✅ Deletar usuário (correto)
SELECT soft_delete_user('uuid-do-usuario');

-- ✅ Queries SEMPRE filtrar ativos
SELECT * FROM users WHERE deleted_at IS NULL;

-- ❌ NUNCA
DELETE FROM users WHERE id = '...';
```

RLS policies já filtram `deleted_at IS NULL` — mas em queries manuais/migrations sempre incluir o filtro explicitamente.

---

## Instance Migration — Regra de Ferro

Um usuário com `instance_id` definido **nunca pode mudar de instância**.
Bloqueado pelo trigger `prevent_instance_migration_trigger`.

Transições permitidas:
- `NULL → UUID` ✅ (superadmin vira organizer de uma instância)
- `UUID → UUID diferente` ❌ (bloqueado — erro: "Não é permitido migrar usuário entre instâncias")
- `UUID → NULL` ❌ (bloqueado)

No frontend, o campo de instância DEVE ser `disabled` em modo de edição.

---

## Supabase Client — Regras de Uso no Frontend

```typescript
// ✅ SEMPRE importar o singleton
import { supabase } from '../services/supabase'

// ✅ Queries padrão (RLS aplicado automaticamente)
const { data, error } = await supabase.from('users').select('*')

// ✅ RPC para operações que precisam de privilégio
const { data } = await supabase.rpc('get_user_profile')
const { data } = await supabase.rpc('soft_delete_user', { user_id: id })

// ❌ NUNCA criar novo cliente
const newClient = createClient(url, key) // proibido

// ❌ NUNCA usar service_role key no frontend
```

---

## O Que Pode Quebrar e Como Verificar

| Sintoma | Causa Provável | Como Verificar/Corrigir |
|---------|---------------|------------------------|
| Login retorna "Invalid login credentials" | Email Confirmation ativo | Dashboard → Auth → Email → desligar "Confirm email" |
| SuperAdmin deslogado após criar usuário | Falta o restore de sessão | Verificar `OrganizerForm.tsx` / `UserForm.tsx` |
| Query retorna dados de outra instância | RLS policy faltando ou com bug | Testar com usuário organizer da instância B tentando ver dados da A |
| "infinite recursion detected in policy" | Policy faz query direta em `users` | Substituir por `public.get_user_role()` / `public.is_superadmin()` |
| Usuário criado não aparece em `public.users` | Trigger `handle_new_user` falhou | Verificar logs do Supabase + `raw_user_meta_data` no auth.users |
| `instance_id` não salvo no novo usuário | metadata mal formatado no signUp | Passar `instance_id` como string UUID válida no `data: {}` |

---

## Planos e Limites por Instância

| Plano | Max Eventos | Armazenado em |
|-------|-------------|---------------|
| Standard | 10 | `instances.settings.max_events` |
| Premium | 20 | `instances.settings.max_events` |
| Enterprise | 50 | `instances.settings.max_events` |

---

## Seeds Disponíveis

| Arquivo | Uso |
|---------|-----|
| `supabase/seed-v2.sql` | Dados de exemplo (sem logins no Auth) |
| `supabase/seed-with-auth.sql` | Dados + logins funcionais (superadmin + 3 organizers) |
| `supabase/SETUP_COMPLETO_ALL_IN_ONE.sql` | Setup completo do zero |

**NUNCA rodar seed em produção.**

---

## Credenciais de Teste

```
superadmin@eventos-bff.com / superadmin123  → role: superadmin
carlos.silva@multieventos.com.br / carlos123 → role: organizer (MultiEventos)
maria.santos@multieventos.com.br / maria123  → role: organizer (MultiEventos)
lucas.admin@eventospro.com.br / lucas123     → role: organizer (EventosPro)
```
