# 🔥 APIForge — Enterprise API Discovery & Distributed Load-Testing Platform

<div align="center">

![APIForge Platform](https://img.shields.io/badge/APIForge-v1.0.0-6366f1?style=for-the-badge&logo=shield)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=for-the-badge&logo=typescript)
![Fastify](https://img.shields.io/badge/Fastify-5.2-black?style=for-the-badge&logo=fastify)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss)
![k6](https://img.shields.io/badge/k6-v0.54-7d67ff?style=for-the-badge&logo=k6)
![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An enterprise-grade platform designed for automated API endpoint discovery, contract inspection, verified domain authorization, and distributed k6 load testing with sub-second WebSocket telemetry streaming.**

[Overview](#-executive-overview) • [Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Discovery Engine](#-multi-strategy-api-discovery) • [Target Authorization](#-target-authorization--governance) • [Security & SSRF](#-security--ssrf-firewall) • [Getting Started](#-getting-started-local-development) • [Docker Deployment](#-production-deployment-with-docker-compose) • [API Reference](#-rest-api--websocket-reference)

</div>

---

## 📖 Executive Overview

**APIForge** is an end-to-end API reconnaissance and distributed load-testing solution engineered for modern site reliability engineers (SREs), QA teams, and backend developers. Modern applications frequently suffer from documentation drift, hidden uncataloged microservice routes, and opaque performance bottlenecks under peak traffic. 

APIForge solves these challenges through an integrated, automated workflow:
1. **Automated Discovery**: Input any target base URL to autonomously detect public API endpoints via OpenAPI documentation parsing, headless browser network sniffing, and JavaScript bundle AST extraction.
2. **Contract Inspection & Safe Proxying**: Explore discovered routes in a Postman-grade interface, configure query parameters and headers, and execute safe single-shot requests protected by an advanced SSRF firewall.
3. **Target Ownership Verification**: Prevent unauthorized denial-of-service abuse by requiring verifiable domain ownership (DNS TXT record, HTTP well-known token, or legal declaration) prior to high-volume stress testing.
4. **Distributed k6 Benchmark Execution**: Synthesize custom or preset load scenarios into executable k6 scripts, queue them across distributed workers via BullMQ, and stream sub-second telemetry (VUs, RPS, P50/P90/P95/P99 latency, error rates) over WebSockets.
5. **Instant Cancellation & Performance Analytics**: Immediately terminate running tests on demand via Redis Pub/Sub signals and generate persistent, shareable performance reports.

---

## 🌟 Key Features

### 🔍 1. Multi-Strategy API Discovery Engine
- **OpenAPI / Swagger Ingestion (`HIGH` Confidence)**: Automatically discovers and parses standard schema definitions (`/openapi.json`, `/swagger.json`, `/api-docs`, `/v3/api-docs`), indexing route parameters, request schemas, and authentication models.
- **Headless Browser Network Crawling (`MEDIUM` Confidence)**: Utilizes Playwright Chromium to load target pages, trigger client-side interactions, and intercept active XHR/Fetch network requests while automatically filtering out tracking scripts and static media assets.
- **JavaScript Bundle AST & Regex Parsing (`LOW` Confidence)**: Scans public script tags and webpack/vite chunks to identify latent API path declarations (`/api/*`, `/v1/*`, `/graphql`).
- **Path Normalization & Parameterization**: Converts dynamic route instances into parameterized path templates (e.g., `/api/users/89201` $\rightarrow$ `/api/users/{id}`).
- **Mutation Safety Gate**: Flags state-mutating verbs (`POST`, `PUT`, `DELETE`, `PATCH`) to prevent automated destructive execution during discovery runs.

### 🧭 2. Interactive Endpoint Explorer
- Inspect parameters, authentication headers, query strings, and request payload schemas.
- Execute single-shot validation requests directly from the UI through an SSRF-protected proxy.
- View live response statuses, latency measurements, header dumps, and formatted JSON response bodies.

### 🛡️ 3. Strict Domain Verification & Ownership Governance
- Ensures ethical usage and protects arbitrary third-party services from unauthorized volumetric traffic.
- Tiered authorization:
  - **DNS TXT Record**: Enterprise-grade high-volume testing ($\ge$ 10,000+ VUs).
  - **HTTP Well-Known File**: Production stress benchmarking.
  - **Signed Declaration**: Constrained smoke test scenarios ($\le$ 10 VUs).

### ⚡ 4. Distributed k6 Load Testing Engine
- Dynamically generates battle-tested k6 JavaScript scripts based on test configuration and authorization limits.
- Built-in industry standard testing profiles:
  - **Smoke Testing**: 10 VUs / 30s duration (Sanity baseline)
  - **Load Testing**: 100 VUs / 5m duration (Sustained peak traffic)
  - **Stress Testing**: Progressive ramping up to 250 VUs (Breaking point discovery)
  - **Spike Testing**: Rapid surge to 300 VUs (Burst traffic elasticity)
  - **Custom Stages**: Customizable multi-stage ramping profiles with custom duration and concurrency steps.
- Automatic pass/fail threshold validation (e.g., `http_req_duration: ['p(95)<500', 'p(99)<1000']`, `http_req_failed: ['rate<0.01']`).

### 📊 5. Real-Time Telemetry & Monitoring
- Sub-second streaming over WebSockets providing live metric updates.
- Real-time visualizations powered by Recharts:
  - Virtual Users (VUs) active curve
  - Throughput (Requests Per Second)
  - Latency Percentile breakdown (**P50**, **P90**, **P95**, **P99**)
  - Error rate tracking & HTTP status code distribution (2xx, 3xx, 4xx, 5xx)
- **Instant Abort Control**: Worker processes immediately terminate child k6 instances upon receiving a cancellation signal via Redis Pub/Sub.

### 🔒 6. Enterprise-Grade Security
- **SSRF & DNS Rebinding Protection**: Blocks loopback addresses (`127.0.0.1`), RFC 1918 private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), cloud metadata endpoints (`169.254.169.254`), and IPv6 private spaces.
- **AES-256-GCM Encryption**: Securely encrypts sensitive authentication credentials, API keys, and custom headers stored in the database.
- **Immutable Audit Logging**: Records every scan, single-shot request, domain verification, and load test event for governance.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND CLIENT (React 18 + Vite)                     │
│  - Tailwind CSS v4 Engine (@tailwindcss/vite)                               │
│  - Real-Time Telemetry Graphs (Recharts) & Live VU/RPS Monitors             │
│  - Interactive Endpoint Explorer & Single-Shot Request Sandbox              │
└──────────────────────┬──────────────────────────────────▲───────────────────┘
                       │ HTTP REST (Port 4000)            │ WebSocket (ws://)
                       ▼                                  │
┌─────────────────────────────────────────────────────────┴───────────────────┐
│                      BACKEND API GATEWAY (Fastify v5)                       │
│  - Fastify v5 Server + JWT Authentication + Rate Limiter                    │
│  - SSRF Security Firewall & DNS Rebinding Mitigator                         │
│  - AES-256-GCM Credential Encryption & Key Management                       │
│  - WebSocket Telemetry Hub & Broadcast Dispatcher                           │
│  - BullMQ Job Dispatchers                                                   │
└──────────────┬───────────────────────────┬──────────────────────────────────┘
               │ Prisma ORM                │ BullMQ / Redis PubSub
               ▼                           ▼
┌──────────────────────────────┐ ┌────────────────────────────────────────────┐
│       MONGODB DATABASE       │ │                 REDIS 7                    │
│  - Users & Workspaces        │ │  - discovery-queue (Scraping Jobs)         │
│  - Projects & Target Domains │ │  - loadtest-queue (k6 Execution Jobs)      │
│  - Discovered Endpoints      │ │  - Pub/Sub: `loadtest:metrics:<id>`        │
│  - Load Tests, Metrics, Logs │ │  - Pub/Sub: `loadtest:cancel:<id>`         │
└──────────────────────────────┘ └───────┬────────────────────────────┬───────┘
                                         │                            │
                     ┌───────────────────┘                            └───────────────────┐
                     ▼                                                                    ▼
┌──────────────────────────────────────────────┐                 ┌────────────────────────────────────────────┐
│               DISCOVERY WORKER               │                 │               LOADTEST WORKER              │
│  - OpenAPI / Swagger v2 & v3 Parser          │                 │  - Dynamic k6 Script Synthesizer           │
│  - Playwright Headless Chromium Crawler      │                 │  - Isolated k6 Child Process Engine        │
│  - JavaScript Bundle AST/Regex Scanner       │                 │  - Sub-Second Aggregator & WebSocket Relay │
│  - Route Normalization & Parameterizer       │                 │  - Redis Cancellation Signal Listener      │
└──────────────────────────────────────────────┘                 └────────────────────────────────────────────┘
```

---

## 🔍 Multi-Strategy API Discovery

APIForge employs a layered discovery mechanism designed to uncover APIs across varying levels of documentation maturity:

| Discovery Strategy | Target Vectors | Confidence Tier | Ingestion Details |
|---|---|:---:|---|
| **OpenAPI / Swagger Ingestion** | `/openapi.json`, `/swagger.json`, `/api-docs`, `/v3/api-docs` | `HIGH` | Extracts typed path parameters, query parameters, request bodies, and auth headers directly from the official spec. |
| **Playwright Network Sniffing** | Live single-page application routes | `MEDIUM` | Spawns a headless browser, navigates target web pages, and captures live Fetch/XHR HTTP requests while discarding static assets (.js, .css, images, fonts). |
| **Client Bundle AST / Regex** | Public `.js` chunks & `<script>` tags | `LOW` | Scans client-side bundles for URI path literal patterns (`/api/v1/*`, `/graphql`, etc.) to locate latent backend routes. |

### Route Normalization & Mutation Safety
- **Parameter Tokenization**: Dynamic URL paths are automatically normalized into clean route templates:
  - `/api/v1/orders/78921` $\rightarrow$ `/api/v1/orders/{id}`
  - `/api/v1/users/4f2b6e10-91a3-4b93-8f0a-1a2b3c4d5e6f` $\rightarrow$ `/api/v1/users/{uuid}`
  - `/api/v1/products/64b0f812a1c4e91234567890` $\rightarrow$ `/api/v1/products/{hash}`
- **Mutation Safety Gate**: Unsafe HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`) are categorized with `isMutation: true` and locked until an engineer configures sample payloads and explicit execution consent.

---

## 🛡️ Target Authorization & Governance

To ensure ethical and legal operation, APIForge enforces domain verification prior to initiating high-concurrency benchmarks:

```
                      ┌────────────────────────────┐
                      │   Register Target Domain   │
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │  Select Verification Method│
                      └──────┬───────┬───────┬─────┘
                             │       │       │
       ┌─────────────────────┘       │       └─────────────────────┐
       ▼                             ▼                             ▼
┌──────────────┐             ┌───────────────┐             ┌───────────────┐
│ DNS TXT Rec  │             │ HTTP Well-Known│             │ Self-Signed   │
│ `apiforge-*` │             │ File on Host  │             │ Legal Consent │
└──────┬───────┘             └───────┬───────┘             └───────┬───────┘
       │                             │                             │
       ▼                             ▼                             ▼
┌──────────────┐             ┌───────────────┐             ┌───────────────┐
│  Enterprise  │             │  Production   │             │  Smoke Only   │
│ Concurrency  │             │ Concurrency   │             │ (<= 10 VUs)   │
└──────────────┘             └───────────────┘             └───────────────┘
```

1. **DNS TXT Record Verification**: Create a TXT record for `_apiforge-challenge.yourdomain.com` containing the unique project token. Unlocks unlimited concurrency and stress profiles.
2. **HTTP Well-Known File**: Place the verification challenge at `https://yourdomain.com/.well-known/apiforge-verification.txt`. Enables high-concurrency load and spike testing.
3. **Signed Self-Declaration**: Instant verification for rapid testing in staging environments, capped at a maximum of 10 Virtual Users.

---

## 🔒 Security & SSRF Firewall

APIForge integrates multi-layer defense-in-depth security to prevent internal network scanning and cloud infrastructure pivoting:

```
Target URL Input ──► [ URL Protocol Check (http/https only) ]
                           │
                           ▼
                     [ DNS Pre-Resolution (Resolve A/AAAA) ]
                           │
                           ▼
                     [ SSRF Subnet Filter ]
                           ├── 127.0.0.0/8 (Loopback) ──────────────► [ BLOCKED ]
                           ├── 10.0.0.0/8 (Private Network) ────────► [ BLOCKED ]
                           ├── 172.16.0.0/12 (Private Network) ─────► [ BLOCKED ]
                           ├── 192.168.0.0/16 (Private Network) ────► [ BLOCKED ]
                           ├── 169.254.169.254 (Cloud Metadata) ────► [ BLOCKED ]
                           └── ::1, fc00::/7 (IPv6 Private) ────────► [ BLOCKED ]
                           │
                           ▼
                     [ DNS Rebinding Pinned Request Execution ]
```

- **Address Blocklist**: Comprehensive filtering of RFC 1918 subnets, loopbacks, broadcast addresses, and cloud provider metadata IPs (`169.254.169.254`).
- **DNS Rebinding Mitigation**: IP addresses resolved during the validation phase are pinned throughout the request lifecycle to prevent Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding exploits.
- **AES-256-GCM Encryption**: Project secrets, custom headers, and bearer tokens are encrypted at rest using Galois/Counter Mode authenticated encryption before persisting to MongoDB.

---

## ⚡ Distributed k6 Load Testing

APIForge synthesizes configurations into native k6 execution scripts and streams execution metrics in real-time.

### Load Test Presets

| Preset | Target Virtual Users (VUs) | Duration | Primary Use Case |
|---|---|---|---|
| **Smoke Test** | 10 VUs | 30 seconds | Validates endpoint availability and sanity under low traffic. |
| **Load Test** | 100 VUs | 5 minutes | Measures system response times and throughput under normal operating volume. |
| **Stress Test** | Up to 250 VUs | 10 minutes | Identifies the breaking point and degradation threshold of target infrastructure. |
| **Spike Test** | Surge to 300 VUs | 2 minutes | Evaluates autoscaling response and recovery during sudden traffic surges. |
| **Custom Stage** | User-defined | Configurable | Allows custom multi-step ramp-up, steady-state, and ramp-down scenarios. |

### Real-Time Metric Telemetry
During execution, the load-testing worker aggregates and broadcasts the following metrics every 1,000ms:
- **Active Virtual Users (VUs)**: Instantaneous concurrent execution count.
- **Throughput**: Requests per second (RPS) alongside total request counters.
- **Latency Percentiles**: **P50 (Median)**, **P90**, **P95**, and **P99 (Tail Latency)**.
- **Error Rates**: Ratio of failed requests (`4xx`/`5xx`) to total requests.
- **HTTP Status Distribution**: Real-time breakdown of response status codes.

---

## 💻 Technology Stack

### Frontend Application
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS v4 using the native `@tailwindcss/vite` plugin (Zero PostCSS overhead)
- **Data & State Management**: Zustand, TanStack Query v5, React Router v6
- **Visualizations**: Recharts for real-time latency/throughput monitoring
- **Icons & UI**: Lucide React with modern glassmorphism design tokens

### Backend API Server
- **Runtime**: Node.js (v20+) with TypeScript
- **Web Framework**: Fastify v5 (High performance, JSON schema validation, plugins)
- **Database & ORM**: MongoDB 7.0 via Prisma ORM (BSON native ObjectIds)
- **Queue & Event Bus**: BullMQ and Redis 7 for distributed job scheduling
- **Real-Time Communication**: Fastify WebSocket plugin
- **Security & Cryptography**: Zod, IPAddr.js, AES-256-GCM, BcryptJS, Fastify JWT

### Distributed Workers
- **Discovery Worker**: BullMQ Consumer, Playwright Chromium, OpenAPI/Swagger Parser, Cheerio
- **Load Test Worker**: BullMQ Consumer, k6 CLI Engine, Sub-second Metrics Aggregator, Redis Cancel Pub/Sub

---

## 📁 Repository Structure

```
load_testing/
├── docker-compose.yml              # Multi-service container orchestration
├── .env.example                    # Global environment configuration template
├── package.json                    # Monorepo workspace configuration
├── README.md                       # Comprehensive platform documentation
│
├── frontend/                       # React 18 + Vite + Tailwind CSS v4
│   ├── vite.config.ts              # Bundler configuration with @tailwindcss/vite
│   ├── src/
│   │   ├── index.css               # Tailwind CSS v4 @import and @theme definitions
│   │   ├── App.tsx                 # 11 Core Platform routes
│   │   ├── types/                  # Domain TypeScript interfaces
│   │   ├── lib/                    # API client, WebSocket dispatcher, and Mock fallbacks
│   │   ├── components/             # Reusable UI widgets, charts, modals, and status badges
│   │   └── pages/                  # Dashboard, Projects, Discovery, Endpoints, Testing, Reports
│   └── Dockerfile                  # Multi-stage production Nginx container
│
├── backend/                        # Fastify v5 API Gateway
│   ├── prisma/
│   │   ├── schema.prisma           # MongoDB data models & BSON ObjectId mapping
│   │   └── seed.ts                 # Database seeder with realistic demo datasets
│   └── src/
│       ├── config/env.ts           # Zod validated runtime environment schema
│       ├── utils/                  # SSRF firewall, AES crypto, and URL normalizers
│       ├── plugins/                # Prisma, Redis, JWT, and WebSocket integrations
│       ├── services/               # Auth, Project, Verification, Scan, Endpoint, LoadTest
│       └── routes/                 # REST API route controllers
│
├── workers/
│   ├── discovery-worker/           # Asynchronous API reconnaissance worker
│   │   └── src/
│   │       ├── strategies/         # OpenAPI, Playwright, and JS Bundle parsers
│   │       ├── normalizer/         # Route path parameterizer and mutation detector
│   │       └── processor.ts        # BullMQ discovery job worker
│   │
│   └── loadtest-worker/            # Distributed k6 execution worker
│       └── src/
│           ├── k6/                 # Script synthesizer and k6 process executor
│           └── processor.ts        # BullMQ load test job handler & telemetry broadcaster
│
└── tests/                          # Automated test suites (SSRF, Crypto, Normalizers)
```

---

## 🛠️ Getting Started (Local Development)

### 1. Prerequisites
Ensure the following tools are installed on your workstation:
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10+
- **Docker & Docker Compose**: For containerized MongoDB and Redis services

### 2. Clone the Repository & Configure Environment
```bash
git clone https://github.com/SurajSwarnkar1001/apiforge.git
cd apiforge
cp .env.example .env
```

### 3. Install Monorepo Dependencies
```bash
npm install
```

### 4. Start MongoDB and Redis Containers
```bash
docker compose up -d mongodb redis
```

### 5. Generate Prisma ORM Client
```bash
cd backend
npx prisma generate
cd ..
```

### 6. Populate Database with Demo Data (Optional)
```bash
cd backend
npm run prisma:seed
cd ..
```
*Demo credentials: `admin@apiforge.dev` / `Admin@123456`*

### 7. Launch Development Servers
```bash
npm run dev
```

Once initialized, the services will be available at:
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway**: [http://localhost:4000](http://localhost:4000)
- **WebSocket Endpoint**: `ws://localhost:4000/ws/load-tests/:id`

---

## 🐳 Production Deployment with Docker Compose

To deploy the entire production stack (Frontend, Backend API, Discovery Worker, Load-Testing Worker, MongoDB, and Redis) using Docker Compose:

```bash
# Build and launch all 6 services in detached mode
docker compose up --build -d
```

### Horizontally Scaling Load Test Workers
To increase capacity for concurrent load tests across distributed nodes:
```bash
docker compose up --scale loadtest-worker=4 -d
```

### Service Port Allocations
- **Web Frontend (Nginx)**: `http://localhost:3000`
- **Backend API Server**: `http://localhost:4000`
- **MongoDB Database**: `localhost:27017`
- **Redis Instance**: `localhost:6379`

---

## 🚦 REST API & WebSocket Reference

### Authentication Endpoints
| HTTP Method | Route | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT bearer token | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |

### Project & Target Governance Endpoints
| HTTP Method | Route | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/projects` | List all registered projects for the active user | Yes |
| `POST` | `/api/projects` | Register a new target project (with SSRF validation) | Yes |
| `GET` | `/api/projects/:id` | Retrieve target project metadata and stats | Yes |
| `POST` | `/api/projects/:id/verify` | Submit domain verification challenge | Yes |

### Discovery & Endpoint Endpoints
| HTTP Method | Route | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/projects/:id/scan` | Dispatch asynchronous API discovery scan | Yes |
| `GET` | `/api/projects/:id/scan/:scanId` | Fetch status and real-time logs of a discovery job | Yes |
| `GET` | `/api/projects/:id/endpoints` | List all discovered API endpoints for a project | Yes |
| `GET` | `/api/endpoints/:id` | Retrieve detailed endpoint contract and schema | Yes |
| `POST` | `/api/endpoints/:id/execute` | Execute safe single-shot request via SSRF proxy | Yes |

### Load Testing & Telemetry Endpoints
| HTTP Method | Route | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/load-tests` | Dispatch a new k6 load test job to the queue | Yes |
| `GET` | `/api/load-tests` | List all historical load test executions | Yes |
| `GET` | `/api/load-tests/:id` | Get load test status, duration, and parameters | Yes |
| `POST` | `/api/load-tests/:id/stop` | Send instant abort signal to terminate running test | Yes |
| `GET` | `/api/load-tests/:id/metrics` | Retrieve time-series latency and throughput snapshots | Yes |
| `GET` | `/api/load-tests/:id/results` | Retrieve final test report, histograms, and thresholds | Yes |
| `GET` | `/api/audit-logs` | Retrieve immutable security and activity audit trail | Yes |
| `WS` | `/ws/load-tests/:id` | Real-time bidirectional WebSocket telemetry stream | — |

---

## 🧪 Automated Testing & Verification

Run the automated test suite to validate SSRF firewall behavior, AES encryption, and URL normalization:

```bash
# Execute unit and security test suites
cd backend
npx vitest run
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full license terms.

<div align="center">

---

**APIForge — Engineered with Precision for High-Performance Infrastructure and Engineering Teams.**

</div>
