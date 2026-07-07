# scoutAI

scoutAI is an AI-powered career search platform that lets users browse ~1,500 synthetic job postings, filter and search them, and upload a PDF resume to unlock personalized top-20 matches with match scores, skill-keyword highlights, and LLM-generated fit insights.

Built as a full-stack **Next.js** app deployed on **Vercel**, with **OpenAI** for embeddings and structured LLM features — no separate database or vector service for the demo.

---

## Tech Stack

| Layer              | Choice                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Frontend**       | Next.js 16 (App Router), React 19, Tailwind CSS 4                                      |
| **Backend**        | Next.js API routes (`src/app/api/`)                                                    |
| **Hosting**        | Vercel (serverless)                                                                    |
| **Job data**       | PostgreSQL + **pgvector** (Neon-compatible); ~1,500 jobs with precomputed embeddings |
| **DB driver**      | `@neondatabase/serverless` (Vercel-friendly pooled Postgres)                       |
| **Embeddings**     | OpenAI `text-embedding-3-small` (1536-dim, shared space for jobs + resumes)            |
| **LLM**            | OpenAI `gpt-4o-mini` (resume parsing, match insights, skill keywords)                  |
| **PDF parsing**    | `pdfreader`                                                                            |
| **Insights cache** | In-memory session cache (`src/lib/insightsCache.ts`)                                   |

---

## Architecture

![Architecture diagram](docs/architecture_diagram.png)

<details>
<summary>Mermaid source</summary>

```mermaid
%%{init: {'flowchart': {'curve': 'linear'}}}%%
flowchart TB
  subgraph TOP[" "]
    direction LR
    subgraph FE["Frontend Layer · Next.js"]
      direction LR
      FE1["Job Search & Browse\npage.tsx · JobCard"]
      FE2["Resume Upload\nResumeUpload.tsx"]
      FE3["Job Detail & Insights\nJobDetail · insightsCache"]
    end

    subgraph API["API Routes · Vercel"]
      direction LR
      API1["GET /api/jobs"]
      API2["POST /api/upload"]
      API3["POST /api/match"]
      API4["POST /api/insights"]
    end

    subgraph SVC["Server Logic · src/lib"]
      direction LR
      S1["Browse & filter\njobBrowse · store"]
      S2["PDF extract + profile\nllmResume · pdfreader"]
      S3["YOE filter · cosine · top 20\nmatchFilters · matchScore"]
      S4["Fit insights + skills\nmatchInsights · skillMatchVerify"]
    end

    subgraph AI["AI Services · OpenAI"]
      direction LR
      EMB["text-embedding-3-small\njob + resume vectors"]
      LLM["gpt-4o-mini\nparse · insights"]
    end
  end

  subgraph DS["Data Store"]
    direction LR
    GEN["generate_jobs.py"] --> RAW["jobs.json"] --> SCR["embed.ts"]
    STORE[("PostgreSQL + pgvector\n~1,500 jobs")]
  end

  FE1 --> API1
  FE1 --> API3
  FE2 --> API2
  FE3 --> API4

  API1 --> S1
  API2 --> S2
  API3 --> S3
  API4 --> S4

  S1 --> STORE
  S2 --> EMB
  S2 --> LLM
  S3 --> STORE
  S4 --> LLM
  S4 --> STORE

  EMB -.->|embed offline| SCR
  SCR -.->|load at startup| STORE

  TOP ~~~ DS

  style TOP fill:transparent,stroke:transparent
```

</details>

Source: [`docs/architecture.mmd`](docs/architecture.mmd)

---

## Data Flow

### Browse all jobs

![Browse data flow](docs/data-flow-browse.png)

<details>
<summary>Mermaid source</summary>

```mermaid
flowchart TB
  subgraph SETUP["One-time setup"]
    direction LR
    S1["generate_jobs.py"] --> S2["jobs.json"] --> S3["embed.ts"] --> S4["PostgreSQL"]
  end

  subgraph BROWSE["Browse all jobs"]
    direction TB
    U1["User sets filters & search"]
    U2["GET /api/jobs"]
    U3["Filter · sort · paginate"]
    U4["Job cards"]
    U1 --> U2 --> U3 --> U4
  end

  S4 -.->|loads at startup| U2
```

</details>

Source: [`docs/data-flow-browse.mmd`](docs/data-flow-browse.mmd)

### Resume upload & match

![Resume match data flow](docs/data-flow-resume.png)

<details>
<summary>Mermaid source</summary>

```mermaid
flowchart TB
  subgraph UPLOAD["1 · Resume upload"]
    direction LR
    R1["PDF"] --> R2["pdfreader"] --> R3["gpt-4o-mini\nprofile"] --> R4["embed resume"] --> R5["profile + vector"]
  end

  subgraph MATCH["2 · Match top 20"]
    direction LR
    M1["YOE filter"] --> M2["Seniority filter"] --> M3["Cosine similarity"] --> M4["Top 20 + match %"]
  end

  subgraph REFINE["3 · Refine in browser"]
    direction LR
    F1["Filter & sort"] --> F2["Paginate results"]
  end

  subgraph DETAIL["4 · Job detail"]
    direction TB
    D1["Open role"]
    D2{"Cached?"}
    D3["Show insights"]
    D4["POST /api/insights"]
    D5["LLM + skill verify"]
    D1 --> D2
    D2 -->|yes| D3
    D2 -->|no| D4 --> D5 --> D3
  end

  R5 --> M1
  M4 --> F1
  F2 --> D1
```

