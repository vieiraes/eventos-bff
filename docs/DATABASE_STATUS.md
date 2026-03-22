# Estado Atual do Banco de Dados

**Projeto:** Eventos-BFF  
**Supabase Project ID:** jhzqdelkyghibyylrupx  
**Última Atualização:** 16/02/2026 - **Migration 006 Aplicada: Organizers podem gerenciar registrations**

---

## 🚀 Aplicar Migration (AÇÃO NECESSÁRIA)

A migration foi **consolidada** mas precisa ser aplicada manualmente:

1. **Acesse:** https://supabase.com/dashboard/project/jhzqdelkyghibyylrupx/sql/new
2. **Abra:** `supabase/migrations/001_complete_schema.sql`
3. **Copie todo o conteúdo** e execute no SQL Editor
4. **Verifique** se não há erros

⚠️ **IMPORTANTE:** Se o banco já tem as tabelas criadas, você verá erro "relation already exists". Nesse caso, pule esta migration pois o estado atual já está correto.

---

## 📊 Migrations (CONSOLIDADA)

### ✅ 001_complete_schema.sql - Versão 1.0.0 Consolidada
Migration única que consolida todas as versões anteriores (001 até 005).

**Inclui:**
- ✅ 8 tabelas principais (instances, users, events, registrations, event_areas, access_packages, registration_items, user_access)
- ✅ Estrutura multi-tenant com isolamento por instance_id
- ✅ Indexes e foreign keys
- ✅ RLS policies completas para todos os roles
- ✅ Funções helper SECURITY DEFINER (is_superadmin, get_user_instance_id, get_user_role)
- ✅ Auth integration (handle_new_user, handle_user_update)
- ✅ **handle_new_user suporta `role` e `instance_id` via metadata** (fix bug SuperAdmin)
- ✅ Campo `email_verified` removido (não usado no MVP)
- ✅ Helper functions API (get_user_profile, get_user_events, get_user_access_for_event)

**Migrations antigas** movidas para `_old/` como backup.

---

## 📦 Migrations Incrementais (Pós-Consolidação)

### ✅ 002_prevent_instance_migration.sql - APLICADA
**Data:** 15/02/2026  
**Trigger:** `prevent_instance_migration`
- Impede migração de users entre instâncias (instance_id é imutável após criação)
- Garante isolamento multi-tenant

### ✅ 003_soft_delete_users.sql - APLICADA
**Data:** 15/02/2026  
**Funcionalidades:**
- Adiciona coluna `deleted_at TIMESTAMPTZ` na tabela users
- Função `soft_delete_user(user_id UUID)` para marcar deletados
- RLS policies atualizadas: usuários com `deleted_at IS NOT NULL` são invisíveis

### ✅ 004_fix_handle_new_user_instance_id.sql - APLICADA
**Data:** 16/02/2026  
**Fix:** Trigger `handle_new_user` com melhor tratamento de UUID
- Try/catch para conversão robusta de `instance_id`
- PostgreSQL WARNING em caso de erro (não bloqueia mais a criação)
- Validação explícita de NULL

### ✅ 005_organizer_manage_users.sql - APLICADA
**Data:** 16/02/2026  
**RLS Policies para Organizers gerenciarem usuários:**
- `organizers_insert_instance_users` - Criar users (exceto superadmin) na própria instância
- `organizers_update_instance_users` - Editar users (bloqueia promoção a superadmin)
- `organizers_delete_instance_users` - Soft delete users (via `soft_delete_user()`)
- **Use Case:** Resolver problemas durante check-in (corrigir dados, criar cadastros)

### ✅ 006_organizer_manage_registrations.sql - APLICADA
**Data:** 16/02/2026  
**RLS Policies para Organizers gerenciarem registrations:**
- `organizers_create_event_registrations` - Criar registrations (vincular users aos eventos)
- `organizers_update_event_registrations` - Editar registrations (status, badge_name, etc)
- **Use Case:** Onboarding rápido durante check-in - vincular user ao evento instantaneamente

