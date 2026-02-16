# Supabase Migration - Eventos BFF

## 📋 Instruções para Executar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto Supabase: https://jhzqdelkyghibyylrupx.supabase.co
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `001_initial_schema.sql`
5. Cole no editor SQL
6. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link com o projeto
supabase link --project-ref jhzqdelkyghibyylrupx

# Executar migration
supabase db push
```

---

## ✅ O que será criado:

### Tabelas (8)
- ✅ `instances` - Multi-tenancy
- ✅ `users` - Usuários do sistema
- ✅ `events` - Eventos
- ✅ `registrations` - Inscrições (funil)
- ✅ `registration_items` - Carrinho de pacotes
- ✅ `event_areas` - Áreas/salas
- ✅ `access_packages` - Pacotes de acesso
- ✅ `user_access` - Controle de acesso efetivo

### Recursos Adicionais
- ✅ Índices otimizados para performance
- ✅ Foreign keys com cascata configurada
- ✅ Triggers para `updated_at` automático
- ✅ Comentários em todas as tabelas/colunas
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas básicas de segurança

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
