# Migrations - Eventos BFF

## ⚠️ IMPORTANTE - Aplicação Manual

Como não temos o Supabase CLI configurado, aplique a migration **manualmente via SQL Editor**:

1. Acesse: https://supabase.com/dashboard/project/jhzqdelkyghibyylrupx/sql/new
2. **Se o banco já tem dados, faça backup antes!**
3. Copie o conteúdo de `001_complete_schema.sql`
4. Execute no SQL Editor

## 📁 Estrutura

```
migrations/
├── 001_complete_schema.sql    ← MIGRATION CONSOLIDADA (USE ESTA!)
└── _old/                       ← Backup das migrations antigas
    ├── 001_initial_schema.sql
    ├── 002_auth_integration.sql
    ├── 003_fix_rls_recursion.sql
    ├── 004_remove_email_verified.sql
    └── 005_update_handle_new_user.sql
```

## ✨ O que está na Migration Consolidada

A `001_complete_schema.sql` é uma **migration única** que consolida todo o histórico:

### 1. Schema Completo
- 8 tabelas: `instances`, `users`, `events`, `registrations`, `event_areas`, `access_packages`, `registration_items`, `user_access`
- Indexes otimizados
- Foreign keys e constraints

### 2. Multi-tenant Isolation
- Todos os dados isolados por `instance_id`
- SuperAdmin tem `instance_id = NULL`

### 3. RLS Policies Completas
- SuperAdmin: acesso total
- Organizer: acesso à sua instância
- Users: acesso aos próprios dados

### 4. Auth Integration
- `handle_new_user()` - **Suporta `role` e `instance_id` via metadata** ✅
- `handle_user_update()` - Sincroniza last_login
- Triggers automáticos na tabela `auth.users`

### 5. Helper Functions (SECURITY DEFINER)
- `is_superadmin()` - Verifica se user é superadmin
- `get_user_instance_id()` - Retorna instance_id do user
- `get_user_role()` - Retorna role do user
- **Previnem recursão infinita** nas RLS policies

### 6. API Helper Functions
- `get_user_profile()` - Perfil completo do user
- `get_user_events()` - Eventos disponíveis
- `get_user_access_for_event(uuid)` - Acessos do user

### 7. Correções Aplicadas
- ✅ Campo `email_verified` removido (não usado)
- ✅ Recursão RLS corrigida com SECURITY DEFINER
- ✅ **Bug SuperAdmin role='attendee' corrigido** (passa role via metadata)

## 🔄 Histórico de Consolidação

**Data:** 16/02/2026  
**Motivo:** Simplificar gestão de migrations (de 5 para 1)  
**Versão:** 1.0.0

### Migrations Antigas (backup em `_old/`)

1. **001_initial_schema.sql** - Schema base das 8 tabelas
2. **002_auth_integration.sql** - Auth triggers e RLS policies
3. **003_fix_rls_recursion.sql** - Helper functions SECURITY DEFINER
4. **004_remove_email_verified.sql** - Remoção do campo email_verified
5. **005_update_handle_new_user.sql** - Fix role assignment bug

## 🆕 Banco Novo vs. Banco Existente

### Se o banco está VAZIO:
✅ Execute `001_complete_schema.sql` direto

### Se o banco JÁ TEM DADOS:
⚠️ **CUIDADO!** A migration atual usa `CREATE TABLE`.

**Opções:**
1. **Recriar do zero** (⚠️ PERDE DADOS):
   ```sql
   -- Execute primeiro:
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   
   -- Depois execute: 001_complete_schema.sql
   ```

2. **Manter dados existentes**:
   - Não execute novamente
   - Apenas aplique alterações específicas se necessário

## 🧪 Como Testar

Após aplicar a migration:

1. **Criar SuperAdmin:**
   - Frontend → `/admin/users/new`
   - Selecione "SuperAdmin"
   - Deve criar com `role='superadmin'` ✅

2. **Verificar RLS:**
   ```sql
   -- Como SuperAdmin
   SELECT * FROM users;  -- Deve ver todos
   SELECT * FROM instances;  -- Deve ver todas
   
   -- Como Organizer
   SELECT * FROM users;  -- Só da sua instância
   SELECT * FROM events;  -- Só da sua instância
   ```

3. **Testar Helper Functions:**
   ```sql
   SELECT is_superadmin();  -- true/false
   SELECT get_user_role();  -- 'superadmin', 'organizer', etc
   SELECT * FROM get_user_profile();
   ```

## 📝 Troubleshooting

### "relation already exists"
O banco já tem as tabelas. Opções:
- Dropar schema e recriar (perde dados)
- Pular esta migration (manter estado atual)

### "function does not exist"
Execute a parte das functions separadamente:
```sql
-- Copie apenas as seções de CREATE FUNCTION
```

### "insufficient privilege"
Você precisa ser owner do projeto Supabase para executar.

## 📚 Próximos Passos

Após aplicar a migration consolidada:

1. ✅ Frontend já está configurado (OrganizerForm passa role via metadata)
2. ✅ Routing inteligente implementado (Home.tsx)
3. ⏳ Testar criação de SuperAdmin
4. ⏳ Implementar CRUD de eventos para Organizers
5. ⏳ Implementar fluxo de registration
