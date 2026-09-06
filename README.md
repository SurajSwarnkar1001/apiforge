# 🔥 APIForge — Production-Grade API Discovery & Authorized Load-Testing Platform

<div align="center">

![APIForge Platform](https://img.shields.io/badge/APIForge-v1.0.0-6366f1?style=for-the-badge)
![Fastify](https://img.shields.io/badge/Fastify-5.2-black?style=for-the-badge&logo=fastify)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss)
![k6](https://img.shields.io/badge/k6-v0.54-7d67ff?style=for-the-badge&logo=k6)
![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)

**An intelligent, developer-centric platform to discover API endpoints, inspect contracts, verify target authorization, and execute distributed k6 load tests with real-time telemetry streaming.**

</div>

---

## 📖 Overview (APIForge Kya Hai?)

**APIForge** ek modern, production-grade web application aur distributed execution engine hai. Iska main purpose developers aur DevOps engineers ko kisi bhi authorized website ya backend server ka target URL enter karne par:

1. **Automated API Discovery**: Uss application ke publicly accessible API endpoints ko automatically detect aur extract karna (OpenAPI specs, headless browser network traffic, aur client JavaScript bundle analysis ke through).
2. **Contract & Payload Inspection (Postman-Grade Explorer)**: Discovered endpoints ko inspect karna, query parameters, headers, JSON body edit karna, aur safe single-request send karke live response check karna.
3. **Target Domain Ownership Authorization**: Denial-of-Service (DoS) abuse ko rokne ke liye target domain ka ownership verify karna (DNS TXT record, HTTP file, ya signed self-declaration).
4. **Distributed k6 Load Testing**: Ramping stages (Smoke, Load, Stress, Spike, Custom) ke sath isolated worker containers me k6 scripts execute karna.
5. **Real-time Live Telemetry & Monitoring**: Sub-second WebSocket ke through active Virtual Users (VUs), Requests Per Second (RPS), Latency Percentiles (P50, P90, P95, P99), error rates aur HTTP status distribution ko visually monitor karna, sath me instant **[STOP TEST]** cancellation support.
6. **Detailed Historical Performance Reports**: Pass/Fail threshold matrix, latency breakdown, k6 CLI stdout logs aur JSON export.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                           │
│  - Modern Dark Mode Developer Interface (Linear/Postman aesthetic)          │
│  - Tailwind CSS v4 (@tailwindcss/vite setup without PostCSS legacy)         │
│  - Interactive Endpoint Explorer + Single Request Proxy                     │
│  - Live Recharts Visualizations & Realtime WebSocket Telemetry              │
└──────────────────────┬──────────────────────────────────▲───────────────────┘
                       │ HTTP REST (Port 4000)            │ WebSocket (ws://)
                       ▼                                  │
┌─────────────────────────────────────────────────────────┴───────────────────┐
│                        BACKEND API (Node.js + Fastify)                      │
│  - Fastify v5 Server + JWT Auth + Rate Limiter + Sensible                   │
│  - SSRF Security Firewall & DNS Rebinding Mitigation                        │
│  - AES-256-GCM Secret Encryption Engine                                     │
│  - WebSocket Telemetry Broadcasting Hub                                     │
│  - BullMQ Job Queue Producers                                               │
└──────────────┬───────────────────────────┬──────────────────────────────────┘
               │ Prisma ORM                │ BullMQ / PubSub
               ▼                           ▼
┌──────────────────────────────┐ ┌────────────────────────────────────────────┐
│       MONGODB DATABASE       │ │                 REDIS 7                    │
│  - Users, Projects, Scans    │ │  - discovery-queue (Discovery Jobs)        │
│  - Endpoints, LoadTests      │ │  - loadtest-queue (k6 Benchmark Jobs)      │
│  - Results, Metrics, Audit   │ │  - Pub/Sub Channels (loadtest:metrics:*)   │
└──────────────────────────────┘ └───────┬────────────────────────────┬───────┘
                                         │                            │
                     ┌───────────────────┘                            └───────────────────┐
                     ▼                                                                    ▼
┌──────────────────────────────────────────────┐                 ┌────────────────────────────────────────────┐
│               DISCOVERY WORKER               │                 │               LOADTEST WORKER              │
│  - Strategy 1: OpenAPI / Swagger Parser      │                 │  - Dynamic k6 Script Synthesizer           │
│  - Strategy 2: Playwright Headless Crawler   │                 │  - Isolated k6 Execution Engine            │
│  - Strategy 3: JS Bundle AST/Regex Extractor │                 │  - Sub-second Metric Aggregator & Streamer │
│  - Normalization & Mutation Safety Engine    │                 │  - Redis Cancel Listener (Instant Killer)  │
└──────────────────────────────────────────────┘                 └────────────────────────────────────────────┘
```

---

## 🔍 API Discovery Engine (Detailed Strategies)

Discovery engine 3 independent strategies execute karta hai aur endpoints ko deduplicate karke confidence levels assign karta hai:

### 1. Strategy 1: OpenAPI / Swagger Specification Parser (`HIGH` Confidence)
- **Mechanism**: Common documentation endpoints ko probe karta hai:
  - `/openapi.json`
  - `/swagger.json`
  - `/api-docs`
  - `/swagger/v1/swagger.json`
  - `/v3/api-docs`
- **Extracted Data**: HTTP Method, exact path, parameter schema, request body schema, response schema, tags, aur authentication requirements (`BEARER`, `API_KEY`, etc.).
- **Confidence Rating**: `HIGH` (kyunki yeh official API contract specification se directly derive hota hai).

### 2. Strategy 2: Browser Network Interception via Playwright (`MEDIUM` Confidence)
- **Mechanism**: Target URL ko headless Chromium browser me render karta hai aur active network requests (`page.on('request')` aur `page.on('response')`) ko intercept karta hai.
- **Filtering**: Static assets (.css, .png, .jpg, .woff, .svg) aur third-party analytics (Google Analytics, Sentry, Mixpanel, Segment) ko aggressively filter karta hai.
- **Confidence Rating**: `MEDIUM` (kyunki yeh active running frontend application dwara actual XHR/Fetch API call observe hui hai).

### 3. Strategy 3: Client JavaScript Bundle AST & Regex Analysis (`LOW` Confidence)
- **Mechanism**: HTML page ke `<script src="...">` tags ko scan karke publicly accessible JavaScript bundle chunks download karta hai.
- **Pattern Matching**: AST aur regex patterns ke through candidate routes (`/api/*`, `/v1/*`, `/graphql`, `/auth/*`, `/users/*`) extract karta hai.
- **Confidence Rating**: `LOW` (kyunki yeh potential candidate path hai jo bundle string me mila hai).

### 4. Normalization, Deduplication & Mutation Safety
- **Dynamic Parameter Matching**: Dynamic IDs aur hashes ko parameterized templates me convert karta hai:
  - `/api/v1/users/58291` ➡️ `/api/v1/users/{id}`
  - `/api/v1/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890` ➡️ `/api/v1/orders/{uuid}`
  - `/api/v1/items/507f1f77bcf86cd799439011` ➡️ `/api/v1/items/{hash}`
- **Mutation Safety Protocol**: `POST`, `PUT`, `DELETE`, `PATCH` endpoints par `isMutation: true` flag lagta hai aur unhe **"Requires request configuration"** mark kiya jata hai taaki automated discovery crawl ke dauran koi bhi destructive state modification na ho.

---

## 🛡️ Target Ownership Verification & Authorization Model

APIForge internet par arbitrary DDoS attack tool nahi ban sakta. Isliye multi-tier target authorization enforce ki gayi hai:

| Verification Method | Description | Unlocked Load Testing Tier |
|---|---|---|
| **DNS TXT Record** | Domain ke DNS par `apiforge-verification=<token>` TXT record add karna. | **Enterprise Tier**: Unlimited concurrency (upto 10,000+ VUs). |
| **HTTP Well-Known File** | Server ke `/.well-known/apiforge-verification.txt` path par token host karna. | **Production Tier**: High-concurrency stress testing. |
| **Signed Self-Declaration** | Legal acknowledgement checkbox confirming ownership or written permission. | **Smoke Testing Tier**: Strict rate limit (&le; 10 Virtual Users). |

---

## 🔒 Security & SSRF Defense Architecture

Har target URL ko kisi bhi HTTP request ya Playwright crawl se pehle strict security firewall se pass hona padta hai:

1. **Protocol Restriction**: Sirf `http:` aur `https:` allowed hain (`file://`, `ftp://`, `gopher://` strictly blocked).
2. **DNS Pre-Resolution**: Hostname ke saare A aur AAAA IP records ko pehle resolve kiya jata hai.
3. **Restricted Subnet Blocklist**:
   - `127.0.0.0/8` (Loopback / Localhost)
   - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private IPv4)
   - `169.254.169.254` (AWS, GCP, Azure Cloud Metadata Endpoint)
   - `::1`, `fc00::/7`, `fe80::/10` (IPv6 Loopback & Unique Local)
4. **DNS Rebinding Protection**: Resolved IPs ko socket level par pin kiya jata hai taaki TOCTOU attack na ho sake.
5. **Secret Encryption at Rest**: Authentication tokens aur custom headers database me **AES-256-GCM** cipher se encrypt ho kar store hote hain.

---

## ⚡ k6 Distributed Load Testing Engine

Worker dynamically validated parameters se clean k6 JavaScript test script synthesize karta hai:

### Load Testing Profiles:
- **Smoke Test**: `10 VUs / 30 seconds` (Minimal baseline verification)
- **Load Test**: `100 VUs / 5 minutes` (Sustained peak volume testing)
- **Stress Test**: `250 VUs progressive ramping` (Breaking point identification)
- **Spike Test**: `300 VUs rapid surge` (Traffic burst recovery analysis)
- **Custom Scenario**: User-defined Virtual Users, Ramp-up, Steady-state aur Ramp-down sliders.

### Realtime Metrics Tracked:
- Total Requests & RPS (Throughput)
- Successful (2xx) vs Failed (4xx/5xx) Requests
- Average, Minimum, Maximum Latencies
- Percentiles: **P50 (Median)**, **P90**, **P95**, **P99 (Tail Latency)**
- Error Rate Percentage
- HTTP Status Code Breakdown

### Instant Cancellation:
User dashboard par **[STOP TEST]** button dabate hi Fastify backend Redis channel par cancellation event publish karta hai. Worker process k6 binary ko instant `SIGINT` aur `SIGKILL` bhej kar process terminate karta hai aur partial test summary report persist kar deta hai.

---

## 💻 Tech Stack Overview

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: **Tailwind CSS v4** (Modern `@tailwindcss/vite` plugin setup, zero legacy PostCSS)
- **State & Routing**: Zustand + React Router v6 + TanStack Query v5
- **Charts & UI**: Recharts + Lucide Icons + Custom Glassmorphism UI
- **Network & WS**: Axios + Custom WebSocket Client with simulation fallback

### Backend
- **Framework**: Node.js + Fastify v5 (TypeScript)
- **Database & ORM**: MongoDB 7.0 + Prisma ORM (Native BSON Documents & ObjectIds)
- **Queue & Realtime**: BullMQ + Redis 7 + WebSockets
- **Validation**: Zod + IPAddr.js
- **Security**: AES-256-GCM + BcryptJS + Fastify JWT

### Distributed Workers
- **discovery-worker**: BullMQ consumer + Playwright + OpenAPI Parser + Cheerio
- **loadtest-worker**: BullMQ consumer + k6 runner + Telemetry Streamer

---

## 📁 Repository Structure

```
load_testing/
├── docker-compose.yml              # Multi-container orchestration (6 services)
├── .env.example                    # Environment variable templates
├── package.json                    # Monorepo workspaces configuration
├── README.md                       # Complete platform documentation
├── frontend/                       # React 18 + Vite + Tailwind v4
│   ├── package.json
│   ├── vite.config.ts              # Uses @tailwindcss/vite plugin
│   ├── src/
│   │   ├── index.css               # @import "tailwindcss"; + @theme tokens
│   │   ├── App.tsx                 # 11 Core Platform Routes
│   │   ├── types/                  # Domain TypeScript interfaces
│   │   ├── lib/                    # API client, WebSocket & Mock Fallback
│   │   ├── components/             # Reusable UI, Charts, Modals, Badges
│   │   └── pages/                  # Dashboard, Projects, Scan, Endpoints, Test, Reports
│   └── Dockerfile                  # Multi-stage Nginx production container
├── backend/                        # Fastify API Server
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma           # MongoDB data models & ObjectIds
│   │   └── seed.ts                 # Database seeder
│   └── src/
│       ├── config/env.ts           # Zod validated configuration
│       ├── utils/                  # ssrf.ts, crypto.ts, url.ts, logger.ts
│       ├── plugins/                # prisma.ts, redis.ts, jwt.ts, websocket.ts
│       ├── services/               # auth, project, verification, scan, endpoint, loadtest
│       └── routes/                 # REST endpoints
├── workers/
│   ├── discovery-worker/           # Async OpenAPI, Playwright, JS bundle crawler
│   │   └── src/
│   │       ├── strategies/         # openapi.strategy, playwright.strategy, jsBundle.strategy
│   │       ├── normalizer/         # endpointNormalizer.ts
│   │       └── processor.ts        # BullMQ job handler
│   └── loadtest-worker/            # Distributed k6 execution engine
│       └── src/
│           ├── k6/                 # scriptGenerator.ts, k6Runner.ts
│           └── processor.ts        # BullMQ job handler & Redis pub/sub streamer
└── tests/                          # Vitest Unit & Security Test Suites
```

---

## 🚦 API Routes Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/projects` | List target projects | Yes |
| `POST` | `/api/projects` | Register target project (with SSRF check) | Yes |
| `GET` | `/api/projects/:id` | Get project details & endpoint summary | Yes |
| `POST` | `/api/projects/:id/verify` | Verify domain ownership (DNS/HTTP/Self) | Yes |
| `POST` | `/api/projects/:id/scan` | Trigger asynchronous discovery scan | Yes |
| `GET` | `/api/projects/:id/scan/:scanId` | Get discovery scan status & log stream | Yes |
| `GET` | `/api/projects/:id/endpoints` | List discovered endpoints for project | Yes |
| `GET` | `/api/endpoints/:id` | Get single endpoint schema & parameters | Yes |
| `POST` | `/api/endpoints/:id/execute` | Safe single-shot test execution proxy | Yes |
| `POST` | `/api/load-tests` | Create & dispatch k6 load test job | Yes |
| `GET` | `/api/load-tests` | List all load test executions | Yes |
| `GET` | `/api/load-tests/:id` | Get load test status & metadata | Yes |
| `POST` | `/api/load-tests/:id/stop` | Terminate running k6 test immediately | Yes |
| `GET` | `/api/load-tests/:id/metrics` | Get telemetry time-series metrics | Yes |
| `GET` | `/api/load-tests/:id/results` | Get final performance report | Yes |
| `GET` | `/api/audit-logs` | Retrieve immutable platform audit trail | Yes |
| `WS` | `/ws/load-tests/:id` | Realtime WebSocket telemetry stream | - |

---

## 🛠️ Step-by-Step Installation & Quick Start

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **Docker & Docker Compose** (for MongoDB, Redis, and worker containers)

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma ORM Client (MongoDB)
```bash
cd backend
npx prisma generate
cd ..
```

### 4. Start Local Infrastructure (MongoDB & Redis)
```bash
docker compose up -d mongodb redis
```

### 5. Seed Initial Data (Optional Demo Data)
```bash
cd backend
npm run prisma:seed
cd ..
```

### 6. Run All Services in Development Mode
```bash
npm run dev
```
- **Web Dashboard**: `http://localhost:5173`
- **Backend API & WebSockets**: `http://localhost:4000`

---

## 🐳 Production Deployment via Docker Compose

Pure 6-service microservice stack ko horizontally scale karne ke liye:

```bash
docker compose up --build -d
```

To scale load testing workers to 4 parallel nodes:
```bash
docker compose up --scale loadtest-worker=4 -d
```

Web interface available at: `http://localhost:3000`.

---

## 🧪 Running Automated Tests

Run the security, SSRF firewall, and normalizer unit test suite:

```bash
cd backend
npx vitest run
```

---

<div align="center">

**Built with Precision for High-Performance Engineering Teams.**

</div>
