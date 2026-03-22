# 🎫 Eventos BFF

Sistema SaaS Multi-tenant para Gestão de Eventos Corporativos

---

## 🚀 Acesso Rápido

**Servidor:** http://localhost:3000

**Login SuperAdmin:**
- 📧 Email: `superadmin@eventos-bff.com`
- 🔑 Senha: `superadmin123`
- 🎛️ Dashboard: http://localhost:3000/admin

**Documentação:**
- 🔑 [Logins e Credenciais](docs/LOGINS.md) - Todos os usuários e como criar novos
- 💻 [Frontend](frontend/README.md) - Documentação React + TypeScript
- 🗄️ [Database](supabase/README.md) - Migrations e Supabase

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
# Projeto criado: jhzqdelkyghibyylrupx.supabase.co

# Migration aplicada
Migration: 001_initial_schema
Status: ✅ Applied
Tables: 8 created
```

### 2. Database Seed

```bash
# Dados de exemplo já inseridos (supabase/seed-v2.sql):
- 1 SUPERADMIN (Bruno Vieira)
- 3 Instances (Empresas): MultiEventos, EventosPro, Campus Events
- 4 Organizers (Admins das empresas)
- 2 Staff (MultiEventos)
- 7 Participantes (speakers, vips, attendees)
- 4 Events (2 da MultiEventos, 1 da EventosPro, 1 draft)
- 9 Event Areas
- 7 Access Packages
- 6 Registrations (vários status)
- R$ 2.950,00 em receita confirmada (eventos das empresas)
```

### 3. Credenciais

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Variáveis:
- `SUPABASE_URL`: https://jhzqdelkyghibyylrupx.supabase.co
- `SUPABASE_ANON_KEY`: eyJhbGci... (já preenchido)
- `SUPABASE_SERVICE_ROLE_KEY`: (obter no dashboard)

### 4. Auth Integration

Auth integrado com triggers automáticos:

```sql
-- Quando usuário se registra no Supabase Auth:
auth.users → trigger → public.users (auto-criado)

-- Funções:
- handle_new_user(): Cria registro em public.users
- handle_user_update(): Sincroniza email_verified e last_login_at
```

**Helper Functions:**
- `get_user_profile()`: Dados do usuário + nome da instância
- `get_user_events()`: Eventos com status de inscrição do usuário
- `get_user_access_for_event(event_id)`: Pacotes de acesso ativos

### 5. Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev  # Roda na porta 3000
```

**Funcionalidades:**
- ✅ Login/Registro com Supabase Auth
- ✅ Context API para autenticação
- ✅ Rotas protegidas por role
- ✅ Design com Tailwind CSS
- ✅ **Dashboard SuperAdmin** - Gerencia instâncias e organizers
- ✅ **Dashboard Organizer** - Gerencia eventos da própria empresa
- ✅ Listagem de eventos com filtros
- ✅ Gerenciamento de usuários por role

**Rotas:**
- `/login` - Autenticação (redireciona por role)
- `/register` - Criar conta
- `/` - Eventos públicos (protegida)
- **SuperAdmin:**
  - `/admin` - Dashboard com stats de instâncias e organizers
  - `/admin/instances` - Gerenciar empresas clientes
  - `/admin/users` - Gerenciar organizers das instâncias
- **Organizer:**
  - `/organizer` - Dashboard com stats dos eventos da empresa
  - `/organizer/events` - Gerenciar eventos da sua instância

Veja mais em [frontend/README.md](frontend/README.md)

## � Logins e Acesso

### Login Funcional (Pronto para Usar)

Atualmente, apenas o **SUPERADMIN** possui credenciais de acesso no Supabase Auth:

**SUPERADMIN** (Acesso Total ao Sistema)
```
Email: superadmin@eventos-bff.com
Senha: superadmin123
Role: superadmin
Permissões: Gerenciar todas as instâncias, usuários e eventos
```

**Como acessar:**
1. Acesse: http://localhost:3000/login
2. Use as credenciais acima
3. Dashboard Admin disponível em: http://localhost:3000/admin

