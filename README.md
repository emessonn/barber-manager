# BarberManager 💈

Um SaaS premium completo para gerenciamento de barbearias, construído com o stack tecnológico mais moderno (cutting-edge).

## 🚀 Características

### 📱 **Agendamento Cliente (Multi-tenant)**
- Interface em 4 passos intuitiva e mobile-first
- Seleção dinâmica de serviços com preços
- Escolha de profissional disponível
- Calendário com bloqueio automático de horários
- Confirmação com SMS via WhatsApp (Twilio)

### 🏢 **Dashboard Admin Protegido**
- Autenticação via Google OAuth (Auth.js v5)
- Métricas de faturamento, agendamentos e clientes
- CRUD completo de serviços e barbeiros
- Agenda visual com gerenciamento de horários
- Controle de estoque com alertas

### 💰 **Gestão Financeira**
- Fluxo de caixa automático (entradas/saídas)
- Cálculo automático de comissões por barbeiro
- Relatórios por período
- Integração com agendamentos

### 👥 **CRM de Clientes**
- Histórico de serviços
- Controle de fidelidade
- Lembretes de aniversário
- Notificações automáticas

## 🛠️ Stack Tecnológico

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| Next.js | 15+ | Framework full-stack |
| React | 19 | Interface (hooks modernos) |
| TypeScript | 5.3+ | Type safety |
| Prisma | 6+ | ORM type-safe |
| PostgreSQL | Latest | Banco (Vercel Postgres) |
| Auth.js | 5 | Autenticação OAuth |
| Tailwind CSS | 4 | Styling mobile-first |
| Shadcn/ui | Latest | Componentes reutilizáveis |
| TanStack Query | 5 | Gerenciamento de estado |
| React Hook Form | 7.50+ | Formulários |
| Zod | 3.22+ | Validação |
| Twilio | 4 | WhatsApp/SMS |

## 📁 Estrutura de Diretórios

```
app/                           # Next.js App Router
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
├── (auth)/                    # Auth group
│   ├── login/page.tsx
│   └── layout.tsx
├── (admin)/                   # Admin protected group
│   ├── layout.tsx             # Sidebar + proteção
│   ├── dashboard/page.tsx     # Dashboard com métricas
│   ├── services/page.tsx      # CRUD Serviços
│   ├── barbers/page.tsx       # CRUD Barbeiros
│   ├── bookings/page.tsx      # Agenda
│   ├── finances/page.tsx      # Fluxo de caixa
│   ├── inventory/page.tsx     # Estoque
│   └── commissions/page.tsx   # Comissões
├── [barbershop-slug]/         # Rota pública
│   ├── page.tsx               # Booking flow (4 passos)
│   └── api/
│       └── available-times/   # Horários disponíveis
└── api/
    ├── auth/[...nextauth]/    # Auth routes
    └── webhooks/              # Lembretes

components/
├── ui/                        # Shadcn components
├── shared/                    # Shared components
│   ├── Sidebar.tsx
│   └── ...
├── booking/                   # Booking flow components
│   ├── BookingStepper.tsx
│   ├── ServiceSelector.tsx
│   ├── BarberSelector.tsx
│   ├── DateTimeSelector.tsx
│   └── ConfirmationStep.tsx
└── admin/                     # Admin components

lib/
├── auth.ts                    # Auth.js config
├── prisma.ts                  # Prisma singleton
├── validators.ts              # Zod schemas
└── utils.ts                   # Utilities

actions/                       # Server Actions
├── services.ts
├── bookings.ts
├── barbers.ts
└── finances.ts

prisma/
├── schema.prisma              # Modelos de dados
└── seed.ts                    # Initial data

styles/
└── globals.css                # Tailwind + custom styles
```

## 🗄️ Modelos de Dados (Prisma)

- **Barbershop**: Nome, slug, endereço, logo
- **User**: Email, role (ADMIN/BARBER), vinculado a barbershop
- **Barber**: Profissional com horários customizáveis
- **Service**: Serviços (nome, preço, duração)
- **Booking**: Agendamentos com status (PENDENTE/CONFIRMADO/FINALIZADO/CANCELADO)
- **Client**: CRM com histórico de serviços
- **FinancialRecord**: Entradas/saídas automáticas
- **Commission**: Comissões automáticas por booking
- **InventoryItem**: Estoque com alertas
- **Reminder**: Notificações WhatsApp/SMS/Email

## 🚀 Quick Start

### 1. Requisitos
- Node.js 18+
- npm ou yarn
- PostgreSQL (ou Vercel Postgres)

### 2. Instalação
```bash
npm install
cp .env.example .env.local
# Configure as variáveis de ambiente
```

### 3. Database Setup
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Desenvolvimento
```bash
npm run dev
# Acesse http://localhost:3000
```

### 5. Login
- Página pública: `http://localhost:3000/premium-barbershop` (slug do seed)
- Admin: `/admin/dashboard` (requer Google OAuth)

## 🔐 Variáveis de Ambiente

```env
# Database
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generated-secret

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Twilio (Reminders)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Node
NODE_ENV=development
```

## 🎨 Design System

- **Cores**: Zinc (neutro) + Amber (destaque premium)
- **Dark Mode**: Padrão (Clean/Sophisticated)
- **Tipografia**: Inter (sans) + JetBrains Mono (código)
- **Mobile-first**: Totalmente responsivo

## ✅ Funcionalidades Implementadas

- [x] Setup inicial (Next.js, Prisma, Auth.js, Tailwind)
- [x] Schema Prisma com 10+ modelos
- [x] Autenticação Google OAuth
- [x] Fluxo de agendamento em 4 passos
- [x] Dashboard admin com métricas
- [x] API de horários disponíveis
- [x] Sidebar navegação
- [x] Componentes UI base (Dialog, Button, Input, Card)

## 🔄 Próximas Fases

### Fase 2: CRUD Admin Completo
- [ ] Tabelas e formulários CRUD (Serviços, Barbeiros, Clientes)
- [ ] Validações com Zod + React Hook Form
- [ ] Upload de imagens (logo, avatar)

### Fase 3: Funcionalidades Avançadas
- [ ] Gestão de comissões com relatórios
- [ ] Controle de estoque com alertas
- [ ] Dashboard financeiro com gráficos
- [ ] CRM com histórico de clientes

### Fase 4: Notificações
- [ ] Integração Twilio (WhatsApp + SMS)
- [ ] Job scheduler (lembretes automáticos)
- [ ] Notificações push

### Fase 5: Deploy & Otimização
- [ ] Deploy em Vercel
- [ ] Otimizações de performance
- [ ] SEO e analytics
- [ ] Testes E2E

## 📝 Licença

MIT - Desenvolvido para fins educacionais e comerciais.

---

**Desenvolvido por**: BarberManager Team
**Stack**: Next.js 15 + React 19 + TypeScript + Prisma + Tailwind CSS
