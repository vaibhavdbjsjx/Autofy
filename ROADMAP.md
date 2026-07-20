# Autofy MVP Implementation Roadmap & Software Architecture Design
**Author:** Senior SaaS CTO & Systems Architect  
**Version:** 1.0 (Production Release ready)  
**Target:** Launching MVP in 30 Days and Securing the First 3 Paying Customers  

---

## 🚀 Architectural Overview

Autofy is engineered as a high-performance, resilient, and secure full-stack SaaS platform designed to run in highly scalable containerized cloud environments. 

```
                                      ┌────────────────────────────────┐
                                      │   Meta WhatsApp Cloud API      │
                                      └────────────────▲───────────────┘
                                                       │ Live Webhook
                                                       ▼
┌──────────────────┐               ┌───────────────────────────────────┐               ┌───────────────────┐
│     Frontend     │  REST / WS    │        Backend (FastAPI)          │  SQL / ORM    │     Database      │
│  (React + Vite)  ├──────────────►│   Auth, AI Agents, APIs, Hooks    ├──────────────►│ (Supabase PgSQL)  │
│                  │               │                                   │               │  Cache (Redis)    │
└──────────────────┘               └─────────────────┬─────────────────┘               └───────────────────┘
                                                     │ Secure HTTPS
                                                     ▼
                                      ┌────────────────────────────────┐
                                      │  Gemini API (Cognitive Layer)  │
                                      │  Function Calling, Embeddings  │
                                      └────────────────────────────────┘
```

### Core Stack Standards:
- **Frontend SPA:** React 18+ with Vite, Tailwind CSS, Lucide Icons, and Motion for transitions. Fully decoupled, static-host ready (Vercel/Cloudflare).
- **Backend APIs:** FastAPI (Python 3.11+) for high throughput, asynchronous concurrency, auto-generated OpenAPI schemas, and native type validation.
- **Database:** PostgreSQL (Supabase) with PGVector enabled for semantic context lookups, real-time trigger listening, and robust transactional schemas.
- **Cognitive Engine:** Google @google/genai TypeScript SDK / Python google-genai SDK leveraging **gemini-2.5-flash** for response synthesis and **text-embedding-004** for knowledge retrieval vectors.
- **Messaging Node:** Meta WhatsApp Business Cloud API.

---

## 📂 1. Directory Structure Blueprint (FastAPI + React Monorepo)

```
autofy/
├── backend/                       # FastAPI Server Framework
│   ├── app/
│   │   ├── core/                  # Core Config and Middleware
│   │   │   ├── config.py          # App settings (Pydantic BaseSettings)
│   │   │   ├── security.py        # JWT generation, token verification, password hashing
│   │   │   └── middleware.py      # CORS, custom rate limiters, logging handlers
│   │   ├── db/                    # DB connections & ORM models
│   │   │   ├── session.py         # SQLAlchemy engine & session maker
│   │   │   └── base.py            # Declared Base for metadata imports
│   │   ├── models/                # SQLAlchemy Core Database Models
│   │   │   ├── business.py
│   │   │   ├── appointment.py
│   │   │   ├── conversation.py
│   │   │   ├── lead.py
│   │   │   └── payment.py
│   │   ├── schemas/               # Pydantic Request/Response Validators
│   │   │   ├── auth.py
│   │   │   ├── business.py
│   │   │   └── lead.py
│   │   ├── services/              # Business Logic & Core Integration Layers
│   │   │   ├── ai.py              # Gemini prompt injection, RAG engine, memory routing
│   │   │   ├── whatsapp.py        # Webhook parsing, outbound template sender
│   │   │   └── payments.py        # Gateway adapters (Stripe, Razorpay APIs)
│   │   └── routers/               # API Router Handlers (Versions separated)
│   │       ├── auth.py
│   │       ├── business.py
│   │       ├── conversations.py
│   │       └── webhooks.py        # WhatsApp Inbound + Gateway callbacks
│   │   └── main.py                # App Initialization
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                      # Fully configured React Application
│   ├── src/
│   │   ├── components/            # Extracted UI elements & Tabs 
│   │   │   ├── AnalyticsTab.tsx   
│   │   │   ├── AppointmentsTab.tsx
│   │   │   ├── ConversationsTab.tsx
│   │   │   ├── Dashboard.tsx      # Main application core dashboard
│   │   │   ├── IntegrationsTab.tsx# Marketplace connections panel
│   │   │   ├── KnowledgeBaseTab.tsx
│   │   │   ├── LeadsTab.tsx       # Interactive pipeline visualizer
│   │   │   ├── Onboarding.tsx     # 8-step business personalization flow
│   │   │   └── SettingsTab.tsx    # Secure team & API controls
│   │   ├── App.tsx                # Client Routing logic
│   │   ├── index.css              # Global Tailwind configuration imports
│   │   └── types.ts               # Shared TypeScript schemas
│   ├── package.json
│   └── vite.config.ts
└── ROADMAP.md                     # MVP Architectural Layout Document
```

