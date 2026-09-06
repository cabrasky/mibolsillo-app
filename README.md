# miBolsillo (mibolsillo-app) — Personal Expense Manager

MiBolsillo: full-stack personal expense tracker with Sankey diagrams, Google OAuth, PostgreSQL, and Kubernetes deployment.

**Producto web:** https://mibolsillo.cabrasky.net

**Integración:** los gastos compartidos (personas Debe/Invitado) se pueden enviar a
**Cuentas Claras** (`cabrasky/cuentas-claras`) con el botón "Añadir a CC" para gestionar
el reparto entre gente; el vínculo queda guardado como `ref_cc` en cada gasto. · **API:** https://mibolsillo.cabrasky.net/api
(alias histórico: gastos.cabrasky.net)

| Stack | Tech |
|-------|------|
| **Frontend** | React 19, TypeScript, Vite, Recharts, React Router |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy (async), Alembic |
| **Auth** | Google OAuth 2.0, JWT |
| **DB** | PostgreSQL 16 |
| **Infra** | Docker, Kubernetes (kustomize), NGINX |
| **CI/CD** | Jenkins (multibranch pipeline) |

Companion mobile app (React Native / Expo, offline-first): `cabrasky/mibolsillo-mobile`.

## Quick Start

```bash
# 1. Env
cp .env.example .env
# Edit .env with your Google OAuth credentials

# 2. Backend + DB
docker compose up -d postgres backend

# 3. Frontend
npm install
npm run build
python3 spa-server.py 8121 0.0.0.0
```

Open `http://localhost:8121`.

## Features

- **Sankey Diagram** — port-based flow visualization (Ingresos → Disponible → Gastos)
- **Smart suggestions** — category/type/method suggested from your history as you type
- **Category filters** — charts filterable by category, with monthly averages and year-over-year comparison
- **Invitations** — flag expenses paid as a treat (no repayment) with filters and totals
- **i18n** — ES, EN, PT with locale selector
- **Dual layout** — Desktop sidebar + Mobile bottom nav (auto-adaptive)
- **Charts** — Recharts (bars, pie, area, line) + custom SVG Sankey
- **Google OAuth** — secure login with JWT tokens
- **Multi-user** — each user's data isolated by user_id

## Project Layout

```
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # Entry point
│   │   ├── config.py      # Settings from env
│   │   ├── database.py    # Async SQLAlchemy engine
│   │   ├── models/        # User, Expense, Income, Goal, Subscription
│   │   ├── schemas/       # Pydantic request/response models
│   │   └── routers/       # Auth + CRUD endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── src/               # React frontend
│   ├── components/    # Dashboard, Sankey, Charts, Expenses, etc.
│   ├── i18n.tsx       # Multi-language provider
│   └── store.ts       # localStorage persistence
├── k8s/               # Kubernetes manifests (kustomize)
├── docker-compose.yml
└── Jenkinsfile        # CI/CD pipeline
```

See [SETUP.MD](SETUP.MD) for full deployment instructions.
