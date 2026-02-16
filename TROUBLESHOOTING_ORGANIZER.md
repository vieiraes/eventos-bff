# 🔧 Troubleshooting - Criação de Organizers

## Problema Identificado

Quando você cria um Organizer, o `signUp()` do Supabase **loga automaticamente** o novo usuário, deslogando o SuperAdmin.

## ✅ Solução Implementada

O código agora:
1. **Salva** a sessão do SuperAdmin antes de criar o usuário
2. **Cria** o novo Organizer via signUp()
3. **Restaura** a sessão do SuperAdmin automaticamente
4. **Mostra** alerta com as credenciais criadas

## 🚨 Possível Problema: Email Confirmation

Se você **não consegue logar** com o usuário criado (error: "invalid login credentials"), pode ser porque o **Email Confirmation está ATIVO** no Supabase.

### Como Verificar e Corrigir:

1. Acesse: https://supabase.com/dashboard/project/jhzqdelkyghibyylrupx/auth/providers
2. Clique em **Email** provider
3. Verifique se **"Confirm email"** está **DESABILITADO**
4. Se estiver ativo, **DESABILITE**
5. Salve as configurações

### Verificar no SQL Editor:

```sql
-- Ver usuários criados recentemente
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Se email_confirmed_at for NULL, o usuário não pode logar (se confirmation estiver ativo)
```

## 📋 Checklist de Verificação

Quando criar um novo Organizer:

- [ ] O alerta mostra email, senha e instância vinculada?
- [ ] Você continua logado como SuperAdmin após criar?
- [ ] O novo usuário aparece na lista de usuários?
- [ ] O novo usuário tem `instance_id` correto?
- [ ] Consegue logar com o email/senha do novo usuário?

## 🔍 Verificar Dados do Usuário Criado

No Supabase SQL Editor:

```sql
-- Ver último usuário criado
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.instance_id,
  i.name as instance_name,
  u.status,
  u.created_at
FROM users u
LEFT JOIN instances i ON u.instance_id = i.id
ORDER BY u.created_at DESC
LIMIT 1;
```

## 🎯 Como Testar Agora

1. **Faça logout** (se não estiver como SuperAdmin)
2. **Faça login** como SuperAdmin
3. Vá em **Admin → Usuários → Novo Usuário**
4. Preencha:
   - Tipo: **Organizer**
   - Instância: Selecione uma existente
   - Email: `teste@multieventos.com`
   - Senha: `123456`
   - Nome: `Teste Organizer`
5. Clique **Criar**
6. **Verifique**:
   - Alerta aparece com credenciais?
   - Você continua logado como SuperAdmin?
   - Usuário aparece na lista?
7. **Teste de login**:
   - Faça logout
   - Tente logar com `teste@multieventos.com` / `123456`
   - Deve redirecionar para `/organizer` dashboard

## ❌ Se der "invalid login credentials"

**Causa:** Email Confirmation está ativo

**Solução:**
1. Desabilite Email Confirmation no Supabase
2. Delete o usuário criado (ou confirme o email manualmente)
3. Crie novamente

**Confirmar email manualmente via SQL:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'teste@multieventos.com';
```

## 📞 Resumo do Fluxo Correto

```
SuperAdmin cria Organizer
         ↓
Salva sessão do SuperAdmin
         ↓
signUp() cria novo usuário (loga automaticamente)
         ↓
Restaura sessão do SuperAdmin
         ↓
SuperAdmin continua logado ✅
         ↓
Novo Organizer pode logar depois
```

## 🔐 Verificar Configuração do Supabase

No dashboard do Supabase:

**Authentication → Email Auth Settings:**
- ✅ Enable email provider: **ON**
- ❌ Confirm email: **OFF** (desabilitar!)
- ✅ Enable sign ups: **ON**
- ✅ Minimum password length: **6**

---

**Status:** Fix implementado e commitado  
**Próximo teste:** Criar novo Organizer e verificar se funciona
