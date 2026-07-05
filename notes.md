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
