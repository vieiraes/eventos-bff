# 📦 Supabase - Database Setup

## 🚀 Setup Inicial (Primeira vez)

### 1️⃣ Aplicar Migrations
Execute as migrations na ordem:

```sql
-- No Supabase Dashboard → SQL Editor
-- Execute na ordem:

1. migrations/001_complete_schema.sql
2. migrations/002_prevent_instance_migration.sql
3. migrations/003_soft_delete_users.sql
4. migrations/004_fix_handle_new_user_instance_id.sql
5. migrations/005_organizer_manage_users.sql
6. migrations/006_organizer_manage_registrations.sql
```

### 2️⃣ Criar Usuários com Autenticação

**⚠️ IMPORTANTE:** O arquivo `seed-v2.sql` cria dados de exemplo, mas **NÃO cria logins**.

Execute o arquivo `seed-with-auth.sql` para criar usuários funcionais:

```sql
-- No Supabase Dashboard → SQL Editor
-- Execute: seed-with-auth.sql

-- Isso cria:
-- ✅ SUPERADMIN: superadmin@eventos-bff.com / superadmin123
-- ✅ Organizers com senha (carlos123, maria123, lucas123)
-- ✅ Trigger handle_new_user() cria automaticamente em public.users
```

### 3️⃣ Popular Dados de Exemplo (Opcional)

Depois de criar os usuários, execute o `seed-v2.sql` para popular:
- ✅ Events
- ✅ Event Areas
- ✅ Access Packages
- ✅ Registrations
- ✅ User Access

```sql
-- Execute: seed-v2.sql
-- (PULE as linhas de INSERT em users e instances, já criados no passo 2)
```

---

## 📁 Estrutura de Arquivos

```
supabase/
├── migrations/
│   ├── 001_complete_schema.sql          # Schema completo (tabelas, RLS, triggers)
│   ├── 002_prevent_instance_migration.sql
│   ├── 003_soft_delete_users.sql
│   ├── 004_fix_handle_new_user_instance_id.sql
│   ├── 005_organizer_manage_users.sql
│   ├── 006_organizer_manage_registrations.sql
│   └── README.md
├── seed-with-auth.sql                    # ✅ USAR ESTE para criar logins
├── seed-v2.sql                           # Dados de exemplo (SEM logins)
└── README.md
```

---

## 🔑 Logins Criados (seed-with-auth.sql)

| Email | Senha | Role | Instância |
|-------|-------|------|-----------|
| superadmin@eventos-bff.com | superadmin123 | superadmin | - |
| carlos.silva@multieventos.com.br | carlos123 | organizer | MultiEventos |
| maria.santos@multieventos.com.br | maria123 | organizer | MultiEventos |
| lucas.admin@eventospro.com.br | lucas123 | organizer | EventosPro |

---

## ✅ O que será criado:

### Tabelas (8)
- ✅ `instances` - Multi-tenancy (empresas clientes)
- ✅ `users` - Usuários do sistema (com soft delete)
- ✅ `events` - Eventos
- ✅ `registrations` - Inscrições (funil de conversão)
- ✅ `registration_items` - Carrinho de pacotes
- ✅ `event_areas` - Áreas/salas dos eventos
- ✅ `access_packages` - Pacotes de acesso
- ✅ `user_access` - Controle de acesso efetivo

### Recursos Adicionais
- ✅ Índices otimizados para performance
- ✅ Foreign keys com cascata configurada
- ✅ Triggers para `updated_at` automático
- ✅ Row Level Security (RLS) ativo em todas as tabelas
- ✅ Helper functions: `is_superadmin()`, `get_user_instance_id()`, `get_user_role()`
- ✅ Auth integration: triggers `handle_new_user()` e `handle_user_update()`
- ✅ Soft delete em users (coluna `deleted_at`)
- ✅ Prevent instance migration (trigger)

---

## 🔄 Reset do Banco (Desenvolvimento)

Para resetar completamente:

