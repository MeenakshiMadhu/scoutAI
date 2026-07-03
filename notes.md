### Thursday, July 2 2026
 - Going through ideas for tech stack, hosting, overall flow, etc.
 - FE: Next.js, Tailwind, deploy to Vercel
   BE: Next.js API routes
   Embeddings: OpenAI text-embedding-3-small, good for smaller databases for the demo
   Vector store: in-memory? SQLite (for production level: pgvector/ANN index)
   Resume parsing: Extract text from pdf and send to LLM -> {role_family, seniority, skills[], years}
   Generate synthetic data using LLM
 - Figuring out how to deal with scaling and matching.
 - How synthetic data can be generated, embedded, and stored
 - Created the repo, named the project
 - figured out the 2 flows -> Data Ingestion flow, Main flow(runs per user request)

 - Generated synthetic data

### Friday, July 3 2026
 - Built the empty Next.js app and set up deployment on Vercel to get the production pipeline running.