---

## 🗄️ Tabelas Ativas

### Core (Multi-tenancy)
1. **instances** - Empresas clientes (MultiEventos, EventosPro, etc)
2. **users** - Todos os usuários do sistema

### Events
3. **events** - Eventos criados por cada instância
4. **event_areas** - Salas/áreas dos eventos

### Registrations
5. **registrations** - Inscrições nos eventos
6. **registration_items** - Items/pacotes da inscrição (carrinho)

### Access Control
7. **access_packages** - Pacotes de acesso (Basic, Premium, Full)
8. **user_access** - Controle de acesso efetivo dos usuários

---

## 🔐 Funções de Segurança (RLS Helpers)

```sql
-- Verifica se usuário logado é superadmin
public.is_superadmin() RETURNS BOOLEAN

-- Retorna instance_id do usuário logado
public.get_user_instance_id() RETURNS UUID

-- Retorna role do usuário logado
public.get_user_role() RETURNS TEXT
```

Todas com `SECURITY DEFINER` para evitar recursão nas políticas RLS.

---

## 👥 Roles do Sistema

- **superadmin** - Acesso total ao sistema (gerencia instances, organizers)
- **organizer** - Admin da instância (gerencia eventos, users da instância)
- **staff** - Equipe do evento
- **speaker** - Palestrantes
- **vip** - Participantes VIP
- **attendee** - Participantes padrão

---

## 🔑 Regras de Acesso Atuais

### SuperAdmin pode:
- ✅ Criar/editar/deletar instâncias
- ✅ Criar outros SuperAdmins
- ✅ Criar Organizers para qualquer instância
- ✅ Visualizar todos os usuários
- ✅ Editar apenas SuperAdmins e Organizers
- 👀 Outros usuários (staff, speaker, vip, attendee) são read-only

### Organizer pode:
- ✅ Gerenciar eventos da sua instância
- ✅ **Criar/editar/deletar usuários da sua instância** (exceto superadmin) - Migration 005
- ✅ Ver registrations dos seus eventos
- ❌ Não pode criar/promover para superadmin
- ❌ Não pode acessar outras instâncias
- 📋 Use Case: Corrigir dados durante check-in, criar cadastros rápidos

---

## 📝 Schema Atual - Tabela Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  avatar_url VARCHAR,
  document_number VARCHAR,
  company VARCHAR,
  position VARCHAR,
  bio TEXT,
  role VARCHAR NOT NULL DEFAULT 'attendee',
  status VARCHAR NOT NULL DEFAULT 'active',
  metadata JSONB,
  deleted_at TIMESTAMPTZ,  -- Migration 003: Soft delete
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- REMOVIDO: email_verified BOOLEAN (não incluído no MVP)
```

---

## 🔄 Próximas Features Planejadas

### ✅ Implementadas (Aguardando commit)
- [x] **Criação/edição de eventos pelo Organizer** - EventForm.tsx completo
- [x] **Gerenciamento de usuários pelo Organizer** - Users.tsx + UserForm.tsx

### Em Desenvolvimento
- [ ] Formulário de registro de participantes
- [ ] Checkout e pagamento
- [ ] Feature flags por plano (settings.features)
- [ ] Sistema de check-in com QR Code

### Preparadas (não implementadas)
- Funcionalidades desabilitadas no InstanceForm:
  - QR Code
  - Check-in
  - Analytics
  - Custom Branding
  - API Access
  - White Label

---

## 🧪 Dados de Teste (Seed)

**Arquivo:** `supabase/seed-v2.sql`

- 3 instâncias (MultiEventos, EventosPro, Campus Events)
- 4 organizers (1 por instância + 1 compartilhado)
- 4 eventos de exemplo
- 1 superadmin: admin@eventoslab.com / admin123

---

## 📚 Documentação Relacionada

- [README.md](../README.md) - Visão geral do projeto
- [LOGINS.md](LOGINS.md) - Credenciais de teste
- [database-schema.dbml](../database-schema.dbml) - Schema visual (DBML)
