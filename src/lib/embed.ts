import OpenAI from "openai";
import { EMBEDDING_MODEL } from "@/lib/embedConfig";

let _client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Add it to .env.local or Vercel environment variables."
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

/** Embed text with the same model used for jobs (text-embedding-3-small). */
export async function embedText(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
