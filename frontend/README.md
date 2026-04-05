# Eventos BFF — Frontend

Manual do desenvolvedor para o frontend React + TypeScript.

> Para credenciais de acesso e usuários do seed, ver [docs/LOGINS.md](../docs/LOGINS.md).

## Stack

| Ferramenta | Versão | Uso |
|---|---|---|
| React | 18.2 | UI |
| TypeScript | 5.3 | Type safety |
| Vite | 5.0 | Dev server e build |
| React Router | 6.21 | Roteamento |
| Tailwind CSS | 3.4 | Estilização |
| Supabase JS | 2.39 | Auth e banco de dados |

## Comandos

```bash
npm run dev      # Dev server em http://localhost:3000
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint (max-warnings 0 — deve passar limpo)
npm run preview  # Preview da build de produção
```

## Estrutura

```
frontend/src/
├── App.tsx                        # Definição de rotas
├── components/
│   ├── AdminLayout.tsx            # Shell do painel SuperAdmin
│   ├── AdminRoute.tsx             # Guard: requer role superadmin
│   ├── OrganizerLayout.tsx        # Shell do painel Organizer
│   ├── OrganizerRoute.tsx         # Guard: requer role organizer
│   ├── ProtectedRoute.tsx         # Guard: requer autenticação
│   ├── FormInput.tsx              # Input com label e erro
│   ├── FormSelect.tsx             # Select com label e erro
│   └── FormTextarea.tsx           # Textarea com label e erro
├── hooks/
│   └── useAuth.tsx                # AuthProvider + hook useAuth
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Home.tsx
│   ├── Events.tsx
│   ├── ChangePassword.tsx
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── Instances.tsx
│   │   ├── InstanceForm.tsx       # Criar/editar instância
│   │   ├── Users.tsx
│   │   └── OrganizerForm.tsx      # Criar/editar organizer
│   └── organizer/
│       ├── Dashboard.tsx
│       ├── Events.tsx
│       ├── EventForm.tsx          # Criar/editar evento
│       ├── Users.tsx
│       └── UserForm.tsx           # Criar/editar usuário da instância
├── services/
│   └── supabase.ts                # Singleton do cliente Supabase
└── types/
    └── index.ts                   # Todas as interfaces TypeScript
```

## Rotas

### Públicas
| Rota | Componente |
|---|---|
| `/login` | Login |
| `/register` | Register |

### Protegidas (qualquer usuário autenticado)
| Rota | Componente |
|---|---|
| `/` | Home |
| `/events` | Events |
| `/change-password` | ChangePassword |

### SuperAdmin (`/admin/*`)
| Rota | Componente |
|---|---|
| `/admin` | Dashboard |
| `/admin/instances` | Instances |
| `/admin/instances/new` | InstanceForm |
| `/admin/instances/:id/edit` | InstanceForm |
| `/admin/users` | Users (organizers) |
| `/admin/users/new` | OrganizerForm |
| `/admin/users/:id/edit` | OrganizerForm |

### Organizer (`/organizer/*`)
| Rota | Componente |
|---|---|
| `/organizer` | Dashboard |
| `/organizer/events` | Events |
| `/organizer/events/new` | EventForm |
| `/organizer/events/:id/edit` | EventForm |
| `/organizer/users` | Users |
| `/organizer/users/new` | UserForm |
| `/organizer/users/:id/edit` | UserForm |

## Convenções obrigatórias

### Formulários — nunca use elementos HTML brutos

```tsx
// ❌ Proibido
<input type="text" ... />
<select>...</select>
<textarea />

// ✅ Obrigatório
<FormInput label="Nome" value={name} onChange={...} error={errors.name} />
<FormSelect label="Role" value={role} onChange={...} options={roleOptions} />
<FormTextarea label="Descrição" value={desc} onChange={...} />
```

Se tocar em qualquer campo de um formulário, **migre todos os campos** do mesmo formulário.

### Estilo de botões

```tsx
// Primário
className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-base rounded-lg"

// Secundário
className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-3 text-base rounded-lg"

// Perigo
className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 text-base rounded-lg"
```

### Cliente Supabase

```tsx
// ✅ Sempre importe o singleton
import { supabase } from '../services/supabase'

// ✅ Para criar usuários (evita deslogar sessão atual)
import { supabase, createEphemeralClient } from '../services/supabase'
const anonClient = createEphemeralClient()
await anonClient.auth.signUp({ email, password, options: { data: { role, instance_id } } })

// ❌ Nunca instancie diretamente
import { createClient } from '@supabase/supabase-js'
const client = createClient(...)
```

### Autenticação

```tsx
const { session, user, loading, signIn, signOut } = useAuth()
```

Nunca leia estado de auth diretamente do Supabase — use sempre `useAuth()`.

### Modo edição de instância

Em formulários de usuário no modo **edição**, o campo de instância deve ser `<input>` desabilitado (não dropdown). Usuários não podem trocar de instância após criação.

## Variáveis de ambiente

```env
# frontend/.env (copiar de .env.example)
VITE_SUPABASE_URL=https://jhzqdelkyghibyylrupx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```