---

## 🗄️ 2. Database Schema (PostgreSQL)

Deploy on Supabase or generic PgSQL. Includes indexes and Vector mappings for the AI search engines.

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Essential for Semantic RAG

-- 1. BUSINESSES TABLE
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    classification VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(255),
    address TEXT,
    logo_url TEXT,
    business_hours VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'IST',
    config_agent_name VARCHAR(100) DEFAULT 'AutoBot',
    config_welcome_message TEXT,
    config_fallback_message TEXT,
    config_confidence_threshold DECIMAL(3, 2) DEFAULT 0.75,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS & ACCOUNT PREFERENCES
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin', -- Owner, Admin, Manager, Support Agent
    status VARCHAR(50) DEFAULT 'Active', -- Active, Pending, Inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. KNOWLEDGE BASE ITEMS TABLE (RAG SOURCE DATABASE)
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'service', 'product', 'faq', 'policy'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    price DECIMAL(10, 2), -- Nullable, for services & products
    stock INTEGERDEFAULT 0,
    search_vector vector(1536), -- Vector embedding representation (Gemini/Ada 3D)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WHATSAPP CONVERSATIONS LEDGER
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    ai_status BOOLEAN DEFAULT TRUE, -- TRUE = AI answers automatically, FALSE = Paused for human handoff
    session_status VARCHAR(50) DEFAULT 'Active', -- Active, Escalated, Closed
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, customer_phone)
);

-- 5. MESSAGES LEDGER
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'customer', 'ai', 'human_agent'
    body TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, document, interactive
    metadata JSONB, -- Storage of delivery statuses, media ids, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. LEADS PIPELINE MODULE
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(100),
    pipeline_stage VARCHAR(100) DEFAULT 'New Lead', -- New Lead, Contacted, Appointment Scheduled, Paid, Converted
    lead_score INTEGER DEFAULT 50,
    source VARCHAR(100) DEFAULT 'WhatsApp Chatbot',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. APPOINTMENTS SCHEDULER
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    service_id UUID,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Completed, Canceled
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SECURE PAYMENT LINKS & TRANSACTIONS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    description VARCHAR(255),
    gateway VARCHAR(50) NOT NULL, -- Stripe, Razorpay, PhonePe
    gateway_payment_id VARCHAR(255), -- ID returned by external gateways
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Failed, Refunded
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. API INTEGRATIONS AND WEBHOOK SETTINGS
CREATE TABLE api_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    active_scopes TEXT[],
    rate_limit_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OPTIMIZATION INDEXINGS
CREATE INDEX idx_knowledge_base_search_vector ON knowledge_base USING ivfflat (search_vector cosine_ops);
CREATE INDEX idx_conversations_phone ON conversations(business_id, customer_phone);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_leads_stage ON leads(business_id, pipeline_stage);
CREATE INDEX idx_appointments_time ON appointments(business_id, start_time);
```

---

## 🔌 3. API Build Order & Documentation Outline

High throughput asynchronous routers.

### Category A: Core System Endpoints (P0)
1. **`POST /api/v1/auth/signup`**: Configures corporate business profile parameters, owner account schemas, hash validation.
2. **`POST /api/v1/auth/login`**: Authenticates email, returns standard signed JWT bearer token credentials (claims: `user_id`, `business_id`, `role`).
3. **`GET /api/v1/business/profile`**: Returns active business properties, hours, configuration keys.
4. **`PUT /api/v1/business/profile`**: Modifies profile parameters.

### Category B: WhatsApp Cloud API & Webhooks (P0)
1. **`GET /api/v1/webhooks/whatsapp`**: Webhook validation endpoint. Hooked directly into Meta's app setup challenge validation parameters.
2. **`POST /api/v1/webhooks/whatsapp`**: The operational pipeline. Processes inbound text, calls active RAG routing agents, persists transactions context:
   - Validates incoming SHA256 header signatures.
   - Parses payload for sender details, message body, dynamic text components, media.
   - Launches transactional pipeline queues to send immediate auto-replies.

### Category C: AI Systems & Knowledge Base (P0)
1. **`GET /api/v1/knowledge`**: Returns business services, products, policies catalog.
2. **`POST /api/v1/knowledge`**: Uploads text content, calls Gemini API embeddings endpoint in backend to construct vectors and sets PgSQL search paths records.

### Category D: Conversations Console (P0)
1. **`GET /api/v1/conversations`**: Returns paginated active chat sessions, statuses, contact names.
2. **`POST /api/v1/conversations/{id}/reply`**: Allows human system worker to override AI, sending outbound payload instantly over Meta API.
3. **`PATCH /api/v1/conversations/{id}/toggle-ai`**: Disables auto chatbot responses for specific numbers allowing direct human support agent resolution.

---

## 🤖 4. AI & RAG Engine Architecture

Autofy employs a customized **RAG (Retrieval-Augmented Generation)** loop to answer queries safely without hallucinations.

```
Incoming Customer MSG ──► Semantic Embedding Generation (Gemini text-embedding-004)
        │
        ▼
   Cosine Search on knowledge_base (PgSQL vector matching)
        │
        ▼
