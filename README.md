# 🎫 Eventos BFF

Sistema SaaS Multi-tenant para Gestão de Eventos Corporativos

---

## 🚀 Acesso Rápido

**Servidor:** http://localhost:3000 · **Dashboard Admin:** http://localhost:3000/admin

**Documentação:**
- 🔑 [Logins e Credenciais](docs/LOGINS.md) — Usuários, senhas e como criar novos
- 💻 [Frontend](frontend/README.md) — Stack, estrutura, convenções e rotas React
- 🗄️ [Edge Function: reset-user-password](supabase/functions/reset-user-password/README.md)

---

## 📋 Sobre o Projeto

**Eventos BFF** é uma plataforma SaaS B2B para gestão de eventos corporativos. O sistema permite que empresas de gestão de eventos gerenciem múltiplos eventos e controlem todo o ciclo de vida: do cadastro à venda de ingressos, até o controle de acesso em tempo real.

### Modelo de Negócio

O **Eventos BFF** segue um modelo B2B multi-tenant:

- **Instâncias** = Empresas clientes que gerenciam eventos (ex: MultiEventos Ltda, EventosPro Brasil)
- **Organizers** = Administradores dessas empresas que criam e gerenciam N eventos
- **SuperAdmin** = Administrador da plataforma que gerencia contratos B2B com as empresas clientes

**Exemplo de Hierarquia:**
```
SuperAdmin (Bruno Vieira)
└── Instância: MultiEventos Professional (empresa cliente)
    ├── Organizer: Carlos Silva (CEO)
    ├── Organizer: Maria Santos (Diretora)
    └── Eventos gerenciados por essa empresa:
        ├── Congresso SBCP 2026 (2.000 pessoas)
        ├── Festa do Colonão 2026 (5.000 pessoas)
        └── Workshop Técnicas Avançadas (50 pessoas)
```

### Casos de Uso Principais

- **Empresas de Eventos**: MultiEventos, EventosPro - gerenciam portfólio de eventos
- **Congressos Médicos**: SBCP - organizado por empresa especializada
- **Festivais e Feiras**: Festa do Colonão - gestão de grande público
- **Instituições**: Campus Events - eventos universitários

## 🏗️ Arquitetura

### Stack Tecnológica

- **Backend/Database**: Supabase (PostgreSQL + Auth + API + RLS)
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Auth**: Supabase Auth (integrado com public.users)
- **Schema Design**: DBML + dbdiagram.io

### Multi-tenancy

Sistema baseado em **instâncias isoladas** (empresas clientes):

- Cada empresa cliente possui uma `instance` (ex: MultiEventos Professional)
- Dados isolados por `instance_id` em todas as tabelas
- **SUPERADMIN**: gerencia contratos B2B com empresas (`instance_id = NULL`)
- **Organizers**: administradores das instâncias, criam N eventos dentro da empresa
- **Staff, Speakers, VIPs, Attendees**: participam dos eventos específicos

**Níveis de Acesso:**
1. **SuperAdmin** → Vê todas as instâncias (empresas) e seus organizers
2. **Organizer** → Vê apenas eventos da sua empresa (instance_id)
3. **Staff/Attendees** → Vê apenas eventos onde participam

## 🗄️ Database Schema

### Tabelas (8)

1. **instances**: Empresas clientes B2B (ex: MultiEventos, EventosPro)
2. **users**: TODOS os usuários (superadmin, organizers, staff, attendees, speakers, vip)
3. **events**: Eventos criados pelos organizers de uma instância
4. **event_areas**: Salas/áreas do evento (Hall, Plenária, Sala VIP, Backstage)
5. **access_packages**: Pacotes de acesso (Básico, Premium, VIP, Add-ons)
6. **registrations**: Inscrições nos eventos (funil completo)
7. **registration_items**: Carrinho de compras (pacotes escolhidos)
8. **user_access**: Acessos efetivos liberados após confirmação de pagamento

### Fluxo de Registro

```
1. User faz PRE_REGISTERED → adiciona items no carrinho (registration_items)
2. Finaliza → AWAITING_PAYMENT
3. Paga → PAID
4. Confirma → CONFIRMED
5. Sistema cria user_access para cada registration_item pago
6. User tem acesso liberado às áreas definidas nos pacotes
```

