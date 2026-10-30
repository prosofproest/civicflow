# CivicFlow — From Complaints to Action

> **An intelligent, explainable municipal issue resolution platform that transforms raw citizen grievance reports into verified, prioritized civic action.**

---

## 1. Project Introduction

**CivicFlow** is a modern civic engagement and municipal operations platform built for the **PromptWars × ASTRA Hackathon**. It bridges the gap between urban citizens reporting local infrastructure breakdowns and city departments triaging, assigning, and resolving those issues. 

Rather than relying on opaque black-box AI scores or static ticketing forms, CivicFlow combines **structured Groq LLM extraction** with a **deterministic, weighted 4-factor Priority Engine**, **token-based Jaccard duplicate detection**, and **spatial density clustering**. The result is a system where every priority score is mathematical, auditable, and grounded in a human-readable explanation.

---

## 2. The Civic Problem

Municipal grievance desks and 311 systems in rapidly urbanizing cities encounter chronic operational bottlenecks:
- **Triage Paralysis**: First-come, first-served queues bury life-threatening hazards (e.g., exposed live electrical wires, active gas leaks) beneath cosmetic complaints.
- **Duplicate Explosion**: High-visibility incidents (such as an arterial road water main burst) generate dozens of independent reports, overwhelming dispatchers with duplicate ticket noise.
- **Opacity & Distrust**: Citizens receive generic "Under Process" ticket notifications with zero visibility into why their complaint was prioritized or which department is accountable.
- **Disconnected Data Silos**: Public works, sanitation, electrical boards, and water authorities operate on fragmented systems without unified geographic correlation.

---

## 3. Our Solution

CivicFlow structures civic complaint management into an end-to-end explainable pipeline:
1. **Intelligent Multimodal Capture**: Citizens file reports via mobile-first interfaces with GPS location detection and optional photo evidence.
2. **Deterministic AI Assistance**: Groq LLMs extract structured factor inputs and categorize issues, but **never directly decide the final priority level**.
3. **Mathematical Priority Scoring**: A deterministic engine scores complaints across Public Safety (35%), Response Urgency (25%), Community Impact (25%), and Related Reports (15%), fortified by a **Safety Keyword Floor** that guarantees critical hazards are never downranked.
4. **Spatial Correlation Without Deletion**: Token-based Jaccard similarity and Haversine distance detect duplicates within 150 metres and 30 days, linking duplicate tickets as references while strictly preserving every citizen's original report.
5. **Zero-Cred Graceful Fallback**: The entire architecture runs out-of-the-box in local demo mode with 45 realistic synthetic records, operating smoothly with or without live cloud API keys.

---

## 4. The Four Mandatory Stages

CivicFlow centers around four core lifecycle stages:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   1. CAPTURE    │ ────> │  2. UNDERSTAND  │ ────> │    3. REVEAL    │ ────> │     4. ACT      │
│  Citizen Intake │       │  AI & Engines   │       │  Transparency   │       │  Resolution     │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
 • GPS Geolocation         • Groq Categorization     • Explainable Scores      • Tiered RBAC
 • Multimodal Photo        • Jaccard Similarity      • Duplicate Alerts        • Dept Dispatch
 • Strict Input Limits     • Haversine Clustering    • Hotspot Detection       • SLA Progression
 • Unique Reference        • Safety Floor Rule       • Audit Log Records       • Status Updates