</details>

Source: [`docs/data-flow-resume.mmd`](docs/data-flow-resume.mmd)

### API routes

| Endpoint             | File                            | Purpose                                   |
| -------------------- | ------------------------------- | ----------------------------------------- |
| `GET /api/jobs`      | `src/app/api/jobs/route.ts`     | Browse: filter, search, sort, paginate    |
| `POST /api/upload`   | `src/app/api/upload/route.ts`   | PDF → LLM profile + resume embedding      |
| `POST /api/match`    | `src/app/api/match/route.ts`    | Hard filters → cosine → top 20            |
| `POST /api/insights` | `src/app/api/insights/route.ts` | LLM insights + skill keywords for one job |

---

## User Interface

_Add screenshots to `docs/` and uncomment the lines below._

#### Landing page — browse jobs with search and filters

<!-- ![Landing page](docs/landing.png) -->

#### Resume upload and AI matching

<!-- ![Resume upload](docs/resume-upload.png) -->

#### Top 20 matches with match score and filters

<!-- ![Match results](docs/match-results.png) -->

#### Job detail — skills, match %, AI insights

<!-- ![Job detail](docs/job-detail.png) -->

---

## Matching Approach

scoutAI uses a **hybrid matcher**, not pure keyword search or pure LLM ranking.

1. **Hard filters** (`matchFilters.ts`): years of experience (±1 year buffer from JD text) and seniority (±1 level).
2. **Semantic rank**: cosine similarity between resume embedding and each surviving job embedding.
3. **Top 20**: fixed cap for focused results (`MAX_MATCH_RESULTS = 20`).
4. **Match %**: scores are normalized **within the top-20 batch** to a 62–95% display range (relative rank, not absolute probability).
5. **Post-match filters**: user filters/sorts apply **client-side only** within the top 20.

---

## LLM & Embeddings (not classic RAG)

| Feature             | Model                    | Approach                                                                |
| ------------------- | ------------------------ | ----------------------------------------------------------------------- |
| Resume parsing      | `gpt-4o-mini`            | Structured JSON extraction from PDF text                                |
| Job/resume matching | `text-embedding-3-small` | Vector similarity over pre-embedded jobs                                |
| Insights + keywords | `gpt-4o-mini`            | Full job description + profile in prompt; server verifies skill matches |

This is **not RAG** in the retrieval sense for insights — the LLM receives the job and profile directly. Matching uses **precomputed embeddings** stored in PostgreSQL (pgvector); at ~1.5K jobs the API still applies YOE/seniority filters in app code then cosine-scores the survivor pool.

---

## Why This Stack?

- **Next.js on Vercel**: single repo for UI + API, fast deploy, no ops for the demo.
- **OpenAI embeddings** (vs local MiniLM): Vercel serverless cannot run ONNX/native transformer runtimes reliably; OpenAI keeps jobs and resumes in one vector space with zero extra infra.
- **PostgreSQL + pgvector**: job catalog and vectors in one store; removes the large embedded JSON from the deployment bundle; HNSW index ready as the catalog grows.
- **Top 20 + client-side refine**: keeps match latency predictable and lets users narrow AI results without re-scoring the full catalog.

---

## Getting Started

```bash
cd scoutAI
npm install
```

Copy `.env.example` to `.env.local` and set:

- `OPENAI_API_KEY`
- `DATABASE_URL` — PostgreSQL with the **pgvector** extension ([Neon](https://neon.tech) works well on Vercel)

### Database setup

```bash
# Create tables + pgvector indexes
npm run db:migrate

# Option A — import existing local embeddings (fast)
npm run db:seed

# Option B — re-embed from jobs.json into the DB
npm run embed:jobs
```

`embed:jobs` reads `src/data/jobs.json`, calls OpenAI, and upserts into PostgreSQL. Re-run after editing the job corpus or changing embedding models.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Future Scope

- **Live job API ingestion**: cron/workers to ingest external postings into the same Postgres schema.
- **Vector search at scale**: pgvector, Pinecone, or OpenSearch for millions of jobs (ANN instead of full cosine scan).
- **External apply links**: wire the **View job** CTA to employer ATS URLs.
- **Persistent insights cache**: Redis or DB for multi-instance serverless.
- **Resume dedup**: hash uploaded PDFs to skip re-parsing identical files.

---

## Notes

- Synthetic jobs generated via `generate_jobs.py` in the repo root.
- Embedding script: `scripts/embed.ts` → upserts into PostgreSQL. One-time import from legacy JSON: `npm run db:seed`.
- Insights cache is **lazy** — only jobs opened in the detail panel are cached; cleared on new resume upload or “Browse all jobs”.
- Assignment context: demo architecture targets ~1.5K jobs today; notes in `notes.md` outline pgvector/ANN for production scale.
