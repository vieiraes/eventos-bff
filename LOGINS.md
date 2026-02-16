# 🔑 Logins e Credenciais - Eventos BFF

## ⚡ Login Funcional (Pronto para Usar)

### SUPERADMIN
```
URL: http://localhost:3000/login
Email: superadmin@eventos-bff.com
Senha: superadmin123
Role: superadmin
```

**Permissões:**
- ✅ Gerenciar empresas clientes (instâncias) e seus contratos B2B
- ✅ Visualizar e gerenciar organizers (administradores das empresas)
- ✅ Acesso ao dashboard com stats de instâncias ativas
- ✅ NÃO gerencia eventos individuais (isso é responsabilidade dos organizers)

**Redirecionamento Automático:**
- ✅ Ao fazer login, **superadmin** → `/admin`
- ✅ Ao fazer login, **organizer** → `/organizer`
- ✅ Outros usuários → `/` (listagem de eventos)

---

## 🏢 Instâncias no Sistema (Empresas Clientes)

As seguintes empresas clientes estão cadastradas:

| Instance | Nome Completo | Tipo | Max Eventos | Status |
|----------|---------------|------|-------------|--------|
| **MultiEventos** | MultiEventos Professional | Enterprise | 50 | ✅ Active |
| **EventosPro** | EventosPro Brasil | Premium | 20 | ✅ Active |
| **Campus Events** | Campus Events Manager | Standard | 10 | ✅ Active |

**Domínios Customizados:**
- MultiEventos: `eventos.multieventos.com.br`
- EventosPro: `eventospro.com.br`
- Campus Events: `eventos.campusevents.edu.br`

---

## 👥 Usuários no Banco (Apenas Dados - Sem Login)

> **IMPORTANTE:** Os usuários abaixo existem na tabela `public.users` (criados pelo seed-v2.sql), mas **NÃO têm senha** no Supabase Auth. Para testá-los, você precisa:
> 1. Acessar `/register` e criar conta com o mesmo email, OU
> 2. Criar senha via Supabase Dashboard

### 🏢 MultiEventos Professional (Enterprise)

**👔 Organizers** (Administradores da empresa - role: organizer)
```
carlos.silva@multieventos.com.br    | Carlos Silva (CEO)
maria.santos@multieventos.com.br    | Maria Santos (Diretora de Operações)
```

**🛠️ Staff** (Equipe da empresa - role: staff)
```
joao.recep@multieventos.com.br      | João Recepcionista
ana.coord@multieventos.com.br       | Ana Coordenadora de Campo
```

**Eventos Gerenciados:**
- Congresso Brasileiro de Cirurgia Plástica 2026 (2.000 pessoas)
- Festa do Colonão 2026 (5.000 pessoas)
- Workshop de Técnicas Avançadas (50 pessoas - rascunho)

---

### 💻 EventosPro Brasil (Premium)

**👔 Organizers** (role: organizer)
```
lucas.admin@eventospro.com.br       | Lucas Admin (Diretor Geral)
```

**Eventos Gerenciados:**
- TechConf 2026 - Inteligência Artificial e o Futuro (1.500 pessoas)

---

### 🎓 Campus Events Manager (Standard)

**👔 Organizers** (role: organizer)
```
coordenacao@campusevents.edu.br     | Ana Coordenadora (Coordenadora de Eventos)
```

**Eventos Gerenciados:**
- Nenhum evento criado ainda (instância ativa aguardando primeiro evento)

---

### 🎤 Participantes dos Eventos

**Congresso SBCP 2026:**
- Speakers:
  ```
  dra.patricia@hospital.com.br      | Dra. Patricia Rodrigues (Cirurgiã)
  ```
- VIPs:
  ```
  dr.fernando@clinica.com.br        | Dr. Fernando Costa (Cirurgião VIP)
  ```
- Attendees:
  ```
  julia.almeida@email.com           | Julia Almeida (Médica Residente) - ✅ Confirmado
  pedro.oliveira@email.com          | Pedro Oliveira (Estudante) - ✅ Confirmado
  rafael.costa@email.com            | Rafael Costa (Cirurgião) - ✅ Confirmado
  camila.souza@email.com            | Camila Souza (Estudante) - ⏳ Aguardando Pagamento
  ```