```

1. **Capture**: Citizen report intake with multimodal context (description text, image upload via Cloudinary, precise geolocation coordinates, category selection).
2. **Understand**: Processing pipeline combining Groq LLM extraction, deterministic 4-factor priority calculation, spatial duplicate detection, and geographic density clustering.
3. **Reveal**: Administrative visibility and public transparency through explainable factor contributions, duplicate reference warnings, and cluster tracking.
4. **Act**: Departmental assignment, transparent status progression (`submitted` → `under_review` → `assigned` → `in_progress` → `resolved`), and citizen notification.

---

## 5. Key Implemented Features

- **Authentication & RBAC**: Real Firebase Authentication (Email/Password & Google OAuth) with secure server-side Firebase Admin verification, `HttpOnly` `SameSite=Lax` session cookies, and strict role enforcement (`citizen`, `officer`, `admin`).
- **Deterministic Priority Engine**: 4-factor scoring model normalized to $0\text{–}100$ with defined thresholds (Critical $\ge 75$, High $\ge 55$, Medium $\ge 35$, Low $< 35$).
- **Safety Keyword Floor Rule**: Automatically detects 20+ immediate public hazards (`live wire`, `gas leak`, `sinkhole`, `open manhole`, etc.), elevating safety input to $\ge 85$ and guaranteeing a minimum Critical score floor ($\ge 75$).
- **Duplicate Detection**: Token-based Jaccard similarity combined with Haversine distance ($0.6 \times \text{TextSim} + 0.4 \times \text{ProxScore}$) flagging candidates at confidence $\ge 0.60$ within 150m and 30 days.
- **Geographic Hotspot Clustering**: Density clustering identifying spatial concentrations of $\ge 3$ reports within a 250m radius, computing geographic centroids and bounding radii.
- **Groq AI with Circuit Breaker**: Structured JSON categorization and summary generation via Groq `llama-3.3-70b-versatile` with an 8-second circuit breaker and instant deterministic rule-based fallback.
- **Citizen Portal**: Complete submission workflow (`/citizen/submit`) with real-time hazard detection notices and ticket history tracking (`/citizen/complaints`).
- **Synthetic Demonstration Suite**: 45 realistically modeled civic complaints situated in the fictional Astra Municipal District, including 4 urgent hazards, 3 duplicate groups, and a 7-report transit hotspot.

---

## 6. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) | Server components, edge route middleware, optimized production builds |
| **Language** | TypeScript 5 (Strict Mode) | End-to-end typed contracts across models, inputs, and database schemas |
| **Styling** | Tailwind CSS v4 | Lightweight utility tokens, consistent municipal design system |
| **Client Auth** | Firebase Authentication SDK v13 | Email/password credentials and Google OAuth popups |
| **Server Auth** | Firebase Admin SDK v14 | Cryptographic ID token and session cookie verification |
| **Database** | Google Cloud Firestore | Structured persistence for user profiles and complaint records |
| **LLM Inference** | Groq API (`llama-3.3-70b-versatile`) | Fast JSON inference for extraction and operational summarization |
| **Image CDN** | Cloudinary (Optional) | Secure server-signed client-side uploads (no Firebase Storage) |
| **Validation** | Zod v4 | Runtime schema validation for all API routes, query params, and forms |
| **Testing** | Node.js Test Runner & TSX | Native test execution with zero external test runner dependencies |

---

## 7. System Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            Browser Client              │
                      │  Next.js 16 Pages & React Context      │
                      └───────────────────┬────────────────────┘
                                          │
                        REST API Requests │ HttpOnly Session Cookie
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Next.js Server Runtime                            │
│                                                                              │
│   ┌────────────────────┐   Session Check    ┌────────────────────────────┐   │
│   │ Edge Middleware    │ ─────────────────> │ src/lib/auth/server-session│   │
│   └────────────────────┘                    └──────────────┬─────────────┘   │
│                                                            │ UID / Role      │
│   ┌────────────────────────────────────────────────────────▼─────────────┐   │
│   │                     Complaint Ingestion Pipeline                     │   │
│   │                    (src/lib/services/complaints.ts)                  │   │
│   └───────┬────────────────────────┬─────────────────────────┬───────────┘   │
│           │ 1. Text Analysis       │ 2. Proximity & Text     │ 3. Score      │
│           ▼                        ▼                         ▼               │
│   ┌───────────────┐        ┌───────────────┐        ┌────────────────┐       │
│   │  Groq LLM     │        │  Duplicate    │        │ Priority       │       │
│   │  (Failover to │        │  Engine       │        │ Engine         │       │
│   │  Rules)       │        │  (Jaccard +   │        │ (4 Factors +   │       │
│   │               │        │   Haversine)  │        │  Safety Floor) │       │
│   └───────────────┘        └───────────────┘        └────────────────┘       │
│                                                              │               │
│                            ┌─────────────────────────────────┘               │
│                            ▼                                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐   │
│   │ Persistence Layer: Firestore Collection `complaints` / Local Fallback │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Project Folder Structure

```
civicflow/
├── docs/
│   ├── FIREBASE_SETUP.md          # Complete guide to provisioning Firebase & Admin credentials
│   └── PROJECT_RULES.md           # Engineering guidelines, zero-emoji policy, theme rules
├── firestore.rules                # Least-privilege Firestore security rules
├── public/                        # Static assets, logos, and robots.txt
├── scripts/
│   └── seed.ts                    # CLI script for seeding 45 synthetic demo records
├── src/
│   ├── app/
│   │   ├── admin/page.tsx         # Municipal Admin Console (Phase 1)
│   │   ├── api/
│   │   │   ├── auth/              # Session issuance, profile lookup, logout
│   │   │   ├── complaints/        # Citizen complaint submission & query API
│   │   │   ├── engine/            # Dedicated priority, duplicate, and hotspot APIs
│   │   │   ├── seed/              # Endpoint to seed synthetic demo records
│   │   │   └── upload/signature/  # Cloudinary upload signature generator
│   │   ├── citizen/
│   │   │   ├── complaints/        # Citizen ticket history & factor details
│   │   │   ├── submit/            # Multimodal citizen complaint intake form
│   │   │   └── page.tsx           # Citizen workspace welcome desk
│   │   ├── design/page.tsx        # Design system token showcase
│   │   ├── forgot-password/       # Password recovery flow
│   │   ├── login/page.tsx         # Sign-in form (Email/Password & Google)
│   │   ├── officer/page.tsx       # Field Officer Desk (Phase 1)
│   │   ├── register/page.tsx      # Citizen registration form
│   │   ├── layout.tsx             # Root layout with AuthProvider
│   │   └── page.tsx               # Homepage and mission overview
│   ├── components/ui/             # Button, Card, Input, Badge, PageShell
│   ├── lib/
│   │   ├── ai/groq.ts             # Groq LLM client and deterministic fallback
│   │   ├── auth/                  # AuthContext provider and server session helper
│   │   ├── cloudinary/server.ts   # Cloudinary HMAC signature generator
│   │   ├── constants.ts           # Categories, weights, thresholds, status transitions
│   │   ├── data/mock-complaints.ts# 45 realistic synthetic demonstration complaints
│   │   ├── engine/                # Priority, duplicate, and hotspot algorithms
│   │   ├── firebase/              # Client SDK and Admin SDK initializers
│   │   ├── services/complaints.ts # Core complaint processing lifecycle pipeline
│   │   └── validation/            # Zod schemas for auth, engine, and complaints
│   ├── middleware.ts              # Route protection and role redirect proxy
│   └── types/index.ts             # Strict domain types (Complaint, User, Priority, etc.)
└── tests/
    ├── ai.test.ts                 # AI extraction and failover test cases
    ├── complaint.test.ts          # Pipeline, synthetic data quality, reporter filter
    ├── duplicate.test.ts          # Jaccard text similarity and Haversine distance tests
    ├── hotspot.test.ts            # 250m threshold, minimum 3 reports, centroid tests
    ├── priority.test.ts           # Weights, thresholds, and safety floor tests
    └── validation.test.ts         # Zod boundary and invalid input tests