Retrieve Top 3 Context Blocks ──► Prompt Construction (Instructions + Rules)
        │
        ▼
   Gemini API Model Generation (gemini-2.5-flash)
        │
        ▼
Verify Output ──► Outbound Delivery (Meta WhatsApp Cloud API)
```

### High-Fidelity Gemini System Prompt Template
```python
SYSTEM_PROMPT = """
You are {agent_name}, the master customer service employee representing {business_name}.
Your job is to assist customers politely, accurately, and represent your business effectively based ONLY on the provided Context catalog items.

---
BUSINESS CONTEXT:
Business Classification: {classification}
Operating Hours: {hours}
Operating Timezone: {timezone}

CONTEXT ITEMS (Services, Products, FAQ, Policy Documents):
{context_data}
---

RULES:
1. Speak in a {tone} tone. Keep your responses concisely detailed yet brief.
2. Only present prices or properties listed explicitly in the Context. Never make up inventory, prices, availability, or policies.
3. If the answer is not available in the Context, respond with: "{fallback_message}" and immediately offer to flag a human manager to follow up.
4. If the customer indicates they want to cancel, buy, book, or schedule an appointment, prioritize generating a clear confirmation and call the respective tool.

YOUR CONVERSATIONAL MEMORY HISTORY:
{history_logs}

Customer Message: {customer_message}
Answer:
"""
```

---

## ⚡ 5. WhatsApp Outbound Integration Helper Code (Python FastAPI Example)

FastAPI async worker to send instant outbound message packages to Meta endpoints.

```python
import httpx
from pydantic import BaseModel

class OutboundMessage(BaseModel):
    recipient_phone: str
    message_text: str

async def send_whatsapp_message(business_phone_id: str, access_token: str, payload: OutboundMessage):
    """
    Delivers direct outbound conversational text packets to Meta servers.
    We leverage httpx to execute non-blocking outbound TLS events fast.
    """
    url = f"https://graph.facebook.com/v19.0/{business_phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": payload.recipient_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": payload.message_text
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Failed outbound delivery: {response.status_code} - {response.text}")
        return response.json()
```

---

## 📈 6. MVP Feature Priority Matrix

Execute aggressively in sequence. Do NOT overbuild.

| Module | Feature Property | Complexity | MVP Stage Priority |
| :--- | :--- | :--- | :--- |
| **Authentication** | Email / Pass Signup + Login JWT | Low | **P0 (Must on Day 3)** |
| **Onboarding** | Multi-step setup wizard (React State) | Low | **P0 (Must on Day 5)** |
| **AI Assistant Engine**| Static RAG (SQL Matches + Gemini flash API) | Medium | **P0 (Must on Week 2)** |
| **WhatsApp Node** | Webhook webhook receiver + sender adapter | High | **P0 (Must on Week 2)** |
| **Conversations UI** | Team workspace, chat view, toggling AI | Medium | **P0 (Must on Week 2)** |
| **Knowledge Base** | Tabbed catalogs upload dashboard | Low | **P0 (Must on Week 2)** |
| **Leads UI** | Kanban pipeline visualizers, tracking status | Low | **P0 (Must on Week 2)** |
| **Appointments** | Basic calendar view, manual reservation entry | Low | **P1 (Week 3 upgrade)** |
| **Payment links** | Automated Razorpay/Stripe link alerts | Medium | **P1 (Week 3 upgrade)** |
| **Basic Analytics** | Leads count charts, message volumes | Low | **P1 (Week 3 upgrade)** |
| **Settings UI** | Team members invite list, rotate token API | Low | **P2 (Nice to have)** |
| **Integrations** | Advanced Webhook dispatcher settings node | Medium | **P2 (Nice to have)** |
| **Google/OAuth 2** | One click sign-on | Medium | **P3 (Post-launch only)** |
| **Outlook Sync** | Automatic MS graph bookings sync | High | **P3 (Post-launch only)** |

---

## 🛠️ 7. 4-Week Tactical Run Plan

```
  WEEK 1                     WEEK 2                     WEEK 3                     WEEK 4
 ┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
 │ Account & Database Setup││ WhatsApp & AI RAG Loop  ││ Payments & Bookings     ││ Deploy, Secure, Launch  │
 │ • PgSQL Tables Deploy   ││ • Webhook Configuration ││ • Gateway Integration   ││ • TLS Setup             │
 │ • FastAPI Boilerplate   ││ • Gemini Embeddings     ││ • Calendar Schedule     ││ • Pilot Testing (1-3)  │
 │ • Basic React Forms     ││ • Live Chat Oversight   ││ • Analytics Dashboard   ││ • Go-To-Market Core     │
 └─────────────────────────┘└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