**TechConf 2026:**
- Attendees:
  ```
  mariana.dev@email.com             | Mariana Developer (Tech Lead) - ✅ Confirmado
  ```

---

## 🆕 Como Criar Novos Usuários

### Opção 1: Via Interface Web (Recomendado)
1. Acesse: http://localhost:3000/register
2. Preencha:
   - Nome completo
   - Email (pode usar um dos listados acima)
   - Senha (mínimo 6 caracteres)
3. Clique em "Criar conta"
4. Sistema cria automaticamente com role: `attendee`

### Opção 2: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/jhzqdelkyghibyylrupx/auth/users
2. Clique em "Add user" → "Create new user"
3. Preencha email e senha
4. Marque "Auto Confirm User" para confirmar email automaticamente
5. O trigger `handle_new_user()` criará registro em `public.users`

### Opção 3: Via SQL (Desenvolvedores)
```sql
-- Criar usuário no Supabase Auth
INSERT INTO auth.users (
  instance_id, email, encrypted_password, 
  email_confirmed_at, raw_user_meta_data, role, aud
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'novo.usuario@example.com',
  crypt('suasenha123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Nome do Usuário", "role": "attendee"}'::jsonb,
  'authenticated',
  'authenticated'
);

-- O trigger handle_new_user() criará automaticamente em public.users
```

---

## 🎭 Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|------------|
| **superadmin** | Administrador Global | Acesso total a todas instâncias e funcionalidades |
| **organizer** | Organizador de Eventos | Criar/gerenciar eventos da sua instância |
| **staff** | Equipe de Apoio | Realizar check-in, gerenciar credenciamento |
| **speaker** | Palestrante | Acesso especial a áreas backstage |
| **vip** | Convidado VIP | Acesso premium a áreas exclusivas |
| **attendee** | Participante | Visualizar eventos e realizar inscrições |

---

## 📊 Status de Registro

| Status | Descrição |
|--------|-----------|
| **pre_registered** | Cadastro iniciado, carrinho aberto |
| **awaiting_payment** | Aguardando confirmação de pagamento |
| **paid** | Pagamento confirmado |
| **confirmed** | Inscrição confirmada, acessos liberados |
| **cancelled** | Inscrição cancelada |
| **expired** | Inscrição expirada |

---

## 🔐 Segurança

- ✅ Todas as senhas são hasheadas com bcrypt (gen_salt('bf'))
- ✅ Row Level Security (RLS) ativo em todas as tabelas
- ✅ Multi-tenancy por `instance_id`
- ✅ Tokens JWT gerenciados pelo Supabase Auth
- ✅ SUPERADMIN tem instance_id NULL (acesso global)

---

## 🐛 Troubleshooting

**Erro: "Invalid API key"**
- Verifique o arquivo `frontend/.env`
- Confirme que `VITE_SUPABASE_ANON_KEY` está correto
- Reinicie o servidor Vite

**Não consigo fazer login com usuários do seed**
- Os usuários do seed não têm senha no Supabase Auth
- Crie a conta via `/register` usando o mesmo email
- Ou adicione senha via Supabase Dashboard

**Email não verificado**
- Via Dashboard: marque "Auto Confirm User" ao criar
- Via código: rode `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '...'`

---

## 🎫 Eventos Cadastrados

### SBCP - Congresso Brasileiro de Cirurgia Plástica 2026
- **Data:** 15-18 de Junho de 2026
- **Local:** Centro de Convenções de Vitória, ES
- **Capacidade:** 2.000 pessoas
- **Status:** 📢 Publicado (aceitando inscrições)
- **Receita atual:** R$ 2.950,00 (3 inscrições confirmadas)

### Workshop de Técnicas Avançadas
- **Instância:** SBCP
- **Status:** 📝 Rascunho

### TechConf 2026 - IA e o Futuro
- **Instância:** TechConf Brasil
- **Status:** 📢 Publicado

---

**Última atualização:** 16 de Fevereiro de 2026
