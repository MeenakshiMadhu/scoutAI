// scripts/embed.mjs — run locally ONCE, never on Vercel
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const jobs = JSON.parse(fs.readFileSync("jobs.json", "utf8"));

// Text we embed — keep IDENTICAL in shape to how we embed the resume later
function jobText(j) {
  return (
    `${j.title}. Field: ${j.role_family}. Seniority: ${j.seniority}. ` +
    `Skills: ${j.skills.join(", ")}. ${j.description.slice(0, 600)}`
  );
}

const out = [];
const BATCH = 100;
for (let i = 0; i < jobs.length; i += BATCH) {
  const slice = jobs.slice(i, i + BATCH);
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: slice.map(jobText),
  });
  slice.forEach((j, k) => out.push({ ...j, embedding: res.data[k].embedding }));
  console.log(`embedded ${Math.min(i + BATCH, jobs.length)}/${jobs.length}`);
}

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/jobs-embedded.json", JSON.stringify(out));
console.log("done — wrote src/data/jobs-embedded.json");