```sql
-- 1. Deletar usuários do auth.users
DELETE FROM auth.users;

-- 2. Dropar tabelas (CASCADE remove tudo)
DROP TABLE IF EXISTS user_access CASCADE;
DROP TABLE IF EXISTS registration_items CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS access_packages CASCADE;
DROP TABLE IF EXISTS event_areas CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS instances CASCADE;

-- 3. Reaplicar migrations
-- Execute 001_complete_schema.sql novamente
-- (e as outras migrations na ordem)

-- 4. Executar seed-with-auth.sql
```

---

## 📝 Notas Importantes

### Trigger `handle_new_user()`
- Quando um usuário é criado em `auth.users`
- O trigger copia automaticamente para `public.users`
- Extrai metadata: `full_name`, `role`, `instance_id`, `phone`, etc

### RLS (Row Level Security)
- ✅ Ativo em todas as tabelas
- ✅ SUPERADMIN tem acesso global (instance_id = NULL)
- ✅ Organizers acessam apenas sua instância
- ✅ Users acessam apenas seus próprios dados

### Soft Delete
- ✅ Coluna `deleted_at` em `users`
- ✅ RLS policies filtram automaticamente (deleted_at IS NULL)
- ✅ Função `soft_delete_user()` para marcar como deletado

---

## 🐛 Troubleshooting

**Erro: "User already exists"**
- Deletar o usuário no Supabase Dashboard → Authentication → Users
- OU: `DELETE FROM auth.users WHERE email = 'email@example.com';`

**Erro: "duplicate key value violates unique constraint"**
- O seed foi executado 2x
- Execute o reset acima e reaplique

**Login não funciona**
- Verifique se o usuário foi criado em `auth.users` (não apenas em `public.users`)
- Use `seed-with-auth.sql` para criar com senha
- Verifique se email foi confirmado (`email_confirmed_at IS NOT NULL`)

**Organizer não vê eventos**
- Verifique `instance_id` do organizer
- Verifique `instance_id` do evento
- Devem ser iguais para o organizer ter acesso

---

## 📚 Mais Informações

- [Database Schema (DBML)](../database-schema.dbml)
- [Logins e Credenciais](../docs/LOGINS.md)
- [Troubleshooting](../docs/TROUBLESHOOTING_ORGANIZER.md)

---

## 🔗 Links Rápidos

- **Supabase Dashboard:** https://jhzqdelkyghibyylrupx.supabase.co
- **SQL Editor:** https://jhzqdelkyghibyylrupx.supabase.co/project/jhzqdelkyghibyylrupx/sql
- **Auth Users:** https://jhzqdelkyghibyylrupx.supabase.co/project/jhzqdelkyghibyylrupx/auth/users

---

## 🔐 Configuração de Autenticação (Próximo Passo)

Após executar a migration, você precisará:

1. **Configurar Supabase Auth**
   - Email/Password
   - OAuth (Google, GitHub, etc)
   
2. **Criar primeiro SUPERADMIN**
   - Via Supabase Auth + Insert manual na tabela `users`

3. **Refinar RLS Policies**
   - Políticas específicas por role
   - Isolamento multi-tenant

---

## 📊 Validação

Após executar, valide se todas as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deve retornar:
- access_packages
- event_areas
- events
- instances
- registration_items
- registrations
- user_access
- users

---

## 🚀 Próximos Passos

1. ✅ Executar migration
2. ⏳ Configurar Supabase Auth
3. ⏳ Criar primeiro SUPERADMIN
4. ⏳ Testar CRUD básico via Supabase API
5. ⏳ Implementar BFF (Backend for Frontend)

---

## 🔗 Informações do Projeto

- **Project URL**: https://jhzqdelkyghibyylrupx.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Região**: (verificar no dashboard)

---

## ⚠️ Importante

- Mantenha o arquivo `database-schema.dbml` sincronizado com o Supabase
- Toda alteração no schema deve gerar uma nova migration
- Nunca modifique migrations já executadas
