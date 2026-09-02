# DS-Mentor (DotSquares Mentor)

Enterprise Process & SOP Assistant — a role-aware RAG chatbot that helps employees follow company processes, SOPs, and KPIs. Built with FastAPI, LangGraph, Groq, Qdrant, and Next.js.

## Architecture

```
ds-mentor/
├── backend/          FastAPI + LangChain/LangGraph + Groq + Qdrant
├── frontend/         Next.js 14 (App Router)
├── sample_data/      12 pre-loaded SOP PDFs
├── docker-compose.yml
└── .env.example
```

## Features

### Employee Interface
- **Role-aware RAG chatbot** — ask questions about SOPs, processes, KPIs, filtered by your role
- **Your Day panel** — calendar events, pending tasks, timesheet status, reminders (mock, designed for live EMS connection)

### Admin Panel
- Upload and tag SOP documents by role
- View, delete, re-index documents

### Management View
- **Project Health page** — eagle's eye view of projects with task tracking, updates, and health indicators (green/yellow/red)

### Architecture for Future
- Single-agent LangGraph design ready for multi-agent supervisor expansion
- Mock assistant API designed to swap to live EMS APIs
- PostgreSQL relationship tables simulate knowledge graph (upgradeable to Neo4j)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Backend | FastAPI + LangChain + LangGraph |
| Frontend | Next.js 14 (App Router) |
| Vector DB | Qdrant (hybrid dense + sparse) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Groq (Llama 3 70B) |
| Database | PostgreSQL (users, conversations, graph data) |
| Infra | Docker Compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Groq API key (free: https://console.groq.com)

### Setup

1. **Clone and configure**
```bash
cd ds-mentor
cp .env.example .env
# Edit .env: set GROQ_API_KEY=your_key_here
```

2. **Start services**
```bash
docker compose up -d
```

3. **Run database migrations**
```bash
docker compose exec backend alembic upgrade head
```

4. **Seed mock data**
```bash
docker compose exec backend psql -U postgres -d dsmentor -f /app/seed_data/seed.sql
```

5. **Index sample documents**
```bash
curl -X POST http://localhost:8000/api/v1/admin/documents/reindex \
  -H "Authorization: Bearer <admin_token>"
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## Local Dev (Hybrid) — Recommended

Run only the data stores (Postgres, Qdrant, optional Redis) in Docker and the app locally.
The images are pulled automatically by Docker Compose — no manual downloads.

### Prerequisites
- Docker Desktop
- Python 3.12
- Node.js 18+ and npm
- Groq API key (free: https://console.groq.com)

### Setup

1. **Clone and configure**
```bash
git clone <repo> && cd ds-mentor
cp .env.example .env
# Edit .env: set GROQ_API_KEY=your_key_here
```
The `.env.example` defaults point at the Docker-mapped ports (Postgres `5433`,
Qdrant `6333`, Redis `6379`), so they work as-is for the hybrid setup.

2. **Start only the data stores**
```bash
docker compose up -d postgres qdrant
# If you need Redis (currently unused by the app), add: docker compose up -d redis
```

3. **Backend (local)**
```bash
cd backend
python -m venv venv
venv\Scripts\pip install torch --index-url https://download.pytorch.org/whl/cpu
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. **Run database migrations**
```bash
venv\Scripts\alembic upgrade head
```

5. **Seed mock users & projects** (via the Postgres container, which ships `psql`)
```bash
docker compose exec -T postgres psql -U postgres -d dsmentor < backend/seed_data/seed.sql
```

6. **Seed & index the sample SOP documents into Qdrant**
```bash
cd backend
venv\Scripts\python seed_data\seed_docs.py
```

7. **Frontend (local)**
```bash
cd frontend
npm install
npm run dev
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

> **Note:** Redis is not used by the app at runtime; the `redis` container is only
> needed if you enable a feature that depends on it.

### Demo Users (seeded, password: `password123`)
| Email | Role |
|-------|------|
| admin@example.com | Admin |
| john.dev@example.com | Developer |
| jane.qa@example.com | QA Engineer |
| bob.pm@example.com | Project Manager |
| alice.devops@example.com | DevOps Engineer |
| charlie.po@example.com | Product Owner |

## API Endpoints

```
POST   /api/v1/auth/register       Register new user
POST   /api/v1/auth/login          Login
POST   /api/v1/auth/refresh        Refresh token
GET    /api/v1/auth/me             Current user

POST   /api/v1/chat                Send message (RAG query)
GET    /api/v1/chat/conversations  List conversations
GET    /api/v1/chat/conversations/{id}/messages
DELETE /api/v1/chat/conversations/{id}

GET    /api/v1/assistant/dashboard Get "Your Day" mock data

POST   /api/v1/admin/documents     Upload SOP [admin]
GET    /api/v1/admin/documents     List documents [admin]
DELETE /api/v1/admin/documents/{id} Delete document [admin]
POST   /api/v1/admin/documents/reindex Reindex all [admin]

GET    /api/v1/projects            List projects
GET    /api/v1/projects/{id}       Project detail

GET    /health                     Health check
```

## Roadmap

- [x] Phase 1: Foundation (project skeleton, Docker, config)
- [x] Phase 2: Auth & Roles (JWT, register/login)
- [x] Phase 3: Mock Graph (projects, people, tasks)
- [x] Phase 4: Admin Panel (document upload/tagging)
- [x] Phase 5: Ingestion Pipeline (PDF -> Qdrant)
- [x] Phase 6: RAG Engine (LangGraph + Groq)
- [x] Phase 7: Chat API (conversations, streaming)
- [x] Phase 8: Mock Assistant API (Your Day)
- [x] Phase 9-11: Frontend (Chat UI, Day Panel, Project Health)
- [x] Phase 12: Sample Data (12 SOP PDFs)
- [x] Phase 13: Polish (README, config)

### Future
- [ ] EMS API integration (calendar, timesheets, live data)
- [ ] Multi-agent supervisor routing
- [ ] Knowledge graph (Neo4j) for root cause analysis
- [ ] Eagle's Eye dashboard with analytics
- [ ] Push notifications & reminders
- [ ] Multi-tenant support