```

### WEEK 1: Core Groundwork & Databases Setup
- **Core Goal:** Deploy working DB systems, launch FastAPI boilerplate, enable authentication endpoints, map local React storage.
- **Milestones:**
  - Create and test Supabase tables. Apply index maps to optimization scopes.
  - Test login token creation pipelines, password hashing parameters.
  - Sync with React local layouts onboarding setups.

### WEEK 2: WhatsApp Connection & AI Cognitive Loop
- **Core Goal:** Live RAG parsing conversations dynamically on customer phone triggers.
- **Milestones:**
  - Verify inbound Meta challenge setups success.
  - Establish backend RAG. Use Gemini model APIs to retrieve Context items, prompt-engineer standard templates, and return answers block.
  - Setup and test human agent handoff overrides inside active pipeline chat tabs.

### WEEK 3: Payments Settlements & Appointment Scheduler
- **Core Goal:** Monetization modules. Trigger checkout alerts from active chat, record appointments.
- **Milestones:**
  - Standardize Razorpay/Stripe Webhook callback receivers capturing checkout success payload to update Leads pipeline.
  - Implement basic appointments slot reservations, preventing overlap locks.
  - Present summary charts, counts, active trends inside dashboards.

### WEEK 4: Production Deployment, Security, & Customer Onboarding
- **Core Goal:** Secure systems, clear code paths, run active test parameters, lock first 3 paying contracts.
- **Milestones:**
  - Deploy FastAPI server node on Railway (scalable, clean auto-builds).
  - Force HTTPS/TLS parameters throughout API setups.
  - Sign up 3 prospective service dealerships to active test. Support active integration setup manually to guarantee satisfaction.

---

## 🔒 8. Security & Compliance Checklist
- [ ] **Data Encryption:** Force HTTPS throughout. Encrypt third-party sandbox token keys inside Database using AES-256 before persistence.
- [ ] **JWT Bearer Claims:** Restrict token lifetimes to 48 hours max. Sign utilizing robust custom SECRETS keys.
- [ ] **Password Security:** Salt and hash administrator user codes with Argon2id or bcrypt.
- [ ] **CORS Settings:** Direct client request clearance exclusively to designated frontend production URLs (e.g., `https://app.autofy.com`).
- [ ] **Webhook Verification:** Verify `X-Hub-Signature-256` signatures on Meta webhook payloads to thwart spoof actions.
- [ ] **Rate Limiting:** Protect endpoint vectors by establishing limit restrictions (e.g. max 60 calls/minute per authorization API key).

---

## 📈 9. Go-To-Market & Launch Focus (First 3 Customers)

**The CTO's Maxim:** *A working, slightly raw app that generates sales beats a perfect system shut in a local repository.*

### 🛠️ What I Should Build Today:
1. Initialize the PostgreSQL schema tables inside PgAdmin or Supabase SQL.
2. Link the login forms layout credentials to test backend API database sessions.
3. Establish step-1 WhatsApp setup verification callbacks manually.

### 📅 What I Should Build This Week:
1. Complete the core backend FastAPI router architecture.
2. Secure standard Gemini API access configurations.
3. Interface the database vectors queries so customer questions yield matching FAQ block outputs instantly.

### 🚫 What I Should Completely Ignore Until After Launch (Ignore list):
1. Multi-location accounts support structure.
2. Custom visual analytics reports file creation PDF integrations.
3. Complex team permissions routing configurations.
4. SSO Enterprise authentication models.
