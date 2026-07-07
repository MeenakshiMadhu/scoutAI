# scoutAI — Build Notes

## Thursday, July 2 2026

**Planning**

- Explored tech stack, hosting, and overall flow.
- Decided on the stack:
  - Frontend: Next.js + Tailwind, deployed to Vercel
  - Backend: Next.js API routes
  - Embeddings: OpenAI `text-embedding-3-small` (good for a small demo dataset)
  - Vector store: in-memory / SQLite for the demo; pgvector or an ANN index for production
  - Resume parsing: extract text from PDF, send to LLM -> `{ role_family, seniority, skills[], years }`
  - Synthetic job data generated via LLM
- Worked through the scaling and matching approach.
- Worked out how synthetic data gets generated, embedded, and stored.
- Identified the two flows:
  - Data ingestion flow (offline, one-time)
  - Main flow (runs per user request)

**Done**

- Created the repo and named the project.
- Generated the synthetic dataset (1500 jobs).

## Friday, July 3 2026

- Built the empty Next.js app and set up Vercel deployment to get the production pipeline running.
- Set up the frontend job list display.
- Added filter, sort, search, and pagination.
- added resume upload section
- updated UI
- fine-tuned the filter functionality to checkboxes (multiple filters), and search to consider JD (but weigh less than title & other filters)

## Saturday, July 4 2026

- Added embedding script and logic using Xenova/all-MiniLM-L6-v2 (local, via @xenova/transformers)
- Ran embedding script on synthetic job data and stored as jobs-embedded.json
- Added Resume pdf parsing logic using pdfreader, and resumeProfile.ts for building resume profile ready to embed
- Added embedding logic for resume using same `all-MiniLM-L6-v2 model`
- Ran into issue with pdf parsing

## Sunday, July 5 2026

- Todo:

  - Fix the resume pdf parsing pipeline
  - Improve the matching logic

- Added LLM (OpenAI API) for resume text parsing. This fixed issues with messy and varied resume formats in matching jobs.
- Improved matching logic to hybrid: Hard filter on years of experience with +/-1 year buffer + Cosine similarity
- Limited AI resume matching results to Top 20 roles.
- Tested with resumes from different tiers and fields.
- Major change: Changed embedding model from MiniLM to OpenAI `text-embedding-3-small`.
  - Reason: MiniLM ran locally in development, but ONNX's native runtime isn't available on Vercel's serverless functions, so the deployed version uses OpenAI embeddings for both jobs and resumes to keep a single, consistent vector space with zero extra infrastructure.
- Fixed detailed view closing bug
- Added seniority filter, and filtering on Top 20 AI matched jobs.
- Added AI job match insights and match score
- updated UI

## Monday, July 6 2026

**UI / UX**

- New color theme: navy `#182335`, coral `#E15546`, peach `#EEAF9D`, beige `#EAE4CC`; job cards stay white.
- Job card hover: subtle shadow only (removed top accent line).
- Center-aligned header and main layout; kept filter/search row left-aligned with sort on the right.
- Added `MatchLoadingPanel` for upload, match, and browse loading states (rotating phrases).
- Match score moved into top-right of “Top skills & keywords” box in detail panel.
- Full-width coral “View job” button in detail panel only (placeholder — external apply coming soon).

**Insights**

- Wired `insightsCache.ts` into `JobDetail` — lazy cache per job + profile; cleared on new upload / clear match.
- Deterministic JD keyword extraction + `skillMatchVerify` so LLM skill flags are grounded in resume text.

**Docs / diagrams**

- README updated.
- Architecture diagram in draw.io (`docs/scoutAI-architecture.drawio`).
- Data flow split into two diagrams: browse vs resume upload/match (`docs/data-flow-browse`, `docs/data-flow-resume`).
- Updated data flow diagrams for Postgres (query per request, not load at startup).

**Bugs**

- Clear all filters and search when user uploads a resume (was incorrectly applying prior browse filters to top-20 pool).

**Database — PostgreSQL + pgvector**

- Replaced in-memory `jobs-embedded.json` at runtime with **Neon PostgreSQL + pgvector**.
- Added:
  - `db/schema.sql` — jobs table, filter indexes, HNSW vector index
  - `src/lib/db.ts` — `@neondatabase/serverless` client
  - `src/lib/jobsDb.ts` — fetch/upsert helpers
  - `scripts/db-migrate.ts`, `scripts/db-seed.ts`
- Updated `scripts/embed.ts` to upsert embedded jobs into Postgres (still reads `src/data/jobs.json`).
- API routes (`/api/jobs`, `/api/match`, `/api/insights`) query DB instead of importing JSON.
- Browse responses strip embeddings via `toPublicJob()`.
- Env: `DATABASE_URL` required alongside `OPENAI_API_KEY`.

**Setup commands**

```bash
npm run db:migrate    # apply schema
npm run db:seed       # import existing jobs-embedded.json
# or
npm run embed:jobs    # re-embed from jobs.json into DB
```

**Decisions / notes**

- Insights: direct LLM (job + profile in prompt), not RAG — context is small and already known for one job.
- Matching: vector similarity + hard filters; pgvector HNSW ready as catalog grows.
- `jobsDb` / `db.ts` = app code that talks to the pgvector table; not a separate store.

---

## Current stack (quick reference)

| Piece          | Choice                                                              |
| -------------- | ------------------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, Tailwind 4                                    |
| Hosting        | Vercel                                                              |
| Job store      | Neon PostgreSQL + pgvector (~1,500 jobs)                            |
| Embeddings     | OpenAI `text-embedding-3-small`                                     |
| LLM            | OpenAI `gpt-4o-mini` (resume parse, insights, skill keywords)       |
| Match          | YOE + seniority hard filters → cosine → top 20 → client-side refine |
| Insights cache | In-browser session (`insightsCache.ts`)                             |

<!-- ## Todo / future

- [ ] README screenshots (`docs/landing.png`, etc.)
- [ ] External apply link on “View job”
- [ ] Persistent insights cache (Redis/DB) for multi-instance serverless
- [ ] Push more filter/sort into SQL as job count grows; use pgvector ANN for match at scale
- [ ] Live job ingestion pipeline (replace synthetic data) -->
