// scripts/embed.mjs — run locally ONCE, never on Vercel
import fs from "fs";
import { pipeline } from "@xenova/transformers";

const jobs = JSON.parse(fs.readFileSync("src/data/jobs.json", "utf8"));
const embed = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

// IMPORTANT: this text shape must match how the resume is embedded (see upload route)
function jobText(j) {
  return (
    `${j.title}. Field: ${j.role_family}. Seniority: ${j.seniority}. ` +
    `Skills: ${j.skills.join(", ")}. ${j.description.slice(0, 600)}`
  );
}

const out = [];
for (let i = 0; i < jobs.length; i++) {
  const res = await embed(jobText(jobs[i]), {
    pooling: "mean",
    normalize: true,
  });
  out.push({ ...jobs[i], embedding: Array.from(res.data) });
  if (i % 100 === 0) console.log(`embedded ${i}/${jobs.length}`);
}

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/jobs-embedded.json", JSON.stringify(out));
console.log(`done — ${out.length} jobs embedded`);
