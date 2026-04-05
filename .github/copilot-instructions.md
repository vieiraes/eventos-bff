# Copilot Instructions — Eventos BFF

SaaS B2B multi-tenant platform for corporate event management. No traditional backend — the entire backend is Supabase (PostgreSQL + Auth + RLS + Edge Functions).

## Commands (all from `frontend/`)

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint (max-warnings 0 — must pass clean)
npm run preview   # Preview production build
```

> There is no test suite. No backend server to run — Supabase is the BaaS.

## Architecture

### Stack

- **Frontend**: Vite + React 18 + TypeScript (strict) + Tailwind CSS
- **Backend/DB**: Supabase — PostgreSQL + Auth + RLS + stored procedures
- **Auth**: Supabase Auth, synced to `public.users` via DB triggers (`handle_new_user`, `handle_user_update`)

### Multi-Tenancy Model

```
SuperAdmin (instance_id = NULL)
└── Instance (empresa cliente — e.g., MultiEventos)
    ├── Organizer (manages events within the instance)
    └── Events → Areas, Packages, Registrations, UserAccess
```

All tables (except `instances`) carry `instance_id`. **Every query must respect instance isolation.** SuperAdmin is the only role with `instance_id = NULL`.

### Role Hierarchy

`superadmin` > `organizer` > `staff` > `speaker` > `vip` > `attendee`

### Frontend Structure

```
frontend/src/
├── App.tsx              # Route definitions
├── components/
│   ├── AdminLayout.tsx / OrganizerLayout.tsx   # Role-specific shells
│   ├── AdminRoute.tsx / OrganizerRoute.tsx     # Route guards
│   ├── ProtectedRoute.tsx
│   └── FormInput/Select/Textarea.tsx           # Shared form primitives
├── hooks/
│   └── useAuth.tsx      # Single auth hook (AuthProvider + useAuth)
├── pages/
│   ├── admin/           # SuperAdmin pages
│   └── organizer/       # Organizer pages
├── services/
│   └── supabase.ts      # Singleton Supabase client (import from here)
└── types/
    └── index.ts         # All TypeScript interfaces — must mirror DB schema
```

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| DB tables | lowercase plural | `users`, `events`, `registrations` |
| DB columns | snake_case | `instance_id`, `full_name`, `created_at` |
| DB indexes | descriptive | `idx_users_instance_id` |
| React components | PascalCase | `AdminLayout`, `InstanceForm` |
| Component files | match component | `AdminLayout.tsx` |
| TS interfaces | PascalCase | `User`, `Instance`, `Event` |
| Functions | camelCase | `loadUsers`, `handleSubmit` |
| Custom hooks | `use` prefix | `useAuth` |
| Routes/URLs | kebab-case | `/admin/instances/new` |

## Key Conventions

### Supabase Client

Always import the singleton: `import { supabase } from '../services/supabase'`. Never create a new client. Never use the service role key in frontend code.

### TypeScript Types

All interfaces live in `frontend/src/types/index.ts` and **must exactly mirror the database schema**. Use `interface` (not `type`) for extensibility. Discriminated unions for roles:
```ts
role: 'superadmin' | 'organizer' | 'staff' | 'attendee' | 'speaker' | 'vip'
```

### Authentication & User Profile

User profile (including role and instance_id) is loaded via Supabase RPC:
```ts
const { data } = await supabase.rpc('get_user_profile')
const user = data[0]
```
Use `useAuth()` hook to access `{ session, user, loading, signIn, signUp, signOut }`.

### Route Guards

- `<ProtectedRoute>` — requires any authenticated user
- `<AdminRoute>` — requires `superadmin` role
- `<OrganizerRoute>` — requires `organizer` role

### Database Schema Changes

**MANDATORY order for any schema change:**
1. Create migration in `supabase/migrations/` (numbered sequentially)
2. Update `database-schema.dbml` immediately (same commit — non-negotiable)
3. Update TypeScript interfaces in `frontend/src/types/index.ts`
4. Update or add RLS policies

### Soft Delete Pattern

Users use soft delete — never hard delete:
```sql
-- Filter active records
WHERE deleted_at IS NULL