### User Roles

**Nível de Plataforma:**
- `superadmin`: Gerencia instâncias (empresas clientes) e seus organizers (`instance_id = NULL`)

**Nível de Instância (Empresa):**
- `organizer`: Administrador da empresa, cria e gerencia eventos da sua instance
- `staff`: Equipe de apoio (recepção, coordenação de eventos)

**Nível de Evento:**
- `speaker`: Palestrante (pode receber acesso cortesia)
- `vip`: Convidado especial
- `attendee`: Participante comum que compra ingressos

### Registration Status

- `pre_registered`: Início do cadastro, carrinho aberto
- `awaiting_payment`: Aguardando pagamento
- `paid`: Pagamento confirmado
- `confirmed`: Inscrição confirmada, acesso liberado
- `cancelled`: Cancelada
- `expired`: Expirada

## 🚀 Setup

### 1. Supabase

```bash
# Projeto: jhzqdelkyghibyylrupx.supabase.co
# Migrations aplicadas via Supabase MCP — ver supabase/migrations/
```

### 2. Credenciais e Usuários

Ver **[docs/LOGINS.md](docs/LOGINS.md)** para credenciais, usuários do seed e como criar novos.

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev            # http://localhost:3000
```

## 🔐 Row Level Security (RLS)

**Políticas implementadas (35+)**:

### Users Table
- Users podem ver seus próprios dados
- SUPERADMIN vê todos os usuários
- Organizers veem usuários da sua instância
- Users podem atualizar apenas seus próprios dados

### Events Table
- Todos veem eventos publicados
- Users veem eventos da sua instância (qualquer status)
- Organizers criam eventos na sua instância
- Organizers atualizam seus eventos

### Registrations, Items, Areas, Packages
- Users veem apenas suas próprias inscrições/items
- Users veem áreas/pacotes de eventos publicados
- Organizers gerenciam recursos da sua instância

### User Access
- Users veem apenas seus próprios acessos
- System/Organizers podem criar acessos

**Isolamento Multi-tenant**: Todas as queries filtram por `instance_id` automaticamente.

## 📁 Estrutura do Projeto

```
eventos-bff/
├── database-schema.dbml          # Schema visual (dbdiagram.io)
├── docs/
│   └── LOGINS.md                 # Credenciais e guia de acesso
├── supabase/
│   ├── migrations/               # Migrations numeradas sequencialmente
│   └── functions/
│       └── reset-user-password/  # Edge Function para reset de senha
└── frontend/                     # App React + TypeScript (ver frontend/README.md)
```

## 🎯 Status do Projeto

**Implementado:**
- ✅ Schema do banco + Auth + RLS (35+ políticas)
- ✅ Dashboard SuperAdmin (instâncias, organizers, usuários)
- ✅ Dashboard Organizer (eventos, usuários da instância)
- ✅ CRUD de instâncias, eventos e usuários
- ✅ Fluxo de registro: `pre_registered → awaiting_payment → paid → confirmed`

**Em desenvolvimento:**
- 🔄 Fluxo de pagamento integrado
- 🔄 Check-in por QR Code
- 🔄 Dashboard analytics e relatórios financeiros

## 🛠️ Scripts Úteis

### Resetar Database
```sql
TRUNCATE user_access, registration_items, registrations,
         access_packages, event_areas, events, users, instances
RESTART IDENTITY CASCADE;
```

### Verificar Tabelas
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

## 📚 Documentação

- **[docs/LOGINS.md](docs/LOGINS.md)** — Credenciais, usuários seed e troubleshooting de auth
- **[frontend/README.md](frontend/README.md)** — Stack, estrutura, convenções e rotas do frontend
- **[supabase/functions/reset-user-password/README.md](supabase/functions/reset-user-password/README.md)** — Edge Function de reset de senha
- **database-schema.dbml** — Schema visual (importar em https://dbdiagram.io)

## 👥 Time

- **Product Owner**: Bruno Vieira

---

**Status**: 🟢 Em produção · **Dev**: http://localhost:3000
