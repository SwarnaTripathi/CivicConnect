# CivicConnect AI — Project Documentation

> **Zero-Cost AI Civic Grievance Triage & Verified Resolution Platform**
> Built with React + Three.js + Express + FastAPI + MongoDB

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Checkpoint Breakdown](#4-checkpoint-breakdown)
   - [Checkpoint 1 — Database Models & Hash Chain](#checkpoint-1--database-models--hash-chain)
   - [Checkpoint 2 — FastAPI AI Engine](#checkpoint-2--fastapi-ai-engine)
   - [Checkpoint 3 — Express Gateway & Routes](#checkpoint-3--express-gateway--routes)
   - [Checkpoint 4 — React PWA with 3D UI](#checkpoint-4--react-pwa-with-3d-ui)
   - [Checkpoint 5 — Proof-of-Fix Quorum](#checkpoint-5--proof-of-fix-quorum)
5. [3D UI Design System](#5-3d-ui-design-system)
6. [File Structure](#6-file-structure)
7. [API Reference](#7-api-reference)
8. [How to Run](#8-how-to-run)
9. [Environment Variables](#9-environment-variables)
10. [Screenshots](#10-screenshots)

---

## 1. Project Overview

CivicConnect AI is a **civic grievance management platform** where citizens can report city issues (potholes, water leaks, power outages, drainage failures) and get them resolved through an AI-powered triage pipeline.

### Core Flow

```
Citizen submits report (any language)
        ↓
LLaMA-3.1 classifies: category + priority + department
        ↓
H3 spatial index + MiniLM embeddings check for duplicates
        ↓
If NEW → creates Master Ticket + SHA-256 audit block
If DUPLICATE → links to existing ticket, increments affected count
        ↓
Ward representative views dashboard (real-time Socket.IO)
        ↓
Rep marks as resolved → proof-of-fix URL attached + audit block
        ↓
Citizens upvote resolution → Quorum of 3 votes → ticket auto-closes
```

### Key Principles
- **Zero Cost** — Groq free tier (LLaMA), OpenStreetMap (no paid maps), MongoDB Atlas M0 free, Cloudinary unsigned preset
- **Tamper-Proof** — Every state change is linked to a SHA-256 hash chain
- **Multilingual** — AI accepts Hindi, regional languages and translates to English
- **Privacy** — Map coordinates are jittered ±150m before display

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER (Port 5173)               │
│  React + Vite PWA                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌───────────┐  │
│  │  Home    │ │  Submit  │ │  Map │ │ Dashboard │  │
│  │ 3D Globe │ │ AI Live  │ │Leafl.│ │ KPI Cards │  │
│  │ Hero     │ │ Preview  │ │ Jitt │ │ Live Feed │  │
│  └──────────┘ └──────────┘ └──────┘ └───────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP / WebSocket (Socket.IO)
┌──────────────────▼──────────────────────────────────┐
│         EXPRESS GATEWAY (Port 5000)                  │
│  ┌─────────────┐ ┌───────────┐ ┌──────────────────┐ │
│  │ /api/tickets│ │ /api/auth │ │  /api/quorum     │ │
│  │ POST  GET   │ │ POST login│ │  POST /:id/vote  │ │
│  │ PATCH resolve│ │  JWT sign │ │  auto-resolve @3 │ │
│  └──────┬──────┘ └───────────┘ └──────────────────┘ │
│         │ Mongoose                    MongoDB Atlas   │
│  ┌──────▼──────────────────────────────────────┐    │
│  │  Ticket Model │ AuditLedger │ hashChain.js   │    │
│  └──────┬────────────────────────────────────-─┘    │
└─────────┼───────────────────────────────────────────┘
          │ Axios HTTP
┌─────────▼───────────────────────────────────────────┐
│         FASTAPI AI ENGINE (Port 8000)                │
│  ┌──────────────────────┐  ┌───────────────────────┐│
│  │  /api/v1/triage      │  │ /api/v1/deduplicate   ││
│  │  Groq LLaMA-3.1-8b   │  │ H3 spatial filter     ││
│  │  → category          │  │ + MiniLM cosine sim   ││
│  │  → priority          │  │ threshold 0.82        ││
│  │  → department        │  │ → is_duplicate?       ││
│  └──────────────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + Vite 5 | SPA with fast HMR |
| **3D Graphics** | @react-three/fiber v8 + Three.js | City globe, orbital rings, star field |
| **Animation** | Framer Motion | Spring physics, page transitions, live feed |
| **Routing** | React Router v6 | SPA page routing |
| **Mapping** | Leaflet + react-leaflet | OSM tiles, jittered circle markers |
| **Real-time** | Socket.IO client | Live ticket feed in dashboard |
| **HTTP Client** | Axios | API calls with JWT interceptors |
| **Styling** | Tailwind CSS v3 + Vanilla CSS | Design tokens + 3D utilities |
| **Backend Framework** | Express.js | REST API gateway |
| **WebSockets** | Socket.IO server | Real-time broadcasts |
| **Database** | MongoDB Atlas + Mongoose | Document storage with 2dsphere index |
| **Auth** | JSON Web Tokens (jsonwebtoken) | Rep authentication |
| **AI Inference** | Groq Cloud (LLaMA-3.1-8b-instant) | Free-tier LLM triage |
| **Embeddings** | sentence-transformers MiniLM-L12-v2 | Semantic deduplication |
| **Spatial Index** | Uber H3 (resolution 9) | Geographic hex cell deduplication |
| **AI Framework** | FastAPI + Pydantic | Python AI microservice |
| **Audit** | SHA-256 hash chain | Tamper-proof ledger |

---

## 4. Checkpoint Breakdown

---

### Checkpoint 1 — Database Models & Hash Chain

**Files:**
- [`backend/models/Ticket.js`](backend/models/Ticket.js)
- [`backend/models/AuditLedger.js`](backend/models/AuditLedger.js)
- [`backend/utils/hashChain.js`](backend/utils/hashChain.js)

#### `Ticket.js` — Mongoose Schema

The Ticket model is the core document with full lifecycle support:

```
Fields:
  title              — first 80 chars of description (auto-generated)
  description        — full citizen report text
  rawDescription     — original multilingual text before AI translation
  category           — Roads | Drainage | Sanitation | Water Supply | Electricity | Other
  priority           — Low | Medium | High | Critical  (set by AI)
  status             — Submitted → Triaged → Assigned → In_Progress → Pending_Verification → Resolved
  location           — GeoJSON Point {type, coordinates:[lng,lat]}  (2dsphere indexed)
  h3Index            — Uber H3 cell index at resolution 9
  textEmbedding      — MiniLM vector (hidden from default queries via select:false)
  wardId             — derived from coords or manually set
  department         — suggested by AI triage
  isMaster           — true = original; false = duplicate linked to master
  masterTicketId     — ref to master Ticket if duplicate
  affectedCitizensCount — incremented when duplicates are detected
  photos.before/after — Cloudinary URLs
  proofOfFixUrl      — resolution evidence URL (Checkpoint 5)
  quorumVotes        — array of voter IPs (Checkpoint 5)
  resolvedAt         — timestamp when quorum reached
```

#### `AuditLedger.js` — SHA-256 Hash Chain

Every action on a ticket creates an immutable `AuditLedger` document:

```
Fields:
  ticketId       — ref to Ticket
  blockIndex     — sequential block number (0 = genesis)
  timestamp      — ISO 8601
  action         — TICKET_CREATED | RESOLVED | QUORUM_RESOLVED
  actorId        — 'system' | rep username | 'quorum'
  payload        — arbitrary JSON metadata
  previousHash   — SHA-256 of previous block (genesis uses 64 zeros)
  hash           — SHA-256 of all fields combined
```

#### `hashChain.js` — Utility Class

`HashChainUtil.appendBlock(ticketId, action, actorId, payload)` is a static async method that:
1. Queries the last block for the ticket
2. Calculates `blockIndex = lastBlock.blockIndex + 1`
3. Hashes all fields with `crypto.createHash('sha256')`
4. Saves the new `AuditLedger` document

---

### Checkpoint 2 — FastAPI AI Engine

**File:** [`ai-service/main.py`](ai-service/main.py)

The AI microservice exposes two endpoints:

#### `POST /api/v1/triage`

Accepts `{ raw_text: string }` — the citizen's grievance in any language.

**Process:**
1. Sends prompt to Groq's **LLaMA-3.1-8b-instant** with `response_format: json_object`
2. Prompt instructs the model to return: `{ category, priority, english_translation, suggested_department }`
3. Falls back to `{ category: "Roads", priority: "High" }` if the API fails

**Example Response:**
```json
{
  "category": "Roads",
  "priority": "High",
  "english_translation": "Large pothole on MG Road causing accidents",
  "suggested_department": "Municipal Corporation"
}
```

#### `POST /api/v1/deduplicate`

Accepts the new ticket's coordinates, description, and a list of candidate existing tickets.

**Process:**
1. Converts `{lat, lng}` to an **H3 hex cell** at resolution 9 (~75m radius)
2. Filters candidates to only those within H3 distance ≤ 1 (adjacent cells)
3. Encodes the description with **paraphrase-multilingual-MiniLM-L12-v2**
4. Computes **cosine similarity** against each candidate's stored embedding
5. If similarity ≥ 0.82 → marks as duplicate, returns `master_ticket_id`

---

### Checkpoint 3 — Express Gateway & Routes

**Files:**
- [`backend/server.js`](backend/server.js) — main entry
- [`backend/routes/tickets.js`](backend/routes/tickets.js)
- [`backend/routes/auth.js`](backend/routes/auth.js)
- [`backend/middleware/auth.js`](backend/middleware/auth.js)

#### `server.js` — Gateway

```javascript
// Key setup:
mongoose.connect(MONGO_URI)           // Atlas M0 or local
app.set('io', io)                     // io accessible in routes
app.use('/api/tickets', ticketRoutes)
app.use('/api/auth',    authRoutes)
app.use('/api/quorum',  quorumRoutes)
io.on('connection', socket => { ... }) // log connections
```

#### `routes/tickets.js` — Full Ingestion Pipeline

`POST /api/tickets` — The most complex endpoint:

```
1. Validate: description, latitude, longitude required
2. Call AI service → /api/v1/triage → get category, priority, department
3. Fetch up to 200 open master tickets with h3Index + textEmbedding
4. Call AI service → /api/v1/deduplicate
5a. If DUPLICATE:
    → Increment affectedCitizensCount on master ticket
    → Return 200 with { isDuplicate: true, masterTicketId, similarityScore }
5b. If NEW:
    → Auto-derive wardId from coordinates
    → Save Ticket document (status = "Triaged")
    → HashChainUtil.appendBlock(id, 'TICKET_CREATED', 'system', {...})
    → io.emit('ticket:new', ticket)  ← broadcasts to all dashboard users
    → Return 201 with the new ticket
```

`GET /api/tickets` — Supports query params: `category`, `status`, `priority`, `ward`, `limit`, `skip`. Excludes `textEmbedding` from response.

`PATCH /api/tickets/:id/resolve` — JWT-protected (representative only):
- Sets status to `Pending_Verification`
- Stores `proofOfFixUrl` in `photos.after`
- Appends `RESOLVED` audit block with rep username
- Broadcasts `ticket:updated` via Socket.IO

#### `routes/auth.js` — JWT Authentication

`POST /api/auth/login` — Validates credentials against demo reps array, issues an 8-hour JWT containing `{ id, username, ward, name }`.

Demo credentials: **`admin` / `admin123`**

#### `middleware/auth.js` — JWT Guard

Extracts `Bearer <token>` from `Authorization` header, verifies with `JWT_SECRET`, attaches `req.user` for downstream handlers.

---

### Checkpoint 4 — React PWA with 3D UI

**Files:** All under `frontend/src/`

#### App Router (`App.jsx`)

React Router v6 with 5 routes:

| Route | Component |
|---|---|
| `/` | `Home` |
| `/submit` | `SubmitTicket` |
| `/map` | `MapView` |
| `/dashboard` | `Dashboard` |
| `/login` | `Login` |

All routes are wrapped in a sticky `<Navbar />`.

#### Hooks

**`useTickets(params, pollInterval)`**
- Fetches tickets via `GET /api/tickets`
- Auto-polls every N milliseconds (default 30s)
- Computes derived stats: `{ total, open, resolved, critical }`

**`useSocket(onTicketNew)`**
- Creates a singleton Socket.IO connection
- Calls `onTicketNew(ticket)` whenever the server emits `ticket:new`
- Stable callback via `useRef` to avoid stale closures

#### `lib/api.js` — Axios Instance

- Base URL from `VITE_API_BASE_URL` env var (defaults to `/api`)
- **Request interceptor**: attaches `Authorization: Bearer <token>` from `localStorage`
- **Response interceptor**: clears token and redirects to `/login` on 401

---

### Checkpoint 5 — Proof-of-Fix Quorum

**File:** [`backend/routes/quorum.js`](backend/routes/quorum.js)

#### `POST /api/quorum/:ticketId/vote`

Citizens vote to confirm a fix is real.

**Logic:**
1. Checks ticket is in `Pending_Verification` status
2. Uses voter IP as a simple deduplication key (prevents double-voting)
3. Pushes IP to `ticket.quorumVotes[]`
4. If `quorumVotes.length >= 3`:
   - Sets `status = "Resolved"`, records `resolvedAt`
   - Appends `QUORUM_RESOLVED` audit block
   - Broadcasts `ticket:resolved` via Socket.IO
5. Returns `{ votes, threshold: 3, resolved, status }`

---

## 5. 3D UI Design System

### Design Philosophy

The UI uses **glassmorphism + 3D depth** to feel like a command centre for city operations.

### Color Palette

| Name | Hex | Usage |
|---|---|---|
| Navy 900 | `#0a0e1a` | Page background |
| Navy 800 | `#0f1629` | Card/panel background |
| Indigo | `#4f46e5` | Primary actions, globe wireframe |
| Indigo Light | `#818cf8` | Text accents, nav active |
| Cyan | `#06b6d4` | Secondary actions, orbital rings |
| Amber | `#f59e0b` | CTA banner, High priority |
| Emerald | `#10b981` | Resolved status, live dot |
| Rose | `#f43f5e` | Critical priority, errors |

### Glass Card Utility (`.glass-card`)

```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.10);
backdrop-filter: blur(20px);
border-radius: 16px;
/* hover → indigo border glow + lift shadow */
```

### 3D Card Tilt (TicketCard)

On `mousemove`, calculates relative position within the card bounds and applies:
```javascript
transform: `perspective(700px) rotateX(${y}deg) rotateY(${x}deg)`
```
Maximum tilt: ±7°. Resets to 0 on `mouseleave` with CSS transition.

### 3D Globe Scene (Scene3D.jsx)

Built with `@react-three/fiber` Canvas:

| Object | Description |
|---|---|
| `CityGlobe` | `IcosahedronGeometry(2.2, 3)` wireframe, rotates on Y + X axes |
| `GlowSphere` | `SphereGeometry(1.8)` wireframe at 8% opacity, counter-rotates + breathes |
| `StarField` | 2000 `Points` in a 40-unit cube, slowly drifts |
| `OrbitRing` | 3× `TorusGeometry` at radii 3.2 / 3.8 / 4.5 with different tilt angles and speeds |

All objects use `useFrame()` for per-frame animation updates.

### Typography

- **Outfit** (Google Fonts) — all UI text, weights 300–900
- **JetBrains Mono** — ticket IDs, hash values, AI triage output, code

---

## 6. File Structure

```
CivicConnect-Antigravity/
├── .env.example                    # Environment variable template
├── PROJECT_SPEC.md                 # Original project specification
├── WORKS_DONE.md                   # This file
│
├── ai-service/                     # Python FastAPI AI Engine
│   ├── main.py                     # Triage + Deduplication endpoints
│   └── requirements.txt            # groq, sentence-transformers, h3, fastapi
│
├── backend/                        # Node.js Express Gateway
│   ├── server.js                   # Entry: Mongoose + Socket.IO + routes
│   ├── package.json                # express, mongoose, jsonwebtoken, axios...
│   ├── middleware/
│   │   └── auth.js                 # JWT Bearer verification
│   ├── models/
│   │   ├── Ticket.js               # Core Mongoose schema (quorum fields added)
│   │   └── AuditLedger.js          # SHA-256 hash chain document
│   ├── routes/
│   │   ├── tickets.js              # POST/GET/PATCH ticket endpoints
│   │   ├── auth.js                 # POST /login → JWT
│   │   └── quorum.js               # POST /:id/vote → quorum resolution
│   └── utils/
│       └── hashChain.js            # HashChainUtil static class
│
└── frontend/                       # React + Vite PWA
    ├── index.html                  # Root HTML, Outfit + JetBrains Mono fonts
    ├── package.json                # react, three, framer-motion, leaflet...
    ├── vite.config.js              # Vite + proxy to backend :5000
    ├── tailwind.config.js          # Civic color palette + animation tokens
    ├── postcss.config.js           # Tailwind + autoprefixer
    └── src/
        ├── main.jsx                # ReactDOM.createRoot entry
        ├── App.jsx                 # BrowserRouter + all routes
        ├── index.css               # Full design system (glass, neon, leaflet)
        ├── lib/
        │   └── api.js              # Axios instance + JWT interceptors + endpoints
        ├── hooks/
        │   ├── useTickets.js       # Polling hook with computed stats
        │   └── useSocket.js        # Singleton Socket.IO hook
        ├── components/
        │   ├── Scene3D.jsx         # Three.js: globe, stars, orbital rings
        │   ├── Navbar.jsx          # Sticky glassmorphic nav + mobile menu
        │   └── TicketCard.jsx      # 3D tilt card with priority/status badges
        └── pages/
            ├── Home.jsx            # Hero + features grid + stats ribbon
            ├── SubmitTicket.jsx    # Report form + live AI triage preview
            ├── MapView.jsx         # Leaflet map + jitter + slide-in panel
            ├── Dashboard.jsx       # KPI cards + ticket list + live feed
            └── Login.jsx           # Rep JWT authentication
```

---

## 7. API Reference

### Tickets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/tickets` | None | Submit new grievance |
| `GET` | `/api/tickets` | None | List/filter tickets |
| `GET` | `/api/tickets/:id` | None | Single ticket detail |
| `PATCH` | `/api/tickets/:id/resolve` | JWT | Mark as resolved |

#### POST /api/tickets — Request Body
```json
{
  "description": "Large pothole on MG Road causing accidents",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "category": "Roads",
  "wardId": "Ward-42"
}
```

#### GET /api/tickets — Query Params
```
?category=Roads&status=Triaged&priority=High&ward=Ward-42&limit=50&skip=0
```

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, receive JWT |

```json
// Request
{ "username": "admin", "password": "admin123" }

// Response
{ "token": "eyJ...", "name": "Admin Rep", "ward": "All" }
```

### Quorum

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quorum/:ticketId/vote` | Vote to verify fix |

```json
// Response
{ "votes": 2, "threshold": 3, "resolved": false, "status": "Pending_Verification" }
```

### AI Service (Direct)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/triage` | Classify grievance |
| `POST` | `/api/v1/deduplicate` | Check for duplicate |
| `GET` | `/health` | Service status |

### Socket.IO Events

| Event | Direction | Payload |
|---|---|---|
| `ticket:new` | Server → Client | Full Ticket document |
| `ticket:updated` | Server → Client | Updated Ticket |
| `ticket:resolved` | Server → Client | Resolved Ticket |

---

## 8. How to Run

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10 + pip
- MongoDB (local or Atlas URI)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Step 1 — Environment Setup
```bash
# In project root
cp .env.example .env
# Edit .env with your MONGO_URI and GROQ_API_KEY
```

### Step 2 — Backend
```bash
cd backend
npm install
node server.js
# ✅  MongoDB connected
# 🚀  Gateway running on port 5000
```

### Step 3 — AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# INFO: Uvicorn running on http://0.0.0.0:8000
```

### Step 4 — Frontend
```bash
cd frontend
npm install
npm run dev
# ➜  Local: http://localhost:5173/
```

### Quick Health Checks
```bash
# Backend
curl http://localhost:5000/health

# AI Service
curl http://localhost:8000/health

# Submit a test ticket
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"description":"Broken streetlight near bus stop","latitude":12.9716,"longitude":77.5946}'
```

---

## 9. Environment Variables

| Variable | Example | Required | Description |
|---|---|---|---|
| `PORT` | `5000` | No | Backend port |
| `MONGO_URI` | `mongodb+srv://...` | Yes | MongoDB connection string |
| `JWT_SECRET` | `supersecret_...` | Yes | JWT signing secret |
| `AI_SERVICE_URL` | `http://localhost:8000` | No | FastAPI AI engine URL |
| `FRONTEND_URL` | `http://localhost:5173` | No | CORS origin |
| `GROQ_API_KEY` | `gsk_...` | Yes | Groq Cloud API key |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | No | Frontend → Backend URL |
| `VITE_SOCKET_URL` | `http://localhost:5000` | No | Socket.IO server URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | `your_cloud` | No | Photo upload cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `civic_unsigned` | No | Cloudinary preset |

> **Note:** Without `GROQ_API_KEY`, the AI triage falls back to `{ category: "Roads", priority: "High" }`. The platform remains fully functional for testing purposes.

---

*Built with the zero-cost architecture mandate — no paid cloud services, no proprietary map APIs.*

---

## 10. Screenshots

<div align="center">
  <img src="docs/images/landing.png" alt="Landing Page" width="800"/>
  <br><i>Landing Page</i><br><br>

  <img src="docs/images/report-issue.png" alt="Report an Issue" width="800"/>
  <br><i>Report an Issue Form</i><br><br>

  <img src="docs/images/map.png" alt="Live Civic Map" width="800"/>
  <br><i>Live Civic Map</i><br><br>

  <img src="docs/images/login.png" alt="Representative Login" width="800"/>
  <br><i>Representative Login</i><br><br>
</div>