### Usuários no Banco de Dados (Seed)

Os seguintes usuários existem na tabela `public.users` (criados pelo seed.sql), mas **NÃO possuem login** no Supabase Auth ainda:

#### SBCP - Sociedade Brasileira de Cirurgia Plástica

**Organizers:**
- `carlos.silva@sbcp.org.br` - Dr. Carlos Silva (Presidente)
- `maria.santos@sbcp.org.br` - Maria Santos (Coordenadora)

**Staff:**
- `joao.recep@eventos.com` - João Recepção (Recepcionista)
- `ana.coord@eventos.com` - Ana Coordenadora

**Speakers/VIP:**
- `dra.patricia@hospital.com.br` - Dra. Patricia Rodrigues (Cirurgiã Plástica)
- `dr.fernando@clinica.com.br` - Dr. Fernando Costa (Cirurgião)

**Attendees:**
- `julia.almeida@email.com` - Julia Almeida (Médica Residente)
- `pedro.oliveira@email.com` - Pedro Oliveira (Estudante Medicina)
- `camila.souza@email.com` - Camila Souza (Estudante)
- `rafael.costa@email.com` - Rafael Costa (Cirurgião)

#### TechConf Brasil

**Organizers:**
- `admin@techconf.com.br` - Lucas Admin (CEO)

**Attendees:**
- `mariana.dev@email.com` - Mariana Developer (Tech Lead)

### Como Criar Novos Usuários

Para testar o sistema com outros usuários:

1. **Opção 1 - Registro via Interface:**
   - Acesse: http://localhost:3000/register
   - Preencha: Nome completo, Email, Senha
   - O sistema criará automaticamente o usuário com role `attendee`

2. **Opção 2 - Usar os emails do seed:**
   - Registre-se com um dos emails listados acima
   - O sistema sincronizará os dados com a tabela `public.users`

3. **Opção 3 - Criar via Supabase Dashboard:**
   - Acesse: https://supabase.com/dashboard/project/jhzqdelkyghibyylrupx/auth/users
   - Clique em "Add user" → "Create new user"
   - Preencha email e senha
   - O trigger `handle_new_user()` criará automaticamente o registro em `public.users`

### Instâncias

1. **SBCP** (Enterprise)
   - Eventos: Congresso CBCP 2026, Workshop Técnicas Avançadas
   - 10 usuários
   
2. **TechConf Brasil** (Premium)
   - Eventos: TechConf 2026 - IA e Futuro
   - 2 usuários
   
3. **UFES** (Standard)
   - Sem eventos ainda

### Evento: CBCP 2026

```
Status: published
Datas: 15-18 Jun 2026
Local: Centro de Convenções de Vitória
Capacidade: 2000
Inscrições: 5 (3 confirmadas, 1 aguardando pgto, 1 pré-cadastro)
Receita: R$ 2.950,00
```

**Áreas:**
- Hall Principal
- Sala Plenária
- Sala 1 - Workshops
- Sala 14 - VIP
- Área de Stands
- Backstage

**Pacotes:**
- Básico (R$ 450): Hall + Plenária + Stands
- Acesso Sala 1 (R$ 200): Addon workshops
- Premium (R$ 800): Todas exceto Sala 14 VIP
- VIP Full Access (R$ 1.500): Acesso total

### Exemplo de Inscrição Completa