-- Soft delete
UPDATE users SET deleted_at = NOW() WHERE id = $1;
```
RLS policies must include `deleted_at IS NULL` filters.

### Business Rules in Triggers

Critical rules (e.g., preventing instance migration) live in DB triggers, not just frontend validation. Example: `prevent_instance_migration_trigger` on `users`. Add triggers for any rule that must survive API/admin bypass.

### Supabase Helper Functions

These SECURITY DEFINER functions avoid RLS recursion — use them in RLS policies:
- `is_superadmin()` 
- `get_user_instance_id()`
- `get_user_role()`
- `get_user_profile()` — returns user + instance_name
- `get_user_events()` — events with registration status
- `get_user_access_for_event(event_id)` — active access packages

### Form Components

Always use shared primitives — **never** raw `<input>`, `<select>`, or `<textarea>`. When touching a form, migrate all fields (no mixing legacy inputs with new components in the same form).

**Mandatory styling standards enforced by the components:**
- Height: `py-3` | Padding: `px-4` | Text: `text-base` (never `text-sm`)
- Border: `border-2 border-gray-400` | Background: `bg-gray-50`
- Labels: `text-base font-semibold` (never `text-sm`)
- Focus: `focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500`

**Props pattern:**
```typescript
interface FormComponentProps {
  label: string        // always visible — no placeholder-only inputs
  error?: string       // validation error
  helperText?: string  // helper text below field
}
```

### Button Styling

```tsx
// Primary action
className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-base"

// Secondary
className="bg-gray-200 hover:bg-gray-300 text-gray-900"

// Danger
className="bg-red-600 hover:bg-red-700 text-white"
```

### Instance Migration Prevention

Users cannot be moved between instances once assigned. This is enforced by a DB trigger (`prevent_instance_migration_trigger`) **and** the frontend:
- **Create mode**: instance dropdown is enabled
- **Edit mode**: instance field is a disabled read-only text input (never a dropdown)

Error message from trigger: `"Não é permitido migrar usuário entre instâncias"`

### Applying Migrations

Use Supabase MCP tool (`mcp_com_supabase__execute_sql`) to apply migrations directly — do not run migrations through Supabase Dashboard manually when MCP is available.

## Quality Gates (Before Committing)

- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint warnings
- [ ] Migration tested with seed data
- [ ] DBML updated if schema changed (same commit — never defer)
- [ ] TypeScript types updated if schema changed
- [ ] RLS policies tested with different roles
- [ ] No `console.log` left in code

## Environment Setup

```bash
cp frontend/.env.example frontend/.env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

Supabase project: `jhzqdelkyghibyylrupx.supabase.co`  
**Email Confirmation deve estar OFF** no Supabase (Dashboard → Authentication → Providers → Email).

## Supabase — Regras Críticas

> Para qualquer mudança em banco, auth ou RLS, consulte `.github/agents/supabase-guardian.agent.md`.

**Criar usuário via `signUp()` desloga o usuário atual.** Padrão obrigatório — usar `createEphemeralClient()`:

```typescript
import { supabase, createEphemeralClient } from '../services/supabase'

const anonClient = createEphemeralClient() // persistSession: false — não afeta sessão atual
await anonClient.auth.signUp({ email, password, options: { data: { role, instance_id } } })
```

Este padrão está em `OrganizerForm.tsx` e `organizer/UserForm.tsx` — nunca remover.

## Registration Flow

```
pre_registered → awaiting_payment → paid → confirmed → (user_access criado automaticamente)
                                                 ↓
                                           cancelled / expired
```

`registration_id` é nullable em `user_access` — speakers/VIPs recebem acesso cortesia sem registro formal.