```

---

## 9. Core Engine Algorithms

### A. Deterministic Priority Engine
The priority engine computes an auditable score between $0$ and $100$:

$$\text{Final Score} = \text{round}\Big(0.35 \times \text{Safety} + 0.25 \times \text{Urgency} + 0.25 \times \text{Impact} + 0.15 \times \text{Related}\Big)$$

- **Public Safety ($35\%$)**: Direct threat to human life, bodily harm, or structural safety.
- **Response Urgency ($25\%$)**: Time sensitivity of the breakdown (e.g., active water leak vs. faded paint).
- **Community Impact ($25\%$)**: Pedestrian volume, proximity to hospitals/schools, and transit disruption.
- **Related Reports ($15\%$)**: Independent confirmations from other citizens ($25$ pts per report, max $100$).

#### The Safety Keyword Floor Rule
To prevent administrative downranking of critical emergencies when community impact or related report counts are initially zero, CivicFlow scans complaint descriptions for 20+ hazard keywords (`live wire`, `gas leak`, `chemical spill`, `sinkhole`, `building collapse`, `open manhole`, `transformer explosion`, etc.).
- **Floor Triggered**: Safety factor input is automatically floored at a minimum of **85/100**.
- **Score Guaranteed**: Final priority score cannot fall below **75/100 (Critical)**.
- **Explainability**: The exact keyword matched and floor adjustment are explicitly recorded in the human-readable explanation.

### B. Duplicate Detection
CivicFlow identifies duplicate reports using a combination of lexical and spatial proximity:
- **Lexical Overlap**: Token-based Jaccard similarity:
  $$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
- **Geographic Proximity**: Haversine great-circle distance:
  $$\text{Proximity Score} = \max\left(0, 1 - \frac{\text{Distance in meters}}{150}\right)$$
- **Combined Confidence**:
  $$\text{Confidence} = 0.6 \times \text{Text Similarity} + 0.4 \times \text{Proximity Score}$$
- **Threshold**: Flagged when $\text{Confidence} \ge 0.60$ for unresolved complaints created within 30 days.
- **Preservation Policy**: Complaints are **never automatically merged or deleted**. Each citizen's original report is preserved with its unique timestamp and reporter attribution.

### C. Geographic Hotspot Clustering
- Evaluates pairwise Haversine distances across reports.
- Discovers connected spatial density components within a **250-metre radius**.
- Discards clusters with fewer than **3 reports**.
- Calculates the geographic centroid (arithmetic mean latitude and longitude) and maximum bounding radius.
- Ranks clusters descending by report count to direct municipal deployment squads.

---

## 10. Setup and Installation

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (Node 22 recommended).
- **npm**: `v10.x` or higher.
- **Git**

### Installation
Clone the repository and install project dependencies:
```bash
git clone https://github.com/prosofproest/civicflow.git
cd civicflow
npm install
```

---

## 11. Environment Variables Reference

Create a local environment file named `.env.local` in the project root based on `.env.example`:
```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Optional | Firebase client Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Optional | Firebase Auth domain (e.g., `project-id.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Optional | Firebase project identifier |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Optional | Firebase client Application ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Optional | Firebase Admin service account project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Optional | Firebase Admin service account client email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Optional | Firebase Admin RSA private key with `\n` newlines |
| `GROQ_API_KEY` | Optional | Groq Cloud API key for fast LLM inference |
| `GROQ_MODEL` | Optional | Model identifier (defaults to `llama-3.3-70b-versatile`) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for citizen photo uploads |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret for server-side upload signing |

> **Graceful Zero-Cred Mode**: If cloud environment variables are omitted, CivicFlow automatically runs in **Local Demo Mode**:
> - Authentication provides a local authenticated session for the demo citizen.
> - AI analysis transparently executes via the deterministic rule-based fallback engine.
> - Complaints persist in the in-memory demo store and load the 45 synthetic demonstration records.
> - Image uploads safely allow text-only complaint submission with clear UI status banners.

---

## 12. Cloud Integrations Setup Guides

### A. Firebase Setup
Detailed step-by-step instructions for creating a Firebase project, enabling Email/Password and Google sign-in, configuring Firestore, and generating service account private keys are documented in [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md).

### B. Groq AI Setup
1. Sign up at [console.groq.com](https://console.groq.com) and create an API key.
2. Add the key to `.env.local`:
   ```bash
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
3. If Groq encounters rate limits, timeouts, or is unconfigured, CivicFlow automatically activates its deterministic fallback without disrupting user workflows.

### C. Cloudinary Setup (Optional)
1. Sign up for a free Cloudinary account at [cloudinary.com](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Add the values to `.env.local`:
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. CivicFlow generates cryptographic upload signatures server-side so your API secret is never exposed to browser clients.

---

## 13. Running Locally & Testing

### Development Server
Start the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seeding Synthetic Demo Data
Initialize the 45 realistic demonstration records via the CLI seeder:
```bash
npm run seed
```
Or trigger the seed endpoint directly:
```bash
curl -X POST http://localhost:3000/api/seed
```

### Running Test Suite
Execute the 28 unit tests covering Priority, Duplicate Detection, Hotspots, AI Fallback, and Validation:
```bash
npm test
```

### Linting & Production Build
Verify code quality and compile the Turbopack production build:
```bash
npm run lint
npm run build
```

---

## 14. Security & Privacy Practices

- **Zero Trust Role Authorization**: User roles (`citizen`, `officer`, `admin`) are stored strictly in protected server-side records. Role checks in the browser UI are treated solely as presentation hints; all mutation and read endpoints enforce roles server-side.
- **HttpOnly Cookies**: Session tokens are held in `HttpOnly`, `SameSite=Lax` cookies, neutralizing cross-site scripting (XSS) token theft.
- **Least-Privilege Firestore Rules**: Direct client writes to the `users` and `complaints` collections are rejected in `firestore.rules`.
- **Reporter Attribution Security**: The complaint submission endpoint strictly derives `reporterUid` from the verified session cookie, ignoring any user ID supplied in the request body to prevent spoofing.
- **Citizen Privacy Isolation**: `/citizen/complaints` and `GET /api/complaints` strictly enforce `reporterUid == session.uid` for citizens, ensuring citizens can never inspect tickets filed by others.
- **Zero Secrets in Version Control**: `.env.local`, service account JSON files, and private keys are excluded via `.gitignore`.

---

## 15. Current Limitations & Future Scope

| Area | Current Implementation (Phases 0–5) | Planned Evolution |
| :--- | :--- | :--- |
| **Maps & Spatial Views** | Exact coordinate capture, Haversine proximity calculations, and API centroid returns | Interactive Mapbox/Leaflet spatial choropleth map in the Reveal stage (Phase 6) |
| **Department Triage** | Categorical routing and automated action brief generation | Live Officer dispatch queue with SLA timers and transition audit logs (Phase 7) |
| **Multimodal Vision** | Secure Cloudinary photo uploads and image storage | Direct visual defect extraction via Groq Vision API |
| **Citizen Notifications** | In-app ticket tracking and status indicators | Automated SMS and email notifications upon status progression |

---

## 16. Hackathon Context & Acknowledgements

CivicFlow was developed for the **PromptWars × ASTRA Hackathon** to demonstrate how modern agentic engineering, transparent AI pipelines, and mathematical rigor can resolve real-world municipal infrastructure failures.

- **Source of Truth**: Official PromptWars × ASTRA Problem Statement.
- **Design Philosophy**: Built with strict adherence to light municipal design tokens, zero emojis, full accessibility, and complete algorithmic transparency.