**Julia Almeida** (CBCP2026-0001):
- Status: confirmed ✅
- Pacotes: Básico + Sala 1
- Total: R$ 650,00
- Acessos ativos: 2 (liberados para as áreas)

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
├── .env.example          # Template de variáveis de ambiente
├── .gitignore            # Git ignore configurado
├── database-schema.dbml  # Schema visual (dbdiagram.io)
├── README.md             # Este arquivo
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # Schema inicial (8 tabelas)
│   │   └── 002_auth_integration.sql    # Auth + RLS + Helper functions
│   ├── seed.sql          # Dados de exemplo
│   └── README.md         # Instruções Supabase
└── frontend/
    ├── src/
    │   ├── components/   # Componentes reutilizáveis
    │   ├── hooks/        # Custom hooks (useAuth)
    │   ├── pages/        # Páginas (Login, Register, Events)
    │   ├── services/     # Supabase client
    │   ├── types/        # TypeScript definitions
    │   ├── App.tsx       # Rotas
    │   └── main.tsx      # Entry point
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── README.md         # Docs do frontend
```

## 🎯 Próximos Passos

### Sprint Atual (Demanda #2)
- [x] ✅ Criar schema do banco de dados
- [x] ✅ Aplicar migration no Supabase
- [x] ✅ Popular com dados de exemplo
- [x] ✅ Configurar Supabase Auth
- [x] ✅ Integrar Auth com tabela users (triggers automáticos)
- [x] ✅ Implementar RLS completo (35+ políticas)
- [x] ✅ Criar helper functions para API
- [x] ✅ Implementar frontend React + TypeScript
- [x] ✅ Autenticação (Login/Registro)
- [x] ✅ Listagem de eventos
- [ ] 🔄 Fluxo de inscrição em eventos
- [ ] 🔄 Carrinho de compras (registration_items)

### Próximas Demandas
- [ ] Detalhes do evento e seleção de pacotes
- [ ] Sistema de pagamentos (integração)
- [ ] User profile e edição
- [ ] Dashboard do organizador
  - [ ] Criar/editar eventos
  - [ ] Gerenciar áreas e pacotes
  - [ ] Visualizar inscrições
  - [ ] Relatórios financeiros
- [ ] QR Codes para check-in
- [ ] Dashboard de analytics
- [ ] Notificações por email
- [ ] Upload de imagens (eventos, avatares)

## 🛠️ Scripts Úteis

### Resetar Database
```sql
-- Via Supabase SQL Editor ou MCP
TRUNCATE user_access, registration_items, registrations, 
         access_packages, event_areas, events, users, instances 
RESTART IDENTITY CASCADE;
```

### Re-seed
```bash
# Executar o conteúdo de supabase/seed.sql
# Via Supabase Dashboard > SQL Editor
# Ou via Supabase MCP
```

### Verificar Tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Consultar Eventos com Estatísticas
```sql
SELECT 
  e.name as evento,
  e.status,
  COUNT(DISTINCT r.id) as total_inscricoes,
  COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) as confirmadas,
  SUM(CASE WHEN r.status = 'confirmed' THEN r.total_amount ELSE 0 END) as receita
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.name, e.status;
```

## 📝 Notas Importantes

- **registration_id** em `user_access` pode ser NULL para acessos cortesia (speakers, vips sem registro formal)
- **instance_id** em `users` é NULL apenas para SUPERADMIN
- **allowed_areas** em `access_packages` é JSONB com array de UUIDs das areas
- **Shopping cart**: `registration_items` permite comprar múltiplos pacotes em uma inscrição
- **Funil completo**: Rastreamos desde pre_registered até confirmed com timestamps

## 📚 Documentação

### Documentação Interna
- **[LOGINS.md](docs/LOGINS.md)** - Credenciais e guia de acesso (SuperAdmin, usuários seed, como criar novos)
- **[frontend/README.md](frontend/README.md)** - Documentação completa do frontend React
- **[supabase/README.md](supabase/README.md)** - Instruções do Supabase e migrations
- **database-schema.dbml** - Schema visual (importar em https://dbdiagram.io)

### Recursos Externos
- Schema visual interativo: https://dbdiagram.io (importar `database-schema.dbml`)
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

## 👥 Time

- **Product Owner**: Bruno Vieira
- **Dev Architect**: GitHub Copilot (Claude Sonnet 4.5)

---

**Status**: 🟢 Database + Auth + Frontend implementados e funcionando!

**Servidor de Desenvolvimento**: http://localhost:3000

**Última atualização**: 16 de Fevereiro de 2026
