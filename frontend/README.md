# Eventos BFF - Frontend

Frontend React + TypeScript para o sistema de gerenciamento de eventos multi-tenant.

## Stack Tecnológica

- **React 18.2** - Biblioteca UI
- **TypeScript 5.3** - Type safety
- **Vite 5.0** - Build tool e dev server
- **React Router 6.21** - Roteamento
- **Tailwind CSS 3.4** - Estilização
- **Supabase JS 2.39** - Cliente de autenticação e banco de dados

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── ProtectedRoute.tsx
│   │   ├── AdminRoute.tsx
│   │   └── AdminLayout.tsx
│   ├── hooks/             # Custom hooks
│   │   └── useAuth.tsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Events.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── Instances.tsx
│   │       ├── Users.tsx
│   │       └── Events.tsx
│   ├── services/          # Integrações externas
│   │   └── supabase.ts
│   ├── types/             # Definições TypeScript
│   │   └── index.ts
│   ├── App.tsx            # Componente raiz
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globais
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Instalação

```bash
cd frontend
npm install
```

## Desenvolvimento

Inicie o servidor de desenvolvimento na porta 3000:

```bash
npm run dev
```

## Build para Produção

```bash
npm run build
npm run preview
```

## 🚀 Primeiros Passos (Quick Start)

### 1. Inicie o servidor
```bash
npm run dev
```

### 2. Acesse o sistema
Abra o navegador em: http://localhost:3000

### 3. Faça login

**Credenciais do SuperAdmin:**
```
Email: superadmin@eventos-bff.com
Senha: superadmin123
```

**O que você pode fazer:**
- ✅ Visualizar eventos publicados
- ✅ Acessar dashboard administrativo (role: superadmin)
- ✅ Gerenciar todas as instâncias do sistema
- ✅ Visualizar e filtrar todos os usuários
- ✅ Visualizar todos os eventos cadastrados

### 4. Testar outros usuários

**Criar uma conta nova:**
1. Clique em "Não tem conta? Cadastre-se"
2. Preencha: Nome, Email, Senha
3. Sistema criará usuário com role `attendee`
4. Faça login e veja a listagem de eventos

**Nota:** 
- SuperAdmin será redirecionado automaticamente para `/admin` após login
- Outros usuários serão redirecionados para `/` (listagem de eventos)
- Os usuários do seed (SBCP, TechConf) existem no banco mas não têm login ainda. Para usá-los, registre-se com os emails correspondentes via interface `/register`.

## Funcionalidades Implementadas

### Autenticação

- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Context API para gerenciamento de estado de autenticação
- ✅ Rotas protegidas
- ✅ Integração com Supabase Auth
- ✅ Sincronização automática auth.users → public.users

### Eventos

- ✅ Listagem de eventos publicados
- ✅ Visualização do status de inscrição
- ✅ Badge de status (Confirmado, Pago, Aguardando Pagamento, etc.)
- ✅ Filtro por instância (multi-tenant)

### Dashboard SuperAdmin

- ✅ Acesso restrito para role 'superadmin'
- ✅ Estatísticas gerais (instâncias, usuários, eventos, receita)
- ✅ Gerenciamento de instâncias (listagem completa)
- ✅ Gerenciamento de usuários (todos os usuários com filtros por role)
- ✅ Gerenciamento de eventos (todos os eventos com filtros por status)
- ✅ Navegação lateral dedicada
- ✅ Layout diferenciado para área administrativa

## Hooks Personalizados

### useAuth

Hook para gerenciamento de autenticação:

```typescript
const { session, user, loading, signIn, signUp, signOut } = useAuth()
```

- `session`: Sessão atual do Supabase
- `user`: Dados do usuário do banco de dados (public.users)
- `loading`: Estado de carregamento
- `signIn(email, password)`: Fazer login
- `signUp(email, password, fullName)`: Criar conta
- `signOut()`: Fazer logout

## Componentes

### ProtectedRoute

Wrapper para rotas que requerem autenticação. Redireciona para `/login` se não autenticado.

```tsx
<Route 
  path="/events" 
  element={
    <ProtectedRoute>
      <Events />
    </ProtectedRoute>
  } 
/>
```

## Integração com Supabase

O cliente Supabase está configurado em `src/services/supabase.ts`:

```typescript
import { supabase } from './services/supabase'

// Chamando funções RPC
const { data, error } = await supabase.rpc('get_user_events')

// Autenticação
await supabase.auth.signInWithPassword({ email, password })
```

### Funções RPC Disponíveis

- `get_user_profile()` - Retorna dados do usuário + nome da instância
- `get_user_events()` - Retorna eventos com status de inscrição do usuário
- `get_user_access_for_event(event_id)` - Retorna pacotes de acesso do usuário para um evento

## Rotas

### Públicas
| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/login` | Login | Autenticação de usuários |
| `/register` | Register | Cadastro de novos usuários |

### Protegidas (Requer Autenticação)
| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | Events | Listagem de eventos |

### Admin (Requer role 'superadmin')
| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/admin` | AdminDashboard | Dashboard com estatísticas |
| `/admin/instances` | AdminInstances | Gerenciar instâncias SaaS |
| `/admin/users` | AdminUsers | Gerenciar todos os usuários |
| `/admin/events` | AdminEvents | Visualizar todos os eventos |

## Variáveis de Ambiente

**IMPORTANTE**: Em produção, mova as credenciais do Supabase para variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://jhzqdelkyghibyylrupx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

E atualize `src/services/supabase.ts`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## Próximos Passos

- [ ] Página de detalhes do evento
- [ ] Fluxo de inscrição com seleção de pacotes
- [ ] Carrinho de compras para registration_items
- [ ] Integração de pagamento
- [ ] Dashboard do organizador
- [ ] Gerenciamento de eventos (CRUD)
- [ ] Upload de avatar
- [ ] Edição de perfil
- [ ] Página de áreas do evento
- [ ] Sistema de check-in

## Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm run lint` - Executa ESLint
- `npm run preview` - Preview da build de produção
