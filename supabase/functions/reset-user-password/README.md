# Edge Function: reset-user-password

Redefine a senha de um usuário sem enviar email. Requer autenticação de organizer ou superadmin.

## Deploy

Via Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard/project/jhzqdelkyghibyylrupx/functions
2. Clique em "New Function"
3. Nome: `reset-user-password`
4. Cole o conteúdo de `index.ts`

Via Supabase CLI (se instalado):
```bash
supabase functions deploy reset-user-password --project-ref jhzqdelkyghibyylrupx
```

## Permissões

- `superadmin`: pode redefinir senha de qualquer usuário
- `organizer`: pode redefinir senha de usuários da sua instância (exceto superadmins)
- Outros roles: sem permissão (403)

## Payload

```json
{ "userId": "uuid-do-usuario", "newPassword": "nova-senha-min-6-chars" }
```
