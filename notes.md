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
